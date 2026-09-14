'use strict';
/* İnsan, tren, araç ve altyapı modelleri */

/* ---------- İNSAN ---------- */
function mkPerson(o) {
  return Object.assign({
    x: 0, y: 0, z: 0, yaw: 0, pose: 'stand', ph: 0, pitch: 0, roll: 0, pv: 0.9, vis: true,
    shirt: [60, 80, 120], pants: [48, 50, 58], skin: [214, 172, 136], hair: [38, 28, 22], shoes: [28, 28, 30],
    headphones: false, phone: false, vest: false, backpack: null, helmet: null, ov: null,
    vx: 0, vy: 0, vz: 0, vp: 0, vr: 0,
  }, o);
}

function poseAngles(p) {
  const s = Math.sin(p.ph), c = Math.cos(p.ph);
  const a = { lean: 0.02, head: 0, hipL: 0.02, kneeL: 0.04, hipR: -0.02, kneeR: 0.04, shL: 0.05, elL: 0.15, shR: -0.05, elR: 0.15, abL: 0.1, abR: 0.1, legAb: 0.04, hy: null };
  switch (p.pose) {
    case 'walk':
      a.hipL = 0.42 * s; a.hipR = -0.42 * s; a.kneeL = Math.max(0, c) * 0.75 + 0.05; a.kneeR = Math.max(0, -c) * 0.75 + 0.05;
      a.shL = -0.32 * s; a.shR = 0.32 * s; a.elL = a.elR = 0.3; a.lean = 0.05; break;
    case 'run':
      a.hipL = 0.85 * s; a.hipR = -0.85 * s; a.kneeL = Math.max(0, c) * 1.6 + 0.25; a.kneeR = Math.max(0, -c) * 1.6 + 0.25;
      a.shL = -0.8 * s; a.shR = 0.8 * s; a.elL = a.elR = 1.4; a.lean = 0.25; a.abL = a.abR = 0.15; break;
    case 'selfie':
      a.shR = 2.2; a.elR = 0.25; a.abR = 0.25; a.head = -0.12; a.shL = 0.3; a.abL = 0.5; a.elL = 0.2; break;
    case 'lean':
      a.lean = 0.5; a.head = -0.45; a.hipL = -0.15; a.hipR = 0.1; a.shL = 0.5; a.shR = 0.4; break;
    case 'crouch':
      a.hipL = a.hipR = 1.7; a.kneeL = a.kneeR = 2.35; a.lean = 0.7; a.shL = a.shR = 0.9; a.elL = a.elR = 0.5; a.head = -0.4; break;
    case 'kneel':
      a.hipL = 0.1; a.kneeL = 1.57; a.hipR = 1.45; a.kneeR = 1.45; a.lean = 0.45 + 0.1 * s; a.shL = 0.9; a.shR = 0.7 + 0.5 * Math.max(0, s); a.elL = a.elR = 0.6; a.head = 0.3; break;
    case 'crawl':
      a.hipL = -0.3 + 0.3 * s; a.hipR = -0.3 - 0.3 * s; a.kneeL = a.kneeR = 1.3; a.shL = 1.2 + 0.4 * s; a.shR = 1.2 - 0.4 * s; a.elL = a.elR = 0.5; a.head = -0.9; a.hy = 0.92; break;
    case 'climb':
      a.hipL = 1.0 + 0.4 * s; a.kneeL = 1.8 + 0.4 * s; a.hipR = 0.2 - 0.3 * s; a.kneeR = 0.4; a.shL = 2.8 + 0.2 * s; a.elL = 0.3; a.shR = 2.7 - 0.2 * s; a.elR = 0.5; a.lean = 0.12; a.hy = 0.92; break;
    case 'wave':
      a.shL = 2.7 + 0.35 * s; a.abL = 0.45; a.elL = 0.3; a.shR = 2.6 - 0.35 * s; a.abR = 0.45; a.elR = 0.3; break;
    case 'call':
      a.shR = 0.35; a.elR = 2.55; a.abR = 0.35; a.head = 0.1; a.shL = 0.4; a.elL = 0.8; break;
    case 'sit':
      a.hipL = a.hipR = 1.5; a.kneeL = a.kneeR = 1.5; a.shL = a.shR = 0.9; a.elL = a.elR = 0.5; a.hy = 0.5; break;
    case 'jump':
      a.hipL = 0.6; a.kneeL = 1.2; a.hipR = -0.3; a.kneeR = 0.5; a.shL = 2.4; a.shR = 2.0; a.abL = a.abR = 0.6; a.lean = 0.2; break;
    case 'hang':
      a.shL = a.shR = 2.9; a.elL = a.elR = 0.2; a.hipL = 0.2 + 0.3 * s; a.hipR = -0.2 - 0.3 * s; a.kneeL = a.kneeR = 0.5; a.hy = 0.92; break;
    case 'limp':
      a.hipL = 0.35; a.kneeL = 0.5; a.hipR = -0.2; a.kneeR = 0.15; a.shL = 1.3; a.abL = 1.0; a.elL = 0.6; a.shR = -0.6; a.abR = 0.8; a.elR = 0.3; a.head = 0.25; a.hy = 0.92; break;
    case 'flail':
      a.hipL = 0.6 * s; a.hipR = -0.7 * s; a.kneeL = 0.9; a.kneeR = 0.4; a.shL = 2.2 + s; a.shR = 1.0 - s; a.abL = 0.9; a.abR = 1.1; a.hy = 0.92; break;
  }
  if (p.phone && (p.pose === 'walk' || p.pose === 'stand')) { a.shR = 0.45; a.elR = 1.35; a.abR = 0.05; a.head = 0.38; }
  if (p.ov) Object.assign(a, p.ov);
  return a;
}

