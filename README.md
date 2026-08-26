# Pitchmate — AI Pitch Co-pilot

> An AI-powered pitch deck assistant for startup founders. Review your deck, validate your market, craft your GTM strategy, and reach the right investors — all in one place.

---

## Features

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

## Architecture

```
frontend/          ← React + Vite (auth + dashboard UI, 16 pages)
backend/
  app.py           ← FastAPI entry point
  auth/            ← Self-hosted auth (JWT signup/login) against the users table
  db/              ← SQLAlchemy engine/session + User model (Postgres)
  agents/          ← Pitchmate orchestrator + sub-agents (LangGraph)
  knowledge_base/  ← Pinecone upload + retrieval
  core/            ← security (hashing/JWT), config
landing/           ← Marketing site (React + Vite)
landing-static/    ← Marketing site (plain HTML/CSS/JS, no build step)
landing-pro/       ← Marketing site, alternate design (plain HTML/CSS/JS)
```

**Stack:** FastAPI · LangChain-LangGraph (Gemini 2.5 Flash) · Postgres (self-hosted auth + chat session persistence) · Pinecone (knowledge base) · React · Vite

> **Auth note:** Signup/login/logout are fully self-hosted (SQLAlchemy + Postgres + JWT) — no external auth or database provider. Pinecone is used only for the knowledge base's vector search.

> **Migrated** from Google ADK to LangChain-LangGraph (June 2026) — see `backend/MIGRATION_GUIDE.md`.

---

## How it works

Every agent — the orchestrator and all nine specialists — is the same two-node
LangGraph loop:

```
┌─────────┐  tool_calls?  ┌──────────┐
│  agent  │ ────yes─────▶ │  tools   │
│  (LLM)  │ ◀─────────────│(ToolNode)│
└─────────┘               └──────────┘
     │ no tool_calls
     ▼
    END
```

The `tools → agent` edge is the agentic loop: it cycles until the model answers
without calling a tool. Each specialist is itself one of these loops, wrapped as
a tool the orchestrator can call — so a "tool call" runs a nested loop that
returns its result to the outer one.

Request path: `POST /agents/pitchmate` → auth + startup-context enrichment
(`agents/backend.py`) → `handle_pitchmate_request()` (`agents/agent_runner.py`)
→ compiled graph via `run_agent()` (`agents/langgraph_runner.py`). Conversation
state lives in a LangGraph checkpointer keyed by `thread_id` — `AsyncPostgresSaver`
when `DATABASE_URL` is set, `MemorySaver` otherwise.

**[Full architecture walkthrough →](docs/architecture.md)** — call order, all
nine sub-agents and their tools, agent picker, and how memory works.

---

## Quick Start

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

Needs a local Postgres — run your own, or `docker compose up db` for just the
database container.

Create `backend/.env`:
```env
# Required
GEMINI_API_KEY=your-gemini-api-key
PITCHMATE_MODEL=llm-model-name
DATABASE_URL=postgresql://pitchmate:pitchmate@localhost:5432/pitchmate
JWT_SECRET_KEY=   # python -c "import secrets; print(secrets.token_urlsafe(32))"

# Knowledge base — index is auto-created on startup if missing
PINECONE_API_KEY=
PINECONE_INDEX=pitchmate

# Optional — leave blank to disable the matching feature
FRONTEND_URL=http://localhost:5173
NOTION_CLIENT_ID=          # Pipeline → Sync to Notion
NOTION_CLIENT_SECRET=
GOOGLE_CLIENT_ID=          # Pipeline → follow-ups (Calendar) + Drive
GOOGLE_CLIENT_SECRET=
ELEVENLABS_API_KEY=        # Call Practice voice (text-only without it)
ELEVENLABS_VOICE_ID=
```

> The OAuth integrations also need `NOTION_REDIRECT_URI` and
> `GOOGLE_REDIRECT_URI` pointing at `http://localhost:8000/integrations/<provider>/callback`.

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

### 4. Landing pages (optional)

Three separate marketing sites live alongside the app. None of them are needed
to run Pitchmate itself.

| Folder | Stack | Notes |
|--------|-------|-------|
| `landing/` | React + Vite | Original; `npm install && npm run dev` |
| `landing-static/` | Plain HTML/CSS/JS | No build step. Self-hosted hero video, YouTube demo modal |
| `landing-pro/` | Plain HTML/CSS/JS | No build step. Canvas starfield backdrop, self-hosted demo video, custom player |

The two static sites need only a file server:

```bash
cd landing-static      # or landing-pro
npx serve              # or: python -m http.server 5500
```

> Use `npx serve` rather than `python -m http.server` if you want to **scrub**
> the self-hosted videos — Python's server doesn't support HTTP Range requests,
> so seeking silently fails (playback from the start still works). Every real
> static host (Vercel, Netlify, nginx) supports Range.

Each folder has its own `README.md` with details. Note that `landing-pro/media/`
holds a **75 MB** demo video that is **not** gitignored — see that README before
committing.

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

Enabled automatically under Docker Compose — open **http://localhost:5000** to
inspect runs. Tracks agent latency, LLM/tool call counts, dashboard endpoints
and knowledge-base retrieval scores.

For local non-Docker runs, add to `backend/.env`:

```env
MLFLOW_ENABLED=true
MLFLOW_TRACKING_URI=file:./mlruns
MLFLOW_EXPERIMENT_NAME=pitchmate-agents
MLFLOW_LOG_INPUTS=false    # true logs truncated prompts/responses
```

## Screenshots

**Sign in** — the founder workspace entry point.

![Pitchmate sign-in page](docs/screenshots/01-signin.png)

**Mission control** — pitch readiness, pipeline pulse, key numbers, quick actions.

![Pitchmate dashboard — Mission control](docs/screenshots/02-dashboard.png)

**Ask Pitchmate** — the orchestrator chat, docked over any tab, with the agent picker.

![Ask Pitchmate chat panel](docs/screenshots/03-chat.png)


