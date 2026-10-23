import * as THREE from 'three';
import './style.css';
import { createSprites } from './sprites.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { FX } from './fx.js';
import { MobManager } from './mobs.js';
import { loadSave, writeSave } from './save.js';
import { Inventory } from './inventory.js';
import { Progress } from './progress.js';
import { Quests, QUESTS, NPCS } from './quests.js';
import { Villagers } from './villagers.js';
import { Tiles } from './tiles.js';
import { Hotbar } from './hotbar.js';
import { derive } from './rules.js';
import { Menus } from './menus.js';
import { iconTexture, iconURL, ITEMS } from './items.js';
import { DayNight } from './daynight.js';
import { Audio } from './audio.js';
import { clearSave } from './save.js';
import { clamp, lerp } from './noise.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

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
mobs.populate([
  ['slime', 7, ['grove']],
  ['sprout', 5, ['grove']],
  ['blueSlime', 5, ['fen']],
  ['crab', 4, ['fen']],
  ['mushling', 7, ['hollow']],
  ['beetle', 6, ['ridge']],
  // night: Firefly Wisps anywhere, plus ~20% more of everything
  ['wisp', 7, null, true],
  ['slime', 2, ['grove'], true],
  ['sprout', 1, ['grove'], true],
  ['blueSlime', 1, ['fen'], true],
  ['crab', 1, ['fen'], true],
  ['mushling', 1, ['hollow'], true],
  ['beetle', 1, ['ridge'], true],
]);

const save = loadSave();
const player = new Player(scene, world, lib.player, lib.shadow, fx);
player.setPos(save?.x ?? world.spawn.x, save?.z ?? world.spawn.z);
const prog = new Progress();
prog.load(save?.prog);
const quests = new Quests();
quests.load(save?.quests);
const villagers = new Villagers(scene, world, lib);
player.tiles = new Tiles(world); // after the villagers: they block their tiles
const inv = new Inventory();
inv.level = () => prog.baseLv;
inv.load(save?.inv);
// stats + gear -> the player's battle numbers (Ragnarok rules); HP/SP stay put, capped by the new max
function applyStats() {
  const ps = derive(prog, inv.gearStats());
  player.ps = ps;
  player.maxHp = ps.maxHp;
  player.maxSp = ps.maxSp;
  player.hp = Math.min(player.hp, ps.maxHp);
  player.sp = Math.min(player.sp, ps.maxSp);
  player.speedMul = inv.wearing('speed') ? 1.2 : 1;
  player.blockChance = inv.wearing('block') ? 0.2 : 0;
}
applyStats();
player.hp = typeof save?.hp === 'number' && save.prog?.v === 2 ? clamp(save.hp, 1, player.maxHp) : player.maxHp;
player.sp = typeof save?.sp === 'number' ? clamp(save.sp, 0, player.maxSp) : player.maxSp;
inv.onChange(applyStats);

const input = new Input();
const ui = new UI(world);
ui.mobs = mobs;
ui.prog = prog;

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3(), shake: 0 };
cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);

const audio = new Audio();

// ---------- combat wiring ----------
// damage numbers float up from whoever was hit, Ragnarok style
const overHead = (o, h) => world.heightAt(o.x, o.z) + h;
player.on('swing', () => audio.play('swing'));
player.on('strike', (m, res) => {
  const y = overHead(m, m.sprite.scale.y * 0.8);
  if (res.miss) fx.number(m.x, y, m.z, 'Miss', 'miss');
  else { fx.number(m.x, y, m.z, res.dmg, res.crit ? 'crit' : 'dealt'); audio.play('hit'); }
});
player.on('hurt', (n) => {
  ui.hurt(); cam.shake = 0.2; audio.play('hurt');
  fx.number(player.x, overHead(player, 1.3), player.z, n, 'taken');
});
mobs.on('miss', (m, res) => fx.number(player.x, overHead(player, 1.3), player.z, res.dodge ? 'Lucky!' : 'Miss', 'miss'));
player.on('block', () => {
  audio.play('block');
  fx.sparkle(player.x, world.heightAt(player.x, player.z) + 0.8, player.z, '#e8eef5', 5);
  fx.number(player.x, overHead(player, 1.3), player.z, 'Block', 'miss');
});
player.on('faint', () => {
  audio.play('faint');
  const lost = prog.deathPenalty();
  ui.faint(true, lost.base || lost.job ? `Returning to camp · lost ${lost.base} Base EXP, ${lost.job} Job EXP` : 'Returning to camp');
  setTimeout(() => {
    player.revive(world.spawn.x, world.spawn.z);
    cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
    ui.faint(false);
  }, 2200);
});
mobs.on('death', (m, drops) => {
  audio.play('kill');
  gainExp(...m.def.exp);
  for (const id of quests.onKill(m.type)) questComplete(id);
  for (const [item, count] of drops) fx.drop(m.x, m.z, item, count, iconTexture(item));
});

