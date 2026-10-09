"use client";

import { Button } from "@vhg/ui";
import { ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";

import { useProgressStore } from "@/stores/progress-store";
import { useProgressHydrated } from "@/stores/use-progress-hydrated";

import { CodexContent } from "./codex-content";

/** Standalone Codex page: shows the dossier once the chapter has been completed. */
export function CodexPageView() {
  const hydrated = useProgressHydrated();
  const unlocked = useProgressStore((state) => state.codexUnlocked.includes("kim-dong"));

  return (
    <main className="min-h-screen bg-stone-950 px-4 py-8">
      <div className="mx-auto mb-6 flex w-full max-w-3xl">
        <Link href="/">
          <Button variant="secondary">
            <ArrowLeft className="size-4" aria-hidden /> Về trang chủ
          </Button>
        </Link>
      </div>

      {!hydrated ? null : unlocked ? (
        <CodexContent />
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 pt-16 text-center text-amber-50">
          <Lock className="size-10 text-amber-300" aria-hidden />
          <h1 className="text-2xl font-bold">Hồ sơ chưa được mở khóa</h1>
          <p className="text-amber-100/80">
            Hoàn thành Chương 1 – Kim Đồng, Người liên lạc nhỏ để xem hồ sơ lịch sử.
          </p>
          <Link href="/chapters/kim-dong">
            <Button>Chơi chương 1</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
