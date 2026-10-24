// Ragnarok Online's classic (pre-renewal) battle rules, as rAthena implements them. See
// docs/ragnarok-mechanics.md. Stat names are Aria's: POW = STR, QKN = AGI, END = VIT,
// KNL = INT, FNS = DEX, FTN = LUK.
const rnd = (n) => Math.floor(Math.random() * n); // 0 .. n-1

// Elements, Ragnarok's table at element level 1 (attack element -> defending element -> damage %).
// Monsters have an element (mobs.js el); spells and some weapons do too.
export const ELEMENTS = {
  neutral: { name: 'Neutral', color: '#c8c0b0' },
  water: { name: 'Water', color: '#6cc4ef' },
  earth: { name: 'Earth', color: '#b9874f' },
  fire: { name: 'Fire', color: '#ff7a2a' },
  wind: { name: 'Wind', color: '#fff27a' },
  shadow: { name: 'Shadow', color: '#a383d6' },
};
const EL_TABLE = {
  neutral: { neutral: 100, water: 100, earth: 100, fire: 100, wind: 100, shadow: 100 },
  water:   { neutral: 100, water: 25,  earth: 100, fire: 150, wind: 50,  shadow: 100 },
  earth:   { neutral: 100, water: 100, earth: 25,  fire: 50,  wind: 150, shadow: 100 },
  fire:    { neutral: 100, water: 50,  earth: 150, fire: 25,  wind: 100, shadow: 100 },
  wind:    { neutral: 100, water: 150, earth: 50,  fire: 100, wind: 25,  shadow: 100 },
  shadow:  { neutral: 100, water: 100, earth: 100, fire: 100, wind: 100, shadow: 25 },
};
// how much of an attack of element `atk` lands on a monster of element `def` (1 = all of it)
export const elementMod = (atk = 'neutral', def = 'neutral') => (EL_TABLE[atk]?.[def] ?? 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// per job: HP/SP growth, weapon delay (ms, before stats) and base carrying weight
export const JOB_RULES = {
  novice:   { hpFactor: 0,  hpIncrease: 500, spIncrease: 100, delay: { fist: 500, sword: 700 }, weight: 2000 },
  swordman: { hpFactor: 70, hpIncrease: 500, spIncrease: 200, delay: { fist: 400, sword: 550 }, weight: 2800 },
  mage:     { hpFactor: 30, hpIncrease: 500, spIncrease: 600, delay: { fist: 500, sword: 650 }, weight: 2200 },
};

function baseHp(lv, j) {
  let hp = 35 + Math.floor(lv * j.hpIncrease / 100);
  for (let i = 2; i <= lv; i++) hp += Math.floor(j.hpFactor / 100 * i + 0.5);
  return hp;
}

// Everything the battle rules need about the player, from progress (levels, stats) and gear.
// gear: { atk, wlv (weapon level, 0 = bare hands), def, mastery (flat ATK), aspdRate (1 = normal), hit, flee,
//   stats (bonus stat points), mhp / msp (extra Max HP / SP), mhpRate (% more Max HP, from cards),
//   matk (% more MATK, from staves) }
export function derive(prog, gear) {
  const s = (k) => prog.total(k) + (gear.stats?.[k] || 0), lv = prog.baseLv, j = JOB_RULES[prog.job];
  const pow = s('pow'), qkn = s('qkn'), end = s('end'), knl = s('knl'), fns = s('fns'), ftn = s('ftn');
  const delay = (gear.wlv ? j.delay.sword : j.delay.fist) * (1 - (4 * qkn + fns) / 1000) * (gear.aspdRate ?? 1);
  return {
    maxHp: Math.floor((Math.floor(baseHp(lv, j) * (100 + end) / 100) + (gear.mhp || 0)) * (100 + (gear.mhpRate || 0)) / 100),
    maxSp: Math.floor((10 + Math.floor(lv * j.spIncrease / 100)) * (100 + knl) / 100) + (gear.msp || 0),
    batk: pow + Math.floor(pow / 10) ** 2 + Math.floor(fns / 5) + Math.floor(ftn / 5), // status ATK
    watk: gear.atk || 0,
    el: gear.el || 'neutral',                     // the weapon's element
    wlv: gear.wlv || 0,
    fns,
    mastery: gear.mastery || 0,
    hit: lv + fns + (gear.hit || 0),
    flee: lv + qkn + (gear.flee || 0),
    crit: (10 + Math.floor(ftn * 10 / 3)) / 10,  // %
    dodge: (ftn + 10) / 10,                       // % perfect dodge
    def: clamp(gear.def || 0, 0, 100),            // hard DEF from equipment
    end,                                          // soft DEF comes from END each hit
    mdef: knl + Math.floor(end / 2),
    // magic: KNL makes MATK, FNS shortens cast times (no cast at 150 FNS)
    matk: [knl + Math.floor(knl / 7) ** 2, knl + Math.floor(knl / 5) ** 2].map((v) => Math.floor(v * (100 + (gear.matk || 0)) / 100)),
    castRate: Math.max(0, 1 - fns / 150),
    aspd: Math.round(200 - delay / 10),
    interval: (2 * delay) / 1000,                 // seconds between attacks
    weight: j.weight + 30 * pow,
    hpRegen: Math.floor(end / 5) + Math.max(1, Math.floor(baseHp(lv, j) * (100 + end) / 100 / 200)),
    spRegen: 1 + Math.floor(knl / 6) + Math.floor((10 + Math.floor(lv * j.spIncrease / 100)) * (100 + knl) / 100 / 100),
  };
}

// The player's END soft DEF, rolled per hit
const playerSoftDef = (end) => Math.floor(end * 0.3) + rnd(Math.max(0, Math.floor(end * end / 150) - Math.floor(end * 0.3))) + Math.floor(end * 0.5);
// A monster's VIT soft DEF, rolled per hit
const mobSoftDef = (vit) => { const r = Math.floor(vit / 20) ** 2; return vit + (r > 0 ? rnd(r) : 0); };

// The player hits a monster. mult = damage % / 100 (skill and buffs), hitMult = skill bonus on hit
// chance, skill = a skill attack (those never crit). Returns { miss, crit, dmg }.
export function playerAttack(ps, md, mult = 1, hitMult = 1, skill = false) {
  const mflee = md.lv + md.agi;
  const crit = !skill && Math.random() * 100 < ps.crit;
  if (!crit) {
    const hit = clamp((80 + ps.hit - mflee) * hitMult, 5, 100);
    if (Math.random() * 100 >= hit) return { miss: true, crit: false, dmg: 0 };
  }
  // weapon roll: FNS raises the low end; crits roll the top
  const wmin = Math.min(ps.watk, Math.floor(ps.fns * (80 + 20 * ps.wlv) / 100));
  const wdmg = crit ? ps.watk : wmin + rnd(Math.max(1, ps.watk - wmin + 1));
  let dmg = (ps.batk + wdmg) * mult;
  if (!crit) dmg = dmg * (100 - md.def) / 100 - mobSoftDef(md.vit);
  const el = elementMod(ps.el, md.el);
  dmg = Math.max(1, Math.floor((Math.floor(dmg) + ps.mastery) * el));
  return { miss: false, crit, dmg, el };
}

// A monster hits the player: perfect dodge, then hit vs FLEE, then DEF.
// Returns { miss, dodge, dmg }.
export function mobAttack(md, ps, atkMult = 1) {
  if (Math.random() * 100 < ps.dodge) return { miss: true, dodge: true, dmg: 0 };
  const hit = clamp(80 + md.lv + md.dex - ps.flee, 5, 100);
  if (Math.random() * 100 >= hit) return { miss: true, dodge: false, dmg: 0 };
  let dmg = (md.atk[0] + rnd(md.atk[1] - md.atk[0] + 1)) * atkMult;
  dmg = dmg * (100 - ps.def) / 100 - playerSoftDef(ps.end);
  return { miss: false, dodge: false, dmg: Math.max(1, Math.floor(dmg)) };
}

// A spell hits a monster: magic never misses; the monster's MDEF % and VIT soften it, and the
// spell's element against the monster's scales it. mult = the spell's damage % / 100.
// Returns { miss: false, crit: false, dmg, el (the element multiplier) }.
export function magicAttack(ps, md, mult = 1, element = 'neutral') {
  const [lo, hi] = ps.matk;
  let dmg = (lo + rnd(Math.max(1, hi - lo + 1))) * mult;
  dmg = dmg * (100 - (md.mdef || 0)) / 100 - Math.floor(md.vit / 2);
  const el = elementMod(element, md.el);
  return { miss: false, crit: false, dmg: Math.max(1, Math.floor(dmg * el)), el };
}
