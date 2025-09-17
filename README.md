# MatouraHire AI – Full Stack Project

Modern full‑stack app for resume enhancement, interview coaching, job discovery, professional footprint analysis and career insights improves .

### Tech Stack
- Frontend: React + Vite + Tailwind + shadcn/ui
- Backend API: NestJS (JWT auth, MongoDB, file uploads, proxies to AI service)
- AI Service: FastAPI (Python) using Ollama via `langchain-ollama` for LLM tasks
- DB: MongoDB (Mongoose)

## Architecture
```
React (Vite)  ───────────────────────────────►  NestJS API (Node)
   │  Auth (JWT in localStorage)                 │ Auth, Users, Profile, Resume, Interviewer,
   │  Calls `VITE_API_BASE_URL`                  │ Job-Matcher, Footprint, Report modules
   │                                             │    └─ Proxies selected routes to Python AI
   ▼                                             ▼
Browser                                        FastAPI (Python AI)
                                                ├─ Resume rewriter (PDF in/out)
                                                ├─ Career report & aggregate report
                                                ├─ AI interviewer (questions/analysis/profile)
                                                ├─ Job search utilities (LinkedIn scraper)
                                                └─ Footprint scanner (GitHub/LinkedIn/StackOverflow)

MongoDB  ◄────────── Mongoose (NestJS)
```

## Repository Structure
```
AiService/            # FastAPI + Ollama-powered AI endpoints (Python)
Backend/              # NestJS API (Node) – JWT auth, MongoDB, proxies to AiService
frontend/             # React + Vite client
requirements.txt      # Python deps for AiService
```

## Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB database (local or Atlas)
- Ollama running locally or remote, with a model available (e.g., `llama3.1`)

## Environment Variables

Create the following files (examples shown). Do not commit secrets.

### Backend (`Backend/.env`)
```
PORT=3000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d
PY_BACKEND_BASE_URL=http://127.0.0.1:8000
```

### Frontend (`frontend/.env`)
```
VITE_API_BASE_URL=http://127.0.0.1:3000
```

### AI Service (`AiService/.env`)
```
OLLAMA_URL=http://127.0.0.1:11434
# Optional tokens used by specific routes
GITHUB_TOKEN=
 RAPIDAPI_KEY=
STACKEXCHANGE_KEY=
```

## Install & Run (Step‑by‑Step)

Run each section in a separate terminal. Windows PowerShell examples are shown; macOS/Linux are the same commands.

### 1) Start the AI Service (FastAPI)
```
cd AiService
python -m venv .venv
.\.venv\Scripts\activate
pip install -r ..\requirements.txt
copy NUL .env  # or create .env and fill as shown above
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Verify: open `http://127.0.0.1:8000/`.

### 2) Start the Backend (NestJS)
```
cd Backend
npm install
copy NUL .env  # add values as shown above
npm run start:dev
```

Verify: server listens on `http://127.0.0.1:3000` (or `PORT`).

### 3) Start the Frontend (React)
```
cd frontend
npm install
copy NUL .env  # add VITE_API_BASE_URL
npm run dev
```

Open the URL printed by Vite (typically `http://127.0.0.1:5173`).

## Key Endpoints

### Backend (NestJS)
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Profile: `GET /profile/me`, `PATCH /profile`, `POST /profile/avatar`
- Resume: proxies to AI for rewriting and PDF generation
- Interviewer: question generation, response analysis (proxies)
- Job Matcher: CV analysis and job search (proxies)
- Footprint & Report: analysis/report endpoints (proxies)

Environment variable `PY_BACKEND_BASE_URL` controls where the backend proxies to the Python AI service.

### AI Service (FastAPI)
- `POST /resume_writer` (upload PDF)
- `POST /resume_writer/pdf` (upload PDF → enhanced PDF)
- `POST /resume_writer/pdf-from-text` (text → PDF)
- `POST /create_report` | `POST /create_report/aggregate`
- `POST /ai_interviewer/generate_questions` | `/analyze_response` | `/generate_profile`
- `POST /job_matcher/analyze_cv` | `POST /job_matcher/search_jobs`
- `POST /footprint_scanner/analyze_github` | `/analyze_linkedin` | `/analyze_stackoverflow`
- `POST /footprint_scanner/comprehensive_analysis` | `/regional_insights` | `/skill_analysis` | `/career_roadmap`

Some AI routes require external API keys (GitHub/StackOverflow/LinkedIn via RapidAPI). Provide them in `AiService/.env` if needed.

## Development Notes
- JWT is stored in `localStorage` by the frontend; axios adds `Authorization` headers automatically when present.
- Avatars are stored inline (base64) for demo simplicity.
- Increase request size limits are configured in NestJS to handle uploads and large payloads.

## Troubleshooting
- LLM not responding: ensure Ollama is running and `OLLAMA_URL` is correct. Pull a model, e.g. `ollama pull llama3.1`.
- 401 from API: token may be missing/expired; log in again.
- Mongo connection issues: verify `MONGO_URI` and network/firewall access.
- CORS: backend uses Nest defaults; the Vite dev server should call `http://127.0.0.1:3000`.

## License
UNLICENSED (internal challenge project). Update as needed for public release.
