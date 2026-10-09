"use client";

import type { DialogueId } from "@vhg/engine";
import { useEffect, useRef } from "react";

import { CHAPTER_KIMDONG_URL } from "@/lib/env";
import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

import { DialogueBox } from "./dialogue-box";
import { FadeScreen } from "./fade-screen";
import { Hud } from "./hud";
import { MenuScreen } from "./menu-screen";
import { ResultScreen } from "./result-screen";
import { ToastNotification } from "./toast-notification";
import { useKimDongBridge } from "./use-kimdong-bridge";

/**
 * Full-viewport shell: the Phaser game (iframe) is the background and React screens are
 * layered on top of it. Overlays let pointer events through unless they need them.
 * Menu → gameplay → result are cross-faded with CSS only.
 */
export function ChapterShell() {
  const frameRef = useRef<HTMLIFrameElement>(null);

  // The store outlives this page during client-side navigation: start (and leave) clean.
  useEffect(() => {
    const { reset } = useKimDongUiStore.getState();
    reset();
    return reset;
  }, []);

  const send = useKimDongBridge(frameRef);

  const screen = useKimDongUiStore((state) => state.screen);
  const dialogueOpen = useKimDongUiStore((state) => state.dialogueOpen);
  const startRun = useKimDongUiStore((state) => state.startRun);
  const closeDialogue = useKimDongUiStore((state) => state.closeDialogue);

  // Keyboard input must go to the game while playing; dialogues take focus themselves.
  useEffect(() => {
    if (screen === "playing" && !dialogueOpen) frameRef.current?.focus();
  }, [screen, dialogueOpen]);

  const handleStart = () => {
    startRun();
    send({ type: "host:start" });
  };

  const handleReplay = () => {
    startRun();
    send({ type: "host:restart" });
  };

  const handleDialogueClosed = (id: DialogueId) => {
    closeDialogue();
    send({ type: "host:dialogue-closed", id });
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#14231a]">
      <iframe
        ref={frameRef}
        src={CHAPTER_KIMDONG_URL}
        title="Chương Kim Đồng"
        allow="autoplay; fullscreen"
        className="absolute inset-0 size-full border-0"
      />

      <FadeScreen show={screen === "playing"} className="pointer-events-none">
        <Hud />
      </FadeScreen>

      <ToastNotification />

      <DialogueBox onClose={handleDialogueClosed} />

      <FadeScreen show={screen === "menu"}>
        <MenuScreen onStart={handleStart} />
      </FadeScreen>

      <FadeScreen show={screen === "result"} duration={900}>
        <ResultScreen onReplay={handleReplay} />
      </FadeScreen>
    </div>
  );
}
