import * as THREE from 'three';
import './style.css';
import { createSprites } from './sprites.js';
import { buildWorld, ZONE_NAMES, MAPS, WATER_Y } from './world.js';
import { CITY, MAGIC, HUNT } from './city.js';
import { paintBow } from './bow.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { FX } from './fx.js';
import { MobManager, MOB_DEFS, MOVES, MVP_MOVE, fierce, guardDef, raidDef } from './mobs.js';
import { Allies, ROAR } from './allies.js';
import { RAIDS, rollReward } from './raid.js';
import { loadSave, writeSave, loadStorage, writeStorage, clearSave, saveCode, loadCode, SLOTS, activeSlot, setActiveSlot } from './save.js';
import { Inventory } from './inventory.js';
import { Progress, JOBS, RATES, QUEST_RATE, STAT_KEYS } from './progress.js';
import { Quests, QUESTS, NPCS, FARES, ALWAYS_FARES, NEXT, SERIES, giverOf } from './quests.js';
import { Story, INTRO, STORY, CALLINGS, CALL_HOME, route } from './story.js';
import { playCutscene } from './cutscene.js';
import { Villagers } from './villagers.js';
import { Tiles } from './tiles.js';
import { Hotbar } from './hotbar.js';
import { Guide } from './guide.js';
import { BigMap } from './bigmap.js';
import { headsReady, paintHead, lookPortrait, hairstyles, HAIR_BODY } from './hair.js';
import { headgearReady, gearCut, paintGears } from './headgear.js';
import { derive, playerAttack, mobAttack, magicAttack, elementMod, ELEMENTS } from './rules.js';
import { SKILLS, EDGE_FX, skillLv, spCost, castTime, learn, skillList, weaponOk, WEAPON_NAMES, BOW_RANGE, unlearnFirstJob, unlearnSecondJob, RETRAIN_COST } from './skills.js';
import { Menus } from './menus.js';
import { iconTexture, iconURL, ITEMS, baseOf, canWear, maybeSlotted } from './items.js';
import { DayNight } from './daynight.js';
import { Audio } from './audio.js';
import { Wings, wingPicture } from './wings.js';
import { clamp, lerp } from './noise.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.localClippingEnabled = true; // wading: sprites are cut at the waterline

const scene = new THREE.Scene();
const SKY = new THREE.Color('#a3c9d8');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 24, 50);

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 120);
const hemi = new THREE.HemisphereLight('#fff6e2', '#6b5a40', 1.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff0d0', 1.6);
sun.position.set(-20, 30, -12);
scene.add(sun);

const lib = createSprites();
const world = buildWorld(scene, lib);
const fx = new FX(scene, world, lib);
const mobs = new MobManager(scene, world, lib, fx);
const allies = new Allies(scene, world, lib, mobs.shadowGeo, mobs.shadowMat); // the Beastmaster's beasts
// monsters per map: [type, count, nightOnly]. Wisps drift about by day too; night brings more of them and ~20% more of the rest
const SPAWNS = {
  camp: [],
  grove: [['slime', 12], ['sprout', 9], ['wisp', 2, true], ['slime', 3, true], ['sprout', 2, true]], // the first field: Wisps only at night
  fen: [['blueSlime', 9], ['crab', 7], ['wisp', 4, true], ['blueSlime', 2, true], ['crab', 1, true]], // (Wisps only at night here too: a Trainee's field)
  hollow: [['mushling', 12], ['wisp', 3], ['wisp', 3, true], ['mushling', 2, true]],
  ridge: [['beetle', 10], ['jarl', 1], ['wisp', 3], ['wisp', 3, true], ['beetle', 2, true]],
  city: [],
  birch: [['russet', 10], ['sprout', 5], ['slime', 4], ['matron', 1], ['wisp', 2], ['wisp', 3, true], ['russet', 2, true]],
  magic: [],
  coast: [['brine', 9], ['tidecrab', 8], ['crab', 3], ['tideKing', 1], ['wisp', 2], ['wisp', 3, true], ['brine', 2, true]],
  deep: [['gloomcap', 10], ['mushling', 4], ['shadeWisp', 6], ['gloomMother', 1], ['gloomcap', 2, true]],
  heath: [['cinderBeetle', 9], ['emberWisp', 6], ['beetle', 3], ['cinderLord', 1], ['cinderBeetle', 2, true]],
  // the kobold and goblin lands: they attack on sight; each race's king holds the second map
  stones: [['koboldWarrior', 10], ['koboldArcher', 6], ['koboldAssassin', 2], ['koboldWarrior', 2, true]],
  coalpit: [['koboldAssassin', 7], ['koboldWarrior', 5], ['koboldArcher', 5], ['koboldKing', 1], ['koboldAssassin', 2, true]],
  burnt: [['goblinWarrior', 10], ['goblinArcher', 6], ['goblinAssassin', 2], ['goblinWarrior', 2, true]],
  bloop: [], koboldcamp: [], goblinlair: [], // the raids spawn their own (tickRaid)
  serpent: [['goblinAssassin', 7], ['goblinWarrior', 5], ['goblinArcher', 5], ['goblinKing', 1], ['goblinAssassin', 2, true]],
  // Veidheim's lands: the gentle willows and treants round the village (and Yellow Bloops in the marsh),
  // the predators far off past Black Wood and Ash Heath, more of them at night
  hunt: [],
  marsh: [['willow', 9], ['yellowSlime', 8], ['elderWillow', 1], ['willow', 2, true], ['wisp', 3, true]],
  oldwood: [['treant', 9], ['willow', 4], ['ancientTreant', 1], ['treant', 2, true], ['wisp', 2, true]], // (the Ancient Treant, the oldest of them, roams its own forest)
  farm: [['snake', 10], ['wolf', 6], ['alphaWolf', 1], ['snake', 2, true], ['wolf', 3, true]],
  wolfhill: [['wolf', 10], ['bear', 5], ['snake', 2], ['greatBear', 1], ['wolf', 3, true]],
  // Rytingborg's desert: Red Sands (a Trainee's field, the Assassin's trial), then the cacti and dune
  // worms, the scorpions and runners round the Pyramid, and the Great Desert where all of them roam
  // over the Sand Wyrm. Sphinx Sands keeps no monsters; the tomb (raid) spawns its own
  sand: [], sphinx: [], tomb: [],
  redsands: [['redSlime', 12], ['giantAnt', 8], ['redSlime', 3, true], ['giantAnt', 2, true]],
  dunes: [['cactus', 9], ['duneWorm', 7], ['cactusLord', 1], ['duneWorm', 2, true], ['cactus', 2, true]],
  scorpion: [['scorpion', 9], ['runner', 6], ['rainbowRunner', 1], ['scorpion', 3, true], ['runner', 1, true]],
  desert: [['soldierAnt', 7], ['cactus', 3], ['duneWorm', 4], ['scorpion', 4], ['runner', 3], ['sandWyrm', 1], ['soldierAnt', 2, true], ['scorpion', 2, true]],
};

// which build this is, on the title screen (matches the APK's version, 1.0.<build>)
const verEl = document.querySelector('#title .ver');
if (verEl) verEl.textContent = `v1.0.${__BUILD__} · Explore, fight, craft, survive the night`;

const save = loadSave();
let lookBefore = null; // the look kept, while one is being tried on
mobs.mvpAt = typeof save?.mvpAt === 'number' ? { jarl: save.mvpAt } : save?.mvpAt || {}; // older saves timed the Fire Giant alone
mobs.bossHp = save?.bossHp || {};
mobs.heroTier = () => JOBS[prog.job]?.tier || 0; // (mini-bosses come only for second jobs: mobs.js picksFight)
mobs.bossAt = save?.bossAt || {};
mobs.fieldAt = save?.fieldAt || {};
const prog = new Progress();
prog.load(save?.prog);
// the hero's body follows the job and the look's body (male or female), painted in code (sprites.js designSet)
const JOB_BODY = { novice: 'trainee', swordman: 'blader', mage: 'sorc', archer: 'archer', blademaster: 'master', wizard: 'wiz', magicknight: 'mknight', windrunner: 'wind', moonranger: 'moon', beastmaster: 'beast', assassin: 'assassin', phantom: 'phantom' };
// (the Beastmaster's follows the weapon in hand: the cleaver, or the bow; held() is set once the
// inventory is loaded)
let held = () => save?.inv?.gear?.weapon;
const bodyArt = (look) => lib.design(`${JOB_BODY[prog.job] || 'blader'}${prog.job === 'beastmaster' && ITEMS[held()]?.kind !== 'bow' ? 'sw' : ''}${look.body === 'f' ? 'F' : 'M'}`);
const player = new Player(scene, world, bodyArt({ ...save?.look }), lib.shadow, fx);
const wings = new Wings(scene);
player.setPos(save?.x ?? world.spawn.x, save?.z ?? world.spawn.z);
if (save?.look) { // (a hairstyle is for one body only: a hero saved with the other body's gets one of their own)
  const b = save.look.body || 'm';
  if (HAIR_BODY[save.look.hair] && HAIR_BODY[save.look.hair] !== b) save.look.hair = hairstyles(b)[0] || save.look.hair;
  player.setLook(save.look);
}
lookBefore = { ...player.look };
const quests = new Quests();
quests.load(save?.quests);
const story = new Story();
if (!story.load(save?.story) && save) story.catchUp(prog); // a save from before the story
// people without a sprite of their own are dressed from a bald body (NPCS dress: one sheet for each
// look, so a role's people share theirs); a shop or crafter may borrow another town's (NPCS look)
const dressed = new Map(); // dress spec -> its sheet
for (const [id, n] of Object.entries(NPCS)) {
  if (n.dress && !dressed.has(n.dress)) dressed.set(n.dress, lib.person(n.dress));
  lib.villagers[id] ||= (n.dress && dressed.get(n.dress)) || lib.villagers[n.look] || lib.villagers.bram;
}
// their head, hair and headgear are painted on once those images have loaded (like the hero's)
let undressed = [...dressed.values()];
function dressPeople() {
  if (!undressed.length || !headsReady()) return;
  undressed = undressed.filter((art) => {
    const { hair = 'messy', dye = 'brown', top = null, face = null } = art.person;
    if (!art.dress || !headgearReady(top) || !headgearReady(face)) return true;
    art.dress((g, ud, dir) => {
      const at = ud.head?.at;
      if (!at) return;
      paintHead(g, at, dir, { hair, dye }, gearCut(top, dir), top);
      paintGears(g, at, dir, top, face, 0);
      if (art.person.bow) paintBow(g, ud.head, dir); // Veidheim's archers (bow.js)
    });
    for (const [id, n] of Object.entries(NPCS)) if (n.dress === art.person) delete portraits[id]; // drawn again, dressed
    return false;
  });
}
const villagers = new Villagers(scene, world, lib);
player.tiles = new Tiles(world); // after the villagers: they block their tiles
// a drop lands on open ground: one that would fall on a blocked tile (a tree, a rock, a tent) goes to
// the nearest tile you can walk to
fx.landAt = (x, z) => {
  const t = player.tiles, [i, j] = t.tileAt(x, z);
  const [rx, rz] = world.resolve(x, z, 0.3); // a spot the hero could stand on
  if (t.free(i, j) && world.walkable(x, z) && Math.hypot(rx - x, rz - z) < 0.05) return [x, z];
  const f = t.nearestFree(i, j, 4);
  if (!f) return [x, z];
  const c = t.center(...f);
  return [c.x, c.z];
};
const inv = new Inventory();
inv.level = () => prog.baseLv;
inv.job = () => prog.wearJobs; // the job worn and the first jobs it stands on: switching jobs puts away the rest
inv.dual = () => prog.job === 'phantom'; // a Phantom's second dagger goes in the left hand (the Shield slot)
// the player's look follows the job: the Trainee's clothes, then the first and second jobs'
const jobArt = () => bodyArt(player.look);
// a picture cut down to what is drawn (a sprite's frame has room around it to move in)
function trimmed(src) {
  const w = src.width, h = src.height, d = src.getContext?.('2d')?.getImageData(0, 0, w, h).data;
  if (!d) return src;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return src;
  const c = document.createElement('canvas');
  c.width = x1 - x0 + 1; c.height = y1 - y0 + 1;
  c.getContext('2d').drawImage(src, -x0, -y0);
  return c;
}
// a job's look on this hero, front view (its body, with their own head and hair): the Elder's talk of
// the paths shows what each job looks like (story pages' pics)
const jobPics = {};
const jobPic = (job) => heroPic(job, player.look);
// any hero in any job, facing dir, with what they wear on the head, the face and the back (gear: item
// ids): the title's preview turns a hero round with these
const HERO_H = 1.38; // (player.js HEIGHT: a body's standing height in world units, for the wings' size)
function heroPic(job, look, dir = 'down', gear = {}) {
  look = { hair: 'messy', dye: 'brown', body: 'm', ...look };
  const { head: top = null, face = null, wings: wid = null } = gear;
  const key = `${job}|${look.body}|${look.hair}|${look.dye}|${dir}|${top}|${face}|${wid}`;
  if (jobPics[key]) return jobPics[key];
  const art = lib.design(`${JOB_BODY[job] || 'blader'}${look.body === 'f' ? 'F' : 'M'}`), tex = art?.anims?.[dir]?.idle?.[0];
  if (!tex?.image) return '';
  const W = tex.image.width, H = tex.image.height, r = W / art.fw, ppu = (art.body[1] / HERO_H) * r; // (pixels a world unit)
  const wing = wingPicture(wid, dir), away = dir.startsWith('up');
  // the wings, sized and placed as on the hero (wings.js): behind them, or over them seen from behind
  let ww = 0, wh = 0, wy = 0;
  if (wing) { ww = wing.M.w * ppu * (!wing.views && (dir === 'left' || dir === 'right') ? 0.7 : 1); wh = wing.M.h * ppu; wy = H * (1 - tex.userData.anchor) - wing.M.y * ppu; }
  const pad = Math.max(0, Math.ceil((ww - W) / 2)), c = document.createElement('canvas');
  c.width = W + pad * 2; c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const wings = () => wing && g.drawImage(wing.canvas, pad + W / 2 - ww / 2, wy - wh / 2, ww, wh);
  if (!away) wings();
  g.drawImage(tex.image, pad, 0);
  // the head as soon as the heads have loaded, and each piece of headgear once its own has (a
  // piece still loading is left off for now, never the head with it)
  const hasHead = headsReady() && tex.userData.head?.at, hat = headgearReady(top) ? top : null, mask = headgearReady(face) ? face : null;
  const ready = hasHead && hat === top && mask === face;
  if (hasHead) {
    const at = [tex.userData.head.at[0] + pad, tex.userData.head.at[1]];
    paintHead(g, at, dir, look, gearCut(hat, dir), hat);
    paintGears(g, at, dir, hat, mask, 0);
  }
  if (away) wings();
  if (!ready) return trimmed(c).toDataURL(); // (not kept: the head and its gear come once loaded)
  return (jobPics[key] = trimmed(c).toDataURL());
}
// what a saved hero wears on the head, the face and the back (refined pieces look like the plain one)
const savedGear = (d) => { const G = d?.inv?.gear || {}; return { head: G.head && baseOf(G.head), face: G.face && baseOf(G.face), wings: G.wings && baseOf(G.wings) }; };

held = () => inv.gear.weapon;
player.setArt(jobArt());
inv.load(save?.inv);
inv.chest.load(loadStorage()); // the Keepers' storage: every hero's, saved apart from them
inv.dropUnwearable(); // gear rules can change between versions
// stats + gear -> the player's battle numbers (Ragnarok rules); HP/SP stay put, capped by the new max
// timed buffs, in seconds left: aspd (Quickening Draught), warcry (War Cry's ATK bonus)
const buffs = { aspd: 0, warcry: 0, ward: 0, aegis: 0, momentum: 0, focus: 0, tailwind: 0, rush: 0, gust: 0, rhythm: 0, veil: 0, frenzy: 0 };
let warcryLv = 0, wardLv = 0, endureGuard = 0, aegisLv = 0, focusLv = 0, tailLv = 0, gustHaste = 0;
let endureFrom = null, endureLv = 0; // what set player.endureT (Guard or Stand Firm), for the buff bar
// the Windrunner: Gale Rhythm's stacks (each arrow that lands), Skirmisher's empowered arrows left
let galeStacks = 0, skirmish = 0;
// the Moon Ranger: whether the moon is up (dayNight's night, kept here so applyStats can run before
// dayNight exists), Moonveil's level
let nightUp = false, veilLv = 0, frenzyLv = 0;
// the Beastmaster's beasts: which summon calls each, and their numbers from the hero's. A beast takes a
// share of the hero's stats, 40% at a summon's Lv 1 to 80% at Lv 5, plus Beast Bond: the Bear
// grows with END and Max HP, the Wolves with FNS, the Hawk with QKN
const SUMMONS = { bear: 'summonbear', wolf: 'summonwolves', hawk: 'summonhawk' };
// a beast's numbers from the hero's (s: its share of them, from its Summon level and Beast Bond). Each
// beast stands for one stat, which counts a lot: END the Bear's HP and DEF, FNS the Wolves' HIT and ATK,
// QKN the Hawk's attack speed and reach. FTN gives every beast its crits and lucky dodges, POW adds to
// every beast's ATK, and the other stats still count a little (MINOR) for all of them
const MINOR = 0.25;
function beastStats(kind) {
  const g = inv.gearStats().stats, st = (k) => prog.total(k) + (g[k] || 0), base = prog.baseLv;
  const s = 0.3 + 0.1 * skillLv(prog, SUMMONS[kind]) + 0.02 * skillLv(prog, 'beastbond'), m = s * MINOR;
  const quick = buffs.frenzy > 0 ? 1 - 0.03 * frenzyLv : 1, R = Math.round;
  const pow = st('pow'), end = st('end'), fns = st('fns'), qkn = st('qkn'), knl = st('knl'), ftn = st('ftn');
  // KNL sharpens their instincts (allies.js INSTINCTS: Maul, Hamstring, Dive): harder, sooner, and a
  // stun or slow that lasts longer (KNL 80 at a full share: about 1.5x the blow, 0.75x the wait, 1.4x as long)
  const sharp = { mult: 1 + knl * 0.006 * s, cd: Math.max(0.6, 1 - knl * 0.003 * s), dur: 1 + knl * 0.005 * s };
  const common = { crit: R(3 + ftn / 3 * s), dodge: R(2 + ftn / 10 * s), mastery: 0, el: 'neutral', wlv: 2, beast: true, sharp };
  // a little of every stat, for all: END's toughness, FNS and KNL's aim, QKN's pace and footwork
  const hp = end * 4 * m, def = end * 0.15 * m, hit = (fns + knl) * 0.5 * m, flee = qkn * 0.5 * m, pace = 1 - qkn * 0.003 * m;
  if (kind === 'bear') {
    const hide = skillLv(prog, 'thickhide');
    return { ...common, maxHp: R(player.maxHp * 0.6 * s + end * 25 * s + base * 4 + hp), def: Math.min(70, R(10 + end * 0.9 * s)), end: R(end * s), flee: R(base * 0.6 + flee),
      batk: R(pow * s + end * 0.5 * s + base * 1.2), watk: R(30 + base * 1.2), fns: R(base * 0.8), hit: R(base + 25 + hit), interval: 1.6 * quick * pace, taunt: 3 + 0.5 * hide, guard: 0.04 * hide };
  }
  if (kind === 'wolf') return { ...common, maxHp: R(player.maxHp * 0.3 * s + base * 5 + hp), def: R(8 + def), end: R(base * 0.3), flee: R(base + fns * 0.3 * s + flee),
    batk: R(pow * 0.8 * s + fns * 1.8 * s + base * 0.5), watk: R(20 + base), fns, hit: R(base + fns * 2.5 * s + hit), interval: 1.0 * quick * pace, double: 0.25 };
  return { ...common, maxHp: R(player.maxHp * 0.28 * s + base * 4 + hp), def: R(4 + def), end: 0, flee: R(base + qkn * 1.5 * s),
    batk: R(pow * 0.9 * s + qkn * 0.7 * s + base * 0.6), watk: R(15 + base * 0.8), fns: R(base * 0.8), hit: R(base + 30 + qkn * 0.6 * s + hit),
    interval: Math.max(0.35, 1.3 - qkn * 0.012 * s) * quick * (1 - 0.03 * skillLv(prog, 'windtalons')),
    reach: 2.2 + qkn * 0.025 * s }; // (QKN: it strikes from further off)
}
// a beast's damage rate on a monster: Pack Frenzy, and Pack Tactics when both wolves bite the same one
allies.mult = (b, m) => (b.K.illusion ? 1 + 0.06 * skillLv(prog, 'lingeringshade') : 1) // (a Phantom's illusions: Lingering Shade)
  * (buffs.frenzy > 0 && !b.K.illusion ? 1 + 0.03 * frenzyLv : 1) * (allies.rallyT > 0 ? 1 + ROAR.atk : 1) // (the Bear's Roar)
  * (b.kind === 'wolf' && allies.of('wolf').filter((w) => w.foe === m).length > 1 ? 1 + 0.06 * skillLv(prog, 'packtactics') : 1);
const moonSkill = () => (nightUp ? 1 + 0.02 * skillLv(prog, 'moonlit') : 1); // Moonlit Hunter, on every skill
// a Phantom's illusion's numbers: a share of the hero's own (Phantom Double's level), the hero's
// weapon and pace; a shade fights hand to hand, the Mirage only stands there and draws the monsters
function illusionStats() {
  const ps = player.ps, s = 0.3 + 0.06 * skillLv(prog, 'phantomdouble'), R = Math.round;
  return { ...ps, left: null, batk: R(ps.batk * s), watk: R(ps.watk * s), mastery: R(ps.mastery * s), maxHp: R(player.maxHp * 0.35), interval: ps.interval * 1.1, double: 0, guard: 0 };
}
// Vanish: the hero melts into the shadows (monsters lose them, mobs.js); attacking ends it, and the
// first blow out of it strikes harder
let vanishBonus = 1;
function unhide(attack = false) {
  player.hiddenT = 0;
  player.mat.transparent = false; player.mat.opacity = 1;
  if (attack) player.nextBlow = Math.max(player.nextBlow || 1, vanishBonus);
}
let nav = null; // auto-navigation: { quest, map, npc, why } while walking to a quest by itself
// second-job synergies: the BladeMaster's Momentum stacks, the last spell's element (Resonance),
// the last Edge's element (Elemental Chain)
let momentum = 0;
const lastSpell = { el: null, t: -99 }, lastEdge = { el: null, t: -99 };
// hits that come one after another (Storm Gust's gusts, Final Blade's cuts): run on the game clock,
// and dropped if you leave the map first
const timers = [];
const later = (s, fn) => timers.push({ at: skillClock + s, fn, map: world.id });
// each hit of a multi-hit skill: fn(i) for i = 0 .. hits-1, every sk.every seconds
const repeat = (sk, lv, fn) => { for (let i = 0; i < sk.hits(lv); i++) later(i * sk.every, () => fn(i)); };
// a status from a skill (skills.js status): freeze, paralyze and stun leave a monster helpless; a burn
// hurts it each second for a fifth of the hit that lit it. Bosses resist: a third of the chance, for
// half as long, and nothing takes hold while a boss is in the middle of a move.
const STATUS_TEXT = { freeze: 'Frozen', paralyze: 'Paralyzed', stun: 'Stunned', burn: 'Burning', poison: 'Poisoned' };
function inflict(m, st, lv, hitDmg = 0) {
  if (!st || !m.alive || m.act) return;
  const boss = m.def.boss || m.def.mvp;
  if (Math.random() * 100 >= st.chance(lv) * (boss ? 1 / 3 : 1)) return;
  const dur = st.dur * (boss ? 0.5 : 1);
  if (st.kind === 'burn') {
    if (!hitDmg) return;
    if (!(m.burnT > 0)) m.burnTick = 1;
    m.burnT = dur;
    m.burnDmg = Math.max(1, Math.round(hitDmg * 0.2));
  } else if (st.kind === 'poison') { // (a fifth of the blow each second, like a burn: the Assassin's venom)
    if (!hitDmg) return;
    if (!(m.poisonT > 0)) m.poisonTick = 1;
    m.poisonT = dur;
    m.poisonDmg = Math.max(1, Math.round(hitDmg * 0.2));
  } else {
    m.stunT = Math.max(m.stunT, dur);
    m.status = st.kind;
  }
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.35), m.z, STATUS_TEXT[st.kind], 'miss');
}
// cards' own effects on each hit or spell that lands (items.js card.perk): the Fire Giant's Meteor
// Heart sets the monster burning, the Kobold Warlord's Earthshaker stuns it (a boss a third as often,
// for half as long, like any status), and the BleepBloop's Gulp heals you a share of the damage
function cardOnHit(m, dmg) {
  const ps = player.ps;
  if (ps.burn && m.alive) inflict(m, { kind: 'burn', chance: () => ps.burn, dur: 3 }, 1, dmg);
  if (ps.stun && m.alive) inflict(m, { kind: 'stun', chance: () => ps.stun, dur: 1.5 }, 1, dmg);
  if (ps.venom && m.alive) inflict(m, { kind: 'poison', chance: () => ps.venom, dur: 4 }, 1, dmg); // (the Cactus Lord Card, a Stinger)
  if (ps.soultax && dmg > 0) player.healSp(Math.max(1, Math.round(dmg * ps.soultax / 100))); // (the Pharaoh Card)
  if (ps.lifesteal && dmg > 0) {
    const n = player.heal(Math.max(1, Math.round(dmg * ps.lifesteal / 100)));
    if (n > 0) fx.number(player.x, overHead(player, 1.3), player.z, n, 'heal');
  }
}
let skillClock = 0; // seconds since the game started, for those windows
// what is in hand: 'sword', 'staff', 'bow', 'dagger', or 'none' (bare hands: no blade skills, no sword mastery)
const weaponKind = () => { const it = ITEMS[inv.gear.weapon]; return !it ? 'none' : it.kind === 'staff' || it.kind === 'bow' || it.kind === 'dagger' ? it.kind : 'sword'; };
// an Archer's bonuses on one monster: Hunter's Mark on it, Steady Aim from 4 paces
function bowMul(m) {
  let k = 1;
  if (m.markT > skillClock) k *= 1 + 0.04 * m.markLv;
  if (weaponKind() === 'bow' && skillLv(prog, 'steadyaim') && Math.hypot(m.x - player.x, m.z - player.z) - m.def.r >= 4) k *= 1.1;
  if (skirmish > 0 && weaponKind() === 'bow') { skirmish--; k *= 1 + 0.08 * skillLv(prog, 'skirmisher'); }
  return k;
}
// an arrow landed: Gale Rhythm adds a stack (up to 5, for 6 s)
function arrowLanded() {
  const lv = skillLv(prog, 'galerhythm');
  if (!lv) return;
  buffs.rhythm = 6;
  if (galeStacks < 5) { galeStacks++; applyStats(); }
}
// a burst of speed (Gale Step, Tailwind's rush): Skirmisher readies the next 3 arrows
const burstOfSpeed = () => { if (skillLv(prog, 'skirmisher')) skirmish = 3; };
function applyStats() {
  const gear = inv.gearStats();
  const hide = skillLv(prog, 'ironhide');
  const sword = weaponKind() === 'sword', bow = weaponKind() === 'bow';
  const st = gear.stats;
  st.fns = (st.fns || 0) + skillLv(prog, 'keeneye') + (buffs.focus > 0 ? focusLv : 0);
  if (buffs.focus > 0) st.qkn = (st.qkn || 0) + focusLv;
  gear.hit += bow ? skillLv(prog, 'longsight') : 0;
  const dagger = weaponKind() === 'dagger';
  if (prog.trees.has('phantom')) st.qkn = (st.qkn || 0) + skillLv(prog, 'phantomgrace'); // Phantom Grace
  gear.mastery = skillLv(prog, 'basics') + (sword ? 2 * skillLv(prog, 'discipline') + 3 * skillLv(prog, 'blademastery') : 0) + (dagger ? 4 * skillLv(prog, 'daggermastery') : 0);
  gear.flee += 3 * skillLv(prog, 'improvedodge') + 2 * skillLv(prog, 'phantomgrace') * allies.illusions.length; // Improve Dodge; Phantom Grace, per illusion out
  if (buffs.swift > 0) gear.aspdRate *= 1 - (gear.perk.swift || 0) / 100; // the Rainbow Runner Card's Rainbow Rush, after a kill
  if (!(prog.job === 'phantom')) gear.left = null; // (only a Phantom fights with a dagger in each hand)
  gear.hit += sword ? skillLv(prog, 'blademastery') : 0;
  gear.flee += (skillLv(prog, 'footwork') ? 3 : 0) + (nightUp ? skillLv(prog, 'moonlit') : 0);
  gear.def += hide + (buffs.aegis > 0 && player.barrier > 0 ? aegisLv : 0) + skillLv(prog, 'beastbond') * allies.beasts.length; // Beast Bond
  if (buffs.aspd > 0) gear.aspdRate *= 0.9;
  if (bow) gear.aspdRate *= (1 - 0.02 * skillLv(prog, 'windborne')) * (buffs.tailwind > 0 ? 1 - 0.02 * tailLv : 1) * (1 - skillLv(prog, 'galerhythm') * galeStacks / 100);
  if (buffs.imbue > 0 && imbueEl && sword) gear.el = imbueEl; // Elemental Blade
  player.statBonus = { ...gear.stats }; // (what gear, cards and skills add to each stat: the Status window shows it)
  const ps = derive(prog, gear);
  ps.maxHp = Math.floor(ps.maxHp * (1 + hide / 100));
  if (dagger && skillLv(prog, 'lethaledge')) ps.crit += 5; // Lethal Edge
  player.leftShare = 0.5 + 0.05 * skillLv(prog, 'twinblades'); // a Phantom's left dagger: its share of a blow (Twin Blades)
  player.doubleAttack = dagger ? 5 * skillLv(prog, 'doubleattack') : 0; // Double Attack: % of normal attacks that strike twice
  ps.maxSp = Math.floor(ps.maxSp * (1 + skillLv(prog, 'manawell') / 50));
  player.ps = ps;
  player.maxHp = ps.maxHp;
  player.maxSp = ps.maxSp;
  player.hp = Math.min(player.hp, ps.maxHp);
  player.sp = Math.min(player.sp, ps.maxSp);
  // walking speed is a big buff in Aria: only the Windrunner's short bursts haste the walk, and only
  // the strongest of them counts (Ragnarok's rule)
  player.haste = Math.max(buffs.rush > 0 ? 30 : 0, buffs.gust > 0 ? gustHaste : 0);
  // a bow shoots from afar, with arrows (their element colours the shot)
  player.bow = bow;
  player.noAmmo = bow && !inv.gear.ammo;
  player.reach = bow ? BOW_RANGE + 0.2 * skillLv(prog, 'longsight') : 1.35;
  player.arrowCol = bow && gear.el ? ELEMENTS[gear.el].color : '#efe2c0';
  player.dmgMod = bowMul;
  for (const kind of Object.keys(SUMMONS)) if (allies.of(kind).length) allies.restat(kind, beastStats(kind)); // the beasts follow the hero's stats
  if (prog.job === 'beastmaster') { const art = jobArt(); if (player.art !== art) player.setArt(art); } // sword or bow in hand
  player.setHeadgear(inv.gear.head && baseOf(inv.gear.head), inv.gear.face && baseOf(inv.gear.face)); // refined headgear looks like the plain piece
  player.blockChance = inv.wearing('block') ? 0.2 : 0;
  // Spellblade: normal sword hits carry some of the MATK
  const sb = sword ? skillLv(prog, 'spellblade') : 0;
  player.bonusDmg = sb ? () => Math.floor((player.ps.matk[0] + player.ps.matk[1]) / 2 * 0.03 * sb) : null;
}
applyStats();
player.hp = typeof save?.hp === 'number' && save.prog?.v === 2 ? clamp(save.hp, 1, player.maxHp) : player.maxHp;
player.sp = typeof save?.sp === 'number' ? clamp(save.sp, 0, player.maxSp) : player.maxSp;
inv.onChange(applyStats);

