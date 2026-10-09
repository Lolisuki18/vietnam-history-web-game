/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARENT_ORIGIN?: string;
}

interface Window {
  /** Dev-only cheat registered by StealthScene: jump straight to the chapter ending. */
  debugWinGame?: () => void;
  /** Dev-only cheat registered by StealthScene: jump to a phase (see StealthScene.debugGoto). */
  debugGoto?: (target: string) => void;
  /** Dev-only: listener / display-object counts, to spot leaks across restarts. */
  debugStats?: () => Record<string, unknown>;
  /** Dev-only: restart the chapter as if the host had sent `host:restart`. */
  debugRestart?: () => void;
  /** Dev-only: hold a virtual direction key ("left" | "right" | "up" | "down") for `ms` ms. */
  debugHold?: (direction: string, ms: number) => void;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
