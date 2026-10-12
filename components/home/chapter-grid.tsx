"use client";

import { ChapterCard } from "@vhg/ui";
import { BookOpen } from "lucide-react";
import Link from "next/link";

import { KimDongArt } from "@/components/kim-dong/codex-illustration";
import { CHAPTERS } from "@/data/chapters";
import {
  selectIsCodexUnlocked,
  selectIsCompleted,
  useProgressStore,
} from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

/** The chapter cards: Kim Đồng is playable, the rest are "coming soon". */
export function ChapterGrid() {
  const hydrated = useProgressHydrated();
  const completed = useProgressStore(selectIsCompleted("kim-dong"));
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked("kim-dong"));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {CHAPTERS.map((chapter, index) => {
        const playable = chapter.id !== undefined;
        return (
          <div
            key={chapter.chapterLabel}
            className="animate-rise-in"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <ChapterCard
              className="h-full"
              chapterLabel={chapter.chapterLabel}
              character={chapter.character}
              title={chapter.title}
              period={chapter.period}
              description={chapter.description}
              status={!playable ? "coming-soon" : hydrated && completed ? "completed" : "unlocked"}
              cover={playable ? <KimDongArt /> : undefined}
              playHref={chapter.href}
              LinkComponent={Link}
              extra={
                playable && hydrated && isCodexUnlocked && chapter.codexHref ? (
                  <Link
                    href={chapter.codexHref}
                    className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-amber-500 hover:text-amber-300 hover:underline"
                  >
                    <BookOpen className="size-4" aria-hidden /> Xem hồ sơ lịch sử
                  </Link>
                ) : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}
