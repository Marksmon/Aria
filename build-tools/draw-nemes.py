# Draws the Pharaoh's Headdress (Head), Pharaoh's Tomb's ultra rare, the same way draw-headgear.py
# draws the horn helm: 3D shapes turned to each of the head's 8 directions on its 43x43 cell
# (docs/character-standard.md). A striped cloth of gold and lapis over the crown, a gold band on the
# brow with a cobra rising from it, two striped lappets falling in front of the shoulders, and the
# cloth gathered into a tail at the back. It hides the hair it covers (cut).
# Writes src/art/hg_pharaoh_nemes.png (8 cells in a row) and its .json layout.
#   python3 build-tools/draw-nemes.py [--preview out.png]
import importlib.util, math, sys
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('hg', 'build-tools/draw-headgear.py')
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
DIRS, CELL, SS = hg.DIRS, hg.CELL, hg.SS

GOLD = hg.GOLD
LAPIS = [(120, 160, 236), (58, 96, 196), (36, 62, 146), (22, 38, 98)]
TEAL = [(120, 214, 196), (64, 166, 150), (40, 116, 106), (24, 74, 68)]
RED = [(240, 110, 90), (200, 60, 46), (140, 36, 28), (90, 20, 16)]
R = 12.8  # the cloth sits a little over the cranium (11.5)

def stripe(y):
    # the bands, by height: gold and lapis, a teal band now and then
    k = int(math.floor((y + 40) / 2.2)) % 5
    return [GOLD, LAPIS, GOLD, LAPIS, TEAL][k]

def edge(a):
    # where the cloth ends, by azimuth (0 the face, 90 the side, 180 the back): the brow in front,
    # down past the ears at the sides, low at the back (the tail is drawn apart)
    a = abs(a)
    pts = [(0, 0.5), (35, 0.0), (60, -3.0), (90, -9.0), (130, -11.0), (180, -12.0)]
    for (a0, y0), (a1, y1) in zip(pts, pts[1:]):
        if a <= a1:
            return y0 + (y1 - y0) * (a - a0) / (a1 - a0)
    return pts[-1][1]

def parts():
    out = []
    # the cloth over the crown: a dome, wider than the head at the sides as the nemes is
    for i in range(0, 271, 3):
        el = math.radians(i / 2)  # (down to 135 degrees: the cloth reaches below the cranium's middle)
        for j in range(-180, 180, 3):
            a = math.radians(j)
            n = (math.sin(el) * math.sin(a), math.cos(el), math.sin(el) * math.cos(a))
            flare = 1 + 0.12 * abs(math.sin(a)) * (1 - math.cos(el))  # it flares out above the ears
            p = (R * n[0] * flare, R * n[1], R * n[2])
            e = edge(j)
            if p[1] < e:
                continue
            brow = p[1] < e + 1.6 and abs(j) < 60
            out.append((p, n, 0.6, GOLD if brow else stripe(p[1]), 0, 'shell'))
    # the lappets: a striped panel each side, from the temple down in front of the shoulder, widening
    for side in (-1, 1):
        for i in range(45):
            v = i / 44
            y = -2 - 18 * v
            half = 2.2 + 1.6 * v
            for k in range(-6, 7):
                u = k / 6
                # a panel turned half toward the front, so it frames the face from the front and shows from the side
                x = side * (R * 0.9 + 1.2 * v + u * half * 0.55)
                z = 3.0 - u * half * 0.8
                n = (side * 0.6, 0.15, 0.8)
                col = GOLD if (v > 0.93 or abs(u) > 0.85) else stripe(y)
                out.append(((x, y, z), n, 0.55, col, 0, 'lappet'))
    # the tail: the cloth gathered at the nape, bound in gold
    for i in range(31):
        v = i / 30
        y = -10 - 9 * v
        w = 4.5 * (1 - 0.5 * v)
        for k in range(-5, 6):
            u = k / 5
            out.append(((u * w, y, -R * 0.92), (0, 0.1, -1), 0.6, GOLD if v > 0.85 else stripe(y), 0, 'tail'))
    # the cobra rising from the brow: its hood, and a red eye
    for i in range(25):
        v = i / 24
        out.append(((0, 1.5 + 5 * v, R + 0.6 + 0.8 * math.sin(v * 3)), (0, 0.2, 1), 0.9 - 0.3 * v, GOLD, 0, 'cobra'))
    for k in range(-4, 5):
        out.append(((k * 0.45, 6.2, R + 1.2), (0, 0.2, 1), 0.6, GOLD, 1, 'cobra'))
    out.append(((0, 6.6, R + 1.6), (0, 0.2, 1), 0.45, RED, 0, 'cobra'))
    return out

def draw_nemes(d, c, cut=None):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = hg.head_mask(c)
    blobs, low = [], {}
    for p, n, w, pal, bias, part in parts():
        sx, sy, dep = hg.project(p, d, c)
        v = hg.unit(hg.view(n, d))
        if part == 'shell' and v[2] < -0.02:  # its inside: the face shows through the opening
            continue
        if part in ('lappet', 'tail') and dep < -2 and (int(sx), int(sy)) in hm:  # behind the head
            continue
        if part in ('shell', 'lappet', 'tail'):
            x = int(sx)
            low[x] = max(low.get(x, 0), int(sy) + 1)
        blobs.append((dep, sx, sy, w, hg.shade(pal, n, d, bias)))
    blobs.sort(key=lambda b: b[0])
    for dep, sx, sy, w, col in blobs:
        r = w * SS
        g.ellipse([sx * SS - r, sy * SS - r, sx * SS + r, sy * SS + r], fill=col + (255,))
    if cut is not None:
        cut[d] = [low.get(x, 0) for x in range(CELL)]
    return big

if __name__ == '__main__':
    W = CELL
    sheet = Image.new('RGBA', (W * 8, CELL), (0, 0, 0, 0))
    boxes, cut = {}, {}
    for c, d in enumerate(DIRS):
        cell = hg.to_cell(draw_nemes(d, c, cut))
        sheet.paste(cell, (c * W, 0))
        boxes[d] = hg.box(cell)
    sheet.save(f'{hg.ART}/hg_pharaoh_nemes.png')
    import json
    json.dump({'cw': W, 'ch': CELL, 'frames': 1, 'slot': 'head', 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': cut}, open(f'{hg.ART}/hg_pharaoh_nemes.json', 'w'))
    if '--preview' in sys.argv:
        hg.preview(sys.argv[sys.argv.index('--preview') + 1], [[[ (lambda cl: (lambda w: (w.alpha_composite(cl, (hg.HORN_PX, 0)), w)[1])(Image.new('RGBA', (CELL + 2 * hg.HORN_PX, CELL), (0, 0, 0, 0))))(sheet.crop((c * W, 0, c * W + W, CELL))) for c in range(8)]]], cut)
