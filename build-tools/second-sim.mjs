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
// the four second jobs added in November 2026 (they were in no simulator): builds of about the same cost
const DAGGERS = { pow: 78, qkn: 68, end: 30, fns: 40, ftn: 12, knl: 5 };  // the Phantom: quick, frail
const KNIGHT = { pow: 72, knl: 50, end: 40, qkn: 45, fns: 35, ftn: 5 };   // the Magic Knight: ATK and MATK
const MOON = { fns: 75, knl: 55, qkn: 52, end: 38, pow: 10, ftn: 5 };     // the Moon Ranger: a bow and MATK
const PACK = { end: 58, fns: 62, qkn: 55, pow: 45, ftn: 10, knl: 10 };    // the Beastmaster: what its beasts feed on
const DAGGER_ATK = 0.76; // a dagger's ATK beside a sword of its tier (docs/balance.md)
const MP = (id, lv) => SKILLS[id].mpower(lv) / 100;
const dagger = () => ({ atk: Math.round(SWORD.atk * DAGGER_ATK), wlv: SWORD.wlv, ...(SWORD.el ? { el: SWORD.el } : {}) });
// The Beastmaster's beasts from the hero's stats: main.js beastStats at a full share (Summon Lv 5, Beast Bond 10),
// kept in step with it by hand. Returns what the rules need to roll a beast's blow, and its pace
function beasts(p) {
  const st = (k) => p.total(k), base = p.baseLv, s = 1, m = s * 0.25, R = Math.round;
  const pow = st('pow'), end = st('end'), fns = st('fns'), qkn = st('qkn'), knl = st('knl'), ftn = st('ftn');
  const sharp = { mult: 1 + knl * 0.006 * s, cd: Math.max(0.6, 1 - knl * 0.003 * s) };
  const common = { crit: R(3 + ftn / 3 * s), mastery: 0, el: 'neutral', wlv: 2, beast: true }, hit = (fns + knl) * 0.5 * m, pace = 1 - qkn * 0.003 * m;
  return { sharp,
    bear: { ...common, batk: R(pow * s + end * 0.5 * s + base * 1.2), watk: R(30 + base * 1.2), fns: R(base * 0.8), hit: R(base + 25 + hit), interval: 1.6 * pace },
    wolf: { ...common, batk: R(pow * 0.8 * s + fns * 1.8 * s + base * 0.5), watk: R(20 + base), fns, hit: R(base + fns * 2.5 * s + hit), interval: 1.0 * pace },
    hawk: { ...common, batk: R(pow * 0.9 * s + qkn * 0.7 * s + base * 0.6), watk: R(15 + base * 0.8), fns: R(base * 0.8), hit: R(base + 30 + qkn * 0.6 * s + hit), interval: Math.max(0.35, 1.3 - qkn * 0.012 * s) * (1 - 0.15) },
  };
}
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
  phantom: () => hero('phantom', ['assassin'], DAGGERS, {}, { ...dagger(), dagger: true, left: dagger(), flee: 30 }), // (Improve Dodge 10)
  magicknight: () => hero('magicknight', ['swordman', 'mage'], KNIGHT, { ironhide: 10 }, { ...SWORD }),
  moonranger: () => hero('moonranger', ['mage', 'archer'], MOON, {}, { ...BOWG }),
  beastmaster: () => hero('beastmaster', ['swordman', 'archer'], PACK, { ironhide: 10 }, { ...BOWG, def: 20 + 30 }), // (Beast Bond 10: +10 DEF a beast out)
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
Object.assign(JOBS_SIM, {
  // The Phantom: a dagger in each hand (the left at Twin Blades 10's full share), Dual Rend, Thousand Cuts, Double
  // Attack on its normal blows, and two illusions out three quarters of the time (docs/balance.md), each with 60%
  // of its numbers and Lingering Shade's +30%
  phantom() {
    const d = dagger(), { ps } = hero('phantom', ['assassin'], DAGGERS, {}, { ...d, dagger: true, left: d, mastery: 9 + 40, hit: 0 });
    ps.crit += 5;
    const L = { ...ps, watk: d.atk, wlv: d.wlv }, sh = 0.6;
    const shade = { ...ps, left: null, batk: Math.round(ps.batk * sh), watk: Math.round(ps.watk * sh), mastery: Math.round(ps.mastery * sh) };
    let t = 0, hp = HP, cd = {}, shadeAcc = 0;
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t, dt = Math.max(ps.interval, 0.5);
      let dmg = 0;
      if (ready('rend')) { for (let i = 0; i < 3; i++) dmg += playerAttack(ps, BOSS, P('dualrend', 10), 1, true).dmg + playerAttack(L, BOSS, P('dualrend', 10), 1, true).dmg; cd.rend = t + 1; }
      else if (ready('cuts')) { for (let i = 0; i < 5; i++) dmg += playerAttack(ps, BOSS, P('thousandcuts', 10), 1, true).dmg; cd.cuts = t + 5; }
      else { dmg += playerAttack(ps, BOSS).dmg + playerAttack(L, BOSS, 1, 1, true).dmg; if (Math.random() < 0.5) dmg += playerAttack(ps, BOSS).dmg; } // (Double Attack 10)
      for (shadeAcc += dt; shadeAcc >= ps.interval * 1.1; shadeAcc -= ps.interval * 1.1) if (Math.random() < 0.75) dmg += 2 * playerAttack(shade, BOSS).dmg * 1.3;
      hp -= dmg; t += dt;
    }
    return t;
  },
  // The Magic Knight: its blade in the element the boss is weakest to (Elemental Blade), Elemental Edge and Nova (ATK
  // and MATK together), Spellblade on its normal blows. Its barrier (Stone Aegis) is not counted: it only helps
  magicknight() {
    const { ps } = hero('magicknight', ['swordman', 'mage'], KNIGHT, {}, { ...SWORD, mastery: 9 + 20, hit: 10 });
    const el = ['fire', 'water', 'wind', 'earth'].sort((a, b) => elementMod(b, BOSS.el) - elementMod(a, BOSS.el))[0];
    const cut = (a, m) => { const r = playerAttack({ ...ps, el }, BOSS, a, 1, true); return (r.miss ? 0 : r.dmg) + magicAttack(ps, BOSS, m, el).dmg; };
    let t = 0, hp = HP, cd = {};
    while (hp > 0 && t < 900) {
      const ready = (k) => (cd[k] || 0) <= t;
      let dmg = 0;
      if (ready('nova')) { for (let i = 0; i < 3; i++) dmg += cut(P('nova', 5), MP('nova', 5)); cd.nova = t + 4; }
      else if (ready('edge')) { dmg += cut(P('elemedge', 10), MP('elemedge', 10)) + cut(P('elemedge', 10), MP('elemedge', 10)); cd.edge = t + 0.5; }
      else { const r = playerAttack({ ...ps, el }, BOSS); dmg += (r.miss ? 0 : r.dmg) + magicAttack(ps, BOSS, 0.3, el).dmg; }
      hp -= dmg; t += Math.max(ps.interval, 0.5);
    }
    return t;
  },
  // The Moon Ranger: arrows of ATK and MATK together: Crescent Arrow, Starfall (every wave on a lone boss) and Lunar
  // Multishot (all its arrows at a lone target). By night Moonlit Hunter's +20%, and Moonveil's two more arrows half
  // the time. moonranger is by day; moonrangerNight is the same hero under the moon
  moonranger(night = false) {
    const { ps } = hero('moonranger', ['mage', 'archer'], MOON, {}, { ...BOWG, stats: { fns: 10 }, hit: 10 });
    const k = night ? 1.2 : 1, el = ps.el || 'neutral';
    const arrow = (a, m) => { const r = playerAttack(ps, BOSS, a * k * 1.1, 1, true); return (r.miss ? 0 : r.dmg) + magicAttack(ps, BOSS, m * k, el).dmg; };
    let t = 0, hp = HP, cd = {};
    while (hp > 0 && t < 900) {
      const ready = (k2) => (cd[k2] || 0) <= t;
      let dmg = 0;
      if (ready('crescent')) { dmg += arrow(P('crescent', 10), MP('crescent', 10)); cd.crescent = t + 3; }
      else if (ready('starfall')) { for (let i = 0; i < SKILLS.starfall.hits(10); i++) dmg += arrow(P('starfall', 10), MP('starfall', 10)); cd.starfall = t + 3; }
      else { const n = SKILLS.multishot.arrows(10) + (night && Math.random() < 0.5 ? 2 : 0); for (let i = 0; i < n; i++) dmg += arrow(P('multishot', 10), MP('multishot', 10)); }
      hp -= dmg; t += Math.max(ps.interval, 0.5);
    }
    return t;
  },
  moonrangerNight() { return JOBS_SIM.moonranger(true); },
  // The Beastmaster: its own Double Shots, and the pack (the Bear, two Wolves, the Hawk: beasts above) with their
  // instincts (Maul, Hamstring, Dive), the Bear's Roar (+10%, 6 s in 10), Pack Tactics (+30% for the Wolves on one
  // monster) and Pack Frenzy (15 s in 30: 30% faster and harder). The beasts' blows are Neutral, and an MVP's matchup
  // for beasts (takes.beast) is theirs alone
  beastmaster() {
    const { p, ps } = hero('beastmaster', ['swordman', 'archer'], PACK, {}, { ...BOWG, stats: { fns: 10 }, hit: 10 });
    const B = beasts(p), bite = (b, m = 1) => playerAttack(b, BOSS, m).dmg;
    const pack = [{ b: B.bear, n: 1, k: 1, inst: [12, 2.5] }, { b: B.wolf, n: 2, k: 1.3, inst: [10, 1.8], twice: 0.25 }, { b: B.hawk, n: 1, k: 1, inst: [9, 3] }].map((o) => ({ ...o, acc: 0, at: o.inst[0] * B.sharp.cd * 0.5 }));
    let t = 0, hp = HP;
    while (hp > 0 && t < 900) {
      const dt = Math.max(ps.interval, 0.5), frenzy = t % 30 < 15, roar = t % 10 < 6 ? 1.1 : 1, hard = (frenzy ? 1.3 : 1) * roar;
      let dmg = playerAttack(ps, BOSS, P('doubleshot', 10), 1, true).dmg * 2;
      for (const o of pack) {
        const step = o.b.interval * (frenzy ? 0.7 : 1);
        for (o.acc += dt; o.acc >= step; o.acc -= step) for (let i = 0; i < o.n; i++) dmg += bite(o.b) * o.k * hard * (1 + (o.twice || 0));
        if (t >= o.at) { o.at = t + o.inst[0] * B.sharp.cd; for (let i = 0; i < o.n; i++) dmg += bite(o.b, o.inst[1] * B.sharp.mult) * hard; }
      }
      hp -= dmg; t += dt;
    }
    return t;
  },
});
const median = (a) => a.sort((x, y) => x - y)[a.length >> 1];
// the median time a job takes to bring down HP of the boss set up (setup)
export const killTime = (job, runs = RUNS) => median(Array.from({ length: runs }, JOBS_SIM[job]));
if (import.meta.url === `file://${process.argv[1]}`) {
  const res = Object.fromEntries(Object.entries(JOBS_SIM).map(([k, f]) => [k, median(Array.from({ length: RUNS }, f))]));
  for (const [k, s] of Object.entries(res)) console.log(k.padEnd(12), `${s.toFixed(0).padStart(4)} s  ${(HP / s).toFixed(0).padStart(6)} a second`);
  console.log('\nShadowblade / BladeMaster', (res.blademaster / res.shadowblade).toFixed(2), '· Hunter / Windrunner', (res.windrunner / res.hunter).toFixed(2), '· Voodoo / Wizard', (res.wizard / res.voodoo).toFixed(2));
  // the four added in November 2026, against what docs/job-rules.md says of them (reported, not yet checked: R3)
  console.log('Phantom / BladeMaster', (res.blademaster / res.phantom).toFixed(2), '(the rule: 1.2-1.4) · Moon Ranger / Windrunner by day', (res.windrunner / res.moonranger).toFixed(2), '(1.05), by night', (res.windrunner / res.moonrangerNight).toFixed(2),
    '(1.2) · Magic Knight / BladeMaster', (res.blademaster / res.magicknight).toFixed(2), '(between the BladeMaster and the Wizard) · Beastmaster / Windrunner', (res.windrunner / res.beastmaster).toFixed(2), '(about the other bow jobs)');

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
