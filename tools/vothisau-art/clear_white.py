"""Make the white that is baked into some props transparent.

The generated props came back with opaque white where the background showed through an opening: the
gaps between the posts of the well, the lattice and the back of the market stalls, the spokes of the
cart wheel. In the game that is a white patch on the ground. This turns those regions transparent
(a flood of "almost pure white" pixels bigger than a few pixels, then a one-pixel fringe of light,
unsaturated pixels around them so no white halo is left). Small white details (a grain of rice, a
highlight) are smaller than `MIN_REGION` and stay.

Run from the project root:  python tools/vothisau-art/clear_white.py [--dry-run]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parents[2]
IMAGES = ROOT / "public" / "assets" / "vothisau" / "images"

PROPS = [
    "prop_well",
    "prop_stall_a",
    "prop_stall_b",
    "prop_stall_fruit",
    "prop_rope_stall",
    "prop_cart",
]
WHITE = 232  # every channel at least this, and nearly grey
MAX_SPREAD = 14
MIN_REGION = 12  # px; smaller white pieces are details
FRINGE_MIN = 170  # light pixels next to a cleared region go too (anti-aliasing)
FRINGE_SPREAD = 24


def clear(image: np.ndarray) -> int:
    r, g, b, a = (image[..., i].astype(int) for i in range(4))
    spread = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    white = (a > 200) & (np.minimum(np.minimum(r, g), b) >= WHITE) & (spread < MAX_SPREAD)
    labels, count = label(white, structure=np.ones((3, 3)))
    cleared = np.zeros_like(white)
    for index in range(1, count + 1):
        region = labels == index
        if region.sum() >= MIN_REGION:
            cleared |= region
    # Light, unsaturated pixels touching a cleared region: the soft edge of the opening.
    light = (a > 0) & (np.minimum(np.minimum(r, g), b) >= FRINGE_MIN) & (spread < FRINGE_SPREAD)
    # Seeds: what was just cleared and what is already transparent, so a second run still trims the
    # pale speckles a first run left along the openings.
    edge = cleared | (a == 0)
    for _ in range(3):
        grown = binary_dilation(edge, structure=np.ones((3, 3))) & light
        cleared |= grown
        edge |= grown
    image[cleared, 3] = 0
    return int(cleared.sum())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    for name in PROPS:
        path = IMAGES / f"{name}.png"
        image = np.array(Image.open(path).convert("RGBA"))
        removed = clear(image)
        print(f"{name}: {removed} white pixels made transparent")
        if not args.dry_run:
            Image.fromarray(image).save(path, optimize=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
