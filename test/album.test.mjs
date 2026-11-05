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
