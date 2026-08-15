/** Keep-style "Take a note…" box: collapsed by default, expands into a
 * title + rich-text editor + color picker + labels on focus, saves on
 * blur/close. */
import type { JSONContent } from "@tiptap/core";
import { useRef, useState } from "react";
import type { Label } from "../../types";
import LabelPicker from "./LabelPicker";
import { NOTE_COLOR_KEYS, NOTE_COLORS } from "./noteColors";
import RichTextEditor from "./RichTextEditor";

const EMPTY_CONTENT: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

interface NoteComposerProps {
  allLabels: Label[];
  onLabelCreated: (label: Label) => void;
  onCreate: (input: {
    title: string;
    content: JSONContent;
    color: string;
    label_ids: string[];
  }) => Promise<void>;
}

export default function NoteComposer({ allLabels, onLabelCreated, onCreate }: NoteComposerProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent>(EMPTY_CONTENT);
  const [color, setColor] = useState("default");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function isEmpty() {
    const text = JSON.stringify(content);
    return !title.trim() && (!content.content || text === JSON.stringify(EMPTY_CONTENT));
  }

  async function handleClose() {
    if (!isEmpty()) {
      setSaving(true);
      try {
        await onCreate({ title: title.trim(), content, color, label_ids: labelIds });
      } finally {
        setSaving(false);
      }
    }
    setTitle("");
    setContent(EMPTY_CONTENT);
    setColor("default");
    setLabelIds([]);
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full max-w-xl mx-auto block text-left rounded-2xl border border-line bg-white px-5 py-3.5 text-ink/50 font-sans text-sm shadow-3d shadow-3d-hover"
      >
        Take a note…
      </button>
    );
  }

  const bg = NOTE_COLORS[color]?.bg ?? NOTE_COLORS.default.bg;

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-xl mx-auto rounded-2xl border border-line ${bg} p-5 shadow-3d`}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-transparent font-display text-lg text-ink placeholder:text-ink/40 focus:outline-none mb-2"
      />
      <RichTextEditor content={content} onChange={setContent} />

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
