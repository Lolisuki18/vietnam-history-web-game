"""Draw Chị Sáu (sau.png) with feminine, historically accurate details
matching the Codex portrait (vothisau-codex.webp):
- Slender young woman anatomy (graceful silhouette, not a boy)
- Traditional brown silk bà ba shirt with realistic shading & hem
- Black-and-white checkered scarf (khăn rằn) knotted neatly in front
- Long braided hair (tóc tết) over right shoulder
- Flowing black silk trousers (quần lụa đen)
- Delicate bare feet (chân đất)
- Exact 80x96 frame grid, feet anchored at y=72, center at x=40
- All 8 animation rows: walk down/left/right/up, sneak, throw grenade, interact, hide
"""

from __future__ import annotations

import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parents[2]
OUT_PATH = ROOT / "public" / "assets" / "vothisau" / "sprites" / "sau.png"

FRAME_W = 80
FRAME_H = 96
FEET_Y = 72
ANCHOR_X = 40

# Colors sampled from vothisau-codex.webp
SKIN_HI   = (248, 218, 192)
SKIN_MID  = (234, 190, 156)
SKIN_SHD  = (198, 150, 116)
SKIN_LIP  = (205, 115, 105)
EYE_DARK  = (26, 20, 22)

HAIR_DEEP = (14, 12, 14)
HAIR_DARK = (24, 20, 22)
HAIR_HI   = (48, 40, 44)

# Brown silk bà ba
SHIRT_HI  = (168, 120, 78)
SHIRT_MID = (130, 88, 54)
SHIRT_SHD = (92, 58, 34)
SHIRT_OUT = (60, 38, 22)

# Khăn rằn
SCARF_W   = (245, 242, 238)
SCARF_B   = (38, 36, 40)
SCARF_GRY = (150, 145, 140)

# Black silk trousers
PANTS_HI  = (50, 50, 58)
PANTS_MID = (26, 26, 32)
PANTS_SHD = (14, 14, 18)

def safe_ellipse(draw: ImageDraw.Draw, p1: tuple[int, int], p2: tuple[int, int], **kwargs):
    x0, y0 = min(p1[0], p2[0]), min(p1[1], p2[1])
    x1, y1 = max(p1[0], p2[0]), max(p1[1], p2[1])
    draw.ellipse([(x0, y0), (x1, y1)], **kwargs)

def safe_rect(draw: ImageDraw.Draw, p1: tuple[int, int], p2: tuple[int, int], **kwargs):
    x0, y0 = min(p1[0], p2[0]), min(p1[1], p2[1])
    x1, y1 = max(p1[0], p2[0]), max(p1[1], p2[1])
    draw.rectangle([(x0, y0), (x1, y1)], **kwargs)

