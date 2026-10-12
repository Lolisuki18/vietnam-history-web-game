// Asset budget for the games (run by CI and `pnpm check:assets`).
// Every game keeps its art / audio / maps in public/assets/<game>/ and loads them only on its own
// route, but everything in public/ still ships with every deploy, so keep it small.
import { readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = "public/assets";
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB per file
const MAX_GAME_BYTES = 12 * 1024 * 1024; // 12 MB per game
/** Uncompressed / editing formats: export to png, webp, jpg, ogg, mp3 or m4a instead. */
const FORBIDDEN = new Set([".wav", ".bmp", ".tif", ".tiff", ".psd", ".ai", ".xcf", ".aseprite"]);

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const problems = [];

let games = [];
try {
  games = readdirSync(ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());
} catch {
  console.log(`No ${ROOT} folder: nothing to check.`);
}

for (const game of games) {
  const files = walk(join(ROOT, game.name));
  let total = 0;
  for (const file of files) {
    const size = statSync(file).size;
    total += size;
    const name = relative(".", file).replaceAll("\\", "/");
    if (FORBIDDEN.has(extname(file).toLowerCase())) {
      problems.push(`${name}: format ${extname(file)} is too heavy / not for the web`);
    }
    if (size > MAX_FILE_BYTES) {
      problems.push(`${name}: ${mb(size)} is over the ${mb(MAX_FILE_BYTES)} per-file limit`);
    }
  }
  console.log(`${game.name}: ${files.length} files, ${mb(total)} (limit ${mb(MAX_GAME_BYTES)})`);
  if (total > MAX_GAME_BYTES) {
    problems.push(
      `${ROOT}/${game.name}: ${mb(total)} is over the ${mb(MAX_GAME_BYTES)} per-game limit`,
    );
  }
}

if (problems.length > 0) {
  console.error("\nAsset budget exceeded:");
  for (const problem of problems) console.error(` - ${problem}`);
  process.exit(1);
}
console.log("Asset budget OK.");
