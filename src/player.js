import * as THREE from 'three';
import { dirFor } from './noise.js';

const BASE_SPEED = 4.2;  // world units per second
const RADIUS = 0.3;      // collision radius
const HEIGHT = 1.38;     // standing height in world units
const WALK_FPS = 11;
const ROLL_TIME = 0.4, ROLL_SPEED = 8.4, ROLL_CD = 0.75; // 3.4 units, fast then easing out
const ATTACK_RANGE = 1.65, ATTACK_COS = 0.34; // ~70 degrees either side
const AIM_RANGE = 2.8;

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

    // stats (hp is in half-hearts)
    this.maxHp = 10;
    this.hp = 10;
    this.damage = 1;
    this.attackSpeed = 1.5; // swings per second
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
    this.events = { swing: [], hurt: [], faint: [], hit: [], block: [] };

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

  takeDamage(amount, fromX, fromZ) {
    if (this.state === 'down' || this.iframes > 0) return false;
    if (Math.random() < this.blockChance) {
      this.iframes = 0.5;
      this.emit('block');
      return true;
    }
    this.hp = Math.max(0, this.hp - amount);
    this.iframes = 0.9;
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    this.knock.x = (dx / d) * 7;
    this.knock.z = (dz / d) * 7;
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

  revive(x, z) {
    this.state = 'normal';
    this.hp = this.maxHp;
    this.iframes = 1.5;
    this.knock.x = this.knock.z = 0;
    this.mat.rotation = 0;
    this.setPos(x, z);
  }

  // move: world-space direction (0..1). cam: camera basis. ctl: {attack, dodge}. mobs: MobManager
  update(dt, move, cam, ctl, mobs) {
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

    const mag = Math.hypot(move.x, move.z);
    if (ctl.dodge && this.state === 'normal' && this.rollCd <= 0) {
      this.state = 'roll';
      this.rollT = ROLL_TIME;
      this.rollCd = ROLL_CD;
      this.iframes = Math.max(this.iframes, ROLL_TIME + 0.08);
      this.rollDir = mag > 0.1 ? { x: move.x / mag, z: move.z / mag } : { ...this.face };
      this.face = { ...this.rollDir };
    }

    if (this.state === 'roll') {
      this.rollT -= dt;
      const sp = ROLL_SPEED * (1.35 - 0.7 * (1 - this.rollT / ROLL_TIME));
      this.tryMove(this.rollDir.x * sp * dt, this.rollDir.z * sp * dt);
      this.moving = true;
      if (this.rollT <= 0) this.state = 'normal';
    } else {
      this.moving = mag > 0.08;
      const attacking = this.atkAnim > 0;
      const winding = this.atkAnim > this.atkDur - 0.18; // only the start of a swing slows you
      if (this.moving) {
        const speed = BASE_SPEED * this.speedMul * (winding ? 0.55 : 1) * (this.slowT > 0 ? 0.5 : 1);
        this.tryMove(move.x * speed * dt, move.z * speed * dt);
        if (!attacking) this.face = { x: move.x / mag, z: move.z / mag };
        this.animT += dt * WALK_FPS * Math.min(1, mag + 0.3) * this.speedMul;
      } else {
        this.animT = 0;
      }

      if (ctl.attack && this.atkTimer <= 0) this.swing(cam, mobs);
    }

    // sprite direction follows facing relative to the camera
    this.dir = dirFor(this.face.x, this.face.z, cam);

    const A = this.art.anims[this.dir];
    let tex = A.idle[0];
    if (this.state === 'roll') {
      const k = 1 - this.rollT / ROLL_TIME;
      tex = A.dodge[Math.min(A.dodge.length - 1, Math.floor(k * A.dodge.length))];
    } else if (this.atkAnim > 0) {
      const k = 1 - this.atkAnim / this.atkDur;
      tex = A.attack[Math.min(A.attack.length - 1, Math.floor(k * A.attack.length))];
    } else if (this.moving && this.state === 'normal') {
      // walk frame 0 is the standing pose; the loop is frames 1..n
      tex = A.walk[1 + (Math.floor(this.animT) % (A.walk.length - 1))];
    }
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }

    this.mat.color.set(this.slowT > 0 ? '#c8e6a0' : '#ffffff');
    if (this.tint) this.mat.color.multiply(this.tint);
    const breathe = this.moving ? 1 : 1 + Math.sin(performance.now() / 420) * 0.015;
    this.sprite.scale.y = this.size.h * breathe;
    this.sprite.visible = !(this.iframes > 0 && this.state === 'normal' && Math.floor(this.iframes * 14) % 2 === 0);
    this.sync();
  }

  swing(cam, mobs) {
    this.atkTimer = 1 / this.attackSpeed;
    this.atkAnim = this.atkDur = Math.min(0.42, this.atkTimer * 0.9);
    const target = mobs.nearest(this.x, this.z, AIM_RANGE);
    if (target) {
      const dx = target.x - this.x, dz = target.z - this.z, d = Math.hypot(dx, dz) || 1;
      this.face = { x: dx / d, z: dz / d };
    }
    const y = this.world.heightAt(this.x, this.z);
    this.fx.slash(this.x + this.face.x * 0.7, y + 0.55, this.z + this.face.z * 0.7, this.face, cam);
    const hits = mobs.hitArc(this.x, this.z, this.face, ATTACK_RANGE, ATTACK_COS, this.damage);
    this.emit('swing', hits);
    if (hits > 0) this.emit('hit', hits);
  }

  sync() {
    const y = this.world.heightAt(this.x, this.z);
    this.sprite.position.set(this.x, y, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
  }
}
