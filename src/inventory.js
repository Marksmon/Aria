// Bag, camp chest and equipment. Materials and usables stack to 99 in one slot; each piece of
// equipment is its own item and takes a slot of its own. Worn equipment leaves the bag.
import { ITEMS, RECIPES, SLOTS, PRICES, sellPrice, canWear, parseKey, makeKey, refineInfo, canEnchant, canInsert, ENCHANT, MAX_SLOTS, enchantStep } from './items.js';

export const BAG_SLOTS = 48;
export const CHEST_SLOTS = 96; // the Keepers' storage, shared by every hero (save.js)
const STACK = 99;
const stackOf = (id) => (ITEMS[id].type === 'equip' ? 1 : STACK);

class Store {
  constructor(size) {
    this.size = size;
    this.slots = []; // [{id, n}]
  }
  count(id) { return this.slots.reduce((a, s) => a + (s.id === id ? s.n : 0), 0); }
  // room for n more of id (fills stacks first, then empty slots)
  room(id) {
    const max = stackOf(id);
    return this.slots.reduce((a, s) => a + (s.id === id ? max - s.n : 0), 0) + Math.max(0, this.size - this.slots.length) * max;
  }
  add(id, n) {
    const max = stackOf(id);
    let left = n;
    for (const s of this.slots) {
      if (!left) break;
      if (s.id !== id || s.n >= max) continue;
      const k = Math.min(left, max - s.n);
      s.n += k; left -= k;
    }
    while (left && this.slots.length < this.size) {
      const k = Math.min(left, max);
      this.slots.push({ id, n: k }); left -= k;
    }
    return n - left;
  }
  remove(id, n) {
    if (this.count(id) < n) return false;
    for (let i = this.slots.length - 1; i >= 0 && n; i--) {
      const s = this.slots[i];
      if (s.id !== id) continue;
      const k = Math.min(n, s.n);
      s.n -= k; n -= k;
    }
    this.slots = this.slots.filter((s) => s.n > 0);
    return true;
  }
  ofType(type) { return this.slots.filter((s) => ITEMS[s.id].type === type); }
  toJSON() { return this.slots.map((s) => [s.id, s.n]); }
  // nothing is lost on loading: what doesn't fit (two heroes' chests joining the storage) stays,
  // over the limit, until it is taken out
  load(arr) {
    this.slots = [];
    for (const [id, n] of arr || []) {
      if (!ITEMS[id]) continue;
      let left = (n | 0) - this.add(id, n | 0);
      for (const max = stackOf(id); left > 0; left -= max) this.slots.push({ id, n: Math.min(left, max) });
    }
  }
}

// gear from saves made before equipment were items: tiers and flags
const OLD_WEAPONS = ['twig_sword', 'stone_blade', 'ember_edge'];
const OLD_ARMORS = ['clothes', 'leaf_tunic', 'shell_mail', 'beetle_plate'];

export class Inventory {
  constructor() {
    this.bag = new Store(BAG_SLOTS);
    this.chest = new Store(CHEST_SLOTS);
    this.gear = { head: null, face: null, shield: null, garment: null, weapon: 'twig_sword', armor: 'clothes', shoes: null, wings: null, acc: null, acc2: null, ammo: null }; // slot -> item id (two accessories, like Ragnarok)
    this.perz = 0;
    this.listeners = [];
    this.level = () => 1; // set by the game: current Base Level, for recipe requirements
    this.job = () => 'novice'; // set by the game: who is wearing the gear
  }

  onChange(fn) { this.listeners.push(fn); }
  changed() { for (const fn of this.listeners) fn(); }

  add(id, n) {
    const got = this.bag.add(id, n);
    if (got) this.changed();
    return got;
  }

  // crafting pulls from the bag first, then the chest (you craft at camp, next to the chest)
  have(id) { return this.bag.count(id) + this.chest.count(id); }
  spend(id, n) {
    const fromBag = Math.min(n, this.bag.count(id));
    if (fromBag) this.bag.remove(id, fromBag);
    if (n - fromBag) this.chest.remove(id, n - fromBag);
  }

  recipeState(r) {
    if (r.lv && this.level() < r.lv) return 'level';
    const ok = Object.entries(r.cost).every(([id, n]) => this.have(id) >= n);
    return ok ? 'ready' : 'missing';
  }

  craft(r) {
    if (this.recipeState(r) !== 'ready' || !this.bag.room(r.item)) return false;
    for (const [id, n] of Object.entries(r.cost)) this.spend(id, n);
    this.bag.add(r.item, 1);
    this.changed();
    return true;
  }

  moveStack(from, to, id) {
    const n = Math.min(from.count(id), ITEMS[id].type === 'equip' ? 1 : STACK);
    const got = to.add(id, n);
    if (got) from.remove(id, got);
    this.changed();
    return got;
  }

