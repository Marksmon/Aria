"""Pack PixelLab character exports (art/pixellab/<name>/) into one sprite sheet per character.

  python3 build-tools/pack-sprites.py            # packs every character listed in CHARS

Writes src/art/<name>.png (rows = direction x animation, idle first) and src/art/<name>.json
with the frame size and where each animation lives. Frames are cropped to one shared box per
character, kept horizontally centered on the body so the sprite anchor stays under the feet.
"""
import json, os, sys
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'pixellab')
OUT = os.path.join(ROOT, 'src', 'art')
DIRS = {'south': 'down', 'east': 'right', 'north': 'up', 'west': 'left'}
MIRROR = {'right': 'left', 'left': 'right'}

# name -> options.
#   mirror:  (anim, direction) pairs drawn as the mirror of the opposite side
#   outline: (pixels, colour) border traced around the silhouette. colour 'shade' tints each
#            border pixel a dark shade of the colour beside it, like Ragnarok Online sprites
# (the first player, art/pixellab/player_v1, needed 'mirror': {('attack', 'right')}: its east
# attack had no sword)
OUTLINE = {'outline': (1, 'shade')}
CHARS = {name: OUTLINE for name in ['player', 'slime', 'blueslime', 'sprout', 'crab', 'mushling', 'beetle', 'wisp']}


def islands(f):
    """Connected groups of solid pixels, largest first, as lists of (x, y)."""
    a = f.getchannel('A').load()
    W, H = f.size
    seen, groups = set(), []
    for y in range(H):
        for x in range(W):
            if a[x, y] < 128 or (x, y) in seen:
                continue
            seen.add((x, y))
            stack, g = [(x, y)], []
            while stack:
                p = stack.pop()
                g.append(p)
                for q in ((p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)):
                    if 0 <= q[0] < W and 0 <= q[1] < H and q not in seen and a[q] >= 128:
                        seen.add(q)
                        stack.append(q)
            groups.append(g)
    return sorted(groups, key=len, reverse=True)


def clean(f, still):
    """Erase stray specks PixelLab sometimes leaves (dots, bits of text). Standing frames keep only
    pieces at least 5% the size of the body; animation frames only lose tiny specks, so slash
    effects survive."""
    gs = islands(f)
    if not gs:
        return f
    keep = max(len(gs[0]) * 0.05, 1) if still else 6
    f = f.copy()
    px = f.load()
    for g in gs:
        if len(g) < keep:
            for p in g:
                px[p] = (0, 0, 0, 0)
    return f


def outline(f, width, colour):
    solid = f.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    ring = solid.filter(ImageFilter.MaxFilter(2 * width + 1))
    if colour != 'shade':
        out = Image.new('RGBA', f.size, colour + (0,))
        out.putalpha(ring)
        return Image.alpha_composite(out, f)
    # each new border pixel: the average of the solid pixels around it, darkened
    src, rg, sd = f.load(), ring.load(), solid.load()
    out = f.copy()
    px = out.load()
    W, H = f.size
    for y in range(H):
        for x in range(W):
            if not rg[x, y] or sd[x, y]:
                continue
            near = [src[x + i, y + j] for i in range(-width, width + 1) for j in range(-width, width + 1)
                    if 0 <= x + i < W and 0 <= y + j < H and sd[x + i, y + j]]
            if near:
                r, g, b = (sum(p[k] for p in near) / len(near) for k in range(3))
                px[x, y] = (int(r * 0.38), int(g * 0.32), int(b * 0.3), 255)
    return out


def load(name):
    base = os.path.join(SRC, name)
    meta = json.load(open(os.path.join(base, 'metadata.json')))
    frames = meta['states'][0]['frames']
    img = lambda p: Image.open(os.path.join(base, p)).convert('RGBA')
    out = {}
    for d, ours in DIRS.items():
        out[ours] = {'idle': [img(frames['rotations'][d])]}
        for anim, per_dir in frames['animations'].items():
            out[ours][anim] = [img(p) for p in per_dir[d]]
    return out


def pack(name, opts):
    art = load(name)
    for d in art.values():
        for anim, fs in d.items():
            d[anim] = [clean(f, anim == 'idle') for f in fs]
    for anim, d in opts.get('mirror', ()):
        art[d][anim] = [ImageOps.mirror(f) for f in art[MIRROR[d]][anim]]
    if 'outline' in opts:
        for d in art.values():
            for anim, fs in d.items():
                d[anim] = [outline(f, *opts['outline']) for f in fs]

    every = [f for d in art.values() for fs in d.values() for f in fs]
    W, H = every[0].size
    x0, y0, x1, y1 = W, H, 0, 0
    for f in every:
        b = f.getbbox()
        if b:
            x0, y0, x1, y1 = min(x0, b[0]), min(y0, b[1]), max(x1, b[2]), max(y1, b[3])
    half = max(W / 2 - x0, x1 - W / 2)
    box = (int(W / 2 - half), y0, int(W / 2 + half + 0.5), y1)
    fw, fh = box[2] - box[0], box[3] - box[1]

    rows, layout = [], {}
    for d in ['down', 'right', 'up', 'left']:
        layout[d] = {}
        for anim in ['idle'] + sorted(a for a in art[d] if a != 'idle'):
            layout[d][anim] = [len(rows), len(art[d][anim])]
            rows.append([f.crop(box) for f in art[d][anim]])
    # body size: how big the character itself is when standing, used to scale it in the world
    idle = [f.crop(box).getbbox() for d in art.values() for f in d['idle']]
    body = [max(b[2] - b[0] for b in idle), max(b[3] - b[1] for b in idle)]
    cols = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (cols * fw, len(rows) * fh))
    for y, r in enumerate(rows):
        for x, f in enumerate(r):
            sheet.paste(f, (x * fw, y * fh))

    os.makedirs(OUT, exist_ok=True)
    sheet.save(os.path.join(OUT, name + '.png'), optimize=True)
    json.dump({'fw': fw, 'fh': fh, 'body': body, 'anims': layout}, open(os.path.join(OUT, name + '.json'), 'w'))
    print(name, 'frame', fw, 'x', fh, 'body', body, 'sheet', sheet.size, os.path.getsize(os.path.join(OUT, name + '.png')), 'bytes')


for n in sys.argv[1:] or CHARS:
    pack(n, CHARS.get(n, {}))
