# Deploy Pitchmate for Free

This guide covers deploying **frontend** and **backend** on free tiers. Use two services: one for the React app, one for the FastAPI backend.

---

## 1. Backend (FastAPI)

### Option A: Render (recommended, free tier)

1. Push your code to **GitHub**.
2. Go to [render.com](https://render.com) → Sign up (free).
3. **New → Web Service** → Connect your repo.
4. Configure:
   - **Name:** `pitchmate-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. **Environment** (Settings → Environment): add the same vars as in `backend/.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GEMINI_API_KEY` (or `GOOGLE_API_KEY` if your SDK uses that)
   - `PITCHMATE_MODEL` (optional, e.g. `gemini-2.5-flash`)
   - `SERPAPI_API_KEY` (optional, for web/news search)
   - `ARTIFACTS_ROOT_DIR` (optional; default `./artifacts` — on Render use `/tmp/artifacts` if you need writable storage)
6. Deploy. Note the URL, e.g. `https://pitchmate-api.onrender.com`.

**Note:** Free tier sleeps after ~15 min inactivity; first request after sleep can be slow (cold start).

---

### Option B: Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Select repo, set **Root Directory** to `backend`.
3. **Settings → Deploy:** Build command `pip install -r requirements.txt`, Start command `uvicorn app:app --host 0.0.0.0 --port $PORT`.
4. Add the same env vars as above in **Variables**.
5. Deploy and copy the generated public URL.

Railway free tier has a monthly usage limit; good for low traffic.

---

### Option C: Fly.io

1. Install [flyctl](https://fly.io/docs/hands-on/install-flyctl/).
2. From project root:
   ```bash
   cd backend
   fly launch
   ```
   Choose app name, region; do not add a Postgres/Redis when prompted unless you need them.
3. Set secrets (env vars):
   ```bash
   fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_KEY=... GEMINI_API_KEY=...
   ```
4. In `fly.toml` (created in `backend`), ensure:
   - `[http_service]` with internal port `8000`
   - or set `CMD = ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]`
5. Deploy: `fly deploy`.

---

## 2. Frontend (React + Vite)

### Option A: Vercel (recommended)

1. Push code to **GitHub**.
2. Go to [vercel.com](https://vercel.com) → Add New Project → Import your repo.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. **Environment Variables:**
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_BACKEND_URL` = your backend URL (e.g. `https://pitchmate-api.onrender.com`) — **no trailing slash**
5. Deploy. Your app will be at `https://your-app.vercel.app`.

---

### Option B: Netlify

1. [netlify.com](https://netlify.com) → Add new site → Import from Git.
2. **Build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BACKEND_URL`.
4. Deploy.

---

### Option C: Cloudflare Pages

1. Connect repo at [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create project.
2. Build: Root `frontend`, Command `npm run build`, Output `dist`.
3. Add env vars in Settings (including `VITE_BACKEND_URL`).
4. Deploy.

---

## 3. After deployment

- **CORS:** The backend already allows all origins (`allow_origins=["*"]`). For production you can restrict this in `backend/app.py` to your frontend URL.
- **Supabase:** In Supabase Dashboard → Authentication → URL Configuration, add your frontend URL (e.g. `https://your-app.vercel.app`) to **Redirect URLs** and **Site URL** so login works.
- **Artifacts:** On serverless/free backends, `ARTIFACTS_ROOT_DIR` is often ephemeral. Use `/tmp/artifacts` on Render; generated PDFs/DOCX will work but may not persist across restarts. For persistence you’d need object storage (e.g. Supabase Storage).

---

## 4. Quick reference

| Component | Free service   | Env / config |
|----------|----------------|--------------|
| Backend  | Render / Railway / Fly.io | `SUPABASE_*`, `GEMINI_API_KEY`, `SERPAPI_API_KEY` (optional) |
| Frontend | Vercel / Netlify / Cloudflare Pages | `VITE_SUPABASE_*`, `VITE_BACKEND_URL` = backend URL |

Use **Render** for the API and **Vercel** for the frontend to get a full free deployment with minimal setup.
