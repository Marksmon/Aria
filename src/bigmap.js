// The big map: tap the minimap and the current map opens large. Its people, the portals (by the
// land they lead to) and the monsters that live there show as numbered markers, named in a list on
// the left. Tap a person or a portal, in the list or on the map, and the hero walks there (and
// talks, for a person); tap open ground and the hero walks to the nearest spot it can reach there.
// Monsters are only for reading: tapping one does nothing. Mini-bosses and the MVP say whether
// they are out. The game keeps running while the map is open; tap the
// minimap again, the × or Esc to close it.
import { ZONE_NAMES } from './world.js';
import { NPCS } from './quests.js';
import { MOB_DEFS } from './mobs.js';

const SIZE = 64; // a field is 64 x 64 paces; the minimap image draws 2 pixels a pace

export class BigMap {
  // deps: { world, player, mobs, spots, goal: () => {x, z} | null, go: (target) => void }
  constructor(deps) {
    Object.assign(this, deps);
    this.el = document.createElement('div');
    this.el.id = 'bigmap';
    this.el.className = 'ui-click';
    this.el.hidden = true;
    this.el.innerHTML = `<div class="bm-panel"><div class="bm-bar"><b class="bm-title"></b><span>Tap a place, a person or a portal to walk there</span><button class="bm-x" aria-label="Close">×</button></div>
      <div class="bm-main"><div class="bm-list"></div><div class="bm-body"><canvas width="512" height="512"></canvas><div class="bm-marks"></div></div></div></div>`;
    document.getElementById('hud').appendChild(this.el);
    this.canvas = this.el.querySelector('canvas');
    this.g = this.canvas.getContext('2d');
    this.list = this.el.querySelector('.bm-list');
    this.marks = this.el.querySelector('.bm-marks');
    this.el.querySelector('.bm-x').addEventListener('click', () => this.close());
    // a tap outside the panel closes it, like a window's ×
    this.el.addEventListener('click', (e) => { if (e.target === this.el) this.close(); });
    this.list.addEventListener('click', (e) => this.tapEntry(e));
    this.marks.addEventListener('click', (e) => this.tapEntry(e));
    this.canvas.addEventListener('click', (e) => this.tapGround(e));
    this.drawT = 0;
  }

  get open() { return !this.el.hidden; }
  toggle() { if (this.open) this.close(); else this.show(); }
  close() { this.el.hidden = true; }

  show() {
    this.el.hidden = false;
    this.mapId = this.world.id;
    this.el.querySelector('.bm-title').textContent = ZONE_NAMES[this.mapId] || 'Map';
    this.build();
    this.draw();
  }

  // everything worth a number: { kind: person | thing | portal | mob, name, x, z, ... }
  entries() {
    const out = [];
    for (const s of this.spots) {
      if (s.map !== this.mapId || !(s.npc || s.label)) continue;
      out.push({ kind: s.npc ? 'person' : 'thing', name: s.npc ? NPCS[s.npc].name : s.label, x: s.x, z: s.z, spot: s });
    }
    for (const p of this.world.portals) out.push({ kind: 'portal', name: `To ${ZONE_NAMES[p.to]}`, x: p.x, z: p.z, portal: p });
    // one entry for each kind of monster, at the home nearest the middle of where that kind lives
    const kinds = new Map();
    for (const m of this.mobs.list) {
      if (m.def.mvp || m.def.boss || m.leader || m.temp) continue; // bosses have their own entries below; guards and heralds come and go
      if (!kinds.has(m.type)) kinds.set(m.type, []);
      kinds.get(m.type).push(m.home);
    }
    const mobs = [];
    for (const [type, homes] of kinds) {
      const cx = homes.reduce((a, p) => a + p.x, 0) / homes.length, cz = homes.reduce((a, p) => a + p.z, 0) / homes.length;
      const at = homes.reduce((b, p) => (Math.hypot(p.x - cx, p.z - cz) < Math.hypot(b.x - cx, b.z - cz) ? p : b));
      mobs.push({ kind: 'mob', type, def: MOB_DEFS[type], x: at.x, z: at.z });
    }
    // the map's mini-boss and MVP: they roam, so their marker shows where they are, while they are out
    for (const type of this.mobs.bosses || []) {
      const b = this.mobs.list.find((m) => m.type === type && m.alive);
      mobs.push({ kind: 'mob', type, def: MOB_DEFS[type], x: b?.x, z: b?.z, mvp: !!MOB_DEFS[type].mvp });
    }
    mobs.sort((a, b) => a.def.lv - b.def.lv);
    for (const m of mobs) out.push({ ...m, name: m.def.name, boss: m.def.boss || m.mvp });
    return out;
  }

