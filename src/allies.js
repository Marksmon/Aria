// The Beastmaster's companions: a Bear, a pair of Wolves and a Hawk that follow the hero, take the
// hero's target (or the nearest monster coming for the hero) and fight it. Their numbers come from
// the hero's (main.js beastStats): the Bear from END, the Wolves from FNS, the Hawk from QKN.
// Monsters fight back: one a beast hits may turn on it, and the Bear taunts the monsters round it.
// The monster AI aims at one foe (mobs.js Mob.update(dt, foe)); a beast offers it what it uses:
// x, z, state, ps (for the hit rolls), canBeHit() and takeDamage(). Beasts don't block tiles, follow
// the hero through portals, and are gone when the hero faints. Sprites are painted in code
// (beasts.js: allyBear, allyWolfB, allyWolfG, hawk), each over a soft glow of its colour.
import * as THREE from 'three';
import { playerAttack } from './rules.js';
import { dirFor } from './noise.js';

// art, size (w: body width in world units, r: radius), speed (tiles a second: a little quicker than
// the hero, to keep up), reach (paces from the monster's edge), glow colour
export const BEAST_KINDS = {
  bear: { name: 'Bear', art: ['allyBear'], w: 1.15, r: 0.5, speed: 4, reach: 0.9, aura: '#ffc04a' },
  wolf: { name: 'Wolf', art: ['allyWolfB', 'allyWolfG'], w: 0.68, r: 0.32, speed: 4.6, reach: 0.8, aura: '#b8c8e8' },
  hawk: { name: 'Hawk', art: ['hawk'], w: 0.62, r: 0.3, speed: 5.2, reach: 2.2, fly: true, aura: '#ffe08a' },
};
const ATTACK_ANIM = 0.45;
const STRIDE = 2.2;
// where each waits by the hero, in the hero's frame (x: to the right, z: behind)
const SLOTS = { bear: [-1.2, 1.1], wolf0: [1.2, 0.9], wolf1: [1.6, -0.2], hawk: [0.2, 1.6] };

let glowTex = null;
function glow() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(0.5, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (glowTex = new THREE.CanvasTexture(c));
}

