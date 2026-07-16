import { useEffect, useState } from "react";
import { apiDashboardValuation } from "../pitchmateApi";
import { CoinsIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";

const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B+"];

// Map the profile's lifecycle_stage onto a valuation funding stage.
const STAGE_FROM_LIFECYCLE = {
    idea: "Pre-Seed", validating: "Pre-Seed", building: "Pre-Seed", pre_revenue: "Pre-Seed",
    revenue: "Seed", raising: "Seed", angel_backed: "Seed", seed_closed: "Series A",
    series_a_plus: "Series B+",
};

export default function ValuationPage() {
    const { profile, saved, loadingSaved, reportRun } = useAnalysisModule("valuation");
    const [form, setForm] = useState({
        stage: "Seed", sector: "", arr: "", growth_rate_yoy: "",
        team_strength: 3, traction_strength: 3,
    });
    const [result, setResult] = useState(null);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);

    // Hydrate once saved analysis has loaded: saved inputs win, else profile defaults.
    useEffect(() => {
        if (loadingSaved || hydrated) return;
        const defaults = {
            sector: profile?.industry || "",
            stage: STAGE_FROM_LIFECYCLE[profile?.lifecycle_stage] || "Seed",
        };
        setForm((f) => ({ ...f, ...defaults, ...(saved?.inputs || {}) }));
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        setHydrated(true);
    }, [loadingSaved, saved, profile, hydrated]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const canSubmit = form.sector.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardValuation(form);
            setResult(data);
            setLastRun(new Date().toISOString());
            reportRun(data, form);
        } catch (err) {
            setError(err.message || "Valuation estimate failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Valuation Advisor</h2>
                <p>Get a defensible pre-money valuation range and negotiation guidance.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your startup</h3>
                    <div className="dash-row">
                        <div className="dash-field">
                            <label>Funding stage</label>
                            <select className="dash-select" value={form.stage} onChange={(e) => update("stage", e.target.value)}>
                                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="dash-field">
                            <label>Sector</label>
                            <input className="dash-input" placeholder="B2B SaaS" value={form.sector} onChange={(e) => update("sector", e.target.value)} />
                        </div>
                    </div>
                    <div className="dash-row">
                        <div className="dash-field">
                            <label>ARR (leave blank if pre-revenue)</label>
                            <input className="dash-input" placeholder="$400K" value={form.arr} onChange={(e) => update("arr", e.target.value)} />
                        </div>
                        <div className="dash-field">
                            <label>YoY growth</label>
                            <input className="dash-input" placeholder="150%" value={form.growth_rate_yoy} onChange={(e) => update("growth_rate_yoy", e.target.value)} />
                        </div>
                    </div>
                    <div className="dash-field">
                        <label>Team strength: {form.team_strength}/5</label>
                        <div className="dash-slider-row">
                            <input type="range" min={1} max={5} value={form.team_strength} onChange={(e) => update("team_strength", Number(e.target.value))} />
                            <span className="dash-slider-value">{form.team_strength}</span>
                        </div>
                    </div>
                    <div className="dash-field">
                        <label>Traction strength: {form.traction_strength}/5</label>
                        <div className="dash-slider-row">
                            <input type="range" min={1} max={5} value={form.traction_strength} onChange={(e) => update("traction_strength", Number(e.target.value))} />
                            <span className="dash-slider-value">{form.traction_strength}</span>
                        </div>
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Estimating..." : "Estimate Valuation"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Estimating valuation range...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><CoinsIcon size={20} /></span>Fill in your stage, sector, and traction to get a valuation range.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}
                            <div className="dash-valuation-range">{result.valuation_low_formatted} - {result.valuation_high_formatted}</div>
                            <div className="dash-valuation-sub">Pre-money | methodology: {result.methodology?.replaceAll("_", " ")}</div>

                            {result.value_drivers?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Value Drivers</div>
                                    <div className="dash-list">{result.value_drivers.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.key_risks?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Key Risks</div>
                                    <div className="dash-list">{result.key_risks.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.negotiation_guidance && (
                                <>
                                    <div className="dash-section-title">Negotiation Guidance</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.negotiation_guidance}</p>
                                </>
                            )}
                            {result.caveat && (
                                <p style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#94A3B8", marginTop: 16, lineHeight: 1.6 }}>
                                    {result.caveat}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
