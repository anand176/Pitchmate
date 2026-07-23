import { useEffect, useState } from "react";
import { apiDashboardCompetition } from "../pitchmateApi";
import { UsersIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";
import { ResultCard, Section, MotionButton } from "../motion";

export default function CompetitionPage() {
    const { profile, saved, loadingSaved, reportRun } = useAnalysisModule("competition");
    const [competitorsText, setCompetitorsText] = useState("");
    const [description, setDescription] = useState("");
    const [result, setResult] = useState(null);
    const [resultVersion, setResultVersion] = useState(0);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        if (saved?.inputs?.competitors) setCompetitorsText(saved.inputs.competitors.join(", "));
        setDescription(saved?.inputs?.description || profile?.one_liner || profile?.solution || "");
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        setHydrated(true);
    }, [loadingSaved, saved, profile, hydrated]);

    const competitors = competitorsText.split(",").map((c) => c.trim()).filter(Boolean);
    const canSubmit = competitors.length > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const inputs = { competitors, description: description.trim() || undefined };
            const data = await apiDashboardCompetition(inputs);
            setResult(data);
            setResultVersion((v) => v + 1);
            setLastRun(new Date().toISOString());
            reportRun(data, inputs);
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
                    <MotionButton type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Analyzing..." : "Analyze Competition"}
                    </MotionButton>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Evaluating competitive positioning...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><UsersIcon size={20} /></span>List your known competitors to get a structured gap analysis and moat suggestion.</div></div>
                    )}
                    {result && (
                        <ResultCard key={resultVersion} animate={resultVersion > 0}>
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}
                            <Section className="dash-section-title">Suggested Moat</Section>
                            <Section as="p" style={{ fontSize: 13, color: "#0F172A", lineHeight: 1.6, fontWeight: 600 }}>{result.suggested_moat}</Section>

                            {result.competitor_table?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Competitor Table</Section>
                                    <Section as="table" className="dash-table">
                                        <thead>
                                            <tr><th>Name</th><th>Positioning</th><th>Weakness</th></tr>
                                        </thead>
                                        <tbody>
                                            {result.competitor_table.map((c, i) => (
                                                <tr key={i}><td>{c.name}</td><td>{c.positioning}</td><td>{c.weakness}</td></tr>
                                            ))}
                                        </tbody>
                                    </Section>
                                </>
                            )}

                            {result.strengths?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Strengths</Section>
                                    <Section className="dash-list">{result.strengths.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</Section>
                                </>
                            )}
                            {result.gaps?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Gaps</Section>
                                    <Section className="dash-list">{result.gaps.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</Section>
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
