import { useState } from "react";
import { apiDashboardGTM } from "../pitchmateApi";
import { TargetIcon } from "../icons";

export default function GTMPage() {
    const [form, setForm] = useState({ product_description: "", target_market: "" });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const canSubmit = form.product_description.trim() && form.target_market.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardGTM(form);
            setResult(data);
        } catch (err) {
            setError(err.message || "GTM plan generation failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Go-To-Market Strategy</h2>
                <p>Get a phased GTM plan with channels, pricing, ICP, and what to track at each stage.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your product</h3>
                    <div className="dash-field">
                        <label>Product description</label>
                        <textarea className="dash-textarea" placeholder="e.g. AI-powered CRM for small businesses"
                            value={form.product_description} onChange={(e) => update("product_description", e.target.value)} rows={3} />
                    </div>
                    <div className="dash-field">
                        <label>Target market</label>
                        <textarea className="dash-textarea" placeholder="e.g. US small businesses, 1-20 employees"
                            value={form.target_market} onChange={(e) => update("target_market", e.target.value)} rows={3} />
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Building plan..." : "Build GTM Plan"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Building your go-to-market plan...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><TargetIcon size={20} /></span>Describe your product and target market to get a phased GTM strategy.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            <div className="dash-tag">{result.inferred_market_type}</div>

                            <div className="dash-section-title">Suggested Channels</div>
                            <div>{result.suggested_channels?.map((c, i) => <span key={i} className="dash-tag">{c}</span>)}</div>

                            <div className="dash-section-title">Pricing Models</div>
                            <div>{result.suggested_pricing_models?.map((c, i) => <span key={i} className="dash-tag">{c}</span>)}</div>

                            {result.phases?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Phased Plan</div>
                                    {result.phases.map((phase, i) => (
                                        <div key={i} className="dash-phase">
                                            <h4>{phase.name}</h4>
                                            <p>{phase.focus}</p>
                                            <div className="dash-list">
                                                {phase.key_actions?.map((a, j) => <div key={j} className="dash-list-item"><span className="bullet">•</span>{a}</div>)}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {result.primary_icp && (
                                <>
                                    <div className="dash-section-title">Primary ICP</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.primary_icp}</p>
                                </>
                            )}
                            {result.early_adopter_profile && (
                                <>
                                    <div className="dash-section-title">Early Adopter Profile</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.early_adopter_profile}</p>
                                </>
                            )}
                            {result.recommended_sales_motion && (
                                <>
                                    <div className="dash-section-title">Recommended Sales Motion</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.recommended_sales_motion}</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
