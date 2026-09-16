'use strict';
/* Ortak sahne yardımcıları + kayıt 1–4 */
const SCENES = [];

function roadY(z) { return 0.5 * (1 - sstep((Math.abs(z) - 2.6) / 5)); }

function noiseFor(S, trains, gain) {
  let best = 0, sp = 0;
  for (const tr of trains) {
    const [a, b] = trainSpan(tr);
    const dx = Math.max(a - S.cam.x, 0, S.cam.x - b);
    const d = Math.hypot(dx, tr.z - S.cam.z), v = Math.abs(tr.v || 0);
    const k = Math.pow(clamp(1 - d / 280, 0, 1), 2) * clamp(v / 20, 0.12, 1) * (gain || 1);
    if (k > best) { best = k; sp = v; }
  }
  if (S.rum) S.rum.set(best, sp);
}

function burst(S, x, y, z, n, o) {
  const s = o.s || 4;
  for (let i = 0; i < n; i++) S.parts.add({
    x, y, z, vx: (o.vx || 0) + rnd(-1, 1) * s, vy: rnd(0.3, 1) * s * 0.8, vz: (o.vz || 0) + rnd(-1, 1) * s,
    life: rnd(0.4, o.life || 1.5), size: rnd(0.02, o.size || 0.07), col: o.col || [200, 205, 210],
    floor: o.floor == null ? 0.05 : o.floor, add: !!o.add, g: o.g == null ? 9.8 : o.g, drag: o.drag || 0,
  });
}

function brakeSparks(S, tr, dt) {
  if (!tr.v || tr.v < 1.5 || Math.random() > dt * 40) return;
  const off = rnd(1, Math.min(trainLen(tr), 70));
  S.parts.add({ x: tr.x - tr.dir * off, y: 0.55, z: tr.z + (Math.random() < 0.5 ? -0.72 : 0.72), vx: tr.dir * rnd(2, 6), vy: rnd(0.3, 1.6), vz: rnd(-1, 1), life: rnd(0.12, 0.35), size: 0.03, col: [255, 186, 90], add: true });
}

function shadow(x, z, r, y) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; pts.push([x + Math.cos(a) * r, (y || 0) + 0.02, z + Math.sin(a) * r * 0.8]); }
  face(pts, 'rgba(0,0,0,0.25)');
}

function telePoles(L, z, x0, x1, sp, h) {
  const xs = [];
  for (let x = x0; x <= x1; x += sp) {
    xs.push(x);
    L.push({ k: adist(x - 0.2, x + 0.2, 0, h, z - 0.8, z + 0.8), d: () => {
      line3([x, 0, z], [x, h, z], [88, 72, 58], 0.22, 1);
      line3([x, h - 0.4, z - 0.75], [x, h - 0.4, z + 0.75], [88, 72, 58], 0.1, 1);
    } });
  }
  return () => {
    for (let i = 0; i < xs.length - 1; i++) for (const dz of [-0.6, 0.6]) {
      const m = (xs[i] + xs[i + 1]) / 2;
      line3([xs[i], h - 0.45, z + dz], [m, h - 0.85, z + dz], [40, 40, 40], 0.015, 0.6);
      line3([m, h - 0.85, z + dz], [xs[i + 1], h - 0.45, z + dz], [40, 40, 40], 0.015, 0.6);
    }
  };
}

function signalPost(L, x, z, aspect) {
  L.push({ k: adist(x - 0.3, x + 0.3, 0, 5, z - 0.3, z + 0.3), d: () => {
    line3([x, 0, z], [x, 3.8, z], [66, 66, 66], 0.14, 1);
    box({ x, z, y: 3.7, w: 0.22, d: 0.5, h: 1.2, col: [26, 26, 26] });
    disc(x - 0.13, 4.6, z, 0.1, aspect === 'green' ? [80, 255, 140] : [30, 50, 40], aspect === 'green' ? 1.6 : 1, 1.4);
    disc(x - 0.13, 4.2, z, 0.1, aspect === 'red' ? [255, 60, 44] : [60, 30, 28], aspect === 'red' ? 1.6 : 1, 1.4);
  } });
}

