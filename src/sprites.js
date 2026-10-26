// Characters (monsters, villagers) are PixelLab sprite sheets in src/art, packed by
// build-tools/pack-sprites.py; the hero's job bodies are painted in code (designSet); the world,
// props and effects are painted into canvases at startup. Each sprite is drawn bottom-centered so it stands on the ground. Sizes are in
// world units, not pixels.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';
import { paintSet, frameSize } from './painted.js';
import { beastSet, BEASTS } from './beasts.js';
import { paintButler, BW, BH } from './butler.js';
import { paintBleepBloop, BW as BBW, BH as BBH, BODY as BB_BODY } from './bleepbloop.js';
import { POSES, LEGS, framePainter } from './design-anim.js';
import { drawTrainee } from './trainees.js';
import { drawBlader } from './bladers.js';
import { drawMage } from './mages.js';
import { drawMKnight } from './mknights.js';
import { drawArcher } from './archers.js';

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
  birch: ['#5f8f2e', '#86b440', '#b2d65a', '#e6f29a'],
  oak: ['#24402a', '#335a34', '#4a7a42', '#86b06a'],
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

// a birch: slim white trunk with dark marks, light airy crown
function treeBirch(rng) {
  const { c, g } = mk(140, 220);
  rrect(g, 61, 96, 18, 122, 6, '#ece6d8');
  for (let i = 0; i < 7; i++) { g.fillStyle = '#3e3a36'; g.fillRect(62 + rng() * 8, 104 + i * 15 + rng() * 6, 6 + rng() * 6, 3); }
  canopy(g, rng, 70, 72, 52, 64, PAL.birch, 16);
  return c;
}

