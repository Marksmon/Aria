// The valley as a grid of 1x1 tiles, Ragnarok style: the player walks from tile centre to tile
// centre along paths found with A* (8 directions, no cutting corners past blocked tiles).
const N = 64;
const key = (i, j) => j * N + i;

// binary min-heap of [priority, value]
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(x) {
    const a = this.a;
    a.push(x);
    for (let i = a.length - 1; i > 0;) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

export class Tiles {
  constructor(world) {
    this.world = world;
    this.blocked = new Uint8Array(N * N);
    this.rebuild();
  }

  // a tile is blocked when its centre is off the walkable ground or inside a prop (tree, rock, NPC)
  rebuild() {
    const w = this.world;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = i + 0.5, z = j + 0.5;
      const [rx, rz] = w.resolve(x, z, 0.3);
      this.blocked[key(i, j)] = !w.walkable(x, z) || Math.hypot(rx - x, rz - z) > 0.05 ? 1 : 0;
    }
  }

  tileAt(x, z) { return [Math.floor(x), Math.floor(z)]; }
  center(i, j) { return { x: i + 0.5, z: j + 0.5 }; }
  free(i, j) { return i >= 0 && j >= 0 && i < N && j < N && !this.blocked[key(i, j)]; }

  // nearest free tile to (i, j), searching outwards ring by ring
  nearestFree(i, j, maxR = 6) {
    if (this.free(i, j)) return [i, j];
    for (let r = 1; r <= maxR; r++) {
      let best = null, bd = Infinity;
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r || !this.free(i + di, j + dj)) continue;
        const d = di * di + dj * dj;
        if (d < bd) { bd = d; best = [i + di, j + dj]; }
      }
      if (best) return best;
    }
    return null;
  }

  // tile centres from the tile after (fx, fz)'s tile to the goal tile, or null if unreachable
  path(fx, fz, gx, gz, limit = 5000) {
    const start = this.nearestFree(...this.tileAt(fx, fz), 2);
    const goal = this.nearestFree(...this.tileAt(gx, gz));
    if (!start || !goal) return null;
    const s = key(...start), g = key(...goal);
    if (s === g) return [this.center(...goal)];
    const h = (k) => {
      const dx = Math.abs((k % N) - goal[0]), dz = Math.abs(((k / N) | 0) - goal[1]);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
    };
    const cost = new Map([[s, 0]]), from = new Map();
    const open = new Heap();
    open.push([h(s), s]);
    const closed = new Set();
    while (open.size && closed.size < limit) {
      const [, k] = open.pop();
      if (k === g) break;
      if (closed.has(k)) continue;
      closed.add(k);
      const i = k % N, j = (k / N) | 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di, nj = j + dj;
        if (!this.free(ni, nj)) continue;
        if (di && dj && (!this.free(i + di, j) || !this.free(i, j + dj))) continue; // no corner cutting
        const nk = key(ni, nj), c = cost.get(k) + (di && dj ? 1.414 : 1);
        if (c < (cost.get(nk) ?? Infinity)) {
          cost.set(nk, c);
          from.set(nk, k);
          open.push([c + h(nk), nk]);
        }
      }
    }
    if (!from.has(g)) return null;
    const out = [];
    for (let k = g; k !== s; k = from.get(k)) out.push(this.center(k % N, (k / N) | 0));
    return out.reverse();
  }
}
