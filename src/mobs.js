// Small monsters with hidden HP. No health bars: hits flash white and knock back,
// below 30% HP they wobble and slow down, at 0 they vanish in a puff.
import * as THREE from 'three';
import { mulberry32, dirFor } from './noise.js';
import { mobAttack } from './rules.js';


// Battle stats follow Ragnarok's rules (rules.js): lv, hp, atk [min, max], def (hard DEF %),
// vit (soft DEF), agi (FLEE = lv + agi), dex (HIT = lv + dex), exp [base, job], adelay = ms
// between attacks. Each is modelled on a classic monster of the same level.
// el: element (rules.js ELEMENTS). drops: [itemId, min, max, chance]. Rare finds are Ragnarok-rare: 0.15-0.5% (15-50 in 10 000)
export const MOB_DEFS = {
  slime:     { name: 'Green Slime', ai: 'hopper', art: 'slime', el: 'water', lv: 1,  hp: 50,  atk: [7, 10],  def: 0,  vit: 1,  agi: 1,  dex: 6,  exp: [2, 1],   adelay: 1872, speed: 1.7, aggro: 4.5, chase: 4, reach: 0.8, w: 0.9, r: 0.35, drops: [['gel', 1, 2, 1], ['berry', 1, 1, 0.12], ['shiny_gel', 1, 1, 0.01], ['gooey_ring', 1, 1, 0.005]] },
  blueSlime: { name: 'Blue Slime', ai: 'hopper', art: 'slimeBlue', el: 'water', lv: 5,  hp: 120, atk: [11, 14], def: 0,  vit: 5,  agi: 5,  dex: 10, exp: [6, 5],   adelay: 1600, speed: 1.8, aggro: 4.5, chase: 4.5, reach: 0.8, w: 1.0, r: 0.38, split: 'miniSlime', drops: [['gel', 1, 1, 1], ['dew', 1, 1, 0.6], ['tonic', 1, 1, 0.04], ['shiny_gel', 1, 1, 0.01], ['tide_pendant', 1, 1, 0.003]] },
  miniSlime: { name: 'Mini Slime', ai: 'hopper', art: 'slimeBlue', el: 'water', lv: 3,  hp: 40,  atk: [8, 11],  def: 0,  vit: 3,  agi: 3,  dex: 8,  exp: [2, 2],   adelay: 1400, speed: 2.3, aggro: 6, chase: 5, reach: 0.6, w: 0.55, r: 0.22, noRespawn: true, drops: [['dew', 1, 1, 0.5]] },
  sprout:    { name: 'Sproutling', ai: 'skittish', art: 'sprout', el: 'earth', lv: 3,  hp: 60,  atk: [9, 12],  def: 0,  vit: 3,  agi: 3,  dex: 8,  exp: [6, 2],   adelay: 1456, speed: 1.5, flee: 2.9, fear: 3.5, angry: 6, reach: 0.8, w: 0.95, r: 0.35, drops: [['seed', 1, 1, 1], ['leaf', 1, 1, 0.6], ['berry', 1, 1, 0.2], ['herb', 1, 1, 0.25], ['seedling_band', 1, 1, 0.004], ['flower_wreath', 1, 1, 0.005]] },
  crab:      { name: 'Mudcrab', ai: 'crab', art: 'crab', el: 'water', lv: 7,  hp: 150, atk: [18, 24], def: 5,  vit: 8,  agi: 6,  dex: 11, exp: [15, 9],  adelay: 1300, speed: 1.6, aggro: 5, reach: 0.85, w: 1.1, r: 0.42, drops: [['shell', 1, 2, 1], ['crableg', 1, 1, 0.25], ['mud_buckler', 1, 1, 0.003]] },
  mushling:  { name: 'Mushling', ai: 'puffer', art: 'mushling', el: 'earth', lv: 12, hp: 405, atk: [26, 35], def: 0,  vit: 24, agi: 12, dex: 36, exp: [45, 32], adelay: 1768, speed: 1.2, aggro: 4, chase: 6, reach: 0.8, w: 0.95, r: 0.36, drops: [['spore', 1, 2, 1], ['herb', 1, 1, 0.2], ['potion', 1, 1, 0.08], ['spore_cloak', 1, 1, 0.0025]] },
  beetle:    { name: 'Pebble Beetle', ai: 'tank', art: 'beetle', el: 'earth', lv: 16, hp: 620, atk: [50, 62], def: 10, vit: 24, agi: 17, dex: 26, exp: [90, 60], adelay: 1500, speed: 1.15, aggro: 4, chase: 8, reach: 0.9, w: 1.15, r: 0.45, heavy: true, drops: [['stone', 1, 2, 1], ['potion2', 1, 1, 0.06], ['pebble_ring', 1, 1, 0.003], ['horn_blade', 1, 1, 0.0015]] },
  wisp:      { name: 'Firefly Wisp', ai: 'wisp', art: 'wisp', el: 'wind', lv: 8,  hp: 169, atk: [22, 27], def: 5,  vit: 8,  agi: 20, dex: 17, exp: [19, 15], adelay: 1292, speed: 2.4, aggro: 6, reach: 0.75, w: 0.7, r: 0.3, fly: true, night: true, drops: [['glow', 1, 1, 1], ['wander', 1, 1, 0.15], ['wisp_lantern', 1, 1, 0.004]] },
  // ---------- the new lands: palette swaps of the valley's monsters, Ragnarok style (tint) ----------
  russet:    { name: 'Russet Sproutling', ai: 'tank', art: 'sprout', el: 'earth', tint: '#ffb47a', lv: 9,  hp: 230, atk: [24, 30], def: 3, vit: 9,  agi: 9,  dex: 18, exp: [24, 16], adelay: 1500, speed: 1.4, aggro: 4.5, chase: 6, reach: 0.8, w: 1.0, r: 0.36, drops: [['thorn', 1, 1, 0.55], ['seed', 1, 1, 0.6], ['leaf', 1, 1, 0.4], ['berry', 1, 1, 0.2], ['bramble_ring', 1, 1, 0.003]] },
  brine:     { name: 'Brine Slime', ai: 'hopper', art: 'slimeBlue', el: 'water', tint: '#a8ffd8', lv: 10, hp: 280, atk: [26, 32], def: 2, vit: 10, agi: 8,  dex: 18, exp: [30, 20], adelay: 1500, speed: 1.8, aggro: 5, chase: 5, reach: 0.8, w: 1.1, r: 0.4, drops: [['salt', 1, 1, 0.55], ['gel', 1, 1, 0.8], ['tonic', 1, 1, 0.05], ['shiny_gel', 1, 1, 0.01]] },
  tidecrab:  { name: 'Tidecrab', ai: 'crab', art: 'crab', el: 'water', tint: '#a8c8ff', lv: 11, hp: 330, atk: [30, 38], def: 8, vit: 12, agi: 10, dex: 20, exp: [36, 24], adelay: 1300, speed: 1.7, aggro: 5.5, reach: 0.9, w: 1.25, r: 0.48, drops: [['shell', 1, 2, 1], ['crableg', 1, 1, 0.3], ['pearl', 1, 1, 0.06], ['coral_shield', 1, 1, 0.0025]] },
  gloomcap:  { name: 'Gloomcap', ai: 'puffer', art: 'mushling', el: 'shadow', tint: '#a89cff', lv: 18, hp: 900, atk: [48, 60], def: 5, vit: 28, agi: 18, dex: 40, exp: [130, 90], adelay: 1700, speed: 1.25, aggro: 4.5, chase: 7, reach: 0.85, w: 1.15, r: 0.42, mdef: 10, drops: [['gloom', 1, 1, 0.5], ['spore', 1, 2, 0.8], ['potion2', 1, 1, 0.08], ['gloom_hood', 1, 1, 0.0025]] },
  shadeWisp: { name: 'Shade Wisp', ai: 'wisp', art: 'wisp', el: 'shadow', tint: '#b8a0ff', glow: true, lv: 19, hp: 700, atk: [52, 64], def: 8, vit: 15, agi: 35, dex: 40, exp: [140, 100], adelay: 1250, speed: 2.5, aggro: 6, reach: 0.75, w: 0.85, r: 0.32, fly: true, mdef: 20, drops: [['shade', 1, 1, 0.45], ['glow', 1, 1, 0.8], ['wander', 1, 1, 0.1], ['wisp_lantern', 1, 1, 0.005], ['shade_staff', 1, 1, 0.002]] },
  cinderBeetle: { name: 'Cinder Beetle', ai: 'tank', art: 'beetle', el: 'fire', tint: '#ff9a72', lv: 23, hp: 1500, atk: [70, 88], def: 18, vit: 30, agi: 20, dex: 38, exp: [260, 170], adelay: 1500, speed: 1.2, aggro: 4.5, chase: 9, reach: 1.0, w: 1.35, r: 0.52, heavy: true, drops: [['cinder', 1, 1, 0.5], ['stone', 1, 2, 1], ['potion2', 1, 1, 0.1], ['potion3', 1, 1, 0.03], ['cinder_mail', 1, 1, 0.002], ['horn_blade', 1, 1, 0.002]] },
  emberWisp: { name: 'Ember Wisp', ai: 'wisp', art: 'wisp', el: 'fire', tint: '#ff9a5a', glow: true, lv: 21, hp: 820, atk: [58, 72], def: 6, vit: 15, agi: 40, dex: 45, exp: [180, 120], adelay: 1200, speed: 2.5, aggro: 6, reach: 0.75, w: 0.85, r: 0.32, fly: true, drops: [['ember_dust', 1, 1, 0.5], ['glow', 1, 1, 0.6], ['cinder', 1, 1, 0.15], ['ember_charm', 1, 1, 0.003]] },
  // mini-bosses: one on each new field, big and slow, they stomp like the Jarl and come back after
  // `respawn` seconds. Their rare materials craft the best gear (Gunnar, in Steinborg).
  matron:    { name: 'Bramble Matron', ai: 'boss', art: 'sprout', el: 'earth', tint: '#ff9a6a', boss: true, lv: 14, hp: 1400, atk: [36, 46], def: 8, vit: 18, agi: 10, dex: 26, exp: [320, 220], adelay: 1800, speed: 1.2, aggro: 5.5, chase: 12, reach: 1.3, w: 2.0, r: 0.75, heavy: true, respawn: 300, drops: [['heartwood', 1, 1, 0.3], ['thorn', 3, 5, 1], ['potion2', 1, 2, 0.5], ['thorn_mantle', 1, 1, 0.03], ['bramble_ring', 1, 1, 0.05]] },
  tideKing:  { name: 'Tide King', ai: 'boss', art: 'crab', el: 'water', tint: '#8ab8ff', boss: true, lv: 17, hp: 2000, atk: [44, 56], def: 16, vit: 22, agi: 12, dex: 30, exp: [450, 300], adelay: 1700, speed: 1.3, aggro: 5.5, chase: 12, reach: 1.4, w: 2.3, r: 0.85, heavy: true, respawn: 300, drops: [['king_pearl', 1, 1, 0.3], ['pearl', 1, 2, 0.6], ['crableg', 2, 3, 1], ['tidebreaker', 1, 1, 0.02], ['coral_shield', 1, 1, 0.05]] },
  gloomMother: { name: 'Gloom Mother', ai: 'boss', art: 'mushling', el: 'shadow', tint: '#9a7cff', boss: true, lv: 22, hp: 3000, atk: [58, 72], def: 10, vit: 30, agi: 16, dex: 40, exp: [800, 540], adelay: 1800, speed: 1.15, aggro: 5.5, chase: 12, reach: 1.4, w: 2.2, r: 0.8, heavy: true, mdef: 15, respawn: 420, drops: [['gloom_heart', 1, 1, 0.3], ['gloom', 2, 4, 1], ['potion3', 1, 2, 0.4], ['gloom_staff', 1, 1, 0.02], ['gloom_hood', 1, 1, 0.05]] },
  cinderLord: { name: 'Cinder Lord', ai: 'boss', art: 'beetle', el: 'fire', tint: '#ff7a4a', boss: true, lv: 26, hp: 4200, atk: [80, 100], def: 25, vit: 35, agi: 18, dex: 45, exp: [1200, 800], adelay: 1800, speed: 1.15, aggro: 5.5, chase: 12, reach: 1.5, w: 2.4, r: 0.9, heavy: true, respawn: 480, drops: [['cinder_core', 1, 1, 0.3], ['cinder', 2, 4, 1], ['potion3', 1, 2, 0.5], ['cinder_greaves', 1, 1, 0.03], ['cinder_mail', 1, 1, 0.04]] },
  // MVP boss of Glodberg: one at a time, back 15 minutes after it falls. Its slayer gets the MVP
  // reward on top of the drops. Stomps the ground around it every few seconds.
  // (softened for now, for a Base ~25 Swordsman: it would need a party at Ragnarok strength)
  jarl:      { name: 'Ember Jarl', ai: 'boss', art: 'jarl', el: 'fire', lv: 25, hp: 3200, atk: [45, 65], def: 15, vit: 25, agi: 15, dex: 35, exp: [2600, 1800], adelay: 2000, speed: 1.35, aggro: 7, chase: 25, reach: 1.9, w: 3.1, r: 1.15, heavy: true,
    mvp: true, respawn: 900, lair: { x: 32, z: 48 }, mvpExp: 1300, mvpDrops: [['potion3', 3], ['ember_heart', 1]],
    drops: [['potion2', 2, 3, 0.8], ['potion3', 1, 2, 0.5], ['stone', 4, 6, 1], ['jarl_horn', 1, 1, 0.25], ['ember_crown', 1, 1, 0.05], ['jarl_mantle', 1, 1, 0.03], ['jarl_staff', 1, 1, 0.02], ['emberbrand', 1, 1, 0.01]] },
};

