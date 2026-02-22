/**
 * pitchmateApi.js
 * ---------------
 * All calls to the FastAPI backend (http://localhost:8000 in dev via Vite proxy).
 *
 * Every protected call reads the Supabase JWT from the current session and
 * attaches it as a Bearer token in the Authorization header.
 */

import { supabase } from "./supabaseClient";

const BACKEND = import.meta.env.VITE_BACKEND_URL || ""; // empty → Vite proxy in dev

async function getToken() {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

async function authHeaders() {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Sign up via FastAPI /auth/signup */
export async function apiSignup(email, password, fullName = "") {
    const res = await fetch(`${BACKEND}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Signup failed (${res.status})`);
    return data; // { access_token, user_id, email }
}

/** Login via FastAPI /auth/login */
export async function apiLogin(email, password) {
    const res = await fetch(`${BACKEND}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Login failed (${res.status})`);
    return data; // { access_token, user_id, email }
}

/** Logout via FastAPI /auth/logout */
export async function apiLogout() {
    const headers = await authHeaders();
    await fetch(`${BACKEND}/auth/logout`, { method: "POST", headers });
    await supabase.auth.signOut(); // also clear local Supabase session
}

// ─── Pitchmate Agent ─────────────────────────────────────────────────────────

/**
 * Send a query to the Pitchmate agent.
 * @param {string} query - User's message
 * @param {string|null} sessionId - Existing session for multi-turn conversation
 * @returns {{ response: string, session_id: string }}
 */
export async function apiPitchmate(query, sessionId = null) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/agents/pitchmate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, session_id: sessionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data?.detail || `Agent request failed (${res.status})`);
    return data; // { status, response, session_id }
}

/** Health check */
export async function apiHealth() {
    const res = await fetch(`${BACKEND}/health`);
    return res.ok;
}

// ─── Knowledge Base ───────────────────────────────────────────────────────────

/**
 * Upload a text document to the Supabase pgvector knowledge base.
 * @param {string} text - Full text content to embed and store
 * @param {string} sourceName - Label / filename for this document
 * @returns {{ status: string, chunks_stored: number, source_name: string }}
 */
export async function apiUploadDocument(text, sourceName = "uploaded_doc") {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/knowledge-base/upload`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, source_name: sourceName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data?.detail || `Upload failed (${res.status})`);
    return data; // { status, chunks_stored, source_name }
}

/**
 * List all documents stored in the knowledge base.
 * @returns {{ documents: { file_name: string, count: number }[] }}
 */
export async function apiListDocuments() {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/knowledge-base/documents`, {
        method: "GET",
        headers,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data?.detail || `List failed (${res.status})`);
    return data; // { documents: [...] }
}

// ─── Startup Context (per chat session, not DB) ──────────────────────────────

/**
 * Save startup context for the current chat session.
 * If sessionId is omitted, backend creates a new session and returns its id — use that for subsequent chat.
 * @param {string} context - Startup idea text
 * @param {string|null} sessionId - Current chat session id (optional)
 * @returns {{ context: string, message: string, session_id?: string }}
 */
export async function apiSaveContext(context, sessionId = null) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/agents/context`, {
        method: "POST",
        headers,
        body: JSON.stringify({ context, session_id: sessionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Save failed (${res.status})`);
    return data; // { context, message, session_id? }
}

/**
 * Retrieve startup context for the given chat session.
 * @param {string|null} sessionId - Chat session id (optional); if omitted, returns no context.
 * @returns {{ context: string, message?: string }}
 */
export async function apiGetContext(sessionId = null) {
    const headers = await authHeaders();
    const url = sessionId
        ? `${BACKEND}/agents/context?session_id=${encodeURIComponent(sessionId)}`
        : `${BACKEND}/agents/context`;
    const res = await fetch(url, { method: "GET", headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Get failed (${res.status})`);
    return data; // { context }
}


