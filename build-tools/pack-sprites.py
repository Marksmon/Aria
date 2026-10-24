"""Pack PixelLab character exports (art/pixellab/<name>/) into one sprite sheet per character.

  python3 build-tools/pack-sprites.py            # packs every character listed in CHARS

Writes src/art/<name>.png (rows = direction x animation, idle first) and src/art/<name>.json
with the frame size and where each animation lives. Frames are cropped to one shared box per
character, kept horizontally centered on the body so the sprite anchor stays under the feet.
"""
import json, os, re, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'pixellab')
OUT = os.path.join(ROOT, 'src', 'art')
DIRS = {'south': 'down', 'east': 'right', 'north': 'up', 'west': 'left'}
DIAGONALS = {'south-east': 'downright', 'north-east': 'upright', 'north-west': 'upleft', 'south-west': 'downleft'}
MIRROR = {'right': 'left', 'left': 'right', 'downright': 'downleft', 'downleft': 'downright', 'upright': 'upleft', 'upleft': 'upright'}

# name -> options.
#   eight:   also pack the four diagonal directions
#   use:     {game name: export name}, e.g. play the 'stride' animation as 'walk'
#   prefer:  export groups that win over others of the same name (e.g. a redone direction)
#   eyes:    the eye centres measured by hand from the standing poses, relative to the head (centre
#            x, crown): {'down': [x1, y1, x2, y2], 'right': [x, y]}. Without it they are detected.
#   skip:    export animations left out of the sheet (tries that weren't used)
#   mirror:  (anim, direction) pairs drawn as the mirror of the opposite side
#   bald:    made to the character standard: generated bald, so its measured head is the skull
#   strip:   cut the head off every frame (Ragnarok-style bodies: the game draws the head and hair
#            as their own layers at the neck; see pack-heads.py). The head data stays as anchors.
#   outline: (pixels, colour) border traced around the silhouette. colour 'shade' tints each
#            border pixel a dark shade of the colour beside it, like Ragnarok Online sprites
# (the first player, art/pixellab/player_v1, needed 'mirror': {('attack', 'right')}: its east
# attack had no sword)
# The PixelLab Pro art already has Ragnarok-style shaded edges, so no extra outline.
CHARS = {name: {} for name in ['slime', 'blueslime', 'sprout', 'crab', 'mushling', 'beetle', 'wisp', 'jarl']}
# even 8-frame template walk (the first one limped); front and back redone as a skeleton walk,
# where the template's legs barely moved
CHARS['player'] = {'eight': True, 'use': {'walk': 'walking'}, 'prefer': {'walking-e8b5c561'}, 'skip': {'stepv3', 'dodge'}, 'strip': True,
                   'eyes': {'down': [-4.5, 20, 5.5, 20], 'right': [4.5, 19.5]}}
CHARS.update({name: {'eight': True} for name in ['bram', 'tilly', 'wren', 'hild', 'gunnar', 'ragna', 'ulfr', 'saeunn']})
CHARS['novice'] = {'eight': True, 'use': {'walk': 'walking'}, 'skip': {'dodge'}, 'strip': True,  # skeleton walk in all eight directions
                   'eyes': {'down': [-5, 19, 6, 19], 'right': [6, 18]}}
CHARS['sorcerer'] = {'eight': True, 'use': {'walk': 'walking'}, 'skip': {'dodge'}, 'strip': True}
# the character standard (docs/character-standard.md): the new Trainee, bald, walk and attack only
# its south-east views came out facing away: they are the south-west ones mirrored
CHARS['trainee'] = {'eight': True, 'use': {'walk': 'walking'}, 'strip': True, 'bald': True,
                    'mirror': {('idle', 'downright'), ('walk', 'downright'), ('attack', 'downright')}}
CHARS['embla'] = {'eight': True}
CHARS.update({name: {'eight': True, 'use': {'walk': 'walking'}, 'strip': True, 'bald': True} for name in ['blader', 'sorc']})  # the Sorcerer, made like the Trainee


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


