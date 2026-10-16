"use client";

import { ChevronRight, FastForward, Lightbulb } from "lucide-react";
import { useEffect, useRef } from "react";

import { FadeScreen } from "@/components/game/fade-screen";
import { Button } from "@/components/ui";
import { DIALOGUES } from "@/features/vothisau/data/story";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";
import type { DialogueId } from "@/features/vothisau/types";

import { Portrait } from "./portrait";

/**
 * Story dialogue on aged paper (the "giấy dó" modal). Space / Enter / click advances; the last line
 * closes it. The button takes keyboard focus while open so Space works without extra key handlers.
 */
export function DialogueBox({ onClose }: { onClose: (id: DialogueId) => void }) {
  const dialogue = useVoThiSauUiStore((state) => state.dialogue);
  const open = useVoThiSauUiStore((state) => state.dialogueOpen);
  const setDialogueLine = useVoThiSauUiStore((state) => state.setDialogueLine);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const script = dialogue ? DIALOGUES[dialogue.id] : null;
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

  const skipToLast = () => {
    if (!dialogue || !script) return;
    setDialogueLine(script.lines.length - 1);
  };

  return (
    <FadeScreen show={open}>
      <div className="absolute inset-0 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4">
        {line && script ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hội thoại"
            className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-sm border-[3px] border-red-950 bg-[#ecd9a8] bg-[url('/assets/shared/textures/paper-aged.webp')] bg-cover bg-center p-1.5"
          >
            <div className="relative rounded-lg border border-dashed border-red-900/60 p-5 text-stone-900 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Portrait src={line.portrait} name={line.speaker} />
                  <div>
                    <p className="font-serif text-lg font-bold text-red-950 sm:text-xl">
                      {line.speaker}
                      {line.role ? (
                        <span className="font-normal text-stone-800"> ({line.role})</span>
                      ) : null}
                    </p>
                    <span className="text-[11px] font-semibold tracking-wider text-red-900 uppercase">
                      Trạm gác ngầm
                    </span>
                  </div>
                </div>

                {!isLast && (
                  <button
                    type="button"
                    onClick={skipToLast}
                    className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-red-900"
                  >
                    <FastForward className="size-3.5" />
                    <span>Lướt qua</span>
                  </button>
                )}
              </div>

              <p className="mt-4 font-serif text-xl leading-relaxed text-stone-900 sm:text-2xl">
                {line.text}
              </p>

              {isLast && script.tips ? (
                <div className="mt-5 rounded-lg border border-amber-900/40 bg-amber-950/15 p-4">
                  <p className="mb-2 flex items-center gap-2 font-serif text-base font-bold text-red-950">
                    <Lightbulb className="size-4 text-red-900" aria-hidden /> Dặn dò cho hồi sau:
                  </p>
                  <ul className="list-disc space-y-1.5 pl-5 font-serif text-base text-stone-900">
                    {script.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-center text-xs font-medium text-stone-700 sm:text-left">
                  Bấm phím <strong>Space</strong> hoặc nút để tiếp tục
                </span>
                <Button ref={buttonRef} size="lg" onClick={advance}>
                  {isLast ? "Vào chợ Đất Đỏ" : "Tiếp tục"}
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
