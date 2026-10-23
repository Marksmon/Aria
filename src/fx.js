// Short-lived visual effects and ground pickups (drops, hearts).
import * as THREE from 'three';

export class FX {
  constructor(scene, world, lib) {
    this.scene = scene;
    this.world = world;
    this.lib = lib;
    this.live = [];
    this.pool = [];
    this.pickups = [];
    this.tint = [];
  }

  sprite(map, opts = {}) {
    let s = this.pool.pop();
    if (!s) {
      s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
      this.scene.add(s);
    }
    s.material.map = map;
    s.material.opacity = 1;
    s.material.rotation = opts.rotation || 0;
    s.material.depthTest = opts.depthTest !== false;
    s.material.alphaTest = 0;
    s.material.transparent = true;
    s.material.color.set('#ffffff');
    s.material.needsUpdate = true;
    s.center.set(0.5, opts.bottom ? 0.05 : 0.5);
    s.renderOrder = opts.renderOrder ?? 3;
    s.visible = true;
    return s;
  }

  release(s) {
    s.visible = false;
    this.pool.push(s);
  }

  slash(x, y, z, face, cam) {
    const sx = face.x * cam.rx + face.z * cam.rz;
    const sy = face.x * cam.fx + face.z * cam.fz;
    const s = this.sprite(this.lib.fx.slash, { rotation: Math.atan2(sy, sx), depthTest: false, renderOrder: 5 });
    s.position.set(x, y, z);
    s.scale.set(1.5, 1.5, 1);
    this.live.push({ s, t: 0, life: 0.16, kind: 'slash' });
  }

  puff(x, y, z, size = 1) {
    for (let i = 0; i < 7; i++) {
      const s = this.sprite(this.lib.fx.puff);
      const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.2;
      s.position.set(x, y, z);
      const sc = 0.4 * size;
      s.scale.set(sc, sc, 1);
      this.live.push({ s, t: 0, life: 0.45 + Math.random() * 0.2, kind: 'puff', v: [Math.cos(a) * sp, 0.8 + Math.random(), Math.sin(a) * sp], sc });
    }
  }

  // green spore cloud (Mushling)
  cloud(x, y, z) {
    for (let i = 0; i < 9; i++) {
      const s = this.sprite(this.lib.fx.puff);
      s.material.color.set('#b9e08a');
      const a = (i / 9) * Math.PI * 2;
      s.position.set(x, y, z);
      s.scale.set(0.6, 0.6, 1);
      this.live.push({ s, t: 0, life: 0.9, kind: 'puff', v: [Math.cos(a) * 1.6, 0.3, Math.sin(a) * 1.6], sc: 0.6, color: true });
    }
  }

  // rising coloured specks (level up, blocked hit)
  sparkle(x, y, z, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const s = this.sprite(this.lib.fx.puff, { depthTest: false, renderOrder: 5 });
      s.material.color.set(color);
      const a = (i / n) * Math.PI * 2, sp = 0.5 + Math.random() * 0.8;
      s.position.set(x, y, z);
      this.live.push({ s, t: 0, life: 0.7 + Math.random() * 0.3, kind: 'puff', v: [Math.cos(a) * sp, 1.4 + Math.random(), Math.sin(a) * sp], sc: 0.22, color: true });
      s.scale.set(0.22, 0.22, 1);
    }
  }

  // item: id, tex: texture, onCollect(pickup) -> bool (true = picked up)
  drop(x, z, item, count, tex) {
    const s = this.sprite(tex, { bottom: true, renderOrder: 2 });
    s.material.depthTest = true;
    s.material.alphaTest = 0.5;
    s.material.transparent = false;
    s.material.needsUpdate = true;
    const size = item === 'heart' ? 0.5 : 0.55;
    s.scale.set(size, size, 1);
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 0.6;
    const p = {
      s, item, count, x, z,
      tx: x + Math.cos(a) * r, tz: z + Math.sin(a) * r,
      t: 0, life: 45, size,
    };
    this.pickups.push(p);
    return p;
  }

  update(dt, player, collect) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const e = this.live[i];
      e.t += dt;
      const k = e.t / e.life;
      if (e.kind === 'slash') {
        e.s.material.opacity = 1 - k * k;
        const sc = 1.3 + k * 0.5;
        e.s.scale.set(sc, sc, 1);
      } else if (e.kind === 'puff') {
        e.s.position.x += e.v[0] * dt;
        e.s.position.y += e.v[1] * dt;
        e.s.position.z += e.v[2] * dt;
        const sc = e.sc * (1 + k * 1.6);
        e.s.scale.set(sc, sc, 1);
        e.s.material.opacity = 1 - k;
      }
      if (k >= 1) {
        if (e.color) e.s.material.color.set('#ffffff');
        this.release(e.s);
        this.live.splice(i, 1);
      }
    }

    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.t += dt;
      // pop out, then bob
      const pop = Math.min(1, p.t / 0.35);
      p.x += (p.tx - p.x) * Math.min(1, dt * 10);
      p.z += (p.tz - p.z) * Math.min(1, dt * 10);
      let hop = pop < 1 ? Math.sin(pop * Math.PI) * 0.6 : 0.12 + Math.sin(p.t * 3) * 0.06;
      // magnet toward the player
      const dx = player.x - p.x, dz = player.z - p.z, d = Math.hypot(dx, dz);
      if (pop >= 1 && player.state !== 'down' && d < 1.6) {
        const sp = Math.min(d, dt * 7);
        p.x += (dx / d) * sp; p.z += (dz / d) * sp;
        p.tx = p.x; p.tz = p.z;
        if (d < 0.45 && collect(p)) {
          this.release(p.s);
          this.pickups.splice(i, 1);
          continue;
        }
      }
      const y = this.world.heightAt(p.x, p.z);
      p.s.position.set(p.x, y + hop, p.z);
      const fade = p.life - p.t;
      p.s.visible = fade > 5 || Math.floor(p.t * 6) % 2 === 0;
      if (fade <= 0) {
        this.release(p.s);
        this.pickups.splice(i, 1);
      }
    }
  }
}
