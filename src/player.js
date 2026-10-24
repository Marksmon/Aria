import * as THREE from 'three';
import { dirFor, dirFor8 } from './noise.js';
import { playerAttack } from './rules.js';
import { HeadLayer } from './headgear.js';
import { HEADS, headTexture } from './hair.js';

const BASE_SPEED = 4.2;  // world units per second
const RADIUS = 0.3;      // collision radius
const HEIGHT = 1.38;     // standing height in world units
const STRIDE = 2.6;       // world units covered by one walk cycle, so feet keep pace with the ground
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

    this.state = 'normal'; // normal | down (fainted) | sit | feign (Play Dead)
    this.endureT = 0;      // Stand Firm: no flinching
    this.guard = 0;        // share of damage shrugged off (Stand Firm, Last Stand)
    this.atkMul = 1;       // damage bonus from buffs (Magnum Break's fire, Auto Berserk), set by the game
    this.cast = null;      // a spell being cast: { t, total, target, run(target) }
    this.steady = false;   // hits don't break the casting (Rune Ward), set by the game
    this.atkTimer = 0;
    this.atkAnim = 0;
    this.atkDur = 1;
    this.iframes = 0;
    this.slowT = 0;
    this.knock = { x: 0, z: 0 };
    this.events = { swing: [], hurt: [], faint: [], strike: [], block: [], interrupt: [] };

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
    // Ragnarok-style layers over the headless job body: the bald head (the standard face), the
    // hairstyle, then headgear (hair.js, headgear.js). All of them follow the body frame's neck anchor.
    this.look = { hair: 'messy', dye: 'brown' };
    const layer = (order, mat = new THREE.SpriteMaterial({ alphaTest: 0.5 })) => {
      const s = new THREE.Sprite(mat);
      s.renderOrder = order;
      s.visible = false;
      scene.add(s);
      return s;
    };
    this.headSpr = layer(2.3);
    // a hat hides the hair above the line it sets (uCut: texture v; hair above it is dropped)
    this.hairCut = { uCut: { value: 2 } };
    const hairMat = new THREE.SpriteMaterial({ alphaTest: 0.5 });
    hairMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, this.hairCut);
      sh.fragmentShader = sh.fragmentShader
        .replace('void main() {', 'uniform float uCut;\nvoid main() {')
        .replace('#include <map_fragment>', '#include <map_fragment>\n        if (vMapUv.y > uCut) discard;');
    };
    this.hairSpr = layer(2.6, hairMat);
    this.headScale = 1;
    this.setHeadScale(art);
    // worn headgear: Upper (hats) and Middle (glasses, masks) sit on the head layer's own geometry
    this.heads = [new HeadLayer(scene), new HeadLayer(scene)];
  }

  setHeadgear(top, face) { this.heads[0].set(top); this.heads[1].set(face); }
  setLook(look) { this.look = { ...this.look, ...look }; }

  // body pixels per head pixel: a body made bald was fitted with the standard head when packed (the
  // size of its own head, a little bigger); an older body sizes it to the head it was drawn with
  setHeadScale(art) {
    const h = art.anims.down.idle[0].userData.head, d = HEADS?.dirs?.down;
    if (art.headScale) this.headScale = art.headScale;
    else if (h && d) this.headScale = (h.neck - h.crown) / (d.chin[1] - d.crown);
  }

  // a different sprite set (the Novice and the Swordsman look different)
  setArt(art) {
    if (!art || art === this.art) return;
    this.art = art;
    this.setHeadScale(art);
    const upp = HEIGHT / art.body[1];
    this.size = { w: art.fw * upp, h: art.fh * upp };
    this.sprite.scale.set(this.size.w, this.size.h, 1);
    this.mat.map = art.anims.down.idle[0];
    this.sprite.center.y = this.mat.map.userData.anchor;
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

  // monsters may attack: not while down (or Playing Dead), nor just after reviving
  canBeHit() { return this.state !== 'down' && this.state !== 'feign' && this.iframes <= 0; }

  takeDamage(amount, fromX, fromZ) {
    if (!this.canBeHit()) return false;
    if (Math.random() < this.blockChance) {
      this.emit('block');
      return true;
    }
    amount = Math.max(1, Math.round(amount * (1 - this.guard)));
    this.hp = Math.max(0, this.hp - amount);
    // a small flinch, like Ragnarok's hit stun
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    const k = this.endureT > 0 ? 0 : 2;
    this.knock.x = (dx / d) * k;
    this.knock.z = (dz / d) * k;
    if (this.state === 'sit') this.state = 'normal'; // a hit gets you up
    if (this.cast && !this.steady && this.endureT <= 0) { this.cast = null; this.emit('interrupt'); } // a hit breaks the spell
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
    this.standUp();
    this.cast = null; // a new order breaks off a spell
    this.goal = goal;
    this.repath();
  }

  stop() {
    this.goal = null;
    this.engaged = null;
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

  // stand and cast a spell: run(target) when the cast time is up. target may be null (around you)
  startCast(total, run, target = null, name = '') {
    this.stop();
    if (total <= 0) { this.release(run, target); return; }
    this.cast = { t: 0, total, target, run, name };
  }

  release(run, target) {
    this.atkAnim = this.atkDur = 0.4;
    if (target) {
      const dx = target.x - this.x, dz = target.z - this.z, d = Math.hypot(dx, dz) || 1;
      this.face = { x: dx / d, z: dz / d };
    }
    run(target);
  }

  // Sit and Play Dead: stay put until told to move
  sit(kind) {
    if (this.state !== 'normal') return false;
    this.stop();
    this.state = kind;
    this.mat.rotation = kind === 'feign' ? Math.PI / 2 : 0;
    return true;
  }

  standUp() {
    if (this.state !== 'sit' && this.state !== 'feign') return;
    this.state = 'normal';
    this.mat.rotation = 0;
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

  // cam: camera basis. mobs: MobManager
  update(dt, cam, mobs) {
    this.atkTimer -= dt;
    this.atkAnim -= dt;
    this.iframes -= dt;
    this.slowT -= dt;
    this.endureT -= dt;

    if (this.state === 'down') {
      this.sync();
      this.placeHead(); // lies down with the body
      for (const l of this.heads) l.sprite.visible = false;
      return;
    }

    // knockback
    if (Math.abs(this.knock.x) + Math.abs(this.knock.z) > 0.05) {
      this.tryMove(this.knock.x * dt, this.knock.z * dt);
      const k = Math.exp(-10 * dt);
      this.knock.x *= k;
      this.knock.z *= k;
    }

    if (this.cast) { // standing still, chanting
      const c = this.cast;
      c.t += dt;
      if (c.target && !c.target.alive) this.cast = null;
      else {
        if (c.target) { const dx = c.target.x - this.x, dz = c.target.z - this.z, d = Math.hypot(dx, dz) || 1; this.face = { x: dx / d, z: dz / d }; }
        if (c.t >= c.total) { this.cast = null; this.release(c.run, c.target); }
      }
    }
    if (this.state === 'normal' && !this.cast) this.follow(dt, cam, mobs);
    else if (this.cast) { this.moving = false; this.animT = 0; }
    else { this.moving = false; this.animT = 0; }

    // sprite direction follows facing relative to the camera; 8 ways when the art has diagonals,
    // and a diagonal missing an animation borrows it from the nearest straight direction
    const eight = 'downright' in this.art.anims;
    this.dir = eight ? dirFor8(this.face.x, this.face.z, cam, this.dir) : dirFor(this.face.x, this.face.z, cam);
    const D = this.art.anims[this.dir], S = this.art.anims[dirFor(this.face.x, this.face.z, cam)];
    const A = { idle: D.idle, walk: D.walk || S.walk, attack: D.attack || S.attack || D.idle };
    let tex = A.idle[0];
    if (this.atkAnim > 0) {
      const k = 1 - this.atkAnim / this.atkDur;
      tex = A.attack[Math.min(A.attack.length - 1, Math.floor(k * A.attack.length))];
    } else if (this.cast) {
      tex = A.attack[Math.min(1, A.attack.length - 1)]; // staff raised while chanting
    } else if (this.moving && this.state === 'normal') {
      tex = A.walk[Math.floor(this.animT * A.walk.length) % A.walk.length]; // every frame is part of the cycle
    }
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }
    this.tex = tex;

    this.mat.color.set(this.slowT > 0 ? '#c8e6a0' : '#ffffff');
    if (this.tint) this.mat.color.multiply(this.tint);
    const breathe = this.moving ? 1 : 1 + Math.sin(performance.now() / 420) * 0.015;
    this.sprite.scale.y = this.size.h * breathe * (this.state === 'sit' ? 0.8 : 1); // resting: settled down low
    this.sprite.visible = !(this.iframes > 0 && this.state === 'normal' && Math.floor(this.iframes * 14) % 2 === 0);
    this.sync();
    const upright = this.state !== 'down' && this.state !== 'feign';
    const geo = this.placeHead();
    for (const l of this.heads) l.update(this.sprite, this.tex, this.dir, this.art.fw, this.art.fh, upright, geo);
    // a hat hides the hair above the line it sets (a share of the head's crown → chin)
    const hide = Math.max(...this.heads.map((l) => l.hair())), hd = HEADS?.dirs?.[this.dir];
    this.hairCut.uCut.value = hide > 0 && hd ? 1 - (hd.crown + (hd.chin[1] - hd.crown) * hide) / HEADS.ch : 2;
  }

  // put the head and hair layers on this frame's neck anchor; returns the head's geometry in body
  // frame pixels for the headgear ({ x, crown, neck, w, eyes, sprite }), or null
  placeHead() {
    const h = this.tex.userData.head, hd = HEADS?.dirs?.[this.dir], body = this.sprite;
    const head = headTexture('bald', this.dir), hair = headTexture(this.look.hair, this.dir, this.look.dye);
    if (!h || !hd || !head) { this.headSpr.visible = this.hairSpr.visible = false; return null; }
    const { fw, fh } = this.art, { cw, ch } = HEADS, S = this.headScale, upp = body.scale.x / fw;
    const [ax, ay] = hd.chin;
    const HW = cw * S * upp, HH = ch * S * upp;
    const [cx, cy] = h.chin || [h.x + 0.5, h.neck]; // where the chin goes, in frame pixels
    const dx = (cx / fw - 0.5) * body.scale.x, dy = (1 - cy / fh - body.center.y) * body.scale.y;
    for (const [spr, tex] of [[this.headSpr, head], [this.hairSpr, hair]]) {
      if (!tex) { spr.visible = false; continue; }
      if (spr.material.map !== tex) { if (!spr.material.map) spr.material.needsUpdate = true; spr.material.map = tex; }
      spr.scale.set(HW, HH, 1);
      spr.center.set(ax / cw - dx / HW, (1 - ay / ch) - dy / HH);
      spr.position.copy(body.position);
      spr.material.color.copy(this.mat.color);
      spr.material.rotation = this.mat.rotation; // lying down (fainted, Play Dead) turns the head with the body
      spr.visible = body.visible;
    }
    const at = (x, y) => [cx + (x - ax) * S, cy + (y - ay) * S];
    const eyes = [];
    for (let i = 0; i < hd.eyes.length; i += 2) eyes.push(...at(hd.eyes[i], hd.eyes[i + 1]));
    return { x: cx, crown: cy - (ay - hd.crown) * S, neck: cy, w: hd.w * S, eyes, sprite: this.headSpr };
  }

  // carry out the current order: walk the path, swing at a target in reach, or arrive somewhere
  follow(dt, cam, mobs) {
    const g = this.goal;
    if (g?.mob && g.spell) { // walk into range, then cast
      const m = g.mob, gap = Math.hypot(m.x - this.x, m.z - this.z) - m.def.r;
      if (!m.alive) this.stop();
      else if (gap <= g.spell.range) { this.moving = false; this.startCast(g.spell.time, g.spell.run, m, g.spell.name); return; }
      else if ((this.repathT -= dt) <= 0 || !this.path.length) this.repath();
    } else if (g?.mob) {
      const m = g.mob;
      const gap = Math.hypot(m.x - this.x, m.z - this.z) - m.def.r;
      // once in reach, stay put until the monster is clearly out of it: no stop-start at the edge
      const reach = REACH_MOB + (this.engaged === m ? 0.5 : 0);
      if (!m.alive) this.stop();
      else if (gap <= reach) {
        this.engaged = m;
        this.path = [];
        const dx = m.x - this.x, dz = m.z - this.z, d = Math.hypot(dx, dz) || 1;
        if (this.atkAnim <= 0) this.face = { x: dx / d, z: dz / d };
        if (this.atkTimer <= 0) this.swing(cam, mobs);
      } else {
        this.engaged = null;
        // close by, step straight at it instead of zig-zagging between tile centres
        if (gap < 3) this.path = [{ x: m.x, z: m.z }];
        else if ((this.repathT -= dt) <= 0 || !this.path.length) this.repath(); // it moves: keep chasing
      }
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

  // one attack on the target, timed by ASPD; hit, crit and damage roll by the rules. A skill
  // waiting on the goal (goal.skill: { mult, hitMult, pay() -> bool, done(target, res) }) goes
  // off instead of a normal attack, then the fight carries on with normal attacks.
  swing(cam, mobs) {
    const target = this.goal?.mob;
    if (!target?.alive) return;
    let sk = this.goal.skill;
    this.goal.skill = null;
    if (sk && !sk.pay()) sk = null;
    this.atkTimer = this.ps.interval;
    this.atkAnim = this.atkDur = Math.min(0.42, this.atkTimer * 0.9);
    const dx = target.x - this.x, dz = target.z - this.z, d = Math.hypot(dx, dz) || 1;
    this.face = { x: dx / d, z: dz / d };
    const y = this.world.heightAt(this.x, this.z);
    this.fx.slash(this.x + this.face.x * 0.7, y + 0.55, this.z + this.face.z * 0.7, this.face, cam);
    const res = playerAttack(this.ps, target.effDef(), (sk?.mult || 1) * this.atkMul, sk?.hitMult || 1, !!sk);
    if (!res.miss) target.hit(res.dmg, dx / d, dz / d);
    this.emit('swing');
    this.emit('strike', target, res);
    sk?.done?.(target, res);
  }

  sync() {
    const y = this.world.heightAt(this.x, this.z);
    this.sprite.position.set(this.x, y, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
  }
}
