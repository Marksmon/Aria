// Fight simulator: a "reference hero" (sensible stats, shop gear, a sensible skill build) against
// every monster and boss, with the game's own rules (src/rules.js), monster data (src/mobs.js) and
// skills (src/skills.js). Each fight runs many times; the table shows the median.
//
//   node build-tools/sim.mjs            the balance table (docs/balance.md is made from it)
//   node build-tools/sim.mjs matron 28  one monster at one Base Level, both jobs, in detail
//
// The hero stands and fights: a skill whenever there is SP for it, a normal attack otherwise, a
// potion below 45% HP. Bosses stomp (every 7 s, 1.5x ATK) and call their two guards at 60%, who
// also fight; a careful player steps out of half the stomps (STOMP_DODGE), and a Sorcerer kites a
// boss (KITE). Things the sim leaves
// out: walking, kiting, flinching, regen during the fight.
import { derive, playerAttack, mobAttack, magicAttack, elementMod } from '../src/rules.js';
import { MOB_DEFS, guardDef, MOVES } from '../src/mobs.js';
import { Progress } from '../src/progress.js';
import { SKILLS, spCost, castTime } from '../src/skills.js';

const RUNS = 200, LIMIT = 600, STOMP_DODGE = 0.5, KITE = 0.5; // KITE: a Sorcerer steps back between casts and dodges half of a boss's swings
const POTIONS = { potion: 55, potion2: 125, potion3: 205 }; // average HP of Red, Orange, White
// the shop gear the reference hero can afford at a Base Level (numbers from src/items.js)
const GEAR = {
  blader: (lv) => lv < 20
    ? { atk: 25, wlv: 1, def: 2 + 1, el: 'neutral' } // Stone Sword (taken as neutral: a player swaps for Earth foes), Leaf Tunic, Leaf Cap
    : lv < 35 ? { atk: 58 + 15, wlv: 2, def: 5 + 2 + 1 + 1 } // +5 Iron Sword, Chain Mail, Round Shield, Wool Cape, Leather Boots
    : { atk: 58 + 18, wlv: 2, def: 5 + 2 + 1 + 1 + 8 }, // the same, the sword at +6 and two pieces at the safe +4 (Armor Ore from kobolds)
  sorcerer: (lv) => lv < 20
    ? { atk: 15, wlv: 1, matk: 15, def: 2, msp: 0 } // Wooden Staff, Leaf Tunic
    : lv < 35 ? { atk: 30, wlv: 2, matk: 25, stats: { knl: 2 }, def: 2 + 1 + 1, msp: 30 } // Rune Staff, Robe, Wool Cape, Leather Boots
    : { atk: 30, wlv: 2, matk: 25, stats: { knl: 2 }, def: 2 + 1 + 1 + 8, msp: 30 }, // the same, two pieces at the safe +4
};
// how stat points are split, and what the skill points buy, in order
const BUILD = {
  blader: { job: 'swordman', stats: { pow: 0.45, end: 0.25, fns: 0.15, qkn: 0.15 }, skills: [['cleave', 3], ['heavy', 10], ['discipline', 10], ['ironhide', 10], ['warcry', 3], ['standfirm', 5]] },
  sorcerer: { job: 'mage', stats: { knl: 0.5, fns: 0.25, end: 0.2, qkn: 0.05 }, skills: [['spark', 5], ['arc', 5], ['spark', 10], ['manawell', 5], ['frost', 5], ['flamering', 5], ['ward', 3]] },
};
// the first-job Job Level a hero of this Base Level usually has
const jobLvAt = (base) => Math.max(1, Math.min(50, Math.round((base - 10) * 1.1)));

