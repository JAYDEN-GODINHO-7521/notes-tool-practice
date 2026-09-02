/**
 * Basic markdown editor: a plain textarea with a small formatting toolbar
 * (bold / italic / headings / lists) and a selection menu (paraphrase /
 * custom request / mark for flashcards). Replaces the old TipTap
 * rich-text + LaTeX editor — see ADR-001 /
 * session-summary-markdown-editor-migration.md. No live preview here; the
 * rendered/highlighted read view lives on NoteCard via lib/markdown.ts.
 */
import { useRef, useState, type ChangeEvent, type MouseEvent as ReactMouseEvent } from "react";
import SelectionMenu from "./SelectionMenu";

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  highlightedSpans: string[];
  onHighlightedSpansChange: (spans: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface SelectionState {
  start: number;
  end: number;
  text: string;
  top: number;
  left: number;
}

export default function MarkdownEditor({
  content,
  onChange,
  highlightedSpans,
  onHighlightedSpansChange,
  placeholder = "Take a note…",
  autoFocus = false,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);

  function applyWrap(marker: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    const next = value.slice(0, selectionStart) + marker + selected + marker + value.slice(selectionEnd);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart + marker.length, selectionEnd + marker.length);
    });
  }

  function applyLinePrefix(prefix: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    let lineEnd = value.indexOf("\n", selectionEnd);
    if (lineEnd === -1) lineEnd = value.length;
    const block = value.slice(lineStart, lineEnd);
    const prefixed = block
      .split("\n")
      .map((line) => (line.startsWith(prefix) ? line : prefix + line))
      .join("\n");
    const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  }

  function handleMouseUp(e: ReactMouseEvent<HTMLTextAreaElement>) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    if (selectionStart === selectionEnd) {
      setSelection(null);
      return;
    }
    const text = value.slice(selectionStart, selectionEnd);
    if (!text.trim()) {
      setSelection(null);
      return;
    }
    // Approximate menu position from the mouse cursor — a textarea has no
    // per-character coordinate API like TipTap's coordsAtPos, and a full
    // caret-mirroring solution is overkill for a "basic" editor.
    setSelection({ start: selectionStart, end: selectionEnd, text, top: e.clientY + 12, left: e.clientX });
  }

  function handleReplace(newText: string) {
    if (!selection) return;
    const next = content.slice(0, selection.start) + newText + content.slice(selection.end);
    onChange(next);
    setSelection(null);
  }

  function handleToggleHighlight() {
    if (!selection) return;
    const already = highlightedSpans.includes(selection.text);
    onHighlightedSpansChange(
      already ? highlightedSpans.filter((s) => s !== selection.text) : [...highlightedSpans, selection.text]
    );
    setSelection(null);
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 mb-2">
        <ToolbarButton label="B" title="Bold" onClick={() => applyWrap("**")} bold />
        <ToolbarButton label="I" title="Italic" onClick={() => applyWrap("*")} italic />
        <ToolbarButton label="H1" title="Heading 1" onClick={() => applyLinePrefix("# ")} />
        <ToolbarButton label="H2" title="Heading 2" onClick={() => applyLinePrefix("## ")} />
        <ToolbarButton label="•" title="Bullet list" onClick={() => applyLinePrefix("- ")} />
        <ToolbarButton label="1." title="Numbered list" onClick={() => applyLinePrefix("1. ")} />
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        onMouseUp={handleMouseUp}
        onBlur={() => window.setTimeout(() => setSelection(null), 150)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={6}
        className="w-full resize-y bg-transparent font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none min-h-[6rem]"
      />

      <p className="mt-2 text-xs text-ink/40 font-mono">
        Select text for actions, or use the toolbar for **bold**, *italic*, headings, and lists.
      </p>

      {selection && (
        <SelectionMenu
          text={selection.text}
          top={selection.top}
          left={selection.left}
          isHighlighted={highlightedSpans.includes(selection.text)}
          onReplace={handleReplace}
          onToggleHighlight={handleToggleHighlight}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  onClick,
  bold,
  italic,
}: {
  label: string;
  title: string;
  onClick: () => void;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep the textarea's selection intact
      onClick={onClick}
      className={`text-xs px-2 py-1 rounded-md text-ink/60 hover:bg-ink/5 hover:text-ink ${
        bold ? "font-bold" : ""
      } ${italic ? "italic" : ""}`}
    >
      {label}
    </button>
  );
}
