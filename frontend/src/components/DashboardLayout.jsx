import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { apiLogout, apiGetProfile } from "../pitchmateApi";
import { DASHBOARD_STYLES } from "../theme";
import ChatPanel from "./ChatPanel";
import {
    HomeIcon, TrendingUpIcon, UsersIcon, TargetIcon, HandshakeIcon,
    CoinsIcon, FileTextIcon, SettingsIcon, LogOutIcon, MessageCircleIcon, LogoMark,
} from "../icons";

const NAV_ITEMS = [
    { to: "/", icon: HomeIcon, label: "Home", end: true },
    { to: "/market", icon: TrendingUpIcon, label: "Market" },
    { to: "/competition", icon: UsersIcon, label: "Competition" },
    { to: "/gtm", icon: TargetIcon, label: "GTM Strategy" },
    { to: "/investors", icon: HandshakeIcon, label: "Investors" },
    { to: "/valuation", icon: CoinsIcon, label: "Valuation" },
    { to: "/deck", icon: FileTextIcon, label: "Deck" },
];

/**
 * DashboardLayout - top header + left nav sidebar + routed tab content.
 * Soft-gates first-time users to /onboarding until core profile fields exist
 * (unless they already dismissed / completed the wizard).
 */
export default function DashboardLayout({ user }) {
    const location = useLocation();
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [nudgeSent, setNudgeSent] = useState(false);

    const refreshProfile = useCallback(async () => {
        try {
            const p = await apiGetProfile();
            setProfile(p);
            return p;
        } catch {
            setProfile(null);
            return null;
        } finally {
            setProfileLoaded(true);
        }
    }, []);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    // System nudge once profile is complete and chat is empty
    useEffect(() => {
        if (!profileLoaded || nudgeSent || messages.length > 0) return;
        if (profile?.profile_complete) {
            const company = profile.company_name || "your startup";
            setMessages([{
                role: "assistant",
                content:
                    `Profile loaded for **${company}**. Ask me to validate market or draft your deck.`,
                isSystem: true,
            }]);
            setNudgeSent(true);
        }
    }, [profileLoaded, profile, messages.length, nudgeSent]);

    const userInitial = (user?.email || "U")[0].toUpperCase();

    const handleSignOut = async () => {
        await apiLogout();
        window.location.href = "/";
    };

    const editionDate = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date());

    const onOnboarding = location.pathname.startsWith("/onboarding");
    const needsOnboarding =
        profileLoaded &&
        !!profile &&
        !profile.profile_complete &&
        !profile.wizard_completed &&
        !profile.onboarding_dismissed;

    if (!profileLoaded) {
        return (
            <div className="dash-app">
                <style>{DASHBOARD_STYLES}</style>
                <div className="dash-loading" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="dash-spinner" /> Loading profile...
                </div>
            </div>
        );
    }

    if (needsOnboarding && !onOnboarding) {
        return <Navigate to="/onboarding" replace />;
    }

    return (
        <div className="dash-app">
            <style>{DASHBOARD_STYLES}</style>

            <header className="dash-header">
                <div className="dash-logo-mark"><LogoMark size={20} /></div>
                <div className="dash-header-text">
                    <h1>Pitchmate</h1>
                    <p>AI pitch co-pilot</p>
                </div>
                <div className="dash-header-right">
                    <div className="dash-edition">{editionDate}</div>
                    <div className="dash-user-badge">{userInitial}</div>
                    <button className="dash-btn-ghost" onClick={handleSignOut}>
                        <LogOutIcon size={14} />
                        Sign out
                    </button>
                </div>
            </header>

            {profileLoaded && !profile?.profile_complete && !onOnboarding && (
                <div className="dash-soft-banner">
                    Profile incomplete —{" "}
                    <NavLink to="/onboarding">finish setup</NavLink>
                    {" "}for better agent coaching.
                </div>
            )}

            <div className="dash-body">
                {!onOnboarding && (
                    <aside className="dash-sidebar">
                        <div className="dash-sidebar-label">Workspace</div>
                        {NAV_ITEMS.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}
                                >
                                    <span className="dash-nav-icon"><ItemIcon size={18} /></span>
                                    {item.label}
                                </NavLink>
                            );
                        })}
                        <div className="dash-nav-divider" />
                        <NavLink to="/settings" className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}>
                            <span className="dash-nav-icon"><SettingsIcon size={18} /></span>
                            Profile & docs
                        </NavLink>
                    </aside>
                )}

                <main className="dash-content">
                    <Outlet
                        context={{
                            sessionId,
                            setSessionId,
                            profile,
                            refreshProfile,
                            openChat: () => setChatOpen(true),
                        }}
                    />
                </main>
            </div>

            {!chatOpen && !onOnboarding && (
                <button className="chat-fab" onClick={() => setChatOpen(true)} title="Chat with Pitchmate" aria-label="Chat with Pitchmate">
                    <MessageCircleIcon size={24} strokeWidth={1.5} />
                </button>
            )}

            <ChatPanel
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                messages={messages}
                setMessages={setMessages}
                sessionId={sessionId}
                setSessionId={setSessionId}
                profileComplete={!!profile?.profile_complete}
            />
        </div>
    );
}
