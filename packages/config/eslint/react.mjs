import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import base from "./base.mjs";

/** Config for browser code: React libraries and the Vite/Phaser game module. */
export default defineConfig(base, reactHooks.configs.flat.recommended, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: { globals: globals.browser },
});
