// The boss's big health bar and the dungeons' explored maps (November 2026): what they show is worked out in code a
// test can read without a screen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOB_DEFS } from '../src/mobs.js';
import { bossMarks, bossToShow } from '../src/bossbar.js';
import { Explored, isFogged } from '../src/explored.js';

test('the boss bar marks where a boss turns: its guards at 80/50/25%, Davy Jones\'s phases too', () => {
  assert.deepEqual(bossMarks(MOB_DEFS.poseidon), [0.8, 0.5, 0.25]);
  const davy = bossMarks(MOB_DEFS.davyJones);
  for (const ph of MOB_DEFS.davyJones.phases) if (ph.below > 0 && ph.below < 1) assert.ok(davy.includes(ph.below), `phase at ${ph.below}`);
  for (const [type, d] of Object.entries(MOB_DEFS)) if (d.mvp) assert.ok(bossMarks(d).includes(0.5), `${type}: its rage below half is marked`);
  for (const v of davy) assert.ok(v > 0 && v < 1);
});

test('the boss bar shows the raid\'s boss, else the boss that fights the hero: the one picked first, never a decoy or one far off', () => {
  const mob = (type, x, more = {}) => ({ type, def: MOB_DEFS[type], alive: true, x, z: 0, state: 'chase', ...more });
  const hero = { x: 0, z: 0, goal: null };
  const near = mob('headlessKnight', 4), far = mob('poseidon', 40), idle = mob('poseidon', 6, { state: 'wander' }), plain = mob('wolf', 1);
  assert.equal(bossToShow([plain, far, idle], hero), null, 'a field monster, a boss far off and one not fighting show no bar');
  assert.equal(bossToShow([plain, near, far], hero), near);
  const picked = mob('poseidon', 9, { state: 'wander' });
  assert.equal(bossToShow([near, picked], { ...hero, goal: { mob: picked } }), picked, 'the one the hero picked comes first');
  assert.equal(bossToShow([mob('kingShadow', 2)], hero), null, 'a decoy has no bar');
  const raid = mob('bleepBloop', 30);
  assert.equal(bossToShow([near], hero, raid), raid);
});

test('a maze is dark until walked; the great halls, fields and towns show whole', () => {
  for (const id of ['halls1', 'ygg2', 'galleon3', 'delveA']) assert.ok(isFogged(id), id);
  for (const id of ['halls4', 'ygg4', 'galleon4', 'grove', 'city', 'bloop']) assert.ok(!isFogged(id), id);
  const e = new Explored();
  assert.ok(e.seen('grove', 5, 5), 'a field is always seen');
  assert.ok(!e.seen('halls1', 32, 32));
  assert.ok(e.visit('halls1', 32, 32) > 0);
  assert.ok(e.seen('halls1', 32, 32) && e.seen('halls1', 36, 32) && !e.seen('halls1', 50, 32) && !e.seen('halls1', 32, 8));
  assert.equal(e.visit('halls1', 32, 32), 0, 'standing still lights nothing new');
  assert.equal(e.visit('grove', 32, 32), 0);
});

test('what was seen of a maze is saved with the hero; the Deep Halls\' floors, carved afresh, are not', () => {
  const e = new Explored();
  e.visit('halls1', 32, 32); e.visit('ygg1', 10, 10); e.visit('delveA', 32, 32);
  const saved = JSON.parse(JSON.stringify(e.toJSON()));
  assert.deepEqual(Object.keys(saved).sort(), ['halls1', 'ygg1']);
  const back = new Explored(saved);
  assert.ok(back.seen('halls1', 32, 32) && back.seen('ygg1', 10, 10) && !back.seen('ygg1', 40, 40) && !back.seen('delveA', 32, 32));
  assert.equal(back.count('halls1'), e.count('halls1'));
  e.reset('delveA');
  assert.ok(!e.seen('delveA', 32, 32), 'a new floor: nothing of it seen');
  assert.ok(!new Explored({ halls1: 'not a map', grove: saved.halls1 }).seen('halls1', 32, 32), 'a broken save is left out');
});
