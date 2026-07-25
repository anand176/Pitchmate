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
 * @param {string|null} agentName - Talk to one specialist directly instead of the auto-routing root agent
 * @returns {{ response: string, session_id: string }}
 */
export async function apiPitchmate(query, sessionId = null, agentName = null) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/agents/pitchmate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, session_id: sessionId, agent_name: agentName || null }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data?.detail || `Agent request failed (${res.status})`);
    return data; // { status, response, session_id }
}

/** Root agent + every specialist sub-agent currently available, for the chat's agent picker. */
export async function apiGetAvailableAgents() {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/agents/available`, { headers });
    const data = await res.json().catch(() => ([]));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data; // [{ name, label, description }]
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

// ─── Startup Profile ─────────────────────────────────────────────────────────

/** Fetch the current user's startup profile (empty defaults if none). */
export async function apiGetProfile() {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/startup/profile`, { method: "GET", headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Profile fetch failed (${res.status})`);
    return data;
}

/** Upsert startup profile fields (partial update). */
export async function apiUpdateProfile(fields) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/startup/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Profile save failed (${res.status})`);
    return data;
}

/** Pitch-readiness / lifecycle progress + next action. */
export async function apiGetReadiness() {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/startup/readiness`, { method: "GET", headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Readiness fetch failed (${res.status})`);
    return data;
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

/** Read an investor meeting's signal + next steps. @returns MeetingDebriefResult */
export function apiDashboardDebrief({ investor_name, investor_type, meeting_notes, ask }) {
    return _postDashboard("debrief", { investor_name, investor_type, meeting_notes, ask });
}

/** Turn raw unit economics into an investor financial narrative. @returns FinanceResult */
export function apiDashboardFinance(fields) {
    return _postDashboard("finance", fields);
}

/** Frame raw early traction into a momentum narrative. @returns TractionResult */
export function apiDashboardTraction({ metrics, customer_quotes, milestones, stage }) {
    return _postDashboard("traction", { metrics, customer_quotes, milestones, stage });
}

/**
 * Fetch the current user's saved analyses (latest per module), so feature pages
 * can restore prior results and pre-fill their forms on return.
 * @returns {{ results: Record<string, { module, inputs, result, updated_at }>, completed_modules: string[] }}
 */
export async function apiGetAnalyses() {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/dashboard/results`, { method: "GET", headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Results fetch failed (${res.status})`);
    return data;
}

// ─── Fundraise Pipeline (investor CRM) ───────────────────────────────────────

async function _pipelineFetch(path, options = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/pipeline/${path}`, { ...options, headers });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Get (or create) the user's active fundraise round + investors + funnel counts. */
export function apiGetPipelineSummary() {
    return _pipelineFetch("summary");
}

/** Update the active fundraise round (name, target/committed amount, stage, status). */
export function apiUpdateRound(fields) {
    return _pipelineFetch("round", { method: "PUT", body: JSON.stringify(fields) });
}

/** Add an investor contact to the pipeline. */
export function apiCreateInvestor(fields) {
    return _pipelineFetch("investors", { method: "POST", body: JSON.stringify(fields) });
}

/** Update an investor contact (e.g. move pipeline_stage, set warmth/next_action). */
export function apiUpdateInvestor(id, fields) {
    return _pipelineFetch(`investors/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(fields) });
}

