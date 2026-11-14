// The economy at each level (November 2026): does a hero earn more in its own field than the fight costs? For every
// monster that lives on a map, a same-level first job (build-tools/sim.mjs's reference heroes, the same fights the
// balance tests run) fights it; what it drops sells at the shops' price, and the HP the fight cost is bought back
// with the potion a hero of that level carries. The owner's rule (CLAUDE.md): what monsters drop, sold in the shops,
// is the hero's main income; this is the table that says whether it holds.
//
//   node build-tools/econ-sim.mjs            every monster: the fight, what a kill pays, what it costs, perz an hour
//   node build-tools/econ-sim.mjs --check    exit 1 if a monster pays far less than those beside it
//
// Income is the steady part of the drops: a card or a rare piece of gear (worth 2,000 perz or more, under one kill
// in twenty) is a windfall, shown beside it and never counted on. HP comes back by itself while the hero fights
// (hpRegen every 6 s); what a fight costs beyond that is made good one of two ways, and both are shown:
//   potions: drunk back at once (perz), so the hero never stops;
//   rest:    sat out for free (hpRegen + 5% of Max HP every 3 s, main.js naturalRegen), which costs time.
// Between kills the hero walks WALK seconds to the next monster. From Base 55 a hero is a second job: its fights are
// taken a third as long, for a third of the HP (second jobs hit 2-4x their first job, docs/job-rules.md).
import { load, close } from '../test/load.mjs';
import { MOB_DEFS } from '../src/mobs.js'; // (a monster's drops already hold the refining stones every monster may drop: ORE_DROPS)
import { SPAWNS } from '../src/spawns.js';
import { sim } from './sim.mjs';
import { potionHeal } from '../src/rules.js';

const { ITEMS, PRICES, sellPrice } = await load('items');
await close();

const WALK = 4; // seconds from one kill to the next monster
const KINDS = ['blader', 'sorcerer', 'archer', 'assassin'];
// the potion a hero of a level drinks: Red to Base 19, Orange to 49, White from 50 (what the shops near its fields sell)
export const potionAt = (lv) => (lv < 20 ? 'potion' : lv < 50 ? 'potion2' : 'potion3');
const healOf = (id) => (ITEMS[id].use.hp[0] + ITEMS[id].use.hp[1]) / 2;
const lives = (type) => Object.values(SPAWNS).some((l) => l.some((s) => s[0] === type));

// what a kill is worth sold: { steady, windfall } in perz
export function income(d) {
  let steady = 0, windfall = 0;
  for (const [id, a, b, p] of d.drops || []) { const v = sellPrice(id) * (a + b) / 2 * p; if (PRICES[id] >= 2000 && p < 0.05) windfall += v; else steady += v; }
  return { steady, windfall };
}
// one monster against a same-level hero of a kind
export const SECOND_AT = 55, SECOND = 3;
export function row(type, kind = 'blader') {
  const d = MOB_DEFS[type], r = sim(kind, d.lv, type), pot = potionAt(d.lv), inc = income(d), ps = r.h.ps, k = d.lv >= SECOND_AT ? SECOND : 1;
  const t = r.t / k, lost = (1 - r.hpLeft) * ps.maxHp / k;
  const deficit = Math.max(0, lost - ps.hpRegen * t / 6);
  const cost = deficit / potionHeal(healOf(pot), ps.end) * PRICES[pot], rest = deficit / ((ps.hpRegen + Math.ceil(ps.maxHp * 0.05)) / 3);
  return { type, name: d.name, lv: d.lv, kind, wins: r.wins, t, lost, share: lost / ps.maxHp, pot, cost, rest, ...inc,
    drink: (inc.steady - cost) * 3600 / (t + WALK), sit: inc.steady * 3600 / (t + WALK + rest), potions: inc.steady / PRICES[pot] };
}
export const monsters = () => Object.entries(MOB_DEFS).filter(([t, d]) => lives(t) && !d.mvp && !d.boss && !d.fierce && !d.noRespawn && !d.decoy && d.drops?.length)
  .sort((a, b) => a[1].lv - b[1].lv).map(([t]) => t);
// a monster's pay beside the monsters within 6 levels of it (its own left out): under FAR of their middle is an outlier
export const FAR = 0.6;
export function outliers(rows) {
  return rows.filter((r) => {
    const near = rows.filter((o) => o !== r && Math.abs(o.lv - r.lv) <= 6).map((o) => o.steady).sort((a, b) => a - b);
    return near.length >= 3 && r.steady < near[near.length >> 1] * FAR;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = (n) => Math.round(n).toLocaleString();
  console.log('| Monster | Lv | Blader: fight | HP lost | A kill pays | (windfall) | Potions to mend it | Perz an hour, drinking | Perz an hour, resting | Best job, resting |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  const rows = [], losing = [];
  for (const type of monsters()) {
    const all = KINDS.map((k) => row(type, k)), r = all[0], best = all.filter((o) => o.wins >= 0.85).sort((a, b) => b.sit - a.sit)[0] || r;
    rows.push(r);
    if (r.drink < 0) losing.push(r);
    console.log(`| ${r.name} | ${r.lv} | ${r.t.toFixed(0)} s | ${f(r.lost)} (${Math.round(r.share * 100)}%) | ${f(r.steady)} | ${f(r.windfall)} | ${f(r.cost)} perz of ${ITEMS[r.pot].name.split(' ')[0]} | ${f(r.drink)} | ${f(r.sit)} | ${best.kind} ${f(best.sit)} |`);
  }
  const out = outliers(rows);
  console.log(`\n${losing.length} of ${rows.length} monsters cost a Blader more in potions than they pay (drinking back every HP lost): ${losing.map((r) => r.name).join(', ') || 'none'}`);
  console.log(`Paying under ${FAR * 100}% of the monsters near its level: ${out.map((r) => `${r.name} (${f(r.steady)})`).join(', ') || 'none'}`);
  if (process.argv.includes('--check')) {
    if (out.length) process.exit(1);
    console.log('no monster pays far less than those beside it');
  }
}
