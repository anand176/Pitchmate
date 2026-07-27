import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    apiUploadDocument, apiUploadDocumentFile, apiListDocuments,
    apiGetProfile, apiUpdateProfile, apiSaveContext,
    apiGetIntegrationsStatus, apiGetConnectUrl, apiDisconnectIntegration, apiUpdateNotionSettings,
    apiGetTeamMembers, apiCreateTeamInvite,
} from "../pitchmateApi";
import { useDashboardContext } from "../dashboardContext";
import { LinkIcon, UsersIcon, CopyIcon, CheckCircleIcon } from "../icons";

const PROVIDER_LABELS = { notion: "Notion", google: "Google (Calendar + Drive)" };

const STAGES = [
    { value: "idea", label: "Idea" },
    { value: "validating", label: "Validating" },
    { value: "building", label: "Building" },
    { value: "pre_revenue", label: "Pre-revenue" },
    { value: "revenue", label: "Revenue" },
    { value: "raising", label: "Raising" },
    { value: "angel_backed", label: "Angel-backed" },
    { value: "seed_closed", label: "Seed closed" },
    { value: "series_a_plus", label: "Series A+" },
];

/**
 * Profile & documents — merged Idea Desk + Share Doc + editable lifecycle.
 */
export default function SettingsPage() {
    const { sessionId, setSessionId, refreshProfile } = useDashboardContext();

    return (
        <div>
            <div className="dash-page-header">
                <h2>Profile & documents</h2>
                <p>Update your startup stage, narrative, and knowledge-base uploads.</p>
            </div>

            <ProfileEditorPanel refreshProfile={refreshProfile} sessionId={sessionId} setSessionId={setSessionId} />
            <div style={{ height: 16 }} />
            <TeamPanel />
            <div style={{ height: 16 }} />
            <ShareDocPanel />
            <div style={{ height: 16 }} />
            <IntegrationsPanel />
        </div>
    );
}