// Steinborg's street things
function lamp() {
  const { c, g } = mk(48, 140);
  rrect(g, 20, 40, 8, 98, 3, '#3a3a42');
  rrect(g, 12, 132, 24, 7, 3, '#3a3a42');
  rrect(g, 10, 14, 28, 30, 6, '#3a3a42');
  rrect(g, 14, 18, 20, 22, 4, '#ffe37a', OUT, 2);
  circleFill(g, 24, 29, 5, '#fff8d0');
  poly(g, [[8, 16], [24, 3], [40, 16]], '#4a4a54', OUT, 3);
  return c;
}
function barrel() {
  const { c, g } = mk(64, 76);
  rrect(g, 8, 8, 48, 64, 14, '#8a5a33');
  for (const y of [20, 52]) rrect(g, 7, y, 50, 6, 2, '#5a5e68', OUT, 2);
  ell(g, 32, 10, 22, 6, '#a87444', OUT, 2.5);
  return c;
}
function crate() {
  const { c, g } = mk(68, 64);
  rrect(g, 6, 8, 56, 52, 3, '#b0743d');
  g.beginPath(); g.moveTo(8, 10); g.lineTo(60, 58); g.moveTo(60, 10); g.lineTo(8, 58); g.strokeStyle = '#7a4a26'; g.lineWidth = 5; g.stroke();
  rrect(g, 6, 8, 56, 52, 3, null, OUT, 3);
  return c;
}
function anvil() {
  const { c, g } = mk(72, 60);
  rrect(g, 26, 26, 20, 30, 3, '#5a3a22');
  poly(g, [[4, 12], [68, 12], [60, 26], [16, 26]], '#4a4e58', OUT, 3);
  poly(g, [[4, 12], [-4, 8], [4, 18]], '#4a4e58', OUT, 2);
  g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(10, 13, 50, 3);
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

// ---------- Veidheim and its lands: woods, farms and the hunters' things ----------
// a pine: tiers of dark needles on a straight trunk
function treePine(rng) {
  const { c, g } = mk(130, 220);
  trunk(g, 65, 150, 214, 16, '#6a4a2e', '#4a3220');
  const tiers = [[176, 58], [140, 50], [106, 42], [74, 32], [46, 22]];
  const cols = ['#24503a', '#2f6446', '#3f7a52'];
  for (const [y, w] of tiers) {
    const j = (rng() - 0.5) * 4;
    poly(g, [[65 - w + j, y], [65 + j * 0.3, y - 52], [65 + w + j, y]], cols[0], OUT, 3.5);
    poly(g, [[65 - w * 0.75 + j, y - 6], [65 + j * 0.3, y - 48], [65 + j * 0.3 + 4, y - 8]], cols[1], null);
    poly(g, [[65 - w * 0.45 + j, y - 14], [65 + j * 0.3 - 1, y - 44], [65 + j * 0.3, y - 16]], cols[2], null);
  }
  return c;
}
// an old oak: a thick, gnarled trunk and a wide dark crown
function treeOak(rng) {
  const { c, g } = mk(190, 220);
  trunk(g, 95, 110, 212, 34, '#5e4430', '#3e2c1e');
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(95, 140); g.quadraticCurveTo(95 + s * 30, 120, 95 + s * 52, 96); g.strokeStyle = OUT; g.lineWidth = 14; g.stroke(); g.strokeStyle = '#5e4430'; g.lineWidth = 9; g.stroke(); }
  canopy(g, rng, 95, 76, 84, 62, PAL.oak, 22);
  ell(g, 72, 170, 7, 5, '#5f8f3a', null); // moss on the trunk
  return c;
}
// a clump of ripe wheat (or barley): golden stalks with heavy ears
function wheat(rng) {
  const { c, g } = mk(64, 72);
  const cols = ['#d8b04a', '#e8c860', '#c8983a'];
  for (let i = 0; i < 11; i++) {
    const x = 10 + rng() * 44, h = 40 + rng() * 26, bend = (rng() - 0.3) * 12;
    g.beginPath(); g.moveTo(x, 72); g.quadraticCurveTo(x, 72 - h * 0.6, x + bend, 72 - h);
    g.strokeStyle = OUT; g.lineWidth = 4.5; g.stroke();
    g.strokeStyle = cols[i % 3]; g.lineWidth = 2.5; g.stroke();
    ell(g, x + bend, 72 - h - 4, 3.2, 7, cols[(i + 1) % 3], OUT, 2);
  }
  return c;
}
// green rows: cabbages and leeks
function cabbage(rng) {
  const { c, g } = mk(72, 44);
  for (let i = 0; i < 3; i++) {
    const x = 14 + i * 22 + (rng() - 0.5) * 4;
    ell(g, x, 30, 12, 9, '#5f9a3e', OUT, 2.5);
    ell(g, x - 1, 28, 7, 5.5, '#9ccc6a', null);
    g.beginPath(); g.moveTo(x, 34); g.lineTo(x, 24); g.strokeStyle = '#4a7a30'; g.lineWidth = 1.5; g.stroke();
  }
  return c;
}
function pumpkin(rng) {
  const { c, g } = mk(64, 48);
  const n = 1 + Math.floor(rng() * 2);
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 32 : 20 + i * 24, r = n === 1 ? 18 : 13;
    ell(g, x, 46 - r * 0.8, r, r * 0.8, '#e8862a', OUT, 2.5);
    for (const dx of [-0.45, 0, 0.45]) ell(g, x + dx * r, 46 - r * 0.8, r * 0.28, r * 0.75, null, '#b85a1a', 1.5);
    rrect(g, x - 2, 46 - r * 1.6 - 4, 4, 8, 2, '#5a7a30', OUT, 1.5);
  }
  return c;
}
function haystack() {
  const { c, g } = mk(112, 96);
  g.beginPath(); g.moveTo(8, 92); g.quadraticCurveTo(10, 14, 56, 8); g.quadraticCurveTo(102, 14, 104, 92); g.closePath();
  g.fillStyle = '#d8b04a'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 4; g.stroke();
  for (let i = 0; i < 14; i++) { const x = 18 + i * 6; g.beginPath(); g.moveTo(x, 88); g.quadraticCurveTo(x + 2, 50, 56 + (x - 56) * 0.4, 20); g.strokeStyle = i % 2 ? '#b8903a' : '#ecc868'; g.lineWidth = 2; g.stroke(); }
  rrect(g, 10, 58, 92, 6, 3, '#8a5a33', OUT, 2); // the binding rope
  return c;
}
function scarecrow() {
  const { c, g } = mk(96, 150);
  rrect(g, 44, 40, 8, 108, 3, '#7a5232');
  rrect(g, 8, 56, 80, 7, 3, '#7a5232');
  poly(g, [[22, 58], [74, 58], [68, 104], [28, 104]], '#4a78b5', OUT, 3);            // a patched shirt
  rrect(g, 52, 70, 10, 10, 2, '#c8463c', OUT, 1.5);
  for (const x of [10, 86]) for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x + (x < 48 ? -6 : 6), 60 + i * 6); g.strokeStyle = '#d8b04a'; g.lineWidth = 2.5; g.stroke(); }
  ell(g, 48, 40, 15, 14, '#e8d6a0', OUT, 3);                                       // a sack head
  g.fillStyle = OUT; g.fillRect(41, 37, 4, 4); g.fillRect(52, 37, 4, 4); g.fillRect(42, 46, 13, 2);
  poly(g, [[22, 30], [74, 30], [62, 24], [56, 6], [40, 6], [34, 24]], '#c8a050', OUT, 3); // a straw hat
  return c;
}
// an archery target on a little stand: straw boss, painted rings
function target() {
  const { c, g } = mk(96, 120);
  for (const [x0, x1] of [[26, 18], [70, 78]]) { g.beginPath(); g.moveTo(x0, 60); g.lineTo(x1, 118); g.strokeStyle = OUT; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#7a5232'; g.lineWidth = 4.5; g.stroke(); }
  ell(g, 48, 52, 38, 38, '#d8b04a', OUT, 4);
  for (const [r, col] of [[30, '#f4ecd8'], [22, '#3a6aa8'], [14, '#c8463c'], [6, '#f2cf3a']]) ell(g, 48, 52, r, r, col, OUT, 1.5);
  g.beginPath(); g.moveTo(52, 50); g.lineTo(76, 34); g.strokeStyle = '#5a3a22'; g.lineWidth = 2.5; g.stroke(); // an arrow in it
  poly(g, [[74, 30], [82, 30], [78, 38]], '#f4ecd8', OUT, 1.5);
  return c;
}
// a drying rack: two posts, a pole, hides stretched on it
function rack() {
  const { c, g } = mk(130, 110);
  for (const x of [14, 116]) rrect(g, x - 4, 14, 8, 94, 3, '#7a5232');
  rrect(g, 6, 12, 118, 8, 3, '#8a5a33');
  const hides = [['#8a8e96', 22], ['#7a5232', 50], ['#c8a878', 80]];
  for (const [col, x] of hides) {
    poly(g, [[x, 20], [x + 26, 20], [x + 30, 40], [x + 24, 72], [x + 13, 66], [x + 2, 72], [x - 4, 40]], col, OUT, 3);
    for (const [px, py] of [[x + 2, 22], [x + 24, 22]]) circleFill(g, px, py, 2, '#3e2c20');
  }
  return c;
}
function woodpile() {
  const { c, g } = mk(112, 72);
  const rows = [[60, 5], [42, 4], [24, 3]];
  rows.forEach(([y, n], r) => {
    for (let i = 0; i < n; i++) {
      const x = 56 - (n - 1) * 10 + i * 20;
      ell(g, x, y, 10, 10, '#c99a63', OUT, 2.5);
      ell(g, x, y, 5, 5, null, '#9a7044', 1.5);
      void r;
    }
  });
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

// Recolouring a sheet band by band of hue (people dressed from a bald body, bloops in new colours).
// Skin, hair, steel and crystals are left alone (too pale, too grey, or skin-toned).
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function hsl2rgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
// bands: [test(h, s, l), to(h, s, l) -> [h, s, l]]. details (optional), drawn after, by band:
//   trim: { band, to: [h, s, l] }: the band's lower edge (where the pixel below is something else) in a new colour
//   dots: { band, to, every }: a sprinkle of single pixels inside the band (rivets, runes)
const recolorer = (bands, details = []) => (px, w) => {
  const which = new Int8Array(px.length / 4).fill(-1);
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 8) continue;
    const [h, s, l] = rgb2hsl(px[i], px[i + 1], px[i + 2]);
    for (let b = 0; b < bands.length; b++) {
      const [test, to] = bands[b];
      if (!test(h, s, l)) continue;
      const [r, g, bl] = hsl2rgb(...to(h, s, l));
      px[i] = r; px[i + 1] = g; px[i + 2] = bl;
      which[i / 4] = b;
      break;
    }
  }
  if (!w) return;
  const n = which.length, set = (k, [h, s, l]) => { const [r, g, b] = hsl2rgb(h, s, l); px[k * 4] = r; px[k * 4 + 1] = g; px[k * 4 + 2] = b; };
  for (const d of details) {
    for (let k = 0; k < n; k++) {
      if (which[k] !== d.band) continue;
      const x = k % w, y = (k / w) | 0;
      if (d.trim && k + w < n && which[k + w] !== d.band && px[(k + w) * 4 + 3] > 8) set(k, d.trim);
      else if (d.dots && x % d.every === (y * 3) % d.every && which[k - 1] === d.band && which[k + 1] === d.band && which[k - w] === d.band && which[k + w] === d.band) set(k, d.dots);
    }
  }
};
const navy = (h, s, l) => h > 195 && h < 265 && s > 0.12 && l < 0.8; // the navy gambeson / the blue robe
const crimson = (h, s) => (h > 325 || h < 8) && s > 0.45;              // the Blader's sash
const silver = (h, s, l) => s < 0.15 && l > 0.5 && l < 0.8;             // the Sorcerer's trims

