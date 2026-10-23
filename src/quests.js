// The people of Eldrun Camp and Steinborg, and their quest chains. Each offers one quest at a
// time, in order; later quests wait for a player level. Quest kinds:
//   kill  - beat n monsters of a type (counted from when you accept)
//   fetch - bring items (taken from bag + chest when you hand in)
//   visit - set foot in every listed zone
// map: where they stand (camp unless given). shop: they buy and sell (items.js SHOPS).
// craft: they craft ('gear' or 'use' recipes). trial: a job trial quest for Trainees (Job Lv 10,
// Basic Training 9) and the job it opens once it is done.
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
    quests: ['slimes', 'crabs', 'mushlings', 'beetles'],
    // a Trainee ready for a job is sent on to Steinborg
    ready: 'You have learnt all a Trainee can. Go north through Mosvangr to Steinborg: Captain Ulfr trains Bladers, and Saeunn the Seeress teaches sorcery.',
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

  // ---------- Steinborg ----------
  hild: {
    name: 'Hild the Trader', map: 'city', x: 26.6, z: 27.4, shop: 'hild',
    hello: 'Welcome to Steinborg market! Draughts, feathers, torches. And I buy whatever you drag in from the wilds.',
    later: (lv) => `I will have work for you at Base Level ${lv}. Meanwhile, shop away!`,
    bye: 'Good trading, friend. Mind your purse on the road.',
    quests: ['roads', 'pearls'],
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
    hello: 'Herbs, gels and dusts make draughts, tonics and feathers. Bring me the makings and I will brew them for you.',
    later: (lv) => `I will have an errand for you at Base Level ${lv}.`,
    bye: 'Drink slowly. The good ones are strong.',
    quests: ['brambles', 'salt', 'gloom', 'embers'],
  },
  ulfr: {
    name: 'Captain Ulfr', map: 'city', x: 36.4, z: 51.4, trial: 'blader_trial', job: 'swordman',
    hello: 'The Watch keeps the roads clear. Strong arms are always welcome.',
    later: (lv) => `Nothing for you yet. Report back at Base Level ${lv}.`,
    bye: 'The roads are safer for your blade. Well fought.',
    trialHint: 'Trainees who have learnt all their basics can take the Blader\'s Trial with me: Trainee Job Level 10 and Basic Training 9.',
    quests: ['russets', 'tidecrabs', 'gloomcaps', 'cinders'],
  },
  saeunn: {
    name: 'Saeunn the Seeress', map: 'city', x: 45.6, z: 19.8, trial: 'sorcerer_trial', job: 'mage',
    hello: 'The runes whisper of you. Few hear them.',
    later: (lv) => `The runes are quiet. Come to me again at Base Level ${lv}.`,
    bye: 'Walk softly. The runes are listening.',
    trialHint: 'When your training is done (Trainee Job Level 10, Basic Training 9), come to me and I will test whether the runes answer you.',
    quests: ['shades'],
  },
};

