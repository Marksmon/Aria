// Most art is painted into canvases at startup; the player and Green Slime are PixelLab
// sprite sheets (src/art, packed by build-tools/pack-sprites.py). Each sprite is drawn
// bottom-centered so it stands on the ground. Sizes are in world units, not pixels.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';
import playerSheet from './art/player.png';
import playerLayout from './art/player.json';
import slimeSheet from './art/slime.png';
import slimeLayout from './art/slime.json';

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

// ---------- Monsters ----------
const SLIME_GREEN = { body: '#6cc24a', dark: '#4e9a35', low: '#8fb84e', sprout: true };
const SLIME_BLUE = { body: '#5aa8e0', dark: '#3a7cb5', low: '#86b4cf', sprout: false };

// Green Slime: our own design - a moss-green blob with a leaf sprout on top.
function slime(frame, low = false, pal = SLIME_GREEN) {
  const { c, g } = mk(96, 88);
  const sx = [1, 1.14, 0.88][frame], sy = [1, 0.84, 1.14][frame];
  g.save();
  g.translate(48, 84);
  g.scale(sx, sy);
  g.translate(-48, -84);
  if (pal.sprout) {
    g.beginPath(); g.moveTo(48, 34); g.quadraticCurveTo(50, 24, 47, 16);
    g.strokeStyle = OUT; g.lineWidth = 6; g.stroke();
    g.strokeStyle = '#3f8f3a'; g.lineWidth = 3; g.stroke();
    g.save(); g.translate(47, 18); g.rotate(-0.6); ell(g, -9, 0, 10, 5, '#5fae45', OUT, 2.5); g.restore();
    g.save(); g.translate(47, 16); g.rotate(0.5); ell(g, 9, 0, 9, 4.5, '#7cc455', OUT, 2.5); g.restore();
  } else {
    // a single dew droplet floating on top
    g.beginPath(); g.moveTo(48, 12); g.quadraticCurveTo(56, 22, 48, 28); g.quadraticCurveTo(40, 22, 48, 12);
    g.fillStyle = '#bfe8ff'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 2.5; g.stroke();
  }
  // body
  g.beginPath();
  g.moveTo(10, 80);
  g.bezierCurveTo(4, 50, 26, 30, 48, 30);
  g.bezierCurveTo(70, 30, 92, 50, 86, 80);
  g.quadraticCurveTo(48, 88, 10, 80);
  g.closePath();
  g.fillStyle = low ? pal.low : pal.body; g.fill();
  g.strokeStyle = OUT; g.lineWidth = 3.5; g.stroke();
  g.beginPath(); g.moveTo(16, 76); g.quadraticCurveTo(48, 86, 80, 76); g.quadraticCurveTo(48, 80, 16, 76);
  g.fillStyle = pal.dark; g.fill();
  ell(g, 30, 46, 9, 6, 'rgba(255,255,255,.55)', null);
  circleFill(g, 24, 54, 3, 'rgba(255,255,255,.5)');
  // face
  if (low) {
    for (const x of [36, 60]) {
      g.beginPath(); g.moveTo(x - 4, 54); g.lineTo(x + 4, 62); g.moveTo(x + 4, 54); g.lineTo(x - 4, 62);
      g.strokeStyle = '#1f2a1a'; g.lineWidth = 3; g.stroke();
    }
  } else {
    ell(g, 36, 58, 4.5, 6, '#1f2a1a', null);
    ell(g, 60, 58, 4.5, 6, '#1f2a1a', null);
    circleFill(g, 34.6, 55.6, 1.8, '#fff');
    circleFill(g, 58.6, 55.6, 1.8, '#fff');
  }
  g.beginPath(); g.arc(48, 66, 4, 0.2, Math.PI - 0.2); g.strokeStyle = '#1f2a1a'; g.lineWidth = 2.2; g.stroke();
  ell(g, 27, 66, 5, 3, 'rgba(240,120,120,.45)', null);
  ell(g, 69, 66, 5, 3, 'rgba(240,120,120,.45)', null);
  g.restore();
  return c;
}

