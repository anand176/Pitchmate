import { useState, useRef, useEffect } from "react";
import { apiPitchmate, apiDownloadArtifact, apiListDocuments, apiGetAvailableAgents } from "../pitchmateApi";
import { formatMessage } from "../theme";
import {
    SendIcon, CloseIcon, SparklesIcon, CheckCircleIcon, LogoMark, FileTextIcon,
    MaximizeIcon, MinimizeIcon, ChevronDownIcon,
} from "../icons";
import { motion, AnimatePresence, useReducedMotion, SPRING_SOFT, SPRING, EASE } from "../motion";

const ROOT_AGENT = "pitchmate_agent";

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

const overlayVariants = { closed: { opacity: 0 }, open: { opacity: 1 } };
const panelVariants = { closed: { x: "100%" }, open: { x: 0 } };
const bubbleVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (delay) => ({ opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE, delay } }),
};

/**
 * ChatPanel - slide-out chat panel (replaces the old full-page chat UI).
 * Lives at the dashboard shell level so it can be opened from any tab via the
 * floating action button, while `sessionId`/`messages` persist across tab
 * navigation (state is lifted to `DashboardLayout`).
 *
 * Always mounted regardless of `open` (open/close is purely visual — a
 * position spring, not a mount/unmount) so chat state survives both route
 * changes and the panel being closed.
 */
