// All sound is synthesized with Web Audio: no files to ship, works offline in the APK.
const PENTA_DAY = [62, 64, 66, 69, 71, 74, 76, 78, 81];   // D major pentatonic (MIDI)
const PENTA_NIGHT = [57, 60, 62, 64, 67, 69, 72, 74];     // A minor pentatonic
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.night = 0;
    this.nextNote = 0;
    this.lastStep = 0;
    try { this.enabled = localStorage.getItem('aibachu.sound') !== 'off'; } catch { /* ignore */ }
  }

  // must be called from a user gesture
  start() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = (this.ctx = new AC());
    this.master = c.createGain();
    this.master.gain.value = this.enabled ? 0.8 : 0;
    this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.7; this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = 0.22; this.music.connect(this.master);
    // a little room for the music
    const delay = c.createDelay(); delay.delayTime.value = 0.32;
    const fb = c.createGain(); fb.gain.value = 0.28;
    const wet = c.createGain(); wet.gain.value = 0.35;
    this.music.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(this.master);
    const len = c.sampleRate * 0.6;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.startPad();
  }

  setEnabled(on) {
    this.enabled = on;
    try { localStorage.setItem('aibachu.sound', on ? 'on' : 'off'); } catch { /* ignore */ }
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.05);
  }

  // ---------- building blocks ----------
  tone({ type = 'sine', f0 = 440, f1 = f0, dur = 0.2, vol = 0.3, at = 0, attack = 0.005, out = this.sfx, filter }) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) {
      const bq = c.createBiquadFilter(); bq.type = 'lowpass'; bq.frequency.value = filter;
      o.connect(bq); node = bq;
    }
    node.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }

  noise({ dur = 0.15, vol = 0.3, f0 = 1200, f1 = f0, q = 1, at = 0, type = 'bandpass' }) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const bq = c.createBiquadFilter(); bq.type = type; bq.Q.value = q;
    bq.frequency.setValueAtTime(f0, t);
    bq.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bq); bq.connect(g); g.connect(this.sfx);
    s.start(t); s.stop(t + dur + 0.05);
  }

  // ---------- sound effects ----------
  play(name) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'swing': this.noise({ dur: 0.13, vol: 0.35, f0: 2400, f1: 700, q: 1.4 }); break;
      case 'hit':
        this.tone({ type: 'triangle', f0: 180, f1: 70, dur: 0.12, vol: 0.5 });
        this.noise({ dur: 0.05, vol: 0.4, f0: 3000, f1: 1500, q: 0.8 });
        break;
      case 'kill':
        this.tone({ type: 'triangle', f0: 500, f1: 1300, dur: 0.12, vol: 0.3 });
        this.noise({ dur: 0.22, vol: 0.22, f0: 900, f1: 300, q: 0.6, at: 0.03 });
        break;
      case 'pickup':
        this.tone({ type: 'triangle', f0: 1046, dur: 0.09, vol: 0.18 });
        this.tone({ type: 'triangle', f0: 1568, dur: 0.14, vol: 0.18, at: 0.06 });
        break;
      case 'heart':
        [784, 988, 1318].forEach((f, i) => this.tone({ type: 'sine', f0: f, dur: 0.16, vol: 0.2, at: i * 0.06 }));
        break;
      case 'hurt':
        this.tone({ type: 'square', f0: 260, f1: 110, dur: 0.18, vol: 0.18, filter: 1500 });
        break;
      case 'dodge': this.noise({ dur: 0.22, vol: 0.25, f0: 500, f1: 1800, q: 0.7 }); break;
      case 'craft':
        [523, 659, 784, 1046].forEach((f, i) => this.tone({ type: 'sine', f0: f, dur: 0.5, vol: 0.18, at: i * 0.08 }));
        break;
      case 'spore': this.noise({ dur: 0.4, vol: 0.2, f0: 400, f1: 1200, q: 0.5, type: 'lowpass' }); break;
      case 'ui': this.tone({ type: 'sine', f0: 660, dur: 0.06, vol: 0.12 }); break;
      case 'faint': [392, 330, 262].forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.4, vol: 0.22, at: i * 0.18 })); break;
      case 'night': this.tone({ type: 'sine', f0: 220, dur: 2.2, vol: 0.22, attack: 0.05 }); this.tone({ type: 'sine', f0: 330, dur: 2.2, vol: 0.12, attack: 0.05, at: 0.1 }); break;
      case 'morning': [587, 740, 880, 1175].forEach((f, i) => this.tone({ type: 'sine', f0: f, dur: 0.9, vol: 0.14, at: i * 0.12 })); break;
      case 'step': this.noise({ dur: 0.05, vol: 0.06, f0: 500, f1: 300, q: 1 }); break;
    }
  }

  // ---------- music ----------
  startPad() {
    const c = this.ctx;
    this.pad = c.createGain();
    this.pad.gain.value = 0.0001;
    this.pad.connect(this.music);
    this.padOsc = [50, 57].map((n) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = midi(n);
      const g = c.createGain(); g.gain.value = 0.25;
      o.connect(g); g.connect(this.pad); o.start();
      return o;
    });
    this.pad.gain.setTargetAtTime(0.35, c.currentTime, 2);
  }

  pluck(note, vol = 0.22) {
    const f = midi(note);
    this.tone({ type: 'triangle', f0: f, dur: 1.4, vol, attack: 0.004, out: this.music, filter: 2400 });
    this.tone({ type: 'sine', f0: f * 2, dur: 0.6, vol: vol * 0.25, attack: 0.004, out: this.music });
  }

  update(dt, night) {
    if (!this.ctx || !this.enabled) return;
    this.night += (night - this.night) * Math.min(1, dt * 0.5);
    const now = this.ctx.currentTime;
    // drone shifts from D to A minor-ish at night
    const root = this.night > 0.5 ? 45 : 50;
    this.padOsc[0].frequency.setTargetAtTime(midi(root), now, 1.5);
    this.padOsc[1].frequency.setTargetAtTime(midi(root + 7), now, 1.5);
    if (now >= this.nextNote) {
      const scale = this.night > 0.5 ? PENTA_NIGHT : PENTA_DAY;
      const beat = this.night > 0.5 ? 0.62 : 0.42;
      if (Math.random() < 0.62) {
        this.cur = Math.max(0, Math.min(scale.length - 1, (this.cur ?? 3) + Math.floor(Math.random() * 5) - 2));
        this.pluck(scale[this.cur], 0.16 + Math.random() * 0.08);
        if (Math.random() < 0.18) this.pluck(scale[Math.max(0, this.cur - 2)] - 12, 0.12);
      }
      this.nextNote = now + beat * (Math.random() < 0.15 ? 2 : 1);
    }
  }
}