// Sproutling: a little bulb creature with a two-leaf head and stubby legs.
function sproutling(frame, angry = false) {
  const { c, g } = mk(96, 112);
  const step = frame === 1 ? 1 : -1;
  // legs
  rrect(g, 34 + step * 3, 88, 10, 18, 4, '#9a6f45');
  rrect(g, 52 - step * 3, 88, 10, 18, 4, '#9a6f45');
  // body (bulb)
  ell(g, 48, 72, 26, 24, '#d8ab72');
  g.beginPath(); g.ellipse(48, 72, 26, 24, 0, 0.15, Math.PI - 0.15);
  g.strokeStyle = '#b8874f'; g.lineWidth = 6; g.stroke();
  ell(g, 40, 62, 7, 5, 'rgba(255,245,220,.6)', null);
  // stem + leaves
  g.beginPath(); g.moveTo(48, 50); g.lineTo(48, 32); g.strokeStyle = OUT; g.lineWidth = 7; g.stroke();
  g.strokeStyle = '#4f8f3a'; g.lineWidth = 4; g.stroke();
  const leaf = (rot, col) => {
    g.save(); g.translate(48, 32); g.rotate(rot);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, -22, 30, -16); g.quadraticCurveTo(18, 4, 0, 0);
    g.fillStyle = col; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.moveTo(3, -2); g.quadraticCurveTo(14, -10, 24, -13); g.strokeStyle = 'rgba(30,60,20,.5)'; g.lineWidth = 1.5; g.stroke();
    g.restore();
  };
  leaf(-0.1 + step * 0.06, '#7cc455');
  g.save(); g.translate(96, 0); g.scale(-1, 1); leaf(-0.1 - step * 0.06, '#5fae45'); g.restore();
  // face
  ell(g, 39, 74, 3.8, 5, '#2a2018', null);
  ell(g, 57, 74, 3.8, 5, '#2a2018', null);
  circleFill(g, 38, 72, 1.5, '#fff');
  circleFill(g, 56, 72, 1.5, '#fff');
  if (angry) {
    g.beginPath(); g.moveTo(33, 64); g.lineTo(44, 68); g.moveTo(63, 64); g.lineTo(52, 68);
    g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.moveTo(43, 85); g.lineTo(48, 82); g.lineTo(53, 85); g.strokeStyle = OUT; g.lineWidth = 2.2; g.stroke();
  } else {
    g.beginPath(); g.arc(48, 81, 3, 0.2, Math.PI - 0.2); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
    ell(g, 31, 81, 4, 2.5, 'rgba(240,120,120,.45)', null);
    ell(g, 65, 81, 4, 2.5, 'rgba(240,120,120,.45)', null);
  }
  return c;
}


// Mudcrab: squat pinkish-brown crab, claws up. frame toggles claw snap.
function crab(frame) {
  const { c, g } = mk(112, 88);
  const snap = frame === 1 ? 4 : 0;
  // legs
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    g.beginPath(); g.moveTo(56 + s * 22, 62 + i * 5); g.lineTo(56 + s * (36 + i * 4), 70 + i * 5 + (frame ? (i % 2 ? 2 : -2) : 0)); g.lineTo(56 + s * (40 + i * 4), 80);
    g.strokeStyle = OUT; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#b5664a'; g.lineWidth = 3; g.stroke();
  }
  // claws
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(56 + s * 20, 52); g.lineTo(56 + s * 34, 38);
    g.strokeStyle = OUT; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#c97a5a'; g.lineWidth = 4.5; g.stroke();
    g.save(); g.translate(56 + s * 38, 30); g.rotate(s * 0.4);
    ell(g, 0, 0, 11, 9, '#d9886a');
    poly(g, [[-4, -6 - snap], [4, -14 - snap], [8, -4]], '#d9886a', OUT, 2.5);
    g.restore();
  }
  // shell
  ell(g, 56, 60, 30, 20, '#c97a5a', OUT, 3.5);
  ell(g, 56, 56, 22, 12, '#e09a78', null);
  ell(g, 48, 52, 7, 4, 'rgba(255,255,255,.45)', null);
  // eyes on stalks
  for (const x of [48, 64]) {
    g.beginPath(); g.moveTo(x, 46); g.lineTo(x, 36); g.strokeStyle = OUT; g.lineWidth = 3; g.stroke();
    ell(g, x, 34, 5, 5, '#fff', OUT, 2.5); circleFill(g, x + 1, 34, 2.4, '#1f1a18');
  }
  g.beginPath(); g.arc(56, 64, 4, 0.2, Math.PI - 0.2); g.strokeStyle = OUT; g.lineWidth = 2; g.stroke();
  return c;
}

