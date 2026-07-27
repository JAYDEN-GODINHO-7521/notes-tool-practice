"""AI router: POST /api/ai/generate (SSE) for paraphrase/translate/expand.

TODO(backend-llm): implement SSE streaming via app.services.llm_service.
"""
from fastapi import APIRouter

router = APIRouter()
