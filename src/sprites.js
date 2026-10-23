// Characters (player, monsters, villagers) are PixelLab sprite sheets in src/art, packed by
// build-tools/pack-sprites.py; the world, props and effects are painted into canvases at
// startup. Each sprite is drawn bottom-centered so it stands on the ground. Sizes are in
// world units, not pixels.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';

const SHEETS = import.meta.glob('./art/*.png', { eager: true, import: 'default' });
const LAYOUTS = import.meta.glob('./art/*.json', { eager: true, import: 'default' });

const OUT = '#2e2118';
const TAU = Math.PI * 2;

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.lineJoin = 'round';
  g.lineCap = 'round';
  return { c, g };
}

function ell(g, x, y, rx, ry, fill, stroke = OUT, lw = 3) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

function rrect(g, x, y, w, h, r, fill, stroke = OUT, lw = 3) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

function poly(g, pts, fill, stroke = OUT, lw = 3) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

function circleFill(g, x, y, r, fill) {
  g.beginPath();
  g.arc(x, y, Math.max(0.1, r), 0, TAU);
  g.fillStyle = fill;
  g.fill();
}

// Painterly canopy: one shared outline, dark base, mid layer, light dabs top-left.
function canopy(g, rng, cx, cy, rx, ry, pal, count = 16) {
  const blobs = [{ x: cx, y: cy, r: Math.min(rx, ry) * 0.62 }];
  for (let i = 0; i < count; i++) {
    const a = rng() * TAU, d = Math.sqrt(rng());
    blobs.push({
      x: cx + Math.cos(a) * d * rx * 0.68,
      y: cy + Math.sin(a) * d * ry * 0.68,
      r: (0.3 + rng() * 0.22) * Math.min(rx, ry),
    });
  }
  for (const b of blobs) circleFill(g, b.x, b.y, b.r + 3.5, OUT);
  for (const b of blobs) circleFill(g, b.x, b.y, b.r, pal[0]);
  for (const b of blobs) circleFill(g, b.x - b.r * 0.12, b.y - b.r * 0.16, b.r * 0.8, pal[1]);
  for (const b of blobs) {
    if (b.y < cy + ry * 0.15 && b.x < cx + rx * 0.3) {
      circleFill(g, b.x - b.r * 0.28, b.y - b.r * 0.32, b.r * 0.42, pal[2]);
    }
  }
  for (let i = 0; i < 9; i++) {
    const x = cx - rx * 0.5 + rng() * rx * 0.7;
    const y = cy - ry * 0.65 + rng() * ry * 0.6;
    circleFill(g, x, y, 2 + rng() * 3, pal[3]);
  }
}

function trunk(g, x, top, bottom, w, col = '#7a5232', dark = '#5a3a22') {
  poly(g, [[x - w * 0.5, top], [x + w * 0.5, top], [x + w * 0.62, bottom], [x - w * 0.62, bottom]], col);
  poly(g, [[x + w * 0.05, top + 2], [x + w * 0.45, top + 2], [x + w * 0.55, bottom - 2], [x + w * 0.1, bottom - 2]], dark, null);
  // root flare
  ell(g, x, bottom - 2, w * 0.9, 5, col);
}

// ---------- Props ----------
const PAL = {
  grove: ['#3f7a35', '#5e9e3f', '#86c24f', '#c4e27a'],
  grove2: ['#3a6e3a', '#549649', '#7cb85c', '#b8de86'],
  dark: ['#22433d', '#315f57', '#4c8770', '#8fc3a2'],
  dark2: ['#2b3f4a', '#3d5a66', '#5a8088', '#9cc8c4'],
  willow: ['#556f37', '#759546', '#9dba5f', '#d1e08e'],
  dry: ['#86391f', '#b5562a', '#dd873a', '#f6c46a'],
  bush: ['#3c7034', '#579739', '#7eba4a', '#b9dc75'],
};

function treeRound(rng, pal, opts = {}) {
  const { c, g } = mk(160, 200);
  trunk(g, 80, 108, 194, opts.trunkW || 24, opts.trunk || '#7a5232', opts.trunkDk || '#553620');
  canopy(g, rng, 80, 74, 66, 60, pal, 18);
  return c;
}

