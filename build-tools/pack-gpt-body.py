"""Pack a hero body drawn as a sprite sheet (art/chatgpt/<name>/) to the character standard
(docs/character-standard.md): the drawn head comes off, the body is scaled so its chin stands 63 px
above the ground, and every frame goes on the bald bodies' 106 x 108 grid with its neck under the
standard head spot, so the game paints the shared head, hair and headgear on it.

  python3 build-tools/pack-gpt-body.py trainee_m      -> src/art/trainee_m.png and .json (like trainee.json)

Sources, on a flat magenta background: front.png (4 rows of 16: down, down-left, left, up) and
back.png (2 rows of 18: up-left, up-right; 9 attack frames, 7 kept). Right and down-right are left
and down-left mirrored. Each row: 1 standing, 8 walking, 7 attacking.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name = sys.argv[1] if len(sys.argv) > 1 else 'trainee_m'
SRC = os.path.join(ROOT, 'art', 'chatgpt', name)
STD = json.load(open(os.path.join(ROOT, 'src', 'art', 'trainee.json')))
FW, FH, LEGS = STD['fw'], STD['fh'], 63
DIRS = ['down', 'right', 'up', 'left', 'downright', 'upright', 'upleft', 'downleft']  # (trainee.json's order)
ANIMS = [('idle', 1), ('attack', 7), ('walk', 8)]

def keyed(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = ((r - g) > 45) & ((b - g) > 45)  # magenta, and the soft edge it left on the art
    # what magenta still tints (a pink fringe on edges, pink glints on steel) turned back to grey: red
    # and blue both above green by the same amount come down to green (skin, leather and white untouched)
    m = np.clip(np.minimum(r, b) - g, 0, None)
    a = np.dstack([r - m, g, b - m])
    return Image.fromarray(np.dstack([a.clip(0, 255).astype(np.uint8), np.where(bg, 0, 255).astype(np.uint8)]))

def cells(img, n, bands):
    W = img.width
    return [[img.crop((int(k * W / n), y0, int((k + 1) * W / n), y1)) for k in range(n)] for y0, y1 in bands]

front, back = keyed(os.path.join(SRC, 'front.png')), keyed(os.path.join(SRC, 'back.png'))
F = cells(front, 16, [(0, 262), (262, 487), (487, 714), (714, front.height)])
B = cells(back, 18, [(0, 360), (360, back.height)])
KEEP = list(range(9)) + [9, 10, 11, 12, 13, 15, 17]  # standing, walk 1-8, attack (the strike kept)
rows = {'down': F[0], 'downleft': F[1], 'left': F[2], 'up': F[3], 'upleft': [B[0][k] for k in KEEP], 'upright': [B[1][k] for k in KEEP]}
rows['right'] = [ImageOps.mirror(f) for f in rows['left']]
rows['downright'] = [ImageOps.mirror(f) for f in rows['downleft']]

def measure(f, depth=None):
    """the drawn head (a big round skull) and where it meets the neck; and the feet. The skull's top and
    sides come from its skin (its upper half, lit); the neck is the silhouette's narrowest row under
    the skull's widest one, inside the skull's columns: shading and the outline don't fool it"""
    a = np.asarray(f).astype(int); al = a[..., 3] > 0
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    light = (r > 225) & (g > 215) & (b > 215)  # (the white slash arc)
    skin = al & ~light & (r > 150) & (g > 100) & (b > 60) & (r >= g) & (g >= b) & (r - b > 25)
    top = np.nonzero(skin.any(1))[0].min()
    spans = []
    for y in range(top, top + 45):
        xs = np.nonzero(skin[y])[0]
        spans.append((xs.min(), xs.max()) if xs.size else (0, -1))
    k = int(np.argmax([x1 - x0 for x0, x1 in spans]))
    x0, x1 = spans[k]; wy = top + k
    cols = slice(max(0, x0 - 1), x1 + 2)
    run = [al[y, cols].sum() for y in range(wy, min(al.shape[0], wy + 45))]
    neck = wy + int(np.argmin(run[:40]))
    # the skull: every pixel down to the neck inside its columns (and a ring round it), then what of
    # it the neck row still joins (its rim) cut along the neck
    head = np.zeros_like(al)
    head[max(0, top - 3):neck, max(0, x0 - 3):x1 + 4] = True
    head &= al
    # and its neck under it (a second chin under the game's head): the skin and its dark outline in the
    # rows below, down to the collar; the game's head then sits on the collar
    # (how deep that neck is: measured on the standing frame, the same in every frame of the
    # direction, so a hand near the neck doesn't make the head jump)
    dark = (r + g + b) < 200
    nb = 0
    for y in range(neck, min(al.shape[0], neck + (12 if depth is None else depth))):
        xs = np.nonzero(skin[y, max(0, x0 - 3):x1 + 4])[0]
        if not xs.size:
            if depth is None: break
            nb += 1; continue
        c0, c1 = max(0, x0 - 3) + xs.min() - 2, max(0, x0 - 3) + xs.max() + 3
        head[y, c0:c1] |= (skin[y, c0:c1] | dark[y, c0:c1]) & al[y, c0:c1]
        nb += 1
    body = al & ~light
    feet = np.nonzero(body.any(1))[0].max()
    return head, (x0 + x1) / 2, neck + nb, feet, nb
