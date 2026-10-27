# Draws standard headgear pieces in code, as 3D shapes turned to each of the head's 8 directions
# and drawn on its 43x43 cell (docs/character-standard.md), for pieces PixelLab didn't make:
#   goat_horns  Giant Goat Horn Helm (Head): a gunmetal helm worked in gold, its cheek guards in front of
#               the ears, and two great ridged horns banded in gold, curling round beside them
#   elf_ears    Elven Ears (Face): long pointed ears over the head's own, with a silver ornament: a
#               cuff and spike, sapphires, a crystal earring, and a band round the back of the head
# Writes src/art/hg_<id>.png (8 cells in a row) and its .json layout. A piece wider than the head
# (the horns) gets cells PX wider on each side, and says so in its layout (off: where the head's cell
# starts in its own; headgear.js paintGear).
#   python3 build-tools/draw-headgear.py [--preview out.png]
import json, math, sys
from PIL import Image, ImageDraw

ART = 'src/art'
DIRS = ['down', 'downright', 'right', 'upright', 'up', 'upleft', 'left', 'downleft']
YAW = {d: i * 45 for i, d in enumerate(DIRS)}  # how far the face has turned toward screen right
CELL, SS = 43, 6                                # cell size, supersampling
TILT = math.radians(14)                         # the camera looks down a little
OUT = (18, 10, 8, 255)

heads = Image.open(f'{ART}/heads.png').convert('RGBA')

def bald(c):
    return heads.crop((c * CELL, 0, c * CELL + CELL, CELL))

def centre(c):
    # the cranium's centre in the cell: the middle of the bald head's row 18, 11.5 px under the crown
    a = bald(c).load()
    xs = [x for x in range(CELL) if a[x, 18][3] > 0]
    top = min(y for y in range(CELL) if any(a[x, y][3] > 0 for x in range(CELL)))
    return (xs[0] + xs[-1] + 1) / 2, top + 11.5

def project(p, d, c):
    # local: x across (screen right in the front view), y up, z toward the face. Returns sx, sy, depth
    x, y, z = p
    t = math.radians(YAW[d])
    sx = x * math.cos(t) + z * math.sin(t)
    dep = -x * math.sin(t) + z * math.cos(t)
    cx, cy = centre(c)
    return cx + sx, cy - y * math.cos(TILT) + dep * math.sin(TILT) * 0.6, dep

def head_mask(c, px=0):
    a = bald(c).load()
    return {(x + px, y) for x in range(CELL) for y in range(CELL) if a[x, y][3] > 0}

# --- the horn helm ------------------------------------------------------------------------------
# a steel helm trimmed in gold, a gold crest spike on the brow, cheek guards in front of the ears
# (they stay bare, for the Elven Ears), and two great dark horns banded in gold
GOLD = [(255, 238, 160), (242, 198, 84), (200, 144, 42), (132, 88, 26)]    # light .. dark
STEEL = [(140, 142, 154), (96, 98, 112), (64, 66, 80), (40, 42, 54)]  # gunmetal
HORN = [(134, 92, 60), (100, 66, 42), (72, 46, 30), (48, 30, 20)]
LIGHT = (-0.45, 0.65, 0.6)  # from the upper left, toward the viewer
HELM_R = 12.4               # the helm's shell, a little over the cranium (11.5)

def unit(v):
    n = math.sqrt(sum(a * a for a in v)) or 1
    return tuple(a / n for a in v)

def view(n, d):
    # a local normal turned to the view: (across, up, toward the viewer)
    t = math.radians(YAW[d])
    return (n[0] * math.cos(t) + n[2] * math.sin(t), n[1], -n[0] * math.sin(t) + n[2] * math.cos(t))

def shade(pal, n, d, bias=0):
    v = unit(view(n, d))
    lit = sum(a * b for a, b in zip(v, unit(LIGHT)))
    k = 0 if lit > 0.55 else 1 if lit > 0.15 else 2 if lit > -0.25 else 3
    return pal[max(0, min(3, k + bias))]

def edge(a):
    # where the shell ends, by azimuth (0 the face, 90 the side, 180 the back): over the brow in
    # front, above the ears at the sides, low over the nape behind
    a = abs(a)
    pts = [(0, -2.0), (45, -1.5), (70, 0.5), (90, 1.5), (115, 1.0), (140, -2.5), (180, -5.0)]
    for (a0, y0), (a1, y1) in zip(pts, pts[1:]):
        if a <= a1:
            return y0 + (y1 - y0) * (a - a0) / (a1 - a0)
    return pts[-1][1]

