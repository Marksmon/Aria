// The main story, "The Last Fire-Ring": one chain of steps that runs beside the people's own
// quests. The first steps are the tutorial; later ones lead from map to map, and every step says
// where to go next (the tracker names the map and the portal, the minimap rings it).
//
// The tale: long ago the fire-jotnar slept under the hills of Aria, and the first settlers lit a
// ring of fires to keep them dreaming. Their camp was Eldrun, the fire-ring. Now the fires burn low,
// the ground of Ember Hill shakes, and the Ember Jarl is waking.
//
// Step kinds:
//   talk  - talk to someone (npc); their lines play as the step completes
//   survive - hold a spot (at) for secs against waves (heralds, every, most: main.js tickVigil)
//   kill  - defeat n of a monster (counted from when the step starts)
//   visit - set foot on a map
//   stat  - raise any stat once            skill - learn a skill (skill, lv)
//   hotbar - put an item or skill on the hotbar   sell - sell something in a shop
//   job   - change job                     level - reach a Base Level (lv)
//   job2  - take a second job              keeper - sign a second Keeper's ledger
//   equip - wear an item (item)            accept - take any quest from someone
//   window - open a window (window: its id)
//   search - find things (spots: [{ map, x, z }], thing, verb): each is found by walking over it (main.js
//            tickStorySearch), and may be on a map of its own; the tracker leads to the next one
// kill steps may name one monster (mob) or several (mobs: any of them counts), and may bring their own
// (spawn: { mob, at }: a story monster there whenever the hero is on the map: main.js tickStorySpawn).
// A line may be a function of the story's flags, and carry options: { shake, sound } as it shows, or
// { choices: [[label, key], ...] } to ask the hero (the Seeress's reading: CALLINGS, callingOf).
// A step's say may be a function (flags, prog, quests) of how it went.
// A survive step may rain fire on the hero (meteors: { every, n, r, wind, hp }: n red circles round them
// every `every` s, each bursting `wind` s later for `hp` of their Max HP: main.js tickVigil).
// say: [[speaker npc id, or null for the narrator, line], ...] shown when the step completes.
// map: where it happens, for the directions (talk steps use the speaker's map).
import { NPCS } from './quests.js';
import { MAPS, ZONE_NAMES } from './world.js';
import { JOBS } from './progress.js';
import { skillLv } from './skills.js';

// the three callings the Seeress's runes can name (the 'seeress' step asks; callingOf reads the answers)
export const CALLINGS = {
  blade: { job: 'swordman', jobName: 'Blader', city: 'city', name: 'the Blade', trainer: 'Captain Ulfr', where: 'by the south gate of Steinborg',
    rune: "Tiwaz, the spear-rune, lands on top, bright as steel. Yours is the Blade: to stand in front and take the blow, so that others need not. Captain Ulfr trains Bladers, here in Steinborg." },
  rune: { job: 'mage', jobName: 'Sorcerer', city: 'magic', name: 'the Rune', trainer: 'Archmage Vigdis', where: 'in Galdrheim, north of Fen Shore',
    rune: "Kenaz, the torch-rune, burns on top of the pile. Yours is the Rune: fire and frost at a word, for those patient enough to learn them. Archmage Vigdis teaches Sorcerers in Galdrheim, north of Fen Shore." },
  bow: { job: 'archer', jobName: 'Archer', city: 'hunt', name: 'the Bow', trainer: 'Huntmaster Sigrid', where: 'in Veidheim, east past Willow Marsh',
    rune: "Raido, the road-rune, points away to the horizon. Yours is the Bow: quick feet and a sure eye, striking from where nothing can reach you. Huntmaster Sigrid trains Archers in Veidheim, past Willow Marsh." },
  dagger: { job: 'assassin', jobName: 'Assassin', city: 'sand', name: 'the Dagger', trainer: 'Master Kol', where: 'in Rytingborg, the oasis city south of Ember Hill',
    rune: "Perthro, the hidden-rune, falls face down. Yours is the Dagger: quick hands and the shadows, many blows where others strike one. Master Kol trains Assassins in Rytingborg, south of Ember Hill." },
};
// the path the hero picked at Eldrun (the 'paths' step), else the runes' calling, else the Blade
export const pickOf = (flags) => CALLINGS[flags?.pick] ? flags.pick : callingOf(flags) || 'blade';
// the calling the hero's answers point to (a tie goes to the last answer among the tied), or null
export function callingOf(flags) {
  const c = flags?.calling || {};
  let best = null;
  for (const k of Object.keys(CALLINGS)) {
    const n = c[k] || 0, b = best ? c[best] || 0 : -1;
    if (n > b || (n === b && flags.lastCall === k)) best = k;
  }
  return best && c[best] ? best : null;
}

// after the opening cutscene (main.js INTRO_SHOTS) and the hero's making: the waking
export const INTRO = [
  [null, 'The fire crackles low. Far to the south, the ground groans, and the whole camp trembles...', { shake: 0.45, sound: 'night' }],
  ['bram', 'Wake up! Wake up, young one! Thieves in the stores, and the fire-ring\'s Heart-Ember is gone! Come here, quickly. Tap me to walk over.', { shake: 0.2 }],
];

