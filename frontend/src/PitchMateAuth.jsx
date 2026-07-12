import { useState } from "react";
import { apiSignup, apiLogin } from "./pitchmateApi";

/**
 * PitchMateAuth
 * Cyberpunk-styled auth page for Pitchmate's self-hosted JWT auth.
 */
export default function PitchMateAuth({ onAuthenticated }) {
    const [mode, setMode] = useState("signin");
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const isSignup = mode === "signup";
    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.email || !form.password) {
            setError("Email and password are required.");
            return;
        }
        if (isSignup && form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            if (isSignup) {
                await apiSignup(form.email, form.password, form.name);
            } else {
                await apiLogin(form.email, form.password);
            }
            setSubmitted(true);
            setTimeout(() => onAuthenticated?.(), 900);
        } catch (err) {
            setError(err.message || "Authentication failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="auth-root">
            <style>{CSS}</style>

            <header className="auth-masthead">
                <div className="auth-logo-mark">P</div>
                <div>
                    <h1 className="cyber-glitch">Pitchmate</h1>
                    <p>SYS.01 // Founder Terminal // AI Pitch Co-Pilot</p>
                </div>
            </header>

            <main className="auth-layout">
                <section className="auth-hero">
                    <div className="auth-kicker">// ACCESS PROTOCOL</div>
                    <h2 className="cyber-glitch">
                        Hack your pitch.<br />Ship investor-ready.
                        <span className="auth-cursor">_</span>
                    </h2>
                    <p className="auth-lede">
                        Pitchmate is a rogue terminal for founders — market validation, deck ops, investor strategy, and messaging in one neon-lit workspace.
                    </p>
                    <div className="auth-grid">
                        {[
                            "Deck slide review and scoring",
                            "Market size validation",
                            "Go-to-market strategy",
                            "Investor outreach drafts",
                        ].map((item, i) => (
                            <div className="auth-grid-item" key={item}>
                                <span>MOD_0{i + 1}</span>
                                {item}
                            </div>
                        ))}
                    </div>
                    <blockquote>
                        <p>"Got funded in 3 months after using Pitchmate."</p>
                        <cite>Arjun R. | SaaS Founder, Series A</cite>
                    </blockquote>
                </section>

                <section className="auth-card" aria-label={isSignup ? "Create account" : "Sign in"}>
                    <div className="auth-card-chrome">
                        <span className="dot red" />
                        <span className="dot yellow" />
                        <span className="dot green" />
                        <span className="auth-card-title">auth_session.exe</span>
                    </div>

                    {submitted && (
                        <div className="success-overlay">
                            <p>{isSignup ? "ACCESS GRANTED" : "WELCOME BACK"}</p>
                            <span>Booting workspace<span className="auth-cursor">_</span></span>
                        </div>
                    )}

                    <div className="auth-tabs">
                        {["signin", "signup"].map((m) => (
                            <button
                                key={m}
                                type="button"
                                className={`tab ${mode === m ? "active" : ""}`}
                                onClick={() => { setMode(m); setError(""); }}
                            >
                                {m === "signin" ? "Sign In" : "Sign Up"}
                            </button>
                        ))}
                    </div>

                    <div className="auth-card-heading">
                        <div className="auth-kicker">SUBSCRIBER ACCESS</div>
                        <h3>{isSignup ? "Create account" : "Welcome back"}</h3>
                        <p>{isSignup ? "> Initialize your founder node." : "> Continue building your pitch."}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {isSignup && (
                            <div className="auth-field">
                                <label>Full Name</label>
                                <input
                                    className="auth-input"
                                    type="text"
                                    placeholder="Jane Founder"
                                    value={form.name}
                                    onChange={(e) => update("name", e.target.value)}
                                />
                            </div>
                        )}

                        <div className="auth-field">
                            <label>Email Address</label>
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="you@startup.com"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
                            />
                        </div>

                        <div className="auth-field">
                            <label>Password</label>
                            <input
                                className="auth-input"
                                type="password"
                                placeholder={isSignup ? "Min. 8 characters" : "Enter your password"}
                                value={form.password}
                                onChange={(e) => update("password", e.target.value)}
                            />
                            {isSignup && form.password && <PasswordStrength password={form.password} />}
                        </div>

                        {isSignup && (
                            <div className="auth-field">
                                <label>Confirm Password</label>
                                <input
                                    className="auth-input"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={form.confirm}
                                    onChange={(e) => update("confirm", e.target.value)}
                                />
                            </div>
                        )}

                        {!isSignup && (
                            <div className="auth-link-row">
                                <a href="#">Forgot password?</a>
                            </div>
                        )}

                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create Account" : "Sign In"}
                        </button>

                        {error && <p className="auth-error">{error}</p>}

                        {isSignup && (
                            <p className="auth-terms">
                                By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                            </p>
                        )}
                    </form>

                    <p className="auth-switch">
                        {isSignup ? "Already have an account? " : "Do not have an account? "}
                        <button type="button" onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(""); }}>
                            {isSignup ? "Sign In" : "Sign Up Free"}
                        </button>
                    </p>
                </section>
            </main>
        </div>
    );
}

