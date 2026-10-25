// Aria's maps, Ragnarok style: the camp is a small town map, Steinborg a walled city, and every
// field a 64x64 map of its own. Warp portals at the map edges join them. Only Mosvangr (north)
// and Fenstrand (west) open from the camp; everything else is reached by travelling on:
//
//              Steinborg - Birkilund
//                  |           |
//   Saltvik    Mosvangr  -  Myrkdal  -  Svartskog
//      |           |           |           |
//  Fenstrand - Eldrun Camp   Glodberg  -  Askheid
//
// Every map is built once, at load, into its own group; only the current one is shown.
import * as THREE from 'three';
import { makeNoise, mulberry32, sstep, lerp, clamp } from './noise.js';
import { buildCity, WALL } from './city.js';

export const SIZE = 64;
export const CENTER = 32;
export const WATER_Y = -0.35;
// Old Norse-style place names (the great names of the myths are kept for later lands)
export const ZONE_NAMES = {
  camp: 'Eldrun Camp',  // "fire-ring"
  grove: 'Mosvangr',    // "moss-field"
  hollow: 'Myrkdal',    // "dark dale"
  ridge: 'Glodberg',    // "ember-hill"
  fen: 'Fenstrand',     // "fen-shore"
  city: 'Steinborg',    // "stone-fort"
  birch: 'Birkilund',   // "birch grove"
  coast: 'Saltvik',     // "salt bay"
  deep: 'Svartskog',    // "black wood"
  heath: 'Askheid',     // "ash heath"
  magic: 'Galdrheim',   // "spell-home": the city of sorcerers
  stones: 'Grjotvangr', // "stone-field": the kobolds' hills
  coalpit: 'Kolgrof',   // "coal pit": the Kobold King's quarry
  burnt: 'Brennholt',   // "burnt wood": goblin country
  serpent: 'Ormholt',   // "serpent wood": the Goblin King's wood
};

const CAMP_R = 17;   // the camp clearing's walkable radius
const CAMP_SAFE = 8.5; // monsters never come this close to the fire
// portals: where they stand and where they lead. Arriving through one puts you beside the
// portal on the other side that leads back.
const N = { x: 32, z: 6 }, S = { x: 32, z: 58 }, E = { x: 58, z: 32 }, W = { x: 6, z: 32 };
// lift: [height added, extra roughness]
export const MAPS = {
  camp:   { portals: [{ to: 'grove', x: 32, z: 16.5 }, { to: 'fen', x: 16.5, z: 32 }] },
  grove:  { portals: [{ to: 'camp', ...S }, { to: 'city', ...N }, { to: 'hollow', ...E }] },
  fen:    { portals: [{ to: 'camp', ...E }, { to: 'coast', ...W }, { to: 'magic', ...N }], lake: { x: 30, z: 37, rx: 8, rz: 6 } },
  city:   { portals: [{ to: 'grove', x: 32, z: 59 }, { to: 'birch', x: 59, z: 32 }], city: 'city' },
  magic:  { portals: [{ to: 'fen', x: 32, z: 59 }], city: 'magic' },
  birch:  { portals: [{ to: 'city', ...W }, { to: 'hollow', ...S }], clear: { x: 40, z: 22, r: 5 } },
  hollow: { portals: [{ to: 'grove', ...W }, { to: 'birch', ...N }, { to: 'deep', ...E }, { to: 'ridge', ...S }], lift: [-0.15, 0] },
  // the Ember Jarl's lair: an open bowl in the south of Glodberg (see mobs.js)
  ridge:  { portals: [{ to: 'hollow', ...N }, { to: 'heath', ...E }], clear: { x: 32, z: 48, r: 6 }, lift: [1.3, 1.8] },
  coast:  { portals: [{ to: 'fen', ...E }, { to: 'stones', ...S }], lake: { x: 20, z: 31, rx: 11, rz: 17 }, clear: { x: 44, z: 46, r: 5 } },
  deep:   { portals: [{ to: 'hollow', ...W }, { to: 'heath', ...S }, { to: 'serpent', ...E }], lift: [-0.1, 0.5], clear: { x: 40, z: 40, r: 5 } },
  heath:  { portals: [{ to: 'ridge', ...W }, { to: 'deep', ...N }, { to: 'burnt', ...E }], lift: [0.8, 1.2], clear: { x: 40, z: 44, r: 5 } },
  // the kobolds' hills and the Kobold King's quarry (his court is the open ground in the south),
  // goblin country and the Goblin King's wood (his clearing is in the north). camps: [x, z] of
  // a tent with crates and barrels round a log seat.
  stones:  { portals: [{ to: 'coast', ...N }, { to: 'coalpit', ...S }], lift: [0.6, 1.4], camps: [[18, 20], [46, 44], [16, 46], [46, 18]] },
  coalpit: { portals: [{ to: 'stones', ...N }], lift: [0.4, 2.0], clear: { x: 32, z: 46, r: 7 }, camps: [[18, 24], [46, 24], [22, 44], [42, 42]] },
  burnt:   { portals: [{ to: 'heath', ...W }, { to: 'serpent', ...N }], lift: [0, 0.4], camps: [[20, 20], [46, 46], [20, 46]] },
  serpent: { portals: [{ to: 'burnt', ...S }, { to: 'deep', ...W }], lift: [-0.1, 0.5], clear: { x: 32, z: 16, r: 7 }, camps: [[20, 20], [44, 40], [20, 44], [46, 18]] },
};
const SEG = 128; // terrain vertices per side - 1 (0.5 unit spacing)

