"""Tidy a ready-made sprite sheet in place (for sheets drawn directly at game size, such as the ones
the artist's image tool produced): drop the little stray specks around the rifles and give every
frame a dark outline so a khaki soldier stands out from brown ground.

    python tools/kimdong-art/touchup.py public/assets/kimdong/sprites/soldier_running.png 80 96

The sheet is overwritten: keep the original (it is in git history) if you may want it back.
Needs Pillow only.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

OUTLINE = (30, 19, 11)  # dark brown, close to the outlines of the walking soldiers
MIN_AREA = 70  # a piece of a frame smaller than this (px) that is not the body is a speck


def drop_specks(frame: Image.Image) -> Image.Image:
    """Erase every connected piece of the frame whose area is below MIN_AREA, except the biggest."""
    w, h = frame.size
    alpha = frame.getchannel("A")
    data = alpha.point(lambda v: 255 if v > 24 else 0).tobytes()
    seen = bytearray(w * h)
    pieces: list[list[int]] = []
    for start in range(w * h):
        if not data[start] or seen[start]:
            continue
        stack = [start]
        seen[start] = 1
        piece: list[int] = []
        while stack:
            i = stack.pop()
            piece.append(i)
            y, x = divmod(i, w)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if data[j] and not seen[j]:
                            seen[j] = 1
                            stack.append(j)
        pieces.append(piece)
    if not pieces:
        return frame
    biggest = max(pieces, key=len)
    px = frame.load()
    for piece in pieces:
        if piece is biggest or len(piece) >= MIN_AREA:
            continue
        for i in piece:
            y, x = divmod(i, w)
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)
    return frame


def add_outline(frame: Image.Image) -> Image.Image:
    """Paint a 1 px dark outline just outside the opaque pixels of the frame."""
    solid = frame.getchannel("A").point(lambda v: 255 if v > 24 else 0)
    ring = ImageChops.subtract(solid.filter(ImageFilter.MaxFilter(3)), solid)
    outline = Image.new("RGBA", frame.size, OUTLINE + (255,))
    out = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    out.paste(outline, (0, 0), ring)
    out.alpha_composite(frame)
    return out


def touch_up(path: Path, frame_w: int, frame_h: int) -> None:
    sheet = Image.open(path).convert("RGBA")
    result = Image.new("RGBA", sheet.size, (0, 0, 0, 0))
    for top in range(0, sheet.height, frame_h):
        for left in range(0, sheet.width, frame_w):
            frame = sheet.crop((left, top, left + frame_w, top + frame_h))
            frame = add_outline(drop_specks(frame))
            result.paste(frame, (left, top))
    result.save(path, optimize=True)
    print(f"{path}  {result.width}x{result.height}  {path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    touch_up(Path(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3]))
