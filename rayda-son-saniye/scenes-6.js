'use strict';
/* Kayıt 17–18 */

function drawDog(d) {
  const y = d.y || 0, col = d.col || [150, 110, 60], s = Math.sin(d.ph || 0), sit = d.sit;
  softShadow(d.x, y, d.z, 0.3, 0.2, 0.8);
  for (const [lf, lx, p] of [[0.26, 0.1, 0], [0.26, -0.1, PI], [-0.26, 0.1, PI], [-0.26, -0.1, 0]]) {
    const [hx, hz] = offs(d, lf, lx), sw = sit && lf < 0 ? 0.18 : 0.14 * Math.sin((d.ph || 0) + p) * (d.moving ? 1 : 0);
    const [fx, fz] = offs(d, lf + sw, lx);
    line3([hx, y + (sit && lf < 0 ? 0.15 : 0.38), hz], [fx, y, fz], [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], 0.06, 1);
  }
  const bodyY = y + (sit ? 0.2 : 0.34);
  box({ x: d.x, z: d.z, y: bodyY, w: 0.26, d: 0.7, h: 0.26, yaw: d.yaw, col });
  const [nx, nz] = offs(d, 0.42, 0);
  box({ x: nx, z: nz, y: bodyY + 0.16, w: 0.2, d: 0.28, h: 0.22, yaw: d.yaw, col: [col[0] * 0.9, col[1] * 0.9, col[2] * 0.9] });
  const [tx, tz] = offs(d, -0.36, 0), [ex, ez] = offs(d, -0.6, 0);
  line3([tx, bodyY + 0.2, tz], [ex, bodyY + 0.34 + 0.06 * s, ez], col, 0.05, 1);
}

/* =====================================================================
   K-17  Kaçan köpeğin peşinden hatta girmek
   ===================================================================== */
