"""Build the full Chị Võ Thị Sáu spritesheet (public/assets/vothisau/sprites/sau.png).

Complies with 06-Yeu-cau-sua-asset-cho-Antigravity.md:
- 6 columns x 8 rows = 480 x 768 px
- Cell size: 80 x 96 px
- Anchor: Feet at y = 71/72, centered horizontally at x = 40
- Young female heroine Vo Thi Sau (17 years old, slender and graceful):
  * Brown silk ao ba ba with tailored waist
  * Black and white checkered khan ran scarf
  * Glossy black hair parted in middle with golden le-ki-ma flower
  * Long braided hair trailing over shoulder / down back (never obscuring face)
  * Black silk trousers, bare feet
- 8 Animation Rows:
  * Row 0: Walk Down (4 frames, authentic stepping legs & bob)
  * Row 1: Walk Left (4 frames, facing left)
  * Row 2: Walk Right (4 frames, facing right, braid behind)
  * Row 3: Walk Up (4 frames, slender back & long braid, NOT a black blob)
  * Row 4: Sneak / Crouch Walk (4 frames, low posture)
  * Row 5: Throw Grenade (3 frames, raise arm, throw, follow through)
  * Row 6: Interact / Cut Wire (3 frames, reach up, cut, release)
  * Row 7: Hide / Crouch (2 frames, low huddle)
"""

from __future__ import annotations
import math
from pathlib import Path
from collections import deque
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

ROOT = Path(__file__).resolve().parents[2]
BRAIN = Path(r"C:\Users\NinhLe\.gemini\antigravity-ide\brain\2a19e589-87c7-4daf-aa10-cb1fcf956a7f")
DST = ROOT / "public" / "assets" / "vothisau" / "sprites" / "sau.png"

FRAME_W, FRAME_H = 80, 96
FEET_Y = 71
CENTER_X = 40
TARGET_HEIGHT = 67

def clean_bg(img_path: Path) -> np.ndarray:
    im = Image.open(img_path).convert("RGBA")
    arr = np.array(im)
    rgb = arr[..., :3].astype(np.float32)
    is_white = (rgb[..., 0] > 238) & (rgb[..., 1] > 238) & (rgb[..., 2] > 238) & \
               (np.abs(rgb[..., 0] - rgb[..., 1]) < 20) & (np.abs(rgb[..., 1] - rgb[..., 2]) < 20)
    h, w = is_white.shape
    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        if is_white[0, x]: q.append((0, x)); bg_mask[0, x] = True
        if is_white[h - 1, x]: q.append((h - 1, x)); bg_mask[h - 1, x] = True
    for y in range(h):
        if is_white[y, 0]: q.append((y, 0)); bg_mask[y, 0] = True
        if is_white[y, w - 1]: q.append((y, w - 1)); bg_mask[y, w - 1] = True
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and is_white[ny, nx] and not bg_mask[ny, nx]:
                bg_mask[ny, nx] = True
                q.append((ny, nx))
    arr[..., 3] = np.where(bg_mask, 0, 255)
    return arr

def crop_and_place(cropped_rgba: Image.Image, target_h: int = TARGET_HEIGHT, feet_y: int = FEET_Y, center_x: int = CENTER_X) -> Image.Image:
    scale = target_h / cropped_rgba.height
    new_w = max(1, round(cropped_rgba.width * scale))
    new_h = target_h
    res = cropped_rgba.resize((new_w, new_h), Image.LANCZOS)
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    ox = center_x - new_w // 2
    oy = feet_y - new_h + 1
    frame.paste(res, (ox, oy), res)
    return frame

def make_walk_cycle(base_frame: Image.Image, facing: str = "down") -> list[Image.Image]:
    """Create 4-frame walk cycle from a master frame."""
    frames = []
    # Frame 0: base
    frames.append(base_frame)

    # Frame 1: left step forward, right arm/torso sway, bob -1px
    f1 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    # Upper body bob -1px
    upper = base_frame.crop((0, 0, FRAME_W, 50))
    f1.paste(upper, (0, -1), upper)
    # Lower body: left leg forward
    lower = base_frame.crop((0, 50, FRAME_W, FRAME_H))
    if facing == "down":
        # shift left leg left/down 1px, right leg back 1px
        f1.paste(lower.crop((0, 0, 40, 46)), (-1, 51), lower.crop((0, 0, 40, 46)))
        f1.paste(lower.crop((40, 0, 80, 46)), (40, 49), lower.crop((40, 0, 80, 46)))
    elif facing == "up":
        f1.paste(lower.crop((0, 0, 40, 46)), (-1, 49), lower.crop((0, 0, 40, 46)))
        f1.paste(lower.crop((40, 0, 80, 46)), (40, 51), lower.crop((40, 0, 80, 46)))
    else:  # right
        f1.paste(lower.crop((0, 0, 80, 46)), (1, 50), lower.crop((0, 0, 80, 46)))
    frames.append(f1)

    # Frame 2: base pass
    frames.append(base_frame)

    # Frame 3: right step forward, left arm sway, bob -1px
    f3 = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    f3.paste(upper, (0, -1), upper)
    if facing == "down":
        f3.paste(lower.crop((0, 0, 40, 46)), (0, 49), lower.crop((0, 0, 40, 46)))
        f3.paste(lower.crop((40, 0, 80, 46)), (41, 51), lower.crop((40, 0, 80, 46)))
    elif facing == "up":
        f3.paste(lower.crop((0, 0, 40, 46)), (0, 51), lower.crop((0, 0, 40, 46)))
        f3.paste(lower.crop((40, 0, 80, 46)), (39, 49), lower.crop((40, 0, 80, 46)))
    else:  # right
        f3.paste(lower.crop((0, 0, 80, 46)), (-1, 50), lower.crop((0, 0, 80, 46)))
    frames.append(f3)

    return frames

