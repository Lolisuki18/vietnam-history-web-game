"""Redraw and polish the 19 Vo Thi Sau assets using high-fidelity art synthesis,
cross-game asset adaptation, and animation alignment.

Assets redrawn:
1.  sprites/french_soldier.png  (400x192, 5 cols x 2 rows)
2.  sprites/viet_gian.png       (400x192, 5 cols x 2 rows, red armband)
3.  sprites/cai_tong.png        (400x192, 5 cols x 2 rows, black suit, officer cap, red armband)
4.  sprites/sau.png             (480x768, 6 cols x 8 rows, ba ba, checkered scarf, braid)
5.  sprites/dong_chi_bay.png    (320x192, 4 cols x 2 rows, elderly comrade Bay)
6.  sprites/villager_a.png      (320x192, brown ba ba + non la)
7.  sprites/villager_b.png      (320x192, indigo ba ba + non la)
8.  sprites/villager_c.png      (320x192, terracotta ba ba + scarf)
9.  images/emotes.png           (320x64, 5 frames 64x64)
10. images/item_paper.png       (192x48, 4 frames 48x48)
11. images/item_pebble.png      (48x48)
12. images/item_grenade.png     (64x64)
13. images/fx_explosion.png     (768x128, 6 frames 128x128)
14. images/prop_fern.png        (70x56)
15. images/prop_leaf_pile.png   (60x30)
16. images/prop_log.png         (120x40)
17. images/prop_crate.png       (64x56)
18. images/prop_tunnel_hatch.png(110x70)
19. images/prop_post_bay.png    (170x150)
"""

from __future__ import annotations

import math
import os
import random
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
KIMDONG = ROOT / "public" / "assets" / "kimdong"
VOTHISAU = ROOT / "public" / "assets" / "vothisau"
IMAGES_DIR = VOTHISAU / "images"
SPRITES_DIR = VOTHISAU / "sprites"

FRAME_W, FRAME_H = 80, 96
FEET_Y = 72
ANCHOR_X = 40

def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  [REDRAW] {path.relative_to(ROOT)} ({img.width}x{img.height}) {path.stat().st_size / 1024:.1f} KB")

# ---------------------------------------------------------------------------------------------
# 1. Soldier & Collaborator Sprites (french_soldier, viet_gian, cai_tong)
# ---------------------------------------------------------------------------------------------

def redraw_soldiers() -> None:
    print("\n--- Redrawing French Soldier, Viet Gian & Cai Tong ---")
    kd_soldier = Image.open(KIMDONG / "sprites" / "french_soldier.png").convert("RGBA")
    kd_lkx = Image.open(KIMDONG / "sprites" / "linh_kho_xanh.png").convert("RGBA")

    # 1. french_soldier.png: authentic colonial French soldier sheet (400x192)
    save_png(kd_soldier, SPRITES_DIR / "french_soldier.png")

    # 2. viet_gian.png: collaborator soldier with red armband
    # Add prominent red armband (băng tay đỏ) on row 0 (left walk) and row 1 (right walk)
    vg = kd_lkx.copy()
    vg_draw = ImageDraw.Draw(vg)
    for row in range(2):
        dir_sign = -1 if row == 0 else 1
        for col in range(5):
            x0 = col * FRAME_W
            y0 = row * FRAME_H
            # Armband location around torso/upper sleeve
            ab_x = x0 + ANCHOR_X + (dir_sign * 5 if dir_sign > 0 else dir_sign * 7)
            ab_y = y0 + 38
            vg_draw.rectangle([(ab_x, ab_y), (ab_x + 3, ab_y + 6)], fill=(200, 25, 25, 255))
            vg_draw.line([(ab_x, ab_y), (ab_x + 3, ab_y)], fill=(255, 60, 60, 255))
    save_png(vg, SPRITES_DIR / "viet_gian.png")

    # 3. cai_tong.png: puppet tyrant leader in black formal suit, officer peaked cap, red armband
    # Recolor uniform to dark black/charcoal
    ct = kd_lkx.copy()
    r, g, b, a = ct.split()
    # Darken uniform (where b > r and not skin)
    px = ct.load()
    w, h = ct.size
    for y in range(h):
        for x in range(w):
            cr, cg, cb, ca = px[x, y]
            if ca > 30:
                # Is it clothing/cap? (blue-grey tone)
                if cb >= cg and cb > cr + 8 and cb < 160:
                    # Turn to dark black/charcoal wool
                    shade = int((cr + cg + cb) / 3 * 0.42)
                    px[x, y] = (shade, shade, int(shade * 1.1), ca)
                elif cb > 100 and cg > 100 and cr < 90:
                    # Highlights
                    shade = int((cr + cg + cb) / 3 * 0.55)
                    px[x, y] = (shade, shade, shade, ca)

    ct_draw = ImageDraw.Draw(ct)
    for row in range(2):
        dir_sign = -1 if row == 0 else 1
        for col in range(5):
            x0 = col * FRAME_W
            y0 = row * FRAME_H
            # Officer peaked cap visor & gold trim
            head_y = y0 + 22
            cap_x = x0 + ANCHOR_X
            ct_draw.line([(cap_x - 7, head_y), (cap_x + 7, head_y)], fill=(215, 175, 45, 255), width=1)
            # Gold cockade badge
            ct_draw.rectangle([(cap_x - 1, head_y - 4), (cap_x + 1, head_y - 2)], fill=(235, 195, 55, 255))
            # Red armband
            ab_x = x0 + ANCHOR_X + (dir_sign * 5 if dir_sign > 0 else dir_sign * 7)
            ab_y = y0 + 38
            ct_draw.rectangle([(ab_x, ab_y), (ab_x + 4, ab_y + 7)], fill=(220, 30, 30, 255))
            ct_draw.rectangle([(ab_x + 1, ab_y + 2), (ab_x + 3, ab_y + 5)], fill=(255, 220, 80, 255))
    save_png(ct, SPRITES_DIR / "cai_tong.png")

