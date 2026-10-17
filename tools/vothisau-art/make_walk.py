"""Give Chị Sáu a real walk cycle (public/assets/vothisau/sprites/sau.png, rows 0-3).

The first four "walk" frames of every direction in the Antigravity sheet are the same standing
pose repeated (the feet move by a pixel), so at 150 px/s she seemed to glide. This rebuilds the four
walk frames of each direction from the standing pose, in code (no image model):

  * the legs are cut from the body and cut in two (back leg / front leg),
  * side views: the legs scissor (contact, passing, contact, passing); front and back views: one
    foot lifts at a time,
  * the body bobs up a pixel on the passing frames.

Column 4 of rows 0-3 keeps the untouched standing pose, which the game now uses as the idle frame
(`SAU_SHEET.idleColumn`). Re-running is safe: the standing pose is read from column 4 when present.

Run from the project root:  python tools/vothisau-art/make_walk.py [--preview out.png] [--stride N]
"""

from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SHEET = ROOT / "public" / "assets" / "vothisau" / "sprites" / "sau.png"
FRAME_W, FRAME_H = 80, 96
ROWS = {"down": 0, "left": 1, "right": 2, "up": 3}
IDLE_COLUMN = 4


def cell(sheet: np.ndarray, row: int, column: int) -> np.ndarray:
    return sheet[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W].copy()


def find_hip(frame: np.ndarray) -> int:
    """First row of the trousers: just under the last row that has shirt-brown pixels."""
    r, g, b, a = (frame[..., i].astype(int) for i in range(4))
    brown = (a > 0) & (r > 90) & (r > g + 12) & (g > b + 6) & (r - b > 40)
    rows = np.where(brown.sum(axis=1) >= 4)[0]
    rows = rows[rows < 62]
    return int(rows.max()) + 3 if len(rows) else 40


def is_skin(frame: np.ndarray) -> np.ndarray:
    r, g, b, a = (frame[..., i].astype(int) for i in range(4))
    return (a > 0) & (r > 170) & (g > 105) & (b > 70) & (r > g) & (g > b)


def split_body_legs(frame: np.ndarray, hip: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, int, int]:
    """Body layer, back-leg layer, front-leg layer (by x), plus the first leg row and the foot row."""
    alpha = frame[..., 3] > 0
    ys, _ = np.where(alpha)
    foot = int(ys.max())
    top = hip + 4
    rows = np.arange(FRAME_H)[:, None]
    legs = alpha & (rows >= top)
    # Hands hang beside the hips: keep them with the body (skin above the knees, far from the feet).
    legs &= ~(is_skin(frame) & (rows < foot - 9))
    mid_row = min(foot - 10, top + 12)
    dark = alpha[mid_row] & (frame[mid_row, :, :3].max(axis=1) < 90)
    xs = np.where(dark)[0]
    split = int(np.median(xs)) if len(xs) else FRAME_W // 2
    cols = np.arange(FRAME_W)[None, :]
    back = legs & (cols <= split)
    front = legs & (cols > split)
    body = alpha & ~legs
    layer = lambda mask: np.where(mask[..., None], frame, 0).astype(np.uint8)  # noqa: E731
    return layer(body), layer(back), layer(front), top, foot


