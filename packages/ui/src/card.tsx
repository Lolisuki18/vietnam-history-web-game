import type { ComponentProps, ReactNode } from "react";

import { cn } from "./cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-stone-200 bg-white p-6 shadow-sm", className)}
      {...props}
    />
  );
}

export interface ChapterCardProps {
  title: string;
  /** Historical period shown above the title, e.g. "1941 – 1943". */
  period: string;
  description: string;
  /** Slot for a link or button (kept out of this package so it stays router-agnostic). */
  action?: ReactNode;
  className?: string;
}

export function ChapterCard({ title, period, description, action, className }: ChapterCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <span className="text-xs font-semibold tracking-wider text-red-700 uppercase">{period}</span>
      <h3 className="text-xl font-bold text-stone-900">{title}</h3>
      <p className="text-sm leading-relaxed text-stone-600">{description}</p>
      {action ? <div className="mt-auto pt-2">{action}</div> : null}
    </Card>
  );
}
