import { isChapterId, type ChapterProgress } from "./chapter";

const MESSAGE_SOURCE = "vhg-chapter" as const;

/** Messages a chapter game (running in an iframe) sends to the host website. */
export type ChapterMessage =
  | { source: typeof MESSAGE_SOURCE; type: "chapter:ready" }
  | { source: typeof MESSAGE_SOURCE; type: "chapter:progress"; progress: ChapterProgress };

export type ChapterMessageInput =
  { type: "chapter:ready" } | { type: "chapter:progress"; progress: ChapterProgress };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProgress(value: unknown): value is ChapterProgress {
  return (
    isRecord(value) &&
    isChapterId(value.chapterId) &&
    typeof value.collected === "number" &&
    typeof value.total === "number" &&
    typeof value.percent === "number" &&
    typeof value.completed === "boolean"
  );
}

export function isChapterMessage(data: unknown): data is ChapterMessage {
  if (!isRecord(data) || data.source !== MESSAGE_SOURCE) return false;
  if (data.type === "chapter:ready") return true;
  return data.type === "chapter:progress" && isProgress(data.progress);
}

/**
 * Send a message from the game to the page that embeds it.
 * No-op when the game is opened standalone (not inside an iframe).
 */
export function postChapterMessage(message: ChapterMessageInput, targetOrigin: string): void {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage({ source: MESSAGE_SOURCE, ...message }, targetOrigin);
}

/**
 * Listen (in the host website) for messages coming from a chapter iframe.
 * Messages from any origin other than `allowedOrigin` are ignored.
 * Returns an unsubscribe function.
 */
export function listenChapterMessages(
  handler: (message: ChapterMessage) => void,
  allowedOrigin: string,
): () => void {
  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.origin !== allowedOrigin) return;
    if (!isChapterMessage(event.data)) return;
    handler(event.data);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
