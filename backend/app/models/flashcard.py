"""Flashcard model (FSRS fields).

FSRS scheduling fields are stored here now but only given sane initial
defaults on creation in this step; the actual FSRS repeat()/scheduling
logic (fsrs_service.py) is implemented in the flashcards-fsrs follow-up step.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    note_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("notes.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )

    front: Mapped[str] = mapped_column(String, nullable=False)
    back: Mapped[str] = mapped_column(String, nullable=False)
    # Alternate phrasings of the front, rotated per session (flashcards-fsrs step)
    front_variants: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    variant_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # FSRS scheduling state
    stability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    elapsed_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    scheduled_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lapses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    state: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0=Learning
    due: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_review: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    note: Mapped["Note"] = relationship()
