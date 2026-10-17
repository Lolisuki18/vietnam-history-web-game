"use client";

import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, cn } from "@/components/ui";
import {
  FINAL_LINE,
  INTERROGATION_ANSWERS,
  INTERROGATION_INTRO,
  INTERROGATION_VERDICT,
  OUTRO_LINES,
  type Speaker,
  type StoryLine,
} from "@/features/vothisau/data/story";

import { Portrait } from "./portrait";
import { playUiSound } from "./ui-audio";

type Segment = "intro" | "answer" | "verdict";
type Stage = "talk" | "choose" | "fade" | "final";

const SPEAKERS: Record<Speaker, { name: string; portrait?: string; tone: string }> = {
  officer: {
    name: "Sĩ quan Pháp",
    portrait: "/assets/vothisau/images/portrait_officer.png",
    tone: "text-red-300",
  },
  sau: {
    name: "Chị Sáu",
    portrait: "/assets/vothisau/images/portrait_sau.png",
    tone: "text-amber-300",
  },
  narrator: { name: "", tone: "text-stone-400" },
};

const TYPE_MS = 24;
const FADE_TO_BLACK_MS = 2400;
const FINAL_REVEAL_MS = [900, 3600] as const;

/** A line typed out letter by letter; `reveal` shows all of it at once. */
function Typed({ text, reveal, onDone }: { text: string; reveal: boolean; onDone: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reveal) return;
    const timer = window.setInterval(() => setCount((value) => value + 1), TYPE_MS);
    return () => window.clearInterval(timer);
  }, [reveal]);
  const done = reveal || count >= text.length;
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  return <>{done ? text : text.slice(0, count)}</>;
}

/**
 * Act 3 – the interrogation room, as a visual novel. No walking: the officer presses, the player
 * answers once, and either answer keeps faith; the answer decides how the officer reacts. It ends
 * with the screen fading to black and the last line of the chapter.
 */