const GROUND = {
  camp: ['#a88a5c', '#8f9a58'],
  grove: ['#5f9a3e', '#82b64e'],
  hollow: ['#3a5a3c', '#4f5c4c'],
  ridge: ['#b07a4c', '#caa064'],
  fen: ['#6f8048', '#8e9858'],
  city: ['#8a8478', '#9a9488'],
  magic: ['#6f8a5e', '#86a070'],
  birch: ['#7fae4e', '#9cc45e'],
  coast: ['#c2b07e', '#d4c494'],
  deep: ['#26382a', '#30402f'],
  heath: ['#6e665e', '#857a6c'],
  stones: ['#9a8a62', '#b4a476'],
  coalpit: ['#4c4642', '#625a52'],
  burnt: ['#4a4036', '#62533f'],
  serpent: ['#2c4230', '#3a5236'],
  dirt: '#b49a6c',
  sand: '#c6b483',
};
const TABLE = {
  grove: [['tree_grove', 30], ['bush', 16], ['flowers', 22], ['grass', 26], ['stump', 3], ['rock_grey', 3]],
  hollow: [['tree_dark', 34], ['mushroom_big', 10], ['mushrooms', 22], ['grass_dark', 24], ['tree_dead', 5], ['rock_grey', 5]],
  ridge: [['rock', 22], ['rock_small', 20], ['shrub_dry', 18], ['tree_dead', 12], ['grass_dry', 28]],
  fen: [['tree_willow', 14], ['reeds', 30], ['grass', 30], ['stump', 6], ['bush', 10]],
  camp: [['grass', 6], ['flowers', 3], ['bush', 1]],
  city: [['grass', 6], ['flowers', 3]],
  magic: [['grass', 6], ['flowers', 4]],
  birch: [['tree_birch', 28], ['flowers', 24], ['grass', 30], ['bush', 10], ['stump', 3]],
  coast: [['grass_dry', 30], ['rock_grey', 9], ['reeds', 14], ['shrub_dry', 14], ['rock_small', 10], ['tree_willow', 3]],
  deep: [['tree_dark', 42], ['mushroom_big', 14], ['mushrooms', 24], ['grass_dark', 20], ['tree_dead', 4]],
  heath: [['tree_dead', 16], ['rock', 14], ['rock_small', 22], ['shrub_dry', 22], ['grass_dry', 26]],
  stones: [['rock', 18], ['rock_grey', 14], ['rock_small', 22], ['shrub_dry', 16], ['grass_dry', 30], ['tree_dead', 5]],
  coalpit: [['rock_grey', 24], ['rock', 8], ['rock_small', 28], ['tree_dead', 14], ['grass_dark', 12], ['shrub_dry', 8]],
  burnt: [['tree_dead', 34], ['stump', 16], ['rock_small', 14], ['grass_dry', 18], ['shrub_dry', 10], ['rock_grey', 5]],
  serpent: [['tree_dark', 36], ['mushroom_big', 10], ['mushrooms', 18], ['grass_dark', 22], ['stump', 6], ['tree_dead', 6]],
};
const BORDER = { grove: 'tree_grove', hollow: 'tree_dark', ridge: 'rock', fen: 'tree_willow', camp: 'tree_grove', city: 'tree_grove', magic: 'tree_birch', birch: 'tree_birch', coast: 'rock_grey', deep: 'tree_dark', heath: 'tree_dead', stones: 'rock', coalpit: 'rock_grey', burnt: 'tree_dead', serpent: 'tree_dark' };
// inside the city walls (and a step beyond them)
const inWalls = (x, z, m = 0) => x > WALL.x0 - m && x < WALL.x1 + m && z > WALL.z0 - m && z < WALL.z1 + m;

