"use client";

import {
  listenChapterMessages,
  postHostMessage,
  type ChapterMessage,
  type HostMessageInput,
} from "@vhg/engine";
import { useCallback, useEffect, type RefObject } from "react";

import { CHAPTER_KIMDONG_ORIGIN } from "@/lib/env";
import { useProgressStore } from "@/stores/progress-store";
import { useKimDongUiStore } from "@/stores/kimdong-ui-store";

const HELLO_INTERVAL_MS = 400;

/** Route a message from the game iframe into the Zustand stores. */
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

/**
 * Connects the page to the chapter iframe: incoming messages update the stores,
 * and the returned `send` posts commands down to the game.
 */
export function useKimDongBridge(frameRef: RefObject<HTMLIFrameElement | null>) {
  // Handshake: the game may have announced itself before this listener existed (or before the
  // iframe finished loading), so keep saying hello until it answers with `chapter:ready`.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (useKimDongUiStore.getState().ready) {
        window.clearInterval(timer);
        return;
      }
      postHostMessage(
        frameRef.current?.contentWindow,
        { type: "host:hello" },
        CHAPTER_KIMDONG_ORIGIN,
      );
    }, HELLO_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [frameRef]);

  useEffect(
    () =>
      listenChapterMessages(
        applyChapterMessage,
        CHAPTER_KIMDONG_ORIGIN,
        () => frameRef.current?.contentWindow,
      ),
    [frameRef],
  );

  return useCallback(
    (message: HostMessageInput) =>
      postHostMessage(frameRef.current?.contentWindow, message, CHAPTER_KIMDONG_ORIGIN),
    [frameRef],
  );
}
