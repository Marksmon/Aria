# Draws the city shops' hats and face pieces in code, as 3D shapes turned to each of the head's 8
# directions and drawn on its 43x43 cell (docs/character-standard.md), the way draw-headgear.py does:
#   bandana      Bandana (Head): a red cloth tied tight, white dots, the knot and its tails behind
#   straw_hat    Straw Hat (Head): a wide woven brim and a red ribbon round the crown
#   witch_hat    Witch Hat (Head): a purple cone with a crooked tip, a wide brim and a gold buckle
#   feather_cap  Feathered Cap (Head): a green felt hunter's cap, a peak in front, a long red feather
#   eyepatch     Eyepatch (Face): a black leather patch, its strap across the brow and round the head
#   monocle      Monocle (Face): a gold ring on one eye, its fine chain down to the ear
# Writes src/art/hg_<id>.png (8 cells in a row) and its .json layout (a hat says how much hair it
# hides: cut, per column of the cell, the row above which hair is left out).
#   python3 build-tools/draw-hats.py [--preview out.png]
import json, math, sys
from PIL import Image, ImageDraw

ART = 'src/art'
DIRS = ['down', 'downright', 'right', 'upright', 'up', 'upleft', 'left', 'downleft']
YAW = {d: i * 45 for i, d in enumerate(DIRS)}  # how far the face has turned toward screen right
CELL, SS = 43, 6                                # cell size, supersampling
TILT = math.radians(14)                         # the camera looks down a little
OUT = (18, 10, 8, 255)
LIGHT = (-0.45, 0.65, 0.6)                      # from the upper left, toward the viewer

heads = Image.open(f'{ART}/heads.png').convert('RGBA')

def bald(c):
    return heads.crop((c * CELL, 0, c * CELL + CELL, CELL))

CENTRES = {}
def centre(c):
    # the cranium's centre in the cell: the middle of the bald head's row 18, 11.5 px under the crown
    if c not in CENTRES:
        a = bald(c).load()
        xs = [x for x in range(CELL) if a[x, 18][3] > 0]
        top = min(y for y in range(CELL) if any(a[x, y][3] > 0 for x in range(CELL)))
        CENTRES[c] = ((xs[0] + xs[-1] + 1) / 2, top + 11.5)
    return CENTRES[c]

def project(p, d, c):
    # local: x across (screen right in the front view), y up, z toward the face. Returns sx, sy, depth
    x, y, z = p
    t = math.radians(YAW[d])
    sx = x * math.cos(t) + z * math.sin(t)
    dep = -x * math.sin(t) + z * math.cos(t)
    cx, cy = centre(c)
    return cx + sx, cy - y * math.cos(TILT) + dep * math.sin(TILT) * 0.6, dep

def head_mask(c):
    a = bald(c).load()
    return {(x, y) for x in range(CELL) for y in range(CELL) if a[x, y][3] > 0}

def unit(v):
    n = math.sqrt(sum(a * a for a in v)) or 1
    return tuple(a / n for a in v)

def view(n, d):
    t = math.radians(YAW[d])
    return (n[0] * math.cos(t) + n[2] * math.sin(t), n[1], -n[0] * math.sin(t) + n[2] * math.cos(t))

def shade(pal, n, d, bias=0):
    v = unit(view(n, d))
    lit = sum(a * b for a, b in zip(v, unit(LIGHT)))
    k = 0 if lit > 0.55 else 1 if lit > 0.15 else 2 if lit > -0.25 else 3
    return pal[max(0, min(len(pal) - 1, k + bias))]

def sph(r, az, y):
    # a point on a sphere of radius r at azimuth az (degrees: 0 the face, 90 screen right) and height y
    y = max(-r, min(r, y))
    h = math.sqrt(max(0, r * r - y * y))
    a = math.radians(az)
    return (h * math.sin(a), y, h * math.cos(a))

def interp(pts, a):
    # a piecewise line through (x, y) pairs, by x
    for (a0, y0), (a1, y1) in zip(pts, pts[1:]):
        if a <= a1:
            return y0 + (y1 - y0) * (a - a0) / (a1 - a0)
    return pts[-1][1]

# --- palettes (light .. dark) -------------------------------------------------------------------
RED = [(236, 92, 80), (196, 52, 52), (148, 32, 40), (98, 20, 30)]
WHITE = [(255, 250, 240), (226, 220, 210), (186, 178, 170), (140, 132, 128)]
STRAW = [(252, 226, 140), (230, 192, 96), (190, 146, 62), (136, 100, 40)]
PURPLE = [(150, 104, 196), (110, 70, 160), (78, 46, 122), (50, 28, 84)]
GOLD = [(255, 238, 160), (242, 198, 84), (200, 144, 42), (132, 88, 26)]
GREEN = [(126, 176, 84), (92, 140, 60), (62, 104, 44), (40, 72, 32)]
BROWN = [(170, 120, 72), (132, 88, 50), (96, 62, 36), (64, 40, 24)]
LEATHER = [(84, 70, 66), (58, 48, 46), (40, 32, 32), (26, 20, 22)]
FEATHER = [(244, 96, 70), (214, 58, 48), (164, 36, 36), (110, 24, 28)]

