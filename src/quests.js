// The people of Eldrun Camp and Steinborg, and their quest chains. Each offers one quest at a
// time, in order; later quests wait for a player level. Quest kinds:
//   kill  - beat n monsters of a type (counted from when you accept)
//   fetch - bring items (taken from bag + chest when you hand in)
//   visit - set foot in every listed zone
// map: where they stand (camp unless given). shop: they buy and sell (items.js SHOPS).
// craft: they craft ('gear' or 'use' recipes). trial: a job trial for Trainees (Job Lv 10,
// Basic Training 9), a short series of quests one after another, and the job it opens once the last
// is done. heal: mends you for free. warp: the
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
    ready: 'You have learnt all a Trainee can. For the blade, go north through Mosvangr to Steinborg: Captain Ulfr trains Bladers. For sorcery, go west to Fenstrand and north to Galdrheim, the city of sorcerers.',
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
    name: 'Captain Ulfr', map: 'city', x: 36.4, z: 51.4, trial: ['blader_trial', 'blader_trial2', 'blader_trial3'], job: 'swordman',
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
    name: 'Saeunn the Seeress', map: 'city', x: 45.6, z: 19.8,
    hello: 'The runes whisper of you. Few hear them.',
    later: (lv) => `The runes are quiet. Come to me again at Base Level ${lv}.`,
    bye: 'Walk softly. The runes are listening.',
    trialHint: 'Sorcery is taught in Galdrheim, north of Fenstrand. When your training is done (Trainee Job Level 10, Basic Training 9), go to Archmage Vigdis there. She was my teacher.',
    quests: [],
    lore: [
      'I learnt the runes in Galdrheim, at Vigdis\'s feet. I came to Steinborg because stone-folk need a seer more than sorcerers do.',
      'The Fire Giant is the last of the fire-jotnar. His kin burnt half the world before the first settlers sang them to sleep.',
      'Every rune on Eldrun\'s fire-ring was cut by a Galdrheim hand. When the fires fail, the runes fail with them.',
    ],
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
  // ---------- Galdrheim, the city of sorcerers ----------
  vigdis: {
    name: 'Archmage Vigdis', map: 'magic', x: 32, z: 20.8, look: 'saeunn', trial: ['sorcerer_trial', 'sorcerer_trial2', 'sorcerer_trial3'], job: 'mage',
    hello: 'Welcome to Galdrheim, child. Here we sing the world into shape; we call it galdr, the song-craft.',
    later: (lv) => `You are not ready for what I would ask. Come back at Base Level ${lv}.`,
    bye: 'Sing true, and the runes will answer.',
    trialHint: 'When your training is done (Trainee Job Level 10, Basic Training 9), come to me and I will test whether the runes answer you.',
    quests: ['giantmother'],
    lore: [
      'Galdrheim was founded by Hallveig, the first Archmage, on a rune-well: a place where the old songs rise out of the ground. The circle in our square sits on top of it.',
      'When the settlers crossed the mountains, it was Hallveig who cut the runes of Eldrun\'s fire-ring. A ring of fire alone would not hold a jotunn; a ring of fire that sings does.',
      'Steinborg trusts its walls. We trust the song. Both are right, and both are not enough alone.',
      'Saeunn was my best student. She left to look after the stone-folk. I still miss her arguing with me.',
    ],
  },
  orm: {
    name: 'Orm the Staffwright', map: 'magic', x: 46.6, z: 34.6, look: 'gunnar', shop: 'orm', craft: 'magic',
    hello: 'Staves, robes, rings and charms for the song-folk. Bring me the makings and I carve and stitch them, or buy from the rack.',
    later: (lv) => `I may need your help with the wood at Base Level ${lv}.`,
    bye: 'Hold your staff by the grain, not against it.',
    quests: ['livingwood'],
    lore: [
      'A staff is not a stick. The wood must still remember being alive, or the song runs straight through it.',
      'Gunnar in Steinborg makes fine swords. He told me once a staff was a sword for people who are afraid of swords. I have not forgiven him.',
    ],
  },
  kari: {
    name: 'Kari the Curio Seller', map: 'magic', x: 25.8, z: 28.2, look: 'hild', shop: 'kari',
    hello: 'Potions, feathers, torches, and a little quickening for the impatient. Galdrheim prices, which is to say fair ones!',
    later: () => '', bye: 'Come back before your potions run dry!',
    quests: [],
    lore: [
      'Everything here is brewed in Galdrheim. The blue potions taste like cold rain. That is how you know they are real.',
      'Teleport Feathers come from the Wisps. Do not ask me how. The Lorekeeper asked once and she still has the hiccups.',
    ],
  },
  brynja: {
    name: 'Brynja the Lorekeeper', map: 'magic', x: 15.4, z: 37.4, look: 'ragna',
    hello: 'Quiet, please. This is the oldest library north of the mountains.',
    later: (lv) => `I have a task for you, but not yet. Come back at Base Level ${lv}.`,
    bye: 'Return your books on time. All of them.',
    quests: ['tomes'],
    lore: [
      'The fire-jotnar were born when the world was young, from the fire under the mountains. They did not hate us. They simply burnt, the way fire does.',
      'There were nine great jotnar. Eight were sung into the stone long ago. The ninth, the one the settlers called the Ember Jarl, slept under Glodberg. You know him as the Fire Giant.',
      'Our books say the fire-ring can be sung anew to keep him dreaming. But only beating the Giant in the waking world ends the danger for good. Sleeping, he cannot be harmed. Awake, he can.',
    ],
  },
  torvald: {
    name: 'Torvald the Runecarver', map: 'magic', x: 41.2, z: 46.8, look: 'ulfr',
    hello: 'Every rune is a word, and every word is a promise. I carve them so the promises last.',
    later: (lv) => `My chisel needs something you cannot fetch yet. Come back at Base Level ${lv}.`,
    bye: 'Mind the stones. They are older than they look.',
    quests: ['shades'],
    lore: [
      'These three stones are the Watchers. They have stood here since before the walls. When the jotnar stir, their runes glow brighter.',
      'They have been glowing for a month now.',
    ],
  },
  hrafn: {
    name: 'Hrafn the Stargazer', map: 'magic', x: 45.6, z: 52.2, look: 'bram',
    hello: 'Ah, a visitor. Have you looked up lately? Nobody looks up.',
    later: () => '', bye: 'Clear skies to you.',
    quests: [],
    lore: [
      'That red star low in the south is the Wolf\'s Eye. It burns brightest when the jotnar dream. It has never been as bright as it is this year.',
      'The night Wisps follow the stars, you know. They drift wherever the sky is clearest. Sigrun at Eldrun thinks they follow the wind. She is wrong, but kindly.',
    ],
  },
  signy: {
    name: 'Signy the Apprentice', map: 'magic', x: 36.6, z: 37.2, look: 'tilly',
    hello: 'Are you a sorcerer? I am going to be one! I can already make a spark. Mostly on purpose.',
    later: () => '', bye: 'Bye! Do not tell the Archmage about the scorch on the library door.',
    quests: [],
    lore: [
      'The crystal over the circle floats because the rune-well pushes it up. I tried to sit on it once. It does not hold people.',
      'Lorekeeper Brynja says there were nine giants. Torvald says nine is a lucky number. I think he only likes it because it is a rune.',
      'When I am Archmage I will make the Wisps glow in colours. Purple ones. And green ones.',
    ],
  },
  runa: {
    name: 'Runa the Gatewarden', map: 'magic', x: 28, z: 53, look: 'wren', warp: true,
    hello: 'Galdrheim\'s rune-gate can send you to any land you have walked, for a fee. The song is free; the upkeep is not.',
    later: () => '', bye: 'Step lightly through the gate.',
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
export const FARES = { camp: 300, city: 500, magic: 500, grove: 300, fen: 400, hollow: 600, birch: 700, coast: 900, ridge: 1200, deep: 1500, heath: 1800 };

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
    intro: 'Wisps drift all over the valley, and at night there are twice as many. I need to know where they nest. Catch fifteen of them for me.',
    thanks: 'A map of lights! It is beautiful. Keep these.',
    reward: { xp: 2000, perz: 800, items: { glow: 5, wander: 3 } },
  },
  // ---------- the job trials: three short steps each, easy for a Trainee of Base Level ~10 ----------
  blader_trial: {
    title: "Blader's Trial 1: Steel and Sweat", kind: 'kill', mob: 'slime', n: 10, lv: 1,
    intro: 'A Blader proves their sword first. Three tasks, all small, all honest. First: go to Mosvangr and beat ten Slimes. Mind your footing.',
    thanks: 'Ten Slimes and not one ran off with your sword. Good. Next task.',
    reward: { xp: 120, perz: 100 },
  },
  blader_trial2: {
    title: "Blader's Trial 2: Quick Feet", kind: 'kill', mob: 'sprout', n: 8, lv: 1,
    intro: 'A sword is no use if you cannot catch what you swing at. Sprouts run from anyone with a blade. Corner eight of them.',
    thanks: 'You can chase. Now let us see you stand your ground.',
    reward: { xp: 150, perz: 150 },
  },
  blader_trial3: {
    title: "Blader's Trial 3: The Fen Patrol", kind: 'kill', mob: 'crab', n: 5, lv: 1,
    intro: 'Last task. The Crabs of Fenstrand, west of the camp, charge in a straight line and pinch hard. Beat five of them and come back standing.',
    thanks: 'Not a scratch you could not live with. You have a Blader\'s arm.',
    reward: { xp: 250, perz: 300 },
  },
  sorcerer_trial: {
    title: 'Rune Trial 1: Water and Life', kind: 'fetch', items: { dew: 4, seed: 3 }, lv: 1,
    intro: 'Magic gathers in small things. First bring me four Water Drops from the Blue Slimes of Fenstrand, and three Seeds from the Sprouts.',
    thanks: 'Water and life. They hum in your hands; I can hear it from here. Next.',
    reward: { xp: 120, perz: 100 },
  },
  sorcerer_trial2: {
    title: 'Rune Trial 2: The Twice-Born', kind: 'kill', mob: 'blueSlime', n: 6, lv: 1,
    intro: 'A sorcerer must keep a cool head when one foe becomes two. The Blue Slimes of Fenstrand split when struck. Beat six of them.',
    thanks: 'You did not panic when they split. Most do. One more.',
    reward: { xp: 150, perz: 150 },
  },
  sorcerer_trial3: {
    title: 'Rune Trial 3: Light in the Dark', kind: 'fetch', items: { glow: 3 }, lv: 1,
    intro: 'Last, light. Wisps drift over the fields near the camp, most of all at night. Bring me three pinches of their Glow Dust.',
    thanks: 'Light, water and life... and they all answer you. The runes have spoken.',
    reward: { xp: 250, perz: 300 },
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
  // ---------- Galdrheim ----------
  tomes: {
    title: 'The Drowned Tomes', kind: 'fetch', items: { salt: 15, dew: 10 }, lv: 20,
    intro: 'A ship carrying our oldest books sank off Saltvik. The tomes have washed ashore, crusted with salt. To clean them I need fifteen handfuls of Salt from the Sea Slimes and ten Water Drops.',
    thanks: 'The ink is still there. Hallveig\'s own hand! Thank you.',
    reward: { xp: 7000, perz: 4000, items: { tonic: 5 } },
  },
  livingwood: {
    title: 'The Living Wood', kind: 'fetch', items: { heartwood: 1, thorn: 8 }, lv: 26,
    intro: 'The best staves are carved from wood that still lives. The Giant Sprout of Birkilund carries a root like that in its heart. Bring me a Giant Root, and eight Thorns to bind it.',
    thanks: 'It is still warm. I will make something good of this, and so will you.',
    reward: { xp: 14000, perz: 6000, items: { potion2: 8 } },
  },
  giantmother: {
    title: 'The Mother of Spores', kind: 'kill', mob: 'gloomMother', n: 1, lv: 40,
    intro: 'The Giant Mushroom of Svartskog has rooted itself on a rune-well. It drinks the song and breathes out rot. Destroy it, and the well will run clean.',
    thanks: 'I felt the well clear from here. You sing louder than you know.',
    reward: { xp: 60000, perz: 10000, items: { tonic: 10 } },
  },
  giantbeetle: {
    title: 'The Beetle of Askheid', kind: 'kill', mob: 'cinderLord', n: 1, lv: 46,
    intro: 'In Askheid a Giant Beetle burns the heath wherever it walks. It is the worst thing the Watch has seen. Kill it.',
    thanks: 'You did what the whole Watch could not. Steinborg owes you.',
    reward: { xp: 120000, perz: 15000, items: { potion3: 10 } },
  },
  shades: {
    title: 'Shadows in Svartskog', kind: 'fetch', items: { shade: 10 }, lv: 38,
    intro: 'Dark Wisps drift between the black trees of Svartskog. Bring me ten of their crystals; I carve their light into the Watchers. Mind: they come for you on sight.',
    thanks: 'Cold, and singing. The Watchers will be glad of them.',
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
      const series = n.trial, id = series.find((k) => !this.done.includes(k));
      if (!id) return { id: series.at(-1), q: QUESTS[series.at(-1)], state: 'job' }; // every step done
      const q = QUESTS[id];
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