def heal_cell(cell: np.ndarray) -> tuple[np.ndarray, int]:
    """Fill 1-px and 2-px transparent holes/slits completely enclosed within the figure."""
    out = cell.copy()
    alpha = out[..., 3] > 0
    filled = 0
    
    # 1-px vertical slits
    v1 = (~alpha[1:-1, :]) & alpha[:-2, :] & alpha[2:, :]
    ys, xs = np.where(v1)
    ys += 1
    for y, x in zip(ys, xs):
        out[y, x] = ((out[y-1, x].astype(int) + out[y+1, x].astype(int)) // 2).astype(np.uint8)
        alpha[y, x] = True
        filled += 1
        
    # 1-px horizontal slits
    h1 = (~alpha[:, 1:-1]) & alpha[:, :-2] & alpha[:, 2:]
    ys, xs = np.where(h1)
    xs += 1
    for y, x in zip(ys, xs):
        out[y, x] = ((out[y, x-1].astype(int) + out[y, x+1].astype(int)) // 2).astype(np.uint8)
        alpha[y, x] = True
        filled += 1

    # 2-px vertical slits
    v2 = (~alpha[1:-2, :]) & (~alpha[2:-1, :]) & alpha[:-3, :] & alpha[3:, :]
    ys, xs = np.where(v2)
    ys += 1
    for y, x in zip(ys, xs):
        top_c = out[y-1, x].astype(int)
        bot_c = out[y+2, x].astype(int)
        out[y, x] = ((top_c * 2 + bot_c) // 3).astype(np.uint8)
        out[y+1, x] = ((top_c + bot_c * 2) // 3).astype(np.uint8)
        alpha[y, x] = True
        alpha[y+1, x] = True
        filled += 2

    # 2-px horizontal slits
    h2 = (~alpha[:, 1:-2]) & (~alpha[:, 2:-1]) & alpha[:, :-3] & alpha[:, 3:]
    ys, xs = np.where(h2)
    xs += 1
    for y, x in zip(ys, xs):
        l_c = out[y, x-1].astype(int)
        r_c = out[y, x+2].astype(int)
        out[y, x] = ((l_c * 2 + r_c) // 3).astype(np.uint8)
        out[y, x+1] = ((l_c + r_c * 2) // 3).astype(np.uint8)
        alpha[y, x] = True
        alpha[y+1, x] = True
        filled += 2

    return out, filled


def move_leg(leg: np.ndarray, top: int, foot: int, shear: float, lift: int = 0, back: int = 0) -> np.ndarray:
    """Swing a leg layer from the hip (0 px at the top, `shear` px at the foot).

    `lift` smoothly bends the knee and raises the lower leg and foot without shortening the leg
    or creating discontinuous notches ('khấc'). Preserves constant leg thickness.
    """
    out = np.zeros_like(leg)
    length = foot - top + 1
    knee = top + int(round(length * 0.52))
    for y in range(top, foot + 1):
        if y <= knee:
            t = (y - top) / max(1, knee - top)
            dx = (shear * 0.5) * t
            dy = 0
        else:
            t = (y - knee) / max(1, foot - knee)
            dx = (shear * 0.5) + (shear * 0.5 + back) * t
            dy = -int(round(lift * t))
        target = y + dy
        if not 0 <= target < FRAME_H:
            continue
        row = leg[y]
        solid = row[:, 3] > 0
        if not solid.any():
            continue
        idx = np.where(solid)[0]
        shift = int(round(dx))
        c_targets = idx + shift
        valid = (c_targets >= 0) & (c_targets < FRAME_W)
        out[target, c_targets[valid]] = row[idx[valid]]
    return out


def compose(layers: list[np.ndarray], bob: int, sway: int = 0) -> np.ndarray:
    out = np.zeros((FRAME_H, FRAME_W, 4), dtype=np.uint8)
    for index, layer in enumerate(layers):
        shifted = np.zeros_like(layer)
        dy = -bob if index == 0 else 0  # only the body bobs and sways
        dx = sway if index == 0 else 0
        if dy < 0:
            shifted[:dy] = layer[-dy:]
        else:
            shifted = layer.copy()
        if dx:
            shifted = np.roll(shifted, dx, axis=1)
        solid = shifted[..., 3] > 0
        out[solid] = shifted[solid]
    # The bob and the lifted legs can leave an empty row inside the figure: fill it from above.
    solid = out[..., 3] > 0
    rows = np.where(solid.any(axis=1))[0]
    for y in range(int(rows.min()) + 1, int(rows.max())):
        if not solid[y].any() and solid[y - 1].any() and solid[y + 1].any():
            out[y] = out[y - 1]
            solid[y] = solid[y - 1]
    out, _ = heal_cell(out)
    return out


def foot_centre(layer: np.ndarray, foot: int) -> float | None:
    xs = np.where((layer[foot - 3 : foot + 1, :, 3] > 0).any(axis=0))[0]
    return float(xs.mean()) if len(xs) else None


def walk_frames(base: np.ndarray, side: bool, stride: int, back_dir: int) -> list[np.ndarray]:
    hip = find_hip(base)
    body, back, front, top, foot = split_body_legs(base, hip)
    west, east = back, front
    lift = 3
    frames = []
    # `back_dir`: +1 when "behind" the walker is to the east (facing left), -1 when facing right.
    if side:
        cw, ce = foot_centre(west, foot), foot_centre(east, foot)
        if cw is None or ce is None:
            cw = ce = float(FRAME_W // 2)
        centre = (cw + ce) / 2

        def shears(west_to: float, east_to: float) -> tuple[int, int]:
            return round(centre + west_to - cw), round(centre + east_to - ce)

        # Contact A: the legs apart (a "Λ") with the back heel raised; passing: the swing leg bends
        # at the knee and comes through under the body. Contact B is contact A mirrored about the
        # stance, so the legs never cross.
        west_a, east_a = shears(-stride, +stride)
        # The back leg is the one on the `back_dir` side.
        heel = (1, 0) if back_dir < 0 else (0, 1)
        legs_a = compose(
            [
                move_leg(west, top, foot, west_a, heel[0], 0),
                move_leg(east, top, foot, east_a, heel[1], 0),
            ],
            0,
        )
        axis_shift = round(2 * centre - (FRAME_W - 1))
        legs_b = np.roll(legs_a[:, ::-1], axis_shift, axis=1)
        w_p, e_p = shears(-1, +1)
        passing_w = compose(
            [move_leg(west, top, foot, w_p, lift, back_dir), move_leg(east, top, foot, e_p)], 0
        )
        passing_e = compose(
            [move_leg(west, top, foot, w_p), move_leg(east, top, foot, e_p, lift, back_dir)], 0
        )
        for legs, bob in ((legs_a, 0), (passing_w, 1), (legs_b, 0), (passing_e, 1)):
            frames.append(compose([body, legs], bob))
    else:
        # One foot lifts, then the other; the body sways a pixel toward the planted leg.
        plan = [(3, 0, 0, +1), (0, 0, 1, 0), (0, 3, 0, -1), (0, 0, 1, 0)]
        for west_lift, east_lift, bob, sway in plan:
            frames.append(
                compose(
                    [
                        body,
                        move_leg(west, top, foot, 0, west_lift),
                        move_leg(east, top, foot, 0, east_lift),
                    ],
                    bob,
                    sway,
                )
            )
    return frames


def build(stride: int) -> Image.Image:
    sheet = np.array(Image.open(SHEET).convert("RGBA"))
    for name, row in ROWS.items():
        idle = cell(sheet, row, IDLE_COLUMN)
        base = idle if (idle[..., 3] > 0).any() else cell(sheet, row, 0)
        if row == 0:
            # Remove the red-black spike jutting out at shoulder (x <= 32, y <= 38)
            spike = (base[..., 3] > 0) & (np.arange(FRAME_W)[None, :] <= 32) & (np.arange(FRAME_H)[:, None] <= 38)
            base[spike] = 0
        base, _ = heal_cell(base)
        frames = walk_frames(base, side=name in ("left", "right"), stride=stride, back_dir=1 if name == "left" else -1)
        for column, frame in enumerate(frames):
            sheet[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W] = frame
        sheet[row * FRAME_H : (row + 1) * FRAME_H, IDLE_COLUMN * FRAME_W : (IDLE_COLUMN + 1) * FRAME_W] = base
    return Image.fromarray(sheet)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=Path)
    parser.add_argument("--stride", type=int, default=6, help="how far the legs swing at the feet, px")
    parser.add_argument("--out", type=Path, default=SHEET)
    args = parser.parse_args()
    image = build(args.stride)
    image.save(args.out, optimize=True)
    if args.preview:
        bg = Image.new("RGBA", image.size, (90, 90, 96, 255))
        bg.alpha_composite(image)
        bg.crop((0, 0, FRAME_W * 5, FRAME_H * 4)).resize((FRAME_W * 5 * 3, FRAME_H * 4 * 3), Image.NEAREST).save(args.preview)
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
