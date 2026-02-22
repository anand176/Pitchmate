import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let _client = null;

function getClient() {
    if (_client) return _client;
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn(
            "[Pitchmate] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Running in demo mode."
        );
        // Safe stub so the app renders without crashing
        const noop = () => Promise.resolve({ data: { session: null, user: null }, error: null });
        _client = {
            auth: {
                getSession: noop,
                signUp: noop,
                signInWithPassword: noop,
                signOut: noop,
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
                getUser: noop,
            },
        };
        return _client;
    }
    _client = createClient(supabaseUrl, supabaseAnonKey);
    return _client;
}

export const supabase = getClient();
