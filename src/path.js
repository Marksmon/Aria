// Finding a way round: A* over a grid of the map, one pace a cell, for a boss blocked by rocks,
// trees, walls or a dead-end pocket (mobs.js moveToward). A cell is open to a body of radius r if
// it is walkable, not safe ground (a town, the camp), clear of every collider by r (the world's
// resolve leaves it where it is) and allowed (ok: not by a portal). Which cells are open is worked
// out as the search needs them and kept, per map and body size.
import { SIZE } from './world.js';

const open = new Map(); // `${map}:${r}` -> Int8Array (0 unknown, 1 open, 2 shut)
function cells(world, r, ok) {
  const k = `${world.id}:${r.toFixed(1)}`;
  if (!open.has(k)) open.set(k, new Int8Array(SIZE * SIZE));
  const g = open.get(k);
  return (i, j) => {
    if (i < 0 || j < 0 || i >= SIZE || j >= SIZE) return false;
    const n = j * SIZE + i;
    if (!g[n]) {
      const x = i + 0.5, z = j + 0.5;
      let fine = world.walkable(x, z) && !world.isSafe(x, z) && ok(x, z);
      if (fine) { const [rx, rz] = world.resolve(x, z, r); fine = Math.hypot(rx - x, rz - z) < 0.3; }
      g[n] = fine ? 1 : 2;
    }
    return g[n] === 1;
  };
}

// a straight line from a to b that stays on open cells (checked every half pace)
function clear(free, ax, az, bx, bz) {
  const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d * 2);
  for (let k = 1; k < n; k++) {
    const t = k / n;
    if (!free(Math.floor(ax + (bx - ax) * t), Math.floor(az + (bz - az) * t))) return false;
  }
  return true;
}

// the way from (sx, sz) to (tx, tz) for a body of radius r: waypoints [{ x, z }, ...] ending at the
// goal (or the nearest open cell to it), or null if there is none. ok(x, z): may it stand there.
export function findPath(world, sx, sz, tx, tz, r, ok = () => true, maxNodes = 3000) {
  const free = cells(world, r, ok);
  const si = Math.floor(sx), sj = Math.floor(sz);
  let gi = Math.floor(tx), gj = Math.floor(tz);
  if (!free(gi, gj)) { // the goal itself is shut (a hero tucked against a rock): the nearest open cell to it
    let best = null;
    for (let rad = 1; rad <= 3 && !best; rad++) for (let i = -rad; i <= rad; i++) for (let j = -rad; j <= rad; j++) {
      if (Math.max(Math.abs(i), Math.abs(j)) !== rad || !free(gi + i, gj + j)) continue;
      const d = Math.hypot(i, j);
      if (!best || d < best.d) best = { i: gi + i, j: gj + j, d };
    }
    if (!best) return null;
    gi = best.i; gj = best.j;
  }
  const id = (i, j) => j * SIZE + i, start = id(si, sj), goal = id(gi, gj);
  const g = new Map([[start, 0]]), from = new Map(), shut = new Set();
  const h = (i, j) => { const dx = Math.abs(i - gi), dz = Math.abs(j - gj); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz); };
  // a binary heap of [f, node]
  const heap = [[h(si, sj), start]];
  const push = (e) => { heap.push(e); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r2 = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r2 < heap.length && heap[r2][0] < heap[m][0]) m = r2; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  let found = false, seen = 0;
  while (heap.length && seen < maxNodes) {
    const [, n] = pop();
    if (shut.has(n)) continue;
    if (n === goal) { found = true; break; }
    shut.add(n); seen++;
    const i = n % SIZE, j = (n - i) / SIZE;
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const ni = i + di, nj = j + dj;
      if (!free(ni, nj)) continue;
      if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue; // no cutting a corner
      const m = id(ni, nj), cost = g.get(n) + (di && dj ? 1.414 : 1);
      if (shut.has(m) || cost >= (g.get(m) ?? Infinity)) continue;
      g.set(m, cost); from.set(m, n);
      push([cost + h(ni, nj), m]);
    }
  }
  if (!found) return null;
  // back from the goal, then smoothed: keep only the turns a straight walk can't skip
  const raw = [];
  for (let n = goal; n !== start; n = from.get(n)) raw.push({ x: (n % SIZE) + 0.5, z: Math.floor(n / SIZE) + 0.5 });
  raw.reverse();
  if (gi === Math.floor(tx) && gj === Math.floor(tz)) raw[raw.length - 1] = { x: tx, z: tz };
  const pts = [];
  let ax = sx, az = sz;
  for (let k = 0; k < raw.length; k++) {
    const next = raw[k + 1];
    if (next && clear(free, ax, az, next.x, next.z)) continue;
    pts.push(raw[k]); ax = raw[k].x; az = raw[k].z;
  }
  return pts;
}
