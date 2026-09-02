# Session Summary — Markdown Editor Migration (ADR-001) — DESIGN ONLY, NOTHING APPLIED

This session designed a replacement for the TipTap rich-text/LaTeX editor
with a basic markdown editor, and generated a first-draft code scaffold for
it. **Nothing from this session has been applied to the real project —
not the code, and not the `project_design.md` edit.** The updated
`project_design.md` and the `keep-migration/` code package were both only
*delivered as downloadable files* in chat; the user has not copied either
into their actual project. Treat the real project as still being in
whatever state it was in before this session started.

Next session's job: the user will upload the real project. At that point,
(1) decide whether to apply the `project_design.md`/ADR-001 changes at all
(they were never confirmed, just proposed), and (2) if so, rewrite the code
scaffold in §4 against the real files rather than trusting anything
generated here — it was written blind, without the real codebase, and
contains at least one known bug. See §5.

## 1. Decision: replace TipTap editor with a basic markdown editor

User asked for notes to open in a basic markdown editor (textarea + simple
toolbar: bold/italic/headers/lists, no live preview) instead of the
existing TipTap rich-text editor. Scope was narrowed via clarifying
questions into three sub-decisions:

- **Fully replace** TipTap (not a dual-mode toggle) — simpler for a
  single-user app, avoids syncing two content representations.
- **Content storage**: `Note.content` converts from TipTap JSON to a plain
  markdown string.
- **LaTeX**: dropped entirely (was TipTap `Mathematics` extension + KaTeX)
  — partial/inert LaTeX support was judged more confusing than useful given
  the "basic" framing; can be re-added additively later if ever needed.

## 2. Decision: Highlight action redesigned as sidecar metadata

The old Highlight action was a TipTap mark — that mechanism disappears with
TipTap. Explored three replacements (`==text==` markdown syntax, bold as a
proxy signal, sidecar metadata) plus researched how comparable tools handle
this:

- Researched `==text==` support: native in Obsidian/Bear/iA Writer/Logseq,
  **not** supported by GitHub/GitLab/Slack/Discord (no spec covers
  highlighting — not in CommonMark or GFM). Notion doesn't use markdown
  syntax for highlighting at all — it's a separate UI-level rich attribute.
- Found a specific, relevant failure mode: an open Obsidian forum issue
  where `==highlight==` doesn't compose cleanly with `$math$` delimiters —
  confirms the general risk that syntax-based highlighting collides with
  other special characters (moot here since LaTeX is dropped, but the
  underlying ambiguity — literal `==` in code/comparisons colliding with
  highlight-span parsing — is not solved by any tool surveyed).
- **Final decision: sidecar metadata**, not inline syntax at all. Pattern
  borrowed from Kindle/Instapaper/Hypothesis-style annotation: highlights
  are stored as `Note.highlighted_spans: JSON` (a list of plain
  substrings), completely separate from `content`. Applied as `<mark>`
  wrapping only at render time (note card preview / editor "annotated"
  view). Editor gets a "Mark for flashcards" toolbar/selection-menu action
  instead of the old Highlight mark. Flashcard generation reads
  `highlighted_spans` directly (no more inline-markup extraction).
  Staleness (span text no longer found in edited content) is handled by
  silently dropping the span on save — acceptable for single-user, no
  fuzzy-anchoring needed.

**Rationale that generalizes**: every syntax-based option couples a
structural signal ("this matters for flashcards") to the presentation
layer, which is fragile by construction — it already broke once (TipTap
mark → gone when TipTap was dropped) and would break again under any future
storage-format change. Sidecar metadata decouples the signal from the text
entirely.

## 3. `project_design.md` — a proposed rewrite exists, but was NEVER applied

A working copy of `project_design.md` (from project files) was edited in
the sandbox and delivered as a downloadable file, with these proposed
changes:
- Frontmatter overview + new todo `markdown-editor-migration` (status:
  `planned`)
- Tech stack table, architecture mermaid diagram, project structure block,
  REST API contract, data model section, security section — all updated to
  reflect markdown content + `highlighted_spans`
- "LaTeX in Notes" section replaced with "Highlighting for Flashcards"
  section documenting the sidecar-metadata design
