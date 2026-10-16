"use client";

import { Bomb, Mail, Pause } from "lucide-react";

import { cn } from "@/components/ui";
import {
  PHASE_CONTROLS,
  PHASE_CONTROLS_TOUCH,
  PHASE_OBJECTIVES,
} from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";

/** The alert meter: green → yellow → red, with a status label (the "!" and "?" of the soldiers). */
function AlertBar({ value }: { value: number }) {
  const danger = value >= 85;
  const warning = value >= 45 && !danger;

  return (
    <div
      className={cn(
        "w-36 rounded-md border-2 bg-stone-950/90 px-2.5 py-1.5 sm:w-52",
        danger ? "animate-pulse border-red-500" : warning ? "border-amber-500" : "border-stone-700",
      )}
    >
      <div className="mb-1 flex items-baseline justify-between font-serif text-[11px] font-bold tracking-wider uppercase sm:text-xs">
        <span className={danger ? "text-red-400" : warning ? "text-amber-400" : "text-stone-300"}>
          {danger ? "Bị phát hiện!" : warning ? "Nghi ngờ" : "An toàn"}
        </span>
        <span
          className={cn(
            "tabular-nums",
            danger ? "text-red-400" : warning ? "text-amber-400" : "text-stone-400",
          )}
        >
          {Math.round(value)}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Thanh báo động"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="relative h-2.5 overflow-hidden rounded-sm border border-black bg-stone-900"
      >
        <div
          className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-amber-400 to-red-600 transition-[clip-path] duration-200"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        />
      </div>
    </div>
  );
}

export interface HudProps {
  onPause?: () => void;
}

/** In-game HUD: paper counter, grenade, alert meter, objective, pause button and danger vignette. */
export function Hud({ onPause }: HudProps) {
  const collected = useVoThiSauUiStore((state) => state.collected);
  const total = useVoThiSauUiStore((state) => state.total);
  const alert = useVoThiSauUiStore((state) => state.alert);
  const phase = useVoThiSauUiStore((state) => state.phase);
  const hasGrenade = useVoThiSauUiStore((state) => state.hasGrenade);
  const touch = useCoarsePointer();
  const controls = phase ? (touch ? PHASE_CONTROLS_TOUCH : PHASE_CONTROLS)[phase] : undefined;
  // The meter matters while sneaking; the chase has no meter.
  const showAlert = phase !== "escape" && phase !== "meet-bay" && phase !== "ending";
  const isDanger = showAlert && alert >= 85;

  const hintClass =
    "w-fit max-w-full self-center rounded-md border border-amber-900/60 bg-stone-950/85 px-3 py-1.5 text-center font-serif text-xs text-amber-100 backdrop-blur sm:text-sm";

  return (
    <>
      {/* Danger screen border pulse when the alert is high */}
      {isDanger && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-30 animate-pulse ring-8 ring-red-600/50 ring-inset"
        />
      )}

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 select-none sm:p-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border-2 border-amber-700/80 bg-stone-950/85 px-3 py-1.5 backdrop-blur">
                <Mail className="size-5 text-amber-400" aria-hidden />
                <span className="font-serif text-lg font-bold text-amber-400 sm:text-xl">
                  Tư liệu: {collected}/{total}
                </span>
              </div>
              {hasGrenade ? (
                <div
                  className="flex items-center gap-1.5 rounded-md border-2 border-red-700/80 bg-stone-950/85 px-2.5 py-1.5 backdrop-blur"
                  title="Lựu đạn"
                >
                  <Bomb className="size-5 text-red-400" aria-hidden />
                  <span className="font-serif text-lg font-bold text-red-300">1</span>
                </div>
              ) : null}
            </div>

            {phase ? (
              <p className="order-last w-full rounded-md border border-amber-900/50 bg-stone-950/85 px-3 py-1.5 text-center font-serif text-sm font-medium text-amber-100 backdrop-blur sm:order-none sm:w-auto sm:max-w-md sm:px-4 sm:text-base">
                {PHASE_OBJECTIVES[phase]}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "transition-opacity duration-500",
                  !showAlert && "invisible opacity-0",
                )}
              >
                <AlertBar value={alert} />
              </div>

              {onPause && (
                <button
                  type="button"
                  onClick={onPause}
                  aria-label="Tạm dừng trò chơi"
                  title="Tạm dừng trò chơi (ESC)"
                  className="pointer-events-auto flex size-9 items-center justify-center rounded-md border border-amber-700/70 bg-stone-950/85 text-amber-400 transition-transform hover:scale-105 hover:bg-stone-900 active:scale-95"
                >
                  <Pause className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Top hint: touch devices and narrow screens */}
          {controls ? (
            <p className={cn(hintClass, touch ? "block" : "md:hidden")}>{controls}</p>
          ) : null}
        </div>

        {/* Bottom hint for desktop */}
        {controls ? (
          <p className={cn(hintClass, "self-start", touch ? "hidden" : "hidden md:block")}>
            {controls}
          </p>
        ) : null}
      </div>
    </>
  );
}
