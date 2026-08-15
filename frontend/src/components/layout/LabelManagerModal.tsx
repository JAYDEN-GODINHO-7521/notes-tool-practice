import { useState, type FormEvent } from "react";
import { createLabel, deleteLabel, updateLabel } from "../../api/labels";
import type { Label } from "../../types";

interface LabelManagerModalProps {
  labels: Label[];
  onClose: () => void;
  onChanged: () => void; // re-fetch labels in the parent after any mutation
}

export default function LabelManagerModal({ labels, onClose, onChanged }: LabelManagerModalProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setError(null);
    try {
      await createLabel(name);
      setNewName("");
      onChanged();
    } catch {
      setError("That label already exists.");
    }
  }

  async function handleRename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    await updateLabel(id, { name });
    setEditingId(null);
    onChanged();
  }

  async function handleDelete(id: string) {
    await deleteLabel(id);
    onChanged();
  }

  return (
    <div className="fixed inset-0 bg-ink/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg text-ink mb-4">Edit labels</h2>

        <ul className="space-y-1 mb-4 max-h-64 overflow-y-auto">
          {labels.map((label) => (
            <li key={label.id} className="flex items-center gap-2">
              {editingId === label.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(label.id)}
                  onBlur={() => handleRename(label.id)}
                  className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(label.id);
                    setEditingName(label.name);
                  }}
                  className="flex-1 text-left text-sm text-ink px-2 py-1.5 rounded-lg hover:bg-paper"
                >
                  🏷️ {label.name}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(label.id)}
                className="text-ink/40 hover:text-red-600 text-sm px-1"
              >
                ✕
              </button>
            </li>
          ))}
          {labels.length === 0 && (
            <li className="text-sm text-ink/40 px-2 py-1.5">No labels yet.</li>
          )}
        </ul>

        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Create new label"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="text-moss text-sm font-medium px-2 disabled:opacity-40"
          >
            Add
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-center text-sm font-medium text-ink/60 hover:text-ink py-1.5"
        >
          Done
        </button>
      </div>
    </div>
  );
}