const RESPAWN = 60;
const ATTACK_ANIM = 0.5; // PixelLab monsters play their attack animation for this long
const STRIDE = 1.5;      // walk cycle length in body widths: legs keep pace with the ground

class Mob {
  constructor(mgr, type, x, z) {
    this.mgr = mgr;
    this.type = type;
    this.def = MOB_DEFS[type];
    this.art = mgr.lib.mobs[this.def.art];
    this.mat = new THREE.SpriteMaterial({ map: this.art.anims.down.idle[0], alphaTest: 0.5 });
    // palette swaps: the art times a colour. Wisps keep their own glow (no day/night tint)
    if (this.def.tint) this.mat.userData.tint = new THREE.Color(this.def.tint);
    if (!this.def.night && !this.def.glow) this.mgr.tint.push(this.mat);
    else if (this.def.tint) this.mat.color.copy(this.mat.userData.tint);
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.center.set(0.5, this.art.anchor);
    this.sprite.renderOrder = 2;
    this.shadow = new THREE.Mesh(mgr.shadowGeo, mgr.shadowMat);
    this.shadow.scale.setScalar(this.def.w * 0.9);
    mgr.scene.add(this.sprite, this.shadow);
    this.home = { x, z };
    this.reset(x, z);
  }

  reset(x, z) {
    const d = this.def;
    this.x = x; this.z = z;
    this.hp = d.hp;
    this.alive = true;
    this.state = 'wander';
    this.t = Math.random() * 10;
    this.wanderT = Math.random() * 2;
    this.target = null;
    this.knock = { x: 0, z: 0 };
    this.flash = 0;
    this.atkCd = 1;
    this.chaseT = 0;
    this.tired = 0;
    this.angry = 0;
    this.blocked = 0;
    this.hop = Math.random();
    this.special = 0;    // charge / puff timer
    this.specialCd = 2;
    this.heading = { x: 0, z: 1 };
    this.atkAnim = 0;
    this.walked = 0; // distance walked, drives the walk cycle
    this.provokeT = 0; // taunted: it comes for you
    this.stunT = 0;
    this.sprite.visible = this.shadow.visible = true;
    const upp = d.w / this.art.body[0]; // def.w is the body width
    this.sprite.scale.set(this.art.fw * upp, this.art.fh * upp, 1);
    this.mat.rotation = 0;
  }

