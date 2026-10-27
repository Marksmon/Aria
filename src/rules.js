// Ragnarok Online's classic (pre-renewal) battle rules, as rAthena implements them. See
// docs/ragnarok-mechanics.md. Stat names are Aria's: POW = STR, QKN = AGI, END = VIT,
// KNL = INT, FNS = DEX, FTN = LUK.
const rnd = (n) => Math.floor(Math.random() * n); // 0 .. n-1

// Elements, Ragnarok's table at element level 1 (attack element -> defending element -> damage %).
// Monsters have an element (mobs.js el); spells and some weapons do too.
// Walking follows Ragnarok's times (ms a tile: the hero 150, a Poring 400, the Goblin Leader 120),
// all taken twice as long, as Aria's maps are smaller than Ragnarok's.
export const WALK_SCALE = 2;

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
  archer:   { hpFactor: 50, hpIncrease: 500, spIncrease: 250, delay: { fist: 500, sword: 700, bow: 600 }, weight: 2600 },
  // second jobs, modelled on Ragnarok's Knight, Wizard and Crusader
  blademaster: { hpFactor: 150, hpIncrease: 500, spIncrease: 300, delay: { fist: 380, sword: 480 }, weight: 3200 },
  wizard:      { hpFactor: 55, hpIncrease: 500, spIncrease: 900, delay: { fist: 500, sword: 620 }, weight: 2400 },
  magicknight: { hpFactor: 110, hpIncrease: 700, spIncrease: 600, delay: { fist: 420, sword: 520 }, weight: 3000 },
  moonranger:  { hpFactor: 70, hpIncrease: 500, spIncrease: 600, delay: { fist: 480, sword: 640, bow: 540 }, weight: 2600 }, // bow and spell
  beastmaster: { hpFactor: 120, hpIncrease: 500, spIncrease: 400, delay: { fist: 420, sword: 540, bow: 560 }, weight: 3200 }, // sword and bow, and the beasts
  windrunner:  { hpFactor: 85, hpIncrease: 500, spIncrease: 350, delay: { fist: 450, sword: 620, bow: 470 }, weight: 2800 }, // the Hunter's quick bow
};

function baseHp(lv, j) {
  let hp = 35 + Math.floor(lv * j.hpIncrease / 100);
  for (let i = 2; i <= lv; i++) hp += Math.floor(j.hpFactor / 100 * i + 0.5);
  return hp;
}

