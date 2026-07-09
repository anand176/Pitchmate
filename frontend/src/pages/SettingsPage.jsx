import { useState, useRef, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
    apiUploadDocument, apiUploadDocumentFile, apiListDocuments,
    apiSaveContext, apiSaveContextFromFile, apiGetContext,
} from "../pitchmateApi";

/**
 * SettingsPage - startup idea context (per chat session) + knowledge base
 * document uploads (global, semantic search). Moved here from the old chat
 * sidebar so tab pages stay focused on their own data.
 */
export default function SettingsPage() {
    const { sessionId, setSessionId } = useOutletContext();

    return (
        <div>
            <div className="dash-page-header">
                <h2>Settings</h2>
                <p>Share your startup idea and upload documents so every agent has the context it needs.</p>
            </div>

            <IdeaContextPanel sessionId={sessionId} setSessionId={setSessionId} />
            <div style={{ height: 16 }} />
            <ShareDocPanel />
        </div>
    );
}

function IdeaContextPanel({ sessionId, setSessionId }) {
    const [context, setContext] = useState("");
    const [saved, setSaved] = useState("");
    const [saving, setSaving] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);
    const [msg, setMsg] = useState(null);
    const ideaFileInputRef = useRef(null);

    useEffect(() => {
        apiGetContext(sessionId)
            .then((r) => { setContext(r.context || ""); setSaved(r.context || ""); })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const handleSave = async () => {
        if (!context.trim()) return;
        setSaving(true); setMsg(null);
        try {
            const data = await apiSaveContext(context.trim(), sessionId);
            setSaved(context.trim());
            if (data.session_id && setSessionId) setSessionId(data.session_id);
            setMsg({ type: "success", text: "Saved: Context will be used in your chat session." });
        } catch (e) {
            setMsg({ type: "error", text: `Error: ${e.message}` });
        } finally { setSaving(false); }
    };

    const handleIdeaFileUpload = async (e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const ext = (file.name || "").toLowerCase();
        if (!ext.endsWith(".pdf") && !ext.endsWith(".docx")) {
            setMsg({ type: "error", text: "Only PDF and DOCX files are allowed." });
            return;
        }
        setFileUploading(true); setMsg(null);
        try {
            const data = await apiSaveContextFromFile(file, sessionId);
            setContext(data.context || "");
            setSaved(data.context || "");
            if (data.session_id && setSessionId) setSessionId(data.session_id);
            setMsg({ type: "success", text: "Saved: Context imported from file." });
        } catch (err) {
            setMsg({ type: "error", text: `Error: ${err.message}` });
        } finally {
            setFileUploading(false);
            if (ideaFileInputRef.current) ideaFileInputRef.current.value = "";
        }
    };

    const isDirty = context.trim() !== saved.trim();

    return (
        <div className="kb-panel">
            <div className="kb-toggle-btn" style={{ cursor: "default" }}>
                <span>Idea Desk</span>
                <span>Share Your Idea</span>
                {saved && <span className="kb-saved-dot" title="Context saved" />}
            </div>
            <div className="kb-body">
                <p className="kb-desc">
                    Describe your startup idea. It's used across your chat and every dashboard tab.
                </p>
                <div className="kb-file-upload-row">
                    <input ref={ideaFileInputRef} type="file" accept=".pdf,.docx" className="kb-file-input"
                        onChange={handleIdeaFileUpload} disabled={fileUploading} />
                    <button type="button" className="kb-upload-file-btn" onClick={() => ideaFileInputRef.current?.click()}
                        disabled={fileUploading}>
                        {fileUploading ? "Uploading..." : "Upload PDF/DOCX"}
                    </button>
                </div>
                <p className="kb-divider">or paste text below</p>
                <textarea
                    className="kb-textarea"
                    placeholder="What's your startup? What problem does it solve? Who are your customers?"
                    value={context}
                    onChange={(e) => { setContext(e.target.value); setMsg(null); }}
                    rows={6}
                />
                <div className="kb-actions">
                    <button className="kb-upload-btn" onClick={handleSave} disabled={!context.trim() || saving || !isDirty}>
                        {saving ? "Saving..." : saved ? "Update Context" : "Save Context"}
                    </button>
                </div>
                {msg && <p className={`kb-msg ${msg.type}`}>{msg.text}</p>}
                {saved && !isDirty && (
                    <p className="kb-desc" style={{ color: "#404040" }}>Agents know your idea.</p>
                )}
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
                <span>Archive</span>
                <span>Share Your Doc</span>
                {docs.length > 0 && <span className="kb-badge">{docs.length}</span>}
            </div>
            <div className="kb-body">
                <p className="kb-desc">
                    Upload large documents (market research, pitch deck text, competitor analysis) for semantic search by agents.
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
                        placeholder="Document name (e.g. market_research, competitor_analysis)"
                        value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
                </div>
                <textarea className="kb-textarea"
                    placeholder="Paste full document text here: market reports, pitch deck slides, customer research, investor memos..."
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