mobs.on('spore', (m) => {
  audio.play('spore');
  const y = world.heightAt(m.x, m.z) + 0.4;
  fx.cloud(m.x, y, m.z);
  if (Math.hypot(player.x - m.x, player.z - m.z) < 2.6) {
    if (player.slowT <= 0) menus.message('Spores! You feel sluggish');
    player.slowT = 2.2;
  }
});

// ---------- experience: Base and Job EXP, like Ragnarok ----------
function gainExp(base, job) {
  const k = inv.wearing('exp') ? 1.25 : 1;
  const ups = prog.gain(Math.round(base * k), Math.round(job * k));
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
    menus.message(`Job Level ${prog.jobLv}!`);
  }
  if (menus.open) menus.render();
  persist();
}

// ---------- quests ----------
const questGiver = (id) => Object.keys(NPCS).find((n) => NPCS[n].quests.includes(id));
function questComplete(id) {
  audio.play('heart');
  menus.message(`${QUESTS[id].title} complete! Return to ${NPCS[questGiver(id)].name}.`);
  refreshQuests();
}
function giveReward(r) {
  for (const [id, n] of Object.entries(r.items || {})) {
    const got = inv.add(id, n);
    if (got < n) inv.chest.add(id, n - got); // bag full: it goes to the chest
    menus.toast(id, n);
  }
  gainExp(r.xp, r.job ?? Math.round(r.xp * 0.7));
}
// '!' / '?' bubbles over villagers and the quest list under the clock
const tracker = document.getElementById('quests');
let trackerHTML = '';
function refreshQuests() {
  villagers.setMarks((npc) => {
    const st = quests.status(npc, prog.baseLv, inv).state;
    return st === 'offer' ? 'offer' : st === 'ready' ? 'ready' : null;
  });
  let h = '';
  for (const id of Object.keys(quests.active)) {
    const done = quests.ready(id, inv);
    h += `<div class="${done ? 'done' : ''}"><b>${QUESTS[id].title}</b><span>${done ? `Return to ${NPCS[questGiver(id)].name}` : quests.progress(id, inv)}</span></div>`;
  }
  if (h !== trackerHTML) { trackerHTML = h; tracker.innerHTML = h; }
}

let bagFullNote = 0;
function collect(p) {
  const got = inv.add(p.item, p.count);
  if (got) { menus.toast(p.item, got); audio.play('pickup'); }
  if (got < p.count) {
    p.count -= got;
    if (performance.now() - bagFullNote > 4000) { bagFullNote = performance.now(); menus.message('Bag is full. Store items in the camp chest.'); }
    return false;
  }
  return true;
}

