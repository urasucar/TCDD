'use strict';
/* Kayıt 5–8 */

/* =====================================================================
   K-05  Çift hat: yük treni geçer geçmez karşıya koşmak (ikinci tren)
   ===================================================================== */
SCENES.push({
  title: 'İkinci tren', place: 'Yaya hemzemin geçidi, istasyon doğusu', placeShort: 'YAYA GEÇİDİ İST. DOĞU',
  camLabel: 'KAM-05', kind: 'cctv', stamp: '2026-01-08 16:31:54', dur: 16, danger: [7.7, 10.2], preview: 3.2,
  outcome: 'ÖLÜM', victim: 'Karşıya geçmek isteyen yaya, 61 yaşında',
  cue: 'yük treninin son vagonu geçer geçmez yaya öbür hattı kontrol etmeden koşmaya başladığında',
  q: {
    text: 'Yük treni geçtikten sonra yaya ne yapmalıydı?',
    opts: [
      'Durup iki yöne de yeniden bakmalı, öbür hattan tren gelmediğinden emin olmalıydı.',
      'Son vagon geçer geçmez hızla koşup karşıya geçmeliydi.',
      'Uyarı ışığı olmadığı için hattın boş olduğunu varsayabilirdi.',
      'Öbür trenin kornasını beklemeli, korna duymazsa geçmeliydi.',
    ],
    why: 'Çift hatlı yerlerde geçen tren, öbür hattan yaklaşan ikinci treni hem görüntü hem ses olarak saklar. "İkinci tren" kazası olarak bilinen bu durum, yaya geçitlerinde tipik bir ölüm nedenidir.',
  },
  rule: 'Bir tren geçtikten sonra ikinci tren için yeniden dur, bak, dinle.',
  fact: 'Geçen bir trenin gürültüsü, öbür hattan yaklaşan trenin sesini tamamen örtebilir. Elektrikli trenler dizel trenlerden çok daha sessizdir.',

  init(S) {
    S.env = mkEnv({ sky: ['#7d8ea0', '#d9cfbf'], ground: ['#6e6b5a', '#4a483d'], fog: [196, 190, 182], fogD: 300, lum: 0.92, amb: 0.55, L: nrm(0.7, 0.45, 0.35) });
    S.cam = new Cam({ x: -2, y: 7.5, z: -21, yaw: 0.28, pitch: -0.24, F: 740 });
    S.fr = mkTrain({ z: 0, dir: 1, cars: ['loco_d', 'box', 'tank', 'box', 'box', 'tank', 'hopper', 'box', 'box', 'tank'] });
    S.frL = trainLen(S.fr);
    S.plan = trainPlan({ dir: -1, v: 19, brakeAt: 9.6, decel: 1.2, tImpact: 10.45, xImpact: 0.4 });
    S.emu = mkTrain({ z: 4.5, dir: -1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    S.P = mkPerson({ x: 0, y: 0, z: -4.8, yaw: 0, shirt: [96, 70, 60], pants: [52, 50, 48], hair: [200, 200, 196] });
    S.W = mkPerson({ x: 7.5, z: -7.6, yaw: -0.4, shirt: [70, 100, 130], pants: [40, 40, 44] });
    S.items = [];
    S.trees = scatterTrees(55, 26, -140, 140, [[-45, -12], [14, 60]], (x, z) => Math.abs(x) < 6 || (z < 0 && x > -30 && x < 25));
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, P = S.P, fr = S.fr, emu = S.emu, W = S.W;
    fr.x = S.frL + 1.6 + 12 * (t - 7.6); fr.v = 12;
    emu.x = S.plan.pos(t); emu.v = S.plan.speed(t);
    if (S.at('h', 9.5)) AU.horn(1.6, 1, 1.12);
    if (S.at('b', 9.6)) AU.screech(6, 0.9);
    if (P.vis) {
      if (t < 7.85) { P.pose = 'stand'; P.yaw = 0; }
      else if (P.z < 3.3 && t < 10.3) { P.z = Math.min(3.3, P.z + 3.4 * dt); P.pose = 'run'; P.ph += dt * 3.4 * 2.3; P.yaw = 0; }
      else { P.pose = 'stand'; P.yaw = lerp(P.yaw, 1.3, dt * 8); }
      P.y = P.z < -1.5 ? 0.36 * clamp((P.z + 2.2) / 0.7, 0, 1) : 0.36;
      if (emu.x <= P.x + 0.4) {
        P.vis = false; AU.impact(1.1, false); S.shake = 0.6; S.glitch = 0.35;
        S.items.push({ x: 0.2, y: 0.9, z: 3.0, vx: -4, vy: 2, vz: -2.2, w: 0.3, d: 0.2, h: 0.35, col: [236, 236, 230], vr: 5, floor: 0.3 });
        for (let i = 0; i < 6; i++) S.items.push({ x: 0.2, y: 0.9, z: 3.0, vx: rnd(-6, -1), vy: rnd(1, 3), vz: rnd(-3, -0.5), w: 0.09, d: 0.09, h: 0.09, col: [236, 130, 30], vr: 8, floor: 0.3 });
        burst(S, 0, 0.6, 3.1, 20, { vx: -emu.v * 0.4, s: 2, col: [140, 130, 118], life: 1.1 });
      }
    }
    if (t > 9.8) {
      W.yaw = Math.atan2(-W.x, 3 - W.z); W.pose = t < 10.6 ? 'wave' : (t < 12 ? 'stand' : 'call'); W.ph += dt * 8;
      if (S.at('ws', 9.9)) AU.shout();
      if (S.at('ws2', 10.9)) AU.shout();
    }
    updItems(S, dt);
    if (t > 9.6) brakeSparks(S, emu, dt);
    noiseFor(S, [fr, emu]);
  },

  draw(S) {
    skyGround(S.env);
    hills(17, [140, 130, 124], 700, 50);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    face2(-1.5, 1.5, -40, -2.2, 0.02, [132, 126, 114]);
    face2(-1.5, 1.5, 6.7, 40, 0.02, [132, 126, 114]);
    for (const z of [0, 4.5]) face2(-1.5, 1.5, z - 1.5, z + 1.5, 0.37, [150, 146, 138]);
    face2(-1.5, 1.5, 1.5, 3.0, 0.3, [140, 136, 128]);
    for (const z of [0, 4.5]) for (const rz of [-0.7175, 0.7175]) line3([-1.5, 0.53, z + rz], [1.5, 0.53, z + rz], [176, 172, 162], 0.07, 1);
    const L = [];
    const w1 = catenary(L, 0, -1, 50, 25), w2 = catenary(L, 4.5, 1, 50, 25);
    trainDrawables(L, S.fr); trainDrawables(L, S.emu);
    for (const [xa, xb, z] of [[-9, -1.6, -6.2], [1.6, 9, -6.2], [-9, -1.6, 8.7], [1.6, 9, 8.7]]) L.push({ k: adist(xa, xb, 0, 1.2, z - 0.1, z + 0.1), d: () => {
      line3([xa, 1.1, z], [xb, 1.1, z], [210, 206, 196], 0.06, 1);
      line3([xa, 0.6, z], [xb, 0.6, z], [210, 206, 196], 0.05, 1);
      for (let x = xa; x <= xb + 0.01; x += 1.85) line3([x, 0, z], [x, 1.15, z], [200, 196, 186], 0.07, 1);
    } });
    L.push({ k: adist(-2.6, -2.2, 0, 3.4, -6.8, -6.4), d: () => crossingSign(-2.4, -6.6, false, S.t) });
    building(L, 16, 17, 16, 7, 5, [182, 168, 146], [70, 76, 84]);
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    personDrawable(L, S.P); personDrawable(L, S.W);
    itemDrawables(L, S);
    sortDraw(L);
    w1(); w2();
    trainLights(S.emu, 1); trainLights(S.fr, 1);
  },
});

/* =====================================================================
   K-06  Kalkan trene yetişmeye çalışmak
   ===================================================================== */
function k06X(t) {
  if (t < 2.8) return 70;
  if (t < 7.6) return 70 + 0.45 * (t - 2.8) * (t - 2.8);
  const v0 = 4.32, tb = Math.min(t - 7.6, v0 / 1.3);
  return 70 + 10.368 + v0 * tb - 0.65 * tb * tb;
}
function k06V(t) { return t < 2.8 ? 0 : t < 7.6 ? 0.9 * (t - 2.8) : Math.max(0, 4.32 - 1.3 * (t - 7.6)); }
function canopy(x0, x1) {
  face([[x0, 4.95, -9.5], [x1, 4.95, -9.5], [x1, 4.95, -3.3], [x0, 4.95, -3.3]], [96, 98, 100], 0.9);
  face([[x0, 4.95, -3.3], [x1, 4.95, -3.3], [x1, 5.5, -3.3], [x0, 5.5, -3.3]], [150, 40, 36], 0.9);
  for (let x = x0 + 4; x < x1 - 4; x += 8) face([[x, 4.94, -6.6], [x + 3, 4.94, -6.6], [x + 3, 4.94, -6.3], [x, 4.94, -6.3]], [255, 255, 245], 1.3);
}

SCENES.push({
  title: 'Kalkan trene yetişmek', place: 'Banliyö durağı, 2. peron', placeShort: 'BANLİYÖ PERON-2',
  camLabel: 'KAM-14', kind: 'cctv', stamp: '2026-03-09 07:52:26', dur: 15, danger: [1.9, 6.2], preview: 2.6,
  outcome: 'AĞIR YARALI', victim: 'Kalkan trene binmeye çalışan yolcu, 28 yaşında',
  cue: 'kapı uyarısı çalarken yolcu kalkmak üzere olan trene doğru koşmaya başladığında',
  q: {
    text: 'Yolcu ne yapmalıydı?',
    opts: [
      'Kapı uyarısı başladığında durmalı ve bir sonraki treni beklemeliydi.',
      'Kapıyı elle zorlayıp açmalı, sonra binmeliydi.',
      'Trenle aynı hızda koşup kapıdan atlamalıydı.',
      'Makiniste el sallayıp treni durdurmasını istemeliydi.',
    ],
    why: 'Hareket eden trenle peron arasındaki boşluk bir insanın düşeceği kadar geniştir. Kapı uyarısı başladıktan sonra trene binmeye çalışmak, düşme ve trenin altına çekilme riski demektir.',
  },
  rule: 'Kapı uyarısı başladıysa trene binmeye çalışma; bir sonraki treni bekle.',
  fact: 'Kaçırılan bir tren birkaç dakika gecikme demektir. Tren ile peron arasına düşmek ise ömür boyu sürecek bir sakatlığa yol açabilir.',

  init(S) {
    S.env = mkEnv({ sky: ['#aab4bd', '#e4e2da'], ground: ['#76776a', '#55574c'], fog: [206, 208, 204], fogD: 320, lum: 1.0, amb: 0.58, L: nrm(-0.5, 0.75, -0.4) });
    S.cam = new Cam({ x: -14, y: 4.6, z: -7.2, yaw: 1.07, pitch: -0.2, F: 700 });
    S.tr = mkTrain({ x: 70, z: 0, dir: 1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    S.P = mkPerson({ x: -19, y: 1, z: -5.6, yaw: 1.2, shirt: [40, 44, 52], pants: [70, 80, 110], hair: [34, 26, 20], backpack: [110, 36, 34] });
    S.staff = mkPerson({ x: 9, y: 1, z: -6.2, yaw: -1.2, shirt: [232, 112, 30], vest: true, pants: [40, 44, 56] });
    S.o1 = mkPerson({ x: -4, y: 1, z: -8.0, yaw: 0.8, shirt: [120, 110, 100], pants: [40, 40, 40] });
    S.o2 = mkPerson({ x: 3, y: 1, z: -7.6, yaw: -0.6, shirt: [60, 90, 70], pants: [50, 50, 60], phone: true });
    S.items = [];
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, P = S.P, tr = S.tr;
    tr.x = k06X(t); tr.v = k06V(t);
    if (S.at('beep', 0.9)) AU.beeps(7);
    if (S.at('brk', 7.6)) AU.screech(3.4, 0.8);
    const doorX = tr.x - 76.33;
    if (!S.fall) {
      if (t < 1.6) { P.pose = 'stand'; }
      else if (!S.along) { if (walkTo(P, doorX - 0.5, -2.15, 5.2, dt)) S.along = true; else P.pose = 'run'; }
      else { P.x = doorX - 0.3; P.z = -2.15; P.yaw = PI / 2; P.pose = 'run'; P.ph += dt * Math.max(tr.v, 2) * 2.3; P.ov = { shR: 1.35, elR: 0.15, abR: 0.55 }; }
      if (t >= 6.35) {
        S.fall = t; S.fallX = P.x; P.ov = null;
        P.vx = tr.v; P.vy = 0.6; P.vz = 1.1; P.vp = 3.5; P.vr = 0.8;
        S.items.push({ x: P.x, y: 1.4, z: -2.3, vx: tr.v * 0.6, vy: 0.5, vz: -1.5, w: 0.35, d: 0.2, h: 0.45, col: [110, 36, 34], vr: 4, floor: 1.0 });
        P.backpack = null;
        AU.impact(0.5, false);
      }
    } else {
      ragdoll(P, dt, P.z > -1.95 ? -1.5 : 1.0);
      P.z = Math.min(P.z, -1.62);
      if (P.y < -0.9) P.vis = false;
      const since = t - S.fall;
      if (S.at('sh', S.fall + 0.35)) AU.shout();
      if (S.at('sh2', S.fall + 1.4)) AU.shout();
      const s = S.staff;
      if (since > 0.6) { if (!s.arr) s.arr = walkTo(s, S.fallX + 0.6, -2.6, 4.6, dt); else { s.pose = 'kneel'; s.yaw = 0; s.ph += dt * 2; } }
      const o1 = S.o1;
      if (since > 1.0) { if (!o1.arr) o1.arr = walkTo(o1, S.fallX + 6, -2.9, 4.0, dt); else { o1.pose = 'wave'; o1.yaw = PI / 2; o1.ph += dt * 7; } }
      const o2 = S.o2;
      if (since > 1.5) { o2.phone = false; o2.pose = 'call'; o2.yaw = Math.atan2(S.fallX - o2.x, -2 - o2.z); }
    }
    updItems(S, dt);
    if (t > 7.6) brakeSparks(S, tr, dt);
    noiseFor(S, [tr]);
  },

  draw(S) {
    skyGround(S.env);
    hills(8, [136, 140, 138], 700, 36);
    canopy(-40, 90);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    const L1 = [], L2 = [];
    const w1 = catenary(L2, 0, -1, 50, 6), w2 = catenary(L1, 4.5, 1, 50, 6);
    trainDrawables(L1, S.tr);
    platform(L1, -80, 160, 6.0, 12, 1.0, { edge: -1 });
    building(L1, 40, 18, 40, 9, 8, [150, 150, 146], [70, 80, 90]);
    if (S.P.vis && S.P.y < 0.85) personDrawable(L1, S.P);
    sortDraw(L1);
    const Lp = [];
    platform(Lp, -80, 160, -10, -1.9, 1.0, { edge: 1 });
    Lp[0].d();
    if (S.P.vis && S.P.y >= 0.85) personDrawable(L2, S.P);
    for (const o of [S.staff, S.o1, S.o2]) personDrawable(L2, o);
    itemDrawables(L2, S);
    sortDraw(L2);
    w1(); w2();
  },
});

/* =====================================================================
   K-07  Duran yük treninin altından geçmek
   ===================================================================== */
SCENES.push({
  title: 'Vagonun altından kestirme', place: 'Köy istasyonu, bekleme yolu', placeShort: 'KÖY İST. BEKLEME YOLU',
  camLabel: 'KAM-02', kind: 'cctv', stamp: '2026-06-27 13:40:08', dur: 15, danger: [3.8, 7.6], preview: 5.8,
  outcome: 'ÖLÜM', victim: 'Duran trenin altından geçmeye çalışan genç, 17 yaşında',
  cue: 'genç duran yük treninin dibine çömelip altından geçmeye hazırlandığında',
  q: {
    text: 'Duran bir trenin altından geçmek neden ölümcüldür?',
    opts: [
      'Tren haber vermeden hareket edebilir; makinist yüzlerce metre gerideki vagonun altını göremez.',
      'Değildir; duran trenin kalkması dakikalar sürer, geçmek için bol zaman vardır.',
      'Yalnızca lokomotifin yakını tehlikelidir; arka vagonlar güvenlidir.',
      'Tehlike yalnızca vagonlar arasındaki bağlantı kancalarındadır.',
    ],
    why: 'Uzun bir yük treninde makinist kabinden son vagonları göremez. Tren kalkarken vagonlar arasındaki boşluklar kapanır ve vagonlar ani bir sarsıntıyla hareket eder; altta kalan birinin kaçacak zamanı olmaz.',
  },
  rule: 'Duran trenin altından ya da vagon aralarından asla geçme; üst geçidi veya yaya geçidini kullan.',
  fact: 'Yük trenleri yüzlerce metre uzunluğunda olabilir. Treni dolanmak birkaç dakika sürer; altından geçmek hayatına mal olabilir.',

  init(S) {
    S.env = mkEnv({ sky: ['#8aa0b6', '#e2ddd0'], ground: ['#8a8466', '#5e5a46'], fog: [214, 208, 196], fogD: 360, lum: 1.05, amb: 0.5, L: nrm(0.2, 0.9, -0.35) });
    S.cam = new Cam({ x: -3, y: 6.5, z: -18, yaw: 0.15, pitch: -0.25, F: 760 });
    S.tr = mkTrain({ x: 42, z: 0, dir: 1, lights: false, cars: ['loco_d', 'box', 'tank', 'box', 'hopper', 'box', 'tank', 'box'] });
    S.P = mkPerson({ x: -6.5, z: -8.5, yaw: 0.6, shirt: [204, 200, 190], pants: [52, 64, 96], hair: [28, 20, 16], backpack: [40, 70, 50] });
    S.W = mkPerson({ x: 9, z: -6.5, yaw: -1.8, shirt: [150, 60, 50], pants: [60, 56, 50], hair: [80, 76, 70] });
    S.items = [];
    S.trees = scatterTrees(77, 22, -120, 120, [[-50, -14], [12, 55]], (x, z) => z < 0 && x > -20 && x < 16);
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, P = S.P, tr = S.tr, W = S.W;
    tr.x = t < 7.9 ? 42 : t < 8.1 ? 42 + 0.35 * sstep((t - 7.9) / 0.2) : 42.35 + 0.225 * (t - 8.1) * (t - 8.1);
    tr.v = t < 8.1 ? 0 : 0.45 * (t - 8.1);
    if (S.at('h1', 7.0)) AU.horn(0.35, 0.45);
    if (S.at('h2', 7.5)) AU.horn(0.35, 0.45);
    if (S.at('cp', 7.9)) { AU.couplers(10); S.shake = 0.15; }
    if (P.vis) {
      if (t < 0.4) P.pose = 'stand';
      else if (t < 4.2) walkTo(P, -1.6, -2.7, 2.1, dt);
      else if (t < 5.0) {
        P.x = -1.6; P.z = -2.7; P.pose = 'crouch'; P.yaw = 0;
        if (S.once('bag')) { P.backpack = null; S.items.push({ x: -2.4, y: 0.05, z: -3.1, vx: 0, vy: 0, vz: 0, w: 0.35, d: 0.25, h: 0.45, col: [40, 70, 50], yaw: 0.4, rest: true }); }
      } else {
        P.pose = 'crawl'; P.kb = 4;
        P.pitch = lerp(P.pitch, PI / 2, Math.min(1, dt * 5)); P.y = lerp(P.y, -0.5, Math.min(1, dt * 5));
        if (t < 7.9) { P.z += 0.5 * dt; P.ph += dt * 3; }
        else if (t > 8.2) { P.z -= 0.25 * dt; P.ph += dt * 9; }
      }
      if (t > 8 && tr.x - 44.6 >= P.x - 0.3) { P.vis = false; AU.impact(0.8, false); S.shake = 0.5; S.glitch = 0.45; }
    }
    if (t > 7.9) {
      W.yaw = Math.atan2(P.x - W.x, P.z - W.z);
      W.pose = P.vis ? 'wave' : (t < 10.6 ? 'stand' : 'call'); W.ph += dt * 8;
      if (S.at('ws', 8.0)) AU.shout();
      if (S.at('ws2', 8.9)) AU.shout();
    }
    updItems(S, dt);
    noiseFor(S, [tr], 1.4);
  },

  draw(S) {
    skyGround(S.env);
    hills(31, [150, 146, 136], 700, 60);
    face2(-200, 200, -30, -2.3, 0.01, [128, 118, 94]);
    trackBed(0); rails(0); trackBed(5.5); rails(5.5);
    const [a, b] = trainSpan(S.tr);
    face([[a, 0.37, -1.3], [b, 0.37, -1.3], [b, 0.37, 1.3], [a, 0.37, 1.3]], 'rgba(10,8,6,0.45)');
    const L = [];
    trainDrawables(L, S.tr);
    building(L, 4, 17, 14, 7, 5.5, [214, 196, 160], [60, 66, 74]);
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    lampPost(L, -12, -5, 5.5, false);
    personDrawable(L, S.P); personDrawable(L, S.W);
    itemDrawables(L, S);
    sortDraw(L);
  },
});

/* =====================================================================
   K-08  Demiryolu köprüsünde yürümek
   ===================================================================== */
SCENES.push({
  title: 'Köprüde kestirme', place: 'Demiryolu köprüsü, KM 402+150', placeShort: 'KÖPRÜ KM 402+150',
  camLabel: 'KAM-21', kind: 'cctv', stamp: '2026-08-30 19:26:47', dur: 16, danger: [0.4, 4.4], preview: 3.2,
  outcome: 'AĞIR YARALI', victim: 'Köprüden nehre atlayan 19 yaşındaki genç',
  cue: 'kayıt başladığında: iki genç demiryolu köprüsünün üzerinde yürüyordu',
  q: {
    text: 'Demiryolu köprüsünde yürümek neden özellikle tehlikelidir?',
    opts: [
      'Köprüde trenden kaçacak yer yoktur; tren gelince geriye koşmak ya da atlamak zorunda kalırsın.',
      'Köprüde trenler yavaşladığı için aslında daha güvenlidir.',
      'Tehlike yalnızca korkuluğu olmayan köprülerdedir.',
      'Köprüde yürümek yalnızca gece tehlikelidir.',
    ],
    why: 'Köprü ve tünellerde hattın iki yanında güvenli bir boşluk kalmaz. Treni duyduğunda köprünün sonuna koşarak yetişmek çoğu zaman imkânsızdır.',
  },
  rule: 'Demiryolu köprülerine ve tünellerine asla girme; karayolu köprüsünü kullan.',
  fact: 'Bir tren saniyede 20–30 metre yol alabilir. Yüksekten suya düşmek kırık, iç organ yaralanması ve boğulma riski taşır.',

  init(S) {
    S.env = mkEnv({ sky: ['#2f3a52', '#c88c62'], ground: ['#2a3434', '#1a2020'], fog: [128, 110, 104], fogD: 320, lum: 0.72, amb: 0.62, night: true, L: nrm(0.8, 0.25, -0.4) });
    S.cam = new Cam({ x: -38, y: 3, z: -12, yaw: 1.15, pitch: -0.28, F: 650 });
    S.plan = trainPlan({ dir: -1, v: 18, brakeAt: 4.6, decel: 0.9, tImpact: 8.7, xImpact: -22.5 });
    S.tr = mkTrain({ z: 0, y: 0.25, dir: -1, cars: ['loco_d', 'pass', 'pass', 'pass'] });
    S.A = mkPerson({ x: -20, y: 0.25, z: -1.9, yaw: PI / 2, shirt: [50, 80, 140], pants: [40, 40, 46] });
    S.B = mkPerson({ x: -21.6, y: 0.25, z: -1.85, yaw: PI / 2, shirt: [200, 170, 70], pants: [60, 60, 70], hair: [20, 16, 12] });
    S.trees = scatterTrees(91, 30, -110, -34, [[-30, 60]], (x, z) => z < 12 && x > -80).concat(scatterTrees(92, 20, 34, 90, [[-10, 60]], null));
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, A = S.A, B = S.B, tr = S.tr;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    if (S.at('h1', 4.2)) AU.horn(2.0);
    if (S.at('h2', 6.8)) AU.horn(1.8);
    if (S.at('br', 4.6)) AU.screech(11, 0.7);
    if (t < 4.6) { A.x = -20 + 1.3 * t; A.pose = 'walk'; A.ph = t * 4.7; }
    else if (t < 4.9) { A.pose = 'stand'; A.yaw = lerp(PI / 2, -PI / 2, (t - 4.6) / 0.3); }
    else if (A.x > -31) walkTo(A, -31.2, -1.9, 5.6, dt);
    else if (!S.aSafe) S.aSafe = walkTo(A, -34, -5.5, 4, dt);
    else { A.pose = t > 8.4 ? 'wave' : 'stand'; A.yaw = 0.9; A.ph += dt * 7; }
    if (S.at('as1', 8.4)) AU.shout();
    if (S.at('as2', 10.1)) AU.shout();
    if (S.at('as3', 11.8)) AU.shout();

    if (!S.jump) {
      if (t < 4.6) { B.x = -21.6 + 1.3 * t; B.pose = 'walk'; B.ph = t * 4.7 + 1.5; }
      else if (t < 4.9) { B.pose = 'stand'; B.yaw = lerp(PI / 2, -PI / 2, (t - 4.6) / 0.3); }
      else if (t < 5.6) { B.x -= 4.6 * dt; B.pose = 'run'; B.yaw = -PI / 2; B.ph += dt * 10.6; }
      else if (t < 6.4) { B.pose = 'kneel'; }
      else if (t < 7.3) { B.x -= 4.2 * dt; B.pose = 'run'; B.ph += dt * 9.6; }
      else if (t < 7.5) { B.pose = 'stand'; B.yaw = lerp(-PI / 2, PI / 2, (t - 7.3) / 0.2); }
      else { B.pose = 'climb'; B.yaw = PI; B.z = lerp(-1.85, -2.25, clamp((t - 7.5) / 0.6, 0, 1)); B.y = lerp(0.25, 1.2, sstep((t - 7.5) / 0.6)); B.ph += dt * 6; }
      if (t >= 8.15) { S.jump = t; B.vx = -0.5; B.vy = 2.4; B.vz = -2.2; B.vp = 2.5; B.vr = 0.6; B.pose = 'flail'; AU.shout(); }
    } else if (!S.splash) {
      ragdoll(B, dt, -9);
      if (B.y < -8.4) {
        S.splash = t; AU.splash(); B.vis = false; S.bx = B.x; S.bz = B.z;
        burst(S, B.x, -9, B.z, 70, { s: 3.5, col: [220, 232, 238], life: 1.3, floor: -9.2, size: 0.09 });
      }
    }
    noiseFor(S, [tr]);
  },

  draw(S) {
    const t = S.t;
    skyGround(S.env);
    hills(13, [60, 58, 70], 700, 60);
    face([[-26, -9, -150], [26, -9, -150], [26, -9, 500], [-26, -9, 500]], [48, 62, 70], lightF(0, 1, 0));
    for (let i = 0; i < 26; i++) {
      const z = -30 + i * 6 + ((t * 0.7 + i * 1.7) % 6), x = -20 + ((i * 7.3) % 40);
      line3([x, -8.98, z], [x + 2.5 + (i % 3), -8.98, z], [150, 146, 140], 0.05, 0.6);
    }
    face([[-32, 0, -150], [-32, 0, 500], [-24, -9.2, 500], [-24, -9.2, -150]], [92, 84, 64], 0.8);
    face([[32, 0, -150], [32, 0, 500], [24, -9.2, 500], [24, -9.2, -150]], [96, 88, 68], 0.95);
    if (S.splash) for (let i = 0; i < 3; i++) {
      const r = (t - S.splash) * 1.6 - i * 0.9, a = clamp(0.5 - r * 0.06, 0, 0.5);
      if (r <= 0 || a <= 0) continue;
      for (let k = 0; k < 16; k++) {
        const a0 = k / 16 * PI * 2, a1 = (k + 1) / 16 * PI * 2;
        line3([S.bx + Math.cos(a0) * r, -8.97, S.bz + Math.sin(a0) * r], [S.bx + Math.cos(a1) * r, -8.97, S.bz + Math.sin(a1) * r], 'rgba(225,235,240,' + a + ')', 0.04, 0.8);
      }
    }
    if (S.splash && t - S.splash > 1.8) {
      const by = -8.88 + 0.05 * Math.sin(t * 3);
      disc(S.bx, by, S.bz, 0.12, [196, 160, 128], 1, 1.2);
      line3([S.bx + 0.15, by, S.bz], [S.bx + 0.35, by + 0.25 + 0.1 * Math.sin(t * 2), S.bz], [200, 170, 70], 0.08, 1);
    }
    box({ x: 30, z: 0, y: -9.2, w: 6, d: 6, h: 9.2, col: [108, 102, 94], noTop: true });
    for (const px of [10, -10]) box({ x: px, z: 0, y: -9.2, w: 2.4, d: 4.4, h: 7.2, col: [118, 112, 104] });
    box({ x: -30, z: 0, y: -9.2, w: 6, d: 6, h: 9.2, col: [108, 102, 94], noTop: true });
    box({ x: 0, z: 0, y: -2.0, w: 64, d: 4.8, h: 2.25, col: [84, 94, 102], cols: { top: [70, 72, 72] }, decal: (n, map, f) => {
      if (n !== '-z') return;
      for (let u = -31; u < 32; u += 2.5) dq(map, u, -1.95, u + 0.14, 0.2, [64, 72, 80], f);
      dq(map, -32, -2.0, 32, -1.75, [60, 66, 72], f);
    } });
    trackBed(0, -300, -32); trackBed(0, 32, 300);
    rails(0, -300, 300, { y: -0.08 });
    const L = [];
    trainDrawables(L, S.tr);
    for (const rz of [-2.3, 2.3]) for (let x = -32; x < 32; x += 4) L.push({ k: adist(x, x + 4, 0.25, 1.3, rz - 0.05, rz + 0.05), d: () => {
      line3([x, 1.3, rz], [x + 4, 1.3, rz], [70, 76, 82], 0.06, 1);
      line3([x, 0.8, rz], [x + 4, 0.8, rz], [70, 76, 82], 0.04, 1);
      line3([x, 0.25, rz], [x, 1.3, rz], [70, 76, 82], 0.06, 1);
    } });
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    personDrawable(L, S.A); personDrawable(L, S.B);
    sortDraw(L);
    trainLights(S.tr, 1);
  },
});