// one map: terrain, props, water, collision and minimap, in a group of its own
function buildMap(id, scene, lib, shared) {
  const def = MAPS[id];
  const isCamp = id === 'camp', isCity = !!def.city;
  const [lift, rough] = def.lift || [0, 0];
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const noise = makeNoise(41 + id.length * 7 + id.charCodeAt(0));
  const groundCols = {};
  for (const [k, v] of Object.entries(GROUND)) {
    groundCols[k] = Array.isArray(v) ? v.map((h) => new THREE.Color(h)) : new THREE.Color(v);
  }
  const LAKE = def.lake;
  const edgeDist = (x, z) => Math.min(x, z, SIZE - x, SIZE - z);
  const lakeD = (x, z) => (LAKE ? Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) : 9);
  const campR = (x, z) => Math.hypot(x - CENTER, z - CENTER);

  // dirt trails from each portal to the middle of the map, wandering a little
  const trails = def.portals.map((p, i) => ({ ax: p.x, az: p.z, bx: CENTER, bz: CENTER, k: i * 1.7 }));
  function pathDist(x, z) {
    let best = Infinity;
    for (const t of trails) {
      const vx = t.bx - t.ax, vz = t.bz - t.az, L = Math.hypot(vx, vz);
      const u = clamp(((x - t.ax) * vx + (z - t.az) * vz) / (L * L), 0, 1);
      const wob = Math.sin(u * 7 + t.k) * 1.4 * Math.sin(u * Math.PI);
      const px = t.ax + vx * u - (vz / L) * wob, pz = t.az + vz * u + (vx / L) * wob;
      best = Math.min(best, Math.hypot(x - px, z - pz));
    }
    return isCamp && campR(x, z) < 5 ? Infinity : best;
  }

  function heightAt(x, z) {
    let h = (noise.fbm(x * 0.06, z * 0.06) - 0.5) * 1.4;
    h += lift + (rough ? (noise.fbm(x * 0.15 + 9, z * 0.15) - 0.5) * rough : 0);
    if (isCity) h = lerp(0.05, h * 0.6 + 0.05, sstep(1, 4, -Math.min(x - WALL.x0, WALL.x1 - x, z - WALL.z0, WALL.z1 - z))); // flat inside the walls
    if (isCamp) {
      const r = campR(x, z);
      h = lerp(0.05, h * 0.5, sstep(4, 12, r));
      if (r > CAMP_R - 1) h += Math.pow(Math.min(1, (r - CAMP_R + 1) / 7), 2) * 3.5; // wooded hills all around
    }
    // soften dips so only the lake goes below water (lowest result ≈ WATER_Y + 0.1)
    if (h < WATER_Y + 0.25) h = WATER_Y + 0.25 + (h - WATER_Y - 0.25) * 0.2;
    const ld = lakeD(x, z);
    if (ld < 1.5) h = lerp(h, -1.1, sstep(1.5, 0.65, ld));
    // flat ground under the portals and along the trails' ends
    for (const p of def.portals) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < 3) h = lerp(h, heightNoPortal(p.x, p.z), sstep(3, 1.2, d));
    }
    const e = edgeDist(x, z);
    if (e < 6) h += Math.pow((6 - e) / 6, 2) * 3.5;
    return h;
  }
  function heightNoPortal(x, z) {
    let h = (noise.fbm(x * 0.06, z * 0.06) - 0.5) * 1.4 + lift;
    if (isCamp) h = lerp(0.05, h * 0.5, sstep(4, 12, campR(x, z)));
    if (isCity) h = lerp(0.05, h * 0.6 + 0.05, sstep(1, 4, -Math.min(x - WALL.x0, WALL.x1 - x, z - WALL.z0, WALL.z1 - z)));
    return Math.max(h, WATER_Y + 0.25);
  }

  const walkable = (x, z) => edgeDist(x, z) > 2.4 && (!isCamp || campR(x, z) < CAMP_R) && heightAt(x, z) > WATER_Y + 0.08;
  const isSafe = () => isCamp || isCity; // towns are safe ground

  function colorAt(x, z, h) {
    const out = new THREE.Color();
    const [a, b] = groundCols[id];
    out.copy(a).lerp(b, sstep(0.35, 0.65, noise.fbm(x * 0.16 + 13, z * 0.16, 3)));
    if (isCamp) {
      const grass = groundCols.grove[0].clone().lerp(groundCols.grove[1], noise.fbm(x * 0.2, z * 0.2, 2));
      out.lerp(grass, sstep(9, 15, campR(x, z) + (noise.n(x * 0.3, z * 0.3) - 0.5) * 3));
      out.lerp(groundCols.dirt, sstep(4.5, 2.5, campR(x, z)) * 0.8);
    }
    const pd = pathDist(x, z);
    if (pd < 1.4) out.lerp(groundCols.dirt, sstep(1.4, 0.5, pd + (noise.n(x * 0.9, z * 0.9) - 0.5) * 0.6) * 0.9);
    if (lakeD(x, z) < 1.6 && h < WATER_Y + 0.45) out.lerp(groundCols.sand, sstep(WATER_Y + 0.45, WATER_Y + 0.05, h) * 0.85);
    const e = Math.min(edgeDist(x, z), isCamp ? CAMP_R + 3 - campR(x, z) : 99);
    if (e < 6) out.multiplyScalar(1 - 0.3 * sstep(6, 1.5, e));
    out.multiplyScalar(0.9 + noise.fbm(x * 0.4, z * 0.4, 2) * 0.2);
    return out;
  }

  // ---------- Props ----------
  const rng = mulberry32(7 + id.length * 31);
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
    const pd = lib.props[type];
    if (!force) {
      const ok = near(x, z, (p) => Math.hypot(p.x - x, p.z - z) >= Math.max(pd.space, p.space) * 0.9);
      if (!ok) return false;
      // keep portals clear
      if (def.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 2.6 + (pd.coll > 0 ? 0.8 : 0))) return false;
      if (def.clear && Math.hypot(def.clear.x - x, def.clear.z - z) < def.clear.r && pd.coll > 0) return false;
    }
    const v = Math.floor(rng() * pd.variants.length);
    const s = force ? 1 : 0.85 + rng() * 0.3;
    const p = { type, v, x, z, s, coll: pd.coll * s, shadow: pd.shadow * s, space: pd.space };
    props.push(p);
    const k = key(Math.floor(x / 2), Math.floor(z / 2));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
    return true;
  }

  const FIRE = { x: 32, z: 32.4 };
  if (isCamp) {
    place('tent', 30.2, 29.6, true);
    place('chest', 34.4, 30.6, true);
    place('log', 30.4, 34.3, true);
    place('log', 33.8, 34.5, true);
    const p = { type: '_fire', x: FIRE.x, z: FIRE.z, s: 1, coll: 0.55, shadow: 0, space: 1.2 };
    props.push(p);
    const k = key(Math.floor(p.x / 2), Math.floor(p.z / 2));
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(p);
  }

  const pick = (t) => {
    const total = t.reduce((s, [, w]) => s + w, 0);
    let r = rng() * total;
    for (const [type, w] of t) { if ((r -= w) <= 0) return type; }
    return t[0][0];
  };

  // ---------- Steinborg: walls, houses and the rest (city.js) ----------
  const boxes = []; // solid rectangles: walls, houses, stalls
  const solids = [];
  let city = null;
  if (isCity) {
    city = buildCity({
      group, lib, heightAt: (x, z) => heightAt(x, z), place, boxes,
      gates: def.portals.map((p) => (p.z > 55 ? 's' : p.x > 55 ? 'e' : p.x < 9 ? 'w' : 'n')),
      addBox: (x0, z0, x1, z1, kind) => boxes.push({ x0, z0, x1, z1, kind }),
      addSolid: (x, z, coll) => solids.push({ x, z, coll }),
    }, def.city);
  }

  // kobold and goblin camps: a tent, crates and barrels round a log seat
  for (const [x, z] of def.camps || []) {
    place('tent', x, z, true);
    place('crate', x + 2.4, z + 0.9, true);
    place('barrel', x + 2.6, z - 0.9, true);
    place('barrel', x - 2.4, z + 1.3, true);
    place('log', x + 0.3, z + 2.9, true);
  }

  // treeline framing the map (camp: a ring of forest around the clearing; city: outside the walls)
  for (let i = 0; i < (isCamp ? 1400 : 900); i++) {
    const x = 0.5 + rng() * 63, z = 0.5 + rng() * 63;
    const e = isCamp ? campR(x, z) - CAMP_R : 3.6 - edgeDist(x, z);
    if (isCity && (inWalls(x, z, 1.6) || pathDist(x, z) < 4.5 || edgeDist(x, z) > 3.4)) continue; // keep the walls in view
    if (isCity ? edgeDist(x, z) < 0.8 : isCamp ? e < 0.3 || e > 9 : e < 0 || edgeDist(x, z) < 0.8) continue;
    const type = id === 'ridge' && rng() < 0.3 ? 'tree_dead' : BORDER[id];
    place(type, x, z);
  }

  // interior scatter
  let interior = 0;
  const want = isCamp ? 40 : isCity ? 0 : 330;
  for (let i = 0; i < 6000 && interior < want; i++) {
    const x = 3 + rng() * 58, z = 3 + rng() * 58;
    if (isCamp && (campR(x, z) < 7.5 || campR(x, z) > CAMP_R - 1)) continue;
    const h = heightAt(x, z);
    if (h < WATER_Y + 0.15) continue;
    let type = pick(TABLE[id]);
    const pd = lib.props[type];
    const pdist = pathDist(x, z);
    if (pdist < 1.6 && pd.coll > 0) continue;
    if (pdist < 0.9) continue;
    if (LAKE && lakeD(x, z) < 1.7 && rng() < 0.7) type = 'reeds'; // reeds hug the lake shore
    if (place(type, x, z)) interior++;
  }

  // ---------- Terrain mesh ----------
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  geo.translate(CENTER, 0, CENTER);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const shade = new Float32Array(pos.count).fill(1);
  for (let i = 0; i < pos.count; i++) pos.setY(i, heightAt(pos.getX(i), pos.getZ(i)));
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
    const c = colorAt(pos.getX(i), pos.getZ(i), pos.getY(i)).multiplyScalar(shade[i]);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, map: lib.ground }));
  group.add(terrain);

  // ---------- Water ----------
  if (LAKE) {
    const waterGeo = new THREE.PlaneGeometry(LAKE.rx * 3.2, LAKE.rz * 3.2);
    waterGeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeo, new THREE.MeshLambertMaterial({
      color: '#5aa6c4', map: lib.water, transparent: true, opacity: 0.82, depthWrite: false,
    }));
    water.position.set(LAKE.x, WATER_Y, LAKE.z);
    water.renderOrder = 1;
    group.add(water);
  }

  // ---------- Prop sprites ----------
  const tall = []; // big props that fade out when they hide the player
  for (const p of props) {
    if (p.type === '_fire') continue;
    const pd = lib.props[p.type];
    const variant = pd.variants[p.v];
    const s = new THREE.Sprite(variant.mat);
    const w = pd.w * p.s;
    s.scale.set(w, w * variant.aspect, 1);
    s.center.set(0.5, 0.04);
    s.position.set(p.x, heightAt(p.x, p.z), p.z);
    group.add(s);
    if (w >= 1.6) tall.push({ s, x: p.x, z: p.z, w, h: w * variant.aspect, variant });
  }
  // trees and tall props between the camera and the hero (or what the hero is fighting) fade, so
  // neither hides under a wide canopy
  function updateOcclusion(px, pz, cam, also = null) {
    city?.occlude(px, pz, cam);
    const hides = (t, x, z) => {
      const dx = t.x - x, dz = t.z - z;
      if (Math.abs(dx) >= 6 || Math.abs(dz) >= 6) return false;
      const along = dx * cam.fx + dz * cam.fz;     // < 0 = between camera and the one behind
      const side = dx * cam.rx + dz * cam.rz;
      return along < 0.2 && along > -t.h * 0.9 && Math.abs(side) < t.w * 0.7 + 0.35;
    };
    for (const t of tall) {
      const fade = hides(t, px, pz) || (also && hides(t, also.x, also.z));
      const want = fade ? t.variant.faded : t.variant.mat;
      if (t.s.material !== want) t.s.material = want;
    }
  }

  // ---------- Warp portals: a swirl of light on the ground with motes rising ----------
  const portals = def.portals.map((p) => {
    const y = heightAt(p.x, p.z);
    const disc = new THREE.Mesh(shared.portalGeo, shared.portalMat);
    disc.position.set(p.x, y + 0.06, p.z);
    disc.renderOrder = 1;
    const glow = new THREE.Sprite(shared.glowMat);
    glow.scale.set(2.2, 2.6, 1);
    glow.center.set(0.5, 0.1);
    glow.position.set(p.x, y, p.z);
    glow.renderOrder = 3;
    const motes = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Sprite(shared.moteMat);
      m.renderOrder = 3;
      motes.push({ s: m, a: (i / 7) * Math.PI * 2, t: i / 7 });
      group.add(m);
    }
    group.add(disc, glow);
    return { ...p, y, disc, glow, motes };
  });

  // ---------- Campfire ----------
  let fireMat = null, fireLight = null;
  if (isCamp) {
    fireMat = new THREE.SpriteMaterial({ map: lib.fire.frames[0], alphaTest: 0.5 });
    const fire = new THREE.Sprite(fireMat);
    fire.scale.set(lib.fire.w, lib.fire.w * lib.fire.aspect, 1);
    fire.center.set(0.5, 0.04);
    fire.position.set(FIRE.x, heightAt(FIRE.x, FIRE.z), FIRE.z);
    group.add(fire);
    fireLight = new THREE.PointLight('#ff9a4a', 6, 9, 1.4);
    fireLight.position.set(FIRE.x, 1.2, FIRE.z);
    group.add(fireLight);
  }
  let fireT = 0;
  function update(dt, t) {
    if (fireMat) {
      fireT += dt;
      const f = Math.floor(fireT * 8) % 3;
      if (fireMat.map !== lib.fire.frames[f]) fireMat.map = lib.fire.frames[f];
      fireLight.intensity = (5.5 + Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.4) * shared.fireBoost;
    }
    for (const p of portals) {
      p.disc.rotation.y = t * 1.6;
      p.glow.scale.y = 2.6 + Math.sin(t * 3) * 0.2;
      for (const m of p.motes) {
        const k = (m.t + t * 0.45) % 1, r = 0.9 * (1 - k * 0.6), a = m.a + t * 1.8;
        m.s.position.set(p.x + Math.cos(a) * r, p.y + 0.1 + k * 2.2, p.z + Math.sin(a) * r);
        const sc = 0.22 * (1 - k * 0.5);
        m.s.scale.set(sc, sc, 1);
      }
    }
  }

  // ---------- Collision ----------
  const sgrid = new Map();
  for (const p of [...props.filter((q) => q.coll > 0), ...solids]) {
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
      for (const b of boxes) { // out of walls and houses: to the nearest outside point
        if (x < b.x0 - r || x > b.x1 + r || z < b.z0 - r || z > b.z1 + r) continue;
        const cx = clamp(x, b.x0, b.x1), cz = clamp(z, b.z0, b.z1), dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz);
        if (d > 1e-4) { if (d < r) { x = cx + (dx / d) * r; z = cz + (dz / d) * r; } continue; }
        const out = [[b.x0 - r - x, 0], [b.x1 + r - x, 0], [0, b.z0 - r - z], [0, b.z1 + r - z]];
        const [mx, mz] = out.reduce((a, o) => (Math.abs(o[0] + o[1]) < Math.abs(a[0] + a[1]) ? o : a));
        x += mx; z += mz;
      }
    }
    return [x, z];
  }
  // extra colliders added after the map is built (camp villagers)
  function addSolid(x, z, coll) {
    const k = key(Math.floor(x / 2), Math.floor(z / 2));
    if (!sgrid.has(k)) sgrid.set(k, []);
    sgrid.get(k).push({ x, z, coll });
  }

  // ---------- Minimap image ----------
  const mini = document.createElement('canvas');
  mini.width = mini.height = 128;
  const mg = mini.getContext('2d');
  const img = mg.createImageData(128, 128);
  for (let j = 0; j < 128; j++) for (let i = 0; i < 128; i++) {
    const x = i * 0.5 + 0.25, z = j * 0.5 + 0.25;
    const h = heightAt(x, z);
    const hex = h < WATER_Y ? '4f9cc0' : colorAt(x, z, h).getHexString();
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
  city?.minimap(mg);
  if (isCamp) {
    mg.fillStyle = '#ffd36b';
    mg.strokeStyle = '#3b2a1e';
    mg.lineWidth = 1.5;
    mg.beginPath(); mg.moveTo(64, 57); mg.lineTo(70, 66); mg.lineTo(58, 66); mg.closePath(); mg.fill(); mg.stroke();
  }
  for (const p of def.portals) { // portals: little blue rings
    mg.strokeStyle = '#1a2a48'; mg.lineWidth = 4;
    mg.beginPath(); mg.arc(p.x * 2, p.z * 2, 3.5, 0, Math.PI * 2); mg.stroke();
    mg.strokeStyle = '#8fd8ff'; mg.lineWidth = 2;
    mg.beginPath(); mg.arc(p.x * 2, p.z * 2, 3.5, 0, Math.PI * 2); mg.stroke();
  }

  return {
    id, group, heightAt, walkable, isSafe, resolve, addSolid, update, terrain, updateOcclusion, portals,
    minimap: mini, fireMat, fireLight, stats: { props: props.length, interior },
    zoneAt: () => id,
  };
}

