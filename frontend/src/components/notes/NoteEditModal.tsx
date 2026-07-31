import type { JSONContent } from "@tiptap/core";
import { useState } from "react";
import type { Note } from "../../types";
import { NOTE_COLOR_KEYS, NOTE_COLORS } from "./noteColors";
import RichTextEditor from "./RichTextEditor";

interface NoteEditModalProps {
  note: Note;
  onClose: () => void;
  onSave: (id: string, input: { title: string; content: JSONContent; color: string }) => Promise<void>;
  onDelete: (note: Note) => void;
}

/**
 * The parent must render this with `key={note.id}` (see Dashboard.tsx) so
 * that switching notes remounts a fresh instance instead of needing an
 * effect to sync props into state on every note change.
 */
export default function NoteEditModal({ note, onClose, onSave, onDelete }: NoteEditModalProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState<JSONContent>(note.content as JSONContent);
  const [color, setColor] = useState(note.color);
  const [saving, setSaving] = useState(false);

  async function handleClose() {
    setSaving(true);
    try {
      await onSave(note.id, { title: title.trim(), content, color });
    } finally {
      setSaving(false);
      onClose();
    }
  }

  const bg = NOTE_COLORS[color]?.bg ?? NOTE_COLORS.default.bg;

  return (
    <div
      className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-xl rounded-2xl border border-line ${bg} p-6 shadow-xl max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent font-display text-xl text-ink placeholder:text-ink/40 focus:outline-none mb-3"
        />
        <RichTextEditor content={content} onChange={setContent} autoFocus />

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {NOTE_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                title={NOTE_COLORS[key].label}
                onClick={() => setColor(key)}
                className={`h-6 w-6 rounded-full ${NOTE_COLORS[key].swatch} ${
                  color === key ? "ring-2 ring-moss ring-offset-1" : ""
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onDelete(note);
                onClose();
              }}
              className="text-sm text-ink/50 hover:text-red-600 font-sans"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="text-sm font-medium text-moss hover:text-moss-dark px-3 py-1.5 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