function treeWillow(rng) {
  const { c, g } = mk(160, 200);
  trunk(g, 80, 100, 194, 22, '#6f5a3a', '#4f3f28');
  canopy(g, rng, 80, 66, 62, 50, PAL.willow, 14);
  for (let i = 0; i < 16; i++) {
    const x = 26 + rng() * 108, y0 = 70 + rng() * 30, len = 40 + rng() * 50;
    g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + 4, y0 + len * 0.6, x - 2, y0 + len);
    g.strokeStyle = OUT; g.lineWidth = 6; g.stroke();
    g.strokeStyle = i % 2 ? PAL.willow[1] : PAL.willow[2]; g.lineWidth = 3.5; g.stroke();
  }
  return c;
}

function treeDead(rng) {
  const { c, g } = mk(128, 176);
  const branches = [[64, 172, 64, 70], [64, 110, 30, 62], [64, 92, 100, 50], [42, 78, 26, 40], [92, 58, 108, 30], [64, 70, 60, 26]];
  for (const [x0, y0, x1, y1] of branches) {
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (rng() - 0.5) * 16, (y0 + y1) / 2, x1, y1);
    g.strokeStyle = OUT; g.lineWidth = (y0 > 150 ? 20 : 10) + 4; g.stroke();
  }
  for (const [x0, y0, x1, y1] of branches) {
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2, x1, y1);
    g.strokeStyle = '#7d6d5c'; g.lineWidth = y0 > 150 ? 20 : 10; g.stroke();
  }
  ell(g, 64, 170, 16, 5, '#7d6d5c');
  return c;
}

function bush(rng, pal) {
  const { c, g } = mk(112, 88);
  canopy(g, rng, 56, 54, 48, 30, pal, 10);
  return c;
}

function rock(rng, base, light, dark) {
  const { c, g } = mk(128, 96);
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI; // top half arc
    pts.push([64 + Math.cos(a) * (48 + rng() * 10), 82 + Math.sin(a) * (58 + rng() * 12)]);
  }
  pts.push([110, 90], [18, 90]);
  poly(g, pts, base, OUT, 4);
  poly(g, [[pts[1][0] + 6, pts[1][1] + 6], [pts[3][0], pts[3][1] + 6], [pts[5][0], pts[5][1] + 8], [60, 62], [30, 70]], light, null);
  poly(g, [[70, 86], [108, 86], [pts[7][0] - 4, pts[7][1] + 10], [80, 66]], dark, null);
  return c;
}

function mushroomBig(rng, cap = '#7a58ad', spots = '#d8c8f0', under = '#5e447f') {
  const { c, g } = mk(96, 112);
  rrect(g, 38, 52, 20, 56, 8, '#efe2c4');
  rrect(g, 48, 56, 8, 50, 4, '#d6c6a4', null);
  ell(g, 48, 56, 40, 9, under);
  g.beginPath(); g.ellipse(48, 56, 42, 36, 0, Math.PI, TAU); g.closePath();
  g.fillStyle = cap; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * (1.1 + rng() * 0.8);
    ell(g, 48 + Math.cos(a) * 26, 50 + Math.sin(a) * 22, 4 + rng() * 3, 3 + rng() * 2, spots, null);
  }
  return c;
}

function mushroomsSmall(rng) {
  const { c, g } = mk(64, 48);
  const cols = ['#c0563a', '#e0a040', '#8a64b8'];
  for (let i = 0; i < 3; i++) {
    const x = 16 + i * 16 + rng() * 6, h = 14 + rng() * 10;
    rrect(g, x - 3, 46 - h, 6, h, 3, '#efe2c4', OUT, 2);
    g.beginPath(); g.ellipse(x, 46 - h, 10, 9, 0, Math.PI, TAU); g.closePath();
    g.fillStyle = cols[i % 3]; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
  }
  return c;
}

