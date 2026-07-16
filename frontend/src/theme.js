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
  @keyframes dash-fade-up {
    from { opacity:0; transform:translateY(6px); }
    to { opacity:1; transform:translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .dash-spinner, .chat-step.active .chat-step-dot { animation:none !important; }
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
    background:var(--accent-soft);
    color:var(--accent-ink);
  }
  .dash-nav-item.active .dash-nav-icon { color:var(--accent-ink); }
  .dash-nav-icon {
    width:20px;
    height:20px;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    color:var(--text-muted);
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
    animation:dash-fade-up .35s ease both;
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
    animation:dash-fade-up .4s ease both;
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
    transition:transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
  }
  .dash-btn-primary:hover:not(:disabled) {
    filter:brightness(1.04);
    transform:translateY(-1px);
    box-shadow:0 10px 28px var(--accent-glow);
  }
  .dash-btn-primary:active:not(:disabled) { transform:translateY(0); }
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
    transition:transform 150ms ease, box-shadow 150ms ease;
    box-shadow:0 10px 32px var(--accent-glow);
  }
  .chat-fab:hover {
    transform:translateY(-2px) scale(1.03);
    box-shadow:0 14px 40px var(--accent-glow);
  }
  .chat-fab svg { stroke:currentColor; }
  .chat-overlay {
    position:fixed;
    inset:0;
    background:rgba(15, 23, 42, 0.35);
    backdrop-filter:blur(2px);
    z-index:60;
    opacity:0;
    pointer-events:none;
    transition:opacity .25s ease-out;
  }
  .chat-overlay.open { opacity:1; pointer-events:auto; }
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
    transform:translateX(100%);
    transition:transform .3s cubic-bezier(.16,1,.3,1);
    box-shadow:-16px 0 48px rgba(15, 23, 42, 0.14);
  }
  .chat-panel.open { transform:translateX(0); }
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
    margin-left:auto;
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
  }
  .chat-panel-close:hover {
    background:var(--destructive-soft);
    border-color:rgba(185, 28, 28, 0.3);
    color:var(--destructive);
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
    transition:background 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;
  }
  .chat-starter-btn:hover {
    background:var(--accent-soft);
    border-color:rgba(37, 99, 235, 0.3);
    color:var(--accent-ink);
    transform:translateX(2px);
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
    transition:transform 150ms ease;
  }
  .chat-send-btn:hover:not(:disabled) { transform:scale(1.06); }
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
    height:100%; background:var(--gradient-accent);
    border-radius:var(--radius-pill);
    transition:width .5s cubic-bezier(.16,1,.3,1);
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
  .home-next-copy {
    font-size:15px; line-height:1.55; color:var(--fg); margin:0 0 20px;
  }
  .home-next-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }

  .chat-bubble.system {
    border-color:rgba(37, 99, 235, 0.25);
    background:var(--accent-soft);
  }

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
    animation:dash-toast-in .28s cubic-bezier(.16,1,.3,1) both;
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
  @keyframes dash-toast-in {
    from { opacity:0; transform:translateY(10px) scale(.96); }
    to { opacity:1; transform:translateY(0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .dash-toast { animation:none; }
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
