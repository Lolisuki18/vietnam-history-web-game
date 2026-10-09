import {
  isChapterId,
  isChapterPhase,
  isDialogueId,
  type ChapterOutcome,
  type ChapterPhase,
  type ChapterProgress,
  type DialogueId,
} from "./chapter";

const CHAPTER_SOURCE = "vhg-chapter" as const;
const HOST_SOURCE = "vhg-host" as const;

/** Messages a chapter game (running in an iframe) sends to the host website. */
export type ChapterMessageInput =
  | { type: "chapter:ready" }
  | { type: "chapter:progress"; progress: ChapterProgress }
  /** A letter was picked up; `index` is the pickup order (0-based). */
  | { type: "chapter:letter"; index: number }
  | { type: "chapter:phase"; phase: ChapterPhase }
  | { type: "chapter:dialogue"; id: DialogueId }
  /** Alert meter, 0-100. */
  | { type: "chapter:alert"; value: number }
  | { type: "chapter:complete"; outcome: ChapterOutcome };

export type ChapterMessage = ChapterMessageInput & { source: typeof CHAPTER_SOURCE };

/** Messages the host website sends down to the chapter game. */
export type HostMessageInput =
  /** Handshake: the game answers with `chapter:ready` while it waits for `host:start`. */
  | { type: "host:hello" }
  | { type: "host:start" }
  | { type: "host:restart" }
  | { type: "host:dialogue-closed"; id: DialogueId };

export type HostMessage = HostMessageInput & { source: typeof HOST_SOURCE };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isProgress(value: unknown): value is ChapterProgress {
  return (
    isRecord(value) &&
    isChapterId(value.chapterId) &&
    isFiniteNumber(value.collected) &&
    isFiniteNumber(value.total) &&
    isFiniteNumber(value.percent) &&
    typeof value.completed === "boolean"
  );
}

function isOutcome(value: unknown): value is ChapterOutcome {
  return (
    isRecord(value) &&
    isFiniteNumber(value.lettersCollected) &&
    isFiniteNumber(value.survivedSeconds) &&
    isFiniteNumber(value.hits)
  );
}

export function isChapterMessage(data: unknown): data is ChapterMessage {
  if (!isRecord(data) || data.source !== CHAPTER_SOURCE) return false;
  switch (data.type) {
    case "chapter:ready":
      return true;
    case "chapter:progress":
      return isProgress(data.progress);
    case "chapter:letter":
      return isFiniteNumber(data.index);
    case "chapter:phase":
      return isChapterPhase(data.phase);
    case "chapter:dialogue":
      return isDialogueId(data.id);
    case "chapter:alert":
      return isFiniteNumber(data.value);
    case "chapter:complete":
      return isOutcome(data.outcome);
    default:
      return false;
  }
}

export function isHostMessage(data: unknown): data is HostMessage {
  if (!isRecord(data) || data.source !== HOST_SOURCE) return false;
  switch (data.type) {
    case "host:hello":
    case "host:start":
    case "host:restart":
      return true;
    case "host:dialogue-closed":
      return isDialogueId(data.id);
    default:
      return false;
  }
}

/**
 * Send a message from the game to the page that embeds it.
 * No-op when the game is opened standalone (not inside an iframe).
 */
export function postChapterMessage(message: ChapterMessageInput, targetOrigin: string): void {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage({ source: CHAPTER_SOURCE, ...message }, targetOrigin);
}

/**
 * Listen (in the host website) for messages coming from a chapter iframe.
 * Messages from any origin other than `allowedOrigin` are ignored; when `getSource`
 * returns a window, only messages sent by that window are accepted.
 * Returns an unsubscribe function.
 */
export function listenChapterMessages(
  handler: (message: ChapterMessage) => void,
  allowedOrigin: string,
  getSource?: () => Window | null | undefined,
): () => void {
  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.origin !== allowedOrigin) return;
    const source = getSource?.();
    if (source && event.source !== source) return;
    if (!isChapterMessage(event.data)) return;
    handler(event.data);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

/** Send a message from the host website down to the chapter iframe. */
export function postHostMessage(
  target: Window | null | undefined,
  message: HostMessageInput,
  targetOrigin: string,
): void {
  target?.postMessage({ source: HOST_SOURCE, ...message }, targetOrigin);
}

/**
 * Listen (in the game) for messages from the embedding page.
 * Only messages from `parentOrigin` sent by `window.parent` are accepted.
 * Returns an unsubscribe function.
 */
export function listenHostMessages(
  handler: (message: HostMessage) => void,
  parentOrigin: string,
): () => void {
  const onMessage = (event: MessageEvent<unknown>) => {
    if (event.origin !== parentOrigin || event.source !== window.parent) return;
    if (!isHostMessage(event.data)) return;
    handler(event.data);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
