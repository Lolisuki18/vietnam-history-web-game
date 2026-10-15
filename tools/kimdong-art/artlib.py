"""Helpers to turn the AI-generated sprite sheets into clean game sprites.

The source images (assets-src/kimdong) have no real transparency: the "transparent" background is
a grey checkerboard (or plain black / white) painted into the pixels, plus a small AI sparkle in the
bottom-right corner. Everything here is plain Pillow so it runs without numpy.
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass

from PIL import Image, ImageChops, ImageFilter

# ---------------------------------------------------------------------------------------------
# Background removal
# ---------------------------------------------------------------------------------------------


def _lut_mask(img: Image.Image, test) -> Image.Image:
    """'L' image: 255 where test(value) is true, built with a lookup table (C speed)."""
    return img.point([255 if test(v) else 0 for v in range(256)])


def checker_levels(rgba: Image.Image, probe: int = 160) -> tuple[int, int]:
    """The two grey levels of the checkerboard, measured in the top-left corner."""
    grey = rgba.convert("L").crop((0, 0, probe, probe))
    hist = grey.histogram()
    smooth = [sum(hist[max(0, i - 3) : i + 4]) for i in range(256)]
    first = max(range(256), key=lambda i: smooth[i])
    second = max((i for i in range(256) if abs(i - first) > 25), key=lambda i: smooth[i])
    return first, second


def checker_candidates(rgba: Image.Image, levels: tuple[int, int], tol: int, sat: int) -> Image.Image:
    """255 where a pixel looks like checkerboard: grey (low saturation) and near one of the levels."""
    r, g, b = rgba.convert("RGB").split()
    spread = ImageChops.lighter(ImageChops.difference(r, g), ImageChops.difference(g, b))
    low_sat = _lut_mask(spread, lambda v: v <= sat)
    grey = rgba.convert("L")
    low, high = min(levels) - tol, max(levels) + tol
    near = _lut_mask(grey, lambda v: low <= v <= high)
    return ImageChops.multiply(low_sat, near)


def dark_candidates(rgba: Image.Image, limit: int) -> Image.Image:
    """255 where every channel is at most `limit` (a black background)."""
    r, g, b = rgba.convert("RGB").split()
    brightest = ImageChops.lighter(ImageChops.lighter(r, g), b)
    return _lut_mask(brightest, lambda v: v <= limit)


def flood_from_border(candidates: Image.Image) -> Image.Image:
    """Scanline flood fill: candidate pixels connected (4-way) to the image border -> 255."""
    w, h = candidates.size
    data = candidates.tobytes()
    seen = bytearray(w * h)
    stack: list[tuple[int, int]] = []
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
    """Eat the soft grey fringe: grow the background `rounds` pixels, but only into candidates."""
    for _ in range(rounds):
        grown = background.filter(ImageFilter.MaxFilter(3))
        background = ImageChops.lighter(background, ImageChops.multiply(grown, candidates))
    return background


def remove_checker(rgba: Image.Image) -> Image.Image:
    """Return the image with the checkerboard background made transparent."""
    levels = checker_levels(rgba)
    strict = checker_candidates(rgba, levels, tol=40, sat=10)
    background = flood_from_border(strict)
    loose = checker_candidates(rgba, levels, tol=60, sat=24)
    background = grow_into(background, loose, rounds=3)
    return apply_background(rgba, background)


def remove_black(rgba: Image.Image, limit: int = 14, fringe: int = 1) -> Image.Image:
    """Return the image with a black background made transparent."""
    strict = dark_candidates(rgba, limit)
    background = flood_from_border(strict)
    background = grow_into(background, dark_candidates(rgba, limit + 22), rounds=fringe)
    return apply_background(rgba, background)


def apply_background(rgba: Image.Image, background: Image.Image) -> Image.Image:
    alpha = ImageChops.invert(background)
    out = rgba.copy()
    out.putalpha(ImageChops.multiply(alpha, rgba.getchannel("A")))
    return out


def drop_corner_specks(rgba: Image.Image, window: int = 300, max_area: int = 6000) -> Image.Image:
    """Remove the AI sparkle: small opaque blobs that sit entirely inside the bottom-right corner."""
    w, h = rgba.size
    x0, y0 = w - window, h - window
    alpha = rgba.getchannel("A")
    region = alpha.crop((x0, y0, w, h))
    data = bytearray(region.tobytes())
    rw, rh = region.size
    seen = bytearray(rw * rh)
    erase: list[tuple[int, int]] = []
    for start in range(rw * rh):
        if not data[start] or seen[start]:
            continue
        stack = [start]
        seen[start] = 1
        pixels = []
        touches_edge = False
        while stack:
            i = stack.pop()
            pixels.append(i)
            y, x = divmod(i, rw)
            if x == 0 or y == 0 or x == rw - 1 or y == rh - 1:
                touches_edge = True
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < rw and 0 <= ny < rh:
                        j = ny * rw + nx
                        if data[j] and not seen[j]:
                            seen[j] = 1
                            stack.append(j)
        if not touches_edge and len(pixels) <= max_area:
            erase.extend((i % rw + x0, i // rw + y0) for i in pixels)
    if erase:
        px = rgba.load()
        for x, y in erase:
            r, g, b, _ = px[x, y]
            px[x, y] = (r, g, b, 0)
    return rgba


# ---------------------------------------------------------------------------------------------
# Frames
# ---------------------------------------------------------------------------------------------


@dataclass
class Frame:
    image: Image.Image  # tight crop, RGBA
    bottom: int  # bottom edge of the sprite, in the coordinates of its cell
    anchor_x: float  # horizontal centre of the body, in pixels of `image`


def premultiplied_resize(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Resize without dark fringes around transparent edges."""
    return img.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")