function drawPerson(p) {
  if (!p.vis) return;
  const a = poseAngles(p), TH = 0.46, SH = 0.46, T = 0.52, UA = 0.3, FA = 0.28;
  const legH = (h, k) => TH * Math.cos(h) + SH * Math.cos(h - k);
  const hy = a.hy != null ? a.hy : Math.max(legH(a.hipL, a.kneeL), legH(a.hipR, a.kneeR), 0.2);
  const lim = (b, ang, ab, len, side) => [b[0] + Math.sin(ang) * Math.cos(ab) * len, b[1] - Math.cos(ang) * Math.cos(ab) * len, b[2] + side * Math.sin(ab) * len];
  const neck = [Math.sin(a.lean) * T, hy + Math.cos(a.lean) * T, 0];
  const head = [neck[0] + Math.sin(a.lean + a.head) * 0.19, neck[1] + Math.cos(a.lean + a.head) * 0.19, 0];
  const headTop = [head[0] + Math.sin(a.lean + a.head) * 0.12, head[1] + Math.cos(a.lean + a.head) * 0.12, 0];
  const shc = [neck[0] - Math.sin(a.lean) * 0.07, neck[1] - Math.cos(a.lean) * 0.07];
  const J = {};
  for (const [nm, sd] of [['L', 1], ['R', -1]]) {
    const hip = [0, hy, sd * 0.1], hA = a['hip' + nm], kA = a['knee' + nm];
    const knee = lim(hip, hA, a.legAb, TH, sd), sA = hA - kA, foot = lim(knee, sA, a.legAb * 0.5, SH, sd);
    const toe = [foot[0] + Math.cos(sA) * 0.14, foot[1] + Math.sin(sA) * 0.14, foot[2]];
    const shJ = [shc[0], shc[1], sd * 0.19], sa = a['sh' + nm], ab = a['ab' + nm];
    const elbow = lim(shJ, sa, ab, UA, sd), hand = lim(elbow, sa + a['el' + nm], ab, FA, sd);
    J[nm] = { hip, knee, foot, toe, shJ, elbow, hand, sd };
  }
  const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch), cr = Math.cos(p.roll), sr = Math.sin(p.roll);
  const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw), sx = Math.cos(p.yaw), sz = -Math.sin(p.yaw);
  const Wd = (l) => {
    let f = l[0], u = l[1] - p.pv, s = l[2];
    const f2 = f * cp + u * sp, u2 = -f * sp + u * cp;
    const u3 = u2 * cr - s * sr, s3 = u2 * sr + s * cr;
    return [p.x + fx * f2 + sx * s3, p.y + p.pv + u3, p.z + fz * f2 + sz * s3];
  };
  const cam = R.cam, ctx = R.ctx;
  const toS = (w) => { const c = cam.toCam(w[0], w[1], w[2]); return c[2] < NEAR ? null : [W / 2 + c[0] * cam.F / c[2], H / 2 - c[1] * cam.F / c[2], c[2]]; };
  const parts = [];
  const nearSide = ((cam.x - p.x) * sx + (cam.z - p.z) * sz) >= 0 ? 1 : -1;
  const addLine = (pts, col, wm, cap) => {
    const ss = pts.map(l => toS(Wd(l)));
    if (ss.some(q => !q)) return;
    parts.push({ z: ss.reduce((m, q) => m + q[2], 0) / ss.length, d: (zz) => {
      ctx.strokeStyle = shade(col, 1, zz); ctx.lineWidth = Math.max(1, wm * cam.F / zz);
      ctx.lineCap = cap || 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ss.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    } });
  };
  const far = (sd) => sd === nearSide ? 1 : 0.78;
  const tint = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  for (const nm of ['L', 'R']) {
    const j = J[nm], k = far(j.sd);
    addLine([j.hip, j.knee, j.foot], tint(p.pants, k), 0.15);
    addLine([j.foot, j.toe], tint(p.shoes, k), 0.11);
    addLine([j.shJ, j.elbow, j.hand], tint(p.shirt, k), 0.105);
    addLine([j.hand, j.hand], tint(p.skin, k), 0.1);
  }
  // gövde
  const torso = [J.L.shJ, J.R.shJ, J.R.hip, J.L.hip].map(l => toS(Wd(l)));
  if (torso.every(Boolean)) {
    parts.push({ z: torso.reduce((m, q) => m + q[2], 0) / 4 - 0.02, d: (zz) => {
      ctx.fillStyle = ctx.strokeStyle = shade(p.shirt, 0.95, zz);
      ctx.lineWidth = Math.max(1.5, 0.17 * cam.F / zz); ctx.lineJoin = 'round';
      ctx.beginPath(); torso.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (p.vest) {
        const m1 = [lerp(torso[0][0], torso[3][0], 0.55), lerp(torso[0][1], torso[3][1], 0.55)], m2 = [lerp(torso[1][0], torso[2][0], 0.55), lerp(torso[1][1], torso[2][1], 0.55)];
        ctx.strokeStyle = shade([235, 235, 225], 1.1, zz); ctx.lineWidth = Math.max(1, 0.06 * cam.F / zz);
        ctx.beginPath(); ctx.moveTo(m1[0], m1[1]); ctx.lineTo(m2[0], m2[1]); ctx.stroke();
      }
    } });
  }
  if (p.backpack) {
    const bk = [[-0.17 * Math.cos(a.lean) + Math.sin(a.lean) * 0.12, hy + 0.2, 0], [-0.17 * Math.cos(a.lean) + Math.sin(a.lean) * 0.42, hy + 0.45, 0]];
    addLine(bk, p.backpack, 0.32, 'butt');
  }
  addLine([shc.concat([0]), head], tint(p.skin, 0.85), 0.1);
  const hs = toS(Wd(head)), ht = toS(Wd(headTop));
  if (hs && ht) {
    const fromBack = ((cam.x - p.x) * fx + (cam.z - p.z) * fz) < 0 && Math.abs(p.pitch) < 1;
    parts.push({ z: hs[2] - 0.05, d: (zz) => {
      const r = Math.max(1.5, 0.115 * cam.F / zz);
      let ux = ht[0] - hs[0], uy = ht[1] - hs[1];
      const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
      ctx.fillStyle = shade(fromBack ? p.hair : p.skin, 1, zz);
      ctx.beginPath(); ctx.arc(hs[0], hs[1], r, 0, PI * 2); ctx.fill();
      if (!fromBack) {
        ctx.save(); ctx.beginPath(); ctx.arc(hs[0], hs[1], r, 0, PI * 2); ctx.clip();
        ctx.fillStyle = shade(p.helmet || p.hair, 1, zz);
        ctx.beginPath(); ctx.arc(hs[0] + ux * r * 0.62, hs[1] + uy * r * 0.62, r, 0, PI * 2); ctx.fill();
        ctx.restore();
      }
      if (p.helmet) { ctx.fillStyle = shade(p.helmet, 1.05, zz); ctx.beginPath(); ctx.arc(hs[0] + ux * r * 0.3, hs[1] + uy * r * 0.3, r * 1.08, Math.atan2(uy, ux) - 1.6, Math.atan2(uy, ux) + 1.6); ctx.fill(); }
      if (p.headphones) {
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = Math.max(1, r * 0.35);
        ctx.beginPath(); ctx.arc(hs[0], hs[1], r * 1.08, Math.atan2(uy, ux) - 1.5, Math.atan2(uy, ux) + 1.5); ctx.stroke();
        ctx.fillStyle = '#f2f2f2';
        ctx.beginPath(); ctx.arc(hs[0] - uy * r * 0.95, hs[1] + ux * r * 0.95, r * 0.42, 0, PI * 2); ctx.arc(hs[0] + uy * r * 0.95, hs[1] - ux * r * 0.95, r * 0.42, 0, PI * 2); ctx.fill();
      }
    } });
  }
  if (p.phone) {
    const hw = toS(Wd(J.R.hand));
    if (hw) parts.push({ z: hw[2] - 0.08, d: (zz) => {
      const r = Math.max(1.2, 0.07 * cam.F / zz);
      ctx.fillStyle = 'rgba(190,225,255,0.95)'; ctx.fillRect(hw[0] - r * 0.6, hw[1] - r, r * 1.2, r * 2);
    } });
  }
  parts.sort((m, n) => n.z - m.z);
  for (const q of parts) q.d(q.z);
}

