# Keep Notes App

Google Keep-style notes app with a React frontend and a Python FastAPI
backend, connected exclusively via JWT-authenticated REST APIs.

This is the initial monorepo scaffold. See project design for the full
implementation plan. A complete setup guide will be written as part of the
`readme` todo once all features land; for now:

1. `docker compose up -d` — starts PostgreSQL
2. `cd backend && cp .env.example .env && pip install -r requirements.txt`
3. `cd frontend && cp .env.example .env && npm install && npm run dev`
4. `cd backend && pytest -v`

Backend runs at http://localhost:8000 (docs at `/docs`).
Frontend runs at http://localhost:5173.
