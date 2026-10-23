"""PixelLab headgear: each piece as an 8-direction object in the player's own style and pixel size.

The style reference is a crop of the player's head (south view), so the output canvas matches the
sprites' pixel density and the art matches their shading. The game pins the result to each frame's
head (see src/headgear.js), so one piece fits every job's sprite.

  python3 build-tools/pixellab-headgear.py art/pixellab/headgear horned_helm   (needs PIXELLAB_API_KEY)

Results: <out>/<id>/<direction>.png for the eight directions, plus the layout and object info.
"""
import base64, io, json, os, sys, time, zipfile
import requests
from PIL import Image

BASE = "https://api.pixellab.ai/v2"
H = {"Authorization": f"Bearer {os.environ.get('PIXELLAB_API_KEY', '')}", "Content-Type": "application/json"}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
STYLE = os.path.join(ROOT, "art", "pixellab", "player", "Idle", "rotations", "south.png")
SIZE = 48  # canvas: a little wider than a head

# what to make: just the piece, nobody wearing it
PIECES = {
    "horned_helm": "an iron viking-style helmet with a brass rim and two curved ivory horns, item only, nobody wearing it",
    "woven_cap": "a small rounded cap woven from green leaves with a tan cloth band, item only, nobody wearing it",
    "flower_wreath": "a thin ring wreath of green leaves with small pink, white and yellow flowers, item only",
    "ember_crown": "a dark iron crown with three points, glowing orange ember gems and two small curved horns, item only",
    "round_glasses": "a pair of small round wire-rimmed glasses with pale blue lenses, item only",
    "eyepatch": "a black leather eyepatch on a thin black strap, item only",
}


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def style_crop():
    """The player's head, cut to SIZE x SIZE: the reference for style and pixel size."""
    im = Image.open(STYLE).convert("RGBA")
    b = im.getbbox()
    cx = (b[0] + b[2]) // 2
    box = (cx - SIZE // 2, b[1], cx + SIZE // 2, b[1] + SIZE)
    buf = io.BytesIO()
    im.crop(box).save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode()


def post(path, body):
    for _ in range(120):
        r = requests.post(BASE + path, headers=H, json=body, timeout=120)
        log("POST", path, r.status_code, r.text[:300])
        if r.status_code != 429:
            break
        time.sleep(30)
    r.raise_for_status()
    return r.json()


def wait(oid, limit=1500):
    t0 = time.time()
    while time.time() - t0 < limit:
        r = requests.get(f"{BASE}/objects/{oid}", headers=H, timeout=60)
        if r.ok:
            j = r.json()
            st = j.get("status") or j.get("object", {}).get("status")
            if st in ("completed", "failed"):
                log(oid, st, int(time.time() - t0), "s")
                return j
        time.sleep(15)
    log(oid, "timed out")
    return None


def save(oid, dest):
    """Download the object's spritesheet (row 0 = its rotations) and cut it into one PNG per direction."""
    os.makedirs(dest, exist_ok=True)
    r = requests.get(f"{BASE}/objects/{oid}/spritesheet", headers=H, timeout=120)
    r.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(r.content)) as z:
        names = z.namelist()
        layout = json.loads(z.read(next(n for n in names if n.endswith(".json"))))
        sheet = Image.open(io.BytesIO(z.read(next(n for n in names if n.endswith(".png"))))).convert("RGBA")
    json.dump(layout, open(os.path.join(dest, "layout.json"), "w"), indent=1)
    ss = layout["spritesheet"]
    cw, ch = ss["cell_size"]["width"], ss["cell_size"]["height"]
    rot = next(r for r in ss["rows"] if r.get("type") == "rotations")
    dirs = rot.get("directions") or DIR_ORDER
    for i, d in enumerate(dirs):
        sheet.crop((i * cw, 0, (i + 1) * cw, ch)).save(os.path.join(dest, f"{d}.png"))
        log("saved", dest, d)


DIR_ORDER = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]


if __name__ == "__main__":
    out, only = sys.argv[1], sys.argv[2:]
    ref = {"type": "base64", "format": "png", "base64": style_crop()}
    for pid, desc in PIECES.items():
        if only and pid not in only:
            continue
        res = post("/create-8-direction-object", {"description": desc, "view": "low top-down", "style_image": ref})
        oid = res.get("object_id")
        j = wait(oid)
        if j:
            json.dump(j, open(os.path.join(out, pid + ".json"), "w"), indent=1)
            save(oid, os.path.join(out, pid))
