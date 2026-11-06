// Goals: three weekly hunts fit for the hero, the same all week and new the next, counted from the
// game's events and paid once; achievements earned once, their titles worn only when earned.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Goals, makeWeek, weekOf, WEEK_MS, WEEKLY, ACHIEVEMENTS, weeklyReward } from '../src/goals.js';

const kinds = { wolf: 'Wolves', snake: 'Snakes' };
test('three hunts fit for the hero, the same all week, new the next', () => {
  const now = Date.UTC(2026, 10, 9, 12);
  const a = makeWeek(weekOf(now), 50, 1, kinds, 3), b = makeWeek(weekOf(now + 864e5), 50, 1, kinds, 3), c = makeWeek(weekOf(now + WEEK_MS), 50, 1, kinds, 3);
  assert.equal(a.goals.length, 3);
  assert.deepEqual(a, b, 'the same week, the same hunts');
  assert.notDeepEqual(a.goals.map((g) => g.kind), c.goals.map((g) => g.kind).concat('x'));
  for (let w = 0; w < 40; w++) for (const g of makeWeek(w, 20, 1, kinds).goals) assert.ok(WEEKLY[g.kind].ok(20, 1), `${g.kind} for a Base 20 first job`);
  for (let w = 0; w < 40; w++) assert.ok(!makeWeek(w, 60, 1, kinds).goals.some((g) => g.kind === 'mvp' || g.kind === 'miniboss'), 'no boss hunts for a first job');
});

test('a hunt counts its own events and is paid once', () => {
  const g = new Goals();
  g.weekly = { week: 1, lv: 50, goals: [{ kind: 'near', n: 2, have: 0, done: false }, { kind: 'kind', type: 'wolf', name: 'Wolves', n: 1, have: 0, done: false }, { kind: 'raid', n: 1, have: 0, done: false }] };
  assert.deepEqual(g.on({ kind: 'kill', lv: 70, type: 'x', heroLv: 50 }), [], 'too far from the hero');
  assert.equal(g.on({ kind: 'kill', lv: 48, type: 'wolf', heroLv: 50 }).length, 1, 'the Wolves hunt');
  assert.equal(g.on({ kind: 'kill', lv: 52, type: 'snake', heroLv: 50 }).map((x) => x.kind).join(), 'near');
  assert.deepEqual(g.on({ kind: 'kill', lv: 52, type: 'snake', heroLv: 50 }), [], 'paid once');
  assert.equal(g.on({ kind: 'raid' }).length, 1);
  assert.ok(weeklyReward('mvp', 80).perz > weeklyReward('near', 80).perz);
});

test('achievements are earned once, and only an earned title can be worn', () => {
  const g = new Goals();
  const got = g.check({ tier: 1, firsts: 1, baseLv: 52 });
  assert.deepEqual(got.map((a) => a.id).sort(), ['base50', 'firstjob']);
  assert.deepEqual(g.check({ tier: 1, firsts: 1, baseLv: 52 }), []);
  g.load({ ...g.toJSON(), title: 'Kingslayer' });
  assert.equal(g.title, null, 'not earned');
  g.load({ ...g.toJSON(), title: 'the Sworn' });
  assert.equal(g.title, 'the Sworn');
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.title)).size, ACHIEVEMENTS.length, 'titles are unique');
});

test('every hero gets three hunts, a new Trainee too', () => {
  for (let w = 0; w < 30; w++) for (const [lv, tier] of [[1, 0], [10, 0], [30, 1], [60, 2], [90, 2]]) assert.equal(makeWeek(w, lv, tier, { slime: 'Bloops' }).goals.length, 3, `week ${w}, Base ${lv}`);
});
