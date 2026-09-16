'use strict';
/* Kayıt 13–14 + yeni sahneler için ortak yardımcılar */

function cabMask() {
  const ctx = R.ctx;
  ctx.fillStyle = '#0b0c0d';
  ctx.beginPath(); ctx.moveTo(-40, -40); ctx.lineTo(66, -40); ctx.lineTo(24, H + 40); ctx.lineTo(-40, H + 40); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W + 40, -40); ctx.lineTo(W - 66, -40); ctx.lineTo(W - 24, H + 40); ctx.lineTo(W + 40, H + 40); ctx.fill();
  ctx.fillRect(-40, -40, W + 80, 58);
}

function crossingRoad(z0, z1, col) {
  for (let z = z0; z < z1; z += 3) {
    const y0 = roadY(z) + 0.012, y1 = roadY(z + 3) + 0.012;
    face([[-3.6, y0, z], [3.6, y0, z], [3.6, y1, z + 3], [-3.6, y1, z + 3]], col, lightF(0, 1, 0), true, 0.9);
  }
  for (let z = z0 + 2; z < z1; z += 4) { if (Math.abs(z) < 9) continue; face2(-0.07, 0.07, z, z + 2, roadY(z) + 0.03, [205, 205, 196], 1, 0); }
  face2(0, 3.5, -7.3, -6.9, 0.03, [216, 216, 206], 1, 0);
  face2(-3.5, 0, 6.9, 7.3, 0.03, [216, 216, 206], 1, 0);
  for (const rz of [-0.7175, 0.7175]) line3([-3.6, 0.53, rz], [3.6, 0.53, rz], [170, 166, 156], 0.07, 1);
}

function easeTo(t, a, b, t0, t1) { return lerp(a, b, 1 - Math.pow(1 - clamp((t - t0) / (t1 - t0), 0, 1), 2)); }

/* =====================================================================
   K-13  Yağmurda geçitte kuyrukta kalmak
   ===================================================================== */
const K13_LAMPS = [[-5.5, -12], [5.5, 12], [-5.5, 24], [5.5, -22]];

SCENES.push({
  title: 'Geçitte kuyrukta kalmak', place: 'Kent içi hemzemin geçit, KM 6+820', placeShort: 'HEMZ. GEÇİT KM 6+820',
  camLabel: 'KAM-04', kind: 'cctv', stamp: '2026-11-18 17:36:05', dur: 16, danger: [1.2, 4.2], preview: 5,
  outcome: 'ÖLÜM', victim: 'Geçitte mahsur kalan sürücü, 47 yaşında',
  cue: 'sürücü, öndeki araç geçidin hemen ardında dururken rayların üzerine girdiğinde',
  q: {
    text: 'Sürücünün asıl hatası neydi?',
    opts: [
      'Karşı tarafta aracının sığacağı boş yer yokken geçide girmek; sıkışınca da araçtan inmemek.',
      'Öndeki araca fazla yaklaşmamak.',
      'Bariyer inerken korna çalmak.',
      'Işıklar yanmadan geçide girmek; ışık yanmıyorsa geçitte durmak her zaman güvenlidir.',
    ],
    why: 'Hemzemin geçide yalnızca karşı tarafta aracının tamamen sığacağı kadar boş yer varsa girilir. Trafik durursa arkandaki bariyer iner ve rayların üstünde mahsur kalırsın.',
  },
  rule: 'Karşıda yer yoksa geçide girme; rayda sıkışırsan hemen araçtan in ve uzaklaş.',
  fact: 'Rayda mahsur kalırsan araçtan in ve trenin geldiği yöne doğru, raylardan çapraz açıyla uzaklaş. Çarpışmada araç parçaları trenin gittiği yöne savrulur.',

  init(S) {
    S.env = mkEnv({ sky: ['#1b232e', '#57606c'], ground: ['#2d2f31', '#1b1c1d'], fog: [66, 72, 80], fogD: 190, lum: 0.62, amb: 0.7, night: true, rain: 0.75, clouds: 0, L: nrm(0.2, 0.9, -0.3) });
    S.cam = new Cam({ x: -16, y: 7, z: -18, yaw: 0.9, pitch: -0.22, F: 720 });
    S.plan = trainPlan({ dir: -1, v: 24, brakeAt: 9.2, decel: 1.1, tImpact: 10.4, xImpact: 2.7 });
    S.tr = mkTrain({ z: 0, dir: -1, cars: ['loco_e', 'pass', 'pass', 'pass', 'pass'] });
    S.c1 = { x: 1.75, z: -8, yaw: 0, y: 0, col: [40, 62, 120] };
    S.c2 = { x: 1.75, z: -24, yaw: 0, y: 0, col: [196, 198, 200] };
    S.c3 = { x: 1.75, z: -45, yaw: 0, y: 0, col: [110, 30, 30] };
    S.c4 = { x: -1.75, z: 40, yaw: PI, y: 0, col: [60, 60, 62] };
    S.barA = 1.45;
    S.rum = AU.rumble(); S.wind = AU.wind(0.07);
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, c1 = S.c1, c2 = S.c2, c3 = S.c3, c4 = S.c4;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    c1.z = easeTo(t, -8, 7.5, 0, 2.8);
    c3.z = easeTo(t, -45, -9.6, 0, 5.8);
    c4.z = easeTo(t, 40, 10.2, 1.5, 6.5);
    S.lights = t > 3.0;
    if (S.at('bell', 3.0)) AU.bell(13);
    S.barA = lerp(1.45, 0, sstep((t - 4.2) / 3));
    for (const [k, tt] of [['k1', 6.0], ['k2', 6.45], ['k3', 7.6], ['k4', 8.1], ['k5', 8.5]]) if (S.at(k, tt)) AU.horn(0.22, 0.3, 1.9);
    if (S.at('h', 8.4)) AU.horn(2.4, 1);
    if (S.at('b', 9.2)) AU.screech(6.5, 0.9);
    if (!S.hit) {
      c2.z = easeTo(t, -24, 1.3, 0, 3.6);
      if (tr.x <= c2.x + 0.95) {
        S.hit = true; AU.impact(1.5, true); S.shake = 1.1; S.glitch = 0.4;
        c2.vx = -tr.v * 0.8; c2.vz = 2.2; c2.vr = 4.2;
        burst(S, c2.x + 0.9, 1.0, c2.z, 45, { vx: -tr.v * 0.5, s: 3.5, col: [210, 225, 235], size: 0.05, life: 1.4 });
        burst(S, c2.x + 0.9, 0.8, c2.z, 20, { vx: -tr.v * 0.7, s: 5, col: [255, 200, 120], add: true, life: 0.5 });
      }
    } else {
      c2.x += c2.vx * dt; c2.z += c2.vz * dt; c2.yaw += c2.vr * dt;
      c2.vx *= Math.pow(0.3, dt); c2.vz *= Math.pow(0.35, dt); c2.vr *= Math.pow(0.4, dt);
      if (Math.abs(c2.z) < 3.2 && c2.x > tr.x - 2.2) { c2.x = tr.x - 2.2; c2.vx = Math.min(c2.vx, -tr.v); }
      if (Math.random() < dt * 18) burst(S, c2.x + 1, 0.4, c2.z, 2, { vx: c2.vx * 0.4, s: 2, col: [255, 180, 90], add: true, life: 0.3 });
    }
    for (const c of [c1, c2, c3, c4]) c.y = Math.abs(c.x) < 3.6 ? roadY(c.z) : 0.3;
    if (t > 9.2) brakeSparks(S, tr, dt);
    noiseFor(S, [tr]);
  },

  draw(S) {
    const t = S.t, tr = S.tr;
    skyGround(S.env);
    hills(47, [40, 44, 52], 650, 30);
    trackBed(0); rails(0);
    crossingRoad(-72, 90, [50, 51, 54]);
    const L = [];
    const wires = catenary(L, 0, 1, 50, 20);
    trainDrawables(L, tr);
    L.push({ k: adist(0, 4.4, 0, 3.4, -5, -3.6), d: () => barrier(4.2, -4.2, 3.9, -1, S.barA, S.lights, t) });
    L.push({ k: adist(-4.4, 0, 0, 3.4, 3.6, 5), d: () => barrier(-4.2, 4.2, 3.9, 1, S.barA, S.lights, t) });
    for (const c of [S.c1, S.c2, S.c3, S.c4]) L.push({ k: adist(c.x - 2.3, c.x + 2.3, 0, 1.6, c.z - 2.3, c.z + 2.3), d: () => drawCar(c) });
    building(L, -22, 26, 16, 10, 12, [120, 116, 110], [214, 180, 110]);
    building(L, 18, 32, 20, 10, 15, [104, 104, 108], [200, 170, 100]);
    building(L, -30, -26, 14, 9, 9, [118, 108, 96], [214, 180, 110]);
    building(L, 26, -24, 18, 9, 7, [130, 124, 116], [214, 180, 110]);
    for (const [x, z] of K13_LAMPS) lampPost(L, x, z, 7, true);
    sortDraw(L);
    wires();
    lights(L);
    for (const [x, z] of K13_LAMPS) glow(x * 0.75, 0.06, z, 3.4, '255,200,130', 0.2, 6);
    trainLights(tr);
    const blink = Math.floor(t * 2.2) % 2 === 0;
    for (const c of [S.c1, S.c2, S.c3]) for (const s of [-0.62, 0.62]) {
      if (c === S.c2 && S.hit) continue;
      const [bx, bz] = offs(c, -2.2, s);
      glow(bx, 0.55 + c.y, bz, 1.1, '255,40,30', 0.85, 3);
      glow(bx, 0.06, bz - 1.4, 1.4, '255,40,30', 0.18, 3);
    }
    if (t > 7 && blink && !S.hit) for (const lf of [-2.2, 2.2]) for (const s of [-0.8, 0.8]) { const [ax, az] = offs(S.c2, lf, s); glow(ax, 0.6 + S.c2.y, az, 1.0, '255,170,40', 0.9, 3); }
    for (const s of [-0.62, 0.62]) {
      const [hx, hz] = offs(S.c4, 2.2, s);
      glow(hx, 0.6 + S.c4.y, hz, 1.6, '255,244,210', 0.8, 4);
      glow(hx, 0.06, hz - 3, 2.6, '255,244,210', 0.2, 4);
    }
  },
});

