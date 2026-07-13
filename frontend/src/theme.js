/**
 * Shared Cyberpunk / Glitch design tokens + global CSS for Pitchmate.
 * Dark void background, neon accents, scanlines, chamfered panels.
 */

export const COLORS = {
    bg: "#0a0a0f",
    foreground: "#e0e0e0",
    card: "#12121a",
    muted: "#1c1c2e",
    mutedForeground: "#6b7280",
    accent: "#00ff88",
    accentSecondary: "#ff00ff",
    accentTertiary: "#00d4ff",
    border: "#2a2a3a",
    input: "#12121a",
    destructive: "#ff3366",
    text: "#e0e0e0",
};

export const DASHBOARD_STYLES = `
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
    --neon-3: 0 0 5px #00d4ff, 0 0 20px #00d4ff60;
    --chamfer: polygon(0 8px, 8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px));
    --chamfer-sm: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
  }

  * { box-sizing:border-box; }
  html, body, #root { min-height:100%; background:var(--bg); }
  body { margin:0; color:var(--fg); }
  button, input, textarea, select { font:inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline:none;
    box-shadow:0 0 0 2px var(--bg), 0 0 0 4px var(--accent), var(--neon-sm);
  }

  .font-serif, .font-display { font-family:'Orbitron','Share Tech Mono',monospace; }
  .font-body, .font-sans { font-family:'JetBrains Mono','Fira Code','Consolas',monospace; }
  .font-mono { font-family:'Share Tech Mono','JetBrains Mono',monospace; }

  .cyber-chamfer { clip-path:var(--chamfer); }
  .cyber-chamfer-sm { clip-path:var(--chamfer-sm); }

  .cyber-glitch {
    position:relative;
    animation:rgbShift 4s steps(2) infinite;
  }
  @keyframes rgbShift {
    0%, 90%, 100% { text-shadow: -2px 0 #ff00ff, 2px 0 #00d4ff, 0 0 10px rgba(0,255,136,.45); }
    92% { text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff, 0 0 10px rgba(0,255,136,.45); transform:translate(1px,-1px); }
    94% { text-shadow: -1px 0 #ff00ff, 3px 0 #00d4ff; transform:translate(-2px,1px); }
    96% { text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff; transform:translate(0); }
  }
  @keyframes glitch {
    0%, 100% { transform:translate(0); }
    20% { transform:translate(-2px, 2px); }
    40% { transform:translate(2px, -2px); }
    60% { transform:translate(-1px, -1px); }
    80% { transform:translate(1px, 1px); }
  }
  @keyframes blink {
    50% { opacity:0; }
  }
  @keyframes dash-blink {
    0%,100% { opacity:1; }
    50% { opacity:.2; }
  }
  @keyframes dash-spin { to { transform:rotate(360deg); } }
  @keyframes scanline-move {
    0% { transform:translateY(-100%); }
    100% { transform:translateY(100vh); }
  }
  @keyframes cursor-blink {
    0%, 49% { opacity:1; }
    50%, 100% { opacity:0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cyber-glitch { animation:none; text-shadow:-1px 0 #ff00ff, 1px 0 #00d4ff; }
    .dash-spinner, .chat-step.active .chat-step-dot { animation:none !important; }
  }

  .dash-app {
    min-height:100vh;
    background-color:var(--bg);
    background-image:
      radial-gradient(ellipse at 10% 0%, rgba(0,255,136,.06) 0%, transparent 45%),
      radial-gradient(ellipse at 90% 100%, rgba(255,0,255,.05) 0%, transparent 40%),
      linear-gradient(rgba(0,255,136,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,136,.03) 1px, transparent 1px);
    background-size:auto, auto, 50px 50px, 50px 50px;
    color:var(--fg);
    display:flex;
    flex-direction:column;
    font-family:'JetBrains Mono','Fira Code','Consolas',monospace;
    overflow:hidden;
    position:relative;
  }
  .dash-app::after {
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
    background:rgba(10,10,15,.92);
    backdrop-filter:blur(12px);
    box-shadow:0 1px 0 rgba(0,255,136,.15);
  }
  .dash-logo-mark {
    width:38px;
    height:38px;
    background:transparent;
    border:2px solid var(--accent);
    color:var(--accent);
    clip-path:var(--chamfer-sm);
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Orbitron',monospace;
    font-size:18px;
    font-weight:900;
    flex-shrink:0;
    box-shadow:var(--neon-sm);
    text-shadow:0 0 8px rgba(0,255,136,.6);
  }
  .dash-header-text h1 {
    margin:0;
    font-family:'Orbitron',monospace;
    font-size:22px;
    font-weight:800;
    line-height:1;
    letter-spacing:.18em;
    text-transform:uppercase;
    color:var(--accent);
    text-shadow:0 0 12px rgba(0,255,136,.45);
  }
  .dash-header-text p {
    margin:6px 0 0;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.2em;
    text-transform:uppercase;
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
    background:var(--card);
    border:1px solid var(--accent-3);
    clip-path:var(--chamfer-sm);
    display:flex;
    align-items:center;
    justify-content:center;
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:12px;
    font-weight:700;
    flex-shrink:0;
    box-shadow:var(--neon-3);
  }
  .dash-edition {
    border-left:1px solid var(--border);
    padding-left:12px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.12em;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .dash-btn-ghost {
    min-height:44px;
    padding:8px 14px;
    background:transparent;
    border:1px solid var(--border);
    color:var(--fg);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:.14em;
    text-transform:uppercase;
    cursor:pointer;
    clip-path:var(--chamfer-sm);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    white-space:nowrap;
  }
  .dash-btn-ghost:hover {
    border-color:var(--accent);
    color:var(--accent);
    box-shadow:var(--neon-sm);
  }

  .dash-ticker {
    overflow:hidden;
    border-bottom:1px solid var(--border);
    background:var(--card);
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    letter-spacing:.12em;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .dash-ticker-track {
    display:inline-flex;
    gap:28px;
    padding:8px 16px;
    flex-wrap:wrap;
  }
  .dash-ticker span { display:inline-flex; align-items:center; gap:8px; }
  .dash-ticker b {
    color:var(--bg);
    background:var(--accent);
    padding:1px 6px;
    box-shadow:var(--neon-sm);
  }

  .dash-body {
    display:flex;
    flex:1;
    min-height:0;
    border-bottom:1px solid var(--border);
  }
  .dash-sidebar {
    width:234px;
    flex-shrink:0;
    border-right:1px solid var(--border);
    overflow-y:auto;
    background:rgba(18,18,26,.85);
    display:flex;
    flex-direction:column;
  }
  .dash-sidebar-label {
    padding:14px 16px 10px;
    border-bottom:1px solid var(--border);
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.2em;
    text-transform:uppercase;
  }
  .dash-nav-item {
    min-height:48px;
    display:flex;
    align-items:center;
    gap:12px;
    padding:12px 16px;
    border-bottom:1px solid var(--border);
    color:var(--fg);
    font-family:'JetBrains Mono',monospace;
    font-size:12px;
    font-weight:600;
    letter-spacing:.12em;
    text-transform:uppercase;
    text-decoration:none;
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dash-nav-item:hover {
    background:rgba(0,255,136,.08);
    color:var(--accent);
  }
  .dash-nav-item.active {
    background:rgba(0,255,136,.12);
    color:var(--accent);
    box-shadow:inset 3px 0 0 var(--accent), var(--neon-sm);
  }
  .dash-nav-icon {
    width:28px;
    height:28px;
    border:1px solid currentColor;
    clip-path:var(--chamfer-sm);
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    flex-shrink:0;
  }
  .dash-nav-divider {
    height:2px;
    background:linear-gradient(90deg, transparent, var(--accent), transparent);
    margin:0;
    opacity:.4;
  }

  .dash-content {
    flex:1;
    overflow-y:auto;
    padding:28px 32px 60px;
    background:transparent;
  }
  .dash-content::-webkit-scrollbar,
  .dash-sidebar::-webkit-scrollbar,
  .chat-messages::-webkit-scrollbar { width:6px; }
  .dash-content::-webkit-scrollbar-thumb,
  .dash-sidebar::-webkit-scrollbar-thumb,
  .chat-messages::-webkit-scrollbar-thumb {
    background:var(--accent);
    box-shadow:var(--neon-sm);
  }

  .dash-page-header {
    margin:0 0 24px;
    padding:0 0 18px;
    border-bottom:1px solid var(--border);
    display:grid;
    grid-template-columns:minmax(0, 7fr) minmax(180px, 3fr);
    gap:24px;
    position:relative;
  }
  .dash-page-header::after {
    content:'';
    position:absolute;
    bottom:-1px;
    left:0;
    width:120px;
    height:2px;
    background:var(--accent);
    box-shadow:var(--neon);
  }
  .dash-page-header h2 {
    margin:0;
    font-family:'Orbitron',monospace;
    font-size:clamp(28px, 5vw, 52px);
    font-weight:900;
    line-height:1.05;
    letter-spacing:.08em;
    text-transform:uppercase;
    color:var(--fg);
    text-shadow:-2px 0 #ff00ff40, 2px 0 #00d4ff40, 0 0 20px rgba(0,255,136,.25);
  }
  .dash-page-header p {
    margin:0;
    align-self:end;
    border-left:1px solid var(--accent);
    padding-left:18px;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    line-height:1.7;
    letter-spacing:.04em;
  }

  .dash-grid {
    display:grid;
    grid-template-columns:minmax(280px, 5fr) minmax(0, 7fr);
    align-items:start;
    border-left:1px solid var(--border);
    border-top:1px solid var(--border);
  }
  .dash-grid > * {
    border-right:1px solid var(--border);
    border-bottom:1px solid var(--border);
    min-width:0;
  }

  .dash-card {
    background:var(--card);
    border:0;
    padding:22px;
    color:var(--fg);
    position:relative;
  }
  .dash-card h3 {
    margin:0 0 16px;
    border-bottom:1px solid var(--border);
    padding-bottom:10px;
    color:var(--accent);
    font-family:'Orbitron',monospace;
    font-size:16px;
    font-weight:700;
    line-height:1.2;
    letter-spacing:.14em;
    text-transform:uppercase;
    text-shadow:0 0 10px rgba(0,255,136,.35);
  }
  .dash-card + .dash-card { border-top:1px solid var(--border); margin-top:0; }

  .dash-field { margin-bottom:14px; }
  .dash-field label {
    display:block;
    margin-bottom:6px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.2em;
    text-transform:uppercase;
  }
  .dash-input, .dash-textarea, .dash-select {
    width:100%;
    background:var(--input);
    border:1px solid var(--border);
    padding:10px 12px 10px 28px;
    color:var(--accent);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    outline:none;
    clip-path:var(--chamfer-sm);
    transition:all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    position:relative;
  }
  .dash-field { position:relative; }
  .dash-field::before {
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
  .dash-input::placeholder, .dash-textarea::placeholder { color:var(--muted-fg); }
  .dash-input:focus, .dash-textarea:focus, .dash-select:focus {
    border-color:var(--accent);
    box-shadow:var(--neon);
    background:#0e0e16;
  }
  .dash-textarea {
    min-height:78px;
    resize:vertical;
    line-height:1.55;
    padding-left:28px;
  }
  .dash-select { cursor:pointer; padding-left:28px; }
  .dash-select option { background:var(--card); color:var(--fg); }
  .dash-row { display:flex; gap:12px; }
  .dash-row > .dash-field { flex:1; }
  .dash-slider-row { display:flex; align-items:center; gap:10px; }
  .dash-slider-row input[type=range] { flex:1; accent-color:var(--accent); }
  .dash-slider-value {
    width:24px;
    color:var(--accent);
    font-family:'Share Tech Mono',monospace;
    font-size:12px;
    font-weight:700;
    text-align:right;
    text-shadow:0 0 6px rgba(0,255,136,.5);
  }

  .dash-btn-primary {
    width:100%;
    min-height:44px;
    padding:12px 16px;
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
  .dash-btn-primary:hover:not(:disabled) {
    filter:brightness(1.12);
    box-shadow:var(--neon-lg);
  }
  .dash-btn-primary:disabled { opacity:.45; cursor:not-allowed; box-shadow:none; }
  .dash-btn-secondary {
    min-height:44px;
    padding:10px 14px;
    background:transparent;
    border:2px solid var(--accent-2);
    color:var(--accent-2);
    font-family:'Orbitron',monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:.14em;
    text-transform:uppercase;
    cursor:pointer;
    clip-path:var(--chamfer-sm);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dash-btn-secondary:hover:not(:disabled) {
    background:var(--accent-2);
    color:var(--bg);
    box-shadow:var(--neon-2);
  }
  .dash-btn-secondary:disabled { opacity:.45; cursor:not-allowed; }

  .dash-error {
    margin-top:12px;
    padding:10px 12px;
    background:rgba(255,51,102,.08);
    border:1px solid var(--destructive);
    color:var(--destructive);
    font-family:'JetBrains Mono',monospace;
    font-size:12px;
    line-height:1.5;
    clip-path:var(--chamfer-sm);
    box-shadow:0 0 8px #ff336640;
  }
  .dash-empty {
    min-height:220px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:40px 24px;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    line-height:1.7;
    letter-spacing:.04em;
  }
  .dash-empty::before {
    content:'> ';
    color:var(--accent);
    animation:cursor-blink 1s step-end infinite;
  }

  .dash-loading {
    display:flex;
    align-items:center;
    gap:10px;
    padding:18px 0;
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:.12em;
  }
  .dash-spinner {
    width:14px;
    height:14px;
    border:2px solid var(--border);
    border-top-color:var(--accent);
    animation:dash-spin .7s steps(8) infinite;
    flex-shrink:0;
    box-shadow:var(--neon-sm);
  }

  .dash-section-title {
    margin:20px 0 8px;
    border-top:1px solid var(--border);
    padding-top:10px;
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:.2em;
    text-transform:uppercase;
  }
  .dash-section-title:first-child { margin-top:0; border-top:0; padding-top:0; }
  .dash-list { display:flex; flex-direction:column; gap:6px; }
  .dash-list-item {
    display:flex;
    gap:8px;
    color:var(--fg);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    line-height:1.6;
  }
  .dash-list-item .bullet {
    color:var(--accent);
    flex-shrink:0;
    font-family:'Share Tech Mono',monospace;
    text-shadow:0 0 6px rgba(0,255,136,.5);
  }
  .dash-tag {
    display:inline-flex;
    align-items:center;
    margin:2px 4px 2px 0;
    padding:4px 9px;
    background:transparent;
    border:1px solid var(--accent);
    color:var(--accent);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:.1em;
    text-transform:uppercase;
    clip-path:var(--chamfer-sm);
    box-shadow:var(--neon-sm);
  }
  .dash-tag.warn, .dash-tag.danger {
    border-color:var(--destructive);
    color:var(--destructive);
    box-shadow:0 0 6px #ff336650;
  }
  .dash-verdict {
    display:inline-block;
    margin-bottom:14px;
    padding:6px 12px;
    border:1px solid var(--accent-3);
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:.12em;
    text-transform:uppercase;
    clip-path:var(--chamfer-sm);
    box-shadow:var(--neon-3);
  }
  .dash-verdict.credible {
    background:rgba(0,255,136,.15);
    border-color:var(--accent);
    color:var(--accent);
    box-shadow:var(--neon);
  }
  .dash-verdict.needs_work {
    border-color:var(--accent-2);
    color:var(--accent-2);
    box-shadow:var(--neon-2);
  }
  .dash-verdict.not_credible {
    background:rgba(255,51,102,.2);
    border-color:var(--destructive);
    color:var(--destructive);
    box-shadow:0 0 10px #ff336660;
  }

  .dash-table {
    width:100%;
    border-collapse:collapse;
    border:1px solid var(--border);
    font-family:'JetBrains Mono',monospace;
    font-size:12px;
  }
  .dash-table th {
    padding:8px 10px;
    background:rgba(0,255,136,.1);
    border:1px solid var(--border);
    color:var(--accent);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.12em;
    text-align:left;
    text-transform:uppercase;
  }
  .dash-table td {
    padding:10px;
    border:1px solid var(--border);
    color:var(--fg);
    vertical-align:top;
  }

  .dash-valuation-range {
    margin-bottom:4px;
    color:var(--accent);
    font-family:'Orbitron',monospace;
    font-size:36px;
    font-weight:900;
    line-height:1.1;
    letter-spacing:.04em;
    text-shadow:0 0 20px rgba(0,255,136,.4);
  }
  .dash-valuation-sub {
    margin-bottom:18px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    letter-spacing:.12em;
    text-transform:uppercase;
  }

  .dash-phase {
    position:relative;
    margin:0 0 12px;
    padding:12px 14px 14px 44px;
    border:1px solid var(--border);
    background:rgba(28,28,46,.35);
    clip-path:var(--chamfer);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .dash-phase:hover {
    border-color:var(--accent);
    box-shadow:var(--neon-sm);
    transform:translateY(-1px);
  }
  .dash-phase::before {
    content:'';
    position:absolute;
    left:14px;
    top:16px;
    width:14px;
    height:14px;
    background:var(--accent);
    border:1px solid var(--accent);
    box-shadow:var(--neon);
    clip-path:polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  }
  .dash-phase h4 {
    margin:0 0 4px;
    color:var(--fg);
    font-family:'Orbitron',monospace;
    font-size:16px;
    font-weight:700;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .dash-phase p {
    margin:0 0 8px;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:12px;
    line-height:1.55;
  }

  .chat-fab {
    position:fixed;
    right:26px;
    bottom:26px;
    z-index:50;
    width:58px;
    height:58px;
    background:var(--accent);
    border:2px solid var(--accent);
    color:var(--bg);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    clip-path:var(--chamfer);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:var(--neon-lg);
  }
  .chat-fab:hover {
    filter:brightness(1.12);
    box-shadow:var(--neon-lg), var(--neon-2);
  }
  .chat-fab svg { stroke:currentColor; }
  .chat-overlay {
    position:fixed;
    inset:0;
    background:rgba(10,10,15,.65);
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
    border-left:1px solid var(--accent);
    display:flex;
    flex-direction:column;
    transform:translateX(100%);
    transition:transform .25s ease-out;
    box-shadow:-8px 0 40px rgba(0,255,136,.12);
  }
  .chat-panel.open { transform:translateX(0); }
  .chat-panel-header {
    padding:14px 16px;
    border-bottom:1px solid var(--border);
    display:flex;
    align-items:center;
    gap:10px;
    flex-shrink:0;
    background:rgba(10,10,15,.9);
  }
  .chat-panel-header h3 {
    margin:0;
    font-family:'Orbitron',monospace;
    font-size:16px;
    font-weight:800;
    line-height:1;
    letter-spacing:.14em;
    text-transform:uppercase;
    color:var(--accent);
    text-shadow:0 0 10px rgba(0,255,136,.4);
  }
  .chat-panel-close {
    margin-left:auto;
    width:36px;
    height:36px;
    background:transparent;
    border:1px solid var(--border);
    color:var(--fg);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Share Tech Mono',monospace;
    font-size:14px;
    clip-path:var(--chamfer-sm);
  }
  .chat-panel-close:hover {
    background:var(--destructive);
    border-color:var(--destructive);
    color:#fff;
    box-shadow:0 0 10px #ff336660;
  }

  .chat-messages {
    flex:1;
    overflow-y:auto;
    padding:18px;
    display:flex;
    flex-direction:column;
    gap:16px;
    background:
      linear-gradient(rgba(0,255,136,.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,255,136,.02) 1px, transparent 1px);
    background-size:24px 24px;
  }
  .chat-welcome {
    border:1px solid var(--border);
    padding:26px 18px;
    text-align:left;
    background:rgba(28,28,46,.4);
    clip-path:var(--chamfer);
    box-shadow:var(--neon-sm);
  }
  .chat-welcome-icon {
    width:48px;
    height:48px;
    margin:0 0 14px;
    background:transparent;
    border:2px solid var(--accent);
    color:var(--accent);
    display:flex;
    align-items:center;
    justify-content:center;
    clip-path:var(--chamfer-sm);
    box-shadow:var(--neon);
  }
  .chat-welcome h4 {
    margin:0 0 8px;
    font-family:'Orbitron',monospace;
    font-size:22px;
    font-weight:800;
    line-height:1.15;
    letter-spacing:.1em;
    text-transform:uppercase;
    color:var(--fg);
  }
  .chat-welcome p {
    margin:0 0 18px;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    line-height:1.65;
  }
  .chat-starters {
    display:flex;
    flex-direction:column;
    gap:0;
    border-left:1px solid var(--border);
    border-top:1px solid var(--border);
  }
  .chat-starter-btn {
    min-height:44px;
    padding:10px 12px;
    background:var(--bg);
    border:0;
    border-right:1px solid var(--border);
    border-bottom:1px solid var(--border);
    color:var(--fg);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:.1em;
    text-align:left;
    text-transform:uppercase;
    cursor:pointer;
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .chat-starter-btn:hover {
    background:rgba(0,255,136,.12);
    color:var(--accent);
    box-shadow:inset 3px 0 0 var(--accent);
  }

  .chat-message { display:flex; gap:10px; }
  .chat-message.user { flex-direction:row-reverse; }
  .chat-avatar {
    width:28px;
    height:28px;
    border:1px solid var(--border);
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    font-weight:700;
    clip-path:var(--chamfer-sm);
  }
  .chat-avatar.ai {
    background:rgba(0,255,136,.15);
    border-color:var(--accent);
    color:var(--accent);
    box-shadow:var(--neon-sm);
  }
  .chat-avatar.user-av {
    background:rgba(0,212,255,.12);
    border-color:var(--accent-3);
    color:var(--accent-3);
  }
  .chat-bubble-wrap { max-width:84%; display:flex; flex-direction:column; gap:6px; }
  .chat-bubble {
    padding:11px 13px;
    border:1px solid var(--border);
    color:var(--fg);
    font-size:13px;
    line-height:1.65;
    clip-path:var(--chamfer-sm);
  }
  .chat-bubble.ai {
    background:rgba(18,18,26,.9);
    font-family:'JetBrains Mono',monospace;
  }
  .chat-bubble.user {
    background:rgba(0,255,136,.12);
    border-color:var(--accent);
    color:var(--fg);
    font-family:'JetBrains Mono',monospace;
    box-shadow:var(--neon-sm);
  }
  .chat-bubble.err {
    border-color:var(--destructive);
    color:var(--destructive);
  }
  .chat-bubble.ai strong { color:var(--accent); font-weight:700; }
  .chat-download-row { display:flex; flex-wrap:wrap; gap:6px; }
  .chat-download-btn {
    min-height:34px;
    padding:6px 10px;
    background:transparent;
    border:1px solid var(--accent-3);
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:.1em;
    text-transform:uppercase;
    cursor:pointer;
    clip-path:var(--chamfer-sm);
  }
  .chat-download-btn:hover {
    background:var(--accent-3);
    color:var(--bg);
    box-shadow:var(--neon-3);
  }
  .chat-msg-link {
    color:var(--accent-3);
    text-decoration-color:var(--accent);
    text-decoration-thickness:1px;
    text-underline-offset:4px;
  }
  .chat-msg-link:hover { color:var(--accent); text-shadow:0 0 6px rgba(0,255,136,.5); }

  .chat-steps {
    max-width:84%;
    margin-left:38px;
    padding:12px 13px;
    border:1px solid var(--border);
    background:rgba(10,10,15,.6);
    display:flex;
    flex-direction:column;
    gap:6px;
    clip-path:var(--chamfer-sm);
  }
  .chat-step {
    display:flex;
    align-items:center;
    gap:8px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10.5px;
    letter-spacing:.08em;
    text-transform:uppercase;
  }
  .chat-step.active { color:var(--accent); text-shadow:0 0 6px rgba(0,255,136,.4); }
  .chat-step.done { color:var(--accent-3); }
  .chat-step-dot { width:14px; flex-shrink:0; text-align:center; font-size:11px; }
  .chat-step.active .chat-step-dot { animation:dash-blink 1s steps(2) infinite; }

  .chat-input-area {
    padding:12px 16px 16px;
    border-top:1px solid var(--border);
    flex-shrink:0;
    background:rgba(10,10,15,.95);
  }
  .chat-input-wrap {
    display:flex;
    gap:8px;
    padding:5px 5px 5px 12px;
    background:var(--input);
    border:1px solid var(--border);
    align-items:flex-end;
    clip-path:var(--chamfer-sm);
  }
  .chat-input-wrap:focus-within {
    border-color:var(--accent);
    box-shadow:var(--neon);
  }
  .chat-input-wrap textarea {
    flex:1;
    min-height:24px;
    max-height:100px;
    padding:6px 0;
    background:transparent;
    border:0;
    outline:none;
    color:var(--accent);
    font-family:'JetBrains Mono',monospace;
    font-size:13px;
    line-height:1.5;
    resize:none;
  }
  .chat-input-wrap textarea::placeholder { color:var(--muted-fg); }
  .chat-send-btn {
    width:34px;
    height:34px;
    background:var(--accent);
    border:1px solid var(--accent);
    color:var(--bg);
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
    clip-path:var(--chamfer-sm);
    box-shadow:var(--neon-sm);
  }
  .chat-send-btn:hover:not(:disabled) { filter:brightness(1.1); }
  .chat-send-btn:disabled { opacity:.45; cursor:not-allowed; }
  .chat-send-btn svg { stroke:currentColor; }
  .chat-hint {
    margin:8px 0 0;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.08em;
    text-align:center;
    text-transform:uppercase;
  }
  .chat-hint kbd {
    border:1px solid var(--border);
    padding:1px 4px;
    color:var(--accent);
    background:var(--bg);
  }

  .kb-panel {
    max-width:760px;
    border-left:1px solid var(--border);
    border-top:1px solid var(--border);
  }
  .kb-toggle-btn {
    width:100%;
    min-height:44px;
    padding:12px 14px;
    background:rgba(0,255,136,.1);
    border:0;
    border-right:1px solid var(--border);
    border-bottom:1px solid var(--border);
    color:var(--accent);
    font-family:'Orbitron',monospace;
    font-size:12px;
    font-weight:700;
    letter-spacing:.14em;
    text-align:left;
    text-transform:uppercase;
    display:flex;
    align-items:center;
    gap:8px;
    cursor:pointer;
  }
  .kb-body {
    padding:16px;
    border-right:1px solid var(--border);
    border-bottom:1px solid var(--border);
    background:var(--card);
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .kb-desc {
    margin:0;
    color:var(--muted-fg);
    font-family:'JetBrains Mono',monospace;
    font-size:12px;
    line-height:1.6;
  }
  .kb-field { position:relative; }
  .kb-field input.kb-input, .kb-textarea {
    width:100%;
    background:var(--input);
    border:1px solid var(--border);
    padding:9px 12px;
    color:var(--accent);
    font-size:12px;
    outline:none;
    clip-path:var(--chamfer-sm);
  }
  .kb-field input.kb-input { font-family:'JetBrains Mono',monospace; }
  .kb-textarea {
    min-height:92px;
    resize:vertical;
    font-family:'JetBrains Mono',monospace;
    line-height:1.55;
  }
  .kb-field input.kb-input::placeholder, .kb-textarea::placeholder { color:var(--muted-fg); }
  .kb-field input.kb-input:focus, .kb-textarea:focus {
    border-color:var(--accent);
    box-shadow:var(--neon);
  }
  .kb-file-upload-row { display:flex; align-items:center; gap:8px; margin-bottom:2px; }
  .kb-file-input { position:absolute; width:0; height:0; opacity:0; pointer-events:none; }
  .kb-upload-file-btn, .kb-upload-btn, .kb-refresh-btn {
    min-height:44px;
    padding:9px 12px;
    background:transparent;
    border:1px solid var(--border);
    color:var(--fg);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:.1em;
    text-transform:uppercase;
    cursor:pointer;
    clip-path:var(--chamfer-sm);
    transition:all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .kb-upload-file-btn:hover:not(:disabled),
  .kb-upload-btn:hover:not(:disabled),
  .kb-refresh-btn:hover {
    border-color:var(--accent);
    color:var(--accent);
    box-shadow:var(--neon-sm);
  }
  .kb-upload-file-btn:disabled, .kb-upload-btn:disabled { opacity:.45; cursor:not-allowed; }
  .kb-divider {
    margin:2px 0;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.12em;
    text-align:center;
    text-transform:uppercase;
  }
  .kb-actions { display:flex; gap:8px; align-items:center; }
  .kb-upload-btn {
    flex:1;
    background:var(--accent);
    border-color:var(--accent);
    color:var(--bg);
    box-shadow:var(--neon-sm);
  }
  .kb-upload-btn:hover:not(:disabled) {
    filter:brightness(1.1);
    box-shadow:var(--neon);
  }
  .kb-msg {
    margin:0;
    padding:8px 10px;
    border:1px solid var(--border);
    color:var(--fg);
    font-family:'JetBrains Mono',monospace;
    font-size:11px;
    line-height:1.5;
    clip-path:var(--chamfer-sm);
  }
  .kb-msg.error { border-color:var(--destructive); color:var(--destructive); }
  .kb-docs-section { border-top:1px solid var(--border); padding-top:10px; }
  .kb-docs-label {
    margin:0 0 8px;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    letter-spacing:.16em;
    text-transform:uppercase;
  }
  .kb-docs-empty {
    margin:0;
    color:var(--muted-fg);
    font-family:'Share Tech Mono',monospace;
    font-size:11px;
  }
  .kb-doc-list {
    display:flex;
    flex-direction:column;
    gap:0;
    border-left:1px solid var(--border);
    border-top:1px solid var(--border);
  }
  .kb-doc-item {
    display:flex;
    align-items:center;
    gap:8px;
    padding:8px 10px;
    border-right:1px solid var(--border);
    border-bottom:1px solid var(--border);
  }
  .kb-doc-icon {
    width:18px;
    height:18px;
    border:1px solid var(--accent);
    color:var(--accent);
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-family:'Share Tech Mono',monospace;
    font-size:9px;
    flex-shrink:0;
  }
  .kb-doc-name {
    flex:1;
    color:var(--fg);
    font-family:'JetBrains Mono',monospace;
    font-size:11px;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .kb-doc-count, .kb-badge {
    border:1px solid var(--border);
    padding:2px 6px;
    color:var(--accent-3);
    font-family:'Share Tech Mono',monospace;
    font-size:10px;
    flex-shrink:0;
  }
  .kb-saved-dot {
    width:9px;
    height:9px;
    background:var(--accent);
    border:1px solid var(--bg);
    flex-shrink:0;
    box-shadow:var(--neon-sm);
  }

  /* ── Onboarding wizard ───────────────────────────────────────── */
  .onboard-wrap { max-width:760px; }
  .onboard-steps {
    display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap;
  }
  .onboard-step {
    display:flex; align-items:center; gap:8px;
    padding:8px 12px; border:1px solid var(--border);
    font-family:var(--font-mono); font-size:11px; letter-spacing:.08em;
    text-transform:uppercase; color:var(--muted); background:rgba(0,0,0,.25);
  }
  .onboard-step.active {
    border-color:var(--accent); color:var(--accent);
    box-shadow:var(--neon-sm);
  }
  .onboard-step.done { color:#7dffb8; border-color:rgba(0,255,136,.35); }
  .onboard-step-num {
    font-family:'Orbitron',monospace; font-weight:700; font-size:10px;
  }
  .onboard-card h3 {
    font-family:'Orbitron',monospace; font-size:14px; letter-spacing:.1em;
    text-transform:uppercase; color:var(--accent); margin:0 0 16px;
  }
  .onboard-stage-grid {
    display:flex; flex-wrap:wrap; gap:8px;
  }
  .onboard-stage-btn {
    background:rgba(0,0,0,.35); border:1px solid var(--border);
    color:var(--text); font-family:var(--font-mono); font-size:11px;
    letter-spacing:.06em; text-transform:uppercase; padding:8px 12px; cursor:pointer;
  }
  .onboard-stage-btn:hover { border-color:var(--accent); }
  .onboard-stage-btn.active {
    border-color:var(--accent); color:var(--accent); box-shadow:var(--neon-sm);
  }
  .onboard-actions {
    display:flex; gap:10px; align-items:center; margin-top:20px; flex-wrap:wrap;
  }
  .onboard-upload-row {
    display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 4px;
  }
  .onboard-check {
    display:flex; align-items:center; gap:8px;
    font-family:var(--font-mono); font-size:12px; color:var(--text);
    margin:8px 0 12px; cursor:pointer;
  }

  /* ── Soft gate banner ────────────────────────────────────────── */
  .dash-soft-banner {
    padding:10px 20px; border-bottom:1px solid rgba(0,255,136,.25);
    background:rgba(0,255,136,.06);
    font-family:var(--font-mono); font-size:12px; letter-spacing:.04em;
    color:var(--text);
  }
  .dash-soft-banner a {
    color:var(--accent); text-decoration:underline;
  }

  /* ── Home readiness ──────────────────────────────────────────── */
  .home-progress-meta {
    display:flex; align-items:baseline; gap:10px; margin-bottom:12px;
  }
  .home-progress-pct {
    font-family:'Orbitron',monospace; font-size:42px; font-weight:800;
    color:var(--accent); text-shadow:0 0 12px rgba(0,255,136,.45);
    line-height:1;
  }
  .home-progress-label {
    font-family:var(--font-mono); font-size:11px; letter-spacing:.14em;
    text-transform:uppercase; color:var(--muted);
  }
  .home-progress-bar {
    height:10px; background:rgba(255,255,255,.06);
    border:1px solid var(--border); overflow:hidden; margin-bottom:18px;
  }
  .home-progress-fill {
    height:100%; background:linear-gradient(90deg,#00ff88,#00c8ff);
    box-shadow:0 0 12px rgba(0,255,136,.5);
    transition:width .4s ease;
  }
  .home-milestone-list {
    list-style:none; margin:0; padding:0;
    display:flex; flex-direction:column; gap:8px;
  }
  .home-milestone-list li {
    display:grid; grid-template-columns:28px 1fr auto; gap:8px; align-items:center;
    font-family:var(--font-mono); font-size:12px; color:var(--muted);
  }
  .home-milestone-list li.done { color:var(--text); }
  .home-ms-mark {
    font-size:10px; letter-spacing:.08em; color:var(--accent);
  }
  .home-ms-w { color:var(--muted); font-size:10px; }
  .home-next-copy {
    font-size:15px; line-height:1.5; color:var(--text); margin:0 0 18px;
  }
  .home-next-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }

  .chat-bubble.system {
    border-color:rgba(0,255,136,.45);
    background:rgba(0,255,136,.08);
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
    }
    .dash-sidebar-label, .dash-nav-divider { display:none; }
    .dash-nav-item {
      min-width:max-content;
      border-right:1px solid var(--border);
      border-bottom:0;
    }
    .dash-content { padding:22px 16px 44px; overflow:visible; }
    .dash-page-header { grid-template-columns:1fr; gap:12px; }
    .dash-page-header p {
      border-left:0;
      border-top:1px solid var(--border);
      padding:12px 0 0;
    }
    .dash-grid { grid-template-columns:1fr; }
    .dash-row { flex-direction:column; gap:0; }
  }

  @media (max-width: 560px) {
    .dash-header { gap:10px; }
    .dash-header-text h1 { font-size:16px; letter-spacing:.12em; }
    .dash-header-right { gap:6px; }
    .dash-btn-ghost { padding:8px 10px; font-size:10px; }
    .dash-page-header h2 { font-size:28px; letter-spacing:.06em; }
    .dash-card { padding:16px; }
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
        .replace(/`(.*?)`/g, '<code style="background:#1c1c2e;border:1px solid #00ff88;color:#00ff88;padding:1px 5px;font-size:12px;font-family:JetBrains Mono,monospace;">$1</code>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-family:Orbitron,monospace;font-size:14px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#00ff88;margin:12px 0 5px;text-shadow:0 0 8px rgba(0,255,136,.4);">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-family:Orbitron,monospace;font-size:16px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#e0e0e0;margin:14px 0 6px;">$1</h2>')
        .replace(/^#{1}\s(.+)$/gm, '<h2 style="font-family:Orbitron,monospace;font-size:18px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#e0e0e0;margin:14px 0 6px;">$1</h2>')
        .replace(/^[-*]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;"><span style="color:#00ff88;flex-shrink:0;">></span><span>$1</span></div>')
        .replace(/\[(HOOK|PROBLEM|SOLUTION|TRACTION|ASK)\]/g,
            '<span style="display:inline-block;padding:1px 8px;background:transparent;border:1px solid #00ff88;color:#00ff88;font-family:Share Tech Mono,monospace;font-size:10px;font-weight:700;margin:0 2px;text-transform:uppercase;box-shadow:0 0 6px #00ff8840;">$1</span>');
    out = out.replace(/https?:\/\/[^\s<>"')\]]+/g, (url) => {
        const safe = escapeHtmlUrl(url);
        const isDrawio = /diagrams\.net|draw\.io/i.test(url);
        const label = isDrawio ? "View drawing" : "Open link";
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="chat-msg-link">${label}</a>`;
    });
    return out.replace(/\n/g, "<br/>");
}
