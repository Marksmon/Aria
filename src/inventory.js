// Bag, camp chest and equipment. Materials and usables stack to 99 in one slot; each piece of
// equipment is its own item and takes a slot of its own. Worn equipment leaves the bag.
import { ITEMS, RECIPES, SLOTS } from './items.js';

export const BAG_SLOTS = 48;
export const CHEST_SLOTS = 48;
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
    return this.slots.reduce((a, s) => a + (s.id === id ? max - s.n : 0), 0) + (this.size - this.slots.length) * max;
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
  load(arr) {
    this.slots = [];
    for (const [id, n] of arr || []) if (ITEMS[id]) this.add(id, n | 0);
  }
}

// gear from saves made before equipment were items: tiers and flags
const OLD_WEAPONS = ['twig_sword', 'stone_blade', 'ember_edge'];
const OLD_ARMORS = ['clothes', 'leaf_tunic', 'shell_mail', 'beetle_plate'];

export class Inventory {
  constructor() {
    this.bag = new Store(BAG_SLOTS);
    this.chest = new Store(CHEST_SLOTS);
    this.gear = { head: null, face: null, shield: null, garment: null, weapon: 'twig_sword', armor: 'clothes', shoes: null, light: null, acc: null, acc2: null }; // slot -> item id (two accessories, like Ragnarok)
    this.listeners = [];
    this.level = () => 1; // set by the game: current Base Level, for recipe requirements
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

  // put on a piece of equipment from the bag; whatever was in its slot goes back in the bag
  equip(id) {
    const it = ITEMS[id];
    if (it?.type !== 'equip' || !this.bag.remove(id, 1)) return false;
    // a second accessory goes in the free hand
    const slot = it.slot === 'acc' && this.gear.acc && !this.gear.acc2 ? 'acc2' : it.slot;
    const old = this.gear[slot];
    this.gear[slot] = id;
    if (old) this.bag.add(old, 1); // the slot just freed always has room
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

  // is a worn item giving this effect (speed, light, regen, aspd, block, exp)?
  wearing(fx) { return Object.values(this.gear).some((id) => id && ITEMS[id].fx === fx); }

  // equipment as the battle rules see it (rules.js derive)
  gearStats() {
    const w = ITEMS[this.gear.weapon];
    let def = 0, hit = 0, flee = 0, mhp = 0, msp = 0;
    const stats = {};
    for (const id of Object.values(this.gear)) {
      if (!id) continue;
      const it = ITEMS[id];
      def += it.def || 0; hit += it.hit || 0; flee += it.flee || 0; mhp += it.mhp || 0; msp += it.msp || 0;
      for (const [k, v] of Object.entries(it.stats || {})) stats[k] = (stats[k] || 0) + v;
    }
    return { atk: w?.atk || 0, wlv: w?.wlv || 0, def, hit, flee, mhp, msp, stats, mastery: 0, aspdRate: this.wearing('aspd') ? 0.9 : 1 };
  }

  toJSON() { return { v: 2, bag: this.bag.toJSON(), chest: this.chest.toJSON(), gear: this.gear }; }
  load(data) {
    if (!data) return;
    this.bag.load(data.bag);
    this.chest.load(data.chest);
    const g = data.gear || {};
    if (data.v === 2) {
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
    this.gear.light = g.torch ? 'torch' : null;
    const charm = (c) => (ITEMS[c + '_charm'] ? c + '_charm' : null);
    this.gear.acc = charm(g.charm);
    for (const c of g.charms || []) if (c !== g.charm && charm(c)) this.bag.add(charm(c), 1);
  }
}

export { RECIPES };
