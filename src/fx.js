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

  // tapped tile: a square that fades on the ground, like Ragnarok's cell cursor
  tileMark(i, j) {
    if (!this.mark) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const g = c.getContext('2d');
      g.strokeStyle = '#fff4dc'; g.lineWidth = 5; g.strokeRect(5, 5, 54, 54);
      g.fillStyle = 'rgba(255,244,220,.18)'; g.fillRect(5, 5, 54, 54);
      const geo = new THREE.PlaneGeometry(0.94, 0.94);
      geo.rotateX(-Math.PI / 2);
      this.mark = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3,
      }));
      this.mark.renderOrder = 1;
      this.scene.add(this.mark);
    }
    this.mark.position.set(i + 0.5, this.world.heightAt(i + 0.5, j + 0.5) + 0.05, j + 0.5);
    this.markT = 0.9;
  }

  // a ground pickup the player reached: remove it
  take(p) {
    const i = this.pickups.indexOf(p);
    if (i < 0) return;
    this.release(p.s);
    this.pickups.splice(i, 1);
  }

  // item: id, tex: texture. Pickups stay on the ground until tapped (see take)
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

  update(dt) {
    if (this.mark) {
      this.markT -= dt;
      this.mark.visible = this.markT > 0;
      this.mark.material.opacity = Math.min(1, this.markT * 2.5);
    }
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
      const hop = pop < 1 ? Math.sin(pop * Math.PI) * 0.6 : 0.12 + Math.sin(p.t * 3) * 0.06;
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
