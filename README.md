#  Pitchmate — AI Pitch Co-pilot

> An AI-powered pitch deck assistant for startup founders. Review your deck, validate your market, craft your GTM strategy, and reach the right investors — all in one place.

---

##  Features

| Agent | Capability |
|-------|-----------|
| **Market Agent** | TAM/SAM/SOM validation, competition assessment, GTM strategy, ICP, channels & pricing |
| **Investor Outreacher** | Investor type matching + personalized cold email drafts |
| **Knowledge Base** | Upload docs (PDF/DOCX or paste) → semantic search; **reviews & analyses pitch decks** |
| **Browse MCP** | Web search + **news** for market data, competitors, industry trends |
| **Draw.io Agent** | Diagrams, flowcharts, org charts, Mermaid, business model canvas, GTM funnel |
| **Pitch Writer** | Elevator pitch (30–60 sec) + one-page executive summary (PDF) |
| **Due Diligence** | Anticipates investor questions, red flags, Q&A prep → **downloadable Q&A PDF** |
| **Deck Creator** |  hPitch deck / product report as **PDF or DOCX** (Problem, Solution, Market, Product, Traction, GTM, Competition) |
| **Figma Design (MCP)** | Visual design review of Figma deck files — layout, hierarchy, typography, slide-level feedback |

---

##  Architecture

```
frontend/          ← React + Vite (auth + dashboard UI)
backend/
  app.py           ← FastAPI entry point
  auth/            ← Self-hosted auth (JWT signup/login) against the users table
  db/              ← SQLAlchemy engine/session + User model (Postgres)
  agents/          ← Pitchmate orchestrator + sub-agents (LangGraph)
  knowledge_base/  ← Pinecone upload + retrieval
  core/            ← security (hashing/JWT), config
```

**Stack:** FastAPI · LangChain-LangGraph (Gemini 2.5 Flash) · Postgres (self-hosted auth + chat session persistence) · Pinecone (knowledge base) · React · Vite

> **🔐 Auth Note:** Signup/login/logout are fully self-hosted (SQLAlchemy + Postgres + JWT) — no external auth or database provider. Pinecone is used only for the knowledge base's vector search.

> **📢 Migration Note:** This project has been migrated from Google ADK to LangChain-LangGraph (June 2026). See:
> - `backend/MIGRATION_SUMMARY.md` - Quick overview
> - `backend/MIGRATION_GUIDE.md` - Detailed technical guide  
> - All functionality remains the same, but the underlying agent framework is now LangChain-LangGraph.

---

##  How the Google ADK agent flow works

When a user types a query, the following happens:

1. **Frontend**  
   The chat UI sends a `POST` to `/agents/pitchmate` with `{ query, session_id }` and Pitchmate's own JWT (issued by `/auth/login`/`/auth/signup`, stored in `localStorage`) in the `Authorization` header (`apiPitchmate` in `pitchmateApi.js`).

2. **Backend entry**  
   The FastAPI route in `agents/backend.py`:
   - Authenticates the user (`get_current_user`).
   - Loads **startup context** for this chat session from the in-memory session store (`get_session_context(session_id)`).
   - Builds an **enriched query**: it prepends the startup context (e.g. “Share Your Idea” and any uploaded doc summary) to the user message so the agents see full context.

3. **Runner and session**  
   `handle_agent_request` in `agents/agent_runner.py`:
   - Gets or creates an ADK **session** for this user and `session_id` (in-memory or DB if `DATABASE_URL` is set).
   - Gets the cached **Runner** for the app and the root agent (`pitchmate_agent`). The Runner is wired to an ADK `App` that uses session, memory, and artifact services and plugins (logging, retry, context filter, file artifacts, etc.).

