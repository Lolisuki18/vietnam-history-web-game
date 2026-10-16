import { clamp } from "./math";

/**
 * Every chapter (one historical figure = one game) of the site. Adding a game starts here; the
 * `Record<ChapterId, ...>` tables (features/registry.tsx) then fail to compile until the new
 * chapter is described there too.
 */
export const CHAPTER_IDS = ["kim-dong", "vo-thi-sau"] as const;
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

/** Summary stats of a finished chapter; each game decides which numbers it reports. */
export type ChapterOutcome = Record<string, number>;

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
