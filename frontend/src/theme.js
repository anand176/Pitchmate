/**
 * Shared SaaS-product design tokens + global CSS for Pitchmate.
 * White surfaces, blue-600 accent, soft elevation — light SaaS dashboard look.
 *
 * Contrast note: the brand blue (#2563EB) is dark/saturated enough to pass
 * AA directly as text on white (~5.3:1), so `--accent` doubles as
 * `--accent-ink` was needed for before. It fails AA with *dark* text on top
 * though (~4:1), so solid fills (buttons, fab, gradient) use white text via
 * `--on-accent`. `--accent-2` (amber) and `--accent-3` (indigo) stay
 * pre-darkened since they're only ever used as text/border, never fills.
 */

export const COLORS = {
    bg: "#F5F7FA",
    foreground: "#0F172A",
    card: "#FFFFFF",
    muted: "#F1F5F9",
    mutedForeground: "#64748B",
    accent: "#2563EB",
    accentInk: "#1D4ED8",
    accentHover: "#1D4ED8",
    accentSoft: "rgba(37, 99, 235, 0.08)",
    accentSecondary: "#B45309",
    accentTertiary: "#4338CA",
    border: "#E2E8F0",
    hover: "#EEF2F6",
    input: "#F8FAFC",
    destructive: "#B91C1C",
    text: "#0F172A",
    textSecondary: "#64748B",
    textMuted: "#94A3B8",
};