export function hero(kind, base) {
  const b = BUILD[kind], p = new Progress();
  while (p.baseLv < base) p.gain(p.baseNeed, 0);
  p.skills.basics = 9;
  p.takeFirst(b.job);
  p.jobLv = jobLvAt(base);
  let pts = p.jobLv - 1;
  for (const [id, n] of b.skills) { const k = Math.min(n - (p.skills[id] || 0), pts); if (k > 0) { p.skills[id] = (p.skills[id] || 0) + k; pts -= k; } }
  // stats: raise whichever is furthest below its share until no point is left
  const sum = () => Object.keys(b.stats).reduce((a, k) => a + p.stats[k], 0);
  for (let guard = 0; guard < 2000; guard++) {
    const k = Object.keys(b.stats).sort((x, y) => p.stats[x] / sum() / b.stats[x] - p.stats[y] / sum() / b.stats[y])[0];
    if (!p.raise(k)) { // the cheapest other stat, then stop
      if (!Object.keys(b.stats).some((o) => p.raise(o))) break;
    }
  }
  const gear = { hit: 0, flee: 0, aspdRate: 1, ...GEAR[kind](base) };
  const hide = p.skills.ironhide || 0;
  gear.mastery = 9 + (kind === 'blader' ? 2 * (p.skills.discipline || 0) : 0);
  gear.def += hide;
  const ps = derive(p, gear);
  ps.maxHp = Math.floor(ps.maxHp * (1 + hide / 100));
  ps.maxSp = Math.floor(ps.maxSp * (1 + (p.skills.manawell || 0) / 50));
  return { kind, base, prog: p, ps };
}

// a Sorcerer's bolts: power % by level, and their element. The sim casts whichever learnt one hits
// this monster hardest
// power x hits: Frost Shard rains several small shards
const BOLTS = Object.fromEntries([['spark', 'fire'], ['frost', 'water'], ['arc', 'wind']].map(([k, el]) => [k, [(lv) => SKILLS[k].power(lv) * (SKILLS[k].hits?.(lv) || 1), el]]));
const bestBolt = (prog, def) => Object.keys(BOLTS).filter((k) => prog.skills[k])
  .sort((a, b) => BOLTS[b][0](prog.skills[b]) * elementMod(BOLTS[b][1], def.el) - BOLTS[a][0](prog.skills[a]) * elementMod(BOLTS[a][1], def.el))[0];

// one fight. Returns { win, t, potions, hpLeft }. With guards up, the hero cuts them down first
// (GUARDS_FIRST), as a player should; the boss calls them again 2 minutes after the last one falls
function fight(h, def, opts = {}) {
  const ps = h.ps, potHp = POTIONS[opts.potion || 'potion2'], potMax = opts.potions ?? 0;
  let blue = 0; const blueMax = h.kind === 'sorcerer' ? (opts.blue ?? (opts.potions ? 15 : 0)) : 0; // Blue Potions for SP
  let hp = ps.maxHp, sp = ps.maxSp, mob = def.hp, t = 0, potions = 0, next = 0, mobNext = def.adelay / 1000, stompAt = def.boss || def.mvp ? 7 : Infinity;
  // a boss's moves reach 3 to 9 paces: they find a Sorcerer kiting it, not a Blader at its side
  const moves = h.kind === 'sorcerer' ? (def.moves || []).filter((m) => MOVES[m.kind]?.min).map((m) => ({ ...m, at: MOVES[m.kind].cd })) : [];
  const guards = []; let called = false, goneT = -1e9, hits = 0;
  const strike = (d) => {
    const sk = h.kind === 'blader' ? 'heavy' : bestBolt(h.prog, d) || 'spark', lv = h.prog.skills[sk] || 0;
    if (h.kind === 'sorcerer') {
      const cast = castTime(sk, lv) * ps.castRate * 0.85; // Swift Chant
      if (lv && sp >= spCost(sk, lv)) { sp -= spCost(sk, lv); return [magicAttack(ps, d, BOLTS[sk][0](lv) / 100, BOLTS[sk][1]).dmg, Math.max(ps.interval, cast)]; }
      return [playerAttack(ps, d).dmg, ps.interval];
    }
    if (lv && sp >= spCost(sk, lv)) { sp -= spCost(sk, lv); return [playerAttack(ps, d, SKILLS.heavy.power(lv) / 100, 1 + 0.03 * lv, true).dmg, ps.interval]; }
    return [playerAttack(ps, d).dmg, ps.interval];
  };
  const call = () => { called = true; for (const g of def.summon.slice(0, 2)) guards.push({ def: guardDef(g), hp: guardDef(g).hp, next: t + 1 }); };
  // spells reach 5 paces: a Sorcerer lands one before a monster closes in
  if (h.kind === 'sorcerer') { const [dmg] = strike(def); mob -= dmg; mobNext += 1.2; }
  while (t < LIMIT) {
    t = Math.min(next, mobNext, stompAt);
    if (t === next) { // the hero acts
      if (hp < ps.maxHp * 0.45 && potions < potMax) { hp = Math.min(ps.maxHp, hp + potHp); potions++; next = t + 0.4; continue; }
      if (sp < 25 && blue < blueMax) { sp = Math.min(ps.maxSp, sp + 50); blue++; next = t + 0.4; continue; }
      const g = opts.guardsFirst !== false && guards.find((o) => o.hp > 0);
      const [dmg, wait] = strike(g ? g.def : def);
      next = t + wait;
      if (g) { g.hp -= dmg; if (!guards.some((o) => o.hp > 0)) { goneT = t; guards.length = 0; } continue; }
      mob -= dmg;
      if (h.kind === 'blader' && h.prog.jobLv >= 10 && dmg > 0 && ++hits % 3 === 0) sp = Math.min(ps.maxSp, sp + 3); // Battle Rhythm
      if (mob <= 0) return { win: true, t, potions, hpLeft: hp / ps.maxHp };
      if (def.summon && mob < def.hp * 0.6 && !guards.length && (!called || t - goneT >= 120)) call();
    } else if (t === mobNext) {
      if (!(h.kind === 'sorcerer' && (def.boss || def.mvp) && Math.random() < KITE)) hp -= mobAttack(def, ps).dmg;
      mobNext = t + def.adelay / 1000;
    } else {
      if (Math.random() > STOMP_DODGE) hp -= mobAttack(def, ps, def.stomp || 1.5).dmg;
      stompAt = t + 7;
    }
    for (const g of guards) while (g.hp > 0 && g.next <= t) { hp -= mobAttack(g.def, ps).dmg; g.next += g.def.adelay / 1000; }
    for (const m of moves) while (m.at <= t) { if (Math.random() > STOMP_DODGE) hp -= mobAttack(def, ps, m.mult || 1.5).dmg; m.at += MOVES[m.kind].cd; } // the red circle: half are stepped out of
    if (hp <= 0) return { win: false, t, potions, hpLeft: 0, mobLeft: mob / def.hp };
  }
  return { win: false, t, potions, hpLeft: hp / ps.maxHp, mobLeft: mob / def.hp };
}
// (a Sorcerer with potions also carries 15 Blue Potions, and drinks one whenever SP runs low)

