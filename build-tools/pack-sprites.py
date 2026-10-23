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
#   outline: (pixels, colour) solid border traced around the silhouette, Ragnarok Online style
# (the first player, art/pixellab/player_v1, needed 'mirror': {('attack', 'right')}: its east
# attack had no sword)
OUTLINE = {'outline': (1, (34, 22, 14))}
CHARS = {name: OUTLINE for name in ['player', 'slime', 'blueslime', 'sprout', 'crab', 'mushling', 'beetle', 'wisp']}


def outline(f, width, colour):
    solid = f.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
    ring = solid.filter(ImageFilter.MaxFilter(2 * width + 1))
    out = Image.new('RGBA', f.size, colour + (0,))
    out.putalpha(ring)
    return Image.alpha_composite(out, f)


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
