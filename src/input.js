// Touch: left 45% of the screen = floating joystick, right side = drag to rotate camera,
// two fingers = pinch zoom. Desktop: WASD/arrows, Q/E rotate, mouse wheel zoom.

const JOY_R = 55;

export class Input {
  constructor(joyEl, knobEl) {
    this.joyEl = joyEl;
    this.knobEl = knobEl;
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.cam = new Map();
    this.yawDelta = 0;
    this.zoomDelta = 0;
    this.keys = new Set();
    this.lastPinch = 0;
    this.enabled = false;
    this.resetJoy();

    const opts = { passive: false };
    window.addEventListener('pointerdown', (e) => this.down(e), opts);
    window.addEventListener('pointermove', (e) => this.moveEvt(e), opts);
    window.addEventListener('pointerup', (e) => this.up(e), opts);
    window.addEventListener('pointercancel', (e) => this.up(e), opts);
    window.addEventListener('keydown', (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.releaseJoy(); this.cam.clear(); });
    window.addEventListener('wheel', (e) => { this.zoomDelta += e.deltaY * 0.01; }, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  resetJoy() {
    // resting position, bottom-left
    const x = 96, y = window.innerHeight - 96;
    this.placeJoy(x, y);
    this.joyEl.classList.remove('active');
  }

  placeJoy(x, y) {
    this.joyEl.style.transform = `translate(${x - 60}px, ${y - 60}px)`;
    this.knobEl.style.transform = 'translate(0px, 0px)';
  }

  down(e) {
    if (!this.enabled) return;
    e.preventDefault();
    const left = e.clientX < window.innerWidth * 0.45;
    if (left && this.joy.id === null) {
      this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: 0, y: 0 };
      this.placeJoy(e.clientX, e.clientY);
      this.joyEl.classList.add('active');
    } else {
      this.cam.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.cam.size === 2) this.lastPinch = this.pinchDist();
    }
  }

  moveEvt(e) {
    if (e.pointerId === this.joy.id) {
      e.preventDefault();
      let dx = e.clientX - this.joy.ox, dy = e.clientY - this.joy.oy;
      const d = Math.hypot(dx, dy);
      if (d > JOY_R) { dx = (dx / d) * JOY_R; dy = (dy / d) * JOY_R; }
      this.joy.x = dx / JOY_R;
      this.joy.y = dy / JOY_R;
      this.knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      return;
    }
    const p = this.cam.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    if (this.cam.size === 1) this.yawDelta -= (e.clientX - p.x) * 0.008;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this.cam.size === 2) {
      const d = this.pinchDist();
      this.zoomDelta -= (d - this.lastPinch) * 0.04;
      this.lastPinch = d;
    }
  }

  up(e) {
    if (e.pointerId === this.joy.id) this.releaseJoy();
    this.cam.delete(e.pointerId);
  }

  releaseJoy() {
    this.joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.resetJoy();
  }

  pinchDist() {
    const [a, b] = [...this.cam.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  // Returns screen-relative movement: x = right, y = down (screen), magnitude 0..1
  getMove() {
    let x = this.joy.x, y = this.joy.y;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup')) y -= 1;
    if (k.has('s') || k.has('arrowdown')) y += 1;
    const m = Math.hypot(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y };
  }

  consumeCamera(dt) {
    if (this.keys.has('q')) this.yawDelta += 1.6 * dt;
    if (this.keys.has('e')) this.yawDelta -= 1.6 * dt;
    const out = { yaw: this.yawDelta, zoom: this.zoomDelta };
    this.yawDelta = 0;
    this.zoomDelta = 0;
    return out;
  }
}