// a soft swirl for the portal floor, a glow column and a mote, drawn once
function portalTextures() {
  const mk = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const swirl = mk(128, 128, (g) => {
    const rg = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    rg.addColorStop(0, 'rgba(230,250,255,.95)');
    rg.addColorStop(0.45, 'rgba(120,200,255,.6)');
    rg.addColorStop(1, 'rgba(60,120,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      for (let a = 0; a < Math.PI * 1.4; a += 0.05) {
        const r = 8 + a * 16, b = a + (k * Math.PI * 2) / 3;
        g.lineTo(64 + Math.cos(b) * r, 64 + Math.sin(b) * r);
      }
      g.stroke();
    }
  });
  const glow = mk(64, 128, (g) => {
    const lg = g.createLinearGradient(0, 128, 0, 0);
    lg.addColorStop(0, 'rgba(170,225,255,.55)');
    lg.addColorStop(1, 'rgba(170,225,255,0)');
    g.fillStyle = lg;
    g.beginPath(); g.ellipse(32, 64, 26, 64, 0, 0, Math.PI * 2); g.fill();
  });
  const mote = mk(32, 32, (g) => {
    const rg = g.createRadialGradient(16, 16, 1, 16, 16, 15);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(1, 'rgba(140,210,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 32, 32);
  });
  return { swirl, glow, mote };
}

