'use strict';
/* Sentezlenmiş ses efektleri — hiçbir dış dosya yok */
const AU = {
  ctx: null, master: null, nodes: [], noise: null, muted: false,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.8;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp); comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = w; }
    this.noise = buf;
    const bb = this.ctx.createBuffer(1, len, this.ctx.sampleRate), bd = bb.getChannelData(0);
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; bd[i] = last * 3.5; }
    this.brown = bb;
  },
  get t() { return this.ctx ? this.ctx.currentTime : 0; },
  ok() { return this.ctx && !this.muted; },
  track(n) { this.nodes.push(n); return n; },
  stopAll() {
    for (const n of this.nodes) { try { n.stop ? n.stop() : n.disconnect(); } catch (e) { /* zaten durmuş */ } }
    this.nodes = [];
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.8; },

  src(buf, loop) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; return this.track(s); },
  gain(v) { const g = this.ctx.createGain(); g.gain.value = v; return g; },

  // sürekli tren gürültüsü: set(0..1)
  rumble() {
    if (!this.ctx) return { set() {} };
    const s = this.src(this.brown, true), lp = this.ctx.createBiquadFilter(), g = this.gain(0);
    lp.type = 'lowpass'; lp.frequency.value = 180;
    const s2 = this.src(this.noise, true), bp = this.ctx.createBiquadFilter(), g2 = this.gain(0);
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
    s.connect(lp); lp.connect(g); g.connect(this.master);
    s2.connect(bp); bp.connect(g2); g2.connect(this.master);
    s.start(); s2.start();
    let clack = 0;
    return {
      set: (v, speed) => {
        const t = this.t;
        g.gain.setTargetAtTime(v * 1.1, t, 0.08);
        g2.gain.setTargetAtTime(v * v * 0.25, t, 0.08);
        lp.frequency.setTargetAtTime(120 + v * 260, t, 0.1);
        if (speed > 2 && v > 0.15 && t > clack) { this.clack(v * 0.5); clack = t + clamp(9 / speed, 0.08, 1.2); }
      }
    };
  },
  clack(v) {
    if (!this.ok()) return;
    const t = this.t;
    for (let i = 0; i < 2; i++) {
      const s = this.src(this.noise), f = this.ctx.createBiquadFilter(), g = this.gain(0);
      f.type = 'bandpass'; f.frequency.value = 260; f.Q.value = 2;
      s.connect(f); f.connect(g); g.connect(this.master);
      const t0 = t + i * 0.11;
      g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
      s.start(t0, Math.random()); s.stop(t0 + 0.12);
    }
  },
  horn(dur, vol, pitch) {
    if (!this.ok()) return;
    const t = this.t, p = pitch || 1, g = this.gain(0), lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2200;
    lp.connect(g); g.connect(this.master);
    for (const fr of [311, 370, 466]) {
      const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr * p;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.3); this.track(o);
    }
    const v = (vol || 1) * 0.16;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.06);
    g.gain.setValueAtTime(v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.25);
  },
  screech(dur, vol) {
    if (!this.ok()) return;
    const t = this.t, s = this.src(this.noise, true), bp = this.ctx.createBiquadFilter(), g = this.gain(0);
    bp.type = 'bandpass'; bp.frequency.value = 3400; bp.Q.value = 18;
    s.connect(bp); bp.connect(g); g.connect(this.master);
    const o = this.ctx.createOscillator(), og = this.gain(0), lfo = this.ctx.createOscillator(), lg = this.gain(60);
    o.type = 'square'; o.frequency.value = 2900; lfo.frequency.value = 7;
    lfo.connect(lg); lg.connect(o.frequency); o.connect(og); og.connect(this.master);
    const v = vol || 1;
    g.gain.linearRampToValueAtTime(0.9 * v, t + 0.3); og.gain.linearRampToValueAtTime(0.015 * v, t + 0.4);
    g.gain.setValueAtTime(0.9 * v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.8);
    og.gain.setValueAtTime(0.015 * v, t + dur); og.gain.linearRampToValueAtTime(0, t + dur + 0.8);
    s.start(t); s.stop(t + dur + 1); o.start(t); o.stop(t + dur + 1); lfo.start(t); lfo.stop(t + dur + 1);
    this.track(o); this.track(lfo);
  },
  impact(vol, metal) {
    if (!this.ok()) return;
    const t = this.t, v = vol || 1;
    const s = this.src(this.noise), lp = this.ctx.createBiquadFilter(), g = this.gain(0);
    lp.type = 'lowpass'; lp.frequency.value = metal ? 3000 : 900;
    s.connect(lp); lp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(1.4 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + (metal ? 1.2 : 0.5));
    s.start(t); s.stop(t + 1.3);
    const o = this.ctx.createOscillator(), og = this.gain(0);
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    o.connect(og); og.connect(this.master);
    og.gain.setValueAtTime(0.9 * v, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.start(t); o.stop(t + 0.6); this.track(o);
    if (metal) for (const fr of [420, 777, 1210]) {
      const m = this.ctx.createOscillator(), mg = this.gain(0);
      m.type = 'triangle'; m.frequency.value = fr; m.connect(mg); mg.connect(this.master);
      mg.gain.setValueAtTime(0.06 * v, t); mg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      m.start(t); m.stop(t + 1.2); this.track(m);
    }
  },
  bell(dur) {
    if (!this.ok()) return;
    const t0 = this.t;
    for (let i = 0; i * 0.5 < dur; i++) {
      const t = t0 + i * 0.5, o = this.ctx.createOscillator(), g = this.gain(0);
      o.type = 'triangle'; o.frequency.value = 1180;
      o.connect(g); g.connect(this.master);
      g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.start(t); o.stop(t + 0.4); this.track(o);
    }
  },
  arc(dur) {
    if (!this.ok()) return;
    const t = this.t, s = this.src(this.noise, true), hp = this.ctx.createBiquadFilter(), g = this.gain(0);
    hp.type = 'highpass'; hp.frequency.value = 1200;
    s.connect(hp); hp.connect(g); g.connect(this.master);
    for (let i = 0; i < dur * 30; i++) g.gain.setValueAtTime(Math.random() < 0.5 ? rnd(0.3, 1.2) : 0.02, t + i / 30);
    g.gain.setValueAtTime(0, t + dur);
    s.start(t); s.stop(t + dur + 0.1);
    const o = this.ctx.createOscillator(), og = this.gain(0.12);
    o.type = 'square'; o.frequency.value = 100; o.connect(og); og.connect(this.master);
    og.gain.setValueAtTime(0.12, t); og.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur); this.track(o);
    this.impact(0.9, false);
  },
  chime() {
    if (!this.ok()) return;
    const t = this.t;
    [[659, 0], [523, 0.45]].forEach(([fr, d]) => {
      const o = this.ctx.createOscillator(), g = this.gain(0);
      o.type = 'sine'; o.frequency.value = fr; o.connect(g); g.connect(this.master);
      g.gain.setValueAtTime(0.18, t + d); g.gain.exponentialRampToValueAtTime(0.001, t + d + 1.2);
      o.start(t + d); o.stop(t + d + 1.3); this.track(o);
    });
  },
  beeps(n) {
    if (!this.ok()) return;
    const t = this.t;
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator(), g = this.gain(0);
      o.type = 'square'; o.frequency.value = 1600; o.connect(g); g.connect(this.master);
      g.gain.setValueAtTime(0.05, t + i * 0.28); g.gain.setValueAtTime(0, t + i * 0.28 + 0.14);
      o.start(t + i * 0.28); o.stop(t + i * 0.28 + 0.16); this.track(o);
    }
  },
  splash() {
    if (!this.ok()) return;
    const t = this.t, s = this.src(this.noise), lp = this.ctx.createBiquadFilter(), g = this.gain(0);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(2500, t); lp.frequency.exponentialRampToValueAtTime(300, t + 1);
    s.connect(lp); lp.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(1.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    s.start(t); s.stop(t + 1.3);
  },
  couplers(n) {
    if (!this.ok()) return;
    for (let i = 0; i < n; i++) {
      const t = this.t + i * 0.16, s = this.src(this.noise), bp = this.ctx.createBiquadFilter(), g = this.gain(0);
      bp.type = 'bandpass'; bp.frequency.value = 600 + Math.random() * 300; bp.Q.value = 4;
      s.connect(bp); bp.connect(g); g.connect(this.master);
      const v = 0.9 * (1 - i / (n + 2));
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      s.start(t, Math.random()); s.stop(t + 0.3);
    }
  },
  wind(v) {
    if (!this.ctx) return { set() {} };
    const s = this.src(this.noise, true), lp = this.ctx.createBiquadFilter(), g = this.gain(v || 0.05);
    lp.type = 'lowpass'; lp.frequency.value = 500;
    s.connect(lp); lp.connect(g); g.connect(this.master); s.start();
    return { set: (x) => g.gain.setTargetAtTime(x, this.t, 0.2) };
  },
  shout() {
    if (!this.ok()) return;
    const t = this.t, o = this.ctx.createOscillator(), f = this.ctx.createBiquadFilter(), g = this.gain(0);
    o.type = 'sawtooth'; o.frequency.setValueAtTime(260, t); o.frequency.linearRampToValueAtTime(330, t + 0.25); o.frequency.linearRampToValueAtTime(240, t + 0.7);
    f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 3;
    o.connect(f); f.connect(g); g.connect(this.master);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.05); g.gain.linearRampToValueAtTime(0, t + 0.75);
    o.start(t); o.stop(t + 0.8); this.track(o);
  },
};
