// The Monster Album (the 📖 button by the minimap): every kind of monster in Aria, how many the hero has
// beaten, and whether its card has ever been found. A monster not yet met shows as ??? with its level
// and where it lives, a hint of what is out there. Kept with each hero's save (album).
// It only collects: no stats come from it.
export class Album {
  constructor() {
    this.kills = {};       // monster type -> how many beaten
    this.cards = new Set(); // card item ids ever found
  }
  kill(type) { this.kills[type] = (this.kills[type] || 0) + 1; }
  card(id) {
    if (this.cards.has(id)) return false;
    this.cards.add(id);
    return true; // a new card for the album
  }
  met(type) { return (this.kills[type] || 0) > 0; }
  toJSON() { return { kills: this.kills, cards: [...this.cards] }; }
  load(d) {
    this.kills = {};
    this.cards = new Set();
    if (!d || typeof d !== 'object') return false;
    for (const [k, n] of Object.entries(d.kills || {})) if (n > 0) this.kills[k] = Math.floor(n);
    for (const id of d.cards || []) this.cards.add(String(id));
    return true;
  }
}

// the album's pages: one row per monster that can be met (no decoys, nor the little ones a Blue Bloop
// splits into), by level. mobs: MOB_DEFS; cardOf: monster name -> its card id; where: type -> text;
// chance: (type, card id) -> an MVP's card chance now (it rises with each kill without it: mobs.js PITY)
export function albumRows(mobs, album, cardOf, where, chance = () => null) {
  return Object.entries(mobs)
    .filter(([, d]) => !d.decoy && !(d.noRespawn && !d.drops?.some(([id]) => cardOf[d.name] === id)))
    .map(([type, d]) => ({
      type, name: d.name, lv: d.lv, el: d.el, kills: album.kills[type] || 0, met: album.met(type),
      kind: d.mvp ? 'MVP' : d.boss ? 'Boss' : '', where: where(type) || '',
      card: cardOf[d.name] || null, found: !!cardOf[d.name] && album.cards.has(cardOf[d.name]),
      chance: d.mvp && cardOf[d.name] ? chance(type, cardOf[d.name]) : null,
    }))
    .sort((a, b) => a.lv - b.lv || a.name.localeCompare(b.name));
}

// The album's sets (the owner's call): every card of one region's own monsters (bosses and MVPs aside;
// the raids' set is their bosses' cards). A finished set gives a small bonus for good (main.js applyStats).
// maps: the region's maps (spawns.js SPAWNS); bonus: { stats: { pow: 1 } } or { mhpRate / mspRate: % }
export const SETS = [
  { id: 'fields', name: "Eldrun's Fields", maps: ['grove', 'fen', 'hollow', 'birch'], bonus: { mhpRate: 2 }, text: 'Max HP +2%' },
  { id: 'south', name: 'The Shore and the South', maps: ['coast', 'ridge', 'deep', 'heath'], bonus: { stats: { pow: 1 } }, text: 'POW +1' },
  { id: 'tribes', name: 'Kobold and Goblin Lands', maps: ['stones', 'coalpit', 'burnt', 'serpent'], bonus: { stats: { end: 1 } }, text: 'END +1' },
  { id: 'hunt', name: "Veidheim's Lands", maps: ['marsh', 'oldwood', 'farm', 'wolfhill'], bonus: { stats: { fns: 1 } }, text: 'FNS +1' },
  { id: 'sands', name: 'The Desert', maps: ['redsands', 'dunes', 'scorpion', 'desert'], bonus: { stats: { qkn: 1 } }, text: 'QKN +1' },
  { id: 'halls', name: "The Sphinx's Halls", maps: ['halls1', 'halls2', 'halls3', 'halls4'], bonus: { stats: { knl: 1 } }, text: 'KNL +1' },
  { id: 'ygg', name: "Yggdrasil's Hollows", maps: ['ygg1', 'ygg2', 'ygg3', 'ygg4'], bonus: { mspRate: 2 }, text: 'Max SP +2%' },
  { id: 'raids', name: 'The Raids', raids: true, bonus: { stats: { ftn: 1 } }, text: 'FTN +1' },
];
// each set's cards and how many the album holds: [{ set, cards: [card ids], found, done }]. spawns: map ->
// [[type, n, night?]...] (spawns.js SPAWNS); raidBosses: the raids' boss types
export function setProgress(mobs, spawns, cardOf, album, raidBosses = []) {
  return SETS.map((set) => {
    const types = set.raids ? raidBosses : [...new Set(set.maps.flatMap((m) => (spawns[m] || []).map(([t]) => t)))].filter((t) => !mobs[t]?.boss && !mobs[t]?.mvp);
    const cards = [...new Set(types.map((t) => cardOf[mobs[t]?.name]).filter(Boolean))];
    const found = cards.filter((c) => album.cards.has(c)).length;
    return { set, cards, found, done: cards.length > 0 && found === cards.length };
  });
}
// every finished set's bonus, added up: { stats, mhpRate, mspRate }
export function setBonus(progress) {
  const out = { stats: {}, mhpRate: 0, mspRate: 0 };
  for (const { set, done } of progress) if (done) {
    for (const [k, v] of Object.entries(set.bonus.stats || {})) out.stats[k] = (out.stats[k] || 0) + v;
    out.mhpRate += set.bonus.mhpRate || 0;
    out.mspRate += set.bonus.mspRate || 0;
  }
  return out;
}
