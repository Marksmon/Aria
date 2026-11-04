// The Sphinx's Halls, Aria's first dungeon: four maze floors under the Giant Sphinx of Sphinx Sands,
// each a 64x64 map walled into a maze of sandstone corridors (the owner's call: every floor a maze,
// harder floor by floor, a levelling site), the last one opening on a great hall where the Eternal
// Sphinx waits (MAPS.halls1..halls4 in world.js; their monsters in main.js SPAWNS).
//
// The maze is laid on the tile grid the hero walks (tiles.js): 14 x 14 cells of 3 x 3 tiles, a wall
// one tile thick between them (wall lines on tiles 3, 7, 11 ... 59, and the map's rim all wall), so
// every corridor is three tiles wide. It is carved by a seeded recursive backtracker (a perfect maze:
// long, winding corridors and dead ends), then:
// - rooms: 2x2 cells opened into one. A portal room (the stairs) loses its middle post; a chamber
//   keeps it, a pillar to fight round;
// - loops: a share of the walls left are knocked through, so a dead end is rarely the only way;
// - the hall (floor 4): a block of cells opened into one great room, walled round but for its gate,
//   with rows of pillars down it.
// The walls are two meshes (their sides and their tops) built from the solid tiles merged into
// rectangles, textured in world space with sandstone courses and a band of carvings. Whatever wall
// stands between the camera and the hero is cut away (a dither in the shader), so the hero, and the
// monsters round them, are never hidden.
import * as THREE from 'three';
import { mulberry32 } from './noise.js';

const N = 64, C = 14;           // tiles a side, cells a side
export const WALL_H = 2.3;       // how tall the walls stand
const PILLAR_H = 3.1;
const at = (x, z) => z * N + x;
const line = (k) => 3 + 4 * k;   // the tile of wall line k (0..14)
const cellLo = (i) => 4 + 4 * i; // a cell's first open tile

// each floor's stone: the wall's base colour, its courses, the carved band and the floor's flags
export const FLOOR_LOOK = {
  1: { wall: '#c9a56c', course: '#9a7646', band: '#d8b47a', glyph: '#6a4a28', paint: '#3a6aa8', floor: '#a88a5c', flag: '#8a6e46', top: '#b8925e' },
  2: { wall: '#b49064', course: '#7a5a3a', band: '#c49c68', glyph: '#4a3220', paint: '#2e7a6a', floor: '#8a7252', flag: '#6a5438', top: '#a07e54' },
  3: { wall: '#a88e6a', course: '#6e5638', band: '#2e4f9a', glyph: '#e8c050', paint: '#e8c050', floor: '#7a6a52', flag: '#5a4c38', top: '#988060' },
  4: { wall: '#8c7a66', course: '#584a3a', band: '#e2b440', glyph: '#2e2418', paint: '#2e4f9a', floor: '#5e5246', flag: '#463c32', top: '#7a6a58' },
};

