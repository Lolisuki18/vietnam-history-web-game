import { Lock } from "lucide-react";
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
 * A historical "trading card". Unlocked: bright artwork in a double golden frame with the
 * biography. Locked: dark grey with a padlock and a hint, nothing of the content is shown.
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
      aria-label={unlocked ? `Hồ sơ lịch sử: ${name}` : "Hồ sơ lịch sử chưa mở khóa"}
      className={cn(
        "rounded-2xl border-2 p-2 transition-all duration-300",
        unlocked
          ? "border-amber-500 bg-gradient-to-b from-amber-950/60 via-stone-900 to-stone-950 shadow-[0_0_44px_-10px_rgba(245,158,11,0.55)]"
          : "border-stone-700 bg-neutral-950",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-full flex-col gap-4 rounded-xl border p-3 sm:p-4",
          unlocked ? "border-amber-600/60" : "border-stone-800",
        )}
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-lg",
            unlocked ? "bg-stone-950 ring-1 ring-amber-500/50" : "bg-stone-900",
          )}
        >
          {unlocked ? (
            art
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-stone-600">
              <Lock className="size-14" aria-hidden />
              <span className="text-xs font-semibold tracking-widest uppercase">Chưa mở khóa</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 text-center">
          <h3
            className={cn(
              "font-serif text-2xl font-bold",
              unlocked ? "text-amber-50" : "tracking-widest text-stone-600",
            )}
          >
            {unlocked ? name : "? ? ?"}
          </h3>
          {unlocked && years ? (
            <p className="font-serif text-lg font-semibold text-amber-500">{years}</p>
          ) : null}
          {unlocked && role ? (
            <p className="text-xs font-semibold tracking-[0.2em] text-amber-300/80 uppercase">
              {role}
            </p>
          ) : null}
        </div>

        <p
          className={cn(
            "text-sm leading-relaxed",
            unlocked ? "text-stone-300" : "text-center text-stone-600",
          )}
        >
          {unlocked ? summary : lockedHint}
        </p>
        {footer ? <div className="mt-auto">{footer}</div> : null}
      </div>
    </article>
  );
}
