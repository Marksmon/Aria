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
  [null, 'The fires have burnt low. The ground of Ember Hill trembles, monsters roam the fields, and strange lights drift through the night.'],
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
    say: [['bram', 'Good. Now, the bloops have been at our stores again. Go through the north portal to Moss Field and chase off three Bloops. Tap a monster to fight it, and tap what it drops to pick it up.']],
    reward: { xp: 4 } },
  { id: 'slimes', ch: 'Prologue', title: 'Into Moss Field', kind: 'kill', mob: 'slime', n: 3, map: 'grove', goal: 'Defeat 3 Bloops in Moss Field (north portal)',
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
    say: [['bram', 'You learn quickly. Listen, then: the fire-ring cannot hold much longer. Each night the flames are lower, and the ground of Ember Hill shakes.'],
      ['bram', 'North past Moss Field stands Steinborg, the stone-fort. Take word to Captain Ulfr of the Watch that Eldrun\'s fires are failing. He will know what it means.'],
      ['bram', 'And whenever you have a quest of your own to finish, look for the ! over people\'s heads. There is always someone who needs help.']],
    reward: { xp: 10, perz: 100 } },

  // ---------- Chapter 1: the stone-fort ----------
  { id: 'north', ch: 'Chapter 1: The Stone-Fort', title: 'The Road North', kind: 'visit', map: 'city', goal: 'Travel north through Moss Field to Steinborg',
    say: [[null, 'Steinborg: stone walls, a busy market square and the smell of the forge. The Watch house stands by the south gate.']],
    reward: { xp: 40, perz: 200 } },
  { id: 'captain', ch: 'Chapter 1: The Stone-Fort', title: 'Word for the Captain', kind: 'talk', npc: 'ulfr', goal: 'Tell Captain Ulfr (by the south gate) about the fires',
    say: [['ulfr', 'Eldrun\'s fires, failing? ... Then the old tales are more than tales.'],
      ['ulfr', 'Saeunn the Seeress has been seeing fire in her runes for a month. Her tower is in the north-east of the city. Go to her. I will double the watch on the south road.'],
      ['ulfr', 'But first, sign the Keeper\'s ledger by the west houses. A Keeper mends you, keeps your things, saves your place, and sends you to any other Keeper you have signed. You will walk these roads a great deal.']],
    reward: { xp: 40 } },
  // the Keepers, taught early: storage, healing, a save point, and the Keepers' road between towns
  { id: 'keepers', ch: 'Chapter 1: The Stone-Fort', title: 'The Keepers\' Ledger', kind: 'keeper', map: 'city', npc: 'keeper_city', goal: 'Sign the Keeper\'s ledger (by the west houses of Steinborg)',
    hint: 'Talk to the Keeper and choose Sign the ledger. The Keeper at the camp already knows you.',
    say: [['keeper_city', 'There: Steinborg remembers you now. Tap me whenever you need me. Heal me mends you. Storage keeps what your bag cannot carry. Save here makes this the place you wake after a fall.'],
      ['keeper_city', 'And Teleport takes you to any other Keeper whose ledger you have signed, for a fare: the one at your camp already, and one waits in Galdrheim too. Now go on to the Seeress.']],
    reward: { xp: 40, perz: 300 } },
  { id: 'seeress', ch: 'Chapter 1: The Stone-Fort', title: 'The Seeress', kind: 'talk', npc: 'saeunn', goal: 'Find Saeunn the Seeress at her tower (north-east of the city)',
    say: [['saeunn', 'So. You are the one the runes showed me: a stranger by a dying fire.'],
      ['saeunn', 'Beneath Ember Hill sleeps the Fire Giant, the last of the fire-jotnar. The fire-ring kept him dreaming. When the ring goes out, he wakes, and all of Aria burns.'],
      ['saeunn', 'You cannot face him as you are. Train. Choose a path: the blade, with Captain Ulfr, the runes, in Galdrheim north of Fen Shore, where Archmage Vigdis taught me, or the bow, with Huntmaster Sigrid in Veidheim, past Willow Marsh. Hild in the square will buy what you find; Gunnar forges gear.']],
    reward: { xp: 60 } },
  { id: 'trade', ch: 'Chapter 1: The Stone-Fort', title: 'Coin for the Road', kind: 'sell', goal: 'Sell something to Hild the Trader (or Gunnar)',
    say: [[null, 'Perz is the coin of Aria. Monsters don\'t carry any: you earn it by selling what they drop, and from quests.']],
    reward: { xp: 40, perz: 150 } },

  // ---------- Chapter 2: the blade or the rune ----------
  // story EXP (x2 with QUEST_RATE) is paced so each chapter brings a hero to the next one's hinted level:
  // the Giant Sprout at about Base 28, Chapter 5's kobolds at about 32
  { id: 'path', ch: 'Chapter 2: Blade or Rune', title: 'Choose Your Path', kind: 'job', goal: 'Reach Trainee Job 10 with Basic Training 9, then pass a job trial: Captain Ulfr in Steinborg (Blader), Archmage Vigdis in Galdrheim, north of Fen Shore (Sorcerer), or Huntmaster Sigrid in Veidheim, east past Willow Marsh (Archer)',
    // a hint may depend on the hero: here, whether the trials are open yet
    hint: (prog) => (prog && prog.jobLv >= 10 && skillLv(prog, 'basics') >= 9
      ? "You're ready: take a trial with Captain Ulfr (Steinborg), Archmage Vigdis (Galdrheim) or Huntmaster Sigrid (Veidheim)."
      : 'Fight in Moss Field, Fen Shore or Dark Dale to gain Job Levels, and raise Basic Training to 9.'),
    say: [[null, 'The path is chosen. Your new skills are waiting in the Skills window.']],
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
  { id: 'saltroad', ch: 'Chapter 5: The Salt Road', title: 'Trouble on the Salt Road', kind: 'talk', npc: 'ulfr', goal: 'Captain Ulfr has sent for you (by the south gate of Steinborg)',
    say: [['ulfr', 'There you are. The Giant sleeps, but the valley does not. The salt carts from Salt Bay have stopped coming, and the last carter who made it here was half dead.'],
      ['ulfr', 'He swore kobolds did it. Kobolds! They keep to their stone hills and bark at anyone who comes near. They do not rob carts.'],
      ['ulfr', 'Go west through Fen Shore to Salt Bay. Hakon the carter is waiting by the west road. Ivar\'s carts or the Keepers will bring you back quickly.']],
    reward: { xp: 5000, perz: 1000 } },
  { id: 'carter', ch: 'Chapter 5: The Salt Road', title: 'The Carter\'s Tale', kind: 'talk', npc: 'hakon', goal: 'Find Hakon the Carter by the west road of Salt Bay',
    say: [['hakon', 'Kobolds, I tell you, a dozen of them, out of Stone Field with axes and bows. Took my horse and my cart.'],
      ['hakon', 'And here is the strange thing: they left the salt. They took the lamp oil, the pitch, the tinder. Every kobold I ever met runs from a torch. Why would they steal fire?'],
      ['hakon', 'The road goes west, round the bay and into their hills. If you go, go armed.'],
      ['hakon', 'One more thing. The Boatman by the water says the salt could go round by boat, if not for the bloops of Bloop Island. Help him first, and the road will wait.']],
    reward: { xp: 4000 } },
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
      ['dag', 'Where to, I could not say. But I heard the word their drivers use for it: the Waking Fire.']],
    reward: { xp: 12000, perz: 4000, items: { hard_ore: 2 } } },

  // ---------- Chapter 6: the goblin war-band ----------
  { id: 'wakingfire', ch: 'Chapter 6: The Goblin War-Band', title: 'The Waking Fire', kind: 'talk', npc: 'ulfr', goal: 'Bring Dag\'s news to Captain Ulfr (Steinborg)',
    say: [['ulfr', 'Goblins with whips, and a Waking Fire. I do not like the sound of either.'],
      ['ulfr', 'Burnt Wood lies beyond Galdrheim\'s north gate. It was a green wood once; the goblins burnt it bare when they came. If the coal goes north, it goes through Burnt Wood. Break their coal-train.']],
    reward: { xp: 6000 } },
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
  { id: 'secondpath', ch: 'Chapter 7: The Second Path', title: 'Beyond the First Path', kind: 'job2', goal: 'Take a second job: BladeMaster (Captain Ulfr), Wizard (Archmage Vigdis), Magic Knight (Sir Eirik, Steinborg), Windrunner (Huntmaster Sigrid, Veidheim), Moon Ranger (Hrafn the Stargazer, Galdrheim) or Beastmaster (Bjarki, Veidheim)',
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
];

