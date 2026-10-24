// The people of Eldrun Camp and Steinborg, and their quest chains. Each offers one quest at a
// time, in order; later quests wait for a player level. Quest kinds:
//   kill  - beat n monsters of a type (counted from when you accept)
//   fetch - bring items (taken from bag + chest when you hand in)
//   visit - set foot in every listed zone
// map: where they stand (camp unless given). shop: they buy and sell (items.js SHOPS).
// craft: they craft ('gear' or 'use' recipes). trial: a job trial quest for Trainees (Job Lv 10,
// Basic Training 9) and the job it opens once it is done. heal: mends you for free. warp: the
// Ferryman (FARES). look: whose sprite they borrow until they have their own.
import { ITEMS } from './items.js';
import { MOB_DEFS } from './mobs.js';
import { ZONE_NAMES } from './world.js';
import { skillLv } from './skills.js';

export const NPCS = {
  bram: {
    name: 'Elder Halvard', x: 27.9, z: 31.9,
    hello: 'The valley is restless these days. Young legs like yours could help an old man.',
    later: (lv) => `Rest now. Come back to me when you reach Base Level ${lv}.`,
    bye: 'You have done this valley a great kindness. Sit by the fire whenever you like.',
    quests: ['warden'],
    // a Trainee ready for a job is sent on to Steinborg
    ready: 'You have learnt all a Trainee can. Go north through Mosvangr to Steinborg: Captain Ulfr trains Bladers, and Saeunn the Seeress teaches sorcery.',
  },
  tilly: {
    name: 'Astrid the Cook', x: 36.2, z: 33.2,
    hello: 'Hungry? So am I! But my pantry is bare...',
    later: (lv) => `Nothing to cook right now. Pop back at Base Level ${lv}, I'll have a big job for you.`,
    bye: 'The pot is always on for you, dear.',
    quests: ['feast'],
  },
  wren: {
    name: 'Sigrun the Scout', x: 35.6, z: 28.2,
    hello: "Oh, a new face! I'm mapping the valley, but the night is too dangerous for me.",
    later: (lv) => `I'm still scribbling notes. Find me again at Base Level ${lv}.`,
    bye: "My map is finished, thanks to you. Best map in the valley, if I say so myself.",
    quests: ['lights'],
  },
  // a healer, like Ragnarok's: she mends you for nothing (no sprite of her own yet)
  gyda: {
    name: 'Gyda the Healer', x: 29.6, z: 35.8, look: 'tilly', heal: true,
    hello: 'Hurt? Sit down, let me see. Nobody leaves my fire bleeding.',
    later: () => '', bye: 'There. Good as new. Try to stay that way.',
    quests: [],
  },

  // ---------- Steinborg ----------
  hild: {
    name: 'Hild the Trader', map: 'city', x: 26.6, z: 27.4, shop: 'hild',
    hello: 'Welcome to Steinborg market! Potions, feathers, torches. And I buy whatever you drag in from the wilds.',
    later: (lv) => `I will have work for you at Base Level ${lv}. Meanwhile, shop away!`,
    bye: 'Good trading, friend. Mind your purse on the road.',
    quests: ['pearls'],
  },
  gunnar: {
    name: 'Gunnar the Gear Crafter', map: 'city', x: 43.2, z: 30.4, shop: 'gunnar', craft: 'gear',
    hello: 'Bring me materials and I forge them into gear: blades, staves, armor, charms. Or buy what I have on the rack.',
    later: (lv) => `I will have a job for you at the forge once you reach Base Level ${lv}.`,
    bye: 'Keep that edge sharp.',
    quests: ['ore'],
  },
  ragna: {
    name: 'Ragna the Herbalist', map: 'city', x: 20.6, z: 22.8, craft: 'use',
    hello: 'Herbs, gels and dusts make potions and feathers. Bring me the makings and I will brew them for you.',
    later: (lv) => `I will have an errand for you at Base Level ${lv}.`,
    bye: 'Drink slowly. The good ones are strong.',
    quests: ['remedy'],
  },
  ulfr: {
    name: 'Captain Ulfr', map: 'city', x: 36.4, z: 51.4, trial: 'blader_trial', job: 'swordman',
    hello: 'The Watch keeps the roads clear. Strong arms are always welcome.',
    later: (lv) => `Nothing for you yet. Report back at Base Level ${lv}.`,
    bye: 'The roads are safer for your blade. Well fought.',
    trialHint: 'Trainees who have learnt all their basics can take the Blader\'s Trial with me: Trainee Job Level 10 and Basic Training 9.',
    quests: ['kingcrab', 'giantbeetle'],
  },
  embla: {
    name: 'Embla the Stylist', map: 'city', x: 37.4, z: 36.2, stylist: true,
    hello: 'A new cut? A new colour? Sit, sit. For 1,000 perz I make you look like a hero of the songs.',
    later: (lv) => `Come back at Base Level ${lv}.`,
    bye: 'You look wonderful. Truly.',
    quests: [],
  },
  saeunn: {
    name: 'Saeunn the Seeress', map: 'city', x: 45.6, z: 19.8, trial: 'sorcerer_trial', job: 'mage',
    hello: 'The runes whisper of you. Few hear them.',
    later: (lv) => `The runes are quiet. Come to me again at Base Level ${lv}.`,
    bye: 'Walk softly. The runes are listening.',
    trialHint: 'When your training is done (Trainee Job Level 10, Basic Training 9), come to me and I will test whether the runes answer you.',
    quests: ['shades'],
  },
  // the ferryman's carts take you to any land you have walked before, for perz (warp: the fare per map)
  ivar: {
    name: 'Ivar the Ferryman', map: 'city', x: 30.4, z: 38.6, look: 'gunnar', warp: true,
    hello: 'My carts know every road you have walked. Pay the fare and save your boots.',
    later: () => '', bye: 'Safe roads.',
    quests: [],
  },
  liv: {
    name: 'Liv the Guide', map: 'city', x: 28.6, z: 52.8, look: 'hild',
    hello: 'New to Steinborg? Hild trades in the square, Gunnar forges in the east, Ragna brews in the north-west, the Seeress keeps her tower in the north-east, and Ivar\'s carts wait by the square.',
    later: () => '', bye: 'The walls are strong and the beer is cold. Welcome.',
    quests: [],
  },
  bjorn: {
    name: 'Bjorn the Gate Guard', map: 'city', x: 55.2, z: 29.4, look: 'ulfr',
    hello: 'Most beasts out there leave you be until you strike first. Not in Svartskog and Askheid: the dark wisps and the fire beasts come for you on sight.',
    later: () => '', bye: 'Keep your guard up past the gate.',
    quests: [],
  },
};

