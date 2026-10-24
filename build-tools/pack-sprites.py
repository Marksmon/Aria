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
#   pick:    {(anim, direction): [frame indices]}: play only these frames, in this order (before mirror)
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
CHARS['trainee'] = {'eight': True, 'use': {'walk': 'walking'}, 'bald': True,
                    'mirror': {('idle', 'downright'), ('walk', 'downright'), ('attack', 'downright')}}
CHARS['embla'] = {'eight': True}
CHARS.update({name: {'eight': True, 'use': {'walk': 'walking'}, 'bald': True} for name in ['blader', 'sorc']})  # the Sorcerer, made like the Trainee
# the Magic Knight came out at half the cast's pixel scale and was doubled (art/pixellab/mknight):
# its outlines are two pixels thick, and its ears stand apart from the skull; its head is centred
# on the body in front and back, set lower from behind (drop) and its neck wrapped in a violet scarf
CHARS['mknight'] = {'eight': True, 'use': {'walk': 'walking'}, 'bald': True, 'ring': 3, 'islands': 80, 'center': True, 'scarf': True, 'wipe': True, 'scrub': 3,
                    'drop': {'up': 5, 'upleft': 5, 'upright': 5, 'right': 4, 'left': 4, 'downright': 2, 'downleft': 2},
                    # its west-side attacks spin the body round mid-swing (the head would face backwards):
                    # they are the east side's, mirrored; east keeps its wind-up and strike, and back
                    'pick': {('attack', 'right'): [0, 1, 2, 3, 3, 2, 1]},
                    'mirror': {('attack', 'left'), ('attack', 'downleft'), ('attack', 'upleft')}}


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



# Ragnarok-style heads on a body made bald. The game paints the standard bald head (heads.png,
# already at the bodies' pixel size, see pack-heads.py) and the hair over the body's own head, at
# a whole-pixel spot per frame, so it sits on the body's pixel grid as if drawn with it. The body
# keeps everything it was drawn with (neck, collar, shoulders); only what would still show of its
# own head around the new one is cleaned away.


def head_masks():
    meta = json.load(open(os.path.join(OUT, 'heads.json')))
    sheet = Image.open(os.path.join(OUT, 'heads.png')).convert('RGBA')
    cw, ch = meta['cw'], meta['ch']
    return {d: (np.array(sheet.crop((g['col'] * cw, 0, (g['col'] + 1) * cw, ch)).getchannel('A')) >= 128, g)
            for d, g in meta['dirs'].items()}


def own_head(f, lim, ring=1):
    """the frame's own head: its biggest patch of skin, the eyes filled in (head), and that with the
    dark outline around it (whole; ring = the outline's thickness in pixels); or None"""
    a = np.array(f).astype(int)
    r, g, b, al = (a[..., i] for i in range(4))
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
    if len(best) <= 20:
        return None
    head = np.zeros(skin.shape, bool)
    rows = {}
    for y, x in best:
        lo, hi = rows.get(y, (x, x))
        rows[y] = (min(lo, x), max(hi, x))
    for y, (lo, hi) in rows.items():
        head[y, lo:hi + 1] = True
    whole = head.copy()
    for _ in range(ring):  # the outline, ring by ring: dark pixels touching what is already in
        near = whole.copy()
        near[1:] |= whole[:-1]; near[:-1] |= whole[1:]; near[:, 1:] |= whole[:, :-1]; near[:, :-1] |= whole[:, 1:]
        # (ring > 1, for doubled art: the ears, little islands of skin beside the head, come along too)
        whole = whole | (near & (al > 128) & ((lum < 110) | (skin if ring > 1 else False)))
    return head, whole, rows


def jaw_of(rows):
    """the bottom row of the head proper: under it the skin narrows to the neck"""
    mw = max(hi - lo + 1 for lo, hi in rows.values())
    return max(y for y, (lo, hi) in rows.items() if hi - lo + 1 >= mw * 0.45)


