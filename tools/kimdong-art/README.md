# Kim Đồng art pipeline

Turns the raw, AI-generated images into the small, clean files the game and the website use. **All
finished art lives in one place: `public/assets/`** (`kimdong/` for the game and its web images,
`shared/` for textures and icons used by every page). The raw originals (~90 MB) are not kept in
the repo; this tool is only needed to rebuild or change the art.

```bash
pip install pillow                       # the only dependency

# the originals are in git history (commit 5d23212): restore them once, outside public/
mkdir -p raw-art && git archive 5d23212 public/assets/kimdong/images | tar -x -C raw-art
export KIMDONG_RAW=raw-art/public/assets/kimdong/images      # PowerShell: $env:KIMDONG_RAW = "..."

python tools/kimdong-art/build.py                # everything
python tools/kimdong-art/build.py sprites        # one group: sprites | props | terrain | web
```

After rebuilding, bump `ASSET_VERSION` in `features/kimdong/game/assets/manifest.ts` so browsers
fetch the new files instead of their cached copies. `raw-art/` is git-ignored.

What it fixes in the raw images:

- The "transparent" background is a **checkerboard painted into the pixels** (or plain black for
  `props` and `emotes`, white for `forest_tiles`): a flood fill from the border removes it, and a few
  rounds of fringe clean-up remove the soft grey edge. Glow effects (the letter) are blended into the
  checkerboard and are cleaned by keeping only coloured / dark / white-hot pixels; the sound rings
  (`sfx_visuals`) are separated by how far they rise above the dark checkerboard.
- The small **AI sparkle** in the bottom-right corner is removed.
- Sprites are **cut, aligned on their feet and re-packed** into even sheets (the raw sheets are not on a
  grid); the standing height of all sheets is matched.
- Rows are found from the **real gaps between them** (`row_bands`), not by dividing the height by
  the number of rows: the soldier rows are taller than their share of the sheet, and an even grid
  cut their boots off.
- `forest_tiles.png` has a dark **grid painted over the art**: `terrain.py` finds the lines (long
  straight dark runs) and fills them in from the pixels on both sides, then builds **seamless ground
  textures** (grass, dirt, water) by pasting feathered patches on a torus, and cuts the plants, rocks
  and stump out of the bottom rows.
- Everything is scaled down and compressed (≈ 90 MB of raw images → ≈ 8 MB).

`try_clean.py <file> checker|black <out dir>` writes a preview over a magenta background to check
the background removal of one image. The crop boxes for `props.png`, `bush.png` and
`forest_tiles.png` (not on a grid) are written in `build.py`.

Not used (and why): the waterfall and the bank / corner tiles of `forest_tiles.png` (the world draws
the stream from a curve, not from tiles), the `Walk-swimming.png` row that repeats another row, the
extra emote variants and small eye / sleeping-face bubbles of `emotes.png`.
