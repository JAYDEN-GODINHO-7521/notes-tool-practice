import type { JSONContent } from "@tiptap/core";
import { useEffect, useState } from "react";
import { createNote, deleteNote, listNotes, updateNote } from "../api/notes";
import Header from "../components/layout/Header";
import NoteComposer from "../components/notes/NoteComposer";
import NoteEditModal from "../components/notes/NoteEditModal";
import NotesGrid from "../components/notes/NotesGrid";
import type { Note } from "../types";

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [openNote, setOpenNote] = useState<Note | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listNotes({
        search: search || undefined,
        archived: showArchived,
      });
      setNotes(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(refresh, 200); // light debounce for search typing
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, showArchived]);

  async function handleCreate(input: { title: string; content: JSONContent; color: string }) {
    await createNote(input);
    await refresh();
  }

  async function handleSave(
    id: string,
    input: { title: string; content: JSONContent; color: string }
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

  return (
    <div className="min-h-screen bg-paper">
      <Header
        search={search}
        onSearchChange={setSearch}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived((v) => !v)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!showArchived && (
          <div className="mb-10">
            <NoteComposer onCreate={handleCreate} />
          </div>
        )}

        {loading ? (
          <p className="text-center text-ink/40 font-sans py-16">Loading…</p>
        ) : (
          <NotesGrid
            notes={notes}
            onOpen={setOpenNote}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            onDelete={handleDelete}
          />
        )}
      </main>

      {openNote && (
        <NoteEditModal
          key={openNote.id}
          note={openNote}
          onClose={() => setOpenNote(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
