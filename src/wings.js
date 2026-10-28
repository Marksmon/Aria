// The Wings slot, drawn: wings spread behind the hero (in front of them when they turn away), or a
// light floating at their shoulder (the Lantern, a Wisp) that bobs, trails a little behind as they
// walk, and glows. The look comes from the item (items.js look: { kind: 'wings' | 'float', art, ... }).
import * as THREE from 'three';
import { ITEMS } from './items.js';
import { paintWisp, paintLantern, paintWings, paintWingsView, wingBox, WING_FRAMES, WING_VIEWS, WING_DIRS } from './wingart.js';

const tex = (c, smooth) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (!smooth) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; }
  return t;
};
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// a pair of wings, each art its own shape (wingart.js), on a canvas twice the painter's box; wings
// drawn for each direction (WING_VIEWS) get their frames for each: { dir: [frames] }
// (WING_PAD: room round the box, as a turned pair reaches past it; WING_GROW: how much bigger than the
// box the picture is, so the sprite grows by as much and the wings keep their size)
export const WING_PAD = 16;
const WING_GROW = (art) => { const [w, h] = wingBox(art); return [(w + 2 * WING_PAD) / w, (h + 2 * WING_PAD) / h]; };
function wingsFrames(art, dir) {
  const [w, h] = wingBox(art);
  return Array.from({ length: WING_FRAMES[art] || 1 }, (_, f) => {
    const [c, g] = canvas((w + 2 * WING_PAD) * 2, (h + 2 * WING_PAD) * 2);
    g.scale(2, 2);
    g.translate(WING_PAD, WING_PAD);
    if (dir) paintWingsView(g, art, dir, f); else paintWings(g, art, f);
    return tex(c, true);
  });
}
const wingViews = (art) => Object.fromEntries(WING_DIRS.map((d) => [d, wingsFrames(art, d)]));
// how each kind sits and moves: its size and height on the back, and its motion (sway: a vine
// swaying; flutter: a butterfly's quick beat; flicker: flames dancing; flap: a slow wingbeat)
const WING_MOVE = {
  leaf: { w: 1.36, h: 0.8, y: 0.98, move: 'sway' },
  fairy: { w: 1.36, h: 0.8, y: 0.98, move: 'flutter' },
  ember: { w: 1.36, h: 0.8, y: 0.98, move: 'flicker' },
  angel: { w: 0.94, h: 1.05, y: 0.81, move: 'flap', speed: 1.6, amp: 0.05 }, // folded, tall on the back (a 78 x 114 box)
  devil: { w: 1.09, h: 0.915, y: 0.83, move: 'flap', speed: 1.7, amp: 0.12 }, // (as big as the Angel Wings: 0.0088 a pixel of its 124 x 104 box, the back at 62, 38 kept at 0.95)
};
// a still picture of the wings an item puts on the back, facing dir, and how they sit (WING_MOVE: their
// size and height in world units), for pictures of the hero (the title's preview); null for none
export function wingPicture(id, dir = 'down') {
  const look = ITEMS[id]?.look;
  if (look?.kind !== 'wings') return null;
  const tex = wingsFrames(look.art, WING_VIEWS[look.art] ? dir : undefined)[0];
  const M = WING_MOVE[look.art] || WING_MOVE.angel, [gx, gy] = WING_GROW(look.art);
  return { canvas: tex.image, M: { ...M, w: M.w * gx, h: M.h * gy }, views: !!WING_VIEWS[look.art] };
}
// the frames of a floating light (wingart.js): a Wisp's wings beating, a Lantern's flame flickering
const FRAMES = 6;
function floatFrames(look) {
  return Array.from({ length: FRAMES }, (_, i) => {
    const [c, g] = canvas(96, 96), k = 0.5 - 0.5 * Math.cos((i / FRAMES) * Math.PI * 2);
    g.scale(1.5, 1.5);
    if (look.art === 'lantern') paintLantern(g, 0.35 + 0.5 * k); else paintWisp(g, look, k);
    return tex(c, true);
  });
}
function haloTexture(glow) {
  const [c, g] = canvas(64, 64), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, glow); r.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.globalAlpha = 0.55; g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return tex(c, true);
}

