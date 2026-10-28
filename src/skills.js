// Aria's own skills, on Ragnarok-style rules: skill points from Job Levels, actives for the
// hotbar, passives, prerequisites and SP costs. Kept modest. A Trainee spends points on Basic
// Training (Lv 9 opens the first jobs) and picks up the other basics free as the Job Level rises.
// A Blader is plain sword craft; a Sorcerer casts spells from range (cast times shorten with FNS,
// magic never misses); an Archer shoots from range with a bow. Each buys from their own tree and
// gets two free skills at Job 10.
//
// A hero who has walked several paths (see progress.js) keeps every tree they earned: passives work
// whatever job they wear, and actives too, as long as the right weapon is in hand (weapon: 'sword'
// = a sword, 'staff' = a staff, 'bow' = a bow; bare hands are none of them, and a Sorcerer's spells need
// no staff). range: 'bow' = the bow's reach. Skill points go into any tree the
// hero earned, active job or not (trainTrees).
//
// kind: active (goes on the hotbar) | passive
// target: 'mob' for skills aimed at a monster; range = how close you must be (world units)
// cast: seconds to cast (spells), before FNS shortens it; magic: the spell's element (damage from MATK)
// free: { jobLv } learnt automatically; granted: learnt once its needs are met; else bought with points
import { TREES, JOBS, SECOND_AT } from './progress.js';
import { MAX_JOB } from './ro-tables.js';

// status: a spell (or sword sweep) may freeze, paralyze or stun a monster (it stands helpless) or set
// it burning (damage each second). chance(lv) in %, dur in s; bosses resist: a third of the chance
// for half as long (main.js inflict). hits/every: a skill that strikes again and again (power is per hit).
const STATUS_WORD = { freeze: 'freeze', paralyze: 'paralyze', stun: 'stun', burn: 'set burning' };
const statusText = (sk, lv, each = '') => `${sk.status.chance(lv)}% chance${each} to ${STATUS_WORD[sk.status.kind]} for ${sk.status.dur} s (bosses resist)`;

// what an Elemental Edge or Nova does by element (main.js): the status, and for how long
export const EDGE_FX = { fire: { kind: 'burn', dur: 3 }, water: { kind: 'freeze', dur: 2 }, wind: { kind: 'paralyze', dur: 1.2 }, earth: { kind: 'stun', dur: 1.5 } };

