import { apiClient } from "./client";
import type { Flashcard, Rating } from "../types";

export async function generateFlashcards(
  noteId: string
): Promise<{ created: number; flashcards: Flashcard[] }> {
  const { data } = await apiClient.post<{ created: number; flashcards: Flashcard[] }>(
    `/api/notes/${noteId}/flashcards/generate`
  );
  return data;
}

export async function listNoteFlashcards(noteId: string): Promise<Flashcard[]> {
  const { data } = await apiClient.get<Flashcard[]>(`/api/notes/${noteId}/flashcards`);
  return data;
}

export async function deleteFlashcard(id: string): Promise<void> {
  await apiClient.delete(`/api/flashcards/${id}`);
}

export async function getDueFlashcards(): Promise<Flashcard[]> {
  const { data } = await apiClient.get<Flashcard[]>("/api/flashcards/due");
  return data;
}

export async function reviewFlashcard(
  id: string,
  rating: Rating,
  reviewDurationMs?: number
): Promise<Flashcard> {
  const { data } = await apiClient.post<Flashcard>(`/api/flashcards/${id}/review`, {
    rating,
    review_duration_ms: reviewDurationMs,
  });
  return data;
}
