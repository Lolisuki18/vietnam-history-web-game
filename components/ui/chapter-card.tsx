import { CircleCheck, Clock, Lock, LockOpen, Play, Shield } from "lucide-react";
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
  unlocked: "Sẵn sàng",
  completed: "Đã hoàn thành",
  "coming-soon": "Sắp mở khóa",
};

function StatusBadge({ status }: { status: ChapterStatus }) {
  const Icon = status === "completed" ? CircleCheck : status === "unlocked" ? LockOpen : Lock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur",
        status === "coming-soon"
          ? "border-amber-900/60 bg-stone-900/90 text-amber-500/80"
          : status === "completed"
            ? "border-emerald-500/60 bg-emerald-950/90 text-emerald-300"
            : "border-amber-500/60 bg-amber-950/90 text-amber-300",
      )}
    >
      <Icon className="size-3.5" aria-hidden /> {STATUS_LABEL[status]}
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
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-stone-900/90 shadow-xl shadow-black/50 transition-all duration-300",
        comingSoon
          ? "border-amber-900/30 hover:border-amber-800/60"
          : "border-amber-700/50 hover:-translate-y-1.5 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-900/30",
        className,
      )}
    >
      {/* Top Banner Cover Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-950">
        <div
          className={cn(
            "size-full transition-transform duration-700",
            comingSoon ? "opacity-60 contrast-90" : "group-hover:scale-105",
          )}
        >
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt={coverAlt} loading="lazy" className="size-full object-cover" />
          ) : (
            (cover ?? <DefaultCover />)
          )}
        </div>

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent" />

        {/* Coming soon wax seal style emblem */}
        {comingSoon ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <span className="flex size-14 items-center justify-center rounded-full border-2 border-amber-600/70 bg-stone-950/90 text-amber-400 shadow-xl shadow-black/80 backdrop-blur">
              <Lock className="size-6 text-amber-400" aria-hidden />
            </span>
            <span className="rounded-full bg-stone-950/80 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-amber-300/80 uppercase">
              Bản cập nhật kế tiếp
            </span>
          </div>
        ) : null}

        {/* Badges on cover */}
        <span className="absolute top-3 left-3 rounded-md border border-red-700/60 bg-red-800/90 px-2.5 py-1 text-xs font-bold tracking-wider text-amber-50 uppercase shadow-md backdrop-blur">
          {chapterLabel}
        </span>
        <span className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </span>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col gap-3.5 p-5 sm:p-6">
        {/* Era Tag & Historical Period */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {period ? (
            <span className="font-semibold tracking-wider text-amber-400 uppercase">{period}</span>
          ) : (
            <span />
          )}
          {tag ? (
            <span className="rounded-md border border-amber-900/40 bg-stone-950/60 px-2 py-0.5 text-[11px] text-stone-400">
              {tag}
            </span>
          ) : null}
        </div>

        {/* Character and Chapter Title */}
        <div>
          <h3
            className={cn(
              "font-serif text-2xl font-bold tracking-tight sm:text-3xl",
              comingSoon ? "text-stone-300" : "text-amber-300 group-hover:text-amber-200",
            )}
          >
            {character}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-stone-400">{title}</p>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-stone-300/90">{description}</p>

        {/* Difficulty and Duration Chips */}
        {(difficulty || estimatedTime) && (
          <div className="flex flex-wrap items-center gap-3 border-t border-amber-900/30 pt-3 text-xs text-stone-400">
            {difficulty && (
              <span className="flex items-center gap-1.5">
                <Shield className="size-3.5 text-amber-500" />
                <span>
                  Độ khó: <strong className="font-medium text-stone-300">{difficulty}</strong>
                </span>
              </span>
            )}
            {estimatedTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-amber-500" />
                <span>
                  Thời lượng:{" "}
                  <strong className="font-medium text-stone-300">{estimatedTime}</strong>
                </span>
              </span>
            )}
          </div>
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
              <Lock className="size-4" aria-hidden /> Sắp mở khóa
            </span>
          ) : (
            <Anchor
              href={playHref}
              className={buttonStyles({
                className: "w-full font-bold shadow-lg shadow-red-950/50",
              })}
            >
              <Play className="size-4" aria-hidden /> Chơi ngay
            </Anchor>
          )}
        </div>
      </div>
    </article>
  );
}