SCENES.push({
  title: 'Kaçan köpeğin peşinden', place: 'Banliyö hattı, KM 14+700', placeShort: 'BANLİYÖ KM 14+700',
  camLabel: 'KAM-08', kind: 'cctv', stamp: '2026-06-06 17:44:12', dur: 15, danger: [1.9, 4.8], preview: 4,
  outcome: 'AĞIR YARALI', victim: 'Köpeğinin peşinden hatta giren genç, 23 yaşında',
  cue: 'köpek kaçınca sahibi çitteki boşluktan hatta doğru koşmaya başladığında',
  q: {
    text: 'Hayvanın raya kaçarsa ne yapmalısın?',
    opts: [
      'Hattın dışında kal ve hayvanına oradan seslen; asla peşinden hatta girme.',
      'Hemen peşinden koş; tren gelmeden yakalarsın.',
      'Rayların ortasında durup hayvanını çağır; tren seni görürse durur.',
      'Önce birinci hattı geç, ikinci hatta bakmadan hayvanına ulaş.',
    ],
    why: 'Bir şeyi kurtarmaya odaklanan kişi çevresini fark etmez; kornayı duyduğunda kaçmak için vakit kalmayabilir. Çitteki bir boşluk, oradan geçmenin güvenli olduğu anlamına gelmez.',
  },
  rule: 'Hayvanın raya kaçsa bile peşinden hatta girme; hattın dışından seslen.',
  fact: 'Demiryolu çitleri seni trenden korumak için vardır. Kırık bir çit gördüğünde belediyeye ya da demiryolu işletmesine bildirmek başkalarının hayatını da korur.',

  init(S) {
    S.env = mkEnv({ sky: ['#6d93c2', '#dfe6e6'], ground: ['#7f8a58', '#5c6640'], fog: [214, 222, 226], fogD: 420, lum: 1.05, amb: 0.5, L: nrm(0.5, 0.7, -0.5), sun: [1.6, 0.3, '255,236,190'] });
    S.cam = new Cam({ x: -15, y: 6, z: -17, yaw: 0.8, pitch: -0.24, F: 720 });
    S.plan = trainPlan({ dir: -1, v: 22, brakeAt: 6.0, decel: 1.1, tImpact: 6.7, xImpact: 0.9 });
    S.tr = mkTrain({ z: 4.5, dir: -1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    S.Ow = mkPerson({ x: -8, z: -7, yaw: PI / 2, shirt: [60, 90, 140], pants: [44, 44, 50], hair: [30, 22, 16] });
    S.Pb = mkPerson({ x: 12, z: -7.4, yaw: -PI / 2, shirt: [170, 150, 120], pants: [70, 64, 56], hair: [180, 176, 170] });
    S.dog = { x: -6.8, y: 0, z: -6.6, yaw: PI / 2, ph: 0, moving: true, col: [156, 112, 62] };
    S.trees = scatterTrees(177, 30, -120, 140, [[12, 60], [-60, -14]], (x, z) => z < 0 && x < 60);
    S.bushes = scatterTrees(178, 22, -40, 60, [[-4.8, -4.3], [8, 10]], (x, z) => Math.abs(x) < 4 || (z < 0 && x < -8));
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, Ow = S.Ow, dog = S.dog, Pb = S.Pb;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    const dogTo = (x, z, v) => {
      const dx = x - dog.x, dz = z - dog.z, d = Math.hypot(dx, dz);
      if (d < 0.1) { dog.moving = false; return true; }
      const st = Math.min(d, v * dt);
      dog.x += dx / d * st; dog.z += dz / d * st; dog.yaw = Math.atan2(dx, dz); dog.ph += st * 7; dog.moving = true;
      return false;
    };
    if (t < 1.6) { dog.x += 1.3 * dt; dog.ph += dt * 9; }
    else if (!S.dogGap) S.dogGap = dogTo(0, -5, 6.5);
    else if (!S.dogFar) { S.dogFar = dogTo(1.5, 9, 6.5); }
    else if (t < 11.2 || trainSpan(tr)[1] > -8) { dog.sit = true; dog.moving = false; dog.yaw = PI; }
    else if (Ow.gy != null && !S.dogBack) { dog.sit = false; S.dogBack = dogTo(Ow.x + 0.7, Ow.z - 0.6, 5); }
    else { dog.sit = true; dog.yaw = Math.atan2(Ow.x - dog.x, Ow.z - dog.z); }
    if (S.at('bark', 1.6)) AU.shout();
    if (S.at('h1', 5.2)) AU.horn(0.9, 1, 1.1);
    if (S.at('h2', 6.0)) AU.horn(1.4, 1, 1.1);
    if (S.at('br', 6.0)) AU.screech(6, 0.8);

    if (!S.hit) {
      if (t < 1.6) { Ow.x = -8 + 1.3 * t; Ow.pose = 'walk'; Ow.ph = t * 4.7; }
      else if (t < 1.9) { Ow.pose = 'stand'; Ow.ov = { shR: 1.2, elR: 0.2 }; }
      else if (!S.owGap) { Ow.ov = null; S.owGap = walkTo(Ow, 0, -5, 5, dt); }
      else if (!S.owOn) { S.owOn = walkTo(Ow, 0.5, 3.4, 5, dt); }
      else if (t < 6.4) { Ow.pose = 'crouch'; Ow.yaw = 0; Ow.ov = { shR: 1.3 + 0.3 * Math.sin(t * 6), elR: 0.2, head: -0.1 }; }
      else if (t < 6.6) { Ow.pose = 'stand'; Ow.ov = null; Ow.yaw = lerp(0, PI / 2, (t - 6.4) / 0.2); }
      else { Ow.pose = 'jump'; Ow.z -= 2.2 * dt; }
      Ow.y = Math.abs(Ow.z) < 1.6 || Math.abs(Ow.z - 4.5) < 1.6 ? 0.36 : 0;
      if (S.at('os1', 3.6)) AU.shout();
      if (S.at('os2', 5.0)) AU.shout();
      if (tr.x <= Ow.x + 0.4 && Ow.z > 2.7) {
        S.hit = t; Ow.pose = 'flail'; Ow.ov = null;
        Ow.vx = -6; Ow.vy = 2.4; Ow.vz = -3.4; Ow.vp = 5; Ow.vr = 2;
        AU.impact(1.1, false); S.shake = 0.6; S.glitch = 0.3;
      }
    } else {
      ragdoll(Ow, dt, 0.1);
      if (Ow.pose === 'limp') Ow.gy = 0.1;
    }
    if (t < 6.5) { Pb.x -= 1.2 * dt; Pb.pose = 'walk'; Pb.ph += dt * 4.3; }
    else if (!S.hit || t - S.hit < 1.2) { Pb.pose = 'stand'; Pb.yaw = Math.atan2(Ow.x - Pb.x, Ow.z - Pb.z); }
    else { Pb.pose = 'call'; }
    if (t > 7.9) brakeSparks(S, tr, dt);
    noiseFor(S, [tr]);
  },

  draw(S) {
    const tr = S.tr;
    skyGround(S.env);
    hills(19, [120, 140, 150], 700, 45);
    face2(-200, 200, -8.2, -6.2, 0.02, [140, 134, 120]);
    trackBed(0); trackBed(4.5); rails(0); rails(4.5);
    const L = [];
    const w1 = catenary(L, 0, -1, 55, 18), w2 = catenary(L, 4.5, 1, 55, 18);
    trainDrawables(L, tr);
    for (const [xa, xb] of [[-60, -1], [0.8, 60]]) for (let x = xa; x < xb; x += 6) {
      const x2 = Math.min(xb, x + 6);
      L.push({ k: adist(x, x2, 0, 1.8, -5.05, -4.95), d: () => {
        line3([x, 1.7, -5], [x2, 1.7, -5], [110, 116, 110], 0.05, 1);
        line3([x, 0.1, -5], [x2, 0.1, -5], [110, 116, 110], 0.05, 1);
        for (let k = 0; k <= 12; k++) line3([x + (x2 - x) * k / 12, 0.1, -5], [x + (x2 - x) * k / 12, 1.7, -5], [120, 126, 120], 0.012, 0.5);
        line3([x, 0, -5], [x, 1.8, -5], [80, 84, 80], 0.07, 1);
      } });
    }
    L.push({ k: adist(0.8, 1.6, 0, 1.2, -5.2, -4.4), d: () => line3([0.8, 1.7, -5], [1.5, 0.3, -4.5], [110, 116, 110], 0.05, 1) });
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    for (const b of S.bushes) bush(L, b[0], b[1], b[2], b[3]);
    building(L, -26, 26, 22, 10, 14, [196, 186, 170], [80, 90, 100]);
    building(L, 22, 28, 18, 10, 18, [176, 170, 164], [80, 90, 100]);
    L.push({ k: adist(S.dog.x - 0.6, S.dog.x + 0.6, 0, 0.8, S.dog.z - 0.6, S.dog.z + 0.6), d: () => drawDog(S.dog) });
    personDrawable(L, S.Ow); personDrawable(L, S.Pb);
    sortDraw(L);
    w1(); w2();
    if (S.t < 1.6) line3([S.Ow.x + 0.3, 0.95, S.Ow.z + 0.2], [S.dog.x - 0.2, 0.55, S.dog.z], [40, 40, 44], 0.02, 0.8);
    trainLights(tr, 1);
  },
});

/* =====================================================================
   K-18  Hareket eden yük vagonuna tutunmak
   ===================================================================== */
SCENES.push({
  title: 'Vagona tutunmak', place: 'Gar çıkışı, KM 2+150', placeShort: 'GAR ÇIKIŞI KM 2+150',
  camLabel: 'KAM-12', kind: 'cctv', stamp: '2026-07-02 18:31:26', dur: 14, danger: [1.2, 3.2], preview: 5,
  outcome: 'AĞIR YARALI', victim: 'Hareket eden yük vagonuna tutunan 15 yaşındaki genç',
  cue: 'genç, kalkmakta olan yük treninin vagonuna doğru koşmaya başladığında',
  q: {
    text: 'Hareket eden bir yük vagonuna tutunmak neden ölümcül olabilir?',
    opts: [
      'Hat kenarındaki direkler ve sinyaller trene çok yakındır; tren hızlandıkça inmek de imkânsızlaşır.',
      'Yük trenleri çok yavaş gider; tek tehlike ellerin yorulmasıdır.',
      'Makinist aynadan görür ve treni hemen durdurur.',
      'Vagon merdivenleri tutunmak için yapıldığından güvenlidir.',
    ],
    why: 'Vagon merdivenleri yalnızca eğitimli personelin, tren dururken kullanması içindir. Hat kenarındaki direkler ve sinyaller vagon gövdesine çok yakın durur; dışarı sarkan birine çarpar.',
  },
  rule: 'Hareket eden ya da duran bir trene asla tutunma, binme ya da tırmanma.',
  fact: 'Yük trenlerinde makinist, yüzlerce metre gerideki vagonlara tutunan birini göremez; tren durmadan yoluna devam eder.',

  init(S) {
    S.env = mkEnv({ sky: ['#7c96b4', '#e7cfa8'], ground: ['#8d8058', '#62583c'], fog: [226, 210, 180], fogD: 360, lum: 1.0, amb: 0.5, L: nrm(-0.7, 0.45, -0.4), sun: [-1.1, 0.12, '255,210,150'] });
    S.cam = new Cam({ x: 17, y: 6, z: -20, yaw: 0.1, pitch: -0.22, F: 600 });
    S.tr = mkTrain({ x: 69.56, z: 0, dir: 1, lights: false, cars: ['loco_d', 'box', 'box', 'hopper', 'box', 'tank', 'box', 'box', 'hopper', 'box', 'tank', 'box'] });
    S.T = mkPerson({ x: -4, z: -5, yaw: 0.5, shirt: [210, 60, 50], pants: [40, 50, 80], hair: [22, 18, 14] });
    S.F = mkPerson({ x: 6, z: -7, yaw: 0, shirt: [70, 70, 80], pants: [50, 50, 56], phone: true });
    S.trees = scatterTrees(181, 24, -100, 140, [[12, 60], [-60, -14]], (x, z) => z < 0 && x > -10 && x < 45);
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, T = S.T, F = S.F;
    tr.x = 69.56 + 3 * t + 0.175 * t * t; tr.v = 3 + 0.35 * t;
    const lx = tr.x - 78.1;
    if (!S.hit) {
      if (t < 1.2) T.pose = 'stand';
      else if (t < 3.2) walkTo(T, lx + 0.1, -1.95, 4, dt);
      else {
        T.x = lx + 0.1; T.z = -1.95; T.y = lerp(T.y, 0.95, Math.min(1, dt * 8)); T.yaw = 0; T.pose = 'hang'; T.ph += dt * 2;
        T.ov = t > 5 ? { shL: 2.9, elL: 0.2, abL: 0.1, shR: 1.6, abR: 1.25, elR: 0.1, lean: -0.3 - 0.05 * Math.sin(t * 3), head: -0.25, hipL: 0.3, hipR: 0.1 } : null;
        if (S.at('cheer', 4.2)) AU.shout();
      }
      if (t > 8.5 && T.x > 29.4) {
        S.hit = t; T.ov = null; T.pose = 'flail';
        T.vx = tr.v * 0.4; T.vy = 1.5; T.vz = -3; T.vp = -4; T.vr = 1;
        AU.impact(1.0, true); S.shake = 0.5; S.glitch = 0.3;
      }
    } else ragdoll(T, dt, 0.05);
    if (!S.hit) { F.yaw = Math.atan2(T.x - F.x, T.z - F.z); F.pose = t > 3.4 && t < 6 ? 'wave' : 'stand'; F.phone = F.pose === 'stand'; F.ph += dt * 7; }
    else if (t - S.hit > 0.6) {
      F.phone = false;
      if (!F.arr) F.arr = walkTo(F, T.x - 0.8, T.z - 0.8, 5.5, dt);
      else { F.pose = t - S.hit > 4 ? 'call' : 'kneel'; F.yaw = Math.atan2(T.x - F.x, T.z - F.z); F.ph += dt * 2; }
      if (S.at('fs1', S.hit + 0.5)) AU.shout();
      if (S.at('fs2', S.hit + 1.6)) AU.shout();
    }
    if (S.at('h', 0.4)) AU.horn(0.5, 0.6);
    if (S.at('cp', 0.2)) AU.couplers(12);
    noiseFor(S, [tr], 2);
  },

  draw(S) {
    const tr = S.tr;
    skyGround(S.env);
    hills(29, [150, 136, 120], 700, 50);
    trackBed(0); rails(0); trackBed(5); rails(5);
    face2(-200, 200, -14, -2.4, 0.02, [124, 112, 84]);
    const L = [];
    const wires = catenary(L, 0, -1, 50, 5);
    trainDrawables(L, tr);
    signalPost(L, 30, -2.4, 'green');
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    building(L, -18, 22, 30, 10, 9, [186, 160, 128], [80, 84, 90]);
    personDrawable(L, S.T); personDrawable(L, S.F);
    sortDraw(L);
    wires();
  },
});
