// Ragnarok-style progression (classic rules, see docs/ragnarok-mechanics.md): Base Level and
// Job Level gain EXP separately, six stats cost more points the higher they are, and each job
// level is worth a skill point. Aria's stats are Ragnarok's under its own names:
// POW = STR, QKN = AGI, END = VIT, KNL = INT, FNS = DEX, FTN = LUK.
import { BASE_EXP, JOB_EXP, MAX_BASE, MAX_JOB, statPointsAt, statCost } from './ro-tables.js';

// server rates, like a Ragnarok server's "x4 / x4": every Base and Job EXP gain (monsters, MVPs,
// quests) is multiplied. 4x makes for a quicker climb than Ragnarok's own 1x pace.
export const RATES = { base: 4, job: 4 };
export const STAT_KEYS = ['pow', 'qkn', 'end', 'knl', 'fns', 'ftn'];
export const STATS = {
  pow: { name: 'POW', full: 'Power', desc: 'Attack, carrying weight' },
  qkn: { name: 'QKN', full: 'Quickness', desc: 'Attack speed, flee' },
  end: { name: 'END', full: 'Endurance', desc: 'Max HP, defense, HP recovery' },
  knl: { name: 'KNL', full: 'Knowledge', desc: 'Max SP, magic defense, SP recovery' },
  fns: { name: 'FNS', full: 'Finesse', desc: 'Hit, steadier damage, attack speed' },
  ftn: { name: 'FTN', full: 'Fortune', desc: 'Critical hits, perfect dodge' },
};
// Aria's own job names (the ids of the first jobs stay Ragnarok's): the Trainee becomes a Blader or
// a Sorcerer (tier 1), and either can later take a second job (tier 2). A hero may walk both first
// paths: they share one Job Level and one pool of skill points, and switch between them at their
// trainers. Walking both opens the Magic Knight.
export const JOBS = {
  novice: { name: 'Trainee', tier: 0 },
  swordman: { name: 'Blader', tier: 1 },
  mage: { name: 'Sorcerer', tier: 1 },
  blademaster: { name: 'BladeMaster', tier: 2, from: ['swordman'] },
  wizard: { name: 'Wizard', tier: 2, from: ['mage'] },
  magicknight: { name: 'Magic Knight', tier: 2, from: ['swordman', 'mage'] }, // needs both first jobs
};
export const SECOND_AT = 40; // the first-job Job Level a second job's trial asks for
// the skill trees a job stands on: its own and those of the jobs before it
export const TREES = {
  novice: ['novice'], swordman: ['swordman', 'novice'], mage: ['mage', 'novice'],
  blademaster: ['blademaster', 'swordman', 'novice'], wizard: ['wizard', 'mage', 'novice'],
  magicknight: ['magicknight', 'swordman', 'mage', 'novice'],
};
// hidden stats a job adds at certain job levels: [job level, stat]
const JOB_BONUS = {
  novice: [[2, 'ftn'], [3, 'fns'], [5, 'qkn'], [6, 'end'], [8, 'pow'], [9, 'knl']],
  swordman: [[2, 'pow'], [6, 'end'], [10, 'fns'], [14, 'pow'], [18, 'end'], [22, 'fns'], [26, 'ftn'], [30, 'qkn'],
    [33, 'pow'], [36, 'fns'], [38, 'end'], [40, 'pow'], [42, 'end'], [44, 'ftn'], [46, 'qkn'], [47, 'pow'], [49, 'pow'], [50, 'pow']],
  mage: [[2, 'knl'], [6, 'qkn'], [10, 'fns'], [14, 'knl'], [18, 'qkn'], [22, 'knl'], [26, 'fns'], [30, 'knl'], [33, 'ftn'],
    [36, 'knl'], [38, 'fns'], [40, 'knl'], [42, 'qkn'], [44, 'knl'], [46, 'fns'], [47, 'knl'], [49, 'knl'], [50, 'knl']],
  // second jobs carry more, like Ragnarok's
  blademaster: [[1, 'pow'], [3, 'fns'], [5, 'pow'], [7, 'qkn'], [9, 'pow'], [11, 'end'], [13, 'fns'], [15, 'pow'], [17, 'qkn'], [19, 'ftn'],
    [21, 'pow'], [23, 'fns'], [25, 'pow'], [27, 'end'], [29, 'qkn'], [31, 'pow'], [33, 'fns'], [35, 'pow'], [37, 'qkn'], [39, 'ftn'],
    [41, 'pow'], [43, 'fns'], [45, 'pow'], [47, 'end'], [49, 'pow'], [50, 'qkn']],
  wizard: [[1, 'knl'], [3, 'fns'], [5, 'knl'], [7, 'qkn'], [9, 'knl'], [11, 'fns'], [13, 'knl'], [15, 'end'], [17, 'knl'], [19, 'fns'],
    [21, 'knl'], [23, 'ftn'], [25, 'knl'], [27, 'fns'], [29, 'knl'], [31, 'qkn'], [33, 'knl'], [35, 'fns'], [37, 'knl'], [39, 'end'],
    [41, 'knl'], [43, 'fns'], [45, 'knl'], [47, 'fns'], [49, 'knl'], [50, 'knl']],
  magicknight: [[1, 'pow'], [3, 'knl'], [5, 'end'], [7, 'pow'], [9, 'knl'], [11, 'fns'], [13, 'pow'], [15, 'knl'], [17, 'end'], [19, 'pow'],
    [21, 'knl'], [23, 'fns'], [25, 'pow'], [27, 'knl'], [29, 'end'], [31, 'pow'], [33, 'knl'], [35, 'qkn'], [37, 'pow'], [39, 'knl'],
    [41, 'end'], [43, 'pow'], [45, 'knl'], [47, 'fns'], [49, 'pow'], [50, 'knl']],
};

