// Small monsters with hidden HP. No health bars: hits flash white and knock back,
// below 30% HP they wobble and slow down, at 0 they vanish in a puff.
import * as THREE from 'three';
import { mulberry32, dirFor } from './noise.js';
import { mobAttack } from './rules.js';


// Battle stats follow Ragnarok's rules (rules.js): lv, hp, atk [min, max], def (hard DEF %),
// vit (soft DEF), agi (FLEE = lv + agi), dex (HIT = lv + dex), exp [base, job], adelay = ms
// between attacks. Each is modelled on a classic monster of the same level.
// el: element (rules.js ELEMENTS). drops: [itemId, min, max, chance]. Rare finds are Ragnarok-rare: 0.15-0.5% (15-50 in 10 000)
// passive: like most of Ragnarok's field monsters, it minds its own business until you hit it.
// Levels climb map by map, from the valley (1-14) through the new lands (18-45) to the Fire Giant (60).
export const MOB_DEFS = {
  slime: { name: 'Slime', ai: 'hopper', art: 'slime', el: 'water', lv: 1, hp: 50, atk: [7, 10], def: 0, vit: 1, agi: 1, dex: 6, exp: [2, 1], adelay: 1872, passive: true, speed: 1.7, aggro: 4.5, chase: 4, reach: 0.8, w: 0.9, r: 0.35, drops: [['gel', 1, 2, 1], ['berry', 1, 1, 0.12], ['shiny_gel', 1, 1, 0.01], ['gooey_ring', 1, 1, 0.005]] },
  blueSlime: { name: 'Blue Slime', ai: 'hopper', art: 'slimeBlue', el: 'water', lv: 6, hp: 150, atk: [13, 17], def: 0, vit: 5, agi: 5, dex: 11, exp: [9, 6], adelay: 1600, passive: true, speed: 1.8, aggro: 4.5, chase: 4.5, reach: 0.8, w: 1.0, r: 0.38, split: 'miniSlime', drops: [['gel', 1, 1, 1], ['dew', 1, 1, 0.6], ['tonic', 1, 1, 0.04], ['shiny_gel', 1, 1, 0.01], ['tide_pendant', 1, 1, 0.003]] },
  miniSlime: { name: 'Little Slime', ai: 'hopper', art: 'slimeBlue', el: 'water', lv: 4, hp: 50, atk: [10, 13], def: 0, vit: 3, agi: 4, dex: 9, exp: [3, 2], adelay: 1400, speed: 2.3, aggro: 6, chase: 5, reach: 0.6, w: 0.55, r: 0.22, noRespawn: true, drops: [['dew', 1, 1, 0.5]] },
  sprout: { name: 'Sprout', ai: 'skittish', art: 'sprout', el: 'earth', lv: 3, hp: 70, atk: [9, 12], def: 0, vit: 3, agi: 3, dex: 8, exp: [4, 3], adelay: 1456, passive: true, speed: 1.5, flee: 2.9, fear: 3.5, angry: 6, reach: 0.8, w: 0.95, r: 0.35, drops: [['seed', 1, 1, 1], ['leaf', 1, 1, 0.6], ['berry', 1, 1, 0.2], ['herb', 1, 1, 0.25], ['seedling_band', 1, 1, 0.004], ['flower_wreath', 1, 1, 0.005]] },
  crab: { name: 'Crab', ai: 'crab', art: 'crab', el: 'water', lv: 9, hp: 280, atk: [22, 28], def: 6, vit: 9, agi: 8, dex: 14, exp: [20, 14], adelay: 1300, passive: true, speed: 1.6, aggro: 5, reach: 0.85, w: 1.1, r: 0.42, drops: [['shell', 1, 2, 1], ['crableg', 1, 1, 0.25], ['mud_buckler', 1, 1, 0.003]] },
  mushling: { name: 'Mushroom', ai: 'puffer', art: 'mushling', el: 'earth', lv: 14, hp: 520, atk: [32, 44], def: 2, vit: 18, agi: 14, dex: 30, exp: [45, 32], adelay: 1768, passive: true, speed: 1.2, aggro: 4, chase: 6, reach: 0.8, w: 0.95, r: 0.36, drops: [['spore', 1, 2, 1], ['herb', 1, 1, 0.2], ['potion', 1, 1, 0.08], ['spore_cloak', 1, 1, 0.0025]] },
  beetle: { name: 'Beetle', ai: 'tank', art: 'beetle', el: 'earth', lv: 30, hp: 1500, atk: [88, 110], def: 22, vit: 30, agi: 20, dex: 46, exp: [330, 230], adelay: 1500, passive: true, speed: 1.15, aggro: 4, chase: 8, reach: 0.9, w: 1.15, r: 0.45, heavy: true, drops: [['stone', 1, 2, 1], ['potion2', 1, 1, 0.06], ['pebble_ring', 1, 1, 0.003], ['horn_blade', 1, 1, 0.0015]] },
  wisp: { name: 'Wisp', ai: 'wisp', art: 'wisp', el: 'wind', lv: 11, hp: 290, atk: [26, 33], def: 4, vit: 8, agi: 24, dex: 22, exp: [26, 19], adelay: 1292, passive: true, speed: 2.4, aggro: 6, reach: 0.75, w: 0.7, r: 0.3, fly: true, glow: true, drops: [['glow', 1, 1, 1], ['wander', 1, 1, 0.15], ['wisp_lantern', 1, 1, 0.004]] },
  // ---------- the new lands: palette swaps of the valley's monsters, Ragnarok style (tint) ----------
  russet: { name: 'Red Sprout', ai: 'tank', art: 'sprout', el: 'earth', tint: '#ffb47a', lv: 18, hp: 650, atk: [44, 58], def: 5, vit: 18, agi: 18, dex: 34, exp: [80, 56], adelay: 1500, passive: true, speed: 1.4, aggro: 4.5, chase: 6, reach: 0.8, w: 1.0, r: 0.36, drops: [['thorn', 1, 1, 0.55], ['seed', 1, 1, 0.6], ['leaf', 1, 1, 0.4], ['berry', 1, 1, 0.2], ['bramble_ring', 1, 1, 0.003]] },
  brine: { name: 'Sea Slime', ai: 'hopper', art: 'slimeBlue', el: 'water', tint: '#a8ffd8', lv: 22, hp: 880, atk: [56, 72], def: 4, vit: 22, agi: 20, dex: 40, exp: [125, 88], adelay: 1500, passive: true, speed: 1.8, aggro: 5, chase: 5, reach: 0.8, w: 1.1, r: 0.4, drops: [['salt', 1, 1, 0.55], ['gel', 1, 1, 0.8], ['tonic', 1, 1, 0.05], ['shiny_gel', 1, 1, 0.01]] },
  tidecrab: { name: 'Blue Crab', ai: 'crab', art: 'crab', el: 'water', tint: '#a8c8ff', lv: 26, hp: 1150, atk: [70, 88], def: 14, vit: 26, agi: 22, dex: 44, exp: [180, 126], adelay: 1300, passive: true, speed: 1.7, aggro: 5.5, reach: 0.9, w: 1.25, r: 0.48, drops: [['shell', 1, 2, 1], ['crableg', 1, 1, 0.3], ['pearl', 1, 1, 0.06], ['coral_shield', 1, 1, 0.0025]] },
  gloomcap: { name: 'Dark Mushroom', ai: 'puffer', art: 'mushling', el: 'shadow', tint: '#a89cff', lv: 34, hp: 1800, atk: [104, 130], def: 12, vit: 36, agi: 30, dex: 56, exp: [450, 315], adelay: 1700, passive: true, speed: 1.25, aggro: 4.5, chase: 7, reach: 0.85, w: 1.15, r: 0.42, mdef: 10, drops: [['gloom', 1, 1, 0.5], ['spore', 1, 2, 0.8], ['potion2', 1, 1, 0.08], ['gloom_hood', 1, 1, 0.0025]] },
  shadeWisp: { name: 'Dark Wisp', ai: 'wisp', art: 'wisp', el: 'shadow', tint: '#b8a0ff', glow: true, lv: 38, hp: 1700, atk: [120, 150], def: 10, vit: 25, agi: 60, dex: 66, exp: [560, 390], adelay: 1250, speed: 2.5, aggro: 6, reach: 0.75, w: 0.85, r: 0.32, fly: true, mdef: 20, drops: [['shade', 1, 1, 0.45], ['glow', 1, 1, 0.8], ['wander', 1, 1, 0.1], ['wisp_lantern', 1, 1, 0.005], ['shade_staff', 1, 1, 0.002]] },
  cinderBeetle: { name: 'Fire Beetle', ai: 'tank', art: 'beetle', el: 'fire', tint: '#ff9a72', lv: 42, hp: 2500, atk: [140, 176], def: 28, vit: 42, agi: 34, dex: 64, exp: [760, 530], adelay: 1500, speed: 1.2, aggro: 4.5, chase: 9, reach: 1.0, w: 1.35, r: 0.52, heavy: true, drops: [['cinder', 1, 1, 0.5], ['stone', 1, 2, 1], ['potion2', 1, 1, 0.1], ['potion3', 1, 1, 0.03], ['cinder_mail', 1, 1, 0.002], ['horn_blade', 1, 1, 0.002]] },
  emberWisp: { name: 'Fire Wisp', ai: 'wisp', art: 'wisp', el: 'fire', tint: '#ff9a5a', glow: true, lv: 45, hp: 2200, atk: [152, 190], def: 12, vit: 30, agi: 70, dex: 74, exp: [880, 615], adelay: 1200, speed: 2.5, aggro: 6, reach: 0.75, w: 0.85, r: 0.32, fly: true, drops: [['ember_dust', 1, 1, 0.5], ['glow', 1, 1, 0.6], ['cinder', 1, 1, 0.15], ['ember_charm', 1, 1, 0.003]] },
  // mini-bosses: one on each new field, big and slow, they stomp like the Fire Giant, call two of
  // their own kind as guards (summon: see SUMMON_CD) and come back after `respawn` seconds. A hard fight for their own level: 2-4 minutes and a bag of potions
  // (a few levels above them is wiser). Their rare materials craft the best gear.
  matron: { name: 'Giant Sprout', ai: 'boss', art: 'sprout', el: 'earth', tint: '#ff9a6a', boss: true, lv: 25, hp: 9000, atk: [80, 108], def: 10, vit: 25, agi: 18, dex: 40, exp: [4200, 2940], adelay: 1700, speed: 1.2, aggro: 5.5, chase: 12, reach: 1.3, w: 2.0, r: 0.75, heavy: true, summon: ['russet', 'russet'], summonText: 'The Giant Sprout shakes its leaves, and Red Sprouts come running!', respawn: 300, drops: [['heartwood', 1, 1, 0.3], ['thorn', 3, 5, 1], ['potion2', 1, 2, 0.5], ['thorn_mantle', 1, 1, 0.03], ['bramble_ring', 1, 1, 0.05], ['sprout_card', 1, 1, 0.01]] },
  tideKing: { name: 'King Crab', ai: 'boss', art: 'crab', el: 'water', tint: '#8ab8ff', boss: true, lv: 32, hp: 11000, atk: [92, 120], def: 18, vit: 32, agi: 22, dex: 48, exp: [8400, 5880], adelay: 1600, speed: 1.3, aggro: 5.5, chase: 12, reach: 1.4, w: 2.3, r: 0.85, heavy: true, summon: ['tidecrab', 'tidecrab'], summonText: 'The King Crab clacks its claws, and Blue Crabs scuttle in!', respawn: 300, drops: [['king_pearl', 1, 1, 0.3], ['pearl', 1, 2, 0.6], ['crableg', 2, 3, 1], ['tidebreaker', 1, 1, 0.02], ['coral_shield', 1, 1, 0.05], ['crab_card', 1, 1, 0.01]] },
  gloomMother: { name: 'Giant Mushroom', ai: 'boss', art: 'mushling', el: 'shadow', tint: '#9a7cff', boss: true, lv: 40, hp: 14000, atk: [122, 158], def: 14, vit: 40, agi: 28, dex: 60, exp: [17000, 11900], adelay: 1700, speed: 1.15, aggro: 5.5, chase: 12, reach: 1.4, w: 2.2, r: 0.8, heavy: true, mdef: 30, summon: ['gloomcap', 'gloomcap'], summonText: 'The Giant Mushroom puffs, and Dark Mushrooms sprout around it!', respawn: 420, drops: [['gloom_heart', 1, 1, 0.3], ['gloom', 2, 4, 1], ['potion3', 1, 2, 0.4], ['gloom_staff', 1, 1, 0.02], ['gloom_hood', 1, 1, 0.05], ['mushroom_card', 1, 1, 0.01]] },
  cinderLord: { name: 'Giant Beetle', ai: 'boss', art: 'beetle', el: 'fire', tint: '#ff7a4a', boss: true, lv: 48, hp: 16000, atk: [125, 162], def: 22, vit: 48, agi: 32, dex: 70, exp: [28000, 19600], adelay: 1600, speed: 1.15, aggro: 5.5, chase: 12, reach: 1.5, w: 2.4, r: 0.9, heavy: true, summon: ['cinderBeetle', 'cinderBeetle'], summonText: 'The Giant Beetle roars, and Fire Beetles answer!', respawn: 480, drops: [['cinder_core', 1, 1, 0.3], ['cinder', 2, 4, 1], ['potion3', 1, 2, 0.5], ['cinder_greaves', 1, 1, 0.03], ['cinder_mail', 1, 1, 0.04], ['beetle_card', 1, 1, 0.01]] },
  // MVP boss of Glodberg: one at a time, back 15 minutes after it falls. Its slayer gets the MVP
  // reward on top of the drops. Stomps the ground around it every few seconds (stomp: x its ATK),
  // and calls 2 Fire Wisps and 3 Fire Beetles (summon: see SUMMON_CD).
  // Made for a Base 50 character in the best gear, alone: about 3 minutes and a bag of potions.
  jarl: { name: 'Fire Giant', ai: 'boss', art: 'jarl', el: 'fire', lv: 60, hp: 24000, atk: [150, 200], def: 20, vit: 40, agi: 30, dex: 70, mdef: 40, exp: [60000, 42000], adelay: 1600, speed: 1.35, aggro: 7, chase: 25, reach: 1.9, w: 3.1, r: 1.15, heavy: true,
    mvp: true, respawn: 900, lair: { x: 32, z: 48 }, mvpExp: 30000, stomp: 1.8,
    summon: ['emberWisp', 'emberWisp', 'cinderBeetle', 'cinderBeetle', 'cinderBeetle'], summonText: 'The Fire Giant roars, and the fire answers!', mvpDrops: [['potion3', 3], ['ember_heart', 1]],
    wake: 'The ground trembles… the Fire Giant has woken in Glodberg!',
    drops: [['potion2', 2, 3, 0.8], ['potion3', 1, 2, 0.5], ['stone', 4, 6, 1], ['jarl_horn', 1, 1, 0.25], ['ember_crown', 1, 1, 0.05], ['jarl_mantle', 1, 1, 0.03], ['jarl_staff', 1, 1, 0.02], ['emberbrand', 1, 1, 0.01], ['jarl_card', 1, 1, 0.01]] },
  // ---------- kobolds (Grjotvangr, Kolgrof) and goblins (Brennholt, Ormholt) ----------
  // Painted in code (painted.js). Unlike the valley's monsters they attack on sight.
  // archer: keeps `range` away and shoots. assassin: quick, darts in (a dash) and strikes twice
  // `double` of the time. Hard Ore and Armor Ore (for Holger's refining) drop from them.
  koboldWarrior: { name: 'Kobold', ai: 'tank', art: 'koboldWarrior', el: 'earth', lv: 28, hp: 1350, atk: [80, 100], def: 15, vit: 28, agi: 22, dex: 44, exp: [290, 200], adelay: 1400, speed: 1.6, aggro: 5, chase: 8, reach: 0.8, w: 0.7, r: 0.32, drops: [['kobold_fur', 1, 1, 0.55], ['iron_ore', 1, 1, 0.25], ['potion2', 1, 1, 0.05], ['armor_ore', 1, 1, 0.012], ['hard_ore', 1, 1, 0.006]] },
  koboldArcher: { name: 'Kobold Archer', ai: 'archer', art: 'koboldArcher', el: 'earth', lv: 30, hp: 1100, atk: [76, 96], def: 8, vit: 20, agi: 30, dex: 62, exp: [320, 225], adelay: 1800, speed: 1.5, aggro: 6.5, chase: 8, range: 5, reach: 0.8, w: 0.7, r: 0.32, drops: [['kobold_fur', 1, 1, 0.5], ['steel_ore', 1, 1, 0.08], ['wander', 1, 1, 0.08], ['hard_ore', 1, 1, 0.01]] },
  koboldAssassin: { name: 'Kobold Assassin', ai: 'assassin', art: 'koboldAssassin', el: 'earth', lv: 33, hp: 1150, atk: [100, 128], def: 6, vit: 18, agi: 58, dex: 62, exp: [400, 280], adelay: 1100, speed: 2.6, aggro: 5.5, chase: 9, reach: 0.75, double: 0.25, w: 0.7, r: 0.3, drops: [['kobold_fur', 1, 2, 0.5], ['steel_ore', 1, 1, 0.1], ['quick', 1, 1, 0.03], ['hard_ore', 1, 1, 0.015], ['armor_ore', 1, 1, 0.01]] },
  goblinWarrior: { name: 'Goblin', ai: 'tank', art: 'goblinWarrior', el: 'wind', lv: 38, hp: 2000, atk: [118, 148], def: 18, vit: 38, agi: 30, dex: 56, exp: [580, 405], adelay: 1400, speed: 1.7, aggro: 5.5, chase: 9, reach: 0.8, w: 0.7, r: 0.32, drops: [['goblin_tooth', 1, 1, 0.55], ['steel_ore', 1, 1, 0.12], ['potion2', 1, 1, 0.08], ['armor_ore', 1, 1, 0.02], ['hard_ore', 1, 1, 0.01]] },
  goblinArcher: { name: 'Goblin Archer', ai: 'archer', art: 'goblinArcher', el: 'wind', lv: 41, hp: 1700, atk: [120, 150], def: 10, vit: 28, agi: 40, dex: 82, exp: [700, 490], adelay: 1800, speed: 1.6, aggro: 7, chase: 9, range: 5.5, reach: 0.8, w: 0.7, r: 0.32, drops: [['goblin_tooth', 1, 1, 0.5], ['potion3', 1, 1, 0.04], ['wander', 1, 1, 0.1], ['hard_ore', 1, 1, 0.02]] },
  goblinAssassin: { name: 'Goblin Assassin', ai: 'assassin', art: 'goblinAssassin', el: 'wind', lv: 44, hp: 1800, atk: [140, 178], def: 8, vit: 26, agi: 75, dex: 82, exp: [850, 595], adelay: 1100, speed: 2.7, aggro: 6, chase: 10, reach: 0.75, double: 0.25, w: 0.7, r: 0.3, drops: [['goblin_tooth', 1, 2, 0.5], ['quick', 1, 1, 0.04], ['potion3', 1, 1, 0.04], ['hard_ore', 1, 1, 0.025], ['armor_ore', 1, 1, 0.02]] },
  // the kings: MVPs like the Fire Giant, a step below it. They stomp, and call four guards
  // (summon: see SUMMON_CD).
  koboldKing: { name: 'Kobold King', ai: 'boss', art: 'koboldKing', el: 'earth', lv: 50, hp: 18000, atk: [120, 160], def: 22, vit: 45, agi: 30, dex: 70, mdef: 25, exp: [36000, 25200], adelay: 1500, speed: 1.4, aggro: 7, chase: 25, reach: 1.4, w: 1.3, r: 0.6, heavy: true,
    mvp: true, respawn: 1200, lair: { x: 32, z: 46 }, mvpExp: 18000, stomp: 1.6, summon: ['koboldWarrior', 'koboldWarrior', 'koboldArcher', 'koboldAssassin'], mvpDrops: [['potion3', 3], ['hard_ore', 2]],
    wake: 'War drums in the quarry… the Kobold King holds court in Kolgrof!',
    drops: [['potion3', 1, 2, 0.5], ['kobold_fur', 4, 6, 1], ['hard_ore', 1, 2, 0.4], ['armor_ore', 1, 2, 0.4], ['kobold_ring', 1, 1, 0.05], ['kobold_card', 1, 1, 0.01]] },
  goblinKing: { name: 'Goblin King', ai: 'boss', art: 'goblinKing', el: 'wind', lv: 55, hp: 21000, atk: [138, 180], def: 22, vit: 48, agi: 34, dex: 74, mdef: 30, exp: [48000, 33600], adelay: 1500, speed: 1.45, aggro: 7, chase: 25, reach: 1.4, w: 1.3, r: 0.6, heavy: true,
    mvp: true, respawn: 1800, lair: { x: 32, z: 16 }, mvpExp: 24000, stomp: 1.7, summon: ['goblinWarrior', 'goblinWarrior', 'goblinArcher', 'goblinAssassin'], mvpDrops: [['potion3', 3], ['hard_ore', 3]],
    wake: 'Horns in the dark wood… the Goblin King rides out in Ormholt!',
    drops: [['potion3', 1, 2, 0.6], ['goblin_tooth', 4, 6, 1], ['hard_ore', 1, 3, 0.45], ['armor_ore', 1, 3, 0.45], ['goblin_charm', 1, 1, 0.05], ['goblin_card', 1, 1, 0.01]] },
};

