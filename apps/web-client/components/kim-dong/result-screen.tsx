"use client";

import { Button } from "@vhg/ui";
import { Award, BookOpen, House, RotateCcw } from "lucide-react";
import Link from "next/link";

import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

interface ResultScreenProps {
  onReplay: () => void;
  onOpenCodex: () => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-amber-200/20 bg-black/30 px-4 py-3 text-center">
      <p className="text-2xl font-black text-amber-50">{value}</p>
      <p className="text-xs font-medium text-amber-100/70">{label}</p>
    </div>
  );
}

/** Shown over the black canvas after the ending: the outcome and what was unlocked. */
export function ResultScreen({ onReplay, onOpenCodex }: ResultScreenProps) {
  const outcome = useKimDongUiStore((state) => state.outcome);
  const total = useKimDongUiStore((state) => state.total);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black p-6">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <Award className="size-14 text-amber-300" aria-hidden />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-widest text-amber-300 uppercase">
            Hoàn thành Chương 1
          </p>
          <h1 className="text-3xl font-black tracking-tight text-amber-50 sm:text-4xl">
            Kim Đồng – Người liên lạc nhỏ
          </h1>
          <p className="text-amber-100/80">
            Nhờ sự hy sinh dũng cảm của anh, cán bộ đã kịp rút lui an toàn.
          </p>
        </div>

        {outcome ? (
          <div className="grid w-full grid-cols-3 gap-3">
            <Stat label="Mật thư thu thập" value={`${outcome.lettersCollected}/${total}`} />
            <Stat label="Giây kéo chân địch" value={outcome.survivedSeconds.toFixed(1)} />
            <Stat label="Lần trúng đạn" value={String(outcome.hits)} />
          </div>
        ) : null}

        <p className="rounded-lg border border-emerald-400/30 bg-emerald-950/40 px-4 py-2 text-sm text-emerald-200">
          Đã mở khóa Chương 1 và hồ sơ lịch sử “Tưởng niệm Anh hùng Kim Đồng”.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onOpenCodex} autoFocus>
            <BookOpen className="size-4" aria-hidden /> Xem hồ sơ lịch sử
          </Button>
          <Button variant="secondary" onClick={onReplay}>
            <RotateCcw className="size-4" aria-hidden /> Chơi lại
          </Button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-amber-100/80 hover:text-white"
          >
            <House className="size-4" aria-hidden /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
