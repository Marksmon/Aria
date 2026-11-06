# Draws the Forsaken Captain's Tricorn (Head), Davy Jones's ultra rare, after the owner's sheet, the same way
# draw-crown.py draws the World Tree Crown: shapes laid round the head and turned to each of its 8 directions on its
# 43x43 cell (docs/character-standard.md). A black tricorn, its brim turned up into three corners (one in front, two
# behind), a tarnished gold edge along the brim, a rounded crown over the head and a little skull pinned on the front.
# Writes src/art/hg_forsaken_tricorn.png (8 cells in a row) and its .json layout.
#   python3 build-tools/draw-tricorn.py [--preview out.png]
import importlib.util, json, math, sys
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('hg', 'build-tools/draw-headgear.py')
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
DIRS, CELL, SS = hg.DIRS, hg.CELL, hg.SS

FELT = [(70, 70, 84), (40, 40, 50), (24, 24, 32), (12, 12, 18)]
GOLD = [(236, 206, 120), (190, 150, 70), (140, 104, 44), (90, 64, 26)]
BONE = [(250, 246, 230), (220, 214, 196), (180, 172, 150), (130, 122, 104)]
R = 12.9     # the head, round the brow
Y = 2.2      # where the brim sits

def parts():
    out = []
    # the crown: rounded, over the top of the head
    for j in range(0, 360, 10):
        a = math.radians(j)
        for k in range(5):
            t = k / 4
            r = R * 0.98 * math.cos(t * 1.2)
            y = Y + 1 + math.sin(t * 1.2) * 8
            n = (math.sin(a) * math.cos(t), math.sin(t), math.cos(a) * math.cos(t))
            out.append(((r * math.sin(a), y, r * math.cos(a)), n, 1.6, FELT, 0))
    # the brim, turned up all round, its three corners (front, back left, back right) pointing out and up
    for j in range(0, 360, 3):
        a = math.radians(j)
        c = max(0, math.cos(3 * a))
        rb = R + 1.8 + 4.2 * c ** 3
        n = (math.sin(a), 0.4, math.cos(a))
        for k in range(6):
            t = k / 5
            r = R + 0.4 + (rb - R - 0.4) * t
            y = Y + t * (2.4 + 3.4 * c)
            out.append(((r * math.sin(a), y, r * math.cos(a)), n, 0.75, FELT, 1 if k == 5 else 0))
        out.append(((rb * math.sin(a), Y + 2.6 + 3.4 * c, rb * math.cos(a)), n, 0.5, GOLD, 1)) # the gold edge
    # the little skull pinned on the front
    out.append(((0, Y + 3.2, R + 2.6), (0, 0.3, 1), 1.3, BONE, 1))
    for dx in (-0.45, 0.45):
        out.append(((dx, Y + 3.3, R + 3.6), (0, 0.3, 1), 0.3, [(20, 18, 16)] * 4, 0))
    return out

def draw(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    blobs = []
    for p, n, w, pal, bias in parts():
        sx, sy, dep = hg.project(p, d, c)
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
    sheet.save(f'{hg.ART}/hg_forsaken_tricorn.png')
    json.dump({'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': 'head', 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None}, open(f'{hg.ART}/hg_forsaken_tricorn.json', 'w'))
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
