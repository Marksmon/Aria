# Draws standard headgear pieces in code, as 3D shapes turned to each of the head's 8 directions
# and drawn on its 43x43 cell (docs/character-standard.md), for pieces PixelLab didn't make:
#   goat_horns  Giant Goat Horns (Head): two great ridged horns curling back and round past the ears
#   elf_ears    Elven Ears (Face): long pointed ears over the head's own
# Writes src/art/hg_<id>.png (8 cells in a row) and its .json layout.
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

def head_mask(c):
    a = bald(c).load()
    return {(x, y) for x in range(CELL) for y in range(CELL) if a[x, y][3] > 0}

# --- the horns ---------------------------------------------------------------------------------
IVORY = [(250, 238, 206), (226, 206, 160), (190, 162, 116), (140, 112, 78)]  # light .. dark
RIDGE = (120, 92, 62)

def horn(side):
    # a ram's curl: up from the temple, back, down past the ear and forward, widening outward
    pts = []
    n = 90
    for i in range(n + 1):
        t = i / n
        a = math.radians(-35 + 320 * t)
        r = 7.6 * (1 - 0.5 * t)
        cy, cz = 3.5, -3.5
        y = cy + r * math.cos(a)
        z = cz - r * math.sin(a)
        x = side * (8 + 6 * math.sin(min(1, t * 1.6) * math.pi / 2))
        w = 3.3 * (1 - 0.72 * t) + 0.6
        pts.append(((x, y, z), w, t))
    return pts

def draw_horns(d, c):
    big = Image.new('RGBA', (CELL * SS, CELL * SS), (0, 0, 0, 0))
    g = ImageDraw.Draw(big)
    hm = head_mask(c)
    blobs = []
    for side in (-1, 1):
        for p, w, t in horn(side):
            sx, sy, dep = project(p, d, c)
            blobs.append((dep, sx, sy, w, t))
    blobs.sort(key=lambda b: b[0])
    for dep, sx, sy, w, t in blobs:
        # behind the head: hidden where the head is
        if dep < -3 and (int(sx), int(sy)) in hm:
            continue
        ridge = (t * 10) % 1 < 0.2 and t < 0.9
        # shade: the far side and the underside darker
        k = 0 if dep > 0 else 1 if dep > -6 else 2
        col = RIDGE if ridge else IVORY[min(2, k + (1 if t > 0.7 else 0))]
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
    small = big.resize((CELL, CELL), Image.NEAREST)
    a = small.load()
    # a dark outline round the piece, and no half-transparent pixels
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

def box(cell):
    b = cell.getbbox()
    return list(b) if b else None

def build(pid, slot, draw):
    sheet = Image.new('RGBA', (CELL * 8, CELL), (0, 0, 0, 0))
    boxes = {}
    for c, d in enumerate(DIRS):
        cell = to_cell(draw(d, c))
        sheet.paste(cell, (c * CELL, 0))
        boxes[d] = box(cell)
    sheet.save(f'{ART}/hg_{pid}.png')
    L = {'cw': CELL, 'ch': CELL, 'frames': 1, 'slot': slot, 'dirs': {d: i for i, d in enumerate(DIRS)}, 'box': boxes, 'cut': None}
    json.dump(L, open(f'{ART}/hg_{pid}.json', 'w'))
    return sheet

def preview(path, sheets):
    S = 6
    rows = [0, 2, 1]  # bald, mane, messy
    out = Image.new('RGBA', (CELL * 8 * S, CELL * S * len(rows) * len(sheets)), (70, 72, 84, 255))
    for si, sh in enumerate(sheets):
        for ri, r in enumerate(rows):
            strip = heads.crop((0, 0, CELL * 8, CELL)).copy()
            if r: strip.alpha_composite(heads.crop((0, r * CELL, CELL * 8, r * CELL + CELL)))
            strip.alpha_composite(sh)
            y = (si * len(rows) + ri) * CELL * S
            out.alpha_composite(strip.resize((CELL * 8 * S, CELL * S), Image.NEAREST), (0, y))
    out.save(path)

if __name__ == '__main__':
    sheets = [build('goat_horns', 'head', draw_horns), build('elf_ears', 'face', draw_ears)]
    if '--preview' in sys.argv:
        preview(sys.argv[sys.argv.index('--preview') + 1], sheets)
