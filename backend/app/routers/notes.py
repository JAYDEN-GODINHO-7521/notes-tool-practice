"""Notes router: CRUD for /api/notes, scoped to current_user."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.label import Label
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate, ReorderRequest

router = APIRouter()


def _get_owned_note(note_id: uuid.UUID, db: Session, current_user: User) -> Note:
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


def _get_owned_labels(label_ids: list[uuid.UUID], db: Session, current_user: User) -> list[Label]:
    if not label_ids:
        return []
    labels = db.execute(
        select(Label).where(Label.id.in_(label_ids), Label.user_id == current_user.id)
    ).scalars().all()
    if len(labels) != len(set(label_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more labels not found")
    return list(labels)


@router.get("", response_model=list[NoteOut])
def list_notes(
    search: str | None = Query(default=None),
    archived: bool | None = Query(default=None),
    label_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Note).where(Note.user_id == current_user.id)
    if archived is not None:
        stmt = stmt.where(Note.archived == archived)
    if search:
        stmt = stmt.where(Note.title.ilike(f"%{search}%"))
    if label_id is not None:
        stmt = stmt.where(Note.labels.any(Label.id == label_id))
    # Row-major display order: pinned first, then by position (drag-reorder),
    # ascending — new notes get position = current max + 1, so they land at
    # the end (bottom-right in a left-to-right, top-to-bottom grid).
    stmt = stmt.order_by(Note.pinned.desc(), Note.position.asc())
    return db.execute(stmt).scalars().all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    max_position = db.scalar(
        select(func.max(Note.position)).where(Note.user_id == current_user.id)
    )
    next_position = (max_position or 0.0) + 1.0

    data = payload.model_dump(exclude={"label_ids"})
    note = Note(user_id=current_user.id, position=next_position, **data)
    note.labels = _get_owned_labels(payload.label_ids, db, current_user)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteOut)
def get_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_note(note_id, db, current_user)


@router.patch("/{note_id}", response_model=NoteOut)
def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_owned_note(note_id, db, current_user)
    updates = payload.model_dump(exclude_unset=True, exclude={"label_ids"})
    for field, value in updates.items():
        setattr(note, field, value)

    if payload.label_ids is not None:
        note.labels = _get_owned_labels(payload.label_ids, db, current_user)

    db.commit()
    db.refresh(note)
    return note


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_notes(
    payload: ReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notes = db.execute(
        select(Note).where(Note.id.in_(payload.note_ids), Note.user_id == current_user.id)
    ).scalars().all()
    notes_by_id = {n.id: n for n in notes}

    if len(notes_by_id) != len(set(payload.note_ids)):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more notes not found")

    for index, note_id in enumerate(payload.note_ids):
        notes_by_id[note_id].position = float(index)

    db.commit()
    return None


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_owned_note(note_id, db, current_user)
    db.delete(note)
    db.commit()
    return None