function personDrawable(list, p) {
  if (!p.vis) return;
  list.push({ k: adist(p.x - 0.35, p.x + 0.35, p.y, p.y + 1.8, p.z - 0.35, p.z + 0.35) + (p.kb != null ? p.kb : -0.2), d: () => drawPerson(p) });
}

function walkTo(p, tx, tz, speed, dt, pose) {
  const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
  if (d < 0.05) { if (p.pose === 'walk' || p.pose === 'run') p.pose = 'stand'; return true; }
  const st = Math.min(d, speed * dt);
  p.x += dx / d * st; p.z += dz / d * st;
  p.yaw = Math.atan2(dx, dz);
  p.pose = pose || (speed > 2.6 ? 'run' : 'walk');
  p.ph += st * (speed > 2.6 ? 2.3 : 3.6);
  return false;
}

// basit ragdoll: sert gövde fırlar, döner, yere yığılır
function ragdoll(p, dt, ground) {
  p.vy -= 9.8 * dt;
  p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
  p.pitch += p.vp * dt; p.roll += p.vr * dt; p.ph += dt * 6;
  const floor = ground - 0.75 * (1 - Math.abs(Math.cos(p.pitch)));
  if (p.y <= floor) {
    p.y = floor;
    if (p.vy < 0) p.vy *= -0.18;
    p.vx *= 0.55; p.vz *= 0.55; p.vp *= 0.5; p.vr *= 0.5;
    const target = (Math.sin(p.pitch) >= 0 ? 1 : -1) * PI / 2;
    p.pitch = lerp(p.pitch, target, Math.min(1, dt * 6));
    p.roll = lerp(p.roll, 0, Math.min(1, dt * 4));
    if (Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vz) < 0.4) p.pose = 'limp';
  } else p.pose = 'flail';
}