// a Bloop in another colour: its body (the green Bloop's hues 50-150, or the Blue Bloop's) turned to
// hue, its saturation scaled, its lightness scaled and lifted; the outline and the eyes stay
const GREEN_BODY = (h, s) => h > 50 && h < 150 && s > 0.08;
const BLUE_BODY = (h, s, l) => h > 160 && h < 235 && s > 0.2 && l > 0.28;
const bloopColour = (hue, sat, light, lift = 0, body = GREEN_BODY) => recolorer([[body, (h, s, l) => [hue, Math.min(1, s * sat), Math.min(0.88, l * light + lift)]]]);

// The PixelLab bosses (Giant Sprout, King Crab, Giant Mushroom, Giant Beetle): their kind's sheet
// redone as a boss of its own, not a tinted copy. Each part is found by its colour and given a ramp
// of its own (parts: [test(h, s, l), to(h, s, l)], the first that fits), then marks(px, w, part,
// box) paints details over chosen parts (part: each pixel's part index, -1 for none; box: the
// figure's bounds), and the upper rim of the silhouette catches the light of the boss's aura.
function bossLook(parts, rim, marks) {
  const [rr, rg, rb] = [1, 3, 5].map((i) => parseInt(rim.slice(i, i + 2), 16));
  return (px, w) => {
    const n = px.length / 4, part = new Int8Array(n).fill(-1);
    let x0 = w, y0 = 1e9, x1 = -1, y1 = -1;
    for (let k = 0; k < n; k++) {
      if (px[k * 4 + 3] < 8) continue;
      const x = k % w, y = (k / w) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const [h, s, l] = rgb2hsl(px[k * 4], px[k * 4 + 1], px[k * 4 + 2]);
      for (let p = 0; p < parts.length; p++) {
        if (!parts[p][0](h, s, l)) continue;
        const [r, g, b] = hsl2rgb(...parts[p][1](h, s, l));
        px[k * 4] = r; px[k * 4 + 1] = g; px[k * 4 + 2] = b;
        part[k] = p;
        break;
      }
    }
    if (x1 < 0) return;
    const set = (k, hex) => { px[k * 4] = parseInt(hex.slice(1, 3), 16); px[k * 4 + 1] = parseInt(hex.slice(3, 5), 16); px[k * 4 + 2] = parseInt(hex.slice(5, 7), 16); };
    marks?.(px, w, part, { x0, y0, x1, y1 }, set);
    // the rim: the first pixel inside the outline, along the top of the figure
    for (let k = 2 * w; k < n; k++) {
      if (px[k * 4 + 3] < 8 || px[(k - w) * 4 + 3] < 8 || px[(k - 2 * w) * 4 + 3] >= 8) continue;
      px[k * 4] = (px[k * 4] + rr) / 2; px[k * 4 + 1] = (px[k * 4 + 1] + rg) / 2; px[k * 4 + 2] = (px[k * 4 + 2] + rb) / 2;
    }
  };
}
const BOSS_LOOKS = {
  // the Giant Sprout: a rust-red bulb with dark ribs, deep green leaves, a thorny vine round its middle
  sproutBoss: ['sprout', bossLook([
    [(h, s, l) => h >= 12 && h < 66 && l > 0.38, (h, s, l) => [6 + (l - 0.4) * 24, 0.7, Math.min(0.62, l * 0.6)]],
    [(h, s, l) => h >= 66 && h < 140 && s > 0.25, (h, s, l) => [135, 0.55, l * 0.7]],
  ], '#ffb05a', (px, w, part, b, set) => {
    const vy = b.y0 + Math.round((b.y1 - b.y0) * 0.56);
    for (let x = b.x0; x <= b.x1; x++) {
      const y = vy + Math.round(Math.sin(x * 0.55) * 1.5), k = y * w + x;
      if (part[k] !== 0) continue;
      set(k, '#2f5a2a'); if (part[k + w] === 0) set(k + w, '#1f3e1c');
      if (x % 5 === 0 && part[k - w] === 0) set(k - w, '#e8c86a'); // thorns, catching the light
    }
  })],
  // the King Crab: a deep sea-blue shell crusted with pale barnacles, a royal blue body, gold claw tips
  crabBoss: ['crab', bossLook([
    [(h, s, l) => h >= 10 && h < 50 && s >= 0.2 && l >= 0.15 && l < 0.6, (h, s, l) => [200, 0.55, Math.min(0.7, l * 0.95)]],
    [(h, s, l) => (h >= 315 || h < 10) && s > 0.3 && l > 0.2, (h, s, l) => [222, 0.62, Math.min(0.8, l * 0.85)]],
  ], '#8adcff', (px, w, part, b, set) => {
    for (let k = 0; k < part.length; k++) {
      const x = k % w, y = (k / w) | 0;
      if (part[k] === 0 && (x * 7 + y * 13) % 23 === 0 && part[k + 1] === 0 && part[k + w] === 0) { set(k, '#e8f0f2'); set(k + 1, '#b8c8cc'); } // barnacles
      if (part[k] === 1 && (x - b.x0 < 4 || b.x1 - x < 4)) set(k, (x + y) % 3 ? '#e8b83a' : '#fff0a0'); // gold claw tips
    }
  })],
  // the Giant Mushroom: a near-black violet cap with glowing magenta spots and drips, a lilac-grey stem
  mushBoss: ['mushling', bossLook([
    [(h, s, l) => h >= 235 && h < 295 && s >= 0.4 && l < 0.62, (h, s, l) => [278, 0.55, l * 0.55]],
    [(h, s, l) => h >= 255 && h < 310 && l >= 0.62, () => [318, 0.95, 0.7]],
    [(h, s, l) => h >= 12 && h < 55 && s >= 0.3 && l >= 0.5, (h, s, l) => [268, 0.18, Math.min(0.85, l * 0.92)]],
  ], '#e08aff', (px, w, part, b, set) => {
    for (let k = 0; k < part.length - 3 * w; k++) {
      const x = k % w;
      if (part[k] !== 0 || part[k + w] === 0 || part[k + w] === 1 || px[(k + w) * 4 + 3] < 8 || x % 4) continue;
      set(k + w, '#ff6ae8'); if (px[(k + 2 * w) * 4 + 3] >= 8) set(k + 2 * w, '#c83ab8'); // drips under the cap's rim
    }
  })],
  // the Giant Beetle: a charcoal shell, its cracks glowing ember orange, dark red-brown legs
  beetleBoss: ['beetle', bossLook([
    [(h, s, l) => s < 0.22 && l >= 0.25 && l < 0.43, () => [22, 1, 0.55]],
    [(h, s, l) => s < 0.22 && l >= 0.43 && l < 0.85, (h, s, l) => [18, 0.12, l * 0.48]],
    [(h, s, l) => h >= 8 && h < 45 && s > 0.45 && l > 0.2 && l < 0.6, (h, s, l) => [6, 0.55, l * 0.62]],
  ], '#ff9a4a')],
};

