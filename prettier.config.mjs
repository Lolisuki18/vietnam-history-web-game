import base from "@vhg/config/prettier";

/** @type {import("prettier").Config} */
export default {
  ...base,
  tailwindStylesheet: "./apps/web-client/app/globals.css",
};
