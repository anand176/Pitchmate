import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    apiUploadDocument, apiUploadDocumentFile, apiListDocuments,
    apiGetProfile, apiUpdateProfile, apiSaveContext,
} from "../pitchmateApi";
import { useDashboardContext } from "../dashboardContext";

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

            <ProfilePanelPanel refreshProfile={refreshProfile} sessionId={sessionId} setSessionId={setSessionId} />
            <div style={{ height: 16 }} />
            <ShareDocPanel />
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
                                            <span className="kb-doc-icon">DOC</span>
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
