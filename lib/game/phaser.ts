import Phaser from "phaser";

export interface GameHandle {
  /** Stop every scene, remove the canvas and drop all listeners. */
  destroy: () => void;
}

export interface PhaserGameOptions {
  /** Scene classes; only the first one starts automatically. */
  scenes: Phaser.Types.Scenes.SceneType[];
  /** Crisp, unsmoothed scaling for pixel art. */
  pixelArt?: boolean;
  backgroundColor?: string;
}

/**
 * Create a Phaser game that fills `parent` (resizes with it). Phaser must only be imported on the
 * client, so call this from code that was loaded with a dynamic `import()` inside an effect.
 */
export function createPhaserGame(parent: HTMLElement, options: PhaserGameOptions): Phaser.Game {
  // Dev-only: `?timeoutloop` drives the game loop with setTimeout instead of requestAnimationFrame,
  // which keeps it running at full speed in browsers that pause rAF for hidden panes.
  const useTimeoutLoop =
    process.env.NODE_ENV !== "production" &&
    new URLSearchParams(location.search).has("timeoutloop");

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: options.backgroundColor ?? "#000000",
    // React decides who has keyboard focus (dialogues take it); never grab it back.
    autoFocus: false,
    fps: { forceSetTimeOut: useTimeoutLoop },
    // Fill the whole container; scenes adapt the camera zoom to the available size.
    scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
    physics: { default: "arcade", arcade: { debug: false } },
    pixelArt: options.pixelArt ?? false,
    scene: options.scenes,
  });
}

/**
 * Whether Phaser may read (and swallow) the keyboard. A disabled keyboard manager neither reports
 * keys nor calls preventDefault on them, so React dialogs keep Space / Enter.
 */
export function setKeyboardEnabled(game: Phaser.Game, enabled: boolean): void {
  if (game.input.keyboard) game.input.keyboard.enabled = enabled;
}

/**
 * Tear a game down. Scenes release their own listeners / audio in their SHUTDOWN handlers, which
 * Phaser only emits when a scene is stopped (destroying the game skips it), so stop them first.
 */
export function destroyPhaserGame(game: Phaser.Game): void {
  for (const scene of game.scene.getScenes(false)) game.scene.stop(scene.scene.key);
  game.destroy(true);
}
