import { useState } from "react";
import { apiSignup, apiLogin } from "./pitchmateApi";

/**
 * PitchMateAuth
 * Newsprint-styled auth page for Pitchmate's self-hosted JWT auth.
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
                    <h1>Pitchmate</h1>
                    <p>Vol. 1 | Founder Edition | AI Pitch Co-Pilot</p>
                </div>
            </header>

            <main className="auth-layout newsprint-texture">
                <section className="auth-hero">
                    <div className="auth-kicker">Special Report</div>
                    <h2>Turn your idea into an investor-ready pitch.</h2>
                    <p className="auth-lede">
                        Pitchmate brings market validation, deck review, investor strategy, and founder messaging into one crisp editorial workspace.
                    </p>
                    <div className="auth-grid">
                        {[
                            "Deck slide review and scoring",
                            "Market size validation",
                            "Go-to-market strategy",
                            "Investor outreach drafts",
                        ].map((item, i) => (
                            <div className="auth-grid-item" key={item}>
                                <span>Fig. {i + 1}</span>
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
                    {submitted && (
                        <div className="success-overlay">
                            <p>{isSignup ? "Account Created" : "Welcome Back"}</p>
                            <span>Loading your workspace...</span>
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
                        <div className="auth-kicker">Subscriber Access</div>
                        <h3>{isSignup ? "Create your account" : "Welcome back"}</h3>
                        <p>{isSignup ? "Start your founder brief today." : "Continue building your pitch."}</p>
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');

  * { box-sizing:border-box; border-radius:0 !important; }
  html, body, #root { min-height:100%; background:#F9F9F7; }
  body { margin:0; }
  button, input { font:inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible {
    outline:2px solid #111111;
    outline-offset:2px;
  }
  .newsprint-texture { position:relative; }
  .newsprint-texture::before {
    content:'';
    position:absolute;
    inset:0;
    background-image:
      linear-gradient(0deg, transparent 98%, rgba(0,0,0,.02) 100%),
      linear-gradient(90deg, transparent 98%, rgba(0,0,0,.02) 100%);
    background-size:3px 3px;
    pointer-events:none;
    opacity:.55;
  }

  .auth-root {
    min-height:100vh;
    background-color:#F9F9F7;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
  }
  .auth-masthead {
    min-height:76px;
    padding:14px 24px;
    border-bottom:4px solid #111111;
    display:flex;
    align-items:center;
    gap:14px;
    background:#F9F9F7;
  }
  .auth-logo-mark {
    width:42px;
    height:42px;
    background:#111111;
    border:1px solid #111111;
    color:#F9F9F7;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:24px;
    font-weight:900;
  }
  .auth-masthead h1 {
    margin:0;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:34px;
    font-weight:900;
    line-height:.9;
    letter-spacing:-1px;
  }
  .auth-masthead p {
    margin:5px 0 0;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1.5px;
    text-transform:uppercase;
  }
  .auth-layout {
    position:relative;
    max-width:1280px;
    min-height:calc(100vh - 76px);
    margin:0 auto;
    display:grid;
    grid-template-columns:minmax(0, 8fr) minmax(360px, 4fr);
    border-left:1px solid #111111;
    border-right:1px solid #111111;
  }
  .auth-hero {
    position:relative;
    padding:52px 48px;
    border-right:1px solid #111111;
  }
  .auth-kicker {
    display:inline-flex;
    margin-bottom:18px;
    padding:4px 8px;
    background:#CC0000;
    color:#F9F9F7;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:1.5px;
    text-transform:uppercase;
  }
  .auth-hero h2 {
    max-width:820px;
    margin:0 0 22px;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:clamp(60px, 9vw, 126px);
    font-weight:900;
    line-height:.88;
    letter-spacing:-5px;
  }
  .auth-lede {
    max-width:700px;
    margin:0 0 30px;
    color:#404040;
    font-family:'Lora',Georgia,serif;
    font-size:18px;
    line-height:1.65;
    text-align:justify;
  }
  .auth-lede::first-letter {
    float:left;
    margin:.08em .12em 0 0;
    color:#CC0000;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:70px;
    font-weight:900;
    line-height:.82;
  }
  .auth-grid {
    display:grid;
    grid-template-columns:repeat(2, minmax(0, 1fr));
    border-left:1px solid #111111;
    border-top:1px solid #111111;
    margin-bottom:30px;
  }
  .auth-grid-item {
    min-height:108px;
    padding:16px;
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
    color:#111111;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:24px;
    font-weight:700;
    line-height:1.1;
  }
  .auth-grid-item span {
    display:block;
    margin-bottom:12px;
    color:#737373;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    font-weight:500;
    letter-spacing:1px;
    text-transform:uppercase;
  }
  blockquote {
    margin:0;
    max-width:580px;
    padding:18px 20px;
    border:1px solid #111111;
    background:#111111;
    color:#F9F9F7;
  }
  blockquote p {
    margin:0 0 8px;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:26px;
    font-style:italic;
    line-height:1.1;
  }
  blockquote cite {
    color:#E5E5E0;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    font-style:normal;
    letter-spacing:1px;
    text-transform:uppercase;
  }
  .auth-card {
    position:relative;
    padding:32px;
    background:#F9F9F7;
    align-self:stretch;
  }
  .success-overlay {
    position:absolute;
    inset:0;
    z-index:20;
    background:#111111;
    color:#F9F9F7;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:10px;
    text-align:center;
  }
  .success-overlay p {
    margin:0;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:36px;
    font-weight:900;
  }
  .success-overlay span {
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    letter-spacing:1px;
    text-transform:uppercase;
  }
  .auth-tabs {
    display:grid;
    grid-template-columns:1fr 1fr;
    border-left:1px solid #111111;
    border-top:1px solid #111111;
    margin-bottom:28px;
  }
  .tab {
    min-height:44px;
    background:#F9F9F7;
    border:0;
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:12px;
    font-weight:800;
    letter-spacing:1.4px;
    text-transform:uppercase;
    cursor:pointer;
  }
  .tab.active, .tab:hover {
    background:#111111;
    color:#F9F9F7;
  }
  .auth-card-heading {
    margin-bottom:24px;
    border-bottom:4px solid #111111;
    padding-bottom:18px;
  }
  .auth-card-heading h3 {
    margin:0 0 8px;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:42px;
    font-weight:900;
    line-height:.95;
    letter-spacing:-1px;
  }
  .auth-card-heading p {
    margin:0;
    color:#525252;
    font-family:'Lora',Georgia,serif;
    font-size:14px;
    line-height:1.6;
  }
  .auth-form {
    display:flex;
    flex-direction:column;
    gap:14px;
  }
  .auth-field label {
    display:block;
    margin-bottom:6px;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1.2px;
    text-transform:uppercase;
  }
  .auth-input {
    width:100%;
    background:transparent;
    border:0;
    border-bottom:2px solid #111111;
    padding:11px 8px;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:13px;
    outline:none;
    transition:background .2s ease-out;
  }
  .auth-input::placeholder { color:#737373; }
  .auth-input:focus { background:#F0F0F0; }
  .auth-link-row {
    display:flex;
    justify-content:flex-end;
  }
  .auth-link-row a, .auth-terms a {
    color:#111111;
    text-decoration-color:#CC0000;
    text-decoration-thickness:2px;
    text-underline-offset:4px;
  }
  .auth-link-row a:hover, .auth-terms a:hover { color:#CC0000; }
  .submit-btn {
    min-height:48px;
    margin-top:4px;
    padding:13px 16px;
    background:#111111;
    border:1px solid transparent;
    color:#F9F9F7;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:12px;
    font-weight:800;
    letter-spacing:1.4px;
    text-transform:uppercase;
    cursor:pointer;
    transition:all .2s ease-out;
  }
  .submit-btn:hover:not(:disabled) {
    background:#F9F9F7;
    border-color:#111111;
    color:#111111;
    box-shadow:4px 4px 0 0 #111111;
    transform:translate(-2px,-2px);
  }
  .submit-btn:disabled { opacity:.5; cursor:not-allowed; }
  .auth-error {
    margin:0;
    padding:10px 12px;
    border:1px solid #CC0000;
    color:#CC0000;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:12px;
    line-height:1.5;
  }
  .auth-terms, .auth-switch {
    margin:0;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
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
    color:#111111;
    cursor:pointer;
    font-weight:700;
    text-decoration:underline;
    text-decoration-color:#CC0000;
    text-decoration-thickness:2px;
    text-underline-offset:4px;
  }
  .password-strength {
    margin-top:10px;
  }
  .strength-bars {
    display:flex;
    align-items:center;
    gap:4px;
    margin-bottom:8px;
  }
  .strength-bars span {
    flex:1;
    height:4px;
    border:1px solid #111111;
    background:#F9F9F7;
  }
  .strength-bars span.filled {
    background:#111111;
  }
  .strength-bars b {
    min-width:48px;
    margin-left:6px;
    color:#CC0000;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    text-transform:uppercase;
  }
  .strength-checks {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:5px;
  }
  .strength-checks span {
    color:#737373;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
  }
  .strength-checks span.ok {
    color:#111111;
  }
  .strength-checks i {
    display:inline-block;
    width:24px;
    margin-right:5px;
    border:1px solid currentColor;
    font-style:normal;
    text-align:center;
  }

  @media (max-width: 940px) {
    .auth-layout { grid-template-columns:1fr; border-left:0; border-right:0; }
    .auth-hero { border-right:0; border-bottom:1px solid #111111; padding:36px 24px; }
    .auth-card { padding:28px 24px 40px; }
  }
  @media (max-width: 560px) {
    .auth-masthead { padding:12px 16px; }
    .auth-masthead h1 { font-size:28px; }
    .auth-hero h2 { font-size:56px; letter-spacing:-3px; }
    .auth-grid { grid-template-columns:1fr; }
    .auth-card-heading h3 { font-size:34px; }
    .strength-checks { grid-template-columns:1fr; }
  }
`;
