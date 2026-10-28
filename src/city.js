// Aria's walled cities (and Veidheim, the hunters' village behind its log palisade, below).
// Steinborg, the market city: grey stone walls with towers and two gates,
// timber houses with steep roofs round a fountain square, a forge, market stalls and the
// seeress's tower. Galdrheim, the city of sorcerers: pale lavender stone, purple and teal roofs,
// a glowing rune circle with a floating crystal, the Archmage's tower, a library and the
// Staffwright's workshop. Ragnarok builds its towns in 3D under 2D sprites, so a city is real
// meshes (lit by the same sun and sky, so it darkens at night) while its people stay sprites.
// Painted canvas textures throughout. Buildings between the camera and the player fade, like the
// tall trees. Each city shares the walls, houses and stalls; its layout is its own (LAYOUTS).
// Veidheim: a palisade of sharpened logs with wooden watchtowers and four gates, grass and dirt
// lanes, thatched roofs, the hunters' lodge with its antlers, an archery range, a windmill turning
// over the wheat, and a well on the green.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';
import { SOIL, cropSpots, fences } from './farm.js';

const WATER_LEVEL = -0.35; // (world.js WATER_Y: the lake's surface)

export const WALL = { x0: 9, x1: 55, z0: 9, z1: 55, t: 1.1, h: 2.8 };
export const GATE = 2.5; // half the width of a gateway
// where things stand (the people are in quests.js)
export const CITY = {
  fountain: { x: 32, z: 31, r: 2.3 },
  chest: { x: 22.6, z: 30.4 },
  stall: { x: 26.6, z: 25.4 },
};
export const HUNT = {
  well: { x: 32, z: 31, r: 1.3 },
  chest: { x: 21.8, z: 26.2 },
  stall: { x: 38, z: 27 },
  // the village's farm plots and the archery range's fence (farm.js; the range has no crop)
  plots: [{ x0: 12, z0: 37, x1: 24, z1: 45, crop: 'wheat', gate: 'e' }, { x0: 12, z0: 47, x1: 20, z1: 53, crop: 'cabbage', gate: 'e' }],
  range: { x0: 37, z0: 11.5, x1: 53, z1: 23, gate: 's' },
};
// Rytingborg, the oasis city: the lake in the middle (world.js MAPS.sand.lake), its bridges and
// island, the palace's rock at the back
export const SAND = {
  lake: { x: 32, z: 29, rx: 11.5, rz: 7.5 },
  island: { x: 32, z: 29, r: 3.4 },
  terrace: { x0: 21, z0: 9.2, x1: 50, z1: 16.4, h: 3.6 },
  chest: { x: 20.6, z: 46.8 },
  stall: { x: 28, z: 40.6 },
};
export const MAGIC = {
  circle: { x: 32, z: 33, r: 3 },
  chest: { x: 20.4, z: 44.2 },
  stall: { x: 25.8, z: 26.2 },
};

// ---------- textures ----------
function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const vary = (rng, base, k = 18) => {
  const c = new THREE.Color(base), d = (rng() - 0.5) * k / 255;
  return `rgb(${[c.r, c.g, c.b].map((v) => Math.round(Math.min(1, Math.max(0, v + d)) * 255)).join(',')})`;
};

// rough blocks of grey stone with dark mortar (one 2 x 2 unit tile)
function stoneTex(rng, base = '#9c958a', mortar = '#4e4840') {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = mortar; g.fillRect(0, 0, 128, 128);
    for (let row = 0; row < 6; row++) {
      const y = row * 21.3, off = row % 2 ? -16 : 0;
      for (let x = off; x < 128; x += 32) {
        g.fillStyle = vary(rng, base, 30);
        g.fillRect(x + 1.5, y + 1.5, 29, 18.3);
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 1.5, y + 1.5, 29, 3);
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 1.5, y + 16.8, 29, 3);
      }
    }
  }, true);
}
function cobbleTex(rng, base = '#a39b8c', gap = '#6a645a') {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = gap; g.fillRect(0, 0, 128, 128);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const x = i * 16 + (j % 2) * 8, y = j * 16;
      g.fillStyle = vary(rng, base, 34);
      g.beginPath(); g.roundRect(x + 1, y + 1, 14, 14, 5); g.fill();
      g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.roundRect(x + 2, y + 2, 10, 5, 3); g.fill();
    }
  }, true);
}
// an onion dome: a bulb swelling out over its base and drawn to a point (lathed), its base at y = 0
function onion(r, h) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, y = t * h;
    const w = t < 0.55 ? r * (1 + Math.sin((t / 0.55) * Math.PI * 0.5) * 0.18) : r * 1.18 * Math.cos(((t - 0.55) / 0.45) * Math.PI * 0.5);
    pts.push(new THREE.Vector2(Math.max(0.001, w), y));
  }
  return new THREE.LatheGeometry(pts, 18);
}
// a dome's tiles: lapis blue with lighter diamonds and gold ribs
function domeTex(rng, base) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 64; x += 8) {
      g.fillStyle = vary(rng, '#5a82d0', 30); g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 8, y + 4); g.lineTo(x + 4, y + 8); g.lineTo(x, y + 4); g.fill();
    }
    g.fillStyle = '#e3b341'; for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 2, 64);
  }, true);
}
function roofTex(rng, base) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#2e2118'; g.fillRect(0, 0, 64, 64);
    for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) {
      const x = i * 16 - (row % 2) * 8, y = row * 16;
      g.fillStyle = vary(rng, base, 26);
      g.beginPath(); g.roundRect(x + 1, y + 1, 14, 14, [0, 0, 7, 7]); g.fill();
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 1, y + 11, 14, 4);
    }
  }, true);
}
function plankTex(rng, base = '#8a5a33') {
  return canvasTex(64, 64, (g) => {
    for (let i = 0; i < 4; i++) { g.fillStyle = vary(rng, base, 24); g.fillRect(i * 16, 0, 16, 64); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(i * 16 + 15, 0, 1, 64); }
  }, true);
}
// a house wall: plaster in a dark timber frame, with windows; front = a door in the middle
function houseFace(rng, w, front, plaster = '#e8dcc0', timber = '#5a3a22', door = '#6b4426') {
  const W = Math.max(64, Math.round(w * 32)), H = 80;
  return canvasTex(W, H, (g) => {
    g.fillStyle = plaster; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rng() * 0.05})`; g.fillRect(rng() * W, rng() * H, 3, 3); }
    g.fillStyle = '#9c958a'; g.fillRect(0, H - 12, W, 12); // stone footing
    g.fillStyle = timber;
    g.fillRect(0, 0, W, 5); g.fillRect(0, H - 16, W, 5); g.fillRect(0, 0, 5, H); g.fillRect(W - 5, 0, 5, H);
    const panes = Math.max(1, Math.round(w / 2.2));
    for (let i = 1; i < panes; i++) g.fillRect((W / panes) * i - 2, 0, 4, H - 12);
    const cx = W / 2;
    const win = (x) => {
      g.fillStyle = timber; g.fillRect(x - 10, 18, 20, 22);
      g.fillStyle = '#3e5a78'; g.fillRect(x - 7, 21, 14, 16);
      g.fillStyle = '#9fc4e0'; g.fillRect(x - 7, 21, 6, 7);
      g.fillStyle = timber; g.fillRect(x - 1, 21, 2, 16); g.fillRect(x - 7, 28, 14, 2);
    };
    if (front) {
      g.fillStyle = timber; g.beginPath(); g.roundRect(cx - 13, 30, 26, H - 41, [12, 12, 0, 0]); g.fill();
      g.fillStyle = door; g.beginPath(); g.roundRect(cx - 10, 33, 20, H - 44, [10, 10, 0, 0]); g.fill();
      g.fillStyle = '#3e2c20'; g.fillRect(cx - 0.5, 33, 1, H - 44);
      g.fillStyle = '#e3b341'; g.beginPath(); g.arc(cx + 5, 54, 2, 0, 7); g.fill();
      if (W > 110) { win(cx - W * 0.3); win(cx + W * 0.3); }
    } else for (let i = 0; i < panes; i++) win((W / panes) * (i + 0.5));
  });
}
// a desert wall: sandstone plaster, pointed arched windows with blue shutters; front = an arched door
function archFace(rng, w, front, plaster = '#e8d4a8', door = '#6b4426') {
  const W = Math.max(64, Math.round(w * 32)), H = 84;
  return canvasTex(W, H, (g) => {
    g.fillStyle = plaster; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(120,80,30,${rng() * 0.07})`; g.fillRect(rng() * W, rng() * H, 3, 3); }
    g.fillStyle = 'rgba(120,80,30,.25)'; g.fillRect(0, H - 8, W, 8); g.fillRect(0, 0, W, 4);
    const arch = (x, y, w2, h2, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - w2, y + h2); g.lineTo(x - w2, y + w2); g.quadraticCurveTo(x - w2, y, x, y - w2 * 0.6); g.quadraticCurveTo(x + w2, y, x + w2, y + w2); g.lineTo(x + w2, y + h2); g.fill(); };
    const win = (x) => { arch(x, 20, 8, 18, '#a8885a'); arch(x, 22, 6, 15, '#2e3f6a'); g.fillStyle = '#5a82d0'; g.fillRect(x - 6, 30, 12, 2); };
    const cx = W / 2, n = Math.max(1, Math.round(w / 2.2));
    if (front) {
      arch(cx, 34, 13, 42, '#a8885a'); arch(cx, 37, 10, 39, door);
      g.fillStyle = '#e3b341'; g.beginPath(); g.arc(cx + 5, 58, 2, 0, 7); g.fill();
      if (W > 110) { win(cx - W * 0.3); win(cx + W * 0.3); }
    } else for (let i = 0; i < n; i++) win((W / n) * (i + 0.5));
  });
}
// a palisade: upright logs, rounded with light and shade, bound by a rope
function logTex(rng, base = '#8a6a44') {
  return canvasTex(64, 64, (g) => {
    for (let i = 0; i < 4; i++) {
      const x = i * 16;
      g.fillStyle = vary(rng, base, 26); g.fillRect(x, 0, 16, 64);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x + 3, 0, 4, 64);
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 12, 0, 4, 64);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 3; k++) g.fillRect(x + 4 + rng() * 6, rng() * 60, 2, 4);
    }
    g.fillStyle = '#5a4630'; g.fillRect(0, 20, 64, 3);
  }, true);
}
// the village green: grass with darker tufts and a few flowers
function grassTex(rng) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#6f9a48'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) { g.fillStyle = rng() < 0.5 ? '#5f8a3e' : '#84ae58'; g.fillRect(rng() * 128, rng() * 128, 2, 3); }
    for (let i = 0; i < 8; i++) { g.fillStyle = ['#f4e8a0', '#ffffff', '#e8a8c8'][i % 3]; g.fillRect(rng() * 128, rng() * 128, 2, 2); }
  }, true);
}
function dirtTex(rng) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#a88a5c'; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 120; i++) { g.fillStyle = rng() < 0.5 ? '#97794e' : '#b89a6c'; g.fillRect(rng() * 64, rng() * 64, 2, 2); }
  }, true);
}
// ploughed soil: a furrow and a ridge each pace (one texture tile = 2 paces)
function soilTex() {
  return canvasTex(32, 32, (g) => { for (let i = 0; i < 4; i++) { g.fillStyle = SOIL[i % 2]; g.fillRect(0, i * 8, 32, 8); } }, true);
}
function stripeTex(a, b) {
  return canvasTex(64, 32, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 8, 0, 8, 32); } g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 26, 64, 6); }, true);
}
function waterTex() {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = '#4f9cc0'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(10 + i * 9, 14 + (i % 3) * 16, 6, 0.2, 2.6); g.stroke(); }
  }, true);
}

