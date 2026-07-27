import { useEffect, useState } from "react";
import { apiDashboardInvestors } from "../pitchmateApi";
import { HandshakeIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";
import { ResultCard, Section, MotionButton, ResultActions } from "../motion";

const STAGES = ["Pre-Seed", "Seed", "Series A", "Series B+"];

const STAGE_FROM_LIFECYCLE = {
    idea: "Pre-Seed", validating: "Pre-Seed", building: "Pre-Seed", pre_revenue: "Pre-Seed",
    revenue: "Seed", raising: "Seed", angel_backed: "Seed", seed_closed: "Series A",
    series_a_plus: "Series B+",
};

export default function InvestorsPage() {
    const { profile, saved, loadingSaved, reportRun, clearAnalysis, storeToKnowledgeBase } = useAnalysisModule("investors");
    const [stage, setStage] = useState("Seed");
    const [industry, setIndustry] = useState("");
    const [result, setResult] = useState(null);
    const [resultVersion, setResultVersion] = useState(0);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const [prefilled, setPrefilled] = useState(false);

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        const defStage = STAGE_FROM_LIFECYCLE[profile?.lifecycle_stage] || "Seed";
        setStage(saved?.inputs?.stage || defStage);
        const ind = saved?.inputs?.industry || profile?.industry || "";
        setIndustry(ind);
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        else if (profile?.industry) setPrefilled(true);
        setHydrated(true);
    }, [loadingSaved, saved, profile, hydrated]);

    const canSubmit = industry.trim();

    const handleClear = async () => {
        await clearAnalysis();
        setResult(null);
        setLastRun(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null);
        try {
            const inputs = { stage, industry };
            const data = await apiDashboardInvestors(inputs);
            setResult(data);
            setResultVersion((v) => v + 1);
            setLastRun(new Date().toISOString());
            reportRun(data, inputs);
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
                    {prefilled && <div className="dash-prefill-note">Stage &amp; industry pre-filled from your profile.</div>}
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
                    <MotionButton type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Finding investors..." : "Suggest Investors"}
                    </MotionButton>
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
                        <ResultCard key={resultVersion} animate={resultVersion > 0}>
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}
                            <Section as="span" className="dash-tag">Check size: {result.typical_check_size}</Section>
                            <Section as="p" style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, marginTop: 10 }}>{result.what_investors_look_for}</Section>

                            {result.tiers?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Investor Tiers</Section>
                                    {result.tiers.map((tier, i) => (
                                        <Section key={i} style={{ marginBottom: 12 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                                <span className="dash-tag" style={{ fontWeight: 700 }}>Tier {tier.tier}</span>
                                            </div>
                                            <div style={{ marginBottom: 4 }}>
                                                {tier.investor_types?.map((t, j) => <span key={j} className="dash-tag">{t}</span>)}
                                            </div>
                                            {tier.rationale && <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{tier.rationale}</p>}
                                        </Section>
                                    ))}
                                </>
                            )}

                            {result.example_profiles?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Example Investor Profiles</Section>
                                    <Section className="dash-list">{result.example_profiles.map((p, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{p}</div>)}</Section>
                                </>
                            )}

                            {result.outreach_strategy && (
                                <>
                                    <Section className="dash-section-title">Outreach Strategy</Section>
                                    <Section as="p" style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.outreach_strategy}</Section>
                                </>
                            )}
                            {result.red_flags?.length > 0 && (
                                <>
                                    <Section className="dash-section-title">Investors to Avoid</Section>
                                    <Section className="dash-list">{result.red_flags.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</Section>
                                </>
                            )}
                            <ResultActions onClear={handleClear} onStore={() => storeToKnowledgeBase(result)} />
                        </ResultCard>
                    )}
                </div>
            </div>
        </div>
    );
}
