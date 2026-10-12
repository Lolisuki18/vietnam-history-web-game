import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Next.js (React, hooks, a11y) + typescript-eslint rules; used for the whole repo. */
export default defineConfig(
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  nextVitals,
  nextTs,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
);
