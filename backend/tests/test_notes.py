"""Notes tests: CRUD + ownership isolation (user A cannot access user B's notes)."""
import uuid


def _register(client, email="owner@example.com"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret1", "name": "Owner"},
    )


def test_create_and_list_note(client):
    _register(client)
    create_resp = client.post("/api/notes", json={"title": "Hello", "content": "Hello world"})
    assert create_resp.status_code == 201
    note_id = create_resp.json()["id"]

    list_resp = client.get("/api/notes")
    assert list_resp.status_code == 200
    assert any(n["id"] == note_id for n in list_resp.json())


def test_get_update_delete_note(client):
    _register(client)
    note_id = client.post("/api/notes", json={"title": "Draft"}).json()["id"]

    get_resp = client.get(f"/api/notes/{note_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Draft"

    patch_resp = client.patch(f"/api/notes/{note_id}", json={"pinned": True})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["pinned"] is True

    delete_resp = client.delete(f"/api/notes/{note_id}")
    assert delete_resp.status_code == 204

    missing_resp = client.get(f"/api/notes/{note_id}")
    assert missing_resp.status_code == 404


def test_notes_require_auth(client):
    resp = client.get("/api/notes")
    assert resp.status_code == 401


def test_note_not_found_for_random_id(client):
    _register(client)
    resp = client.get(f"/api/notes/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_user_cannot_access_other_users_note(client):
    # User A creates a note
    _register(client, email="userA@example.com")
    note_id = client.post("/api/notes", json={"title": "A's secret"}).json()["id"]
    client.post("/api/auth/logout")

    # User B logs in and tries to access it
    _register(client, email="userB@example.com")
    resp = client.get(f"/api/notes/{note_id}")
    assert resp.status_code == 404


def test_highlighted_spans_kept_when_valid_substring(client):
    _register(client)
    resp = client.post(
        "/api/notes",
        json={
            "title": "Bio notes",
            "content": "Mitochondria is the powerhouse of the cell.",
            "highlighted_spans": ["Mitochondria is the powerhouse of the cell."],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["highlighted_spans"] == ["Mitochondria is the powerhouse of the cell."]


def test_highlighted_spans_dropped_when_not_in_content(client):
    _register(client)
    resp = client.post(
        "/api/notes",
        json={
            "title": "Bio notes",
            "content": "Mitochondria is the powerhouse of the cell.",
            "highlighted_spans": ["This text is not in the note"],
        },
    )
    assert resp.status_code == 201
    assert resp.json()["highlighted_spans"] == []


def test_highlighted_spans_dropped_on_update_when_content_changes(client):
    _register(client)
    note_id = client.post(
        "/api/notes",
        json={
            "title": "Bio notes",
            "content": "Mitochondria is the powerhouse of the cell.",
            "highlighted_spans": ["Mitochondria is the powerhouse of the cell."],
        },
    ).json()["id"]

    # Editing content so the previously-valid span no longer appears
    # verbatim — the stale span should be silently dropped, per the
    # sidecar-metadata staleness policy, not kept or rejected.
    patch_resp = client.patch(
        f"/api/notes/{note_id}",
        json={"content": "Completely different content now."},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["highlighted_spans"] == []


def test_highlighted_spans_updated_directly_still_validated(client):
    _register(client)
    note_id = client.post(
        "/api/notes",
        json={"title": "Bio notes", "content": "Photosynthesis converts light into energy."},
    ).json()["id"]

    patch_resp = client.patch(
        f"/api/notes/{note_id}",
        json={
            "highlighted_spans": [
                "Photosynthesis converts light into energy.",
                "not present in content",
            ]
        },
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["highlighted_spans"] == ["Photosynthesis converts light into energy."]