4. **Orchestrator run**  
   `_run_agent` turns the enriched query into a `Content(role="user", parts=[text])` and calls `runner.run_async(user_id, session_id, new_message)`.  
   The **root agent** is `pitchmate_agent` (in `agents/agent.py`). It uses:
   - **PlanReActPlanner** — the LLM repeatedly decides the next step: either **answer the user** or **call a tool**.
   - **Tools** — each “tool” is an `AgentTool(agent=…)` wrapping a **sub-agent** (Market, Investor Outreacher, Knowledge Base, Browse MCP, Draw.io, Pitch Writer, Due Diligence, Deck Creator, Figma). The orchestrator’s prompt (`agents/prompt.py`) describes when to use which sub-agent.

5. **Sub-agent execution**  
   When the planner chooses a tool, ADK **invokes that sub-agent**. The sub-agent has its own instruction, model, and tools (e.g. Knowledge Base calls `search_knowledge_base`, Market calls `validate_market_size`, Pitch Writer calls `create_executive_summary_pdf`). It runs to completion and returns a **tool result** (e.g. text, or “PDF created. Download: filename”) back to the orchestrator.

6. **Loop and final answer**  
   The orchestrator receives the tool result, may call another sub-agent or decide it has enough to answer. It keeps planning until it produces a **final response** to the user. The Runner streams events; when `event.is_final_response()` is true, the backend reads the response text, strips internal markers (e.g. `REASONING` / `FINAL_ANSWER`) and sub-agent lead-in phrases, and returns that string.

7. **Response to client**  
   The route returns `{ status, response, session_id }`. The frontend appends the assistant message to the chat and shows it; if the response mentions a filename (e.g. for PDF/DOCX), the UI shows a **Download** button that hits `/agents/artifacts/download/{filename}`.

**In short:**  
User query → auth + session context enrichment → ADK Runner runs the **orchestrator** (PlanReAct) → orchestrator calls **sub-agents** as tools → sub-agents use their own tools (APIs, DB, MCP, file generation) and return results → orchestrator synthesizes a final answer → backend cleans and returns it → frontend displays it and any download links.

### First function and call order (backend)

| Order | Function | File | What it does | What it uses |
|-------|----------|------|--------------|--------------|
| 1 | `pitchmate()` | `agents/backend.py` | FastAPI route: auth, load session context, build enriched query, call `handle_agent_request`. | **Uses:** `req` (query, session_id), `get_current_user` (auth), `get_session_context(session_id)`, `_build_enriched_query()`, `handle_agent_request()`, `pitchmate_agent`. **Returns:** `PitchmateResponse(response, session_id)`. |
| 2 | `handle_agent_request()` | `agents/agent_runner.py` | Get/create ADK session, get Runner, call `_run_agent`, return (response, session_id). | **Uses:** `user_id`, `query`, `agent` (pitchmate_agent), `app_name`, `session_id`; calls `_get_or_create_session()`, `get_runner()`, `_run_agent()`. **Returns:** `(response, session.id)`. |
| 3 | `_get_or_create_session()` | `agents/agent_runner.py` | Resolve or create session for (app_name, user_id, session_id). | **Uses:** `get_session_service()` (DB or in-memory); `session_service.get_session()` or `session_service.create_session()` with `uuid.uuid4()` if new. **Returns:** ADK `Session` object. |
| 4 | `get_runner()` | `agents/agent_runner.py` | Return cached Runner for (app_name, agent); creates App + Runner if missing. | **Uses:** `app_name`, `agent`; `_runner_cache`; `App(root_agent, plugins)`, `get_session_service()`, `get_memory_service()`, `get_artifact_service()`. **Plugins:** LoggingPlugin, ReflectAndRetryToolPlugin, ContextFilterPlugin, SaveFilesAsArtifactsPlugin, MultimodalToolResultsPlugin. **Returns:** `Runner`. |
| 5 | `_run_agent()` | `agents/agent_runner.py` | Build user `Content`, stream `runner.run_async()`, on final event extract/clean text and return. | **Uses:** `runner`, `user_id`, `session_id`, `query`; `types.Content(role="user", parts=[text])`; `runner.run_async()`; `event.is_final_response()`, `event.content.parts`; regex to strip `REASONING`/`FINAL_ANSWER` and agent lead-in. **Returns:** final response string. |
| 6 | `runner.run_async()` | ADK | Runs the root agent (orchestrator); planner may invoke tools (sub-agents). | **Uses:** Runner’s `app` (root_agent = pitchmate_agent), `session_service`, `memory_service`, `artifact_service`; streams events; orchestrator uses PlanReActPlanner and AgentTools (sub-agents). **Returns:** async stream of events; final event carries the assistant reply. |