/* ---------- TREN ---------- */
const CARS = {
  loco_e: { len: 18.5, h: 4.15, col: [165, 36, 32], roof: [72, 72, 74], pant: true },
  loco_d: { len: 20, h: 4.2, col: [214, 118, 34], roof: [86, 86, 88] },
  pass: { len: 24.5, h: 4.05, col: [226, 226, 220], roof: [120, 120, 122] },
  emu_c: { len: 22, h: 4.0, col: [232, 232, 228], roof: [140, 140, 142], cab: true, pant: true },
  emu: { len: 22, h: 4.0, col: [232, 232, 228], roof: [140, 140, 142] },
  box: { len: 14, h: 4.0, col: [108, 58, 38], roof: [90, 70, 60] },
  tank: { len: 13, h: 3.8, col: [118, 122, 124], roof: [140, 142, 144] },
  hopper: { len: 12.5, h: 3.4, col: [74, 84, 70], roof: [60, 66, 58] },
};

function mkTrain(o) { return Object.assign({ x: 0, z: 0, dir: 1, y: 0, cars: ['loco_e', 'pass', 'pass'], lights: true, v: 0 }, o); }
function trainLen(tr) { return tr.cars.reduce((m, c) => m + CARS[c].len + 1, 0); }
function trainSpan(tr) { const L = trainLen(tr); return tr.dir > 0 ? [tr.x - L, tr.x] : [tr.x, tr.x + L]; }