const input = new Input();
const ui = new UI(world);
ui.mobs = mobs;
ui.prog = prog;
ui.jobName = () => JOBS[prog.job].name;
ui.heroName = () => player.look.name || '';

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3(), shake: 0 };

// ---------- maps and warp portals ----------
// go to a map: its monsters, tiles and ground; at = where to stand (else beside the portal back)
const visited = new Set(save?.visited || ['camp']); // lands walked, for the Ferryman
quests.seen = visited; // (a secret series waits for every land it names: quests.js needZones)
// a hidden portal (world.js portal.need) opens once its quest is done, or its last task is: the Sphinx
// Eye set in the Great Desert's obelisk (The Sphinx's Riddle 6) opens the way to Sphinx Sands
world.open = (need) => quests.done.includes(need) || (need in quests.active && quests.ready(need, inv));
// Keepers whose ledger you have signed (the camp's is signed from the start), and where you saved
const keepers = new Set(save?.keepers || ['keeper_camp']);
let savePoint = save?.savePoint || null; // { keeper, map, x, z }; none = the camp fire
const groundLeft = {}; // per map: the drops left lying there (fx.stashPickups); their time runs on
function enterMap(id, from, at) {
  if (world.id) groundLeft[world.id] = fx.stashPickups();
  const arrive = world.go(id, from);
  visited.add(id);
  const pos = at || arrive;
  mobs.setMap(SPAWNS[world.id], 11 + world.id.length);
  villagers.show(world.id);
  player.tiles.rebuild();
  fx.restorePickups(groundLeft[world.id]);
  delete groundLeft[world.id];
  player.stop();
  player.setPos(pos.x, pos.z);
  allies.carry(player); // the beasts come along
  cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
}
// saves from before the maps were split only know the camp
enterMap(save?.map && ZONE_NAMES[save.map] ? save.map : 'camp', null, save?.map ? { x: save.x, z: save.z } : null);

let warping = false;
function warp(id, from, at) {
  if (warping) return;
  warping = true;
  player.stop();
  audio.play('dodge');
  const veil = document.getElementById('warp');
  veil.classList.add('show');
  setTimeout(() => {
    enterMap(id, from, at);
    ui.showZone(world.id);
    persist();
    veil.classList.remove('show');
    setTimeout(() => { warping = false; }, 300);
  }, 260);
}
const warpTo = (id) => warp(id, null);
// Wander Feather: a random open spot on this map
function warpRandom() {
  for (let i = 0; i < 200; i++) {
    const x = 4 + Math.random() * 56, z = 4 + Math.random() * 56;
    const t = player.tiles.tileAt(x, z);
    if (player.tiles.blocked[t[1] * 64 + t[0]] || world.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 3)) continue;
    warp(world.id, null, { x: t[0] + 0.5, z: t[1] + 0.5 });
    return;
  }
}
// stepping onto a portal takes you through it
function checkPortals() {
  if (warping || player.state !== 'normal') return;
  for (const p of world.portals) {
    if (Math.hypot(p.x - player.x, p.z - player.z) < 0.75) { warp(p.to, world.id); return; }
  }
}

const audio = new Audio();

// ---------- combat wiring ----------
// damage numbers float up from whoever was hit, Ragnarok style
const overHead = (o, h) => world.heightAt(o.x, o.z) + h;
player.on('swing', () => { audio.play('swing'); if (player.hiddenT > 0) unhide(true); }); // (attacking out of Vanish ends it)
player.on('noammo', () => menus.message('Equip arrows to shoot (the Arrows slot)'));
// the first weak elemental hit ever explains the grey number, once
function weakTip(m, el) {
  if (story.flags.elementTip) return;
  story.flag('elementTip');
  const E = (e) => e[0].toUpperCase() + e.slice(1);
  menus.message(`A weak hit! ${E(el)} barely hurts the ${m.def.name}, which is ${E(m.def.el)}. Grey numbers mean the wrong element: try another weapon or spell.`);
}
player.on('strike', (m, res) => {
  const y = overHead(m, m.sprite.scale.y * 0.8) + (res.left ? 0.3 : 0); // (a Phantom's left-hand blow, a little above the right's)
  if (res.miss) fx.number(m.x, y, m.z, 'Miss', 'miss');
  else {
    fx.number(m.x, y, m.z, res.dmg, res.crit || res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
    if (res.el < 1) weakTip(m, player.ps.el);
    audio.play('hit');
    cardOnHit(m, res.dmg);
    // Double Attack (an Assassin's dagger): a normal blow now and then strikes twice
    if (!res.skill && !res.left && player.doubleAttack && m.alive && Math.random() * 100 < player.doubleAttack) {
      m.hit(res.dmg, 0, 0);
      fx.number(m.x, y + 0.35, m.z, 'Double!', 'skill');
      fx.number(m.x, y, m.z, res.dmg, 'dealt');
    }
    // the Goblin Warlord Card's Frenzy: a blow struck up close now and then lands twice
    if (!player.bow && player.ps.double && m.alive && Math.random() * 100 < player.ps.double) {
      m.hit(res.dmg, 0, 0);
      fx.number(m.x, y + 0.35, m.z, 'Twice!', 'skill');
      fx.number(m.x, y, m.z, res.dmg, 'dealt');
    }
    if (player.bow) arrowLanded();
    // Battle Rhythm: every third hit that lands gives back 3 SP, so a Blader keeps swinging skills
    if (skillLv(prog, 'rhythm') && ++rhythm % 3 === 0) player.healSp(3);
  }
});
player.on('hurt', (n) => {
  ui.hurt(); cam.shake = 0.2; audio.play('hurt');
  fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken');
});
mobs.on('cornered', (m) => { if (m.story) fx.number(m.x, overHead(m, m.sprite.scale.y * 0.9), m.z, 'Cornered!', 'skill'); }); // (the Gel Thief turns to fight)
mobs.on('thorns', (m, n) => fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, n, 'dealt')); // Bark Armor's
mobs.on('miss', (m, res) => {
  const t = m.foe || player; fx.number(t.x, overHead(t, 1.3), t.z, res.dodge ? 'Lucky!' : 'Miss', 'miss');
});
// the beasts: their bites and dives, the blows they take, the Bear's roar, a beast that falls
allies.on('strike', (b, m, res) => {
  if (!m.alive) return;
  const y = overHead(m, m.sprite.scale.y * 0.8);
  if (res.miss) { fx.number(m.x, y, m.z, 'Miss', 'miss'); return; }
  fx.number(m.x, y, m.z, res.dmg, res.crit ? 'crit' : 'dealt');
  const dx = m.x - b.x, dz = m.z - b.z, d = Math.hypot(dx, dz) || 1;
  m.hit(res.dmg, dx / d * 0.3, dz / d * 0.3, b);
  audio.play('hit');
  if (b.kind === 'hawk') { const wt = skillLv(prog, 'windtalons'); if (wt) inflict(m, { kind: 'stun', chance: () => 2 * wt, dur: 1 }, wt, res.dmg); }
  // the beasts' instincts (allies.js INSTINCTS): the Bear's Maul stuns, a Wolf's Hamstring slows (bosses:
  // a third of the chance to be stunned, half as long either way)
  const longer = b.ps.sharp?.dur || 1; // (KNL: a sharper instinct holds it longer)
  if (res.instinct === 'bear') inflict(m, { kind: 'stun', chance: () => 100, dur: 1.5 * longer }, 1, res.dmg);
  if (res.instinct === 'wolf' && m.alive) {
    const boss = m.def.boss || m.def.mvp;
    m.slowT = (boss ? 2 : 4) * longer; m.slowBy = 0.4;
    fx.number(m.x, y + 0.35, m.z, 'Slowed', 'miss');
  }
  if (m.alive && m.foe?.kind !== 'bear' && (!b.K.fly || m.def.ai === 'archer') && Math.random() < 0.35) m.foe = b; // it may turn on the beast that bit it (only a shooter on the Hawk)
});
allies.on('instinct', (b, I) => { fx.number(b.x, overHead(b, b.sprite.scale.y * 0.9), b.z, `${I.name}!`, 'skill'); audio.play(b.kind === 'bear' ? 'night' : 'swing'); });
allies.on('hurt', (b, n) => fx.number(b.x, overHead(b, b.sprite.scale.y * 0.7), b.z, n, 'taken'));
allies.on('taunt', (b) => { fx.number(b.x, overHead(b, b.sprite.scale.y * 0.9), b.z, 'Roar!', 'skill'); audio.play('night'); for (const o of allies.list) if (o !== b) fx.sparkle(o.x, overHead(o, o.sprite.scale.y * 0.6), o.z, '#ffc04a', 4); });
allies.on('fade', (b) => { fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.8, b.z, b.K.aura, 10); applyStats(); }); // an illusion's time runs out
allies.on('fall', (b) => {
  fx.puff(b.x, world.heightAt(b.x, b.z) + 0.4, b.z, b.K.w || 0.7);
  if (b.K.illusion) { menus.message(`Your ${b.name.toLowerCase()} shatters.`); applyStats(); return; }
  const id = SUMMONS[b.kind];
  skillCd[id] = Math.max(skillCd[id] || 0, 20); // a fallen beast can be called back after a rest
  menus.message(`Your ${b.name} falls back to the wild to lick its wounds. Call it again in 20 s.`);
  applyStats();
});
player.on('block', () => {
  audio.play('block');
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#e8eef5', 5);
  fx.number(player.x, overHead(player, 1.3), player.z, 'Block', 'miss');
});
// Stone Aegis takes the blow: the barrier's own number, in its stone colour
player.on('soak', (n) => {
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#c8a06a', 4);
  fx.number(player.x, overHead(player, 1.3), player.z, `-${n}`, 'miss');
});
player.on('faint', () => {
  audio.play('faint');
  const lost = prog.deathPenalty();
  const home = savePoint ? ZONE_NAMES[savePoint.map] : 'camp';
  ui.faint(true, lost.base || lost.job ? `Returning to ${home} · lost ${lost.base} Base EXP, ${lost.job} Job EXP` : `Returning to ${home}`);
  setTimeout(() => {
    allies.clear(); // the beasts go home when the hero faints
    applyStats();
    enterMap(savePoint ? savePoint.map : 'camp', null);
    if (savePoint) player.revive(savePoint.x, savePoint.z);
    else player.revive(world.spawn.x, world.spawn.z);
    // waking up is not a free heal: half HP and SP (a Keeper or Gyda mends the rest)
    player.hp = Math.ceil(player.maxHp * 0.5);
    player.sp = Math.max(Math.min(player.sp, player.maxSp), Math.ceil(player.maxSp * 0.5));
    cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
    ui.faint(false);
  }, 2200);
});
mobs.on('death', (m, drops) => {
  audio.play('kill');
  const ps = player.ps; // the cards' kill effects: Rainbow Rush (attack speed), Devour (HP and SP back)
  if (ps.swift && !m.def.decoy) { buffs.swift = 5; applyStats(); }
  if (ps.devour && !m.def.decoy && player.state !== 'down') { player.heal(Math.round(player.maxHp * ps.devour / 100)); player.healSp(Math.round(player.maxSp * ps.devour / 100)); }
  if (raid && m.def.raidLv) { raid.exp[0] += m.def.exp[0] * RATES.base; raid.exp[1] += m.def.exp[1] * RATES.job; } // a raid holds its EXP until the run ends
  else gainExp(m.def.exp[0], prog.job === 'novice' && m.def.tjob ? m.def.tjob : m.def.exp[1], RATES); // (a Trainee earns a bloop field's big Job EXP: tjob)
  for (const id of quests.onKill(m.type)) questComplete(id);
  story.onKill(m.type);
  for (const [base, count] of drops) {
    const item = maybeSlotted(base); // now and then a piece of gear drops with a card slot
    fx.drop(m.x, m.z, item, count, iconTexture(item), !!ITEMS[item]?.rare);
    if (ITEMS[item].rare || item !== base) { // a rare find: a golden burst and a word, like Ragnarok's drop glow
      fx.sparkle(m.x, world.heightAt(m.x, m.z) + 0.5, m.z, '#ffd23a', 20);
      audio.play('heart');
      menus.message(`${ITEMS[item].rare ? 'Rare drop' : 'A slotted find'}! The ${m.def.name} dropped ${ITEMS[item].name}.`);
    }
  }
});

// a Sand Scorpion's sting (def.poison): poisoned for 6 s
mobs.on('venom', (m) => {
  if (!(player.poisonT > 0)) { player.poisonTick = 1; menus.message(`The ${m.def.name}'s sting poisons you! Green Herbs cure it.`); }
  player.poisonT = 6;
  fx.number(player.x, overHead(player, 1.7), player.z, 'Poisoned', 'miss');
});
mobs.on('spore', (m) => {
  audio.play('spore');
  const y = world.heightAt(m.x, m.z) + 0.4;
  fx.cloud(m.x, y, m.z);
  if (Math.hypot(player.x - m.x, player.z - m.z) < 2.6 && !player.ps.sureFoot) { // (Sea Legs: spores can't slow you)
    if (player.slowT <= 0) menus.message(m.def.puff || 'Spores! You feel sluggish');
    player.slowT = 2.2;
  }
});

// ---------- the MVP ----------
mobs.on('windup', (m) => { // a boss raises its fists: the stomp lands round it (3.2 paces) when the red circle fills
  audio.play('swing');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff8a3a', 10);
  fx.warn(m.x, m.z, 3.2, m.special);
});
mobs.on('stomp', (m) => { // the ground bursts around the boss
  const y = world.heightAt(m.x, m.z);
  fx.puff(m.x, y + 0.2, m.z, 2.4);
  fx.sparkle(m.x, y + 0.3, m.z, '#ff6a1a', 24);
  audio.play('hit');
  if (Math.hypot(player.x - m.x, player.z - m.z) > 3.2) return;
  cam.shake = 0.35;
  if (!player.canBeHit()) return;
  const res = mobAttack(m.def, player.ps, (m.def.stomp || 1.5) * m.fury, fierce(m.def) ? MVP_MOVE : undefined);
  if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, 'Miss', 'miss');
  else player.takeDamage(res.dmg, m.x, m.z);
});
// ---------- boss moves (mobs.js MOVES): a red circle shows where each lands ----------
const MOVE_COL = { fire: '#ff6a1a', earth: '#c8a06a', wind: '#dff7c8', water: '#9fe0ff', shadow: '#a89cff' };
// a boss move lands: mult x the boss's ATK if you stand within r of (x, z)
function bossBlow(m, mult, x, z, r, ranged = false) {
  if (ranged) for (const b of allies.list) { // a thrown or falling blow (Boulder, Meteor Rain...) reaches the Hawk in the air too
    if (!b.K.fly || !b.canBeHit(true) || Math.hypot(b.x - x, b.z - z) > r + b.K.r) continue;
    const res = mobAttack(m.def, b.ps, mult * m.fury, fierce(m.def) ? MVP_MOVE : undefined);
    if (res.miss) fx.number(b.x, overHead(b, b.sprite.scale.y * 0.7), b.z, 'Miss', 'miss');
    else b.takeDamage(res.dmg, x, z);
  }
  if (Math.hypot(player.x - x, player.z - z) > r + 0.3 || !player.canBeHit() || player.state === 'down') return;
  cam.shake = 0.3;
  const res = mobAttack(m.def, player.ps, mult * m.fury, fierce(m.def) ? MVP_MOVE : undefined); // (an MVP's: no FLEE, little DEF)
  if (res.miss) fx.number(player.x, overHead(player, 1.3), player.z, 'Miss', 'miss');
  else player.takeDamage(res.dmg, x, z);
}
const MOVE_NAMES = { charge: 'Charge', throw: { fire: 'Fireball', shadow: 'Spore Pod', earth: 'Boulder', wind: 'Hurled Axe' }, leap: 'Leap' }; // (or the move's own name)
mobs.on('move', (m, a) => {
  const name = MOVE_NAMES[a.kind], label = a.mv.name || (typeof name === 'string' ? name : name[m.def.el] || 'Throw');
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, label, 'skill');
  audio.play('swing');
  if (a.kind === 'charge') { // the line it will run: a warning where you stand now
    const ahead = Math.min(a.left, Math.hypot(player.x - m.x, player.z - m.z));
    fx.warn(m.x + m.heading.x * ahead, m.z + m.heading.z * ahead, 1.2, MOVES.charge.wind + 0.15);
    fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1, m.z, '#ff8a3a', 10);
  }
  if (a.kind === 'throw') fx.warn(a.spot.x, a.spot.z, a.mv.r, MOVES.throw.wind + MOVES.throw.land);
  if (a.kind === 'leap') fx.warn(a.spot.x, a.spot.z, a.mv.r, MOVES.leap.wind + MOVES.leap.air);
  if (a.kind === 'roots') for (const p of a.spots) fx.warn(p.x, p.z, a.mv.r, MOVES.roots.wind + MOVES.roots.land);
});
// Grasping Roots (the Ancient Treant): they burst up `land` s later; caught, you are held there
mobs.on('roots', (m, spots, mv, land) => {
  const map = world.id;
  setTimeout(() => {
    if (world.id !== map || !m.alive) return;
    for (const p of spots) {
      const gy = world.heightAt(p.x, p.z);
      fx.puff(p.x, gy + 0.2, p.z, mv.r * 1.1);
      fx.sparkle(p.x, gy + 0.3, p.z, '#8a6a3a', 14);
    }
    audio.play('hit');
    const caught = spots.some((p) => Math.hypot(player.x - p.x, player.z - p.z) <= mv.r + 0.3);
    if (!caught || !player.canBeHit() || player.state === 'down') return;
    bossBlow(m, mv.mult, player.x, player.z, mv.r);
    player.rootT = (mv.hold || 3) * (m.enraged ? 1.4 : 1);
    player.path = [];
    menus.message('Roots hold you fast! You can still fight, but not get away.');
    fx.number(player.x, overHead(player, 1.5), player.z, 'Rooted!', 'miss');
  }, land * 1000);
});
// Bark Armor (the Ancient Treant): its bark hardens, and what hits it hits back
mobs.on('bark', (m, mv) => {
  menus.message(`The ${m.def.name} hardens its bark! Hits bounce back at you: hold off for a moment.`);
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, mv.name || 'Bark Armor', 'skill');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#c8a05a', 24);
  audio.play('block');
});
mobs.on('reflect', (m, n, from) => {
  const foe = from || player;
  if (!foe.canBeHit?.() || foe.state === 'down') return;
  if (foe === player) fx.number(player.x, overHead(player, 1.6), player.z, 'Reflected', 'miss');
  foe.takeDamage(n, m.x, m.z);
});
// a boss you keep away from gives chase in a burst (mobs.js BRAIN)
mobs.on('pursuit', (m) => { fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Pursues!', 'skill'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 1.0); });
mobs.on('rush', (m) => { audio.play('dodge'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 1.2); });
mobs.on('rammed', (m, mult) => bossBlow(m, mult, m.x, m.z, m.def.reach + 0.6));
mobs.on('throw', (m, spot, mv, land) => {
  const map = world.id, y = world.heightAt(m.x, m.z) + m.sprite.scale.y * 0.6;
  const travel = Math.hypot(spot.x - m.x, spot.z - m.z) / 13; // fx.bolt flies 13 paces a second
  const at = { x: spot.x, z: spot.z, alive: true };
  setTimeout(() => {
    if (world.id !== map) return;
    fx.bolt(m.x, y, m.z, at, MOVE_COL[m.def.el] || '#ffffff', () => {
      const gy = world.heightAt(spot.x, spot.z);
      fx.puff(spot.x, gy + 0.2, spot.z, mv.r * 1.2);
      fx.sparkle(spot.x, gy + 0.3, spot.z, MOVE_COL[m.def.el] || '#ffffff', 16);
      audio.play('hit');
      bossBlow(m, mv.mult, spot.x, spot.z, mv.r, true);
    }, 0.9);
  }, Math.max(0, land - travel) * 1000);
});
mobs.on('slam', (m, mv) => {
  const y = world.heightAt(m.x, m.z);
  fx.puff(m.x, y + 0.2, m.z, mv.r * 1.3);
  fx.sparkle(m.x, y + 0.3, m.z, MOVE_COL[m.def.el] || '#ffffff', 20);
  audio.play('hit');
  bossBlow(m, mv.mult, m.x, m.z, mv.r);
  if (m.def.burns) burnGround(m, m.x, m.z);
});
// burning ground (the Fire Giant's def.burns): where its meteors and leaps land, the ground burns
// for a while; standing in it burns you every half second (mult x its ATK)
const burning = [];
function burnGround(m, x, z) {
  const b = m.def.burns;
  burning.push({ m, map: world.id, x, z, r: b.r, t: b.dur, tick: 0.5 });
  fx.warn(x, z, b.r, b.dur, b.color || '#ff8a2a');
}
function burnTick(dt) {
  for (let i = burning.length - 1; i >= 0; i--) {
    const b = burning[i];
    b.t -= dt;
    if (b.t <= 0 || !b.m.alive || world.id !== b.map) { burning.splice(i, 1); continue; }
    const B = b.m.def.burns;
    if (Math.random() < dt * 3) fx.sparkle(b.x + (Math.random() - 0.5) * b.r, world.heightAt(b.x, b.z) + 0.2, b.z + (Math.random() - 0.5) * b.r, B.color || '#ff7a2a', 2);
    if ((b.tick -= dt) > 0) continue;
    b.tick = 0.5;
    if (Math.hypot(player.x - b.x, player.z - b.z) > b.r || !player.canBeHit() || player.state === 'down') continue;
    if (B.slow) player.slowT = Math.max(player.slowT, 0.8); // (sticky gel: it slows you too)
    const res = mobAttack(b.m.def, player.ps, B.mult * b.m.fury, MVP_MOVE);
    if (!res.miss) { player.takeDamage(res.dmg, b.x, b.z); fx.number(player.x, overHead(player, 1.6), player.z, B.word || 'Burning!', 'miss'); }
  }
}
// an MVP's matchup (mobs.js def.takes): told once when it first comes for you
function matchupHint() {
  for (const m of mobs.list) {
    if (!m.alive || !m.def.takesText || m.def.decoy || m.toldTakes || m.state !== 'chase' || Math.hypot(m.x - player.x, m.z - player.z) > 10) continue;
    m.toldTakes = true;
    menus.message(`${TheName(m)}: ${m.def.takesText}.`);
  }
}
// Meteor Rain (the Fire Giant): fireballs fall one after another round you, each a red circle first
mobs.on('meteors', (m, mv, n) => {
  const map = world.id, M = MOVES.meteors;
  menus.message(`${TheName(m)} calls down ${mv.name || 'a Meteor Rain'}! Keep moving!`);
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      if (world.id !== map || !m.alive) return;
      const a = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 2.8; // the first where you are (or going: mobs.js BRAIN)
      const spot = i ? { x: player.x + Math.cos(a) * r, z: player.z + Math.sin(a) * r } : m.aimAt(player, M.land);
      fx.warn(spot.x, spot.z, mv.r, M.land);
      const gy = world.heightAt(spot.x, spot.z), fall = 9 / 13; // (fx.bolt flies 13 paces a second)
      setTimeout(() => {
        if (world.id !== map || !m.alive) return;
        fx.bolt(spot.x, gy + 9, spot.z, { x: spot.x, z: spot.z, alive: true }, mv.color || '#ff6a1a', () => {
          if (world.id !== map || !m.alive) return;
          fx.puff(spot.x, gy + 0.2, spot.z, mv.r * 1.2);
          fx.sparkle(spot.x, gy + 0.3, spot.z, mv.color || '#ff6a1a', 14);
          audio.play('hit');
          bossBlow(m, mv.mult, spot.x, spot.z, mv.r, true);
          if (m.def.burns) burnGround(m, spot.x, spot.z);
        }, 0.9);
      }, Math.max(0, M.land - fall) * 1000);
    }, i * M.every * 1000);
  }
});
// Burrow (the Kobold King): he digs in (he can't be hit), and a red circle marks where he bursts out
mobs.on('burrow', (m) => {
  const y = world.heightAt(m.x, m.z);
  fx.puff(m.x, y + 0.2, m.z, 1.4);
  fx.sparkle(m.x, y + 0.3, m.z, '#c8a06a', 16);
  audio.play('dodge');
  menus.message(m.def.wyrm ? `The ${m.def.name} dives under the sand! Watch for its mound, and keep moving.` : `The ${m.def.name} burrows into the ground! Watch your feet.`);
});
mobs.on('burrowMark', (m, spot, mv, t) => fx.warn(spot.x, spot.z, mv.r, t));
mobs.on('erupt', (m, mv, spot) => {
  const y = world.heightAt(spot.x, spot.z);
  fx.puff(spot.x, y + 0.2, spot.z, mv.r * 1.3);
  fx.sparkle(spot.x, y + 0.3, spot.z, '#c8a06a', 22);
  audio.play('hit');
  cam.shake = 0.35;
  bossBlow(m, mv.mult, spot.x, spot.z, mv.r);
});
// Mirror Image (the Goblin King): shadows of him, and he hides among them
mobs.on('mirror', (m, mv) => {
  menus.message(mv.text || `The ${m.def.name} splits into three! Cut down his shadows: he is shrouded while they stand.`);
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, mv.name || 'Mirror Image', 'skill');
  audio.play('night');
});
// a blow that barely lands (mobs.js ward): underground, behind his tribe, shrouded by shadows
const WARD_HINT = { under: 'Underground!', tribe: 'Guarded!', mirror: 'Shrouded!', jelly: 'Jelly Wall!', jar: 'Sealed!' };
let wardHintAt = 0;
mobs.on('warded', (m) => {
  const why = m.under ? 'under' : m.def.tribe && mobs.guardsOf(m).some((g) => !g.def.decoy) ? 'tribe' : mobs.decoysOf(m)[0]?.type === 'jellyCore' ? 'jelly' : mobs.decoysOf(m)[0]?.type === 'canopicJar' ? 'jar' : 'mirror';
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, WARD_HINT[why], 'miss');
  if (why === 'tribe' && performance.now() - wardHintAt > 15000) { wardHintAt = performance.now(); menus.message(`The ${m.def.name} hides behind his tribe! Bring down his guards first.`); }
});
// "the Fire Giant", but BleepBloop is a name
const theName = (m) => (m.def.raidLv ? m.def.name : `the ${m.def.name}`);
const TheName = (m) => theName(m)[0].toUpperCase() + theName(m).slice(1);
mobs.on('enrage', (m) => { // an MVP (or the Hell raid's boss) below half its HP (mobs.js MVP_RAGE)
  menus.message(`${TheName(m)} is enraged! It hits harder and faster now.`);
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Enraged!', 'skill');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff3a2a', 28);
  cam.shake = 0.4;
  audio.play('night');
});
mobs.on('frenzy', (m) => {
  menus.message(`The ${m.def.name} flies into a frenzy!`);
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.4), m.z, 'Frenzy!', 'skill');
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.2, m.z, '#ff4a3a', 18);
  audio.play('night');
});
// archers: an arrow flies at you, and the hit is rolled when it lands (FLEE and DEF apply)
const playerMark = { get x() { return player.x; }, get z() { return player.z; }, alive: true };
mobs.on('shoot', (m) => {
  audio.play('swing');
  const y = world.heightAt(m.x, m.z) + m.sprite.scale.y * 0.45;
  const foe = m.foe || player; // a beast it turned on, or the hero
  fx.bolt(m.x, y, m.z, foe === player ? playerMark : foe, m.def.shot || '#efe2c0', () => {
    if (!m.alive && !mobs.list.includes(m)) return;
    if (!foe.canBeHit(true) || foe.state === 'down') return; // (an arrow: it reaches the Hawk too)
    const res = mobAttack(m.def, foe.ps);
    if (res.miss) fx.number(foe.x, overHead(foe, 1.3), foe.z, res.dodge ? 'Lucky!' : 'Miss', 'miss');
    else foe.takeDamage(res.dmg, m.x, m.z);
  }, 0.2);
});
mobs.on('dash', (m) => { audio.play('dodge'); fx.puff(m.x, world.heightAt(m.x, m.z) + 0.15, m.z, 0.5); });
mobs.on('double', () => fx.number(player.x, overHead(player, 1.6), player.z, 'Double!', 'miss'));
mobs.on('summon', (m) => {
  menus.message(m.def.summonText || `The ${m.def.name} calls his guards!`);
  fx.sparkle(m.x, world.heightAt(m.x, m.z) + 1.5, m.z, '#ffd23a', 14);
  audio.play('night');
});
mobs.on('mvpSpawn', (m) => { // an MVP announces itself; a mini-boss just turns up
  if (!m.def.mvp) return;
  menus.message(m.def.wake || `The ${m.def.name} has appeared!`);
  audio.play('night');
});
mobs.on('bossDown', (m) => {
  const mins = Math.round(m.def.respawn / 60);
  setTimeout(() => menus.message(`The ${m.def.name} will return in about ${mins} minutes.`), 2500);
  persist();
});
// Ragnarok's MVP: the announcement over the slayer's head, MVP EXP and items straight to the bag
mobs.on('mvp', (m) => {
  const d = m.def;
  fx.number(player.x, overHead(player, 1.7), player.z, 'MVP', 'mvp', player);
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 30);
  audio.play('levelup');
  menus.message(`You defeated the ${d.name}! MVP! +${d.mvpExp * RATES.base} Base EXP`);
  for (const [id, n] of d.mvpDrops) {
    const got = inv.add(id, n);
    if (got < n) inv.chest.add(id, n - got);
    menus.toast(id, n);
  }
  gainExp(d.mvpExp, 0, RATES);
  const mins = Math.round(d.respawn / 60);
  setTimeout(() => menus.message(`The ${d.name} will return in about ${mins} minutes.`), 2500);
  persist();
});

