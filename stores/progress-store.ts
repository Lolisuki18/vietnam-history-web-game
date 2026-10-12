import type { ChapterId, ChapterOutcome, ChapterProgress } from "@/lib/engine";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  emptyProgress,
  migrateProgress,
  PROGRESS_VERSION,
  type ProgressData,
} from "./progress-migrate";

export type { ChapterCompletion, ProgressData } from "./progress-migrate";

export interface ProgressState extends ProgressData {
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
      ...emptyProgress(),

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
      reset: () => set(emptyProgress()),
    }),
    {
      name: "vhg-progress",
      version: PROGRESS_VERSION,
      // Old or damaged saves are repaired instead of crashing or being thrown away.
      migrate: (persisted, version) => migrateProgress(persisted, version),
      // `migrate` only runs for older versions; validate current-version saves as well.
      merge: (persisted, current) => ({
        ...current,
        ...migrateProgress(persisted, PROGRESS_VERSION),
      }),
      // Save only the data, not the actions.
      partialize: ({ chapters, completions, codexUnlocked }): ProgressData => ({
        chapters,
        completions,
        codexUnlocked,
      }),
      // Rehydrate on the client after mount (see StoreHydrator) to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
);
