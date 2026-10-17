"""Generate vertically seamless brick wall prop (public/assets/vothisau/images/prop_wall_brick.png).

Requirements from 06-Yeu-cau-sua-asset-cho-Antigravity.md:
- 128 x 120 px
- Transparent background
- Wall section centered (width 64 px, x from 32 to 96)
- Vertically seamless: stacking multiple blocks vertically has NO visible seam or gap
- Authentic Indochina French colonial weathered brick aesthetic:
  * Aged red-orange terracotta bricks with subtle color variation
  * Weathered gray lime mortar
  * Organic moss and lichen patinas that wrap vertically
  * Soft ambient cast shadow on ground to the right
"""

import math
import random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
DST = ROOT / "public" / "assets" / "vothisau" / "images" / "prop_wall_brick.png"

W, H = 128, 120
WALL_W = 64
X0 = (W - WALL_W) // 2  # 32
X1 = X0 + WALL_W        # 96

def build_seamless_wall():
    # 8 courses of 15 px each = 120 px
    COURSE_H = 15
    NUM_COURSES = H // COURSE_H

    # Canvas
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Deterministic seed for reproducible authentic texture
    rng = random.Random(1948)

    # Base palette
    BRICK_PALETTE = [
        (158, 62, 48), (145, 52, 40), (170, 72, 55), (138, 48, 36),
        (152, 58, 44), (165, 68, 52), (142, 50, 38), (160, 60, 46),
        (130, 45, 32), (178, 76, 58), (148, 55, 42), (162, 64, 50)
    ]
    MORTAR = (120, 115, 108, 255)
    MORTAR_DARK = (80, 75, 70, 255)
    HIGHLIGHT = (195, 95, 75, 255)
    SHADOW = (75, 28, 20, 255)

    # Draw mortar background for the wall area
    draw.rectangle([(X0, 0), (X1 - 1, H - 1)], fill=MORTAR)

    # Draw bricks course by course
    for c in range(NUM_COURSES):
        cy0 = c * COURSE_H
        cy1 = cy0 + COURSE_H
        # Stagger alternate courses
        offset = 0 if c % 2 == 0 else 16
        for bx in range(X0 - 24 + offset, X1 + 24, 28):
            bx0 = max(X0, bx)
            bx1 = min(X1 - 1, bx + 26)
            if bx0 < bx1:
                base_col = rng.choice(BRICK_PALETTE)
                # Brick body (leaving 1px mortar top/bottom/left/right)
                draw.rectangle([(bx0 + 1, cy0 + 1), (bx1 - 1, cy1 - 2)], fill=base_col)
                # Subtle bevel highlights and shadows
                draw.line([(bx0 + 1, cy0 + 1), (bx1 - 1, cy0 + 1)], fill=HIGHLIGHT)
                draw.line([(bx0 + 1, cy0 + 1), (bx0 + 1, cy1 - 2)], fill=HIGHLIGHT)
                draw.line([(bx0 + 1, cy1 - 2), (bx1 - 1, cy1 - 2)], fill=SHADOW)
                draw.line([(bx1 - 1, cy0 + 1), (bx1 - 1, cy1 - 2)], fill=SHADOW)
                # Internal texture specks
                for _ in range(4):
                    px = rng.randint(bx0 + 2, max(bx0 + 2, bx1 - 2))
                    py = rng.randint(cy0 + 2, cy1 - 3)
                    speck = rng.choice([(40, 20, 15, 180), (210, 120, 90, 180), (100, 40, 25, 180)])
                    draw.point((px, py), fill=speck)

    # Draw horizontal mortar lines
    for c in range(NUM_COURSES + 1):
        my = (c * COURSE_H) % H
        draw.line([(X0, my), (X1 - 1, my)], fill=MORTAR_DARK, width=1)

    # Periodic moss patches that wrap seamlessly vertically
    moss_canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(moss_canvas)
    for _ in range(12):
        mx = rng.randint(X0 + 2, X1 - 10)
        # Choose my and wrap periodic duplicate
        my = rng.randint(0, H - 1)
        mr = rng.randint(4, 9)
        moss_col = rng.choice([(48, 85, 36, 190), (36, 68, 28, 200), (62, 102, 45, 170)])
        for wrap_y in (my, my - H, my + H):
            mdraw.ellipse([(mx - mr, wrap_y - mr // 2), (mx + mr, wrap_y + mr // 2)], fill=moss_col)

    # Merge moss
    img = Image.alpha_composite(img, moss_canvas)

    # Outer wall borders
    draw = ImageDraw.Draw(img)
    draw.line([(X0, 0), (X0, H - 1)], fill=(45, 35, 30, 255), width=2)
    draw.line([(X1 - 1, 0), (X1 - 1, H - 1)], fill=(35, 25, 20, 255), width=2)

    # Cast soft ambient shadow to the right (x from X1 to X1 + 16)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    for sx in range(14):
        alpha = int(75 * (1.0 - sx / 14.0))
        sdraw.line([(X1 + sx, 0), (X1 + sx, H - 1)], fill=(12, 10, 8, alpha))

    final_img = Image.alpha_composite(shadow, img)
    final_img.save(DST, optimize=True)
    print(f"Saved {DST} ({final_img.size}) successfully!")

    # Verify vertical seamlessness: diff between stacked seam
    arr = np.array(final_img)
    top_row = arr[0, :, :]
    bottom_row = arr[H - 1, :, :]
    print(f"Top row non-zero count: {np.count_nonzero(top_row[..., 3] > 0)}")
    print(f"Bottom row non-zero count: {np.count_nonzero(bottom_row[..., 3] > 0)}")

if __name__ == "__main__":
    build_seamless_wall()
