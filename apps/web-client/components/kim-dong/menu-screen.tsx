"use client";

import { Button } from "@vhg/ui";
import { ArrowLeft, BookOpen, Loader2, Play } from "lucide-react";
import Link from "next/link";

import { useKimDongUiStore } from "@/stores/kimdong-ui-store";
import { useProgressStore } from "@/stores/progress-store";

interface MenuScreenProps {
  onStart: () => void;
  onOpenCodex: () => void;
}

export function MenuScreen({ onStart, onOpenCodex }: MenuScreenProps) {
  const ready = useKimDongUiStore((state) => state.ready);
  const codexUnlocked = useProgressStore((state) => state.codexUnlocked.includes("kim-dong"));

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <span className="text-sm font-semibold tracking-widest text-amber-300 uppercase">
          Chương 1 · Cao Bằng, 1943
        </span>
        <h1 className="text-4xl font-black tracking-tight text-amber-50 sm:text-5xl">
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
            <Button variant="secondary" className="px-6 py-3 text-base" onClick={onOpenCodex}>
              <BookOpen className="size-5" aria-hidden /> Hồ sơ lịch sử
            </Button>
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
