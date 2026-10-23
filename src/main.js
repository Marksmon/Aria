import * as THREE from 'three';
import './style.css';
import { createSprites } from './sprites.js';
import { buildWorld } from './world.js';
import { Player } from './player.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { loadSave, writeSave } from './save.js';
import { clamp, lerp } from './noise.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

const scene = new THREE.Scene();
const SKY = new THREE.Color('#a3c9d8');
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 24, 50);

const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 120);
scene.add(new THREE.HemisphereLight('#fff6e2', '#6b5a40', 1.9));
const sun = new THREE.DirectionalLight('#fff0d0', 1.6);
sun.position.set(-20, 30, -12);
scene.add(sun);

const lib = createSprites();
const world = buildWorld(scene, lib);
const save = loadSave();
const player = new Player(scene, world, lib.player, lib.shadow);
player.setPos(save?.x ?? world.spawn.x, save?.z ?? world.spawn.z);

const input = new Input(document.getElementById('joy'), document.getElementById('joy-knob'));
const ui = new UI(world);

const cam = { yaw: save?.yaw ?? 0, dist: save?.dist ?? 12, target: new THREE.Vector3() };
cam.target.set(player.x, world.heightAt(player.x, player.z), player.z);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // portrait screens need a wider vertical FOV to see the same area
  camera.fov = w < h ? 55 : 40;
  camera.updateProjectionMatrix();
  input.resetJoy();
}
window.addEventListener('resize', resize);
resize();

function camBasis() {
  // forward = direction the camera looks, flattened to the ground
  return { fx: -Math.sin(cam.yaw), fz: -Math.cos(cam.yaw), rx: Math.cos(cam.yaw), rz: -Math.sin(cam.yaw) };
}

let saveT = 0;
function persist() {
  writeSave({ x: player.x, z: player.z, yaw: cam.yaw, dist: cam.dist });
}

const clock = new THREE.Clock();
let started = false;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const c = input.consumeCamera(dt);
  cam.yaw += c.yaw;
  cam.dist = clamp(cam.dist + c.zoom, 7, 20);

  const b = camBasis();
  const m = started ? input.getMove() : { x: 0, y: 0 };
  // joystick up (screen -y) = camera forward
  const move = { x: b.rx * m.x - b.fx * m.y, z: b.rz * m.x - b.fz * m.y };
  player.update(dt, move, b);
  world.update(dt, t);

  const py = world.heightAt(player.x, player.z);
  cam.target.lerp(new THREE.Vector3(player.x, py, player.z), 1 - Math.exp(-8 * dt));
  const pitch = lerp(0.72, 0.98, (cam.dist - 7) / 13);
  const horiz = Math.cos(pitch) * cam.dist;
  camera.position.set(
    cam.target.x + Math.sin(cam.yaw) * horiz,
    cam.target.y + 0.7 + Math.sin(pitch) * cam.dist,
    cam.target.z + Math.cos(cam.yaw) * horiz,
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

// Title screen
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
    setTimeout(() => hint.classList.remove('show'), 5000);
  }, 450);
});

window.__aibachu = { player, world, cam, stats: world.stats };