const RESPAWN = 60;
// A boss (MVP or mini-boss) first calls its guards when it falls below 60% HP. It calls again only
// once every guard is gone, and not until 2 minutes after the last one fell, while it still fights.
const SUMMON_AT = 0.6, SUMMON_CD = 120;
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
    this.guardsGoneT = -1e9; // when (its own clock, this.t) its last guard fell
    this.sprite.visible = this.shadow.visible = true;
    const upp = d.w / this.art.body[0]; // def.w is the body width
    this.sprite.scale.set(this.art.fw * upp, this.art.fh * upp, 1);
    this.mat.rotation = 0;
  }

  tryMove(dx, dz) {
    const w = this.mgr.world;
    const nx = this.x + dx, nz = this.z + dz;
    const [rx, rz] = w.resolve(nx, nz, this.def.r);
    if (!w.isSafe(rx, rz) && w.walkable(rx, rz)) { this.x = rx; this.z = rz; return true; }
    return false;
  }

  moveToward(tx, tz, speed, dt) {
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const s = Math.min(d, speed * dt);
    this.heading = { x: dx / d, z: dz / d };
    const ok = this.tryMove((dx / d) * s, (dz / d) * s);
    return ok ? s : 0;
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

  hit(dmg, fx, fz) {
    if (!this.alive) return;
    this.hp -= dmg;
    this.flash = 0.09;
    const k = this.def.mvp ? 0 : this.def.heavy ? 0.8 : 1.6; // a small nudge: Ragnarok monsters barely move when hit
    this.knock.x = fx * k;
    this.knock.z = fz * k;
    if (this.def.ai === 'skittish') this.angry = this.def.angry;
    else if (this.def.passive || this.def.ai === 'archer') this.angry = Math.max(this.angry, 30); // hit a passive monster and it fights back for a while
    if (this.def.boss) this.knock.x = this.knock.z = 0; // bosses stand their ground
    // a boss first calls its guards when it falls below 60% HP (later calls: see update)
    if (this.def.summon && !this.calls && this.hp > 0 && this.hp / this.def.hp < SUMMON_AT) { this.calls++; this.mgr.summon(this); }
    if (['hopper', 'tank', 'puffer', 'boss', 'assassin'].includes(this.def.ai)) {
      this.state = 'chase';
      this.chaseT = Math.max(this.chaseT, this.def.chase || 4);
      this.tired = 0;
    }
    if (this.hp <= 0) this.mgr.kill(this);
  }

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

    if (Math.abs(this.knock.x) + Math.abs(this.knock.z) > 0.05) {
      this.tryMove(this.knock.x * dt, this.knock.z * dt);
      const k = Math.exp(-9 * dt);
      this.knock.x *= k;
      this.knock.z *= k;
    }

    // a boss calls again once all its guards are gone and the cooldown has passed, while it fights
    if (d.summon && this.calls && this.state === 'chase' && this.t - this.guardsGoneT >= SUMMON_CD && !this.mgr.guardsOf(this).length) {
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

    const x0 = this.x, z0 = this.z; // after knockback, so being pushed doesn't move the legs
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    const low = this.hp / d.hp <= 0.3 && d.hp > 1;
    const speed = d.speed * (low ? 0.6 : 1);
    // Play Dead and safe ground (camp) make monsters lose interest
    const available = p.state !== 'down' && p.state !== 'feign' && !this.mgr.world.isSafe(p.x, p.z);
    const aggro = this.provokeT > 0 ? 14 : d.aggro;
    const hostile = !d.passive || this.angry > 0 || this.provokeT > 0; // a passive monster only fights back
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
          const res = mobAttack(d, p.ps);
          if (res.miss) this.mgr.emit('miss', this, res);
          else p.takeDamage(res.dmg, this.x, this.z);
          if (d.double && Math.random() < d.double && p.canBeHit()) { // an assassin's second, quicker cut
            const again = mobAttack(d, p.ps);
            if (!again.miss) { p.takeDamage(again.dmg, this.x, this.z); this.mgr.emit('double', this); }
          }
          this.mgr.emit('attack', this);
          this.atkAnim = ATTACK_ANIM;
          if (dist > 0.01) this.heading = { x: dx / dist, z: dz / dist };
        }
        this.atkCd = d.adelay / 1000;
      }
    };

    if (homeD > (this.provokeT > 0 || d.mvp ? 20 : 11) && this.state !== 'return') this.state = 'return';
    if (this.stunT > 0) this.stunT -= dt; // stunned: stands there
    else if (this.state === 'return') {
      moving = this.moveToward(this.home.x, this.home.z, speed, dt) > 0;
      if (homeD < 2 || !moving) { this.state = 'wander'; this.tired = 2; }
    } else switch (d.ai) {
      case 'hopper':
      case 'tank':
      case 'boss': {
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
              if (d.ai === 'boss' && dist < 3.2 && this.specialCd <= 0) {
                this.special = 0.8;
                this.specialCd = 7;
                this.atkAnim = ATTACK_ANIM * 1.6;
                this.mgr.emit('windup', this);
              }
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
            moving = this.tryMove(this.heading.x * 7 * dt, this.heading.z * 7 * dt);
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
    let lift = 0;
    if (d.ai === 'hopper' && moving && this.hop % 1 < 0.55) lift = Math.sin(((this.hop % 1) / 0.55) * Math.PI) * 0.28 * d.w;
    else if (d.fly) lift = 0.7 + Math.sin(this.t * 4) * 0.15;
    const tex = this.frame(moving);
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }
    this.mat.rotation = low ? Math.sin(this.t * 15) * 0.13 : 0;

    const y = this.mgr.world.heightAt(this.x, this.z);
    this.sprite.position.set(this.x, y + lift, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
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
    this.mvp = null;  // { type, x, z } on a map with an MVP
    this.mvpAt = {};  // per MVP: when it may next appear (ms since 1970)
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

  // a free spot for a monster's home, away from the portals you arrive by
  findSpot(rng) {
    for (let i = 0; i < 400; i++) {
      const x = 4 + rng() * 56, z = 4 + rng() * 56;
      if (this.world.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 9)) continue;
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
    for (const m of [...this.list]) this.remove(m);
    this.dead = [];
    this.mvp = null;
    const rng = mulberry32(seed);
    for (const [type, count, nightOnly] of spawns) {
      for (let i = 0; i < count; i++) {
        const s = this.findSpot(rng);
        if (!s) continue;
        // the MVP waits out its respawn time even across map changes and restarts
        if (MOB_DEFS[type].mvp) { this.mvp = { type, ...(MOB_DEFS[type].lair || s) }; continue; }
        const m = this.add(type, s.x, s.z);
        m.nightOnly = !!nightOnly;
        if (nightOnly && !this.night) { m.alive = false; m.sprite.visible = m.shadow.visible = false; this.dead.push({ m, t: 0 }); }
      }
    }
  }

  guardsOf(boss) { return this.list.filter((o) => o.leader === boss && o.alive); }

  // a king's guards: they come running, and don't come back once beaten
  summon(boss) {
    boss.mgr.emit('summon', boss);
    const list = boss.def.summon, a0 = Math.random() * Math.PI * 2, r = 1.2 + boss.def.r;
    list.forEach((type, i) => {
      const a = a0 + (i / list.length) * Math.PI * 2;
      const c = this.add(type, boss.x + Math.cos(a) * r, boss.z + Math.sin(a) * r);
      if (!this.world.walkable(c.x, c.z)) { c.x = boss.x; c.z = boss.z; }
      c.temp = true;
      c.leader = boss; // it follows the boss and fights alongside it (see update)
      c.home = { x: boss.x, z: boss.z };
      c.state = 'chase';
      c.chaseT = 15;
      c.angry = 30;
    });
  }

  add(type, x, z) {
    const m = new Mob(this, type, x, z);
    this.list.push(m);
    return m;
  }

  remove(m) {
    this.list = this.list.filter((o) => o !== m);
    this.scene.remove(m.sprite, m.shadow);
    m.mat.dispose();
    this.tint = this.tint.filter((t) => t !== m.mat);
  }

  kill(m) {
    m.alive = false;
    m.sprite.visible = m.shadow.visible = false;
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
    if (m.def.mvp) { // gone until its respawn time comes round (the game saves mvpAt)
      this.mvpAt[m.type] = Date.now() + m.def.respawn * 1000;
      this.emit('mvp', m);
      this.remove(m);
      return;
    }
    this.dead.push({ m, t: m.def.respawn || RESPAWN });
  }

  update(dt, player) {
    // the MVP appears once its time has come
    if (this.mvp && Date.now() >= (this.mvpAt[this.mvp.type] || 0) && !this.list.some((m) => m.def.mvp)) {
      this.add(this.mvp.type, this.mvp.x, this.mvp.z);
      this.emit('mvpSpawn', this.mvp);
    }
    for (const m of this.list) if (m.alive) m.update(dt, player);
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
