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
// say: [[speaker npc id, or null for the narrator, line], ...] shown when the step completes.
// map: where it happens, for the directions (talk steps use the speaker's map).
import { NPCS } from './quests.js';
import { MAPS, ZONE_NAMES } from './world.js';

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
    say: [['bram', 'Good. Now, the slimes have been at our stores again. Go through the north portal to Mosvangr and chase off three Green Slimes. Tap a monster to fight it, and tap what it drops to pick it up.']],
    reward: { xp: 4 } },
  { id: 'slimes', ch: 'Prologue', title: 'Into Mosvangr', kind: 'kill', mob: 'slime', n: 3, map: 'grove', goal: 'Defeat 3 Green Slimes in Mosvangr (north portal)',
    say: [[null, 'Your Job Level rises with every fight, and each Job Level brings a skill point.'],
      ['bram', 'Open the Skills window and raise Basic Training with ▲. Every Trainee starts there.']],
    reward: { xp: 6 } },
  { id: 'training', ch: 'Prologue', title: 'Basic Training', kind: 'skill', skill: 'basics', lv: 1, goal: 'Raise Basic Training in the Skills window',
    say: [['bram', 'One more thing. Open your Items window and drag a Healing Draught onto the hotbar at the bottom. Then one tap drinks it, even in the middle of a fight.']],
    reward: { xp: 4 } },
  { id: 'hotbar', ch: 'Prologue', title: 'Ready at Hand', kind: 'hotbar', item: 'potion', goal: 'Drag a Healing Draught onto the hotbar',
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
    reward: { xp: 10 } },
  { id: 'captain', ch: 'Chapter 1: The Stone-Fort', title: 'Word for the Captain', kind: 'talk', npc: 'ulfr', goal: 'Tell Captain Ulfr (by the south gate) about the fires',
    say: [['ulfr', 'Eldrun\'s fires, failing? ... Then the old tales are more than tales.'],
      ['ulfr', 'Saeunn the Seeress has been seeing fire in her runes for a month. Her tower is in the north-east of the city. Go to her. I will double the watch on the south road.']],
    reward: { xp: 12 } },
  { id: 'seeress', ch: 'Chapter 1: The Stone-Fort', title: 'The Seeress', kind: 'talk', npc: 'saeunn', goal: 'Find Saeunn the Seeress at her tower (north-east of the city)',
    say: [['saeunn', 'So. You are the one the runes showed me: a stranger by a dying fire.'],
      ['saeunn', 'Beneath Glodberg sleeps the Ember Jarl, the last of the fire-jotnar. The fire-ring kept him dreaming. When the ring goes out, he wakes, and all of Aria burns.'],
      ['saeunn', 'You cannot face him as you are. Train. Choose a path: the blade, with Captain Ulfr, or the runes, with me. Hild in the square will buy what you find; Gunnar forges gear.']],
    reward: { xp: 15 } },
  { id: 'trade', ch: 'Chapter 1: The Stone-Fort', title: 'Coin for the Road', kind: 'sell', goal: 'Sell something to Hild the Trader (or Gunnar)',
    say: [[null, 'Perz is the coin of Aria. Monsters don\'t carry any: you earn it by selling what they drop, and from quests.']],
    reward: { xp: 10, perz: 150 } },

  // ---------- Chapter 2: the blade or the rune ----------
  { id: 'path', ch: 'Chapter 2: Blade or Rune', title: 'Choose Your Path', kind: 'job', goal: 'Reach Trainee Job 10 with Basic Training 9, then pass a job trial: Captain Ulfr (Blader) or Saeunn (Sorcerer)',
    hint: 'Fight in Mosvangr, Fenstrand or Birkilund to gain Job Levels.',
    say: [[null, 'The path is chosen. Your new skills are waiting in the Skills window.']],
    reward: { xp: 40, perz: 300 } },

  // ---------- Chapter 3: embers in the wilds ----------
  { id: 'heralds', ch: 'Chapter 3: Embers in the Wilds', title: 'The Heralds', kind: 'talk', npc: 'saeunn', goal: 'Return to Saeunn the Seeress',
    say: [['saeunn', 'The Jarl sends his heralds ahead of him: beasts swollen with his heat. In Birkilund, east of the city, a Bramble Matron has grown huge on it.'],
      ['saeunn', 'Cut it down. Its roots drink from Glodberg; while it lives, it feeds him.']],
    reward: { xp: 20 } },
  { id: 'matron', ch: 'Chapter 3: Embers in the Wilds', title: 'The Bramble Matron', kind: 'kill', mob: 'matron', n: 1, map: 'birch', goal: 'Defeat the Bramble Matron in Birkilund (east gate)',
    hint: 'It is a mini-boss: bring draughts, and roll away when it raises itself to stomp.',
    say: [[null, 'The Matron crumbles into ash and thorns. Deep in its roots, something glows like a coal.']],
    reward: { xp: 120, perz: 400 } },
  { id: 'roots', ch: 'Chapter 3: Embers in the Wilds', title: 'What the Roots Knew', kind: 'talk', npc: 'saeunn', goal: 'Tell Saeunn what you found',
    say: [['saeunn', 'A coal in the roots... The Jarl is waking faster than I feared.'],
      ['saeunn', 'Go south through Myrkdal and look upon Glodberg with your own eyes. But do not wake him before you are ready.']],
    reward: { xp: 30 } },
  { id: 'emberhill', ch: 'Chapter 3: Embers in the Wilds', title: 'The Ember-Hill', kind: 'visit', map: 'ridge', goal: 'Travel through Myrkdal to Glodberg',
    say: [[null, 'The hill is warm under your feet. In the south of Glodberg, something vast breathes in its sleep.']],
    reward: { xp: 40 } },
  { id: 'ready', ch: 'Chapter 3: Embers in the Wilds', title: 'Grow Stronger', kind: 'level', lv: 22, goal: 'Reach Base Level 22',
    hint: 'Saltvik, Svartskog and Askheid have tougher monsters and bosses. Their rare materials forge the best gear at Gunnar\'s.',
    say: [[null, 'You feel ready. It is time to go home to Eldrun before the end.']],
    reward: { xp: 80 } },

  // ---------- Chapter 4: the Ember Jarl ----------
  { id: 'lastfire', ch: 'Chapter 4: The Ember Jarl', title: 'The Last Fire', kind: 'talk', npc: 'bram', goal: 'Return to Elder Halvard at camp',
    say: [['bram', 'Look at you. The stranger by the fire, come home a hero.'],
      ['bram', 'When the Jarl falls, the fire-ring will burn again. Take these, and come back to us.']],
    reward: { xp: 60, items: { potion3: 3, potion2: 5 } } },
  { id: 'jarl', ch: 'Chapter 4: The Ember Jarl', title: 'The Ember Jarl', kind: 'kill', mob: 'jarl', n: 1, map: 'ridge', goal: 'Defeat the Ember Jarl in the south of Glodberg',
    say: [[null, 'The Ember Jarl falls with a sound like a mountain settling. The heat leaves the ground. Far away, in Eldrun, a fire leaps up tall and bright.']],
    reward: { xp: 400, perz: 3000 } },
  { id: 'rekindled', ch: 'Chapter 4: The Ember Jarl', title: 'The Fire-Ring Rekindled', kind: 'talk', npc: 'bram', goal: 'Return to Elder Halvard at camp',
    say: [['bram', 'The ground is still. Look at the fire: it has not burnt this bright since I was a boy.'],
      ['bram', 'But Saeunn says the runes speak of older names beyond the mountains: lands the songs still remember. The road goes on, as roads do.'],
      ['bram', 'Rest now, hero of Eldrun. Aria will need you again.'],
      [null, 'The Last Fire-Ring: the end of the first saga. More of Aria is coming.']],
    reward: { xp: 300, perz: 5000, items: { glow_charm: 1 } } },
];

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
  directions(here) {
    const s = this.step, where = this.map();
    if (!s || !where) return s?.hint || '';
    if (where === here) return s.kind === 'talk' ? `${NPCS[s.npc].name} is on this map` : s.hint || '';
    const p = route(here, where);
    return p ? `Head ${compass(p)} to ${ZONE_NAMES[p.to]}${p.to !== where ? `, on to ${ZONE_NAMES[where]}` : ''}` : '';
  }

  progress() {
    const s = this.step;
    return s?.kind === 'kill' ? ` (${Math.min(this.count, s.n)}/${s.n})` : '';
  }

  // talking to someone completes a talk step for them
  talkStep(npc) { return this.step?.kind === 'talk' && this.step.npc === npc ? this.step : null; }

  onKill(type) { if (this.step?.kind === 'kill' && this.step.mob === type) this.count++; }
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

  toJSON() { return { i: this.i, count: this.count, flags: this.flags }; }
  load(d) {
    if (!d) return false;
    this.i = Math.max(0, Math.min(STORY.length, d.i | 0));
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
