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


def clean(im, keep=0.08):
    """Drop little islands of pixels (less than `keep` of the biggest one), like edge bleed from the sheet."""
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


# Face pieces are drawn from their front view only, like Ragnarok's face accessories: PixelLab
# renders glasses as a loose object (arms sticking out at every angle), so the packer keeps the
# front's lenses, squashes the far side for the diagonals, and makes a thin profile with a short
# arm for the sides. Faces aren't seen from behind. arms: cut what rises above the lenses.
FACE = {"round_glasses": {"arms": True, "temple": True}, "raven_mask": {}}


def rows_of(im):
    a = im.getchannel("A").load()
    w, h = im.size
    out = {}
    for y in range(h):
        xs = [x for x in range(w) if a[x, y] >= 40]
        if xs:
            out[y] = (xs[0], xs[-1])
    return out


ARM = 250  # alpha that marks a piece's arms and hinges: the game tucks those under the hair


def face_views(front, opts):
    """The views of a face piece built from its front: {view: (image, [lens centres (x, y)])}.
    Arms and hinges get alpha ARM, the lenses stay fully solid."""
    f = front.copy()
    if opts.get("arms"):  # keep the lens band: from the first row well filled with pixels down
        al = f.getchannel("A").load()
        count = {y: sum(al[x, y] >= 40 for x in range(f.width)) for y in range(f.height)}
        mc = max(count.values())
        top = min(y for y, n in count.items() if n >= mc * 0.35)
        px = f.load()
        for y in range(top):
            for x in range(f.width):
                px[x, y] = (0, 0, 0, 0)
    f = f.crop(f.getbbox())
    w, h = f.size
    half = w // 2
    px = f.load()
    lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]

    # each lens: the middle of its pale glass, and the box its frame spans
    def lens(x0, x1):
        pts = [(x, y) for x in range(x0, x1) for y in range(h) if px[x, y][3] > 128 and lum(px[x, y]) > 120]
        if not pts:
            pts = [(x, y) for x in range(x0, x1) for y in range(h) if px[x, y][3] > 128]
        cx = sum(p[0] for p in pts) / len(pts); cy = sum(p[1] for p in pts) / len(pts)
        return cx, cy, min(p[0] for p in pts) - 2, max(p[0] for p in pts) + 2
    L, R = lens(0, half), lens(half, w)
    if opts.get("arms"):  # hinges outside the lenses are arms
        for y in range(h):
            for x in list(range(0, max(0, L[2]))) + list(range(min(w, R[3] + 1), w)):
                c = px[x, y]
                if c[3] > 128:
                    px[x, y] = (c[0], c[1], c[2], ARM)

    def squash(im, k):
        return im.resize((max(1, round(im.width * k)), im.height), Image.NEAREST)

    left, right = f.crop((0, 0, half, h)), squash(f.crop((half, 0, w, h)), 0.6)
    diag = Image.new("RGBA", (left.width + right.width, h))
    diag.paste(left, (0, 0)); diag.paste(right, (left.width, 0))
    diag_lens = [(L[0], L[1]), (half + (R[0] - half) * 0.6, R[1])]
    near = squash(f.crop((half, 0, w, h)), 0.32)
    near_cx = (R[0] - half) * 0.32
    if opts.get("temple"):  # an arm back to the ear, in the frame's own dark outline colour
        arm = round(w * 0.45)
        side = Image.new("RGBA", (arm + near.width, h))
        side.paste(near, (arm, 0))
        dark = min((c for c in list(near.getdata()) if c[3] > 200), key=lambda c: sum(c[:3]), default=(30, 30, 36, 255))
        y = round(R[1]) - 1
        for x in range(arm):
            for yy in (y, y + 1):
                side.putpixel((x, yy), (dark[0], dark[1], dark[2], ARM))
        side_lens = [(arm + near_cx, R[1])]
    else:
        side, side_lens = near, [(near_cx, R[1])]
    flip = lambda im, ls, W: (im.transpose(Image.FLIP_LEFT_RIGHT), sorted([(W - 1 - x, y) for x, y in ls]))
    out = {"down": (f, [(L[0], L[1]), (R[0], R[1])]), "downright": (diag, diag_lens), "right": (side, side_lens)}
    out["downleft"] = flip(diag, diag_lens, diag.width)
    out["left"] = flip(side, side_lens, side.width)
    return out


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
    lenses = {}
    if pid in FACE and "down" in ims:  # built from the front, each view centred in a cell
        views = face_views(ims["down"], FACE[pid])
        W = max(v.width for v, _ in views.values()) + 4
        H = max(v.height for v, _ in views.values()) + 4
        ims = {}
        for k, (v, ls) in views.items():
            cell = Image.new("RGBA", (W, H))
            ox, oy = (W - v.width) // 2, (H - v.height) // 2
            cell.paste(v, (ox, oy))
            ims[k] = cell
            lenses[k] = [(x + ox, y + oy) for x, y in ls]
        frames = {k: [im] for k, im in ims.items()}
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
        # [column, box (x0, y0, x1, y1), rim (cx, width, y), frame count, lens centres (face pieces)]
        layout["dirs"][k] = [i, b[0] - x0, b[1] - y0, b[2] - x0, b[3] - y0, *rim(ims[k].crop((x0, y0, x1, y1))), len(frames[k]),
                             [round(v - o, 1) for x, y in lenses.get(k, []) for v, o in ((x, x0), (y, y0))]]
    sheet.save(os.path.join(OUT, f"hg_{pid}.png"), optimize=True)
    json.dump(layout, open(os.path.join(OUT, f"hg_{pid}.json"), "w"))
    print(pid, "cell", cw, "x", ch, "directions", len(layout["dirs"]), "frames", rows)


for pid in sys.argv[1:] or sorted(os.listdir(SRC)):
    if os.path.isdir(os.path.join(SRC, pid)):
        pack(pid)