// Mushling: a walking mushroom with a sleepy face on its stem.
function mushling(frame, puffing = false) {
  const { c, g } = mk(96, 112);
  const step = frame === 1 ? 1 : -1;
  rrect(g, 34 + step * 3, 92, 11, 14, 5, '#c9b48a');
  rrect(g, 51 - step * 3, 92, 11, 14, 5, '#c9b48a');
  rrect(g, 28, 54, 40, 44, 16, '#efe2c4');
  rrect(g, 52, 58, 12, 36, 6, '#d9c8a2', null);
  // cap
  g.beginPath(); g.ellipse(48, 56, 46, 40, 0, Math.PI, Math.PI * 2); g.closePath();
  g.fillStyle = '#7a58ad'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3.5; g.stroke();
  ell(g, 48, 57, 44, 7, '#5e447f');
  for (const [x, y, r] of [[30, 34, 6], [52, 24, 7], [68, 40, 5], [40, 46, 4]]) ell(g, x, y, r, r * 0.8, '#d8c8f0', null);
  // face
  if (puffing) {
    ell(g, 39, 74, 4, 4, '#2a2018', null); ell(g, 57, 74, 4, 4, '#2a2018', null);
    ell(g, 48, 86, 6, 5, '#2a2018', null);
  } else {
    g.beginPath(); g.moveTo(34, 74); g.quadraticCurveTo(39, 78, 44, 74); g.moveTo(52, 74); g.quadraticCurveTo(57, 78, 62, 74);
    g.strokeStyle = '#2a2018'; g.lineWidth = 2.5; g.stroke();
    g.beginPath(); g.arc(48, 84, 3, 0.2, Math.PI - 0.2); g.stroke();
  }
  ell(g, 32, 82, 4, 2.5, 'rgba(240,120,120,.45)', null);
  ell(g, 64, 82, 4, 2.5, 'rgba(240,120,120,.45)', null);
  return c;
}

// Pebble Beetle: round stony shell with pebbles stuck on, slow and sturdy.
function beetle(frame) {
  const { c, g } = mk(112, 96);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const off = (frame === 1) === (i % 2 === 0) ? 3 : -3;
    g.beginPath(); g.moveTo(56 + s * 26, 62 + i * 7); g.lineTo(56 + s * (42 + off), 74 + i * 6); g.lineTo(56 + s * (44 + off), 88);
    g.strokeStyle = OUT; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#5a4a3c'; g.lineWidth = 3; g.stroke();
  }
  // head
  ell(g, 56, 74, 18, 13, '#5a4a3c');
  ell(g, 48, 74, 4.5, 4.5, '#ffe08a', OUT, 2); ell(g, 64, 74, 4.5, 4.5, '#ffe08a', OUT, 2);
  circleFill(g, 48, 75, 2, '#2a2018'); circleFill(g, 64, 75, 2, '#2a2018');
  // shell
  g.beginPath(); g.ellipse(56, 58, 40, 34, 0, Math.PI, Math.PI * 2); g.lineTo(96, 62); g.quadraticCurveTo(56, 72, 16, 62); g.closePath();
  g.fillStyle = '#8c7d6c'; g.fill(); g.strokeStyle = OUT; g.lineWidth = 3.5; g.stroke();
  g.beginPath(); g.moveTo(56, 26); g.lineTo(56, 66); g.strokeStyle = '#5e5246'; g.lineWidth = 3; g.stroke();
  for (const [x, y, r, col] of [[36, 44, 7, '#a39b8e'], [70, 38, 8, '#b0a89a'], [44, 30, 5, '#c49670'], [78, 54, 6, '#a07558'], [30, 58, 5, '#b0a89a']]) {
    ell(g, x, y, r, r * 0.8, col, OUT, 2);
  }
  ell(g, 40, 36, 8, 4, 'rgba(255,255,255,.35)', null);
  return c;
}

