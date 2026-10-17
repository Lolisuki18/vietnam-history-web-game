"""Make the conical hats (nón lá) of villager_a / villager_b sit on the heads (code only).

In the Antigravity sheets the hat was a flat tan triangle with no outline laid over the head: black hair
stuck out above and beside it, and nothing tied it to the face. This keeps the hat's silhouette and
repaints it as a hat: a dark outline, shading from light (left) to dark (right), the ribs of the
cone, a thicker darker brim, and a shadow on the forehead under the brim; the hair that poked out
above the hat is removed. The cowering row is rebuilt afterwards from the standing frames
(`fix_villagers.rebuild_scared`).

Run from the project root:  python tools/vothisau-art/fix_hats.py [--dry-run]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import label

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_villagers import DIR, FRAME_H, FRAME_W, rebuild_scared  # noqa: E402

SHEETS = ["villager_a", "villager_b"]
LIGHT = np.array([232.0, 208.0, 140.0])
DARK = np.array([150.0, 118.0, 66.0])
RIB = np.array([128.0, 100.0, 54.0])
BRIM = np.array([112.0, 86.0, 48.0])
OUTLINE = np.array([66.0, 48.0, 26.0])


def hat_mask(frame: np.ndarray) -> np.ndarray:
    r, g, b, a = (frame[..., i].astype(int) for i in range(4))
    mask = (a > 0) & (r > 165) & (g > 140) & (b < 160) & (r - b > 40)
    mask[44:] = False  # the hat is only on the head
    # Keep only the piece that holds the apex: the tan bag strap has the same colour.
    labels, count = label(mask, structure=np.ones((3, 3)))
    if count == 0:
        return mask
    best, best_top = 0, 999
    for index in range(1, count + 1):
        ys = np.where((labels == index).any(axis=1))[0]
        if (labels == index).sum() >= 60 and ys.min() < best_top:
            best, best_top = index, int(ys.min())
    return labels == best if best else np.zeros_like(mask)


def repaint(frame: np.ndarray) -> bool:
    mask = hat_mask(frame)
    ys, xs = np.where(mask)
    if len(ys) < 40:
        return False
    top, bottom = int(ys.min()), int(ys.max())
    cx = (int(xs.min()) + int(xs.max())) / 2
    height = max(1, bottom - top)

    # Hair that sticks out above or beside the hat belongs under it: drop it.
    dark = (frame[..., 3] > 0) & (frame[..., :3].max(axis=-1) < 90) & ~mask
    dark[bottom - 2 :] = False
    dark[: top - 6] = False
    near = np.zeros_like(dark)
    near[:, max(0, int(xs.min()) - 5) : int(xs.max()) + 6] = True
    frame[dark & near] = 0

    out = frame.copy()
    for y in range(top, bottom + 1):
        row = np.where(mask[y])[0]
        if len(row) == 0:
            continue
        left, right = int(row.min()), int(row.max())
        width = max(1, right - left)
        for x in row:
            t = (x - left) / width
            color = LIGHT * (1 - t) + DARK * t
            # Ribs of the cone run from the apex to the brim.
            rib = round((x - cx) * height / (y - top + 1)) % 5 == 0 and y > top + 2
            if rib:
                color = color * 0.82 + RIB * 0.18
            if y >= bottom - 1:  # the thick brim
                color = BRIM * 0.9 + color * 0.1
            elif x in (left, right) or y == top:
                color = OUTLINE
            out[y, x, :3] = np.clip(color, 0, 255).astype(np.uint8)
        out[y, left, :3] = OUTLINE.astype(np.uint8)
        out[y, right, :3] = OUTLINE.astype(np.uint8)
    # The shadow of the brim on the forehead and eyes.
    shadow = (out[..., 3] > 0) & ~mask
    for y in (bottom + 1, bottom + 2):
        row_mask = shadow[y] & (np.abs(np.arange(FRAME_W) - cx) < (bottom - top) * 1.6)
        out[y, row_mask, :3] = (out[y, row_mask, :3] * (0.62 if y == bottom + 1 else 0.82)).astype(np.uint8)
    frame[:] = out
    return True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    for name in SHEETS:
        path = DIR / f"{name}.png"
        sheet = np.array(Image.open(path).convert("RGBA"))
        done = 0
        for column in range(4):
            cell = sheet[0:FRAME_H, column * FRAME_W : (column + 1) * FRAME_W]
            done += int(repaint(cell))
        rebuild_scared(sheet)
        target = path.with_suffix(".new.png") if args.dry_run else path
        Image.fromarray(sheet).save(target, optimize=True)
        print(f"{name}: {done} hats repainted -> {target.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
