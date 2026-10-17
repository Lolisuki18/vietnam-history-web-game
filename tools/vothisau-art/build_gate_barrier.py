"""Generate vertical French colonial military checkpoint gate barrier (prop_gate_barrier.png).

Requirements:
- 120 x 110 px, transparent background
- Sits in the North-South vertical gap between MARKET_WALL.gapTop (1100) and gapBottom (1230)
- Two fortified sentry posts at North (top, y ~ 15) and South (bottom, y ~ 95)
- Red and white striped wooden boom barrier pole (thanh chắn ba-ri-e) spanning vertically across the gap
- Sandbag fortifications piled at the base of the posts
- 16-bit JRPG pixel art aesthetic matching the other market props
"""

import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "assets" / "vothisau" / "images" / "prop_gate_barrier.png"

W, H = 120, 110
CX = 60

def build_barrier() -> Image.Image:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Palette
    WOOD_DARK = (52, 38, 26, 255)
    WOOD_BASE = (98, 70, 46, 255)
    WOOD_LIGHT = (136, 100, 68, 255)
    IRON_DARK = (34, 34, 38, 255)
    IRON_LIGHT = (72, 74, 82, 255)
    SANDBAG_BASE = (175, 150, 108, 255)
    SANDBAG_DARK = (118, 98, 68, 255)
    SANDBAG_LIGHT = (205, 180, 132, 255)
    RED_STRIPE = (185, 36, 32, 255)
    WHITE_STRIPE = (235, 230, 218, 255)
    SHADOW = (14, 12, 10, 80)

    # 1. Ground Shadows under posts and barrier
    s_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(s_img)
    # North post shadow
    s_draw.ellipse([(CX - 22, 28), (CX + 22, 38)], fill=SHADOW)
    # South post shadow
    s_draw.ellipse([(CX - 28, 98), (CX + 28, 110)], fill=SHADOW)
    # Barrier diagonal cast shadow
    s_draw.polygon([(CX - 8, 32), (CX + 4, 32), (CX + 8, 104), (CX - 4, 104)], fill=SHADOW)
    img = Image.alpha_composite(img, s_img)
    draw = ImageDraw.Draw(img)

    # 2. North Post (Top upright support anchor)
    # Wooden post: 14 px wide, from y=12 to y=36
    ny0, ny1 = 12, 36
    nx0, nx1 = CX - 16, CX - 4
    draw.rectangle([(nx0, ny0), (nx1, ny1)], fill=WOOD_BASE, outline=WOOD_DARK)
    draw.line([(nx0 + 2, ny0), (nx0 + 2, ny1)], fill=WOOD_LIGHT)
    # Top iron cap / bracket
    draw.rectangle([(nx0 - 2, ny0), (nx1 + 2, ny0 + 4)], fill=IRON_DARK)
    draw.rectangle([(nx0 - 1, ny0 + 1), (nx1 + 1, ny0 + 2)], fill=IRON_LIGHT)
    # Support cross-brace
    draw.line([(nx0, ny1 - 2), (nx0 - 10, ny1 + 6)], fill=WOOD_DARK, width=3)
    draw.line([(nx0, ny1 - 2), (nx0 - 10, ny1 + 6)], fill=WOOD_BASE, width=2)

    # Sandbags around North post
    for bx, by in [(nx0 - 8, ny1 - 2), (nx0 + 2, ny1 - 3)]:
        draw.rounded_rectangle([(bx, by), (bx + 14, by + 8)], radius=3, fill=SANDBAG_BASE, outline=SANDBAG_DARK)
        draw.line([(bx + 2, by + 2), (bx + 12, by + 2)], fill=SANDBAG_LIGHT)

    # 3. South Post (Main counterweight / pivot sentry post)
    # Base stanchion: from y=68 to y=106
    sy0, sy1 = 68, 106
    sx0, sx1 = CX - 8, CX + 8
    # Two parallel vertical beams with steel housing
    draw.rectangle([(sx0 - 2, sy0), (sx1 + 2, sy1)], fill=WOOD_BASE, outline=WOOD_DARK)
    draw.line([(sx0, sy0), (sx0, sy1)], fill=WOOD_LIGHT)
    draw.line([(sx1, sy0), (sx1, sy1)], fill=WOOD_DARK)
    # Steel pivot bracket & hinge plate
    draw.rectangle([(sx0 - 5, sy0 + 6), (sx1 + 5, sy0 + 18)], fill=IRON_DARK)
    draw.rectangle([(sx0 - 4, sy0 + 7), (sx1 + 4, sy0 + 16)], fill=IRON_LIGHT)
    # Large iron pivot bolt
    draw.ellipse([(CX - 4, sy0 + 9), (CX + 4, sy0 + 15)], fill=(20, 20, 24, 255), outline=IRON_LIGHT)

    # Counterweight metal box extending south
    draw.rectangle([(CX - 6, sy0 + 16), (CX + 6, sy0 + 28)], fill=IRON_DARK, outline=(15, 15, 18, 255))
    draw.rectangle([(CX - 4, sy0 + 18), (CX + 4, sy0 + 26)], fill=(60, 62, 68, 255))

    # Heavy sandbags fortified around base of South post
    for bx, by in [
        (sx0 - 18, sy1 - 8), (sx0 + 6, sy1 - 8),
        (sx0 - 12, sy1 - 15), (sx0 + 2, sy1 - 15),
        (sx0 - 16, sy1 - 4), (sx0 + 4, sy1 - 4), (sx0 - 6, sy1 - 3)
    ]:
        draw.rounded_rectangle([(bx, by), (bx + 16, by + 9)], radius=3, fill=SANDBAG_BASE, outline=SANDBAG_DARK)
        draw.line([(bx + 2, by + 2), (bx + 14, by + 2)], fill=SANDBAG_LIGHT)

    # 4. Vertical Red & White Striped Boom Barrier Bar
    # Runs from North bracket (CX - 8, ny0 + 8) down to South pivot (CX, sy0 + 12)
    # Bar width 7 px
    bar_x0, bar_y0 = CX - 9, ny0 + 10
    bar_x1, bar_y1 = CX - 1, sy0 + 12
    bar_len = bar_y1 - bar_y0

    # Draw the striped barrier pole in 10 segments alternating red and white
    num_stripes = 9
    seg_h = bar_len / num_stripes
    for i in range(num_stripes):
        y_start = int(bar_y0 + i * seg_h)
        y_end = int(bar_y0 + (i + 1) * seg_h)
        col = RED_STRIPE if i % 2 == 0 else WHITE_STRIPE
        outline_col = (100, 18, 15, 255) if i % 2 == 0 else (140, 135, 125, 255)
        # Bar with diagonal 3D tilt
        bx_cur = int(bar_x0 + (bar_x1 - bar_x0) * (i / num_stripes))
        draw.rectangle([(bx_cur, y_start), (bx_cur + 7, y_end)], fill=col, outline=outline_col)
        # Bevel highlight along left edge
        hl_col = (235, 90, 80, 255) if i % 2 == 0 else (255, 255, 250, 255)
        draw.line([(bx_cur + 1, y_start), (bx_cur + 1, y_end)], fill=hl_col)

    # Hanging warning disc / metal plate in middle of the barrier
    mid_y = (bar_y0 + bar_y1) // 2
    mid_x = (bar_x0 + bar_x1) // 2 + 3
    # Chain/cable
    draw.line([(mid_x, mid_y - 8), (mid_x, mid_y)], fill=IRON_DARK, width=1)
    # Round red warning disc
    draw.ellipse([(mid_x - 7, mid_y), (mid_x + 7, mid_y + 14)], fill=RED_STRIPE, outline=(90, 15, 15, 255))
    draw.ellipse([(mid_x - 5, mid_y + 2), (mid_x + 5, mid_y + 12)], fill=(225, 45, 40, 255))
    draw.rectangle([(mid_x - 4, mid_y + 6), (mid_x + 4, mid_y + 8)], fill=WHITE_STRIPE)

    # Small warning lantern on North post
    draw.rectangle([(nx0 - 8, ny0 + 4), (nx0 - 3, ny0 + 12)], fill=(40, 35, 30, 255), outline=(20, 18, 15, 255))
    draw.ellipse([(nx0 - 7, ny0 + 6), (nx0 - 4, ny0 + 10)], fill=(255, 180, 50, 230))

    return img

def main():
    img = build_barrier()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, optimize=True)
    print(f"Saved {OUT} ({img.size}) successfully!")

if __name__ == "__main__":
    main()
