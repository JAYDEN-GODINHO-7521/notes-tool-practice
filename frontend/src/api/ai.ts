/**
 * Streams selection-action completions from POST /api/ai/generate.
 *
 * This is a POST endpoint (it needs to send the selected text + action in
 * the body), so plain native EventSource can't be used here — it only
 * supports GET. We read the streamed response body directly instead.
 * Cookie auth still works fine via credentials: "include".
 */
export type AiAction = "paraphrase" | "custom";

interface StreamGenerateParams {
  action: AiAction;
  text: string;
  instruction?: string;
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function streamGenerate({
  action,
  text,
  instruction,
  onDelta,
  signal,
}: StreamGenerateParams): Promise<void> {
  const res = await fetch(`${API_URL}/api/ai/generate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, text, instruction }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`AI generate request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data: "));
      if (!dataLine) continue;
      const payload = JSON.parse(dataLine.slice("data: ".length));
      if (typeof payload.delta === "string") onDelta(payload.delta);
    }
  }
}