// the steps as they were before the Fire Giant left the story, and where those steps went
const OLD_ORDER = ['wake', 'stats', 'slimes', 'training', 'hotbar', 'report', 'north', 'captain', 'seeress', 'trade', 'path', 'heralds', 'matron', 'roots', 'emberhill', 'ready', 'lastfire', 'jarl', 'rekindled'];
// ledger: the Keepers' step moved from Chapter 5 to Chapter 1 ('keepers'); a hero who was on it goes on to the carter
// matron, furnace: the story's boss fights (the Giant Sprout, the Giant Beetle) became hunts of
// their kin, so no story step needs a boss
const RENAMED = { ready: 'runesong', lastfire: 'runesong', jarl: 'rekindled', ledger: 'carter', matron: 'redsprouts', furnace: 'coalfeast' };

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

  // the tracker's line on where to go: "Head north to Moss Field"
  directions(here, prog) {
    const s = this.step, where = this.map(), hint = typeof s?.hint === 'function' ? s.hint(prog) : s?.hint || '';
    if (!s || !where) return hint;
    if (where === here) return s.kind === 'talk' ? `${NPCS[s.npc].name} is on this map` : hint;
    const p = route(here, where);
    return p ? `Head ${compass(p)} to ${ZONE_NAMES[p.to]}${p.to !== where ? `, on to ${ZONE_NAMES[where]}` : ''}` : '';
  }

  progress() {
    const s = this.step;
    if (s?.kind === 'survive') return this.count ? ` (${Math.min(this.count, s.secs)}/${s.secs} s)` : '';
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
