"""Drag-to-reorder tests: new notes append at the end, reorder persists,
and reordering is scoped per-user."""


def _register(client, email="reorderer@example.com"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret1", "name": "Reorderer"},
    )


def test_new_notes_get_increasing_position(client):
    _register(client)
    first = client.post("/api/notes", json={"title": "First"}).json()
    second = client.post("/api/notes", json={"title": "Second"}).json()
    assert second["position"] > first["position"]


def test_reorder_persists(client):
    _register(client)
    a = client.post("/api/notes", json={"title": "A"}).json()["id"]
    b = client.post("/api/notes", json={"title": "B"}).json()["id"]
    c = client.post("/api/notes", json={"title": "C"}).json()["id"]

    # Default order should be creation order: A, B, C
    listed = [n["title"] for n in client.get("/api/notes").json()]
    assert listed == ["A", "B", "C"]

    # Reorder to C, A, B
    resp = client.post("/api/notes/reorder", json={"note_ids": [c, a, b]})
    assert resp.status_code == 204

    reordered = [n["title"] for n in client.get("/api/notes").json()]
    assert reordered == ["C", "A", "B"]


def test_reorder_requires_auth(client):
    resp = client.post("/api/notes/reorder", json={"note_ids": []})
    assert resp.status_code == 401


def test_reorder_rejects_notes_you_dont_own(client):
    _register(client, email="ownerX@example.com")
    note_id = client.post("/api/notes", json={"title": "Mine"}).json()["id"]
    client.post("/api/auth/logout")

    _register(client, email="ownerY@example.com")
    resp = client.post("/api/notes/reorder", json={"note_ids": [note_id]})
    assert resp.status_code == 404