// ---------- experience: Base and Job EXP, like Ragnarok ----------
const knownSkills = () => new Set(skillList(prog).filter((id) => skillLv(prog, id)));
function announceSkills(before) {
  for (const id of knownSkills()) if (!before.has(id) && (SKILLS[id].free || SKILLS[id].granted)) menus.message(`New skill: ${SKILLS[id].name}! See the Skills window.`);
}
// rate: RATES for battles, QUEST_RATE for quest rewards; none for EXP already counted at its rate
function gainExp(base, job, rate = { base: 1, job: 1 }) {
  const k = inv.wearing('exp') ? 1.25 : 1;
  const known = knownSkills();
  const ups = prog.gain(Math.round(base * k * rate.base), Math.round(job * k * rate.job));
  if (!ups.base && !ups.job) return;
  applyStats();
  const y = world.heightAt(player.x, player.z);
  if (ups.base) {
    player.heal(player.maxHp); // a base level up restores HP and SP
    player.healSp(player.maxSp);
    audio.play('levelup');
    fx.sparkle(player.x, y + 0.6, player.z, '#ffe37a', 14);
    fx.number(player.x, y + 1.9, player.z, 'Level Up', 'level');
    menus.message(`Base Level ${prog.baseLv}! ${prog.statPoints} stat point${prog.statPoints === 1 ? '' : 's'} to spend in the Status window.`);
  }
  if (ups.job) {
    if (!ups.base) audio.play('levelup');
    fx.sparkle(player.x, y + 0.6, player.z, '#9fd4ff', 10);
    fx.number(player.x, y + (ups.base ? 2.3 : 1.9), player.z, 'Job Level Up', 'job');
    menus.message(`Job Level ${prog.jobLv}!${prog.skillPoints ? ` ${prog.skillPoints} skill point${prog.skillPoints === 1 ? '' : 's'} to spend in the Skills window.` : ''}`);
    announceSkills(known);
  }
  if (menus.open) menus.render();
  persist();
}

// ---------- quests ----------
const questGiver = giverOf;
function questComplete(id) {
  audio.play('heart');
  // a second-job trial's hunt on the way hands itself in where you stand and starts the next
  // step; only the last step goes back to the trainer (the whole trial still pays at the end)
  if (NEXT[id] && Object.values(NPCS).some((n) => n.trial2?.includes(id)) && quests.turnIn(id, inv)) {
    quests.accept(NEXT[id]);
    menus.message(`${QUESTS[id].title} done! Next: ${QUESTS[NEXT[id]].title}`);
    refreshQuests();
    persist();
    return;
  }
  menus.message(`${QUESTS[id].title} complete! Return to ${NPCS[questGiver(id)].name}.`);
  refreshQuests();
}
function giveReward(r) {
  if (r.perz) { inv.addPerz(r.perz); menus.message(`+${r.perz.toLocaleString()} perz`); }
  for (const [id, n] of Object.entries(r.items || {})) {
    const got = inv.add(id, n);
    if (got < n) inv.chest.add(id, n - got); // bag full: it goes to the chest
    menus.toast(id, n);
  }
  if (r.xp) gainExp(r.xp, r.job ?? Math.round(r.xp * 0.7), QUEST_RATE); // (a job trial's steps on the way pay nothing)
}
// '!' / '?' bubbles over villagers, and the quest list under the clock: the story step first,
// then the active quests. It collapses to its title bar and scrolls when it gets long.
const tracker = document.getElementById('quests');
tracker.innerHTML = '<button class="qhead" aria-expanded="true"><span>Quests</span><i>▾</i></button><div class="qlist"></div>';
const trackerList = tracker.querySelector('.qlist'), trackerHead = tracker.querySelector('.qhead span');
const MIN_KEY = 'aria.questsMin';
let trackerMin = false;
try { trackerMin = localStorage.getItem(MIN_KEY) === '1'; } catch { /* storage unavailable */ }
const setMin = (v) => {
  trackerMin = v;
  tracker.classList.toggle('min', v);
  tracker.querySelector('.qhead').setAttribute('aria-expanded', String(!v));
  try { localStorage.setItem(MIN_KEY, v ? '1' : '0'); } catch { /* storage unavailable */ }
};
setMin(trackerMin);
tracker.querySelector('.qhead').addEventListener('click', () => { setMin(!trackerMin); audio.play('ui'); });
let trackerHTML = '';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function refreshQuests() {
  // a rare hunt's monster leaves once its quest is done or given up
  for (const m of [...mobs.list]) if (m.temp && m.alive && !m.story && MOB_DEFS[m.type].noRespawn && !Object.keys(quests.active).some((k) => QUESTS[k].mob === m.type && !quests.ready(k, inv))) mobs.remove(m);
  // monsters an active kill quest still wants come back twice as fast
  mobs.hunted = new Set(Object.keys(quests.active).flatMap((k) => {
    const q = QUESTS[k];
    return q.kind !== 'kill' || quests.ready(k, inv) ? [] : q.mobs ? Object.keys(q.mobs) : [q.mob];
  }));
  villagers.setMarks((npc) => {
    if (story.talkStep(npc) && storyLive()) return 'story';
    const st = quests.status(npc, prog, inv).state;
    return st === 'offer' || st === 'job' ? 'offer' : st === 'ready' ? 'ready' : null;
  });
  let h = '';
  const s = story.step;
  if (s && storyLive()) {
    const where = story.directions(world.id, prog);
    h += `<div class="story" data-q="story"><small>${esc(s.ch)}</small><b>★ ${esc(s.title)}</b><span>${esc(s.goal)}${story.progress()}</span>${where ? `<em>➜ ${esc(where)}</em>` : ''}</div>`;
  }
  for (const id of Object.keys(quests.active)) {
    const done = quests.ready(id, inv);
    h += `<div class="${done ? 'done' : ''}${QUESTS[id].job ? ' job' : ''}" data-q="${id}"><b>${QUESTS[id].title}</b><span>${done ? `Return to ${NPCS[questGiver(id)].name}` : quests.progress(id, inv)}</span>${nav?.quest === id ? '<em>➜ on the way</em>' : ''}</div>`;
  }
  const n = Object.keys(quests.active).length + (s && storyLive() ? 1 : 0);
  trackerHead.textContent = `Quests${n ? ` (${n})` : ''}`;
  tracker.hidden = !n;
  if (h !== trackerHTML) { trackerHTML = h; trackerList.innerHTML = h; }
  // the minimap rings where to go: the person to talk to, or the portal on the way
  ui.goal = null;
  const map = s && storyLive() ? story.map() : null;
  if (map === world.id && s.kind === 'talk') ui.goal = { x: NPCS[s.npc].x, z: NPCS[s.npc].z, label: NPCS[s.npc].name };
  else if (map === world.id && s.spawn) { // a story monster (the Gel Thief): the ring and the arrow follow it
    const m = mobs.list.find((o) => o.story && o.type === s.spawn.mob && o.alive);
    ui.goal = m ? { get x() { return m.x; }, get z() { return m.z; }, label: m.def.name, mob: true } : null;
  } else if (map === world.id && s.at) ui.goal = { x: s.at.x, z: s.at.z, label: s.kind === 'survive' ? 'Here' : '' };
  else if (map && map !== world.id) { const p = route(world.id, map); if (p) ui.goal = { x: p.x, z: p.z, label: ZONE_NAMES[p.to] }; }
}

// tap a quest in the list: its Quest View, with a Go button
trackerList.addEventListener('click', (e) => {
  const el = e.target.closest('[data-q]');
  if (!el) return;
  audio.play('ui');
  menus.openQuest(el.dataset.q);
});

// ---------- auto-navigation: walk portal by portal to where a quest happens ----------
// portals between two maps (fewest first)
function hops(from, to) {
  if (from === to) return 0;
  const seen = { [from]: 0 }, queue = [from];
  while (queue.length) {
    const m = queue.shift();
    for (const p of MAPS[m].portals) {
      if (p.to in seen || (p.need && !world.open(p.need))) continue; // (a hidden portal still shut)
      seen[p.to] = seen[m] + 1;
      if (p.to === to) return seen[p.to];
      queue.push(p.to);
    }
  }
  return Infinity;
}
const mapsOf = (mob) => Object.keys(SPAWNS).filter((m) => SPAWNS[m].some(([t]) => t === mob));
const nearestMap = (maps) => [...maps].sort((a, b) => hops(world.id, a) - hops(world.id, b))[0];
// where a quest sends you next: { map, npc (talk to them there), why }, or null
function questTarget(id) {
  if (id === 'story') {
    const s = story.step, map = s && story.map();
    return map ? { map, npc: s.npc || null, at: s.at, why: s.title } : null; // a talk step's person, the Keeper to sign with, or a place
  }
  const q = QUESTS[id], giver = questGiver(id);
  if (!(id in quests.active) || quests.ready(id, inv)) return { map: NPCS[giver].map || 'camp', npc: giver, why: NPCS[giver].name };
  if (q.rare) return { map: q.rare.map, at: q.rare, why: `the ${MOB_DEFS[q.mob].name}${q.rare.night ? ', out only at night' : ''}` };
  if (q.kind === 'search') return { map: q.map, why: `${q.thing}s` };
  if (q.kind === 'defend') return { map: q.map, at: q.at, why: q.place };
  if (q.kind === 'deliver') return { map: NPCS[q.to].map || 'camp', npc: q.to, why: NPCS[q.to].name };
  if (q.kind === 'kill') { // for a hunt of several kinds, the first kind still wanted
    const mob = q.mobs ? Object.keys(q.mobs).find((m) => (quests.active[id][m] || 0) < q.mobs[m]) : q.mob;
    const map = nearestMap(mapsOf(mob));
    return map ? { map, why: `${MOB_DEFS[mob].name}s` } : null;
  }
  // a quiz is answered to whoever gave it, once anything it needs is in the bag
  if (q.kind === 'quiz' && quests.hasItems(id, inv)) return { map: NPCS[giver].map || 'camp', npc: giver, why: NPCS[giver].name };
  if (q.kind === 'visit') { const left = q.zones.filter((z) => !quests.active[id].includes(z)); return left.length ? { map: nearestMap(left), why: 'a land to visit' } : null; }
  // a gathering quest: the nearest map where an item still missing drops
  let best = null;
  for (const [item, n] of Object.entries(q.items)) {
    if (inv.have(item) >= n) continue;
    for (const t of Object.keys(MOB_DEFS)) {
      if (!MOB_DEFS[t].drops.some(([d]) => d === item)) continue;
      for (const map of mapsOf(t)) {
        const h = hops(world.id, map);
        if (!best || h < best.h) best = { h, map, why: `${ITEMS[item].name} from ${MOB_DEFS[t].name}s` };
      }
    }
  }
  return best;
}
function startNav(id) {
  const t = questTarget(id);
  if (!t) { menus.message("You'll have to find that one yourself."); return; }
  nav = { quest: id, ...t };
  menus.close('quest');
  menus.message(world.id === t.map && !t.npc ? `${t.why}: right here in ${ZONE_NAMES[t.map]}.` : `On the way to ${ZONE_NAMES[t.map]}: ${t.why}. Tap the ground to stop.`);
  if (world.id === t.map && !t.npc) nav = null;
  refreshQuests();
}
// each frame: when idle, head for the next portal (or the person) on the way
function tickNav() {
  if (!nav || warping || player.state !== 'normal' || player.goal || player.cast || menus.isOpen('story')) return;
  if (world.id === nav.map) {
    const k = nav.npc, spot = k && SPOTS.find((sp) => sp.npc === k), at = nav.at;
    nav = null;
    if (spot) player.command({ x: spot.x, z: spot.z, reach: 1.7, arrive: spot.run });
    else if (at) player.command({ x: at.x, z: at.z, reach: 1.5 }); // a place: the waystone, the pond
    else menus.message(`You have arrived in ${ZONE_NAMES[world.id]}.`);
    refreshQuests();
    return;
  }
  const p = route(world.id, nav.map);
  if (!p) { nav = null; refreshQuests(); return; }
  player.command({ x: p.x, z: p.z, reach: 0.05 });
}
const stopNav = () => { if (nav) { nav = null; refreshQuests(); } };

// ---------- wading: in a lake's shallows the water hides the feet, and rings spread round them ----------
// A sprite faces the camera, so the water cannot hide its feet by depth: like Ragnarok, the sprite is
// cut at the waterline instead (a clipping plane on its material while it stands in the water)
const waterLine = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y); // keeps what is above the surface
function wet(mat, on) {
  if (!!mat.userData.wet === on) return;
  mat.userData.wet = on;
  mat.clippingPlanes = on ? [waterLine] : null;
  mat.needsUpdate = true;
}
let wadeT = 0;
function tickWading(dt) {
  const inWater = world.wading(player.x, player.z) > 0;
  for (const mat of [player.mat, player.headSpr.material, player.hairSpr.material]) wet(mat, inWater);
  for (const m of mobs.list) wet(m.mat, m.alive && !m.def.fly && world.wading(m.x, m.z) > 0);
  wadeT -= dt;
  if (wadeT > 0) return;
  wadeT = 0.32;
  const ring = (o, moving, size) => {
    if (world.wading(o.x, o.z) > 0 && (moving || Math.random() < 0.25)) fx.ripple(o.x, WATER_Y + 0.015, o.z, size);
  };
  ring(player, player.moving, 1);
  for (const m of mobs.list) {
    if (!m.alive || m.def.fly || Math.hypot(m.x - player.x, m.z - player.z) > 16) continue;
    ring(m, m.walked !== m.wadeW, m.def.w); // walked: how far it has gone in all, so a change means it moved
    m.wadeW = m.walked;
  }
}

// ---------- survive steps: hold a spot against waves (the Ember's Light in Moss Field, the vigil on Ember
// Hill while Vigdis sings). A step may set its own heralds ({ early, late, after }), wave gap (every),
// how many may stand before the next wave comes (most), colour, and words (startText, breakText) ----------
let vigil = null, giantWarnT = -99; // vigil: { t, next, list }
const VIGIL_WAVE = 15; // seconds between waves of heralds (lesser ones, like a boss's guards)
const giantOf = () => mobs.list.find((m) => m.alive && m.def.mvp && m.type === 'jarl');
function endVigil(why) {
  const g = giantOf();
  if (g) g.lulled = false;
  for (const m of vigil.list) if (mobs.list.includes(m)) { fx.puff(m.x, world.heightAt(m.x, m.z) + 0.3, m.z, m.def.w); mobs.remove(m); }
  vigil = null;
  story.count = 0;
  if (why) menus.message(why);
  refreshQuests();
}
function tickVigil(dt) {
  const s = story.step;
  if (!storyLive() || s?.kind !== 'survive') { if (vigil) endVigil(); return; }
  const y = world.heightAt(s.at.x, s.at.z);
  if (!vigil) {
    if (world.id !== s.map) return;
    if (Math.random() < dt * 3) fx.sparkle(s.at.x, y + 0.4, s.at.z, s.color || '#b48aff', 4); // where to stand
    if (Math.hypot(s.at.x - player.x, s.at.z - player.z) > 3 || player.state !== 'normal') return;
    // the Fire Giant roams the hill: the song would only wake him if he stood close, and once it
    // begins it lulls him while it lasts
    const g = giantOf();
    if (g && Math.hypot(g.x - s.at.x, g.z - s.at.z) < 14) {
      if (skillClock - giantWarnT > 8) { giantWarnT = skillClock; menus.message('The Fire Giant prowls too close to the circle: the song would wake him. Wait for him to wander off.'); }
      return;
    }
    if (g) { g.lulled = true; g.state = 'wander'; }
    vigil = { t: 0, next: 2, list: [], giant: g };
    menus.message(s.startText || 'The runes in the circle light up, and Vigdis\'s song rises out of them. The hill trembles: the heralds are coming!');
    cam.shake = 0.35;
    audio.play('night');
    return;
  }
  if (world.id !== s.map || player.state === 'down') { endVigil(s.breakText || 'The song breaks off. Go back to the hill road and begin again.'); return; }
  if (Math.hypot(s.at.x - player.x, s.at.z - player.z) > 12) { endVigil(s.breakText || 'You strayed too far, and the song breaks off. Stand by the rune circle and begin again.'); return; }
  if (vigil.giant?.alive && !vigil.giant.lulled) { endVigil('You struck the Fire Giant: he wakes, and the song breaks off. Let him wander off, then begin again.'); return; }
  vigil.t += dt;
  story.count = Math.floor(vigil.t);
  if (Math.random() < dt * 6) fx.sparkle(s.at.x + (Math.random() - 0.5) * 3, y + 0.3, s.at.z + (Math.random() - 0.5) * 3, s.color || '#b48aff', 3); // the song in the air
  const up = vigil.list.filter((m) => m.alive).length;
  if (vigil.t >= vigil.next && vigil.t < s.secs - 4 && up < (s.most || 4)) { // a wave of heralds from all round the hill (held back while four still stand)
    vigil.next += s.every || VIGIL_WAVE;
    const H = s.heralds || { early: ['beetle', 'wisp'], late: ['beetle', 'beetle', 'wisp'], after: 30 };
    const kinds = vigil.t > H.after ? H.late : H.early, a0 = Math.random() * Math.PI * 2; // the hill grows angrier
    kinds.forEach((type, i) => {
      const a = a0 + (i / kinds.length) * Math.PI * 2;
      let x = s.at.x + Math.cos(a) * 8, z = s.at.z + Math.sin(a) * 8;
      if (!world.walkable(x, z)) { x = s.at.x + Math.cos(a) * 4; z = s.at.z + Math.sin(a) * 4; }
      const m = mobs.add(type, x, z);
      m.def = guardDef(type);
      m.hp = m.def.hp;
      m.temp = true;
      m.provoke();
      vigil.list.push(m);
    });
    fx.puff(s.at.x, y + 0.2, s.at.z, 2);
    cam.shake = 0.3;
  }
  if (vigil.t >= s.secs) { story.flag(s.id); endVigil(); }
}

// ---------- a story step's own monster (spawn: { mob, at }): there whenever the hero is on its map ----------
function tickStorySpawn() {
  const s = story.step, sp = s?.spawn;
  if (!storyLive() || !sp || world.id !== s.map || story.count >= s.n || warping) return;
  if (mobs.list.some((m) => m.type === sp.mob && m.alive)) return;
  const at = world.walkable(sp.at.x, sp.at.z) ? sp.at : mobs.findSpot(Math.random, player);
  if (!at) return;
  const m = mobs.add(sp.mob, at.x, at.z);
  m.temp = true; // (gone when the hero leaves; back when they return, until it is beaten)
  m.story = true; // (not a quest's rare hunt: refreshQuests leaves it be)
}