function carDecal(type, lead, trail, dir, len) {
  const S = CARS[type];
  return (n, map, f) => {
    const L2 = len / 2;
    if (n === '+z' || n === '-z') {
      if (type === 'pass') {
        dq(map, -L2, 1.45, L2, 1.68, [176, 30, 30], f);
        dq(map, -L2, 3.45, L2, 3.55, [40, 70, 140], f);
        for (let u = -L2 + 3.2; u < L2 - 3.4; u += 2.3) dq(map, u, 2.25, u + 1.5, 3.15, [44, 54, 64], f * 1.1);
        for (const u of [-L2 + 0.9, L2 - 1.9]) dq(map, u, 1.25, u + 1.0, 3.3, [168, 168, 164], f);
      } else if (type === 'loco_e') {
        dq(map, -L2, 1.9, L2, 2.2, [236, 236, 230], f);
        for (const u of [-L2 + 0.6, L2 - 1.8]) dq(map, u, 2.55, u + 1.2, 3.35, [36, 42, 48], f);
        for (let u = -L2 + 4; u < L2 - 4; u += 0.9) dq(map, u, 2.6, u + 0.55, 3.6, [120, 30, 28], f);
      } else if (type === 'loco_d') {
        dq(map, -L2, 1.2, L2, 1.9, [84, 86, 90], f);
        for (const u of [-L2 + 0.6, L2 - 1.8]) dq(map, u, 2.55, u + 1.2, 3.35, [36, 42, 48], f);
        for (let u = -L2 + 4; u < L2 - 4; u += 1.1) dq(map, u, 2.4, u + 0.7, 3.8, [180, 96, 26], f);
      } else if (type === 'emu' || type === 'emu_c') {
        dq(map, -L2, 1.25, L2, 1.85, [196, 32, 38], f);
        for (let u = -L2 + 1.5; u < L2 - 2; u += 3.4) dq(map, u, 2.2, u + 2.4, 3.3, [40, 50, 60], f * 1.1);
        for (const u of [-L2 / 3 - 0.7, L2 / 3 - 0.7]) { dq(map, u, 1.25, u + 1.4, 3.45, [190, 190, 186], f); dq(map, u + 0.15, 2.3, u + 1.25, 3.2, [56, 64, 72], f); }
      } else if (type === 'box') {
        for (let u = -L2 + 0.6; u < L2; u += 1.3) dq(map, u, 1.25, u + 0.12, S.h, [80, 42, 28], f);
        dq(map, -1.4, 1.3, 1.4, 3.7, [96, 50, 34], f);
      } else if (type === 'tank') {
        dq(map, -L2, 2.1, L2, 2.3, [80, 84, 86], f);
        dq(map, -L2, 3.4, L2, S.h, [150, 152, 154], f);
      } else if (type === 'hopper') {
        for (let u = -L2 + 1; u < L2; u += 2.2) dq(map, u, 1.25, u + 0.15, S.h, [52, 60, 50], f);
      }
    }
    const leadFace = dir > 0 ? '+x' : '-x', trailFace = dir > 0 ? '-x' : '+x';
    if ((n === leadFace && lead) || (n === trailFace && trail && (type === 'loco_e' || type === 'emu_c'))) {
      dq(map, -1.2, 2.55, 1.2, 3.55, [30, 38, 46], f * 1.2);
      dq(map, -1.47, 1.25, 1.47, 1.5, [240, 200, 40], f);
    }
  };
}