function scatterTrees(seed, n, x0, x1, zBands, avoid) {
  const r = srand(seed), out = [];
  while (out.length < n) {
    const band = zBands[(r() * zBands.length) | 0];
    const x = x0 + r() * (x1 - x0), z = band[0] + r() * (band[1] - band[0]);
    if (avoid && avoid(x, z)) continue;
    out.push([x, z, 0.75 + r() * 0.8, (r() * 1e6) | 0]);
  }
  return out;
}

function updItems(S, dt) {
  for (const it of S.items) {
    if (it.rest) continue;
    it.vy -= 9.8 * dt;
    it.x += it.vx * dt; it.y += it.vy * dt; it.z += it.vz * dt; it.yaw += (it.vr || 0) * dt;
    const fl = it.floor != null ? it.floor : 0.05;
    if (it.y < fl) {
      it.y = fl; it.vy *= -0.25; it.vx *= 0.45; it.vz *= 0.45; it.vr = (it.vr || 0) * 0.5;
      if (Math.abs(it.vy) < 0.5 && Math.hypot(it.vx, it.vz) < 0.3) it.rest = true;
    }
  }
}
function itemDrawables(L, S) {
  for (const it of S.items || []) if (!it.hidden) L.push({ k: adist(it.x - 0.3, it.x + 0.3, it.y, it.y + 0.3, it.z - 0.3, it.z + 0.3) - 0.1, d: () => box({ x: it.x, z: it.z, y: it.y, w: it.w, d: it.d, h: it.h, yaw: it.yaw || 0, col: it.col }) });
}
function lights(L) { for (const it of L) if (it.light) it.light(); }
function face2(x0, x1, z0, z1, y, col, f, tex) { face([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], col, f == null ? lightF(0, 1, 0) : f, true, tex == null ? 0.8 : tex); }

/* =====================================================================
   K-01  Hemzemin geçit: bariyerin etrafından dolanan otomobil
   ===================================================================== */
const K01_CAR = [[4.0, 1.75, -8.8, 0], [7.4, 1.75, -8.5, 0], [8.3, 0.7, -6.8, -0.5], [9.1, -1.3, -4.0, -0.25], [9.9, -1.6, -0.8, 0], [10.6, -1.6, 0.1, 0]];

