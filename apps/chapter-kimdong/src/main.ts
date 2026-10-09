import Phaser from "phaser";

import { debugHandlers, installDebugHooks } from "./debug";
import { gameEvents, hostEvents } from "./events";
import { connectHost } from "./host-bridge";
import { touchInput } from "./input-state";
import { RunnerScene } from "./scenes/runner-scene";
import { StealthScene } from "./scenes/stealth-scene";
import { UiScene } from "./scenes/ui-scene";

// Dev-only: `?timeoutloop` drives the game loop with setTimeout instead of requestAnimationFrame,
// which keeps it running at full speed in browsers that pause rAF for hidden panes (automated tests).
const useTimeoutLoop =
  import.meta.env.DEV && new URLSearchParams(location.search).has("timeoutloop");

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#14231a",
  // The host page decides who has keyboard focus (dialogues take it); never grab it back.
  autoFocus: false,
  fps: { forceSetTimeOut: useTimeoutLoop },
  // Fill the whole container; scenes adapt the camera zoom to the available size.
  scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
  physics: { default: "arcade", arcade: { debug: false } },
  // Only the first scene starts automatically; StealthScene launches UiScene on top of itself.
  scene: [StealthScene, UiScene, RunnerScene],
});

connectHost();
if (import.meta.env.DEV) {
  installDebugHooks();
  // Leak checks: listener and display-object counts must not grow when the chapter restarts.
  window.debugStats = () => ({
    hostListeners: hostEvents.listenerCount(),
    gameListeners: gameEvents.listenerCount(),
    activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
    scene: debugHandlers.state?.(),
    touch: { ...touchInput },
    displayObjects: Object.fromEntries(
      game.scene.getScenes(false).map((scene) => [scene.scene.key, scene.children.length]),
    ),
  });
  window.debugRestart = () => hostEvents.emit("restart", undefined);
}

hostEvents.on("restart", () => {
  // Replaying: leave the auto-runner (if it is running) and start the chapter over.
  game.scene.stop("runner");
  game.scene.start("stealth", { autostart: true });
});
