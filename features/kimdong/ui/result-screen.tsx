"use client";

import { Button, buttonStyles, cn } from "@/components/ui";
import { BookOpen, House, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useStagedReveal } from "@/lib/use-staged-reveal";
import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";

/** ms after the screen appears: the closing line fades in, then the actions appear. */
const REVEAL_DELAYS = [400, 3000] as const;

const CODEX_HREF = "/kimdong/codex";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-2 border-amber-800/60 bg-stone-950/70 px-3 py-2 text-center">
      <p className="font-serif text-2xl font-bold text-amber-500">{value}</p>
      <p className="text-xs font-medium text-stone-400">{label}</p>
    </div>
  );
}

/**
 * Shown over the black canvas once the ending has faded out: one line of text fades in, then,
 * after a few seconds, the way to the historical dossier.
 */
export function ResultScreen({ onReplay }: { onReplay: () => void }) {
  const visible = useKimDongUiStore((state) => state.screen === "result");
  const outcome = useKimDongUiStore((state) => state.outcome);
  const total = useKimDongUiStore((state) => state.total);
  const stage = useStagedReveal(visible, REVEAL_DELAYS);
  const codexLinkRef = useRef<HTMLAnchorElement>(null);

  // Keyboard focus goes to the main action as soon as it appears.
  useEffect(() => {
    if (stage >= 2) codexLinkRef.current?.focus();
  }, [stage]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 overflow-y-auto bg-black px-5 py-10 text-center">
      <p
        className={cn(
          "max-w-3xl font-serif text-3xl leading-snug text-balance text-amber-100 transition-opacity duration-[2000ms] text-glow sm:text-5xl",
          stage >= 1 ? "opacity-100" : "opacity-0",
        )}
      >
        Nhiệm vụ hoàn tất... nhưng cái giá phải trả là quá đắt.
      </p>

      <div
        inert={stage < 2}
        className={cn(
          "flex w-full max-w-xl flex-col items-center gap-6 transition-opacity duration-1000",
          stage >= 2 ? "opacity-100" : "invisible opacity-0",
        )}
      >
        {outcome ? (
          <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
            <Stat label="Mật thư" value={`${outcome.lettersCollected}/${total}`} />
            <Stat label="Giây kéo chân địch" value={outcome.survivedSeconds.toFixed(1)} />
            <Stat label="Lần trúng đạn" value={String(outcome.hits)} />
          </div>
        ) : null}

        <Link
          ref={codexLinkRef}
          href={CODEX_HREF}
          className={buttonStyles({ size: "lg", className: "w-full sm:w-auto" })}
        >
          <BookOpen className="size-5" aria-hidden /> Xem Hồ sơ Lịch sử
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={onReplay}>
            <RotateCcw className="size-4" aria-hidden /> Chơi lại
          </Button>
          <Link href="/" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            <House className="size-4" aria-hidden /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
