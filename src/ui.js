import { ZONE_NAMES } from './world.js';

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
  }

  showZone(zone) {
    this.toastZone.textContent = ZONE_NAMES[zone];
    this.toast.classList.remove('show');
    void this.toast.offsetWidth; // restart the animation
    this.toast.classList.add('show');
  }

  update(dt, player, yaw) {
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
