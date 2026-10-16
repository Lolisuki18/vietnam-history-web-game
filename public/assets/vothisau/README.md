# Artwork for the Võ Thị Sáu chapter

**This is the one place art lives** for this game (`public/assets/vothisau/`; textures and icons used by
every page are in `public/assets/shared/`). The contract with the game is
`features/vothisau/game/assets/manifest.ts`. If a file is missing the game draws a generated stand-in
(`placeholder-art.ts`), and the browser console says how many: `[vothisau] Using stand-in art ...`.

**No file has been made yet.** The full list, with sizes and layouts, is
[docs/VoThiSau/05-Asset-con-thieu.md](../../../docs/VoThiSau/05-Asset-con-thieu.md); keep both in step.

```
sprites/  character sheets (frames 80 × 96)
images/   props, ground textures, items, effects, portraits
audio/    .wav effects and music loops (all optional)
web/      pictures for the React pages (cover, Codex portrait)
```

| File                                                          | What                                       | Layout                                                                                                                           |
| ------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `sprites/sau.png`                                             | Chị Sáu                                    | 6 columns × 8 rows. Rows: walk down / left / right / up (4), sneak (4), throw (3), interact (3), hide (2); side poses face right |
| `sprites/french_soldier.png`, `viet_gian.png`, `cai_tong.png` | Soldiers and Cai Tòng                      | 5 columns × 2 rows: row 0 walks left, row 1 right                                                                                |
| `sprites/villager_a/b/c.png`, `dong_chi_bay.png`              | Villagers, comrade Bảy                     | 4 columns × 2 rows: row 0 idle / chatting (4), row 1 cowering (2)                                                                |
| `images/ground_forest.png`, `ground_market.png`               | Seamless ground                            | 256 × 256, tiled over the whole level                                                                                            |
| `images/prop_*.png`                                           | Props                                      | Sizes in `PROPS` (manifest); the feet are the middle of the bottom edge                                                          |
| `images/emotes.png`                                           | Speech bubbles over a guard                | 5 frames of 64 × 64: `?`, `!`, `...`, eye, `zzz`                                                                                 |
| `images/item_paper.png`                                       | The papers to collect                      | 4 frames of 48 × 48                                                                                                              |
| `images/item_pebble.png`, `item_grenade.png`                  | Pebble, grenade                            | single pictures                                                                                                                  |
| `images/fx_explosion.png`                                     | The blast                                  | 6 frames of 128 × 128                                                                                                            |
| `images/portrait_*.png`                                       | Dialogue portraits (Sáu, Bảy, the officer) | 256 × 256; referenced from `features/vothisau/data/story.ts` and `ui/interrogation-screen.tsx`                                   |
| `web/vothisau-cover.webp`, `web/vothisau-codex.webp`          | Chapter card cover, Codex portrait         | Used by `features/vothisau/ui/codex-illustration.tsx`                                                                            |
| `audio/*.wav`                                                 | Effects and music                          | Names in `AUDIO_KEYS` (manifest) and `ui/ui-audio.ts` callers                                                                    |

After rebuilding any file here, bump `ASSET_VERSION` in the manifest and run `pnpm check:assets`.