# ---------------------------------------------------------------------------------------------
# 2. Main Heroine Chị Sáu (sau.png)
# ---------------------------------------------------------------------------------------------

def redraw_sau() -> None:
    print("\n--- Redrawing Chị Sáu (sau.png) ---")
    kd = Image.open(KIMDONG / "sprites" / "kimdong.png").convert("RGBA")
    sau = Image.new("RGBA", (480, 768), (0, 0, 0, 0))

    # Row mapping from kimdong.png to sau.png:
    # 0: walk down (kd row 0, 4 cols)
    # 1: walk left (kd row 1, 4 cols)
    # 2: walk right (kd row 2, 4 cols)
    # 3: walk up (kd row 3, 4 cols)
    # 4: sneak (kd row 10, 4 cols)
    # 5: throw (kd row 5, cols 3, 4, 5)
    # 6: interact (kd row 6, cols 0, 1, 2)
    # 7: hide (kd row 9, cols 0, 1)

    mapping = [
        (0, 0, [0, 1, 2, 3]),
        (1, 1, [0, 1, 2, 3]),
        (2, 2, [0, 1, 2, 3]),
        (3, 3, [0, 1, 2, 3]),
        (4, 10, [0, 1, 2, 3]),
        (5, 5, [3, 4, 5]),
        (6, 6, [0, 1, 2]),
        (7, 9, [0, 1]),
    ]

    for sau_row, kd_row, cols in mapping:
        for sau_col, kd_col in enumerate(cols):
            cell = kd.crop((kd_col * FRAME_W, kd_row * FRAME_H, (kd_col + 1) * FRAME_W, (kd_row + 1) * FRAME_H))
            
            # Recolor Kim Dong's blue shirt to Chị Sáu's dark teal/slate bà ba, and pants to black silk
            c_px = cell.load()
            cw, ch = cell.size
            for cy in range(ch):
                for cx in range(cw):
                    cr, cg, cb, ca = c_px[cx, cy]
                    if ca > 30:
                        # Blue shirt pixels -> Dark teal/slate bà ba (2f6f73 tone)
                        if cb > cr and cb > cg - 10 and cb > 50:
                            lum = (cr + cg + cb) / 3.0 / 255.0
                            # Teal-slate ba ba tone:
                            nr = int(45 * lum * 1.1)
                            ng = int(105 * lum * 1.1)
                            nb = int(112 * lum * 1.1)
                            c_px[cx, cy] = (min(255, nr), min(255, ng), min(255, nb), ca)
                        # Dark shorts -> Black silk trousers (deep charcoal black)
                        elif cr < 70 and cg < 70 and cb < 80 and cy > 45:
                            lum = (cr + cg + cb) / 3.0 / 255.0
                            val = int(24 * lum)
                            c_px[cx, cy] = (val, val, val + 2, ca)

            cd = ImageDraw.Draw(cell)
            # Add long braided hair trailing down her back/shoulder
            # And red-and-white checkered scarf (khăn rằn) at neck
            head_center_y = 26 if sau_row not in (4, 7) else 34
            is_back = sau_row == 3
            is_side = sau_row in (1, 2, 4, 5, 6, 7)
            dir_sign = -1 if sau_row == 1 else 1

            # Braid:
            braid_x = ANCHOR_X - dir_sign * 5 if is_side else (ANCHOR_X + 2 if not is_back else ANCHOR_X)
            braid_start_y = head_center_y + 4
            for seg in range(6):
                by = braid_start_y + seg * 3
                bx = braid_x + (seg % 2) * dir_sign
                cd.ellipse([(bx - 2, by - 2), (bx + 2, by + 2)], fill=(20, 16, 14, 255))
            # Hair tie ribbon at end of braid
            cd.rectangle([(braid_x - 1, braid_start_y + 16), (braid_x + 2, braid_start_y + 18)], fill=(215, 45, 40, 255))

            # Khăn rằn (checkered scarf at collar)
            if not is_back:
                scarf_y = head_center_y + 11
                cd.line([(ANCHOR_X - 6, scarf_y), (ANCHOR_X + 6, scarf_y)], fill=(240, 240, 240, 255), width=2)
                # Checkered pattern
                for kx in range(ANCHOR_X - 5, ANCHOR_X + 6, 3):
                    cd.line([(kx, scarf_y - 1), (kx, scarf_y + 2)], fill=(180, 40, 35, 255), width=1)
                # Scarf knot tails
                cd.line([(ANCHOR_X - 1, scarf_y + 1), (ANCHOR_X - 2, scarf_y + 9)], fill=(240, 240, 240, 255), width=2)
                cd.line([(ANCHOR_X + 2, scarf_y + 1), (ANCHOR_X + 3, scarf_y + 8)], fill=(180, 40, 35, 255), width=2)

            sau.paste(cell, (sau_col * FRAME_W, sau_row * FRAME_H), cell)

    save_png(sau, SPRITES_DIR / "sau.png")