def draw_sau_frame(draw: ImageDraw.Draw, x0: int, y0: int, facing: str, step: int, pose: str):
    """Draws Chị Sáu in a single 80x96 cell starting at (x0, y0)."""
    cx = x0 + ANCHOR_X
    cy = y0 + FEET_Y

    # Crouch and bob offsets
    crouch = 14 if pose == "hide" else 7 if pose == "sneak" else 0
    bob = 1 if (step % 2 == 1 and pose in ("walk", "sneak")) else 0
    dir_sign = -1 if facing == "left" else 1
    is_side = facing in ("left", "right") or pose in ("sneak", "throw", "interact", "hide")
    is_back = facing == "up" and pose not in ("sneak", "throw", "interact", "hide")

    # Head position
    head_cy = cy - 50 + bob + crouch
    torso_top = head_cy + 9
    waist_y = torso_top + 14
    hem_y = waist_y + 10  # Flared hem of bà ba reaches mid-thigh
    feet_y = cy

    # ---------------------------------------------------------
    # 1. Legs & Trousers
    # ---------------------------------------------------------
    leg_w = 6
    if pose in ("walk", "sneak"):
        stride = 6 if pose == "walk" else 4
        sw1 = stride if (step % 4 in (1, 2)) else -stride if (step % 4 in (3, 0)) else 0
        sw2 = -sw1
        
        if is_side:
            # Far leg (darker shading)
            draw.line([(cx + sw2 * dir_sign, waist_y + 6), (cx + sw2 * dir_sign * 1.2, feet_y - 3)], fill=PANTS_SHD, width=leg_w)
            safe_ellipse(draw, (cx + int(sw2 * dir_sign * 1.2) - 2, feet_y - 3), (cx + int(sw2 * dir_sign * 1.2) + 4 * dir_sign, feet_y), fill=SKIN_SHD)
            # Near leg
            draw.line([(cx + sw1 * dir_sign, waist_y + 6), (cx + sw1 * dir_sign * 1.2, feet_y - 3)], fill=PANTS_MID, width=leg_w)
            draw.line([(cx + sw1 * dir_sign - 1, waist_y + 8), (cx + sw1 * dir_sign * 1.2 - 1, feet_y - 4)], fill=PANTS_HI, width=1)
            safe_ellipse(draw, (cx + int(sw1 * dir_sign * 1.2) - 3, feet_y - 3), (cx + int(sw1 * dir_sign * 1.2) + 5 * dir_sign, feet_y), fill=SKIN_MID)
        else:
            sw = 3 if step % 2 == 1 else -3
            # Left leg
            draw.line([(cx - 5, waist_y + 6), (cx - 5, feet_y - 3 + sw)], fill=PANTS_MID, width=leg_w)
            safe_ellipse(draw, (cx - 7, feet_y - 3 + sw), (cx - 2, feet_y + sw), fill=SKIN_MID)
            # Right leg
            draw.line([(cx + 5, waist_y + 6), (cx + 5, feet_y - 3 - sw)], fill=PANTS_MID, width=leg_w)
            safe_ellipse(draw, (cx + 2, feet_y - 3 - sw), (cx + 7, feet_y - sw), fill=SKIN_MID)
    elif pose == "hide":
        safe_ellipse(draw, (cx - 8 * dir_sign, feet_y - 8), (cx + 6 * dir_sign, feet_y), fill=PANTS_MID)
        safe_ellipse(draw, (cx - 6 * dir_sign, feet_y - 4), (cx + 2 * dir_sign, feet_y), fill=SKIN_MID)
    else:
        # Standing
        if is_side:
            draw.line([(cx - 1, waist_y + 6), (cx - 1, feet_y - 3)], fill=PANTS_MID, width=leg_w)
            draw.line([(cx - 2, waist_y + 7), (cx - 2, feet_y - 4)], fill=PANTS_HI, width=1)
            safe_ellipse(draw, (cx - 3, feet_y - 3), (cx + 5 * dir_sign, feet_y), fill=SKIN_MID)
        else:
            draw.line([(cx - 5, waist_y + 6), (cx - 5, feet_y - 3)], fill=PANTS_MID, width=leg_w)
            safe_ellipse(draw, (cx - 7, feet_y - 3), (cx - 2, feet_y), fill=SKIN_MID)
            draw.line([(cx + 5, waist_y + 6), (cx + 5, feet_y - 3)], fill=PANTS_MID, width=leg_w)
            safe_ellipse(draw, (cx + 2, feet_y - 3), (cx + 7, feet_y), fill=SKIN_MID)

    # ---------------------------------------------------------
    # 2. Torso: Brown Silk Áo Bà Ba
    # ---------------------------------------------------------
    if is_side:
        torso_pts = [
            (cx - 5 * dir_sign, torso_top),
            (cx + 6 * dir_sign, torso_top + 2),
            (cx + 5 * dir_sign, waist_y),
            (cx + 7 * dir_sign, hem_y),
            (cx - 6 * dir_sign, hem_y),
            (cx - 5 * dir_sign, waist_y),
        ]
        draw.polygon(torso_pts, fill=SHIRT_MID, outline=SHIRT_OUT)
        draw.line([(cx + 4 * dir_sign, torso_top + 3), (cx + 4 * dir_sign, hem_y - 1)], fill=SHIRT_HI, width=1)
        draw.line([(cx - 1, waist_y + 4), (cx - 1, hem_y)], fill=SHIRT_SHD, width=1)
    else:
        torso_pts = [
            (cx - 8, torso_top),
            (cx + 8, torso_top),
            (cx + 6, waist_y),
            (cx + 9, hem_y),
            (cx - 9, hem_y),
            (cx - 6, waist_y),
        ]
        draw.polygon(torso_pts, fill=SHIRT_MID, outline=SHIRT_OUT)
        draw.line([(cx - 4, torso_top + 2), (cx - 3, hem_y - 1)], fill=SHIRT_HI, width=1)
        draw.line([(cx + 4, torso_top + 2), (cx + 3, hem_y - 1)], fill=SHIRT_HI, width=1)
        if not is_back:
            draw.line([(cx, torso_top + 4), (cx, hem_y - 1)], fill=SHIRT_SHD, width=1)
            for by in (torso_top + 6, torso_top + 11, waist_y + 1, waist_y + 6):
                safe_rect(draw, (cx - 1, by), (cx + 1, by + 1), fill=SHIRT_HI)

    # ---------------------------------------------------------
    # 3. Arms & Hands
    # ---------------------------------------------------------
    arm_w = 4
    if pose == "throw":
        if step == 0:
            draw.line([(cx - 3 * dir_sign, torso_top + 3), (cx - 11 * dir_sign, torso_top - 6)], fill=SHIRT_MID, width=arm_w)
            safe_ellipse(draw, (cx - 13 * dir_sign, torso_top - 9), (cx - 9 * dir_sign, torso_top - 5), fill=SKIN_MID)
            safe_ellipse(draw, (cx - 16 * dir_sign, torso_top - 12), (cx - 10 * dir_sign, torso_top - 6), fill=(55, 65, 50))
        elif step == 1:
            draw.line([(cx + 2 * dir_sign, torso_top + 2), (cx + 10 * dir_sign, torso_top - 12)], fill=SHIRT_MID, width=arm_w)
            safe_ellipse(draw, (cx + 8 * dir_sign, torso_top - 14), (cx + 12 * dir_sign, torso_top - 10), fill=SKIN_MID)
            safe_ellipse(draw, (cx + 9 * dir_sign, torso_top - 17), (cx + 15 * dir_sign, torso_top - 11), fill=(55, 65, 50))
        else:
            draw.line([(cx + 3 * dir_sign, torso_top + 3), (cx + 14 * dir_sign, torso_top + 6)], fill=SHIRT_MID, width=arm_w)
            safe_ellipse(draw, (cx + 13 * dir_sign, torso_top + 4), (cx + 16 * dir_sign, torso_top + 8), fill=SKIN_MID)
    elif pose == "interact":
        reach = 6 + step * 3
        draw.line([(cx + 2 * dir_sign, torso_top + 3), (cx + reach * dir_sign, torso_top + 7)], fill=SHIRT_MID, width=arm_w)
        safe_ellipse(draw, (cx + (reach - 1) * dir_sign, torso_top + 5), (cx + (reach + 3) * dir_sign, torso_top + 9), fill=SKIN_MID)
        draw.line([(cx + (reach + 2) * dir_sign, torso_top + 6), (cx + (reach + 6) * dir_sign, torso_top + 6)], fill=(220, 220, 230), width=1)
    elif pose == "hide":
        draw.line([(cx, torso_top + 3), (cx + 4 * dir_sign, torso_top + 10)], fill=SHIRT_MID, width=arm_w)
        safe_ellipse(draw, (cx + 2 * dir_sign, torso_top + 9), (cx + 5 * dir_sign, torso_top + 12), fill=SKIN_MID)
    elif is_side:
        arm_sw = 4 if step % 2 == 1 else -3
        draw.line([(cx, torso_top + 3), (cx + arm_sw * dir_sign, torso_top + 15)], fill=SHIRT_MID, width=arm_w)
        draw.line([(cx - 1, torso_top + 4), (cx + arm_sw * dir_sign - 1, torso_top + 14)], fill=SHIRT_HI, width=1)
        safe_ellipse(draw, (cx + arm_sw * dir_sign - 2, torso_top + 13), (cx + arm_sw * dir_sign + 2, torso_top + 17), fill=SKIN_MID)
    else:
        asw = 2 if step % 2 == 1 else -2
        draw.line([(cx - 8, torso_top + 2), (cx - 10, torso_top + 14 + asw)], fill=SHIRT_MID, width=arm_w)
        safe_ellipse(draw, (cx - 11, torso_top + 13 + asw), (cx - 8, torso_top + 17 + asw), fill=SKIN_MID)
        draw.line([(cx + 8, torso_top + 2), (cx + 10, torso_top + 14 - asw)], fill=SHIRT_MID, width=arm_w)
        safe_ellipse(draw, (cx + 8, torso_top + 13 - asw), (cx + 11, torso_top + 17 - asw), fill=SKIN_MID)

    # ---------------------------------------------------------
    # 4. Khăn Rằn (Checkered scarf knotted at the neck)
    # ---------------------------------------------------------
    if not is_back:
        neck_y = head_cy + 5
        safe_rect(draw, (cx - 7, neck_y), (cx + 7, neck_y + 4), fill=SCARF_W)
        for sx in range(cx - 6, cx + 7, 3):
            safe_rect(draw, (sx, neck_y), (sx + 1, neck_y + 4), fill=SCARF_B)
        safe_ellipse(draw, (cx - 3, neck_y + 3), (cx + 3, neck_y + 8), fill=SCARF_B, outline=SCARF_W, width=1)
        draw.line([(cx - 2, neck_y + 6), (cx - 4, neck_y + 16)], fill=SCARF_W, width=2)
        draw.line([(cx + 2, neck_y + 6), (cx + 4, neck_y + 15)], fill=SCARF_W, width=2)
        safe_rect(draw, (cx - 4, neck_y + 10), (cx - 2, neck_y + 12), fill=SCARF_B)
        safe_rect(draw, (cx + 2, neck_y + 9), (cx + 4, neck_y + 11), fill=SCARF_B)
        draw.line([(cx - 5, neck_y + 16), (cx - 1, neck_y + 16)], fill=SCARF_GRY, width=1)

    # ---------------------------------------------------------
    # 5. Head & Facial Features
    # ---------------------------------------------------------
    face_r = 6
    safe_ellipse(draw, (cx - face_r, head_cy - face_r), (cx + face_r, head_cy + face_r), fill=SKIN_MID, outline=SKIN_SHD, width=1)

    if not is_back:
        if is_side:
            eye_x = cx + 2 * dir_sign
            safe_rect(draw, (eye_x, head_cy - 1), (eye_x + 1, head_cy + 1), fill=EYE_DARK)
            draw.point((cx + 5 * dir_sign, head_cy + 3), fill=SKIN_LIP)
        else:
            safe_rect(draw, (cx - 4, head_cy - 1), (cx - 2, head_cy + 1), fill=EYE_DARK)
            safe_rect(draw, (cx + 2, head_cy - 1), (cx + 4, head_cy + 1), fill=EYE_DARK)
            draw.line([(cx - 5, head_cy - 3), (cx - 2, head_cy - 3)], fill=HAIR_DARK, width=1)
            draw.line([(cx + 2, head_cy - 3), (cx + 5, head_cy - 3)], fill=HAIR_DARK, width=1)
            draw.line([(cx - 2, head_cy + 4), (cx + 2, head_cy + 4)], fill=SKIN_LIP, width=1)

    # ---------------------------------------------------------
    # 6. Hair & Long Braid
    # ---------------------------------------------------------
    if is_back:
        safe_ellipse(draw, (cx - 7, head_cy - 7), (cx + 7, head_cy + 4), fill=HAIR_DARK)
        braid_x = cx + 1
        for i in range(8):
            by = head_cy + 3 + i * 3
            bx = braid_x + (1 if i % 2 == 0 else -1)
            safe_ellipse(draw, (bx - 2, by), (bx + 2, by + 3), fill=HAIR_DEEP, outline=HAIR_HI, width=1)
        safe_rect(draw, (braid_x - 2, head_cy + 25), (braid_x + 2, head_cy + 27), fill=(210, 45, 40))
    else:
        draw.arc([(cx - 7, head_cy - 8), (cx + 7, head_cy + 2)], 190, 350, fill=HAIR_DARK, width=4)
        safe_ellipse(draw, (cx - 7, head_cy - 8), (cx + 7, head_cy - 2), fill=HAIR_DARK)
        draw.line([(cx - 5, head_cy - 5), (cx + 5, head_cy - 5)], fill=HAIR_HI, width=1)
        
        # Long braid over right shoulder
        braid_base_x = cx + 6 * dir_sign if is_side else cx + 6
        braid_base_y = head_cy + 3
        for i in range(7):
            by = braid_base_y + i * 3
            bx = int(braid_base_x - (i * 0.4 * dir_sign if is_side else i * 0.4))
            safe_ellipse(draw, (bx - 2, by), (bx + 2, by + 3), fill=HAIR_DEEP, outline=HAIR_HI, width=1)
        safe_rect(draw, (int(braid_base_x - 4), braid_base_y + 20), (int(braid_base_x), braid_base_y + 22), fill=(215, 40, 35))

