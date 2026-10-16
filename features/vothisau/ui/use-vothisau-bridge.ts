"use client";

import { useEffect } from "react";

import { hostEvents } from "@/features/vothisau/game/events";
import { chapterEvents } from "@/features/vothisau/game/host-bridge";
import { useVoThiSauUiStore } from "@/features/vothisau/store/ui-store";
import { useProgressStore } from "@/stores/progress-store";

import type { ChapterMessage, HostMessage } from "../types";

/** Route a message from the game into the Zustand stores. */
function applyChapterMessage(message: ChapterMessage): void {
  const ui = useVoThiSauUiStore.getState();
  switch (message.type) {
    case "chapter:ready":
      ui.setReady();
      break;
    case "chapter:progress":
      ui.setCollected(message.progress.collected, message.progress.total);
      useProgressStore.getState().setProgress(message.progress);
      break;
    case "chapter:act":
      ui.setAct(message.act);
      break;
    case "chapter:phase":
      ui.setPhase(message.phase);
      break;
    case "chapter:lore":
      ui.showToast(message.index);
      break;
    case "chapter:dialogue":
      ui.openDialogue(message.id);
      break;
    case "chapter:choice":
      ui.openChoice(message.id);
      break;
    case "chapter:qte":
      ui.openQte();
      break;
    case "chapter:alert":
      ui.setAlert(message.value);
      break;
    case "chapter:grenade":
      ui.setGrenade(message.has);
      break;
    case "chapter:escaped":
      ui.enterInterrogation(message.stats);
      break;
  }
}

/** Send a command down to the game. */
export function sendToGame(message: HostMessage): void {
  switch (message.type) {
    case "host:start":
      hostEvents.emit("start", undefined);
      break;
    case "host:restart":
      hostEvents.emit("restart", undefined);
      break;
    case "host:dialogue-closed":
      hostEvents.emit("dialogue-closed", message.id);
      break;
    case "host:choice-made":
      hostEvents.emit("choice-made", { id: message.id, option: message.option });
      break;
    case "host:qte-done":
      hostEvents.emit("qte-done", { passed: message.passed });
      break;
  }
}

/**
 * Connects the page to the game running in the same window: game messages update the stores.
 * Must be subscribed before the game is created (the game announces `chapter:ready` once).
 */
export function useVoThiSauBridge(): void {
  useEffect(() => chapterEvents.on("message", applyChapterMessage), []);
}