export function InterrogationScreen({ onDone }: { onDone: (path: 1 | 2) => void }) {
  const [segment, setSegment] = useState<Segment>("intro");
  const [stage, setStage] = useState<Stage>("talk");
  const [path, setPath] = useState<1 | 2 | null>(null);
  const [index, setIndex] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [typed, setTyped] = useState(false);
  const [finalStep, setFinalStep] = useState(0);
  const stopMusic = useRef<() => void>(() => undefined);

  const answer = INTERROGATION_ANSWERS.find((a) => a.id === path);
  const queue: readonly StoryLine[] =
    segment === "intro"
      ? INTERROGATION_INTRO
      : segment === "answer"
        ? (answer?.lines ?? [])
        : INTERROGATION_VERDICT;
  const line = queue[index];

  const markTyped = useCallback(() => setTyped(true), []);

  // The room's sounds: the boots on the floor when it opens, the fist on the table when he is angry.
  useEffect(() => {
    return playUiSound("sfx_boots_on_floor", 0.5);
  }, []);
  useEffect(() => {
    if (stage === "talk" && line?.mood === "angry") playUiSound("sfx_table_slam", 0.7);
  }, [stage, line]);
  useEffect(() => () => stopMusic.current(), []);

  // The fade to black, then the last line, then the epilogue.
  useEffect(() => {
    if (stage !== "fade") return;
    stopMusic.current = playUiSound("bgm_dan_tranh", 0.6, true);
    const timer = window.setTimeout(() => setStage("final"), FADE_TO_BLACK_MS);
    return () => window.clearTimeout(timer);
  }, [stage]);
  useEffect(() => {
    if (stage !== "final") return;
    const timers = FINAL_REVEAL_MS.map((delay, i) =>
      window.setTimeout(() => setFinalStep(i + 1), delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [stage]);

  const nextLine = () => {
    setReveal(false);
    setTyped(false);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      return;
    }
    setIndex(0);
    if (segment === "intro") setStage("choose");
    else if (segment === "answer") setSegment("verdict");
    else setStage("fade");
  };

  const advance = () => {
    if (!typed) setReveal(true);
    else nextLine();
  };

  const pick = (id: 1 | 2) => {
    setPath(id);
    setSegment("answer");
    setStage("talk");
    setIndex(0);
    setReveal(false);
    setTyped(false);
  };

  // Space / Enter advance the story, 1 / 2 pick the answer.
  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === "talk" && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        advanceRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);

  const speaker = line ? SPEAKERS[line.speaker] : null;
  const angry = stage === "talk" && line?.mood === "angry";
  const dark = stage === "fade" || stage === "final";

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0b0806]">
      {/* The painted room (web/interrogation_room.webp); it fades out with the rest at the end. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-[url('/assets/vothisau/web/interrogation_room.webp')] bg-cover bg-center transition-opacity duration-[1800ms]",
          dark ? "opacity-0" : "opacity-60",
        )}
      />
      {/* The light of the bulb: it gets redder when the officer loses his temper. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-colors duration-700",
          angry
            ? "bg-[radial-gradient(ellipse_at_50%_20%,rgba(160,40,20,0.45),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_50%_20%,rgba(214,170,70,0.35),transparent_60%)]",
        )}
      />
      <div
        className={cn(
          "relative flex min-h-full flex-col items-center justify-end gap-5 px-4 pt-28 pb-6 transition-opacity duration-[1800ms] sm:justify-center sm:pb-10",
          dark ? "opacity-0" : "opacity-100",
        )}
      >
        {/* The two across the table. */}
        <div className="flex w-full max-w-3xl items-end justify-between gap-4">
          {(["sau", "officer"] as const).map((who) => {
            const info = SPEAKERS[who];
            const active = stage === "talk" && line?.speaker === who;
            return (
              <div
                key={who}
                className={cn(
                  "flex flex-col items-center gap-2 transition-opacity duration-300",
                  active || stage === "choose" ? "opacity-100" : "opacity-45",
                )}
              >
                <Portrait
                  src={info.portrait}
                  name={info.name}
                  className="size-24 text-3xl sm:size-32"
                />
                <span className={cn("font-serif text-sm font-bold sm:text-base", info.tone)}>
                  {info.name}
                </span>
              </div>
            );
          })}
        </div>

        {stage === "talk" && line && speaker ? (
          <div
            className={cn(
              "w-full max-w-3xl rounded-sm border-2 bg-stone-950/90 p-5 sm:p-6",
              angry ? "border-red-800" : "border-amber-900/70",
            )}
          >
            {speaker.name ? (
              <p className={cn("font-serif text-lg font-bold", speaker.tone)}>{speaker.name}</p>
            ) : null}
            <p
              className={cn(
                "mt-1 min-h-[4.5rem] font-serif text-xl leading-relaxed sm:text-2xl",
                line.speaker === "narrator" ? "text-stone-300 italic" : "text-amber-50",
              )}
            >
              <Typed
                key={`${segment}-${index}`}
                text={line.text}
                reveal={reveal}
                onDone={markTyped}
              />
            </p>
            {line.note && typed ? (
              <p className="mt-2 text-sm text-stone-400 italic">{line.note}</p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-stone-500">Bấm Space hoặc nút để tiếp tục</span>
              <Button autoFocus onClick={advance}>
                {typed ? "Tiếp tục" : "Hiện hết"} <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}

        {stage === "choose" ? (
          <div className="flex w-full max-w-3xl animate-rise-in flex-col gap-3">
            <p className="text-center font-serif text-lg text-amber-200">Bạn đáp lại thế nào?</p>
            {INTERROGATION_ANSWERS.map((option) => (
              <button
                key={option.id}
                type="button"
                autoFocus={option.id === 1}
                onClick={() => pick(option.id)}
                className="rounded-sm border-2 border-amber-800/80 bg-stone-950/90 px-5 py-4 text-left transition-colors hover:border-amber-400 hover:bg-stone-900 focus-visible:border-amber-400 focus-visible:outline-none"
              >
                <span className="font-serif text-lg font-bold text-amber-300">{option.label}</span>
                <span className="mt-1 block font-serif text-base text-stone-300 italic">
                  “{option.lines[0]!.text}”
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* The end: a black screen, one last line, then what history says. */}
      {stage === "final" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black px-6 text-center">
          <p className="max-w-2xl animate-rise-in font-serif text-3xl leading-snug text-balance text-amber-200 sm:text-4xl">
            “{FINAL_LINE}”
          </p>
          <div
            className={cn(
              "flex max-w-xl flex-col items-center gap-3 transition-opacity duration-[1500ms]",
              finalStep >= 1 ? "opacity-100" : "opacity-0",
            )}
          >
            {OUTRO_LINES.map((text) => (
              <p key={text} className="font-serif text-base text-stone-300 sm:text-lg">
                {text}
              </p>
            ))}
          </div>
          <div
            inert={finalStep < 2}
            className={cn(
              "transition-opacity duration-1000",
              finalStep >= 2 ? "opacity-100" : "invisible opacity-0",
            )}
          >
            <Button size="lg" autoFocus={finalStep >= 2} onClick={() => onDone(path ?? 1)}>
              Xem kết quả
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