def build_sau_sheet() -> None:
    print(f"Drawing Chị Sáu (sau.png) at 480x768...")
    sheet = Image.new("RGBA", (480, 768), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sheet)

    # Row 0: Walk down (4 frames)
    for c in range(4):
        draw_sau_frame(draw, c * FRAME_W, 0 * FRAME_H, "down", c, "walk" if c > 0 else "stand")

    # Row 1: Walk left (4 frames)
    for c in range(4):
        draw_sau_frame(draw, c * FRAME_W, 1 * FRAME_H, "left", c, "walk" if c > 0 else "stand")

    # Row 2: Walk right (4 frames)
    for c in range(4):
        draw_sau_frame(draw, c * FRAME_W, 2 * FRAME_H, "right", c, "walk" if c > 0 else "stand")

    # Row 3: Walk up (4 frames)
    for c in range(4):
        draw_sau_frame(draw, c * FRAME_W, 3 * FRAME_H, "up", c, "walk" if c > 0 else "stand")

    # Row 4: Sneak facing right (4 frames)
    for c in range(4):
        draw_sau_frame(draw, c * FRAME_W, 4 * FRAME_H, "right", c, "sneak")

    # Row 5: Throw grenade (3 frames)
    for c in range(3):
        draw_sau_frame(draw, c * FRAME_W, 5 * FRAME_H, "right", c, "throw")

    # Row 6: Interact / cut rope (3 frames)
    for c in range(3):
        draw_sau_frame(draw, c * FRAME_W, 6 * FRAME_H, "right", c, "interact")

    # Row 7: Hide / crouch in bush / crowd (2 frames)
    for c in range(2):
        draw_sau_frame(draw, c * FRAME_W, 7 * FRAME_H, "right", c, "hide")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_PATH, optimize=True)
    print(f"  [SUCCESS] {OUT_PATH.relative_to(ROOT)} saved ({sheet.width}x{sheet.height}) {OUT_PATH.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    build_sau_sheet()
