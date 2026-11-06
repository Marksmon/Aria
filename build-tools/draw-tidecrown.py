# Draws the Crown of the Tides (Head), Poseidon's ultra rare, after the owner's sheet, the same way draw-crown.py draws
# the World Tree Crown: shapes laid round the head and turned to each of its 8 directions on its 43x43 cell
# (docs/character-standard.md). A band of gold round the brow, short points all round it, two great gold horns
# sweeping out and up from its sides like breaking waves, and a sea-blue stone shining in front. It sits on the hair.
# Writes src/art/hg_poseidon_crown.png (8 cells in a row) and its .json layout.
#   python3 build-tools/draw-tidecrown.py [--preview out.png]
import importlib.util, json, math, sys
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('hg', 'build-tools/draw-headgear.py')
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
DIRS, CELL, SS = hg.DIRS, hg.CELL, hg.SS

GOLD = [(255, 236, 150), (236, 190, 76), (190, 136, 40), (128, 86, 22)]
SEA = [(200, 246, 255), (110, 210, 250), (50, 140, 210), (24, 80, 140)]
R = 12.9     # the band, just over the hair round the brow
Y = 1.4      # its height on the head (the brow line)

def parts():
    out = []
    # the gold band, a little higher at the back, with a raised rim top and bottom
    for j in range(0, 360, 4):
        a = math.radians(j)
        y = Y + 1.2 * (1 - math.cos(a)) / 2
        n = (math.sin(a), 0.1, math.cos(a))
        out.append(((R * n[0], y, R * n[2]), n, 0.95, GOLD, 0))
        for dy in (-0.9, 0.9):
            out.append(((R * 1.03 * n[0], y + dy, R * 1.03 * n[2]), n, 0.4, GOLD, 1))
    # short points all round it, like the crests of small waves
    for k in range(14):
        a = math.radians(k * (360 / 14) + 13)
        n = (math.sin(a), 0.3, math.cos(a))
        base = Y + 1.2 * (1 - math.cos(a)) / 2
        for i in range(6):
            t = i / 5
            out.append((((R + 0.2) * n[0], base + 1 + 2.4 * t, (R + 0.2) * n[2]), n, 0.75 * (1 - t) + 0.2, GOLD, 0))
    # the two great horns: out from the band's sides, sweeping out, then up, then curling in at their tips
    for side in (-1, 1):
        a = math.radians(78 * side)
        n = (math.sin(a), 0.4, math.cos(a))
        x0, z0 = R * math.sin(a), R * math.cos(a)
        pts = [(x0, Y + 0.6, z0), (x0 * 1.3, Y + 2.6, z0 * 1.1), (x0 * 1.45, Y + 6.2, z0 * 1.0), (x0 * 1.35, Y + 10.2, z0 * 0.9), (x0 * 1.12, Y + 12.6, z0 * 0.8)]
        widths = [1.25, 1.1, 0.9, 0.7, 0.45]
        for k, (p0, p1) in enumerate(zip(pts, pts[1:])):
            for s in range(8):
                u = s / 7
                w = widths[k] + (widths[k + 1] - widths[k]) * u
                out.append((tuple(p0[q] + (p1[q] - p0[q]) * u for q in range(3)), n, w, GOLD, 0))
        for k in (1, 2, 3):  # ridges of light along them
            p = pts[k]
            out.append(((p[0] * 1.02, p[1] + 0.4, p[2] * 1.02), n, 0.35, GOLD, 2))
    # the sea-blue stone in front, in a gold setting, a tall point above it
    for i in range(7):
        t = i / 6
        out.append(((0, Y + 1.5 + 2.2 * t, R + 0.6), (0, 0.2, 1), 0.95 * (1 - t) + 0.3, GOLD, 0))
    out.append(((0, Y + 0.6, R + 0.7), (0, 0.1, 1), 1.75, GOLD, 1))
    out.append(((0, Y + 0.7, R + 1.0), (0, 0.15, 1), 1.3, SEA, 0))
    out.append(((-0.4, Y + 1.2, R + 1.25), (0, 0.4, 1), 0.42, [(240, 252, 255)] * 4, 0))
    return out

def draw(d, c):
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
        cell = hg.to_cell(draw(d, c))
        sheet.paste(cell, (c * CELL, 0))
        boxes[d] = hg.box(cell)
    sheet.save(f'{hg.ART}/hg_poseidon_crown.png')
    json.dump({'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': 'head', 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None}, open(f'{hg.ART}/hg_poseidon_crown.json', 'w'))
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
