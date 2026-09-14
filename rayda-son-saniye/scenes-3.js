'use strict';
/* Kayıt 9–12 */

function makeCrack() {
  const cx = W * 0.58, cy = H * 0.4, lines = [];
  for (let i = 0; i < 12; i++) {
    let a = rnd(0, PI * 2), x = cx, y = cy;
    const pts = [[x, y]], len = rnd(80, 340);
    for (let s = 0; s < 7; s++) { a += rnd(-0.45, 0.45); x += Math.cos(a) * len / 7; y += Math.sin(a) * len / 7; pts.push([x, y]); }
    lines.push(pts);
  }
  return lines;
}

function ledText(x, y, z, s) {
  if (!s) return;
  const p = pt(x, y, z);
  if (!p) return;
  const ctx = R.ctx, size = 0.26 * R.cam.F / p[2];
  ctx.save();
  ctx.font = '600 ' + size.toFixed(1) + 'px "IBM Plex Mono", ui-monospace, Menlo, monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffb030'; ctx.shadowColor = '#ff9000'; ctx.shadowBlur = 6;
  ctx.fillText(s, p[0], p[1]);
  ctx.restore();
}

/* =====================================================================
   K-09  Hat bakım işçisi: gözcü ayrılıyor, ikinci hattan tren
   ===================================================================== */
