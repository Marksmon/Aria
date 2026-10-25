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
import { skillLv, secondJobOpen } from './skills.js';

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
    trial2: ['blademaster_trial', 'blademaster_trial2', 'blademaster_trial3'], job2: 'blademaster',
    trial2Hint: 'At Job Level 40 a Blader may take the BladeMaster\'s trial with me. If you walk the Sorcerer\'s path too, the sword must have more of your skill points than the staff.',
    hello: 'The Watch keeps the roads clear. Strong arms are always welcome.',
    later: (lv) => `Nothing for you yet. Report back at Base Level ${lv}.`,
    bye: 'The roads are safer for your blade. Well fought.',
    trialHint: 'Trainees who have learnt all their basics can take the Blader\'s Trial with me: Trainee Job Level 10 and Basic Training 9.',
    quests: ['kingcrab', 'giantbeetle'],
  },
  // the Keepers: one in the camp and in each city. Register with one to save there (where you wake
  // after fainting, and where a Return Feather takes you) and to be teleported to it by any other
  // Keeper you have registered with; each also keeps the storage chest and heals.
  keeper_camp: {
    name: 'Keeper Tova', x: 37.6, z: 30.8, look: 'wren', keeper: true,
    hello: 'I keep the fire\'s ledger. Sign it, and the fire remembers you: wake here after a fall, store your things, and walk the Keepers\' road to any town where you have signed.',
    later: () => '', bye: 'The fire remembers.', quests: [],
  },
  keeper_city: {
    name: 'Keeper Bera', map: 'city', x: 23.8, z: 32.4, look: 'ragna', keeper: true,
    hello: 'Steinborg\'s Keeper. Sign the ledger and Steinborg remembers you: rest here, store your things, and take the Keepers\' road between towns where you have signed.',
    later: () => '', bye: 'Steinborg remembers.', quests: [],
  },
  keeper_magic: {
    name: 'Keeper Asa', map: 'magic', x: 22.2, z: 46.0, look: 'embla', keeper: true,
    hello: 'Galdrheim\'s Keeper. The ledger here is written in runes, but your name will do. Sign, and the city remembers you.',
    later: () => '', bye: 'Galdrheim remembers.', quests: [],
  },
  // the Magic Knight's trainer: for heroes who have walked both the Blader's and the Sorcerer's path
  eirik: {
    name: 'Sir Eirik the Runeblade', map: 'city', x: 40.6, z: 50.2, look: 'ulfr',
    trial2: ['mknight_trial', 'mknight_trial2', 'mknight_trial3'], job2: 'magicknight',
    hello: 'Steel or song, they ask you, as if a hand could hold only one. I hold both. So could you.',
    later: () => '', bye: 'Keep your edge sharp and your runes sharper.',
    trialHint: 'The Magic Knight walks both paths. Pass the Blader\'s trial with Captain Ulfr and the Sorcerer\'s with Archmage Vigdis in Galdrheim, put at least 20 skill points into each, reach Job Level 40, and come back to me.',
    quests: [],
    lore: [
      'A Blader trusts the sword, a Sorcerer the song. A Magic Knight sings through the sword. Fire in the cut, frost in the thrust, thunder in the sweep.',
      'Switch from one element to the next and the runes keep pace: the chain grows hotter with every change.',
      'My aegis is half steel, half spell. The harder I hit and the louder I sing, the more it holds.',
    ],
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
  // smith: what they do to your gear (menus.js smith window): refine (Holger) or enchant (Seyla)
  holger: {
    name: 'Holger the Refiner', map: 'city', x: 47.2, z: 31.4, look: 'gunnar', smith: 'refine', shop: 'holger',
    hello: 'Gunnar makes gear; I make it better. Bring ore and perz and I hammer a piece up a level, up to +10. Up to a point it is safe. Past that, the metal decides, and sometimes it shatters.',
    later: () => '', bye: 'Strike while it is hot. And not before.',
    quests: [],
    lore: [
      'Iron Ore for the plain blades, Steel Ore for the better ones. I sell both. Hard Ore and Armor Ore you must take from the kobolds and goblins, and they do not give it up gladly.',
      'A Lv 1 blade is safe to +7, a Lv 4 only to +4, armor to +4. After that, think twice. I have swept up more broken swords than you have swung.',
      'My grandfather refined the Watch\'s blades for forty years. He said the trick is to stop one try before you want to. He never managed it either.',
    ],
  },
  // ---------- out in the fields (the story) ----------
  hakon: {
    name: 'Hakon the Carter', map: 'coast', x: 36.4, z: 52.6, look: 'gunnar',
    hello: 'Lost my cart, lost my horse, and I am not going back down that road alone.',
    later: () => '', bye: 'Mind the kobolds. They bite.',
    quests: [],
  },
  dag: {
    name: 'Dag the Miner', map: 'coalpit', x: 35.2, z: 10.4, look: 'gunnar',
    hello: 'Keep your voice down. The whole pit has ears.',
    later: () => '', bye: 'When the kobolds are free of the goblins, I will dig here again. Honest coal, the black kind.',
    quests: [],
  },
  liv: {
    name: 'Liv the Guide', map: 'city', x: 28.6, z: 52.8, look: 'hild',
    hello: 'New to Steinborg? Hild trades in the square, Gunnar forges in the east and Holger refines gear beside him, Ragna brews in the north-west, the Seeress keeps her tower in the north-east, and Ivar\'s carts wait by the square.',
    later: () => '', bye: 'The walls are strong and the beer is cold. Welcome.',
    quests: [],
  },
  // ---------- Galdrheim, the city of sorcerers ----------
  vigdis: {
    name: 'Archmage Vigdis', map: 'magic', x: 32, z: 20.8, look: 'saeunn', trial: ['sorcerer_trial', 'sorcerer_trial2', 'sorcerer_trial3'], job: 'mage',
    trial2: ['wizard_trial', 'wizard_trial2', 'wizard_trial3'], job2: 'wizard',
    trial2Hint: 'At Job Level 40 a Sorcerer may take the Wizard\'s trial with me. If you walk the Blader\'s path too, the staff must have more of your skill points than the sword.',
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
  seyla: {
    name: 'Seyla the Enchanter', map: 'magic', x: 49.4, z: 36.2, look: 'saeunn', smith: 'enchant',
    hello: 'I open a hollow in a great weapon, a slot, where a monster card can sleep. Only Lv 4 weapons are strong enough to hold one. Half the time the weapon takes the song; the other half it cracks apart.',
    later: () => '', bye: 'Bring me something worth the risk.',
    quests: [],
    lore: [
      'The price is steep: five Hard Ore, five Dark Crystals, the heart of a great beast, and fifty thousand perz. The song takes all of it, whether it holds or not.',
      'A card is a monster\'s strength pressed flat. The Kobold King\'s and the Goblin King\'s both sleep in a weapon. Once in, it never comes out, unless the weapon breaks; then you can pick the card out of the pieces.',
      'Vigdis thinks enchanting is a waste of good crystal. Vigdis has never seen a slotted sword cut through a Goblin King.',
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
export const FARES = { camp: 300, city: 500, magic: 500, grove: 300, fen: 400, hollow: 600, birch: 700, coast: 900, ridge: 1200, deep: 1500, heath: 1800, stones: 2000, coalpit: 2400, burnt: 2600, serpent: 3000 };

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
    title: 'Lights in the Dark', kind: 'kill', mob: 'wisp', n: 15, lv: 14,
    intro: 'Wisps drift all over the valley, and at night there are twice as many. I need to know where they nest. Catch fifteen of them for me.',
    thanks: 'A map of lights! It is beautiful. Keep these.',
    reward: { xp: 2000, perz: 800, items: { glow: 5, wander: 3 } },
  },
  // ---------- the job trials: three short steps each, easy for a Trainee of Base Level ~10 ----------
  // Each first-job trial needs one trip to the easy field beside its trainer: a hunt, something
  // made from what the hunt dropped, and the trainer's questions (kind 'quiz', answered in the talk
  // window: a wrong answer only gets a hint). The questions teach what new players miss.
  blader_trial: {
    title: "Blader's Trial 1: Steel and Sweat", job: true, kind: 'kill', mobs: { slime: 6, sprout: 4 }, lv: 1,
    intro: 'A Blader proves their sword first. Three tasks, all small, all honest. Go out through the south gate into Mosvangr and beat six Slimes and four Sprouts. Sprouts run from a blade, so corner them. And keep what they drop.',
    thanks: 'Back on your feet, and not a Slime left laughing. Good. Now show me what you brought back.',
    reward: { xp: 120, perz: 100 },
  },
  blader_trial2: {
    title: "Blader's Trial 2: Proof of the Hunt", job: true, kind: 'fetch', items: { gel: 5, seed: 3 }, lv: 1,
    intro: 'The Watch takes no one at their word. Bring me five Slime Gel and three Seeds as proof of your hunt. Slimes and Sprouts drop them; if you sold yours, Mosvangr has more.',
    thanks: 'Gel and seeds. Proof enough. Last task: a few questions, and mind your answers.',
    reward: { xp: 150, perz: 150, items: { potion: 5 } },
  },
  blader_trial3: {
    title: "Blader's Trial 3: The Captain's Questions", job: true, kind: 'quiz', lv: 1, task: "Answer Captain Ulfr's three questions",
    intro: 'A sword arm is half of a Blader. The other half is a head that knows when to swing.',
    questions: [
      { q: 'You strike a monster and it starts to wobble. What does that tell you?',
        options: ['It is calling its friends', 'It is nearly beaten', 'It is about to grow stronger'], a: 1,
        why: 'Right. Monsters show no health bars: a wobble means one or two more blows.',
        hint: 'Not that. Watch it closely next time: a wobbling monster has almost nothing left.' },
      { q: 'Your HP runs low in the middle of a fight. What do you do?',
        options: ['Walk away: HP comes back as you walk', 'Open the Status window', 'Tap a potion on the hotbar'], a: 2,
        why: 'Good. HP does not come back while you walk. Drink, or sit down and Rest once the fight is over.',
        hint: 'No. Walking heals nothing. What did the Elder have you put on your hotbar?' },
      { q: 'Which stat puts strength in a sword arm?',
        options: ['POW', 'KNL', 'FTN'], a: 0,
        why: 'POW it is. END keeps you standing, QKN and FNS help you land and dodge blows. KNL is for sorcerers.',
        hint: 'That one serves sorcerers or gamblers. The sword wants Power.' },
    ],
    thanks: 'A sword arm and a head on your shoulders. You have a Blader\'s arm.',
    reward: { xp: 250, perz: 300 },
  },
  sorcerer_trial: {
    title: 'Rune Trial 1: The Twice-Born', job: true, kind: 'kill', mob: 'blueSlime', n: 4, lv: 1,
    intro: 'A sorcerer must keep a cool head when one foe becomes two. The Blue Slimes of Fenstrand, just south of my gate, split when struck. Beat four of them, and gather the Slime Gel and Water Drops they leave.',
    thanks: 'You did not panic when they split. Most do. Now, what did they leave you?',
    reward: { xp: 120, perz: 100 },
  },
  sorcerer_trial2: {
    title: 'Rune Trial 2: The Blue Draught', job: true, kind: 'quiz', items: { gel: 3, dew: 2 }, lv: 1, task: 'brew a Blue Draught with Archmage Vigdis',
    intro: 'Every sorcerer brews before they cast. The Blue Draught: Water Drops in the pot first, then the Slime Gel, then stir it slowly, three times, the way the sun goes. Bring me three Slime Gel and two Water Drops and brew it with me.',
    questions: [
      { q: 'The pot is warm. What goes in first?',
        options: ['The Slime Gel', 'The Water Drops', 'Both at once'], a: 1,
        why: 'Yes: water first, always. It carries everything else.',
        hint: 'Too soon. Listen again: water carries everything else, so it goes in first.' },
      { q: 'The gel is in and the pot hisses. How do you stir?',
        options: ['Slowly, three times, the way the sun goes', 'Fast, until it foams', 'Not at all'], a: 0,
        why: 'Slowly, sunwise. See how it turns blue?',
        hint: 'The pot spits at you. Slowly, three times, the way the sun goes.' },
      { q: 'The draught glows blue. What will it give back to whoever drinks it?',
        options: ['HP, the strength to take blows', 'SP, the strength to cast', 'Speed, for running away'], a: 1,
        why: 'SP. Every spell spends it, and a sorcerer with none is only a person with a stick.',
        hint: 'Red heals wounds. Blue is for something a sorcerer spends with every spell.' },
    ],
    thanks: 'A good draught, and you made it yourself. Keep the bottles: you will need them. One more.',
    reward: { xp: 150, perz: 150, items: { tonic: 3 } },
  },
  sorcerer_trial3: {
    title: 'Rune Trial 3: The Rune Questions', job: true, kind: 'quiz', lv: 1, task: "Answer Archmage Vigdis's three questions",
    intro: 'Last, the runes themselves. Every monster has an element, and so does every spell.',
    questions: [
      { q: 'You cast a Fire spell on a Sprout. Sprouts are Earth. How does it land?',
        options: ['Strong: fire burns earth', 'Weak: earth smothers fire', 'Not at all'], a: 0,
        why: 'Strong, half again as hard. A strong hit shows in gold.',
        hint: 'Think of a forest fire. Fire burns earth and everything growing in it.' },
      { q: 'And Frost, which is Water, on a Crab of the fen, also Water?',
        options: ['Strong: water drowns it', 'It barely scratches', 'It heals the Crab'], a: 1,
        why: 'Barely a scratch: like against like. Weak hits show in grey. Pick another element.',
        hint: 'Can you drown a fish? Like against like barely scratches.' },
      { q: 'You are chanting a spell and a Slime hits you. What happens?',
        options: ['The spell casts anyway', 'The chant breaks', 'The Slime is frozen'], a: 1,
        why: 'The chant breaks. Cast from a distance, and Rune Ward, once you learn it, keeps the chant whole.',
        hint: 'No. A blow breaks your focus, and the chant with it.' },
    ],
    thanks: 'Water and life, fire and earth... and they all answer you. The runes have spoken.',
    reward: { xp: 250, perz: 300 },
  },
  // ---------- the second jobs: three harder steps each, from Job Level 40 of a first job ----------
  blademaster_trial: {
    title: 'BladeMaster Trial 1: The Goblin Line', job: true, kind: 'kill', mob: 'goblinWarrior', n: 30, lv: 1,
    intro: 'A BladeMaster ends a fight before it begins. Thirty Goblins hold the burnt wood of Brennholt, east of Askheid. Cut through them.',
    thanks: 'Thirty, and you are still standing straight. Next, speed.',
    reward: { xp: 15000, perz: 3000 },
  },
  blademaster_trial2: {
    title: 'BladeMaster Trial 2: Faster than Knives', job: true, kind: 'kill', mob: 'koboldAssassin', n: 20, lv: 1,
    intro: 'The Kobold Assassins of Grjotvangr and Kolgrof dart in and out like wasps. Twenty of them. If you can catch those, you can catch anything.',
    thanks: 'Quick hands. Quicker than mine, these days. One last test.',
    reward: { xp: 20000, perz: 4000 },
  },
  blademaster_trial3: {
    title: 'BladeMaster Trial 3: The Burning Shell', job: true, kind: 'kill', mob: 'cinderLord', n: 1, lv: 1,
    intro: 'The Giant Beetle of Askheid. Alone. One target, one blade, until it falls.',
    thanks: 'You did not flinch once. Kneel; rise a BladeMaster.',
    reward: { xp: 30000, perz: 6000 },
  },
  wizard_trial: {
    title: 'Wizard Trial 1: Fire and Shadow', job: true, kind: 'fetch', items: { ember_dust: 10, shade: 10 }, lv: 1,
    intro: 'A Wizard commands every element, not just a favourite. Bring me ten pinches of Fire Dust from the Fire Wisps of Askheid and ten Dark Crystals from the Dark Wisps of Svartskog.',
    thanks: 'Fire and shadow in one pouch, and you did not burn yourself. Next.',
    reward: { xp: 15000, perz: 3000 },
  },
  wizard_trial2: {
    title: 'Wizard Trial 2: Arrows in the Wind', job: true, kind: 'kill', mob: 'goblinArcher', n: 25, lv: 1,
    intro: 'The Goblin Archers of Brennholt shoot from range, as we do. Out-cast twenty-five of them.',
    thanks: 'They never came close. That is the point. One more.',
    reward: { xp: 20000, perz: 4000 },
  },
  wizard_trial3: {
    title: 'Wizard Trial 3: The Rotting Well', job: true, kind: 'kill', mob: 'gloomMother', n: 1, lv: 1,
    intro: 'The Giant Mushroom of Svartskog chokes a rune-well. Burn it, freeze it, break it: any element you like, as long as it falls.',
    thanks: 'The well sings again. So, Wizard, do you.',
    reward: { xp: 30000, perz: 6000 },
  },
  mknight_trial: {
    title: 'Magic Knight Trial 1: Steel', job: true, kind: 'kill', mob: 'koboldWarrior', n: 30, lv: 1,
    intro: 'First, steel. Thirty Kobolds in the hills of Grjotvangr, south of Saltvik. Sword in hand.',
    thanks: 'Your sword arm is sound. Now the other half.',
    reward: { xp: 15000, perz: 3000 },
  },
  mknight_trial2: {
    title: 'Magic Knight Trial 2: Song', job: true, kind: 'fetch', items: { shade: 10, glow: 15 }, lv: 1,
    intro: 'Then, song. Ten Dark Crystals and fifteen pinches of Glow Dust: I etch the runes of your blade with them.',
    thanks: 'They hum when they touch. Good. Last, both at once.',
    reward: { xp: 20000, perz: 4000 },
  },
  mknight_trial3: {
    title: 'Magic Knight Trial 3: Steel and Song', job: true, kind: 'kill', mob: 'tideKing', n: 1, lv: 1,
    intro: 'The King Crab of Saltvik: a shell no sword cuts and no spell burns. Both together will. Bring it down.',
    thanks: 'Steel and song, as one. Rise, Magic Knight.',
    reward: { xp: 30000, perz: 6000 },
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

// quests that come in a series (the job trials): each step's next one, accepted as soon as it is
// handed in. The steps on the way give nothing; the last one pays the whole series' reward.
export const NEXT = {}, SERIES = {};
for (const n of Object.values(NPCS)) {
  for (const list of [n.trial, n.trial2]) list?.forEach((id, i) => { SERIES[id] = list; if (list[i + 1]) NEXT[id] = list[i + 1]; });
}
// what handing a quest in pays: null for a step on the way, the series' total for its last step
export function rewardOf(id) {
  const list = SERIES[id];
  if (!list) return QUESTS[id].reward;
  if (NEXT[id]) return null;
  const sum = { xp: 0, perz: 0, items: {} };
  for (const k of list) {
    const r = QUESTS[k].reward;
    sum.xp += r.xp || 0; sum.perz += r.perz || 0;
    for (const [item, n] of Object.entries(r.items || {})) sum.items[item] = (sum.items[item] || 0) + n;
  }
  return sum;
}
// who gives a quest
export const giverOf = (id) => Object.keys(NPCS).find((n) => NPCS[n].quests.includes(id) || NPCS[n].trial?.includes(id) || NPCS[n].trial2?.includes(id));

// a fresh quest's progress: zones visited, kills per monster (a hunt of several kinds), or a count
// (kills, or a quiz's questions answered)
const fresh = (q) => (q.kind === 'visit' ? [] : q.mobs ? {} : 0);
const plural = (n, name) => `${n} ${name}${n > 1 && !name.endsWith('s') ? 's' : ''}`;

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
    const series = (list, done) => {
      const id = list.find((k) => !this.done.includes(k));
      if (!id) return done;
      const q = QUESTS[id];
      if (id in this.active) return { id, q, state: this.ready(id, inv) ? 'ready' : 'active' };
      return { id, q, state: 'offer' };
    };
    // a first job's trial: for a Trainee ready for it, or a hero of the other first job walking this path too
    if (n.trial && !prog.unlocked.includes(n.job)
      && (prog.job === 'novice' ? prog.jobLv >= 10 && skillLv(prog, 'basics') >= 9 : prog.tier === 1)) {
      const st = series(n.trial, { id: n.trial.at(-1), q: QUESTS[n.trial.at(-1)], state: 'job', job: n.job });
      return { ...st, job: n.job };
    }
    // a second job's trial: from Job Level 40, by the rules in skills.js (secondJobOpen). Only one
    // can be taken: once a step of one is accepted, the others close
    const chosen = Object.values(NPCS).some((o) => o.trial2 && o !== n && o.trial2.some((k) => k in this.active || this.done.includes(k)));
    if (n.trial2 && !chosen && secondJobOpen(prog, n.job2)) {
      return { ...series(n.trial2, { id: n.trial2.at(-1), q: QUESTS[n.trial2.at(-1)], state: 'job' }), job: n.job2 };
    }
    const id = n.quests.find((k) => !this.done.includes(k));
    if (!id) return { state: 'finished' };
    const q = QUESTS[id];
    if (id in this.active) return { id, q, state: this.ready(id, inv) ? 'ready' : 'active' };
    return { id, q, state: prog.baseLv >= q.lv ? 'offer' : 'locked' };
  }

  accept(id) {
    if (QUESTS[id] && !(id in this.active) && !this.done.includes(id)) {
      this.active[id] = fresh(QUESTS[id]);
    }
  }

  // every item the quest asks for is in the bag (true when it asks for none)
  hasItems(id, inv) {
    const q = QUESTS[id];
    return !q.items || Object.entries(q.items).every(([item, n]) => inv.have(item) >= n);
  }

  ready(id, inv) {
    const q = QUESTS[id], a = this.active[id];
    if (q.kind === 'kill') return q.mobs ? Object.entries(q.mobs).every(([m, n]) => (a[m] || 0) >= n) : a >= q.n;
    if (q.kind === 'visit') return q.zones.every((z) => a.includes(z));
    if (q.kind === 'quiz') return a >= q.questions.length && this.hasItems(id, inv);
    return this.hasItems(id, inv);
  }

  // a quiz answer: { ok, note }. A right one moves on to the next question; a wrong one only
  // earns a hint, so the question can be tried again
  answer(id, choice) {
    const q = QUESTS[id], a = this.active[id];
    if (q?.kind !== 'quiz' || !(id in this.active) || a >= q.questions.length) return null;
    const Q = q.questions[a];
    if (choice !== Q.a) return { ok: false, note: Q.hint };
    this.active[id] = a + 1;
    return { ok: true, note: Q.why };
  }

  // returns the ids of quests that just became complete
  onKill(type) {
    const out = [];
    for (const [id, a] of Object.entries(this.active)) {
      const q = QUESTS[id];
      if (q.kind !== 'kill') continue;
      if (q.mobs) { // a hunt of several kinds
        if (!q.mobs[type] || (a[type] || 0) >= q.mobs[type]) continue;
        a[type] = (a[type] || 0) + 1;
        if (this.ready(id)) out.push(id);
        continue;
      }
      if (q.mob !== type || a >= q.n) continue;
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
    if (q.kind !== 'kill' && q.items) for (const [item, n] of Object.entries(q.items)) inv.spend(item, n); // fetch, or a quiz's ingredients
    delete this.active[id];
    this.done.push(id);
    return rewardOf(id) || {}; // a trial's steps on the way pay nothing
  }

  // give a quest up. A job trial starts over from its first step, and its choice is undone: with
  // no second-job trial under way, any trial the hero qualifies for can be picked again
  quit(id) {
    if (!(id in this.active)) return false;
    delete this.active[id];
    if (SERIES[id]) this.done = this.done.filter((k) => !SERIES[id].includes(k));
    return true;
  }

  // short progress text for the tracker and dialogue
  progress(id, inv) {
    const q = QUESTS[id], a = this.active[id];
    if (q.kind === 'kill' && q.mobs) return Object.entries(q.mobs).map(([m, n]) => `${MOB_DEFS[m].name} ${Math.min(a[m] || 0, n)}/${n}`).join(' · ');
    if (q.kind === 'kill') return `${MOB_DEFS[q.mob].name} ${Math.min(a, q.n)}/${q.n}`;
    if (q.kind === 'visit') return `Zones ${a.length}/${q.zones.length}`;
    if (q.kind === 'quiz' && !this.hasItems(id, inv)) return this.itemsLine(q, inv);
    if (q.kind === 'quiz') return `Questions ${Math.min(a, q.questions.length)}/${q.questions.length}`;
    return this.itemsLine(q, inv);
  }

  itemsLine(q, inv) {
    return Object.entries(q.items).map(([item, n]) => `${ITEMS[item].name} ${Math.min(inv.have(item), n)}/${n}`).join(' · ');
  }

  goal(q) {
    if (q.kind === 'kill' && q.mobs) return 'Defeat ' + Object.entries(q.mobs).map(([m, n]) => plural(n, MOB_DEFS[m].name)).join(' and ');
    if (q.kind === 'kill') return `Defeat ${plural(q.n, MOB_DEFS[q.mob].name)}`;
    if (q.kind === 'visit') return `Visit ${q.zones.map((z) => ZONE_NAMES[z]).join(', ')}`;
    const bring = q.items ? 'Bring ' + Object.entries(q.items).map(([item, n]) => `${n} ${ITEMS[item].name}`).join(', ') : '';
    if (q.kind === 'quiz') return bring ? `${bring}, then ${q.task}` : q.task;
    return bring;
  }

  // v2: the first-job trials became hunts and quizzes. An older save's count on a step that is now
  // a quiz was kills or nothing, so its questions start from the first
  toJSON() { return { v: 2, active: this.active, done: this.done }; }
  load(d) {
    if (!d) return;
    this.done = (d.done || []).filter((id) => QUESTS[id]);
    for (const [id, a] of Object.entries(d.active || {})) {
      if (!QUESTS[id] || this.done.includes(id)) continue;
      const q = QUESTS[id];
      if (q.kind === 'visit') this.active[id] = Array.isArray(a) ? a : [];
      else if (q.mobs) this.active[id] = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
      else this.active[id] = q.kind === 'quiz' && (d.v || 1) < 2 ? 0 : Math.max(0, a | 0);
    }
  }
}
