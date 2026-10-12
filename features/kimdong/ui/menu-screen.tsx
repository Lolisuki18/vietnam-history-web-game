"use client";

import { Button, DongSonDrum } from "@/components/ui";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Keyboard,
  Loader2,
  Mail,
  Play,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import { KIMDONG_ID } from "@/features/kimdong/types";
import { useProgressStore } from "@/stores/progress-store";

export function MenuScreen({ onStart }: { onStart: () => void }) {
  const ready = useKimDongUiStore((state) => state.ready);
  const codexUnlocked = useProgressStore((state) => state.codexUnlocked.includes(KIMDONG_ID));
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md">
      {/* Background Dong Son Watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-10 select-none"
      >
        <DongSonDrum size={600} className="animate-spin-slow text-amber-400" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl animate-rise-in flex-col items-center gap-6 rounded-2xl border-2 border-amber-700/60 bg-stone-950/90 p-6 text-center shadow-2xl shadow-black sm:p-8">
        {/* Header Tag */}
        <div className="flex items-center gap-2 rounded-full border border-red-700/60 bg-red-950/80 px-3.5 py-1 text-xs font-bold tracking-[0.2em] text-amber-200 uppercase">
          <ShieldAlert className="size-3.5 text-red-400" />
          <span>Mật Lệnh Dã Chiến · Cao Bằng, 1943</span>
        </div>

        {/* Chapter Title */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-serif text-3xl font-black tracking-tight text-amber-400 text-glow sm:text-4xl md:text-5xl">
            Kim Đồng – Người Liên Lạc Nhỏ
          </h1>
          <p className="font-serif text-sm text-stone-300 italic">
            Nhập vai anh Nông Văn Dền – Đội trưởng Đội Nhi đồng Cứu quốc đầu tiên
          </p>
        </div>

        {/* Tactical Objectives Briefing Box */}
        <div className="w-full rounded-xl border border-amber-900/50 bg-stone-900/70 p-4 text-left text-sm text-stone-300 backdrop-blur">
          <p className="mb-2.5 flex items-center gap-2 font-serif text-sm font-bold text-amber-400 uppercase">
            <Sparkles className="size-4 text-amber-400" />
            Nhiệm vụ chiến khu:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <span>
                Dò đường băng rừng và thu thập đủ <strong>5 mảnh mật thư</strong> bị thất lạc.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Eye className="mt-0.5 size-4 shrink-0 text-red-400" />
              <span>
                Ẩn nấp trong <strong>bụi rậm</strong> hoặc <strong>lặn dưới lòng suối</strong> để
                tránh tầm nhìn lính tuần.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-emerald-400" />
              <span>Bảo vệ cán bộ an toàn và dẫn dụ quân địch khi tình thế hiểm nguy.</span>
            </li>
          </ul>
        </div>

        {/* Controls Help Toggle */}
        <div className="w-full">
          <button
            type="button"
            onClick={() => setShowControls(!showControls)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400/90 hover:text-amber-300"
          >
            <Keyboard className="size-3.5" />
            <span>{showControls ? "Thu gọn hướng dẫn phím" : "Xem hướng dẫn điều khiển phím"}</span>
          </button>

          {showControls && (
            <div className="mt-3 animate-rise-in rounded-lg border border-stone-800 bg-stone-900/90 p-3 text-left text-xs text-stone-300">
              <p>
                <strong>Máy tính (PC/Laptop):</strong> WASD hoặc phím Mũi tên để di chuyển. Nhấp
                chuột trái hoặc phím G để ném sỏi đánh lạc hướng. Phím Space để lặn / ném đá / nhảy.
              </p>
              <p className="mt-1.5">
                <strong>Điện thoại/Cảm ứng:</strong> Cần gạt ảo bên trái để di chuyển. Chạm nút Hành
                Động bên phải để ném sỏi / tương tác.
              </p>
            </div>
          )}
        </div>

        {/* Main Action Buttons */}
        <div className="flex w-full flex-col items-center gap-3 pt-1">
          <Button
            size="lg"
            className="w-full justify-center px-8 py-3.5 text-base font-bold tracking-wide shadow-xl shadow-red-950/70 sm:w-auto"
            onClick={onStart}
            disabled={!ready}
            autoFocus
          >
            {ready ? (
              <>
                <Play className="size-5 fill-current" aria-hidden /> BẮT ĐẦU NHIỆM VỤ
              </>
            ) : (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden /> Đang nạp trò chơi…
              </>
            )}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            {codexUnlocked && (
              <Link
                href="/kimdong/codex"
                className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-200"
              >
                <BookOpen className="size-3.5" /> Xem Hồ sơ Lịch sử
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-200"
            >
              <ArrowLeft className="size-3.5" /> Quay lại Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