// ---------- menus + camp interactions ----------
const menus = new Menus(inv, prog, player, {
  usePotion() {
    if (player.hp >= player.maxHp) { menus.message('Your HP is already full'); return; }
    if (inv.bag.remove('potion', 1)) {
      const n = player.heal(45 + Math.floor(Math.random() * 21)); // like a Red Potion: 45-65 HP
      fx.number(player.x, overHead(player, 1.3), player.z, n, 'heal');
      inv.changed();
    }
  },
  crafted() { audio.play('craft'); persist(); },
  equipped() { audio.play('ui'); persist(); },
  raised() { applyStats(); audio.play('craft'); persist(); },
  accept(id) {
    quests.accept(id);
    for (const done of quests.onZone(world.zoneAt(player.x, player.z))) questComplete(done);
    audio.play('ui');
    menus.message(`New quest: ${QUESTS[id].title}`);
    menus.close('talk');
    refreshQuests();
  },
  handIn(id) {
    const r = quests.turnIn(id, inv);
    if (!r) return;
    audio.play('craft');
    giveReward(r);
    refreshQuests();
    menus.render();
    persist();
  },
  ui() { audio.play('ui'); },
  soundOn: () => audio.enabled,
  toggleSound() { audio.setEnabled(!audio.enabled); },
  closed() { persist(); },
});
menus.quests = quests;
const portraits = {};
menus.portrait = (id) => (portraits[id] ||= (id === 'player' ? lib.player : lib.villagers[id]).anims.down.idle[0].image.toDataURL());
// things at camp you tap to use: the player walks over, then it opens. h = height on screen
const SPOTS = [
  { ...world.camp.fire, h: 0.9, run: () => menus.show('craft') },
  { ...world.camp.chest, h: 0.8, run: () => menus.show('chest') },
  { ...world.camp.tent, h: 2.2, run: () => rest() },
  ...villagers.list.map((v) => ({ x: v.x, z: v.z, h: v.top, run: () => menus.talkTo(v.id) })),
];

