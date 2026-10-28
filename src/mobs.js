// Small monsters with hidden HP. No health bars: hits flash white and knock back,
// below 30% HP they wobble and slow down, at 0 they vanish in a puff.
import * as THREE from 'three';
import { mulberry32, dirFor } from './noise.js';
import { mobAttack, WALK_SCALE } from './rules.js';
import { findPath } from './path.js';


// Battle stats follow Ragnarok's rules (rules.js): lv, hp, atk [min, max], def (hard DEF %),
// vit (soft DEF), agi (FLEE = lv + agi), dex (HIT = lv + dex), exp [base, job], adelay = ms
// between attacks. Each is modelled on a classic monster of the same level.
// el: element (rules.js ELEMENTS). drops: [itemId, min, max, chance]. Rare finds are Ragnarok-rare: 0.15-0.5% (15-50 in 10 000)
// passive: like most of Ragnarok's field monsters, it minds its own business until you hit it.
// Levels climb map by map, from the valley (1-14) through the new lands (18-45) to the Fire Giant (60).
export const MOB_DEFS = {
  // the fields by the camp and the cities (Moss Field, Fen Shore, and Willow Marsh by Veidheim: the
  // Yellow Bloop and the Willow) are a Trainee's: a Base 10 Trainee
  // beats any of their monsters again and again, and earns big Job EXP there (tjob, a Trainee's
  // Job EXP instead of exp[1]: Job 10 in about 30 kills of a mix)
  slime: { name: 'Bloop', ai: 'hopper', art: 'slime', el: 'water', lv: 1, hp: 50, atk: [7, 10], def: 0, vit: 1, agi: 1, dex: 6, exp: [2, 1], tjob: 8, adelay: 1872, passive: true, walk: 400, aggro: 4.5, chase: 4, reach: 0.8, w: 0.9, r: 0.35, drops: [['gel', 1, 2, 1], ['berry', 1, 1, 0.12], ['shiny_gel', 1, 1, 0.01], ['gooey_ring', 1, 1, 0.005], ['bloop_card', 1, 1, 0.001]] },
  blueSlime: { name: 'Blue Bloop', ai: 'hopper', art: 'slimeBlue', el: 'water', lv: 4, hp: 110, atk: [8, 11], def: 0, vit: 4, agi: 4, dex: 9, exp: [9, 6], tjob: 18, adelay: 1600, passive: true, walk: 400, aggro: 4.5, chase: 4.5, reach: 0.8, w: 1.0, r: 0.38, split: 'miniSlime', drops: [['gel', 1, 1, 1], ['dew', 1, 1, 0.6], ['tonic', 1, 1, 0.04], ['shiny_gel', 1, 1, 0.01], ['tide_pendant', 1, 1, 0.003], ['bluebloop_card', 1, 1, 0.001]] },
  miniSlime: { name: 'Little Bloop', ai: 'hopper', art: 'slimeBlue', el: 'water', lv: 2, hp: 40, atk: [5, 7], def: 0, vit: 2, agi: 2, dex: 7, exp: [3, 2], tjob: 6, adelay: 1400, walk: 300, aggro: 6, chase: 5, reach: 0.6, w: 0.55, r: 0.22, noRespawn: true, drops: [['dew', 1, 1, 0.5]] }, // split off a Blue Bloop: never gear, never a card
  sprout: { name: 'Sprout', ai: 'skittish', art: 'sprout', el: 'earth', lv: 3, hp: 70, atk: [9, 12], def: 0, vit: 3, agi: 3, dex: 8, exp: [4, 3], tjob: 12, adelay: 1456, passive: true, walk: 300, flee: 2.9, fear: 3.5, angry: 6, reach: 0.8, w: 0.95, r: 0.35, drops: [['seed', 1, 1, 1], ['leaf', 1, 1, 0.6], ['berry', 1, 1, 0.2], ['herb', 1, 1, 0.25], ['seedling_band', 1, 1, 0.004], ['flower_wreath', 1, 1, 0.005], ['seed_card', 1, 1, 0.001]] },
  crab: { name: 'Crab', ai: 'crab', art: 'crab', el: 'water', lv: 6, hp: 170, atk: [10, 13], def: 3, vit: 6, agi: 5, dex: 10, exp: [20, 14], tjob: 30, adelay: 1300, passive: true, walk: 200, aggro: 5, reach: 0.85, w: 1.1, r: 0.42, drops: [['shell', 1, 2, 1], ['crableg', 1, 1, 0.25], ['mud_buckler', 1, 1, 0.003], ['shellcrab_card', 1, 1, 0.001]] },
  mushling: { name: 'Mushroom', ai: 'puffer', art: 'mushling', el: 'earth', lv: 14, hp: 520, atk: [19, 26], def: 2, vit: 18, agi: 14, dex: 30, exp: [45, 32], adelay: 1768, passive: true, walk: 200, aggro: 4, chase: 6, reach: 0.8, w: 0.95, r: 0.36, drops: [['spore', 1, 2, 1], ['herb', 1, 1, 0.2], ['potion', 1, 1, 0.08], ['spore_cloak', 1, 1, 0.0025], ['mushling_card', 1, 1, 0.001]] },
  beetle: { name: 'Beetle', ai: 'tank', art: 'beetle', el: 'earth', lv: 30, hp: 1500, atk: [88, 110], def: 22, vit: 30, agi: 20, dex: 46, exp: [330, 230], adelay: 1500, passive: true, walk: 200, aggro: 4, chase: 8, reach: 0.9, w: 1.15, r: 0.45, heavy: true, drops: [['stone', 1, 2, 1], ['potion2', 1, 1, 0.06], ['pebble_ring', 1, 1, 0.003], ['horn_blade', 1, 1, 0.0015], ['beetle_n_card', 1, 1, 0.001]] },
  wisp: { name: 'Wisp', ai: 'wisp', art: 'wisp', el: 'wind', lv: 11, hp: 290, atk: [20, 25], def: 4, vit: 8, agi: 20, dex: 22, exp: [26, 19], adelay: 1292, passive: true, walk: 150, aggro: 6, reach: 0.75, w: 0.7, r: 0.3, fly: true, glow: true, drops: [['glow', 1, 1, 1], ['wander', 1, 1, 0.15], ['wisp_lantern', 1, 1, 0.004], ['wisp_card', 1, 1, 0.001]] },
  // Sigrun's rare hunt: a great golden Wisp over Fen Shore's pond, out only at night while the quest is on
  lanternWisp: { name: 'Lantern Wisp', ai: 'wisp', art: 'wisp', el: 'wind', tint: '#ffd86a', lv: 16, hp: 1000, atk: [26, 34], def: 6, vit: 12, agi: 22, dex: 30, exp: [320, 220], adelay: 1250, passive: false, walk: 150, aggro: 7, chase: 10, reach: 0.85, w: 1.15, r: 0.42, fly: true, glow: true, noRespawn: true, drops: [['wisp_lantern', 1, 1, 1], ['glow', 3, 5, 1], ['wander', 1, 2, 0.5], ['lanternwisp_card', 1, 1, 0.001]] },
  // the raid's bloops (Bloop Island, raid.js): stronger colours of the Bloop, recoloured sheets (sprites.js).
  // These are their own stats; in the raid each is rebuilt at the difficulty's level (raidDef).
  // The Yellow Bloop also lives in Willow Marsh (passive there, like the valley's bloops); the Red
  // Bloop is only met in the raid (raid: true)
  yellowSlime: { name: 'Yellow Bloop', ai: 'hopper', art: 'slimeYellow', el: 'wind', lv: 7, hp: 170, atk: [9, 12], def: 1, vit: 6, agi: 6, dex: 12, exp: [16, 11], tjob: 24, adelay: 1500, passive: true, walk: 400, aggro: 5, chase: 5, reach: 0.8, w: 1.0, r: 0.38, drops: [['gel', 1, 2, 1], ['dew', 1, 1, 0.4], ['berry', 1, 1, 0.15], ['potion', 1, 1, 0.06], ['shiny_gel', 1, 1, 0.01], ['yellowbloop_card', 1, 1, 0.001]] },
  redSlime: { raid: true, name: 'Red Bloop', ai: 'hopper', art: 'slimeRed', el: 'fire', lv: 18, hp: 560, atk: [36, 46], def: 4, vit: 16, agi: 16, dex: 30, exp: [75, 52], adelay: 1450, walk: 300, aggro: 5, chase: 6, reach: 0.8, w: 1.05, r: 0.4, drops: [['gel', 1, 2, 1], ['cinder', 1, 1, 0.1], ['shiny_gel', 1, 1, 0.01], ['redbloop_card', 1, 1, 0.001]] },
  // the raid's boss: BleepBloop, a giant old bloop general (white beard, plumed hat, mantle), painted
  // in code (bleepbloop.js). It belly-flops onto you, charges, stomps, and calls Red Bloops; only ever
  // met in the raid, at the raid's level
  bleepBloop: { raid: true, name: 'BleepBloop', ai: 'boss', art: 'bleepBloop', el: 'neutral', boss: true, lv: 35, hp: 9600, atk: [62, 80], def: 14, vit: 35, agi: 24, dex: 52, exp: [9000, 6300], adelay: 1600, walk: 300,
    moves: [{ kind: 'leap', name: 'Belly Flop', mult: 1.6, r: 2.0 }, { kind: 'charge', name: "Veteran's Charge", mult: 1.5 }], stomp: 1.5,
    aggro: 99, chase: 99, reach: 2.0, w: 4.0, r: 1.4, heavy: true, summon: ['redSlime', 'redSlime', 'redSlime'], summonText: 'BleepBloop bellows an old war cry, and Red Bloops come bouncing!', drops: [['bleep_card', 1, 1, 0.01]] },
  // ---------- the new lands: palette swaps of the valley's monsters, Ragnarok style (tint) ----------
  russet: { name: 'Red Sprout', ai: 'tank', art: 'sprout', el: 'earth', tint: '#ffb47a', lv: 18, hp: 520, atk: [35, 46], def: 5, vit: 18, agi: 18, dex: 34, exp: [80, 56], adelay: 1500, passive: true, walk: 200, aggro: 4.5, chase: 6, reach: 0.8, w: 1.0, r: 0.36, drops: [['thorn', 1, 1, 0.55], ['seed', 1, 1, 0.6], ['leaf', 1, 1, 0.4], ['berry', 1, 1, 0.2], ['bramble_ring', 1, 1, 0.003], ['redsprout_card', 1, 1, 0.001]] },
  brine: { name: 'Sea Bloop', ai: 'hopper', art: 'slimeBlue', el: 'water', tint: '#a8ffd8', lv: 22, hp: 880, atk: [50, 65], def: 4, vit: 22, agi: 20, dex: 40, exp: [125, 88], adelay: 1500, passive: true, walk: 400, aggro: 5, chase: 5, reach: 0.8, w: 1.1, r: 0.4, drops: [['salt', 1, 1, 0.55], ['gel', 1, 1, 0.8], ['tonic', 1, 1, 0.05], ['shiny_gel', 1, 1, 0.01], ['seabloop_card', 1, 1, 0.001], ['sea_cloak', 1, 1, 0.0025]] },
  tidecrab: { name: 'Blue Crab', ai: 'crab', art: 'crab', el: 'water', tint: '#a8c8ff', lv: 26, hp: 920, atk: [70, 88], def: 14, vit: 26, agi: 22, dex: 44, exp: [180, 126], adelay: 1300, passive: true, walk: 250, aggro: 5.5, reach: 0.9, w: 1.25, r: 0.48, drops: [['shell', 1, 2, 1], ['crableg', 1, 1, 0.3], ['pearl', 1, 1, 0.06], ['coral_shield', 1, 1, 0.0025], ['bluecrab_card', 1, 1, 0.001]] },
  gloomcap: { name: 'Dark Mushroom', ai: 'puffer', art: 'mushling', el: 'shadow', tint: '#a89cff', lv: 34, hp: 1800, atk: [104, 130], def: 12, vit: 36, agi: 30, dex: 56, exp: [450, 315], adelay: 1700, passive: true, walk: 200, aggro: 4.5, chase: 7, reach: 0.85, w: 1.15, r: 0.42, mdef: 10, drops: [['gloom', 1, 1, 0.5], ['spore', 1, 2, 0.8], ['potion2', 1, 1, 0.08], ['gloom_hood', 1, 1, 0.0025], ['gloomcap_card', 1, 1, 0.001]] },
  shadeWisp: { name: 'Dark Wisp', ai: 'wisp', art: 'wisp', el: 'shadow', tint: '#b8a0ff', glow: true, lv: 38, hp: 1700, atk: [120, 150], def: 10, vit: 25, agi: 47, dex: 66, exp: [560, 390], adelay: 1250, walk: 150, aggro: 6, reach: 0.75, w: 0.85, r: 0.32, fly: true, mdef: 20, drops: [['shade', 1, 1, 0.45], ['glow', 1, 1, 0.8], ['wander', 1, 1, 0.1], ['wisp_lantern', 1, 1, 0.005], ['shade_staff', 1, 1, 0.002], ['dark_wisp', 1, 1, 0.0025], ['shadewisp_card', 1, 1, 0.001]] },
  cinderBeetle: { name: 'Fire Beetle', ai: 'tank', art: 'beetle', el: 'fire', tint: '#ff9a72', lv: 42, hp: 2500, atk: [140, 176], def: 28, vit: 42, agi: 31, dex: 64, exp: [760, 530], adelay: 1500, walk: 200, aggro: 4.5, chase: 9, reach: 1.0, w: 1.35, r: 0.52, heavy: true, drops: [['cinder', 1, 1, 0.5], ['stone', 1, 2, 1], ['potion2', 1, 1, 0.1], ['potion3', 1, 1, 0.03], ['cinder_mail', 1, 1, 0.002], ['horn_blade', 1, 1, 0.002], ['firebeetle_card', 1, 1, 0.001]] },
  emberWisp: { name: 'Fire Wisp', ai: 'wisp', art: 'wisp', el: 'fire', tint: '#ff9a5a', glow: true, lv: 45, hp: 2200, atk: [152, 190], def: 12, vit: 30, agi: 53, dex: 74, exp: [880, 615], adelay: 1200, walk: 150, aggro: 6, reach: 0.75, w: 0.85, r: 0.32, fly: true, drops: [['ember_dust', 1, 1, 0.5], ['glow', 1, 1, 0.6], ['cinder', 1, 1, 0.15], ['ember_charm', 1, 1, 0.003], ['ember_wings', 1, 1, 0.0025], ['emberwisp_card', 1, 1, 0.001]] },
  // mini-bosses: one on each new field, big and slow, they stomp like the Fire Giant, call two of
  // their own kind as guards (summon: see SUMMON_CD) and come back after `respawn` seconds. The
  // owner's call: half as hard as an MVP (about half its HP and ATK) and fierce like one (enraged
  // below half HP, moves that FLEE can't dodge and that go through most DEF: mobs.js MVP_MOVE), so
  // a fight for a hero in good gear whatever its level (190,000-290,000 HP); no quest needs one. Their rare materials
  // craft the best gear.
  matron: { name: 'Giant Sprout', ai: 'boss', art: 'sproutBoss', aura: '#ff9a4a', el: 'earth', boss: true, lv: 25, hp: 200000, atk: [140, 180], def: 10, vit: 25, agi: 18, dex: 120, exp: [4200, 2940], adelay: 1900, fierce: true, walk: 300, moves: [{ kind: 'throw', name: 'Seed Pod', mult: 1.5, r: 1.5 }], aggro: 5.5, chase: 12, reach: 1.3, w: 2.0, r: 0.75, heavy: true, summon: ['russet', 'russet'], summonText: 'The Giant Sprout shakes its leaves, and Red Sprouts come running!', respawn: 300, drops: [['heartwood', 1, 1, 0.3], ['thorn', 3, 5, 1], ['potion2', 1, 2, 0.5], ['thorn_mantle', 1, 1, 0.03], ['bramble_ring', 1, 1, 0.05], ['sprout_card', 1, 1, 0.01]] },
  tideKing: { name: 'King Crab', ai: 'boss', art: 'crabBoss', aura: '#5ac8ff', el: 'water', boss: true, lv: 32, hp: 215000, atk: [150, 195], def: 18, vit: 32, agi: 22, dex: 125, exp: [8400, 5880], adelay: 1900, fierce: true, walk: 200, moves: [{ kind: 'charge', mult: 1.5 }], aggro: 5.5, chase: 12, reach: 1.4, w: 2.3, r: 0.85, heavy: true, summon: ['tidecrab', 'tidecrab'], summonText: 'The King Crab clacks its claws, and Blue Crabs scuttle in!', respawn: 300, drops: [['king_pearl', 1, 1, 0.3], ['pearl', 1, 2, 0.6], ['crableg', 2, 3, 1], ['tidebreaker', 1, 1, 0.02], ['coral_shield', 1, 1, 0.05], ['crab_card', 1, 1, 0.01]] },
  gloomMother: { name: 'Giant Mushroom', ai: 'boss', art: 'mushBoss', aura: '#c87aff', el: 'shadow', boss: true, lv: 40, hp: 235000, atk: [165, 215], def: 14, vit: 40, agi: 28, dex: 130, exp: [17000, 11900], adelay: 1900, fierce: true, walk: 250, moves: [{ kind: 'throw', mult: 1.5, r: 1.8 }], aggro: 5.5, chase: 12, reach: 1.4, w: 2.2, r: 0.8, heavy: true, mdef: 30, summon: ['gloomcap', 'gloomcap'], summonText: 'The Giant Mushroom puffs, and Dark Mushrooms sprout around it!', respawn: 420, drops: [['gloom_heart', 1, 1, 0.3], ['gloom', 2, 4, 1], ['potion3', 1, 2, 0.4], ['gloom_staff', 1, 1, 0.02], ['gloom_hood', 1, 1, 0.05], ['mushroom_card', 1, 1, 0.01]] },
  cinderLord: { name: 'Giant Beetle', ai: 'boss', art: 'beetleBoss', aura: '#ff7a2a', el: 'fire', boss: true, lv: 48, hp: 260000, atk: [180, 235], def: 22, vit: 48, agi: 32, dex: 135, exp: [28000, 19600], adelay: 1900, fierce: true, walk: 200, moves: [{ kind: 'charge', mult: 1.6 }], aggro: 5.5, chase: 12, reach: 1.5, w: 2.4, r: 0.9, heavy: true, summon: ['cinderBeetle', 'cinderBeetle'], summonText: 'The Giant Beetle roars, and Fire Beetles answer!', respawn: 480, drops: [['cinder_core', 1, 1, 0.3], ['cinder', 2, 4, 1], ['potion3', 1, 2, 0.5], ['cinder_greaves', 1, 1, 0.03], ['cinder_mail', 1, 1, 0.04], ['beetle_card', 1, 1, 0.01]] },
  // MVP boss of Ember Hill: one at a time, back 15 minutes after it falls. Its slayer gets the MVP
  // reward on top of the drops. Stomps the ground around it every few seconds (stomp: x its ATK),
  // and calls 2 Fire Wisps and 3 Fire Beetles (summon: see SUMMON_CD).
  // A fight of several minutes for a strong second job. Its own moves (MOVES): Meteor Rain, and
  // burning ground (burns) wherever its meteors and leaps land: keep moving, and fight off the fire.
  jarl: { name: 'Fire Giant', ai: 'boss', art: 'jarl', el: 'fire', lv: 60, hp: 400000, atk: [300, 400], def: 20, vit: 40, agi: 30, dex: 160, mdef: 40, exp: [60000, 42000], adelay: 2400, walk: 130, aggro: 7, chase: 25, reach: 1.9, w: 3.1, r: 1.15, heavy: true,
    mvp: true, respawn: 900, mvpExp: 30000, stomp: 1.8, takes: { ranged: 1.4, magic: 0.6, beast: 0.8 }, takesText: 'its fire soul swallows spells (−40%) and its fire cows beasts (−20%), but it is a huge target for arrows (+40%)', moves: [{ kind: 'meteors', name: 'Meteor Rain', mult: 1.8, r: 1.5 }, { kind: 'throw', mult: 2.0, r: 2.0 }, { kind: 'leap', mult: 1.8, r: 2.2 }], burns: { r: 1.5, dur: 6, mult: 0.35 },
    summon: ['emberWisp', 'emberWisp', 'cinderBeetle', 'cinderBeetle', 'cinderBeetle'], summonText: 'The Fire Giant roars, and the fire answers!', mvpDrops: [['potion3', 3], ['ember_heart', 1]],
    wake: 'The ground trembles… the Fire Giant has woken in Ember Hill!',
    drops: [['potion2', 2, 3, 0.8], ['potion3', 1, 2, 0.5], ['stone', 4, 6, 1], ['jarl_horn', 1, 1, 0.25], ['ember_crown', 1, 1, 0.05], ['jarl_mantle', 1, 1, 0.03], ['jarl_staff', 1, 1, 0.02], ['emberbrand', 1, 1, 0.01], ['flame_bow', 1, 1, 0.01], ['devil_wings', 1, 1, 0.03], ['jarl_card', 1, 1, 0.01]] },
  // ---------- kobolds (Stone Field, Coal Pit) and goblins (Burnt Wood, Serpent Wood) ----------
  // Painted in code (painted.js). Unlike the valley's monsters they attack on sight.
  // archer: keeps `range` away and shoots. assassin: quick, darts in (a dash) and strikes twice
  // `double` of the time. Hard Ore and Armor Ore (for Holger's refining) drop from them.
  koboldWarrior: { name: 'Kobold', ai: 'tank', art: 'koboldWarrior', el: 'earth', lv: 28, hp: 1350, atk: [80, 100], def: 15, vit: 28, agi: 22, dex: 44, exp: [290, 200], adelay: 1400, walk: 200, aggro: 5, chase: 8, reach: 0.8, w: 0.7, r: 0.32, drops: [['kobold_fur', 1, 1, 0.55], ['iron_ore', 1, 1, 0.25], ['potion2', 1, 1, 0.05], ['armor_ore', 1, 1, 0.012], ['hard_ore', 1, 1, 0.006], ['koboldw_card', 1, 1, 0.001], ['kobold_shield', 1, 1, 0.0025]] },
  koboldArcher: { name: 'Kobold Archer', ai: 'archer', art: 'koboldArcher', el: 'earth', lv: 30, hp: 1100, atk: [76, 96], def: 8, vit: 20, agi: 30, dex: 62, exp: [320, 225], adelay: 1800, walk: 200, aggro: 6.5, chase: 8, range: 5, reach: 0.8, w: 0.7, r: 0.32, drops: [['kobold_fur', 1, 1, 0.5], ['steel_ore', 1, 1, 0.08], ['wander', 1, 1, 0.08], ['hard_ore', 1, 1, 0.01], ['kobold_bow', 1, 1, 0.0025], ['koboldarcher_card', 1, 1, 0.001], ['kobold_sandals', 1, 1, 0.0025]] },
  koboldAssassin: { name: 'Kobold Assassin', ai: 'assassin', art: 'koboldAssassin', el: 'earth', lv: 33, hp: 1150, atk: [100, 128], def: 6, vit: 18, agi: 50, dex: 62, exp: [400, 280], adelay: 1100, walk: 150, aggro: 5.5, chase: 9, reach: 0.75, double: 0.25, w: 0.7, r: 0.3, drops: [['kobold_fur', 1, 2, 0.5], ['steel_ore', 1, 1, 0.1], ['quick', 1, 1, 0.03], ['hard_ore', 1, 1, 0.015], ['armor_ore', 1, 1, 0.01], ['koboldassassin_card', 1, 1, 0.001]] },
  goblinWarrior: { name: 'Goblin', ai: 'tank', art: 'goblinWarrior', el: 'wind', lv: 38, hp: 2000, atk: [118, 148], def: 18, vit: 38, agi: 30, dex: 56, exp: [580, 405], adelay: 1400, walk: 150, aggro: 5.5, chase: 9, reach: 0.8, w: 0.7, r: 0.32, drops: [['goblin_tooth', 1, 1, 0.55], ['steel_ore', 1, 1, 0.12], ['potion2', 1, 1, 0.08], ['armor_ore', 1, 1, 0.02], ['hard_ore', 1, 1, 0.01], ['goblin_n_card', 1, 1, 0.001], ['goblin_shield', 1, 1, 0.002]] },
  goblinArcher: { name: 'Goblin Archer', ai: 'archer', art: 'goblinArcher', el: 'wind', lv: 41, hp: 1700, atk: [120, 150], def: 10, vit: 28, agi: 40, dex: 82, exp: [700, 490], adelay: 1800, walk: 200, aggro: 7, chase: 9, range: 5.5, reach: 0.8, w: 0.7, r: 0.32, drops: [['goblin_tooth', 1, 1, 0.5], ['potion3', 1, 1, 0.04], ['wander', 1, 1, 0.1], ['hard_ore', 1, 1, 0.02], ['goblin_bow', 1, 1, 0.002], ['gobarcher_card', 1, 1, 0.001]] },
  goblinAssassin: { name: 'Goblin Assassin', ai: 'assassin', art: 'goblinAssassin', el: 'wind', lv: 44, hp: 1800, atk: [140, 178], def: 8, vit: 26, agi: 60, dex: 82, exp: [850, 595], adelay: 1100, walk: 100, aggro: 6, chase: 10, reach: 0.75, double: 0.25, w: 0.7, r: 0.3, drops: [['goblin_tooth', 1, 2, 0.5], ['quick', 1, 1, 0.04], ['potion3', 1, 1, 0.04], ['hard_ore', 1, 1, 0.025], ['armor_ore', 1, 1, 0.02], ['goblinassassin_card', 1, 1, 0.001], ['goblin_shroud', 1, 1, 0.002]] },
  // the kings: MVPs like the Fire Giant, a step below it. They stomp, and call four guards
  // (summon: see SUMMON_CD). Both are quick on their feet and have moves of their own (see MOVES).
  // The Kobold King hides behind his tribe (tribe: he takes 80% less damage while a guard stands,
  // and calls them back every 30 s) and Burrows under you; the Goblin King's Mirror Image sends two
  // Goblin Kings of shadow at you (kingShadow), and shrouds him (90% less damage) until both fall.
  koboldKing: { name: 'Kobold King', ai: 'boss', art: 'koboldKing', el: 'earth', lv: 50, hp: 600000, atk: [330, 430], def: 22, vit: 45, agi: 30, dex: 140, mdef: 25, exp: [36000, 25200], adelay: 2000, walk: 150, aggro: 7, chase: 25, reach: 1.4, w: 1.3, r: 0.6, heavy: true,
    mvp: true, respawn: 1200, mvpExp: 18000, stomp: 2.0, takes: { ranged: 0.5, magic: 1.4 }, takesText: 'his tribe\'s shields catch arrows (−50%), but kobolds fear sorcery: spells hit him hard (+40%)', moves: [{ kind: 'burrow', name: 'Burrow', mult: 2.4, r: 2.0 }, { kind: 'charge', mult: 2.2 }, { kind: 'throw', mult: 2.0, r: 1.8 }], tribe: 0.8, summonCd: 30, summon: ['koboldWarrior', 'koboldWarrior', 'koboldArcher', 'koboldAssassin'], mvpDrops: [['potion3', 3], ['hard_ore', 2]],
    wake: 'War drums in the quarry… the Kobold King holds court in Coal Pit!',
    drops: [['potion3', 1, 2, 0.5], ['kobold_fur', 4, 6, 1], ['hard_ore', 1, 2, 0.4], ['armor_ore', 1, 2, 0.4], ['kobold_ring', 1, 1, 0.05], ['kobold_card', 1, 1, 0.01]] },
  goblinKing: { name: 'Goblin King', ai: 'boss', art: 'goblinKing', el: 'wind', lv: 55, hp: 600000, atk: [276, 360], def: 22, vit: 48, agi: 34, dex: 150, mdef: 30, exp: [48000, 33600], adelay: 2200, walk: 120, aggro: 7, chase: 25, reach: 1.4, w: 1.3, r: 0.6, heavy: true,
    mvp: true, respawn: 1800, mvpExp: 24000, stomp: 1.7, takes: { melee: 1.4, ranged: 0.7, magic: 0.7 }, takesText: 'his crown\'s wind ward turns arrows and spells (−30%), but not cold steel: blades and fists hit him hard (+40%)', moves: [{ kind: 'mirror', name: 'Mirror Image' }, { kind: 'leap', mult: 1.7, r: 1.8 }, { kind: 'throw', mult: 1.4, r: 1.3 }, { kind: 'frenzy' }], summon: ['goblinWarrior', 'goblinWarrior', 'goblinArcher', 'goblinAssassin'], mvpDrops: [['potion3', 3], ['hard_ore', 3]],
    wake: 'Horns in the dark wood… the Goblin King rides out in Serpent Wood!',
    drops: [['potion3', 1, 2, 0.6], ['goblin_tooth', 4, 6, 1], ['hard_ore', 1, 3, 0.45], ['armor_ore', 1, 3, 0.45], ['goblin_charm', 1, 1, 0.05], ['great_bow', 1, 1, 0.02], ['goblin_card', 1, 1, 0.01]] },
  // ---------- Veidheim and its lands (beasts.js) ----------
  // Round the village, reached from Birch Grove, the gentle ones: willow spirits shake their seeds
  // over you (puff: a cloud that slows) and oak treants are slow and heavy; both only fight back.
  // Far off, east of Black Wood and Ash Heath, the predators for a hero near the second job (Base
  // 46-56): snakes, wolves and bears attack on sight; snakes and wolves dart in and bite twice now and
  // then (the packs are quick), bears are slow, heavy and hard.
  willow: { name: 'Willow', ai: 'puffer', art: 'willow', el: 'earth', lv: 8, hp: 200, atk: [9, 12], def: 2, vit: 7, agi: 6, dex: 13, mdef: 10, exp: [26, 18], tjob: 36, adelay: 1700, passive: true, walk: 200, aggro: 4.5, chase: 7, reach: 1.0, puff: 'Willow seeds fill the air! You feel sluggish', w: 0.85, r: 0.4, drops: [['willow_twig', 1, 1, 0.55], ['leaf', 1, 2, 0.6], ['herb', 1, 1, 0.25], ['potion', 1, 1, 0.08], ['willow_staff', 1, 1, 0.002], ['willow_n_card', 1, 1, 0.001]] },
  treant: { name: 'Treant', ai: 'tank', art: 'treant', el: 'earth', lv: 24, hp: 1500, atk: [62, 78], def: 16, vit: 26, agi: 14, dex: 40, mdef: 10, exp: [160, 112], adelay: 1800, passive: true, walk: 250, aggro: 4.5, chase: 8, reach: 1.1, w: 1.7, r: 0.65, heavy: true, drops: [['old_bark', 1, 1, 0.5], ['leaf', 1, 2, 0.5], ['potion2', 1, 1, 0.05], ['treant_shield', 1, 1, 0.002], ['bark_card', 1, 1, 0.001]] },
  snake: { name: 'Snake', ai: 'assassin', art: 'snake', el: 'earth', lv: 46, hp: 2600, atk: [164, 205], def: 10, vit: 30, agi: 44, dex: 72, exp: [930, 650], adelay: 1400, walk: 200, aggro: 5, chase: 8, reach: 0.8, double: 0.2, w: 0.95, r: 0.36, drops: [['snake_skin', 1, 1, 0.5], ['herb', 1, 1, 0.2], ['potion2', 1, 1, 0.08], ['snake_boots', 1, 1, 0.0025], ['snake_card', 1, 1, 0.001]] },
  wolf: { name: 'Wolf', ai: 'assassin', art: 'wolf', el: 'earth', lv: 48, hp: 2800, atk: [168, 210], def: 10, vit: 32, agi: 52, dex: 76, exp: [1050, 735], adelay: 1200, walk: 150, aggro: 6, chase: 10, reach: 0.85, double: 0.2, w: 0.8, r: 0.36, drops: [['wolf_pelt', 1, 1, 0.5], ['wolf_fang', 1, 1, 0.12], ['potion3', 1, 1, 0.03], ['wolf_cape', 1, 1, 0.002], ['wolf_card', 1, 1, 0.001]] },
  bear: { name: 'Bear', ai: 'tank', art: 'bear', el: 'neutral', lv: 53, hp: 4300, atk: [185, 232], def: 24, vit: 52, agi: 34, dex: 70, exp: [1420, 995], adelay: 1500, walk: 155, aggro: 5, chase: 9, reach: 1.0, w: 1.35, r: 0.55, heavy: true, drops: [['bear_claw', 1, 1, 0.5], ['honey', 1, 1, 0.15], ['potion3', 1, 1, 0.05], ['bear_hide', 1, 1, 0.0015], ['bear_n_card', 1, 1, 0.001], ['bear_paws', 1, 1, 0.0015]] },
  // Willow Marsh's mini-boss: the oldest willow by the water, with its willows round it (a step
  // after the Giant Sprout of Birch Grove)
  elderWillow: { name: 'Elder Willow', ai: 'boss', art: 'elderWillow', aura: '#d8f070', el: 'earth', boss: true, lv: 23, hp: 190000, atk: [130, 170], def: 8, vit: 22, agi: 16, dex: 120, mdef: 15, exp: [3600, 2520], adelay: 1900, fierce: true, walk: 250, moves: [{ kind: 'throw', name: 'Seed Cloud', mult: 1.5, r: 1.8 }], aggro: 5.5, chase: 12, reach: 1.5, w: 1.5, r: 0.75, heavy: true, summon: ['willow', 'willow'], summonText: 'The Elder Willow creaks, and Willows shuffle out of the reeds!', respawn: 300, drops: [['willow_heart', 1, 1, 0.3], ['willow_twig', 3, 5, 1], ['potion2', 1, 2, 0.5], ['willow_staff', 1, 1, 0.03], ['willow_charm', 1, 1, 0.04], ['willow_card', 1, 1, 0.01]] },
  // the predators' mini-bosses: the Alpha Wolf leads the packs of Barley Field (it pounces from
  // afar), the Great Bear rules Wolf Hills beside the Ancient Treant (it charges)
  alphaWolf: { name: 'Alpha Wolf', ai: 'boss', art: 'alphaWolf', aura: '#b8d0ff', el: 'earth', boss: true, lv: 51, hp: 270000, atk: [175, 225], def: 14, vit: 34, agi: 40, dex: 145, exp: [32000, 22400], adelay: 1600, fierce: true, walk: 120, moves: [{ kind: 'leap', name: 'Pounce', mult: 1.6, r: 1.6 }], aggro: 6, chase: 12, reach: 1.2, w: 1.5, r: 0.6, summon: ['wolf', 'wolf'], summonText: 'The Alpha Wolf howls, and the pack comes running!', respawn: 480, drops: [['alpha_pelt', 1, 1, 0.3], ['wolf_pelt', 3, 5, 1], ['potion3', 1, 2, 0.5], ['wolf_cape', 1, 1, 0.03], ['alpha_card', 1, 1, 0.01]] },
  greatBear: { name: 'Great Bear', ai: 'boss', art: 'greatBear', aura: '#ffc04a', el: 'neutral', boss: true, lv: 56, hp: 290000, atk: [200, 260], def: 26, vit: 56, agi: 30, dex: 140, exp: [42000, 29400], adelay: 1900, fierce: true, walk: 155, moves: [{ kind: 'charge', name: 'Mauling Charge', mult: 1.6 }], aggro: 5.5, chase: 12, reach: 1.6, w: 2.3, r: 0.9, heavy: true, summon: ['bear', 'bear'], summonText: 'The Great Bear roars, and Bears lumber out of the pines!', respawn: 540, drops: [['bear_heart', 1, 1, 0.3], ['bear_claw', 3, 5, 1], ['honey', 2, 4, 0.6], ['potion3', 1, 2, 0.5], ['bear_hide', 1, 1, 0.03], ['bear_card', 1, 1, 0.01]] },
  // the MVP of Wolf Hills: the oldest tree in Aria, woken by the jotnar's stirring, has walked out of
  // the Old Forest, and the beasts follow it. The hardest MVP, a fight of several minutes: it stomps,
  // hurls stones from its roots, charges, calls wolves and snakes (summon: see SUMMON_CD), and has
  // two moves of its own (MOVES): Grasping Roots hold a hero who keeps away (a quick Windrunner
  // too) while it comes for them, and Bark Armor sends back what hits it.
  ancientTreant: { name: 'Ancient Treant', ai: 'boss', art: 'ancientTreant', aura: '#ff9ac8', el: 'earth', lv: 62, hp: 550000, atk: [400, 520], def: 20, vit: 45, agi: 30, dex: 165, mdef: 35, exp: [76000, 53200], adelay: 2000, walk: 170, aggro: 7, chase: 25, reach: 2.0, w: 2.8, r: 1.15, heavy: true,
    mvp: true, respawn: 2100, mvpExp: 36000, stomp: 2.0, takes: { melee: 0.6, magic: 1.1, beast: 1.6 }, takesText: 'its bark turns blades and fists (−40%), but fangs and claws tear it (beasts +60%), and spells find its old wounds (+10%)', moves: [{ kind: 'roots', name: 'Grasping Roots', mult: 1.0, r: 1.6, hold: 2.5 }, { kind: 'bark', name: 'Bark Armor' }, { kind: 'throw', name: 'Root Stone', mult: 2.2, r: 2.0 }, { kind: 'charge', name: 'Uprooting Charge', mult: 2.2 }], summon: ['wolf', 'wolf', 'snake', 'snake'], summonText: 'The Ancient Treant groans, and the pack answers!', mvpDrops: [['potion3', 3], ['ancient_seed', 1]],
    wake: 'The hills shake… the Ancient Treant walks in Wolf Hills!',
    drops: [['potion3', 1, 2, 0.6], ['old_bark', 4, 6, 1], ['ancient_heartwood', 1, 1, 0.25], ['hard_ore', 1, 2, 0.4], ['armor_ore', 1, 2, 0.4], ['oak_ring', 1, 1, 0.05], ['grove_blade', 1, 1, 0.01], ['treant_card', 1, 1, 0.01]] },
};
// Matchups (def.takes, rules.js): each MVP takes more from some kinds of blow and less from others,
// so each is easiest for some jobs: the Fire Giant for bows, the Kobold King for spells, the
// Goblin King for blades, the Ancient Treant for beasts (and hardest for the jobs it resists).
// the Goblin King's Mirror Image: a Goblin King of shadow, just like him to look at, that fights
// beside him (no EXP, no drops). He takes 90% less damage while one stands (MIRROR)
// the bosses of the Kobold Camp and the Goblin Lair (raid.js): warlords of their kind, the kings'
// looks in war-paint (tint) and bigger, with the kings' moves, calling their warriors. Only ever met
// in a raid, rebuilt at its level (raidDef); Hell makes them fierce (FIERCE)
MOB_DEFS.koboldWarlord = { raid: true, name: 'Kobold Warlord', ai: 'boss', art: 'koboldKing', tint: '#ffb070', el: 'earth', boss: true, lv: 50, hp: 9600, atk: [62, 80], def: 14, vit: 35, agi: 24, dex: 52, exp: [9000, 6300], adelay: 1500, walk: 150,
  moves: [{ kind: 'charge', name: "Warlord's Charge", mult: 1.5 }, { kind: 'throw', name: 'Boulder', mult: 1.5, r: 1.6 }], stomp: 1.5,
  aggro: 99, chase: 99, reach: 1.6, w: 2.0, r: 0.8, heavy: true, summon: ['koboldWarrior', 'koboldWarrior', 'koboldArcher'], summonText: 'The Kobold Warlord bangs his shield, and his warriors come running!', drops: [] };
