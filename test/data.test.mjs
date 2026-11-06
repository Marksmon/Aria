// The game's data holds together: every monster, item, map and quest a piece of data names exists,
// and the owner's card rule holds (one card per monster, named after it).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { load, close } from './load.mjs';
import { MOB_DEFS, ORE_DROPS } from '../src/mobs.js';
import { MAPS } from '../src/world.js';

const { ITEMS, RECIPES, PRICES, SHOPS } = await load('items');
const { QUESTS, NEXT, NPCS } = await load('quests');
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
  for (const id of Object.keys(MAPS)) if (id !== 'camp') assert.ok(reached.has(id) || MAPS[id].arena || MAPS[id].delve || (MAPS[id].voyage && Object.values(NPCS).some((n) => n.ship?.some((d) => d.to === id))), `${id} has no way in`); // (a voyage's land: a Ship Captain sails there) // (a raid's arena is reached from its guide)
});

// what a quest or story step names: monsters, items, maps
function check(where, q) {
  const mobs = q.mobs && !Array.isArray(q.mobs) ? Object.keys(q.mobs) : q.mobs; // (a list, or how many of each)
  for (const id of [q.mob, mobs, q.spawn?.mob, (q.waves || []).map((w) => w[0]), (q.ambush || []).flat().map((w) => w[0])].flat().filter(Boolean)) assert.ok(mobOk(id), `${where}: monster ${id}`);
  if (q.kind === 'escort') assert.ok(NPCS[q.who]?.map === q.map && q.to && q.hp > 0 && q.ambush?.length && q.place, `${where}: an escort needs its person on its map, a place to go, HP and ambushes`);
  for (const [x, z] of (q.kind === 'search' && Array.isArray(q.spots?.[0]) ? q.spots : [])) assert.ok(x > 3 && x < 61 && z > 3 && z < 61, `${where}: spot ${x},${z}`);
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

test('the story: its people exist, its searches and stands are on real maps, and no step needs a boss', () => {
  for (const s of STORY) {
    if (s.npc) assert.ok(NPCS[s.npc], `story ${s.id}: npc ${s.npc}`);
    for (const p of s.spots || []) assert.ok(MAPS[p.map] && p.x > 3 && p.x < 61 && p.z > 3 && p.z < 61, `story ${s.id}: spot ${JSON.stringify(p)}`);
    if (s.kind === 'search') assert.ok(s.spots?.length && s.thing, `story ${s.id}: a search needs spots and a thing`);
    if (s.kind === 'survive') assert.ok(s.at && s.secs > 0 && MAPS[s.map], `story ${s.id}: a stand needs a spot, a time and a map`);
    if (s.meteors) assert.ok(s.meteors.hp > 0 && s.meteors.hp < 0.25 && s.meteors.every >= 5, `story ${s.id}: Meteor Rain stays survivable`);
    const kin = [s.mob, s.mobs, s.spawn?.mob, s.heralds?.early, s.heralds?.late].flat().filter(Boolean);
    for (const m of kin) assert.ok(!MOB_DEFS[m].boss && !MOB_DEFS[m].mvp, `story ${s.id}: ${m} is a boss (the owner's rule: no story step needs one)`);
  }
});

// the story's cutscenes (scenes.js): every chapter opens with one, every shot is on a real map and looks at
// something that is there, and each big moment belongs to a real step (or a secret series' last quest)
// the quest-variety pass (the audit, P1): kill and fetch are no longer most of the side quests' kinds, and every
// other kind the game knows is used
test('quests come in many kinds: kill and fetch under 70%, escort, defend, search and quiz all used', () => {
  const kinds = Object.values(QUESTS).map((q) => q.kind || 'kill');
  const share = kinds.filter((k) => k === 'kill' || k === 'fetch').length / kinds.length;
  assert.ok(share < 0.7, `kill and fetch are ${(share * 100).toFixed(0)}% of quests`);
  for (const k of ['escort', 'defend', 'search', 'quiz', 'deliver', 'visit']) assert.ok(kinds.includes(k), `no ${k} quest`);
});

test('the story\'s cutscenes: every chapter has an opening, every shot is on a real map, at a real place', async () => {
  const { CHAPTER_SHOTS, STEP_SHOTS, SECRET_SHOTS, INTRO_SHOTS } = await import('../src/scenes.js');
  const chapters = [...new Set(STORY.map((s) => s.ch.split(':')[0]))].filter((c) => c !== 'Prologue');
  for (const c of chapters) assert.ok(CHAPTER_SHOTS[c]?.length, `${c} has no opening cutscene`);
  for (const c of Object.keys(CHAPTER_SHOTS)) assert.ok(chapters.includes(c), `CHAPTER_SHOTS ${c}: no such chapter`);
  for (const id of Object.keys(STEP_SHOTS)) assert.ok(STORY.some((s) => s.id === id), `STEP_SHOTS ${id}: no such step`);
  for (const id of Object.keys(SECRET_SHOTS)) assert.ok(QUESTS[id], `SECRET_SHOTS ${id}: no such quest`);
  const all = [['intro', INTRO_SHOTS], ...Object.entries({ ...CHAPTER_SHOTS, ...STEP_SHOTS, ...SECRET_SHOTS })];
  for (const [k, shots] of all) for (const s of shots) {
    assert.ok(MAPS[s.map] && !MAPS[s.map].arena, `${k}: shot on ${s.map}`);
    assert.ok(s.time >= 0 && s.time < 1 && s.dist > 0 && (s.text || s.card), `${k}: a shot needs a time, a distance and words`);
    const f = s.focus;
    if (typeof f === 'object') assert.ok(f.x > 0 && f.x < 64 && f.z > 0 && f.z < 64, `${k}: focus ${JSON.stringify(f)}`);
    else if (f.startsWith('npc:')) assert.ok(NPCS[f.slice(4)] && (NPCS[f.slice(4)].map || 'camp') === s.map, `${k}: ${f} is not on ${s.map}`);
    else assert.ok(['fire', 'field', 'hero', 'jarl'].includes(f), `${k}: focus ${f}`);
    if (f === 'fire') assert.equal(s.map, 'camp', `${k}: Eldrun's fire is at camp`);
    if (f === 'jarl') assert.equal(s.map, 'ridge', `${k}: the Fire Giant sleeps on Ember Hill`);
  }
});

test("an item's 'from' text names real droppers at their real rates", () => {
  const PL = { Wolf: 'Wolves', Cactus: 'Cacti', Mummy: 'Mummies', Sarcophagus: 'Sarcophagi', 'Dark Elf': 'Dark Elves' };
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = [...new Set(Object.values(MOB_DEFS).filter((d) => !d.decoy).map((d) => d.name))].sort((a, b) => b.length - a.length);
  const bad = [];
  for (const [id, it] of Object.entries(ITEMS)) {
    if (!it.from || id.includes('|')) continue;
    let f = it.from;
    for (const nm of names) {
      // "Bear (3%)", "Bears (0.15%)", "the Great Bear (3%)": that monster drops it, at that rate (not a raid's name: "Bloop Island")
      const re = new RegExp(`\\b(?:${[`${esc(nm)}(?:e?s)?`, ...(PL[nm] ? [esc(PL[nm])] : [])].join('|')})\\b(?! Island| Camp| Lair|'s Tomb| Cores| Tomb)(?:\\s*\\(([0-9.]+)%\\))?`, 'g');
      for (const m of f.matchAll(re)) {
        const drop = Object.values(MOB_DEFS).filter((d) => d.name === nm).flatMap((d) => [...(d.drops || []), ...(d.mvpDrops || []).map(([i]) => [i, 1, 1, 'mvp'])]).find(([i]) => i === id);
        if (!drop) bad.push(`${id}: says ${nm}, which doesn't drop it`);
        else if (m[1] && drop[3] !== 'mvp' && Math.abs(drop[3] * 100 - +m[1]) > 0.001) bad.push(`${id}: ${nm} ${m[1]}%, really ${+(drop[3] * 100).toFixed(2)}%`);
      }
      f = f.replace(re, '#');
    }
  }
  assert.deepEqual(bad, []);
});

// a key written twice in a data table silently drops the first entry (Ingrid the Tutor vanished
// that way when Old Ingrid the Seedkeeper took her key), so the tables' keys are checked in the source
test('no data table repeats a key', async () => {
  const fs = await import('node:fs');
  const tables = [['items.js', 'const BASE_ITEMS = {'], ['mobs.js', 'export const MOB_DEFS = {'], ['skills.js', 'export const SKILLS = {'],
    ['world.js', 'export const MAPS = {'], ['quests.js', 'export const NPCS = {'], ['quests.js', 'export const QUESTS = {']];
  for (const [file, head] of tables) {
    const s = fs.readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), i = s.indexOf(head);
    assert.ok(i >= 0, `${file}: ${head}`);
    const keys = [...s.slice(i, s.indexOf('\n};', i)).matchAll(/^ {2}([a-zA-Z0-9_]+):/gm)].map((m) => m[1]);
    assert.deepEqual(keys.filter((k, n) => keys.indexOf(k) !== n), [], `${file} ${head}`);
  }
});