  // shops: buy n at the shop's price, sell n for half. Returns false if it can't be done.
  buy(id, n = 1) {
    const cost = PRICES[id] * n;
    if (this.perz < cost || this.bag.room(id) < n) return false;
    this.perz -= cost;
    this.bag.add(id, n);
    this.changed();
    return true;
  }
  sell(id, n = 1) {
    if (!sellPrice(id) || !this.bag.remove(id, n)) return false;
    this.perz = Math.min(999999999, this.perz + sellPrice(id) * n);
    this.changed();
    return true;
  }
  addPerz(n) { this.perz = Math.min(999999999, this.perz + n); this.changed(); }

  // put on a piece of equipment from the bag; whatever was in its slot goes back in the bag
  equip(id) {
    const it = ITEMS[id];
    if (it?.type !== 'equip' || !canWear(id, this.job())) return false;
    // a second accessory goes in the free hand
    const slot = it.slot === 'acc' && this.gear.acc && !this.gear.acc2 ? 'acc2' : it.slot;
    const old = this.gear[slot];
    // a bow takes both hands: it puts the shield away, and a shield puts the bow away
    const twoHands = (it.kind === 'bow' && this.gear.shield) ? 'shield' : (it.slot === 'shield' && ITEMS[this.gear.weapon]?.kind === 'bow') ? 'weapon' : null;
    if (twoHands && !this.bag.room(this.gear[twoHands])) return false;
    // the piece taken off goes where the new one was, so the bag does not shuffle under your finger
    const at = this.bag.slots.findIndex((s) => s.id === id);
    if (at < 0) return false;
    if (old && this.bag.slots[at].n === 1) this.bag.slots[at] = { id: old, n: 1 };
    else {
      this.bag.remove(id, 1);
      if (old) this.bag.add(old, 1); // the slot just freed always has room
    }
    this.gear[slot] = id;
    if (twoHands) { this.bag.add(this.gear[twoHands], 1); this.gear[twoHands] = null; }
    this.changed();
    return true;
  }

  unequip(slot) {
    const id = this.gear[slot];
    if (!id || !this.bag.add(id, 1)) return false;
    this.gear[slot] = null;
    this.changed();
    return true;
  }

  // after a job change: take off what the new job can't wear (it goes to the bag, or storage)
  dropUnwearable() {
    const off = [];
    for (const [slot, id] of Object.entries(this.gear)) {
      if (!id || canWear(id, this.job())) continue;
      this.gear[slot] = null;
      if (!this.bag.add(id, 1)) this.chest.add(id, 1);
      off.push(id);
    }
    if (off.length) this.changed();
    return off;
  }

  // ---------- upgrades: Holger's refining, Seyla's slots, cards ----------
  // every piece of equipment you have, in the bag or worn: [{ where: 'bag' or the gear slot, key }]
  pieces(test = () => true) {
    const out = [];
    for (const [slot, key] of Object.entries(this.gear)) if (key && test(key)) out.push({ where: slot, key });
    for (const s of this.bag.slots) if (ITEMS[s.id].type === 'equip' && test(s.id)) out.push({ where: 'bag', key: s.id });
    return out;
  }
  // swap a piece for its upgraded self, or destroy it (newKey null)
  replace(where, key, newKey) {
    if (where === 'bag') {
      if (!this.bag.remove(key, 1)) return false;
      if (newKey) this.bag.add(newKey, 1);
    } else {
      if (this.gear[where] !== key) return false;
      this.gear[where] = newKey;
    }
    return true;
  }
  // one refine try: { ok, broke } or { error }
  refine(where, key, roll = Math.random() * 100) {
    const r = refineInfo(key);
    if (!r || r.max) return { error: 'This cannot be refined any further.' };
    if (this.have(r.ore) < 1) return { error: `You need ${ITEMS[r.ore].name}.` };
    if (this.perz < r.fee) return { error: 'Not enough perz.' };
    this.spend(r.ore, 1);
    this.perz -= r.fee;
    const u = parseKey(key), ok = roll < r.chance;
    this.replace(where, key, ok ? makeKey(u.base, { ...u, refine: r.next }) : null);
    // a broken piece gives back the cards that were in it (to the bag, or storage if it is full)
    const saved = ok ? [] : u.cards;
    for (const c of saved) if (!this.bag.add(c, 1)) this.chest.add(c, 1);
    this.changed();
    return { ok, broke: !ok, key: ok ? makeKey(u.base, { ...u, refine: r.next }) : null, cards: saved };
  }
  // what one enchant of this piece costs, and whether you have it. boss: the boss materials it
  // would use, from whichever you have (any mix of the four)
  enchantCost(key) {
    const { mult } = enchantStep(key), boss = [];
    for (const id of ENCHANT.boss) for (let i = 0; i < this.have(id) && boss.length < mult; i++) boss.push(id);
    const items = Object.fromEntries(Object.entries(ENCHANT.items).map(([id, n]) => [id, n * mult]));
    const ok = this.perz >= ENCHANT.perz * mult && boss.length >= mult && Object.entries(items).every(([id, n]) => this.have(id) >= n);
    return { items, boss, bossNeed: mult, perz: ENCHANT.perz * mult, ok };
  }
  enchant(where, key, roll = Math.random() * 100) {
    if (!canEnchant(key)) return { error: (ITEMS[key]?.slots || 0) >= MAX_SLOTS ? 'This already has two slots.' : 'Only a Lv 4 weapon can take a slot.' };
    const c = this.enchantCost(key), step = enchantStep(key);
    if (!c.ok) return { error: 'You are missing some of the materials.' };
    for (const [id, n] of Object.entries(c.items)) this.spend(id, n);
    for (const id of c.boss) this.spend(id, 1);
    this.perz -= c.perz;
    const u = parseKey(key), ok = roll < step.chance, nk = ok ? makeKey(u.base, { ...u, slots: step.slots }) : null;
    this.replace(where, key, nk);
    // a broken piece gives back its cards, as at Holger's
    const saved = ok ? [] : u.cards;
    for (const c2 of saved) if (!this.bag.add(c2, 1)) this.chest.add(c2, 1);
    this.changed();
    return { ok, broke: !ok, key: nk, cards: saved };
  }
  // press a card into a free slot, for good
  insert(card, where, key) {
    if (!canInsert(card, key) || !this.bag.remove(card, 1)) return { error: 'That card does not fit there.' };
    const u = parseKey(key), nk = makeKey(u.base, { ...u, cards: [...u.cards, card] });
    this.replace(where, key, nk);
    this.changed();
    return { ok: true, key: nk };
  }

