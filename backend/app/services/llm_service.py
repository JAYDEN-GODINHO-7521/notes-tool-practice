"""LLM client wrapper. Streams chat completion text chunks for the
selection actions (paraphrase/translate/expand) and, later, structured
flashcard generation (flashcards-fsrs todo).

Uses Google's OpenAI-compatibility endpoint via the `openai` SDK, so the
streaming call shape stays identical to a native OpenAI setup — only the
base_url, api_key, and model name differ.
"""
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import settings

_client: AsyncOpenAI | None = None

GOOGLE_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.google_api_key,
            base_url=GOOGLE_OPENAI_BASE_URL,
        )
    return _client


async def stream_completion(system: str, user_prompt: str) -> AsyncGenerator[str, None]:
    """Yields text deltas from a streaming chat completion."""
    stream = await _get_client().chat.completions.create(
        model="gemini-3.5-flash",
        stream=True,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta