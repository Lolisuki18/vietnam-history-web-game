import type { ComponentType, ReactNode } from "react";

import { buttonStyles } from "./button";
import { cn } from "./cn";
import { SvgIcon } from "./svg-icon";

export type ChapterStatus = "unlocked" | "completed" | "coming-soon";

/** Anything that renders a link: a plain anchor by default, `next/link` when passed in. */
export type LinkComponent = ComponentType<{
  href: string;
  className?: string;
  children?: ReactNode;
}>;

function DefaultLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

const STATUS_LABEL: Record<Exclude<ChapterStatus, "coming-soon">, string> = {
  unlocked: "Chơi được",
  completed: "Đã hoàn thành",
};

/** The status as an ink stamp on the cover. (A chapter that is not open gets a seal instead.) */
function StatusStamp({ status }: { status: Exclude<ChapterStatus, "coming-soon"> }) {
  return (
    <span
      className={cn(
        "stamp rotate-3 bg-stone-950/80 px-2 py-0.5 text-xs",
        status === "completed" ? "text-emerald-400" : "text-red-400",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Placeholder cover for chapters without artwork yet: a flat dark panel. */
function DefaultCover() {
  return <div aria-hidden className="size-full bg-stone-800" />;
}

/** Where the wear marks (ink blot, scratches) sit, so neighbouring cards do not look alike. */
const WEAR_PLACEMENT = [
  "right-0 bottom-0",
  "top-0 right-0 [transform:scaleY(-1)]",
  "bottom-0 left-0 [transform:scaleX(-1)]",
] as const;

export interface ChapterCardProps {
  /** e.g. "Chương 1". */
  chapterLabel: string;
  /** Name of the historical figure, e.g. "Kim Đồng". */
  character: string;
  /** Title of the chapter, e.g. "Người liên lạc nhỏ". */
  title: string;
  /** Historical period shown above the name, e.g. "1941 – 1943". */
  period?: string;
  description: string;
  status: ChapterStatus;
  /** Cover image URL. */
  coverSrc?: string;
  coverAlt?: string;
  /** Custom cover (an SVG illustration...). Used when there is no `coverSrc`. */
  cover?: ReactNode;
  /** Where "Chơi ngay" leads; only used for unlocked / completed chapters. */
  playHref?: string;
  /** Link implementation, so the app can use its router's link. Defaults to `<a>`. */
  LinkComponent?: LinkComponent;
  /** Extra content under the description (e.g. a link to the dossier). */
  extra?: ReactNode;
  /** Gameplay difficulty indicator. */
  difficulty?: string;
  /** Estimated time to play. */
  estimatedTime?: string;
  /** Historical era/tag. */
  tag?: string;
  /** Picks where the wear marks go (0, 1, 2…), so that each card is worn differently. */
  wear?: number;
  className?: string;
}

/**
 * A chapter of the game, pinned up like a file card: pin, paper label, ink stamp for the status
 * and a seal over chapters that are not open yet.
 */
export function ChapterCard({
  chapterLabel,
  character,
  title,
  period,
  description,
  status,
  coverSrc,
  coverAlt = "",
  cover,
  playHref,
  LinkComponent: Anchor = DefaultLink,
  extra,
  difficulty,
  estimatedTime,
  tag,
  wear = 0,
  className,
}: ChapterCardProps) {
  const comingSoon = status === "coming-soon";

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-sm border-2 bg-stone-900",
        comingSoon ? "border-stone-700" : "border-amber-800/70 hover:border-amber-600",
        className,
      )}
    >
      {/* The pin holding the card to the wall. */}
      <SvgIcon
        name="pin"
        size={22}
        className="absolute -top-2.5 left-1/2 z-20 -translate-x-1/2 text-red-700"
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-stone-950">
        <div className={cn("size-full", comingSoon && "opacity-50 grayscale")}>
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt={coverAlt} loading="lazy" className="size-full object-cover" />
          ) : (
            (cover ?? <DefaultCover />)
          )}
        </div>

        <span className="absolute top-4 left-3 label-tape px-3 py-1 text-xs font-bold">
          {chapterLabel}
        </span>

        {comingSoon ? (
          // A seal stamped across the file: still closed.
          <span
            aria-label="Niêm phong, sắp ra mắt"
            className="absolute top-1/2 left-1/2 stamp -translate-x-1/2 -translate-y-1/2 -rotate-12 bg-stone-950/75 px-4 py-2 text-xl leading-tight text-red-500 sm:text-2xl"
          >
            Niêm phong
            <span className="block text-xs tracking-widest">Sắp ra mắt</span>
          </span>
        ) : (
          <span className="absolute top-4 right-3">
            <StatusStamp status={status} />
          </span>
        )}
      </div>

      {/* Old ink blot and scratches, in a different corner on each card. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute size-28 bg-[url('/assets/shared/textures/card-wear.svg')] bg-contain bg-no-repeat opacity-80",
          WEAR_PLACEMENT[wear % WEAR_PLACEMENT.length],
        )}
      />

      <div className="relative flex flex-1 flex-col gap-3 p-5">
        {(period || tag) && (
          <p className="text-sm text-stone-400">
            {period ? <span className="text-amber-400">{period}</span> : null}
            {period && tag ? " · " : null}
            {tag}
          </p>
        )}

        <div>
          <h3
            className={cn(
              "font-serif text-2xl font-bold sm:text-3xl",
              comingSoon ? "text-stone-300" : "text-amber-300 group-hover:text-amber-200",
            )}
          >
            {character}
          </h3>
          <p className="mt-0.5 text-stone-400">{title}</p>
        </div>

        <p className="text-sm leading-relaxed text-stone-300/90">{description}</p>

        {(difficulty || estimatedTime) && (
          <p className="border-t border-stone-800 pt-3 text-sm text-stone-400">
            {difficulty ? <>Độ khó: {difficulty}</> : null}
            {difficulty && estimatedTime ? " · " : null}
            {estimatedTime ? <>Thời lượng: {estimatedTime}</> : null}
          </p>
        )}

        {extra}

        <div className="mt-auto pt-2">
          {comingSoon || !playHref ? (
            <span
              aria-disabled="true"
              className={buttonStyles({
                variant: "secondary",
                className:
                  "w-full cursor-not-allowed border-stone-700 bg-stone-950/50 text-stone-500 hover:bg-stone-950/50 hover:text-stone-500",
              })}
            >
              Chưa mở
            </span>
          ) : (
            <Anchor href={playHref} className={buttonStyles({ className: "w-full" })}>
              Chơi ngay
            </Anchor>
          )}
        </div>
      </div>
    </article>
  );
}
