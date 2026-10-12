"use client";

import { Button, buttonStyles } from "@/components/ui";
import { ArrowLeft, Play, RotateCcw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { PHASE_OBJECTIVES } from "@/features/kimdong/data/story";
import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";

import { FadeScreen } from "./fade-screen";

export interface PauseModalProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
}

export function PauseModal({ open, onResume, onRestart }: PauseModalProps) {
  const phase = useKimDongUiStore((state) => state.phase);
  const collected = useKimDongUiStore((state) => state.collected);
  const total = useKimDongUiStore((state) => state.total);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onResume();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onResume]);

  return (
    <FadeScreen show={open}>
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tạm dừng trò chơi"
          className="flex w-full max-w-md animate-rise-in flex-col items-center gap-6 rounded-2xl border-2 border-amber-600/70 bg-stone-950/95 p-6 text-center shadow-2xl shadow-black sm:p-8"
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-700/60 bg-amber-950/80 px-3 py-1 text-xs font-bold tracking-widest text-amber-300 uppercase">
            <ShieldAlert className="size-3.5" />
            <span>Tạm Dừng Trận Đánh</span>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-3xl font-black text-amber-400 text-glow">Kim Đồng</h2>
            <p className="text-xs text-stone-400">
              Mật thư đã thu thập:{" "}
              <strong className="text-amber-400">
                {collected}/{total}
              </strong>
            </p>
          </div>

          {phase && (
            <div className="w-full rounded-lg border border-amber-900/40 bg-stone-900/70 p-3 text-xs text-stone-300">
              <span className="font-semibold text-amber-500">Mục tiêu hiện tại:</span>{" "}
              {PHASE_OBJECTIVES[phase]}
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            <Button
              size="lg"
              className="w-full justify-center font-bold"
              onClick={onResume}
              autoFocus
            >
              <Play className="size-4" /> Tiếp tục nhiệm vụ
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
              onClick={onRestart}
            >
              <RotateCcw className="size-4" /> Bắt đầu lại từ đầu
            </Button>

            <Link
              href="/"
              className={buttonStyles({
                variant: "ghost",
                size: "sm",
                className: "w-full justify-center text-stone-400 hover:text-stone-200",
              })}
            >
              <ArrowLeft className="size-4" /> Rút lui về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </FadeScreen>
  );
}
