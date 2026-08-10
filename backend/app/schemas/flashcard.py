"""Flashcard request/response schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FlashcardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    note_id: uuid.UUID
    front: str
    back: str
    front_variants: list[str]
    variant_index: int
    display_front: str  # front/variant rotated server-side for this session
    state: int
    due: datetime
    stability: float
    difficulty: float
    reps: int
    lapses: int
    created_at: datetime


class FlashcardGenerateResponse(BaseModel):
    created: int
    flashcards: list[FlashcardOut]


class ReviewRequest(BaseModel):
    rating: int = Field(ge=1, le=4)  # 1=Again, 2=Hard, 3=Good, 4=Easy
    review_duration_ms: int | None = None
