"""PixelLab helper, run inside GitHub Actions.

probe: saves the API schema + account balance so the generator can be written against the real API.
"""
import json, os, sys, requests

BASE = "https://api.pixellab.ai/v2"
task, out = sys.argv[1], sys.argv[2]
key = os.environ.get("PIXELLAB_API_KEY", "")
H = {"Authorization": f"Bearer {key}"} if key else {}

if task == "probe":
    r = requests.get(f"{BASE}/openapi.json", timeout=60)
    open(f"{out}/openapi.json", "w").write(r.text)
    print("openapi", r.status_code, len(r.text))
    if key:
        b = requests.get(f"{BASE}/balance", headers=H, timeout=60)
        print("balance", b.status_code, b.text[:300])
    else:
        print("no PIXELLAB_API_KEY secret set yet")
