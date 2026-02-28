import { useState, useRef, useEffect, useCallback } from "react";
import { apiPitchmate, apiLogout, apiUploadDocument, apiUploadDocumentFile, apiListDocuments, apiSaveContext, apiSaveContextFromFile, apiGetContext, apiDownloadArtifact } from "./pitchmateApi";

const STARTER_PROMPTS = [
    "Help me validate my product idea",
    "Write me a 60-second elevator pitch",
    "What questions will investors ask me?",
    "Review my pitch deck problem slide",
    "Draft an investor outreach email",
    "Create a deck / report for my product",
];

const AGENT_STEPS = [
    { id: "understand", label: "Understanding your request" },
    { id: "analyze", label: "Analyzing with AI agents" },
    { id: "synthesize", label: "Synthesizing response" },
    { id: "respond", label: "Generating advice" },
];

function escapeHtmlUrl(url) {
    return String(url)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatMessage(text) {
    if (typeof text !== "string") return "";
    let out = text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code style="background:rgba(14,165,233,0.15);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:#7dd3fc;margin:12px 0 6px;">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#7dd3fc;margin:14px 0 6px;">$1</h2>')
        .replace(/^#{1}\s(.+)$/gm, '<h2 style="font-size:16px;font-weight:800;color:#e8e6f0;margin:14px 0 8px;">$1</h2>')
        .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;"><span style="color:#0ea5e9;flex-shrink:0;">▸</span><span>$1</span></div>')
        .replace(/\[(HOOK|PROBLEM|SOLUTION|TRACTION|ASK|✅|⚠️|💡|📊|🏆)\]/g,
            '<span style="display:inline-block;padding:1px 8px;background:rgba(6,182,212,0.2);border:1px solid rgba(6,182,212,0.35);border-radius:4px;color:#67e8f9;font-size:11px;font-weight:600;margin:0 2px;">$1</span>');
    out = out.replace(/https?:\/\/[^\s<>"')\]]+/g, (url) => {
        const safe = escapeHtmlUrl(url);
        const isDrawio = /diagrams\.net|draw\.io/i.test(url);
        const label = isDrawio ? "View drawing" : "Open link";
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="pm-msg-link">${label}</a>`;
    });
    return out.replace(/\n/g, "<br/>");
}

// ─── Panel: Share Your Idea (plain text context, scoped to this chat session) ───

function IdeaContextPanel({ sessionId, setSessionId }) {
    const [open, setOpen] = useState(false);
    const [context, setContext] = useState("");
    const [saved, setSaved] = useState("");   // last saved value
    const [saving, setSaving] = useState(false);
    const [fileUploading, setFileUploading] = useState(false);
    const [msg, setMsg] = useState(null);
    const ideaFileInputRef = useRef(null);

    // Load context for current session when panel opens
    useEffect(() => {
        if (!open) return;
        apiGetContext(sessionId)
            .then(r => { setContext(r.context || ""); setSaved(r.context || ""); })
            .catch(() => { });
    }, [open, sessionId]);

    const handleSave = async () => {
        if (!context.trim()) return;
        setSaving(true); setMsg(null);
        try {
            const data = await apiSaveContext(context.trim(), sessionId);
            setSaved(context.trim());
            if (data.session_id && setSessionId) setSessionId(data.session_id);
            setMsg({ type: "success", text: "✓ Context saved for this chat — agents will use it in this conversation" });
        } catch (e) {
            setMsg({ type: "error", text: `✗ ${e.message}` });
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
            setMsg({ type: "success", text: "✓ Context saved from file — agents will use it in this conversation" });
        } catch (err) {
            setMsg({ type: "error", text: `✗ ${err.message}` });
        } finally {
            setFileUploading(false);
            if (ideaFileInputRef.current) ideaFileInputRef.current.value = "";
        }
    };

    const isDirty = context.trim() !== saved.trim();

    return (
        <div className="kb-panel">
            <button className="kb-toggle-btn" onClick={() => setOpen(o => !o)}>
                <span></span>
                <span>Share Your Idea</span>
                {saved && <span className="kb-saved-dot" title="Context saved" />}
                <svg style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className="kb-body">
                    <p className="kb-desc">
                        Describe your startup idea. It is included in <strong>this chat session</strong> only — no need to repeat yourself in this conversation.
                    </p>
                    <div className="kb-file-upload-row">
                        <input ref={ideaFileInputRef} type="file" accept=".pdf,.docx" className="kb-file-input"
                            onChange={handleIdeaFileUpload} disabled={fileUploading} />
                        <button type="button" className="kb-upload-file-btn" onClick={() => ideaFileInputRef.current?.click()}
                            disabled={fileUploading}>
                            {fileUploading ? "Uploading…" : "Upload"}
                        </button>
                    </div>
                    <p className="kb-divider">— or paste text below —</p>
                    <textarea
                        className="kb-textarea"
                        placeholder="What's your startup? What problem does it solve? Who are your customers? Paste your pitch summary, problem statement, or key context here..."
                        value={context}
                        onChange={e => { setContext(e.target.value); setMsg(null); }}
                        rows={6}
                    />
                    <div className="kb-actions">
                        <button className="kb-upload-btn" onClick={handleSave}
                            disabled={!context.trim() || saving || !isDirty}>
                            {saving ? "Saving..." : saved ? "Update Context" : "Save Context"}
                        </button>
                    </div>
                    {msg && <p className={`kb-msg ${msg.type}`}>{msg.text}</p>}
                    {saved && !isDirty && (
                        <p className="kb-desc" style={{ color: "rgba(103,232,249,0.8)", marginTop: 4 }}>
                            ✓ Agents know your idea
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Panel: Share Your Doc (pgvector knowledge base) ──────────────────────────

function ShareDocPanel() {
    const [open, setOpen] = useState(false);
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

    useEffect(() => { if (open) loadDocs(); }, [open, loadDocs]);

    const handleUpload = async () => {
        if (!text.trim()) return;
        setUploading(true); setUploadMsg(null);
        try {
            const res = await apiUploadDocument(text.trim(), sourceName.trim() || "document");
            setUploadMsg({ type: "success", text: `✓ Stored ${res.chunks_stored} chunk(s) as "${res.source_name}"` });
            setText(""); setSourceName(""); loadDocs();
        } catch (e) {
            setUploadMsg({ type: "error", text: `✗ ${e.message}` });
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
            setUploadMsg({ type: "success", text: `✓ Stored ${res.chunks_stored} chunk(s) from "${res.source_name}"` });
            loadDocs();
        } catch (err) {
            setUploadMsg({ type: "error", text: `✗ ${err.message}` });
        } finally {
            setFileUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="kb-panel" style={{ marginTop: 10 }}>
            <button className="kb-toggle-btn" onClick={() => setOpen(o => !o)}>
                <span></span>
                <span>Share Your Doc</span>
                {docs.length > 0 && <span className="kb-badge">{docs.length}</span>}
                <svg style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className="kb-body">
                    <p className="kb-desc">
                        Upload large documents (market research, pitch deck text, competitor analysis) for semantic search by agents.
                    </p>
                    <div className="kb-file-upload-row">
                        <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="kb-file-input"
                            onChange={handleFileUpload} disabled={fileUploading} />
                        <button type="button" className="kb-upload-file-btn" onClick={() => fileInputRef.current?.click()}
                            disabled={fileUploading}>
                            {fileUploading ? "Uploading…" : "Upload"}
                        </button>
                    </div>
                    <p className="kb-divider">— or paste text below —</p>
                    <div className="kb-field">
                        <input className="kb-input" type="text"
                            placeholder="Document name (e.g. market_research, competitor_analysis)"
                            value={sourceName} onChange={e => setSourceName(e.target.value)} />
                    </div>
                    <textarea className="kb-textarea"
                        placeholder="Paste full document text here — market reports, pitch deck slides, customer research, investor memos..."
                        value={text} onChange={e => { setText(e.target.value); setUploadMsg(null); }} rows={5} />
                    <div className="kb-actions">
                        <button className="kb-upload-btn" onClick={handleUpload} disabled={!text.trim() || uploading}>
                            {uploading ? "Embedding..." : "Upload to Knowledge Base"}
                        </button>
                        <button className="kb-refresh-btn" onClick={loadDocs} title="Refresh">↻</button>
                    </div>
                    {uploadMsg && <p className={`kb-msg ${uploadMsg.type}`}>{uploadMsg.text}</p>}
                    <div className="kb-docs-section">
                        <p className="kb-docs-label">Stored documents</p>
                        {loadingDocs ? <p className="kb-docs-empty">Loading...</p>
                            : docs.length === 0 ? <p className="kb-docs-empty">No documents uploaded yet.</p>
                                : (
                                    <div className="kb-doc-list">
                                        {docs.map(d => (
                                            <div key={d.file_name} className="kb-doc-item">
                                                <span className="kb-doc-icon">📄</span>
                                                <span className="kb-doc-name">{d.file_name}</span>
                                                <span className="kb-doc-count">{d.count} chunks</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Agent UI ───────────────────────────────────────────────────────────

export default function PitchMateAgent({ user }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeStepIdx, setActiveStepIdx] = useState(-1);
    const [sessionId, setSessionId] = useState(null);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages, loading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const sendMessage = async (text) => {
        const query = (text || input).trim();
        if (!query || loading) return;

        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: query }]);
        setLoading(true);

        let stepIdx = 0;
        setActiveStepIdx(0);
        const stepTimer = setInterval(() => {
            stepIdx = Math.min(stepIdx + 1, AGENT_STEPS.length - 1);
            setActiveStepIdx(stepIdx);
        }, 1800);

        try {
            const data = await apiPitchmate(query, sessionId);
            clearInterval(stepTimer);
            setActiveStepIdx(-1);
            if (data.session_id) setSessionId(data.session_id);
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        } catch (err) {
            clearInterval(stepTimer);
            setActiveStepIdx(-1);
            setMessages((prev) => [...prev, {
                role: "assistant",
                content: `⚠️ ${err.message || "Something went wrong. Please try again."}`,
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const userInitial = (user?.email || "U")[0].toUpperCase();

    return (
        <div className="pm-app">
            <style>{STYLES}</style>

            {/* Header */}
            <header className="pm-header">
                <div className="pm-logo-mark">P</div>
                <div className="pm-header-text">
                    <h1>Pitchmate</h1>
                    <p>AI PITCH CO-PILOT</p>
                </div>
                <div className="pm-header-right">
                    <button type="button" className="pm-new-chat-btn" onClick={() => { setMessages([]); setSessionId(null); setInput(""); }} title="Start a new chat">
                        New chat
                    </button>
                    {sessionId && (
                        <div className="pm-session-pill" title="Multi-turn session active">
                            <div className="pulse" /> Session active
                        </div>
                    )}
                    <div className="pm-user-badge">{userInitial}</div>
                    <button className="pm-logout-btn" onClick={apiLogout}>Sign Out</button>
                </div>
            </header>

            {/* Body: sidebar + chat */}
            <div className="pm-body">

                {/* Left sidebar — Share Your Idea + Share Your Doc */}
                <aside className="pm-sidebar">
                    <IdeaContextPanel sessionId={sessionId} setSessionId={setSessionId} />
                    <ShareDocPanel />
                </aside>


                {/* Right — Chat */}
                <div className="pm-main">
                    <div className="pm-chat-area" ref={chatRef}>
                        {messages.length === 0 && !loading && (
                            <div className="pm-welcome">
                                <div className="pm-welcome-icon">
                                    <span style={{ fontWeight: 800, fontSize: 28, color: 'white', letterSpacing: '-1px', fontFamily: 'Syne,sans-serif' }}>P</span>
                                </div>
                                <h2>Ready to build your pitch?</h2>
                                <p>
                                    Share your startup idea in the sidebar,
                                    then ask me to review your deck, validate your market, or find investors.
                                </p>
                                <div className="pm-starters">
                                    {STARTER_PROMPTS.map((p, i) => (
                                        <button key={i} className="pm-starter-btn" onClick={() => sendMessage(p)}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => {
                            let downloadMatches = [];
                            let drawingUrl = null;
                            if (msg.role === "assistant" && typeof msg.content === "string") {
                                const fromLabel = [...(msg.content.matchAll(/Download:\s*([^\s]+\.(?:pdf|txt|docx))/gi) || [])].map(m => m[1]);
                                const fromFilename = [...(msg.content.matchAll(/(deck_[^\s]+\.(?:pdf|docx)|executive_summary_[^\s]+\.pdf|due_diligence_qa_[^\s]+\.pdf|elevator_pitch_[^\s]+\.txt)/gi) || [])].map(m => m[1]);
                                const seen = new Set();
                                downloadMatches = [...fromLabel, ...fromFilename].filter(f => {
                                    if (seen.has(f)) return false;
                                    seen.add(f);
                                    return true;
                                });
                                const urlMatch = msg.content.match(/https?:\/\/[^\s<>"')\]]+/);
                                if (urlMatch && /diagrams\.net|draw\.io/i.test(urlMatch[0])) drawingUrl = urlMatch[0];
                            }
                            return (
                                <div key={i} className={`pm-message ${msg.role}`}>
                                    <div className={`pm-avatar ${msg.role === "assistant" ? "ai" : "user-av"}`}>
                                        {msg.role === "assistant" ? <span style={{ fontWeight: 800, fontSize: 13 }}>P</span> : userInitial}
                                    </div>
                                    <div className="pm-bubble-wrap">
                                        <div
                                            className={`pm-bubble ${msg.role === "assistant" ? "ai" : "user"} ${msg.isError ? "err" : ""}`}
                                            dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? formatMessage(msg.content) : msg.content }}
                                        />
                                        {downloadMatches.length > 0 && (
                                            <div className="pm-download-row">
                                                {downloadMatches.map((filename, j) => (
                                                    <button
                                                        key={j}
                                                        type="button"
                                                        className="pm-download-btn"
                                                        onClick={() => apiDownloadArtifact(filename).catch(e => alert(e.message))}
                                                    >
                                                        {filename.endsWith(".pdf") ? "📄 Download PDF" : filename.endsWith(".docx") ? "📄 Download DOCX" : "📥 Download"}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {drawingUrl && (
                                            <div className="pm-download-row">
                                                <button
                                                    type="button"
                                                    className="pm-download-btn pm-view-drawing-btn"
                                                    onClick={() => window.open(drawingUrl, "_blank", "noopener,noreferrer")}
                                                >
                                                    🎨 View drawing
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="pm-agent-steps">
                                <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>
                                    Pitchmate agents thinking...
                                </div>
                                {AGENT_STEPS.map((step, i) => {
                                    const state = i < activeStepIdx ? "done" : i === activeStepIdx ? "active" : "pending";
                                    return (
                                        <div key={step.id} className={`pm-step ${state}`}>
                                            <div className="pm-step-dot">{state === "done" ? "✓" : state === "active" ? "◎" : "○"}</div>
                                            {step.label}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="pm-input-area">
                        <div className="pm-input-wrap">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Pitchmate anything about your pitch, market, or investors..."
                                disabled={loading}
                                rows={1}
                            />
                            <button className="pm-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading} title="Send (Enter)">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>
                        <p className="pm-hint">
                            Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
                            {sessionId && <span> · 🔗 Multi-turn session active</span>}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .pm-app { min-height:100vh; background:#0a0a0f; font-family:'Syne',sans-serif; color:#e8e6f0; display:flex; flex-direction:column; position:relative; overflow:hidden; }
  .pm-app::before { content:''; position:fixed; top:-40%; left:-20%; width:70%; height:70%; background:radial-gradient(ellipse,rgba(14,165,233,.12) 0%,transparent 70%); pointer-events:none; z-index:0; }
  .pm-app::after { content:''; position:fixed; bottom:-30%; right:-10%; width:50%; height:60%; background:radial-gradient(ellipse,rgba(6,182,212,.08) 0%,transparent 70%); pointer-events:none; z-index:0; }

  .pm-header { padding:18px 28px; border-bottom:1px solid rgba(255,255,255,.06); display:flex; align-items:center; gap:14px; position:sticky; top:0; z-index:20; backdrop-filter:blur(10px); background:rgba(10,10,15,.9); flex-shrink:0; }
  .pm-logo-mark { width:36px; height:36px; background:linear-gradient(135deg,#0ea5e9,#06b6d4); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:white; flex-shrink:0; }
  .pm-header-text h1 { font-size:16px; font-weight:800; letter-spacing:-.5px; background:linear-gradient(90deg,#e8e6f0,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .pm-header-text p { font-size:9px; color:rgba(255,255,255,.3); font-family:'DM Mono',monospace; letter-spacing:1.5px; margin-top:1px; }
  .pm-header-right { margin-left:auto; display:flex; align-items:center; gap:10px; }
  .pm-session-pill { padding:5px 12px; background:rgba(14,165,233,.15); border:1px solid rgba(14,165,233,.3); border-radius:100px; font-size:11px; font-family:'DM Mono',monospace; color:#38bdf8; display:flex; align-items:center; gap:6px; }
  .pulse { width:6px; height:6px; background:#0ea5e9; border-radius:50%; animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.8); } }
  .pm-user-badge { width:30px; height:30px; background:linear-gradient(135deg,#0ea5e9,#06b6d4); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:white; }
  .pm-new-chat-btn { padding:6px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:8px; color:rgba(255,255,255,.6); font-size:12px; font-family:'Inter',sans-serif; font-weight:600; cursor:pointer; transition:all .2s; }
  .pm-new-chat-btn:hover { background:rgba(6,182,212,.15); border-color:rgba(6,182,212,.3); color:#67e8f9; }
  .pm-logout-btn { padding:6px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:8px; color:rgba(255,255,255,.6); font-size:12px; font-family:'Inter',sans-serif; font-weight:600; cursor:pointer; transition:all .2s; }
  .pm-logout-btn:hover { background:rgba(6,182,212,.15); border-color:rgba(6,182,212,.3); color:#67e8f9; }

  /* Body layout */
  .pm-body { display:flex; flex:1; overflow:hidden; position:relative; z-index:5; }

  /* Sidebar */
  .pm-sidebar { width:280px; flex-shrink:0; border-right:1px solid rgba(255,255,255,.06); overflow-y:auto; padding:16px; background:rgba(255,255,255,.01); }
  .pm-sidebar::-webkit-scrollbar { width:3px; }
  .pm-sidebar::-webkit-scrollbar-thumb { background:rgba(14,165,233,.2); border-radius:2px; }

  /* KB Panel */
  .kb-panel { border-radius:12px; overflow:hidden; }
  .kb-toggle-btn { width:100%; padding:12px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:12px; color:rgba(255,255,255,.7); font-size:13px; font-family:'Syne',sans-serif; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .2s; text-align:left; }
  .kb-toggle-btn:hover { background:rgba(14,165,233,.1); border-color:rgba(14,165,233,.3); color:#7dd3fc; }
  .kb-body { padding:14px; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06); border-top:none; border-radius:0 0 12px 12px; display:flex; flex-direction:column; gap:10px; }
  .kb-desc { font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.35); line-height:1.6; }
  .kb-field input.kb-input { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:8px 12px; color:#e8e6f0; font-size:12px; font-family:'Syne',sans-serif; outline:none; transition:border-color .2s; }
  .kb-field input.kb-input::placeholder { color:rgba(255,255,255,.2); }
  .kb-field input.kb-input:focus { border-color:rgba(14,165,233,.5); }
  .kb-textarea { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:10px 12px; color:#e8e6f0; font-size:12px; font-family:'Syne',sans-serif; resize:vertical; outline:none; min-height:90px; transition:border-color .2s; }
  .kb-textarea::placeholder { color:rgba(255,255,255,.2); }
  .kb-textarea:focus { border-color:rgba(14,165,233,.5); }
  .kb-file-upload-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .kb-file-input { position:absolute; width:0; height:0; opacity:0; pointer-events:none; }
  .kb-upload-file-btn { padding:8px 12px; background:rgba(14,165,233,.2); border:1px dashed rgba(14,165,233,.5); border-radius:8px; color:#7dd3fc; font-size:12px; font-family:'Inter',sans-serif; font-weight:600; cursor:pointer; transition:all .2s; }
  .kb-upload-file-btn:hover:not(:disabled) { background:rgba(14,165,233,.3); border-color:rgba(14,165,233,.7); }
  .kb-upload-file-btn:disabled { opacity:.6; cursor:not-allowed; }
  .kb-divider { font-size:11px; color:rgba(255,255,255,.4); margin:8px 0; text-align:center; }
  .kb-actions { display:flex; gap:8px; align-items:center; }
  .kb-upload-btn { flex:1; padding:9px 12px; background:linear-gradient(135deg,#0ea5e9,#0284c7); border:none; border-radius:8px; color:white; font-size:12px; font-family:'Inter',sans-serif; font-weight:700; cursor:pointer; transition:all .2s; }
  .kb-upload-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(14,165,233,.4); }
  .kb-upload-btn:disabled { opacity:.5; cursor:not-allowed; }
  .kb-refresh-btn { padding:8px 10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; color:rgba(255,255,255,.5); font-size:14px; cursor:pointer; transition:all .2s; }
  .kb-refresh-btn:hover { background:rgba(255,255,255,.1); color:#e8e6f0; }
  .kb-msg { font-size:11px; font-family:'DM Mono',monospace; padding:8px 10px; border-radius:6px; }
  .kb-msg.success { background:rgba(6,182,212,.1); color:rgba(103,232,249,.9); border:1px solid rgba(6,182,212,.2); }
  .kb-msg.error { background:rgba(255,60,60,.08); color:#ff8a8a; border:1px solid rgba(255,60,60,.15); }
  .kb-docs-section { border-top:1px solid rgba(255,255,255,.05); padding-top:10px; }
  .kb-docs-label { font-size:10px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.3); letter-spacing:.5px; margin-bottom:8px; }
  .kb-docs-empty { font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.2); }
  .kb-doc-list { display:flex; flex-direction:column; gap:6px; }
  .kb-doc-item { display:flex; align-items:center; gap:8px; padding:7px 10px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:8px; }
  .kb-doc-icon { font-size:13px; flex-shrink:0; }
  .kb-doc-name { flex:1; font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.6); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .kb-doc-count { font-size:10px; font-family:'DM Mono',monospace; color:rgba(14,165,233,.8); background:rgba(14,165,233,.1); padding:2px 6px; border-radius:4px; flex-shrink:0; }
  .kb-saved-dot { width:7px; height:7px; background:#67e8f9; border-radius:50%; box-shadow:0 0 6px rgba(103,232,249,.6); flex-shrink:0; }
  .kb-badge { font-size:10px; font-family:'DM Mono',monospace; color:rgba(6,182,212,.9); background:rgba(6,182,212,.15); border:1px solid rgba(6,182,212,.25); padding:1px 6px; border-radius:10px; flex-shrink:0; }

  /* Main chat */
  .pm-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .pm-chat-area { flex:1; overflow-y:auto; padding:28px 32px; display:flex; flex-direction:column; gap:20px; }
  .pm-chat-area::-webkit-scrollbar { width:4px; }
  .pm-chat-area::-webkit-scrollbar-thumb { background:rgba(14,165,233,.3); border-radius:2px; }

  .pm-welcome { text-align:center; padding:48px 20px 32px; animation:fadeUp .6s ease; }
  .pm-welcome-icon { width:64px; height:64px; background:linear-gradient(135deg,#0ea5e9,#06b6d4); border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; box-shadow:0 8px 32px rgba(14,165,233,.4); }

  .pm-welcome h2 { font-size:26px; font-weight:800; letter-spacing:-1px; margin-bottom:10px; background:linear-gradient(135deg,#e8e6f0 0%,#38bdf8 50%,#67e8f9 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .pm-welcome p { color:rgba(255,255,255,.45); font-size:13px; line-height:1.7; max-width:440px; margin:0 auto 28px; }
  .pm-starters { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; max-width:520px; margin:0 auto; }
  .pm-starter-btn { padding:11px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; color:rgba(255,255,255,.65); font-size:12px; font-family:'Syne',sans-serif; cursor:pointer; text-align:left; transition:all .2s; line-height:1.4; }
  .pm-starter-btn:hover { background:rgba(14,165,233,.12); border-color:rgba(14,165,233,.35); color:#e8e6f0; transform:translateY(-1px); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

  .pm-message { display:flex; gap:14px; animation:fadeUp .3s ease; }
  .pm-message.user { flex-direction:row-reverse; }
  .pm-avatar { width:32px; height:32px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; }
  .pm-avatar.ai { background:linear-gradient(135deg,#0ea5e9,#06b6d4); }
  .pm-avatar.user-av { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.12); }
  .pm-bubble { max-width:80%; padding:14px 16px; border-radius:16px; font-size:13.5px; line-height:1.7; }
  .pm-bubble.ai { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-top-left-radius:4px; font-family:'DM Mono',monospace; font-size:13px; }
  .pm-bubble.user { background:linear-gradient(135deg,rgba(14,165,233,.25),rgba(14,165,233,.15)); border:1px solid rgba(14,165,233,.25); border-top-right-radius:4px; }
  .pm-bubble.err { background:rgba(255,60,60,.08); border-color:rgba(255,60,60,.2); color:#ff8a8a; }
  .pm-bubble.ai strong { color:#7dd3fc; }
  .pm-bubble-wrap { max-width:80%; display:flex; flex-direction:column; gap:8px; }
  .pm-download-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
  .pm-download-btn { padding:8px 14px; background:rgba(14,165,233,.2); border:1px solid rgba(14,165,233,.4); border-radius:8px; color:#7dd3fc; font-size:12px; font-family:'Inter',sans-serif; font-weight:600; cursor:pointer; transition:all .2s; }
  .pm-download-btn:hover { background:rgba(14,165,233,.3); border-color:rgba(14,165,233,.5); color:#e8e6f0; }
  .pm-msg-link { color:#7dd3fc; text-decoration:underline; }
  .pm-msg-link:hover { color:#bae6fd; }
  .pm-view-drawing-btn { color:inherit; text-decoration:none; }

  .pm-agent-steps { display:flex; flex-direction:column; gap:8px; padding:14px 16px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:14px; border-top-left-radius:4px; max-width:76%; margin-left:46px; animation:fadeUp .3s ease; }
  .pm-step { display:flex; align-items:center; gap:10px; font-family:'DM Mono',monospace; font-size:11px; color:rgba(255,255,255,.25); transition:all .3s; }
  .pm-step.active { color:#38bdf8; }
  .pm-step.done { color:rgba(103,232,249,.7); }
  .pm-step-dot { width:16px; height:16px; flex-shrink:0; text-align:center; font-size:12px; }
  .pm-step.active .pm-step-dot { animation:blink 1s ease-in-out infinite; }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }

  .pm-input-area { padding:14px 24px 20px; position:relative; z-index:10; border-top:1px solid rgba(255,255,255,.05); flex-shrink:0; }
  .pm-input-wrap { display:flex; gap:10px; padding:6px 6px 6px 16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:14px; align-items:flex-end; transition:border-color .2s; }
  .pm-input-wrap:focus-within { border-color:rgba(14,165,233,.5); background:rgba(14,165,233,.06); }
  .pm-input-wrap textarea { flex:1; background:none; border:none; outline:none; color:#e8e6f0; font-family:'Syne',sans-serif; font-size:14px; resize:none; max-height:120px; min-height:24px; line-height:1.5; padding:7px 0; }
  .pm-input-wrap textarea::placeholder { color:rgba(255,255,255,.25); }
  .pm-send-btn { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#0ea5e9,#0284c7); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
  .pm-send-btn:hover:not(:disabled) { transform:scale(1.05); box-shadow:0 4px 20px rgba(14,165,233,.4); }
  .pm-send-btn:disabled { opacity:.4; cursor:not-allowed; }
  .pm-hint { margin-top:8px; text-align:center; font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.2); }
  .pm-hint kbd { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:4px; padding:1px 5px; font-family:'DM Mono',monospace; font-size:10px; }
`;