# every part is (point, normal or None, radius px, palette, bias, kind, cuts)
#   kind 'surf': a skin over the head, its back culled; 'free': hidden where the head is in front of it
def shell(out, r, low, pal, bias_of=lambda p, az: 0, cuts=True, top=None, step=3):
    # a cap over the head down to its edge low(az) (the height its rim comes to, by azimuth)
    for i in range(0, 91, step if step > 2 else 2):
        el = math.radians(i)
        for j in range(-180, 180, step):
            n = (math.sin(el) * math.sin(math.radians(j)), math.cos(el), math.sin(el) * math.cos(math.radians(j)))
            p = tuple(r * v for v in n)
            if p[1] < low(j):
                continue
            if top: p, n = top(p, n)
            pal_, b = pal(p, j) if callable(pal) else (pal, bias_of(p, j))
            out.append((p, n, 0.6, pal_, b, 'surf', cuts))

def band(out, r, y0, y1, pal, bias=0, az=(-180, 180), kind='surf', size=0.6):
    for j in range(az[0], az[1], 3):
        for k in range(5):
            y = y0 + (y1 - y0) * k / 4
            p = sph(r, j, y)
            out.append((p, unit(p), size, pal, bias, kind, False))

def tube(out, pts, w0, w1, pal, bias=0, kind='free', step=0.3):
    # a soft round strip through 3D points, w0 .. w1 px across
    total = sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
    run = 0
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.dist(a, b) / step))
        for i in range(n):
            p = tuple(a[k] + (b[k] - a[k]) * i / n for k in range(3))
            t = (run + math.dist(a, p)) / total
            out.append((p, None, w0 + (w1 - w0) * t, pal, bias, kind, False))
        run += math.dist(a, b)

# --- the pieces ---------------------------------------------------------------------------------
def bandana():
    out = []
    edge = lambda j: interp([(0, 2.5), (60, 1.0), (90, -0.5), (130, -2.0), (180, -3.5)], abs(j))
    def pal(p, j):
        # white dots on the red, in rows round the head
        el = math.degrees(math.acos(max(-1, min(1, p[1] / 12.1))))
        dot = (round(el / 14) + round(j / 26)) % 2 == 0 and abs(el - round(el / 14) * 14) < 3.5 and abs(j - round(j / 26) * 26) < 5 and el > 8
        return (WHITE, 0) if dot else (RED, 0)
    shell(out, 12.1, edge, pal)
    band(out, 12.4, edge(0) - 0.2, edge(0) + 1.4, RED, 1, az=(-70, 71))  # a folded hem over the brow
    # the knot behind and its two tails, hanging down and out
    k = (0, -2.0, -12.8)
    for s in (-1, 1):
        out.append(((s * 1.2, -2.0, -12.9), (0, 0, -1), 1.9, RED, 0, 'free', False))
    tube(out, [k, (-2.0, -5.5, -13.6), (-3.6, -9.5, -13.2)], 1.7, 1.0, RED, 1)
    tube(out, [k, (2.4, -5.0, -13.8), (4.6, -8.5, -13.4)], 1.7, 1.0, RED, 1)
    return out

def straw_hat():
    out = []
    R = 12.8
    def crown(p, n):
        # a low round crown: squashed a little on top
        return (p[0], 2.5 + (p[1] - 2.5) * 0.9 if p[1] > 2.5 else p[1], p[2]), n
    weave = lambda p, j: (STRAW, 1 if int((p[1] + 20) * 1.1) % 3 == 0 else 0)
    shell(out, R, lambda j: 2.5, weave, top=crown)
    band(out, R + 0.25, 2.6, 5.0, RED, 0)
    # the brim: a wide ring, its edge dipping a little
    for ri in range(0, 31):
        r = R - 0.4 + ri * 0.24
        for j in range(-180, 180, 2):
            a = math.radians(j)
            y = 2.4 - (r - R) * 0.16
            p = (r * math.sin(a), y, r * math.cos(a))
            ring = int(r * 1.3) % 3 == 0
            out.append((p, (0.12 * math.sin(a), 1, 0.12 * math.cos(a)), 0.6, STRAW, 1 if ring else 0, 'brim', False))
    return out