export const SKILLS = {
  // ---------- Novice ----------
  basics: {
    name: 'Basic Training', job: 'novice', kind: 'passive', max: 9, icon: 'skill_lore',
    desc: (lv) => `+${lv} ATK. Lv 3: you can Rest. Lv 9: you may become a Blader, a Sorcerer or an Archer.`,
  },
  rest: {
    name: 'Rest', job: 'novice', kind: 'active', max: 1, needs: { basics: 3 }, granted: true, icon: 'skill_rest',
    desc: () => 'Kneel and catch your breath: HP and SP recover twice as fast. Walk to get up.',
  },
  mend: {
    name: 'Mend', job: 'novice', kind: 'active', max: 1, free: { jobLv: 1 }, sp: () => 4, cd: 2, icon: 'skill_mend',
    desc: () => 'Bind a wound: heals 5 HP plus 3% of your Max HP.',
  },
  thrust: {
    name: 'Thrust', job: 'novice', kind: 'active', max: 1, free: { jobLv: 3 }, target: 'mob', range: 1.35, sp: () => 3, icon: 'skill_thrust',
    desc: () => 'A quick stab with the point: 125% damage.',
  },
  guard: {
    name: 'Guard', job: 'novice', kind: 'active', max: 1, free: { jobLv: 5 }, sp: () => 4, cd: 8, icon: 'skill_guard',
    desc: () => 'Raise your blade for 4 s: 15% less damage taken and no flinching.',
  },
  footwork: {
    name: 'Footwork', job: 'novice', kind: 'passive', max: 1, free: { jobLv: 7 }, icon: 'skill_quickfeet',
    desc: () => '+3 FLEE.',
  },

  // ---------- Blader ----------
  discipline: {
    name: 'Blade Discipline', job: 'swordman', kind: 'passive', max: 10, icon: 'skill_discipline',
    desc: (lv) => `+${2 * lv} ATK with swords.`,
  },
  ironhide: {
    name: 'Iron Hide', job: 'swordman', kind: 'passive', max: 10, icon: 'skill_ironhide',
    desc: (lv) => `+${lv} DEF and +${lv}% Max HP.`,
  },
  cleave: {
    name: 'Cleave', job: 'swordman', kind: 'active', max: 10, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_cleave',
    sp: (lv) => 5 + Math.floor(lv / 2), power: (lv) => 120 + 14 * lv,
    desc: (lv) => `A wide sweep: ${SKILLS.cleave.power(lv)}% damage to your target, half that to any monster beside it.`,
  },
  heavy: {
    name: 'Heavy Strike', job: 'swordman', kind: 'active', max: 10, needs: { cleave: 3 }, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_rend',
    sp: () => 8, power: (lv) => 170 + 25 * lv,
    desc: (lv) => `A two-handed blow: ${SKILLS.heavy.power(lv)}% damage, +${3 * lv}% hit chance.`,
  },
  warcry: {
    name: 'War Cry', job: 'swordman', kind: 'active', max: 10, cd: 8, icon: 'skill_warcry',
    sp: () => 10,
    desc: (lv) => `Shout: monsters within 6 paces turn on you, and your ATK rises ${lv}% for 20 s.`,
  },
  standfirm: {
    name: 'Stand Firm', job: 'swordman', kind: 'active', max: 10, needs: { warcry: 3 }, cd: 20, icon: 'skill_standfirm',
    sp: () => 12,
    desc: (lv) => `Plant your feet for ${6 + Math.floor(lv / 2)} s: no flinching, ${lv}% less damage taken.`,
  },
  earthsplit: {
    name: 'Ground Slash', job: 'swordman', kind: 'active', max: 10, needs: { heavy: 5 }, cd: 3, weapon: 'sword', icon: 'skill_earthsplit',
    sp: () => 20, power: (lv) => 130 + 15 * lv, status: { kind: 'stun', chance: (lv) => 2 * lv, dur: 1 },
    desc: (lv) => `Sweep the blade low all around you: ${SKILLS.earthsplit.power(lv)}% damage to everything close, pushing it back a little; ${statusText(SKILLS.earthsplit, lv, ' each')}.`,
  },
  rhythm: {
    name: 'Battle Rhythm', job: 'swordman', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_rhythm',
    desc: () => 'Every third hit that lands restores 3 SP.',
  },
  laststand: {
    name: 'Last Stand', job: 'swordman', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_laststand',
    desc: () => 'Below 25% HP: +15% ATK.',
  },

  // ---------- Sorcerer ----------
  manawell: {
    name: 'Mana Well', job: 'mage', kind: 'passive', max: 10, icon: 'skill_manawell',
    desc: (lv) => `+${2 * lv}% Max SP, and +${lv} SP each time SP recovers.`,
  },
  spark: {
    name: 'Ember Bolt', job: 'mage', kind: 'active', max: 10, target: 'mob', range: 5, magic: 'fire', icon: 'skill_spark',
    sp: (lv) => 4 + lv, cast: (lv) => 0.5 + 0.1 * lv, cd: 0.6, power: (lv) => 70 + 12 * lv,
    desc: (lv) => `Hurl a bolt of fire: ${SKILLS.spark.power(lv)}% MATK. Fire: strong against Earth, weak against Water.`,
  },
  frost: {
    name: 'Frost Shard', job: 'mage', kind: 'active', max: 10, target: 'mob', range: 5, magic: 'water', icon: 'skill_frost',
    sp: (lv) => 6 + lv, cast: (lv) => 0.4 + 0.12 * lv, cd: 0.6, power: (lv) => 20 + lv, hits: (lv) => lv, every: 0.12,
    desc: (lv) => `${lv} shard${lv > 1 ? 's' : ''} of ice rain on the monster one after another, ${SKILLS.frost.power(lv)}% MATK each. Water: strong against Fire, weak against Wind.`,
  },
  arc: {
    name: 'Arc Lightning', job: 'mage', kind: 'active', max: 10, needs: { spark: 4 }, target: 'mob', range: 5, magic: 'wind', icon: 'skill_arc',
    sp: (lv) => 10 + lv, cast: (lv) => 1 + 0.1 * lv, cd: 1, power: (lv) => 60 + 7 * lv, status: { kind: 'paralyze', chance: (lv) => 2 * lv, dur: 1.2 },
    desc: (lv) => `Lightning strikes your target for ${SKILLS.arc.power(lv)}% MATK and leaps to 2 monsters nearby for half that; ${statusText(SKILLS.arc, lv, ' each')}. Wind: strong against Water, weak against Earth.`,
  },
  flamering: {
    name: 'Flame Ring', job: 'mage', kind: 'active', max: 10, needs: { spark: 5 }, magic: 'fire', icon: 'skill_flamering',
    sp: (lv) => 16 + lv, cast: () => 1.5, cd: 3, power: (lv) => 70 + 8 * lv, status: { kind: 'burn', chance: (lv) => 2 * lv, dur: 3 },
    desc: (lv) => `A ring of fire bursts around you: ${SKILLS.flamering.power(lv)}% MATK (Fire) to every monster close by; ${statusText(SKILLS.flamering, lv, ' each')} (a fifth of the hit each second).`,
  },
  ward: {
    name: 'Rune Ward', job: 'mage', kind: 'active', max: 10, needs: { manawell: 3 }, cd: 30, icon: 'skill_ward',
    sp: () => 15,
    desc: (lv) => `Runes circle you for 30 s: ${2 * lv}% less damage taken, and hits no longer break your casting.`,
  },
  blink: {
    name: 'Blink', job: 'mage', kind: 'active', max: 1, free: { jobLv: 10 }, cd: 6, icon: 'skill_blink',
    sp: () => 10,
    desc: () => 'Vanish and reappear 4 paces ahead.',
  },
  swiftchant: {
    name: 'Swift Chant', job: 'mage', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_swiftchant',
    desc: () => 'Spells cast 15% faster.',
  },

  // ---------- Archer: a bow, from range (normal shots and skills reach BOW_RANGE paces, more with
  // Long Sight), ATK from FNS. Five actives like the Blader; two free skills at Job 10 ----------
  keeneye: {
    name: 'Keen Eye', job: 'archer', kind: 'passive', max: 10, icon: 'skill_keeneye',
    desc: (lv) => `+${lv} FNS.`,
  },
  longsight: {
    name: 'Long Sight', job: 'archer', kind: 'passive', max: 10, icon: 'skill_longsight',
    desc: (lv) => `Your bow reaches ${(0.2 * lv).toFixed(1)} paces further, and +${lv} HIT with bows.`,
  },
  doubleshot: {
    name: 'Double Shot', job: 'archer', kind: 'active', max: 10, target: 'mob', range: 'bow', weapon: 'bow', icon: 'skill_doubleshot',
    sp: (lv) => 10 + Math.floor(lv / 2), power: (lv) => 70 + 8 * lv, hits: () => 2, every: 0.12,
    desc: (lv) => `Loose two arrows at once: ${SKILLS.doubleshot.power(lv)}% damage each.`,
  },
  arrowrain: {
    name: 'Arrow Rain', job: 'archer', kind: 'active', max: 10, needs: { doubleshot: 5 }, target: 'mob', range: 'bow', weapon: 'bow', cd: 2, icon: 'skill_arrowrain',
    sp: () => 15, power: (lv) => 80 + 8 * lv,
    desc: (lv) => `Arrows fall round your target: ${SKILLS.arrowrain.power(lv)}% damage to every monster within 2.5 paces of it, pushing them back a little.`,
  },
  focus: {
    name: 'Focus', job: 'archer', kind: 'active', max: 10, cd: 5, icon: 'skill_focus',
    sp: (lv) => 10 + lv,
    desc: (lv) => `Steady your breath: +${lv} QKN and +${lv} FNS for 60 s.`,
  },
  huntmark: {
    name: "Hunter's Mark", job: 'archer', kind: 'active', max: 5, needs: { keeneye: 3 }, target: 'mob', range: 'bow', cd: 3, icon: 'skill_mark',
    sp: () => 12,
    desc: (lv) => `Mark a monster for 10 s: everything you hit it with deals ${4 * lv}% more.`,
  },
  leapback: {
    name: 'Leap Back', job: 'archer', kind: 'active', max: 1, free: { jobLv: 10 }, cd: 6, icon: 'skill_leapback',
    sp: () => 6,
    desc: () => 'Spring 3 paces back, away from the nearest monster.',
  },
  steadyaim: {
    name: 'Steady Aim', job: 'archer', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_steadyaim',
    desc: () => '+10% damage with a bow to a monster 4 or more paces away.',
  },

  // ---------- Windrunner (from the Archer): quick shots, and short bursts of speed to reposition.
  // Walking speed is a big buff in Aria: only these bursts haste the walk, a few seconds at a time ----------
  windborne: {
    name: 'Windborne', job: 'windrunner', kind: 'passive', max: 10, icon: 'skill_windborne',
    desc: (lv) => `Your bow shoots ${2 * lv}% faster.`,
  },
  galerhythm: {
    name: 'Gale Rhythm', job: 'windrunner', kind: 'passive', max: 5, needs: { windborne: 3 }, icon: 'skill_rhythm2',
    desc: (lv) => `Every arrow that lands adds a stack of Rhythm (up to 5, for 6 s): your bow shoots ${lv}% faster per stack.`,
  },
  skirmisher: {
    name: 'Skirmisher', job: 'windrunner', kind: 'passive', max: 5, icon: 'skill_skirmisher',
    desc: (lv) => `After a burst of speed (Gale Step, Tailwind's rush) your next 3 arrows deal ${8 * lv}% more.`,
  },
  tailwind: {
    name: 'Tailwind', job: 'windrunner', kind: 'active', max: 10, cd: 30, icon: 'skill_tailwind',
    sp: (lv) => 20 + 2 * lv, dur: (lv) => 20 + 2 * lv,
    desc: (lv) => `The wind at your back for ${SKILLS.tailwind.dur(lv)} s: your bow shoots ${2 * lv}% faster. For its first 4 s you rush, walking 30% quicker.`,
  },
  galestep: {
    name: 'Gale Step', job: 'windrunner', kind: 'active', max: 5, cd: 6, icon: 'skill_galestep',
    sp: () => 12, haste: (lv) => 20 + 4 * lv,
    desc: (lv) => `Dash 4 paces away from the nearest monster (or ahead): nothing can touch you on the way. Then walk ${SKILLS.galestep.haste(lv)}% quicker for 2 s.`,
  },
  volley: {
    name: 'Hurricane Volley', job: 'windrunner', kind: 'active', max: 10, needs: { windborne: 5 }, target: 'mob', range: 'bow', weapon: 'bow', icon: 'skill_volley',
    sp: (lv) => 18 + 2 * lv, power: (lv) => 60 + 8 * lv, hits: (lv) => 5 + Math.floor(lv / 2), every: 0.09, cd: 1.5, // (one stream at a time: it can't be cast again before it has flown)
    desc: (lv) => `A stream of ${SKILLS.volley.hits(lv)} arrows, one on the heels of the next: ${SKILLS.volley.power(lv)}% damage each.`,
  },
  cyclone: {
    name: 'Cyclone Arrow', job: 'windrunner', kind: 'active', max: 10, needs: { volley: 3, tailwind: 3 }, target: 'mob', range: 'bow', weapon: 'bow', cd: 4, icon: 'skill_cyclone',
    sp: (lv) => 26 + 2 * lv, power: (lv) => 35 + 4 * lv, hits: () => 7, every: 0.43, area: 2.5,
    status: { kind: 'paralyze', chance: (lv) => 2 * lv, dur: 1.2 },
    desc: (lv) => `An arrow that bursts into a whirlwind where it lands, for 3 s: 7 gusts of ${SKILLS.cyclone.power(lv)}% damage to every monster within 2.5 paces, pulling them in; each gust ${2 * lv}% to paralyze for 1.2 s.`,
  },

  // ---------- Moon Ranger (Sorcerer and Archer both walked): arrows that hit with ATK and MATK
  // together (power + mpower, a bow in hand, the arrows' element), stronger at night ----------
  moonlit: {
    name: 'Moonlit Hunter', job: 'moonranger', kind: 'passive', max: 10, icon: 'skill_moonlit',
    desc: (lv) => `At night: every skill deals ${2 * lv}% more, and +${lv} FLEE.`,
  },
  lunartide: {
    name: 'Lunar Tide', job: 'moonranger', kind: 'passive', max: 5, needs: { moonlit: 3 }, icon: 'skill_lunartide',
    desc: (lv) => `At night: SP comes back ${10 * lv}% faster, and Starfall costs ${4 * lv}% less SP.`,
  },
  starsight: {
    name: 'Star Sight', job: 'moonranger', kind: 'passive', max: 5, icon: 'skill_starsight',
    desc: (lv) => `Lunar Multishot and Starfall reach ${(0.5 * lv).toFixed(1)} paces further.`,
  },
  multishot: {
    name: 'Lunar Multishot', job: 'moonranger', kind: 'active', max: 10, target: 'mob', range: 'bow', weapon: 'bow', icon: 'skill_multishot',
    sp: (lv) => 16 + 2 * lv, power: (lv) => 70 + 8 * lv, mpower: (lv) => 40 + 6 * lv, arrows: (lv) => 3 + Math.floor(lv / 3),
    desc: (lv) => `A fan of ${SKILLS.multishot.arrows(lv)} moonlit arrows: one at your target, the rest at the monsters nearest it (all at the target if it is alone). Each ${SKILLS.multishot.power(lv)}% ATK + ${SKILLS.multishot.mpower(lv)}% MATK.`,
  },
  starfall: {
    name: 'Starfall', job: 'moonranger', kind: 'active', max: 10, needs: { multishot: 3 }, target: 'mob', range: 'bow', cd: 3, icon: 'skill_starfall',
    sp: (lv) => 30 + 3 * lv, power: (lv) => 30 + 4 * lv, mpower: (lv) => 45 + 6 * lv, hits: (lv) => 2 + Math.floor(lv / 2), every: 0.6, area: 3,
    status: { kind: 'stun', chance: (lv) => 1.5 * lv, dur: 1.5 },
    desc: (lv) => `Stars fall round your target for ${SKILLS.starfall.hits(lv)} waves: each ${SKILLS.starfall.power(lv)}% ATK + ${SKILLS.starfall.mpower(lv)}% MATK to every monster within 3 paces, ${1.5 * lv}% to stun it for 1.5 s.`,
  },
  crescent: {
    name: 'Crescent Arrow', job: 'moonranger', kind: 'active', max: 10, needs: { multishot: 5 }, target: 'mob', range: 'bow', weapon: 'bow', cd: 3, icon: 'skill_crescent',
    sp: (lv) => 20 + 2 * lv, power: (lv) => 150 + 18 * lv, mpower: (lv) => 80 + 10 * lv,
    desc: (lv) => `A charged arrow that flies 8 paces through your target and every monster in its line: ${SKILLS.crescent.power(lv)}% ATK + ${SKILLS.crescent.mpower(lv)}% MATK to each.`,
  },
  moonveil: {
    name: 'Moonveil', job: 'moonranger', kind: 'active', max: 5, needs: { moonlit: 1 }, cd: 30, icon: 'skill_moonveil',
    sp: (lv) => 25 + 5 * lv,
    desc: (lv) => `A veil of moonlight for 15 s: ${4 * lv}% less damage taken; at night every Lunar Multishot looses 2 more arrows.`,
  },

  // ---------- Beastmaster (Blader and Archer both walked): sword or bow, and three beasts (allies.js).
  // Its own tree holds only beast skills: three summons and Pack Frenzy, and passives for the beasts.
  // A summon's level sets the share of the hero's stats its beast takes (main.js beastStats) ----------
  summonbear: {
    name: 'Summon Bear', job: 'beastmaster', kind: 'active', max: 5, cd: 3, icon: 'skill_sbear', beast: 'bear',
    sp: (lv) => 30 + 5 * lv,
    desc: (lv) => `Call your Bear, marked with gold runes (${30 + 10 * lv}% of your stats). Its HP and DEF grow mostly with your END, its ATK with POW; it soaks blows and roars (every 10 s), a war cry: the monsters round it turn on it, and all your beasts hit 10% harder for 6 s. Instinct, Maul (every 12 s): a heavy blow for 250% that stuns (bosses: a third of the chance, half as long). Called again, it comes back fresh.`,
  },
  summonwolves: {
    name: 'Summon Wolves', job: 'beastmaster', kind: 'active', max: 5, cd: 3, icon: 'skill_swolves', beast: 'wolf',
    sp: (lv) => 30 + 5 * lv,
    desc: (lv) => `Call the Black Wolf and the White Wolf (${30 + 10 * lv}% of your stats). Their HIT and ATK grow mostly with your FNS, their ATK with POW too; they bite quickly, sometimes twice. Instinct, Hamstring (every 10 s each): a leap at the foe from up to 4 paces and a bite for 180% that slows its walk by 40% for 4 s (bosses 2 s).`,
  },
  summonhawk: {
    name: 'Summon Hawk', job: 'beastmaster', kind: 'active', max: 5, cd: 3, icon: 'skill_shawk', beast: 'hawk',
    sp: (lv) => 25 + 5 * lv,
    desc: (lv) => `Call your Hawk (${30 + 10 * lv}% of your stats). Its attack speed and reach grow mostly with your QKN, its ATK with POW. It flies out of reach of every blow up close: only arrows and thrown or falling blows reach it. Instinct, Dive (every 9 s): it climbs, then drops on the foe for 300%, a blow that never misses.`,
  },
  packfrenzy: {
    name: 'Pack Frenzy', job: 'beastmaster', kind: 'active', max: 10, needs: { summonwolves: 1 }, cd: 30, icon: 'skill_frenzy',
    sp: (lv) => 30 + 2 * lv,
    desc: (lv) => `For 15 s every beast you have out attacks ${3 * lv}% faster and hits ${3 * lv}% harder.`,
  },
  beastbond: {
    name: 'Beast Bond', job: 'beastmaster', kind: 'passive', max: 10, icon: 'skill_bond',
    desc: (lv) => `Your beasts take ${2 * lv}% more of your stats, and you get +${lv} DEF for each beast out.`,
  },
  thickhide: {
    name: 'Thick Hide', job: 'beastmaster', kind: 'passive', max: 5, needs: { summonbear: 3 }, icon: 'skill_hide',
    desc: (lv) => `Your Bear takes ${4 * lv}% less damage and its roar reaches ${(3 + 0.5 * lv).toFixed(1)} paces.`,
  },
  packtactics: {
    name: 'Pack Tactics', job: 'beastmaster', kind: 'passive', max: 5, needs: { summonwolves: 3 }, icon: 'skill_tactics',
    desc: (lv) => `Your Wolves bite ${6 * lv}% harder while both are on the same monster.`,
  },
  windtalons: {
    name: 'Wind Talons', job: 'beastmaster', kind: 'passive', max: 5, needs: { summonhawk: 3 }, icon: 'skill_talons',
    desc: (lv) => `Your Hawk strikes ${3 * lv}% faster, and each dive has ${2 * lv}% to stun for 1 s (bosses resist).`,
  },

  // ---------- BladeMaster (from the Blader): one target, cut down fast. Blade skills may Combo
  // (a free extra strike); each Combo adds a Momentum stack; Final Blade spends the stacks ----------
  blademastery: {
    name: 'Blade Mastery', job: 'blademaster', kind: 'passive', max: 10, icon: 'skill_blademastery',
    desc: (lv) => `+${3 * lv} ATK and +${lv} HIT with swords.`,
  },
  comboedge: {
    name: 'Combo Edge', job: 'blademaster', kind: 'passive', max: 10, icon: 'skill_comboedge',
    desc: (lv) => `Thrust, Cleave, Heavy Strike, Twin Fang and Piercing Edge have a ${4 * lv}% chance to Combo: a free extra strike for 100% damage.`,
  },
  momentum: {
    name: 'Momentum', job: 'blademaster', kind: 'passive', max: 5, needs: { comboedge: 3 }, icon: 'skill_momentum',
    desc: (lv) => `Each Combo adds a Momentum stack (up to 5, 8 s): +${lv}% ATK per stack. Final Blade spends them all.`,
  },
  twinfang: {
    name: 'Twin Fang', job: 'blademaster', kind: 'active', max: 10, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_twinfang',
    sp: (lv) => 6 + Math.floor(lv / 2), cd: 0.8, power: (lv) => 130 + 16 * lv,
    desc: (lv) => `Two quick cuts, ${SKILLS.twinfang.power(lv)}% damage each. Each cut can Combo.`,
  },
  pierce: {
    name: 'Piercing Edge', job: 'blademaster', kind: 'active', max: 10, needs: { twinfang: 3 }, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_pierce',
    sp: (lv) => 9 + lv, cd: 1.5, power: (lv) => 95 + 13 * lv, hits: () => 3, every: 0.12,
    desc: (lv) => `Three lightning thrusts that find the gaps: ${SKILLS.pierce.power(lv)}% damage each, ignoring half the monster's DEF.`,
  },
  finalblade: {
    name: 'Final Blade', job: 'blademaster', kind: 'active', max: 5, needs: { pierce: 5, momentum: 1 }, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_finalblade',
    sp: (lv) => 20 + 2 * lv, cd: 6, power: (lv, stacks = 0) => 55 + 11 * lv + 8 * stacks, hits: () => 8, every: 0.07,
    desc: (lv) => `Spend every Momentum stack on a flurry of 8 cuts: ${SKILLS.finalblade.power(lv)}% damage each, +8% each for every stack.`,
  },
  bladedance: {
    name: 'Blade Dance', job: 'blademaster', kind: 'active', max: 5, needs: { pierce: 3, comboedge: 3 }, target: 'mob', range: 4, weapon: 'sword', icon: 'skill_bladedance',
    sp: (lv) => 40 + 5 * lv, cd: 18, power: (lv) => 140 + 24 * lv, hits: (lv) => 4 + lv, every: 0.22, area: 5,
    desc: (lv) => `Vanish into a blur and dash from monster to monster within ${SKILLS.bladedance.area} paces of your target, one at a time: ${SKILLS.bladedance.hits(lv)} slashes of ${SKILLS.bladedance.power(lv)}% each, and each can Combo. Nothing can touch you until the dance ends.`,
  },

  // ---------- Wizard (from the Sorcerer): elements, over an area. Changing element from one spell
  // to the next builds Resonance; Stone Spike shatters a monster for the next spell ----------
  attune: {
    name: 'Elemental Attunement', job: 'wizard', kind: 'passive', max: 10, icon: 'skill_attune',
    desc: (lv) => `Spells deal ${3 * lv}% more damage, and a further ${3 * lv}% to a monster weak to their element.`,
  },
  resonance: {
    name: 'Resonance', job: 'wizard', kind: 'passive', max: 5, needs: { attune: 3 }, icon: 'skill_resonance',
    desc: (lv) => `A spell of a different element from your last one (within 8 s) deals ${6 * lv}% more damage.`,
  },
  stonespike: {
    name: 'Stone Spike', job: 'wizard', kind: 'active', max: 10, target: 'mob', range: 5, magic: 'earth', icon: 'skill_stonespike',
    sp: (lv) => 10 + lv, cast: (lv) => 0.8 + 0.05 * lv, cd: 0.6, power: (lv) => 100 + 14 * lv,
    desc: (lv) => `A spike of rock bursts under the monster: ${SKILLS.stonespike.power(lv)}% MATK (Earth), and it is Shattered for 6 s: the next spell of another element on it deals 30% more. Earth: strong against Wind, weak against Fire.`,
  },
  quake: {
    name: 'Earthquake', job: 'wizard', kind: 'active', max: 10, needs: { stonespike: 3 }, target: 'mob', range: 5, magic: 'earth', icon: 'skill_quake',
    sp: (lv) => 30 + 2 * lv, cast: () => 1.6, cd: 3, power: (lv) => 40 + 4 * lv, hits: () => 3, every: 0.5, status: { kind: 'stun', chance: (lv) => 1.5 * lv, dur: 1.5 },
    desc: (lv) => `The ground heaves around your target three times, ${SKILLS.quake.power(lv)}% MATK (Earth) each shock to every monster within 3 paces; ${statusText(SKILLS.quake, lv, ' each shock')}.`,
  },
  meteor: {
    name: 'Meteor Storm', job: 'wizard', kind: 'active', max: 10, needs: { spark: 5 }, target: 'mob', range: 5, magic: 'fire', icon: 'skill_meteor',
    sp: (lv) => 40 + 2 * lv, cast: (lv) => 2.2 + 0.05 * lv, cd: 4, power: (lv) => 50 + 5 * lv, hits: (lv) => 2 + Math.ceil(lv / 2), every: 0.35, status: { kind: 'burn', chance: (lv) => 3 * lv, dur: 3 },
    desc: (lv) => `${SKILLS.meteor.hits(lv)} meteors crash down at random within 3 paces of your target, one after another: ${SKILLS.meteor.power(lv)}% MATK (Fire) to everything near where each lands; ${statusText(SKILLS.meteor, lv, ' each')} (a fifth of the hit each second).`,
  },
  stormgust: {
    name: 'Storm Gust', job: 'wizard', kind: 'active', max: 10, needs: { frost: 5 }, target: 'mob', range: 5, magic: 'water', icon: 'skill_stormgust',
    sp: (lv) => 36 + 2 * lv, cast: () => 2.0, cd: 4, power: (lv) => 12 + lv, hits: () => 10, every: 0.3, status: { kind: 'freeze', chance: (lv) => 2 * lv, dur: 2.5 },
    desc: (lv) => `A blizzard howls around your target for 3 s: 10 gusts of ${SKILLS.stormgust.power(lv)}% MATK (Water) to every monster within 3 paces; from the third gust on, ${statusText(SKILLS.stormgust, lv, ' each')}.`,
  },
  thunder: {
    name: 'Thunderstorm', job: 'wizard', kind: 'active', max: 10, needs: { arc: 5 }, target: 'mob', range: 5, magic: 'wind', icon: 'skill_thunder',
    sp: (lv) => 32 + 2 * lv, cast: () => 1.7, cd: 3, power: (lv) => 18 + 2 * lv, hits: () => 6, every: 0.4, status: { kind: 'paralyze', chance: (lv) => 1.5 * lv, dur: 1.5 },
    desc: (lv) => `Lightning rains around your target in 6 waves: ${SKILLS.thunder.power(lv)}% MATK (Wind) each to every monster within 3 paces; ${statusText(SKILLS.thunder, lv, ' each wave')}.`,
  },

  // ---------- Magic Knight (Blader and Sorcerer both walked): elemental sword skills that hit with
  // ATK and MATK together, and a rune barrier made of both. Changing element builds an Elemental Chain ----------
  spellblade: {
    name: 'Spellblade', job: 'magicknight', kind: 'passive', max: 10, icon: 'skill_spellblade',
    desc: (lv) => `Your sword attacks add ${3 * lv}% of your MATK.`,
  },
  elemchain: {
    name: 'Elemental Chain', job: 'magicknight', kind: 'passive', max: 5, needs: { spellblade: 3 }, icon: 'skill_elemchain',
    desc: (lv) => `An Elemental Edge of a different element from your last one (within 6 s) deals ${6 * lv}% more damage and gives back 3 SP.`,
  },
  elemedge: {
    name: 'Elemental Edge', job: 'magicknight', kind: 'active', max: 10, target: 'mob', range: 1.35, weapon: 'sword', edge: true, icon: 'skill_elemedge',
    sp: (lv) => 6 + lv, cd: 0.5, power: (lv) => 100 + 10 * lv, mpower: (lv) => 55 + 8 * lv, hits: () => 2, every: 0.15,
    status: { chance: (lv) => 3 * lv }, // the kind and how long come from the element (EDGE_FX)
    desc: (lv) => `Two quick cuts in your blade's element (see Elemental Blade; none without it): ${SKILLS.elemedge.power(lv)}% ATK and ${SKILLS.elemedge.mpower(lv)}% MATK each. By element, ${SKILLS.elemedge.status.chance(lv)}% chance each: Fire burns, Water freezes, Earth stuns, and Wind crackles into the monsters beside your target for half and may paralyze them (bosses resist).`,
  },
  elemblade: {
    name: 'Elemental Blade', job: 'magicknight', kind: 'active', max: 5, needs: { spellblade: 1 }, weapon: 'sword', icon: 'skill_elemblade',
    sp: () => 20, cd: 1, dur: (lv) => 60 + 30 * lv,
    desc: (lv) => `Imbue your sword with an element for ${SKILLS.elemblade.dur(lv)} s: your normal attacks, Edges and Novas strike as Fire. Use it again to switch, free while it lasts: Fire, then Water, Wind, Earth. Pick what the monster is weak to.`,
  },
  nova: {
    name: 'Elemental Nova', job: 'magicknight', kind: 'active', max: 5, needs: { elemedge: 3, elemchain: 1 }, weapon: 'sword', icon: 'skill_nova',
    sp: (lv) => 30 + 3 * lv, cd: 4, power: (lv) => 100 + 16 * lv, mpower: (lv) => 60 + 10 * lv, hits: () => 3, every: 0.25, areas: [2.5, 4, 5.5],
    status: { chance: (lv) => 4 * lv },
    desc: (lv) => `Drive your sword into the ground: three waves of your blade's element roll out around you, to 2.5, 4 and 5.5 paces, ${SKILLS.nova.power(lv)}% ATK and ${SKILLS.nova.mpower(lv)}% MATK each to everything they reach (the nearest are caught by all three), with a ${SKILLS.nova.status.chance(lv)}% chance each to burn, freeze, paralyze or stun by element (bosses resist).`,
  },
  aegis: {
    name: 'Stone Aegis', job: 'magicknight', kind: 'active', max: 10, needs: { spellblade: 1 }, cd: 25, icon: 'skill_aegis',
    sp: (lv) => 20 + 2 * lv,
    desc: (lv) => `Runes of stone close round you for 20 s: a barrier that soaks ${50 + 10 * lv}% of your ATK plus ${50 + 10 * lv}% of your MATK in damage, and +${lv} DEF while it holds.`,
  },
};