def body_colours(art, box, layout):
    """Colours that belong to the body (clothes, weapon), not the head: common below the neck in the
    standing poses and rare inside the head."""
    head, body = {}, {}
    for d in art:
        f = art[d]['idle'][0].crop(box)
        cx, crown, neck, w = layout[d]['idle'][3][0][:4]
        px = f.load()
        for y in range(f.height):
            for x in range(f.width):
                c = px[x, y]
                if c[3] <= 128:
                    continue
                inside = crown <= y < neck and abs(x - cx) <= w / 2
                bucket = head if inside else body if y >= neck + 4 else None
                if bucket is not None:
                    bucket[c[:3]] = bucket.get(c[:3], 0) + 1
    return {c for c, n in body.items() if n > 6 and n > head.get(c, 0) * 2}


def strip_head(f, h, keep, hair):
    """Remove the head from one frame: everything in the head's ellipse that isn't a body colour,
    dark outline pixels in it too (the head's outline), and hair-coloured spikes reaching past it."""
    cx, crown, neck, w = h[:4]
    f = f.copy()
    px = f.load()
    lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    near_hair = lambda c: any(abs(c[0] - q[0]) + abs(c[1] - q[1]) + abs(c[2] - q[2]) < 30 for q in hair)
    ex, ey = cx + 0.5, (crown + neck) / 2 - 1
    rx, ry = w / 2 + 3, (neck - crown) / 2 + 5
    for y in range(max(0, int(crown - 10)), min(f.height, int(neck + 2))):
        for x in range(max(0, int(cx - w)), min(f.width, int(cx + w + 1))):
            c = px[x, y]
            if not c[3]:
                continue
            inside = ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 <= 1
            if (inside and (c[:3] not in keep or lum(c) < 60)) or (y < neck - (neck - crown) * 0.3 and near_hair(c)):
                px[x, y] = (0, 0, 0, 0)
    return f