// box UVs in world units (unit = size of one texture tile), so walls of any length tile evenly
function boxUV(geo, w, h, d, unit) {
  const uv = geo.attributes.uv;
  const size = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x -x +y -y +z -z
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * size[f][0] / unit, uv.getY(i) * size[f][1] / unit);
  }
  return geo;
}
function cylUV(geo, r, h, unit) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r / unit, uv.getY(i) * h / unit);
  return geo;
}
// a gable roof (ridge along x), as an extruded triangle: UVs come out in world units
function gable(w, d, rh, over = 0.35) {
  const sh = new THREE.Shape();
  sh.moveTo(-d / 2 - over, 0); sh.lineTo(d / 2 + over, 0); sh.lineTo(0, rh); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: w + over * 2, bevelEnabled: false });
  geo.translate(0, 0, -(w + over * 2) / 2);
  geo.rotateY(Math.PI / 2);
  return geo;
}

// ---------- the cities ----------
// each city's look: stone, paving, roofs, plaster, timber, the banner over its gates, tower roofs
const THEMES = {
  city: { stone: ['#9c958a', '#4e4840'], stoneDark: '#7f786e', cobble: ['#a39b8c', '#6a645a'],
    roofs: ['#a8483a', '#4a6488', '#7a5232', '#5a5a66'], towerRoof: '#a8483a',
    plaster: ['#e8dcc0', '#efe4cc', '#dccfb0', '#e6d6c2'], timber: '#5a3a22',
    // a blue banner with the city's white tower
    banner: (g) => { g.fillStyle = '#2f4f8a'; g.fillRect(0, 0, 32, 40); g.beginPath(); g.moveTo(0, 40); g.lineTo(16, 48); g.lineTo(32, 40); g.fill(); g.fillStyle = '#f2ead8'; g.fillRect(11, 12, 10, 20); g.fillRect(9, 9, 4, 4); g.fillRect(14, 9, 4, 4); g.fillRect(19, 9, 4, 4); } },
  magic: { stone: ['#b4afc6', '#5a5470'], stoneDark: '#8a84a2', cobble: ['#aaa6be', '#6a6680'],
    roofs: ['#5a3a7a', '#2f6f78', '#3d4a8a', '#7a4a8a'], towerRoof: '#5a3a7a',
    plaster: ['#dcd6ea', '#d2dbe6', '#e4dcf0', '#cfd8e8'], timber: '#3a2e4a',
    // a violet banner with a gold eight-pointed star
    banner: (g) => {
      g.fillStyle = '#4a2f7a'; g.fillRect(0, 0, 32, 40); g.beginPath(); g.moveTo(0, 40); g.lineTo(16, 48); g.lineTo(32, 40); g.fill();
      g.fillStyle = '#f0c850'; g.beginPath();
      for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r = i % 2 ? 4 : 10; g.lineTo(16 + Math.sin(a) * r, 20 - Math.cos(a) * r); }
      g.fill();
    } },
  // Veidheim: log palisade, thatch and turf roofs, a green banner with a white bow
  hunt: { stone: ['#8a6a44', '#5a4630'], stoneDark: '#6a5034', cobble: ['#a88a5c', '#7a6040'], wood: true, green: true,
    roofs: ['#c8a050', '#b8903a', '#5f7a3a', '#a8483a'], towerRoof: '#7a5a3a',
    plaster: ['#e8dcc0', '#efe4cc', '#dccfb0', '#e6d6c2'], timber: '#5a3a22',
    banner: (g) => {
      g.fillStyle = '#3f6a3a'; g.fillRect(0, 0, 32, 40); g.beginPath(); g.moveTo(0, 40); g.lineTo(16, 48); g.lineTo(32, 40); g.fill();
      g.strokeStyle = '#f2ead8'; g.lineWidth = 2.5; g.beginPath(); g.arc(10, 20, 11, -1.1, 1.1); g.stroke(); // the bow
      g.lineWidth = 1; g.beginPath(); g.moveTo(10 + Math.cos(-1.1) * 11, 20 + Math.sin(-1.1) * 11); g.lineTo(10 + Math.cos(1.1) * 11, 20 + Math.sin(1.1) * 11); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.moveTo(8, 20); g.lineTo(27, 20); g.stroke(); // the arrow
      g.fillStyle = '#f2ead8'; g.beginPath(); g.moveTo(29, 20); g.lineTo(25, 17); g.lineTo(25, 23); g.fill();
    } },
  // Rytingborg: sandstone walls, onion domes of lapis blue tipped with gold; a blue banner with a gold
  // dagger over a palm
  sand: { stone: ['#d8b880', '#8a6a40'], stoneDark: '#c09a62', cobble: ['#e2cc9e', '#a89070'], sand: true, dome: true,
    roofs: ['#2e4f9a', '#3a6ab8', '#3a9a8a', '#c8a050'], towerRoof: '#2e4f9a',
    plaster: ['#e8d4a8', '#efdcb4', '#e2c898', '#f2e2c0'], timber: '#8a6a40',
    banner: (g) => {
      g.fillStyle = '#2a3f8a'; g.fillRect(0, 0, 32, 40); g.beginPath(); g.moveTo(0, 40); g.lineTo(16, 48); g.lineTo(32, 40); g.fill();
      g.strokeStyle = '#f0c850'; g.lineWidth = 1.5; g.strokeRect(2, 2, 28, 37);
      g.fillStyle = '#f0c850';
      for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { g.save(); g.translate(16, 16); g.rotate(a); g.beginPath(); g.ellipse(0, -6, 2, 6, 0, 0, 7); g.fill(); g.restore(); } // the palm's crown
      g.fillRect(15, 6, 2, 30); g.fillRect(10, 26, 12, 2); // the dagger: blade and guard
      g.beginPath(); g.moveTo(16, 4); g.lineTo(18, 8); g.lineTo(14, 8); g.fill();
      g.fillRect(15, 28, 2, 6); g.beginPath(); g.arc(16, 35, 2, 0, 7); g.fill();
    } },
};

