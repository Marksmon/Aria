// Experience, levels and stat points. Each level gives one point for STR, AGI or VIT.
export const MAX_LEVEL = 15;

export const STATS = {
  str: { name: 'STR', desc: '+8% damage' },
  agi: { name: 'AGI', desc: '+4% swing speed, +1.5% move speed' },
  vit: { name: 'VIT', desc: '+1 heart every 3 points' },
};

// experience needed to go from level lv to lv + 1
export const xpToNext = (lv) => Math.round(8 * Math.pow(lv, 1.6));

export class Progress {
  constructor() {
    this.level = 1;
    this.xp = 0;     // towards the next level
    this.points = 0; // unspent
    this.stats = { str: 0, agi: 0, vit: 0 };
  }

  get maxed() { return this.level >= MAX_LEVEL; }
  get need() { return xpToNext(this.level); }

  // returns how many levels were gained
  gain(n) {
    if (this.maxed) return 0;
    this.xp += n;
    let ups = 0;
    while (!this.maxed && this.xp >= this.need) {
      this.xp -= this.need;
      this.level++;
      this.points++;
      ups++;
    }
    if (this.maxed) this.xp = 0;
    return ups;
  }

  raise(stat) {
    if (this.points <= 0 || !(stat in this.stats)) return false;
    this.points--;
    this.stats[stat]++;
    return true;
  }

  toJSON() { return { level: this.level, xp: this.xp, points: this.points, stats: this.stats }; }
  load(d) {
    if (!d) return;
    this.level = Math.max(1, Math.min(MAX_LEVEL, d.level | 0));
    this.xp = Math.max(0, +d.xp || 0);
    for (const k of Object.keys(this.stats)) this.stats[k] = Math.max(0, d.stats?.[k] | 0);
    // points are whatever the level has earned and the stats have not used
    const spent = Object.values(this.stats).reduce((a, b) => a + b, 0);
    this.points = Math.max(0, this.level - 1 - spent);
  }
}
