import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PitchMateAuth from "./PitchMateAuth.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import MarketPage from "./pages/MarketPage.jsx";
import CompetitionPage from "./pages/CompetitionPage.jsx";
import GTMPage from "./pages/GTMPage.jsx";
import InvestorsPage from "./pages/InvestorsPage.jsx";
import ValuationPage from "./pages/ValuationPage.jsx";
import DeckPage from "./pages/DeckPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import { getStoredAuth } from "./authClient";

function authUserFromStorage() {
    const auth = getStoredAuth();
    return auth ? { id: auth.user_id, email: auth.email } : null;
}

function App() {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        // Pitchmate issues its own JWT (see authClient.js), so no async session
        // fetch or listener needed, just read what's in localStorage.
        setUser(authUserFromStorage());
        setInitializing(false);
    }, []);

    if (initializing) {
        return (
            <div style={{
                minHeight: "100vh", background: "#F5F7FA",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Inter', system-ui, sans-serif", color: "#64748B",
                fontSize: 14,
            }}>
                Loading Pitchmate…
            </div>
        );
    }

    if (!user) return <PitchMateAuth onAuthenticated={() => setUser(authUserFromStorage())} />;

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<DashboardLayout user={user} />}>
                    <Route index element={<HomePage />} />
                    <Route path="onboarding" element={<OnboardingPage />} />
                    <Route path="market" element={<MarketPage />} />
                    <Route path="competition" element={<CompetitionPage />} />
                    <Route path="gtm" element={<GTMPage />} />
                    <Route path="investors" element={<InvestorsPage />} />
                    <Route path="valuation" element={<ValuationPage />} />
                    <Route path="deck" element={<DeckPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
