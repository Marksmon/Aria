"""PixelLab sprite generator. Runs inside GitHub Actions (GitHub's servers can reach the API).

  probe             save the API schema + account balance
  generate [names]  create the characters (default: all) with their animations, then download
                    each character's zip into <out>/<name>/

  python3 build-tools/pixellab.py generate art/pixellab player   (needs PIXELLAB_API_KEY)

Results are committed to the `art` branch by the workflow.
"""
import io, json, os, sys, time, zipfile
import requests

BASE = "https://api.pixellab.ai/v2"
task, out, only = sys.argv[1], sys.argv[2], sys.argv[3:]
key = os.environ.get("PIXELLAB_API_KEY", "")
H = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
DIRS = ["south", "east", "north", "west"]

STYLE = "cute chibi fantasy RPG sprite in the style of classic 2000s MMORPGs, soft shading"
# Ragnarok Online look: big head, small body, bold dark outline, soft cel shading
RO_STYLE = ("Ragnarok Online style 2D sprite, chibi with a big head and large anime eyes, small body, "
            "bold dark brown outline around the whole figure, soft painterly cel shading, warm colors")

CHARACTERS = [
    {
        "name": "player",
        "endpoint": "/create-character-with-4-directions",
        "body": {
            "description": "young novice swordsman with spiky orange-brown hair, blue tunic with a brown belt, "
                           "red scarf, brown boots, short sword. " + RO_STYLE,
            "image_size": {"width": 64, "height": 64},
            "view": "low top-down",
            "proportions": {"type": "custom", "head_size": 1.5, "arms_length": 0.9, "legs_length": 0.8,
                            "shoulder_width": 0.9, "hip_width": 0.9},
            "outline": "single color black outline",
            "shading": "medium shading",
            "detail": "medium detail",
        },
        "animations": [
            {"animation_name": "walk", "action_description": "walking", "frame_count": 6},
            {"animation_name": "attack", "action_description": "quick forward sword slash attack", "frame_count": 6},
        ],
    },
    {
        "name": "slime",
        "endpoint": "/create-character-v3",
        "body": {
            "description": "small round moss-green slime blob monster with a tiny two-leaf sprout on top, "
                           "big shiny eyes, rosy cheeks, " + STYLE,
            "image_size": {"width": 64, "height": 64},
            "view": "low top-down",
            "outline": "single color black outline",
            "detail": "medium detail",
        },
        "animations": [
            {"animation_name": "hop", "action_description": "bouncing hop in place, squashing and stretching", "frame_count": 6},
            {"animation_name": "attack", "action_description": "lunging forward to bump attack", "frame_count": 6},
        ],
    },
]


# Ragnarok Online style monsters. template_id picks the skeleton used to animate them:
# mannequin for two-legged or legless ones, a quadruped for crawlers.
RO_MOB = ("Ragnarok Online style monster sprite, cute and chubby, bold dark brown outline, "
          "soft painterly cel shading")


def mob(name, desc, template, anims):
    return {
        "name": name,
        "endpoint": "/create-character-v3",
        "body": {
            "description": desc + ". " + RO_MOB,
            "image_size": {"width": 64, "height": 64},
            "view": "low top-down",
            "template_id": template,
            "outline": "single color black outline",
            "detail": "medium detail",
        },
        "animations": [{"animation_name": n, "action_description": d, "frame_count": 6} for n, d in anims],
    }


CHARACTERS += [
    mob("blueslime", "round translucent blue jelly slime blob shaped like a water drop, no arms, no legs, "
        "big shiny eyes, small happy mouth", "mannequin",
        [("hop", "bouncing hop in place, squashing and stretching"), ("attack", "lunging forward to bump attack")]),
    mob("sprout", "tiny onion-bulb plant creature with two green leaves sprouting from its head, short stubby legs, "
        "shy round eyes", "mannequin",
        [("walk", "waddling walk"), ("attack", "angry headbutt forward")]),
    mob("crab", "small pink mud crab with big pincers, stalk eyes and a muddy round shell", "cat",
        [("walk", "scuttling walk"), ("attack", "snapping its pincers forward")]),
    mob("mushling", "small mushroom creature with a big purple spotted cap, pale stem body, tiny feet, sleepy eyes",
        "mannequin",
        [("walk", "waddling walk"), ("attack", "shaking its cap and puffing a cloud of spores")]),
    mob("beetle", "chunky beetle with a grey pebble stone shell, ochre legs and a small horn", "dog",
        [("walk", "crawling walk"), ("attack", "ramming forward with its horn")]),
    mob("wisp", "glowing yellow firefly wisp spirit, small round glowing body with tiny translucent wings, "
        "no arms, no legs", "mannequin",
        [("walk", "hovering and fluttering in place"), ("attack", "darting forward")]),
]


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def post(path, body):
    r = requests.post(BASE + path, headers=H, json=body, timeout=120)
    log("POST", path, r.status_code, r.text[:600])
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
            res = post(ch["endpoint"], ch["body"])
            cid = res["character_id"]
            job = res.get("background_job_id")
            manifest[name] = {"character_id": cid}
            if job and not wait_job(job, f"{name} create"):
                continue
            # animations: one request each, all 4 directions
            jobs = []
            for a in ch["animations"]:
                body = {"character_id": cid, "mode": "v3", "directions": DIRS, **a}
                try:
                    r = post("/characters/animations", body)
                    jobs += [(a["animation_name"], j) for j in r.get("background_job_ids", [])]
                except Exception as e:  # keep going with whatever works
                    log(name, a["animation_name"], "animation request failed:", e)
            for anim, j in jobs:
                wait_job(j, f"{name} {anim}")
            download_zip(cid, f"{out}/{name}")
        except Exception as e:
            log(name, "error:", e)
    json.dump(manifest, open(f"{out}/manifest.json", "w"), indent=2)
    b = get("/balance")
    log("balance after", b.status_code, b.text[:300])
