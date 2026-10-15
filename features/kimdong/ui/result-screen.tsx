"use client";

import { Button, buttonStyles, cn } from "@/components/ui";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import { useStagedReveal } from "@/lib/use-staged-reveal";

/** ms after the screen appears: the closing line fades in, then the actions appear. */
const REVEAL_DELAYS = [400, 2400] as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900 p-3 text-center">
      <p className="font-serif text-2xl font-bold text-amber-400">{value}</p>
      <p className="mt-0.5 text-xs text-stone-400">{label}</p>
    </div>
  );
}

/** End of the chapter: the closing line first, then the numbers and what to do next. */
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
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-black/95 px-5 py-8 text-center">
      <div className="flex w-full max-w-xl flex-col items-center gap-8">
        <h2
          className={cn(
            "font-serif text-3xl leading-snug font-bold text-balance text-amber-300 transition-opacity duration-[1500ms] sm:text-4xl",
            stage >= 1 ? "opacity-100" : "opacity-0",
          )}
        >
          Nhiệm vụ hoàn tất... nhưng cái giá phải trả là quá đắt.
        </h2>

        <div
          inert={stage < 2}
          className={cn(
            "flex w-full flex-col items-center gap-5 transition-all duration-1000",
            stage >= 2 ? "translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0",
          )}
        >
          {outcome ? (
            <div className="grid w-full grid-cols-3 gap-3">
              <Stat label="Mật thư" value={`${outcome.lettersCollected}/${total}`} />
              <Stat label="Giây cầm chân địch" value={outcome.survivedSeconds.toFixed(1)} />
              <Stat label="Lần trúng đạn" value={String(outcome.hits)} />
            </div>
          ) : null}

          {/* The chapter is "stamped" as done, next to the news of the unlocked file. */}
          <div className="flex items-center gap-4">
            <Image
              src="/assets/shared/textures/stamp-viet-minh.png"
              alt=""
              width={640}
              height={640}
              unoptimized
              className="pointer-events-none w-20 shrink-0 -rotate-12 opacity-90"
            />
            <p className="text-left text-sm text-stone-300">
              Hồ sơ lịch sử về anh Kim Đồng
              <br />
              đã được mở khóa.
            </p>
          </div>

          <Link
            ref={codexLinkRef}
            href="/kimdong/codex"
            className={buttonStyles({ size: "lg", className: "w-full justify-center sm:w-auto" })}
          >
            Xem hồ sơ lịch sử
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" size="sm" onClick={onReplay}>
              Chơi lại
            </Button>
            <Link href="/" className={buttonStyles({ variant: "ghost", size: "sm" })}>
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
