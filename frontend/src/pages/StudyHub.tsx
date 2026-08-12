import { useEffect, useState } from "react";
import { getStudyStats, startStudySession } from "../api/study";
import Header from "../components/layout/Header";
import ReviewSession from "../components/study/ReviewSession";
import StudyCharts from "../components/study/StudyCharts";
import type { Flashcard, StudyStats } from "../types";

export default function StudyHub() {
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [sessionCards, setSessionCards] = useState<Flashcard[] | null>(null);
  const [startingSession, setStartingSession] = useState(false);

  async function fetchStats() {
    try {
      const data = await getStudyStats();   // ← await comes FIRST now
      setStats(data);
    } finally {
      setLoadingStats(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  async function handleStartRevise() {
    setStartingSession(true);
    try {
      const cards = await startStudySession();
      setSessionCards(cards);
    } finally {
      setStartingSession(false);
    }
  }

  async function handleSessionDone() {
    setSessionCards(null);
    await refreshStats();
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-ink">Study Hub</h1>
          {!sessionCards && (
            <button
              type="button"
              onClick={handleStartRevise}
              disabled={startingSession || (stats?.due_count ?? 0) === 0}
              className="bg-moss hover:bg-moss-dark text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {startingSession ? "Starting…" : "Revise"}
            </button>
          )}
        </div>

        {sessionCards ? (
          <ReviewSession cards={sessionCards} onDone={handleSessionDone} />
        ) : loadingStats ? (
          <p className="text-center text-ink/40 font-sans py-16">Loading…</p>
        ) : stats ? (
          <StudyCharts stats={stats} />
        ) : null}
      </main>
    </div>
  );
}
