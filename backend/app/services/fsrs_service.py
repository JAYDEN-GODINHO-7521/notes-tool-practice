"""FSRS scheduling: wraps the `fsrs` package (py-fsrs) to create/review
flashcards, updating their stored state and logging each review.

Written against py-fsrs's documented Scheduler/Card/Rating/State API
(https://github.com/open-spaced-repetition/py-fsrs, matching the
fsrs==4.1.0 pin in requirements.txt): `Scheduler().review_card(card,
rating, review_datetime=..., review_duration=...)` returns
`(updated_card, review_log)`. This sandbox has no network access to
actually install and run the package, so smoke-test this module against
your real environment before relying on it — in particular, verify
Card.to_dict()/Card.from_dict() round-trip cleanly (used below to avoid a
lossy manual field-by-field reconstruction of Card state).
"""
import random
from datetime import datetime, timezone
from uuid import UUID

from fsrs import Card as FSRSCard
from fsrs import Rating, Scheduler, State
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.models.review_log import ReviewLog

_scheduler = Scheduler()

_RATING_MAP = {1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy}

# Our own explicit mapping, independent of whatever underlying int values
# (if any) the fsrs package's State enum happens to use. Note: py-fsrs 4.x
# only has three states — a freshly created Card() starts directly in
# State.Learning ("new card being studied for the first time"); there is
# no separate State.New in this version of the package.
_STATE_TO_INT = {
    State.Learning: 1,
    State.Review: 2,
    State.Relearning: 3,
}


def new_fsrs_card() -> FSRSCard:
    """A fresh FSRS card, due immediately — used when a flashcard is created."""
    return FSRSCard()


def state_to_int(state: State) -> int:
    return _STATE_TO_INT.get(state, 1)  # 1 = Learning, the only sane fallback


def _sync_flashcard_from_card(flashcard: Flashcard, card: FSRSCard, now: datetime) -> None:
    flashcard.fsrs_card_data = card.to_dict()
    flashcard.due = card.due
    flashcard.stability = card.stability or 0.0
    flashcard.difficulty = card.difficulty or 0.0
    flashcard.state = state_to_int(card.state)
    flashcard.last_review = now


def review_flashcard(
    flashcard: Flashcard,
    rating: int,
    db: Session,
    review_duration_ms: int | None = None,
) -> Flashcard:
    """Runs FSRS review for a 1-4 rating, updates the Flashcard row in
    place, and logs the review to ReviewLog. Commits."""
    if rating not in _RATING_MAP:
        raise ValueError(f"rating must be 1-4, got {rating}")

    now = datetime.now(timezone.utc)

    if flashcard.fsrs_card_data:
        card = FSRSCard.from_dict(flashcard.fsrs_card_data)
    else:
        # Backfill path for any flashcard created before fsrs_card_data
        # existed — starts a fresh FSRS card rather than failing.
        card = new_fsrs_card()

    prior_last_review = flashcard.last_review
    elapsed_days = (now - prior_last_review).days if prior_last_review else 0

    updated_card, _review_log_entry = _scheduler.review_card(
        card,
        _RATING_MAP[rating],
        review_datetime=now,
        review_duration=review_duration_ms,
    )

    scheduled_days = (updated_card.due - now).days if updated_card.due else 0

    _sync_flashcard_from_card(flashcard, updated_card, now)
    flashcard.elapsed_days = max(elapsed_days, 0)
    flashcard.scheduled_days = max(scheduled_days, 0)
    flashcard.reps += 1
    if rating == 1:  # Again — a lapse
        flashcard.lapses += 1
    flashcard.variant_index += 1  # rotate displayed front for next time

    db.add(
        ReviewLog(
            flashcard_id=flashcard.id,
            user_id=flashcard.user_id,
            rating=rating,
            reviewed_at=now,
            elapsed_ms=review_duration_ms or 0,
        )
    )
    db.commit()
    db.refresh(flashcard)
    return flashcard


def get_due_flashcards(user_id: UUID, db: Session) -> list[Flashcard]:
    now = datetime.now(timezone.utc)
    stmt = select(Flashcard).where(Flashcard.user_id == user_id, Flashcard.due <= now)
    return list(db.execute(stmt).scalars().all())


def build_session(user_id: UUID, db: Session, limit: int = 20) -> list[Flashcard]:
    """Due cards, shuffled, capped at `limit`. Each card's `display_front`
    property already reflects its rotated variant (see Flashcard model)."""
    cards = get_due_flashcards(user_id, db)
    random.shuffle(cards)
    return cards[:limit]
