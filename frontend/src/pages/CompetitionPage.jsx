import { useState } from "react";
import { apiDashboardCompetition } from "../pitchmateApi";

export default function CompetitionPage() {
    const [competitorsText, setCompetitorsText] = useState("");
    const [description, setDescription] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const competitors = competitorsText.split(",").map((c) => c.trim()).filter(Boolean);
    const canSubmit = competitors.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const data = await apiDashboardCompetition({ competitors, description: description.trim() || undefined });
            setResult(data);
        } catch (err) {
            setError(err.message || "Competition analysis failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Competitive Landscape</h2>
                <p>See where your competitive positioning is strong and where investors will push back.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your competitors</h3>
                    <div className="dash-field">
                        <label>Competitor names (comma-separated)</label>
                        <textarea className="dash-textarea" placeholder="Salesforce, HubSpot, Zoho CRM"
                            value={competitorsText} onChange={(e) => setCompetitorsText(e.target.value)} rows={3} />
                    </div>
                    <div className="dash-field">
                        <label>Your startup (optional context)</label>
                        <textarea className="dash-textarea" placeholder="Briefly describe what you do differently..."
                            value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Analyzing..." : "Analyze Competition"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Evaluating competitive positioning...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty">List your known competitors to get a structured gap analysis and moat suggestion.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            <div className="dash-section-title">Suggested Moat</div>
                            <p style={{ fontSize: 13, color: "#111111", lineHeight: 1.6, fontWeight: 600 }}>{result.suggested_moat}</p>

                            {result.competitor_table?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Competitor Table</div>
                                    <table className="dash-table">
                                        <thead>
                                            <tr><th>Name</th><th>Positioning</th><th>Weakness</th></tr>
                                        </thead>
                                        <tbody>
                                            {result.competitor_table.map((c, i) => (
                                                <tr key={i}><td>{c.name}</td><td>{c.positioning}</td><td>{c.weakness}</td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {result.strengths?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Strengths</div>
                                    <div className="dash-list">{result.strengths.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">-</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.gaps?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Gaps</div>
                                    <div className="dash-list">{result.gaps.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet" style={{ color: "#CC0000" }}>-</span>{s}</div>)}</div>
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
