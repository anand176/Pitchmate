import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PitchMateAuth from "./PitchMateAuth.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
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
                {/* DashboardLayout owns its own nested, animated <Routes> for the
                    workspace tabs (see components/DashboardLayout.jsx) so page
                    transitions can be animated without remounting the shell
                    (header/sidebar/chat state) on every navigation. */}
                <Route path="/*" element={<DashboardLayout user={user} />} />
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
