"""Shared pytest fixtures: test DB (SQLite in-memory), TestClient, factories, mock LLM."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture()
def db_session():
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="https://testserver") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def mock_llm(monkeypatch):
    """Patch app.services.llm_service.stream_completion with a canned,
    deterministic async generator so tests never call the real OpenAI API."""

    async def fake_stream_completion(system: str, user_prompt: str):
        for chunk in ["Mocked ", "response ", "text."]:
            yield chunk

    monkeypatch.setattr(
        "app.services.llm_service.stream_completion", fake_stream_completion
    )
    return fake_stream_completion
