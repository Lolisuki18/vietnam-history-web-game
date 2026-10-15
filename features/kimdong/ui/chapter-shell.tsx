"use client";

import { useEffect, useState } from "react";

import { GameCanvas } from "@/components/game/game-canvas";
import { hostEvents } from "@/features/kimdong/game/events";
import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import type { DialogueId } from "@/features/kimdong/types";

import { DialogueBox } from "./dialogue-box";
import { FadeScreen } from "./fade-screen";
import { Hud } from "./hud";
import { MenuScreen } from "./menu-screen";
import { PauseModal } from "./pause-modal";
import { ResultScreen } from "./result-screen";
import { ToastNotification } from "./toast-notification";
import { sendToGame, useKimDongBridge } from "./use-kimdong-bridge";

/** Loaded on demand: Phaser and the whole game stay out of every other page's bundle. */
const loadGame = () => import("@/features/kimdong/game/main").then((module) => module.createGame);

/**
 * Full-viewport shell: the Phaser game (canvas) is the background and React screens are
 * layered on top of it. Overlays let pointer events through unless they need them.
 * Menu → gameplay → result are cross-faded with CSS only.
 */
export function ChapterShell() {
  // The store outlives this page during client-side navigation: start (and leave) clean.
  useEffect(() => {
    const { reset } = useKimDongUiStore.getState();
    reset();
    return reset;
  }, []);

  useKimDongBridge();

  const screen = useKimDongUiStore((state) => state.screen);
  const dialogueOpen = useKimDongUiStore((state) => state.dialogueOpen);
  const startRun = useKimDongUiStore((state) => state.startRun);
  const closeDialogue = useKimDongUiStore((state) => state.closeDialogue);
  const [isPaused, setIsPaused] = useState(false);

  // Keys belong to the game only while playing; menus, dialogues, and pause take them back.
  useEffect(() => {
    hostEvents.emit("keyboard", screen === "playing" && !dialogueOpen && !isPaused);
  }, [screen, dialogueOpen, isPaused]);

  // The pause menu really freezes the game (physics, guards, timers), not just the keyboard.
  useEffect(() => {
    hostEvents.emit("pause", isPaused);
  }, [isPaused]);

  // ESC opens / closes the pause menu while playing. This is the only ESC handler.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && screen === "playing" && !dialogueOpen) {
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, dialogueOpen]);

  const handleStart = () => {
    setIsPaused(false);
    startRun();
    sendToGame({ type: "host:start" });
  };

  const handleReplay = () => {
    setIsPaused(false);
    startRun();
    sendToGame({ type: "host:restart" });
  };

  const handleDialogueClosed = (id: DialogueId) => {
    closeDialogue();
    sendToGame({ type: "host:dialogue-closed", id });
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#14231a]">
      <GameCanvas load={loadGame} label="Trò chơi Kim Đồng" />

      <FadeScreen show={screen === "playing"} className="pointer-events-none">
        <Hud onPause={() => setIsPaused(true)} />
      </FadeScreen>

      <ToastNotification />

      <DialogueBox onClose={handleDialogueClosed} />

      <FadeScreen show={screen === "menu"}>
        <MenuScreen onStart={handleStart} />
      </FadeScreen>

      <FadeScreen show={screen === "result"} duration={900}>
        <ResultScreen onReplay={handleReplay} />
      </FadeScreen>

      <PauseModal open={isPaused} onResume={() => setIsPaused(false)} onRestart={handleReplay} />
    </div>
  );
}