// ctx: { group, lib, heightAt, place(type, x, z, force), addBox(x0, z0, x1, z1, kind), addSolid(x, z, r), boxes,
//   gates: the gateways, [{ side: 'n' | 's' | 'e' | 'w', c: where along that wall }] (or just 's' for the middle) };
//   variant: 'city' (Steinborg) | 'magic' (Galdrheim) | 'hunt' (Veidheim)
export function buildCity(ctx, variant = 'city') {
  const { group, place, addBox, addSolid } = ctx;
  const T = THEMES[variant];
  const rng = mulberry32({ city: 512, magic: 733, hunt: 911, sand: 1213 }[variant]);
  const fades = []; // { meshes, x, z, r, h }
  const fadeMats = new Map();
  const anims = []; // (now) => void: boats drifting, waterfalls running
  const spin = []; // meshes that turn and bob: floating crystals
  const turn = []; // meshes that turn on their own axis: windmill sails
  const lam = (opts) => new THREE.MeshLambertMaterial(opts);
  const M = {
    stone: lam({ map: T.wood ? logTex(rng, T.stone[0]) : stoneTex(rng, ...T.stone) }),
    stoneDark: lam({ map: T.wood ? logTex(rng, T.stoneDark) : stoneTex(rng, T.stoneDark, T.stone[1]) }),
    cobble: lam({ map: T.wood ? dirtTex(rng) : cobbleTex(rng, ...T.cobble), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    floor: T.green ? lam({ map: grassTex(rng), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }) : null,
    roofs: T.roofs.map((c) => lam({ map: roofTex(rng, c) })),
    towerRoof: lam({ map: roofTex(rng, T.towerRoof) }),
    roofPurple: lam({ map: roofTex(rng, '#5a3a7a') }),
    plank: lam({ map: plankTex(rng) }),
    plankDark: lam({ map: plankTex(rng, '#5a3a22') }),
    water: lam({ map: waterTex(), color: '#bfe6ff' }),
    gold: lam({ color: '#e3b341' }),
    dome: T.dome ? lam({ map: domeTex(rng, T.roofs[0]) }) : null,
  };
  M.cobble.map.repeat.set(1, 1);
  for (const m of [...M.roofs, M.towerRoof, M.roofPurple]) m.map.repeat.set(0.8, 0.8);
  const faded = (m) => {
    if (!fadeMats.has(m)) {
      const f = m.clone();
      f.transparent = true; f.opacity = 0.18; f.depthWrite = false;
      fadeMats.set(m, f);
    }
    return fadeMats.get(m);
  };
  const mesh = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const fadeable = (meshes, x, z, r, h) => {
    for (const m of meshes) m.userData.solid = m.material;
    fades.push({ meshes, x, z, r, h });
  };
  const Y = 0.05; // the city floor is flat
  // where each wall has its gateway: side -> its middle along the wall (undefined: no gate)
  const gateAt = {};
  for (const g of ctx.gates || ['s', 'e']) { const o = typeof g === 'string' ? { side: g, c: 32 } : g; gateAt[o.side] = o.c; }

  // ---------- paving ----------
  const pw = WALL.x1 - WALL.x0, pd = WALL.z1 - WALL.z0;
  const pave = new THREE.PlaneGeometry(pw, pd);
  pave.rotateX(-Math.PI / 2);
  const puv = pave.attributes.uv;
  for (let i = 0; i < puv.count; i++) puv.setXY(i, puv.getX(i) * pw / 2, puv.getY(i) * pd / 2);
  if (!T.sand) mesh(pave, M.floor || M.cobble, (WALL.x0 + WALL.x1) / 2, Y + 0.02, (WALL.z0 + WALL.z1) / 2).renderOrder = 0; // (Rytingborg's floor is the sand, its lake and its own paving)
  // paved roads out through the gates
  const G = gateAt;
  for (const [x, z, w, d] of [G.s !== undefined && [G.s, 58.5, GATE * 2, 7], G.n !== undefined && [G.n, 5.5, GATE * 2, 7],
    G.e !== undefined && [58.5, G.e, 7, GATE * 2], G.w !== undefined && [5.5, G.w, 7, GATE * 2]].filter(Boolean)) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    const u = g.attributes.uv;
    for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 2, u.getY(i) * d / 2);
    mesh(g, M.cobble, x, ctx.heightAt(x, z) + 0.03, z);
  }

  // ---------- walls, gates and towers ----------
  const { x0, x1, z0, z1, t, h } = WALL;
  const side = (fixed, a, b, c) => (c !== undefined ? [[fixed, a, c - GATE], [fixed, c + GATE, b]] : [[fixed, a, b]]);
  const runs = [ // [axis, fixed, from, to]
    ...side(z0, x0, x1, G.n).map((r) => ['x', ...r]),
    ...side(z1, x0, x1, G.s).map((r) => ['x', ...r]),
    ...side(x0, z0, z1, G.w).map((r) => ['z', ...r]),
    ...side(x1, z0, z1, G.e).map((r) => ['z', ...r]),
  ];
  const merlon = T.wood ? new THREE.ConeGeometry(0.2, 0.7, 5) : new THREE.BoxGeometry(0.55, 0.55, 0.55);
  for (const [axis, fixed, a, b] of runs) {
    const n = Math.ceil((b - a) / 6);
    for (let i = 0; i < n; i++) {
      const s = a + ((b - a) * i) / n, e = a + ((b - a) * (i + 1)) / n, len = e - s, mid = (s + e) / 2;
      const [w, d] = axis === 'x' ? [len, t] : [t, len];
      const [cx, cz] = axis === 'x' ? [mid, fixed] : [fixed, mid];
      const wall = mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 2), M.stone, cx, Y + h / 2, cz);
      const parts = [wall];
      // battlements on the outer edge of the walkway (a palisade: a sharpened point on every log)
      const out = T.wood ? 0 : (fixed < 32 ? -1 : 1) * (t / 2 - 0.28);
      for (let k = T.wood ? 0.25 : 0.5; k < len; k += T.wood ? 0.5 : 1.1) {
        const p = s + k;
        parts.push(mesh(merlon, M.stoneDark, axis === 'x' ? p : fixed + out, Y + h + (T.wood ? 0.35 : 0.27), axis === 'x' ? fixed + out : p));
      }
      addBox(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 'wall');
      fadeable(parts, cx, cz, len / 2, h + 0.6);
    }
  }
  // towers at the corners and beside each gateway; an arch over each gateway
  const towers = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
  if (G.s !== undefined) towers.push([G.s - GATE - 0.6, z1], [G.s + GATE + 0.6, z1]);
  if (G.n !== undefined) towers.push([G.n - GATE - 0.6, z0], [G.n + GATE + 0.6, z0]);
  if (G.e !== undefined) towers.push([x1, G.e - GATE - 0.6], [x1, G.e + GATE + 0.6]);
  if (G.w !== undefined) towers.push([x0, G.w - GATE - 0.6], [x0, G.w + GATE + 0.6]);
  const orb = variant === 'magic' ? new THREE.MeshBasicMaterial({ color: '#9fe8ff' }) : null;
  for (const [tx, tz] of towers) {
    const r = 1.25, th = h + 1.5;
    // a watchtower of logs: square, a pyramid roof on four posts over the platform
    const body = T.wood ? mesh(boxUV(new THREE.BoxGeometry(r * 1.7, th, r * 1.7), r * 1.7, th, r * 1.7, 2), M.stone, tx, Y + th / 2, tz)
      : mesh(cylUV(new THREE.CylinderGeometry(r, r * 1.08, th, 14), r, th, 2), M.stone, tx, Y + th / 2, tz);
    const roofGeo = T.wood ? new THREE.ConeGeometry(r * 1.45, 1.5, 4) : T.dome ? onion(r * 1.05, 1.9) : new THREE.ConeGeometry(r * 1.3, variant === 'magic' ? 2.6 : 1.8, 14);
    if (T.wood) roofGeo.rotateY(Math.PI / 4);
    const roof = mesh(roofGeo, T.dome ? M.dome : M.towerRoof, tx, Y + th + (T.wood ? 1.55 : T.dome ? 0 : variant === 'magic' ? 1.3 : 0.9), tz);
    const parts = [body, roof];
    if (T.dome) parts.push(mesh(new THREE.ConeGeometry(0.1, 0.9, 6), M.gold, tx, Y + th + 2.3, tz)); // a gold spike on each dome
    if (T.wood) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(mesh(new THREE.BoxGeometry(0.14, 0.85, 0.14), M.plankDark, tx + sx * r * 0.75, Y + th + 0.42, tz + sz * r * 0.75));
    if (orb) { const o = mesh(new THREE.OctahedronGeometry(0.28), orb, tx, Y + th + 3.2, tz); spin.push(o); parts.push(o); } // a crystal over each tower
    addSolid(tx, tz, r);
    fadeable(parts, tx, tz, r, th + 3);
  }
  for (const [ax, gx, gz] of [G.s !== undefined && ['x', G.s, z1], G.n !== undefined && ['x', G.n, z0], G.e !== undefined && ['z', x1, G.e], G.w !== undefined && ['z', x0, G.w]].filter(Boolean)) {
    const out = (ax === 'x' ? gz : gx) < 32 ? -1 : 1; // which face of the wall is the outside
    const span = GATE * 2 + 1.2, lw = ax === 'x' ? span : t + 0.2, ld = ax === 'x' ? t + 0.2 : span;
    const lintel = mesh(boxUV(new THREE.BoxGeometry(lw, 1.0, ld), lw, 1, ld, 2), M.stoneDark, gx, Y + h + 0.1, gz);
    const ban = canvasTex(32, 48, T.banner);
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.35), lam({ map: ban, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    bm.position.set(gx + (ax === 'x' ? 0 : out * (t / 2 + 0.12)), Y + h - 0.6, gz + (ax === 'x' ? out * (t / 2 + 0.12) : 0));
    if (ax === 'z') bm.rotation.y = Math.PI / 2;
    group.add(bm);
    fadeable([lintel, bm], gx, gz, span / 2, h + 1);
  }

  // ---------- houses and stalls ----------
  function house(x, z, w, d, opts = {}) {
    const wh = opts.h || 2.3, rh = opts.roof || 1.6;
    const plaster = opts.plaster || T.plaster[Math.floor(rng() * T.plaster.length)];
    const front = lam({ map: houseFace(rng, w, true, plaster, T.timber) });
    const sideM = lam({ map: houseFace(rng, d, false, plaster, T.timber) });
    const back = lam({ map: houseFace(rng, w, false, plaster, T.timber) });
    const body = mesh(new THREE.BoxGeometry(w, wh, d), [sideM, sideM, M.plankDark, M.plankDark, front, back], x, Y + wh / 2, z);
    const roofMat = opts.roofMat || M.roofs[Math.floor(rng() * M.roofs.length)];
    const roof = mesh(gable(w, d, rh), [lam({ map: houseFace(rng, d, false, plaster, T.timber) }), roofMat], x, Y + wh, z);
    const parts = [body, roof];
    if (opts.chimney) parts.push(mesh(boxUV(new THREE.BoxGeometry(0.6, 1.4, 0.6), 0.6, 1.4, 0.6, 2), M.stoneDark, x + w * 0.28, Y + wh + rh * 0.7, z - d * 0.15));
    addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
    fadeable(parts, x, z, Math.max(w, d) / 2, wh + rh);
    return parts;
  }
  function stall(x, z, cloth) {
    const w = 3.2, d = 1.3;
    const parts = [mesh(boxUV(new THREE.BoxGeometry(w, 0.9, d), w, 0.9, d, 1), M.plank, x, Y + 0.45, z)];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(mesh(new THREE.BoxGeometry(0.12, 2.1, 0.12), M.plankDark, x + sx * (w / 2 - 0.1), Y + 1.05, z + sz * (d / 2 - 0.1)));
    const can = mesh(new THREE.BoxGeometry(w + 0.5, 0.08, d + 0.9), lam({ map: cloth }), x, Y + 2.15, z + 0.15);
    can.rotation.x = 0.22;
    parts.push(can);
    addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
    fadeable(parts, x, z, w / 2, 2.4);
  }
  // a round tower: body, cone roof, an arched door facing south
  function tower(tx, tz, r, th, roofMat, doorCol = '#5a3a7a', glow = '#c8a0ff') {
    const body = mesh(cylUV(new THREE.CylinderGeometry(r, r * 1.1, th, 16), r, th, 2), M.stone, tx, Y + th / 2, tz);
    const roof = mesh(new THREE.ConeGeometry(r * 1.35, r * 1.45, 16), roofMat, tx, Y + th + r * 0.72, tz);
    const doorTex = canvasTex(32, 48, (g) => { g.fillStyle = '#3e2c20'; g.beginPath(); g.roundRect(2, 4, 28, 44, [14, 14, 0, 0]); g.fill(); g.fillStyle = doorCol; g.beginPath(); g.roundRect(5, 7, 22, 41, [11, 11, 0, 0]); g.fill(); g.fillStyle = glow; g.beginPath(); g.arc(16, 20, 3, 0, 7); g.fill(); });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), lam({ map: doorTex, transparent: true, alphaTest: 0.5 }));
    door.position.set(tx, Y + 0.82, tz + r * 1.02);
    group.add(door);
    addSolid(tx, tz, r + 0.1);
    fadeable([body, roof, door], tx, tz, r, th + r * 1.5);
    return [body, roof, door];
  }
  const P = (type, x, z) => place(type, x, z, true);
  const api = { M, Y, rng, mesh, lam, house, stall, tower, fadeable, spin, turn, anims, P, addBox, addSolid, group, T, ctx };
  const extra = LAYOUTS[variant](api);

  // ---------- minimap ----------
  function minimap(mg) {
    mg.fillStyle = { magic: '#b6b0c8', hunt: '#7aa050', sand: '#e2cc9a' }[variant] || '#b3ab9c';
    mg.fillRect(x0 * 2, z0 * 2, (x1 - x0) * 2, (z1 - z0) * 2);
    extra?.underlay?.(mg);
    mg.fillStyle = variant === 'magic' ? '#5a3a7a' : '#8a5a3a';
    for (const b of ctx.boxes) if (b.kind !== 'wall') mg.fillRect(b.x0 * 2, b.z0 * 2, (b.x1 - b.x0) * 2, (b.z1 - b.z0) * 2);
    mg.fillStyle = '#5a5650';
    for (const b of ctx.boxes) if (b.kind === 'wall') mg.fillRect(b.x0 * 2, b.z0 * 2, (b.x1 - b.x0) * 2, (b.z1 - b.z0) * 2);
    extra?.minimap?.(mg);
  }

  // fade what stands between the camera and the player (and turn the floating crystals)
  function occlude(px, pz, cam) {
    const now = performance.now() / 1000;
    for (const m of spin) { m.rotation.y = now * 0.8; m.position.y = (m.userData.y0 ??= m.position.y) + Math.sin(now * 1.6 + m.position.x) * 0.12; }
    for (const m of turn) m.rotation.z = now * 0.7;
    for (const a of anims) a(now);
    for (const f of fades) {
      const dx = f.x - px, dz = f.z - pz;
      let fade = false;
      if (Math.abs(dx) < 8 + f.r && Math.abs(dz) < 8 + f.r) {
        const along = dx * cam.fx + dz * cam.fz, sideD = dx * cam.rx + dz * cam.rz;
        fade = along < 0.4 + f.r * 0.5 && along > -f.h * 1.1 - f.r && Math.abs(sideD) < f.r + 0.6;
      }
      for (const m of f.meshes) {
        const want = fade ? (Array.isArray(m.userData.solid) ? m.userData.solid.map(faded) : faded(m.userData.solid)) : m.userData.solid;
        if (m.material !== want && (!Array.isArray(want) || m.material[0] !== want[0])) m.material = want;
      }
    }
  }
  return { occlude, minimap };
}

