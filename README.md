#  Pitchmate — AI Pitch Co-pilot

> An AI-powered pitch deck assistant for startup founders. Review your deck, validate your market, craft your GTM strategy, and reach the right investors — all in one place.

---

##  Features

| Agent | Capability |
|-------|-----------|
| **Deck Reviewer** | Slide-by-slide feedback + overall deck scoring |
| **Market Validator** | Market size validation + competition assessment |
| **Market Strategist** | GTM strategy + customer segments + pricing |
| **Investor Outreacher** | Investor type matching + cold email drafts |
| **Knowledge Base** | Upload your context → semantic search via pgvector |

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

<img width="1904" height="861" alt="image" src="https://github.com/user-attachments/assets/32fbf44c-af29-484c-9d94-60e0e058541f" />

### 2. Chat Interface

<img width="1904" height="857" alt="image" src="https://github.com/user-attachments/assets/c123ad9a-32c9-43b2-a9d4-e487a4177201" />

### 3. Chat Example

<img width="1900" height="862" alt="image" src="https://github.com/user-attachments/assets/5fa43a55-6170-4400-bf8d-99f2a4994c99" />