// skills shown in the Skills window: every tree the hero has earned, the current job's first,
// then the jobs it stands on (prog: Progress)
export function skillList(prog) {
  const trees = prog.trees, order = [...TREES[prog.job], ...[...trees].filter((t) => !TREES[prog.job].includes(t))];
  return Object.keys(SKILLS).filter((id) => trees.has(SKILLS[id].job))
    .sort((a, b) => order.indexOf(SKILLS[a].job) - order.indexOf(SKILLS[b].job));
}

// level the player has in a skill (0 = not learnt). prog: Progress
export function skillLv(prog, id) {
  const s = SKILLS[id];
  if (!s || !prog.trees.has(s.job)) return 0;
  if (s.free) return prog.levelOf(s.job) >= s.free.jobLv ? 1 : 0;
  if (s.granted) return Object.entries(s.needs).every(([k, n]) => skillLv(prog, k) >= n) ? 1 : 0;
  return prog.skills[id] || 0;
}

// the weapon an active skill needs in hand, and whether it is there ('sword' = a sword, 'staff' = a
// staff, 'bow' = a bow; bare hands, 'none', are none of them). The owner's rules: Blader, BladeMaster
// and Magic Knight blade skills need a sword; Archer, Windrunner and Moon Ranger shots a bow; spells
// (Sorcerer, Wizard, Starfall), buffs and moves (War Cry, Stand Firm, Focus, Hunter's Mark, Leap
// Back, Tailwind, Gale Step) and the Beastmaster's beasts need nothing
export const WEAPON_NAMES = { sword: 'a sword', staff: 'a staff', bow: 'a bow' };
export const BOW_RANGE = 5; // paces a bow reaches, before Long Sight
export const weaponOk = (id, weaponKind) => !SKILLS[id].weapon || SKILLS[id].weapon === weaponKind;

