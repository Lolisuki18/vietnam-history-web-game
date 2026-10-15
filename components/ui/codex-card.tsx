import { Lock } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./cn";
import { SvgIcon } from "./svg-icon";

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

/** The four corners of the card get the same ornament, turned a quarter each. */
const CORNERS = [
  "top-1.5 left-1.5",
  "top-1.5 right-1.5 rotate-90",
  "right-1.5 bottom-1.5 rotate-180",
  "bottom-1.5 left-1.5 -rotate-90",
] as const;

/**
 * A card for one historical figure. Unlocked: artwork, years and a short biography in a frame
 * with faint old corner patterns. Locked: a padlock and a "sealed" stamp, and what the player has
 * to do to open it.
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
        "relative flex flex-col rounded-sm border-2 bg-stone-900",
        unlocked ? "border-amber-700/70" : "border-stone-700",
        className,
      )}
    >
      {unlocked &&
        CORNERS.map((position) => (
          <SvgIcon
            key={position}
            name="corner-ornament"
            size={34}
            className={cn("pointer-events-none absolute z-10 text-amber-600/45", position)}
          />
        ))}

      {/* A worn blot in the bottom corner, behind the text. */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 size-24 bg-[url('/assets/shared/textures/card-wear.svg')] bg-contain bg-no-repeat opacity-70"
      />

      <div className="relative flex h-full flex-col gap-4 p-5">
        <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-stone-950">
          {unlocked ? (
            art
          ) : (
            <div className="flex size-full items-center justify-center text-stone-600">
              <Lock className="size-10" aria-hidden />
              <span className="absolute top-1/2 left-1/2 stamp -translate-x-1/2 -translate-y-1/2 -rotate-6 bg-stone-950/70 px-4 py-1.5 text-lg text-red-500">
                Niêm phong
              </span>
            </div>
          )}
        </div>

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
