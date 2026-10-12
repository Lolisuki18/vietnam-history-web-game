import { gameEvents } from "./events";

/**
 * Dev-only cheats reachable from the browser console (`window.debugGoto(...)`). The window hooks
 * are installed with the game; gameplay scenes plug
 * their own handlers into `debugHandlers` and remove them when they shut down, so the cheats
 * keep working across scene changes. Nothing here is included in production builds.
 */
export interface DebugHandlers {
  /** Jump to the end of the chapter. */
  win?: () => void;
  /** Scene specific targets: `pos:x,y`, `throw:x,y`, `letter`, `climax`, `runner`, ... */
  goto?: (target: string) => void;
  /** Hold a virtual direction key. */
  hold?: (direction: string, ms: number) => void;
  /** Snapshot of scene state for `debugStats()` (player position, scene state, ...). */
  state?: () => Record<string, unknown>;
}

export const debugHandlers: DebugHandlers = {};

/**
 * Let a scene take over (some of) the cheats. Returns a function that removes only the handlers
 * that are still the scene's own, so a scene shutting down cannot remove its successor's.
 */
export function plugDebugHandlers(handlers: DebugHandlers): () => void {
  Object.assign(debugHandlers, handlers);
  return () => {
    for (const key of Object.keys(handlers) as (keyof DebugHandlers)[]) {
      if (debugHandlers[key] === handlers[key]) delete debugHandlers[key];
    }
  };
}

/** Install the `window.debug*` hooks (development only). Returns a function that removes them. */
export function installDebugHooks(): () => void {
  window.debugWinGame = () => debugHandlers.win?.();
  window.debugHold = (direction, ms) => debugHandlers.hold?.(direction, ms);
  window.debugGoto = (target) => {
    if (target.startsWith("key:")) {
      // Synthetic key press (e.g. `key:Space`, `key:ArrowLeft`) for automated tests.
      window.dispatchEvent(new KeyboardEvent("keydown", { code: target.slice(4) }));
      return;
    }
    if (target === "action") {
      // Same event the on-screen action button emits.
      gameEvents.emit("touch:action", undefined);
      return;
    }
    debugHandlers.goto?.(target);
  };
  return () => {
    delete window.debugWinGame;
    delete window.debugHold;
    delete window.debugGoto;
  };
}
