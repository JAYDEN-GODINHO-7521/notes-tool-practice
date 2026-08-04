/** Right-click-style menu that appears when text is selected inside a
 * RichTextEditor: Paraphrase / Translate / Highlight / Expand to understand. */
import type { Editor } from "@tiptap/core";
import { useState } from "react";
import { streamGenerate, type AiAction } from "../../api/ai";

const LANGUAGES = ["Spanish", "French", "German", "Japanese", "Mandarin Chinese", "Portuguese"];

type Mode = "menu" | "language" | "loading" | "preview" | "expand";

interface SelectionMenuProps {
  editor: Editor;
  from: number;
  to: number;
  text: string;
  top: number;
  left: number;
  onClose: () => void;
}

export default function SelectionMenu({ editor, from, to, text, top, left, onClose }: SelectionMenuProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function runGenerate(action: AiAction, targetLanguage?: string) {
    setMode(action === "expand" ? "expand" : "loading");
    setPreview("");
    setError(null);
    try {
      await streamGenerate({
        action,
        text,
        targetLanguage,
        onDelta: (delta) => setPreview((p) => p + delta),
      });
      setMode((m) => (m === "expand" ? "expand" : "preview"));
    } catch {
      setError("Something went wrong. Try again.");
      setMode("menu");
    }
  }

  function handleHighlight() {
    editor.chain().focus().setTextSelection({ from, to }).setHighlight().run();
    onClose();
  }

  function handleReplace() {
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .deleteSelection()
      .insertContent(preview)
      .run();
    onClose();
  }

  return (
    <div
      className="fixed z-50 bg-white border border-line rounded-xl shadow-lg text-sm font-sans"
      style={{ top, left, minWidth: mode === "menu" || mode === "language" ? 170 : 280, maxWidth: 360 }}
    >
      {mode === "menu" && (
        <div className="py-1">
          <MenuItem label="Paraphrase" onClick={() => runGenerate("paraphrase")} />
          <MenuItem label="Translate" onClick={() => setMode("language")} />
          <MenuItem label="Highlight" onClick={handleHighlight} />
          <MenuItem label="Expand to understand" onClick={() => runGenerate("expand")} />
        </div>
      )}

      {mode === "language" && (
        <div className="py-1">
          {LANGUAGES.map((lang) => (
            <MenuItem key={lang} label={lang} onClick={() => runGenerate("translate", lang)} />
          ))}
        </div>
      )}

      {mode === "loading" && <div className="p-4 text-ink/50">Thinking…</div>}

      {mode === "expand" && (
        <div className="p-4">
          <p className="text-ink/80 whitespace-pre-wrap">{preview || "Thinking…"}</p>
          <button type="button" onClick={onClose} className="mt-3 text-moss text-xs font-medium">
            Close
          </button>
        </div>
      )}

      {mode === "preview" && (
        <div className="p-4">
          <p className="text-ink/80 whitespace-pre-wrap mb-3">{preview}</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={handleReplace} className="text-moss text-xs font-medium">
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
