// The game's data holds together: every monster, item, map and quest a piece of data names exists,
// and the owner's card rule holds (one card per monster, named after it).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { load, close } from './load.mjs';
import { MOB_DEFS, ORE_DROPS } from '../src/mobs.js';
import { MAPS } from '../src/world.js';

const { ITEMS, RECIPES, PRICES, SHOPS } = await load('items');
const { QUESTS, NEXT } = await load('quests');
const { STORY } = await load('story');
after(close);

const mobOk = (id) => !!MOB_DEFS[id];
const itemOk = (id) => !!ITEMS[id];

test('every drop is an item', () => {
  for (const [k, d] of Object.entries(MOB_DEFS)) for (const [id] of [...(d.drops || []), ...(d.mvpDrops || [])]) assert.ok(itemOk(id), `${k} drops ${id}`);
  for (const [id] of ORE_DROPS) assert.ok(itemOk(id), `ORE_DROPS ${id}`);
});

test('every summon and guard is a monster', () => {
  for (const [k, d] of Object.entries(MOB_DEFS)) for (const id of [d.summon, d.split].flat().filter(Boolean)) assert.ok(mobOk(id), `${k} calls ${id}`);
});

test('every recipe, shop and price names a real item', () => {
  for (const r of RECIPES) {
    assert.ok(itemOk(r.item), `recipe makes ${r.item}`);
    for (const id of Object.keys(r.cost || {})) assert.ok(itemOk(id), `recipe for ${r.item} needs ${id}`);
  }
  for (const [shop, list] of Object.entries(SHOPS)) for (const id of list) {
    assert.ok(itemOk(id), `${shop} sells ${id}`);
    assert.ok(PRICES[id] > 0, `${shop} sells ${id} with no price`);
  }
});

test('cards are monsters: one card per monster, named after it (the owner\'s rule)', () => {
  const names = new Set(Object.values(MOB_DEFS).map((d) => d.name));
  const perMob = {};
  for (const [k, d] of Object.entries(MOB_DEFS)) for (const [id] of d.drops || []) if (ITEMS[id]?.type === 'card' || /_card$/.test(id)) (perMob[k] ||= new Set()).add(id);
  for (const [k, set] of Object.entries(perMob)) assert.ok(set.size === 1, `${k} drops ${[...set].join(', ')}`);
  for (const [id, it] of Object.entries(ITEMS)) {
    if (!/_card$/.test(id)) continue;
    const mob = String(it.name).replace(/ Card$/, '');
    assert.ok(names.has(mob), `${id} (${it.name}) is no monster`);
  }
});

test('every portal leads to a map, and every map can be reached', () => {
  const reached = new Set();
  for (const [id, m] of Object.entries(MAPS)) for (const p of m.portals || []) { assert.ok(MAPS[p.to], `${id} portal to ${p.to}`); reached.add(p.to); }
  for (const id of Object.keys(MAPS)) if (id !== 'camp') assert.ok(reached.has(id) || MAPS[id].arena, `${id} has no way in`); // (a raid's arena is reached from its guide)
});

// what a quest or story step names: monsters, items, maps
function check(where, q) {
  const mobs = q.mobs && !Array.isArray(q.mobs) ? Object.keys(q.mobs) : q.mobs; // (a list, or how many of each)
  for (const id of [q.mob, mobs, q.spawn?.mob, (q.waves || []).map((w) => w[0])].flat().filter(Boolean)) assert.ok(mobOk(id), `${where}: monster ${id}`);
  for (const id of Object.keys({ ...(q.items || {}), ...(q.reward?.items || {}) })) assert.ok(itemOk(id), `${where}: item ${id}`);
  if (typeof q.map === 'string') assert.ok(MAPS[q.map], `${where}: map ${q.map}`);
}

test('every quest names real monsters, items and maps, and its next step exists', () => {
  for (const [id, q] of Object.entries(QUESTS)) check(id, q);
  for (const [a, b] of Object.entries(NEXT)) { assert.ok(QUESTS[a], `NEXT from ${a}`); assert.ok(QUESTS[b], `NEXT to ${b}`); }
});

test('the story: unique step ids, real monsters, items and maps', () => {
  const ids = STORY.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'story ids are unique');
  for (const s of STORY) check(`story ${s.id}`, s);
});
