import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

/**
 * PitchMateAuth
 * ─────────────
 * Beautiful auth page. Uses Supabase client-side auth directly
 * (sign up + sign in). On success the session is stored by Supabase
 * and `main.jsx` catches the auth state change → shows PitchMateAgent.
 */
export default function PitchMateAuth() {
    const [mode, setMode] = useState("signin");
    const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
    const [focused, setFocused] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const pts = Array.from({ length: 28 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            delay: Math.random() * 4,
            dur: Math.random() * 6 + 4,
        }));
        setParticles(pts);
    }, []);

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
                const { error: err } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: { data: { name: form.name } },
                });
                if (err) throw err;
            } else {
                const { error: err } = await supabase.auth.signInWithPassword({
                    email: form.email,
                    password: form.password,
                });
                if (err) throw err;
            }
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 2000);
        } catch (err) {
            setError(err.message || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const isSignup = mode === "signup";

    return (
        <div style={S.root}>
            <style>{CSS}</style>

            {/* Background orbs */}
            <div style={{
                position: "fixed", top: "-20%", left: "-15%", width: "55%", height: "55%",
                background: "radial-gradient(ellipse, rgba(99,60,255,0.18) 0%, transparent 70%)",
                animation: "orb1 12s ease-in-out infinite", pointerEvents: "none", zIndex: 0
            }} />
            <div style={{
                position: "fixed", bottom: "-25%", right: "-10%", width: "50%", height: "50%",
                background: "radial-gradient(ellipse, rgba(255,90,60,0.12) 0%, transparent 70%)",
                animation: "orb2 15s ease-in-out infinite", pointerEvents: "none", zIndex: 0
            }} />
            <div style={{
                position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
                backgroundImage: `linear-gradient(rgba(99,60,255,0.04) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(99,60,255,0.04) 1px, transparent 1px)`,
                backgroundSize: "60px 60px"
            }} />

            {particles.map((p) => (
                <div key={p.id} className="particle" style={{
                    left: `${p.x}%`, bottom: `${p.y % 30}%`, width: p.size, height: p.size,
                    animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`,
                }} />
            ))}

            <div style={S.layout}>
                {/* Left brand panel */}
                <div style={S.leftPanel}>
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <div style={S.logo}>
                            <div style={S.logoMark}>P</div>
                            <span style={S.logoText}>Pitchmate</span>
                        </div>
                        <div style={S.heroText}>
                            <div style={S.badge}>AI Pitch Co-pilot</div>
                            <h1 style={S.headline}>Turn your<br /><span style={S.gradientText}>idea</span><br />into a pitch.</h1>
                            <p style={S.subtext}>AI-powered deck review, market validation, investor strategy — all in one place.</p>
                        </div>
                        <div style={S.pills}>
                            {["Deck slide review & scoring", "Market size validation", "Go-to-market strategy", "Investor outreach emails"].map((t, i) => (
                                <div key={i} style={{ ...S.pill, animationDelay: `${i * 0.1}s` }}>
                                    <span style={{ color: "rgba(99,255,155,0.7)", fontSize: 12 }}>✓</span>
                                    <span style={S.pillText}>{t}</span>
                                </div>
                            ))}
                        </div>
                        <div style={S.testimonial}>
                            <div style={S.avatar}>AR</div>
                            <div>
                                <p style={S.quote}>"Got funded in 3 months after using Pitchmate."</p>
                                <p style={S.quoteAuthor}>Arjun R. · SaaS Founder, Series A</p>
                            </div>
                        </div>
                    </div>
                    <div style={S.ring} />
                </div>

                {/* Right auth panel */}
                <div style={S.rightPanel}>
                    <div style={S.card}>
                        {submitted && (
                            <div className="success-overlay">
                                <p style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 18, color: "#e8e6f0" }}>
                                    {isSignup ? "Account Created!" : "Welcome Back!"}
                                </p>
                                <p style={{ fontFamily: "DM Mono", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                                    {isSignup ? "Check your email to confirm." : "Loading your workspace..."}
                                </p>
                            </div>
                        )}

                        <div style={S.tabs}>
                            {["signin", "signup"].map((m) => (
                                <button key={m} className={`tab ${mode === m ? "active" : ""}`} onClick={() => { setMode(m); setError(""); }}>
                                    {m === "signin" ? "Sign In" : "Sign Up"}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginBottom: 28, animation: "fadeSlideUp 0.4s ease" }}>
                            <h2 style={S.cardTitle}>{isSignup ? "Create your account" : "Welcome back"}</h2>
                            <p style={S.cardSub}>{isSignup ? "Start your founder journey today" : "Continue building your pitch"}</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {isSignup && (
                                <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
                                    <label style={S.label}>Full Name</label>
                                    <div className="field-wrap">
                                        <input className="auth-input" type="text" placeholder="Jane Founder"
                                            value={form.name} onChange={(e) => update("name", e.target.value)}
                                            onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={S.label}>Email address</label>
                                <div className="field-wrap">
                                    <input className="auth-input" type="email" placeholder="you@startup.com"
                                        value={form.email} onChange={(e) => update("email", e.target.value)}
                                        onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
                                    <span className="field-icon">✉️</span>
                                </div>
                            </div>

                            <div>
                                <label style={S.label}>Password</label>
                                <div className="field-wrap">
                                    <input className="auth-input" type="password"
                                        placeholder={isSignup ? "Min. 8 characters" : "Enter your password"}
                                        value={form.password} onChange={(e) => update("password", e.target.value)}
                                        onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} />
                                </div>
                                {isSignup && form.password && <PasswordStrength password={form.password} />}
                            </div>

                            {isSignup && (
                                <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
                                    <label style={S.label}>Confirm Password</label>
                                    <div className="field-wrap">
                                        <input className="auth-input" type="password" placeholder="Re-enter password"
                                            value={form.confirm} onChange={(e) => update("confirm", e.target.value)}
                                            onFocus={() => setFocused("confirm")} onBlur={() => setFocused(null)} />
                                        <span className="field-icon" style={{ color: form.confirm && form.confirm === form.password ? "rgba(99,255,155,0.7)" : undefined }}>
                                            {form.confirm && form.confirm === form.password ? "✅" : "🔒"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!isSignup && (
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <a style={S.forgotLink} href="#">Forgot password?</a>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" style={{ marginTop: 6 }} disabled={loading}>
                                {loading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create Account" : "Sign In"}
                            </button>

                            {error && (
                                <p style={{ marginTop: 8, color: "#ff7b7b", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>{error}</p>
                            )}

                            {isSignup && (
                                <p style={S.terms}>
                                    By signing up, you agree to our{" "}
                                    <a style={S.link} href="#">Terms</a> and{" "}
                                    <a style={S.link} href="#">Privacy Policy</a>
                                </p>
                            )}
                        </form>

                        <p style={S.switchText}>
                            {isSignup ? "Already have an account? " : "Don't have an account? "}
                            <span style={S.switchLink} onClick={() => { setMode(isSignup ? "signin" : "signup"); setError(""); }}>
                                {isSignup ? "Sign In" : "Sign Up Free"}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
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
    const colors = ["#ff4444", "#ff8844", "#ffcc44", "#44ff88"];
    const labels = ["Weak", "Fair", "Good", "Strong"];
    return (
        <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div style={{
                            height: "100%", borderRadius: 2, transition: "width 0.4s, background 0.4s",
                            width: i < score ? "100%" : "0%", background: colors[score - 1] || "#ff4444"
                        }} />
                    </div>
                ))}
                <span style={{ fontFamily: "DM Mono", fontSize: 11, color: colors[score - 1] || "rgba(255,255,255,0.3)", marginLeft: 8, whiteSpace: "nowrap" }}>
                    {score > 0 ? labels[score - 1] : ""}
                </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {checks.map((c) => (
                    <div key={c.label} style={{
                        display: "flex", alignItems: "center", gap: 8, fontFamily: "DM Mono", fontSize: 11,
                        color: c.ok ? "rgba(99,255,155,0.7)" : "rgba(255,255,255,0.35)"
                    }}>
                        <div style={{
                            width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                            background: c.ok ? "rgba(99,255,155,0.7)" : "rgba(255,255,255,0.15)", transition: "background 0.3s"
                        }} />
                        {c.label}
                    </div>
                ))}
            </div>
        </div>
    );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes floatUp { 0% { transform: translateY(0) scale(1); opacity:.6; } 50% { opacity:1; } 100% { transform: translateY(-120px) scale(.4); opacity:0; } }
  @keyframes fadeSlideUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeSlideIn { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
  @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
  @keyframes orb1 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(30px,-20px) scale(1.1); } 66% { transform:translate(-20px,15px) scale(.95); } }
  @keyframes orb2 { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-25px,20px) scale(1.05); } 66% { transform:translate(15px,-25px) scale(1.1); } }
  @keyframes successPop { 0% { transform:scale(.8); opacity:0; } 60% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }
  .particle { position:absolute; border-radius:50%; background:rgba(99,60,255,.5); animation:floatUp linear infinite; pointer-events:none; }
  .auth-input { width:100%; background:rgba(255,255,255,.04); border:1.5px solid rgba(255,255,255,.09); border-radius:14px; padding:14px 18px; color:#e8e6f0; font-family:'Syne',sans-serif; font-size:14px; outline:none; transition:border-color .25s,background .25s,box-shadow .25s; }
  .auth-input::placeholder { color:rgba(255,255,255,.22); }
  .auth-input:focus { border-color:rgba(99,60,255,.6); background:rgba(99,60,255,.07); box-shadow:0 0 0 3px rgba(99,60,255,.12); }
  .submit-btn { width:100%; padding:15px; border:none; border-radius:14px; background:linear-gradient(135deg,#633cff 0%,#4a2acc 50%,#ff5a3c 100%); background-size:200% 200%; color:white; font-family:'Syne',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:transform .2s,box-shadow .2s; position:relative; overflow:hidden; }
  .submit-btn:hover { transform:translateY(-2px); box-shadow:0 8px 30px rgba(99,60,255,.4); }
  .submit-btn:active { transform:translateY(0); }
  .submit-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent); background-size:200% 100%; animation:shimmer 2s infinite; }
  .tab { flex:1; padding:10px; background:none; border:none; color:rgba(255,255,255,.35); font-family:'Syne',sans-serif; font-size:14px; font-weight:600; cursor:pointer; border-radius:10px; transition:all .2s; }
  .tab.active { color:#e8e6f0; background:rgba(99,60,255,.2); }
  .field-wrap { position:relative; }
  .field-icon { position:absolute; right:16px; top:50%; transform:translateY(-50%); color:rgba(255,255,255,.2); font-size:16px; transition:color .2s; pointer-events:none; }
  .success-overlay { position:absolute; inset:0; background:rgba(10,10,15,.95); border-radius:24px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; animation:successPop .4s ease; z-index:20; }
`;

const S = {
    root: { minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Syne',sans-serif", color: "#e8e6f0", display: "flex", alignItems: "stretch", position: "relative", overflow: "hidden" },
    layout: { display: "flex", width: "100%", minHeight: "100vh", position: "relative", zIndex: 5 },
    leftPanel: { flex: "1.1", padding: "48px 56px", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden", borderRight: "1px solid rgba(255,255,255,.06)" },
    logo: { display: "flex", alignItems: "center", gap: 12, marginBottom: 64, animation: "fadeSlideUp .5s ease" },
    logoMark: { width: 40, height: 40, background: "linear-gradient(135deg,#633cff,#ff5a3c)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "white" },
    logoText: { fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg,#e8e6f0,#9b8cff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    heroText: { marginBottom: 48, animation: "fadeSlideUp .5s ease .1s both" },
    badge: { display: "inline-block", padding: "6px 14px", background: "rgba(99,60,255,.15)", border: "1px solid rgba(99,60,255,.3)", borderRadius: 100, fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#9b8cff", marginBottom: 20, letterSpacing: "0.5px" },
    headline: { fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 20 },
    gradientText: { background: "linear-gradient(135deg,#633cff,#ff5a3c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
    subtext: { fontSize: 15, color: "rgba(255,255,255,.45)", lineHeight: 1.7, maxWidth: 360 },
    pills: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 48, animation: "fadeSlideUp .5s ease .2s both" },
    pill: { display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 12, fontSize: 13, width: "fit-content", animation: "fadeSlideIn .4s ease both" },
    pillText: { color: "rgba(255,255,255,.6)" },
    testimonial: { display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, animation: "fadeSlideUp .5s ease .3s both" },
    avatar: { width: 40, height: 40, background: "linear-gradient(135deg,#633cff,#ff5a3c)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0 },
    quote: { fontSize: 13, color: "rgba(255,255,255,.7)", lineHeight: 1.5, marginBottom: 4 },
    quoteAuthor: { fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,.3)" },
    ring: { position: "absolute", right: -200, top: "50%", transform: "translateY(-50%)", width: 500, height: 500, border: "1px solid rgba(99,60,255,.08)", borderRadius: "50%", pointerEvents: "none" },
    rightPanel: { flex: "0.9", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" },
    card: { width: "100%", maxWidth: 420, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 24, padding: "36px", backdropFilter: "blur(20px)", position: "relative", overflow: "hidden" },
    tabs: { display: "flex", gap: 6, marginBottom: 28, background: "rgba(255,255,255,.04)", padding: 5, borderRadius: 14 },
    cardTitle: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 6 },
    cardSub: { fontSize: 13, color: "rgba(255,255,255,.4)", fontFamily: "'DM Mono',monospace" },
    label: { display: "block", fontSize: 12, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,.4)", marginBottom: 8, letterSpacing: "0.3px" },
    forgotLink: { fontSize: 12, color: "rgba(99,60,255,.8)", textDecoration: "none", fontFamily: "'DM Mono',monospace" },
    terms: { fontSize: 11, color: "rgba(255,255,255,.3)", fontFamily: "'DM Mono',monospace", lineHeight: 1.6 },
    link: { color: "rgba(99,60,255,.8)", textDecoration: "none" },
    switchText: { marginTop: 24, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.35)", fontFamily: "'DM Mono',monospace" },
    switchLink: { color: "#9b8cff", cursor: "pointer", fontWeight: 600 },
};