When the orchestrator picks a **tool**, ADK runs that sub-agent. The sub-agent’s planner may then call its own tools (the functions below).

### Function called for each tool (sub-agent)

Each row is one **tool** the orchestrator can call. When that tool runs, the **agent** executes first; the agent may then call one or more of its **tools** (Python functions or MCP).

| Tool (sub-agent) | Agent entry | Tools the agent can call |
|------------------|-------------|---------------------------|
| **Market Agent** | `market_validator_agent` | `validate_market_size`, `assess_competition`, `suggest_gtm_strategy`, `identify_customer_segments` |
| **Investor Outreacher** | `investor_outreacher_agent` | `draft_outreach_email`, `suggest_investor_types` |
| **Knowledge Base** | `knowledge_base_agent` | `search_knowledge_base`, `list_uploaded_documents` |
| **Web Search** | `web_search_agent` | `web_search`, `web_search_news` |
| **Draw.io** | `drawio_agent` | MCP toolset (`npx @drawio/mcp`) — diagram tools provided by the MCP server |
| **Pitch Writer** | `pitch_writer_agent` | `create_executive_summary_pdf`, `save_elevator_pitch` |
| **Due Diligence** | `due_diligence_agent` | `create_due_diligence_qa_pdf` |
| **Deck Creator** | `deck_creator_agent` | `create_deck_pdf`, `create_deck_docx` |
| **Figma Design** | `figma_mcp_agent` | MCP toolset (`npx @figma/mcp`) — Figma design tools from the MCP server |

Tool implementations: `agents/sub_agents/<name>/tools.py` (or MCP in `agent.py` for Draw.io and Figma).

### How does the root agent call another agent? Is `_run_agent` called again?

**No.** `_run_agent()` is only called **once** per request, with the **root agent** (`pitchmate_agent`). Sub-agents are **not** run by calling `_run_agent` again.

What happens instead:

1. Our code calls `runner.run_async(user_id, session_id, new_message)` once. The Runner’s app has `root_agent=pitchmate_agent` and that agent’s **tools** are `AgentTool(agent=market_validator_agent)`, `AgentTool(agent=knowledge_base_agent)`, etc.

2. Inside that single `run_async()` call, the **ADK** runs the root agent. The root agent uses **PlanReActPlanner**: the LLM repeatedly either produces text or chooses a **tool** to call.

3. When the LLM chooses a tool that is an **AgentTool(agent=sub_agent)** (e.g. `market_validator_agent`), the **ADK framework** executes that tool by **running the sub-agent inside the same run**. So:
   - The framework treats the sub-agent as a tool implementation.
   - It runs the sub-agent (with the input the orchestrator passed), using the same Runner/App machinery internally (session, plugins, etc.).
   - The sub-agent may call its own tools (e.g. `validate_market_size`, `search_knowledge_base`). When it finishes, its output is returned as the **tool result** to the root agent.

4. The root agent receives that tool result and continues: it can call another tool (another sub-agent) or produce the final user-facing response.

So the whole chain (orchestrator → sub-agent A → sub-agent A’s tools → result back to orchestrator → maybe sub-agent B → … → final answer) happens **inside the same `runner.run_async()` stream**. Our `_run_agent()` is not invoked again for sub-agents; only the ADK’s internal execution path runs them when the root agent calls an `AgentTool(agent=...)`.

**In that stream, at each step the agent can either call another agent (tool) or produce the final response** — the planner keeps going until the agent outputs the user-facing answer.

