import { ZONE_NAMES } from './world.js';
import { heartPath } from './sprites.js';

export class UI {
  constructor(world) {
    this.world = world;
    this.toast = document.getElementById('zone-toast');
    this.toastZone = this.toast.querySelector('.zone');
    this.mini = document.getElementById('minimap');
    this.mg = this.mini.getContext('2d');
    this.fpsEl = document.getElementById('fps');
    this.debug = new URLSearchParams(location.search).has('debug');
    if (this.debug) this.fpsEl.style.display = 'block';
    this.zone = null;
    this.zoneTimer = 0;
    this.toastTimer = null;
    this.miniTimer = 0;
    this.frames = 0;
    this.fpsT = 0;
    this.heartsEl = document.getElementById('hearts');
    this.hg = this.heartsEl.getContext('2d');
    this.hurtEl = document.getElementById('hurt');
    this.faintEl = document.getElementById('faint');
    this.lastHearts = '';
    this.mobs = null;
  }

  hurt() {
    this.hurtEl.classList.remove('show');
    void this.hurtEl.offsetWidth;
    this.hurtEl.classList.add('show');
  }

  faint(show) { this.faintEl.classList.toggle('show', show); }

  drawHearts(hp, maxHp) {
    const key = hp + '/' + maxHp;
    if (key === this.lastHearts) return;
    this.lastHearts = key;
    const g = this.hg, n = Math.ceil(maxHp / 2), size = 40, gap = 4;
    this.heartsEl.style.width = (n * (size + gap)) / 2 + 'px';
    g.clearRect(0, 0, 400, 44);
    for (let i = 0; i < n; i++) {
      const x = i * (size + gap) + size / 2 + 2, fill = Math.max(0, Math.min(2, hp - i * 2));
      heartPath(g, x, 3, size - 2);
      g.fillStyle = 'rgba(40,20,20,.55)'; g.fill();
      if (fill > 0) {
        g.save();
        heartPath(g, x, 3, size - 2);
        g.clip();
        g.fillStyle = '#e04a4a';
        g.fillRect(x - size / 2, 0, fill === 2 ? size : size / 2, 44);
        g.fillStyle = 'rgba(255,255,255,.5)';
        g.beginPath(); g.ellipse(x - 9, 13, 5, 4, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      heartPath(g, x, 3, size - 2);
      g.strokeStyle = '#2e2118'; g.lineWidth = 3.5; g.stroke();
    }
  }

  showZone(zone) {
    this.toastZone.textContent = ZONE_NAMES[zone];
    this.toast.classList.remove('show');
    void this.toast.offsetWidth; // restart the animation
    this.toast.classList.add('show');
  }

  update(dt, player, yaw) {
    this.drawHearts(player.hp, player.maxHp);
    this.zoneTimer -= dt;
    if (this.zoneTimer <= 0) {
      this.zoneTimer = 0.3;
      const z = this.world.zoneAt(player.x, player.z);
      if (z !== this.zone) {
        this.zone = z;
        this.showZone(z);
      }
    }

    this.miniTimer -= dt;
    if (this.miniTimer <= 0) {
      this.miniTimer = 0.1;
      const g = this.mg;
      g.drawImage(this.world.minimap, 0, 0);
      const px = player.x * 2, pz = player.z * 2;
      // camera view cone
      g.save();
      g.translate(px, pz);
      g.rotate(-yaw);
      g.fillStyle = 'rgba(255,255,255,.22)';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, -26); g.lineTo(14, -26); g.closePath(); g.fill();
      g.restore();
      if (this.mobs) {
        g.fillStyle = '#e8563a';
        for (const m of this.mobs.list) {
          if (!m.alive || Math.hypot(m.x - player.x, m.z - player.z) > 14) continue;
          g.fillRect(m.x * 2 - 1.5, m.z * 2 - 1.5, 3, 3);
        }
      }
      g.fillStyle = '#fff';
      g.strokeStyle = '#c8463c';
      g.lineWidth = 2;
      g.beginPath(); g.arc(px, pz, 3.2, 0, Math.PI * 2); g.fill(); g.stroke();
    }

    if (this.debug) {
      this.frames++;
      this.fpsT += dt;
      if (this.fpsT >= 0.5) {
        this.fpsEl.textContent = `${Math.round(this.frames / this.fpsT)} fps · ${player.x.toFixed(1)}, ${player.z.toFixed(1)} · ${this.zone}`;
        this.frames = 0;
        this.fpsT = 0;
      }
    }
  }
}
