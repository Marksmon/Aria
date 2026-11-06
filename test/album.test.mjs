// The Monster Album: kills and cards are kept, a save from before it loads empty, and every monster
// that can be met has a row (and its card, when it has one).
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { Album, albumRows } from '../src/album.js';
import { MOB_DEFS } from '../src/mobs.js';
import { load, close } from './load.mjs';

const { ITEMS } = await load('items');
after(close);
const CARD_OF = Object.fromEntries(Object.entries(ITEMS).filter(([, it]) => it.card).map(([id, it]) => [it.name.replace(/ Card$/, ''), id]));

test('kills and cards are kept through a save', () => {
  const a = new Album();
  a.kill('slime'); a.kill('slime'); a.kill('crab');
  assert.equal(a.card('bloop_card'), true);
  assert.equal(a.card('bloop_card'), false, 'a card already in the album is not new');
  const b = new Album();
  assert.equal(b.load(JSON.parse(JSON.stringify(a))), true);
  assert.deepEqual(b.kills, { slime: 2, crab: 1 });
  assert.ok(b.cards.has('bloop_card'));
  assert.equal(new Album().load(undefined), false, 'an old save has no album');
});

test('every monster that can be met has a row; decoys have none', () => {
  const a = new Album();
  a.kill('slime');
  const rows = albumRows(MOB_DEFS, a, CARD_OF, () => '');
  const types = new Set(rows.map((r) => r.type));
  for (const [k, d] of Object.entries(MOB_DEFS)) if (d.decoy) assert.ok(!types.has(k), `${k} is a decoy`);
  assert.ok(types.has('jarl') && types.has('nidhogg') && types.has('bleepBloop'));
  const bloop = rows.find((r) => r.type === 'slime');
  assert.equal(bloop.met, true);
  assert.equal(bloop.card, 'bloop_card');
  assert.ok(rows.filter((r) => r.card).length >= rows.length - 3, 'nearly every monster has its card');
  for (let i = 1; i < rows.length; i++) assert.ok(rows[i - 1].lv <= rows[i].lv, 'by level');
});

test("an MVP's card and ultra rare come likelier with every kill they don't drop, back to their own chance once they do", async () => {
  const { PITY, pityChance, isChase } = await import('../src/mobs.js');
  assert.equal(pityChance(0.01, 0), 0.01);
  assert.ok(Math.abs(pityChance(0.01, 10) - 0.02) < 1e-12);
  assert.equal(pityChance(0.01, 1e6), 0.01 * PITY.cap, 'capped');
  assert.ok(isChase('jarl_card') && isChase('allseeing_eye') && isChase('nidhogg_wings') && !isChase('flame_sword'));
  const rows = albumRows(MOB_DEFS, new Album(), CARD_OF, () => '', () => 0.013);
  assert.equal(rows.find((r) => r.type === 'jarl').chance, 0.013);
  assert.equal(rows.find((r) => r.type === 'slime').chance, null, 'only MVPs');
});

test('album sets: eight regions, every one with cards, a finished set giving its bonus', async () => {
  const fs = await import('node:fs');
  const { SETS, setProgress, setBonus } = await import('../src/album.js');
  const { RAIDS } = await import('../src/raid.js');
  const src = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'), i = src.indexOf('const SPAWNS = {'), j = src.indexOf('\n};', i);
  const SPAWNS = (0, eval)(`(${src.slice(i + 15, j + 2).replace(/\/\/[^\n]*/g, '')})`);
  const bosses = Object.values(RAIDS).map((r) => r.boss[0]);
  const empty = setProgress(MOB_DEFS, SPAWNS, CARD_OF, new Album(), bosses);
  assert.equal(empty.length, SETS.length);
  for (const p of empty) { assert.ok(p.cards.length >= 4, `${p.set.name}: ${p.cards.length} cards`); assert.equal(p.done, false); }
  assert.equal(empty.find((p) => p.set.id === 'raids').cards.length, 4, 'the four raid bosses');
  const a = new Album();
  for (const c of empty.find((p) => p.set.id === 'south').cards) a.card(c);
  const full = setProgress(MOB_DEFS, SPAWNS, CARD_OF, a, bosses);
  assert.ok(full.find((p) => p.set.id === 'south').done);
  assert.deepEqual(setBonus(full), { stats: { pow: 1 }, mhpRate: 0, mspRate: 0 });
});