### Where is the first agent’s result stored before the root calls the second agent?

The result from the first sub-agent is stored in the **ADK session’s conversation history** (the same session passed to `runner.run_async()`).

What happens step by step:

1. Root agent decides to call **Agent A** (e.g. market_validator_agent). The Runner runs that sub-agent and gets its output.
2. That output is recorded in the **session** as the **tool result** for that tool call (part of the session’s message/event sequence).
3. When the root agent continues, the **planner gets the conversation context** for the next step. That context includes the previous tool call and **its result** (Agent A’s response). So the LLM “sees” what Agent A returned.
4. The root can then call **Agent B** (or more tools) or produce the final response, using that context.

So “data from the first agent” lives in the **session’s conversation history** as the tool result. The Runner uses `session_service` (in-memory or DB) to load/save that session. **ContextFilterPlugin(num_invocations_to_keep=15)** limits how much history is sent to the model (last 15 invocations) so the context stays within token limits while still including recent tool results.

---

## ⚡ Quick Start

### 1. Clone
```bash
git clone git@github.com:anand176/Pitchmate.git
cd Pitchmate
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

You'll also need a local Postgres database for user accounts (and, optionally, persistent chat sessions) — either run one yourself or just use `docker compose up db` (see below) to start only the database container.

Create `backend/.env`:
```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=pitchmate
GEMINI_API_KEY=your-gemini-api-key
PITCHMATE_MODEL=llm-model-name

# Self-hosted auth (SQLAlchemy + Postgres) — required
DATABASE_URL=postgresql://pitchmate:pitchmate@localhost:5432/pitchmate
JWT_SECRET_KEY=replace-with-a-random-secret   # generate: python -c "import secrets; print(secrets.token_urlsafe(32))"

# Notion + Google integrations (Settings → Integrations) — optional, only needed
# for the "Sync to Notion" / "Schedule follow-up" / Drive actions on the Pipeline tab.
FRONTEND_URL=http://localhost:5173
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
NOTION_REDIRECT_URI=http://localhost:8000/integrations/notion/callback
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/integrations/google/callback

# ElevenLabs voice for the Call Practice / Q&A simulator — optional. Without
# it the simulator still works fully in text; these just add spoken audio for
# the persona's side of the call.
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
```

> `PINECONE_API_KEY`/`PINECONE_INDEX` are only used by the knowledge base. If the index doesn't exist yet, the backend auto-creates a serverless one (dimension 384, cosine) on startup.
> Notion/Google credentials come from your own OAuth apps — a "public integration" at [notion.so/my-integrations](https://www.notion.so/my-integrations) and an OAuth 2.0 Client ID (Web application) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with the Calendar and Drive APIs enabled. Leave them blank to keep those buttons disabled.
> `ELEVENLABS_API_KEY` comes from [elevenlabs.io](https://elevenlabs.io) → Profile → API keys; `ELEVENLABS_VOICE_ID` is the ID of any voice in your Voice Library (Voices tab → the voice's "..." menu → Copy Voice ID). Leave both blank to keep the simulator text-only.

```bash
uvicorn app:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env` (optional — only needed if the backend isn't on `http://localhost:8000`):
```env
VITE_BACKEND_URL=http://localhost:8000
```

```bash
npm run dev
# → http://localhost:5173

```

### Or: run everything with Docker Compose

Docker Compose provides its own Postgres `db` service automatically, so you don't need one running locally. Once `backend/.env` and `frontend/.env` exist (steps above — `DATABASE_URL` in `backend/.env` is ignored and overridden to point at the `db` service, but `JWT_SECRET_KEY` must still be set), start everything with live reload:

```bash
docker compose up --build
# → backend:  http://localhost:8000  (docs at /docs)
# → frontend: http://localhost:5173
# → db:       postgres://pitchmate:pitchmate@localhost:5432/pitchmate
# → mlflow:   http://localhost:5000  (agent/LLM experiment tracking)
```

### MLflow observability (optional)