function reeds(rng) {
  const { c, g } = mk(96, 112);
  const cols = ['#6f8a3c', '#88a04a', '#5b7432'];
  for (let i = 0; i < 13; i++) {
    const x = 18 + rng() * 60, h = 50 + rng() * 52, bend = (rng() - 0.5) * 24;
    g.beginPath(); g.moveTo(x, 110); g.quadraticCurveTo(x + bend * 0.3, 110 - h * 0.6, x + bend, 110 - h);
    g.strokeStyle = OUT; g.lineWidth = 6; g.stroke();
    g.strokeStyle = cols[i % 3]; g.lineWidth = 3.5; g.stroke();
    if (i % 3 === 0) rrect(g, x + bend - 4, 110 - h - 6, 8, 18, 4, '#7a4a2a', OUT, 2);
  }
  return c;
}

function grass(rng, cols) {
  const { c, g } = mk(64, 40);
  for (let i = 0; i < 9; i++) {
    const x = 12 + rng() * 40, h = 14 + rng() * 22, bend = (rng() - 0.5) * 14;
    g.beginPath(); g.moveTo(x, 40); g.quadraticCurveTo(x, 40 - h * 0.6, x + bend, 40 - h);
    g.strokeStyle = OUT; g.lineWidth = 5; g.stroke();
    g.strokeStyle = cols[i % cols.length]; g.lineWidth = 3; g.stroke();
  }
  return c;
}

function flowers(rng) {
  const c = grass(rng, ['#5e9e3f', '#7cb85c']);
  const g = c.getContext('2d');
  const petals = ['#f4a6c8', '#fff3a6', '#ffffff', '#b8a6f4'];
  for (let i = 0; i < 5; i++) {
    const x = 12 + rng() * 40, y = 6 + rng() * 18;
    ell(g, x, y, 5, 4, petals[i % 4], OUT, 2);
    circleFill(g, x, y, 1.8, '#e3a32b');
  }
  return c;
}

function stump() {
  const { c, g } = mk(80, 56);
  rrect(g, 16, 18, 48, 36, 6, '#7a5232');
  rrect(g, 42, 20, 20, 32, 4, '#5a3a22', null);
  ell(g, 40, 20, 24, 8, '#c99a63');
  ell(g, 40, 20, 14, 4.5, null, '#9a7044', 2);
  return c;
}

function tent() {
  const { c, g } = mk(192, 160);
  poly(g, [[14, 152], [96, 12], [178, 152]], '#e2cf9f', OUT, 4);
  poly(g, [[96, 16], [174, 150], [112, 150]], '#cdb684', null);
  for (const t of [0.35, 0.65]) {
    g.beginPath(); g.moveTo(96, 12); g.lineTo(14 + (178 - 14) * t, 152);
    g.strokeStyle = '#b84a3a'; g.lineWidth = 7; g.stroke();
  }
  poly(g, [[76, 152], [96, 86], [118, 152]], '#3e2c20', OUT, 3);
  poly(g, [[96, 86], [76, 152], [64, 152]], '#efe0b6', OUT, 3);
  g.beginPath(); g.moveTo(96, 14); g.lineTo(96, 0);
  g.strokeStyle = OUT; g.lineWidth = 5; g.stroke();
  poly(g, [[97, 1], [118, 6], [97, 12]], '#c8463c', OUT, 2);
  return c;
}

function campfire(frame) {
  const { c, g } = mk(96, 112);
  // logs
  g.save(); g.translate(48, 92); g.rotate(0.35); rrect(g, -32, -6, 64, 12, 5, '#7a5232'); g.restore();
  g.save(); g.translate(48, 92); g.rotate(-0.35); rrect(g, -32, -6, 64, 12, 5, '#8a5f3a'); g.restore();
  // flame
  const hs = [40, 48, 43][frame], sway = [0, 3, -3][frame];
  const flame = (h, w, col) => {
    g.beginPath();
    g.moveTo(48 - w, 92);
    g.quadraticCurveTo(48 - w * 1.2, 92 - h * 0.5, 48 + sway, 92 - h);
    g.quadraticCurveTo(48 + w * 1.2, 92 - h * 0.5, 48 + w, 92);
    g.closePath(); g.fillStyle = col; g.fill();
  };
  flame(hs + 4, 22, OUT);
  flame(hs, 19, '#e8562a');
  flame(hs * 0.72, 13, '#f59a2b');
  flame(hs * 0.42, 7, '#ffe27a');
  // stones
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    ell(g, 48 + Math.cos(a) * 34, 98 + Math.sin(a) * 10, 9, 7, i % 2 ? '#8c8478' : '#a39b8e', OUT, 2.5);
  }
  return c;
}

