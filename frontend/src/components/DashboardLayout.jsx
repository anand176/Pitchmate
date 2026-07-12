import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { apiLogout } from "../pitchmateApi";
import { DASHBOARD_STYLES } from "../theme";
import ChatPanel from "./ChatPanel";

const NAV_ITEMS = [
    { to: "/market", icon: "01", label: "Market" },
    { to: "/competition", icon: "02", label: "Competition" },
    { to: "/gtm", icon: "03", label: "GTM Strategy" },
    { to: "/investors", icon: "04", label: "Investors" },
    { to: "/valuation", icon: "05", label: "Valuation" },
    { to: "/deck", icon: "06", label: "Deck" },
];

/**
 * DashboardLayout - top header + left nav sidebar + routed tab content.
 * Chat lives as a slide-out panel (floating action button, bottom-right),
 * not a full page, so founders can chat while looking at any tab's data.
 */
export default function DashboardLayout({ user }) {
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);

    const userInitial = (user?.email || "U")[0].toUpperCase();

    const handleSignOut = async () => {
        await apiLogout();
        // Simplest way to reset main.jsx's auth state without a dedicated
        // auth context: a full reload re-reads localStorage (now cleared).
        window.location.href = "/";
    };

    const editionDate = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    return (
        <div className="dash-app">
            <style>{DASHBOARD_STYLES}</style>

            <header className="dash-header">
                <div className="dash-logo-mark">P</div>
                <div className="dash-header-text">
                    <h1 className="cyber-glitch">Pitchmate</h1>
                    <p>AI Pitch Co-Pilot // LIVE</p>
                </div>
                <div className="dash-header-right">
                    <div className="dash-edition">NODE.01 | {editionDate} | FOUNDER LINK</div>
                    <div className="dash-user-badge">{userInitial}</div>
                    <button className="dash-btn-ghost" onClick={handleSignOut}>Sign Out</button>
                </div>
            </header>

            <div className="dash-ticker" aria-label="Pitchmate signal ticker">
                <div className="dash-ticker-track">
                    <span><b>SIGNAL</b> Market scan</span>
                    <span>Competition intel</span>
                    <span>GTM uplink</span>
                    <span>Investor match</span>
                    <span>Valuation core</span>
                    <span>Deck forge</span>
                </div>
            </div>

            <div className="dash-body">
                <aside className="dash-sidebar">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}
                        >
                            <span className="dash-nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                    <div className="dash-nav-divider" />
                    <NavLink to="/settings" className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}>
                        <span className="dash-nav-icon">07</span>
                        Settings
                    </NavLink>
                </aside>

                <main className="dash-content">
                    <Outlet context={{ sessionId, setSessionId }} />
                </main>
            </div>

            {!chatOpen && (
                <button className="chat-fab" onClick={() => setChatOpen(true)} title="Chat with Pitchmate" aria-label="Chat with Pitchmate">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                </button>
            )}

            <ChatPanel
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                messages={messages}
                setMessages={setMessages}
                sessionId={sessionId}
                setSessionId={setSessionId}
            />
        </div>
    );
}