HORN_PX = 10  # the horns reach this far past the head's cell on each side

def horn(side):
    # a great curl to each side, outside the ears: out and up from the temple over the ears, then
    # round a wide spiral, back, down and forward, its tip curling up again
    pts = []
    n = 140
    C = (25.0, 3.5, -5.0)  # the spiral's centre
    for i in range(n + 1):
        t = i / n
        if t < 0.3:  # the sweep from the temple out over the ear
            u = t / 0.3
            e = u * u * (3 - 2 * u)
            x = 7 + (C[0] - 2 - 7) * e
            y = 10 + (C[1] + 9.5 - 10) * math.sin(min(1, u * 1.6) * math.pi / 2)  # up first, clear of the ear tips
            z = 1 + (C[2] - 1) * e
        else:  # the spiral, from its top round: back, down, forward, and up
            u = (t - 0.3) / 0.7
            a = math.radians(320 * u)
            r = 9.5 * (1 - 0.55 * u)
            x = C[0] - 2 + 4.5 * u
            y = C[1] + r * math.cos(a)
            z = C[2] - r * math.sin(a)
        w = 4.3 * (1 - 0.75 * t) + 0.6
        pts.append(((side * x, y, z), w, t))
    return pts

def helm_parts():
    # everything as (point, normal, radius, palette, bias, part), in local coords
    out = []
    # the shell
    for i in range(0, 181, 3):
        el = math.radians(i / 2)          # 0 the crown .. 90 the equator
        for j in range(-180, 180, 3):
            a = math.radians(j)
            n = (math.sin(el) * math.sin(a), math.cos(el), math.sin(el) * math.cos(a))
            p = tuple(HELM_R * v for v in n)
            e = edge(j)
            if p[1] < e:
                continue
            gold = p[1] < e + 1.7 or (abs(p[0]) < 1.3 and p[2] > 0) or (abs(p[0]) < 1.0 and p[2] < 0 and p[1] > -3)
            out.append((p, n, 0.55, GOLD if gold else STEEL, 0, 'shell'))
    # the cheek guards: steel plates rimmed in gold, down the face's sides in front of the ears
    for side in (-1, 1):
        for i in range(31):
            v = i / 30
            r = HELM_R - 0.3 - 1.8 * v
            half = 2.4 * (1 - v) + 0.3
            for k in range(-6, 7):
                u = k / 6
                a = math.radians(side * 76) + side * u * half / r
                p = (r * math.sin(a), -1 - 8.5 * v, r * math.cos(a))
                n = (math.sin(a), 0.1, math.cos(a))
                rim = abs(u) > 0.62 or v > 0.86
                out.append((p, n, 0.5, GOLD if rim else STEEL, 0, 'guard'))
    # the crest: a gold blade lying along the helm from the brow over the forehead, its point lifting
    # off above the crown; and a small fin each side
    def crest(a0, el0, el1, lift, half, size):
        a0 = math.radians(a0)
        for i in range(61):
            v = i / 60
            el = math.radians(el0 + (el1 - el0) * v)       # from the vertical
            w = half * (1 - v) ** 0.8 + 0.2
            for k in range(-5, 6):
                u = k / 5
                a = a0 + u * w / (HELM_R * max(0.3, math.sin(el)))
                r = HELM_R + 0.4 + lift * v * v + 0.8 * (1 - abs(u))  # a ridge down the middle
                n = (math.sin(el) * math.sin(a), math.cos(el), math.sin(el) * math.cos(a))
                p = tuple(r * c for c in n)
                side = (math.cos(a), 0, -math.sin(a))     # across the blade
                f = -0.55 if u < 0 else 0.55
                out.append((p, unit(tuple(nn + f * sd for nn, sd in zip(n, side))), size, GOLD, 0, 'crest'))
    crest(0, 98, 18, 6.5, 2.8, 0.6)
    for side in (-1, 1):
        crest(side * 40, 92, 55, 2.5, 1.3, 0.5)
    # the horns
    for side in (-1, 1):
        for p, w, t in horn(side):
            band = 0.08 < t < 0.15 or 0.5 < t < 0.56 or t > 0.93
            ridge = (t * 16) % 1 < 0.22 and not band
            out.append((p, None, w, GOLD if band else HORN, 2 if ridge else 0, ('horn', t)))
    return out

