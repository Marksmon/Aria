// Raids: a timed run in an arena of its own. Three waves of monsters that attack on sight and never
// give up (mobs.js raidDef: relentless), then a boss, all inside the time limit. A difficulty sets
// the monsters' level and strength and the size of the reward. One cooldown is shared by every
// difficulty and starts when you go in. The story's raid step gets a Tutorial run of its own: open
// only while the story waits on it, it never starts the cooldown, and win or lose it pays the clear
// reward and moves the story on.
// EXP is held while you fight and paid when the run ends: all of it x1.5 on a clear, the kills alone
// on a failure. The game runs the raid (main.js tickRaid); this file is its data.
//
// A difficulty needs its Base Level (lv; the Tutorial excepted): Easy 60, Normal 75, Hard 90, Hell
// 99. Strength (hp, atk on raidDef; exp, if given, sets the EXP apart from the HP) was tuned with a
// whole-run simulation (build-tools/raid-sim.mjs: every monster of a wave at once, natural regen,
// the breathers and the full heal) for a second job at that level: Easy without potions, Normal with
// 20 White Potions, Hard with 30. Hell's boss is fierce (mobs.js FIERCE): as hard and tricky as a
// field MVP, with moves of its own, so Hell is for a Lv 99 hero in the best gear, and was tested
// in the browser like the MVPs (docs/balance.md).
export const RAIDS = {
  bloop: {
    name: 'Bloop Island', map: 'bloop', from: 'coast', npc: 'boatman',
    landing: { x: 32, z: 42 }, // the south beach
    secs: 600,                 // 10 minutes for the three waves and the boss
    cooldown: 3 * 3600 * 1000, // shared by every difficulty
    breather: 0.5,             // after each wave the hero gets back half their HP and SP
    bossHeal: true,            // and before the boss, all of it
    rest: 3,                   // seconds between a wave's fall and the next
    // waves: [type, count, level offset from the advised level]
    waves: [
      [['slime', 6, -4], ['blueSlime', 3, -2]],
      [['blueSlime', 5, -2], ['yellowSlime', 4, 0]],
      [['yellowSlime', 4, 0], ['redSlime', 4, 2]],
    ],
    boss: ['bleepBloop', 5],
    difficulties: {
      tutorial: { name: 'Tutorial', lv: 28, mult: 1, wave: { hp: 0.15, atk: 0.08 }, boss: { hp: 0.25, atk: 0.15 }, rare: 0.05, tutorial: true, advice: 'the story run: no wait, and the reward win or lose' },
      easy: { name: 'Easy', lv: 60, mult: 1, wave: { hp: 1.0, atk: 0.3, exp: 0.4 }, boss: { hp: 1.5, atk: 0.6, exp: 0.6 }, rare: 0.05, advice: 'a second job, no potions needed' },
      normal: { name: 'Normal', lv: 75, mult: 3, wave: { hp: 1.3, atk: 0.34, exp: 0.42 }, boss: { hp: 2.0, atk: 0.7, exp: 0.65 }, rare: 0.1, advice: 'a second job and 20 White Potions' },
      hard: { name: 'Hard', lv: 90, mult: 6, wave: { hp: 1.5, atk: 0.36, exp: 0.45 }, boss: { hp: 2.3, atk: 0.75, exp: 0.7 }, rare: 0.15, advice: 'a strong second job and 30 White Potions' },
      // Hell: the boss as hard and tricky as an MVP (fierce), about 600,000 HP
      hell: { name: 'Hell', lv: 99, mult: 9, wave: { hp: 3, atk: 0.8, exp: 0.6 }, boss: { hp: 17, atk: 1.5, exp: 0.75, fierce: true }, rare: 0.2, advice: 'the best gear, upgraded and carded, and a big bag of White Potions' },
    },
    // the clear reward at x1 (times the difficulty's mult): perz and [item, count, chance]
    reward: { perz: 3000, items: [['gel', 6, 1], ['dew', 4, 1], ['bloop_core', 2, 1], ['shiny_gel', 1, 0.3]] },
    // the rare roll: one of these, at the difficulty's chance
    rares: ['veteran_boots', 'bloop_buckler', 'bleep_ring', 'gooey_ring', 'tide_pendant', 'angel_wings'],
    // the boss's card: raid monsters drop nothing, so a clear may pay it (a boss card's 1%, any difficulty)
    card: ['bleep_card', 0.01],
  },
};

// what a clear pays: { perz, items: { id: n }, rare: id | null, card: id | null }
export function rollReward(raid, diff) {
  const R = RAIDS[raid], d = R.difficulties[diff], items = {};
  for (const [id, n, chance] of R.reward.items) {
    if (Math.random() < chance) items[id] = (items[id] || 0) + n * d.mult;
  }
  const rare = Math.random() < d.rare ? R.rares[Math.floor(Math.random() * R.rares.length)] : null;
  const card = R.card && Math.random() < R.card[1] ? R.card[0] : null;
  return { perz: R.reward.perz * d.mult, items, rare, card };
}

// "2 h 14 m" / "9 m" / "under a minute"
export function waitText(ms) {
  const m = Math.ceil(ms / 60000);
  if (m <= 1) return 'under a minute';
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`;
}
