# Artwork for the Kim Đồng chapter

Drop the real image files here. **Nothing else needs to change**: the game loads whatever exists
and draws a generated stand-in for every file that is missing (the browser console lists them:
`[kimdong] Using stand-in art for: ...`). The contract lives in `features/kimdong/game/assets/manifest.ts`.

| File                                           | What                       | Size / layout                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sprites/kimdong.png`                          | Kim Đồng spritesheet       | Frames **32 × 48 px**, **4 columns × 5 rows** (128 × 240). Rows, top to bottom: walk **down**, walk **left**, walk **right**, walk **up**, **swim**. Column 0 of the "down" row doubles as the `idle` pose                                                                                                |
| `sprites/french_soldier.png`                   | French soldier spritesheet | Frames **32 × 48 px**, **4 columns × 2 rows** (128 × 96). Row 0: walking **left**, row 1: walking **right**                                                                                                                                                                                               |
| `images/letter.png`                            | The secret letter pickup   | Any size, drawn at ~30 px wide                                                                                                                                                                                                                                                                            |
| `images/bush.png`                              | A hiding bush              | Any size, drawn at about 2.3 × the bush radius (≈ 100–120 px). Whether the player is hidden depends on the circles in `features/kimdong/game/world-data.ts`, not on this image                                                                                                                            |
| `images/forest_tiles.png` + `maps/level1.json` | Environment tilemap        | Tiled JSON map (≈ 2400 × 1400 px, e.g. 75 × 44 tiles of 32 px). The **first tileset** of the map is bound to `forest_tiles.png`. Every tile layer is drawn in file order; layers whose name starts with `above` are drawn **over** the characters (tree canopies). The map is stretched to the world size |

## Things to keep in mind

- **Characters:** the feet are at 75 % of the frame height (`SPRITE_ORIGIN`), and the hitbox is a
  24 × 24 square at the feet. If you change the frame size, edit `SPRITE_FRAME` in `manifest.ts`.
- **The map is only scenery.** Collisions and gameplay areas come from `features/kimdong/game/world-data.ts`, so
  paint the map to match it:
  - river: a smooth curve through `RIVER_CONTROL`, 120 px wide (swimming hides the player);
  - bushes: the circles in `BUSHES` (the bush images are placed there by the game);
  - guard post: the rectangle in `OUTPOST` (its walls and the gate are drawn by the game, so leave
    that area as plain floor); the old tree at `TREE`;
  - trails and the start / letter spots: see `TRAILS`, `PLAYER_START`, `LETTER_SPOTS`.
- **Pixel art?** Set `PIXEL_ART = true` in `features/kimdong/game/config.ts` for crisp, unsmoothed scaling.
- Add new animations in `features/kimdong/game/assets/animations.ts`.
