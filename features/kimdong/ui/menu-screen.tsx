"use client";

import { Button, buttonStyles } from "@/components/ui";
import { ArrowLeft, BookOpen, Loader2, Play } from "lucide-react";
import Link from "next/link";

import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { useProgressStore } from "@/stores/progress-store";

export function MenuScreen({ onStart }: { onStart: () => void }) {
  const ready = useKimDongUiStore((state) => state.ready);
  const codexUnlocked = useProgressStore((state) => state.codexUnlocked.includes(KIMDONG_ID));

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <span className="font-serif text-sm font-semibold tracking-[0.25em] text-red-500 uppercase">
          Chương 1 · Cao Bằng, 1943
        </span>
        <h1 className="font-serif text-4xl font-black tracking-tight text-amber-500 text-glow sm:text-5xl">
          Kim Đồng – Người liên lạc nhỏ
        </h1>
        <p className="max-w-md text-base text-amber-100/80">
          Nhập vai Dền, băng qua rừng núi Cao Bằng, nhặt mật thư và tránh tầm mắt của lính tuần.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button className="px-8 py-3 text-base" onClick={onStart} disabled={!ready} autoFocus>
            {ready ? (
              <>
                <Play className="size-5" aria-hidden /> Bắt đầu
              </>
            ) : (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden /> Đang tải game…
              </>
            )}
          </Button>
          {codexUnlocked ? (
            <Link
              href="/kimdong/codex"
              className={buttonStyles({ variant: "secondary", size: "lg" })}
            >
              <BookOpen className="size-5" aria-hidden /> Hồ sơ lịch sử
            </Link>
          ) : null}
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-100/80 hover:text-white"
        >
          <ArrowLeft className="size-4" aria-hidden /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}
