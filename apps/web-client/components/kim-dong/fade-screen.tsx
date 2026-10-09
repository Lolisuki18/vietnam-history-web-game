import { cn } from "@vhg/ui";
import type { ReactNode } from "react";

interface FadeScreenProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  /** Fade duration in milliseconds. */
  duration?: number;
}

/**
 * Full-size layer that fades in/out with CSS only. Hidden layers stay mounted but are
 * `invisible` (no pointer events, not focusable) and `inert`.
 *
 * `visibility` flips immediately when showing (so children can take focus right away) and
 * only after the fade has finished when hiding.
 */
export function FadeScreen({ show, children, className, duration = 500 }: FadeScreenProps) {
  return (
    <div
      aria-hidden={!show}
      inert={!show}
      style={{
        transition: show
          ? `opacity ${duration}ms`
          : `opacity ${duration}ms, visibility 0s linear ${duration}ms`,
      }}
      className={cn(
        "absolute inset-0",
        show ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
