// Aria's own skills, on Ragnarok-style rules: skill points from Job Levels, actives for the
// hotbar, passives, prerequisites and SP costs. Kept modest. A Trainee spends points on Basic
// Training (Lv 9 opens the two jobs) and picks up the other basics free as the Job Level rises.
// A Blader is plain sword craft; a Sorcerer casts spells from range (cast times shorten with FNS,
// magic never misses). Each buys from their own tree and gets two free passives at Job 10.
//
// A hero who has walked several paths (see progress.js) keeps every tree they earned: passives work
// whatever job they wear, and actives too, as long as the right weapon is in hand (weapon: 'sword'
// = any weapon but a staff, 'staff' = a staff). Skill points only go into the active job's trees:
// to train the other path, switch to it at a Keeper.
//
// kind: active (goes on the hotbar) | passive
// target: 'mob' for skills aimed at a monster; range = how close you must be (world units)
// cast: seconds to cast (spells), before FNS shortens it; magic: the spell's element (damage from MATK)
// free: { jobLv } learnt automatically; granted: learnt once its needs are met; else bought with points
import { TREES, JOBS, SECOND_AT } from './progress.js';

export const SKILLS = {
  // ---------- Novice ----------
  basics: {
    name: 'Basic Training', job: 'novice', kind: 'passive', max: 9, icon: 'skill_lore',
    desc: (lv) => `+${lv} ATK. Lv 3: you can Rest. Lv 9: you may become a Blader or a Sorcerer.`,
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
    sp: () => 20, power: (lv) => 130 + 15 * lv,
    desc: (lv) => `Sweep the blade low all around you: ${SKILLS.earthsplit.power(lv)}% damage to everything close, pushing it back a little.`,
  },
  rhythm: {
    name: 'Battle Rhythm', job: 'swordman', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_rhythm',
    desc: () => 'Every fifth hit that lands restores 1 SP.',
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
    name: 'Ember Bolt', job: 'mage', kind: 'active', max: 10, target: 'mob', range: 5, magic: 'fire', weapon: 'staff', icon: 'skill_spark',
    sp: (lv) => 4 + lv, cast: (lv) => 0.5 + 0.1 * lv, cd: 0.6, power: (lv) => 70 + 12 * lv,
    desc: (lv) => `Hurl a bolt of fire: ${SKILLS.spark.power(lv)}% MATK. Fire: strong against Earth, weak against Water.`,
  },
  frost: {
    name: 'Frost Shard', job: 'mage', kind: 'active', max: 10, target: 'mob', range: 5, magic: 'water', weapon: 'staff', icon: 'skill_frost',
    sp: (lv) => 6 + lv, cast: (lv) => 0.6 + 0.08 * lv, cd: 0.6, power: (lv) => 60 + 8 * lv,
    desc: (lv) => `A shard of ice: ${SKILLS.frost.power(lv)}% MATK, ${4 * lv}% chance to freeze the monster for 2.5 s. Water: strong against Fire, weak against Wind.`,
  },
  arc: {
    name: 'Arc Lightning', job: 'mage', kind: 'active', max: 10, needs: { spark: 4 }, target: 'mob', range: 5, magic: 'wind', weapon: 'staff', icon: 'skill_arc',
    sp: (lv) => 10 + lv, cast: (lv) => 1 + 0.1 * lv, cd: 1, power: (lv) => 60 + 7 * lv,
    desc: (lv) => `Lightning strikes your target for ${SKILLS.arc.power(lv)}% MATK and leaps to 2 monsters nearby for half that. Wind: strong against Water, weak against Earth.`,
  },
  flamering: {
    name: 'Flame Ring', job: 'mage', kind: 'active', max: 10, needs: { spark: 5 }, magic: 'fire', weapon: 'staff', icon: 'skill_flamering',
    sp: (lv) => 16 + lv, cast: () => 1.5, cd: 3, power: (lv) => 70 + 8 * lv,
    desc: (lv) => `A ring of fire bursts around you: ${SKILLS.flamering.power(lv)}% MATK (Fire) to every monster close by.`,
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

  // ---------- BladeMaster (from the Blader): one target, cut down fast. Blade skills may Combo
  // (a free extra strike); each Combo adds a Momentum stack; Final Blade spends the stacks ----------
  blademastery: {
    name: 'Blade Mastery', job: 'blademaster', kind: 'passive', max: 10, icon: 'skill_discipline',
    desc: (lv) => `+${3 * lv} ATK and +${lv} HIT with swords.`,
  },
  comboedge: {
    name: 'Combo Edge', job: 'blademaster', kind: 'passive', max: 10, icon: 'skill_rhythm',
    desc: (lv) => `Thrust, Cleave, Heavy Strike, Twin Fang and Piercing Edge have a ${4 * lv}% chance to Combo: a free extra strike for 100% damage.`,
  },
  momentum: {
    name: 'Momentum', job: 'blademaster', kind: 'passive', max: 5, needs: { comboedge: 3 }, icon: 'skill_warcry',
    desc: (lv) => `Each Combo adds a Momentum stack (up to 5, 8 s): +${lv}% ATK per stack. Final Blade spends them all.`,
  },
  twinfang: {
    name: 'Twin Fang', job: 'blademaster', kind: 'active', max: 10, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_cleave',
    sp: (lv) => 6 + Math.floor(lv / 2), cd: 0.8, power: (lv) => 130 + 16 * lv,
    desc: (lv) => `Two quick cuts, ${SKILLS.twinfang.power(lv)}% damage each. Each cut can Combo.`,
  },
  pierce: {
    name: 'Piercing Edge', job: 'blademaster', kind: 'active', max: 10, needs: { twinfang: 3 }, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_thrust',
    sp: (lv) => 9 + lv, cd: 1.5, power: (lv) => 280 + 38 * lv,
    desc: (lv) => `A thrust that finds the gaps: ${SKILLS.pierce.power(lv)}% damage, ignoring half the monster's DEF.`,
  },
  finalblade: {
    name: 'Final Blade', job: 'blademaster', kind: 'active', max: 5, needs: { pierce: 5, momentum: 1 }, target: 'mob', range: 1.35, weapon: 'sword', icon: 'skill_laststand',
    sp: (lv) => 20 + 2 * lv, cd: 6, power: (lv, stacks = 0) => 450 + 90 * lv + 60 * stacks,
    desc: (lv) => `Spend every Momentum stack on one blow: ${SKILLS.finalblade.power(lv)}% damage, +60% for each stack.`,
  },

  // ---------- Wizard (from the Sorcerer): elements, over an area. Changing element from one spell
  // to the next builds Resonance; Stone Spike shatters a monster for the next spell ----------
  attune: {
    name: 'Elemental Attunement', job: 'wizard', kind: 'passive', max: 10, icon: 'skill_manawell',
    desc: (lv) => `Spells deal ${3 * lv}% more damage, and a further ${3 * lv}% to a monster weak to their element.`,
  },
  resonance: {
    name: 'Resonance', job: 'wizard', kind: 'passive', max: 5, needs: { attune: 3 }, icon: 'skill_swiftchant',
    desc: (lv) => `A spell of a different element from your last one (within 8 s) deals ${6 * lv}% more damage.`,
  },
  stonespike: {
    name: 'Stone Spike', job: 'wizard', kind: 'active', max: 10, target: 'mob', range: 5, magic: 'earth', weapon: 'staff', icon: 'skill_stone',
    sp: (lv) => 10 + lv, cast: (lv) => 0.8 + 0.05 * lv, cd: 0.6, power: (lv) => 100 + 14 * lv,
    desc: (lv) => `A spike of rock bursts under the monster: ${SKILLS.stonespike.power(lv)}% MATK (Earth), and it is Shattered for 6 s: the next spell of another element on it deals 30% more. Earth: strong against Wind, weak against Fire.`,
  },
  quake: {
    name: 'Earthquake', job: 'wizard', kind: 'active', max: 10, needs: { stonespike: 3 }, target: 'mob', range: 5, magic: 'earth', weapon: 'staff', icon: 'skill_earthsplit',
    sp: (lv) => 30 + 2 * lv, cast: () => 1.6, cd: 3, power: (lv) => 70 + 9 * lv,
    desc: (lv) => `The ground heaves around your target: ${SKILLS.quake.power(lv)}% MATK (Earth) to every monster within 3 paces of it; 25% of them are stunned for 1.5 s.`,
  },
  meteor: {
    name: 'Meteor Storm', job: 'wizard', kind: 'active', max: 10, needs: { spark: 5 }, target: 'mob', range: 5, magic: 'fire', weapon: 'staff', icon: 'skill_flamering',
    sp: (lv) => 40 + 2 * lv, cast: (lv) => 2.2 + 0.05 * lv, cd: 4, power: (lv) => 45 + 6 * lv,
    desc: (lv) => `Three meteors fall around your target: ${SKILLS.meteor.power(lv)}% MATK (Fire) each to every monster within 3 paces.`,
  },
  stormgust: {
    name: 'Storm Gust', job: 'wizard', kind: 'active', max: 10, needs: { frost: 5 }, target: 'mob', range: 5, magic: 'water', weapon: 'staff', icon: 'skill_frost',
    sp: (lv) => 36 + 2 * lv, cast: () => 2.0, cd: 4, power: (lv) => 70 + 9 * lv,
    desc: (lv) => `A freezing storm around your target: ${SKILLS.stormgust.power(lv)}% MATK (Water) to every monster within 3 paces, ${3 * lv}% chance each to freeze for 2.5 s.`,
  },
  thunder: {
    name: 'Thunderstorm', job: 'wizard', kind: 'active', max: 10, needs: { arc: 5 }, target: 'mob', range: 5, magic: 'wind', weapon: 'staff', icon: 'skill_arc',
    sp: (lv) => 32 + 2 * lv, cast: () => 1.7, cd: 3, power: (lv) => 70 + 9 * lv,
    desc: (lv) => `Lightning rains around your target: ${SKILLS.thunder.power(lv)}% MATK (Wind) to every monster within 3 paces.`,
  },

  // ---------- Magic Knight (Blader and Sorcerer both walked): elemental sword skills that hit with
  // ATK and MATK together, and a rune barrier made of both. Changing element builds an Elemental Chain ----------
  spellblade: {
    name: 'Spellblade', job: 'magicknight', kind: 'passive', max: 10, icon: 'skill_ward',
    desc: (lv) => `Your sword attacks add ${3 * lv}% of your MATK.`,
  },
  elemchain: {
    name: 'Elemental Chain', job: 'magicknight', kind: 'passive', max: 5, needs: { spellblade: 3 }, icon: 'skill_rhythm',
    desc: (lv) => `An Edge of a different element from your last one (within 6 s) deals ${6 * lv}% more damage and gives back 3 SP.`,
  },
  flameedge: {
    name: 'Flame Edge', job: 'magicknight', kind: 'active', max: 10, target: 'mob', range: 1.35, weapon: 'sword', magic: 'fire', edge: true, icon: 'skill_spark',
    sp: (lv) => 6 + lv, cd: 0.8, power: (lv) => 170 + 16 * lv, mpower: (lv) => 90 + 13 * lv,
    desc: (lv) => `A burning cut: ${SKILLS.flameedge.power(lv)}% ATK and ${SKILLS.flameedge.mpower(lv)}% MATK, as Fire.`,
  },
  frostedge: {
    name: 'Frost Edge', job: 'magicknight', kind: 'active', max: 10, target: 'mob', range: 1.35, weapon: 'sword', magic: 'water', edge: true, icon: 'skill_frost',
    sp: (lv) => 6 + lv, cd: 0.8, power: (lv) => 160 + 16 * lv, mpower: (lv) => 100 + 13 * lv,
    desc: (lv) => `A freezing thrust: ${SKILLS.frostedge.power(lv)}% ATK and ${SKILLS.frostedge.mpower(lv)}% MATK, as Water; ${3 * lv}% chance to freeze for 2 s.`,
  },
  thunderedge: {
    name: 'Thunder Edge', job: 'magicknight', kind: 'active', max: 10, needs: { flameedge: 3, frostedge: 3 }, target: 'mob', range: 1.35, weapon: 'sword', magic: 'wind', edge: true, icon: 'skill_arc',
    sp: (lv) => 12 + lv, cd: 1.2, power: (lv) => 150 + 16 * lv, mpower: (lv) => 90 + 13 * lv,
    desc: (lv) => `A crackling sweep: ${SKILLS.thunderedge.power(lv)}% ATK and ${SKILLS.thunderedge.mpower(lv)}% MATK, as Wind, and half that to monsters beside your target.`,
  },
  aegis: {
    name: 'Stone Aegis', job: 'magicknight', kind: 'active', max: 10, needs: { spellblade: 1 }, cd: 25, icon: 'skill_ironhide',
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

// the weapon an active skill needs in hand, and whether it is there ('sword' = any weapon but a
// staff; bare hands count as a sword for this)
export const WEAPON_NAMES = { sword: 'a sword', staff: 'a staff' };
export const weaponOk = (id, weaponKind) => !SKILLS[id].weapon || SKILLS[id].weapon === weaponKind;

// why a skill can't be raised right now, or null if it can
export function learnBlock(prog, id) {
  const s = SKILLS[id];
  if (s.free || s.granted) return 'free';
  if (!TREES[prog.job].includes(s.job)) return 'job'; // points only go to the active job's trees (switch at a Keeper)
  if (skillLv(prog, id) >= s.max) return 'max';
  for (const [k, n] of Object.entries(s.needs || {})) if (skillLv(prog, k) < n) return `Needs ${SKILLS[k].name} ${n}`;
  if (prog.skillPoints <= 0) return 'points';
  return null;
}

export function learn(prog, id) {
  if (learnBlock(prog, id)) return false;
  prog.skills[id] = (prog.skills[id] || 0) + 1;
  return true;
}

// skill points spent in one job's tree
export const pointsIn = (prog, job) => Object.entries(prog.skills).reduce((a, [id, n]) => a + (SKILLS[id]?.job === job ? n : 0), 0);
export const MK_POINTS = 20; // the Magic Knight wants this many points in both the Blader's and the Sorcerer's tree
// may this hero take a second job's trial? From Job Level 40 of a first job. The Magic Knight needs
// 20 points in each first job's tree. A hero who walked both first paths may take the BladeMaster
// or Wizard trial only for the first job they put the most points into (a tie opens both).
export function secondJobOpen(prog, job2) {
  const from = JOBS[job2].from;
  if (prog.tier !== 1 || prog.jobLv < SECOND_AT || !from.every((j) => prog.unlocked.includes(j))) return false;
  const pts = { swordman: pointsIn(prog, 'swordman'), mage: pointsIn(prog, 'mage') };
  const both = pts.swordman >= MK_POINTS && pts.mage >= MK_POINTS;
  if (from.length > 1) return both;
  const other = from[0] === 'swordman' ? 'mage' : 'swordman';
  return !prog.unlocked.includes(other) || pts[from[0]] >= pts[other];
}

// what a skill costs to use at a level
export const spCost = (id, lv) => SKILLS[id].sp?.(lv) || 0;
// a spell's cast time at a level, before FNS and Swift Chant
export const castTime = (id, lv) => SKILLS[id].cast?.(lv) || 0;
