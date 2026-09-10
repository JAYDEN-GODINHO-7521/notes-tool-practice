/**
 * rehype plugin passed to Streamdown for NoteCard's read-only rendering.
 * Walks the parsed hast tree (after remark-gfm/remark-math, before
 * rehype-harden's sanitization pass) and wraps any text node containing a
 * literal match for a highlighted_spans entry in <mark>.
 *
 * Same algorithm/limitation as useFlashcardHighlightOverlay.ts's DOM
 * walker: only matches within a single text node. A span selected across
 * a formatting boundary (e.g. "hello **world**") won't be found here
 * either, since remark/rehype split that into sibling text + <strong>
 * nodes. Documented v1 gap — see conversation history.
 */
import { visit } from "unist-util-visit";
import type { Root, Text, Element } from "hast";

interface RehypeHighlightSpansOptions {
  spans: string[];
}

export default function rehypeHighlightSpans({ spans }: RehypeHighlightSpansOptions) {
  return (tree: Root) => {
    if (!spans || spans.length === 0) return;

    visit(tree, "text", (node: Text, index, parent) => {
      if (index === undefined || !parent || typeof index !== "number") return;

      for (const span of spans) {
        if (!span || !node.value.includes(span)) continue;

        const parts = node.value.split(span);
        const replacement: (Text | Element)[] = [];
        parts.forEach((part, i) => {
          if (part) replacement.push({ type: "text", value: part });
          if (i < parts.length - 1) {
            replacement.push({
              type: "element",
              tagName: "mark",
              properties: {},
              children: [{ type: "text", value: span }],
            });
          }
        });

        parent.children.splice(index, 1, ...replacement);
        return [index, replacement.length]; // tell unist-util-visit how far to skip
      }
    });
  };
}