def witch_hat():
    out = []
    R = 12.6
    # the cone, from round the brow up to a crooked tip that falls back and to the side
    for i in range(0, 61):
        t = i / 60
        y = 2.5 + 15.5 * t
        r = R * (1 - t) ** 1.15 + 0.4
        bend = t * t
        cx, cz = -3.5 * bend, -7.5 * bend
        y -= 3.0 * bend * t
        for j in range(-180, 180, 3):
            a = math.radians(j)
            p = (cx + r * math.sin(a), y, cz + r * math.cos(a))
            n = unit((math.sin(a), 0.45, math.cos(a)))
            gold = 0.06 < t < 0.17
            buckle = gold and abs(j) < 14
            pal = GOLD if buckle else (PURPLE if not gold else [(70, 40, 110), (54, 30, 88), (40, 22, 66), (28, 16, 48)])
            out.append((p, n, 0.6, pal, 0, 'surf', i < 3))
    # the buckle's opening
    for j in range(-6, 7, 3):
        p = sph(R + 0.6, j, 4.2)
        out.append((p, unit(p), 0.5, [(54, 30, 88)] * 4, 0, 'surf', False))
    # the brim
    for ri in range(0, 26):
        r = R - 0.4 + ri * 0.24
        for j in range(-180, 180, 2):
            a = math.radians(j)
            y = 2.3 - (r - R) * 0.2 + 0.6 * math.cos(2 * a) * (r - R) / 6
            p = (r * math.sin(a), y, r * math.cos(a))
            out.append((p, (0.1 * math.sin(a), 1, 0.1 * math.cos(a)), 0.6, PURPLE, 1 if ri > 22 else 0, 'brim', False))
    return out

def feather_cap():
    out = []
    edge = lambda j: interp([(0, 1.8), (80, 0.5), (180, -2.5)], abs(j))
    def lean(p, n):
        # the cap rises to a soft point leaning back
        y = p[1]
        f = max(0, y - 2) / 10
        return (p[0] * (1 - 0.25 * f * f), y + 2.5 * f * f, p[2] - 4.5 * f * f), n
    shell(out, 12.4, edge, GREEN, top=lean)
    band(out, 12.7, edge(0) - 0.1, edge(0) + 1.5, BROWN, 0, az=(-180, 180))
    # the peak: a short brim jutting out over the brow, turned up a little at its point
    for ri in range(0, 16):
        r = 12.6 + ri * 0.28
        for j in range(-64, 65, 2):
            reach = 4.2 * (1 - abs(j) / 64) ** 0.7
            if (r - 12.6) > reach:
                continue
            a = math.radians(j)
            y = edge(j) + 0.4 + (r - 12.6) * 0.35
            out.append(((r * math.sin(a), y, r * math.cos(a)), (0.2 * math.sin(a), 1, 0.2 * math.cos(a)), 0.6, GREEN, 1, 'brim', False))
    # the feather: tucked in the band on the right, sweeping up and back
    base = sph(13.0, 80, 2.0)
    pts = [base, (14.4, 6.5, -3.5), (15.0, 10.0, -6.5), (14.6, 13.0, -10.0), (13.4, 14.8, -13.5)]
    tube(out, pts, 2.1, 0.7, FEATHER, 0)
    tube(out, pts[:4], 0.45, 0.3, WHITE, 0, step=0.25)  # the quill
    return out

def eyepatch():
    out = []
    # the patch over the right eye (screen right in the front view): a dark oval on the face
    P_AZ, P_Y = 25, -3.4
    for j in range(-12, 13):
        for k in range(-12, 13):
            u, v = j / 12, k / 12
            if u * u + v * v > 1:
                continue
            p = sph(12.0 + 0.4 * (1 - u * u - v * v), P_AZ + u * 13, P_Y + v * 3.4)
            out.append((p, unit(p), 0.6, LEATHER, 0 if v > 0.3 else 1, 'surf', False))
    # the strap: from the patch's outer side round the back, over the far ear and across the brow
    path = [(25, -3.0), (40, -2.6), (90, -1.0), (180, 1.5), (270, 6.0), (320, 6.5), (345, 3.0), (372, -1.8)]
    for a in range(30, 372, 2):
        y = interp(path, a)
        p = sph(12.0, a, y)
        out.append((p, unit(p), 0.55, LEATHER, 1, 'surf', False))
    return out

def monocle():
    out = []
    C = (5.0, -3.2, 11.0)
    for i in range(0, 72):
        a = math.radians(i * 5)
        p = (C[0] + 2.9 * math.cos(a), C[1] + 3.1 * math.sin(a), C[2] + 0.3 * math.cos(a))
        out.append((p, (0.3, 0.2, 1), 0.55, GOLD, 0 if math.sin(a) > 0 else 1, 'front', False))
    # a glint on the glass
    out.append(((C[0] - 1.0, C[1] + 1.2, C[2] + 0.2), (0, 0, 1), 0.5, [(236, 248, 255)] * 4, 0, 'front', False))
    # the chain: from the ring's outer side, down in a sag and back to the ear
    tube(out, [(C[0] + 2.8, C[1] - 1.0, C[2] - 0.2), (8.5, -8.5, 8.5), (10.8, -9.5, 4.0), (11.6, -6.0, 0.5)], 0.42, 0.42, GOLD, 1, kind='front', step=0.55)
    return out

