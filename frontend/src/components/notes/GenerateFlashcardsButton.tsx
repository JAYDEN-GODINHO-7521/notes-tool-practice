/** "Generate Flashcards" button for the note editor toolbar. Only usable on
 * notes that already exist (have an id) — not in the unsaved composer. */
import { useState } from "react";
import { deleteFlashcard, generateFlashcards, listNoteFlashcards } from "../../api/flashcards";
import type { Flashcard } from "../../types";

interface GenerateFlashcardsButtonProps {
  noteId: string;
}

export default function GenerateFlashcardsButton({ noteId }: GenerateFlashcardsButtonProps) {
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { flashcards } = await generateFlashcards(noteId);
      setCards(flashcards);
      setExpanded(true);
    } catch {
      setError("Couldn't generate flashcards. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleExpand() {
    if (!expanded && cards === null) {
      setLoading(true);
      try {
        setCards(await listNoteFlashcards(noteId));
      } catch {
        setError("Couldn't load flashcards.");
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  }

  async function handleDelete(id: string) {
    await deleteFlashcard(id);
    setCards((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  }

  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="text-xs font-medium text-moss hover:text-moss-dark disabled:opacity-60"
        >
          {loading ? "Generating…" : "Generate Flashcards"}
        </button>
        <button
          type="button"
          onClick={handleToggleExpand}
          className="text-xs text-ink/50 hover:text-ink"
        >
          {expanded ? "Hide cards" : "Show cards"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {expanded && cards && (
        <ul className="mt-3 space-y-2">
          {cards.length === 0 && (
            <li className="text-xs text-ink/40">No flashcards yet for this note.</li>
          )}
          {cards.map((card) => (
            <li
              key={card.id}
              className="text-xs bg-paper/60 rounded-lg px-3 py-2 flex items-start justify-between gap-2"
            >
              <div>
                <p className="font-medium text-ink">{card.front}</p>
                <p className="text-ink/60 mt-0.5">{card.back}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(card.id)}
                className="text-ink/40 hover:text-red-600 shrink-0"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
