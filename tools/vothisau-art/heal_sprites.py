"""Clean two defects the redrawn Võ Thị Sáu sheets came back with (code-only, no image model).

1. **One-pixel seams**: a fully transparent row through the middle of a figure (the legs were pasted
   in two halves), which shows as a thin grey line in the game. The row is filled from the row above.
2. **Floating fragments**: small pieces detached from the body (a foot cut off at a hard edge, a hand
   floating beside the arm). They are removed in the frames listed in `FRAGMENTS`, never elsewhere,
   so legitimate small parts (a flower, a braid) are not touched.

Run from the project root:  python tools/vothisau-art/heal_sprites.py [--dry-run] [--report]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "public" / "assets" / "vothisau" / "sprites"
FRAME_W, FRAME_H = 80, 96

# Sheets to heal: name -> (columns used per row...) is not needed, every cell is scanned.
SHEETS = [
    "sau",
    "villager_a",
    "villager_b",
    "villager_c",
    "villager_d",
    "villager_e",
    "dong_chi_bay",
    "soldier_down",
    "cai_tong_down",
]
# (sheet, row, column): frames that hold a detached fragment to remove.
FRAGMENTS = {("sau", 5, 2), ("sau", 6, 1)}
FRAGMENT_MAX_PIXELS = 160
# A piece this far (px) from the body counts as detached.
DETACHED_GAP = 3


def heal_internal_holes(cell: np.ndarray) -> int:
    """Fill 1-px and 2-px transparent holes/slits completely enclosed within the figure."""
    alpha = cell[..., 3] > 0
    filled = 0
    
    # 1-px vertical slits
    v1 = (~alpha[1:-1, :]) & alpha[:-2, :] & alpha[2:, :]
    ys, xs = np.where(v1)
    ys += 1
    for y, x in zip(ys, xs):
        cell[y, x] = ((cell[y-1, x].astype(int) + cell[y+1, x].astype(int)) // 2).astype(np.uint8)
        alpha[y, x] = True
        filled += 1
        
    # 1-px horizontal slits
    h1 = (~alpha[:, 1:-1]) & alpha[:, :-2] & alpha[:, 2:]
    ys, xs = np.where(h1)
    xs += 1
    for y, x in zip(ys, xs):
        cell[y, x] = ((cell[y, x-1].astype(int) + cell[y, x+1].astype(int)) // 2).astype(np.uint8)
        alpha[y, x] = True
        filled += 1

    # 2-px vertical slits
    v2 = (~alpha[1:-2, :]) & (~alpha[2:-1, :]) & alpha[:-3, :] & alpha[3:, :]
    ys, xs = np.where(v2)
    ys += 1
    for y, x in zip(ys, xs):
        top_c = cell[y-1, x].astype(int)
        bot_c = cell[y+2, x].astype(int)
        cell[y, x] = ((top_c * 2 + bot_c) // 3).astype(np.uint8)
        cell[y+1, x] = ((top_c + bot_c * 2) // 3).astype(np.uint8)
        alpha[y, x] = True
        alpha[y+1, x] = True
        filled += 2

    # 2-px horizontal slits
    h2 = (~alpha[:, 1:-2]) & (~alpha[:, 2:-1]) & alpha[:, :-3] & alpha[:, 3:]
    ys, xs = np.where(h2)
    xs += 1
    for y, x in zip(ys, xs):
        l_c = cell[y, x-1].astype(int)
        r_c = cell[y, x+2].astype(int)
        cell[y, x] = ((l_c * 2 + r_c) // 3).astype(np.uint8)
        cell[y, x+1] = ((l_c + r_c * 2) // 3).astype(np.uint8)
        alpha[y, x] = True
        alpha[y, x+1] = True
        filled += 2

    return filled


def heal_seams(cell: np.ndarray) -> int:
    """Fill fully transparent rows that have figure pixels above and below. Returns rows filled."""
    solid = cell[..., 3] > 0
    rows = np.where(solid.any(axis=1))[0]
    if len(rows) == 0:
        return 0
    filled = 0
    for y in range(int(rows.min()) + 1, int(rows.max())):
        if solid[y].any():
            continue
        if solid[y - 1].any() and solid[y + 1].any():
            cell[y] = cell[y - 1]
            solid[y] = solid[y - 1]
            filled += 1
    return filled


def drop_fragments(cell: np.ndarray) -> int:
    """Remove small pieces that do not touch the body. Returns pixels removed."""
    solid = cell[..., 3] > 0
    labels, count = label(solid, structure=np.ones((3, 3)))
    if count < 2:
        return 0
    sizes = np.array([(labels == i).sum() for i in range(1, count + 1)])
    main = int(np.argmax(sizes)) + 1
    near_main = binary_dilation(labels == main, iterations=DETACHED_GAP)
    removed = 0
    for index in range(1, count + 1):
        if index == main or sizes[index - 1] > FRAGMENT_MAX_PIXELS:
            continue
        piece = labels == index
        if (piece & near_main).any():
            continue
        cell[piece] = 0
        removed += int(piece.sum())
    return removed


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="only report")
    args = parser.parse_args()

    for name in SHEETS:
        path = SPRITES / f"{name}.png"
        if not path.exists():
            continue
        sheet = np.array(Image.open(path).convert("RGBA"))
        rows, columns = sheet.shape[0] // FRAME_H, sheet.shape[1] // FRAME_W
        seams = holes = removed = 0
        for row in range(rows):
            for column in range(columns):
                cell = sheet[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W]
                if not (cell[..., 3] > 0).any():
                    continue
                seams += heal_seams(cell)
                holes += heal_internal_holes(cell)
                if (name, row, column) in FRAGMENTS:
                    removed += drop_fragments(cell)
        print(f"{name}: {seams} seam rows filled, {holes} internal holes healed, {removed} fragment pixels removed")
        if not args.dry_run:
            Image.fromarray(sheet).save(path, optimize=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
