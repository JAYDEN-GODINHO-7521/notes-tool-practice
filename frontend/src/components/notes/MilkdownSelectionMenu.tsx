/**
 * Floating selection menu inside the Milkdown editor: Paraphrase / Custom
 * request / Mark for flashcards. Built as a plain ProseMirror Plugin
 * (via @milkdown/utils's $prose), using @milkdown/plugin-tooltip's
 * TooltipProvider directly for floating positioning (tippy.js under the
 * hood) — more robust than the manual getBoundingClientRect() approach
 * used for the earlier MDXEditor/Lexical version.
 *
 * CORRECTED: an earlier version of this file tried to bind the tooltip
 * via $view(tooltipFactory(...), ...) — that's wrong. $view() is for
 * binding a NodeView/MarkView to a schema node/mark defined with
 * $node/$mark; a floating selection tooltip isn't a node or mark, it's
 * selection-driven UI, which is exactly what a plain ProseMirror Plugin's
 * own `view` lifecycle hook is for. This version uses $prose() (Milkdown's
 * wrapper for "just register a ProseMirror Plugin") + that plugin's
 * `view(editorView)` hook to mount TooltipProvider — the same pattern
 * flashcardHighlightPlugin.ts already uses for its own Plugin.
 *
 * The AI streaming preview renders via Streamdown (not a separate
 * streaming-markdown parser) per the decision to consolidate on one
 * markdown renderer across the app.
 */
import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorState } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { TooltipProvider } from "@milkdown/plugin-tooltip";
import { useState, type FormEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Streamdown } from "streamdown";
import { streamGenerate, type AiAction } from "../../api/ai";

interface MenuAPI {
  getSelectedText: () => string;
  replaceSelection: (text: string) => void;
  isHighlighted: (text: string) => boolean;
  toggleHighlight: (text: string) => void;
}

/** React component mounted into the tooltip's DOM container via createRoot. */
function SelectionMenuContent({ api, onClose }: { api: MenuAPI; onClose: () => void }) {
  type Mode = "menu" | "custom-input" | "loading" | "preview";
  const [mode, setMode] = useState<Mode>("menu");
  const [instruction, setInstruction] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const text = api.getSelectedText();

  async function runGenerate(action: AiAction, customInstruction?: string) {
    setMode("loading");
    setPreview("");
    setError(null);
    try {
      await streamGenerate({
        action,
        text,
        instruction: customInstruction,
        onDelta: (delta) => setPreview((p) => p + delta),
      });
      setMode("preview");
    } catch {
      setError("Something went wrong. Try again.");
      setMode("menu");
    }
  }

  function handleAskSubmit(e: FormEvent) {
    e.preventDefault();
    if (!instruction.trim()) return;
    runGenerate("custom", instruction.trim());
  }

  return (
    <div
      className="bg-white border border-line rounded-xl shadow-lg text-sm font-sans"
      style={{ minWidth: mode === "menu" ? 190 : 280, maxWidth: 360 }}
    >
      {mode === "menu" && (
        <div className="py-1">
          <button type="button" onClick={() => runGenerate("paraphrase")} className="w-full text-left px-3 py-2 hover:bg-paper text-ink">
            Paraphrase
          </button>
          <button type="button" onClick={() => setMode("custom-input")} className="w-full text-left px-3 py-2 hover:bg-paper text-ink">
            Custom request…
          </button>
          <button
            type="button"
            onClick={() => { api.toggleHighlight(text); onClose(); }}
            className="w-full text-left px-3 py-2 hover:bg-paper text-ink"
          >
            {api.isHighlighted(text) ? "Unmark for flashcards" : "Mark for flashcards"}
          </button>
        </div>
      )}

      {mode === "custom-input" && (
        <form onSubmit={handleAskSubmit} className="p-3 flex items-center gap-2">
          <input
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="What should I do with this?"
            maxLength={500}
            className="flex-1 min-w-0 rounded-lg border border-line px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
          />
          <button type="submit" disabled={!instruction.trim()} className="text-moss text-xs font-medium px-2 py-1.5 disabled:opacity-40 shrink-0">
            Ask
          </button>
        </form>
      )}

      {mode === "loading" && <div className="p-4 text-ink/50">Thinking…</div>}

      {mode === "preview" && (
        <div className="p-4">
          <div className="text-ink/80 mb-3">
            <Streamdown parseIncompleteMarkdown>{preview}</Streamdown>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => { api.replaceSelection(preview); onClose(); }} className="text-moss text-xs font-medium">
              Replace
            </button>
            <button type="button" onClick={onClose} className="text-ink/50 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="p-3 text-xs text-red-600 border-t border-line">{error}</div>}
    </div>
  );
}

interface FlashcardTooltipOptions {
  highlightedSpans: string[];
  onHighlightedSpansChange: (spans: string[]) => void;
}

const flashcardTooltipKey = new PluginKey("flashcardTooltip");

/**
 * Registered in MilkdownNoteEditor.tsx via `.use(flashcardTooltipPlugin({...}))`.
 * Do NOT also `.use(tooltip)` (the base @milkdown/plugin-tooltip plugin) —
 * that was only needed to pair with the old, incorrect $view(tooltipFactory)
 * approach and should be removed from MilkdownNoteEditor.tsx's plugin list.
 */
export function flashcardTooltipPlugin({ highlightedSpans, onHighlightedSpansChange }: FlashcardTooltipOptions) {
  return $prose(() => {
    return new Plugin({
      key: flashcardTooltipKey,
      view(editorView: EditorView) {
        const content = document.createElement("div");
        let root: Root | null = null;

        const provider = new TooltipProvider({
          content,
          shouldShow: (view: EditorView) => {
            const { from, to } = view.state.selection;
            return from !== to;
          },
        });

        function render(view: EditorView) {
          const { from, to } = view.state.selection;

          const api: MenuAPI = {
            getSelectedText: () => view.state.doc.textBetween(from, to, " "),
            replaceSelection: (text: string) => {
              view.dispatch(view.state.tr.insertText(text, from, to));
            },
            isHighlighted: (text: string) => highlightedSpans.includes(text),
            toggleHighlight: (text: string) => {
              const already = highlightedSpans.includes(text);
              onHighlightedSpansChange(
                already ? highlightedSpans.filter((s) => s !== text) : [...highlightedSpans, text]
              );
            },
          };

          if (!root) root = createRoot(content);
          root.render(<SelectionMenuContent api={api} onClose={() => provider.hide()} />);
        }

        // Render once with the initial view — the `view()` lifecycle hook
        // only runs at mount, and ProseMirror doesn't call `update()`
        // until after the first transaction, so without this the
        // tooltip's React content would be empty until something changes
        // the selection.
        render(editorView);

        return {
          update: (updatedView: EditorView, prevState: EditorState) => {
            provider.update(updatedView, prevState);
            if (!updatedView.state.selection.eq(prevState.selection)) render(updatedView);
          },
          destroy: () => {
            provider.destroy();
            root?.unmount();
          },
        };
      },
    });
  });
}