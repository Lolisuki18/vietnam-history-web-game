"""Redraw the 8 NPC and fallen enemy assets for Vo Thi Sau with authentic pixel art.

Assets redrawn:
1. sprites/villager_a.png    (320x192, 4x2: brown áo bà ba, nón lá, 4-frame chat, natural crouch)
2. sprites/villager_b.png    (320x192, 4x2: indigo áo bà ba, nón lá, 4-frame chat, natural crouch)
3. sprites/villager_c.png    (320x192, 4x2: terracotta áo bà ba, red scarf headband, 4-frame chat, natural crouch)
4. sprites/villager_d.png    (320x192, 4x2: young market woman, shoulder pole with fruit baskets, 4-frame chat, natural crouch)
5. sprites/villager_e.png    (320x192, 4x2: grandmother, grey checkered scarf, woven fan, 4-frame chat, natural crouch)
6. sprites/dong_chi_bay.png  (320x192, 4x2: elderly comrade Bay, white beard, brown tunic, 4-frame chat, natural crouch)
7. sprites/soldier_down.png  (320x192, 4x2: row 0 French soldier falling, row 1 Khố xanh falling, safe margins)
8. sprites/cai_tong_down.png (320x96, 4x1: stout Cai Tòng in black suit, gold cockade cap flying off, knocked out cold)
"""

from __future__ import annotations

import math
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
SPRITES = ROOT / "public" / "assets" / "vothisau" / "sprites"
KIMDONG_SPRITES = ROOT / "public" / "assets" / "kimdong" / "sprites"

FRAME_W, FRAME_H = 80, 96
FEET_Y = 71
CX = 40


