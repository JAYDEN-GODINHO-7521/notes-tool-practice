"""Note request/response schemas."""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NoteCreate(BaseModel):
    title: str = ""
    content: dict[str, Any] = {}
    color: str = "default"
    pinned: bool = False
    archived: bool = False


class NoteUpdate(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    color: str | None = None
    pinned: bool | None = None
    archived: bool | None = None


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: dict[str, Any]
    color: str
    pinned: bool
    archived: bool
    created_at: datetime
    updated_at: datetime
