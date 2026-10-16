"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { FadeScreen } from "@/components/game/fade-screen";
import { cn } from "@/components/ui";
import { BUYER_QTE } from "@/features/vothisau/game/config";
import { sweep } from "@/features/vothisau/game/systems/motion";
import { CHOICES } from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";

type Stage = "ready" | "sweep" | "judged";

function QteBody({ onDone }: { onDone: (passed: boolean) => void }) {
  const [round, setRound] = useState(0);
  const [stage, setStage] = useState<Stage>("ready");
  const [results, setResults] = useState<boolean[]>([]);
  const [cursor, setCursor] = useState(0);
  const startedAt = useRef(0);
  const cursorRef = useRef(0);
  const finished = useRef(false);
  // The parent passes a new function on every render: keep the latest without restarting timers.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  // "ready" → "sweep": a short breath before the cursor starts moving.
  useEffect(() => {
    if (stage !== "ready") return;
    const timer = window.setTimeout(
      () => {
        startedAt.current = performance.now();
        setStage("sweep");
      },
      round === 0 ? BUYER_QTE.startDelayMs : BUYER_QTE.gapMs,
    );
    return () => window.clearTimeout(timer);
  }, [stage, round]);

  // The cursor sweeps the bar (real time: the game is frozen behind this window).
  useEffect(() => {
    if (stage !== "sweep") return;
    const period = BUYER_QTE.sweepMs[Math.min(round, BUYER_QTE.sweepMs.length - 1)]!;
    let frame = 0;
    const tick = () => {
      const position = sweep(performance.now() - startedAt.current, period, 0, 1);
      cursorRef.current = position;
      setCursor(position);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stage, round]);

  const press = useCallback(() => {
    if (stage !== "sweep") return;
    const hit = Math.abs(cursorRef.current - 0.5) <= BUYER_QTE.zoneHalf;
    setResults((previous) => [...previous, hit]);
    setStage("judged");
  }, [stage]);

  // "judged" → next round, or the end.
  useEffect(() => {
    if (stage !== "judged") return;
    const timer = window.setTimeout(() => {
      if (round + 1 < BUYER_QTE.rounds) {
        setRound((value) => value + 1);
        setStage("ready");
        return;
      }
      if (finished.current) return;
      finished.current = true;
      const misses = results.filter((hit) => !hit).length;
      onDoneRef.current(misses <= BUYER_QTE.maxMisses);
    }, BUYER_QTE.gapMs + 300);
    return () => window.clearTimeout(timer);
  }, [stage, round, results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== "Enter") return;
      e.preventDefault();
      press();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const reply = CHOICES.caitong.options[0]!.reply;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đóng vai người mua hàng"
      className="flex w-full max-w-xl animate-rise-in flex-col gap-4 rounded-sm border-[3px] border-red-900 bg-stone-950/95 p-5 sm:p-6"
    >
      <h2 className="font-serif text-xl font-bold text-amber-400 sm:text-2xl">
        Đóng vai người mua hàng
      </h2>
      <p className="font-serif text-base leading-relaxed text-amber-100">
        <strong className="text-red-300">Chị Sáu:</strong> “{reply}”
      </p>
      <p className="text-sm text-stone-300">
        Giữ giọng thật bình tĩnh: bấm <strong>Space</strong> khi con trượt nằm trong vùng sáng.
        Trượt quá một lần là lộ.
      </p>

      <div className="relative h-9 overflow-hidden rounded-sm border-2 border-amber-800 bg-stone-900">
        <div
          className="absolute inset-y-0 bg-amber-400/70"
          style={{
            left: `${(0.5 - BUYER_QTE.zoneHalf) * 100}%`,
            width: `${BUYER_QTE.zoneHalf * 2 * 100}%`,
          }}
        />
        <div
          className="absolute inset-y-0 w-1.5 -translate-x-1/2 bg-red-500"
          style={{ left: `${cursor * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2" aria-label="Kết quả từng lượt">
          {Array.from({ length: BUYER_QTE.rounds }, (_, index) => {
            const result = results[index];
            return (
              <span
                key={index}
                className={cn(
                  "size-4 rounded-full border-2",
                  result === undefined
                    ? "border-stone-600"
                    : result
                      ? "border-emerald-400 bg-emerald-500"
                      : "border-red-500 bg-red-600",
                )}
              />
            );
          })}
        </div>
        <button
          type="button"
          autoFocus
          onClick={press}
          disabled={stage !== "sweep"}
          className="rounded-sm border-2 border-amber-600 bg-amber-700 px-6 py-2 font-serif text-lg font-bold text-stone-950 transition-colors enabled:hover:bg-amber-500 disabled:opacity-50"
        >
          Nói!
        </button>
      </div>
    </div>
  );
}

/** The timing game for playing the buyer in front of Cai Tòng. The game is frozen meanwhile. */
export function BuyerQte({ onDone }: { onDone: (passed: boolean) => void }) {
  const qteKey = useVoThiSauUiStore((state) => state.qteKey);

  return (
    <FadeScreen show={qteKey !== null} duration={250}>
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
        {qteKey !== null ? <QteBody key={qteKey} onDone={onDone} /> : null}
      </div>
    </FadeScreen>
  );
}
