export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: Record<string, unknown>; // TipTap JSON document
  color: string;
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type NoteCreateInput = Partial<
  Pick<Note, "title" | "content" | "color" | "pinned" | "archived">
>;

export type NoteUpdateInput = NoteCreateInput;
