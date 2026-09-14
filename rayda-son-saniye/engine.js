'use strict';
/* Rayda Son Saniye — küçük bir 3B çizim motoru (Canvas 2D, ressam algoritması) */
const W = 960, H = 540, PI = Math.PI, NEAR = 0.25;
const R = { ctx: null, cam: null, env: null };

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function sstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function srand(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
// anahtar kareler: [[t, a, b, ...], ...]
function kf(keys, t, smooth) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (t <= b[0]) {
      const a = keys[i - 1];
      let u = (t - a[0]) / ((b[0] - a[0]) || 1);
      if (smooth) u = sstep(u);
      const o = [];
      for (let j = 1; j < a.length; j++) o.push(lerp(a[j], b[j], u));
      return o;
    }
  }
  return keys[keys.length - 1].slice(1);
}

class Cam {
  constructor(o) { Object.assign(this, { x: 0, y: 6, z: -20, yaw: 0, pitch: -0.2, roll: 0, F: 720 }, o); this.upd(); }
  upd() { this.cy = Math.cos(this.yaw); this.sy = Math.sin(this.yaw); this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch); }
  toCam(x, y, z) {
    const dx = x - this.x, dy = y - this.y, dz = z - this.z;
    const X = dx * this.cy - dz * this.sy, Z1 = dx * this.sy + dz * this.cy;
    return [X, dy * this.cp - Z1 * this.sp, dy * this.sp + Z1 * this.cp];
  }
  horizon() { return H / 2 + this.F * Math.tan(this.pitch); }
}

function pt(x, y, z) {
  const c = R.cam.toCam(x, y, z);
  if (c[2] < NEAR) return null;
  return [W / 2 + c[0] * R.cam.F / c[2], H / 2 - c[1] * R.cam.F / c[2], c[2]];
}

function shade(c, f, d) {
  const e = R.env, l = (f == null ? 1 : f) * e.lum;
  const k = d == null ? 0 : Math.min(1 - Math.exp(-d / e.fogD), e.fogMax);
  const a = 1 - k;
  return 'rgb(' + ((c[0] * l * a + e.fog[0] * k) | 0) + ',' + ((c[1] * l * a + e.fog[1] * k) | 0) + ',' + ((c[2] * l * a + e.fog[2] * k) | 0) + ')';
}

function clipNear(cs) {
  const out = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length], ain = a[2] > NEAR, bin = b[2] > NEAR;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]); }
  }
  return out;
}

function face(pts, col, f, seam) {
  const cam = R.cam, ctx = R.ctx;
  let cs = [];
  for (const p of pts) cs.push(cam.toCam(p[0], p[1], p[2]));
  cs = clipNear(cs);
  if (cs.length < 3) return false;
  let dz = 0;
  for (const c of cs) dz += c[2];
  dz /= cs.length;
  ctx.beginPath();
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], sx = W / 2 + c[0] * cam.F / c[2], sy = H / 2 - c[1] * cam.F / c[2];
    i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
  }
  ctx.closePath();
  ctx.fillStyle = typeof col === 'string' ? col : shade(col, f, dz);
  ctx.fill();
  if (seam) { ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1; ctx.stroke(); }
  return true;
}

function line3(a, b, col, wm, minPx, f) {
  const cam = R.cam;
  let A = cam.toCam(a[0], a[1], a[2]), B = cam.toCam(b[0], b[1], b[2]);
  if (A[2] < NEAR && B[2] < NEAR) return;
  if (A[2] < NEAR) { const t = (NEAR - A[2]) / (B[2] - A[2]); A = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, NEAR]; }
  else if (B[2] < NEAR) { const t = (NEAR - B[2]) / (A[2] - B[2]); B = [B[0] + (A[0] - B[0]) * t, B[1] + (A[1] - B[1]) * t, NEAR]; }
  const dz = Math.max((A[2] + B[2]) / 2, Math.min(A[2], B[2]) * 1.6), ctx = R.ctx;
  ctx.strokeStyle = typeof col === 'string' ? col : shade(col, f, dz);
  ctx.lineWidth = Math.max(minPx || 0.6, wm * cam.F / dz);
  ctx.beginPath();
  ctx.moveTo(W / 2 + A[0] * cam.F / A[2], H / 2 - A[1] * cam.F / A[2]);
  ctx.lineTo(W / 2 + B[0] * cam.F / B[2], H / 2 - B[1] * cam.F / B[2]);
  ctx.stroke();
}

