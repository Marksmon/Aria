"""PixelLab sprite generator. Runs inside GitHub Actions (GitHub's servers can reach the API).

  probe             save the API schema + account balance
  generate [names]  create the characters (default: all) with their animations, then download
                    each character's zip into <out>/<name>/
  finish names      for characters already downloaded into <out>/<name>/, request whichever
                    animations or directions are missing, then download again

PixelLab Tier 1 runs at most 9 jobs at once; requests that hit the limit wait and retry, and an
animation request may only accept some directions, so the rest are asked for once slots free up.

  python3 build-tools/pixellab.py generate art/pixellab player   (needs PIXELLAB_API_KEY)

Characters are made in PixelLab's Pro mode from a style reference image (see STYLE below).

Results are committed to the `art` branch by the workflow.
"""
import base64, io, json, os, re, sys, time, zipfile
import requests

BASE = "https://api.pixellab.ai/v2"
task, out, only = sys.argv[1], sys.argv[2], sys.argv[3:]
key = os.environ.get("PIXELLAB_API_KEY", "")
H = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
DIRS = ["south", "east", "north", "west"]

# Every character uses PixelLab's Pro mode with a style reference image. The player was made
# from a Ragnarok Online sprite (path in PIXELLAB_STYLE_REF, not kept in the repo); everything
# else uses the player's own south view, so the whole cast shares one style.
STYLE = ("Ragnarok Online sprite style: soft dark coloured outlines instead of black, muted warm "
         "palette, detailed soft shading, chibi proportions about three heads tall")
PLAYER_REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "art", "pixellab", "player",
                          "Idle", "rotations", "south.png")


def pro(name, desc, anims=(), size=(64, 64), template="mannequin", ref=PLAYER_REF):
    return {
        "name": name,
        "endpoint": "/create-character-pro",
        "style_ref": ref,
        "body": {
            "description": desc,
            "style_description": STYLE,
            "method": "create_with_style",
            "image_size": {"width": size[0], "height": size[1]},
            "view": "low top-down",
            "template_id": template,
            "no_background": True,
        },
        "animations": [{"animation_name": n, "action_description": d, "frame_count": 6} for n, d in anims],
    }


HOP = [("hop", "bouncing hop in place, squashing and stretching"), ("attack", "lunging forward to bump attack")]
CHARACTERS = [
    pro("player", "young novice swordsman with spiky orange-brown hair, blue tunic with a brown belt, "
        "red scarf, brown boots, short sword",
        [("walk", "walking"), ("attack", "quick forward sword slash attack"),
         ("dodge", "quick dodge roll forward, tucking into a somersault and landing on his feet")],
        size=(64, 96), ref=None),
    pro("slime", "round moss-green jelly slime blob with a tiny two-leaf sprout on top, no arms, no legs, "
        "big shiny eyes, rosy cheeks", HOP),
    pro("blueslime", "round translucent blue jelly slime blob shaped like a water drop, no arms, no legs, "
        "big shiny eyes, small happy mouth", HOP),
    pro("sprout", "tiny onion-bulb plant creature with two green leaves sprouting from its head, short stubby "
        "legs, shy round eyes", [("walk", "waddling walk"), ("attack", "angry headbutt forward")]),
    pro("crab", "small pink mud crab with big pincers, stalk eyes and a muddy round shell",
        [("walk", "scuttling walk"), ("attack", "snapping its pincers forward")], template="cat"),
    pro("mushling", "small mushroom creature with a big purple spotted cap, pale stem body, tiny feet, sleepy "
        "eyes", [("walk", "waddling walk"), ("attack", "shaking its cap and puffing a cloud of spores")]),
    pro("beetle", "chunky beetle with a grey pebble stone shell, ochre legs and a small horn",
        [("walk", "crawling walk"), ("attack", "ramming forward with its horn")], template="dog"),
    pro("wisp", "glowing yellow firefly wisp spirit, small round glowing body with tiny translucent wings, "
        "no arms, no legs", [("walk", "hovering and fluttering in place"), ("attack", "darting forward")]),
    # villagers stand still: no animations
    pro("bram", "kind old village elder with a long white beard, bald head with white tufts, purple robe with "
        "gold trim, wooden staff topped with a blue crystal", size=(64, 96)),
    pro("tilly", "cheerful village cook woman with brown hair in a bun, red headscarf, red dress with a white "
        "apron, holding a wooden ladle", size=(64, 96)),
    pro("wren", "young scout girl with short dark hair under a green hood with a red feather, green tunic, "
        "leather satchel strap, bow on her back", size=(64, 96)),
]


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def post(path, body, tries=120):
    for _ in range(tries):
        r = requests.post(BASE + path, headers=H, json=body, timeout=120)
        log("POST", path, r.status_code, r.text[:600])
        if r.status_code != 429:  # 429 = all job slots busy
            break
        time.sleep(30)
    r.raise_for_status()
    return r.json()


