// Raids: a timed run in an arena of its own. Three waves of monsters that attack on sight and never
// give up (mobs.js raidDef: relentless), then a boss, all inside the time limit. A difficulty sets
// the monsters' level and strength and the size of the reward. One cooldown is shared by every
// difficulty and starts when you go in. The story's raid step gets a Tutorial run of its own: open
// only while the story waits on it, it never starts the cooldown, and win or lose it pays the clear
// reward and moves the story on.
// EXP is held while you fight and paid when the run ends: all of it x1.5 on a clear, the kills alone
// on a failure. The game runs the raid (main.js tickRaid); this file is its data.
//
// Strength (hp, atk on raidDef; exp, if given, sets the EXP apart from the HP) was tuned with a
// whole-run simulation (every monster of a wave at once, natural regen, the breathers and the full
// heal): a hero at the advised level wins Easy without potions and Normal with 20 Orange Potions as
// a first job, Hard with 30 White and Hell with 50 White as a second job (2.5-3x a first job's
// damage, area skills on the swarms). A first job can't clear Hard or Hell.
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
      easy: { name: 'Easy', lv: 30, mult: 1, wave: { hp: 0.2, atk: 0.1 }, boss: { hp: 0.3, atk: 0.2 }, rare: 0.05, advice: 'no potions needed' },
      normal: { name: 'Normal', lv: 40, mult: 3, wave: { hp: 0.38, atk: 0.22 }, boss: { hp: 0.6, atk: 0.45 }, rare: 0.1, advice: 'bring 20 Orange Potions' },
      // Hard and Hell are made for a second job (BladeMaster, Wizard, Magic Knight): by Base 50 most
      // heroes have one, and it hits 2-4x harder, with area skills for the swarms
      hard: { name: 'Hard', lv: 50, mult: 6, wave: { hp: 1.2, atk: 0.38, exp: 0.42 }, boss: { hp: 1.75, atk: 0.78, exp: 0.65 }, rare: 0.15, advice: 'a second job and 30 White Potions' },
      hell: { name: 'Hell', lv: 60, mult: 9, wave: { hp: 1.65, atk: 0.46, exp: 0.47 }, boss: { hp: 2.4, atk: 0.92, exp: 0.72 }, rare: 0.2, advice: 'a second job and 50 White Potions' },
    },
    // the clear reward at x1 (times the difficulty's mult): perz and [item, count, chance]
    reward: { perz: 3000, items: [['gel', 6, 1], ['dew', 4, 1], ['bloop_core', 2, 1], ['shiny_gel', 1, 0.3]] },
    // the rare roll: one of these, at the difficulty's chance
    rares: ['veteran_boots', 'bloop_buckler', 'bleep_ring', 'gooey_ring', 'tide_pendant'],
  },
};

// what a clear pays: { perz, items: { id: n }, rare: id | null }
export function rollReward(raid, diff) {
  const R = RAIDS[raid], d = R.difficulties[diff], items = {};
  for (const [id, n, chance] of R.reward.items) {
    if (Math.random() < chance) items[id] = (items[id] || 0) + n * d.mult;
  }
  const rare = Math.random() < d.rare ? R.rares[Math.floor(Math.random() * R.rares.length)] : null;
  return { perz: R.reward.perz * d.mult, items, rare };
}

// "2 h 14 m" / "9 m" / "under a minute"
export function waitText(ms) {
  const m = Math.ceil(ms / 60000);
  if (m <= 1) return 'under a minute';
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} m` : `${m} m`;
}