def strip_bald(f, h, keep, hair):
    """strip_head for a body made bald, which has nothing but its head above the neck: also what's
    left of the head's outline and eyes (pixels within two of the removed skin, above the neck) and
    small specks around it."""
    cx, crown, neck, w = h[:4]
    out = strip_head(f, h, keep, hair)
    a, px = f.getchannel('A').load(), out.load()
    gone = {(x, y) for y in range(f.height) for x in range(f.width) if a[x, y] > 128 and px[x, y][3] <= 128}
    ex, ey, rx, ry = cx + 0.5, (crown + neck) / 2 - 1, w / 2 + 5, (neck - crown) / 2 + 7
    region = lambda x, y: ((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 <= 1
    for _ in range(2):
        drop = [(x, y) for y in range(max(0, crown - 12), neck) for x in range(max(0, int(cx - w)), min(f.width, int(cx + w + 1)))
                if px[x, y][3] > 128 and region(x, y) and any((x + i, y + j) in gone for i in (-1, 0, 1) for j in (-1, 0, 1))]
        for p in drop:
            px[p] = (0, 0, 0, 0)
            gone.add(p)
    # specks: little islands left inside the head's region
    solid = {(x, y) for y in range(max(0, crown - 12), min(f.height, neck + 3)) for x in range(max(0, int(cx - w)), min(f.width, int(cx + w + 1))) if px[x, y][3] > 128}
    seen = set()
    for p in solid:
        if p in seen:
            continue
        g, stack, edge = [], [p], False
        seen.add(p)
        while stack:
            q = stack.pop()
            g.append(q)
            for i in (-1, 0, 1):
                for j in (-1, 0, 1):
                    n = (q[0] + i, q[1] + j)
                    if n in solid and n not in seen:
                        seen.add(n)
                        stack.append(n)
                    elif n not in solid and 0 <= n[0] < f.width and 0 <= n[1] < f.height and px[n][3] > 128:
                        edge = True  # joined to the body outside the region looked at
        if not edge and len(g) < 8 and all(region(*q) for q in g):
            for q in g:
                px[q] = (0, 0, 0, 0)
    return out



# Fitting the standard bald head (src/art/heads.png, from pack-heads.py) onto a body made bald:
# the head goes where the body's own head was drawn. At a size, and for each frame a chin point,
# chosen so the standard head covers the frame's own head best (overlap over union).
HEAD_GROW = 1.06  # then drawn this much bigger, about the chin: a little big, like Ragnarok's heads


def head_masks():
    meta = json.load(open(os.path.join(OUT, 'heads.json')))
    sheet = Image.open(os.path.join(OUT, 'heads.png')).convert('RGBA')
    cw, ch = meta['cw'], meta['ch']
    masks = {}
    for d, g in meta['dirs'].items():
        a = np.array(sheet.crop((g['col'] * cw, 0, (g['col'] + 1) * cw, ch)).getchannel('A')) >= 128
        masks[d] = (a, g['chin'])
    return masks


def own_head(f, lim):
    """the frame's own head as a mask: its biggest patch of skin (the eyes filled in) and the outline
    around it"""
    a = np.array(f)
    r, g, b, al = (a[..., i].astype(int) for i in range(4))
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    skin = (al > 128) & (r > 150) & (r >= g) & (g >= b - 10) & (lum >= 110)
    skin[lim:] = False
    pts = set(zip(*np.nonzero(skin)))
    best, seen = [], set()
    for p in pts:
        if p in seen:
            continue
        grp, stack = [], [p]
        seen.add(p)
        while stack:
            q = stack.pop()
            grp.append(q)
            for n in ((q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1)):
                if n in pts and n not in seen:
                    seen.add(n)
                    stack.append(n)
        if len(grp) > len(best):
            best = grp
    m = np.zeros(skin.shape, bool)
    rows = {}
    for y, x in best:
        lo, hi = rows.get(y, (x, x))
        rows[y] = (min(lo, x), max(hi, x))
    for y, (lo, hi) in rows.items():
        m[y, lo:hi + 1] = True
    m[1:] |= m[:-1].copy(); m[:-1] |= m[1:].copy(); m[:, 1:] |= m[:, :-1].copy(); m[:, :-1] |= m[:, 1:].copy()
    return m if len(best) > 20 else None


def head_fit(m, mask, sc, guess, reach, step):
    """the chin point (frame pixels) where the standard head at scale sc best covers mask m"""
    hm, (ax, ay) = mask
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = max(0, ys.min() - 12), min(m.shape[0], ys.max() + 12), max(0, xs.min() - 12), min(m.shape[1], xs.max() + 12)
    win = m[y0:y1, x0:x1]
    gy, gx = np.mgrid[y0:y1, x0:x1] + 0.5
    best = (-1.0, guess)
    n = int(round(reach / step))
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            X, Y = guess[0] + i * step, guess[1] + j * step
            u, v = ((gx - X) / sc + ax).astype(int), ((gy - Y) / sc + ay).astype(int)
            ok = (u >= 0) & (u < hm.shape[1]) & (v >= 0) & (v < hm.shape[0])
            c = np.zeros(win.shape, bool)
            c[ok] = hm[v[ok], u[ok]]
            iou = (c & win).sum() / max(1, (c | win).sum())
            if iou > best[0]:
                best = (iou, (X, Y))
    return best


def guess_of(m):
    ys, xs = np.nonzero(m)
    return (xs.mean() + 0.5, ys.max() + 0.5)


def load(name, eight=False, prefer=(), skip=()):
    base = os.path.join(SRC, name)
    meta = json.load(open(os.path.join(base, 'metadata.json')))
    frames = meta['states'][0]['frames']
    img = lambda p: Image.open(os.path.join(base, p)).convert('RGBA')
    out = {}
    for d, ours in {**DIRS, **(DIAGONALS if eight else {})}.items():
        out[ours] = {'idle': [img(frames['rotations'][d])]}
        # preferred groups last, so they win
        for anim, per_dir in sorted(frames['animations'].items(), key=lambda a: a[0] in prefer):
            # directions requested separately come back as e.g. 'walk-b730b657'
            base_name = re.sub(r'-[0-9a-f]{8}$', '', anim)
            if d in per_dir and base_name not in skip:
                out[ours][base_name] = [img(p) for p in per_dir[d]]
    # PixelLab draws each kind on its own canvas (standing 96, attacks 132, walks 144), each with the
    # character in the middle: centre them all on one canvas so frames line up when they change
    W = max(f.width for d in out.values() for fs in d.values() for f in fs)
    H = max(f.height for d in out.values() for fs in d.values() for f in fs)
    def pad(f):
        if f.size == (W, H):
            return f
        c = Image.new('RGBA', (W, H))
        c.paste(f, ((W - f.width) // 2, (H - f.height) // 2))
        return c
    return {d: {a: [pad(f) for f in fs] for a, fs in v.items()} for d, v in out.items()}


def pack(name, opts):
    art = load(name, opts.get('eight'), opts.get('prefer', ()), opts.get('skip', ()))
    for d in art.values():
        for ours, theirs in opts.get('use', {}).items():
            if theirs in d:
                d[ours] = d.pop(theirs)
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

    # each frame also records its feet (bottom of the body, effects ignored) as pixels up from
    # the frame's bottom edge, so the game can plant every frame's feet on the ground
    def feet(f):
        gs = islands(f)
        return fh - max(y for _, y in gs[0]) - 1 if gs else 0

    # and its head, for headgear drawn over any job's sprite: [centre x, crown y, neck y, width] in
    # frame pixels. Crown = top of the head (where the hair mass starts), neck = bottom of the head;
    # the game puts hat brims and eye lines between the two.
    # A frame that strays far from its animation's middle (a sword raised over the head) uses that.
    bh = max((f.getbbox() or (0, 0, 0, 0))[3] - (f.getbbox() or (0, 0, 0, 0))[1] for d in art.values() for f in d['idle'])

    def head(f, d):
        gs = islands(f)
        if not gs:
            return [fw // 2, 0, 0, 0]
        if opts.get('bald'):
            h = skull(f, d, min(y for _, y in gs[0]))
            if h:
                return h
        solid = set(gs[0])
        top = min(y for _, y in solid)
        # follow the head down row by row, keeping only the run of pixels around its centre, so a
        # sword or an arm held beside the head doesn't count as head
        xs = [x for x, y in solid if y <= top + 4]
        cx = sum(xs) / len(xs)
        runs = {}
        for y in range(top, top + int(bh * 0.6)):
            c = int(round(cx))
            near = [x for x in range(c - 5, c + 6) if (x, y) in solid]
            if not near:
                continue
            x = min(near, key=lambda v: abs(v - c))
            lo = hi = x
            while (lo - 1, y) in solid: lo -= 1
            while (hi + 1, y) in solid: hi += 1
            runs[y] = (lo, hi)
            cx = (lo + hi) / 2
        width = lambda y: runs[y][1] - runs[y][0] + 1 if y in runs else 0
        # chibi heads keep their proportions, so the bottom of the head ("neck") is a fixed share of
        # the body's height below the crown; that holds facing any way, unlike narrowing rows
        if opts.get('bald'):  # a bare skull: its top is the crown, the narrowest row under it the neck
            crown = top
            band = [y for y in runs if top + bh * 0.2 <= y <= top + bh * 0.36]
            neck = min(band, key=lambda y: (width(y), -y)) if band else top + round(bh * 0.3)
        else:
            mw = max(width(y) for y in runs if y < top + bh * 0.3)
            crown = next(y for y in sorted(runs) if width(y) >= mw * 0.6)
            neck = crown + round(bh * 0.3)
        mw = max(width(y) for y in runs if crown <= y < neck)
        # centre: the middle of the rows just under the crown
        top_rows = [y for y in range(crown, crown + max(3, int(bh * 0.18))) if y in runs and y < neck]
        cx = sum(runs[y][0] + runs[y][1] for y in top_rows) / (2 * len(top_rows))
        return [round(cx), crown, neck, mw, *eyes(f, runs, crown, neck, d)]

    # a bald body's head: the biggest patch of skin in the top half of the body (a staff, a sword or
    # a spell effect beside the head isn't skin). Its outline is a pixel around it; the neck is its
    # narrowest row under the face.
    def skull(f, d, top):
        px = f.load()
        lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
        skin = lambda c: c[3] > 128 and c[0] > 150 and c[0] >= c[1] >= c[2] - 10 and lum(c) >= 110
        dark = lambda c: c[3] > 128 and lum(c) < 110
        lim = min(f.height, top + int(bh * 0.5))
        pts = {(x, y) for y in range(top, lim) for x in range(fw) if skin(px[x, y])}
        best, seen = [], set()
        for p in pts:
            if p in seen:
                continue
            g, stack = [], [p]
            seen.add(p)
            while stack:
                q = stack.pop()
                g.append(q)
                for n in ((q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1)):
                    # the eyes and brows are inside the face: step over dark pixels to the skin past them
                    if n in pts and n not in seen:
                        seen.add(n)
                        stack.append(n)
            if len(g) > len(best):
                best = g
        if len(best) < bh * 2:
            return None
        rows = {}
        for x, y in best:
            lo, hi = rows.get(y, (x, x))
            rows[y] = (min(lo, x), max(hi, x))
        ys = sorted(rows)
        crown, bottom = ys[0] - 1, ys[-1]
        width = lambda y: rows[y][1] - rows[y][0] + 1
        w = max(width(y) for y in ys) + 2
        top_rows = ys[:max(3, len(ys) * 2 // 5)]
        cx = sum(rows[y][0] + rows[y][1] for y in top_rows) / (2 * len(top_rows))
        low = [y for y in ys if y >= crown + (bottom - crown) * 0.6]
        neck = min(low, key=lambda y: (width(y), -y)) if low else bottom
        return [round(cx), crown, neck, w, *eyes(f, {y: rows[y] for y in ys}, crown, neck, d)]

    # the eyes: the dark shapes inside the skin of the face, below the fringe (face pieces sit on
    # them). Each row's skin span is found, the dark pixels inside it are collected, and grouped by
    # column into eyes. Returns [x1, y1, x2, y2] for two eyes (left to right), [x, y] for one (a
    # side view), or [] if none show.
    def eyes(f, runs, crown, neck, d):
        px = f.load()
        H = neck - crown
        lum = lambda c: 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
        skin = lambda c: c[3] > 128 and c[0] > 150 and c[0] >= c[1] >= c[2] - 10 and lum(c) >= 125
        pts = []
        for y in range(crown + int(H * 0.58), crown + int(H * 0.92)):
            xs = [x for x in range(fw) if skin(px[x, y])]
            if len(xs) < 3:
                continue
            for x in range(xs[0] + 3, xs[-1] - 2):  # not the face's outline or an ear at its edge
                c = px[x, y]
                if c[3] > 128 and lum(c) < 110:
                    pts.append((x, y))
        if not pts or d.startswith('up'):
            return []
        # dark pixels per column, smoothed; eyes are the strongest peaks
        cols = {}
        for x, y in pts:
            cols.setdefault(x, []).append(y)
        lo, hi = min(cols), max(cols)
        sm = {x: sum(len(cols.get(x + k, [])) for k in (-1, 0, 1)) for x in range(lo, hi + 1)}
        peaks = [x for x in sm if sm[x] > 0 and sm[x] >= sm.get(x - 1, 0) and sm[x] >= sm.get(x + 1, 0)]
        peaks.sort(key=lambda x: -sm[x])
        chosen = []
        for x in peaks:
            if all(abs(x - c) >= 5 for c in chosen):
                chosen.append(x)
            if len(chosen) == 2:
                break
        def at(x):  # the eye's centre: dark pixels within two columns of the peak
            ys = [y for k in range(-2, 3) for y in cols.get(x + k, [])]
            xs = [x + k for k in range(-2, 3) for _ in cols.get(x + k, [])]
            return [round(sum(xs) / len(xs)), sorted(ys)[len(ys) // 2]]  # median height: fringe strands sit above
        if d in ('right', 'left'):  # one eye shows: the one at the front of the face
            x = max(chosen) if d == 'right' else min(chosen)
            return at(x)
        if len(chosen) < 2:
            return at(chosen[0]) if chosen else []
        a, b = sorted(chosen)
        return at(a) + at(b)

    # one head width per direction, the standing pose's (a slash effect, a raised sword or a tucked
    # roll can make a frame look wider);
    # a frame whose head looks far wider than that is confused by the weapon, so it borrows the
    # middle frame's head, while rolls and lunges that really move the head keep their own
    def heads(frames, d, mw=None):
        hs = [head(f, d) for f in frames]
        mw = mw or sorted(h[3] for h in hs)[len(hs) // 2]
        mid = sorted(hs, key=lambda h: h[1])[len(hs) // 2]
        # a head far from the animation's middle (a spell effect or a staff measured instead) borrows
        # the nearest frame's that is in place
        ok = [h[3] <= mw * 1.3 and abs(h[0] - mid[0]) <= mw * 0.5 and abs(h[2] - mid[2]) <= mw * 0.4 for h in hs]
        near = lambda i: hs[min((j for j in range(len(hs)) if ok[j]), key=lambda j: abs(j - i), default=None)] if any(ok) else mid
        return [[h[0], h[1], h[2], mw, *h[4:]] if ok[i] else [*near(i)[:3], mw, *near(i)[4:]] for i, h in enumerate(hs)]

    rows, layout = [], {}
    for d in art:
        layout[d] = {}
        for anim in ['idle'] + sorted(a for a in art[d] if a != 'idle'):
            frames = [f.crop(box) for f in art[d][anim]]
            layout[d][anim] = [len(rows), len(frames), [feet(f) for f in frames], heads(frames, d, layout[d].get('idle', [0, 0, 0, [[0, 0, 0, 0]]])[3][0][3])]
            rows.append(frames)
    # body size: how big the character itself is when standing, used to scale it in the world
    idle = [f.crop(box).getbbox() for d in art.values() for f in d['idle']]
    body = [max(b[2] - b[0] for b in idle), max(b[3] - b[1] for b in idle)]
    # foot: pixels from the frame's bottom edge up to where it stands (effects can reach lower)
    foot = fh - max(b[3] for b in idle)
    # hair colours: the commonest colours at the top of the head in the standing poses, so headgear
    # can hide the hair it covers (and only hair, not a sword raised over the head)
    from collections import Counter
    tally = Counter()
    for d in art:
        f = art[d]['idle'][0].crop(box)
        hd = layout[d]['idle'][3][0]
        px = f.load()
        for y in range(hd[1], hd[1] + max(2, int(bh * 0.09))):
            for x in range(max(0, hd[0] - hd[3] // 2), min(fw, hd[0] + hd[3] // 2)):
                r, g, b, a = px[x, y]
                if a > 128:
                    tally[(r // 8 * 8 + 4, g // 8 * 8 + 4, b // 8 * 8 + 4)] += 1
    total, hair = sum(tally.values()), []
    for c, n in tally.most_common(12):
        if n < total * 0.02:
            break
        hair.append(list(c))
    if opts.get('bald'):  # the standard head's size for this body: the best fit over its standing poses
        masks = head_masks()
        lim = int(bh * 0.6) + 8
        idle = {d: own_head(rows[layout[d]['idle'][0]][0], lim) for d in layout}
        def score(sc):
            fits = [head_fit(m, masks[d], sc, guess_of(m), 5, 1) for d, m in idle.items() if m is not None]
            return sum(f[0] for f in fits) / len(fits)
        fit_sc = max((0.66 + 0.02 * i for i in range(20)), key=score)
        # each direction's standing fit, as an offset from the rough guess, starts every frame's search
        start = {}
        for d, m in idle.items():
            if m is not None:
                _, (X, Y) = head_fit(m, masks[d], fit_sc, guess_of(m), 5, 1)
                gx, gy = guess_of(m)
                start[d] = (X - gx, Y - gy)
        def chins(d, frames):
            out = []
            for f in frames:
                m = own_head(f, lim)
                if m is None:
                    out.append(None)
                    continue
                gx, gy = guess_of(m)
                ox, oy = start.get(d, (0, 0))
                iou, (X, Y) = head_fit(m, masks[d], fit_sc, (gx + ox, gy + oy), 3, 0.5)
                out.append([round(X, 2), round(Y, 2)] if iou > 0.5 else None)
            # a frame whose head can't be seen well borrows the nearest one's
            for i, c in enumerate(out):
                if c is None:
                    near = [j for j in range(len(out)) if out[j] is not None]
                    out[i] = out[min(near, key=lambda j: abs(j - i))] if near else None
            return out
    if opts.get('strip'):  # Ragnarok-style body: the head comes off, its anchors stay
        keep = body_colours(art, box, layout) - {tuple(c) for c in hair}
        for d in layout:
            for anim, (r, n, _, hs, *_) in layout[d].items():
                if opts.get('bald'):  # each frame also records where the standard head's chin goes
                    layout[d][anim].append(chins(d, rows[r]))
                    rows[r] = [strip_bald(f, h, keep, hair) for f, h in zip(rows[r], hs)]
                else:
                    rows[r] = [strip_head(f, h, keep, hair) for f, h in zip(rows[r], hs)]
    cols = max(len(r) for r in rows)
    sheet = Image.new('RGBA', (cols * fw, len(rows) * fh))
    for y, r in enumerate(rows):
        for x, f in enumerate(r):
            sheet.paste(f, (x * fw, y * fh))

    os.makedirs(OUT, exist_ok=True)
    sheet.save(os.path.join(OUT, name + '.png'), optimize=True)
    # Eyes per frame come from the standing poses, where detection is reliable: offsets from the
    # head (centre x, crown) found facing front and to the side, the diagonals blended from those
    # (the face turned part way, the far eye foreshortened), then placed on every frame's head.
    def rel(d):
        h = layout.get(d, {}).get('idle', [0, 0, 0, [[0] * 4]])[3][0]
        e = h[4:]
        return [(e[i] - h[0], e[i + 1] - h[1]) for i in range(0, len(e), 2)]
    front, side = rel('down'), rel('right')
    if 'eyes' in opts:  # measured by hand
        e = opts['eyes']
        front, side = [(e['down'][0], e['down'][1]), (e['down'][2], e['down'][3])], [(e['right'][0], e['right'][1])]
    if len(front) == 2 and len(side) == 1:
        (fl, fy1), (fr, fy2) = front
        fy, mid, gap = (fy1 + fy2) / 2, (fl + fr) / 2, fr - fl
        sx = side[0][0]
        dmid, dgap = mid + (sx - mid) * 0.5, gap * 0.8
        sy = side[0][1]
        offs = {'down': [fl, fy, fr, fy], 'right': [sx, sy], 'left': [-sx, sy],
                'downright': [dmid - dgap / 2, fy, dmid + dgap / 2, fy], 'downleft': [-dmid - dgap / 2, fy, -dmid + dgap / 2, fy]}
        for d in layout:
            o = offs.get(d, [])
            for anim, entry in layout[d].items():
                entry[3] = [h[:4] + [round((h[0] if i % 2 == 0 else h[1]) + v, 1) for i, v in enumerate(o)] for h in entry[3]]

    json.dump({'fw': fw, 'fh': fh, 'body': body, 'foot': foot, 'hair': hair, 'bald': bool(opts.get('bald')), 'headScale': round(fit_sc * HEAD_GROW, 3) if opts.get('bald') else None, 'anims': layout}, open(os.path.join(OUT, name + '.json'), 'w'))
    print(name, 'frame', fw, 'x', fh, 'body', body, 'foot', foot, 'sheet', sheet.size, os.path.getsize(os.path.join(OUT, name + '.png')), 'bytes')


for n in sys.argv[1:] or CHARS:
    pack(n, CHARS.get(n, {}))
