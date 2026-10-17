"""Make Chị Sáu's sprite sheet (public/assets/vothisau/sprites/sau.png) from the Kim Đồng sheet.

Why: there is no image-generation route on this machine (no API key, no Codex / Grok CLI), and the
first code-drawn Sáu (draw_sau.py) had a braid over the face and a black blob for the back view.
Kim Đồng's sheet has the right frame size (80 x 96, feet at y = 72), the same painterly look as the
soldiers, and every animation we need, so this script re-dresses it. It is **code-adapted art, not
image-model output**:

  * the indigo shirt becomes a brown bà ba (shading kept),
  * the shorts become long black trousers (the legs below them are painted black down to the ankles),
  * a black-and-white checked scarf (khăn rằn) is added at the collar,
  * a long braid (tóc tết) is added: hanging behind in the side views, down the back in the back view,
    over the shoulder in the front view, with a red tie and a small yellow lê-ki-ma flower.

Layout of the output (6 columns x 8 rows of 80 x 96): walk down / left / right / up (4 frames),
sneak (4), throw (3), interact (3), hide (2); the side poses of the last four face right.

Run from the project root:  python tools/vothisau-art/sau_from_kimdong.py [--preview out.png]
"""

from __future__ import annotations

import argparse
import colorsys
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "assets" / "kimdong" / "sprites" / "kimdong.png"
DST = ROOT / "public" / "assets" / "vothisau" / "sprites" / "sau.png"

FRAME_W, FRAME_H = 80, 96
SRC_COLUMNS = 6
OUT_COLUMNS, OUT_ROWS = 6, 8

# Rows of the Kim Đồng sheet (features/kimdong/game/assets/manifest.ts, KIMDONG_SHEET).
KD = {"down": 0, "left": 1, "right": 2, "up": 3, "throw": 7, "hide": 9}

SHIRT = np.array([160.0, 104.0, 66.0])  # brown silk bà ba
SHIRT_LUM_REF = 62.0  # mean luminance of Kim Đồng's indigo shirt
TROUSER = np.array([34.0, 34.0, 42.0])
TROUSER_LUM_REF = 66.0
HAIR_BLACK = np.array([18, 16, 24, 255], dtype=np.uint8)
HAIR_SHINE = np.array([58, 54, 74, 255], dtype=np.uint8)
RED_TIE = np.array([196, 52, 44, 255], dtype=np.uint8)
FLOWER = np.array([250, 205, 70, 255], dtype=np.uint8)
CHECK_LIGHT = np.array([238, 234, 222, 255], dtype=np.uint8)
CHECK_DARK = np.array([36, 34, 40, 255], dtype=np.uint8)


