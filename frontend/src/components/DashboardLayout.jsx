import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { apiLogout, apiGetProfile } from "../pitchmateApi";
import { DASHBOARD_STYLES } from "../theme";
import ChatPanel from "./ChatPanel";
import { DashboardContext } from "../dashboardContext";
import { motion, AnimatePresence, useReducedMotion, pageVariants, SPRING_SOFT } from "../motion";
import HomePage from "../pages/HomePage.jsx";
import OnboardingPage from "../pages/OnboardingPage.jsx";
import MarketPage from "../pages/MarketPage.jsx";
import CompetitionPage from "../pages/CompetitionPage.jsx";
import GTMPage from "../pages/GTMPage.jsx";
import InvestorsPage from "../pages/InvestorsPage.jsx";
import ValuationPage from "../pages/ValuationPage.jsx";
import DeckPage from "../pages/DeckPage.jsx";
import FinancePage from "../pages/FinancePage.jsx";
import TractionPage from "../pages/TractionPage.jsx";
import MeetingDebriefPage from "../pages/MeetingDebriefPage.jsx";
import PipelinePage from "../pages/PipelinePage.jsx";
import RoadmapPage from "../pages/RoadmapPage.jsx";
import JoinTeamPage from "../pages/JoinTeamPage.jsx";
import SimulatorPage from "../pages/SimulatorPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import {
    HomeIcon, TrendingUpIcon, UsersIcon, TargetIcon, HandshakeIcon,
    CoinsIcon, FileTextIcon, SettingsIcon, LogOutIcon, MessageCircleIcon, LogoMark,
    CheckCircleIcon, RadarIcon, WalletIcon, AwardIcon, FunnelIcon, MapIcon, PhoneIcon,
} from "../icons";

const NAV_ITEMS = [
    { to: "/", icon: HomeIcon, label: "Home", end: true },
    { to: "/market", icon: TrendingUpIcon, label: "Market" },
    { to: "/competition", icon: UsersIcon, label: "Competition" },
    { to: "/traction", icon: AwardIcon, label: "Traction" },
    { to: "/gtm", icon: TargetIcon, label: "GTM Strategy" },
    { to: "/finance", icon: WalletIcon, label: "Financials" },
    { to: "/valuation", icon: CoinsIcon, label: "Valuation" },
    { to: "/investors", icon: HandshakeIcon, label: "Investors" },
    { to: "/pipeline", icon: FunnelIcon, label: "Pipeline" },
    { to: "/roadmap", icon: MapIcon, label: "Roadmap" },
    { to: "/practice", icon: PhoneIcon, label: "Call Practice" },
    { to: "/deck", icon: FileTextIcon, label: "Deck" },
    { to: "/debrief", icon: RadarIcon, label: "Meeting Debrief" },
];

/** Wraps a routed page so it fades+rises in on route change (skipped entirely under reduced motion). */
function AnimatedPage({ children }) {
    const reduce = useReducedMotion();
    if (reduce) return children;
    return (
        <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
            {children}
        </motion.div>
    );
}

/**
 * DashboardLayout - top header + left nav sidebar + routed tab content.
 * Soft-gates first-time users to /onboarding until core profile fields exist
 * (unless they already dismissed / completed the wizard).
 *
 * Owns a nested, location-keyed <Routes> (rather than a plain <Outlet/>) so
 * AnimatePresence can crossfade between pages: on navigation, the outgoing
 * <Routes location=.../> keeps rendering with the OLD location (Framer keeps
 * the previous element instance mounted for the exit animation) while the
 * new one enters. A plain <Outlet/> would immediately re-resolve to the new
 * page on every render, even mid-exit, because it always reads the live
 * router location — this component's own `user`/chat state persists across
 * navigations either way since DashboardLayout itself never remounts.
 */
