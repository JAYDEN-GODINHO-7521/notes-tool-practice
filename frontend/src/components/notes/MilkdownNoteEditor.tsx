/**
 * WYSIWYG markdown editor for notes, built on Milkdown (ProseMirror).
 * Replaces the earlier MDXEditor/Lexical attempt — see conversation
 * history for the reasoning (ProseMirror Decorations are a purpose-built
 * fit for highlighted_spans; ProseMirror/Milkdown's core plugin API is
 * more stable than Lexical's/MDXEditor's).
 *
 * Content contract unchanged throughout this whole migration: `content`
 * in (markdown string), `onChange` fires with the updated markdown
 * string via the listener plugin. Milkdown is uncontrolled after mount —
 * switching notes should remount this component via `key={note.id}` at
 * the call site (same pattern already used for NoteEditModal).
 *
 * v1 known gap: Mermaid diagrams render correctly in the read-only
 * NoteCard view (Streamdown) but only as a plain fenced code block while
 * editing — no maintained Milkdown Mermaid plugin as of this writing.
 * Math (KaTeX) DOES have first-party support here via @milkdown/plugin-math,
 * unlike the MDXEditor attempt.
 *
 * Does NOT register the base @milkdown/plugin-tooltip `tooltip` plugin —
 * flashcardTooltipPlugin (see MilkdownSelectionMenu.tsx) is a self-
 * contained ProseMirror Plugin built via $prose() that uses
 * TooltipProvider directly, so it doesn't need the base plugin
 * registered separately. (An earlier version of this file did register
 * it, to pair with a since-corrected $view(tooltipFactory) approach.)
 *
 * No theme package (e.g. @milkdown/theme-nord) is used — that package's
 * CSS is written for Tailwind v4's native @layer support and breaks the
 * PostCSS build under Tailwind v3 (`@layer base` used without a
 * matching `@tailwind base` in the same file). It's also Milkdown's
 * generic default look, not this app's actual palette — style
 * `.milkdown-note-editor` directly in index.css instead, matching the
 * paper/ink/moss/gold palette used everywhere else.
 */
import { useEffect } from "react";
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from "@milkdown/core";
import { commonmark } from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { math } from "@milkdown/plugin-math";
import { Milkdown, useEditor, MilkdownProvider } from "@milkdown/react";
import { flashcardHighlightPlugin, flashcardHighlightKey } from "../../lib/flashcardHighlightPlugin";
import { flashcardTooltipPlugin } from "./MilkdownSelectionMenu";

interface MilkdownNoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  highlightedSpans: string[];
  onHighlightedSpansChange: (spans: string[]) => void;
  autoFocus?: boolean;
}

function EditorInner({
  content,
  onChange,
  highlightedSpans,
  onHighlightedSpansChange,
  autoFocus,
}: MilkdownNoteEditorProps) {
  const { get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        if (autoFocus) root.focus();
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown, prevMarkdown) => {
          if (markdown !== prevMarkdown) onChange(markdown);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
      .use(math)
      .use(flashcardHighlightPlugin)
      .use(flashcardTooltipPlugin({ highlightedSpans, onHighlightedSpansChange }))
  );

  // Push updated highlighted_spans into the ProseMirror plugin via
  // transaction meta whenever the prop changes — see
  // flashcardHighlightPlugin.ts for why this is the sync mechanism.
  useEffect(() => {
    const editor = get();
    if (!editor) return;
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.dispatch(view.state.tr.setMeta(flashcardHighlightKey, highlightedSpans));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedSpans.join("\u0000")]);

  return <Milkdown />;
}

export default function MilkdownNoteEditor(props: MilkdownNoteEditorProps) {
  return (
    <MilkdownProvider>
      <div className="milkdown-note-editor text-sm text-ink">
        <EditorInner {...props} />
      </div>
    </MilkdownProvider>
  );
}