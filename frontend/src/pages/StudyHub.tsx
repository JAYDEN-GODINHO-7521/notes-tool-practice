import Header from "../components/layout/Header";

/** TODO(flashcards-fsrs): review sessions + Recharts dashboard. */
export default function StudyHub() {
  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-ink mb-2">Study Hub</h1>
        <p className="text-ink/50 font-sans text-sm">
          Flashcard review sessions and charts are coming in the flashcards-fsrs step.
        </p>
      </main>
    </div>
  );
}
