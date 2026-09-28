/**
 * Purely decorative "Take a note" bar. Expands into a typable textarea on
 * click/focus — you can type into it, the cursor works normally — but
 * nothing is ever saved or sent to the backend from here. Actual note
 * creation now happens through a separate "new note" action (button,
 * design pending) that creates a real note directly and opens it in its
 * own tab. This component exists purely as the familiar quick-capture
 * visual, with the save wiring intentionally removed.
 */
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface NoteComposerHandle {
  focus: () => void;
}

const NoteComposer = forwardRef<NoteComposerHandle>(function NoteComposer(_props, ref) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setExpanded(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    },
  }));

  function handleClose() {
    // Deliberately no save/create call here — whatever was typed is
    // discarded. This box is decorative only.
    setDraft("");
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full max-w-xl mx-auto block text-left rounded-2xl border border-line bg-white px-5 py-3.5 text-ink/50 font-sans text-sm shadow-3d-static hover:shadow-3d-hover"
      >
        Take a note…
      </button>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-line bg-white p-5 shadow-3d">
      <textarea
        ref={textareaRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Take a note…"
        rows={3}
        className="w-full resize-none bg-transparent font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleClose}
          className="text-sm font-medium text-moss hover:text-moss-dark px-3 py-1.5"
        >
          Close
        </button>
      </div>
    </div>
  );
});

export default NoteComposer;