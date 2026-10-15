"""Re-colour the blue-coat chasers (row 1 of `soldier_running.png`, the "lính khố xanh") so they read
well on brown ground: the near-black navy coat is lifted to a faded indigo-cotton blue, and the
neon cyan sash becomes a muted blue. Outlines, skin, hat and rifle (non-blue hues) are untouched.

    python tools/kimdong-art/regrade_kho_xanh.py public/assets/kimdong/sprites/soldier_running.png 80 96 1

Arguments: sheet, frame width, frame height, row index. The sheet is overwritten (the previous
version is in git). Needs Pillow only.
"""

from __future__ import annotations

import colorsys
import sys
from pathlib import Path

from PIL import Image

COAT_HUE = 213 / 360  # faded indigo cotton
COAT_LIFT = 0.1  # added to the value so the coat is not near-black
COAT_GAIN = 1.2
SASH_HUE = 203 / 360
SASH_SAT = 0.5


def regrade(path: Path, frame_w: int, frame_h: int, row: int) -> None:
    sheet = Image.open(path).convert("RGBA")
    px = sheet.load()
    for y in range(row * frame_h, (row + 1) * frame_h):
        for x in range(sheet.width):
            r, g, b, a = px[x, y]
            if a < 24:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            deg = h * 360
            if 160 <= deg <= 215 and s > 0.35:
                # neon cyan sash
                v2 = 0.38 + v * 0.5
                nr, ng, nb = colorsys.hsv_to_rgb(SASH_HUE, SASH_SAT, min(v2, 0.85))
            elif 215 < deg <= 290 and s > 0.12:
                # navy coat / trousers
                v2 = min(0.85, COAT_LIFT + v * COAT_GAIN)
                nr, ng, nb = colorsys.hsv_to_rgb(COAT_HUE, min(1.0, s * 1.05), v2)
            else:
                continue
            px[x, y] = (round(nr * 255), round(ng * 255), round(nb * 255), a)
    sheet.save(path, optimize=True)
    print(f"{path}  {sheet.width}x{sheet.height}  {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    regrade(Path(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]))
