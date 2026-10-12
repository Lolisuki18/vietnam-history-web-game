import {
  isChapterId,
  type ChapterId,
  type ChapterOutcome,
  type ChapterProgress,
} from "@/lib/engine";

export interface ChapterCompletion {
  /** ISO timestamp of the (latest) completion. */
  completedAt: string;
  outcome: ChapterOutcome;
}

/** The part of the progress store that is saved to localStorage. */
export interface ProgressData {
  /** Latest items-collected progress per chapter. */
  chapters: Partial<Record<ChapterId, ChapterProgress>>;
  /** Chapters the player has finished. */
  completions: Partial<Record<ChapterId, ChapterCompletion>>;
  /** Chapters whose historical dossier (Codex) is unlocked. */
  codexUnlocked: ChapterId[];
}

/**
 * Version of the saved shape. Bump it whenever `ProgressData` changes in a way old saves cannot
 * be read as-is, and add a step for the previous version to `migrateProgress`.
 *
 * - 0: the first releases (no version was stored)
 * - 1: same shape, but every entry is validated when it is loaded
 */
export const PROGRESS_VERSION = 1;

export function emptyProgress(): ProgressData {
  return { chapters: {}, completions: {}, codexUnlocked: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function toProgress(id: ChapterId, value: unknown): ChapterProgress | null {
  if (!isRecord(value)) return null;
  const { collected, total, percent, completed } = value;
  if (!isFiniteNumber(collected) || !isFiniteNumber(total) || !isFiniteNumber(percent)) return null;
  if (typeof completed !== "boolean") return null;
  return { chapterId: id, collected, total, percent, completed };
}

function toCompletion(value: unknown): ChapterCompletion | null {
  if (!isRecord(value) || typeof value.completedAt !== "string" || !isRecord(value.outcome)) {
    return null;
  }
  const outcome: ChapterOutcome = {};
  for (const [key, amount] of Object.entries(value.outcome)) {
    if (isFiniteNumber(amount)) outcome[key] = amount;
  }
  return { completedAt: value.completedAt, outcome };
}

/**
 * Turn whatever was found in localStorage into valid `ProgressData`. Unknown chapters (a game that
 * was removed), malformed entries and non-objects are dropped instead of crashing the app, and
 * a Codex only stays unlocked when its chapter is known.
 */
export function migrateProgress(persisted: unknown, fromVersion: number): ProgressData {
  void fromVersion; // Every version so far reads the same way; branch on it for future shapes.
  const data = emptyProgress();
  if (!isRecord(persisted)) return data;

  if (isRecord(persisted.chapters)) {
    for (const [id, value] of Object.entries(persisted.chapters)) {
      if (!isChapterId(id)) continue;
      const progress = toProgress(id, value);
      if (progress) data.chapters[id] = progress;
    }
  }
  if (isRecord(persisted.completions)) {
    for (const [id, value] of Object.entries(persisted.completions)) {
      if (!isChapterId(id)) continue;
      const completion = toCompletion(value);
      if (completion) data.completions[id] = completion;
    }
  }
  if (Array.isArray(persisted.codexUnlocked)) {
    for (const id of persisted.codexUnlocked) {
      if (isChapterId(id) && !data.codexUnlocked.includes(id)) data.codexUnlocked.push(id);
    }
  }
  return data;
}