export function sim(kind, base, type, opts) {
  const h = hero(kind, base), def = MOB_DEFS[type], rs = [];
  for (let i = 0; i < RUNS; i++) rs.push(fight(h, def, opts));
  const med = (f) => { const v = rs.map(f).sort((a, b) => a - b); return v[v.length >> 1]; };
  return { h, wins: rs.filter((r) => r.win).length / RUNS, t: med((r) => r.t), potions: med((r) => r.potions), hpLeft: med((r) => r.hpLeft), mobLeft: med((r) => r.mobLeft || 0) };
}

const fmt = (r) => `${Math.round(r.wins * 100)}% win · ${r.t.toFixed(0)} s · ${r.wins ? `${Math.round(r.hpLeft * 100)}% HP left` : `boss at ${Math.round(r.mobLeft * 100)}%`}${r.potions ? ` · ${r.potions} pots` : ''}`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const [type, lvArg] = process.argv.slice(2);
  if (type) {
    const lv = +lvArg || MOB_DEFS[type].lv;
    for (const kind of ['blader', 'sorcerer']) {
      const { ps } = hero(kind, lv);
      console.log(`${kind} Base ${lv}: HP ${ps.maxHp} SP ${ps.maxSp} hit ${ps.hit} flee ${ps.flee} interval ${ps.interval.toFixed(2)} s`);
      console.log('  no potions:      ', fmt(sim(kind, lv, type)));
      console.log('  20 Orange Potions:', fmt(sim(kind, lv, type, { potions: 20 })));
    }
  } else {
    console.log('| Monster | Lv | Blader at its level | Sorcerer at its level |\n|---|---|---|---|');
    for (const [t, d] of Object.entries(MOB_DEFS).sort((a, b) => a[1].lv - b[1].lv)) {
      if (d.mvp || d.night || t === 'slimelet') continue;
      const opts = d.boss ? { potions: 20 } : {};
      console.log(`| ${d.name} | ${d.lv} | ${fmt(sim('blader', d.lv, t, opts))} | ${fmt(sim('sorcerer', d.lv, t, opts))} |`);
    }
  }
}
