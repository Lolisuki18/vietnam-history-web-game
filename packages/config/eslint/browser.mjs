import { defineConfig } from "eslint/config";
import globals from "globals";

import base from "./base.mjs";

/** Config for browser code without React (e.g. the Vite + Phaser game module). */
export default defineConfig(base, {
  files: ["**/*.ts"],
  languageOptions: { globals: globals.browser },
});
