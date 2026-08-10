import { useState } from "react";
import type { Flashcard, Rating } from "../../types";

interface FlashcardFlipProps {
  card: Flashcard;
  onRate: (rating: Rating) => void;
}

const RATING_BUTTONS: { rating: Rating; label: string; className: string }[] = [
  { rating: 1, label: "Again", className: "bg-red-50 text-red-700 hover:bg-red-100" },
  { rating: 2, label: "Hard", className: "bg-gold-light/40 text-ink hover:bg-gold-light/60" },
  { rating: 3, label: "Good", className: "bg-moss/10 text-moss-dark hover:bg-moss/20" },
  { rating: 4, label: "Easy", className: "bg-sky-100 text-sky-800 hover:bg-sky-200" },
];

export default function FlashcardFlip({ card, onRate }: FlashcardFlipProps) {
  const [flipped, setFlipped] = useState(false);

  function handleRate(rating: Rating) {
    onRate(rating);
    setFlipped(false);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[220px] rounded-2xl border border-line bg-white shadow-sm p-8 flex items-center justify-center text-center"
      >
        <p className="font-display text-xl text-ink whitespace-pre-wrap">
          {flipped ? card.back : card.display_front}
        </p>
      </button>

      <p className="text-center text-xs text-ink/40 font-mono mt-2">
        {flipped ? "Answer" : "Tap card to reveal answer"}
      </p>

      {flipped && (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {RATING_BUTTONS.map(({ rating, label, className }) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleRate(rating)}
              className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${className}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