export class Progress {
  constructor() {
    this.job = 'novice';
    this.unlocked = []; // first and second jobs earned through their trials
    this.firstLv = 1;   // the first-job Job Level, kept once a second job is taken
    this.baseLv = 1;
    this.jobLv = 1;
    this.baseExp = 0; // towards the next level
    this.jobExp = 0;
    this.stats = { pow: 1, qkn: 1, end: 1, knl: 1, fns: 1, ftn: 1 };
    this.skills = {};  // skill id -> level (stage 2)
  }

  get baseNeed() { return BASE_EXP[this.baseLv - 1] ?? Infinity; }
  get jobNeed() { return JOB_EXP[this.job][this.jobLv - 1] ?? Infinity; }
  get baseMaxed() { return this.baseLv >= MAX_BASE; }
  get jobMaxed() { return this.jobLv >= MAX_JOB[this.job]; }

  // stat points: what the base level has earned minus what the stats have cost
  get statPoints() {
    let spent = 0;
    for (const k of STAT_KEYS) for (let v = 1; v < this.stats[k]; v++) spent += statCost(v);
    return statPointsAt(this.baseLv) - spent;
  }
  get tier() { return JOBS[this.job].tier; }
  // the Job Level a tier of jobs has reached: the Trainee's, the first jobs' (shared by Blader and
  // Sorcerer), the second job's
  levelOf(job) {
    const tier = JOBS[job].tier;
    if (tier === 0) return this.tier === 0 ? this.jobLv : MAX_JOB.novice;
    if (tier === 1) return this.tier === 1 ? this.jobLv : this.tier === 2 ? this.firstLv : 0;
    return this.job === job ? this.jobLv : 0;
  }
  // the skill trees open to this hero: the current job's, and every job earned on the way
  get trees() {
    const t = new Set(TREES[this.job]);
    for (const j of this.unlocked) for (const k of TREES[j] || []) t.add(k);
    return t;
  }
  // the jobs whose gear this hero may wear: the current job and every first or second job earned
  get wearJobs() { return this.job === 'novice' ? ['novice'] : [...new Set([this.job, ...this.unlocked, ...(JOBS[this.job].from || [])])]; }
  // skill points: one per job level after the first in every tier walked (both first jobs share
  // theirs), minus skill levels learnt in any tree
  get skillPoints() {
    const learnt = Object.values(this.skills).reduce((a, b) => a + b, 0);
    if (this.tier === 0) return this.jobLv - 1 - learnt;
    const earned = (MAX_JOB.novice - 1) + (this.levelOf('swordman') - 1) + (this.tier === 2 ? this.jobLv - 1 : 0);
    return earned - learnt;
  }
  // a first job taken (or switched to): the Job Level is shared, so it carries over
  takeFirst(job) {
    if (this.tier === 0) { this.jobLv = 1; this.jobExp = 0; }
    if (!this.unlocked.includes(job)) this.unlocked.push(job);
    this.job = job;
  }
  // a second job: the first-job level is kept for its skill points, Job Level starts again at 1
  takeSecond(job) {
    this.firstLv = this.jobLv;
    if (!this.unlocked.includes(job)) this.unlocked.push(job);
    this.job = job;
    this.jobLv = 1;
    this.jobExp = 0;
  }

