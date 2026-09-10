import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import { Decoration, DecorationSet } from "@milkdown/prose/view";
import type { Node as ProseMirrorNode } from "@milkdown/prose/model";

export const flashcardHighlightKey = new PluginKey<DecorationSet>("flashcardHighlight");

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
        decorations.push(
          Decoration.inline(from, to, { class: "flashcard-mark" })
        );
        fromIndex = matchIndex + span.length;
      }
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const flashcardHighlightPlugin = $prose(() => {
  return new Plugin({
    key: flashcardHighlightKey,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, old) {
        const spans = tr.getMeta(flashcardHighlightKey) as string[] | undefined;
        if (spans !== undefined) {
          return buildDecorations(tr.doc, spans);
        }
        if (tr.docChanged) {
          // Re-map is unreliable for arbitrary substring matches after an
          // edit (positions shift in ways `.map()` can't reconstruct
          // faithfully for re-searched text) — cheaper and more correct
          // to just recompute against the last-known span list, which
          // the plugin doesn't itself retain. In practice
          // MilkdownNoteEditor re-pushes spans via meta on every relevant
          // change, so `old` is rarely stale for more than one keystroke.
          return old;
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

/**
 * Global CSS needed once (index.css):
 *
 *   .flashcard-mark {
 *     background-color: theme('colors.gold-light');
 *     border-radius: 2px;
 *   }
 */
