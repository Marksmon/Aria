// Camp villagers and their quest chains. Each villager offers one quest at a time, in order;
// later quests wait for a player level. Quest kinds:
//   kill  - beat n monsters of a type (counted from when you accept)
//   fetch - bring items (taken from bag + chest when you hand in)
//   visit - set foot in every listed zone
import { ITEMS } from './items.js';
import { MOB_DEFS } from './mobs.js';
import { ZONE_NAMES } from './world.js';

export const NPCS = {
  bram: {
    name: 'Elder Halvard', x: 27.9, z: 31.9,
    hello: 'The valley is restless these days. Young legs like yours could help an old man.',
    later: (lv) => `Rest now. Come back to me when you reach Base Level ${lv}.`,
    bye: 'You have done this valley a great kindness. Sit by the fire whenever you like.',
    quests: ['slimes', 'crabs', 'mushlings', 'beetles'],
  },
  tilly: {
    name: 'Astrid the Cook', x: 36.2, z: 33.2,
    hello: 'Hungry? So am I! But my pantry is bare...',
    later: (lv) => `Nothing to cook right now. Pop back at Base Level ${lv}, I'll have a new recipe.`,
    bye: 'The pot is always on for you, dear.',
    quests: ['gel', 'water', 'lantern', 'stew'],
  },
  wren: {
    name: 'Sigrun the Scout', x: 35.6, z: 28.2,
    hello: "Oh, a new face! I'm mapping the valley. Want to help?",
    later: (lv) => `I'm still scribbling notes. Find me again at Base Level ${lv}.`,
    bye: "My map is finished, thanks to you. Best map in the valley, if I say so myself.",
    quests: ['explore', 'sprouts', 'blues', 'wisps'],
  },
};

// reward: { xp (Base EXP; Job EXP is 70% of it), items: { id: n } }. Levels and EXP follow
// the Ragnarok curve: a quest is worth a good handful of kills at its level.
export const QUESTS = {
  slimes: {
    title: 'The Green Blight', kind: 'kill', mob: 'slime', n: 5, lv: 1,
    intro: 'Green Slimes have been nibbling at our supplies. Chase off five of them in the Mossy Grove.',
    thanks: 'Ha! That will teach them. Here, take these draughts for your troubles.',
    reward: { xp: 12, items: { potion: 2 } },
  },
  crabs: {
    title: 'Claws of the Fen', kind: 'kill', mob: 'crab', n: 4, lv: 5,
    intro: 'Mudcrabs snap at anyone who goes near the Fen Shore. Beat four of them. Watch for their charge!',
    thanks: 'The shore is safe to walk again. Well done.',
    reward: { xp: 60, items: { potion: 1, shell: 3 } },
  },
  beetles: {
    title: 'Wrath of the Stone-Backs', kind: 'kill', mob: 'beetle', n: 5, lv: 14,
    intro: 'Pebble Beetles are rolling down from Ember Ridge. They hit hard, so bring good armor. Five should do.',
    thanks: 'Tough as stone, and yet here you are. Take these.',
    reward: { xp: 500, items: { potion: 3 } },
  },
  mushlings: {
    title: 'The Rot of Myrkvid', kind: 'kill', mob: 'mushling', n: 6, lv: 10,
    intro: 'The Old Hollow was called Myrkvid once, the dark wood. Its Mushlings spread their spores further each night. Thin them out: six of them.',
    thanks: 'The air already smells cleaner. You have become a true guardian of Aria.',
    reward: { xp: 250, items: { potion: 2, glow: 4 } },
  },
  gel: {
    title: 'Jelly for the Mead-Hall', kind: 'fetch', items: { gel: 6 }, lv: 1,
    intro: "A camp needs a mead-hall feast, and Slime Gel makes the best jelly. Bring me six blobs and I'll share!",
    thanks: 'Wobbly and perfect! Here, a draught from my own shelf.',
    reward: { xp: 8, items: { potion: 1, leaf: 3 } },
  },
  stew: {
    title: "The Jarl's Stew", kind: 'fetch', items: { spore: 5 }, lv: 8,
    intro: 'My famous stew, fit for a jarl, needs five Spore Caps from the Old Hollow. Mind the spores!',
    thanks: 'Smell that? Pure Hollow. Take a bowl, and these.',
    reward: { xp: 150, items: { potion: 2 } },
  },
  water: {
    title: "Water from Urd's Well", kind: 'fetch', items: { dew: 5, leaf: 3 }, lv: 4,
    intro: "Our well tastes of mud, nothing like Urd's Well in the old tales. Five Dew Drops and three Fresh Leaves will make a lovely tea.",
    thanks: 'Mmm, like a spring morning. I found these stones in the pot, you have them.',
    reward: { xp: 30, items: { stone: 4 } },
  },
  lantern: {
    title: "Sól's Lantern Soup", kind: 'fetch', items: { glow: 4 }, lv: 6,
    intro: "An old family recipe: soup that glows like Sól, the sun herself! I need four Glow Dust from the night Wisps.",
    thanks: "It's glowing! Grandma would be proud. These are yours.",
    reward: { xp: 90, items: { potion: 3 } },
  },
  explore: {
    title: 'The Four Realms', kind: 'visit', zones: ['grove', 'hollow', 'ridge', 'fen'], lv: 1,
    intro: 'First things first: walk the four realms of the valley. Grove, Hollow, Ridge and Fen.',
    thanks: "You've seen it all now! Here's something for the road.",
    reward: { xp: 15, items: { potion: 1 } },
  },
  sprouts: {
    title: 'Seeds of Yggdrasil', kind: 'kill', mob: 'sprout', n: 4, lv: 2,
    intro: "Sproutlings run away when you get close. Corner four of them; the elders say their seeds fell from Yggdrasil itself.",
    thanks: 'Fascinating little things. Take some seeds for your crafting.',
    reward: { xp: 15, items: { seed: 3 } },
  },
  blues: {
    title: 'Twin-Born of the Fen', kind: 'kill', mob: 'blueSlime', n: 5, lv: 4,
    intro: 'The Blue Slimes on the Fen Shore split in two when you hit them! Beat five big ones.',
    thanks: 'Splitting slimes, noted on the map. Here, a little dew for you.',
    reward: { xp: 35, items: { dew: 3 } },
  },
  wisps: {
    title: 'Lights of the Álfar', kind: 'kill', mob: 'wisp', n: 6, lv: 7,
    intro: 'At night, Firefly Wisps drift all over the valley. The old songs call them álfar lights. Catch six and I can finally map them.',
    thanks: 'A map of lights! It is beautiful. Keep this dust.',
    reward: { xp: 120, items: { glow: 3 } },
  },
};