  // stat with the job's hidden bonus
  total(k) {
    const bonus = JOB_BONUS[this.job].filter(([lv, s]) => s === k && lv <= this.jobLv).length;
    return this.stats[k] + bonus;
  }
  bonus(k) { return this.total(k) - this.stats[k]; }

  costOf(k) { return statCost(this.stats[k]); }
  raise(k) {
    if (!STAT_KEYS.includes(k) || this.stats[k] >= 99 || this.costOf(k) > this.statPoints) return false;
    this.stats[k]++;
    return true;
  }

  // returns { base, job }: how many levels of each were gained
  gain(baseExp, jobExp) {
    const ups = { base: 0, job: 0 };
    if (!this.baseMaxed) {
      this.baseExp += baseExp;
      while (!this.baseMaxed && this.baseExp >= this.baseNeed) { this.baseExp -= this.baseNeed; this.baseLv++; ups.base++; }
      if (this.baseMaxed) this.baseExp = 0;
    }
    if (!this.jobMaxed) {
      this.jobExp += jobExp;
      while (!this.jobMaxed && this.jobExp >= this.jobNeed) { this.jobExp -= this.jobNeed; this.jobLv++; ups.job++; }
      if (this.jobMaxed) this.jobExp = 0;
    }
    return ups;
  }

  // dying costs 1% of the EXP needed for the current base and job level (never below 0)
  deathPenalty() {
    const lost = { base: 0, job: 0 };
    if (!this.baseMaxed) { lost.base = Math.min(this.baseExp, Math.floor(this.baseNeed * 0.01)); this.baseExp -= lost.base; }
    if (!this.jobMaxed) { lost.job = Math.min(this.jobExp, Math.floor(this.jobNeed * 0.01)); this.jobExp -= lost.job; }
    return lost;
  }

  toJSON() {
    return { v: 2, job: this.job, unlocked: this.unlocked, firstLv: this.firstLv, baseLv: this.baseLv, jobLv: this.jobLv, baseExp: this.baseExp, jobExp: this.jobExp, stats: this.stats, skills: this.skills };
  }
  load(d) {
    if (!d) return;
    if (d.v !== 2) {
      // saves from before the Ragnarok rules: keep the level, give its stat points back to spend
      this.baseLv = Math.max(1, Math.min(MAX_BASE, d.level | 0));
      return;
    }
    this.job = JOBS[d.job] ? d.job : 'novice';
    this.baseLv = Math.max(1, Math.min(MAX_BASE, d.baseLv | 0));
    this.jobLv = Math.max(1, Math.min(MAX_JOB[this.job], d.jobLv | 0));
    this.baseExp = Math.max(0, +d.baseExp || 0);
    this.jobExp = Math.max(0, +d.jobExp || 0);
    for (const k of STAT_KEYS) this.stats[k] = Math.max(1, Math.min(99, d.stats?.[k] | 0 || 1));
    this.skills = { ...(d.skills || {}) };
    // saves from before the second jobs: the first job held is the one earned
    this.unlocked = (d.unlocked || (this.tier === 1 ? [this.job] : [])).filter((j) => JOBS[j] && j !== 'novice');
    this.firstLv = Math.max(1, Math.min(MAX_JOB.swordman, d.firstLv | 0 || (this.tier === 1 ? this.jobLv : 1)));
    // never more spent than earned (an edited or broken save): start the stats over
    if (this.statPoints < 0) for (const k of STAT_KEYS) this.stats[k] = 1;
  }
}
