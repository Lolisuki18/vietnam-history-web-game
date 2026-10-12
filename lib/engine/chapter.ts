import { clamp } from "./math";

export const CHAPTER_IDS = ["kim-dong"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

/** Story beats a chapter reports to the host page (drives HUD objectives). */
export const CHAPTER_PHASES = ["intro", "explore", "rhythm", "climax", "runner", "ending"] as const;
export type ChapterPhase = (typeof CHAPTER_PHASES)[number];

/** Dialogues the game can ask the host page to display. */
export const DIALOGUE_IDS = ["intro"] as const;
export type DialogueId = (typeof DIALOGUE_IDS)[number];

export interface ChapterProgress {
  chapterId: ChapterId;
  /** Items collected so far. */
  collected: number;
  /** Items required to finish the chapter. */
  total: number;
  /** 0-100, derived from collected / total. */
  percent: number;
  completed: boolean;
}

/** Summary sent when a chapter ends. */
export interface ChapterOutcome {
  lettersCollected: number;
  /** Seconds spent escaping during the auto-runner finale. */
  survivedSeconds: number;
  /** Number of times the runner was hit. */
  hits: number;
}

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === "string" && (CHAPTER_IDS as readonly string[]).includes(value);
}

export function isChapterPhase(value: unknown): value is ChapterPhase {
  return typeof value === "string" && (CHAPTER_PHASES as readonly string[]).includes(value);
}

export function isDialogueId(value: unknown): value is DialogueId {
  return typeof value === "string" && (DIALOGUE_IDS as readonly string[]).includes(value);
}

export function createChapterProgress(
  chapterId: ChapterId,
  collected: number,
  total: number,
): ChapterProgress {
  const safeTotal = Math.max(1, Math.floor(total));
  const safeCollected = clamp(Math.floor(collected), 0, safeTotal);
  return {
    chapterId,
    collected: safeCollected,
    total: safeTotal,
    percent: Math.round((safeCollected / safeTotal) * 100),
    completed: safeCollected >= safeTotal,
  };
}
