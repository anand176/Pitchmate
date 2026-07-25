import { useCallback, useEffect, useRef, useState } from "react";
import {
    apiGetSimulatorScenarios, apiStartSimulator, apiSimulatorTurn,
    apiGetSimulatorHistory, apiSimulatorSpeak,
} from "../pitchmateApi";
import { PhoneIcon, MicIcon, VolumeIcon, VolumeOffIcon } from "../icons";
import { relativeTime } from "../useAnalysisModule";

function scoreTone(score) {
    if (score == null) return "";
    if (score >= 7) return "warm";
    if (score >= 4) return "lukewarm";
    return "dead";
}

/**
 * Call Practice — roleplay a sales/investor call against an AI persona.
 * Each answer gets a private 1-10 score + one-line coaching note; the
 * persona's side is optionally spoken aloud via ElevenLabs (proxied through
 * /simulator/speak so the API key never reaches the browser). Completed
 * calls save an overall score + debrief to team-shared practice history.
 */
export default function SimulatorPage() {
    const [scenarios, setScenarios] = useState([]);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [voiceOn, setVoiceOn] = useState(true);
    const [loadingScenarios, setLoadingScenarios] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState(null);
    const [customPersona, setCustomPersona] = useState("");
    const [history, setHistory] = useState([]);

    const [phase, setPhase] = useState("setup"); // setup | starting | call | debrief
    const [transcript, setTranscript] = useState([]); // [{role, text, score?, feedback?}]
    const [answer, setAnswer] = useState("");
    const [turnLoading, setTurnLoading] = useState(false);
    const [error, setError] = useState("");
    const [debrief, setDebrief] = useState(null);
    const [recording, setRecording] = useState(false);
    // Voice is a nice-to-have — a TTS failure never blocks the call (text
    // continues normally), but we surface *why* once so it's not a silent
    // mystery when the checkbox is on and nothing plays.
    const [voiceWarning, setVoiceWarning] = useState("");

    const audioRef = useRef(null);
    const recognitionRef = useRef(null);
    const transcriptEndRef = useRef(null);
    const currentAudioUrlRef = useRef(null);

    const load = useCallback(async () => {
        setLoadingScenarios(true);
        try {
            const data = await apiGetSimulatorScenarios();
            const list = data.scenarios || [];
            setScenarios(list);
            setVoiceEnabled(!!data.voice_enabled);
            setVoiceOn(!!data.voice_enabled);
            if (list.length) setSelectedScenario(list[0].id);
        } catch (err) {
            setError(err.message || "Could not load scenarios.");
        } finally {
            setLoadingScenarios(false);
        }
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            const data = await apiGetSimulatorHistory();
            setHistory(data.sessions || []);
        } catch {
            // Practice history is a nice-to-have — a failure here shouldn't block the simulator itself.
        }
    }, []);

    useEffect(() => { load(); loadHistory(); }, [load, loadHistory]);

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [transcript, phase]);

    useEffect(() => () => {
        if (currentAudioUrlRef.current) URL.revokeObjectURL(currentAudioUrlRef.current);
    }, []);

    const playText = useCallback(async (text) => {
        if (!voiceEnabled || !voiceOn || !text) return;
        try {
            const url = await apiSimulatorSpeak(text);
            if (currentAudioUrlRef.current) URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = url;
            if (audioRef.current) {
                audioRef.current.src = url;
                await audioRef.current.play().catch(() => {});
            }
            setVoiceWarning("");
        } catch (err) {
            // Falls back to text-only — the call keeps going either way — but
            // show the real reason once so a misconfigured voice isn't a mystery.
            setVoiceWarning(err.message || "Voice synthesis failed — continuing in text-only.");
        }
    }, [voiceEnabled, voiceOn]);

    const startCall = async () => {
        if (!selectedScenario) return;
        if (selectedScenario === "custom" && !customPersona.trim()) {
            setError("Describe the persona you want to practice against first.");
            return;
        }
        setPhase("starting"); setError(""); setDebrief(null); setVoiceWarning("");
        try {
            const data = await apiStartSimulator(selectedScenario, selectedScenario === "custom" ? customPersona.trim() : null);
            setTranscript([{ role: "persona", text: data.opening_line }]);
            setPhase("call");
            playText(data.opening_line);
        } catch (err) {
            setError(err.message || "Could not start the call.");
            setPhase("setup");
        }
    };

    const sendAnswer = async () => {
        const text = answer.trim();
        if (!text || turnLoading) return;
        setTurnLoading(true); setError("");
        const priorTranscript = transcript.map((t) => ({ role: t.role, text: t.text }));
        try {
            const data = await apiSimulatorTurn(
                selectedScenario, priorTranscript, text,
                selectedScenario === "custom" ? customPersona.trim() : null
            );
            setTranscript((prev) => [
                ...prev,
                { role: "user", text, score: data.score, feedback: data.feedback },
                { role: "persona", text: data.persona_message },
            ]);
            setAnswer("");
            playText(data.persona_message);
            if (data.call_over) {
                setDebrief({
                    overall_score: data.overall_score,
                    closing_summary: data.closing_summary,
                    strengths: data.strengths || [],
                    improvements: data.improvements || [],
                });
                setPhase("debrief");
                loadHistory();
            }
        } catch (err) {
            setError(err.message || "Could not send that answer — try again.");
        } finally {
            setTurnLoading(false);
        }
    };

    const resetCall = () => {
        setPhase("setup"); setTranscript([]); setAnswer(""); setDebrief(null); setError(""); setVoiceWarning("");
    };

    const toggleRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Voice input isn't supported in this browser — Chrome/Edge only for now. You can still type your answer.");
            return;
        }
        if (recording) {
            recognitionRef.current?.stop();
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = (e) => {
            const said = Array.from(e.results).map((r) => r[0].transcript).join(" ");
            setAnswer((prev) => (prev ? `${prev} ${said}` : said));
        };
        recognition.onerror = () => setRecording(false);
        recognition.onend = () => setRecording(false);
        recognitionRef.current = recognition;
        recognition.start();
        setRecording(true);
    };

    const canSend = answer.trim().length > 0 && !turnLoading;
    const activeScenario = scenarios.find((s) => s.id === selectedScenario);

    return (
        <div>
            <div className="dash-page-header">
                <div>
                    <h2>Call Practice</h2>
                    <p>Roleplay a sales or investor call against an AI persona — get scored turn by turn, then a full debrief.</p>
                </div>
            </div>

            {error && <div className="dash-error" style={{ marginBottom: 14 }}>{error}</div>}

            {phase === "setup" && (
                <>
                    <div className="dash-card sim-setup-card">
                        <h3>Choose who you're practicing against</h3>
                        {loadingScenarios ? (
                            <div className="dash-loading"><span className="dash-spinner" /> Loading scenarios...</div>
                        ) : (
                            <div className="sim-scenario-grid">
                                {scenarios.map((s) => (
                                    <button
                                        type="button"
                                        key={s.id}
                                        className={`sim-scenario-card ${selectedScenario === s.id ? "selected" : ""}`}
                                        onClick={() => setSelectedScenario(s.id)}
                                    >
                                        <span className="sim-scenario-label">{s.label}</span>
                                        <span className="sim-scenario-desc">{s.description}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedScenario === "custom" && (
                            <div className="dash-field" style={{ marginTop: 12 }}>
                                <label>Describe the persona</label>
                                <textarea
                                    className="dash-textarea"
                                    rows={3}
                                    placeholder="e.g. A Series A lead at a fintech-focused fund, worried about regulation and defensibility."
                                    value={customPersona}
                                    onChange={(e) => setCustomPersona(e.target.value)}
                                />
                            </div>
                        )}

                        {voiceEnabled ? (
                            <label className="sim-voice-toggle-row">
                                <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} />
                                Speak the persona's side aloud
                            </label>
                        ) : (
                            <p className="kb-desc" style={{ marginTop: 10 }}>
                                Voice isn't configured yet — this runs text-only. Set <code>ELEVENLABS_API_KEY</code> and{" "}
                                <code>ELEVENLABS_VOICE_ID</code> in the backend to enable spoken calls.
                            </p>
                        )}

                        <button
                            type="button"
                            className="dash-btn-primary"
                            style={{ width: "auto", marginTop: 14, gap: 8 }}
                            disabled={!selectedScenario || loadingScenarios}
                            onClick={startCall}
                        >
                            <PhoneIcon size={14} /> Start practice call
                        </button>
                    </div>

                    {history.length > 0 && (
                        <div className="dash-card" style={{ marginTop: 14 }}>
                            <h3>Practice history</h3>
                            <ul className="sim-history-list">
                                {history.map((h) => (
                                    <li key={h.id}>
                                        <span className={`sim-history-score ${scoreTone(h.overall_score)}`}>
                                            {h.overall_score != null ? `${h.overall_score}/10` : "—"}
                                        </span>
                                        <div className="sim-history-meta">
                                            <span className="sim-history-scenario">{h.scenario_label}</span>
                                            {h.summary && <span className="sim-history-summary">{h.summary}</span>}
                                        </div>
                                        <span className="sim-history-date">{relativeTime(h.created_at)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            )}

            {phase === "starting" && (
                <div className="dash-card"><div className="dash-loading"><span className="dash-spinner" /> Connecting the call...</div></div>
            )}

            {(phase === "call" || phase === "debrief") && (
                <div className="dash-card sim-call-card">
                    <div className="sim-call-head">
                        <span className="dash-tag"><PhoneIcon size={11} /> {activeScenario?.label || "Practice call"}</span>
                        {voiceEnabled && (
                            <button
                                type="button"
                                className="sim-voice-btn"
                                onClick={() => setVoiceOn((v) => !v)}
                                title={voiceOn ? "Mute voice" : "Unmute voice"}
                            >
                                {voiceOn ? <VolumeIcon size={15} /> : <VolumeOffIcon size={15} />}
                            </button>
                        )}
                    </div>

                    <audio ref={audioRef} hidden />

                    {voiceWarning && (
                        <div className="dash-error" style={{ marginBottom: 10 }}>
                            {voiceWarning}
                            <button
                                type="button"
                                className="dash-btn-secondary"
                                style={{ width: "auto", marginLeft: 10, padding: "3px 10px", fontSize: 12 }}
                                onClick={() => setVoiceWarning("")}
                            >
                                Dismiss
                            </button>
                        </div>
                    )}

                    <div className="sim-transcript">
                        {transcript.map((turn, i) => (
                            <div key={i} className={`sim-bubble ${turn.role}`}>
                                <p>{turn.text}</p>
                                {turn.role === "user" && turn.score != null && (
                                    <div className={`sim-bubble-feedback ${scoreTone(turn.score)}`}>
                                        <span className="sim-bubble-score">{turn.score}/10</span> {turn.feedback}
                                    </div>
                                )}
                                {turn.role === "persona" && voiceEnabled && (
                                    <button type="button" className="sim-play-btn" onClick={() => playText(turn.text)} title="Play aloud">
                                        <VolumeIcon size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <div ref={transcriptEndRef} />
                    </div>

                    {phase === "call" && (
                        <div className="sim-composer">
                            <textarea
                                className="dash-textarea"
                                rows={3}
                                placeholder="Type (or record) your answer..."
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
                                disabled={turnLoading}
                            />
                            <div className="sim-composer-actions">
                                <button
                                    type="button"
                                    className={`sim-mic-btn ${recording ? "recording" : ""}`}
                                    onClick={toggleRecording}
                                    title="Voice input"
                                >
                                    <MicIcon size={15} />
                                </button>
                                <button type="button" className="dash-btn-primary" style={{ width: "auto" }} disabled={!canSend} onClick={sendAnswer}>
                                    {turnLoading ? "Thinking..." : "Send"}
                                </button>
                            </div>
                        </div>
                    )}

                    {phase === "debrief" && debrief && (
                        <div className="sim-debrief">
                            <div className="sim-debrief-head">
                                <span className={`dash-signal ${scoreTone(debrief.overall_score)}`}>
                                    {debrief.overall_score != null ? `${debrief.overall_score}/10 overall` : "Call complete"}
                                </span>
                            </div>
                            {debrief.closing_summary && <p className="sim-debrief-summary">{debrief.closing_summary}</p>}
                            <div className="sim-debrief-grid">
                                {debrief.strengths.length > 0 && (
                                    <div>
                                        <div className="dash-section-title">What worked</div>
                                        <div className="dash-list">
                                            {debrief.strengths.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}
                                        </div>
                                    </div>
                                )}
                                {debrief.improvements.length > 0 && (
                                    <div>
                                        <div className="dash-section-title">Work on next</div>
                                        <div className="dash-list">
                                            {debrief.improvements.map((s, i) => <div key={i} className="dash-list-item"><span className="bullet">•</span>{s}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button type="button" className="dash-btn-primary" style={{ width: "auto", marginTop: 14 }} onClick={resetCall}>
                                Practice again
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
