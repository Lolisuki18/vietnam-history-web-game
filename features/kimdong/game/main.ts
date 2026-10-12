import {
  createPhaserGame,
  destroyPhaserGame,
  setKeyboardEnabled,
  type GameHandle,
} from "@/lib/game/phaser";
import { installDebugHooks } from "@/lib/game/debug";
import { resetTouchInput } from "@/lib/game/touch-input";

import { PIXEL_ART } from "./config";
import { debug, debugHandlers } from "./debug";
import { gameEvents, hostEvents } from "./events";
import { chapterEvents } from "./host-bridge";
import { touchInput } from "./input-state";
import { PreloaderScene } from "./scenes/preloader-scene";
import { RunnerScene } from "./scenes/runner-scene";
import { StealthScene } from "./scenes/stealth-scene";
import { UiScene } from "./scenes/ui-scene";

/**
 * Create the Kim Đồng game inside `parent`. Call from an effect and run `destroy` in its cleanup:
 * the module-level emitters of this game outlive the Phaser instance, so they are emptied on
 * teardown.
 */
export function createGame(parent: HTMLElement): GameHandle {
  const game = createPhaserGame(parent, {
    backgroundColor: "#14231a",
    pixelArt: PIXEL_ART,
    // Only the first scene starts automatically: PreloaderScene loads the art, then starts
    // StealthScene, which launches UiScene on top of itself.
    scenes: [PreloaderScene, StealthScene, UiScene, RunnerScene],
  });

  const cleanups: (() => void)[] = [
    hostEvents.on("restart", () => {
      // Replaying: leave the auto-runner (if it is running) and start the chapter over.
      game.scene.stop("runner");
      game.scene.start("stealth", { autostart: true });
    }),
    hostEvents.on("keyboard", (enabled) => setKeyboardEnabled(game, enabled)),
  ];

  if (process.env.NODE_ENV !== "production") {
    cleanups.push(
      installDebugHooks(debug, { onAction: () => gameEvents.emit("touch:action", undefined) }),
    );
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
      destroyPhaserGame(game);
      hostEvents.clear();
      gameEvents.clear();
      resetTouchInput(touchInput);
    },
  };
}