def hsv(frame: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Hue (degrees), saturation, value of every pixel (vectorised)."""
    rgb = frame[..., :3].astype(np.float32) / 255.0
    mx = rgb.max(axis=-1)
    mn = rgb.min(axis=-1)
    delta = mx - mn
    h = np.zeros_like(mx)
    nz = delta > 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    rmax = nz & (mx == r)
    gmax = nz & (mx == g) & ~rmax
    bmax = nz & ~rmax & ~gmax
    h[rmax] = (60 * ((g - b)[rmax] / delta[rmax])) % 360
    h[gmax] = 60 * ((b - r)[gmax] / delta[gmax]) + 120
    h[bmax] = 60 * ((r - g)[bmax] / delta[bmax]) + 240
    s = np.where(mx > 0, delta / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def lum(frame: np.ndarray) -> np.ndarray:
    return 0.299 * frame[..., 0] + 0.587 * frame[..., 1] + 0.114 * frame[..., 2]


def masks(frame: np.ndarray) -> dict[str, np.ndarray]:
    """Which pixels are skin, shirt, shorts and dark (hair / outline) in one Kim Đồng frame."""
    alpha = frame[..., 3] > 128
    h, s, v = hsv(frame)
    r, g, b = (frame[..., i].astype(np.int32) for i in range(3))
    skin = alpha & (v >= 0.55) & (r >= 150) & (h >= 8) & (h <= 40) & (s >= 0.22) & (s <= 0.75)
    shirt = alpha & ~skin & (b > r + 8) & (v > 0.14)
    warm = (h >= 5) & (h <= 50) & (s >= 0.28)
    shorts = alpha & ~skin & ~shirt & warm & (v >= 0.12) & (v < 0.62)
    dark = alpha & ~skin & ~shirt & ~shorts & (v < 0.30)
    return {"alpha": alpha, "skin": skin, "shirt": shirt, "dark": dark, "shorts": shorts, "hue": h, "sat": s, "val": v}


def recolor(frame: np.ndarray, mask: np.ndarray, base: np.ndarray, ref: float) -> None:
    """Paint `mask` pixels with `base`, keeping the shading of the original pixels."""
    factor = np.clip(lum(frame)[mask] / ref, 0.45, 1.7)[:, None]
    frame[..., :3][mask] = np.clip(base[None, :] * factor, 0, 255).astype(np.uint8)


def long_trousers(frame: np.ndarray, m: dict[str, np.ndarray]) -> None:
    """Shorts -> black trousers, and the legs under them down to the ankles too."""
    shorts = m["shorts"]
    ys, _ = np.where(shorts)
    if len(ys) == 0:
        return
    bottom = int(np.where(m["alpha"])[0].max())
    ankle = bottom - 7
    leg = m["skin"].copy()
    leg[: int(ys.min()) + 1] = False  # nothing above the waist (hands, face)
    leg[ankle + 1 :] = False  # bare feet stay
    # The shorts' own lower edge is also where the skin of the legs starts: take the rows under it.
    lower = np.zeros_like(leg)
    lower[int(np.percentile(ys, 60)) :] = True
    leg &= lower
    both = shorts | leg
    recolor(frame, both, TROUSER, TROUSER_LUM_REF)
    m["trouser"] = both
    # The reddish outline Kim Đồng's bare legs have would show as red seams on black trousers.
    rows = np.zeros_like(both)
    rows[int(ys.min()) : ankle + 2] = True
    red = rows & m["alpha"] & ~m["skin"] & ~both & ((m["hue"] < 14) | (m["hue"] > 340)) & (m["sat"] > 0.35) & (m["val"] < 0.55)
    frame[..., :3][red] = (20, 18, 26)


def shirt_box(m: dict[str, np.ndarray]) -> tuple[int, int, int, int] | None:
    ys, xs = np.where(m["shirt"])
    if len(ys) == 0:
        return None
    return int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())


def put(frame: np.ndarray, x: int, y: int, color: np.ndarray) -> None:
    if 0 <= x < FRAME_W and 0 <= y < FRAME_H:
        frame[y, x] = color


def scarf(frame: np.ndarray, m: dict[str, np.ndarray], facing: str) -> None:
    """A checked khăn rằn over the top rows of the shirt (only at the neck in the side views, so it
    does not run down an outstretched arm), with a knot in the front view."""
    box = shirt_box(m)
    if box is None:
        return
    x0, x1, y0, _ = box
    if facing in ("left", "right") and "head" in m:
        hx0, hx1, _ = m["head"]
        centre = (hx0 + hx1) // 2
        x0, x1 = max(x0, centre - 5), min(x1, centre + 5)
    for y in range(y0, y0 + 3):
        for x in range(x0, x1 + 1):
            if m["shirt"][y, x]:
                put(frame, x, y, CHECK_LIGHT if (x + y) % 2 == 0 else CHECK_DARK)
    if facing == "down":
        cx = (x0 + x1) // 2
        for dx, dy in ((0, 3), (-1, 3), (0, 4), (-1, 4)):
            put(frame, cx + dx, y0 + dy, CHECK_LIGHT if (dx + dy) % 2 else CHECK_DARK)


def braid(frame: np.ndarray, m: dict[str, np.ndarray], facing: str) -> None:
    """The long plait: it hangs from the back of the head (so in a throw it hangs free, not stuck
    to the leaning body), down the back, or over the shoulder in the front view."""
    box = shirt_box(m)
    if box is None or "head" not in m:
        return
    x0, x1, y0, y1 = box
    hx0, hx1, fy0 = m["head"]
    waist = y1 - 2
    cx = (hx0 + hx1) // 2

    def strand(x: int, top: int, bottom: int, wide: int = 3) -> None:
        for y in range(top, bottom + 1):
            sway = 1 if (y // 4) % 2 == 0 else 0
            for w in range(wide):
                px = x + w - sway
                # a plait: dark with a lighter link every other row
                put(frame, px, y, HAIR_SHINE if (y + w) % 3 == 0 else HAIR_BLACK)
        for w in range(wide):
            put(frame, x + w, bottom + 1, RED_TIE)

    top = fy0 + 5
    if facing == "right":
        strand(hx0 + 1, top, waist + 3)
    elif facing == "left":
        strand(hx1 - 3, top, waist + 3)
    elif facing == "up":
        strand(cx - 1, y0 - 1, waist + 4)
    else:  # down: over the right shoulder (screen right), in front of the chest
        strand(x1 - 5, y0 + 2, waist)


def repaint_hair(frame: np.ndarray, m: dict[str, np.ndarray], facing: str) -> None:
    """Replace Kim Đồng's short, tousled hair with smooth long hair: a woman's silhouette.

    Front: a rounded crown with the parting open and two long locks framing the face down to the
    shoulders. Side: a rounded head with the hair falling behind the neck. Back: hair covering the
    head and falling over the back in a tapering mass (the braid continues it).
    """
    h, w = frame.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    ys, _ = np.where(m["alpha"])
    y0 = int(ys.min())
    box = shirt_box(m)
    sy0 = box[2] if box else y0 + 20
    head_rows = (yy >= y0) & (yy < sy0)
    skin_head = m["skin"] & head_rows
    hair_old = (m["dark"] | m["shorts"]) & head_rows
    dys, dxs = np.where(hair_old)
    if len(dys) == 0:
        return
    hx0, hx1 = int(dxs.min()), int(dxs.max())
    cx = (hx0 + hx1) / 2
    rx = (hx1 - hx0) / 2 + 0.5
    if skin_head.any():
        fys, fxs = np.where(skin_head)
        fy0, fx0, fx1 = int(fys.min()), int(fxs.min()), int(fxs.max())
    else:
        fy0, fx0, fx1 = y0 + 8, int(cx) - 4, int(cx) + 4

    def ellipse(ex: float, ey: float, erx: float, ery: float) -> np.ndarray:
        return ((xx - ex) / erx) ** 2 + ((yy - ey) / ery) ** 2 <= 1.0

    shape = np.zeros((h, w), dtype=bool)
    if facing == "down":
        ry = (fy0 - y0) + 2.5
        shape |= ellipse(cx, y0 + ry - 0.5, rx - 0.3, ry) & (yy <= fy0 + 1)
        for dy in (0, 1):  # the fringe sweeps to the sides, the middle stays open
            shape[fy0 + dy, fx0 - 3 : fx0 + 2 - dy] = True
            shape[fy0 + dy, fx1 - 1 + dy : fx1 + 4] = True
        for y in range(fy0 + 2, sy0 + 4):  # long locks beside the face
            shape[y, fx0 - 3 : fx0 - 1] = True
            shape[y, fx1 + 2 : fx1 + 4] = True
    elif facing == "up":
        ry = (sy0 - y0) * 0.5 + 3.0
        shape |= ellipse(cx, y0 + (sy0 - y0) * 0.5 + 1, rx, ry)
        for k, y in enumerate(range(sy0 + 2, sy0 + 12)):
            half = max(1, 4 - k // 3)
            shape[y, int(cx) - half : int(cx) + half + 1] = True
    else:
        right = facing == "right"
        ry = (fy0 - y0) + 3.5
        shape |= ellipse(cx + (-1.0 if right else 1.0), y0 + ry - 0.5, rx - 0.8, ry) & (yy <= fy0 + 3)
        back = hx0 if right else hx1
        for y in range(fy0 + 3, sy0 + 3):  # the hair behind the neck
            if right:
                shape[y, back : back + 3] = True
            else:
                shape[y, back - 2 : back + 1] = True
    shape &= ~m["skin"]

    # Drop the old hair that the new shape does not cover (spikes), then paint the new hair.
    clear_rows = (yy < sy0) if facing == "up" else (yy <= fy0 + 1)
    frame[hair_old & clear_rows & ~shape] = (0, 0, 0, 0)
    frame[shape] = HAIR_BLACK
    shine = shape & ((xx - cx) * 0.6 + (yy - y0) < 3.2) & (yy <= y0 + 3)
    frame[shine] = HAIR_SHINE
    outline = binary_dilation(shape) & ~shape & (frame[..., 3] == 0)
    frame[outline] = (12, 10, 16, 255)
    m["hair_shape"] = shape
    m["head"] = (hx0, hx1, fy0)


def flower(frame: np.ndarray, m: dict[str, np.ndarray], facing: str) -> None:
    """A tiny yellow lê-ki-ma flower in the hair, on the side the braid is not."""
    shape = m.get("hair_shape")
    if shape is None or facing == "up":
        return
    ys, xs = np.where(shape)
    top = int(ys.min())
    row = xs[ys <= top + 2]
    x = int(row.min()) if facing in ("down", "left") else int(row.max()) - 2
    for dx, dy in ((0, 1), (1, 0), (1, 1), (1, 2), (2, 1)):
        put(frame, x + dx, top + 1 + dy, FLOWER)


def dress(frame: np.ndarray, facing: str, with_braid: bool = True) -> np.ndarray:
    """Turn one Kim Đồng frame into Chị Sáu."""
    out = frame.copy()
    m = masks(out)
    recolor(out, m["shirt"], SHIRT, SHIRT_LUM_REF)
    long_trousers(out, m)
    # Masks must be computed on the original colours: recolouring moves pixels between classes.
    repaint_hair(out, m, facing)
    scarf(out, m, facing)
    if with_braid:
        braid(out, m, facing)
        flower(out, m, facing)
    return out


def squash(frame: np.ndarray, factor: float) -> np.ndarray:
    """Lower the body toward the ground (feet stay on y = 72): a crouching walk."""
    alpha = frame[..., 3] > 0
    ys, xs = np.where(alpha)
    top, bottom = int(ys.min()), int(ys.max())
    height = bottom - top + 1
    new_h = max(1, round(height * factor))
    crop = Image.fromarray(frame[top : bottom + 1])
    resized = crop.resize((FRAME_W, new_h), Image.NEAREST) if False else crop.resize(
        (crop.width, new_h), Image.NEAREST
    )
    out = np.zeros_like(frame)
    y0 = bottom - new_h + 1
    out[y0 : bottom + 1, : resized.width] = np.array(resized)
    return out


def cell(sheet: np.ndarray, row: int, column: int) -> np.ndarray:
    return sheet[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W].copy()


def build() -> Image.Image:
    sheet = np.array(Image.open(SRC).convert("RGBA"))
    out = np.zeros((OUT_ROWS * FRAME_H, OUT_COLUMNS * FRAME_W, 4), dtype=np.uint8)

    def place(row: int, column: int, frame: np.ndarray) -> None:
        out[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W] = frame

    for row, facing in enumerate(("down", "left", "right", "up")):
        for column in range(4):
            place(row, column, dress(cell(sheet, KD[facing], column), facing))
    for column in range(4):  # sneak: the walk to the right, lowered
        place(4, column, squash(dress(cell(sheet, KD["right"], column), "right"), 0.86))
    for column in range(3):  # throw
        place(5, column, dress(cell(sheet, KD["throw"], column), "right"))
    for column, source in enumerate((0, 1, 0)):  # interact: reach out and back (reuses the throw)
        place(6, column, dress(cell(sheet, KD["throw"], source), "right"))
    for column in range(2):  # hide: crouching
        place(7, column, dress(cell(sheet, KD["hide"], column), "down"))
    return Image.fromarray(out)


def preview(image: Image.Image, path: Path, scale: int = 3) -> None:
    bg = Image.new("RGBA", image.size, (90, 90, 96, 255))
    bg.alpha_composite(image)
    bg.resize((image.width * scale, image.height * scale), Image.NEAREST).save(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=Path, help="also write an enlarged preview on grey")
    parser.add_argument("--out", type=Path, default=DST)
    args = parser.parse_args()
    image = build()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    image.save(args.out, optimize=True)
    if args.preview:
        preview(image, args.preview)
    print(f"wrote {args.out} {image.size}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