// ---------- raids (raid.js): three waves and a boss against the clock ----------
// The Boatman rows you out; the waves come in from the shore all round and never give up; after each
// wave a breather (and before the boss a full heal). EXP is held while you fight and paid when the
// run ends, x1.5, on a clear. Leaving, fainting or the tide (the timer) ends it, and so does closing
// the game mid-run: a failed run pays nothing and costs no cooldown. One cooldown for every
// difficulty, from going in, started by a clear. The story's Tutorial run (only while the story waits
// on the raid) starts no cooldown; only a clear of it moves the story on and pays (a lost one is a
// failed run like any other). Every run goes in the raid history (raidLog), with what it paid.
// when each raid opens again (ms since 1970): { bloop, kobold, goblin }. A save from when Bloop
// Island was the only raid kept one number
let raidAt = typeof save?.raidAt === 'number' ? { bloop: save.raidAt } : { ...(save?.raidAt || {}) };
let raid = null; // { id, diff, left, wave, phase: land | fight | rest, restT, list, boss, exp: [base, job], arrived, shown, back }
// the raids this hero has done once at their guide: from then on they can set out from anywhere (the
// Raids window), and come back to where they were (raid.back). A hero who set out on one before
// (raidAt), or took Bloop Island's story crossing, has it open already
const raidsDone = new Set([...(save?.raidsDone || []), ...Object.keys(raidAt), ...(save?.story?.flags?.bloopisle ? ['bloop'] : [])]);
// every run, newest first: { id, diff, at, secs, won, why, perz, exp: [base, job], items: [[id, n]] } (saved)
const raidLog = Array.isArray(save?.raidLog) ? save.raidLog : [];
const RAID_LOG = 50; // runs kept
function logRaid(e) { raidLog.unshift(e); raidLog.length = Math.min(raidLog.length, RAID_LOG); }
// a run the game was closed in the middle of: a failure, nothing paid (save.raidRun)
if (save?.raidRun && RAIDS[save.raidRun.id] && !raidLog.some((e) => e.at === save.raidRun.at)) logRaid({ ...save.raidRun, secs: null, won: false, why: 'The game was closed mid-run', perz: 0, exp: [0, 0], items: [] });
const raidBar = document.getElementById('raidbar'), bossBar = document.getElementById('bossbar');
raidBar.querySelector('.rb-leave').addEventListener('click', () => { if (raid) endRaid(false, RAIDS[raid.id].words.leave, false, 'Left the raid'); });
const raidOf = (map) => Object.entries(RAIDS).find(([, R]) => R.map === map)?.[1] || null;
const storyRaid = (id) => storyLive() && story.step?.kind === 'raid' && story.step.raid === id;
const boatSpot = (R) => ({ x: NPCS[R.npc].x, z: NPCS[R.npc].z + 1.4 });
// a monster as it stands, facing you, as a picture (the Boatman shows the raid's boss): its first
// standing frame, cropped to what is painted, cached
const mobPics = {};
function mobPortrait(art) {
  if (art in mobPics) return mobPics[art];
  try {
    const set = lib.mobs[art], anims = set.anims.down || Object.values(set.anims)[0];
    const img = (anims.idle || Object.values(anims)[0])[0].image;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (px[(y * c.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (x1 < 0) return set.loaded ? (mobPics[art] = null) : null; // (a sheet still loading: asked again later)
    const w = x1 - x0 + 1, h = y1 - y0 + 1, out = document.createElement('canvas');
    out.width = w; out.height = h;
    out.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h);
    return (mobPics[art] = out.toDataURL());
  } catch { return (mobPics[art] = null); }
}
function raidInfo(id) {
  return { wait: Math.max(0, (raidAt[id] || 0) - Date.now()), story: storyRaid(id) };
}
function raidGo(id, diff, anywhere = false) {
  const R = RAIDS[id], D = R.difficulties[diff], info = raidInfo(id);
  if (raid || warping || !D || (D.tutorial ? !info.story : info.wait)) return;
  if (anywhere && !raidsDone.has(id)) { menus.message(`Raid once with ${NPCS[R.npc].name} in ${ZONE_NAMES[R.from]} first.`); return; }
  if (anywhere && (raidOf(world.id) || defense)) { menus.message('Not from here.'); return; }
  if (!D.tutorial && prog.baseLv < D.lv) { menus.message(`${D.name} needs Base Level ${D.lv}.`); return; } // (each difficulty needs its level)
  raid = { id, diff, start: Date.now(), left: R.secs, wave: -1, phase: 'land', restT: 2.5, list: [], boss: null, exp: [0, 0], arrived: false, shown: 1,
    back: anywhere ? { map: world.id, x: player.x, z: player.z } : null }; // (set out from anywhere: back there after)
  menus.close('talk');
  warp(R.map, null, R.landing);
}
// one of the raid's monsters, from the shore, away from the hero
function raidSpawn(R, type, lv, s, guard = null) {
  const r = MAPS[R.map].arena.r - 2;
  let x = 32, z = 32;
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    x = 32 + Math.cos(a) * r; z = 32 + Math.sin(a) * r;
    if (world.walkable(x, z) && Math.hypot(x - player.x, z - player.z) > 7) break;
  }
  const m = mobs.add(type, x, z);
  m.def = raidDef(type, lv, s, guard);
  m.hp = m.def.hp;
  m.temp = true;
  fx.puff(x, world.heightAt(x, z) + 0.3, z, m.def.w);
  raid.list.push(m);
  return m;
}
function raidNext(R, D) {
  raid.wave++;
  raid.phase = 'fight';
  if (raid.wave < R.waves.length) {
    for (const [type, n, off] of R.waves[raid.wave]) for (let i = 0; i < n; i++) raidSpawn(R, type, D.lv + off, D.wave);
    menus.message(`Wave ${raid.wave + 1} of ${R.waves.length}! ${R.words.wave}`);
    audio.play('night');
    cam.shake = 0.25;
  } else {
    const [type, off] = R.boss;
    raid.boss = raidSpawn(R, type, D.lv + off, D.boss, D.wave);
    menus.message(`${raid.boss.def.name} ${R.words.boss}`);
    audio.play('night');
    cam.shake = 0.6;
  }
}
function tickRaid(dt) {
  if (!raid) return;
  const R = RAIDS[raid.id], D = R.difficulties[raid.diff];
  if (!raid.arrived) {
    if (world.id !== R.map || warping) return;
    raid.arrived = true;
    menus.message(`${R.name}, ${D.name}: ${R.words.arrive}. ${R.secs / 60} minutes ${R.words.time}!`);
  }
  if (world.id !== R.map) { endRaid(false, 'You left the arena, and the raid is lost.', true, 'Left the arena'); return; }
  if (player.state === 'down') { endRaid(false, 'You fainted, and the raid is lost.', true, 'Fainted'); return; }
  raid.left -= dt;
  if (raid.left <= 0) { endRaid(false, R.words.timeUp, false, 'Out of time'); return; }
  if (raid.phase === 'fight' && !raid.list.some((m) => m.alive && mobs.list.includes(m))) {
    if (raid.boss) { winRaid(R, D); return; }
    const last = raid.wave === R.waves.length - 1, k = last && R.bossHeal ? 1 : R.breather;
    player.heal(Math.ceil(player.maxHp * k));
    player.healSp(Math.ceil(player.maxSp * k));
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.6, player.z, '#9fe8a8', 14);
    menus.message(last ? 'The last wave falls, and the ground shakes... Your HP and SP are restored. Get ready!' : `Wave ${raid.wave + 1} cleared! Catch your breath (HP and SP partly restored).`);
    raid.phase = 'rest';
    raid.restT = R.rest;
    raid.list = [];
  }
  if (raid.phase !== 'fight' && (raid.restT -= dt) <= 0) raidNext(R, D);
  raidHud(R, D);
}
function raidHud(R, D) {
  raidBar.hidden = false;
  const s = Math.max(0, Math.ceil(raid.left));
  raidBar.querySelector('.rb-name').textContent = `${R.name} · ${D.name}`;
  const time = raidBar.querySelector('.rb-time');
  time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  time.classList.toggle('low', s < 60);
  raidBar.querySelector('.rb-stage').textContent = raid.boss ? 'Boss' : raid.wave < 0 ? 'Landing' : `Wave ${raid.wave + 1}/${R.waves.length}`;
  raidBar.querySelector('.rb-exp').textContent = `EXP held ${Math.round(raid.exp[0]).toLocaleString()}`;
  // the boss's big health bar
  const b = raid.boss;
  bossBar.hidden = !(b && b.alive);
  if (bossBar.hidden) return;
  const f = Math.max(0, b.hp / b.def.hp);
  bossBar.querySelector('.bb-name').textContent = `${b.def.name} · Lv ${b.def.lv}`;
  bossBar.querySelector('.bb-bar i').style.width = `${(f * 100).toFixed(1)}%`;
  bossBar.classList.toggle('low', f < 0.3);
  if (f < raid.shown - 0.001) { bossBar.classList.remove('hit'); void bossBar.offsetWidth; bossBar.classList.add('hit'); } // a blow lands: the bar flashes
  raid.shown = f;
}
function winRaid(R, D) {
  audio.play('levelup');
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 30);
  menus.message(`${R.name} cleared on ${D.name} with ${Math.floor(raid.left / 60)}:${String(Math.floor(raid.left % 60)).padStart(2, '0')} to spare!`);
  endRaid(true, null);
}
// the clear reward: perz, items, and the rare roll. Returns what was given: { perz, items: [[id, n]] }
function raidReward(id, diff) {
  const r = rollReward(id, diff), got = [];
  if (r.perz) { inv.addPerz(r.perz); menus.message(`+${r.perz.toLocaleString()} perz`); }
  const give = (item, n) => { const kept = inv.add(item, n); if (kept < n) inv.chest.add(item, n - kept); menus.toast(item, n); got.push([item, n]); };
  for (const [item, n] of Object.entries(r.items)) give(item, n);
  if (r.rare) r.rare = maybeSlotted(r.rare); // a raid's rare can come with a card slot too
  if (r.rare) { give(r.rare, 1); audio.play('heart'); menus.message(`Rare find! ${ITEMS[r.rare].name}!`); }
  if (r.ultra) { const u = maybeSlotted(r.ultra); give(u, 1); audio.play('heart'); cam.shake = 0.3; menus.message(`ULTRA RARE! ${ITEMS[u].name}!`); }
  if (r.card) { give(r.card, 1); audio.play('heart'); menus.message(`Rare find! ${ITEMS[r.card].name}!`); }
  return { perz: r.perz || 0, items: got };
}
// the run is over: its monsters go, the EXP held is paid, and (unless the hero went elsewhere) the
// Boatman rows them back
function endRaid(win, why, stay = false, short = why) {
  const R = RAIDS[raid.id], D = R.difficulties[raid.diff], run = raid;
  // EXP: all of it x1.5 on a clear, nothing on a failed run
  const k = win ? 1.5 : 0, b = Math.round(run.exp[0] * k), j = Math.round(run.exp[1] * k);
  for (const m of [...mobs.list]) if (m.def.raidLv) mobs.remove(m);
  raid = null;
  raidsDone.add(run.id); // done once: the Raids window may send them from anywhere now
  if (win && !D.tutorial) raidAt[run.id] = run.start + R.cooldown; // only a clear starts the cooldown (from going in)
  // only a clear pays; a cleared Tutorial run (and only that) moves the story on
  const paid = win ? raidReward(run.id, run.diff) : { perz: 0, items: [] };
  logRaid({ id: run.id, diff: run.diff, at: run.start, secs: Math.round(R.secs - Math.max(0, run.left)), won: win, why: win ? null : short, perz: paid.perz, exp: [b, j], items: paid.items });
  if (win && D.tutorial && storyRaid(run.id)) story.flag(story.step.id);
  raidBar.hidden = bossBar.hidden = true;
  if (why) menus.message(why);
  if (b || j) {
    menus.message(`Raid EXP: +${b.toLocaleString()} Base, +${j.toLocaleString()} Job${win ? ' (x1.5 for the clear)' : ''}`);
    gainExp(b, j); // already at the battle rate
  } else if (!win) menus.message(D.tutorial ? 'The raid failed: no rewards. The Boatman will row you out again whenever you are ready.' : 'The raid failed: no rewards, and no cooldown. Try again when you are ready.');
  if (!stay) setTimeout(() => (run.back ? warp(run.back.map, null, run.back) : warp(R.from, null, boatSpot(R))), win ? 2500 : 700);
  refreshQuests();
  persist();
}

// ---------- quests out in the world: searches, defences and rare hunts ----------
let searchT = 0, defense = null, waveRest = 0; // waveRest: a breather between a defence's waves
function tickQuestWorld(dt) {
  searchT -= dt;
  waveRest -= dt;
  const y = (x, z) => world.heightAt(x, z);
  for (const [id, a] of Object.entries(quests.active)) {
    const q = QUESTS[id];
    // a search: what is still to be found glints, and is picked up by walking over it
    if (q.kind === 'search' && q.map === world.id) {
      if (searchT <= 0) q.spots.forEach(([x, z], i) => { if (!a.includes(i) && Math.hypot(x - player.x, z - player.z) < 26) fx.sparkle(x, y(x, z) + 0.4, z, '#ffe37a', 4); });
    }
    // a rare hunt: it shows itself on its map (at night, if it keeps to the night) until it falls
    if (q.rare && q.rare.map === world.id) {
      const out = mobs.list.find((m) => m.type === q.mob && m.alive);
      const time = !q.rare.night || dayNight.night > 0.6;
      if (!out && time && !quests.ready(id, inv)) {
        const m = mobs.add(q.mob, q.rare.x, q.rare.z);
        m.temp = true;
        menus.message(`Something golden rises over ${ZONE_NAMES[world.id]}... the ${MOB_DEFS[q.mob].name}!`);
        audio.play('night');
      } else if (out && !time) { mobs.remove(out); menus.message(`Dawn: the ${MOB_DEFS[q.mob].name} fades away. It will be back tonight.`); }
    }
    // a defence: stand by the place and the waves come
    if (q.kind === 'defend' && q.map === world.id && !quests.ready(id, inv) && !defense) {
      if (searchT <= 0) fx.sparkle(q.at.x, y(q.at.x, q.at.z) + 0.6, q.at.z, '#8fd4ff', 6);
      if (waveRest <= 0 && Math.hypot(q.at.x - player.x, q.at.z - player.z) < 3.5 && player.state === 'normal') startWave(id);
    }
  }
  if (searchT <= 0) searchT = 0.6;
  for (const { id, n } of quests.onSearch(world.id, player.x, player.z)) {
    const q = QUESTS[id];
    audio.play('pickup');
    fx.sparkle(player.x, y(player.x, player.z) + 0.8, player.z, '#ffe37a', 18);
    menus.message(`${q.verb || 'Found'}: ${q.thing} ${n}/${q.spots.length}`);
    if (id === 'sphinx6') { // the Sphinx Eye set in the obelisk: the hidden way south opens
      cam.shake = 0.6; audio.play('night');
      fx.sparkle(player.x, y(player.x, player.z) + 1.2, player.z, '#7ad8ff', 30);
      menus.message('The Sphinx Eye clicks into the obelisk, and the whole desert sighs. To the south, a way opens through the sand...');
    }
    if (quests.ready(id, inv)) questComplete(id); else refreshQuests();
  }
  tickDefense(dt);
  sphinxDoor();
}
// the Giant Sphinx's door (Sphinx Sands): sealed for now; the first dungeon lies behind it, still being dug out
let doorSaid = false;
function sphinxDoor() {
  const door = world.id === 'sphinx' && world.monument?.door;
  const near = door && Math.hypot(door.x - player.x, door.z - player.z) < 2.2;
  if (near && !doorSaid) {
    doorSaid = true;
    audio.play('night');
    fx.sparkle(door.x, world.heightAt(door.x, door.z) + 1.4, door.z - 1.2, '#7ad8ff', 16);
    menus.message('The great door is sealed. Deep inside, something old is waking... (The Sphinx\'s halls are still being dug out: coming soon.)');
  } else if (!near && doorSaid && (!door || Math.hypot(door.x - player.x, door.z - player.z) > 5)) doorSaid = false;
}
function startWave(id) {
  const q = QUESTS[id], [type, count] = q.waves[quests.active[id]];
  const list = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random(), r = 6 + Math.random() * 2;
    let x = q.at.x + Math.cos(a) * r, z = q.at.z + Math.sin(a) * r;
    if (!world.walkable(x, z)) { x = q.at.x + Math.cos(a) * 3; z = q.at.z + Math.sin(a) * 3; }
    const m = mobs.add(type, x, z);
    m.temp = true;
    m.provoke();
    list.push(m);
  }
  defense = { id, list, next: 0 };
  audio.play('night');
  menus.message(`Wave ${quests.active[id] + 1} of ${q.waves.length}: ${count} ${MOB_DEFS[type].name}s come for ${q.place}!`);
}
function tickDefense(dt) {
  if (!defense) return;
  const q = QUESTS[defense.id];
  // walked away, fainted, or left the map: the wave scatters (waves already held still count)
  if (!(defense.id in quests.active) || world.id !== q.map || player.state === 'down' || Math.hypot(q.at.x - player.x, q.at.z - player.z) > 16) {
    for (const m of defense.list) if (mobs.list.includes(m)) mobs.remove(m);
    defense = null;
    if (q.map === world.id) menus.message(`You left ${q.place}, and the wave scatters. Come back to try again.`);
    return;
  }
  if (defense.list.some((m) => m.alive)) return;
  quests.waveHeld(defense.id);
  const id = defense.id;
  defense = null;
  audio.play('levelup');
  if (quests.ready(id, inv)) questComplete(id);
  else { waveRest = 6; menus.message(`Wave held! Catch your breath: the next one comes in a few seconds.`); refreshQuests(); }
}

// ---------- the story ----------
const storyLive = () => !!story.flags.intro && !story.done; // after the opening pages
// a step is done: its lines play, then the reward, then the next step is announced
function storyDone() {
  const s = story.advance();
  const say = typeof s.say === 'function' ? s.say(story.flags, prog) : s.say; // (a step's lines may depend on how it went)
  menus.story(say || [], `${s.ch} · ${s.title}`, () => {
    if (s.reward) giveReward(s.reward);
    audio.play('heart');
    const next = story.step;
    if (next) menus.message(`Story: ${next.title}. ${next.goal}`);
    refreshQuests();
    persist();
    if (s.id === 'paths') toTrainer(); // (the Elder sends the hero on to the path they picked)
  });
}
// Elder Halvard's choice made: the hero is taken straight to the picked path's city, beside its trainer
function toTrainer() {
  const c = CALLINGS[story.flags.pick];
  if (!c || world.id === c.city) return;
  const [, n] = Object.entries(NPCS).find(([, v]) => v.map === c.city && v.job === c.job) || [];
  menus.message(`Elder Halvard sends you on to ${ZONE_NAMES[c.city]}: ${c.trainer} is waiting.`);
  warp(c.city, null, n ? { x: n.x, z: n.z + 1.6 } : null);
}
function checkStory() {
  if (!storyLive() || menus.isOpen('story')) return;
  // a Trainee grown to Job 9 on the way through Chapter 1 is called home to choose a path (not in the
  // middle of a stand)
  if (!vigil && story.callHome(prog)) {
    const next = story.step;
    menus.story(CALL_HOME, `${next.ch} · Called Home`, () => {
      audio.play('heart');
      menus.message(`Story: ${next.title}. ${next.goal}`);
      refreshQuests();
      persist();
    });
    return;
  }
  if (story.met({ prog, hotbar, skillLv, keepers, inv, quests })) storyDone();
}
// ---------- the guided lessons: the Prologue's stats, equipment and hotbar steps, and the chase ----------
// Each runs once, when its story step comes up (skipped or finished: flags.guide_<step>), and stops
// when the step is done. guide.js rings what to tap and says what it is.
const guide = new Guide();
const $ = (sel, root = document) => root?.querySelector(sel) || null;
const win = (id) => (menus.isOpen(id) ? menus.wins[id] : null);
const hudBtn = (id) => $(`[data-btn="${id}"]`);
const STAT_TALK = {
  pow: '<b>POW, Power</b>: your blows up close (every point, and a big jump every 10) and how much you can carry. <b>The main stat of Bladers and Assassins.</b>',
  qkn: '<b>QKN, Quickness</b>: attack speed (more than any other stat) and Flee, your chance to dodge a blow. <b>Bladers, Archers and Assassins</b> all want it: an Assassin lives by dodging.',
  end: '<b>END, Endurance</b>: Max HP, defense against every blow, HP recovery and some magic defense. <b>Never wasted, on any path.</b>',
  knl: '<b>KNL, Knowledge</b>: magic attack, Max SP for your skills, SP recovery and magic defense. <b>The Sorcerer\'s main stat.</b>',
  fns: '<b>FNS, Finesse</b>: hit (how often your blows land), steadier damage, a little attack speed and faster spells. With a bow it is your attack: <b>the Archer\'s main stat.</b>',
  ftn: '<b>FTN, Fortune</b>: <b>critical hits and lucky dodges</b>, its main use, and a little attack. A critical hit never misses and goes through armor (skills never crit), so some build around it: a <b>crit Assassin</b> (POW, QKN, FTN) or a <b>crit Archer</b> (FNS, FTN, QKN).',
};
const inItems = (tab) => () => menus.isOpen('items') && (!tab || menus.tab === tab);
const GUIDES = {
  stats: () => [
    { at: () => hudBtn('status'), text: 'Your stats decide what kind of fighter you are. Tap <b>Status</b>.', done: () => menus.isOpen('status') },
    { at: () => $('.stsub', win('status')), need: () => menus.isOpen('status'), text: 'These are your <b>Status Points</b>, and each Base Level brings more. A stat costs more the higher it goes, and taking points back needs a <b>costly reset</b>: so first, what each stat does.' },
    ...STAT_KEYS.map((k, i) => ({ at: () => win('status')?.querySelectorAll('table.stats tr')[i] || null, need: () => menus.isOpen('status'), text: STAT_TALK[k] })),
    { at: () => $('table.stats', win('status')), need: () => menus.isOpen('status'), text: 'Not sure which path you will take? <b>END is never wasted.</b> If you know: a Blader wants POW, QKN and END; a Sorcerer KNL, FNS and END; an Archer FNS and QKN; an Assassin POW and QKN, with a little END and FNS (quick daggers, and dodging instead of taking blows). For crits, an Assassin or an Archer adds FTN.' },
    { at: () => $('table.stats', win('status')), need: () => menus.isOpen('status'), text: 'Tap <b>▲</b> beside a stat to place a point. Nothing is final yet: <b>Reset</b> takes back points you have not confirmed.', done: () => menus.pendCount() > 0 || story.step?.id !== 'stats' },
    { at: () => $('[data-act="statconfirm"]', win('status')), need: () => menus.isOpen('status'), text: 'Happy with them? <b>Confirm</b> locks your points in. (Place more first if you like.)', done: () => story.step?.id !== 'stats' },
  ],
  equip: () => [
    { at: () => hudBtn('items'), text: 'Elder Halvard\'s cloak is in your bag. Tap <b>Items</b>.', done: inItems() },
    { at: () => $('[data-act="tab"][data-id="equip"]', win('items')), need: inItems(), text: 'Gear is under <b>Equips</b>.', done: inItems('equip') },
    { at: () => $('.rslot[data-id="travel_cloak"]', win('items')), need: inItems('equip'), back: 1, text: 'Tap the <b>Traveler\'s Cloak</b> to see what it gives.', done: () => menus.selected === 'travel_cloak' || story.step?.id !== 'equip' },
    { at: () => $('[data-act="equip"]', win('items')), need: inItems('equip'), back: 1, text: 'Here is what it gives: DEF, and which jobs can wear it. Tap <b>Equip</b> to put it on.', done: () => story.step?.id !== 'equip' },
  ],
  thief: () => [
    { at: () => null, text: 'The <b>golden bloop</b> is the Gel Thief. Follow the <b>gold arrow</b> to it, and tap it to give chase. It runs from you, but it is fat with the ember: after a few seconds of running, or once you corner it against the trees, it turns to fight.' },
  ],
  hotbar: () => [
    { at: () => hudBtn('items'), text: 'The hotbar along the bottom holds potions and skills, one tap away. Tap <b>Items</b>.', done: inItems() },
    { at: () => $('[data-act="tab"][data-id="use"]', win('items')), need: inItems(), text: 'Potions are under <b>Usables</b>.', done: inItems('use') },
    { at: () => $('.rslot[data-id="potion"]', win('items')), need: inItems('use'), back: 1,
      drag: [() => $('.rslot[data-id="potion"]', win('items')), () => hotbar.nextFree, iconURL('potion')],
      text: '<b>Press and hold</b> the Red Potion, <b>drag</b> it down onto an empty hotbar slot, and let go. (Or tap it, then <b>Add to hotbar</b>.)', done: () => hotbar.has('item', 'potion') },
  ],
};
let guideFor = null; // the story step the running lesson is for
function tickGuide(dt) {
  const s = story.step;
  if (guide.running && (guideFor !== s?.id || !storyLive())) guide.stop(true);
  if (!guide.running && storyLive() && s && GUIDES[s.id] && !story.flags[`guide_${s.id}`] && !menus.isOpen('story') && !cine
    && (s.id !== 'thief' || world.id === s.map)) { // (the chase's, once in Moss Field)
    guideFor = s.id;
    guide.start(GUIDES[s.id](), { onEnd: () => { story.flags[`guide_${guideFor}`] = true; } });
  }
  guide.update(dt);
}

// the story's goal on this map, during the Prologue (and for a story monster): a gold arrow at the
// screen's edge pointing to it while it is off the screen, or over it (a monster) while on it
const goalArrow = document.createElement('div');
goalArrow.id = 'goalarrow';
goalArrow.hidden = true;
goalArrow.innerHTML = '<i></i><span></span>';
document.getElementById('hud').appendChild(goalArrow);
const goalTri = goalArrow.querySelector('i');
const goalV = new THREE.Vector3();
function tickGoalArrow() {
  const s = story.step, g = ui.goal;
  const on = storyLive() && s && g && story.map() === world.id && (s.ch === 'Prologue' || s.spawn) && !cine;
  goalArrow.hidden = !on;
  if (!on) return;
  goalV.set(g.x, world.heightAt(g.x, g.z) + 1.6, g.z).project(camera);
  const W = innerWidth, H = innerHeight, behind = goalV.z > 1;
  let x = (goalV.x + 1) / 2 * W, y = (1 - goalV.y) / 2 * H;
  if (behind) { x = W - x; y = H - y; }
  const m = 40, inside = !behind && x > m && x < W - m && y > m && y < H - m;
  goalArrow.querySelector('span').textContent = inside ? '' : g.label || ''; // (on the screen a monster wears its own name)
  if (inside) {
    if (!g.mob) { goalArrow.hidden = true; return; } // (a spot or a person on the screen: the minimap's ring is enough)
    goalArrow.style.transform = `translate(${x - 30}px, ${y - 52}px)`;
    goalArrow.style.flexDirection = 'column-reverse'; // (its name over the arrow pointing down at it)
    goalTri.style.transform = 'rotate(180deg)';
    return;
  }
  // to the screen's edge, along the line from its middle
  const cx = W / 2, cy = H / 2, dx = x - cx, dy = y - cy, k = Math.min((W / 2 - m) / Math.abs(dx || 1e-6), (H / 2 - m) / Math.abs(dy || 1e-6));
  const ex = cx + dx * k, ey = cy + dy * k, ang = Math.atan2(dy, dx) + Math.PI / 2;
  goalArrow.style.transform = `translate(${ex - 30}px, ${ey - 20}px)`;
  goalArrow.style.flexDirection = Math.cos(ang) < -0.3 ? 'column-reverse' : 'column'; // (the name behind the arrow: over one pointing down)
  goalTri.style.transform = `rotate(${ang}rad)`; // (only the arrow turns: the name stays upright)
}

function startStory() {
  if (story.flags.intro) return;
  menus.story(INTRO, 'Prologue · The Last Fire-Ring', () => {
    story.flag('intro');
    refreshQuests();
    persist();
  });
}

let bagFullNote = 0;
function collect(p) {
  const got = inv.add(p.item, p.count);
  if (got) { menus.toast(p.item, got); audio.play('pickup'); }
  if (got < p.count) {
    p.count -= got;
    if (performance.now() - bagFullNote > 4000) { bagFullNote = performance.now(); menus.message(prog.job === 'novice' ? 'Bag is full. Sell what you can spare to a trader (the Keepers\' storage opens with a first job).' : 'Bag is full. Put things in a Keeper\'s storage.'); }
    return false;
  }
  return true;
}