function trainDrawables(list, tr) {
  let off = 0;
  const cam = R.cam;
  tr.cars.forEach((type, i) => {
    const S = CARS[type], len = S.len;
    const front = tr.x - tr.dir * off, back = front - tr.dir * len;
    off += len + 1;
    let x0 = Math.min(front, back), x1 = Math.max(front, back);
    const fullCx = (x0 + x1) / 2;
    if (tr.clipX != null) { if (x1 <= tr.clipX) return; x0 = Math.max(x0, tr.clipX); }
    const cx = (x0 + x1) / 2, cl = x1 - x0;
    if (x1 < cam.x - 450 || x0 > cam.x + 450) return;
    const z = tr.z, y = tr.y;
    const lead = i === 0, trail = i === tr.cars.length - 1;
    list.push({ k: adist(x0, x1, y, y + S.h, z - 1.5, z + 1.5), d: () => {
      for (const bx of [fullCx - len / 2 + 3, fullCx + len / 2 - 3]) if (bx - 1.4 >= x0) box({ x: bx, z, y: y + 0.12, w: 2.8, d: 2.3, h: 0.85, col: [36, 34, 32] });
      box({ x: cx, z, y: y + 0.9, w: Math.max(0.1, cl - 0.6), d: 2.6, h: 0.36, col: [44, 42, 40] });
      box({ x: cx, z, y: y + 1.2, w: cl, d: 2.95, h: S.h - 1.2, col: S.col, cols: { top: S.roof }, decal: carDecal(type, lead, trail, tr.dir, cl) });
      if (S.pant && (!S.cab || lead)) {
        const px = cx + tr.dir * (len / 2 - 5), top = y + S.h;
        line3([px - 1.2, top, z], [px, 5.1 + y, z], [50, 50, 50], 0.06, 1);
        line3([px + 1.2, top, z], [px, 5.1 + y, z], [50, 50, 50], 0.06, 1);
        line3([px, 5.1 + y, z], [px - 0.3, 5.55 + y, z], [50, 50, 50], 0.06, 1);
        line3([px - 0.3, 5.55 + y, z - 0.8], [px - 0.3, 5.55 + y, z + 0.8], [40, 40, 40], 0.07, 1);
      }
      if (i > 0) line3([front + tr.dir * 0.1, y + 1.05, z], [front + tr.dir * 1.0, y + 1.05, z], [30, 30, 30], 0.2, 1);
    } });
  });
}

function trainLights(tr, k) {
  if (!tr.lights) return;
  const cam = R.cam;
  if ((cam.x - tr.x) * tr.dir <= 0) return;
  const fx = tr.x + tr.dir * 0.05, a = (k == null ? 1 : k) * (R.env.night ? 1 : 0.55);
  glow(fx, tr.y + 3.8, tr.z, 1.6, '255,246,214', a, 3);
  glow(fx, tr.y + 1.55, tr.z - 0.95, 1.1, '255,240,200', a * 0.9, 2);
  glow(fx, tr.y + 1.55, tr.z + 0.95, 1.1, '255,240,200', a * 0.9, 2);
}

// Tren hareket planı: t=tImpact anında burnu xImpact'te olacak şekilde geriye hesaplanır
function trainPlan(o) {
  const dist = (t) => {
    if (o.brakeAt == null || t <= o.brakeAt) return o.v * t;
    const tb = Math.min(t - o.brakeAt, o.v / o.decel);
    return o.v * o.brakeAt + o.v * tb - 0.5 * o.decel * tb * tb;
  };
  const dir = o.dir || 1, x0 = o.xImpact - dir * dist(o.tImpact);
  return {
    pos: (t) => x0 + dir * dist(t),
    speed: (t) => (o.brakeAt == null || t <= o.brakeAt) ? o.v : Math.max(0, o.v - o.decel * (t - o.brakeAt)),
  };
}

