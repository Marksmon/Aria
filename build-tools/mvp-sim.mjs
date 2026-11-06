// The MVPs, the mini-bosses and the raids' Hell bosses against the second jobs (the owner's tiers, November
// 2026): an MVP falls to a hero of its tier's Base Level in the best gear short of MVP gear, a mini-boss to a
// Lv 75 hero in shop gear, a Hell boss to a hero of the raid's Hell level in the best non-MVP gear. "Falls"
// is for a middle matchup: the median of the six second jobs below (each MVP is easier for some, harder for
// others: its `takes`) wins in about 3 to 6 minutes on 100 White Potions or fewer.
//
// The hero's damage is its rotation from build-tools/second-sim.mjs against the boss itself (its DEF, MDEF,
// element and matchup), at the tier's Base and Job Level and gear. The fight, step by step: the boss's swings
// (a bow or a caster kites half of them away), its stomp and its moves (red circles: FLEE can't dodge them
// and they go through 75% of DEF; half are stepped out of, a meteor rain's falling stones three in four),
// enraged below half HP (MVP_RAGE), its guards at 80/50/25% and a minute after the last falls (a Kobold
// King's every 30 s, and his Tribe's Shield while one stands), its shadows, jars or jelly cores (90% less
// while one stands), and its own mechanic: Bark Armor (held off), the Sand Wyrm under the sand, the Sphinx's
// Riddle (answered right 85% of the time), Nidhogg's Gnaw (torn away if the hero hits hard enough), Poseidon's Oceanic
// Prison (caught half the time: broken by the hero's blows while it drowns them, or it crashes down) and Raging
// Maelstrom (time lost walking out against its pull, its heart's blows now and then). White
// Potions (205 HP) are drunk below half HP, as fast as a thumb taps them (four a second: the game has no potion cooldown); SP is not counted (Blue Potions).
//
//   node build-tools/mvp-sim.mjs            every fight, the six jobs and the median
//   node build-tools/mvp-sim.mjs --check    exit 1 if a fight leaves its tier (npm test runs it)
import { setup, killTime, HEROES } from './second-sim.mjs';
import { MOB_DEFS, MOVES, MVP_RAGE, MVP_MOVE, WYRM, RIDDLE, BARK, TREMOR, fierce, guardDef, raidDef } from '../src/mobs.js';
import { RAIDS } from '../src/raid.js';
import { mobAttack, derive } from '../src/rules.js';

// a fixed seed, so a check gives the same answer every time (the game's own rolls use Math.random too)
let seed = 20261105;
Math.random = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const JOBS = ['blademaster', 'shadowblade', 'windrunner', 'hunter', 'wizard', 'voodoo'];
const RANGED = new Set(['windrunner', 'hunter', 'wizard', 'voodoo']);
// gear: the weapons the rotations swing, and what the hero wears (DEF, Max HP %)
export const GEAR = {
  // the best short of MVP gear: a Lv 4 crafted weapon at +7 (the Giant Sword, the Heartwood Bow with Iron
  // Arrows, the Great Staff), armor pieces at their safe +4, monster and mini-boss cards
  good: { sword: { atk: 120 + 49, wlv: 4 }, bow: { atk: 120 + 49 + 10, wlv: 4, bow: true }, staff: { atk: 60, wlv: 4, matk: 55 }, def: 45, mhpRate: 20 },
  // what the shops sell: Gunnar's Iron Sword, Asa's Composite Bow and Iron Arrows, Orm's Rune Staff, no refining
  shop: { sword: { atk: 58, wlv: 2 }, bow: { atk: 55 + 10, wlv: 2, bow: true }, staff: { atk: 30, wlv: 2, matk: 25 }, def: 10, mhpRate: 0 },
};
// the second-job Job Level a hero of this Base Level usually has (a second job from about Base 55)
const jobLvAt = (base) => Math.min(50, Math.max(1, base - 40));
// Tremor (an MVP's, a Hell boss's): every cd s the hero steps out of the circle under them, losing STEP s of blows
// (less for a bow or a caster, who is on the move anyway), and one step in ten comes too late
const STEP = { melee: 0.4, ranged: 0.25 }, STEP_LATE = 0.08;
const POTION = 205, POTION_GAP = 0.25, DODGE = 0.5, METEOR_DODGE = 0.75, KITE = 0.5, RIGHT = 0.85, DT = 0.1, LIMIT = 900;

