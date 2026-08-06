"""AI generate endpoint tests: auth, action validation, streamed output
(mocked OpenAI-compatible API via the mock_llm fixture)."""
import json


def _register(client):
    client.post(
        "/api/auth/register",
        json={"email": "ai@example.com", "password": "supersecret1", "name": "AI Tester"},
    )


def _collect_deltas(response) -> str:
    deltas = []
    for line in response.iter_lines():
        if not line or not line.startswith("data: "):
            continue
        payload = json.loads(line[len("data: ") :])
        if "delta" in payload:
            deltas.append(payload["delta"])
    return "".join(deltas)


def test_generate_requires_auth(client):
    resp = client.post("/api/ai/generate", json={"action": "paraphrase", "text": "hello"})
    assert resp.status_code == 401


def test_generate_custom_requires_instruction(client, mock_llm):
    _register(client)
    resp = client.post("/api/ai/generate", json={"action": "custom", "text": "hello"})
    assert resp.status_code == 400


def test_generate_custom_rejects_overlong_instruction(client, mock_llm):
    _register(client)
    resp = client.post(
        "/api/ai/generate",
        json={"action": "custom", "text": "hello", "instruction": "x" * 600},
    )
    assert resp.status_code == 400


def test_generate_rejects_overlong_selection(client, mock_llm):
    _register(client)
    resp = client.post(
        "/api/ai/generate", json={"action": "paraphrase", "text": "x" * 5000}
    )
    assert resp.status_code == 400


def test_generate_streams_paraphrase(client, mock_llm):
    _register(client)
    with client.stream(
        "POST", "/api/ai/generate", json={"action": "paraphrase", "text": "The cat sat."}
    ) as resp:
        assert resp.status_code == 200
        assert _collect_deltas(resp) == "Mocked response text."


def test_generate_streams_custom(client, mock_llm):
    _register(client)
    with client.stream(
        "POST",
        "/api/ai/generate",
        json={
            "action": "custom",
            "text": "The mitochondria is the powerhouse of the cell.",
            "instruction": "Turn this into a rhyming couplet",
        },
    ) as resp:
        assert resp.status_code == 200
        assert _collect_deltas(resp) == "Mocked response text."


def test_generate_rejects_unknown_action(client, mock_llm):
    _register(client)
    resp = client.post(
        "/api/ai/generate", json={"action": "translate", "text": "hello"}
    )
    assert resp.status_code == 422  # no longer a valid action per the Literal type
