# Draws the Sphinx's All-Seeing Eye (Face), the Eternal Sphinx's ultra rare, the same way draw-nemes.py
# draws the Pharaoh's Headdress: shapes laid on the head and turned to each of its 8 directions on its
# 43x43 cell (docs/character-standard.md). A gold Eye of the old kings over the hero's right eye: a
# gold ring round a lapis lens with a dark pupil, the gold brow above it, the falcon's mark below (a
# straight tear and a curling tail down the cheek), and a fine gold band back to the temple.
# Writes src/art/hg_allseeing_eye.png (8 cells in a row) and its .json layout.
#   python3 build-tools/draw-eye.py [--preview out.png]
import importlib.util, json, math, sys
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('hg', 'build-tools/draw-headgear.py')
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
DIRS, CELL, SS = hg.DIRS, hg.CELL, hg.SS

GOLD = hg.GOLD
LAPIS = [(150, 196, 255), (60, 110, 230), (36, 62, 146), (18, 30, 80)]
R = 12.1                  # just over the face (the cranium is 11.5)
EX, EY = -4.6, -4.4
# it is always painted over the hat (headgear.js paintGears; the owner's call), so no brim, cheek guard or
# headdress ever hides it       # the hero's right eye (the viewer's left, seen from the front)

def on_face(x, y, lift=0.0):
    # a point of the face at (x across, y up), on the head's surface, lifted off it a little
    r = R + lift
    z = math.sqrt(max(0.5, r * r - x * x - y * y))
    return (x, y, z)

def curve(pts, n=40):
    # a smooth line through 2D points (Catmull-Rom), as many steps
    out = []
    P = [pts[0]] + pts + [pts[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t ** 3) for j in range(2)))
    out.append(pts[-1])
    return out

def parts():
    # (3D point, its normal, radius in px, palette, shade bias)
    out = []
    def stroke(pts2d, w, pal, lift=0.3, bias=0):
        for (x, y) in pts2d:
            p = on_face(x, y, lift)
            out.append((p, p, w, pal, bias))
    # the lens: a lapis disc, lighter to the upper left, a dark pupil
    for i in range(0, 25):
        rr = 1.9 * i / 24
        for k in range(0, 360, 12):
            a = math.radians(k)
            x, y = EX + rr * math.cos(a), EY + rr * math.sin(a)
            lit = (math.cos(a + 2.4) * rr / 1.9)
            pal = [LAPIS[0], LAPIS[1], LAPIS[1], LAPIS[2]] if lit > 0.5 else LAPIS
            p = on_face(x, y, 0.45)
            out.append((p, p, 0.45, pal, 0 if lit > 0.5 else 1))
    for k in range(0, 360, 30):
        a = math.radians(k)
        p = on_face(EX + 0.6 * math.cos(a), EY + 0.6 * math.sin(a), 0.5)
        out.append((p, p, 0.45, [(16, 18, 30)] * 4, 0))
    # the gold ring round it
    ring = [(EX + 2.4 * math.cos(math.radians(k)), EY + 2.4 * math.sin(math.radians(k))) for k in range(0, 361, 6)]
    stroke(ring, 0.65, GOLD, 0.6)
    # the brow: a gold bar over it, flaring out to the temple
    stroke(curve([(-1.9, -0.9), (-4.6, -0.3), (-8.4, -0.9)]), 0.55, GOLD, 0.5)
    # the falcon's mark: a straight tear down from the eye, a tail curling out and down the cheek
    stroke(curve([(-3.9, -6.8), (-4.0, -8.2), (-4.1, -9.4)]), 0.5, GOLD, 0.4)
    stroke(curve([(-6.2, -6.4), (-7.4, -7.6), (-7.8, -9.0), (-7.0, -9.8), (-6.3, -9.1)]), 0.5, GOLD, 0.4)
    # a fine band from the ring back to the temple (seen from the side)
    stroke(curve([(-7.0, -3.9), (-9.6, -3.4), (-11.2, -2.8)]), 0.4, GOLD, 0.35, 1)
    return out

def draw_eye(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    blobs = []
    for p, n, w, pal, bias in parts():
        sx, sy, dep = hg.project(p, d, c)
        v = hg.unit(hg.view(n, d))
        if v[2] < 0.12:  # round the far side of the head: hidden
            continue
        blobs.append((dep, sx, sy, w, hg.shade(pal, n, d, bias)))
    blobs.sort(key=lambda b: b[0])
    for dep, sx, sy, w, col in blobs:
        r = w * SS
        g.ellipse([sx * SS - r, sy * SS - r, sx * SS + r, sy * SS + r], fill=col + (255,))
    return big

if __name__ == '__main__':
    sheet = Image.new('RGBA', (CELL * 8, CELL), (0, 0, 0, 0))
    boxes = {}
    for c, d in enumerate(DIRS):
        cell = hg.to_cell(draw_eye(d, c))
        sheet.paste(cell, (c * CELL, 0))
        boxes[d] = hg.box(cell)
    sheet.save(f'{hg.ART}/hg_allseeing_eye.png')
    json.dump({'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': 'face', 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None, 'over': True}, open(f'{hg.ART}/hg_allseeing_eye.json', 'w'))
    if '--preview' in sys.argv:
        S = 8
        out = Image.new('RGBA', (CELL * 8 * S, CELL * S * 2), (70, 72, 84, 255))
        for c in range(8):
            for row, hair in enumerate((0, 2)):
                cell = hg.heads.crop((c * CELL, 0, c * CELL + CELL, CELL)).copy()
                if hair:
                    cell.alpha_composite(hg.heads.crop((c * CELL, hair * CELL, c * CELL + CELL, hair * CELL + CELL)))
                cell.alpha_composite(sheet.crop((c * CELL, 0, c * CELL + CELL, CELL)))
                out.alpha_composite(cell.resize((CELL * S, CELL * S), Image.NEAREST), (c * CELL * S, row * CELL * S))
        out.save(sys.argv[sys.argv.index('--preview') + 1])
