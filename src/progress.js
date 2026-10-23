// Ragnarok-style progression (classic rules, see docs/ragnarok-mechanics.md): Base Level and
// Job Level gain EXP separately, six stats cost more points the higher they are, and each job
// level is worth a skill point. Aria's stats are Ragnarok's under its own names:
// POW = STR, QKN = AGI, END = VIT, KNL = INT, FNS = DEX, FTN = LUK.
import { BASE_EXP, JOB_EXP, MAX_BASE, MAX_JOB, statPointsAt, statCost } from './ro-tables.js';

export const STAT_KEYS = ['pow', 'qkn', 'end', 'knl', 'fns', 'ftn'];
export const STATS = {
  pow: { name: 'POW', full: 'Power', desc: 'Attack, carrying weight' },
  qkn: { name: 'QKN', full: 'Quickness', desc: 'Attack speed, flee' },
  end: { name: 'END', full: 'Endurance', desc: 'Max HP, defense, HP recovery' },
  knl: { name: 'KNL', full: 'Knowledge', desc: 'Max SP, magic defense, SP recovery' },
  fns: { name: 'FNS', full: 'Finesse', desc: 'Hit, steadier damage, attack speed' },
  ftn: { name: 'FTN', full: 'Fortune', desc: 'Critical hits, perfect dodge' },
};
// Aria's own job names (the ids stay Ragnarok's): the Trainee becomes a Blader or a Sorcerer
export const JOBS = {
  novice: { name: 'Trainee' },
  swordman: { name: 'Blader' },
  mage: { name: 'Sorcerer' },
};
// hidden stats a job adds at certain job levels: [job level, stat]
const JOB_BONUS = {
  novice: [[2, 'ftn'], [3, 'fns'], [5, 'qkn'], [6, 'end'], [8, 'pow'], [9, 'knl']],
  swordman: [[2, 'pow'], [6, 'end'], [10, 'fns'], [14, 'pow'], [18, 'end'], [22, 'fns'], [26, 'ftn'], [30, 'qkn'],
    [33, 'pow'], [36, 'fns'], [38, 'end'], [40, 'pow'], [42, 'end'], [44, 'ftn'], [46, 'qkn'], [47, 'pow'], [49, 'pow'], [50, 'pow']],
  mage: [[2, 'knl'], [6, 'qkn'], [10, 'fns'], [14, 'knl'], [18, 'qkn'], [22, 'knl'], [26, 'fns'], [30, 'knl'], [33, 'ftn'],
    [36, 'knl'], [38, 'fns'], [40, 'knl'], [42, 'qkn'], [44, 'knl'], [46, 'fns'], [47, 'knl'], [49, 'knl'], [50, 'knl']],
};

export class Progress {
  constructor() {
    this.job = 'novice';
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
  // skill points: one per job level after the first, minus skill levels learnt
  get skillPoints() {
    const learnt = Object.values(this.skills).reduce((a, b) => a + b, 0);
    return (this.jobLv - 1) + (this.job === 'novice' ? 0 : MAX_JOB.novice - 1) - learnt;
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
    return { v: 2, job: this.job, baseLv: this.baseLv, jobLv: this.jobLv, baseExp: this.baseExp, jobExp: this.jobExp, stats: this.stats, skills: this.skills };
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
    // never more spent than earned (an edited or broken save): start the stats over
    if (this.statPoints < 0) for (const k of STAT_KEYS) this.stats[k] = 1;
  }
}