/* ---------- ARAÇLAR ---------- */
function offs(o, lf, lx) { const s = Math.sin(o.yaw || 0), c = Math.cos(o.yaw || 0); return [o.x + s * lf + c * lx, o.z + c * lf - s * lx]; }

function drawCar(o) {
  const col = o.col || [170, 172, 176], yaw = o.yaw || 0, y = o.y || 0;
  for (const [lf, lx] of [[1.35, 0.8], [1.35, -0.8], [-1.35, 0.8], [-1.35, -0.8]]) {
    const [wx, wz] = offs(o, lf, lx);
    box({ x: wx, z: wz, y, w: 0.24, d: 0.64, h: 0.62, yaw, col: [22, 22, 22] });
  }
  box({ x: o.x, z: o.z, y: y + 0.28, w: 1.78, d: 4.3, h: 0.72, yaw, col, decal: (n, map, f) => {
    if (n === '-z') { dq(map, -0.85, 0.42, -0.45, 0.62, [200, 30, 26], f * 1.3); dq(map, 0.45, 0.42, 0.85, 0.62, [200, 30, 26], f * 1.3); dq(map, -0.3, 0.3, 0.3, 0.46, [230, 230, 220], f); }
    if (n === '+z') { dq(map, -0.85, 0.46, -0.5, 0.62, [240, 240, 220], f * 1.3); dq(map, 0.5, 0.46, 0.85, 0.62, [240, 240, 220], f * 1.3); }
  } });
  const [cx, cz] = offs(o, -0.25, 0);
  box({ x: cx, z: cz, y: y + 1.0, w: 1.58, d: 2.2, h: 0.55, yaw, col: [48, 56, 64], cols: { top: col }, decal: (n, map, f) => {
    if (n === '+x' || n === '-x') dq(map, -0.2, 0.0, 0.08, 0.55, col, f);
  } });
}

function drawTractor(o) {
  const yaw = o.yaw || 0, y = o.y || 0;
  const [rx1, rz1] = offs(o, -0.6, 0.85), [rx2, rz2] = offs(o, -0.6, -0.85);
  box({ x: rx1, z: rz1, y, w: 0.45, d: 1.45, h: 1.45, yaw, col: [24, 24, 22] });
  box({ x: rx2, z: rz2, y, w: 0.45, d: 1.45, h: 1.45, yaw, col: [24, 24, 22] });
  for (const lx of [0.7, -0.7]) { const [fx, fz] = offs(o, 1.5, lx); box({ x: fx, z: fz, y, w: 0.3, d: 0.8, h: 0.8, yaw, col: [24, 24, 22] }); }
  const [bx, bz] = offs(o, 0.6, 0);
  box({ x: bx, z: bz, y: y + 0.55, w: 1.0, d: 2.4, h: 0.85, yaw, col: [178, 34, 26] });
  const [kx, kz] = offs(o, -0.55, 0);
  box({ x: kx, z: kz, y: y + 0.9, w: 1.3, d: 1.1, h: 0.5, yaw, col: [150, 30, 24] });
  for (const [lf, lx] of [[-1.05, 0.6], [-1.05, -0.6], [0.0, 0.6], [0.0, -0.6]]) {
    const [px, pz] = offs(o, lf, lx);
    line3([px, y + 1.4, pz], [px, y + 2.6, pz], [30, 30, 30], 0.06, 1);
  }
  const [tx, tz] = offs(o, -0.52, 0);
  box({ x: tx, z: tz, y: y + 2.6, w: 1.4, d: 1.3, h: 0.08, yaw, col: [170, 30, 24] });
}

function drawTrailer(o) {
  const yaw = o.yaw || 0, y = o.y || 0;
  for (const lf of [1.4, -1.4]) for (const lx of [1.0, -1.0]) { const [wx, wz] = offs(o, lf, lx); box({ x: wx, z: wz, y, w: 0.3, d: 0.8, h: 0.8, yaw, col: [26, 26, 24] }); }
  box({ x: o.x, z: o.z, y: y + 0.75, w: 2.2, d: 4.6, h: 0.45, yaw, col: [70, 92, 120] });
  if (o.bales) o.bales.forEach(b => {
    if (b.free) return;
    const [bx, bz] = offs(o, b.f, b.s);
    box({ x: bx, z: bz, y: y + 1.2 + b.l * 0.5, w: 1.0, d: 1.1, h: 0.5, yaw, col: [196, 168, 92] });
  });
}

