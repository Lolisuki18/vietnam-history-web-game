import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import { ignores, typeImportsRule } from "./base.mjs";

/** Config for the Next.js app (includes React, hooks, a11y and typescript-eslint rules). */
export default defineConfig(ignores, nextVitals, nextTs, typeImportsRule);
