import { useState, useRef, useEffect } from "react";
import { apiPitchmate, apiDownloadArtifact, apiListDocuments } from "../pitchmateApi";
import { formatMessage } from "../theme";
import { SendIcon, CloseIcon, SparklesIcon, CheckCircleIcon, LogoMark, FileTextIcon } from "../icons";

const STARTER_PROMPTS = [
    "Tighten my problem & solution into a 60-second pitch",
    "What will investors push back on in my deck?",
    "Draft an investor outreach email for my stage",
    "Poke holes in my market sizing",
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
    const [docCount, setDocCount] = useState(null);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages, loading]);

    useEffect(() => {
        if (open && textareaRef.current) textareaRef.current.focus();
        // Refresh the knowledge-base doc count each time the panel opens so the
        // "grounded in N documents" line reflects any newly-uploaded files.
        if (open) {
            apiListDocuments()
                .then((d) => setDocCount((d?.documents || []).length))
                .catch(() => setDocCount(null));
        }
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
                    <div className="dash-logo-mark" style={{ width: 30, height: 30 }}>
                        <LogoMark size={16} />
                    </div>
                    <h3>Ask Pitchmate</h3>
                    {sessionId && (
                        <span className="dash-tag" style={{ marginLeft: 6 }}>session active</span>
                    )}
                    <button
                        type="button"
                        className="dash-btn-ghost"
                        style={{ marginLeft: sessionId ? 8 : "auto", padding: "5px 12px", minHeight: 32 }}
                        onClick={() => { setMessages([]); setSessionId(null); setInput(""); }}
                        title="Start a new chat"
                    >
                        New
                    </button>
                    <button type="button" className="chat-panel-close" onClick={onClose} title="Close chat" aria-label="Close chat">
                        <CloseIcon size={16} />
                    </button>
                </div>

                <div className="chat-messages" ref={chatRef}>
                    {showWelcome && (
                        <div className="chat-welcome">
                            <div className="chat-welcome-icon">
                                <SparklesIcon size={20} />
                            </div>
                            <h4>Refine with your co-pilot</h4>
                            <p>
                                {profileComplete
                                    ? "I know your startup. Use the tabs for structured deliverables — ask me here to refine them, stress-test your story, or draft outreach."
                                    : "Ask me to sharpen your pitch, stress-test your market, or draft outreach. Finish your profile so I can tailor answers to your startup."}
                            </p>
                            {docCount > 0 && (
                                <div className="dash-kb-note" style={{ marginBottom: 16 }}>
                                    <FileTextIcon size={15} />
                                    <span>Grounded in your <b>{docCount}</b> uploaded document{docCount === 1 ? "" : "s"}.</span>
                                </div>
                            )}
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
                                    {msg.role === "assistant" ? <SparklesIcon size={13} /> : "U"}
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
                                        <div className="chat-step-dot">{state === "done" && <CheckCircleIcon size={10} strokeWidth={2.5} style={{ color: "#FFFFFF" }} />}</div>
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
                            <SendIcon size={15} />
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