class Beast {
  constructor(mgr, kind, i, ps) {
    this.mgr = mgr;
    this.kind = kind;
    this.slot = kind === 'wolf' ? `wolf${i}` : kind;
    this.K = BEAST_KINDS[kind];
    this.art = mgr.lib.mobs[this.K.art[i % this.K.art.length]];
    this.mat = new THREE.SpriteMaterial({ map: this.art.anims.down.idle[0], alphaTest: 0.5 });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.center.set(0.5, this.art.anchor);
    this.sprite.renderOrder = 2;
    const upp = this.K.w / this.art.body[0];
    this.sprite.scale.set(this.art.fw * upp, this.art.fh * upp, 1);
    this.shadow = new THREE.Mesh(mgr.shadowGeo, mgr.shadowMat);
    this.shadow.scale.setScalar(this.K.w * 0.9);
    this.disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
      map: glow(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(this.K.aura), polygonOffset: true, polygonOffsetFactor: -3,
    }));
    this.disc.renderOrder = 1.5;
    mgr.scene.add(this.sprite, this.shadow, this.disc);
    this.ps = ps;
    this.hp = this.maxHp = ps.maxHp;
    this.alive = true;
    this.state = 'normal';
    this.x = 0; this.z = 0;
    this.heading = { x: 0, z: 1 };
    this.atkCd = 0.6 + Math.random() * 0.4;
    this.atkAnim = 0;
    this.walked = 0;
    this.t = Math.random() * 10;
    this.flash = 0;
    this.foe = null;
    this.tauntCd = 1;
  }
  canBeHit() { return this.alive && (!this.K.fly || Math.random() < 0.3); } // most blows pass under a flying hawk
  takeDamage(dmg, fx, fz) {
    if (!this.alive) return;
    dmg = Math.max(1, Math.round(dmg * (1 - (this.ps.guard || 0))));
    this.hp -= dmg;
    this.flash = 0.09;
    this.mgr.emit('hurt', this, dmg);
    if (this.hp <= 0) this.mgr.fall(this);
  }
  place(x, z) { this.x = x; this.z = z; }
  remove() { this.mgr.scene.remove(this.sprite, this.shadow, this.disc); this.mat.dispose(); this.disc.material.dispose(); this.disc.geometry.dispose(); }

  moveToward(tx, tz, speed, dt) {
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const s = Math.min(d, speed * dt), w = this.mgr.world;
    this.heading = { x: dx / d, z: dz / d };
    let nx = this.x + (dx / d) * s, nz = this.z + (dz / d) * s;
    if (!this.K.fly) {
      [nx, nz] = w.resolve(nx, nz, this.K.r);
      if (!w.walkable(nx, nz)) return 0;
    }
    const moved = Math.hypot(nx - this.x, nz - this.z);
    this.x = nx; this.z = nz;
    return moved;
  }

  update(dt, hero, mobs, target) {
    const K = this.K, ps = this.ps;
    this.t += dt; this.atkCd -= dt; this.atkAnim -= dt; this.flash -= dt; this.tauntCd -= dt;
    // the foe: the hero's target, else a monster coming for the hero, else whatever is fighting this beast
    if (!this.foe?.alive || Math.hypot(this.foe.x - hero.x, this.foe.z - hero.z) > 11) this.foe = null;
    const near = (m) => m?.alive && Math.hypot(m.x - hero.x, m.z - hero.z) < 10;
    if (near(target)) this.foe = target;
    else if (!this.foe) this.foe = mobs.list.find((m) => m.alive && (m.foe === this || (m.state === 'chase' && Math.hypot(m.x - hero.x, m.z - hero.z) < 6))) || null;
    const far = Math.hypot(hero.x - this.x, hero.z - this.z);
    if (far > 14) { const [sx, sz] = this.slotAt(hero); this.place(sx, sz); } // left behind: it catches up at once
    let moving = 0;
    const m = this.foe;
    if (m) {
      const dx = m.x - this.x, dz = m.z - this.z, d = Math.hypot(dx, dz), reach = K.reach + m.def.r + K.r;
      if (d > reach) moving = this.moveToward(m.x - (dx / d) * reach * 0.8, m.z - (dz / d) * reach * 0.8, K.speed, dt);
      else {
        this.heading = { x: dx / (d || 1), z: dz / (d || 1) };
        if (this.atkCd <= 0) {
          this.atkCd = ps.interval;
          this.atkAnim = ATTACK_ANIM;
          const res = playerAttack(ps, m.effDef(), this.mgr.mult(this, m));
          this.mgr.emit('strike', this, m, res);
          if (ps.double && Math.random() < ps.double && m.alive) this.mgr.emit('strike', this, m, playerAttack(ps, m.effDef(), this.mgr.mult(this, m))); // a second, quicker bite
        }
      }
      // the Bear's roar: every 6 s, the monsters round it turn on it
      if (this.kind === 'bear' && this.tauntCd <= 0) {
        this.tauntCd = 6;
        let n = 0;
        for (const o of mobs.list) if (o.alive && Math.hypot(o.x - this.x, o.z - this.z) < ps.taunt) { o.foe = this; o.provoke(); n++; }
        if (n) this.mgr.emit('taunt', this, n);
      }
    } else { // follow: its own place by the hero
      const [sx, sz] = this.slotAt(hero);
      if (Math.hypot(sx - this.x, sz - this.z) > 0.6) moving = this.moveToward(sx, sz, K.speed * (far > 4 ? 1.3 : 0.9), dt);
      else { const dx = hero.x - this.x, dz = hero.z - this.z, d = Math.hypot(dx, dz) || 1; this.heading = { x: hero.face.x || dx / d, z: hero.face.z || dz / d }; }
    }
    this.walked += moving;
    // ---- visuals ----
    const tex = this.frame(moving > 0);
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }
    const y = this.mgr.world.heightAt(this.x, this.z), lift = K.fly ? 1.15 + Math.sin(this.t * 3) * 0.12 - (this.atkAnim > 0 ? 0.5 : 0) : 0;
    this.sprite.position.set(this.x, y + lift, this.z);
    this.mat.color.setScalar(this.flash > 0 ? 2.2 : 1);
    this.shadow.position.set(this.x, y + 0.03, this.z);
    this.disc.position.set(this.x, y + 0.05, this.z);
    this.disc.scale.setScalar(K.w * (1.7 + Math.sin(this.t * 2.4) * 0.1));
    this.disc.material.opacity = 0.55 + Math.sin(this.t * 2.4) * 0.15;
  }
  slotAt(hero) {
    const [ox, oz] = SLOTS[this.slot], fx = hero.face.x, fz = hero.face.z; // right of the hero = (-fz, fx)
    return [hero.x - fz * ox - fx * oz, hero.z + fx * ox - fz * oz];
  }
  frame(moving) {
    const dir = dirFor(this.heading.x, this.heading.z, this.mgr.cam), A = this.art.anims[dir];
    let list = A.idle, k = 0;
    if (this.atkAnim > 0 && A.attack) { list = A.attack; k = 1 - this.atkAnim / ATTACK_ANIM; }
    else if (this.K.fly && A.walk) { list = A.walk; k = (this.t * 2.2) % 1; } // the hawk flaps all the time
    else if (moving && A.walk) { list = A.walk; k = (this.walked / (STRIDE * this.K.w)) % 1; }
    return list[Math.max(0, Math.min(list.length - 1, Math.floor(k * list.length)))];
  }
}

