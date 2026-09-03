import { useState } from "react";
import type { Label, Note } from "../../types";
import GenerateFlashcardsButton from "./GenerateFlashcardsButton";
import LabelPicker from "./LabelPicker";
import MarkdownEditor from "./MarkdownEditor";
import { NOTE_COLOR_KEYS, NOTE_COLORS } from "./noteColors";

interface NoteEditModalProps {
  note: Note;
  allLabels: Label[];
  onLabelCreated: (label: Label) => void;
  onClose: () => void;
  onSave: (
    id: string,
    input: {
      title: string;
      content: string;
      highlighted_spans: string[];
      color: string;
      label_ids: string[];
    }
  ) => Promise<void>;
  onDelete: (note: Note) => void;
}

export default function NoteEditModal({
  note,
  allLabels,
  onLabelCreated,
  onClose,
  onSave,
  onDelete,
}: NoteEditModalProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [highlightedSpans, setHighlightedSpans] = useState<string[]>(note.highlighted_spans);
  const [color, setColor] = useState(note.color);
  const [labelIds, setLabelIds] = useState<string[]>(note.labels.map((l) => l.id));
  const [saving, setSaving] = useState(false);

  async function handleClose() {
    setSaving(true);
    try {
      await onSave(note.id, {
        title: title.trim(),
        content,
        highlighted_spans: highlightedSpans.filter((s) => content.includes(s)),
        color,
        label_ids: labelIds,
      });
    } finally {
      setSaving(false);
      onClose();
    }
  }

  const bg = NOTE_COLORS[color]?.bg ?? NOTE_COLORS.default.bg;

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div
        className={`w-full max-w-xl rounded-2xl border border-line ${bg} p-6 shadow-3d max-h-[85vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent font-display text-xl text-ink placeholder:text-ink/40 focus:outline-none mb-3"
        />
        <MarkdownEditor
          content={content}
          onChange={setContent}
          highlightedSpans={highlightedSpans}
          onHighlightedSpansChange={setHighlightedSpans}
          autoFocus
        />

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <LabelPicker
              allLabels={allLabels}
              selectedLabelIds={labelIds}
              onChange={setLabelIds}
              onLabelCreated={onLabelCreated}
            />
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

        <div className="mt-4 pt-4 border-t border-line/60">
          <GenerateFlashcardsButton noteId={note.id} />
        </div>
      </div>
    </div>
  );
}