export default function DashboardLayout({ user }) {
    const location = useLocation();
    const reduceMotion = useReducedMotion();
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessionId, setSessionId] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [nudgeSent, setNudgeSent] = useState(false);
    const [toasts, setToasts] = useState([]);
    const toastId = useRef(0);

    // Lightweight toast for cross-page feedback (e.g. "Market validated · +10%").
    const notify = useCallback((message, { gain } = {}) => {
        const id = ++toastId.current;
        setToasts((prev) => [...prev, { id, message, gain }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4200);
    }, []);

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
                    `Loaded **${company}**. Use the tabs for market, investors, and deck — or ask me here to refine any of them.`,
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
    // /join is exempt too — a freshly-signed-up cofounder accepting an invite
    // shouldn't get bounced to onboarding before joining the team that
    // already has a StartupProfile waiting for them.
    const onJoin = location.pathname.startsWith("/join");
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

    if (needsOnboarding && !onOnboarding && !onJoin) {
        return <Navigate to="/onboarding" replace />;
    }

    const ctxValue = {
        sessionId,
        setSessionId,
        profile,
        refreshProfile,
        notify,
        openChat: () => setChatOpen(true),
    };

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
                    <motion.button
                        className="dash-btn-ghost"
                        onClick={handleSignOut}
                        whileHover={reduceMotion ? undefined : { y: -1 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    >
                        <LogOutIcon size={14} />
                        Sign out
                    </motion.button>
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
                                    {({ isActive }) => (
                                        <>
                                            {isActive && !reduceMotion && (
                                                <motion.span
                                                    className="dash-nav-active-bg"
                                                    layoutId="dash-nav-active-bg"
                                                    transition={SPRING_SOFT}
                                                />
                                            )}
                                            {isActive && reduceMotion && <span className="dash-nav-active-bg" />}
                                            <span className="dash-nav-icon"><ItemIcon size={18} /></span>
                                            {item.label}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                        <div className="dash-nav-divider" />
                        <NavLink to="/settings" className={({ isActive }) => `dash-nav-item ${isActive ? "active" : ""}`}>
                            {({ isActive }) => (
                                <>
                                    {isActive && !reduceMotion && (
                                        <motion.span
                                            className="dash-nav-active-bg"
                                            layoutId="dash-nav-active-bg"
                                            transition={SPRING_SOFT}
                                        />
                                    )}
                                    {isActive && reduceMotion && <span className="dash-nav-active-bg" />}
                                    <span className="dash-nav-icon"><SettingsIcon size={18} /></span>
                                    Profile & docs
                                </>
                            )}
                        </NavLink>
                    </aside>
                )}

                <main className="dash-content">
                    <DashboardContext.Provider value={ctxValue}>
                        <ErrorBoundary resetKey={location.pathname}>
                        <AnimatePresence mode="wait" initial={false}>
                            <Routes location={location} key={location.pathname}>
                                <Route index element={<AnimatedPage><HomePage /></AnimatedPage>} />
                                <Route path="onboarding" element={<AnimatedPage><OnboardingPage /></AnimatedPage>} />
                                <Route path="market" element={<AnimatedPage><MarketPage /></AnimatedPage>} />
                                <Route path="competition" element={<AnimatedPage><CompetitionPage /></AnimatedPage>} />
                                <Route path="gtm" element={<AnimatedPage><GTMPage /></AnimatedPage>} />
                                <Route path="traction" element={<AnimatedPage><TractionPage /></AnimatedPage>} />
                                <Route path="finance" element={<AnimatedPage><FinancePage /></AnimatedPage>} />
                                <Route path="investors" element={<AnimatedPage><InvestorsPage /></AnimatedPage>} />
                                <Route path="valuation" element={<AnimatedPage><ValuationPage /></AnimatedPage>} />
                                <Route path="deck" element={<AnimatedPage><DeckPage /></AnimatedPage>} />
                                <Route path="debrief" element={<AnimatedPage><MeetingDebriefPage /></AnimatedPage>} />
                                <Route path="pipeline" element={<AnimatedPage><PipelinePage /></AnimatedPage>} />
                                <Route path="roadmap" element={<AnimatedPage><RoadmapPage /></AnimatedPage>} />
                                <Route path="practice" element={<AnimatedPage><SimulatorPage /></AnimatedPage>} />
                                <Route path="join" element={<AnimatedPage><JoinTeamPage /></AnimatedPage>} />
                                <Route path="settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </AnimatePresence>
                        </ErrorBoundary>
                    </DashboardContext.Provider>
                </main>
            </div>

            <div className="dash-toast-stack" aria-live="polite">
                <AnimatePresence>
                    {toasts.map((t) => (
                        <motion.div
                            key={t.id}
                            className="dash-toast success"
                            layout={!reduceMotion}
                            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <span className="toast-mark"><CheckCircleIcon size={12} strokeWidth={2.5} /></span>
                            <span>{t.message}</span>
                            {t.gain ? <span className="toast-gain">{t.gain}</span> : null}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {!chatOpen && !onOnboarding && (
                <motion.button
                    className="chat-fab"
                    onClick={() => setChatOpen(true)}
                    title="Chat with Pitchmate"
                    aria-label="Chat with Pitchmate"
                    whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                >
                    <MessageCircleIcon size={24} strokeWidth={1.5} />
                </motion.button>
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
