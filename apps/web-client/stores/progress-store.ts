import type { ChapterId, ChapterOutcome, ChapterProgress } from "@vhg/engine";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChapterCompletion {
  /** ISO timestamp of the (latest) completion. */
  completedAt: string;
  outcome: ChapterOutcome;
}

export interface ProgressState {
  /** Latest letters-collected progress per chapter. */
  chapters: Partial<Record<ChapterId, ChapterProgress>>;
  /** Chapters the player has finished. */
  completions: Partial<Record<ChapterId, ChapterCompletion>>;
  /** Chapters whose historical dossier (Codex) is unlocked. */
  codexUnlocked: ChapterId[];

  setProgress: (progress: ChapterProgress) => void;
  /** Mark a chapter finished and unlock its Codex entry. */
  completeChapter: (chapterId: ChapterId, outcome: ChapterOutcome) => void;
  reset: () => void;
}

/** Selector: has the dossier (Codex) of this chapter been unlocked by finishing the game? */
export const selectIsCodexUnlocked =
  (chapterId: ChapterId) =>
  (state: ProgressState): boolean =>
    state.codexUnlocked.includes(chapterId);

/** Selector: has the player finished this chapter? */
export const selectIsCompleted =
  (chapterId: ChapterId) =>
  (state: ProgressState): boolean =>
    chapterId in state.completions;

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      chapters: {},
      completions: {},
      codexUnlocked: [],

      setProgress: (progress) =>
        set((state) => ({ chapters: { ...state.chapters, [progress.chapterId]: progress } })),
      completeChapter: (chapterId, outcome) =>
        set((state) => ({
          completions: {
            ...state.completions,
            [chapterId]: { completedAt: new Date().toISOString(), outcome },
          },
          codexUnlocked: state.codexUnlocked.includes(chapterId)
            ? state.codexUnlocked
            : [...state.codexUnlocked, chapterId],
        })),
      reset: () => set({ chapters: {}, completions: {}, codexUnlocked: [] }),
    }),
    {
      name: "vhg-progress",
      // Rehydrate on the client after mount (see StoreHydrator) to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
);