sheet = Image.new('RGBA', (FW * 8, FH * len(DIRS) * len(ANIMS)), (0, 0, 0, 0))
layout = {}
for di, d in enumerate(DIRS):
    std = STD['anims'][d]['idle']
    h0, spot0 = std[3][0], std[4][0]           # the standard head here: [x, crown, neck, w, eyes...], its spot
    fr = rows[d]
    _, _, chin0, feet0, depth = measure(fr[0])
    s = LEGS / (feet0 - chin0)                   # the chin 63 px above the ground
    ground = h0[2] + LEGS
    layout[d] = {}
    for ai, (anim, n) in enumerate(ANIMS):
        row = di * len(ANIMS) + ai
        idx = [0] if anim == 'idle' else list(range(9, 16)) if anim == 'attack' else list(range(1, 9))
        heads, spots, feet_px = [], [], []
        for k, i in enumerate(idx):
            f = fr[i]
            grow, cx, chin, feet, _ = measure(f, depth)
            a = np.asarray(f).copy(); a[grow, 3] = 0   # the drawn head off
            body = Image.fromarray(a)
            big = body.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.LANCZOS)
            ba = np.asarray(big).copy(); ba[..., 3] = np.where(ba[..., 3] >= 110, 255, 0); big = Image.fromarray(ba)
            ox = round(h0[0] - cx * s); oy = round(ground - feet * s)
            cell = Image.new('RGBA', (FW, FH), (0, 0, 0, 0)); cell.alpha_composite(big, (ox, oy)) if ox >= 0 and oy >= 0 else cell.paste(big, (ox, oy), big)
            sheet.alpha_composite(cell, (k * FW, row * FH))
            dy = round(chin * s + oy - h0[2])        # the neck where this frame's body has it (the walk's bob)
            heads.append([h0[0], h0[1] + dy, h0[2] + dy, h0[3]] + [v + (dy if j % 2 else 0) for j, v in enumerate(h0[4:])])
            spots.append([spot0[0], spot0[1] + dy])
            feet_px.append(FH - ground)
        layout[d][anim] = [row, n, feet_px, heads, spots]
out = os.path.join(ROOT, 'src', 'art', name)
sheet.save(out + '.png')
json.dump({'fw': FW, 'fh': FH, 'body': STD['body'], 'foot': FH - (STD['anims']['down']['idle'][3][0][2] + LEGS), 'hair': STD['hair'], 'bald': True, 'anims': layout}, open(out + '.json', 'w'))
print('wrote', out + '.png', sheet.size)
