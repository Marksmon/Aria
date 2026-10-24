"""Pack the player's heads (art/pixellab/heads/): the bald base head and the hairstyles, Ragnarok
style. Writes src/art/heads.png (a row per layer: bald, then each hairstyle; a column per
direction) and src/art/heads.json:

  { cw, ch, rows: { bald: 0, messy: 1, ... },
    dirs: { down: { col, chin: [x, y], crown, w, eyes: [x1, y1, x2, y2] | [x, y] | [] }, ... } }

chin is the anchor: under the middle of the skull, at the bottom of the head.

Geometry is measured on the bald head, in cell pixels: chin = bottom middle of the head (it goes
on the body's neck anchor), crown = top of the scalp, w = widest row, eyes = the centres of the
dark eye shapes (face headgear sits on them). A hairstyle's row holds only its hair: the pixels
where that hairstyle's head differs from the bald one, so a hair layer always lines up with the
face under it.

  python3 build-tools/pack-heads.py
"""
import json, os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'art', 'pixellab', 'heads')
OUT = os.path.join(ROOT, 'src', 'art')
DIRS = {'south': 'down', 'south-east': 'downright', 'east': 'right', 'north-east': 'upright',
        'north': 'up', 'north-west': 'upleft', 'west': 'left', 'south-west': 'downleft'}
STYLES = ['messy', 'long']


def load(name):
    base = os.path.join(SRC, name)
    if not os.path.isdir(base):
        return None
    return {ours: Image.open(os.path.join(base, f'{d}.png')).convert('RGBA') for d, ours in DIRS.items()}


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


def hair_of(styled, bald):
    """the hair layer: pixels where the styled head differs from the bald one"""
    out = Image.new('RGBA', styled.size)
    a, b, o = styled.load(), bald.load(), out.load()
    for y in range(styled.height):
        for x in range(styled.width):
            s, t = a[x, y], b[x, y]
            if s[3] < 128:
                continue
            if t[3] < 128 or sum(abs(s[i] - t[i]) for i in range(3)) > 60:
                o[x, y] = s
    # drop specks: the face may come back a pixel off here and there
    pts = solid(out)
    for p in list(pts):
        if sum((p[0] + i, p[1] + j) in pts for i in (-1, 0, 1) for j in (-1, 0, 1)) < 3:
            o[p] = (0, 0, 0, 0)
    return out


bald = load('bald')
layers = {'bald': bald}
for s in STYLES:
    styled = load(s)
    if styled:
        layers[s] = {d: hair_of(styled[d], bald[d]) for d in bald}
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
