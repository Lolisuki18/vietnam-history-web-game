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
      <div className="absolute inset-0 flex items-end justify-center bg-black/55 p-4 backdrop-blur-md sm:items-center">
        {line && script ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hội thoại"
            className="w-full max-w-2xl rounded-2xl border border-amber-200/30 bg-stone-900/95 p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div
                aria-hidden
                className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-amber-300 bg-red-800 text-lg font-black text-amber-50"
              >
                {initials(line.speaker)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-300">
                  {line.speaker}
                  {line.role ? (
                    <span className="font-medium text-amber-100/70"> ({line.role})</span>
                  ) : null}
                </p>
                <p className="mt-2 text-lg leading-relaxed text-amber-50">{line.text}</p>
              </div>
            </div>

            {isLast && tips ? (
              <div className="mt-5 rounded-lg bg-black/30 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <Lightbulb className="size-4" aria-hidden /> Cách chơi
                </p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-amber-100/90">
                  {tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-4">
              <span className="text-xs text-amber-100/60">Nhấn Space hoặc bấm nút để tiếp tục</span>
              <Button ref={buttonRef} onClick={advance}>
                {isLast ? "Bắt đầu nhiệm vụ" : "Tiếp"}
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </FadeScreen>
  );
}
