"""Note request/response schemas.

`content` is now plain markdown text (was TipTap JSON) and `highlighted_spans`
is the sidecar list of "marked for flashcards" substrings — see ADR-001 /
session-summary-markdown-editor-migration.md and app/models/note.py.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.label import LabelOut


class NoteCreate(BaseModel):
    title: str = ""
    content: str = ""
    highlighted_spans: list[str] = []
    color: str = "default"
    pinned: bool = False
    archived: bool = False
    label_ids: list[uuid.UUID] = []


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    highlighted_spans: list[str] | None = None
    color: str | None = None
    pinned: bool | None = None
    archived: bool | None = None
    label_ids: list[uuid.UUID] | None = None  # None = don't touch labels; [] = clear all


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    content: str
    highlighted_spans: list[str]
    color: str
    pinned: bool
    archived: bool
    position: float
    labels: list[LabelOut]
    created_at: datetime
    updated_at: datetime


class ReorderRequest(BaseModel):
    note_ids: list[uuid.UUID]