function disc(x, y, z, rm, col, f, minPx) {
  const s = pt(x, y, z);
  if (!s) return;
  const ctx = R.ctx;
  ctx.fillStyle = typeof col === 'string' ? col : shade(col, f, s[2]);
  ctx.beginPath();
  ctx.arc(s[0], s[1], Math.max(minPx || 0.4, rm * R.cam.F / s[2]), 0, PI * 2);
  ctx.fill();
}

function glow(x, y, z, rm, rgb, alpha, minR) {
  const s = pt(x, y, z);
  if (!s) return;
  const r = Math.max(minR || 2, rm * R.cam.F / s[2]), ctx = R.ctx;
  const g = ctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], r);
  g.addColorStop(0, 'rgba(' + rgb + ',' + alpha + ')');
  g.addColorStop(0.2, 'rgba(' + rgb + ',' + alpha * 0.45 + ')');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g;
  ctx.fillRect(s[0] - r, s[1] - r, r * 2, r * 2);
  ctx.globalCompositeOperation = 'source-over';
}

function adist(x0, x1, y0, y1, z0, z1) {
  const c = R.cam;
  if (R.zsort) return Math.max(z0 - c.z, 0, c.z - z1);
  return Math.hypot(Math.max(x0 - c.x, 0, c.x - x1), Math.max(y0 - c.y, 0, c.y - y1), Math.max(z0 - c.z, 0, c.z - z1));
}

function lightF(nx, ny, nz) {
  const e = R.env, L = e.L;
  return e.amb + (1 - e.amb) * Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
}

/* Kutu: x,z merkez, y taban, w (yerel x), d (yerel z), h, yaw; cols:{side,end,top}; decal(ad, map, f) */
function box(o) {
  const cy = Math.cos(o.yaw || 0), sy = Math.sin(o.yaw || 0), W2 = o.w / 2, D2 = o.d / 2, y0 = o.y || 0, y1 = y0 + o.h;
  const P = (lx, y, lz) => [o.x + lx * cy + lz * sy, y, o.z - lx * sy + lz * cy];
  const cam = R.cam, col = o.col || [128, 128, 128];
  const faces = [
    ['+x', [cy, 0, -sy], (u, v) => P(W2, v, u), D2, o.cols && o.cols.end],
    ['-x', [-cy, 0, sy], (u, v) => P(-W2, v, -u), D2, o.cols && o.cols.end],
    ['+z', [sy, 0, cy], (u, v) => P(-u, v, D2), W2, o.cols && o.cols.side],
    ['-z', [-sy, 0, -cy], (u, v) => P(u, v, -D2), W2, o.cols && o.cols.side],
  ];
  for (const [name, n, map, U, c2] of faces) {
    const c = map(0, (y0 + y1) / 2);
    if (n[0] * (cam.x - c[0]) + n[2] * (cam.z - c[2]) <= 0) continue;
    const f = lightF(n[0], n[1], n[2]);
    face([map(-U, y0), map(U, y0), map(U, y1), map(-U, y1)], c2 || col, f, true);
    if (o.decal) o.decal(name, map, f);
  }
  if (cam.y > y1 && !o.noTop) {
    const map = (u, v) => P(u, y1, v), f = lightF(0, 1, 0);
    face([map(-W2, -D2), map(W2, -D2), map(W2, D2), map(-W2, D2)], (o.cols && o.cols.top) || col, f, true);
    if (o.decal) o.decal('top', map, f);
  }
}
function dq(map, u0, v0, u1, v1, col, f) { face([map(u0, v0), map(u1, v0), map(u1, v1), map(u0, v1)], col, f); }

/* ---------- gökyüzü, zemin, çevre ---------- */
function skyGround(e) {
  const ctx = R.ctx, hy = R.cam.horizon();
  let g = ctx.createLinearGradient(0, hy - 400, 0, hy);
  g.addColorStop(0, e.sky[0]); g.addColorStop(1, e.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, hy + 400);
  g = ctx.createLinearGradient(0, hy, 0, H + 200);
  g.addColorStop(0, e.ground[0]); g.addColorStop(1, e.ground[1]);
  ctx.fillStyle = g; ctx.fillRect(-400, hy - 1, W + 800, H - hy + 600);
}

