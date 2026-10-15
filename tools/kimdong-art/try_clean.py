"""Quick look: clean one source image and save a preview over a magenta background."""
import os
import sys
import time
from pathlib import Path

from PIL import Image

import artlib

SRC = Path(os.environ.get("KIMDONG_RAW", Path(__file__).resolve().parents[2] / "raw-art" / "kimdong"))
OUT = Path(sys.argv[3]) if len(sys.argv) > 3 else Path(".")

name, mode = sys.argv[1], sys.argv[2]
t = time.time()
img = Image.open(SRC / name).convert("RGBA")
clean = artlib.remove_checker(img) if mode == "checker" else artlib.remove_black(img)
clean = artlib.drop_corner_specks(clean)
print(name, "cleaned in", round(time.time() - t, 1), "s")

preview = Image.new("RGBA", clean.size, (255, 0, 255, 255))
preview.alpha_composite(clean)
preview.thumbnail((1600, 900))
preview.convert("RGB").save(OUT / f"preview_{Path(name).stem}.png")
clean.save(OUT / f"clean_{Path(name).stem}.png")
