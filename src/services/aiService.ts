// ==================== AI DISCUSS SERVICE ====================
import type { AiDiscussRequest, AiDiscussStreamEvent } from "@/types/ai";

const AI_DISCUSS_ENDPOINT = "/api/ai-discuss";

/**
 * Streams AI discussion response.
 * - In Electron: uses IPC handler (main process calls Claude API)
 * - In browser dev: uses Vite middleware proxy
 */
export async function streamAiDiscuss(
  request: AiDiscussRequest,
  onEvent: (event: AiDiscussStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const isElectron =
    typeof window !== "undefined" && !!window.electronAPI?.aiDiscuss;

  if (isElectron) {
    return streamViaElectron(request, onEvent);
  }

  return streamViaProxy(request, onEvent, signal);
}

// ==================== ELECTRON IPC ====================
async function streamViaElectron(
  request: AiDiscussRequest,
  onEvent: (event: AiDiscussStreamEvent) => void
): Promise<void> {
  const result = await window.electronAPI!.aiDiscuss(request);

  if (!result.ok) {
    onEvent({ type: "error", content: result.error ?? "AI request failed" });
    return;
  }

  onEvent({ type: "text", content: result.data ?? "" });
  onEvent({ type: "done", content: "" });
}

// ==================== VITE PROXY (STREAMING) ====================
async function streamViaProxy(
  request: AiDiscussRequest,
  onEvent: (event: AiDiscussStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(AI_DISCUSS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    onEvent({
      type: "error",
      content: `HTTP ${response.status}: ${text || response.statusText}`,
    });
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onEvent({ type: "error", content: "No response stream" });
    return;
  }

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);

        if (data === "[DONE]") {
          onEvent({ type: "done", content: "" });
          return;
        }

        try {
          const parsed = JSON.parse(data) as AiDiscussStreamEvent;
          onEvent(parsed);
        } catch {
          // partial JSON, skip
        }
      }
    }

    onEvent({ type: "done", content: "" });
  } finally {
    reader.releaseLock();
  }
}