// carve the floor's maze. M: { seed, rooms: [[i, j, pillar?]...] (2x2 cells from i, j), loops (a share),
// hall: { i0, j0, i1, j1, gate: [i...] } (opened through its bottom wall at those columns) }.
// Returns { solid (Uint8Array, 1 wall, 2 pillar), hall (in paces), deadEnds: [[x, z]], cells }
export function carveMaze(M) {
  const rng = mulberry32(M.seed);
  const solid = new Uint8Array(N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    const rim = x <= 3 || z <= 3 || x >= 59 || z >= 59;
    solid[at(x, z)] = rim || (x - 3) % 4 === 0 || (z - 3) % 4 === 0 ? 1 : 0;
  }
  // knock through the wall between cell (i, j) and its neighbour (i + di, j + dj)
  const open = (i, j, di, dj) => {
    if (di) { const x = line(Math.max(i, i + di)); for (let z = cellLo(j); z < cellLo(j) + 3; z++) solid[at(x, z)] = 0; }
    else { const z = line(Math.max(j, j + dj)); for (let x = cellLo(i); x < cellLo(i) + 3; x++) solid[at(x, z)] = 0; }
  };
  const shut = (i, j, di, dj) => {
    if (di) { const x = line(Math.max(i, i + di)); for (let z = cellLo(j); z < cellLo(j) + 3; z++) solid[at(x, z)] = 1; }
    else { const z = line(Math.max(j, j + dj)); for (let x = cellLo(i); x < cellLo(i) + 3; x++) solid[at(x, z)] = 1; }
  };
  const H = M.hall;
  const inHall = (i, j) => !!H && i >= H.i0 && i <= H.i1 && j >= H.j0 && j <= H.j1;
  // the maze: a recursive backtracker over every cell but the hall's
  const seen = new Uint8Array(C * C);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const start = M.start || [0, C - 1];
  const stack = [start];
  seen[start[1] * C + start[0]] = 1;
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const next = DIRS.map(([di, dj]) => [i + di, j + dj, di, dj])
      .filter(([a, b]) => a >= 0 && b >= 0 && a < C && b < C && !seen[b * C + a] && !inHall(a, b));
    if (!next.length) { stack.pop(); continue; }
    const [a, b, di, dj] = next[Math.floor(rng() * next.length)];
    open(i, j, di, dj);
    seen[b * C + a] = 1;
    stack.push([a, b]);
  }
  // loops: some of the walls left between two maze cells come down
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) for (const [di, dj] of [[1, 0], [0, 1]]) {
    const a = i + di, b = j + dj;
    if (a >= C || b >= C || inHall(i, j) || inHall(a, b)) continue;
    if (rng() < (M.loops ?? 0.1)) open(i, j, di, dj);
  }
  // rooms: four cells opened into one
  const keepPost = new Set();
  for (const [i, j, pillar] of M.rooms || []) {
    open(i, j, 1, 0); open(i, j + 1, 1, 0); open(i, j, 0, 1); open(i + 1, j, 0, 1);
    if (pillar) keepPost.add(at(line(i + 1), line(j + 1)));
  }
  // the hall: one great room, walled round, its gate in the bottom wall
  if (H) {
    for (let j = H.j0; j <= H.j1; j++) for (let i = H.i0; i <= H.i1; i++) {
      if (i < H.i1) open(i, j, 1, 0);
      if (j < H.j1) open(i, j, 0, 1);
    }
    for (let j = H.j0; j <= H.j1; j++) { if (H.i0 > 0) shut(H.i0, j, -1, 0); if (H.i1 < C - 1) shut(H.i1, j, 1, 0); }
    for (let i = H.i0; i <= H.i1; i++) { if (H.j0 > 0) shut(i, H.j0, 0, -1); if (H.j1 < C - 1) shut(i, H.j1, 0, 1); }
    for (const i of H.gate) open(i, H.j1, 0, 1);
    if (H.gate.length > 1) for (let k = 1; k < H.gate.length; k++) solid[at(line(H.gate[k]), line(H.j1 + 1))] = 0; // (the post between the gate's cells)
  }
  // the posts where wall lines cross stand only where a wall meets them
  for (let l = 1; l < C; l++) for (let k = 1; k < C; k++) {
    const x = line(k), z = line(l), n = at(x, z);
    if (keepPost.has(n)) { solid[n] = 1; continue; }
    solid[n] = solid[at(x + 1, z)] || solid[at(x - 1, z)] || solid[at(x, z + 1)] || solid[at(x, z - 1)] ? 1 : 0;
  }
  // the hall's pillars: two rows down its length
  let hall = null;
  if (H) {
    hall = { x0: cellLo(H.i0), z0: cellLo(H.j0), x1: cellLo(H.i1) + 3, z1: cellLo(H.j1) + 3 };
    for (const px of [hall.x0 + 4, hall.x0 + 12, hall.x1 - 13, hall.x1 - 5]) for (let pz = hall.z0 + 3; pz < hall.z1 - 4; pz += 5) solid[at(px, pz)] = 2;
    hall.gate = { x: (cellLo(H.gate[0]) + cellLo(H.gate[H.gate.length - 1]) + 3) / 2, z: hall.z1 };
  }
  // dead ends (a cell with one way out): for urns, bones and coffins
  const deadEnds = [];
  for (let j = 0; j < C; j++) for (let i = 0; i < C; i++) {
    if (inHall(i, j)) continue;
    const cx = cellLo(i) + 1, cz = cellLo(j) + 1;
    const ways = [solid[at(cx - 2, cz)], solid[at(cx + 2, cz)], solid[at(cx, cz - 2)], solid[at(cx, cz + 2)]].filter((v) => !v).length;
    if (ways === 1) deadEnds.push([cx + 0.5, cz + 0.5]);
  }
  return { solid, hall, deadEnds };
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
// the wall's face, 2 paces wide and the wall's height tall: sandstone courses, a frieze of carvings
// (eyes, ankhs, birds, wavy water) at eye height, painted here and there
function wallTex(L, rng) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = L.wall; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 220; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(80,50,25,.14)' : 'rgba(255,240,210,.12)'; g.fillRect(rng() * 128, rng() * 128, 2 + rng() * 5, 2 + rng() * 3); }
    g.fillStyle = L.course;
    for (let y = 0; y < 128; y += 18) { // the courses: block joints, staggered
      g.fillRect(0, y, 128, 2);
      for (let x = (y / 18) % 2 ? 0 : 24; x < 128; x += 48) g.fillRect(x, y, 2, 18);
    }
    // the frieze: a band between two lines, carvings in it
    const y0 = 40, y1 = 70;
    g.fillStyle = L.band; g.fillRect(0, y0, 128, y1 - y0);
    g.fillStyle = L.course; g.fillRect(0, y0, 128, 3); g.fillRect(0, y1 - 3, 128, 3);
    const glyphs = [
      (x) => { g.beginPath(); g.ellipse(x + 8, 55, 8, 4, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(x + 8, 55, 2.5, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + 6, 59); g.quadraticCurveTo(x + 4, 66, x + 10, 64); g.stroke(); }, // the eye
      (x) => { g.beginPath(); g.ellipse(x + 8, 49, 4, 5, 0, 0, 7); g.stroke(); g.fillRect(x + 7, 53, 2.5, 13); g.fillRect(x + 2, 55, 12, 2.5); }, // an ankh
      (x) => { g.beginPath(); g.moveTo(x + 2, 64); g.lineTo(x + 6, 52); g.lineTo(x + 12, 50); g.lineTo(x + 14, 54); g.lineTo(x + 9, 56); g.lineTo(x + 10, 64); g.closePath(); g.fill(); }, // a bird
      (x) => { g.beginPath(); for (let k = 0; k < 4; k++) g.lineTo(x + k * 4, k % 2 ? 50 : 46); g.stroke(); g.beginPath(); for (let k = 0; k < 4; k++) g.lineTo(x + k * 4, k % 2 ? 62 : 58); g.stroke(); }, // water
      (x) => { g.beginPath(); g.arc(x + 8, 55, 6, 0, 7); g.stroke(); g.beginPath(); g.arc(x + 8, 55, 2, 0, 7); g.fill(); }, // the sun
    ];
    g.strokeStyle = L.glyph; g.fillStyle = L.glyph; g.lineWidth = 2;
    for (let k = 0; k < 6; k++) {
      const x = 4 + k * 21, i = Math.floor(rng() * glyphs.length);
      if (rng() < 0.35) { g.save(); g.strokeStyle = L.paint; g.fillStyle = L.paint; glyphs[i](x); g.restore(); } else glyphs[i](x);
    }
    for (let i = 0; i < 6; i++) { // cracks
      let x = rng() * 128, y = rng() * 128;
      g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (rng() - 0.5) * 18; y += rng() * 12; g.lineTo(x, y); }
      g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 1; g.stroke();
    }
  });
}
function topTex(L, rng) {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = L.top; g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 90; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(60,40,20,.18)' : 'rgba(255,240,210,.12)'; g.fillRect(rng() * 64, rng() * 64, 3, 2); }
    g.fillStyle = 'rgba(60,40,20,.4)'; g.fillRect(0, 0, 64, 1.5); g.fillRect(0, 32, 64, 1.5); g.fillRect(0, 0, 1.5, 64); g.fillRect(32, 0, 1.5, 64);
  });
}
// the floor: big worn flagstones, two to a tile
export function floorTex(L, rng) {
  return canvasTex(128, 128, (g) => {
    g.fillStyle = L.floor; g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 128; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 160; x += 32) {
      g.fillStyle = rng() < 0.5 ? 'rgba(255,240,210,.07)' : 'rgba(40,25,10,.08)';
      g.fillRect(x - 32 + 2, y + 2, 28, 28);
      g.fillStyle = L.flag; g.fillRect(x - 32, y, 32, 2); g.fillRect(x - 32, y, 2, 32);
    }
    for (let i = 0; i < 160; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(40,25,10,.18)' : 'rgba(255,240,210,.1)'; g.fillRect(rng() * 128, rng() * 128, 2, 2); }
    for (let i = 0; i < 3; i++) { // sand blown in
      g.fillStyle = 'rgba(220,190,130,.1)';
      g.beginPath(); g.ellipse(rng() * 128, rng() * 128, 10 + rng() * 14, 6 + rng() * 6, rng() * 3, 0, 7); g.fill();
    }
  });
}