test("the MVPs' ultra rares are the items marked ultra that an MVP drops, at 1% (the owner's call)", async () => {
  const { MVP_ULTRAS } = await import('../src/mobs.js');
  const dropped = Object.values(MOB_DEFS).filter((d) => d.mvp).flatMap((d) => d.drops.filter(([id]) => ITEMS[id]?.ultra));
  assert.deepEqual(dropped.map(([id]) => id).sort(), [...MVP_ULTRAS].sort());
  for (const [id, , , c] of dropped) assert.equal(c, 0.01, id);
});

test('battle oils name an element, stat foods one stat each, and every one is sold', () => {
  const sold = new Set(Object.values(SHOPS).flat());
  const oils = Object.entries(ITEMS).filter(([, it]) => it.use?.oil), foods = Object.entries(ITEMS).filter(([, it]) => it.use?.food);
  assert.deepEqual(oils.map(([, it]) => it.use.oil).sort(), ['earth', 'fire', 'water', 'wind']);
  assert.deepEqual(foods.map(([, it]) => it.use.food).sort(), ['end', 'fns', 'ftn', 'knl', 'pow', 'qkn']);
  for (const [id, it] of [...oils, ...foods]) {
    assert.ok(sold.has(id), `${id} is in no shop`);
    assert.ok(it.use.t > 0 && it.usable, `${id} lasts`);
  }
});

