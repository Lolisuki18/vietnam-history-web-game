"use client";

import { cn } from "@vhg/ui";
import { Lightbulb, Mail, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { LETTERS, TOAST_DURATION_MS } from "@/data/kimdong-story";
import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

const ENTER_DELAY_MS = 30;
const FADE_MS = 500;

type ToastPhase = "entering" | "shown" | "leaving";

function ToastCard({ toastKey, letterIndex }: { toastKey: number; letterIndex: number }) {
  const [phase, setPhase] = useState<ToastPhase>("entering");
  const letter = LETTERS[letterIndex];

  // One timeline per toast: slide in, stay, fade out, then remove it from the store.
  // A newer toast gets a new key, which remounts this component and restarts the timeline.
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
        "w-[min(24rem,calc(100vw-1.5rem))] rounded-md border-2 p-4 shadow-2xl transition-all ease-out",
        letter.urgent
          ? "border-red-500/80 bg-red-950/95 text-red-50"
          : "border-amber-600/70 bg-stone-900/95 text-amber-50",
        phase === "entering" && "translate-x-[120%] opacity-0",
        phase === "shown" && "translate-x-0 opacity-100",
        phase === "leaving" && "translate-x-4 opacity-0",
      )}
      style={{ transitionDuration: `${phase === "leaving" ? FADE_MS : 400}ms` }}
    >
      <p
        className={cn(
          "mb-2 flex items-center gap-2 font-serif text-base font-bold",
          letter.urgent ? "text-red-300" : "text-amber-300",
        )}
      >
        {letter.urgent ? (
          <TriangleAlert className="size-4" aria-hidden />
        ) : (
          <Mail className="size-4" aria-hidden />
        )}
        Mật thư {letterIndex + 1}/{LETTERS.length} · {letter.title}
      </p>
      <p className="font-serif text-lg leading-relaxed italic">“{letter.quote}”</p>
      {letter.fact ? (
        <p className="mt-3 flex gap-2 border-t border-white/10 pt-3 text-sm text-amber-100/80">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
          <span>
            <strong className="font-semibold">Bạn có biết:</strong> {letter.fact}
          </span>
        </p>
      ) : null}
    </div>
  );
}

/** Letter contents slide in from the right, then fade out after 5 seconds. */
export function ToastNotification() {
  const toast = useKimDongUiStore((state) => state.toast);

  return (
    <div className="pointer-events-none absolute top-40 right-3 flex justify-end overflow-hidden sm:top-20 sm:right-4">
      {toast ? (
        <ToastCard key={toast.key} toastKey={toast.key} letterIndex={toast.letterIndex} />
      ) : null}
    </div>
  );
}