def get(path):
    r = requests.get(BASE + path, headers=H, timeout=120)
    return r


def wait_job(job_id, label, limit=1500):
    t0 = time.time()
    while time.time() - t0 < limit:
        r = get(f"/background-jobs/{job_id}")
        if r.ok:
            j = r.json()
            st = j.get("status")
            if st == "completed":
                log(label, "completed in", int(time.time() - t0), "s")
                return j
            if st == "failed":
                log(label, "FAILED", json.dumps(j.get("last_response"))[:800])
                return None
        else:
            log(label, "poll", r.status_code, r.text[:200])
        time.sleep(10)
    log(label, "timed out")
    return None


def download_zip(cid, dest, limit=900):
    t0 = time.time()
    while time.time() - t0 < limit:
        r = requests.get(f"{BASE}/characters/{cid}/zip", headers=H, timeout=180)
        if r.status_code == 200:
            os.makedirs(dest, exist_ok=True)
            with zipfile.ZipFile(io.BytesIO(r.content)) as z:
                z.extractall(dest)
                log("zip", dest, len(z.namelist()), "files")
            return True
        log("zip", r.status_code, r.text[:200])
        time.sleep(15)
    return False


if task == "probe":
    r = requests.get(f"{BASE}/openapi.json", timeout=60)
    open(f"{out}/openapi.json", "w").write(r.text)
    log("openapi", r.status_code, len(r.text))
    if key:
        b = get("/balance")
        log("balance", b.status_code, b.text[:300])
    else:
        log("no PIXELLAB_API_KEY secret set yet")
    sys.exit(0)

def animate(name, cid, anims, have=None):
    """Request each animation in every direction not in have[anim]; wait for all of them."""
    have = have or {}
    pending = []
    for a in anims:
        todo = [d for d in DIRS if d not in have.get(a["animation_name"], ())]
        while todo:
            try:
                r = post("/characters/animations", {"character_id": cid, "mode": "v3", "directions": todo, **a})
            except Exception as e:  # keep going with whatever works
                log(name, a["animation_name"], "animation request failed:", e)
                break
            pending += [(a["animation_name"], j) for j in r.get("background_job_ids", [])]
            todo = [d for d in todo if d not in r.get("directions", todo)]
            if todo and pending:  # only some directions fit: free a slot first
                anim, j = pending.pop(0)
                wait_job(j, f"{name} {anim}")
    for anim, j in pending:
        wait_job(j, f"{name} {anim}")


if task == "finish":
    for name in only:
        ch = next(c for c in CHARACTERS if c["name"] == name)
        base = f"{out}/{name}"
        meta = json.load(open(f"{base}/metadata.json"))["states"][0]
        have = {}  # directions requested separately come back as e.g. 'walk-b730b657'
        for a, dirs in meta["frames"].get("animations", {}).items():
            have.setdefault(re.sub(r"-[0-9a-f]{8}$", "", a), set()).update(dirs)
        log(name, "has", {a: sorted(d) for a, d in have.items()})
        animate(name, meta["character"]["id"], ch["animations"], have)
        download_zip(meta["character"]["id"], base)
    sys.exit(0)

if task == "generate":
    if not key:
        log("PIXELLAB_API_KEY secret is missing: add it under Settings > Secrets and variables > Actions")
        sys.exit(1)
    b = get("/balance")
    log("balance before", b.status_code, b.text[:300])
    manifest = {}
    for ch in CHARACTERS:
        name = ch["name"]
        if only and name not in only:
            continue
        try:
            body = dict(ch["body"])
            if "style_ref" in ch:
                ref = ch["style_ref"] or os.environ.get("PIXELLAB_STYLE_REF")
                if not ref:
                    log(name, "needs PIXELLAB_STYLE_REF")
                    continue
                body["reference_image"] = {"type": "base64", "format": "png",
                                           "base64": base64.b64encode(open(ref, "rb").read()).decode()}
            res = post(ch["endpoint"], body)
            cid = res["character_id"]
            job = res.get("background_job_id")
            manifest[name] = {"character_id": cid}
            if job and not wait_job(job, f"{name} create"):
                continue
            animate(name, cid, ch["animations"])
            download_zip(cid, f"{out}/{name}")
        except Exception as e:
            log(name, "error:", e)
    json.dump(manifest, open(f"{out}/manifest.json", "w"), indent=2)
    b = get("/balance")
    log("balance after", b.status_code, b.text[:300])
