// Aibachu: one 64x64 open map. Camp in the middle, four zones around it.
// Grove = north-west, Old Hollow = north-east, Ember Ridge = south-east, Fen Shore = south-west.
import * as THREE from 'three';
import { makeNoise, mulberry32, sstep, lerp, clamp } from './noise.js';

export const SIZE = 64;
export const CENTER = 32;
export const WATER_Y = -0.35;
export const ZONE_NAMES = {
  camp: 'Camp',
  grove: 'Mossy Grove',
  hollow: 'Old Hollow',
  ridge: 'Ember Ridge',
  fen: 'Fen Shore',
};

const ZONE_KEYS = ['grove', 'hollow', 'ridge', 'fen'];
const SECTOR = { grove: -0.75 * Math.PI, hollow: -0.25 * Math.PI, ridge: 0.25 * Math.PI, fen: 0.75 * Math.PI };
const LAKE = { x: 13, z: 41, rx: 6.5, rz: 5 };
const SEG = 128; // terrain vertices per side - 1 (0.5 unit spacing)

const GROUND = {
  camp: ['#a88a5c', '#8f9a58'],
  grove: ['#5f9a3e', '#82b64e'],
  hollow: ['#3a5a3c', '#4f5c4c'],
  ridge: ['#b07a4c', '#caa064'],
  fen: ['#6f8048', '#8e9858'],
  dirt: '#b49a6c',
  sand: '#c6b483',
};

function angDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export function buildWorld(scene, lib) {
  const noise = makeNoise(41);
  const groundCols = {};
  for (const [k, v] of Object.entries(GROUND)) {
    groundCols[k] = Array.isArray(v) ? v.map((h) => new THREE.Color(h)) : new THREE.Color(v);
  }

  function weights(x, z) {
    const dx = x - CENTER, dz = z - CENTER, r = Math.hypot(dx, dz);
    const a = Math.atan2(dz, dx) + (noise.fbm(x * 0.07 + 40, z * 0.07 + 40, 3) - 0.5) * 1.3;
    const w = { camp: 0 };
    let sum = 0;
    for (const k of ZONE_KEYS) {
      const d = Math.abs(angDiff(a, SECTOR[k]));
      const v = clamp(0.5 + (Math.PI / 4 - d) / 0.4, 0, 1);
      w[k] = v;
      sum += v;
    }
    const c = 1 - sstep(5.5, 8.5, r + (noise.n(x * 0.3, z * 0.3) - 0.5) * 1.5);
    for (const k of ZONE_KEYS) w[k] = (w[k] / (sum || 1)) * (1 - c);
    w.camp = c;
    return w;
  }

  function zoneAt(x, z) {
    const w = weights(x, z);
    let best = 'camp', bv = -1;
    for (const k in w) if (w[k] > bv) { bv = w[k]; best = k; }
    return best;
  }

  const edgeDist = (x, z) => Math.min(x, z, SIZE - x, SIZE - z);
  const lakeD = (x, z) => Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz);

  function heightAt(x, z) {
    const w = weights(x, z);
    const r = Math.hypot(x - CENTER, z - CENTER);
    let h = (noise.fbm(x * 0.06, z * 0.06) - 0.5) * 1.4;
    h += w.ridge * (1.3 + (noise.fbm(x * 0.15 + 9, z * 0.15) - 0.5) * 1.6);
    h -= w.hollow * 0.15;
    h = lerp(0.05, h, sstep(4, 9, r));
    // soften dips so only the lake goes below water (lowest result ≈ WATER_Y + 0.1)
    if (h < WATER_Y + 0.25) h = WATER_Y + 0.25 + (h - WATER_Y - 0.25) * 0.2;
    const ld = lakeD(x, z);
    if (ld < 1.5) h = lerp(h, -1.1, sstep(1.5, 0.65, ld));
    const e = edgeDist(x, z);
    if (e < 6) h += Math.pow((6 - e) / 6, 2) * 3.5;
    return h;
  }

  // Dirt trails from camp out into each zone.
  function pathDist(x, z) {
    const dx = x - CENTER, dz = z - CENTER, r = Math.hypot(dx, dz);
    if (r < 4.5 || r > 26) return Infinity;
    let best = Infinity;
    ZONE_KEYS.forEach((k, i) => {
      const a = SECTOR[k] + 0.2 * Math.sin(r * 0.33 + i * 1.7);
      const d = Math.hypot(x - (CENTER + Math.cos(a) * r), z - (CENTER + Math.sin(a) * r));
      best = Math.min(best, d + sstep(20, 26, r) * 1.5);
    });
    return best;
  }

  const walkable = (x, z) => edgeDist(x, z) > 2.4 && heightAt(x, z) > WATER_Y + 0.08;

  function colorAt(x, z, h) {
    const w = weights(x, z);
    const out = new THREE.Color(0, 0, 0);
    const tmp = new THREE.Color();
    for (const k of ['camp', ...ZONE_KEYS]) {
      if (w[k] <= 0.001) continue;
      const [a, b] = groundCols[k];
      const t = sstep(0.35, 0.65, noise.fbm(x * 0.16 + k.length * 13, z * 0.16, 3));
      tmp.copy(a).lerp(b, t);
      out.r += tmp.r * w[k]; out.g += tmp.g * w[k]; out.b += tmp.b * w[k];
    }
    const pd = pathDist(x, z);
    if (pd < 1.4) out.lerp(groundCols.dirt, sstep(1.4, 0.5, pd + (noise.n(x * 0.9, z * 0.9) - 0.5) * 0.6) * 0.9);
    if (w.camp > 0.3) out.lerp(groundCols.dirt, sstep(0.3, 1, w.camp) * sstep(4.5, 2.5, Math.hypot(x - CENTER, z - CENTER)) * 0.8);
    if (lakeD(x, z) < 1.6 && h < WATER_Y + 0.45) out.lerp(groundCols.sand, sstep(WATER_Y + 0.45, WATER_Y + 0.05, h) * 0.85);
    const e = edgeDist(x, z);
    if (e < 6) out.multiplyScalar(1 - 0.3 * sstep(6, 1.5, e));
    out.multiplyScalar(0.9 + noise.fbm(x * 0.4, z * 0.4, 2) * 0.2);
    return out;
  }

  // ---------- Props ----------
  const rng = mulberry32(7);
  const props = [];
  const grid = new Map(); // 2-unit buckets for spacing + collision
  const key = (cx, cz) => cx * 1000 + cz;
  const near = (x, z, fn) => {
    const cx = Math.floor(x / 2), cz = Math.floor(z / 2);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const list = grid.get(key(cx + i, cz + j));
      if (list) for (const p of list) if (fn(p) === false) return false;
    }
    return true;
  };
  function place(type, x, z, force = false) {
    const def = lib.props[type];
    if (!force) {
      const ok = near(x, z, (p) => Math.hypot(p.x - x, p.z - z) >= Math.max(def.space, p.space) * 0.9);
      if (!ok) return false;
    }
    const v = Math.floor(rng() * def.variants.length);
    const s = force ? 1 : 0.85 + rng() * 0.3;
    const p = { type, v, x, z, s, coll: def.coll * s, shadow: def.shadow * s, space: def.space };
    props.push(p);
    const k = key(Math.floor(x / 2), Math.floor(z / 2));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
    return true;
  }

  // Camp layout (fixed)
  place('tent', 30.2, 29.6, true);
  place('chest', 34.4, 30.6, true);
  place('log', 30.4, 34.3, true);
  place('log', 33.8, 34.5, true);
  const FIRE = { x: 32, z: 32.4 };
  {
    const p = { type: '_fire', x: FIRE.x, z: FIRE.z, s: 1, coll: 0.55, shadow: 0, space: 1.2 };
    props.push(p);
    const k = key(Math.floor(p.x / 2), Math.floor(p.z / 2));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
  }

  const TABLE = {
    grove: [['tree_grove', 30], ['bush', 16], ['flowers', 22], ['grass', 26], ['stump', 3], ['rock_grey', 3]],
    hollow: [['tree_dark', 34], ['mushroom_big', 10], ['mushrooms', 22], ['grass_dark', 24], ['tree_dead', 5], ['rock_grey', 5]],
    ridge: [['rock', 22], ['rock_small', 20], ['shrub_dry', 18], ['tree_dead', 12], ['grass_dry', 28]],
    fen: [['tree_willow', 14], ['reeds', 30], ['grass', 30], ['stump', 6], ['bush', 10]],
    camp: [['grass', 1]],
  };
  const pick = (zone) => {
    const t = TABLE[zone];
    const total = t.reduce((s, [, w]) => s + w, 0);
    let r = rng() * total;
    for (const [type, w] of t) { if ((r -= w) <= 0) return type; }
    return t[0][0];
  };
  const BORDER = { grove: 'tree_grove', hollow: 'tree_dark', ridge: 'rock', fen: 'tree_willow', camp: 'tree_grove' };

  // Edge treeline frames the map
  for (let i = 0; i < 900; i++) {
    const x = 0.5 + rng() * 63, z = 0.5 + rng() * 63;
    const e = edgeDist(x, z);
    if (e < 0.8 || e > 3.6) continue;
    const zone = zoneAt(x, z);
    const type = zone === 'ridge' && rng() < 0.3 ? 'tree_dead' : BORDER[zone];
    place(type, x, z);
  }

  // Interior scatter
  let interior = 0;
  for (let i = 0; i < 5000 && interior < 300; i++) {
    const x = 3 + rng() * 58, z = 3 + rng() * 58;
    const r = Math.hypot(x - CENTER, z - CENTER);
    if (r < 7.5 && rng() > 0.15) continue;
    const h = heightAt(x, z);
    if (h < WATER_Y + 0.15) continue;
    const zone = r < 7.5 ? 'camp' : zoneAt(x, z);
    let type = pick(zone);
    const def = lib.props[type];
    const pd = pathDist(x, z);
    if (pd < 1.6 && def.coll > 0) continue;
    if (pd < 0.9) continue;
    // reeds hug the lake shore
    if (zone === 'fen' && lakeD(x, z) < 1.7 && rng() < 0.7) type = 'reeds';
    if (place(type, x, z)) interior++;
  }

  // ---------- Terrain mesh ----------
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  geo.translate(CENTER, 0, CENTER);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const shade = new Float32Array(pos.count).fill(1);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, heightAt(x, z));
  }
  // bake soft shadows under props (light from upper-left)
  const stride = SEG + 1;
  for (const p of props) {
    if (!p.shadow) continue;
    const sx = p.x + 0.35, sz = p.z + 0.25, rad = p.shadow;
    const i0 = Math.max(0, Math.floor((sx - rad) * 2)), i1 = Math.min(SEG, Math.ceil((sx + rad) * 2));
    const j0 = Math.max(0, Math.floor((sz - rad) * 2)), j1 = Math.min(SEG, Math.ceil((sz + rad) * 2));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const d = Math.hypot(i * 0.5 - sx, (j * 0.5 - sz) * 1.3) / rad;
      if (d < 1) shade[j * stride + i] *= 1 - 0.38 * (1 - d * d);
    }
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const c = colorAt(x, z, pos.getY(i)).multiplyScalar(shade[i]);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: lib.ground }));
  scene.add(terrain);

  // ---------- Water ----------
  const waterGeo = new THREE.PlaneGeometry(LAKE.rx * 3.2, LAKE.rz * 3.2);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeo, new THREE.MeshLambertMaterial({
    color: '#5aa6c4', map: lib.water, transparent: true, opacity: 0.82, depthWrite: false,
  }));
  water.position.set(LAKE.x, WATER_Y, LAKE.z);
  water.renderOrder = 1;
  scene.add(water);

  // ---------- Prop sprites ----------
  const tall = []; // big props that fade out when they hide the player
  const tintMats = [];
  for (const def of Object.values(lib.props)) for (const v of def.variants) {
    tintMats.push(v.mat);
    v.faded = v.mat.clone();
    v.faded.transparent = true;
    v.faded.opacity = 0.35;
    v.faded.alphaTest = 0.05;
    v.faded.depthWrite = false;
    tintMats.push(v.faded);
  }
  for (const p of props) {
    if (p.type === '_fire') continue;
    const def = lib.props[p.type];
    const variant = def.variants[p.v];
    const s = new THREE.Sprite(variant.mat);
    const w = def.w * p.s;
    s.scale.set(w, w * variant.aspect, 1);
    s.center.set(0.5, 0.04);
    s.position.set(p.x, heightAt(p.x, p.z), p.z);
    scene.add(s);
    if (w >= 1.6) tall.push({ s, x: p.x, z: p.z, w, h: w * variant.aspect, variant });
  }
  function updateOcclusion(px, pz, cam) {
    for (const t of tall) {
      const dx = t.x - px, dz = t.z - pz;
      let fade = false;
      if (Math.abs(dx) < 6 && Math.abs(dz) < 6) {
        const along = dx * cam.fx + dz * cam.fz;     // < 0 = between camera and player
        const side = dx * cam.rx + dz * cam.rz;
        fade = along < 0.2 && along > -t.h * 0.9 && Math.abs(side) < t.w * 0.45 + 0.35;
      }
      const want = fade ? t.variant.faded : t.variant.mat;
      if (t.s.material !== want) t.s.material = want;
    }
  }

  // ---------- Campfire ----------
  const fireMat = new THREE.SpriteMaterial({ map: lib.fire.frames[0], alphaTest: 0.5 });
  const fire = new THREE.Sprite(fireMat);
  fire.scale.set(lib.fire.w, lib.fire.w * lib.fire.aspect, 1);
  fire.center.set(0.5, 0.04);
  fire.position.set(FIRE.x, heightAt(FIRE.x, FIRE.z), FIRE.z);
  scene.add(fire);
  const fireLight = new THREE.PointLight('#ff9a4a', 6, 9, 1.4);
  fireLight.position.set(FIRE.x, 1.2, FIRE.z);
  scene.add(fireLight);
  let fireT = 0;
  function update(dt, t) {
    fireT += dt;
    const f = Math.floor(fireT * 8) % 3;
    if (fireMat.map !== lib.fire.frames[f]) fireMat.map = lib.fire.frames[f];
    fireLight.intensity = 5.5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4;
    lib.water.offset.set(t * 0.015, t * 0.008);
  }

  // ---------- Collision ----------
  const solids = props.filter((p) => p.coll > 0);
  const sgrid = new Map();
  for (const p of solids) {
    const k = key(Math.floor(p.x / 2), Math.floor(p.z / 2));
    if (!sgrid.has(k)) sgrid.set(k, []);
    sgrid.get(k).push(p);
  }
  function resolve(x, z, r) {
    for (let iter = 0; iter < 2; iter++) {
      const cx = Math.floor(x / 2), cz = Math.floor(z / 2);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const list = sgrid.get(key(cx + i, cz + j));
        if (!list) continue;
        for (const p of list) {
          const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz), min = r + p.coll;
          if (d < min && d > 1e-4) { x = p.x + (dx / d) * min; z = p.z + (dz / d) * min; }
        }
      }
    }
    return [x, z];
  }

  // ---------- Minimap image ----------
  const mini = document.createElement('canvas');
  mini.width = mini.height = 128;
  const mg = mini.getContext('2d');
  const img = mg.createImageData(128, 128);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
    const x = i * 0.5 + 0.25, z = j * 0.5 + 0.25;
    const h = heightAt(x, z);
    let hex;
    if (h < WATER_Y) hex = '4f9cc0';
    else hex = colorAt(x, z, h).getHexString();
    const o = (j * 128 + i) * 4;
    img.data[o] = parseInt(hex.slice(0, 2), 16);
    img.data[o + 1] = parseInt(hex.slice(2, 4), 16);
    img.data[o + 2] = parseInt(hex.slice(4, 6), 16);
    img.data[o + 3] = 255;
  }
  mg.putImageData(img, 0, 0);
  for (const p of props) {
    if (p.coll < 0.4 || p.type === 'tent') continue;
    mg.fillStyle = 'rgba(30,40,25,.45)';
    mg.fillRect(p.x * 2 - 1, p.z * 2 - 1, 2, 2);
  }
  mg.fillStyle = '#ffd36b';
  mg.strokeStyle = '#3b2a1e';
  mg.lineWidth = 1.5;
  mg.beginPath(); mg.moveTo(64, 57); mg.lineTo(70, 66); mg.lineTo(58, 66); mg.closePath(); mg.fill(); mg.stroke();

  return {
    heightAt, zoneAt, walkable, resolve, update, updateOcclusion, tintMats, fireMat, fireLight,
    spawn: { x: 32, z: 36.2 },
    minimap: mini,
    stats: { props: props.length, interior },
  };
}