// reward: { xp (Base EXP; Job EXP is 70% of it), zeny, items: { id: n } }. Levels and EXP follow
// the Ragnarok curve: a quest is worth a good handful of kills at its level.
export const QUESTS = {
  slimes: {
    title: 'The Green Blight', kind: 'kill', mob: 'slime', n: 5, lv: 1,
    intro: 'Green Slimes have been nibbling at our supplies. Chase off five of them in Mosvangr.',
    thanks: 'Ha! That will teach them. Here, take these draughts for your troubles.',
    reward: { xp: 12, items: { potion: 2 } },
  },
  crabs: {
    title: 'Claws of the Fen', kind: 'kill', mob: 'crab', n: 4, lv: 5,
    intro: 'Mudcrabs snap at anyone who goes near Fenstrand. Beat four of them. Watch for their charge!',
    thanks: 'The shore is safe to walk again. Well done.',
    reward: { xp: 60, items: { potion: 1, shell: 3 } },
  },
  beetles: {
    title: 'Wrath of the Stone-Backs', kind: 'kill', mob: 'beetle', n: 5, lv: 14,
    intro: 'Pebble Beetles are rolling down from Glodberg. They hit hard, so bring good armor. Five should do.',
    thanks: 'Tough as stone, and yet here you are. Take these.',
    reward: { xp: 500, items: { potion: 3 } },
  },
  mushlings: {
    title: 'The Rot of Myrkvid', kind: 'kill', mob: 'mushling', n: 6, lv: 10,
    intro: 'The dale of Myrkdal was called Myrkvid once, the dark wood. Its Mushlings spread their spores further each night. Thin them out: six of them.',
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
    intro: 'My famous stew, fit for a jarl, needs five Spore Caps from Myrkdal. Mind the spores!',
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
  // ---------- the job trials ----------
  blader_trial: {
    title: "The Blader's Trial", kind: 'kill', mob: 'russet', n: 8, lv: 1,
    intro: 'A Blader proves their sword first. Go east to Birkilund and cut down eight Russet Sproutlings. Come back standing, and I will make you one of us.',
    thanks: 'Not a scratch you could not live with. You have a Blader\'s arm.',
    reward: { xp: 60, zeny: 200 },
  },
  sorcerer_trial: {
    title: 'The Rune Trial', kind: 'fetch', items: { glow: 4, dew: 3, seed: 3 }, lv: 1,
    intro: 'Magic gathers in small things. Bring me four Glow Dust, three Dew Drops and three Sprout Seeds, and we will see whether the runes answer you.',
    thanks: 'Light, water and life... and they hum in your hands. The runes have answered.',
    reward: { xp: 60, zeny: 200 },
  },
  // ---------- Steinborg ----------
  roads: {
    title: 'Roads for Trade', kind: 'visit', zones: ['birch', 'coast', 'deep', 'heath'], lv: 5,
    intro: 'My carts need safe roads. Walk the four new lands for me: Birkilund, Saltvik, Svartskog and Askheid, and tell me what you see.',
    thanks: 'Four roads, four markets. You have earned a cut.',
    reward: { xp: 400, zeny: 1500, items: { potion2: 3 } },
  },
  pearls: {
    title: 'Pearls of Saltvik', kind: 'fetch', items: { pearl: 2 }, lv: 10,
    intro: 'Tidecrabs on the Saltvik shore carry pearls in their shells. Bring me two and I pay well.',
    thanks: 'Beautiful! As promised.',
    reward: { xp: 500, zeny: 2500 },
  },
  ore: {
    title: 'Stone for the Forge', kind: 'fetch', items: { stone: 10, shell: 6 }, lv: 10,
    intro: 'My stock of ridge stone is gone. Ten Stone Chips and six Shell Bits, and I will see you right.',
    thanks: 'Good stone. Here, coin and a draught for the road.',
    reward: { xp: 450, zeny: 1800, items: { potion2: 2 } },
  },
  brambles: {
    title: 'Bramble Tea', kind: 'fetch', items: { thorn: 5 }, lv: 6,
    intro: 'Bramble Twigs from Birkilund make a bitter tea that heals deep cuts. Five, please.',
    thanks: 'Lovely and sharp. Take these.',
    reward: { xp: 150, zeny: 400, items: { potion: 4 } },
  },
  salt: {
    title: 'Salt of the Sea', kind: 'fetch', items: { salt: 6 }, lv: 9,
    intro: 'Brine Slimes in Saltvik leave Sea Salt behind them. Six handfuls, and I can brew tonics again.',
    thanks: 'Clean salt! Here, a tonic of the first batch.',
    reward: { xp: 300, zeny: 800, items: { tonic: 3 } },
  },
  gloom: {
    title: 'Spores of Svartskog', kind: 'fetch', items: { gloom: 5 }, lv: 16,
    intro: 'Gloomcaps grow in the black wood of Svartskog. Their spores make the strongest draughts. Five, if you dare.',
    thanks: 'They are still glowing. Wonderful.',
    reward: { xp: 1200, zeny: 2000, items: { potion3: 2 } },
  },
  embers: {
    title: 'Embers of Askheid', kind: 'fetch', items: { ember_dust: 5 }, lv: 20,
    intro: 'Ember Wisps drift over the ash heath of Askheid. Bring me five pinches of their dust.',
    thanks: 'Warm as a hearth. You are braver than you look.',
    reward: { xp: 2200, zeny: 3000, items: { potion3: 3 } },
  },
  russets: {
    title: 'Briars on the Road', kind: 'kill', mob: 'russet', n: 10, lv: 7,
    intro: 'Russet Sproutlings are tripping our carts in Birkilund. Clear out ten of them.',
    thanks: 'The road is clear again. The Watch pays its debts.',
    reward: { xp: 250, zeny: 600, items: { potion: 3 } },
  },
  tidecrabs: {
    title: 'The Saltvik Shore', kind: 'kill', mob: 'tidecrab', n: 8, lv: 10,
    intro: 'Tidecrabs have taken the Saltvik beach. Eight of them, and the fishers can go out again.',
    thanks: 'Good work. The fishers send their thanks, and fish.',
    reward: { xp: 600, zeny: 1200, items: { crableg: 4 } },
  },
  gloomcaps: {
    title: 'Into the Black Wood', kind: 'kill', mob: 'gloomcap', n: 8, lv: 16,
    intro: 'Something rots in Svartskog, east of Myrkdal. Gloomcaps. Burn out eight of them.',
    thanks: 'You came back from Svartskog. Not everyone does.',
    reward: { xp: 1500, zeny: 2500, items: { potion2: 4 } },
  },
  cinders: {
    title: 'Fire on the Heath', kind: 'kill', mob: 'cinderBeetle', n: 8, lv: 20,
    intro: 'Cinder Beetles roam Askheid, east of Glodberg. Their shells set the heather alight. Eight of them.',
    thanks: 'The heath can breathe. The Watch thanks you.',
    reward: { xp: 2600, zeny: 4000, items: { potion3: 2 } },
  },
  shades: {
    title: 'Shadows in Svartskog', kind: 'fetch', items: { shade: 4 }, lv: 16,
    intro: 'Shade Wisps drift between the black trees of Svartskog. Bring me four of their shards; the runes want them.',
    thanks: 'Cold, and singing. Thank you.',
    reward: { xp: 1300, zeny: 2200, items: { tonic: 4 } },
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
    intro: 'The Blue Slimes on Fenstrand split in two when you hit them! Beat five big ones.',
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
