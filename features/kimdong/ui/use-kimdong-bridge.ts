"use client";

import { useEffect } from "react";

import { chapterEvents } from "@/features/kimdong/game/host-bridge";
import { hostEvents } from "@/features/kimdong/game/events";
import { useKimDongUiStore } from "@/features/kimdong/store/ui-store";
import type { ChapterMessage, HostMessage } from "@/lib/engine";
import { useProgressStore } from "@/stores/progress-store";

/** Route a message from the game into the Zustand stores. */
function applyChapterMessage(message: ChapterMessage): void {
  const ui = useKimDongUiStore.getState();
  switch (message.type) {
    case "chapter:ready":
      ui.setReady();
      break;
    case "chapter:progress":
      ui.setCollected(message.progress.collected, message.progress.total);
      useProgressStore.getState().setProgress(message.progress);
      break;
    case "chapter:letter":
      ui.showToast(message.index);
      break;
    case "chapter:phase":
      ui.setPhase(message.phase);
      break;
    case "chapter:dialogue":
      ui.openDialogue(message.id);
      break;
    case "chapter:alert":
      ui.setAlert(message.value);
      break;
    case "chapter:complete":
      ui.finish(message.outcome);
      useProgressStore.getState().completeChapter("kim-dong", message.outcome);
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
  }
}

/**
 * Connects the page to the game running in the same window: game messages update the stores.
 * Must be subscribed before the game is created (the game announces `chapter:ready` once).
 */
export function useKimDongBridge(): void {
  useEffect(() => chapterEvents.on("message", applyChapterMessage), []);
}
