import { postChapterMessage } from "@vhg/engine";
import Phaser from "phaser";

import { gameEvents } from "./events";
import { GAME_HEIGHT, GAME_WIDTH, MainScene } from "./scenes/main-scene";

/** Origin of the page that embeds this game; progress messages are only sent there. */
const PARENT_ORIGIN = import.meta.env.VITE_PARENT_ORIGIN ?? "http://localhost:3000";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#14231a",
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MainScene],
});

gameEvents.on("progress", (progress) => {
  postChapterMessage({ type: "chapter:progress", progress }, PARENT_ORIGIN);
});

postChapterMessage({ type: "chapter:ready" }, PARENT_ORIGIN);

if (import.meta.env.DEV) {
  // Lets the embedding page trigger the cheat across origins, e.g.
  // iframe.contentWindow.postMessage({ source: "vhg-debug", type: "win" }, "http://localhost:5173")
  window.addEventListener("message", (event: MessageEvent<{ source?: string; type?: string }>) => {
    if (event.origin !== PARENT_ORIGIN) return;
    if (event.data?.source === "vhg-debug" && event.data.type === "win") window.debugWinGame?.();
  });
}