  build() {
    this.items = this.entries();
    const pct = (v) => `${(v / SIZE) * 100}%`;
    const groups = [['People', ['person', 'thing']], ['Portals', ['portal']], ['Monsters', ['mob']]];
    let list = '', marks = '';
    this.items.forEach((e, i) => {
      e.n = i + 1;
      const cls = `bm-mark ${e.kind}${e.boss ? ' boss' : ''}`;
      if (e.x !== undefined) marks += `<button class="${cls}" data-i="${i}" style="left:${pct(e.x)};top:${pct(e.z)}">${e.n}</button>`;
    });
    for (const [title, kinds] of groups) {
      const rows = this.items.filter((e) => kinds.includes(e.kind));
      if (!rows.length) continue;
      list += `<div class="bm-group">${title}</div>`;
      for (const e of rows) {
        const extra = e.kind === 'mob' ? ` <small>${e.mvp ? 'MVP · ' : ''}Lv ${e.def.lv}</small>${e.boss ? `<em class="bm-st" data-type="${e.type}"></em>` : ''}` : '';
        list += `<button class="bm-row ${e.kind}${e.boss ? ' boss' : ''}" data-i="${e.n - 1}"><i>${e.n}</i><span>${e.name}${extra}</span></button>`;
      }
    }
    this.list.innerHTML = list;
    this.marks.innerHTML = marks;
    this.status();
  }

  tapEntry(e) {
    const t = e.target.closest('[data-i]');
    if (!t) return;
    e.stopPropagation();
    const it = this.items[+t.dataset.i];
    if (!it || it.kind === 'mob') return; // monsters are only for reading
    if (it.portal) this.go({ x: it.portal.x, z: it.portal.z, reach: 0.05 });
    else this.go({ x: it.spot.x, z: it.spot.z, reach: 1.7, arrive: it.spot.run });
    this.close();
  }

  // open ground: walk to the nearest spot around the tap the hero can actually reach
  tapGround(e) {
    const r = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SIZE, z = ((e.clientY - r.top) / r.height) * SIZE;
    const spot = this.nearestReachable(x, z);
    if (!spot) return;
    this.go({ x: spot.x, z: spot.z, reach: 0.4 });
    this.close();
  }

  nearestReachable(x, z) {
    const p = this.player, ok = (px, pz) => px > 0.5 && pz > 0.5 && px < SIZE - 0.5 && pz < SIZE - 0.5
      && this.world.walkable(px, pz) && p.tiles?.path(p.x, p.z, px, pz);
    if (ok(x, z)) return { x, z };
    for (let r = 0.5; r <= 8; r += 0.5) {
      for (let a = 0; a < 16; a++) {
        const px = x + Math.cos((a / 16) * Math.PI * 2) * r, pz = z + Math.sin((a / 16) * Math.PI * 2) * r;
        if (ok(px, pz)) return { x: px, z: pz };
      }
    }
    return null;
  }

  // a mini-boss or MVP: only whether it is out now, not when it returns
  statusOf(type) {
    return this.mobs.list.some((m) => m.type === type && m.alive) ? { up: true, text: 'Spawned' } : { up: false, text: 'Not spawned' };
  }

  status() {
    for (const em of this.list.querySelectorAll('.bm-st')) {
      const st = this.statusOf(em.dataset.type);
      em.textContent = st.text;
      em.classList.toggle('down', !st.up);
    }
  }

  // the picture: the map, every monster about, where the story points, and the hero
  draw() {
    if (this.world.id !== this.mapId) { this.show(); return; } // stepped through a portal: show the new land
    const g = this.g, k = this.canvas.width / SIZE;
    g.imageSmoothingEnabled = false;
    g.drawImage(this.world.minimap, 0, 0, this.canvas.width, this.canvas.height);
    g.fillStyle = '#e8563a';
    for (const m of this.mobs.list) if (m.alive) g.fillRect(m.x * k - 3, m.z * k - 3, 6, 6);
    const goal = this.goal?.();
    if (goal) {
      g.strokeStyle = '#3b2a1e'; g.lineWidth = 7;
      g.beginPath(); g.arc(goal.x * k, goal.z * k, 14, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#ffd23a'; g.lineWidth = 3.5;
      g.beginPath(); g.arc(goal.x * k, goal.z * k, 14, 0, Math.PI * 2); g.stroke();
    }
    const p = this.player;
    g.fillStyle = '#fff'; g.strokeStyle = '#c8463c'; g.lineWidth = 4;
    g.beginPath(); g.arc(p.x * k, p.z * k, 8, 0, Math.PI * 2); g.fill(); g.stroke();
  }

  update(dt) {
    if (!this.open) return;
    this.drawT -= dt;
    if (this.drawT <= 0) {
      this.drawT = 0.2;
      this.draw();
      // a roaming boss: its marker follows it, and comes and goes as it falls and returns
      const now = (this.mobs.bosses || []).map((t) => this.mobs.list.find((m) => m.type === t && m.alive)).map((b) => (b ? `${b.x | 0},${b.z | 0}` : '-')).join('|');
      if (now !== this.bossKey) { this.bossKey = now; this.build(); } else this.status();
    }
  }
}