  // is a worn item giving this effect (speed, light, regen, aspd, block, exp)?
  wearing(fx) { return Object.values(this.gear).some((id) => id && ITEMS[id].fx === fx); }

  // equipment as the battle rules see it (rules.js derive)
  gearStats() {
    const w = ITEMS[this.gear.weapon], bow = w?.kind === 'bow', arrows = bow ? ITEMS[this.gear.ammo] : null;
    let def = 0, hit = 0, flee = 0, mhp = 0, msp = 0, mhpRate = 0, mspRate = 0;
    const stats = {};
    for (const id of Object.values(this.gear)) {
      if (!id) continue;
      const it = ITEMS[id];
      def += it.def || 0; hit += it.hit || 0; flee += it.flee || 0; mhp += it.mhp || 0; msp += it.msp || 0; mhpRate += it.mhpRate || 0; mspRate += it.mspRate || 0;
      for (const [k, v] of Object.entries(it.stats || {})) stats[k] = (stats[k] || 0) + v;
    }
    // with a bow, the arrows' ATK adds to its own and an elemental arrow sets the shot's element
    return { atk: (w?.atk || 0) + (arrows?.atk || 0), wlv: w?.wlv || 0, matk: w?.matk || 0, el: arrows?.el || w?.el, bow, def, hit, flee, mhp, msp, mhpRate, mspRate, stats, mastery: 0, aspdRate: (this.wearing('aspd') ? 0.9 : 1) * (1 - (w?.aspd || 0) / 100) };
  }

  // the chest is not the hero's: it is the shared storage, saved on its own (save.js)
  toJSON() { return { v: 2, perz: this.perz, bag: this.bag.toJSON(), gear: this.gear }; }
  load(data) {
    if (!data) return;
    this.perz = Math.max(0, (data.perz ?? data.zeny) | 0); // saves from before the rename kept it as zeny
    this.bag.load(data.bag);
    const g = data.gear || {};
    if (data.v === 2) {
      // the Light slot became Wings: the Lantern flies on, a Torch goes back in the bag
      if (g.light && !g.wings) { if (ITEMS[g.light]?.slot === 'wings') g.wings = g.light; else if (ITEMS[g.light]) this.bag.add(g.light, 1); }
      for (const slot of Object.keys(SLOTS)) {
        const id = g[slot];
        this.gear[slot] = ITEMS[id]?.slot === (slot === 'acc2' ? 'acc' : slot) ? id : null;
      }
      return;
    }
    // older save: gear was tiers and flags; worn charm stays on, the others go in the bag
    this.gear.weapon = OLD_WEAPONS[Math.min(g.weapon | 0, 2)];
    this.gear.armor = OLD_ARMORS[Math.min(g.armor | 0, 3)];
    this.gear.shoes = g.boots ? 'swift_boots' : null;
    if (g.torch) this.bag.add('torch', 1);
    const charm = (c) => (ITEMS[c + '_charm'] ? c + '_charm' : null);
    this.gear.acc = charm(g.charm);
    for (const c of g.charms || []) if (c !== g.charm && charm(c)) this.bag.add(charm(c), 1);
  }
}

export { RECIPES };
