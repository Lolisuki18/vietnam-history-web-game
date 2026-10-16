"use client";

import { useEffect, useState } from "react";

import { cn } from "@/components/ui";
import { ACT_TITLES } from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";

const SHOW_MS = 3200;
const FADE_MS = 700;

/** The title of an act (Hồi 1, 2, 3) shows over the game for a few seconds, then fades. */
function Card({ cardKey, act }: { cardKey: number; act: 1 | 2 | 3 }) {
  const [visible, setVisible] = useState(false);
  const titles = ACT_TITLES[act];

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setVisible(true), 30),
      window.setTimeout(() => setVisible(false), SHOW_MS - FADE_MS),
      window.setTimeout(() => useVoThiSauUiStore.getState().hideActCard(cardKey), SHOW_MS),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [cardKey]);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-sm border-y-2 border-amber-700/70 bg-black/75 px-10 py-5 text-center transition-opacity",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <p className="font-serif text-sm tracking-[0.3em] text-red-400 uppercase">{titles.label}</p>
      <h2 className="font-serif text-3xl font-bold text-amber-300 sm:text-4xl">{titles.title}</h2>
      <p className="font-serif text-base text-stone-300 italic">{titles.subtitle}</p>
    </div>
  );
}

export function ActCard() {
  const card = useVoThiSauUiStore((state) => state.actCard);
  const screen = useVoThiSauUiStore((state) => state.screen);
  // The menu and the result have their own titles.
  const show = card !== null && (screen === "playing" || screen === "interrogation");

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[22%] z-30 flex justify-center px-4">
      {show && card ? <Card key={card.key} cardKey={card.key} act={card.act} /> : null}
    </div>
  );
}
