/**
 * Floating selection menu inside the Milkdown editor: Paraphrase / Custom
 * request / Mark for flashcards. Built as a plain ProseMirror Plugin
 * (via @milkdown/utils's $prose), using @milkdown/plugin-tooltip's
 * TooltipProvider directly for floating positioning (tippy.js under the
 * hood).
 *
 * FIXED (two bugs):
 * (#1) toggleHighlight now reads/writes stateRef.current.highlightedSpans
 * at call-time instead of a value captured once at plugin construction —
 * previously, marking a second highlighted span could silently drop the
 * first one, since the write was based on a frozen, out-of-date array.
 * (#2) SelectionMenuContent now gets a fresh `key` per selection, forcing
 * React to fully unmount/remount it (resetting mode/preview/instruction)
 * whenever the selection changes, and its in-flight AI request is
 * actually cancelled via AbortController + streamGenerate's `signal`
 * option. Previously the same component instance was reused across
 * selections, so switching selection mid-request could result in the
 * old selection's generated text getting inserted into the new one.
 *
 * The AI streaming preview renders via Streamdown per the decision to
 * consolidate on one markdown renderer across the app.
 */
import { $prose } from "@milkdown/utils";
import { Plugin, PluginKey } from "@milkdown/prose/state";
import type { EditorState } from "@milkdown/prose/state";
import type { EditorView } from "@milkdown/prose/view";
import { TooltipProvider } from "@milkdown/plugin-tooltip";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Streamdown } from "streamdown";
import { streamGenerate, type AiAction } from "../../api/ai";
import type { HighlightStateRef } from "../../lib/flashcardHighlightPlugin";

interface MenuAPI {
  getSelectedText: () => string;
  replaceSelection: (text: string) => void;
  isHighlighted: (text: string) => boolean;
  toggleHighlight: (text: string) => void;
}

function SelectionMenuContent({ api, onClose }: { api: MenuAPI; onClose: () => void }) {
  type Mode = "menu" | "custom-input" | "loading" | "preview";
  const [mode, setMode] = useState<Mode>("menu");
  const [instruction, setInstruction] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const text = api.getSelectedText();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function runGenerate(action: AiAction, customInstruction?: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setMode("loading");
    setPreview("");
    setError(null);
    try {
      await streamGenerate({
        action,
        text,
        instruction: customInstruction,
        onDelta: (delta) => setPreview((p) => p + delta),
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setMode("preview");
    } catch {
      if (controller.signal.aborted) return; // superseded by a newer selection — ignore
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

const flashcardTooltipKey = new PluginKey("flashcardTooltip");

/**
 * Registered via `.use(flashcardTooltipPlugin(stateRef))`. Takes the
 * shared HighlightStateRef so every toggle reads/writes the latest
 * highlighted_spans, not a value frozen at plugin-construction time.
 *
 * Do NOT also `.use(tooltip)` (the base @milkdown/plugin-tooltip plugin).
 */
export function flashcardTooltipPlugin(stateRef: HighlightStateRef) {
  return $prose(() => {
    let selectionToken = 0;

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
          selectionToken += 1;
          const tokenAtRender = selectionToken;

          const api: MenuAPI = {
            getSelectedText: () => view.state.doc.textBetween(from, to, " "),
            replaceSelection: (text: string) => {
              view.dispatch(view.state.tr.insertText(text, from, to));
            },
            isHighlighted: (text: string) => stateRef.current.highlightedSpans.includes(text),
            toggleHighlight: (text: string) => {
              const { highlightedSpans, onHighlightedSpansChange } = stateRef.current;
              const already = highlightedSpans.includes(text);
              onHighlightedSpansChange(
                already ? highlightedSpans.filter((s) => s !== text) : [...highlightedSpans, text]
              );
            },
          };

          if (!root) root = createRoot(content);
          // key={tokenAtRender}: full remount per selection — resets local
          // state and aborts any in-flight request for the old selection.
          root.render(<SelectionMenuContent key={tokenAtRender} api={api} onClose={() => provider.hide()} />);
        }

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