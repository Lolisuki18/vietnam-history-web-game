"""Build the game-ready Võ Thị Sáu art and audio assets from generated media and procedural art tools.

Outputs:
  public/assets/vothisau/web/        (vothisau-cover.webp, vothisau-codex.webp)
  public/assets/vothisau/images/     (portraits, ground tiles, props, emotes, items, fx)
  public/assets/vothisau/sprites/    (sau.png, french_soldier.png, viet_gian.png, cai_tong.png, villagers, dong_chi_bay.png)
  public/assets/vothisau/audio/      (bgm and sfx .wav files)

Uses standard Pillow and Python standard library (wave, math, struct, random).
"""

from __future__ import annotations

import math
import os
import random
import struct
import sys
import wave
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BRAIN = Path(r"C:\Users\NinhLe\.gemini\antigravity-ide\brain\b71a68b4-9970-4c14-96f4-a73e5564d4cc")
ASSETS = ROOT / "public" / "assets" / "vothisau"
WEB_DIR = ASSETS / "web"
IMAGES_DIR = ASSETS / "images"
SPRITES_DIR = ASSETS / "sprites"
AUDIO_DIR = ASSETS / "audio"

for d in (WEB_DIR, IMAGES_DIR, SPRITES_DIR, AUDIO_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------------------------
# Image utilities & Background Removal
# ---------------------------------------------------------------------------------------------

def _lut_mask(img: Image.Image, test) -> Image.Image:
    return img.point([255 if test(v) else 0 for v in range(256)])

def flood_from_border(candidates: Image.Image) -> Image.Image:
    w, h = candidates.size
    data = candidates.tobytes()
    seen = bytearray(w * h)
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        row = y * w
        if not data[row + x] or seen[row + x]:
            continue
        left = x
        while left > 0 and data[row + left - 1] and not seen[row + left - 1]:
            left -= 1
        right = x
        while right < w - 1 and data[row + right + 1] and not seen[row + right + 1]:
            right += 1
        seen[row + left : row + right + 1] = b"\x01" * (right - left + 1)
        for ny in (y - 1, y + 1):
            if 0 <= ny < h:
                nrow = ny * w
                inside = False
                for nx in range(left, right + 1):
                    ok = data[nrow + nx] and not seen[nrow + nx]
                    if ok and not inside:
                        stack.append((nx, ny))
                    inside = bool(ok)
    return Image.frombytes("L", (w, h), bytes(b * 255 for b in seen))

def grow_into(background: Image.Image, candidates: Image.Image, rounds: int) -> Image.Image:
    for _ in range(rounds):
        grown = background.filter(ImageFilter.MaxFilter(3))
        background = ImageChops.lighter(background, ImageChops.multiply(grown, candidates))
    return background

def remove_white_bg(rgba: Image.Image, limit: int = 240, fringe: int = 2) -> Image.Image:
    rgb = rgba.convert("RGB")
    r, g, b = rgb.split()
    darkest = ImageChops.darker(ImageChops.darker(r, g), b)
    strict = _lut_mask(darkest, lambda v: v >= limit)
    bg = flood_from_border(strict)
    loose = _lut_mask(darkest, lambda v: v >= max(180, limit - 40))
    bg = grow_into(bg, loose, rounds=fringe)
    alpha = ImageChops.invert(bg)
    out = rgba.copy()
    out.putalpha(ImageChops.multiply(alpha, rgba.getchannel("A")))
    return out

def tight_bbox(img: Image.Image, threshold: int = 15) -> tuple[int, int, int, int] | None:
    alpha = img.getchannel("A")
    bbox = alpha.point(lambda v: 255 if v >= threshold else 0).getbbox()
    return bbox

def make_seamless(img: Image.Image, blend_w: int = 40) -> Image.Image:
    """Make an image tile seamlessly by blending opposite edges."""
    w, h = img.size
    rgba = img.convert("RGBA")
    # Shift by half
    shifted = Image.new("RGBA", (w, h))
    shifted.paste(rgba.crop((w // 2, 0, w, h)), (0, 0))
    shifted.paste(rgba.crop((0, 0, w // 2, h)), (w // 2, 0))
    # Shift vertical
    res = Image.new("RGBA", (w, h))
    res.paste(shifted.crop((0, h // 2, w, h)), (0, 0))
    res.paste(shifted.crop((0, 0, w, h // 2)), (0, h // 2))

    # Feather central seam with original
    mask_x = Image.new("L", (w, h), 0)
    draw_x = ImageDraw.Draw(mask_x)
    for i in range(blend_w):
        val = int(255 * (1 - abs(i - blend_w // 2) / (blend_w // 2)))
        x = w // 2 - blend_w // 2 + i
        draw_x.line([(x, 0), (x, h)], fill=val)
    mask_x = mask_x.filter(ImageFilter.GaussianBlur(8))
    
    out = Image.composite(rgba, res, mask_x)
    return out.convert("RGB")

def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  [PNG] {path.relative_to(ROOT)} ({img.width}x{img.height}) {path.stat().st_size / 1024:.1f} KB")

def save_webp(img: Image.Image, path: Path, quality: int = 85) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)
    print(f"  [WEBP] {path.relative_to(ROOT)} ({img.width}x{img.height}) {path.stat().st_size / 1024:.1f} KB")

# ---------------------------------------------------------------------------------------------
# 1. Process Hero & Web Images (Đợt 3 & 2)
# ---------------------------------------------------------------------------------------------

def build_web_and_portraits() -> None:
    print("\n--- Processing Web Images & Portraits ---")
    # Web Cover: 1100 x 614
    cover_files = list(BRAIN.glob("vothisau_cover_*.jpg"))
    if cover_files:
        cover_img = Image.open(cover_files[0]).convert("RGB")
        cover_resized = cover_img.resize((1100, 614), Image.LANCZOS)
        save_webp(cover_resized, WEB_DIR / "vothisau-cover.webp", quality=88)

    # Web Codex: 896 x 1200
    codex_files = list(BRAIN.glob("vothisau_codex_*.jpg"))
    if codex_files:
        codex_img = Image.open(codex_files[0]).convert("RGB")
        codex_resized = codex_img.resize((896, 1200), Image.LANCZOS)
        save_webp(codex_resized, WEB_DIR / "vothisau-codex.webp", quality=90)

    # Portrait Sau: 256 x 256
    sau_files = list(BRAIN.glob("portrait_sau_*.jpg"))
    if sau_files:
        p_sau = Image.open(sau_files[0]).convert("RGB").resize((256, 256), Image.LANCZOS)
        save_png(p_sau, IMAGES_DIR / "portrait_sau.png")

    # Portrait Bay: 256 x 256
    bay_files = list(BRAIN.glob("portrait_bay_*.jpg"))
    if bay_files:
        p_bay = Image.open(bay_files[0]).convert("RGB").resize((256, 256), Image.LANCZOS)
        save_png(p_bay, IMAGES_DIR / "portrait_bay.png")

    # Portrait Officer: 256 x 256
    off_files = list(BRAIN.glob("portrait_officer_*.jpg"))
    if off_files:
        p_off = Image.open(off_files[0]).convert("RGB").resize((256, 256), Image.LANCZOS)
        save_png(p_off, IMAGES_DIR / "portrait_officer.png")

# ---------------------------------------------------------------------------------------------
# 2. Process Ground & Props (Đợt 2)
# ---------------------------------------------------------------------------------------------

def build_grounds_and_props() -> None:
    print("\n--- Processing Grounds & Props ---")
    # Ground Forest: 256 x 256 seamless
    g_forest_files = list(BRAIN.glob("ground_forest_*.jpg"))
    if g_forest_files:
        gf = Image.open(g_forest_files[0]).convert("RGB").resize((256, 256), Image.LANCZOS)
        gf_seamless = make_seamless(gf, blend_w=32)
        save_png(gf_seamless, IMAGES_DIR / "ground_forest.png")

    # Ground Market: 256 x 256 seamless
    g_market_files = list(BRAIN.glob("ground_market_*.jpg"))
    if g_market_files:
        gm = Image.open(g_market_files[0]).convert("RGB").resize((256, 256), Image.LANCZOS)
        gm_seamless = make_seamless(gm, blend_w=32)
        save_png(gm_seamless, IMAGES_DIR / "ground_market.png")

    # Helper for cropping and anchoring props
    def process_prop(src_glob: str, out_name: str, target_w: int, target_h: int, flip: bool = False, tint=None):
        files = list(BRAIN.glob(src_glob))
        if not files:
            return
        img = Image.open(files[0]).convert("RGBA")
        if flip:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        clean = remove_white_bg(img, limit=238, fringe=2)
        bbox = tight_bbox(clean)
        if bbox:
            cropped = clean.crop(bbox)
        else:
            cropped = clean
        # Resize to fit within target_w x target_h while maintaining bottom-center anchor
        ratio = min(target_w / cropped.width, target_h / cropped.height)
        nw, nh = max(1, round(cropped.width * ratio)), max(1, round(cropped.height * ratio))
        resized = cropped.resize((nw, nh), Image.LANCZOS)
        
        # Place on target canvas anchored at middle bottom
        canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        ox = (target_w - nw) // 2
        oy = target_h - nh
        canvas.paste(resized, (ox, oy), resized)
        if tint:
            # Subtle tinting
            r, g, b, a = canvas.split()
            canvas = Image.merge("RGBA", (r.point(lambda v: int(v * tint[0])),
                                          g.point(lambda v: int(v * tint[1])),
                                          b.point(lambda v: int(v * tint[2])),
                                          a))
        save_png(canvas, IMAGES_DIR / out_name)

    # Rubber tree A & B: 150 x 260
    process_prop("rubber_tree_*.jpg", "prop_rubber_tree_a.png", 150, 260)
    process_prop("rubber_tree_*.jpg", "prop_rubber_tree_b.png", 150, 260, flip=True, tint=(0.95, 1.02, 0.95))

    # Bush A & B: 130 x 100
    process_prop("prop_bush_*.jpg", "prop_bush_a.png", 130, 100)
    process_prop("prop_bush_*.jpg", "prop_bush_b.png", 130, 100, flip=True, tint=(1.03, 0.97, 0.95))

    # Stalls: 200 x 150
    process_prop("prop_stall_*.jpg", "prop_stall_a.png", 200, 150)
    process_prop("prop_stall_*.jpg", "prop_stall_b.png", 200, 150, flip=True)
    # Fruit stall variant with red cloth banner and fruit baskets
    stall_files = list(BRAIN.glob("prop_stall_*.jpg"))
    if stall_files:
        st = Image.open(stall_files[0]).convert("RGBA")
        st_clean = remove_white_bg(st, limit=238)
        bb = tight_bbox(st_clean)
        st_c = st_clean.crop(bb) if bb else st_clean
        ratio = min(200 / st_c.width, 150 / st_c.height)
        nw, nh = round(st_c.width * ratio), round(st_c.height * ratio)
        st_res = st_c.resize((nw, nh), Image.LANCZOS)
        fruit_canvas = Image.new("RGBA", (200, 150), (0, 0, 0, 0))
        fruit_canvas.paste(st_res, ((200 - nw) // 2, 150 - nh), st_res)
        # Draw festive fruit stall elements (red banner + extra fruit accents)
        d = ImageDraw.Draw(fruit_canvas)
        d.rectangle([(30, 25), (170, 38)], fill=(185, 28, 28, 230), outline=(130, 15, 15, 255))
        d.text((45, 26), "HOA QUA DAT DO", fill=(255, 240, 180, 255))
        save_png(fruit_canvas, IMAGES_DIR / "prop_stall_fruit.png")

        # Rope stall with dangling cargo basket: 200 x 170
        rope_canvas = Image.new("RGBA", (200, 170), (0, 0, 0, 0))
        rope_canvas.paste(st_res, ((200 - nw) // 2, 170 - nh), st_res)
        rd = ImageDraw.Draw(rope_canvas)
        # Prominent hanging rope and suspended wooden basket
        rd.line([(155, 45), (155, 95)], fill=(190, 150, 90, 255), width=3)
        rd.line([(154, 45), (154, 95)], fill=(110, 80, 45, 255), width=1)
        # Basket
        rd.ellipse([(140, 95), (170, 120)], fill=(140, 100, 60, 255), outline=(90, 60, 30, 255), width=2)
        rd.line([(140, 107), (170, 107)], fill=(200, 160, 100, 255), width=2)
        save_png(rope_canvas, IMAGES_DIR / "prop_rope_stall.png")

    # Well: 110 x 110
    process_prop("prop_well_*.jpg", "prop_well.png", 110, 110)

    # Cart: 150 x 90
    process_prop("prop_cart_*.jpg", "prop_cart.png", 150, 90)

    # Barrier: 120 x 110
    process_prop("prop_gate_barrier_*.jpg", "prop_gate_barrier.png", 120, 110)

    # Brick wall: 128 x 120
    process_prop("prop_wall_brick_*.jpg", "prop_wall_brick.png", 128, 120)

    # Additional props: fern (70x56), leaf_pile (60x30), log (120x40), crate (64x56), hatch (110x70), post_bay (170x150)
    # Fern:
    fern = Image.new("RGBA", (70, 56), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fern)
    for ang in range(-50, 60, 18):
        rad = math.radians(ang - 90)
        ex = int(35 + 24 * math.cos(rad))
        ey = int(48 + 24 * math.sin(rad))
        fd.line([(35, 48), (ex, ey)], fill=(34, 115, 45, 240), width=3)
        # Fronds
        for t in (0.4, 0.7, 0.9):
            px, py = 35 + (ex - 35) * t, 48 + (ey - 48) * t
            fd.line([(px - 4, py - 2), (px + 4, py + 2)], fill=(46, 139, 87, 240), width=2)
    save_png(fern, IMAGES_DIR / "prop_fern.png")

    # Leaf pile: 60 x 30
    leaf_pile = Image.new("RGBA", (60, 30), (0, 0, 0, 0))
    ld = ImageDraw.Draw(leaf_pile)
    ld.ellipse([(5, 10), (55, 28)], fill=(101, 67, 33, 220))
    # Dried leaves scattered
    random.seed(42)
    for _ in range(35):
        lx = random.randint(10, 50)
        ly = random.randint(12, 26)
        col = random.choice([(140, 70, 20, 240), (120, 50, 15, 240), (90, 40, 10, 240), (160, 90, 30, 240)])
        ld.ellipse([(lx, ly), (lx + 6, ly + 3)], fill=col)
    save_png(leaf_pile, IMAGES_DIR / "prop_leaf_pile.png")

    # Log: 120 x 40
    log = Image.new("RGBA", (120, 40), (0, 0, 0, 0))
    logd = ImageDraw.Draw(log)
    # Trunk
    logd.rounded_rectangle([(15, 12), (105, 34)], radius=8, fill=(80, 55, 35, 255), outline=(50, 35, 20, 255), width=2)
    # End ring cut
    logd.ellipse([(95, 12), (115, 34)], fill=(120, 85, 55, 255), outline=(70, 45, 25, 255), width=2)
    logd.ellipse([(100, 17), (110, 29)], outline=(90, 60, 35, 255), width=1)
    # Bark texture lines
    for ly in (18, 24, 28):
        logd.line([(25, ly), (95, ly)], fill=(65, 45, 28, 255), width=1)
    # Moss
    logd.ellipse([(35, 10), (60, 18)], fill=(45, 95, 35, 220))
    save_png(log, IMAGES_DIR / "prop_log.png")

    # Crate: 64 x 56
    crate = Image.new("RGBA", (64, 56), (0, 0, 0, 0))
    cd = ImageDraw.Draw(crate)
    cd.rectangle([(8, 8), (56, 52)], fill=(160, 110, 65, 255), outline=(90, 60, 30, 255), width=2)
    cd.rectangle([(12, 12), (52, 48)], fill=(180, 125, 75, 255), outline=(120, 80, 40, 255), width=2)
    cd.line([(12, 12), (52, 48)], fill=(90, 60, 30, 255), width=2)
    cd.line([(12, 48), (52, 12)], fill=(90, 60, 30, 255), width=2)
    # Metal corner brackets
    for cx, cy in [(8, 8), (50, 8), (8, 46), (50, 46)]:
        cd.rectangle([(cx, cy), (cx + 6, cy + 6)], fill=(70, 70, 75, 255))
    save_png(crate, IMAGES_DIR / "prop_crate.png")

    # Tunnel hatch: 110 x 70
    hatch = Image.new("RGBA", (110, 70), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hatch)
    # Dirt mound rim
    hd.ellipse([(10, 15), (100, 65)], fill=(75, 45, 25, 255), outline=(50, 30, 15, 255), width=3)
    # Heavy wooden double door
    hd.ellipse([(20, 22), (90, 58)], fill=(110, 75, 45, 255), outline=(40, 25, 12, 255), width=2)
    # Planks
    hd.line([(55, 22), (55, 58)], fill=(40, 25, 12, 255), width=2)
    # Iron hinges
    hd.line([(30, 32), (50, 32)], fill=(45, 45, 50, 255), width=3)
    hd.line([(30, 48), (50, 48)], fill=(45, 45, 50, 255), width=3)
    hd.line([(60, 32), (80, 32)], fill=(45, 45, 50, 255), width=3)
    hd.line([(60, 48), (80, 48)], fill=(45, 45, 50, 255), width=3)
    # Iron ring pull
    hd.ellipse([(50, 36), (60, 46)], outline=(50, 50, 55, 255), width=2)
    save_png(hatch, IMAGES_DIR / "prop_tunnel_hatch.png")

    # Post Bay (Underground liaison dugout): 170 x 150
    post = Image.new("RGBA", (170, 150), (0, 0, 0, 0))
    pd = ImageDraw.Draw(post)
    # Earth mound
    pd.chord([(15, 40), (155, 160)], 180, 360, fill=(70, 48, 30, 255), outline=(45, 30, 18, 255), width=3)
    # Foliage cover on mound
    for px, py in [(30, 60), (60, 50), (90, 48), (125, 55), (140, 70)]:
        pd.ellipse([(px - 16, py - 12), (px + 16, py + 12)], fill=(35, 80, 40, 230))
    # Dugout entrance with stout timber frame
    pd.rectangle([(60, 75), (110, 140)], fill=(15, 12, 10, 255))
    pd.rectangle([(54, 70), (64, 142)], fill=(120, 80, 45, 255), outline=(70, 45, 25, 255), width=2)
    pd.rectangle([(106, 70), (116, 142)], fill=(120, 80, 45, 255), outline=(70, 45, 25, 255), width=2)
    pd.rectangle([(50, 66), (120, 76)], fill=(140, 95, 55, 255), outline=(70, 45, 25, 255), width=2)
    # Dim lantern glow inside
    pd.ellipse([(80, 95), (90, 105)], fill=(255, 190, 80, 180))
    save_png(post, IMAGES_DIR / "prop_post_bay.png")

# ---------------------------------------------------------------------------------------------
# 3. Process Items, Emotes & Effects (Đợt 3)
# ---------------------------------------------------------------------------------------------

def build_items_and_fx() -> None:
    print("\n--- Processing Items, Emotes & FX ---")
    # Pebble: 48 x 48
    pebble = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    pbd = ImageDraw.Draw(pebble)
    pbd.ellipse([(14, 14), (34, 34)], fill=(140, 135, 130, 255), outline=(80, 75, 70, 255), width=2)
    pbd.ellipse([(18, 16), (28, 24)], fill=(175, 170, 165, 255))
    save_png(pebble, IMAGES_DIR / "item_pebble.png")

    # Grenade: 64 x 64
    grenade = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grenade)
    # Cast iron pineapple body
    gd.ellipse([(16, 20), (48, 56)], fill=(55, 65, 50, 255), outline=(30, 38, 28, 255), width=2)
    # Grid segmentation grooves
    for gy in (28, 36, 44):
        gd.line([(20, gy), (44, gy)], fill=(30, 38, 28, 255), width=2)
    for gx in (26, 32, 38):
        gd.line([(gx, 23), (gx, 53)], fill=(30, 38, 28, 255), width=2)
    # Fuse neck & fly-off lever
    gd.rectangle([(28, 12), (36, 20)], fill=(90, 85, 80, 255), outline=(40, 40, 40, 255), width=1)
    gd.arc([(30, 8), (46, 24)], 160, 320, fill=(180, 180, 180, 255), width=2)
    save_png(grenade, IMAGES_DIR / "item_grenade.png")

    # Shimmering secret paper: 4 frames of 48 x 48 = 192 x 48
    paper_sheet = Image.new("RGBA", (192, 48), (0, 0, 0, 0))
    psd = ImageDraw.Draw(paper_sheet)
    for f in range(4):
        x0 = f * 48
        # Document
        psd.rectangle([(x0 + 10, 8), (x0 + 38, 40)], fill=(245, 235, 210, 255), outline=(160, 130, 90, 255), width=2)
        # Red resistance stamp
        psd.rectangle([(x0 + 14, 12), (x0 + 26, 20)], outline=(190, 30, 30, 255), width=1)
        # Text lines
        for ly in (24, 28, 32, 36):
            psd.line([(x0 + 14, ly), (x0 + 34, ly)], fill=(120, 95, 70, 255), width=1)
        # Sparkle glimmer
        spark_alpha = int(120 + 130 * math.sin(f * math.pi / 2))
        sx, sy = x0 + 36, 8
        psd.line([(sx - 4, sy), (sx + 4, sy)], fill=(255, 230, 100, spark_alpha), width=2)
        psd.line([(sx, sy - 4), (sx, sy + 4)], fill=(255, 230, 100, spark_alpha), width=2)
    save_png(paper_sheet, IMAGES_DIR / "item_paper.png")

    # Emotes sheet: 5 frames x 64 px = 320 x 64
    # frames: 0: ?, 1: !, 2: ..., 3: eye, 4: zzz
    emotes = Image.new("RGBA", (320, 64), (0, 0, 0, 0))
    ed = ImageDraw.Draw(emotes)
    for i in range(5):
        cx, cy = i * 64 + 32, 32
        # Speech bubble
        ed.ellipse([(cx - 24, cy - 24), (cx + 24, cy + 24)], fill=(255, 255, 255, 245), outline=(30, 30, 35, 255), width=3)
        # Tail
        ed.polygon([(cx - 6, cy + 22), (cx + 6, cy + 22), (cx - 10, cy + 30)], fill=(255, 255, 255, 245))
        ed.line([(cx - 6, cy + 22), (cx - 10, cy + 30), (cx + 6, cy + 22)], fill=(30, 30, 35, 255), width=2)
        
        if i == 0:  # ? (Yellow-gold)
            ed.text((cx - 8, cy - 18), "?", fill=(215, 145, 15, 255), font_size=32)
        elif i == 1:  # ! (Red alert)
            ed.text((cx - 6, cy - 18), "!", fill=(220, 35, 35, 255), font_size=32)
        elif i == 2:  # ...
            for dx in (-10, 0, 10):
                ed.ellipse([(cx + dx - 3, cy - 3), (cx + dx + 3, cy + 3)], fill=(60, 60, 70, 255))
        elif i == 3:  # Eye
            ed.arc([(cx - 16, cy - 12), (cx + 16, cy + 12)], 20, 160, fill=(30, 30, 35, 255), width=3)
            ed.arc([(cx - 16, cy - 12), (cx + 16, cy + 12)], 200, 340, fill=(30, 30, 35, 255), width=3)
            ed.ellipse([(cx - 6, cy - 6), (cx + 6, cy + 6)], fill=(20, 120, 210, 255))
            ed.ellipse([(cx - 2, cy - 2), (cx + 2, cy + 2)], fill=(10, 10, 15, 255))
        elif i == 4:  # zzz
            ed.text((cx - 12, cy - 12), "Z", fill=(100, 110, 190, 255), font_size=20)
            ed.text((cx + 2, cy - 20), "z", fill=(130, 140, 210, 255), font_size=16)
    save_png(emotes, IMAGES_DIR / "emotes.png")

    # Explosion sheet: 6 frames x 128 px = 768 x 128
    explosion = Image.new("RGBA", (768, 128), (0, 0, 0, 0))
    exd = ImageDraw.Draw(explosion)
    for f in range(6):
        cx, cy = f * 128 + 64, 64
        t = (f + 1) / 6.0
        # Expanding blast radius
        r_blast = int(18 + 42 * math.sin(t * math.pi * 0.8))
        if f < 4:
            # Fiery core
            exd.ellipse([(cx - r_blast, cy - r_blast), (cx + r_blast, cy + r_blast)], fill=(255, 80 + int(70 * (1 - t)), 20, 230))
            exd.ellipse([(cx - r_blast * 0.65, cy - r_blast * 0.65), (cx + r_blast * 0.65, cy + r_blast * 0.65)], fill=(255, 210, 50, 245))
            exd.ellipse([(cx - r_blast * 0.35, cy - r_blast * 0.35), (cx + r_blast * 0.35, cy + r_blast * 0.35)], fill=(255, 255, 230, 255))
            # Fire spikes
            for ang in range(0, 360, 40):
                rad = math.radians(ang + f * 15)
                sx = cx + int((r_blast + 12) * math.cos(rad))
                sy = cy + int((r_blast + 12) * math.sin(rad))
                exd.line([(cx, cy), (sx, sy)], fill=(255, 140, 30, 200), width=4)
        # Smoke puffs billowing & dissipating
        smoke_alpha = int(220 * (1 - f / 5.5))
        for sx_off, sy_off in [(-18, -12), (18, -15), (0, -25), (-20, 15), (22, 10)]:
            sr = int(14 + f * 7)
            scx = cx + int(sx_off * (1 + f * 0.4))
            scy = cy + int(sy_off * (1 + f * 0.4))
            exd.ellipse([(scx - sr, scy - sr), (scx + sr, scy + sr)], fill=(80 + f * 15, 75 + f * 15, 70 + f * 15, smoke_alpha))
    save_png(explosion, IMAGES_DIR / "fx_explosion.png")

# ---------------------------------------------------------------------------------------------
# 4. Spritesheets (Đợt 1)
# ---------------------------------------------------------------------------------------------

# Character look palettes
SKIN = (242, 201, 160)
SKIN_SHADOW = (210, 165, 125)

LOOKS = {
    "sau": {
        "top": (47, 111, 115),
        "top_dark": (31, 74, 77),
        "bottom": (21, 21, 28),
        "bottom_dark": (14, 14, 18),
        "hair": (20, 17, 15),
        "scarf": (216, 66, 59),
        "scarf_pattern": True,
    },
    "french_soldier": {
        "top": (140, 138, 82),
        "top_dark": (95, 93, 51),
        "bottom": (75, 74, 44),
        "bottom_dark": (50, 49, 29),
        "hair": (58, 42, 26),
        "hat": "helmet",
        "hat_color": (63, 74, 44),
        "armed": True,
    },
    "viet_gian": {
        "top": (95, 112, 128),
        "top_dark": (62, 76, 88),
        "bottom": (46, 54, 64),
        "bottom_dark": (30, 36, 42),
        "hair": (26, 26, 26),
        "hat": "kepi",
        "hat_color": (62, 76, 88),
        "armband": (185, 28, 28),
        "armed": True,
    },
    "cai_tong": {
        "top": (29, 29, 34),
        "top_dark": (15, 15, 18),
        "bottom": (42, 42, 48),
        "bottom_dark": (25, 25, 30),
        "hair": (17, 17, 17),
        "hat": "cap",
        "hat_color": (17, 17, 20),
        "armband": (216, 66, 59),
        "armed": True,
        "stout": True,
    },
    "dong_chi_bay": {
        "top": (107, 74, 43),
        "top_dark": (74, 50, 27),
        "bottom": (58, 42, 28),
        "bottom_dark": (38, 28, 18),
        "hair": (220, 220, 220),
        "hat": "towel",
        "hat_color": (233, 226, 207),
    },
    "villager_a": {
        "top": (185, 138, 74),
        "top_dark": (138, 100, 49),
        "bottom": (59, 44, 31),
        "bottom_dark": (40, 30, 20),
        "hair": (26, 20, 16),
        "hat": "conical",
        "hat_color": (220, 197, 125),
    },
    "villager_b": {
        "top": (75, 106, 155),
        "top_dark": (52, 73, 109),
        "bottom": (42, 42, 42),
        "bottom_dark": (28, 28, 28),
        "hair": (26, 20, 16),
        "hat": "conical",
        "hat_color": (205, 181, 110),
    },
    "villager_c": {
        "top": (154, 74, 58),
        "top_dark": (110, 48, 37),
        "bottom": (45, 45, 45),
        "bottom_dark": (30, 30, 30),
        "hair": (42, 31, 24),
        "hat": "towel",
        "hat_color": (220, 215, 195),
    },
}

def draw_character_frame(draw: ImageDraw.Draw, x0: int, y0: int, look: dict, facing: str, step: int, pose: str):
    """Draw one detailed character sprite within an 80 x 96 frame.
    Feet anchor sits at y = 72, body centered horizontally at x = 40.
    """
    crouch = 14 if pose == "hide" else 10 if pose == "scared" else 7 if pose == "sneak" else 0
    bob = 1 if (step % 2 == 1 and pose in ("walk", "sneak", "stand")) else 0
    side = facing in ("left", "right")
    dir_sign = -1 if facing == "left" else 1
    
    feet_y = y0 + 72
    anchor_x = x0 + 40
    body_w = 22 if look.get("stout") else 18
    half_bw = body_w // 2

    # Legs & Boots
    leg_col = look["bottom"]
    leg_dark = look["bottom_dark"]
    if pose in ("walk", "sneak"):
        la = 0 if (step % 2 == 0) else -4
        lb = -4 if (step % 2 == 0) else 0
        if side:
            lx1 = anchor_x - 3 + (step % 2) * 4
            lx2 = anchor_x + 1 - (step % 2) * 4
            draw.rectangle([(lx1, feet_y - 18 + la + crouch), (lx1 + 6, feet_y)], fill=leg_dark)
            draw.rectangle([(lx2, feet_y - 18 + lb + crouch), (lx2 + 6, feet_y)], fill=leg_col)
            # Boot feet
            draw.rectangle([(lx1 + dir_sign * 2, feet_y - 4), (lx1 + 6 + dir_sign * 2, feet_y)], fill=(20, 18, 16))
            draw.rectangle([(lx2 + dir_sign * 2, feet_y - 4), (lx2 + 6 + dir_sign * 2, feet_y)], fill=(30, 28, 25))
        else:
            draw.rectangle([(anchor_x - 8, feet_y - 18 + la + crouch), (anchor_x - 1, feet_y)], fill=leg_dark)
            draw.rectangle([(anchor_x + 1, feet_y - 18 + lb + crouch), (anchor_x + 8, feet_y)], fill=leg_col)
            draw.rectangle([(anchor_x - 8, feet_y - 4), (anchor_x - 1, feet_y)], fill=(20, 18, 16))
            draw.rectangle([(anchor_x + 1, feet_y - 4), (anchor_x + 8, feet_y)], fill=(20, 18, 16))
    else:
        draw.rectangle([(anchor_x - 7, feet_y - 16 + crouch), (anchor_x - 1, feet_y)], fill=leg_col)
        draw.rectangle([(anchor_x + 1, feet_y - 16 + crouch), (anchor_x + 7, feet_y)], fill=leg_col)
        draw.rectangle([(anchor_x - 8, feet_y - 4), (anchor_x - 1, feet_y)], fill=(25, 23, 20))
        draw.rectangle([(anchor_x + 1, feet_y - 4), (anchor_x + 8, feet_y)], fill=(25, 23, 20))

    # Torso
    top_y = feet_y - 38 + bob + crouch
    body_h = 22 - crouch // 2
    draw.rectangle([(anchor_x - half_bw, top_y), (anchor_x + half_bw, top_y + body_h)], fill=look["top"], outline=look["top_dark"], width=1)
    
    # Scarf / Armband
    if look.get("scarf"):
        # Chị Sáu khăn rằn checkered scarf
        draw.rectangle([(anchor_x - 7, top_y), (anchor_x + 7, top_y + 6)], fill=(240, 240, 240))
        for scx in range(anchor_x - 6, anchor_x + 7, 3):
            draw.line([(scx, top_y), (scx, top_y + 6)], fill=(216, 66, 59), width=1)
        # Hanging knot
        draw.polygon([(anchor_x - 2, top_y + 6), (anchor_x + 2, top_y + 6), (anchor_x, top_y + 14)], fill=(216, 66, 59))
    if look.get("armband"):
        ab_x = anchor_x + (half_bw - 3 if dir_sign > 0 else -half_bw)
        draw.rectangle([(ab_x, top_y + 4), (ab_x + 4, top_y + 9)], fill=look["armband"])

    # Arms
    arm_col = look["top_dark"]
    if pose == "throw":
        draw.rectangle([(anchor_x + dir_sign * 8, top_y - 12), (anchor_x + dir_sign * 8 + 5, top_y + 6)], fill=arm_col)
        draw.ellipse([(anchor_x + dir_sign * 8, top_y - 14), (anchor_x + dir_sign * 8 + 6, top_y - 8)], fill=SKIN)
        # Grenade held
        draw.ellipse([(anchor_x + dir_sign * 8 + 1, top_y - 18), (anchor_x + dir_sign * 8 + 7, top_y - 12)], fill=(55, 65, 50))
    elif pose == "interact":
        draw.rectangle([(anchor_x + (dir_sign * 6 if side else 6), top_y + 2), (anchor_x + (dir_sign * 6 if side else 6) + 6, top_y + 12)], fill=arm_col)
        draw.ellipse([(anchor_x + (dir_sign * 6 if side else 6) + 1, top_y + 12), (anchor_x + (dir_sign * 6 if side else 6) + 5, top_y + 16)], fill=SKIN)
    elif pose == "scared":
        draw.rectangle([(anchor_x - half_bw - 3, top_y - 8), (anchor_x - half_bw + 2, top_y + 8)], fill=arm_col)
        draw.rectangle([(anchor_x + half_bw - 2, top_y - 8), (anchor_x + half_bw + 3, top_y + 8)], fill=arm_col)
    else:
        draw.rectangle([(anchor_x - half_bw - 3, top_y + 2), (anchor_x - half_bw + 1, top_y + 16)], fill=arm_col)
        draw.rectangle([(anchor_x + half_bw - 1, top_y + 2), (anchor_x + half_bw + 3, top_y + 16)], fill=arm_col)
        draw.ellipse([(anchor_x - half_bw - 2, top_y + 15), (anchor_x - half_bw + 1, top_y + 18)], fill=SKIN)
        draw.ellipse([(anchor_x + half_bw, top_y + 15), (anchor_x + half_bw + 3, top_y + 18)], fill=SKIN)

    # Rifle for armed soldiers
    if look.get("armed") and pose != "scared":
        rifle_x = anchor_x + (half_bw + 2 if dir_sign > 0 else -half_bw - 4)
        draw.rectangle([(rifle_x, top_y - 10), (rifle_x + 3, top_y + 22)], fill=(45, 45, 48), outline=(20, 20, 22))
        draw.rectangle([(rifle_x, top_y + 6), (rifle_x + 3, top_y + 18)], fill=(110, 75, 45))

    # Head & Face
    head_cy = top_y - 9
    draw.ellipse([(anchor_x - 7, head_cy - 7), (anchor_x + 7, head_cy + 7)], fill=SKIN, outline=SKIN_SHADOW, width=1)
    
    # Hair
    hair_col = look["hair"]
    if facing == "up":
        draw.ellipse([(anchor_x - 7, head_cy - 8), (anchor_x + 7, head_cy + 4)], fill=hair_col)
    else:
        draw.ellipse([(anchor_x - 7, head_cy - 8), (anchor_x + 7, head_cy - 1)], fill=hair_col)
        # Braid for Chị Sáu
        if look == LOOKS["sau"]:
            draw.line([(anchor_x - 5, head_cy), (anchor_x - 7, head_cy + 16)], fill=hair_col, width=3)
            draw.ellipse([(anchor_x - 8, head_cy + 15), (anchor_x - 6, head_cy + 18)], fill=(216, 66, 59))

    # Eyes & Mouth
    if facing == "down":
        draw.rectangle([(anchor_x - 4, head_cy - 1), (anchor_x - 2, head_cy + 1)], fill=(25, 25, 30))
        draw.rectangle([(anchor_x + 2, head_cy - 1), (anchor_x + 4, head_cy + 1)], fill=(25, 25, 30))
        draw.line([(anchor_x - 2, head_cy + 4), (anchor_x + 2, head_cy + 4)], fill=(160, 90, 75), width=1)
    elif side:
        eye_x = anchor_x + dir_sign * 3
        draw.rectangle([(eye_x - 1, head_cy - 1), (eye_x + 1, head_cy + 1)], fill=(25, 25, 30))

    # Headwear
    hat = look.get("hat")
    if hat == "conical":
        # Nón lá
        draw.polygon([(anchor_x - 15, head_cy - 1), (anchor_x + 15, head_cy - 1), (anchor_x, head_cy - 14)], fill=look["hat_color"], outline=(160, 140, 80), width=1)
    elif hat == "helmet":
        # French pith helmet
        draw.ellipse([(anchor_x - 11, head_cy - 10), (anchor_x + 11, head_cy - 1)], fill=look["hat_color"], outline=(40, 48, 28), width=1)
        draw.arc([(anchor_x - 13, head_cy - 4), (anchor_x + 13, head_cy + 2)], 0, 180, fill=(35, 42, 25), width=2)
    elif hat == "kepi":
        # Kepi cap
        draw.rectangle([(anchor_x - 8, head_cy - 12), (anchor_x + 8, head_cy - 4)], fill=look["hat_color"], outline=(35, 42, 50), width=1)
        draw.rectangle([(anchor_x - 9, head_cy - 4), (anchor_x + 9, head_cy - 2)], fill=(20, 20, 25))
    elif hat == "cap":
        # Officer peak cap
        draw.ellipse([(anchor_x - 9, head_cy - 11), (anchor_x + 9, head_cy - 4)], fill=look["hat_color"])
        draw.rectangle([(anchor_x - 8, head_cy - 4), (anchor_x + (8 if dir_sign < 0 else 12), head_cy - 2)], fill=(15, 15, 20))
    elif hat == "towel":
        # Khăn rằn turban wrapped around head
        draw.ellipse([(anchor_x - 8, head_cy - 9), (anchor_x + 8, head_cy - 2)], fill=look["hat_color"], outline=(160, 150, 130), width=1)
        draw.rectangle([(anchor_x - 9, head_cy - 6), (anchor_x + 9, head_cy - 4)], fill=(190, 180, 160))

def build_spritesheets() -> None:
    print("\n--- Building Character Spritesheets ---")
    # 1. sau.png: 6 cols x 8 rows = 480 x 768 px
    # Rows: 0: down, 1: left, 2: right, 3: up, 4: sneak, 5: throw, 6: interact, 7: hide
    sau_img = Image.new("RGBA", (480, 768), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sau_img)
    # Row 0: walk down (4 frames)
    for c in range(4):
        draw_character_frame(sd, c * 80, 0 * 96, LOOKS["sau"], "down", c, "walk" if c > 0 else "stand")
    # Row 1: walk left (4 frames)
    for c in range(4):
        draw_character_frame(sd, c * 80, 1 * 96, LOOKS["sau"], "left", c, "walk" if c > 0 else "stand")
    # Row 2: walk right (4 frames)
    for c in range(4):
        draw_character_frame(sd, c * 80, 2 * 96, LOOKS["sau"], "right", c, "walk" if c > 0 else "stand")
    # Row 3: walk up (4 frames)
    for c in range(4):
        draw_character_frame(sd, c * 80, 3 * 96, LOOKS["sau"], "up", c, "walk" if c > 0 else "stand")
    # Row 4: sneak (4 frames, right)
    for c in range(4):
        draw_character_frame(sd, c * 80, 4 * 96, LOOKS["sau"], "right", c, "sneak")
    # Row 5: throw (3 frames: aim, throw, recover)
    for c in range(3):
        draw_character_frame(sd, c * 80, 5 * 96, LOOKS["sau"], "right", c, "throw")
    # Row 6: interact (3 frames)
    for c in range(3):
        draw_character_frame(sd, c * 80, 6 * 96, LOOKS["sau"], "right", c, "interact")
    # Row 7: hide (2 frames)
    for c in range(2):
        draw_character_frame(sd, c * 80, 7 * 96, LOOKS["sau"], "right", c, "hide")
    save_png(sau_img, SPRITES_DIR / "sau.png")

    # 2. Soldiers & Cai Tong: 5 cols x 2 rows = 400 x 192 px
    # Row 0: walk left (5 frames), Row 1: walk right (5 frames)
    for key in ("french_soldier", "viet_gian", "cai_tong"):
        sol_img = Image.new("RGBA", (400, 192), (0, 0, 0, 0))
        sold = ImageDraw.Draw(sol_img)
        for c in range(5):
            draw_character_frame(sold, c * 80, 0, LOOKS[key], "left", c, "walk")
            draw_character_frame(sold, c * 80, 96, LOOKS[key], "right", c, "walk")
        save_png(sol_img, SPRITES_DIR / f"{key}.png")

    # 3. Villagers & Dong Chi Bay: 4 cols x 2 rows = 320 x 192 px
    # Row 0: idle/chatting (4 frames), Row 1: scared (2 frames)
    for key, fname in [("dong_chi_bay", "dong_chi_bay.png"),
                       ("villager_a", "villager_a.png"),
                       ("villager_b", "villager_b.png"),
                       ("villager_c", "villager_c.png")]:
        npc_img = Image.new("RGBA", (320, 192), (0, 0, 0, 0))
        npcd = ImageDraw.Draw(npc_img)
        for c in range(4):
            npcd_facing = "right" if c % 2 == 0 else "down"
            draw_character_frame(npcd, c * 80, 0, LOOKS[key], npcd_facing, c, "stand")
        for c in range(2):
            draw_character_frame(npcd, c * 80, 96, LOOKS[key], "down", c, "scared")
        save_png(npc_img, SPRITES_DIR / fname)

# ---------------------------------------------------------------------------------------------
# 5. Audio Synthesizer (Đợt 4)
# ---------------------------------------------------------------------------------------------

def write_wav(filename: Path, samples: list[float], sample_rate: int = 44100) -> None:
    filename.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(filename), "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        packed = bytearray()
        for s in samples:
            val = max(-1.0, min(1.0, s))
            ival = int(val * 32767.0)
            packed.extend(struct.pack("<h", ival))
        w.writeframes(packed)
    print(f"  [AUDIO] {filename.relative_to(ROOT)} ({len(samples)/sample_rate:.2f}s) {filename.stat().st_size / 1024:.1f} KB")

def build_audio() -> None:
    print("\n--- Generating Audio Effects & Music Loops ---")
    sr = 44100
    random.seed(1933)

    # 1. sfx_footstep_leaf.wav (0.2s)
    n = int(sr * 0.2)
    s = [random.uniform(-0.6, 0.6) * (1 - i / n) * math.exp(-i / (sr * 0.05)) for i in range(n)]
    write_wav(AUDIO_DIR / "sfx_footstep_leaf.wav", s, sr)

    # 2. sfx_pebble.wav (0.2s)
    n = int(sr * 0.2)
    s = []
    for i in range(n):
        t = i / sr
        freq = 1200 - 400 * t
        env = math.exp(-t * 28)
        s.append((math.sin(2 * math.pi * freq * t) * 0.7 + random.uniform(-0.3, 0.3)) * env)
    write_wav(AUDIO_DIR / "sfx_pebble.wav", s, sr)

    # 3. sfx_whistle_signal.wav (0.6s)
    n = int(sr * 0.6)
    s = []
    for i in range(n):
        t = i / sr
        freq = 880 + 320 * math.sin(t * math.pi / 0.6) + 15 * math.sin(t * 30)
        env = math.sin(t * math.pi / 0.6)
        s.append(math.sin(2 * math.pi * freq * t) * 0.6 * env)
    write_wav(AUDIO_DIR / "sfx_whistle_signal.wav", s, sr)

    # 4. sfx_alert.wav (0.35s)
    n = int(sr * 0.35)
    s = []
    for i in range(n):
        t = i / sr
        freq = 550 if t < 0.12 else 880
        env = 1.0 - (t % 0.12) / 0.12 if t < 0.24 else max(0.0, 1.0 - (t - 0.24) / 0.11)
        s.append((math.sin(2 * math.pi * freq * t) * 0.7 + math.sin(2 * math.pi * freq * 2 * t) * 0.2) * env)
    write_wav(AUDIO_DIR / "sfx_alert.wav", s, sr)

    # 5. sfx_question.wav (0.3s)
    n = int(sr * 0.3)
    s = []
    for i in range(n):
        t = i / sr
        freq = 440 + 400 * (t / 0.3)
        env = math.sin(t * math.pi / 0.3)
        s.append(math.sin(2 * math.pi * freq * t) * 0.6 * env)
    write_wav(AUDIO_DIR / "sfx_question.wav", s, sr)

    # 6. sfx_pickup_paper.wav (0.5s)
    n = int(sr * 0.5)
    s = []
    for i in range(n):
        t = i / sr
        env = math.sin(t * math.pi / 0.5) * (0.5 + 0.5 * math.sin(t * 40))
        s.append(random.uniform(-0.6, 0.6) * env)
    write_wav(AUDIO_DIR / "sfx_pickup_paper.wav", s, sr)

    # 7. sfx_grenade_throw.wav (0.4s)
    n = int(sr * 0.4)
    s = []
    for i in range(n):
        t = i / sr
        freq = 400 - 250 * t
        env = math.sin(t * math.pi / 0.4)
        s.append((math.sin(2 * math.pi * freq * t) * 0.4 + random.uniform(-0.3, 0.3)) * env)
    write_wav(AUDIO_DIR / "sfx_grenade_throw.wav", s, sr)

    # 8. sfx_explosion.wav (1.8s)
    n = int(sr * 1.8)
    s = []
    for i in range(n):
        t = i / sr
        bass = math.sin(2 * math.pi * 55 * t) * math.exp(-t * 3.5)
        rumble = random.uniform(-0.8, 0.8) * math.exp(-t * 2.2)
        crackle = (random.uniform(-0.5, 0.5) if random.random() < 0.15 else 0.0) * math.exp(-t * 1.5)
        s.append((bass * 0.6 + rumble * 0.4 + crackle) * min(1.0, t * 50))
    write_wav(AUDIO_DIR / "sfx_explosion.wav", s, sr)

    # 9. sfx_police_whistle.wav (1.0s)
    n = int(sr * 1.0)
    s = []
    for i in range(n):
        t = i / sr
        f1, f2 = 2400, 2650
        trem = 0.8 + 0.2 * math.sin(2 * math.pi * 32 * t)
        env = min(1.0, t * 20) * min(1.0, (1.0 - t) * 10)
        s.append((math.sin(2 * math.pi * f1 * t) + math.sin(2 * math.pi * f2 * t)) * 0.35 * trem * env)
    write_wav(AUDIO_DIR / "sfx_police_whistle.wav", s, sr)

    # 10. sfx_rope_cut.wav (0.2s)
    n = int(sr * 0.2)
    s = [math.sin(2 * math.pi * 1800 * (i/sr)) * math.exp(-i / (sr * 0.03)) + random.uniform(-0.4, 0.4) * math.exp(-i / (sr * 0.05)) for i in range(n)]
    write_wav(AUDIO_DIR / "sfx_rope_cut.wav", s, sr)

    # 11. sfx_crate_fall.wav (0.8s)
    n = int(sr * 0.8)
    s = []
    for i in range(n):
        t = i / sr
        thud = math.sin(2 * math.pi * 75 * t) * math.exp(-t * 8)
        crack = random.uniform(-0.7, 0.7) * math.exp(-t * 5)
        s.append(thud * 0.6 + crack * 0.4)
    write_wav(AUDIO_DIR / "sfx_crate_fall.wav", s, sr)

    # 12. sfx_crowd_murmur.wav (6.0s loop)
    n = int(sr * 6.0)
    s = [0.0] * n
    for _ in range(8):
        freq = random.randint(180, 420)
        mod = random.uniform(1.5, 4.0)
        for i in range(n):
            t = i / sr
            s[i] += math.sin(2 * math.pi * freq * t) * (0.04 + 0.03 * math.sin(2 * math.pi * mod * t))
    write_wav(AUDIO_DIR / "sfx_crowd_murmur.wav", s, sr)

    # 13. sfx_heartbeat.wav (1.0s loop)
    n = int(sr * 1.0)
    s = []
    for i in range(n):
        t = i / sr
        val = 0.0
        if t < 0.15:
            val += math.sin(2 * math.pi * 60 * t) * math.exp(-t * 25)
        elif 0.25 <= t < 0.45:
            dt = t - 0.25
            val += math.sin(2 * math.pi * 50 * dt) * math.exp(-dt * 20) * 0.7
        s.append(val * 0.8)
    write_wav(AUDIO_DIR / "sfx_heartbeat.wav", s, sr)

    # 14. sfx_boots_on_floor.wav (1.8s)
    n = int(sr * 1.8)
    s = []
    for i in range(n):
        t = i / sr
        val = 0.0
        for step_t in (0.2, 0.7, 1.2):
            if step_t <= t < step_t + 0.25:
                dt = t - step_t
                val += (math.sin(2 * math.pi * 90 * dt) * 0.6 + random.uniform(-0.3, 0.3)) * math.exp(-dt * 25)
        s.append(val)
    write_wav(AUDIO_DIR / "sfx_boots_on_floor.wav", s, sr)

    # 15. sfx_table_slam.wav (0.5s)
    n = int(sr * 0.5)
    s = []
    for i in range(n):
        t = i / sr
        thud = math.sin(2 * math.pi * 65 * t) * math.exp(-t * 10)
        reverb = random.uniform(-0.4, 0.4) * math.exp(-t * 6)
        s.append(thud * 0.7 + reverb * 0.3)
    write_wav(AUDIO_DIR / "sfx_table_slam.wav", s, sr)

    # 16. bgm_forest_night.wav (16.0s ambient loop)
    n = int(sr * 16.0)
    s = [0.0] * n
    for i in range(n):
        t = i / sr
        # Deep night wind drone
        wind = math.sin(2 * math.pi * 55 * t + math.sin(2 * math.pi * 0.2 * t)) * 0.15
        # Soft cicadas / night insects
        cicada = math.sin(2 * math.pi * 3200 * t) * (0.03 + 0.02 * math.sin(2 * math.pi * 4 * t))
        s[i] = wind + cicada
    write_wav(AUDIO_DIR / "bgm_forest_night.wav", s, sr)

    # 17. bgm_patrol.wav (12.0s loop)
    n = int(sr * 12.0)
    s = [0.0] * n
    for i in range(n):
        t = i / sr
        # Pulsing low heartbeat/bassline
        bass = math.sin(2 * math.pi * 65 * t) * (0.15 + 0.1 * math.sin(2 * math.pi * 1.5 * t))
        # Wooden mõ clapper tick every 0.66s
        step_pos = (t % 0.66)
        click = (math.sin(2 * math.pi * 650 * step_pos) * math.exp(-step_pos * 40)) * 0.2 if step_pos < 0.1 else 0.0
        s[i] = bass + click
    write_wav(AUDIO_DIR / "bgm_patrol.wav", s, sr)

    # 18. bgm_market.wav (16.0s loop)
    n = int(sr * 16.0)
    s = [0.0] * n
    # Pentatonic melody notes (C, D, E, G, A in Hz)
    penta = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]
    for beat in range(32):
        bt = beat * 0.5
        note = penta[(beat * 2) % len(penta)]
        start_idx = int(bt * sr)
        for i in range(int(sr * 0.45)):
            if start_idx + i < n:
                t_note = i / sr
                env = math.exp(-t_note * 4) * math.sin(t_note * math.pi / 0.45)
                s[start_idx + i] += math.sin(2 * math.pi * note * t_note) * 0.12 * env
    write_wav(AUDIO_DIR / "bgm_market.wav", s, sr)

    # 19. bgm_chase.wav (10.0s urgent loop)
    n = int(sr * 10.0)
    s = [0.0] * n
    for beat in range(40):
        bt = beat * 0.25
        start_idx = int(bt * sr)
        for i in range(int(sr * 0.2)):
            if start_idx + i < n:
                t_drum = i / sr
                drum = (math.sin(2 * math.pi * 80 * t_drum) * 0.4 + random.uniform(-0.3, 0.3) * 0.3) * math.exp(-t_drum * 18)
                s[start_idx + i] += drum
    write_wav(AUDIO_DIR / "bgm_chase.wav", s, sr)

    # 20. bgm_dan_tranh.wav (22.0s heroic Vietnamese pentatonic melody, fits under 2MB limit)
    n = int(sr * 22.0)
    s = [0.0] * n
    # Pentatonic scale (Hò, Xự, Xang, Xê, Cống): D, F, G, A, C
    dt_scale = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99]
    melody_pattern = [0, 2, 3, 4, 3, 2, 0, 1, 2, 4, 5, 4, 2, 3, 2, 0]
    for m_idx, note_idx in enumerate(melody_pattern * 2):
        t_start = m_idx * 0.75
        freq = dt_scale[note_idx % len(dt_scale)]
        start_idx = int(t_start * sr)
        for i in range(int(sr * 1.2)):
            if start_idx + i < n:
                t_pluck = i / sr
                # Đàn tranh: bright sharp attack with rich harmonics and pitch bend/rung
                vib = math.sin(2 * math.pi * 5.0 * t_pluck) * 4.0
                tone = (math.sin(2 * math.pi * (freq + vib) * t_pluck) * 0.5 +
                        math.sin(2 * math.pi * (freq * 2 + vib) * t_pluck) * 0.25 +
                        math.sin(2 * math.pi * (freq * 3 + vib) * t_pluck) * 0.12)
                env = math.exp(-t_pluck * 3.5)
                s[start_idx + i] += tone * 0.25 * env
    write_wav(AUDIO_DIR / "bgm_dan_tranh.wav", s, sr)

# ---------------------------------------------------------------------------------------------
# Main Build Execution
# ---------------------------------------------------------------------------------------------

def main() -> None:
    print("=================================================================")
    print("  Building All Vo Thi Sau Assets for public/assets/vothisau/")
    print("=================================================================")
    build_web_and_portraits()
    build_grounds_and_props()
    build_items_and_fx()
    build_spritesheets()
    build_audio()
    print("\n[SUCCESS] All assets generated and organized successfully!")

if __name__ == "__main__":
    main()
