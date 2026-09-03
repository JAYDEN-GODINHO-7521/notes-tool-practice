# Keep Notes App

Google Keep-style notes app with a React frontend and a Python FastAPI
backend, connected exclusively via JWT-authenticated REST APIs.

This is the initial monorepo scaffold. See project design for the full
implementation plan. A complete setup guide will be written as part of the
`readme` todo once all features land; for now:

# 1. Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
# set real JWT_SECRET and GOOGLE_API_KEY (aistudio.google.com/apikey)
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173

# 4. Tests (no GOOGLE_API_KEY needed — LLM is mocked)
cd backend
pytest -v

# 5. Lint
cd frontend
npm run lint --if-present

Backend runs at http://localhost:8000 (docs at `/docs`).
Frontend runs at http://localhost:5173.