- **Appended ADR-001** at the end of the file (context / decision / options
  considered with comparison tables / trade-off analysis / consequences /
  8-item action checklist) — this is the fullest record of the decision
  and its reasoning from this session, even though it was never merged
  into the real project.

**The user confirmed at the end of this session that none of this was
applied.** The real `project_design.md` in the user's actual project
still describes TipTap/KaTeX/LaTeX, with no ADR-001, no
`highlighted_spans`, no `markdown-editor-migration` todo. Do not assume
otherwise in the next session — check the real file's contents before
referencing "the ADR" as if it's already there. The proposed text above is
still useful as a draft to reuse, but it needs to be re-applied (or
rewritten to match whatever's changed in the meantime) once the real
project is available.

## 4. Generated code package — DO NOT trust without verification

Because no live codebase was available in this session's sandbox (only
`project_design.md`, session-summary `.md` files, and `conftest.py` existed
in project files — confirmed via directory search), a full implementation
was written from scratch, reconstructed from **prose descriptions** in
`session-summary-backend-auth-notes.md` and `keep-project-full-context.md`,
not from real source files. This is explicitly flagged as risky — prose
summaries capture decisions but not conventions (exact type names, import
paths, which fields exist, how files are structured).

**Delivered as a package** (`keep-migration/`, with a README describing
apply steps) — files below, with known/likely issues:

| File | Status |
|---|---|
| `backend/app/models/note.py` | **Confirmed wrong**: used ad-hoc `sa.JSON` for the new `highlighted_spans` column instead of the user's real reusable portable-JSON type (user calls it `JSONVariant`, factored out somewhere — location unknown). Also guessed `relationship(back_populates=...)` names and the `note_labels` import path without seeing `label.py`/`user.py`/`flashcard.py`. |
| `backend/alembic/versions/c1a9f3e7d2b4_..._migration.py` | Same `JSONVariant` issue — should use the real portable type for the new column, not raw `sa.JSON()`. TipTap→text flatten logic is a reasonable *approach* but unverified against real stored data shape. |
| `backend/app/schemas/note.py` | Guessed `NoteRead.label_ids: list[uuid.UUID]` — real schema might nest full `Label` objects instead (matching what `LabelPicker` needs). Unverified. |
| `backend/app/routers/notes.py` | **Confirmed bug**: `reorder_notes` takes a bare `note_ids: list[uuid.UUID]` param, which FastAPI will NOT parse from a `{ note_ids: [...] }` JSON body as documented in the REST contract — needs a wrapper Pydantic model (`class ReorderRequest(BaseModel): note_ids: list[uuid.UUID]`) or `Body(embed=True)`. Ownership/404 pattern (`_get_owned_note`) is a reasonable guess matching documented behavior but unverified against the real router. |
| `backend/app/services/flashcard_service.py` | Assumes `llm_service.generate_json()` is `async` and `fsrs_service.new_fsrs_card()` returns a dict spreadable into `Flashcard(**...)` — both guessed, not verified against real `llm_service.py`/`fsrs_service.py`. |
| `backend/app/services/prompts.py` | Lower risk — self-contained prompt-string functions, less likely to conflict with real code, but function signature (`flashcard_generation_prompt(title, content, highlighted_spans)`) needs to match however `flashcard_service.py` actually calls it. |
| `frontend/src/types/index.ts` | **Overwrite risk**: written as a full replacement file with only `Note`/`Label` — the real file almost certainly has more types (User, Flashcard, etc.) and possibly an existing `Label` type this would duplicate/conflict with. Should be merged, not pasted over. |
| `frontend/src/components/notes/MarkdownEditor.tsx` | Net-new component, no real file to conflict with — lowest risk. Assumes Tailwind config really exports `paper`/`ink`/`moss`/`gold`/`line` per the design doc (reasonably safe, documented in `keep-project-full-context.md` §5). |
| `frontend/src/components/notes/SelectionMenu.tsx` | Invented the exact call signature of `streamAiGenerate(params, callback)` — real `api/ai.ts` (fetch + `ReadableStream` SSE reader per the design doc) almost certainly differs. Needs rewrite once the real `api/ai.ts` is seen. |
| `frontend/src/components/notes/NoteCard.tsx` | Contains genuine dead code: a `style={{ backgroundColor: ... ? undefined : undefined }}` no-op left over from not having the real `noteColors.ts` color-mapping util. Needs the real color mapping. |
| `frontend/src/components/notes/NoteEditModal.tsx` | **Worst offender — do not use as a replacement file.** Only handles title/content/highlights. The real component (per file inventory) also handles labels (`LabelPicker`), pin/archive/color toggles, and "Generate Flashcards" (`GenerateFlashcardsButton`), plus a specific `key={note.id}` remount pattern (see gotcha below) that must be preserved. This file is only useful as a reference for how `MarkdownEditor`/`SelectionMenu` wire in — the real modal needs to keep everything else and only swap the editor portion. |
| `frontend/src/api/notes.ts` | **Overwrite risk**: written as if it were the whole file with a comment saying "existing functions stay as-is" — but if pasted over the real file, it deletes everything else in it (`listNotes`, `createNote`, etc.). Should be added to the real file, not replace it. |