function ProfileEditorPanel({ refreshProfile, sessionId, setSessionId }) {
    const [form, setForm] = useState({
        company_name: "",
        one_liner: "",
        industry: "",
        lifecycle_stage: "idea",
        problem: "",
        solution: "",
        product_description: "",
        is_actively_raising: false,
        target_raise: "",
        amount_raised: "",
        investor_count: "",
        investor_notes: "",
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        apiGetProfile()
            .then((p) => {
                setForm({
                    company_name: p.company_name || "",
                    one_liner: p.one_liner || "",
                    industry: p.industry || "",
                    lifecycle_stage: p.lifecycle_stage || "idea",
                    problem: p.problem || "",
                    solution: p.solution || "",
                    product_description: p.product_description || "",
                    is_actively_raising: !!p.is_actively_raising,
                    target_raise: p.target_raise || "",
                    amount_raised: p.amount_raised || "",
                    investor_count: p.investor_count != null ? String(p.investor_count) : "",
                    investor_notes: p.investor_notes || "",
                });
            })
            .catch(() => { });
    }, []);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const payload = {
                ...form,
                investor_count: form.investor_count === "" ? null : Number(form.investor_count),
            };
            const saved = await apiUpdateProfile(payload);
            const summary = [
                saved.company_name && `Company: ${saved.company_name}`,
                saved.lifecycle_stage && `Stage: ${saved.lifecycle_stage}`,
                saved.problem && `Problem: ${saved.problem}`,
                saved.solution && `Solution: ${saved.solution}`,
                saved.product_description && `Product: ${saved.product_description}`,
            ].filter(Boolean).join("\n");
            if (summary) {
                try {
                    const ctx = await apiSaveContext(summary, sessionId);
                    if (ctx.session_id && setSessionId) setSessionId(ctx.session_id);
                } catch { /* non-fatal */ }
            }
            if (refreshProfile) await refreshProfile();
            setMsg({ type: "success", text: "Profile saved. Agents and chat will use this context." });
        } catch (e) {
            setMsg({ type: "error", text: e.message || "Save failed." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="kb-panel">
            <div className="kb-toggle-btn" style={{ cursor: "default" }}>
                <span>Profile</span>
                <span>Startup journey</span>
                <Link to="/onboarding" className="dash-tag" style={{ marginLeft: "auto", textDecoration: "none" }}>
                    Re-run wizard
                </Link>
            </div>
            <div className="kb-body">
                <div className="dash-row">
                    <div className="dash-field">
                        <label>Company name</label>
                        <input className="dash-input" value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Industry</label>
                        <input className="dash-input" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
                    </div>
                </div>
                <div className="dash-field">
                    <label>One-liner</label>
                    <input className="dash-input" value={form.one_liner} onChange={(e) => update("one_liner", e.target.value)} />
                </div>
                <div className="dash-field">
                    <label>Lifecycle stage</label>
                    <div className="onboard-stage-grid">
                        {STAGES.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                className={`onboard-stage-btn ${form.lifecycle_stage === s.value ? "active" : ""}`}
                                onClick={() => update("lifecycle_stage", s.value)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="dash-field">
                    <label>Problem</label>
                    <textarea className="dash-textarea" rows={3} value={form.problem} onChange={(e) => update("problem", e.target.value)} />
                </div>
                <div className="dash-field">
                    <label>Solution</label>
                    <textarea className="dash-textarea" rows={3} value={form.solution} onChange={(e) => update("solution", e.target.value)} />
                </div>
                <div className="dash-field">
                    <label>Product / architecture</label>
                    <textarea className="dash-textarea" rows={4} value={form.product_description} onChange={(e) => update("product_description", e.target.value)} />
                </div>

                <div className="dash-section-title" style={{ marginTop: 8 }}>Funding progress</div>
                <label className="onboard-check">
                    <input
                        type="checkbox"
                        checked={form.is_actively_raising}
                        onChange={(e) => update("is_actively_raising", e.target.checked)}
                    />
                    Actively raising
                </label>
                <div className="dash-row">
                    <div className="dash-field">
                        <label>Target raise</label>
                        <input className="dash-input" placeholder="$1.5M" value={form.target_raise} onChange={(e) => update("target_raise", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Amount raised</label>
                        <input className="dash-input" placeholder="$150K" value={form.amount_raised} onChange={(e) => update("amount_raised", e.target.value)} />
                    </div>
                    <div className="dash-field">
                        <label>Investor count</label>
                        <input className="dash-input" type="number" min="0" value={form.investor_count} onChange={(e) => update("investor_count", e.target.value)} />
                    </div>
                </div>
                <div className="dash-field">
                    <label>Investor notes</label>
                    <textarea className="dash-textarea" rows={2} value={form.investor_notes} onChange={(e) => update("investor_notes", e.target.value)}
                        placeholder="2 angels committed, lead intro pending..." />
                </div>

                <div className="kb-actions">
                    <button className="kb-upload-btn" type="button" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save profile"}
                    </button>
                </div>
                {msg && <p className={`kb-msg ${msg.type}`}>{msg.text}</p>}
            </div>
        </div>
    );
}

/**
 * Lightweight cofounder sharing — invite a cofounder via a shareable link
 * (they join your team_id and see the same StartupProfile, pipeline,
 * roadmap, and runway tracker). No roles/permissions, just shared data.
 */
function TeamPanel() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [inviteUrl, setInviteUrl] = useState("");
    const [creating, setCreating] = useState(false);
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiGetTeamMembers();
            setMembers(data.members || []);
        } catch (err) {
            setError(err.message || "Could not load your team.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleInvite = async () => {
        setCreating(true); setError(""); setCopied(false);
        try {
            const res = await apiCreateTeamInvite();
            setInviteUrl(res.invite_url);
        } catch (err) {
            setError(err.message || "Could not create an invite link.");
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API can be blocked (e.g. insecure context) — the link is still selectable in the input.
        }
    };

    return (
        <div className="kb-panel">
            <div className="kb-toggle-btn" style={{ cursor: "default" }}>
                <span>Team</span>
                <span>{members.length} member{members.length === 1 ? "" : "s"}</span>
            </div>
            <div className="kb-body">
                <p className="kb-desc">
                    Invite a cofounder to share your startup profile, fundraise pipeline, roadmap, and
                    runway tracker — everyone on the team sees and edits the same data.
                </p>

                {loading ? (
                    <p className="kb-docs-empty">Loading...</p>
                ) : (
                    <div className="team-member-list">
                        {members.map((m) => (
                            <div className="integration-row" key={m.id}>
                                <div className="integration-info">
                                    <span className="integration-dot connected" />
                                    <div>
                                        <div className="integration-name">{m.full_name || m.email}{m.is_you && " (you)"}</div>
                                        <div className="integration-sub">{m.email}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="team-invite-row">
                    <button type="button" className="dash-btn-secondary" disabled={creating} onClick={handleInvite}>
                        <UsersIcon size={14} /> {creating ? "Creating..." : "Invite a cofounder"}
                    </button>
                    {inviteUrl && (
                        <div className="invite-link-box">
                            <input className="dash-input" readOnly value={inviteUrl} onFocus={(e) => e.target.select()} />
                            <button type="button" className="dash-copy-btn" onClick={handleCopy}>
                                {copied ? <><CheckCircleIcon size={13} /> Copied</> : <><CopyIcon size={13} /> Copy</>}
                            </button>
                        </div>
                    )}
                </div>
                {inviteUrl && (
                    <p className="kb-desc" style={{ fontSize: 11.5 }}>
                        Expires in 72 hours, single use. Anyone with this link who signs in will join your workspace.
                    </p>
                )}
                {error && <div className="dash-error">{error}</div>}
            </div>
        </div>
    );
}

function ShareDocPanel() {
    const [text, setText] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState(null);
    const [docs, setDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const fileInputRef = useRef(null);

    const loadDocs = useCallback(async () => {
        setLoadingDocs(true);
        try { const r = await apiListDocuments(); setDocs(r.documents || []); }
        catch { setDocs([]); }
        finally { setLoadingDocs(false); }
    }, []);

    useEffect(() => { loadDocs(); }, [loadDocs]);

    const handleUpload = async () => {
        if (!text.trim()) return;
        setUploading(true); setUploadMsg(null);
        try {
            const res = await apiUploadDocument(text.trim(), sourceName.trim() || "document");
            setUploadMsg({ type: "success", text: `Stored ${res.chunks_stored} chunk(s) as "${res.source_name}".` });
            setText(""); setSourceName(""); loadDocs();
        } catch (e) {
            setUploadMsg({ type: "error", text: `Error: ${e.message}` });
        } finally { setUploading(false); }
    };

    const handleFileUpload = async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const ext = (file.name || "").toLowerCase();
        if (!ext.endsWith(".pdf") && !ext.endsWith(".docx")) {
            setUploadMsg({ type: "error", text: "Only PDF and DOCX files are allowed." });
            return;
        }
        setFileUploading(true); setUploadMsg(null);
        try {
            const res = await apiUploadDocumentFile(file);
            setUploadMsg({ type: "success", text: `Stored ${res.chunks_stored} chunk(s) from "${res.source_name}".` });
            // Mark deck-ish uploads on profile when filename suggests a deck
            if (/deck|pitch/i.test(file.name)) {
                try { await apiUpdateProfile({ has_deck_upload: true }); } catch { /* ignore */ }
            }
            loadDocs();
        } catch (err) {
            setUploadMsg({ type: "error", text: `Error: ${err.message}` });
        } finally {
            setFileUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="kb-panel">
            <div className="kb-toggle-btn" style={{ cursor: "default" }}>
                <span>Documents</span>
                <span>Knowledge base</span>
                {docs.length > 0 && <span className="kb-badge">{docs.length}</span>}
            </div>
            <div className="kb-body">
                <p className="kb-desc">
                    Upload pitch decks, architecture docs, and research for semantic search by agents.
                </p>
                <div className="kb-file-upload-row">
                    <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="kb-file-input"
                        onChange={handleFileUpload} disabled={fileUploading} />
                    <button type="button" className="kb-upload-file-btn" onClick={() => fileInputRef.current?.click()}
                        disabled={fileUploading}>
                        {fileUploading ? "Uploading..." : "Upload PDF/DOCX"}
                    </button>
                </div>
                <p className="kb-divider">or paste text below</p>
                <div className="kb-field">
                    <input className="kb-input" type="text"
                        placeholder="Document name (e.g. pitch_deck, architecture)"
                        value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
                </div>
                <textarea className="kb-textarea"
                    placeholder="Paste full document text here..."
                    value={text} onChange={(e) => { setText(e.target.value); setUploadMsg(null); }} rows={5} />
                <div className="kb-actions">
                    <button className="kb-upload-btn" onClick={handleUpload} disabled={!text.trim() || uploading}>
                        {uploading ? "Embedding..." : "Upload to Knowledge Base"}
                    </button>
                    <button className="kb-refresh-btn" onClick={loadDocs} title="Refresh">Refresh</button>
                </div>
                {uploadMsg && <p className={`kb-msg ${uploadMsg.type}`}>{uploadMsg.text}</p>}
                <div className="kb-docs-section">
                    <p className="kb-docs-label">Stored documents</p>
                    {loadingDocs ? <p className="kb-docs-empty">Loading...</p>
                        : docs.length === 0 ? <p className="kb-docs-empty">No documents uploaded yet.</p>
                            : (
                                <div className="kb-doc-list">
                                    {docs.map((d) => (
                                        <div key={d.file_name} className="kb-doc-item">
                                            <span className="kb-doc-name">{d.file_name}</span>
                                            <span className="kb-doc-count">{d.count} chunks</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                </div>
            </div>
        </div>
    );
}

/**
 * Connect/disconnect Notion + Google (OAuth) and set the Notion parent page
 * used for pipeline sync. Reads ?integration=&status= from the OAuth
 * callback redirect to surface a one-time success/error message.
 */
function IntegrationsPanel() {
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyProvider, setBusyProvider] = useState(null);
    const [msg, setMsg] = useState(null);
    const [notionPageInput, setNotionPageInput] = useState("");
    const [savingNotionPage, setSavingNotionPage] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiGetIntegrationsStatus();
            const list = res.integrations || [];
            setIntegrations(list);
            const notion = list.find((i) => i.provider === "notion");
            if (notion?.notion_parent_page_id) setNotionPageInput(notion.notion_parent_page_id);
        } catch {
            setIntegrations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const integration = params.get("integration");
        const status = params.get("status");
        if (integration && status) {
            setMsg({
                type: status === "connected" ? "success" : "error",
                text: status === "connected"
                    ? `${PROVIDER_LABELS[integration] || integration} connected.`
                    : `Could not connect ${PROVIDER_LABELS[integration] || integration}. Please try again.`,
            });
            params.delete("integration"); params.delete("status");
            const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
            window.history.replaceState({}, "", clean);
        }
    }, []);

    const handleConnect = async (provider) => {
        setBusyProvider(provider); setMsg(null);
        try {
            const { authorize_url } = await apiGetConnectUrl(provider);
            window.location.href = authorize_url;
        } catch (e) {
            setMsg({ type: "error", text: e.message || `Could not start ${provider} connection.` });
            setBusyProvider(null);
        }
    };

    const handleDisconnect = async (provider) => {
        setBusyProvider(provider); setMsg(null);
        try {
            await apiDisconnectIntegration(provider);
            await load();
        } catch (e) {
            setMsg({ type: "error", text: e.message || `Could not disconnect ${provider}.` });
        } finally {
            setBusyProvider(null);
        }
    };

    const saveNotionPage = async () => {
        if (!notionPageInput.trim()) return;
        setSavingNotionPage(true); setMsg(null);
        try {
            await apiUpdateNotionSettings(notionPageInput.trim());
            setMsg({ type: "success", text: "Notion parent page saved — the pipeline database will be created there on next sync." });
            await load();
        } catch (e) {
            setMsg({ type: "error", text: e.message || "Could not save the Notion page." });
        } finally {
            setSavingNotionPage(false);
        }
    };

    const notion = integrations.find((i) => i.provider === "notion");

    return (
        <div className="kb-panel">
            <div className="kb-toggle-btn" style={{ cursor: "default" }}>
                <span>Integrations</span>
                <span>Notion &amp; Google</span>
            </div>
            <div className="kb-body">
                <p className="kb-desc">
                    Connect Notion to mirror your fundraise pipeline, and Google to schedule investor
                    follow-ups on Calendar and browse Drive files for your data room.
                </p>
                {loading ? (
                    <p className="kb-docs-empty">Loading...</p>
                ) : (
                    ["notion", "google"].map((provider) => {
                        const info = integrations.find((i) => i.provider === provider);
                        const busy = busyProvider === provider;
                        return (
                            <div className="integration-row" key={provider}>
                                <div className="integration-info">
                                    <span className={`integration-dot ${info?.connected ? "connected" : ""}`} />
                                    <div>
                                        <div className="integration-name">{PROVIDER_LABELS[provider]}</div>
                                        <div className="integration-sub">
                                            {!info?.configured
                                                ? "Not configured on this server"
                                                : info?.connected
                                                    ? info.account_label || "Connected"
                                                    : "Not connected"}
                                        </div>
                                    </div>
                                </div>
                                <div className="integration-actions">
                                    {info?.connected ? (
                                        <button type="button" className="dash-btn-secondary" disabled={busy}
                                            onClick={() => handleDisconnect(provider)}>
                                            {busy ? "..." : "Disconnect"}
                                        </button>
                                    ) : (
                                        <button type="button" className="kb-upload-file-btn" disabled={busy || !info?.configured}
                                            onClick={() => handleConnect(provider)}>
                                            <LinkIcon size={13} /> {busy ? "Redirecting..." : "Connect"}
                                        </button>
                                    )}
                                </div>
                                {provider === "notion" && notion?.connected && (
                                    <div className="integration-notion-settings">
                                        <input className="kb-input" style={{ flex: 1, minWidth: 220 }}
                                            placeholder="Paste a Notion page URL you've shared with Pitchmate"
                                            value={notionPageInput}
                                            onChange={(e) => setNotionPageInput(e.target.value)} />
                                        <button type="button" className="kb-upload-file-btn" disabled={savingNotionPage || !notionPageInput.trim()}
                                            onClick={saveNotionPage}>
                                            {savingNotionPage ? "Saving..." : "Save page"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
                {msg && <p className={`kb-msg ${msg.type}`}>{msg.text}</p>}
            </div>
        </div>
    );
}