SCENES.push({
  title: 'Bariyerin etrafından', place: 'Hemzemin geçit, KM 214+630', placeShort: 'HEMZ. GEÇİT KM 214+630',
  camLabel: 'KAM-03', kind: 'cctv', stamp: '2026-02-11 18:47:12', dur: 17, danger: [7.4, 9.9], preview: 6.2,
  outcome: 'ÖLÜM', victim: 'Otomobil sürücüsü, 34 yaşında',
  cue: 'sürücü inik bariyerin etrafından dolanmak için karşı şeride geçtiğinde',
  q: {
    text: 'Sürücü ne yapmalıydı?',
    opts: [
      'Işıklar yanıp bariyer inikken beklemeli, bariyer tamamen kalkana kadar geçmemeliydi.',
      'Tren henüz uzaktaysa hızlanıp geçmeliydi.',
      'Korna çalıp ışık yakarak makinisti uyarmalıydı.',
      'Karşı şeritte araç yoksa bariyerin yanından geçebilirdi.',
    ],
    why: 'Işıklar yanıp bariyer indiğinde tren birkaç saniye içinde geçitte olur. Uzaktan gelen bir trenin hızını ve mesafesini gözle tahmin etmek neredeyse imkânsızdır.',
  },
  rule: 'Bariyer inikken, ışıklar yanıp sönerken asla geçme.',
  fact: '100 km/s hızla giden bir tren acil frenle bile durmak için yüzlerce metreye ihtiyaç duyar. Makinist aracı gördüğünde çoğu zaman yapabileceği tek şey korna çalmaktır.',

  init(S) {
    S.env = mkEnv({ sky: ['#29323f', '#a47f66'], ground: ['#403f37', '#262723'], fog: [104, 96, 94], fogD: 260, lum: 0.64, amb: 0.6, night: true, L: nrm(-0.6, 0.35, 0.5) });
    S.cam = new Cam({ x: 14, y: 6.5, z: -20, yaw: -0.8, pitch: -0.22, F: 760 });
    S.plan = trainPlan({ v: 25, brakeAt: 9.2, decel: 1.1, tImpact: 10.6, xImpact: -2.5 });
    S.tr = mkTrain({ z: 0, cars: ['loco_e', 'pass', 'pass', 'pass'] });
    S.car = { x: 1.75, z: -16, yaw: 0, y: 0, col: [156, 160, 166] };
    S.car2 = { x: -1.75, z: 11, yaw: PI, y: 0, col: [58, 64, 96] };
    S.trees = scatterTrees(11, 28, -160, 60, [[-40, -9], [9, 60]], (x, z) => Math.abs(x) < 8 || (x > 2 && z < -5));
    S.rum = AU.rumble();
    S.barA = 1.45;
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, c = S.car;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    S.lights = t > 0.6;
    if (S.at('bell', 0.6)) AU.bell(16.5);
    S.barA = lerp(1.45, 0, sstep((t - 1.6) / 3.4));
    if (S.at('horn', 8.4)) AU.horn(2.3, 1);
    if (S.at('brake', 9.2)) AU.screech(7, 0.9);
    if (!S.hit) {
      if (t < 4) { const u = t / 4; c.x = 1.75; c.z = -16 + 7.2 * (1 - (1 - u) * (1 - u)); c.yaw = 0; }
      else { const v = kf(K01_CAR, t); c.x = v[0]; c.z = v[1]; c.yaw = v[2]; }
      if (tr.x >= c.x - 0.95) {
        S.hit = true;
        AU.impact(1.4, true); S.shake = 1.1; S.glitch = 0.35;
        c.vx = tr.v * 1.1; c.vz = 1.2; c.vr = 3.4;
        burst(S, c.x - 0.9, 1.0, c.z, 40, { vx: tr.v * 0.6, s: 3.5, col: [200, 220, 230], size: 0.05, life: 1.4 });
        burst(S, c.x - 0.9, 0.8, c.z, 18, { vx: tr.v * 0.8, s: 5, col: [255, 200, 120], add: true, life: 0.5 });
      }
    } else {
      c.x += c.vx * dt; c.z += c.vz * dt; c.yaw += c.vr * dt;
      c.vx = Math.max(0, c.vx - 5 * dt); c.vz *= Math.pow(0.4, dt); c.vr *= Math.pow(0.45, dt);
      if (c.x < tr.x + 1.6) { c.x = tr.x + 1.6; c.vx = Math.max(c.vx, tr.v); }
      if (Math.random() < dt * 20) burst(S, c.x - 1, 0.4, c.z, 2, { vx: c.vx * 0.5, s: 2, col: [255, 180, 90], add: true, life: 0.3 });
    }
    c.y = roadY(c.z);
    if (t > 9.2) brakeSparks(S, tr, dt);
    noiseFor(S, [tr]);
  },

  draw(S) {
    const t = S.t, tr = S.tr;
    skyGround(S.env);
    hills(3, [74, 70, 76], 650, 38);
    trackBed(0); rails(0);
    for (let z = -40; z < 120; z += 1.5) {
      const y0 = roadY(z) + 0.012, y1 = roadY(z + 1.5) + 0.012;
      face([[-3.6, y0, z], [3.6, y0, z], [3.6, y1, z + 1.5], [-3.6, y1, z + 1.5]], [70, 70, 72], lightF(0, 1, 0), true);
    }
    for (let z = -38; z < 120; z += 4) { if (Math.abs(z) < 9) continue; face2(-0.07, 0.07, z, z + 2, roadY(z) + 0.03, [205, 205, 196], 1); }
    face2(0, 3.5, -7.3, -6.9, 0.03, [216, 216, 206], 1);
    face2(-3.5, 0, 6.9, 7.3, 0.03, [216, 216, 206], 1);
    for (const rz of [-0.7175, 0.7175]) line3([-3.6, 0.53, rz], [3.6, 0.53, rz], [170, 166, 156], 0.07, 1);

    const L = [];
    const wires = catenary(L, 0, -1, 50, 25);
    trainDrawables(L, tr);
    L.push({ k: adist(0, 4.4, 0, 3.4, -5, -3.6), d: () => barrier(4.2, -4.2, 3.9, -1, S.barA, S.lights, t) });
    L.push({ k: adist(-4.4, 0, 0, 3.4, 3.6, 5), d: () => barrier(-4.2, 4.2, 3.9, 1, S.barA, S.lights, t) });
    for (const c of [S.car, S.car2]) L.push({ k: adist(c.x - 2.2, c.x + 2.2, 0, 1.6, c.z - 2.2, c.z + 2.2), d: () => drawCar(c) });
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    building(L, 26, 30, 9, 7, 5.5, [150, 140, 126], [214, 176, 108]);
    lampPost(L, 6.2, -6.5, 7, true);
    sortDraw(L);
    wires();
    lights(L);
    trainLights(tr);
    for (const s of [-0.62, 0.62]) {
      const [hx, hz] = offs(S.car2, 2.15, s);
      glow(hx, 0.6, hz, 1.6, '255,244,210', 0.8, 4);
      if (!S.hit) { const [bx, bz] = offs(S.car, -2.2, s); glow(bx, 0.55, bz, t > 3.5 && t < 7.5 ? 1.2 : 0.7, '255,40,30', 0.8, 3); }
    }
  },
});