function hills(seed, col, dist, amp) {
  const r = srand(seed), cam = R.cam;
  for (let side = 0; side < 4; side++) {
    const pts = [];
    const ang0 = side * PI / 2;
    for (let i = 0; i <= 24; i++) {
      const a = ang0 - PI / 4 + (i / 24) * PI / 2;
      const d = dist * (0.9 + r() * 0.2);
      const h = amp * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.7 + side * 3 + r() * 0.8)));
      pts.push([cam.x + Math.sin(a) * d, h, cam.z + Math.cos(a) * d]);
    }
    const a1 = ang0 + PI / 4, a0 = ang0 - PI / 4;
    pts.push([cam.x + Math.sin(a1) * dist, -2, cam.z + Math.cos(a1) * dist]);
    pts.push([cam.x + Math.sin(a0) * dist, -2, cam.z + Math.cos(a0) * dist]);
    face(pts, col);
  }
}

function viewRange(x0, x1, span) {
  const c = R.cam.x;
  return [Math.max(x0, Math.floor((c - span) / 6) * 6), Math.min(x1, Math.ceil((c + span) / 6) * 6)];
}

function trackBed(z, x0, x1, opt) {
  opt = opt || {};
  const [a, b] = viewRange(x0 == null ? -1e4 : x0, x1 == null ? 1e4 : x1, opt.span || 260);
  const bc = opt.ballast || [104, 99, 90], sc = [bc[0] * 0.72, bc[1] * 0.72, bc[2] * 0.72], y = opt.y || 0;
  for (let x = a; x < b; x += 6) {
    const x2 = Math.min(b, x + 6);
    face([[x, y + 0.02, z - 2.2], [x2, y + 0.02, z - 2.2], [x2, y + 0.28, z - 1.5], [x, y + 0.28, z - 1.5]], sc, lightF(0, 0.94, -0.33), true);
    face([[x, y + 0.28, z - 1.5], [x2, y + 0.28, z - 1.5], [x2, y + 0.28, z + 1.5], [x, y + 0.28, z + 1.5]], bc, lightF(0, 1, 0), true);
    face([[x, y + 0.28, z + 1.5], [x2, y + 0.28, z + 1.5], [x2, y + 0.02, z + 2.2], [x, y + 0.02, z + 2.2]], sc, lightF(0, 0.94, 0.33), true);
  }
}

function rails(z, x0, x1, opt) {
  opt = opt || {};
  const cam = R.cam, y = opt.y || 0;
  const [a, b] = viewRange(x0 == null ? -1e4 : x0, x1 == null ? 1e4 : x1, opt.span || 260);
  const sl = opt.sleeper || [150, 146, 136], fs = lightF(0, 1, 0);
  const near = opt.sleeperDist || 70;
  const s0 = Math.max(a, Math.floor((cam.x - near) / 0.6) * 0.6), s1 = Math.min(b, cam.x + near);
  for (let x = s0; x < s1; x += 0.6) {
    if (Math.abs(z - cam.z) > near) break;
    face([[x - 0.13, y + 0.36, z - 1.3], [x + 0.13, y + 0.36, z - 1.3], [x + 0.13, y + 0.36, z + 1.3], [x - 0.13, y + 0.36, z + 1.3]], sl, fs);
  }
  const rc = opt.rail || [178, 172, 160];
  for (const rz of [z - 0.7175, z + 0.7175]) {
    for (let x = a; x < b; x += 6) {
      line3([x, y + 0.42, rz], [Math.min(b, x + 6), y + 0.42, rz], [60, 56, 50], 0.14, 1);
      line3([x, y + 0.53, rz], [Math.min(b, x + 6), y + 0.53, rz], rc, 0.07, 1, 1.15);
    }
  }
}

