# Artwork for the Kim Đồng chapter

**Do not edit the files in this folder by hand.** They are generated from the raw images in
`assets-src/kimdong/` by `tools/kimdong-art/build.py` (see `tools/kimdong-art/README.md`): the raw
images have a checkerboard painted in place of transparency and are far too big to ship. The
layout contract with the game lives in `features/kimdong/game/assets/manifest.ts`; if a file is
missing the game draws a generated stand-in (the browser console lists them:
`[kimdong] Using stand-in art for: ...`).

| File                                         | What                               | Layout                                                                                                                                       |
| -------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `sprites/kimdong.png`                        | Kim Đồng                           | Frames **80 × 96**, 6 columns × 8 rows. Rows: walk down / left / right / up (4 frames), swim (4), run (6, facing right), jump (3), throw (3) |
| `sprites/french_soldier.png`                 | French soldier                     | Frames 80 × 96, 5 columns × 2 rows: row 0 walking left, row 1 walking right                                                                  |
| `sprites/linh_kho_xanh.png`                  | "Lính khố xanh" (colonial guard)   | Same layout as the French soldier                                                                                                            |
| `images/letter.png`                          | The secret letter                  | 14 frames of 80 × 71 (5 × 3), a shimmer that fills with light and fades back                                                                 |
| `images/emotes.png`                          | Speech bubbles over a guard's head | 2 frames of 64 × 64: `?` (suspicious), `!` (spotted)                                                                                         |
| `images/bush_a/b/c.png`                      | Hiding bushes                      | Three pictures; the game picks one per bush and mirrors every other one. Hiding depends on the circles in `world-data.ts`, not on the image  |
| `images/prop_tree.png`, `prop_tower.png`     | The old tree, the watchtower       | Placed at `TREE` / the guard post (`OUTPOST`) by `createProps` in `world-renderer.ts`                                                        |
| `images/prop_rock_*.png`, `prop_stump_*.png` | Scenery                            | Scattered over the forest floor with a fixed seed, away from paths, the river and the gameplay spots                                         |
| `images/portrait_*.png`                      | Speaker portraits (dialogue box)   | 256 × 256; referenced from `features/kimdong/data/story.ts`                                                                                  |
| `audio/*.wav`                                | Sound effects and music loops      | Loaded by `PreloaderScene`, played by `GameAudio` (`features/kimdong/game/audio.ts`)                                                         |

The web pages use `public/art/` (cover, Codex portrait, the red seal) and `public/textures/`
(`paper-aged.webp`: yellowed paper for the dialogue box and the paper labels), built by the same tool.

## Things to keep in mind

- **Characters:** the sheets are drawn at 80 × 96 and shown at `SPRITE_SCALE` (0.65) of that. The feet
  are at 75 % of the frame height (`SPRITE_ORIGIN`) and the hitbox is a 24 × 24 square at the feet.
- **The ground is drawn in code** (`world-renderer.ts`). `forest_tiles.png` from the raw set has a
  grid drawn into it and is not a usable tileset, so there is no `level1.json`.
- **Budget:** `pnpm check:assets` limits files to 2 MB and the whole game to 12 MB.
- Add new animations in `features/kimdong/game/assets/animations.ts`.