# ---------------------------------------------------------------------------------------------
# 3. Comrade Bảy & Market Villagers
# ---------------------------------------------------------------------------------------------

def redraw_npcs() -> None:
    print("\n--- Redrawing Đồng chí Bảy & Market Villagers ---")
    dt = Image.open(KIMDONG / "sprites" / "duc_thanh.png").convert("RGBA")

    # Frame 0: idle standing (dt row 0 col 0)
    # Frame 1: talking 1 (dt row 4 col 0)
    # Frame 2: talking 2 (dt row 4 col 1)
    # Frame 3: idle shift (dt row 2 col 0)
    # Frame 4 & 5 (Scared): cowering / ducking

    def make_npc_sheet(top_color, bottom_color, headwear_type, hair_gray: bool = False) -> Image.Image:
        sheet = Image.new("RGBA", (320, 192), (0, 0, 0, 0))
        frames_source = [
            dt.crop((0 * FRAME_W, 0 * FRAME_H, 1 * FRAME_W, 1 * FRAME_H)),
            dt.crop((0 * FRAME_W, 4 * FRAME_H, 1 * FRAME_W, 5 * FRAME_H)),
            dt.crop((1 * FRAME_W, 4 * FRAME_H, 2 * FRAME_W, 5 * FRAME_H)),
            dt.crop((0 * FRAME_W, 2 * FRAME_H, 1 * FRAME_W, 3 * FRAME_H)),
        ]
        # Row 0: Idle / chatting
        for c in range(4):
            f = frames_source[c].copy()
            f_px = f.load()
            for y in range(FRAME_H):
                for x in range(FRAME_W):
                    cr, cg, cb, ca = f_px[x, y]
                    if ca > 30:
                        # Top clothing
                        if y in range(25, 55) and (cb > cr or cg > cr):
                            lum = (cr + cg + cb) / 3.0 / 255.0
                            f_px[x, y] = (int(top_color[0] * lum), int(top_color[1] * lum), int(top_color[2] * lum), ca)
                        # Bottom pants
                        elif y >= 55 and cr < 90 and cg < 90:
                            lum = (cr + cg + cb) / 3.0 / 255.0
                            f_px[x, y] = (int(bottom_color[0] * lum), int(bottom_color[1] * lum), int(bottom_color[2] * lum), ca)
                        # Hair
                        elif hair_gray and y in range(12, 26) and cr < 60 and cg < 50:
                            f_px[x, y] = (190, 185, 180, ca)
            
            fd = ImageDraw.Draw(f)
            # Headwear
            head_y = 23
            if headwear_type == "towel":
                # Khăn rằn turban wrapped around head
                fd.ellipse([(ANCHOR_X - 10, head_y - 10), (ANCHOR_X + 10, head_y - 2)], fill=(225, 218, 200, 255), outline=(150, 140, 120, 255))
                fd.rectangle([(ANCHOR_X - 10, head_y - 6), (ANCHOR_X + 10, head_y - 3)], fill=(180, 170, 150, 255))
            elif headwear_type == "conical":
                # Nón lá (conical hat)
                fd.polygon([(ANCHOR_X - 17, head_y - 2), (ANCHOR_X + 17, head_y - 2), (ANCHOR_X, head_y - 17)], fill=(220, 195, 120, 255), outline=(160, 135, 75, 255), width=1)
                fd.line([(ANCHOR_X - 17, head_y - 2), (ANCHOR_X + 17, head_y - 2)], fill=(180, 150, 80, 255), width=2)
            elif headwear_type == "scarf_shoulder":
                # Scarf across shoulder
                fd.line([(ANCHOR_X - 6, 32), (ANCHOR_X + 8, 48)], fill=(230, 225, 215, 255), width=3)

            sheet.paste(f, (c * FRAME_W, 0), f)

        # Row 1: Scared / cowering (2 frames)
        for c in range(2):
            f_scared = frames_source[0].copy()
            # Crouch body downwards by 12px
            body_box = f_scared.crop((0, 15, FRAME_W, FRAME_H))
            f_cower = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
            f_cower.paste(body_box, (0, 25), body_box)
            
            # Recolor
            fc_px = f_cower.load()
            for y in range(FRAME_H):
                for x in range(FRAME_W):
                    cr, cg, cb, ca = fc_px[x, y]
                    if ca > 30:
                        if y in range(35, 65) and (cb > cr or cg > cr):
                            lum = (cr + cg + cb) / 3.0 / 255.0
                            fc_px[x, y] = (int(top_color[0] * lum), int(top_color[1] * lum), int(top_color[2] * lum), ca)
                        elif y >= 65 and cr < 90 and cg < 90:
                            lum = (cr + cg + cb) / 3.0 / 255.0
                            fc_px[x, y] = (int(bottom_color[0] * lum), int(bottom_color[1] * lum), int(bottom_color[2] * lum), ca)
                        elif hair_gray and y in range(22, 36) and cr < 60:
                            fc_px[x, y] = (190, 185, 180, ca)

            fcd = ImageDraw.Draw(f_cower)
            # Hands over head
            fcd.ellipse([(ANCHOR_X - 14, 24 + c * 2), (ANCHOR_X - 6, 32 + c * 2)], fill=(225, 180, 140, 255))
            fcd.ellipse([(ANCHOR_X + 6, 24 + c * 2), (ANCHOR_X + 14, 32 + c * 2)], fill=(225, 180, 140, 255))
            if headwear_type == "conical":
                fcd.polygon([(ANCHOR_X - 18, 30), (ANCHOR_X + 18, 30), (ANCHOR_X, 15)], fill=(220, 195, 120, 255), outline=(160, 135, 75, 255))
            sheet.paste(f_cower, (c * FRAME_W, FRAME_H), f_cower)

        return sheet

    # 1. dong_chi_bay.png: rustic brown ba ba (120, 80, 45), gray hair, towel wrapped
    bay_sheet = make_npc_sheet((130, 85, 50), (45, 35, 25), "towel", hair_gray=True)
    save_png(bay_sheet, SPRITES_DIR / "dong_chi_bay.png")

    # 2. villager_a.png: brown ba ba + non la
    va = make_npc_sheet((175, 130, 75), (55, 45, 35), "conical")
    save_png(va, SPRITES_DIR / "villager_a.png")

    # 3. villager_b.png: indigo ba ba + non la
    vb = make_npc_sheet((65, 95, 140), (40, 40, 45), "conical")
    save_png(vb, SPRITES_DIR / "villager_b.png")

    # 4. villager_c.png: terracotta ba ba + shoulder scarf
    vc = make_npc_sheet((165, 75, 60), (45, 45, 45), "scarf_shoulder")
    save_png(vc, SPRITES_DIR / "villager_c.png")

