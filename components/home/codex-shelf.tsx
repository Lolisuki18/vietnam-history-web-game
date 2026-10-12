"use client";

import { buttonStyles, CodexCard } from "@/components/ui";
import Link from "next/link";

import { CHAPTERS, type ChapterInfo } from "@/data/chapters";
import { CHAPTER_VIEWS } from "@/features/registry";
import type { ChapterId } from "@/lib/engine";
import { selectIsCodexUnlocked, useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

/** One historical card per chapter; a card turns from a padlock into a biography once unlocked. */
export function CodexShelf() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CHAPTERS.map((chapter) =>
        chapter.id ? (
          <PlayableCodexCard key={chapter.id} chapter={chapter} chapterId={chapter.id} />
        ) : (
          <CodexCard
            key={chapter.chapterLabel}
            unlocked={false}
            name={chapter.character}
            role={chapter.title}
            summary=""
            lockedHint="Hồ sơ lịch sử này sẽ được giải mật khi chương mới ra mắt."
          />
        ),
      )}
    </div>
  );
}

function PlayableCodexCard({ chapter, chapterId }: { chapter: ChapterInfo; chapterId: ChapterId }) {
  const hydrated = useProgressHydrated();
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked(chapterId));
  const unlocked = hydrated && isCodexUnlocked;
  const { codex } = CHAPTER_VIEWS[chapterId];

  return (
    <CodexCard
      unlocked={unlocked}
      name={codex.name}
      years={codex.years}
      role={codex.role}
      summary={codex.summary}
      art={codex.art}
      lockedHint={codex.lockedHint}
      footer={
        unlocked && chapter.codexHref ? (
          <Link
            href={chapter.codexHref}
            className={buttonStyles({
              variant: "secondary",
              className:
                "w-full border-amber-600/60 font-semibold text-amber-300 hover:border-amber-400 hover:text-stone-950",
            })}
          >
            Mở xem toàn văn hồ sơ
          </Link>
        ) : undefined
      }
    />
  );
}