/* =====================================================================
   K-02  Katener: vagonun üstüne çıkan genç
   ===================================================================== */
SCENES.push({
  title: 'Vagonun üstünde fotoğraf', place: 'Yük garı, 3 numaralı yol', placeShort: 'YÜK GARI YOL-3',
  camLabel: 'KAM-11', kind: 'cctv', stamp: '2026-05-23 21:18:40', dur: 17, danger: [3.6, 9.7], preview: 6.2,
  outcome: 'AĞIR YARALI', victim: 'Vagonun üstüne çıkan 16 yaşındaki genç',
  cue: 'genç, elektrikli hattın altındaki vagona tırmanmaya başladığında',
  q: {
    text: 'Genci ne yaraladı?',
    opts: [
      'Katener telindeki 25.000 volt: tele dokunmadan, yaklaşınca ark oluştu.',
      'Çatıdan kayıp düşmesi; duran vagonların üstündeki teller enerjisizdir.',
      'Telefonunun bataryasının patlaması.',
      'Vagonun metal gövdesinde biriken statik elektrik.',
    ],
    why: 'Katener hattı üzerinde tren olmasa da sürekli enerjilidir. Yüksek gerilim havadan atlayabildiği için tele yaklaşmak bile yetebilir. Vagonların, direklerin ve sinyal direklerinin üstüne asla çıkılmamalıdır.',
  },
  rule: 'Elektrikli hatlarda vagona, direğe ya da sinyal direğine asla tırmanma.',
  fact: 'Türkiye\'deki elektrikli ana hatlarda katener gerilimi 25.000 volttur (25 kV, 50 Hz). Bu, evdeki prizin 100 katından fazladır.',

  init(S) {
    S.env = mkEnv({ sky: ['#121822', '#3b3f4c'], ground: ['#2c2d2a', '#1a1b19'], fog: [44, 48, 56], fogD: 200, fogMax: 0.92, lum: 0.55, amb: 0.7, night: true, L: nrm(0.3, 0.8, -0.5) });
    S.cam = new Cam({ x: -13, y: 7, z: -15, yaw: 0.55, pitch: -0.24, F: 740 });
    S.tr = mkTrain({ x: 20, z: 0, cars: ['box', 'box', 'box'], lights: false });
    S.tr2 = mkTrain({ x: 36, z: 5, cars: ['tank', 'tank', 'tank', 'tank', 'tank'], lights: false });
    S.P = mkPerson({ x: -17, z: -6.2, shirt: [118, 32, 38], pants: [52, 62, 92], hair: [30, 22, 18], phone: true });
    S.F = mkPerson({ x: -18.4, z: -7.3, shirt: [56, 84, 66], pants: [44, 44, 50], hair: [60, 44, 30], phone: true });
  },

  update(S, dt) {
    const t = S.t, P = S.P, F = S.F;
    if (!S.arc) {
      if (t < 3.9) walkTo(P, -8.3, -1.8, 2.4, dt);
      else if (t < 7.0) { P.x = -8.3; P.z = -1.8; P.yaw = 0; P.pose = 'climb'; P.phone = false; P.y = lerp(0, 3.95, sstep((t - 3.9) / 3.1)); P.ph += dt * 4; }
      else if (t < 7.6) { P.pose = 'crouch'; P.y = 4.0; P.z = lerp(-1.8, -0.4, (t - 7.0) / 0.6); P.kb = -9; }
      else if (t < 9.6) { P.pose = 'crouch'; P.yaw = PI / 2; P.x = lerp(-8.3, -4.2, sstep((t - 7.6) / 2.0)); }
      else { P.pose = 'selfie'; P.phone = true; P.yaw = -2.3; }
      if (t < 3.9) walkTo(F, -11.5, -5.0, 2.2, dt);
      else { F.yaw = Math.atan2(P.x - F.x, P.z - F.z); F.pose = 'stand'; }
      if (t >= 9.85) {
        S.arc = t; P.pose = 'flail'; P.phone = false;
        P.vx = 0.4; P.vy = 1.8; P.vz = -3.3; P.vp = -3.5; P.vr = 1.2;
        AU.arc(1.5); S.flash = 1.4; S.glitch = 0.3; S.shake = 0.4;
        burst(S, P.x, 5.6, 0, 60, { s: 5, col: [190, 225, 255], add: true, life: 0.9, floor: 0 });
        burst(S, P.x, 5.6, 0, 30, { s: 2, col: [255, 210, 140], add: true, life: 1.6, floor: 0.3 });
      }
    } else {
      const ground = (Math.abs(P.z) < 1.45 && P.y > 3.3) ? 4.0 : 0.05;
      ragdoll(P, dt, ground);
      P.kb = P.y > 3.3 ? -9 : -0.2;
      const since = t - S.arc;
      if (since > 0.2 && Math.random() < dt * 14) S.parts.add({ x: P.x + rnd(-0.3, 0.3), y: P.y + 0.9, z: P.z + rnd(-0.3, 0.3), vy: rnd(0.3, 0.7), g: -0.15, grow: 0.35, life: rnd(1.6, 2.8), size: 0.12, col: [120, 120, 126], alpha: 0.35, drag: 0.4 });
      if (since < 2.5 && Math.random() < dt * 10) burst(S, P.x + rnd(-1, 1), 5.6, 0, 3, { s: 1.5, col: [190, 225, 255], add: true, life: 0.35 });
      if (since > 0.5) {
        F.phone = false;
        if (!S.fArr) S.fArr = walkTo(F, P.x - 0.9, P.z - 0.9, 4.6, dt);
        else { F.yaw = Math.atan2(P.x - F.x, P.z - F.z); F.pose = since < 4.2 ? 'kneel' : 'call'; F.ph += dt * 3; }
      }
      if (S.at('sh1', S.arc + 0.6)) AU.shout();
      if (S.at('sh2', S.arc + 2.2)) AU.shout();
    }
  },

  draw(S) {
    const t = S.t;
    skyGround(S.env);
    hills(5, [40, 42, 50], 600, 30);
    face2(-90, 90, -30, 30, 0.01, [60, 58, 54]);
    for (const z of [0, 5, 10]) trackBed(z, -200, 200);
    for (const z of [0, 5, 10]) rails(z, -200, 200);
    const L = [];
    const w1 = catenary(L, 0, -1, 55, 12), w2 = catenary(L, 5, 1, 55, 12);
    trainDrawables(L, S.tr); trainDrawables(L, S.tr2);
    lampPost(L, -24, -9, 12, true); lampPost(L, 16, -8, 12, true); lampPost(L, 6, 17, 12, true);
    building(L, 8, 32, 44, 12, 9, [92, 88, 84], [70, 64, 52]);
    personDrawable(L, S.P); personDrawable(L, S.F);
    sortDraw(L);
    w1(); w2();
    lights(L);
    if (S.arc && t - S.arc < 0.7) glow(S.P.x, 5.6, 0, 14 * (1 - (t - S.arc) / 0.7) + 2, '185,215,255', 1, 20);
    else if (S.arc && t - S.arc < 3 && Math.random() < 0.3) glow(S.P.x + rnd(-0.6, 0.6), 5.6, 0, 1.5, '185,215,255', 0.9, 6);
    if (!S.arc && t > 4 && S.F.phone) { const f = S.F; glow(f.x + Math.sin(f.yaw) * 0.5, 1.4, f.z + Math.cos(f.yaw) * 0.5, 0.25, '200,230,255', 0.7, 2); }
  },
});

