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
 * A card for one historical figure. Unlocked: artwork, years and a short biography. Locked: a
 * padlock and what the player has to do to open it.
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
        "flex flex-col rounded-xl border bg-stone-900",
        unlocked ? "border-amber-700/70" : "border-stone-800 bg-stone-950",
        className,
      )}
    >
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-stone-950">
          {unlocked ? (
            art
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-stone-500">
              <Lock className="size-8" aria-hidden />
              <span className="text-sm">Chưa mở</span>
            </div>
          )}
        </div>

        {/* Card Header & Metadata */}
        <div className="flex flex-col gap-1">
          <h3
            className={cn(
              "font-serif text-2xl font-bold",
              unlocked ? "text-amber-300" : "text-stone-300",
            )}
          >
            {name}
          </h3>
          {unlocked && years ? <p className="text-amber-400/90">{years}</p> : null}
          {role ? <p className="text-sm text-stone-400">{role}</p> : null}
        </div>

        {/* Card Summary / Hint */}
        <p
          className={cn("text-sm leading-relaxed", unlocked ? "text-stone-300" : "text-stone-400")}
        >
          {unlocked ? summary : lockedHint}
        </p>

        {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
      </div>
    </article>
  );
}