def view_free(a0, facet):
    # a facet normal on a spike standing at azimuth a0 (degrees), in local coords
    a = math.radians(a0)
    fx, fy, fz = facet
    return (fx * math.cos(a) + fz * math.sin(a), fy, -fx * math.sin(a) + fz * math.cos(a))

def draw_horns(d, c, cut=None):
    px = HORN_PX
    big = Image.new('RGBA', ((CELL + 2 * px) * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = head_mask(c, px)
    blobs = []
    low = {}
    for p, n, w, pal, bias, part in helm_parts():
        sx, sy, dep = project(p, d, c)
        if part in ('shell', 'guard', 'crest'):
            if part != 'crest' and unit(view(n, d))[2] < -0.02:  # its back: the head shows through the opening
                continue
            if part == 'shell':  # the hair it hides: above its lower edge, column by column
                x = int(sx)
                low[x] = max(low.get(x, 0), int(sy) + 1)
        if part[0] == 'horn':
            if dep < -3 and (int(sx + px), int(sy)) in hm:
                continue
            t = part[1]
            k = 0 if dep > 2 else 1 if dep > -5 else 2
            col = pal[min(3, k + bias + (1 if t > 0.75 else 0))]
        else:
            col = shade(pal, n, d, bias)
        blobs.append((dep, sx + px, sy, w, col))
    blobs.sort(key=lambda b: b[0])
    for dep, sx, sy, w, col in blobs:
        R = w * SS
        g.ellipse([sx * SS - R, sy * SS - R, sx * SS + R, sy * SS + R], fill=col + (255,))
    if cut is not None:
        cut[d] = [low.get(x, 0) for x in range(CELL)]
    return big

# --- the ears ----------------------------------------------------------------------------------
SKIN = (252, 198, 163)
SHADE = (223, 152, 122)
INNER = (214, 128, 112)

def ear(side):
    # a long leaf: its root along the side of the head at eye height, its tip up, out and back
    root_top, root_bot = (side * 10.5, 0.5, -3.5), (side * 10.5, -7.5, -2.5)
    tip = (side * 17, 7.5, -12)
    mid_top = (side * 14, 4.5, -7.5)
    mid_bot = (side * 14.5, -3, -8)
    outer = [root_top, mid_top, tip, mid_bot, root_bot]
    inner = [(side * 11.6, -0.5, -3.6), (side * 13.6, 3, -7.2), (side * 15.6, 5.8, -10.4), (side * 13.8, -1.8, -7.4), (side * 11.6, -5.5, -3.2)]
    return outer, inner

# the ornament, in silver with sapphires: a cuff up the ear's top edge to a spike past its tip, a
# sapphire on the ear, a crystal earring hanging from the lobe, and a band round the back of the head
# from ear to ear with a sapphire drop in the middle
SILVER = [(246, 248, 255), (204, 210, 226), (150, 158, 178), (98, 104, 124)]  # light .. dark
SAPPHIRE = [(150, 196, 255), (60, 110, 230), (30, 56, 150)]

def splat(g, d, c, pts, r, col, step=0.25):
    # a 3D polyline as a row of discs, r px across
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / step))
        for i in range(n + 1):
            p = tuple(a[k] + (b[k] - a[k]) * i / n for k in range(3))
            sx, sy, _ = project(p, d, c)
            g.ellipse([(sx - r) * SS, (sy - r) * SS, (sx + r) * SS, (sy + r) * SS], fill=col + (255,))

def gem(g, d, c, p, r, drop=False):
    # a small sapphire: a dark rim, a lit centre; a drop is a little diamond, longer than wide
    sx, sy, _ = project(p, d, c)
    if drop:
        h = r * 1.8
        g.polygon([(sx * SS, (sy - h) * SS), ((sx + r) * SS, sy * SS), (sx * SS, (sy + h) * SS), ((sx - r) * SS, sy * SS)], fill=SAPPHIRE[2] + (255,))
        g.polygon([(sx * SS, (sy - h * 0.6) * SS), ((sx + r * 0.45) * SS, sy * SS), (sx * SS, (sy + h * 0.3) * SS), ((sx - r * 0.45) * SS, sy * SS)], fill=SAPPHIRE[0] + (255,))
    else:
        g.ellipse([(sx - r) * SS, (sy - r) * SS, (sx + r) * SS, (sy + r) * SS], fill=SAPPHIRE[2] + (255,))
        g.ellipse([(sx - r * 0.55) * SS, (sy - r * 0.6) * SS, (sx + r * 0.3) * SS, (sy + r * 0.25) * SS], fill=SAPPHIRE[1] + (255,))

