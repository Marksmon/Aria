// Goals (the 🏆 button, the owner's call): three weekly hunts that change every Monday, picked for the hero's
// level, each paid the moment it is done; and achievements, one-time milestones, each with a title the hero can
// wear after their name. Kept per hero (the save's goals). Pure: main.js feeds it the game's events and state.

export const WEEK_MS = 7 * 864e5;
const WEEK0 = Date.UTC(2026, 0, 5); // a Monday
export const weekOf = (now = Date.now()) => Math.floor((now - WEEK0) / WEEK_MS);
export const weekEnds = (week) => WEEK0 + (week + 1) * WEEK_MS;
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// the weekly hunts: who may get each, how many, and what it says
export const WEEKLY = {
  near: { ok: () => true, n: (lv) => (lv < 30 ? 60 : 100), text: (g) => `Beat ${g.n} monsters within 8 levels of yours` },
  kind: { ok: () => true, n: (lv) => (lv < 30 ? 30 : 50), text: (g) => `Beat ${g.n} ${g.name}` },
  quests: { ok: () => true, n: () => 4, text: (g) => `Hand in ${g.n} quests` },
  refine: { ok: (lv) => lv >= 20, n: () => 3, text: (g) => `Refine gear ${g.n} times (a try that holds)` },
  raid: { ok: (lv) => lv >= 40, n: () => 1, text: () => 'Clear a raid on Easy or harder' },
  miniboss: { ok: (lv, tier) => tier >= 2, n: () => 2, text: (g) => `Beat ${g.n} mini-bosses` },
  mvp: { ok: (lv, tier) => tier >= 2 && lv >= 75, n: () => 1, text: () => 'Beat an MVP' },
};
// a week's pay: perz by Base Level (more for the hard ones), and from Base 30 a precious ore
export function weeklyReward(kind, lv) {
  const k = { mvp: 3, raid: 2, miniboss: 2 }[kind] || 1;
  const perz = Math.round(lv * lv * 6 * k / 100) * 100 + 500;
  const items = lv >= 30 ? { [kind === 'refine' || kind === 'mvp' ? 'hard_ore' : 'armor_ore']: kind === 'mvp' ? 3 : 1 } : {};
  return { perz, items };
}
// the week's three hunts for a hero: kinds: the monster types near its level, { type: name }
export function makeWeek(week, lv, tier, kinds, salt = 0) {
  const r = rng(week * 7919 + salt), pool = Object.keys(WEEKLY).filter((k) => WEEKLY[k].ok(lv, tier));
  const goals = [];
  while (goals.length < 3 && pool.length) {
    const kind = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const g = { kind, n: WEEKLY[kind].n(lv), have: 0, done: false };
    if (kind === 'kind') {
      const types = Object.keys(kinds);
      if (!types.length) continue;
      g.type = types[Math.floor(r() * types.length)];
      g.name = kinds[g.type];
    }
    goals.push(g);
  }
  return { week, lv, goals };
}

// the achievements: id, title (worn after the name), what earns it, and its check on the game's state (ctx)
export const ACHIEVEMENTS = [
  { id: 'firstjob', title: 'the Sworn', text: 'Take a first job', check: (c) => c.tier >= 1 },
  { id: 'fourpaths', title: 'of Four Paths', text: 'Walk all four first jobs', check: (c) => c.firsts >= 4 },
  { id: 'secondjob', title: 'the Ascended', text: 'Take a second job', check: (c) => c.tier >= 2 },
  { id: 'base50', title: 'the Seasoned', text: 'Reach Base Level 50', check: (c) => c.baseLv >= 50 },
  { id: 'base75', title: 'the Veteran', text: 'Reach Base Level 75', check: (c) => c.baseLv >= 75 },
  { id: 'base99', title: 'the Legend', text: 'Reach Base Level 99', check: (c) => c.baseLv >= 99 },
  { id: 'miniboss', title: 'the Bold', text: 'Beat a mini-boss', check: (c) => c.minis >= 1 },
  { id: 'mvp', title: 'Kingslayer', text: 'Beat an MVP', check: (c) => c.mvps >= 1 },
  { id: 'allmvps', title: 'Bane of Giants', text: 'Beat every MVP', check: (c) => c.mvpKinds >= c.mvpTotal },
  { id: 'raid', title: 'the Raider', text: 'Clear a raid on Easy or harder', check: (c) => c.raidClears >= 1 },
  { id: 'hell', title: 'Hellwalker', text: 'Clear a raid on Hell', check: (c) => c.hellClears >= 1 },
  { id: 'wayfarer', title: 'the Wayfarer', text: 'Walk every land of Aria', check: (c) => c.landsWalked >= c.landsTotal },
  { id: 'naturalist', title: 'the Naturalist', text: 'Meet 50 kinds of monster (Monster Album)', check: (c) => c.met >= 50 },
  { id: 'collector', title: 'the Collector', text: 'Finish an album set', check: (c) => c.sets >= 1 },
  { id: 'archivist', title: 'the Archivist', text: 'Finish every album set', check: (c) => c.sets >= c.setsTotal },
  { id: 'anvil', title: 'Master of the Anvil', text: 'Refine a piece to +10', check: (c) => c.bestRefine >= 10 },
  { id: 'secrets', title: 'Keeper of Secrets', text: "Open both secret ways: the Sphinx's and the World Tree's", check: (c) => c.secrets >= 2 },
  { id: 'hero', title: 'Hero of Eldrun', text: 'Finish the main story', check: (c) => c.storyDone },
];

export class Goals {
  constructor() { this.weekly = null; this.ach = {}; this.title = null; this.bestRefine = 0; }
  // a new week (or none yet): fresh hunts at the hero's level
  ensureWeek(now, lv, tier, kinds, salt) {
    const w = weekOf(now);
    if (!this.weekly || this.weekly.week !== w) { this.weekly = makeWeek(w, lv, tier, kinds, salt); return true; }
    return false;
  }
  // an event: { kind: 'kill', lv, type, boss, mvp, heroLv } | { kind: 'raid' } | { kind: 'refine' } | { kind: 'quest' };
  // returns the hunts it finished (to be paid)
  on(ev) {
    const out = [];
    for (const g of this.weekly?.goals || []) {
      if (g.done) continue;
      const hit = ev.kind === 'kill' ? (g.kind === 'near' && Math.abs(ev.lv - ev.heroLv) <= 8 && !ev.boss && !ev.mvp) || (g.kind === 'kind' && ev.type === g.type)
          || (g.kind === 'miniboss' && ev.boss && !ev.mvp) || (g.kind === 'mvp' && ev.mvp)
        : g.kind === ev.kind;
      if (!hit) continue;
      g.have = Math.min(g.n, g.have + 1);
      if (g.have >= g.n) { g.done = true; out.push(g); }
    }
    return out;
  }
  // the achievements newly earned on this state (stamped with when)
  check(ctx, now = Date.now()) {
    const out = [];
    for (const a of ACHIEVEMENTS) if (!this.ach[a.id] && a.check(ctx)) { this.ach[a.id] = now; out.push(a); }
    return out;
  }
  toJSON() { return { weekly: this.weekly, ach: this.ach, title: this.title, bestRefine: this.bestRefine }; }
  load(d) {
    if (!d || typeof d !== 'object') return;
    this.weekly = d.weekly && Array.isArray(d.weekly.goals) ? d.weekly : null;
    this.ach = d.ach && typeof d.ach === 'object' ? d.ach : {};
    this.title = ACHIEVEMENTS.some((a) => a.title === d.title && this.ach[a.id]) ? d.title : null;
    this.bestRefine = d.bestRefine | 0;
  }
}
