// Steinborg, the walled market city: stone walls with towers and two gates, timber houses with
// steep roofs round a fountain square, a forge, market stalls and the seeress's tower. Ragnarok
// builds its towns in 3D under 2D sprites, so the city is real meshes (lit by the same sun and
// sky, so it darkens at night) while its people stay sprites. Painted canvas textures throughout.
// Buildings between the camera and the player fade, like the tall trees.
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
function stoneTex(rng, base = '#9c958a') {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#4e4840'; g.fillRect(0, 0, 128, 128);
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
function cobbleTex(rng) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#6a645a'; g.fillRect(0, 0, 128, 128);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const x = i * 16 + (j % 2) * 8, y = j * 16;
      g.fillStyle = vary(rng, '#a39b8c', 34);
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

// ---------- the city ----------
// ctx: { group, lib, heightAt, place(type, x, z, force), addBox(x0, z0, x1, z1, kind), addSolid(x, z, r), boxes }
export function buildCity(ctx) {
  const { group, place, addBox, addSolid } = ctx;
  const rng = mulberry32(512);
  const fades = []; // { meshes, x, z, r, h }
  const fadeMats = new Map();
  const lam = (opts) => new THREE.MeshLambertMaterial(opts);
  const M = {
    stone: lam({ map: stoneTex(rng) }),
    stoneDark: lam({ map: stoneTex(rng, '#7f786e') }),
    cobble: lam({ map: cobbleTex(rng), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    roofRed: lam({ map: roofTex(rng, '#a8483a') }),
    roofBlue: lam({ map: roofTex(rng, '#4a6488') }),
    roofBrown: lam({ map: roofTex(rng, '#7a5232') }),
    roofSlate: lam({ map: roofTex(rng, '#5a5a66') }),
    roofPurple: lam({ map: roofTex(rng, '#5a3a7a') }),
    plank: lam({ map: plankTex(rng) }),
    plankDark: lam({ map: plankTex(rng, '#5a3a22') }),
    water: lam({ map: waterTex(), color: '#bfe6ff' }),
    gold: lam({ color: '#e3b341' }),
  };
  M.cobble.map.repeat.set(1, 1);
  for (const k of ['roofRed', 'roofBlue', 'roofBrown', 'roofSlate', 'roofPurple']) M[k].map.repeat.set(0.8, 0.8);
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

  // ---------- paving ----------
  const pw = WALL.x1 - WALL.x0, pd = WALL.z1 - WALL.z0;
  const pave = new THREE.PlaneGeometry(pw, pd);
  pave.rotateX(-Math.PI / 2);
  const puv = pave.attributes.uv;
  for (let i = 0; i < puv.count; i++) puv.setXY(i, puv.getX(i) * pw / 2, puv.getY(i) * pd / 2);
  mesh(pave, M.cobble, (WALL.x0 + WALL.x1) / 2, Y + 0.02, (WALL.z0 + WALL.z1) / 2).renderOrder = 0;
  // paved roads out through the gates
  for (const [x, z, w, d] of [[32, 58.5, GATE * 2, 7], [58.5, 32, 7, GATE * 2]]) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    const u = g.attributes.uv;
    for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * w / 2, u.getY(i) * d / 2);
    mesh(g, M.cobble, x, ctx.heightAt(x, z) + 0.03, z);
  }

  // ---------- walls, gates and towers ----------
  const { x0, x1, z0, z1, t, h } = WALL;
  const runs = [ // [axis, fixed, from, to]
    ['x', z0, x0, x1],
    ['x', z1, x0, 32 - GATE], ['x', z1, 32 + GATE, x1],
    ['z', x0, z0, z1],
    ['z', x1, z0, 32 - GATE], ['z', x1, 32 + GATE, z1],
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
      const out = (axis === 'x' ? (fixed < 32 ? -1 : 1) : (fixed < 32 ? -1 : 1)) * (t / 2 - 0.28);
      for (let k = 0.5; k < len; k += 1.1) {
        const p = s + k;
        parts.push(mesh(merlon, M.stoneDark, axis === 'x' ? p : fixed + out, Y + h + 0.27, axis === 'x' ? fixed + out : p));
      }
      addBox(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 'wall');
      fadeable(parts, cx, cz, len / 2, h + 0.6);
    }
  }
  // gatehouses: an arch over each gateway between two towers
  const towers = [[x0, z0], [x1, z0], [x0, z1], [x1, z1], [32 - GATE - 0.6, z1], [32 + GATE + 0.6, z1], [x1, 32 - GATE - 0.6], [x1, 32 + GATE + 0.6]];
  for (const [tx, tz] of towers) {
    const r = 1.25, th = h + 1.5;
    const body = mesh(cylUV(new THREE.CylinderGeometry(r, r * 1.08, th, 14), r, th, 2), M.stone, tx, Y + th / 2, tz);
    const cone = new THREE.ConeGeometry(r * 1.3, 1.8, 14);
    const roof = mesh(cone, M.roofRed, tx, Y + th + 0.9, tz);
    addSolid(tx, tz, r);
    fadeable([body, roof], tx, tz, r, th + 1.8);
  }
  for (const [ax, gx, gz] of [['x', 32, z1], ['z', x1, 32]]) {
    const span = GATE * 2 + 1.2, lw = ax === 'x' ? span : t + 0.2, ld = ax === 'x' ? t + 0.2 : span;
    const lintel = mesh(boxUV(new THREE.BoxGeometry(lw, 1.0, ld), lw, 1, ld, 2), M.stoneDark, gx, Y + h + 0.1, gz);
    // a blue banner with the city's white tower, hung under the arch
    const ban = canvasTex(32, 48, (g) => { g.fillStyle = '#2f4f8a'; g.fillRect(0, 0, 32, 40); g.beginPath(); g.moveTo(0, 40); g.lineTo(16, 48); g.lineTo(32, 40); g.fill(); g.fillStyle = '#f2ead8'; g.fillRect(11, 12, 10, 20); g.fillRect(9, 9, 4, 4); g.fillRect(14, 9, 4, 4); g.fillRect(19, 9, 4, 4); });
    const bm = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.35), lam({ map: ban, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
    bm.position.set(gx + (ax === 'x' ? 0 : t / 2 + 0.12), Y + h - 0.6, gz + (ax === 'x' ? t / 2 + 0.12 : 0));
    if (ax === 'z') bm.rotation.y = Math.PI / 2;
    group.add(bm);
    fadeable([lintel, bm], gx, gz, span / 2, h + 1);
  }

  // ---------- houses ----------
  const ROOFS = [M.roofRed, M.roofBlue, M.roofBrown, M.roofSlate];
  function house(x, z, w, d, opts = {}) {
    const wh = opts.h || 2.3, rh = opts.roof || 1.6;
    const plaster = opts.plaster || ['#e8dcc0', '#efe4cc', '#dccfb0', '#e6d6c2'][Math.floor(rng() * 4)];
    const front = lam({ map: houseFace(rng, w, true, plaster) });
    const side = lam({ map: houseFace(rng, d, false, plaster) });
    const back = lam({ map: houseFace(rng, w, false, plaster) });
    const body = mesh(new THREE.BoxGeometry(w, wh, d), [side, side, M.plankDark, M.plankDark, front, back], x, Y + wh / 2, z);
    const roofMat = opts.roofMat || ROOFS[Math.floor(rng() * ROOFS.length)];
    const roof = mesh(gable(w, d, rh), [lam({ map: houseFace(rng, d, false, plaster) }), roofMat], x, Y + wh, z);
    const parts = [body, roof];
    if (opts.chimney) parts.push(mesh(boxUV(new THREE.BoxGeometry(0.6, 1.4, 0.6), 0.6, 1.4, 0.6, 2), M.stoneDark, x + w * 0.28, Y + wh + rh * 0.7, z - d * 0.15));
    addBox(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
    fadeable(parts, x, z, Math.max(w, d) / 2, wh + rh);
    return parts;
  }
  // the Jarl's hall: long, tall, stone below, a dragon-ish ridge
  house(32, 15.6, 11, 6, { h: 3.2, roof: 2.6, roofMat: M.roofSlate, plaster: '#d8ccb0', chimney: true });
  house(15, 14.8, 5, 5, { chimney: true });
  house(21.8, 14.4, 5, 4.4);
  house(43, 14.4, 5.4, 4.4);
  house(14.4, 24.6, 5, 6);
  house(14.4, 40.2, 5, 6, { chimney: true });
  house(15.2, 49.4, 6, 5);
  house(23.2, 49.8, 5, 4.4);
  house(41.6, 49.8, 5, 4.4, { roofMat: M.roofBlue }); // the Watch house by the gate
  house(49.2, 49.2, 5, 5);
  house(49.4, 42, 5, 6);
  // the forge: open-fronted, with a big chimney
  house(46.6, 25.6, 6, 4.6, { roofMat: M.roofBrown, plaster: '#cfc2a8', chimney: true });
  // the seeress's tower: round and tall, with a purple cone roof
  {
    const r = 2.1, th = 5.2, tx = 48.6, tz = 15.6;
    const body = mesh(cylUV(new THREE.CylinderGeometry(r, r * 1.1, th, 16), r, th, 2), M.stone, tx, Y + th / 2, tz);
    const roof = mesh(new THREE.ConeGeometry(r * 1.35, 3, 16), M.roofPurple, tx, Y + th + 1.5, tz);
    const doorTex = canvasTex(32, 48, (g) => { g.fillStyle = '#3e2c20'; g.beginPath(); g.roundRect(2, 4, 28, 44, [14, 14, 0, 0]); g.fill(); g.fillStyle = '#5a3a7a'; g.beginPath(); g.roundRect(5, 7, 22, 41, [11, 11, 0, 0]); g.fill(); g.fillStyle = '#c8a0ff'; g.beginPath(); g.arc(16, 20, 3, 0, 7); g.fill(); });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), lam({ map: doorTex, transparent: true, alphaTest: 0.5 }));
    door.position.set(tx - 0.6, Y + 0.82, tz + r * 0.95);
    door.rotation.y = -0.3;
    group.add(door);
    addSolid(tx, tz, r + 0.1);
    fadeable([body, roof, door], tx, tz, r, th + 3);
  }

  // ---------- the fountain ----------
  {
    const { x, z } = CITY.fountain;
    // an open stone ring with water inside
    const ring = new THREE.Shape();
    ring.absarc(0, 0, 2.3, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 1.9, 0, Math.PI * 2, true);
    ring.holes.push(hole);
    const rim = new THREE.ExtrudeGeometry(ring, { depth: 0.6, bevelEnabled: false, curveSegments: 24 });
    rim.rotateX(-Math.PI / 2);
    const basin = mesh(rim, M.stone, x, Y, z);
    M.stone.map.repeat.set(1, 1);
    const wat = new THREE.CircleGeometry(1.95, 24);
    wat.rotateX(-Math.PI / 2);
    mesh(wat, M.water, x, Y + 0.42, z);
    mesh(cylUV(new THREE.CylinderGeometry(0.28, 0.4, 1.5, 10), 0.3, 1.5, 1), M.stoneDark, x, Y + 1.1, z);
    mesh(new THREE.CylinderGeometry(0.8, 0.3, 0.3, 14), M.stone, x, Y + 1.85, z);
    const spout = new THREE.SphereGeometry(0.22, 10, 8);
    mesh(spout, M.water, x, Y + 2.08, z);
    addSolid(x, z, CITY.fountain.r);
    void basin;
  }

  // ---------- market stalls ----------
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
  stall(CITY.stall.x, CITY.stall.z, stripeTex('#c8463c', '#f2ead8'));
  stall(37.6, 25.2, stripeTex('#3a6aa8', '#f2ead8'));

  // ---------- props: lamps, barrels, crates, the anvil, trees and flowerbeds ----------
  const P = (type, x, z) => place(type, x, z, true);
  for (const [x, z] of [[29.4, 38], [34.6, 38], [29.4, 45.5], [34.6, 45.5], [39.5, 29.2], [39.5, 34.8], [46.5, 34.8], [24.5, 34.8], [24.6, 20.2], [39.4, 20.2]]) P('lamp', x, z);
  P('anvil', 44.6, 28.9); P('barrel', 49.6, 28.6); P('barrel', 50.4, 29.5); P('crate', 43.2, 28.6);
  P('crate', 21.2, 29.8); P('crate', 21.5, 31.1); P('barrel', 28.6, 24.4); P('crate', 39.6, 24.4); P('barrel', 35.6, 24.4);
  P('barrel', 38.4, 52.2); P('crate', 19.4, 51.6);
  for (const [x, z] of [[12.2, 32.4], [18.6, 44.6], [44.4, 44.6], [12.4, 19.6], [52.2, 35.6], [26.2, 41.2], [38.2, 41]]) P('tree_grove', x, z);
  // Ragna's herb garden
  for (const [x, z] of [[18.4, 19.4], [19.6, 18.6], [20.8, 19.2], [18.8, 20.6], [21.6, 20.4]]) P(rng() < 0.5 ? 'flowers' : 'bush', x, z);
  for (const [x, z] of [[28.2, 34.6], [35.8, 34.6], [28.2, 27.4], [35.8, 27.4], [30.4, 19.8], [33.6, 19.8], [44.6, 38.6], [19.6, 38.6]]) P('flowers', x, z);

  // ---------- minimap ----------
  function minimap(mg) {
    mg.fillStyle = '#b3ab9c';
    mg.fillRect(x0 * 2, z0 * 2, (x1 - x0) * 2, (z1 - z0) * 2);
    mg.fillStyle = '#8a5a3a';
    for (const b of ctx.boxes) if (b.kind !== 'wall') mg.fillRect(b.x0 * 2, b.z0 * 2, (b.x1 - b.x0) * 2, (b.z1 - b.z0) * 2);
    mg.fillStyle = '#5a5650';
    for (const b of ctx.boxes) if (b.kind === 'wall') mg.fillRect(b.x0 * 2, b.z0 * 2, (b.x1 - b.x0) * 2, (b.z1 - b.z0) * 2);
    mg.fillStyle = '#4f9cc0';
    mg.beginPath(); mg.arc(CITY.fountain.x * 2, CITY.fountain.z * 2, 4, 0, Math.PI * 2); mg.fill();
  }

  // fade what stands between the camera and the player
  function occlude(px, pz, cam) {
    for (const f of fades) {
      const dx = f.x - px, dz = f.z - pz;
      let fade = false;
      if (Math.abs(dx) < 8 + f.r && Math.abs(dz) < 8 + f.r) {
        const along = dx * cam.fx + dz * cam.fz, side = dx * cam.rx + dz * cam.rz;
        fade = along < 0.4 + f.r * 0.5 && along > -f.h * 1.1 - f.r && Math.abs(side) < f.r + 0.6;
      }
      for (const m of f.meshes) {
        const want = fade ? (Array.isArray(m.userData.solid) ? m.userData.solid.map(faded) : faded(m.userData.solid)) : m.userData.solid;
        if (m.material !== want && (!Array.isArray(want) || m.material[0] !== want[0])) m.material = want;
      }
    }
  }
  return { occlude, minimap };
}