const LAYOUTS = {
  // ---------- Veidheim, the hunters' village ----------
  hunt({ M, Y, rng, mesh, lam, house, stall, tower, fadeable, turn, P, addBox, addSolid, group }) {
    const [thatch, thatch2, turf, barnRed] = M.roofs;
    const flatPlane = (w, d, mat, x, z, y = Y + 0.03) => {
      const g = new THREE.PlaneGeometry(w, d);
      g.rotateX(-Math.PI / 2);
      const u = g.attributes.uv;
      for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 2, u.getY(i) * d / 2);
      return mesh(g, mat, x, y, z);
    };
    // dirt lanes from gate to gate, crossing on the green round the well
    flatPlane(4, 46, M.cobble, 32, 32);
    flatPlane(46, 4, M.cobble, 32, 32, Y + 0.035);
    {
      const g = new THREE.CircleGeometry(4.6, 24);
      g.rotateX(-Math.PI / 2);
      const u = g.attributes.uv;
      for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * 4.6, u.getY(i) * 4.6);
      mesh(g, M.cobble, HUNT.well.x, Y + 0.04, HUNT.well.z);
    }

    // the hunters' lodge: a long hall with a turf roof, antlers over its door
    house(19, 15.2, 12, 6, { h: 3.0, roof: 2.6, roofMat: turf, plaster: '#d8c8a8', chimney: true });
    {
      const antlers = canvasTex(64, 40, (g) => {
        g.strokeStyle = '#2e2118'; g.lineWidth = 6; g.lineCap = 'round';
        const draw = (col, lw) => {
          g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
          for (const s of [-1, 1]) {
            g.moveTo(32, 32); g.quadraticCurveTo(32 + s * 20, 30, 32 + s * 26, 6);
            g.moveTo(32 + s * 14, 28); g.lineTo(32 + s * 12, 12);
            g.moveTo(32 + s * 22, 20); g.lineTo(32 + s * 30, 16);
          }
          g.stroke();
        };
        draw('#2e2118', 6); draw('#e8dcc0', 3);
        g.fillStyle = '#7a5232'; g.beginPath(); g.ellipse(32, 33, 7, 6, 0, 0, 7); g.fill(); // the shield board
      });
      const a = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), lam({ map: antlers, transparent: true, alphaTest: 0.5 }));
      a.position.set(19, Y + 3.5, 18.25);
      group.add(a);
    }
    house(13.8, 24.2, 5, 5, { roofMat: thatch, chimney: true });
    P('chest', HUNT.chest.x, HUNT.chest.z); // the storehouse chest, by the Keeper
    P('woodpile', 26.8, 13.2); P('rack', 27, 20.6); P('barrel', 11.4, 19.6); P('crate', 12.4, 19.2);

    // the archery range: a fenced yard, three targets at the far end, hay behind them
    const fenceMesh = fences([HUNT.range], () => Y, (x0, z0, x1, z1) => addBox(x0, z0, x1, z1, 'fence'));
    group.add(fenceMesh);
    for (const x of [40.5, 45, 49.5]) P('target', x, 13.6);
    P('haystack', 38.6, 12.6); P('haystack', 51.6, 12.8);
    P('rack', 51, 20.6);
    // the watchtower by the east gate, where a sentry keeps watch
    {
      const tx = 51.6, tz = 27.4, s2 = 2.2, th = 5.2;
      const body = mesh(boxUV(new THREE.BoxGeometry(s2, th, s2), s2, th, s2, 2), M.stone, tx, Y + th / 2, tz);
      const deck = mesh(new THREE.BoxGeometry(s2 + 0.8, 0.25, s2 + 0.8), M.plank, tx, Y + th + 0.1, tz);
      const posts = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => mesh(new THREE.BoxGeometry(0.16, 1.4, 0.16), M.plankDark, tx + sx * (s2 / 2 + 0.25), Y + th + 0.8, tz + sz * (s2 / 2 + 0.25)));
      const rg = new THREE.ConeGeometry(s2 * 1.05, 1.5, 4); rg.rotateY(Math.PI / 4);
      const roof = mesh(rg, turf, tx, Y + th + 2.2, tz);
      addSolid(tx, tz, s2 * 0.62);
      fadeable([body, deck, ...posts, roof], tx, tz, s2 * 0.7, th + 3);
    }
    // Eydis's stall on the green: the hunters' supplies
    stall(HUNT.stall.x, HUNT.stall.z, stripeTex('#3f6a3a', '#f2ead8'));
    P('crate', 40.4, 26.4); P('barrel', 35.8, 26.2);

    // the farm: wheat and cabbages behind a rail fence, the windmill turning over them, the barn
    for (const p of HUNT.plots) {
      flatPlane(p.x1 - p.x0, p.z1 - p.z0, lam({ map: soilTex(), polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, Y + 0.045);
      for (const [x, z] of cropSpots(p, rng)) P(p.crop, x, z);
    }
    group.add(fences(HUNT.plots, () => Y, (x0, z0, x1, z1) => addBox(x0, z0, x1, z1, 'fence')));
    {
      const [, roof] = tower(27.2, 40.4, 1.7, 5.4, thatch2, '#7a5232', '#e3b341');
      roof.geometry.dispose(); // a low cap, so the sails stand clear of it
      roof.geometry = new THREE.ConeGeometry(2.0, 1.9, 14);
      roof.position.y = Y + 5.4 + 0.95;
      // the sails: four slatted arms on a hub, facing south, turning in the wind
      const hub = new THREE.Group();
      hub.position.set(27.2, Y + 5.2, 40.4 + 2.05);
      const sailTex = canvasTex(16, 64, (g) => { g.fillStyle = '#5a3a22'; g.fillRect(6, 0, 4, 64); g.fillStyle = '#efe4cc'; for (let y = 4; y < 60; y += 8) g.fillRect(0, y, 16, 6); });
      const sailMat = lam({ map: sailTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
      for (let i = 0; i < 4; i++) {
        const arm = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.6), sailMat);
        arm.position.set(0, 1.4, 0);
        const pivot = new THREE.Group();
        pivot.rotation.z = (i * Math.PI) / 2;
        pivot.add(arm);
        hub.add(pivot);
      }
      hub.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 10).rotateX(Math.PI / 2), M.plankDark));
      group.add(hub);
      turn.push(hub);
    }
    house(25.6, 50.6, 6.4, 5, { h: 2.8, roof: 2.2, roofMat: barnRed, plaster: '#a8483a' }); // the barn
    P('haystack', 22.6, 46.2); P('pumpkin', 29.6, 47.6); P('pumpkin', 30, 49.4); P('scarecrow', 18, 46);

    // the south-east: Leif's leatherworks with its drying racks, the smokehouse, homes
    house(46, 38.6, 6, 4.6, { roofMat: thatch, plaster: '#d8c8a8', chimney: true });
    P('rack', 40.2, 38.4); P('rack', 52, 45.4); P('woodpile', 51.8, 41);
    house(38.6, 44.2, 4, 4, { roof: 1.4, roofMat: turf, plaster: '#cfc2a8', chimney: true }); // the smokehouse
    house(39, 51, 5, 4.4, { roofMat: thatch2 });
    house(47.2, 51, 5, 4.4, { roofMat: thatch, chimney: true });

    // the well on the green: a stone ring, two posts and a little roof with a bucket
    {
      const { x, z, r } = HUNT.well;
      const ring = new THREE.Shape(); ring.absarc(0, 0, r, 0, Math.PI * 2, false);
      const hole = new THREE.Path(); hole.absarc(0, 0, r - 0.3, 0, Math.PI * 2, true); ring.holes.push(hole);
      const rim = new THREE.ExtrudeGeometry(ring, { depth: 0.7, bevelEnabled: false, curveSegments: 20 });
      rim.rotateX(-Math.PI / 2);
      const stoneMat = lam({ map: stoneTex(rng, '#9c958a', '#4e4840') });
      stoneMat.map.repeat.set(0.6, 0.6);
      mesh(rim, stoneMat, x, Y, z);
      const water = new THREE.CircleGeometry(r - 0.3, 18); water.rotateX(-Math.PI / 2);
      mesh(water, lam({ map: waterTex(), color: '#6a9ab0' }), x, Y + 0.3, z);
      const parts = [];
      for (const s of [-1, 1]) parts.push(mesh(new THREE.BoxGeometry(0.16, 2.0, 0.16), M.plankDark, x + s * (r - 0.1), Y + 1.0, z));
      const roofG = gable(r * 2 + 0.2, 1.4, 0.6, 0.15);
      parts.push(mesh(roofG, [M.plankDark, thatch], x, Y + 2.0, z));
      parts.push(mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.3, 8), M.plank, x, Y + 1.2, z));
      addSolid(x, z, r + 0.1);
      fadeable(parts, x, z, r, 2.8);
    }
    // pines and flowers, lamps along the lanes
    for (const [x, z] of [[12.2, 32.6 - 3.4], [52.4, 33.6 + 2.6], [27.2, 26.6], [36.8, 37.4], [12, 55 - 20.6]]) P('tree_pine', x, z);
    for (const [x, z] of [[28.4, 28.4], [35.6, 28.4], [28.4, 35.6], [35.6, 35.6], [24.6, 22.4], [43, 33.6 + 1]]) P('flowers', x, z);
    for (const [x, z] of [[29.4, 20.2], [34.6, 20.2], [29.4, 44.6], [34.6, 44.6], [20.6, 29.4], [43.4, 29.4], [20.6, 34.6], [43.4, 34.6]]) P('lamp', x, z);
    void addBox; void rng;
    return {
      underlay: (mg) => { mg.fillStyle = '#a88a5c'; mg.fillRect(60, 18, 8, 92); mg.fillRect(18, 60, 92, 8); mg.fillStyle = SOIL[1]; for (const p of HUNT.plots) mg.fillRect(p.x0 * 2, p.z0 * 2, (p.x1 - p.x0) * 2, (p.z1 - p.z0) * 2); },
      minimap: (mg) => { mg.fillStyle = '#4f9cc0'; mg.beginPath(); mg.arc(HUNT.well.x * 2, HUNT.well.z * 2, 3, 0, Math.PI * 2); mg.fill(); },
    };
  },


  // ---------- Rytingborg, the oasis city (after the owner's picture) ----------
  // The lake fills the middle of the city (world.js carves it), crossed by two arched bridges that
  // meet on a palm island with a domed kiosk; little sailboats drift on it. At the back, the palace
  // on its sandstone rock: a great blue dome, minarets, two waterfalls pouring down into pools. Round
  // the shore, domed sandstone houses, palms, and the bazaar's awnings along the road between the
  // west and east gates; the Assassins' guild, dark-domed, in the palace's shadow by the north gate.
  sand({ M, Y, rng, mesh, lam, stall, fadeable, anims, P, addBox, addSolid, group, T }) {
    const [lapis, sky, teal] = M.roofs;
    const sandstone = lam({ map: stoneTex(rng, '#d8b880', '#a8885a') });
    sandstone.map.repeat.set(0.5, 0.5);
    const cliff = lam({ map: stoneTex(rng, '#c8a068', '#8a6a40') });
    const pave = lam({ map: cobbleTex(rng, '#e2cc9e', '#b49a74'), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const flat = (w, d, mat, x, z, y = Y + 0.03) => {
      const g = new THREE.PlaneGeometry(w, d); g.rotateX(-Math.PI / 2);
      const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 2, u.getY(i) * d / 2);
      return mesh(g, mat, x, y, z);
    };
    const dome = (x, y, z, r, mat = M.dome) => {
      const d = mesh(onion(r, r * 1.7), mat, x, y, z);
      const spike = mesh(new THREE.ConeGeometry(r * 0.08, r * 0.7, 6), M.gold, x, y + r * 1.7 + r * 0.3, z);
      return [d, spike];
    };
    // a sandstone house: arched windows and door, a flat roof with a low parapet, maybe a dome
    const house = (x, z, w, d, o = {}) => {
      const wh = o.h || 2.6, plaster = o.plaster || T.plaster[Math.floor(rng() * T.plaster.length)];
      const face = (fw, front) => lam({ map: archFace(rng, fw, front, plaster, o.door) });
      const roofM = lam({ color: plaster });
      const body = mesh(new THREE.BoxGeometry(w, wh, d), [face(d, false), face(d, false), roofM, roofM, face(w, true), face(w, false)], x, Y + wh / 2, z);
      const parapet = mesh(new THREE.BoxGeometry(w + 0.2, 0.35, d + 0.2), [roofM, roofM, lam({ color: '#c8aa78' }), roofM, roofM, roofM], x, Y + wh + 0.17, z);
      const parts = [body, parapet];
      if (o.dome) parts.push(...dome(x + (o.dx || 0), Y + wh + 0.3, z + (o.dz || 0), o.dome, o.domeMat));
      if (o.awning) { // a striped cloth over the door
        const a = mesh(new THREE.BoxGeometry(Math.min(w - 0.6, 2.6), 0.06, 1.0), lam({ map: stripeTex(o.awning, '#f2ead8') }), x, Y + wh * 0.62, z + d / 2 + 0.45);
        a.rotation.x = 0.35; parts.push(a);
      }
      addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
      fadeable(parts, x, z, Math.max(w, d) / 2, wh + (o.dome ? o.dome * 2.2 : 0.4));
      return parts;
    };
    // a minaret: a slim round tower, a balcony ring, a little onion dome
    const minaret = (x, z, h, y0 = Y, solid = true) => {
      const parts = [
        mesh(cylUV(new THREE.CylinderGeometry(0.42, 0.55, h, 12), 0.5, h, 2), sandstone, x, y0 + h / 2, z),
        mesh(new THREE.CylinderGeometry(0.72, 0.6, 0.3, 14), M.stoneDark, x, y0 + h * 0.78, z),
        mesh(cylUV(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 10), 0.34, 0.9, 1), lam({ map: domeTex(rng, sky) }), x, y0 + h + 0.45, z),
        ...dome(x, y0 + h + 0.9, z, 0.46),
      ];
      if (solid) addSolid(x, z, 0.6);
      fadeable(parts, x, z, 0.7, h + 2);
      return parts;
    };

    // ---------- the lake's shore, the bridges and the island ----------
    const L = SAND.lake;
    { // a paved rim round the water (a ring of stone just above it)
      const ring = new THREE.Shape(); ring.absellipse(0, 0, L.rx + 1.1, L.rz + 1.1, 0, Math.PI * 2);
      const hole = new THREE.Path(); hole.absellipse(0, 0, L.rx - 0.4, L.rz - 0.4, 0, Math.PI * 2, true); ring.holes.push(hole);
      const g = new THREE.ShapeGeometry(ring, 48); g.rotateX(-Math.PI / 2);
      const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) / 2, u.getY(i) / 2);
      mesh(g, pave, L.x, Y + 0.04, L.z).renderOrder = 0;
    }
    const arches = canvasTex(128, 32, (g) => { // a bridge's side: stone with arches over the water
      g.fillStyle = '#d0b07a'; g.fillRect(0, 0, 128, 32);
      g.fillStyle = 'rgba(90,60,30,.4)'; for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 1, 8);
      g.fillStyle = '#5a7a8a'; for (let x = 8; x < 128; x += 32) { g.beginPath(); g.moveTo(x, 32); g.lineTo(x, 18); g.arc(x + 8, 18, 8, Math.PI, 0); g.lineTo(x + 16, 32); g.fill(); }
      g.fillStyle = '#e8d0a0'; g.fillRect(0, 0, 128, 3);
    });
    arches.wrapS = THREE.RepeatWrapping;
    const banMat = lam({ map: canvasTex(32, 48, T.banner), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const bridge = (x0, z0, x1, z1) => { // along x or along z, its deck level with the street
      const alongX = x1 - x0 > z1 - z0, len = alongX ? x1 - x0 : z1 - z0, w = 2.7, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const side = lam({ map: arches.clone() }); side.map.repeat.set(len / 8, 1); side.map.needsUpdate = true;
      const deck = mesh(new THREE.BoxGeometry(alongX ? len : w, 0.9, alongX ? w : len), [alongX ? sandstone : side, alongX ? sandstone : side, pave, sandstone, alongX ? side : sandstone, alongX ? side : sandstone], cx, Y - 0.41, cz);
      const parts = [deck];
      for (const s of [-1, 1]) { // the parapets, with a blue banner pole at each end
        const px = alongX ? cx : cx + s * (w / 2 - 0.12), pz = alongX ? cz + s * (w / 2 - 0.12) : cz;
        parts.push(mesh(new THREE.BoxGeometry(alongX ? len : 0.24, 0.5, alongX ? 0.24 : len), sandstone, px, Y + 0.3, pz));
        for (const e of [-1, 1]) {
          const bx = alongX ? cx + e * (len / 2 - 0.3) : px, bz = alongX ? pz : cz + e * (len / 2 - 0.3);
          parts.push(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 6), M.plankDark, bx, Y + 1.3, bz));
          parts.push(mesh(new THREE.PlaneGeometry(0.6, 0.9), banMat, bx + (alongX ? 0 : s * 0.38), Y + 2.1, bz + 0.05)); // (facing the camera)
        }
      }
      fadeable(parts, cx, cz, 1.4, 1);
    };
    bridge(30.9, L.z - L.rz - 0.8, 33.1, L.z - SAND.island.r + 0.2); bridge(30.9, L.z + SAND.island.r - 0.2, 33.1, L.z + L.rz + 0.8);
    bridge(L.x - L.rx - 0.8, 27.8, L.x - SAND.island.r + 0.2, 30.2); bridge(L.x + SAND.island.r - 0.2, 27.8, L.x + L.rx + 0.8, 30.2);
    { // the island: a paved round, palms, and a kiosk: four slim columns under a blue dome
      const { x, z, r } = SAND.island;
      const g = new THREE.CircleGeometry(r, 28); g.rotateX(-Math.PI / 2);
      const u = g.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * r, u.getY(i) * r);
      mesh(g, pave, x, Y + 0.05, z);
      const parts = [];
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { parts.push(mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.4, 8), sandstone, x + sx * 1.15, Y + 1.2, z + sz * 1.15)); addSolid(x + sx * 1.15, z + sz * 1.15, 0.2); }
      parts.push(mesh(new THREE.BoxGeometry(2.8, 0.3, 2.8), sandstone, x, Y + 2.5, z));
      parts.push(...dome(x, Y + 2.65, z, 1.2));
      fadeable(parts, x, z, 1.5, 5);
      for (const [dx, dz] of [[-2.5, -2.3], [2.6, -2.2], [-2.6, 2.4], [2.4, 2.5]]) P('tree_palm', x + dx, z + dz);
    }
    // the sailboats: a hull, a mast, a white lateen sail; each drifts round its own corner of the lake
    const sail = canvasTex(64, 64, (g) => { g.fillStyle = '#f4ecd8'; g.beginPath(); g.moveTo(4, 60); g.lineTo(60, 60); g.lineTo(10, 2); g.closePath(); g.fill(); g.strokeStyle = '#c8b898'; g.lineWidth = 2; for (let y = 16; y < 60; y += 12) { g.beginPath(); g.moveTo(8, y); g.lineTo(8 + (y / 60) * 50, y); g.stroke(); } });
    sail.wrapS = sail.wrapT = THREE.ClampToEdgeWrapping;
    for (const [bx, bz, ph] of [[26.5, 25.4, 0], [37.5, 25.6, 2.1], [26.4, 32.6, 4.2], [37.6, 32.4, 1.2]]) {
      const boat = new THREE.Group();
      const hullShape = new THREE.Shape(); hullShape.moveTo(-1.1, 0); hullShape.quadraticCurveTo(0, -0.5, 1.2, 0.1); hullShape.lineTo(-1.1, 0.25); hullShape.closePath();
      const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape, { depth: 0.7, bevelEnabled: false }).translate(0, 0, -0.35), lam({ color: '#8a5a33' }));
      hull.scale.set(1, 0.9, 1); hull.position.y = 0.1;
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.2, 6), M.plankDark); mast.position.set(0.1, 1.2, 0);
      const sl = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.9), lam({ map: sail, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); sl.position.set(0.15, 1.35, 0.02);
      boat.add(hull, mast, sl);
      boat.position.set(bx, WATER_LEVEL, bz);
      group.add(boat);
      anims.push((now) => {
        const a = now * 0.12 + ph;
        boat.position.x = bx + Math.cos(a) * 1.2; boat.position.z = bz + Math.sin(a) * 0.7;
        boat.rotation.y = -a - Math.PI / 2; boat.position.y = WATER_LEVEL + Math.sin(now * 1.3 + ph) * 0.04;
        boat.rotation.z = Math.sin(now * 0.9 + ph) * 0.04;
      });
    }

    // ---------- the palace on its rock, and the waterfalls ----------
    const Tr = SAND.terrace;
    {
      const w = Tr.x1 - Tr.x0, d = Tr.z1 - Tr.z0, cx = (Tr.x0 + Tr.x1) / 2, cz = (Tr.z0 + Tr.z1) / 2, h = Tr.h;
      const rock = mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 2), cliff, cx, Y + h / 2, cz);
      addBox(Tr.x0, Tr.z0, Tr.x1, Tr.z1, 'wall');
      const top = Y + h, parts = [rock];
      // the palace: a long arcaded hall, a great dome over its middle, smaller domes, four minarets
      const pw = 15, pd = 4.6, ph = 3.4, px = cx + 1.5, pz = cz - 0.6;
      const hall = mesh(new THREE.BoxGeometry(pw, ph, pd), [lam({ map: archFace(rng, pd, false, '#efdcb4') }), lam({ map: archFace(rng, pd, false, '#efdcb4') }), lam({ color: '#efdcb4' }), sandstone, lam({ map: archFace(rng, pw, true, '#efdcb4', '#2e4f9a') }), sandstone], px, top + ph / 2, pz);
      parts.push(hall, mesh(new THREE.CylinderGeometry(2.6, 2.8, 1.2, 20), sandstone, px, top + ph + 0.6, pz));
      parts.push(...dome(px, top + ph + 1.2, pz, 2.6));
      for (const s of [-1, 1]) {
        parts.push(mesh(new THREE.BoxGeometry(3.6, 2.6, 3.6), sandstone, px + s * 5.4, top + ph + 1.3 - 0.01, pz));
        parts.push(...dome(px + s * 5.4, top + ph + 2.6, pz, 1.35));
      }
      for (const [mx, mz] of [[px - pw / 2 - 0.6, pz + pd / 2], [px + pw / 2 + 0.6, pz + pd / 2], [px - pw / 2 + 1, pz - pd / 2 - 0.6], [px + pw / 2 - 1, pz - pd / 2 - 0.6]]) parts.push(...minaret(mx, mz, 4.6, top, false));
      // stairs up the rock's face, and blue banners hung down it
      for (let i = 0; i < 8; i++) { // the steps
        const sh = (h * (8 - i)) / 8;
        parts.push(mesh(new THREE.BoxGeometry(3.2, sh, 0.26), sandstone, px, Y + sh / 2, Tr.z1 + 0.13 + i * 0.26));
      }
      for (const s of [-1, 1]) parts.push(mesh(new THREE.BoxGeometry(0.3, 1.0, 2.1), sandstone, px + s * 1.75, Y + 0.5 + h * 0.3, Tr.z1 + 1.0));
      addBox(px - 1.6, Tr.z1, px + 1.6, Tr.z1 + 2);
      for (const bx of [Tr.x0 + 2.4, px - 4, px + 4, Tr.x1 - 2.4]) {
        const ban = mesh(new THREE.PlaneGeometry(1.0, 2.2), lam({ map: canvasTex(32, 48, T.banner), transparent: true, alphaTest: 0.5 }), bx, Y + h - 1.3, Tr.z1 + 0.03);
        parts.push(ban);
      }
      void parts; // (the rock is always behind the hero: nothing to fade)
      // the waterfalls: water spilling over the rock's lip into a pool at its foot
      const fallTex = canvasTex(32, 64, (g) => { g.fillStyle = 'rgba(120,200,235,.85)'; g.fillRect(0, 0, 32, 64); g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 18; i++) g.fillRect((i * 7) % 30, (i * 13) % 60, 2, 10); });
      fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping;
      for (const fx of [Tr.x0 + 4.5, Tr.x1 - 4.5]) {
        const fm = new THREE.MeshBasicMaterial({ map: fallTex.clone(), transparent: true, depthWrite: false });
        fm.map.needsUpdate = true; fm.map.repeat.set(1, 1.5);
        const fall = mesh(new THREE.PlaneGeometry(1.6, h + 0.3), fm, fx, Y + h / 2, Tr.z1 + 0.06);
        fall.renderOrder = 1;
        const pool = new THREE.CircleGeometry(1.5, 20); pool.rotateX(-Math.PI / 2);
        mesh(pool, M.water, fx, Y + 0.08, Tr.z1 + 1.2);
        const rim = new THREE.Shape(); rim.absarc(0, 0, 1.75, 0, Math.PI * 2); const hl = new THREE.Path(); hl.absarc(0, 0, 1.5, 0, Math.PI * 2, true); rim.holes.push(hl);
        mesh(new THREE.ExtrudeGeometry(rim, { depth: 0.35, bevelEnabled: false, curveSegments: 20 }).rotateX(-Math.PI / 2), sandstone, fx, Y, Tr.z1 + 1.2);
        addSolid(fx, Tr.z1 + 1.2, 1.8);
        const foam = mesh(new THREE.SphereGeometry(0.7, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f2fbff', transparent: true, opacity: 0.6, depthWrite: false }), fx, Y + 0.05, Tr.z1 + 0.7);
        anims.push((now) => { fm.map.offset.y = now * 1.4; foam.scale.setScalar(1 + Math.sin(now * 7 + fx) * 0.12); });
      }
    }

    // ---------- the Assassins' guild: a dark sandstone hall with a dark dome, by the north gate ----------
    house(11.9, 21.4, 4.0, 5, { h: 3.0, plaster: '#a8865a', door: '#2a1e2e', dome: 1.5, domeMat: lam({ map: domeTex(rng, '#3a2a4a') }) });
    P('urn', 10.6, 24.6); P('crate', 13.2, 24.5);

    // ---------- homes round the shore ----------
    house(12, 31.2, 4, 4.6, { dome: 1.3 });
    house(12, 38.4, 4, 4.6, { awning: '#c8463c' });
    house(51, 21.4, 5, 5, { dome: 1.4, domeMat: lam({ map: domeTex(rng, teal) }) });
    house(51, 29.6, 5, 4.6, { awning: '#e8862a' });
    house(51, 37.2, 5, 4.6, { dome: 1.2 });
    house(26.4, 52, 5.2, 4.2, { awning: '#e3b341' });
    house(38, 52, 5.2, 4.2, { dome: 1.3 });
    house(46.6, 51.6, 5, 4.6, { awning: '#c8463c', plaster: '#e2c898' }); // the forge
    house(16.2, 52, 4.6, 4.2, { dome: 1.1, domeMat: lam({ map: domeTex(rng, lapis) }) });
    for (const [mx, mz] of [[19.4, 18.2], [52.6, 17.4], [10.6, 27.4], [53.4, 49]]) minaret(mx, mz, 5.2);

    // ---------- the bazaar: the road from the west gate to the east, awnings on both sides ----------
    flat(46, 2.8, pave, 32, 44); // the road
    flat(2.4, 34, pave, 15.3, 26); // from the north gate down to it
    stall(SAND.stall.x, SAND.stall.z, stripeTex('#c8463c', '#f2ead8'));
    stall(35.6, 40.6, stripeTex('#e3b341', '#f2ead8'));
    stall(42.6, 47.4, stripeTex('#e8862a', '#f2ead8'));
    stall(31, 47.6, stripeTex('#3a6ab8', '#f2ead8'));
    P('chest', SAND.chest.x, SAND.chest.z);
    P('anvil', 43.4, 49.6); P('barrel', 49.8, 48.4); P('crate', 50.8, 48.8); // the forge's yard
    P('urn', 31.4, 40.4); P('urn', 32.4, 40.2); P('crate', 39.4, 40.2); P('barrel', 24.6, 40.2); P('urn', 46, 40.4);
    P('crate', 50.2, 40.4); P('crate', 51.2, 40.6); P('barrel', 52.4, 40.5); // the caravan's bales by the east gate
    // palms everywhere, along the shore and in the yards
    for (const [x, z] of [[19.2, 23.6], [44.6, 23.2], [18.6, 34.4], [45.6, 34.6], [21.6, 38.6], [42.4, 38.8], [24.8, 20.2], [39.4, 20.4],
      [11.2, 48.6], [53.2, 33.6], [11.4, 34.8], [33.8, 50.2], [21.4, 52.6], [42.2, 53.4], [29.2, 38.8], [35, 38.8]]) P('tree_palm', x, z);
    for (const [x, z] of [[10.6, 51.2], [53.4, 25.4], [24.2, 50.2], [40.6, 49.8]]) P('cactus_round', x, z);
    void addBox;
    return {
      underlay: (mg) => {
        mg.fillStyle = '#c8b088'; mg.fillRect(18, 85, 92, 6); mg.fillRect(27, 18, 6, 68);
        mg.fillStyle = '#8a6a40'; mg.fillRect(Tr.x0 * 2, Tr.z0 * 2, (Tr.x1 - Tr.x0) * 2, (Tr.z1 - Tr.z0) * 2);
      },
      minimap: (mg) => {
        mg.fillStyle = '#4fb0c8'; mg.beginPath(); mg.ellipse(L.x * 2, L.z * 2, L.rx * 2, L.rz * 2, 0, 0, Math.PI * 2); mg.fill();
        mg.fillStyle = '#d8c08a'; mg.fillRect(61.8, (L.z - L.rz) * 2, 4.4, L.rz * 4); mg.fillRect((L.x - L.rx) * 2, 55.6, L.rx * 4, 4.4);
        mg.beginPath(); mg.arc(L.x * 2, L.z * 2, SAND.island.r * 2, 0, Math.PI * 2); mg.fill();
        mg.fillStyle = '#2e4f9a'; mg.beginPath(); mg.arc(36.5 * 2, 12.2 * 2, 5, 0, Math.PI * 2); mg.fill();
      },
    };
  },

  // ---------- Steinborg ----------
  city({ M, Y, rng, mesh, lam, house, stall, tower, P, addSolid }) {
    const [roofRed, roofBlue, roofBrown, roofSlate] = M.roofs;
    // the Jarl's hall: long, tall, stone below, a dragon-ish ridge
    house(32, 15.6, 11, 6, { h: 3.2, roof: 2.6, roofMat: roofSlate, plaster: '#d8ccb0', chimney: true });
    house(15, 14.8, 5, 5, { chimney: true });
    house(21.8, 14.4, 5, 4.4);
    house(43, 14.4, 5.4, 4.4);
    house(14.4, 24.6, 5, 6);
    house(14.4, 40.2, 5, 6, { chimney: true });
    house(15.2, 49.4, 6, 5);
    house(23.2, 49.8, 5, 4.4);
    house(41.6, 49.8, 5, 4.4, { roofMat: roofBlue }); // the Watch house by the gate
    house(49.2, 49.2, 5, 5);
    house(49.4, 42, 5, 6);
    // the forge: open-fronted, with a big chimney
    house(46.6, 25.6, 6, 4.6, { roofMat: roofBrown, plaster: '#cfc2a8', chimney: true });
    // the seeress's tower: round and tall, with a purple cone roof
    tower(48.6, 15.6, 2.1, 5.2, M.roofPurple);
    void roofRed;

    // the fountain: an open stone ring with water inside
    {
      const { x, z } = CITY.fountain;
      const ring = new THREE.Shape();
      ring.absarc(0, 0, 2.3, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, 1.9, 0, Math.PI * 2, true);
      ring.holes.push(hole);
      const rim = new THREE.ExtrudeGeometry(ring, { depth: 0.6, bevelEnabled: false, curveSegments: 24 });
      rim.rotateX(-Math.PI / 2);
      mesh(rim, M.stone, x, Y, z);
      M.stone.map.repeat.set(1, 1);
      const wat = new THREE.CircleGeometry(1.95, 24);
      wat.rotateX(-Math.PI / 2);
      mesh(wat, M.water, x, Y + 0.42, z);
      mesh(cylUV(new THREE.CylinderGeometry(0.28, 0.4, 1.5, 10), 0.3, 1.5, 1), M.stoneDark, x, Y + 1.1, z);
      mesh(new THREE.CylinderGeometry(0.8, 0.3, 0.3, 14), M.stone, x, Y + 1.85, z);
      mesh(new THREE.SphereGeometry(0.22, 10, 8), M.water, x, Y + 2.08, z);
      addSolid(x, z, CITY.fountain.r);
    }

    stall(CITY.stall.x, CITY.stall.z, stripeTex('#c8463c', '#f2ead8'));
    stall(37.6, 25.2, stripeTex('#3a6aa8', '#f2ead8'));

    // lamps, barrels, crates, the anvil, trees and flowerbeds
    for (const [x, z] of [[29.4, 38], [34.6, 38], [29.4, 45.5], [34.6, 45.5], [39.5, 29.2], [39.5, 34.8], [46.5, 34.8], [24.5, 34.8], [24.6, 20.2], [39.4, 20.2]]) P('lamp', x, z);
    P('anvil', 44.6, 28.9); P('barrel', 49.6, 28.6); P('barrel', 50.4, 29.5); P('crate', 43.2, 28.6);
    P('crate', 21.2, 29.8); P('crate', 21.5, 31.1); P('barrel', 28.6, 24.4); P('crate', 39.6, 24.4); P('barrel', 35.6, 24.4);
    P('barrel', 38.4, 52.2); P('crate', 19.4, 51.6);
    for (const [x, z] of [[12.2, 32.4], [18.6, 44.6], [44.4, 44.6], [12.4, 19.6], [52.2, 35.6], [26.2, 41.2], [38.2, 41]]) P('tree_grove', x, z);
    // Ragna's herb garden
    for (const [x, z] of [[18.4, 19.4], [19.6, 18.6], [20.8, 19.2], [18.8, 20.6], [21.6, 20.4]]) P(rng() < 0.5 ? 'flowers' : 'bush', x, z);
    for (const [x, z] of [[28.2, 34.6], [35.8, 34.6], [28.2, 27.4], [35.8, 27.4], [30.4, 19.8], [33.6, 19.8], [44.6, 38.6], [19.6, 38.6]]) P('flowers', x, z);
    return { minimap: (mg) => { mg.fillStyle = '#4f9cc0'; mg.beginPath(); mg.arc(CITY.fountain.x * 2, CITY.fountain.z * 2, 4, 0, Math.PI * 2); mg.fill(); } };
  },

  // ---------- Galdrheim, the city of sorcerers ----------
  magic({ M, Y, rng, mesh, lam, house, stall, tower, fadeable, spin, P, addBox, addSolid, group }) {
    const [roofPurple, roofTeal, roofIndigo, roofViolet] = M.roofs;
    const glow = (c) => new THREE.MeshBasicMaterial({ color: c });
    const crystal = (x, y, z, s, c = '#9fe8ff') => { const m = mesh(new THREE.OctahedronGeometry(s), glow(c), x, y, z); m.scale.y = 1.6; spin.push(m); return m; };

    // the Archmage's tower: three tiers, a tall violet spire, a ring of crystals turning round it
    {
      const tx = 28, tz = 15.2; // a little west of the middle, so the north gate's road runs past it
      const tiers = [[3.0, 3.2], [2.3, 3.4], [1.7, 3.0]];
      let y = Y;
      const parts = [];
      for (const [r, th] of tiers) {
        parts.push(mesh(cylUV(new THREE.CylinderGeometry(r, r * 1.06, th, 18), r, th, 2), M.stone, tx, y + th / 2, tz));
        parts.push(mesh(new THREE.CylinderGeometry(r + 0.25, r + 0.25, 0.3, 18), M.stoneDark, tx, y + th, tz)); // a ledge at each tier
        y += th;
      }
      parts.push(mesh(new THREE.ConeGeometry(2.3, 4.6, 18), roofViolet, tx, y + 2.3, tz));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; parts.push(crystal(tx + Math.cos(a) * 2.6, y - 1.2, tz + Math.sin(a) * 2.6, 0.22)); }
      parts.push(crystal(tx, y + 5.2, tz, 0.4, '#e0c8ff'));
      const doorTex = canvasTex(40, 56, (g) => { g.fillStyle = '#2a2236'; g.beginPath(); g.roundRect(2, 4, 36, 52, [18, 18, 0, 0]); g.fill(); g.fillStyle = '#4a2f7a'; g.beginPath(); g.roundRect(6, 8, 28, 48, [14, 14, 0, 0]); g.fill(); g.fillStyle = '#f0c850'; g.beginPath(); g.arc(20, 22, 4, 0, 7); g.fill(); });
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2), lam({ map: doorTex, transparent: true, alphaTest: 0.5 }));
      door.position.set(tx, Y + 1, tz + 3.08);
      group.add(door);
      parts.push(door);
      addSolid(tx, tz, 3.1);
      fadeable(parts, tx, tz, 3, y + 5);
    }
    // the library: a long hall in the west
    house(15.2, 29.6, 6, 11, { h: 3.2, roof: 2.2, roofMat: roofIndigo, plaster: '#d8d2e6' });
    // the Staffwright's workshop in the east, with its chimney
    house(48.2, 29.8, 6, 5, { roofMat: roofTeal, plaster: '#d2dbe6', chimney: true });
    // homes
    house(15, 15.2, 5, 5, { roofMat: roofPurple });
    house(22.4, 14.6, 5, 4.4);
    house(42, 14.6, 5, 4.4);
    house(49, 15.4, 5, 5, { roofMat: roofTeal });
    house(14.6, 44.6, 5, 5.6, { chimney: true });
    house(15.4, 51.2, 6, 4.2);
    house(23.4, 50.6, 5, 4.2, { roofMat: roofPurple });
    house(41.4, 50.6, 5, 4.2);
    house(50, 40.6, 5, 5.4, { roofMat: roofIndigo });
    // the stargazer's observatory: a small round tower with a dome
    {
      const [body, roof] = tower(48.6, 49.4, 1.8, 3.8, roofPurple, '#2f6f78', '#9fe8ff');
      roof.geometry.dispose();
      roof.geometry = new THREE.SphereGeometry(1.9, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      roof.position.y = Y + 3.8;
      void body;
    }

    // the rune circle: a glowing ring of runes on the paving, a plinth and a floating crystal
    {
      const { x, z, r } = MAGIC.circle;
      const runes = canvasTex(256, 256, (g) => {
        g.translate(128, 128);
        g.strokeStyle = '#9fe8ff'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 118, 0, 7); g.stroke();
        g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 92, 0, 7); g.stroke();
        g.fillStyle = '#c8b8ff';
        for (let i = 0; i < 16; i++) { // rune marks between the rings
          g.save(); g.rotate((i / 16) * Math.PI * 2); g.fillRect(-3, -112, 6, 16); g.fillRect(-8, -106, 16, 4); if (i % 2) g.fillRect(2, -100, 4, 8); g.restore();
        }
        g.strokeStyle = '#9fe8ff'; g.lineWidth = 3; g.beginPath(); // a star inside
        for (let i = 0; i <= 8; i++) { const a = (i * 3 / 8) * Math.PI * 2; g.lineTo(Math.sin(a) * 88, -Math.cos(a) * 88); }
        g.stroke();
      });
      const disc = new THREE.PlaneGeometry(r * 2, r * 2);
      disc.rotateX(-Math.PI / 2);
      const m = mesh(disc, new THREE.MeshBasicMaterial({ map: runes, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), x, Y + 0.05, z);
      m.renderOrder = 1;
      mesh(cylUV(new THREE.CylinderGeometry(0.5, 0.65, 1.1, 12), 0.5, 1.1, 1), M.stoneDark, x, Y + 0.55, z);
      crystal(x, Y + 2.1, z, 0.45);
      addSolid(x, z, 0.8);
    }

    // the curio stall by the circle, and a scroll seller's
    stall(MAGIC.stall.x, MAGIC.stall.z, stripeTex('#5a3a7a', '#e4dcf0'));
    stall(38.4, 26.2, stripeTex('#2f6f78', '#e4dcf0'));

    // the runestones: standing stones carved with glowing runes
    const stoneMat = lam({ map: canvasTex(32, 96, (g) => { g.fillStyle = '#7d7890'; g.fillRect(0, 0, 32, 96); g.fillStyle = '#9fe8ff'; for (let i = 0; i < 6; i++) { g.fillRect(12, 10 + i * 14, 8, 3); g.fillRect(14, 8 + i * 14, 3, 9); } }) });
    for (const [x, z, hgt] of [[38.6, 42.4, 2.2], [41.2, 44.2, 2.6], [43.6, 42.6, 2.0]]) {
      const st = mesh(new THREE.BoxGeometry(0.7, hgt, 0.45), stoneMat, x, Y + hgt / 2, z);
      addBox(x - 0.35, z - 0.25, x + 0.35, z + 0.25);
      fadeable([st], x, z, 0.4, hgt);
    }
    // crystal clusters along the streets
    for (const [x, z, c] of [[26.4, 38.4, '#9fe8ff'], [37.6, 38.4, '#c8a0ff'], [22.6, 22.2, '#c8a0ff'], [41.6, 22.2, '#9fe8ff'], [26.4, 46.4, '#9fe8ff'], [37.6, 46.4, '#c8a0ff']]) {
      const base = mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.4, 8), M.stoneDark, x, Y + 0.2, z);
      const c1 = mesh(new THREE.OctahedronGeometry(0.3), glow(c), x, Y + 0.75, z);
      c1.scale.y = 2;
      const c2 = mesh(new THREE.OctahedronGeometry(0.18), glow(c), x + 0.22, Y + 0.55, z + 0.1);
      c2.scale.y = 2; c2.rotation.z = 0.4;
      addSolid(x, z, 0.4);
      fadeable([base, c1, c2], x, z, 0.4, 1.2);
    }
    // lamps, birches, flowerbeds, the herb pots by the library
    for (const [x, z] of [[29.2, 40], [34.8, 40], [29.2, 47.5], [34.8, 47.5], [24.2, 30.4], [39.8, 30.4], [24.4, 20.2], [39.6, 20.2]]) P('lamp', x, z);
    for (const [x, z] of [[12.2, 37.6], [52.2, 22.6], [19.8, 37.8], [44.2, 37.6], [52.4, 34.8], [19.8, 21.4]]) P('tree_birch', x, z);
    for (const [x, z] of [[28.6, 29.6], [35.4, 29.6], [28.6, 36.4], [35.4, 36.4], [26.4, 21.4], [29.6, 21.4]]) P('flowers', x, z); // the last two frame the Archmage's door
    P('barrel', 44.6, 33.4); P('crate', 45.6, 33.6); P('anvil', 51.6, 33.2); P('crate', 19.2, 23.2); P('barrel', 18.6, 36.2);
    void rng; void addBox;
    return {
      minimap: (mg) => { mg.fillStyle = '#9fe8ff'; mg.beginPath(); mg.arc(MAGIC.circle.x * 2, MAGIC.circle.z * 2, 5, 0, Math.PI * 2); mg.fill(); },
    };
  },
};