// People with no sheet of their own are dressed from a bald body (see person() below): its cloth in
// their colours. Each body's cloth, by colour: the Trainee's browns, the Blader's navy gambeson and
// crimson sash (steel stays), the Sorcerer's navy robe and silver trims, the Magic Knight's purple
// and cyan. Skin is never touched (the Trainee's cloth test stops below skin's lightness)
const CLOTH = {
  trainee: { main: (h, s, l) => (h < 45 || h > 330) && s > 0.05 && l < 0.45, accent: (h, s, l) => h >= 25 && h < 60 && l >= 0.45 && s < 0.45 },
  blader: { main: navy, accent: crimson },
  sorc: { main: navy, accent: silver },
  mknight: { main: (h, s) => h > 255 && h < 325 && s > 0.1, accent: (h, s) => h > 165 && h < 215 && s > 0.35 },
};
// main / accent: [hue, saturation, lightness factor]
export const outfit = (body, { main, accent }) => recolorer([
  main && [CLOTH[body].main, (h, s, l) => [main[0], main[1], Math.min(0.92, l * (main[2] ?? 1))]],
  accent && [CLOTH[body].accent, (h, s, l) => [accent[0], accent[1], Math.min(0.92, l * (accent[2] ?? 1))]],
].filter(Boolean), main ? [{ band: 0, trim: [main[0], Math.min(0.9, main[1] + 0.1), 0.3] }] : []);

