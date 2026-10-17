"""Fix the villager and comrade-Bảy sheets (4 columns x 2 rows of 80 x 96).

What was wrong in the Antigravity version: villager_a and villager_b had the same brown shirt, and the
"scared" row (row 1) had two skin-coloured blobs at the sides of the head that read as big ears.
What this does (code-adapted, no image model):

  * villager_b: the shirt becomes indigo (áo chàm); villager_c: terracotta (áo gạch). villager_a stays brown.
  * row 1 (cowering) is rebuilt from the standing frames: the body is squashed toward the feet and
    shifted a pixel, so the person ducks without any new drawing.

Run from the project root:  python tools/vothisau-art/fix_villagers.py [--dry-run]
The original files are kept as <name>.orig.png in the folder given by --backup (default: not kept;
the Antigravity originals are in the scratchpad of the session that ran this).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / "public" / "assets" / "vothisau" / "sprites"
FRAME_W, FRAME_H = 80, 96
COLUMNS = 4

# New shirt colours (mean RGB of the shirt), by sheet
SHIRTS = {
    "villager_b": np.array([44.0, 58.0, 104.0]),  # indigo
    "villager_c": np.array([138.0, 64.0, 46.0]),  # terracotta
}
# The torso of a standing villager: rows where the shirt is (the head is above, the trousers below).
TORSO_ROWS = (30, 54)


def lum(rgb: np.ndarray) -> np.ndarray:
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def hsv_vs(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    x = rgb.astype(np.float32) / 255.0
    mx, mn = x.max(-1), x.min(-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    h = np.zeros_like(mx)
    nz = d > 1e-6
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    rm = nz & (mx == r)
    gm = nz & (mx == g) & ~rm
    bm = nz & ~rm & ~gm
    h[rm] = (60 * ((g - b)[rm] / d[rm])) % 360
    h[gm] = 60 * ((b - r)[gm] / d[gm]) + 120
    h[bm] = 60 * ((r - g)[bm] / d[bm]) + 240
    return h, s, mx


def recolor_shirt(sheet: np.ndarray, base: np.ndarray) -> None:
    """Recolour the reddish-brown shirt pixels of the standing frames (row 0), keeping the shading."""
    for column in range(COLUMNS):
        x0 = column * FRAME_W
        frame = sheet[0:FRAME_H, x0 : x0 + FRAME_W]
        rgb = frame[..., :3]
        h, s, v = hsv_vs(rgb)
        rows = np.zeros(frame.shape[:2], dtype=bool)
        rows[TORSO_ROWS[0] : TORSO_ROWS[1]] = True
        shirt = rows & (frame[..., 3] > 128) & ((h < 30) | (h > 340)) & (s > 0.18) & (v > 0.2) & (v < 0.62)
        # Keep the luminance of the original pixels, so the folds and shadows stay as drawn.
        factor = np.clip(lum(rgb)[shirt] / float(lum(base)), 0.3, 1.6)[:, None]
        frame[..., :3][shirt] = np.clip(base[None, :] * factor, 0, 255).astype(np.uint8)


def squash(frame: np.ndarray, factor: float, shift: int) -> np.ndarray:
    """The figure shrunk vertically toward its feet (the bottom row stays) and moved sideways."""
    ys, xs = np.where(frame[..., 3] > 0)
    top, bottom, left, right = int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())
    crop = Image.fromarray(frame[top : bottom + 1, left : right + 1])
    new_h = max(1, round(crop.height * factor))
    # Slightly wider as it ducks, like a person hunching.
    new_w = min(FRAME_W, round(crop.width * (1.0 + (1.0 - factor) * 0.35)))
    small = np.array(crop.resize((new_w, new_h), Image.BOX))
    out = np.zeros_like(frame)
    cx = (left + right) // 2 + shift
    x0 = min(max(0, cx - new_w // 2), FRAME_W - new_w)
    y0 = bottom - new_h + 1
    out[y0 : bottom + 1, x0 : x0 + new_w] = small
    return out


def rebuild_scared(sheet: np.ndarray) -> None:
    row1 = slice(FRAME_H, 2 * FRAME_H)
    sheet[row1] = 0
    for column, (source, factor, shift) in enumerate(((0, 0.8, 0), (1, 0.76, 1))):
        frame = sheet[0:FRAME_H, source * FRAME_W : (source + 1) * FRAME_W].copy()
        out = squash(frame, factor, shift)
        sheet[FRAME_H : 2 * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W] = out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="write the results next to the originals as *.new.png")
    parser.add_argument("--backup", type=Path, help="folder to copy the original files to")
    args = parser.parse_args()

    for name in ("villager_a", "villager_b", "villager_c", "dong_chi_bay"):
        path = DIR / f"{name}.png"
        sheet = np.array(Image.open(path).convert("RGBA"))
        if args.backup:
            args.backup.mkdir(parents=True, exist_ok=True)
            Image.fromarray(sheet).save(args.backup / f"{name}.orig.png")
        if name in SHIRTS:
            recolor_shirt(sheet, SHIRTS[name])
        rebuild_scared(sheet)
        target = path.with_suffix(".new.png") if args.dry_run else path
        Image.fromarray(sheet).save(target, optimize=True)
        print(f"wrote {target.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
