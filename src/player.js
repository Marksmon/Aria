import * as THREE from 'three';
import { dirFor, dirFor8 } from './noise.js';
import { playerAttack } from './rules.js';

const BASE_SPEED = 4.2;  // world units per second
const RADIUS = 0.3;      // collision radius
const HEIGHT = 1.38;     // standing height in world units
const STRIDE = 2.6;       // world units covered by one walk cycle, so feet keep pace with the ground
const ROLL_TIME = 0.4, ROLL_SPEED = 8.4, ROLL_CD = 0.75; // 3.4 units, fast then easing out
// dodge frames played as dive-and-recover: some directions end lying down (frame 6), so the
// roll goes into the dive and back out through the earlier frames instead
const DODGE_SEQ = [1, 2, 3, 4, 5, 3, 1];
const REACH_MOB = 1.35; // how close (beyond the monster's own radius) before swinging at it

export class Player {
  constructor(scene, world, art, shadowTex, fx) {
    this.world = world;
    this.art = art;
    this.fx = fx;
    this.x = 0;
    this.z = 0;
    this.face = { x: 0, z: 1 };
    this.dir = 'down';
    this.moving = false;
    this.animT = 0;

    // battle numbers from the Ragnarok rules (rules.js derive), set by the game
    this.ps = null;
    this.maxHp = 40;
    this.hp = 40;
    this.maxSp = 11;
    this.sp = 11;
    this.speedMul = 1;
    this.blockChance = 0;

    this.state = 'normal'; // normal | roll | down
    this.atkTimer = 0;
    this.atkAnim = 0;
    this.atkDur = 1;
    this.rollT = 0;
    this.rollCd = 0;
    this.rollDir = { x: 0, z: 1 };
    this.iframes = 0;
    this.slowT = 0;
    this.knock = { x: 0, z: 0 };
    this.events = { swing: [], hurt: [], faint: [], strike: [], block: [] };

    // Ragnarok-style orders: walk tile to tile along a path towards a goal
    // goal: { x, z, reach, arrive() } for a spot, or { mob } to fight it until it falls
    this.tiles = null;
    this.path = [];
    this.goal = null;
    this.repathT = 0;
    this.stuckT = 0;

    this.mat = new THREE.SpriteMaterial({ map: art.anims.down.idle[0], alphaTest: 0.5 });
    this.sprite = new THREE.Sprite(this.mat);
    const upp = HEIGHT / art.body[1]; // world units per pixel
    this.size = { w: art.fw * upp, h: art.fh * upp };
    this.sprite.scale.set(this.size.w, this.size.h, 1);
    this.sprite.center.set(0.5, art.anchor);
    this.sprite.renderOrder = 2;
    scene.add(this.sprite);

    const sg = new THREE.PlaneGeometry(0.9, 0.55);
    sg.rotateX(-Math.PI / 2);
    this.shadow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({
      map: shadowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    scene.add(this.shadow);
  }

  on(name, fn) { this.events[name].push(fn); }
  emit(name, ...a) { for (const fn of this.events[name]) fn(...a); }

  setPos(x, z) {
    if (!this.world.walkable(x, z)) { x = this.world.spawn.x; z = this.world.spawn.z; }
    this.x = x;
    this.z = z;
    this.sync();
  }

  tryMove(dx, dz) {
    const w = this.world;
    const ox = this.x, oz = this.z;
    const attempt = (tx, tz) => {
      const [rx, rz] = w.resolve(tx, tz, RADIUS);
      if (w.walkable(rx, rz)) { this.x = rx; this.z = rz; return true; }
      return false;
    };
    if (!attempt(this.x + dx, this.z + dz) && !attempt(this.x + dx, this.z)) attempt(this.x, this.z + dz);
    return Math.hypot(this.x - ox, this.z - oz);
  }

  // monsters may attack: not while down or mid-roll
  canBeHit() { return this.state !== 'down' && this.iframes <= 0; }

  takeDamage(amount, fromX, fromZ) {
    if (!this.canBeHit()) return false;
    if (Math.random() < this.blockChance) {
      this.emit('block');
      return true;
    }
    this.hp = Math.max(0, this.hp - amount);
    // a small flinch, like Ragnarok's hit stun
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    this.knock.x = (dx / d) * 2;
    this.knock.z = (dz / d) * 2;
    this.emit('hurt', amount);
    if (this.hp <= 0) {
      this.state = 'down';
      this.sprite.material.rotation = Math.PI / 2;
      this.emit('faint');
    }
    return true;
  }

  heal(n) {
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + n);
    return this.hp - before;
  }

  healSp(n) {
    const before = this.sp;
    this.sp = Math.min(this.maxSp, this.sp + n);
    return this.sp - before;
  }

  command(goal) {
    this.goal = goal;
    this.repath();
  }

  stop() {
    this.goal = null;
    this.path = [];
  }

  repath() {
    const g = this.goal;
    if (!g || !this.tiles) { this.path = []; return; }
    const tx = g.mob ? g.mob.x : g.x, tz = g.mob ? g.mob.z : g.z;
    this.path = this.tiles.path(this.x, this.z, tx, tz) || [];
    this.repathT = 0.35;
    this.stuckT = 0;
  }

  revive(x, z) {
    this.stop();
    this.state = 'normal';
    this.hp = this.maxHp;
    this.iframes = 1.5;
    this.knock.x = this.knock.z = 0;
    this.mat.rotation = 0;
    this.setPos(x, z);
  }

  // cam: camera basis. ctl: { dodge }. mobs: MobManager
  update(dt, cam, ctl, mobs) {
    this.atkTimer -= dt;
    this.atkAnim -= dt;
    this.rollCd -= dt;
    this.iframes -= dt;
    this.slowT -= dt;

    if (this.state === 'down') {
      this.sync();
      return;
    }

    // knockback
    if (Math.abs(this.knock.x) + Math.abs(this.knock.z) > 0.05) {
      this.tryMove(this.knock.x * dt, this.knock.z * dt);
      const k = Math.exp(-10 * dt);
      this.knock.x *= k;
      this.knock.z *= k;
    }

    if (ctl.dodge && this.state === 'normal' && this.rollCd <= 0) {
      this.state = 'roll';
      this.rollT = ROLL_TIME;
      this.rollCd = ROLL_CD;
      this.iframes = Math.max(this.iframes, ROLL_TIME + 0.08);
      this.rollDir = { ...this.face };
      const y = this.world.heightAt(this.x, this.z);
      this.fx.puff(this.x - this.rollDir.x * 0.2, y + 0.1, this.z - this.rollDir.z * 0.2, 0.55);
    }

    if (this.state === 'roll') {
      this.rollT -= dt;
      const sp = ROLL_SPEED * (1.35 - 0.7 * (1 - this.rollT / ROLL_TIME));
      this.tryMove(this.rollDir.x * sp * dt, this.rollDir.z * sp * dt);
      this.moving = true;
      if (this.rollT <= 0) { this.state = 'normal'; this.repath(); }
    } else this.follow(dt, cam, mobs);

    // sprite direction follows facing relative to the camera; 8 ways when the art has diagonals,
    // and a diagonal missing an animation borrows it from the nearest straight direction
    const eight = 'downright' in this.art.anims;
    this.dir = eight ? dirFor8(this.face.x, this.face.z, cam) : dirFor(this.face.x, this.face.z, cam);
    const D = this.art.anims[this.dir], S = this.art.anims[dirFor(this.face.x, this.face.z, cam)];
    const A = { idle: D.idle, walk: D.walk || S.walk, attack: D.attack || S.attack, dodge: D.dodge || S.dodge };
    let tex = A.idle[0];
    if (this.state === 'roll') {
      const k = 1 - this.rollT / ROLL_TIME;
      tex = A.dodge[DODGE_SEQ[Math.min(DODGE_SEQ.length - 1, Math.floor(k * DODGE_SEQ.length))]];
    } else if (this.atkAnim > 0) {
      const k = 1 - this.atkAnim / this.atkDur;
      tex = A.attack[Math.min(A.attack.length - 1, Math.floor(k * A.attack.length))];
    } else if (this.moving && this.state === 'normal') {
      tex = A.walk[Math.floor(this.animT * A.walk.length) % A.walk.length]; // every frame is part of the cycle
    }
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }

    this.mat.color.set(this.slowT > 0 ? '#c8e6a0' : '#ffffff');
    if (this.tint) this.mat.color.multiply(this.tint);
    const breathe = this.moving ? 1 : 1 + Math.sin(performance.now() / 420) * 0.015;
    this.sprite.scale.y = this.size.h * breathe;
    this.sprite.visible = !(this.iframes > 0 && this.state === 'normal' && Math.floor(this.iframes * 14) % 2 === 0);
    this.sync();
  }

