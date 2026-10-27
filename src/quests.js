// The people of Eldrun Camp and Steinborg, and their quest chains. Each offers one quest at a
// time, in order; later quests wait for a player level. Quest kinds:
//   kill  - beat n monsters of a type (counted from when you accept)
//   fetch - bring items (taken from bag + chest when you hand in)
//   visit - set foot in every listed zone
// map: where they stand (camp unless given). shop: they buy and sell (items.js SHOPS).
// greet(c): an optional line that changes with the hero (c: job, jobId, tier, baseLv, ch = story chapter),
// said in place of hello and bye
// craft: they craft ('gear' or 'use' recipes). trial: a job trial for Trainees (Job Lv 10,
// Basic Training 9), a short series of quests one after another, and the job it opens once the last
// is done. heal: mends you for free. warp: the
// Ferryman (FARES). look: whose sprite they borrow until they have their own.
import { ITEMS } from './items.js';
import { MOB_DEFS } from './mobs.js';
import { ZONE_NAMES } from './world.js';
import { skillLv, secondJobOpen } from './skills.js';

// People with no sprite of their own are dressed from a bald body (sprites.js person): body, cloth
// colours ([hue, saturation, lightness factor]), hair, dye, and headgear (top, face). Nobody's look
// repeats, except a role any town can have: its people share the role's look
const ROLE = {
  keeper: { body: 'butler', hair: 'mane', dye: 'black' },                                                              // the Keepers: a butler in black (butler.js)
  smith: { body: 'blader', main: [24, 0.55, 0.9], accent: [40, 0.85, 1.05], hair: 'messy', dye: 'black', face: 'round_glasses' }, // Holger and Seyla: forge leather and brass
  ferry: { body: 'trainee', main: [200, 0.5, 1], accent: [180, 0.5, 1.1], hair: 'messy', dye: 'blue', top: 'woven_cap' },   // the carters and gate-wardens who send you on
  sentry: { body: 'blader', main: [100, 0.4, 0.75], accent: [30, 0.55, 0.9], hair: 'messy', dye: 'brown', top: 'woven_cap', bow: true }, // Veidheim's archers on watch
};
export const NPCS = {
  bram: {
    name: 'Elder Halvard', x: 27.9, z: 31.9,
    hello: 'The valley is restless these days. Young legs like yours could help an old man.',
    later: (lv) => `Rest now. Come back to me when you reach Base Level ${lv}.`,
    bye: 'You have done this valley a great kindness. Sit by the fire whenever you like.',
    greet: (c) => (c.ch >= 5 ? 'The fire burns high again, thanks to you. Even so, my old bones feel trouble on the roads.'
      : c.tier === 2 ? `A ${c.job}! The songs will have your name in them yet.`
      : c.jobId === 'swordman' ? 'A Blader now! I always knew that practice sword wanted to be more than a stick.'
      : c.jobId === 'mage' ? 'A Sorcerer! Mind the tents when you practise, child.'
      : c.jobId === 'archer' ? 'An Archer! Point that thing at the wolves, not at my tent.' : null),
    quests: ['warden'],
    // a Trainee ready for a job is sent on to Steinborg
    ready: 'You have learnt all a Trainee can. For the blade, go north through Moss Field to Steinborg: Captain Ulfr trains Bladers. For sorcery, go west to Fen Shore and north to Galdrheim, the city of sorcerers. For the bow, go east past the Red Sprouts to Birch Grove and on through Willow Marsh to Veidheim: Huntmaster Sigrid trains Archers.',
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
    name: 'Gyda the Healer', x: 29.6, z: 35.8, dress: { body: 'trainee', main: [0, 0.04, 1.7], accent: [355, 0.65, 1.05], hair: 'mane', dye: 'red', top: 'flower_wreath' }, heal: true,
    hello: 'Hurt? Sit down, let me see. Nobody leaves my fire bleeding.',
    later: () => '', bye: 'There. Good as new. Try to stay that way.',
    quests: [],
  },

  // ---------- Steinborg ----------
  hild: {
    name: 'Hild the Trader', map: 'city', x: 26.6, z: 27.4, shop: 'hild',
    hello: 'Welcome to Steinborg market! Potions, herbs, feathers. And I buy whatever you drag in from the wilds.',
    later: (lv) => `I will have work for you at Base Level ${lv}. Meanwhile, shop away!`,
    bye: 'Good trading, friend. Mind your purse on the road.',
    greet: (c) => (c.baseLv >= 30 ? 'My best customer! The wilds must be paying you well.' : null),
    quests: ['pearls'],
  },
  gunnar: {
    name: 'Gunnar the Gear Crafter', map: 'city', x: 43.2, z: 30.4, shop: 'gunnar', craft: 'gear',
    hello: 'Bring me materials and I forge them into gear: blades, staves, armor, charms. Or buy what I have on the rack.',
    later: (lv) => `I will have a job for you at the forge once you reach Base Level ${lv}.`,
    bye: 'Keep that edge sharp.',
    greet: (c) => (c.baseLv >= 40 ? 'Back again? That gear has seen some fighting. Let us see what I can do with it.'
      : c.jobId === 'swordman' ? 'A Blader needs good steel. Have a look at the rack.' : null),
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
    greet: (c) => ({ blademaster: 'BladeMaster. You outrank half my Watch now, and they know it.',
      wizard: 'Archmage Vigdis\'s Wizard. Keep your storms off my walls.',
      magicknight: 'Sword and song both. Sir Eirik must be proud.',
      swordman: 'One of the Watch\'s own Bladers. Stand straight.',
      mage: 'A Sorcerer at my gate. The Watch could use a few spells.' })[c.jobId] || null,
    trialHint: 'Trainees who have learnt all their basics can take the Blader\'s Trial with me: Trainee Job Level 10 and Basic Training 9.',
    quests: ['kingcrab', 'giantbeetle'],
  },
  // the Keepers: one in the camp and in each city. Register with one to save there (where you wake
  // after fainting, and where a Return Feather takes you) and to be teleported to it by any other
  // Keeper you have registered with; each also keeps the storage chest and heals.
  keeper_camp: {
    name: 'Keeper', x: 37.6, z: 30.8, dress: ROLE.keeper, keeper: true,
    hello: 'I keep the fire\'s ledger. Sign it, and the fire remembers you: wake here after a fall, store your things, and walk the Keepers\' road to any town where you have signed.',
    later: () => '', bye: 'The fire remembers.', quests: [],
  },
  keeper_city: {
    name: 'Keeper', map: 'city', x: 23.8, z: 32.4, dress: ROLE.keeper, keeper: true,
    hello: 'Steinborg\'s Keeper. Sign the ledger and Steinborg remembers you: rest here, store your things, and take the Keepers\' road between towns where you have signed.',
    later: () => '', bye: 'Steinborg remembers.', quests: [],
  },
  keeper_magic: {
    name: 'Keeper', map: 'magic', x: 22.2, z: 46.0, dress: ROLE.keeper, keeper: true,
    hello: 'Galdrheim\'s Keeper. The ledger here is written in runes, but your name will do. Sign, and the city remembers you.',
    later: () => '', bye: 'Galdrheim remembers.', quests: [],
  },
  // the Boatman of Salt Bay rows heroes out to Bloop Island, the first raid (raid.js)
  boatman: {
    name: 'Boatman', map: 'coast', x: 33.5, z: 40.5, raid: 'bloop',
    dress: { body: 'trainee', main: [28, 0.45, 0.7], accent: [205, 0.5, 1], hair: 'mane', dye: 'silver' }, // an old salt: oilskin browns, sea-blue trim
    hello: 'Out there, past the reeds: Bloop Island. The bloops have swarmed it under old BleepBloop, a bloop general with a white beard and a temper. Nobody fishes those waters now.',
    later: () => '', bye: 'Mind the tide.', quests: [],
  },
  // the Magic Knight's trainer: for heroes who have walked both the Blader's and the Sorcerer's path
  eirik: {
    name: 'Sir Eirik the Runeblade', map: 'city', x: 40.6, z: 50.2, dress: { body: 'mknight', main: [205, 0.45, 1], accent: [45, 0.8, 1.1], hair: 'mane', dye: 'silver', top: 'horned_helm' },
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
    greet: (c) => (c.tier === 2 ? 'The runes burn bright around you. Few in Aria cast so long a shadow.'
      : c.tier === 1 ? 'The runes changed when you chose your path. They speak of you more now.' : null),
    trialHint: 'Sorcery is taught in Galdrheim, north of Fen Shore. When your training is done (Trainee Job Level 10, Basic Training 9), go to Archmage Vigdis there. She was my teacher.',
    quests: [],
    lore: [
      'I learnt the runes in Galdrheim, at Vigdis\'s feet. I came to Steinborg because stone-folk need a seer more than sorcerers do.',
      'The Fire Giant is the last of the fire-jotnar. His kin burnt half the world before the first settlers sang them to sleep.',
      'Every rune on Eldrun\'s fire-ring was cut by a Galdrheim hand. When the fires fail, the runes fail with them.',
    ],
  },
  // the ferryman's carts take you to any land you have walked before, for perz (warp: the fare per map)
  ivar: {
    name: 'Ivar the Ferryman', map: 'city', x: 30.4, z: 38.6, dress: ROLE.ferry, warp: true,
    hello: 'My carts know every road you have walked. Pay the fare and save your boots.',
    later: () => '', bye: 'Safe roads.',
    quests: [],
  },
  // smith: what they do to your gear (menus.js smith window): refine (Holger) or enchant (Seyla)
  holger: {
    name: 'Holger the Refiner', map: 'city', x: 47.2, z: 31.4, dress: ROLE.smith, smith: 'refine', shop: 'holger',
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
    name: 'Hakon the Carter', map: 'coast', x: 12, z: 10, dress: { body: 'trainee', main: [8, 0.5, 1.05], accent: [35, 0.4, 1], hair: 'messy', dye: 'brown', top: 'woven_cap' },
    hello: 'Lost my cart, lost my horse, and I am not going back down that road alone.',
    later: () => '', bye: 'Mind the kobolds. They bite.',
    quests: [],
  },
  dag: {
    name: 'Dag the Miner', map: 'coalpit', x: 51, z: 28, dress: { body: 'trainee', main: [220, 0.08, 0.7], accent: [28, 0.6, 1], hair: 'messy', dye: 'red' },
    hello: 'Keep your voice down. The whole pit has ears.',
    later: () => '', bye: 'When the kobolds are free of the goblins, I will dig here again. Honest coal, the black kind.',
    quests: [],
  },
  liv: {
    name: 'Liv the Guide', map: 'city', x: 28.6, z: 52.8, dress: { body: 'trainee', main: [330, 0.5, 1.2], accent: [50, 0.6, 1.2], hair: 'mane', dye: 'blonde' },
    hello: 'New to Steinborg? Hild trades in the square, Gunnar forges in the east and Holger refines gear beside him, Ragna brews in the north-west, the Seeress keeps her tower in the north-east, and Ivar\'s carts wait by the square.',
    later: () => '', bye: 'The walls are strong and the beer is cold. Welcome.',
    retrain: true, // rethinks a hero's training: stats, and first-job skills (menus.js, skills.js unlearnFirstJob)
    quests: [],
  },
  // ---------- Galdrheim, the city of sorcerers ----------
  // a trainer in each city, beside the Keeper: stats and skills reset, like Liv in Steinborg
  ingrid: {
    name: 'Ingrid the Tutor', map: 'magic', x: 24.6, z: 46.0, dress: { body: 'sorc', main: [260, 0.3, 1.1], accent: [45, 0.6, 1.1], hair: 'long', dye: 'brown' },
    hello: 'I tutor the young sorcerers, and the not so young. If your training went wrong somewhere, sit down: we can start your stats or your skills over.',
    later: () => '', bye: 'Study well. And sleep sometimes.',
    retrain: true, quests: [],
  },
  vigdis: {
    name: 'Archmage Vigdis', map: 'magic', x: 28, z: 20.8, dress: { body: 'sorc', main: [215, 0.15, 1.55], accent: [46, 0.75, 1.05], hair: 'mane', dye: 'silver', top: 'ember_crown' }, trial: ['sorcerer_trial', 'sorcerer_trial2', 'sorcerer_trial3'], job: 'mage',
    trial2: ['wizard_trial', 'wizard_trial2', 'wizard_trial3'], job2: 'wizard',
    trial2Hint: 'At Job Level 40 a Sorcerer may take the Wizard\'s trial with me. If you walk the Blader\'s path too, the staff must have more of your skill points than the sword.',
    hello: 'Welcome to Galdrheim, child. Here we sing the world into shape; we call it galdr, the song-craft.',
    later: (lv) => `You are not ready for what I would ask. Come back at Base Level ${lv}.`,
    bye: 'Sing true, and the runes will answer.',
    greet: (c) => ({ mage: 'My student returns. Your song is steadier already.',
      swordman: 'A Blader in Galdrheim? Sit, but keep that sword sheathed near the crystals.',
      wizard: 'Wizard. The elements bend for you now. Do not let them bend you.',
      blademaster: 'BladeMaster. Your sword hums; I can hear it from here.',
      magicknight: 'Steel that sings. I taught half of that song.' })[c.jobId] || null,
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
    name: 'Seyla the Enchanter', map: 'magic', x: 49.4, z: 36.2, dress: ROLE.smith, smith: ['enchant', 'uncard'],
    hello: 'I open a hollow in a great weapon, a slot, where a monster card can sleep. Only Lv 4 weapons are strong enough to hold one. Half the time the weapon takes the song; the other half it cracks apart. And if a card no longer suits you, I can coax it back out, whole.',
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
    hello: 'Potions, feathers, and a little quickening for the impatient. Galdrheim prices, which is to say fair ones!',
    later: () => '', bye: 'Come back before your potions run dry!',
    quests: [],
    lore: [
      'Everything here is brewed in Galdrheim. The blue potions taste like cold rain. That is how you know they are real.',
      'Teleport Feathers come from the Wisps. Do not ask me how. The Lorekeeper asked once and she still has the hiccups.',
    ],
  },
  brynja: {
    name: 'Brynja the Lorekeeper', map: 'magic', x: 15.4, z: 37.4, dress: { body: 'sorc', main: [130, 0.4, 1.05], accent: [36, 0.55, 1], hair: 'mane', dye: 'red', face: 'round_glasses' },
    hello: 'Quiet, please. This is the oldest library north of the mountains.',
    later: (lv) => `I have a task for you, but not yet. Come back at Base Level ${lv}.`,
    bye: 'Return your books on time. All of them.',
    quests: ['tomes'],
    lore: [
      'The fire-jotnar were born when the world was young, from the fire under the mountains. They did not hate us. They simply burnt, the way fire does.',
      'There were nine great jotnar. Eight were sung into the stone long ago. The ninth, the one the settlers called the Ember Jarl, slept under Ember Hill. You know him as the Fire Giant.',
      'Our books say the fire-ring can be sung anew to keep him dreaming. But only beating the Giant in the waking world ends the danger for good. Sleeping, he cannot be harmed. Awake, he can.',
    ],
  },
  torvald: {
    name: 'Torvald the Runecarver', map: 'magic', x: 41.2, z: 46.8, dress: { body: 'blader', main: [170, 0.35, 0.95], accent: [200, 0.4, 1], hair: 'mane', dye: 'silver' },
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
    name: 'Hrafn the Stargazer', map: 'magic', x: 45.6, z: 52.2, dress: { body: 'sorc', main: [248, 0.6, 0.85], accent: [200, 0.3, 1.15], hair: 'messy', dye: 'black', face: 'raven_mask' },
    hello: 'Ah, a visitor. Have you looked up lately? Nobody looks up.',
    later: () => '', bye: 'Clear skies to you.',
    // the Moon Ranger: bow and spell under the moon, for heroes who walked the Sorcerer's and the Archer's paths
    trial2: ['moonranger_trial', 'moonranger_trial2', 'moonranger_trial3'], job2: 'moonranger',
    trial2Hint: 'I teach the Moon Ranger\'s way: the bow and the song together, under the moon. Walk the Sorcerer\'s path and the Archer\'s, put at least 20 skill points into each, reach Job Level 40, and come back to me at night or day; the stars keep.',
    greet: (c) => ({ moonranger: 'Moon Ranger. The sky has been brighter since you took up the bow. I am sure of it.',
      archer: 'An Archer who looks up! The stars are the best targets: they never move.',
      mage: 'A Sorcerer. Do your runes sing at night? Mine do.' })[c.jobId] || null,
    quests: [],
    lore: [
      'That red star low in the south is the Wolf\'s Eye. It burns brightest when the jotnar dream. It has never been as bright as it is this year.',
      'The night Wisps follow the stars, you know. They drift wherever the sky is clearest. Sigrun at Eldrun thinks they follow the wind. She is wrong, but kindly.',
    ],
  },
  signy: {
    name: 'Signy the Apprentice', map: 'magic', x: 36.6, z: 37.2, dress: { body: 'sorc', main: [300, 0.45, 1.15], accent: [330, 0.5, 1.1], hair: 'mane', dye: 'blonde' },
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
    name: 'Runa the Gatewarden', map: 'magic', x: 28, z: 53, dress: ROLE.ferry, warp: true,
    hello: 'Galdrheim\'s rune-gate can send you to any land you have walked, for a fee. The song is free; the upkeep is not.',
    later: () => '', bye: 'Step lightly through the gate.',
    quests: [],
  },
  // ---------- Veidheim, the hunters' village east of Black Wood ----------
  // Archers to a man and woman: most carry a longbow and a quiver on their backs (dress bow: bow.js)
  keeper_hunt: {
    name: 'Keeper', map: 'hunt', x: 24.2, z: 27.2, dress: ROLE.keeper, keeper: true,
    hello: 'Veidheim\'s Keeper. Even hunters need somewhere to come home to. Sign, and the village remembers you.',
    later: () => '', bye: 'Veidheim remembers.', quests: [],
  },
  sigrid: {
    name: 'Huntmaster Sigrid', map: 'hunt', x: 45, z: 21.2, dress: { body: 'blader', main: [110, 0.45, 0.8], accent: [35, 0.7, 1], hair: 'long', dye: 'red', top: 'woven_cap', bow: true },
    hello: 'Mind the line: arrows fly here. I am Sigrid, Huntmaster of Veidheim. Every one of us can put an arrow through a ring at fifty paces, and lately we need to.',
    trial: ['archer_trial', 'archer_trial2', 'archer_trial3'], job: 'archer',
    trial2: ['windrunner_trial', 'windrunner_trial2', 'windrunner_trial3'], job2: 'windrunner',
    trial2Hint: 'At Job Level 40 an Archer may take the Windrunner\'s trial with me. If you walk other paths too, the bow must have the most of your skill points.',
    trialHint: 'Trainees who have learnt all their basics can take the Archer\'s Trial with me: Trainee Job Level 10 and Basic Training 9.',
    later: (lv) => `The wilds out there would eat you alive. Come back at Base Level ${lv}.`,
    bye: 'Keep your eyes open and your string dry.',
    greet: (c) => ({ archer: 'One of mine. Shoulders down, elbow up, and breathe out as you loose.',
      windrunner: 'Windrunner. I blinked and you were somewhere else. Show-off.',
      swordman: 'A Blader. You walk right up to them? Brave. Strange, but brave.',
      mage: 'A Sorcerer. Your bolts fly well enough; ours just do not need a song.',
      blademaster: 'A BladeMaster. Pity about the sword; you would have made a fine archer.',
      wizard: 'A Wizard! Try not to set the targets on fire. Again.',
      magicknight: 'Sword and spell. Out here we would add a bow, but nobody is perfect.' })[c.jobId] || null,
    quests: ['elderwillow', 'wolfpack', 'alphawolf', 'ancienttreant'],
    lore: [
      'Veidheim was a hunting camp once, a few tents past Birch Grove. Then the farmers came for the soil, and the hunters stayed to keep the beasts off it.',
      'We had farms past Black Wood too: Barley Field, and the hills beyond it. The snakes and the wolves took them. The packs are never alone, and they come for you on sight.',
      'The trees of the Old Forest, north of the gate, walk, but they are gentle if you leave them be. The oldest of them, the Ancient Treant, walked away into Wolf Hills, and the beasts there follow it now.',
    ],
  },
  // the Beastmaster: sword and bow and three beasts, for heroes who walked the Blader's and the Archer's paths
  bjarki: {
    name: 'Bjarki the Beastmaster', map: 'hunt', x: 22.6, z: 20.6, pet: { art: 'allyWolfG', dx: 1.3, dz: 0.4 },
    dress: { body: 'blader', main: [25, 0.3, 0.55], accent: [30, 0.25, 0.9], hair: 'mane', dye: 'black' },
    trial2: ['beastmaster_trial', 'beastmaster_trial2', 'beastmaster_trial3'], job2: 'beastmaster',
    trial2Hint: 'Sword and bow both, and beasts at your side that answer you. Walk the Blader\'s path and the Archer\'s, put at least 20 skill points into each, reach Job Level 40, and come back to me. Grimr here will wait.',
    hello: 'Easy. Grimr does not bite, unless I ask him. I am Bjarki. The beasts out there are not all enemies; some of them only want someone worth following.',
    later: () => '', bye: 'Run with the pack.',
    greet: (c) => ({ beastmaster: 'Beastmaster. Your bear grows fat; you feed it too well. Good.',
      swordman: 'A Blader. Strong arm. Now find something to stand beside you.',
      archer: 'An Archer. You watch them from afar. Try walking with them.' })[c.jobId] || null,
    quests: [],
    lore: ['Grimr came to me as a cub, half dead in the snow past Black Wood. Now he eats better than I do.', 'A bear will stand in front of you, a wolf beside you, a hawk above you. Learn which you need, and when.'],
  },
  eydis: {
    name: 'Eydis the Trader', map: 'hunt', x: 38, z: 29, shop: 'eydis', dress: { body: 'trainee', main: [95, 0.35, 0.9], accent: [30, 0.6, 1.05], hair: 'long', dye: 'blonde' },
    hello: 'Asa sells the bows and arrows; everything else a hunter needs is here: White Potions, Honey, Speed Potions, feathers. And I buy pelts.',
    later: () => '', bye: 'Good hunting! Bring me back something furry.',
    quests: [],
    lore: ['Honey from the hills is the best medicine in Aria. The Bears agree, which is the trouble.'],
  },
  sven: {
    name: 'Sven the Trainer', map: 'hunt', x: 26.6, z: 27.2, dress: { body: 'blader', main: [100, 0.35, 0.85], accent: [30, 0.55, 1], hair: 'messy', dye: 'blonde' },
    hello: 'I drill the village archers, and I can drill the bad habits out of you too. Want your stats or your skills placed over again?',
    later: () => '', bye: 'Feet apart, elbow up. Off you go.',
    retrain: true, quests: [],
  },
  leif: {
    name: 'Leif the Tanner', map: 'hunt', x: 46, z: 42.6, craft: 'hunt', dress: { body: 'blader', main: [28, 0.5, 0.75], accent: [45, 0.4, 0.9], hair: 'messy', dye: 'black' },
    hello: 'Pelts, skins and bark: bring them to me and I make them into hunters\' gear. Cloaks, boots, charms, armor. It smells, but it holds. Bows are Asa\'s work: the fletcher\'s bench.',
    later: (lv) => `I will have work for you at Base Level ${lv}.`,
    bye: 'Wear it in the rain. Leather likes the rain.',
    quests: ['pelts', 'greatbear'],
    lore: ['A Wolf pelt for the warmth, a Snake skin for the quiet. A hunter wants both.', 'Old Bark from a Treant makes armor that grows back. I once had a breastplate sprout a leaf.'],
  },
  ottar: {
    name: 'Ottar the Farmer', map: 'hunt', x: 27.2, z: 46.2, dress: { body: 'trainee', main: [40, 0.35, 0.95], accent: [200, 0.35, 0.9], hair: 'messy', dye: 'silver', top: 'woven_cap' },
    hello: 'Barley in the field, cabbages in the yard and a windmill that never stops. Or it would be a good year, if it were not for the beasts.',
    later: (lv) => `There is always farm work. Come back at Base Level ${lv}.`,
    bye: 'Good soil and good neighbours. That is all a man needs.',
    quests: ['lambs', 'snakes'],
    lore: ['The archers keep the wolves off us. I keep the archers fed. It is a fair trade.'],
  },
  asa: {
    name: 'Asa the Fletcher', map: 'hunt', x: 35.4, z: 40.2, craft: 'bow', dress: { body: 'trainee', main: [140, 0.4, 0.85], accent: [10, 0.6, 1], hair: 'pony', dye: 'brown', bow: true },
    hello: 'I make the bows and arrows for the whole village, and sell them to anyone who can draw one. Bring me vines, shells, willow or steel and I will make you a better bow at my bench. A quiver lasts: we pick our arrows up again. And strap a small shield to your forearm: the hand still draws, and the arm is safer.',
    later: (lv) => `My wood is running low, but the woods are too dangerous for you yet. Base Level ${lv}, then.`,
    bye: 'Straight shafts, true flights.',
    quests: ['bowstaves'],
    shop: 'asa',
    lore: ['A walking Willow\'s twigs make the best bows: they still want to bend. You just have to catch the Willow first.', 'Sigrid shoots the farthest. I shoot the straightest. We do not talk about who wins.'],
  },
  bodil: {
    name: 'Bodil the Sentry', map: 'hunt', x: 49.4, z: 29.6, dress: ROLE.sentry,
    hello: 'From the tower you can see the Old Forest to the north and the marsh to the west. Quiet country, if you leave the trees alone. The wolves are far off, past Black Wood.',
    later: () => '', bye: 'I will be up there if you need me.', quests: [],
    lore: ['Every archer in Veidheim stands a watch on the tower. Even the Huntmaster. Especially the Huntmaster.'],
  },
  kalf: {
    name: 'Kalf the Gate Archer', map: 'hunt', x: 35.6, z: 12.6, dress: { ...ROLE.sentry, main: [80, 0.35, 0.7], dye: 'blonde' },
    hello: 'North is the Old Forest. The Treants there walk about like old men looking for their pipes. They will not touch you unless you start it.',
    later: (lv) => `The Treants hit like falling trees. Come back at Base Level ${lv}.`,
    bye: 'Mind the roots.', quests: ['treants'],
    lore: ['West is Willow Marsh, the way you came in. There is an old willow by the water, bigger than the rest: the Elder Willow, we call it. It does not like visitors.'],
  },
  halla: {
    name: 'Halla the Healer', map: 'hunt', x: 28.8, z: 36.8, heal: true, dress: { body: 'sorc', main: [150, 0.3, 1.2], accent: [40, 0.5, 1.1], hair: 'long', dye: 'green', top: 'flower_wreath' },
    hello: 'Bites, scratches, splinters from a Treant? Sit. Hunters come back in pieces, and I sew them together again.',
    later: () => '', bye: 'There. Try to keep the rest of your blood inside you.', quests: [],
  },
  finn: {
    name: 'Finn the Young Archer', map: 'hunt', x: 42.6, z: 24.8, dress: { body: 'trainee', main: [60, 0.5, 1.1], accent: [120, 0.5, 1], hair: 'messy', dye: 'red', bow: true },
    hello: 'I hit the middle ring yesterday! Well, the second ring. Well, the target.',
    later: () => '', bye: 'One day I will be Huntmaster!', quests: [],
    lore: ['Sigrid says a good archer breathes out before she shoots. I tried breathing in. It did not help.', 'Do you think the Ancient Treant is really a thousand years old? I bet it is more.'],
  },
  tove: {
    name: 'Tove the Carter', map: 'hunt', x: 35.6, z: 53, dress: ROLE.ferry, warp: true,
    hello: 'My cart runs to any land you have walked, for a fee. The oxen do not mind wolves. The wolves mind the oxen.',
    later: () => '', bye: 'Hold on to your hat.',
    quests: [],
  },
  bjorn: {
    name: 'Bjorn the Gate Guard', map: 'city', x: 55.2, z: 29.4, dress: { body: 'blader', main: [100, 0.35, 0.9], accent: [30, 0.7, 1], hair: 'messy', dye: 'blonde', top: 'horned_helm' },
    hello: 'Most beasts out there leave you be until you strike first. Not in Black Wood and Ash Heath: the dark wisps and the fire beasts come for you on sight. Nor past them, where the wolves run.',
    later: () => '', bye: 'Keep your guard up past the gate.',
    quests: [],
    lore: ['East through Birch Grove, past Willow Marsh, is Veidheim, the hunters\' village. Good folk, and every one of them can shoot the eye out of a sparrow.'],
  },

};

