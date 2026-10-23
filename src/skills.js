// Aria's own skills, on Ragnarok-style rules: skill points from Job Levels, actives for the
// hotbar, passives, prerequisites and SP costs. A Novice spends points on Wayfarer's Lore (Lv 9
// opens the Swordsman calling); the other Novice skills come free as the Job Level rises. A
// Swordsman buys from their own tree and gets two free skills at Job 10.
//
// kind: active (goes on the hotbar) | passive
// target: 'mob' for skills aimed at a monster; range = how close you must be (world units)
// free: { jobLv } learnt automatically; granted: learnt once its needs are met; else bought with points
export const SKILLS = {
  // ---------- Novice ----------
  lore: {
    name: "Wayfarer's Lore", job: 'novice', kind: 'passive', max: 9, icon: 'skill_lore',
    desc: (lv) => `+${lv} HIT and FLEE. Lv 3: you can Rest anywhere. Lv 9: you may take up a calling.`,
  },
  rest: {
    name: 'Rest', job: 'novice', kind: 'active', max: 1, needs: { lore: 3 }, granted: true, icon: 'skill_rest',
    desc: () => 'Kneel and catch your breath: HP and SP recover twice as fast. Walk to get up.',
  },
  mend: {
    name: 'Mend', job: 'novice', kind: 'active', max: 1, free: { jobLv: 1 }, sp: () => 4, cd: 2, icon: 'skill_mend',
    desc: () => 'Bind your wounds: heals 5 HP plus 8% of your Max HP.',
  },
  dodge: {
    name: 'Dodge Roll', job: 'novice', kind: 'active', max: 1, free: { jobLv: 1 }, cd: 0.75, icon: 'skill_dodge',
    desc: () => 'Dive out of the way, briefly untouchable.',
  },
  secondwind: {
    name: 'Second Wind', job: 'novice', kind: 'passive', max: 1, free: { jobLv: 3 }, icon: 'skill_secondwind',
    desc: () => 'Below 25% HP, HP recovers three times as fast.',
  },
  stone: {
    name: 'Stone Throw', job: 'novice', kind: 'active', max: 1, free: { jobLv: 4 }, target: 'mob', range: 6, sp: () => 2, cd: 1.5, icon: 'skill_stone',
    desc: () => 'Hurl a stone at a monster up to 6 paces away: 60% damage, and it comes for you.',
  },
  hush: {
    name: 'Hush', job: 'novice', kind: 'active', max: 1, free: { jobLv: 5 }, sp: () => 5, cd: 8, icon: 'skill_hush',
    desc: () => 'Crouch and go perfectly still for up to 6 s: monsters lose track of you. Moving ends it.',
  },
  quickfeet: {
    name: 'Quick Feet', job: 'novice', kind: 'passive', max: 1, free: { jobLv: 7 }, icon: 'skill_quickfeet',
    desc: () => '+5 FLEE.',
  },

  // ---------- Swordsman ----------
  discipline: {
    name: 'Blade Discipline', job: 'swordman', kind: 'passive', max: 10, icon: 'skill_discipline',
    desc: (lv) => `+${3 * lv} ATK and +${lv} HIT with swords.`,
  },
  ironhide: {
    name: 'Iron Hide', job: 'swordman', kind: 'passive', max: 10, icon: 'skill_ironhide',
    desc: (lv) => `+${lv} DEF and +${lv}% Max HP.`,
  },
  cleave: {
    name: 'Cleave', job: 'swordman', kind: 'active', max: 10, target: 'mob', range: 1.35, icon: 'skill_cleave',
    sp: (lv) => 6 + Math.floor(lv / 2),
    desc: (lv) => `A wide sweep: ${110 + 15 * lv}% damage to your target and any monster beside it.`,
  },
  rend: {
    name: 'Rending Strike', job: 'swordman', kind: 'active', max: 10, needs: { cleave: 3 }, target: 'mob', range: 1.35, icon: 'skill_rend',
    sp: () => 10,
    desc: (lv) => `One crushing blow: ${150 + 25 * lv}% damage, +${5 * lv}% hit chance. Lv 6+: may stagger.`,
  },
  warcry: {
    name: 'War Cry', job: 'swordman', kind: 'active', max: 10, cd: 6, icon: 'skill_warcry',
    sp: () => 12,
    desc: (lv) => `Roar: monsters within 6 paces turn on you, and your ATK rises ${2 * lv}% for 30 s.`,
  },
  standfirm: {
    name: 'Stand Firm', job: 'swordman', kind: 'active', max: 10, needs: { warcry: 3 }, cd: 20, icon: 'skill_standfirm',
    sp: () => 15,
    desc: (lv) => `Plant your feet for ${8 + lv} s: no flinching, ${2 * lv}% less damage taken.`,
  },
  earthsplit: {
    name: 'Earthsplitter', job: 'swordman', kind: 'active', max: 10, needs: { rend: 5 }, cd: 3, icon: 'skill_earthsplit',
    sp: () => 28,
    desc: (lv) => `Drive your blade into the ground: ${120 + 25 * lv}% damage to everything close, knocking it back.`,
  },
  rhythm: {
    name: 'Battle Rhythm', job: 'swordman', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_rhythm',
    desc: () => 'Every fourth hit that lands restores 2 SP.',
  },
  laststand: {
    name: 'Last Stand', job: 'swordman', kind: 'passive', max: 1, free: { jobLv: 10 }, icon: 'skill_laststand',
    desc: () => 'Below 25% HP: +25% ATK and 10% less damage taken.',
  },
};

const JOB_ORDER = ['novice', 'swordman'];
// a job knows its own skills and those of the jobs before it
export const jobHas = (job, skillJob) => JOB_ORDER.indexOf(skillJob) <= JOB_ORDER.indexOf(job);

// skills shown in the Skills window for a job, current job first
export function skillList(job) {
  const mine = JOB_ORDER.indexOf(job);
  return Object.keys(SKILLS).filter((id) => jobHas(job, SKILLS[id].job))
    .sort((a, b) => (JOB_ORDER.indexOf(SKILLS[a].job) === mine ? -1 : 0) - (JOB_ORDER.indexOf(SKILLS[b].job) === mine ? -1 : 0));
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
