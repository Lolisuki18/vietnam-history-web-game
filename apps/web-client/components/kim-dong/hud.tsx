"use client";

import { cn } from "@vhg/ui";
import { Mail } from "lucide-react";

import { PHASE_CONTROLS, PHASE_CONTROLS_TOUCH, PHASE_OBJECTIVES } from "@/data/kimdong-story";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

function alertColor(value: number): string {
  if (value >= 70) return "bg-red-600";
  if (value >= 35) return "bg-amber-500";
  return "bg-emerald-500";
}

/** In-game HUD: letter counter, alert meter, objective and control hints. */
export function Hud() {
  const collected = useKimDongUiStore((state) => state.collected);
  const total = useKimDongUiStore((state) => state.total);
  const alert = useKimDongUiStore((state) => state.alert);
  const phase = useKimDongUiStore((state) => state.phase);
  const touch = useCoarsePointer();
  const controls = phase ? (touch ? PHASE_CONTROLS_TOUCH : PHASE_CONTROLS)[phase] : undefined;
  // The alert meter only matters while sneaking; the finale has its own rules.
  const showAlert = phase !== "climax" && phase !== "runner" && phase !== "ending";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 select-none">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200/30 bg-stone-900/80 px-4 py-2 text-amber-100 shadow-lg">
          <Mail className="size-5 text-amber-300" aria-hidden />
          <span className="text-lg font-semibold">
            Mật thư: {collected}/{total}
          </span>
        </div>

        {phase ? (
          <p className="hidden max-w-md rounded-lg bg-stone-900/70 px-4 py-2 text-center text-sm font-medium text-amber-50 sm:block">
            {PHASE_OBJECTIVES[phase]}
          </p>
        ) : null}

        <div
          className={cn(
            "w-44 rounded-lg border border-amber-200/30 bg-stone-900/80 px-3 py-2 shadow-lg transition-opacity duration-500 sm:w-56",
            !showAlert && "invisible opacity-0",
          )}
        >
          <div className="mb-1 flex justify-between text-xs font-semibold text-amber-100">
            <span>Báo động</span>
            <span>{Math.round(alert)}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Thanh báo động"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(alert)}
            className="h-3 overflow-hidden rounded-full bg-stone-700"
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-200",
                alertColor(alert),
              )}
              style={{ width: `${alert}%` }}
            />
          </div>
        </div>
      </div>

      {/* On touch devices the hint sits above the virtual controls instead of overlapping them. */}
      {controls ? (
        <p
          className={cn(
            "w-fit max-w-full rounded-lg bg-stone-900/70 px-3 py-2 text-xs text-amber-100/90",
            touch && "self-center",
          )}
        >
          {controls}
        </p>
      ) : null}
    </div>
  );
}
