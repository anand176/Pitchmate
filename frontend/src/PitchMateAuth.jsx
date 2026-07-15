import { useState } from "react";
import { apiSignup, apiLogin } from "./pitchmateApi";
import { CheckCircleIcon, LogoMark } from "./icons";

/**
 * PitchMateAuth — calm dark auth for Pitchmate's self-hosted JWT.
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
                <div className="auth-logo-mark"><LogoMark size={20} /></div>
                <div>
                    <h1>Pitchmate</h1>
                    <p>AI pitch co-pilot for founders</p>
                </div>
            </header>

            <main className="auth-layout">
                <section className="auth-hero">
                    <div className="auth-kicker">Founder workspace</div>
                    <h2>
                        From idea to<br />investor-ready.
                    </h2>
                    <p className="auth-lede">
                        Validate your market, shape your narrative, target the right investors,
                        and prepare diligence — in one calm workspace that remembers your startup.
                    </p>
                    <div className="auth-grid">
                        {[
                            "Market size validation",
                            "Deck & narrative coaching",
                            "Investor targeting",
                            "Diligence Q&A prep",
                        ].map((item) => (
                            <div className="auth-grid-item" key={item}>
                                <span className="auth-grid-dot"><CheckCircleIcon size={14} strokeWidth={2.2} /></span>
                                {item}
                            </div>
                        ))}
                    </div>
                    <blockquote>
                        <p>“Got funded in 3 months after using Pitchmate.”</p>
                        <cite>Arjun R. · SaaS Founder, Series A</cite>
                    </blockquote>
                </section>

                <section className="auth-card" aria-label={isSignup ? "Create account" : "Sign in"}>
                    {submitted && (
                        <div className="success-overlay">
                            <p>{isSignup ? "Account created" : "Welcome back"}</p>
                            <span>Opening your workspace…</span>
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
                                {m === "signin" ? "Sign in" : "Sign up"}
                            </button>
                        ))}
                    </div>

                    <div className="auth-card-heading">
                        <h3>{isSignup ? "Create your account" : "Welcome back"}</h3>
                        <p>{isSignup ? "Start with a startup profile in under two minutes." : "Continue building your pitch."}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {isSignup && (
                            <div className="auth-field">
                                <label>Full name</label>
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
                            <label>Email</label>
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
                                <label>Confirm password</label>
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
                            {loading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
                        </button>

                        {error && <p className="auth-error">{error}</p>}

                        {isSignup && (
                            <p className="auth-terms">
                                By signing up, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
                            </p>
                        )}
                    </form>

                    <p className="auth-switch">
                        {isSignup ? "Already have an account? " : "Don’t have an account? "}
                        <button type="button" onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(""); }}>
                            {isSignup ? "Sign in" : "Sign up free"}
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
                        <i>{c.ok ? "✓" : "·"}</i>
                        {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap');

  :root {
    --bg: #EEF1F7;
    --fg: #0F172A;
    --card: #FFFFFF;
    --muted: #E4E9F2;
    --muted-fg: #64748B;
    --text-muted: #94A3B8;
    --accent: #2563EB;
    --accent-ink: #1D4ED8;
    --accent-hover: #1D4ED8;
    --accent-soft: rgba(37, 99, 235, 0.08);
    --accent-2: #B45309;
    --accent-2-soft: rgba(180, 83, 9, 0.10);
    --gradient-accent: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
    --on-accent: #FFFFFF;
    --border: #DCE3EC;
    --hover: #E9EEF5;
    --destructive: #B91C1C;
    --radius: 18px;
    --radius-sm: 10px;
    --font-body: 'Inter', system-ui, sans-serif;
    --font-display: 'Outfit', system-ui, sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
  }

  * { box-sizing:border-box; }
  html, body, #root { min-height:100%; background:var(--bg); }
  body { margin:0; }
  button, input { font:inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible {
    outline:none;
    box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .auth-root {
    min-height:100vh;
    background:
      radial-gradient(ellipse at 20% 0%, rgba(37,99,235,.08) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 80%, rgba(67,56,202,.05) 0%, transparent 45%),
      var(--bg);
    color:var(--fg);
    font-family:var(--font-body);
  }

  .auth-masthead {
    min-height:72px;
    padding:14px 28px;
    border-bottom:1px solid var(--border);
    display:flex;
    align-items:center;
    gap:14px;
    background:rgba(255,255,255,.85);
    backdrop-filter:blur(12px);
  }
  .auth-logo-mark {
    width:40px;
    height:40px;
    border-radius:var(--radius-sm);
    background:var(--gradient-accent);
    color:var(--on-accent);
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 6px 18px rgba(37,99,235,.3);
    flex-shrink:0;
  }
  .auth-masthead h1 {
    margin:0;
    font-family:var(--font-display);
    font-size:22px;
    font-weight:700;
    letter-spacing:-0.02em;
    color:var(--fg);
  }
  .auth-masthead p {
    margin:2px 0 0;
    color:var(--muted-fg);
    font-size:13px;
  }

  .auth-layout {
    max-width:1080px;
    margin:0 auto;
    padding:48px 24px 64px;
    display:grid;
    grid-template-columns:1.1fr 0.9fr;
    gap:48px;
    align-items:start;
  }

  .auth-kicker {
    font-family:var(--font-mono);
    font-size:11px;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--accent-ink);
    margin-bottom:14px;
  }
  .auth-hero h2 {
    margin:0 0 16px;
    font-family:var(--font-display);
    font-size:clamp(32px, 5vw, 48px);
    font-weight:700;
    line-height:1.12;
    letter-spacing:-0.03em;
    color:var(--fg);
  }
  .auth-lede {
    margin:0 0 28px;
    color:var(--muted-fg);
    font-size:16px;
    line-height:1.65;
    max-width:42ch;
  }
  .auth-grid {
    display:grid;
    gap:10px;
    margin-bottom:32px;
  }
  .auth-grid-item {
    display:flex;
    align-items:center;
    gap:12px;
    padding:12px 14px;
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    box-shadow:0 1px 3px rgba(15,23,42,.05);
    font-size:14px;
    color:var(--fg);
  }
  .auth-grid-dot {
    width:22px;
    height:22px;
    border-radius:50%;
    background:var(--accent-soft);
    color:var(--accent-ink);
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .auth-hero blockquote {
    margin:0;
    padding:18px 20px;
    border-left:3px solid var(--accent-2);
    background:var(--accent-2-soft);
    border-radius:0 var(--radius-sm) var(--radius-sm) 0;
  }
  .auth-hero blockquote p {
    margin:0 0 8px;
    font-size:15px;
    line-height:1.5;
    color:var(--fg);
  }
  .auth-hero cite {
    font-style:normal;
    font-size:12px;
    color:var(--text-muted);
    font-family:var(--font-mono);
  }

  .auth-card {
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius);
    padding:30px 28px 26px;
    position:relative;
    box-shadow:0 16px 48px rgba(15,23,42,.1);
  }
  .success-overlay {
    position:absolute;
    inset:0;
    z-index:5;
    background:rgba(255,255,255,.97);
    border-radius:var(--radius);
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:8px;
  }
  .success-overlay p {
    margin:0;
    font-family:var(--font-display);
    font-size:22px;
    font-weight:700;
    color:var(--accent-ink);
  }
  .success-overlay span { color:var(--muted-fg); font-size:14px; }

  .auth-tabs {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:4px;
    padding:4px;
    background:var(--muted);
    border-radius:999px;
    margin-bottom:24px;
  }
  .auth-tabs .tab {
    border:0;
    background:transparent;
    color:var(--muted-fg);
    padding:10px 12px;
    border-radius:999px;
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition:background 150ms ease, color 150ms ease;
  }
  .auth-tabs .tab.active {
    background:var(--gradient-accent);
    color:var(--on-accent);
  }

  .auth-card-heading h3 {
    margin:0 0 6px;
    font-family:var(--font-display);
    font-size:22px;
    font-weight:700;
    letter-spacing:-0.02em;
  }
  .auth-card-heading p {
    margin:0 0 20px;
    color:var(--muted-fg);
    font-size:14px;
  }

  .auth-form { display:flex; flex-direction:column; gap:14px; }
  .auth-field label {
    display:block;
    margin-bottom:7px;
    font-size:12.5px;
    font-weight:500;
    color:var(--muted-fg);
  }
  .auth-input {
    width:100%;
    background:var(--muted);
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    padding:11px 13px;
    color:var(--fg);
    font-size:14px;
    transition:border-color 150ms ease, box-shadow 150ms ease;
  }
  .auth-input::placeholder { color:var(--text-muted); }
  .auth-input:focus {
    border-color:var(--accent);
    outline:none;
    box-shadow:0 0 0 3px var(--accent-soft);
  }

  .auth-link-row { text-align:right; margin-top:-4px; }
  .auth-link-row a, .auth-terms a, .auth-switch button {
    color:var(--accent-ink);
    background:none;
    border:0;
    padding:0;
    font:inherit;
    cursor:pointer;
    text-decoration:none;
  }
  .auth-link-row a:hover, .auth-terms a:hover, .auth-switch button:hover {
    color:var(--accent-hover);
    text-decoration:underline;
  }

  .submit-btn {
    width:100%;
    min-height:46px;
    margin-top:4px;
    background:var(--gradient-accent);
    border:0;
    border-radius:999px;
    color:var(--on-accent);
    font-family:var(--font-display);
    font-size:15px;
    font-weight:700;
    cursor:pointer;
    box-shadow:0 8px 24px rgba(37,99,235,.28);
    transition:transform .15s ease, box-shadow .15s ease, filter .15s ease;
  }
  .submit-btn:hover:not(:disabled) { filter:brightness(1.04); transform:translateY(-1px); }
  .submit-btn:disabled { opacity:.55; cursor:not-allowed; box-shadow:none; }

  .auth-error {
    margin:0;
    padding:10px 12px;
    border-radius:var(--radius-sm);
    border:1px solid rgba(185,28,28,.3);
    background:rgba(185,28,28,.08);
    color:var(--destructive);
    font-size:13px;
  }
  .auth-terms, .auth-switch {
    margin:4px 0 0;
    color:var(--text-muted);
    font-size:12px;
    line-height:1.5;
    text-align:center;
  }

  .password-strength { margin-top:8px; }
  .strength-bars {
    display:flex;
    align-items:center;
    gap:6px;
    margin-bottom:8px;
  }
  .strength-bars span {
    flex:1;
    height:4px;
    border-radius:2px;
    background:var(--border);
  }
  .strength-bars span.filled { background:var(--accent); }
  .strength-bars b {
    font-size:11px;
    color:var(--muted-fg);
    font-weight:600;
    min-width:48px;
    text-align:right;
  }
  .strength-checks {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:4px 10px;
  }
  .strength-checks span {
    font-size:11px;
    color:var(--text-muted);
    display:flex;
    gap:6px;
    align-items:center;
  }
  .strength-checks span.ok { color:var(--accent-ink); }
  .strength-checks i { font-style:normal; width:12px; }

  @media (max-width: 860px) {
    .auth-layout { grid-template-columns:1fr; gap:32px; padding:28px 16px 48px; }
    .auth-hero blockquote { display:none; }
  }
`;
