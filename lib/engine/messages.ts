import type { ChapterOutcome, ChapterPhase, ChapterProgress, DialogueId } from "./chapter";

/** Messages a chapter game sends up to the React UI that wraps it. */
export type ChapterMessage =
  | { type: "chapter:ready" }
  | { type: "chapter:progress"; progress: ChapterProgress }
  /** A letter was picked up; `index` is the pickup order (0-based). */
  | { type: "chapter:letter"; index: number }
  | { type: "chapter:phase"; phase: ChapterPhase }
  | { type: "chapter:dialogue"; id: DialogueId }
  /** Alert meter, 0-100. */
  | { type: "chapter:alert"; value: number }
  | { type: "chapter:complete"; outcome: ChapterOutcome };

/** Commands the React UI sends down to the chapter game. */
export type HostMessage =
  | { type: "host:start" }
  | { type: "host:restart" }
  | { type: "host:dialogue-closed"; id: DialogueId };
