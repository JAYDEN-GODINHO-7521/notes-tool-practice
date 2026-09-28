import type { RefObject } from "react";
import type { MilkdownEditorHandle } from "./MilkdownNoteEditor";
import LabelPicker from "./LabelPicker";
import { NOTE_COLOR_KEYS, NOTE_COLORS } from "./noteColors";
import type { Label } from "../../types";

interface EditorToolbarProps {
  editorRef: RefObject<MilkdownEditorHandle | null>;
  pinned: boolean;
  archived: boolean;
  color: string;
  allLabels: Label[];
  selectedLabelIds: string[];
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onColorChange: (color: string) => void;
  onLabelIdsChange: (ids: string[]) => void;
  onLabelCreated: (label: Label) => void;
  onDelete: () => void;
  onClose: () => void;
  saveStatus: "saved" | "saving" | "unsaved";
  editorReady: boolean;
}

const btnClass =
  "h-8 min-w-8 px-1.5 flex items-center justify-center rounded-lg text-ink/70 hover:bg-paper hover:text-ink text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none";

export default function EditorToolbar({
  editorRef,
  editorReady,
  pinned,
  archived,
  color,
  allLabels,
  selectedLabelIds,
  onTogglePin,
  onToggleArchive,
  onColorChange,
  onLabelIdsChange,
  onLabelCreated,
  onDelete,
  onClose,
  saveStatus,
}: EditorToolbarProps) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-line bg-white/90 backdrop-blur px-3 py-2 flex-wrap">
      <button type="button" className={btnClass} title="Bold" disabled={!editorReady} onClick={() => editorRef.current?.toggleBold()}>
        <strong>B</strong>
      </button>
      <button type="button" className={btnClass} title="Italic" disabled={!editorReady} onClick={() => editorRef.current?.toggleItalic()}>
        <em>I</em>
      </button>
      <button type="button" className={btnClass} title="Heading 1" disabled={!editorReady} onClick={() => editorRef.current?.setHeading(1)}>
        H1
      </button>
      <button type="button" className={btnClass} title="Heading 2" disabled={!editorReady} onClick={() => editorRef.current?.setHeading(2)}>
        H2
      </button>
      <button type="button" className={btnClass} title="Heading 3" disabled={!editorReady} onClick={() => editorRef.current?.setHeading(3)}>
        H3
      </button>
      <button type="button" className={btnClass} title="Bullet list" disabled={!editorReady} onClick={() => editorRef.current?.toggleBulletList()}>
        •≡
      </button>
      <button type="button" className={btnClass} title="Numbered list" disabled={!editorReady} onClick={() => editorRef.current?.toggleOrderedList()}>
        1≡
      </button>

      <div className="w-px h-5 bg-line mx-1" />

      <button type="button" className={btnClass} title={pinned ? "Unpin" : "Pin"} onClick={onTogglePin}>
        {pinned ? "📌" : "📍"}
      </button>
      <button
        type="button"
        className={btnClass}
        title={archived ? "Unarchive" : "Archive"}
        onClick={onToggleArchive}
      >
        🗄️
      </button>

      <div className="flex items-center gap-1 px-1">
        {NOTE_COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            title={NOTE_COLORS[key].label}
            onClick={() => onColorChange(key)}
            className={`h-5 w-5 rounded-full ${NOTE_COLORS[key].swatch} ${
              color === key ? "ring-2 ring-moss ring-offset-1" : ""
            }`}
          />
        ))}
      </div>

      <LabelPicker
        allLabels={allLabels}
        selectedLabelIds={selectedLabelIds}
        onChange={onLabelIdsChange}
        onLabelCreated={onLabelCreated}
      />

      <div className="w-px h-5 bg-line mx-1" />

      <button type="button" className={`${btnClass} hover:text-red-600`} title="Delete note" onClick={onDelete}>
        🗑️
      </button>

      <span className="ml-auto text-xs text-ink/40 font-mono pr-2">
        {saveStatus === "saving" ? "Saving…" : saveStatus === "unsaved" ? "Unsaved" : "Saved"}
      </span>

      <button
        type="button"
        onClick={onClose}
        className="h-8 px-3 rounded-lg text-ink/70 hover:bg-paper hover:text-ink text-sm font-medium"
        title="Close"
      >
        ✕ Close
      </button>
    </div>
  );
}