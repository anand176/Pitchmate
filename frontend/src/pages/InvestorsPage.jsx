import { useState } from "react";
import { apiDashboardInvestors } from "../pitchmateApi";
import { HandshakeIcon } from "../icons";

const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B+"];

export default function InvestorsPage() {
    const [stage, setStage] = useState("Seed");
    const [industry, setIndustry] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const canSubmit = industry.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardInvestors({ stage, industry });
            setResult(data);
        } catch (err) {
            setError(err.message || "Investor targeting failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Investor Targeting</h2>
                <p>Find the right investor types for your stage and industry, tiered by fit.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your fundraise</h3>
                    <div className="dash-field">
                        <label>Funding stage</label>
                        <select className="dash-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="dash-field">
                        <label>Industry / vertical</label>
                        <input className="dash-input" placeholder="e.g. fintech, AI/ML, healthtech"
                            value={industry} onChange={(e) => setIndustry(e.target.value)} />
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Finding investors..." : "Suggest Investors"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Finding the right investor types...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><HandshakeIcon size={20} /></span>Select your stage and industry to get a tiered investor targeting strategy.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            <div className="dash-tag">Check size: {result.typical_check_size}</div>
                            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginTop: 10 }}>{result.what_investors_look_for}</p>

                            {result.tiers?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Investor Tiers</div>
                                    {result.tiers.map((tier, i) => (
                                        <div key={i} style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                <span className="dash-tag" style={{ fontWeight: 700 }}>Tier {tier.tier}</span>
                                            </div>
                                            <div style={{ marginBottom: 4 }}>
                                                {tier.investor_types?.map((t, j) => <span key={j} className="dash-tag">{t}</span>)}
                                            </div>
                                            {tier.rationale && <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{tier.rationale}</p>}
                                        </div>
                                    ))}
                                </>
                            )}

                            {result.example_profiles?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Example Investor Profiles</div>
                                    <div className="dash-list">{result.example_profiles.map((p, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{p}</div>)}</div>
                                </>
                            )}

                            {result.outreach_strategy && (
                                <>
                                    <div className="dash-section-title">Outreach Strategy</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.outreach_strategy}</p>
                                </>
                            )}
                            {result.red_flags?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Investors to Avoid</div>
                                    <div className="dash-list">{result.red_flags.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
