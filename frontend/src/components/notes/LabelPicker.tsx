import { useState, type FormEvent } from "react";
import { createLabel } from "../../api/labels";
import type { Label } from "../../types";

interface LabelPickerProps {
  allLabels: Label[];
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
  onLabelCreated: (label: Label) => void;
}

export default function LabelPicker({
  allLabels,
  selectedLabelIds,
  onChange,
  onLabelCreated,
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");

  function toggle(id: string) {
    onChange(
      selectedLabelIds.includes(id)
        ? selectedLabelIds.filter((x) => x !== id)
        : [...selectedLabelIds, id]
    );
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    try {
      const label = await createLabel(name);
      onLabelCreated(label);
      onChange([...selectedLabelIds, label.id]);
      setNewName("");
    } catch {
      // likely a duplicate name — ignore silently here, full management is in LabelManagerModal
    }
  }

  const selectedLabels = allLabels.filter((l) => selectedLabelIds.includes(l.id));

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-ink/50 hover:text-moss font-sans flex items-center gap-1"
      >
        🏷️ {selectedLabels.length > 0 ? selectedLabels.map((l) => l.name).join(", ") : "Labels"}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-52 bg-white border border-line rounded-xl shadow-lg p-2">
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {allLabels.map((label) => (
              <label
                key={label.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-paper text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedLabelIds.includes(label.id)}
                  onChange={() => toggle(label.id)}
                  className="accent-moss"
                />
                {label.name}
              </label>
            ))}
            {allLabels.length === 0 && (
              <p className="text-xs text-ink/40 px-2 py-1">No labels yet.</p>
            )}
          </div>
          <form onSubmit={handleCreate} className="flex items-center gap-1 mt-2 pt-2 border-t border-line">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New label"
              className="flex-1 min-w-0 rounded-lg border border-line px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-moss/40"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="text-moss text-xs font-medium disabled:opacity-40"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
