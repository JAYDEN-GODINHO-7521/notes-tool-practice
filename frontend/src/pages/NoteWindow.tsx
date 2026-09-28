import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { deleteNote, getNote, updateNote } from "../api/notes";
import { listLabels } from "../api/labels";
import EditorToolbar from "../components/notes/EditorToolbar";
import GenerateFlashcardsButton from "../components/notes/GenerateFlashcardsButton";
import MilkdownNoteEditor, { type MilkdownEditorHandle } from "../components/notes/MilkdownNoteEditor";
import { NOTE_COLORS } from "../components/notes/noteColors";
import type { Label, Note } from "../types";

const SAVE_DEBOUNCE_MS = 700;

function notifyOpener() {
  try {
    window.opener?.postMessage({ type: "keep:note-updated" }, window.location.origin);
  } catch {
    // opener gone or cross-origin (shouldn't happen same-origin) — ignore
  }
}

export default function NoteWindow() {
  const { noteId } = useParams<{ noteId: string }>();
  const editorRef = useRef<MilkdownEditorHandle | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [note, setNote] = useState<Note | null>(null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [highlightedSpans, setHighlightedSpans] = useState<string[]>([]);
  const [color, setColor] = useState("default");
  const [pinned, setPinned] = useState(false);
  const [archived, setArchived] = useState(false);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (!noteId) return;
    (async () => {
      try {
        const [n, l] = await Promise.all([getNote(noteId), listLabels()]);
        setNote(n);
        setLabels(l);
        setTitle(n.title);
        setContent(n.content);
        setHighlightedSpans(n.highlighted_spans);
        setColor(n.color);
        setPinned(n.pinned);
        setArchived(n.archived);
        setLabelIds(n.labels.map((label) => label.id));
      } catch {
        setError("Couldn't load this note.");
      } finally {
        setLoading(false);
      }
    })();
  }, [noteId]);

  useEffect(() => {
    document.title = title.trim() ? `${title} — Keep` : "Untitled note — Keep";
  }, [title]);

  const save = useCallback(
    async (
      overrides: Partial<{
        title: string;
        content: string;
        highlighted_spans: string[];
        color: string;
        pinned: boolean;
        archived: boolean;
        label_ids: string[];
      }> = {}
    ) => {
      if (!noteId) return;
      setSaveStatus("saving");
      try {
        const nextContent = overrides.content ?? content;
        const cleanedSpans = (overrides.highlighted_spans ?? highlightedSpans).filter((s) =>
          nextContent.includes(s)
        );
        await updateNote(noteId, {
          title: overrides.title ?? title,
          content: nextContent,
          highlighted_spans: cleanedSpans,
          color: overrides.color ?? color,
          pinned: overrides.pinned ?? pinned,
          archived: overrides.archived ?? archived,
          label_ids: overrides.label_ids ?? labelIds,
        });
        setSaveStatus("saved");
        notifyOpener();
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [noteId, title, content, highlightedSpans, color, pinned, archived, labelIds]
  );

  // Debounced autosave on every text edit — there's no explicit "Save"
  // button, the toolbar just shows saved/saving/unsaved status.
  useEffect(() => {
    if (loading) return;
    // setSaveStatus was called synchronously as the first line here,
    // which trips react-hooks/set-state-in-effect. Deferred via
    // setTimeout(0) to a macrotask instead — same pattern already used
    // for Dashboard.tsx's refreshLabels() (see project gotcha #9).
    const markUnsavedTimer = setTimeout(() => setSaveStatus("unsaved"), 0);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(), SAVE_DEBOUNCE_MS);
    return () => {
      clearTimeout(markUnsavedTimer);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, highlightedSpans]);

  // Best-effort: catch the case where the user closes the OS window
  // directly instead of clicking our Close button. Can't reliably await
  // an async save here (browsers cut off async work on unload), so this
  // mainly covers "the last debounced save already landed, just tell the
  // opener to refresh" rather than guaranteeing a final save.
  useEffect(() => {
    window.addEventListener("beforeunload", notifyOpener);
    return () => window.removeEventListener("beforeunload", notifyOpener);
  }, []);

  function handleTogglePin() {
    const next = !pinned;
    setPinned(next);
    save({ pinned: next });
  }

  function handleToggleArchive() {
    const next = !archived;
    setArchived(next);
    save({ archived: next });
  }

  function handleColorChange(next: string) {
    setColor(next);
    save({ color: next });
  }

  function handleLabelIdsChange(next: string[]) {
    setLabelIds(next);
    save({ label_ids: next });
  }

  function handleLabelCreated(label: Label) {
    setLabels((prev) => [...prev, label]);
  }

  async function handleDelete() {
    if (!noteId) return;
    if (!window.confirm("Delete this note?")) return;
    await deleteNote(noteId);
    notifyOpener();
    window.close();
  }

  async function handleClose() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await save();
    window.close();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/40 font-sans">
        Loading…
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink/60 font-sans">
        {error ?? "Note not found."}
      </div>
    );
  }

  const bg = NOTE_COLORS[color]?.bg ?? NOTE_COLORS.default.bg;

  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>
      <EditorToolbar
        editorRef={editorRef}
        editorReady={editorReady}
        pinned={pinned}
        archived={archived}
        color={color}
        allLabels={labels}
        selectedLabelIds={labelIds}
        onTogglePin={handleTogglePin}
        onToggleArchive={handleToggleArchive}
        onColorChange={handleColorChange}
        onLabelIdsChange={handleLabelIdsChange}
        onLabelCreated={handleLabelCreated}
        onDelete={handleDelete}
        onClose={handleClose}
        saveStatus={saveStatus}
      />

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl w-full mx-auto">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent font-display text-2xl text-ink placeholder:text-ink/40 focus:outline-none mb-4"
        />
        <MilkdownNoteEditor
          ref={editorRef}
          content={content}
          onChange={setContent}
          highlightedSpans={highlightedSpans}
          onHighlightedSpansChange={setHighlightedSpans}
          onReadyChange={setEditorReady}
          autoFocus
        />

        <div className="mt-6 pt-4 border-t border-line/60">
          <GenerateFlashcardsButton noteId={note.id} />
        </div>
      </div>
    </div>
  );
}