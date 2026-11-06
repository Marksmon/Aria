// The monsters of every map (moved out of main.js): a new map only needs its entry here (CLAUDE.md map defaults).
// monsters per map: [type, count, nightOnly]. Wisps drift about by day too; night brings more of them and ~20% more of the rest
export const SPAWNS = {
  camp: [],
  grove: [['slime', 12], ['sprout', 9], ['wisp', 2, true], ['slime', 3, true], ['sprout', 2, true]], // the first field: Wisps only at night
  fen: [['blueSlime', 9], ['crab', 7], ['wisp', 4, true], ['blueSlime', 2, true], ['crab', 1, true]], // (Wisps only at night here too: a Trainee's field)
  hollow: [['mushling', 12], ['wisp', 3], ['wisp', 3, true], ['mushling', 2, true]],
  ridge: [['beetle', 10], ['jarl', 1], ['wisp', 3], ['wisp', 3, true], ['beetle', 2, true]],
  city: [],
  birch: [['russet', 10], ['sprout', 5], ['slime', 4], ['matron', 1], ['wisp', 2], ['wisp', 3, true], ['russet', 2, true]],
  magic: [],
  coast: [['brine', 9], ['tidecrab', 8], ['crab', 3], ['tideKing', 1], ['wisp', 2], ['wisp', 3, true], ['brine', 2, true]],
  deep: [['gloomcap', 10], ['mushling', 4], ['shadeWisp', 6], ['gloomMother', 1], ['gloomcap', 2, true]],
  heath: [['cinderBeetle', 9], ['emberWisp', 6], ['beetle', 3], ['cinderLord', 1], ['cinderBeetle', 2, true]],
  // the kobold and goblin lands: they attack on sight; each race's king holds the second map
  stones: [['koboldWarrior', 10], ['koboldArcher', 6], ['koboldAssassin', 2], ['koboldWarrior', 2, true]],
  coalpit: [['koboldAssassin', 7], ['koboldWarrior', 5], ['koboldArcher', 5], ['koboldKing', 1], ['koboldAssassin', 2, true]],
  burnt: [['goblinWarrior', 10], ['goblinArcher', 6], ['goblinAssassin', 2], ['goblinWarrior', 2, true]],
  bloop: [], koboldcamp: [], goblinlair: [], // the raids spawn their own (tickRaid)
  serpent: [['goblinAssassin', 7], ['goblinWarrior', 5], ['goblinArcher', 5], ['goblinKing', 1], ['goblinAssassin', 2, true]],
  // Veidheim's lands: the gentle willows and treants round the village (and Yellow Bloops in the marsh),
  // the predators far off past Black Wood and Ash Heath, more of them at night
  hunt: [],
  marsh: [['willow', 9], ['yellowSlime', 8], ['elderWillow', 1], ['willow', 2, true], ['wisp', 3, true]],
  oldwood: [['treant', 9], ['willow', 4], ['ancientTreant', 1], ['treant', 2, true], ['wisp', 2, true]], // (the Ancient Treant, the oldest of them, roams its own forest)
  farm: [['snake', 10], ['wolf', 6], ['alphaWolf', 1], ['snake', 2, true], ['wolf', 3, true]],
  wolfhill: [['wolf', 10], ['bear', 5], ['snake', 2], ['greatBear', 1], ['wolf', 3, true]],
  // Rytingborg's desert: Red Sands (a Trainee's field, the Assassin's trial), then the cacti and dune
  // worms, the scorpions and runners round the Pyramid, and the Great Desert where all of them roam
  // over the Sand Wyrm. Sphinx Sands keeps no monsters; the tomb (raid) spawns its own
  sand: [], sphinx: [], tomb: [],
  // the Sphinx's Halls (dungeon.js): three maze floors, harder floor by floor, then the great hall (no night here: underground)
  // Yggdrasil keeps no monsters; its hollows (dungeon.js) are three maze floors of living wood, then the
  // great hall, Base 45-75 (the owner's call: the Sphinx's Halls are 65-99, for the late climb)
  ygg: [],
  ygg1: [['rootSquirrel', 16], ['bramble', 13]],                             // Base 45-52
  ygg2: [['rootSerpent', 10], ['mossGolem', 9], ['darkElf', 9]],             // 53-60
  ygg3: [['greatStag', 10], ['dryad', 9], ['rotBeetle', 8], ['ratatoskr', 1]], // 61-68, Ratatoskr the mini-boss (74)
  ygg4: [['rootWarden', 8], ['thornDrake', 7], ['nidhogg', 1]],             // 69-75: the great hall, its guards and Nidhogg (99)
  halls1: [['hallScarab', 16], ['cobra', 13]],                               // Base 65-72
  halls2: [['hallMummy', 10], ['lamia', 9], ['servant', 9]],                 // 73-80
  halls3: [['sphinxCub', 10], ['sandElemental', 9], ['sarcophagus', 8], ['ammit', 1]], // 81-88, Ammit the mini-boss (74)
  halls4: [['jackal', 8], ['falcon', 7], ['eternalSphinx', 1]],             // 89-99: the great hall, the Guardians and the Eternal Sphinx
  redsands: [['redSlime', 12], ['giantAnt', 8], ['redSlime', 3, true], ['giantAnt', 2, true]],
  dunes: [['cactus', 9], ['duneWorm', 7], ['cactusLord', 1], ['duneWorm', 2, true], ['cactus', 2, true]],
  scorpion: [['scorpion', 9], ['runner', 6], ['rainbowRunner', 1], ['scorpion', 3, true], ['runner', 1, true]],
  desert: [['soldierAnt', 7], ['cactus', 3], ['duneWorm', 4], ['scorpion', 4], ['runner', 3], ['sandWyrm', 1], ['soldierAnt', 2, true], ['scorpion', 2, true]],
};