// A packed PixelLab sheet cut into textures: anims[dir][anim] = [tex], flash = white copies
// for the hit flash. Frames start blank and fill in once the sheet image has loaded.
// body = [w, h] in pixels of the standing character, used to size it in the world.
// Each texture's userData.anchor is where its animation stands, as a fraction of the frame
// height from the bottom: set it as the sprite's center so the feet stay on the ground.
// PixelLab draws some animations lower in the canvas than the standing pose, so each one gets
// its own anchor: the median of its frames' feet. Planting every frame separately would make
// the character jump by a few pixels per frame; the median keeps the animation's own bob.
function pixelSet(url, { fw, fh, body, foot = 0, hair = [], anims, bald = false, recolor = null }) {
  const at = (px) => px / fh;
  const blank = () => {
    const t = tex(mk(fw, fh).c);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  };
  const set = { pixel: true, fw, fh, body, bald, loaded: false, anchor: at(foot), hair: hair.map((c) => c.map((v) => v / 255)), anims: {}, flash: {} };
  const cuts = [];
  for (const [dir, list] of Object.entries(anims)) {
    set.anims[dir] = {};
    set.flash[dir] = {};
    for (const [anim, [row, n, feet, heads, spots]] of Object.entries(list)) {
      set.anims[dir][anim] = [];
      set.flash[dir][anim] = [];
      const anchor = feet ? at([...feet].sort((a, b) => a - b)[feet.length >> 1]) : set.anchor;
      for (let i = 0; i < n; i++) {
        const t = blank(), f = blank();
        t.userData.anchor = f.userData.anchor = anchor;
        // where the head is in this frame (frame pixels), for headgear: { x, crown, neck, w, eyes: [x, y, ...] }
        // and, on a body made bald, where the standard head is painted: its cell's top-left corner
        if (heads?.[i]) t.userData.head = f.userData.head = { x: heads[i][0], crown: heads[i][1], neck: heads[i][2], w: heads[i][3], eyes: heads[i].slice(4), at: spots?.[i] || null };
        set.anims[dir][anim].push(t);
        set.flash[dir][anim].push(f);
        cuts.push([t, f, i * fw, row * fh, dir]);
      }
    }
  }
  // draw every frame: the body, then paint(ctx, frame's userData, dir) over it (a bald body's head
  // and hair, on its pixel grid), and the white copy for the hit flash
  let paint = null;
  const img = new Image();
  const of = new Map(cuts.map((c) => [c[0], c]));
  const draw = (list = cuts) => {
    for (const [t, f, x, y, dir] of list) {
      const b = t.image.getContext('2d');
      b.clearRect(0, 0, fw, fh);
      b.drawImage(img, x, y, fw, fh, 0, 0, fw, fh);
      if (recolor) { const d = b.getImageData(0, 0, fw, fh); recolor(d.data, fw); b.putImageData(d, 0, 0); } // a second job's colours
      if (paint) paint(b, t.userData, dir);
      const g = f.image.getContext('2d');
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, fw, fh);
      g.drawImage(t.image, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, fw, fh);
      t.needsUpdate = f.needsUpdate = true;
    }
  };
  set.dress = (fn) => { paint = fn; if (set.loaded) draw(); };
  set.repaint = (t) => { if (set.loaded && of.has(t)) draw([of.get(t)]); }; // one frame (an animated hat)
  img.onload = () => { set.loaded = true; draw(); };
  img.src = url;
  return set;
}

