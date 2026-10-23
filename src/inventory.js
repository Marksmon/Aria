// Bag, camp chest and equipment. Each item type uses one slot and stacks to 99.
import { ITEMS, WEAPONS, ARMORS, RECIPES, CHARMS } from './items.js';

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
    this.gear = { weapon: 0, armor: 0, torch: false, boots: false, charms: [], charm: null };
    this.listeners = [];
    this.level = () => 1; // set by the game: current player level, for recipe requirements
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
    if (r.kind === 'charm' && this.gear.charms.includes(r.charm)) return 'owned';
    if (r.kind === 'weapon' && this.gear.weapon < r.tier - 1) return 'locked';
    if (r.kind === 'armor' && this.gear.armor < r.tier - 1) return 'locked';
    if (r.lv && this.level() < r.lv) return 'level';
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
    if (r.kind === 'charm') {
      this.gear.charms.push(r.charm);
      this.gear.charm ||= r.charm; // the first charm goes straight on
    }
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

  wear(charm) {
    if (charm !== null && !this.gear.charms.includes(charm)) return;
    this.gear.charm = charm;
    this.changed();
  }

  // gear plus stat points (Progress) -> player numbers
  applyTo(player, prog) {
    const w = WEAPONS[this.gear.weapon], a = ARMORS[this.gear.armor], st = prog.stats, charm = this.gear.charm;
    player.damage = w.dmg * (1 + 0.08 * st.str);
    player.attackSpeed = w.spd * (1 + 0.04 * st.agi) * (charm === 'spore' ? 1.15 : 1);
    const newMax = 10 + a.hearts * 2 + Math.floor(st.vit / 3) * 2;
    if (newMax > player.maxHp) player.hp += newMax - player.maxHp;
    player.maxHp = newMax;
    player.hp = Math.min(player.hp, player.maxHp);
    player.speedMul = (this.gear.boots ? 1.2 : 1) * (1 + 0.015 * st.agi);
    player.blockChance = charm === 'shell' ? 0.2 : 0;
  }

  toJSON() { return { bag: this.bag.toJSON(), chest: this.chest.toJSON(), gear: this.gear }; }
  load(data) {
    if (!data) return;
    this.bag.load(data.bag);
    this.chest.load(data.chest);
    this.gear = { ...this.gear, ...(data.gear || {}) };
    this.gear.weapon = Math.min(this.gear.weapon | 0, WEAPONS.length - 1);
    this.gear.armor = Math.min(this.gear.armor | 0, ARMORS.length - 1);
    this.gear.charms = (this.gear.charms || []).filter((c) => CHARMS[c]);
    if (!this.gear.charms.includes(this.gear.charm)) this.gear.charm = null;
  }
}

export { RECIPES };
