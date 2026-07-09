/**
 * Shared Newsprint design tokens + global CSS for the Pitchmate dashboard.
 * Permanent light mode, sharp geometry, dense editorial grids, and high
 * contrast typography.
 */

export const COLORS = {
    bg: "#F9F9F7",
    text: "#111111",
    muted: "#E5E5E0",
    accent: "#CC0000",
    border: "#111111",
};

export const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=block');

  * { box-sizing:border-box; border-radius:0 !important; }
  html, body, #root { min-height:100%; background:#F9F9F7; }
  body { margin:0; color:#111111; }
  button, input, textarea, select { font:inherit; }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible {
    outline:2px solid #111111;
    outline-offset:2px;
  }

  .font-serif { font-family:'Playfair Display','Times New Roman',serif; }
  .font-body { font-family:'Lora',Georgia,serif; }
  .font-sans { font-family:'Inter','Helvetica Neue',sans-serif; }
  .font-mono { font-family:'JetBrains Mono','Courier New',monospace; }
  .sharp-corners { border-radius:0 !important; }
  .hard-shadow-hover { transition:transform .2s ease-out, box-shadow .2s ease-out, background .2s ease-out; }
  .hard-shadow-hover:hover { box-shadow:4px 4px 0 0 #111111; transform:translate(-2px,-2px); }
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

  .dash-app {
    min-height:100vh;
    background-color:#F9F9F7;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4' viewBox='0 0 4 4'%3E%3Cpath fill='%23111111' fill-opacity='0.04' d='M1 3h1v1H1V3zm2-2h1v1H3V1z'%3E%3C/path%3E%3C/svg%3E");
    color:#111111;
    display:flex;
    flex-direction:column;
    font-family:'Inter','Helvetica Neue',sans-serif;
    overflow:hidden;
  }

  .dash-header {
    padding:12px 24px;
    border-bottom:4px solid #111111;
    display:grid;
    grid-template-columns:auto 1fr auto;
    align-items:center;
    gap:18px;
    position:sticky;
    top:0;
    z-index:40;
    background:#F9F9F7;
  }
  .dash-logo-mark {
    width:38px;
    height:38px;
    background:#111111;
    border:1px solid #111111;
    color:#F9F9F7;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:22px;
    font-weight:900;
    flex-shrink:0;
  }
  .dash-header-text h1 {
    margin:0;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:30px;
    font-weight:900;
    line-height:.9;
    letter-spacing:-1px;
  }
  .dash-header-text p {
    margin:4px 0 0;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1.8px;
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
    background:#F9F9F7;
    border:1px solid #111111;
    display:flex;
    align-items:center;
    justify-content:center;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:12px;
    font-weight:700;
    flex-shrink:0;
  }
  .dash-edition {
    border-left:1px solid #111111;
    padding-left:12px;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:.8px;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .dash-btn-ghost {
    min-height:44px;
    padding:8px 12px;
    background:transparent;
    border:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:11px;
    font-weight:700;
    letter-spacing:1.4px;
    text-transform:uppercase;
    cursor:pointer;
    transition:all .2s ease-out;
    white-space:nowrap;
  }
  .dash-btn-ghost:hover { background:#111111; color:#F9F9F7; }

  .dash-ticker {
    overflow:hidden;
    border-bottom:1px solid #111111;
    background:#111111;
    color:#F9F9F7;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    letter-spacing:1px;
    text-transform:uppercase;
    white-space:nowrap;
  }
  .dash-ticker-track {
    display:inline-flex;
    gap:28px;
    padding:8px 0;
    animation:dash-ticker 28s linear infinite;
  }
  .dash-ticker span { display:inline-flex; align-items:center; gap:8px; }
  .dash-ticker b { color:#CC0000; background:#F9F9F7; padding:1px 6px; }
  @keyframes dash-ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }

  .dash-body {
    display:flex;
    flex:1;
    min-height:0;
    border-bottom:1px solid #111111;
  }
  .dash-sidebar {
    width:234px;
    flex-shrink:0;
    border-right:1px solid #111111;
    overflow-y:auto;
    background:#F9F9F7;
    display:flex;
    flex-direction:column;
  }
  .dash-sidebar-label {
    padding:14px 16px 10px;
    border-bottom:1px solid #111111;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1.8px;
    text-transform:uppercase;
  }
  .dash-nav-item {
    min-height:48px;
    display:flex;
    align-items:center;
    gap:12px;
    padding:12px 16px;
    border-bottom:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:12px;
    font-weight:800;
    letter-spacing:1.2px;
    text-transform:uppercase;
    text-decoration:none;
    transition:all .2s ease-out;
  }
  .dash-nav-item:hover { background:#E5E5E0; color:#CC0000; }
  .dash-nav-item.active { background:#111111; color:#F9F9F7; }
  .dash-nav-icon {
    width:28px;
    height:28px;
    border:1px solid currentColor;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    flex-shrink:0;
  }
  .dash-nav-divider { height:4px; background:#111111; margin:0; }

  .dash-content {
    flex:1;
    overflow-y:auto;
    padding:28px 32px 60px;
    background:#F9F9F7;
  }
  .dash-content::-webkit-scrollbar, .dash-sidebar::-webkit-scrollbar, .chat-messages::-webkit-scrollbar { width:6px; }
  .dash-content::-webkit-scrollbar-thumb, .dash-sidebar::-webkit-scrollbar-thumb, .chat-messages::-webkit-scrollbar-thumb { background:#111111; }

  .dash-page-header {
    margin:0 0 24px;
    padding:0 0 18px;
    border-bottom:4px solid #111111;
    display:grid;
    grid-template-columns:minmax(0, 7fr) minmax(180px, 3fr);
    gap:24px;
  }
  .dash-page-header h2 {
    margin:0;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:clamp(44px, 7vw, 92px);
    font-weight:900;
    line-height:.9;
    letter-spacing:-3px;
  }
  .dash-page-header p {
    margin:0;
    align-self:end;
    border-left:1px solid #111111;
    padding-left:18px;
    color:#404040;
    font-family:'Lora',Georgia,serif;
    font-size:15px;
    line-height:1.65;
    text-align:justify;
  }
  .dash-page-header p::first-letter {
    float:left;
    margin:.08em .12em 0 0;
    color:#CC0000;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:52px;
    line-height:.82;
    font-weight:900;
  }

  .dash-grid {
    display:grid;
    grid-template-columns:minmax(280px, 5fr) minmax(0, 7fr);
    align-items:start;
    border-left:1px solid #111111;
    border-top:1px solid #111111;
  }
  .dash-grid > * {
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
    min-width:0;
  }

  .dash-card {
    background:#F9F9F7;
    border:0;
    padding:22px;
    color:#111111;
  }
  .dash-card h3 {
    margin:0 0 16px;
    border-bottom:1px solid #111111;
    padding-bottom:10px;
    color:#111111;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:26px;
    font-weight:900;
    line-height:1;
  }
  .dash-card + .dash-card { border-top:1px solid #111111; margin-top:0; }

  .dash-field { margin-bottom:14px; }
  .dash-field label {
    display:block;
    margin-bottom:6px;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1.2px;
    text-transform:uppercase;
  }
  .dash-input, .dash-textarea, .dash-select {
    width:100%;
    background:transparent;
    border:0;
    border-bottom:2px solid #111111;
    padding:10px 8px;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:13px;
    outline:none;
    transition:background .2s ease-out;
  }
  .dash-input::placeholder, .dash-textarea::placeholder { color:#737373; }
  .dash-input:focus, .dash-textarea:focus, .dash-select:focus { background:#F0F0F0; }
  .dash-textarea {
    min-height:78px;
    resize:vertical;
    font-family:'Lora',Georgia,serif;
    line-height:1.55;
  }
  .dash-select { cursor:pointer; }
  .dash-select option { background:#F9F9F7; color:#111111; }
  .dash-row { display:flex; gap:12px; }
  .dash-row > .dash-field { flex:1; }
  .dash-slider-row { display:flex; align-items:center; gap:10px; }
  .dash-slider-row input[type=range] { flex:1; accent-color:#111111; }
  .dash-slider-value {
    width:24px;
    color:#CC0000;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:12px;
    font-weight:700;
    text-align:right;
  }

  .dash-btn-primary {
    width:100%;
    min-height:44px;
    padding:12px 16px;
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
  .dash-btn-primary:hover:not(:disabled) { background:#F9F9F7; border-color:#111111; color:#111111; box-shadow:4px 4px 0 0 #111111; transform:translate(-2px,-2px); }
  .dash-btn-primary:disabled { opacity:.45; cursor:not-allowed; }
  .dash-btn-secondary {
    min-height:44px;
    padding:10px 14px;
    background:transparent;
    border:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:11px;
    font-weight:800;
    letter-spacing:1.2px;
    text-transform:uppercase;
    cursor:pointer;
    transition:all .2s ease-out;
  }
  .dash-btn-secondary:hover:not(:disabled) { background:#111111; color:#F9F9F7; }
  .dash-btn-secondary:disabled { opacity:.45; cursor:not-allowed; }

  .dash-error {
    margin-top:12px;
    padding:10px 12px;
    background:#F9F9F7;
    border:1px solid #CC0000;
    color:#CC0000;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:12px;
    line-height:1.5;
  }
  .dash-empty {
    min-height:220px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:40px 24px;
    color:#525252;
    font-family:'Lora',Georgia,serif;
    font-size:15px;
    line-height:1.7;
    text-align:justify;
  }

  .dash-loading {
    display:flex;
    align-items:center;
    gap:10px;
    padding:18px 0;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:12px;
    text-transform:uppercase;
    letter-spacing:1px;
  }
  .dash-spinner {
    width:14px;
    height:14px;
    border:2px solid #111111;
    border-top-color:#F9F9F7;
    animation:dash-spin .7s steps(8) infinite;
    flex-shrink:0;
  }
  @keyframes dash-spin { to { transform:rotate(360deg); } }

  .dash-section-title {
    margin:20px 0 8px;
    border-top:1px solid #111111;
    padding-top:10px;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:1.6px;
    text-transform:uppercase;
  }
  .dash-section-title:first-child { margin-top:0; border-top:0; padding-top:0; }
  .dash-list { display:flex; flex-direction:column; gap:6px; }
  .dash-list-item {
    display:flex;
    gap:8px;
    color:#111111;
    font-family:'Lora',Georgia,serif;
    font-size:14px;
    line-height:1.6;
    text-align:justify;
  }
  .dash-list-item .bullet { color:#CC0000; flex-shrink:0; font-family:'JetBrains Mono','Courier New',monospace; }
  .dash-tag {
    display:inline-flex;
    align-items:center;
    margin:2px 4px 2px 0;
    padding:4px 9px;
    background:#F9F9F7;
    border:1px solid #111111;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    font-weight:700;
    letter-spacing:.8px;
    text-transform:uppercase;
  }
  .dash-tag.warn, .dash-tag.danger { border-color:#CC0000; color:#CC0000; }
  .dash-verdict {
    display:inline-block;
    margin-bottom:14px;
    padding:6px 12px;
    border:1px solid #111111;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    font-weight:700;
    letter-spacing:1px;
    text-transform:uppercase;
  }
  .dash-verdict.credible { background:#111111; color:#F9F9F7; }
  .dash-verdict.needs_work { border-color:#CC0000; color:#CC0000; }
  .dash-verdict.not_credible { background:#CC0000; border-color:#CC0000; color:#F9F9F7; }

  .dash-table {
    width:100%;
    border-collapse:collapse;
    border:1px solid #111111;
    font-family:'Lora',Georgia,serif;
    font-size:13px;
  }
  .dash-table th {
    padding:8px 10px;
    background:#111111;
    border:1px solid #111111;
    color:#F9F9F7;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1px;
    text-align:left;
    text-transform:uppercase;
  }
  .dash-table td {
    padding:10px;
    border:1px solid #111111;
    color:#111111;
    vertical-align:top;
  }

  .dash-valuation-range {
    margin-bottom:4px;
    color:#111111;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:44px;
    font-weight:900;
    line-height:1;
    letter-spacing:-2px;
  }
  .dash-valuation-sub {
    margin-bottom:18px;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    letter-spacing:1px;
    text-transform:uppercase;
  }

  .dash-phase {
    position:relative;
    margin:0 0 12px;
    padding:12px 14px 14px 44px;
    border:1px solid #111111;
  }
  .dash-phase::before {
    content:'';
    position:absolute;
    left:14px;
    top:16px;
    width:14px;
    height:14px;
    background:#CC0000;
    border:1px solid #111111;
  }
  .dash-phase h4 {
    margin:0 0 4px;
    color:#111111;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:22px;
    font-weight:900;
  }
  .dash-phase p {
    margin:0 0 8px;
    color:#404040;
    font-family:'Lora',Georgia,serif;
    font-size:13px;
    line-height:1.55;
  }

  .chat-fab {
    position:fixed;
    right:26px;
    bottom:26px;
    z-index:50;
    width:58px;
    height:58px;
    background:#111111;
    border:1px solid #111111;
    color:#F9F9F7;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    transition:all .2s ease-out;
  }
  .chat-fab:hover { background:#F9F9F7; color:#111111; box-shadow:4px 4px 0 0 #111111; transform:translate(-2px,-2px); }
  .chat-fab svg { stroke:currentColor; }
  .chat-overlay {
    position:fixed;
    inset:0;
    background:rgba(17,17,17,.25);
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
    background:#F9F9F7;
    border-left:4px solid #111111;
    display:flex;
    flex-direction:column;
    transform:translateX(100%);
    transition:transform .25s ease-out;
  }
  .chat-panel.open { transform:translateX(0); }
  .chat-panel-header {
    padding:14px 16px;
    border-bottom:4px solid #111111;
    display:flex;
    align-items:center;
    gap:10px;
    flex-shrink:0;
  }
  .chat-panel-header h3 {
    margin:0;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:24px;
    font-weight:900;
    line-height:1;
  }
  .chat-panel-close {
    margin-left:auto;
    width:36px;
    height:36px;
    background:transparent;
    border:1px solid #111111;
    color:#111111;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:14px;
  }
  .chat-panel-close:hover { background:#CC0000; color:#F9F9F7; }

  .chat-messages {
    flex:1;
    overflow-y:auto;
    padding:18px;
    display:flex;
    flex-direction:column;
    gap:16px;
  }
  .chat-welcome {
    border:1px solid #111111;
    padding:26px 18px;
    text-align:left;
  }
  .chat-welcome-icon {
    width:48px;
    height:48px;
    margin:0 0 14px;
    background:#111111;
    border:1px solid #111111;
    color:#F9F9F7;
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .chat-welcome h4 {
    margin:0 0 8px;
    font-family:'Playfair Display','Times New Roman',serif;
    font-size:32px;
    font-weight:900;
    line-height:1;
  }
  .chat-welcome p {
    margin:0 0 18px;
    color:#404040;
    font-family:'Lora',Georgia,serif;
    font-size:14px;
    line-height:1.65;
    text-align:justify;
  }
  .chat-starters { display:flex; flex-direction:column; gap:0; border-left:1px solid #111111; border-top:1px solid #111111; }
  .chat-starter-btn {
    min-height:44px;
    padding:10px 12px;
    background:#F9F9F7;
    border:0;
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:11px;
    font-weight:800;
    letter-spacing:1px;
    text-align:left;
    text-transform:uppercase;
    cursor:pointer;
    transition:all .2s ease-out;
  }
  .chat-starter-btn:hover { background:#111111; color:#F9F9F7; }

  .chat-message { display:flex; gap:10px; }
  .chat-message.user { flex-direction:row-reverse; }
  .chat-avatar {
    width:28px;
    height:28px;
    border:1px solid #111111;
    flex-shrink:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    font-weight:700;
  }
  .chat-avatar.ai { background:#111111; color:#F9F9F7; }
  .chat-avatar.user-av { background:#F9F9F7; color:#111111; }
  .chat-bubble-wrap { max-width:84%; display:flex; flex-direction:column; gap:6px; }
  .chat-bubble {
    padding:11px 13px;
    border:1px solid #111111;
    color:#111111;
    font-size:13px;
    line-height:1.65;
  }
  .chat-bubble.ai { background:#F9F9F7; font-family:'Lora',Georgia,serif; }
  .chat-bubble.user { background:#111111; color:#F9F9F7; font-family:'Inter','Helvetica Neue',sans-serif; }
  .chat-bubble.err { border-color:#CC0000; color:#CC0000; }
  .chat-bubble.ai strong { color:#111111; font-weight:700; }
  .chat-download-row { display:flex; flex-wrap:wrap; gap:6px; }
  .chat-download-btn {
    min-height:34px;
    padding:6px 10px;
    background:#F9F9F7;
    border:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:10px;
    font-weight:800;
    letter-spacing:1px;
    text-transform:uppercase;
    cursor:pointer;
  }
  .chat-download-btn:hover { background:#111111; color:#F9F9F7; }
  .chat-msg-link { color:#111111; text-decoration-color:#CC0000; text-decoration-thickness:2px; text-underline-offset:4px; }
  .chat-msg-link:hover { color:#CC0000; }

  .chat-steps {
    max-width:84%;
    margin-left:38px;
    padding:12px 13px;
    border:1px solid #111111;
    display:flex;
    flex-direction:column;
    gap:6px;
  }
  .chat-step {
    display:flex;
    align-items:center;
    gap:8px;
    color:#737373;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10.5px;
    letter-spacing:.4px;
    text-transform:uppercase;
  }
  .chat-step.active { color:#CC0000; }
  .chat-step.done { color:#111111; }
  .chat-step-dot { width:14px; flex-shrink:0; text-align:center; font-size:11px; }
  .chat-step.active .chat-step-dot { animation:dash-blink 1s steps(2) infinite; }
  @keyframes dash-blink { 0%,100% { opacity:1; } 50% { opacity:.2; } }

  .chat-input-area { padding:12px 16px 16px; border-top:4px solid #111111; flex-shrink:0; }
  .chat-input-wrap {
    display:flex;
    gap:8px;
    padding:5px 5px 5px 12px;
    background:#F9F9F7;
    border:1px solid #111111;
    align-items:flex-end;
  }
  .chat-input-wrap:focus-within { background:#F0F0F0; }
  .chat-input-wrap textarea {
    flex:1;
    min-height:24px;
    max-height:100px;
    padding:6px 0;
    background:transparent;
    border:0;
    outline:none;
    color:#111111;
    font-family:'Lora',Georgia,serif;
    font-size:13px;
    line-height:1.5;
    resize:none;
  }
  .chat-input-wrap textarea::placeholder { color:#737373; }
  .chat-send-btn {
    width:34px;
    height:34px;
    background:#111111;
    border:1px solid #111111;
    color:#F9F9F7;
    cursor:pointer;
    display:flex;
    align-items:center;
    justify-content:center;
    flex-shrink:0;
  }
  .chat-send-btn:hover:not(:disabled) { background:#F9F9F7; color:#111111; }
  .chat-send-btn:disabled { opacity:.45; cursor:not-allowed; }
  .chat-send-btn svg { stroke:currentColor; }
  .chat-hint {
    margin:8px 0 0;
    color:#737373;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:.5px;
    text-align:center;
    text-transform:uppercase;
  }
  .chat-hint kbd { border:1px solid #111111; padding:1px 4px; color:#111111; background:#F9F9F7; }

  .kb-panel {
    max-width:760px;
    border-left:1px solid #111111;
    border-top:1px solid #111111;
  }
  .kb-toggle-btn {
    width:100%;
    min-height:44px;
    padding:12px 14px;
    background:#111111;
    border:0;
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
    color:#F9F9F7;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:12px;
    font-weight:800;
    letter-spacing:1.4px;
    text-align:left;
    text-transform:uppercase;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .kb-body {
    padding:16px;
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
    background:#F9F9F7;
    display:flex;
    flex-direction:column;
    gap:10px;
  }
  .kb-desc {
    margin:0;
    color:#404040;
    font-family:'Lora',Georgia,serif;
    font-size:13px;
    line-height:1.6;
  }
  .kb-field input.kb-input, .kb-textarea {
    width:100%;
    background:transparent;
    border:0;
    border-bottom:2px solid #111111;
    padding:9px 8px;
    color:#111111;
    font-size:12px;
    outline:none;
  }
  .kb-field input.kb-input { font-family:'JetBrains Mono','Courier New',monospace; }
  .kb-textarea { min-height:92px; resize:vertical; font-family:'Lora',Georgia,serif; line-height:1.55; }
  .kb-field input.kb-input::placeholder, .kb-textarea::placeholder { color:#737373; }
  .kb-field input.kb-input:focus, .kb-textarea:focus { background:#F0F0F0; }
  .kb-file-upload-row { display:flex; align-items:center; gap:8px; margin-bottom:2px; }
  .kb-file-input { position:absolute; width:0; height:0; opacity:0; pointer-events:none; }
  .kb-upload-file-btn, .kb-upload-btn, .kb-refresh-btn {
    min-height:44px;
    padding:9px 12px;
    background:#F9F9F7;
    border:1px solid #111111;
    color:#111111;
    font-family:'Inter','Helvetica Neue',sans-serif;
    font-size:11px;
    font-weight:800;
    letter-spacing:1px;
    text-transform:uppercase;
    cursor:pointer;
    transition:all .2s ease-out;
  }
  .kb-upload-file-btn:hover:not(:disabled), .kb-upload-btn:hover:not(:disabled), .kb-refresh-btn:hover { background:#111111; color:#F9F9F7; }
  .kb-upload-file-btn:disabled, .kb-upload-btn:disabled { opacity:.45; cursor:not-allowed; }
  .kb-divider {
    margin:2px 0;
    color:#737373;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1px;
    text-align:center;
    text-transform:uppercase;
  }
  .kb-actions { display:flex; gap:8px; align-items:center; }
  .kb-upload-btn { flex:1; background:#111111; color:#F9F9F7; }
  .kb-upload-btn:hover:not(:disabled) { background:#F9F9F7; color:#111111; box-shadow:4px 4px 0 0 #111111; transform:translate(-2px,-2px); }
  .kb-msg {
    margin:0;
    padding:8px 10px;
    border:1px solid #111111;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    line-height:1.5;
  }
  .kb-msg.error { border-color:#CC0000; color:#CC0000; }
  .kb-docs-section { border-top:1px solid #111111; padding-top:10px; }
  .kb-docs-label {
    margin:0 0 8px;
    color:#525252;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    letter-spacing:1.2px;
    text-transform:uppercase;
  }
  .kb-docs-empty {
    margin:0;
    color:#737373;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
  }
  .kb-doc-list { display:flex; flex-direction:column; gap:0; border-left:1px solid #111111; border-top:1px solid #111111; }
  .kb-doc-item {
    display:flex;
    align-items:center;
    gap:8px;
    padding:8px 10px;
    border-right:1px solid #111111;
    border-bottom:1px solid #111111;
  }
  .kb-doc-icon {
    width:18px;
    height:18px;
    border:1px solid #111111;
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:9px;
    flex-shrink:0;
  }
  .kb-doc-name {
    flex:1;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:11px;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
  }
  .kb-doc-count, .kb-badge {
    border:1px solid #111111;
    padding:2px 6px;
    color:#111111;
    font-family:'JetBrains Mono','Courier New',monospace;
    font-size:10px;
    flex-shrink:0;
  }
  .kb-saved-dot {
    width:9px;
    height:9px;
    background:#CC0000;
    border:1px solid #F9F9F7;
    flex-shrink:0;
  }

  @media (max-width: 900px) {
    .dash-header { grid-template-columns:auto 1fr; padding:12px 16px; }
    .dash-edition { display:none; }
    .dash-body { flex-direction:column; overflow:auto; }
    .dash-sidebar { width:100%; border-right:0; border-bottom:1px solid #111111; flex-direction:row; overflow-x:auto; }
    .dash-sidebar-label, .dash-nav-divider { display:none; }
    .dash-nav-item { min-width:max-content; border-right:1px solid #111111; border-bottom:0; }
    .dash-content { padding:22px 16px 44px; overflow:visible; }
    .dash-page-header { grid-template-columns:1fr; gap:12px; }
    .dash-page-header p { border-left:0; border-top:1px solid #111111; padding:12px 0 0; }
    .dash-grid { grid-template-columns:1fr; }
    .dash-row { flex-direction:column; gap:0; }
  }

  @media (max-width: 560px) {
    .dash-header { gap:10px; }
    .dash-header-text h1 { font-size:24px; }
    .dash-header-right { gap:6px; }
    .dash-btn-ghost { padding:8px 10px; font-size:10px; }
    .dash-page-header h2 { font-size:46px; letter-spacing:-2px; }
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
        .replace(/`(.*?)`/g, '<code style="background:#E5E5E0;border:1px solid #111111;padding:1px 5px;font-size:12px;">$1</code>')
        .replace(/^#{3}\s(.+)$/gm, '<h3 style="font-family:Playfair Display,serif;font-size:20px;font-weight:900;color:#111111;margin:12px 0 5px;">$1</h3>')
        .replace(/^#{2}\s(.+)$/gm, '<h2 style="font-family:Playfair Display,serif;font-size:24px;font-weight:900;color:#111111;margin:14px 0 6px;">$1</h2>')
        .replace(/^#{1}\s(.+)$/gm, '<h2 style="font-family:Playfair Display,serif;font-size:28px;font-weight:900;color:#111111;margin:14px 0 6px;">$1</h2>')
        .replace(/^[-*]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;"><span style="color:#CC0000;flex-shrink:0;">-</span><span>$1</span></div>')
        .replace(/\[(HOOK|PROBLEM|SOLUTION|TRACTION|ASK)\]/g,
            '<span style="display:inline-block;padding:1px 8px;background:#F9F9F7;border:1px solid #111111;color:#111111;font-family:JetBrains Mono,monospace;font-size:10px;font-weight:700;margin:0 2px;text-transform:uppercase;">$1</span>');
    out = out.replace(/https?:\/\/[^\s<>"')\]]+/g, (url) => {
        const safe = escapeHtmlUrl(url);
        const isDrawio = /diagrams\.net|draw\.io/i.test(url);
        const label = isDrawio ? "View drawing" : "Open link";
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer" class="chat-msg-link">${label}</a>`;
    });
    return out.replace(/\n/g, "<br/>");
}
