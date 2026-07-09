/**
 * authClient.js
 * -------------
 * Replaces the old Supabase-session bootstrap. Pitchmate now issues its own
 * JWTs (see backend/auth/router.py), so the client just persists
 * { access_token, user_id, email } in localStorage and reads it back on
 * page load — no external auth provider or session listener needed.
 */

const STORAGE_KEY = "pitchmate_auth";

/** Read the stored auth payload, or null if signed out / never signed in. */
export function getStoredAuth() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** Persist the auth payload returned by /auth/signup or /auth/login. */
export function setStoredAuth({ access_token, user_id, email }) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ access_token, user_id, email }));
}

/** Clear the stored auth payload (sign out). */
export function clearStoredAuth() {
    localStorage.removeItem(STORAGE_KEY);
}
