/**
 * Dev-only cheats reachable from the browser console (`window.debugGoto(...)`). A game creates
 * one registry; its scenes plug their own handlers into it and remove them when they shut down,
 * so the cheats keep working across scene changes. Only the game's code that is guarded by
 * `process.env.NODE_ENV !== "production"` should touch it, so nothing ends up in production.
 */
export interface DebugHandlers {
  /** Jump to the end of the chapter. */
  win?: () => void;
  /** Scene specific targets, e.g. `pos:x,y`, `letter`, `climax`, ... */
  goto?: (target: string) => void;
  /** Hold a virtual direction key. */
  hold?: (direction: string, ms: number) => void;
  /** Snapshot of scene state for `debugStats()` (player position, scene state, ...). */
  state?: () => Record<string, unknown>;
}

export interface DebugRegistry {
  readonly handlers: DebugHandlers;
  /**
   * Let a scene take over (some of) the cheats. Returns a function that removes only the handlers
   * that are still the scene's own, so a scene shutting down cannot remove its successor's.
   */
  plug: (handlers: DebugHandlers) => () => void;
}

export function createDebugRegistry(): DebugRegistry {
  const handlers: DebugHandlers = {};

  const plug: DebugRegistry["plug"] = (own) => {
    Object.assign(handlers, own);
    return () => {
      for (const key of Object.keys(own) as (keyof DebugHandlers)[]) {
        if (handlers[key] === own[key]) delete handlers[key];
      }
    };
  };

  return { handlers, plug };
}

/**
 * Install the `window.debug*` hooks for a registry. `onAction` is the same thing the on-screen
 * action button does. Returns a function that removes the hooks again. This is a separate function
 * (not part of the registry) so that code which only calls it under a development check is
 * dropped from production bundles.
 */
export function installDebugHooks(
  { handlers }: DebugRegistry,
  { onAction }: { onAction: () => void },
): () => void {
  window.debugWinGame = () => handlers.win?.();
  window.debugHold = (direction, ms) => handlers.hold?.(direction, ms);
  window.debugGoto = (target) => {
    if (target.startsWith("key:")) {
      // Synthetic key press (e.g. `key:Space`, `key:ArrowLeft`) for automated tests.
      window.dispatchEvent(new KeyboardEvent("keydown", { code: target.slice(4) }));
      return;
    }
    if (target === "action") {
      onAction();
      return;
    }
    handlers.goto?.(target);
  };
  return () => {
    delete window.debugWinGame;
    delete window.debugHold;
    delete window.debugGoto;
  };
}
