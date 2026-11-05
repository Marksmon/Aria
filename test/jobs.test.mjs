// The owner's job rules (docs/job-rules.md, CLAUDE.md): skill points, which second-job trials open,
// the second jobs' skills and traits.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Progress, JOBS, JOB_TRAITS, TREES, SECOND_AT } from '../src/progress.js';
import { SKILLS, secondJobOpen, learnBlock, pointsIn } from '../src/skills.js';

const SECOND = Object.keys(JOBS).filter((j) => JOBS[j].tier === 2);
const bought = (job) => Object.keys(SKILLS).filter((id) => SKILLS[id].job === job && !SKILLS[id].free && !SKILLS[id].granted);
const firstSkill = (job) => bought(job)[0];
// n points spread over a tree's skills, none past its max
function spend(skills, job, n) {
  for (const id of bought(job)) { if (n <= 0) break; const k = Math.min(n, SKILLS[id].max); skills[id] = k; n -= k; }
}
// a first-job hero at a Job Level with these points spent (pointsIn only counts them)
function hero(jobLv, points, job = Object.keys(points)[0]) {
  const p = new Progress();
  p.unlocked = Object.keys(points);
  p.job = job;
  p.jobLv = jobLv;
  p.skills = { basics: 9 };
  for (const [j, n] of Object.entries(points)) spend(p.skills, j, n);
  return p;
}
const open = (p) => SECOND.filter((j) => secondJobOpen(p, j)).sort();

test('skill points: the Trainee has 9; a Job 50 first job earns 59 (Job Lv 1 counts), 50 left after Basic Training 9', () => {
  const p = new Progress();
  p.jobLv = 10;
  assert.equal(p.skillPoints, 9);
  p.skills = { basics: 9 };
  p.takeFirst('swordman');
  p.jobLv = 50;
  assert.equal(p.skillPoints, 50);
});

test("second-job trials open as the job rules' examples say (Job 50, Blader / Sorcerer points)", () => {
  const cases = [
    [[35, 15], ['blademaster']],
    [[30, 20], ['blademaster', 'magicknight']],
    [[25, 25], ['blademaster', 'magicknight', 'wizard']],
    [[20, 5], ['blademaster']],
    [[5, 20], ['wizard']],
  ];
  for (const [[b, s], want] of cases) assert.deepEqual(open(hero(50, { swordman: b, mage: s })), want.sort(), `${b} / ${s}`);
  assert.deepEqual(open(hero(SECOND_AT - 1, { swordman: 25, mage: 25 })), [], 'below Job 40: none');
});

test('the crosses need 20 points in both paths', () => {
  assert.deepEqual(open(hero(45, { swordman: 20, assassin: 20 })), ['blademaster', 'phantom', 'shadowblade']);
  assert.deepEqual(open(hero(45, { archer: 19, assassin: 26 })), ['phantom']);
  assert.ok(open(hero(45, { archer: 20, assassin: 20 })).includes('hunter'));
  assert.ok(open(hero(45, { mage: 20, assassin: 20 })).includes('voodoo'));
  assert.ok(open(hero(45, { swordman: 20, archer: 20 })).includes('beastmaster'));
  assert.ok(open(hero(45, { mage: 20, archer: 20 })).includes('moonranger'));
});

test('a second job of one path: another first-job tree never passes its own', () => {
  const p = hero(50, { mage: 10, swordman: 10 }, 'mage');
  p.takeSecond('wizard');
  const id = bought('swordman').find((k) => (p.skills[k] || 0) < SKILLS[k].max && !Object.keys(SKILLS[k].needs || {}).length);
  assert.match(String(learnBlock(p, id)), /can't pass/);
  assert.equal(pointsIn(p, 'swordman'), 10);
});

// (the Wizard's five area spells were asked for by name: docs/job-rules.md)
const ACTIVES = { wizard: 5 };
test('every second job keeps to 3-4 active skills, has a trait line, and stands on its paths', () => {
  for (const j of SECOND) {
    const actives = Object.values(SKILLS).filter((s) => s.job === j && s.kind === 'active').length;
    assert.ok(ACTIVES[j] ? actives === ACTIVES[j] : actives >= 3 && actives <= 4, `${j}: ${actives} actives`);
    assert.ok(JOB_TRAITS[j]?.mech && JOB_TRAITS[j].strong && JOB_TRAITS[j].weak, `${j}: JOB_TRAITS`);
    for (const f of JOBS[j].from) assert.ok(TREES[j].includes(f), `${j} trains ${f}`);
  }
});

test('active skills need a known weapon or none', () => {
  for (const [id, s] of Object.entries(SKILLS)) if (s.weapon) assert.ok(['sword', 'staff', 'bow', 'dagger'].includes(s.weapon), id);
});
