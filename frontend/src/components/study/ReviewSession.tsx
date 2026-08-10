import { useEffect, useRef, useState } from "react";
import { reviewFlashcard } from "../../api/flashcards";
import type { Flashcard, Rating } from "../../types";
import FlashcardFlip from "./FlashcardFlip";

interface ReviewSessionProps {
  cards: Flashcard[];
  onDone: () => void;
}

export default function ReviewSession({ cards, onDone }: ReviewSessionProps) {
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const cardShownAt = useRef(Date.now());

  useEffect(() => {
    cardShownAt.current = Date.now();
  }, [index]);

  const current = cards[index];

  async function handleRate(rating: Rating) {
    if (!current || submitting) return;
    setSubmitting(true);
    const elapsedMs = Date.now() - cardShownAt.current;
    try {
      await reviewFlashcard(current.id, rating, elapsedMs);
    } finally {
      setSubmitting(false);
      if (index + 1 >= cards.length) {
        onDone();
      } else {
        setIndex((i) => i + 1);
      }
    }
  }

  if (!current) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-xl text-ink mb-2">All caught up</p>
        <p className="text-ink/50 text-sm">No cards are due right now.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-xs text-ink/40 font-mono mb-6">
        Card {index + 1} of {cards.length}
      </p>
      <FlashcardFlip card={current} onRate={handleRate} />
    </div>
  );
}