# --- drawing ------------------------------------------------------------------------------------
def draw(parts, d, c, cut=None):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = head_mask(c)
    seen = lambda n: (lambda v: v[2] * math.cos(TILT) + v[1] * math.sin(TILT) >= -0.02)(unit(view(n, d)))
    # what hides a part behind it: the head, and the piece's own skin (a feather behind the cap)
    for p, n, w, pal, bias, kind, cuts in parts:
        if kind == 'surf' and seen(n):
            sx, sy, _ = project(p, d, c)
            hm |= {(int(sx + u), int(sy + v)) for u in (-0.5, 0, 0.5) for v in (-0.5, 0, 0.5)}
    blobs, low = [], {}
    for p, n, w, pal, bias, kind, cuts in parts:
        sx, sy, dep = project(p, d, c)
        if kind == 'surf':
            if not seen(n):  # its back, from the camera looking down
                continue
        elif kind == 'front' and dep < -0.5:  # on the face: gone once the face turns away
            continue
        elif dep < 0 and (int(sx), int(sy)) in hm:  # behind the head
            continue
        if cuts:
            x = int(sx)
            low[x] = max(low.get(x, 0), int(sy) + 1)
        if n is None:
            col = pal[min(3, (0 if dep > 2 else 1 if dep > -5 else 2) + bias)]
        else:
            col = shade(pal, n, d, bias)
        blobs.append((dep, sx, sy, w, col))
    blobs.sort(key=lambda b: b[0])
    for dep, sx, sy, w, col in blobs:
        R = w * SS
        g.ellipse([sx * SS - R, sy * SS - R, sx * SS + R, sy * SS + R], fill=col + (255,))
    if cut is not None:
        cut[d] = [low.get(x, 0) for x in range(CELL)]
    return big

def to_cell(big):
    small = big.resize((CELL, CELL), Image.NEAREST)
    a = small.load()
    out = small.copy()
    o = out.load()
    for y in range(CELL):
        for x in range(CELL):
            if a[x, y][3] < 128:
                o[x, y] = (0, 0, 0, 0)
                if any(0 <= x + u < CELL and 0 <= y + v < CELL and a[x + u, y + v][3] >= 128
                       for u, v in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    o[x, y] = OUT
            else:
                o[x, y] = a[x, y][:3] + (255,)
    return out

def build(pid, slot, make):
    parts = make()
    sheet = Image.new('RGBA', (CELL * 8, CELL), (0, 0, 0, 0))
    boxes, cut = {}, {}
    for c, d in enumerate(DIRS):
        cell = to_cell(draw(parts, d, c, cut if slot == 'head' else None))
        sheet.paste(cell, (c * CELL, 0))
        b = cell.getbbox()
        boxes[d] = list(b) if b else None
    sheet.save(f'{ART}/hg_{pid}.png')
    L = {'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': slot, 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': cut or None}
    json.dump(L, open(f'{ART}/hg_{pid}.json', 'w'))
    return sheet, L

PIECES = [('bandana', 'head', bandana), ('straw_hat', 'head', straw_hat), ('witch_hat', 'head', witch_hat),
          ('feather_cap', 'head', feather_cap), ('eyepatch', 'face', eyepatch), ('monocle', 'face', monocle)]

def preview(path, built):
    # each piece on the bald head and over a hairstyle (cut where the hat hides it)
    S, rows = 5, [0, 1]
    out = Image.new('RGBA', (CELL * 8 * S, CELL * S * len(rows) * len(built)), (70, 72, 84, 255))
    for si, (sheet, L) in enumerate(built):
        for ri, r in enumerate(rows):
            for c in range(8):
                cell = bald(c).copy()
                if r:
                    hair = heads.crop((c * CELL, r * CELL, c * CELL + CELL, r * CELL + CELL))
                    if L['cut']:
                        ha = hair.load()
                        for x, row in enumerate(L['cut'][DIRS[c]]):
                            for y in range(min(row, CELL)): ha[x, y] = (0, 0, 0, 0)
                    cell.alpha_composite(hair)
                cell.alpha_composite(sheet.crop((c * CELL, 0, c * CELL + CELL, CELL)))
                out.alpha_composite(cell.resize((CELL * S, CELL * S), Image.NEAREST), (c * CELL * S, (si * len(rows) + ri) * CELL * S))
    out.save(path)

if __name__ == '__main__':
    only = [a for a in sys.argv[1:] if not a.startswith('--') and not a.endswith('.png')]
    built = [build(pid, slot, make) for pid, slot, make in PIECES if not only or pid in only]
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1], built)