// ---------- menus + camp interactions ----------
const menus = new Menus(inv, prog, player, {
  useItem: (id) => useItem(id),
  // Gyda the Healer: HP and SP back to full, for nothing
  heal() {
    player.heal(player.maxHp);
    player.healSp(player.maxSp);
    audio.play('craft');
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#9fffb0', 18);
    menus.message('Gyda mends your wounds. HP and SP are full.');
  },
  // the Quest View: where a quest is, and walking there
  questTarget: (id) => questTarget(id),
  questGo: (id) => startNav(id),
  questQuit(id) {
    if (id === 'story' || !quests.quit(id)) return; // the main story can never be given up
    if (nav?.quest === id) nav = null;
    audio.play('ui');
    menus.message(SERIES[id] ? `${QUESTS[id].title.split(':')[0]} given up. Its trainer will start you over, or you may pick another trial.` : `${QUESTS[id].title} given up.`);
    refreshQuests();
    persist();
  },
  storyStep: () => (storyLive() ? story.step : null),
  // the story step's guided lesson, again (it shows once by itself)
  hasGuide: () => storyLive() && !!GUIDES[story.step?.id] && !guide.running,
  guideMe() { delete story.flags[`guide_${story.step?.id}`]; },
  // story pages that ask (the Seeress's rune-reading): each answer counts toward a calling
  storyFlags: () => story.flags,
  storyPic: (p) => (p.job ? jobPic(p.job) : p.mob ? mobPortrait(p.mob) : ''), // (a job on the hero, or a monster)
  storyChoice: (key) => {
    audio.play('ui');
    if (key.includes(':')) { const [k, v] = key.split(':'); story.flags[k] = v; return; } // a pick (pick:blade): kept as it is
    const c = (story.flags.calling ||= {}); c[key] = (c[key] || 0) + 1; story.flags.lastCall = key; // an answer: counted toward a calling
  },
  storyFx: (o) => { if (o?.shake) cam.shake = o.shake; if (o?.sound) audio.play(o.sound); },
  storyProgress: () => story.progress(),
  // the Keepers: sign their ledger, save there, and teleport between the ones you have signed
  keeperKnown: (k) => keepers.has(k),
  savedAt: () => savePoint?.keeper || 'keeper_camp',
  keeperRegister(k) {
    keepers.add(k);
    audio.play('craft');
    menus.message(`You sign ${NPCS[k].name}'s ledger. ${ZONE_NAMES[NPCS[k].map || 'camp']} remembers you.`);
    persist();
  },
  keeperSave(k) {
    const n = NPCS[k];
    savePoint = { keeper: k, map: n.map || 'camp', x: n.x, z: n.z + 1.4 };
    audio.play('craft');
    fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffe37a', 14);
    menus.message(`Saved at ${ZONE_NAMES[savePoint.map]}. You will wake here after a fall, and Return Feathers bring you here.`);
    persist();
  },
  keeperList: (here) => [...keepers].filter((k) => k !== here && NPCS[k]).map((k) => [k, FARES[NPCS[k].map || 'camp']]),
  keeperGo(k) {
    const n = NPCS[k], fare = FARES[n.map || 'camp'];
    if (!keepers.has(k) || inv.perz < fare) return;
    inv.perz -= fare;
    menus.close('talk');
    warp(n.map || 'camp', null, { x: n.x, z: n.z + 1.4 });
  },
  // Ivar the Ferryman: the lands you have walked, and his fares
  ferryList: () => Object.entries(FARES).filter(([m]) => (visited.has(m) || ALWAYS_FARES.includes(m)) && m !== world.id),
  // the Boatman: the raid's difficulties and the tide
  raidInfo: (id) => raidInfo(id),
  mobPortrait: (art) => mobPortrait(art),
  raidGo: (id, diff, anywhere) => raidGo(id, diff, anywhere),
  // the Raids window: every raid, its guide and land, open to them (done once) or not, and its tide
  raidLog: () => raidLog,
  // the Quests window: the story's step and chapters, and every quest by kind (job trials, series,
  // side quests): under way, ready to hand in, on offer (or waiting on a level), and done
  questBook: () => {
    const s = story.step, chapters = [];
    STORY.forEach((st, i) => { let c = chapters.at(-1); if (!c || c.ch !== st.ch) chapters.push(c = { ch: st.ch, n: 0, done: 0 }); c.n++; if (i < story.i) c.done++; });
    const main = storyLive() && s ? { ch: s.ch, title: s.title, goal: s.goal + story.progress(), where: story.directions(world.id, prog) } : null;
    const kind = (id) => (SERIES[id] || QUESTS[id].job ? 'job' : /\d+:/.test(QUESTS[id].title) ? 'series' : 'side');
    const rows = [], seen = new Set();
    const row = (id, state, npc = questGiver(id)) => {
      if (seen.has(id) || !QUESTS[id]) return;
      seen.add(id);
      const q = QUESTS[id], n = NPCS[npc];
      rows.push({ id, kind: kind(id), state, title: q.title, lv: q.lv || 0, progress: state === 'active' ? quests.progress(id, inv) : '', giver: n?.name || '', land: n ? ZONE_NAMES[n.map] : '' });
    };
    for (const id of Object.keys(quests.active)) row(id, quests.ready(id, inv) ? 'ready' : 'active');
    for (const npc of Object.keys(NPCS)) {
      const st = quests.status(npc, prog, inv);
      if (st.id && !st.secret && ['offer', 'locked', 'job'].includes(st.state)) row(st.id, st.state, npc); // (a secret series stays out of sight)
    }
    for (const id of quests.done) row(id, 'done');
    return { main, chapters, rows, storyDone: story.done };
  },
  raidList: () => Object.entries(RAIDS).map(([id, R]) => ({ id, R, guide: NPCS[R.npc].name, land: ZONE_NAMES[R.from], done: raidsDone.has(id), ...raidInfo(id) })),
  ferry(map) {
    const fare = FARES[map];
    if ((!visited.has(map) && !ALWAYS_FARES.includes(map)) || inv.perz < fare) return;
    inv.perz -= fare;
    menus.close('talk');
    warpTo(map);
  },
  learn(id) {
    const known = knownSkills();
    if (!learn(prog, id)) return;
    applyStats();
    audio.play('craft');
    announceSkills(known);
    menus.render();
    persist();
  },
  jobChange(job) {
    const known = knownSkills(), switching = JOBS[job].tier === 1 && prog.unlocked.includes(job), first = !prog.unlocked.includes(job);
    if (JOBS[job].tier === 1) prog.takeFirst(job); else prog.takeSecond(job);
    // a new Sorcerer is handed a staff
    if (job === 'mage' && first && !inv.bag.count('oak_staff') && inv.gear.weapon !== 'oak_staff') { inv.add('oak_staff', 1); menus.toast('oak_staff', 1); }
    const off = inv.dropUnwearable();
    if (job === 'mage' && !inv.gear.weapon) inv.equip('oak_staff'); // straight into the new Sorcerer's hand
    // a new Archer is handed a bow and a quiver of arrows, put on at once
    // a new Assassin is handed a Rusty Dagger, put in hand at once
    if (job === 'assassin' && first) {
      if (!inv.bag.count('rusty_dagger') && !Object.values(inv.gear).includes('rusty_dagger')) { inv.add('rusty_dagger', 1); menus.toast('rusty_dagger', 1); }
      if (ITEMS[inv.gear.weapon]?.kind !== 'dagger' && inv.bag.count('rusty_dagger')) inv.equip('rusty_dagger');
    }
    if (job === 'archer' && first) {
      for (const id of ['hunting_bow', 'wooden_arrow']) if (!inv.bag.count(id) && !Object.values(inv.gear).includes(id)) { inv.add(id, 1); menus.toast(id, 1); }
      if (ITEMS[inv.gear.weapon]?.kind !== 'bow' && inv.bag.count('hunting_bow')) inv.equip('hunting_bow');
      if (!inv.gear.ammo && inv.bag.count('wooden_arrow')) inv.equip('wooden_arrow');
    }
    // empty hands after the switch: the best weapon in the bag the new job can hold, and arrows for a bow
    if (!inv.gear.weapon) {
      const best = inv.bag.slots.map((s) => s.id).filter((id) => ITEMS[id].slot === 'weapon' && canWear(id, prog.wearJobs))
        .sort((a, b) => (ITEMS[b].atk || 0) + (ITEMS[b].matk || 0) - (ITEMS[a].atk || 0) - (ITEMS[a].matk || 0))[0];
      if (best) inv.equip(best);
    }
    if (ITEMS[inv.gear.weapon]?.kind === 'bow' && !inv.gear.ammo) {
      const arrows = inv.bag.slots.map((s) => s.id).filter((id) => ITEMS[id].slot === 'ammo').sort((a, b) => (ITEMS[b].atk || 0) - (ITEMS[a].atk || 0))[0];
      if (arrows) inv.equip(arrows);
    }
    const aJob = `${/^[AEIOU]/.test(JOBS[job].name) ? 'an' : 'a'} ${JOBS[job].name}`; // an Archer
    if (off.length) menus.message(`Put away what ${aJob} can't use: ${off.map((i) => ITEMS[i].name).join(', ')}`);
    player.setArt(jobArt());
    applyStats();
    player.heal(player.maxHp);
    player.healSp(player.maxSp);
    audio.play('levelup');
    const y = world.heightAt(player.x, player.z);
    fx.sparkle(player.x, y + 0.6, player.z, '#ffe37a', 24);
    fx.number(player.x, y + 1.9, player.z, `${JOBS[job].name}!`, 'level');
    menus.message(switching ? `You are ${aJob} again. Your Job Level and skills come with you.`
      : JOBS[job].tier === 2 ? `You are now ${aJob}! Job Level starts again; new skills wait in the Skills window.`
        : prog.unlocked.length > 1 ? `You are now ${aJob} too! Your paths share one Job Level and one pool of skill points.`
          : `You are now ${aJob}! Earn Job Levels for skill points.`);
    announceSkills(known);
    menus.render();
    persist();
  },
  crafted() { audio.play('craft'); persist(); },
  traded(kind) { audio.play('pickup'); if (kind === 'sell') story.flag('sold'); persist(); },
  equipped() { audio.play('ui'); persist(); },
  // Holger, Seyla or a card: a bright chime when it works, a crash when the piece breaks
  upgraded(mode, res) {
    if (res.ok) { audio.play('levelup'); fx.sparkle(player.x, world.heightAt(player.x, player.z) + 1, player.z, '#ffd23a', 18); }
    else { audio.play('hit'); fx.puff(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, 0.8); }
    persist();
  },
  raised() { applyStats(); audio.play('craft'); persist(); },
  accept(id) {
    quests.accept(id);
    for (const done of quests.onZone(world.zoneAt(player.x, player.z))) questComplete(done);
    audio.play('ui');
    menus.message(`New quest: ${QUESTS[id].title}`);
    menus.close('talk');
    refreshQuests();
  },
  // the trainers' retraining (Liv, Ingrid, Sven): the first of each kind is free. Skills: a first
  // job's trees, or a second job's and its first jobs' (its beasts go home with their summons)
  retrain(kind) {
    const cost = prog.resets[kind] ? RETRAIN_COST : 0;
    if (inv.perz < cost) { menus.message('Not enough perz'); return; }
    if (kind === 'stats') prog.resetStats();
    else if (!(prog.tier === 2 ? unlearnSecondJob(prog) : unlearnFirstJob(prog))) return;
    if (kind === 'skills') allies.clear();
    inv.perz -= cost;
    applyStats();
    hotbar.render?.();
    audio.play('craft');
    menus.message(kind === 'stats' ? 'Your stats are back to 1: place your points again in the Status window.' : prog.tier === 2 ? `Your job skills are unlearnt. Rebuild your first jobs in the Skills window: ${JOBS[prog.job].name} skills open again once every first-job point is spent.` : 'Your first-job skills are unlearnt: spend the points again in the Skills window.');
    persist();
  },
  // a delivery handed over: back to whoever sent it
  delivered(id) {
    quests.deliver(id);
    audio.play('pickup');
    questComplete(id);
    persist();
  },
  // a trainer's question: a chime when right, a thud when not (no penalty, just try again)
  answered(id, ok) {
    audio.play(ok ? 'heart' : 'block');
    refreshQuests();
    persist();
  },
  handIn(id) {
    const r = quests.turnIn(id, inv);
    if (!r) return;
    audio.play('craft');
    giveReward(r);
    // a series (the job trials) carries straight on to its next step
    if (NEXT[id]) { quests.accept(NEXT[id]); menus.message(`Step done. Next: ${QUESTS[NEXT[id]].title}`); }
    refreshQuests();
    menus.render();
    persist();
  },
  ui() { audio.play('ui'); },
  soundOn: () => audio.enabled,
  toggleSound() { audio.setEnabled(!audio.enabled); },
  closed() { persist(); },
  // Settings' Back to main menu: save, and back to the title to pick a hero (not in a raid)
  toTitle() {
    if (raidOf(world.id)) { menus.message('Finish the raid first.'); return; }
    persist();
    resetting = true;
    toSelectNext();
    location.reload();
  },
  // the hair picker tries looks on as you choose; lookDone keeps one (the stylist charges for it)
  look(l) { player.setLook(l); player.setArt(jobArt()); }, // a new body when trying the other one on
  currentLook: () => ({ ...player.look }),
  lookDone(l, mode) {
    if (mode === 'stylist') {
      if (inv.perz < 1000) { player.setLook(lookBefore); player.setArt(jobArt()); menus.message('Not enough perz'); return; }
      inv.perz -= 1000;
      inv.changed();
      menus.message('Embla steps back, pleased: "Like a hero of the songs!"');
    }
    player.setLook(l);
    player.setArt(jobArt());
    lookBefore = { ...player.look };
    audio.play('craft');
    persist();
    if (mode === 'new') { cine = null; cam.dist = 12; cam.yaw = 0; villagers.show(world.id); startStory(); }
  },
});
menus.quests = quests;
const portraits = {};
menus.portrait = (id) => (id === 'player' ? (portraits[`${prog.job}|${player.look.body}|${jobArt().dressed}`] ||= jobArt().anims.down.idle[0].image.toDataURL())
  : (portraits[id] ||= lib.villagers[id].loaded ? lib.villagers[id].anims.down.idle[0].image.toDataURL() : ''));
