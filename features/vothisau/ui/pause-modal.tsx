"use client";

import Link from "next/link";

import { FadeScreen } from "@/components/game/fade-screen";
import { Button, buttonStyles } from "@/components/ui";
import { PHASE_OBJECTIVES } from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";

export interface PauseModalProps {
  open: boolean;
  onResume: () => void;
  onRestart: () => void;
}

/** The game is frozen while this is open (see ChapterShell). ESC is handled by the shell. */
export function PauseModal({ open, onResume, onRestart }: PauseModalProps) {
  const phase = useVoThiSauUiStore((state) => state.phase);
  const collected = useVoThiSauUiStore((state) => state.collected);
  const total = useVoThiSauUiStore((state) => state.total);

  return (
    <FadeScreen show={open}>
      <div className="absolute inset-0 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tạm dừng trò chơi"
          className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-amber-800/60 bg-stone-950 p-6"
        >
          <div>
            <h2 className="font-serif text-2xl font-bold text-amber-400">Tạm dừng</h2>
            <p className="mt-1 text-sm text-stone-300">
              Tư liệu đã nhặt:{" "}
              <strong className="text-amber-400">
                {collected}/{total}
              </strong>
              {phase ? <> · {PHASE_OBJECTIVES[phase]}</> : null}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button size="lg" className="w-full justify-center" onClick={onResume} autoFocus>
              Tiếp tục
            </Button>
            <Button variant="secondary" className="w-full justify-center" onClick={onRestart}>
              Chơi lại từ đầu
            </Button>
            <Link
              href="/"
              className={buttonStyles({
                variant: "ghost",
                size: "sm",
                className: "w-full justify-center text-stone-400",
              })}
            >
              Về trang chủ
            </Link>
          </div>
          <p className="text-xs text-stone-500">Bấm ESC để tiếp tục.</p>
        </div>
      </div>
    </FadeScreen>
  );
}
