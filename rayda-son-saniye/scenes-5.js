'use strict';
/* Kayıt 15–16 */

function drawBike(b) {
  const f = [Math.sin(b.yaw), 0, Math.cos(b.yaw)], sd = [Math.cos(b.yaw), 0, -Math.sin(b.yaw)];
  const cr = Math.cos(b.roll || 0), sr = Math.sin(b.roll || 0);
  const up = [sd[0] * sr, cr, sd[2] * sr], side = [sd[0] * cr, -sr, sd[2] * cr], by = b.y || 0;
  const P = (a, u, s) => { s = s || 0; return [b.x + f[0] * a + up[0] * u + side[0] * s, by + up[1] * u + side[1] * s, b.z + f[2] * a + up[2] * u + side[2] * s]; };
  const col = b.col || [40, 90, 150];
  for (const ax of [-0.52, 0.52]) {
    let prev = null;
    for (let i = 0; i <= 14; i++) {
      const th = i / 14 * PI * 2, q = P(ax + Math.cos(th) * 0.34, 0.34 + Math.sin(th) * 0.34);
      if (prev) line3(prev, q, [22, 22, 22], 0.05, 1);
      prev = q;
    }
  }
  for (const [a0, u0, a1, u1] of [[-0.52, 0.34, 0, 0.3], [0, 0.3, -0.16, 0.9], [-0.16, 0.9, -0.52, 0.34], [0, 0.3, 0.44, 0.84], [-0.16, 0.9, 0.44, 0.9], [0.44, 0.9, 0.52, 0.34]]) line3(P(a0, u0), P(a1, u1), col, 0.045, 1);
  line3(P(-0.27, 0.95), P(-0.07, 0.95), [20, 20, 20], 0.07, 1);
  line3(P(0.44, 0.9), P(0.4, 1.03), col, 0.04, 1);
  line3(P(0.4, 1.03, -0.26), P(0.4, 1.03, 0.26), [30, 30, 30], 0.04, 1);
}

/* =====================================================================
   K-15  Sisli sabah: ışıklar yanarken geçen kurye
   ===================================================================== */