// the walls as meshes, the colliders for them, the minimap's lines: the maze's whole look and feel.
// ctx: { group, place (world.js props) }. Returns { solidAt(x, z), occlude, update, minimap }
export function buildMaze(ctx, M, maze) {
  const { group } = ctx, L = FLOOR_LOOK[M.floor] || FLOOR_LOOK[1];
  const rng = mulberry32(M.seed * 7 + 3);
  const { solid } = maze;
  // the solid tiles merged into rectangles: a run along each row, runs alike stacked down the rows
  const rects = [], used = new Uint8Array(N * N);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    if (solid[at(x, z)] !== 1 || used[at(x, z)]) continue;
    let x1 = x;
    while (x1 + 1 < N && solid[at(x1 + 1, z)] === 1 && !used[at(x1 + 1, z)]) x1++;
    let z1 = z;
    for (;;) {
      if (z1 + 1 >= N) break;
      let ok = true;
      for (let k = x; k <= x1; k++) if (solid[at(k, z1 + 1)] !== 1 || used[at(k, z1 + 1)]) { ok = false; break; }
      if (!ok) break;
      z1++;
    }
    for (let zz = z; zz <= z1; zz++) for (let k = x; k <= x1; k++) used[at(k, zz)] = 1;
    rects.push([x, z, x1 + 1, z1 + 1]);
  }
  // sides (u along the wall, 2 paces a repeat; v up its height) and tops, in world space
  const side = { p: [], n: [], uv: [], i: [] }, top = { p: [], n: [], uv: [], i: [] };
  const quad = (B, a, b, c, d, nx, ny, nz, uvs) => {
    const o = B.p.length / 3;
    for (const v of [a, b, c, d]) B.p.push(...v);
    for (let k = 0; k < 4; k++) B.n.push(nx, ny, nz);
    B.uv.push(...uvs);
    B.i.push(o, o + 1, o + 2, o, o + 2, o + 3);
  };
  const h = WALL_H, edge = (x, z) => x < 0 || z < 0 || x >= N || z >= N || solid[at(x, z)] === 1;
  for (const [x0, z0, x1, z1] of rects) {
    const w = (x1 - x0) / 2, d = (z1 - z0) / 2;
    // only the faces that look onto open ground (a face against more wall is never seen)
    let open = false; for (let x = x0; x < x1; x++) if (!edge(x, z1)) open = true;
    if (open) quad(side, [x0, 0, z1], [x1, 0, z1], [x1, h, z1], [x0, h, z1], 0, 0, 1, [x0 / 2, 0, x0 / 2 + w, 0, x0 / 2 + w, 1, x0 / 2, 1]);
    open = false; for (let x = x0; x < x1; x++) if (!edge(x, z0 - 1)) open = true;
    if (open) quad(side, [x1, 0, z0], [x0, 0, z0], [x0, h, z0], [x1, h, z0], 0, 0, -1, [x1 / 2, 0, x1 / 2 - w, 0, x1 / 2 - w, 1, x1 / 2, 1]);
    open = false; for (let z = z0; z < z1; z++) if (!edge(x1, z)) open = true;
    if (open) quad(side, [x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1], 1, 0, 0, [z1 / 2, 0, z1 / 2 - d, 0, z1 / 2 - d, 1, z1 / 2, 1]);
    open = false; for (let z = z0; z < z1; z++) if (!edge(x0 - 1, z)) open = true;
    if (open) quad(side, [x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0], -1, 0, 0, [z0 / 2, 0, z0 / 2 + d, 0, z0 / 2 + d, 1, z0 / 2, 1]);
    quad(top, [x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0], 0, 1, 0, [x0 / 2, z1 / 2, x1 / 2, z1 / 2, x1 / 2, z0 / 2, x0 / 2, z0 / 2]);
  }
  const geo = (B) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2));
    g.setIndex(B.i);
    return g;
  };
  // the cutaway: walls between the camera and the hero are screened out (3 pixels in 4 dropped)
  const uniforms = { uHero: { value: new THREE.Vector2(32, 32) }, uCam: { value: new THREE.Vector2(0, 1) } };
  const cutaway = (mat) => {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uHero = uniforms.uHero; sh.uniforms.uCam = uniforms.uCam;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWorldPos;\nuniform vec2 uHero;\nuniform vec2 uCam;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          vec2 dd = vWorldPos.xz - uHero;
          float along = dot(dd, uCam), across = abs(dd.x * uCam.y - dd.y * uCam.x);
          if (along > 0.05 && along < 9.0 && across < 1.6 + along * 0.22 && vWorldPos.y > 0.15) {
            vec2 f = mod(floor(gl_FragCoord.xy), 2.0);
            if (f.x + f.y > 0.5) discard;
          }`);
    };
    return mat;
  };
  const wt = wallTex(L, rng), tt = topTex(L, rng);
  const walls = new THREE.Mesh(geo(side), cutaway(new THREE.MeshLambertMaterial({ map: wt })));
  const tops = new THREE.Mesh(geo(top), cutaway(new THREE.MeshLambertMaterial({ map: tt })));
  group.add(walls, tops);
  // the hall's pillars: round, banded in gold, a lotus capital
  const pillars = [];
  const pmat = cutaway(new THREE.MeshLambertMaterial({ map: wt }));
  const gold = cutaway(new THREE.MeshLambertMaterial({ color: '#e2b440', emissive: '#2a1a04' }));
  const pgeo = new THREE.CylinderGeometry(0.46, 0.52, PILLAR_H, 12), cap = new THREE.CylinderGeometry(0.72, 0.44, 0.45, 12), ring = new THREE.CylinderGeometry(0.54, 0.54, 0.22, 12);
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
    if (solid[at(x, z)] !== 2) continue;
    const px = x + 0.5, pz = z + 0.5;
    const p = new THREE.Mesh(pgeo, pmat); p.position.set(px, PILLAR_H / 2, pz);
    const c = new THREE.Mesh(cap, gold); c.position.set(px, PILLAR_H + 0.2, pz);
    const r = new THREE.Mesh(ring, gold); r.position.set(px, 0.6, pz);
    group.add(p, c, r);
    pillars.push({ x: px, z: pz });
  }
  // decor: torches along the walls, urns and bones in the dead ends, a coffin here and there
  const torches = [];
  const nearWall = [];
  for (let z = 4; z < 59; z++) for (let x = 4; x < 59; x++) {
    if (solid[at(x, z)]) continue;
    if (maze.hall && x >= maze.hall.x0 && x < maze.hall.x1 && z >= maze.hall.z0 && z < maze.hall.z1) continue;
    const back = solid[at(x, z - 1)] === 1 && !solid[at(x, z + 1)];
    if (back && (x * 7 + z * 13) % 23 === 0) nearWall.push([x + 0.5, z + 0.12]);
  }
  for (const [x, z] of nearWall) if (ctx.place('torch', x, z, true)) torches.push({ x, z });
  maze.deadEnds.forEach(([x, z], k) => {
    const kind = k % 5 === 0 ? 'sarcophagus' : k % 3 === 0 ? 'bones' : 'urn';
    ctx.place(kind, x + (rng() - 0.5) * 0.8, z + (rng() - 0.5) * 0.8, true);
  });
  if (maze.hall) { // the hall: braziers down both sides, obelisks at the back, a runner from the gate, the winged sun
    const H = maze.hall;
    const decal = (tex, x, z, w, d) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
      m.position.set(x, 0.01, z); m.renderOrder = 0.5; group.add(m);
    };
    const runner = canvasTex(32, 128, (g) => {
      g.fillStyle = '#26407e'; g.fillRect(0, 0, 32, 128);
      g.fillStyle = '#c89a34'; g.fillRect(0, 0, 4, 128); g.fillRect(28, 0, 4, 128);
      for (let y = 4; y < 128; y += 16) { g.beginPath(); g.moveTo(16, y); g.lineTo(24, y + 8); g.lineTo(16, y + 16); g.lineTo(8, y + 8); g.closePath(); g.fill(); }
      g.fillStyle = '#3a9a8a'; for (let y = 4; y < 128; y += 16) g.fillRect(14, y + 6, 4, 4);
    });
    const sunZ = (H.z0 + H.z1) / 2 - 2, from = sunZ + 5.5; // (the runner from the gate to the winged sun's foot)
    runner.repeat.set(1, Math.round((H.z1 - from) / 2.5));
    decal(runner, H.gate.x, (from + H.z1) / 2, 3, H.z1 - from);
    const sunTex = canvasTex(256, 256, (g) => { // the winged sun with the eye in it, gold and lapis
      g.translate(128, 128);
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
        g.fillStyle = k % 2 ? '#e2b440' : '#2e4f9a';
        g.beginPath(); g.moveTo(s * 30, -10 + k * 6); g.quadraticCurveTo(s * 80, -40 + k * 10, s * 124, -30 + k * 14); g.lineTo(s * 120, -18 + k * 14); g.quadraticCurveTo(s * 80, -24 + k * 10, s * 30, 4 + k * 6); g.fill();
      }
      g.fillStyle = '#e2b440'; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.fill();
      g.fillStyle = '#c83a2a'; g.beginPath(); g.arc(0, 0, 30, 0, 7); g.fill();
      g.fillStyle = '#efe2c0'; g.beginPath(); g.ellipse(0, 0, 22, 11, 0, 0, 7); g.fill();
      g.fillStyle = '#2e4f9a'; g.beginPath(); g.arc(0, 0, 8, 0, 7); g.fill();
      g.fillStyle = '#120c08'; g.beginPath(); g.arc(0, 0, 3.5, 0, 7); g.fill();
      g.strokeStyle = '#120c08'; g.lineWidth = 3; g.beginPath(); g.moveTo(-6, 10); g.quadraticCurveTo(-10, 26, 4, 24); g.stroke();
      g.globalAlpha = 0.25; g.fillStyle = '#000'; for (let i = 0; i < 300; i++) g.fillRect(-128 + Math.random() * 256, -128 + Math.random() * 256, 2, 2);
    });
    sunTex.wrapS = sunTex.wrapT = THREE.ClampToEdgeWrapping;
    decal(sunTex, H.gate.x, sunZ, 14, 14);
    for (let z = H.z0 + 5.5; z < H.z1 - 2; z += 5) for (const x of [H.x0 + 1.5, H.x1 - 1.5]) ctx.place('torch', x, z, true);
    for (const x of [H.x0 + 8, H.x1 - 8]) ctx.place('obelisk', x, H.z0 + 1.6, true);
  }
  return {
    pillars,
    torches,
    solidAt: (x, z) => { const i = Math.floor(x), j = Math.floor(z); return i < 0 || j < 0 || i >= N || j >= N || solid[at(i, j)] > 0; },
    // a pillar is a round post; a wall tile a box
    tile: (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? 1 : solid[at(i, j)]),
    occlude(px, pz, cam) { uniforms.uHero.value.set(px, pz); uniforms.uCam.value.set(-cam.fx, -cam.fz).normalize(); },
    minimap(mg) {
      for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) {
        const v = solid[at(x, z)];
        if (!v) continue;
        mg.fillStyle = v === 2 ? '#e2b440' : L.course;
        mg.fillRect(x * 2, z * 2, 2, 2);
      }
      if (maze.hall) { const H = maze.hall; mg.strokeStyle = '#e2b440'; mg.lineWidth = 1; mg.strokeRect(H.x0 * 2 + 1, H.z0 * 2 + 1, (H.x1 - H.x0) * 2 - 2, (H.z1 - H.z0) * 2 - 2); }
    },
  };
}
