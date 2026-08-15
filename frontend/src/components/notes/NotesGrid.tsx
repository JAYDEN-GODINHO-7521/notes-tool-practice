import { useState } from "react";
import type { Note } from "../../types";
import NoteCard from "./NoteCard";

interface NotesGridProps {
  notes: Note[];
  viewMode: "grid" | "list";
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
  onReorder: (noteIds: string[]) => void;
}

export default function NotesGrid({
  notes,
  viewMode,
  onOpen,
  onTogglePin,
  onToggleArchive,
  onDelete,
  onReorder,
}: NotesGridProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);

  if (notes.length === 0) {
    return (
      <div className="text-center py-24 text-ink/40 font-sans">
        <p className="font-display text-xl text-ink/60 mb-1">Nothing here yet</p>
        <p className="text-sm">Notes you create will show up here.</p>
      </div>
    );
  }

  function handleDrop(sectionNotes: Note[], targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = sectionNotes.map((n) => n.id);
    const fromIndex = ids.indexOf(draggedId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const reordered = [...ids];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedId);

    setDraggedId(null);
    setDragOverId(null);
    onReorder(reordered);
  }

  const renderCards = (list: Note[]) =>
    viewMode === "grid" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {list.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
            draggable
            isDragging={draggedId === note.id}
            isDragOver={dragOverId === note.id}
            onDragStart={() => setDraggedId(note.id)}
            onDragOver={() => setDragOverId(note.id)}
            onDrop={() => handleDrop(list, note.id)}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
          />
        ))}
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        {list.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onToggleArchive={onToggleArchive}
            onDelete={onDelete}
            listView
            draggable
            isDragging={draggedId === note.id}
            isDragOver={dragOverId === note.id}
            onDragStart={() => setDraggedId(note.id)}
            onDragOver={() => setDragOverId(note.id)}
            onDrop={() => handleDrop(list, note.id)}
            onDragEnd={() => {
              setDraggedId(null);
              setDragOverId(null);
            }}
          />
        ))}
      </div>
    );

  return (
    <div className="space-y-8">
      {pinned.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-ink/40 mb-3">
            Pinned
          </h2>
          {renderCards(pinned)}
        </section>
      )}
      {others.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h2 className="text-xs font-mono uppercase tracking-wider text-ink/40 mb-3">
              Others
            </h2>
          )}
          {renderCards(others)}
        </section>
      )}
    </div>
  );
}
