"use client";

import { Flame, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/components/ui";
import { LORE, LORE_TOAST_MS } from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";

const ENTER_DELAY_MS = 30;
const FADE_MS = 500;

type ToastPhase = "entering" | "shown" | "leaving";

function ToastCard({ toastKey, loreIndex }: { toastKey: number; loreIndex: number }) {
  const [phase, setPhase] = useState<ToastPhase>("entering");
  const lore = LORE[loreIndex];

  // The game plays the paper rustle when the paper is picked up; this only runs the timeline.
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("shown"), ENTER_DELAY_MS),
      window.setTimeout(() => setPhase("leaving"), LORE_TOAST_MS - FADE_MS),
      window.setTimeout(() => useVoThiSauUiStore.getState().hideToast(toastKey), LORE_TOAST_MS),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toastKey]);

  if (!lore) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Aged paper sliding in from the corner; the game keeps running behind it.
        "w-[min(25rem,calc(100vw-1.5rem))] rounded-sm border-2 bg-[#ecd9a8] bg-[url('/assets/shared/textures/paper-aged.webp')] bg-cover p-4 text-stone-900 transition-all ease-out",
        lore.urgent ? "border-red-800" : "border-red-950",
        phase === "entering" && "translate-x-[120%] opacity-0",
        phase === "shown" && "translate-x-0 opacity-100",
        phase === "leaving" && "translate-x-4 opacity-0",
      )}
      style={{ transitionDuration: `${phase === "leaving" ? FADE_MS : 400}ms` }}
    >
      <p
        className={cn(
          "flex items-center gap-2 border-b border-red-900/40 pb-2 font-serif text-sm font-bold tracking-wider uppercase",
          lore.urgent ? "text-red-800" : "text-red-950",
        )}
      >
        {lore.urgent ? (
          <Flame className="size-4" aria-hidden />
        ) : (
          <ScrollText className="size-4" aria-hidden />
        )}
        Tư liệu {loreIndex + 1}/{LORE.length} · {lore.title}
      </p>

      <p className="mt-2.5 font-serif text-lg leading-relaxed text-stone-900 italic">
        “{lore.quote}”
      </p>

      {lore.fact ? (
        <p className="mt-3 rounded-md bg-amber-950/10 p-2.5 text-xs text-stone-800">
          <strong className="font-semibold text-red-950">Bạn có biết:</strong> {lore.fact}
        </p>
      ) : null}
    </div>
  );
}

/** A paper's contents slide in from the right (the game keeps running), then fade out. */
export function LorePopup() {
  const toast = useVoThiSauUiStore((state) => state.toast);

  return (
    <div className="pointer-events-none absolute top-36 right-3 z-40 flex justify-end overflow-hidden sm:top-20 sm:right-4">
      {toast ? (
        <ToastCard key={toast.key} toastKey={toast.key} loreIndex={toast.loreIndex} />
      ) : null}
    </div>
  );
}
