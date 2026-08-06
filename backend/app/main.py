"""FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import ai, auth, flashcards, notes, study

app = FastAPI(title="Keep Notes API", version="0.1.0")


# allow_credentials=True is REQUIRED so the browser will send/receive the
# httpOnly "access_token" cookie cross-origin. This only works with an exact
# origin list (never "*") — CORS_ORIGINS in .env must list your real frontend
# origin(s), e.g. http://localhost:5173.
assert "*" not in settings.cors_origin_list, (
    "CORS_ORIGINS cannot include '*' when allow_credentials=True — "
    "the cookie will be silently dropped by the browser."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(flashcards.router, prefix="/api", tags=["flashcards"])
app.include_router(study.router, prefix="/api/study", tags=["study"])


@app.get("/health")
def health():
    return {"status": "ok"}
