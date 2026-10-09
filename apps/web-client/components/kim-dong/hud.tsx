"use client";

import { cn } from "@vhg/ui";
import { Mail } from "lucide-react";

import { PHASE_CONTROLS, PHASE_CONTROLS_TOUCH, PHASE_OBJECTIVES } from "@/data/kimdong-story";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

/** Dark outline so amber lettering stays readable on top of the forest. */
const TEXT_OUTLINE = "[text-shadow:0_2px_3px_rgb(0_0_0/0.95),0_0_10px_rgb(0_0_0/0.8)]";

/** The alert meter track: yellow → orange → blazing red; the fill only reveals more of it. */
function AlertBar({ value }: { value: number }) {
  const danger = value >= 90;
  return (
    <div
      className={cn(
        "w-40 rounded-md border-2 bg-stone-950/85 px-2.5 py-1.5 shadow-lg shadow-black/50 sm:w-56",
        danger ? "animate-pulse border-red-500 shadow-red-700/50" : "border-amber-700/80",
      )}
    >
      <div className="mb-1 flex items-baseline justify-between font-serif text-xs font-bold tracking-wider text-amber-400 uppercase sm:text-sm">
        <span>Báo động</span>
        <span className={cn("tabular-nums", danger && "text-red-400")}>{Math.round(value)}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Thanh báo động"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="relative h-3.5 overflow-hidden rounded-sm border border-black bg-stone-800"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 transition-[clip-path] duration-200"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        />
      </div>
    </div>
  );
}

/**
 * In-game HUD: letter counter, alert meter, objective and control hints. It keeps the bottom
 * corners free (the virtual joystick and the action button live there on phones): the control
 * hint sits at the top on touch devices and narrow screens.
 */
export function Hud() {
  const collected = useKimDongUiStore((state) => state.collected);
  const total = useKimDongUiStore((state) => state.total);
  const alert = useKimDongUiStore((state) => state.alert);
  const phase = useKimDongUiStore((state) => state.phase);
  const touch = useCoarsePointer();
  const controls = phase ? (touch ? PHASE_CONTROLS_TOUCH : PHASE_CONTROLS)[phase] : undefined;
  // The alert meter only matters while sneaking; the finale has its own rules.
  const showAlert = phase !== "climax" && phase !== "runner" && phase !== "ending";

  const hintClass =
    "w-fit max-w-full self-center rounded-md border border-amber-900/50 bg-stone-950/75 px-3 py-1.5 text-center font-serif text-xs text-amber-100/90 sm:text-sm";

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 select-none sm:p-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 rounded-md border-2 border-amber-700/80 bg-stone-950/80 px-3 py-1.5 shadow-lg shadow-black/50">
            <Mail className="size-5 text-amber-500" aria-hidden />
            <span
              className={cn("font-serif text-lg font-bold text-amber-500 sm:text-xl", TEXT_OUTLINE)}
            >
              Mật thư: {collected}/{total}
            </span>
          </div>

          {phase ? (
            <p className="order-last w-full rounded-md bg-stone-950/70 px-3 py-1.5 text-center font-serif text-sm text-amber-50 sm:order-none sm:w-auto sm:max-w-md sm:px-4 sm:text-base">
              {PHASE_OBJECTIVES[phase]}
            </p>
          ) : null}

          <div
            className={cn("transition-opacity duration-500", !showAlert && "invisible opacity-0")}
          >
            <AlertBar value={alert} />
          </div>
        </div>

        {/* Top hint: touch devices and narrow screens (the bottom corners hold the controls). */}
        {controls ? (
          <p className={cn(hintClass, touch ? "block" : "md:hidden")}>{controls}</p>
        ) : null}
      </div>

      {controls ? (
        <p className={cn(hintClass, "self-start", touch ? "hidden" : "hidden md:block")}>
          {controls}
        </p>
      ) : null}
    </div>
  );
}
