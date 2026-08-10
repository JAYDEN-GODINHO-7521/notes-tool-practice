"""Generate Flashcard rows from a note via llm_service, with real FSRS
initial state (via fsrs_service.new_fsrs_card(), not a hardcoded placeholder).
"""
import json

from sqlalchemy.orm import Session

from app.models.flashcard import Flashcard
from app.models.note import Note
from app.services import llm_service, prompts
from app.services.fsrs_service import new_fsrs_card, state_to_int

MAX_CARDS_PER_GENERATION = 8


def _extract_text_and_highlights(node: dict | None) -> tuple[str, list[str]]:
    """Flatten a TipTap JSON document into plain text (LaTeX delimiters are
    stored as plain text within text nodes, so this preserves them as-is),
    and separately collect the text of any spans marked with the Highlight
    mark, so flashcard generation can prioritize them."""
    if not node:
        return "", []

    parts: list[str] = []
    highlights: list[str] = []

    def walk(n: dict) -> None:
        if n.get("type") == "text":
            text = n.get("text", "")
            parts.append(text)
            marks = n.get("marks") or []
            if any(m.get("type") == "highlight" for m in marks) and text.strip():
                highlights.append(text.strip())
        for child in n.get("content", []) or []:
            walk(child)
        if n.get("type") in ("paragraph", "heading"):
            parts.append("\n")

    walk(node)
    return "".join(parts).strip(), highlights


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
    content_text, highlighted_text = _extract_text_and_highlights(note.content)
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
            due=fresh.due,
            fsrs_card_data=fresh.to_dict(),
        )
        db.add(flashcard)
        created.append(flashcard)

    db.commit()
    for fc in created:
        db.refresh(fc)
    return created
