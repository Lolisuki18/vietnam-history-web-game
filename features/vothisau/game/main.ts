import {
  createPauseController,
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
import { ForestScene } from "./scenes/forest-scene";
import { MarketScene } from "./scenes/market-scene";
import { PreloaderScene } from "./scenes/preloader-scene";
import { UiScene } from "./scenes/ui-scene";

/**
 * Create the Võ Thị Sáu game inside `parent`. Call from an effect and run `destroy` in its cleanup:
 * the module-level emitters of this game outlive the Phaser instance, so they are emptied on
 * teardown.
 */
export function createGame(parent: HTMLElement): GameHandle {
  const game = createPhaserGame(parent, {
    backgroundColor: "#14100c",
    pixelArt: PIXEL_ART,
    // Only the first scene starts automatically: PreloaderScene loads the art, then starts the
    // forest (act 1), which launches UiScene on top of itself and hands over to the market (act 2).
    scenes: [PreloaderScene, new ForestScene(), new MarketScene(), UiScene],
  });

  const pauseController = createPauseController(game);

  const cleanups: (() => void)[] = [
    hostEvents.on("restart", () => {
      // A restart must not wait behind a frozen game.
      pauseController.resume();
      game.sound.stopAll();
      game.scene.stop("market");
      game.scene.start("forest", { autostart: true });
    }),
    hostEvents.on("keyboard", (enabled) => setKeyboardEnabled(game, enabled)),
    hostEvents.on("pause", (paused) => {
      if (paused) {
        pauseController.pause();
        game.sound.pauseAll();
        return;
      }
      game.sound.resumeAll();
      pauseController.resume();
    }),
  ];

  if (process.env.NODE_ENV !== "production") {
    cleanups.push(
      installDebugHooks(debug, { onAction: () => gameEvents.emit("touch:action", undefined) }),
    );
    // Leak checks: listener counts must not grow when the chapter restarts.
    window.debugStats = () => ({
      hostListeners: hostEvents.listenerCount(),
      gameListeners: gameEvents.listenerCount(),
      uiListeners: chapterEvents.listenerCount(),
      canvases: parent.querySelectorAll("canvas").length,
      paused: game.isPaused,
      activeScenes: game.scene.getScenes(true).map((scene) => scene.scene.key),
      scene: debugHandlers.state?.(),
      touch: { ...touchInput },
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
