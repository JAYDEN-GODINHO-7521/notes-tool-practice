"""Notes router: CRUD for /api/notes, scoped to current_user."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteOut, NoteUpdate

router = APIRouter()


def _get_owned_note(note_id: uuid.UUID, db: Session, current_user: User) -> Note:
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.get("", response_model=list[NoteOut])
def list_notes(
    search: str | None = Query(default=None),
    archived: bool | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Note).where(Note.user_id == current_user.id)
    if archived is not None:
        stmt = stmt.where(Note.archived == archived)
    if search:
        stmt = stmt.where(Note.title.ilike(f"%{search}%"))
    stmt = stmt.order_by(Note.pinned.desc(), Note.updated_at.desc())
    return db.execute(stmt).scalars().all()


@router.post("", response_model=NoteOut, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = Note(user_id=current_user.id, **payload.model_dump())
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
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


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