  // carry out the current order: walk the path, swing at a target in reach, or arrive somewhere
  follow(dt, cam, mobs) {
    const g = this.goal;
    if (g?.mob) {
      const m = g.mob;
      if (!m.alive) this.stop();
      else if (Math.hypot(m.x - this.x, m.z - this.z) - m.def.r <= REACH_MOB) {
        this.path = [];
        const dx = m.x - this.x, dz = m.z - this.z, d = Math.hypot(dx, dz) || 1;
        if (this.atkAnim <= 0) this.face = { x: dx / d, z: dz / d };
        if (this.atkTimer <= 0) this.swing(cam, mobs);
      } else if ((this.repathT -= dt) <= 0 || !this.path.length) this.repath(); // it moves: keep chasing
    } else if (g && Math.hypot(g.x - this.x, g.z - this.z) <= g.reach) {
      this.stop();
      g.arrive?.();
    }

    this.moving = false;
    const next = this.path[0];
    if (!next) { this.animT = 0; return; }
    const winding = this.atkAnim > this.atkDur - 0.18; // only the start of a swing slows you
    const speed = BASE_SPEED * this.speedMul * (winding ? 0.55 : 1) * (this.slowT > 0 ? 0.5 : 1);
    const dx = next.x - this.x, dz = next.z - this.z, d = Math.hypot(dx, dz), step = speed * dt;
    const moved = d <= step ? this.tryMove(dx, dz) : this.tryMove((dx / d) * step, (dz / d) * step);
    if (d <= step || Math.hypot(next.x - this.x, next.z - this.z) < 0.02) this.path.shift();
    if (d > 0.01 && this.atkAnim <= 0) this.face = { x: dx / d, z: dz / d };
    this.moving = moved > 0.001;
    this.animT += moved / STRIDE; // in walk cycles
    // pushed off the path (knockback, a monster in the way): find a new one, or give up
    this.stuckT = moved < step * 0.3 ? this.stuckT + dt : 0;
    if (this.stuckT > 0.5) { if (g) this.repath(); else this.path = []; }
  }

  // one normal attack on the target, timed by ASPD; hit, crit and damage roll by the rules
  swing(cam, mobs) {
    const target = this.goal?.mob;
    if (!target?.alive) return;
    this.atkTimer = this.ps.interval;
    this.atkAnim = this.atkDur = Math.min(0.42, this.atkTimer * 0.9);
    const dx = target.x - this.x, dz = target.z - this.z, d = Math.hypot(dx, dz) || 1;
    this.face = { x: dx / d, z: dz / d };
    const y = this.world.heightAt(this.x, this.z);
    this.fx.slash(this.x + this.face.x * 0.7, y + 0.55, this.z + this.face.z * 0.7, this.face, cam);
    const res = playerAttack(this.ps, target.def);
    if (!res.miss) target.hit(res.dmg, dx / d, dz / d);
    this.emit('swing');
    this.emit('strike', target, res);
  }

  sync() {
    const y = this.world.heightAt(this.x, this.z);
    this.sprite.position.set(this.x, y, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
  }
}