/* Katener direkleri ve telleri: direkler sıralı listeye, teller sonra çizilir */
function catenary(list, z, side, sp, off) {
  const cam = R.cam, pz = z + side * 3.2;
  off = off || 0;
  const [a, b] = viewRange(-1e4, 1e4, 300);
  const start = Math.floor((a - off) / sp) * sp + off;
  for (let x = start; x <= b; x += sp) {
    list.push({ k: adist(x - 0.2, x + 0.2, 0, 8, pz - 0.2, pz + 0.2), d: () => {
      box({ x, z: pz, w: 0.32, d: 0.32, h: 8.2, col: [120, 122, 118] });
      line3([x, 7.2, pz], [x, 7.2, z], [70, 72, 70], 0.08, 1);
      line3([x, 5.9, pz], [x, 5.6, z], [70, 72, 70], 0.06, 1);
      disc(x, 5.9, z - side * 0.3, 0.08, [90, 70, 60], 1, 1);
    } });
  }
  return () => {
    const wc = R.env.night ? [150, 156, 164] : [34, 36, 38];
    for (let x = start; x < b; x += sp) {
      const seg = 6;
      for (let i = 0; i < seg; i++) {
        const u0 = i / seg, u1 = (i + 1) / seg;
        const s0 = 0.55 * 4 * u0 * (1 - u0), s1 = 0.55 * 4 * u1 * (1 - u1);
        line3([x + sp * u0, 7.2 - s0, z], [x + sp * u1, 7.2 - s1, z], wc, 0.025, 1);
        line3([x + sp * u0, 5.6, z], [x + sp * u1, 5.6, z], wc, 0.03, 1.1);
        if (i) line3([x + sp * u0, 7.2 - s0, z], [x + sp * u0, 5.6, z], wc, 0.01, 0.5);
      }
    }
    void cam;
  };
}

function tree(list, x, z, s, seed) {
  const r = srand(seed);
  const blobs = [];
  for (let i = 0; i < 6; i++) blobs.push([rnd0(r, -1.4, 1.4) * s, (3 + r() * 3) * s, rnd0(r, -1.2, 1.2) * s, (1.2 + r()) * s, r()]);
  list.push({ k: adist(x - 2 * s, x + 2 * s, 0, 7 * s, z - 2 * s, z + 2 * s), d: () => {
    line3([x, 0, z], [x, 3.6 * s, z], [62, 48, 36], 0.28 * s, 1);
    blobs.sort((p, q) => q[2] - p[2]);
    for (const bl of blobs) disc(x + bl[0], bl[1], z + bl[2], bl[3], [52 + bl[4] * 30, 72 + bl[4] * 30, 44], 0.75 + bl[4] * 0.35, 1);
  } });
}
function rnd0(r, a, b) { return a + r() * (b - a); }

function building(list, x, z, w, d, h, col, win) {
  list.push({ k: adist(x - w / 2, x + w / 2, 0, h, z - d / 2, z + d / 2), d: () => {
    box({ x, z, w, d, h, col, cols: { top: [80, 78, 76] }, decal: win ? (n, map, f) => {
      if (n === 'top') return;
      const U = (n === '+x' || n === '-x') ? d / 2 : w / 2;
      for (let fl = 0; fl * 3 + 2 < h; fl++) for (let u = -U + 1.2; u < U - 1; u += 2.6) dq(map, u, fl * 3 + 1.2, u + 1.2, fl * 3 + 2.6, win, f);
    } : null });
  } });
}

function sortDraw(list) {
  list.sort((a, b) => b.k - a.k);
  for (const it of list) it.d();
}

/* ---------- parçacıklar ---------- */
function Particles() { this.p = []; }
Particles.prototype.add = function (o) { this.p.push(Object.assign({ vx: 0, vy: 0, vz: 0, life: 1, age: 0, g: 9.8, size: 0.05, grow: 0, col: [200, 200, 200], add: false, drag: 0 }, o)); };
Particles.prototype.update = function (dt) {
  for (const q of this.p) {
    q.age += dt; q.vy -= q.g * dt;
    const dr = Math.max(0, 1 - q.drag * dt);
    q.vx *= dr; q.vz *= dr; q.vy *= q.drag ? dr : 1;
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.size += q.grow * dt;
    if (q.floor != null && q.y < q.floor) { q.y = q.floor; q.vy *= -0.25; q.vx *= 0.5; q.vz *= 0.5; }
  }
  this.p = this.p.filter(q => q.age < q.life);
};
Particles.prototype.draw = function () {
  const ctx = R.ctx;
  for (const q of this.p) {
    const a = clamp(1 - q.age / q.life, 0, 1);
    if (q.add) { glow(q.x, q.y, q.z, q.size * 4, q.col.join(','), a, 1.5); continue; }
    ctx.globalAlpha = a * (q.alpha == null ? 1 : q.alpha);
    disc(q.x, q.y, q.z, q.size, q.col, 1, 0.8);
  }
  ctx.globalAlpha = 1;
};
