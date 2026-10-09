"use client";

import { listenChapterMessages } from "@vhg/engine";
import { Button, Card } from "@vhg/ui";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { CHAPTER_KIMDONG_ORIGIN, CHAPTER_KIMDONG_URL } from "@/lib/env";
import { useProgressStore } from "@/stores/progress-store";

export function ChapterFrame() {
  const progress = useProgressStore((state) => state.chapters["kim-dong"]);
  const setProgress = useProgressStore((state) => state.setProgress);
  const reset = useProgressStore((state) => state.reset);

  useEffect(
    () =>
      listenChapterMessages((message) => {
        if (message.type === "chapter:progress") setProgress(message.progress);
      }, CHAPTER_KIMDONG_ORIGIN),
    [setProgress],
  );

  const percent = progress?.percent ?? 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="overflow-hidden rounded-2xl border border-stone-300 bg-stone-900 shadow-sm">
        <iframe
          src={CHAPTER_KIMDONG_URL}
          title="Chương Kim Đồng"
          className="aspect-[4/3] w-full"
          allow="fullscreen"
        />
      </div>

      <Card className="flex h-fit flex-col gap-4">
        <h2 className="text-lg font-bold text-stone-900">Tiến độ chương</h2>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-3 overflow-hidden rounded-full bg-stone-200"
        >
          <div
            className="h-full rounded-full bg-red-700 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-sm text-stone-600">
          {progress
            ? `Đã thu thập ${progress.collected}/${progress.total} mật thư`
            : "Hãy bắt đầu chơi để ghi nhận tiến độ."}
        </p>
        {progress?.completed ? (
          <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
            <CheckCircle2 className="size-4" aria-hidden /> Hoàn thành chương!
          </p>
        ) : null}
        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden /> Xoá tiến độ
        </Button>
      </Card>
    </div>
  );
}
