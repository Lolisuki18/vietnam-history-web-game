/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PARENT_ORIGIN?: string;
}

interface Window {
  /** Dev-only cheat registered by MainScene; absent in production builds. */
  debugWinGame?: () => void;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
