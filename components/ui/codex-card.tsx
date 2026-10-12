import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./cn";

export interface CodexCardProps {
  /** Whether the dossier has been unlocked (the app reads this from its store). */
  unlocked: boolean;
  name: string;
  /** e.g. "1929 – 1943". */
  years?: string;
  /** Short role line, e.g. "Người liên lạc nhỏ". */
  role?: string;
  /** Short biography shown on an unlocked card. */
  summary: string;
  /** The illustration shown on an unlocked card. */
  art?: ReactNode;
  /** What the player has to do to unlock it (shown on a locked card). */
  lockedHint?: string;
  /** Extra content at the bottom (a link, a button...). */
  footer?: ReactNode;
  className?: string;
}

/**
 * A historical "trading card" collectible.
 * Unlocked: bright artwork in a double golden frame with gold foil sheen and biography.
 * Locked: ancient parchment with mysterious lock seal and unlock instructions.
 */
export function CodexCard({
  unlocked,
  name,
  years,
  role,
  summary,
  art,
  lockedHint = "Hoàn thành chương tương ứng để mở khóa hồ sơ này.",
  footer,
  className,
}: CodexCardProps) {
  return (
    <article
      aria-label={unlocked ? `Hồ sơ lịch sử: ${name}` : `Hồ sơ lịch sử: ${name} (Chưa mở khóa)`}
      className={cn(
        "group relative flex flex-col rounded-2xl border-2 p-2.5 transition-all duration-300",
        unlocked
          ? "border-amber-500 bg-gradient-to-b from-amber-950/70 via-stone-900 to-stone-950 shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] hover:-translate-y-1 hover:border-amber-400 hover:shadow-[0_0_55px_-5px_rgba(245,158,11,0.65)]"
          : "border-stone-800 bg-stone-950/80 shadow-lg shadow-black/60 hover:border-stone-700",
        className,
      )}
    >
      {/* Decorative Corner Ornaments for unlocked cards */}
      {unlocked && (
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
          <span className="absolute top-1 left-1 size-2 border-t-2 border-l-2 border-amber-400" />
          <span className="absolute top-1 right-1 size-2 border-t-2 border-r-2 border-amber-400" />
          <span className="absolute bottom-1 left-1 size-2 border-b-2 border-l-2 border-amber-400" />
          <span className="absolute right-1 bottom-1 size-2 border-r-2 border-b-2 border-amber-400" />
        </div>
      )}

      <div
        className={cn(
          "flex h-full flex-col gap-4 rounded-xl border p-4 sm:p-5",
          unlocked ? "border-amber-600/50 bg-stone-900/60" : "border-stone-800/80 bg-stone-950/60",
        )}
      >
        {/* Card Artwork / Locked Visual */}
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-lg shadow-inner",
            unlocked
              ? "bg-stone-950 ring-1 ring-amber-500/60"
              : "bg-stone-900/80 ring-1 ring-stone-800",
          )}
        >
          {unlocked ? (
            <>
              {art}
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-950/80 px-2 py-0.5 text-[10px] font-bold text-amber-300 shadow backdrop-blur">
                <Sparkles className="size-3" />
                <span>ĐÃ MỞ</span>
              </div>
            </>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2.5 text-stone-500">
              <span className="flex size-14 items-center justify-center rounded-full border border-stone-700 bg-stone-950/80 text-stone-400 shadow-md">
                <Lock className="size-6 text-amber-600/70" aria-hidden />
              </span>
              <span className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                Hồ sơ niêm phong
              </span>
            </div>
          )}
        </div>

        {/* Card Header & Metadata */}
        <div className="flex flex-col gap-1.5 text-center">
          <h3
            className={cn(
              "font-serif text-2xl font-bold tracking-tight sm:text-2xl",
              unlocked ? "text-amber-300" : "text-stone-300",
            )}
          >
            {name}
          </h3>

          {unlocked && years ? (
            <p className="font-serif text-base font-semibold text-amber-400/90">{years}</p>
          ) : null}

          {role ? (
            <p
              className={cn(
                "text-xs font-semibold tracking-[0.2em] uppercase",
                unlocked ? "text-amber-400/80" : "text-stone-400",
              )}
            >
              {role}
            </p>
          ) : null}
        </div>

        {/* Card Summary / Hint */}
        <p
          className={cn(
            "text-sm leading-relaxed",
            unlocked ? "text-stone-300" : "text-center text-stone-400 italic",
          )}
        >
          {unlocked ? summary : lockedHint}
        </p>

        {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
      </div>
    </article>
  );
}
