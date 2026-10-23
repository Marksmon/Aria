// Headgear you can see on the player, Ragnarok style: a separate layer drawn over the body
// sprite and pinned to the head of whatever frame is showing. The sprite packer records each
// frame's head (centre, crown, neck, width), so one set of headgear art fits every job's sprite
// without new sprites per job: it follows the head through walking, attacking and rolling and
// scales to the head's width.
//
// Pieces made with PixelLab (build-tools/pixellab-headgear.py, packed by pack-headgear.py into
// src/art/hg_<id>.png) come in all eight directions in the sprites' own style; a hat is sized a
// little wider than the head and sits down over the hair, glasses sit on the eye line. Pieces not
// made yet fall back to the small painted versions below (front, side and back views).
// slot: 'head' (on the crown) or 'face' (on the eyes; hidden when you face away).
import * as THREE from 'three';

const SHEETS = import.meta.glob('./art/hg_*.png', { eager: true, import: 'default' });
const LAYOUTS = import.meta.glob('./art/hg_*.json', { eager: true, import: 'default' });
// a piece's rim (see pack-headgear.py) is sized to `w` times the head's width and put on the line
// `at` of the way from crown to neck: a hat's brim just above the brows, glasses on the eyes.
// A piece can tune its own fit (see TUNE): w and at as above, dx / dy to nudge it (in head
// widths / head heights), and hair: hide the wearer's hair above that line (same scale as at),
// so spikes don't poke through a helmet. 0 leaves the hair alone. swap: { dir: other dir } shows
// another direction's art where PixelLab drew one badly. base: sit the piece on its bottom edge
// instead of its rim (a ring's widest row is its middle). sy: squash it vertically. dirs: { dir: { at, w, dx, dy } } tunes
// one direction on its own (left mirrors right, so give the facing's own direction).
const ANIM_FPS = 9;
const FIT = { head: { w: 0.86, at: 0.47, dx: 0, dy: 0, hair: 0 }, face: { w: 0.78, at: 0.82, dx: 0, dy: 0, hair: 0 } };
export const TUNE = {
  horned_helm: { hair: 0.44 },          // a full helm: the hair above the rim goes
  woven_cap: { hair: 0.4 },
  ember_crown: { at: 0.36, hair: 0.2, swap: { right: 'downright', left: 'downleft' } }, // sits on the hair; its side views are poor
  flower_wreath: { at: 0.33, w: 0.9, hair: 0 }, // rests on top of the hair
  // face pieces: their views come from the front (see pack-headgear.py); turning moves them toward
  // the front of the face
  round_glasses: { w: 0.62, at: 0.74 }, // on the eyes when the packer found them; this is the fallback
  raven_mask: { w: 0.78, at: 0.74 },
  // built on the Ember Crown's shape, so it sits the same way
  flame_circlet: { at: 0.36, hair: 0.2, swap: { right: 'downright', left: 'downleft' } },
};
const fitOf = (id) => ({ ...FIT[HEADGEAR[id].slot], ...TUNE[id] });

// a PixelLab piece: one texture per direction, cut from its sheet once the image loads
const images = {};
function imagePiece(id) {
  if (id in images) return images[id];
  const url = SHEETS[`./art/hg_${id}.png`], L = LAYOUTS[`./art/hg_${id}.json`];
  if (!url || !L) return (images[id] = null);
  // tex[dir] = one texture per animation frame (just one for a still piece)
  const piece = { L, tex: {}, loaded: false, img: new Image() };
  for (const [dir, cell] of Object.entries(L.dirs)) {
    piece.tex[dir] = Array.from({ length: cell[8] || 1 }, () => {
      const c = document.createElement('canvas');
      c.width = L.cw; c.height = L.ch;
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      return t;
    });
  }
  piece.img.onload = () => {
    for (const [dir, [i]] of Object.entries(L.dirs)) {
      piece.tex[dir].forEach((t, f) => {
        t.image.getContext('2d').drawImage(piece.img, i * L.cw, f * L.ch, L.cw, L.ch, 0, 0, L.cw, L.ch);
        t.needsUpdate = true;
      });
    }
    piece.loaded = true;
  };
  piece.img.src = url;
  return (images[id] = piece);
}
export const headgearReady = (id) => !imagePiece(id) || imagePiece(id).loaded;

const REF_W = 34;   // head width the art is drawn for
const OUT = '#2e2118';

