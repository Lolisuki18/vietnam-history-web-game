import { clamp } from "./math";

export const CHAPTER_IDS = ["kim-dong"] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];

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

export function isChapterId(value: unknown): value is ChapterId {
  return typeof value === "string" && (CHAPTER_IDS as readonly string[]).includes(value);
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
