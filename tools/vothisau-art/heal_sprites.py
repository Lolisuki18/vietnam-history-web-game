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
SHEETS = ["sau", "villager_d", "villager_e", "dong_chi_bay"]
# (sheet, row, column): frames that hold a detached fragment to remove.
FRAGMENTS = {("sau", 5, 2), ("sau", 6, 1)}
FRAGMENT_MAX_PIXELS = 160
# A piece this far (px) from the body counts as detached.
DETACHED_GAP = 3


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
        sheet = np.array(Image.open(path).convert("RGBA"))
        rows, columns = sheet.shape[0] // FRAME_H, sheet.shape[1] // FRAME_W
        seams = removed = 0
        for row in range(rows):
            for column in range(columns):
                cell = sheet[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W]
                if not (cell[..., 3] > 0).any():
                    continue
                seams += heal_seams(cell)
                if (name, row, column) in FRAGMENTS:
                    removed += drop_fragments(cell)
        print(f"{name}: {seams} seam rows filled, {removed} fragment pixels removed")
        if not args.dry_run:
            Image.fromarray(sheet).save(path, optimize=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
