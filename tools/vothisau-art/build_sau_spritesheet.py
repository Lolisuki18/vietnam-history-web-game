"""Full Sprite Sheet Generator for Vo Thi Sau (sau.png)
Complies with game-assets skill specifications:
- 6 columns x 8 rows = 480 x 768 px
- Cell size: 80 x 96 px
- Origin: (40, 72)
- High-fidelity 16-bit JRPG aesthetics matching Kim Dong and Codex portrait:
  - Female heroine Vo Thi Sau (slender, graceful, determined)
  - Brown silk ao ba ba with tailored waist, cloth buttons, side slits
  - Black and white checkered khan ran draped around neck and knotted
  - Glossy black hair parted at crown with golden le-ki-ma flower
  - Long braided hair trailing over right shoulder
  - Black silk trousers, delicate bare feet
- 8 Animation Rows:
  - Row 0: Walk Down (4 frames)
  - Row 1: Walk Left (4 frames)
  - Row 2: Walk Right (4 frames)
  - Row 3: Walk Up (4 frames)
  - Row 4: Sneak / Crouch Walk (4 frames)
  - Row 5: Throw Grenade (3 frames)
  - Row 6: Interact / Cut Rope (3 frames)
  - Row 7: Hide / Crouch in Foliage (2 frames)
"""

from __future__ import annotations
import math
from pathlib import Path
from PIL import Image, ImageDraw

SCALE = 4
CELL_W, CELL_H = 80, 96
SHEET_COLS, SHEET_ROWS = 6, 8
TOTAL_W, TOTAL_H = CELL_W * SHEET_COLS, CELL_H * SHEET_ROWS

W, H = CELL_W * SCALE, CELL_H * SCALE  # 320 x 384
CX = 40 * SCALE                         # 160
FEET_Y = 72 * SCALE                     # 288

def safe_ellipse(draw: ImageDraw.ImageDraw, box, **kwargs):
    x0, y0, x1, y1 = box
    draw.ellipse([min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)], **kwargs)

def safe_rect(draw: ImageDraw.ImageDraw, box, **kwargs):
    x0, y0, x1, y1 = box
    draw.rectangle([min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)], **kwargs)

def safe_arc(draw: ImageDraw.ImageDraw, box, start, end, **kwargs):
    x0, y0, x1, y1 = box
    draw.arc([min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)], start, end, **kwargs)

def safe_chord(draw: ImageDraw.ImageDraw, box, start, end, **kwargs):
    x0, y0, x1, y1 = box
    draw.chord([min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)], start, end, **kwargs)

