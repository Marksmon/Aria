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
import { Menus } from './menus.js';
import { iconTexture, iconURL, ITEMS } from './items.js';
import { DayNight } from './daynight.js';
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
const inv = new Inventory();
inv.load(save?.inv);
inv.applyTo(player);
if (save?.hp) player.hp = clamp(save.hp, 1, player.maxHp);
inv.onChange(() => inv.applyTo(player));

const input = new Input(document.getElementById('joy'), document.getElementById('joy-knob'));
const ui = new UI(world);
ui.mobs = mobs;

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3(), shake: 0 };
cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);

// ---------- combat wiring ----------
player.on('hurt', () => { ui.hurt(); cam.shake = 0.25; });
player.on('faint', () => {
  ui.faint(true);
  setTimeout(() => {
    player.revive(world.spawn.x, world.spawn.z);
    cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);
    ui.faint(false);
  }, 2200);
});
mobs.on('death', (m, drops) => {
  for (const [item, count] of drops) {
    if (item === 'heart') fx.drop(m.x, m.z, 'heart', 1, lib.fx.heart);
    else fx.drop(m.x, m.z, item, count, iconTexture(item));
  }
});

mobs.on('spore', (m) => {
  const y = world.heightAt(m.x, m.z) + 0.4;
  fx.cloud(m.x, y, m.z);
  if (Math.hypot(player.x - m.x, player.z - m.z) < 2.6) {
    if (player.slowT <= 0) menus.message('Spores! You feel sluggish');
    player.slowT = 2.2;
  }
});

let bagFullNote = 0;
function collect(p) {
  if (p.item === 'heart') {
    if (player.hp >= player.maxHp) return false; // leave it for later
    player.heal(2);
    return true;
  }
  const got = inv.add(p.item, p.count);
  if (got) menus.toast(p.item, got);
  if (got < p.count) {
    p.count -= got;
    if (performance.now() - bagFullNote > 4000) { bagFullNote = performance.now(); menus.message('Bag is full. Store items in the camp chest.'); }
    return false;
  }
  return true;
}

// ---------- menus + camp interactions ----------
const menus = new Menus(inv, {
  usePotion() {
    if (player.hp >= player.maxHp) { menus.message('Your hearts are already full'); return; }
    if (inv.bag.remove('potion', 1)) { player.heal(6); inv.changed(); menus.message('You feel better'); }
  },
  crafted() { persist(); },
  closed() { persist(); },
});
const actionBtn = document.getElementById('btn-action');
const ACTIONS = {
  fire: { label: 'Craft', icon: 'torch', run: () => menus.show('craft') },
  chest: { label: 'Chest', icon: 'shell', run: () => menus.show('chest') },
  tent: { label: 'Rest', icon: 'potion', run: () => rest() },
};
actionBtn.querySelector('img').src = iconURL('torch');
let nearAction = null;
function updateAction() {
  let best = null, bd = 2.1;
  if (player.state === 'normal') {
    for (const [k, p] of Object.entries(world.camp)) {
      const d = Math.hypot(player.x - p.x, player.z - p.z);
      if (d < bd) { bd = d; best = k; }
    }
  }
  if (best !== nearAction) {
    nearAction = best;
    actionBtn.hidden = !best;
    if (best) {
      actionBtn.querySelector('img').src = iconURL(ACTIONS[best].icon);
      actionBtn.querySelector('span').textContent = ACTIONS[best].label;
    }
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
  onPhase(night) { menus.message(night ? 'Night falls over Aibachu. Wisps are stirring.' : 'Morning has come.'); },
});
if (typeof save?.time === 'number') dayNight.t = save.time;

// resting at camp slowly restores hearts
let regenT = 0;
function campRegen(dt) {
  const atCamp = Math.hypot(player.x - 32, player.z - 32) < 5.5;
  if (!atCamp || player.state === 'down' || player.hp >= player.maxHp) { regenT = 0; return; }
  regenT += dt;
  if (regenT > 2.5) { regenT = 0; player.heal(1); }
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < h ? 55 : 40;
  camera.updateProjectionMatrix();
  input.resetJoy();
}
window.addEventListener('resize', resize);
resize();

function camBasis() {
  return { fx: -Math.sin(cam.yaw), fz: -Math.cos(cam.yaw), rx: Math.cos(cam.yaw), rz: -Math.sin(cam.yaw) };
}

let saveT = 0;
function persist() {
  writeSave({ x: player.x, z: player.z, yaw: cam.yaw, dist: cam.dist, hp: player.hp, inv: inv.toJSON(), time: dayNight.t });
}

const clock = new THREE.Clock();
let started = false;
const tmpV = new THREE.Vector3();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const c = input.consumeCamera(dt);
  cam.yaw += c.yaw;
  cam.dist = clamp(cam.dist + c.zoom, 7, 20);

  const b = camBasis();
  const m = started ? input.getMove() : { x: 0, y: 0 };
  const move = { x: b.rx * m.x - b.fx * m.y, z: b.rz * m.x - b.fz * m.y };
  const paused = menus.open;
  if (input.tapped('bag') && started) menus.toggle('bag');
  if (input.tapped('action') && nearAction && !paused) ACTIONS[nearAction].run();
  const live = started && !paused;
  const ctl = live ? { attack: input.held('attack'), dodge: input.tapped('dodge') } : { attack: false, dodge: false };
  input.tapped('attack');
  if (!live) input.tapped('dodge');

  player.update(live ? dt : 0, live ? move : { x: 0, z: 0 }, b, ctl, mobs);
  if (live) mobs.update(dt, player);
  if (live) dayNight.update(dt, t); else if (!started) dayNight.update(0, t);
  world.update(dt, t);
  if (live) fx.update(dt, player, collect);
  if (live) campRegen(dt);
  updateAction();
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

  saveT += dt;
  if (saveT > 3) { saveT = 0; persist(); }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });

const title = document.getElementById('title');
title.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  title.classList.add('hide');
  started = true;
  input.enabled = true;
  try { screen.orientation?.lock?.('landscape').catch(() => {}); } catch { /* not supported */ }
  setTimeout(() => {
    title.remove();
    ui.showZone(world.zoneAt(player.x, player.z));
    const hint = document.getElementById('hint');
    hint.classList.add('show');
    setTimeout(() => hint.classList.remove('show'), 6000);
  }, 450);
});

window.__aibachu = { player, world, cam, mobs, fx, inv, menus, dayNight, stats: world.stats };