def build_sheet():
    print("Isolating raw artwork...")
    arr_down = clean_bg(BRAIN / "sau_walk_down_1792225722862.jpg")
    arr_up = clean_bg(BRAIN / "sau_walk_up_1792225742586.jpg")
    arr_side = clean_bg(BRAIN / "sau_character_1792224824685.jpg")
    arr_act = clean_bg(BRAIN / "sau_action_poses_1792225762842.jpg")

    def crop_figure(arr):
        ys, xs = np.where(arr[..., 3] > 0)
        return Image.fromarray(arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1])

    base_down = crop_and_place(crop_figure(arr_down), target_h=67)
    base_up = crop_and_place(crop_figure(arr_up), target_h=67)
    base_right = crop_and_place(crop_figure(arr_side), target_h=67)

    # Detect action figures
    lbl, _ = label(arr_act[..., 3] > 0)
    objs = find_objects(lbl)
    comps = []
    for sl in objs:
        y_slice, x_slice = sl
        if (y_slice.stop - y_slice.start) > 60 and (x_slice.stop - x_slice.start) > 30:
            comps.append((y_slice.start, x_slice.start, y_slice.stop, x_slice.stop))
    comps.sort(key=lambda c: (c[0] // 200, c[1]))

    sheet = Image.new("RGBA", (6 * FRAME_W, 8 * FRAME_H), (0, 0, 0, 0))

    # Row 0: Walk Down (4 frames)
    print("Building Row 0: Walk Down...")
    walk_down = make_walk_cycle(base_down, "down")
    for col, f in enumerate(walk_down):
        sheet.paste(f, (col * FRAME_W, 0 * FRAME_H), f)

    # Row 1: Walk Left (4 frames - flipped Row 2)
    print("Building Row 1: Walk Left...")
    walk_right = make_walk_cycle(base_right, "right")
    for col, f in enumerate(walk_right):
        f_left = f.transpose(Image.FLIP_LEFT_RIGHT)
        sheet.paste(f_left, (col * FRAME_W, 1 * FRAME_H), f_left)

    # Row 2: Walk Right (4 frames)
    print("Building Row 2: Walk Right...")
    for col, f in enumerate(walk_right):
        sheet.paste(f, (col * FRAME_W, 2 * FRAME_H), f)

    # Row 3: Walk Up (4 frames)
    print("Building Row 3: Walk Up...")
    walk_up = make_walk_cycle(base_up, "up")
    for col, f in enumerate(walk_up):
        sheet.paste(f, (col * FRAME_W, 3 * FRAME_H), f)

    # Row 4: Sneak (4 frames, leaning right, crouched lower)
    print("Building Row 4: Sneak...")
    sneak_indices = [0, 1, 2, 3]  # Fig 0, 1, 2, 3
    for col, idx in enumerate(sneak_indices):
        y0, x0, y1, x1 = comps[idx]
        fig_crop = Image.fromarray(arr_act[y0:y1, x0:x1])
        # Sneak height ~54 px (crouched)
        f_sneak = crop_and_place(fig_crop, target_h=54, feet_y=FEET_Y)
        sheet.paste(f_sneak, (col * FRAME_W, 4 * FRAME_H), f_sneak)

    # Row 5: Throw Grenade (3 frames)
    print("Building Row 5: Throw...")
    throw_indices = [4, 5, 6]  # Fig 4 (aim), 5 (reach back), 6 (throw forward)
    for col, idx in enumerate(throw_indices):
        y0, x0, y1, x1 = comps[idx]
        fig_crop = Image.fromarray(arr_act[y0:y1, x0:x1])
        f_throw = crop_and_place(fig_crop, target_h=65, feet_y=FEET_Y)
        sheet.paste(f_throw, (col * FRAME_W, 5 * FRAME_H), f_throw)

    # Row 6: Interact / Cut (3 frames)
    print("Building Row 6: Interact...")
    interact_indices = [5, 7, 5]
    for col, idx in enumerate(interact_indices):
        y0, x0, y1, x1 = comps[idx]
        fig_crop = Image.fromarray(arr_act[y0:y1, x0:x1])
        f_int = crop_and_place(fig_crop, target_h=64, feet_y=FEET_Y)
        sheet.paste(f_int, (col * FRAME_W, 6 * FRAME_H), f_int)

    # Row 7: Hide / Crouch (2 frames)
    print("Building Row 7: Hide...")
    hide_indices = [8, 9]  # Fig 8, 9
    for col, idx in enumerate(hide_indices):
        y0, x0, y1, x1 = comps[idx]
        fig_crop = Image.fromarray(arr_act[y0:y1, x0:x1])
        f_hide = crop_and_place(fig_crop, target_h=46, feet_y=FEET_Y)
        sheet.paste(f_hide, (col * FRAME_W, 7 * FRAME_H), f_hide)

    DST.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(DST, optimize=True)
    print(f"Successfully saved {DST} ({sheet.size})!")

    preview_path = DST.parent / "preview_sau.png"
    preview = sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST)
    preview.save(preview_path)
    print(f"Saved 2x preview to {preview_path}!")

if __name__ == "__main__":
    build_sheet()
