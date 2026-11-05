# Draws Ammit's Angry Snarl (Face), the Devourer's drop, after the owner's sketch: a cartoon angry mouth on
# the hero's face, a white slanted block (its right side taller) with gritted teeth as a pink zigzag across
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

# the mouth (after the owner's sketch): a white block, slanted (its right side taller), gritted teeth as a
# pink zigzag across it; the outline comes from to_cell
CORNERS = [(-3.0, -9.3), (3.0, -8.5), (2.9, -11.0), (-2.9, -10.7)]

def draw(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    if hg.unit(hg.view(on_face(0, -9.8), d))[2] < 0.3:  # turned away: the mouth is out of sight
        return big
    pt = lambda x, y: tuple(v * SS for v in hg.project(on_face(x, y, 0.3), d, c)[:2])
    edge = []  # the outline, along the face (a few points a side, so it wraps round the cheek)
    for (x0, y0), (x1, y1) in zip(CORNERS, CORNERS[1:] + CORNERS[:1]):
        for k in range(6):
            t = k / 6
            edge.append(pt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    g.polygon(edge, fill=WHITE + (255,))
    zig = []  # the gritted teeth: a zigzag between the top and bottom, a little in from each
    n = 6
    for k in range(n + 1):
        t = k / n
        x = -2.5 + 5.0 * t
        top = -9.3 + 0.8 * (x + 3.0) / 6.0 - 0.45
        bot = -10.7 - 0.3 * (x + 2.9) / 5.8 + 0.45
        zig.append(pt(x, top if k % 2 else bot))
    g.line(zig, fill=PINK + (255,), width=int(SS * 0.75), joint='curve')
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
