import { useEffect, useState } from "react";
import { listLabels } from "../api/labels";
import { createNote, deleteNote, listNotes, reorderNotes, updateNote } from "../api/notes";
import Header from "../components/layout/Header";
import LabelManagerModal from "../components/layout/LabelManagerModal";
import Sidebar from "../components/layout/Sidebar";
import NoteComposer from "../components/notes/NoteComposer";
import NoteEditModal from "../components/notes/NoteEditModal";
import NotesGrid from "../components/notes/NotesGrid";
import { useAuth } from "../hooks/useAuth";
import type { Label, Note } from "../types";

export default function Dashboard() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<Note | null>(null);
  const [showLabelManager, setShowLabelManager] = useState(false);

  const viewMode = user?.notes_view ?? "grid";

  async function refresh() {
    setLoading(true);
    try {
      const data = await listNotes({
        search: search || undefined,
        archived: showArchived,
        labelId: selectedLabelId ?? undefined,
      });
      setNotes(data);
    } finally {
      setLoading(false);
    }
  }

  async function refreshLabels() {
    const data = await listLabels();
    setLabels(data);
  }

  useEffect(() => {
    const t = setTimeout(refreshLabels, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(refresh, 200); 
    return () => clearTimeout(t);
  }, [search, showArchived, selectedLabelId]);

  function handleLabelCreated(label: Label) {
    setLabels((prev) => [...prev, label].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function handleCreate(input: {
    title: string;
    content: string;
    highlighted_spans: string[];
    color: string;
    label_ids: string[];
  }) {
    await createNote(input);
    await refresh();
  }

  async function handleSave(
    id: string,
    input: {
      title: string;
      content: string;
      highlighted_spans: string[];
      color: string;
      label_ids: string[];
    }
  ) {
    await updateNote(id, input);
    await refresh();
  }

  async function handleTogglePin(note: Note) {
    await updateNote(note.id, { pinned: !note.pinned });
    await refresh();
  }

  async function handleToggleArchive(note: Note) {
    await updateNote(note.id, { archived: !note.archived });
    await refresh();
  }

  async function handleDelete(note: Note) {
    await deleteNote(note.id);
    await refresh();
  }

  async function handleReorder(noteIds: string[]) {
    // Optimistic local reorder for instant feedback, then persist + refresh.
    setNotes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      const reorderedSubset = noteIds.map((id) => byId.get(id)).filter(Boolean) as Note[];
      const reorderedIds = new Set(noteIds);
      let cursor = 0;
      return prev.map((n) => (reorderedIds.has(n.id) ? reorderedSubset[cursor++] : n));
    });
    await reorderNotes(noteIds);
    await refresh();
  }

  return (
    <div className="min-h-screen bg-paper">
      <Header search={search} onSearchChange={setSearch} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-6">
        <Sidebar
          labels={labels}
          selectedLabelId={selectedLabelId}
          showArchived={showArchived}
          onSelectAll={() => {
            setShowArchived(false);
            setSelectedLabelId(null);
          }}
          onSelectArchived={() => {
            setShowArchived(true);
            setSelectedLabelId(null);
          }}
          onSelectLabel={(id) => {
            setSelectedLabelId(id);
            setShowArchived(false);
          }}
          onOpenLabelManager={() => setShowLabelManager(true)}
        />

        <main className="flex-1 min-w-0 py-8">
          {!showArchived && (
            <div className="mb-10">
              <NoteComposer
                allLabels={labels}
                onLabelCreated={handleLabelCreated}
                onCreate={handleCreate}
              />
            </div>
          )}

          {loading ? (
            <p className="text-center text-ink/40 font-sans py-16">Loading…</p>
          ) : (
            <NotesGrid
              notes={notes}
              viewMode={viewMode}
              onOpen={setOpenNote}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </main>
      </div>

      {openNote && (
        <NoteEditModal
          key={openNote.id}
          note={openNote}
          allLabels={labels}
          onLabelCreated={handleLabelCreated}
          onClose={() => setOpenNote(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {showLabelManager && (
        <LabelManagerModal
          labels={labels}
          onClose={() => setShowLabelManager(false)}
          onChanged={refreshLabels}
        />
      )}
    </div>
  );
}
