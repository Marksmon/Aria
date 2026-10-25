// The main story, "The Last Fire-Ring": one chain of steps that runs beside the people's own
// quests. The first steps are the tutorial; later ones lead from map to map, and every step says
// where to go next (the tracker names the map and the portal, the minimap rings it).
//
// The tale: long ago the fire-jotnar slept under the hills of Aria, and the first settlers lit a
// ring of fires to keep them dreaming. Their camp was Eldrun, the fire-ring. Now the fires burn low,
// the ground of Glodberg shakes, and the Ember Jarl is waking.
//
// Step kinds:
//   talk  - talk to someone (npc); their lines play as the step completes
//   kill  - defeat n of a monster (counted from when the step starts)
//   visit - set foot on a map
//   stat  - raise any stat once            skill - learn a skill (skill, lv)
//   hotbar - put an item or skill on the hotbar   sell - sell something in a shop
//   job   - change job                     level - reach a Base Level (lv)
//   job2  - take a second job              keeper - sign a second Keeper's ledger
// kill steps may name one monster (mob) or several (mobs: any of them counts).
// say: [[speaker npc id, or null for the narrator, line], ...] shown when the step completes.
// map: where it happens, for the directions (talk steps use the speaker's map).
import { NPCS } from './quests.js';
import { MAPS, ZONE_NAMES } from './world.js';
import { JOBS } from './progress.js';
import { skillLv } from './skills.js';

export const INTRO = [
  [null, 'Long ago, the fire-jotnar slept beneath the hills of Aria. The first settlers lit a ring of fires around their camp to keep them dreaming, and named it Eldrun: the fire-ring.'],
  [null, 'The fires have burnt low. The ground of Glodberg trembles, monsters roam the fields, and strange lights drift through the night.'],
  [null, 'You crossed the mountains with a practice sword and a head full of songs. The old Elder of Eldrun found you asleep beside the camp\'s last fire...'],
  ['bram', 'Awake at last! Come and talk to me, young one. Tap me to walk over.'],
];

