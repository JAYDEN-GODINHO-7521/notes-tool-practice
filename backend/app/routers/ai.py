"""AI router: POST /api/ai/generate — SSE stream for selection actions
(paraphrase, custom request). Auth via the same cookie as every other
route (no EventSource here since this is a POST with a body; the frontend
uses a fetch-based streaming reader instead — see api/ai.ts)."""
import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.deps import get_current_user
from app.models.user import User
from app.services import llm_service, prompts

router = APIRouter()

MAX_SELECTION_LENGTH = 4000  # characters; guards against pathological requests
MAX_INSTRUCTION_LENGTH = 500


class GenerateRequest(BaseModel):
    action: Literal["paraphrase", "custom"]
    text: str
    instruction: str | None = None  # required when action == "custom"


def _build_prompt(payload: GenerateRequest) -> tuple[str, str]:
    if len(payload.text) > MAX_SELECTION_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Selection too long (max {MAX_SELECTION_LENGTH} characters)",
        )

    if payload.action == "paraphrase":
        return prompts.paraphrase_prompt(payload.text)

    # action == "custom"
    if not payload.instruction or not payload.instruction.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="instruction is required for the custom action",
        )
    if len(payload.instruction) > MAX_INSTRUCTION_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Instruction too long (max {MAX_INSTRUCTION_LENGTH} characters)",
        )
    return prompts.custom_request_prompt(payload.text, payload.instruction)


@router.post("/generate")
async def generate(
    payload: GenerateRequest,
    current_user: User = Depends(get_current_user),  # noqa: ARG001 (auth gate)
):
    system, user_prompt = _build_prompt(payload)

    async def event_stream():
        async for delta in llm_service.stream_completion(system, user_prompt):
            yield f"data: {json.dumps({'delta': delta})}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering, if any
        },
    )
