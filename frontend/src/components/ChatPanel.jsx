import { useState, useRef, useEffect } from "react";
import { apiPitchmate, apiDownloadArtifact } from "../pitchmateApi";
import { formatMessage } from "../theme";

const STARTER_PROMPTS = [
    "Help me validate my product idea",
    "Write me a 60-second elevator pitch",
    "What questions will investors ask me?",
    "Draft an investor outreach email",
];

const AGENT_STEPS = [
    { id: "understand", label: "Understanding your request" },
    { id: "analyze", label: "Analyzing with AI agents" },
    { id: "synthesize", label: "Synthesizing response" },
    { id: "respond", label: "Generating advice" },
];

/**
 * ChatPanel - slide-out chat panel (replaces the old full-page chat UI).
 * Lives at the dashboard shell level so it can be opened from any tab via the
 * floating action button, while `sessionId`/`messages` persist across tab
 * navigation (state is lifted to `DashboardLayout`).
 */
export default function ChatPanel({ open, onClose, messages, setMessages, sessionId, setSessionId, profileComplete }) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeStepIdx, setActiveStepIdx] = useState(-1);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages, loading]);

    useEffect(() => {
        if (open && textareaRef.current) textareaRef.current.focus();
    }, [open]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
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
                content: `Error: ${err.message || "Something went wrong. Please try again."}`,
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const onlySystemNudge = messages.length === 1 && messages[0]?.isSystem;
    const showWelcome = messages.length === 0 && !loading;
    const showNudgeStarters = onlySystemNudge && !loading;

    return (
        <>
            <div className={`chat-overlay ${open ? "open" : ""}`} onClick={onClose} />
            <div className={`chat-panel ${open ? "open" : ""}`} role="dialog" aria-label="Pitchmate chat">
                <div className="chat-panel-header">
                    <div className="dash-logo-mark" style={{ width: 28, height: 28, fontSize: 12 }}>P</div>
                    <h3>Ask Pitchmate</h3>
                    {sessionId && (
                        <span className="dash-tag" style={{ marginLeft: 6 }}>session active</span>
                    )}
                    <button
                        type="button"
                        className="dash-btn-ghost"
                        style={{ marginLeft: sessionId ? 8 : "auto", padding: "4px 10px" }}
                        onClick={() => { setMessages([]); setSessionId(null); setInput(""); }}
                        title="Start a new chat"
                    >
                        New
                    </button>
                    <button type="button" className="chat-panel-close" onClick={onClose} title="Close chat" aria-label="Close chat">X</button>
                </div>

                <div className="chat-messages" ref={chatRef}>
                    {showWelcome && (
                        <div className="chat-welcome">
                            <div className="chat-welcome-icon">
                                    <span style={{ fontWeight: 900, fontSize: 18, fontFamily: "'Orbitron', monospace", color: "#00ff88", textShadow: "0 0 8px rgba(0,255,136,.6)" }}>P</span>
                            </div>
                            <h4>Ask me anything</h4>
                            <p>
                                {profileComplete
                                    ? "Profile loaded. Ask me to validate market or draft your deck."
                                    : "I can validate your market, draft outreach emails, review your deck, and more."}
                            </p>
                            <div className="chat-starters">
                                {STARTER_PROMPTS.map((p, i) => (
                                    <button key={i} className="chat-starter-btn" onClick={() => sendMessage(p)}>{p}</button>
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
                            <div key={i} className={`chat-message ${msg.role}`}>
                                <div className={`chat-avatar ${msg.role === "assistant" ? "ai" : "user-av"}`}>
                                    {msg.role === "assistant" ? <span style={{ fontWeight: 800, fontSize: 11 }}>P</span> : "U"}
                                </div>
                                <div className="chat-bubble-wrap">
                                    <div
                                        className={`chat-bubble ${msg.role === "assistant" ? "ai" : "user"} ${msg.isError ? "err" : ""} ${msg.isSystem ? "system" : ""}`}
                                        dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? formatMessage(msg.content) : msg.content }}
                                    />
                                    {downloadMatches.length > 0 && (
                                        <div className="chat-download-row">
                                            {downloadMatches.map((filename, j) => (
                                                <button
                                                    key={j}
                                                    type="button"
                                                    className="chat-download-btn"
                                                    onClick={() => apiDownloadArtifact(filename).catch(e => alert(e.message))}
                                                >
                                                    {filename.endsWith(".pdf") ? "PDF" : filename.endsWith(".docx") ? "DOCX" : "Download"}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {drawingUrl && (
                                        <div className="chat-download-row">
                                            <button
                                                type="button"
                                                className="chat-download-btn"
                                                onClick={() => window.open(drawingUrl, "_blank", "noopener,noreferrer")}
                                            >
                                                View drawing
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {showNudgeStarters && (
                        <div className="chat-starters" style={{ padding: "0 16px 12px" }}>
                            {STARTER_PROMPTS.map((p, i) => (
                                <button key={i} className="chat-starter-btn" onClick={() => sendMessage(p)}>{p}</button>
                            ))}
                        </div>
                    )}

                    {loading && (
                        <div className="chat-steps">
                            {AGENT_STEPS.map((step, i) => {
                                const state = i < activeStepIdx ? "done" : i === activeStepIdx ? "active" : "pending";
                                return (
                                    <div key={step.id} className={`chat-step ${state}`}>
                                        <div className="chat-step-dot">{state === "done" ? "OK" : state === "active" ? ">>" : "--"}</div>
                                        {step.label}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <div className="chat-input-wrap">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about your pitch, market, or investors..."
                            disabled={loading}
                            rows={1}
                        />
                        <button className="chat-send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading} title="Send (Enter)" aria-label="Send message">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                    <p className="chat-hint">
                        <kbd>Enter</kbd> to send | <kbd>Shift+Enter</kbd> new line
                    </p>
                </div>
            </div>
        </>
    );
}