/* =====================================================================
   K-03  Kulaklıkla hat üzerinde yürümek
   ===================================================================== */
SCENES.push({
  title: 'Kulaklıkla hat üzerinde', place: 'İstasyon girişi, KM 57+900', placeShort: 'İST. GİRİŞİ KM 57+900',
  camLabel: 'KAM-01', kind: 'cctv', stamp: '2026-04-02 16:05:31', dur: 18, danger: [0.5, 10.0], preview: 4,
  outcome: 'ÖLÜM', victim: 'Hat üzerinde yürüyen 22 yaşındaki genç',
  cue: 'kayıt başladığında: genç kulaklıkla, sırtı trene dönük hattın ortasında yürüyordu',
  q: {
    text: 'Bu kazada asıl hata neydi?',
    opts: [
      'Hat yürüme yolu değildir; üstelik kulaklık trenin kornasını ve sesini duymasını engelledi.',
      'Trene sırtını dönmesi; yüzü trene dönük yürüseydi güvende olurdu.',
      'Makinistin daha erken korna çalmaması.',
      'Tek hatlı değil çift hatlı bir yerde yürümesi.',
    ],
    why: 'Arkadan yaklaşan bir tren sanıldığı kadar ses çıkarmaz; kulaklıkla hiç duyulmaz. Makinist yürüyen birini gördüğünde durmak için genellikle çok geçtir.',
  },
  rule: 'Hat üzerinde yürüme; hattın yakınında kulaklık takma.',
  fact: 'Yük trenleri yüzlerce, hatta binlerce ton ağırlığındadır. Makinist freni sonuna kadar çekse bile tren, durana kadar yüzlerce metre ilerler.',

  init(S) {
    S.env = mkEnv({ sky: ['#8796a3', '#d3d6d0'], ground: ['#6d6e5c', '#4b4c3f'], fog: [196, 200, 198], fogD: 320, lum: 0.95, amb: 0.55, L: nrm(-0.3, 0.75, 0.55) });
    S.cam = new Cam({ x: 16, y: 6, z: -6.5, yaw: -1.3, pitch: -0.16, F: 760 });
    const stopX = -26 + 1.3 * 10.55;
    S.plan = trainPlan({ v: 22, brakeAt: 7.2, decel: 0.8, tImpact: 11.0, xImpact: stopX - 0.3 });
    S.tr = mkTrain({ z: 0, cars: ['loco_d', 'hopper', 'hopper', 'hopper', 'hopper', 'hopper', 'hopper', 'hopper'] });
    S.P = mkPerson({ x: -26, y: 0.36, z: 0.12, yaw: PI / 2, headphones: true, phone: true, shirt: [72, 86, 60], pants: [40, 44, 60], hair: [24, 18, 14] });
    S.trees = scatterTrees(33, 40, -260, 70, [[-45, -11], [10, 50]], (x, z) => x > 10 && z < 0);
    S.items = [];
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, P = S.P, tr = S.tr;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    if (P.vis) {
      if (t < 10.55) { P.x = -26 + 1.3 * t; P.pose = 'walk'; P.ph = t * 1.3 * 3.6; }
      else { P.pose = 'stand'; P.phone = false; P.yaw = lerp(PI / 2, -PI / 2 + 0.3, sstep((t - 10.55) / 0.35)); }
      if (tr.x >= P.x - 0.3) {
        P.vis = false; AU.impact(1.1, false); S.shake = 0.8; S.glitch = 0.4;
        S.items.push({ x: P.x, y: 1.6, z: P.z, vx: tr.v * 0.35, vy: 3.2, vz: -4.6, w: 0.2, d: 0.14, h: 0.1, col: [238, 238, 238], yaw: 0, vr: 9 });
        S.items.push({ x: P.x, y: 1.2, z: P.z, vx: tr.v * 0.5, vy: 2.5, vz: -5.8, w: 0.08, d: 0.16, h: 0.02, col: [30, 30, 34], yaw: 0, vr: 12 });
        burst(S, P.x, 0.5, 0, 25, { vx: tr.v * 0.4, s: 2.5, col: [140, 130, 118], size: 0.05, life: 1.3 });
      }
    }
    if (S.at('h1', 6.6)) AU.horn(1.4);
    if (S.at('h2', 8.4)) AU.horn(1.1);
    if (S.at('h3', 9.8)) AU.horn(1.9);
    if (S.at('br', 7.2)) AU.screech(10, 0.8);
    if (t > 7.2) brakeSparks(S, tr, dt);
    updItems(S, dt);
    noiseFor(S, [tr]);
  },

  draw(S) {
    const tr = S.tr;
    skyGround(S.env);
    hills(9, [120, 128, 124], 700, 55);
    face2(-400, 80, -4.2, -2.4, 0.02, [118, 110, 94]);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    const L = [];
    const wires = telePoles(L, -6, -400, 70, 45, 7);
    trainDrawables(L, tr);
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    signalPost(L, 6, 7.2, tr.x > -200 ? 'red' : 'green');
    building(L, -40, 22, 7, 5, 4, [170, 160, 140], [60, 60, 64]);
    personDrawable(L, S.P);
    itemDrawables(L, S);
    sortDraw(L);
    wires();
    trainLights(tr, 1);
  },
});