export class Quests {
  constructor() {
    this.active = {}; // id -> kills so far, or list of zones visited
    this.done = [];
  }

  // what a villager has for you: { q, id, state } with state
  //   offer | locked (needs level) | active | ready | finished
  status(npc, level, inv) {
    const id = NPCS[npc].quests.find((k) => !this.done.includes(k));
    if (!id) return { state: 'finished' };
    const q = QUESTS[id];
    if (id in this.active) return { id, q, state: this.ready(id, inv) ? 'ready' : 'active' };
    return { id, q, state: level >= q.lv ? 'offer' : 'locked' };
  }

  accept(id) {
    if (QUESTS[id] && !(id in this.active) && !this.done.includes(id)) {
      this.active[id] = QUESTS[id].kind === 'visit' ? [] : 0;
    }
  }

  ready(id, inv) {
    const q = QUESTS[id], a = this.active[id];
    if (q.kind === 'kill') return a >= q.n;
    if (q.kind === 'visit') return q.zones.every((z) => a.includes(z));
    return Object.entries(q.items).every(([item, n]) => inv.have(item) >= n);
  }

  // returns the ids of quests that just became complete
  onKill(type) {
    const out = [];
    for (const [id, a] of Object.entries(this.active)) {
      const q = QUESTS[id];
      if (q.kind !== 'kill' || q.mob !== type || a >= q.n) continue;
      this.active[id] = a + 1;
      if (a + 1 === q.n) out.push(id);
    }
    return out;
  }

  onZone(zone) {
    const out = [];
    for (const [id, a] of Object.entries(this.active)) {
      const q = QUESTS[id];
      if (q.kind !== 'visit' || !q.zones.includes(zone) || a.includes(zone)) continue;
      a.push(zone);
      if (a.length === q.zones.length) out.push(id);
    }
    return out;
  }

  // takes fetched items; the caller pays out the reward
  turnIn(id, inv) {
    if (!(id in this.active) || !this.ready(id, inv)) return null;
    const q = QUESTS[id];
    if (q.kind === 'fetch') for (const [item, n] of Object.entries(q.items)) inv.spend(item, n);
    delete this.active[id];
    this.done.push(id);
    return q.reward;
  }

  // short progress text for the tracker and dialogue
  progress(id, inv) {
    const q = QUESTS[id], a = this.active[id];
    if (q.kind === 'kill') return `${MOB_DEFS[q.mob].name} ${Math.min(a, q.n)}/${q.n}`;
    if (q.kind === 'visit') return `Zones ${a.length}/${q.zones.length}`;
    return Object.entries(q.items).map(([item, n]) => `${ITEMS[item].name} ${Math.min(inv.have(item), n)}/${n}`).join(' · ');
  }

  goal(q) {
    if (q.kind === 'kill') return `Defeat ${q.n} ${MOB_DEFS[q.mob].name}${q.n > 1 ? 's' : ''}`;
    if (q.kind === 'visit') return `Visit ${q.zones.map((z) => ZONE_NAMES[z]).join(', ')}`;
    return 'Bring ' + Object.entries(q.items).map(([item, n]) => `${n} ${ITEMS[item].name}`).join(', ');
  }

  toJSON() { return { active: this.active, done: this.done }; }
  load(d) {
    if (!d) return;
    this.done = (d.done || []).filter((id) => QUESTS[id]);
    for (const [id, a] of Object.entries(d.active || {})) {
      if (!QUESTS[id] || this.done.includes(id)) continue;
      this.active[id] = QUESTS[id].kind === 'visit' ? (Array.isArray(a) ? a : []) : Math.max(0, a | 0);
    }
  }
}