  tryMove(dx, dz) {
    const w = this.mgr.world;
    const nx = this.x + dx, nz = this.z + dz;
    const [rx, rz] = w.resolve(nx, nz, this.def.r);
    if (!w.isSafe(rx, rz) && w.walkable(rx, rz)) { this.x = rx; this.z = rz; return true; }
    return false;
  }

  moveToward(tx, tz, speed, dt) {
    const dx = tx - this.x, dz = tz - this.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return 0;
    const s = Math.min(d, speed * dt);
    this.heading = { x: dx / d, z: dz / d };
    const ok = this.tryMove((dx / d) * s, (dz / d) * s);
    return ok ? s : 0;
  }

  // the monster's numbers as the battle rules see them
  effDef() { return this.def; }

  // taunted (War Cry, a thrown stone): it comes for you for a while, from further away
  provoke() {
    this.provokeT = 30;
    this.angry = 30;
    this.state = 'chase';
    this.chaseT = 30;
    this.tired = 0;
  }

  hit(dmg, fx, fz) {
    if (!this.alive) return;
    this.hp -= dmg;
    this.flash = 0.09;
    const k = this.def.mvp ? 0 : this.def.heavy ? 0.8 : 1.6; // a small nudge: Ragnarok monsters barely move when hit
    this.knock.x = fx * k;
    this.knock.z = fz * k;
    if (this.def.ai === 'skittish') this.angry = this.def.angry;
    if (this.def.boss) this.knock.x = this.knock.z = 0; // bosses stand their ground
    if (this.def.ai === 'hopper' || this.def.ai === 'tank' || this.def.ai === 'puffer' || this.def.ai === 'boss') {
      this.state = 'chase';
      this.chaseT = Math.max(this.chaseT, this.def.chase || 4);
      this.tired = 0;
    }
    if (this.hp <= 0) this.mgr.kill(this);
  }