/* =====================================================================
   K-04  Peron kenarı: sarı çizginin önünde beklemek
   ===================================================================== */
SCENES.push({
  title: 'Sarı çizginin önünde', place: 'Ara istasyon, 1. peron', placeShort: 'İSTASYON PERON-1',
  camLabel: 'KAM-07', kind: 'cctv', stamp: '2026-07-19 08:12:03', dur: 16, danger: [3.3, 7.3], preview: 4.6,
  outcome: 'AĞIR YARALI', victim: 'Peron kenarında bekleyen yolcu, 45 yaşında',
  cue: 'yolcu sarı çizgiyi geçip peron kenarından hatta doğru eğildiğinde',
  q: {
    text: 'Peronda güvenli bekleme yeri neresidir?',
    opts: [
      'Sarı çizginin gerisi; tren tamamen durana kadar çizgi geçilmez.',
      'Peron kenarı; trenin geldiğini görmek için en iyi yer.',
      'Sarı çizginin üstü; çizgi yalnızca işaret içindir.',
      'Tren bu istasyonda duracaksa peronun her yeri güvenlidir.',
    ],
    why: 'Geçen trenler peron kenarına sanıldığından çok yaklaşır ve arkalarında insanı çekebilecek bir hava akımı oluşturur. İstasyonda durmayan trenler peronun yanından tam hızla geçebilir.',
  },
  rule: 'Sarı çizginin gerisinde bekle; tren durmadan çizgiyi geçme.',
  fact: 'Trenin gövdesi rayların dışına taşar. Hızla geçen bir tren, peron kenarında duran birini çekebilecek kadar güçlü bir hava akımı yaratır.',

  init(S) {
    S.env = mkEnv({ sky: ['#97a9b6', '#dde0da'], ground: ['#777869', '#57594d'], fog: [200, 204, 202], fogD: 300, lum: 1, amb: 0.55, L: nrm(0.4, 0.8, -0.45) });
    S.cam = new Cam({ x: 14, y: 4.6, z: -7.2, yaw: -1.07, pitch: -0.2, F: 700 });
    S.plan = trainPlan({ v: 28, brakeAt: 7.9, decel: 0.9, tImpact: 7.75, xImpact: 3.6 });
    S.tr = mkTrain({ z: 0, cars: ['loco_d', 'pass', 'pass', 'pass', 'pass', 'pass'] });
    S.P = mkPerson({ x: 6.5, y: 1.0, z: -5.2, yaw: -1.2, shirt: [150, 120, 70], pants: [60, 58, 54], hair: [96, 94, 90] });
    S.others = [
      mkPerson({ x: -1.5, y: 1, z: -6.0, yaw: -PI / 2, phone: true, shirt: [40, 60, 110] }),
      mkPerson({ x: 9.5, y: 1, z: -6.6, yaw: 0.3, shirt: [170, 40, 50], pants: [30, 30, 34], hair: [20, 16, 14] }),
      mkPerson({ x: 2.5, y: 1, z: -8.0, yaw: -0.4, shirt: [64, 64, 64], pants: [90, 80, 60] }),
    ];
    S.items = [{ x: 7.1, y: 1.0, z: -4.9, w: 0.42, d: 0.26, h: 0.62, yaw: 0.2, col: [40, 70, 110], vx: 0, vy: 0, vz: 0, floor: 1.0, rest: true }];
    S.trees = scatterTrees(4, 24, -200, 60, [[14, 40]], null);
    S.rum = AU.rumble(); S.wind = AU.wind(0);
  },

  update(S, dt) {
    const t = S.t, P = S.P, tr = S.tr;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    if (S.at('chime', 0.8)) AU.chime();
    if (S.at('h1', 5.8)) AU.horn(1.6);
    if (S.at('h2', 7.0)) AU.horn(1.4);
    if (!S.hit) {
      if (t > 0.8 && t < 3.6) walkTo(P, 4.0, -2.0, 1.25, dt);
      else if (t >= 3.6 && t < 7.3) { P.x = 4; P.z = -2.0; P.yaw = -PI / 2; P.pose = 'lean'; P.roll = lerp(P.roll, 0.24, dt * 3); }
      else if (t >= 7.3) { P.pose = 'stand'; P.roll = lerp(P.roll, 0, dt * 8); }
      if (tr.x >= 3.6) {
        S.hit = true;
        P.vx = 6; P.vy = 2.4; P.vz = -3.4; P.vp = 5.5; P.vr = -2;
        AU.impact(1.2, false); S.shake = 0.7; S.glitch = 0.25;
        const bag = S.items[0]; bag.rest = false; bag.vx = 5; bag.vy = 1.5; bag.vz = -1.5; bag.vr = 4;
      }
    } else ragdoll(P, dt, 1.0);
    updItems(S, dt);
    const [a, b] = trainSpan(tr), near = a < 18 && b > -12;
    S.wind.set(near ? 0.22 : 0.02);
    if (near && Math.random() < dt * 12) S.parts.add({ x: rnd(-8, 12), y: 1.05, z: rnd(-3.2, -2.2), vx: tr.v * rnd(0.25, 0.45), vy: rnd(0.8, 2.5), vz: rnd(-0.6, 0.3), g: 1.2, drag: 1.2, life: rnd(1, 2), size: 0.06, col: [220, 220, 210], floor: 1.02 });
    S.others.forEach((o, i) => {
      if (t < 7.75) return;
      const face = Math.atan2(P.x - o.x, P.z - o.z);
      if (i === 2) { o.yaw = face; o.phone = false; o.pose = t > 9.5 ? 'call' : 'stand'; return; }
      if (t > 8.6 + i * 0.5) {
        if (!o.arr) o.arr = walkTo(o, P.x - 0.7 + i * 1.4, P.z - 0.9, 3.8, dt);
        else { o.yaw = face; o.pose = 'kneel'; o.ph += dt * 2; }
      } else { o.pose = 'stand'; o.phone = false; o.yaw = lerp(o.yaw, face, dt * 4); }
    });
    if (t > 7.9) brakeSparks(S, tr, dt);
    noiseFor(S, [tr]);
  },

  draw(S) {
    const tr = S.tr;
    skyGround(S.env);
    hills(21, [130, 136, 134], 700, 40);
    face([[-80, 4.95, -9.5], [40, 4.95, -9.5], [40, 4.95, -3.3], [-80, 4.95, -3.3]], [96, 98, 100], 0.9);
    face([[-80, 4.95, -3.3], [40, 4.95, -3.3], [40, 5.5, -3.3], [-80, 5.5, -3.3]], [150, 40, 36], 0.9);
    for (let x = -76; x < 36; x += 8) face([[x, 4.94, -6.6], [x + 3, 4.94, -6.6], [x + 3, 4.94, -6.3], [x, 4.94, -6.3]], [255, 255, 245], 1.3);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    const L1 = [];
    trainDrawables(L1, tr);
    platform(L1, -120, 60, 6.0, 12, 1.0, { edge: -1 });
    building(L1, -12, 17, 26, 8, 6.5, [176, 158, 132], [70, 76, 84]);
    for (const tt of S.trees) tree(L1, tt[0], tt[1], tt[2], tt[3]);
    sortDraw(L1);
    const Lp = [];
    platform(Lp, -120, 60, -10, -1.9, 1.0, { edge: 1 });
    Lp[0].d();
    const L2 = [];
    personDrawable(L2, S.P);
    for (const o of S.others) personDrawable(L2, o);
    itemDrawables(L2, S);
    L2.push({ k: adist(-5, -3, 1, 1.5, -8.5, -8), d: () => { box({ x: -4, z: -8.3, y: 1.4, w: 2, d: 0.5, h: 0.08, col: [110, 80, 50] }); box({ x: -4, z: -8.5, y: 1.0, w: 1.9, d: 0.1, h: 0.4, col: [60, 60, 60] }); } });
    sortDraw(L2);
    trainLights(tr, 1);
  },
});
