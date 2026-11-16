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
    this.infoEl = document.getElementById('info');
    this.lastInfo = '';
    this.hurtEl = document.getElementById('hurt');
    this.faintEl = document.getElementById('faint');
    this.mobs = null;
    this.prog = null;
    this.jobName = () => 'Trainee';
    this.heroName = () => ''; // the name chosen with the look
  }

  hurt() {
    this.hurtEl.classList.remove('show');
    void this.hurtEl.offsetWidth;
    this.hurtEl.classList.add('show');
  }

  faint(show, text) {
    if (text) this.faintEl.querySelector('small').textContent = text;
    this.faintEl.classList.toggle('show', show);
  }

  // the job line keeps its levels whole on any phone's font (November 2026: on some fonts "BladeMaster Lv 80 · J..."): the
  // levels shrink a point at a time, then the job's name, and at the last the levels go short ("80 · J40")
  fitWho() {
    const who = this.infoEl.querySelector('.who'), lv = who.querySelector('.lv'), jn = who.querySelector('.jobname');
    lv.style.fontSize = jn.style.fontSize = '';
    const full = lv.textContent.replace(/^(\d+) · J(\d+)$/, 'Lv $1 · Job $2'), over = () => lv.scrollWidth > lv.clientWidth + 0.5;
    lv.textContent = full;
    for (let f = parseFloat(getComputedStyle(lv).fontSize); over() && f > 10.5; f -= 0.5) lv.style.fontSize = `${f - 0.5}px`;
    for (let f = parseFloat(getComputedStyle(jn).fontSize); over() && f > 11; f -= 0.5) jn.style.fontSize = `${f - 0.5}px`;
    if (over()) lv.textContent = full.replace(/^Lv (\d+) · Job (\d+)$/, '$1 · J$2');
  }
  // Ragnarok's basic info window: job, levels, HP / SP bars and EXP to the next levels
  drawInfo(p, prog, jobName, heroName = '') {
    const pct = (a, b, maxed) => (maxed ? 100 : Math.min(100, (a / b) * 100));
    const bp = pct(prog.baseExp, prog.baseNeed, prog.baseMaxed), jp = pct(prog.jobExp, prog.jobNeed, prog.jobMaxed);
    const key = [p.hp, p.maxHp, p.sp, p.maxSp, prog.baseLv, prog.jobLv, bp.toFixed(1), jp.toFixed(1), jobName, prog.statPoints, prog.skillPoints, heroName].join('/');
    if (key === this.lastInfo) return;
    this.lastInfo = key;
    const el = this.infoEl;
    const nm = el.querySelector('.heroname');
    nm.textContent = heroName;
    nm.hidden = !heroName;
    document.body.classList.toggle('named', !!heroName); // the buttons and toasts under the panel move down a line
    el.querySelector('.jobname').textContent = jobName;
    el.querySelector('.who').classList.toggle('long', jobName.length > 8);
    el.querySelector('.lv').textContent = `Lv ${prog.baseLv} · Job ${prog.jobLv}`;
    el.querySelector('.who em').hidden = prog.statPoints <= 0 && prog.skillPoints <= 0;
    const whoKey = [prog.baseLv, prog.jobLv, jobName, prog.statPoints > 0 || prog.skillPoints > 0, heroName].join('/');
    if (whoKey !== this.lastWho) { this.lastWho = whoKey; this.fitWho(); } // (only when the line changes: fitting measures the page)
    const bar = (cls, v, max, label) => {
      el.querySelector(`.${cls} i`).style.width = `${(v / max) * 100}%`;
      el.querySelector(`.${cls} span`).textContent = `${label} ${v} / ${max}`;
    };
    bar('hp', p.hp, p.maxHp, 'HP');
    bar('sp', p.sp, p.maxSp, 'SP');
    el.querySelector('.hp').classList.toggle('low', p.hp / p.maxHp < 0.25);
    el.querySelector('.base s').style.width = bp + '%';
    el.querySelector('.base em').textContent = bp.toFixed(1) + '%';
    el.querySelector('.job s').style.width = jp + '%';
    el.querySelector('.job em').textContent = jp.toFixed(1) + '%';
  }

  showZone(zone) {
    this.toastZone.textContent = ZONE_NAMES[zone];
    this.toast.classList.remove('show');
    void this.toast.offsetWidth; // restart the animation
    this.toast.classList.add('show');
  }

  update(dt, player, yaw) {
    if (this.prog) this.drawInfo(player, this.prog, this.jobName(), this.heroName());
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
      g.drawImage(this.mapImage?.() || this.world.minimap, 0, 0); // (a maze: only what the hero has seen, explored.js)
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
      if (this.goal) { // where the story leads: a pulsing gold ring
        const r = 4 + Math.sin(performance.now() / 180) * 1.5;
        g.strokeStyle = '#3b2a1e'; g.lineWidth = 4;
        g.beginPath(); g.arc(this.goal.x * 2, this.goal.z * 2, r, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = '#ffd23a'; g.lineWidth = 2;
        g.beginPath(); g.arc(this.goal.x * 2, this.goal.z * 2, r, 0, Math.PI * 2); g.stroke();
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
