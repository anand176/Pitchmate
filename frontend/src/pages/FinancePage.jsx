import { useEffect, useState } from "react";
import { apiDashboardFinance } from "../pitchmateApi";
import { WalletIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";

const FIELDS = [
    { key: "revenue", label: "Revenue (MRR/ARR)", placeholder: "$40K MRR — or 'pre-revenue'" },
    { key: "cac", label: "CAC", placeholder: "$1,200" },
    { key: "ltv", label: "LTV", placeholder: "$4,800" },
    { key: "monthly_burn", label: "Monthly burn", placeholder: "$60K" },
    { key: "cash_in_bank", label: "Cash in bank", placeholder: "$720K" },
    { key: "gross_margin", label: "Gross margin", placeholder: "78%" },
];

// Ratio verdict color echoes the semantic signal palette.
function ratioClass(ratio) {
    if (ratio == null) return "";
    if (ratio >= 3) return "warm";
    if (ratio >= 1) return "lukewarm";
    return "dead";
}
function runwayClass(months) {
    if (months == null) return "";
    if (months >= 12) return "warm";
    if (months >= 6) return "lukewarm";
    return "dead";
}

export default function FinancePage() {
    const { saved, loadingSaved, reportRun } = useAnalysisModule("finance");
    const [form, setForm] = useState({
        revenue: "", cac: "", ltv: "", monthly_burn: "", cash_in_bank: "", gross_margin: "", context: "",
    });
    const [result, setResult] = useState(null);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        if (saved?.inputs) setForm((f) => ({ ...f, ...saved.inputs }));
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        setHydrated(true);
    }, [loadingSaved, saved, hydrated]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const canSubmit = form.cac.trim() || form.ltv.trim() || form.monthly_burn.trim() || form.revenue.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardFinance(form);
            setResult(data);
            setLastRun(new Date().toISOString());
            reportRun(data, form);
        } catch (err) {
            setError(err.message || "Financial narrative failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Financial Narrative</h2>
                <p>Turn raw unit economics into the CAC / LTV / burn / runway story investors use to decide — with the numbers computed for you.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your numbers</h3>
                    <div className="dash-row">
                        {FIELDS.slice(0, 2).map(({ key, label, placeholder }) => (
                            <div className="dash-field" key={key}>
                                <label>{label}</label>
                                <input className="dash-input" placeholder={placeholder} value={form[key]} onChange={(e) => update(key, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <div className="dash-row">
                        {FIELDS.slice(2, 4).map(({ key, label, placeholder }) => (
                            <div className="dash-field" key={key}>
                                <label>{label}</label>
                                <input className="dash-input" placeholder={placeholder} value={form[key]} onChange={(e) => update(key, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <div className="dash-row">
                        {FIELDS.slice(4, 6).map(({ key, label, placeholder }) => (
                            <div className="dash-field" key={key}>
                                <label>{label}</label>
                                <input className="dash-input" placeholder={placeholder} value={form[key]} onChange={(e) => update(key, e.target.value)} />
                            </div>
                        ))}
                    </div>
                    <div className="dash-field">
                        <label>Context <span style={{ opacity: 0.5 }}>(optional)</span></label>
                        <textarea className="dash-textarea" rows={2} placeholder="Anything else — pricing model, payback period, seasonality..."
                            value={form.context} onChange={(e) => update("context", e.target.value)} />
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Building narrative..." : "Frame My Financials"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Computing ratios and writing your financial story...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><WalletIcon size={20} /></span>Enter whatever unit economics you have. I'll compute LTV:CAC and runway, then frame it as an investor-facing story.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}

                            <div className="dash-stat-grid">
                                <div className="dash-stat-tile">
                                    <div className="stat-value">{result.ltv_cac_formatted}</div>
                                    <div className="stat-label">LTV : CAC {result.ltv_cac_ratio != null && <span className={`dash-signal ${ratioClass(result.ltv_cac_ratio)}`} style={{ margin: 0, padding: "1px 8px", fontSize: 10 }}>{result.ltv_cac_ratio >= 3 ? "healthy" : result.ltv_cac_ratio >= 1 ? "thin" : "underwater"}</span>}</div>
                                </div>
                                <div className="dash-stat-tile">
                                    <div className="stat-value">{result.runway_months != null ? `${result.runway_months} mo` : "n/a"}</div>
                                    <div className="stat-label">Runway {result.runway_months != null && <span className={`dash-signal ${runwayClass(result.runway_months)}`} style={{ margin: 0, padding: "1px 8px", fontSize: 10 }}>{result.runway_months >= 12 ? "comfortable" : result.runway_months >= 6 ? "tight" : "urgent"}</span>}</div>
                                </div>
                                <div className="dash-stat-tile">
                                    <div className="stat-value">{result.monthly_burn_formatted}</div>
                                    <div className="stat-label">Monthly burn</div>
                                </div>
                                <div className="dash-stat-tile">
                                    <div className="stat-value">{result.gross_margin_pct != null ? `${result.gross_margin_pct}%` : result.cash_formatted}</div>
                                    <div className="stat-label">{result.gross_margin_pct != null ? "Gross margin" : "Cash"}</div>
                                </div>
                            </div>

                            {result.automatic_flags?.length > 0 && (
                                <div>{result.automatic_flags.map((f, i) => <span key={i} className="dash-tag warn">{f}</span>)}</div>
                            )}

                            <div className="dash-section-title">The narrative</div>
                            <p style={{ fontSize: 14, color: "#0F172A", lineHeight: 1.65 }}>{result.narrative}</p>

                            {result.strengths?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Strengths</div>
                                    <div className="dash-list">{result.strengths.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.red_flags?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Red flags investors will probe</div>
                                    <div className="dash-list">{result.red_flags.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.talking_points?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Talking points</div>
                                    <div className="dash-list">{result.talking_points.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.benchmark_notes && (
                                <>
                                    <div className="dash-section-title">Benchmark</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.benchmark_notes}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
