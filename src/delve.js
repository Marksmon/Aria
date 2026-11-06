// The Deep Halls: an endless dungeon for after the story and past Base 99 (the audit's P1: a loop that goes on).
// The owner's calls (November 2026): it is a destination of the Ship Captain in the fifth early city, open from Base
// 90, and its gatekeeper is **Loki the Mischiefbringer**, who stands at its door and sends heroes down. That city
// is not built yet, so for now no one offers it: whoever has `delve: true` in quests.js NPCS (Loki, once he stands
// where the captain's ship lands) sends the hero down, and the stairs up bring them home beside him. Each floor is a maze carved from a
// seed of its own (dungeon.js, as the Sphinx's Halls and Yggdrasil's Hollows), its look the stone of one of the
// other dungeons in turn; the stairs down are at the far end, the stairs up (home, beside the captain) where you arrive.
// Two maps take turns (delveA, delveB): the one below is carved afresh as the hero goes down to it.
//
// Floor k's monsters are three kinds from Aria's own fields and dungeons near level DEPTH.lv(k) (never a boss, a
// mini-boss, or a great hall's own); past the deepest level they grow stronger, floor by floor (DEPTH.mult).
// Every fifth floor is a checkpoint: the captain can send the hero straight there next time, and its first reaching
// pays a cache. The deepest floor reached is kept in the save (delve.best).
import { MOB_DEFS } from './mobs.js';
import { SPAWNS } from './spawns.js';
import { MAPS } from './world.js';
import { mulberry32 } from './noise.js';

export const DELVE_MAPS = ['delveA', 'delveB'];
export const isDelve = (id) => DELVE_MAPS.includes(id);
export const DEPTH = {
  open: 90,                                   // the Base Level asked for (the owner's call)
  lv: (k) => Math.min(99, 83 + 2 * k),        // the monsters' level on floor k (85 on the first: a Base 90 hero's)
  mult: (k) => (k > 8 ? 1 + 0.12 * (k - 8) : 1), // past floor 8 (level 99), HP, ATK and EXP grow floor by floor
  gap: 0.03,                                   // and a monster below the floor's level grows 3% a level to meet it
  every: 5,                                    // checkpoints
  cache: (k) => ({ perz: 3000 * k, items: { hard_ore: 1 + Math.floor(k / 10), armor_ore: 1 + Math.floor(k / 10) } }),
};
const LOOKS = [1, 2, 3, 4, 'tree1', 'tree2', 'tree3', 'tree4'];
export const START = { x: 31.5, z: 53.2 }; // where a floor is entered: by the stairs up

// the monsters that may come up from below: those that live in a field or a dungeon floor (not a raid's, a boss,
// a mini-boss or a great hall's)
let pool = null;
function monsterPool() {
  if (pool) return pool;
  const seen = new Set();
  for (const [map, list] of Object.entries(SPAWNS)) {
    if (MAPS[map]?.arena || isDelve(map)) continue;
    for (const [type] of list) seen.add(type);
  }
  pool = [...seen].filter((t) => { const d = MOB_DEFS[t]; return d && !d.boss && !d.mvp && !d.decoy && !d.story && !d.noRespawn && d.lv >= 60; }); // (a great hall's guards too)
  return pool;
}
// floor k's spawn list: three kinds near its level, seeded by the floor
export function floorSpawns(k) {
  const L = DEPTH.lv(k), rng = mulberry32(7919 * k + 13);
  // (from up to 20 levels below the floor's to a little above: raised to it as they come, so the deep floors still vary)
  let near = [];
  for (let w = 20; near.length < 3 && w < 60; w += 5) near = monsterPool().filter((t) => MOB_DEFS[t].lv >= L - w && MOB_DEFS[t].lv <= L + 6);
  const picks = [];
  while (picks.length < 3 && near.length) picks.push(near.splice(Math.floor(rng() * near.length), 1)[0]);
  return picks.map((t, i) => [t, [10, 9, 8][i]]);
}
// carve floor k into map id (before it is built): its seed, its stone, its monsters
export function prepareFloor(id, k) {
  const M = MAPS[id].maze;
  M.seed = 100003 + 7919 * k;
  M.look = LOOKS[(k - 1) % LOOKS.length];
  M.floor = typeof M.look === 'number' ? M.look : 1;
  SPAWNS[id] = floorSpawns(k);
}
// a monster of floor k, made stronger past the deepest level (its own copy of its numbers)
export function deepen(m, k) { // (raised to the floor's level if below it, DEPTH.gap, and past the deepest, DEPTH.mult)
  const f = DEPTH.mult(k) * (1 + DEPTH.gap * Math.max(0, DEPTH.lv(k) - m.def.lv));
  if (f === 1 || m.deepened === k) return;
  const d = m.def;
  m.def = { ...d, hp: Math.round(d.hp * f), atk: d.atk.map((a) => Math.round(a * f)), exp: d.exp.map((e) => Math.round(e * f)) };
  m.hp = m.def.hp;
  m.deepened = k;
}
// the floor the captain can send the hero to: the first floor, or the deepest checkpoint (every fifth floor) reached
export const checkpoint = (best) => (best >= DEPTH.every ? Math.floor(best / DEPTH.every) * DEPTH.every : 1);
