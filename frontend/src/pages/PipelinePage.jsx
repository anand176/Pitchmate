import { useCallback, useEffect, useState } from "react";
import {
    apiGetPipelineSummary, apiUpdateRound, apiCreateInvestor, apiUpdateInvestor, apiDeleteInvestor,
    apiSyncPipelineToNotion, apiScheduleFollowup, apiGetIntegrationsStatus,
} from "../pitchmateApi";
import { FunnelIcon, PlusIcon, CalendarIcon } from "../icons";
import { useDashboardContext } from "../dashboardContext";
import { relativeTime } from "../useAnalysisModule";

const STAGE_LABELS = {
    research: "Research",
    outreach: "Outreach",
    meeting_scheduled: "Meeting scheduled",
    pitched: "Pitched",
    due_diligence: "Due diligence",
    term_sheet: "Term sheet",
    closed_won: "Closed (won)",
    closed_lost: "Closed (lost)",
};
const PIPELINE_STAGES = Object.keys(STAGE_LABELS);
const WARMTH_LEVELS = ["cold", "warm", "hot"];

const EMPTY_FORM = {
    name: "", firm: "", investor_type: "", pipeline_stage: "research", warmth: "cold", next_action: "",
};

/**
 * Fundraise Pipeline — investor CRM: round progress, a funnel diagram across
 * pipeline stages, and per-investor cards (stage/warmth/next action). Distinct
 * from the "Investors" tab (which suggests investor *types*, not real contacts).
 */
