// The Wings slot, drawn: wings spread behind the hero (in front of them when they turn away), or a
// light floating at their shoulder (the Lantern, a Wisp) that bobs, trails a little behind as they
// walk, and glows. The look comes from the item (items.js look: { kind: 'wings' | 'float', art, ... }).
import * as THREE from 'three';
import { ITEMS } from './items.js';
import { paintWisp, paintLantern } from './wingart.js';

const tex = (c, smooth) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (!smooth) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; }
  return t;
};
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

// a pair of wings on a 96 x 56 canvas, spread from the middle (the hero's back)
const WINGS = {
  leaf: { fill: '#6fbf4a', edge: '#2f5a22', vein: '#3f7a2a', hi: '#9cdc76' },
  fairy: { fill: 'rgba(170, 235, 255, .62)', edge: '#5aa8d8', vein: 'rgba(255, 255, 255, .8)', hi: 'rgba(255, 255, 255, .5)' },
  ember: { fill: '#ff7a2a', edge: '#8a2414', vein: '#ffe27a', hi: '#ffd060' },
};
function wingsTexture(art) {
  const P = WINGS[art] || WINGS.leaf, [c, g] = canvas(96, 56);
  for (const s of [-1, 1]) {
    g.save(); g.translate(48, 30); g.scale(s, 1);
    // the upper wing, sweeping up and out, then the smaller lower one
    g.beginPath(); g.moveTo(2, -2); g.bezierCurveTo(10, -26, 34, -30, 44, -20); g.bezierCurveTo(46, -10, 34, -2, 24, 0); g.bezierCurveTo(30, 8, 30, 20, 18, 24); g.bezierCurveTo(8, 22, 4, 10, 2, 2); g.closePath();
    g.fillStyle = P.fill; g.fill(); g.lineWidth = 2; g.strokeStyle = P.edge; g.stroke();
    g.beginPath(); g.moveTo(4, -2); g.quadraticCurveTo(20, -18, 40, -19); g.moveTo(4, 0); g.quadraticCurveTo(18, -6, 30, -6); g.moveTo(4, 3); g.quadraticCurveTo(14, 12, 18, 20);
    g.lineWidth = 1.2; g.strokeStyle = P.vein; g.stroke();
    g.beginPath(); g.moveTo(12, -14); g.quadraticCurveTo(24, -24, 36, -22); g.lineWidth = 2; g.strokeStyle = P.hi; g.stroke();
    g.restore();
  }
  return tex(c);
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
    this.wing = sprite(1, { alphaTest: 0.05 });
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
      this.wing.material.map = this.cache[key] ||= wingsTexture(look.art);
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
      const k = (away ? -1 : 1) * 0.12, flap = 0.88 + 0.12 * Math.sin(t * 3.2);
      this.wing.position.set(p.x + fwd.x * k, ground + 0.98 + Math.sin(t * 3.2 + 1) * 0.02, p.z + fwd.z * k);
      this.wing.scale.set(1.36 * flap * (side ? 0.7 : 1), 0.8, 1);
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