// ---------- hotbar: skills and items ----------
const hotbar = new Hotbar(document.getElementById('hotbar'), inv, {
  use(s) {
    if (s.kind === 'skill' && s.id === 'dodge') wantDodge = true;
    if (s.kind === 'item' && s.id === 'potion') menus.hooks.usePotion();
  },
  cooldown: (s) => (s.kind === 'skill' && s.id === 'dodge' ? Math.max(0, player.rollCd / 0.75) : 0),
  changed() { if (menus.open) menus.render(); persist(); },
});
hotbar.load(save?.hotbar);
menus.hotbar = hotbar;
let wantDodge = false;

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
  const consider = (hit, x, y, h, z, bias = 1) => {
    for (const f of [0.15, 0.55]) {
      const d = screenDist(cx, cy, x, y + h * f, z) * bias;
      if (d < bd) { bd = d; best = hit; }
    }
  };
  for (const m of mobs.list) if (m.alive) consider({ mob: m }, m.x, m.sprite.position.y, m.sprite.scale.y * 0.8, m.z, 0.8);
  for (const p of fx.pickups) consider({ item: p }, p.x, p.s.position.y, 0.5, p.z);
  for (const sp of SPOTS) consider({ spot: sp }, sp.x, world.heightAt(sp.x, sp.z), sp.h, sp.z);
  return best;
}
function tap(cx, cy) {
  if (player.state === 'down') return;
  const hit = pick(cx, cy);
  if (hit?.mob) player.command({ mob: hit.mob });
  else if (hit?.item) {
    const p = hit.item;
    player.command({ x: p.x, z: p.z, reach: 0.7, arrive: () => { if (fx.pickups.includes(p) && collect(p)) fx.take(p); } });
  } else if (hit?.spot) {
    const sp = hit.spot;
    player.command({ x: sp.x, z: sp.z, reach: 1.7, arrive: sp.run });
  } else {
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const at = ray.intersectObject(world.terrain)[0]?.point;
    if (!at) return;
    const [i, j] = player.tiles.nearestFree(...player.tiles.tileAt(at.x, at.z)) || [];
    if (i === undefined) return;
    fx.tileMark(i, j);
    player.command({ x: i + 0.5, z: j + 0.5, reach: 0.05 });
  }
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

// natural recovery, Ragnarok style: HP every 6 s, SP every 8 s, twice as often resting at camp
// (like sitting) or, for HP, with the Sprout Charm
let hpT = 0, spT = 0;
function naturalRegen(dt) {
  if (player.state === 'down') return;
  const atCamp = Math.hypot(player.x - 32, player.z - 32) < 5.5;
  const fast = atCamp ? 2 : 1;
  hpT += dt * fast * (inv.wearing('regen') ? 2 : 1);
  spT += dt * fast;
  if (hpT >= 6) { hpT -= 6; player.heal(player.ps.hpRegen); }
  if (spT >= 8) { spT -= 8; player.healSp(player.ps.spRegen); }
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
  writeSave({ x: player.x, z: player.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, sp: player.sp, inv: inv.toJSON(), prog: prog.toJSON(), quests: quests.toJSON(), hotbar: hotbar.toJSON(), time: dayNight.t });
}

const clock = new THREE.Clock();
let started = false;
let stepT = 0;
const tmpV = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const c = input.consumeCamera(dt);
  cam.yaw += c.yaw;
  cam.dist = clamp(cam.dist + c.zoom, 7, 20);

  const b = camBasis();
  // windows never pause the game, like Ragnarok
  for (const w of ['items', 'equip', 'skills', 'status']) if (input.tapped(w) && started) menus.toggle(w);
  if (input.tapped('close')) menus.close();
  const live = started;
  const clicks = input.takeClicks();
  if (live) for (const c of clicks) tap(c.x, c.y);
  const ctl = { dodge: live && (input.tapped('dodge') || wantDodge) };
  wantDodge = false;
  if (!live) input.tapped('dodge');

  const wasRoll = player.state === 'roll';
  player.update(live ? dt : 0, b, ctl, mobs);
  if (!wasRoll && player.state === 'roll') audio.play('dodge');
  if (live && player.moving && player.state === 'normal') {
    stepT -= dt;
    if (stepT <= 0) { stepT = 0.33 / player.speedMul; audio.play('step'); }
  }
  audio.update(dt, dayNight.night);
  if (!started) cam.yaw += dt * 0.05; // slow orbit behind the title screen
  mobs.cam = b;
  if (live) mobs.update(dt, player);
  if (live) dayNight.update(dt, t); else if (!started) dayNight.update(0, t);
  world.update(dt, t);
  villagers.update(dt, player, b);
  if (live) fx.update(dt);
  if (live) naturalRegen(dt);
  hotbar.update();
  world.updateOcclusion(player.x, player.z, b);

  const py = world.heightAt(player.x, player.z);
  cam.target.lerp(tmpV.set(player.x, py, player.z), 1 - Math.exp(-8 * dt));
  const pitch = lerp(0.72, 0.98, (cam.dist - 7) / 13);
  const horiz = Math.cos(pitch) * cam.dist;
  cam.shake = Math.max(0, cam.shake - dt);
  const sh = cam.shake * 0.5;
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
    cam.target.y + 0.7 + Math.sin(pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * horiz + (Math.random() - 0.5) * sh,
  );
  camera.lookAt(cam.target.x, cam.target.y + 0.7, cam.target.z);

  ui.update(dt, player, cam.yaw);
  if (live && ui.zone !== questZone) {
    questZone = ui.zone;
    for (const id of quests.onZone(questZone)) questComplete(id);
  }
  questT -= dt;
  if (questT <= 0) { questT = 0.5; refreshQuests(); }

  saveT += dt;
  if (saveT > 3) { saveT = 0; persist(); }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

const title = document.getElementById('title');
const tContinue = document.getElementById('t-continue');
const tNew = document.getElementById('t-new');
const tSound = document.getElementById('t-sound');
if (save) { tContinue.textContent = 'Continue'; tNew.hidden = false; }
const soundLabel = () => { tSound.textContent = `Sound: ${audio.enabled ? 'On' : 'Off'}`; };
soundLabel();
tSound.addEventListener('click', () => { audio.start(); audio.setEnabled(!audio.enabled); soundLabel(); audio.play('ui'); });
let confirmNew = false;
tNew.addEventListener('click', () => {
  if (!confirmNew) {
    confirmNew = true;
    tNew.textContent = 'Tap again to start over';
    tNew.classList.add('warn');
    setTimeout(() => { confirmNew = false; tNew.textContent = 'New Game'; tNew.classList.remove('warn'); }, 3000);
    return;
  }
  resetting = true;
  clearSave();
  location.reload();
});
tContinue.addEventListener('click', () => {
  audio.start();
  audio.play('ui');
  title.classList.add('hide');
  document.getElementById('hud').classList.remove('pre');
  started = true;
  input.enabled = true;
  cam.yaw = save?.yaw ?? 0;
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* not supported */ }
  setTimeout(() => {
    title.remove();
    ui.showZone(world.zoneAt(player.x, player.z));
    const hint = document.getElementById('hint');
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 6000);
  }, 450);
});

window.__aria = { player, world, cam, camera, mobs, fx, inv, prog, quests, villagers, menus, hotbar, dayNight, audio, stats: world.stats };
