/**
 * Composer for creating a new note. Post markdown-editor-migration
 * (ADR-001): content is a plain string, highlighted_spans is separate
 * sidecar state threaded through from MarkdownEditor's "Mark for
 * flashcards" action, and stale spans are re-filtered against the final
 * content right before saving (defense-in-depth — the backend also
 * cleans on save).
 */
import { useState } from "react";
import type { Label } from "../../types";
import LabelPicker from "./LabelPicker";
import MarkdownEditor from "./MarkdownEditor";
import { NOTE_COLOR_KEYS, NOTE_COLORS } from "./noteColors";

interface NoteComposerProps {
  allLabels: Label[];
  onLabelCreated: (label: Label) => void;
  onCreate: (input: {
    title: string;
    content: string;
    highlighted_spans: string[];
    color: string;
    label_ids: string[];
  }) => Promise<void>;
}

export default function NoteComposer({ allLabels, onLabelCreated, onCreate }: NoteComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [highlightedSpans, setHighlightedSpans] = useState<string[]>([]);
  const [color, setColor] = useState("default");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function isEmpty() {
    return !title.trim() && !content.trim();
  }

  function reset() {
    setTitle("");
    setContent("");
    setHighlightedSpans([]);
    setColor("default");
    setLabelIds([]);
    setExpanded(false);
  }

  async function handleClose() {
    if (!isEmpty()) {
      setSaving(true);
      try {
        await onCreate({
          title: title.trim(),
          content,
          highlighted_spans: highlightedSpans.filter((s) => content.includes(s)),
          color,
          label_ids: labelIds,
        });
      } finally {
        setSaving(false);
      }
    }
    reset();
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full max-w-xl mx-auto block text-left rounded-2xl border border-line bg-white px-5 py-3.5 text-ink/50 font-sans text-sm shadow-3d-static hover:shadow-3d-hover"
      >
        Take a note…
      </button>
    );
  }

  const bg = NOTE_COLORS[color]?.bg ?? NOTE_COLORS.default.bg;

  return (
    <div className={`w-full max-w-xl mx-auto rounded-2xl border border-line ${bg} p-5 shadow-3d`}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-transparent font-display text-lg text-ink placeholder:text-ink/40 focus:outline-none mb-2"
      />
      <MarkdownEditor
        content={content}
        onChange={setContent}
        highlightedSpans={highlightedSpans}
        onHighlightedSpansChange={setHighlightedSpans}
      />

      <div className="mt-4 flex items-center justify-between">
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
  );
}
