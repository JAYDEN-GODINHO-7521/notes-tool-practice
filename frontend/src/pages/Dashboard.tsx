import { useCallback, useEffect, useRef, useState } from "react";
import { listLabels } from "../api/labels";
import { createNote, deleteNote, listNotes, reorderNotes, updateNote } from "../api/notes";
import Header from "../components/layout/Header";
import LabelManagerModal from "../components/layout/LabelManagerModal";
import Sidebar from "../components/layout/Sidebar";
import NewNoteCard from "../components/notes/NewNoteCard";
import NoteComposer, { type NoteComposerHandle } from "../components/notes/NoteComposer";
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
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [creating, setCreating] = useState(false);
  const composerRef = useRef<NoteComposerHandle | null>(null);

  const viewMode = user?.notes_view ?? "grid";

  const refresh = useCallback(async () => {
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
  }, [search, showArchived, selectedLabelId]);

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
  }, [refresh]);

  // Notes open in their own browser tab (pages/NoteWindow.tsx). It posts a
  // message back here after every save/delete so the grid stays current.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "keep:note-updated") {
        refresh();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refresh]);

  function openNoteWindow(noteId: string) {
    // No "features" string on purpose — that's what forces a stripped
    // popup instead of a normal tab. A named target means clicking the
    // same note twice reuses its existing tab rather than duplicating it.
    const win = window.open(`/notes/${noteId}`, `keep-note-${noteId}`);
    if (!win) {
      window.alert("Please allow pop-ups for this site to open notes.");
      return;
    }
    win.focus();
  }

  // The one real "create a note" path: the gallery card above the grid.
  // Creates immediately (empty content), refreshes the grid, opens the
  // new note in its own tab — autosave takes over from there.
  async function handleCreateNote() {
    setCreating(true);
    try {
      const note = await createNote({});
      await refresh();
      openNoteWindow(note.id);
    } finally {
      setCreating(false);
    }
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
            <>
              <div className="mb-8">
                <h2 className="text-xs font-mono uppercase tracking-wider text-ink/40 mb-3">
                  Start a new note
                </h2>
                <NewNoteCard onClick={handleCreateNote} disabled={creating} />
              </div>

              <div className="mb-10">
                <NoteComposer ref={composerRef} />
              </div>
            </>
          )}

          {loading ? (
            <p className="text-center text-ink/40 font-sans py-16">Loading…</p>
          ) : (
            <NotesGrid
              notes={notes}
              viewMode={viewMode}
              onOpen={(note) => openNoteWindow(note.id)}
              onTogglePin={handleTogglePin}
              onToggleArchive={handleToggleArchive}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </main>
      </div>

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