// the trees this hero's points may go into: every tree earned, the active job's first (the owner's
// call: a Blader who also earned the Sorcerer trains both without switching at a Keeper)
export function trainTrees(prog) {
  const own = TREES[prog.job];
  return [...own, ...[...prog.trees].filter((j) => !own.includes(j))];
}

// why a skill can't be raised right now, or null if it can
export function learnBlock(prog, id) {
  const s = SKILLS[id];
  if (s.free || s.granted) return 'free';
  if (!trainTrees(prog).includes(s.job)) return 'job'; // a tree not earned (yet)
  if (skillLv(prog, id) >= s.max) return 'max';
  for (const [k, n] of Object.entries(s.needs || {})) if (skillLv(prog, k) < n) return `Needs ${SKILLS[k].name} ${n}`;
  if (JOBS[s.job].tier === 2) { const why = secondJobBlock(prog); if (why) return why; }
  // a second job of two paths (Magic Knight, Moon Ranger, Beastmaster): once one path's tree has its
  // 20 points, it waits until the other's has 20 too, so a rebuild can't leave one short
  const from = prog.tier === 2 ? JOBS[prog.job].from || [] : [];
  if (from.length > 1 && from.includes(s.job) && pointsIn(prog, s.job) >= MK_POINTS) {
    const short = from.find((j) => pointsIn(prog, j) < MK_POINTS);
    if (short) return `Needs ${MK_POINTS} points in the ${JOBS[short].name} tree first (${pointsIn(prog, short)} now)`;
  }
  // ...and a first job outside the two paths (a Magic Knight's Archer tree) waits for both to have theirs
  if (from.length > 1 && JOBS[s.job].tier === 1 && !from.includes(s.job) && from.some((j) => pointsIn(prog, j) < MK_POINTS)) {
    return `Needs ${MK_POINTS} points in the ${from.map((j) => JOBS[j].name).join(' and ')} trees first (${from.map((j) => `${JOBS[j].name} ${pointsIn(prog, j)}`).join(', ')})`;
  }
  // a second job of one path (BladeMaster, Wizard, Windrunner): another first job's tree never gets
  // more points than the path's own (a Wizard's Blader tree stays at or under its Sorcerer tree)
  if (from.length === 1 && JOBS[s.job].tier === 1 && s.job !== from[0] && pointsIn(prog, s.job) >= pointsIn(prog, from[0])) {
    return `Needs more points in the ${JOBS[from[0]].name} tree first: ${JOBS[s.job].name} can't pass it (${pointsIn(prog, s.job)} / ${pointsIn(prog, from[0])})`;
  }
  if (prog.skillPoints <= 0) return 'points';
  return null;
}