// where on the head a piece attaches, as a share of crown → neck
export const ATTACH = { head: 0.42, face: 0.72 };

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.lineJoin = g.lineCap = 'round';
  return { c, g };
}
const fill = (g, col, draw, line = 1.2) => {
  g.beginPath(); draw(); g.fillStyle = col; g.fill();
  if (line) { g.strokeStyle = OUT; g.lineWidth = line; g.stroke(); }
};
// hard pixel edges: no half-transparent fringe once scaled up with nearest filtering
function crisp(c) {
  const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] < 110 ? 0 : 255;
  g.putImageData(d, 0, 0);
  return c;
}

// view painters: g, w, h. anchor = [x, y] in canvas pixels: the head centre on the attach line
// (side views put it where the head's centre is, so the piece can reach forward of it)
export const HEADGEAR = {
  woven_cap: {
    slot: 'head', size: [40, 24], anchor: [20, 19],
    front: (g) => {
      fill(g, '#7cae4a', () => { g.ellipse(20, 17, 16, 13, 0, Math.PI, 0); g.closePath(); });
      for (let x = 7; x < 34; x += 5) { g.beginPath(); g.moveTo(x, 6 + Math.abs(20 - x) * 0.3); g.lineTo(x + 2, 17); g.strokeStyle = '#5a8a34'; g.lineWidth = 1; g.stroke(); }
      fill(g, '#c8a060', () => g.rect(3, 16, 34, 4));
    },
    side: (g) => {
      fill(g, '#7cae4a', () => { g.ellipse(18, 17, 15, 13, 0, Math.PI, 0); g.closePath(); });
      fill(g, '#c8a060', () => { g.moveTo(3, 16); g.lineTo(38, 16); g.lineTo(39, 20); g.lineTo(3, 20); g.closePath(); });
    },
    back: (g) => {
      fill(g, '#6c9e3a', () => { g.ellipse(20, 17, 16, 13, 0, Math.PI, 0); g.closePath(); });
      fill(g, '#b8904e', () => g.rect(3, 16, 34, 4));
    },
  },
  horned_helm: {
    slot: 'head', size: [56, 34], anchor: [28, 29],
    front: (g) => {
      for (const s of [-1, 1]) fill(g, '#e8dcc0', () => { g.moveTo(28 + s * 14, 22); g.quadraticCurveTo(28 + s * 26, 18, 28 + s * 25, 3); g.quadraticCurveTo(28 + s * 22, 14, 28 + s * 12, 17); g.closePath(); });
      fill(g, '#8c8c96', () => { g.ellipse(28, 27, 16, 15, 0, Math.PI, 0); g.closePath(); });
      fill(g, '#aeb0ba', () => g.rect(26, 12, 4, 15), 0);
      fill(g, '#c8a040', () => g.rect(11, 25, 34, 5));
    },
    side: (g) => {
      fill(g, '#e8dcc0', () => { g.moveTo(24, 20); g.quadraticCurveTo(14, 12, 18, 1); g.quadraticCurveTo(20, 10, 30, 16); g.closePath(); });
      fill(g, '#8c8c96', () => { g.ellipse(27, 27, 15, 15, 0, Math.PI, 0); g.closePath(); });
      fill(g, '#c8a040', () => g.rect(12, 25, 32, 5));
    },
    back: (g) => {
      for (const s of [-1, 1]) fill(g, '#d8ccb0', () => { g.moveTo(28 + s * 14, 22); g.quadraticCurveTo(28 + s * 26, 18, 28 + s * 25, 3); g.quadraticCurveTo(28 + s * 22, 14, 28 + s * 12, 17); g.closePath(); });
      fill(g, '#7c7c86', () => { g.ellipse(28, 27, 16, 15, 0, Math.PI, 0); g.closePath(); });
      fill(g, '#b89030', () => g.rect(11, 25, 34, 5));
    },
  },
  flower_wreath: {
    slot: 'head', size: [42, 16], anchor: [21, 15],
    front: (g) => {
      fill(g, '#5fae45', () => g.ellipse(21, 9, 18, 4, 0, 0, Math.PI * 2), 1);
      [[5, '#ff9ab8'], [12, '#fff4dc'], [21, '#ffd23a'], [30, '#fff4dc'], [37, '#ff9ab8']].forEach(([x, c]) => fill(g, c, () => g.arc(x, 9 + (Math.abs(21 - x) < 10 ? 2 : 0), 3, 0, Math.PI * 2), 0.9));
    },
    side: (g) => {
      fill(g, '#5fae45', () => g.ellipse(21, 9, 16, 4, 0, 0, Math.PI * 2), 1);
      [[8, '#ff9ab8'], [18, '#fff4dc'], [28, '#ffd23a'], [36, '#ff9ab8']].forEach(([x, c]) => fill(g, c, () => g.arc(x, 10, 3, 0, Math.PI * 2), 0.9));
    },
    back: (g) => {
      fill(g, '#4f9e35', () => g.ellipse(21, 9, 18, 4, 0, 0, Math.PI * 2), 1);
      [[8, '#ff9ab8'], [21, '#fff4dc'], [34, '#ffd23a']].forEach(([x, c]) => fill(g, c, () => g.arc(x, 7, 3, 0, Math.PI * 2), 0.9));
    },
  },
  ember_crown: {
    slot: 'head', size: [46, 30], anchor: [23, 26],
    front: (g) => {
      fill(g, '#6a6a72', () => { g.moveTo(8, 27); g.lineTo(8, 14); g.lineTo(15, 20); g.lineTo(23, 4); g.lineTo(31, 20); g.lineTo(38, 14); g.lineTo(38, 27); g.closePath(); });
      for (const x of [15, 23, 31]) fill(g, '#ff8a3a', () => g.arc(x, 23, 2.2, 0, Math.PI * 2), 0.8);
      for (const s of [-1, 1]) fill(g, '#e8e0cc', () => { g.moveTo(23 + s * 15, 18); g.quadraticCurveTo(23 + s * 22, 12, 23 + s * 21, 2); g.quadraticCurveTo(23 + s * 17, 10, 23 + s * 14, 14); g.closePath(); });
    },
    side: (g) => {
      fill(g, '#6a6a72', () => { g.moveTo(10, 27); g.lineTo(10, 14); g.lineTo(18, 20); g.lineTo(25, 4); g.lineTo(32, 20); g.lineTo(37, 15); g.lineTo(37, 27); g.closePath(); });
      fill(g, '#ff8a3a', () => g.arc(31, 23, 2.2, 0, Math.PI * 2), 0.8);
      fill(g, '#e8e0cc', () => { g.moveTo(14, 18); g.quadraticCurveTo(6, 12, 8, 2); g.quadraticCurveTo(12, 10, 17, 14); g.closePath(); });
    },
    back: (g) => {
      fill(g, '#5a5a62', () => { g.moveTo(8, 27); g.lineTo(8, 14); g.lineTo(15, 20); g.lineTo(23, 4); g.lineTo(31, 20); g.lineTo(38, 14); g.lineTo(38, 27); g.closePath(); });
      for (const s of [-1, 1]) fill(g, '#d8d0bc', () => { g.moveTo(23 + s * 15, 18); g.quadraticCurveTo(23 + s * 22, 12, 23 + s * 21, 2); g.quadraticCurveTo(23 + s * 17, 10, 23 + s * 14, 14); g.closePath(); });
    },
  },
  flame_circlet: { slot: 'head' }, // PixelLab only, animated
  round_glasses: {
    slot: 'face', size: [34, 12], anchor: [17, 6],
    front: (g) => {
      for (const x of [9, 25]) {
        g.beginPath(); g.arc(x, 6, 4.5, 0, Math.PI * 2); g.fillStyle = 'rgba(200,230,255,.55)'; g.fill();
        g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
      }
      g.beginPath(); g.moveTo(13, 5); g.lineTo(21, 5); g.stroke();
      g.beginPath(); g.moveTo(4, 5); g.lineTo(1, 4); g.moveTo(30, 5); g.lineTo(33, 4); g.stroke();
    },
    side: (g) => {
      g.beginPath(); g.ellipse(28, 6, 2, 4.5, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(200,230,255,.55)'; g.fill();
      g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke();
      g.beginPath(); g.moveTo(26, 5); g.lineTo(12, 4); g.stroke();
    },
    back: null, // not seen from behind
  },
  raven_mask: { slot: 'face' }, // PixelLab only
};

// the views of one piece as nearest-filtered textures: { front, side, sideL, back } (null = hidden)
const cache = {};
export function headgearViews(id) {
  const def = HEADGEAR[id];
  if (!def?.front) return null; // made only with PixelLab
  if (cache[id]) return cache[id];
  const [w, h] = def.size;
  const make = (paint, mirror) => {
    if (!paint) return null;
    const { c, g } = canvas(w, h);
    if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    paint(g, w, h);
    const t = new THREE.CanvasTexture(crisp(c));
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  };
  cache[id] = { def, front: make(def.front), side: make(def.side), sideL: make(def.side, true), back: make(def.back) };
  return cache[id];
}

// a 64x64 icon from the front view
export function headgearIcon(g, id) {
  const pc = imagePiece(id);
  if (pc) {
    const [i, x0, y0, x1, y1] = pc.L.dirs.down || Object.values(pc.L.dirs)[0];
    const w = x1 - x0, h = y1 - y0, k = Math.min(56 / w, 52 / h);
    g.imageSmoothingEnabled = false;
    if (pc.loaded) g.drawImage(pc.img, i * pc.L.cw + x0, y0, w, h, 32 - (w * k) / 2, 32 - (h * k) / 2, w * k, h * k);
    return;
  }
  const def = HEADGEAR[id];
  const [w, h] = def.size;
  const { c, g: hg } = canvas(w, h);
  def.front(hg, w, h);
  const k = Math.min(56 / w, 48 / h);
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 32 - (w * k) / 2, 34 - (h * k) / 2, w * k, h * k);
}

