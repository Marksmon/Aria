# Draws the World Tree Crown (Head), Nidhogg's ultra rare, the same way draw-nemes.py draws the Pharaoh's
# Headdress: shapes laid round the head and turned to each of its 8 directions on its 43x43 cell
# (docs/character-standard.md). A band of the World Tree's own twigs round the brow, golden-green leaves
# all round it, a few twigs branching up from it like small antlers, and a drop of green sap shining in
# front like a jewel. It sits on the hair (it hides none).
# Writes src/art/hg_worldtree_crown.png (8 cells in a row) and its .json layout.
#   python3 build-tools/draw-crown.py [--preview out.png]
import importlib.util, json, math, sys
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('hg', 'build-tools/draw-headgear.py')
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
DIRS, CELL, SS = hg.DIRS, hg.CELL, hg.SS

BARK = [(150, 112, 74), (112, 80, 50), (80, 56, 34), (52, 36, 22)]
LEAF = [(214, 230, 120), (160, 196, 70), (106, 150, 52), (66, 104, 40)]   # golden-green, light .. dark
GOLD = [(255, 236, 150), (236, 196, 80), (190, 140, 40), (130, 90, 24)]
SAP = [(200, 255, 210), (110, 230, 150), (50, 170, 100), (24, 110, 60)]
R = 12.9     # the band, just over the hair round the brow
Y = 1.4      # its height on the head (the brow line)

def parts():
    out = []
    # the band of twisted twigs round the head, a little higher at the back
    for j in range(0, 360, 4):
        a = math.radians(j)
        y = Y + 1.2 * (1 - math.cos(a)) / 2
        n = (math.sin(a), 0.1, math.cos(a))
        out.append(((R * n[0], y, R * n[2]), n, 0.85, BARK, 0))
        out.append(((R * 1.02 * n[0], y + 0.7 * math.sin(a * 5), R * 1.02 * n[2]), n, 0.45, BARK, 1))  # the twist
    # leaves all round it, pointing out and up, gold at their tips now and then
    for k in range(18):
        a = math.radians(k * 20 + 6)
        n = (math.sin(a), 0.35, math.cos(a))
        base = Y + 1.2 * (1 - math.cos(a)) / 2
        for i in range(9):
            t = i / 8
            w = 0.95 * math.sin(math.pi * min(1, t * 1.1)) + 0.3
            r = R + 0.4 + 2.6 * t
            y = base + 0.6 + 2.2 * t
            pal = GOLD if (k % 3 == 0 and t > 0.6) else LEAF
            out.append(((r * n[0], y, r * n[2]), n, w * 0.9, pal, 0))
    # twigs branching up from it, like small antlers, a leaf at each tip
    for side in (-1, 1):
        for a0 in (35, 70):
            a = math.radians(a0 * side)
            n = (math.sin(a), 0.6, math.cos(a))
            x0, z0 = R * math.sin(a), R * math.cos(a)
            pts = [(x0, Y + 0.5, z0), (x0 * 1.08, Y + 4, z0 * 1.05), (x0 * 1.16, Y + 7.2, z0 * 1.02)]
            for p0, p1 in zip(pts, pts[1:]):
                for s in range(8):
                    u = s / 7
                    out.append((tuple(p0[q] + (p1[q] - p0[q]) * u for q in range(3)), n, 0.55, BARK, 0))
            tip = pts[2]
            fork = (tip[0] + side * 1.6, tip[1] - 1.4, tip[2])
            for s in range(6):
                u = s / 5
                out.append((tuple(pts[1][q] + (fork[q] - pts[1][q]) * u for q in range(3)), n, 0.45, BARK, 0))
            for p in (tip, fork):
                out.append(((p[0], p[1] + 0.6, p[2]), n, 1.0, LEAF, 0))
    # the sap jewel in front, in a little gold setting
    out.append(((0, Y + 0.8, R + 0.6), (0, 0.1, 1), 1.55, GOLD, 1))
    out.append(((0, Y + 0.9, R + 0.9), (0, 0.15, 1), 1.15, SAP, 0))
    out.append(((-0.35, Y + 1.3, R + 1.1), (0, 0.4, 1), 0.4, [(240, 255, 245)] * 4, 0))
    return out

def draw_crown(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = hg.head_mask(c)
    blobs = []
    for p, n, w, pal, bias in parts():
        sx, sy, dep = hg.project(p, d, c)
        if dep < -3 and (int(sx), int(sy)) in hm:  # round the back of the head: hidden by it
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
        cell = hg.to_cell(draw_crown(d, c))
        sheet.paste(cell, (c * CELL, 0))
        boxes[d] = hg.box(cell)
    sheet.save(f'{hg.ART}/hg_worldtree_crown.png')
    json.dump({'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': 'head', 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None}, open(f'{hg.ART}/hg_worldtree_crown.json', 'w'))
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