  update(dt, player) {
    const d = this.def, p = player;
    this.t += dt;
    this.flash -= dt;
    this.atkCd -= dt;
    this.tired -= dt;
    this.angry -= dt;
    this.specialCd -= dt;
    this.wanderT -= dt;
    this.atkAnim -= dt;
    this.provokeT -= dt;

    if (Math.abs(this.knock.x) + Math.abs(this.knock.z) > 0.05) {
      this.tryMove(this.knock.x * dt, this.knock.z * dt);
      const k = Math.exp(-9 * dt);
      this.knock.x *= k;
      this.knock.z *= k;
    }

    const x0 = this.x, z0 = this.z; // after knockback, so being pushed doesn't move the legs
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    const low = this.hp / d.hp <= 0.3 && d.hp > 1;
    const speed = d.speed * (low ? 0.6 : 1);
    // Play Dead and safe ground (camp) make monsters lose interest
    const available = p.state !== 'down' && p.state !== 'feign' && !this.mgr.world.isSafe(p.x, p.z);
    const aggro = this.provokeT > 0 ? 14 : d.aggro;
    const homeD = Math.hypot(this.x - this.home.x, this.z - this.home.z);
    let moving = false;

    const wander = (spd = speed * 0.6) => {
      if (!this.target || this.wanderT <= 0) {
        if (Math.random() < 0.35) { this.target = null; this.wanderT = 1 + Math.random() * 2; return; }
        const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 3;
        this.target = { x: this.home.x + Math.cos(a) * r, z: this.home.z + Math.sin(a) * r };
        this.wanderT = 2 + Math.random() * 2.5;
      }
      if (this.target) {
        const m = this.moveToward(this.target.x, this.target.z, spd, dt);
        moving = m > 0;
        if (Math.hypot(this.target.x - this.x, this.target.z - this.z) < 0.3 || m === 0) this.target = null;
      }
    };
    const contact = () => {
      if (available && dist < d.reach + 0.3 && this.atkCd <= 0) {
        if (p.canBeHit()) {
          const res = mobAttack(d, p.ps);
          if (res.miss) this.mgr.emit('miss', this, res);
          else p.takeDamage(res.dmg, this.x, this.z);
          this.mgr.emit('attack', this);
          this.atkAnim = ATTACK_ANIM;
          if (dist > 0.01) this.heading = { x: dx / dist, z: dz / dist };
        }
        this.atkCd = d.adelay / 1000;
      }
    };

    if (homeD > (this.provokeT > 0 || d.mvp ? 20 : 11) && this.state !== 'return') this.state = 'return';
    if (this.stunT > 0) this.stunT -= dt; // stunned: stands there
    else if (this.state === 'return') {
      moving = this.moveToward(this.home.x, this.home.z, speed, dt) > 0;
      if (homeD < 2 || !moving) { this.state = 'wander'; this.tired = 2; }
    } else switch (d.ai) {
      case 'hopper':
      case 'tank':
      case 'boss': {
        if (this.state === 'wander' && available && this.tired <= 0 && dist < aggro) {
          this.state = 'chase';
          this.chaseT = d.chase;
        }
        if (this.state === 'chase') {
          this.chaseT -= dt;
          if (this.chaseT <= 0 || !available || dist > aggro * 2.2) { this.state = 'wander'; this.tired = 3; }
          else {
            const hopping = d.ai !== 'hopper' || (this.hop % 1) < 0.55;
            if (this.special > 0) { // winding up a stomp: stand still, then it lands
              this.special -= dt;
              if (this.special <= 0) this.mgr.emit('stomp', this);
            } else {
              if (hopping && dist > d.reach * 0.7) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
              contact();
              if (d.ai === 'boss' && dist < 3.2 && this.specialCd <= 0) {
                this.special = 0.8;
                this.specialCd = 7;
                this.atkAnim = ATTACK_ANIM * 1.6;
                this.mgr.emit('windup', this);
              }
            }
          }
        } else wander();
        break;
      }
      case 'skittish': {
        if (this.angry > 0 && available) {
          moving = dist > d.reach * 0.7 ? this.moveToward(p.x, p.z, speed * 1.5, dt) > 0 : false;
          contact();
        } else if (available && dist < d.fear) {
          const want = d.flee * dt;
          const m = this.moveToward(this.x - dx, this.z - dz, d.flee, dt);
          moving = m > 0;
          this.blocked = m < want * 0.3 ? this.blocked + dt : 0;
          if (this.blocked > 0.5) { this.angry = d.angry; this.blocked = 0; this.mgr.emit('cornered', this); }
        } else wander();
        break;
      }
      case 'crab': {
        // scuttles sideways around you, then charges in a straight line
        if (this.special > 0) {
          this.special -= dt;
          moving = this.tryMove(this.heading.x * 6.2 * dt, this.heading.z * 6.2 * dt);
          if (!moving) this.special = 0;
          contact();
        } else if (available && dist < aggro) {
          const sx = -dz / (dist || 1), sz = dx / (dist || 1);
          const side = Math.sin(this.t * 0.9) > 0 ? 1 : -1;
          const keep = dist > 3 ? 0.6 : dist < 2 ? -0.5 : 0;
          const mx = sx * side + (dx / dist) * keep, mz = sz * side + (dz / dist) * keep;
          moving = this.tryMove(mx * speed * dt, mz * speed * dt);
          if (this.specialCd <= 0 && dist < 4) {
            this.heading = { x: dx / dist, z: dz / dist };
            this.special = 0.5;
            this.specialCd = 2.6 + Math.random();
            this.mgr.emit('charge', this);
          }
          contact();
        } else wander();
        break;
      }
      case 'puffer': {
        if (this.state === 'wander' && available && dist < aggro && this.tired <= 0) { this.state = 'chase'; this.chaseT = d.chase; }
        if (this.state === 'chase') {
          this.chaseT -= dt;
          if (this.chaseT <= 0 || !available || dist > aggro * 2.2) { this.state = 'wander'; this.tired = 3; }
          else {
            if (dist > d.reach * 0.7) moving = this.moveToward(p.x, p.z, speed, dt) > 0;
            if (dist < 2.3 && this.specialCd <= 0) {
              this.specialCd = 4.5;
              this.special = 0.4;
              this.mgr.emit('spore', this);
              this.atkAnim = ATTACK_ANIM;
            }
            contact();
          }
        } else wander();
        this.special -= dt;
        break;
      }
      case 'wisp': {
        const jitter = { x: Math.sin(this.t * 3.1) * 1.6, z: Math.cos(this.t * 2.3) * 1.6 };
        if (available && dist < aggro) {
          moving = this.moveToward(p.x + jitter.x * 0.6, p.z + jitter.z * 0.6, speed, dt) > 0;
          contact();
        } else {
          moving = this.moveToward(this.home.x + jitter.x * 2, this.home.z + jitter.z * 2, speed * 0.5, dt) > 0;
        }
        break;
      }
    }

    // ---- visuals ----
    this.walked += Math.hypot(this.x - x0, this.z - z0);
    if (d.ai === 'hopper') this.hop += dt * (moving ? 1.25 : 0.6);
    let lift = 0;
    if (d.ai === 'hopper' && moving && this.hop % 1 < 0.55) lift = Math.sin(((this.hop % 1) / 0.55) * Math.PI) * 0.28 * d.w;
    else if (d.fly) lift = 0.7 + Math.sin(this.t * 4) * 0.15;
    const tex = this.frame(moving);
    if (this.mat.map !== tex) { this.mat.map = tex; this.sprite.center.y = tex.userData.anchor; }
    this.mat.rotation = low ? Math.sin(this.t * 15) * 0.13 : 0;

    const y = this.mgr.world.heightAt(this.x, this.z);
    this.sprite.position.set(this.x, y + lift, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
  }

  // frame by facing (relative to the camera) and by what the monster is doing
  frame(moving) {
    const set = this.art;
    const dir = dirFor(this.heading.x, this.heading.z, this.mgr.cam);
    const A = (this.flash > 0 ? set.flash : set.anims)[dir];
    let list = A.idle, k = 0;
    if (this.atkAnim > 0 && A.attack) { list = A.attack; k = 1 - this.atkAnim / ATTACK_ANIM; }
    else if (moving && this.def.ai === 'hopper' && A.hop) {
      const ph = this.hop % 1;
      if (ph < 0.55) { list = A.hop; k = ph / 0.55; }
    } else if (this.def.fly && A.walk) { list = A.walk; k = (this.t * 1.6) % 1; } // fliers flutter in place
    else if (moving && A.walk) { list = A.walk; k = (this.walked / (STRIDE * this.def.w)) % 1; }
    return list[Math.max(0, Math.min(list.length - 1, Math.floor(k * list.length)))]; // a long wind-up holds the first frame
  }
}

export class MobManager {
  constructor(scene, world, lib, fx) {
    this.scene = scene;
    this.world = world;
    this.lib = lib;
    this.fx = fx;
    this.list = [];
    this.dead = [];
    this.tint = [];
    this.handlers = {};
    this.night = false;
    this.mvp = null;  // { type, x, z } on a map with an MVP
    this.mvpAt = 0;   // when the MVP may next appear (ms since 1970)
    this.cam = { fx: 0, fz: -1, rx: 1, rz: 0 }; // camera basis, set by the game each frame
    const sg = new THREE.PlaneGeometry(1, 0.6);
    sg.rotateX(-Math.PI / 2);
    this.shadowGeo = sg;
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: lib.shadow, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    });
  }

  on(name, fn) { (this.handlers[name] ||= []).push(fn); }
  emit(name, ...a) { for (const fn of this.handlers[name] || []) fn(...a); }

  // a free spot for a monster's home, away from the portals you arrive by
  findSpot(rng) {
    for (let i = 0; i < 400; i++) {
      const x = 4 + rng() * 56, z = 4 + rng() * 56;
      if (this.world.portals.some((p) => Math.hypot(p.x - x, p.z - z) < 9)) continue;
      if (!this.world.walkable(x, z)) continue;
      const [rx, rz] = this.world.resolve(x, z, 0.5);
      if (Math.hypot(rx - x, rz - z) > 0.01) continue;
      if (this.list.some((m) => Math.hypot(m.home.x - x, m.home.z - z) < 3)) continue;
      return { x, z };
    }
    return null;
  }

  // a new map: clear every monster and spawn the map's own. spawns: [[type, count, nightOnly]]
  setMap(spawns, seed = 11) {
    for (const m of [...this.list]) this.remove(m);
    this.dead = [];
    this.mvp = null;
    const rng = mulberry32(seed);
    for (const [type, count, nightOnly] of spawns) {
      for (let i = 0; i < count; i++) {
        const s = this.findSpot(rng);
        if (!s) continue;
        // the MVP waits out its respawn time even across map changes and restarts
        if (MOB_DEFS[type].mvp) { this.mvp = { type, ...(MOB_DEFS[type].lair || s) }; continue; }
        const m = this.add(type, s.x, s.z);
        m.nightOnly = !!nightOnly;
        if (nightOnly && !this.night) { m.alive = false; m.sprite.visible = m.shadow.visible = false; this.dead.push({ m, t: 0 }); }
      }
    }
  }

  add(type, x, z) {
    const m = new Mob(this, type, x, z);
    this.list.push(m);
    return m;
  }

  remove(m) {
    this.list = this.list.filter((o) => o !== m);
    this.scene.remove(m.sprite, m.shadow);
    m.mat.dispose();
    this.tint = this.tint.filter((t) => t !== m.mat);
  }

  kill(m) {
    m.alive = false;
    m.sprite.visible = m.shadow.visible = false;
    const y = this.world.heightAt(m.x, m.z) + (m.def.fly ? 0.7 : 0.3);
    this.fx.puff(m.x, y, m.z, m.def.w);
    const drops = [];
    for (const [item, min, max, chance] of m.def.drops) {
      if (Math.random() < chance) drops.push([item, min + Math.floor(Math.random() * (max - min + 1))]);
    }
    this.emit('death', m, drops);
    if (m.def.split) {
      for (const s of [-1, 1]) {
        const c = this.add(m.def.split, m.x + s * 0.4, m.z);
        c.home = { ...m.home };
        c.state = 'chase';
        c.chaseT = 5;
        c.knock = { x: s * 4, z: 0 };
        c.atkCd = 0.6;
      }
    }
    if (m.def.noRespawn) { this.remove(m); return; }
    if (m.def.mvp) { // gone until its respawn time comes round (the game saves mvpAt)
      this.mvpAt = Date.now() + m.def.respawn * 1000;
      this.emit('mvp', m);
      this.remove(m);
      return;
    }
    this.dead.push({ m, t: m.def.respawn || RESPAWN });
  }

  update(dt, player) {
    // the MVP appears once its time has come
    if (this.mvp && Date.now() >= this.mvpAt && !this.list.some((m) => m.def.mvp)) {
      this.add(this.mvp.type, this.mvp.x, this.mvp.z);
      this.emit('mvpSpawn', this.mvp);
    }
    for (const m of this.list) if (m.alive) m.update(dt, player);
    // keep monsters from stacking on top of each other
    const alive = this.list.filter((m) => m.alive);
    for (let i = 0; i < alive.length; i++) for (let j = i + 1; j < alive.length; j++) {
      const a = alive[i], b = alive[j];
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), min = a.def.r + b.def.r;
      if (d < min && d > 1e-4) {
        const push = (min - d) / 2;
        a.tryMove((-dx / d) * push, (-dz / d) * push);
        b.tryMove((dx / d) * push, (dz / d) * push);
      }
    }
    // respawn out of view
    for (let i = this.dead.length - 1; i >= 0; i--) {
      const e = this.dead[i];
      e.t -= dt * (this.night ? 2 : 1);
      const far = Math.hypot(player.x - e.m.home.x, player.z - e.m.home.z) > 14;
      const nightOnly = e.m.def.night || e.m.nightOnly;
      if (e.t <= 0 && far && (!nightOnly || this.night)) {
        e.m.reset(e.m.home.x, e.m.home.z);
        this.dead.splice(i, 1);
      }
    }
  }

  nearest(x, z, max) {
    let best = null, bd = max;
    for (const m of this.list) {
      if (!m.alive) continue;
      const d = Math.hypot(m.x - x, m.z - z) - m.def.r;
      if (d < bd) { bd = d; best = m; }
    }
    return best;
  }

  hitArc(x, z, face, range, cosHalf, dmg) {
    let n = 0;
    for (const m of [...this.list]) {
      if (!m.alive) continue;
      const dx = m.x - x, dz = m.z - z, d = Math.hypot(dx, dz);
      if (d > range + m.def.r) continue;
      const dot = d < 0.4 ? 1 : (dx * face.x + dz * face.z) / d;
      if (dot < cosHalf) continue;
      m.hit(dmg, d > 0 ? dx / d : face.x, d > 0 ? dz / d : face.z);
      n++;
    }
    return n;
  }

  // night-only monsters fade in and out with the dark
  setNight(night) {
    this.night = night;
    for (const m of this.list) {
      if (!m.def.night && !m.nightOnly) continue;
      if (!night && m.alive) {
        m.alive = false;
        m.sprite.visible = m.shadow.visible = false;
        if (!this.dead.some((e) => e.m === m)) this.dead.push({ m, t: 0 });
      }
    }
  }
}
