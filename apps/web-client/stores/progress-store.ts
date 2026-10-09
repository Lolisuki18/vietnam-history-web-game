import type { ChapterId, ChapterProgress } from "@vhg/engine";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ProgressState {
  chapters: Partial<Record<ChapterId, ChapterProgress>>;
  setProgress: (progress: ChapterProgress) => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      chapters: {},
      setProgress: (progress) =>
        set((state) => ({ chapters: { ...state.chapters, [progress.chapterId]: progress } })),
      reset: () => set({ chapters: {} }),
    }),
    {
      name: "vhg-progress",
      // Rehydrate on the client after mount (see StoreHydrator) to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
);