function chest() {
  const { c, g } = mk(96, 80);
  rrect(g, 12, 34, 72, 42, 5, '#9a6234');
  rrect(g, 10, 16, 76, 24, 9, '#b0743d');
  for (const x of [24, 66]) rrect(g, x, 16, 7, 60, 2, '#6d6f7a', OUT, 2);
  rrect(g, 42, 32, 12, 14, 3, '#e3b341', OUT, 2);
  return c;
}

function logSeat() {
  const { c, g } = mk(112, 56);
  rrect(g, 8, 16, 92, 30, 14, '#8a5a33');
  rrect(g, 14, 32, 80, 10, 5, '#6d4426', null);
  ell(g, 98, 31, 9, 15, '#c99a63');
  ell(g, 98, 31, 4, 7, null, '#9a7044', 2);
  return c;
}

// ---------- Ground detail & helpers ----------
function groundDetail() {
  const { c, g } = mk(256, 256);
  g.fillStyle = '#f2f2f2';
  g.fillRect(0, 0, 256, 256);
  const rng = mulberry32(99);
  for (let i = 0; i < 1400; i++) {
    const x = rng() * 256, y = rng() * 256, v = Math.floor(200 + rng() * 55);
    g.strokeStyle = `rgb(${v},${v},${v})`;
    g.lineWidth = 1 + rng() * 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rng() - 0.5) * 4, y - 3 - rng() * 5); g.stroke();
  }
  for (let i = 0; i < 160; i++) {
    const v = Math.floor(225 + rng() * 30);
    circleFill(g, rng() * 256, rng() * 256, 2 + rng() * 6, `rgba(${v},${v},${v},.5)`);
  }
  return c;
}