// Everything the battle rules need about the player, from progress (levels, stats) and gear.
// gear: { atk, wlv (weapon level, 0 = bare hands), def, mastery (flat ATK), aspdRate (1 = normal), hit, flee,
//   stats (bonus stat points), mhp / msp (extra Max HP / SP), mhpRate / mspRate (% more Max HP / SP, from cards),
//   matk (% more MATK, from staves), bow (a bow in hand: ATK from FNS, its own draw speed) }
export function derive(prog, gear) {
  const s = (k) => prog.total(k) + (gear.stats?.[k] || 0), lv = prog.baseLv, j = JOB_RULES[prog.job];
  const pow = s('pow'), qkn = s('qkn'), end = s('end'), knl = s('knl'), fns = s('fns'), ftn = s('ftn');
  // a bow draws at its own pace (a job with no bow delay of its own draws like it swings)
  // (never under 100 ms: Ragnarok's ASPD 190 cap)
  const delay = Math.max(100, (gear.wlv ? (gear.bow ? j.delay.bow ?? j.delay.sword * 1.15 : j.delay.sword) : j.delay.fist) * (1 - (4 * qkn + fns) / 1000) * (gear.aspdRate ?? 1));
  return {
    maxHp: Math.floor((Math.floor(baseHp(lv, j) * (100 + end) / 100) + (gear.mhp || 0)) * (100 + (gear.mhpRate || 0)) / 100),
    maxSp: Math.floor((Math.floor((10 + Math.floor(lv * j.spIncrease / 100)) * (100 + knl) / 100) + (gear.msp || 0)) * (100 + (gear.mspRate || 0)) / 100),
    // status ATK: from POW, or with a bow from FNS (Ragnarok's ranged rule)
    batk: gear.bow ? fns + Math.floor(fns / 10) ** 2 + Math.floor(pow / 5) + Math.floor(ftn / 5) : pow + Math.floor(pow / 10) ** 2 + Math.floor(fns / 5) + Math.floor(ftn / 5),
    watk: gear.atk || 0,
    el: gear.el || 'neutral',                     // the weapon's element
    ranged: !!gear.bow,                           // shoots (an MVP may take more or less from arrows: takes)
    wlv: gear.wlv || 0,
    fns,
    mastery: gear.mastery || 0,
    hit: lv + fns + (gear.hit || 0),
    flee: lv + qkn + (gear.flee || 0),
    crit: (10 + Math.floor(ftn * 10 / 3)) / 10 + (gear.perk?.crit || 0), // % (the Alpha Wolf Card's Keen Fangs adds to it)
    dodge: (ftn + 10) / 10 + (gear.perk?.dodge || 0), // % perfect dodge (the Goblin King Card adds to it)
    // cards' own effects (items.js card.perk): melee % harder blows up close, guard % softer blows
    // from monsters, reflect % of a blow up close back at the monster, burn % chance to set one burning
    meleeRate: gear.perk?.melee || 0,
    guard: Math.min(50, gear.perk?.guard || 0),
    reflect: gear.perk?.reflect || 0,
    burn: gear.perk?.burn || 0,
    stun: gear.perk?.stun || 0,            // % chance a hit or spell stuns (the Kobold Warlord Card)
    lifesteal: gear.perk?.lifesteal || 0,  // % of damage dealt healed (the BleepBloop Card)
    double: gear.perk?.double || 0,        // % chance a blow up close lands twice (the Goblin Warlord Card)
    pierce: gear.perk?.pierce || 0,        // % of a monster's DEF your blows go through (the Giant Beetle Card)
    sureFoot: !!gear.perk?.sureFoot,       // never slowed: spores, sticky or rubbled ground (the King Crab Card)
    fury: gear.perk?.fury || 0,            // % harder blows below 40% HP (the Great Bear Card)
    def: clamp(gear.def || 0, 0, 100),            // hard DEF from equipment
    end,                                          // soft DEF comes from END each hit
    mdef: knl + Math.floor(end / 2),
    // magic: KNL makes MATK, FNS shortens cast times (no cast at 150 FNS)
    matk: [knl + Math.floor(knl / 7) ** 2, knl + Math.floor(knl / 5) ** 2].map((v) => Math.floor(v * (100 + (gear.matk || 0)) / 100)),
    castRate: Math.max(0, 1 - fns / 150) * (1 - (gear.perk?.chant || 0) / 100), // (the Elder Willow Card's Whispering Seeds)
    aspd: Math.round(200 - delay / 10),
    interval: (2 * delay) / 1000,                 // seconds between attacks
    weight: j.weight + 30 * pow,
    // (a card's Bloom or Dream Spores: regen % faster)
    hpRegen: Math.ceil((Math.floor(end / 5) + Math.max(1, Math.floor(baseHp(lv, j) * (100 + end) / 100 / 200))) * (1 + (gear.perk?.regen || 0) / 100)),
    spRegen: Math.ceil((1 + Math.floor(knl / 6) + Math.floor((10 + Math.floor(lv * j.spIncrease / 100)) * (100 + knl) / 100 / 100)) * (1 + (gear.perk?.spRegen || 0) / 100)),
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
  if (!crit) dmg = dmg * (100 - md.def * (1 - (ps.pierce || 0) / 100)) / 100 - mobSoftDef(md.vit);
  const el = elementMod(ps.el, md.el);
  const close = !ps.beast && !ps.ranged; // a blow struck up close (the Goblin Warlord Card's)
  dmg = Math.max(1, Math.floor((Math.floor(dmg) + ps.mastery) * el * takes(md, ps.beast ? 'beast' : ps.ranged ? 'ranged' : 'melee') * (close ? 1 + (ps.meleeRate || 0) / 100 : 1)));
  return { miss: false, crit, dmg, el };
}

// A monster hits the player: perfect dodge, then hit vs FLEE, then DEF.
// Returns { miss, dodge, dmg }.
// how much of a kind of blow lands on a monster: an MVP takes more from some kinds and less from
// others (def.takes: { melee, ranged, magic, beast }), so each is easier for some jobs (mobs.js)
const takes = (md, kind) => md.takes?.[kind] ?? 1;

// opts: { sure: it can't be stepped aside from (FLEE doesn't count; a lucky dodge still does),
// pierce: the share of DEF it goes through } (an MVP's moves, mobs.js MVP_MOVE)
export function mobAttack(md, ps, atkMult = 1, opts = {}) {
  if (Math.random() * 100 < ps.dodge) return { miss: true, dodge: true, dmg: 0 };
  const hit = opts.sure ? 100 : clamp(80 + md.lv + md.dex - ps.flee, 5, 100);
  if (Math.random() * 100 >= hit) return { miss: true, dodge: false, dmg: 0 };
  let dmg = (md.atk[0] + rnd(md.atk[1] - md.atk[0] + 1)) * atkMult;
  dmg = dmg * (100 - ps.def * (1 - (opts.pierce || 0))) / 100 - playerSoftDef(ps.end);
  dmg *= 1 - (ps.guard || 0) / 100; // the Kobold King Card's Tribe's Shield
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
  return { miss: false, crit: false, dmg: Math.max(1, Math.floor(dmg * el * takes(md, 'magic'))), el };
}