def render_frame_hd(facing="down", anim_phase=0, action="walk") -> Image.Image:
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    bob = 0
    if action == "walk" and anim_phase in (1, 3):
        bob = -1 * SCALE
    elif action == "sneak":
        bob = 3 * SCALE
    elif action == "hide":
        bob = 7 * SCALE if anim_phase == 0 else 6 * SCALE

    cy = FEET_Y
    cx = CX
    dir_x = 1 if facing != "left" else -1
    is_side = facing in ("left", "right")

    head_top = 8 * SCALE + bob
    chin_y = 25 * SCALE + bob
    neck_y = 24 * SCALE + bob
    shoulder_y = 29 * SCALE + bob
    waist_y = 39 * SCALE + bob
    hip_y = 49 * SCALE + bob
    trouser_y = 66 * SCALE

    # Dynamic torso offsets for actions
    lean_x = 0
    if action == "sneak":
        lean_x = 3 * dir_x * SCALE
    elif action == "throw":
        if anim_phase == 0:
            lean_x = -2 * dir_x * SCALE
        elif anim_phase == 1:
            lean_x = 4 * dir_x * SCALE
        else:
            lean_x = 2 * dir_x * SCALE
    elif action == "interact":
        lean_x = 2 * dir_x * SCALE

    tcx = cx + lean_x

    # 1. Soft Ambient Ground Shadow
    sh_w = (11 if not is_side else 9) * SCALE
    sh_h = int(3.2 * SCALE)
    safe_ellipse(draw, [cx - sh_w, cy - sh_h, cx + sh_w, cy + sh_h], fill=(12, 10, 18, 85))

    # 2. Pants & Bare Feet (Quần lụa đen Nam Bộ)
    if action == "hide":
        # Full crouch sitting on haunches
        draw.polygon([
            (cx - 7 * SCALE, waist_y + 2 * SCALE),
            (cx + 7 * SCALE, waist_y + 2 * SCALE),
            (cx + 8 * SCALE, cy - 2 * SCALE),
            (cx - 8 * SCALE, cy - 2 * SCALE),
        ], fill=(22, 23, 30, 255))
        safe_ellipse(draw, [cx - 5 * SCALE, cy - 3 * SCALE, cx - 1 * SCALE, cy], fill=(236, 185, 150, 255))
        safe_ellipse(draw, [cx + 1 * SCALE, cy - 3 * SCALE, cx + 5 * SCALE, cy], fill=(236, 185, 150, 255))

    elif facing == "down":
        l_step = -2 * SCALE if anim_phase == 1 else (1 * SCALE if anim_phase == 3 else 0)
        r_step = 1 * SCALE if anim_phase == 1 else (-2 * SCALE if anim_phase == 3 else 0)

        # Left Leg
        lx = cx - 4 * SCALE
        draw.polygon([
            (cx - 0.5 * SCALE, waist_y + 4 * SCALE),
            (cx - 8 * SCALE, waist_y + 4 * SCALE),
            (lx - 3.5 * SCALE, trouser_y + l_step),
            (lx + 3.0 * SCALE, trouser_y + l_step),
        ], fill=(22, 23, 30, 255))
        draw.line([(lx - 0.5 * SCALE, waist_y + 6 * SCALE), (lx - 0.5 * SCALE, trouser_y + l_step)], fill=(44, 46, 58, 255), width=int(1.5 * SCALE))
        draw.line([(lx - 3.5 * SCALE, waist_y + 6 * SCALE), (lx - 3.5 * SCALE, trouser_y + l_step)], fill=(12, 12, 16, 255), width=int(1.2 * SCALE))
        # Left Foot
        draw.polygon([
            (lx - 2 * SCALE, trouser_y + l_step),
            (lx + 2 * SCALE, trouser_y + l_step),
            (lx + 2.2 * SCALE, cy + l_step),
            (lx - 2.2 * SCALE, cy + l_step),
        ], fill=(236, 185, 150, 255))
        safe_ellipse(draw, [lx - 2.2 * SCALE, cy + l_step - 2.2 * SCALE, lx + 2.2 * SCALE, cy + l_step], fill=(248, 212, 185, 255))
        for tx in range(-2, 3):
            draw.point((lx + tx * 0.8 * SCALE, cy + l_step - 0.5 * SCALE), fill=(255, 225, 200, 255))

        # Right Leg
        rx = cx + 4 * SCALE
        draw.polygon([
            (cx + 0.5 * SCALE, waist_y + 4 * SCALE),
            (cx + 8 * SCALE, waist_y + 4 * SCALE),
            (rx + 3.5 * SCALE, trouser_y + r_step),
            (rx - 3.0 * SCALE, trouser_y + r_step),
        ], fill=(22, 23, 30, 255))
        draw.line([(rx + 0.5 * SCALE, waist_y + 6 * SCALE), (rx + 0.5 * SCALE, trouser_y + r_step)], fill=(44, 46, 58, 255), width=int(1.5 * SCALE))
        draw.line([(rx + 3.5 * SCALE, waist_y + 6 * SCALE), (rx + 3.5 * SCALE, trouser_y + r_step)], fill=(12, 12, 16, 255), width=int(1.2 * SCALE))
        # Right Foot
        draw.polygon([
            (rx - 2 * SCALE, trouser_y + r_step),
            (rx + 2 * SCALE, trouser_y + r_step),
            (rx + 2.2 * SCALE, cy + r_step),
            (rx - 2.2 * SCALE, cy + r_step),
        ], fill=(236, 185, 150, 255))
        safe_ellipse(draw, [rx - 2.2 * SCALE, cy + r_step - 2.2 * SCALE, rx + 2.2 * SCALE, cy + r_step], fill=(248, 212, 185, 255))
        for tx in range(-2, 3):
            draw.point((rx + tx * 0.8 * SCALE, cy + r_step - 0.5 * SCALE), fill=(255, 225, 200, 255))

    elif is_side:
        stride = 0
        if action == "walk":
            stride = 4.0 * SCALE if anim_phase == 1 else (-4.0 * SCALE if anim_phase == 3 else 0)
        elif action == "sneak":
            stride = 3.0 * SCALE if anim_phase in (1, 3) else 0
        elif action == "throw":
            stride = 3.5 * SCALE if anim_phase == 1 else 1.5 * SCALE
        elif action == "interact":
            stride = 1.0 * SCALE

        # Far leg
        fx = cx - int(stride * dir_x)
        draw.polygon([
            (cx - 2.5 * SCALE, waist_y + 5 * SCALE),
            (cx + 2.5 * SCALE, waist_y + 5 * SCALE),
            (fx + 3 * SCALE, trouser_y),
            (fx - 3.5 * SCALE, trouser_y),
        ], fill=(14, 15, 20, 255))
        safe_ellipse(draw, [fx - 2 * SCALE, trouser_y - 1 * SCALE, fx + 3 * SCALE * dir_x, cy], fill=(195, 140, 105, 255))

        # Near leg
        nx = cx + int(stride * dir_x)
        draw.polygon([
            (cx - 3.5 * SCALE, waist_y + 4 * SCALE),
            (cx + 3.5 * SCALE, waist_y + 4 * SCALE),
            (nx + 4 * SCALE, trouser_y),
            (nx - 3.5 * SCALE, trouser_y),
        ], fill=(24, 26, 34, 255))
        draw.line([(nx, waist_y + 6 * SCALE), (nx, trouser_y)], fill=(48, 52, 65, 255), width=int(1.5 * SCALE))
        safe_ellipse(draw, [nx - 2.2 * SCALE, trouser_y - 1 * SCALE, nx + 3.8 * SCALE * dir_x, cy], fill=(236, 185, 150, 255))

    elif facing == "up":
        l_step = 1 * SCALE if anim_phase == 1 else (-2 * SCALE if anim_phase == 3 else 0)
        r_step = -2 * SCALE if anim_phase == 1 else (1 * SCALE if anim_phase == 3 else 0)
        lx = cx - 4 * SCALE
        rx = cx + 4 * SCALE
        draw.polygon([(cx - 0.5 * SCALE, waist_y + 4 * SCALE), (cx - 8 * SCALE, waist_y + 4 * SCALE), (lx - 3.5 * SCALE, trouser_y + l_step), (lx + 3.0 * SCALE, trouser_y + l_step)], fill=(22, 23, 30, 255))
        draw.polygon([(cx + 0.5 * SCALE, waist_y + 4 * SCALE), (cx + 8 * SCALE, waist_y + 4 * SCALE), (rx + 3.5 * SCALE, trouser_y + r_step), (rx - 3.0 * SCALE, trouser_y + r_step)], fill=(22, 23, 30, 255))
        safe_ellipse(draw, [lx - 2 * SCALE, trouser_y + l_step, lx + 2 * SCALE, cy + l_step], fill=(210, 155, 120, 255))
        safe_ellipse(draw, [rx - 2 * SCALE, trouser_y + r_step, rx + 2 * SCALE, cy + r_step], fill=(210, 155, 120, 255))

    # 3. Áo Bà Ba (Brown Silk Shirt Body)
    poly_ta = [
        (tcx - 7 * SCALE, waist_y),
        (tcx + 7 * SCALE, waist_y),
        (tcx + 9 * SCALE, hip_y),
        (tcx - 9 * SCALE, hip_y),
    ]
    draw.polygon(poly_ta, fill=(116, 72, 42, 255))
    safe_chord(draw, [tcx - 9 * SCALE, hip_y - 2 * SCALE, tcx + 9 * SCALE, hip_y + 2 * SCALE], 0, 180, fill=(116, 72, 42, 255))
    if facing != "up":
        draw.polygon([(tcx - 9 * SCALE, hip_y), (tcx - 7.5 * SCALE, hip_y - 4 * SCALE), (tcx - 9.5 * SCALE, hip_y)], fill=(22, 23, 30, 255))
        draw.polygon([(tcx + 9 * SCALE, hip_y), (tcx + 7.5 * SCALE, hip_y - 4 * SCALE), (tcx + 9.5 * SCALE, hip_y)], fill=(22, 23, 30, 255))

    poly_torso = [
        (tcx - 4 * SCALE, neck_y + 2 * SCALE),
        (tcx - 10 * SCALE, shoulder_y + 1 * SCALE),
        (tcx - 7 * SCALE, waist_y),
        (tcx + 7 * SCALE, waist_y),
        (tcx + 10 * SCALE, shoulder_y + 1 * SCALE),
        (tcx + 4 * SCALE, neck_y + 2 * SCALE),
    ]
    draw.polygon(poly_torso, fill=(126, 78, 46, 255))
    draw.line([(tcx - 5 * SCALE, shoulder_y + 2 * SCALE), (tcx - 3.5 * SCALE, waist_y)], fill=(152, 98, 60, 255), width=int(2 * SCALE))
    draw.line([(tcx + 5 * SCALE, shoulder_y + 2 * SCALE), (tcx + 3.5 * SCALE, waist_y)], fill=(96, 56, 30, 255), width=int(2 * SCALE))
    draw.line([(tcx - 10 * SCALE, shoulder_y + 1 * SCALE), (tcx - 7 * SCALE, waist_y)], fill=(58, 32, 18, 255), width=int(1.2 * SCALE))
    draw.line([(tcx + 10 * SCALE, shoulder_y + 1 * SCALE), (tcx + 7 * SCALE, waist_y)], fill=(58, 32, 18, 255), width=int(1.2 * SCALE))

    if facing == "down":
        draw.line([(tcx, neck_y + 4 * SCALE), (tcx, hip_y - 1 * SCALE)], fill=(142, 90, 54, 255), width=int(1.2 * SCALE))
        for by in range(int(neck_y + 6 * SCALE), int(hip_y - 2 * SCALE), int(3.2 * SCALE)):
            safe_ellipse(draw, [tcx - 0.8 * SCALE, by - 0.8 * SCALE, tcx + 0.8 * SCALE, by + 0.8 * SCALE], fill=(225, 180, 140, 255))

    # 4. Arms & Sleeves
    arm_swing = 0
    if action == "walk":
        arm_swing = 2.5 * SCALE if anim_phase == 1 else (-2.5 * SCALE if anim_phase == 3 else 0)

    if facing == "down":
        # Left Arm
        poly_l_arm = [
            (tcx - 10 * SCALE, shoulder_y + 1 * SCALE),
            (tcx - 6 * SCALE, shoulder_y + 2 * SCALE),
            (tcx - 7.5 * SCALE, waist_y + 4 * SCALE - int(arm_swing)),
            (tcx - 11 * SCALE, waist_y + 3 * SCALE - int(arm_swing)),
        ]
        draw.polygon(poly_l_arm, fill=(116, 72, 42, 255))
        draw.line([(poly_l_arm[0]), (poly_l_arm[3])], fill=(58, 32, 18, 255), width=int(1.2 * SCALE))
        hx_l = tcx - 9.5 * SCALE
        hy_l = waist_y + 4 * SCALE - int(arm_swing)
        safe_ellipse(draw, [hx_l - 1.8 * SCALE, hy_l, hx_l + 1.8 * SCALE, hy_l + 3.8 * SCALE], fill=(236, 185, 150, 255), outline=(160, 102, 75, 255))

        # Right Arm
        poly_r_arm = [
            (tcx + 6 * SCALE, shoulder_y + 2 * SCALE),
            (tcx + 10 * SCALE, shoulder_y + 1 * SCALE),
            (tcx + 11 * SCALE, waist_y + 3 * SCALE + int(arm_swing)),
            (tcx + 7.5 * SCALE, waist_y + 4 * SCALE + int(arm_swing)),
        ]
        draw.polygon(poly_r_arm, fill=(116, 72, 42, 255))
        draw.line([(poly_r_arm[1]), (poly_r_arm[2])], fill=(58, 32, 18, 255), width=int(1.2 * SCALE))
        hx_r = tcx + 9.5 * SCALE
        hy_r = waist_y + 4 * SCALE + int(arm_swing)
        safe_ellipse(draw, [hx_r - 1.8 * SCALE, hy_r, hx_r + 1.8 * SCALE, hy_r + 3.8 * SCALE], fill=(236, 185, 150, 255), outline=(160, 102, 75, 255))

    elif is_side:
        if action == "throw":
            if anim_phase == 0:
                for ay in range(int(shoulder_y), int(shoulder_y + 8 * SCALE)):
                    sx = tcx - (ay - shoulder_y) * dir_x - 3 * dir_x * SCALE
                    safe_ellipse(draw, [sx - 1.5 * SCALE, ay - 1.5 * SCALE, sx + 1.5 * SCALE, ay + 1.5 * SCALE], fill=(120, 75, 44, 255))
                hx = tcx - 10 * dir_x * SCALE
                hy = shoulder_y - 2 * SCALE
                safe_ellipse(draw, [hx - 2 * SCALE, hy - 2 * SCALE, hx + 2 * SCALE, hy + 2 * SCALE], fill=(236, 185, 150, 255))
                safe_ellipse(draw, [hx - 3 * dir_x * SCALE, hy - 4 * SCALE, hx + 2 * dir_x * SCALE, hy - 1 * SCALE], fill=(76, 92, 58, 255), outline=(45, 56, 36, 255))
                draw.point((hx - 0.5 * SCALE, hy - 4.5 * SCALE), fill=(185, 190, 198, 255))
            elif anim_phase == 1:
                draw.line([(tcx, shoulder_y + 1 * SCALE), (tcx + 10 * dir_x * SCALE, shoulder_y - 4 * SCALE)], fill=(126, 78, 46, 255), width=int(2.5 * SCALE))
                hx = tcx + 11 * dir_x * SCALE
                hy = shoulder_y - 4 * SCALE
                safe_ellipse(draw, [hx - 2 * SCALE, hy - 2 * SCALE, hx + 2 * SCALE, hy + 2 * SCALE], fill=(236, 185, 150, 255))
                gx = hx + 5 * dir_x * SCALE
                gy = hy - 6 * SCALE
                safe_ellipse(draw, [gx - 2.5 * SCALE, gy - 2.5 * SCALE, gx + 2.5 * SCALE, gy + 2.5 * SCALE], fill=(76, 92, 58, 255), outline=(45, 56, 36, 255))
                draw.point((gx, gy - 3 * SCALE), fill=(185, 190, 198, 255))
            else:
                draw.line([(tcx, shoulder_y + 1 * SCALE), (tcx + 8 * dir_x * SCALE, shoulder_y + 6 * SCALE)], fill=(120, 75, 44, 255), width=int(2.5 * SCALE))
                hx = tcx + 8 * dir_x * SCALE
                hy = shoulder_y + 6 * SCALE
                safe_ellipse(draw, [hx - 2 * SCALE, hy - 2 * SCALE, hx + 2 * SCALE, hy + 2 * SCALE], fill=(236, 185, 150, 255))

        elif action == "interact":
            ext = (6 + anim_phase * 2) * SCALE
            draw.line([(tcx, shoulder_y + 2 * SCALE), (tcx + ext * dir_x, shoulder_y + 2 * SCALE)], fill=(120, 75, 44, 255), width=int(2.5 * SCALE))
            hx = tcx + ext * dir_x
            hy = shoulder_y + 2 * SCALE
            safe_ellipse(draw, [hx - 2 * SCALE, hy - 2 * SCALE, hx + 2 * SCALE, hy + 2 * SCALE], fill=(236, 185, 150, 255))
            draw.line([(hx, hy), (hx + 3 * dir_x * SCALE, hy)], fill=(225, 230, 238, 255), width=int(1.2 * SCALE))

        elif action == "hide":
            safe_ellipse(draw, [tcx - 4 * SCALE, waist_y, tcx + 4 * SCALE, waist_y + 6 * SCALE], fill=(120, 75, 44, 255))
            safe_ellipse(draw, [tcx, waist_y + 5 * SCALE, tcx + 3 * SCALE * dir_x, waist_y + 8 * SCALE], fill=(236, 185, 150, 255))

        else:
            sw_x = int(arm_swing * dir_x)
            draw.polygon([
                (tcx - 2.5 * SCALE, shoulder_y + 1 * SCALE),
                (tcx + 3.0 * SCALE, shoulder_y + 1 * SCALE),
                (tcx + 2.0 * SCALE + sw_x, waist_y + 4 * SCALE),
                (tcx - 2.5 * SCALE + sw_x, waist_y + 4 * SCALE),
            ], fill=(120, 75, 44, 255))
            safe_ellipse(draw, [tcx - 2.0 * SCALE + sw_x, waist_y + 4 * SCALE, tcx + 2.0 * SCALE + sw_x, waist_y + 7.5 * SCALE], fill=(236, 185, 150, 255))

    elif facing == "up":
        draw.polygon([(tcx - 10 * SCALE, shoulder_y + 1 * SCALE), (tcx - 6 * SCALE, shoulder_y + 2 * SCALE), (tcx - 7.5 * SCALE, waist_y + 4 * SCALE), (tcx - 11 * SCALE, waist_y + 3 * SCALE)], fill=(106, 62, 36, 255))
        draw.polygon([(tcx + 6 * SCALE, shoulder_y + 2 * SCALE), (tcx + 10 * SCALE, shoulder_y + 1 * SCALE), (tcx + 11 * SCALE, waist_y + 3 * SCALE), (tcx + 7.5 * SCALE, waist_y + 4 * SCALE)], fill=(106, 62, 36, 255))

    # 5. Khăn Rằn (Checkered Scarf)
    if facing == "down":
        safe_ellipse(draw, [tcx - 5.5 * SCALE, shoulder_y - 2.5 * SCALE, tcx + 5.5 * SCALE, shoulder_y + 2.0 * SCALE], fill=(245, 245, 250, 255), outline=(32, 33, 40, 255), width=int(1.2 * SCALE))
        for i in range(-4, 5, 2):
            draw.line([(tcx + i * SCALE, shoulder_y - 1.5 * SCALE), (tcx + i * SCALE, shoulder_y + 1.2 * SCALE)], fill=(32, 33, 40, 255), width=int(1.0 * SCALE))

        safe_ellipse(draw, [tcx - 2.2 * SCALE, shoulder_y + 1 * SCALE, tcx + 2.2 * SCALE, shoulder_y + 4.5 * SCALE], fill=(32, 33, 40, 255))
        safe_ellipse(draw, [tcx - 1.2 * SCALE, shoulder_y + 1.8 * SCALE, tcx + 1.2 * SCALE, shoulder_y + 3.8 * SCALE], fill=(245, 245, 250, 255))

        tail_len = 12 * SCALE
        for side, x_off in ((-1, -1.8 * SCALE), (1, 1.8 * SCALE)):
            tx = tcx + int(x_off)
            safe_rect(draw, [tx - 1.2 * SCALE, shoulder_y + 4.5 * SCALE, tx + 1.2 * SCALE, shoulder_y + 4.5 * SCALE + tail_len], fill=(245, 245, 250, 255))
            for y_step in range(int(shoulder_y + 4.5 * SCALE), int(shoulder_y + 4.5 * SCALE + tail_len), int(1.8 * SCALE)):
                safe_rect(draw, [tx - 1.2 * SCALE, y_step, tx, y_step + 0.9 * SCALE], fill=(32, 33, 40, 255))
                safe_rect(draw, [tx, y_step + 0.9 * SCALE, tx + 1.2 * SCALE, y_step + 1.8 * SCALE], fill=(32, 33, 40, 255))
            for fx in (tx - 0.8 * SCALE, tx + 0.8 * SCALE):
                draw.line([(fx, shoulder_y + 4.5 * SCALE + tail_len), (fx, shoulder_y + 6.2 * SCALE + tail_len)], fill=(195, 198, 205, 255), width=int(0.8 * SCALE))

    elif is_side:
        # Side view scarf wrapped around collar and hanging down front
        safe_ellipse(draw, [tcx - dir_x * 1 * SCALE, shoulder_y - 2 * SCALE, tcx + 5 * dir_x * SCALE, shoulder_y + 2.5 * SCALE], fill=(245, 245, 250, 255), outline=(32, 33, 40, 255))
        tx = tcx + 4.5 * dir_x * SCALE
        safe_rect(draw, [tx - 1.2 * SCALE, shoulder_y + 2.5 * SCALE, tx + 1.2 * SCALE, shoulder_y + 13 * SCALE], fill=(245, 245, 250, 255), outline=(32, 33, 40, 255))
        for y_step in range(int(shoulder_y + 2.5 * SCALE), int(shoulder_y + 13 * SCALE), int(2.2 * SCALE)):
            safe_rect(draw, [tx - 1.2 * SCALE, y_step, tx + 1.2 * SCALE, y_step + 1.1 * SCALE], fill=(32, 33, 40, 255))

    elif facing == "up":
        safe_ellipse(draw, [tcx - 5.5 * SCALE, shoulder_y - 2.5 * SCALE, tcx + 5.5 * SCALE, shoulder_y + 2.0 * SCALE], fill=(245, 245, 250, 255), outline=(32, 33, 40, 255), width=int(1.2 * SCALE))

    # 6. Head, Face & Hair
    if facing != "up":
        safe_rect(draw, [tcx - 2.5 * SCALE, chin_y - 2 * SCALE, tcx + 2.5 * SCALE, shoulder_y + 1 * SCALE], fill=(225, 175, 140, 255))

    if facing == "down":
        # Front face
        face_w = 10 * SCALE
        safe_ellipse(draw, [tcx - face_w, head_top + 1 * SCALE, tcx + face_w, chin_y + 1 * SCALE], fill=(238, 192, 160, 255), outline=(155, 100, 70, 255), width=int(1 * SCALE))
        safe_ellipse(draw, [tcx - 7 * SCALE, head_top + 7 * SCALE, tcx + 7 * SCALE, chin_y], fill=(248, 212, 185, 255))

        # Hair back volume
        safe_ellipse(draw, [tcx - 11 * SCALE, head_top, tcx + 11 * SCALE, head_top + 17 * SCALE], fill=(20, 16, 26, 255))
        # Visible face skin
        safe_ellipse(draw, [tcx - 8 * SCALE, head_top + 6 * SCALE, tcx + 8 * SCALE, chin_y], fill=(238, 192, 160, 255))
        safe_ellipse(draw, [tcx - 6 * SCALE, head_top + 8 * SCALE, tcx + 6 * SCALE, chin_y - 1 * SCALE], fill=(248, 212, 185, 255))

        # Parted hair curves framing forehead
        draw.polygon([
            (tcx - 11 * SCALE, head_top + 4 * SCALE),
            (tcx, head_top + 2 * SCALE),
            (tcx - 4.5 * SCALE, head_top + 7.5 * SCALE),
            (tcx - 9 * SCALE, head_top + 13 * SCALE),
            (tcx - 11 * SCALE, head_top + 13 * SCALE),
        ], fill=(24, 20, 32, 255))
        draw.polygon([
            (tcx, head_top + 2 * SCALE),
            (tcx + 11 * SCALE, head_top + 4 * SCALE),
            (tcx + 11 * SCALE, head_top + 13 * SCALE),
            (tcx + 9 * SCALE, head_top + 13 * SCALE),
            (tcx + 4.5 * SCALE, head_top + 7.5 * SCALE),
        ], fill=(24, 20, 32, 255))

        # Gloss sheen
        safe_arc(draw, [tcx - 7 * SCALE, head_top + 1 * SCALE, tcx + 7 * SCALE, head_top + 5.5 * SCALE], 200, 340, fill=(72, 62, 88, 255), width=int(1.8 * SCALE))
        safe_arc(draw, [tcx - 4 * SCALE, head_top + 1.8 * SCALE, tcx + 4 * SCALE, head_top + 4.5 * SCALE], 210, 330, fill=(108, 96, 130, 255), width=int(1.0 * SCALE))

        # Eyebrows
        safe_arc(draw, [tcx - 6 * SCALE, head_top + 9 * SCALE, tcx - 1.5 * SCALE, head_top + 11.5 * SCALE], 200, 340, fill=(45, 32, 38, 255), width=int(1.2 * SCALE))
        safe_arc(draw, [tcx + 1.5 * SCALE, head_top + 9 * SCALE, tcx + 6 * SCALE, head_top + 11.5 * SCALE], 200, 340, fill=(45, 32, 38, 255), width=int(1.2 * SCALE))

        # Eyes
        e_lx = tcx - 4 * SCALE
        e_y = head_top + 12.5 * SCALE
        safe_ellipse(draw, [e_lx - 1.8 * SCALE, e_y - 1.0 * SCALE, e_lx + 1.8 * SCALE, e_y + 1.4 * SCALE], fill=(250, 250, 255, 255), outline=(28, 22, 30, 255), width=int(0.8 * SCALE))
        safe_ellipse(draw, [e_lx - 0.9 * SCALE, e_y - 1.0 * SCALE, e_lx + 1.3 * SCALE, e_y + 1.4 * SCALE], fill=(26, 18, 26, 255))
        draw.point((e_lx, e_y - 0.4 * SCALE), fill=(255, 255, 255, 255))

        e_rx = tcx + 4 * SCALE
        safe_ellipse(draw, [e_rx - 1.8 * SCALE, e_y - 1.0 * SCALE, e_rx + 1.8 * SCALE, e_y + 1.4 * SCALE], fill=(250, 250, 255, 255), outline=(28, 22, 30, 255), width=int(0.8 * SCALE))
        safe_ellipse(draw, [e_rx - 1.3 * SCALE, e_y - 1.0 * SCALE, e_rx + 0.9 * SCALE, e_y + 1.4 * SCALE], fill=(26, 18, 26, 255))
        draw.point((e_rx, e_y - 0.4 * SCALE), fill=(255, 255, 255, 255))

        # Blush & Lips
        safe_ellipse(draw, [tcx - 6 * SCALE, head_top + 13.5 * SCALE, tcx - 2.5 * SCALE, head_top + 16.5 * SCALE], fill=(235, 150, 138, 140))
        safe_ellipse(draw, [tcx + 2.5 * SCALE, head_top + 13.5 * SCALE, tcx + 6 * SCALE, head_top + 16.5 * SCALE], fill=(235, 150, 138, 140))
        draw.line([(tcx, head_top + 12.8 * SCALE), (tcx, head_top + 15.2 * SCALE)], fill=(205, 145, 110, 255), width=int(1 * SCALE))
        draw.point((tcx + 0.6 * SCALE, head_top + 15.2 * SCALE), fill=(185, 125, 95, 255))
        safe_ellipse(draw, [tcx - 1.8 * SCALE, head_top + 17.5 * SCALE, tcx + 1.8 * SCALE, head_top + 19.0 * SCALE], fill=(205, 95, 90, 255))
        draw.point((tcx, head_top + 18 * SCALE), fill=(245, 140, 130, 255))

    elif is_side:
        # Proper 3/4 Side Profile
        # Back skull hair
        safe_ellipse(draw, [tcx - dir_x * 9 * SCALE, head_top, tcx + dir_x * 4 * SCALE, chin_y + 1 * SCALE], fill=(20, 16, 26, 255))
        # Front face skin
        draw.polygon([
            (tcx - dir_x * 2 * SCALE, head_top + 4 * SCALE),
            (tcx + dir_x * 7 * SCALE, head_top + 8 * SCALE),
            (tcx + dir_x * 8 * SCALE, head_top + 14 * SCALE),  # Nose
            (tcx + dir_x * 7 * SCALE, head_top + 18 * SCALE),  # Lips
            (tcx + dir_x * 6 * SCALE, chin_y),                # Chin
            (tcx - dir_x * 2 * SCALE, chin_y),
        ], fill=(238, 192, 160, 255))
        safe_ellipse(draw, [tcx + dir_x * 1 * SCALE, head_top + 8 * SCALE, tcx + dir_x * 7 * SCALE, chin_y - 1 * SCALE], fill=(248, 212, 185, 255))

        # Crown of hair on top
        draw.polygon([
            (tcx - dir_x * 9 * SCALE, head_top + 2 * SCALE),
            (tcx + dir_x * 5 * SCALE, head_top + 2 * SCALE),
            (tcx + dir_x * 6 * SCALE, head_top + 7 * SCALE),
            (tcx - dir_x * 2 * SCALE, head_top + 6 * SCALE),
            (tcx - dir_x * 9 * SCALE, head_top + 8 * SCALE),
        ], fill=(24, 20, 32, 255))
        safe_arc(draw, [tcx - dir_x * 7 * SCALE, head_top + 1 * SCALE, tcx + dir_x * 4 * SCALE, head_top + 6 * SCALE], 200, 340, fill=(72, 62, 88, 255), width=int(1.5 * SCALE))

        # Eye & Eyebrow in profile
        fx = tcx + int(dir_x * 5.2 * SCALE)
        e_y = head_top + 12.5 * SCALE
        safe_arc(draw, [fx - dir_x * 2.2 * SCALE, head_top + 9.5 * SCALE, fx + dir_x * 0.5 * SCALE, head_top + 11.8 * SCALE], 180, 360, fill=(45, 32, 38, 255), width=int(1.2 * SCALE))
        safe_ellipse(draw, [fx - dir_x * 1.8 * SCALE, e_y - 0.9 * SCALE, fx + dir_x * 0.5 * SCALE, e_y + 1.2 * SCALE], fill=(250, 250, 255, 255), outline=(28, 22, 30, 255))
        safe_ellipse(draw, [fx - dir_x * 1.2 * SCALE, e_y - 0.9 * SCALE, fx + dir_x * 0.2 * SCALE, e_y + 1.0 * SCALE], fill=(26, 18, 26, 255))
        draw.point((fx - dir_x * 0.5 * SCALE, e_y - 0.3 * SCALE), fill=(255, 255, 255, 255))

        # Cheek blush
        safe_ellipse(draw, [fx - dir_x * 1.5 * SCALE, head_top + 14 * SCALE, fx + dir_x * 1.5 * SCALE, head_top + 16.5 * SCALE], fill=(235, 150, 138, 140))
        # Lips
        safe_ellipse(draw, [tcx + dir_x * 6.2 * SCALE, head_top + 17.5 * SCALE, tcx + dir_x * 7.4 * SCALE, head_top + 18.8 * SCALE], fill=(205, 95, 90, 255))

    elif facing == "up":
        # Back of head
        face_w = 10 * SCALE
        safe_ellipse(draw, [tcx - face_w, head_top + 1 * SCALE, tcx + face_w, chin_y + 1 * SCALE], fill=(20, 16, 26, 255))
        safe_ellipse(draw, [tcx - 11 * SCALE, head_top, tcx + 11 * SCALE, chin_y + 2 * SCALE], fill=(20, 16, 26, 255))
        safe_arc(draw, [tcx - 7 * SCALE, head_top + 2 * SCALE, tcx + 7 * SCALE, head_top + 11 * SCALE], 190, 350, fill=(72, 62, 88, 255), width=int(1.8 * SCALE))

    # 7. Long Hair Braid & Le-ki-ma Flower
    if facing == "down":
        fl_x = tcx + 8 * SCALE
        fl_y = head_top + 5.5 * SCALE
        safe_ellipse(draw, [fl_x - 1.8 * SCALE, fl_y - 0.7 * SCALE, fl_x + 1.8 * SCALE, fl_y + 0.7 * SCALE], fill=(255, 248, 200, 255))
        safe_ellipse(draw, [fl_x - 0.7 * SCALE, fl_y - 1.8 * SCALE, fl_x + 0.7 * SCALE, fl_y + 1.8 * SCALE], fill=(255, 248, 200, 255))
        safe_ellipse(draw, [fl_x - 0.9 * SCALE, fl_y - 0.9 * SCALE, fl_x + 0.9 * SCALE, fl_y + 0.9 * SCALE], fill=(250, 210, 50, 255))
        draw.point((fl_x, fl_y), fill=(230, 95, 40, 255))

        bx = tcx + 7 * SCALE
        by_start = head_top + 9.5 * SCALE
        by_end = waist_y + 4.5 * SCALE
        for by in range(int(by_start), int(by_end), int(2.2 * SCALE)):
            wave = int(math.sin(by * 0.16) * 1.0 * SCALE)
            cur_bx = bx + wave
            safe_ellipse(draw, [cur_bx - 1.8 * SCALE, by, cur_bx + 1.8 * SCALE, by + 2.8 * SCALE], fill=(28, 22, 36, 255), outline=(16, 12, 22, 255), width=int(0.8 * SCALE))
            safe_arc(draw, [cur_bx - 1.0 * SCALE, by + 0.6 * SCALE, cur_bx + 1.0 * SCALE, by + 2.2 * SCALE], 200, 340, fill=(72, 62, 88, 255), width=int(0.9 * SCALE))
        safe_rect(draw, [bx - 1.2 * SCALE, by_end, bx + 1.2 * SCALE, by_end + 1.2 * SCALE], fill=(225, 60, 50, 255))
        draw.polygon([(bx - 0.8 * SCALE, by_end + 1.2 * SCALE), (bx + 0.8 * SCALE, by_end + 1.2 * SCALE), (bx, by_end + 2.8 * SCALE)], fill=(20, 16, 26, 255))

    elif facing == "right":
        # Right view: Flower at temple & Braid curving over front shoulder
        fl_x = tcx + 1 * SCALE
        fl_y = head_top + 7 * SCALE
        safe_ellipse(draw, [fl_x - 1.5 * SCALE, fl_y - 0.6 * SCALE, fl_x + 1.5 * SCALE, fl_y + 0.6 * SCALE], fill=(255, 248, 200, 255))
        safe_ellipse(draw, [fl_x - 0.6 * SCALE, fl_y - 1.5 * SCALE, fl_x + 0.6 * SCALE, fl_y + 1.5 * SCALE], fill=(255, 248, 200, 255))
        draw.point((fl_x, fl_y), fill=(230, 95, 40, 255))

        bx = tcx + 2 * SCALE
        by_start = head_top + 10.5 * SCALE
        by_end = waist_y + 4.5 * SCALE
        whip_x = -3 * SCALE if (action == "throw" and anim_phase == 1) else 0
        for by in range(int(by_start), int(by_end), int(2.2 * SCALE)):
            prog = (by - by_start) / (by_end - by_start)
            wave = int(math.sin(by * 0.16) * 0.8 * SCALE) + int(whip_x * prog)
            cur_bx = bx + wave
            safe_ellipse(draw, [cur_bx - 1.6 * SCALE, by, cur_bx + 1.6 * SCALE, by + 2.6 * SCALE], fill=(28, 22, 36, 255), outline=(16, 12, 22, 255))
        safe_rect(draw, [bx + whip_x - 1.0 * SCALE, by_end, bx + whip_x + 1.0 * SCALE, by_end + 1.0 * SCALE], fill=(225, 60, 50, 255))

    elif facing == "left":
        # Left view: Braid trails gracefully down behind neck/back
        bx = tcx + 3.5 * SCALE
        by_start = head_top + 10.5 * SCALE
        by_end = waist_y + 4.5 * SCALE
        for by in range(int(by_start), int(by_end), int(2.2 * SCALE)):
            wave = int(math.sin(by * 0.16) * 0.8 * SCALE)
            cur_bx = bx + wave
            safe_ellipse(draw, [cur_bx - 1.6 * SCALE, by, cur_bx + 1.6 * SCALE, by + 2.6 * SCALE], fill=(28, 22, 36, 255), outline=(16, 12, 22, 255))
        safe_rect(draw, [bx - 1.0 * SCALE, by_end, bx + 1.0 * SCALE, by_end + 1.0 * SCALE], fill=(225, 60, 50, 255))

    elif facing == "up":
        bx = tcx + 1.8 * SCALE
        by_start = chin_y - 2 * SCALE
        by_end = waist_y + 5.5 * SCALE
        for by in range(int(by_start), int(by_end), int(2.2 * SCALE)):
            wave = int(math.sin(by * 0.16) * 1.0 * SCALE)
            cur_bx = bx + wave
            safe_ellipse(draw, [cur_bx - 1.8 * SCALE, by, cur_bx + 1.8 * SCALE, by + 2.8 * SCALE], fill=(28, 22, 36, 255), outline=(16, 12, 22, 255))
        safe_rect(draw, [bx - 1.2 * SCALE, by_end, bx + 1.2 * SCALE, by_end + 1.2 * SCALE], fill=(225, 60, 50, 255))

    frame_80x96 = img.resize((CELL_W, CELL_H), Image.Resampling.LANCZOS)
    return frame_80x96

