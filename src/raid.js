// Raids: a timed run in an arena of its own. Three waves of monsters that attack on sight and never
// give up (mobs.js raidDef: relentless), then a boss, all inside the time limit. A difficulty sets
// the monsters' level and strength and the size of the reward. Each raid has its own cooldown, shared
// by its difficulties, from going in, but only a clear starts it: a failed run (left, fainted, out of
// time, or the game closed mid-run) costs no cooldown and pays nothing. Bloop Island's story step gets
// a Tutorial run of its own: open only while the story waits on it, it never starts the cooldown, and
// only a clear of it pays the clear reward and moves the story on.
// EXP is held while you fight and paid on a clear, x1.5. Every run
// goes in the hero's raid history (main.js raidLog). The game runs the raid (main.js tickRaid); this
// file is its data.
//
// A difficulty needs its Base Level (lv; the Tutorial excepted): Bloop Island 40/55/70/85, the
// Kobold Camp 45/60/75/90, the Goblin Lair 50/65/80/95, Pharaoh's Tomb 55/70/85/99 (plus: the Hell one is shown as 95+).
// Strength (hp, atk on raidDef; exp, if given, sets the EXP apart from the HP) was tuned with a
// whole-run simulation (build-tools/raid-sim.mjs: every monster of a wave at once, natural regen,
// the breathers and the full heal): Easy for a first job without potions, Normal for a second job
// with 20 White Potions, Hard with 30. Hell's boss is fierce (mobs.js FIERCE): as hard and tricky as
// a field MVP, with moves of its own, for a hero in the best gear (docs/balance.md).
//
// The reward: perz and materials times the difficulty's mult (x1/x3/x6/x9), the raid's own cores
// times its cores (x1/x3/x9/x27), and on any difficulty a 3% chance at one of the raid's rare finds
// and 1% at its ultra rare (a Head, Face or Wings piece) and at its boss's card. Its guide also makes
// the rares and the ultra rare from cores (items.js RECIPES, by: the raid).
const LADDER = [
  ['easy', 'Easy', 1, 1, { hp: 0.3, atk: 0.14 }, { hp: 0.45, atk: 0.28 }, 'a first job, no potions needed'],
  ['normal', 'Normal', 3, 3, { hp: 1.15, atk: 0.36, exp: 0.4 }, { hp: 1.75, atk: 0.72, exp: 0.6 }, 'a second job and 20 White Potions'],
  ['hard', 'Hard', 6, 9, { hp: 1.45, atk: 0.41, exp: 0.42 }, { hp: 2.25, atk: 0.82, exp: 0.65 }, 'a strong second job and 30 White Potions'],
  // Hell: the boss as hard and tricky as an MVP (fierce)
  ['hell', 'Hell', 9, 27, { hp: 3, atk: 0.8, exp: 0.6 }, { hp: 7, atk: 1.2, exp: 0.75, fierce: true }, 'the best gear, upgraded and carded, and a big bag of White Potions'],
];
const RARE = 0.03; // a clear's chance at a rare find, every difficulty (its ultra rare and its card: 1% each)
const ladder = (lvs) => Object.fromEntries(LADDER.map(([k, name, mult, cores, wave, boss, advice], i) =>
  [k, { name, lv: lvs[i], ...(k === 'hell' ? { plus: true } : {}), mult, cores, wave, boss, rare: RARE, advice }]));
