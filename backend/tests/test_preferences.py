"""Notes-view preference tests."""


def _register(client, email="prefs@example.com"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret1", "name": "Prefs"},
    )


def test_default_view_is_grid(client):
    _register(client)
    assert client.get("/api/auth/me").json()["notes_view"] == "grid"


def test_update_view_preference(client):
    _register(client)
    resp = client.patch("/api/auth/me/preferences", json={"notes_view": "list"})
    assert resp.status_code == 200
    assert resp.json()["notes_view"] == "list"

    # Persists across subsequent requests
    assert client.get("/api/auth/me").json()["notes_view"] == "list"


def test_invalid_view_preference_rejected(client):
    _register(client)
    resp = client.patch("/api/auth/me/preferences", json={"notes_view": "kanban"})
    assert resp.status_code == 422