SCENES.push({
  title: 'Sisli sabah', place: 'Yaya hemzemin geçidi, KM 88+240', placeShort: 'YAYA GEÇİDİ KM 88+240',
  camLabel: 'KAM-06', kind: 'cctv', stamp: '2026-12-09 07:21:44', dur: 14, danger: [4.0, 6.2], preview: 3,
  outcome: 'ÖLÜM', victim: 'Işıklar yanarken geçen kurye, 26 yaşında',
  cue: 'uyarı ışıkları yanıp zil çalarken kurye bekleme yerinden çıkıp geçide girdiğinde',
  q: {
    text: 'Sisli havada yanıp sönen uyarı ışığı ne demektir?',
    opts: [
      'Treni göremesen de duyamasan da tren yaklaşıyor demektir; ışık sönene kadar beklenir.',
      'Sis varken ışıklar sık sık yanlış alarm verir; dikkatlice bakıp geçilebilir.',
      'Tren görünmüyorsa en az 30 saniye uzaktadır.',
      'Bisikletle hızlı geçilirse ışığın önemi yoktur.',
    ],
    why: 'Sis mesafeyi ve hızı olduğundan farklı gösterir, trenin sesini de boğar. Uyarı sistemi treni sen görmeden çok önce algılar: ışık yanıyorsa tren gelmektedir.',
  },
  rule: 'Uyarı ışığı yanıyorsa, treni göremesen bile geçme.',
  fact: 'Sisli havada farları yanık bir tren ancak birkaç saniye önceden seçilebilir. Hemzemin geçitte bisikletten inip bisikleti yürüterek geçmek daha güvenlidir.',

  init(S) {
    S.env = mkEnv({ sky: ['#b4b9ba', '#cdd0ce'], ground: ['#85877c', '#65675d'], fog: [196, 200, 199], fogD: 36, fogMax: 0.97, lum: 0.92, amb: 0.78, clouds: 0, grain: 0.4, shadowA: 0.1, L: nrm(0, 1, -0.2) });
    S.cam = new Cam({ x: -9, y: 6, z: -16, yaw: 0.75, pitch: -0.25, F: 720 });
    S.plan = trainPlan({ dir: -1, v: 25, brakeAt: 6.2, decel: 1.0, tImpact: 6.45, xImpact: 0.8 });
    S.tr = mkTrain({ z: 0, dir: -1, cars: ['emu_c', 'emu', 'emu', 'emu_c'] });
    S.bk = { x: 0.3, y: 0, z: -16, yaw: 0, roll: 0, col: [40, 96, 150] };
    S.P = mkPerson({ x: 0.3, z: -16, yaw: 0, pose: 'cycle', shirt: [40, 40, 44], pants: [36, 36, 40], hair: [20, 16, 12], backpack: [226, 120, 30], helmet: [230, 230, 226] });
    S.Wt = mkPerson({ x: -0.8, z: 7.4, yaw: PI, shirt: [120, 96, 70], pants: [60, 60, 66], hair: [140, 136, 130] });
    S.items = [];
    S.trees = scatterTrees(151, 30, -60, 80, [[-40, -9], [9, 50]], (x) => Math.abs(x) < 5);
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, P = S.P, bk = S.bk, Wt = S.Wt;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    if (S.at('bell', 0.1)) AU.bell(13.5);
    if (S.at('h1', 5.2)) AU.horn(0.9, 0.6);
    if (S.at('h2', 6.0)) AU.horn(1.2, 0.8);
    if (S.at('br', 6.2)) AU.screech(7, 0.8);
    if (!S.hit) {
      let z;
      if (t < 2.6) z = easeTo(t, -16, -5.8, 0, 2.6);
      else if (t < 4.2) z = -5.8;
      else { const u = t - 4.2; z = u < 1.4 ? -5.8 + 1.25 * u * u : -3.35 + 3.5 * (u - 1.4); }
      bk.z = z; bk.y = roadY(z);
      if (t < 2.5 || t > 4.2) { P.pose = 'cycle'; P.ph += dt * (t < 2.5 ? 7 * (1 - t / 2.6) + 1 : 7); P.x = bk.x; P.z = bk.z - 0.12; P.y = bk.y; P.yaw = 0; }
      else { P.pose = 'stand'; P.x = bk.x - 0.35; P.z = bk.z - 0.1; P.y = bk.y; P.yaw = 0.55 * Math.sin((t - 2.6) * 2.4); }
      if (tr.x <= bk.x + 0.5 && Math.abs(bk.z) < 1.9) {
        S.hit = t; P.vis = false; AU.impact(1.1, true); S.shake = 0.6; S.glitch = 0.45;
        Object.assign(bk, { vx: -tr.v * 0.65, vy: 3.2, vz: -3.2, vr: 6, vroll: 5 });
        S.items.push({ x: bk.x, y: 1.3, z: bk.z, vx: -tr.v * 0.55, vy: 3.6, vz: -4.2, w: 0.45, d: 0.35, h: 0.4, col: [226, 120, 30], yaw: 0, vr: 7 });
        burst(S, bk.x, 0.8, bk.z, 25, { vx: -tr.v * 0.4, s: 2.5, col: [150, 146, 136], life: 1.1 });
      }
    } else {
      bk.vy -= 9.8 * dt; bk.x += bk.vx * dt; bk.y += bk.vy * dt; bk.z += bk.vz * dt; bk.yaw += bk.vr * dt; bk.roll += bk.vroll * dt;
      if (bk.y < 0.05 && bk.vy < 0) { bk.y = 0.05; bk.vy *= -0.2; bk.vx *= 0.45; bk.vz *= 0.45; bk.vr *= 0.4; bk.vroll = 0; bk.roll = PI / 2; }
      const s = t - S.hit;
      Wt.pose = s < 1.8 ? 'stand' : 'call';
      Wt.ov = s < 1.8 ? { shL: 2.7, elL: 2.3, shR: 2.7, elR: 2.3, abL: 0.5, abR: 0.5 } : null;
      if (S.at('ws', S.hit + 0.3)) AU.shout();
    }
    updItems(S, dt);
    if (t > 6.2) brakeSparks(S, tr, dt);
    noiseFor(S, [tr], 0.7);
  },

  draw(S) {
    const t = S.t, tr = S.tr;
    skyGround(S.env);
    trackBed(0); rails(0);
    face2(-1.3, 1.3, -40, -2.2, 0.02, [150, 146, 138]);
    face2(-1.3, 1.3, 2.2, 40, 0.02, [150, 146, 138]);
    face2(-1.3, 1.3, -1.5, 1.5, 0.5, [120, 116, 108]);
    face([[-1.3, 0.02, -2.2], [1.3, 0.02, -2.2], [1.3, 0.5, -1.5], [-1.3, 0.5, -1.5]], [130, 126, 118], lightF(0, 0.8, -0.5), true, 0.8);
    face([[-1.3, 0.5, 1.5], [1.3, 0.5, 1.5], [1.3, 0.02, 2.2], [-1.3, 0.02, 2.2]], [130, 126, 118], lightF(0, 0.8, 0.5), true, 0.8);
    const L = [];
    const wires = catenary(L, 0, 1, 55, 5);
    trainDrawables(L, tr);
    for (const zz of [-5.2, 5.2]) for (const [xa, xb] of [[-30, -1.5], [1.5, 30]]) L.push({ k: adist(xa, xb, 0, 1.2, zz - 0.1, zz + 0.1), d: () => {
      line3([xa, 1.05, zz], [xb, 1.05, zz], [200, 196, 186], 0.05, 1);
      line3([xa, 0.55, zz], [xb, 0.55, zz], [200, 196, 186], 0.04, 1);
      for (let x = xa; x <= xb + 0.01; x += 2.5) line3([x, 0, zz], [x, 1.1, zz], [190, 186, 176], 0.06, 1);
    } });
    L.push({ k: adist(-2.2, -1.6, 0, 3.4, -5.9, -5.5), d: () => crossingSign(-1.9, -5.7, true, t) });
    L.push({ k: adist(1.6, 2.2, 0, 3.4, 5.5, 5.9), d: () => crossingSign(1.9, 5.7, true, t) });
    for (const tt of S.trees) tree(L, tt[0], tt[1], tt[2], tt[3]);
    L.push({ k: adist(S.bk.x - 0.7, S.bk.x + 0.7, 0, 1.1, S.bk.z - 0.7, S.bk.z + 0.7) + 0.05, d: () => drawBike(S.bk) });
    personDrawable(L, S.P); personDrawable(L, S.Wt);
    itemDrawables(L, S);
    sortDraw(L);
    wires();
    trainLights(tr, 1.5);
    if (tr.x < 120 && tr.x > -60) glow(tr.x - 18, 2.5, 0, 16, '235,238,230', 0.12, 30);
  },
});