const COMMON = {
  secs: 600,                 // 10 minutes for the three waves and the boss
  cooldown: 3 * 3600 * 1000, // shared by the raid's difficulties
  breather: 0.5,             // after each wave the hero gets back half their HP and SP
  bossHeal: true,            // and before the boss, all of it
  rest: 3,                   // seconds between a wave's fall and the next
};
export const RAIDS = {
  bloop: {
    name: 'Bloop Island', map: 'bloop', from: 'coast', npc: 'boatman', ...COMMON,
    landing: { x: 32, z: 42 }, // the south beach
    // waves: [type, count, level offset from the advised level]
    waves: [
      [['slime', 6, -4], ['blueSlime', 3, -2]],
      [['blueSlime', 5, -2], ['yellowSlime', 4, 0]],
      [['yellowSlime', 4, 0], ['redSlime', 4, 2]],
    ],
    boss: ['bleepBloop', 5],
    difficulties: {
      tutorial: { name: 'Tutorial', lv: 28, mult: 1, cores: 1, wave: { hp: 0.15, atk: 0.08 }, boss: { hp: 0.25, atk: 0.15 }, rare: RARE, tutorial: true, advice: 'the story run: no wait; clear it to move the story on' },
      ...ladder([40, 55, 70, 85]),
    },
    // the clear reward at x1: perz and [item, count, chance] (times the difficulty's mult), and the
    // raid's cores (times its cores)
    reward: { perz: 3000, items: [['gel', 6, 1], ['dew', 4, 1], ['shiny_gel', 1, 0.3]], cores: ['bloop_core', 3] },
    // the rare roll: one of these, at the difficulty's chance (the Boatman makes them from Bloop Cores too)
    rares: ['veteran_boots', 'bloop_buckler', 'bleep_ring', 'gooey_ring', 'tide_pendant', 'bubble_robe', 'seaglass_charm', 'hopper_boots'],
    ultra: ['angel_wings', 0.01], // the raid's ultra rare
    // the boss's card: raid monsters drop nothing, so a clear may pay it (a boss card's 1%, any difficulty)
    card: ['bleep_card', 0.01],
    // what is said along the way
    words: {
      pitch: 'Three waves of bloops, then BleepBloop himself, all in 10 minutes before the tide turns.',
      wait: 'The tide is wrong', arrive: 'three waves of bloops, then their boss', time: 'before the tide turns',
      wave: 'The bloops come bouncing in from the shore.', boss: 'rises out of the surf: the old bloop general, beard, plume and all!',
      timeUp: 'The tide turns! The Boatman rows you back before the raid is done.', leave: 'You leave the island, and the Boatman rows you back to Salt Bay.',
      cooldown: 'After a cleared crossing the tide keeps me ashore 3 hours.',
    },
  },
  kobold: {
    name: 'Kobold Camp', map: 'koboldcamp', from: 'coalpit', npc: 'brokk', ...COMMON,
    landing: { x: 32, z: 42 },
    waves: [
      [['koboldWarrior', 5, -4], ['koboldArcher', 3, -2]],
      [['koboldWarrior', 4, -2], ['koboldArcher', 3, 0], ['koboldAssassin', 2, 0]],
      [['koboldAssassin', 4, 0], ['koboldWarrior', 4, 2]],
    ],
    boss: ['koboldWarlord', 5],
    difficulties: ladder([45, 60, 75, 90]),
    reward: { perz: 4500, items: [['kobold_fur', 6, 1], ['iron_ore', 4, 1], ['steel_ore', 1, 0.5]], cores: ['kobold_core', 3] },
    rares: ['quarry_shield', 'stonehide_mantle', 'earthshaker_boots', 'oreheart_ring', 'pickaxe_charm', 'miners_plate', 'lamp_charm', 'lucky_nugget'],
    ultra: ['goat_horns', 0.01],
    card: ['kwarlord_card', 0.01],
    words: {
      pitch: 'Three waves of kobolds in their walled camp, then their Warlord, all in 10 minutes before the war drums call the rest of the tribe.',
      wait: 'The camp is on watch', arrive: 'three waves of kobolds, then their Warlord', time: 'before the war drums call the tribe',
      wave: 'Kobolds pour out of the tents!', boss: 'stomps out of his war tent, war-paint and shield wall!',
      timeUp: 'War drums all round! Brokk pulls you out before the whole tribe comes.', leave: 'You slip out of the camp, and Brokk leads you back to Coal Pit.',
      cooldown: 'After a cleared raid the camp stays on watch 3 hours.',
    },
  },
  goblin: {
    name: 'Goblin Lair', map: 'goblinlair', from: 'serpent', npc: 'ylva', ...COMMON,
    landing: { x: 32, z: 42 },
    waves: [
      [['goblinWarrior', 5, -4], ['goblinArcher', 3, -2]],
      [['goblinWarrior', 4, -2], ['goblinArcher', 3, 0], ['goblinAssassin', 2, 0]],
      [['goblinAssassin', 4, 0], ['goblinWarrior', 4, 2]],
    ],
    boss: ['goblinWarlord', 5],
    difficulties: ladder([50, 65, 80, 95]),
    reward: { perz: 6000, items: [['goblin_tooth', 6, 1], ['steel_ore', 2, 1], ['armor_ore', 1, 0.3]], cores: ['goblin_core', 3] },
    rares: ['raider_cloak', 'windstep_boots', 'spiked_buckler', 'totem_charm', 'wardrum_pendant', 'horde_leather', 'shaman_robe', 'fang_charm'],
    ultra: ['elf_ears', 0.01],
    card: ['gwarlord_card', 0.01],
    words: {
      pitch: 'Three waves of goblins in their lair under the dark trees, then their Warlord, all in 10 minutes before the torches gutter out.',
      wait: 'The lair is stirred up', arrive: 'three waves of goblins, then their Warlord', time: 'before the torches gutter out',
      wave: 'Goblins creep out of the dark!', boss: 'drops down from his totem, axe in hand!',
      timeUp: 'The torches gutter out! Ylva drags you out of the dark before the horde closes in.', leave: 'You slip out of the lair, and Ylva leads you back to Serpent Wood.',
      cooldown: 'After a cleared raid the lair stays stirred up 3 hours.',
    },
  },
  // the fourth raid: the Pharaoh's burial hall under the Pyramid in Scorpion Sands
  tomb: {
    name: "Pharaoh's Tomb", map: 'tomb', from: 'scorpion', npc: 'sindri', ...COMMON,
    landing: { x: 32, z: 42 },
    waves: [
      [['scarab', 6, -4], ['mummy', 2, -2]],
      [['mummy', 4, -2], ['scarab', 3, 0], ['tombScorpion', 2, 0]],
      [['tombScorpion', 4, 0], ['mummy', 4, 2]],
    ],
    boss: ['pharaoh', 5],
    difficulties: ladder([55, 70, 85, 99]),
    reward: { perz: 7500, items: [['red_gel', 6, 1], ['scorpion_tail', 2, 1], ['hard_ore', 1, 0.3]], cores: ['tomb_core', 3] },
    rares: ['khopesh', 'tomb_mail', 'scarab_kris', 'falcon_charm', 'ankh_charm', 'gold_scarab', 'canopic_shield', 'linen_wrap'],
    ultra: ['pharaoh_nemes', 0.01],
    card: ['pharaoh_card', 0.01],
    words: {
      pitch: 'Three waves of the Pharaoh\'s dead servants in his burial hall, then the Pharaoh himself, all in 10 minutes before the torches burn out.',
      wait: 'The tomb is sealed', arrive: 'three waves of the dead, then the Pharaoh', time: 'before the torches burn out',
      wave: 'The dead rise from their niches!', boss: 'rises from his sarcophagus, crook and flail in hand!',
      timeUp: 'The torches burn out! Sindri pulls you out of the dark before the doors close.', leave: 'You climb out of the tomb, and Sindri leads you back into the sun.',
      cooldown: 'After a cleared raid the tomb stays sealed 3 hours.',
    },
  },
};

// what a clear pays: { perz, items: { id: n }, rare: id | null, ultra: id | null, card: id | null }
export function rollReward(raid, diff) {
  const R = RAIDS[raid], d = R.difficulties[diff], items = {};
  for (const [id, n, chance] of R.reward.items) {
    if (Math.random() < chance) items[id] = (items[id] || 0) + n * d.mult;
  }
  if (R.reward.cores) { const [core, n] = R.reward.cores; items[core] = (items[core] || 0) + n * (d.cores || 1); }
  const rare = Math.random() < d.rare ? R.rares[Math.floor(Math.random() * R.rares.length)] : null;
  const ultra = R.ultra && Math.random() < R.ultra[1] ? R.ultra[0] : null;
  const card = R.card && Math.random() < R.card[1] ? R.card[0] : null;
  return { perz: R.reward.perz * d.mult, items, rare, ultra, card };
}

// "2 h 14 m" / "9 m" / "under a minute"
export function waitText(ms) {
  const m = Math.ceil(ms / 60000);
  if (m <= 1) return 'under a minute';
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`;
}
