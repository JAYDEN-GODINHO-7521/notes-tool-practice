/** Notes CRUD API calls, scoped server-side to the current user via cookie. */
import { apiClient } from "./client";
import type { Note, NoteCreateInput, NoteUpdateInput } from "../types";

export async function listNotes(params?: { search?: string; archived?: boolean }): Promise<Note[]> {
  const { data } = await apiClient.get<Note[]>("/api/notes", { params });
  return data;
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const { data } = await apiClient.post<Note>("/api/notes", input);
  return data;
}

export async function getNote(id: string): Promise<Note> {
  const { data } = await apiClient.get<Note>(`/api/notes/${id}`);
  return data;
}

export async function updateNote(id: string, input: NoteUpdateInput): Promise<Note> {
  const { data } = await apiClient.patch<Note>(`/api/notes/${id}`, input);
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/api/notes/${id}`);
}