MOB_DEFS.goblinWarlord = { raid: true, name: 'Goblin Warlord', ai: 'boss', art: 'goblinKing', tint: '#9ad0ff', el: 'wind', boss: true, lv: 55, hp: 9600, atk: [62, 80], def: 14, vit: 35, agi: 30, dex: 60, exp: [9000, 6300], adelay: 1400, walk: 130,
  moves: [{ kind: 'leap', name: 'War Leap', mult: 1.6, r: 1.8 }, { kind: 'throw', name: 'Hurled Axe', mult: 1.4, r: 1.3 }, { kind: 'frenzy' }], stomp: 1.5,
  aggro: 99, chase: 99, reach: 1.6, w: 2.0, r: 0.8, heavy: true, summon: ['goblinWarrior', 'goblinArcher', 'goblinAssassin'], summonText: 'The Goblin Warlord blows his war-horn, and the horde answers!', drops: [] };
// Hell's Goblin Warlord's Mirror Image: shadows like him (MIRROR)
MOB_DEFS.warlordShadow = { ...MOB_DEFS.goblinWarlord, raid: false, decoy: true, boss: false, ai: 'tank', hp: 12000, atk: [150, 190], exp: [0, 0], summon: null, moves: null, aggro: 12, chase: 30 };
MOB_DEFS.kingShadow = { ...MOB_DEFS.goblinKing, decoy: true, mvp: false, ai: 'tank', hp: 9000, atk: [140, 180], exp: [0, 0], drops: [], summon: null, moves: null, mvpDrops: null, wake: null, aggro: 12, chase: 30 };
// BleepBloop's Jelly Wall (Hell): a quivering core of royal jelly that barely moves and only
// slaps whoever stands on it. He takes 90% less damage while one stands (MIRROR)
MOB_DEFS.jellyCore = { name: 'Jelly Core', ai: 'tank', art: 'slimeYellow', tint: '#ffd86a', el: 'neutral', decoy: true, lv: 99, hp: 10000, atk: [60, 80], def: 10, vit: 30, agi: 1, dex: 60, exp: [0, 0], adelay: 2000, walk: 5000, aggro: 3, chase: 30, reach: 0.9, w: 1.0, r: 0.45, heavy: true, drops: [] };
// walk: ms a tile, as Ragnarok's monster database has it (Poring 400, Kobold 200, Goblin 150,
// Goblin Leader 120, Ifrit 130; the hero 150), taken WALK_SCALE times as long. speed: tiles a second.
for (const d of Object.values(MOB_DEFS)) d.speed = 1000 / (d.walk * WALK_SCALE);