export const STORY = [
  // ---------- Prologue: the tutorial, told as a chase: the Heart-Ember stolen, hunted down and brought home ----------
  { id: 'wake', ch: 'Prologue', title: 'Awake by the Fire', kind: 'talk', npc: 'bram', goal: 'Talk to Elder Halvard by the campfire',
    say: [['bram', 'The Heart-Ember: the coal at the heart of the fire-ring, burning since the first settlers. It keeps the ring alight, and the ring keeps the Giant dreaming.'],
      ['bram', 'A bloop took it. A golden one, fat with the ember\'s warmth, out of the north portal into Moss Field. Bloops love a warm thing more than their own jelly.'],
      ['bram', 'I am too old to chase bloops. You are not. Here: three Red Potions, and my old Traveler\'s Cloak. It kept me warm on worse roads than this.'],
      [null, 'LESSON: STATS. First, know your strength. A guide will walk you through the Status window: what each stat does, and which path wants which, before you spend a single point. Points are costly to take back, so read first.']],
    reward: { xp: 4, items: { potion: 3, travel_cloak: 1 } } },
  { id: 'stats', ch: 'Prologue', title: 'Know Your Strength', kind: 'stat', goal: 'Open the Status window, read what each stat does, place a point with ▲ and press Confirm',
    hint: 'Not sure? END is never wasted. A Blader wants POW, QKN and END; a Sorcerer KNL, FNS and END; an Archer FNS and QKN; an Assassin POW and QKN, with a little END and FNS.',
    say: [['bram', 'Good. Every level brings more points: spend them as you grow.'],
      [null, 'LESSON: EQUIPMENT. Now put on the cloak: the guide will show you where it is and how to wear it. The Equip window (Equip, under your HP) shows everything you wear (weapon, armor, cloak, shoes, accessories) and what each gives.']],
    reward: { xp: 4 } },
  { id: 'equip', ch: 'Prologue', title: 'Dressed for the Road', kind: 'equip', item: 'travel_cloak', goal: 'Wear the Traveler\'s Cloak: Items window, tap the cloak, then Equip',
    hint: 'Gear raises your DEF, HP and more: the Status window shows the gain. Better gear drops from monsters, and the smiths sell and forge it.',
    say: [['bram', 'It suits you. Now go: through the north portal to Moss Field. Bloops crowd the way. Chase off three of them: tap a monster to fight it, and tap what it drops to pick it up.'],
      ['bram', 'Then find the thief. It glitters gold, and it runs.']],
    reward: { xp: 4 } },
  { id: 'slimes', ch: 'Prologue', title: 'Into Moss Field', kind: 'kill', mob: 'slime', n: 3, map: 'grove', goal: 'Defeat 3 Bloops in Moss Field (north portal)',
    say: [[null, 'LESSON: SKILLS. Your Job Level rises with every fight, and each Job Level brings a skill point.'],
      [null, 'Open the Skills window (Skills, under your HP) and raise Basic Training with ▲ before you go after the thief. Every Trainee starts there, and a job trial wants it at 9.']],
    reward: { xp: 6 } },
  { id: 'training', ch: 'Prologue', title: 'Basic Training', kind: 'skill', skill: 'basics', lv: 1, goal: 'Raise Basic Training in the Skills window',
    say: [[null, 'Something glitters gold between the trees: the Gel Thief! The Heart-Ember glows inside it like a coal in jelly.', { sound: 'heart' }],
      [null, 'It is quick, and it will run from you. Follow the gold arrow to it and give chase: it tires after a few seconds of running, or turns to fight once cornered against the trees.']],
    reward: { xp: 4 } },
  // a chase: the Gel Thief (mobs.js) runs from the hero, and fights only once cornered (main.js tickStorySpawn)
  { id: 'thief', ch: 'Prologue', title: 'The Gel Thief', kind: 'kill', mob: 'gelThief', n: 1, map: 'grove', spawn: { mob: 'gelThief', at: { x: 22, z: 26 } },
    goal: 'Catch the Gel Thief in Moss Field: chase the golden bloop until it turns to fight, and win back the Heart-Ember',
    hint: 'Follow the gold arrow. Tap it to give chase: after a few seconds of running it is out of breath and turns to fight (or corner it against the trees).',
    say: [[null, 'The Gel Thief bursts in a shower of golden jelly, and the Heart-Ember drops into the moss, still warm.', { shake: 0.25 }],
      [null, 'LESSON: ITEMS. Before you carry it home: put a Red Potion on the hotbar at the bottom, and the guide will show you how. One tap drinks it, even in the middle of a fight. Something tells you that you will need it.']],
    reward: { xp: 10, job: 30 } },
  { id: 'hotbar', ch: 'Prologue', title: 'Ready at Hand', kind: 'hotbar', item: 'potion', goal: 'Put a Red Potion on the hotbar: drag it from the Items window (or tap it, then Add to hotbar)',
    say: [[null, 'Skills go on the hotbar the same way, from the Skills window.'],
      [null, 'You lift the Heart-Ember, and its glow spills across the field. All over Moss Field, the bloops stop... and turn towards the light.', { shake: 0.3, sound: 'night' }],
      [null, 'An old stone ring stands in the south of the field, by the road home. Steady the ember there, and hold your ground until its glow settles.']],
    reward: { xp: 4 } },
  // the first stand: hold the stone ring while the ember's glow draws the field's bloops (a survive step)
  { id: 'ember', ch: 'Prologue', title: 'The Ember\'s Light', kind: 'survive', map: 'grove', at: { x: 32, z: 42 }, secs: 40, color: '#ffb84a',
    heralds: { early: ['slime', 'slime'], late: ['slime', 'blueSlime', 'slime'], after: 15 }, every: 10, most: 5,
    startText: 'The Heart-Ember blazes up in your hands, and every bloop in Moss Field comes hopping towards the light! Hold your ground until the glow settles.',
    breakText: 'The Heart-Ember\'s glow flickers wildly: you left the stone ring. Go back and steady it again.',
    goal: 'Stand in the glowing stone ring in the south of Moss Field and hold off the bloops until the Heart-Ember settles',
    hint: 'Waves of bloops come for 40 seconds. Stay close to the ring, and drink a potion from the hotbar if you need one.',
    say: [[null, 'The glow sinks to a steady, gentle warmth. The bloops lose interest one by one and hop away into the grass.'],
      [null, 'The Heart-Ember is safe. Take it home to Elder Halvard.']],
    reward: { xp: 20, job: 40, items: { potion: 3 } } },
  { id: 'report', ch: 'Prologue', title: 'The Elder\'s Errand', kind: 'talk', npc: 'bram', goal: 'Bring the Heart-Ember home to Elder Halvard at camp',
    say: [['bram', 'The Heart-Ember! Here, into the fire with it...', { sound: 'heart' }],
      [null, 'The fire-ring roars up, gold and white, higher than the tents. For a moment the whole camp is bright as noon.', { shake: 0.35 }],
      ['bram', '...and sinks again. Lower than last night. Lower than the night before. The ember is home, but the ring is failing all the same, and the ground of Ember Hill still shakes.'],
      ['bram', 'North past Moss Field stands Steinborg, the stone-fort. Take word to Captain Ulfr of the Watch that Eldrun\'s fires are failing. He will know what it means.'],
      [null, 'LESSON: QUESTS. Before you go, help someone. A ! over a head means a quest for you, a ? one to hand in. Elder Halvard himself has one: tap him.']],
    reward: { xp: 10, perz: 100 } },
  { id: 'helping', ch: 'Prologue', title: 'A Helping Hand', kind: 'accept', map: 'camp', goal: 'Take a quest from someone with a ! over their head (Elder Halvard has one)',
    hint: 'Tap them, read what they need, and press Accept.',
    say: [[null, 'Quests under way show under the clock. Tap one for its Quest View: the goal, the reward, and Go there, which walks you to it.'],
      [null, 'Now open the Quests window (Quests, under your HP): every quest in one place.']],
    reward: { xp: 6 } },
  { id: 'questbook', ch: 'Prologue', title: 'The Quest Book', kind: 'window', window: 'journal', goal: 'Open the Quests window (Quests, under your HP)',
    say: [[null, 'Main is this story. Job holds the job trials, Series the quests people give one after another, Side the rest. A quest on offer has Go there too.'],
      ['bram', 'Good. Now north with you, past Moss Field to Steinborg. Captain Ulfr is waiting for news, even if he does not know it yet.']],
    reward: { xp: 6, perz: 50 } },

  // ---------- Chapter 1: the stone-fort ----------
  { id: 'north', ch: 'Chapter 1: The Stone-Fort', title: 'The Road North', kind: 'visit', map: 'city', goal: 'Travel north through Moss Field to Steinborg',
    say: [[null, 'Steinborg: stone walls, a busy market square and the smell of the forge. The Watch house stands by the south gate.'],
      [null, 'Then the cobbles jump under your feet. Far to the south, Ember Hill rumbles like a giant clearing its throat, and every dog in the city howls at once.', { shake: 0.6, sound: 'night' }]],
    reward: { xp: 40, perz: 200 } },
  { id: 'captain', ch: 'Chapter 1: The Stone-Fort', title: 'Word for the Captain', kind: 'talk', npc: 'ulfr', goal: 'Tell Captain Ulfr (by the south gate) about the fires',
    say: [['ulfr', 'You felt that too. Third time this week... And now Eldrun\'s fires are failing? Then the old tales are more than tales.'],
      ['ulfr', 'Saeunn the Seeress has been seeing fire in her runes for a month. Her tower is in the north-east of the city. Go to her. I will double the watch on the south road.'],
      ['ulfr', 'But first, sign the Keeper\'s ledger by the west houses. A Keeper mends you, keeps your things, saves your place, and sends you to any other Keeper you have signed. You will walk these roads a great deal.']],
    reward: { xp: 40 } },
  // the Keepers, taught early: storage, healing, a save point, and the Keepers' road between towns
  { id: 'keepers', ch: 'Chapter 1: The Stone-Fort', title: 'The Keepers\' Ledger', kind: 'keeper', map: 'city', npc: 'keeper_city', goal: 'Sign the Keeper\'s ledger (by the west houses of Steinborg)',
    hint: 'Talk to the Keeper and choose Sign the ledger. The Keeper at the camp already knows you.',
    say: [['keeper_city', 'There: Steinborg remembers you now. Tap me whenever you need me. Heal me mends you. Storage keeps what your bag cannot carry, once you have taken a first job. Save here makes this the place you wake after a fall.'],
      ['keeper_city', 'And Teleport takes you to any other Keeper whose ledger you have signed, for a fare: the one at your camp already, and one waits in Galdrheim too. Now go on to the Seeress.']],
    reward: { xp: 40, perz: 300 } },
  // the Seeress reads the hero's runes: three questions, and the calling they point to (CALLINGS)
  { id: 'seeress', ch: 'Chapter 1: The Stone-Fort', title: 'The Seeress', kind: 'talk', npc: 'saeunn', goal: 'Find Saeunn the Seeress at her tower (north-east of the city)',
    say: [['saeunn', 'So. You are the one the runes showed me: a stranger by a dying fire.'],
      ['saeunn', 'Beneath Ember Hill sleeps the Fire Giant, the last of the fire-jotnar. The fire-ring kept him dreaming. When the ring goes out, he wakes, and all of Aria burns.', { shake: 0.25 }],
      ['saeunn', 'You cannot face him as you are. But the runes know what you could become. Sit. Answer from the heart: the runes hear the truth, and nothing else.'],
      ['saeunn', 'A wolf blocks the road at dusk, teeth bared. What do you do?', { choices: [['Draw steel and meet it head-on.', 'blade'], ['Speak a word of fire, and watch it run.', 'rune'], ['Climb a rock and strike it from afar.', 'bow']] }],
      ['saeunn', 'You set out into lands no one has mapped. What do you carry?', { choices: [['A shield and a steady arm.', 'blade'], ['A book of old words.', 'rune'], ['Sharp eyes and a light pack.', 'bow']] }],
      ['saeunn', 'And when the skalds sing of you, what should the song say?', { choices: [['That I stood my ground when others ran.', 'blade'], ['That I knew what all the others had forgotten.', 'rune'], ['That I never once missed.', 'bow']] }],
      [null, 'Saeunn shakes the rune-bones in her cupped hands and casts them across the table. They clatter, spin... and lie still.', { sound: 'heart' }],
      ['saeunn', (flags) => CALLINGS[callingOf(flags) || 'blade'].rune],
      ['saeunn', 'But runes advise; they do not command. Once you are ready (Trainee Job 10, Basic Training 9), the Blade, the Rune and the Bow will each try you. The road you walk is yours.'],
      ['saeunn', 'Grow strong. When you reach Trainee Job 9, Halvard will call you home to Eldrun to choose: he has seen many young ones choose.'],
      ['saeunn', 'But first, an errand. Huntmaster Sigrid keeps the eastern woods from Veidheim, the hunters\' village past Birch Grove and Willow Marsh. Her trees felt the trembling before my runes did. Take her my warning, and see what she has seen.']],
    reward: { xp: 60 } },
  // ---------- the hunters' village: a low-level visit to Veidheim on the way (Willow Marsh is Lv 7-8) ----------
  { id: 'eastward', ch: 'Chapter 1: The Stone-Fort', title: 'The Hunters\' Village', kind: 'visit', map: 'hunt', goal: 'Travel east to Veidheim, the hunters\' village (through Birch Grove and Willow Marsh)',
    hint: 'Birch Grove\'s Red Sprouts leave you be if you leave them be, but keep well away from the huge Giant Sprout. In Willow Marsh the Willows shake seeds over you that slow you: keep moving.',
    say: [[null, 'Veidheim: log houses round a green, smoke from the tanner\'s yard, and a target on every fence. Somewhere a bowstring thrums, and somebody cheers.'],
      [null, 'By the green, a boy with a bow too big for him is arguing with the sentry. "I saw them, I tell you! The willows walked right up to the marsh road last night!"'],
      ['finn', 'You believe me? Every night since the ground started shaking, the willows come up out of the marsh, a little closer each time. There is an old way-stone on the marsh road, just west of the gate. They walk past it every night. Come and see!'],
      [null, 'Finn is already running for the gate. Willow Marsh is through the west gate: find the way-stone on the marsh road, and stand by it.']],
    reward: { xp: 60, perz: 100 } },
  // a stand on the marsh road with Finn (a survive step: main.js tickVigil), the willows and bloops coming up out of the water
  { id: 'marshroad', ch: 'Chapter 1: The Stone-Fort', title: 'The Marsh Road', kind: 'survive', map: 'marsh', at: { x: 48, z: 33 }, secs: 40, color: '#9fe06a',
    heralds: { early: ['willow', 'yellowSlime'], late: ['willow', 'willow', 'yellowSlime'], after: 15 }, every: 10, most: 5,
    startText: 'The way-stone hums as you step up to it. Out in the reeds, branches creak, and the willows start walking up out of the marsh! Hold the road!',
    breakText: 'You left the way-stone, and the willows slip past onto the road. Go back to the stone and hold it again.',
    goal: 'Stand by the glowing way-stone on the marsh road (Willow Marsh, just west of Veidheim\'s gate) and hold back the willows',
    hint: 'Waves of Willows and Yellow Bloops come for 40 seconds. Stay by the stone; a potion from the hotbar if you need one. Keep clear of the Elder Willow, the marsh\'s great tree.',
    say: [[null, 'The last willow sinks back into the water, and the marsh goes still. Behind you, someone claps slowly.'],
      [null, 'It is Huntmaster Sigrid, Finn by the ear. "Well. It seems the boy was right, and you can hold a road. Come back to the village, both of you."']],
    reward: { xp: 120, job: 60, items: { potion: 4 } } },
  { id: 'sigridword', ch: 'Chapter 1: The Stone-Fort', title: 'The Huntmaster', kind: 'talk', npc: 'sigrid', goal: 'Give Saeunn\'s warning to Huntmaster Sigrid in Veidheim',
    say: [['sigrid', 'So the Seeress sends word: the fire-ring fails, and the Giant stirs. That explains my willows. Whatever wakes under Ember Hill, the old trees feel it in their roots, and they walk.'],
      ['sigrid', 'Finn will stand no watches yet, whatever he thinks. But you held that road like a hunter. If ever you want the bow, my door is open: a trial, when you are ready for one.'],
      ['sigrid', 'Our Keeper on the green will sign you into her ledger: Veidheim is a long walk from Steinborg, and the Keepers can send you back in a blink. And Eydis the Trader buys what the marsh gave you.'],
      [null, 'Perz is the coin of Aria. Monsters don\'t carry any: you earn it by selling what they drop to a trader, and from quests.'],
      [null, 'Now go home to Eldrun Camp. You have grown fast: Elder Halvard will help you choose a path.']],
    reward: { xp: 80, perz: 450 } },

  // ---------- Chapter 2: the four paths ----------
  // story EXP (x2 with QUEST_RATE) is paced so each chapter brings a hero to the next one's hinted level:
  // the Giant Sprout at about Base 28, Chapter 5's kobolds at about 32. A Trainee who reaches Job 9
  // during Chapter 1 is called home to choose (CALL_JOB, Story.callHome): no grind for the trials
  // the jobs explained, and the hero's pick (flags.pick): the story then sends them to that trainer
  { id: 'paths', ch: 'Chapter 2: The Four Paths', title: 'By the Fire', kind: 'talk', npc: 'bram', goal: 'Go home to Eldrun Camp: Elder Halvard will help you choose a path',
    say: [['bram', 'Sit, sit. You have grown since the morning I shook you awake. It is time you chose a path. Four masters train the young of Aria, and each path grows into something greater.'],
      [null, 'THE BLADE: Captain Ulfr, Steinborg. Sword in hand, POW and END: you stand in front and take the blows. A Blader grows into a BladeMaster: the same damage on every monster, with Blade Dance and Final Blade.',
        { pics: [{ job: 'swordman', label: 'Blader' }, '→', { job: 'blademaster', label: 'BladeMaster' }] }],
      [null, 'THE RUNE: Archmage Vigdis, Galdrheim. Fire, frost, wind and earth at a word, with KNL behind them. A Sorcerer grows into a Wizard: storms and meteors that break whole crowds, every element turned against the one it beats.',
        { pics: [{ job: 'mage', label: 'Sorcerer' }, '→', { job: 'wizard', label: 'Wizard' }] }],
      [null, 'THE BOW: Huntmaster Sigrid, Veidheim. You shoot from five paces, with FNS for aim and quick feet. An Archer grows into a Windrunner: lightning-fast shots, and bursts of wind that carry you out of harm\'s way.',
        { pics: [{ job: 'archer', label: 'Archer' }, '→', { job: 'windrunner', label: 'Windrunner' }] }],
      [null, 'THE DAGGER: Master Kol, Rytingborg, the oasis city south of Ember Hill. Quick hands, QKN and a blade that strikes again and again. An Assassin grows into a Phantom: a dagger in each hand, and shadows of yourself that fight beside you.',
        { pics: [{ job: 'assassin', label: 'Assassin' }, '→', { job: 'phantom', label: 'Phantom' }] }],
      ['bram', 'And some walk two paths at once. Learn two first jobs, raise each to 20 skill points by Job 40, and a mixed second job opens.'],
      [null, 'THE MAGIC KNIGHT, of the Blade and the Rune (Sir Eirik the Runeblade, Steinborg), lays spells along the blade: fire, frost and lightning in every cut.',
        { pics: [{ job: 'swordman', label: 'Blader' }, '+', { job: 'mage', label: 'Sorcerer' }, '→', { job: 'magicknight', label: 'Magic Knight' }] }],
      [null, 'THE MOON RANGER, of the Rune and the Bow (Hrafn the Stargazer, Galdrheim), shoots arrows of starfall, and grows stronger when the moon is up.',
        { pics: [{ job: 'mage', label: 'Sorcerer' }, '+', { job: 'archer', label: 'Archer' }, '→', { job: 'moonranger', label: 'Moon Ranger' }] }],
      [null, 'THE BEASTMASTER, of the Blade and the Bow (Bjarki, Veidheim), fights up close with a cleaver and from afar with a bow, and never alone: a Bear, a pack of Wolves and a Hawk come at a call and fight at your side.',
        { pics: [{ job: 'swordman', label: 'Blader' }, '+', { job: 'archer', label: 'Archer' }, '→', { job: 'beastmaster', label: 'Beastmaster' }] }],
      [null, 'And the dagger crosses every path. THE SHADOWBLADE, of the Blade and the Dagger (Rurik, Steinborg), strikes out of the shadows; THE HUNTER, of the Bow and the Dagger (Greta the Trapper, Veidheim), sets traps and shoots what they catch; THE VOODOO, of the Rune and the Dagger (Mother Hulda, Galdrheim), lays curses and poisons that grow.',
        { pics: [{ job: 'shadowblade', label: 'Shadowblade' }, { job: 'hunter', label: 'Hunter' }, { job: 'voodoo', label: 'Voodoo' }] }],
      ['bram', (flags) => { const c = CALLINGS[callingOf(flags)]; return `So, young one: which path will you walk first?${c ? ` (Saeunn's runes named ${c.name}.)` : ''}`; },
        { choices: [['The Blade: a Blader, with Captain Ulfr in Steinborg', 'pick:blade'], ['The Rune: a Sorcerer, with Archmage Vigdis in Galdrheim', 'pick:rune'], ['The Bow: an Archer, with Huntmaster Sigrid in Veidheim', 'pick:bow'], ['The Dagger: an Assassin, with Master Kol in Rytingborg', 'pick:dagger']] }],
      ['bram', (flags) => { const c = CALLINGS[pickOf(flags)]; return `${c.name.slice(4)} it is! I will send you to ${c.trainer}, ${c.where}, this very moment. Reach Trainee Job 10 with Basic Training 9, and the trial is yours to take.`; }, { sound: 'heart' }],
      ['bram', 'Change your mind on the road? Any of the four will try you instead, no harm done. And mark this: once you pass one trial, the others stay open to you. Pass them as well, wear whichever first job you like at a Keeper, and that is how the mixed paths begin.']],
    reward: { xp: 40 } },
  { id: 'journey', ch: 'Chapter 2: The Four Paths', title: 'The Road to the Trainer', kind: 'visit',
    map: (flags) => CALLINGS[pickOf(flags)].city,
    goal: (flags) => { const c = CALLINGS[pickOf(flags)]; return `Travel to ${ZONE_NAMES[c.city]} to train as a ${c.jobName} with ${c.trainer}`; },
    hint: 'Changed your mind? Captain Ulfr (Steinborg), Archmage Vigdis (Galdrheim), Huntmaster Sigrid (Veidheim) and Master Kol (Rytingborg) all try Trainees: any of them will do.',
    say: (flags) => { const c = CALLINGS[pickOf(flags)]; return [[null, `${ZONE_NAMES[c.city]}. Somewhere here, ${c.trainer} trains the ${c.jobName}s of Aria.`], [null, 'A trial wants Trainee Job 10 and Basic Training 9. Fight on until you are ready, then talk to your trainer and take it.']]; },
    reward: { xp: 40 } },
  { id: 'path', ch: 'Chapter 2: The Four Paths', title: 'The Job Trial', kind: 'job',
    map: (flags) => (flags.pick ? CALLINGS[flags.pick].city : null),
    goal: (flags) => { const c = CALLINGS[flags.pick]; return c ? `Pass the ${c.jobName} trial with ${c.trainer} in ${ZONE_NAMES[c.city]} (Trainee Job 10 and Basic Training 9 first). Changed your mind? Any first-job trainer will try you` : 'Reach Trainee Job 10 with Basic Training 9, then pass a job trial: Captain Ulfr in Steinborg (Blader), Archmage Vigdis in Galdrheim, north of Fen Shore (Sorcerer), Huntmaster Sigrid in Veidheim, east past Willow Marsh (Archer), or Master Kol in Rytingborg, south of Ember Hill (Assassin)'; },
    // a hint may depend on the hero: whether the trials are open yet, and the path they picked
    hint: (prog, flags) => {
      const c = CALLINGS[pickOf(flags)];
      if (!(prog && prog.jobLv >= 10 && skillLv(prog, 'basics') >= 9)) return 'Fight in a Trainee\'s field (Moss Field, Fen Shore, Willow Marsh or the Red Sands: big Job EXP for a Trainee) to gain Job Levels, and raise Basic Training to 9 (Skills window).';
      return `You're ready! Talk to ${c.trainer}, ${c.where}, and take the trial. Or any other trainer's: the choice is still yours.`;
    },
    // the job taken, and whether it was the one the runes named
    say: (flags, prog) => {
      const name = JOBS[prog?.job]?.name || 'hero', named = CALLINGS[callingOf(flags)];
      const fits = named && named.job === prog?.job;
      const picked = CALLINGS[flags.pick], turned = picked && picked.job !== prog?.job; // (set out for one path, took another)
      return [[null, `You are a ${name} now.`, { shake: 0.3, sound: 'levelup' }],
        ...(turned ? [[null, `You set out for ${picked.name.slice(4)}, and chose another road at the last. When word reaches Eldrun, Halvard will laugh into his beard: a good path is a good path.`]] : []),
        ['saeunn', !named ? 'I felt it from my tower: a new path taken. Walk it well.' : fits ? 'I felt it from my tower: the runes were right. They usually are. Walk it well.' : 'I felt it from my tower, and laughed: the runes said otherwise. I have never been so glad to be wrong. Walk it well.'],
        [null, 'Your new skills are waiting in the Skills window. And the other first-job trials stay open: pass them too, and you can wear any first job you have earned (switch at a Keeper). Walk two of them far enough, and a mixed second job opens.'],
        [null, 'And far to the south, beneath Ember Hill, something stirs, as if it heard.', { shake: 0.25 }]];
    },
    reward: { xp: 500, perz: 300 } },

  // ---------- Chapter 3: embers in the wilds ----------
  { id: 'heralds', ch: 'Chapter 3: Embers in the Wilds', title: 'The Heralds', kind: 'talk', npc: 'saeunn', goal: 'Return to Saeunn the Seeress',
    say: [['saeunn', 'The Giant sends his heralds ahead of him: beasts swollen with his heat. In Birch Grove, east of the city, a Giant Sprout has grown huge on it.'],
      ['saeunn', 'Its roots drink from Ember Hill, and the Red Sprouts around it carry the heat out into the grove. Thin them out, and see what their roots hold. The Giant Sprout itself you may leave be: it is a fight for the very strong.']],
    reward: { xp: 400 } },
  { id: 'redsprouts', ch: 'Chapter 3: Embers in the Wilds', title: 'Roots of Fire', kind: 'kill', mob: 'russet', n: 12, map: 'birch', goal: 'Defeat 12 Red Sprouts in Birch Grove (east gate)',
    hint: 'Red Sprouts of level 18. The Giant Sprout roams the grove too: you need not fight it, so keep your distance.',
    say: [[null, 'The last Red Sprout crumbles into ash and thorns. Deep in its roots, something glows like a coal.']],
    reward: { xp: 5000, perz: 1500 } },
  { id: 'roots', ch: 'Chapter 3: Embers in the Wilds', title: 'What the Roots Knew', kind: 'talk', npc: 'saeunn', goal: 'Tell Saeunn what you found',
    say: [['saeunn', 'A coal in the roots... The Giant is waking faster than I feared.'],
      ['saeunn', 'Go south through Dark Dale and look upon Ember Hill with your own eyes. But do not wake him before you are ready.']],
    reward: { xp: 1500 } },
  { id: 'emberhill', ch: 'Chapter 3: Embers in the Wilds', title: 'The Ember-Hill', kind: 'visit', map: 'ridge', goal: 'Travel through Dark Dale to Ember Hill',
    say: [[null, 'The hill is warm under your feet. In the south of Ember Hill, something vast breathes in its sleep.']],
    reward: { xp: 2000 } },
  // ---------- Chapter 4: the fire-ring ----------
  // (the Fire Giant itself is no part of the story: it waits in Ember Hill as an MVP, for the strongest)
  { id: 'runesong', ch: 'Chapter 4: The Fire-Ring', title: 'The Song of the Ring', kind: 'talk', npc: 'vigdis', goal: 'Go to Archmage Vigdis in Galdrheim (north of Fen Shore)',
    say: [['vigdis', 'You have seen him sleeping, then. Good. Most who see the Giant awake do not come back to tell of it.'],
      ['vigdis', 'Hallveig cut the fire-ring\'s runes; I can sing them again. But the song must reach the sleeper himself. I will sing from my tower, and my runes will carry it to a circle on Ember Hill. He will feel it.'],
      ['vigdis', 'Stand in that circle, on the hill road north of his lair, and I will begin. His heralds will come up out of the hill to break it. Hold them off until the song is done.']],
    reward: { xp: 3000, items: { potion3: 10, potion2: 10 } } },
  // the first saga's climax: hold Ember Hill while Vigdis sings the Giant back to sleep (a survive
  // step: main.js tickVigil). Falling, or walking away, and the song must start again
  { id: 'vigil', ch: 'Chapter 4: The Fire-Ring', title: 'The Vigil on Ember Hill', kind: 'survive', map: 'ridge', at: { x: 32, z: 24 }, secs: 75,
    goal: 'Stand in the rune circle on Ember Hill and hold off the Giant\'s heralds until Vigdis\'s song is done',
    hint: 'Wave after wave of Beetles and Wisps come at you for 75 seconds. Bring potions, and stay close to the rune circle: walk away and the song breaks.',
    say: [[null, 'The last note rings out over the hill. Deep below, something vast sighs, and is still. The heralds crumble into ash.'],
      [null, 'Vigdis\'s voice comes faintly out of the circle: "It holds. He dreams again. Now carry the song home to Eldrun, and sing it into the fire-ring itself."'],
      [null, '"One day he may wake anyway. If you grow strong enough (I would say Base Level 50, and the best gear in Aria), you could end it for good. That fight is yours to choose."']],
    reward: { xp: 4000, items: { potion2: 10 } } },
  { id: 'rekindled', ch: 'Chapter 4: The Fire-Ring', title: 'The Fire-Ring Rekindled', kind: 'talk', npc: 'bram', goal: 'Bring the song home to Elder Halvard at camp',
    say: [['bram', 'Sing it, then, there by the fire... Look! It has not burnt this bright since I was a boy.'],
      ['bram', 'The Giant sleeps on under Ember Hill, and the ground is quiet. Saeunn says the runes speak of older names beyond the mountains: lands the songs still remember. The road goes on, as roads do.'],
      ['bram', 'Rest now, hero of Eldrun. Aria will need you again.'],
      [null, 'The Last Fire-Ring: the end of the first saga. The Fire Giant still waits in the south of Ember Hill, for anyone strong enough to wake him.']],
    reward: { xp: 4000, perz: 20000, items: { glow_charm: 1 } } },

  // ---------- Chapter 5: the salt road (the kobolds of Stone Field and Coal Pit) ----------
  // (Captain Ulfr's errand, once a step of its own, comes by letter: one talk less on the way, the audit's pacing pass)
  { id: 'carter', ch: 'Chapter 5: The Salt Road', title: 'The Carter\'s Tale', kind: 'talk', npc: 'hakon', goal: 'Captain Ulfr sends word: the salt carts from Salt Bay have stopped. Find Hakon the Carter by the west road of Salt Bay (west through Fen Shore)',
    say: [['hakon', 'Captain Ulfr sent you? Good. He is the only one in Steinborg who believed me.'],
      ['hakon', 'Kobolds, I tell you, a dozen of them, out of Stone Field with axes and bows. Took my horse and my cart.'],
      ['hakon', 'And here is the strange thing: they left the salt. They took the lamp oil, the pitch, the tinder. Every kobold I ever met runs from a torch. Why would they steal fire?'],
      ['hakon', 'The road goes west, round the bay and into their hills. If you go, go armed.'],
      ['hakon', 'One more thing. The Boatman by the water says the salt could go round by boat, if not for the bloops of Bloop Island. Help him first, and the road will wait.']],
    reward: { xp: 9000, perz: 1000 } },
  // the first raid (raid.js): a clear of the Boatman's Tutorial run (and only that) moves the story on
  { id: 'bloopisle', ch: 'Chapter 5: The Salt Road', title: 'Bloop Island', kind: 'raid', raid: 'bloop', map: 'coast', npc: 'boatman', goal: 'Clear the Tutorial crossing to Bloop Island (the Boatman by the water in Salt Bay)',
    hint: 'Three waves of bloops, then BleepBloop, in 10 minutes. The Tutorial run starts no cooldown: lose, and the Boatman rows you out again whenever you are ready.',
    say: [['boatman', 'BleepBloop beaten, and on your first crossing! The bloops will keep off the boats for a while after a visit like that.'],
      ['boatman', 'Come back whenever the tide allows: four crossings, from Easy to Hell. The harder the crossing, the better the pay.']],
    reward: { xp: 3000, perz: 2000 } },
  { id: 'stonefield', ch: 'Chapter 5: The Salt Road', title: 'The Stone-Field', kind: 'kill', mobs: ['koboldWarrior', 'koboldArcher', 'koboldAssassin'], n: 12, map: 'stones', goal: 'Defeat 12 kobolds in Stone Field (west of Salt Bay)',
    hint: 'Kobolds of level 28 to 33, and every one of them attacks on sight. Base Level 32 or so is a fair start.',
    say: [[null, 'The kobolds fight like cornered dogs. Each pack carries a lump of coal that glows a dull red, warm in the hand though no fire touched it.']],
    reward: { xp: 9000, perz: 2500, items: { potion2: 10 } } },
  { id: 'redcoal', ch: 'Chapter 5: The Salt Road', title: 'Coal Without Fire', kind: 'talk', npc: 'saeunn', goal: 'Show the glowing coal to Saeunn the Seeress (Steinborg)',
    say: [['saeunn', 'Coal that burns without a flame... This is the Giant\'s heat, seeping up through the stone. We sang him back to sleep, but he still breathes, and his breath warms the earth.'],
      ['saeunn', 'The Coal Pit, the kobolds\' quarry west of the Stone Field, lies right above one of his veins. The kobolds are not raiding for fun. Something drives them.'],
      ['saeunn', 'Go down into Coal Pit and see what it is.']],
    reward: { xp: 5000 } },
  { id: 'coalpit', ch: 'Chapter 5: The Salt Road', title: 'Down into Coal Pit', kind: 'visit', map: 'coalpit', goal: 'Travel west through Stone Field to Coal Pit',
    say: [[null, 'The Coal Pit glows. Red light seeps from every seam of the quarry, and the air shimmers with heat.'],
      [null, 'By the east road a man in a miner\'s hood waves to you from behind a rock.']],
    reward: { xp: 6000 } },
  { id: 'miner', ch: 'Chapter 5: The Salt Road', title: 'The Escaped Miner', kind: 'talk', npc: 'dag', goal: 'Talk to Dag the Miner by the east road of Coal Pit',
    say: [['dag', 'Quiet! They will hear you. I was a miner here before the kobolds took the pit, and their prisoner after. I got loose three nights ago.'],
      ['dag', 'It is not the kobolds\' doing. Goblins came down from Burnt Wood, north of Galdrheim, last winter, with whips. The Kobold King bowed to them. Now the kobolds dig the red coal day and night, steal fire to light the tunnels, and the goblins cart the coal away north.'],
      ['dag', 'Where to, I could not say. But I heard the word their drivers use for it: the Waking Fire.'],
      [null, 'You send Dag\'s news to Captain Ulfr by the Keepers. His answer is back before nightfall:'],
      ['ulfr', 'Goblins with whips, and a Waking Fire. I do not like the sound of either.'],
      ['ulfr', 'Burnt Wood lies beyond Galdrheim\'s north gate. It was a green wood once; the goblins burnt it bare when they came. If the coal goes north, it goes through Burnt Wood. Break their coal-train.']],
    reward: { xp: 18000, perz: 4000, items: { hard_ore: 2 } } },

  // ---------- Chapter 6: the goblin war-band ----------
  { id: 'coaltrain', ch: 'Chapter 6: The Goblin War-Band', title: 'Break the Coal-Train', kind: 'kill', mobs: ['goblinWarrior', 'goblinArcher', 'goblinAssassin'], n: 15, map: 'burnt', goal: 'Defeat 15 goblins in Burnt Wood (north of Galdrheim)',
    hint: 'Goblins of level 38 to 44. They hunt in packs, so fight at the edge of a group, not in the middle of it.',
    say: [[null, 'Among the burnt stumps lie split sacks of red coal. A trail of black dust runs north, towards Serpent Wood, and wagon ruts lead away south and east, the long way round to Ash Heath.']],
    reward: { xp: 20000, perz: 6000, items: { potion3: 10 } } },
  { id: 'trails', ch: 'Chapter 6: The Goblin War-Band', title: 'Two Trails', kind: 'talk', npc: 'vigdis', goal: 'Ask Archmage Vigdis in Galdrheim about the coal',
    say: [['vigdis', 'Red coal, the Giant\'s own heat. Burnt, it is only warm. Fed to something alive, it makes that thing a furnace.'],
      ['vigdis', 'The ruts to Ash Heath: the goblins have been carting the coal all the way there, to feed the Giant Beetle. Every lump it eats, the Giant feels in his sleep. And the trail to Serpent Wood... I fear that is where the Waking Fire burns.'],
      ['vigdis', 'Neither is a fight for you yet. You must grow beyond your first path first.']],
    reward: { xp: 8000 } },

  // ---------- Chapter 7: the second path ----------
  { id: 'secondpath', ch: 'Chapter 7: The Second Path', title: 'Beyond the First Path', kind: 'job2', goal: 'Take a second job: BladeMaster (Captain Ulfr), Wizard (Archmage Vigdis), Magic Knight (Sir Eirik, Steinborg), Windrunner (Huntmaster Sigrid, Veidheim), Moon Ranger (Hrafn the Stargazer, Galdrheim), Beastmaster (Bjarki, Veidheim), Phantom (Master Kol, Rytingborg), Shadowblade (Rurik, Steinborg), Hunter (Greta the Trapper, Veidheim) or Voodoo (Mother Hulda, Galdrheim)',
    hint: 'A second-job trial opens at Job Level 40. Which trials you may take depends on where your skill points went.',
    say: [[null, 'Your power has taken a new shape. The aura around you is faint, but every monster in Aria can feel it.'],
      ['vigdis', 'Now you are ready. Go to Ash Heath: the Fire Beetles there gorge on the goblins\' red coal. Break their feast.']],
    reward: { xp: 15000, perz: 10000 } },

  // ---------- Chapter 8: the Waking Fire ----------
  { id: 'coalfeast', ch: 'Chapter 8: The Waking Fire', title: 'The Coal Feast', kind: 'kill', mob: 'cinderBeetle', n: 20, map: 'heath', goal: 'Defeat 20 Fire Beetles in Ash Heath (east of Ember Hill)',
    hint: 'Fire Beetles of level 42: water on your side helps. The Giant Beetle roams the heath too: you need not fight it.',
    say: [[null, 'The last Fire Beetle crashes down, and the red glow drains out of the coal heaps. Far to the west, Ember Hill falls quiet.'],
      [null, 'Only one trail is left: north from Burnt Wood, into Serpent Wood.']],
    reward: { xp: 30000, perz: 10000, items: { potion3: 10 } } },
  { id: 'ormholt', ch: 'Chapter 8: The Waking Fire', title: 'The Serpent Wood', kind: 'visit', map: 'serpent', goal: 'Travel north from Burnt Wood to Serpent Wood',
    say: [[null, 'Serpent Wood. In the north clearing, a ring of stones has been raised around a pit of red coal, so like Eldrun\'s fire-ring that it chills you.'],
      [null, 'But these runes are cut backwards. Eldrun\'s ring sings the Giant to sleep. This one is built to wake him.']],
    reward: { xp: 12000 } },
  { id: 'firekeepers', ch: 'Chapter 8: The Waking Fire', title: 'The Fire-Keepers', kind: 'kill', mobs: ['goblinWarrior', 'goblinArcher', 'goblinAssassin'], n: 20, map: 'serpent', goal: 'Defeat 20 goblins in Serpent Wood, the keepers of the Waking Fire',
    hint: 'Serpent Wood\'s goblins are the strongest of their kind, and the Goblin King\'s guard. Stay out of his clearing in the north unless you mean to fight him.',
    say: [[null, 'With no one left to feed it, the Waking Fire gutters and goes out. From his clearing the Goblin King howls at a cold pit.'],
      [null, 'One rune-stone of the ring, cut backwards, is small enough to carry. Archmage Vigdis will want to see it.']],
    reward: { xp: 40000, perz: 12000 } },
  { id: 'runestone', ch: 'Chapter 8: The Waking Fire', title: 'The Backward Rune', kind: 'talk', npc: 'vigdis', goal: 'Bring the backward rune-stone to Archmage Vigdis (Galdrheim)',
    say: [['vigdis', 'Cut backwards, and by a hand that knew Hallveig\'s runes as well as I do. No goblin learnt this alone.'],
      ['vigdis', 'Someone taught them. Someone who wants the Giant awake. I will set every sorcerer in Galdrheim on this stone; it will tell us who, in time.'],
      ['vigdis', 'Take the news home to Eldrun. The Elder has earned a quiet night.']],
    reward: { xp: 20000 } },
  { id: 'twofires', ch: 'Chapter 8: The Waking Fire', title: 'Two Fire-Rings', kind: 'talk', npc: 'bram', goal: 'Return to Elder Halvard at Eldrun Camp',
    say: [['bram', 'Two fire-rings: one to keep him dreaming, and one to wake him. Ours burns bright, and theirs is cold. Let it stay that way.'],
      ['bram', 'The kobolds of Coal Pit can lay down their picks, and the salt carts will roll again. Hakon will be glad of his horse.'],
      ['bram', 'But a hand that cuts runes backwards is still out there. Rest while you can, hero of Eldrun.'],
      [null, 'The Waking Fire: the end of the second saga. The Kobold King in Coal Pit and the Goblin King in Serpent Wood still hold their courts, for anyone strong enough to face them.']],
    reward: { xp: 60000, perz: 50000, items: { hard_ore: 5, armor_ore: 5 } } },

  // ---------- Chapter 9: the eye in the sand (about Base 55-60) ----------
  // the third saga (docs/story-outline.md): the backward rune-stone's second mark leads south. The rune-cutter is
  // Torvald (the owner's pick), unmasked in Chapter 11. No step needs a boss, and the Sphinx's and the World
  // Tree's secret series stay secret: the story walks round them
  { id: 'sunmark', ch: 'Chapter 9: The Eye in the Sand', title: 'A Sun Over Sand', kind: 'talk', npc: 'vigdis', goal: 'Archmage Vigdis has read the backward rune-stone (Galdrheim)',
    hint: 'The third saga: about Base Level 55 and up.',
    say: [['vigdis', 'The stone has spoken, a little. Under the backward runes is a second mark, cut small: a sun over sand.'],
      ['vigdis', 'Whoever taught the goblins did not stop at Serpent Wood. There is another ring, far to the south, in the desert past Rytingborg.'],
      ['vigdis', 'Thora the Caravan Master knows every road in those sands. Ask her what her drivers have seen.']],
    reward: { xp: 40000 } },
  { id: 'caravans', ch: 'Chapter 9: The Eye in the Sand', title: 'The Missing Caravans', kind: 'talk', npc: 'thora', goal: 'Ask Thora the Caravan Master in Rytingborg what her drivers have seen',
    say: [['thora', 'Seen? Three caravans gone in a month, on the Pyramid road. Wagons, mules, drivers. The scorpions came up out of the sand like they were called.'],
      ['thora', 'And the one driver who walked home swears there was a man on the dunes before the scorpions came. Robed, with a staff, drawing in the sand with it.'],
      ['thora', 'Clear the scorpions off the road round the Pyramid, and I will believe the road can be ridden again.']],
    reward: { xp: 40000, perz: 5000 } },
  { id: 'roadscorpions', ch: 'Chapter 9: The Eye in the Sand', title: 'The Pyramid Road', kind: 'kill', mob: 'scorpion', n: 20, map: 'scorpion', goal: 'Defeat 20 Sand Scorpions on the Pyramid road (Scorpion Sands)',
    hint: 'Sand Scorpions of level 61 poison what they sting: a Green Herb cures it. The Rainbow Runner roams the sands too: you need not fight it.',
    say: [[null, 'The last scorpion curls up in the sand. Where it fell, the dune is scored with lines: a rune, cut backwards, glinting like a Watcher stone.'],
      [null, 'There will be more. Follow the glint across the sands.']],
    reward: { xp: 120000, perz: 12000, items: { potion3: 10 } } },
  { id: 'sandrunes', ch: 'Chapter 9: The Eye in the Sand', title: 'Runes in the Dunes', kind: 'search', thing: 'Backward rune', verb: 'Rubbing taken',
    spots: [{ map: 'dunes', x: 20, z: 20 }, { map: 'scorpion', x: 44, z: 44 }, { map: 'desert', x: 40, z: 20 }],
    goal: 'Find the three backward runes cut into the sands: one in the Cactus Dunes, one in Scorpion Sands, one in the Great Desert',
    hint: 'They glint gold in the sand. Walk over each to take a rubbing.',
    say: [[null, 'Three rubbings, and the same hand in every one: deep, sure cuts, each rune turned on its head. Whoever did this knows the old runes better than any goblin.'],
      [null, 'Laid side by side, the three make a ring, and the ring\'s middle is a place in the deep desert where nothing stands at all. Old Gunnhild in Rytingborg knows the desert\'s stories.']],
    reward: { xp: 120000 } },
  { id: 'gunnhildtale', ch: 'Chapter 9: The Eye in the Sand', title: 'What Sleeps in the Desert', kind: 'talk', npc: 'gunnhild', goal: 'Show the rubbings to Old Gunnhild in Rytingborg',
    say: (flags, prog, q) => [['gunnhild', 'A ring with nothing in the middle? Oh, there is something in the middle, dear. There is a face under that sand, older than my grandmother\'s grandmother.'],
      ['gunnhild', q?.done?.includes('sphinx6') ? 'But you know that. You have seen it yourself, with the eye set in it. Then you know what it keeps.' : 'A stone face as big as a hill, with eyes that never open. The stories say it keeps something. They never say what.'],
      ['gunnhild', 'Someone is cutting a ring round it. Not to wake the face, I think. To wake what it keeps. Go and tell your Archmage.']],
    reward: { xp: 60000 } },
  { id: 'prisons', ch: 'Chapter 9: The Eye in the Sand', title: 'The Eight Prisons', kind: 'talk', npc: 'vigdis', goal: 'Bring Gunnhild\'s tale to Archmage Vigdis (Galdrheim)',
    say: [['vigdis', 'Eight jotnar were sung into the stone, Brynja\'s books say, and they never say where. Now we know where one of them is: under a stone face in the desert, and the face is its keeper.'],
      ['vigdis', 'The rune-cutter is not waking the Fire Giant alone. They are loosening every prison, one ring at a time.'],
      ['vigdis', 'And here is Hrafn, white as chalk. He has not slept.'],
      ['hrafn', 'You look up now, I hope. The Wolf\'s Eye flared the night your runes were cut, and it has not gone back. Its light falls north and east, on the old woods past Veidheim.'],
      ['hrafn', 'Something there is wrong in a way the stars notice. Ask in Veidheim: Old Ingrid by the well has kept their seeds for sixty years.']],
    reward: { xp: 180000, perz: 20000 } },

  // ---------- Chapter 10: the gnawed roots (about Base 60-66) ----------
  { id: 'rotroots', ch: 'Chapter 10: The Gnawed Roots', title: 'Rot That Writes', kind: 'talk', npc: 'ingrid', goal: 'Ask Old Ingrid the Seedkeeper (by Veidheim\'s well) about the old woods',
    say: [['ingrid', 'The Old Forest is sick, dear. The roots are rotting, and the rot does not spread like rot. It runs up the trunks backwards, in lines. Like writing.'],
      ['ingrid', 'And the Treants have gone mad with it. They tear at anything that comes near the forest\'s heart. Stand there, and they will come for you. Someone must, if we are to see what the rot has written.']],
    reward: { xp: 60000 } },
  { id: 'rotheart', ch: 'Chapter 10: The Gnawed Roots', title: 'The Forest\'s Heart', kind: 'survive', map: 'oldwood', at: { x: 36, z: 22 }, secs: 60, color: '#9ad050',
    heralds: { early: ['treant', 'treant'], late: ['treant', 'treant', 'willow'], after: 30 }, every: 12, most: 5,
    startText: 'The rot in the roots glows a sick green as you step in among them, and every Treant in the Old Forest turns towards you, creaking. Hold the forest\'s heart!',
    breakText: 'You left the forest\'s heart, and the maddened Treants scatter. Go back and stand among the rotten roots again.',
    goal: 'Stand at the Old Forest\'s heart, where the rot is thickest, and hold off the maddened Treants (north of Veidheim)',
    hint: 'Waves of Treants for 60 seconds. The Ancient Treant roams this forest too: keep clear of it.',
    say: [[null, 'The last Treant falls still, and the green glow sinks back into the roots. Now you can read the rot: backward runes, the same hand as in the desert.'],
      [null, 'They lead out to three old standing stones in the forest, rotted black. Find them.']],
    reward: { xp: 150000, perz: 15000, items: { potion3: 10 } } },
  { id: 'rotstones', ch: 'Chapter 10: The Gnawed Roots', title: 'The Rotted Stones', kind: 'search', thing: 'Rotted runestone', verb: 'Runestone read',
    spots: [{ map: 'oldwood', x: 40, z: 34 }, { map: 'oldwood', x: 14, z: 32 }, { map: 'oldwood', x: 46, z: 48 }],
    goal: 'Find the three rotted runestones in the Old Forest',
    hint: 'They glint gold among the trees. Walk over each to read it.',
    say: [[null, 'Each stone is rotted black, its runes cut backwards and filled with something that smells of old blood. Around each, the roots are gnawed, as if by teeth far bigger than any wolf\'s.'],
      [null, 'Bjarki keeps the wolves of Veidheim. If anything in these woods has teeth like that, his beasts will know it.']],
    reward: { xp: 150000 } },
  { id: 'grimr', ch: 'Chapter 10: The Gnawed Roots', title: 'What the Wolf Knows', kind: 'talk', npc: 'bjarki', goal: 'Ask Bjarki the Beastmaster in Veidheim about the gnawed roots',
    say: [['bjarki', 'Gnawed? Aye. Grimr will not go north of the forest any more. He sits at the edge and shakes, and he has stood up to a bear.'],
      ['bjarki', 'A beast knows when something bigger is awake. There is something under the north, hero. Awake, and fed, and growing. I do not want to know its name.']],
    reward: { xp: 80000 } },
  { id: 'threewells', ch: 'Chapter 10: The Gnawed Roots', title: 'Three Wells', kind: 'talk', npc: 'vigdis', goal: 'Bring word of the gnawed roots to Archmage Vigdis (Galdrheim)',
    say: [['vigdis', 'The oldest songs say the roots of the world drink from three wells. I always took it for a skald\'s way of talking. I was wrong.'],
      ['vigdis', 'One of the three is our own rune-well, here in Galdrheim. Every rune we cut drinks from it. If the roots are rotting backwards, someone is poisoning the song at its spring.'],
      ['vigdis', 'Rest tonight. Tomorrow we look at the well.'],
      [null, 'Before dawn, Brynja the Lorekeeper is at your door, a lamp in her hand.'],
      ['brynja', 'Quietly, please, even now. The rune-well\'s crystal has sunk in the night. Every rune in the city is dimming, and my books are going blank at the edges.'],
      ['brynja', 'The well\'s spring rises outside our south gate, in Fen Shore, under the old stones by the road. Vigdis is going down to raise the crystal from there, and things are pouring out of the water. She needs someone to hold the spring while she sings.']],
    reward: { xp: 280000, perz: 25000 } },

  // ---------- Chapter 11: the hand that cuts backwards (about Base 66-72) ----------
  { id: 'runespring', ch: 'Chapter 11: The Hand That Cuts Backwards', title: 'The Rune-Spring', kind: 'survive', map: 'fen', at: { x: 32, z: 14 }, secs: 60, color: '#b48aff',
    heralds: { early: ['shadeWisp', 'shadeWisp'], late: ['shadeWisp', 'shadeWisp', 'wisp'], after: 25 }, every: 10, most: 5,
    startText: 'Vigdis\'s song rises from the spring, and the water goes black. Dark Wisps pour out of it! Hold the spring until the crystal is raised!',
    breakText: 'You left the spring, and Vigdis\'s song falters. Go back to the stones by the road and hold it again.',
    goal: 'Hold the rune-spring by the road in Fen Shore (just south of Galdrheim\'s gate) while Vigdis raises the crystal',
    hint: 'Waves of Dark Wisps for 60 seconds. Stay by the spring.',
    say: [[null, 'The crystal rises shining out of the spring, and Galdrheim\'s runes flare back to life all at once.'],
      ['vigdis', 'Someone cut backward runes into the well itself, from inside the city. Only a runecarver could reach it. Go to Black Wood and look at the Watchers. If I am right, I do not want to be.']],
    reward: { xp: 250000, perz: 25000, items: { potion3: 10 } } },
  { id: 'watchers', ch: 'Chapter 11: The Hand That Cuts Backwards', title: 'The Watchers', kind: 'search', thing: 'Watcher stone', verb: 'Watcher looked at',
    spots: [{ map: 'deep', x: 18, z: 18 }, { map: 'deep', x: 46, z: 24 }, { map: 'deep', x: 26, z: 46 }],
    goal: 'Look at the three Watcher stones in Black Wood (west of Galdrheim\'s woods)',
    hint: 'They glint among the black trees. Walk over each.',
    say: [[null, 'Two of the Watchers glow, cold and singing. The third has been recarved: every rune turned backwards, fresh chips of stone in the moss round its foot.'],
      [null, 'And in the moss, a chisel. A runecarver\'s chisel, its handle worn smooth by one hand over many years. You have seen it before, in Galdrheim, by the Watchers\' rubbings.']],
    reward: { xp: 250000 } },
  { id: 'unmasked', ch: 'Chapter 11: The Hand That Cuts Backwards', title: 'The Hand That Cuts Backwards', kind: 'talk', npc: 'torvald', goal: 'Take the chisel to Torvald the Runecarver (Galdrheim)',
    say: [['torvald', 'My chisel. I wondered where I had dropped it.', { shake: 0.2 }],
      ['torvald', 'Yes. I taught the goblins. I cut the desert ring, and rotted the roots, and sank the crystal. I sent you after the goblins\' runes myself, to watch you look the wrong way.'],
      ['torvald', 'Brynja\'s books say it best. The jotnar did not hate us. They simply burnt. And we caged them for it, under the stone, for being what they are.'],
      ['torvald', 'I will not hold that cage shut any longer. My last ring is already cut, on Ember Hill, round the one who sleeps lightest. Come, if you like. You will be too late.'],
      [null, 'He smashes a rune-stone at his feet. Fire bursts up between you, and when it falls, Torvald is gone.', { shake: 0.45, sound: 'night' }]],
    reward: { xp: 250000, perz: 30000 } },
  { id: 'seeress2', ch: 'Chapter 11: The Hand That Cuts Backwards', title: 'The Seeress\'s Song', kind: 'talk', npc: 'saeunn', goal: 'Tell Saeunn the Seeress in Steinborg',
    say: [['saeunn', 'Torvald. I saw it in the runes a month ago: a carver\'s hand turned against itself. I did not want to believe it. I have known him thirty years.'],
      ['saeunn', 'The fire-ring at Eldrun is the heart of every ring in Aria. If it burns at full while we sing, his last ring cannot hold. I will sing with Vigdis.'],
      ['saeunn', 'Take this to Halvard: my rune-lantern. Its flame is the first fire of the ring, kept here since the settlers came. Set it in the fire-ring, and it will burn as it did then.']],
    reward: { xp: 150000 } },
  { id: 'lantern', ch: 'Chapter 11: The Hand That Cuts Backwards', title: 'The First Flame', kind: 'talk', npc: 'bram', goal: 'Carry Saeunn\'s rune-lantern to Elder Halvard at Eldrun Camp',
    say: [['bram', 'The first flame... I never thought to see it. Here, into the ring with it.', { sound: 'heart' }],
      [null, 'The fire-ring blazes up white and gold, higher than it has burnt in a hundred years. The ground of Ember Hill answers with a groan you feel in your teeth.', { shake: 0.5 }],
      ['bram', 'He is up there, then: Torvald, and his ring. Go to Ember Hill. Vigdis and Saeunn will sing from here, through the fire. Their song will find you there.']],
    reward: { xp: 200000, perz: 30000 } },

  // ---------- Chapter 12: the last fire-ring (about Base 72-75) ----------
  { id: 'backring', ch: 'Chapter 12: The Last Fire-Ring', title: 'The Backward Ring', kind: 'visit', map: 'ridge', goal: 'Go to Ember Hill, through Dark Dale',
    say: [[null, 'Ember Hill is burning. A ring of four great fires blazes round the Giant\'s sleeping place, their runes cut backwards, and the ground between them splits and glows.', { shake: 0.4 }],
      [null, 'The Giant\'s heralds dance round the fires, feeding them. Break the ring: beat its keepers until the four fires gutter out.']],
    reward: { xp: 150000 } },
  { id: 'ringfires', ch: 'Chapter 12: The Last Fire-Ring', title: 'Four Fires', kind: 'kill', mobs: ['beetle', 'wisp'], n: 25, map: 'ridge', goal: 'Defeat 25 of the Giant\'s heralds on Ember Hill (Beetles and Wisps) to break the four fires',
    hint: 'Beetles and Wisps all over Ember Hill. Keep away from the Fire Giant if he roams near: this is not his fight.',
    say: [[null, 'One by one the four fires gutter and die. But the ground does not close. In the middle of the ring, the hill heaves upward, and something vast and red begins to rise.', { shake: 0.6, sound: 'night' }],
      [null, 'Vigdis\'s voice, from very far away: "Get into the rune circle on the hill road! We are singing. Hold it, whatever falls!"']],
    reward: { xp: 300000, perz: 30000, items: { potion3: 20 } } },
  { id: 'lastring', ch: 'Chapter 12: The Last Fire-Ring', title: 'The Last Fire-Ring', kind: 'survive', map: 'ridge', at: { x: 32, z: 24 }, secs: 120, color: '#ff9a4a',
    heralds: { early: ['beetle', 'beetle', 'wisp'], late: ['beetle', 'beetle', 'wisp', 'wisp'], after: 60 }, every: 12, most: 6,
    meteors: { every: 8, n: 3, r: 1.5, wind: 1.3, hp: 0.12 },
    startText: 'The song rises out of the circle, and the Fire Giant half-wakes, vast as the hill itself. He cannot reach you through the song, but his fire can: Meteor Rain! Step out of the red circles, and hold the ring!',
    breakText: 'You left the rune circle, and the song breaks. The Giant sinks back to a half-sleep... for now. Go back to the circle and begin again.',
    goal: 'Hold the rune circle on Ember Hill\'s road for 120 seconds while the song is sung: the Giant\'s heralds come, and his Meteor Rain falls',
    hint: 'Waves of heralds, and every few seconds red circles fall round you: step out of them. The Giant himself cannot be fought here. Bring potions.',
    say: [[null, 'The song swells into one great note, and the Giant\'s fire bends to it. Slowly, slowly, the vast red shape sinks back into the hill, deeper than ever before.', { shake: 0.7, sound: 'heart' }],
      [null, 'Where Torvald\'s ring stood, the fire is ash. Caught in the fire he lit, the runecarver is gone. Something glints in the ash by the circle.']],
    reward: { xp: 600000, perz: 50000 } },
  { id: 'ashes', ch: 'Chapter 12: The Last Fire-Ring', title: 'In the Ash', kind: 'search', thing: 'Glint in the ash', verb: 'Found',
    spots: [{ map: 'ridge', x: 34, z: 26 }],
    goal: 'Look at what glints in the ash beside the rune circle (Ember Hill)',
    say: [[null, 'Torvald\'s chisel, cooled in the ash. The only thing of his the fire left.'],
      [null, 'Elder Halvard will want to know it is over.']],
    reward: { xp: 100000 } },
  { id: 'goldring', ch: 'Chapter 12: The Last Fire-Ring', title: 'The Ring Burns Gold', kind: 'talk', npc: 'bram', goal: 'Return to Elder Halvard at Eldrun Camp',
    say: [['bram', 'Look at it. The ring burns gold, as it did in the songs. He sleeps, and sleeps deep. You did that.'],
      ['bram', 'Torvald\'s chisel... Keep it. He cut his last runes with it, and they failed. Cut better ones.'],
      ['bram', 'The other jotnar still lie in their stone. With every ring whole again, and burning gold, they will sleep a long, long time.'],
      ['bram', 'Rest now, hero of Eldrun. Steinborg, Galdrheim, Veidheim, Rytingborg: every hearth in Aria is warm tonight because of you.'],
      [null, 'The Last Fire-Ring: the end of the third saga. The MVPs still wait across Aria, the Fire Giant among them, for anyone strong enough to end it for good.']],
    reward: { xp: 400000, perz: 100000, items: { torvald_chisel: 1, hard_ore: 5, armor_ore: 5 } } },
];

// the story pays half the perz written above (the owner's call, November 2026: selling drops is the main income)
export const STORY_PERZ = 0.5;
for (const st of STORY) if (st.reward?.perz) st.reward.perz = Math.max(50, Math.round(st.reward.perz * STORY_PERZ / 50) * 50);

// the steps as they were before the Fire Giant left the story, and where those steps went
const OLD_ORDER = ['wake', 'stats', 'slimes', 'training', 'hotbar', 'report', 'north', 'captain', 'seeress', 'trade', 'path', 'heralds', 'matron', 'roots', 'emberhill', 'ready', 'lastfire', 'jarl', 'rekindled'];
// ledger: the Keepers' step moved from Chapter 5 to Chapter 1 ('keepers'); a hero who was on it goes on to the carter
// matron, furnace: the story's boss fights (the Giant Sprout, the Giant Beetle) became hunts of
// their kin, so no story step needs a boss
// finn, hunterkeeper, trade, trainee: Chapter 1 made shorter (Finn's lines went to 'eastward', the trade lesson to
// 'sigridword'); a hero who was on one of the last three goes on to choosing a path
// saltroad, wakingfire, wolfseye, sunkwell: talks folded into the step before them (the pacing pass, November 2026)
const RENAMED = { saltroad: 'carter', wakingfire: 'coaltrain', wolfseye: 'rotroots', sunkwell: 'runespring', finn: 'marshroad', hunterkeeper: 'paths', trade: 'paths', trainee: 'paths', ready: 'runesong', lastfire: 'runesong', jarl: 'rekindled', ledger: 'carter', matron: 'redsprouts', furnace: 'coalfeast' };

// directions: which way to walk from one map to reach another, through which portal
export function route(from, to) {
  if (from === to) return null;
  const prev = { [from]: null }, queue = [from];
  while (queue.length) {
    const m = queue.shift();
    for (const p of MAPS[m].portals) {
      if (p.to in prev) continue;
      prev[p.to] = { m, p };
      if (p.to === to) {
        let step = prev[to];
        while (step.m !== from) step = prev[step.m];
        return step.p;
      }
      queue.push(p.to);
    }
  }
  return null;
}
export function compass(p) {
  const dx = p.x - 32, dz = p.z - 32;
  return Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'east' : 'west') : (dz > 0 ? 'south' : 'north');
}

// a Trainee who reaches this Job Level after the Seeress is called home to choose a path at once
export const CALL_JOB = 9;
export const CALL_HOME = [[null, 'A runner from Eldrun finds you on the road, out of breath. "Elder Halvard sends for you! He says you have grown enough: it is time you chose a path."'],
  [null, 'Go home to Eldrun Camp and talk to Halvard by the fire. (Whatever you left undone on the way can wait: the job trials want Trainee Job 10 and Basic Training 9.)']];

export class Story {
  constructor() {
    this.i = 0;        // index of the current step
    this.count = 0;    // kills towards a kill step
    this.flags = {};   // things that happened: sold, intro
  }

  // (a step's goal and map may depend on the flags, the path picked: resolved here)
  get step() {
    const s = STORY[this.i];
    if (!s || (typeof s.goal !== 'function' && typeof s.map !== 'function')) return s || null;
    return { ...s, goal: typeof s.goal === 'function' ? s.goal(this.flags) : s.goal, map: typeof s.map === 'function' ? s.map(this.flags) : s.map };
  }
  get done() { return this.i >= STORY.length; }

  // where the current step happens (a search: where the next thing still to be found is)
  map(s = this.step) {
    if (!s) return null;
    if (s.kind === 'talk') return NPCS[s.npc].map || 'camp';
    if (s.kind === 'search') return this.toFind(s)[0]?.map || null;
    return s.map || null;
  }
  // a search step's spots still to be found, and what was found (flags.found_<step>: their indices)
  found(s = this.step) { return this.flags[`found_${s?.id}`] || []; }
  toFind(s = this.step) { const f = this.found(s); return (s?.spots || []).filter((_, i) => !f.includes(i)); }
  // the hero stands at (x, z) on a map: the spot just found, if any
  onSearch(map, x, z) {
    const s = this.step;
    if (s?.kind !== 'search') return null;
    const f = this.found(s), i = s.spots.findIndex((p, k) => !f.includes(k) && p.map === map && Math.hypot(p.x - x, p.z - z) < 1.6);
    if (i < 0) return null;
    this.flags[`found_${s.id}`] = [...f, i];
    return { spot: s.spots[i], n: f.length + 1, of: s.spots.length };
  }

  // the tracker's line on where to go: "Head north to Moss Field"
  directions(here, prog) {
    const s = this.step, where = this.map(), hint = typeof s?.hint === 'function' ? s.hint(prog, this.flags) : s?.hint || '';
    if (!s || !where) return hint;
    if (where === here) return s.kind === 'talk' ? `${NPCS[s.npc].name} is on this map` : hint;
    const p = route(here, where);
    return p ? `Head ${compass(p)} to ${ZONE_NAMES[p.to]}${p.to !== where ? `, on to ${ZONE_NAMES[where]}` : ''}` : '';
  }

  progress() {
    const s = this.step;
    if (s?.kind === 'survive') return this.count ? ` (${Math.min(this.count, s.secs)}/${s.secs} s)` : '';
    if (s?.kind === 'search') return ` (${this.found(s).length}/${s.spots.length})`;
    return s?.kind === 'kill' ? ` (${Math.min(this.count, s.n)}/${s.n})` : '';
  }

  // talking to someone completes a talk step for them
  talkStep(npc) { return this.step?.kind === 'talk' && this.step.npc === npc ? this.step : null; }

  onKill(type) { const s = this.step; if (s?.kind === 'kill' && (s.mobs || [s.mob]).includes(type)) this.count++; }
  onZone(zone) { if (this.step?.kind === 'visit' && this.step.map === zone) this.flags.visit = zone; }
  flag(name) { this.flags[name] = true; }

  // is the current step done? state: { prog, hotbar, skillLv }
  met(state) {
    const s = this.step;
    if (!s) return false;
    switch (s.kind) {
      case 'kill': return this.count >= s.n;
      case 'visit': return this.flags.visit === s.map;
      case 'survive': return !!this.flags[s.id];
      case 'raid': return !!this.flags[s.id];
      case 'search': return this.found(s).length >= s.spots.length;
      case 'stat': return Object.values(state.prog.stats).reduce((a, b) => a + b, 0) > 6;
      case 'equip': return Object.values(state.inv?.gear || {}).some((k) => k && String(k).startsWith(s.item));
      case 'accept': return Object.keys(state.quests?.active || {}).length > 0 || (state.quests?.done.length || 0) > 0;
      case 'window': return !!this.flags[`opened_${s.window}`];
      case 'skill': return state.skillLv(state.prog, s.skill) >= s.lv;
      case 'hotbar': return state.hotbar.has('item', s.item);
      case 'sell': return !!this.flags.sold;
      case 'job': return state.prog.job !== 'novice';
      case 'job2': return JOBS[state.prog.job]?.tier === 2;
      case 'keeper': return s.own ? !!state.keepers?.has(s.npc) : (state.keepers?.size || 0) >= 2; // (own: that Keeper's ledger)
      case 'level': return state.prog.baseLv >= s.lv;
      default: return false;
    }
  }

  // a Trainee at CALL_JOB between the Seeress and the choosing is called home to it: true when that
  // just happened (the steps between are left undone)
  callHome(prog) {
    const seer = STORY.findIndex((s) => s.id === 'seeress'), paths = STORY.findIndex((s) => s.id === 'paths');
    if (prog.job !== 'novice' || prog.jobLv < CALL_JOB || this.i <= seer || this.i >= paths) return false;
    this.i = paths;
    this.count = 0;
    delete this.flags.visit;
    delete this.flags.sold;
    return true;
  }

  advance() {
    const s = this.step;
    this.i++;
    this.count = 0;
    delete this.flags.visit;
    delete this.flags.sold;
    return s;
  }

  // a finished story saves its last step: when chapters are added, the hero picks up after it
  toJSON() { return { i: this.i, id: this.step?.id || 'done', last: STORY.at(-1).id, count: this.count, flags: this.flags }; }
  load(d) {
    if (!d) return false;
    // the step is saved by id; older saves only kept its place in the old order of steps
    const id = d.id || OLD_ORDER[d.i | 0] || 'done';
    const at = STORY.findIndex((s) => s.id === (RENAMED[id] || id));
    const last = STORY.findIndex((s) => s.id === (d.last || 'rekindled'));
    this.i = id === 'done' ? (last < 0 ? STORY.length : last + 1) : at < 0 ? STORY.length : at;
    this.count = Math.max(0, d.count | 0);
    this.flags = { ...(d.flags || {}) };
    return true;
  }
  // a save from before the story: skip the tutorial for anyone past it
  catchUp(prog) {
    if (prog.baseLv >= 5) this.i = STORY.findIndex((s) => s.id === 'report');
    this.flags.intro = true;
  }
}
