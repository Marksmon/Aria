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
    this.warns = [];     // boss move warnings on the ground
    this.warnPool = [];
  }

  // a circle on the ground: red where a boss move will land, the fill growing until it hits (life s);
  // a spell's colour for the area it covers while it lasts
  warn(x, z, r, life, color = '#ff4a3a') {
    if (!this.warnTex) {
      const tex = (fill) => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d');
        g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2);
        if (fill) { g.fillStyle = 'rgba(255,255,255,.38)'; g.fill(); } else { g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.stroke(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fill(); }
        return new THREE.CanvasTexture(c);
      };
      this.warnTex = [tex(false), tex(true)];
      this.warnGeo = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
    }
    let w = this.warnPool.pop();
    if (!w) {
      const mesh = (map) => {
        const m = new THREE.Mesh(this.warnGeo, new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
        m.renderOrder = 2;
        this.scene.add(m);
        return m;
      };
      w = { ring: mesh(this.warnTex[0]), fill: mesh(this.warnTex[1]) };
    }
    const y = this.world.heightAt(x, z) + 0.12;
    for (const m of [w.ring, w.fill]) { m.position.set(x, y, z); m.visible = true; m.material.color.set(color); }
    w.ring.scale.set(r, 1, r);
    w.fill.scale.set(0.01, 1, 0.01);
    Object.assign(w, { r, t: 0, life });
    this.warns.push(w);
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
    s.material.blending = THREE.NormalBlending;
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

  // a ring spreading on the water round someone wading in the shallows
  ripple(x, y, z, size = 1) {
    let m = this.ripples?.pop();
    if (!m) {
      this.ringGeo ||= new THREE.RingGeometry(0.78, 1, 28).rotateX(-Math.PI / 2);
      m = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({ color: '#e8f6ff', transparent: true, depthWrite: false }));
      m.renderOrder = 2; // over the water
      this.scene.add(m);
    }
    m.position.set(x, y, z);
    m.visible = true;
    this.live.push({ m, t: 0, life: 0.9, kind: 'ripple', sc: 0.25 * size });
  }

  // a spell flying at a monster: a glowing ball with a trail; onHit() when it lands
  bolt(x, y, z, target, color, onHit, size = 0.55) {
    const s = this.sprite(this.lib.fx.puff, { depthTest: false, renderOrder: 5 });
    s.material.color.set(color);
    s.scale.set(size, size, 1);
    s.position.set(x, y, z);
    this.live.push({ s, t: 0, life: 3, kind: 'bolt', target, onHit, color: true, tint: color, trail: 0, sc: size });
  }

  // lightning: sparks strung along a line from a to b
  zap(a, b, color) {
    const n = Math.max(4, Math.round(Math.hypot(b.x - a.x, b.z - a.z) * 3));
    for (let i = 0; i <= n; i++) {
      const k = i / n, j = i && i < n ? 0.25 : 0;
      const s = this.sprite(this.lib.fx.puff, { depthTest: false, renderOrder: 5 });
      s.material.color.set(color);
      s.position.set(a.x + (b.x - a.x) * k + (Math.random() - 0.5) * j, a.y + (b.y - a.y) * k + (Math.random() - 0.5) * j, a.z + (b.z - a.z) * k + (Math.random() - 0.5) * j);
      this.live.push({ s, t: 0, life: 0.25, kind: 'puff', v: [0, 0, 0], sc: 0.18, color: true });
      s.scale.set(0.18, 0.18, 1);
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

  // Floating battle text, Ragnarok style: numbers rise and fade above whoever was hit.
  // kind: dealt (white), crit (big yellow), taken (red), heal (green), sp (blue), miss, level, job,
  // skill (a skill's name as it goes off), mvp (the MVP announcement, big and long)
  // follow: something with x and z (the player) for the text to stay over
  number(x, y, z, text, kind = 'dealt', follow = null) {
    const look = {
      dealt: ['#ffffff', 30], crit: ['#ffe14a', 40], taken: ['#ff5a4a', 30], heal: ['#7cf08a', 30],
      miss: ['#d8dde6', 24], level: ['#ffe37a', 30], job: ['#9fd4ff', 28], sp: ['#7ab8ff', 30],
      skill: ['#ffb35a', 26], mvp: ['#ffd23a', 24],
    }[kind] || ['#ffffff', 30];
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const font = `900 ${look[1]}px system-ui, sans-serif`;
    g.font = font;
    c.width = Math.ceil(g.measureText(String(text)).width) + 12;
    c.height = look[1] + 12;
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 6;
    g.strokeStyle = '#1a120c';
    g.strokeText(String(text), c.width / 2, c.height / 2);
    g.fillStyle = look[0];
    g.fillText(String(text), c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = this.sprite(tex, { depthTest: false, renderOrder: 6 });
    const h = 0.36 * (look[1] / 30);
    s.scale.set(h * c.width / c.height, h, 1);
    s.position.set(x + (Math.random() - 0.5) * 0.3, y, z);
    this.live.push({ s, t: 0, life: { level: 1.6, job: 1.6, skill: 1.1, mvp: 4 }[kind] || 0.95, kind: 'number', tex, y0: y, pop: kind === 'crit', follow });
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
    if (p.glow) this.release(p.glow);
    this.pickups.splice(i, 1);
  }

  // leaving a map: whatever lay on the ground is gone
  clearPickups() {
    for (const p of this.pickups) { this.release(p.s); if (p.glow) this.release(p.glow); }
    this.pickups = [];
    for (const w of this.warns) { w.ring.visible = w.fill.visible = false; this.warnPool.push(w); }
    this.warns = [];
  }

  // a faint gold halo, for rare drops
  glowTex() {
    if (this._glow) return this._glow;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    gr.addColorStop(0, 'rgba(255,240,170,.6)'); gr.addColorStop(0.35, 'rgba(255,214,90,.35)'); gr.addColorStop(1, 'rgba(255,190,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    this._glow = new THREE.CanvasTexture(c);
    this._glow.colorSpace = THREE.SRGBColorSpace;
    return this._glow;
  }

  // item: id, tex: texture, rare: it glows on the ground. Pickups stay until tapped (see take)
  drop(x, z, item, count, tex, rare = false) {
    const s = this.sprite(tex, { bottom: true, renderOrder: 2 });
    s.material.depthTest = true;
    s.material.alphaTest = 0.5;
    s.material.transparent = false;
    s.material.needsUpdate = true;
    const size = 0.55;
    s.scale.set(size, size, 1);
    const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 0.6;
    // it lands where you can reach it: never under a tree or a rock (landAt, set by the game)
    const [tx, tz] = this.landAt ? this.landAt(x + Math.cos(a) * r, z + Math.sin(a) * r) : [x + Math.cos(a) * r, z + Math.sin(a) * r];
    const p = {
      s, item, count, x, z, tx, tz,
      t: 0, life: 45, size,
    };
    if (rare) { // a soft halo behind it, and a few sparkles as it lands
      p.glow = this.sprite(this.glowTex(), { bottom: true, renderOrder: 1 });
      p.glow.material.blending = THREE.AdditiveBlending;
      p.glow.material.needsUpdate = true;
      this.sparkle(x, this.world.heightAt(x, z) + 0.4, z, '#ffd23a', 6);
      p.life = 90; // rare finds wait longer
    }
    this.pickups.push(p);
    return p;
  }

  update(dt) {
    for (let i = this.warns.length - 1; i >= 0; i--) {
      const w = this.warns[i];
      w.t += dt;
      const k = Math.min(1, w.t / w.life), s = Math.max(0.01, w.r * k);
      w.fill.scale.set(s, 1, s);
      if (w.t >= w.life) { w.ring.visible = w.fill.visible = false; this.warns.splice(i, 1); this.warnPool.push(w); }
    }
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
      } else if (e.kind === 'number') {
        e.s.position.y = e.y0 + (e.follow ? 0.3 : 0.9) * (1 - (1 - k) * (1 - k));
        if (e.follow) { e.s.position.x = e.follow.x; e.s.position.z = e.follow.z; }
        e.s.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
        if (e.pop && k < 0.15) e.s.scale.multiplyScalar(1 + (0.15 - k) * 0.6);
      } else if (e.kind === 'bolt') {
        const m = e.target, p = e.s.position;
        const ty = this.world.heightAt(m.x, m.z) + 0.5;
        const dx = m.x - p.x, dy = ty - p.y, dz = m.z - p.z, d = Math.hypot(dx, dy, dz), step = 13 * dt;
        if (!m.alive || d <= step) { e.t = e.life; if (m.alive) e.onHit(); }
        else { p.x += (dx / d) * step; p.y += (dy / d) * step; p.z += (dz / d) * step; }
        if ((e.trail -= dt) <= 0) { // a fading trail behind it
          e.trail = 0.03;
          const s = this.sprite(this.lib.fx.puff, { depthTest: false, renderOrder: 4 });
          s.material.color.set(e.tint);
          s.position.copy(p);
          this.live.push({ s, t: 0, life: 0.3, kind: 'puff', v: [0, 0.3, 0], sc: e.sc * 0.6, color: true });
          s.scale.set(e.sc * 0.6, e.sc * 0.6, 1);
        }
      } else if (e.kind === 'ripple') {
        const sc = e.sc * (1 + k * 3.2);
        e.m.scale.set(sc, 1, sc);
        e.m.material.opacity = 0.55 * (1 - k);
        if (k >= 1) { e.m.visible = false; (this.ripples ||= []).push(e.m); this.live.splice(i, 1); }
        continue;
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
        if (e.tex) { e.tex.dispose(); e.s.material.map = null; }
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
      if (p.glow) {
        const k = 0.8 + Math.sin(p.t * 3) * 0.06;
        p.glow.position.set(p.x, y + hop - 0.3, p.z);
        p.glow.scale.set(k, k, 1);
        p.glow.material.opacity = 0.4 + Math.sin(p.t * 3) * 0.1;
        p.glow.visible = p.s.visible;
      }
      if (fade <= 0) {
        this.release(p.s);
        if (p.glow) this.release(p.glow);
        this.pickups.splice(i, 1);
      }
    }
  }
}
