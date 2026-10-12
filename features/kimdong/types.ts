import type { ChapterId, ChapterProgress } from "@/lib/engine";

/** The id of this game in the chapter list (`CHAPTER_IDS`); the only place the literal appears. */
export const KIMDONG_ID = "kim-dong" as const satisfies ChapterId;

/** Story beats the game reports to the UI (drives HUD objectives). */
export const CHAPTER_PHASES = ["intro", "explore", "rhythm", "climax", "runner", "ending"] as const;
export type ChapterPhase = (typeof CHAPTER_PHASES)[number];

/** Dialogues the game can ask the UI to display. */
export const DIALOGUE_IDS = ["intro"] as const;
export type DialogueId = (typeof DIALOGUE_IDS)[number];

/** Numbers shown on the result screen. */
export type KimDongOutcome = {
  lettersCollected: number;
  /** Seconds spent escaping during the auto-runner finale. */
  survivedSeconds: number;
  /** Number of times the runner was hit. */
  hits: number;
};

/** Messages the game sends up to the React UI. */
export type ChapterMessage =
  | { type: "chapter:ready" }
  | { type: "chapter:progress"; progress: ChapterProgress }
  /** A letter was picked up; `index` is the pickup order (0-based). */
  | { type: "chapter:letter"; index: number }
  | { type: "chapter:phase"; phase: ChapterPhase }
  | { type: "chapter:dialogue"; id: DialogueId }
  /** Alert meter, 0-100. */
  | { type: "chapter:alert"; value: number }
  | { type: "chapter:complete"; outcome: KimDongOutcome };

/** Commands the React UI sends down to the game. */
export type HostMessage =
  | { type: "host:start" }
  | { type: "host:restart" }
  | { type: "host:dialogue-closed"; id: DialogueId };
