import { listenHostMessages, postChapterMessage, type ChapterMessageInput } from "@vhg/engine";

import { hostEvents } from "./events";

/** Origin of the page that embeds this game; messages are only exchanged with it. */
const PARENT_ORIGIN = import.meta.env.VITE_PARENT_ORIGIN ?? "http://localhost:3000";

/** Send a message to the embedding page (no-op when opened standalone). */
export function sendToHost(message: ChapterMessageInput): void {
  postChapterMessage(message, PARENT_ORIGIN);
}

interface DebugMessage {
  source?: string;
  type?: string;
  target?: string;
  ms?: number;
}

/** Dev-only: lets the host page trigger the cheats across origins. */
function connectDebug(): () => void {
  const onMessage = (event: MessageEvent<DebugMessage | null>) => {
    if (event.origin !== PARENT_ORIGIN || event.source !== window.parent) return;
    const data = event.data;
    if (data?.source !== "vhg-debug") return;
    if (data.type === "win") window.debugWinGame?.();
    else if (data.type === "goto" && data.target) window.debugGoto?.(data.target);
    else if (data.type === "hold" && data.target) window.debugHold?.(data.target, data.ms ?? 500);
    else if (data.type === "stats") {
      // Answer the host page with the same snapshot `window.debugStats()` returns.
      window.parent.postMessage(
        { source: "vhg-debug-reply", stats: window.debugStats?.() },
        PARENT_ORIGIN,
      );
    }
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}

/** Wire host messages to `hostEvents`. Returns a function that removes every listener. */
export function connectHost(): () => void {
  const stopHost = listenHostMessages((message) => {
    switch (message.type) {
      case "host:hello":
        hostEvents.emit("hello", undefined);
        break;
      case "host:start":
        hostEvents.emit("start", undefined);
        break;
      case "host:restart":
        hostEvents.emit("restart", undefined);
        break;
      case "host:dialogue-closed":
        hostEvents.emit("dialogue-closed", message.id);
        break;
    }
  }, PARENT_ORIGIN);
  const stopDebug = import.meta.env.DEV ? connectDebug() : undefined;

  return () => {
    stopHost();
    stopDebug?.();
  };
}
