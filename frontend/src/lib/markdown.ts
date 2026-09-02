/**
 * Very small markdown -> HTML renderer for note previews (NoteCard).
 * Intentionally minimal — headings, bold, italic, bullet/numbered lists,
 * paragraphs — matching the "basic markdown editor" scope from ADR-001 /
 * session-summary-markdown-editor-migration.md. There's no live preview
 * in the editor itself; this is only used for the card/list read view.
 *
 * Highlighted spans (Note.highlighted_spans) are wrapped in <mark> before
 * any markdown transforms run, since they're plain substrings of the raw
 * content, not markdown syntax. A span that's no longer found verbatim
 * (stale — see routers/notes.py's staleness policy) is skipped silently.
 */

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function applyHighlights(escaped: string, highlights: string[]): string {
  let result = escaped;
  for (const span of highlights) {
    if (!span) continue;
    const escapedSpan = escapeHtml(span);
    if (!result.includes(escapedSpan)) continue; // stale span — skip silently
    result = result.split(escapedSpan).join(`<mark>${escapedSpan}</mark>`);
  }
  return result;
}

function inlineFormat(line: string): string {
  return line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export function renderMarkdownPreview(content: string, highlights: string[] = []): string {
  const escaped = applyHighlights(escapeHtml(content ?? ""), highlights);
  const lines = escaped.split("\n");

  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function closeList() {
    if (listType) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);

    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`);
    } else if (bullet) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inlineFormat(bullet[1])}</li>`);
    } else if (numbered) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inlineFormat(numbered[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      html.push(`<p>${inlineFormat(line)}</p>`);
    }
  }
  closeList();

  return html.join("");
}
