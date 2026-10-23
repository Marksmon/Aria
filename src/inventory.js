// Bag, camp chest and equipment. Each item type uses one slot and stacks to 99.
import { ITEMS, WEAPONS, ARMORS, RECIPES } from './items.js';

export const BAG_SLOTS = 16;
export const CHEST_SLOTS = 32;
const STACK = 99;

class Store {
  constructor(size) {
    this.size = size;
    this.slots = []; // [{id, n}]
  }
  count(id) { return this.slots.find((s) => s.id === id)?.n || 0; }
  add(id, n) {
    let s = this.slots.find((x) => x.id === id);
    if (!s) {
      if (this.slots.length >= this.size) return 0;
      s = { id, n: 0 };
      this.slots.push(s);
    }
    const add = Math.min(n, STACK - s.n);
    s.n += add;
    return add;
  }
  remove(id, n) {
    const s = this.slots.find((x) => x.id === id);
    if (!s || s.n < n) return false;
    s.n -= n;
    if (s.n === 0) this.slots = this.slots.filter((x) => x !== s);
    return true;
  }
  toJSON() { return this.slots.map((s) => [s.id, s.n]); }
  load(arr) { this.slots = (arr || []).filter(([id]) => ITEMS[id]).map(([id, n]) => ({ id, n })); }
}

export class Inventory {
  constructor() {
    this.bag = new Store(BAG_SLOTS);
    this.chest = new Store(CHEST_SLOTS);
    this.gear = { weapon: 0, armor: 0, torch: false, boots: false };
    this.listeners = [];
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
    if (r.kind === 'weapon' && this.gear.weapon >= r.tier) return 'owned';
    if (r.kind === 'armor' && this.gear.armor >= r.tier) return 'owned';
    if (r.kind === 'tool' && this.gear[r.tool]) return 'owned';
    if (r.kind === 'weapon' && this.gear.weapon < r.tier - 1) return 'locked';
    if (r.kind === 'armor' && this.gear.armor < r.tier - 1) return 'locked';
    const ok = Object.entries(r.cost).every(([id, n]) => this.have(id) >= n);
    return ok ? 'ready' : 'missing';
  }

  craft(r) {
    if (this.recipeState(r) !== 'ready') return false;
    if (r.kind === 'item' && this.bag.slots.length >= BAG_SLOTS && !this.bag.count(r.item)) return false;
    for (const [id, n] of Object.entries(r.cost)) this.spend(id, n);
    if (r.kind === 'weapon') this.gear.weapon = r.tier;
    if (r.kind === 'armor') this.gear.armor = r.tier;
    if (r.kind === 'tool') this.gear[r.tool] = true;
    if (r.kind === 'item') this.bag.add(r.item, 1);
    this.changed();
    return true;
  }

  moveStack(from, to, id) {
    const n = from.count(id);
    const got = to.add(id, n);
    if (got) from.remove(id, got);
    this.changed();
    return got;
  }

  applyTo(player) {
    const w = WEAPONS[this.gear.weapon], a = ARMORS[this.gear.armor];
    player.damage = w.dmg;
    player.attackSpeed = w.spd;
    const newMax = 10 + a.hearts * 2;
    if (newMax > player.maxHp) player.hp += newMax - player.maxHp;
    player.maxHp = newMax;
    player.hp = Math.min(player.hp, player.maxHp);
    player.speedMul = this.gear.boots ? 1.2 : 1;
  }

  toJSON() { return { bag: this.bag.toJSON(), chest: this.chest.toJSON(), gear: this.gear }; }
  load(data) {
    if (!data) return;
    this.bag.load(data.bag);
    this.chest.load(data.chest);
    this.gear = { ...this.gear, ...(data.gear || {}) };
    this.gear.weapon = Math.min(this.gear.weapon | 0, WEAPONS.length - 1);
    this.gear.armor = Math.min(this.gear.armor | 0, ARMORS.length - 1);
  }
}

export { RECIPES };
