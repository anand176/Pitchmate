import { useEffect, useState } from "react";
import { apiDashboardTraction } from "../pitchmateApi";
import { AwardIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";
import { ResultActions } from "../motion";

export default function TractionPage() {
    const { profile, saved, loadingSaved, reportRun, clearAnalysis, storeToKnowledgeBase } = useAnalysisModule("traction");
    const [form, setForm] = useState({ metrics: "", customer_quotes: "", milestones: "", stage: "" });
    const [result, setResult] = useState(null);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        const stage = (profile?.lifecycle_stage || "").replace(/_/g, " ");
        setForm((f) => ({ ...f, stage, ...(saved?.inputs || {}) }));
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        setHydrated(true);
    }, [loadingSaved, saved, profile, hydrated]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const canSubmit = form.metrics.trim();

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
            const data = await apiDashboardTraction(form);
            setResult(data);
            setLastRun(new Date().toISOString());
            reportRun(data, form);
        } catch (err) {
            setError(err.message || "Traction framing failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Traction Framing</h2>
                <p>No pedigree? Frame the proof you do have. Turn early metrics, quotes, and milestones into a credible momentum story — without inflating a thing.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>Your proof</h3>
                    <div className="dash-field">
                        <label>Metrics / signal</label>
                        <textarea className="dash-textarea" rows={4}
                            placeholder="Whatever you've got: 2,000 waitlist, 15% WoW growth, 6 paying pilots, 40% M1 retention, 3 LOIs..."
                            value={form.metrics} onChange={(e) => update("metrics", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Customer quotes <span style={{ opacity: 0.5 }}>(optional)</span></label>
                        <textarea className="dash-textarea" rows={3}
                            placeholder="Paste real quotes from users/customers — verbatim is best."
                            value={form.customer_quotes} onChange={(e) => update("customer_quotes", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Milestones <span style={{ opacity: 0.5 }}>(optional)</span></label>
                        <textarea className="dash-textarea" rows={2}
                            placeholder="Launched on Product Hunt, signed a design partner, key hire..."
                            value={form.milestones} onChange={(e) => update("milestones", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Stage <span style={{ opacity: 0.5 }}>(optional)</span></label>
                        <input className="dash-input" placeholder="pre-seed" value={form.stage} onChange={(e) => update("stage", e.target.value)} />
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Framing traction..." : "Frame My Traction"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Framing your traction into a momentum story...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><AwardIcon size={20} /></span>List the early signal you have. I'll frame it as credible momentum and flag what proof investors will still want.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}

                            <div className="dash-section-title">Traction narrative</div>
                            <p style={{ fontSize: 14, color: "#0F172A", lineHeight: 1.65 }}>{result.traction_narrative}</p>

                            {result.momentum_story && (
                                <>
                                    <div className="dash-section-title">Momentum</div>
                                    <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>{result.momentum_story}</p>
                                </>
                            )}
                            {result.proof_points?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Proof points</div>
                                    <div className="dash-list">{result.proof_points.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.social_proof?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Social proof</div>
                                    <div className="dash-list">{result.social_proof.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.gaps?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Gaps investors will notice</div>
                                    <div className="dash-list">{result.gaps.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.metrics_to_track?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Start tracking</div>
                                    <div>{result.metrics_to_track.map((m, i) => <span key={i} className="dash-tag">{m}</span>)}</div>
                                </>
                            )}
                            <ResultActions onClear={handleClear} onStore={() => storeToKnowledgeBase(result)} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
