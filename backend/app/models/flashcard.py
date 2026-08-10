"""Flashcard model (FSRS fields).

The canonical FSRS scheduling state lives in `fsrs_card_data` (the FSRS
package's own Card serialized to JSON via Card.to_dict()/from_dict()), so
fsrs_service.py never has to lossily reconstruct a Card from separate
columns. The individual due/state/stability/difficulty columns below are
kept in sync with that JSON after every review, purely so the app can
query/sort/aggregate (due-card lookups, Study Hub charts) without
deserializing JSON on every row.
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
    # Alternate phrasings of `front` from the LLM (does NOT include `front`
    # itself — see display_front below for the combined rotation list).
    front_variants: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    variant_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # FSRS scheduling state — see module docstring.
    fsrs_card_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    stability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    difficulty: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    elapsed_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    scheduled_days: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reps: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lapses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    state: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # 1=Learning,2=Review,3=Relearning
    due: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_review: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    note: Mapped["Note"] = relationship()

    @property
    def display_front(self) -> str:
        """The front phrasing to show this session — rotates through the
        original `front` plus all LLM-generated variants."""
        options = [self.front, *self.front_variants]
        if not options:
            return self.front
        return options[self.variant_index % len(options)]
