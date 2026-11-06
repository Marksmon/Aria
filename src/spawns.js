// The monsters of every map (moved out of main.js): a new map only needs its entry here (CLAUDE.md map defaults).
// monsters per map: [type, count, nightOnly]. Wisps drift about by day too; night brings more of them and ~20% more of the rest
// (November 2026: every field map 10 more by day than before, so a map never looks empty: the owner's call)
export const SPAWNS = {
  camp: [],
  grove: [['slime', 17], ['sprout', 14], ['wisp', 2, true], ['slime', 3, true], ['sprout', 2, true]], // the first field: Wisps only at night
  fen: [['blueSlime', 14], ['crab', 12], ['wisp', 4, true], ['blueSlime', 2, true], ['crab', 1, true]], // (Wisps only at night here too: a Trainee's field)
  hollow: [['mushling', 17], ['wisp', 8], ['wisp', 3, true], ['mushling', 2, true]],
  ridge: [['beetle', 15], ['jarl', 1], ['wisp', 8], ['wisp', 3, true], ['beetle', 2, true]],
  city: [],
  birch: [['russet', 15], ['sprout', 10], ['slime', 4], ['matron', 1], ['wisp', 2], ['wisp', 3, true], ['russet', 2, true]],
  magic: [],
  coast: [['brine', 14], ['tidecrab', 13], ['crab', 3], ['tideKing', 1], ['wisp', 2], ['wisp', 3, true], ['brine', 2, true]],
  deep: [['gloomcap', 15], ['mushling', 4], ['shadeWisp', 11], ['gloomMother', 1], ['gloomcap', 2, true]],
  heath: [['cinderBeetle', 14], ['emberWisp', 11], ['beetle', 3], ['cinderLord', 1], ['cinderBeetle', 2, true]],
  // the kobold and goblin lands: they attack on sight; each race's king holds the second map
  stones: [['koboldWarrior', 15], ['koboldArcher', 11], ['koboldAssassin', 2], ['koboldWarrior', 2, true]],
  coalpit: [['koboldAssassin', 12], ['koboldWarrior', 10], ['koboldArcher', 5], ['koboldKing', 1], ['koboldAssassin', 2, true]],
  burnt: [['goblinWarrior', 15], ['goblinArcher', 11], ['goblinAssassin', 2], ['goblinWarrior', 2, true]],
  bloop: [], koboldcamp: [], goblinlair: [], // the raids spawn their own (tickRaid)
  serpent: [['goblinAssassin', 12], ['goblinWarrior', 10], ['goblinArcher', 5], ['goblinKing', 1], ['goblinAssassin', 2, true]],
  // Veidheim's lands: the gentle willows and treants round the village (and Yellow Bloops in the marsh),
  // the predators far off past Black Wood and Ash Heath, more of them at night
  hunt: [],
  marsh: [['willow', 14], ['yellowSlime', 13], ['elderWillow', 1], ['willow', 2, true], ['wisp', 3, true]],
  oldwood: [['treant', 14], ['willow', 9], ['ancientTreant', 1], ['treant', 2, true], ['wisp', 2, true]], // (the Ancient Treant, the oldest of them, roams its own forest)
  farm: [['snake', 15], ['wolf', 11], ['alphaWolf', 1], ['snake', 2, true], ['wolf', 3, true]],
  wolfhill: [['wolf', 15], ['bear', 10], ['snake', 2], ['greatBear', 1], ['wolf', 3, true]],
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
  delveA: [], delveB: [], // the Deep Halls: each floor's monsters are picked as it is carved (delve.js floorSpawns)
  halls1: [['hallScarab', 16], ['cobra', 13]],                               // Base 65-72
  halls2: [['hallMummy', 10], ['lamia', 9], ['servant', 9]],                 // 73-80
  halls3: [['sphinxCub', 10], ['sandElemental', 9], ['sarcophagus', 8], ['ammit', 1]], // 81-88, Ammit the mini-boss (74)
  halls4: [['jackal', 8], ['falcon', 7], ['eternalSphinx', 1]],             // 89-99: the great hall, the Guardians and the Eternal Sphinx
  redsands: [['redSlime', 17], ['giantAnt', 13], ['redSlime', 3, true], ['giantAnt', 2, true]],
  dunes: [['cactus', 14], ['duneWorm', 12], ['cactusLord', 1], ['duneWorm', 2, true], ['cactus', 2, true]],
  scorpion: [['scorpion', 14], ['runner', 11], ['rainbowRunner', 1], ['scorpion', 3, true], ['runner', 1, true]],
  desert: [['soldierAnt', 12], ['cactus', 3], ['duneWorm', 9], ['scorpion', 4], ['runner', 3], ['sandWyrm', 1], ['soldierAnt', 2, true], ['scorpion', 2, true]],
};