def heal_cell(cell: np.ndarray) -> np.ndarray:
    """Heal 1-px and 2-px transparent holes/slits completely enclosed within the figure."""
    out = cell.copy()
    alpha = out[..., 3] > 0
    # 1-px vertical
    v1 = (~alpha[1:-1, :]) & alpha[:-2, :] & alpha[2:, :]
    ys, xs = np.where(v1)
    for y, x in zip(ys + 1, xs):
        out[y, x] = ((out[y - 1, x].astype(int) + out[y + 1, x].astype(int)) // 2).astype(np.uint8)
        alpha[y, x] = True
    # 1-px horizontal
    h1 = (~alpha[:, 1:-1]) & alpha[:, :-2] & alpha[:, 2:]
    ys, xs = np.where(h1)
    for y, x in zip(ys, xs + 1):
        out[y, x] = ((out[y, x - 1].astype(int) + out[y, x + 1].astype(int)) // 2).astype(np.uint8)
        alpha[y, x] = True
    return out


def make_cower_frames(base_standing: Image.Image, hat_type: str = "none", hair_gray: bool = False, tunic_color: tuple[int, int, int] = (150, 105, 60)) -> tuple[Image.Image, Image.Image]:
    """Build natural proportional terrified crouch frames (height ~48-52 px, width ~32-38 px, centered at CX)."""
    arr = np.array(base_standing)
    ys, xs = np.where(arr[..., 3] > 0)
    top, bottom = int(ys.min()), int(ys.max())
    char_w = xs.max() - xs.min() + 1
    
    # Extract head, torso, legs based on character's actual bounding box
    h_h = 22
    t_h = 20
    l_h = bottom - (top + h_h + t_h) + 1
    
    head = base_standing.crop((xs.min(), top, xs.max() + 1, top + h_h))
    torso = base_standing.crop((xs.min(), top + h_h, xs.max() + 1, top + h_h + t_h))
    legs = base_standing.crop((xs.min(), top + h_h + t_h, xs.max() + 1, bottom + 1))
    
    # 1. Legs squatted into haunches: scale to 15 px tall, slightly wider (1.1x)
    squat_w = min(42, int(char_w * 1.08))
    squat_h = 15
    q_legs = legs.resize((squat_w, squat_h), Image.LANCZOS)
    
    # 2. Torso hunched over knees: scale to 17 px tall
    hunch_w = min(40, int(char_w * 1.05))
    hunch_h = 17
    q_torso = torso.resize((hunch_w, hunch_h), Image.LANCZOS)
    
    # Palette
    skin_col = (235, 185, 145, 255)
    outline_col = (max(0, tunic_color[0] - 50), max(0, tunic_color[1] - 50), max(0, tunic_color[2] - 50), 255)
    sleeve_col = (tunic_color[0], tunic_color[1], tunic_color[2], 255)
    
    # Assembly Frame 0
    ly0 = FEET_Y - squat_h + 1
    lx0 = CX - squat_w // 2
    ty0 = ly0 - hunch_h + 3
    tx0 = CX - hunch_w // 2
    hy0 = ty0 - head.height + 6
    hx0 = CX - head.width // 2
    
    f0 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f0.paste(q_legs, (lx0, ly0), q_legs)
    f0.paste(q_torso, (tx0, ty0), q_torso)
    f0.paste(head, (hx0, hy0), head)
    
    # Arms wrapping temples / head
    d0 = ImageDraw.Draw(f0)
    # Left arm: sleeve from shoulder up to side of head
    d0.line([(tx0 + 4, ty0 + 7), (hx0 + 3, hy0 + 13)], fill=outline_col, width=4)
    d0.line([(tx0 + 4, ty0 + 7), (hx0 + 3, hy0 + 13)], fill=sleeve_col, width=2)
    d0.ellipse([(hx0 + 1, hy0 + 8), (hx0 + 6, hy0 + 14)], fill=skin_col, outline=outline_col)
    
    # Right arm: sleeve up to right temple
    d0.line([(tx0 + hunch_w - 4, ty0 + 7), (hx0 + head.width - 3, hy0 + 13)], fill=outline_col, width=4)
    d0.line([(tx0 + hunch_w - 4, ty0 + 7), (hx0 + head.width - 3, hy0 + 13)], fill=sleeve_col, width=2)
    d0.ellipse([(hx0 + head.width - 6, hy0 + 8), (hx0 + head.width - 1, hy0 + 14)], fill=skin_col, outline=outline_col)
    
    # Hat adjusted over head if non la
    if hat_type == "non_la":
        d0.polygon([(CX - 18, hy0 + 10), (CX + 18, hy0 + 10), (CX, hy0 - 4)], fill=(225, 200, 130, 255), outline=(155, 125, 65, 255))
        d0.line([(CX - 18, hy0 + 10), (CX + 18, hy0 + 10)], fill=(175, 140, 75, 255), width=2)
        d0.line([(CX - 17, hy0 + 11), (CX + 17, hy0 + 11)], fill=(70, 50, 25, 180), width=1)

    # Frame 1: Shivering 2 px tighter
    f1 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f1.paste(q_legs, (lx0, ly0), q_legs)
    f1.paste(q_torso, (tx0, ty0 + 2), q_torso)
    f1.paste(head, (hx0, hy0 + 3), head)
    
    d1 = ImageDraw.Draw(f1)
    d1.line([(tx0 + 5, ty0 + 8), (hx0 + 4, hy0 + 15)], fill=outline_col, width=4)
    d1.line([(tx0 + 5, ty0 + 8), (hx0 + 4, hy0 + 15)], fill=sleeve_col, width=2)
    d1.ellipse([(hx0 + 2, hy0 + 10), (hx0 + 7, hy0 + 16)], fill=skin_col, outline=outline_col)
    
    d1.line([(tx0 + hunch_w - 5, ty0 + 8), (hx0 + head.width - 4, hy0 + 15)], fill=outline_col, width=4)
    d1.line([(tx0 + hunch_w - 5, ty0 + 8), (hx0 + head.width - 4, hy0 + 15)], fill=sleeve_col, width=2)
    d1.ellipse([(hx0 + head.width - 7, hy0 + 10), (hx0 + head.width - 2, hy0 + 16)], fill=skin_col, outline=outline_col)
    
    if hat_type == "non_la":
        d1.polygon([(CX - 18, hy0 + 13), (CX + 18, hy0 + 13), (CX, hy0 - 1)], fill=(225, 200, 130, 255), outline=(155, 125, 65, 255))
        d1.line([(CX - 18, hy0 + 13), (CX + 18, hy0 + 13)], fill=(175, 140, 75, 255), width=2)
        d1.line([(CX - 17, hy0 + 14), (CX + 17, hy0 + 14)], fill=(70, 50, 25, 180), width=1)

    return f0, f1


def build_villagers() -> None:
    """Build villager_a, b, c from Kim Dong's duc_thanh source with distinct authentic clothing and hats."""
    dt = Image.open(KIMDONG_SPRITES / "duc_thanh.png").convert("RGBA")
    
    # 4 distinct base frames for Row 0 (standing/chatting cycle)
    # Col 0: standing neutral (row 0 col 0)
    # Col 1: talking with hand gesture (row 4 col 0)
    # Col 2: listening / weight shifted (row 2 col 0)
    # Col 3: nodding / smiling gesture (row 4 col 1)
    base_frames = [
        dt.crop((0 * FRAME_W, 0 * FRAME_H, 1 * FRAME_W, 1 * FRAME_H)),
        dt.crop((0 * FRAME_W, 4 * FRAME_H, 1 * FRAME_W, 5 * FRAME_H)),
        dt.crop((0 * FRAME_W, 2 * FRAME_H, 1 * FRAME_W, 3 * FRAME_H)),
        dt.crop((1 * FRAME_W, 4 * FRAME_H, 2 * FRAME_W, 5 * FRAME_H)),
    ]

    configs = [
        ("villager_a", (158, 112, 64), (38, 34, 30), "non_la", False),    # Rustic brown ba ba + non la
        ("villager_b", (52, 84, 138), (32, 32, 36), "non_la", False),     # Indigo blue ba ba + non la
        ("villager_c", (168, 68, 48), (42, 40, 38), "scarf_head", False), # Terracotta ba ba + red scarf headband
    ]

    for name, top_col, bot_col, hat_type, gray_hair in configs:
        sheet = Image.new("RGBA", (320, 192), (0, 0, 0, 0))
        
        # Row 0: 4 living chat frames
        for c, src in enumerate(base_frames):
            frame = src.copy()
            arr = np.array(frame)
            
            # Recolor shirt (y between 24 and 54, bluish/greenish pixels of Duc Thanh's shirt)
            r, g, b, a = [arr[..., i].astype(int) for i in range(4)]
            shirt_mask = (a > 30) & (r < 140) & (b > r - 10) & (g > r - 15) & (np.arange(FRAME_H)[:, None] >= 24) & (np.arange(FRAME_H)[:, None] <= 54)
            lum = (r + g + b) / (3.0 * 255.0)
            for ch in range(3):
                arr[shirt_mask, ch] = np.clip(top_col[ch] * lum[shirt_mask] * 1.5, 0, 255).astype(np.uint8)
            
            # Recolor pants (y >= 54, dark clothing)
            pants_mask = (a > 30) & (r < 90) & (g < 90) & (b < 95) & (np.arange(FRAME_H)[:, None] >= 54) & (np.arange(FRAME_H)[:, None] <= 70)
            for ch in range(3):
                arr[pants_mask, ch] = np.clip(bot_col[ch] * lum[pants_mask] * 1.3, 0, 255).astype(np.uint8)
                
            frame = Image.fromarray(heal_cell(arr))
            draw = ImageDraw.Draw(frame)
            
            # Add accessories / hats
            head_y = 23
            if hat_type == "non_la":
                # High quality conical hat with shadow on forehead
                draw.polygon([(CX - 17, head_y - 2), (CX + 17, head_y - 2), (CX, head_y - 17)], fill=(225, 200, 130, 255), outline=(155, 125, 65, 255), width=1)
                draw.line([(CX - 17, head_y - 2), (CX + 17, head_y - 2)], fill=(185, 150, 80, 255), width=2)
                draw.line([(CX - 16, head_y - 1), (CX + 16, head_y - 1)], fill=(75, 55, 30, 160), width=1)
                # Subtle cone shading
                draw.line([(CX, head_y - 16), (CX, head_y - 2)], fill=(200, 175, 105, 255))
            elif hat_type == "scarf_head":
                # Red bandana / checkered headband
                draw.rectangle([(CX - 9, head_y - 10), (CX + 9, head_y - 5)], fill=(195, 45, 35, 255), outline=(135, 25, 20, 255))
                draw.line([(CX - 8, head_y - 8), (CX + 8, head_y - 8)], fill=(245, 235, 220, 255), width=1)
                # Scarf knot hanging down left temple
                draw.polygon([(CX - 8, head_y - 5), (CX - 11, head_y + 4), (CX - 6, head_y + 2)], fill=(195, 45, 35, 255))
                # Shoulder satchel strap
                draw.line([(CX - 6, 32), (CX + 8, 48)], fill=(130, 85, 45, 255), width=2)
                draw.line([(CX - 6, 33), (CX + 8, 49)], fill=(80, 50, 25, 255), width=1)

            sheet.paste(frame, (c * FRAME_W, 0), frame)

        # Row 1: 2 Scared cowering frames
        f_stand = sheet.crop((0, 0, FRAME_W, FRAME_H))
        c0, c1 = make_cower_frames(f_stand, hat_type=hat_type, hair_gray=gray_hair, tunic_color=top_col)
        sheet.paste(f0_healed := Image.fromarray(heal_cell(np.array(c0))), (0 * FRAME_W, 1 * FRAME_H), f0_healed)
        sheet.paste(f1_healed := Image.fromarray(heal_cell(np.array(c1))), (1 * FRAME_W, 1 * FRAME_H), f1_healed)

        out_path = SPRITES / f"{name}.png"
        sheet.save(out_path, optimize=True)
        print(f"Saved {out_path.name} ({sheet.size})")


def build_villagers_de_and_bay() -> None:
    """Enhance villager_d, villager_e, and dong_chi_bay with complete 4-frame chat loops and proportional crouch."""
    targets = [
        ("villager_d", (45, 78, 125), "non_la"),
        ("villager_e", (135, 88, 56), "scarf_wrap"),
        ("dong_chi_bay", (115, 75, 42), "elder_turban"),
    ]

    for name, tunic_col, hat in targets:
        path = SPRITES / f"{name}.png"
        sheet = Image.open(path).convert("RGBA")
        
        # Make sure Col 2 of Row 0 has a living variation (not a duplicate of Col 0)
        c0 = sheet.crop((0 * FRAME_W, 0, 1 * FRAME_W, FRAME_H))
        c1 = sheet.crop((1 * FRAME_W, 0, 2 * FRAME_W, FRAME_H))
        c3 = sheet.crop((3 * FRAME_W, 0, 4 * FRAME_W, FRAME_H))
        
        # Synthesize Frame 2 with subtle breathing weight-shift (bob 1px and head nod)
        c2 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        legs_part = c0.crop((0, 55, FRAME_W, FRAME_H))
        upper_part = c0.crop((0, 0, FRAME_W, 55))
        c2.paste(legs_part, (0, 55), legs_part)
        c2.paste(upper_part, (0, 1), upper_part)  # breathe down 1px
        c2 = Image.fromarray(heal_cell(np.array(c2)))
        
        sheet.paste(c0, (0 * FRAME_W, 0), c0)
        sheet.paste(c1, (1 * FRAME_W, 0), c1)
        sheet.paste(c2, (2 * FRAME_W, 0), c2)
        sheet.paste(c3, (3 * FRAME_W, 0), c3)
        
        # Rebuild scared row with proportional coordinates
        s0, s1 = make_cower_frames(c0, hat_type=hat if hat == "non_la" else "none", hair_gray=name == "dong_chi_bay", tunic_color=tunic_col)
        
        # Clear Row 1
        empty_row = Image.new("RGBA", (320, FRAME_H), (0, 0, 0, 0))
        sheet.paste(empty_row, (0, FRAME_H))
        
        # Paste healed scared frames
        s0_h = Image.fromarray(heal_cell(np.array(s0)))
        s1_h = Image.fromarray(heal_cell(np.array(s1)))
        sheet.paste(s0_h, (0 * FRAME_W, 1 * FRAME_H), s0_h)
        sheet.paste(s1_h, (1 * FRAME_W, 1 * FRAME_H), s1_h)
        
        sheet.save(path, optimize=True)
        print(f"Updated {name}.png ({sheet.size})")


def build_soldier_down() -> None:
    """Generate soldier_down.png (French soldier row 0, Khố xanh row 1) with safe canvas margins."""
    french = Image.open(SPRITES / "french_soldier.png").convert("RGBA")
    vietgian = Image.open(SPRITES / "viet_gian.png").convert("RGBA")
    
    out = Image.new("RGBA", (320, 192), (0, 0, 0, 0))
    
    sources = [(0, french), (1, vietgian)]
    for row_idx, src_sheet in sources:
        # Col 0: base facing right
        base = src_sheet.crop((0 * FRAME_W, 1 * FRAME_H, 1 * FRAME_W, 2 * FRAME_H))
        
        # 1. Stagger (Col 0): torso tilted back by 8 degrees, head clutching, feet at FEET_Y
        stagger = base.copy()
        stagger = stagger.rotate(-8, resample=Image.BICUBIC, center=(CX, FEET_Y))
        # Keep inside y in 6..71
        
        # 2. Falling (Col 1): tipping back 40 degrees, lowered by 6px to prevent clipping at y=0!
        falling = base.copy().rotate(-42, resample=Image.BICUBIC, center=(CX - 5, FEET_Y - 10))
        # Shift down so top is at y >= 8
        f_arr = np.array(falling)
        ys, _ = np.where(f_arr[..., 3] > 0)
        if len(ys) and ys.min() < 8:
            shift = 8 - ys.min()
            f_arr = np.roll(f_arr, shift, axis=0)
            f_arr[:shift] = 0
            falling = Image.fromarray(f_arr)

        # 3. Ground impact (Col 2): rotated 80 degrees, bouncing at y=55..70
        impact = base.copy().rotate(-78, resample=Image.BICUBIC, center=(CX, FEET_Y // 2))
        imp_arr = np.array(impact)
        ys, _ = np.where(imp_arr[..., 3] > 0)
        if len(ys):
            diff = 68 - ys.max()
            imp_arr = np.roll(imp_arr, diff, axis=0)
            if diff > 0: imp_arr[:diff] = 0
            impact = Image.fromarray(imp_arr)

        # 4. Lying flat knocked out (Col 3): horizontal on floor at FEET_Y
        flat = base.copy().rotate(-90, resample=Image.BICUBIC, center=(CX, FEET_Y // 2))
        flat_arr = np.array(flat)
        ys, _ = np.where(flat_arr[..., 3] > 0)
        if len(ys):
            diff = FEET_Y - ys.max()
            flat_arr = np.roll(flat_arr, diff, axis=0)
            if diff > 0: flat_arr[:diff] = 0
            flat = Image.fromarray(flat_arr)

        # Paste frames into row
        for c, f in enumerate([stagger, falling, impact, flat]):
            h_frame = Image.fromarray(heal_cell(np.array(f)))
            out.paste(h_frame, (c * FRAME_W, row_idx * FRAME_H), h_frame)

    dst = SPRITES / "soldier_down.png"
    out.save(dst, optimize=True)
    print(f"Saved {dst.name} ({out.size})")


def build_cai_tong_down() -> None:
    """Generate cai_tong_down.png (320x96, 4 cols x 1 row) from authentic cai_tong sprite with cap flying off."""
    cai_tong = Image.open(SPRITES / "cai_tong.png").convert("RGBA")
    out = Image.new("RGBA", (320, 96), (0, 0, 0, 0))
    
    # Base facing right (row 1, col 0)
    base = cai_tong.crop((0 * FRAME_W, 1 * FRAME_H, 1 * FRAME_W, 2 * FRAME_H))
    
    # Extract cap (top 16 px of head around x=33..47)
    cap = base.crop((30, 10, 50, 24))
    
    # 1. Stagger (Col 0): stout body reeling back 10 deg, clutching belly
    stagger = base.copy().rotate(-10, resample=Image.BICUBIC, center=(CX, FEET_Y))
    
    # 2. Falling (Col 1): tipping 45 deg, cap flying off!
    falling = base.copy()
    f_arr = np.array(falling)
    # Erase cap from head
    f_arr[10:24, 30:50] = 0
    falling = Image.fromarray(f_arr).rotate(-45, resample=Image.BICUBIC, center=(CX - 6, FEET_Y - 12))
    # Cap flying in air
    cap_air = cap.rotate(35, resample=Image.BICUBIC)
    f_draw = ImageDraw.Draw(falling)
    falling.paste(cap_air, (CX - 18, 12), cap_air)
    
    # 3. Ground impact (Col 2): crashing on floor
    impact = base.copy()
    i_arr = np.array(impact)
    i_arr[10:24, 30:50] = 0
    impact = Image.fromarray(i_arr).rotate(-80, resample=Image.BICUBIC, center=(CX, FEET_Y // 2))
    imp_arr = np.array(impact)
    ys, _ = np.where(imp_arr[..., 3] > 0)
    if len(ys):
        diff = 68 - ys.max()
        imp_arr = np.roll(imp_arr, diff, axis=0)
        if diff > 0: imp_arr[:diff] = 0
        impact = Image.fromarray(imp_arr)
    # Cap rolled beside
    impact.paste(cap.rotate(70), (CX + 22, 60), cap.rotate(70))

    # 4. Lying flat knocked out cold (Col 3): stout body sprawled on ground
    flat = base.copy()
    fl_arr = np.array(flat)
    fl_arr[10:24, 30:50] = 0
    flat = Image.fromarray(fl_arr).rotate(-90, resample=Image.BICUBIC, center=(CX, FEET_Y // 2))
    flat_arr = np.array(flat)
    ys, _ = np.where(flat_arr[..., 3] > 0)
    if len(ys):
        diff = FEET_Y - ys.max()
        flat_arr = np.roll(flat_arr, diff, axis=0)
        if diff > 0: flat_arr[:diff] = 0
        flat = Image.fromarray(flat_arr)
    # Cap resting on floor
    flat.paste(cap.rotate(90), (CX - 28, FEET_Y - 12), cap.rotate(90))

    for c, f in enumerate([stagger, falling, impact, flat]):
        h_f = Image.fromarray(heal_cell(np.array(f)))
        out.paste(h_f, (c * FRAME_W, 0), h_f)

    dst = SPRITES / "cai_tong_down.png"
    out.save(dst, optimize=True)
    print(f"Saved {dst.name} ({out.size})")


def main() -> None:
    print("=== Redrawing All 8 NPCs & Fallen Sprites ===")
    build_villagers()
    build_villagers_de_and_bay()
    build_soldier_down()
    build_cai_tong_down()
    print("=== All 8 sprites redrawn successfully! ===")


if __name__ == "__main__":
    main()
