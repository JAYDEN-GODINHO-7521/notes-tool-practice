"""Flashcard tests: generate (mocked LLM), list, delete, ownership isolation,
due-cards lookup, and review submission. FSRS scheduling *math* itself
(difficulty/interval behavior) is covered in test_fsrs_service.py — these
tests just check the HTTP layer wires up correctly.
"""


def _register(client, email="cardmaker@example.com"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret1", "name": "Card Maker"},
    )


def _create_note(client, title="Photosynthesis"):
    resp = client.post(
        "/api/notes",
        json={
            "title": title,
            "content": "Plants convert sunlight into energy.",
        },
    )
    return resp.json()["id"]


def test_generate_flashcards_requires_auth(client):
    resp = client.post("/api/notes/00000000-0000-0000-0000-000000000000/flashcards/generate")
    assert resp.status_code == 401


def test_generate_flashcards_creates_cards(client, mock_llm):
    _register(client)
    note_id = _create_note(client)

    resp = client.post(f"/api/notes/{note_id}/flashcards/generate")
    assert resp.status_code == 200
    body = resp.json()
    assert body["created"] == 2
    fronts = {c["front"] for c in body["flashcards"]}
    assert fronts == {"What is 2+2?", "Capital of France?"}
    # variants preserved from the mocked LLM response
    card = next(c for c in body["flashcards"] if c["front"] == "What is 2+2?")
    assert card["front_variants"] == ["2 plus 2 equals?"]


def test_list_note_flashcards(client, mock_llm):
    _register(client)
    note_id = _create_note(client)
    client.post(f"/api/notes/{note_id}/flashcards/generate")

    resp = client.get(f"/api/notes/{note_id}/flashcards")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_generate_for_missing_note_returns_404(client, mock_llm):
    _register(client)
    resp = client.post(
        "/api/notes/00000000-0000-0000-0000-000000000000/flashcards/generate"
    )
    assert resp.status_code == 404


def test_delete_flashcard(client, mock_llm):
    _register(client)
    note_id = _create_note(client)
    cards = client.post(f"/api/notes/{note_id}/flashcards/generate").json()["flashcards"]
    card_id = cards[0]["id"]

    delete_resp = client.delete(f"/api/flashcards/{card_id}")
    assert delete_resp.status_code == 204

    remaining = client.get(f"/api/notes/{note_id}/flashcards").json()
    assert len(remaining) == 1


def test_user_cannot_generate_for_other_users_note(client, mock_llm):
    _register(client, email="userA2@example.com")
    note_id = _create_note(client)
    client.post("/api/auth/logout")

    _register(client, email="userB2@example.com")
    resp = client.post(f"/api/notes/{note_id}/flashcards/generate")
    assert resp.status_code == 404


def test_due_flashcards_requires_auth(client):
    resp = client.get("/api/flashcards/due")
    assert resp.status_code == 401


def test_new_flashcards_are_immediately_due(client, mock_llm):
    # FSRS cards are due immediately on creation, before any review.
    _register(client)
    note_id = _create_note(client)
    client.post(f"/api/notes/{note_id}/flashcards/generate")

    resp = client.get("/api/flashcards/due")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_review_flashcard_updates_state(client, mock_llm):
    _register(client)
    note_id = _create_note(client)
    card_id = client.post(f"/api/notes/{note_id}/flashcards/generate").json()["flashcards"][0]["id"]

    resp = client.post(f"/api/flashcards/{card_id}/review", json={"rating": 3})
    assert resp.status_code == 200
    body = resp.json()
    assert body["reps"] == 1
    assert body["state"] in (1, 2, 3)  # 1=Learning, 2=Review, 3=Relearning (no "New" in py-fsrs 4.x)
    # due date should be freshly recalculated (updated_at-style behavior:
    # not the same instant the card was created)
    assert body["due"] is not None


def test_review_rejects_invalid_rating(client, mock_llm):
    _register(client)
    note_id = _create_note(client)
    card_id = client.post(f"/api/notes/{note_id}/flashcards/generate").json()["flashcards"][0]["id"]

    resp = client.post(f"/api/flashcards/{card_id}/review", json={"rating": 5})
    assert resp.status_code == 422


def test_review_for_other_users_card_returns_404(client, mock_llm):
    _register(client, email="userA3@example.com")
    note_id = _create_note(client)
    card_id = client.post(f"/api/notes/{note_id}/flashcards/generate").json()["flashcards"][0]["id"]
    client.post("/api/auth/logout")

    _register(client, email="userB3@example.com")
    resp = client.post(f"/api/flashcards/{card_id}/review", json={"rating": 3})
    assert resp.status_code == 404


def test_generation_prioritizes_highlighted_spans(client, monkeypatch):
    """The LLM prompt should call out highlighted_spans as passages to
    prioritize — this doesn't use the shared mock_llm fixture since it
    needs to *inspect* the prompt sent to generate_json, not just return
    a canned response."""
    captured = {}

    async def fake_generate_json(system: str, user_prompt: str) -> str:
        captured["system"] = system
        captured["user_prompt"] = user_prompt
        return '{"cards": [{"front": "What is the powerhouse of the cell?", "back": "Mitochondria", "variants": []}]}'

    monkeypatch.setattr("app.services.llm_service.generate_json", fake_generate_json)

    _register(client)
    note_resp = client.post(
        "/api/notes",
        json={
            "title": "Cell Biology",
            "content": "Mitochondria is the powerhouse of the cell. It produces ATP via respiration.",
            "highlighted_spans": ["Mitochondria is the powerhouse of the cell."],
        },
    )
    assert note_resp.json()["highlighted_spans"] == ["Mitochondria is the powerhouse of the cell."]
    note_id = note_resp.json()["id"]

    resp = client.post(f"/api/notes/{note_id}/flashcards/generate")
    assert resp.status_code == 200
    assert resp.json()["created"] == 1

    assert "Mitochondria is the powerhouse of the cell." in captured["user_prompt"]
    assert "prioritize" in captured["user_prompt"].lower()
    # The rest of the note content should still be sent too — highlighting
    # narrows priority, it doesn't exclude the rest of the note.
    assert "It produces ATP via respiration." in captured["user_prompt"]


def test_generation_ignores_stale_highlighted_spans(client, db_session, monkeypatch):
    """flashcard_service.py's own defensive re-check against stale
    highlighted_spans should hold even independent of routers/notes.py's
    cleaning — exercised here by writing a stale span directly to the DB,
    bypassing the API/router entirely."""
    import uuid
    from app.models.note import Note

    captured = {}

    async def fake_generate_json(system: str, user_prompt: str) -> str:
        captured["user_prompt"] = user_prompt
        return '{"cards": [{"front": "Q", "back": "A", "variants": []}]}'

    monkeypatch.setattr("app.services.llm_service.generate_json", fake_generate_json)

    _register(client)
    note_id = client.post(
        "/api/notes",
        json={"title": "Note", "content": "Original sentence about frogs."},
    ).json()["id"]

    note = db_session.get(Note, uuid.UUID(note_id))
    note.highlighted_spans = ["this text was never in the note"]
    db_session.commit()

    resp = client.post(f"/api/notes/{note_id}/flashcards/generate")
    assert resp.status_code == 200
    assert "this text was never in the note" not in captured["user_prompt"]
