"""Study Hub tests: session start (shuffled due cards) and stats aggregation."""


def _register(client, email="student@example.com"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret1", "name": "Student"},
    )


def _create_note_with_cards(client):
    note_id = client.post("/api/notes", json={"title": "Cell Biology"}).json()["id"]
    client.post(f"/api/notes/{note_id}/flashcards/generate")
    return note_id


def test_session_requires_auth(client):
    resp = client.post("/api/study/session")
    assert resp.status_code == 401


def test_session_returns_due_cards(client, mock_llm):
    _register(client)
    _create_note_with_cards(client)

    resp = client.post("/api/study/session")
    assert resp.status_code == 200
    cards = resp.json()["cards"]
    assert len(cards) == 2
    # display_front should be present (server-computed variant rotation)
    assert all("display_front" in c for c in cards)


def test_session_respects_limit(client, mock_llm):
    _register(client)
    _create_note_with_cards(client)

    resp = client.post("/api/study/session?limit=1")
    assert resp.status_code == 200
    assert len(resp.json()["cards"]) == 1


def test_stats_requires_auth(client):
    resp = client.get("/api/study/stats")
    assert resp.status_code == 401


def test_stats_before_any_reviews(client, mock_llm):
    _register(client)
    _create_note_with_cards(client)

    resp = client.get("/api/study/stats")
    assert resp.status_code == 200
    body = resp.json()
    assert body["due_count"] == 2
    assert body["reviewed_today"] == 0
    assert body["streak_days"] == 0
    assert body["retention_rate_7d"] == 0.0


def test_stats_after_a_review(client, mock_llm):
    _register(client)
    _create_note_with_cards(client)
    card_id = client.get("/api/flashcards/due").json()[0]["id"]

    client.post(f"/api/flashcards/{card_id}/review", json={"rating": 3})

    resp = client.get("/api/study/stats")
    body = resp.json()
    assert body["reviewed_today"] == 1
    assert body["streak_days"] == 1
    assert body["retention_rate_7d"] == 100.0  # rated Good = retained
