import type { ComponentProps } from "react";

import { cn } from "./cn";

/** A dark panel with a faint golden border. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-900/40 bg-stone-800/60 p-6 text-stone-200",
        className,
      )}
      {...props}
    />
  );
}