// things in camp and town you tap to use: the player walks over, then it opens. h = height on screen
const SPOTS = [
  { map: 'camp', ...world.camp.fire, label: 'Campfire', h: 0.9, run: () => menus.message('A warm fire. Crafting is done in Steinborg now: Gunnar forges gear, Ragna brews usables.') },
  { map: 'camp', ...world.camp.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') },
  { map: 'camp', ...world.camp.tent, label: 'Tent', h: 2.2, run: () => rest() },
  { map: 'city', ...CITY.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') }, // Steinborg's storehouse: the same chest
  { map: 'magic', ...MAGIC.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') }, // and Galdrheim's
  { map: 'hunt', ...HUNT.chest, label: 'Storage', h: 0.8, run: () => menus.show('chest') }, // and Veidheim's
  ...villagers.list.map((v) => ({ npc: v.id, map: v.map, x: v.x, z: v.z, h: v.top, run: () => { if (menus.isOpen('story')) return; if (story.talkStep(v.id) && storyLive()) storyDone(); else menus.talkTo(v.id); } })),
];

// ---------- the big map: tap the minimap ----------
const bigmap = new BigMap({
  world, player, mobs, spots: SPOTS,
  goal: () => ui.goal,
  go(target) { stopNav(); player.command(target); },
});
document.getElementById('minimap').addEventListener('click', () => { if (started) bigmap.toggle(); });

// ---------- hotbar: skills and items ----------
const hotbar = new Hotbar(document.getElementById('hotbar'), inv, {
  use(s) { if (s.kind === 'skill') useSkill(s.id); else useItem(s.id); },
  cooldown(s) {
    if (s.kind !== 'skill') return 0;
    const own = SKILLS[s.id].cd ? Math.max(0, (skillCd[s.id] || 0) / SKILLS[s.id].cd) : 0;
    return Math.max(own, skillLock > 0 ? skillLock / SKILL_LOCK : 0); // (the half second after any skill)
  },
  skill(id) { const lv = skillLv(prog, id), sp = lv ? spCost(id, lv) : 0; return { lv, sp, ok: player.sp >= sp }; },
  changed() { if (menus.open) menus.render(); persist(); },
});
hotbar.load(save?.hotbar);

// ---------- the attack button, beside the hotbar: a normal attack on the target, or the nearest monster ----------
let selMob = null; // the selected monster: the one last tapped, attacked or aimed at, kept after a cast or a walk
// the selected monster while it is still a fair target: alive, on this map and near enough
const selected = () => (selMob?.alive && selMob.sprite.visible && mobs.list.includes(selMob) && Math.hypot(selMob.x - player.x, selMob.z - player.z) < 20 ? selMob : null);
const atkBtn = document.createElement('button');
atkBtn.id = 'atkbtn';
atkBtn.dataset.btn = 'attack';
atkBtn.setAttribute('aria-label', 'Attack');
atkBtn.title = 'Attack the target, or the nearest monster';
document.getElementById('hud').appendChild(atkBtn);
// it shows the weapon in hand (a fist with none)
const atkFace = () => { const w = inv.gear.weapon; atkBtn.innerHTML = w ? `<img src="${iconURL(w)}" alt="">` : '<span>✊</span>'; };
inv.onChange(atkFace);
atkFace();
// it sits just left of the hotbar, whose width changes with its pages
function placeAtkBtn() {
  const hb = document.getElementById('hotbar').getBoundingClientRect();
  if (!hb.width) return;
  // always beside it, on the left (the hotbar's slots shrink on a narrow screen so both fit: style.css)
  atkBtn.style.left = `${Math.max(4, hb.left - atkBtn.offsetWidth - 8)}px`;
  atkBtn.style.top = `${hb.top + (hb.height - atkBtn.offsetHeight) / 2}px`;
  // the quest list ends above the hotbar (on a short screen it scrolls rather than run under it)
  const ql = document.querySelector('#quests .qlist');
  // (held upright: never over about one quest's height, 165px, so it doesn't cover the field; it scrolls)
  const cap = innerHeight > innerWidth ? 165 : 230;
  if (ql?.offsetParent) ql.style.maxHeight = `${Math.max(56, Math.min(cap, innerHeight * 0.34, hb.top - ql.getBoundingClientRect().top - 8))}px`;
}
window.addEventListener('resize', placeAtkBtn);
setInterval(placeAtkBtn, 500);
// the nearest monster on screen (in sight), however far: a melee hero walks to it, a bow shoots from range
const sightV = new THREE.Vector3();
function nearestInSight() {
  let best = null, bd = Infinity;
  for (const m of mobs.list) {
    if (!m.alive || !m.sprite.visible) continue;
    sightV.set(m.x, world.heightAt(m.x, m.z) + 0.5, m.z).project(camera);
    if (sightV.z > 1 || Math.abs(sightV.x) > 1 || Math.abs(sightV.y) > 1) continue; // off screen
    const d = Math.hypot(m.x - player.x, m.z - player.z);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}
function attackNow() {
  if (player.state === 'down') return;
  const t = (player.goal?.mob?.alive && mobs.list.includes(player.goal.mob) && player.goal.mob) || selected() || nearestInSight();
  if (!t) { menus.message('No monster nearby'); return; }
  stopNav();
  selMob = t;
  player.command({ mob: t });
}
menus.hotbar = hotbar;

// ---------- items and skills in use ----------
const roll = ([a, b]) => a + Math.floor(Math.random() * (b - a + 1));
function useItem(id) {
  const u = ITEMS[id]?.use;
  if (!u || !inv.bag.count(id) || player.state === 'down') return;
  if (u.hp && !u.cure && player.hp >= player.maxHp) { menus.message('Your HP is already full'); return; }
  if (u.sp && player.sp >= player.maxSp) { menus.message('Your SP is already full'); return; }
  inv.bag.remove(id, 1);
  const y = overHead(player, 1.3);
  if (u.hp) {
    const n = player.heal(roll(u.hp));
    fx.number(player.x, y, player.z, n, 'heal');
  }
  if (u.sp) fx.number(player.x, y, player.z, player.healSp(roll(u.sp)), 'sp');
  if (u.cure) { player.slowT = 0; player.poisonT = 0; } // (spores' slow, and a scorpion's venom)
  if (u.buff) { buffs[u.buff] = u.t; applyStats(); menus.message(`${ITEMS[id].name}: ${ITEMS[id].desc}`); }
  if (u.warp === 'random') warpRandom();
  if (u.warp === 'camp') { if (savePoint) warp(savePoint.map, null, { x: savePoint.x, z: savePoint.z }); else warpTo('camp'); } // to your save point
  audio.play('pickup');
  inv.changed();
}

const skillCd = {}; // skill id -> seconds left
// after any skill, every skill waits a moment (no spamming): the hotbar sweeps it
const SKILL_LOCK = 0.5;
let skillLock = 0;
function useSkill(id) {
  const sk = SKILLS[id], lv = skillLv(prog, id);
  if (!lv || sk.kind !== 'active' || player.state === 'down' || (skillCd[id] || 0) > 0 || skillLock > 0) return;
  // skills of every job earned can be used, with the right weapon in hand
  if (!weaponOk(id, weaponKind())) { menus.message(`${sk.name} needs ${WEAPON_NAMES[sk.weapon]} in hand`); return; }
  const sp = spCost(id, lv);
  const pay = () => {
    if (player.sp < sp) { menus.message('Not enough SP'); return false; }
    player.sp -= sp;
    if (sk.cd) skillCd[id] = sk.cd;
    skillLock = SKILL_LOCK;
    return true;
  };
  const say = (text) => fx.number(player.x, overHead(player, 1.6), player.z, text, 'skill');
  const y = world.heightAt(player.x, player.z);
  if (id === 'rest') { if (player.state === 'sit') player.standUp(); else player.sit('sit'); return; }
  if (id === 'guard') {
    if (player.state === 'normal' && pay()) { player.endureT = 4; endureGuard = 0.15; endureFrom = 'guard'; endureLv = 1; say('Guard'); audio.play('block'); }
    return;
  }
  if (sk.magic && !sk.edge) { castSpell(id, lv, pay, sp); return; }
  if (id === 'aegis') { // a barrier of ATK and MATK together
    if (!pay()) return;
    const ps = player.ps, k = (50 + 10 * lv) / 100;
    player.barrier = Math.round((ps.batk + ps.watk) * k + (ps.matk[0] + ps.matk[1]) / 2 * k);
    buffs.aegis = 20; aegisLv = lv;
    applyStats();
    say('Stone Aegis'); audio.play('block');
    fx.sparkle(player.x, y + 0.8, player.z, '#c8a06a', 20);
    return;
  }
  if (id === 'ward') {
    if (pay()) { buffs.ward = 30; wardLv = lv; say('Rune Ward'); audio.play('craft'); fx.sparkle(player.x, y + 0.8, player.z, '#8fd8ff', 18); }
    return;
  }
  if (id === 'blink') {
    if (player.rootT > 0) { menus.message('Roots hold you fast!'); return; }
    if (player.state !== 'normal' || player.cast || !pay()) return;
    // as far as 4 paces ahead, stopping short of anything in the way
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 4; k += 0.5) {
      const x = player.x + player.face.x * k, z = player.z + player.face.z * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1])) break;
      bx = x; bz = z;
    }
    fx.sparkle(player.x, y + 0.7, player.z, '#b8a6f4', 12);
    player.stop();
    player.setPos(bx, bz);
    fx.sparkle(bx, world.heightAt(bx, bz) + 0.7, bz, '#b8a6f4', 12);
    audio.play('dodge');
    return;
  }
  if (id === 'mend') {
    if (player.hp >= player.maxHp) { menus.message('Your HP is already full'); return; }
    if (pay()) { say('Mend'); fx.number(player.x, overHead(player, 1.3), player.z, player.heal(5 + Math.floor(player.maxHp * 0.03)), 'heal'); }
    return;
  }
  if (player.state !== 'normal') return;
  // ---- Archer ----
  if (id === 'focus') {
    if (!pay()) return;
    buffs.focus = 60; focusLv = lv;
    applyStats();
    say('Focus'); audio.play('craft');
    fx.sparkle(player.x, y + 0.9, player.z, '#bfe8a0', 14);
    return;
  }
  if (['leapback', 'galestep'].includes(id) && player.rootT > 0) { menus.message('Roots hold you fast!'); return; }
  if (id === 'leapback') { // 3 paces back, away from the nearest monster (or from where you face)
    const near = mobs.nearest(player.x, player.z, 8);
    let ax = near ? player.x - near.x : -player.face.x, az = near ? player.z - near.z : -player.face.z;
    const d = Math.hypot(ax, az) || 1;
    ax /= d; az /= d;
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 3; k += 0.5) {
      const x = player.x + ax * k, z = player.z + az * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1]) || !world.walkable(x, z)) break;
      bx = x; bz = z;
    }
    if (bx === player.x && bz === player.z) { menus.message('No room to leap back'); return; }
    if (!pay()) return;
    fx.puff(player.x, y + 0.2, player.z, 0.8);
    const keep = player.goal?.mob?.alive ? player.goal.mob : null;
    player.stop();
    player.setPos(bx, bz);
    player.iframes = Math.max(player.iframes, 0.3);
    if (near) player.face = { x: -ax, z: -az };
    fx.puff(bx, world.heightAt(bx, bz) + 0.2, bz, 0.8);
    audio.play('dodge');
    if (keep) player.command({ mob: keep }); // keep shooting from the new spot
    return;
  }
  // ---- Windrunner ----
  if (id === 'tailwind') {
    if (!pay()) return;
    buffs.tailwind = sk.dur(lv); buffs.rush = 4; tailLv = lv;
    burstOfSpeed();
    applyStats();
    say('Tailwind'); audio.play('dodge');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; fx.sparkle(player.x + Math.cos(a) * 0.9, y + 0.3 + i * 0.08, player.z + Math.sin(a) * 0.9, '#bff4dc', 1); }
    return;
  }
  if (id === 'galestep') { // a dash away from the nearest monster (or ahead), untouchable, then a short burst
    const near = mobs.nearest(player.x, player.z, 8);
    let ax = near ? player.x - near.x : player.face.x, az = near ? player.z - near.z : player.face.z;
    const d = Math.hypot(ax, az) || 1;
    ax /= d; az /= d;
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 4; k += 0.5) {
      const x = player.x + ax * k, z = player.z + az * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1]) || !world.walkable(x, z)) break;
      bx = x; bz = z;
    }
    if (bx === player.x && bz === player.z) { menus.message('No room to dash'); return; }
    if (!pay()) return;
    const keep = player.goal?.mob?.alive ? player.goal.mob : null;
    fx.zap({ x: player.x, y: y + 0.6, z: player.z }, { x: bx, y: world.heightAt(bx, bz) + 0.6, z: bz }, '#bff4dc');
    player.stop();
    player.setPos(bx, bz);
    player.iframes = Math.max(player.iframes, 0.5);
    buffs.gust = 2; gustHaste = sk.haste(lv);
    burstOfSpeed();
    applyStats();
    fx.puff(bx, world.heightAt(bx, bz) + 0.2, bz, 0.9);
    audio.play('dodge');
    if (keep) player.command({ mob: keep });
    return;
  }
  // ---- Beastmaster: the summons, and Pack Frenzy ----
  if (sk.beast) {
    if (!pay()) return;
    allies.summon(sk.beast, sk.beast === 'wolf' ? 2 : 1, beastStats(sk.beast), player);
    applyStats();
    say(sk.name); audio.play('night');
    for (const b of allies.of(sk.beast)) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.6, b.z, b.K.aura, 14);
    return;
  }
  if (id === 'packfrenzy') {
    if (!allies.beasts.length) { menus.message('Call your beasts first'); return; }
    if (!pay()) return;
    buffs.frenzy = 15; frenzyLv = lv;
    applyStats();
    say('Pack Frenzy'); audio.play('night');
    for (const b of allies.beasts) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.6, b.z, '#ff7a4a', 10);
    return;
  }
  // ---- Moon Ranger ----
  if (id === 'moonveil') {
    if (!pay()) return;
    buffs.veil = 15; veilLv = lv;
    say('Moonveil'); audio.play('craft');
    fx.sparkle(player.x, y + 0.9, player.z, '#c8d4ff', 18);
    return;
  }
  if (id === 'standfirm') {
    if (pay()) { player.endureT = 6 + Math.floor(lv / 2); endureGuard = lv / 100; endureFrom = 'standfirm'; endureLv = lv; say('Stand Firm'); audio.play('block'); }
    return;
  }
  if (id === 'warcry') {
    if (!pay()) return;
    say('War Cry');
    audio.play('night');
    cam.shake = 0.15;
    fx.sparkle(player.x, y + 1, player.z, '#ff9a6a', 16);
    for (const m of mobs.list) if (m.alive && Math.hypot(m.x - player.x, m.z - player.z) < 6) m.provoke(0);
    buffs.warcry = 20;
    warcryLv = lv;
    return;
  }
  if (id === 'earthsplit') {
    if (!pay()) return;
    say('Ground Slash');
    fx.sparkle(player.x, y + 0.3, player.z, '#c8a06a', 26);
    fx.puff(player.x, y + 0.2, player.z, 1.8);
    cam.shake = 0.3;
    audio.play('hit');
    player.atkAnim = player.atkDur = 0.4;
    for (const m of [...mobs.list]) {
      if (!m.alive) continue;
      const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz);
      if (d > 2.8 + m.def.r) continue;
      const res = playerAttack(player.ps, m.effDef(), sk.power(lv) / 100 * player.atkMul, 1, true);
      const yy = overHead(m, m.sprite.scale.y * 0.8);
      if (res.miss) { fx.number(m.x, yy, m.z, 'Miss', 'miss'); continue; }
      fx.number(m.x, yy, m.z, res.dmg, 'dealt');
      m.hit(res.dmg, d ? dx / d : 0, d ? dz / d : 1);
      m.knock.x *= 2; m.knock.z *= 2; // pushed back a little
      inflict(m, sk.status, lv);
    }
    return;
  }
  // ---- Magic Knight: Elemental Blade imbues the sword; again switches element (free while it lasts) ----
  if (id === 'elemblade') {
    const on = buffs.imbue > 0;
    if (!on && !pay()) return;
    if (on) skillCd[id] = sk.cd;
    imbueEl = on ? IMBUE[(IMBUE.indexOf(imbueEl) + 1) % IMBUE.length] : IMBUE[0];
    if (!on) buffs.imbue = sk.dur(lv);
    applyStats();
    say(`Blade: ${imbueEl[0].toUpperCase()}${imbueEl.slice(1)}`);
    fx.sparkle(player.x, y + 0.9, player.z, IMBUE_COL[imbueEl], 14);
    audio.play('craft');
    return;
  }
  // ---- Magic Knight: Elemental Nova, three waves of the blade's element rolling out around you ----
  if (id === 'nova') {
    if (!pay()) return;
    const el = bladeEl(), fxk = EDGE_FX[el], col = IMBUE_COL[el] || '#e8e0ff', st = fxk && { ...fxk, chance: sk.status.chance };
    const cx = player.x, cz = player.z;
    say('Elemental Nova');
    player.atkAnim = player.atkDur = 0.4;
    fx.puff(cx, y + 0.2, cz, 2.2);
    repeat(sk, lv, (i) => {
      const r = sk.areas[i], n = 10 + Math.round(r * 6), gy = world.heightAt(cx, cz);
      for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2; fx.sparkle(cx + Math.cos(a) * r, gy + 0.3, cz + Math.sin(a) * r, col, 1); }
      cam.shake = 0.2 + i * 0.08;
      audio.play('hit');
      for (const m of [...mobs.list]) {
        if (!m.alive || Math.hypot(m.x - cx, m.z - cz) > r + m.def.r) continue;
        inflict(m, st, lv, edgeHit(m, sk.power(lv) / 100, sk.mpower(lv) / 100, el));
      }
    });
    return;
  }
  // ---- Assassin: Vanish ----
  if (id === 'vanish') {
    if (!pay()) return;
    player.hiddenT = 3 + lv; vanishBonus = 1 + 0.1 * lv;
    player.mat.transparent = true; player.mat.opacity = 0.35;
    player.stop();
    fx.puff(player.x, y + 0.3, player.z, 1.0);
    say('Vanish'); audio.play('dodge');
    return;
  }
  // ---- Phantom: Phantom Double, Mirage Step, Thousand Cuts ----
  if (id === 'phantomdouble') {
    if (!pay()) return;
    allies.summon('shade', 2, illusionStats(), player, { art: player.art, life: sk.dur(lv) + 2 * skillLv(prog, 'lingeringshade') });
    applyStats();
    say('Phantom Double'); audio.play('night');
    for (const b of allies.of('shade')) fx.sparkle(b.x, world.heightAt(b.x, b.z) + 0.8, b.z, '#a88aff', 14);
    return;
  }
  if (id === 'miragestep') { // a dash away, untouchable, leaving an illusion that draws the monsters
    if (player.rootT > 0) { menus.message('Roots hold you fast!'); return; }
    const near = mobs.nearest(player.x, player.z, 8);
    let ax = near ? player.x - near.x : player.face.x, az = near ? player.z - near.z : player.face.z;
    const d = Math.hypot(ax, az) || 1;
    ax /= d; az /= d;
    let bx = player.x, bz = player.z;
    for (let k = 0.5; k <= 4; k += 0.5) {
      const x = player.x + ax * k, z = player.z + az * k, t = player.tiles.tileAt(x, z);
      if (!player.tiles.free(t[0], t[1]) || !world.walkable(x, z)) break;
      bx = x; bz = z;
    }
    if (bx === player.x && bz === player.z) { menus.message('No room to step away'); return; }
    if (!pay()) return;
    const from = { x: player.x, z: player.z };
    allies.summon('mirage', 1, { ...illusionStats(), maxHp: Math.round(player.maxHp * 0.5) }, player, { art: player.art, life: 3 + lv + 2 * skillLv(prog, 'lingeringshade'), at: from });
    fx.zap({ x: player.x, y: y + 0.7, z: player.z }, { x: bx, y: world.heightAt(bx, bz) + 0.7, z: bz }, '#a88aff');
    player.stop();
    player.setPos(bx, bz);
    player.iframes = Math.max(player.iframes, 0.5);
    for (const m of mobs.list) if (m.alive && m.foe !== allies.of('mirage')[0] && Math.hypot(m.x - from.x, m.z - from.z) < 4 && !m.def.decoy) { m.foe = allies.of('mirage')[0]; m.provoke(); }
    applyStats();
    say('Mirage Step'); audio.play('dodge');
    return;
  }
  if (id === 'thousandcuts') { // five spins with both blades, everything close takes each
    if (!pay()) return;
    say('Thousand Cuts');
    player.atkAnim = player.atkDur = 0.35;
    const cx = player.x, cz = player.z, mult = sk.power(lv) / 100;
    repeat(sk, lv, (i) => {
      const gy = world.heightAt(player.x, player.z);
      for (let j = 0; j < 10; j++) { const a = (j / 10) * Math.PI * 2 + i; fx.sparkle(player.x + Math.cos(a) * sk.area * 0.8, gy + 0.6, player.z + Math.sin(a) * sk.area * 0.8, j % 2 ? '#a88aff' : '#e8e0ff', 1); }
      audio.play('swing');
      void cx; void cz;
      for (const m of [...mobs.list]) {
        if (!m.alive || Math.hypot(m.x - player.x, m.z - player.z) > sk.area + m.def.r) continue;
        const r = dualHit(m, mult);
        inflict(m, sk.status, lv, r);
      }
    });
    return;
  }
  // the rest aim at your current target (the one fought, else the one selected), or the nearest monster
  const target = (player.goal?.mob?.alive && player.goal.mob) || selected() || mobs.nearest(player.x, player.z, 8);
  if (!target) { menus.message('No monster nearby'); return; }
  selMob = target;
  // ---- BladeMaster: Blade Dance, dashing from monster to monster, untouchable ----
  if (id === 'bladedance') {
    const run = (t) => {
      if (!t.alive || !pay()) return;
      say('Blade Dance');
      const cx = t.x, cz = t.z, n = sk.hits(lv), mult = sk.power(lv) / 100;
      player.iframes = Math.max(player.iframes, n * sk.every + 0.4);
      player.goal = null;
      let last = null;
      repeat(sk, lv, () => {
        const near = mobs.list.filter((m) => m.alive && Math.hypot(m.x - cx, m.z - cz) < sk.area + m.def.r);
        if (!near.length) return;
        const pool = near.length > 1 ? near.filter((m) => m !== last) : near;
        const m = pool[Math.floor(Math.random() * pool.length)];
        // appear at its side, coming from where you were
        const fx0 = { x: player.x, y: world.heightAt(player.x, player.z) + 0.8, z: player.z };
        let dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
        dx /= d; dz /= d;
        const gap = m.def.r + 0.5, px = m.x - dx * gap, pz = m.z - dz * gap;
        if (world.walkable(px, pz)) { player.x = px; player.z = pz; player.sync(); }
        player.face = { x: dx, z: dz };
        player.atkAnim = player.atkDur = 0.2;
        fx.zap(fx0, { x: player.x, y: world.heightAt(player.x, player.z) + 0.8, z: player.z }, '#ffffff');
        fx.slash(m.x, overHead(m, m.sprite.scale.y * 0.5), m.z, player.face, cam);
        bladeHit(m, mult);
        combo(m);
        last = m;
      });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0.05, run, name: sk.name } });
    return;
  }
  // Thrust, Cleave and Heavy Strike: walk up and hit with the next swing. opts: el, defMul
  const strike = (mult, hitMult, done, opts = {}) => player.command({ mob: target, skill: { mult, hitMult, pay, done, ...opts } });
  // ---- Archer: Hunter's Mark (from bow range), Double Shot and Arrow Rain (with the next shot) ----
  if (id === 'huntmark') {
    const run = (t) => {
      if (!t.alive || !pay()) return;
      t.markT = skillClock + 10; t.markLv = lv;
      say("Hunter's Mark");
      fx.sparkle(t.x, overHead(t, t.sprite.scale.y * 0.9), t.z, '#ff5a4a', 12);
      fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8 + 0.3), t.z, 'Marked', 'miss');
      audio.play('craft');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: Math.max(player.reach, BOW_RANGE), time: 0.05, run, name: sk.name } }); // from bow range, bow or not
    return;
  }
  if (id === 'doubleshot') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => { say('Double Shot'); later(sk.every, () => arrowHit(t, m)); });
  }
  // ---- Moon Ranger: from bow range (Star Sight reaches further), each arrow ATK and MATK together ----
  if (id === 'multishot' || id === 'starfall' || id === 'crescent') {
    // Starfall needs no bow: it always calls the stars down from bow range
    const far = (id === 'starfall' ? Math.max(player.reach, BOW_RANGE) : player.reach) + (id === 'crescent' ? 0 : 0.5 * skillLv(prog, 'starsight'));
    const cost = id === 'starfall' && nightUp ? Math.ceil(sp * (1 - 0.04 * skillLv(prog, 'lunartide'))) : sp;
    const paid = () => {
      if (player.sp < cost) { menus.message('Not enough SP'); return false; }
      player.sp -= cost;
      if (sk.cd) skillCd[id] = sk.cd;
      return true;
    };
    const run = (t) => {
      if (!t.alive || !paid()) return;
      say(sk.name);
      const k = moonSkill(), atk = sk.power(lv) / 100 * k, matk = sk.mpower(lv) / 100 * k;
      const from = () => ({ x: player.x + player.face.x * 0.4, y: world.heightAt(player.x, player.z) + 0.85, z: player.z + player.face.z * 0.4 });
      if (id === 'multishot') {
        const n = sk.arrows(lv) + (buffs.veil > 0 && nightUp ? 2 : 0);
        const near = mobs.list.filter((m) => m.alive && m !== t && Math.hypot(m.x - t.x, m.z - t.z) < 4).sort((a, b) => Math.hypot(a.x - t.x, a.z - t.z) - Math.hypot(b.x - t.x, b.z - t.z));
        const aims = [t, ...near].slice(0, n);
        for (let i = aims.length; i < n; i++) aims.push(t); // alone: the rest at the target too
        aims.forEach((m, i) => later(i * 0.05, () => { const f = from(); fx.bolt(f.x, f.y, f.z, m, '#dfe6ff', () => moonHit(m, atk, matk), 0.22); }));
        audio.play('swing');
      } else if (id === 'starfall') {
        const cx = t.x, cz = t.z;
        repeat(sk, lv, (i) => {
          const gy = world.heightAt(cx, cz);
          for (let j = 0; j < 5; j++) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * 2.4, spot = { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r, alive: true };
            fx.bolt(spot.x + 0.8, gy + 6, spot.z - 0.8, spot, j % 2 ? '#fff6c8' : '#c8d8ff', () => fx.sparkle(spot.x, gy + 0.3, spot.z, '#fff6c8', 4), 0.35);
          }
          later(0.42, () => {
            cam.shake = 0.12 + i * 0.02;
            audio.play('hit');
            for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - cx, m.z - cz) < sk.area + m.def.r) inflict(m, sk.status, lv, moonHit(m, atk, matk));
          });
        });
      } else { // Crescent Arrow: through the target, 8 paces in a line
        const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
        const f = from(), end = { x: player.x + ux * 8, y: f.y, z: player.z + uz * 8 };
        fx.zap(f, end, '#e8eeff');
        for (let j = 1; j <= 8; j++) fx.sparkle(player.x + ux * j, f.y, player.z + uz * j, j % 2 ? '#c8d8ff' : '#ffffff', 2);
        cam.shake = 0.15;
        audio.play('hit');
        for (const m of [...mobs.list]) {
          if (!m.alive) continue;
          const px = m.x - player.x, pz = m.z - player.z, along = px * ux + pz * uz, off = Math.abs(px * uz - pz * ux);
          if (along > -0.3 && along < 8 + m.def.r && off < 0.7 + m.def.r) moonHit(m, atk, matk);
        }
      }
      player.command({ mob: t }); // and keep shooting
    };
    player.command({ mob: target, spell: { range: far, time: 0, run, name: sk.name } });
    return;
  }
  // ---- Windrunner: Hurricane Volley (a stream of arrows), Cyclone Arrow (a whirlwind where it lands) ----
  if (id === 'volley') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => { say('Hurricane Volley'); repeat(sk, lv, (i) => { if (i && t.alive) arrowHit(t, m, null, 0.15); }); });
  }
  if (id === 'cyclone') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Cyclone Arrow');
      const cx = t.x, cz = t.z;
      repeat(sk, lv, (i) => {
        const gy = world.heightAt(cx, cz), n = 14;
        for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + i * 0.7, r = 0.6 + ((j * 7) % 5) * 0.4; fx.sparkle(cx + Math.cos(a) * r, gy + 0.2 + (j % 4) * 0.35, cz + Math.sin(a) * r, j % 3 ? '#bff4dc' : '#ffffff', 1); }
        if (i === 0) fx.puff(cx, gy + 0.2, cz, 1.6);
        audio.play('swing');
        for (const o of [...mobs.list]) {
          if (!o.alive) continue;
          const dx = cx - o.x, dz = cz - o.z, d = Math.hypot(dx, dz);
          if (d > sk.area + o.def.r) continue;
          const res = playerAttack(player.ps, o.effDef(), m * player.atkMul * bowMul(o), 1, true);
          const yy = overHead(o, o.sprite.scale.y * 0.8);
          if (res.miss) { fx.number(o.x, yy, o.z, 'Miss', 'miss'); continue; }
          fx.number(o.x, yy, o.z, res.dmg, res.el > 1 ? 'crit' : 'dealt');
          o.hit(res.dmg, 0, 0);
          if (!o.def.boss && !o.def.mvp && d > 0.5) { // pulled into the eye of the wind
            const k = Math.min(0.35, d - 0.4), nx = o.x + (dx / d) * k, nz = o.z + (dz / d) * k;
            if (world.walkable(nx, nz)) { o.x = nx; o.z = nz; }
          }
          inflict(o, sk.status, lv, res.dmg);
        }
      });
    });
  }
  if (id === 'arrowrain') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Arrow Rain');
      const cx = t.x, cz = t.z, gy = world.heightAt(cx, cz);
      for (let i = 0; i < 10; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 2.3; fx.sparkle(cx + Math.cos(a) * r, gy + 0.2, cz + Math.sin(a) * r, '#efe2c0', 1); }
      for (const o of [...mobs.list]) {
        if (!o.alive || o === t || Math.hypot(o.x - cx, o.z - cz) > 2.5 + o.def.r) continue;
        arrowHit(o, m, { x: o.x + (Math.random() - 0.5) * 0.4, y: overHead(o, 4), z: o.z + (Math.random() - 0.5) * 0.4 }, 0.6);
      }
      if (t.alive) { t.knock.x *= 1.5; t.knock.z *= 1.5; }
    });
  }
  // ---- Assassin: Venom Strike, Venom Cloud, Shadow Step, Pilfer ----
  if (id === 'venomstrike') strike(sk.power(lv) / 100, 1 + 0.03 * lv, (t, res) => { say('Venom Strike'); if (!res.miss) inflict(t, sk.status, lv, res.dmg); });
  if (id === 'venomcloud') { // a vial of venom smashed at the target: the cloud hangs there, biting all in it, while you fight on
    const run = (t) => {
      if (!pay()) return;
      say('Venom Cloud');
      player.atkAnim = player.atkDur = 0.3;
      audio.play('swing');
      const cx = t.x, cz = t.z, gy = world.heightAt(cx, cz), m = sk.power(lv) / 100;
      fx.warn(cx, cz, sk.area, sk.hits(lv) * sk.every, '#7ac83a'); // (the cloud's ground, for as long as it lasts)
      fx.puff(cx, gy + 0.3, cz, 1.5);
      repeat(sk, lv, () => {
        fx.cloud(cx, gy + 0.35, cz);
        for (const o of [...mobs.list]) {
          if (!o.alive || Math.hypot(o.x - cx, o.z - cz) > sk.area + o.def.r) continue;
          const res = playerAttack(player.ps, { ...o.effDef(), def: 0, vit: 0 }, m * player.atkMul, 1.5, true); // (venom goes through armour: no DEF; a cloud is hard to step out of: +50% hit)
          const yy = overHead(o, o.sprite.scale.y * 0.8);
          if (res.miss) { fx.number(o.x, yy, o.z, 'Miss', 'miss'); continue; }
          fx.number(o.x, yy, o.z, res.dmg, 'dealt');
          o.hit(res.dmg, 0, 0);
          inflict(o, sk.status, lv, res.dmg * 2); // (its poison: two bites' worth, a fifth of that a second)
        }
      });
      player.command({ mob: t }); // and on with the fight
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0.15, run, name: sk.name } });
    return;
  }
  if (id === 'shadowstep') { // to the target's back, and the next blow strikes harder
    const run = (t) => {
      if (!t.alive || !pay()) return;
      const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1, gap = t.def.r + 0.6;
      const bx = t.x + (dx / d) * gap, bz = t.z + (dz / d) * gap;
      fx.puff(player.x, y + 0.3, player.z, 0.8);
      if (world.walkable(bx, bz) && !world.isSafe(bx, bz)) { player.x = bx; player.z = bz; player.sync(); }
      player.face = { x: -dx / d, z: -dz / d };
      player.iframes = Math.max(player.iframes, 0.3);
      player.nextBlow = 1 + 0.1 * lv;
      fx.puff(player.x, world.heightAt(player.x, player.z) + 0.3, player.z, 0.8);
      say('Shadow Step'); audio.play('dodge');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0, run, name: sk.name } });
    return;
  }
  if (id === 'pilfer') { // a chance at one of its drops (never a card), once per monster
    const run = (t) => {
      if (!t.alive || !pay()) return;
      say('Pilfer'); audio.play('swing');
      player.atkAnim = player.atkDur = 0.25;
      const boss = t.def.boss || t.def.mvp, pool = (t.def.drops || []).filter(([it]) => !ITEMS[it]?.card && !t.def.decoy);
      if (t.pilfered || !pool.length) { fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8), t.z, t.pilfered ? 'Nothing left' : 'Nothing', 'miss'); player.command({ mob: t }); return; }
      const chance = (20 + player.ps.fns / 2) / 100 * (boss ? 1 / 3 : 1);
      if (Math.random() >= chance) { fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8), t.z, 'Missed', 'miss'); player.command({ mob: t }); return; }
      t.pilfered = true;
      const tot = pool.reduce((a, [, , , c]) => a + c, 0);
      let r = Math.random() * tot, got = pool[0][0];
      for (const [it, , , c] of pool) if ((r -= c) <= 0) { got = it; break; }
      if (inv.bag.add(got, 1)) { fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8), t.z, ITEMS[got].name, 'skill'); menus.message(`You lifted ${ITEMS[got].name} off the ${t.def.name}.`); inv.changed(); }
      else menus.message('Your bag is full');
      player.command({ mob: t });
    };
    player.command({ mob: target, spell: { range: sk.range, time: 0.05, run, name: sk.name } });
    return;
  }
  // ---- Phantom: Dual Rend, right hand and left in turn ----
  if (id === 'dualrend') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Dual Rend');
      repeat(sk, lv, (i) => {
        if (!i || !t.alive) return;
        if (i % 2 && player.ps.left) leftHit(t, m); else bladeHit(t, m);
        fx.slash(t.x, overHead(t, t.sprite.scale.y * 0.5), t.z, { x: i % 2 ? 1 : -1, z: 0.3 }, cam);
      });
    });
  }
  if (id === 'thrust') strike(1.25, 1, (t) => { say('Thrust'); combo(t); });
  if (id === 'cleave') {
    strike(sk.power(lv) / 100, 1, (t) => {
      say('Cleave');
      combo(t);
      // the sweep catches monsters beside the target
      for (const m of [...mobs.list]) {
        if (!m.alive || m === t || Math.hypot(m.x - t.x, m.z - t.z) > 1.7 + m.def.r) continue;
        const r = playerAttack(player.ps, m.effDef(), sk.power(lv) / 200 * player.atkMul, 1, true);
        const yy = overHead(m, m.sprite.scale.y * 0.8);
        if (r.miss) { fx.number(m.x, yy, m.z, 'Miss', 'miss'); continue; }
        fx.number(m.x, yy, m.z, r.dmg, 'dealt');
        const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
        m.hit(r.dmg, dx / d, dz / d);
      }
    });
  }
  if (id === 'heavy') strike(sk.power(lv) / 100, 1 + (3 * lv) / 100, (t) => { say('Heavy Strike'); combo(t); });
  // ---- BladeMaster ----
  if (id === 'twinfang') {
    const m = sk.power(lv) / 100;
    strike(m, 1, (t) => {
      say('Twin Fang');
      combo(t);
      setTimeout(() => { if (t.alive) { bladeHit(t, m); combo(t); } }, 160); // the second cut
    });
  }
  if (id === 'pierce') { // three thrusts: the first lands with the swing, the others right behind it
    strike(sk.power(lv) / 100, 1, (t) => {
      say('Piercing Edge');
      combo(t);
      repeat(sk, lv, (i) => { if (i && t.alive) bladeHit(t, sk.power(lv) / 100, { defMul: 0.5 }); });
    }, { defMul: 0.5 });
  }
  if (id === 'finalblade') {
    const stacks = momentum;
    const cut = sk.power(lv, stacks) / 100;
    strike(cut, 1, (t) => { // a flurry of cuts: the first with the swing, the rest a blur behind it
      say(stacks ? `Final Blade ×${stacks}` : 'Final Blade');
      momentum = 0; buffs.momentum = 0;
      cam.shake = 0.25;
      repeat(sk, lv, (i) => {
        if (!i || !t.alive) return;
        bladeHit(t, cut);
        fx.slash(t.x, overHead(t, t.sprite.scale.y * 0.5), t.z, { x: Math.cos(i * 2.1), z: Math.sin(i * 2.1) }, cam);
        if (i === sk.hits(lv) - 1) cam.shake = 0.3;
      });
    });
  }
  // ---- Magic Knight: Elemental Edge, two cuts of ATK and MATK together in the blade's element ----
  if (sk.edge) {
    const el = bladeEl(), fxk = EDGE_FX[el], col = IMBUE_COL[el] || '#e8e0ff';
    const chain = skillLv(prog, 'elemchain'), chained = chain && el && lastEdge.el && lastEdge.el !== el && skillClock - lastEdge.t < 6;
    const k = chained ? 1 + 0.06 * chain : 1, st = fxk && { ...fxk, chance: sk.status.chance };
    strike(sk.power(lv) / 100 * k, 1, (t) => {
      say(chained ? `${sk.name} · Chain` : sk.name);
      lastEdge.el = el; lastEdge.t = skillClock;
      if (chained) player.healSp(3);
      const magic = (m, share) => { // the MATK half of a cut
        if (!m.alive) return 0;
        const r = magicAttack(player.ps, m.effDef(), sk.mpower(lv) / 100 * k * share, el || 'neutral');
        fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8 + 0.25), m.z, r.dmg, r.el > 1 ? 'crit' : 'dealt');
        m.hit(r.dmg, 0, 0);
        return r.dmg;
      };
      repeat(sk, lv, (i) => { // the first cut lands with the swing, the second right behind it
        if (!t.alive) return;
        const d = (i ? (bladeHit(t, sk.power(lv) / 100 * k, { el }).dmg || 0) : 0) + magic(t, 1);
        fx.sparkle(t.x, world.heightAt(t.x, t.z) + 0.6, t.z, col, 8);
        inflict(t, st, lv, d);
        if (el !== 'wind') return;
        fx.zap({ x: t.x, y: overHead(t, 2.4), z: t.z }, { x: t.x, y: overHead(t, 0.4), z: t.z }, col);
        for (const m of [...mobs.list]) { // Wind: it crackles into the monsters beside the target for half
          if (!m.alive || m === t || Math.hypot(m.x - t.x, m.z - t.z) > 1.7 + m.def.r) continue;
          const r = playerAttack({ ...player.ps, el }, m.effDef(), sk.power(lv) / 200 * k * player.atkMul, 1, true);
          if (!r.miss) { fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, r.dmg, 'dealt'); m.hit(r.dmg, 0, 0); }
          magic(m, 0.5);
          inflict(m, st, lv, r.dmg || 0);
        }
      });
    }, { el: el || undefined });
  }
}

