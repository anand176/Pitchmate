import { useState } from "react";
import { apiDashboardMarket } from "../pitchmateApi";

export default function MarketPage() {
    const [form, setForm] = useState({ tam: "", sam: "", som: "", description: "" });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const canSubmit = form.tam.trim() && form.sam.trim() && form.som.trim() && form.description.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardMarket(form);
            setResult(data);
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
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Analyzing..." : "Validate Market Size"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Validating market claims...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty">Fill in your TAM/SAM/SOM and description, then submit to see a structured credibility assessment.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            <span className={`dash-verdict ${result.verdict}`}>{(result.verdict || "").replace("_", " ")}</span>

                            {result.automatic_flags?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Automatic flags</div>
                                    <div>{result.automatic_flags.map((f, i) => <span key={i} className="dash-tag warn">{f}</span>)}</div>
                                </>
                            )}

                            <div className="dash-section-title">TAM Assessment</div>
                            <p style={{ fontSize: 13, color: "#404040", lineHeight: 1.6 }}>{result.tam_assessment}</p>
                            <div className="dash-section-title">SAM Assessment</div>
                            <p style={{ fontSize: 13, color: "#404040", lineHeight: 1.6 }}>{result.sam_assessment}</p>
                            <div className="dash-section-title">SOM Assessment</div>
                            <p style={{ fontSize: 13, color: "#404040", lineHeight: 1.6 }}>{result.som_assessment}</p>

                            {result.strengths?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Strengths</div>
                                    <div className="dash-list">{result.strengths.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">-</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.red_flags?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Red Flags</div>
                                    <div className="dash-list">{result.red_flags.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">></span>{s}</div>)}</div>
                                </>
                            )}
                            {result.recommendations?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Recommendations</div>
                                    <div className="dash-list">{result.recommendations.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">-</span>{s}</div>)}</div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
