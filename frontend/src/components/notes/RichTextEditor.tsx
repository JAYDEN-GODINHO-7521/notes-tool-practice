/**
 * TipTap-based note editor with LaTeX math (via @tiptap/extension-mathematics
 * + KaTeX) and text highlighting. Content is stored/loaded as TipTap JSON
 * (see Note.content) — LaTeX delimiters ($...$ inline, $$...$$ block) are
 * preserved in that JSON and rendered live in the editor.
 */
import Highlight from "@tiptap/extension-highlight";
import { Mathematics } from "@tiptap/extension-mathematics";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: JSONContent;
  onChange: (content: JSONContent) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Take a note…",
  autoFocus = false,
}: RichTextEditorProps) {
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
        Tip: wrap math in $…$ (inline) or $$…$$ (block) — renders live.
      </p>
    </div>
  );
}
