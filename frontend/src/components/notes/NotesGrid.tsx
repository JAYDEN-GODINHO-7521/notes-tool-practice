import type { Note } from "../../types";
import NoteCard from "./NoteCard";

interface NotesGridProps {
  notes: Note[];
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export default function NotesGrid({
  notes,
  onOpen,
  onTogglePin,
  onToggleArchive,
  onDelete,
}: NotesGridProps) {
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

  const renderGrid = (list: Note[]) => (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {list.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onOpen={onOpen}
          onTogglePin={onTogglePin}
          onToggleArchive={onToggleArchive}
          onDelete={onDelete}
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
          {renderGrid(pinned)}
        </section>
      )}
      {others.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h2 className="text-xs font-mono uppercase tracking-wider text-ink/40 mb-3">
              Others
            </h2>
          )}
          {renderGrid(others)}
        </section>
      )}
    </div>
  );
}
