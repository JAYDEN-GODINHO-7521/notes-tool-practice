import { apiClient } from "./client";
import type { Flashcard } from "../types";

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
