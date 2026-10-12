import { TypedEmitter, type ChapterMessage } from "@/lib/engine";

/** Messages from the game up to the React UI (`useKimDongBridge` subscribes to this). */
export const chapterEvents = new TypedEmitter<{ message: ChapterMessage }>();

/** Tell the React UI something happened in the game. */
export function sendToHost(message: ChapterMessage): void {
  chapterEvents.emit("message", message);
}