export const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap');

  :root {
    --bg: #EEF1F7;
    --surface: #FFFFFF;
    --card: #FFFFFF;
    --surface-2: #E4E9F2;
    --muted: #E4E9F2;
    --border: #DCE3EC;
    --border-strong: #BFCADA;
    --hover: #E9EEF5;
    --fg: #0F172A;
    --text: #0F172A;
    --muted-fg: #64748B;
    --text-secondary: #64748B;
    --text-muted: #94A3B8;
    --accent: #2563EB;
    --accent-ink: #1D4ED8;
    --accent-hover: #1D4ED8;
    --accent-soft: rgba(37, 99, 235, 0.08);
    --accent-glow: rgba(37, 99, 235, 0.32);
    --accent-2: #B45309;
    --accent-2-soft: rgba(180, 83, 9, 0.10);
    --accent-3: #4338CA;
    --accent-3-soft: rgba(67, 56, 202, 0.08);
    --on-accent: #FFFFFF;
    --gradient-accent: linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
    --gradient-accent-text: linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 55%, #2563EB 100%);
    --destructive: #B91C1C;
    --destructive-soft: rgba(185, 28, 28, 0.07);
    --input: #F8FAFC;
    --font-body: 'Inter', system-ui, sans-serif;
    --font-display: 'Outfit', system-ui, sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
    --radius: 14px;
    --radius-sm: 10px;
    --radius-lg: 20px;
    --radius-pill: 999px;
    --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
    --shadow-md: 0 10px 28px rgba(15, 23, 42, 0.10);
    --shadow-lg: 0 24px 56px rgba(15, 23, 42, 0.14);
  }

  * { box-sizing:border-box; }
  html, body, #root { min-height:100%; background:var(--bg); }
  body {
    margin:0;
    color:var(--fg);
    font-family:var(--font-body);
    background:
      radial-gradient(1100px 520px at 8% -8%, rgba(37, 99, 235, 0.07), transparent 60%),
      radial-gradient(900px 480px at 100% 0%, rgba(67, 56, 202, 0.05), transparent 55%),
      var(--bg);
    background-attachment:fixed;
  }
  button, input, textarea, select { font:inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline:none;
    box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
  }

  .font-serif, .font-display { font-family:var(--font-display); }
  .font-body, .font-sans { font-family:var(--font-body); }
  .font-mono { font-family:var(--font-mono); }

  .cyber-chamfer { border-radius:var(--radius); }
  .cyber-chamfer-sm { border-radius:var(--radius-sm); }

  @keyframes dash-blink {
    0%,100% { opacity:1; }
    50% { opacity:.35; }
  }
  @keyframes dash-spin { to { transform:rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .dash-spinner, .chat-step.active .chat-step-dot { animation:none !important; }
    .chat-overlay, .chat-panel { transition:none !important; }
  }

  .dash-app {
    min-height:100vh;
    background-color:transparent;
    color:var(--fg);
    display:flex;
    flex-direction:column;
    font-family:var(--font-body);
    overflow:hidden;
    position:relative;
  }

  .dash-header {
    padding:12px 24px;
    border-bottom:1px solid var(--border);
    display:grid;
    grid-template-columns:auto 1fr auto;
    align-items:center;
    gap:18px;
    position:sticky;
    top:0;
    z-index:40;
    background:rgba(255, 255, 255, 0.82);
    backdrop-filter:blur(16px) saturate(140%);
    box-shadow:var(--shadow-sm);
  }
  .dash-logo-mark {
    width:38px;
    height:38px;
    background:var(--gradient-accent);
    border-radius:var(--radius-sm);
    color:var(--on-accent);
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:var(--font-display);
    font-size:18px;
    font-weight:800;
    flex-shrink:0;
    box-shadow:0 4px 16px var(--accent-glow);
  }
  .dash-header-text h1 {
    margin:0;
    font-family:var(--font-display);
    font-size:20px;
    font-weight:700;
    line-height:1;
    letter-spacing:-0.01em;
    color:var(--fg);
  }
  .dash-header-text p {
    margin:5px 0 0;
    color:var(--text-muted);
    font-family:var(--font-body);
    font-size:12px;
    letter-spacing:0.01em;
  }
  .dash-header-right {
    margin-left:auto;
    display:flex;
    align-items:center;
    gap:10px;
  }
  .dash-user-badge {
    width:32px;
    height:32px;
    background:var(--surface-2);
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    display:flex;
    align-items:center;
    justify-content:center;
    color:var(--accent-ink);
    font-family:var(--font-display);
    font-size:12px;
    font-weight:700;
    flex-shrink:0;
  }
  .dash-edition {
    border-left:1px solid var(--border);
    padding-left:12px;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    letter-spacing:0.08em;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .dash-btn-ghost {
    min-height:38px;
    padding:8px 14px;
    background:transparent;
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    color:var(--fg);
    font-family:var(--font-body);
    font-size:13px;
    font-weight:500;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:6px;
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease;
    white-space:nowrap;
  }
  .dash-btn-ghost:hover {
    background:var(--hover);
    border-color:var(--border-strong);
    color:var(--accent-ink);
  }

  .dash-body {
    display:flex;
    flex:1;
    min-height:0;
  }
  .dash-sidebar {
    width:236px;
    flex-shrink:0;
    border-right:1px solid var(--border);
    overflow-y:auto;
    background:var(--muted);
    display:flex;
    flex-direction:column;
    padding:14px 12px;
    gap:2px;
  }
  .dash-sidebar-label {
    padding:6px 10px 10px;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    letter-spacing:0.1em;
    text-transform:uppercase;
  }
  .dash-nav-item {
    position:relative;
    z-index:0;
    min-height:42px;
    display:flex;
    align-items:center;
    gap:11px;
    padding:9px 12px;
    border-radius:var(--radius-sm);
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:13.5px;
    font-weight:500;
    letter-spacing:0;
    text-decoration:none;
    transition:background 150ms ease, color 150ms ease;
  }
  .dash-nav-item:hover {
    background:var(--hover);
    color:var(--fg);
  }
  .dash-nav-item.active {
    color:var(--accent-ink);
  }
  .dash-nav-item.active .dash-nav-icon { color:var(--accent-ink); }
  .dash-nav-active-bg {
    position:absolute;
    inset:0;
    z-index:-1;
    background:var(--accent-soft);
    border-radius:var(--radius-sm);
  }
  .dash-nav-icon {
    width:20px;
    height:20px;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    color:var(--text-muted);
    position:relative;
  }
  .dash-nav-icon svg { width:18px; height:18px; }
  .dash-nav-divider {
    height:1px;
    background:var(--border);
    margin:8px 6px;
  }

  .dash-content {
    flex:1;
    overflow-y:auto;
    padding:32px 36px 64px;
    background:transparent;
  }
  .dash-content::-webkit-scrollbar,
  .dash-sidebar::-webkit-scrollbar,
  .chat-messages::-webkit-scrollbar { width:6px; }
  .dash-content::-webkit-scrollbar-thumb,
  .dash-sidebar::-webkit-scrollbar-thumb,
  .chat-messages::-webkit-scrollbar-thumb {
    background:var(--border-strong);
    border-radius:4px;
  }

  .dash-page-header {
    margin:0 0 28px;
    display:flex;
    align-items:flex-end;
    justify-content:space-between;
    gap:24px;
    flex-wrap:wrap;
  }
  .dash-page-header h2 {
    margin:0 0 6px;
    font-family:var(--font-display);
    font-size:clamp(24px, 3.2vw, 32px);
    font-weight:700;
    line-height:1.15;
    letter-spacing:-0.02em;
    color:var(--fg);
  }
  .dash-page-header p {
    margin:0;
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:14px;
    line-height:1.6;
    max-width:56ch;
  }

  .dash-grid {
    display:grid;
    grid-template-columns:minmax(280px, 5fr) minmax(0, 7fr);
    align-items:start;
    gap:18px;
  }
  .dash-grid > * {
    min-width:0;
  }

  .dash-card {
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius-lg);
    padding:24px;
    color:var(--fg);
    position:relative;
    box-shadow:var(--shadow-sm);
    transition:border-color 200ms ease, box-shadow 200ms ease;
  }
  .dash-card:hover {
    border-color:var(--border-strong);
    box-shadow:var(--shadow-md);
  }
  .dash-card h3 {
    margin:0 0 18px;
    padding-bottom:0;
    color:var(--fg);
    font-family:var(--font-display);
    font-size:16px;
    font-weight:600;
    line-height:1.3;
    letter-spacing:0;
  }
  .dash-card + .dash-card { margin-top:16px; }

  .dash-field { margin-bottom:14px; position:relative; }
  .dash-field label {
    display:block;
    margin-bottom:7px;
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:12.5px;
    font-weight:500;
  }
  .dash-input, .dash-textarea, .dash-select {
    width:100%;
    background:var(--input);
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    padding:10px 13px;
    color:var(--fg);
    font-family:var(--font-body);
    font-size:14px;
    outline:none;
    transition:border-color 150ms ease, box-shadow 150ms ease, background 150ms ease;
  }
  .dash-input::placeholder, .dash-textarea::placeholder { color:var(--text-muted); }
  .dash-input:focus, .dash-textarea:focus, .dash-select:focus {
    border-color:var(--accent);
    box-shadow:0 0 0 3px var(--accent-soft);
    background:#FFFFFF;
  }
  .dash-textarea {
    min-height:78px;
    resize:vertical;
    line-height:1.55;
  }
  .dash-select { cursor:pointer; }
  .dash-select option { background:var(--card); color:var(--fg); }
  .dash-row { display:flex; gap:12px; }
  .dash-row > .dash-field { flex:1; }
  .dash-slider-row { display:flex; align-items:center; gap:10px; }
  .dash-slider-row input[type=range] { flex:1; accent-color:var(--accent); }
  .dash-slider-value {
    width:26px;
    color:var(--accent-ink);
    font-family:var(--font-display);
    font-size:13px;
    font-weight:700;
    text-align:right;
  }

  .dash-btn-primary {
    width:100%;
    min-height:44px;
    padding:12px 18px;
    background:var(--gradient-accent);
    border:1px solid transparent;
    border-radius:var(--radius-pill);
    color:var(--on-accent);
    font-family:var(--font-display);
    font-size:13.5px;
    font-weight:700;
    letter-spacing:0.01em;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    box-shadow:0 6px 20px var(--accent-glow);
    transition:box-shadow 150ms ease, filter 150ms ease;
  }
  .dash-btn-primary:hover:not(:disabled) {
    filter:brightness(1.04);
    box-shadow:0 10px 28px var(--accent-glow);
  }
  .dash-btn-primary:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
  .dash-btn-secondary {
    min-height:42px;
    padding:10px 16px;
    background:transparent;
    border:1px solid rgba(180, 83, 9, 0.35);
    border-radius:var(--radius-pill);
    color:var(--accent-2);
    font-family:var(--font-display);
    font-size:12.5px;
    font-weight:600;
    letter-spacing:0.01em;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:6px;
    transition:background 150ms ease, color 150ms ease;
  }
  .dash-btn-secondary:hover:not(:disabled) {
    background:var(--accent-2-soft);
  }
  .dash-btn-secondary:disabled { opacity:.45; cursor:not-allowed; }

  .dash-error {
    margin-top:12px;
    padding:11px 14px;
    background:var(--destructive-soft);
    border:1px solid rgba(185, 28, 28, 0.25);
    border-radius:var(--radius-sm);
    color:var(--destructive);
    font-family:var(--font-body);
    font-size:13px;
    line-height:1.5;
  }
  .dash-empty {
    min-height:240px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    gap:12px;
    padding:40px 24px;
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:14px;
    line-height:1.7;
    text-align:center;
  }
  .dash-empty-icon {
    width:44px;
    height:44px;
    border-radius:var(--radius-pill);
    background:var(--surface-2);
    border:1px solid var(--border);
    color:var(--text-muted);
    display:flex;
    align-items:center;
    justify-content:center;
  }

  .dash-loading {
    display:flex;
    align-items:center;
    gap:10px;
    padding:18px 0;
    color:var(--accent-ink);
    font-family:var(--font-body);
    font-size:13px;
    font-weight:500;
  }
  .dash-spinner {
    width:15px;
    height:15px;
    border:2px solid var(--border);
    border-top-color:var(--accent);
    border-radius:50%;
    animation:dash-spin .7s linear infinite;
    flex-shrink:0;
  }

  .dash-section-title {
    margin:22px 0 10px;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    font-weight:500;
    letter-spacing:0.1em;
    text-transform:uppercase;
  }
  .dash-section-title:first-child { margin-top:0; }
  .dash-lastrun {
    margin:0 0 12px;
    display:inline-flex;
    align-items:center;
    gap:6px;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    letter-spacing:0.06em;
    text-transform:uppercase;
  }
  .dash-prefill-note {
    margin:-6px 0 14px;
    color:var(--accent-ink);
    font-family:var(--font-body);
    font-size:12px;
    font-weight:500;
    display:flex;
    align-items:center;
    gap:6px;
  }
  .dash-kb-note {
    margin:0 0 14px;
    padding:8px 12px;
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    background:var(--surface-2);
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:12.5px;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .dash-kb-note b { color:var(--accent-ink); font-weight:600; }

  /* Signal pill — semantic status (warm/lukewarm/dead), independent of accent. */
  .dash-signal {
    display:inline-flex;
    align-items:center;
    gap:8px;
    margin-bottom:14px;
    padding:7px 16px;
    border-radius:var(--radius-pill);
    font-family:var(--font-display);
    font-size:13px;
    font-weight:700;
    letter-spacing:0.01em;
    text-transform:capitalize;
    border:1px solid transparent;
  }
  .dash-signal::before {
    content:'';
    width:8px; height:8px; border-radius:50%;
    background:currentColor;
    box-shadow:0 0 0 3px color-mix(in srgb, currentColor 20%, transparent);
  }
  .dash-signal.warm     { background:#ECFDF5; border-color:#A7F3D0; color:#047857; }
  .dash-signal.lukewarm { background:#FFFBEB; border-color:#FDE68A; color:#B45309; }
  .dash-signal.dead     { background:#FEF2F2; border-color:#FECACA; color:#B91C1C; }

  .dash-followup {
    margin-top:6px;
    padding:14px 16px;
    border:1px solid var(--border);
    border-left:3px solid var(--accent);
    border-radius:var(--radius-sm);
    background:var(--surface-2);
    color:var(--fg);
    font-family:var(--font-body);
    font-size:13.5px;
    line-height:1.6;
    white-space:pre-wrap;
  }
  .dash-copy-btn {
    margin-top:10px;
    min-height:34px;
    padding:7px 14px;
    background:transparent;
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    color:var(--accent-ink);
    font-family:var(--font-body);
    font-size:12.5px;
    font-weight:600;
    cursor:pointer;
    display:inline-flex;
    align-items:center;
    gap:6px;
    transition:background 150ms ease, border-color 150ms ease;
  }
  .dash-copy-btn:hover { background:var(--accent-soft); border-color:rgba(37,99,235,0.3); }
  .dash-list { display:flex; flex-direction:column; gap:6px; }
  .dash-list-item {
    display:flex;
    gap:9px;
    color:var(--fg);
    font-family:var(--font-body);
    font-size:14px;
    line-height:1.6;
  }
  .dash-list-item .bullet {
    color:var(--accent-ink);
    flex-shrink:0;
  }
  .dash-tag {
    display:inline-flex;
    align-items:center;
    margin:2px 4px 2px 0;
    padding:4px 10px;
    background:var(--accent-soft);
    border:1px solid rgba(37, 99, 235, 0.25);
    border-radius:var(--radius-pill);
    color:var(--accent-ink);
    font-family:var(--font-body);
    font-size:11px;
    font-weight:600;
    letter-spacing:0.01em;
  }
  .dash-tag.warn, .dash-tag.danger {
    background:var(--destructive-soft);
    border-color:rgba(185, 28, 28, 0.3);
    color:var(--destructive);
  }
  .dash-verdict {
    display:inline-block;
    margin-bottom:14px;
    padding:6px 14px;
    border:1px solid rgba(67, 56, 202, 0.2);
    border-radius:var(--radius-pill);
    background:var(--accent-3-soft);
    color:var(--accent-3);
    font-family:var(--font-body);
    font-size:12px;
    font-weight:600;
  }
  .dash-verdict.credible {
    background:var(--accent-soft);
    border-color:rgba(37, 99, 235, 0.25);
    color:var(--accent-ink);
  }
  .dash-verdict.needs_work {
    background:var(--accent-2-soft);
    border-color:rgba(180, 83, 9, 0.3);
    color:var(--accent-2);
  }
  .dash-verdict.not_credible {
    background:var(--destructive-soft);
    border-color:rgba(185, 28, 28, 0.3);
    color:var(--destructive);
  }

  .dash-table {
    width:100%;
    border-collapse:separate;
    border-spacing:0;
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    overflow:hidden;
    font-family:var(--font-body);
    font-size:13px;
  }
  .dash-table th {
    padding:9px 12px;
    background:var(--surface-2);
    border-bottom:1px solid var(--border);
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    letter-spacing:0.08em;
    text-align:left;
    text-transform:uppercase;
    font-weight:500;
  }
  .dash-table td {
    padding:10px 12px;
    border-bottom:1px solid var(--border);
    color:var(--fg);
    vertical-align:top;
  }
  .dash-table tr:last-child td { border-bottom:0; }

  .dash-valuation-range {
    margin-bottom:4px;
    background:var(--gradient-accent-text);
    -webkit-background-clip:text;
    background-clip:text;
    color:transparent;
    font-family:var(--font-display);
    font-size:38px;
    font-weight:800;
    line-height:1.1;
    letter-spacing:-0.02em;
  }
  .dash-valuation-sub {
    margin-bottom:18px;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:11px;
    letter-spacing:0.06em;
    text-transform:uppercase;
  }

  .dash-phase {
    position:relative;
    margin:0 0 12px;
    padding:14px 16px 14px 44px;
    border:1px solid var(--border);
    border-radius:var(--radius);
    background:var(--surface-2);
    transition:border-color 150ms ease, background 150ms ease;
  }
  .dash-phase:hover {
    border-color:rgba(37, 99, 235, 0.3);
    background:var(--hover);
  }
  .dash-phase::before {
    content:'';
    position:absolute;
    left:17px;
    top:19px;
    width:9px;
    height:9px;
    background:var(--gradient-accent);
    border-radius:50%;
  }
  .dash-phase h4 {
    margin:0 0 4px;
    color:var(--fg);
    font-family:var(--font-display);
    font-size:16px;
    font-weight:600;
    letter-spacing:0;
  }
  .dash-phase p {
    margin:0 0 8px;
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:13px;
    line-height:1.55;
  }

  .dash-stat-grid {
    display:grid;
    grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));
    gap:12px;
    margin-bottom:20px;
  }
  .dash-stat-tile {
    padding:16px 18px;
    background:var(--surface-2);
    border:1px solid var(--border);
    border-radius:var(--radius);
  }
  .dash-stat-tile .stat-icon {
    width:32px; height:32px;
    border-radius:var(--radius-sm);
    background:var(--accent-soft);
    color:var(--accent-ink);
    display:flex; align-items:center; justify-content:center;
    margin-bottom:10px;
  }
  .dash-stat-tile .stat-value {
    font-family:var(--font-display); font-size:22px; font-weight:700;
    color:var(--fg); line-height:1.1;
  }
  .dash-stat-tile .stat-label {
    margin-top:4px;
    font-family:var(--font-body); font-size:12px; color:var(--text-muted);
  }

  /* ── Fundraise pipeline ──────────────────────────────────────── */
  .pipeline-progress-row {
    display:flex; align-items:baseline; justify-content:space-between; margin-bottom:8px; gap:8px; flex-wrap:wrap;
  }
  .pipeline-progress-amounts {
    font-family:var(--font-display); font-size:20px; font-weight:700; color:var(--fg);
  }
  .pipeline-progress-amounts span { color:var(--text-muted); font-size:13px; font-weight:500; }
  .pipeline-stat-row { display:flex; gap:10px; margin-top:14px; flex-wrap:wrap; }
  .pipeline-mini-stat {
    flex:1; min-width:90px; padding:10px 12px; border:1px solid var(--border);
    border-radius:var(--radius-sm); background:var(--surface-2); text-align:center;
  }
  .pipeline-mini-stat .mini-value {
    font-family:var(--font-display); font-size:19px; font-weight:700; color:var(--accent-ink); line-height:1.1;
  }
  .pipeline-mini-stat .mini-label {
    margin-top:3px; font-family:var(--font-body); font-size:10.5px; color:var(--text-muted);
    text-transform:uppercase; letter-spacing:0.04em;
  }

  .funnel-list { display:flex; flex-direction:column; gap:11px; }
  .funnel-row { display:grid; grid-template-columns:136px 1fr 32px; align-items:center; gap:10px; }
  .funnel-label { font-family:var(--font-body); font-size:12.5px; color:var(--text-secondary); font-weight:500; }
  .funnel-track {
    height:20px; background:var(--surface-2); border:1px solid var(--border);
    border-radius:var(--radius-sm); overflow:hidden;
  }
  .funnel-fill {
    height:100%; background:var(--gradient-accent); border-radius:var(--radius-sm);
    transition:width 320ms ease; min-width:2px;
  }
  .funnel-count {
    font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--accent-ink); text-align:right;
  }

  .investor-add-form { display:flex; flex-direction:column; gap:0; }
  .investor-list { display:flex; flex-direction:column; gap:10px; }
  .investor-card {
    border:1px solid var(--border); border-radius:var(--radius); padding:14px 16px; background:var(--surface-2);
    transition:border-color 150ms ease;
  }
  .investor-card:hover { border-color:var(--border-strong); }
  .investor-card-top {
    display:flex; align-items:flex-start; justify-content:space-between; gap:10px; flex-wrap:wrap;
  }
  .investor-name { font-family:var(--font-display); font-size:14.5px; font-weight:700; color:var(--fg); }
  .investor-firm { font-family:var(--font-body); font-size:12.5px; color:var(--text-muted); margin-top:1px; }
  .investor-card-actions { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .investor-stage-select { min-height:32px; padding:5px 10px; font-size:12px; width:auto; }
  .warmth-btn-group { display:flex; gap:4px; }
  .warmth-btn {
    border:1px solid var(--border); background:var(--card); border-radius:var(--radius-pill);
    padding:4px 10px; font-family:var(--font-body); font-size:11px; font-weight:600; cursor:pointer;
    color:var(--text-secondary); text-transform:capitalize; transition:background 150ms ease, border-color 150ms ease;
  }
  .warmth-btn:hover { border-color:var(--border-strong); }
  .warmth-btn.active.cold { background:rgba(37,99,235,0.10); border-color:rgba(37,99,235,0.3); color:var(--accent-ink); }
  .warmth-btn.active.warm { background:#FFFBEB; border-color:#FDE68A; color:#B45309; }
  .warmth-btn.active.hot { background:#FEF2F2; border-color:#FECACA; color:#B91C1C; }
  .investor-meta-row {
    display:flex; gap:14px; flex-wrap:wrap; margin-top:10px;
    font-family:var(--font-body); font-size:12.5px; color:var(--text-secondary);
  }
  .investor-meta-row b { color:var(--fg); font-weight:600; }
  .investor-notes {
    margin-top:8px; font-family:var(--font-body); font-size:12.5px; color:var(--text-secondary); line-height:1.5;
  }
  .investor-delete-btn {
    min-height:28px; padding:4px 10px; background:transparent; border:1px solid transparent;
    border-radius:var(--radius-pill); color:var(--text-muted); font-family:var(--font-body);
    font-size:11px; cursor:pointer; transition:background 150ms ease, color 150ms ease, border-color 150ms ease;
  }
  .investor-delete-btn:hover { color:var(--destructive); border-color:rgba(185,28,28,0.25); background:var(--destructive-soft); }
  .investor-followup-row { display:flex; gap:6px; align-items:center; margin-top:10px; flex-wrap:wrap; }
  .investor-followup-row input[type=date] {
    background:var(--input); border:1px solid var(--border); border-radius:var(--radius-sm);
    padding:6px 9px; font-family:var(--font-body); font-size:12px; color:var(--fg);
  }
  .pipeline-empty-board {
    text-align:center; padding:36px 20px; color:var(--text-muted);
    font-family:var(--font-body); font-size:13px; line-height:1.6;
  }
  .pipeline-sync-row { display:flex; gap:10px; align-items:center; margin-top:16px; flex-wrap:wrap; }

  /* ── Roadmap board ───────────────────────────────────────────── */
  .roadmap-board {
    display:flex; gap:14px; overflow-x:auto; padding-bottom:8px;
  }
  .roadmap-column {
    flex:0 0 260px; width:260px;
    background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius-lg);
    padding:12px; display:flex; flex-direction:column; gap:10px;
    transition:background 150ms ease, border-color 150ms ease;
  }
  .roadmap-column.drag-over { background:var(--accent-soft); border-color:rgba(37,99,235,0.35); }
  .roadmap-column-head {
    display:flex; align-items:center; justify-content:space-between;
    font-family:var(--font-display); font-size:13px; font-weight:700; color:var(--fg);
    padding:2px 2px 4px;
  }
  .roadmap-add-btn {
    width:22px; height:22px; border-radius:50%; border:1px solid var(--border);
    background:var(--card); color:var(--text-secondary); display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:background 150ms ease, color 150ms ease;
  }
  .roadmap-add-btn:hover { background:var(--accent-soft); color:var(--accent-ink); }
  .roadmap-add-form {
    display:flex; flex-direction:column; gap:8px;
    background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px;
  }
  .roadmap-add-form .dash-input, .roadmap-add-form .dash-select { min-height:34px; font-size:12.5px; padding:7px 10px; }
  .roadmap-add-actions { display:flex; gap:8px; }
  .roadmap-add-actions .dash-btn-primary, .roadmap-add-actions .dash-btn-secondary { min-height:30px; padding:5px 12px; font-size:12px; }
  .roadmap-empty-col {
    text-align:center; padding:20px 8px; color:var(--text-muted); font-family:var(--font-body); font-size:11.5px;
  }
  .roadmap-card {
    background:var(--card); border:1px solid var(--border); border-left:3px solid var(--border-strong);
    border-radius:var(--radius-sm); padding:11px 12px; cursor:grab;
    transition:box-shadow 150ms ease, border-color 150ms ease;
  }
  .roadmap-card:active { cursor:grabbing; }
  .roadmap-card:hover { box-shadow:var(--shadow-sm); }
  .roadmap-card.status-in_progress { border-left-color:#B45309; }
  .roadmap-card.status-shipped { border-left-color:#059669; }
  .roadmap-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
  .roadmap-card-title { font-family:var(--font-body); font-size:13px; font-weight:600; color:var(--fg); line-height:1.4; }
  .roadmap-card-close {
    flex-shrink:0; width:18px; height:18px; border-radius:50%; border:0; background:transparent;
    color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer;
    transition:background 150ms ease, color 150ms ease;
  }
  .roadmap-card-close:hover { background:var(--destructive-soft); color:var(--destructive); }
  .roadmap-card-desc { margin:6px 0 0; font-family:var(--font-body); font-size:11.5px; color:var(--text-muted); line-height:1.5; }
  .roadmap-card-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:9px; flex-wrap:wrap; }
  .roadmap-card-tag {
    padding:2px 8px; border-radius:var(--radius-pill); background:var(--accent-soft); color:var(--accent-ink);
    font-family:var(--font-body); font-size:10.5px; font-weight:600;
  }
  .roadmap-status-btn {
    border:1px solid var(--border); background:transparent; border-radius:var(--radius-pill);
    padding:2px 9px; font-family:var(--font-body); font-size:10.5px; font-weight:600; cursor:pointer;
    color:var(--text-secondary); transition:background 150ms ease, border-color 150ms ease;
  }
  .roadmap-status-btn.in_progress { color:#B45309; border-color:#FDE68A; background:#FFFBEB; }
  .roadmap-status-btn.shipped { color:#059669; border-color:#A7F3D0; background:#ECFDF5; }

  /* ── Generic modal (roadmap AI-generate, etc.) ───────────────── */
  .dash-modal-overlay {
    position:fixed; inset:0; z-index:90;
    background:rgba(15, 23, 42, 0.4); backdrop-filter:blur(2px);
    display:flex; align-items:center; justify-content:center; padding:24px;
  }
  .dash-modal {
    width:min(520px, 100%);
    max-height:min(640px, 90vh);
    overflow-y:auto;
    background:var(--card); border:1px solid var(--border); border-radius:var(--radius-lg);
    box-shadow:0 24px 64px rgba(15, 23, 42, 0.22);
    padding:22px;
  }
  .dash-modal-head {
    display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px;
  }
  .dash-modal-head h3 {
    display:flex; align-items:center; gap:8px; margin:0;
    font-family:var(--font-display); font-size:16px; font-weight:700; color:var(--fg);
  }
  .ai-suggestion-list { list-style:none; margin:0 0 4px; padding:0; display:flex; flex-direction:column; gap:8px; }
  .ai-suggestion-list li {
    border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 12px;
    transition:border-color 150ms ease, background 150ms ease;
  }
  .ai-suggestion-list li.selected { border-color:var(--accent); background:var(--accent-soft); }
  .ai-suggestion-list label { display:flex; align-items:flex-start; gap:10px; cursor:pointer; }
  .ai-suggestion-list input[type="checkbox"] { margin-top:3px; flex-shrink:0; width:15px; height:15px; accent-color:var(--accent); cursor:pointer; }
  .ai-suggestion-title {
    display:flex; align-items:center; flex-wrap:wrap; gap:6px;
    font-family:var(--font-body); font-size:13px; font-weight:600; color:var(--fg);
  }
  .ai-suggestion-desc { margin:4px 0 0; font-family:var(--font-body); font-size:12px; color:var(--muted-fg); line-height:1.5; }

  /* ── Runway tracker (Financials) ─────────────────────────────── */
  .runway-tracker-card { margin-bottom:16px; }
  .runway-tracker-body {
    display:grid; grid-template-columns:minmax(220px, 1fr) minmax(0, 2fr); gap:20px; margin-top:16px; align-items:start;
  }
  .runway-log-form { display:flex; flex-direction:column; gap:0; }
  .runway-log-form .dash-btn-primary { margin-top:2px; }
  .runway-summary-panel .dash-stat-grid { margin-bottom:6px; }
  .runway-history-list { list-style:none; margin:10px 0 0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .runway-history-list li {
    display:flex; align-items:center; gap:12px;
    padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-2);
    font-family:var(--font-body); font-size:12.5px;
  }
  .runway-history-date { color:var(--text-muted); min-width:76px; }
  .runway-history-amount { font-weight:700; color:var(--fg); }
  .runway-history-note { color:var(--text-secondary); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  @media (max-width: 700px) {
    .runway-tracker-body { grid-template-columns:1fr; }
  }

  /* ── Call Practice (Q&A simulator) ───────────────────────────── */
  .sim-scenario-grid {
    display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px; margin-top:12px;
  }
  .sim-scenario-card {
    text-align:left; display:flex; flex-direction:column; gap:4px;
    padding:13px 14px; border:1px solid var(--border); border-radius:var(--radius-sm);
    background:var(--surface-2); cursor:pointer; transition:border-color 150ms ease, background 150ms ease;
  }
  .sim-scenario-card:hover { border-color:var(--border-strong); }
  .sim-scenario-card.selected { border-color:var(--accent); background:var(--accent-soft); }
  .sim-scenario-label { font-family:var(--font-display); font-size:13.5px; font-weight:700; color:var(--fg); }
  .sim-scenario-desc { font-family:var(--font-body); font-size:11.5px; color:var(--text-muted); line-height:1.5; }
  .sim-voice-toggle-row {
    display:flex; align-items:center; gap:8px; margin-top:14px;
    font-family:var(--font-body); font-size:12.5px; color:var(--text-secondary); cursor:pointer;
  }
  .sim-voice-toggle-row input { accent-color:var(--accent); width:15px; height:15px; cursor:pointer; }

  .sim-history-list { list-style:none; margin:12px 0 0; padding:0; display:flex; flex-direction:column; gap:6px; }
  .sim-history-list li {
    display:flex; align-items:center; gap:12px;
    padding:9px 12px; border:1px solid var(--border); border-radius:var(--radius-sm); background:var(--surface-2);
    font-family:var(--font-body); font-size:12.5px;
  }
  .sim-history-score {
    flex-shrink:0; min-width:44px; text-align:center; padding:3px 8px; border-radius:var(--radius-pill);
    font-family:var(--font-display); font-size:11.5px; font-weight:700; border:1px solid transparent;
    background:var(--surface-3, var(--surface-2)); color:var(--text-secondary);
  }
  .sim-history-score.warm     { background:#ECFDF5; border-color:#A7F3D0; color:#047857; }
  .sim-history-score.lukewarm { background:#FFFBEB; border-color:#FDE68A; color:#B45309; }
  .sim-history-score.dead     { background:#FEF2F2; border-color:#FECACA; color:#B91C1C; }
  .sim-history-meta { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
  .sim-history-scenario { color:var(--fg); font-weight:600; }
  .sim-history-summary { color:var(--text-muted); font-size:11.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .sim-history-date { color:var(--text-muted); flex-shrink:0; }

  .sim-call-card { display:flex; flex-direction:column; gap:12px; }
  .sim-call-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
  .sim-voice-btn {
    width:30px; height:30px; border-radius:50%; border:1px solid var(--border); background:var(--surface-2);
    color:var(--text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer;
    transition:background 150ms ease, color 150ms ease;
  }
  .sim-voice-btn:hover { background:var(--accent-soft); color:var(--accent-ink); }

  .sim-transcript {
    display:flex; flex-direction:column; gap:10px; max-height:440px; overflow-y:auto;
    padding:4px 2px;
  }
  .sim-bubble {
    position:relative; max-width:82%; padding:10px 14px; border-radius:var(--radius-sm);
    font-family:var(--font-body); font-size:13.5px; line-height:1.55;
  }
  .sim-bubble p { margin:0; }
  .sim-bubble.persona {
    align-self:flex-start; background:var(--surface-2); border:1px solid var(--border); color:var(--fg);
    padding-right:32px;
  }
  .sim-bubble.user {
    align-self:flex-end; background:var(--gradient-accent); color:#fff;
  }
  .sim-play-btn {
    position:absolute; top:8px; right:8px; width:20px; height:20px; border-radius:50%;
    border:0; background:transparent; color:var(--text-muted); display:flex; align-items:center; justify-content:center;
    cursor:pointer; transition:background 150ms ease, color 150ms ease;
  }
  .sim-play-btn:hover { background:var(--accent-soft); color:var(--accent-ink); }
  .sim-bubble-feedback {
    margin-top:7px; padding-top:7px; border-top:1px solid rgba(255,255,255,0.35);
    font-size:11.5px; opacity:0.92; display:flex; gap:6px; align-items:baseline;
  }
  .sim-bubble-score {
    flex-shrink:0; font-weight:700; padding:1px 7px; border-radius:var(--radius-pill);
    background:rgba(255,255,255,0.22);
  }

  .sim-composer { display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--border); padding-top:12px; }
  .sim-composer-actions { display:flex; justify-content:flex-end; gap:8px; align-items:center; }
  .sim-mic-btn {
    width:34px; height:34px; border-radius:50%; border:1px solid var(--border); background:var(--surface-2);
    color:var(--text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer;
    transition:background 150ms ease, color 150ms ease, border-color 150ms ease;
  }
  .sim-mic-btn:hover { border-color:var(--border-strong); }
  .sim-mic-btn.recording { background:var(--destructive-soft); border-color:rgba(185,28,28,0.35); color:var(--destructive); animation:sim-pulse 1.4s ease-in-out infinite; }
  @keyframes sim-pulse {
    0%, 100% { box-shadow:0 0 0 0 rgba(185,28,28,0.25); }
    50% { box-shadow:0 0 0 6px rgba(185,28,28,0.08); }
  }

  .sim-debrief { border-top:1px solid var(--border); padding-top:14px; }
  .sim-debrief-head { margin-bottom:2px; }
  .sim-debrief-summary { font-family:var(--font-body); font-size:13.5px; color:var(--fg); line-height:1.6; margin:0 0 12px; }
  .sim-debrief-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; }
  @media (max-width: 700px) {
    .sim-bubble { max-width:92%; }
  }

  /* ── Team (Settings) ─────────────────────────────────────────── */
  .team-member-list { margin-bottom:14px; }
  .team-invite-row { display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
  .invite-link-box { display:flex; gap:8px; width:100%; max-width:480px; align-items:center; }
  .invite-link-box .dash-input { font-family:var(--font-mono); font-size:12px; }
  .invite-link-box .dash-copy-btn { margin-top:0; flex-shrink:0; white-space:nowrap; }

  /* ── Integrations (Settings) ────────────────────────────────────── */
  .integration-row {
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:13px 14px; border:1px solid var(--border); border-radius:var(--radius-sm);
    background:var(--surface-2); margin-bottom:10px; flex-wrap:wrap;
  }
  .integration-info { display:flex; align-items:center; gap:10px; }
  .integration-dot { width:8px; height:8px; border-radius:50%; background:var(--text-muted); flex-shrink:0; }
  .integration-dot.connected { background:#059669; box-shadow:0 0 0 3px rgba(5,150,105,0.18); }
  .integration-name { font-family:var(--font-display); font-size:13.5px; font-weight:600; color:var(--fg); }
  .integration-sub { font-family:var(--font-body); font-size:11.5px; color:var(--text-muted); margin-top:1px; }
  .integration-actions { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .integration-notion-settings {
    display:flex; gap:8px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border);
    flex-wrap:wrap; align-items:center; width:100%;
  }

  .chat-fab {
    position:fixed;
    right:26px;
    bottom:26px;
    z-index:50;
    width:56px;
    height:56px;
    background:var(--gradient-accent);
    border:none;
    border-radius:var(--radius-pill);
    color:var(--on-accent);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:box-shadow 150ms ease;
    box-shadow:0 10px 32px var(--accent-glow);
  }
  .chat-fab:hover {
    box-shadow:0 14px 40px var(--accent-glow);
  }
  .chat-fab svg { stroke:currentColor; }
  .chat-overlay {
    position:fixed;
    inset:0;
    background:rgba(15, 23, 42, 0.35);
    backdrop-filter:blur(2px);
    z-index:60;
  }
  .chat-panel {
    position:fixed;
    top:0;
    right:0;
    z-index:70;
    height:100vh;
    width:min(460px,100vw);
    background:var(--card);
    border-left:1px solid var(--border);
    display:flex;
    flex-direction:column;
    box-shadow:-16px 0 48px rgba(15, 23, 42, 0.14);
    transition:width 200ms ease;
  }
  .chat-panel.maximized {
    width:min(1040px,96vw);
  }
  .chat-panel-header {
    padding:14px 16px;
    border-bottom:1px solid var(--border);
    display:flex;
    align-items:center;
    gap:10px;
    flex-shrink:0;
    background:rgba(255, 255, 255, 0.95);
  }
  .chat-panel-header h3 {
    margin:0;
    font-family:var(--font-display);
    font-size:16px;
    font-weight:600;
    line-height:1;
    letter-spacing:0;
    color:var(--fg);
  }
  .chat-panel-close {
    width:34px;
    height:34px;
    background:transparent;
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    color:var(--fg);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease;
    flex-shrink:0;
  }
  .chat-panel-close:hover {
    background:var(--destructive-soft);
    border-color:rgba(185, 28, 28, 0.3);
    color:var(--destructive);
  }

  .chat-agent-picker {
    position:relative;
  }
  .chat-agent-btn {
    display:flex;
    align-items:center;
    gap:6px;
    padding:6px 10px;
    background:var(--surface-2);
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    color:var(--muted-fg);
    font-size:12px;
    font-weight:600;
    cursor:pointer;
    max-width:180px;
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease;
  }
  .chat-agent-btn span {
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .chat-agent-btn:hover {
    background:var(--surface-3, var(--surface-2));
    color:var(--fg);
    border-color:var(--accent);
  }
  .chat-agent-menu {
    position:absolute;
    top:calc(100% + 6px);
    left:0;
    width:260px;
    max-height:320px;
    overflow-y:auto;
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius);
    box-shadow:0 16px 40px rgba(15, 23, 42, 0.16);
    padding:6px;
    z-index:80;
    display:flex;
    flex-direction:column;
    gap:2px;
  }
  .chat-agent-option {
    display:flex;
    flex-direction:column;
    align-items:flex-start;
    gap:2px;
    padding:8px 10px;
    background:transparent;
    border:none;
    border-radius:8px;
    text-align:left;
    cursor:pointer;
    transition:background 120ms ease;
  }
  .chat-agent-option:hover {
    background:var(--surface-2);
  }
  .chat-agent-option.active {
    background:var(--accent-soft, var(--surface-2));
  }
  .chat-agent-option-label {
    font-size:12.5px;
    font-weight:600;
    color:var(--fg);
  }
  .chat-agent-option.active .chat-agent-option-label {
    color:var(--accent);
  }
  .chat-agent-option-desc {
    font-size:11px;
    color:var(--muted-fg);
    line-height:1.4;
  }

  .chat-messages {
    flex:1;
    overflow-y:auto;
    padding:18px;
    display:flex;
    flex-direction:column;
    gap:16px;
    background:transparent;
  }
  .chat-welcome {
    border:1px solid var(--border);
    border-radius:var(--radius-lg);
    padding:26px 20px;
    text-align:left;
    background:var(--surface-2);
  }
  .chat-welcome-icon {
    width:44px;
    height:44px;
    margin:0 0 14px;
    background:var(--gradient-accent);
    border-radius:var(--radius-sm);
    color:var(--on-accent);
    display:flex;
    align-items:center;
    justify-content:center;
    box-shadow:0 6px 18px var(--accent-glow);
  }
  .chat-welcome h4 {
    margin:0 0 8px;
    font-family:var(--font-display);
    font-size:21px;
    font-weight:700;
    line-height:1.2;
    letter-spacing:-0.01em;
    color:var(--fg);
  }
  .chat-welcome p {
    margin:0 0 18px;
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:14px;
    line-height:1.65;
  }
  .chat-starters {
    display:flex;
    flex-direction:column;
    gap:8px;
  }
  .chat-starter-btn {
    min-height:44px;
    padding:11px 14px;
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    color:var(--fg);
    font-family:var(--font-body);
    font-size:13.5px;
    font-weight:500;
    text-align:left;
    cursor:pointer;
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease;
  }
  .chat-starter-btn:hover {
    background:var(--accent-soft);
    border-color:rgba(37, 99, 235, 0.3);
    color:var(--accent-ink);
  }

  .chat-message { display:flex; gap:10px; }
  .chat-message.user { flex-direction:row-reverse; }
  .chat-avatar {
    width:28px;
    height:28px;
    border-radius:var(--radius-pill);
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:var(--font-display);
    font-size:11px;
    font-weight:700;
  }
  .chat-avatar.ai {
    background:var(--gradient-accent);
    color:var(--on-accent);
  }
  .chat-avatar.user-av {
    background:var(--accent-3-soft);
    border:1px solid rgba(67, 56, 202, 0.25);
    color:var(--accent-3);
  }
  .chat-bubble-wrap { max-width:84%; display:flex; flex-direction:column; gap:6px; }
  .chat-bubble {
    padding:12px 14px;
    border:1px solid var(--border);
    border-radius:var(--radius);
    color:var(--fg);
    font-size:14px;
    line-height:1.65;
  }
  .chat-bubble.ai {
    background:var(--surface-2);
    font-family:var(--font-body);
    border-bottom-left-radius:4px;
  }
  .chat-bubble.user {
    background:var(--accent-soft);
    border-color:rgba(37, 99, 235, 0.22);
    color:var(--fg);
    font-family:var(--font-body);
    border-bottom-right-radius:4px;
  }
  .chat-bubble.err {
    border-color:rgba(185, 28, 28, 0.3);
    color:var(--destructive);
  }
  .chat-bubble.ai strong { color:var(--accent-ink); font-weight:600; }
  .chat-download-row { display:flex; flex-wrap:wrap; gap:6px; }
  .chat-download-btn {
    min-height:32px;
    padding:6px 12px;
    background:transparent;
    border:1px solid rgba(67, 56, 202, 0.35);
    border-radius:var(--radius-pill);
    color:var(--accent-3);
    font-family:var(--font-body);
    font-size:11.5px;
    font-weight:600;
    cursor:pointer;
    transition:background 150ms ease;
  }
  .chat-download-btn:hover {
    background:var(--accent-3-soft);
  }
  .chat-msg-link {
    color:var(--accent-3);
    text-decoration-color:var(--accent);
    text-decoration-thickness:1px;
    text-underline-offset:4px;
  }
  .chat-msg-link:hover { color:var(--accent-ink); }

  .chat-steps {
    max-width:84%;
    margin-left:38px;
    padding:13px 14px;
    border:1px solid var(--border);
    border-radius:var(--radius);
    background:var(--surface-2);
    display:flex;
    flex-direction:column;
    gap:8px;
  }
  .chat-step {
    display:flex;
    align-items:center;
    gap:9px;
    color:var(--text-muted);
    font-family:var(--font-body);
    font-size:12.5px;
    font-weight:500;
  }
  .chat-step.active { color:var(--accent-ink); }
  .chat-step.done { color:var(--accent-3); }
  .chat-step-dot {
    width:14px; height:14px; flex-shrink:0;
    border-radius:50%;
    border:1.5px solid currentColor;
    display:flex; align-items:center; justify-content:center;
  }
  .chat-step.active .chat-step-dot { animation:dash-blink 1s steps(2) infinite; }
  .chat-step.done .chat-step-dot { background:currentColor; color:#FFFFFF; }

  .chat-input-area {
    padding:12px 16px 16px;
    border-top:1px solid var(--border);
    flex-shrink:0;
    background:var(--surface);
  }
  .chat-input-wrap {
    display:flex;
    gap:8px;
    padding:6px 6px 6px 14px;
    background:var(--input);
    border:1px solid var(--border);
    border-radius:var(--radius);
    align-items:flex-end;
  }
  .chat-input-wrap:focus-within {
    border-color:var(--accent);
    box-shadow:0 0 0 3px var(--accent-soft);
  }
  .chat-input-wrap textarea {
    flex:1;
    min-height:24px;
    max-height:100px;
    padding:6px 0;
    background:transparent;
    border:0;
    outline:none;
    color:var(--fg);
    font-family:var(--font-body);
    font-size:14px;
    line-height:1.5;
    resize:none;
  }
  .chat-input-wrap textarea::placeholder { color:var(--text-muted); }
  .chat-send-btn {
    width:34px;
    height:34px;
    background:var(--gradient-accent);
    border:none;
    border-radius:var(--radius-pill);
    color:var(--on-accent);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .chat-send-btn:disabled { opacity:.45; cursor:not-allowed; }
  .chat-send-btn svg { stroke:currentColor; }
  .chat-hint {
    margin:8px 0 0;
    color:var(--text-muted);
    font-family:var(--font-body);
    font-size:11px;
    text-align:center;
  }
  .chat-hint kbd {
    border:1px solid var(--border);
    border-radius:4px;
    padding:1px 5px;
    color:var(--text-secondary);
    background:var(--surface-2);
    font-family:var(--font-mono);
    font-size:10px;
  }

  .kb-panel {
    max-width:760px;
    border:1px solid var(--border);
    border-radius:var(--radius-lg);
    overflow:hidden;
    background:var(--card);
  }
  .kb-toggle-btn {
    width:100%;
    min-height:46px;
    padding:12px 16px;
    background:var(--surface-2);
    border:0;
    border-bottom:1px solid var(--border);
    color:var(--fg);
    font-family:var(--font-display);
    font-size:14px;
    font-weight:600;
    text-align:left;
    display:flex;
    align-items:center;
    gap:8px;
    cursor:pointer;
  }
  .kb-body {
    padding:18px;
    background:var(--card);
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .kb-desc {
    margin:0;
    color:var(--text-secondary);
    font-family:var(--font-body);
    font-size:13px;
    line-height:1.6;
  }
  .kb-field { position:relative; }
  .kb-field input.kb-input, .kb-textarea {
    width:100%;
    background:var(--input);
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    padding:9px 12px;
    color:var(--fg);
    font-size:13px;
    outline:none;
  }
  .kb-field input.kb-input { font-family:var(--font-body); }
  .kb-textarea {
    min-height:92px;
    resize:vertical;
    font-family:var(--font-body);
    line-height:1.55;
  }
  .kb-field input.kb-input::placeholder, .kb-textarea::placeholder { color:var(--text-muted); }
  .kb-field input.kb-input:focus, .kb-textarea:focus {
    border-color:var(--accent);
    box-shadow:0 0 0 3px var(--accent-soft);
  }
  .kb-file-upload-row { display:flex; align-items:center; gap:8px; margin-bottom:2px; }
  .kb-file-input { position:absolute; width:0; height:0; opacity:0; pointer-events:none; }
  .kb-upload-file-btn, .kb-upload-btn, .kb-refresh-btn {
    min-height:40px;
    padding:9px 14px;
    background:transparent;
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    color:var(--fg);
    font-family:var(--font-body);
    font-size:12.5px;
    font-weight:500;
    cursor:pointer;
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease;
  }
  .kb-upload-file-btn:hover:not(:disabled),
  .kb-upload-btn:hover:not(:disabled),
  .kb-refresh-btn:hover {
    background:var(--hover);
    border-color:var(--border-strong);
    color:var(--accent-ink);
  }
  .kb-upload-file-btn:disabled, .kb-upload-btn:disabled { opacity:.45; cursor:not-allowed; }
  .kb-divider {
    margin:2px 0;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    letter-spacing:0.08em;
    text-align:center;
    text-transform:uppercase;
  }
  .kb-actions { display:flex; gap:8px; align-items:center; }
  .kb-upload-btn {
    flex:1;
    background:var(--gradient-accent);
    border-color:transparent;
    color:var(--on-accent);
    font-weight:700;
  }
  .kb-upload-btn:hover:not(:disabled) {
    filter:brightness(1.04);
    color:var(--on-accent);
  }
  .kb-msg {
    margin:0;
    padding:9px 12px;
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    color:var(--fg);
    font-family:var(--font-body);
    font-size:12px;
    line-height:1.5;
  }
  .kb-msg.error { border-color:rgba(185, 28, 28, 0.3); color:var(--destructive); }
  .kb-docs-section { border-top:1px solid var(--border); padding-top:12px; }
  .kb-docs-label {
    margin:0 0 8px;
    color:var(--text-muted);
    font-family:var(--font-mono);
    font-size:10px;
    letter-spacing:0.08em;
    text-transform:uppercase;
  }
  .kb-docs-empty {
    margin:0;
    color:var(--text-muted);
    font-family:var(--font-body);
    font-size:12px;
  }
  .kb-doc-list {
    display:flex;
    flex-direction:column;
    gap:6px;
  }
  .kb-doc-item {
    display:flex;
    align-items:center;
    gap:8px;
    padding:9px 11px;
    border:1px solid var(--border);
    border-radius:var(--radius-sm);
    background:var(--surface-2);
  }
  .kb-doc-icon {
    width:20px;
    height:20px;
    border-radius:6px;
    background:var(--accent-soft);
    color:var(--accent-ink);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .kb-doc-name {
    flex:1;
    color:var(--fg);
    font-family:var(--font-body);
    font-size:12.5px;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .kb-doc-count, .kb-badge {
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    padding:2px 8px;
    color:var(--accent-3);
    font-family:var(--font-body);
    font-size:10.5px;
    font-weight:600;
    flex-shrink:0;
  }
  .kb-saved-dot {
    width:8px;
    height:8px;
    background:var(--accent);
    border-radius:50%;
    flex-shrink:0;
    box-shadow:0 0 0 3px var(--accent-soft);
  }

  /* ── Onboarding wizard ───────────────────────────────────────── */
  .onboard-wrap { max-width:760px; }
  .onboard-steps {
    display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;
  }
  .onboard-step {
    display:flex; align-items:center; gap:8px;
    padding:8px 14px; border:1px solid var(--border);
    border-radius:var(--radius-pill);
    font-family:var(--font-body); font-size:12px; font-weight:500;
    color:var(--muted-fg); background:var(--surface-2);
  }
  .onboard-step.active {
    border-color:rgba(37, 99, 235, 0.3); color:var(--accent-ink);
    background:var(--accent-soft);
  }
  .onboard-step.done { color:var(--accent-ink); border-color:rgba(37, 99, 235, 0.25); }
  .onboard-step-num {
    font-family:var(--font-display); font-weight:700; font-size:11px;
  }
  .onboard-card h3 {
    font-family:var(--font-display); font-size:17px; font-weight:600;
    color:var(--fg); margin:0 0 16px;
  }
  .onboard-stage-grid {
    display:flex; flex-wrap:wrap; gap:8px;
  }
  .onboard-stage-btn {
    background:var(--surface-2); border:1px solid var(--border);
    border-radius:var(--radius-pill);
    color:var(--fg); font-family:var(--font-body); font-size:12.5px; font-weight:500;
    padding:9px 14px; cursor:pointer;
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease;
  }
  .onboard-stage-btn:hover { border-color:rgba(37, 99, 235, 0.3); color:var(--accent-ink); }
  .onboard-stage-btn.active {
    border-color:rgba(37, 99, 235, 0.3); color:var(--accent-ink); background:var(--accent-soft);
  }
  .onboard-actions {
    display:flex; gap:10px; align-items:center; margin-top:20px; flex-wrap:wrap;
  }
  .onboard-upload-row {
    display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 4px;
  }
  .onboard-check {
    display:flex; align-items:center; gap:8px;
    font-family:var(--font-body); font-size:13px; color:var(--fg);
    margin:8px 0 12px; cursor:pointer;
  }

  /* ── Soft gate banner ────────────────────────────────────────── */
  .dash-soft-banner {
    padding:11px 24px; border-bottom:1px solid var(--border);
    background:linear-gradient(90deg, rgba(37,99,235,0.07), rgba(67,56,202,0.05));
    font-family:var(--font-body); font-size:13px;
    color:var(--fg);
  }
  .dash-soft-banner a {
    color:var(--accent-ink); text-decoration:underline; font-weight:600;
  }

  /* ── Home readiness ──────────────────────────────────────────── */
  /* Compact, collapsed-by-default card: a single clickable strip (ring +
     summary line) that expands into the full checklist on demand, so the
     dashboard's first card reads as a KPI tile rather than an onboarding
     wizard taking up the whole column. */
  .home-progress-card.compact { padding:14px 16px; }
  .home-progress-strip {
    width:100%;
    display:flex; align-items:center; gap:14px;
    background:none; border:none; padding:2px 0; cursor:pointer;
    text-align:left; font:inherit; color:inherit;
  }
  .home-progress-ring {
    --pct: 0;
    flex-shrink:0;
    width:46px; height:46px; border-radius:50%;
    background:conic-gradient(var(--accent) calc(var(--pct) * 1%), var(--surface-2) 0);
    display:flex; align-items:center; justify-content:center;
    position:relative;
  }
  .home-progress-ring::before {
    content:""; position:absolute; inset:4px; border-radius:50%; background:var(--card);
  }
  .home-progress-ring span {
    position:relative; z-index:1;
    font-family:var(--font-display); font-size:12px; font-weight:700; color:var(--fg);
  }
  .home-progress-strip-text { flex:1; min-width:0; }
  .home-progress-strip-title {
    font-family:var(--font-display); font-size:14px; font-weight:600; color:var(--fg);
  }
  .home-progress-strip-sub {
    font-family:var(--font-body); font-size:12px; color:var(--muted-fg);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;
  }
  .home-progress-toggle {
    flex-shrink:0; color:var(--muted-fg);
    display:flex; align-items:center; justify-content:center;
    transition:transform 180ms ease;
  }
  .home-progress-toggle.open { transform:rotate(180deg); }
  .home-progress-card.compact .home-milestone-list { margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }

  .home-progress-meta {
    display:flex; align-items:baseline; gap:10px; margin-bottom:14px;
  }
  .home-progress-pct {
    font-family:var(--font-display); font-size:40px; font-weight:800;
    background:var(--gradient-accent-text);
    -webkit-background-clip:text; background-clip:text; color:transparent;
    line-height:1;
  }
  .home-progress-label {
    font-family:var(--font-body); font-size:12.5px; font-weight:500;
    color:var(--muted-fg);
  }
  .home-progress-bar {
    height:8px; background:var(--surface-2);
    border:1px solid var(--border); border-radius:var(--radius-pill); overflow:hidden; margin-bottom:20px;
  }
  .home-progress-fill {
    height:100%; width:100%; background:var(--gradient-accent);
    border-radius:var(--radius-pill);
    transform-origin:left center;
    transform:scaleX(0);
  }
  .home-milestone-list {
    list-style:none; margin:0; padding:0;
    display:flex; flex-direction:column; gap:4px;
  }
  .home-milestone-list li {
    display:grid; grid-template-columns:22px 1fr auto; gap:8px; align-items:center;
    padding:7px 8px;
    border-radius:var(--radius-sm);
    font-family:var(--font-body); font-size:13px; color:var(--muted-fg);
    transition:background 150ms ease;
  }
  .home-milestone-list li:hover { background:var(--hover); }
  .home-milestone-list li.done { color:var(--fg); }
  .home-ms-mark {
    width:18px; height:18px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    border:1.5px solid var(--border);
    color:transparent;
  }
  .home-milestone-list li.done .home-ms-mark {
    background:var(--gradient-accent);
    border-color:transparent;
    color:var(--on-accent);
  }
  .home-ms-w { color:var(--text-muted); font-size:11px; font-family:var(--font-body); font-weight:500; }
  .home-nudge {
    display:flex; align-items:center; gap:7px; margin-top:14px;
    padding:9px 12px; border-radius:var(--radius-sm);
    background:#FFFBEB; border:1px solid #FDE68A; color:#B45309;
    font-family:var(--font-body); font-size:12.5px; line-height:1.4;
  }
  .home-nudge svg { flex-shrink:0; }

  .home-stat-link {
    display:block; text-decoration:none; color:inherit;
    transition:border-color 150ms ease, transform 150ms ease;
  }
  .home-stat-link:hover { border-color:var(--border-strong); transform:translateY(-1px); }

  .home-activity-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:2px; }
  .home-activity-list li {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:8px; border-radius:var(--radius-sm); transition:background 150ms ease;
  }
  .home-activity-list li:hover { background:var(--hover); }
  .home-activity-link {
    display:flex; align-items:center; gap:8px; text-decoration:none;
    color:var(--fg); font-family:var(--font-body); font-size:13px; font-weight:500;
    min-width:0;
  }
  .home-activity-link svg { flex-shrink:0; color:var(--accent-ink); }
  .home-activity-link span {
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  .home-activity-time {
    flex-shrink:0; font-family:var(--font-body); font-size:11.5px; color:var(--text-muted);
  }

  .home-quick-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:10px;
  }
  .home-quick-tile {
    display:flex; flex-direction:column; gap:3px;
    padding:14px 14px; border:1px solid var(--border); border-radius:var(--radius-sm);
    background:var(--surface-2); text-decoration:none; color:inherit;
    transition:border-color 150ms ease, transform 150ms ease, background 150ms ease;
  }
  .home-quick-tile:hover {
    border-color:var(--border-strong); background:var(--hover); transform:translateY(-1px);
  }
  .home-quick-label {
    font-family:var(--font-display); font-size:13.5px; font-weight:600; color:var(--fg);
  }
  .home-quick-desc {
    font-family:var(--font-body); font-size:11.5px; color:var(--text-muted); line-height:1.35;
  }

  .home-coverage-head {
    display:flex; align-items:baseline; justify-content:space-between; gap:10px; margin-bottom:4px;
  }
  .home-coverage-head h3 { margin:0; }
  .home-coverage-count {
    font-family:var(--font-body); font-size:12px; color:var(--text-muted); white-space:nowrap;
  }
  .home-coverage-list { list-style:none; margin:8px 0 0; padding:0; display:flex; flex-direction:column; gap:2px; }
  .home-coverage-list li {
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:7px 8px; border-radius:var(--radius-sm); transition:background 150ms ease;
  }
  .home-coverage-list li:hover { background:var(--hover); }
  .home-coverage-link {
    display:flex; align-items:center; gap:8px; min-width:0;
    text-decoration:none; color:var(--fg);
    font-family:var(--font-body); font-size:13px;
  }
  .home-coverage-mark {
    width:16px; height:16px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    border-radius:var(--radius-pill); border:1.5px solid var(--border);
    color:var(--accent-ink);
  }
  .home-coverage-list li.done .home-coverage-mark {
    border-color:rgba(37, 99, 235, 0.35); background:var(--accent-soft);
  }
  .home-coverage-badge {
    flex-shrink:0; font-family:var(--font-body); font-size:10.5px; font-weight:600;
    padding:2px 8px; border-radius:var(--radius-pill);
  }
  .home-coverage-badge.done {
    background:var(--accent-soft); color:var(--accent-ink); border:1px solid rgba(37, 99, 235, 0.2);
  }
  .home-coverage-badge.pending {
    background:var(--surface-2); color:var(--text-muted); border:1px solid var(--border);
  }

  .chat-bubble.system {
    border-color:rgba(37, 99, 235, 0.25);
    background:var(--accent-soft);
  }
  .chat-message.system { gap:0; }
  .chat-message.system .chat-bubble-wrap { max-width:100%; }

  /* ── Toasts ──────────────────────────────────────────────────── */
  .dash-toast-stack {
    position:fixed;
    left:50%;
    bottom:26px;
    transform:translateX(-50%);
    z-index:80;
    display:flex;
    flex-direction:column-reverse;
    gap:10px;
    align-items:center;
    pointer-events:none;
  }
  .dash-toast {
    display:flex;
    align-items:center;
    gap:10px;
    max-width:min(420px, 92vw);
    padding:11px 16px;
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius-pill);
    box-shadow:var(--shadow-lg);
    color:var(--fg);
    font-family:var(--font-body);
    font-size:13.5px;
    font-weight:500;
  }
  .dash-toast .toast-mark {
    width:20px; height:20px; flex-shrink:0;
    border-radius:50%;
    background:var(--gradient-accent);
    color:var(--on-accent);
    display:flex; align-items:center; justify-content:center;
  }
  .dash-toast.success .toast-mark { background:var(--gradient-accent); }
  .dash-toast .toast-gain {
    margin-left:2px;
    padding:2px 9px;
    border-radius:var(--radius-pill);
    background:var(--accent-soft);
    color:var(--accent-ink);
    font-family:var(--font-display);
    font-size:12px;
    font-weight:700;
    white-space:nowrap;
  }
  @media (max-width: 900px) {
    .dash-header { grid-template-columns:auto 1fr; padding:12px 16px; }
    .dash-edition { display:none; }
    .dash-body { flex-direction:column; overflow:auto; }
    .dash-sidebar {
      width:100%;
      border-right:0;
      border-bottom:1px solid var(--border);
      flex-direction:row;
      overflow-x:auto;
      padding:10px 12px;
    }
    .dash-sidebar-label, .dash-nav-divider { display:none; }
    .dash-nav-item {
      min-width:max-content;
    }
    .dash-content { padding:22px 16px 44px; overflow:visible; }
    .dash-page-header { flex-direction:column; align-items:flex-start; gap:10px; }
    .dash-grid { grid-template-columns:1fr; }
    .dash-row { flex-direction:column; gap:0; }
  }

  @media (max-width: 560px) {
    .dash-header { gap:10px; }
    .dash-header-text h1 { font-size:17px; letter-spacing:0; }
    .dash-header-right { gap:6px; }
    .dash-btn-ghost { padding:8px 12px; font-size:12px; }
    .dash-page-header h2 { font-size:24px; }
    .dash-card { padding:18px; border-radius:var(--radius); }
    .chat-fab { right:16px; bottom:16px; }
    .chat-agent-btn { max-width:110px; }
    .chat-panel.maximized { width:100vw; }
  }
`;

export function formatMessage(text) {
    if (typeof text !== "string") return "";
    const escapeHtmlUrl = (url) =>
        String(url).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let out = text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/`(.*?)`/g, '<code style="background:#F1F5F9;border:1px solid #E2E8F0;border-radius:5px;color:#1D4ED8;padding:1px 6px;font-size:12px;font-family:IBM Plex Mono,monospace;">$1</code>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-family:Outfit,system-ui,sans-serif;font-size:15px;font-weight:600;color:#1D4ED8;margin:12px 0 5px;">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-family:Outfit,system-ui,sans-serif;font-size:17px;font-weight:700;color:#0F172A;margin:14px 0 6px;">$1</h2>')
        .replace(/^#{1}\s(.+)$/gm, '<h2 style="font-family:Outfit,system-ui,sans-serif;font-size:19px;font-weight:700;color:#0F172A;margin:14px 0 6px;">$1</h2>')
        .replace(/^[-*]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;"><span style="color:#1D4ED8;flex-shrink:0;">•</span><span>$1</span></div>')
        .replace(/\[(HOOK|PROBLEM|SOLUTION|TRACTION|ASK)\]/g,
            '<span style="display:inline-block;padding:2px 9px;background:rgba(37,99,235,0.10);border:1px solid rgba(37,99,235,0.25);border-radius:999px;color:#1D4ED8;font-family:Inter,system-ui,sans-serif;font-size:10.5px;font-weight:600;margin:0 2px;">$1</span>');
    out = out.replace(/https?:\/\/[^\s<>"')\]]+/g, (url) => {
        const safe = escapeHtmlUrl(url);
        const isDrawio = /diagrams\.net|draw\.io/i.test(url);
        const label = isDrawio ? "View drawing" : "Open link";
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="chat-msg-link">${label}</a>`;
    });
    return out.replace(/\n/g, "<br/>");
}