export const STORY = [
  // ---------- Prologue: the tutorial ----------
  { id: 'wake', ch: 'Prologue', title: 'Awake by the Fire', kind: 'talk', npc: 'bram', goal: 'Talk to Elder Halvard by the campfire',
    say: [['bram', 'Welcome to Eldrun, the last fire-ring of Aria. If you mean to stay, you must learn to stand on your own two feet.'],
      ['bram', 'First, know your strength. Open the Status window (the button under your HP), place points with ▲ and press Confirm to lock them in. POW for a strong arm, KNL for a sharp mind.']],
    reward: { xp: 4, items: { potion: 3 } } },
  { id: 'stats', ch: 'Prologue', title: 'Know Your Strength', kind: 'stat', goal: 'Open the Status window, place a point with ▲ and press Confirm',
    say: [['bram', 'Good. Now, the slimes have been at our stores again. Go through the north portal to Mosvangr and chase off three Slimes. Tap a monster to fight it, and tap what it drops to pick it up.']],
    reward: { xp: 4 } },
  { id: 'slimes', ch: 'Prologue', title: 'Into Mosvangr', kind: 'kill', mob: 'slime', n: 3, map: 'grove', goal: 'Defeat 3 Slimes in Mosvangr (north portal)',
    say: [[null, 'Your Job Level rises with every fight, and each Job Level brings a skill point.'],
      ['bram', 'Open the Skills window and raise Basic Training with ▲. Every Trainee starts there.']],
    reward: { xp: 6 } },
  { id: 'training', ch: 'Prologue', title: 'Basic Training', kind: 'skill', skill: 'basics', lv: 1, goal: 'Raise Basic Training in the Skills window',
    say: [['bram', 'One more thing. Open your Items window and drag a Red Potion onto the hotbar at the bottom. Then one tap drinks it, even in the middle of a fight.']],
    reward: { xp: 4 } },
  { id: 'hotbar', ch: 'Prologue', title: 'Ready at Hand', kind: 'hotbar', item: 'potion', goal: 'Drag a Red Potion onto the hotbar',
    say: [[null, 'Skills go on the hotbar the same way, from the Skills window.']],
    reward: { xp: 4 } },
  { id: 'report', ch: 'Prologue', title: 'The Elder\'s Errand', kind: 'talk', npc: 'bram', goal: 'Return to Elder Halvard at camp',
    say: [['bram', 'You learn quickly. Listen, then: the fire-ring cannot hold much longer. Each night the flames are lower, and the ground of Glodberg shakes.'],
      ['bram', 'North past Mosvangr stands Steinborg, the stone-fort. Take word to Captain Ulfr of the Watch that Eldrun\'s fires are failing. He will know what it means.'],
      ['bram', 'And whenever you have a quest of your own to finish, look for the ! over people\'s heads. There is always someone who needs help.']],
    reward: { xp: 10, perz: 100 } },

  // ---------- Chapter 1: the stone-fort ----------
  { id: 'north', ch: 'Chapter 1: The Stone-Fort', title: 'The Road North', kind: 'visit', map: 'city', goal: 'Travel north through Mosvangr to Steinborg',
    say: [[null, 'Steinborg: stone walls, a busy market square and the smell of the forge. The Watch house stands by the south gate.']],
    reward: { xp: 40, perz: 200 } },
  { id: 'captain', ch: 'Chapter 1: The Stone-Fort', title: 'Word for the Captain', kind: 'talk', npc: 'ulfr', goal: 'Tell Captain Ulfr (by the south gate) about the fires',
    say: [['ulfr', 'Eldrun\'s fires, failing? ... Then the old tales are more than tales.'],
      ['ulfr', 'Saeunn the Seeress has been seeing fire in her runes for a month. Her tower is in the north-east of the city. Go to her. I will double the watch on the south road.'],
      ['ulfr', 'But first, sign Keeper Bera\'s ledger by the west houses. A Keeper mends you, keeps your things, saves your place, and sends you to any other Keeper you have signed. You will walk these roads a great deal.']],
    reward: { xp: 40 } },
  // the Keepers, taught early: storage, healing, a save point, and the Keepers' road between towns
  { id: 'keepers', ch: 'Chapter 1: The Stone-Fort', title: 'The Keepers\' Ledger', kind: 'keeper', map: 'city', npc: 'keeper_city', goal: 'Sign Keeper Bera\'s ledger (by the west houses of Steinborg)',
    hint: 'Talk to Keeper Bera and choose Sign the ledger. Keeper Tova at the camp already knows you.',
    say: [['keeper_city', 'There: Steinborg remembers you now. Tap me whenever you need me. Heal me mends you. Storage keeps what your bag cannot carry. Save here makes this the place you wake after a fall.'],
      ['keeper_city', 'And Teleport takes you to any other Keeper whose ledger you have signed, for a fare: Tova at your camp already, and one waits in Galdrheim too. Now go on to the Seeress.']],
    reward: { xp: 40, perz: 300 } },
  { id: 'seeress', ch: 'Chapter 1: The Stone-Fort', title: 'The Seeress', kind: 'talk', npc: 'saeunn', goal: 'Find Saeunn the Seeress at her tower (north-east of the city)',
    say: [['saeunn', 'So. You are the one the runes showed me: a stranger by a dying fire.'],
      ['saeunn', 'Beneath Glodberg sleeps the Fire Giant, the last of the fire-jotnar. The fire-ring kept him dreaming. When the ring goes out, he wakes, and all of Aria burns.'],
      ['saeunn', 'You cannot face him as you are. Train. Choose a path: the blade, with Captain Ulfr, or the runes, in Galdrheim north of Fenstrand, where Archmage Vigdis taught me. Hild in the square will buy what you find; Gunnar forges gear.']],
    reward: { xp: 60 } },
  { id: 'trade', ch: 'Chapter 1: The Stone-Fort', title: 'Coin for the Road', kind: 'sell', goal: 'Sell something to Hild the Trader (or Gunnar)',
    say: [[null, 'Perz is the coin of Aria. Monsters don\'t carry any: you earn it by selling what they drop, and from quests.']],
    reward: { xp: 40, perz: 150 } },

  // ---------- Chapter 2: the blade or the rune ----------
  { id: 'path', ch: 'Chapter 2: Blade or Rune', title: 'Choose Your Path', kind: 'job', goal: 'Reach Trainee Job 10 with Basic Training 9, then pass a job trial: Captain Ulfr in Steinborg (Blader) or Archmage Vigdis in Galdrheim, north of Fenstrand (Sorcerer)',
    // a hint may depend on the hero: here, whether the trials are open yet
    hint: (prog) => (prog && prog.jobLv >= 10 && skillLv(prog, 'basics') >= 9
      ? "You're ready: take a trial with Captain Ulfr (Steinborg) or Archmage Vigdis (Galdrheim)."
      : 'Fight in Mosvangr, Fenstrand or Myrkdal to gain Job Levels, and raise Basic Training to 9.'),
    say: [[null, 'The path is chosen. Your new skills are waiting in the Skills window.']],
    reward: { xp: 500, perz: 300 } },

  // ---------- Chapter 3: embers in the wilds ----------
  { id: 'heralds', ch: 'Chapter 3: Embers in the Wilds', title: 'The Heralds', kind: 'talk', npc: 'saeunn', goal: 'Return to Saeunn the Seeress',
    say: [['saeunn', 'The Giant sends his heralds ahead of him: beasts swollen with his heat. In Birkilund, east of the city, a Giant Sprout has grown huge on it.'],
      ['saeunn', 'Cut it down. Its roots drink from Glodberg; while it lives, it feeds him.']],
    reward: { xp: 400 } },
  { id: 'matron', ch: 'Chapter 3: Embers in the Wilds', title: 'The Giant Sprout', kind: 'kill', mob: 'matron', n: 1, map: 'birch', goal: 'Defeat the Giant Sprout in Birkilund (east gate)',
    hint: 'A level 25 mini-boss, and a hard one: train to Base Level 28 or so first, bring plenty of potions, and step out of reach when it rears up to stomp.',
    say: [[null, 'The Giant Sprout crumbles into ash and thorns. Deep in its roots, something glows like a coal.']],
    reward: { xp: 5000, perz: 1500 } },
  { id: 'roots', ch: 'Chapter 3: Embers in the Wilds', title: 'What the Roots Knew', kind: 'talk', npc: 'saeunn', goal: 'Tell Saeunn what you found',
    say: [['saeunn', 'A coal in the roots... The Giant is waking faster than I feared.'],
      ['saeunn', 'Go south through Myrkdal and look upon Glodberg with your own eyes. But do not wake him before you are ready.']],
    reward: { xp: 1500 } },
  { id: 'emberhill', ch: 'Chapter 3: Embers in the Wilds', title: 'The Ember-Hill', kind: 'visit', map: 'ridge', goal: 'Travel through Myrkdal to Glodberg',
    say: [[null, 'The hill is warm under your feet. In the south of Glodberg, something vast breathes in its sleep.']],
    reward: { xp: 4000 } },
  // ---------- Chapter 4: the fire-ring ----------
  // (the Fire Giant itself is no part of the story: it waits in Glodberg as an MVP, for the strongest)
  { id: 'runesong', ch: 'Chapter 4: The Fire-Ring', title: 'The Song of the Ring', kind: 'talk', npc: 'vigdis', goal: 'Go to Archmage Vigdis in Galdrheim (north of Fenstrand)',
    say: [['vigdis', 'You have seen him sleeping, then. Good. Most who see the Giant awake do not come back to tell of it.'],
      ['vigdis', 'Hallveig cut the fire-ring\'s runes; I can sing them again. Listen, and carry the song home to Eldrun in your head. It will hold him in his dream for a long while yet.'],
      ['vigdis', 'One day he may wake anyway. If you grow strong enough (I would say Base Level 50, and the best gear in Aria), you could end it for good. That fight is yours to choose.']],
    reward: { xp: 8000, items: { potion3: 10, potion2: 10 } } },
  { id: 'rekindled', ch: 'Chapter 4: The Fire-Ring', title: 'The Fire-Ring Rekindled', kind: 'talk', npc: 'bram', goal: 'Bring the song home to Elder Halvard at camp',
    say: [['bram', 'Sing it, then, there by the fire... Look! It has not burnt this bright since I was a boy.'],
      ['bram', 'The Giant sleeps on under Glodberg, and the ground is quiet. Saeunn says the runes speak of older names beyond the mountains: lands the songs still remember. The road goes on, as roads do.'],
      ['bram', 'Rest now, hero of Eldrun. Aria will need you again.'],
      [null, 'The Last Fire-Ring: the end of the first saga. The Fire Giant still waits in the south of Glodberg, for anyone strong enough to wake him.']],
    reward: { xp: 40000, perz: 20000, items: { glow_charm: 1 } } },

  // ---------- Chapter 5: the salt road (the kobolds of Grjotvangr and Kolgrof) ----------
  { id: 'saltroad', ch: 'Chapter 5: The Salt Road', title: 'Trouble on the Salt Road', kind: 'talk', npc: 'ulfr', goal: 'Captain Ulfr has sent for you (by the south gate of Steinborg)',
    say: [['ulfr', 'There you are. The Giant sleeps, but the valley does not. The salt carts from Saltvik have stopped coming, and the last carter who made it here was half dead.'],
      ['ulfr', 'He swore kobolds did it. Kobolds! They keep to their stone hills and bark at anyone who comes near. They do not rob carts.'],
      ['ulfr', 'Go west through Fenstrand to Saltvik. Hakon the carter is waiting by the south road. Ivar\'s carts or the Keepers will bring you back quickly.']],
    reward: { xp: 5000, perz: 1000 } },
  { id: 'carter', ch: 'Chapter 5: The Salt Road', title: 'The Carter\'s Tale', kind: 'talk', npc: 'hakon', goal: 'Find Hakon the Carter by the south road of Saltvik',
    say: [['hakon', 'Kobolds, I tell you, a dozen of them, out of Grjotvangr with axes and bows. Took my horse and my cart.'],
      ['hakon', 'And here is the strange thing: they left the salt. They took the lamp oil, the pitch, the tinder. Every kobold I ever met runs from a torch. Why would they steal fire?'],
      ['hakon', 'The road goes south into their hills. If you go, go armed.']],
    reward: { xp: 4000 } },
  { id: 'stonefield', ch: 'Chapter 5: The Salt Road', title: 'The Stone-Field', kind: 'kill', mobs: ['koboldWarrior', 'koboldArcher', 'koboldAssassin'], n: 12, map: 'stones', goal: 'Defeat 12 kobolds in Grjotvangr (south of Saltvik)',
    hint: 'Kobolds of level 28 to 33, and every one of them attacks on sight. Base Level 32 or so is a fair start.',
    say: [[null, 'The kobolds fight like cornered dogs. Each pack carries a lump of coal that glows a dull red, warm in the hand though no fire touched it.']],
    reward: { xp: 9000, perz: 2500, items: { potion2: 10 } } },
  { id: 'redcoal', ch: 'Chapter 5: The Salt Road', title: 'Coal Without Fire', kind: 'talk', npc: 'saeunn', goal: 'Show the glowing coal to Saeunn the Seeress (Steinborg)',
    say: [['saeunn', 'Coal that burns without a flame... This is the Giant\'s heat, seeping up through the stone. We sang him back to sleep, but he still breathes, and his breath warms the earth.'],
      ['saeunn', 'Kolgrof, the kobolds\' coal pit south of Grjotvangr, lies right above one of his veins. The kobolds are not raiding for fun. Something drives them.'],
      ['saeunn', 'Go down into Kolgrof and see what it is.']],
    reward: { xp: 5000 } },
  { id: 'coalpit', ch: 'Chapter 5: The Salt Road', title: 'Down into Kolgrof', kind: 'visit', map: 'coalpit', goal: 'Travel south through Grjotvangr to Kolgrof',
    say: [[null, 'Kolgrof glows. Red light seeps from every seam of the quarry, and the air shimmers with heat.'],
      [null, 'By the north road a man in a miner\'s hood waves to you from behind a rock.']],
    reward: { xp: 6000 } },
  { id: 'miner', ch: 'Chapter 5: The Salt Road', title: 'The Escaped Miner', kind: 'talk', npc: 'dag', goal: 'Talk to Dag the Miner by the north road of Kolgrof',
    say: [['dag', 'Quiet! They will hear you. I was a miner here before the kobolds took the pit, and their prisoner after. I got loose three nights ago.'],
      ['dag', 'It is not the kobolds\' doing. Goblins came over the hills from Brennholt last winter, with whips. The Kobold King bowed to them. Now the kobolds dig the red coal day and night, steal fire to light the tunnels, and the goblins cart the coal away east.'],
      ['dag', 'Where to, I could not say. But I heard the word their drivers use for it: the Waking Fire.']],
    reward: { xp: 12000, perz: 4000, items: { hard_ore: 2 } } },

  // ---------- Chapter 6: the goblin war-band ----------
  { id: 'wakingfire', ch: 'Chapter 6: The Goblin War-Band', title: 'The Waking Fire', kind: 'talk', npc: 'ulfr', goal: 'Bring Dag\'s news to Captain Ulfr (Steinborg)',
    say: [['ulfr', 'Goblins with whips, and a Waking Fire. I do not like the sound of either.'],
      ['ulfr', 'Brennholt lies east of Askheid. It was a green wood once; the goblins burnt it bare when they came. If the coal goes east, it goes through Brennholt. Break their coal-train.']],
    reward: { xp: 6000 } },
  { id: 'coaltrain', ch: 'Chapter 6: The Goblin War-Band', title: 'Break the Coal-Train', kind: 'kill', mobs: ['goblinWarrior', 'goblinArcher', 'goblinAssassin'], n: 15, map: 'burnt', goal: 'Defeat 15 goblins in Brennholt (east of Askheid)',
    hint: 'Goblins of level 38 to 44. They hunt in packs, so fight at the edge of a group, not in the middle of it.',
    say: [[null, 'Among the burnt stumps lie split sacks of red coal. A trail of black dust runs north, towards Ormholt, and a second one west, back to Askheid.']],
    reward: { xp: 20000, perz: 6000, items: { potion3: 10 } } },
  { id: 'trails', ch: 'Chapter 6: The Goblin War-Band', title: 'Two Trails', kind: 'talk', npc: 'vigdis', goal: 'Ask Archmage Vigdis in Galdrheim about the coal',
    say: [['vigdis', 'Red coal, the Giant\'s own heat. Burnt, it is only warm. Fed to something alive, it makes that thing a furnace.'],
      ['vigdis', 'The trail to Askheid: the goblins have been feeding the coal to the Giant Beetle there. Every lump it eats, the Giant feels in his sleep. And the trail to Ormholt... I fear that is where the Waking Fire burns.'],
      ['vigdis', 'Neither is a fight for you yet. You must grow beyond your first path first.']],
    reward: { xp: 8000 } },

  // ---------- Chapter 7: the second path ----------
  { id: 'secondpath', ch: 'Chapter 7: The Second Path', title: 'Beyond the First Path', kind: 'job2', goal: 'Take a second job: BladeMaster (Captain Ulfr), Wizard (Archmage Vigdis) or Magic Knight (Sir Eirik, Steinborg)',
    hint: 'A second-job trial opens at Job Level 40. Which trials you may take depends on where your skill points went.',
    say: [[null, 'Your power has taken a new shape. The aura around you is faint, but every monster in Aria can feel it.'],
      ['vigdis', 'Now you are ready. Go to Askheid and put out the Giant Beetle\'s furnace.']],
    reward: { xp: 15000, perz: 10000 } },

  // ---------- Chapter 8: the Waking Fire ----------
  { id: 'furnace', ch: 'Chapter 8: The Waking Fire', title: 'The Living Furnace', kind: 'kill', mob: 'cinderLord', n: 1, map: 'heath', goal: 'Defeat the Giant Beetle in Askheid (east of Glodberg)',
    hint: 'A level 48 mini-boss that calls Fire Beetles to its side. Base Level 50 or so, with water on your side, makes it fair.',
    say: [[null, 'The Giant Beetle crashes down, and the red glow drains out of its shell. Far to the west, Glodberg falls quiet.'],
      [null, 'Only one trail is left: north from Brennholt, into Ormholt.']],
    reward: { xp: 30000, perz: 10000, items: { potion3: 10 } } },
  { id: 'ormholt', ch: 'Chapter 8: The Waking Fire', title: 'The Serpent Wood', kind: 'visit', map: 'serpent', goal: 'Travel north from Brennholt to Ormholt',
    say: [[null, 'Ormholt. In the north clearing, a ring of stones has been raised around a pit of red coal, so like Eldrun\'s fire-ring that it chills you.'],
      [null, 'But these runes are cut backwards. Eldrun\'s ring sings the Giant to sleep. This one is built to wake him.']],
    reward: { xp: 12000 } },
  { id: 'firekeepers', ch: 'Chapter 8: The Waking Fire', title: 'The Fire-Keepers', kind: 'kill', mobs: ['goblinWarrior', 'goblinArcher', 'goblinAssassin'], n: 20, map: 'serpent', goal: 'Defeat 20 goblins in Ormholt, the keepers of the Waking Fire',
    hint: 'Ormholt\'s goblins are the strongest of their kind, and the Goblin King\'s guard. Stay out of his clearing in the north unless you mean to fight him.',
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
      ['bram', 'The kobolds of Kolgrof can lay down their picks, and the salt carts will roll again. Hakon will be glad of his horse.'],
      ['bram', 'But a hand that cuts runes backwards is still out there. Rest while you can, hero of Eldrun.'],
      [null, 'The Waking Fire: the end of the second saga. The Kobold King in Kolgrof and the Goblin King in Ormholt still hold their courts, for anyone strong enough to face them.']],
    reward: { xp: 60000, perz: 50000, items: { hard_ore: 5, armor_ore: 5 } } },
];