// the Ferryman's fares, by map (only lands you have already walked)
export const FARES = { camp: 300, city: 500, magic: 500, grove: 300, fen: 400, hollow: 600, birch: 700, coast: 900, ridge: 1200, deep: 1500, heath: 1800, stones: 2000, coalpit: 2400, burnt: 2600, serpent: 3000,
  marsh: 800, hunt: 900, oldwood: 1000, farm: 2400, wolfhill: 2400 };

// reward: { xp (Base EXP; Job EXP is 70% of it), perz, items: { id: n } }. Levels and EXP follow
// the Ragnarok curve at 1x: a quest is a big job, worth a fair share of a level.
export const QUESTS = {
  // ---------- Eldrun Camp: one big job each ----------
  warden: {
    title: 'The Mushroom Wood', kind: 'defend', map: 'hollow', at: { x: 32, z: 32 }, place: 'the old waystone', waves: [['mushling', 3], ['mushling', 4], ['mushling', 5]], lv: 12,
    intro: 'The Mushrooms of Dark Dale march on the camp road a little further every night. In the middle of the dale stands our old waystone. Stand by it and hold it against three waves of them. They hit back hard: bring potions.',
    thanks: 'Three waves, and the stone still stands. The air already smells cleaner. You have become a true guardian of Eldrun.',
    reward: { xp: 2500, perz: 1500, items: { potion2: 5 } },
  },

  feast: {
    title: 'A Feast for Eldrun', kind: 'quiz', items: { gel: 10, crableg: 5, spore: 5 }, lv: 10, task: 'cook the feast with Astrid',
    intro: "The camp hasn't feasted in a year! Bring me ten Bloop Gel, five Crab Legs from Fen Shore and five Spores from Dark Dale, and cook it with me. The secret: gel for the sauce, crab for the meat, and spores only at the very end, a pinch at a time.",
    questions: [
      { q: 'The pot is bubbling. What makes the sauce?', options: ['The Crab Legs', 'The Bloop Gel', 'The Spores'], a: 1,
        why: 'Gel! Sticky, sweet and thick. Into the pot it goes.', hint: 'No, no! Think sticky. What wobbles?' },
      { q: 'And the Spores?', options: ['All of them, right away', 'Never: they are poison', 'A pinch at a time, at the very end'], a: 2,
        why: 'A pinch at a time. Too many and the whole camp sneezes for a week.', hint: 'Careful! Remember what I said about the spores.' },
      { q: 'Hungry heroes on the road eat Crab Legs too. Why carry them?', options: ['They heal a good bite of HP', 'They make you run faster', 'Crabs follow you home'], a: 0,
        why: 'They heal! Better than a Berry and cheaper than a potion.', hint: 'Ha! No. What does food do for a hurt hero?' },
    ],
    thanks: 'Smell that! The whole camp will sing your name tonight. Take these, and a full belly.',
    reward: { xp: 1800, perz: 1000, items: { potion: 10 } },
  },

  lights: {
    title: 'The Lantern Wisp', kind: 'kill', mob: 'lanternWisp', n: 1, rare: { map: 'fen', x: 32, z: 26, night: true }, lv: 14,
    intro: 'The fishers of Fen Shore swear a great golden Wisp rises over the pond, but only at night. The old songs call it the Lantern Wisp. Find it, and bring it down before it drifts away at dawn. It is stronger than any Wisp you have seen.',
    thanks: 'The Lantern Wisp! Then the songs were true. Keep what it left you: they say it lights the darkest road.',
    reward: { xp: 2000, perz: 800, items: { glow: 5, wander: 3 } },
  },

  // ---------- the job trials: three short steps each, easy for a Trainee of Base Level ~10 ----------
  // Each first-job trial needs one trip to the easy field beside its trainer: a hunt, something
  // made from what the hunt dropped, and the trainer's questions (kind 'quiz', answered in the talk
  // window: a wrong answer only gets a hint). The questions teach what new players miss.
  blader_trial: {
    title: "Blader's Trial 1: Steel and Sweat", job: true, kind: 'kill', mobs: { slime: 6, sprout: 4 }, lv: 1,
    intro: 'A Blader proves their sword first. Three tasks, all small, all honest. Go out through the south gate into Moss Field and beat six Bloops and four Sprouts. Sprouts run from a blade, so corner them. And keep what they drop.',
    thanks: 'Back on your feet, and not a Bloop left laughing. Good. Now show me what you brought back.',
    reward: { xp: 120, perz: 100 },
  },
  blader_trial2: {
    title: "Blader's Trial 2: Proof of the Hunt", job: true, kind: 'fetch', items: { gel: 5, seed: 3 }, lv: 1,
    intro: 'The Watch takes no one at their word. Bring me five Bloop Gel and three Seeds as proof of your hunt. Bloops and Sprouts drop them; if you sold yours, Moss Field has more.',
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
    intro: 'A sorcerer must keep a cool head when one foe becomes two. The Blue Bloops of Fen Shore, just south of my gate, split when struck. Beat four of them, and gather the Bloop Gel and Water Drops they leave.',
    thanks: 'You did not panic when they split. Most do. Now, what did they leave you?',
    reward: { xp: 120, perz: 100 },
  },
  sorcerer_trial2: {
    title: 'Rune Trial 2: The Blue Draught', job: true, kind: 'quiz', items: { gel: 3, dew: 2 }, lv: 1, task: 'brew a Blue Draught with Archmage Vigdis',
    intro: 'Every sorcerer brews before they cast. The Blue Draught: Water Drops in the pot first, then the Bloop Gel, then stir it slowly, three times, the way the sun goes. Bring me three Bloop Gel and two Water Drops and brew it with me.',
    questions: [
      { q: 'The pot is warm. What goes in first?',
        options: ['The Bloop Gel', 'The Water Drops', 'Both at once'], a: 1,
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
      { q: 'You are chanting a spell and a Bloop hits you. What happens?',
        options: ['The spell casts anyway', 'The chant breaks', 'The Bloop is frozen'], a: 1,
        why: 'The chant breaks. Cast from a distance, and Rune Ward, once you learn it, keeps the chant whole.',
        hint: 'No. A blow breaks your focus, and the chant with it.' },
    ],
    thanks: 'Water and life, fire and earth... and they all answer you. The runes have spoken.',
    reward: { xp: 250, perz: 300 },
  },
  archer_trial: {
    title: "Archer's Trial 1: The Yellow Marks", job: true, kind: 'kill', mob: 'yellowSlime', n: 5, lv: 1,
    intro: 'An archer\'s first marks hop. Go back west into Willow Marsh and put down five Yellow Bloops. Keep your distance: let them come to you, and they never reach you. Keep the gel they drop, too.',
    thanks: 'Five, and you are not even sticky. Now, the gel.',
    reward: { xp: 120, perz: 100 },
  },
  archer_trial2: {
    title: "Archer's Trial 2: Waxing the String", job: true, kind: 'quiz', items: { gel: 5 }, lv: 1, task: 'wax a bowstring with Huntmaster Sigrid',
    intro: 'A dry string snaps, a wet one sags. We wax ours with Bloop Gel, boiled down. Bring me five Bloop Gel and wax a string with me: warm the gel, rub it in from the middle out, then rub it again with a scrap of leather until the string is warm.',
    questions: [
      { q: 'The gel is warm. Where do you start rubbing it in?',
        options: ['At the top of the string', 'In the middle, working out', 'Only near the arrow'], a: 1,
        why: 'From the middle, out to each end. The string wears evenly that way.',
        hint: 'Not there. Listen again: the middle first, then out to each end.' },
      { q: 'The wax is on. What do you rub it with?',
        options: ['A scrap of leather, until the string is warm', 'Nothing: leave it to dry', 'Water, to cool it'], a: 0,
        why: 'Leather, until it is warm. The heat works the wax into every strand.',
        hint: 'Water and wax do not mix. Leather, until the string is warm.' },
      { q: 'And why do we wax it at all?',
        options: ['It shoots fire', 'It keeps the string from drying and snapping', 'It smells nice'], a: 1,
        why: 'A dry string snaps at the worst time. A waxed one lasts a season.',
        hint: 'Fire is a matter of arrows, not wax. A dry string snaps.' },
    ],
    thanks: 'A good string, and you waxed it yourself. One last thing: the questions every hunter here has answered.',
    reward: { xp: 150, perz: 150, items: { potion: 5 } },
  },
  archer_trial3: {
    title: "Archer's Trial 3: The Huntmaster's Questions", job: true, kind: 'quiz', lv: 1, task: "Answer Huntmaster Sigrid's three questions",
    intro: 'A good eye is half an archer. The rest is knowing where to stand and what to load.',
    questions: [
      { q: 'How close must you be to shoot a monster with a bow?',
        options: ['Right beside it, like a sword', 'About five paces away', 'Anywhere on the map'], a: 1,
        why: 'Five paces, a little more with Long Sight. Shoot before they reach you.',
        hint: 'No. A bow reaches about five paces: far enough to shoot first.' },
      { q: 'You fight a Willow. Willows are Earth. Which arrows do you load?',
        options: ['Fire Arrows: fire burns earth', 'Earth Arrows: like for like', 'It makes no difference'], a: 0,
        why: 'Fire Arrows. The arrows in your Arrows slot set the element of every shot.',
        hint: 'Like against like barely scratches. What burns earth?' },
      { q: 'A Wolf is on you and you have no room to shoot. What do you do?',
        options: ['Stand and trade blows', 'Leap Back, then shoot again', 'Drop the bow'], a: 1,
        why: 'Leap Back: a hop of three paces, and you are shooting again. You learn it at Job Level 10.',
        hint: 'An archer in a brawl is an archer losing. Get your distance back.' },
    ],
    thanks: 'A keen eye and a cool head. Welcome to the hunt, Archer.',
    reward: { xp: 250, perz: 300 },
  },
  // ---------- the second jobs: three harder steps each, from Job Level 40 of a first job ----------
  beastmaster_trial: {
    title: 'Beastmaster Trial 1: Know the Pack', job: true, kind: 'kill', mob: 'wolf', n: 15, lv: 1,
    intro: 'To lead a pack you must know one. Fifteen Wolves, in Barley Field or Wolf Hills. Watch how they circle before they bite, and do it first.',
    thanks: 'You have their smell on you now. Good. Next, the bigger beasts.',
    reward: { xp: 15000, perz: 3000 },
  },
  beastmaster_trial2: {
    title: 'Beastmaster Trial 2: The Weight of a Bear', job: true, kind: 'kill', mob: 'bear', n: 10, lv: 1,
    intro: 'Ten Bears of Wolf Hills. A bear does not hurry and does not stop. Learn to stand against that, because one day one will stand for you.',
    thanks: 'Ten. And you are still standing. A bear would respect that. One more.',
    reward: { xp: 20000, perz: 4000 },
  },
  beastmaster_trial3: {
    title: 'Beastmaster Trial 3: The Great Bear', job: true, kind: 'kill', mob: 'greatBear', n: 1, lv: 1,
    intro: 'The Great Bear rules Wolf Hills. Beat it, and every beast in the hills will know your name. Come back to me after.',
    thanks: 'The hills are quiet. Listen: that is the sound of beasts deciding to follow you. Rise, Beastmaster.',
    reward: { xp: 30000, perz: 6000 },
  },
  moonranger_trial: {
    title: 'Moon Ranger Trial 1: Shadows under the Moon', job: true, kind: 'kill', mob: 'shadeWisp', n: 20, lv: 1,
    intro: 'The moon\'s light falls hardest on what hides from it. Twenty Dark Wisps drift in Black Wood, east of Dark Dale. Put them out, arrow and spell together.',
    thanks: 'Twenty little shadows, gone out. Now the opposite: the things that burn too bright.',
    reward: { xp: 15000, perz: 3000 },
  },
  moonranger_trial2: {
    title: 'Moon Ranger Trial 2: Embers that Fly', job: true, kind: 'kill', mob: 'emberWisp', n: 10, lv: 1,
    intro: 'Ten Fire Wisps of Ash Heath. They burn like small suns, and the moon has no love for suns. Cool them.',
    thanks: 'Well shot. The heath is a little darker, and that is no bad thing. One more.',
    reward: { xp: 20000, perz: 4000 },
  },
  moonranger_trial3: {
    title: 'Moon Ranger Trial 3: The Spore Mother', job: true, kind: 'kill', mob: 'gloomMother', n: 1, lv: 1,
    intro: 'The Giant Mushroom of Black Wood clouds the sky with its spores, and I cannot see my stars. Bring it down and come back to me.',
    thanks: 'Clear skies again. Kneel... no, look up. There. Rise, Moon Ranger.',
    reward: { xp: 30000, perz: 6000 },
  },
  windrunner_trial: {
    title: 'Windrunner Trial 1: Run with the Pack', job: true, kind: 'kill', mob: 'wolf', n: 20, lv: 1,
    intro: 'A Windrunner is never where the claws land. The Wolves of Barley Field, past Black Wood, run in packs and come on sight. Twenty of them, and do not let them corner you: shoot, step, shoot.',
    thanks: 'Twenty, and not a scratch on your back. Next, something that waits instead of running.',
    reward: { xp: 15000, perz: 3000 },
  },
  windrunner_trial2: {
    title: 'Windrunner Trial 2: Grass that Bites', job: true, kind: 'kill', mob: 'snake', n: 10, lv: 1,
    intro: 'The Snakes in the barley strike from where you cannot see them. Ten of them. Keep moving and keep your distance; a Windrunner who stands still is a Snake\'s supper.',
    thanks: 'Quick feet, quicker string. One last hunt.',
    reward: { xp: 20000, perz: 4000 },
  },
  windrunner_trial3: {
    title: 'Windrunner Trial 3: The Leader of the Pack', job: true, kind: 'kill', mob: 'alphaWolf', n: 1, lv: 1,
    intro: 'The Alpha Wolf leads the packs of Barley Field. It pounces from afar and calls its Wolves. Outrun it, outshoot it, and come back to me.',
    thanks: 'The Alpha, down. The wind has chosen you. Rise, Windrunner.',
    reward: { xp: 30000, perz: 6000 },
  },
  blademaster_trial: {
    title: 'BladeMaster Trial 1: The Goblin Line', job: true, kind: 'kill', mob: 'goblinWarrior', n: 30, lv: 1,
    intro: 'A BladeMaster ends a fight before it begins. Thirty Goblins hold the burnt wood of Burnt Wood, beyond Galdrheim\'s north gate. Cut through them.',
    thanks: 'Thirty, and you are still standing straight. Next, speed.',
    reward: { xp: 15000, perz: 3000 },
  },
  blademaster_trial2: {
    title: 'BladeMaster Trial 2: Faster than Knives', job: true, kind: 'kill', mob: 'koboldAssassin', n: 20, lv: 1,
    intro: 'The Kobold Assassins of Stone Field and Coal Pit dart in and out like wasps. Twenty of them. If you can catch those, you can catch anything.',
    thanks: 'Quick hands. Quicker than mine, these days. One last test.',
    reward: { xp: 20000, perz: 4000 },
  },
  blademaster_trial3: {
    title: 'BladeMaster Trial 3: The Burning Shell', job: true, kind: 'kill', mob: 'cinderLord', n: 1, lv: 1,
    intro: 'The Giant Beetle of Ash Heath. Alone. One target, one blade, until it falls.',
    thanks: 'You did not flinch once. Kneel; rise a BladeMaster.',
    reward: { xp: 30000, perz: 6000 },
  },
  wizard_trial: {
    title: 'Wizard Trial 1: Fire and Shadow', job: true, kind: 'fetch', items: { ember_dust: 10, shade: 10 }, lv: 1,
    intro: 'A Wizard commands every element, not just a favourite. Bring me ten pinches of Fire Dust from the Fire Wisps of Ash Heath and ten Dark Crystals from the Dark Wisps of Black Wood.',
    thanks: 'Fire and shadow in one pouch, and you did not burn yourself. Next.',
    reward: { xp: 15000, perz: 3000 },
  },
  wizard_trial2: {
    title: 'Wizard Trial 2: Fire on the Hills', job: true, kind: 'kill', mob: 'koboldWarrior', n: 20, lv: 1,
    intro: 'A Wizard picks the element before the fight. Kobolds are of the earth, and fire burns earth. Twenty Kobolds in the hills of Stone Field, west of Salt Bay: burn them before they reach you.',
    thanks: 'They never came close. That is the point. One more.',
    reward: { xp: 20000, perz: 4000 },
  },
  wizard_trial3: {
    title: 'Wizard Trial 3: The Rotting Well', job: true, kind: 'kill', mob: 'gloomMother', n: 1, lv: 1,
    intro: 'The Giant Mushroom of Black Wood chokes a rune-well. Burn it, freeze it, break it: any element you like, as long as it falls.',
    thanks: 'The well sings again. So, Wizard, do you.',
    reward: { xp: 30000, perz: 6000 },
  },
  mknight_trial: {
    title: 'Magic Knight Trial 1: Steel', job: true, kind: 'kill', mob: 'koboldWarrior', n: 30, lv: 1,
    intro: 'First, steel. Thirty Kobolds in the hills of Stone Field, west of Salt Bay. Sword in hand.',
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
    intro: 'The King Crab of Salt Bay: a shell no sword cuts and no spell burns. Both together will. Bring it down.',
    thanks: 'Steel and song, as one. Rise, Magic Knight.',
    reward: { xp: 30000, perz: 6000 },
  },
  // ---------- Steinborg ----------
  pearls: {
    title: "Hild's Crate", kind: 'deliver', to: 'hakon', thing: 'crate of potions', lv: 24,
    intro: 'Hakon the carter is stuck in Salt Bay, and the salt road is no place to go without potions. Take this crate to him, by the west road of Salt Bay, and come back to tell me he has it.',
    toLine: 'From Hild? Bless that woman. With these I can get the salt carts rolling again. Tell her the first load of salt is hers.',
    thanks: 'He has it? Good. Then the salt comes back to my stall, and some of the coin comes to you.',
    reward: { xp: 9000, perz: 6000 },
  },

  ore: {
    title: 'Stone for the Forge', kind: 'fetch', items: { stone: 30, cinder: 15 }, lv: 34,
    intro: 'The forge is cold. Thirty Stone from the Beetles of Ember Hill and fifteen Burnt Shells from the Fire Beetles of Ash Heath, and I can work again.',
    thanks: 'Good stone, and the shells are still warm. Here: coin, and something for the road.',
    reward: { xp: 30000, perz: 8000, items: { potion3: 5 } },
  },
  remedy: {
    title: 'The Great Remedy', kind: 'quiz', items: { gloom: 6, ember_dust: 6 }, lv: 38, task: 'brew the remedy with Ragna',
    intro: 'I can brew a remedy for the burning sickness in Ash Heath. Bring me six Dark Spores from Black Wood and six pinches of Fire Dust from the Fire Wisps, and brew it with me: the cold spores calm the fire, so they go in first and the dust goes in slowly after.',
    questions: [
      { q: 'The burning sickness runs hot. What goes in the pot first?', options: ['The Fire Dust', 'The Dark Spores', 'Water, nothing else'], a: 1,
        why: 'The spores, cold and dark. They calm the fever before the fire goes in.', hint: 'Fire on a fever? Cold first.' },
      { q: 'Now the Fire Dust. How?', options: ['All at once, quickly', 'Slowly, a pinch at a time', 'Not at all'], a: 1,
        why: 'Slowly. Fire and shadow fight in the pot; go gently and they settle.', hint: 'The pot flares! Slowly, a pinch at a time.' },
      { q: 'Fire Wisps are Fire. Which spell element hurts them most?', options: ['Water', 'Fire', 'Earth'], a: 0,
        why: 'Water puts out fire. Remember it when you go back to Ash Heath.', hint: 'What do you throw on a fire to put it out?' },
    ],
    thanks: 'Dark and bright, cold and hot... it will work. Thank you, truly.',
    reward: { xp: 45000, perz: 8000, items: { tonic: 10 } },
  },

  kingcrab: {
    title: 'The King of the Shore', kind: 'kill', mob: 'tideKing', n: 1, lv: 30,
    intro: 'A crab as big as a cart rules the Salt Bay shore, and the fishers will not go out. Kill the King Crab.',
    thanks: 'The King Crab, dead? The fishers will feast for a week. Well fought.',
    reward: { xp: 20000, perz: 6000, items: { potion2: 10 } },
  },
  // ---------- Galdrheim ----------
  tomes: {
    title: 'The Drowned Tomes', kind: 'search', map: 'coast', thing: 'Drowned Tome', spots: [[16, 10], [32.5, 44.5], [34, 22], [10, 49]], lv: 20,
    intro: 'A ship carrying our oldest books sank off Salt Bay. Four tomes have washed up along the shore. Look for something glinting by the water, and bring them back to me before the tide takes them again.',
    thanks: 'The ink is still there. Hallveig\'s own hand! Thank you.',
    reward: { xp: 7000, perz: 4000, items: { tonic: 5 } },
  },

  livingwood: {
    title: 'The Living Wood', kind: 'fetch', items: { heartwood: 1, thorn: 8 }, lv: 26,
    intro: 'The best staves are carved from wood that still lives. The Giant Sprout of Birch Grove carries a root like that in its heart. Bring me a Giant Root, and eight Thorns to bind it.',
    thanks: 'It is still warm. I will make something good of this, and so will you.',
    reward: { xp: 14000, perz: 6000, items: { potion2: 8 } },
  },
  giantmother: {
    title: 'The Mother of Spores', kind: 'kill', mob: 'gloomMother', n: 1, lv: 40,
    intro: 'The Giant Mushroom of Black Wood has rooted itself on a rune-well. It drinks the song and breathes out rot. Destroy it, and the well will run clean.',
    thanks: 'I felt the well clear from here. You sing louder than you know.',
    reward: { xp: 60000, perz: 10000, items: { tonic: 10 } },
  },
  giantbeetle: {
    title: 'The Beetle of Ash Heath', kind: 'kill', mob: 'cinderLord', n: 1, lv: 46,
    intro: 'In Ash Heath a Giant Beetle burns the heath wherever it walks. It is the worst thing the Watch has seen. Kill it.',
    thanks: 'You did what the whole Watch could not. Steinborg owes you.',
    reward: { xp: 120000, perz: 15000, items: { potion3: 10 } },
  },
  shades: {
    title: 'Shadows in Black Wood', kind: 'search', map: 'deep', thing: 'Watcher stone', spots: [[18, 18], [46, 24], [26, 46]], verb: 'Rubbing taken', lv: 38,
    intro: 'Three old Watcher stones stand among the black trees of Black Wood, older than Galdrheim. Find them, look for the faint glow, and take a rubbing of each for me. Mind the Dark Wisps: they come for you on sight.',
    thanks: 'Cold, and singing. The runes on these rubbings are older than any I have carved. The Watchers will be glad.',
    reward: { xp: 45000, perz: 6000, items: { tonic: 8 } },
  },

  // ---------- Veidheim ----------
  snakes: {
    title: 'Snakes in the Barley', kind: 'kill', mob: 'snake', n: 20, lv: 46,
    intro: 'Our old farm past Black Wood, the Barley Field, is crawling with Snakes, and they strike at anyone on sight. I want my barley back. Kill twenty of them.',
    thanks: 'Twenty! The reapers are already sharpening their scythes. Here, for your trouble, and a loaf when the barley is in.',
    reward: { xp: 130000, perz: 12000, items: { potion3: 8, honey: 4 } },
  },
  lambs: {
    title: 'The Lost Lambs', kind: 'search', map: 'marsh', thing: 'Lost lamb', spots: [[46, 16], [14, 50], [48, 50]], verb: 'Lamb found', lv: 16,
    intro: 'Something spooked my flock in the night, and three lambs ran off into Willow Marsh, west of the gate. The Willows will not hurt them, but the reeds are deep. Find them and send them home.',
    thanks: 'All three, bleating their heads off. You have a farmer\'s ear. Here, and thank you.',
    reward: { xp: 5000, perz: 2000, items: { potion2: 4, honey: 2 } },
  },
  wolfpack: {
    title: 'The Pack in the Hills', kind: 'kill', mob: 'wolf', n: 25, lv: 48,
    intro: 'The packs in Wolf Hills, past Ash Heath, are bigger every week, and bolder: they hunt the Barley Field now. Thin them out: twenty-five Wolves. They will come for you on sight.',
    thanks: 'Twenty-five. The hills will be quiet for a while, and the night watch will thank you. Hunt with us any time.',
    reward: { xp: 170000, perz: 15000, items: { potion3: 10 } },
  },
  pelts: {
    title: 'Pelts for the Winter', kind: 'fetch', items: { wolf_pelt: 10, bear_claw: 5 }, lv: 50,
    intro: 'Winter comes early this side of Black Wood. I need ten Wolf Pelts for the watch\'s cloaks, and five Bear Claws for the charms that keep them brave.',
    thanks: 'Good thick pelts. The watch will be warm, and the charms will rattle. Here is your share.',
    reward: { xp: 150000, perz: 14000, items: { hunter_cape: 1 } },
  },
  alphawolf: {
    title: 'The Leader of the Pack', kind: 'kill', mob: 'alphaWolf', n: 1, lv: 54,
    intro: 'The packs did not grow bold on their own. A black wolf with a silver ruff leads them, the Alpha Wolf, and it hunts the Barley Field. It pounces from further than you think. Bring it down, and the packs will scatter.',
    thanks: 'The Alpha is dead? Then the packs are leaderless, and the barley is ours again. You hunt like one of us.',
    reward: { xp: 140000, perz: 15000, items: { potion3: 10 } },
  },
  greatbear: {
    title: 'The Great Bear', kind: 'kill', mob: 'greatBear', n: 1, lv: 59,
    intro: 'There is a bear in Wolf Hills as big as my workshop, grey-backed with age, and it has torn up every hunters\' camp out there. Kill the Great Bear, and bring me its heart if it gives it up: I will make you something no other hunter has.',
    thanks: 'The Great Bear, gone. The camps can go back up. If you found its heart, I know what to do with it.',
    reward: { xp: 200000, perz: 18000, items: { potion3: 12, honey: 6 } },
  },
  bowstaves: {
    title: 'Wood for Bows', kind: 'fetch', items: { willow_twig: 12, old_bark: 4 }, lv: 22,
    intro: 'Bows need willow that still wants to bend, and the bow-grips need bark that will not crack. Bring me twelve Willow Twigs from the marsh and four slabs of Old Bark from the Treants.',
    thanks: 'Lovely wood. Still twitching, too. Every archer in the village will shoot a little straighter because of you.',
    reward: { xp: 9000, perz: 4000, items: { potion2: 6, quick: 2 } },
  },
  elderwillow: {
    title: 'The Elder Willow', kind: 'kill', mob: 'elderWillow', n: 1, lv: 26,
    intro: 'The Elder Willow of Willow Marsh, west of the gate, is calling the willows out of the water, and they walk farther every night. Cut it down before they reach the fields.',
    thanks: 'The marsh is still at last. Even the frogs are quieter. Veidheim owes you a great deal.',
    reward: { xp: 15000, perz: 6000, items: { potion2: 10 } },
  },
  treants: {
    title: 'Walking Trees', kind: 'kill', mob: 'treant', n: 15, lv: 22,
    intro: 'The Treants of the Old Forest have started wandering up to the north gate and leaning on the palisade. It creaks. Fell fifteen of them and the rest will keep their distance.',
    thanks: 'Fifteen! The palisade has stopped groaning, and so have I. Here, from the watch.',
    reward: { xp: 8000, perz: 3500, items: { potion2: 6 } },
  },
  ancienttreant: {
    title: 'The Waking Wood', kind: 'kill', mob: 'ancientTreant', n: 1, lv: 60,
    intro: 'The Ancient Treant has walked out of the Old Forest into Wolf Hills, and the packs follow it like hounds. If it turns this way, there will be no Veidheim. It has stood a thousand years. Bring it down.',
    thanks: 'You felled the Ancient Treant. The songs will call you the Woodcutter, whether you like it or not. Veidheim is yours, hunter.',
    reward: { xp: 600000, perz: 40000, items: { potion3: 20 } },
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
// (kills, a quiz's questions answered, waves held, or 1 once a delivery is made); a search keeps
// the spots found
const fresh = (q) => (q.kind === 'visit' || q.kind === 'search' ? [] : q.mobs ? {} : 0);
const V3_RESET = ['warden', 'lights'];
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
    // a first job's trial: for a Trainee ready for it, or a hero of another first job walking this path too
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
    if (q.kind === 'search') return a.length >= q.spots.length;
    if (q.kind === 'defend') return a >= q.waves.length;
    if (q.kind === 'deliver') return a >= 1;
    return this.hasItems(id, inv);
  }

  // a search: the hero stands at (x, z) on a map. Returns [{ id, n }] for each thing just found
  onSearch(map, x, z) {
    const out = [];
    for (const [id, a] of Object.entries(this.active)) {
      const q = QUESTS[id];
      if (q.kind !== 'search' || q.map !== map) continue;
      q.spots.forEach(([sx, sz], i) => {
        if (!a.includes(i) && Math.hypot(sx - x, sz - z) < 1.6) { a.push(i); out.push({ id, n: a.length }); }
      });
    }
    return out;
  }

  // a defence: one more wave held
  waveHeld(id) { if (QUESTS[id]?.kind === 'defend' && id in this.active) this.active[id]++; }

  // a delivery: the active quest that wants something given to this person, if any
  deliveryFor(npc) {
    return Object.keys(this.active).find((id) => QUESTS[id].kind === 'deliver' && QUESTS[id].to === npc && !this.active[id]) || null;
  }
  deliver(id) { if (QUESTS[id]?.kind === 'deliver' && id in this.active) this.active[id] = 1; }

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
    if (q.kind === 'search') return `${q.thing}s found ${a.length}/${q.spots.length}`;
    if (q.kind === 'defend') return `Waves held ${Math.min(a, q.waves.length)}/${q.waves.length}`;
    if (q.kind === 'deliver') return a ? 'Delivered' : `Take the ${q.thing} to ${NPCS[q.to].name}`;
    return this.itemsLine(q, inv);
  }

  itemsLine(q, inv) {
    return Object.entries(q.items).map(([item, n]) => `${ITEMS[item].name} ${Math.min(inv.have(item), n)}/${n}`).join(' · ');
  }

  goal(q) {
    if (q.kind === 'kill' && q.mobs) return 'Defeat ' + Object.entries(q.mobs).map(([m, n]) => plural(n, MOB_DEFS[m].name)).join(' and ');
    if (q.kind === 'kill') return `Defeat ${plural(q.n, MOB_DEFS[q.mob].name)}`;
    if (q.kind === 'visit') return `Visit ${q.zones.map((z) => ZONE_NAMES[z]).join(', ')}`;
    if (q.kind === 'search') return `Find ${q.spots.length} ${q.thing}s in ${ZONE_NAMES[q.map]}`;
    if (q.kind === 'defend') return `Hold ${q.place} in ${ZONE_NAMES[q.map]} against ${q.waves.length} waves`;
    if (q.kind === 'deliver') return `Take the ${q.thing} to ${NPCS[q.to].name} (${ZONE_NAMES[NPCS[q.to].map || 'camp']})`;
    const bring = q.items ? 'Bring ' + Object.entries(q.items).map(([item, n]) => `${n} ${ITEMS[item].name}`).join(', ') : '';
    if (q.kind === 'quiz') return bring ? `${bring}, then ${q.task}` : q.task;
    return bring;
  }

  // v2: the first-job trials became hunts and quizzes. An older save's count on a step that is now
  // a quiz was kills or nothing, so its questions start from the first.
  // v3: side quests became searches, a defence, a delivery and a rare hunt: counts kept from the old
  // kill quests (Wisps, Mushrooms) mean nothing now and start again
  toJSON() { return { v: 3, active: this.active, done: this.done }; }
  load(d) {
    if (!d) return;
    this.done = (d.done || []).filter((id) => QUESTS[id]);
    for (const [id, a] of Object.entries(d.active || {})) {
      if (!QUESTS[id] || this.done.includes(id)) continue;
      const q = QUESTS[id];
      if (q.kind === 'visit' || q.kind === 'search') this.active[id] = Array.isArray(a) ? a : [];
      else if (q.mobs) this.active[id] = a && typeof a === 'object' && !Array.isArray(a) ? a : {};
      else if ((q.kind === 'quiz' && (d.v || 1) < 2) || (V3_RESET.includes(id) && (d.v || 1) < 3)) this.active[id] = 0;
      else this.active[id] = Math.max(0, a | 0);
    }
  }
}
