import { apiClient } from "./client";
import type { Flashcard, StudyStats } from "../types";

export async function startStudySession(limit = 20): Promise<Flashcard[]> {
  const { data } = await apiClient.post<{ cards: Flashcard[] }>("/api/study/session", null, {
    params: { limit },
  });
  return data.cards;
}

export async function getStudyStats(): Promise<StudyStats> {
  const { data } = await apiClient.get<StudyStats>("/api/study/stats");
  return data;
}
