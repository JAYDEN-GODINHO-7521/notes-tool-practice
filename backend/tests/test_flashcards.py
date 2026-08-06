"""Flashcard tests: generate (mocked LLM), list, delete, ownership isolation.

FSRS review/scheduling tests land in the flashcards-fsrs follow-up step
(test_fsrs_service.py) once fsrs_service.py is implemented.
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
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {"type": "text", "text": "Plants convert sunlight into energy."}
                        ],
                    }
                ],
            },
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
