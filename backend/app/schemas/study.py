"""Study Hub request/response schemas."""
from datetime import date

from pydantic import BaseModel

from app.schemas.flashcard import FlashcardOut


class StudySessionResponse(BaseModel):
    cards: list[FlashcardOut]


class DailyCount(BaseModel):
    date: date
    count: int


class StudyStatsResponse(BaseModel):
    reviews_per_day: list[DailyCount]
    retention_rate_7d: float
    retention_rate_30d: float
    due_count: int
    reviewed_today: int
    streak_days: int
    avg_difficulty: float
