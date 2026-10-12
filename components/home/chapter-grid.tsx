"use client";

import { ChapterCard } from "@/components/ui";
import { BookOpen } from "lucide-react";
import Link from "next/link";

import { CHAPTERS, type ChapterInfo } from "@/data/chapters";
import { CHAPTER_VIEWS } from "@/features/registry";
import type { ChapterId } from "@/lib/engine";
import {
  selectIsCodexUnlocked,
  selectIsCompleted,
  useProgressStore,
} from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

/** The chapter cards: finished games are playable, the rest are "coming soon". */
export function ChapterGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {CHAPTERS.map((chapter, index) => (
        <div
          key={chapter.chapterLabel}
          className="animate-rise-in"
          style={{ animationDelay: `${index * 120}ms` }}
        >
          {chapter.id ? (
            <PlayableChapter chapter={chapter} chapterId={chapter.id} />
          ) : (
            <ComingSoonChapter chapter={chapter} />
          )}
        </div>
      ))}
    </div>
  );
}

function ComingSoonChapter({ chapter }: { chapter: ChapterInfo }) {
  return (
    <ChapterCard
      className="h-full"
      chapterLabel={chapter.chapterLabel}
      character={chapter.character}
      title={chapter.title}
      period={chapter.period}
      description={chapter.description}
      status="coming-soon"
      LinkComponent={Link}
    />
  );
}

function PlayableChapter({ chapter, chapterId }: { chapter: ChapterInfo; chapterId: ChapterId }) {
  const hydrated = useProgressHydrated();
  const completed = useProgressStore(selectIsCompleted(chapterId));
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked(chapterId));

  return (
    <ChapterCard
      className="h-full"
      chapterLabel={chapter.chapterLabel}
      character={chapter.character}
      title={chapter.title}
      period={chapter.period}
      description={chapter.description}
      status={hydrated && completed ? "completed" : "unlocked"}
      cover={CHAPTER_VIEWS[chapterId].cover}
      playHref={chapter.href}
      LinkComponent={Link}
      extra={
        hydrated && isCodexUnlocked && chapter.codexHref ? (
          <Link
            href={chapter.codexHref}
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-amber-500 hover:text-amber-300 hover:underline"
          >
            <BookOpen className="size-4" aria-hidden /> Xem hồ sơ lịch sử
          </Link>
        ) : undefined
      }
    />
  );
}
