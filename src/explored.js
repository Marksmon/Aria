// What the hero has seen of a dungeon's maze (November 2026): the minimap and the big map showed a whole floor,
// its stairs and every monster on it, from the first step, so a maze was never explored. Now a maze floor is dark
// until walked: the ground lights up SIGHT paces round the hero and stays lit (saved with the hero), a floor's
// stairs and monsters are listed once seen, and the big map walks the hero only over ground they know. The great
// halls (one open room) and every map that is no maze show whole, as before. The Deep Halls' floors are carved
// afresh each time, so theirs is never kept.
import { MAPS, SIZE } from './world.js';

const CELL = 2, N = SIZE / CELL; // cells of 2 x 2 paces, 32 a side
const SIGHT = 8;                 // paces the hero's light reaches
const DARK = '#15100c';

const pack = (bits) => btoa(String.fromCharCode(...bits));
const unpack = (s) => { try { const b = atob(s); return b.length === N * N / 8 ? Uint8Array.from(b, (c) => c.charCodeAt(0)) : null; } catch { return null; } };

export const isFogged = (id) => { const mz = MAPS[id]?.maze; return !!mz && !mz.hall?.only; };

export class Explored {
  constructor(saved) {
    this.maps = {}; // map id -> a bit a cell
    for (const [id, s] of Object.entries(saved || {})) { const b = isFogged(id) && !MAPS[id].delve && unpack(s); if (b) this.maps[id] = b; }
    this.pic = null; // the lit picture of the map the hero is on: { id, src, canvas, n }
    this.counts = {};
  }
  fogged(id) { return isFogged(id); }
  bits(id) { return (this.maps[id] ||= new Uint8Array(N * N / 8)); }
  // has the hero seen this spot? (always, on a map that is no maze)
  seen(id, x, z) {
    if (!isFogged(id)) return true;
    const i = Math.floor(x / CELL), j = Math.floor(z / CELL);
    if (i < 0 || j < 0 || i >= N || j >= N) return false;
    const k = j * N + i;
    return !!(this.maps[id]?.[k >> 3] & (1 << (k & 7)));
  }
  // how many cells are lit (the big map builds its list again when this grows)
  count(id) { return this.counts[id] ?? (this.counts[id] = (this.maps[id] || []).reduce((a, b) => a + (b.toString(2).match(/1/g)?.length || 0), 0)); }
  // the hero stands here: light the cells round them. Returns the cells newly lit
  visit(id, x, z) {
    if (!isFogged(id)) return 0;
    const bits = this.bits(id), fresh = [];
    const i0 = Math.max(0, Math.floor((x - SIGHT) / CELL)), i1 = Math.min(N - 1, Math.floor((x + SIGHT) / CELL));
    const j0 = Math.max(0, Math.floor((z - SIGHT) / CELL)), j1 = Math.min(N - 1, Math.floor((z + SIGHT) / CELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (Math.hypot((i + 0.5) * CELL - x, (j + 0.5) * CELL - z) > SIGHT) continue;
      const k = j * N + i;
      if (bits[k >> 3] & (1 << (k & 7))) continue;
      bits[k >> 3] |= 1 << (k & 7);
      fresh.push(k);
    }
    if (fresh.length) {
      delete this.counts[id]; // (counted again when asked)
      if (this.pic?.id === id) for (const k of fresh) this.paint(k);
    }
    return fresh.length;
  }
  reset(id) { delete this.maps[id]; delete this.counts[id]; if (this.pic?.id === id) this.pic = null; }
  paint(k) {
    const { src, canvas } = this.pic, px = (CELL * src.width) / SIZE, i = k % N, j = Math.floor(k / N);
    canvas.getContext('2d').drawImage(src, i * px, j * px, px, px, i * px, j * px, px, px);
  }
  // the map's picture as the hero knows it: the world's own minimap, or a maze's with the unseen left dark
  image(world) {
    const id = world.id, src = world.minimap;
    if (!isFogged(id) || !src) return src;
    if (this.pic?.id !== id || this.pic.src !== src) { // (another map, or this one built again)
      const canvas = document.createElement('canvas');
      canvas.width = src.width; canvas.height = src.height;
      const g = canvas.getContext('2d');
      g.fillStyle = DARK; g.fillRect(0, 0, canvas.width, canvas.height);
      this.pic = { id, src, canvas };
      const bits = this.maps[id];
      if (bits) for (let k = 0; k < N * N; k++) if (bits[k >> 3] & (1 << (k & 7))) this.paint(k);
    }
    return this.pic.canvas;
  }
  toJSON() { return Object.fromEntries(Object.entries(this.maps).filter(([id]) => !MAPS[id]?.delve).map(([id, b]) => [id, pack(b)])); }
}
