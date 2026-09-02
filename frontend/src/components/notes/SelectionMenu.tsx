/** Menu that appears when text is selected inside the MarkdownEditor:
 * Paraphrase / Custom request / Mark for flashcards. Operates on plain
 * text (no TipTap) — replacement and highlighting are handled by the
 * parent (MarkdownEditor) via onReplace/onToggleHighlight, which splice
 * or record the given range against the raw markdown string. */
import { useState, type FormEvent } from "react";
import { streamGenerate, type AiAction } from "../../api/ai";

type Mode = "menu" | "custom-input" | "loading" | "preview";

interface SelectionMenuProps {
  text: string;
  top: number;
  left: number;
  isHighlighted: boolean;
  onReplace: (newText: string) => void;
  onToggleHighlight: () => void;
  onClose: () => void;
}

export default function SelectionMenu({
  text,
  top,
  left,
  isHighlighted,
  onReplace,
  onToggleHighlight,
  onClose,
}: SelectionMenuProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [instruction, setInstruction] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      className="fixed z-50 bg-white border border-line rounded-xl shadow-lg text-sm font-sans"
      style={{ top, left, minWidth: mode === "menu" ? 190 : 280, maxWidth: 360 }}
    >
      {mode === "menu" && (
        <div className="py-1">
          <MenuItem label="Paraphrase" onClick={() => runGenerate("paraphrase")} />
          <MenuItem label="Custom request…" onClick={() => setMode("custom-input")} />
          <MenuItem
            label={isHighlighted ? "Unmark for flashcards" : "Mark for flashcards"}
            onClick={onToggleHighlight}
          />
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
          <button
            type="submit"
            disabled={!instruction.trim()}
            className="text-moss text-xs font-medium px-2 py-1.5 disabled:opacity-40 shrink-0"
          >
            Ask
          </button>
        </form>
      )}

      {mode === "loading" && <div className="p-4 text-ink/50">Thinking…</div>}

      {mode === "preview" && (
        <div className="p-4">
          <p className="text-ink/80 whitespace-pre-wrap mb-3">{preview}</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                onReplace(preview);
                onClose();
              }}
              className="text-moss text-xs font-medium"
            >
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

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-paper text-ink"
    >
      {label}
    </button>
  );
}
