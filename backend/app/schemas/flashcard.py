"""Flashcard request/response schemas."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FlashcardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    note_id: uuid.UUID
    front: str
    back: str
    front_variants: list[str]
    variant_index: int
    state: int
    due: datetime
    reps: int
    lapses: int
    created_at: datetime


class FlashcardGenerateResponse(BaseModel):
    created: int
    flashcards: list[FlashcardOut]
