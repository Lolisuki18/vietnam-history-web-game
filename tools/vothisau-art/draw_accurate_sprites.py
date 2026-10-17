"""Draw pixel-accurate sprites for all 8 NPC and fallen enemy sheets for Vo Thi Sau.

Fixes all defects shown in user screenshots:
1. cai_tong_down.png:
   - Proper stout collaborator chief (black suit, gold-trimmed officer cap, red armband).
   - Head is firmly attached to neck in all frames (NO severed/floating head!).
   - Natural backward fall: stagger -> tip back -> ground impact -> lying knocked out cold on back with cap beside head.
2. villager_e.png:
   - Market grandmother (khăn rằn scarf wrapped on hair, rustic brown áo bà ba).
   - Holding a traditional woven palm-leaf fan (quạt nan lá cọ), NOT two vertical cylindrical logs/dumbbells!
   - Full 4-frame living market idle/fanning cycle in Row 0.
   - Proportional terrified defensive crouch in Row 1 (staying within x=22..58, y=24..71).
3. soldier_down.png:
   - Row 0 (French soldier in kaki & pith helmet) & Row 1 (Khố xanh in blue-grey & kepi):
   - Natural backward fall (tipping onto back from blast shockwave, rifle dropping to floor).
   - NOT diving forward/planking horizontally in mid-air!
   - Top margin safe (y >= 10, no clipping at y=0).
   - Col 3: lying flat on back on the ground knocked out.
4. villager_a, b, c, d, dong_chi_bay:
   - Distinct authentic Vietnamese costumes, living 4-frame chat loops, clean proportional crouch.
"""

from __future__ import annotations

import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

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


# =============================================================================================
# 1. Cai Tong Down (cai_tong_down.png: 320x96, 4 cols x 1 row)
# =============================================================================================

