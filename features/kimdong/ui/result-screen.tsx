"use client";

import { Button, buttonStyles, cn, DongSonDrum } from "@/components/ui";
import { Award, BookOpen, House, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import { useStagedReveal } from "@/lib/use-staged-reveal";

/** ms after the screen appears: the closing line fades in, then the actions appear. */
const REVEAL_DELAYS = [400, 2400] as const;

const CODEX_HREF = "/kimdong/codex";

function Stat({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-amber-700/60 bg-stone-900/90 p-3 text-center shadow-lg shadow-black/60">
      <p className="font-serif text-2xl font-black text-amber-400 text-glow sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs font-bold tracking-wider text-stone-300 uppercase">{label}</p>
      {subtext && <p className="text-[10px] text-amber-500/80">{subtext}</p>}
    </div>
  );
}

/**
 * Heroic Tribute & Debriefing Screen.
 * Honors Hero Kim Dong's sacrifice and presents the mission achievements.
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
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto bg-black/95 px-5 py-8 text-center backdrop-blur-md">
      {/* Background Dong Son Watermark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-10 select-none"
      >
        <DongSonDrum size={640} className="animate-spin-slow text-amber-500" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-7">
        {/* Stage 1: Heroic Closing Tribute */}
        <div
          className={cn(
            "flex flex-col items-center gap-3 transition-opacity duration-[1500ms]",
            stage >= 1 ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-red-600/70 bg-red-950/80 px-4 py-1 text-xs font-bold tracking-widest text-amber-200 uppercase shadow-lg">
            <Award className="size-4 text-amber-400" />
            <span>Vinh Danh Liệt Sĩ Anh Hùng</span>
          </div>

          <h2 className="font-serif text-2xl leading-snug font-black text-balance text-amber-300 text-glow sm:text-4xl md:text-5xl">
            Nhiệm vụ hoàn tất...
            <br />
            <span className="text-xl font-normal text-stone-200 sm:text-2xl">
              Anh Kim Đồng đã anh dũng hy sinh để bảo vệ an toàn cho cán bộ cách mạng.
            </span>
          </h2>
        </div>

        {/* Stage 2: Mission Debriefing Card */}
        <div
          inert={stage < 2}
          className={cn(
            "flex w-full flex-col items-center gap-6 rounded-2xl border-2 border-amber-600/60 bg-stone-950/90 p-6 shadow-2xl transition-all duration-1000 sm:p-8",
            stage >= 2 ? "translate-y-0 opacity-100" : "invisible translate-y-4 opacity-0",
          )}
        >
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-amber-400 uppercase">
            <Sparkles className="size-4" />
            <span>Bảng Vàng Chiến Công Dã Chiến</span>
            <Sparkles className="size-4" />
          </div>

          {outcome ? (
            <div className="grid w-full grid-cols-3 gap-3">
              <Stat
                label="Mật thư"
                value={`${outcome.lettersCollected}/${total}`}
                subtext="Đã bảo toàn"
              />
              <Stat
                label="Cầm chân địch"
                value={`${outcome.survivedSeconds.toFixed(1)}s`}
                subtext="Thời gian kéo dài"
              />
              <Stat
                label="Trúng đạn"
                value={String(outcome.hits)}
                subtext={outcome.hits === 0 ? "Bất bại" : "Kiên cường"}
              />
            </div>
          ) : null}

          {/* Unlock Notification */}
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-200">
            <ShieldCheck className="size-4 shrink-0 text-emerald-400" />
            <span>
              Bạn đã mở khóa thành công <strong>Hồ sơ Lịch sử: Anh hùng Kim Đồng</strong>!
            </span>
          </div>

          {/* Action Links */}
          <div className="flex w-full flex-col items-center gap-3">
            <Link
              ref={codexLinkRef}
              href={CODEX_HREF}
              className={buttonStyles({
                size: "lg",
                className:
                  "w-full justify-center px-8 py-3.5 text-base font-bold tracking-wide shadow-xl ring-1 shadow-red-950/80 ring-amber-400/60 sm:w-auto",
              })}
            >
              <BookOpen className="size-5" aria-hidden /> Xem Hồ Sơ Lịch Sử
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <Button variant="secondary" size="sm" onClick={onReplay}>
                <RotateCcw className="size-4" aria-hidden /> Chơi lại màn này
              </Button>
              <Link href="/" className={buttonStyles({ variant: "ghost", size: "sm" })}>
                <House className="size-4" aria-hidden /> Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