export class Wings {
  constructor(scene) {
    this.scene = scene;
    this.id = null;
    const sprite = (order, extra = {}) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, ...extra }));
      s.renderOrder = order; s.visible = false; scene.add(s);
      return s;
    };
    // (the wings keep their depth, so a villager or monster standing behind the hero stays behind them)
    this.wing = sprite(1, { alphaTest: 0.3, depthWrite: true });
    this.halo = sprite(3, { blending: THREE.AdditiveBlending });
    this.orb = sprite(4);
    this.at = null; // where the floating light is (it follows with a lag)
    this.cache = {};
  }

  // what is worn in the Wings slot now (an item id, or null)
  set(id) {
    if (id === this.id) return;
    this.id = id;
    const look = ITEMS[id]?.look;
    this.wing.visible = this.halo.visible = this.orb.visible = false;
    this.at = null;
    if (!look) return;
    const key = `${id}`;
    if (look.kind === 'wings') {
      this.views = WING_VIEWS[look.art] ? (this.cache[key + ':views'] ||= wingViews(look.art)) : null;
      this.wingFrames = this.views ? this.views.down : (this.cache[key] ||= wingsFrames(look.art));
      this.wing.material.map = this.wingFrames[0];
      this.wing.material.needsUpdate = true;
      this.wing.visible = true;
    } else {
      this.frames = this.cache[key] ||= floatFrames(look);
      this.orb.material.map = this.frames[0];
      this.halo.material.map = this.cache[key + ':halo'] ||= haloTexture(look.glow);
      this.orb.material.needsUpdate = this.halo.material.needsUpdate = true;
      this.orb.visible = this.halo.visible = true;
      this.lantern = look.art === 'lantern';
    }
  }

  // follow the hero: p the Player, camera the scene camera, t the clock (s), dt the frame
  update(dt, p, camera, t, ground) {
    const show = p.state !== 'down' && p.sprite.visible;
    if (!this.id || !show) { this.wing.visible = this.halo.visible = this.orb.visible = false; return; }
    const look = ITEMS[this.id].look;
    const fwd = camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize(); // into the screen
    if (look.kind === 'wings') {
      // on the hero's back: behind them facing us, in front when they turn away (and sideways a bit smaller)
      const away = p.dir.startsWith('up'), side = p.dir === 'left' || p.dir === 'right';
      const M = WING_MOVE[look.art] || WING_MOVE.angel, k = (away ? -1 : 1) * 0.12;
      let sx = 1, sy = 1, bob = 0, rot = 0;
      if (M.move === 'sway') { sx = 0.97 + 0.03 * Math.sin(t * 1.5); rot = Math.sin(t * 1.1) * 0.04; bob = Math.sin(t * 1.5) * 0.015; }
      if (M.move === 'flutter') { sx = 0.72 + 0.28 * Math.abs(Math.sin(t * 13)); bob = Math.sin(t * 3) * 0.02; }
      if (M.move === 'flicker') { sy = 0.94 + 0.06 * Math.sin(t * 9) + 0.03 * Math.sin(t * 23); }
      if (M.move === 'flap') { sx = 1 - M.amp + M.amp * Math.sin(t * M.speed); bob = Math.sin(t * M.speed + 1) * 0.03; }
      if (this.views) this.wingFrames = this.views[p.dir] || this.views.down; // turned with the hero
      const f = this.wingFrames[Math.floor(t * 9) % this.wingFrames.length];
      if (this.wing.material.map !== f) { this.wing.material.map = f; this.wing.material.needsUpdate = true; }
      this.wing.material.rotation = rot;
      this.wing.position.set(p.x + fwd.x * k, ground + M.y + bob, p.z + fwd.z * k);
      const [gx, gy] = WING_GROW(look.art);
      this.wing.scale.set(M.w * gx * sx * (side && !this.views ? 0.7 : 1), M.h * gy * sy, 1);
      this.wing.renderOrder = away ? 5 : 1;
      this.wing.visible = true;
      return;
    }
    // a light at the shoulder: right of the hero as we see them, bobbing, trailing a little as they walk
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const want = new THREE.Vector3(p.x + right.x * 0.55 - fwd.x * 0.1, ground + 1.25 + Math.sin(t * 2.4) * 0.08, p.z + right.z * 0.55 - fwd.z * 0.1);
    if (!this.at) this.at = want.clone();
    this.at.lerp(want, Math.min(1, dt * 4));
    const pulse = 1 + Math.sin(t * 5) * 0.08;
    const size = this.lantern ? 0.62 : 0.56;
    // a Wisp's wings beat fast; a Lantern's flame flickers slower, and it sways on its ring
    const f = this.frames[Math.floor(t * (this.lantern ? 7 : 14)) % FRAMES];
    if (this.orb.material.map !== f) { this.orb.material.map = f; this.orb.material.needsUpdate = true; }
    this.orb.material.rotation = this.lantern ? Math.sin(t * 1.7) * 0.14 : 0;
    this.orb.position.copy(this.at);
    this.orb.scale.set(size, size, 1);
    this.halo.position.copy(this.at);
    this.halo.scale.set(0.9 * pulse, 0.9 * pulse, 1);
    this.orb.visible = this.halo.visible = true;
  }
}
