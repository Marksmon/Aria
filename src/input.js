// Ragnarok-style controls: tap (or click) the world to walk, attack, pick up or talk.
// Touch: drag one finger to rotate the camera, pinch to zoom. Desktop: click, drag or Q/E to
// rotate, mouse wheel to zoom. Keys: K / Shift dodge roll; windows like Ragnarok: Alt+E (or I / B)
// items, Alt+Q equipment, Alt+S skills, Alt+A status, Esc closes them.

const TAP_MOVE = 12;   // px a press may wander and still count as a tap
const TAP_TIME = 450;  // ms

export class Input {
  constructor() {
    this.ptrs = new Map(); // pointerId -> { x, y, sx, sy, t, drag }
    this.yawDelta = 0;
    this.zoomDelta = 0;
    this.keys = new Set();
    this.lastPinch = 0;
    this.enabled = false;
    this.taps = new Set();   // one-shot presses: dodge, windows (items, equip, skills, status, close)
    this.clicks = [];        // world taps: { x, y } in CSS pixels

    const opts = { passive: false };
    window.addEventListener('pointerdown', (e) => this.down(e), opts);
    window.addEventListener('pointermove', (e) => this.moveEvt(e), opts);
    window.addEventListener('pointerup', (e) => this.up(e), opts);
    window.addEventListener('pointercancel', (e) => this.ptrs.delete(e.pointerId), opts);
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!e.repeat) {
        if (k === 'k' || k === 'shift') this.taps.add('dodge');
        const win = e.altKey ? { e: 'items', q: 'equip', s: 'skills', a: 'status' }[k] : { i: 'items', b: 'items', escape: 'close' }[k];
        if (win) { e.preventDefault(); this.taps.add(win); }
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.ptrs.clear(); });
    window.addEventListener('wheel', (e) => { this.zoomDelta += e.deltaY * 0.01; }, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('dragstart', (e) => e.preventDefault()); // icons are dragged by hand
  }

  down(e) {
    if (!this.enabled) return;
    const btn = e.target.closest?.('[data-btn]');
    if (btn) {
      e.preventDefault();
      this.taps.add(btn.dataset.btn);
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);
      return;
    }
    if (e.target.closest?.('.panel, .ui-click')) return; // menus handle their own taps
    e.preventDefault();
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), drag: false });
    if (this.ptrs.size === 2) {
      this.lastPinch = this.pinchDist();
      for (const p of this.ptrs.values()) p.drag = true; // a pinch is never a tap
    }
  }

  moveEvt(e) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    e.preventDefault();
    if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > TAP_MOVE) p.drag = true;
    if (this.ptrs.size === 1 && p.drag) this.yawDelta -= (e.clientX - p.x) * 0.008;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this.ptrs.size === 2) {
      const d = this.pinchDist();
      this.zoomDelta -= (d - this.lastPinch) * 0.04;
      this.lastPinch = d;
    }
  }

  up(e) {
    const p = this.ptrs.get(e.pointerId);
    if (!p) return;
    this.ptrs.delete(e.pointerId);
    if (!p.drag && performance.now() - p.t < TAP_TIME && this.ptrs.size === 0) this.clicks.push({ x: e.clientX, y: e.clientY });
  }

  pinchDist() {
    const [a, b] = [...this.ptrs.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  // true once per press (bag button or key)
  tapped(name) {
    const hit = this.taps.has(name);
    this.taps.delete(name);
    return hit;
  }

  // world taps since the last call
  takeClicks() {
    const c = this.clicks;
    this.clicks = [];
    return c;
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
