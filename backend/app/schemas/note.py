"""Note request/response schemas."""
import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.label import LabelOut


class NoteCreate(BaseModel):
    title: str = ""
    content: dict[str, Any] = {}
    color: str = "default"
    pinned: bool = False
    archived: bool = False
    label_ids: list[uuid.UUID] = []


class NoteUpdate(BaseModel):
    title: str | None = None
    content: dict[str, Any] | None = None
    color: str | None = None
    pinned: bool | None = None
    archived: bool | None = None
    label_ids: list[uuid.UUID] | None = None  # None = don't touch labels; [] = clear all


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: dict[str, Any]
    color: str
    pinned: bool
    archived: bool
    position: float
    labels: list[LabelOut]
    created_at: datetime
    updated_at: datetime


class ReorderRequest(BaseModel):
    note_ids: list[uuid.UUID]  
