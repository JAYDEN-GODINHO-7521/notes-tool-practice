/**
 * Note card (grid + list variants). Verified against the real
 * frontend/src/components/notes/NoteCard.tsx and its caller
 * (NotesGrid.tsx) from the JAYDEN-GODINHO-7521/notes-tool-practice repo —
 * prop names/shapes below match that contract exactly (onOpen,
 * onTogglePin(note), onToggleArchive(note), onDelete(note), listView
 * boolean, isDragging/isDragOver/onDragEnd). An earlier version of this
 * file invented a different, incompatible prop shape and was missing the
 * Delete button entirely — this replaces it.
 *
 * Only the content-rendering internals changed from the original TipTap
 * version: `generateHTML(note.content, [...])` -> lib/markdown.ts's
 * renderMarkdownPreview(), which also paints highlighted_spans as <mark>.
 */
import { useMemo } from "react";
import type { Note } from "../../types";
import { renderMarkdownPreview } from "../../lib/markdown";
import { NOTE_COLORS } from "./noteColors";

interface NoteCardProps {
  note: Note;
  onOpen: (note: Note) => void;
  onTogglePin: (note: Note) => void;
  onToggleArchive: (note: Note) => void;
  onDelete: (note: Note) => void;
  listView?: boolean;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export default function NoteCard({
  note,
  onOpen,
  onTogglePin,
  onToggleArchive,
  onDelete,
  listView = false,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: NoteCardProps) {
  const color = NOTE_COLORS[note.color] ?? NOTE_COLORS.default;

  const html = useMemo(
    () => renderMarkdownPreview(note.content, note.highlighted_spans),
    [note.content, note.highlighted_spans]
  );

  const dragProps = draggable
    ? {
        draggable: true,
        onDragStart,
        onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          onDragOver?.(e);
        },
        onDrop: (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          onDrop?.(e);
        },
        onDragEnd,
      }
    : {};

  const labelChips = note.labels.length > 0 && (
    <div className="flex flex-wrap gap-1 mt-2">
      {note.labels.map((label) => (
        <span
          key={label.id}
          className="text-[10px] font-mono uppercase tracking-wide text-ink/50 bg-ink/5 rounded-full px-2 py-0.5"
        >
          {label.name}
        </span>
      ))}
    </div>
  );

  if (listView) {
    return (
      <div
        {...dragProps}
        onClick={() => onOpen(note)}
        className={`group flex items-center gap-4 rounded-xl border border-line ${color.bg} px-4 py-3 cursor-pointer shadow-3d shadow-3d-hover ${
          isDragging ? "dragging-note" : ""
        } ${isDragOver ? "ring-2 ring-moss/50" : ""}`}
      >
        {note.pinned && <span className="text-gold shrink-0">📌</span>}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            {note.title && <h3 className="font-display text-sm text-ink truncate">{note.title}</h3>}
            <div
              className="prose prose-sm max-w-none font-sans text-ink/70 truncate [&_*]:inline"
              // eslint-disable-next-line react/no-danger -- our own
              // minimal markdown renderer (lib/markdown.ts), not raw
              // model/user HTML
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
          {note.labels.length > 0 && (
            <div className="flex gap-1 mt-1">
              {note.labels.map((l) => (
                <span key={l.id} className="text-[10px] font-mono text-ink/40">
                  #{l.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note);
            }}
            className="text-xs text-ink/50 hover:text-moss"
          >
            {note.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note);
            }}
            className="text-xs text-ink/50 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...dragProps}
      className={`group relative rounded-2xl border border-line ${color.bg} p-4 cursor-pointer shadow-3d shadow-3d-hover ${
        isDragging ? "dragging-note" : ""
      } ${isDragOver ? "ring-2 ring-moss/50" : ""}`}
      onClick={() => onOpen(note)}
    >
      {note.pinned && (
        <span className="absolute -top-2 -right-2 text-gold text-lg" title="Pinned">
          📌
        </span>
      )}

      {note.title && (
        <h3 className="font-display text-lg text-ink mb-1 truncate">{note.title}</h3>
      )}

      <div
        className="prose prose-sm max-w-none font-sans text-ink/90 line-clamp-6"
        // eslint-disable-next-line react/no-danger -- our own minimal
        // markdown renderer (lib/markdown.ts), not raw model/user HTML
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {labelChips}

      <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note);
          }}
          className="text-xs text-ink/50 hover:text-moss font-sans"
        >
          {note.pinned ? "Unpin" : "Pin"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleArchive(note);
          }}
          className="text-xs text-ink/50 hover:text-moss font-sans"
        >
          {note.archived ? "Unarchive" : "Archive"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          className="text-xs text-ink/50 hover:text-red-600 font-sans"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