// Boss moves (def.moves), each shown first by a red circle on the ground so it can be dodged:
//   charge - from 3 to 9 paces: crouches, then rushes in a straight line; the first thing in its
//            path takes mult x ATK. It stands, winded, for a moment after.
//   throw  - from 3.5 to 9 paces: hurls a rock (or fireball, or spore pod) where you stand; it lands
//            1 s later, mult x ATK within r.
//   leap   - from 2.5 to 8 paces: jumps onto where you stand, landing 0.9 s later, mult x ATK within r.
//   frenzy - below half HP: for 8 s it moves 30% faster and attacks 40% faster.
//   roots  - from 3 to 14 paces (the Ancient Treant): roots burst out of the ground where you stand
//            0.8 s later, mult x ATK within r, and hold you there for `hold` s (1.4x enraged): you
//            can't walk, dash or leap away (you can still fight) while it comes for you. Enraged,
//            three patches.
//   bark   - (the Ancient Treant) its bark hardens for 6 s: it takes 30% less damage and sends 30%
//            of what still lands back at whoever struck it (the hero, or a beast). Stop and wait.
//   meteors - (the Fire Giant) up to 12 paces: 5 fireballs (7 enraged) fall one after another round
//            you, each a red circle first, mult x ATK within r; each leaves burning ground (def.burns).
//   burrow - (the Kobold King) from 2 to 10 paces: digs in, and can't be hit while under; 0.8 s before
//            it bursts out, a red circle marks where you stand: mult x ATK within r.
//   mirror - (the Goblin King) calls two Goblin Kings of shadow (kingShadow) and trades places with
//            one; until both fall he takes 90% less damage.
// cd: seconds before the same move again (a boss uses one move at a time, and waits 2.5 s between;
// an MVP 1.6 s, and enraged 1 s with its moves back 40% sooner).
export const MOVES = {
  charge: { min: 3, max: 9, cd: 9, wind: 0.6 },
  throw: { min: 3.5, max: 9, cd: 6, wind: 0.5, land: 1.0 },
  leap: { min: 2.5, max: 8, cd: 10, wind: 0.25, air: 0.9 },
  frenzy: { cd: 22, dur: 8, below: 0.5 },
  roots: { min: 3, max: 14, cd: 12, wind: 0.45, land: 0.8 },
  bark: { cd: 20, dur: 6, below: 0.95 },
  meteors: { min: 0, max: 12, cd: 14, wind: 0.7, n: 5, every: 0.3, land: 1.0 },
  burrow: { min: 2, max: 10, cd: 14, dig: 0.5, under: 1.8, mark: 0.8 },
  mirror: { cd: 30, below: 0.9 },
};
const MIRROR = 0.1;
export const BARK = { taken: 0.7, reflect: 0.3 };
// An MVP is a fight for a strong second job (or a party): below half its HP it is enraged for good
// (until it heals back over 60%): it hits 25% harder and 35% faster, walks 15% faster, stomps every
// 4.5 s instead of 7 and moves sooner (above). It calls its guards at 80%, 50% and 25% of its HP
// (topping them up to a full set), and again a minute after the last one falls. It chases you
// across its map: it gives up only when you are 22 paces off, or out of reach (camp, Play Dead).
export const MVP_RAGE = { below: 0.5, calm: 0.6, atk: 1.25, adelay: 0.65, speed: 1.15, stomp: 4.5, gap: 1, cd: 0.6 };
// (An MVP swings slowly for its ATK: its moves are the danger, each shown by a red circle first.)
const MVP_CALLS = [0.8, 0.5, 0.25], MVP_SUMMON_CD = 60, MVP_GIVE_UP = 22, MVP_GAP = 1.6;
// An MVP's moves (stomp, its circles, burning ground) can't be stepped aside from with FLEE, and go
// through 75% of DEF: no armor makes you safe from them, only getting out of the circle. (Its swings
// stay ordinary blows, but an MVP's DEX is high: they land on all but the nimblest.)
export const MVP_MOVE = { sure: true, pierce: 0.75 };
// How a boss (mini-boss, raid boss, MVP) fights you (BRAIN; fierce ones, the MVPs and Hell's raid
// bosses, read you better):
// - it reads you: once you have been on the move `moving` s, a move aimed at you (throw, leap,
//   roots, burrow, charge, the first meteor) lands where you are going (`lead`: that share of the way,
//   at most `ahead` paces), read times in a hundred; else where you stand. Its red circle shows where.
//   Running on in a straight line gets you caught; turning or stopping doesn't, and a short step
//   aside (out of a circle) isn't read as a run.
// - it picks its move for the moment: a leap, charge or burrow when you keep away or stand casting,
//   something thrown or rained down when you stand still in reach of it, rarely the same one twice.
// - kept out of reach (kiting) for `kite` s it gives chase: `rush` x its pace for `rushFor` s (every
//   `rushCd` s at most), and its moves come sooner.
// - enraged, a fierce one may follow one move straight into the next (combo: the chance); the wait
//   between its moves is never quite the same, so they can't be counted.
// - blocked (rocks, trees, walls, a dead-end pocket) it finds a way round (path.js); with no way
//   round (a rock between you, too tight for it) it makes no headway for `stuck` s and bounds over
//   onto you (BOUND: a leap, its red circle first), so no rock keeps a boss off you.
// - a mini-boss hunts you like an MVP: it gives up only `giveUp` paces off, and heals only after
//   `calm` s out of the fight (so stepping away doesn't reset it).
export const BRAIN = {
  read: { fierce: 0.75, boss: 0.5 }, moving: 0.6, lead: 0.6, ahead: 2.5,
  kite: 4, rush: 1.35, rushFor: 2.5, rushCd: 10, combo: 0.35, giveUp: 18, calm: 10, stuck: 2,
};
const BOUND = { kind: 'leap', name: 'Bound', mult: 1.0, r: 1.4 };
const RESPAWN = 60;
// a wounded boss or MVP heals 5% of its HP a minute while it isn't fighting you, on its map or not;
// what it has left is kept when you leave (bossHp, saved), so a fight can be picked up again
const BOSS_REGEN = 0.05;
// monsters never step onto a portal: they stay this far (plus their own size) from one
const PORTAL_KEEP = 2.2;
const portalGap = (w, x, z) => Math.min(Infinity, ...w.portals.map((p) => Math.hypot(p.x - x, p.z - z)));
const nearPortal = (w, x, z, r = 0) => portalGap(w, x, z) < PORTAL_KEEP + r;
const WHITE = new THREE.Color('#ffffff');
const STATUS_COL = Object.fromEntries(Object.entries({ bark: '#c8a05a', bark2: '#9a7a48', freeze: '#8fd0ff', paralyze: '#fff27a', stun: '#d8c8a8', burn: '#ff9a6a', burn2: '#ffc08a', rage: '#ff8a7a', rage2: '#ffb0a0' })
  .map(([k, c]) => [k, new THREE.Color(c)]));