export default function PipelinePage() {
    const { notify } = useDashboardContext();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [form, setForm] = useState(EMPTY_FORM);
    const [adding, setAdding] = useState(false);

    const [roundForm, setRoundForm] = useState({ name: "", target_amount: "", amount_committed: "" });
    const [savingRound, setSavingRound] = useState(false);

    const [notionConnected, setNotionConnected] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState("");

    const [followupFor, setFollowupFor] = useState(null);
    const [followupDate, setFollowupDate] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const data = await apiGetPipelineSummary();
            if (!data?.round || !Array.isArray(data.investors)) {
                // Defensive: a proxy/network hiccup can return a 200 with an
                // unexpected body (e.g. HTML) that still parses as `{}` — treat
                // that as a failure instead of rendering with missing fields.
                throw new Error("Unexpected response from the server. Please refresh.");
            }
            setSummary(data);
            setRoundForm({
                name: data.round.name || "Fundraise",
                target_amount: data.round.target_amount || "",
                amount_committed: data.round.amount_committed || "",
            });
        } catch (err) {
            setError(err.message || "Could not load pipeline.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        (async () => {
            try {
                const st = await apiGetIntegrationsStatus();
                setNotionConnected(!!st.integrations?.find((i) => i.provider === "notion")?.connected);
            } catch {
                // Integrations are optional — silently leave the sync button disabled.
            }
        })();
    }, []);

    const funnel = summary?.funnel || [];
    const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));

    const updateForm = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const updateRoundForm = (k, v) => setRoundForm((f) => ({ ...f, [k]: v }));

    const handleAddInvestor = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || adding) return;
        setAdding(true); setError("");
        try {
            await apiCreateInvestor({ ...form, name: form.name.trim() });
            setForm(EMPTY_FORM);
            notify?.("Investor added to pipeline");
            await load();
        } catch (err) {
            setError(err.message || "Could not add investor.");
        } finally {
            setAdding(false);
        }
    };

    const patchInvestor = async (id, fields) => {
        try {
            await apiUpdateInvestor(id, fields);
            await load();
        } catch (err) {
            setError(err.message || "Update failed.");
        }
    };

    const removeInvestor = async (id) => {
        try {
            await apiDeleteInvestor(id);
            await load();
        } catch (err) {
            setError(err.message || "Delete failed.");
        }
    };

    const saveRound = async (e) => {
        e.preventDefault();
        setSavingRound(true); setError("");
        try {
            await apiUpdateRound(roundForm);
            notify?.("Round updated");
            await load();
        } catch (err) {
            setError(err.message || "Could not save round.");
        } finally {
            setSavingRound(false);
        }
    };

    const syncToNotion = async () => {
        setSyncing(true); setSyncMsg("");
        try {
            const res = await apiSyncPipelineToNotion();
            setSyncMsg(`Synced — ${res.created} created, ${res.updated} updated.`);
        } catch (err) {
            setSyncMsg(err.message || "Sync failed.");
        } finally {
            setSyncing(false);
        }
    };

    const submitFollowup = async (investorId) => {
        if (!followupDate) return;
        try {
            await apiScheduleFollowup({ investor_id: investorId, when: new Date(followupDate).toISOString() });
            notify?.("Follow-up scheduled on Google Calendar");
            setFollowupFor(null); setFollowupDate("");
            await load();
        } catch (err) {
            setError(err.message || "Could not schedule follow-up — connect Google in Settings first.");
        }
    };

    const target = parseFloat(String(roundForm.target_amount || "").replace(/[^0-9.]/g, "")) || 0;
    const committed = parseFloat(String(roundForm.amount_committed || "").replace(/[^0-9.]/g, "")) || 0;
    const progressPct = target > 0 ? Math.min(100, Math.round((committed / target) * 100)) : 0;

    return (
        <div>
            <div className="dash-page-header">
                <h2>Fundraise Pipeline</h2>
                <p>Track every investor conversation — stage, warmth, and next action — and see your round funnel at a glance.</p>
            </div>

            <div className="dash-grid">
                <div>
                    <form className="dash-card" onSubmit={saveRound}>
                        <h3>Round</h3>
                        <div className="dash-field">
                            <label>Round name</label>
                            <input className="dash-input" value={roundForm.name}
                                onChange={(e) => updateRoundForm("name", e.target.value)} />
                        </div>
                        <div className="dash-row">
                            <div className="dash-field">
                                <label>Target</label>
                                <input className="dash-input" placeholder="$1.5M" value={roundForm.target_amount}
                                    onChange={(e) => updateRoundForm("target_amount", e.target.value)} />
                            </div>
                            <div className="dash-field">
                                <label>Committed</label>
                                <input className="dash-input" placeholder="$400K" value={roundForm.amount_committed}
                                    onChange={(e) => updateRoundForm("amount_committed", e.target.value)} />
                            </div>
                        </div>
                        {target > 0 && (
                            <>
                                <div className="pipeline-progress-row">
                                    <span className="pipeline-progress-amounts">{progressPct}%</span>
                                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                        {roundForm.amount_committed || "$0"} of {roundForm.target_amount}
                                    </span>
                                </div>
                                <div className="home-progress-bar">
                                    <div className="home-progress-fill" style={{ transform: `scaleX(${progressPct / 100})` }} />
                                </div>
                            </>
                        )}
                        <button className="dash-btn-primary" type="submit" disabled={savingRound}>
                            {savingRound ? "Saving..." : "Save round"}
                        </button>
                    </form>

                    <form className="dash-card investor-add-form" onSubmit={handleAddInvestor}>
                        <h3>Add investor</h3>
                        <div className="dash-field">
                            <label>Name</label>
                            <input className="dash-input" placeholder="e.g. Jane Doe" value={form.name}
                                onChange={(e) => updateForm("name", e.target.value)} />
                        </div>
                        <div className="dash-row">
                            <div className="dash-field">
                                <label>Firm</label>
                                <input className="dash-input" placeholder="Acme Ventures" value={form.firm}
                                    onChange={(e) => updateForm("firm", e.target.value)} />
                            </div>
                            <div className="dash-field">
                                <label>Type</label>
                                <input className="dash-input" placeholder="Seed VC" value={form.investor_type}
                                    onChange={(e) => updateForm("investor_type", e.target.value)} />
                            </div>
                        </div>
                        <div className="dash-row">
                            <div className="dash-field">
                                <label>Stage</label>
                                <select className="dash-select" value={form.pipeline_stage}
                                    onChange={(e) => updateForm("pipeline_stage", e.target.value)}>
                                    {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                                </select>
                            </div>
                            <div className="dash-field">
                                <label>Warmth</label>
                                <select className="dash-select" value={form.warmth}
                                    onChange={(e) => updateForm("warmth", e.target.value)}>
                                    {WARMTH_LEVELS.map((w) => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="dash-field">
                            <label>Next action <span style={{ opacity: 0.5 }}>(optional)</span></label>
                            <input className="dash-input" placeholder="e.g. Send updated deck" value={form.next_action}
                                onChange={(e) => updateForm("next_action", e.target.value)} />
                        </div>
                        <button className="dash-btn-primary" type="submit" disabled={!form.name.trim() || adding}>
                            <PlusIcon size={15} /> {adding ? "Adding..." : "Add to pipeline"}
                        </button>
                        {error && <div className="dash-error">{error}</div>}
                    </form>
                </div>

                <div>
                    {loading && (
                        <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Loading your pipeline...</div></div>
                    )}

                    {!loading && summary && (
                        <>
                            <div className="dash-card">
                                <h3>Funnel</h3>
                                {funnel.every((f) => f.count === 0) ? (
                                    <div className="pipeline-empty-board">
                                        <span className="dash-empty-icon"><FunnelIcon size={20} /></span>
                                        No investors yet — add your first one to see the funnel fill in.
                                    </div>
                                ) : (
                                    <div className="funnel-list">
                                        {funnel.map((f) => (
                                            <div className="funnel-row" key={f.stage}>
                                                <span className="funnel-label">{f.label}</span>
                                                <span className="funnel-track">
                                                    <span className="funnel-fill" style={{ width: `${(f.count / maxFunnel) * 100}%` }} />
                                                </span>
                                                <span className="funnel-count">{f.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="pipeline-stat-row">
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{summary.total_active}</div>
                                        <div className="mini-label">Active</div>
                                    </div>
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{summary.hot_count}</div>
                                        <div className="mini-label">Hot</div>
                                    </div>
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{summary.closed_won_count}</div>
                                        <div className="mini-label">Won</div>
                                    </div>
                                    <div className="pipeline-mini-stat">
                                        <div className="mini-value">{summary.closed_lost_count}</div>
                                        <div className="mini-label">Lost</div>
                                    </div>
                                </div>
                                <div className="pipeline-sync-row">
                                    <button type="button" className="dash-btn-secondary" onClick={syncToNotion}
                                        disabled={syncing || !notionConnected}>
                                        {syncing ? "Syncing..." : "Sync to Notion"}
                                    </button>
                                    {!notionConnected && (
                                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                            Connect Notion in Profile &amp; docs first.
                                        </span>
                                    )}
                                    {syncMsg && <span style={{ fontSize: 12, color: "var(--accent-ink)" }}>{syncMsg}</span>}
                                </div>
                            </div>

                            <div className="dash-card">
                                <h3>Investors ({summary.investors.length})</h3>
                                {summary.investors.length === 0 ? (
                                    <div className="pipeline-empty-board">
                                        Add investors on the left to start tracking your round.
                                    </div>
                                ) : (
                                    <div className="investor-list">
                                        {summary.investors.map((inv) => (
                                            <div className="investor-card" key={inv.id}>
                                                <div className="investor-card-top">
                                                    <div>
                                                        <div className="investor-name">{inv.name}</div>
                                                        {(inv.firm || inv.investor_type) && (
                                                            <div className="investor-firm">
                                                                {[inv.firm, inv.investor_type].filter(Boolean).join(" · ")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="investor-card-actions">
                                                        <select
                                                            className="dash-select investor-stage-select"
                                                            value={inv.pipeline_stage}
                                                            onChange={(e) => patchInvestor(inv.id, { pipeline_stage: e.target.value })}
                                                        >
                                                            {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                                                        </select>
                                                        <div className="warmth-btn-group">
                                                            {WARMTH_LEVELS.map((w) => (
                                                                <button
                                                                    key={w}
                                                                    type="button"
                                                                    className={`warmth-btn ${w} ${inv.warmth === w ? "active" : ""}`}
                                                                    onClick={() => patchInvestor(inv.id, { warmth: w })}
                                                                >
                                                                    {w}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <button type="button" className="investor-delete-btn" onClick={() => removeInvestor(inv.id)}>
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>

                                                {(inv.next_action || inv.next_action_date || inv.updated_at) && (
                                                    <div className="investor-meta-row">
                                                        {inv.next_action && <span>Next: <b>{inv.next_action}</b></span>}
                                                        {inv.next_action_date && (
                                                            <span>Follow-up: <b>{new Date(inv.next_action_date).toLocaleDateString()}</b></span>
                                                        )}
                                                        {inv.updated_at && <span>Updated {relativeTime(inv.updated_at)}</span>}
                                                    </div>
                                                )}
                                                {inv.notes && <div className="investor-notes">{inv.notes}</div>}

                                                <div className="investor-followup-row">
                                                    {followupFor === inv.id ? (
                                                        <>
                                                            <input type="date" value={followupDate}
                                                                onChange={(e) => setFollowupDate(e.target.value)} />
                                                            <button type="button" className="dash-copy-btn" onClick={() => submitFollowup(inv.id)}>
                                                                Schedule
                                                            </button>
                                                            <button type="button" className="investor-delete-btn"
                                                                onClick={() => { setFollowupFor(null); setFollowupDate(""); }}>
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button type="button" className="dash-copy-btn" onClick={() => setFollowupFor(inv.id)}>
                                                            <CalendarIcon size={13} /> Schedule follow-up
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
