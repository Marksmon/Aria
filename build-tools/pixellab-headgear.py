"""PixelLab helpers (post, wait, save) used by pixellab-heads.py, which makes the headgear now: as
states of the standard bald head (pixellab-heads.py gear), packed by pack-heads.py.

Run on its own, this makes the older kind of piece: an 8-direction object of the piece alone,
styled on the player's head.

  python3 build-tools/pixellab-headgear.py art/pixellab/headgear horned_helm   (needs PIXELLAB_API_KEY)
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
    # (an eyepatch came out as a strap ring across the face: a strap can't go behind the head in
    # one layer, so the face piece is a mask instead)
    "raven_mask": "a black feathered raven half-mask with a short dark beak and gold-rimmed eye holes, item only, nobody wearing it",
    # a crown shape sits on the sprites' heads well (an upright hoop didn't), so the Flame Circlet is
    # built on the Ember Crown's shape: a band whose points are flames
    "flame_circlet": "a crown band of dark blackened iron with glowing molten gold edges and small ember gems, its five points are tall living flames of orange, gold and white-hot yellow instead of metal, item only, nobody wearing it",
}
# pieces that also get a looping animation (8 directions)
ANIMS = {
    "flame_circlet": "only the flames move: they flicker, dance and lick upward in a seamless loop; the iron crown band stays perfectly still and does not turn or tilt",
}
# pieces shaped after an existing object (its id), instead of styled on the player's head
SHAPE = {"flame_circlet": "ember_crown"}


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


def wait_job(jid, limit=3600):
    t0 = time.time()
    while time.time() - t0 < limit:
        r = requests.get(f"{BASE}/background-jobs/{jid}", headers=H, timeout=60)
        if r.ok and r.json().get("status") in ("completed", "failed"):
            log(jid, r.json()["status"], int(time.time() - t0), "s")
            return
        time.sleep(15)


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
    for row in ss["rows"]:  # animation rows: one per direction, frames left to right
        if row.get("type") == "rotations" or not row.get("direction"):
            continue
        y = row["row"] * ch
        for f in range(row.get("frame_count", 0)):
            sheet.crop((f * cw, y, (f + 1) * cw, y + ch)).save(os.path.join(dest, f"{row['direction']}_{f}.png"))
        log("saved", dest, row["direction"], row.get("frame_count"), "frames")


DIR_ORDER = ["south", "south-east", "east", "north-east", "north", "north-west", "west", "south-west"]


if __name__ == "__main__":
    out, only = sys.argv[1], sys.argv[2:]
    ref = {"type": "base64", "format": "png", "base64": style_crop()}
    # queue every piece first, so they render side by side, then collect them
    queued = {}
    for pid, desc in PIECES.items():
        if only and pid not in only:
            continue
        body = {"description": desc, "view": "low top-down", "style_image": ref}
        if pid in SHAPE:  # the other piece's 8 views guide this one's shape and style
            other = json.load(open(os.path.join(out, SHAPE[pid] + ".json")))
            body = {"description": desc, "view": "low top-down", "style_object_id": other["id"], "size": 48}
        res = post("/create-8-direction-object", body)
        queued[pid] = res.get("object_id")
    for pid, oid in queued.items():
        j = wait(oid, limit=3600)
        if j and j.get("status") == "completed" and pid in ANIMS:
            res = post(f"/objects/{oid}/animations", {"animation_description": ANIMS[pid], "directions": DIR_ORDER, "frame_count": 8})
            jobs = res.get("background_job_ids") or [x.get("background_job_id") for x in res.get("submissions", [])]
            for jid in filter(None, jobs):
                wait_job(jid)
        if j and j.get("status") == "completed":
            os.makedirs(out, exist_ok=True)
            json.dump(j, open(os.path.join(out, pid + ".json"), "w"), indent=1)
            save(oid, os.path.join(out, pid))