/* ---------- ALTYAPI ---------- */
function barrier(px, pz, len, dirX, ang, lightsOn, t) {
  box({ x: px, z: pz, w: 0.35, d: 0.35, h: 1.2, col: [210, 210, 204] });
  const ex = px + dirX * len * Math.cos(ang), ey = 1.05 + len * Math.sin(ang);
  const n = 8;
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    line3([px + (ex - px) * u0, 1.05 + (ey - 1.05) * u0, pz], [px + (ex - px) * u1, 1.05 + (ey - 1.05) * u1, pz], i % 2 ? [236, 236, 230] : [196, 30, 28], 0.1, 1.2);
  }
  crossingSign(px - dirX * 0.2, pz - 0.6, lightsOn, t);
}

function crossingSign(x, z, on, t) {
  line3([x, 0, z], [x, 3.2, z], [80, 80, 80], 0.1, 1);
  line3([x - 0.6, 3.4, z], [x + 0.6, 2.7, z], [210, 30, 30], 0.12, 1);
  line3([x - 0.6, 2.7, z], [x + 0.6, 3.4, z], [210, 30, 30], 0.12, 1);
  line3([x - 0.55, 2.3, z], [x + 0.55, 2.3, z], [30, 30, 30], 0.12, 1);
  const blink = Math.floor(t * 1.8) % 2;
  for (const [i, dx] of [[0, -0.45], [1, 0.45]]) {
    const lit = on && blink === i;
    disc(x + dx, 2.3, z, 0.17, lit ? [255, 60, 40] : [60, 20, 18], lit ? 1.6 / R.env.lum : 1, 1.5);
    if (lit) glow(x + dx, 2.3, z - 0.1, 1.4, '255,70,40', 0.9, 4);
  }
}

function platform(list, x0, x1, z0, z1, h, opt) {
  opt = opt || {};
  list.push({ k: adist(x0, x1, 0, h, z0, z1) + (opt.bias || 0), d: () => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, cam = R.cam;
    const seg = 10;
    for (let x = Math.max(x0, cam.x - 200); x < Math.min(x1, cam.x + 200); x += seg) {
      const xa = x, xb = Math.min(x1, x + seg);
      box({ x: (xa + xb) / 2, z: cz, w: xb - xa + 0.02, d, h, col: opt.col || [120, 116, 110], cols: { top: [150, 146, 138] }, noTop: true });
      face([[xa, h, z0], [xb, h, z0], [xb, h, z1], [xa, h, z1]], [150, 146, 138], lightF(0, 1, 0), true);
      const ez = opt.edge > 0 ? z1 : z0, s = opt.edge > 0 ? -1 : 1;
      face([[xa, h + 0.005, ez], [xb, h + 0.005, ez], [xb, h + 0.005, ez + s * 0.25], [xa, h + 0.005, ez + s * 0.25]], [222, 222, 214], lightF(0, 1, 0));
      face([[xa, h + 0.005, ez + s * 0.8], [xb, h + 0.005, ez + s * 0.8], [xb, h + 0.005, ez + s * 1.15], [xa, h + 0.005, ez + s * 1.15]], [226, 190, 36], lightF(0, 1, 0));
    }
    void cx; void w;
  } });
}

function lampPost(list, x, z, h, on) {
  list.push({ k: adist(x - 0.2, x + 0.2, 0, h, z - 0.2, z + 0.2), d: () => {
    line3([x, 0, z], [x, h, z], [70, 72, 74], 0.14, 1);
    box({ x, z, y: h - 0.1, w: 0.7, d: 0.35, h: 0.18, col: [60, 60, 60] });
  }, light: on ? () => glow(x, h - 0.2, z, 4, '255,214,150', 0.55, 6) : null });
}