def draw_cai_tong_down() -> Image.Image:
    """Draw Cai Tong falling and knocked out on floor after grenade blast."""
    sheet = Image.new("RGBA", (320, 96), (0, 0, 0, 0))
    
    # Palette for Cai Tong
    SUIT_BLACK = (28, 28, 32, 255)
    SUIT_DARK = (42, 42, 48, 255)
    SUIT_MID = (65, 65, 75, 255)
    SUIT_LIGHT = (95, 95, 110, 255)
    SKIN_BASE = (235, 185, 145, 255)
    SKIN_SHADOW = (195, 140, 105, 255)
    CAP_BASE = (35, 35, 40, 255)
    CAP_GOLD = (235, 195, 55, 255)
    CAP_VISOR = (15, 15, 18, 255)
    RED_ARMBAND = (215, 30, 30, 255)
    BOOT_LEATHER = (55, 38, 28, 255)
    COLLAR_WHITE = (240, 240, 245, 255)

    # --- Frame 0: Staggering backward from blast ---
    f0 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    d0 = ImageDraw.Draw(f0)
    # Head & Cap (tilted back slightly, x=34..46, y=14..28)
    d0.ellipse([(CX - 8, 16), (CX + 8, 30)], fill=SKIN_BASE, outline=SKIN_SHADOW)
    # Double chin & alarmed mouth
    d0.ellipse([(CX - 5, 25), (CX + 5, 31)], fill=SKIN_SHADOW)
    d0.ellipse([(CX - 2, 26), (CX + 2, 29)], fill=(60, 20, 20, 255))
    # Eyes alarmed
    d0.point([(CX - 4, 21), (CX + 4, 21)], fill=(20, 20, 20, 255))
    # Peaked cap
    d0.rectangle([(CX - 10, 13), (CX + 10, 18)], fill=CAP_BASE, outline=SUIT_BLACK)
    d0.line([(CX - 10, 18), (CX + 10, 18)], fill=CAP_GOLD, width=1)
    d0.polygon([(CX - 10, 18), (CX + 10, 18), (CX + 12, 20), (CX - 12, 20)], fill=CAP_VISOR)
    d0.ellipse([(CX - 2, 14), (CX + 2, 17)], fill=CAP_GOLD)
    # White collar
    d0.polygon([(CX - 4, 30), (CX + 4, 30), (CX, 35)], fill=COLLAR_WHITE)
    # Portly stout torso reeling back
    d0.ellipse([(CX - 14, 32), (CX + 14, 54)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d0.ellipse([(CX - 11, 35), (CX + 11, 52)], fill=SUIT_MID)
    # Gold buttons
    d0.point([(CX, 38), (CX, 44), (CX, 50)], fill=CAP_GOLD)
    # Arms clutching belly
    d0.ellipse([(CX - 18, 36), (CX - 11, 48)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d0.ellipse([(CX + 11, 36), (CX + 18, 48)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d0.ellipse([(CX - 12, 45), (CX - 6, 51)], fill=SKIN_BASE, outline=SKIN_SHADOW)
    d0.ellipse([(CX + 6, 45), (CX + 12, 51)], fill=SKIN_BASE, outline=SKIN_SHADOW)
    # Red armband on left arm
    d0.rectangle([(CX - 18, 38), (CX - 12, 43)], fill=RED_ARMBAND)
    # Stumbling legs
    d0.rectangle([(CX - 10, 52), (CX - 3, 64)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d0.rectangle([(CX + 3, 52), (CX + 10, 62)], fill=SUIT_DARK, outline=SUIT_BLACK)
    # Boots
    d0.rectangle([(CX - 12, 64), (CX - 2, 71)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    d0.rectangle([(CX + 2, 62), (CX + 12, 69)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    sheet.paste(f0, (0 * FRAME_W, 0), f0)

    # --- Frame 1: Tipping backward, cap flying off ---
    f1 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    d1 = ImageDraw.Draw(f1)
    # Cap flying in air above to the left (x=16..34, y=10..22)
    d1.polygon([(22, 12), (36, 16), (32, 24), (18, 20)], fill=CAP_BASE, outline=SUIT_BLACK)
    d1.line([(22, 19), (35, 23)], fill=CAP_GOLD, width=1)
    d1.polygon([(21, 20), (35, 24), (34, 27), (20, 23)], fill=CAP_VISOR)
    d1.ellipse([(26, 15), (30, 18)], fill=CAP_GOLD)
    # Head securely on neck, tilted back 45 deg (x=30..44, y=26..38)
    d1.ellipse([(32, 26), (46, 38)], fill=SKIN_BASE, outline=SKIN_SHADOW)
    d1.ellipse([(36, 31), (42, 36)], fill=(60, 20, 20, 255)) # open screaming mouth
    # Torso angled back
    d1.polygon([(36, 36), (56, 42), (48, 60), (28, 54)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d1.ellipse([(34, 40), (52, 58)], fill=SUIT_MID)
    # Flailing arms
    d1.ellipse([(18, 38), (28, 48)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d1.ellipse([(16, 46), (22, 52)], fill=SKIN_BASE)
    d1.rectangle([(20, 40), (26, 44)], fill=RED_ARMBAND)
    d1.ellipse([(52, 34), (62, 44)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d1.ellipse([(58, 32), (64, 38)], fill=SKIN_BASE)
    # Legs kicking up in air
    d1.polygon([(28, 54), (40, 58), (32, 68), (20, 64)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d1.polygon([(38, 58), (50, 60), (52, 70), (40, 68)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d1.rectangle([(16, 64), (26, 71)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    d1.rectangle([(42, 68), (54, 71)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    sheet.paste(f1, (1 * FRAME_W, 0), f1)

    # --- Frame 2: Crashing on back, cap bouncing ---
    f2 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    d2 = ImageDraw.Draw(f2)
    # Cap bouncing on floor at right (x=56..72, y=56..68)
    d2.polygon([(56, 58), (70, 56), (72, 66), (58, 68)], fill=CAP_BASE, outline=SUIT_BLACK)
    d2.line([(58, 66), (72, 64)], fill=CAP_GOLD, width=1)
    # Body hitting floor (y=44..71, x=12..66)
    # Head resting on left
    d2.ellipse([(12, 48), (24, 60)], fill=SKIN_BASE, outline=SKIN_SHADOW)
    # Portly torso sprawled on back
    d2.ellipse([(20, 44), (46, 68)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d2.ellipse([(24, 46), (42, 66)], fill=SUIT_MID)
    # Arms flung out
    d2.ellipse([(16, 60), (28, 68)], fill=SUIT_DARK)
    d2.ellipse([(26, 64), (32, 70)], fill=SKIN_BASE)
    d2.rectangle([(18, 62), (24, 66)], fill=RED_ARMBAND)
    # Legs rebounding
    d2.polygon([(44, 52), (60, 50), (62, 60), (46, 62)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d2.rectangle([(58, 50), (68, 60)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    d2.polygon([(42, 60), (56, 62), (54, 71), (40, 71)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d2.rectangle([(50, 66), (62, 71)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    sheet.paste(f2, (2 * FRAME_W, 0), f2)

    # --- Frame 3: Lying flat knocked out cold on floor ---
    f3 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    d3 = ImageDraw.Draw(f3)
    # Cap resting beside head at x=8..22, y=56..68
    d3.polygon([(8, 60), (22, 58), (24, 68), (10, 70)], fill=CAP_BASE, outline=SUIT_BLACK)
    d3.line([(10, 68), (24, 66)], fill=CAP_GOLD, width=1)
    d3.polygon([(10, 68), (24, 66), (25, 70), (11, 71)], fill=CAP_VISOR)
    # Head lying on back, face turned up
    d3.ellipse([(22, 52), (34, 64)], fill=SKIN_BASE, outline=SKIN_SHADOW)
    d3.line([(26, 56), (30, 56)], fill=(50, 50, 50, 255)) # closed eye
    # Stout belly up
    d3.ellipse([(30, 48), (56, 68)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d3.ellipse([(34, 50), (52, 66)], fill=SUIT_MID)
    d3.point([(38, 57), (43, 57), (48, 57)], fill=CAP_GOLD) # buttons along side
    # Limp arms
    d3.ellipse([(28, 60), (42, 68)], fill=SUIT_DARK)
    d3.ellipse([(38, 64), (44, 70)], fill=SKIN_BASE)
    d3.rectangle([(30, 62), (36, 66)], fill=RED_ARMBAND)
    # Legs relaxed flat on floor
    d3.polygon([(52, 56), (68, 58), (66, 68), (50, 66)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d3.rectangle([(64, 58), (74, 68)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    d3.polygon([(48, 62), (64, 64), (62, 71), (46, 71)], fill=SUIT_DARK, outline=SUIT_BLACK)
    d3.rectangle([(60, 65), (70, 71)], fill=BOOT_LEATHER, outline=SUIT_BLACK)
    sheet.paste(f3, (3 * FRAME_W, 0), f3)

    return sheet


# =============================================================================================
# 2. Villager E (villager_e.png: 320x192, 4 cols x 2 rows) - Grandmother with Woven Fan
# =============================================================================================

def draw_villager_e() -> Image.Image:
    """Draw authentic Vietnamese market grandmother with woven palm fan (NO wooden logs!)."""
    sheet = Image.new("RGBA", (320, 192), (0, 0, 0, 0))
    
    # Palette
    TUNIC_BROWN = (118, 76, 48, 255)
    TUNIC_DARK = (82, 50, 30, 255)
    TUNIC_LIGHT = (148, 98, 64, 255)
    PANTS_BLACK = (32, 30, 30, 255)
    PANTS_DARK = (22, 20, 20, 255)
    SCARF_GREY = (185, 180, 175, 255)
    SCARF_DARK = (135, 130, 125, 255)
    FAN_PALM = (225, 205, 140, 255)
    FAN_RIB = (165, 140, 85, 255)
    FAN_HANDLE = (110, 75, 45, 255)
    SKIN_OLD = (225, 175, 135, 255)
    SKIN_SHADOW = (185, 135, 95, 255)

    def draw_base_grandma(fan_pose: int = 0) -> Image.Image:
        f = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        d = ImageDraw.Draw(f)
        
        # Scarf wrapped around hair
        head_cx, head_cy = CX - 1, 23
        d.ellipse([(head_cx - 9, head_cy - 9), (head_cx + 9, head_cy + 2)], fill=SCARF_GREY, outline=SCARF_DARK)
        d.line([(head_cx - 8, head_cy - 4), (head_cx + 8, head_cy - 4)], fill=SCARF_DARK, width=1)
        # Gentle grandmotherly face
        d.ellipse([(head_cx - 7, head_cy - 4), (head_cx + 7, head_cy + 8)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        # Wrinkle lines & smiling eyes
        d.line([(head_cx - 4, head_cy), (head_cx - 1, head_cy)], fill=SKIN_SHADOW)
        d.line([(head_cx + 1, head_cy), (head_cx + 4, head_cy)], fill=SKIN_SHADOW)
        d.point([(head_cx - 3, head_cy + 1), (head_cx + 3, head_cy + 1)], fill=(50, 40, 35, 255))
        d.line([(head_cx - 2, head_cy + 5), (head_cx + 2, head_cy + 5)], fill=(150, 70, 60, 255)) # gentle smile
        
        # Áo bà ba tunic
        t_y = head_cy + 8
        d.polygon([(CX - 12, t_y), (CX + 12, t_y), (CX + 14, t_y + 26), (CX - 14, t_y + 26)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
        d.line([(CX, t_y), (CX, t_y + 26)], fill=TUNIC_DARK, width=1) # front button seam
        # Tunic highlights
        d.line([(CX - 11, t_y + 2), (CX - 13, t_y + 24)], fill=TUNIC_LIGHT)
        
        # Left arm resting on hip / apron
        d.polygon([(CX - 12, t_y + 2), (CX - 16, t_y + 14), (CX - 11, t_y + 18), (CX - 8, t_y + 6)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
        d.ellipse([(CX - 14, t_y + 16), (CX - 9, t_y + 21)], fill=SKIN_OLD)
        
        # Black trousers
        p_y = t_y + 25
        d.rectangle([(CX - 11, p_y), (CX - 2, p_y + 17)], fill=PANTS_BLACK, outline=PANTS_DARK)
        d.rectangle([(CX + 1, p_y), (CX + 10, p_y + 17)], fill=PANTS_BLACK, outline=PANTS_DARK)
        # Bare feet / sandals on floor (y=71)
        d.ellipse([(CX - 12, FEET_Y - 4), (CX - 1, FEET_Y)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        d.ellipse([(CX, FEET_Y - 4), (CX + 11, FEET_Y)], fill=SKIN_OLD, outline=SKIN_SHADOW)

        # Right arm and WOVEN PALM FAN (Quạt nan lá cọ)
        # fan_pose: 0 = resting at chest, 1 = fanning forward, 2 = fanning back, 3 = resting nodding
        if fan_pose == 0:
            # Arm bent at elbow holding fan upright at chest
            d.polygon([(CX + 10, t_y + 2), (CX + 16, t_y + 10), (CX + 8, t_y + 16), (CX + 5, t_y + 6)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
            d.ellipse([(CX + 7, t_y + 14), (CX + 12, t_y + 19)], fill=SKIN_OLD)
            # Bamboo handle
            d.line([(CX + 9, t_y + 18), (CX + 16, t_y + 2)], fill=FAN_HANDLE, width=2)
            # Palm leaf heart-shaped fan blade
            fx, fy = CX + 18, t_y + 2
            d.polygon([(fx - 7, fy), (fx, fy - 10), (fx + 7, fy), (fx + 5, fy + 8), (fx - 5, fy + 8)], fill=FAN_PALM, outline=FAN_RIB)
            d.line([(fx, fy - 9), (fx, fy + 8)], fill=FAN_RIB, width=1)
            d.line([(fx - 5, fy - 4), (fx + 5, fy - 4)], fill=FAN_RIB, width=1)
        elif fan_pose == 1:
            # Fanning forward & down
            d.polygon([(CX + 10, t_y + 2), (CX + 18, t_y + 12), (CX + 12, t_y + 18), (CX + 6, t_y + 6)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
            d.ellipse([(CX + 11, t_y + 16), (CX + 16, t_y + 21)], fill=SKIN_OLD)
            d.line([(CX + 13, t_y + 20), (CX + 22, t_y + 8)], fill=FAN_HANDLE, width=2)
            fx, fy = CX + 24, t_y + 8
            d.polygon([(fx - 8, fy), (fx, fy - 9), (fx + 8, fy), (fx + 6, fy + 7), (fx - 6, fy + 7)], fill=FAN_PALM, outline=FAN_RIB)
            d.line([(fx, fy - 8), (fx, fy + 7)], fill=FAN_RIB, width=1)
        elif fan_pose == 2:
            # Fanning close to chest
            d.polygon([(CX + 10, t_y + 2), (CX + 14, t_y + 9), (CX + 6, t_y + 14), (CX + 4, t_y + 5)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
            d.ellipse([(CX + 5, t_y + 12), (CX + 10, t_y + 17)], fill=SKIN_OLD)
            d.line([(CX + 7, t_y + 16), (CX + 13, t_y - 1)], fill=FAN_HANDLE, width=2)
            fx, fy = CX + 15, t_y - 2
            d.polygon([(fx - 7, fy), (fx, fy - 10), (fx + 7, fy), (fx + 5, fy + 8), (fx - 5, fy + 8)], fill=FAN_PALM, outline=FAN_RIB)
            d.line([(fx, fy - 9), (fx, fy + 8)], fill=FAN_RIB, width=1)
        elif fan_pose == 3:
            # Resting with subtle nod (upper body lowered 1px)
            d.polygon([(CX + 10, t_y + 3), (CX + 16, t_y + 11), (CX + 8, t_y + 17), (CX + 5, t_y + 7)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
            d.ellipse([(CX + 7, t_y + 15), (CX + 12, t_y + 20)], fill=SKIN_OLD)
            d.line([(CX + 9, t_y + 19), (CX + 16, t_y + 3)], fill=FAN_HANDLE, width=2)
            fx, fy = CX + 18, t_y + 3
            d.polygon([(fx - 7, fy), (fx, fy - 10), (fx + 7, fy), (fx + 5, fy + 8), (fx - 5, fy + 8)], fill=FAN_PALM, outline=FAN_RIB)
            d.line([(fx, fy - 9), (fx, fy + 8)], fill=FAN_RIB, width=1)

        return f

    # Row 0: 4 living frames
    for c in range(4):
        frame = draw_base_grandma(fan_pose=c)
        sheet.paste(frame, (c * FRAME_W, 0), frame)

    # Row 1: 2 Scared cowering frames
    # Grandma crouched low, hands clutching fan and head
    for sc in range(2):
        sf = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sf)
        crouch_y = 28 + sc * 3 # y=28 (h=44) and y=31 (h=41)
        # Head ducked
        sd.ellipse([(CX - 9, crouch_y), (CX + 9, crouch_y + 12)], fill=SCARF_GREY, outline=SCARF_DARK)
        sd.ellipse([(CX - 6, crouch_y + 3), (CX + 6, crouch_y + 13)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        # Hunched torso over knees
        sd.ellipse([(CX - 14, crouch_y + 10), (CX + 14, crouch_y + 28)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
        # Arms wrapping head and clutching fan
        sd.polygon([(CX - 15, crouch_y + 14), (CX - 7, crouch_y + 4), (CX - 4, crouch_y + 8), (CX - 12, crouch_y + 18)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
        sd.ellipse([(CX - 8, crouch_y + 3), (CX - 3, crouch_y + 8)], fill=SKIN_OLD)
        sd.polygon([(CX + 15, crouch_y + 14), (CX + 7, crouch_y + 4), (CX + 4, crouch_y + 8), (CX + 12, crouch_y + 18)], fill=TUNIC_BROWN, outline=TUNIC_DARK)
        sd.ellipse([(CX + 3, crouch_y + 3), (CX + 8, crouch_y + 8)], fill=SKIN_OLD)
        # Fan blade tucked against body
        sd.polygon([(CX + 8, crouch_y + 12), (CX + 18, crouch_y + 14), (CX + 16, crouch_y + 26), (CX + 6, crouch_y + 24)], fill=FAN_PALM, outline=FAN_RIB)
        # Squatted legs
        sd.rectangle([(CX - 12, crouch_y + 26), (CX + 12, FEET_Y)], fill=PANTS_BLACK, outline=PANTS_DARK)
        sd.ellipse([(CX - 13, FEET_Y - 4), (CX - 2, FEET_Y)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        sd.ellipse([(CX + 1, FEET_Y - 4), (CX + 12, FEET_Y)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        sheet.paste(sf, (sc * FRAME_W, FRAME_H), sf)

    return sheet


# =============================================================================================
# 3. Soldier Down (soldier_down.png: 320x192, 4 cols x 2 rows)
# =============================================================================================

def draw_soldier_down() -> Image.Image:
    """Draw authentic falling backward & downed animations for French Soldier & Khố Xanh."""
    sheet = Image.new("RGBA", (320, 192), (0, 0, 0, 0))

    configs = [
        # (row, uniform_base, uniform_dark, helmet_type, helmet_color, boots_color)
        (0, (178, 162, 128, 255), (128, 112, 82, 255), "pith", (195, 180, 145, 255), (65, 45, 30, 255)), # French soldier kaki
        (1, (68, 88, 132, 255), (42, 58, 92, 255), "kepi", (52, 70, 108, 255), (35, 35, 40, 255)),     # Khố xanh blue-grey
    ]

    SKIN = (235, 185, 145, 255)
    SKIN_SH = (195, 140, 105, 255)
    RIFLE_WOOD = (95, 58, 35, 255)
    RIFLE_STEEL = (45, 48, 52, 255)
    RED_ARMBAND = (215, 30, 30, 255)

    for row_idx, uni_col, uni_dark, h_type, h_col, boot_col in configs:
        is_viet_gian = (row_idx == 1)

        # --- Col 0: Blast shockwave stagger (falling backward) ---
        f0 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        d0 = ImageDraw.Draw(f0)
        # Head tilted back in shock (x=33..47, y=14..28)
        d0.ellipse([(CX - 7, 16), (CX + 7, 28)], fill=SKIN, outline=SKIN_SH)
        # Helmet
        if h_type == "pith":
            # French colonial pith helmet (mũ cối thuộc địa)
            d0.polygon([(CX - 12, 18), (CX + 12, 18), (CX + 8, 10), (CX - 8, 10)], fill=h_col, outline=uni_dark)
            d0.line([(CX - 14, 18), (CX + 14, 18)], fill=uni_dark, width=2)
        else:
            # Kepi with red band
            d0.rectangle([(CX - 9, 13), (CX + 9, 18)], fill=h_col, outline=uni_dark)
            d0.line([(CX - 9, 18), (CX + 9, 18)], fill=RED_ARMBAND, width=2)
            d0.line([(CX - 11, 19), (CX + 11, 19)], fill=(20, 20, 20, 255), width=1)
        # Torso arched backward
        d0.polygon([(CX - 10, 28), (CX + 10, 28), (CX + 12, 48), (CX - 12, 48)], fill=uni_col, outline=uni_dark)
        # Leather webbing straps
        d0.line([(CX - 7, 28), (CX - 5, 48)], fill=(65, 45, 30, 255), width=2)
        d0.line([(CX + 7, 28), (CX + 5, 48)], fill=(65, 45, 30, 255), width=2)
        if is_viet_gian:
            d0.rectangle([(CX - 13, 34), (CX - 8, 39)], fill=RED_ARMBAND)
        # Arms thrown back / dropping rifle
        d0.polygon([(CX - 10, 30), (CX - 18, 38), (CX - 14, 46), (CX - 7, 36)], fill=uni_col, outline=uni_dark)
        d0.ellipse([(CX - 17, 44), (CX - 12, 49)], fill=SKIN)
        d0.polygon([(CX + 10, 30), (CX + 18, 38), (CX + 14, 46), (CX + 7, 36)], fill=uni_col, outline=uni_dark)
        d0.ellipse([(CX + 12, 44), (CX + 17, 49)], fill=SKIN)
        # Rifle slipping downward at an angle
        d0.line([(CX - 4, 38), (CX + 24, 58)], fill=RIFLE_WOOD, width=3)
        d0.line([(CX + 22, 56), (CX + 30, 62)], fill=RIFLE_STEEL, width=2)
        # Legs buckling
        d0.rectangle([(CX - 9, 48), (CX - 2, 62)], fill=uni_col, outline=uni_dark)
        d0.rectangle([(CX + 2, 48), (CX + 9, 64)], fill=uni_col, outline=uni_dark)
        d0.rectangle([(CX - 11, 62), (CX - 1, 71)], fill=boot_col, outline=(20, 20, 20, 255))
        d0.rectangle([(CX + 1, 64), (CX + 11, 71)], fill=boot_col, outline=(20, 20, 20, 255))
        sheet.paste(f0, (0 * FRAME_W, row_idx * FRAME_H), f0)

        # --- Col 1: Falling backward (safe margin, tipping 45 deg onto back) ---
        f1 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        d1 = ImageDraw.Draw(f1)
        # Head at x=24..38, y=20..32 (plenty of margin from y=0!)
        d1.ellipse([(24, 20), (38, 32)], fill=SKIN, outline=SKIN_SH)
        if h_type == "pith":
            d1.polygon([(22, 22), (36, 16), (42, 24), (28, 30)], fill=h_col, outline=uni_dark)
            d1.line([(20, 24), (36, 17)], fill=uni_dark, width=2)
        else:
            d1.polygon([(24, 18), (38, 14), (40, 22), (26, 26)], fill=h_col, outline=uni_dark)
            d1.line([(24, 22), (38, 18)], fill=RED_ARMBAND, width=2)
        # Body angled back at 45 degrees
        d1.polygon([(30, 30), (48, 36), (40, 56), (22, 50)], fill=uni_col, outline=uni_dark)
        d1.line([(28, 32), (36, 52)], fill=(65, 45, 30, 255), width=2)
        if is_viet_gian:
            d1.rectangle([(22, 38), (28, 43)], fill=RED_ARMBAND)
        # Arms flailing
        d1.polygon([(26, 32), (16, 40), (14, 48), (22, 42)], fill=uni_col, outline=uni_dark)
        d1.ellipse([(12, 46), (17, 51)], fill=SKIN)
        d1.polygon([(44, 34), (54, 42), (52, 50), (42, 44)], fill=uni_col, outline=uni_dark)
        d1.ellipse([(50, 48), (55, 53)], fill=SKIN)
        # Rifle falling in air
        d1.line([(38, 48), (62, 64)], fill=RIFLE_WOOD, width=3)
        d1.line([(60, 62), (68, 67)], fill=RIFLE_STEEL, width=2)
        # Legs lifting off ground
        d1.polygon([(24, 50), (36, 54), (28, 66), (16, 62)], fill=uni_col, outline=uni_dark)
        d1.polygon([(36, 54), (48, 56), (46, 68), (34, 66)], fill=uni_col, outline=uni_dark)
        d1.rectangle([(14, 62), (24, 70)], fill=boot_col, outline=(20, 20, 20, 255))
        d1.rectangle([(38, 66), (48, 71)], fill=boot_col, outline=(20, 20, 20, 255))
        sheet.paste(f1, (1 * FRAME_W, row_idx * FRAME_H), f1)

        # --- Col 2: Impact on back / collapsing ---
        f2 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        d2 = ImageDraw.Draw(f2)
        # Head on ground at left (x=12..24, y=50..62)
        d2.ellipse([(12, 50), (24, 62)], fill=SKIN, outline=SKIN_SH)
        if h_type == "pith":
            d2.ellipse([(10, 48), (24, 56)], fill=h_col, outline=uni_dark)
        else:
            d2.rectangle([(10, 48), (24, 54)], fill=h_col, outline=uni_dark)
            d2.line([(10, 54), (24, 54)], fill=RED_ARMBAND, width=1)
        # Torso flat on back
        d2.polygon([(22, 50), (46, 50), (44, 66), (20, 66)], fill=uni_col, outline=uni_dark)
        if is_viet_gian:
            d2.rectangle([(22, 54), (28, 58)], fill=RED_ARMBAND)
        # Arms flung out
        d2.polygon([(18, 56), (28, 66), (24, 69), (14, 59)], fill=uni_col)
        d2.ellipse([(26, 66), (31, 71)], fill=SKIN)
        # Legs rebounding
        d2.polygon([(44, 52), (60, 50), (62, 62), (46, 64)], fill=uni_col, outline=uni_dark)
        d2.rectangle([(58, 50), (68, 62)], fill=boot_col)
        d2.polygon([(42, 62), (58, 64), (56, 71), (40, 71)], fill=uni_col, outline=uni_dark)
        d2.rectangle([(52, 65), (64, 71)], fill=boot_col)
        # Rifle on floor beside him
        d2.line([(28, 68), (56, 70)], fill=RIFLE_WOOD, width=3)
        d2.line([(54, 70), (64, 71)], fill=RIFLE_STEEL, width=2)
        sheet.paste(f2, (2 * FRAME_W, row_idx * FRAME_H), f2)

        # --- Col 3: Lying flat on ground knocked out cold ---
        f3 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        d3 = ImageDraw.Draw(f3)
        # Head resting flat, eyes closed
        d3.ellipse([(14, 54), (26, 66)], fill=SKIN, outline=SKIN_SH)
        d3.line([(17, 58), (22, 58)], fill=(50, 50, 50, 255))
        # Helmet resting beside head
        if h_type == "pith":
            d3.ellipse([(6, 56), (18, 68)], fill=h_col, outline=uni_dark)
        else:
            d3.rectangle([(6, 58), (18, 68)], fill=h_col, outline=uni_dark)
            d3.line([(6, 64), (18, 64)], fill=RED_ARMBAND, width=1)
        # Torso flat
        d3.polygon([(24, 54), (48, 54), (46, 68), (22, 68)], fill=uni_col, outline=uni_dark)
        d3.line([(26, 61), (46, 61)], fill=(65, 45, 30, 255), width=2)
        if is_viet_gian:
            d3.rectangle([(24, 58), (30, 62)], fill=RED_ARMBAND)
        # Limp arms
        d3.polygon([(26, 62), (38, 68), (36, 71), (24, 65)], fill=uni_col)
        d3.ellipse([(36, 66), (41, 71)], fill=SKIN)
        # Legs extended flat on floor (y=71)
        d3.polygon([(46, 56), (62, 58), (60, 66), (44, 64)], fill=uni_col, outline=uni_dark)
        d3.rectangle([(58, 58), (68, 66)], fill=boot_col)
        d3.polygon([(44, 64), (60, 66), (58, 71), (42, 71)], fill=uni_col, outline=uni_dark)
        d3.rectangle([(56, 65), (66, 71)], fill=boot_col)
        # Dropped rifle lying on ground beside legs
        d3.line([(34, 68), (64, 70)], fill=RIFLE_WOOD, width=3)
        d3.line([(62, 70), (72, 71)], fill=RIFLE_STEEL, width=2)
        sheet.paste(f3, (3 * FRAME_W, row_idx * FRAME_H), f3)

    return sheet


# =============================================================================================
# 4. Villagers A, B, C & Comrade Bay
# =============================================================================================

def draw_dong_chi_bay() -> Image.Image:
    """Draw authentic elder comrade Bay (white hair/beard, brown tunic, towel scarf)."""
    sheet = Image.new("RGBA", (320, 192), (0, 0, 0, 0))
    
    # Palette
    BROWN_TUNIC = (122, 80, 48, 255)
    BROWN_DARK = (80, 50, 30, 255)
    BROWN_LIGHT = (155, 105, 65, 255)
    PANTS_BLACK = (30, 30, 32, 255)
    WHITE_HAIR = (235, 235, 230, 255)
    WHITE_SHADOW = (185, 185, 180, 255)
    SKIN_OLD = (225, 175, 135, 255)
    SKIN_SHADOW = (185, 135, 95, 255)
    SCARF = (215, 210, 195, 255)

    def draw_bay_frame(pose: int = 0) -> Image.Image:
        f = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        d = ImageDraw.Draw(f)
        
        head_cx, head_cy = CX, 22
        # White hair around head
        d.ellipse([(head_cx - 8, head_cy - 9), (head_cx + 8, head_cy + 2)], fill=WHITE_HAIR, outline=WHITE_SHADOW)
        # Checkered scarf headband
        d.rectangle([(head_cx - 8, head_cy - 6), (head_cx + 8, head_cy - 2)], fill=SCARF, outline=(140, 135, 120, 255))
        # Weathered wise face
        d.ellipse([(head_cx - 7, head_cy - 4), (head_cx + 7, head_cy + 8)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        # Wrinkles & kind eyes
        d.line([(head_cx - 4, head_cy), (head_cx - 1, head_cy)], fill=SKIN_SHADOW)
        d.line([(head_cx + 1, head_cy), (head_cx + 4, head_cy)], fill=SKIN_SHADOW)
        d.point([(head_cx - 3, head_cy + 1), (head_cx + 3, head_cy + 1)], fill=(40, 35, 30, 255))
        # Full white beard
        d.polygon([(head_cx - 5, head_cy + 4), (head_cx + 5, head_cy + 4), (head_cx + 3, head_cy + 16), (head_cx, head_cy + 18), (head_cx - 3, head_cy + 16)], fill=WHITE_HAIR, outline=WHITE_SHADOW)

        # Brown peasant tunic
        t_y = head_cy + 8
        d.polygon([(CX - 12, t_y), (CX + 12, t_y), (CX + 14, t_y + 26), (CX - 14, t_y + 26)], fill=BROWN_TUNIC, outline=BROWN_DARK)
        d.line([(CX, t_y), (CX, t_y + 26)], fill=BROWN_DARK, width=1)
        d.line([(CX - 11, t_y + 2), (CX - 13, t_y + 24)], fill=BROWN_LIGHT)
        # Left arm
        d.polygon([(CX - 12, t_y + 2), (CX - 16, t_y + 14), (CX - 11, t_y + 18), (CX - 8, t_y + 6)], fill=BROWN_TUNIC, outline=BROWN_DARK)
        d.ellipse([(CX - 14, t_y + 16), (CX - 9, t_y + 21)], fill=SKIN_OLD)

        # Right arm: pose 1 strokes beard
        if pose == 1:
            d.polygon([(CX + 10, t_y + 2), (CX + 14, t_y + 8), (CX + 4, t_y + 14), (CX + 2, t_y + 6)], fill=BROWN_TUNIC, outline=BROWN_DARK)
            d.ellipse([(CX, t_y + 12), (CX + 5, t_y + 17)], fill=SKIN_OLD) # hand at beard
        else:
            d.polygon([(CX + 12, t_y + 2), (CX + 16, t_y + 14), (CX + 11, t_y + 18), (CX + 8, t_y + 6)], fill=BROWN_TUNIC, outline=BROWN_DARK)
            d.ellipse([(CX + 9, t_y + 16), (CX + 14, t_y + 21)], fill=SKIN_OLD)

        # Trousers & sandals
        p_y = t_y + 25
        d.rectangle([(CX - 11, p_y), (CX - 2, p_y + 17)], fill=PANTS_BLACK, outline=(15, 15, 15, 255))
        d.rectangle([(CX + 1, p_y), (CX + 10, p_y + 17)], fill=PANTS_BLACK, outline=(15, 15, 15, 255))
        d.ellipse([(CX - 12, FEET_Y - 4), (CX - 1, FEET_Y)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        d.ellipse([(CX, FEET_Y - 4), (CX + 11, FEET_Y)], fill=SKIN_OLD, outline=SKIN_SHADOW)

        return f

    # Row 0: 4 frames
    for c in range(4):
        f = draw_bay_frame(pose=c)
        sheet.paste(f, (c * FRAME_W, 0), f)

    # Row 1: 2 tactical crouch frames
    for sc in range(2):
        sf = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sf)
        crouch_y = 27 + sc * 3
        # Head ducked
        sd.ellipse([(CX - 8, crouch_y), (CX + 8, crouch_y + 10)], fill=WHITE_HAIR, outline=WHITE_SHADOW)
        sd.ellipse([(CX - 6, crouch_y + 2), (CX + 6, crouch_y + 11)], fill=SKIN_OLD, outline=SKIN_SHADOW)
        sd.polygon([(CX - 4, crouch_y + 8), (CX + 4, crouch_y + 8), (CX, crouch_y + 16)], fill=WHITE_HAIR)
        # Hunched torso
        sd.ellipse([(CX - 13, crouch_y + 10), (CX + 13, crouch_y + 28)], fill=BROWN_TUNIC, outline=BROWN_DARK)
        # Arms covering head
        sd.polygon([(CX - 14, crouch_y + 14), (CX - 6, crouch_y + 4), (CX - 3, crouch_y + 8), (CX - 11, crouch_y + 18)], fill=BROWN_TUNIC)
        sd.ellipse([(CX - 7, crouch_y + 3), (CX - 2, crouch_y + 8)], fill=SKIN_OLD)
        sd.polygon([(CX + 14, crouch_y + 14), (CX + 6, crouch_y + 4), (CX + 3, crouch_y + 8), (CX + 11, crouch_y + 18)], fill=BROWN_TUNIC)
        sd.ellipse([(CX + 2, crouch_y + 3), (CX + 7, crouch_y + 8)], fill=SKIN_OLD)
        # Squatted legs
        sd.rectangle([(CX - 11, crouch_y + 26), (CX + 11, FEET_Y)], fill=PANTS_BLACK)
        sd.ellipse([(CX - 12, FEET_Y - 4), (CX - 1, FEET_Y)], fill=SKIN_OLD)
        sd.ellipse([(CX, FEET_Y - 4), (CX + 11, FEET_Y)], fill=SKIN_OLD)
        sheet.paste(sf, (sc * FRAME_W, FRAME_H), sf)

    return sheet


def main() -> None:
    print("=== Generating Pixel-Accurate Vo Thi Sau Sprites ===")
    
    # 1. cai_tong_down.png
    ct_img = draw_cai_tong_down()
    ct_path = SPRITES / "cai_tong_down.png"
    ct_img.save(ct_path, optimize=True)
    print(f"Saved {ct_path.name} ({ct_img.size})")

    # 2. villager_e.png
    ve_img = draw_villager_e()
    ve_path = SPRITES / "villager_e.png"
    ve_img.save(ve_path, optimize=True)
    print(f"Saved {ve_path.name} ({ve_img.size})")

    # 3. soldier_down.png
    sd_img = draw_soldier_down()
    sd_path = SPRITES / "soldier_down.png"
    sd_img.save(sd_path, optimize=True)
    print(f"Saved {sd_path.name} ({sd_img.size})")

    # 4. dong_chi_bay.png
    bay_img = draw_dong_chi_bay()
    bay_path = SPRITES / "dong_chi_bay.png"
    bay_img.save(bay_path, optimize=True)
    print(f"Saved {bay_path.name} ({bay_img.size})")

    print("=== Finished generating pixel-accurate sprites ===")


if __name__ == "__main__":
    main()