// A boss (MVP or mini-boss) first calls its guards when it falls below 60% HP. It calls again only
// once every guard is gone, and not until 2 minutes after the last one fell, while it still fights.
const SUMMON_AT = 0.6, SUMMON_CD = 120;
// fierce: an MVP, or a boss made as hard as one (the Hell raid's boss: FIERCE)
export const fierce = (d) => !!(d.mvp || d.fierce);
const callMarks = (d) => (fierce(d) ? MVP_CALLS : [SUMMON_AT]);
const summonCd = (d) => d.summonCd ?? (fierce(d) ? MVP_SUMMON_CD : SUMMON_CD);
// a boss's guards are lesser servants of their kind: half the HP, 60% of the ATK (tuned with
// build-tools/sim.mjs, so the fight is the boss and not two full-strength monsters at once)
export const GUARD = { hp: 0.5, atk: 0.6 };
const guardDefs = {};
const lesser = (d) => ({ ...d, hp: Math.round(d.hp * GUARD.hp), atk: d.atk.map((a) => Math.round(a * GUARD.atk)) });
export const guardDef = (type) => (guardDefs[type] ||= lesser(MOB_DEFS[type]));
// A raid's monster (raid.js), rebuilt at the raid's level from the stats of a typical field monster
// of that level (fitted to MOB_DEFS: HP about 48 a level, ATK 3.2-4 a level...), its kind's
// strength on top (STRENGTH), then the difficulty's scale (s: { hp, atk }; a wave comes all at once,
// so its monsters are a swarm of weaker ones). Raid monsters attack on sight and never give up
// (relentless), drop nothing (the raid pays at the end) and don't split. A boss is a mini-boss of
// that level; guard: the scale its guards come at (the waves').
const STRENGTH = { slime: 0.8, blueSlime: 0.9, yellowSlime: 1, redSlime: 1.1 };
// a raid boss made as hard and tricky as an MVP (the difficulty's boss scale says fierce: true):
// enraged below half HP, moves that FLEE can't dodge and that go through most DEF (MVP_MOVE), a
// matchup (takes), and moves of its own (MOVES), each with a barrage that leaves the ground
// dangerous (burns). hpScale: more HP on top, so the Warlords last about as long as BleepBloop
// (whose Jelly Wall makes his fight long)
const FIERCE = {
  koboldWarlord: {
    fierce: true, stomp: 2.0, adelay: 2000, summonCd: 30, stats: { def: 22, vit: 50, dex: 150 }, hpScale: 1.8, tribe: 0.7,
    moves: [
      { kind: 'burrow', name: 'Burrow', mult: 2.2, r: 2.0 },
      { kind: 'meteors', name: 'Rockslide', mult: 1.6, r: 1.6, color: '#c8945a', cd: 20 },
      { kind: 'charge', name: "Warlord's Charge", mult: 2.0 },
      { kind: 'throw', name: 'Boulder', mult: 1.8, r: 1.8 },
    ],
    burns: { r: 1.5, dur: 4, mult: 0.2, slow: true, color: '#a8784a', word: 'Rubble!', text: 'slowing rubble' },
    takes: { ranged: 0.6, magic: 1.3 },
    takesText: 'his warriors\' shields catch arrows (−40%), but kobolds fear sorcery (+30%); and he hides behind his guards (70% less damage while one stands)',
  },
  goblinWarlord: {
    fierce: true, stomp: 2.0, adelay: 1900, summonCd: 30, stats: { def: 22, vit: 50, dex: 160 }, hpScale: 1.8,
    moves: [
      { kind: 'mirror', name: 'Mirror Image', decoy: 'warlordShadow', n: 3, text: 'The Goblin Warlord splits into four! Cut down his shadows: he is shrouded while they stand.' },
      { kind: 'meteors', name: 'Firepot Rain', mult: 1.6, r: 1.6, color: '#ff8a3a', cd: 20 },
      { kind: 'leap', name: 'War Leap', mult: 2.0, r: 2.0 },
      { kind: 'frenzy' },
    ],
    burns: { r: 1.5, dur: 4, mult: 0.25, color: '#ff7030', word: 'Burning!', text: 'burning ground' },
    takes: { melee: 1.3, ranged: 0.8, magic: 0.8 },
    takesText: 'his war-paint wards off arrows and spells (−20%), but not cold steel (+30%)',
  },
  bleepBloop: {
    fierce: true, stomp: 2.0, adelay: 2000, summonCd: 30, stats: { def: 22, vit: 50, dex: 160 },
    moves: [
      { kind: 'mirror', name: 'Jelly Wall', decoy: 'jellyCore', n: 3, swap: false, text: 'BleepBloop wobbles, and three Jelly Cores rise round him! Pop them: he is shielded while they stand.' },
      { kind: 'meteors', name: 'Bloop Rain', mult: 1.6, r: 1.6, color: '#ff7a8a', cd: 20 },
      { kind: 'leap', name: 'Belly Flop', mult: 2.0, r: 2.4 },
      { kind: 'charge', name: "Veteran's Charge", mult: 1.8 },
    ],
    burns: { r: 1.5, dur: 4, mult: 0.2, slow: true, color: '#ff7a8a', word: 'Sticky!', text: 'sticky puddles' },
    takes: { melee: 0.7, magic: 1.3, beast: 0.8 },
    takesText: 'blades and fists sink into his jelly (−30%) and beasts get stuck (−20%), but spells burst it (+30%)',
  },
};
const raidDefs = {};
export function raidDef(type, lv, s = { hp: 1, atk: 1 }, guard = null) {
  return (raidDefs[`${type}@${lv}:${s.hp},${s.atk},${s.exp},${!!s.fierce}`] ||= (() => {
    const d = MOB_DEFS[type], k = d.boss ? 1 : STRENGTH[type] ?? 1, exp = 0.0122 * lv ** 3;
    return {
      ...d, ...(s.fierce ? FIERCE[type] : {}), lv, raidLv: lv, raidGuard: guard, passive: false, relentless: true, aggro: 99, chase: 99, split: null, drops: [],
      hp: Math.round(48 * lv * k * (d.boss ? 7 : 1) * s.hp * ((s.fierce && FIERCE[type].hpScale) || 1)),
      atk: [3.2, 4].map((a) => Math.round(a * lv * k * (d.boss ? 0.6 : 1) * s.atk)),
      def: Math.round(0.4 * lv * k), vit: Math.round(lv * k), agi: Math.round(0.8 * lv), dex: Math.round(1.5 * lv),
      ...(s.fierce ? FIERCE[type].stats : {}), // (an MVP's hide, not a Lv 104 raid boss's: about DEF 22)
      exp: [1, 0.7].map((j) => Math.round(exp * j * k * (d.boss ? 20 : 1) * (s.exp ?? s.hp))), // a weaker swarm is worth less
    };
  })());
}
// The bosses that once wore a crown have a look of their own instead (boss sets in sprites.js and
// beasts.js) and an aura: a glow pulsing on the ground under them and motes drifting up round them,
// in their colour (def.aura). The glow and mote textures are drawn once and shared.
let auraTex = null;
function auraTextures() {
  if (auraTex) return auraTex;
  const mk = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const glow = mk((g) => {
    const rg = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    rg.addColorStop(0, 'rgba(255,255,255,.75)'); rg.addColorStop(0.55, 'rgba(255,255,255,.3)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(32, 32, 24, 0, Math.PI * 2); g.stroke(); // a ring at its edge
  });
  const mote = mk((g) => {
    const rg = g.createRadialGradient(32, 32, 1, 32, 32, 30);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.3, 'rgba(255,255,255,.6)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  });
  return (auraTex = { glow, mote });
}
const AURA_MOTES = 9;
const ATTACK_ANIM = 0.5; // PixelLab monsters play their attack animation for this long
const STRIDE = 1.5;      // walk cycle length in body widths: legs keep pace with the ground

class Mob {
  constructor(mgr, type, x, z) {
    this.mgr = mgr;
    this.type = type;
    this.def = MOB_DEFS[type];
    this.art = mgr.lib.mobs[this.def.art];
    this.mat = new THREE.SpriteMaterial({ map: this.art.anims.down.idle[0], alphaTest: 0.5 });
    // palette swaps: the art times a colour. Wisps keep their own glow (no day/night tint)
    if (this.def.tint) this.mat.userData.tint = new THREE.Color(this.def.tint);
    if (!this.def.night && !this.def.glow) this.mgr.tint.push(this.mat);
    else if (this.def.tint) this.mat.color.copy(this.mat.userData.tint);
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.center.set(0.5, this.art.anchor);
    this.sprite.renderOrder = 2;
    this.shadow = new THREE.Mesh(mgr.shadowGeo, mgr.shadowMat);
    this.shadow.scale.setScalar(this.def.w * 0.9);
    mgr.scene.add(this.sprite, this.shadow);
    if (this.def.aura) {
      const tx = auraTextures(), col = new THREE.Color(this.def.aura);
      const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: col };
      const disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tx.glow, ...add, polygonOffset: true, polygonOffsetFactor: -3 }));
      disc.renderOrder = 1.5;
      const moteMat = new THREE.SpriteMaterial({ map: tx.mote, ...add });
      const motes = Array.from({ length: AURA_MOTES }, (_, i) => {
        const m = new THREE.Sprite(moteMat);
        m.renderOrder = 2.8;
        mgr.scene.add(m);
        return { s: m, a: (i / AURA_MOTES) * Math.PI * 2, t: i / AURA_MOTES, r: 0.55 + (i % 3) * 0.18 };
      });
      mgr.scene.add(disc);
      this.aura = { disc, motes };
    }
    this.home = { x, z };
    this.reset(x, z);
  }

  reset(x, z) {
    const d = this.def;
    this.x = x; this.z = z;
    this.hp = d.hp;
    this.alive = true;
    this.state = 'wander';
    this.t = Math.random() * 10;
    this.wanderT = Math.random() * 2;
    this.target = null;
    this.knock = { x: 0, z: 0 };
    this.flash = 0;
    this.atkCd = 1;
    this.chaseT = 0;
    this.tired = 0;
    this.angry = 0;
    this.blocked = 0;
    this.hop = Math.random();
    this.special = 0;    // charge / puff timer
    this.specialCd = 2;
    this.heading = { x: 0, z: 1 };
    this.atkAnim = 0;
    this.walked = 0; // distance walked, drives the walk cycle
    this.provokeT = 0; // taunted: it comes for you
    this.stunT = 0;
    this.calls = 0;          // times it has called its guards (bosses)
    this.marks = 0;          // the HP marks it has passed that call guards (callMarks)
    this.enraged = false;    // an MVP below half its HP (MVP_RAGE)
    this.act = null;         // a boss move in progress: { kind, t, ... }
    this.moveCd = {};        // per move: seconds until it can be used again
    this.nextMove = 3;       // seconds until any move
    this.rageT = 0;          // frenzy left
    this.barkT = 0;          // Bark Armor left (MOVES.bark)
    this.under = false;      // burrowed (MOVES.burrow): can't be hit
    this.wardSaid = -9;      // when it last showed that a blow was shielded
    this.kiteT = 0;          // how long you have kept out of its reach (BRAIN)
    this.rushT = 0; this.rushCd = 0; // its burst of pursuit, and when it may give chase again
    this.calmT = 99;         // how long it has been out of the fight (it heals only after BRAIN.calm)
    this.lastMove = null;
    this.status = null;      // why it is helpless while stunT lasts: freeze, paralyze, stun
    this.burnT = 0;          // burning (main.js inflict)
    this.foe = null;         // a companion beast it has turned on (allies.js), else it fights the hero
    this.mat.userData.fx = null;
    this.guardsGoneT = -1e9; // when (its own clock, this.t) its last guard fell
    this.sprite.visible = this.shadow.visible = true;
    const upp = d.w / this.art.body[0]; // def.w is the body width
    this.sprite.scale.set(this.art.fw * upp, this.art.fh * upp, 1);
    this.mat.rotation = 0;
  }

  // a boss or MVP roams the whole map: walks to a random spot, rests a moment, picks another.
  // Where it last headed is its home, so after a chase it goes back to its roaming
  roam(dt, spd, moved) {
    if (!this.target || this.wanderT <= 0) {
      if (this.target === null && this.restT > 0) { this.restT -= dt; return; }
      const s = this.mgr.findSpot(Math.random);
      if (!s) return;
      this.target = s;
      this.home = { x: s.x, z: s.z };
      this.wanderT = 30;
    }
    const m = this.moveToward(this.target.x, this.target.z, spd, dt);
    moved(m > 0);
    if (this.noWay) { this.noWay = false; this.target = null; this.restT = 0.3; return; } // (no way there: somewhere else)
    // stuck against a rock or a tent (it slides but gets nowhere): pick somewhere else
    const c = this.roamCheck ||= { t: 0, x: this.x, z: this.z };
    if ((c.t += dt) > 1.2) { const gone = Math.hypot(this.x - c.x, this.z - c.z); Object.assign(c, { t: 0, x: this.x, z: this.z }); if (gone < spd * 0.3) this.wanderT = 0; }
    if (Math.hypot(this.target.x - this.x, this.target.z - this.z) < 0.5 || m === 0) { this.target = null; this.restT = 1.5 + Math.random() * 3; }
  }

  // where to aim at p: where it is going (BRAIN.read of the time, more for a fierce boss), lead s ahead
  // at its pace, no more than BRAIN.lead paces and only onto open ground; else where it stands
  aimAt(p, lead) {
    const v = p === this.mgr.hero ? this.mgr.pv : null, w = this.mgr.world;
    if (!v || this.mgr.movingT < BRAIN.moving || Math.random() >= BRAIN.read[fierce(this.def) ? 'fierce' : 'boss']) return { x: p.x, z: p.z };
    let ax = v.x * lead * BRAIN.lead, az = v.z * lead * BRAIN.lead;
    const far = Math.hypot(ax, az);
    if (far > BRAIN.ahead) { ax *= BRAIN.ahead / far; az *= BRAIN.ahead / far; }
    const s = { x: p.x + ax, z: p.z + az };
    return w.walkable(s.x, s.z) && !w.isSafe(s.x, s.z) && !nearPortal(w, s.x, s.z, this.def.r) ? s : { x: p.x, z: p.z };
  }

  // stuck (BRAIN.stuck s out of reach without getting any nearer): it bounds over onto you (BOUND)
  unstick(dt, p, dist) {
    const c = this.stuckCheck ||= { t: 0, d: dist, for: 0 };
    if ((c.t += dt) < 1) return false;
    c.for = dist > this.def.reach + 0.5 && dist > c.d - 0.3 && !this.path ? c.for + c.t : 0; // (not while it goes the long way round)
    c.t = 0; c.d = dist;
    const w = this.mgr.world;
    if (c.for < BRAIN.stuck || this.act || nearPortal(w, p.x, p.z, this.def.r) || !w.walkable(p.x, p.z) || w.isSafe(p.x, p.z)) return false;
    c.for = 0;
    const L = MOVES.leap, dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz) || 1;
    this.heading = { x: dx / d, z: dz / d };
    this.act = { kind: 'leap', mv: BOUND, t: L.wind + L.air, from: { x: this.x, z: this.z }, spot: { x: p.x, z: p.z } };
    this.atkAnim = ATTACK_ANIM * 1.6;
    this.mgr.emit('move', this, this.act);
    return true;
  }

  // a boss picks the move that suits the moment (BRAIN), of those it is ready and in range for (MOVES)
  pickMove(p, dist, dx, dz) {
    const d = this.def, still = this.mgr.stillT > 1 && p === this.mgr.hero, casting = !!p.cast;
    const ready = (d.moves || []).filter((mv) => {
      const M = MOVES[mv.kind];
      if ((this.moveCd[mv.kind] || 0) > 0) return false;
      if (mv.kind === 'frenzy' || mv.kind === 'bark') return this.hp / d.hp <= M.below;
      if (mv.kind === 'mirror') return this.hp / d.hp <= M.below && !this.mgr.decoysOf(this).length;
      if (dist < M.min || dist > M.max) return false;
      return !(mv.kind === 'leap' && nearPortal(this.mgr.world, p.x, p.z, d.r)); // not onto a portal
    });
    const score = (mv) => {
      let s = 1 + Math.random() * 0.6;
      if (['frenzy', 'bark', 'mirror'].includes(mv.kind)) s += 2; // its own: as soon as it may
      if (['charge', 'leap', 'burrow'].includes(mv.kind)) s += Math.min(this.kiteT, 6) * 0.5 + (casting ? 1.5 : 0) + (dist > 5 ? 0.6 : 0);
      if (['throw', 'meteors', 'roots'].includes(mv.kind)) s += (still ? 0.8 : 0) + (dist >= 3 && dist <= 9 ? 0.5 : 0);
      if (mv.kind === this.lastMove) s -= 0.8;
      return s;
    };
    const mv = ready.sort((a, b) => score(b) - score(a))[0];
    if (!mv) return;
    this.lastMove = mv.kind;
    {
      const M = MOVES[mv.kind];
      if (mv.kind === 'frenzy') {
        this.rageT = M.dur;
        this.mgr.emit('frenzy', this);
      } else if (mv.kind === 'mirror') {
        this.mgr.mirror(this, mv);
      } else if (mv.kind === 'bark') {
        this.barkT = M.dur;
        this.atkAnim = ATTACK_ANIM * 1.6;
        this.mgr.emit('bark', this, mv);
      } else {
        // (where it aims: where you are going, more often than not)
        const spot = this.aimAt(p, mv.kind === 'throw' ? M.wind + M.land : mv.kind === 'leap' ? M.wind + M.air : mv.kind === 'roots' ? M.wind + M.land : mv.kind === 'charge' ? M.wind : 0);
        const sx = spot.x - this.x, sz = spot.z - this.z, sd = Math.hypot(sx, sz) || 1;
        this.heading = { x: sx / sd, z: sz / sd };
        if (mv.kind === 'charge') this.act = { kind: 'charge', mv, t: M.wind, phase: 'wind', left: Math.min(sd + 2, M.max) };
        if (mv.kind === 'throw') this.act = { kind: 'throw', mv, t: M.wind, spot };
        if (mv.kind === 'meteors') this.act = { kind: 'meteors', mv, t: M.wind };
        if (mv.kind === 'burrow') this.act = { kind: 'burrow', mv, t: M.dig, phase: 'dig' };
        if (mv.kind === 'roots') { // where you stand, and enraged two more patches beside you
          const spots = [spot];
          if (this.enraged) for (let i = 0; i < 2; i++) { const a = Math.random() * Math.PI * 2; spots.push({ x: spot.x + Math.cos(a) * 2.4, z: spot.z + Math.sin(a) * 2.4 }); }
          this.act = { kind: 'roots', mv, t: M.wind, spots };
        }
        if (mv.kind === 'leap') this.act = { kind: 'leap', mv, t: M.wind + M.air, from: { x: this.x, z: this.z }, spot };
        this.atkAnim = ATTACK_ANIM * 1.6;
        this.mgr.emit('move', this, this.act);
      }
      this.moveCd[mv.kind] = (mv.cd ?? M.cd) * (this.enraged && mv.kind !== 'frenzy' ? MVP_RAGE.cd : 1); // (a move may wait longer than its kind: mv.cd)
      if (mv.kind === 'bark' || mv.kind === 'mirror' || mv.kind === 'frenzy') { this.nextMove = 0.5; return; } // (a self move: it can act again at once)
      this.nextMove = this.enraged ? (Math.random() < BRAIN.combo ? 0.35 : MVP_RAGE.gap) : fierce(d) ? MVP_GAP : 2.2;
      this.nextMove *= 0.8 + Math.random() * 0.4; // (never quite the same beat: its moves can't be counted)
      if (this.kiteT > BRAIN.kite / 2) this.nextMove *= 0.6; // kept away from you: it presses harder
    }
  }

  // a move in progress, frame by frame: { moving, lift }
  acting(dt, p, dist, dx, dz) {
    const a = this.act, M = MOVES[a.kind];
    a.t -= dt;
    if (a.kind === 'charge') {
      if (a.phase === 'wind') { // crouched, glaring
        if (a.t <= 0) { a.phase = 'run'; a.hit = false; this.mgr.emit('rush', this); }
        return { moving: false, lift: 0 };
      }
      if (a.phase === 'run') {
        const step = Math.max(8, this.def.speed * 2.5) * dt, ok = this.tryMove(this.heading.x * step, this.heading.z * step);
        a.left -= step;
        this.atkAnim = ATTACK_ANIM;
        if (!a.hit && dist < this.def.reach + 0.5) { a.hit = true; this.mgr.emit('rammed', this, a.mv.mult); }
        if (!ok || a.left <= 0 || a.hit) { a.phase = 'rest'; a.t = 0.7; }
        return { moving: ok, lift: 0 };
      }
      if (a.t <= 0) this.act = null; // winded
      return { moving: false, lift: 0 };
    }
    if (a.kind === 'throw') {
      if (!a.thrown && a.t <= 0) { a.thrown = true; a.t = 0.35; this.atkAnim = ATTACK_ANIM; this.mgr.emit('throw', this, a.spot, a.mv, M.land); }
      else if (a.thrown && a.t <= 0) this.act = null;
      return { moving: false, lift: 0 };
    }
    if (a.kind === 'meteors') {
      if (a.t <= 0) { this.act = null; this.atkAnim = ATTACK_ANIM; this.mgr.emit('meteors', this, a.mv, this.enraged ? 7 : M.n); }
      return { moving: false, lift: 0 };
    }
    if (a.kind === 'burrow') { // digs in, goes under (it can't be hit), and bursts out where you stood
      if (a.phase === 'dig') {
        if (a.t <= 0) { a.phase = 'under'; a.t = M.under; this.under = true; this.mgr.emit('burrow', this); }
        return { moving: false, lift: 0 };
      }
      if (!a.spot && a.t <= M.mark) { a.spot = this.aimAt(p, M.mark); this.mgr.emit('burrowMark', this, a.spot, a.mv, M.mark); }
      if (a.t <= 0) {
        const w = this.mgr.world, s = a.spot || { x: p.x, z: p.z };
        if (w.walkable(s.x, s.z) && !w.isSafe(s.x, s.z) && !nearPortal(w, s.x, s.z, this.def.r)) { this.x = s.x; this.z = s.z; }
        this.under = false;
        this.act = null;
        this.atkAnim = ATTACK_ANIM;
        this.mgr.emit('erupt', this, a.mv, s);
      }
      return { moving: false, lift: 0 };
    }
    if (a.kind === 'roots') {
      if (a.t <= 0) { this.act = null; this.atkAnim = ATTACK_ANIM; this.mgr.emit('roots', this, a.spots, a.mv, M.land); }
      return { moving: false, lift: 0 };
    }
    if (a.kind === 'leap') {
      const k = Math.min(1, Math.max(0, 1 - a.t / M.air)); // 0 at take-off, 1 on landing
      if (a.t <= M.air) {
        this.x = a.from.x + (a.spot.x - a.from.x) * k;
        this.z = a.from.z + (a.spot.z - a.from.z) * k;
      }
      if (a.t <= 0) {
        this.act = null;
        this.atkAnim = ATTACK_ANIM;
        this.mgr.emit('slam', this, a.mv);
        return { moving: false, lift: 0 };
      }
      return { moving: false, lift: a.t <= M.air ? Math.sin(k * Math.PI) * 2.2 : 0 };
    }
    this.act = null;
    return { moving: false, lift: 0 };
  }

  // where a step would end (resolved against rocks and walls), or null if it may not go there
  stepTo(dx, dz) {
    const w = this.mgr.world;
    const [rx, rz] = w.resolve(this.x + dx, this.z + dz, this.def.r);
    if (w.isSafe(rx, rz) || !w.walkable(rx, rz)) return null;
    // never onto a portal (though one somehow inside the edge may always step away from it)
    if (nearPortal(w, rx, rz, this.def.r) && portalGap(w, rx, rz) <= portalGap(w, this.x, this.z)) return null;
    return [rx, rz];
  }
  tryMove(dx, dz) {
    const to = this.stepTo(dx, dz);
    if (!to) return false;
    [this.x, this.z] = to;
    return true;
  }

  // a step toward (tx, tz). A boss blocked a moment (a rock, a tree, a wall, a dead-end pocket) finds
  // a way round (path.js) and follows it, finding it again if you have moved on or it is still
  // stuck; with no way to where it was going (noWay), a roaming boss picks somewhere else
  moveToward(tx, tz, speed, dt) {
    const boss = this.def.ai === 'boss' || this.def.boss || this.def.mvp;
    if (boss && this.path) {
      const P = this.path;
      if (Math.hypot(P.goal.x - tx, P.goal.z - tz) < 1.5 && this.t - P.at < 3 && P.pts.length) {
        if (P.pts.length > 1 && Math.hypot(P.pts[0].x - this.x, P.pts[0].z - this.z) < 0.45) P.pts.shift();
        const wp = P.pts[0], got = this.step(wp.x, wp.z, speed, dt);
        if (Math.hypot(wp.x - this.x, wp.z - this.z) < 0.45) P.pts.shift();
        if (!P.pts.length) this.path = null;
        if (got > 1e-4) return got;
      }
      this.path = null;
    }
    const before = Math.hypot(tx - this.x, tz - this.z), s = Math.min(before, speed * dt), got = this.step(tx, tz, speed, dt);
    if (boss) {
      // blocked: hardly any nearer for all its stepping (sliding along a rock, or back and forth)
      const nearer = before - Math.hypot(tx - this.x, tz - this.z);
      this.blockT = nearer < s * 0.4 ? (this.blockT || 0) + dt : Math.max(0, (this.blockT || 0) - dt);
      if (this.blockT > 0.35 && this.t - (this.pathTried ?? -9) > 1) {
        this.pathTried = this.t; this.blockT = 0;
        const w = this.mgr.world, pts = findPath(w, this.x, this.z, tx, tz, this.def.r, (x, z) => !nearPortal(w, x, z, this.def.r));
        this.path = pts?.length ? { goal: { x: tx, z: tz }, pts, at: this.t } : null;
        this.noWay = !pts;
      }
    }
    return got;
  }

  // one step toward (tx, tz); blocked, it steers round, trying wider angles to one side and the
  // other, and keeps to the side that worked a moment so it doesn't dither
  step(tx, tz, speed, dt) {
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const s = Math.min(d, speed * dt), base = Math.atan2(dz, dx);
    const side = this.steerT > 0 ? this.steerSide : 1;
    let best = null; // (a step that only slides a little along a rock is no step: try the next angle)
    for (const a of [0, 0.6, -0.6, 1.2, -1.2, 1.7, -1.7, 2.3, -2.3]) {
      const ux = Math.cos(base + a * side), uz = Math.sin(base + a * side), to = this.stepTo(ux * s, uz * s);
      if (!to) continue;
      const got = Math.hypot(to[0] - this.x, to[1] - this.z);
      if (got >= s * 0.5) { best = { to, ux, uz, a, got }; break; }
      if (!best || got > best.got) best = { to, ux, uz, a, got };
    }
    if (!best || best.got < 1e-4) { this.heading = { x: dx / d, z: dz / d }; return 0; }
    [this.x, this.z] = best.to;
    this.heading = { x: best.ux, z: best.uz };
    if (best.a) { this.steerSide = Math.sign(best.a * side); this.steerT = 0.8; }
    return best.got;
  }

  // the monster's numbers as the battle rules see them
  effDef() { return this.def; }

  // taunted (War Cry, a thrown stone): it comes for you for a while, from further away
  provoke() {
    this.provokeT = 30;
    this.angry = 30;
    this.state = 'chase';
    this.chaseT = 30;
    this.tired = 0;
  }

  // from: the beast that struck (allies.js), else the hero
  // the Ancient Treant Card's Bark Armor on the one this struck up close: a share of the blow back
  thorns(p, dmg) {
    const k = p.ps?.reflect;
    if (!k || !this.alive) return;
    const back = Math.max(1, Math.round(dmg * k / 100));
    this.mgr.emit('thorns', this, back);
    this.hit(back, 0, 0);
  }
  hit(dmg, fx, fz, from = null) {
    if (!this.alive) return;
    const ward = this.ward();
    if (ward < 1 && dmg > 0) { // underground, behind its tribe, shrouded by its shadows: little or nothing lands
      dmg = ward > 0 ? Math.max(1, Math.round(dmg * ward)) : 0;
      if (this.t - this.wardSaid > 1.2) { this.wardSaid = this.t; this.mgr.emit('warded', this); }
      if (!dmg) return;
    }
    if (this.barkT > 0 && dmg > 0) { // Bark Armor: less lands, and some of it goes back (main.js)
      dmg = Math.max(1, Math.round(dmg * BARK.taken));
      this.mgr.emit('reflect', this, Math.max(1, Math.round(dmg * BARK.reflect)), from);
    }
    this.hp -= dmg;
    this.flash = 0.09;
    if (this.lulled) { this.lulled = false; this.provoke(); } // a blow wakes a lulled boss (the vigil's song breaks)
    const k = this.def.mvp ? 0 : this.def.heavy ? 0.8 : 1.6; // a small nudge: Ragnarok monsters barely move when hit
    this.knock.x = fx * k;
    this.knock.z = fz * k;
    if (this.def.ai === 'skittish') this.angry = this.def.angry;
    else if (this.def.passive || this.def.ai === 'archer') this.angry = Math.max(this.angry, 30); // hit a passive monster and it fights back for a while
    if (this.def.boss) this.knock.x = this.knock.z = 0; // bosses stand their ground
    // a boss first calls its guards when it falls below 60% HP, an MVP at 80%, 50% and 25% (later calls: see update)
    if (this.def.summon && this.hp > 0 && this.passMarks()) { this.calls++; this.mgr.summon(this); }
    if (['hopper', 'tank', 'puffer', 'boss', 'assassin'].includes(this.def.ai)) {
      this.state = 'chase';
      this.chaseT = Math.max(this.chaseT, this.def.chase || 4);
      this.tired = 0;
    }
    if (this.hp <= 0) this.mgr.kill(this);
  }

  // the share of a blow that lands now: 0 burrowed, less behind its tribe (def.tribe) or its shadows
  ward() {
    if (this.under) return 0;
    if (this.def.tribe && this.mgr.guardsOf(this).some((g) => !g.def.decoy)) return 1 - this.def.tribe;
    if (this.mgr.decoysOf(this).length) return MIRROR;
    return 1;
  }

  // passes the guard-calling HP marks it is now under; true if it passed any
  passMarks() {
    const marks = callMarks(this.def), m0 = this.marks;
    while (this.marks < marks.length && this.hp / this.def.hp < marks[this.marks]) this.marks++;
    return this.marks > m0;
  }

  // how much harder than its ATK it hits now (an enraged MVP), for its blows, stomps and moves
  get fury() { return this.enraged ? MVP_RAGE.atk : 1; }

  update(dt, player) {
    const d = this.def, p = player;
    this.t += dt;
    this.flash -= dt;
    this.atkCd -= dt;
    this.tired -= dt;
    this.angry -= dt;
    this.specialCd -= dt;
    this.wanderT -= dt;
    this.atkAnim -= dt;
    this.provokeT -= dt;
    this.steerT -= dt;

    if (Math.abs(this.knock.x) + Math.abs(this.knock.z) > 0.05) {
      this.tryMove(this.knock.x * dt, this.knock.z * dt);
      const k = Math.exp(-9 * dt);
      this.knock.x *= k;
      this.knock.z *= k;
    }

    // a boss calls again once all its guards are gone and the cooldown has passed, while it fights
    if (d.summon && this.calls && this.state === 'chase' && this.t - this.guardsGoneT >= summonCd(d) && !this.mgr.guardsOf(this).length) {
      this.calls++;
      this.mgr.summon(this);
    }
    // a summoned guard keeps by its leader, and fights when the leader fights
    const lead = this.leader;
    if (lead) {
      this.home = { x: lead.x, z: lead.z };
      if (lead.state === 'chase') {
        this.angry = Math.max(this.angry, 1);
        if (this.state !== 'chase') { this.state = 'chase'; this.tired = 0; }
        this.chaseT = Math.max(this.chaseT, 1);
      } else if (this.state === 'chase') { this.state = 'wander'; this.angry = 0; this.target = null; }
    }

    // a raid's monster never gives up: its home is wherever the hero is, and it keeps on chasing
    if (d.relentless) {
      this.home = { x: p.x, z: p.z };
      if (this.state !== 'chase') { this.state = 'chase'; this.target = null; }
      this.chaseT = Math.max(this.chaseT, 5);
      this.tired = 0;
      this.angry = Math.max(this.angry, 1);
    }

    const x0 = this.x, z0 = this.z; // after knockback, so being pushed doesn't move the legs
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    const low = this.hp / d.hp <= 0.3 && d.hp > 1;
    this.rageT -= dt;
    this.barkT -= dt;
    this.calmT = this.state === 'chase' ? 0 : this.calmT + dt;
    if ((d.mvp || d.boss) && this.calmT > BRAIN.calm && this.hp < d.hp) this.hp = Math.min(d.hp, this.hp + d.hp * BOSS_REGEN / 60 * dt);
    // an MVP below half its HP is enraged (MVP_RAGE); healed back over 60% it calms down
    if (fierce(d) && this.alive) {
      if (!this.enraged && this.hp / d.hp <= MVP_RAGE.below) { this.enraged = true; this.mgr.emit('enrage', this); }
      else if (this.enraged && this.hp / d.hp > MVP_RAGE.calm) this.enraged = false;
    }
    // as in Ragnarok, a monster keeps its pace however hurt it is (a frenzied boss speeds up, an enraged MVP too)
    this.rushT -= dt; this.rushCd -= dt;
    const speed = d.speed * (this.rageT > 0 ? 1.3 : 1) * (this.enraged ? MVP_RAGE.speed : 1) * (this.rushT > 0 ? BRAIN.rush : 1);
    let lift = 0;
    // Play Dead and safe ground (camp) make monsters lose interest
    const available = p.state !== 'down' && p.state !== 'feign' && !this.mgr.world.isSafe(p.x, p.z);
    const aggro = this.provokeT > 0 ? 14 : d.aggro;
    const hostile = !this.lulled && (!d.passive || this.angry > 0 || this.provokeT > 0); // a passive monster only fights back; a lulled one (the vigil's song) not at all
    // a roaming boss's home is where it was headed; once a fight starts, its home is where the fight
    // found it (else, struck on the way to a far spot, it turned straight back there and never fought)
    if (d.ai === 'boss' && this.state === 'chase' && this.was !== 'chase') this.home = { x: this.x, z: this.z };
    this.was = this.state;
    const homeD = Math.hypot(this.x - this.home.x, this.z - this.home.z);
    let moving = false;

    const wander = (spd = speed * 0.6) => {
      if (!this.target || this.wanderT <= 0) {
        if (Math.random() < 0.35) { this.target = null; this.wanderT = 1 + Math.random() * 2; return; }
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 3;
        this.target = { x: this.home.x + Math.cos(a) * r, z: this.home.z + Math.sin(a) * r };
        this.wanderT = 2 + Math.random() * 2.5;
      }
      if (this.target) {
        const m = this.moveToward(this.target.x, this.target.z, spd, dt);
        moving = m > 0;
        if (Math.hypot(this.target.x - this.x, this.target.z - this.z) < 0.3 || m === 0) this.target = null;
      }
    };
    const contact = () => {
      if (available && dist < d.reach + 0.3 && this.atkCd <= 0) {
        if (p.canBeHit()) {
          const res = mobAttack(d, p.ps, this.fury);
          if (res.miss) this.mgr.emit('miss', this, res);
          else { p.takeDamage(res.dmg, this.x, this.z); this.thorns(p, res.dmg); }
          if (d.double && Math.random() < d.double && p.canBeHit()) { // an assassin's second, quicker cut
            const again = mobAttack(d, p.ps, this.fury);
            if (!again.miss) { p.takeDamage(again.dmg, this.x, this.z); this.thorns(p, again.dmg); this.mgr.emit('double', this); }
          }
          this.mgr.emit('attack', this);
          this.atkAnim = ATTACK_ANIM;
          if (dist > 0.01) this.heading = { x: dx / dist, z: dz / dist };
        }
        this.atkCd = d.adelay / 1000 * (this.rageT > 0 ? 0.6 : 1) * (this.enraged ? MVP_RAGE.adelay : 1);
      }
    };

    // too far from home: back it goes (a roaming boss only when it was chasing you)
    if (!d.relentless && homeD > (d.mvp ? 40 : d.ai === 'boss' ? 30 : this.provokeT > 0 ? 20 : 11) && this.state !== 'return' && (d.ai !== 'boss' || this.state === 'chase')) this.state = 'return';
    if (this.stunT > 0) this.stunT -= dt; // stunned: stands there
    else if (this.state === 'return') {
      moving = this.moveToward(this.home.x, this.home.z, speed, dt) > 0;
      if (homeD < 2 || !moving) { this.state = 'wander'; this.tired = 2; }
    } else switch (d.ai) {
      case 'boss': {
        if (this.state === 'wander' && available && hostile && this.tired <= 0 && dist < aggro) {
          this.state = 'chase';
          this.chaseT = d.chase;
        }
        if (this.act) { // in the middle of a move: it finishes it, whatever else happens
          const r = this.acting(dt, p, dist, dx, dz);
          moving = r.moving;
          lift = r.lift;
          break;
        }
        if (this.state === 'chase') {
          this.chaseT -= dt;
          this.nextMove -= dt;
          for (const k in this.moveCd) this.moveCd[k] -= dt;
          const giveUp = d.mvp ? MVP_GIVE_UP : BRAIN.giveUp; // (a boss hunts you: it doesn't tire of you this side of it)
          if (dist < giveUp) this.chaseT = Math.max(this.chaseT, 1);
          // kept out of its reach, it gives chase in a burst (BRAIN)
          this.kiteT = dist > d.reach + 1.5 ? this.kiteT + dt : Math.max(0, this.kiteT - dt * 2);
          if (this.kiteT > BRAIN.kite && this.rushCd <= 0) { this.rushT = BRAIN.rushFor; this.rushCd = BRAIN.rushCd; this.mgr.emit('pursuit', this); }
          if (this.chaseT <= 0 || !available || dist > giveUp) { this.state = 'wander'; this.tired = 3; this.kiteT = 0; }
          else if (this.unstick(dt, p, dist)) { /* bounding over whatever was in its way */ }
          else if (this.special > 0) { // winding up a stomp: stand still, then it lands
            this.special -= dt;
            if (this.special <= 0) this.mgr.emit('stomp', this);
          } else {
            if (dist > d.reach * 0.7) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
            contact();
            if (dist < 3.2 && this.specialCd <= 0) {
              this.special = this.enraged ? 0.65 : 0.8;
              this.specialCd = this.enraged ? MVP_RAGE.stomp : 7;
              this.atkAnim = ATTACK_ANIM * 1.6;
              this.mgr.emit('windup', this);
            } else if (this.nextMove <= 0) this.pickMove(p, dist, dx, dz);
          }
        } else this.roam(dt, speed * 0.6, (m) => { moving = m; });
        break;
      }
      case 'hopper':
      case 'tank': {
        if (this.state === 'wander' && available && hostile && this.tired <= 0 && dist < aggro) {
          this.state = 'chase';
          this.chaseT = d.chase;
        }
        if (this.state === 'chase') {
          this.chaseT -= dt;
          if (this.chaseT <= 0 || !available || dist > aggro * 2.2) { this.state = 'wander'; this.tired = 3; }
          else {
            const hopping = d.ai !== 'hopper' || (this.hop % 1) < 0.55;
            if (this.special > 0) { // winding up a stomp: stand still, then it lands
              this.special -= dt;
              if (this.special <= 0) this.mgr.emit('stomp', this);
            } else {
              if (hopping && dist > d.reach * 0.7) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
              contact();
            }
          }
        } else wander();
        break;
      }
      case 'archer': {
        // keeps its distance and shoots; backs off when you come close
        if (available && (hostile && dist < aggro || this.angry > 0) && dist < aggro * 2) {
          if (dist > d.range) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
          else if (dist < 2.2) moving = this.moveToward(this.x - dx, this.z - dz, speed * 0.8, dt) > 0;
          if (dist > 0.01) this.heading = { x: dx / dist, z: dz / dist }; // it keeps facing you as it steps back
          if (dist <= d.range && this.atkCd <= 0) {
            this.atkCd = d.adelay / 1000;
            this.atkAnim = ATTACK_ANIM;
            this.mgr.emit('shoot', this);
          }
        } else wander();
        break;
      }
      case 'assassin': {
        // a quick chaser that darts the last few steps
        if (this.state === 'wander' && available && hostile && this.tired <= 0 && dist < aggro) { this.state = 'chase'; this.chaseT = d.chase; }
        if (this.state === 'chase') {
          this.chaseT -= dt;
          if (this.chaseT <= 0 || !available || dist > aggro * 2.2) { this.state = 'wander'; this.tired = 3; }
          else if (this.special > 0) { // the dash
            this.special -= dt;
            const dash = d.speed * 2.2 * dt; // a dart, much quicker than its walk
            moving = this.tryMove(this.heading.x * dash, this.heading.z * dash);
            if (!moving || dist < d.reach) this.special = 0;
            contact();
          } else {
            if (dist > d.reach * 0.7) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
            if (dist > 1.8 && dist < 4.5 && this.specialCd <= 0) {
              this.heading = { x: dx / dist, z: dz / dist };
              this.special = 0.35;
              this.specialCd = 3.5 + Math.random() * 1.5;
              this.mgr.emit('dash', this);
            }
            contact();
          }
        } else wander();
        break;
      }
      case 'skittish': {
        if (this.angry > 0 && available) {
          moving = dist > d.reach * 0.7 ? this.moveToward(p.x, p.z, speed * 1.5, dt) > 0 : false;
          contact();
        } else if (available && dist < d.fear) {
          const want = d.flee * dt;
          const m = this.moveToward(this.x - dx, this.z - dz, d.flee, dt);
          moving = m > 0;
          this.blocked = m < want * 0.3 ? this.blocked + dt : 0;
          if (this.blocked > 0.5) { this.angry = d.angry; this.blocked = 0; this.mgr.emit('cornered', this); }
        } else wander();
        break;
      }
      case 'crab': {
        // scuttles sideways around you, then charges in a straight line
        if (this.special > 0) {
          this.special -= dt;
          moving = this.tryMove(this.heading.x * 6.2 * dt, this.heading.z * 6.2 * dt);
          if (!moving) this.special = 0;
          contact();
        } else if (available && hostile && dist < aggro) {
          const sx = -dz / (dist || 1), sz = dx / (dist || 1);
          const side = Math.sin(this.t * 0.9) > 0 ? 1 : -1;
          const keep = dist > 3 ? 0.6 : dist < 2 ? -0.5 : 0;
          const mx = sx * side + (dx / dist) * keep, mz = sz * side + (dz / dist) * keep;
          moving = this.tryMove(mx * speed * dt, mz * speed * dt);
          if (this.specialCd <= 0 && dist < 4) {
            this.heading = { x: dx / dist, z: dz / dist };
            this.special = 0.5;
            this.specialCd = 2.6 + Math.random();
            this.mgr.emit('charge', this);
          }
          contact();
        } else wander();
        break;
      }
      case 'puffer': {
        if (this.state === 'wander' && available && hostile && dist < aggro && this.tired <= 0) { this.state = 'chase'; this.chaseT = d.chase; }
        if (this.state === 'chase') {
          this.chaseT -= dt;
          if (this.chaseT <= 0 || !available || dist > aggro * 2.2) { this.state = 'wander'; this.tired = 3; }
          else {
            if (dist > d.reach * 0.7) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
            if (dist < 2.3 && this.specialCd <= 0) {
              this.specialCd = 4.5;
              this.special = 0.4;
              this.mgr.emit('spore', this);
              this.atkAnim = ATTACK_ANIM;
            }
            contact();
          }
        } else wander();
        this.special -= dt;
        break;
      }
      case 'wisp': {
        const jitter = { x: Math.sin(this.t * 3.1) * 1.6, z: Math.cos(this.t * 2.3) * 1.6 };
        if (available && hostile && dist < aggro) {
          moving = this.moveToward(p.x + jitter.x * 0.6, p.z + jitter.z * 0.6, speed, dt) > 0;
          contact();
        } else {
          moving = this.moveToward(this.home.x + jitter.x * 2, this.home.z + jitter.z * 2, speed * 0.5, dt) > 0;
        }
        break;
      }
    }

    // ---- visuals ----
    this.walked += Math.hypot(this.x - x0, this.z - z0);
    if (d.ai === 'hopper') this.hop += dt * (moving ? 1.25 : 0.6);
    if (d.ai === 'hopper' && moving && this.hop % 1 < 0.55) lift = Math.sin(((this.hop % 1) / 0.55) * Math.PI) * 0.28 * d.w;
    else if (d.fly) lift = 0.7 + Math.sin(this.t * 4) * 0.15;
    const tex = this.frame(moving);
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }
    this.mat.rotation = low && !this.act ? Math.sin(this.t * 15) * 0.13 : 0;
    // a colour over the monster for what ails it (daynight.js multiplies it in)
    this.mat.userData.fx = this.stunT > 0 && this.status ? STATUS_COL[this.status]
      : this.burnT > 0 ? (Math.sin(this.t * 12) > 0 ? STATUS_COL.burn : STATUS_COL.burn2)
      : this.barkT > 0 ? (Math.sin(this.t * 6) > 0 ? STATUS_COL.bark : STATUS_COL.bark2)
      : this.rageT > 0 ? (Math.sin(this.t * 10) > 0 ? STATUS_COL.rage : STATUS_COL.rage2)
      : this.enraged ? (Math.sin(this.t * 4) > 0 ? STATUS_COL.rage : STATUS_COL.rage2) : null;
    if (!this.mgr.tint.includes(this.mat)) this.mat.color.copy(this.mat.userData.tint || WHITE).multiply(this.mat.userData.fx || WHITE);

    const y = this.mgr.world.heightAt(this.x, this.z);
    this.sprite.visible = this.shadow.visible = !this.under; // (burrowed: out of sight)
    this.sprite.position.set(this.x, y + lift, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
    if (this.aura) { // the glow pulses under the boss; motes rise round it, over its whole height
      const { disc, motes } = this.aura, on = this.sprite.visible, w = this.def.w;
      const top = this.sprite.scale.y * (this.art.body[1] / this.art.fh); // the top of the body, above the feet
      disc.visible = on;
      disc.position.set(this.x, y + 0.05, this.z);
      disc.scale.setScalar(w * (1.9 + Math.sin(this.t * 2.4) * 0.12));
      disc.material.opacity = 0.75 + Math.sin(this.t * 2.4) * 0.2;
      for (const m of motes) {
        const k = (m.t + this.t * 0.32) % 1, a = m.a + this.t * 0.9, r = m.r * w * (1 - k * 0.35);
        m.s.visible = on;
        m.s.position.set(this.x + Math.cos(a) * r, y + 0.1 + k * top * 1.05, this.z + Math.sin(a) * r * 0.7);
        m.s.scale.setScalar(w * 0.16 * Math.sin(k * Math.PI));
      }
    }
  }

  // frame by facing (relative to the camera) and by what the monster is doing
  frame(moving) {
    const set = this.art;
    const dir = dirFor(this.heading.x, this.heading.z, this.mgr.cam);
    const A = (this.flash > 0 ? set.flash : set.anims)[dir];
    let list = A.idle, k = 0;
    if (this.atkAnim > 0 && A.attack) { list = A.attack; k = 1 - this.atkAnim / ATTACK_ANIM; }
    else if (moving && this.def.ai === 'hopper' && A.hop) {
      const ph = this.hop % 1;
      if (ph < 0.55) { list = A.hop; k = ph / 0.55; }
    } else if (this.def.fly && A.walk) { list = A.walk; k = (this.t * 1.6) % 1; } // fliers flutter in place
    else if (moving && A.walk) { list = A.walk; k = (this.walked / (STRIDE * this.def.w)) % 1; }
    return list[Math.max(0, Math.min(list.length - 1, Math.floor(k * list.length)))]; // a long wind-up holds the first frame
  }
}