export function learn(prog, id) {
  if (learnBlock(prog, id)) return false;
  prog.skills[id] = (prog.skills[id] || 0) + 1;
  return true;
}

// skill points spent in one job's tree
// Liv's retraining: every first-job skill (Blader, Sorcerer, Archer) is unlearnt and its points come
// back. Only before a second job, so the second-job rules (secondJobOpen) can never be dodged; the
// Trainee's tree is kept (Basic Training 9 is what opened the job). Skills learnt for free come back
// by themselves, from the Job Level
export const RETRAIN_COST = 20000; // perz, after the first time
export function unlearnFirstJob(prog) {
  if (prog.tier !== 1) return false;
  for (const id of Object.keys(prog.skills)) if (JOBS[SKILLS[id]?.job]?.tier === 1) delete prog.skills[id];
  prog.resets.skills++;
  return true;
}
// a second job's retraining: its own tree and every first-job tree it trains (trainTrees); the
// Trainee's stays. The points come back, and secondJobBlock makes sure the first jobs are rebuilt first
export function unlearnSecondJob(prog) {
  if (prog.tier !== 2) return false;
  for (const id of Object.keys(prog.skills)) {
    const job = SKILLS[id]?.job;
    if (JOBS[job]?.tier >= 1 && trainTrees(prog).includes(job)) delete prog.skills[id];
  }
  prog.resets.skills++;
  return true;
}
// Ragnarok's rule for a second job's own skills: every point the Trainee and first-job levels earned
// is spent in those trees first, and the job's opening rule (secondJobOpen) still holds: the Magic
// Knight's 20 Blader and 20 Sorcerer points, the Wizard's most points in the Sorcerer tree... So a
// retraining can never dodge them. Why not, or null if the second job's skills may be raised
export function secondJobBlock(prog) {
  const from = JOBS[prog.job].from || [];
  if (from.length > 1) {
    for (const j of from) if (pointsIn(prog, j) < MK_POINTS) return `Needs ${MK_POINTS} points in the ${JOBS[j].name} tree (${pointsIn(prog, j)} now)`;
  } else if (from.length === 1) {
    const firsts = prog.unlocked.filter((j) => JOBS[j]?.tier === 1);
    const most = Math.max(...firsts.map((j) => pointsIn(prog, j)));
    if (pointsIn(prog, from[0]) < most) return `Needs the most points in the ${JOBS[from[0]].name} tree`;
  }
  // the first-tier pool, as far as the trees open to this job can hold it
  const room = Object.values(SKILLS).reduce((a, s) => a + (!s.free && !s.granted && JOBS[s.job].tier <= 1 && trainTrees(prog).includes(s.job) ? s.max : 0), 0);
  const pool = Math.min(room, (MAX_JOB.novice - 1) + prog.levelOf('swordman'));
  const spent = Object.entries(prog.skills).reduce((a, [id, n]) => a + (JOBS[SKILLS[id]?.job]?.tier <= 1 ? n : 0), 0);
  if (spent < pool) return `Needs every Trainee and first-job skill point spent first (${pool - spent} left)`;
  return null;
}
export const pointsIn = (prog, job) => Object.entries(prog.skills).reduce((a, [id, n]) => a + (SKILLS[id]?.job === job ? n : 0), 0);
export const MK_POINTS = 20; // a second job of two paths (the Magic Knight) wants this many points in each path's tree
// may this hero take a second job's trial? From Job Level 40 of a first job. A second job of two
// paths needs both earned and 20 points in each one's tree. A second job of one path (BladeMaster,
// Wizard, Windrunner) opens for a hero who walked only that path, or put the most points into it
// of all the paths walked (a tie opens each tied one).
export function secondJobOpen(prog, job2) {
  const from = JOBS[job2].from;
  if (prog.tier !== 1 || prog.jobLv < SECOND_AT || !from.every((j) => prog.unlocked.includes(j))) return false;
  if (from.length > 1) return from.every((j) => pointsIn(prog, j) >= MK_POINTS);
  const firsts = prog.unlocked.filter((j) => JOBS[j]?.tier === 1);
  return firsts.length === 1 || pointsIn(prog, from[0]) >= Math.max(...firsts.map((j) => pointsIn(prog, j)));
}

// what a skill costs to use at a level
export const spCost = (id, lv) => SKILLS[id].sp?.(lv) || 0;
// a spell's cast time at a level, before FNS and Swift Chant
export const castTime = (id, lv) => SKILLS[id].cast?.(lv) || 0;
