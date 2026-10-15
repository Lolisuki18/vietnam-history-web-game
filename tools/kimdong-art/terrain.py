"""Terrain helpers: turn `forest_tiles.png` (a tile sheet with a dark grid painted over it) into
seamless ground textures and scenery sprites. Plain Pillow, no numpy.

`remove_grid` finds the grid lines (long straight runs of dark navy) and fills them in from the
pixels on both sides; `quilt` builds a seamless texture by pasting feathered patches on a torus.
"""

from __future__ import annotations

import random
import re

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from artlib import flood_from_border, grow_into, _lut_mask

RUN = 28  # a grid line is a straight dark run at least this long (px)


def _line_colour_mask(img: Image.Image) -> Image.Image:
    """255 where a pixel has the navy colour of the grid (b above r, dark)."""
    r, g, b = img.convert("RGB").split()
    # The lines are navy or plain black; the dark outlines of the artwork are green / brown (g > b).
    blue_not_below_red = ImageChops.subtract(r, b).point(lambda v: 255 if v == 0 else 0)
    blue_near_green = ImageChops.subtract(g, b).point(lambda v: 255 if v <= 6 else 0)
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b).point(lambda v: 255 if v < 85 else 0)
    return ImageChops.multiply(ImageChops.multiply(blue_not_below_red, blue_near_green), brightest)


def _runs_mask(mask: Image.Image, horizontal: bool) -> bytearray:
    """Pixels of `mask` that belong to a straight run of at least RUN pixels."""
    work = mask if horizontal else mask.transpose(Image.TRANSPOSE)
    w, h = work.size
    data = work.tobytes()
    out = bytearray(w * h)
    pattern = re.compile(b"\xff{%d,}" % RUN)
    for y in range(h):
        row = data[y * w : (y + 1) * w]
        for m in pattern.finditer(row):
            out[y * w + m.start() : y * w + m.end()] = b"\x01" * (m.end() - m.start())
    if horizontal:
        return out
    # transpose the result back
    img = Image.frombytes("L", (w, h), bytes(v * 255 for v in out)).transpose(Image.TRANSPOSE)
    return bytearray(1 if v else 0 for v in img.tobytes())


def _extend_lines(mask: bytearray, w: int, h: int, horizontal: bool, coverage: float = 0.4) -> None:
    """A line that is found over most of the image is a grid line along its whole length: mark it
    everywhere, also where the dark artwork hid its colour (a fern, a shadow)."""
    length, count = (w, h) if horizontal else (h, w)
    for line in range(count):
        if horizontal:
            hits = sum(mask[line * w : (line + 1) * w])
        else:
            hits = sum(mask[line::w])
        if hits < coverage * length:
            continue
        if horizontal:
            mask[line * w : (line + 1) * w] = b"\x01" * w
        else:
            for y in range(h):
                mask[y * w + line] = 1


def grid_mask(img: Image.Image) -> tuple[bytearray, bytearray]:
    """(horizontal-line mask, vertical-line mask) as 0/1 bytearrays of w*h, each dilated by 1 px."""
    colour = _line_colour_mask(img)
    w, h = img.size
    masks = []
    for horizontal in (True, False):
        raw = _runs_mask(colour, horizontal)
        _extend_lines(raw, w, h, horizontal)
        m = Image.frombytes("L", (w, h), bytes(v * 255 for v in raw))
        m = m.filter(ImageFilter.MaxFilter(5))  # also covers the soft halo next to a line
        masks.append(bytearray(1 if v else 0 for v in m.tobytes()))
    return masks[0], masks[1]