// Firefly Wisp: a glowing ember with leaf-like wings. Night only.
function wisp(frame) {
  const { c, g } = mk(80, 80);
  const grd = g.createRadialGradient(40, 42, 4, 40, 42, 38);
  grd.addColorStop(0, 'rgba(255,240,150,.9)');
  grd.addColorStop(0.45, 'rgba(255,210,90,.35)');
  grd.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 80, 80);
  const flap = frame === 1 ? 0.5 : 0;
  for (const s of [-1, 1]) {
    g.save(); g.translate(40 + s * 8, 36); g.rotate(s * (0.5 + flap));
    ell(g, s * 12, -6, 13, 7, 'rgba(220,245,255,.85)', OUT, 2);
    g.restore();
  }
  ell(g, 40, 44, 12, 13, '#ffd34a', OUT, 3);
  ell(g, 37, 40, 4, 3, 'rgba(255,255,255,.8)', null);
  circleFill(g, 36, 46, 2.2, '#3a2a10'); circleFill(g, 45, 46, 2.2, '#3a2a10');
  return c;
}

// White silhouette for the hit flash
function silhouette(src) {
  const { c, g } = mk(src.width, src.height);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, c.width, c.height);
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

export function heartPath(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.3);
  g.bezierCurveTo(x, y, x - s * 0.5, y - s * 0.05, x - s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x - s * 0.5, y + s * 0.6, x - s * 0.15, y + s * 0.75, x, y + s * 0.95);
  g.bezierCurveTo(x + s * 0.15, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  g.bezierCurveTo(x + s * 0.5, y - s * 0.05, x, y, x, y + s * 0.3);
  g.closePath();
}

function heartPickup() {
  const { c, g } = mk(56, 56);
  heartPath(g, 28, 6, 46);
  g.fillStyle = '#e04a4a'; g.fill();
  g.strokeStyle = OUT; g.lineWidth = 3.5; g.stroke();
  ell(g, 18, 18, 5, 4, 'rgba(255,255,255,.6)', null);
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
function pixelSet(url, { fw, fh, body, anims }) {
  const blank = () => {
    const t = tex(mk(fw, fh).c);
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    return t;
  };
  const set = { pixel: true, fw, fh, body, anims: {}, flash: {} };
  const cuts = [];
  for (const [dir, list] of Object.entries(anims)) {
    set.anims[dir] = {};
    set.flash[dir] = {};
    for (const [anim, [row, n]] of Object.entries(list)) {
      set.anims[dir][anim] = [];
      set.flash[dir][anim] = [];
      for (let i = 0; i < n; i++) {
        const t = blank(), f = blank();
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

  const withFlash = (canvases) => ({ frames: canvases.map((c) => tex(c)), flash: canvases.map((c) => tex(silhouette(c))) });
  const mobs = {
    slime: pixelSet(slimeSheet, slimeLayout),
    sprout: { ...withFlash([0, 1].map((f) => sproutling(f))), angry: [0, 1].map((f) => tex(sproutling(f, true))), aspect: 112 / 96 },
    slimeBlue: { ...withFlash([0, 1, 2].map((f) => slime(f, false, SLIME_BLUE))), low: [0, 1, 2].map((f) => tex(slime(f, true, SLIME_BLUE))), aspect: 88 / 96 },
    crab: { ...withFlash([0, 1].map((f) => crab(f))), aspect: 88 / 112 },
    mushling: { ...withFlash([0, 1].map((f) => mushling(f))), puff: [tex(mushling(0, true))], aspect: 112 / 96 },
    beetle: { ...withFlash([0, 1].map((f) => beetle(f))), aspect: 96 / 112 },
    wisp: { ...withFlash([0, 1].map((f) => wisp(f))), aspect: 1 },
  };

  return {
    mobs,
    fx: { slash: tex(slashArc()), puff: tex(puff()), heart: tex(heartPickup()) },
    props,
    fire: { frames: fireFrames, aspect: fireAspect, w: 1.2 },
    player: pixelSet(playerSheet, playerLayout),
    ground: tex(groundDetail(), { repeat: 28 }),
    shadow: tex(blobShadow()),
    water: tex(waterTex(), { repeat: 4 }),
  };
}
