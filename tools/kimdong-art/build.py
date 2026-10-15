"""Build the game-ready Kim Đồng art from the raw AI-generated images in assets-src/kimdong.

    python tools/kimdong-art/build.py            # everything
    python tools/kimdong-art/build.py sprites    # only one group: sprites | props | ui | web

Needs Pillow only. The layout of every output file is the contract in
features/kimdong/game/assets/manifest.ts (frame sizes, rows, columns): change both together.
Outputs go to public/assets/kimdong/ (game) and public/art, public/textures (web).
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops

import artlib

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "assets-src" / "kimdong"
GAME = ROOT / "public" / "assets" / "kimdong"
WEB_ART = ROOT / "public" / "art"
WEB_TEX = ROOT / "public" / "textures"

# One character frame: the feet stand on FEET_Y (75% of the height, like the old placeholder art),
# the body is centred on ANCHOR_X. The game shows a frame at half this size (SPRITE_SCALE).
FRAME = (80, 96)
FEET_Y = 72
ANCHOR_X = 40
KID_HEIGHT = 68  # tight height of a standing Kim Đồng, in frame pixels
SOLDIER_HEIGHT = 68  # tight height of a soldier (helmet to boots), in frame pixels


def load(name: str) -> Image.Image:
    return Image.open(SRC / name).convert("RGBA")


def clean_checker(name: str, global_grey: bool = False) -> Image.Image:
    img = artlib.drop_corner_specks(artlib.remove_checker(load(name)))
    if global_grey:
        # Glow effects are blended into the checkerboard, so the flood fill cannot separate them.
        # Keep only strongly coloured pixels (paper, wax seal, sparks) and the dark outline.
        r, g, b = img.convert("RGB").split()
        spread = ImageChops.subtract(ImageChops.lighter(ImageChops.lighter(r, g), b), ImageChops.darker(ImageChops.darker(r, g), b))
        colourful = spread.point(lambda v: 255 if v >= 72 else 0)
        grey_level = img.convert("L")
        dark = grey_level.point(lambda v: 255 if v <= 62 else 0)
        bright = grey_level.point(lambda v: 255 if v >= 188 else 0)  # the white-hot centre of a glow
        keep = ImageChops.lighter(ImageChops.lighter(colourful, dark), bright)
        img.putalpha(ImageChops.multiply(img.getchannel("A"), keep))
    return img


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print(f"  {path.relative_to(ROOT)}  {img.width}x{img.height}  {path.stat().st_size / 1024:.0f} KB")


def save_webp(img: Image.Image, path: Path, quality: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.relative_to(ROOT)}  {img.width}x{img.height}  {path.stat().st_size / 1024:.0f} KB")


def fit_within(img: Image.Image, box: tuple[int, int]) -> Image.Image:
    scale = min(box[0] / img.width, box[1] / img.height)
    return artlib.premultiplied_resize(img, (max(1, round(img.width * scale)), max(1, round(img.height * scale))))


# ------------------------------------------------------------------------------------ sprites


def pick(sheet, cols, rows, row, cols_wanted):
    return [artlib.cut_frame(sheet, cols, rows, row, c) for c in cols_wanted]


def build_kimdong() -> None:
    walk = clean_checker("Walk-swimming.png")
    acts = clean_checker("kimdong_actions.png")

    ref_walk = artlib.cut_frame(walk, 8, 4, 0, 0)
    ref_act = artlib.cut_frame(acts, 8, 4, 2, 0)
    assert ref_walk and ref_act
    s_walk = KID_HEIGHT / ref_walk.image.height
    # The action sheet is drawn at another resolution: match the standing height of both sheets.
    s_act = s_walk * ref_walk.image.height / ref_act.image.height

    def rows(sheet, cols, nrows, spec, scale):
        return artlib.build_sheet(
            [pick(sheet, cols, nrows, r, c) for r, c in spec], scale, FRAME, FEET_Y, ANCHOR_X
        )

    # rows of kimdong.png (see KIMDONG_SHEET in manifest.ts): 6 columns
    walk_rows = rows(
        walk,
        8,
        4,
        [
            (0, [0, 1, 2, 3]),  # down
            (2, [4, 5, 6, 7]),  # left
            (2, [0, 1, 2, 3]),  # right
            (0, [4, 5, 6, 7]),  # up
            (3, [2, 3, 4, 5]),  # swim
        ],
        s_walk,
    )
    act_rows = rows(
        acts,
        8,
        4,
        [
            (0, [0, 1, 2, 3, 4, 5]),  # run (to the right)
            (1, [3, 4, 5]),  # jump
            (2, [1, 2, 3]),  # throw
        ],
        s_act,
    )
    sheet = Image.new("RGBA", (6 * FRAME[0], 8 * FRAME[1]), (0, 0, 0, 0))
    sheet.paste(walk_rows, (0, 0))
    sheet.paste(act_rows, (0, 5 * FRAME[1]))
    save_png(sheet, GAME / "sprites" / "kimdong.png")


def build_soldiers() -> None:
    for source, out in (("french_soldier.png", "french_soldier.png"), ("linh_kho_xanh.png", "linh_kho_xanh.png")):
        img = clean_checker(source)
        cols, nrows = 10, 4
        # A soldier with a rifle is taller than its nominal row of the sheet: cut by the real gaps.
        bands = artlib.row_bands(img)
        assert len(bands) == nrows, f"{source}: expected {nrows} rows, found {bands}"

        def frames(wanted: list[int]):
            return [artlib.cut_frame(img, cols, nrows, 0, c, bands) for c in wanted]

        ref = artlib.cut_frame(img, cols, nrows, 0, 0, bands)
        assert ref
        scale = SOLDIER_HEIGHT / ref.image.height
        # row 0 shows the soldier facing right in columns 0-4 and facing left in columns 5-9
        sheet = artlib.build_sheet(
            [frames([5, 6, 7, 8, 9]), frames([0, 1, 2, 3, 4])], scale, FRAME, FEET_Y, ANCHOR_X
        )
        save_png(sheet, GAME / "sprites" / out)


def build_letter() -> None:
    img = clean_checker("letter.png", global_grey=True)
    frames = []
    for i in range(14):
        frame = artlib.cut_frame(img, 5, 3, i // 5, i % 5)
        assert frame
        frames.append(frame.image)
    widest = max(f.width for f in frames)
    scale = 78 / widest
    size = (80, round(max(f.height for f in frames) * scale) + 2)
    sheet = Image.new("RGBA", (5 * size[0], 3 * size[1]), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        small = artlib.premultiplied_resize(f, (round(f.width * scale), round(f.height * scale)))
        cell = Image.new("RGBA", size, (0, 0, 0, 0))
        cell.paste(small, ((size[0] - small.width) // 2, (size[1] - small.height) // 2), small)
        sheet.paste(cell, ((i % 5) * size[0], (i // 5) * size[1]))
    save_png(sheet, GAME / "images" / "letter.png")
    print(f"    letter frame size: {size[0]}x{size[1]}")


BUSH_BOXES = {  # in the 1600px-wide preview of bush.png (x0, y0, x1, y1): the bushes are not on a grid
    "bush_a": (440, 45, 800, 335),  # big, leafy
    "bush_b": (850, 390, 1040, 585),  # round
    "bush_c": (90, 655, 395, 840),  # low and wide
}


def build_bushes() -> None:
    img = clean_checker("bush.png")
    factor = img.width / 1600
    for name, box in BUSH_BOXES.items():
        crop = img.crop(tuple(round(v * factor) for v in box))
        tight = crop.crop(crop.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
        save_png(fit_within(tight, (256, 256)), GAME / "images" / f"{name}.png")


def build_emotes() -> None:
    img = artlib.remove_black(load("emotes.png"), limit=12, fringe=1)
    img = artlib.drop_corner_specks(img)
    question = artlib.cut_frame(img, 4, 2, 0, 0)
    alert = artlib.cut_frame(img, 4, 2, 0, 1)
    assert question and alert
    size = 64
    sheet = Image.new("RGBA", (size * 2, size), (0, 0, 0, 0))
    for i, frame in enumerate((question, alert)):
        small = fit_within(frame.image, (size - 2, size - 2))
        sheet.paste(small, (i * size + (size - small.width) // 2, (size - small.height) // 2), small)
    save_png(sheet, GAME / "images" / "emotes.png")


# -------------------------------------------------------------------------------------- props

PROP_BOXES = {  # in the 1600px-wide preview of props.png (x0, y0, x1, y1); see try_clean.py
    "prop_tree": (40, 25, 600, 560),
    "prop_tower": (620, 30, 1010, 545),
    "prop_fence": (1060, 35, 1545, 215),
    "prop_rock_a": (55, 585, 290, 840),
    "prop_rock_b": (320, 620, 412, 718),
    "prop_rock_c": (445, 585, 555, 718),
    "prop_rock_d": (585, 585, 742, 720),
    "prop_rock_e": (435, 725, 556, 828),
    "prop_rock_f": (580, 735, 738, 832),
    "prop_stump_a": (830, 575, 1185, 840),
    "prop_stump_b": (1200, 580, 1548, 845),
}
PROP_MAX = {  # longest side of the output, px
    "prop_tree": 360,
    "prop_tower": 260,
    "prop_fence": 300,
}


def build_props() -> None:
    img = artlib.drop_corner_specks(artlib.remove_black(load("props.png"), limit=10, fringe=0))
    factor = img.width / 1600
    for name, box in PROP_BOXES.items():
        crop = img.crop(tuple(round(v * factor) for v in box))
        tight = crop.crop(crop.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox())
        side = PROP_MAX.get(name, 150)
        scale = side / max(tight.size)
        out = artlib.premultiplied_resize(tight, (round(tight.width * scale), round(tight.height * scale)))
        save_png(out, GAME / "images" / f"{name}.png")


# ----------------------------------------------------------------------------------------- web


def build_web() -> None:
    thumbnail = Image.open(SRC / "thumbnail_kimdong.png").convert("RGB")
    save_webp(thumbnail.resize((1100, round(1100 * thumbnail.height / thumbnail.width)), Image.LANCZOS), WEB_ART / "kimdong-cover.webp", 80)

    codex = Image.open(SRC / "codex_kimdong.png").convert("RGB")
    save_webp(codex, WEB_ART / "kimdong-codex.webp", 84)

    for who in ("kimdong", "ducthanh"):
        portrait = Image.open(SRC / f"portrait_{who}.png").convert("RGB")
        inner = portrait.crop((62, 62, 962, 962))  # inside the pixel frame, without the black border
        save_png(inner.resize((256, 256), Image.LANCZOS), GAME / "images" / f"portrait_{who}.png")

    paper = Image.open(SRC / "texture_UI_yellow.png").convert("RGB")
    save_webp(paper.resize((1600, round(1600 * paper.height / paper.width)), Image.LANCZOS), WEB_TEX / "paper-aged.webp", 78)

    stamp = Image.open(SRC / "texture-red-stamp.png").convert("RGB")
    r, g, b = stamp.split()
    # ink is strongly red; the paper is cream. Turn "redness" into alpha so only the ink remains.
    redness = ImageChops.subtract(r, ImageChops.lighter(g, b))
    alpha = redness.point(lambda v: 0 if v < 70 else min(255, (v - 70) * 255 // 70))
    ink = Image.merge("RGBA", (r.point(lambda v: min(v, 190)), g.point(lambda v: min(v, 40)), b.point(lambda v: min(v, 40)), alpha))
    ink = ink.crop(ink.getchannel("A").point(lambda v: 255 if v > 40 else 0).getbbox())
    scale = 640 / max(ink.size)
    save_png(artlib.premultiplied_resize(ink, (round(ink.width * scale), round(ink.height * scale))), WEB_ART / "stamp-viet-minh.png")


GROUPS = {
    "sprites": [build_kimdong, build_soldiers, build_letter, build_bushes, build_emotes],
    "props": [build_props],
    "web": [build_web],
}

if __name__ == "__main__":
    wanted = sys.argv[1:] or list(GROUPS)
    for group in wanted:
        print(f"[{group}]")
        for step in GROUPS[group]:
            step()