def remove_grid(img: Image.Image) -> Image.Image:
    """Return the image with the painted grid replaced by interpolated pixels."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    hmask, vmask = grid_mask(rgb)
    px = rgb.load()
    masked = bytearray(a | b for a, b in zip(hmask, vmask))

    def fix(only_h: bool, only_v: bool) -> None:
        """Fix masked pixels whose line is one-directional (not a crossing)."""
        changes: list[tuple[int, int, tuple[int, int, int]]] = []
        for y in range(h):
            row = y * w
            for x in range(w):
                i = row + x
                if not masked[i]:
                    continue
                is_h, is_v = hmask[i], vmask[i]
                if is_h and is_v:
                    continue
                if is_h and only_h:
                    changes.append((x, y, _interp(px, masked, w, h, x, y, vertical=True)))
                elif is_v and only_v:
                    changes.append((x, y, _interp(px, masked, w, h, x, y, vertical=False)))
        for x, y, colour in changes:
            px[x, y] = colour
            masked[y * w + x] = 0

    fix(True, True)
    # crossings: neighbours along the lines are fixed now, so any direction has close clean pixels
    changes = []
    for y in range(h):
        for x in range(w):
            if masked[y * w + x]:
                changes.append((x, y, _interp(px, masked, w, h, x, y, vertical=True)))
    for x, y, colour in changes:
        px[x, y] = colour
        masked[y * w + x] = 0
    return rgb


def _interp(px, masked, w, h, x, y, vertical: bool) -> tuple[int, int, int]:
    """Blend the nearest clean pixels on both sides of (x, y) along one axis."""
    if vertical:
        a = y
        while a > 0 and masked[a * w + x]:
            a -= 1
        b = y
        while b < h - 1 and masked[b * w + x]:
            b += 1
        p, q = px[x, a], px[x, b]
        t = (y - a) / max(1, b - a)
    else:
        a = x
        while a > 0 and masked[y * w + a]:
            a -= 1
        b = x
        while b < w - 1 and masked[y * w + b]:
            b += 1
        p, q = px[a, y], px[b, y]
        t = (x - a) / max(1, b - a)
    return (
        round(p[0] + (q[0] - p[0]) * t),
        round(p[1] + (q[1] - p[1]) * t),
        round(p[2] + (q[2] - p[2]) * t),
    )


def clean_specks(img: Image.Image) -> Image.Image:
    """Fill the short navy/black ticks the grid pass left behind. Only for artwork whose outlines
    are green or brown (plants, grass): grey rocks have grey outlines that look the same."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    mask = _line_colour_mask(rgb).filter(ImageFilter.MaxFilter(3))
    masked = bytearray(1 if v else 0 for v in mask.tobytes())
    px = rgb.load()
    todo = [(i % w, i // w) for i, v in enumerate(masked) if v]
    for x, y in todo:
        px[x, y] = _interp(px, masked, w, h, x, y, vertical=True)
    return rgb


def has_line_pixels(img: Image.Image) -> bool:
    return _line_colour_mask(img).getbbox() is not None


def remove_white(img: Image.Image, floor: int = 222, sat: int = 16) -> Image.Image:
    """White background -> transparent (flood fill from the border, then a thin fringe)."""
    rgb = img.convert("RGB")
    r, g, b = rgb.split()
    spread = ImageChops.lighter(ImageChops.difference(r, g), ImageChops.difference(g, b))
    low_sat = _lut_mask(spread, lambda v: v <= sat)
    light = _lut_mask(ImageChops.darker(ImageChops.darker(r, g), b), lambda v: v >= floor)
    strict = ImageChops.multiply(low_sat, light)
    background = flood_from_border(strict)
    loose = ImageChops.multiply(
        _lut_mask(spread, lambda v: v <= 30),
        _lut_mask(ImageChops.darker(ImageChops.darker(r, g), b), lambda v: v >= floor - 40),
    )
    background = grow_into(background, loose, rounds=2)
    out = rgb.convert("RGBA")
    out.putalpha(ImageChops.invert(background))
    return out


def quilt(
    sources: list[Image.Image],
    size: int,
    patch: int,
    seed: str,
    density: float = 2.2,
    feather: int = 10,
) -> Image.Image:
    """A seamless (wrapping) texture made of feathered patches cut at random from `sources`."""
    rng = random.Random(seed)
    base = sources[0]
    canvas = Image.new("RGB", (size, size))
    for y in range(0, size, base.height):
        for x in range(0, size, base.width):
            canvas.paste(base, (x, y))
    # feathered square mask
    mask = Image.new("L", (patch, patch), 0)
    ImageDraw.Draw(mask).rectangle(
        (feather, feather, patch - feather - 1, patch - feather - 1), fill=255
    )
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2.2))
    count = int((size / patch) ** 2 * density)
    for _ in range(count):
        src = rng.choice(sources)
        if src.width < patch or src.height < patch:
            continue
        sx = rng.randint(0, src.width - patch)
        sy = rng.randint(0, src.height - patch)
        piece = src.crop((sx, sy, sx + patch, sy + patch))
        if has_line_pixels(piece):  # a left-over piece of the painted grid
            continue
        lightest = ImageChops.darker(ImageChops.darker(*piece.split()[:2]), piece.split()[2])
        if lightest.getextrema()[1] > 215:  # a pixel of the white sheet background
            continue
        if rng.random() < 0.5:
            piece = piece.transpose(Image.FLIP_LEFT_RIGHT)
        px, py = rng.randint(0, size - 1), rng.randint(0, size - 1)
        for ox in (-size, 0):
            for oy in (-size, 0):
                canvas.paste(piece, (px + ox, py + oy), mask)
    return canvas
