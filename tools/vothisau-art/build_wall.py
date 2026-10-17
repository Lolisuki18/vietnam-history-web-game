"""Generate vertically seamless colonial brick wall prop (prop_wall_brick.png).

Requirements:
- 128 x 120 px, transparent background
- Centered wall body of 64 px (from x = 32 to x = 96)
- 8 courses of 15 px = 120 px, seamless vertically across y = 0 and y = 120
- Aged weathered colonial Indochina red-clay bricks:
  * Rich, muted terracotta tones (not neon red or oversaturated)
  * Dark aged lime mortar
  * Weathered bevel highlights & drop shadows
  * Organic moss and damp lichen patches wrapping periodically along Y
  * Soft ambient cast shadow to the right
"""

import math
import random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
DST = ROOT / "public" / "assets" / "vothisau" / "images" / "prop_wall_brick.png"

W, H = 128, 120
WALL_W = 64
X0 = (W - WALL_W) // 2  # 32
X1 = X0 + WALL_W        # 96

def build_seamless_wall():
    COURSE_H = 15
    NUM_COURSES = H // COURSE_H

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rng = random.Random(1948)

    # Aged muted terracotta palette (weathered colonial bricks)
    BRICK_PALETTE = [
        (126, 52, 40), (114, 45, 34), (135, 60, 46), (108, 42, 32),
        (120, 48, 38), (128, 55, 42), (102, 38, 28), (122, 50, 38),
        (116, 46, 35), (132, 58, 44), (110, 43, 33), (124, 52, 40)
    ]
    MORTAR = (82, 78, 72, 255)
    MORTAR_DARK = (52, 48, 44, 255)
    HIGHLIGHT = (162, 78, 62, 255)
    SHADOW = (58, 22, 16, 255)

    # Mortar background
    draw.rectangle([(X0, 0), (X1 - 1, H - 1)], fill=MORTAR)

    # Bricks course by course
    for c in range(NUM_COURSES):
        cy0 = c * COURSE_H
        cy1 = cy0 + COURSE_H
        offset = 0 if c % 2 == 0 else 16
        for bx in range(X0 - 24 + offset, X1 + 24, 28):
            bx0 = max(X0, bx)
            bx1 = min(X1 - 1, bx + 26)
            if bx0 < bx1:
                base_col = rng.choice(BRICK_PALETTE)
                # Brick face (leaving 1px mortar)
                draw.rectangle([(bx0 + 1, cy0 + 1), (bx1 - 1, cy1 - 2)], fill=base_col)
                # Bevel shading
                draw.line([(bx0 + 1, cy0 + 1), (bx1 - 1, cy0 + 1)], fill=HIGHLIGHT)
                draw.line([(bx0 + 1, cy0 + 1), (bx0 + 1, cy1 - 2)], fill=HIGHLIGHT)
                draw.line([(bx0 + 1, cy1 - 2), (bx1 - 1, cy1 - 2)], fill=SHADOW)
                draw.line([(bx1 - 1, cy0 + 1), (bx1 - 1, cy1 - 2)], fill=SHADOW)
                # Internal grain
                for _ in range(5):
                    px = rng.randint(bx0 + 2, max(bx0 + 2, bx1 - 2))
                    py = rng.randint(cy0 + 2, cy1 - 3)
                    speck = rng.choice([(30, 15, 12, 180), (170, 95, 75, 160), (75, 30, 20, 180)])
                    draw.point((px, py), fill=speck)

    # Horizontal mortar joint lines
    for c in range(NUM_COURSES + 1):
        my = (c * COURSE_H) % H
        draw.line([(X0, my), (X1 - 1, my)], fill=MORTAR_DARK, width=1)

    # Periodic moss patches that wrap seamlessly vertically
    moss_canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(moss_canvas)
    for _ in range(16):
        mx = rng.randint(X0 + 2, X1 - 10)
        my = rng.randint(0, H - 1)
        mr = rng.randint(4, 10)
        moss_col = rng.choice([(34, 54, 26, 210), (26, 42, 20, 220), (46, 72, 34, 190), (22, 34, 16, 230)])
        for wrap_y in (my, my - H, my + H):
            mdraw.ellipse([(mx - mr, wrap_y - mr // 2), (mx + mr, wrap_y + mr // 2)], fill=moss_col)

    img = Image.alpha_composite(img, moss_canvas)
    draw = ImageDraw.Draw(img)

    # Outer wall borders
    draw.line([(X0, 0), (X0, H - 1)], fill=(36, 28, 24, 255), width=2)
    draw.line([(X1 - 1, 0), (X1 - 1, H - 1)], fill=(28, 20, 16, 255), width=2)

    # Cast soft ambient shadow to the right
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for sx in range(14):
        alpha = int(80 * (1.0 - sx / 14.0))
        sdraw.line([(X1 + sx, 0), (X1 + sx, H - 1)], fill=(12, 10, 8, alpha))

    final_img = Image.alpha_composite(shadow, img)
    final_img.save(DST, optimize=True)
    print(f"Saved {DST} ({final_img.size}) successfully!")

if __name__ == "__main__":
    build_seamless_wall()
