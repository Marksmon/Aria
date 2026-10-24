"""Pack the player's heads (art/pixellab/heads/): the bald base head and the hairstyles, Ragnarok
style. Writes src/art/heads.png (a row per layer: bald, then each hairstyle; a column per
direction) and src/art/heads.json:

  { cw, ch, rows: { bald: 0, messy: 1, ... },
    dirs: { down: { col, chin: [x, y], crown, w, eyes: [x1, y1, x2, y2] | [x, y] | [] }, ... } }

chin is the anchor: under the middle of the skull, at the bottom of the head.

The heads are shrunk to the job bodies' pixel size (SCALE), so in the game one head pixel is one
body pixel and the head is painted straight into each body frame, on its pixel grid. The shrink
keeps pixel art crisp: each new pixel takes the colour covering most of its footprint, and on the
silhouette's edge the outline wins, so it stays an unbroken line.

Geometry is measured on the bald head, in cell pixels: chin = bottom middle of the head (it goes
on the body's neck anchor), crown = top of the scalp, w = widest row, eyes = the centres of the
dark eye shapes (face headgear sits on them). A hairstyle's row holds only its hair: the pixels
where that hairstyle's head differs from the bald one, so a hair layer always lines up with the
face under it.

  python3 build-tools/pack-heads.py

Headgear is made the same way, as states of the bald head (pixellab-heads.py gear): each piece is
what its state adds to the bald head, so it sits on the head and face as drawn, and is shrunk the
same way. Each goes to src/art/hg_<id>.png (a column per direction, a row per animation frame)
and hg_<id>.json:

  { cw, ch, frames, slot, dirs: { down: col, ... }, box: { down: [x0, y0, x1, y1], ... },
    cut: { down: [row per column], ... } | null }

cut hides the wearer's hair above a row in each column of the cell, so it doesn't poke through:
a helmet or cap hides the hair above its brim, a crown the spikes above it; a wreath rests in the
hair and face pieces leave it alone.
"""
import json, math, os, re
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'art', 'pixellab', 'heads')
OUT = os.path.join(ROOT, 'src', 'art')
DIRS = {'south': 'down', 'south-east': 'downright', 'east': 'right', 'north-east': 'upright',
        'north': 'up', 'north-west': 'upleft', 'west': 'left', 'south-west': 'downleft'}
STYLES = ['messy', 'mane', 'long']  # 'long' is kept for a female look later
SCALE = 0.9  # head pixels to body pixels
# headgear: slot, and how it hides the hair (see above)
GEAR = {'horned_helm': ('head', 'brim'), 'woven_cap': ('head', 'brim'), 'flower_wreath': ('head', None),
        'ember_crown': ('head', 'top'), 'flame_circlet': ('head', 'top'),
        'round_glasses': ('face', None), 'raven_mask': ('face', None)}
FLAME = {'flame_circlet': 8}  # its fire flickers: this many frames, made from the still piece


def flicker(piece, f, n):
    """one frame of a burning piece: its fire colours, ranked dark to bright, ride a wave that rises
    through the flames, so they flicker and climb; everything else stays still"""
    out = piece.copy()
    px = out.load()
    lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    fire = lambda c: c[3] >= 128 and c[0] >= 170 and c[0] >= c[1] >= c[2] and c[0] - c[2] >= 80
    pts = [(x, y) for y in range(out.height) for x in range(out.width) if fire(px[x, y])]
    ramp = sorted({px[p][:3] for p in pts}, key=lum)
    if len(ramp) < 3:
        return out
    rank = {c: i / (len(ramp) - 1) for i, c in enumerate(ramp)}
    for x, y in pts:
        c = px[x, y]
        t = rank[c[:3]] + 0.22 * math.sin(2 * math.pi * f / n + y * 0.7 + x * 0.45)
        c2 = ramp[round(min(1, max(0, t)) * (len(ramp) - 1))]
        px[x, y] = (*c2, c[3])
    return out


def shrink(im, s=SCALE):
    a = np.array(im).astype(int)
    h0, w0 = a.shape[:2]
    w1, h1 = round(w0 * s), round(h0 * s)
    out = np.zeros((h1, w1, 4), np.uint8)
    lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    for y in range(h1):
        for x in range(w1):
            y0, y1, x0, x1 = y / s, (y + 1) / s, x / s, (x + 1) / s
            wts = {}
            for sy in range(int(y0), min(h0, int(np.ceil(y1)))):
                for sx in range(int(x0), min(w0, int(np.ceil(x1)))):
                    w = (min(y1, sy + 1) - max(y0, sy)) * (min(x1, sx + 1) - max(x0, sx))
                    c = tuple(a[sy, sx]) if a[sy, sx, 3] >= 128 else (0, 0, 0, 0)
                    wts[c] = wts.get(c, 0) + w
            tot = sum(wts.values())
            dark = {c: w for c, w in wts.items() if c[3] and lum(c) < 70}
            edge = (0, 0, 0, 0) in wts
            if edge and dark and sum(dark.values()) >= tot * 0.34:
                c = max(dark, key=dark.get)
            else:
                c = max(wts, key=wts.get)
            out[y, x] = c
    return Image.fromarray(out)


