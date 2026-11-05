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
// splits into), by level. mobs: MOB_DEFS; cardOf: monster name -> its card id; where: type -> text
export function albumRows(mobs, album, cardOf, where) {
  return Object.entries(mobs)
    .filter(([, d]) => !d.decoy && !(d.noRespawn && !d.drops?.some(([id]) => cardOf[d.name] === id)))
    .map(([type, d]) => ({
      type, name: d.name, lv: d.lv, el: d.el, kills: album.kills[type] || 0, met: album.met(type),
      kind: d.mvp ? 'MVP' : d.boss ? 'Boss' : '', where: where(type) || '',
      card: cardOf[d.name] || null, found: !!cardOf[d.name] && album.cards.has(cardOf[d.name]),
    }))
    .sort((a, b) => a.lv - b.lv || a.name.localeCompare(b.name));
}
