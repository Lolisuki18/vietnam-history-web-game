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

/** Each card hangs a little crooked, like pinned paper: tilt (deg) and drop (px) by position. */
const HANG = [
  { tilt: -0.7, drop: 0 },
  { tilt: 0.5, drop: 6 },
  { tilt: -0.35, drop: 2 },
] as const;

/** The chapter cards: finished games are playable, the rest are "coming soon". */
export function ChapterGrid() {
  return (
    <div className="grid grid-cols-1 gap-8 pt-3 md:grid-cols-3">
      {CHAPTERS.map((chapter, index) => {
        const hang = HANG[index % HANG.length]!;
        return (
          <div
            key={chapter.chapterLabel}
            className="animate-rise-in"
            style={{
              animationDelay: `${index * 120}ms`,
              rotate: `${hang.tilt}deg`,
              translate: `0 ${hang.drop}px`,
            }}
          >
            {chapter.id ? (
              <PlayableChapter chapter={chapter} chapterId={chapter.id} wear={index} />
            ) : (
              <ComingSoonChapter chapter={chapter} wear={index} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ComingSoonChapter({ chapter, wear }: { chapter: ChapterInfo; wear: number }) {
  return (
    <ChapterCard
      wear={wear}
      className="h-full"
      chapterLabel={chapter.chapterLabel}
      character={chapter.character}
      title={chapter.title}
      period={chapter.period}
      description={chapter.description}
      status="coming-soon"
      difficulty={chapter.difficulty}
      estimatedTime={chapter.estimatedTime}
      tag={chapter.tag}
      LinkComponent={Link}
    />
  );
}

function PlayableChapter({
  chapter,
  chapterId,
  wear,
}: {
  chapter: ChapterInfo;
  chapterId: ChapterId;
  wear: number;
}) {
  const hydrated = useProgressHydrated();
  const completed = useProgressStore(selectIsCompleted(chapterId));
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked(chapterId));

  return (
    <ChapterCard
      wear={wear}
      className="h-full"
      chapterLabel={chapter.chapterLabel}
      character={chapter.character}
      title={chapter.title}
      period={chapter.period}
      description={chapter.description}
      status={hydrated && completed ? "completed" : "unlocked"}
      cover={CHAPTER_VIEWS[chapterId].cover}
      playHref={chapter.href}
      difficulty={chapter.difficulty}
      estimatedTime={chapter.estimatedTime}
      tag={chapter.tag}
      LinkComponent={Link}
      extra={
        hydrated && isCodexUnlocked && chapter.codexHref ? (
          <Link
            href={chapter.codexHref}
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-200 hover:underline"
          >
            <BookOpen className="size-4" aria-hidden /> Xem hồ sơ lịch sử
          </Link>
        ) : undefined
      }
    />
  );
}
