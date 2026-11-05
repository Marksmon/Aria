# Draws Ammit's Angry Snarl (Face), the Devourer's drop, the owner's call: an ordinary person's face, angry:
# thick brows drawn down and a grimace of gritted teeth, on the hero's face: a white slanted block (its right side taller) with gritted teeth as a pink zigzag across
# it, outlined dark. Laid on the face and turned to each of the head's 8 directions on its 43x43 cell
# (docs/character-standard.md), like draw-eye.py; always drawn over the hat (over).
# Writes src/art/hg_ammit_snarl.png (8 cells in a row) and its .json layout.
#   python3 build-tools/draw-snarl.py [--preview out.png]
import importlib.util, json, math, sys
from PIL import Image, ImageDraw

spec = importlib.util.spec_from_file_location('hg', 'build-tools/draw-headgear.py')
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
DIRS, CELL, SS = hg.DIRS, hg.CELL, hg.SS

WHITE = (252, 250, 246)
PINK = (238, 140, 150)
R = 11.9  # on the face

def on_face(x, y, lift=0.0):
    r = R + lift
    return (x, y, math.sqrt(max(0.5, r * r - x * x - y * y)))

# the face, angry: thick brows drawn down toward the nose, and a grimace of gritted teeth, its corners
# pulled down (white teeth, a dark line between the rows, gaps between them); the outline comes from to_cell
BROW = (40, 26, 18)
LINE = (70, 40, 34)
MOUTH = [(-3.2, -9.3), (0, -9.0), (3.2, -9.3), (3.7, -10.5), (2.7, -11.5), (-2.7, -11.5), (-3.7, -10.5)]

def draw(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    pt = lambda x, y, l=0.3: tuple(v * SS for v in hg.project(on_face(x, y, l), d, c)[:2])
    seen = lambda x, y: hg.unit(hg.view(on_face(x, y), d))[2] > 0.3
    # the brows: thick, slanting down to the middle, each drawn only where it faces us
    for sd in (-1, 1):
        pts = [(sd * (1.6 + 5.2 * t), -0.5 + 3.0 * t) for t in [k / 6 for k in range(7)]]
        vis = [p for p in pts if seen(*p)]
        if len(vis) > 1:
            g.line([pt(x, y, 0.4) for x, y in vis], fill=BROW + (255,), width=int(SS * 1.15), joint='curve')
    if not seen(0, -10.2):  # turned away: the mouth is out of sight
        return big
    edge = []
    for (x0, y0), (x1, y1) in zip(MOUTH, MOUTH[1:] + MOUTH[:1]):
        for k in range(5):
            t = k / 5
            edge.append(pt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    g.polygon(edge, fill=WHITE + (255,))
    g.line([pt(x, -10.25 - 0.1 * abs(x)) for x in [i * 0.5 for i in range(-6, 7)]], fill=LINE + (255,), width=int(SS * 0.45))  # between the rows of teeth
    return big

if __name__ == '__main__':
    sheet = Image.new('RGBA', (CELL * 8, CELL), (0, 0, 0, 0))
    boxes = {}
    for c, d in enumerate(DIRS):
        cell = hg.to_cell(draw(d, c))
        sheet.paste(cell, (c * CELL, 0))
        boxes[d] = hg.box(cell)
    sheet.save(f'{hg.ART}/hg_ammit_snarl.png')
    json.dump({'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': 'face', 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None, 'over': True}, open(f'{hg.ART}/hg_ammit_snarl.json', 'w'))
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
