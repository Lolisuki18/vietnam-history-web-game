"use client";

import { cn } from "@/components/ui";
import { Flame, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { LETTERS, TOAST_DURATION_MS } from "@/features/kimdong/data/story";
import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";

const ENTER_DELAY_MS = 30;
const FADE_MS = 500;

type ToastPhase = "entering" | "shown" | "leaving";

function ToastCard({ toastKey, letterIndex }: { toastKey: number; letterIndex: number }) {
  const [phase, setPhase] = useState<ToastPhase>("entering");
  const letter = LETTERS[letterIndex];

  // The game plays the paper-rustle sound when the letter is picked up; this only runs the timeline.
  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("shown"), ENTER_DELAY_MS),
      window.setTimeout(() => setPhase("leaving"), TOAST_DURATION_MS - FADE_MS),
      window.setTimeout(() => useKimDongUiStore.getState().hideToast(toastKey), TOAST_DURATION_MS),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toastKey]);

  if (!letter) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-[min(26rem,calc(100vw-1.5rem))] rounded-xl border-2 p-4.5 backdrop-blur-md transition-all ease-out",
        letter.urgent
          ? "border-red-500 bg-red-950/95 text-red-50"
          : "border-amber-500/80 bg-stone-950/95 text-amber-50",
        phase === "entering" && "translate-x-[120%] opacity-0",
        phase === "shown" && "translate-x-0 opacity-100",
        phase === "leaving" && "translate-x-4 opacity-0",
      )}
      style={{ transitionDuration: `${phase === "leaving" ? FADE_MS : 400}ms` }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
        <p
          className={cn(
            "flex items-center gap-2 font-serif text-sm font-bold tracking-wider uppercase",
            letter.urgent ? "text-red-300" : "text-amber-300",
          )}
        >
          {letter.urgent ? (
            <Flame className="size-4 text-red-400" aria-hidden />
          ) : (
            <Mail className="size-4 text-amber-400" aria-hidden />
          )}
          Mật thư {letterIndex + 1}/{LETTERS.length} · {letter.title}
        </p>
      </div>

      <p className="mt-2.5 font-serif text-lg leading-relaxed text-amber-100 italic">
        “{letter.quote}”
      </p>

      {letter.fact ? (
        <p className="mt-3 rounded-md bg-stone-900/70 p-2.5 text-xs text-amber-100/90">
          <strong className="font-semibold text-amber-300">Bạn có biết:</strong> {letter.fact}
        </p>
      ) : null}
    </div>
  );
}

/** Letter contents slide in from the right with chime sound, then fade out after 5 seconds. */
export function ToastNotification() {
  const toast = useKimDongUiStore((state) => state.toast);

  return (
    <div className="pointer-events-none absolute top-36 right-3 z-40 flex justify-end overflow-hidden sm:top-20 sm:right-4">
      {toast ? (
        <ToastCard key={toast.key} toastKey={toast.key} letterIndex={toast.letterIndex} />
      ) : null}
    </div>
  );
}
