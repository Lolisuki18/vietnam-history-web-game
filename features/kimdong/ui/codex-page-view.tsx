"use client";

import { Footer } from "@/components/layout/footer";
import { buttonStyles, CodexCard, DongSonDrum } from "@/components/ui";
import { ArrowLeft, ChevronRight, Lock, Play } from "lucide-react";
import Link from "next/link";

import { CODEX } from "@/features/kimdong/data/story";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { selectIsCodexUnlocked, useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

import { CodexText } from "./codex-content";
import { KimDongArt } from "./codex-illustration";

/**
 * The Codex page for Hero Kim Dong with tabs, trading card, and historical dossier.
 */
export function CodexPageView() {
  const hydrated = useProgressHydrated();
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked(KIMDONG_ID));

  return (
    <div className="flex min-h-screen flex-col bg-stone-950">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
            <Link href="/" className="hover:text-amber-400">
              Trang chủ
            </Link>
            <ChevronRight className="size-3.5 text-stone-600" />
            <Link href="/#codex" className="hover:text-amber-400">
              Tàng Kinh Các
            </Link>
            <ChevronRight className="size-3.5 text-stone-600" />
            <span className="text-amber-400">Hồ sơ Kim Đồng</span>
          </div>

          {/* Header Title with Dong Son emblem */}
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <DongSonDrum size={28} className="text-amber-500" />
              <span className="text-xs font-bold tracking-[0.25em] text-red-500 uppercase">
                Tư liệu Lịch sử Cách mạng
              </span>
            </div>

            <h1 className="font-serif text-3xl leading-tight font-black text-balance text-amber-400 text-glow sm:text-4xl md:text-5xl">
              Hồ sơ Lịch sử: Anh hùng Kim Đồng
            </h1>

            <div className="h-0.5 w-36 bg-gradient-to-r from-amber-500 to-transparent" />
          </div>

          {!hydrated ? null : isCodexUnlocked ? (
            <div className="mt-10 flex animate-rise-in flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <aside className="mx-auto w-full max-w-sm lg:sticky lg:top-24 lg:mx-0 lg:w-[22rem] lg:shrink-0">
                <CodexCard
                  unlocked
                  name="Anh hùng Kim Đồng"
                  years={CODEX.years}
                  role="Người liên lạc nhỏ"
                  summary={CODEX.cardSummary}
                  art={<KimDongArt />}
                />
                <p className="mt-3.5 text-center text-xs text-stone-500">
                  Minh họa nghệ thuật tái hiện núi rừng Cao Bằng và khăn quàng đỏ.
                </p>
              </aside>

              <CodexText className="min-w-0 flex-1" />
            </div>
          ) : (
            <div className="mx-auto mt-14 flex max-w-lg animate-rise-in flex-col items-center gap-6 rounded-2xl border border-amber-900/40 bg-stone-900/80 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
              <div className="relative flex size-20 items-center justify-center rounded-full border-2 border-amber-600/70 bg-stone-950/90 text-amber-500 shadow-xl">
                <Lock className="size-9 text-amber-500" aria-hidden />
                <span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-red-700 text-xs text-white">
                  !
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="font-serif text-2xl font-bold text-amber-400">
                  Hồ Sơ Đang Bị Niêm Phong
                </h2>
                <p className="text-sm leading-relaxed text-stone-300">
                  Bạn cần hoàn thành nhiệm vụ dã chiến trong <strong>Chương 1: Kim Đồng</strong> để
                  giải mã toàn bộ mật thư và mở khóa hồ sơ lịch sử này.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/kimdong"
                  className={buttonStyles({
                    size: "lg",
                    className: "font-bold shadow-lg shadow-red-950/60",
                  })}
                >
                  <Play className="size-5" aria-hidden /> Chơi Chapter Kim Đồng ngay
                </Link>
                <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  <ArrowLeft className="size-4" aria-hidden /> Về trang chủ
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