def body_centre(img: Image.Image) -> float:
    """Horizontal centre of mass of the lower half (so a rifle or a splash does not pull it)."""
    alpha = img.getchannel("A")
    w, h = alpha.size
    lower = alpha.crop((0, h // 2, w, h))
    columns = lower.resize((w, 1), Image.BOX)
    values = list(columns.tobytes())
    total = sum(values)
    if total == 0:
        return w / 2
    return sum(i * v for i, v in enumerate(values)) / total


def drop_border_fragments(cell: Image.Image, sides_only: bool = False) -> Image.Image:
    """Erase pieces of neighbouring sprites (a rifle tip, a splash) that the cell edge cut off.

    A component is a fragment when it touches the cell border and is not the biggest one. With
    `sides_only` only the left / right edges count (the cell is a row band, tight at top and bottom).
    """
    w, h = cell.size
    data = cell.getchannel("A").point(lambda v: 255 if v > 24 else 0).tobytes()
    label = [0] * (w * h)
    comps: list[tuple[int, bool, list[int]]] = []
    for start in range(w * h):
        if not data[start] or label[start]:
            continue
        label[start] = len(comps) + 1
        stack = [start]
        pixels: list[int] = []
        touches = False
        while stack:
            i = stack.pop()
            pixels.append(i)
            y, x = divmod(i, w)
            if x == 0 or x == w - 1 or (not sides_only and (y == 0 or y == h - 1)):
                touches = True
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if data[j] and not label[j]:
                            label[j] = len(comps) + 1
                            stack.append(j)
        comps.append((len(pixels), touches, pixels))
    if not comps:
        return cell
    biggest = max(range(len(comps)), key=lambda k: comps[k][0])
    px = cell.load()
    for k, (_, touches, pixels) in enumerate(comps):
        if touches and k != biggest:
            for i in pixels:
                y, x = divmod(i, w)
                r, g, b, _a = px[x, y]
                px[x, y] = (r, g, b, 0)
    return cell


def row_bands(sheet: Image.Image, min_gap: int = 6) -> list[tuple[int, int]]:
    """Vertical ranges (y0, y1) of the rows of sprites, found from the empty gaps between them.

    The sheets are not on an even grid: a tall sprite (a soldier with a rifle) can reach past the
    bottom of its nominal row, so cutting at `height / rows` would cut its feet off.
    """
    alpha = sheet.getchannel("A").point(lambda v: 255 if v > 24 else 0)
    w, h = alpha.size
    per_row = list(alpha.resize((1, h), Image.BOX).tobytes())  # mean opacity of every pixel row
    bands: list[tuple[int, int]] = []
    start: int | None = None
    last = -1
    for y, value in enumerate(per_row):
        if value >= 1:  # at least ~1/255 of the row (a few px) is opaque
            if start is None:
                start = y
            elif y - last > min_gap:
                bands.append((start, last + 1))
                start = y
            last = y
    if start is not None:
        bands.append((start, last + 1))
    return bands


def cut_frame(
    sheet: Image.Image,
    cols: int,
    rows: int,
    row: int,
    col: int,
    bands: list[tuple[int, int]] | None = None,
) -> Frame | None:
    """Cut one frame. With `bands` (see `row_bands`) the row is that band, else `height / rows`."""
    cw = sheet.width // cols
    if bands is not None:
        top, bottom = bands[row]
    else:
        ch = sheet.height // rows
        top, bottom = row * ch, (row + 1) * ch
    cell = sheet.crop((col * cw, top, (col + 1) * cw, bottom))
    cell = drop_border_fragments(cell, sides_only=bands is not None)
    box = cell.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not box:
        return None
    tight = cell.crop(box)
    return Frame(tight, box[3], body_centre(tight))


def build_sheet(
    frames: list[list[Frame | None]],
    scale: float,
    frame_size: tuple[int, int],
    feet_y: int,
    anchor_x: int,
) -> Image.Image:
    """Place each frame on a fixed-size canvas: body centred on `anchor_x`, row baseline on `feet_y`."""
    fw, fh = frame_size
    columns = max(len(r) for r in frames)
    out = Image.new("RGBA", (columns * fw, len(frames) * fh), (0, 0, 0, 0))
    for r, row in enumerate(frames):
        bottoms = [f.bottom for f in row if f]
        baseline = statistics.median(bottoms) if bottoms else 0
        for c, frame in enumerate(row):
            if not frame:
                continue
            w = max(1, round(frame.image.width * scale))
            h = max(1, round(frame.image.height * scale))
            small = premultiplied_resize(frame.image, (w, h))
            x = round(anchor_x - frame.anchor_x * scale)
            y = round(feet_y + (frame.bottom - baseline) * scale - h)
            canvas = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
            canvas.paste(small, (x, y), small)
            out.paste(canvas, (c * fw, r * fh))
    return out
