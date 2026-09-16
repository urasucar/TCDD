'use strict';
/* Kayıt 19–20 */

// Yönlendirilmiş kutu: o köşe, ax/ay/az birim eksenler, sz uzunluklar
function obox(o, ax, ay, az, sz, col) {
  const cam = R.cam, P = (i, j, k) => [0, 1, 2].map(n => o[n] + ax[n] * i * sz[0] + ay[n] * j * sz[1] + az[n] * k * sz[2]);
  const neg = (v) => [-v[0], -v[1], -v[2]];
  const faces = [
    [ax, [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]], [neg(ax), [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]],
    [ay, [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]]], [neg(ay), [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]],
    [az, [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]], [neg(az), [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]]],
  ];
  for (const [n, ids] of faces) {
    const pts = ids.map(([i, j, k]) => P(i, j, k));
    const c = [0, 1, 2].map(m => pts.reduce((s, p) => s + p[m], 0) / 4);
    if (n[0] * (cam.x - c[0]) + n[1] * (cam.y - c[1]) + n[2] * (cam.z - c[2]) <= 0) continue;
    face(pts, col, lightF(n[0], n[1], n[2]), true);
  }
}

/* =====================================================================
   K-19  Elektrik hattının yanında uçurtma (telefon kaydı)
   ===================================================================== */
function kitePos(S, t) {
  if (S.free) return S.free;
  const drop = sstep((t - 7.0) / 1.5);
  return [6 + 1.5 * Math.sin(t * 0.7), lerp(16 + 0.8 * Math.sin(t * 1.9), 6.8, drop), lerp(-4, 3.2, sstep(t / 7.5)) + 0.6 * drop];
}
function stringPts(S, t, hand) {
  const k = kitePos(S, t), sag = 1.2 + 2.4 * sstep((t - 7.0) / 1.5), pts = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    pts.push([lerp(hand[0], k[0], u), lerp(hand[1], k[1], u) - sag * 4 * u * (1 - u), lerp(hand[2], k[2], u)]);
  }
  return pts;
}