def ornament(g, d, c, side):
    outer, _ = ear(side)
    root_top, mid_top, tip, mid_bot, root_bot = outer
    spike = tuple(tip[k] + (tip[k] - mid_top[k]) * 0.55 for k in range(3))
    lift = lambda p, dy: (p[0], p[1] + dy, p[2])
    # the cuff: a silver line up the ear's top edge, out past the tip; a second, shorter prong
    splat(g, d, c, [lift(root_top, 0.6), lift(mid_top, 0.6), lift(tip, 0.4), spike], 0.75, SILVER[2])
    splat(g, d, c, [lift(root_top, 0.9), lift(mid_top, 0.9), lift(tip, 0.7)], 0.4, SILVER[0])
    prong = tuple(mid_top[k] + (tip[k] - mid_top[k]) * 0.3 for k in range(3))
    splat(g, d, c, [lift(prong, 0.5), (prong[0] + side * 1.5, prong[1] + 4.5, prong[2] - 2.0)], 0.5, SILVER[1])
    gem(g, d, c, (side * 13.6, 2.2, -6.6), 0.95)
    # the earring: a fine chain from the lobe and a sapphire drop
    lobe = (root_bot[0] + side * 0.6, root_bot[1] + 0.8, root_bot[2] - 0.5)
    end = (lobe[0], lobe[1] - 3.2, lobe[2])
    splat(g, d, c, [lobe, end], 0.35, SILVER[1])
    gem(g, d, c, (end[0], end[1] - 1.4, end[2]), 0.9, drop=True)

def back_band(g, d, c):
    # the band round the back of the head, ear to ear: only its side facing the viewer shows
    R, y = 12.6, -1.0
    pts = []
    for j in range(108, 253, 2):
        a = math.radians(j)
        n = (math.sin(a), 0, math.cos(a))
        if view(n, d)[2] < 0.05:
            if len(pts) > 1: splat(g, d, c, pts, 0.6, SILVER[1])
            pts = []
            continue
        pts.append((R * n[0], y + 0.6 * math.cos(math.radians(j - 180) * 2), R * n[2]))
    if len(pts) > 1: splat(g, d, c, pts, 0.6, SILVER[1])
    back = (0, 0, -1)
    if view(back, d)[2] > 0.3:  # the middle piece: a little silver diamond and a sapphire drop
        mid = (0, y - 0.6, -R - 0.2)
        splat(g, d, c, [(0, y + 1.6, -R - 0.2), (0, y - 1.8, -R - 0.2)], 0.6, SILVER[0])
        gem(g, d, c, mid, 0.8)
        gem(g, d, c, (0, y - 4.2, -R - 0.3), 0.75, drop=True)

