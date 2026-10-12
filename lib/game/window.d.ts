interface Window {
  /** Dev-only cheat: jump straight to the chapter ending. */
  debugWinGame?: () => void;
  /** Dev-only cheat: jump to a phase / position (targets are defined by each game). */
  debugGoto?: (target: string) => void;
  /** Dev-only: listener / display-object counts, to spot leaks across restarts. */
  debugStats?: () => Record<string, unknown>;
  /** Dev-only: restart the chapter as if the UI had sent `host:restart`. */
  debugRestart?: () => void;
  /** Dev-only: hold a virtual direction key ("left" | "right" | "up" | "down") for `ms` ms. */
  debugHold?: (direction: string, ms: number) => void;
}