def load(name):
    """a head (the bald one, or a hairstyle or headgear drawn on it) in all 8 directions, shrunk;
    an animated one: a list of frames per direction"""
    base = os.path.join(SRC, name)
    if not os.path.isdir(base):
        return None
    ims = {}
    for d, ours in DIRS.items():
        frames = sorted((f for f in os.listdir(base) if re.fullmatch(rf'{d}_\d+\.png', f)), key=lambda f: int(f.rsplit('_', 1)[1][:-4]))
        if frames:
            ims[ours] = [shrink(Image.open(os.path.join(base, f)).convert('RGBA')) for f in frames]
        else:
            ims[ours] = shrink(Image.open(os.path.join(base, f'{d}.png')).convert('RGBA'))
    return ims


def solid(im):
    a = im.getchannel('A').load()
    return {(x, y) for y in range(im.height) for x in range(im.width) if a[x, y] >= 128}


def measure(im, d):
    pts = solid(im)
    ys = [y for _, y in pts]
    crown, bottom = min(ys), max(ys)
    rows = {}
    for x, y in pts:
        lo, hi = rows.get(y, (x, x))
        rows[y] = (min(lo, x), max(hi, x))
    w = max(hi - lo + 1 for lo, hi in rows.values())
    # the anchor: under the middle of the skull (the rows near the top; a side view's chin juts
    # forward), at the bottom of the head
    top = [rows[y] for y in range(crown, crown + max(3, int((bottom - crown) * 0.4))) if y in rows]
    chin = [round(sum(lo + hi + 1 for lo, hi in top) / (2 * len(top)), 1), bottom + 1]
    return {'chin': chin, 'crown': crown, 'w': w, 'eyes': eyes(im, pts, crown, bottom, d)}


def eyes(im, pts, crown, bottom, d):
    """the eye centres: dark shapes inside the face, away from its outline, in the lower half"""
    if d.startswith('up'):
        return []
    px = im.load()
    lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    inner = lambda x, y: all((x + i, y + j) in pts for i in (-1, 0, 1) for j in (-1, 0, 1))
    mid = crown + (bottom - crown) * 0.45
    dark = {(x, y) for x, y in pts if y > mid and y < bottom - 2 and inner(x, y) and lum(px[x, y]) < 105}
    # group into shapes
    groups, seen = [], set()
    for p in sorted(dark):
        if p in seen:
            continue
        g, stack = [], [p]
        seen.add(p)
        while stack:
            q = stack.pop()
            g.append(q)
            for n in ((q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1), (q[0] + 1, q[1] + 1), (q[0] - 1, q[1] + 1), (q[0] + 1, q[1] - 1), (q[0] - 1, q[1] - 1)):
                if n in dark and n not in seen:
                    seen.add(n)
                    stack.append(n)
        groups.append(g)
    groups = [g for g in groups if len(g) >= 3]
    groups.sort(key=len, reverse=True)
    centre = lambda g: [round(sum(x for x, _ in g) / len(g) + 0.5, 1), round(sum(y for _, y in g) / len(g) + 0.5, 1)]
    if d in ('right', 'left'):  # one eye shows: the one at the front of the face
        if not groups:
            return []
        g = max(groups[:2], key=lambda g: sum(x for x, _ in g) / len(g) * (1 if d == 'right' else -1))
        return centre(g)
    two = sorted(groups[:2], key=lambda g: min(x for x, _ in g))
    return [v for g in two for v in centre(g)] if len(two) == 2 else (centre(two[0]) if two else [])


def added(styled, bald):
    """what a state adds to the bald head: the pixels where it differs, without specks"""
    out = Image.new('RGBA', styled.size)
    a, b, o = styled.load(), bald.load(), out.load()
    for y in range(styled.height):
        for x in range(styled.width):
            s, t = a[x, y], b[x, y]
            if s[3] >= 128 and (t[3] < 128 or sum(abs(s[i] - t[i]) for i in range(3)) > 60):
                o[x, y] = s
    pts = solid(out)
    for p in list(pts):
        if sum((p[0] + i, p[1] + j) in pts for i in (-1, 0, 1) for j in (-1, 0, 1)) < 3:
            o[p] = (0, 0, 0, 0)
    return out


