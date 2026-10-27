# Draws standard headgear pieces in code, as 3D shapes turned to each of the head's 8 directions
# and drawn on its 43x43 cell (docs/character-standard.md), for pieces PixelLab didn't make:
#   goat_horns  Giant Goat Horns (Head): two great ridged horns sweeping out over the ears and curling round beside them
#   elf_ears    Elven Ears (Face): long pointed ears over the head's own
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

# --- the horns ---------------------------------------------------------------------------------
IVORY = [(250, 238, 206), (226, 206, 160), (190, 162, 116), (140, 112, 78)]  # light .. dark
RIDGE = (120, 92, 62)

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

def draw_horns(d, c):
    px = HORN_PX
    big = Image.new('RGBA', ((CELL + 2 * px) * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = head_mask(c, px)
    blobs = []
    for side in (-1, 1):
        for p, w, t in horn(side):
            sx, sy, dep = project(p, d, c)
            blobs.append((dep, sx + px, sy, w, t))
    blobs.sort(key=lambda b: b[0])
    for dep, sx, sy, w, t in blobs:
        # behind the head: hidden where the head is
        if dep < -3 and (int(sx), int(sy)) in hm:
            continue
        ridge = (t * 13) % 1 < 0.2 and t < 0.9
        # shade: the far side and the underside darker
        k = 0 if dep > 0 else 1 if dep > -6 else 2
        col = RIDGE if ridge else IVORY[min(2, k + (1 if t > 0.75 else 0))]
        R = w * SS
        g.ellipse([sx * SS - R, sy * SS - R, sx * SS + R, sy * SS + R], fill=col + (255,))
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

def draw_ears(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = head_mask(c)
    t = math.radians(YAW[d])
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
    for c, d in enumerate(DIRS):
        cell = to_cell(draw(d, c))
        sheet.paste(cell, (c * W, 0))
        boxes[d] = box(cell)
    sheet.save(f'{ART}/hg_{pid}.png')
    L = {'cw': W, 'ch': CELL, 'frames': 1, 'slot': slot, 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None, **({'off': [px, 0]} if px else {}), **extra}
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

def preview(path, pieces):
    S, PX = 5, HORN_PX
    W = CELL + 2 * PX
    rows = [0, 2, 1]  # bald, mane, messy
    out = Image.new('RGBA', (W * 8 * S, CELL * S * len(rows) * len(pieces)), (70, 72, 84, 255))
    for si, layers in enumerate(pieces):
        for ri, r in enumerate(rows):
            for c in range(8):
                cell = Image.new('RGBA', (W, CELL), (0, 0, 0, 0))
                cell.alpha_composite(heads.crop((c * CELL, 0, c * CELL + CELL, CELL)), (PX, 0))
                if r: cell.alpha_composite(heads.crop((c * CELL, r * CELL, c * CELL + CELL, r * CELL + CELL)), (PX, 0))
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
        preview(sys.argv[sys.argv.index('--preview') + 1], [[H], [E], [H, E]])
