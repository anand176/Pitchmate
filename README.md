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

<img width="1904" height="857" alt="image" src="https://github.com/user-attachments/assets/c123ad9a-32c9-43b2-a9d4-e487a4177201" />




