"""Generate Flashcard rows from a note via llm_service, with real FSRS
initial state (via fsrs_service.new_fsrs_card(), not a hardcoded placeholder).

Post markdown-editor-migration (ADR-001): Note.content is plain markdown
text, and "highlighted" passages come from the Note.highlighted_spans
sidecar field (set via the editor's "Mark for flashcards" selection-menu
action) rather than being parsed out of inline TipTap markup.
"""
import json

from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.models.note import Note
from app.services import llm_service, prompts
from app.services.fsrs_service import ensure_aware, new_fsrs_card, state_to_int

MAX_CARDS_PER_GENERATION = 8


def _extract_text_and_highlights(note: Note) -> tuple[str, list[str]]:
    content_text = (note.content or "").strip()
    # Defensive re-check against staleness — highlighted_spans should
    # already be cleaned on save (see routers/notes.py's _clean_spans),
    # but don't trust that blindly here.
    highlights = [s for s in (note.highlighted_spans or []) if s and s in content_text]
    return content_text, highlights


def _parse_cards(raw: str) -> list[dict]:
    """Defensively parse the model's JSON response. Strips markdown code
    fences if the model added them despite instructions not to."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:]
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        return []

    cards = data.get("cards", []) if isinstance(data, dict) else []
    valid = [
        c
        for c in cards
        if isinstance(c, dict) and c.get("front") and c.get("back")
    ][:MAX_CARDS_PER_GENERATION]
    return valid


async def generate_flashcards_for_note(note: Note, db: Session) -> list[Flashcard]:
    content_text, highlighted_text = _extract_text_and_highlights(note)
    system, user_prompt = prompts.flashcard_generation_prompt(
        note.title, content_text, highlighted_text
    )
    raw = await llm_service.generate_json(system, user_prompt)
    cards_data = _parse_cards(raw)

    created: list[Flashcard] = []
    for card in cards_data:
        variants = card.get("variants") or []
        fresh = new_fsrs_card()
        flashcard = Flashcard(
            note_id=note.id,
            user_id=note.user_id,
            front=str(card["front"]),
            back=str(card["back"]),
            front_variants=[str(v) for v in variants if v],
            state=state_to_int(fresh.state),
            due=ensure_aware(fresh.due),
            fsrs_card_data=fresh.to_dict(),
        )
        db.add(flashcard)
        created.append(flashcard)

    db.commit()
    for fc in created:
        db.refresh(fc)
    return created