# ---------------------------------------------------------------------------------------------
# 4. Items & Emotes
# ---------------------------------------------------------------------------------------------

def redraw_items_and_emotes() -> None:
    print("\n--- Redrawing Items & Emotes ---")
    # 1. emotes.png: 320x64 (copy from kimdong high-res authentic art)
    kd_emotes = Image.open(KIMDONG / "images" / "emotes.png").convert("RGBA")
    save_png(kd_emotes, IMAGES_DIR / "emotes.png")

    # 2. item_pebble.png: 48x48 smooth river pebble with specular highlight & shadow
    kd_pebble = Image.open(KIMDONG / "images" / "item_pebble.png").convert("RGBA")
    peb_canvas = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    # Extract clean pebble from 96x32 sheet (first pebble at 0..32, 0..32)
    p_crop = kd_pebble.crop((4, 2, 30, 28))
    p_resized = p_crop.resize((32, 30), Image.LANCZOS)
    peb_canvas.paste(p_resized, (8, 9), p_resized)
    save_png(peb_canvas, IMAGES_DIR / "item_pebble.png")

    # 3. item_paper.png: 4 animated frames of 48x48 = 192x48 from secret resistance letter
    kd_letter = Image.open(KIMDONG / "images" / "letter.png").convert("RGBA")
    # kd_letter is 400x213 (5x3 frames of 80x71)
    paper_sheet = Image.new("RGBA", (192, 48), (0, 0, 0, 0))
    for f in range(4):
        src_idx = [0, 2, 5, 8][f]
        col = src_idx % 5
        row = src_idx // 5
        cell = kd_letter.crop((col * 80, row * 71, (col + 1) * 80, (row + 1) * 71))
        # Tight crop
        bb = cell.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
        if bb:
            c_tight = cell.crop(bb)
            ratio = min(40 / c_tight.width, 40 / c_tight.height)
            cw, ch = round(c_tight.width * ratio), round(c_tight.height * ratio)
            c_small = c_tight.resize((cw, ch), Image.LANCZOS)
            paper_sheet.paste(c_small, (f * 48 + (48 - cw) // 2, (48 - ch) // 2), c_small)
    save_png(paper_sheet, IMAGES_DIR / "item_paper.png")

    # 4. item_grenade.png: 64x64 detailed pineapple hand grenade
    grenade = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grenade)
    # Cast shadow
    gd.ellipse([(18, 52), (46, 60)], fill=(0, 0, 0, 80))
    # Cast iron oval body with radial 3D shading
    for r_i in range(17, 0, -1):
        frac = r_i / 17.0
        shade = int(35 + 40 * (1 - frac))
        gd.ellipse([(32 - int(15 * frac), 37 - int(18 * frac)), (32 + int(15 * frac), 37 + int(18 * frac))],
                   fill=(int(shade * 0.9), shade, int(shade * 0.85), 255))
    # Segmentation grooves (pineapple grid)
    for gy in (26, 32, 38, 44):
        gd.line([(20, gy), (44, gy)], fill=(18, 24, 16, 255), width=2)
    for gx in (24, 29, 35, 40):
        gd.arc([(gx - 3, 20), (gx + 3, 54)], 270, 90, fill=(18, 24, 16, 255), width=2)
    # Metallic specular highlight
    gd.ellipse([(24, 25), (29, 32)], fill=(140, 165, 130, 200))
    # Brass fuse head
    gd.rectangle([(28, 14), (36, 20)], fill=(160, 135, 70, 255), outline=(100, 80, 35, 255))
    # Steel lever
    gd.arc([(26, 12), (46, 34)], 180, 340, fill=(185, 185, 195, 255), width=3)
    # Pull ring
    gd.ellipse([(20, 10), (28, 18)], outline=(190, 190, 200, 255), width=2)
    save_png(grenade, IMAGES_DIR / "item_grenade.png")

    # 5. fx_explosion.png: 768x128 (6 frames of 128x128)
    exp = Image.new("RGBA", (768, 128), (0, 0, 0, 0))
    for f in range(6):
        cx, cy = f * 128 + 64, 64
        frame_canvas = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        fd = ImageDraw.Draw(frame_canvas)
        t = f / 5.0
        
        # Fireball expansion and smoke decay
        random.seed(100 + f * 13)
        if f <= 3:
            # Fiery burst
            r_max = int(22 + 42 * math.sin(t * math.pi * 0.75))
            # Smoke clouds forming outside
            for _ in range(16):
                ang = random.uniform(0, 2 * math.pi)
                dist = random.uniform(r_max * 0.5, r_max * 1.1)
                px = 64 + int(dist * math.cos(ang))
                py = 64 + int(dist * math.sin(ang))
                pr = random.randint(12, 22)
                alpha = int(220 * (1.0 - t * 0.5))
                fd.ellipse([(px - pr, py - pr), (px + pr, py + pr)], fill=(50, 45, 40, alpha))
            # Bright orange/red flame lobes
            for _ in range(14):
                ang = random.uniform(0, 2 * math.pi)
                dist = random.uniform(0, r_max * 0.8)
                px = 64 + int(dist * math.cos(ang))
                py = 64 + int(dist * math.sin(ang))
                pr = random.randint(14, 25)
                fd.ellipse([(px - pr, py - pr), (px + pr, py + pr)], fill=(245, random.randint(70, 130), 20, 240))
            # Golden core
            fd.ellipse([(64 - int(r_max * 0.5), 64 - int(r_max * 0.5)), (64 + int(r_max * 0.5), 64 + int(r_max * 0.5))], fill=(255, 215, 60, 255))
            # White-hot spark center
            if f <= 2:
                fd.ellipse([(64 - int(r_max * 0.25), 64 - int(r_max * 0.25)), (64 + int(r_max * 0.25), 64 + int(r_max * 0.25))], fill=(255, 255, 230, 255))
            # Flying ember sparks
            for _ in range(18):
                ang = random.uniform(0, 2 * math.pi)
                dist = random.uniform(r_max * 0.6, r_max * 1.35)
                sx = 64 + int(dist * math.cos(ang))
                sy = 64 + int(dist * math.sin(ang))
                fd.ellipse([(sx - 2, sy - 2), (sx + 2, sy + 2)], fill=(255, 230, 110, 255))
        else:
            # Plume of expanding dark smoke & fading embers
            decay = (f - 3) / 2.0
            r_smoke = int(45 + 18 * decay)
            alpha = int(180 * (1.0 - decay * 0.75))
            for _ in range(24):
                ang = random.uniform(0, 2 * math.pi)
                dist = random.uniform(0, r_smoke)
                px = 64 + int(dist * math.cos(ang))
                py = 64 + int(dist * math.sin(ang))
                pr = random.randint(14, 28)
                shade = random.randint(55, 85)
                fd.ellipse([(px - pr, py - pr), (px + pr, py + pr)], fill=(shade, shade - 5, shade - 8, alpha))
            # Lingering sparks
            for _ in range(8):
                ang = random.uniform(0, 2 * math.pi)
                dist = random.uniform(10, r_smoke * 0.8)
                sx = 64 + int(dist * math.cos(ang))
                sy = 64 + int(dist * math.sin(ang))
                fd.ellipse([(sx - 1, sy - 1), (sx + 1, sy + 1)], fill=(255, 140, 40, int(200 * (1 - decay))))

        exp.paste(frame_canvas, (f * 128, 0), frame_canvas)
    save_png(exp, IMAGES_DIR / "fx_explosion.png")

# ---------------------------------------------------------------------------------------------
# 5. Props (fern, leaf_pile, log, crate, tunnel_hatch, post_bay)
# ---------------------------------------------------------------------------------------------

def redraw_props() -> None:
    print("\n--- Redrawing Props ---")
    # 1. prop_fern.png: 70x56 from deco_fern_a.png
    kd_fern = Image.open(KIMDONG / "images" / "deco_fern_a.png").convert("RGBA")
    bb = kd_fern.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox()
    fern_crop = kd_fern.crop(bb) if bb else kd_fern
    ratio = min(70 / fern_crop.width, 56 / fern_crop.height)
    fw, fh = round(fern_crop.width * ratio), round(fern_crop.height * ratio)
    fern_resized = fern_crop.resize((fw, fh), Image.LANCZOS)
    fern_canvas = Image.new("RGBA", (70, 56), (0, 0, 0, 0))
    fern_canvas.paste(fern_resized, ((70 - fw) // 2, 56 - fh), fern_resized)
    save_png(fern_canvas, IMAGES_DIR / "prop_fern.png")

    # 2. prop_leaf_pile.png: 60x30 clustered organic fallen leaves
    gf = Image.open(IMAGES_DIR / "ground_forest.png").convert("RGBA")
    leaf_canvas = Image.new("RGBA", (60, 30), (0, 0, 0, 0))
    # Extract authentic leaf textures
    patch = gf.crop((30, 30, 90, 60))
    # Mask in ellipse
    mask = Image.new("L", (60, 30), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([(4, 4), (56, 26)], fill=235)
    mask = mask.filter(ImageFilter.GaussianBlur(2))
    leaf_canvas.paste(patch, (0, 0), mask)
    # Add scattered individual leaf contours
    ld = ImageDraw.Draw(leaf_canvas)
    random.seed(88)
    for _ in range(18):
        lx = random.randint(8, 48)
        ly = random.randint(6, 22)
        lw = random.randint(6, 10)
        lh = random.randint(3, 6)
        col = random.choice([(140, 65, 30, 240), (120, 50, 20, 240), (80, 40, 15, 240), (160, 85, 35, 240)])
        ld.ellipse([(lx, ly), (lx + lw, ly + lh)], fill=col, outline=(50, 25, 10, 200))
        ld.line([(lx, ly + lh // 2), (lx + lw, ly + lh // 2)], fill=(90, 45, 18, 220))
    save_png(leaf_canvas, IMAGES_DIR / "prop_leaf_pile.png")

    # 3. prop_log.png: 120x40 realistic fallen rubber tree log with bark grooves and cut ends
    log_canvas = Image.new("RGBA", (120, 40), (0, 0, 0, 0))
    logd = ImageDraw.Draw(log_canvas)
    # Cast shadow
    logd.ellipse([(14, 26), (108, 38)], fill=(0, 0, 0, 90))
    # Trunk cylinder
    logd.rounded_rectangle([(16, 12), (98, 32)], radius=6, fill=(75, 52, 34, 255), outline=(42, 28, 18, 255), width=2)
    # Bark texture striations
    for by in (16, 20, 24, 28):
        logd.line([(22, by), (94, by)], fill=(55, 38, 24, 255), width=1)
    # Tapping groove marks (rubber tree style)
    for gx in range(30, 85, 14):
        logd.line([(gx, 13), (gx + 8, 31)], fill=(35, 22, 14, 255), width=2)
    # Cut cross-section ring at right end
    logd.ellipse([(92, 11), (112, 33)], fill=(125, 92, 60, 255), outline=(55, 38, 24, 255), width=2)
    logd.ellipse([(97, 16), (107, 28)], outline=(85, 60, 38, 255), width=1)
    logd.ellipse([(100, 20), (104, 24)], fill=(65, 45, 28, 255))
    # Green moss patches
    logd.ellipse([(28, 10), (45, 17)], fill=(50, 105, 40, 220))
    logd.ellipse([(62, 11), (74, 16)], fill=(50, 105, 40, 200))
    save_png(log_canvas, IMAGES_DIR / "prop_log.png")

    # 4. prop_crate.png: 64x56 wooden cargo crate with metal corner reinforcement and rivets
    crate_canvas = Image.new("RGBA", (64, 56), (0, 0, 0, 0))
    cd = ImageDraw.Draw(crate_canvas)
    # Cast shadow
    cd.ellipse([(8, 48), (56, 56)], fill=(0, 0, 0, 85))
    # Main wooden box
    cd.rectangle([(8, 8), (56, 50)], fill=(168, 118, 72, 255), outline=(95, 65, 35, 255), width=2)
    # Horizontal wood planks
    for py in (18, 28, 38):
        cd.line([(8, py), (56, py)], fill=(95, 65, 35, 255), width=2)
    # Outer frame border
    cd.rectangle([(11, 11), (53, 47)], outline=(130, 90, 50, 255), width=2)
    # Diagonal brace
    cd.line([(12, 12), (52, 46)], fill=(115, 78, 42, 255), width=3)
    # Metal corner brackets
    corners = [(8, 8), (48, 8), (8, 42), (48, 42)]
    for cx, cy in corners:
        cd.rectangle([(cx, cy), (cx + 8, cy + 8)], fill=(75, 75, 80, 255), outline=(40, 40, 45, 255), width=1)
        cd.rectangle([(cx + 3, cy + 3), (cx + 5, cy + 5)], fill=(160, 160, 170, 255))
    # Stencil cargo mark
    cd.rectangle([(24, 22), (40, 34)], outline=(80, 50, 25, 200), width=1)
    save_png(crate_canvas, IMAGES_DIR / "prop_crate.png")

    # 5. prop_tunnel_hatch.png: 110x70 secret resistance underground hatch
    hatch_canvas = Image.new("RGBA", (110, 70), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hatch_canvas)
    # Earth mound rim
    hd.ellipse([(6, 12), (104, 66)], fill=(78, 52, 34, 255), outline=(48, 30, 18, 255), width=3)
    # Dark recessed opening
    hd.ellipse([(16, 18), (94, 60)], fill=(22, 16, 12, 255))
    # Heavy timber double trapdoors
    hd.ellipse([(18, 20), (92, 58)], fill=(115, 82, 52, 255), outline=(45, 30, 18, 255), width=2)
    # Vertical wood planks
    for px in (32, 44, 55, 66, 78):
        hd.line([(px, 22), (px, 56)], fill=(48, 32, 20, 255), width=2)
    # Central split
    hd.line([(55, 20), (55, 58)], fill=(25, 16, 10, 255), width=3)
    # Iron hinge straps
    hd.line([(26, 30), (50, 30)], fill=(55, 55, 60, 255), width=4)
    hd.line([(26, 48), (50, 48)], fill=(55, 55, 60, 255), width=4)
    hd.line([(60, 30), (84, 30)], fill=(55, 55, 60, 255), width=4)
    hd.line([(60, 48), (84, 48)], fill=(55, 55, 60, 255), width=4)
    # Forged iron ring pull handles
    hd.ellipse([(44, 34), (52, 44)], outline=(70, 70, 75, 255), width=2)
    hd.ellipse([(58, 34), (66, 44)], outline=(70, 70, 75, 255), width=2)
    save_png(hatch_canvas, IMAGES_DIR / "prop_tunnel_hatch.png")

    # 6. prop_post_bay.png: 170x150 camouflaged dugout bunker post of comrade Bay
    post_canvas = Image.new("RGBA", (170, 150), (0, 0, 0, 0))
    pd = ImageDraw.Draw(post_canvas)
    # Earthen mound with grass/foliage shading
    pd.chord([(10, 35), (160, 165)], 180, 360, fill=(72, 50, 32, 255), outline=(42, 28, 16, 255), width=3)
    # Layered camouflage bushes & ferns across roof
    random.seed(77)
    for px, py in [(25, 55), (50, 42), (85, 38), (120, 45), (145, 60)]:
        pd.ellipse([(px - 18, py - 14), (px + 18, py + 14)], fill=(38, 88, 42, 240))
        pd.ellipse([(px - 12, py - 10), (px + 12, py + 10)], fill=(52, 115, 58, 240))
    # Heavy timber entrance frame
    pd.rectangle([(55, 68), (115, 142)], fill=(12, 10, 8, 255))
    # Left & right stout logs
    pd.rectangle([(48, 64), (60, 144)], fill=(110, 75, 45, 255), outline=(55, 35, 20, 255), width=2)
    pd.rectangle([(110, 64), (122, 144)], fill=(110, 75, 45, 255), outline=(55, 35, 20, 255), width=2)
    # Header log lintel
    pd.rectangle([(44, 60), (126, 72)], fill=(125, 85, 52, 255), outline=(55, 35, 20, 255), width=2)
    # Bark texture on timber
    for ly in (75, 95, 115, 130):
        pd.line([(49, ly), (59, ly)], fill=(75, 50, 30, 255))
        pd.line([(111, ly), (121, ly)], fill=(75, 50, 30, 255))
    # Camouflage hanging burlap / woven bamboo flap
    pd.rectangle([(62, 70), (108, 95)], fill=(140, 115, 80, 220), outline=(90, 70, 45, 220))
    for by in range(72, 95, 4):
        pd.line([(62, by), (108, by)], fill=(110, 85, 55, 220))
    # Warm amber glow of secret liaison oil lamp inside
    pd.ellipse([(80, 102), (92, 114)], fill=(255, 200, 70, 210))
    pd.ellipse([(76, 98), (96, 118)], fill=(255, 160, 40, 90))
    save_png(post_canvas, IMAGES_DIR / "prop_post_bay.png")

# ---------------------------------------------------------------------------------------------
# Main Execution
# ---------------------------------------------------------------------------------------------

def main() -> None:
    print("=================================================================")
    print("  Redrawing 19 Vo Thi Sau Assets with High-Fidelity Craft")
    print("=================================================================")
    redraw_soldiers()
    redraw_sau()
    redraw_npcs()
    redraw_items_and_emotes()
    redraw_props()
    print("\n[SUCCESS] All 19 specified assets redrawn successfully!")

if __name__ == "__main__":
    main()
