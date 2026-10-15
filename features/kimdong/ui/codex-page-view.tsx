"use client";

import { Footer } from "@/components/layout/footer";
import { buttonStyles, SvgIcon } from "@/components/ui";
import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";

import { CODEX } from "@/features/kimdong/data/story";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { selectIsCodexUnlocked, useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

import { CodexText } from "./codex-content";
import { KimDongCodexArt } from "./codex-illustration";

/** The Codex page of Kim Đồng: his card on the left, the historical text on the right. */
export function CodexPageView() {
  const hydrated = useProgressHydrated();
  const isCodexUnlocked = useProgressStore(selectIsCodexUnlocked(KIMDONG_ID));

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-sm text-stone-400">
            <Link href="/" className="hover:text-amber-400">
              Trang chủ
            </Link>
            <ChevronRight className="size-3.5 text-stone-600" aria-hidden />
            <Link href="/#codex" className="hover:text-amber-400">
              Hồ sơ lịch sử
            </Link>
            <ChevronRight className="size-3.5 text-stone-600" aria-hidden />
            <span className="text-amber-400">Kim Đồng</span>
          </nav>

          <h1 className="mt-5 font-serif text-3xl leading-tight font-bold text-balance text-amber-400 sm:text-4xl md:text-5xl">
            Hồ sơ lịch sử: Anh hùng Kim Đồng
          </h1>

          {!hydrated ? null : isCodexUnlocked ? (
            <div className="mt-10 flex animate-rise-in flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <aside className="mx-auto w-full max-w-sm lg:sticky lg:top-24 lg:mx-0 lg:w-[22rem] lg:shrink-0">
                {/* The portrait card is a finished picture (name, years and role are in it). */}
                <figure className="relative -rotate-1 overflow-hidden rounded-sm border-2 border-amber-700/70 bg-stone-900">
                  <KimDongCodexArt />
                  <SvgIcon
                    name="pin"
                    size={22}
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-red-700"
                  />
                </figure>
                <figcaption className="mt-3 text-center text-xs text-stone-500">
                  Tranh minh họa. {CODEX.years}.
                </figcaption>
              </aside>

              <CodexText className="min-w-0 flex-1" />
            </div>
          ) : (
            <div className="mx-auto mt-14 flex max-w-lg animate-rise-in flex-col items-center gap-5 rounded-xl border border-stone-800 bg-stone-900 p-8 text-center">
              <Lock className="size-10 text-amber-600" aria-hidden />
              <p className="text-lg text-stone-200">
                Bạn cần hoàn thành Chapter Kim Đồng để xem hồ sơ này.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/kimdong" className={buttonStyles({ size: "lg" })}>
                  Chơi Chapter Kim Đồng
                </Link>
                <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                  Quay lại Trang chủ
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
