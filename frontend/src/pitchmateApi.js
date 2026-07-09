/**
 * pitchmateApi.js
 * ---------------
 * All calls to the FastAPI backend (http://localhost:8000 in dev via Vite proxy).
 *
 * Every protected call reads Pitchmate's own JWT (issued by /auth/signup or
 * /auth/login, persisted in localStorage via authClient.js) and attaches it
 * as a Bearer token in the Authorization header.
 */

import { getStoredAuth, setStoredAuth, clearStoredAuth } from "./authClient";

const BACKEND = import.meta.env.VITE_BACKEND_URL || ""; // empty → Vite proxy in dev

async function getToken() {
    return getStoredAuth()?.access_token ?? null;
}

async function authHeaders() {
    const token = await getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Sign up via FastAPI /auth/signup. Persists the returned token so the caller is immediately signed in. */
export async function apiSignup(email, password, fullName = "") {
    const res = await fetch(`${BACKEND}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Signup failed (${res.status})`);
    setStoredAuth(data);
    return data; // { access_token, user_id, email }
}

/** Login via FastAPI /auth/login. Persists the returned token so the caller is immediately signed in. */
export async function apiLogin(email, password) {
    const res = await fetch(`${BACKEND}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Login failed (${res.status})`);
    setStoredAuth(data);
    return data; // { access_token, user_id, email }
}

/** Logout via FastAPI /auth/logout (best-effort — tokens are stateless) and clear the local session. */
export async function apiLogout() {
    try {
        const headers = await authHeaders();
        await fetch(`${BACKEND}/auth/logout`, { method: "POST", headers });
    } catch {
        // best-effort; always clear local state below regardless
    }
    clearStoredAuth();
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

/**
 * Download an artifact file (e.g. due diligence Q&A PDF, executive summary PDF) by filename.
 * Fetches with auth and triggers browser download.
 * @param {string} filename - Filename only (e.g. due_diligence_qa_Company_20250228_123456.pdf)
 * @param {string} [downloadAs] - Optional name for the saved file (defaults to filename)
 */
export async function apiDownloadArtifact(filename, downloadAs = null) {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BACKEND}/agents/artifacts/download/${encodeURIComponent(filename)}`, {
        method: "GET",
        headers,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || `Download failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadAs || filename;
    a.click();
    URL.revokeObjectURL(url);
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
 * Upload a PDF or DOCX file to the knowledge base. Text is extracted server-side and stored.
 * @param {File} file - PDF or DOCX file
 * @param {string} [sourceName] - Optional label (defaults to filename without extension)
 * @returns {{ status: string, chunks_stored: number, source_name: string }}
 */
export async function apiUploadDocumentFile(file, sourceName = null) {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const form = new FormData();
    form.append("file", file);
    if (sourceName) form.append("source_name", sourceName);
    const res = await fetch(`${BACKEND}/knowledge-base/upload-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Upload failed (${res.status})`);
    return data;
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
 * Save startup context from an uploaded PDF or DOCX file for the current chat session.
 * @param {File} file - PDF or DOCX file
 * @param {string|null} sessionId - Current chat session id (optional)
 * @returns {{ context: string, message: string, session_id?: string }}
 */
export async function apiSaveContextFromFile(file, sessionId = null) {
    const token = await getToken();
    if (!token) throw new Error("Not authenticated");
    const form = new FormData();
    form.append("file", file);
    if (sessionId) form.append("session_id", sessionId);
    const res = await fetch(`${BACKEND}/agents/context/upload-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Upload failed (${res.status})`);
    return data;
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

// ─── Dashboard (structured, non-chat) endpoints ──────────────────────────────

async function _postDashboard(path, body) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/dashboard/${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Validate TAM/SAM/SOM claims. @returns MarketSizeResult */
export function apiDashboardMarket({ tam, sam, som, description }) {
    return _postDashboard("market", { tam, sam, som, description });
}

/** Evaluate the competitive landscape. @returns CompetitionResult */
export function apiDashboardCompetition({ competitors, description }) {
    return _postDashboard("competition", { competitors, description });
}

/** Build a phased go-to-market plan. @returns GTMResult */
export function apiDashboardGTM({ product_description, target_market }) {
    return _postDashboard("gtm", { product_description, target_market });
}

/** Suggest investor types/tiers for a stage and industry. @returns InvestorResult */
export function apiDashboardInvestors({ stage, industry }) {
    return _postDashboard("investors", { stage, industry });
}

/** Estimate a pre-money valuation range. @returns ValuationResult */
export function apiDashboardValuation({ stage, sector, arr, growth_rate_yoy, team_strength, traction_strength }) {
    return _postDashboard("valuation", { stage, sector, arr, growth_rate_yoy, team_strength, traction_strength });
}

/** Draft/polish structured pitch deck section copy. @returns DeckResult */
export function apiDashboardDeck(sections) {
    return _postDashboard("deck", sections);
}

/** Generate a PDF/DOCX deck artifact. @returns { filename, download_url } */
export function apiDashboardDeckExport(sections, format = "pdf") {
    return _postDashboard("deck/export", { ...sections, format });
}