function blobShadow() {
  const { c, g } = mk(64, 64);
  const grd = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  grd.addColorStop(0, 'rgba(0,0,0,.55)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function waterTex() {
  const { c, g } = mk(128, 128);
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  const rng = mulberry32(7);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(190,225,240,${0.4 + rng() * 0.5})`;
    g.lineWidth = 2;
    const x = rng() * 128, y = rng() * 128;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 3, x + 16 + rng() * 10, y); g.stroke();
  }
  return c;
}

// ---------- Quest markers ----------
// speech-bubble marker over a villager: '!' = new quest, '?' = ready to hand in
function questMark(ch, fill) {
  const { c, g } = mk(64, 72);
  g.beginPath();
  g.roundRect(8, 6, 48, 46, 14);
  g.moveTo(26, 50); g.lineTo(32, 64); g.lineTo(40, 50);
  g.fillStyle = fill; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3.5; g.stroke();
  g.font = '900 34px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = 5; g.strokeText(ch, 32, 31);
  g.fillStyle = '#fff'; g.fillText(ch, 32, 31);
  return c;
}

// ---------- Effects ----------
function slashArc() {
  const { c, g } = mk(128, 128);
  // crescent opening to the right
  const band = (r0, r1, a0, a1, col) => {
    g.beginPath();
    g.arc(52, 64, r1, a0, a1);
    g.arc(40, 64, r0, a1, a0, true);
    g.closePath();
    g.fillStyle = col; g.fill();
  };
  band(44, 58, -1.25, 1.25, 'rgba(150,200,255,.55)');
  band(46, 54, -1.15, 1.15, 'rgba(255,255,255,.95)');
  return c;
}

function puff() {
  const { c, g } = mk(64, 64);
  const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grd.addColorStop(0, 'rgba(255,255,255,.95)');
  grd.addColorStop(0.6, 'rgba(240,240,230,.7)');
  grd.addColorStop(1, 'rgba(240,240,230,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

// ---------- Library ----------
function tex(canvas, opts = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat, opts.repeat);
  }
  return t;
}

// A packed PixelLab sheet cut into textures: anims[dir][anim] = [tex], flash = white copies
// for the hit flash. Frames start blank and fill in once the sheet image has loaded.
// body = [w, h] in pixels of the standing character, used to size it in the world.
// Each texture's userData.anchor is where its animation stands, as a fraction of the frame
// height from the bottom: set it as the sprite's center so the feet stay on the ground.
// PixelLab draws some animations lower in the canvas than the standing pose, so each one gets
// its own anchor: the median of its frames' feet. Planting every frame separately would make
// the character jump by a few pixels per frame; the median keeps the animation's own bob.
function pixelSet(url, { fw, fh, body, foot = 0, hair = [], anims }) {
  const at = (px) => px / fh;
  const blank = () => {
    const t = tex(mk(fw, fh).c);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  };
  const set = { pixel: true, fw, fh, body, anchor: at(foot), hair: hair.map((c) => c.map((v) => v / 255)), anims: {}, flash: {} };
  const cuts = [];
  for (const [dir, list] of Object.entries(anims)) {
    set.anims[dir] = {};
    set.flash[dir] = {};
    for (const [anim, [row, n, feet, heads]] of Object.entries(list)) {
      set.anims[dir][anim] = [];
      set.flash[dir][anim] = [];
      const anchor = feet ? at([...feet].sort((a, b) => a - b)[feet.length >> 1]) : set.anchor;
      for (let i = 0; i < n; i++) {
        const t = blank(), f = blank();
        t.userData.anchor = f.userData.anchor = anchor;
        // where the head is in this frame (frame pixels), for headgear: { x, crown, neck, w, eyes: [x, y, ...] }
        if (heads?.[i]) t.userData.head = f.userData.head = { x: heads[i][0], crown: heads[i][1], neck: heads[i][2], w: heads[i][3], eyes: heads[i].slice(4) };
        set.anims[dir][anim].push(t);
        set.flash[dir][anim].push(f);
        cuts.push([t, f, i * fw, row * fh]);
      }
    }
  }
  const img = new Image();
  img.onload = () => {
    for (const [t, f, x, y] of cuts) {
      t.image.getContext('2d').drawImage(img, x, y, fw, fh, 0, 0, fw, fh);
      const g = f.image.getContext('2d');
      g.drawImage(t.image, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, fw, fh);
      t.needsUpdate = f.needsUpdate = true;
    }
  };
  img.src = url;
  return set;
}

// w = world width; height follows canvas aspect. coll = collision radius, shadow = baked shadow radius, space = min spacing.
const PROP_DEFS = {
  tree_grove: { w: 3.0, coll: 0.45, shadow: 1.5, space: 1.7, variants: 3, make: (r, i) => treeRound(r, i % 2 ? PAL.grove2 : PAL.grove) },
  tree_dark: { w: 3.2, coll: 0.45, shadow: 1.6, space: 1.7, variants: 3, make: (r, i) => treeRound(r, i % 2 ? PAL.dark2 : PAL.dark, { trunk: '#4e3a2c', trunkDk: '#33251b', trunkW: 20 }) },
  tree_willow: { w: 3.0, coll: 0.45, shadow: 1.5, space: 1.8, variants: 2, make: (r) => treeWillow(r) },
  tree_dead: { w: 2.2, coll: 0.3, shadow: 0.8, space: 1.4, variants: 2, make: (r) => treeDead(r) },
  shrub_dry: { w: 1.4, coll: 0.35, shadow: 0.8, space: 1.0, variants: 2, make: (r) => bush(r, PAL.dry) },
  bush: { w: 1.4, coll: 0.35, shadow: 0.8, space: 1.0, variants: 2, make: (r) => bush(r, PAL.bush) },
  rock: { w: 1.7, coll: 0.6, shadow: 1.0, space: 1.4, variants: 3, make: (r) => rock(r, '#a07558', '#c49670', '#7a563d') },
  rock_grey: { w: 1.5, coll: 0.55, shadow: 0.9, space: 1.3, variants: 2, make: (r) => rock(r, '#8c8478', '#b0a89a', '#6a6358') },
  rock_small: { w: 0.8, coll: 0, shadow: 0.4, space: 0.6, variants: 2, make: (r) => rock(r, '#a07558', '#c49670', '#7a563d') },
  mushroom_big: { w: 1.2, coll: 0.3, shadow: 0.7, space: 1.1, variants: 2, make: (r, i) => i ? mushroomBig(r, '#3f8f8a', '#b6efe6', '#2c6662') : mushroomBig(r) },
  mushrooms: { w: 0.7, coll: 0, shadow: 0, space: 0.6, variants: 2, make: (r) => mushroomsSmall(r) },
  reeds: { w: 1.1, coll: 0, shadow: 0, space: 0.8, variants: 3, make: (r) => reeds(r) },
  grass: { w: 0.65, coll: 0, shadow: 0, space: 0.5, variants: 3, make: (r) => grass(r, ['#5e9e3f', '#7cb85c', '#4a8a36']) },
  grass_dark: { w: 0.65, coll: 0, shadow: 0, space: 0.5, variants: 2, make: (r) => grass(r, ['#2f5e4e', '#3f7a64']) },
  grass_dry: { w: 0.65, coll: 0, shadow: 0, space: 0.5, variants: 2, make: (r) => grass(r, ['#b5913f', '#c9a64e', '#94763a']) },
  flowers: { w: 0.7, coll: 0, shadow: 0, space: 0.6, variants: 3, make: (r) => flowers(r) },
  stump: { w: 0.8, coll: 0.3, shadow: 0.5, space: 0.9, variants: 1, make: () => stump() },
  tent: { w: 3.2, coll: 1.2, shadow: 1.8, space: 0, variants: 1, make: () => tent() },
  chest: { w: 1.0, coll: 0.45, shadow: 0.6, space: 0, variants: 1, make: () => chest() },
  log: { w: 1.4, coll: 0.4, shadow: 0.6, space: 0, variants: 1, make: () => logSeat() },
};

export function createSprites() {
  const rng = mulberry32(2026);
  const props = {};
  for (const [name, def] of Object.entries(PROP_DEFS)) {
    const variants = [];
    for (let i = 0; i < def.variants; i++) {
      const canvas = def.make(rng, i);
      const mat = new THREE.SpriteMaterial({ map: tex(canvas), alphaTest: 0.5, fog: true });
      variants.push({ mat, aspect: canvas.height / canvas.width });
    }
    props[name] = { ...def, variants };
  }

  const fireFrames = [0, 1, 2].map((f) => tex(campfire(f)));
  const fireAspect = 112 / 96;

  const sheet = (name) => pixelSet(SHEETS[`./art/${name}.png`], LAYOUTS[`./art/${name}.json`]);
  const mobs = {
    slime: sheet('slime'),
    slimeBlue: sheet('blueslime'),
    sprout: sheet('sprout'),
    crab: sheet('crab'),
    mushling: sheet('mushling'),
    beetle: sheet('beetle'),
    wisp: sheet('wisp'),
    jarl: SHEETS['./art/jarl.png'] ? sheet('jarl') : sheet('beetle'), // the MVP (PixelLab art, packed like the rest)
  };
  const villagers = { bram: sheet('bram'), tilly: sheet('tilly'), wren: sheet('wren') };

  return {
    mobs,
    villagers,
    marks: { offer: tex(questMark('!', '#e3a13a')), ready: tex(questMark('?', '#5fae45')) },
    fx: { slash: tex(slashArc()), puff: tex(puff()) },
    props,
    fire: { frames: fireFrames, aspect: fireAspect, w: 1.2 },
    player: sheet('player'), // the Swordsman
    novice: SHEETS['./art/novice.png'] ? sheet('novice') : null,
    ground: tex(groundDetail(), { repeat: 28 }),
    shadow: tex(blobShadow()),
    water: tex(waterTex(), { repeat: 4 }),
  };
}
