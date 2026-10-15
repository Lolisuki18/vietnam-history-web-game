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
/**
 * Icon rule: lucide-react is the only icon library. Icons it lacks are separate .svg files shown
 * with <SvgIcon> (components/ui/svg-icon.tsx), never inline <svg> in JSX.
 */
const ICON_LIBRARY_BAN = {
  group: [
    "react-icons",
    "react-icons/**",
    "@heroicons/**",
    "@radix-ui/react-icons",
    "@tabler/icons-react",
    "@phosphor-icons/**",
    "phosphor-react",
    "react-feather",
    "@fortawesome/**",
    "@mui/icons-material",
    "@mui/icons-material/**",
    "@iconify/**",
  ],
  message:
    "Use lucide-react for icons; icons it lacks go in public/assets/shared/icons/*.svg via <SvgIcon>.",
};

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
          patterns: [
            ICON_LIBRARY_BAN,
            ...others.map((other) => ({
              group: [
                `@/features/${other}`,
                `@/features/${other}/**`,
                `**/features/${other}/**`,
                // Relative imports (`../../other/x`): game folder names are unique by convention.
                `**/${other}/**`,
              ],
              message: `features/${game} must not import features/${other}. Move the shared code to lib/ or components/.`,
            })),
          ],
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
          ICON_LIBRARY_BAN,
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
  // `.claude/skills` and `.agents/skills` hold local-only third-party agent skills (git-ignored):
  // not our code to lint.
  globalIgnores([".next/**", "out/**", "next-env.d.ts", ".claude/**", ".agents/**"]),
  nextVitals,
  nextTs,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "no-restricted-imports": ["error", { patterns: [ICON_LIBRARY_BAN] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='svg']",
          message:
            "No inline <svg>: use a lucide-react icon, or put the drawing in public/assets/shared/icons/*.svg (single colour, <SvgIcon>) or public/assets/<game>/web/*.svg (illustration).",
        },
      ],
    },
  },
  ...crossGameBoundaries,
  libBoundary,
);
