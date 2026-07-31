import { generateHTML } from "@tiptap/html";
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";
import StarterKit from "@tiptap/starter-kit";
import { useMemo } from "react";
import type { Note } from "../../types";
import { NOTE_COLORS } from "./noteColors";

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NoteCard({
  note,
  onOpen,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: NoteCardProps) {
  const color = NOTE_COLORS[note.color] ?? NOTE_COLORS.default;

  const html = useMemo(() => {
    try {
      return generateHTML(note.content ?? { type: "doc", content: [] }, [
        StarterKit,
        Highlight,
        Mathematics,
      ]);
    } catch {
      return "";
    }
  }, [note.content]);

  return (
    <div
      className={`group relative rounded-2xl border border-line ${color.bg} p-4 break-inside-avoid mb-4 cursor-pointer transition-shadow hover:shadow-md`}
      onClick={() => onOpen(note)}
    >
      {note.pinned && (
        <span className="absolute -top-2 -right-2 text-gold text-lg" title="Pinned">
          📌
        </span>
      )}

      {note.title && (
        <h3 className="font-display text-lg text-ink mb-1 truncate">{note.title}</h3>
      )}

      <div
        className="prose prose-sm max-w-none font-sans text-ink/90 line-clamp-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note);
          }}
          className="text-xs text-ink/50 hover:text-moss font-sans"
        >
          {note.pinned ? "Unpin" : "Pin"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleArchive(note);
          }}
          className="text-xs text-ink/50 hover:text-moss font-sans"
        >
          {note.archived ? "Unarchive" : "Archive"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          className="text-xs text-ink/50 hover:text-red-600 font-sans"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
