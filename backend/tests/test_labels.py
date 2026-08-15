"""Label tests: CRUD, uniqueness per user, ownership isolation, and
attaching labels to notes."""


def _register(client, email="labeler@example.com"):
    client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret1", "name": "Labeler"},
    )


def test_labels_require_auth(client):
    resp = client.get("/api/labels")
    assert resp.status_code == 401


def test_create_and_list_label(client):
    _register(client)
    create_resp = client.post("/api/labels", json={"name": "Work", "color": "sky"})
    assert create_resp.status_code == 201
    assert create_resp.json()["name"] == "Work"

    list_resp = client.get("/api/labels")
    assert list_resp.status_code == 200
    assert any(l["name"] == "Work" for l in list_resp.json())


def test_duplicate_label_name_rejected(client):
    _register(client)
    client.post("/api/labels", json={"name": "Recipes"})
    resp = client.post("/api/labels", json={"name": "Recipes"})
    assert resp.status_code == 400


def test_update_and_delete_label(client):
    _register(client)
    label_id = client.post("/api/labels", json={"name": "Draft"}).json()["id"]

    patch_resp = client.patch(f"/api/labels/{label_id}", json={"name": "Final", "color": "gold"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["name"] == "Final"

    delete_resp = client.delete(f"/api/labels/{label_id}")
    assert delete_resp.status_code == 204

    remaining = client.get("/api/labels").json()
    assert not any(l["id"] == label_id for l in remaining)


def test_other_user_cannot_access_label(client):
    _register(client, email="ownerA@example.com")
    label_id = client.post("/api/labels", json={"name": "Private"}).json()["id"]
    client.post("/api/auth/logout")

    _register(client, email="ownerB@example.com")
    resp = client.patch(f"/api/labels/{label_id}", json={"name": "Hijacked"})
    assert resp.status_code == 404


def test_create_note_with_labels_and_filter_by_label(client):
    _register(client)
    label_id = client.post("/api/labels", json={"name": "Recipes"}).json()["id"]

    note_resp = client.post("/api/notes", json={"title": "Pasta", "label_ids": [label_id]})
    assert note_resp.status_code == 201
    assert [l["name"] for l in note_resp.json()["labels"]] == ["Recipes"]

    # A note without this label shouldn't show up in the filtered list.
    client.post("/api/notes", json={"title": "Unrelated"})

    filtered = client.get(f"/api/notes?label_id={label_id}").json()
    assert len(filtered) == 1
    assert filtered[0]["title"] == "Pasta"


def test_update_note_replaces_labels(client):
    _register(client)
    label_a = client.post("/api/labels", json={"name": "A"}).json()["id"]
    label_b = client.post("/api/labels", json={"name": "B"}).json()["id"]
    note_id = client.post("/api/notes", json={"title": "Note", "label_ids": [label_a]}).json()["id"]

    patch_resp = client.patch(f"/api/notes/{note_id}", json={"label_ids": [label_b]})
    assert [l["name"] for l in patch_resp.json()["labels"]] == ["B"]

    clear_resp = client.patch(f"/api/notes/{note_id}", json={"label_ids": []})
    assert clear_resp.json()["labels"] == []