/* =====================================================================
   K-14  Tünelde kestirme (lokomotif ön kamerası)
   ===================================================================== */
SCENES.push({
  title: 'Tünelde kestirme', place: 'Tünel, KM 311+400', placeShort: 'KM 311+400',
  camLabel: 'LOK-5', kind: 'cab', stamp: '2026-10-04 20:12:31', dur: 14, danger: [4.6, 7.6], preview: 3,
  outcome: 'ÖLÜM', victim: 'Tünelde trenden kaçmaya çalışan 17 yaşındaki genç',
  cue: 'tünelin karanlığında ilerideki fener ışığı ilk göründüğünde: iki genç tünelin içinde yürüyordu',
  q: {
    text: 'İki gençten biri neden kurtuldu?',
    opts: [
      'Koşmak yerine duvara yapışıp hattan olabildiğince uzakta durdu; ama bu bir şanstı, güvenli bir yol değil.',
      'Daha hızlı koştuğu için trenden kaçabildi.',
      'Fenerini makiniste tuttuğu için tren zamanında durdu.',
      'Kollarını sallayıp treni durdurdu.',
    ],
    why: 'Trenden koşarak kaçılamaz ve tünelde kaçacak bir çıkış yoktur. Duvara yapışmak bazen hayat kurtarır ama çoğu tünelde tren ile duvar arasındaki boşluk bir insana yetmez. Tek güvenli yol tünele hiç girmemektir.',
  },
  rule: 'Demiryolu tünellerine asla girme; kestirme için bile.',
  fact: 'Tünelde ses yankılanır, trenin hangi yönden geldiğini anlamak zorlaşır. Karanlıkta makinist yürüyen birini ancak farların aydınlattığı kısa mesafede görebilir.',

  init(S) {
    S.day = { lum: 1.0, amb: 0.52, fog: [206, 212, 214], fogD: 420, fogMax: 0.9 };
    S.env = mkEnv({ sky: ['#6f8fb0', '#d5dcdc'], ground: ['#76794f', '#565a3a'], fog: S.day.fog.slice(), fogD: 420, L: nrm(0.4, 0.8, 0.3) });
    S.plan = trainPlan({ v: 22, brakeAt: 8.2, decel: 1.0, tImpact: 10.0, xImpact: 135.74 });
    S.tr = mkTrain({ z: 0, cars: ['loco_d', 'pass', 'pass'] });
    S.cam = new Cam({ x: S.plan.pos(0) - 1, y: 3.5, z: 0.55, yaw: PI / 2, pitch: -0.03, F: 780 });
    S.A = mkPerson({ x: 118.5, y: 0.36, z: -0.35, yaw: PI / 2, shirt: [150, 40, 60], pants: [40, 40, 50], hair: [60, 40, 24] });
    S.B = mkPerson({ x: 120, y: 0.36, z: 0.4, yaw: PI / 2, shirt: [200, 200, 196], pants: [50, 60, 96], hair: [24, 20, 16], backpack: [40, 50, 70] });
    S.trees = scatterTrees(14, 34, -520, -70, [[14, 80], [-80, -14]], null);
    S.items = [];
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, cam = S.cam, A = S.A, B = S.B, e = S.env, d = S.day;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    S.speed = tr.v * 3.6; S.brake = t > 8.2;
    cam.x = tr.x - 1; cam.y = 3.5 + 0.012 * Math.sin(t * 23); cam.pitch = -0.03 + 0.0025 * Math.sin(t * 31);
    const u = clamp((cam.x + 6) / 14, 0, 1);
    S.inside = u;
    e.lum = lerp(d.lum, 0.55, u); e.amb = lerp(d.amb, 0.9, u);
    e.fog = [lerp(d.fog[0], 2, u), lerp(d.fog[1], 2, u), lerp(d.fog[2], 3, u)];
    e.fogD = lerp(d.fogD, 30, u); e.fogMax = lerp(d.fogMax, 1, u);
    e.night = u > 0.5; e.grain = lerp(0.5, 0.3, u); e.shadowA = lerp(0.32, 0, u);
    if (S.rum) S.rum.set(lerp(0.45, 0.85, u), tr.v);
    if (S.at('h1', 7.6)) AU.horn(2.2, 1.1);
    if (S.at('h2', 9.4)) AU.horn(1.6, 1.1);
    if (S.at('br', 8.2)) AU.screech(8, 0.8);
    const walk = Math.min(t, 8);
    A.x = 118.5 + 1.2 * walk;
    if (t < 8) { A.pose = 'walk'; A.ph = t * 4.3; A.yaw = PI / 2; }
    else if (t < 8.35) { A.pose = 'stand'; A.yaw = lerp(PI / 2, -PI / 2, (t - 8) / 0.35); }
    else if (A.z > -2.35) { A.z = Math.max(-2.35, A.z - 3.2 * dt); A.pose = 'run'; A.ph += dt * 8; A.yaw = PI; }
    else { A.pose = 'stand'; A.yaw = 0; A.ov = { shL: -0.15, shR: -0.15, abL: 0.25, abR: 0.25, head: -0.2 }; }
    if (B.vis) {
      B.x = 120 + 1.2 * walk + 4.6 * Math.max(0, t - 8.6);
      if (t < 8) { B.pose = 'walk'; B.ph = t * 4.3 + 1.7; B.yaw = PI / 2; }
      else if (t < 8.6) { B.pose = 'stand'; B.yaw = t < 8.3 ? lerp(PI / 2, -PI / 2, (t - 8) / 0.3) : lerp(-PI / 2, PI / 2, (t - 8.3) / 0.3); }
      else { B.pose = 'run'; B.yaw = PI / 2; B.ph += dt * 10.5; }
      if (tr.x >= B.x - 0.3) {
        B.vis = false; AU.impact(1.0, false); S.shake = 0.45; S.glitch = 0.5;
        S.items.push({ x: B.x + 2, y: 1.3, z: 0.6, vx: 24, vy: 2, vz: -1.2, w: 0.08, d: 0.16, h: 0.02, col: [20, 20, 24], yaw: 0, vr: 10, floor: 0.36, light: true });
      }
    }
    updItems(S, dt);
  },

  draw(S) {
    const cx = S.cam.x, ctx = R.ctx, t = S.t;
    skyGround(S.env);
    if (cx < 2) {
      hills(71, [104, 116, 96], 700, 70);
      face2(-600, 0, -300, -6, 0.01, [104, 116, 70]);
      face2(-600, 0, 6, 300, 0.01, [110, 118, 74]);
      for (const s of [-1, 1]) face([[-160, 0, s * 6], [0, 0, s * 3.6], [0, 16, s * 42], [-160, 3, s * 80]], [92, 104, 64], lightF(0, 0.8, -s * 0.6), true, 1);
    }
    trackBed(0, cx - 20, cx + 360, { span: 400 });
    rails(0, cx - 20, cx + 360, { span: 400 });
    const xEnd = cx + 300;
    for (let x = Math.max(0, Math.floor((cx - 8) / 8) * 8); x < xEnd; x += 8) {
      const x2 = x + 8, wc = [104, 98, 90], rc = [84, 80, 76];
      for (const s of [-1, 1]) {
        face([[x, 0, s * 2.9], [x2, 0, s * 2.9], [x2, 4.6, s * 2.9], [x, 4.6, s * 2.9]], wc, 1, true, 1.2);
        face([[x, 4.6, s * 2.9], [x2, 4.6, s * 2.9], [x2, 6.4, s * 1.5], [x, 6.4, s * 1.5]], rc, 1, true);
        face([[x, 0.02, s * 2.9], [x2, 0.02, s * 2.9], [x2, 0.02, s * 2.2], [x, 0.02, s * 2.2]], [58, 54, 50], 1, true);
        line3([x, 2.1, s * 2.85], [x2, 2.1, s * 2.85], [40, 40, 40], 0.06, 0.6);
      }
      face([[x, 6.4, -1.5], [x2, 6.4, -1.5], [x2, 6.4, 1.5], [x, 6.4, 1.5]], rc, 1, true);
      if (x % 48 === 0) glow(x + 4, 1.6, -2.8, 0.25, '80,255,140', 0.6, 1.5);
    }
    face([[xEnd, 0, -3], [xEnd, 0, 3], [xEnd, 7, 3], [xEnd, 7, -3]], 'rgb(2,2,3)');
    if (cx < 0.5) {
      const st = [124, 118, 106], F0 = lightF(-1, 0, 0);
      face([[0, 0, -40], [0, 0, -2.8], [0, 16, -2.8], [0, 16, -40]], st, F0, true, 1);
      face([[0, 0, 2.8], [0, 0, 40], [0, 16, 40], [0, 16, 2.8]], st, F0, true, 1);
      face([[0, 7.1, -2.8], [0, 7.1, 2.8], [0, 16, 2.8], [0, 16, -2.8]], st, F0, true, 1);
      const arc = (a0, a1, x) => { const p = []; for (let i = 0; i <= 10; i++) { const a = lerp(a0, a1, i / 10); p.push([x, 4.3 + 2.8 * Math.sin(a), 2.8 * Math.cos(a)]); } return p; };
      face([[0, 7.1, -2.8]].concat(arc(PI / 2, PI, 0)), st, F0, true);
      face([[0, 7.1, 2.8]].concat(arc(0, PI / 2, 0)), st, F0, true);
      const ring = arc(0, PI, -0.05);
      for (let i = 0; i < ring.length - 1; i++) line3(ring[i], ring[i + 1], [84, 78, 70], 0.4, 1);
      for (const s of [-1, 1]) line3([-0.05, 0, s * 2.8], [-0.05, 4.3, s * 2.8], [84, 78, 70], 0.4, 1);
      face([[-0.4, 16, -40], [-0.4, 16, 40], [-0.4, 16.8, 40], [-0.4, 16.8, -40]], [100, 96, 88], F0, true);
      face([[0, 16.8, -40], [0, 16.8, 40], [30, 24, 40], [30, 24, -40]], [86, 98, 60], lightF(-0.3, 1, 0), true, 1);
    }
    const L = [];
    let wires = null;
    if (cx < 0) { wires = telePoles(L, -5.2, -540, -20, 45, 7); for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]); }
    personDrawable(L, S.A); personDrawable(L, S.B);
    itemDrawables(L, S);
    sortDraw(L);
    if (wires) wires();
    for (const P of [S.A, S.B]) {
      if (!P.vis) continue;
      const toward = t > 8.2 && !(P === S.B && t > 8.6);
      glow(P.x + (toward ? -0.45 : 0.45), 1.25, P.z, toward ? 1.8 : 0.9, '225,238,255', toward ? 1 : 0.55, 3);
      if (!toward) glow(P.x + 5, 0.4, P.z, 3.5, '225,238,255', 0.16, 4);
    }
    for (const it of S.items) if (it.light) glow(it.x, it.y + 0.05, it.z, 0.8, '225,238,255', 0.6, 2);
    if (S.inside > 0) {
      const hy = R.cam.horizon(), g = ctx.createRadialGradient(W / 2, hy + 60, 10, W / 2, hy + 60, 440);
      g.addColorStop(0, 'rgba(255,240,205,' + (0.2 * S.inside).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,205,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
    cabMask();
  },
});
