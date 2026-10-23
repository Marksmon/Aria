"""Pack PixelLab headgear (art/pixellab/headgear/<id>/<direction>.png) into src/art/hg_<id>.png + .json.

Each sheet has a column per direction (down, downright, right, upright, up, upleft, left, downleft)
and a row per animation frame (one row for a still piece), every cell cropped to the union of the
visible pixels, with stray specks removed. The JSON
lists each direction's cell, the box its pixels fill and its rim: the widest row in the bottom part
of the piece (a hat's brim, a pair of glasses' frame), [centre x, width, y]. The game sizes the rim
to the head and sits it on the head's attach line, so horns or plumes don't throw the fit off.

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


def rim(im, band=0.35):
    a = im.getchannel("A").load()
    w, h = im.size
    rows = {}
    for y in range(h):
        xs = [x for x in range(w) if a[x, y] >= 40]
        if xs:
            rows[y] = (xs[0], xs[-1])
    top, bottom = min(rows), max(rows)
    lo = bottom - max(1, int((bottom - top) * band))
    y = max((r for r in rows if r >= lo), key=lambda r: (rows[r][1] - rows[r][0], r))
    return [(rows[y][0] + rows[y][1] + 1) / 2, rows[y][1] - rows[y][0] + 1, y]


def pack(pid):
    base = os.path.join(SRC, pid)
    load = lambda name: clean(Image.open(os.path.join(base, name)).convert("RGBA"))
    ims, frames = {}, {}
    for d, ours in DIRS.items():
        if not os.path.exists(os.path.join(base, f"{d}.png")):
            continue
        ims[ours] = load(f"{d}.png")
        n = 0
        while os.path.exists(os.path.join(base, f"{d}_{n}.png")):
            n += 1
        frames[ours] = [load(f"{d}_{i}.png") for i in range(n)] or [ims[ours]]
    boxes = {k: im.getbbox() for k, im in ims.items() if im.getbbox()}
    every = [f.getbbox() for fs in frames.values() for f in fs if f.getbbox()] + list(boxes.values())
    x0 = min(b[0] for b in every); y0 = min(b[1] for b in every)
    x1 = max(b[2] for b in every); y1 = max(b[3] for b in every)
    cw, ch = x1 - x0, y1 - y0
    order = list(DIRS.values())
    rows = max(len(fs) for fs in frames.values())
    sheet = Image.new("RGBA", (cw * len(order), ch * rows))
    layout = {"cw": cw, "ch": ch, "dirs": {}}
    for i, k in enumerate(order):
        if k not in boxes:
            continue
        for r, f in enumerate(frames[k]):
            sheet.paste(f.crop((x0, y0, x1, y1)), (i * cw, r * ch))
        b = boxes[k]
        # [column, box (x0, y0, x1, y1), rim (cx, width, y), frame count]
        layout["dirs"][k] = [i, b[0] - x0, b[1] - y0, b[2] - x0, b[3] - y0, *rim(ims[k].crop((x0, y0, x1, y1))), len(frames[k])]
    sheet.save(os.path.join(OUT, f"hg_{pid}.png"), optimize=True)
    json.dump(layout, open(os.path.join(OUT, f"hg_{pid}.json"), "w"))
    print(pid, "cell", cw, "x", ch, "directions", len(layout["dirs"]), "frames", rows)


for pid in sys.argv[1:] or sorted(os.listdir(SRC)):
    if os.path.isdir(os.path.join(SRC, pid)):
        pack(pid)