function PasswordStrength({ password }) {
    const checks = [
        { label: "8+ characters", ok: password.length >= 8 },
        { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
        { label: "Number", ok: /[0-9]/.test(password) },
        { label: "Special character", ok: /[^a-zA-Z0-9]/.test(password) },
    ];
    const score = checks.filter((c) => c.ok).length;
    const labels = ["Weak", "Fair", "Good", "Strong"];

    return (
        <div className="password-strength">
            <div className="strength-bars" aria-label={`Password strength: ${score > 0 ? labels[score - 1] : "Empty"}`}>
                {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={i < score ? "filled" : ""} />
                ))}
                <b>{score > 0 ? labels[score - 1] : ""}</b>
            </div>
            <div className="strength-checks">
                {checks.map((c) => (
                    <span key={c.label} className={c.ok ? "ok" : ""}>
                        <i>{c.ok ? "OK" : "--"}</i>
                        {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Orbitron:wght@500;600;700;800;900&family=Share+Tech+Mono&display=swap');

  :root {
    --bg: #0a0a0f;
    --fg: #e0e0e0;
    --card: #12121a;
    --muted: #1c1c2e;
    --muted-fg: #6b7280;
    --accent: #00ff88;
    --accent-2: #ff00ff;
    --accent-3: #00d4ff;
    --border: #2a2a3a;
    --destructive: #ff3366;
    --neon: 0 0 5px #00ff88, 0 0 10px #00ff8840;
    --neon-sm: 0 0 3px #00ff88, 0 0 6px #00ff8830;
    --neon-lg: 0 0 10px #00ff88, 0 0 20px #00ff8860, 0 0 40px #00ff8830;
    --neon-2: 0 0 5px #ff00ff, 0 0 20px #ff00ff60;
    --chamfer: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));
    --chamfer-sm: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
  }

  * { box-sizing:border-box; }
  html, body, #root { min-height:100%; background:var(--bg); }
  body { margin:0; }
  button, input { font:inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible {
    outline:none;
    box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--accent), var(--neon-sm);
  }

  .cyber-glitch {
    position:relative;
    animation:rgbShift 4s steps(2) infinite;
  }
  @keyframes rgbShift {
    0%, 90%, 100% { text-shadow: -2px 0 #ff00ff, 2px 0 #00d4ff, 0 0 12px rgba(0,255,136,.45); }
    92% { text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff; transform:translate(1px,-1px); }
    94% { text-shadow: -1px 0 #ff00ff, 3px 0 #00d4ff; transform:translate(-2px,1px); }
    96% { text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff; transform:translate(0); }
  }
  @keyframes cursor-blink {
    0%, 49% { opacity:1; }
    50%, 100% { opacity:0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .cyber-glitch { animation:none; text-shadow:-1px 0 #ff00ff, 1px 0 #00d4ff; }
    .auth-cursor { animation:none; }
  }

  .auth-root {
    min-height:100vh;
    background-color:var(--bg);
    background-image:
      radial-gradient(ellipse at 15% 10%, rgba(0,255,136,.08) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 90%, rgba(255,0,255,.06) 0%, transparent 45%),
      linear-gradient(rgba(0,255,136,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,136,.03) 1px, transparent 1px);
    background-size:auto, auto, 50px 50px, 50px 50px;
    color:var(--fg);
    font-family:'JetBrains Mono','Fira Code','Consolas',monospace;
    position:relative;
  }
  .auth-root::after {
    content:'';
    position:fixed;
    inset:0;
    z-index:9999;
    pointer-events:none;
    background:repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,.28) 2px,
      rgba(0,0,0,.28) 4px
    );
    opacity:.35;
  }

  .auth-masthead {
    min-height:76px;
    padding:14px 24px;
    border-bottom:1px solid var(--border);
    display:flex;
    align-items:center;
    gap:14px;
    background:rgba(10,10,15,.92);
    backdrop-filter:blur(12px);
    box-shadow:0 1px 0 rgba(0,255,136,.15);
    position:relative;
    z-index:2;
  }
  .auth-logo-mark {
    width:42px;
    height:42px;
    background:transparent;
    border:2px solid var(--accent);
    color:var(--accent);
    clip-path:var(--chamfer-sm);
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Orbitron',monospace;
    font-size:20px;
    font-weight:900;
    box-shadow:var(--neon-sm);
    text-shadow:0 0 8px rgba(0,255,136,.6);
  }
  .auth-masthead h1 {
    margin:0;
    font-family:'Orbitron',monospace;
    font-size:26px;
    font-weight:900;
    line-height:1;
    letter-spacing:.16em;
    text-transform:uppercase;
    color:var(--accent);
  }
  .auth-masthead p {
    margin:6px 0 0;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.18em;
    text-transform:uppercase;
  }
  .auth-layout {
    position:relative;
    z-index:1;
    max-width:1280px;
    min-height:calc(100vh - 76px);
    margin:0 auto;
    display:grid;
    grid-template-columns:minmax(0, 6fr) minmax(360px, 4fr);
    gap:0;
  }
  .auth-hero {
    position:relative;
    padding:52px 48px;
  }
  .auth-kicker {
    display:inline-flex;
    margin-bottom:18px;
    padding:4px 10px;
    background:transparent;
    border:1px solid var(--accent);
    color:var(--accent);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:.18em;
    text-transform:uppercase;
    clip-path:var(--chamfer-sm);
    box-shadow:var(--neon-sm);
  }
  .auth-hero h2 {
    max-width:820px;
    margin:0 0 22px;
    font-family:'Orbitron',monospace;
    font-size:clamp(36px, 6vw, 64px);
    font-weight:900;
    line-height:1.05;
    letter-spacing:.06em;
    text-transform:uppercase;
    color:var(--fg);
  }
  .auth-cursor {
    color:var(--accent);
    animation:cursor-blink 1s step-end infinite;
  }
  .auth-lede {
    max-width:640px;
    margin:0 0 30px;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:15px;
    line-height:1.7;
    letter-spacing:.03em;
  }
  .auth-grid {
    display:grid;
    grid-template-columns:repeat(2, minmax(0, 1fr));
    gap:12px;
    margin-bottom:30px;
  }
  .auth-grid-item {
    min-height:100px;
    padding:16px;
    background:rgba(18,18,26,.7);
    border:1px solid var(--border);
    color:var(--fg);
    font-family:'Orbitron',monospace;
    font-size:14px;
    font-weight:700;
    line-height:1.25;
    letter-spacing:.04em;
    text-transform:uppercase;
    clip-path:var(--chamfer);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .auth-grid-item:hover {
    border-color:var(--accent);
    box-shadow:var(--neon-sm);
    transform:translateY(-2px);
  }
  .auth-grid-item span {
    display:block;
    margin-bottom:12px;
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    font-weight:500;
    letter-spacing:.16em;
    text-transform:uppercase;
  }
  blockquote {
    margin:0;
    max-width:580px;
    padding:18px 20px;
    border:1px solid var(--accent-2);
    background:rgba(255,0,255,.06);
    color:var(--fg);
    clip-path:var(--chamfer);
    box-shadow:var(--neon-2);
  }
  blockquote p {
    margin:0 0 8px;
    font-family:'Orbitron',monospace;
    font-size:16px;
    font-style:normal;
    line-height:1.35;
    letter-spacing:.04em;
    color:var(--fg);
  }
  blockquote cite {
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    font-style:normal;
    letter-spacing:.12em;
    text-transform:uppercase;
  }
  .auth-card {
    position:relative;
    padding:28px 28px 36px;
    margin:32px 24px 32px 0;
    background:rgba(18,18,26,.85);
    border:1px solid var(--border);
    clip-path:var(--chamfer);
    box-shadow:var(--neon-sm);
    align-self:start;
    backdrop-filter:blur(8px);
  }
  .auth-card-chrome {
    display:flex;
    align-items:center;
    gap:6px;
    margin:0 0 20px;
    padding-bottom:12px;
    border-bottom:1px solid var(--border);
  }
  .auth-card-chrome .dot {
    width:10px;
    height:10px;
    border-radius:50%;
  }
  .auth-card-chrome .dot.red { background:var(--destructive); box-shadow:0 0 6px #ff336680; }
  .auth-card-chrome .dot.yellow { background:#facc15; box-shadow:0 0 6px #facc1580; }
  .auth-card-chrome .dot.green { background:var(--accent); box-shadow:0 0 6px #00ff8880; }
  .auth-card-title {
    margin-left:8px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.14em;
    text-transform:uppercase;
  }
  .success-overlay {
    position:absolute;
    inset:0;
    z-index:20;
    background:rgba(10,10,15,.95);
    color:var(--accent);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:10px;
    text-align:center;
    clip-path:var(--chamfer);
  }
  .success-overlay p {
    margin:0;
    font-family:'Orbitron',monospace;
    font-size:24px;
    font-weight:900;
    letter-spacing:.14em;
    text-shadow:0 0 16px rgba(0,255,136,.5);
  }
  .success-overlay span {
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    letter-spacing:.12em;
    text-transform:uppercase;
    color:var(--accent-3);
  }
  .auth-tabs {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:8px;
    margin-bottom:24px;
  }
  .tab {
    min-height:44px;
    background:transparent;
    border:1px solid var(--border);
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:12px;
    font-weight:700;
    letter-spacing:.14em;
    text-transform:uppercase;
    cursor:pointer;
    clip-path:var(--chamfer-sm);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .tab.active, .tab:hover {
    border-color:var(--accent);
    color:var(--accent);
    box-shadow:var(--neon-sm);
    background:rgba(0,255,136,.08);
  }
  .auth-card-heading {
    margin-bottom:24px;
    border-bottom:1px solid var(--border);
    padding-bottom:18px;
  }
  .auth-card-heading h3 {
    margin:0 0 8px;
    font-family:'Orbitron',monospace;
    font-size:28px;
    font-weight:900;
    line-height:1.1;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--fg);
  }
  .auth-card-heading p {
    margin:0;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    line-height:1.6;
  }
  .auth-form {
    display:flex;
    flex-direction:column;
    gap:14px;
  }
  .auth-field { position:relative; }
  .auth-field label {
    display:block;
    margin-bottom:6px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.16em;
    text-transform:uppercase;
  }
  .auth-field::before {
    content:'>';
    position:absolute;
    left:12px;
    top:32px;
    color:var(--accent);
    font-family:'Share Tech Mono',monospace;
    font-size:13px;
    z-index:1;
    pointer-events:none;
    text-shadow:0 0 6px rgba(0,255,136,.5);
  }
  .auth-input {
    width:100%;
    background:var(--bg);
    border:1px solid var(--border);
    padding:11px 12px 11px 28px;
    color:var(--accent);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    outline:none;
    clip-path:var(--chamfer-sm);
    transition:all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .auth-input::placeholder { color:var(--muted-fg); }
  .auth-input:focus {
    border-color:var(--accent);
    box-shadow:var(--neon);
  }
  .auth-link-row {
    display:flex;
    justify-content:flex-end;
  }
  .auth-link-row a, .auth-terms a {
    color:var(--accent-3);
    text-decoration-color:var(--accent);
    text-decoration-thickness:1px;
    text-underline-offset:4px;
  }
  .auth-link-row a:hover, .auth-terms a:hover { color:var(--accent); }
  .submit-btn {
    min-height:48px;
    margin-top:4px;
    padding:13px 16px;
    background:var(--accent);
    border:2px solid var(--accent);
    color:var(--bg);
    font-family:'Orbitron',monospace;
    font-size:12px;
    font-weight:800;
    letter-spacing:.16em;
    text-transform:uppercase;
    cursor:pointer;
    clip-path:var(--chamfer-sm);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:var(--neon);
  }
  .submit-btn:hover:not(:disabled) {
    filter:brightness(1.12);
    box-shadow:var(--neon-lg);
  }
  .submit-btn:disabled { opacity:.5; cursor:not-allowed; box-shadow:none; }
  .auth-error {
    margin:0;
    padding:10px 12px;
    border:1px solid var(--destructive);
    background:rgba(255,51,102,.08);
    color:var(--destructive);
    font-family:'JetBrains Mono',monospace;
    font-size:12px;
    line-height:1.5;
    clip-path:var(--chamfer-sm);
  }
  .auth-terms, .auth-switch {
    margin:0;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    line-height:1.6;
  }
  .auth-switch {
    margin-top:22px;
    text-align:center;
  }
  .auth-switch button {
    background:transparent;
    border:0;
    color:var(--accent);
    cursor:pointer;
    font-weight:700;
    text-decoration:underline;
    text-decoration-color:var(--accent);
    text-decoration-thickness:1px;
    text-underline-offset:4px;
  }
  .password-strength { margin-top:10px; }
  .strength-bars {
    display:flex;
    align-items:center;
    gap:4px;
    margin-bottom:8px;
  }
  .strength-bars span {
    flex:1;
    height:4px;
    border:1px solid var(--border);
    background:var(--bg);
  }
  .strength-bars span.filled {
    background:var(--accent);
    box-shadow:var(--neon-sm);
    border-color:var(--accent);
  }
  .strength-bars b {
    min-width:48px;
    margin-left:6px;
    color:var(--accent);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    text-transform:uppercase;
  }
  .strength-checks {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:5px;
  }
  .strength-checks span {
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
  }
  .strength-checks span.ok { color:var(--accent); }
  .strength-checks i {
    display:inline-block;
    width:24px;
    margin-right:5px;
    border:1px solid currentColor;
    font-style:normal;
    text-align:center;
  }

  @media (max-width: 940px) {
    .auth-layout { grid-template-columns:1fr; }
    .auth-hero { padding:36px 24px; }
    .auth-card { margin:0 16px 40px; padding:24px 20px 36px; }
  }
  @media (max-width: 560px) {
    .auth-masthead { padding:12px 16px; }
    .auth-masthead h1 { font-size:20px; letter-spacing:.1em; }
    .auth-hero h2 { font-size:32px; letter-spacing:.04em; }
    .auth-grid { grid-template-columns:1fr; }
    .auth-card-heading h3 { font-size:22px; }
    .strength-checks { grid-template-columns:1fr; }
  }
`;
