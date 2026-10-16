"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";
import { VOTHISAU_ID } from "@/features/vothisau/types";
import { useProgressStore } from "@/stores/progress-store";

export function MenuScreen({ onStart }: { onStart: () => void }) {
  const ready = useVoThiSauUiStore((state) => state.ready);
  const codexUnlocked = useProgressStore((state) => state.codexUnlocked.includes(VOTHISAU_ID));

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg animate-rise-in flex-col gap-6 rounded-xl border border-amber-800/60 bg-stone-950/95 p-6 sm:p-8">
        <header>
          <p className="text-sm text-red-400">Chương 3 · Đất Đỏ, Bà Rịa · 1948 – 1952</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-balance text-amber-400 sm:text-4xl">
            Võ Thị Sáu – Mùa hoa lê-ki-ma
          </h1>
          <p className="mt-2 text-stone-300">
            Bạn vào vai chị Sáu, cô gái Đất Đỏ gan dạ: lẩn qua rừng cao su, hòa vào chợ đông và giữ
            vững khí tiết trước kẻ thù.
          </p>
        </header>

        <section>
          <h2 className="font-serif text-lg font-bold text-amber-300">Ba hồi</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-stone-300 marker:text-amber-600">
            <li>
              <strong>Rừng cao su:</strong> tránh chùm đèn pin của lính, nấp vào bụi rậm, gặp chú
              Bảy.
            </li>
            <li>
              <strong>Chợ Đất Đỏ:</strong> hòa vào đám đông, qua trạm gác, ném lựu đạn rồi tẩu
              thoát.
            </li>
            <li>
              <strong>Phòng thẩm vấn:</strong> mỗi câu bạn đáp là một lần giữ khí tiết.
            </li>
          </ol>
        </section>

        <details className="text-sm text-stone-300">
          <summary className="cursor-pointer font-semibold text-amber-400 hover:text-amber-300">
            Cách điều khiển
          </summary>
          <p className="mt-2">
            <strong>Máy tính:</strong> WASD hoặc phím mũi tên để di chuyển. Phím G, chuột trái hoặc
            Space: ném sỏi (rừng). Space: cắt dây, ngắm và ném lựu đạn (chợ). ESC: tạm dừng.
          </p>
          <p className="mt-1.5">
            <strong>Điện thoại:</strong> cần gạt bên trái để di chuyển, nút Hành động bên phải cho
            mọi thao tác còn lại.
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
              <Link href="/vothisau/codex" className="text-amber-400 hover:text-amber-200">
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