def build_full_sheet():
    sheet = Image.new("RGBA", (TOTAL_W, TOTAL_H), (0, 0, 0, 0))

    # Row 0: Walk Down (4 frames)
    print("Rendering Row 0: Walk Down...")
    for col in range(4):
        f = render_frame_hd(facing="down", anim_phase=col, action="walk")
        sheet.paste(f, (col * CELL_W, 0 * CELL_H), f)

    # Row 1: Walk Left (4 frames)
    print("Rendering Row 1: Walk Left...")
    for col in range(4):
        f = render_frame_hd(facing="left", anim_phase=col, action="walk")
        sheet.paste(f, (col * CELL_W, 1 * CELL_H), f)

    # Row 2: Walk Right (4 frames)
    print("Rendering Row 2: Walk Right...")
    for col in range(4):
        f = render_frame_hd(facing="right", anim_phase=col, action="walk")
        sheet.paste(f, (col * CELL_W, 2 * CELL_H), f)

    # Row 3: Walk Up (4 frames)
    print("Rendering Row 3: Walk Up...")
    for col in range(4):
        f = render_frame_hd(facing="up", anim_phase=col, action="walk")
        sheet.paste(f, (col * CELL_W, 3 * CELL_H), f)

    # Row 4: Sneak (4 frames, leaning right)
    print("Rendering Row 4: Sneak...")
    for col in range(4):
        f = render_frame_hd(facing="right", anim_phase=col, action="sneak")
        sheet.paste(f, (col * CELL_W, 4 * CELL_H), f)

    # Row 5: Throw Grenade (3 frames, facing right)
    print("Rendering Row 5: Throw Grenade...")
    for col in range(3):
        f = render_frame_hd(facing="right", anim_phase=col, action="throw")
        sheet.paste(f, (col * CELL_W, 5 * CELL_H), f)

    # Row 6: Interact / Cut Rope (3 frames, facing right)
    print("Rendering Row 6: Interact / Cut Rope...")
    for col in range(3):
        f = render_frame_hd(facing="right", anim_phase=col, action="interact")
        sheet.paste(f, (col * CELL_W, 6 * CELL_H), f)

    # Row 7: Hide / Crouch (2 frames)
    print("Rendering Row 7: Hide / Crouch...")
    for col in range(2):
        f = render_frame_hd(facing="right", anim_phase=col, action="hide")
        sheet.paste(f, (col * CELL_W, 7 * CELL_H), f)

    out_file = Path("public/assets/vothisau/sprites/sau.png")
    sheet.save(out_file, "PNG", optimize=True)
    print(f"Successfully generated full sprite sheet {out_file}: {sheet.size} ({out_file.stat().st_size} bytes)")

    preview_path = Path("public/assets/vothisau/sprites/preview_sau_sheet.png")
    preview = sheet.resize((TOTAL_W * 2, TOTAL_H * 2), Image.Resampling.NEAREST)
    preview.save(preview_path, "PNG")
    print(f"Saved review sheet to {preview_path}")

if __name__ == "__main__":
    build_full_sheet()
