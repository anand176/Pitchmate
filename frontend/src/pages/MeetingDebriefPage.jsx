import { useEffect, useState } from "react";
import { apiDashboardDebrief, apiCreateInvestor } from "../pitchmateApi";
import { RadarIcon, CopyIcon, CheckCircleIcon, FunnelIcon } from "../icons";
import { useAnalysisModule, relativeTime } from "../useAnalysisModule";

const INVESTOR_TYPES = ["Angel", "Seed VC", "Series A VC", "Family office", "Corporate VC", "Accelerator"];

const SIGNAL_LABEL = {
    warm: "Warm — real interest",
    lukewarm: "Lukewarm — soft pass",
    dead: "Dead — move on",
};

// Signal read -> pipeline warmth, so a debriefed meeting lands on the Pipeline
// tab already sorted by how hot the lead actually is.
const SIGNAL_TO_WARMTH = { warm: "hot", lukewarm: "warm", dead: "cold" };

export default function MeetingDebriefPage() {
    const { profile, saved, loadingSaved, reportRun } = useAnalysisModule("debrief");
    const [form, setForm] = useState({
        investor_name: "", investor_type: "Seed VC", meeting_notes: "", ask: "",
    });
    const [result, setResult] = useState(null);
    const [lastRun, setLastRun] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [hydrated, setHydrated] = useState(false);
    const [copied, setCopied] = useState(false);
    const [addingToPipeline, setAddingToPipeline] = useState(false);
    const [addedToPipeline, setAddedToPipeline] = useState(false);
    const [pipelineError, setPipelineError] = useState("");

    useEffect(() => {
        if (loadingSaved || hydrated) return;
        const defaultAsk = profile?.target_raise ? `Raising ${profile.target_raise}` : "";
        setForm((f) => ({ ...f, ask: defaultAsk, ...(saved?.inputs || {}) }));
        if (saved?.result) { setResult(saved.result); setLastRun(saved.updated_at); }
        setHydrated(true);
    }, [loadingSaved, saved, profile, hydrated]);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const canSubmit = form.investor_name.trim() && form.meeting_notes.trim();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit || loading) return;
        setLoading(true); setError(""); setResult(null); setCopied(false);
        setAddedToPipeline(false); setPipelineError("");
        try {
            const data = await apiDashboardDebrief(form);
            setResult(data);
            setLastRun(new Date().toISOString());
            reportRun(data, form);
        } catch (err) {
            setError(err.message || "Meeting debrief failed.");
        } finally {
            setLoading(false);
        }
    };

    const copyFollowup = async () => {
        if (!result?.draft_followup_message) return;
        try {
            await navigator.clipboard.writeText(result.draft_followup_message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard blocked — no-op */ }
    };

    const signal = (result?.signal || "").toLowerCase();

    const handleAddToPipeline = async () => {
        if (!result || addingToPipeline) return;
        setAddingToPipeline(true); setPipelineError("");
        try {
            await apiCreateInvestor({
                name: form.investor_name.trim(),
                investor_type: form.investor_type,
                pipeline_stage: "pitched",
                warmth: SIGNAL_TO_WARMTH[signal] || "cold",
                next_action: result.recommended_next_steps?.[0] || "",
                notes: result.signal_reasoning || "",
            });
            setAddedToPipeline(true);
        } catch (err) {
            setPipelineError(err.message || "Could not add to pipeline.");
        } finally {
            setAddingToPipeline(false);
        }
    };

    return (
        <div>
            <div className="dash-page-header">
                <h2>Meeting Debrief</h2>
                <p>Paste what happened in an investor meeting and get an honest read — warm, lukewarm, or dead — plus your exact next move.</p>
            </div>

            <div className="dash-grid">
                <form className="dash-card" onSubmit={handleSubmit}>
                    <h3>The meeting</h3>
                    <div className="dash-row">
                        <div className="dash-field">
                            <label>Investor / firm</label>
                            <input className="dash-input" placeholder="e.g. Initialized Capital" value={form.investor_name} onChange={(e) => update("investor_name", e.target.value)} />
                        </div>
                        <div className="dash-field">
                            <label>Investor type</label>
                            <select className="dash-select" value={form.investor_type} onChange={(e) => update("investor_type", e.target.value)}>
                                {INVESTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="dash-field">
                        <label>What was said / how it went</label>
                        <textarea className="dash-textarea" rows={6}
                            placeholder="Paste your notes verbatim — what they asked, what they liked, any hesitations, how you left it. The more exact their words, the better the read."
                            value={form.meeting_notes} onChange={(e) => update("meeting_notes", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Your ask <span style={{ opacity: 0.5 }}>(optional)</span></label>
                        <input className="dash-input" placeholder="e.g. $1.5M seed" value={form.ask} onChange={(e) => update("ask", e.target.value)} />
                    </div>
                    <button className="dash-btn-primary" type="submit" disabled={!canSubmit || loading}>
                        {loading ? "Reading the room..." : "Read the Signal"}
                    </button>
                    {error && <div className="dash-error">{error}</div>}
                </form>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Classifying the signal and mapping next steps...</div></div>
                    )}
                    {!loading && !result && (
                        <div className="dash-card"><div className="dash-empty"><span className="dash-empty-icon"><RadarIcon size={20} /></span>Founders over-read polite interest as real interest. Paste your meeting notes to get a blunt signal read and a concrete follow-up.</div></div>
                    )}
                    {result && (
                        <div className="dash-card">
                            {lastRun && <div className="dash-lastrun">Last run · {relativeTime(lastRun)}</div>}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                <span className={`dash-signal ${signal}`}>{SIGNAL_LABEL[signal] || result.signal}</span>
                                <button type="button" className="dash-copy-btn" disabled={addingToPipeline || addedToPipeline}
                                    onClick={handleAddToPipeline}>
                                    {addedToPipeline
                                        ? <><CheckCircleIcon size={13} /> Added to pipeline</>
                                        : <><FunnelIcon size={13} /> {addingToPipeline ? "Adding..." : "Add to pipeline"}</>}
                                </button>
                            </div>
                            {pipelineError && <div className="dash-error">{pipelineError}</div>}
                            {result.signal_reasoning && (
                                <p style={{ fontSize: 13.5, color: "#0F172A", lineHeight: 1.6, margin: "0 0 6px" }}>{result.signal_reasoning}</p>
                            )}

                            {result.positive_signals?.length > 0 && (
                                <>
                                    <div className="dash-section-title">What actually went well</div>
                                    <div className="dash-list">{result.positive_signals.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.concerns?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Concerns &amp; objections</div>
                                    <div className="dash-list">{result.concerns.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {result.recommended_next_steps?.length > 0 && (
                                <>
                                    <div className="dash-section-title">Next steps</div>
                                    <div className="dash-list">{result.recommended_next_steps.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}</div>
                                </>
                            )}
                            {(result.suggested_followup_timing || result.materials_to_send?.length > 0) && (
                                <>
                                    <div className="dash-section-title">Timing &amp; materials</div>
                                    {result.suggested_followup_timing && (
                                        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, margin: "0 0 6px" }}>
                                            Follow up in <b style={{ color: "#0F172A" }}>{result.suggested_followup_timing}</b>.
                                        </p>
                                    )}
                                    {result.materials_to_send?.length > 0 && (
                                        <div>{result.materials_to_send.map((m, i) => <span key={i} className="dash-tag">{m}</span>)}</div>
                                    )}
                                </>
                            )}
                            {result.draft_followup_message && (
                                <>
                                    <div className="dash-section-title">Draft follow-up</div>
                                    <div className="dash-followup">{result.draft_followup_message}</div>
                                    <button type="button" className="dash-copy-btn" onClick={copyFollowup}>
                                        {copied ? <><CheckCircleIcon size={13} /> Copied</> : <><CopyIcon size={13} /> Copy message</>}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
