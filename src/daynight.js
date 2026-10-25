// 10-minute day. Lighting, fog and sprite tint follow a few keyframes;
// night brings Firefly Wisps, extra monsters and faster respawns.
import * as THREE from 'three';
import { sstep } from './noise.js';

export const DAY_LENGTH = 600; // seconds for a full day
const C = (h) => new THREE.Color(h);

const STATES = {
  dawn:  { sky: C('#e7b9a0'), hemiSky: C('#ffd9c0'), hemiGround: C('#5a4a40'), hemi: 1.35, sun: C('#ffc29a'), sunI: 1.0, tint: C('#ffe2d2'), fog: [20, 46], night: 0.4 },
  day:   { sky: C('#a3c9d8'), hemiSky: C('#fff6e2'), hemiGround: C('#6b5a40'), hemi: 1.9, sun: C('#fff0d0'), sunI: 1.6, tint: C('#ffffff'), fog: [24, 50], night: 0 },
  dusk:  { sky: C('#d99a72'), hemiSky: C('#ffc49a'), hemiGround: C('#4a3a34'), hemi: 1.25, sun: C('#ffa060'), sunI: 1.0, tint: C('#ffd2b4'), fog: [20, 44], night: 0.5 },
  night: { sky: C('#18213a'), hemiSky: C('#8fa4e0'), hemiGround: C('#1c1c2c'), hemi: 0.75, sun: C('#7f8cff'), sunI: 0.3, tint: C('#7a88c0'), fog: [14, 36], night: 1 },
};
// [time of day 0..1, state]; 0 = 6:00
const KEYS = [[0, 'dawn'], [0.06, 'day'], [0.52, 'day'], [0.6, 'dusk'], [0.68, 'night'], [0.93, 'night'], [1, 'dawn']];

export class DayNight {
  constructor({ scene, hemi, sun, world, mobs, player, inv, onPhase }) {
    Object.assign(this, { scene, hemi, sun, world, mobs, player, inv, onPhase });
    this.t = 0.04;
    this.night = 0;
    this.isNight = null;
    this.tint = new THREE.Color();
    this.sky = new THREE.Color();
    this.torch = new THREE.PointLight('#ffb35a', 0, 9, 1.3);
    scene.add(this.torch);
    this.clockEl = document.getElementById('clock');
  }

  get hours() { return (6 + this.t * 24) % 24; }

  sample() {
    let i = 0;
    while (i < KEYS.length - 2 && this.t >= KEYS[i + 1][0]) i++;
    const [t0, a] = KEYS[i], [t1, b] = KEYS[i + 1];
    const k = sstep(0, 1, (this.t - t0) / (t1 - t0 || 1));
    return [STATES[a], STATES[b], k];
  }

  update(dt, time) {
    this.t = (this.t + dt / DAY_LENGTH) % 1;
    const [A, B, k] = this.sample();
    this.night = A.night + (B.night - A.night) * k;
    this.sky.copy(A.sky).lerp(B.sky, k);
    this.scene.background.copy(this.sky);
    this.scene.fog.color.copy(this.sky);
    this.scene.fog.near = A.fog[0] + (B.fog[0] - A.fog[0]) * k;
    this.scene.fog.far = A.fog[1] + (B.fog[1] - A.fog[1]) * k;
    this.hemi.color.copy(A.hemiSky).lerp(B.hemiSky, k);
    this.hemi.groundColor.copy(A.hemiGround).lerp(B.hemiGround, k);
    this.hemi.intensity = A.hemi + (B.hemi - A.hemi) * k;
    this.sun.color.copy(A.sun).lerp(B.sun, k);
    this.sun.intensity = A.sunI + (B.sunI - A.sunI) * k;
    this.tint.copy(A.tint).lerp(B.tint, k);

    for (const m of this.world.tintMats) m.color.copy(this.tint);
    for (const m of this.mobs.tint) { m.color.copy(this.tint); if (m.userData.tint) m.color.multiply(m.userData.tint); if (m.userData.fx) m.color.multiply(m.userData.fx); }
    this.player.tint = this.tint;
    this.world.fireBoost = 1 + this.night * 0.8;

    // torch glow around the player at night
    const p = this.player;
    const want = this.inv.wearing('light') ? this.night * 7 : this.night * 1.2;
    this.torch.intensity += (want - this.torch.intensity) * Math.min(1, dt * 3);
    this.torch.distance = this.inv.wearing('light') ? 10 : 5;
    this.torch.position.set(p.x, this.world.heightAt(p.x, p.z) + 1.4 + Math.sin(time * 7) * 0.03, p.z);

    const nightNow = this.night > 0.6;
    if (nightNow !== this.isNight) {
      const first = this.isNight === null;
      this.isNight = nightNow;
      this.mobs.setNight(nightNow);
      if (!first) this.onPhase?.(nightNow);
    }

    if (this.clockEl) {
      const h = this.hours, hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 10) * 10;
      const label = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      if (this.clockEl.dataset.v !== label) {
        this.clockEl.dataset.v = label;
        this.clockEl.querySelector('span').textContent = label;
        this.clockEl.classList.toggle('night', this.night > 0.5);
      }
    }
  }

  // jump to morning (resting in the tent at night)
  skipToMorning() { this.t = 0.02; }
}
