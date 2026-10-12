"use client";

import { buttonStyles, CodexCard } from "@/components/ui";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

import { CODEX } from "@/features/kimdong/data/story";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { selectIsCodexUnlocked, useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

import { CodexText } from "./codex-content";
import { KimDongArt } from "./codex-illustration";

/**
 * The Codex page. `isCodexUnlocked` comes from the Zustand store, which the game fills in
 * (through the game bridge) when the chapter is completed.
 */
export function CodexPageView() {
  const hydrated = useProgressHydrated();
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked(KIMDONG_ID));

  return (
    <main className="min-h-svh bg-stone-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "sm" })}>
          <ArrowLeft className="size-4" aria-hidden /> Quay lại Trang chủ
        </Link>

        <h1 className="mt-6 font-serif text-3xl leading-tight font-black text-balance text-amber-500 text-glow sm:text-4xl md:text-5xl">
          Hồ sơ Lịch sử: Anh hùng Kim Đồng
        </h1>
        <div className="mt-4 h-px w-32 bg-gradient-to-r from-amber-600 to-transparent" />

        {!hydrated ? null : isCodexUnlocked ? (
          <div className="mt-8 flex animate-rise-in flex-col gap-8 md:flex-row md:items-start md:gap-12">
            <aside className="mx-auto w-full max-w-sm md:sticky md:top-8 md:mx-0 md:w-[22rem] md:shrink-0">
              <CodexCard
                unlocked
                name="Anh hùng Kim Đồng"
                years={CODEX.years}
                role="Người liên lạc nhỏ"
                summary={CODEX.cardSummary}
                art={<KimDongArt />}
              />
              <p className="mt-3 text-center text-xs text-stone-500">
                Minh họa tự vẽ – có thể thay bằng ảnh tư liệu.
              </p>
            </aside>
            <CodexText className="min-w-0 flex-1" />
          </div>
        ) : (
          <div className="mx-auto mt-12 flex max-w-md animate-rise-in flex-col items-center gap-5 rounded-2xl border border-stone-700 bg-neutral-950 px-6 py-10 text-center">
            <Lock className="size-12 text-stone-600" aria-hidden />
            <p className="font-serif text-xl text-stone-300">
              Bạn cần hoàn thành Chapter Kim Đồng để xem hồ sơ này
            </p>
            <Link href="/kimdong" className={buttonStyles({ size: "lg" })}>
              Chơi Chapter Kim Đồng
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