// Elemental Blade: the element the sword is imbued with, while buffs.imbue lasts. Normal attacks,
// Elemental Edge and Elemental Nova all take it (none without it)
const IMBUE = ['fire', 'water', 'wind', 'earth'];
let imbueEl = null;
const bladeEl = () => (buffs.imbue > 0 && imbueEl) || null;
// a Magic Knight blow: ATK and MATK together, in an element; the total shows as one number
function edgeHit(m, atkMult, matkMult, el) {
  if (!m.alive) return 0;
  const md = m.effDef();
  const r = playerAttack(el ? { ...player.ps, el } : player.ps, md, atkMult * player.atkMul, 1, true);
  const g = magicAttack(player.ps, md, matkMult, el || 'neutral');
  const dmg = (r.miss ? 0 : r.dmg) + g.dmg;
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, dmg, g.el > 1 ? 'crit' : 'dealt');
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  m.hit(dmg, dx / d * 0.5, dz / d * 0.5);
  return dmg;
}
// one more arrow at a monster (Double Shot's second, Arrow Rain's): it flies from `from` (else the
// hero's bow) and the hit is rolled when it lands; push = how hard it pushes the monster back
function arrowHit(t, mult, from, push = 0.4, then = null) {
  if (!t.alive) return;
  const f = from || { x: player.x + player.face.x * 0.4, y: world.heightAt(player.x, player.z) + 0.85, z: player.z + player.face.z * 0.4 };
  audio.play('swing');
  fx.bolt(f.x, f.y, f.z, t, player.arrowCol, () => {
    if (!t.alive) return;
    const res = playerAttack(player.ps, t.effDef(), mult * player.atkMul * bowMul(t), 1, true);
    const yy = overHead(t, t.sprite.scale.y * 0.8);
    if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return; }
    fx.number(t.x, yy, t.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
    const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1;
    t.hit(res.dmg, dx / d * push, dz / d * push);
    audio.play('hit');
    arrowLanded();
    then?.(res);
  }, 0.2);
}
// a Moon Ranger's arrow: ATK and MATK together, in the arrows' element, shown as one number;
// returns the damage done
function moonHit(m, atkMult, matkMult) {
  if (!m.alive) return 0;
  const md = m.effDef(), el = player.ps.el;
  const r = playerAttack(player.ps, md, atkMult * player.atkMul * bowMul(m), 1, true);
  const g = magicAttack(player.ps, md, matkMult, el || 'neutral');
  const dmg = (r.miss ? 0 : r.dmg) + g.dmg;
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, dmg, g.el > 1 ? 'crit' : g.el < 1 ? 'miss' : 'dealt');
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  m.hit(dmg, dx / d * 0.3, dz / d * 0.3);
  arrowLanded();
  return dmg;
}
// one more blade hit on a monster (Twin Fang's second cut, a Combo): a skill hit, so no crit
function bladeHit(t, mult, opts = {}) {
  if (!t.alive) return { miss: true, dmg: 0 };
  const md = opts.defMul !== undefined ? { ...t.effDef(), def: t.effDef().def * opts.defMul } : t.effDef();
  const res = playerAttack(opts.el ? { ...player.ps, el: opts.el } : player.ps, md, mult * player.atkMul, 1, true);
  const yy = overHead(t, t.sprite.scale.y * 0.8);
  if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return res; }
  fx.number(t.x, yy, t.z, res.dmg, 'dealt');
  const dx = t.x - player.x, dz = t.z - player.z, d = Math.hypot(dx, dz) || 1;
  t.hit(res.dmg, dx / d, dz / d);
  audio.play('hit');
  return res;
}
// a Phantom's left-hand cut (Dual Rend): the left dagger's ATK and element, at Twin Blades' share
function leftHit(t, mult) {
  const L = player.ps.left;
  if (!L || !t.alive) return { miss: true, dmg: 0 };
  const res = playerAttack({ ...player.ps, watk: L.atk, wlv: L.wlv, el: L.el || 'neutral' }, t.effDef(), mult * player.atkMul * player.leftShare, 1, true);
  const yy = overHead(t, t.sprite.scale.y * 0.8) + 0.3;
  if (res.miss) { fx.number(t.x, yy, t.z, 'Miss', 'miss'); return res; }
  fx.number(t.x, yy, t.z, res.dmg, 'dealt');
  t.hit(res.dmg, 0, 0);
  audio.play('hit');
  return res;
}
// both blades on one monster (Thousand Cuts): the right, then the left if there is one; the damage done
const dualHit = (t, mult) => (bladeHit(t, mult).dmg || 0) + (player.ps.left ? leftHit(t, mult).dmg || 0 : 0);
// Combo Edge: a blade skill may chain a free extra strike, and each Combo stacks Momentum
function combo(t) {
  const lv = skillLv(prog, 'comboedge');
  if (!lv || weaponKind() !== 'sword' || Math.random() >= 0.04 * lv) return;
  setTimeout(() => {
    if (!t.alive) return;
    fx.number(player.x, overHead(player, 1.9), player.z, 'Combo!', 'skill');
    bladeHit(t, 1);
    if (skillLv(prog, 'momentum')) { momentum = Math.min(5, momentum + 1); buffs.momentum = 8; }
  }, 260);
}

// ---------- spells: stand still, chant (the cast bar), then the magic flies ----------
const IMBUE_COL = { fire: '#ff7a2a', water: '#9fe0ff', wind: '#fff27a', earth: '#c8a06a' };
const SPELL_COL = { spark: '#ff7a2a', frost: '#9fe0ff', arc: '#fff27a', flamering: '#ff6a1a', stonespike: '#c8a06a', quake: '#b9874f',
  meteor: '#ff5a1a', stormgust: '#bfefff', thunder: '#fff27a' };
// the Wizard's passives for one cast: Attunement always, Resonance when the element changed
function castMul(element) {
  let k = 1 + 0.03 * skillLv(prog, 'attune');
  const res = skillLv(prog, 'resonance');
  if (res && lastSpell.el && lastSpell.el !== element && skillClock - lastSpell.t < 8) k *= 1 + 0.06 * res;
  lastSpell.el = element; lastSpell.t = skillClock;
  return k;
}
function spellHit(m, mult, element) {
  if (!m.alive) return null;
  const staff = ITEMS[inv.gear.weapon];
  if (staff?.kind === 'staff' && staff.el && staff.el === element) mult *= 1.15; // an elemental staff feeds its own spells
  if (m.shatterT > skillClock && element !== 'earth') { mult *= 1.3; m.shatterT = 0; } // Stone Spike's Shatter
  const md = m.effDef(), attune = skillLv(prog, 'attune');
  if (attune && elementMod(element, md.el) > 1) mult *= 1 + 0.03 * attune; // Attunement: harder still on a weakness
  const res = magicAttack(player.ps, md, mult, element);
  const dx = m.x - player.x, dz = m.z - player.z, d = Math.hypot(dx, dz) || 1;
  // the right element hits hard (gold), the wrong one barely scratches (grey)
  fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, res.dmg, res.el > 1 ? 'crit' : res.el < 1 ? 'miss' : 'dealt');
  if (res.el < 1) weakTip(m, element);
  audio.play('hit');
  m.hit(res.dmg, dx / d * 0.5, dz / d * 0.5);
  cardOnHit(m, res.dmg);
  return res;
}
function castSpell(id, lv, pay, sp) {
  const sk = SKILLS[id];
  if (player.state !== 'normal') return;
  if (player.sp < sp) { menus.message('Not enough SP'); return; }
  const time = castTime(id, lv) * player.ps.castRate * (skillLv(prog, 'swiftchant') ? 0.85 : 1);
  const y = () => world.heightAt(player.x, player.z);
  const say = () => fx.number(player.x, overHead(player, 1.6), player.z, sk.name, 'skill');
  if (id === 'flamering') { // around you: no target needed
    player.startCast(time, () => {
      if (!pay()) return;
      say();
      const k = castMul(sk.magic);
      cam.shake = 0.25;
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        fx.sparkle(player.x + Math.cos(a) * 2.2, y() + 0.3, player.z + Math.sin(a) * 2.2, SPELL_COL.flamering, 2);
      }
      fx.puff(player.x, y() + 0.2, player.z, 1.6);
      for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - player.x, m.z - player.z) < 2.8 + m.def.r) { const r = spellHit(m, sk.power(lv) / 100 * k, sk.magic); if (r) inflict(m, sk.status, lv, r.dmg); }
    }, null, sk.name);
    return;
  }
  const target = (player.goal?.mob?.alive && player.goal.mob) || (player.cast?.target?.alive && player.cast.target) || selected() || mobs.nearest(player.x, player.z, 9);
  if (!target) { menus.message('No monster nearby'); return; }
  selMob = target; // the spell's target stays selected after the cast
  const fighting = player.goal?.mob === target && !player.goal.spell; // hitting it when the chant began: go back to it after
  const run = (t) => {
    if (!t.alive || !pay()) return;
    say();
    const k = castMul(sk.magic);
    const from = { x: player.x + player.face.x * 0.4, y: y() + 1.0, z: player.z + player.face.z * 0.4 };
    // the Wizard's area spells: everything within r paces of (cx, cz); then(m, res) for each one hit
    const around = (cx, cz, mult, then, r = 3) => {
      for (const m of [...mobs.list]) if (m.alive && Math.hypot(m.x - cx, m.z - cz) < r + m.def.r) { const res = spellHit(m, mult * k, sk.magic); if (res) then?.(m, res); }
    };
    const burst = (cx, cz, n = 18) => {
      const gy = world.heightAt(cx, cz);
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = 1 + Math.random() * 2; fx.sparkle(cx + Math.cos(a) * r, gy + 0.3, cz + Math.sin(a) * r, SPELL_COL[id], 2); }
      fx.puff(cx, gy + 0.2, cz, 1.4);
    };
    // area spells strike again and again where the target stood; the ground shows the area while it lasts
    if (sk.hits && sk.target === 'mob' && id !== 'frost') {
      const cx = t.x, cz = t.z, mult = sk.power(lv) / 100;
      fx.warn(cx, cz, 3, sk.hits(lv) * sk.every + 0.3, SPELL_COL[id]);
      const caught = new Map(); // Storm Gust: gusts each monster has taken
      repeat(sk, lv, (i) => {
        const gy = world.heightAt(cx, cz);
        if (id === 'quake') { // a shock: the ground jumps
          cam.shake = 0.3;
          burst(cx, cz, 20);
          around(cx, cz, mult, (m) => inflict(m, sk.status, lv));
        }
        if (id === 'stormgust') { // a gust of the blizzard swirls round the area
          for (let j = 0; j < 10; j++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 3; fx.sparkle(cx + Math.cos(a) * r, gy + 0.3 + Math.random() * 1.5, cz + Math.sin(a) * r, SPELL_COL.stormgust, 1); }
          if (i % 3 === 0) fx.puff(cx, gy + 0.4, cz, 1.6);
          around(cx, cz, mult, (m) => { const n = (caught.get(m) || 0) + 1; caught.set(m, n); if (n >= 3) inflict(m, sk.status, lv); });
        }
        if (id === 'thunder') { // a wave of lightning: on every monster in the area, and a few strays
          const at = (x, z) => ({ x, y: world.heightAt(x, z) + 0.4, z });
          for (const m of mobs.list) if (m.alive && Math.hypot(m.x - cx, m.z - cz) < 3 + m.def.r) fx.zap({ x: m.x, y: world.heightAt(m.x, m.z) + 5, z: m.z }, at(m.x, m.z), SPELL_COL.thunder);
          for (let j = 0; j < 2; j++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 3, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r; fx.zap({ x, y: world.heightAt(x, z) + 5, z }, at(x, z), SPELL_COL.thunder); }
          around(cx, cz, mult, (m) => inflict(m, sk.status, lv));
        }
        if (id === 'meteor') { // a meteor falls from the sky on a random spot in the area
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 2.5, x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
          const spot = { x, z, alive: true };
          fx.bolt(x + 1.5, world.heightAt(x, z) + 7, z - 1.5, spot, SPELL_COL.meteor, () => {
            burst(x, z, 14);
            cam.shake = 0.25;
            around(x, z, mult, (m, res) => inflict(m, sk.status, lv, res.dmg), 1.7);
          }, 0.9);
        }
      });
      return;
    }
    if (id === 'arc') { // strikes at once, then leaps to two more
      const at = (m) => ({ x: m.x, y: world.heightAt(m.x, m.z) + 0.5, z: m.z });
      fx.zap(from, at(t), SPELL_COL.arc);
      spellHit(t, sk.power(lv) / 100 * k, sk.magic);
      const near = mobs.list.filter((m) => m.alive && m !== t && Math.hypot(m.x - t.x, m.z - t.z) < 3.2)
        .sort((a, b) => Math.hypot(a.x - t.x, a.z - t.z) - Math.hypot(b.x - t.x, b.z - t.z)).slice(0, 2);
      for (const m of near) { fx.zap(at(t), at(m), SPELL_COL.arc); if (spellHit(m, sk.power(lv) / 200 * k, sk.magic)) inflict(m, sk.status, lv); }
      if (t.alive) inflict(t, sk.status, lv);
      return;
    }
    if (id === 'frost') { // shards of ice rain on the monster one after another
      repeat(sk, lv, () => {
        if (!t.alive) return;
        const ty = world.heightAt(t.x, t.z);
        fx.bolt(t.x + (Math.random() - 0.5) * 0.6, ty + 4.5, t.z + (Math.random() - 0.5) * 0.6, t, SPELL_COL.frost, () => {
          spellHit(t, sk.power(lv) / 100 * k, sk.magic);
          fx.sparkle(t.x, world.heightAt(t.x, t.z) + 0.5, t.z, SPELL_COL.frost, 4);
        }, 0.45);
      });
      return;
    }
    fx.bolt(from.x, from.y, from.z, t, SPELL_COL[id], () => {
      const base = sk.power(lv) / 100;
      const res = spellHit(t, base * k, sk.magic);
      if (res && id === 'stonespike' && t.alive) { t.shatterT = skillClock + 6; fx.number(t.x, overHead(t, t.sprite.scale.y * 0.8 + 0.3), t.z, 'Shattered', 'miss'); }
      const ty = world.heightAt(t.x, t.z) + 0.5;
      fx.sparkle(t.x, ty, t.z, SPELL_COL[id], 8);
    });
  };
  player.command({ mob: target, spell: { range: sk.range, time, run: (t) => { run(t); if (fighting && t.alive && !player.goal) player.command({ mob: t }); }, name: sk.name } });
}
const castBar = document.createElement('div');
castBar.id = 'castbar';
castBar.innerHTML = '<span></span><i><b></b></i>';
document.getElementById('hud').appendChild(castBar);
const castName = castBar.querySelector('span'), castFill = castBar.querySelector('b');
function updateCastBar() {
  const c = player.cast;
  castBar.classList.toggle('show', !!c);
  if (!c) return;
  if (castName.textContent !== c.name) castName.textContent = c.name;
  castFill.style.width = `${Math.min(100, (c.t / c.total) * 100)}%`;
}
player.on('interrupt', () => menus.message('Your spell was interrupted!'));

// skill cooldowns, buffs and the damage bonuses that depend on HP, every frame
let rhythm = 0;
function tickSkills(dt) {
  skillClock += dt;
  for (let i = timers.length - 1; i >= 0; i--) {
    if (timers[i].at > skillClock) continue;
    const t = timers.splice(i, 1)[0];
    if (t.map === world.id) t.fn();
  }
  for (const m of mobs.list) { // poisoned monsters
    if (!m.alive || !(m.poisonT > 0)) continue;
    m.poisonT -= dt;
    if ((m.poisonTick -= dt) > 0) continue;
    m.poisonTick = 1;
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, m.poisonDmg, 'dealt');
    fx.sparkle(m.x, overHead(m, m.sprite.scale.y * 0.4), m.z, '#8aff5a', 4);
    m.hit(m.poisonDmg, 0, 0);
  }
  // a scorpion's venom in the hero: 1.5% of Max HP a second, never the last of it
  if (player.poisonT > 0 && player.state !== 'down') {
    player.poisonT -= dt;
    if ((player.poisonTick -= dt) <= 0) {
      player.poisonTick = 1;
      const n = Math.min(player.hp - 1, Math.max(1, Math.round(player.maxHp * 0.015)));
      if (n > 0) { player.hp -= n; fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken'); fx.sparkle(player.x, overHead(player, 0.8), player.z, '#8aff5a', 3); }
    }
  }
  if (player.hiddenT > 0 && (player.hiddenT -= dt) <= 0) unhide(); // Vanish wears off
  for (const m of mobs.list) { // burning monsters
    if (!m.alive || !(m.burnT > 0)) continue;
    m.burnT -= dt;
    m.burnTick -= dt;
    if (m.burnTick > 0) continue;
    m.burnTick = 1;
    fx.number(m.x, overHead(m, m.sprite.scale.y * 0.8), m.z, m.burnDmg, 'dealt');
    fx.sparkle(m.x, overHead(m, m.sprite.scale.y * 0.4), m.z, '#ff7a2a', 4);
    m.hit(m.burnDmg, 0, 0);
  }
  for (const k in skillCd) skillCd[k] -= dt;
  skillLock = Math.max(0, skillLock - dt);
  for (const k in buffs) {
    if (buffs[k] <= 0) continue;
    buffs[k] -= dt;
    if (buffs[k] <= 0 && k === 'aspd') { applyStats(); menus.message('The Speed Potion wears off'); }
    if (buffs[k] <= 0 && k === 'momentum') momentum = 0;
    if (buffs[k] <= 0 && k === 'imbue') { imbueEl = null; applyStats(); menus.message('Your blade loses its element'); }
    if (buffs[k] <= 0 && k === 'aegis') { player.barrier = 0; applyStats(); }
    if (buffs[k] <= 0 && ['focus', 'tailwind', 'rush', 'gust', 'frenzy', 'swift'].includes(k)) applyStats();
    if (buffs[k] <= 0 && k === 'rhythm') { galeStacks = 0; applyStats(); }
  }
  if (buffs.aegis > 0 && player.barrier <= 0) { buffs.aegis = 0; applyStats(); menus.message('Stone Aegis breaks'); }
  if (player.endureT <= 0) endureGuard = 0;
  player.guard = Math.max(endureGuard, buffs.ward > 0 ? wardLv * 0.02 : 0, buffs.veil > 0 ? veilLv * 0.04 : 0);
  // the moon rises and sets: the Moon Ranger's night passives follow it
  if (!!dayNight.isNight !== nightUp) {
    nightUp = !!dayNight.isNight;
    applyStats();
    if (skillLv(prog, 'moonlit')) menus.message(nightUp ? 'The moon is up: Moonlit Hunter wakes.' : 'The moon sets: Moonlit Hunter sleeps.');
  }
  moonMark.classList.toggle('on', nightUp && skillLv(prog, 'moonlit') > 0 && player.state !== 'down');
  player.steady = buffs.ward > 0;
  const low = player.hp < player.maxHp * 0.25 && skillLv(prog, 'laststand');
  const fury = player.ps.fury && player.hp < player.maxHp * 0.4 ? 1 + player.ps.fury / 100 : 1; // the Great Bear Card's Wounded Fury
  player.atkMul = (buffs.warcry > 0 ? 1 + warcryLv / 100 : 1) * (low ? 1.15 : 1) * (1 + momentum * skillLv(prog, 'momentum') / 100) * fury;
}

// ---------- tap to walk, attack, pick up, talk ----------
const PICK_PX = 44; // how far from a thing (in CSS pixels) a tap still picks it
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), projV = new THREE.Vector3();
function screenDist(cx, cy, x, y, z) {
  projV.set(x, y, z).project(camera);
  if (projV.z > 1) return Infinity;
  return Math.hypot((projV.x + 1) / 2 * window.innerWidth - cx, (1 - projV.y) / 2 * window.innerHeight - cy);
}
// the thing drawn nearest the tap: checked at its feet and its middle, monsters favoured
function pick(cx, cy) {
  let best = null, bd = PICK_PX;
  const consider = (hit, x, y, h, z, bias = 1, fs = [0.15, 0.55]) => {
    for (const f of fs) {
      const d = screenDist(cx, cy, x, y + h * f, z) * bias;
      if (d < bd) { bd = d; best = hit; }
    }
  };
  for (const m of mobs.list) if (m.alive) consider({ mob: m }, m.x, m.sprite.position.y, m.sprite.scale.y * 0.8, m.z, 0.8);
  for (const p of fx.pickups) consider({ item: p }, p.x, p.s.position.y, 0.5, p.z);
  // people are picked at their feet, middle and the ! or ? bubble over their head
  for (const sp of SPOTS) if (sp.map === world.id) consider({ spot: sp }, sp.x, world.heightAt(sp.x, sp.z), sp.h, sp.z, 1, sp.npc ? [0.15, 0.55, 1.12] : undefined);
  return best;
}
function tap(cx, cy) {
  if (player.state === 'down') return;
  stopNav(); // taking the reins again
  const hit = pick(cx, cy);
  if (hit?.mob) { selMob = hit.mob; player.command({ mob: hit.mob }); }
  else if (hit?.item) {
    const p = hit.item;
    player.command({ x: p.tx, z: p.tz, reach: 0.7, arrive: () => { if (fx.pickups.includes(p) && collect(p)) fx.take(p); } }); // where it lands
  } else if (hit?.spot) {
    const sp = hit.spot;
    player.command({ x: sp.x, z: sp.z, reach: 1.7, arrive: sp.run });
  } else walkTo(cx, cy, true);
}
// walk to the ground under a screen point (mark: show the tile marker)
function walkTo(cx, cy, mark) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const at = ray.intersectObject(world.terrain)[0]?.point;
  if (!at) return;
  const [i, j] = player.tiles.nearestFree(...player.tiles.tileAt(at.x, at.z)) || [];
  if (i === undefined) return;
  if (mark) fx.tileMark(i, j);
  if (player.goal && !player.goal.mob && Math.hypot(player.goal.x - (i + 0.5), player.goal.z - (j + 0.5)) < 0.01) return; // already going there
  player.command({ x: i + 0.5, z: j + 0.5, reach: 0.05 });
}
// holding a finger (or the mouse button) on the ground: keep walking towards it
let holdT = 0;
function holdWalk(dt) {
  const h = input.held();
  if (!h || player.state === 'down') { holdT = 0; return; }
  stopNav();
  holdT -= dt;
  if (holdT > 0) return;
  holdT = 0.16;
  walkTo(h.x, h.y, false);
}
function rest() {
  player.heal(player.maxHp);
  if (dayNight.night > 0.3) {
    const veil = document.getElementById('faint');
    veil.querySelector('div').textContent = 'You sleep until morning…';
    veil.querySelector('small').textContent = 'Hearts restored · Game saved';
    veil.classList.add('show');
    setTimeout(() => { dayNight.skipToMorning(); persist(); }, 700);
    setTimeout(() => {
      veil.classList.remove('show');
      setTimeout(() => { veil.querySelector('div').textContent = 'You fainted…'; veil.querySelector('small').textContent = 'Returning to camp'; }, 700);
    }, 1900);
  } else {
    persist();
    menus.message('Rested. Hearts restored and game saved.');
  }
}

const dayNight = new DayNight({
  scene, hemi, sun, world, mobs, player, inv,
  onPhase(night) {
    audio.play(night ? 'night' : 'morning');
    menus.message(night ? 'Night falls over Aria. Wisps are stirring.' : 'Morning has come.');
  },
});
if (typeof save?.time === 'number') dayNight.t = save.time;

// HP doesn't recover while walking, like Ragnarok. Resting (the skill, or at camp) doubles it.
let hpT = 0, spT = 0;
function naturalRegen(dt) {
  if (player.state === 'down') return;
  const resting = world.isSafe(player.x, player.z) || player.state === 'sit';
  const fast = resting ? 2 : 1;
  const walking = player.moving;
  const low = player.hp < player.maxHp * 0.25 && skillLv(prog, 'secondwind') ? 3 : 1;
  if (!walking) hpT += dt * fast * low * (inv.wearing('regen') ? 2 : 1);
  spT += dt * fast * (nightUp ? 1 + 0.1 * skillLv(prog, 'lunartide') : 1); // Lunar Tide
  // resting (sitting, or in a town) also gives back a share of the whole bar, so a full rest takes
  // about a minute at any level instead of minutes early on
  if (hpT >= 6) { hpT -= 6; player.heal(player.ps.hpRegen + (resting ? Math.ceil(player.maxHp * 0.05) : 0)); }
  if (spT >= 8) { spT -= 8; player.healSp(player.ps.spRegen + skillLv(prog, 'manawell') + (resting ? Math.ceil(player.maxSp * 0.06) : 0)); }
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 55 : 40;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function camBasis() {
  return { fx: -Math.sin(cam.yaw), fz: -Math.cos(cam.yaw), rx: Math.cos(cam.yaw), rz: -Math.sin(cam.yaw) };
}

let saveT = 0;
let questZone = null, questT = 0;
let resetting = false;
function persist() {
  if (!started || resetting) return;
  const isle = raidOf(world.id), back = isle && raid?.back, at = back || (isle ? boatSpot(isle) : player); // a run is never saved: back on the shore (or where they set out from)
  writeSave({ story: story.toJSON(), look: player.look, visited: [...visited], keepers: [...keepers], savePoint, raidAt, raidsDone: [...raidsDone], raidLog, raidRun: raid ? { id: raid.id, diff: raid.diff, at: raid.start } : null, map: back ? back.map : isle ? isle.from : world.id, mvpAt: mobs.mvpAt, bossHp: mobs.bossSnapshot(), bossAt: mobs.bossAt, fieldAt: mobs.fieldSnapshot(), x: at.x, z: at.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, sp: player.sp, inv: inv.toJSON(), prog: prog.toJSON(), quests: quests.toJSON(), hotbar: hotbar.toJSON(), time: dayNight.t });
  writeStorage(inv.chest.toJSON());
}

// second jobs glow: a soft aura behind the hero and a ring at their feet, in the job's colour
const AURA = { blademaster: '#ff7a4a', wizard: '#b48aff', magicknight: '#6ad8ff', windrunner: '#8af0c8', moonranger: '#b8c8ff', beastmaster: '#ff9a5a', phantom: '#9a6aff' };
// a small moon by the hotbar while the Moon Ranger's night passives work
// ---------- the buff bar: what is on the hero, with the time left; hold an icon for what it does ----------
const buffBar = document.createElement('div');
buffBar.id = 'buffbar';
buffBar.className = 'ui-click';
document.getElementById('hud').appendChild(buffBar);
const buffTip = document.createElement('div');
buffTip.id = 'bufftip';
buffTip.hidden = true;
document.getElementById('hud').appendChild(buffTip);
// every buff showing now: { key, icon, name, left (s), stacks, fx: its effect in a few words }
function buffList() {
  const out = [];
  const sk = (key, id, left, fx) => SKILLS[id] && out.push({ key, icon: SKILLS[id].icon, name: SKILLS[id].name, left, fx });
  const lvOf = (id) => skillLv(prog, id);
  if (buffs.warcry > 0) sk('warcry', 'warcry', buffs.warcry, `ATK +${warcryLv}%`);
  if (player.endureT > 0 && endureFrom) sk('endure', endureFrom, player.endureT, `Damage taken −${Math.round(endureGuard * 100)}% · no flinching`);
  if (buffs.ward > 0) sk('ward', 'ward', buffs.ward, `Damage taken −${2 * wardLv}% · casting can't be broken`);
  if (buffs.aegis > 0) sk('aegis', 'aegis', buffs.aegis, `Barrier ${Math.ceil(player.barrier)} · DEF +${aegisLv}`);
  if (buffs.focus > 0) sk('focus', 'focus', buffs.focus, `FNS +${focusLv} · QKN +${focusLv}`);
  if (buffs.tailwind > 0) sk('tailwind', 'tailwind', buffs.tailwind, `Bow attack speed +${2 * tailLv}%`);
  if (buffs.rush > 0) out.push({ key: 'rush', icon: SKILLS.tailwind.icon, name: 'Tailwind Rush', left: buffs.rush, fx: 'Walk speed +30%' });
  if (buffs.gust > 0) sk('gust', 'galestep', buffs.gust, `Walk speed +${gustHaste}%`);
  if (buffs.rhythm > 0 && galeStacks) { sk('rhythm', 'galerhythm', buffs.rhythm, `Bow attack speed +${lvOf('galerhythm') * galeStacks}%`); out.at(-1).stacks = galeStacks; }
  if (buffs.veil > 0) sk('veil', 'moonveil', buffs.veil, `Damage taken −${4 * veilLv}%${nightUp ? ' · Multishot +2 arrows' : ''}`);
  if (buffs.frenzy > 0) sk('frenzy', 'packfrenzy', buffs.frenzy, `Beasts: attack speed +${3 * frenzyLv}% · damage +${3 * frenzyLv}%`);
  if (buffs.imbue > 0 && imbueEl) sk('imbue', 'elemblade', buffs.imbue, `Element: ${imbueEl[0].toUpperCase()}${imbueEl.slice(1)}`);
  if (buffs.momentum > 0 && momentum) { sk('momentum', 'momentum', buffs.momentum, `ATK +${momentum * lvOf('momentum')}%`); out.at(-1).stacks = momentum; }
  if (player.rootT > 0) out.push({ key: 'root', icon: 'skill_earthsplit', name: 'Rooted', left: player.rootT, fx: "Can't walk, dash or leap away" });
  if (buffs.aspd > 0) out.push({ key: 'aspd', icon: 'quick', name: ITEMS.quick.name, left: buffs.aspd, fx: 'Attack speed +10%' });
  return out;
}
const buffTime = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : `${Math.ceil(s)}s`);
let buffHeld = null, buffHoldT = 0, buffShown = '';
function drawBuffs() {
  const list = started ? buffList() : [];
  const sig = list.map((b) => `${b.key}:${b.stacks || ''}`).join(',');
  if (sig !== buffShown) { // the icons change only when a buff comes or goes; the timers every tick
    buffShown = sig;
    buffBar.innerHTML = list.map((b) => `<div class="buff" data-buff="${b.key}"><img src="${iconURL(b.icon)}" alt="">${b.stacks ? `<b>${b.stacks}</b>` : ''}<span></span></div>`).join('');
  }
  for (const b of list) {
    const el = buffBar.querySelector(`[data-buff="${b.key}"]`);
    if (el) { el.lastChild.textContent = buffTime(b.left); el.classList.toggle('ending', b.left < 5); }
  }
  const held = buffHeld && list.find((b) => b.key === buffHeld);
  if (!held) { buffTip.hidden = true; return; }
  buffTip.hidden = false;
  buffTip.innerHTML = `<b>${esc(held.name)}${held.stacks ? ` ×${held.stacks}` : ''}</b><span>${esc(held.fx)}</span>`;
  const r = buffBar.querySelector(`[data-buff="${held.key}"]`)?.getBoundingClientRect();
  if (r) { buffTip.style.top = `${r.bottom + 6}px`; buffTip.style.left = `${Math.max(8, Math.min(window.innerWidth - buffTip.offsetWidth - 8, r.left + r.width / 2 - buffTip.offsetWidth / 2))}px`; }
}
setInterval(drawBuffs, 200);
// hold an icon (or point at it with a mouse) for what it does
const buffAt = (e) => e.target.closest?.('.buff')?.dataset.buff || null;
buffBar.addEventListener('pointerdown', (e) => {
  const k = buffAt(e);
  if (!k) return;
  clearTimeout(buffHoldT);
  if (e.pointerType === 'mouse') { buffHeld = k; drawBuffs(); return; }
  buffHoldT = setTimeout(() => { buffHeld = k; drawBuffs(); }, 300);
});
buffBar.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse' && buffAt(e)) { buffHeld = buffAt(e); drawBuffs(); } });
buffBar.addEventListener('pointerout', (e) => { if (e.pointerType === 'mouse') { buffHeld = null; drawBuffs(); } });
for (const ev of ['pointerup', 'pointercancel']) window.addEventListener(ev, (e) => { if (e.pointerType !== 'mouse') { clearTimeout(buffHoldT); buffHeld = null; drawBuffs(); } });
buffBar.addEventListener('contextmenu', (e) => e.preventDefault());

