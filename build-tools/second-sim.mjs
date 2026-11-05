// A rotation model of the second jobs against one boss, with the game's own rules (src/rules.js) and
// skills (src/skills.js): how long each takes to bring down a neutral Lv 55 boss of 300,000 HP, at
// Base 80, Job 30, weapons of one tier at +7. The hero stands and uses its best skill whenever it is
// ready (SP is not counted: potions); a skill takes the swing it goes off on (a spell its cast).
// It checks the owner's balance between the second jobs (docs/balance.md), not exact numbers.
//
//   node build-tools/second-sim.mjs
// It is also a module: setup() points the rotations at another boss, Base Level, Job Level and gear, and
// killTime() runs one (build-tools/mvp-sim.mjs, the MVPs and the raid bosses).
import { derive, playerAttack, magicAttack, elementMod } from '../src/rules.js';
import { Progress } from '../src/progress.js';
import { SKILLS, AMBUSH, BLIGHT } from '../src/skills.js';

const RUNS = 40;
let HP = 300000, BASE = 80, JOBLV = 30;
let BOSS = { lv: 55, hp: HP, def: 30, vit: 50, agi: 30, dex: 60, mdef: 25, el: 'neutral', boss: true };
const P = (id, lv) => SKILLS[id].power(lv) / 100;

function hero(job, from, stats, skills, gear) {
  const p = new Progress();
  while (p.baseLv < BASE) p.gain(p.baseNeed, 0);
  p.skills = { basics: 9, ...skills };
  p.unlocked = [...from, job];
  p.firstLv = 50; p.job = job; p.jobLv = JOBLV;
  if (BASE === 80) for (const [k, v] of Object.entries(stats)) p.stats[k] = v;
  else { // another Base Level: the same build's shares of the points there (as build-tools/sim.mjs does)
    const sum = () => Object.keys(stats).reduce((a, k) => a + p.stats[k], 0);
    for (let guard = 0; guard < 3000; guard++) {
      const k = Object.keys(stats).sort((x, y) => p.stats[x] / sum() / stats[x] - p.stats[y] / sum() / stats[y])[0];
      if (!p.raise(k) && !Object.keys(stats).some((o) => p.raise(o))) break;
    }
  }
  const g = { hit: 0, flee: 0, aspdRate: 1, def: 20, mastery: 9, ...gear };
  return { p, g, ps: derive(p, g) };
}
// stat builds of about the same cost (Base 80)
const MELEE = { pow: 80, qkn: 60, end: 40, fns: 40, ftn: 10, knl: 10 };
const BOW = { fns: 80, qkn: 60, end: 40, pow: 20, ftn: 10, knl: 30 };
const CASTER = { knl: 85, fns: 60, end: 35, qkn: 25, ftn: 5, pow: 5 };
let SWORD = { atk: 100 + 21, wlv: 3 }, BOWG = { atk: 100 + 21 + 10, wlv: 3, bow: true }, STAFF = { atk: 60, wlv: 3, matk: 30 };
// point the rotations at another fight: { boss (a monster def), hp, base, jobLv, sword, bow, staff } (all optional)
export function setup(o = {}) {
  if (o.boss) BOSS = o.boss;
  if (o.hp) HP = o.hp;
  if (o.base) BASE = o.base;
  if (o.jobLv) JOBLV = o.jobLv;
  if (o.sword) SWORD = o.sword;
  if (o.bow) BOWG = o.bow;
  if (o.staff) STAFF = o.staff;
}
// the hero a rotation fights with, for its HP, DEF and FLEE (build-tools/mvp-sim.mjs)
export const HEROES = {
  blademaster: () => hero('blademaster', ['swordman'], MELEE, { ironhide: 10 }, { ...SWORD }),
  shadowblade: () => hero('shadowblade', ['swordman', 'assassin'], MELEE, { ironhide: 10 }, { ...SWORD }),
  windrunner: () => hero('windrunner', ['archer'], BOW, {}, { ...BOWG }),
  hunter: () => hero('hunter', ['archer', 'assassin'], BOW, {}, { ...BOWG }),
  wizard: () => hero('wizard', ['mage'], CASTER, {}, STAFF),
  voodoo: () => hero('voodoo', ['mage', 'assassin'], CASTER, {}, STAFF),
};

