// Raid simulator: whole runs of a raid (src/raid.js) with the game's rules (src/rules.js), raid
// monsters (src/mobs.js raidDef) and the reference heroes of build-tools/sim.mjs. Every monster of a
// wave attacks at once (they are relentless), HP and SP carry over with natural regen, the breather
// after each wave and the full heal before the boss apply, and the boss stomps, makes its moves and
// calls its guards at 60%.
//
//   node build-tools/raid-sim.mjs        each difficulty, each job, with the supply it is made for,
//                                        half of it and none: win rate, time, potions used
//
// Each difficulty is checked against the hero it is made for (SUPPLY): Tutorial, Easy and Normal a
// first job, Hard and Hell a second job. A second-job hero is the first-job build after taking
// BladeMaster or Wizard, with that job's HP and SP (rules.js) and the job rules' 2-4x damage (x2.5 on
// Hard, early in the second job; x3 on Hell), and its area skills (Storm Gust, Blade Dance...) also
// hit up to 3 more of a wave for half. Left out: walking, kiting a wave, statuses.
import { hero } from './sim.mjs';
import { playerAttack, mobAttack, magicAttack, elementMod, derive } from '../src/rules.js';
import { raidDef, MOVES, GUARD } from '../src/mobs.js';
import { SKILLS, spCost, castTime } from '../src/skills.js';
import { RAIDS } from '../src/raid.js';

const RUNS = 120;
const HEAL = { potion2: 125, potion3: 205 }; // Orange, White
// the hero and the potions each difficulty is made for: [potion, how many, second-job damage x]
const SUPPLY = { tutorial: ['potion2', 0, 0], easy: ['potion2', 0, 0], normal: ['potion2', 20, 0], hard: ['potion3', 30, 2.5], hell: ['potion3', 50, 3] };
const BOLTS = { spark: 'fire', frost: 'water', arc: 'wind' };
const pow = (k, lv) => SKILLS[k].power(lv) * (SKILLS[k].hits?.(lv) || 1);

function hero2(kind, lv, k) {
  const h = hero(kind, lv), p = h.prog, g = { atk: 70, wlv: 2, def: 10, hit: 0, flee: 0, aspdRate: 1, mastery: 9 };
  const a = derive(p, g);
  p.takeSecond(kind === 'blader' ? 'blademaster' : 'wizard');
  p.jobLv = Math.max(1, Math.round((lv - 45) * 1.6));
  const b = derive(p, g);
  return { ...h, ps: { ...h.ps, maxHp: Math.round(h.ps.maxHp * b.maxHp / a.maxHp), maxSp: Math.round(h.ps.maxSp * b.maxSp / a.maxSp), interval: h.ps.interval * b.interval / a.interval, dmgK: k } };
}

