// Aria's own skills, on Ragnarok-style rules: skill points from Job Levels, actives for the
// hotbar, passives, prerequisites and SP costs. Kept modest. A Trainee spends points on Basic
// Training (Lv 9 opens the two jobs) and picks up the other basics free as the Job Level rises.
// A Blader is plain sword craft; a Sorcerer casts spells from range (cast times shorten with FNS,
// magic never misses). Each buys from their own tree and gets two free passives at Job 10.
//
// kind: active (goes on the hotbar) | passive
// target: 'mob' for skills aimed at a monster; range = how close you must be (world units)
// cast: seconds to cast (spells), before FNS shortens it; magic: the spell's element (damage from MATK)
// free: { jobLv } learnt automatically; granted: learnt once its needs are met; else bought with points
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
  dodge: {
    name: 'Dodge Roll', job: 'novice', kind: 'active', max: 1, free: { jobLv: 1 }, cd: 0.75, icon: 'skill_dodge',
    desc: () => 'Dive out of the way, briefly untouchable.',
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
    name: 'Cleave', job: 'swordman', kind: 'active', max: 10, target: 'mob', range: 1.35, icon: 'skill_cleave',
    sp: (lv) => 5 + Math.floor(lv / 2),
    desc: (lv) => `A wide sweep: ${100 + 10 * lv}% damage to your target, half that to any monster beside it.`,
  },
  heavy: {
    name: 'Heavy Strike', job: 'swordman', kind: 'active', max: 10, needs: { cleave: 3 }, target: 'mob', range: 1.35, icon: 'skill_rend',
    sp: () => 8,
    desc: (lv) => `A two-handed blow: ${130 + 15 * lv}% damage, +${3 * lv}% hit chance.`,
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
    name: 'Ground Slash', job: 'swordman', kind: 'active', max: 10, needs: { heavy: 5 }, cd: 3, icon: 'skill_earthsplit',
    sp: () => 20,
    desc: (lv) => `Sweep the blade low all around you: ${100 + 10 * lv}% damage to everything close, pushing it back a little.`,
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
    name: 'Ember Bolt', job: 'mage', kind: 'active', max: 10, target: 'mob', range: 7, magic: 'fire', icon: 'skill_spark',
    sp: (lv) => 6 + lv, cast: (lv) => 0.5 + 0.1 * lv, cd: 0.6,
    desc: (lv) => `Hurl a bolt of fire: ${100 + 20 * lv}% MATK. Fire: strong against Earth, weak against Water.`,
  },
  frost: {
    name: 'Frost Shard', job: 'mage', kind: 'active', max: 10, target: 'mob', range: 7, magic: 'water', icon: 'skill_frost',
    sp: (lv) => 8 + lv, cast: (lv) => 0.6 + 0.08 * lv, cd: 0.6,
    desc: (lv) => `A shard of ice: ${90 + 10 * lv}% MATK, ${4 * lv}% chance to freeze the monster for 2.5 s. Water: strong against Fire, weak against Wind.`,
  },
  arc: {
    name: 'Arc Lightning', job: 'mage', kind: 'active', max: 10, needs: { spark: 4 }, target: 'mob', range: 7, magic: 'wind', icon: 'skill_arc',
    sp: (lv) => 12 + lv, cast: (lv) => 1 + 0.1 * lv, cd: 1,
    desc: (lv) => `Lightning strikes your target for ${80 + 10 * lv}% MATK and leaps to 2 monsters nearby for half that. Wind: strong against Water, weak against Earth.`,
  },
  flamering: {
    name: 'Flame Ring', job: 'mage', kind: 'active', max: 10, needs: { spark: 5 }, magic: 'fire', icon: 'skill_flamering',
    sp: (lv) => 20 + lv, cast: () => 1.5, cd: 3,
    desc: (lv) => `A ring of fire bursts around you: ${100 + 12 * lv}% MATK (Fire) to every monster close by.`,
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
};

// the job a job came from: both first jobs come from the Trainee
const PARENT = { swordman: 'novice', mage: 'novice' };
// a job knows its own skills and those of the jobs before it
export const jobHas = (job, skillJob) => skillJob === job || PARENT[job] === skillJob;

// skills shown in the Skills window for a job, current job first
export function skillList(job) {
  return Object.keys(SKILLS).filter((id) => jobHas(job, SKILLS[id].job))
    .sort((a, b) => (SKILLS[a].job === job ? -1 : 0) - (SKILLS[b].job === job ? -1 : 0));
}

// level the player has in a skill (0 = not learnt). prog: Progress
export function skillLv(prog, id) {
  const s = SKILLS[id];
  if (!s || !jobHas(prog.job, s.job)) return 0;
  if (s.free) return prog.job !== s.job || prog.jobLv >= s.free.jobLv ? 1 : 0;
  if (s.granted) return Object.entries(s.needs).every(([k, n]) => skillLv(prog, k) >= n) ? 1 : 0;
  return prog.skills[id] || 0;
}

// why a skill can't be raised right now, or null if it can
export function learnBlock(prog, id) {
  const s = SKILLS[id];
  if (s.free || s.granted) return 'free';
  if (prog.job !== s.job) return 'job';
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

// what a skill costs to use at a level
export const spCost = (id, lv) => SKILLS[id].sp?.(lv) || 0;
// a spell's cast time at a level, before FNS and Swift Chant
export const castTime = (id, lv) => SKILLS[id].cast?.(lv) || 0;