// the hero's damage a second on a target, by its rotation (cached per job, target and tier)
const dpsCache = new Map();
// (a Ghost takes nothing from a Neutral blow: the hero comes with an element, a battle oil on the blade, Wind Arrows)
function dps(job, def, base, gear) {
  const key = `${job}|${def.name}|${def.lv}|${def.hp}|${base}|${gear}`;
  if (!dpsCache.has(key)) {
    const g = GEAR[gear], hp = 200000, el = def.el === 'ghost' ? { el: 'wind' } : {};
    setup({ boss: { ...def, hp }, hp, base, jobLv: jobLvAt(base), sword: { ...g.sword, ...el }, bow: { ...g.bow, ...el }, staff: g.staff });
    dpsCache.set(key, hp / killTime(job, 9));
  }
  return dpsCache.get(key);
}
function survivor(job, base, gear) {
  const g = GEAR[gear];
  setup({ base, jobLv: jobLvAt(base), sword: g.sword, bow: g.bow, staff: g.staff });
  const { p } = HEROES[job]();
  return derive(p, { def: g.def, mhpRate: g.mhpRate, hit: 0, flee: 0, ...(RANGED.has(job) ? {} : {}) });
}

// one fight: { win, t, potions, left (the boss's HP share) }
export function fight(job, def, base, gear) {
  const ps = survivor(job, base, gear), out = dps(job, def, base, gear), ranged = RANGED.has(job);
  // an MVP with phases (Davy Jones): each move only in the phases that hold it; a phase may call others to it
  const phases = def.phases, phaseAt = (share) => { let k = 0; while (phases && k + 1 < phases.length && share <= phases[k + 1].below) k++; return k; };
  const inPhase = (m, k) => !phases || phases[k].moves.includes(m.name || m.kind);
  let phaseNow = 0;
  const moves = (def.moves || []).filter((m) => m.mult && MOVES[m.kind] && !(m.kind === 'maelstrom' && !phases)).map((m) => ({ ...m, at: MOVES[m.kind].cd * 0.5 }));
  const prison = (def.moves || []).find((m) => m.kind === 'prison'), whirl = (def.moves || []).find((m) => m.kind === 'maelstrom');
  let prisonAt = prison ? MOVES.prison.cd * 0.5 : Infinity, whirlAt = whirl ? MOVES.maelstrom.cd * 0.7 : Infinity;
  const mirror = (def.moves || []).find((m) => m.kind === 'mirror'), riddle = (def.moves || []).find((m) => m.kind === 'riddle');
  const gnaw = (def.moves || []).find((m) => m.kind === 'gnaw'), bark = (def.moves || []).some((m) => m.kind === 'bark');
  let hp = ps.maxHp, mob = def.hp, t = 0, potions = 0, potT = 0, swingAt = def.adelay / 1000, stompAt = 4;
  let guards = [], called = 0, goneT = -1e9, shadows = [], mirrorAt = mirror ? (MOVES.mirror.cd || 30) * 0.5 : Infinity, tribeAt = def.summonCd || Infinity;
  let barkUntil = -1, barkAt = bark ? MOVES.bark.cd : Infinity, exposedUntil = -1, exaltedUntil = -1, stunUntil = -1;
  let tremorAt = fierce(def) ? TREMOR.after + TREMOR.cd * 0.5 : Infinity, steppingUntil = -1;
  let riddleAt = riddle ? MOVES.riddle.cd * 0.6 : Infinity, gnawAt = gnaw ? MOVES.gnaw.cd : Infinity, gnawUntil = -1, gnawDealt = 0;
  const vsGuard = (g) => out * (dps(job, g, base, gear) / out); // (the hero's damage on a guard: its own DEF and element)
  const hit = (m, o = {}) => { const r = mobAttack(def, ps, m * (mob < def.hp * MVP_RAGE.below ? MVP_RAGE.atk : 1), o); hp -= r.dmg; };
  const call = (list, n = list.length) => { for (const g of list.slice(0, n)) { const d = guardDef(g); guards.push({ def: d, hp: d.hp, at: t + d.adelay / 1000 }); } };
  while (t < LIMIT) {
    t += DT;
    const rage = mob < def.hp * MVP_RAGE.below, cdk = rage ? MVP_RAGE.cd : 1;
    if (phases) { const k = phaseAt(mob / def.hp); if (k > phaseNow) { phaseNow = k; if (phases[k].summon) call(phases[k].summon); } }
    // the boss's own mechanic
    const under = def.wyrm && (t % (rage ? WYRM.upRage + WYRM.underRage : WYRM.up + WYRM.under)) >= (rage ? WYRM.upRage : WYRM.up);
    if (bark && t >= barkAt) { barkUntil = t + MOVES.bark.dur; barkAt = t + MOVES.bark.cd * cdk; }
    if (mirror && t >= mirrorAt && mob < def.hp * (MOVES.mirror.below || 0.9) && !shadows.length) {
      const d = MOB_DEFS[mirror.decoy || 'kingShadow'];
      for (let i = 0; i < (mirror.n || 2); i++) shadows.push({ def: d, hp: d.hp, at: t + d.adelay / 1000 });
      mirrorAt = t + (MOVES.mirror.cd || 30) * cdk;
    }
    if (riddle && t >= riddleAt) { // asked; the hero stands in an answer's circle (half its blows land meanwhile)
      riddleAt = t + MOVES.riddle.cd * cdk;
      const ask = rage ? MOVES.riddle.askRage : MOVES.riddle.ask;
      if (Math.random() < RIGHT) { stunUntil = t + ask + RIDDLE.stun; exposedUntil = t + ask + RIDDLE.exposeFor; }
      else { exaltedUntil = t + ask + RIDDLE.exaltFor; hit(riddle.mult || 3, MVP_MOVE); }
      exaltedUntil = Math.max(exaltedUntil, t + ask / 2); // (the asking: the hero is busy reading)
    }
    // Poseidon's Oceanic Prison: caught half the time; the cage takes the hero's blows (it shields him), drowns the
    // hero every second, and crashes down if it still stands when its time is up
    if (prison && t >= prisonAt) {
      prisonAt = t + MOVES.prison.cd * cdk;
      if (t >= stunUntil && Math.random() > DODGE) { const d = MOB_DEFS.tidePrison; shadows.push({ def: d, hp: d.hp, at: Infinity, cage: { at: t + 1, until: t + MOVES.prison.hold * (rage ? 0.8 : 1) } }); }
    }
    for (const o of shadows) if (o.cage && o.hp > 0) {
      if (t >= o.cage.at) { o.cage.at = t + MOVES.prison.tick; hit(prison.drown, MVP_MOVE); }
      if (t >= o.cage.until) { o.hp = 0; hit(prison.crash, MVP_MOVE); }
    }
    if (shadows.some((o) => o.hp <= 0)) shadows = shadows.filter((o) => o.hp > 0);
    // Raging Maelstrom: the hero walks out against its pull (losing blows), caught in its heart now and then
    if (whirl && t >= whirlAt) {
      whirlAt = t + MOVES.maelstrom.cd * cdk;
      if (t >= stunUntil) { steppingUntil = Math.max(steppingUntil, t + (ranged ? 0.8 : 1.4)); for (let i = 0; i < 3; i++) if (Math.random() > DODGE) hit(whirl.mult, MVP_MOVE); }
    }
    if (gnaw && t >= gnawAt && mob < def.hp * MOVES.gnaw.below) { gnawUntil = t + MOVES.gnaw.dur; gnawAt = t + MOVES.gnaw.cd * cdk; gnawDealt = 0; }
    // Gnaw (as mobs.js): torn away the moment enough damage lands (stunned, then exposed), else gorged at its end;
    // while it gnaws it heals, and the rot strikes the hero every second (its mult)
    if (gnawUntil > 0 && gnawDealt >= def.hp * MOVES.gnaw.tear) { stunUntil = t + MOVES.gnaw.stun; exposedUntil = t + MOVES.gnaw.exposeFor; gnawUntil = -1; }
    else if (gnawUntil > 0 && t >= gnawUntil) { mob = Math.min(def.hp, mob + def.hp * MOVES.gnaw.gorge); gnawUntil = -1; }
    if (gnawUntil > 0) { mob = Math.min(def.hp, mob + def.hp * MOVES.gnaw.heal * DT); if (Math.round(t * 10) % 10 === 0) hit(gnaw.mult, MVP_MOVE); }
    // guards: at 80/50/25% and a minute after the last falls; a Kobold King calls his back every 30 s
    const share = mob / def.hp;
    if (def.summon && called < 3 && share < [0.8, 0.5, 0.25][called]) { called++; call(def.summon); }
    else if (def.summon && called && !guards.length && t - goneT > 60 && t > 1) { call(def.summon); goneT = t; }
    if (def.tribe && def.summon && t >= tribeAt) { tribeAt = t + def.summonCd * cdk; if (guards.length < def.summon.length) call(def.summon, def.summon.length - guards.length); }
    // the hero strikes: shadows and jars first (the boss is shielded), then guards, then the boss
    const target = gnawUntil > 0 ? null : shadows.find((o) => o.hp > 0) || guards.find((o) => o.hp > 0); // (Gnaw: tear it away first)
    if (t >= tremorAt) {
      tremorAt = t + TREMOR.cd * (rage ? 0.75 : 1);
      if (t >= stunUntil && gnawUntil < 0 && !under) { steppingUntil = t + STEP[ranged ? 'ranged' : 'melee']; if (Math.random() < STEP_LATE) hit(TREMOR.mult, MVP_MOVE); }
    }
    let blow = t < steppingUntil ? 0 : out * DT;
    if (target) { target.hp -= vsGuard(target.def) * DT; if (target.hp <= 0) { shadows = shadows.filter((o) => o.hp > 0); guards = guards.filter((o) => o.hp > 0); if (!guards.length) goneT = t; } }
    else if (!under && !(t < barkUntil)) {
      blow *= (t < exposedUntil ? RIDDLE.exposed : 1) * (t < exaltedUntil ? RIDDLE.exalted : 1) * (def.tribe && guards.length ? 1 - def.tribe : 1);
      mob -= blow; if (gnawUntil > 0) gnawDealt += blow;
      if (mob <= 0) return { win: true, t, potions, left: 0 };
    }
    // the boss's blows
    if (t >= swingAt) { swingAt = t + def.adelay / 1000 * (rage ? MVP_RAGE.adelay : 1); if (!under && t >= stunUntil && gnawUntil < 0 && !(ranged && Math.random() < KITE)) hit(1); }
    if (t >= stompAt) { stompAt = t + (rage ? MVP_RAGE.stomp : 7); if (t >= stunUntil && gnawUntil < 0 && Math.random() > DODGE) hit(def.stomp || 1.5, MVP_MOVE); }
    for (const m of moves) if (t >= m.at && inPhase(m, phaseNow)) {
      m.at = t + (m.cd ?? MOVES[m.kind].cd) * cdk;
      if (t < stunUntil || gnawUntil > 0) continue;
      const n = m.kind === 'meteors' ? (rage ? 7 : 5) : 1, miss = m.kind === 'meteors' ? METEOR_DODGE : DODGE;
      for (let i = 0; i < n; i++) if (Math.random() > miss) hit(m.mult, MVP_MOVE);
    }
    for (const o of [...guards, ...shadows]) if (o.hp > 0 && t >= o.at) { o.at = t + o.def.adelay / 1000; if (!(ranged && Math.random() < KITE)) hp -= mobAttack(o.def, ps).dmg; }
    // a White Potion below half HP
    if (hp < ps.maxHp * 0.5 && t >= potT) { hp = Math.min(ps.maxHp, hp + POTION); potions++; potT = t + POTION_GAP; }
    if (hp <= 0) return { win: false, t, potions, left: mob / def.hp };
  }
  return { win: false, t, potions, left: mob / def.hp };
}