test("Poseidon, Hafnvik's MVP (the owner's sheet): Water, on the Storm Isles, his four moves, Merrows and Glass Jellies at his call, tier 95", async () => {
  const { MOVES, MVP_ULTRAS } = await import('../src/mobs.js');
  const { SPAWNS } = await import('../src/spawns.js');
  const { TIERS } = await import('../build-tools/mvp-sim.mjs');
  const P = MOB_DEFS.poseidon;
  assert.ok(P.mvp && P.el === 'water' && TIERS.poseidon === 95);
  assert.ok(SPAWNS.storm.some(([t]) => t === 'poseidon'));
  assert.deepEqual(P.moves.filter((m) => m.name).map((m) => m.name), ['Tidal Barrage', 'Leviathan Surge', 'Oceanic Prison', 'Raging Maelstrom']);
  for (const m of P.moves) assert.ok(MOVES[m.kind], m.kind);
  assert.deepEqual([...new Set(P.summon)].sort(), ['glassJelly', 'merrow']);
  // the Oceanic Prison's cage: a decoy anyone can break, whatever their weapon's element
  assert.ok(MOB_DEFS.tidePrison.decoy && MOB_DEFS.tidePrison.el === 'neutral');
  assert.ok(MVP_ULTRAS.includes('poseidon_crown'));
});

test("no recoloured monsters (the owner's call): only bloops share a body in new colours; others share a look only as the same monster", () => {
  const BLOOPS = /^slime/;
  const byArt = {};
  for (const [k, d] of Object.entries(MOB_DEFS)) {
    if (d.decoy) continue; // (a boss's shadows are its own look)
    if (d.tint) assert.match(d.art, BLOOPS, `${k} is tinted`);
    if (!BLOOPS.test(d.art)) (byArt[d.art] ||= new Set()).add(d.name);
  }
  for (const [art, names] of Object.entries(byArt)) assert.equal(names.size, 1, `${art} is worn by ${[...names].join(', ')}`);
});

test("Ghost (the owner's call): a Neutral blow does nothing, every other element 150%, Shadow 175%", async () => {
  const { elementMod, playerAttack, magicAttack } = await import('../src/rules.js');
  assert.equal(elementMod('neutral', 'ghost'), 0);
  for (const el of ['water', 'earth', 'fire', 'wind']) assert.equal(elementMod(el, 'ghost'), 1.5, el);
  assert.equal(elementMod('shadow', 'ghost'), 1.75);
  const ghost = MOB_DEFS.ghost;
  const ps = { batk: 200, watk: 200, fns: 50, wlv: 4, mastery: 10, hit: 999, crit: 0, el: 'neutral', matk: [300, 300] };
  assert.equal(playerAttack(ps, ghost, 1, 1, true).dmg, 0);
  assert.equal(magicAttack(ps, ghost, 1, 'neutral').dmg, 0);
  assert.ok(playerAttack({ ...ps, el: 'wind' }, ghost, 1, 1, true).dmg > 0);
});

test("the Sunken Galleon (the owner's call): Asgeir sails there from Base 85, Davy Jones (Lv 110, Ghost) in its hold, the Kraken on its third floor", async () => {
  const { SPAWNS } = await import('../src/spawns.js');
  const { TIERS } = await import('../build-tools/mvp-sim.mjs');
  assert.deepEqual(NPCS.asgeir.ship.find((s) => s.to === 'wreck'), { to: 'wreck', fare: 6000, lv: 85 });
  const D = MOB_DEFS.davyJones, K = MOB_DEFS.kraken;
  assert.ok(D.mvp && D.el === 'ghost' && D.lv === 110 && D.hall && TIERS.davyJones === 99);
  // three phases for him (the owner's call), none for the Kraken: each phase's moves are his
  assert.deepEqual(D.phases.map((p) => p.name), ['The Cursed Captain', 'The Drowned Fleet', 'The Abyssal King']);
  for (const p of D.phases) for (const n of p.moves) assert.ok(D.moves.some((m) => (m.name || m.kind) === n), n);
  assert.ok(!K.phases);
  assert.deepEqual([...new Set(D.summon)].sort(), ['pirateSkeleton', 'zombie']);
  assert.ok(K.boss && !K.mvp && K.writhe);
  assert.deepEqual([...new Set(K.summon)].sort(), ['octopus', 'pufferFish']);
  assert.ok(SPAWNS.galleon3.some(([t]) => t === 'kraken') && SPAWNS.galleon4.some(([t]) => t === 'davyJones'));
  for (const t of ['conch', 'pufferFish', 'zombie', 'pirateSkeleton', 'blowgunPirate', 'octopus', 'ghost', 'skeletonAssassin', 'hydra']) assert.ok(Object.values(SPAWNS).some((l) => l.some(([x]) => x === t)), t);
});