SCENES.push({
  title: 'Hattın yanında uçurtma', place: 'Hat kenarı çayır, KM 23+900', placeShort: 'KM 23+900',
  camLabel: 'TEL', kind: 'phone', stamp: '2026-04-19 16:40:02', dur: 14, danger: [0.5, 7.0], preview: 4,
  outcome: 'AĞIR YARALI', victim: 'Uçurtmasının ipi elektrik hattına değen 14 yaşındaki çocuk',
  cue: 'kayıt başladığında: çocuk, uçurtmasını demiryolu elektrik hatlarının hemen yanında uçuruyordu',
  q: {
    text: 'Uçurtma nerede uçurulmalı?',
    opts: [
      'Demiryolu ve elektrik hatlarından çok uzakta, açık ve boş bir alanda.',
      'Hattın yanında; ip tele değmediği sürece sorun yoktur.',
      'Tren geçmiyorken demiryolu hattının yanında.',
      'İp kuruysa elektrik hattının altında bile güvenlidir.',
    ],
    why: 'Uçurtma ipi rüzgârla bir anda yön değiştirip tele değebilir. Islak ya da metal katkılı bir ip, hattaki elektriği tutan kişiye iletebilir; tren olmasa da hat her zaman enerjilidir.',
  },
  rule: 'Uçurtma, balon ve drone\'u demiryolu elektrik hatlarının yakınında uçurma.',
  fact: 'Bir şey elektrik teline takılırsa asla çekmeye ya da almaya çalışma. Uzak dur ve durumu demiryolu işletmesine ya da 112\'ye bildir.',

  init(S) {
    S.env = mkEnv({ sky: ['#5f8ec4', '#dde8ee'], ground: ['#7d9150', '#5a6a3a'], fog: [214, 226, 232], fogD: 420, lum: 1.05, amb: 0.5, clouds: 10, cloudDrift: 0.01, L: nrm(0.5, 0.75, 0.3) });
    S.cam = new Cam({ x: -6, y: 1.55, z: -19, yaw: 0.35, pitch: 0.12, F: 620 });
    S.K = mkPerson({ x: 2, z: -13, yaw: 0.3, shirt: [240, 190, 40], pants: [50, 70, 120], hair: [40, 28, 18] });
    S.A = mkPerson({ x: 28, z: -16, yaw: -1.4, shirt: [90, 110, 90], pants: [60, 56, 50], hair: [150, 146, 140], phone: true });
    S.tr = mkTrain({ z: 4.5, dir: 1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    S.trees = scatterTrees(191, 26, -120, 160, [[14, 70]], null);
    S.rum = AU.rumble(); S.wind = AU.wind(0.09);
  },

  update(S, dt) {
    const t = S.t, K = S.K, A = S.A, cam = S.cam, tr = S.tr;
    tr.x = -150 + 25 * t; tr.v = 25;
    const hand = [K.x + Math.sin(K.yaw) * 0.4, 1.9, K.z + Math.cos(K.yaw) * 0.4];
    S.hand = hand;
    if (!S.arc) {
      K.pose = 'stand'; K.yaw = 0.3 + 0.08 * Math.sin(t * 1.3);
      K.ov = { shR: 2.3 + 0.15 * Math.sin(t * 2.2), elR: 0.3, shL: 1.8, elL: 0.6, abR: 0.15, lean: -0.08 };
      const pts = stringPts(S, t, hand);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        if (t > 7.4 && (a[2] - 0) * (b[2] - 0) <= 0) {
          const u = a[2] / (a[2] - b[2] || 1), y = lerp(a[1], b[1], u);
          if (y < 7.3) {
            S.arc = t; S.arcPt = [lerp(a[0], b[0], u), 7.2, 0]; S.free = kitePos(S, t).slice(); S.kv = [3, -1.5, 2];
            K.pose = 'flail'; K.ov = null; K.vx = 0; K.vy = 1.4; K.vz = -1.6; K.vp = -3.2; K.vr = 0.8;
            AU.arc(1.4); S.flash = 1.1; S.glitch = 0.35; S.shake = 0.5;
            burst(S, S.arcPt[0], 7.2, 0, 50, { s: 4, col: [190, 225, 255], add: true, life: 0.8, floor: 0 });
            burst(S, hand[0], hand[1], hand[2], 30, { s: 2.5, col: [255, 220, 150], add: true, life: 0.6, floor: 0 });
          }
          break;
        }
      }
      const tx = lerp(K.x, 6, 0.45), ty = lerp(1.4, kitePos(S, t)[1], 0.35), tz = lerp(K.z, 0, 0.4);
      const yaw = Math.atan2(tx - cam.x, tz - cam.z), pitch = Math.atan2(ty - cam.y, Math.hypot(tx - cam.x, tz - cam.z));
      cam.yaw = lerp(cam.yaw, yaw, Math.min(1, dt * 2.5)) + 0.004 * Math.sin(t * 3.1);
      cam.pitch = lerp(cam.pitch, pitch, Math.min(1, dt * 2.5)) + 0.004 * Math.sin(t * 2.3);
      cam.roll = 0.015 * Math.sin(t * 0.9);
    } else {
      ragdoll(K, dt, 0.05);
      const s = t - S.arc;
      S.free[0] += S.kv[0] * dt; S.free[1] += S.kv[1] * dt; S.free[2] += S.kv[2] * dt;
      if (s > 0.2 && Math.random() < dt * 12) S.parts.add({ x: K.x + rnd(-0.3, 0.3), y: 0.4 + rnd(0, 0.4), z: K.z + rnd(-0.3, 0.3), vy: rnd(0.3, 0.7), g: -0.15, grow: 0.35, life: rnd(1.6, 2.6), size: 0.1, col: [130, 130, 134], alpha: 0.35, drag: 0.4 });
      if (s < 2.5 && Math.random() < dt * 10) burst(S, S.arcPt[0] + rnd(-0.5, 0.5), 7.2, 0, 3, { s: 1.5, col: [190, 225, 255], add: true, life: 0.35 });
      if (S.at('fs1', S.arc + 0.4)) AU.shout();
      if (S.at('fs2', S.arc + 1.5)) AU.shout();
      if (s > 0.9) {
        const gx = K.x - 1.6, gz = K.z - 2.6, dx = gx - cam.x, dz = gz - cam.z, d = Math.hypot(dx, dz);
        if (d > 0.1) { const st = Math.min(d, 4.5 * dt); cam.x += dx / d * st; cam.z += dz / d * st; S.step = (S.step || 0) + st; }
        cam.y = 1.55 + 0.06 * Math.abs(Math.sin((S.step || 0) * 2.2));
        const yaw = Math.atan2(K.x - cam.x, K.z - cam.z), pitch = Math.atan2(0.3 - cam.y, Math.max(0.5, Math.hypot(K.x - cam.x, K.z - cam.z)));
        cam.yaw = lerp(cam.yaw, yaw, Math.min(1, dt * 4)) + 0.02 * Math.sin(t * 9);
        cam.pitch = lerp(cam.pitch, pitch, Math.min(1, dt * 4)) + 0.015 * Math.sin(t * 11);
        cam.roll = 0.05 * Math.sin(t * 5);
      } else { cam.yaw += (Math.random() - 0.5) * 0.08; cam.pitch += (Math.random() - 0.5) * 0.06; }
      if (s > 1.2) { A.phone = false; if (!A.arr) A.arr = walkTo(A, K.x + 1.1, K.z + 0.6, 4.5, dt); else { A.pose = s > 5 ? 'call' : 'kneel'; A.yaw = Math.atan2(K.x - A.x, K.z - A.z); A.ph += dt * 2; } }
    }
    noiseFor(S, [tr], 0.8);
  },

  draw(S) {
    const t = S.t, ctx = R.ctx;
    skyGround(S.env);
    hills(59, [110, 140, 160], 750, 60);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    const L = [];
    const w1 = catenary(L, 0, -1, 55, 10), w2 = catenary(L, 4.5, 1, 55, 10);
    trainDrawables(L, S.tr);
    for (let x = -60; x < 80; x += 6) L.push({ k: adist(x, x + 6, 0, 1.6, -5.6, -5.4), d: () => {
      line3([x, 1.5, -5.5], [x + 6, 1.5, -5.5], [120, 126, 120], 0.04, 1);
      for (let k = 0; k <= 8; k++) line3([x + k * 0.75, 0, -5.5], [x + k * 0.75, 1.5, -5.5], [130, 136, 130], 0.012, 0.5);
    } });
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    personDrawable(L, S.K); personDrawable(L, S.A);
    sortDraw(L);
    w1(); w2();
    const hand = S.hand || [S.K.x, 1.9, S.K.z], k = kitePos(S, t);
    const burning = S.arc && t - S.arc < 1.2;
    if (!S.arc || burning) {
      const pts = stringPts(S, S.arc || t, hand);
      for (let i = 0; i < pts.length - 1; i++) line3(pts[i], pts[i + 1], burning ? (Math.random() < 0.5 ? '#cfe6ff' : '#fff2c0') : [70, 70, 70], burning ? 0.03 : 0.008, burning ? 1.6 : 0.7);
    }
    const up = 0.55, sd = 0.38, tw = Math.sin(t * 3) * 0.08;
    face([[k[0], k[1] + up, k[2]], [k[0] + sd, k[1] + tw, k[2]], [k[0], k[1] - up * 0.9, k[2]]], [220, 40, 40], 1.1);
    face([[k[0], k[1] + up, k[2]], [k[0] - sd, k[1] - tw, k[2]], [k[0], k[1] - up * 0.9, k[2]]], [250, 200, 40], 1.1);
    for (let i = 0; i < 6; i++) line3([k[0] + Math.sin(t * 4 + i) * 0.1 * i, k[1] - up * 0.9 - i * 0.35, k[2]], [k[0] + Math.sin(t * 4 + i + 1) * 0.1 * (i + 1), k[1] - up * 0.9 - (i + 1) * 0.35, k[2]], [240, 240, 240], 0.02, 0.8);
    if (S.arc && t - S.arc < 0.8) glow(S.arcPt[0], 7.2, 0, 10 * (1 - (t - S.arc) / 0.8) + 2, '185,215,255', 1, 16);
    else if (S.arc && t - S.arc < 3 && Math.random() < 0.35) glow(S.arcPt[0] + rnd(-0.4, 0.4), 7.2, 0, 1.4, '185,215,255', 0.9, 5);
    void ctx;
  },
});

/* =====================================================================
   K-20  Damperi kalkık kamyon katener hattına değiyor
   ===================================================================== */
function tipperAxes(o, A) {
  const yaw = o.yaw, f = [Math.sin(yaw), 0, Math.cos(yaw)], s = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const ca = Math.cos(A), sa = Math.sin(A), [px, pz] = offs(o, -3.6, 0), py = 1.35 + (o.y || 0);
  const ax = [f[0] * ca, sa, f[2] * ca], ay = [-f[0] * sa, ca, -f[2] * sa];
  return { f, s, ax, ay, px, py, pz, top: [px + ax[0] * 5.2 + ay[0] * 1.3, py + ax[1] * 5.2 + ay[1] * 1.3, pz + ax[2] * 5.2 + ay[2] * 1.3] };
}

function drawTipper(o, A) {
  const yaw = o.yaw, y0 = o.y || 0, { f, s, ax, ay, px, py, pz } = tipperAxes(o, A);
  for (const lf of [2.4, -1.6, -2.9]) for (const lx of [1.05, -1.05]) { const [wx, wz] = offs(o, lf, lx); box({ x: wx, z: wz, y: y0, w: 0.45, d: 1.05, h: 1.05, yaw, col: [24, 24, 22] }); }
  const [chx, chz] = offs(o, -0.5, 0);
  box({ x: chx, z: chz, y: y0 + 0.85, w: 2.1, d: 6.8, h: 0.4, yaw, col: [40, 40, 42] });
  const [cx, cz] = offs(o, 2.6, 0);
  box({ x: cx, z: cz, y: y0 + 1.0, w: 2.45, d: 1.9, h: 2.0, yaw, col: [214, 176, 40], decal: (n, map, fl) => {
    if (n === '+z') { dq(map, -1.05, 1.0, 1.05, 1.8, [40, 50, 60], fl); dq(map, -1.05, 1.55, 1.05, 1.8, [118, 134, 148], fl); }
    if (n === '+x' || n === '-x') dq(map, -0.2, 0.9, 0.75, 1.75, [44, 54, 64], fl);
  } });
  obox([px - s[0] * 1.2, py, pz - s[2] * 1.2], ax, ay, s, [5.2, 1.3, 2.4], [176, 168, 150]);
  line3([px + f[0] * 0.6, py - 0.25, pz + f[2] * 0.6], [px + ax[0] * 2.2, py + ax[1] * 2.2, pz + ax[2] * 2.2], [70, 70, 70], 0.12, 1);
}

SCENES.push({
  title: 'Damperi kalkık kamyon', place: 'Şantiye yanı hemzemin geçit, KM 41+060', placeShort: 'HEMZ. GEÇİT KM 41+060',
  camLabel: 'KAM-10', kind: 'cctv', stamp: '2026-08-21 14:52:09', dur: 14, danger: [0.3, 5.6], preview: 4,
  outcome: 'ÖLÜM', victim: 'Kamyondan inerken elektrik çarpan sürücü, 52 yaşında',
  cue: 'damperi kalkık kamyon, elektrik hattının altındaki hemzemin geçide yaklaştığında',
  q: {
    text: 'Aracın elektrik hattına değerse ne yapmalısın?',
    opts: [
      'Yangın yoksa araçtan inme, kimseyi yaklaştırma; inmek zorundaysan araca ve yere aynı anda dokunmadan iki ayağınla birlikte atla.',
      'Hemen kapıyı açıp kapıya tutunarak yavaşça in.',
      'Aracın gövdesine dokunarak elektriği toprağa aktarmaya çalış.',
      'Birinin gelip seni elinden tutarak araçtan çekmesini iste.',
    ],
    why: 'Temas anında aracın gövdesi ve çevresindeki zemin enerjilenir. İçeride kalan kişi çoğu zaman güvendedir; araca ve yere aynı anda dokunan kişi akımın yolu olur. Yardıma koşan biri de aynı tehlikeye girer.',
  },
  rule: 'Elektrik hattının altından geçerken damperi, vinci ve yükü indir; temas olursa araçtan inme.',
  fact: 'Kazayı gören işçi doğru olanı yaptı: araca yaklaşmadı, bağırarak uyardı ve 112\'yi aradı. Elektrik kesildiği bildirilmeden kimse araca dokunmamalıdır.',

  init(S) {
    S.env = mkEnv({ sky: ['#9fb3c4', '#e4dccb'], ground: ['#9a8a68', '#6e6248'], fog: [220, 210, 190], fogD: 300, lum: 1.05, amb: 0.5, L: nrm(0.6, 0.7, -0.3) });
    S.cam = new Cam({ x: 14, y: 7, z: -16, yaw: -0.7, pitch: -0.28, F: 700 });
    S.tk = { x: 1.75, z: 26, yaw: PI };
    S.A = 0.75;
    S.D = mkPerson({ x: 3.2, y: 1.4, z: -4, yaw: -PI / 2, shirt: [90, 100, 120], pants: [50, 50, 56], hair: [90, 86, 80], vis: false });
    S.Wk = mkPerson({ x: -8, z: -7, yaw: 0.9, shirt: [236, 112, 28], vest: true, pants: [44, 50, 70], helmet: [240, 240, 236] });
    S.items = [];
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, tk = S.tk, D = S.D, Wk = S.Wk;
    if (!S.contact) tk.z = 26 - 4.5 * t;
    else tk.z = lerp(tk.z, S.stopZ, Math.min(1, dt * 3));
    tk.y = roadY(tk.z);
    S.top = tipperAxes(tk, S.A).top;
    if (!S.contact && S.top[2] <= 0.15 && S.top[1] > 5.5) {
      S.contact = t; S.stopZ = tk.z - 2.0;
      AU.arc(8.5); S.flash = 1.0; S.glitch = 0.3; S.shake = 0.4;
      burst(S, S.top[0], 5.7, 0, 60, { s: 4.5, col: [190, 225, 255], add: true, life: 0.9, floor: 0 });
    }
    if (S.contact) {
      const s = t - S.contact;
      if (Math.random() < dt * 14) burst(S, S.top[0] + rnd(-0.3, 0.3), 5.6, 0, 3, { s: 2.5, col: [190, 225, 255], add: true, life: 0.4, floor: 0 });
      for (const lf of [2.4, -1.6, -2.9]) for (const lx of [1.05, -1.05]) {
        if (Math.random() < dt * 2.2) { const [wx, wz] = offs(tk, lf, lx); S.parts.add({ x: wx, y: 0.3, z: wz, vy: rnd(0.3, 0.8), g: -0.2, grow: 0.4, life: rnd(1.5, 2.5), size: 0.1, col: [60, 60, 62], alpha: 0.45, drag: 0.4 }); }
        if (Math.random() < dt * 1.5) { const [wx, wz] = offs(tk, lf, lx); burst(S, wx, 0.1, wz, 3, { s: 1.5, col: [255, 190, 110], add: true, life: 0.3 }); }
      }
      const [cx, cz] = offs(tk, 2.6, -1.4);
      if (s > 1.3 && !S.zap) {
        D.vis = true; D.x = cx; D.z = cz; D.yaw = -PI / 2;
        const u = clamp((s - 1.3) / 1.1, 0, 1);
        D.y = lerp(1.4, 0.02, u); D.pose = 'stand';
        D.ov = { shL: 2.6, elL: 0.3, abL: -0.2, hipR: 0.6 * (1 - u), kneeR: 0.9 * (1 - u) };
        if (u >= 1) {
          S.zap = t; AU.arc(0.7); S.flash = 0.5; S.glitch = 0.2;
          burst(S, D.x, 0.1, D.z, 25, { s: 2, col: [190, 225, 255], add: true, life: 0.5, floor: 0 });
          D.ov = null; D.pose = 'flail'; D.vx = 0.8; D.vy = 0.6; D.vz = 0; D.vp = 2.6; D.vr = 0.4;
        }
      } else if (S.zap) ragdoll(D, dt, 0.05);
      Wk.yaw = Math.atan2(tk.x - Wk.x, tk.z - Wk.z);
      Wk.pose = s < 0.5 ? 'stand' : (S.zap && t - S.zap > 1.2 ? 'call' : 'wave'); Wk.ph += dt * 8;
      if (S.at('w1', S.contact + 0.6)) AU.shout();
      if (S.at('w2', S.contact + 1.5)) AU.shout();
      if (S.at('w3', S.contact + 2.3)) AU.shout();
    } else { Wk.pose = 'stand'; Wk.yaw = 0.9; }
    if (S.rum) S.rum.set(S.contact ? 0.08 : 0.22 * clamp(1 - Math.abs(tk.z) / 40, 0, 1) + 0.05, 0);
  },

  draw(S) {
    const t = S.t;
    skyGround(S.env);
    hills(203, [150, 146, 136], 700, 50);
    face2(4, 60, 6, 40, 0.02, [160, 140, 104]);
    trackBed(0); rails(0);
    crossingRoad(-60, 70, [70, 68, 64]);
    const L = [];
    const wires = catenary(L, 0, -1, 40, 20);
    L.push({ k: adist(0, 4.4, 0, 3.4, -5, -3.6), d: () => barrier(4.2, -4.2, 3.9, -1, 1.45, false, t) });
    L.push({ k: adist(-4.4, 0, 0, 3.4, 3.6, 5), d: () => barrier(-4.2, 4.2, 3.9, 1, 1.45, false, t) });
    const tk = S.tk;
    L.push({ k: adist(tk.x - 3, tk.x + 3, 0, 5, tk.z - 4.5, tk.z + 4.5), d: () => {
      const sp = [];
      for (let i = 0; i < 14; i++) { const a = i / 14 * PI * 2, [sx, sz] = offs(tk, Math.sin(a) * 4, Math.cos(a) * 1.5); sp.push([sx, 0.03, sz]); }
      face(sp, 'rgba(0,0,0,' + (R.env.shadowA * 0.8).toFixed(3) + ')');
      drawTipper(tk, S.A);
    } });
    for (const [x, z, h] of [[16, 18, 3], [22, 14, 2], [12, 26, 4]]) L.push({ k: adist(x - 3, x + 3, 0, h, z - 3, z + 3), d: () => face([[x - 3, 0, z], [x, h, z - 1], [x + 3, 0, z], [x, 0.1, z + 2]], [176, 150, 108], lightF(0, 0.8, -0.5), true, 1.2) });
    building(L, -20, 22, 14, 6, 3, [220, 220, 214], [60, 70, 80]);
    L.push({ k: adist(-10, -9, 0, 2.2, -12, -11), d: () => { line3([-9.5, 0, -11.5], [-9.5, 2.2, -11.5], [80, 80, 80], 0.08, 1); face([[-10.1, 1.5, -11.5], [-8.9, 1.5, -11.5], [-9.5, 2.5, -11.5]], [240, 200, 30], 1.1); } });
    personDrawable(L, S.D); personDrawable(L, S.Wk);
    sortDraw(L);
    wires();
    if (S.contact && S.top) {
      const s = t - S.contact;
      if (s < 0.7) glow(S.top[0], 5.6, 0, 12 * (1 - s / 0.7) + 2, '185,215,255', 1, 18);
      else if (Math.random() < 0.55) glow(S.top[0] + rnd(-0.3, 0.3), 5.6, 0, 1.6, '185,215,255', 0.95, 6);
      if (S.zap && t - S.zap < 0.4) glow(S.D.x, 0.6, S.D.z, 3, '185,215,255', 0.9, 8);
    }
  },
});
