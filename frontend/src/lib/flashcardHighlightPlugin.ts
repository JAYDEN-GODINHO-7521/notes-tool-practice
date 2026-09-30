import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import type { Node as ProseMirrorNode } from "@milkdown/prose/model";

export const flashcardHighlightKey = new PluginKey<DecorationSet>("flashcardHighlight");

/** Shared with MilkdownSelectionMenu.tsx — a single mutable ref both
 * plugins read from at call-time, instead of each closing over the
 * React props at plugin-construction time. useEditor's factory function
 * has no dependency array, so it only ever runs once at mount; anything
 * captured by value inside it (the old
 * `.use(flashcardTooltipPlugin({ highlightedSpans, ... }))` call) was
 * permanently frozen at whatever those props were on first render. */
export interface HighlightStateRefValue {
  highlightedSpans: string[];
  onHighlightedSpansChange: (spans: string[]) => void;
}
// Plain `{ current: T }` (not React's RefObject<T>, whose `current` is
// typed `T | null`). This ref is always initialized with a real value
// by useRef<HighlightStateRefValue>(...) in MilkdownNoteEditor.tsx, so
// `current` is never null.
export type HighlightStateRef = { current: HighlightStateRefValue };

function buildDecorations(doc: ProseMirrorNode, spans: string[]): DecorationSet {
  if (!spans || spans.length === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    const text = node.text;
    for (const span of spans) {
      if (!span) continue;
      let fromIndex = 0;
      let matchIndex: number;
      while ((matchIndex = text.indexOf(span, fromIndex)) !== -1) {
        const from = pos + matchIndex;
        const to = from + span.length;
        decorations.push(Decoration.inline(from, to, { class: "flashcard-mark" }));
        fromIndex = matchIndex + span.length;
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Takes a ref (kept current by MilkdownNoteEditor.tsx) instead of plain
 * highlightedSpans. Two bugs fixed as a result:
 *
 * (#4) state.init now builds decorations from stateRef.current.highlightedSpans
 * immediately, using the doc ProseMirror hands it at plugin-init time.
 * Previously this always started from DecorationSet.empty and depended
 * entirely on a post-mount effect pushing meta once useEditor's async
 * get() became available — which could silently no-op if that effect
 * ran before the editor was ready, so a note's saved highlights
 * sometimes never rendered at all.
 *
 * (#3) On ordinary typing (docChanged, no meta), positions are now
 * remapped via old.map(tr.mapping, tr.doc) instead of being returned
 * completely unchanged. Previously any edit before/inside a highlighted
 * span left the highlight covering the wrong characters, since
 * decorations are position-based and were never remapped.
 */
export function flashcardHighlightPlugin(stateRef: HighlightStateRef) {
  return $prose(() => {
    return new Plugin({
      key: flashcardHighlightKey,
      state: {
        init: (_config, editorState) =>
          buildDecorations(editorState.doc, stateRef.current.highlightedSpans),
        apply(tr, old) {
          const spans = tr.getMeta(flashcardHighlightKey) as string[] | undefined;
          if (spans !== undefined) {
            return buildDecorations(tr.doc, spans);
          }
          if (tr.docChanged) {
            return old.map(tr.mapping, tr.doc);
          }
          return old;
        },
      },
      props: {
        decorations(state) {
          return this.getState(state);
        },
      },
    });
  });
}
