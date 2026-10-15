# Kim Đồng art pipeline

Turns the raw, AI-generated images in `assets-src/kimdong/` into the small, clean files the game
and the website use (`public/assets/kimdong/`, `public/art/`, `public/textures/`).

```bash
pip install pillow                       # the only dependency
python tools/kimdong-art/build.py        # everything
python tools/kimdong-art/build.py sprites   # one group: sprites | props | web
```

What it fixes in the raw images:

- The "transparent" background is a **checkerboard painted into the pixels** (or plain black for
  `props` and `emotes`): a flood fill from the border removes it, and a few rounds of fringe
  clean-up remove the soft grey edge. Glow effects (the letter) are blended into the checkerboard
  and are cleaned by keeping only coloured / dark / white-hot pixels.
- The small **AI sparkle** in the bottom-right corner is removed.
- Sprites are **cut, aligned on their feet and re-packed** into even sheets (the raw sheets are not on a
  grid); the standing height of all sheets is matched.
- Rows are found from the **real gaps between them** (`row_bands`), not by dividing the height by
  the number of rows: the soldier rows are taller than their share of the sheet, and an even grid
  cut their boots off.
- Everything is scaled down and compressed (≈ 90 MB of raw images → ≈ 7 MB).

`try_clean.py <file> checker|black <out dir>` writes a preview over a magenta background to check
the background removal of one image. The crop boxes for `props.png` and `bush.png` (not on a grid)
are written in `build.py` in the coordinates of a 1600 px wide preview.

Not used: `forest_tiles.png` (a grid is drawn into the image, so it is not a usable tileset) and
`sfx_visuals.png` (its glow rings are blended into a dark checkerboard and cannot be separated).
