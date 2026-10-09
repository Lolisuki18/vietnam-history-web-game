"use client";

import { BookOpen, CircleCheck } from "lucide-react";
import Link from "next/link";

import { useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

/** Badges on the Kim Đồng chapter card: completion and the unlocked Codex. */
export function ChapterStatus() {
  const hydrated = useProgressHydrated();
  const completed = useProgressStore((state) => !!state.completions["kim-dong"]);
  const codexUnlocked = useProgressStore((state) => state.codexUnlocked.includes("kim-dong"));

  if (!hydrated || !completed) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
        <CircleCheck className="size-4" aria-hidden /> Đã hoàn thành
      </span>
      {codexUnlocked ? (
        <Link
          href="/chapters/kim-dong/codex"
          className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline"
        >
          <BookOpen className="size-4" aria-hidden /> Hồ sơ lịch sử
        </Link>
      ) : null}
    </div>
  );
}