## 5. Outstanding / next session's task — EVERYTHING below is still to do

Nothing in this list has started in the real project. In order:

1. **User uploads the real project.** Confirm current real state of
   `project_design.md` (does it still describe TipTap/KaTeX/LaTeX?) and of
   the actual source files before doing anything else.
2. **Re-confirm the design decisions still hold** (§1–2 below): basic
   markdown editor replacing TipTap, LaTeX dropped, Highlight reimplemented
   as `highlighted_spans` sidecar metadata. These were reasoned through
   carefully this session and are likely still right, but they were never
   checked against real code, so sanity-check them once the real note
   model/editor are visible (e.g. confirm `Note.content` really is TipTap
   JSON today, confirm there isn't already some other highlight mechanism
   in place that changes the picture).
3. **If still applying**: update the real `project_design.md` (the draft
   text in §3 above is reusable) and get the user to explicitly confirm
   it's actually saved into project files this time — don't assume a
   delivered file was applied just because it was generated.
4. **Rewrite the code scaffold from §4 against real files**, not from
   memory of this session's guesses. Specifically need to see (not seen
   this session): `backend/app/models/note.py`, `label.py`, `flashcard.py`,
   wherever the portable-JSON type (`JSONVariant` or similar) is defined,
   `backend/app/schemas/note.py`, `backend/app/routers/notes.py`,
   `backend/app/services/fsrs_service.py`, `llm_service.py`,
   `frontend/src/components/notes/NoteEditModal.tsx` (the real one, with
   labels/pin/archive/color/flashcards — see table in §4),
   `noteColors.ts`, `frontend/src/api/notes.ts`, `api/ai.ts`,
   `frontend/src/types/index.ts`.
5. Once real code is visible and changes are actually written into it,
   still need the 8-item action checklist from ADR-001 (migration run
   against real data, frontend deps swap, delete old `RichTextEditor.tsx`,
   etc.).
6. Per the ADR draft, the "reconcile stale highlighted_spans" behavior and
   the content→markdown data migration's lossy TipTap flatten should be
   spot-checked against a copy of real production data before trusting
   them in production.
7. Only mark the `markdown-editor-migration` todo as `in_progress` or
   `completed` once changes are verifiably in the real project — not
   because a session generated files for it.

## File change log (this session)

**Nothing was modified in the real project.** Everything below was
generated in a sandbox and delivered as downloadable chat output only —
the user has not applied any of it.

**Delivered as a proposed rewrite, NOT applied:** `project_design.md`
(overview, todos, tech stack, architecture diagram, project structure, REST
contract, data model, security section, LaTeX section replaced, ADR-001
appended)

**Delivered as a generated code scaffold, NOT applied, UNVERIFIED against
real code (see §4):** `backend/app/models/note.py`,
`backend/alembic/versions/c1a9f3e7d2b4_markdown_content_migration.py`,
`backend/app/schemas/note.py`, `backend/app/routers/notes.py`,
`backend/app/services/flashcard_service.py`, `backend/app/services/prompts.py`,
`frontend/src/types/index.ts`, `frontend/src/components/notes/MarkdownEditor.tsx`,
`frontend/src/components/notes/SelectionMenu.tsx`, `frontend/src/components/notes/NoteCard.tsx`,
`frontend/src/components/notes/NoteEditModal.tsx`, `frontend/src/api/notes.ts`,
`keep-migration/README.md`