export default function ChatPanel({ open, onClose, messages, setMessages, sessionId, setSessionId, profileComplete }) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeStepIdx, setActiveStepIdx] = useState(-1);
    const [docCount, setDocCount] = useState(null);
    // Maximize/agent-selection are purely local UI state — ChatPanel stays
    // mounted the whole session (see file docstring), so these survive close/reopen.
    const [maximized, setMaximized] = useState(false);
    const [agents, setAgents] = useState([{ name: ROOT_AGENT, label: "Auto (root agent)", description: "" }]);
    const [agentName, setAgentName] = useState(ROOT_AGENT);
    const [agentMenuOpen, setAgentMenuOpen] = useState(false);
    const chatRef = useRef(null);
    const textareaRef = useRef(null);
    const agentMenuRef = useRef(null);
    const prevMessagesLen = useRef(messages.length);
    const reduceMotion = useReducedMotion();
    const activeAgent = agents.find((a) => a.name === agentName) || agents[0];

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages, loading]);

    useEffect(() => {
        if (open && textareaRef.current) textareaRef.current.focus();
        // Refresh the knowledge-base doc count + available agent list each time
        // the panel opens (agents can change if an MCP server just finished init).
        if (open) {
            apiListDocuments()
                .then((d) => setDocCount((d?.documents || []).length))
                .catch(() => setDocCount(null));
            apiGetAvailableAgents()
                .then((list) => { if (Array.isArray(list) && list.length) setAgents(list); })
                .catch(() => {});
        }
    }, [open]);

    useEffect(() => {
        if (!agentMenuOpen) return;
        const onOutside = (e) => {
            if (agentMenuRef.current && !agentMenuRef.current.contains(e.target)) setAgentMenuOpen(false);
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [agentMenuOpen]);

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
            const data = await apiPitchmate(query, sessionId, agentName !== ROOT_AGENT ? agentName : null);
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

    const selectAgent = (agent) => {
        setAgentMenuOpen(false);
        if (agent.name === agentName) return;
        setAgentName(agent.name);
        setMessages((prev) => [...prev, {
            role: "assistant",
            isSystem: true,
            content: agent.name === ROOT_AGENT
                ? "Switched back to the **root agent** — it'll auto-route to whichever specialist fits your question."
                : `Now talking directly to **${agent.label}**. It won't hand off to other specialists until you switch back.`,
        }]);
    };

    const onlySystemNudge = messages.length === 1 && messages[0]?.isSystem;
    const showWelcome = messages.length === 0 && !loading;
    const showNudgeStarters = onlySystemNudge && !loading;

    // Newly-appended messages (since the last render) stagger in ~40ms apart;
    // messages already on screen (e.g. after reopening the panel) don't replay.
    const firstNewIdx = prevMessagesLen.current;
    useEffect(() => {
        prevMessagesLen.current = messages.length;
    }, [messages.length]);

    // Under reduced motion the panel/overlay still use these variants (so the
    // open/closed value is the single source of truth) but with a 0-duration
    // transition, which fully disables the animated frames rather than just
    // shortening them — the element jumps straight to its resting position.
    const instant = { duration: 0 };

    return (
        <>
            <motion.div
                className="chat-overlay"
                initial={false}
                variants={overlayVariants}
                animate={open ? "open" : "closed"}
                transition={reduceMotion ? instant : { duration: 0.22, ease: EASE }}
                style={{ pointerEvents: open ? "auto" : "none" }}
                onClick={onClose}
            />
            <motion.div
                className={`chat-panel ${maximized ? "maximized" : ""}`}
                role="dialog"
                aria-label="Pitchmate chat"
                initial={false}
                variants={panelVariants}
                animate={open ? "open" : "closed"}
                transition={reduceMotion ? instant : SPRING_SOFT}
            >
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
                        style={{ marginLeft: "auto", padding: "5px 12px", minHeight: 32 }}
                        onClick={() => { setMessages([]); setSessionId(null); setInput(""); prevMessagesLen.current = 0; }}
                        title="Start a new chat"
                    >
                        New
                    </button>
                    <button
                        type="button"
                        className="chat-panel-close"
                        onClick={() => setMaximized((v) => !v)}
                        title={maximized ? "Restore" : "Maximize"}
                        aria-label={maximized ? "Restore chat panel" : "Maximize chat panel"}
                    >
                        {maximized ? <MinimizeIcon size={15} /> : <MaximizeIcon size={15} />}
                    </button>
                    <button type="button" className="chat-panel-close" onClick={onClose} title="Close chat" aria-label="Close chat">
                        <CloseIcon size={16} />
                    </button>
                </div>

                <div className="chat-messages" ref={chatRef}>
                    {showWelcome && (
                        <div className="chat-welcome">
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
                                    <motion.button
                                        key={i}
                                        className="chat-starter-btn"
                                        onClick={() => sendMessage(p)}
                                        whileHover={reduceMotion ? undefined : { x: 2 }}
                                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                                    >
                                        {p}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg, i) => {
                            let downloadMatches = [];
                            let drawingUrl = null;
                            let bubbleContent = msg.content;
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
                                if (urlMatch && /diagrams\.net|draw\.io/i.test(urlMatch[0])) {
                                    drawingUrl = urlMatch[0];
                                    // The "View drawing" pill button below already surfaces this
                                    // link — strip the raw markdown link line from the bubble so
                                    // it isn't shown a second time (garbled, since formatMessage
                                    // doesn't parse markdown [label](url) syntax).
                                    bubbleContent = bubbleContent
                                        .replace(/\[[^\]]*\]\(\s*https?:\/\/[^\s)]+\s*\)/g, "")
                                        .replace(drawingUrl, "")
                                        .replace(/\n{3,}/g, "\n\n")
                                        .trim();
                                }
                            }
                            const isNew = i >= firstNewIdx;
                            const staggerDelay = isNew ? Math.min(i - firstNewIdx, 4) * 0.04 : 0;
                            return (
                                <motion.div
                                    key={i}
                                    layout={!reduceMotion}
                                    className={`chat-message ${msg.role}${msg.isSystem ? " system" : ""}`}
                                    custom={staggerDelay}
                                    initial={reduceMotion || !isNew ? false : "hidden"}
                                    animate="visible"
                                    variants={reduceMotion ? undefined : bubbleVariants}
                                    exit={reduceMotion ? undefined : { opacity: 0 }}
                                >
                                    {!msg.isSystem && (
                                        <div className={`chat-avatar ${msg.role === "assistant" ? "ai" : "user-av"}`}>
                                            {msg.role === "assistant" ? <SparklesIcon size={13} /> : "U"}
                                        </div>
                                    )}
                                    <div className="chat-bubble-wrap">
                                        <div
                                            className={`chat-bubble ${msg.role === "assistant" ? "ai" : "user"} ${msg.isError ? "err" : ""} ${msg.isSystem ? "system" : ""}`}
                                            dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? formatMessage(bubbleContent) : msg.content }}
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
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {showNudgeStarters && (
                        <div className="chat-starters" style={{ padding: "0 16px 12px" }}>
                            {STARTER_PROMPTS.map((p, i) => (
                                <motion.button
                                    key={i}
                                    className="chat-starter-btn"
                                    onClick={() => sendMessage(p)}
                                    whileHover={reduceMotion ? undefined : { y: -1 }}
                                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                                >
                                    {p}
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {loading && (
                        <div className="chat-steps">
                            {AGENT_STEPS.map((step, i) => {
                                const state = i < activeStepIdx ? "done" : i === activeStepIdx ? "active" : "pending";
                                return (
                                    <motion.div
                                        key={step.id}
                                        className={`chat-step ${state}`}
                                        animate={{ opacity: state === "pending" ? 0.55 : 1 }}
                                        transition={{ duration: 0.2, ease: EASE }}
                                    >
                                        <div className="chat-step-dot">
                                            {state === "done" && (
                                                reduceMotion ? (
                                                    <CheckCircleIcon size={10} strokeWidth={2.5} style={{ color: "#FFFFFF" }} />
                                                ) : (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={SPRING}
                                                        style={{ display: "flex" }}
                                                    >
                                                        <CheckCircleIcon size={10} strokeWidth={2.5} style={{ color: "#FFFFFF" }} />
                                                    </motion.span>
                                                )
                                            )}
                                        </div>
                                        {step.label}
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="chat-input-area">
                    <div className="chat-agent-picker" ref={agentMenuRef}>
                        <button
                            type="button"
                            className="chat-agent-btn"
                            onClick={() => setAgentMenuOpen((v) => !v)}
                            title="Choose which agent to talk to"
                            aria-expanded={agentMenuOpen}
                        >
                            {activeAgent?.name !== ROOT_AGENT && <SparklesIcon size={12} />}
                            <span>{activeAgent?.label || "Auto (root agent)"}</span>
                            <ChevronDownIcon size={13} />
                        </button>
                        <AnimatePresence>
                            {agentMenuOpen && (
                                <motion.div
                                    className="chat-agent-menu"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 4 }}
                                    transition={{ duration: 0.14 }}
                                >
                                    {agents.map((a) => (
                                        <button
                                            type="button"
                                            key={a.name}
                                            className={`chat-agent-option ${a.name === agentName ? "active" : ""}`}
                                            onClick={() => selectAgent(a)}
                                        >
                                            <span className="chat-agent-option-label">{a.label}</span>
                                            {a.description && <span className="chat-agent-option-desc">{a.description}</span>}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                        <motion.button
                            className="chat-send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                            title="Send (Enter)"
                            aria-label="Send message"
                            whileHover={reduceMotion || !input.trim() || loading ? undefined : { scale: 1.06 }}
                            whileTap={reduceMotion || !input.trim() || loading ? undefined : { scale: 0.96 }}
                        >
                            <SendIcon size={15} />
                        </motion.button>
                    </div>
                    <p className="chat-hint">
                        <kbd>Enter</kbd> to send | <kbd>Shift+Enter</kbd> new line
                    </p>
                </div>
            </motion.div>
        </>
    );
}
