"""Third pass on the NPC sheets after Antigravity redrew them (code only, no image model).

What the redraw broke or left, and what this does about it:

1. villager_a and villager_b had the same dark brown shirt again: villager_b becomes indigo (áo chàm).
2. The standing row (row 0) of a, b and c held a sideways walking frame between the idle frames, so a
   person chatting would flick into a stride: the frame order becomes idle, idle, gesture, idle.
3. The nón lá of a and b: a dark lump of hair stuck out above the apex; the hat is repainted as a
   proper cone with an outline, shading and a brim (`fix_hats.repaint`).
4. The cowering row of a and b showed a big hat on a tiny body with the arms as two posts: it is rebuilt
   from the standing frames (`fix_villagers.rebuild_scared`).
5. `cai_tong_down.png` was a few flat round blobs, nothing like the rest. It is rebuilt from the
   detailed fallen-soldier sheet (row 1, the khố xanh soldier with the conical hat) by turning the
   blue uniform black: the same figure as the walking Cai Tòng (black suit, red armband).

Run from the project root:  python tools/vothisau-art/fix_npcs_round3.py [--dry-run]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from fix_hats import repaint  # noqa: E402
from fix_villagers import DIR, FRAME_H, FRAME_W, SHIRTS, hsv_vs, lum, rebuild_scared, recolor_shirt  # noqa: E402

# sheet -> (column holding the gesture frame, column of the sideways walking frame)
ROW0 = {"villager_a": (3, 2), "villager_b": (3, 2), "villager_c": (2, 3)}
HAT_SHEETS = {"villager_a", "villager_b"}
SUIT = np.array([34.0, 34.0, 40.0])  # Cai Tòng's black suit


def cell(sheet: np.ndarray, row: int, column: int) -> np.ndarray:
    return sheet[row * FRAME_H : (row + 1) * FRAME_H, column * FRAME_W : (column + 1) * FRAME_W]


def fix_villager(name: str) -> np.ndarray:
    sheet = np.array(Image.open(DIR / f"{name}.png").convert("RGBA"))
    gesture, side = ROW0[name]
    idle0, idle1 = cell(sheet, 0, 0).copy(), cell(sheet, 0, 1).copy()
    talk = cell(sheet, 0, gesture).copy()
    # idle, idle, gesture, idle: nobody strides while chatting.
    for column, frame in enumerate((idle0, idle1, talk, idle1)):
        cell(sheet, 0, column)[:] = frame
    if name in HAT_SHEETS:
        for column in range(4):
            repaint(cell(sheet, 0, column))
    if name in SHIRTS:
        recolor_shirt(sheet, SHIRTS[name])
    if name in HAT_SHEETS:
        rebuild_scared(sheet)
    _ = side
    return sheet


def cai_tong_down() -> np.ndarray:
    """The fallen khố xanh soldier, in black: 4 columns x 1 row of 80 x 96."""
    soldiers = np.array(Image.open(DIR / "soldier_down.png").convert("RGBA"))
    row = soldiers[FRAME_H : 2 * FRAME_H].copy()  # row 1: the khố xanh soldier
    rgb = row[..., :3]
    h, s, v = hsv_vs(rgb)
    uniform = (row[..., 3] > 0) & (h > 195) & (h < 265) & (s > 0.18)
    factor = np.clip(lum(rgb)[uniform] / 62.0, 0.35, 1.5)[:, None]
    row[..., :3][uniform] = np.clip(SUIT[None, :] * factor, 0, 255).astype(np.uint8)
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="write *.new.png next to the originals")
    args = parser.parse_args()

    def save(image: np.ndarray, name: str) -> None:
        path = DIR / f"{name}.png"
        target = path.with_suffix(".new.png") if args.dry_run else path
        Image.fromarray(image).save(target, optimize=True)
        print(f"wrote {target.name}")

    for name in ROW0:
        save(fix_villager(name), name)
    save(cai_tong_down(), "cai_tong_down")
    return 0


if __name__ == "__main__":
    sys.exit(main())