// one run: { win, t, used }
export function run(raidId, diff, kind, heroLv, potion, pots, second) {
  const R = RAIDS[raidId], D = R.difficulties[diff];
  const h = second ? hero2(kind, heroLv, second) : hero(kind, heroLv), ps = h.ps;
  let hp = ps.maxHp, sp = ps.maxSp, t = 0, used = 0, blue = 0, next = 0, hpT = 0, spT = 0;
  const blueMax = kind === 'sorcerer' && pots ? 15 : 0; // a Sorcerer with potions also carries 15 Blue Potions
  const strike = (d) => {
    if (kind === 'sorcerer') {
      const sk = Object.keys(BOLTS).filter((k) => h.prog.skills[k]).sort((a, b) => pow(b, h.prog.skills[b]) * elementMod(BOLTS[b], d.el) - pow(a, h.prog.skills[a]) * elementMod(BOLTS[a], d.el))[0];
      const l = h.prog.skills[sk];
      if (l && sp >= spCost(sk, l)) { sp -= spCost(sk, l); return [magicAttack(ps, d, pow(sk, l) / 100, BOLTS[sk]).dmg, Math.max(ps.interval, castTime(sk, l) * ps.castRate * 0.85)]; }
      return [playerAttack(ps, d).dmg, ps.interval];
    }
    const l = h.prog.skills.heavy || 0;
    if (l && sp >= spCost('heavy', l)) { sp -= spCost('heavy', l); return [playerAttack(ps, d, SKILLS.heavy.power(l) / 100, 1 + 0.03 * l, true).dmg, ps.interval]; }
    return [playerAttack(ps, d).dmg, ps.interval];
  };
  const regen = (to) => { // the game's natural regen: HP every 6 s, SP every 8 s
    while (hpT + 6 <= to) { hpT += 6; hp = Math.min(ps.maxHp, hp + ps.hpRegen); }
    while (spT + 8 <= to) { spT += 8; sp = Math.min(ps.maxSp, sp + ps.spRegen + (h.prog.skills.manawell || 0)); }
  };
  const fight = (foes, boss) => {
    let stompAt = boss ? t + 7 : Infinity, called = false;
    const moves = boss ? boss.def.moves.map((m) => ({ ...m, at: t + MOVES[m.kind].cd })) : [];
    next = Math.max(next, t);
    for (const f of foes) f.next = t + 1 + Math.random() * 1.5; // they come bouncing in from the shore
    while (foes.some((f) => f.hp > 0)) {
      const live = foes.filter((f) => f.hp > 0);
      t = Math.min(next, stompAt, ...live.map((f) => f.next), ...moves.map((m) => m.at));
      if (t > R.secs) return false;
      regen(t);
      if (t === next) {
        if (hp < ps.maxHp * 0.45 && used < pots) { hp = Math.min(ps.maxHp, hp + HEAL[potion]); used++; next = t + 0.4; continue; }
        if (sp < 25 && blue < blueMax) { sp = Math.min(ps.maxSp, sp + 50); blue++; next = t + 0.4; continue; }
        const tgt = live.filter((f) => f !== boss)[0] || boss; // the small ones first
        let [dmg, wait] = strike(tgt.def);
        dmg *= ps.dmgK || 1;
        tgt.hp -= dmg;
        next = t + wait;
        if (ps.dmgK) for (const o of live.filter((f) => f !== tgt && f.hp > 0).slice(0, 3)) o.hp -= dmg * 0.5;
        if (kind === 'blader' && dmg > 0 && Math.random() < 1 / 3) sp = Math.min(ps.maxSp, sp + 3); // Battle Rhythm
        if (boss && !called && boss.hp < boss.def.hp * 0.6) { // the guards: like mobs.js guard()
          called = true;
          for (const g of boss.def.summon) {
            const r = raidDef(g, boss.def.raidLv - 3, boss.def.raidGuard), d = { ...r, hp: Math.round(r.hp * GUARD.hp), atk: r.atk.map((a) => Math.round(a * GUARD.atk)) };
            foes.push({ def: d, hp: d.hp, next: t + 1 });
          }
        }
        continue;
      }
      if (t === stompAt) { if (Math.random() > 0.5) hp -= mobAttack(boss.def, ps, boss.def.stomp).dmg; stompAt = t + 7; } // half the stomps are stepped out of
      for (const m of moves) if (m.at === t) { if (Math.random() > 0.5) hp -= mobAttack(boss.def, ps, m.mult).dmg; m.at = t + MOVES[m.kind].cd; }
      for (const f of live) if (f.next === t) { if (!(kind === 'sorcerer' && f === boss && Math.random() < 0.5)) hp -= mobAttack(f.def, ps).dmg; f.next = t + f.def.adelay / 1000; } // a Sorcerer kites the boss
      if (hp <= 0) return false;
    }
    return true;
  };
  for (const [i, w] of R.waves.entries()) {
    const foes = w.flatMap(([type, n, off]) => Array.from({ length: n }, () => { const d = raidDef(type, D.lv + off, D.wave); return { def: d, hp: d.hp }; }));
    if (!fight(foes)) return { win: false, t, used };
    t += R.rest;
    const k = i === R.waves.length - 1 && R.bossHeal ? 1 : R.breather;
    hp = Math.min(ps.maxHp, hp + ps.maxHp * k);
    sp = Math.min(ps.maxSp, sp + ps.maxSp * k);
  }
  const [type, off] = R.boss, bd = raidDef(type, D.lv + off, D.boss, D.wave), boss = { def: bd, hp: bd.hp };
  if (!fight([boss], boss)) return { win: false, t, used };
  return { win: true, t, used };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const [id, R] of Object.entries(RAIDS)) {
    console.log(`${R.name}: ${RUNS} runs each, the hero at the advised level\n`);
    console.log('| Difficulty | Hero | Blader | Sorcerer |\n|---|---|---|---|');
    for (const [diff, D] of Object.entries(R.difficulties)) {
      const [potion, n, second] = SUPPLY[diff];
      const cell = (kind) => (n ? [n, n >> 1, 0] : [0]).map((k) => {
        const rs = Array.from({ length: RUNS }, () => run(id, diff, kind, D.lv, potion, k, second)), wins = rs.filter((r) => r.win);
        const med = (f) => { const v = wins.map(f).sort((a, b) => a - b); return v[v.length >> 1]; };
        return `${k} pots: ${Math.round((wins.length / RUNS) * 100)}%${wins.length ? ` (${(med((r) => r.t) / 60).toFixed(1)} min${k ? `, ${med((r) => r.used)} used` : ''})` : ''}`;
      }).join(' · ');
      console.log(`| ${D.name} | Base ${D.lv}, ${second ? 'second job' : 'first job'}${n ? `, ${n} ${potion === 'potion2' ? 'Orange' : 'White'}` : ''} | ${cell('blader')} | ${cell('sorcerer')} |`);
    }
  }
}
