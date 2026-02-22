import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import PitchMateAgent from "./PitchMateAgent.jsx";
import PitchMateAuth from "./PitchMateAuth.jsx";
import { supabase } from "./supabaseClient";

function App() {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        // Get initial session (Supabase client manages JWT storage automatically)
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setInitializing(false);
        });

        // Listen for auth state changes (login / logout / token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (initializing) {
        return (
            <div style={{
                minHeight: "100vh", background: "#0a0a0f",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Syne', sans-serif", color: "rgba(255,255,255,0.3)",
                fontSize: 14,
            }}>
                Loading...
            </div>
        );
    }

    return user ? <PitchMateAgent user={user} /> : <PitchMateAuth />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
