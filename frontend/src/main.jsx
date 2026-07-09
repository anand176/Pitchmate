import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PitchMateAuth from "./PitchMateAuth.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
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
                minHeight: "100vh", background: "#F9F9F7",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: "#111111",
                fontSize: 12, letterSpacing: 1, textTransform: "uppercase",
            }}>
                Loading...
            </div>
        );
    }

    if (!user) return <PitchMateAuth onAuthenticated={() => setUser(authUserFromStorage())} />;

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<DashboardLayout user={user} />}>
                    <Route index element={<Navigate to="/market" replace />} />
                    <Route path="market" element={<MarketPage />} />
                    <Route path="competition" element={<CompetitionPage />} />
                    <Route path="gtm" element={<GTMPage />} />
                    <Route path="investors" element={<InvestorsPage />} />
                    <Route path="valuation" element={<ValuationPage />} />
                    <Route path="deck" element={<DeckPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/market" replace />} />
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