export class Allies {
  constructor(scene, world, lib, shadowGeo, shadowMat) {
    Object.assign(this, { scene, world, lib, shadowGeo, shadowMat });
    this.list = [];
    this.handlers = {};
    this.cam = { fx: 0, fz: -1, rx: 1, rz: 0 };
    this.mult = () => 1; // (beast, monster) -> damage rate (Pack Frenzy, Pack Tactics), set by the game
  }
  on(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, ...a) { for (const fn of this.handlers[name] || []) fn(...a); }
  of(kind) { return this.list.filter((b) => b.kind === kind); }
  // call a kind of beast to the hero's side (n of them), with its numbers; a beast of that kind already
  // out is called back fresh
  summon(kind, n, ps, hero) {
    for (const b of this.of(kind)) this.drop(b);
    for (let i = 0; i < n; i++) {
      const b = new Beast(this, kind, i, ps);
      const [x, z] = b.slotAt(hero);
      b.place(this.world.walkable(x, z) || b.K.fly ? x : hero.x, this.world.walkable(x, z) || b.K.fly ? z : hero.z);
      this.list.push(b);
    }
  }
  // new numbers (the hero's stats moved): HP keeps its share of the new maximum
  restat(kind, ps) {
    for (const b of this.of(kind)) { const k = b.hp / b.maxHp; b.ps = ps; b.maxHp = ps.maxHp; b.hp = Math.max(1, Math.round(ps.maxHp * k)); }
  }
  drop(b) { b.alive = false; b.remove(); this.list = this.list.filter((o) => o !== b); }
  fall(b) { this.emit('fall', b); this.drop(b); }
  clear() { for (const b of [...this.list]) this.drop(b); }
  // a new map: the beasts come along, at their places by the hero
  carry(hero) { for (const b of this.list) { const [x, z] = b.slotAt(hero); b.place(this.world.walkable(x, z) || b.K.fly ? x : hero.x, this.world.walkable(x, z) || b.K.fly ? z : hero.z); b.foe = null; } }
  update(dt, hero, mobs, target) { for (const b of [...this.list]) if (b.alive) b.update(dt, hero, mobs, target); }
}
