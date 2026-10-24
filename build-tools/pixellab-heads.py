"""PixelLab heads, Ragnarok style: one bald base head with the standard face (eyes only, no mouth),
as an 8-direction object, then hairstyles as states of it (the same head with hair). The packer
takes the difference between a hairstyle and the bald head as that hairstyle's hair layer, so
every hair lines up with the face exactly.

  python3 build-tools/pixellab-heads.py base                 (needs PIXELLAB_API_KEY)
  python3 build-tools/pixellab-heads.py hair spiky long ...  (states of the base head)

Results go to art/pixellab/heads/<name>/<direction>.png.
"""
import base64, importlib.util, io, json, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('hg', os.path.join(HERE, 'pixellab-headgear.py'))
hg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hg)
OUT = os.path.join(HERE, '..', 'art', 'pixellab', 'heads')

# the standard face, the same on every head (and every character, in time)
BASE = ("a chibi character's head only, completely bald with a smooth round scalp, pale peach skin, "
        "two large dark brown eyes with white highlights and small thin eyebrows, no mouth, no nose, "
        "small ears, soft dark outline, Ragnarok Online sprite style, no neck, no body, no hat")
# hairstyles: what each state adds to the bald head (all in one mid brown, dyed in the game)
HAIR = {
    'messy': 'give the same head short messy medium-brown hair with a few spiky tufts and a fringe over the forehead; keep the face, eyes and head shape exactly the same',
    'spiky': 'give the same head bold upswept spiky medium-brown hair like an anime hero; keep the face, eyes and head shape exactly the same',
    'long': 'give the same head long straight medium-brown hair falling past the shoulders with a straight fringe; keep the face, eyes and head shape exactly the same',
    'ponytail': 'give the same head medium-brown hair tied in a high ponytail with side bangs; keep the face, eyes and head shape exactly the same',
    # a man's long hair: rugged, layered, to the shoulders (the straight 'long' is kept for a female look later)
    'mane': 'give the same head rugged shoulder-length layered medium-brown hair swept back from the forehead with a few loose strands, a masculine warrior style; keep the face, eyes and head shape exactly the same',
}


def head_crop():
    """the Trainee's head, the style and pixel-size reference"""
    im = Image.open(os.path.join(HERE, '..', 'art', 'pixellab', 'novice', 'Idle', 'rotations', 'south.png')).convert('RGBA')
    b = im.getbbox()
    cx = (b[0] + b[2]) // 2
    buf = io.BytesIO()
    im.crop((cx - 24, b[1], cx + 24, b[1] + 48)).save(buf, 'PNG')
    return base64.b64encode(buf.getvalue()).decode()


def save_obj(name, j):
    os.makedirs(OUT, exist_ok=True)
    json.dump(j, open(os.path.join(OUT, name + '.json'), 'w'), indent=1)
    hg.save(j.get('id') or j.get('object', {}).get('id'), os.path.join(OUT, name))


if __name__ == '__main__':
    task, names = sys.argv[1], sys.argv[2:]
    hg.log('balance', hg.requests.get(hg.BASE + '/balance', headers=hg.H, timeout=60).text[:200])
    if task == 'base':
        res = hg.post('/create-8-direction-object', {'description': BASE, 'view': 'low top-down',  # 48 px, from the style crop
                                                     'style_image': {'type': 'base64', 'format': 'png', 'base64': head_crop()}})
        j = hg.wait(res['object_id'], limit=3600)
        if j and j.get('status') == 'completed':
            save_obj('bald', j)
    if task == 'hair':
        base = json.load(open(os.path.join(OUT, 'bald.json')))
        bid = base.get('id') or base.get('object', {}).get('id')
        queued = {}
        for n in names:
            res = hg.post(f'/objects/{bid}/states', {'edit_description': HAIR[n], 'state_name': n})
            queued[n] = res.get('object_id')
        for n, oid in queued.items():
            j = hg.wait(oid, limit=3600)
            if j and j.get('status') == 'completed':
                save_obj(n, j)
    hg.log('balance', hg.requests.get(hg.BASE + '/balance', headers=hg.H, timeout=60).text[:200])
