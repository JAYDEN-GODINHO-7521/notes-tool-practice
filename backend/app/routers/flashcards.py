"""Flashcards router: generate cards from a note, list a note's cards, delete
a card. Mounted twice in main.py — once under /api/notes (nested, per-note
routes) and once under /api/flashcards (flat, per-card routes) — see main.py.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.flashcard import Flashcard
from app.models.note import Note
from app.models.user import User
from app.schemas.flashcard import FlashcardGenerateResponse, FlashcardOut, ReviewRequest
from app.services import fsrs_service
from app.services.flashcard_service import generate_flashcards_for_note

router = APIRouter()


def _get_owned_note(note_id: uuid.UUID, db: Session, current_user: User) -> Note:
    note = db.get(Note, note_id)
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    return note


@router.post("/notes/{note_id}/flashcards/generate", response_model=FlashcardGenerateResponse)
async def generate_flashcards(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = _get_owned_note(note_id, db, current_user)
    cards = await generate_flashcards_for_note(note, db)
    return {"created": len(cards), "flashcards": cards}


@router.get("/notes/{note_id}/flashcards", response_model=list[FlashcardOut])
def list_note_flashcards(
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_owned_note(note_id, db, current_user)  # ownership check
    stmt = select(Flashcard).where(Flashcard.note_id == note_id).order_by(Flashcard.created_at)
    return db.execute(stmt).scalars().all()


@router.get("/flashcards/due", response_model=list[FlashcardOut])
def get_due_flashcards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Placed before /flashcards/{flashcard_id} so "due" is never matched
    as a UUID path param."""
    return fsrs_service.get_due_flashcards(current_user.id, db)


@router.delete("/flashcards/{flashcard_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_flashcard(
    flashcard_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.get(Flashcard, flashcard_id)
    if not card or card.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
    db.delete(card)
    db.commit()
    return None


def _get_owned_flashcard(flashcard_id: uuid.UUID, db: Session, current_user: User) -> Flashcard:
    card = db.get(Flashcard, flashcard_id)
    if not card or card.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found")
    return card


@router.post("/flashcards/{flashcard_id}/review", response_model=FlashcardOut)
def review_flashcard(
    flashcard_id: uuid.UUID,
    payload: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = _get_owned_flashcard(flashcard_id, db, current_user)
    return fsrs_service.review_flashcard(card, payload.rating, db, payload.review_duration_ms)
