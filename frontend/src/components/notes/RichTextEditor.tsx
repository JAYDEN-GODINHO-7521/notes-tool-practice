/**
 * TipTap-based note editor with LaTeX math (via @tiptap/extension-mathematics
 * + KaTeX), text highlighting, and a selection context menu (paraphrase /
 * translate / highlight / expand — see SelectionMenu.tsx). Content is
 * stored/loaded as TipTap JSON (see Note.content) — LaTeX delimiters
 * ($...$ inline, $$...$$ block) are preserved in that JSON and rendered
 * live in the editor.
 */
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import SelectionMenu from "./SelectionMenu";

interface RichTextEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface SelectionState {
  from: number;
  to: number;
  text: string;
  top: number;
  left: number;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Take a note…",
  autoFocus = false,
}: RichTextEditorProps) {
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const editor = useEditor({
    extensions: [StarterKit, Highlight, Mathematics],
    content,
    autofocus: autoFocus,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[2.5rem] font-sans text-ink",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to, empty } = editor.state.selection;
      if (empty) {
        setSelection(null);
        return;
      }
      const text = editor.state.doc.textBetween(from, to, " ");
      if (!text.trim()) {
        setSelection(null);
        return;
      }
      const coords = editor.view.coordsAtPos(to);
      setSelection({
        from,
        to,
        text,
        top: coords.bottom + 6,
        left: coords.left,
      });
    },
  });

  // Keep the editor in sync if `content` is swapped out from outside
  // (e.g. switching which note is being edited).
  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content, false);
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="relative">
      {editor.isEmpty && (
        <span className="pointer-events-none absolute left-0 top-0 text-ink/40 font-sans text-sm">
          {placeholder}
        </span>
      )}
      <EditorContent editor={editor} />
      <p className="mt-2 text-xs text-ink/40 font-mono">
        Tip: select text for actions, or wrap math in $…$ / $$…$$ — renders live.
      </p>

      {selection && (
        <SelectionMenu
          editor={editor}
          from={selection.from}
          to={selection.to}
          text={selection.text}
          top={selection.top}
          left={selection.left}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
}
