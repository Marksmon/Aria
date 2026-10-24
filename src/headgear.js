// Headgear you can see on the player, Ragnarok style, in two slots: 'head' (hats, crowns) and
// 'face' (glasses, masks).
//
// Pieces made to the character standard (docs/character-standard.md) were drawn on the standard
// bald head itself, as states of it (build-tools/pixellab-heads.py gear), and packed by
// pack-heads.py into src/art/hg_<id>.png: one cell per direction (a row per frame if animated),
// the same cell as the head's. So a piece is painted into the body frames at the head's own spot
// (paintGear, from Player.dressHead) and sits on the head and face exactly as drawn, on the body's
// pixel grid. A hat also says how much hair it hides (cut).
//
// Older bodies, drawn with their heads, get the small painted versions below instead, as a layer
// pinned to each frame's head (HeadLayer).
import * as THREE from 'three';

const SHEETS = import.meta.glob('./art/hg_*.png', { eager: true, import: 'default' });
const LAYOUTS = import.meta.glob('./art/hg_*.json', { eager: true, import: 'default' });
export const GEAR_FPS = 9; // animated pieces

// a standard piece: its sheet and layout ({ cw, ch, frames, slot, dirs, box, cut }), or null
const pieces = {};
export function gearPiece(id) {
  if (!id) return null;
  if (id in pieces) return pieces[id];
  const url = SHEETS[`./art/hg_${id}.png`], L = LAYOUTS[`./art/hg_${id}.json`];
  if (!url || !L?.dirs) return (pieces[id] = null);
  const pc = { L, img: new Image(), loaded: false };
  pc.img.onload = () => { pc.loaded = true; };
  pc.img.src = url;
  return (pieces[id] = pc);
}
export const headgearReady = (id) => !gearPiece(id) || gearPiece(id).loaded;
export const gearFrames = (id) => gearPiece(id)?.L.frames || 1;
// the hair a piece hides: per column of the head cell, the row above which hair is left out
export const gearCut = (id, dir) => gearPiece(id)?.L.cut?.[dir] || null;

// paint a piece into a body frame (ctx), its cell's top-left corner at at = [x, y] (the head's)
export function paintGear(g, at, dir, id, frame = 0) {
  const pc = gearPiece(id);
  if (!pc?.loaded || !at || pc.L.dirs[dir] === undefined) return;
  const { cw, ch } = pc.L;
  g.drawImage(pc.img, pc.L.dirs[dir] * cw, (frame % pc.L.frames) * ch, cw, ch, at[0], at[1], cw, ch);
}

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
  flame_circlet: { slot: 'head' }, // standard piece only, animated
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
  raven_mask: { slot: 'face' }, // standard piece only
};

// the views of one piece as nearest-filtered textures: { front, side, sideL, back } (null = hidden)
const cache = {};
export function headgearViews(id) {
  const def = HEADGEAR[id];
  if (!def?.front) return null; // a standard piece only
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
  const pc = gearPiece(id);
  if (pc) {
    const box = pc.L.box.down || Object.values(pc.L.box).find(Boolean);
    if (!box || !pc.loaded) return;
    const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, k = Math.floor(Math.min(56 / w, 52 / h)) || 1;
    g.imageSmoothingEnabled = false;
    g.drawImage(pc.img, pc.L.dirs.down * pc.L.cw + x0, y0, w, h, 32 - (w * k) / 2, 32 - (h * k) / 2, w * k, h * k);
    return;
  }
  const def = HEADGEAR[id];
  if (!def?.front) return;
  const [w, h] = def.size;
  const { c, g: hg } = canvas(w, h);
  def.front(hg, w, h);
  const k = Math.min(56 / w, 48 / h);
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 32 - (w * k) / 2, 34 - (h * k) / 2, w * k, h * k);
}

// which view a sprite direction shows
const VIEW = { down: 'front', downleft: 'front', downright: 'front', right: 'side', left: 'sideL', up: 'back', upleft: 'back', upright: 'back' };

// One painted headgear layer over an older body, drawn with its head: pinned to the head of
// whatever frame is showing (the packer's per-frame head: centre, crown, neck, width).
export class HeadLayer {
  constructor(scene) {
    this.mat = new THREE.SpriteMaterial({ alphaTest: 0.5 });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.renderOrder = 3; // over the body
    this.sprite.visible = false;
    scene.add(this.sprite);
    this.id = null;
  }

  set(id) { this.id = HEADGEAR[id] ? id : null; }
  hide() { this.sprite.visible = false; }

  // body: the character's sprite; tex: its current frame; dir: sprite direction; fw, fh: frame size
  update(body, tex, dir, fw, fh, show) {
    const h = tex.userData.head, v = this.id && headgearViews(this.id);
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
