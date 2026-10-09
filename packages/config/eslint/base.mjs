import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export const ignores = globalIgnores(["dist/**", ".next/**", ".turbo/**", "next-env.d.ts"]);

export const typeImportsRule = {
  rules: {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
  },
};

/** Base config for plain TypeScript packages (no React, no DOM assumptions). */
export default defineConfig(
  ignores,
  js.configs.recommended,
  tseslint.configs.recommended,
  typeImportsRule,
  {
    files: ["**/*.{mjs,cjs,js}"],
    languageOptions: { globals: globals.node },
  },
);
