"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { FadeScreen } from "@/components/game/fade-screen";
import { cn } from "@/components/ui";
import { CHOICES, type ChoiceOptionContent } from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";
import type { ChoiceId, ChoiceOption } from "@/features/vothisau/types";

/** The buttons in a different order for every question (a seeded shuffle, so rendering is pure). */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = (seed * 2654435761) >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function ChoiceBody({
  id,
  seed,
  onChoose,
}: {
  id: ChoiceId;
  seed: number;
  onChoose: (id: ChoiceId, option: ChoiceOption) => void;
}) {
  const script = CHOICES[id];
  const totalMs = script.seconds * 1000;
  const [left, setLeft] = useState(totalMs);
  const answered = useRef(false);
  // The parent passes a new function on every render: keep the latest without restarting the timer.
  const onChooseRef = useRef(onChoose);
  useEffect(() => {
    onChooseRef.current = onChoose;
  }, [onChoose]);
  const options: ChoiceOptionContent[] = useMemo(
    () => (script.shuffle ? shuffled(script.options, seed) : [...script.options]),
    [script, seed],
  );

  const choose = (option: ChoiceOption) => {
    if (answered.current) return;
    answered.current = true;
    onChooseRef.current(id, option);
  };

  // The countdown runs on real time: the game itself is frozen behind this window.
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = () => {
      const remaining = totalMs - (performance.now() - start);
      if (remaining <= 0) {
        setLeft(0);
        if (!answered.current) {
          answered.current = true;
          onChooseRef.current(id, "timeout");
        }
        return;
      }
      setLeft(remaining);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [id, totalMs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const index = Number(e.key) - 1;
      const option = options[index];
      if (option) choose(option.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // `choose` only reads refs and props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const urgent = left < 1000;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={script.title}
      className="flex w-full max-w-xl animate-rise-in flex-col gap-4 rounded-sm border-[3px] border-red-900 bg-stone-950/95 p-5 sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-red-400 sm:text-2xl">{script.title}</h2>
        <span
          className={cn(
            "font-serif text-2xl font-black tabular-nums",
            urgent ? "animate-pulse text-red-500" : "text-amber-300",
          )}
        >
          {(left / 1000).toFixed(1)}s
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-sm border border-black bg-stone-900">
        <div
          className={cn("h-full", urgent ? "bg-red-600" : "bg-amber-400")}
          style={{ width: `${(left / totalMs) * 100}%` }}
        />
      </div>

      <p className="font-serif text-lg leading-relaxed text-amber-100">
        <strong className="text-red-300">{script.speaker}:</strong> “{script.prompt}”
      </p>

      <div className="flex flex-col gap-2.5">
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            autoFocus={index === 0}
            onClick={() => choose(option.id)}
            className="flex items-start gap-3 rounded-sm border-2 border-amber-800/70 bg-stone-900 px-4 py-3 text-left font-serif text-base text-amber-100 transition-colors hover:border-amber-400 hover:bg-stone-800 focus-visible:border-amber-400 focus-visible:outline-none sm:text-lg"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm bg-amber-700 text-sm font-black text-stone-950">
              {index + 1}
            </span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A timed question (the checkpoint, Cai Tòng): the game is frozen until it is answered. */
export function ChoiceModal({
  onChoose,
}: {
  onChoose: (id: ChoiceId, option: ChoiceOption) => void;
}) {
  const choice = useVoThiSauUiStore((state) => state.choice);

  return (
    <FadeScreen show={choice !== null} duration={250}>
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
        {choice ? (
          <ChoiceBody key={choice.key} id={choice.id} seed={choice.key} onChoose={onChoose} />
        ) : null}
      </div>
    </FadeScreen>
  );
}
