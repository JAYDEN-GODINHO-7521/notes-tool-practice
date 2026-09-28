/**
 * WYSIWYG markdown editor for notes, built on Milkdown (ProseMirror).
 *
 * FIXES applied:
 * - flashcardHighlightPlugin/flashcardTooltipPlugin now both read from a
 *   single shared stateRef, kept current every render, instead of being
 *   constructed once with frozen prop values.
 * - Exposes onReadyChange so consumers (EditorToolbar) can disable
 *   formatting buttons until the async editor instance actually exists,
 *   instead of clicks silently no-op'ing before it's ready.
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from "@milkdown/core";
import {
  commonmark,
  toggleStrongCommand,
  toggleEmphasisCommand,
  wrapInHeadingCommand,
  wrapInBulletListCommand,
  wrapInOrderedListCommand,
} from "@milkdown/preset-commonmark";
import { gfm } from "@milkdown/preset-gfm";
import { history } from "@milkdown/plugin-history";
import { listener, listenerCtx } from "@milkdown/plugin-listener";
import { math } from "@milkdown/plugin-math";
import { callCommand } from "@milkdown/utils";
import { Milkdown, useEditor, MilkdownProvider } from "@milkdown/react";
import {
  flashcardHighlightPlugin,
  flashcardHighlightKey,
  type HighlightStateRefValue,
} from "../../lib/flashcardHighlightPlugin";
import { flashcardTooltipPlugin } from "./MilkdownSelectionMenu";

interface MilkdownNoteEditorProps {
  content: string;
  onChange: (content: string) => void;
  highlightedSpans: string[];
  onHighlightedSpansChange: (spans: string[]) => void;
  autoFocus?: boolean;
  onReadyChange?: (ready: boolean) => void;
}

export interface MilkdownEditorHandle {
  toggleBold: () => void;
  toggleItalic: () => void;
  setHeading: (level: number) => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
}

interface EditorInnerProps extends MilkdownNoteEditorProps {
  handleRef: React.Ref<MilkdownEditorHandle>;
}

function EditorInner({
  content,
  onChange,
  highlightedSpans,
  onHighlightedSpansChange,
  autoFocus,
  onReadyChange,
  handleRef,
}: EditorInnerProps) {
  // "Latest ref" pattern — kept current every render (no dep array), so
  // both plugins below always read today's props even though they were
  // constructed once, at mount, via useEditor's factory.
  const stateRef = useRef<HighlightStateRefValue>({ highlightedSpans, onHighlightedSpansChange });
  useEffect(() => {
    stateRef.current = { highlightedSpans, onHighlightedSpansChange };
  });

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
      .use(flashcardHighlightPlugin(stateRef))
      .use(flashcardTooltipPlugin(stateRef))
  );

  useImperativeHandle(
    handleRef,
    () => ({
      toggleBold: () => get()?.action(callCommand(toggleStrongCommand.key)),
      toggleItalic: () => get()?.action(callCommand(toggleEmphasisCommand.key)),
      setHeading: (level: number) => get()?.action(callCommand(wrapInHeadingCommand.key, level)),
      toggleBulletList: () => get()?.action(callCommand(wrapInBulletListCommand.key)),
      toggleOrderedList: () => get()?.action(callCommand(wrapInOrderedListCommand.key)),
    }),
    [get]
  );

  // Poll via requestAnimationFrame (rather than assume an undocumented
  // internal "loading" field on useEditor's return value) until the
  // async editor instance exists, then notify the consumer.
  useEffect(() => {
    let cancelled = false;
    let rafId = 0;
    function check() {
      if (cancelled) return;
      if (get()) {
        onReadyChange?.(true);
      } else {
        rafId = requestAnimationFrame(check);
      }
    }
    check();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      onReadyChange?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get]);

  // Best-effort follow-up sync for highlighted_spans changes that don't
  // originate from the user's own in-editor toggle (e.g. a programmatic
  // reset). The *initial* render no longer depends on this — see
  // flashcardHighlightPlugin.ts's state.init — so a missed/early call
  // here is no longer data-loss, just a slightly stale decoration until
  // the next real change.
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

const MilkdownNoteEditor = forwardRef<MilkdownEditorHandle, MilkdownNoteEditorProps>(
  function MilkdownNoteEditor(props, ref) {
    return (
      <MilkdownProvider>
        <div className="milkdown-note-editor text-sm text-ink">
          <EditorInner {...props} handleRef={ref} />
        </div>
      </MilkdownProvider>
    );
  }
);

export default MilkdownNoteEditor;