const moonMark = document.createElement('div');
moonMark.id = 'moonmark';
moonMark.title = 'Moonlit Hunter: the moon is up';
document.body.appendChild(moonMark);
const aura = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(0.45, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.renderOrder = 1;
  s.visible = false;
  scene.add(s);
  // and a glowing ring on the ground at the hero's feet
  const r = document.createElement('canvas');
  r.width = r.height = 64;
  const rg = r.getContext('2d'), ring = rg.createRadialGradient(32, 32, 10, 32, 32, 31);
  ring.addColorStop(0, 'rgba(255,255,255,0)'); ring.addColorStop(0.55, 'rgba(255,255,255,.18)'); ring.addColorStop(0.8, 'rgba(255,255,255,.75)'); ring.addColorStop(1, 'rgba(255,255,255,0)');
  rg.fillStyle = ring; rg.fillRect(0, 0, 64, 64);
  const geo = new THREE.PlaneGeometry(1.5, 1.5);
  geo.rotateX(-Math.PI / 2);
  s.userData.ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(r), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  s.userData.ring.visible = false;
  scene.add(s.userData.ring);
  return s;
})();
function tickAura(dt, t, b) {
  const col = AURA[prog.job];
  const ring = aura.userData.ring;
  aura.visible = ring.visible = !!col && player.state !== 'down' && started;
  if (!aura.visible) return;
  aura.material.color.set(col);
  ring.material.color.set(col);
  const y = world.heightAt(player.x, player.z);
  aura.position.set(player.x - b.fx * 0.35, y + 0.62, player.z - b.fz * 0.35); // just behind the hero
  const k = 1.45 + Math.sin(t * 2.6) * 0.07;
  aura.scale.set(k, k * 1.25, 1);
  aura.material.opacity = 0.55 + Math.sin(t * 2.6) * 0.12;
  ring.position.set(player.x, y + 0.04, player.z);
  ring.scale.setScalar(1 + Math.sin(t * 2.6) * 0.05);
  ring.material.opacity = 0.7 + Math.sin(t * 2.6) * 0.15;
  ring.rotation.y = t * 0.6;
}

// ---------- the camera in a cutscene, and while the hero is made: it frames a point (focus: {x, z}),
// from dist, turning (spin, rad/s), at its own pitch, shifted sideways (side: the hero left of centre) ----------
let cine = null;
const CINE_HERO = { x: -999, z: -999, state: 'down', ps: {}, canBeHit: () => false }; // (no hero for the monsters to notice)
// the opening, before a new hero is made: the old tale, told by the world itself
const INTRO_SHOTS = [
  { map: 'camp', time: 0.8, focus: 'fire', dist: 19, yaw: 0.4, spin: 0.05, secs: 6, text: 'Long ago, the fire-jotnar slept beneath the hills of Aria.' },
  { map: 'camp', time: 0.82, focus: 'fire', dist: 8.5, pitch: 0.55, yaw: 2.2, spin: 0.09, secs: 6, text: 'The first settlers lit a ring of fires to keep them dreaming, and named their camp Eldrun: the fire-ring.' },
  { map: 'ridge', time: 0.63, focus: 'jarl', dist: 12, pitch: 0.6, yaw: 0.8, spin: 0.06, secs: 6.5, shake: 0.6, sound: 'night', text: 'Now the fires burn low. And beneath Ember Hill, the Fire Giant stirs in his sleep...' },
  { map: 'grove', time: 0.83, focus: 'field', dist: 13, yaw: 3.6, spin: 0.07, secs: 5.5, text: 'Monsters wander the fields, and strange lights drift through the night.' },
  { map: 'camp', time: 0.92, focus: 'hero', dist: 7.5, pitch: 0.62, yaw: 5.2, spin: 0.05, secs: 6, text: 'And over the mountains came a stranger, with a practice sword and a head full of songs...' },
  { map: 'camp', time: 0.92, focus: 'fire', dist: 11, yaw: 5.6, spin: 0.03, secs: 5, card: { title: 'Aria', sub: 'The Last Fire-Ring' } },
];
function cineShot(s) {
  if (world.id !== s.map) enterMap(s.map, null, s.map === 'camp' ? null : { x: 3, z: 3 }); // (the hero out of the shot)
  dayNight.t = s.time;
  mobs.update(0.01, CINE_HERO); // (a boss's time come: the Fire Giant appears)
  const jarl = () => mobs.list.find((m) => m.type === 'jarl' && m.alive);
  const near = mobs.list.find((m) => m.alive && m.type === 'wisp') || mobs.list.find((m) => m.alive), field = near ? { x: near.x, z: near.z } : { x: 32, z: 32 }; // (where something moves)
  const focus = { fire: () => ({ x: 32, z: 32 }), field: () => field, hero: () => player, jarl: () => jarl() || { x: 32, z: 40 } }[s.focus];
  cine = { focus, dist: s.dist, pitch: s.pitch, spin: s.spin, side: 0 };
  cam.yaw = s.yaw;
  const f = focus();
  cam.target.set(f.x, world.heightAt(f.x, f.z), f.z);
  if (s.shake) cam.shake = s.shake;
  if (s.sound) audio.play(s.sound);
}
// the opening cutscene, then the world as a new hero finds it (no trace of the shots kept)
function playIntro(done) {
  playCutscene(INTRO_SHOTS, cineShot, () => {
    cine = null;
    mobs.fieldAt = {}; mobs.bossAt = {}; mobs.bossHp = {};
    for (const k of Object.keys(groundLeft)) delete groundLeft[k];
    enterMap('camp');
    dayNight.t = 0.04;
    cam.yaw = 0; cam.dist = 12;
    done();
  });
}

// ---------- the beasts' health, under the hero's panel and its buttons: a row and a bar for each ----------
const petsEl = document.getElementById('pets');
let petsKey = '', petsT = 0;
function tickPets(dt) {
  if ((petsT -= dt) > 0) return;
  petsT = 0.15;
  const list = allies.beasts.filter((b) => b.alive); // (the beasts' bars: an illusion isn't shown)
  const key = list.map((b) => `${b.kind}${Math.ceil(b.hp)}/${b.maxHp}`).join('|');
  if (key === petsKey) return;
  petsKey = key;
  petsEl.hidden = !list.length;
  document.body.style.setProperty('--pets-h', `${list.length ? list.length * 17 + 8 : 0}px`); // (the toasts step down under them)
  petsEl.innerHTML = list.map((b) => {
    const f = Math.max(0, Math.min(1, b.hp / b.maxHp));
    return `<div class="pet${f < 0.3 ? ' low' : ''}"><b style="color:${b.color}">${b.name}</b><i><s style="width:${(f * 100).toFixed(1)}%;background:${b.color}"></s></i><em>${Math.ceil(b.hp)}</em></div>`;
  }).join('');
}

const clock = new THREE.Clock();
let started = false;
let stepT = 0;
const tmpV = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame); // first: an error in one frame must never stop the game
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const c = input.consumeCamera(dt);
  cam.yaw += c.yaw;
  cam.dist = clamp(cam.dist + c.zoom, 7, 20);

  const b = camBasis();
  // windows never pause the game, like Ragnarok
  for (const w of ['items', 'equip', 'skills', 'status', 'raids', 'journal', 'settings']) if (input.tapped(w) && started) { menus.toggle(w); if (menus.isOpen(w)) story.flags[`opened_${w}`] = true; } // (a story step may ask for a window)
  if (input.tapped('attack') && started) attackNow();
  if (input.tapped('close')) { if (bigmap.open) bigmap.close(); else menus.close(); }
  bigmap.update(dt);
  const live = started;
  const clicks = input.takeClicks();
  if (live) for (const c of clicks) tap(c.x, c.y);
  if (live) holdWalk(dt);

  player.update(live ? dt : 0, b, mobs);
  if (live && player.moving && player.state === 'normal') {
    stepT -= dt;
    if (stepT <= 0) { stepT = 1.4 / player.walkSpeed(); audio.play('step'); } // a footstep every 1.4 tiles
  }
  audio.update(dt, dayNight.night);
  if (!started && !cine) cam.yaw += dt * 0.05; // slow orbit behind the title screen
  if (!started && cine) mobs.update(dt, CINE_HERO); // (the cutscene's world goes on)
  mobs.cam = b;
  allies.cam = b;
  if (live) mobs.update(dt, player);
  if (live) burnTick(dt);
  if (live) matchupHint();
  if (live) allies.update(dt, player, mobs, player.goal?.mob || player.cast?.target);
  if (live) dayNight.update(dt, t); else if (!started) dayNight.update(0, t);
  world.update(dt, t);
  villagers.update(dt, player, b);
  if (live) fx.update(dt);
  if (live) { naturalRegen(dt); tickSkills(dt); checkPortals(); tickNav(); tickQuestWorld(dt); }
  if (live) tickWading(dt);
  if (live) { tickVigil(dt); tickStorySpawn(); }
  if (live) tickRaid(dt);
  if (live) tickPets(dt);
  dressPeople();
  tickAura(dt, t, b);
  updateCastBar();
  hotbar.update();
  world.updateOcclusion(player.x, player.z, b, player.goal?.mob?.alive ? player.goal.mob : null);

  if (cine) { // a cutscene's shot, or the hero's making: the camera frames its own point
    const f = cine.focus(), up = cine.up || 0; // (side: to the screen's right, so the focus sits left; up: toward the camera, so it sits high)
    const rx = Math.cos(cam.yaw) * (cine.side || 0) + Math.sin(cam.yaw) * up, rz = -Math.sin(cam.yaw) * (cine.side || 0) + Math.cos(cam.yaw) * up;
    cam.target.lerp(tmpV.set(f.x + rx, world.heightAt(f.x, f.z), f.z + rz), 1 - Math.exp(-4 * dt));
    cam.yaw += cine.spin * dt;
    cam.dist = cine.dist;
  } else {
    const py = world.heightAt(player.x, player.z);
    cam.target.lerp(tmpV.set(player.x, py, player.z), 1 - Math.exp(-8 * dt));
  }
  const pitch = cine?.pitch ?? lerp(0.72, 0.98, (cam.dist - 7) / 13);
  const horiz = Math.cos(pitch) * cam.dist;
  cam.shake = Math.max(0, cam.shake - dt);
  const sh = cam.shake * 0.5;
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
    cam.target.y + 0.7 + Math.sin(pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
  );
  camera.lookAt(cam.target.x, cam.target.y + 0.7, cam.target.z);
  camera.updateMatrixWorld();
  if (live) { tickGuide(dt); tickGoalArrow(); }

  ui.update(dt, player, cam.yaw);
  if (live && ui.zone !== questZone) {
    questZone = ui.zone;
    for (const id of quests.onZone(questZone)) questComplete(id);
    story.onZone(questZone);
  }
  questT -= dt;
  if (questT <= 0) { questT = 0.5; refreshQuests(); if (live) checkStory(); }

  saveT += dt;
  if (saveT > 3) { saveT = 0; persist(); }

  if (live) mobLabels();
  wings.set(inv.gear.wings); // the Wings slot: wings on the back, or a light at the shoulder
  wings.update(dt, player, camera, t, world.heightAt(player.x, player.z));
  renderer.render(scene, camera);
}

// monster names, like Ragnarok: over the one the mouse is on, and over the one you are fighting
const labelEls = { hover: document.querySelector('#moblabels .hover'), target: document.querySelector('#moblabels .target') };
function mobLabels() {
  const target = (player.goal?.mob?.alive ? player.goal.mob : null) || selected(); // the one fought, else the one selected
  const over = input.hover ? pick(input.hover.x, input.hover.y)?.mob : null;
  for (const [k, m] of [['target', target], ['hover', over !== target ? over : null]]) {
    const el = labelEls[k];
    if (!m || !m.alive || !m.sprite.visible) { el.style.display = 'none'; continue; }
    const s = m.sprite, top = s.position.y + s.scale.y * (1 - s.center.y) * 0.92;
    projV.set(m.x, top, m.z).project(camera);
    if (projV.z > 1) { el.style.display = 'none'; continue; }
    el.style.display = 'block';
    el.textContent = m.def.name + (m.def.mvp ? ' ✦ MVP' : m.def.boss ? ' ✦' : '');
    el.style.transform = `translate(${(projV.x + 1) / 2 * window.innerWidth}px, ${(1 - projV.y) / 2 * window.innerHeight}px) translate(-50%, -100%)`;
  }
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

const title = document.getElementById('title');
const tContinue = document.getElementById('t-continue');
const tNew = document.getElementById('t-new');
const tSound = document.getElementById('t-sound');
// character slots: the game loads the hero played last; picking another and pressing Play loads
// that one (the page starts again with it) and goes straight in. An empty slot makes a new hero.
const slotHere = activeSlot(), slotsEl = document.getElementById('t-slots');
const heroes = Array.from({ length: SLOTS }, (_, i) => (i === slotHere ? save : loadSave(i)));
let picked = slotHere;
const heroName = (d) => d.look?.name || 'Hero';
const gender = (d) => (d.look?.body === 'f' ? '<i class="tsex f" title="Female">♀</i>' : '<i class="tsex m" title="Male">♂</i>');
const lvLine = (p) => (p.v === 2 ? `Base Lv ${p.baseLv} · Job Lv ${p.jobLv}` : `Lv ${p.level | 0 || 1}`);
function drawSlots() {
  slotsEl.innerHTML = heroes.map((d, i) => {
    const on = i === picked ? ' on' : '';
    if (!d) return `<button class="tslot empty${on}" data-i="${i}"><span class="tpic">+</span><span><b>Create a hero</b><small>Empty slot</small></span><i class="tslotno">${i + 1}</i></button>`;
    const p = d.prog || {};
    const pic = headsReady() ? `<img class="tpic" src="${lookPortrait({ hair: 'messy', dye: 'brown', ...d.look }, 48)}" alt="">` : '<span class="tpic"></span>';
    // two lines: the name and whether male or female; the job and levels
    return `<button class="tslot${on}" data-i="${i}">${pic}<span><b>${esc(heroName(d))} ${gender(d)}</b><small>${esc(JOBS[p.job]?.name || JOBS.novice.name)} · ${lvLine(p)}</small></span><i class="tslotno">${i + 1}</i></button>`;
  }).join('');
  tContinue.textContent = !heroes[picked] ? 'Create Hero' : picked === slotHere ? 'Continue' : 'Play';
  tNew.hidden = !heroes[picked];
  tBackup.hidden = !heroes.some(Boolean);
  drawPreview();
  if (!headsReady() && heroes.some(Boolean) && !started) setTimeout(drawSlots, 300); // the portraits, once the heads have loaded
}
// the picked hero, full size in the job they wear, turning slowly round (all eight sides)
const TURN = ['down', 'downleft', 'left', 'upleft', 'up', 'upright', 'right', 'downright'];
const tpImg = document.getElementById('tp-img'), tpEmpty = document.getElementById('tp-empty'), tpInfo = document.getElementById('tp-info');
let turnAt = 0;
function drawPreview() {
  const d = heroes[picked];
  tpImg.hidden = !d; tpEmpty.hidden = !!d;
  if (!d) { tpInfo.innerHTML = '<b>A new hero</b><span>Begin a new tale by the last fire</span>'; return; }
  const p = d.prog || {};
  tpImg.src = heroPic(p.job || 'novice', d.look, TURN[turnAt % TURN.length], savedGear(d));
  tpInfo.innerHTML = `<b>${esc(heroName(d))} ${gender(d)}</b><span>${esc(JOBS[p.job]?.name || JOBS.novice.name)} · ${lvLine(p)}</span>`;
}
// it turns by itself, and by hand: drag across it (or the arrows) to turn it, and it waits a moment
// before turning by itself again
let heldT = 0;
const turnTo = (k) => { turnAt = ((turnAt + k) % TURN.length + TURN.length) % TURN.length; const d = heroes[picked]; if (d && headsReady()) tpImg.src = heroPic(d.prog?.job || 'novice', d.look, TURN[turnAt], savedGear(d)); };
const turnTimer = setInterval(() => { if (started || !title.isConnected) { clearInterval(turnTimer); return; } if (performance.now() > heldT) turnTo(1); }, 420);
const tpStage = document.getElementById('tp-stage');
let dragX = null;
tpStage.addEventListener('pointerdown', (e) => { if (e.target.closest('.tp-turn')) return; dragX = e.clientX; heldT = performance.now() + 3000; tpStage.setPointerCapture?.(e.pointerId); });
tpStage.addEventListener('pointermove', (e) => {
  if (dragX === null) return;
  heldT = performance.now() + 3000;
  const steps = Math.trunc((e.clientX - dragX) / 28); // a side every 28 pixels dragged
  if (steps) { turnTo(-steps); dragX += steps * 28; }
});
const dragEnd = () => { dragX = null; };
tpStage.addEventListener('pointerup', dragEnd);
tpStage.addEventListener('pointercancel', dragEnd);
tpStage.addEventListener('click', (e) => { const b = e.target.closest('.tp-turn'); if (!b) return; heldT = performance.now() + 3000; turnTo(+b.dataset.turn); audio.play('ui'); });
slotsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.tslot');
  if (!b || +b.dataset.i === picked) return;
  picked = +b.dataset.i;
  confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); tNew.classList.add('ghost');
  audio.play('ui');
  drawSlots();
});
const soundLabel = () => { tSound.textContent = audio.enabled ? '🔊' : '🔇'; tSound.title = `Sound: ${audio.enabled ? 'On' : 'Off'}`; };
soundLabel();
tSound.addEventListener('click', () => { audio.start(); audio.setEnabled(!audio.enabled); soundLabel(); audio.play('ui'); });
// back up the save as a line of text (to keep in notes or a chat), or paste one back in
const tBackup = document.getElementById('t-backup'), tRestore = document.getElementById('t-restore');
const codeBox = document.getElementById('t-code'), codeMsg = document.getElementById('t-code-msg');
const codeText = document.getElementById('t-code-text'), codeGo = document.getElementById('t-code-go');
let codeMode = null;
const openCode = (mode) => {
  codeMode = mode;
  codeBox.hidden = false;
  audio.play('ui');
  if (mode === 'backup') {
    codeText.value = saveCode();
    codeText.readOnly = true;
    codeMsg.textContent = 'All your heroes and the shared storage as a code. Copy it and keep it somewhere safe (notes, a chat). Restore save puts it back, on this phone or another.';
    codeGo.textContent = 'Copy';
  } else {
    codeText.value = '';
    codeText.readOnly = false;
    codeMsg.textContent = 'Paste a save code here. It replaces all your heroes and the storage (a code from before the slots replaces only the chosen slot).';
    codeGo.textContent = 'Load';
  }
};
// the Account menu (top right): back up or restore every hero and the storage
const tAccount = document.getElementById('t-account'), acctMenu = document.getElementById('t-acctmenu');
const acctOpen = (on) => { acctMenu.hidden = !on; tAccount.setAttribute('aria-expanded', String(on)); };
tAccount.addEventListener('click', (e) => { e.stopPropagation(); audio.play('ui'); acctOpen(acctMenu.hidden); });
title.addEventListener('click', (e) => { if (!e.target.closest('.t-acct')) acctOpen(false); });
tBackup.addEventListener('click', () => { acctOpen(false); openCode('backup'); });
tRestore.addEventListener('click', () => { acctOpen(false); openCode('restore'); });
document.getElementById('t-code-close').addEventListener('click', () => { codeBox.hidden = true; audio.play('ui'); });
codeGo.addEventListener('click', async () => {
  if (codeMode === 'backup') {
    codeText.select();
    let ok = false;
    try { await navigator.clipboard.writeText(codeText.value); ok = true; } catch { try { ok = document.execCommand('copy'); } catch { /* select it by hand */ } }
    codeMsg.textContent = ok ? 'Copied! Paste it somewhere safe.' : 'Select the code and copy it by hand.';
    return;
  }
  const got = loadCode(codeText.value, picked);
  if (!got) { codeMsg.textContent = 'That code did not load: it is cut short or not a save code. Copy it whole, from ARIA2: to its last letter.'; return; }
  if (got === 'slot') setActiveSlot(picked);
  codeMsg.textContent = 'Save restored. Starting…';
  resetting = true; // don't let the running game write over it
  toSelectNext();
  setTimeout(() => location.reload(), 600);
});
// Delete: the picked hero is gone for good (the shared storage stays), so it asks twice
let confirmNew = false, confirmT = 0;
tNew.addEventListener('click', () => {
  if (!confirmNew) {
    confirmNew = true;
    tNew.textContent = `Tap again to delete ${heroName(heroes[picked])}`;
    tNew.classList.remove('ghost');
    tNew.classList.add('warn');
    clearTimeout(confirmT);
    confirmT = setTimeout(() => { confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); tNew.classList.add('ghost'); }, 3000);
    return;
  }
  clearTimeout(confirmT);
  confirmNew = false; tNew.textContent = 'Delete'; tNew.classList.remove('warn'); tNew.classList.add('ghost');
  clearSave(picked);
  heroes[picked] = null;
  if (picked === slotHere) { resetting = true; toSelectNext(); location.reload(); return; } // the hero in the game: start the page over without it
  audio.play('ui');
  drawSlots();
});
tContinue.addEventListener('click', () => {
  if (picked !== slotHere) { // another slot: load it and come straight back in
    setActiveSlot(picked);
    try { sessionStorage.setItem(GO_KEY, '1'); } catch { /* it waits on the title screen instead */ }
    resetting = true;
    location.reload();
    return;
  }
  begin();
});
function begin() {
  setActiveSlot(slotHere);
  audio.start();
  audio.play('ui');
  title.classList.add('hide');
  if (!save && !cine) { // a new hero: the opening cutscene first, then the making
    setTimeout(() => { title.style.display = 'none'; playIntro(enterGame); }, 450);
    return;
  }
  enterGame();
}
function enterGame() {
  document.getElementById('hud').classList.remove('pre');
  started = true;
  input.enabled = true;
  cam.yaw = save?.yaw ?? 0;
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* not supported */ }
  setTimeout(() => {
    title.remove();
    ui.showZone(world.id);
    if (!save) { // a new character: their making, the camera close on them as they turn
      const wide = innerWidth > 640; // (a phone held upright: the hero above the choices)
      cine = { focus: () => player, dist: wide ? 5.2 : 7, pitch: wide ? 0.38 : 0.5, spin: 0.35, side: wide ? 1.35 : 0, up: wide ? 0 : 5 };
      villagers.show(null); // (the camp's people step out of the picture)
      menus.openLook('new', player.look);
    } else startStory();
    const hint = document.getElementById('hint');
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 6000);
  }, 450);
}
const GO_KEY = 'aria.go', SELECT_KEY = 'aria.select'; // (SELECT_KEY: back to the hero select, not the tap-to-start screen)
function toSelectNext() { try { sessionStorage.setItem(SELECT_KEY, '1'); } catch { /* the tap-to-start screen first, then */ } }
drawSlots();
let go = false;
try { go = sessionStorage.getItem(GO_KEY) === '1'; sessionStorage.removeItem(GO_KEY); } catch { /* storage unavailable */ }
if (go) { // picked on the title screen before the page started over: the sound waits for a tap
  window.addEventListener('pointerdown', () => audio.start(), { once: true });
  begin();
}

// the loading screen, ready now: it turns into the tap-to-start screen over the world (the tap also
// lets the sound start), and the hero select comes up behind it. Straight on, with no tap, into a hero
// already picked, or back to the select after a restore or a delete started the page over
const boot = document.getElementById('boot');
const bootGone = () => { boot.classList.add('hide'); setTimeout(() => boot.remove(), 500); };
let toSelect = false;
try { toSelect = sessionStorage.getItem(SELECT_KEY) === '1'; sessionStorage.removeItem(SELECT_KEY); } catch { /* storage unavailable */ }
if (go || toSelect) { title.classList.remove('wait'); bootGone(); } else {
  boot.querySelector('.bver').textContent = `v1.0.${__BUILD__}`;
  boot.classList.add('ready');
  const tap = (e) => {
    if (e.type === 'keydown' && e.repeat) return;
    removeEventListener('keydown', tap);
    boot.removeEventListener('pointerdown', tap);
    audio.start();
    audio.play('ui');
    title.classList.remove('wait');
    bootGone();
  };
  boot.addEventListener('pointerdown', tap);
  addEventListener('keydown', tap);
}

window.__aria = { scene, renderer, lib, warp, enterMap, useSkill, useItem, story, SPOTS, player, world, cam, camera, mobs, allies, fx, inv, prog, quests, villagers, menus, hotbar, dayNight, audio, stats: world.stats, raid: () => raid, raidAt: () => raidAt, raidGo, raidLog: () => raidLog, storyDone, gainExp };