export const JOBS_SIM = {
  blademaster() {
    const { ps } = hero('blademaster', ['swordman'], MELEE, {}, { ...SWORD, mastery: 9 + 20 + 30, hit: 10 });
    let t = 0, hp = HP, cd = {}, stacks = 0;
    const hit = (m, o = {}) => { const md = o.half ? { ...BOSS, def: BOSS.def / 2 } : BOSS; return playerAttack(ps, md, m * (1 + stacks * 0.05), 1, true).dmg; };
    const combo = () => (Math.random() < 0.4 ? (stacks = Math.min(5, stacks + 1), hit(1)) : 0);
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t;
      let dmg = 0, dt = ps.interval;
      if (ready('dance')) { for (let i = 0; i < 9; i++) dmg += hit(P('bladedance', 5)) + combo(); cd.dance = t + 18; dt = 2; }
      else if (ready('final') && stacks >= 3) { const s = stacks; stacks = 0; for (let i = 0; i < 8; i++) dmg += playerAttack(ps, BOSS, (55 + 55 + 8 * s) / 100, 1, true).dmg; cd.final = t + 6; }
      else if (ready('pierce')) { for (let i = 0; i < 3; i++) dmg += hit(P('pierce', 10), { half: true }); dmg += combo(); cd.pierce = t + 1.5; }
      else if (ready('fang')) { dmg += hit(P('twinfang', 10)) + combo() + hit(P('twinfang', 10)) + combo(); cd.fang = t + 0.8; }
      else dmg += playerAttack(ps, BOSS).dmg;
      hp -= dmg; t += Math.max(dt, 0.5);
    }
    return t;
  },
  shadowblade() {
    const { ps } = hero('shadowblade', ['swordman', 'assassin'], MELEE, {}, { ...SWORD, mastery: 9 + 20 + 20 });
    ps.crit += 5;
    let t = 0, hp = HP, cd = {}, ambush = false, backUntil = 0;
    const amb = AMBUSH * 1.5; // (Night Stalker 5)
    // (Backstab 10: +50% for the 2 s at the boss's back after Umbral Step; a lone boss faces you otherwise)
    const cut = (m) => { const cruel = (hp < HP / 2 ? 1.2 : 1) * (t < backUntil ? 1.5 : 1), a = ambush ? amb : 1; ambush = false; return playerAttack({ ...ps, el: 'shadow' }, BOSS, m * cruel * a, 1, true).dmg; };
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t;
      let dmg = 0;
      if (ready('eclipse') && (ambush || (cd.step || 0) - t > 3)) { dmg += cut(P('eclipse', 10) * (2 - hp / HP)); cd.eclipse = t + 8; }
      else if (ready('step') && !ambush) { dmg += cut(P('umbralstep', 5)); ambush = true; backUntil = t + 2; cd.step = t + 6; }
      else if (ready('slash') && !(ambush && (cd.eclipse || 0) - t < 1.2)) { dmg += cut(P('shadowslash', 10)) + cut(P('shadowslash', 10)); cd.slash = t + 0.8; }
      else if (!ambush) dmg += playerAttack(ps, BOSS).dmg;
      hp -= dmg; t += Math.max(ps.interval, 0.5);
    }
    return t;
  },
  windrunner() {
    const { ps } = hero('windrunner', ['archer'], BOW, {}, { ...BOWG, stats: { fns: 10 }, aspdRate: 0.8 * 0.8 * 0.95, hit: 10 });
    let t = 0, hp = HP, cd = {};
    const shot = (m) => playerAttack(ps, BOSS, m * 1.1, 1, true).dmg;
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t;
      let dmg = 0;
      if (ready('volley')) { for (let i = 0; i < SKILLS.volley.hits(10); i++) dmg += shot(P('volley', 10)); cd.volley = t + 1.5; }
      else if (ready('cyclone')) { for (let i = 0; i < 7; i++) dmg += shot(P('cyclone', 10)); cd.cyclone = t + 4; }
      else dmg += shot(P('doubleshot', 10)) * 2;
      hp -= dmg; t += Math.max(ps.interval, 0.5);
    }
    return t;
  },
  hunter() {
    const { p, ps } = hero('hunter', ['archer', 'assassin'], BOW, {}, { ...BOWG, stats: { fns: 10 }, hit: 10 });
    const st = (k) => p.total(k) + (k === 'fns' ? 10 : 0), base = st('fns') * 1.5 + st('knl') + 160, mastery = 1.5;
    let t = 0, hp = HP, cd = {}, heldUntil = 0;
    const KITE = 0.7; // a trap set while the boss comes on: most are sprung
    const trap = (id, lv) => base * P(id, lv) * mastery;
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t, held = t < heldUntil, pred = held ? 1.25 : 1;
      let dmg = 0;
      if (ready('bear') && !held) { if (Math.random() < KITE) { dmg += trap('beartrap', 10); heldUntil = t + (4 + 1.5) / 2; } cd.bear = t + 1.5; }
      else if (ready('kill')) { dmg += playerAttack(ps, BOSS, P('killingshot', 10) * (held ? 1.6 : 1) * pred, 1, true).dmg; cd.kill = t + 2; }
      else if (ready('mine')) { if (Math.random() < KITE) dmg += trap('landmine', 10); cd.mine = t + 10; }
      else if (ready('shock')) { if (Math.random() < KITE) dmg += trap('shocktrap', 10); cd.shock = t + 2; }
      else dmg += playerAttack(ps, BOSS, P('doubleshot', 10) * pred, 1, true).dmg * 2;
      hp -= dmg; t += Math.max(ps.interval, 0.5);
    }
    return t;
  },
  wizard() {
    const { ps } = hero('wizard', ['mage'], CASTER, {}, STAFF);
    let t = 0, hp = HP, cd = {}, last = null, shatter = false;
    const cast = (id, lv) => SKILLS[id].cast(lv) * ps.castRate * 0.85;
    const spell = (m, el) => { let k = 1.3 * (last && last !== el ? 1.3 : 1) * (shatter && el !== 'earth' ? 1.3 : 1); if (el !== 'earth') shatter = false; last = el; return magicAttack(ps, BOSS, m * k, el).dmg; };
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t;
      let dmg = 0, dt;
      if (ready('meteor')) { for (let i = 0; i < SKILLS.meteor.hits(10); i++) if (Math.random() < 0.5) dmg += spell(P('meteor', 10), 'fire'); dt = cast('meteor', 10); cd.meteor = t + dt + 4; }
      else if (ready('thunder')) { for (let i = 0; i < 6; i++) dmg += spell(P('thunder', 10), 'wind'); dt = cast('thunder', 10); cd.thunder = t + dt + 3; }
      else if (!shatter) { dmg += spell(P('stonespike', 10), 'earth'); shatter = true; dt = cast('stonespike', 10); }
      else { dmg += spell(P('spark', 10), 'fire'); dt = cast('spark', 10); }
      hp -= dmg; t += Math.max(dt, 0.6);
    }
    return t;
  },
  voodoo() {
    const { ps } = hero('voodoo', ['mage', 'assassin'], CASTER, {}, STAFF);
    let t = 0, hp = HP, cd = {}, stacks = 0, until = 0, dollUntil = 0, curseUntil = 0, tick = 1;
    const cast = (id, lv) => SKILLS[id].cast(lv) * ps.castRate * 0.85;
    const matk = () => { let x = 0; for (let i = 0; i < 20; i++) x += ps.matk[0] + Math.random() * (ps.matk[1] - ps.matk[0]); return x / 20; };
    const per = (BLIGHT.base + BLIGHT.per * 10) / 100, dur = BLIGHT.dur + 2;
    const add = (n) => { stacks = Math.min(t < dollUntil ? BLIGHT.dollMax : BLIGHT.max, (t < until ? stacks : 0) + n); until = t + dur; };
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t, curse = t < curseUntil ? 1.2 : 1;
      let dmg = 0, dt = 0.5;
      if (ready('doll')) { dollUntil = t + 18; cd.doll = t + 25; }
      else if (ready('circle')) { dt = cast('cursecircle', 10); curseUntil = t + dt + 6; cd.circle = t + dt + 4; for (let i = 0; i < 6; i++) { dmg += magicAttack(ps, BOSS, P('cursecircle', 10), 'shadow').dmg * 1.2; } add(3); }
      else { dt = Math.max(0.8, cast('poisonthrow', 10)); dmg += magicAttack(ps, BOSS, P('poisonthrow', 10), 'shadow').dmg * curse; add(2 + (t < dollUntil ? 1 : 0)); }
      // the Blight ticks over the action's time
      for (let s = 0; s < dt; s += 0.1) { if ((tick -= 0.1) <= 0) { tick = 1; if (t + s < until) dmg += matk() * per * stacks * (t + s < dollUntil ? 1.15 : 1) * elementMod('shadow', BOSS.el) * curse; } }
      hp -= dmg; t += dt;
    }
    return t;
  },
};
const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];
// the median time a job takes to bring down HP of the boss set up (setup)
export const killTime = (job, runs = RUNS) => median(Array.from({ length: runs }, JOBS_SIM[job]));
if (import.meta.url === `file://${process.argv[1]}`) {
  const res = Object.fromEntries(Object.entries(JOBS_SIM).map(([k, f]) => [k, median(Array.from({ length: RUNS }, f))]));
  for (const [k, s] of Object.entries(res)) console.log(k.padEnd(12), `${s.toFixed(0).padStart(4)} s  ${(HP / s).toFixed(0).padStart(6)} a second`);
  console.log('\nShadowblade / BladeMaster', (res.blademaster / res.shadowblade).toFixed(2), '· Hunter / Windrunner', (res.windrunner / res.hunter).toFixed(2), '· Voodoo / Wizard', (res.wizard / res.voodoo).toFixed(2));

  // --check: fail (exit 1) when a cross leaves the owner's balance (docs/job-rules.md): the Shadowblade
  // about 1.1x the BladeMaster, the Hunter about 0.9x the Windrunner, the Voodoo about 1.1x the Wizard.
  // The Windrunner out-shoots the BladeMaster and the Wizard on one target, as its trait says.
  // The CI runs it (.github/workflows/test.yml), so a balance change that breaks a rule is caught
  const BANDS = { 'Shadowblade / BladeMaster': [res.blademaster / res.shadowblade, 0.98, 1.25], 'Hunter / Windrunner': [res.windrunner / res.hunter, 0.78, 1.02], 'Voodoo / Wizard': [res.wizard / res.voodoo, 0.97, 1.22],
    // the Windrunner's trait (progress.js JOB_TRAITS): the most damage on one target of the one-path second jobs
    'Windrunner / BladeMaster': [res.blademaster / res.windrunner, 1.1, 2.0], 'Windrunner / Wizard': [res.wizard / res.windrunner, 1.1, 2.5] };
  if (process.argv.includes('--check')) {
    const off = Object.entries(BANDS).filter(([, [r, lo, hi]]) => !(r >= lo && r <= hi));
    for (const [k, [r, lo, hi]] of off) console.log(`OUT OF BAND: ${k} ${r.toFixed(2)} (wanted ${lo}-${hi})`);
    if (off.length) process.exit(1);
    console.log('second jobs: every cross in its band, the Windrunner ahead on one target');
  }

}