def head_cover(shape, hm, ox, oy):
    c = np.zeros(shape, bool)
    h, w = hm.shape
    y0, y1, x0, x1 = max(0, oy), min(shape[0], oy + h), max(0, ox), min(shape[1], ox + w)
    if y0 < y1 and x0 < x1:
        c[y0:y1, x0:x1] = hm[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return c


def place_head(whole, jaw, mask, guess, reach):
    """the head's top-left corner (whole pixels) where it covers the body's own head best, its chin
    no higher than the old jaw (so no old chin shows under it)"""
    hm, g = mask
    bottom = g['chin'][1] - 1  # the head's last row, in the cell
    best = (-1.0, guess)
    for ox in range(guess[0] - reach, guess[0] + reach + 1):
        for oy in range(guess[1] - reach, guess[1] + reach + 1):
            if oy + bottom < jaw:
                continue
            c = head_cover(whole.shape, hm, ox, oy)
            iou = (c & whole).sum() / max(1, (c | whole).sum())
            if iou > best[0]:
                best = (iou, (ox, oy))
    return best


def first_guess(head, rows, mask):
    _, g = mask
    xs = np.nonzero(head)[1]
    return (round(xs.mean() + 0.5 - g['chin'][0]), jaw_of(rows) + 1 - g['chin'][1])


def neck_scarf(f, ox, oy, g, hw):
    """wrap the neck in a scarf: skin showing between the chin and the shoulders is repainted in the
    outfit's own violet (its most common purple), light to dark as the skin was"""
    a = np.array(f).astype(int)
    r, gg, b, al = (a[..., i] for i in range(4))
    lum = 0.3 * r + 0.59 * gg + 0.11 * b
    skin = (al > 128) & (r > 150) & (r >= gg) & (gg >= b - 10) & (lum >= 110)
    purple = (al > 128) & (b > r) & (r > gg + 15) & (b > 70)
    if purple.sum() < 10:
        return f
    cols = a[purple][:, :3]
    base = np.median(cols, axis=0)
    y0, y1 = int(oy + g['chin'][1]) - 2, int(oy + g['chin'][1]) + 12
    x0, x1 = max(0, int(ox)), min(a.shape[1], int(ox + hw))
    out = a.copy()
    sk = skin[y0:y1, x0:x1]
    if not sk.any():
        return f
    mean = lum[y0:y1, x0:x1][sk].mean()
    for y in range(y0, y1):
        for x in range(x0, x1):
            if skin[y, x]:
                k = max(0.55, min(1.5, lum[y, x] / mean))  # keep the skin's light and shade
                out[y, x, :3] = np.clip(base * k, 0, 255)
    return Image.fromarray(out.astype(np.uint8))


def neck_fill(f, cover, ox, oy, g, hw):
    """fill the pockets of empty space where a smaller new head leaves a notch between the jaw and the
    shoulders (or the cape): any empty pixel near the neck with head or body close on both sides and
    body close below becomes scarf, and the new edge gets a dark outline"""
    a = np.array(f).astype(int)
    H, W = a.shape[:2]
    op = a[..., 3] > 128
    solid = op | cover
    purple = op & (a[..., 2] > a[..., 0]) & (a[..., 0] > a[..., 1] + 15) & (a[..., 2] > 70)
    if purple.sum() < 10:
        return f
    base = np.median(a[purple][:, :3], axis=0)
    chin = int(oy + g['chin'][1])
    y0, y1 = max(0, chin - 10), min(H, chin + 6)
    x0, x1 = max(0, int(ox) - 4), min(W, int(ox + hw) + 4)
    R = 7
    fill = np.zeros_like(op)
    for _ in range(3):  # a few passes: a pocket fills from its closed-in end outwards
        grown = solid | fill
        for y in range(y0, y1):
            for x in range(x0, x1):
                if grown[y, x]:
                    continue
                left = grown[y, max(0, x - R):x].any()
                right = grown[y, x + 1:min(W, x + 1 + R)].any()
                below = op[y + 1:min(H, y + 1 + R), x].any()
                above = grown[max(0, y - R):y, x].any()
                if left and right and below and above:
                    fill[y, x] = True
    if not fill.any():
        return f
    out = a.copy()
    out[fill, :3] = np.clip(base * 0.85, 0, 255)
    out[fill, 3] = 255
    # outline the filled patch where it meets the empty space around the character
    done = op | cover | fill
    for y, x in zip(*np.nonzero(fill)):
        if any(0 <= y + j < H and 0 <= x + i < W and not done[y + j, x + i] for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            out[y, x, :3] = (35, 20, 40)
    return Image.fromarray(out.astype(np.uint8))


def centre_x(f, ox, oy, g):
    """the head's left edge that puts its chin over the middle of the body below it: the middle of
    the run of solid pixels under the chin, row by row over the shoulders (a sword held out to the
    side is a run of its own and doesn't count)"""
    a = np.array(f)[..., 3] > 128
    H, W = a.shape
    cx, top = int(round(ox + g['chin'][0])), int(round(oy + g['chin'][1])) + 3
    mids = []
    for y in range(top, min(H, top + 12)):
        if not a[y, min(W - 1, max(0, cx))]:
            continue
        lo = hi = min(W - 1, max(0, cx))
        while lo > 0 and a[y, lo - 1]:
            lo -= 1
        while hi < W - 1 and a[y, hi + 1]:
            hi += 1
        mids.append((lo + hi) / 2)
    if len(mids) < 4:
        return None
    mids.sort()
    return int(round(mids[len(mids) // 2] - g['chin'][0]))


def clear_old_head(f, whole, cover, bottom, islands_above=0, wipe=False, scrub=0):
    """take away what still shows of the body's own head above the new head's chin: off where it
    meets the empty space around the character, filled from the clothes next to it where it's
    closed in (between the new head and a collar), so no hole opens around the neck"""
    a = np.array(f)
    op = a[..., 3] > 128
    left = whole & op if wipe else whole & ~cover & op  # wipe: all of the old head, even where the new one will be
    if scrub and whole.any():  # and, inside the old head's outline (a few pixels wider) above the chin,
        # the shaded ear edges that are too dark to read as skin. Armour and the blade stay
        ys, xs = np.nonzero(whole)
        y0, x0, x1 = max(0, ys.min() - scrub), max(0, xs.min() - scrub), min(op.shape[1], xs.max() + 1 + scrub)
        rgb = np.array(f)[..., :3].astype(int)
        warm = (rgb[..., 0] > rgb[..., 2] + 15) & (rgb[..., 0] >= rgb[..., 1])  # skin and its shading, not steel
        box = np.zeros_like(op)
        box[y0:bottom + 1, x0:x1] = True
        gone = box & op & warm
        for _ in range(2):  # and the dark outline around those bits
            near = gone.copy()
            near[1:] |= gone[:-1]; near[:-1] |= gone[1:]; near[:, 1:] |= gone[:, :-1]; near[:, :-1] |= gone[:, 1:]
            gone = gone | (near & box & op & (rgb.sum(-1) < 150))
        left = left | gone
    left[bottom + 1:] = False
    pts = set(zip(*np.nonzero(left)))
    H, W = op.shape
    outside = set()
    stack = [p for p in pts if any(0 <= p[0] + j < H and 0 <= p[1] + i < W and not op[p[0] + j, p[1] + i]
                                   for i, j in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    outside.update(stack)
    while stack:
        y, x = stack.pop()
        for n in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if n in pts and n not in outside:
                outside.add(n)
                stack.append(n)
    out = a.copy()
    for y, x in pts:
        if (y, x) in outside:
            out[y, x] = 0
            continue
        fill = None
        for k in range(1, 6):  # the nearest piece of the body: below first, then to the sides
            for yy, xx in ((y + k, x), (y, x - k), (y, x + k), (y + k, x - 1), (y + k, x + 1)):
                if 0 <= yy < H and 0 <= xx < W and op[yy, xx] and not left[yy, xx] and not cover[yy, xx]:
                    fill = a[yy, xx]
                    break
            if fill is not None:
                break
        out[y, x] = fill if fill is not None else 0
    if islands_above:  # bits of the old head left floating beside the new one: small pieces above
        # the chin that touch nothing else (a raised sword is long, and stays)
        op2 = out[..., 3] > 128
        seen = np.zeros_like(op2)
        for y0 in range(0, bottom + 1):
            for x0 in range(W):
                if not op2[y0, x0] or seen[y0, x0]:
                    continue
                grp, stack = [], [(y0, x0)]
                seen[y0, x0] = True
                while stack:
                    y, x = stack.pop()
                    grp.append((y, x))
                    for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1), (y + 1, x + 1), (y - 1, x - 1), (y + 1, x - 1), (y - 1, x + 1)):
                        if 0 <= yy < H and 0 <= xx < W and op2[yy, xx] and not seen[yy, xx]:
                            seen[yy, xx] = True
                            stack.append((yy, xx))
                if len(grp) < islands_above and max(y for y, _ in grp) <= bottom + 2 and not any(cover[y, x] for y, x in grp):
                    for y, x in grp:
                        out[y, x] = 0
    return Image.fromarray(out)


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
    for (anim, d), keep in opts.get('pick', {}).items():  # only these frames, in this order
        art[d][anim] = [art[d][anim][i] for i in keep]
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
    pad = (4, 10) if opts.get('bald') else (0, 0)  # room for the new head and its hair
    box = (int(W / 2 - half) - pad[0], y0 - pad[1], int(W / 2 + half + 0.5) + pad[0], y1)
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
    if opts.get('bald'):  # where the standard head goes in every frame, and the body cleaned under it
        masks = head_masks()
        lim = int(bh * 0.6) + 10
        # each direction's standing fit, as an offset from the rough guess, starts every frame's search
        start = {}
        for d in layout:
            own = own_head(rows[layout[d]['idle'][0]][0], lim, opts.get('ring', 1))
            if own:
                head, whole, hrows = own
                g0 = first_guess(head, hrows, masks[d])
                _, (ox, oy) = place_head(whole, jaw_of(hrows), masks[d], g0, 6)
                start[d] = (ox - g0[0], oy - g0[1])
        for d in layout:
            hm, g = masks[d]
            for anim, entry in layout[d].items():
                r = entry[0]
                spots = []
                for f in rows[r]:
                    own = own_head(f, lim, opts.get('ring', 1))
                    if not own:
                        spots.append(None)
                        continue
                    head, whole, hrows = own
                    g0 = first_guess(head, hrows, masks[d])
                    sx, sy = start.get(d, (0, 0))
                    iou, spot = place_head(whole, jaw_of(hrows), masks[d], (g0[0] + sx, g0[1] + sy), 3)
                    spots.append(spot if iou > 0.5 else None)
                for i, sp in enumerate(spots):  # a frame whose head can't be seen well borrows the nearest one's
                    if sp is None:
                        near = [j for j in range(len(spots)) if spots[j] is not None]
                        spots[i] = spots[min(near, key=lambda j: abs(j - i))] if near else (fw // 2 - hm.shape[1] // 2, 0)
                if opts.get('drop', {}).get(d):  # the head set lower than the fit, into the collar
                    spots = [(ox, oy + opts['drop'][d]) for ox, oy in spots]
                if opts.get('center') and d in ('down', 'up'):  # front and back: the head sits square on the body
                    spots = [(centre_x(f, ox, oy, g) or ox, oy) for f, (ox, oy) in zip(rows[r], spots)]
                frames = []
                for f, (ox, oy) in zip(rows[r], spots):
                    if oy < 0 or ox < 0 or ox + hm.shape[1] > fw:
                        print('  warning: the head leaves the frame', name, d, anim, ox, oy)
                    own = own_head(f, lim, opts.get('ring', 1))
                    cover = head_cover((fh, fw), hm, ox, oy)
                    f2 = clear_old_head(f, own[1], cover, oy + g['chin'][1] - 1, opts.get('islands', 0), opts.get('wipe'), opts.get('scrub', 0)) if own else f
                    if opts.get('scarf'):
                        f2 = neck_fill(neck_scarf(f2, ox, oy, g, hm.shape[1]), cover, ox, oy, g, hm.shape[1])
                    frames.append(f2)
                rows[r] = frames
                # the head's geometry in frame pixels, for headgear: [x, crown, neck, w, eyes...]
                entry[3] = [[ox + g['chin'][0], oy + g['crown'], oy + g['chin'][1], g['w'],
                             *[v + (ox if k % 2 == 0 else oy) for k, v in enumerate(g['eyes'])]] for ox, oy in spots]
                entry.append([list(sp) for sp in spots])
    if opts.get('strip') and not opts.get('bald'):  # Ragnarok-style body: the head comes off, its anchors stay
        keep = body_colours(art, box, layout) - {tuple(c) for c in hair}
        for d in layout:
            for anim, (r, n, _, hs, *_) in layout[d].items():
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
    if len(front) == 2 and len(side) == 1 and not opts.get('bald'):  # (a bald body's eyes are the standard head's)
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

    json.dump({'fw': fw, 'fh': fh, 'body': body, 'foot': foot, 'hair': hair, 'bald': bool(opts.get('bald')), 'anims': layout}, open(os.path.join(OUT, name + '.json'), 'w'))
    print(name, 'frame', fw, 'x', fh, 'body', body, 'foot', foot, 'sheet', sheet.size, os.path.getsize(os.path.join(OUT, name + '.png')), 'bytes')


for n in sys.argv[1:] or CHARS:
    pack(n, CHARS.get(n, {}))