// A hand-painted monster (painted.js) as a sprite set shaped like pixelSet's: the same anims and
// white flash copies, drawn at once. body = the standing figure's [w, h] in pixels.
function paintedSet(id, body) {
  const [fw, fh] = frameSize(id);
  return codeSet(paintSet(id), fw, fh, body, 2 / fh); // painted.js stands the feet two rows above the frame's bottom
}
// frames painted in code ({ dir: { anim: [canvas] } }) as a sprite set; anchor: where the feet are,
// as a share of the frame height from the bottom
function codeSet(frames, fw, fh, body, anchor) {
  const set = { pixel: true, fw, fh, body, bald: false, loaded: true, anchor, hair: [], anims: {}, flash: {}, dress() {}, repaint() {} };
  const nearest = (c) => { const t = tex(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.userData.anchor = anchor; return t; };
  for (const [dir, list] of Object.entries(frames)) {
    set.anims[dir] = {};
    set.flash[dir] = {};
    for (const [anim, canvases] of Object.entries(list)) {
      set.anims[dir][anim] = canvases.map(nearest);
      set.flash[dir][anim] = canvases.map((c) => {
        const w = mk(fw, fh);
        w.g.drawImage(c, 0, 0);
        w.g.globalCompositeOperation = 'source-in';
        w.g.fillStyle = '#ffffff';
        w.g.fillRect(0, 0, fw, fh);
        return nearest(w.c);
      });
    }
  }
  return set;
}

// The hero's body for a job, painted in code (trainees.js, bladers.js, mages.js, mknights.js) on the
// bald bodies' frame: a sprite set shaped like pixelSet's, standing, walking (8) and attacking (7), with
// each frame's head spot (sunk with the body on the walk) so the shared head, hair and headgear are
// painted on by dress() like on any bald body. Painting is the slow part, so the standing frames are
// painted at once, the rest a few at a time in the background, and a frame shown before its turn
// (ensure, from the Player) is painted right then.
const DESIGNS = {
  trainee: drawTrainee, blader: drawBlader, master: drawBlader, sorc: drawMage, wiz: drawMage, mknight: drawMKnight, archer: drawArcher, wind: drawArcher, moon: drawArcher,
};
function designSet(id) {
  const L = LAYOUTS['./art/trainee.json'];
  const fw = L.fw, fh = L.fh;
  const heads = Object.fromEntries(Object.entries(L.anims).map(([d, a]) => [d, a.idle[3][0]]));
  const frame = framePainter(heads, fw, DESIGNS[id.replace(/[MF]$/, '')](id));
  const foot = (dir) => (fh - (heads[dir][2] + LEGS)) / fh; // the feet, as a share of the frame from the bottom
  const set = { pixel: true, fw, fh, body: L.body, bald: true, loaded: true, anchor: foot('down'), hair: L.hair.map((c) => c.map((v) => v / 255)), anims: {}, flash: {} };
  const nearest = (c) => { const t = tex(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; };
  const cuts = [], of = new Map();
  for (const [dir, a] of Object.entries(L.anims)) {
    const h = a.idle[3][0], spot = a.idle[4][0];
    set.anims[dir] = {};
    set.flash[dir] = {};
    for (const [anim, poses] of Object.entries(POSES)) {
      set.anims[dir][anim] = [];
      set.flash[dir][anim] = [];
      poses.forEach(({ bob }, i) => {
        const t = nearest(mk(fw, fh).c), f = nearest(mk(fw, fh).c);
        t.userData.anchor = f.userData.anchor = foot(dir);
        t.userData.head = f.userData.head = { x: h[0], crown: h[1] + bob, neck: h[2] + bob, w: h[3], eyes: h.slice(4).map((v, k) => (k % 2 ? v + bob : v)), at: [spot[0], spot[1] + bob] };
        set.anims[dir][anim].push(t);
        set.flash[dir][anim].push(f);
        const c = { t, f, dir, anim, i, body: null };
        cuts.push(c);
        of.set(t, c);
      });
    }
  }
  let paint = null;
  const draw = (list) => {
    for (const c of list) {
      if (!c.body) continue; // not painted yet: drawn when it is
      const { t, f, dir } = c, b = t.image.getContext('2d');
      b.clearRect(0, 0, fw, fh);
      b.drawImage(c.body, 0, 0);
      if (paint) paint(b, t.userData, dir);
      const g = f.image.getContext('2d');
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, fw, fh);
      g.drawImage(t.image, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, fw, fh);
      t.needsUpdate = f.needsUpdate = true;
    }
  };
  const fill = (c) => { if (!c.body) { c.body = frame(c.dir, c.anim, c.i); draw([c]); } };
  set.dress = (fn) => { paint = fn; draw(cuts); };
  set.repaint = (t) => { const c = of.get(t); if (c) draw([c]); }; // one frame (an animated hat)
  set.ensure = (t) => { const c = of.get(t); if (c) fill(c); };
  cuts.filter((c) => c.anim === 'idle').forEach(fill);
  const rest = cuts.filter((c) => !c.body).sort((a, b) => (a.anim === 'walk' ? 0 : 1) - (b.anim === 'walk' ? 0 : 1)); // the walk first
  const pump = () => {
    const t0 = performance.now();
    while (rest.length && performance.now() - t0 < 6) fill(rest.shift());
    if (rest.length) setTimeout(pump, 40);
  };
  setTimeout(pump, 40);
  return set;
}

// The Keepers' butler (butler.js), painted in code on the bald bodies' frame: a sprite set shaped
// like pixelSet's, standing only, with the trainee's head spots so the shared head and hair are
// painted on by dress() like on any bald body.
function butlerSet() {
  const L = LAYOUTS['./art/trainee.json'];
  const frames = paintButler(Object.fromEntries(Object.entries(L.anims).map(([d, a]) => [d, a.idle[3][0]])));
  const set = { pixel: true, fw: BW, fh: BH, body: L.body, bald: true, loaded: true, anchor: frames.down.foot / BH, hair: L.hair.map((c) => c.map((v) => v / 255)), anims: {}, flash: {} };
  const cuts = [];
  const nearest = (c) => { const t = tex(c); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; };
  for (const [dir, a] of Object.entries(L.anims)) {
    const [, , , heads, spots] = a.idle, h = heads[0];
    const t = nearest(mk(BW, BH).c), f = nearest(mk(BW, BH).c);
    t.userData.anchor = f.userData.anchor = frames[dir].foot / BH;
    t.userData.head = f.userData.head = { x: h[0], crown: h[1], neck: h[2], w: h[3], eyes: h.slice(4), at: spots?.[0] || null };
    set.anims[dir] = { idle: [t], walk: [t], attack: [t] };
    set.flash[dir] = { idle: [f], walk: [f], attack: [f] };
    cuts.push([t, f, frames[dir].canvas, dir]);
  }
  let paint = null;
  const draw = (list = cuts) => {
    for (const [t, f, body, dir] of list) {
      const b = t.image.getContext('2d');
      b.clearRect(0, 0, BW, BH);
      b.drawImage(body, 0, 0);
      if (paint) paint(b, t.userData, dir);
      const g = f.image.getContext('2d');
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, BW, BH);
      g.drawImage(t.image, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, BW, BH);
      t.needsUpdate = f.needsUpdate = true;
    }
  };
  set.dress = (fn) => { paint = fn; draw(); };
  set.repaint = (t) => { const c = cuts.find((x) => x[0] === t); if (c) draw([c]); };
  draw();
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
  tree_birch: { w: 2.6, coll: 0.35, shadow: 1.2, space: 1.6, variants: 3, make: (r) => treeBirch(r) },
  lamp: { w: 0.45, coll: 0.15, shadow: 0.3, space: 0, variants: 1, make: () => lamp() },
  barrel: { w: 0.75, coll: 0.35, shadow: 0.5, space: 0, variants: 1, make: () => barrel() },
  crate: { w: 0.85, coll: 0.4, shadow: 0.5, space: 0, variants: 1, make: () => crate() },
  anvil: { w: 0.9, coll: 0.35, shadow: 0.5, space: 0, variants: 1, make: () => anvil() },
  // Veidheim and its lands
  tree_pine: { w: 2.4, coll: 0.35, shadow: 1.1, space: 1.5, variants: 3, make: (r) => treePine(r) },
  tree_oak: { w: 3.8, coll: 0.6, shadow: 1.9, space: 2.2, variants: 3, make: (r) => treeOak(r) },
  wheat: { w: 0.9, coll: 0, shadow: 0, space: 0.5, variants: 3, make: (r) => wheat(r) },
  cabbage: { w: 0.9, coll: 0, shadow: 0, space: 0.5, variants: 2, make: (r) => cabbage(r) },
  pumpkin: { w: 0.8, coll: 0, shadow: 0.3, space: 0.7, variants: 2, make: (r) => pumpkin(r) },
  haystack: { w: 1.8, coll: 0.75, shadow: 1.0, space: 1.8, variants: 1, make: () => haystack() },
  scarecrow: { w: 1.2, coll: 0.2, shadow: 0.4, space: 1.5, variants: 1, make: () => scarecrow() },
  target: { w: 1.2, coll: 0.4, shadow: 0.5, space: 0, variants: 1, make: () => target() },
  rack: { w: 2.0, coll: 0.5, shadow: 0.8, space: 0, variants: 1, make: () => rack() },
  woodpile: { w: 1.4, coll: 0.55, shadow: 0.7, space: 0, variants: 1, make: () => woodpile() },
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

  const sheet = (name, opts = {}) => pixelSet(SHEETS[`./art/${name}.png`], { ...LAYOUTS[`./art/${name}.json`], ...opts });
  const mobs = {
    slime: sheet('slime'),
    slimeBlue: sheet('blueslime'),
    sprout: sheet('sprout'),
    crab: sheet('crab'),
    mushling: sheet('mushling'),
    beetle: sheet('beetle'),
    wisp: sheet('wisp'),
    jarl: SHEETS['./art/jarl.png'] ? sheet('jarl') : sheet('beetle'), // the MVP (PixelLab art, packed like the rest)
    // the raid's bloops: the green Bloop's body in new colours (its blush and outline stay)
    slimeYellow: sheet('slime', { recolor: bloopColour(50, 1.7, 1.1, 0.22) }), // a bright gold
    slimeRed: sheet('blueslime', { recolor: bloopColour(354, 1.05, 1, 0, BLUE_BODY) }), // the Blue Bloop's drop, in red
    bleepBloop: codeSet(paintBleepBloop(), BBW, BBH, BB_BODY, 3 / BBH), // the raid boss, painted in code (bleepbloop.js)
  };
  // the mini-bosses drawn with PixelLab: their kind's sheet redone as a boss of its own (BOSS_LOOKS)
  for (const [id, [base, recolor]] of Object.entries(BOSS_LOOKS)) mobs[id] = sheet(base, { recolor });
  // kobolds and goblins, painted in code (painted.js) until they get PixelLab art
  for (const id of ['koboldWarrior', 'koboldArcher', 'koboldAssassin', 'goblinWarrior', 'goblinArcher', 'goblinAssassin']) mobs[id] = paintedSet(id, [16, 30]);
  for (const id of ['koboldKing', 'goblinKing']) mobs[id] = paintedSet(id, [26, 48]);
  // Veidheim's beasts: wolves, bears, snakes, willows and treants, painted in code (beasts.js)
  for (const [id, B] of Object.entries(BEASTS)) mobs[id] = codeSet(beastSet(id), ...B.size, B.body, 2 / B.size[1]);
  // the camp's and Steinborg's people (one still being drawn borrows the Elder's look)
  const villagers = {};
  for (const id of ['bram', 'tilly', 'wren', 'hild', 'gunnar', 'ragna', 'ulfr', 'saeunn', 'embla']) villagers[id] = SHEETS[`./art/${id}.png`] ? sheet(id) : null;
  villagers.embla ||= villagers.hild; // the stylist borrows the trader's look until her own is drawn
  for (const id in villagers) villagers[id] ||= villagers.bram;

  // a person dressed from a bald body: { body: trainee | blader | sorc | mknight, main, accent } (see
  // outfit), or the Keepers' butler painted in code ({ body: 'butler' }); the head, hair and headgear
  // are painted on by dressPeople (main.js) once they load
  const person = (spec) => Object.assign(spec.body === 'butler' ? butlerSet() : sheet(spec.body, { recolor: outfit(spec.body, spec) }), { person: spec });
  // the hero's job bodies (designSet), each made the first time it is worn: trainee | blader | master |
  // sorc | wiz | mknight, then M or F
  const designs = {};
  const design = (id) => (designs[id] ||= designSet(id));

  return {
    mobs,
    villagers,
    person,
    design,
    marks: { offer: tex(questMark('!', '#e3a13a')), ready: tex(questMark('?', '#5fae45')), story: tex(questMark('!', '#8a6af0')) },
    fx: { slash: tex(slashArc()), puff: tex(puff()) },
    props,
    fire: { frames: fireFrames, aspect: fireAspect, w: 1.2 },
    ground: tex(groundDetail(), { repeat: 28 }),
    shadow: tex(blobShadow()),
    water: tex(waterTex(), { repeat: 4 }),
  };
}
