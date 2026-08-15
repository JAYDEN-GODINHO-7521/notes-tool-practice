export interface User {
  id: string;
  email: string;
  name: string;
  notes_view: "grid" | "list";
}

export interface Label {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: Record<string, unknown>; // TipTap JSON document
  color: string;
  pinned: boolean;
  archived: boolean;
  position: number;
  labels: Label[];
  created_at: string;
  updated_at: string;
}

export type NoteCreateInput = Partial<
  Pick<Note, "title" | "content" | "color" | "pinned" | "archived">
> & { label_ids?: string[] };

export type NoteUpdateInput = NoteCreateInput;

export interface Flashcard {
  id: string;
  note_id: string;
  front: string;
  back: string;
  front_variants: string[];
  variant_index: number;
  display_front: string;
  state: number;
  due: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  created_at: string;
}

export type Rating = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface DailyCount {
  date: string;
  count: number;
}

export interface StudyStats {
  reviews_per_day: DailyCount[];
  retention_rate_7d: number;
  retention_rate_30d: number;
  due_count: number;
  reviewed_today: number;
  streak_days: number;
  avg_difficulty: number;
}