// the owner's tiers: each MVP's Base Level, in the best non-MVP gear; the mini-bosses at Base 75 in shop gear;
// each raid's Hell boss at its Hell level in the best non-MVP gear
export const TIERS = {
  koboldKing: 75, goblinKing: 75,
  jarl: 85, ancientTreant: 85, sandWyrm: 85,
  eternalSphinx: 95, nidhogg: 95, poseidon: 95,
  davyJones: 99, // (Lv 110: the hardest of them, the owner's call)
};
export const MINI_LV = 75;
// the main story's own boss (the Fire Giant in the Crater of Binding, Chapter 20): for a second job at the story's end,
// in the gear a story hero has (shop gear), not the best
export const STORY = { jarlBound: 90 };
export const BAR = { minT: 150, maxT: 400, potions: 100 }; // the median job: a fight of minutes, on a bag of White Potions
const hellBoss = (id) => {
  const R = RAIDS[id], D = R.difficulties.hell;
  return { name: `${MOB_DEFS[R.boss[0]].name} (Hell)`, def: raidDef(R.boss[0], D.lv + R.boss[1], { ...D.boss, fierce: true }), base: D.lv, gear: 'good' };
};
export function fights() {
  const list = [];
  for (const [type, base] of Object.entries(TIERS)) list.push({ name: MOB_DEFS[type].name, def: MOB_DEFS[type], base, gear: 'good' });
  for (const [type, d] of Object.entries(MOB_DEFS)) if (d.boss && !d.mvp && !d.raid && !d.raidLv && !d.storyBoss) list.push({ name: d.name, def: d, base: MINI_LV, gear: 'shop' });
  for (const [type, base] of Object.entries(STORY)) list.push({ name: `${MOB_DEFS[type].name} (the story's)`, def: MOB_DEFS[type], base, gear: 'shop' });
  for (const id of Object.keys(RAIDS)) list.push(hellBoss(id));
  return list;
}
// a fight's runs for every job, and the median job's
export function judge(f, runs = 30) {
  seed = [...f.name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 20261105); // (each fight its own rolls: one fight's change never moves another's)
  const per = Object.fromEntries(JOBS.map((job) => {
    const rs = Array.from({ length: runs }, () => fight(job, f.def, f.base, f.gear));
    const med = (k) => rs.map((r) => r[k]).sort((a, b) => a - b)[runs >> 1];
    return [job, { wins: rs.filter((r) => r.win).length / runs, t: med('t'), potions: med('potions'), left: med('left') }];
  }));
  // the middle matchup: the median of the six jobs, measure by measure (wins, time, potions)
  const median = (k) => { const v = Object.values(per).map((r) => r[k]).sort((x, y) => x - y); return (v[2] + v[3]) / 2; };
  const mid = { wins: median('wins'), t: median('t'), potions: median('potions'), left: median('left') };
  return { per, mid };
}
const ok = (m) => m.wins >= 0.8 && m.t >= BAR.minT && m.t <= BAR.maxT && m.potions <= BAR.potions;

if (import.meta.url === `file://${process.argv[1]}`) {
  const off = [];
  const fmt = (r) => `${Math.round(r.wins * 100)}% ${Math.round(r.t)}s ${Math.round(r.potions)}p`;
  console.log(`| Fight | Base, gear | ${JOBS.join(' | ')} | middle |`);
  console.log(`|---|---|${JOBS.map(() => '---').join('|')}|---|`);
  for (const f of fights()) {
    const { per, mid } = judge(f);
    if (!ok(mid)) off.push(`${f.name}: ${fmt(mid)}`);
    console.log(`| ${f.name} | ${f.base}, ${f.gear} | ${JOBS.map((j) => fmt(per[j])).join(' | ')} | **${fmt(mid)}** |`);
  }
  if (process.argv.includes('--check')) {
    if (off.length) { console.log(`OUT OF TIER:\n  ${off.join('\n  ')}`); process.exit(1); }
    console.log('every boss in its tier');
  }
}
