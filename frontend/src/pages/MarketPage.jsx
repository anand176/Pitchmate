import { useEffect, useState } from "react";
import { apiDashboardMarket } from "../pitchmateApi";
import { TrendingUpIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";
import { ResultCard, Section, MotionButton } from "../motion";

export default function MarketPage() {
    const { profile, saved, loadingSaved, reportRun } = useAnalysisModule("market");
    const [form, setForm] = useState({ tam: "", sam: "", som: "", description: "" });
    const [result, setResult] = useState(null);
    const [resultVersion, setResultVersion] = useState(0);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const [prefilled, setPrefilled] = useState(false);

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        const desc = profile?.one_liner || profile?.product_description || "";
        setForm((f) => ({ ...f, description: desc, ...(saved?.inputs || {}) }));
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        else if (desc) setPrefilled(true);
        setHydrated(true);
    }, [loadingSaved, saved, profile, hydrated]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const canSubmit = form.tam.trim() && form.sam.trim() && form.som.trim() && form.description.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardMarket(form);
            setResult(data);
            setResultVersion((v) => v + 1);
            setLastRun(new Date().toISOString());
            reportRun(data, form);
        } catch (err) {
            setError(err.message || "Market analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Market Sizing</h2>
                <p>Validate your TAM / SAM / SOM claims and get an investor-grade credibility check.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your market claims</h3>
                    {prefilled && <div className="dash-prefill-note">Description pre-filled from your profile — edit as needed.</div>}
                    <div className="dash-row">
                        <div className="dash-field">
                            <label>TAM (Total Addressable Market)</label>
                            <input className="dash-input" placeholder="$50B" value={form.tam} onChange={(e) => update("tam", e.target.value)} />
                        </div>
                        <div className="dash-field">
                            <label>SAM (Serviceable Addressable)</label>
                            <input className="dash-input" placeholder="$5B" value={form.sam} onChange={(e) => update("sam", e.target.value)} />
                        </div>
                    </div>
                    <div className="dash-field">
                        <label>SOM (Serviceable Obtainable, 5yr)</label>
                        <input className="dash-input" placeholder="$500M" value={form.som} onChange={(e) => update("som", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Business description</label>
                        <textarea className="dash-textarea" placeholder="Briefly describe your business and product..."
                            value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} />
                    </div>
                    <MotionButton type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Analyzing..." : "Validate Market Size"}
                    </MotionButton>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Validating market claims...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><TrendingUpIcon size={20} /></span>Fill in your TAM/SAM/SOM and description, then submit to see a structured credibility assessment.</div></div>
                    )}
                    {result && (
                        <ResultCard key={resultVersion} animate={resultVersion > 0}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                                {lastRun && <div className="dash-lastrun" style={{ margin: 0 }}>Last run · {relativeTime(lastRun)}</div>}
                                <Section as="span" className={`dash-verdict ${result.verdict}`} style={{ margin: 0 }}>
                                    {(result.verdict || "").replace("_", " ")}
                                </Section>
                            </div>

                            {result.automatic_flags?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Automatic flags</Section>
                                    <Section>{result.automatic_flags.map((f, i) => <span key={i} className="dash-tag warn">{f}</span>)}</Section>
                                </>
                            )}

                            <Section className="dash-section-title">TAM Assessment</Section>
                            <Section as="p" style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.tam_assessment}</Section>
                            <Section className="dash-section-title">SAM Assessment</Section>
                            <Section as="p" style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.sam_assessment}</Section>
                            <Section className="dash-section-title">SOM Assessment</Section>
                            <Section as="p" style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.som_assessment}</Section>

                            {result.strengths?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Strengths</Section>
                                    <Section className="dash-list">{result.strengths.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</Section>
                                </>
                            )}
                            {result.red_flags?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Red Flags</Section>
                                    <Section className="dash-list">{result.red_flags.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</Section>
                                </>
                            )}
                            {result.recommendations?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Recommendations</Section>
                                    <Section className="dash-list">{result.recommendations.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</Section>
                                </>
                            )}
                        </ResultCard>
                    )}
                </div>
            </div>
        </div>
    );
}
