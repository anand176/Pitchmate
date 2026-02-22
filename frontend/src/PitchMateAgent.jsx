import { useState, useRef, useEffect, useCallback } from "react";
import { apiPitchmate, apiLogout, apiUploadDocument, apiListDocuments } from "./pitchmateApi";

const STARTER_PROMPTS = [
    "Help me validate my product idea",
    "Write me a 60-second elevator pitch",
    "Review my pitch deck problem slide",
    "How do I approach seed investors?",
    "What's my go-to-market strategy?",
    "Draft an investor outreach email",
];

const AGENT_STEPS = [
    { id: "understand", label: "Understanding your request" },
    { id: "analyze", label: "Analyzing with AI agents" },
    { id: "synthesize", label: "Synthesizing response" },
    { id: "respond", label: "Generating advice" },
];

function formatMessage(text) {
    if (typeof text !== "string") return "";
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code style="background:rgba(99,60,255,0.15);padding:1px 5px;border-radius:4px;font-size:12px;">$1</code>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:#c4b5ff;margin:12px 0 6px;">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-size:15px;font-weight:700;color:#c4b5ff;margin:14px 0 6px;">$1</h2>')
        .replace(/^#{1}\s(.+)$/gm, '<h2 style="font-size:16px;font-weight:800;color:#e8e6f0;margin:14px 0 8px;">$1</h2>')
        .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;"><span style="color:#633cff;flex-shrink:0;">▸</span><span>$1</span></div>')
        .replace(/\[(HOOK|PROBLEM|SOLUTION|TRACTION|ASK|✅|⚠️|💡|📊|🏆)\]/g,
            '<span style="display:inline-block;padding:1px 8px;background:rgba(255,90,60,0.15);border:1px solid rgba(255,90,60,0.3);border-radius:4px;color:#ff8a72;font-size:11px;font-weight:600;margin:0 2px;">$1</span>')
        .replace(/\n/g, "<br/>");
}

// ─── Knowledge Base Panel ────────────────────────────────────────────────────

function KnowledgeBasePanel() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [sourceName, setSourceName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState(null); // { type: 'success'|'error', text }
    const [docs, setDocs] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    const loadDocs = useCallback(async () => {
        setLoadingDocs(true);
        try {
            const res = await apiListDocuments();
            setDocs(res.documents || []);
        } catch (e) {
            setDocs([]);
        } finally {
            setLoadingDocs(false);
        }
    }, []);

    useEffect(() => {
        if (open) loadDocs();
    }, [open, loadDocs]);

    const handleUpload = async () => {
        if (!text.trim()) return;
        setUploading(true);
        setUploadMsg(null);
        try {
            const res = await apiUploadDocument(text.trim(), sourceName.trim() || "pitch_context");
            setUploadMsg({ type: "success", text: `✓ Stored ${res.chunks_stored} chunk(s) as "${res.source_name}"` });
            setText("");
            setSourceName("");
            loadDocs();
        } catch (e) {
            setUploadMsg({ type: "error", text: `✗ ${e.message}` });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="kb-panel">
            <button className="kb-toggle-btn" onClick={() => setOpen((o) => !o)}>
                <span>💡</span>
                <span>Share Your Idea</span>
                <svg style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className="kb-body">
                    <p className="kb-desc">
                        Describe your startup idea, paste pitch deck content, or share market research. Agents will use this as context.
                    </p>

                    <div className="kb-field">
                        <input
                            className="kb-input"
                            type="text"
                            placeholder="Document name (e.g. pitch_context, market_research)"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                        />
                    </div>

                    <textarea
                        className="kb-textarea"
                        placeholder="Describe your startup idea, problem you're solving, target market, team background, or paste your pitch deck content here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                    />

                    <div className="kb-actions">
                        <button className="kb-upload-btn" onClick={handleUpload} disabled={!text.trim() || uploading}>
                            {uploading ? "Processing..." : "Submit Idea Context"}
                        </button>
                        <button className="kb-refresh-btn" onClick={loadDocs} title="Refresh document list">
                            ↻
                        </button>
                    </div>

                    {uploadMsg && (
                        <p className={`kb-msg ${uploadMsg.type}`}>{uploadMsg.text}</p>
                    )}

                    {/* Document list */}
                    <div className="kb-docs-section">
                        <p className="kb-docs-label">Submitted contexts</p>
                        {loadingDocs ? (
                            <p className="kb-docs-empty">Loading...</p>
                        ) : docs.length === 0 ? (
                            <p className="kb-docs-empty">No context submitted yet.</p>
                        ) : (
                            <div className="kb-doc-list">
                                {docs.map((d) => (
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

                {/* Left sidebar — Share Your Idea */}
                <aside className="pm-sidebar">
                    <KnowledgeBasePanel />
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

                        {messages.map((msg, i) => (
                            <div key={i} className={`pm-message ${msg.role}`}>
                                <div className={`pm-avatar ${msg.role === "assistant" ? "ai" : "user-av"}`}>
                                    {msg.role === "assistant" ? <span style={{ fontWeight: 800, fontSize: 13 }}>P</span> : userInitial}
                                </div>
                                <div
                                    className={`pm-bubble ${msg.role === "assistant" ? "ai" : "user"} ${msg.isError ? "err" : ""}`}
                                    dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? formatMessage(msg.content) : msg.content }}
                                />
                            </div>
                        ))}

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
  .pm-app::before { content:''; position:fixed; top:-40%; left:-20%; width:70%; height:70%; background:radial-gradient(ellipse,rgba(99,60,255,.12) 0%,transparent 70%); pointer-events:none; z-index:0; }
  .pm-app::after { content:''; position:fixed; bottom:-30%; right:-10%; width:50%; height:60%; background:radial-gradient(ellipse,rgba(255,90,60,.08) 0%,transparent 70%); pointer-events:none; z-index:0; }

  .pm-header { padding:18px 28px; border-bottom:1px solid rgba(255,255,255,.06); display:flex; align-items:center; gap:14px; position:sticky; top:0; z-index:20; backdrop-filter:blur(10px); background:rgba(10,10,15,.9); flex-shrink:0; }
  .pm-logo-mark { width:36px; height:36px; background:linear-gradient(135deg,#633cff,#ff5a3c); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:800; color:white; flex-shrink:0; }
  .pm-header-text h1 { font-size:16px; font-weight:800; letter-spacing:-.5px; background:linear-gradient(90deg,#e8e6f0,#9b8cff); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .pm-header-text p { font-size:9px; color:rgba(255,255,255,.3); font-family:'DM Mono',monospace; letter-spacing:1.5px; margin-top:1px; }
  .pm-header-right { margin-left:auto; display:flex; align-items:center; gap:10px; }
  .pm-session-pill { padding:5px 12px; background:rgba(99,60,255,.15); border:1px solid rgba(99,60,255,.3); border-radius:100px; font-size:11px; font-family:'DM Mono',monospace; color:#9b8cff; display:flex; align-items:center; gap:6px; }
  .pulse { width:6px; height:6px; background:#633cff; border-radius:50%; animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.4; transform:scale(.8); } }
  .pm-user-badge { width:30px; height:30px; background:linear-gradient(135deg,#633cff,#ff5a3c); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:white; }
  .pm-logout-btn { padding:6px 12px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:8px; color:rgba(255,255,255,.6); font-size:12px; font-family:'Syne',sans-serif; font-weight:600; cursor:pointer; transition:all .2s; }
  .pm-logout-btn:hover { background:rgba(255,90,60,.15); border-color:rgba(255,90,60,.3); color:#ff8a72; }

  /* Body layout */
  .pm-body { display:flex; flex:1; overflow:hidden; position:relative; z-index:5; }

  /* Sidebar */
  .pm-sidebar { width:280px; flex-shrink:0; border-right:1px solid rgba(255,255,255,.06); overflow-y:auto; padding:16px; background:rgba(255,255,255,.01); }
  .pm-sidebar::-webkit-scrollbar { width:3px; }
  .pm-sidebar::-webkit-scrollbar-thumb { background:rgba(99,60,255,.2); border-radius:2px; }

  /* KB Panel */
  .kb-panel { border-radius:12px; overflow:hidden; }
  .kb-toggle-btn { width:100%; padding:12px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:12px; color:rgba(255,255,255,.7); font-size:13px; font-family:'Syne',sans-serif; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .2s; text-align:left; }
  .kb-toggle-btn:hover { background:rgba(99,60,255,.1); border-color:rgba(99,60,255,.3); color:#c4b5ff; }
  .kb-body { padding:14px; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06); border-top:none; border-radius:0 0 12px 12px; display:flex; flex-direction:column; gap:10px; }
  .kb-desc { font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.35); line-height:1.6; }
  .kb-field input.kb-input { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:8px 12px; color:#e8e6f0; font-size:12px; font-family:'Syne',sans-serif; outline:none; transition:border-color .2s; }
  .kb-field input.kb-input::placeholder { color:rgba(255,255,255,.2); }
  .kb-field input.kb-input:focus { border-color:rgba(99,60,255,.5); }
  .kb-textarea { width:100%; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:8px; padding:10px 12px; color:#e8e6f0; font-size:12px; font-family:'Syne',sans-serif; resize:vertical; outline:none; min-height:90px; transition:border-color .2s; }
  .kb-textarea::placeholder { color:rgba(255,255,255,.2); }
  .kb-textarea:focus { border-color:rgba(99,60,255,.5); }
  .kb-actions { display:flex; gap:8px; align-items:center; }
  .kb-upload-btn { flex:1; padding:9px 12px; background:linear-gradient(135deg,#633cff,#4a2acc); border:none; border-radius:8px; color:white; font-size:12px; font-family:'Syne',sans-serif; font-weight:700; cursor:pointer; transition:all .2s; }
  .kb-upload-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(99,60,255,.4); }
  .kb-upload-btn:disabled { opacity:.5; cursor:not-allowed; }
  .kb-refresh-btn { padding:8px 10px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:8px; color:rgba(255,255,255,.5); font-size:14px; cursor:pointer; transition:all .2s; }
  .kb-refresh-btn:hover { background:rgba(255,255,255,.1); color:#e8e6f0; }
  .kb-msg { font-size:11px; font-family:'DM Mono',monospace; padding:8px 10px; border-radius:6px; }
  .kb-msg.success { background:rgba(99,255,155,.08); color:rgba(99,255,155,.8); border:1px solid rgba(99,255,155,.15); }
  .kb-msg.error { background:rgba(255,60,60,.08); color:#ff8a8a; border:1px solid rgba(255,60,60,.15); }
  .kb-docs-section { border-top:1px solid rgba(255,255,255,.05); padding-top:10px; }
  .kb-docs-label { font-size:10px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.3); letter-spacing:.5px; margin-bottom:8px; }
  .kb-docs-empty { font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.2); }
  .kb-doc-list { display:flex; flex-direction:column; gap:6px; }
  .kb-doc-item { display:flex; align-items:center; gap:8px; padding:7px 10px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:8px; }
  .kb-doc-icon { font-size:13px; flex-shrink:0; }
  .kb-doc-name { flex:1; font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.6); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .kb-doc-count { font-size:10px; font-family:'DM Mono',monospace; color:rgba(99,60,255,.7); background:rgba(99,60,255,.1); padding:2px 6px; border-radius:4px; flex-shrink:0; }

  /* Main chat */
  .pm-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .pm-chat-area { flex:1; overflow-y:auto; padding:28px 32px; display:flex; flex-direction:column; gap:20px; }
  .pm-chat-area::-webkit-scrollbar { width:4px; }
  .pm-chat-area::-webkit-scrollbar-thumb { background:rgba(99,60,255,.3); border-radius:2px; }

  .pm-welcome { text-align:center; padding:48px 20px 32px; animation:fadeUp .6s ease; }
  .pm-welcome-icon { width:64px; height:64px; background:linear-gradient(135deg,#633cff,#ff5a3c); border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; box-shadow:0 8px 32px rgba(99,60,255,.4); }

  .pm-welcome h2 { font-size:26px; font-weight:800; letter-spacing:-1px; margin-bottom:10px; background:linear-gradient(135deg,#e8e6f0 0%,#9b8cff 50%,#ff5a3c 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
  .pm-welcome p { color:rgba(255,255,255,.45); font-size:13px; line-height:1.7; max-width:440px; margin:0 auto 28px; }
  .pm-starters { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; max-width:520px; margin:0 auto; }
  .pm-starter-btn { padding:11px 14px; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:10px; color:rgba(255,255,255,.65); font-size:12px; font-family:'Syne',sans-serif; cursor:pointer; text-align:left; transition:all .2s; line-height:1.4; }
  .pm-starter-btn:hover { background:rgba(99,60,255,.12); border-color:rgba(99,60,255,.35); color:#e8e6f0; transform:translateY(-1px); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

  .pm-message { display:flex; gap:14px; animation:fadeUp .3s ease; }
  .pm-message.user { flex-direction:row-reverse; }
  .pm-avatar { width:32px; height:32px; border-radius:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; }
  .pm-avatar.ai { background:linear-gradient(135deg,#633cff,#ff5a3c); }
  .pm-avatar.user-av { background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.12); }
  .pm-bubble { max-width:80%; padding:14px 16px; border-radius:16px; font-size:13.5px; line-height:1.7; }
  .pm-bubble.ai { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-top-left-radius:4px; font-family:'DM Mono',monospace; font-size:13px; }
  .pm-bubble.user { background:linear-gradient(135deg,rgba(99,60,255,.25),rgba(99,60,255,.15)); border:1px solid rgba(99,60,255,.25); border-top-right-radius:4px; }
  .pm-bubble.err { background:rgba(255,60,60,.08); border-color:rgba(255,60,60,.2); color:#ff8a8a; }
  .pm-bubble.ai strong { color:#c4b5ff; }

  .pm-agent-steps { display:flex; flex-direction:column; gap:8px; padding:14px 16px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:14px; border-top-left-radius:4px; max-width:76%; margin-left:46px; animation:fadeUp .3s ease; }
  .pm-step { display:flex; align-items:center; gap:10px; font-family:'DM Mono',monospace; font-size:11px; color:rgba(255,255,255,.25); transition:all .3s; }
  .pm-step.active { color:#9b8cff; }
  .pm-step.done { color:rgba(99,255,155,.6); }
  .pm-step-dot { width:16px; height:16px; flex-shrink:0; text-align:center; font-size:12px; }
  .pm-step.active .pm-step-dot { animation:blink 1s ease-in-out infinite; }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }

  .pm-input-area { padding:14px 24px 20px; position:relative; z-index:10; border-top:1px solid rgba(255,255,255,.05); flex-shrink:0; }
  .pm-input-wrap { display:flex; gap:10px; padding:6px 6px 6px 16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:14px; align-items:flex-end; transition:border-color .2s; }
  .pm-input-wrap:focus-within { border-color:rgba(99,60,255,.5); background:rgba(99,60,255,.06); }
  .pm-input-wrap textarea { flex:1; background:none; border:none; outline:none; color:#e8e6f0; font-family:'Syne',sans-serif; font-size:14px; resize:none; max-height:120px; min-height:24px; line-height:1.5; padding:7px 0; }
  .pm-input-wrap textarea::placeholder { color:rgba(255,255,255,.25); }
  .pm-send-btn { width:38px; height:38px; border-radius:10px; background:linear-gradient(135deg,#633cff,#4a2acc); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .2s; flex-shrink:0; }
  .pm-send-btn:hover:not(:disabled) { transform:scale(1.05); box-shadow:0 4px 20px rgba(99,60,255,.4); }
  .pm-send-btn:disabled { opacity:.4; cursor:not-allowed; }
  .pm-hint { margin-top:8px; text-align:center; font-size:11px; font-family:'DM Mono',monospace; color:rgba(255,255,255,.2); }
  .pm-hint kbd { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:4px; padding:1px 5px; font-family:'DM Mono',monospace; font-size:10px; }
`;
