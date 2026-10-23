"""Pack PixelLab headgear (art/pixellab/headgear/<id>/<direction>.png) into src/art/hg_<id>.png + .json.

Each sheet is one row of eight cells (down, downright, right, upright, up, upleft, left, downleft),
every direction cropped to the union of the visible pixels, with stray specks removed. The JSON
lists each direction's cell and the box its pixels fill, so the game can sit the piece on the head.

  python3 build-tools/pack-headgear.py [ids]
"""
import json, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "art", "pixellab", "headgear")
OUT = os.path.join(ROOT, "src", "art")
DIRS = {"south": "down", "south-east": "downright", "east": "right", "north-east": "upright",
        "north": "up", "north-west": "upleft", "west": "left", "south-west": "downleft"}


def clean(im, keep=0.04):
    """Drop little islands of pixels (less than `keep` of the biggest one)."""
    a = im.getchannel("A").load()
    w, h = im.size
    seen, groups = set(), []
    for y in range(h):
        for x in range(w):
            if a[x, y] < 40 or (x, y) in seen:
                continue
            stack, g = [(x, y)], []
            seen.add((x, y))
            while stack:
                px, py = stack.pop()
                g.append((px, py))
                for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and a[nx, ny] >= 40:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            groups.append(g)
    if not groups:
        return im
    big = max(len(g) for g in groups)
    out = im.copy()
    px = out.load()
    for g in groups:
        if len(g) < big * keep:
            for x, y in g:
                px[x, y] = (0, 0, 0, 0)
    return out


def pack(pid):
    base = os.path.join(SRC, pid)
    ims = {ours: clean(Image.open(os.path.join(base, f"{d}.png")).convert("RGBA")) for d, ours in DIRS.items()
           if os.path.exists(os.path.join(base, f"{d}.png"))}
    boxes = {k: im.getbbox() for k, im in ims.items() if im.getbbox()}
    x0 = min(b[0] for b in boxes.values()); y0 = min(b[1] for b in boxes.values())
    x1 = max(b[2] for b in boxes.values()); y1 = max(b[3] for b in boxes.values())
    cw, ch = x1 - x0, y1 - y0
    order = list(DIRS.values())
    sheet = Image.new("RGBA", (cw * len(order), ch))
    layout = {"cw": cw, "ch": ch, "dirs": {}}
    for i, k in enumerate(order):
        if k not in boxes:
            continue
        sheet.paste(ims[k].crop((x0, y0, x1, y1)), (i * cw, 0))
        b = boxes[k]
        layout["dirs"][k] = [i, b[0] - x0, b[1] - y0, b[2] - x0, b[3] - y0]
    sheet.save(os.path.join(OUT, f"hg_{pid}.png"), optimize=True)
    json.dump(layout, open(os.path.join(OUT, f"hg_{pid}.json"), "w"))
    print(pid, "cell", cw, "x", ch, "directions", len(layout["dirs"]))


for pid in sys.argv[1:] or sorted(os.listdir(SRC)):
    if os.path.isdir(os.path.join(SRC, pid)):
        pack(pid)
