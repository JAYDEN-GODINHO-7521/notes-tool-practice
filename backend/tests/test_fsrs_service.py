"""FSRS scheduling tests. These exercise the real `fsrs` package (only LLM
calls are mocked elsewhere) — Again raises difficulty relative to Easy,
repeated Good ratings don't shorten the interval, due dates land in the
future, and state/reps update correctly."""
import uuid
from datetime import datetime, timezone

from app.models.flashcard import Flashcard
from app.services.fsrs_service import ensure_aware, new_fsrs_card, review_flashcard, state_to_int


def _fresh_flashcard(db_session, user_id: uuid.UUID, note_id: uuid.UUID) -> Flashcard:
    card = new_fsrs_card()
    flashcard = Flashcard(
        note_id=note_id,
        user_id=user_id,
        front="Test front",
        back="Test back",
        front_variants=[],
        state=state_to_int(card.state),
        due=ensure_aware(card.due),
        fsrs_card_data=card.to_dict(),
    )
    db_session.add(flashcard)
    db_session.commit()
    db_session.refresh(flashcard)
    return flashcard


def _register_and_note(client) -> uuid.UUID:
    client.post(
        "/api/auth/register",
        json={"email": "fsrs@example.com", "password": "supersecret1", "name": "FSRS Tester"},
    )
    note_id = client.post("/api/notes", json={"title": "FSRS note"}).json()["id"]
    return uuid.UUID(note_id)


def _current_user_id(client) -> uuid.UUID:
    return uuid.UUID(client.get("/api/auth/me").json()["id"])


def test_again_raises_difficulty_relative_to_easy(client, db_session):
    note_id = _register_and_note(client)
    user_id = _current_user_id(client)

    again_card = _fresh_flashcard(db_session, user_id, note_id)
    easy_card = _fresh_flashcard(db_session, user_id, note_id)

    review_flashcard(again_card, rating=1, db=db_session)  # Again
    review_flashcard(easy_card, rating=4, db=db_session)  # Easy

    assert again_card.difficulty > easy_card.difficulty


def test_good_does_not_shorten_interval_on_repeat(client, db_session):
    note_id = _register_and_note(client)
    user_id = _current_user_id(client)
    card = _fresh_flashcard(db_session, user_id, note_id)

    review_flashcard(card, rating=3, db=db_session)  # Good
    first_scheduled_days = card.scheduled_days

    review_flashcard(card, rating=3, db=db_session)  # Good again
    second_scheduled_days = card.scheduled_days

    # FSRS default scheduler applies small random "fuzz" to longer
    # intervals, so allow a 1-day tolerance rather than a strict >=.
    assert second_scheduled_days >= first_scheduled_days - 1


def test_due_date_is_in_the_future_after_review(client, db_session):
    note_id = _register_and_note(client)
    user_id = _current_user_id(client)
    card = _fresh_flashcard(db_session, user_id, note_id)

    review_flashcard(card, rating=3, db=db_session)

    # card.due was just read back from the DB via db.refresh() inside
    # review_flashcard() — coerce for the same SQLite-round-trip reason as
    # in fsrs_service.py.
    assert ensure_aware(card.due) >= datetime.now(timezone.utc)


def test_review_increments_reps_and_updates_state(client, db_session):
    note_id = _register_and_note(client)
    user_id = _current_user_id(client)
    card = _fresh_flashcard(db_session, user_id, note_id)

    # A fresh card starts in Learning (1) — py-fsrs has no separate "New"
    # state, unlike some other FSRS implementations.
    assert card.state == 1
    assert card.reps == 0

    review_flashcard(card, rating=3, db=db_session)
    assert card.reps == 1
    assert card.state in (1, 2, 3)  # still a valid state after review


def test_again_rating_increments_lapses(client, db_session):
    note_id = _register_and_note(client)
    user_id = _current_user_id(client)
    card = _fresh_flashcard(db_session, user_id, note_id)

    assert card.lapses == 0
    review_flashcard(card, rating=1, db=db_session)  # Again
    assert card.lapses == 1
