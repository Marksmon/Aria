// How long a blade's and a bow's SP lasts in a long fight (the review, November 2026: second-sim leaves SP out, "potions").
// The BladeMaster's and the Windrunner's rotations from second-sim.mjs, at Base 80, against a boss that does not fall,
// with SP counted: the hero's Max SP to start, its regen every 8 s (rules.js spRegen), and a skill only when there is
// SP for it (else a plain blow). It says when the SP first runs dry, how many SP a minute the full rotation wants
// beside the regen, how many Blue Potions a minute would keep it going, and how much of the full rotation's damage a
// hero with no Blue Potions still deals over 5 minutes.
//
//   node build-tools/sp-sim.mjs
import { playerAttack } from '../src/rules.js';
import { SKILLS, spCost } from '../src/skills.js';
import { hero, MELEE, BOW, SWORD, BOWG } from './second-sim.mjs';

const LONG = 300, BLUE = 50; // seconds; SP a Blue Potion gives (40-60)
const BOSS = { lv: 55, hp: 1e12, def: 30, vit: 50, agi: 30, dex: 60, mdef: 25, el: 'neutral', boss: true };
const P = (id, lv) => SKILLS[id].power(lv) / 100;

const ROT = {
  blademaster: {
    make: () => hero('blademaster', ['swordman'], MELEE, {}, { ...SWORD, mastery: 9 + 20 + 30, hit: 10 }),
    // [cd key, skill, level, cooldown, hits, power]
    order: [['dance', 'bladedance', 5, 18, 9], ['final', 'finalblade', 5, 6, 8], ['pierce', 'pierce', 10, 1.5, 3], ['fang', 'twinfang', 10, 0.8, 2]],
  },
  windrunner: {
    make: () => hero('windrunner', ['archer'], BOW, {}, { ...BOWG, stats: { fns: 10 }, aspdRate: 0.8 * 0.8 * 0.95, hit: 10 }),
    order: [['volley', 'volley', 10, 1.5, SKILLS.volley.hits(10)], ['cyclone', 'cyclone', 10, 4, 7], ['double', 'doubleshot', 10, 0, 2]],
  },
};
function run(job, limited) {
  const { ps } = ROT[job].make();
  let t = 0, sp = ps.maxSp, regenT = 0, dmg = 0, spent = 0, dry = null;
  const cd = {};
  while (t < LONG) {
    let dt = Math.max(ps.interval, 0.5), done = false;
    for (const [k, id, lv, cool, hits] of ROT[job].order) {
      const cost = spCost(id, lv);
      if ((cd[k] || 0) > t) continue;
      if (limited && sp < cost) { dry ??= t; continue; }
      for (let i = 0; i < hits; i++) dmg += playerAttack(ps, BOSS, (id === 'finalblade' ? 1.4 : P(id, lv)), 1, true).dmg;
      sp -= cost; spent += cost; cd[k] = t + cool; done = true;
      if (id === 'bladedance') dt = 2;
      break;
    }
    if (!done) dmg += playerAttack(ps, BOSS).dmg;
    t += dt;
    for (regenT += dt; regenT >= 8; regenT -= 8) sp = Math.min(ps.maxSp, sp + ps.spRegen);
  }
  return { dmg, spent, dry, maxSp: ps.maxSp, regen: ps.spRegen };
}
const avg = (f, n = 30) => { let s = 0; for (let i = 0; i < n; i++) s += f(); return s / n; };
console.log('| Job (Base 80) | Max SP | Regen (SP / 8 s) | Rotation wants (SP / min) | Regen gives (SP / min) | Dry after | Blue Potions / min to keep it | Damage over 5 min with no Blue Potions |');
console.log('|---|---|---|---|---|---|---|---|');
for (const job of Object.keys(ROT)) {
  const full = run(job, false), lim = run(job, true);
  const want = full.spent / (LONG / 60), gets = full.regen * 60 / 8;
  const share = avg(() => run(job, true).dmg) / avg(() => run(job, false).dmg);
  console.log(`| ${job} | ${full.maxSp} | ${full.regen} | ${Math.round(want)} | ${Math.round(gets)} | ${lim.dry == null ? 'never' : `${Math.round(lim.dry)} s`} | ${Math.max(0, (want - gets) / BLUE).toFixed(1)} | ${Math.round(share * 100)}% |`);
}
