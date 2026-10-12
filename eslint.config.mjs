import { readdirSync } from "node:fs";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architecture boundaries (see README.md):
 * - `features/<game>` never imports another game: shared code goes to `lib/` or `components/`.
 * - `lib/` is the framework-agnostic core and never imports app code.
 * Both `@/features/x` and relative `../x` imports are caught.
 */
const games = readdirSync("features", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const crossGameBoundaries = games.map((game) => {
  const others = games.filter((other) => other !== game);
  return {
    files: [`features/${game}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: others.map((other) => ({
            group: [
              `@/features/${other}`,
              `@/features/${other}/**`,
              `**/features/${other}/**`,
              // Relative imports (`../../other/x`): game folder names are unique by convention.
              `**/${other}/**`,
            ],
            message: `features/${game} must not import features/${other}. Move the shared code to lib/ or components/.`,
          })),
        },
      ],
    },
  };
});

const libBoundary = {
  files: ["lib/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@/features",
              "@/features/**",
              "@/app/**",
              "@/components/**",
              "@/stores/**",
              "@/data/**",
            ],
            message:
              "lib/ is the shared core: it must not import features, app, components, stores or data.",
          },
        ],
      },
    ],
  },
};

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
  ...crossGameBoundaries,
  libBoundary,
);