When running via Docker Compose, MLflow is enabled automatically. Open **http://localhost:5000** to inspect runs.

Tracked automatically:
- **Chat agent** (`/agents/pitchmate`) — latency, LLM/tool call counts, sub-agent tool names, response length
- **Dashboard tabs** (`/dashboard/*`) — endpoint, model, prompt length, structured LLM attempts
- **Knowledge base** — upload chunk counts; RAG search result counts/scores during chat

Env vars (add to `backend/.env` for local non-Docker runs):

```env
MLFLOW_ENABLED=true
MLFLOW_TRACKING_URI=file:./mlruns          # or http://localhost:5000 with the mlflow service
MLFLOW_EXPERIMENT_NAME=pitchmate-agents
MLFLOW_LOG_INPUTS=false                    # set true to log truncated prompts/responses
```

##  Screenshots

### 1. Login Page

<img width="1904" height="861" alt="image" src="https://github.com/user-attachments/assets/32fbf44c-af29-484c-9d94-60e0e058541f" />

### 2. Chat UI

<img width="1901" height="854" alt="image" src="https://github.com/user-attachments/assets/4b55648c-131f-4ff4-b49e-7fe35320c939" />

### 3. Chat Example

<img width="1904" height="857" alt="image" src="https://github.com/user-attachments/assets/c123ad9a-32c9-43b2-a9d4-e487a4177201" />



#  Pitchmate — AI Pitch Co-pilot

> An AI-powered pitch deck assistant for startup founders. Review your deck, validate your market, craft your GTM strategy, and reach the right investors — all in one place.

---

##  Features

| Agent | Capability |
|-------|-----------|
| **Market Agent** | TAM/SAM/SOM validation, competition assessment, GTM strategy, ICP, channels & pricing |
| **Investor Outreacher** | Investor type matching + personalized cold email drafts |
| **Knowledge Base** | Upload docs (PDF/DOCX or paste) → semantic search; **reviews & analyses pitch decks** |
| **Browse MCP** | Web search + **news** for market data, competitors, industry trends |
| **Draw.io Agent** | Diagrams, flowcharts, org charts, Mermaid, business model canvas, GTM funnel |
| **Pitch Writer** | Elevator pitch (30–60 sec) + one-page executive summary (PDF) |
| **Due Diligence** | Anticipates investor questions, red flags, Q&A prep → **downloadable Q&A PDF** |
| **Deck Creator** | Pitch deck / product report as **PDF or DOCX** (Problem, Solution, Market, Product, Traction, GTM, Competition) |
| **Figma Design (MCP)** | Visual design review of Figma deck files — layout, hierarchy, typography, slide-level feedback |

---

##  Architecture

```
frontend/          ← React + Vite (auth + chat UI)
backend/
  app.py           ← FastAPI entry point
  auth/            ← Supabase Auth (JWT signup/login)
  agents/          ← Pitchmate orchestrator + sub-agents (Google ADK)
  knowledge_base/  ← pgvector upload + retrieval
  core/            ← Supabase client + config
```

**Stack:** FastAPI · Google ADK (Gemini 2.5 Flash) · Supabase Auth · Supabase pgvector · React · Vite

---

## ⚡ Quick Start

### 1. Clone
```bash
git clone git@github.com:anand176/Pitchmate.git
cd Pitchmate
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
PITCHMATE_MODEL=llm-model-name
```

```bash
uvicorn app:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm run dev
# → http://localhost:5173

```

##  Screenshots

### 1. Login Page

<img width="1898" height="867" alt="image" src="https://github.com/user-attachments/assets/998f43ac-ffe4-4809-9954-c447628a0ddb" />

### 2. Chat UI

<img width="1902" height="856" alt="image" src="https://github.com/user-attachments/assets/17bcfda4-0f1f-45c7-96d9-37c39581e963" />

### 3. Chat Example

<img width="1919" height="863" alt="image" src="https://github.com/user-attachments/assets/cb705387-61da-49b5-ac87-e11c69c9d455" />





