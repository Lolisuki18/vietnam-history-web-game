import type { ComponentType, ReactNode } from "react";

import { buttonStyles } from "./button";
import { cn } from "./cn";

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

const STATUS_LABEL: Record<ChapterStatus, string> = {
  unlocked: "Chơi được",
  completed: "Đã hoàn thành",
  "coming-soon": "Sắp ra mắt",
};

function StatusBadge({ status }: { status: ChapterStatus }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-1 text-xs font-semibold",
        status === "completed"
          ? "bg-emerald-950/90 text-emerald-300"
          : status === "unlocked"
            ? "bg-stone-950/85 text-amber-300"
            : "bg-stone-950/85 text-stone-400",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Placeholder cover: a dark red-to-amber gradient with concentric rings (like a bronze drum). */
function DefaultCover() {
  return (
    <div
      aria-hidden
      className="size-full bg-stone-900 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.25),transparent_60%),repeating-radial-gradient(circle_at_50%_120%,transparent_0_26px,rgba(245,158,11,0.08)_26px_28px)]"
    />
  );
}

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
  className?: string;
}

/** A chapter of the game: cover, figure, status and the "Chơi ngay" button. */
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
  className,
}: ChapterCardProps) {
  const comingSoon = status === "coming-soon";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border bg-stone-900 transition-colors",
        comingSoon ? "border-stone-800" : "border-amber-800/60 hover:border-amber-600",
        className,
      )}
    >
      {/* Top Banner Cover Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-950">
        <div className={cn("size-full", comingSoon && "opacity-50 grayscale")}>
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt={coverAlt} loading="lazy" className="size-full object-cover" />
          ) : (
            (cover ?? <DefaultCover />)
          )}
        </div>

        {/* Badges on cover */}
        <span className="absolute top-3 left-3 rounded-md bg-red-800 px-2 py-1 text-xs font-semibold text-amber-50">
          {chapterLabel}
        </span>
        <span className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </span>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {(period || tag) && (
          <p className="text-sm text-stone-400">
            {period ? <span className="text-amber-400">{period}</span> : null}
            {period && tag ? " · " : null}
            {tag}
          </p>
        )}

        {/* Character and Chapter Title */}
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

        {/* Description */}
        <p className="text-sm leading-relaxed text-stone-300/90">{description}</p>

        {(difficulty || estimatedTime) && (
          <p className="border-t border-stone-800 pt-3 text-sm text-stone-400">
            {difficulty ? <>Độ khó: {difficulty}</> : null}
            {difficulty && estimatedTime ? " · " : null}
            {estimatedTime ? <>Thời lượng: {estimatedTime}</> : null}
          </p>
        )}

        {extra}

        {/* Bottom CTA Action Button */}
        <div className="mt-auto pt-2">
          {comingSoon || !playHref ? (
            <span
              aria-disabled="true"
              className={buttonStyles({
                variant: "secondary",
                className:
                  "w-full cursor-not-allowed border-stone-800 bg-stone-950/50 text-stone-500 hover:border-stone-800 hover:bg-stone-950/50 hover:text-stone-500",
              })}
            >
              Sắp ra mắt
            </span>
          ) : (
            <Anchor
              href={playHref}
              className={buttonStyles({
                className: "w-full",
              })}
            >
              Chơi ngay
            </Anchor>
          )}
        </div>
      </div>
    </article>
  );
}