export class MobManager {
  constructor(scene, world, lib, fx) {
    this.scene = scene;
    this.world = world;
    this.lib = lib;
    this.fx = fx;
    this.list = [];
    this.dead = [];
    this.tint = [];
    this.handlers = {};
    this.night = false;
    this.bosses = []; // this map's bosses and MVPs (types): each appears when its time comes
    this.mvpAt = {};  // per boss and MVP: when it may next appear (ms since 1970; the game saves it)
    this.bossHp = {}; // per boss and MVP met in a fight: { hp, at, calls, guards: [[type, hp]], cd } (saved)
    this.bossAt = {}; // per boss and MVP alive on a map you left: where it stood, { map, x, z } (saved)
    this.cam = { fx: 0, fz: -1, rx: 1, rz: 0 }; // camera basis, set by the game each frame
    const sg = new THREE.PlaneGeometry(1, 0.6);
    sg.rotateX(-Math.PI / 2);
    this.shadowGeo = sg;
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: lib.shadow, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    });
  }

  on(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, ...a) { for (const fn of this.handlers[name] || []) fn(...a); }

  // a free spot for a monster's home, away from the portals you arrive by (and from you, if given)
  findSpot(rng, away = null) {
    for (let i = 0; i < 400; i++) {
      const x = 4 + rng() * 56, z = 4 + rng() * 56;
      if (this.world.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 9)) continue;
      if (away && Math.hypot(away.x - x, away.z - z) < 16) continue;
      if (!this.world.walkable(x, z)) continue;
      const [rx, rz] = this.world.resolve(x, z, 0.5);
      if (Math.hypot(rx - x, rz - z) > 0.01) continue;
      if (this.list.some((m) => Math.hypot(m.home.x - x, m.home.z - z) < 3)) continue;
      return { x, z };
    }
    return null;
  }

  // a new map: clear every monster and spawn the map's own. spawns: [[type, count, nightOnly]]
  setMap(spawns, seed = 11) {
    this.bossSnapshot(); // the bosses you leave behind keep their wounds
    for (const m of [...this.list]) this.remove(m);
    this.dead = [];
    this.bosses = [];
    const rng = mulberry32(seed);
    for (const [type, count, nightOnly] of spawns) {
      for (let i = 0; i < count; i++) {
        const s = this.findSpot(rng);
        if (!s) continue;
        // bosses and MVPs wait out their respawn time even across map changes and restarts (update)
        if (MOB_DEFS[type].mvp || MOB_DEFS[type].boss) { this.bosses.push(type); continue; }
        const m = this.add(type, s.x, s.z);
        m.nightOnly = !!nightOnly;
        if (nightOnly && !this.night) { m.alive = false; m.sprite.visible = m.shadow.visible = false; this.dead.push({ m, t: 0 }); }
      }
    }
  }

  // how every boss and MVP stands, those on this map now and those met before (for the save): its HP
  // and when, how often it has called its guards, the guards still standing, the summon cooldown left
  bossSnapshot() {
    for (const m of this.list) {
      if (!m.alive || !(m.def.mvp || m.def.boss) || m.temp) continue; // (a raid's boss is not kept)
      this.bossAt[m.type] = { map: m.map, x: +m.x.toFixed(2), z: +m.z.toFixed(2) }; // it waits there till you come back
      const guards = this.guardsOf(m).filter((g) => !g.def.decoy).map((g) => [g.type, Math.ceil(g.hp)]);
      const cd = m.calls && !guards.length ? Math.max(0, summonCd(m.def) - (m.t - m.guardsGoneT)) : 0;
      if (m.hp < m.def.hp || m.calls || guards.length) this.bossHp[m.type] = { hp: Math.ceil(m.hp), max: m.def.hp, at: Date.now(), calls: m.calls, guards, cd };
      else delete this.bossHp[m.type];
    }
    return this.bossHp;
  }

  guardsOf(boss) { return this.list.filter((o) => o.leader === boss && o.alive); }
  decoysOf(boss) { return this.guardsOf(boss).filter((o) => o.def.decoy); }

  // the Goblin King's Mirror Image: two shadows of him come, and he trades places with one. The
  // same move with another decoy (mv.decoy, mv.n; mv.swap false: he stays put) makes BleepBloop's
  // Jelly Wall: jelly cores round him, and he is shielded until they pop
  mirror(boss, mv = {}) {
    const type = mv.decoy || 'kingShadow', n = mv.n || 2;
    const made = Array.from({ length: n }, () => {
      const c = this.guard(boss, type, n);
      c.def = MOB_DEFS[type]; c.hp = c.def.hp;
      c.state = 'chase'; c.chaseT = 30; c.angry = 30;
      return c;
    });
    if (mv.swap !== false) {
      const o = made[Math.floor(Math.random() * n)];
      [boss.x, boss.z, o.x, o.z] = [o.x, o.z, boss.x, boss.z];
    }
    for (const c of [boss, ...made]) this.fx.puff(c.x, this.world.heightAt(c.x, c.z) + 0.4, c.z, 1.2);
    this.emit('mirror', boss, mv);
  }

  // a king's guards: they come running, and don't come back once beaten
  summon(boss) {
    const list = [...boss.def.summon];
    for (const g of this.guardsOf(boss)) { const i = list.indexOf(g.type); if (i >= 0) list.splice(i, 1); } // a full set: only those missing come
    if (!list.length) return;
    boss.mgr.emit('summon', boss);
    for (const type of list) {
      const c = this.guard(boss, type, list.length);
      c.state = 'chase';
      c.chaseT = 15;
      c.angry = 30;
    }
  }

  // one guard for a boss, placed in a ring round it (n: how many share the ring)
  guard(boss, type, n) {
    const a = Math.random() * Math.PI * 2 + (this.guardsOf(boss).length / n) * Math.PI * 2, r = 1.2 + boss.def.r;
    const c = this.add(type, boss.x + Math.cos(a) * r, boss.z + Math.sin(a) * r);
    if (!this.world.walkable(c.x, c.z)) { c.x = boss.x; c.z = boss.z; }
    c.temp = true;
    c.def = boss.def.raidLv ? lesser(raidDef(type, boss.def.raidLv - 3, boss.def.raidGuard || undefined)) : guardDef(type); // a raid boss's guards: at the raid's level and strength
    c.hp = c.def.hp;
    c.leader = boss; // it follows the boss and fights alongside it (see update)
    c.home = { x: boss.x, z: boss.z };
    return c;
  }

  add(type, x, z) {
    const m = new Mob(this, type, x, z);
    this.list.push(m);
    return m;
  }

  remove(m) {
    this.list = this.list.filter((o) => o !== m);
    this.scene.remove(m.sprite, m.shadow);
    if (m.aura) { this.scene.remove(m.aura.disc); for (const q of m.aura.motes) this.scene.remove(q.s); }
    m.mat.dispose();
    this.tint = this.tint.filter((t) => t !== m.mat);
  }

  kill(m) {
    m.alive = false;
    m.sprite.visible = m.shadow.visible = false;
    if (m.aura) { m.aura.disc.visible = false; for (const q of m.aura.motes) q.s.visible = false; }
    const y = this.world.heightAt(m.x, m.z) + (m.def.fly ? 0.7 : 0.3);
    this.fx.puff(m.x, y, m.z, m.def.w);
    const drops = [];
    for (const [item, min, max, chance] of m.def.drops) {
      if (Math.random() < chance) drops.push([item, min + Math.floor(Math.random() * (max - min + 1))]);
    }
    this.emit('death', m, drops);
    if (m.def.split) {
      for (const s of [-1, 1]) {
        const c = this.add(m.def.split, m.x + s * 0.4, m.z);
        c.home = { ...m.home };
        c.state = 'chase';
        c.chaseT = 5;
        c.knock = { x: s * 4, z: 0 };
        c.atkCd = 0.6;
      }
    }
    // a boss's guards go with it, as in Ragnarok (no EXP, no drops)
    for (const s of this.list.filter((o) => o.leader === m && o.alive)) {
      this.fx.puff(s.x, this.world.heightAt(s.x, s.z) + 0.3, s.z, s.def.w);
      this.remove(s);
    }
    // the last of a boss's guards falls: its summoning cooldown starts
    if (m.leader?.alive && !this.guardsOf(m.leader).some((o) => o !== m)) m.leader.guardsGoneT = m.leader.t;
    if (m.def.noRespawn || m.temp) { this.remove(m); return; }
    if (m.def.mvp || m.def.boss) { // gone until its respawn time comes round, whatever map you go to
      delete this.bossAt[m.type]; // (and it comes back somewhere new)
      this.mvpAt[m.type] = Date.now() + m.def.respawn * 1000;
      delete this.bossHp[m.type];
      this.emit(m.def.mvp ? 'mvp' : 'bossDown', m);
      this.remove(m);
      return;
    }
    this.dead.push({ m, t: m.def.respawn || RESPAWN });
  }

  update(dt, player) {
    // the hero's pace (smoothed), and how long they have stood still: a boss reads them (BRAIN)
    this.hero = player;
    const pv = this.pv ||= { x: 0, z: 0 };
    if (this.pLast && dt > 0) {
      const vx = (player.x - this.pLast.x) / dt, vz = (player.z - this.pLast.z) / dt;
      if (Math.hypot(vx, vz) < 12) { const k = Math.min(1, dt * 6); pv.x += (vx - pv.x) * k; pv.z += (vz - pv.z) * k; } // (not a jump between maps)
      else { pv.x = pv.z = 0; }
    }
    this.pLast = { x: player.x, z: player.z };
    const pace = Math.hypot(pv.x, pv.z);
    this.stillT = pace < 0.3 ? (this.stillT || 0) + dt : 0;
    this.movingT = pace > 1 ? (this.movingT || 0) + dt : 0; // (on the move: a run, not a step aside)
    // a boss or MVP appears once its time has come, somewhere on the map away from you
    for (const type of this.bosses) {
      if (Date.now() < (this.mvpAt[type] || 0) || this.list.some((m) => m.type === type)) continue;
      const at = this.bossAt[type], w0 = this.world; // where you left it, if it still stands there
      const s = at && at.map === w0.id && w0.walkable(at.x, at.z) ? at : this.findSpot(Math.random, player);
      if (!s) continue;
      const m = this.add(type, s.x, s.z);
      m.map = w0.id; // (the map it walks: setMap snapshots it after the world has moved on)
      const w = this.bossHp[type]; // as you left it: its wounds (less what it healed since) and its guards
      if (w) {
        // (its wounds as a share of its HP, should that have changed; an MVP left wounded before MVPs
        // got their much bigger HP comes back whole)
        const hp = w.max ? w.hp * m.def.hp / w.max : m.def.mvp ? m.def.hp : w.hp;
        m.hp = Math.min(m.def.hp, hp + m.def.hp * BOSS_REGEN * (Date.now() - w.at) / 60000);
        m.calls = w.calls || 0;
        m.passMarks(); // (the marks it is under called their guards before)
        if (w.cd) m.guardsGoneT = m.t - (summonCd(m.def) - w.cd);
        for (const [g, hp] of w.guards || []) if (MOB_DEFS[g]) this.guard(m, g, w.guards.length).hp = Math.min(MOB_DEFS[g].hp, hp);
      }
      this.emit('mvpSpawn', m);
    }
    // each monster fights its foe: the hero, or a companion beast that drew it (allies.js) while that
    // beast is out and near
    for (const m of this.list) {
      if (!m.alive) continue;
      if (m.foe && (!m.foe.alive || Math.hypot(m.foe.x - m.x, m.foe.z - m.z) > 12)) m.foe = null;
      m.update(dt, m.foe || player);
    }
    // keep monsters from stacking on top of each other
    const alive = this.list.filter((m) => m.alive);
    for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = a.def.r + b.def.r;
      if (d < min && d > 1e-4) {
        const push = (min - d) / 2;
        a.tryMove((-dx / d) * push, (-dz / d) * push);
        b.tryMove((dx / d) * push, (dz / d) * push);
      }
    }
    // respawn out of view: twice as fast at night, and twice as fast for what a quest is hunting
    for (let i = this.dead.length - 1; i >= 0; i--) {
      const e = this.dead[i];
      const wanted = this.hunted?.has(e.m.type) && !e.m.def.boss && !e.m.def.mvp;
      e.t -= dt * (this.night ? 2 : 1) * (wanted ? 2 : 1);
      const far = Math.hypot(player.x - e.m.home.x, player.z - e.m.home.z) > 14;
      const nightOnly = e.m.def.night || e.m.nightOnly;
      if (e.t <= 0 && far && (!nightOnly || this.night)) {
        e.m.reset(e.m.home.x, e.m.home.z);
        this.dead.splice(i, 1);
      }
    }
  }

  nearest(x, z, max) {
    let best = null, bd = max;
    for (const m of this.list) {
      if (!m.alive) continue;
      const d = Math.hypot(m.x - x, m.z - z) - m.def.r;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  hitArc(x, z, face, range, cosHalf, dmg) {
    let n = 0;
    for (const m of [...this.list]) {
      if (!m.alive) continue;
      const dx = m.x - x, dz = m.z - z, d = Math.hypot(dx, dz);
      if (d > range + m.def.r) continue;
      const dot = d < 0.4 ? 1 : (dx * face.x + dz * face.z) / d;
      if (dot < cosHalf) continue;
      m.hit(dmg, d > 0 ? dx / d : face.x, d > 0 ? dz / d : face.z);
      n++;
    }
    return n;
  }

  // night-only monsters fade in and out with the dark
  setNight(night) {
    this.night = night;
    for (const m of this.list) {
      if (!m.def.night && !m.nightOnly) continue;
      if (!night && m.alive) {
        m.alive = false;
        m.sprite.visible = m.shadow.visible = false;
        if (!this.dead.some((e) => e.m === m)) this.dead.push({ m, t: 0 });
      }
    }
  }
}
