"""Auth tests: register, login (cookie set), logout (cookie cleared),
JWT valid/invalid, /me protected."""


def test_register_sets_cookie_and_returns_user(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "alice@example.com", "password": "supersecret1", "name": "Alice"},
    )
    assert resp.status_code == 201
    assert resp.json()["user"]["email"] == "alice@example.com"
    assert "access_token" in resp.cookies


def test_register_duplicate_email_rejected(client):
    payload = {"email": "bob@example.com", "password": "supersecret1", "name": "Bob"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 400


def test_login_sets_cookie(client):
    client.post(
        "/api/auth/register",
        json={"email": "carol@example.com", "password": "supersecret1", "name": "Carol"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "carol@example.com", "password": "supersecret1"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.cookies


def test_login_wrong_password_rejected(client):
    client.post(
        "/api/auth/register",
        json={"email": "dave@example.com", "password": "supersecret1", "name": "Dave"},
    )
    resp = client.post(
        "/api/auth/login", json={"email": "dave@example.com", "password": "wrongpass"}
    )
    assert resp.status_code == 401


def test_me_requires_cookie(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user_with_valid_cookie(client):
    client.post(
        "/api/auth/register",
        json={"email": "erin@example.com", "password": "supersecret1", "name": "Erin"},
    )
    resp = client.get("/api/auth/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "erin@example.com"


def test_me_rejects_invalid_token(client):
    client.cookies.set("access_token", "not-a-real-jwt")
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_logout_clears_cookie(client):
    client.post(
        "/api/auth/register",
        json={"email": "frank@example.com", "password": "supersecret1", "name": "Frank"},
    )
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}

    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 401
