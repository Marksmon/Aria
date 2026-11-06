// The README's item tables, written from the game's own data so they never drift from it: the usables,
// the gear monsters drop, and every card. Each table sits in README.md between its markers
// (<!-- tables:NAME --> ... <!-- /tables:NAME -->); the prose round them is written by hand.
//
//   node build-tools/readme-tables.mjs           rewrite the tables in README.md
//   node build-tools/readme-tables.mjs --check   exit 1 if a table is out of date (npm test runs it)
import fs from 'node:fs';
import { load, close } from '../test/load.mjs';

const README = new URL('../README.md', import.meta.url);
const { ITEMS, RECIPES, SHOPS, SLOTS, cardLine, equipLine, recipeKind } = await load('items');
const { MOB_DEFS } = await import('../src/mobs.js');
await close();

const SHOPKEEPERS = { hild: 'Hild (Steinborg)', kari: 'Kari (Galdrheim)', eydis: 'Eydis (Veidheim)', dalla: 'Dalla (Rytingborg)', gunnar: 'Gunnar (Steinborg)', orm: 'Orm (Galdrheim)', asa: 'Asa (Veidheim)', steinar: 'Steinar (Rytingborg)', yrsa: 'Yrsa (Rytingborg)', holger: 'Holger (Steinborg)' };
const CRAFTERS = { use: 'Ragna brews it', gear: 'Gunnar forges it', magic: 'Orm makes it', hunt: 'Leif makes it', bow: 'Asa makes it', dagger: 'Yrsa makes it' };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const cell = (s) => String(s).replace(/\|/g, '/');
// the monsters that drop a piece, with their chance, weakest first
const droppers = (id) => Object.values(MOB_DEFS).filter((d) => !d.decoy)
  .flatMap((d) => [...(d.drops || []), ...(d.mvpDrops || []).map(([i]) => [i, 1, 1, 1])].filter(([i]) => i === id).map(([, , , c]) => ({ d, c })))
  .sort((a, b) => a.d.lv - b.d.lv);
const from = (id) => ITEMS[id].from || droppers(id).map(({ d, c }) => `${d.name} ${+(c * 100).toFixed(2)}%`).join(', ');
const firstLv = (id) => droppers(id)[0]?.d.lv ?? 999;

function usables() {
  const rows = Object.entries(ITEMS).filter(([, it]) => it.type === 'use').map(([id, it]) => {
    const u = it.use || {}, fx = [];
    if (u.full) fx.push('all HP and SP');
    if (u.hp) fx.push(`${u.hp[0]}–${u.hp[1]} HP`);
    if (u.sp) fx.push(`${u.sp[0]}–${u.sp[1]} SP`);
    if (u.cure) fx.push('cures poison and spores');
    if (u.buff === 'aspd') fx.push(`attack speed +10% for ${u.t / 60} minutes`); // (main.js applyStats: aspdRate x0.9)
    if (u.oil) fx.push(`the weapon's blows ${u.oil[0].toUpperCase()}${u.oil.slice(1)} for ${u.t / 60} minutes (not a bow)`); // (main.js applyStats: gear.el)
    if (u.food) fx.push(`${u.food.toUpperCase()} +${u.n} for ${u.t / 60} minutes`);
    if (u.warp === 'random') fx.push('a random spot on this map');
    if (u.warp === 'camp') fx.push('back to your save point');
    const where = [...Object.entries(SHOPS).filter(([, l]) => l.includes(id)).map(([s]) => SHOPKEEPERS[s] || s),
      ...[...new Set(RECIPES.filter((r) => r.item === id).map((r) => CRAFTERS[recipeKind(r)] || 'crafted'))]];
    const drops = droppers(id).filter(({ d }, i, a) => a.findIndex((x) => x.d.name === d.name) === i); // (a drop and an MVP reward: once)
    if (drops.length) where.push(drops.length > 4 ? `${drops.slice(0, 3).map(({ d }) => d.name).join(', ')} and ${drops.length - 3} more` : drops.map(({ d }) => d.name).join(', '));
    return `| ${it.name} | ${fx.join(', ')} | ${cell(where.join('; '))} |`;
  });
  return ['| Usable | Effect | Where |', '|---|---|---|', ...rows].join('\n');
}

function drops() {
  const rows = Object.entries(ITEMS).filter(([id, it]) => it.type === 'equip' && droppers(id).length)
    .sort((a, b) => firstLv(a[0]) - firstLv(b[0]) || a[1].name.localeCompare(b[1].name))
    .map(([id, it]) => {
      const slot = it.slot === 'weapon' ? `Weapon (${it.kind || 'sword'})` : SLOTS[it.slot] || it.slot;
      const who = it.jobs ? ` (${it.jobs.filter((j) => j !== 'novice').map((j) => ({ swordman: 'Blader', mage: 'Sorcerer', archer: 'Archer', assassin: 'Assassin' })[j]).join(', ')})` : '';
      return `| ${it.name} | ${slot}${who} | ${cell(equipLine(it))} | ${cell(from(id))} |`;
    });
  return ['| Piece | Slot | Effect | From |', '|---|---|---|---|', ...rows].join('\n');
}

function cards(boss) {
  const list = Object.entries(ITEMS).filter(([id, it]) => it.card && !!it.card.perk === boss)
    .sort((a, b) => firstLv(a[0]) - firstLv(b[0]) || a[1].name.localeCompare(b[1].name));
  const on = (cd) => [cd.on].flat().map((s) => SLOTS[s] || s).join(' or ');
  return ['| Card | Goes in | Effect | From |', '|---|---|---|---|',
    ...list.map(([id, it]) => `| ${it.name}${it.adj ? ` (${it.adj})` : ''} | ${on(it.card)} | ${cell(cap(cardLine(it.card)))} | ${cell(from(id))} |`)].join('\n');
}

const TABLES = { usables, drops, cards: () => cards(false), bosscards: () => cards(true) };
const md = fs.readFileSync(README, 'utf8');
let out = md;
for (const [name, make] of Object.entries(TABLES)) {
  const re = new RegExp(`(<!-- tables:${name} -->\\n)[\\s\\S]*?(<!-- /tables:${name} -->)`);
  if (!re.test(out)) { console.error(`README.md has no <!-- tables:${name} --> markers`); process.exit(1); }
  out = out.replace(re, (_, a, b) => `${a}${make()}\n${b}`);
}
if (process.argv.includes('--check')) {
  if (out !== md) { console.error('README.md tables are out of date: run node build-tools/readme-tables.mjs'); process.exit(1); }
  console.log('README tables up to date');
} else if (out !== md) { fs.writeFileSync(README, out); console.log('README tables written'); } else console.log('README tables already up to date');