def cut_of(piece, how, geo):
    """the hair-hiding rows per column (see above), or None"""
    if not how:
        return None
    a = piece.getchannel('A').load()
    cols = {x: [y for y in range(piece.height) if a[x, y] >= 128] for x in range(piece.width)}
    cols = {x: ys for x, ys in cols.items() if ys}
    if not cols:
        return None
    if how == 'top':  # the hair above the piece, where it is
        return [min(cols[x]) if x in cols else 0 for x in range(piece.width)]
    # the brim: where the piece comes down to over the middle of the head; no hair above it
    cx, half = geo['chin'][0], geo['w'] / 2
    mid = sorted(max(ys) for x, ys in cols.items() if abs(x + 0.5 - cx) <= half * 0.7) or sorted(max(ys) for ys in cols.values())
    brim = mid[len(mid) // 2]
    return [brim] * piece.width


def hair_of(styled, bald, d, geo):
    """the hair layer: pixels where the styled head differs from the bald one. Hair that hangs
    below the chin in front of the neck (the shadow behind a long-haired head) would cover the
    body's chest, so below the chin only the strands at the sides stay (all of it, seen from
    behind)."""
    out = Image.new('RGBA', styled.size)
    a, b, o = styled.load(), bald.load(), out.load()
    for y in range(styled.height):
        for x in range(styled.width):
            s, t = a[x, y], b[x, y]
            if s[3] < 128:
                continue
            if t[3] < 128 or sum(abs(s[i] - t[i]) for i in range(3)) > 60:
                o[x, y] = s
    if not d.startswith('up'):
        cx, cy = geo['chin']
        half = geo['w'] * 0.34
        for y in range(round(cy) - 1, styled.height):
            for x in range(styled.width):
                dx = x + 0.5 - cx
                front = abs(dx) < half if d not in ('right', 'left') else (dx > -half * 0.4 if d == 'right' else dx < half * 0.4)
                if front:
                    o[x, y] = (0, 0, 0, 0)
    # drop specks: the face may come back a pixel off here and there
    pts = solid(out)
    for p in list(pts):
        if sum((p[0] + i, p[1] + j) in pts for i in (-1, 0, 1) for j in (-1, 0, 1)) < 3:
            o[p] = (0, 0, 0, 0)
    return out


bald = load('bald')
geo = {d: measure(bald[d], d) for d in bald}
layers = {'bald': bald}
for s in STYLES:
    styled = load(s)
    if styled:
        layers[s] = {d: hair_of(styled[d], bald[d], d, geo[d]) for d in bald}
order = list(DIRS.values())
cw, ch = bald['down'].size
sheet = Image.new('RGBA', (cw * len(order), ch * len(layers)))
rows = {}
for r, (name, ims) in enumerate(layers.items()):
    rows[name] = r
    for c, d in enumerate(order):
        sheet.paste(ims[d], (c * cw, r * ch))
dirs = {d: {'col': c, **measure(bald[d], d)} for c, d in enumerate(order)}
os.makedirs(OUT, exist_ok=True)
sheet.save(os.path.join(OUT, 'heads.png'), optimize=True)
json.dump({'cw': cw, 'ch': ch, 'rows': rows, 'dirs': dirs}, open(os.path.join(OUT, 'heads.json'), 'w'))
print('heads', list(rows), 'cell', cw, 'x', ch)
for d, v in dirs.items():
    print(' ', d, v)

for gid, (slot, how) in GEAR.items():
    worn = load(gid)
    if not worn:
        continue
    frames = {d: (v if isinstance(v, list) else [v]) for d, v in worn.items()}
    n = max(len(v) for v in frames.values())
    pieces = {d: [added(f, bald[d]) for f in v] for d, v in frames.items()}
    if gid in FLAME:
        pieces = {d: [flicker(v[0], f, FLAME[gid]) for f in range(FLAME[gid])] for d, v in pieces.items()}
        n = FLAME[gid]
    sheet = Image.new('RGBA', (cw * len(order), ch * n))
    box = {}
    for c, d in enumerate(order):
        for f in range(n):
            sheet.paste(pieces[d][f % len(pieces[d])], (c * cw, f * ch))
        b = pieces[d][0].getbbox()
        box[d] = list(b) if b else None
    cut = {d: cut_of(pieces[d][0], how, geo[d]) for d in order} if how else None
    sheet.save(os.path.join(OUT, f'hg_{gid}.png'), optimize=True)
    json.dump({'cw': cw, 'ch': ch, 'frames': n, 'slot': slot, 'dirs': {d: c for c, d in enumerate(order)}, 'box': box, 'cut': cut},
              open(os.path.join(OUT, f'hg_{gid}.json'), 'w'))
    print('headgear', gid, slot, 'frames', n)
