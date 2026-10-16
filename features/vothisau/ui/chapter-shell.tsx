"use client";

import { useEffect, useState } from "react";

import { FadeScreen } from "@/components/game/fade-screen";
import { GameCanvas } from "@/components/game/game-canvas";
import { hostEvents } from "@/features/vothisau/game/events";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";
import {
  VOTHISAU_ID,
  type ChoiceId,
  type ChoiceOption,
  type DialogueId,
} from "@/features/vothisau/types";
import { useProgressStore } from "@/stores/progress-store";

import { ActCard } from "./act-card";
import { BuyerQte } from "./buyer-qte";
import { ChoiceModal } from "./choice-modal";
import { DialogueBox } from "./dialogue-box";
import { Hud } from "./hud";
import { InterrogationScreen } from "./interrogation-screen";
import { LorePopup } from "./lore-popup";
import { MenuScreen } from "./menu-screen";
import { PauseModal } from "./pause-modal";
import { ResultScreen } from "./result-screen";
import { sendToGame, useVoThiSauBridge } from "./use-vothisau-bridge";

/** Loaded on demand: Phaser and the whole game stay out of every other page's bundle. */
const loadGame = () => import("@/features/vothisau/game/main").then((module) => module.createGame);

/**
 * Full-viewport shell: the Phaser game (canvas) is the background and React screens are layered on
 * top of it. Acts 1 and 2 are Phaser; act 3 (the interrogation) is a React visual novel that covers
 * the canvas, which is frozen meanwhile.
 */
export function ChapterShell() {
  // The store outlives this page during client-side navigation: start (and leave) clean.
  useEffect(() => {
    const { reset } = useVoThiSauUiStore.getState();
    reset();
    return reset;
  }, []);

  useVoThiSauBridge();

  const screen = useVoThiSauUiStore((state) => state.screen);
  const dialogueOpen = useVoThiSauUiStore((state) => state.dialogueOpen);
  const choiceOpen = useVoThiSauUiStore((state) => state.choice !== null);
  const qteOpen = useVoThiSauUiStore((state) => state.qteKey !== null);
  const stats = useVoThiSauUiStore((state) => state.stats);
  const startRun = useVoThiSauUiStore((state) => state.startRun);
  const closeDialogue = useVoThiSauUiStore((state) => state.closeDialogue);
  const closeChoice = useVoThiSauUiStore((state) => state.closeChoice);
  const closeQte = useVoThiSauUiStore((state) => state.closeQte);
  const finish = useVoThiSauUiStore((state) => state.finish);
  const [isPaused, setIsPaused] = useState(false);

  const playing = screen === "playing";
  const frozen =
    isPaused || choiceOpen || qteOpen || screen === "interrogation" || screen === "result";

  // Keys belong to the game only while playing; menus, dialogues, questions and pause take them back.
  useEffect(() => {
    hostEvents.emit("keyboard", playing && !dialogueOpen && !frozen);
  }, [playing, dialogueOpen, frozen]);

  // The pause menu, a timed question and the interrogation really freeze the game.
  useEffect(() => {
    hostEvents.emit("pause", frozen);
  }, [frozen]);

  // ESC opens / closes the pause menu while playing. This is the only ESC handler.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && playing && !dialogueOpen && !choiceOpen && !qteOpen) {
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playing, dialogueOpen, choiceOpen, qteOpen]);

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

  const handleChoice = (id: ChoiceId, option: ChoiceOption) => {
    closeChoice();
    sendToGame({ type: "host:choice-made", id, option });
  };

  const handleQte = (passed: boolean) => {
    closeQte();
    sendToGame({ type: "host:qte-done", passed });
  };

  const handleInterrogationDone = (path: 1 | 2) => {
    if (!stats) return;
    const outcome = { ...stats, interrogationPath: path };
    finish(outcome);
    useProgressStore.getState().completeChapter(VOTHISAU_ID, outcome);
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#14100c]">
      <GameCanvas load={loadGame} label="Trò chơi Võ Thị Sáu" />

      <FadeScreen show={playing} className="pointer-events-none">
        <Hud onPause={() => setIsPaused(true)} />
      </FadeScreen>

      <ActCard />
      <LorePopup />
      <DialogueBox onClose={handleDialogueClosed} />
      <ChoiceModal onChoose={handleChoice} />
      <BuyerQte onDone={handleQte} />

      <FadeScreen show={screen === "menu"}>
        <MenuScreen onStart={handleStart} />
      </FadeScreen>

      <FadeScreen show={screen === "interrogation"} duration={900}>
        {screen === "interrogation" ? (
          <InterrogationScreen onDone={handleInterrogationDone} />
        ) : null}
      </FadeScreen>

      <FadeScreen show={screen === "result"} duration={900}>
        <ResultScreen onReplay={handleReplay} />
      </FadeScreen>

      <PauseModal open={isPaused} onResume={() => setIsPaused(false)} onRestart={handleReplay} />
    </div>
  );
}
