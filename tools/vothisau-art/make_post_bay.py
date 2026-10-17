"""Rebuild images/prop_post_bay.png (comrade Bảy's hidden post, 170 x 150) from the art that exists.

The Antigravity version was a flat cartoon next to otherwise painterly props. This one is composed
(code-adapted, no image model) from the project's own pictures: the forest ground texture for the
mound of earth, ferns on top, rough logs for the door frame, and a warm lamp glow in the doorway.

Run from the project root:  python tools/vothisau-art/make_post_bay.py [--out file.png]
"""

from __future__ import annotations

import argparse
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
IMAGES = ROOT / "public" / "assets" / "vothisau" / "images"
W, H = 170, 150
SCALE = 3  # drawn at 3x, then shrunk with a box filter so the edges stay crisp but not jagged


def load(name: str) -> Image.Image:
    return Image.open(IMAGES / f"{name}.png").convert("RGBA")


def trim(image: Image.Image) -> Image.Image:
    box = image.getchannel("A").getbbox()
    return image.crop(box) if box else image


def build(seed: int = 7) -> Image.Image:
    rnd = random.Random(seed)
    s = SCALE
    canvas = Image.new("RGBA", (W * s, H * s), (0, 0, 0, 0))

    # --- the mound: a dome of forest earth -------------------------------------------------
    ground = load("ground_forest").convert("RGB")
    tile = Image.new("RGB", (W * s, H * s))
    for ty in range(0, H * s, ground.height):
        for tx in range(0, W * s, ground.width):
            tile.paste(ground, (tx, ty))
    # Brighten the very dark night texture a little so the mound reads against the floor.
    tile = Image.eval(tile, lambda v: min(255, int(v * 1.7 + 16)))
    mask = Image.new("L", canvas.size, 0)
    md = ImageDraw.Draw(mask)
    cx, base = W * s // 2, int(128 * s)
    md.pieslice((cx - 82 * s, base - 82 * s, cx + 82 * s, base + 24 * s), 180, 360, fill=255)
    md.rectangle((cx - 82 * s, base - 29 * s, cx + 82 * s, base), fill=255)
    md.ellipse((cx - 82 * s, base - 30 * s, cx + 82 * s, base + 14 * s), fill=255)
    mound = tile.convert("RGBA")
    # Light from the top left: a soft gradient over the dome.
    shade = np.zeros((H * s, W * s), dtype=np.float32)
    yy, xx = np.mgrid[0 : H * s, 0 : W * s]
    shade = 0.55 + 0.45 * np.clip(1.0 - ((xx - cx * 0.8) ** 2 + (yy - 40 * s) ** 2) ** 0.5 / (110 * s), 0, 1)
    arr = np.array(mound).astype(np.float32)
    arr[..., :3] *= shade[..., None]
    mound = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    canvas.paste(mound, (0, 0), mask)

    # A dark rim at the bottom so the mound sits on the ground.
    rim = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(rim).ellipse((cx - 84 * s, base - 8 * s, cx + 84 * s, base + 16 * s), fill=(8, 6, 4, 120))
    canvas = Image.alpha_composite(rim, canvas)

    # --- the doorway ------------------------------------------------------------------------
    door_w, door_h = 40 * s, 52 * s
    dx0, dy0 = cx - door_w // 2, base - door_h + 6 * s
    d = ImageDraw.Draw(canvas)
    d.rounded_rectangle((dx0, dy0, dx0 + door_w, dy0 + door_h), radius=8 * s, fill=(10, 7, 5, 255))
    # Warm lamp light spilling out of the door onto the floor.
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((cx - 30 * s, base - 6 * s, cx + 30 * s, base + 14 * s), fill=(255, 190, 90, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(5 * s))
    canvas = Image.alpha_composite(canvas, glow)
    d = ImageDraw.Draw(canvas)
    d.ellipse((cx - 3 * s, dy0 + 22 * s, cx + 3 * s, dy0 + 28 * s), fill=(255, 214, 120, 255))

    # Door frame: two rough posts and a lintel, from the log picture.
    log = trim(load("prop_log"))
    post = log.rotate(90, expand=True).resize((10 * s, door_h + 6 * s), Image.LANCZOS)
    lintel = log.resize((door_w + 22 * s, 13 * s), Image.LANCZOS)
    canvas.alpha_composite(post, (dx0 - 9 * s, dy0 - 2 * s))
    canvas.alpha_composite(post.transpose(Image.FLIP_LEFT_RIGHT), (dx0 + door_w - 1 * s, dy0 - 2 * s))
    canvas.alpha_composite(lintel, (dx0 - 11 * s, dy0 - 10 * s))

    # --- ferns and leaves over the mound (so it is hidden in the forest) ----------------------
    fern = trim(load("prop_fern"))
    for fx, fy, fs in (
        (36, 62, 0.8), (62, 40, 0.7), (96, 36, 0.75), (126, 56, 0.85),
        (22, 98, 0.9), (148, 96, 0.9), (50, 112, 0.65), (122, 114, 0.65), (82, 28, 0.6),
    ):
        scaled = fern.resize((max(1, int(fern.width * fs * s)), max(1, int(fern.height * fs * s))), Image.LANCZOS)
        if rnd.random() < 0.5:
            scaled = scaled.transpose(Image.FLIP_LEFT_RIGHT)
        canvas.alpha_composite(scaled, (int(fx * s - scaled.width / 2), int(fy * s - scaled.height / 2)))

    return canvas.resize((W, H), Image.BOX)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, default=IMAGES / "prop_post_bay.png")
    args = parser.parse_args()
    build().save(args.out, optimize=True)
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
