"use client";

import { Button } from "@/components/ui";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { useProgressStore } from "@/stores/progress-store";

export function MenuScreen({ onStart }: { onStart: () => void }) {
  const ready = useKimDongUiStore((state) => state.ready);
  const codexUnlocked = useProgressStore((state) => state.codexUnlocked.includes(KIMDONG_ID));

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg animate-rise-in flex-col gap-6 rounded-xl border border-amber-800/60 bg-stone-950/95 p-6 sm:p-8">
        <header>
          <p className="text-sm text-red-400">Chương 1 · Cao Bằng, 1943</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-balance text-amber-400 sm:text-4xl">
            Kim Đồng – Người liên lạc nhỏ
          </h1>
          <p className="mt-2 text-stone-300">
            Bạn vào vai Nông Văn Dền, đội trưởng đầu tiên của Đội Nhi đồng Cứu quốc.
          </p>
        </header>

        <section>
          <h2 className="font-serif text-lg font-bold text-amber-300">Nhiệm vụ</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-stone-300 marker:text-amber-600">
            <li>
              Đi qua rừng và nhặt đủ <strong>5 mảnh mật thư</strong> bị thất lạc.
            </li>
            <li>
              Nấp trong <strong>bụi rậm</strong> hoặc <strong>lặn dưới suối</strong> để lính tuần
              không nhìn thấy.
            </li>
            <li>Bảo vệ cán bộ, và đánh lạc hướng quân địch khi cần.</li>
          </ul>
        </section>

        <details className="text-sm text-stone-300">
          <summary className="cursor-pointer font-semibold text-amber-400 hover:text-amber-300">
            Cách điều khiển
          </summary>
          <p className="mt-2">
            <strong>Máy tính:</strong> WASD hoặc phím mũi tên để di chuyển. Bấm chuột trái hoặc phím
            G để ném sỏi. Phím Space để ném đá hoặc nhảy.
          </p>
          <p className="mt-1.5">
            <strong>Điện thoại:</strong> cần gạt bên trái để di chuyển, nút Hành động bên phải để
            ném sỏi.
          </p>
        </details>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full justify-center py-3 text-base"
            onClick={onStart}
            disabled={!ready}
            autoFocus
          >
            {ready ? (
              "Bắt đầu"
            ) : (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden /> Đang tải trò chơi…
              </>
            )}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm">
            {codexUnlocked && (
              <Link href="/kimdong/codex" className="text-amber-400 hover:text-amber-200">
                Xem hồ sơ lịch sử
              </Link>
            )}
            <Link href="/" className="text-stone-400 hover:text-stone-200">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
