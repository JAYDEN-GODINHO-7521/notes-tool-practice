/**
 * "Start a new note" gallery card, styled after Google Docs' template
 * gallery "Blank document" tile: a fixed-size card with a centered plus
 * icon, a caption below it, sitting in its own row above the notes grid
 * — not mixed into Pinned/Others, and not tied to the empty-state
 * anymore (it's always visible). Clicking it creates a real, empty note
 * immediately and opens it in its own tab.
 */
interface NewNoteCardProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function NewNoteCard({ onClick, disabled = false }: NewNoteCardProps) {
  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-36 h-48 rounded-lg border border-line bg-white flex items-center justify-center shadow-3d shadow-3d-hover disabled:opacity-50 disabled:pointer-events-none"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          {/* Four-color plus, echoing the Google Docs tile but in the app's
              own palette (moss / gold) instead of Google's brand colors. */}
          <rect x="16" y="2" width="8" height="16" rx="1.5" fill="#2F5D50" />
          <rect x="16" y="22" width="8" height="16" rx="1.5" fill="#C9922E" />
          <rect x="2" y="16" width="16" height="8" rx="1.5" fill="#3F7364" />
          <rect x="22" y="16" width="16" height="8" rx="1.5" fill="#E4B562" />
        </svg>
      </button>
      <p className="mt-2 text-sm font-sans text-ink">Blank note</p>
    </div>
  );
}