SCENES.push({
  title: 'Gözcüsüz çalışma', place: 'Çift hat, KM 133+480', placeShort: 'ÇİFT HAT KM 133+480',
  camLabel: 'KAM-09', kind: 'cctv', stamp: '2026-08-12 10:14:22', dur: 16, danger: [2.0, 7.4], preview: 4.5,
  outcome: 'ÖLÜM', victim: 'Hat bakım işçisi, 39 yaşında',
  cue: 'gözcü, arkadaşı hattın üzerinde çalışırken yanından ayrıldığında',
  q: {
    text: 'Bu kazayı ne önlerdi?',
    opts: [
      'Hat trafiğe kapatılmadan ve işin başında sürekli bir gözcü olmadan hat üzerinde çalışmamak.',
      'İşçinin işi daha hızlı bitirmesi.',
      'Öbür hattan tren geçerken işçinin kulaklarını kapatması.',
      'Turuncu yelek yeterliydi; makinist onu görüp durmalıydı.',
    ],
    why: 'Bir hattan geçen trenin gürültüsü, öbür hattan gelen treni duymayı imkânsız kılar. Gözcü yalnızca tek işe, yaklaşan trenleri izlemeye odaklanmalı; işçiler uyarıdan önce güvenli alana çekilmelidir.',
  },
  rule: 'Hat üzerinde gözcüsüz ve hat kapatılmadan çalışma.',
  fact: 'Yelek seni görünür kılar, treni durdurmaz. Makinist çalışanı fark ettiğinde fren mesafesi çoktan aşılmış olabilir.',

  init(S) {
    S.env = mkEnv({ sky: ['#8ea4b8', '#dcdcd0'], ground: ['#7c7a60', '#565440'], fog: [204, 204, 194], fogD: 340, lum: 1.05, amb: 0.5, L: nrm(-0.3, 0.9, -0.3) });
    S.cam = new Cam({ x: -10, y: 7, z: -17, yaw: 0.55, pitch: -0.28, F: 620 });
    S.p2 = trainPlan({ dir: 1, v: 22, tImpact: 5.5, xImpact: 0 });
    S.t2 = mkTrain({ z: 4.5, dir: 1, cars: ['loco_e', 'pass', 'pass', 'pass', 'pass'] });
    S.p1 = trainPlan({ dir: -1, v: 25, brakeAt: 7.9, decel: 1.1, tImpact: 8.9, xImpact: 0.4 });
    S.t1 = mkTrain({ z: 0, dir: -1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    const vest = { shirt: [236, 112, 28], vest: true, pants: [44, 50, 70] };
    S.A = mkPerson(Object.assign({ x: 0, y: 0.36, z: -0.1, yaw: -PI / 2, pose: 'kneel', helmet: [240, 240, 236] }, vest));
    S.B = mkPerson(Object.assign({ x: 4, y: 0.36, z: 0.3, yaw: PI / 2, helmet: [236, 200, 40] }, vest));
    S.items = [{ x: 1.6, y: 0.05, z: -2.5, w: 0.6, d: 0.3, h: 0.3, col: [200, 60, 30], yaw: 0.2, vx: 0, vy: 0, vz: 0, rest: true }];
    S.trees = scatterTrees(99, 30, -200, 200, [[-50, -12], [14, 60]], (x, z) => z < 0 && x > -30 && x < 40);
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, A = S.A, B = S.B;
    S.t2.x = S.p2.pos(t); S.t2.v = S.p2.speed(t);
    S.t1.x = S.p1.pos(t); S.t1.v = S.p1.speed(t);
    if (S.at('h2', 3.6)) AU.horn(1.5, 0.8);
    if (S.at('h1', 7.5)) AU.horn(1.4, 1, 1.1);
    if (S.at('b1', 7.9)) AU.screech(8, 0.8);
    if (A.vis) {
      const kneeling = t < 3.8 || (t > 6.8 && t < 8.6);
      if (kneeling) {
        A.pose = 'kneel'; A.yaw = -PI / 2; A.ph += dt * 7;
        if (t > (S.nextHit || 0)) { AU.clack(0.25); S.nextHit = t + 0.9; }
      } else if (t < 6.8) { A.pose = 'stand'; A.yaw = lerp(A.yaw, 0, Math.min(1, dt * 5)); }
      else { A.pose = 'stand'; A.yaw = lerp(A.yaw, PI / 2, Math.min(1, dt * 10)); }
      if (S.t1.x <= A.x + 0.4) {
        A.vis = false; AU.impact(1.1, false); S.shake = 0.7; S.glitch = 0.4;
        S.items.push({ x: A.x, y: 1.6, z: A.z, vx: -8, vy: 3, vz: -3.4, w: 0.3, d: 0.3, h: 0.16, col: [240, 240, 236], yaw: 0, vr: 8 });
        burst(S, A.x, 0.6, 0, 20, { vx: -10, s: 2.5, col: [150, 140, 126], life: 1.2 });
      }
    }
    if (t < 2.0) B.pose = 'stand';
    else if (t < 7.0) { walkTo(B, 16, -9, 1.3, dt); B.y = Math.abs(B.z) < 1.6 ? 0.36 : 0; }
    else if (!S.bArr) { S.bArr = walkTo(B, 5, -3.2, 5, dt); B.y = 0; }
    else { B.yaw = Math.atan2(A.x - B.x, A.z - B.z); B.pose = t < 11 ? 'wave' : 'call'; B.ph += dt * 8; }
    if (S.at('bs1', 7.8)) AU.shout();
    if (S.at('bs2', 8.4)) AU.shout();
    updItems(S, dt);
    if (t > 7.9) brakeSparks(S, S.t1, dt);
    noiseFor(S, [S.t1, S.t2]);
  },

  draw(S) {
    skyGround(S.env);
    hills(41, [150, 152, 146], 700, 50);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    const L = [];
    const w1 = catenary(L, 0, -1, 55, 20), w2 = catenary(L, 4.5, 1, 55, 20);
    trainDrawables(L, S.t1); trainDrawables(L, S.t2);
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    L.push({ k: adist(-6.5, -5.5, 0, 2.4, -3.5, -3.3), d: () => { line3([-6, 0, -3.4], [-6, 1.8, -3.4], [80, 80, 80], 0.07, 1); box({ x: -6, z: -3.4, y: 1.6, w: 0.9, d: 0.05, h: 0.7, col: [230, 190, 30] }); } });
    personDrawable(L, S.A); personDrawable(L, S.B);
    itemDrawables(L, S);
    sortDraw(L);
    w1(); w2();
    trainLights(S.t1, 1); trainLights(S.t2, 1);
  },
});

/* =====================================================================
   K-10  Bariyersiz hemzemin geçit: traktör ve römork (lokomotif kamerası)
   ===================================================================== */
SCENES.push({
  title: 'Bariyersiz geçitte römork', place: 'Bariyersiz hemzemin geçit, KM 288+010', placeShort: 'KM 288+010',
  camLabel: 'LOK-2', kind: 'cab', stamp: '2026-09-02 11:03:37', dur: 17, danger: [4.5, 8.3], preview: 6,
  outcome: 'AĞIR YARALI', victim: 'Traktör sürücüsü, 58 yaşında',
  cue: 'traktör geçide yaklaşırken durmadan, iki yöne bakmadan hatta girmeye devam ettiğinde',
  q: {
    text: 'Bariyersiz hemzemin geçitte sürücü ne yapmalıydı?',
    opts: [
      'Geçitten önce tamamen durmalı, iki yöne bakıp dinlemeli, ancak tren yoksa geçmeliydi.',
      'Yavaşça ilerlemeli, tren görünürse hızlanıp geçmeliydi.',
      'Işık ve bariyer olmadığına göre bu hattan sık tren geçmediğini düşünebilirdi.',
      'Korna çalarak geçtiğini makiniste bildirmeliydi.',
    ],
    why: 'Bariyersiz geçitlerde uyarıyı veren tek şey levhalar ve senin dikkatindir. Traktör ve römork gibi uzun, yavaş araçlar hattı saniyelerce kapatır.',
  },
  rule: 'Hemzemin geçitte dur, bak, dinle; tren görünüyorsa asla geçmeye çalışma.',
  fact: 'Tren her zaman önceliklidir: raylar üzerinde yön değiştiremez, kaçamaz ve kısa mesafede duramaz.',

  init(S) {
    S.env = mkEnv({ sky: ['#7fa0c4', '#e0e2da'], ground: ['#8c8a62', '#6a6848'], fog: [210, 214, 212], fogD: 420, lum: 1.05, amb: 0.5, L: nrm(0.3, 0.85, 0.4) });
    S.plan = trainPlan({ v: 25, brakeAt: 8.5, decel: 1.0, tImpact: 12.3, xImpact: 318.9 });
    S.tr = mkTrain({ z: 0, cars: ['loco_d', 'pass', 'pass'] });
    S.cam = new Cam({ x: 0, y: 3.5, z: 0.55, yaw: PI / 2, pitch: -0.035, F: 780 });
    S.trac = { x: 320, z: 18.7, yaw: PI, y: 0.3, vz: 0, vyaw: 0 };
    S.trl = { x: 320, z: 24.3, yaw: PI, y: 0.3, vx: 0, vz: 0, vyaw: 0, bales: [
      { f: 1.2, s: 0.55, l: 0 }, { f: 1.2, s: -0.55, l: 0 }, { f: 0, s: 0.55, l: 0 }, { f: 0, s: -0.55, l: 0 },
      { f: -1.2, s: 0.55, l: 0 }, { f: -1.2, s: -0.55, l: 0 }, { f: 0.6, s: 0, l: 1 }, { f: -0.6, s: 0, l: 1 }] };
    S.D = mkPerson({ x: 320, y: 0.9, z: 18.7, yaw: PI, pose: 'sit', kb: -1, shirt: [110, 100, 80], pants: [60, 56, 50], hair: [170, 170, 166] });
    S.items = [];
    const r = srand(123);
    S.trees = [];
    for (let i = 0; i < 110; i++) {
      const x = r() * 900 - 50, z = (r() < 0.5 ? -1 : 1) * (12 + r() * 90), s = 0.8 + r() * 0.9, sd = (r() * 1e6) | 0;
      if (Math.abs(x - 320) < 14 && Math.abs(z) < 40) continue;
      S.trees.push([x, z, s, sd]);
    }
    S.rum = AU.rumble();
    S.cam.x = S.plan.pos(0) - 1;
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, cam = S.cam, trac = S.trac, trl = S.trl, D = S.D;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    S.speed = tr.v * 3.6; S.brake = t > 8.5;
    cam.x = tr.x - 1.0; cam.y = 3.5 + 0.012 * Math.sin(t * 23); cam.pitch = -0.035 + 0.0025 * Math.sin(t * 31);
    if (S.at('h1', 7.4)) AU.horn(3.0, 1.1);
    if (S.at('h2', 10.8)) AU.horn(1.5, 1.1);
    if (S.at('br', 8.5)) AU.screech(9, 0.6);
    if (S.rum) S.rum.set(0.5, tr.v);
    if (!S.hit) {
      trac.z = 3.4 - 1.8 * (t - 8.5); trl.z = trac.z + 5.6;
      const [sx, sz] = offs(trac, -0.55, 0);
      D.x = sx; D.z = sz; D.y = 0.9; D.yaw = trac.yaw; D.pose = 'sit';
      if (tr.x >= 318.9) {
        S.hit = t; S.crack = makeCrack();
        AU.impact(1.6, true); S.shake = 1.3; S.glitch = 0.5;
        trl.vx = tr.v + 5; trl.vz = -9; trl.vyaw = 5;
        trac.vz = -3; trac.vyaw = 2.2;
        D.pose = 'flail'; D.kb = -0.2; D.vx = 4; D.vz = -6; D.vy = 3.5; D.vp = -4; D.vr = 2;
        for (const b of trl.bales) {
          b.free = true;
          const [bx, bz] = offs(trl, b.f, b.s);
          S.items.push({ x: bx, y: 1.5 + b.l * 0.5, z: bz, vx: tr.v + rnd(0, 8), vy: rnd(2, 6), vz: rnd(-10, 4), w: 1.0, d: 1.1, h: 0.5, col: [196, 168, 92], yaw: 0, vr: rnd(-6, 6), floor: 0.05 });
        }
        burst(S, 320, 1.5, 1.5, 120, { vx: tr.v * 0.8, s: 4, col: [214, 190, 120], life: 2.2, size: 0.06, drag: 0.8, g: 3 });
      }
    } else {
      trac.z += trac.vz * dt; trac.yaw += trac.vyaw * dt; trac.vz *= Math.pow(0.2, dt); trac.vyaw *= Math.pow(0.25, dt);
      trl.x += trl.vx * dt; trl.z += trl.vz * dt; trl.yaw += trl.vyaw * dt;
      trl.vx *= Math.pow(0.35, dt); trl.vz *= Math.pow(0.35, dt); trl.vyaw *= Math.pow(0.4, dt);
      ragdoll(D, dt, 0.3);
    }
    updItems(S, dt);
  },

  draw(S) {
    const cx = S.cam.x, ctx = R.ctx;
    skyGround(S.env);
    hills(61, [120, 136, 150], 800, 70);
    const cols = [[178, 160, 104], [104, 124, 74], [128, 104, 78], [150, 150, 96]];
    for (let k = Math.floor((cx - 90) / 90); k * 90 < cx + 700; k++) {
      const x0 = k * 90;
      face2(x0, x0 + 90, 5, 220, 0.01, cols[((k % 4) + 4) % 4]);
      face2(x0, x0 + 90, -220, -5, 0.01, cols[((k * 3 + 1) % 4 + 4) % 4]);
    }
    trackBed(0, cx - 20, cx + 700, { span: 700 });
    face2(316.5, 323.5, -90, 90, 0.3, [104, 100, 92]);
    rails(0, cx - 20, cx + 700, { span: 700 });
    const L = [];
    const wires = telePoles(L, -5.5, Math.floor((cx - 60) / 45) * 45, cx + 600, 45, 7);
    for (const tt of S.trees) if (tt[0] > cx - 20 && tt[0] < cx + 520) tree(L, tt[0], tt[1], tt[2], tt[3]);
    for (let x = Math.ceil(cx / 100) * 100; x < cx + 400; x += 100) L.push({ k: adist(x - 0.1, x + 0.1, 0, 1, -3.1, -2.9), d: () => box({ x, z: -3, w: 0.15, d: 0.15, h: 1.0, col: [236, 236, 230] }) });
    L.push({ k: adist(312, 315, 0, 3.4, -5.6, -4.4), d: () => { crossingSign(314, -4.6, false, 0); line3([312.6, 0, -5.4], [312.6, 1.9, -5.4], [80, 80, 80], 0.08, 1); disc(312.6, 2.1, -5.4, 0.38, [200, 30, 30], 1, 1); } });
    L.push({ k: adist(325, 327, 0, 3.4, 4, 5), d: () => crossingSign(326, 4.6, false, 0) });
    building(L, 352, 40, 10, 8, 5, [200, 186, 160], [70, 70, 70]);
    building(L, 336, 58, 12, 9, 6, [186, 170, 150], [70, 70, 70]);
    const trac = S.trac, trl = S.trl;
    L.push({ k: adist(trac.x - 2.5, trac.x + 2.5, 0, 3, trac.z - 2.5, trac.z + 2.5), d: () => {
      drawTractor(trac);
      if (!S.hit) { const [ax, az] = offs(trac, -1.3, 0), [bx, bz] = offs(trl, 2.4, 0); line3([ax, 0.8, az], [bx, 0.8, bz], [30, 30, 30], 0.08, 1); }
    } });
    L.push({ k: adist(trl.x - 3, trl.x + 3, 0, 3, trl.z - 3, trl.z + 3), d: () => drawTrailer(trl) });
    personDrawable(L, S.D);
    itemDrawables(L, S);
    sortDraw(L);
    wires();
    if (S.crack) {
      ctx.strokeStyle = 'rgba(235,240,240,0.75)'; ctx.lineWidth = 1.3;
      for (const pl of S.crack) { ctx.beginPath(); pl.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
      ctx.fillStyle = 'rgba(230,235,235,0.2)'; ctx.beginPath(); ctx.arc(W * 0.58, H * 0.4, 26, 0, PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#0b0c0d';
    ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(66, -40); ctx.lineTo(24, H + 40); ctx.lineTo(-40, H + 40); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W + 40, -40); ctx.lineTo(W - 66, -40); ctx.lineTo(W - 24, H + 40); ctx.lineTo(W + 40, H + 40); ctx.fill();
    ctx.fillRect(-40, -40, W + 80, 58);
  },
});

/* =====================================================================
   K-11  Rayda poz: arkadaşının telefon kaydı
   ===================================================================== */
SCENES.push({
  title: 'Rayda poz', place: 'Açık hat, KM 19+300', placeShort: 'KM 19+300',
  camLabel: 'TEL', kind: 'phone', stamp: '2026-05-04 18:58:10', dur: 14, danger: [0.4, 7.0], preview: 3,
  outcome: 'AĞIR YARALI', victim: 'Rayın üzerinde video çeken 20 yaşındaki genç',
  cue: 'kayıt başladığında: genç, elektrikli hattın rayı üzerinde poz veriyordu',
  q: {
    text: 'Fotoğraf ya da video için raylara çıkmak neden ölümcül olabilir?',
    opts: [
      'Elektrikli trenler çok sessizdir ve yüksek hızda saniyeler içinde gelir; fark ettiğinde kaçacak zaman kalmaz.',
      'Değildir; tren görününce kenara çekilmek için bol zaman vardır.',
      'Yalnızca gece çekilen fotoğraflar tehlikelidir.',
      'Tehlike yalnızca köprülerde ve tünellerde vardır.',
    ],
    why: 'Uzaktan gelen bir trenin hızını gözle tahmin etmek zordur; tren son saniyelerde bir anda büyür. Trenin gövdesi rayların dışına taşar, rayın hemen yanı da güvenli değildir.',
  },
  rule: 'Fotoğraf, video ya da oyun için asla raylara çıkma.',
  fact: 'Saatte 120 km hızla giden bir tren her saniye 33 metre yol alır. 300 metre uzaktaki bir tren 10 saniyeden kısa sürede yanındadır.',

  init(S) {
    S.env = mkEnv({ sky: ['#6f8fb2', '#f0c99a'], ground: ['#7d8250', '#555a36'], fog: [230, 206, 170], fogD: 380, lum: 1.0, amb: 0.52, L: nrm(0.75, 0.35, 0.5) });
    S.base = { x: -6, y: 1.6, z: -9, yaw: 0.95, pitch: -0.02 };
    S.cam = new Cam(Object.assign({ F: 620 }, S.base));
    S.plan = trainPlan({ dir: -1, v: 33, brakeAt: 7.6, decel: 1.0, tImpact: 8.35, xImpact: 0.3 });
    S.tr = mkTrain({ z: 0, dir: -1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    S.A = mkPerson({ x: 0, y: 0.53, z: -0.72, yaw: -2.5, shirt: [230, 230, 224], pants: [50, 64, 110], hair: [60, 40, 28] });
    S.F = mkPerson({ x: -6.6, y: 0, z: -9.9, yaw: 0.95, shirt: [60, 60, 70], pants: [40, 40, 44], vis: false });
    S.trees = scatterTrees(7, 40, -200, 300, [[10, 70], [-80, -16]], (x, z) => z < 0 && x < 10 && x > -30);
    S.rum = AU.rumble(); S.wind = AU.wind(0.03);
  },

  update(S, dt) {
    const t = S.t, A = S.A, F = S.F, tr = S.tr, cam = S.cam, b = S.base;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    if (!S.drop) {
      cam.x = b.x; cam.y = b.y + 0.01 * Math.sin(t * 1.7);
      cam.yaw = b.yaw + 0.012 * Math.sin(t * 1.3) + 0.005 * Math.sin(t * 3.9);
      cam.pitch = b.pitch + 0.008 * Math.sin(t * 1.1 + 1); cam.roll = 0.012 * Math.sin(t * 0.9);
    } else {
      const u = clamp((t - S.drop) / 0.55, 0, 1), e = u * u;
      cam.y = lerp(b.y, 0.12, e); cam.roll = lerp(0, 1.35, e); cam.pitch = lerp(b.pitch, 0.22, e); cam.yaw = lerp(b.yaw, 0.62, e); cam.x = b.x + 0.3 * e;
      if (u >= 1 && S.once('land')) { S.shake = 0.35; AU.impact(0.3, false); }
    }
    if (S.at('h', 7.4)) AU.horn(1.2, 1, 1.15);
    if (S.at('br', 7.6)) AU.screech(6, 0.7);
    if (S.at('fs', 7.5)) AU.shout();
    if (!S.hit) {
      if (t < 7.45) {
        A.pose = 'stand'; A.yaw = -2.5; A.roll = 0.05 * Math.sin(t * 1.6);
        A.ov = { shL: 0.15 + 0.1 * Math.sin(t * 2), abL: 1.4, shR: 0.1 - 0.1 * Math.sin(t * 2), abR: 1.45, elL: 0.1, elR: 0.1, lean: 0.04 * Math.sin(t * 1.4) };
      } else if (t < 7.9) { A.ov = null; A.roll = 0; A.pose = 'stand'; A.yaw = lerp(-2.5, PI / 2 + 0.2, sstep((t - 7.45) / 0.3)); }
      else {
        if (S.once('jump')) { A.vz = -3.2; A.vy = 2.6; A.vx = -0.4; }
        A.pose = 'jump'; A.vy -= 9.8 * dt; A.x += A.vx * dt; A.y = Math.max(0.05, A.y + A.vy * dt); A.z += A.vz * dt;
      }
      if (tr.x <= A.x + 0.3 && A.z > -2.4) { S.hit = t; A.vx = -6; A.vz = -3.5; A.vy = 3; A.vp = 4; A.vr = 2; AU.impact(1.0, false); S.shake = 0.5; S.glitch = 0.2; }
    } else ragdoll(A, dt, 0.05);
    if (t >= 8.55 && !S.drop) { S.drop = t; S.glitch = 0.3; AU.shout(); }
    if (t > 9.2) {
      F.vis = true;
      if (!F.arr) F.arr = walkTo(F, A.x - 0.8, A.z - 0.8, 5, dt);
      else { F.yaw = Math.atan2(A.x - F.x, A.z - F.z); F.pose = 'kneel'; F.ph += dt * 3; }
    }
    if (S.at('fs2', 9.6)) AU.shout();
    if (t > 7.6) brakeSparks(S, tr, dt);
    noiseFor(S, [tr], 0.5);
  },

  draw(S) {
    skyGround(S.env);
    glow(S.cam.x + 400, 60, S.cam.z + 700, 140, '255,214,150', 0.35, 40);
    hills(23, [150, 132, 120], 750, 80);
    face2(-300, 300, -30, -2.4, 0.01, [118, 124, 70]);
    trackBed(0); rails(0);
    const L = [];
    const wires = catenary(L, 0, 1, 60, 30);
    trainDrawables(L, S.tr);
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    personDrawable(L, S.A); personDrawable(L, S.F);
    sortDraw(L);
    wires();
    trainLights(S.tr, 1);
  },
});

/* =====================================================================
   K-12  Raya düşen telefon: yeraltı istasyonu
   ===================================================================== */
SCENES.push({
  title: 'Raya düşen telefon', place: 'Yeraltı istasyonu, 1. peron', placeShort: 'YERALTI İST. PERON-1',
  camLabel: 'KAM-16', kind: 'cctv', stamp: '2026-02-26 22:41:15', dur: 15, danger: [3.1, 6.0], preview: 4.4,
  outcome: 'ÖLÜM', victim: 'Telefonunu almak için raya inen yolcu, 24 yaşında',
  cue: 'yolcu telefonunu almak için peron kenarına oturup raya inmeye hazırlandığında',
  q: {
    text: 'Raya bir eşyan düştüğünde ne yapmalısın?',
    opts: [
      'Asla raya inme; istasyon görevlisine haber ver, eşyayı güvenli şekilde onlar alsın.',
      'Tren saatine bak; birkaç dakika varsa hızlıca inip al.',
      'Birinin seni izlemesini iste, tren gelirse bağırsın.',
      'Peron kenarına yatıp elinle uzanarak al.',
    ],
    why: 'Peron yüksekliği bir metreyi aşabilir; raydan perona geri çıkmak sanıldığından çok zordur. Tren tünelden çıktığında kaçmak için yalnızca birkaç saniye kalır. Bazı hatlarda raylar yüksek gerilim de taşıyabilir.',
  },
  rule: 'Raya düşen hiçbir eşya için raya inme; görevliye haber ver.',
  fact: 'Telefonun yenisi alınır. İstasyon görevlilerinin raya düşen eşyaları güvenle almak için özel aparatları ve prosedürleri vardır.',

  init(S) {
    S.env = mkEnv({ sky: ['#111317', '#1c1f24'], ground: ['#1c1f22', '#101214'], fog: [30, 32, 34], fogD: 300, fogMax: 0.8, lum: 0.9, amb: 0.75, night: true, L: nrm(0, 1, 0) });
    S.cam = new Cam({ x: 18, y: 4.0, z: -8, yaw: -1.25, pitch: -0.2, F: 700 });
    S.plan = trainPlan({ dir: 1, v: 16, brakeAt: 7.6, decel: 1.3, tImpact: 8.75, xImpact: 3.7 });
    S.tr = mkTrain({ z: 0, dir: 1, cars: ['emu_c', 'emu', 'emu', 'emu_c'], clipX: -38 });
    S.A = mkPerson({ x: 4, y: 1.05, z: -2.4, yaw: -0.4, phone: true, shirt: [120, 50, 90], pants: [36, 36, 44], hair: [40, 26, 18] });
    S.B = mkPerson({ x: 7.5, y: 1.05, z: -4.8, yaw: -1.4, shirt: [90, 96, 104], pants: [50, 46, 40], hair: [30, 30, 30] });
    S.C = mkPerson({ x: 10, y: 1.05, z: -7.6, yaw: -1.6, shirt: [180, 150, 60], pants: [60, 60, 70] });
    S.D = mkPerson({ x: -8, y: 1.05, z: -7.2, yaw: 0.8, shirt: [50, 50, 56], pants: [40, 40, 44], phone: true });
    S.items = [];
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, A = S.A, B = S.B, C = S.C, D = S.D, tr = S.tr;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    if (S.at('ch', 0.5)) AU.chime();
    if (S.at('h', 6.1)) AU.horn(1.8, 0.9, 1.1);
    if (S.at('br', 7.6)) AU.screech(5, 0.8);
    if (A.vis) {
      if (t < 1.2) A.pose = 'stand';
      else if (t < 3.2) {
        if (S.once('drop')) { A.phone = false; S.items.push({ x: 4.2, y: 1.9, z: -2.2, vx: 0, vy: 0.5, vz: 1.3, w: 0.08, d: 0.16, h: 0.02, col: [20, 22, 26], yaw: 0, vr: 6, floor: 0.08 }); }
        A.pose = t < 1.6 ? 'stand' : 'lean'; A.yaw = lerp(A.yaw, 0, Math.min(1, dt * 5));
      } else if (t < 3.9) { A.pose = 'sit'; A.yaw = 0; A.z = -2.05; A.y = 0.58; }
      else if (t < 4.3) { const u = (t - 3.9) / 0.4; A.pose = 'jump'; A.y = lerp(0.58, 0.05, u * u); A.z = lerp(-2.05, -1.2, u); }
      else if (t < 5.0) { const ph = S.items[0]; walkTo(A, ph.x - 0.3, ph.z - 0.3, 1.6, dt); A.y = 0.05; }
      else if (t < 5.6) { A.pose = 'crouch'; A.yaw = 0.3; if (t > 5.3) S.items[0].hidden = true; }
      else if (t < 6.3) walkTo(A, 4, -1.62, 2.4, dt);
      else { A.pose = 'hang'; A.x = 4; A.z = -1.62; A.yaw = PI; A.ph += dt * 7; A.y = 0.05 + 0.18 * Math.abs(Math.sin(t * 3)); }
      if (tr.x >= A.x - 0.3) { A.vis = false; AU.impact(1.1, false); S.shake = 0.6; S.glitch = 0.45; }
    }
    if (A.vis) {
      if (t > 6.0) { if (!B.arr) B.arr = walkTo(B, 4.3, -2.35, 3.5, dt); else { B.pose = 'kneel'; B.yaw = 0; B.ph += dt * 5; } }
    } else { B.pose = 'sit'; B.y = lerp(B.y, 0.55, Math.min(1, dt * 4)); B.z = lerp(B.z, -3.2, Math.min(1, dt * 2)); }
    if (t > 6.2) { C.pose = 'wave'; C.yaw = -PI / 2; C.ph += dt * 8; }
    if (S.at('cs', 6.4)) AU.shout();
    if (S.at('cs2', 7.4)) AU.shout();
    if (t > 9.4) { D.phone = false; D.pose = 'call'; }
    updItems(S, dt);
    if (t > 7.6) brakeSparks(S, tr, dt);
    noiseFor(S, [tr], 1.3);
  },

  draw(S) {
    const t = S.t, tr = S.tr;
    skyGround(S.env);
    face([[-38, 0, 2.6], [70, 0, 2.6], [70, 4.8, 2.6], [-38, 4.8, 2.6]], [150, 156, 150], 0.85);
    face([[-38, 1.2, 2.59], [70, 1.2, 2.59], [70, 1.35, 2.59], [-38, 1.35, 2.59]], [40, 110, 150], 0.9);
    const ads = [[210, 190, 150], [160, 190, 210], [200, 160, 160]];
    for (let i = 0, x = -30; x < 60; x += 11, i++) face([[x, 1.7, 2.58], [x + 5, 1.7, 2.58], [x + 5, 3.4, 2.58], [x, 3.4, 2.58]], ads[i % 3], 1.25);
    face([[-38, 0, -10], [70, 0, -10], [70, 4.8, -10], [-38, 4.8, -10]], [128, 124, 116], 0.8);
    face([[-38, 4.8, -10], [70, 4.8, -10], [70, 4.8, 2.6], [-38, 4.8, 2.6]], [64, 66, 68], 0.8);
    for (const lz of [-5.5, 0.4]) face([[-37, 4.78, lz], [70, 4.78, lz], [70, 4.78, lz + 0.3], [-37, 4.78, lz + 0.3]], [255, 252, 240], 1.4);
    face([[-38, 0, -10], [-38, 0, 2.6], [-38, 4.8, 2.6], [-38, 4.8, -10]], [112, 116, 112], 0.75);
    face([[-37.95, 0, -1.75], [-37.95, 0, 1.85], [-37.95, 4.3, 1.85], [-37.95, 4.3, -1.75]], 'rgb(6,6,8)');
    const tg = clamp((t - 4.3) / 1.6, 0, 1);
    if (tg > 0 && tr.x < -36) glow(-38, 2.2, 0, 5, '255,244,210', 0.7 * tg, 10);
    face2(-38, 70, -1.9, 2.6, 0.0, [52, 50, 48]);
    rails(0, -38, 70);
    const L1 = [];
    trainDrawables(L1, tr);
    if (S.A.vis && S.A.y < 0.9) personDrawable(L1, S.A);
    itemDrawables(L1, S);
    sortDraw(L1);
    const Lp = [];
    platform(Lp, -38, 70, -10, -1.9, 1.05, { edge: 1, col: [100, 100, 104] });
    Lp[0].d();
    const L2 = [];
    for (const p of [S.B, S.C, S.D]) personDrawable(L2, p);
    if (S.A.vis && S.A.y >= 0.9) personDrawable(L2, S.A);
    L2.push({ k: adist(2.5, 5.5, 3.2, 3.8, -4.6, -4.4), d: () => {
      line3([3, 3.8, -4.5], [3, 4.8, -4.5], [60, 60, 60], 0.03, 1);
      line3([5, 3.8, -4.5], [5, 4.8, -4.5], [60, 60, 60], 0.03, 1);
      box({ x: 4, z: -4.5, y: 3.2, w: 3, d: 0.2, h: 0.6, col: [20, 20, 22] });
      ledText(4, 3.5, -4.62, t > 4.5 ? (Math.floor(t * 2) % 2 ? 'TREN YAKLAŞIYOR' : '') : 'SONRAKİ TREN 2 DK');
    } });
    sortDraw(L2);
    if (tr.x > -38) trainLights(tr, 1);
    for (let x = -30; x < 66; x += 12) glow(x, 4.7, -5.35, 2.5, '255,250,230', 0.22, 6);
  },
});