// the Ferryman's fares, by map (only lands you have already walked)
export const FARES = { camp: 300, grove: 300, fen: 400, hollow: 600, birch: 700, coast: 900, ridge: 1200, deep: 1500, heath: 1800 };

// reward: { xp (Base EXP; Job EXP is 70% of it), perz, items: { id: n } }. Levels and EXP follow
// the Ragnarok curve at 1x: a quest is a big job, worth a fair share of a level.
export const QUESTS = {
  // ---------- Eldrun Camp: one big job each ----------
  warden: {
    title: 'The Mushroom Wood', kind: 'kill', mob: 'mushling', n: 25, lv: 12,
    intro: 'The Mushrooms of Myrkdal spread their spores closer to the camp every night. Go east from Mosvangr and cut down twenty-five of them. They hit back hard: bring potions.',
    thanks: 'The air already smells cleaner. You have become a true guardian of Eldrun.',
    reward: { xp: 2500, perz: 1500, items: { potion2: 5 } },
  },
  feast: {
    title: 'A Feast for Eldrun', kind: 'fetch', items: { gel: 20, crableg: 10, spore: 10 }, lv: 10,
    intro: "The camp hasn't feasted in a year. Twenty Slime Gel, ten Crab Legs from Fenstrand and ten Spores from Myrkdal, and we'll eat like jarls!",
    thanks: 'Smell that! The whole camp will sing your name tonight. Take these, and a full belly.',
    reward: { xp: 1800, perz: 1000, items: { potion: 10 } },
  },
  lights: {
    title: 'Lights in the Dark', kind: 'kill', mob: 'wisp', n: 15, lv: 10,
    intro: 'At night, Wisps drift all over the valley. I need to know where they nest. Catch fifteen of them for me, out there in the dark.',
    thanks: 'A map of lights! It is beautiful. Keep these.',
    reward: { xp: 2000, perz: 800, items: { glow: 5, wander: 3 } },
  },
  // ---------- the job trials ----------
  blader_trial: {
    title: "The Blader's Trial", kind: 'kill', mob: 'crab', n: 10, lv: 1,
    intro: 'A Blader proves their sword first. Go to Fenstrand, west of the camp, and beat ten Crabs. Come back standing, and I will make you one of us.',
    thanks: 'Not a scratch you could not live with. You have a Blader\'s arm.',
    reward: { xp: 300, perz: 500 },
  },
  sorcerer_trial: {
    title: 'The Rune Trial', kind: 'fetch', items: { glow: 4, dew: 3, seed: 3 }, lv: 1,
    intro: 'Magic gathers in small things. Bring me four Glow Dust, three Water Drops and three Seeds, and we will see whether the runes answer you.',
    thanks: 'Light, water and life... and they hum in your hands. The runes have answered.',
    reward: { xp: 300, perz: 500 },
  },
  // ---------- Steinborg ----------
  pearls: {
    title: 'Pearls of Saltvik', kind: 'fetch', items: { pearl: 5 }, lv: 24,
    intro: 'The Blue Crabs of Saltvik carry pearls in their shells, one crab in a dozen. Bring me five and I pay like a queen.',
    thanks: 'Beautiful! As promised.',
    reward: { xp: 9000, perz: 6000 },
  },
  ore: {
    title: 'Stone for the Forge', kind: 'fetch', items: { stone: 30, cinder: 15 }, lv: 34,
    intro: 'The forge is cold. Thirty Stone from the Beetles of Glodberg and fifteen Burnt Shells from the Fire Beetles of Askheid, and I can work again.',
    thanks: 'Good stone, and the shells are still warm. Here: coin, and something for the road.',
    reward: { xp: 30000, perz: 8000, items: { potion3: 5 } },
  },
  remedy: {
    title: 'The Great Remedy', kind: 'fetch', items: { gloom: 12, ember_dust: 12 }, lv: 38,
    intro: 'I can brew a remedy for the burning sickness in Askheid, but it needs twelve Dark Spores from Svartskog and twelve pinches of Fire Dust from the Fire Wisps. Both bite.',
    thanks: 'Dark and bright, cold and hot... it will work. Thank you, truly.',
    reward: { xp: 45000, perz: 8000, items: { tonic: 10 } },
  },
  kingcrab: {
    title: 'The King of the Shore', kind: 'kill', mob: 'tideKing', n: 1, lv: 30,
    intro: 'A crab as big as a cart rules the Saltvik shore, and the fishers will not go out. Kill the King Crab.',
    thanks: 'The King Crab, dead? The fishers will feast for a week. Well fought.',
    reward: { xp: 20000, perz: 6000, items: { potion2: 10 } },
  },
  giantbeetle: {
    title: 'The Beetle of Askheid', kind: 'kill', mob: 'cinderLord', n: 1, lv: 46,
    intro: 'In Askheid a Giant Beetle burns the heath wherever it walks. It is the worst thing the Watch has seen. Kill it.',
    thanks: 'You did what the whole Watch could not. Steinborg owes you.',
    reward: { xp: 120000, perz: 15000, items: { potion3: 10 } },
  },
  shades: {
    title: 'Shadows in Svartskog', kind: 'fetch', items: { shade: 10 }, lv: 38,
    intro: 'Dark Wisps drift between the black trees of Svartskog. Bring me ten of their crystals; the runes want them. Mind: they come for you on sight.',
    thanks: 'Cold, and singing. Thank you.',
    reward: { xp: 45000, perz: 6000, items: { tonic: 8 } },
  },
};

export class Quests {
  constructor() {
    this.active = {}; // id -> kills so far, or list of zones visited
    this.done = [];
  }

  // what a villager has for you: { q, id, state } with state
  //   offer | locked (needs level) | active | ready | finished
  //   offer | locked (needs level) | active | ready | finished | job (trial done: the job change)
  status(npc, prog, inv) {
    const n = NPCS[npc];
    // a job trial comes first for a Trainee who is ready for it
    if (n.trial && prog.job === 'novice') {
      const id = n.trial, q = QUESTS[id];
      if (this.done.includes(id)) return { id, q, state: 'job' };
      if (id in this.active) return { id, q, state: this.ready(id, inv) ? 'ready' : 'active' };
      if (prog.jobLv >= 10 && skillLv(prog, 'basics') >= 9) return { id, q, state: 'offer' };
    }
    const id = n.quests.find((k) => !this.done.includes(k));
    if (!id) return { state: 'finished' };
    const q = QUESTS[id];
    if (id in this.active) return { id, q, state: this.ready(id, inv) ? 'ready' : 'active' };
    return { id, q, state: prog.baseLv >= q.lv ? 'offer' : 'locked' };
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
