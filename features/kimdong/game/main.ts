import Phaser from "phaser";

import { PIXEL_ART } from "./config";
import { debugHandlers, installDebugHooks } from "./debug";
import { gameEvents, hostEvents } from "./events";
import { chapterEvents } from "./host-bridge";
import { clearTouchDirections, touchInput } from "./input-state";
import { PreloaderScene } from "./scenes/preloader-scene";
import { RunnerScene } from "./scenes/runner-scene";
import { StealthScene } from "./scenes/stealth-scene";
import { UiScene } from "./scenes/ui-scene";

export interface GameHandle {
  /** Stop every scene, remove the canvas and drop all listeners. */
  destroy: () => void;
}

/**
 * Create the Kim Đồng game inside `parent`. Call from an effect and run `destroy` in its cleanup:
 * the module-level emitters outlive the Phaser instance, so they are emptied on teardown.
 */
export function createGame(parent: HTMLElement): GameHandle {
  const dev = process.env.NODE_ENV !== "production";
  // Dev-only: `?timeoutloop` drives the game loop with setTimeout instead of requestAnimationFrame,
  // which keeps it running at full speed in browsers that pause rAF for hidden panes.
  const useTimeoutLoop = dev && new URLSearchParams(location.search).has("timeoutloop");

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: "#14231a",
    // React decides who has keyboard focus (dialogues take it); never grab it back.
    autoFocus: false,
    fps: { forceSetTimeOut: useTimeoutLoop },
    // Fill the whole container; scenes adapt the camera zoom to the available size.
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    physics: { default: "arcade", arcade: { debug: false } },
    pixelArt: PIXEL_ART,
    // Only the first scene starts automatically: PreloaderScene loads the art, then starts
    // StealthScene, which launches UiScene on top of itself.
    scene: [PreloaderScene, StealthScene, UiScene, RunnerScene],
  });

  const cleanups: (() => void)[] = [
    hostEvents.on("restart", () => {
      // Replaying: leave the auto-runner (if it is running) and start the chapter over.
      game.scene.stop("runner");
      game.scene.start("stealth", { autostart: true });
    }),
    hostEvents.on("keyboard", (enabled) => {
      // A disabled keyboard manager neither reports keys nor calls preventDefault on them.
      if (game.input.keyboard) game.input.keyboard.enabled = enabled;
    }),
  ];

  if (dev) {
    cleanups.push(installDebugHooks());
    // Leak checks: listener and display-object counts must not grow when the chapter restarts.
    window.debugStats = () => ({
      hostListeners: hostEvents.listenerCount(),
      gameListeners: gameEvents.listenerCount(),
      uiListeners: chapterEvents.listenerCount(),
      canvases: parent.querySelectorAll("canvas").length,
      activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
      scene: debugHandlers.state?.(),
      touch: { ...touchInput },
      displayObjects: Object.fromEntries(
        game.scene.getScenes(false).map((scene) => [scene.scene.key, scene.children.length]),
      ),
    });
    window.debugRestart = () => hostEvents.emit("restart", undefined);
    cleanups.push(() => {
      delete window.debugStats;
      delete window.debugRestart;
    });
  }

  return {
    destroy: () => {
      for (const cleanup of cleanups) cleanup();
      // Scenes release their own listeners / audio in their SHUTDOWN handlers, which Phaser only
      // emits when a scene is stopped (destroying the game skips it).
      for (const scene of game.scene.getScenes(false)) game.scene.stop(scene.scene.key);
      game.destroy(true);
      hostEvents.clear();
      gameEvents.clear();
      touchInput.enabled = false;
      touchInput.visible = false;
      clearTouchDirections();
    },
  };
}