// which view a sprite direction shows
const VIEW = { down: 'front', downleft: 'front', downright: 'front', right: 'side', left: 'sideL', up: 'back', upleft: 'back', upright: 'back' };

// One headgear layer over a character sprite. Call update() after the body's frame is set.
// hair: the wearer's hair colours as shared uniforms ({ uHair, uHairN }). A face piece is masked by
// the body under it: where it would cross the wearer's hair or leave the head's outline (a pair of
// glasses' arms going back over the hair) its arms are hidden, the way they tuck under real hair;
// the lenses themselves always show. Face pieces sit on the eyes the sprite packer found.
export class HeadLayer {
  constructor(scene, hair) {
    this.mat = new THREE.SpriteMaterial({ alphaTest: 0.5 });
    this.mask = { uBody: { value: null }, uXf: { value: new THREE.Vector4() }, uMask: { value: 0 }, ...hair };
    this.mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.mask);
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform sampler2D uBody;\nuniform vec4 uXf;\nuniform float uMask;\nuniform vec3 uHair[12];\nuniform int uHairN;\nvoid main() {')
        .replace('#include <map_fragment>', `#include <map_fragment>
        if (uMask > 0.5 && sampledDiffuseColor.a < 0.995) { // an arm or hinge (pack-headgear marks them)
          vec2 bu = vec2(vMapUv.x * uXf.x + uXf.y, vMapUv.y * uXf.z + uXf.w);
          vec4 b = texture2D(uBody, bu);
          if (b.a < 0.5 || bu.x < 0.0 || bu.x > 1.0 || bu.y < 0.0 || bu.y > 1.0) discard;
          vec3 c = pow(max(b.rgb, vec3(0.0)), vec3(1.0 / 2.2));
          for (int i = 0; i < 12; i++) {
            if (i >= uHairN) break;
            if (dot(uHair[i], vec3(0.3, 0.59, 0.11)) > 0.2 && distance(c, uHair[i]) < 0.08) discard; // under the hair
          }
        }`);
    };
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.renderOrder = 3; // over the body
    this.sprite.visible = false;
    scene.add(this.sprite);
    this.id = null;
  }

  set(id) { this.id = HEADGEAR[id] ? id : null; }

  // how much of the wearer's hair this piece hides (share of crown → neck; 0 = none)
  hair() { return this.id && this.sprite.visible ? fitOf(this.id).hair : 0; }
  // where its rim sits this frame, in the body frame's pixels: { cx, half, y } (null if none)
  rim() { return this.id && this.sprite.visible ? this.cover : null; }

  // a PixelLab piece: scaled from its front view to the head's width, then sat on the head
  updateImage(pc, body, tex, dir, fw, fh) {
    const h = tex.userData.head, slot = HEADGEAR[this.id].slot, fit = fitOf(this.id);
    if (fit.dirs?.[dir]) Object.assign(fit, fit.dirs[dir]); // fitOf() returns a fresh copy
    if (fit.swap?.[dir]) dir = fit.swap[dir];
    const cell = pc.L.dirs[dir], front = pc.L.dirs.down;
    if (!cell || !front || (slot === 'face' && dir.startsWith('up'))) { this.sprite.visible = false; return; }
    const [, , , , , rx, , ry, , lens] = cell, { cw, ch } = pc.L;
    const upp = body.scale.x / fw;
    let sx = h.w * fit.w / front[6], sy = sx; // body pixels per headgear pixel: front rim = head width
    let ax = rx, ay = fit.base ? cell[4] : ry + 0.5; // the rim's middle (or its bottom) goes on the attach line...
    let px = h.x + fit.dx * (dir.includes('left') ? -1 : 1) * h.w;
    let py = h.crown + (h.neck - h.crown) * (fit.at + fit.dy);
    const eyes = h.eyes || [];
    if (slot === 'face' && lens?.length === 4 && eyes.length === 4) {
      // ...or, for a face piece, its lenses on the eyes: width from the eye spacing (squashed when
      // turned), height from the head
      const k = (eyes[2] - eyes[0]) / (lens[2] - lens[0]);
      if (k > sx * 0.5 && k < sx * 1.8) sx = k;
      ax = (lens[0] + lens[2]) / 2; ay = (lens[1] + lens[3]) / 2;
      px = (eyes[0] + eyes[2]) / 2; py = (eyes[1] + eyes[3]) / 2;
    } else if (slot === 'face' && lens?.length === 2 && eyes.length === 2) { // a side view: one lens, one eye
      ax = lens[0]; ay = lens[1]; px = eyes[0]; py = eyes[1];
    }
    const k = sx * upp, HW = cw * k, HH = ch * sy * (fit.sy || 1) * upp;
    const dx = (px / fw - 0.5) * body.scale.x, dy = (1 - py / fh - body.center.y) * body.scale.y;
    const fr = pc.tex[dir], t = fr[Math.floor(performance.now() / 1000 * ANIM_FPS) % fr.length]; // animated pieces loop
    if (this.mat.map !== t) { if (!this.mat.map) this.mat.needsUpdate = true; this.mat.map = t; }
    this.sprite.scale.set(HW, HH, 1);
    this.sprite.center.set(ax / cw - dx / HW, (1 - ay / ch) - dy / HH);
    this.sprite.position.copy(body.position);
    this.mat.color.copy(body.material.color);
    this.sprite.visible = true;
    this.cover = { cx: px, half: (cell[6] * k) / upp / 2, y: py };
    // face pieces: map this layer's texture coordinates onto the body frame's, for the mask
    this.mask.uMask.value = slot === 'face' ? 1 : 0;
    if (slot === 'face') {
      const W = body.scale.x, Hb = body.scale.y, c = this.sprite.center;
      this.mask.uBody.value = tex;
      this.mask.uXf.value.set(HW / W, 0.5 - (c.x * HW) / W, HH / Hb, body.center.y - (c.y * HH) / Hb);
    }
  }

  // body: the character's sprite; tex: its current frame; dir: sprite direction; fw, fh: frame size
  update(body, tex, dir, fw, fh, show) {
    const pc = this.id && imagePiece(this.id);
    if (pc && show && tex.userData.head && body.visible) { this.updateImage(pc, body, tex, dir, fw, fh); return; }
    const h = tex.userData.head, v = !pc && this.id && headgearViews(this.id);
    const view = v && v[VIEW[dir] || 'front'];
    if (!show || !h || !view || !body.visible) { this.sprite.visible = false; return; }
    const def = v.def, [cw, ch] = def.size, [ax, ay] = def.anchor;
    const upp = body.scale.x / fw;              // world units per sprite pixel (width; height may breathe)
    const k = (h.w / REF_W) * upp;
    const HW = cw * k, HH = ch * k;
    const left = VIEW[dir] === 'sideL';
    const px = h.x, py = h.crown + (h.neck - h.crown) * ATTACH[def.slot];
    const dx = (px / fw - 0.5) * body.scale.x, dy = (1 - py / fh - body.center.y) * body.scale.y;
    const axs = left ? cw - ax : ax;
    if (!this.mat.map) this.mat.needsUpdate = true; // first texture: the shader needs a map
    this.mat.map = view;
    this.sprite.scale.set(HW, HH, 1);
    this.sprite.center.set(axs / cw - dx / HW, (1 - ay / ch) - dy / HH);
    this.sprite.position.copy(body.position);
    this.mat.color.copy(body.material.color);
    this.sprite.visible = true;
  }
}