// the steps as they were before the Fire Giant left the story, and where those steps went
const OLD_ORDER = ['wake', 'stats', 'slimes', 'training', 'hotbar', 'report', 'north', 'captain', 'seeress', 'trade', 'path', 'heralds', 'matron', 'roots', 'emberhill', 'ready', 'lastfire', 'jarl', 'rekindled'];
// ledger: the Keepers' step moved from Chapter 5 to Chapter 1 ('keepers'); a hero who was on it goes on to the carter
const RENAMED = { ready: 'runesong', lastfire: 'runesong', jarl: 'rekindled', ledger: 'carter' };

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

export class Story {
  constructor() {
    this.i = 0;        // index of the current step
    this.count = 0;    // kills towards a kill step
    this.flags = {};   // things that happened: sold, intro
  }

  get step() { return STORY[this.i] || null; }
  get done() { return this.i >= STORY.length; }

  // where the current step happens
  map(s = this.step) {
    if (!s) return null;
    if (s.kind === 'talk') return NPCS[s.npc].map || 'camp';
    return s.map || null;
  }

  // the tracker's line on where to go: "Head north to Mosvangr"
  directions(here, prog) {
    const s = this.step, where = this.map(), hint = typeof s?.hint === 'function' ? s.hint(prog) : s?.hint || '';
    if (!s || !where) return hint;
    if (where === here) return s.kind === 'talk' ? `${NPCS[s.npc].name} is on this map` : hint;
    const p = route(here, where);
    return p ? `Head ${compass(p)} to ${ZONE_NAMES[p.to]}${p.to !== where ? `, on to ${ZONE_NAMES[where]}` : ''}` : '';
  }

  progress() {
    const s = this.step;
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
      case 'stat': return Object.values(state.prog.stats).reduce((a, b) => a + b, 0) > 6;
      case 'skill': return state.skillLv(state.prog, s.skill) >= s.lv;
      case 'hotbar': return state.hotbar.has('item', s.item);
      case 'sell': return !!this.flags.sold;
      case 'job': return state.prog.job !== 'novice';
      case 'job2': return JOBS[state.prog.job]?.tier === 2;
      case 'keeper': return (state.keepers?.size || 0) >= 2;
      case 'level': return state.prog.baseLv >= s.lv;
      default: return false;
    }
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
