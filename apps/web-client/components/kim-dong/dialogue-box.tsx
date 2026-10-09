"use client";

import { Button } from "@vhg/ui";
import { ChevronRight, Lightbulb } from "lucide-react";
import { useEffect, useRef } from "react";

import type { DialogueId } from "@vhg/engine";

import { DIALOGUES } from "@/data/kimdong-story";
import { useCoarsePointer } from "@/lib/use-coarse-pointer";
import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

import { FadeScreen } from "./fade-screen";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * Story dialogue over a blurred game. Space / Enter / click advances; the last line closes it.
 * The button takes keyboard focus while open so Space works without extra key handlers.
 */
export function DialogueBox({ onClose }: { onClose: (id: DialogueId) => void }) {
  const dialogue = useKimDongUiStore((state) => state.dialogue);
  const open = useKimDongUiStore((state) => state.dialogueOpen);
  const setDialogueLine = useKimDongUiStore((state) => state.setDialogueLine);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const touch = useCoarsePointer();
  const script = dialogue ? DIALOGUES[dialogue.id] : null;
  const tips = script ? (touch ? (script.touchTips ?? script.tips) : script.tips) : undefined;
  const line = script && dialogue ? script.lines[dialogue.line] : null;
  const isLast = !!script && !!dialogue && dialogue.line >= script.lines.length - 1;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => buttonRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open, dialogue?.line]);

  const advance = () => {
    if (!dialogue || !script) return;
    if (isLast) onClose(dialogue.id);
    else setDialogueLine(dialogue.line + 1);
  };

  return (
    <FadeScreen show={open}>
      <div className="absolute inset-0 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
        {line && script ? (
          // A hand-written letter on aged paper: double red border, ink-dark serif text.
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hội thoại"
            className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-md border-[3px] border-red-900 bg-gradient-to-b from-[#f4e4bb] to-[#e0c58a] p-1 shadow-2xl shadow-black/70"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_3px,rgba(120,80,20,0.05)_3px_4px)]"
            />
            <div className="relative rounded-sm border border-dashed border-red-900/60 p-4 text-stone-900 sm:p-7">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-red-950 bg-red-800 font-serif text-xl font-black text-amber-100 shadow-md shadow-black/40"
                >
                  {initials(line.speaker)}
                </div>
                <p className="font-serif text-lg font-bold text-red-900 sm:text-xl">
                  {line.speaker}
                  {line.role ? (
                    <span className="font-normal text-stone-700"> ({line.role})</span>
                  ) : null}
                </p>
              </div>

              <p className="mt-4 font-serif text-xl leading-relaxed text-stone-900 sm:text-2xl">
                {line.text}
              </p>

              {isLast && tips ? (
                <div className="mt-5 rounded border border-amber-900/30 bg-amber-900/10 p-4">
                  <p className="mb-2 flex items-center gap-2 font-serif text-base font-bold text-red-900">
                    <Lightbulb className="size-4" aria-hidden /> Cách chơi
                  </p>
                  <ul className="list-disc space-y-1 pl-5 font-serif text-base text-stone-800">
                    {tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-center text-xs text-stone-700 sm:text-left">
                  Nhấn Space hoặc bấm nút để tiếp tục
                </span>
                <Button ref={buttonRef} size="lg" onClick={advance}>
                  {isLast ? "Bắt đầu nhiệm vụ" : "Tiếp tục"}
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </FadeScreen>
  );
}