def draw_ears(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = head_mask(c)
    t = math.radians(YAW[d])
    back_band(g, d, c)
    ears = []
    for side in (-1, 1):
        outer, inner = ear(side)
        po = [project(p, d, c) for p in outer]
        pi = [project(p, d, c) for p in inner]
        dep = sum(p[2] for p in po) / len(po)
        ears.append((dep, side, po, pi))
    ears.sort(key=lambda e: e[0])
    for dep, side, po, pi in ears:
        # which face of the ear we see: the inside faces forward and outward
        facing = 0.7 * (-side * math.sin(t) + math.cos(t))  # the inside faces out and forward
        layer = Image.new('RGBA', big.size, (0, 0, 0, 0))
        lg = ImageDraw.Draw(layer)
        lg.polygon([(x * SS, y * SS) for x, y, _ in po], fill=(SKIN if facing > -0.2 else SHADE) + (255,))
        if facing > 0.3:
            lg.polygon([(x * SS, y * SS) for x, y, _ in pi], fill=INNER + (255,))
            # a soft shade along the inner rim
            lg.line([(x * SS, y * SS) for x, y, _ in pi[:3]], fill=SHADE + (255,), width=SS)
        area = abs(sum(po[i][0] * po[i - 1][1] - po[i - 1][0] * po[i][1] for i in range(len(po)))) / 2
        if area < 14:  # edge on: the head's own ear shows instead
            continue
        ornament(lg, d, c, side)
        if dep < -1:  # the far ear: hidden behind the head
            la = layer.load()
            for (x, y) in hm:
                for u in range(SS):
                    for v in range(SS):
                        la[x * SS + u, y * SS + v] = (0, 0, 0, 0)
        big.alpha_composite(layer)
    return big

# --- packing -----------------------------------------------------------------------------------
def to_cell(big):
    W, H = big.width // SS, big.height // SS
    small = big.resize((W, H), Image.NEAREST)
    a = small.load()
    # a dark outline round the piece, and no half-transparent pixels
    out = small.copy()
    o = out.load()
    for y in range(H):
        for x in range(W):
            if a[x, y][3] < 128:
                o[x, y] = (0, 0, 0, 0)
                if any(0 <= x + u < W and 0 <= y + v < H and a[x + u, y + v][3] >= 128
                       for u, v in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    o[x, y] = OUT
            else:
                o[x, y] = a[x, y][:3] + (255,)
    return out

def box(cell):
    b = cell.getbbox()
    return list(b) if b else None

def build(pid, slot, draw, px=0, **extra):
    W = CELL + 2 * px
    sheet = Image.new('RGBA', (W * 8, CELL), (0, 0, 0, 0))
    boxes = {}
    cut = {}
    for c, d in enumerate(DIRS):
        cell = to_cell(draw(d, c, cut) if draw is draw_horns else draw(d, c))
        sheet.paste(cell, (c * W, 0))
        boxes[d] = box(cell)
    sheet.save(f'{ART}/hg_{pid}.png')
    L = {'cw': W, 'ch': CELL, 'frames': 1, 'slot': slot, 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': cut or None, **({'off': [px, 0]} if px else {}), **extra}
    json.dump(L, open(f'{ART}/hg_{pid}.json', 'w'))
    return sheet

def cells(sheet, px):
    W = CELL + 2 * px
    return [sheet.crop((c * W, 0, c * W + W, CELL)) for c in range(8)]

def overlap(a, b):
    # opaque pixels two pieces share, cell by cell (both as wide as the horns)
    n = []
    for ca, cb in zip(a, b):
        A, B = ca.load(), cb.load()
        n.append(sum(1 for x in range(ca.width) for y in range(ca.height) if A[x, y][3] and B[x, y][3]))
    return n

def preview(path, pieces, cut=None):
    # pieces: lists of layers; the hair is cut where the helm hides it (cut, for the lists with H)
    S, PX = 5, HORN_PX
    W = CELL + 2 * PX
    rows = [0, 2, 1]  # bald, mane, messy
    out = Image.new('RGBA', (W * 8 * S, CELL * S * len(rows) * len(pieces)), (70, 72, 84, 255))
    for si, layers in enumerate(pieces):
        for ri, r in enumerate(rows):
            for c in range(8):
                cell = Image.new('RGBA', (W, CELL), (0, 0, 0, 0))
                cell.alpha_composite(heads.crop((c * CELL, 0, c * CELL + CELL, CELL)), (PX, 0))
                if r:
                    hair = heads.crop((c * CELL, r * CELL, c * CELL + CELL, r * CELL + CELL))
                    if cut and si != 1:
                        ha = hair.load()
                        for x, row in enumerate(cut[DIRS[c]]):
                            for y in range(min(row, CELL)): ha[x, y] = (0, 0, 0, 0)
                    cell.alpha_composite(hair, (PX, 0))
                for cl in layers: cell.alpha_composite(cl[c])
                out.alpha_composite(cell.resize((W * S, CELL * S), Image.NEAREST), (c * W * S, (si * len(rows) + ri) * CELL * S))
    out.save(path)

if __name__ == '__main__':
    horns = build('goat_horns', 'head', draw_horns, px=HORN_PX)
    ears = build('elf_ears', 'face', draw_ears, over=True)  # the ears go over the hat
    H = cells(horns, HORN_PX)
    E = []
    for c in cells(ears, 0):
        w = Image.new('RGBA', (CELL + 2 * HORN_PX, CELL), (0, 0, 0, 0)); w.alpha_composite(c, (HORN_PX, 0)); E.append(w)
    print('horns over the ears (px a direction):', dict(zip(DIRS, overlap(H, E))))
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1], [[H], [E], [H, E]], json.load(open(f'{ART}/hg_goat_horns.json'))['cut'])
