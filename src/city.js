// Aria's walled cities. Steinborg, the market city: grey stone walls with towers and two gates,
// timber houses with steep roofs round a fountain square, a forge, market stalls and the
// seeress's tower. Galdrheim, the city of sorcerers: pale lavender stone, purple and teal roofs,
// a glowing rune circle with a floating crystal, the Archmage's tower, a library and the
// Staffwright's workshop. Ragnarok builds its towns in 3D under 2D sprites, so a city is real
// meshes (lit by the same sun and sky, so it darkens at night) while its people stay sprites.
// Painted canvas textures throughout. Buildings between the camera and the player fade, like the
// tall trees. Each city shares the walls, houses and stalls; its layout is its own (LAYOUTS).
import * as THREE from 'three';
import { mulberry32 } from './noise.js';

export const WALL = { x0: 9, x1: 55, z0: 9, z1: 55, t: 1.1, h: 2.8 };
export const GATE = 2.5; // half the width of a gateway
// where things stand (the people are in quests.js)
export const CITY = {
  fountain: { x: 32, z: 31, r: 2.3 },
  chest: { x: 22.6, z: 30.4 },
  stall: { x: 26.6, z: 25.4 },
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
};

// ctx: { group, lib, heightAt, place(type, x, z, force), addBox(x0, z0, x1, z1, kind), addSolid(x, z, r), boxes,
//   gates: the sides with a gate ('s' south, 'e' east) }; variant: 'city' (Steinborg) | 'magic' (Galdrheim)
export function buildCity(ctx, variant = 'city') {
  const { group, place, addBox, addSolid } = ctx;
  const T = THEMES[variant];
  const rng = mulberry32(variant === 'city' ? 512 : 733);
  const fades = []; // { meshes, x, z, r, h }
  const fadeMats = new Map();
  const spin = []; // meshes that turn and bob: floating crystals
  const lam = (opts) => new THREE.MeshLambertMaterial(opts);
  const M = {
    stone: lam({ map: stoneTex(rng, ...T.stone) }),
    stoneDark: lam({ map: stoneTex(rng, T.stoneDark, T.stone[1]) }),
    cobble: lam({ map: cobbleTex(rng, ...T.cobble), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    roofs: T.roofs.map((c) => lam({ map: roofTex(rng, c) })),
    towerRoof: lam({ map: roofTex(rng, T.towerRoof) }),
    roofPurple: lam({ map: roofTex(rng, '#5a3a7a') }),
    plank: lam({ map: plankTex(rng) }),
    plankDark: lam({ map: plankTex(rng, '#5a3a22') }),
    water: lam({ map: waterTex(), color: '#bfe6ff' }),
    gold: lam({ color: '#e3b341' }),
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
  const gates = ctx.gates || ['s', 'e'];

  // ---------- paving ----------
  const pw = WALL.x1 - WALL.x0, pd = WALL.z1 - WALL.z0;
  const pave = new THREE.PlaneGeometry(pw, pd);
  pave.rotateX(-Math.PI / 2);
  const puv = pave.attributes.uv;
  for (let i = 0; i < puv.count; i++) puv.setXY(i, puv.getX(i) * pw / 2, puv.getY(i) * pd / 2);
  mesh(pave, M.cobble, (WALL.x0 + WALL.x1) / 2, Y + 0.02, (WALL.z0 + WALL.z1) / 2).renderOrder = 0;
  // paved roads out through the gates
  for (const [x, z, w, d] of [gates.includes('s') && [32, 58.5, GATE * 2, 7], gates.includes('e') && [58.5, 32, 7, GATE * 2]].filter(Boolean)) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    const u = g.attributes.uv;
    for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 2, u.getY(i) * d / 2);
    mesh(g, M.cobble, x, ctx.heightAt(x, z) + 0.03, z);
  }

  // ---------- walls, gates and towers ----------
  const { x0, x1, z0, z1, t, h } = WALL;
  const side = (fixed, a, b, gate) => (gate ? [[fixed, a, 32 - GATE], [fixed, 32 + GATE, b]] : [[fixed, a, b]]);
  const runs = [ // [axis, fixed, from, to]
    ...side(z0, x0, x1, false).map((r) => ['x', ...r]),
    ...side(z1, x0, x1, gates.includes('s')).map((r) => ['x', ...r]),
    ...side(x0, z0, z1, false).map((r) => ['z', ...r]),
    ...side(x1, z0, z1, gates.includes('e')).map((r) => ['z', ...r]),
  ];
  const merlon = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  for (const [axis, fixed, a, b] of runs) {
    const n = Math.ceil((b - a) / 6);
    for (let i = 0; i < n; i++) {
      const s = a + ((b - a) * i) / n, e = a + ((b - a) * (i + 1)) / n, len = e - s, mid = (s + e) / 2;
      const [w, d] = axis === 'x' ? [len, t] : [t, len];
      const [cx, cz] = axis === 'x' ? [mid, fixed] : [fixed, mid];
      const wall = mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, 2), M.stone, cx, Y + h / 2, cz);
      const parts = [wall];
      // battlements on the outer edge of the walkway
      const out = (fixed < 32 ? -1 : 1) * (t / 2 - 0.28);
      for (let k = 0.5; k < len; k += 1.1) {
        const p = s + k;
        parts.push(mesh(merlon, M.stoneDark, axis === 'x' ? p : fixed + out, Y + h + 0.27, axis === 'x' ? fixed + out : p));
      }
      addBox(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 'wall');
      fadeable(parts, cx, cz, len / 2, h + 0.6);
    }
  }
  // towers at the corners and beside each gateway; an arch over each gateway
  const towers = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]];
  if (gates.includes('s')) towers.push([32 - GATE - 0.6, z1], [32 + GATE + 0.6, z1]);
  if (gates.includes('e')) towers.push([x1, 32 - GATE - 0.6], [x1, 32 + GATE + 0.6]);
  const orb = variant === 'magic' ? new THREE.MeshBasicMaterial({ color: '#9fe8ff' }) : null;
  for (const [tx, tz] of towers) {
    const r = 1.25, th = h + 1.5;
    const body = mesh(cylUV(new THREE.CylinderGeometry(r, r * 1.08, th, 14), r, th, 2), M.stone, tx, Y + th / 2, tz);
    const roof = mesh(new THREE.ConeGeometry(r * 1.3, variant === 'magic' ? 2.6 : 1.8, 14), M.towerRoof, tx, Y + th + (variant === 'magic' ? 1.3 : 0.9), tz);
    const parts = [body, roof];
    if (orb) { const o = mesh(new THREE.OctahedronGeometry(0.28), orb, tx, Y + th + 3.2, tz); spin.push(o); parts.push(o); } // a crystal over each tower
    addSolid(tx, tz, r);
    fadeable(parts, tx, tz, r, th + 3);
  }
  for (const [ax, gx, gz] of [gates.includes('s') && ['x', 32, z1], gates.includes('e') && ['z', x1, 32]].filter(Boolean)) {
    const span = GATE * 2 + 1.2, lw = ax === 'x' ? span : t + 0.2, ld = ax === 'x' ? t + 0.2 : span;
    const lintel = mesh(boxUV(new THREE.BoxGeometry(lw, 1.0, ld), lw, 1, ld, 2), M.stoneDark, gx, Y + h + 0.1, gz);
    const ban = canvasTex(32, 48, T.banner);
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.35), lam({ map: ban, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    bm.position.set(gx + (ax === 'x' ? 0 : t / 2 + 0.12), Y + h - 0.6, gz + (ax === 'x' ? t / 2 + 0.12 : 0));
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
  const api = { M, Y, rng, mesh, lam, house, stall, tower, fadeable, spin, P, addBox, addSolid, group };
  const extra = LAYOUTS[variant](api);

  // ---------- minimap ----------
  function minimap(mg) {
    mg.fillStyle = variant === 'magic' ? '#b6b0c8' : '#b3ab9c';
    mg.fillRect(x0 * 2, z0 * 2, (x1 - x0) * 2, (z1 - z0) * 2);
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
      const tx = 32, tz = 15.2;
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
    for (const [x, z] of [[28.6, 29.6], [35.4, 29.6], [28.6, 36.4], [35.4, 36.4], [30.4, 21.4], [33.6, 21.4]]) P('flowers', x, z);
    P('barrel', 44.6, 33.4); P('crate', 45.6, 33.6); P('anvil', 51.6, 33.2); P('crate', 19.2, 23.2); P('barrel', 18.6, 36.2);
    void rng; void addBox;
    return {
      minimap: (mg) => { mg.fillStyle = '#9fe8ff'; mg.beginPath(); mg.arc(MAGIC.circle.x * 2, MAGIC.circle.z * 2, 5, 0, Math.PI * 2); mg.fill(); },
    };
  },
};