// All the maps, behind one object that always talks to the current map, so the rest of the
// game keeps calling world.heightAt(), world.walkable() and so on without caring which it is.
export function buildWorld(scene, lib) {
  const tex = portalTextures();
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const pg = new THREE.PlaneGeometry(2.4, 2.4);
  pg.rotateX(-Math.PI / 2);
  const shared = {
    fireBoost: 1,
    portalGeo: pg,
    portalMat: new THREE.MeshBasicMaterial({ map: tex.swirl, ...add }),
    glowMat: new THREE.SpriteMaterial({ map: tex.glow, ...add }),
    moteMat: new THREE.SpriteMaterial({ map: tex.mote, ...add }),
  };
  const tintMats = [];
  for (const d of Object.values(lib.props)) for (const v of d.variants) {
    tintMats.push(v.mat);
    v.faded = v.mat.clone();
    v.faded.transparent = true;
    v.faded.opacity = 0.35;
    v.faded.alphaTest = 0.05;
    v.faded.depthWrite = false;
    tintMats.push(v.faded);
  }
  const maps = {};
  for (const id of Object.keys(MAPS)) maps[id] = buildMap(id, scene, lib, shared);
  let cur = maps.camp;
  cur.group.visible = true;

  const api = {
    maps,
    tintMats,
    spawn: { x: 32, z: 36.2 },
    camp: { fire: { x: 32, z: 32.4 }, chest: { x: 34.4, z: 30.6 }, tent: { x: 30.2, z: 29.6 } },
    get id() { return cur.id; },
    get terrain() { return cur.terrain; },
    get minimap() { return cur.minimap; },
    get portals() { return cur.portals; },
    get fireBoost() { return shared.fireBoost; },
    set fireBoost(v) { shared.fireBoost = v; },
    get stats() { return cur.stats; },
    heightAt: (x, z) => cur.heightAt(x, z),
    walkable: (x, z) => cur.walkable(x, z),
    resolve: (x, z, r) => cur.resolve(x, z, r),
    isSafe: (x, z) => cur.isSafe(x, z) && (cur.id !== 'camp' || Math.hypot(x - CENTER, z - CENTER) < CAMP_R + 2),
    zoneAt: () => cur.id,
    addSolid: (x, z, c) => cur.addSolid(x, z, c),
    update: (dt, t) => cur.update(dt, t),
    updateOcclusion: (px, pz, cam) => cur.updateOcclusion(px, pz, cam),
    // switch maps; returns where you arrive coming from map `from` (beside its portal back)
    go(id, from) {
      cur.group.visible = false;
      cur = maps[id] || maps.camp;
      cur.group.visible = true;
      const back = cur.portals.find((p) => p.to === from);
      if (!back) return id === 'camp' ? { ...api.spawn } : { x: CENTER, z: CENTER };
      const dx = CENTER - back.x, dz = CENTER - back.z, d = Math.hypot(dx, dz);
      return { x: back.x + (dx / d) * 2.6, z: back.z + (dz / d) * 2.6 };
    },
  };
  return api;
}

export { CAMP_SAFE };