/** Remove an investor contact from the pipeline. */
export function apiDeleteInvestor(id) {
    return _pipelineFetch(`investors/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Integrations (Notion / Google OAuth) ────────────────────────────────────

async function _integrationsFetch(path, options = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/integrations/${path}`, { ...options, headers });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Connection status for Notion + Google (configured / connected / account label). */
export function apiGetIntegrationsStatus() {
    return _integrationsFetch("status");
}

/** Get the OAuth authorize URL for a provider ("notion" | "google") — navigate the browser to it. */
export function apiGetConnectUrl(provider) {
    return _integrationsFetch(`${provider}/connect`);
}

/** Disconnect a provider, deleting its stored credential. */
export function apiDisconnectIntegration(provider) {
    return _integrationsFetch(provider, { method: "DELETE" });
}

/** Set the Notion parent page (URL or ID) the pipeline database will be created under. */
export function apiUpdateNotionSettings(notionParentPageId) {
    return _integrationsFetch("notion/settings", {
        method: "PUT",
        body: JSON.stringify({ notion_parent_page_id: notionParentPageId }),
    });
}

/** Push all pipeline investors into the (auto-created) Notion database. @returns { created, updated, database_url } */
export function apiSyncPipelineToNotion() {
    return _integrationsFetch("notion/sync-pipeline", { method: "POST" });
}

/** Create a Google Calendar follow-up event for an investor. @returns { event_id, html_link } */
export function apiScheduleFollowup({ investor_id, when, duration_minutes = 30, notes }) {
    return _integrationsFetch("google/schedule-followup", {
        method: "POST",
        body: JSON.stringify({ investor_id, when, duration_minutes, notes }),
    });
}

/** List recent Google Drive files (e.g. to link a data room / deck). @returns { files: [...] } */
export function apiListDriveFiles(query = "") {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    return _integrationsFetch(`google/drive/files${qs}`);
}

// ─── Team (lightweight cofounder sharing) ────────────────────────────────────

async function _teamFetch(path, options = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/team/${path}`, { ...options, headers });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Everyone sharing your team_id (StartupProfile/pipeline/roadmap/runway are all shared with them). */
export function apiGetTeamMembers() {
    return _teamFetch("members");
}

/** Create a shareable invite link ("invite a cofounder"). @returns { token, invite_url, expires_at } */
export function apiCreateTeamInvite() {
    return _teamFetch("invites", { method: "POST" });
}

/** Preview an invite before accepting (who invited you, how many members already on the team). */
export function apiPreviewTeamInvite(token) {
    return _teamFetch(`invites/${encodeURIComponent(token)}`);
}

/** Accept an invite — switches your workspace to the inviter's team. @returns { joined, team } */
export function apiAcceptTeamInvite(token) {
    return _teamFetch("invites/accept", { method: "POST", body: JSON.stringify({ token }) });
}

// ─── Roadmap (team-shared kanban board) ──────────────────────────────────────

async function _roadmapFetch(path, options = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/roadmap/${path}`, { ...options, headers });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Column keys/labels (dynamic quarters) + valid statuses/categories. */
export function apiGetRoadmapColumns() {
    return _roadmapFetch("columns");
}

/** All roadmap cards for the team. */
export function apiListRoadmapItems() {
    return _roadmapFetch("items");
}

/** Create a roadmap card. */
export function apiCreateRoadmapItem(fields) {
    return _roadmapFetch("items", { method: "POST", body: JSON.stringify(fields) });
}

/** AI-suggest roadmap cards from startup context — returns suggestions only, nothing is saved yet. */
export function apiGenerateRoadmapItems(focus = "", count = 6) {
    return _roadmapFetch("generate", { method: "POST", body: JSON.stringify({ focus: focus || null, count }) });
}

/** Edit a roadmap card's title/description/category/status. */
export function apiUpdateRoadmapItem(id, fields) {
    return _roadmapFetch(`items/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(fields) });
}

/** Drag-and-drop: move a card to a new quarter column + position. */
export function apiMoveRoadmapItem(id, quarter, position) {
    return _roadmapFetch(`items/${encodeURIComponent(id)}/move`, {
        method: "PUT",
        body: JSON.stringify({ quarter, position }),
    });
}

/** Remove a roadmap card. */
export function apiDeleteRoadmapItem(id) {
    return _roadmapFetch(`items/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Runway (live cash-in-bank tracker) ──────────────────────────────────────

async function _runwayFetch(path, options = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/runway/${path}`, { ...options, headers });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Live-computed latest cash, derived monthly burn, and runway (months). */
export function apiGetRunwaySummary() {
    return _runwayFetch("summary");
}

/** Cash-in-bank history, most recent first. */
export function apiListCashSnapshots() {
    return _runwayFetch("snapshots");
}

/** Log a new cash balance reading. */
export function apiCreateCashSnapshot({ cash_in_bank, recorded_at, note }) {
    return _runwayFetch("snapshots", { method: "POST", body: JSON.stringify({ cash_in_bank, recorded_at, note }) });
}

/** Remove a logged cash balance reading. */
export function apiDeleteCashSnapshot(id) {
    return _runwayFetch(`snapshots/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ─── Simulator (call-practice Q&A roleplay) ──────────────────────────────────

async function _simulatorFetch(path, options = {}) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/simulator/${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`);
    return data;
}

/** Available personas + whether ElevenLabs voice is configured server-side. */
export function apiGetSimulatorScenarios() {
    return _simulatorFetch("scenarios");
}

/** Start a fresh practice call — returns the persona's opening line. */
export function apiStartSimulator(scenarioId, customPersona = null) {
    return _simulatorFetch("start", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId, custom_persona: customPersona || null }),
    });
}

/** Submit the founder's answer for scoring + the persona's next line (or call_over + debrief). */
export function apiSimulatorTurn(scenarioId, transcript, answer, customPersona = null) {
    return _simulatorFetch("turn", {
        method: "POST",
        body: JSON.stringify({ scenario_id: scenarioId, custom_persona: customPersona || null, transcript, answer }),
    });
}

/** Past practice sessions for the team (score history). */
export function apiGetSimulatorHistory() {
    return _simulatorFetch("history");
}

/**
 * Text -> spoken audio (ElevenLabs, proxied server-side) as a playable blob URL.
 * Caller is responsible for revoking the URL (URL.revokeObjectURL) when done.
 * Throws if voice isn't configured (503) — callers should catch and fall back to text-only.
 */
export async function apiSimulatorSpeak(text) {
    const headers = await authHeaders();
    const res = await fetch(`${BACKEND}/simulator/speak`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `Voice request failed (${res.status})`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
}

