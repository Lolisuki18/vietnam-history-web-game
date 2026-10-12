import { CircleCheck, Lock, LockOpen, Play } from "lucide-react";
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
  unlocked: "Đã mở khóa",
  completed: "Đã hoàn thành",
  "coming-soon": "Sắp ra mắt",
};

function StatusBadge({ status }: { status: ChapterStatus }) {
  const Icon = status === "completed" ? CircleCheck : status === "unlocked" ? LockOpen : Lock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur",
        status === "coming-soon"
          ? "border-stone-600 bg-stone-900/80 text-stone-400"
          : status === "completed"
            ? "border-emerald-500/60 bg-emerald-950/80 text-emerald-300"
            : "border-amber-500/60 bg-amber-950/80 text-amber-300",
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
      className="size-full bg-stone-900 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.35),transparent_60%),repeating-radial-gradient(circle_at_50%_120%,transparent_0_26px,rgba(245,158,11,0.12)_26px_28px)]"
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
  className,
}: ChapterCardProps) {
  const comingSoon = status === "coming-soon";

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-stone-800/70 shadow-lg shadow-black/40 transition-all duration-300",
        comingSoon
          ? "border-stone-700/60"
          : "border-amber-700/40 hover:-translate-y-1 hover:border-amber-500/70 hover:shadow-2xl hover:shadow-amber-900/30",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-950">
        <div
          className={cn(
            "size-full transition-transform duration-500",
            comingSoon ? "brightness-50 grayscale" : "group-hover:scale-105",
          )}
        >
          {coverSrc ? (
            // Cover art is an arbitrary, caller-provided URL: next/image would need its domain allow-listed.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt={coverAlt} loading="lazy" className="size-full object-cover" />
          ) : (
            (cover ?? <DefaultCover />)
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/10 to-transparent" />
        {comingSoon ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full border border-stone-600 bg-stone-900/80 text-stone-400">
              <Lock className="size-6" aria-hidden />
            </span>
          </div>
        ) : null}
        <span className="absolute top-3 left-3 rounded-md bg-red-800 px-2.5 py-1 text-xs font-bold tracking-wider text-amber-50 uppercase shadow">
          {chapterLabel}
        </span>
        <span className="absolute top-3 right-3">
          <StatusBadge status={status} />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {period ? (
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-500 uppercase">
            {period}
          </p>
        ) : null}
        <div>
          <h3
            className={cn(
              "font-serif text-2xl font-bold",
              comingSoon ? "text-stone-500" : "text-amber-50",
            )}
          >
            {character}
          </h3>
          <p className={cn("text-sm", comingSoon ? "text-stone-600" : "text-stone-400")}>{title}</p>
        </div>
        <p
          className={cn(
            "text-sm leading-relaxed",
            comingSoon ? "text-stone-600" : "text-stone-300",
          )}
        >
          {description}
        </p>
        {extra}
        <div className="mt-auto pt-2">
          {comingSoon || !playHref ? (
            <span
              aria-disabled="true"
              className={buttonStyles({ variant: "secondary", className: "w-full" })}
            >
              <Lock className="size-4" aria-hidden /> Sắp ra mắt
            </span>
          ) : (
            <Anchor href={playHref} className={buttonStyles({ className: "w-full" })}>
              <Play className="size-4" aria-hidden /> Chơi ngay
            </Anchor>
          )}
        </div>
      </div>
    </article>
  );
}