/* =====================================================================
   K-16  Makas bölgesinde kestirme: sıkışan ayak
   ===================================================================== */
SCENES.push({
  title: 'Makasa sıkışan ayak', place: 'Gar sahası, 12 numaralı makas', placeShort: 'GAR SAHASI MAKAS-12',
  camLabel: 'KAM-18', kind: 'cctv', stamp: '2026-03-27 12:08:50', dur: 15, danger: [0.8, 3.0], preview: 5,
  outcome: 'AĞIR YARALI', victim: 'Makas bölgesinden kestirme yapan yolcu, 33 yaşında',
  cue: 'yolcu, makas bölgesinde raylara ve makas dillerinin arasına basarak hattı geçmeye başladığında',
  q: {
    text: 'Makas bölgesinde neden raylara basılmaz?',
    opts: [
      'Makaslar uzaktan kumandayla habersiz hareket eder; ayak, makas dili ile ray arasına sıkışabilir.',
      'Raylar kaygandır; tek tehlike kaymaktır.',
      'Makaslar yalnızca üstünde tren varken hareket eder; boşken basmak güvenlidir.',
      'Makas bölgesinde trenler hep çok yavaş geçtiği için tehlike yoktur.',
    ],
    why: 'Makas dilleri trafik kumanda merkezinden uzaktan çevrilir ve saniyeler içinde büyük bir kuvvetle kapanır. Sıkışan bir ayak kolayca kurtarılamaz; manevra yapan bir tren yavaş olsa bile durmak için mesafeye ihtiyaç duyar.',
  },
  rule: 'Makaslara, raylara ve travers aralarına basma; hattı yalnızca geçitlerden geç.',
  fact: 'Yavaş giden bir manevra treni bile yüzlerce ton ağırlığındadır; yürüme hızında bile bir insanı ağır yaralayabilir.',

  init(S) {
    S.env = mkEnv({ sky: ['#8e9aa4', '#cfd3d2'], ground: ['#6e6a5c', '#4c4a40'], fog: [196, 200, 200], fogD: 340, lum: 0.98, amb: 0.56, cloudA: 0.6, clouds: 9, L: nrm(-0.4, 0.85, -0.3) });
    S.cam = new Cam({ x: -12, y: 5, z: -9, yaw: 0.7, pitch: -0.3, F: 760 });
    S.plan = trainPlan({ dir: -1, v: 3.4, brakeAt: 8.5, decel: 0.9, tImpact: 10.0, xImpact: -4.1 });
    S.tr = mkTrain({ z: 0, dir: -1, cars: ['loco_d', 'box', 'box', 'tank'] });
    S.sw = 0.12;
    S.P = mkPerson({ x: -3.2, z: -5.2, yaw: 0, shirt: [70, 90, 60], pants: [52, 48, 44], hair: [36, 28, 22] });
    S.St = mkPerson({ x: 9, z: 7.5, yaw: PI, shirt: [236, 112, 28], vest: true, pants: [44, 50, 70], helmet: [240, 240, 236] });
    S.O = mkPerson({ x: -3.5, z: -7.5, yaw: 0.2, shirt: [90, 90, 100], pants: [40, 40, 44], phone: true });
    S.items = [];
    S.rum = AU.rumble();
  },

  update(S, dt) {
    const t = S.t, tr = S.tr, P = S.P, St = S.St, O = S.O;
    tr.x = S.plan.pos(t); tr.v = S.plan.speed(t);
    S.sw = lerp(0.12, 0, sstep((t - 2.9) / 0.6));
    if (S.at('mot', 2.9)) AU.horn(0.6, 0.12, 0.3);
    if (S.at('clk', 3.45)) AU.clack(0.8);
    if (S.at('h1', 7.0)) AU.horn(0.4, 0.5);
    if (S.at('h2', 7.6)) AU.horn(0.4, 0.5);
    if (S.at('h3', 8.3)) AU.horn(1.6, 0.8);
    if (S.at('br', 8.5)) AU.screech(1.8, 0.4);
    if (!S.hit) {
      if (t < 3.05) walkTo(P, -4.5, -0.62, 1.55, dt);
      else {
        P.x = -4.5; P.z = -0.62; P.ph += dt * 5;
        const s = Math.sin(P.ph);
        if (t < 6.6) { P.pose = 'stand'; P.yaw = 0.1; P.ov = { hipR: 0.35 + 0.25 * s, kneeR: 0.7, lean: 0.45 + 0.12 * s, head: 0.55, shL: 0.9, shR: 0.7 + 0.2 * s, elL: 0.4, elR: 0.5 }; }
        else { P.pose = 'wave'; P.ov = null; P.yaw = lerp(P.yaw, PI / 2 + 0.3, Math.min(1, dt * 4)); }
        if (S.once('bag')) S.items.push({ x: -4.2, y: 1.0, z: -0.9, vx: 0.4, vy: 0.5, vz: -1.2, w: 0.4, d: 0.22, h: 0.3, col: [120, 60, 40], yaw: 0, vr: 3, floor: 0.36 });
      }
      P.y = Math.abs(P.z) < 1.6 ? 0.36 : 0;
      if (S.at('ps1', 4.2)) AU.shout();
      if (S.at('ps2', 6.8)) AU.shout();
      if (S.at('ps3', 8.0)) AU.shout();
      if (tr.x <= P.x + 0.4) {
        S.hit = t; P.ov = null; P.pose = 'flail';
        P.vx = -2.4; P.vy = 1.2; P.vz = -2.2; P.vp = -2.2; P.vr = 0.6;
        AU.impact(0.8, false); S.shake = 0.35; S.glitch = 0.2;
      }
    } else ragdoll(P, dt, Math.abs(P.z) < 1.6 ? 0.36 : 0.05);

    if (!S.hit) {
      if (t > 6.2) { St.pose = 'wave'; St.ph += dt * 8; St.yaw = Math.atan2(tr.x - St.x, -St.z); }
      if (S.at('ss1', 6.4)) AU.shout();
      if (S.at('ss2', 7.4)) AU.shout();
    } else if (t - S.hit > 1.0) {
      if (!St.w1) St.w1 = walkTo(St, -7.2, 2.8, 4.2, dt);
      else if (!St.arr) St.arr = walkTo(St, P.x - 0.8, P.z - 0.7, 4.2, dt);
      else { St.pose = 'kneel'; St.yaw = Math.atan2(P.x - St.x, P.z - St.z); St.ph += dt * 2; }
      St.y = Math.abs(St.z) < 1.6 ? 0.36 : 0;
    }
    if (S.hit && t - S.hit > 1.2) { O.phone = false; O.pose = 'call'; O.yaw = Math.atan2(P.x - O.x, P.z - O.z); }
    updItems(S, dt);
    noiseFor(S, [tr], 3);
  },

  draw(S) {
    const tr = S.tr;
    skyGround(S.env);
    hills(88, [120, 126, 128], 700, 40);
    face2(-200, 200, -40, 40, 0.01, [98, 92, 78]);
    trackBed(0); trackBed(4.5, 30, 400); trackBed(9);
    face([[-6, 0.28, 1.5], [34, 0.28, 6.0], [34, 0.28, 3.0], [-6, 0.28, -1.5]], [104, 99, 90], lightF(0, 1, 0), true, 1.5);
    for (let x = -8; x < 34; x += 0.6) {
      const w = 1.3 + Math.max(0, (x + 6) / 40 * 4.5);
      face([[x - 0.13, 0.36, -1.3], [x + 0.13, 0.36, -1.3], [x + 0.13, 0.36, w], [x - 0.13, 0.36, w]], [150, 146, 136], lightF(0, 1, 0));
    }
    rails(0); rails(4.5, 34, 400); rails(9);
    for (const dz of [-0.7175, 0.7175]) {
      line3([-6, 0.42, dz], [34, 0.42, 4.5 + dz], [60, 56, 50], 0.14, 1);
      line3([-6, 0.53, dz], [34, 0.53, 4.5 + dz], [178, 172, 160], 0.07, 1);
    }
    line3([-6, 0.5, -0.7175 + S.sw], [4, 0.5, -0.7175 + 0.3], [200, 194, 180], 0.06, 1);
    line3([-6, 0.5, 0.7175 - (0.12 - S.sw)], [4, 0.5, 0.7175 + 0.3], [200, 194, 180], 0.06, 1);
    const L = [];
    trainDrawables(L, tr);
    L.push({ k: adist(-6.1, -4.9, 0, 0.5, -2.65, -2.15), d: () => {
      box({ x: -5.5, z: -2.4, w: 1.2, d: 0.5, h: 0.5, col: [200, 170, 40] });
      line3([-5.5, 0.35, -2.15], [-5.5, 0.45, -0.7175 + S.sw], [60, 60, 60], 0.05, 1);
    } });
    signalPost(L, 20, -2.6, 'red');
    building(L, 24, 20, 16, 8, 7, [170, 156, 132], [70, 76, 84]);
    building(L, -30, 24, 40, 12, 10, [120, 110, 100], [70, 76, 84]);
    lampPost(L, -16, -4, 10, false); lampPost(L, 14, 14, 10, false);
    personDrawable(L, S.P); personDrawable(L, S.St); personDrawable(L, S.O);
    itemDrawables(L, S);
    sortDraw(L);
    trainLights(tr, 1);
  },
});
