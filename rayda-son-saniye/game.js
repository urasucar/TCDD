'use strict';
/* Oyun akışı, görüntü sonrası işleme (CCTV / kabin / telefon) ve arayüz */

function nrm(x, y, z) { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; }
function mkEnv(o) {
  o = o || {};
  const e = Object.assign({
    sky: ['#8fa6b8', '#d6dbd6'], ground: ['#7a7866', '#4b4e42'], fog: [196, 202, 202], fogD: 380, fogMax: 0.9, lum: 1, amb: 0.5, L: nrm(-0.45, 0.8, -0.4), night: false,
    clouds: 7, cloudA: 0.5, cloudCol: '246,246,242', grain: 0.5, shadowA: 0.32, rain: 0, snow: 0, sun: null,
  }, o);
  if (e.night) {
    if (o.cloudCol == null) { e.cloudCol = '84,88,100'; e.cloudA = 0.3; }
    if (o.shadowA == null) e.shadowA = 0.16;
  }
  return e;
}

const G = { idx: 0, score: 0, results: [], state: 'intro', S: null, scene: null, frozen: false, replay: false, last: 0, cur: null, muted: false };
const $ = (s) => document.querySelector(s);
const disp = $('#screen'), dctx = disp.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const bctx = buf.getContext('2d');
const HAS_FILTER = 'filter' in dctx;
const bloomC = document.createElement('canvas'); bloomC.width = 240; bloomC.height = 135;
const blx = bloomC.getContext('2d');
const prevC = document.createElement('canvas'); prevC.width = W; prevC.height = H;
const pctx = prevC.getContext('2d');
let ghostOk = false;

const noiseC = [];
for (let n = 0; n < 4; n++) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 180;
  const x = c.getContext('2d'), im = x.createImageData(320, 180);
  for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  x.putImageData(im, 0, 0); noiseC.push(c);
}
const scan = (() => { const c = document.createElement('canvas'); c.width = 2; c.height = 3; const x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 2, 2, 1); return dctx.createPattern(c, 'repeat'); })();

function newState(sc) {
  const S = { t: 0, dt: 0, parts: new Particles(), shake: 0, glitch: 0, flash: 0, speed: null, brake: false, flags: {}, env: mkEnv(), cam: new Cam({}) };
  S.once = (k) => (S.flags[k] ? false : (S.flags[k] = true));
  S.at = (k, t) => S.t >= t && S.once(k);
  sc.init(S);
  return S;
}

/* ---------- çizim ---------- */
function render() {
  const S = G.S, sc = G.scene;
  R.ctx = bctx; R.cam = S.cam; R.env = S.env; S.cam.upd();
  bctx.save();
  bctx.setTransform(1, 0, 0, 1, 0, 0);
  const sx = (Math.random() - 0.5) * S.shake * 26, sy = (Math.random() - 0.5) * S.shake * 26;
  bctx.translate(W / 2 + sx, H / 2 + sy);
  bctx.rotate(S.cam.roll || 0);
  const zoom = sc.kind === 'phone' ? 1.22 : 1;
  bctx.scale(zoom, zoom);
  bctx.translate(-W / 2, -H / 2);
  R.zsort = false;
  sc.draw(S);
  S.parts.draw();
  bctx.restore();
  post(S, sc);
}

function fmt2(n) { return String(Math.floor(n)).padStart(2, '0'); }
function stampAt(sc, t) {
  const d = new Date(sc.stamp.replace(' ', 'T'));
  d.setSeconds(d.getSeconds() + Math.floor(t));
  return fmt2(d.getDate()) + '.' + fmt2(d.getMonth() + 1) + '.' + d.getFullYear() + '  ' + fmt2(d.getHours()) + ':' + fmt2(d.getMinutes()) + ':' + fmt2(d.getSeconds());
}

function post(S, sc) {
  const k = sc.kind, c = dctx;
  c.save();
  if (HAS_FILTER) c.filter = k === 'cctv' ? 'contrast(1.12) brightness(1.04) blur(0.55px)' : k === 'cab' ? 'contrast(1.06) blur(0.35px)' : 'contrast(1.03) saturate(1.08)';
  c.drawImage(buf, 0, 0);
  c.filter = 'none';
  if (k === 'cctv') {
    if (ghostOk) { c.globalAlpha = 0.2; c.drawImage(prevC, 0, 0); c.globalAlpha = 1; }
    pctx.drawImage(disp, 0, 0); ghostOk = true;
  }
  if (HAS_FILTER) {
    blx.filter = 'brightness(0.6) contrast(5) blur(2px)';
    blx.clearRect(0, 0, 240, 135); blx.drawImage(buf, 0, 0, 240, 135); blx.filter = 'none';
    c.globalCompositeOperation = 'screen'; c.globalAlpha = S.env.night ? 0.75 : 0.4;
    c.drawImage(bloomC, 0, 0, W, H);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  if (k !== 'phone') {
    c.globalCompositeOperation = 'saturation';
    c.fillStyle = k === 'cctv' ? 'rgba(128,128,128,0.72)' : 'rgba(128,128,128,0.25)';
    c.fillRect(0, 0, W, H);
    if (k === 'cctv') { c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(90,140,120,0.35)'; c.fillRect(0, 0, W, H); }
    c.globalCompositeOperation = 'source-over';
  }
  c.globalCompositeOperation = 'overlay';
  c.globalAlpha = k === 'cctv' ? 0.22 : 0.1;
  c.drawImage(noiseC[(Math.random() * 4) | 0], 0, 0, W, H);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  if (k === 'cctv') { c.globalAlpha = 0.28; c.fillStyle = scan; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  const vg = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, k === 'phone' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.6)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);

  const e = S.env;
  if (e.rain || e.snow) {
    const rr = G.state === 'play' && !G.frozen ? Math.random : srand(99);
    if (e.rain) {
      c.strokeStyle = 'rgba(205,215,225,' + (0.12 + 0.22 * e.rain).toFixed(2) + ')'; c.lineWidth = 1.1; c.beginPath();
      for (let i = 0, n = 320 * e.rain; i < n; i++) { const x = rr() * (W + 80) - 40, y = rr() * H, l = 12 + rr() * 26; c.moveTo(x, y); c.lineTo(x + l * 0.16, y + l); }
      c.stroke();
    }
    if (e.snow) {
      c.fillStyle = 'rgba(240,242,245,0.75)';
      for (let i = 0, n = 260 * e.snow; i < n; i++) { const s = 1 + rr() * 2.6; c.fillRect(rr() * W, rr() * H, s, s); }
    }
  }

  if (S.glitch > 0) {
    const g = Math.min(1, S.glitch * 2.5);
    for (let i = 0; i < 14; i++) {
      const y = Math.random() * H, h = 4 + Math.random() * 46, dx = (Math.random() - 0.5) * 140 * g;
      c.drawImage(disp, 0, y, W, h, dx, y, W, h);
    }
    c.globalAlpha = 0.55 * g; c.drawImage(noiseC[(Math.random() * 4) | 0], 0, 0, W, H);
    c.globalAlpha = 0.25 * g; c.fillStyle = Math.random() < 0.5 ? '#0f3' : '#f0f'; c.fillRect(0, Math.random() * H, W, 3 + Math.random() * 10);
    c.globalAlpha = 1;
  }
  if (S.flash > 0) { c.fillStyle = 'rgba(235,245,255,' + Math.min(1, S.flash) + ')'; c.fillRect(0, 0, W, H); }
  if (S.dark) { c.fillStyle = 'rgba(0,0,0,' + clamp(S.dark, 0, 1) + ')'; c.fillRect(0, 0, W, H); }

  c.font = '500 17px "IBM Plex Mono", ui-monospace, Menlo, monospace';
  c.textBaseline = 'top';
  c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 3;
  c.fillStyle = 'rgba(236,240,236,0.92)';
  const blink = Math.floor(performance.now() / 600) % 2 === 0;
  if (k === 'cctv') {
    c.fillText(sc.camLabel + '  ' + sc.placeShort, 22, 18);
    const st = stampAt(sc, S.t);
    c.fillText(st, W - 22 - c.measureText(st).width, 18);
    if (blink) { c.fillStyle = '#e33'; c.beginPath(); c.arc(30, H - 30, 6, 0, PI * 2); c.fill(); }
    c.fillStyle = 'rgba(236,240,236,0.92)'; c.fillText('KAYIT', 44, H - 40);
  } else if (k === 'cab') {
    c.shadowBlur = 0;
    c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(0, H - 46, W, 46);
    c.fillStyle = 'rgba(236,240,236,0.95)';
    c.fillText('LOK. ÖN KAMERA  ' + sc.placeShort, 20, H - 34);
    const sp = 'HIZ ' + String(Math.round(S.speed || 0)).padStart(3, '0') + ' km/s';
    c.fillText(sp, W / 2 - 40, H - 34);
    if (S.brake && blink) { c.fillStyle = '#ff4a3a'; c.fillText('ACİL FREN', W / 2 + 130, H - 34); }
    c.fillStyle = 'rgba(236,240,236,0.95)';
    const st = stampAt(sc, S.t);
    c.fillText(st, W - 20 - c.measureText(st).width, H - 34);
  } else {
    c.fillStyle = '#f33'; c.beginPath(); c.arc(W / 2 - 44, 29, 7, 0, PI * 2); c.fill();
    c.fillStyle = '#fff'; c.fillText('00:' + fmt2(S.t), W / 2 - 30, 18);
    c.fillText('HD', W - 58, 18);
  }
  c.restore();
}

/* ---------- döngü ---------- */
function frame(ts) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (ts - (G.last || ts)) / 1000);
  G.last = ts;
  if (!G.S) return;
  if (G.state === 'play' && !G.frozen) {
    const S = G.S;
    S.t += dt; S.dt = dt;
    G.scene.update(S, dt);
    S.parts.update(dt);
    S.shake *= Math.pow(0.03, dt);
    S.glitch = Math.max(0, S.glitch - dt);
    S.flash = Math.max(0, S.flash - dt * 2.2);
    render();
    hud();
    if (S.t >= G.scene.dur) endVideo();
  } else {
    post(G.S, G.scene);
  }
}

function hud() {
  const S = G.S, d = G.scene.dur;
  $('#tlFill').style.width = clamp(S.t / d, 0, 1) * 100 + '%';
  $('#tlTime').textContent = '00:' + fmt2(Math.min(S.t, d)) + ' / 00:' + fmt2(d);
}

let toastTimer = 0;
function toast(msg, type) {
  const el = $('#toast');
  el.textContent = msg; el.className = 'toast ' + (type || ''); el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 1600);
}

function show(panel) { for (const id of ['#pIndex', '#pBrief', '#pReport', '#pSummary']) $(id).hidden = id !== panel; }

/* ---------- akış ---------- */
function buildIndex() {
  const ol = $('#index'); ol.innerHTML = '';
  SCENES.forEach((sc, i) => {
    const li = document.createElement('li');
    const r = G.results[i];
    if (i === G.idx && G.state !== 'summary') li.className = 'now';
    let chip = '<span class="chip">İzlenmedi</span>';
    if (r) chip = sc.outcome === 'ÖLÜM' ? '<span class="chip death">Ölüm</span>' : '<span class="chip injury">Ağır yaralı</span>';
    else if (i === G.idx) chip = '<span class="chip next">Sırada</span>';
    li.innerHTML = '<span class="code">K-' + fmt2(i + 1) + '</span><span><span class="ttl"></span><span class="plc"></span></span>' + chip;
    li.querySelector('.ttl').textContent = sc.title;
    li.querySelector('.plc').textContent = sc.place;
    ol.appendChild(li);
  });
  const now = ol.querySelector('.now');
  if (now) ol.scrollTop = Math.max(0, now.offsetTop - ol.offsetTop - 60);
}

function meters() {
  $('#mRec').textContent = fmt2(G.state === 'summary' ? SCENES.length : Math.min(G.idx + 1, SCENES.length)) + '/' + SCENES.length;
  $('#mScore').textContent = G.score;
}

function loadScene(i, replay) {
  AU.stopAll();
  G.idx = i; G.scene = SCENES[i]; G.replay = !!replay;
  G.S = newState(G.scene);
  G.frozen = false; G.state = 'play'; ghostOk = false;
  if (!replay) G.cur = { pts: 0, early: 0, spotted: false, late: false, spotT: null, answer: null };
  const sc = G.scene;
  $('#stamp').hidden = true; $('#intro').hidden = true;
  $('#tlWin').hidden = !replay; $('#tlMark').hidden = true;
  if (replay) placeWindow();
  $('#btnDanger').disabled = !!replay;
  $('#bCode').textContent = 'Kayıt K-' + fmt2(i + 1) + (replay ? ' · tekrar' : '');
  $('#bTitle').textContent = sc.title;
  $('#bPlace').textContent = sc.place;
  $('#bCam').textContent = sc.camLabel + ' · ' + ({ cctv: 'güvenlik kamerası', cab: 'lokomotif ön kamerası', phone: 'cep telefonu kaydı' })[sc.kind];
  $('#bDate').textContent = stampAt(sc, 0);
  $('#bDur').textContent = sc.dur + ' sn';
  show('#pBrief');
  meters();
  hud();
  disp.focus({ preventScroll: true });
}

function placeWindow() {
  const [a, b] = G.scene.danger, d = G.scene.dur, w = $('#tlWin');
  w.style.left = (a / d * 100) + '%'; w.style.width = ((b - a) / d * 100) + '%'; w.hidden = false;
  const m = $('#tlMark'), r = G.results[G.idx] || G.cur;
  if (r && r.spotT != null) { m.style.left = (r.spotT / d * 100) + '%'; m.className = 'tl-mark' + (r.late ? ' bad' : ''); m.hidden = false; }
}

function pressDanger() {
  if (G.state !== 'play' || G.frozen || G.replay) return;
  const S = G.S, [a, b] = G.scene.danger, r = G.cur, btn = $('#btnDanger');
  if (r.spotted) return;
  btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
  if (S.t < a) {
    if (r.early < 3) { r.early++; r.pts -= 20; G.score -= 20; toast('Erken alarm: henüz tehlikeli bir davranış yok  −20', 'warn'); }
    else toast('Erken alarm', 'warn');
  } else if (S.t <= b) {
    const p = Math.round(50 + 100 * (1 - (S.t - a) / (b - a)));
    r.spotted = true; r.spotT = S.t; r.pts += p; G.score += p;
    toast('Tehlike yakalandı  +' + p, 'ok');
    btn.disabled = true;
  } else {
    r.spotted = true; r.late = true; r.spotT = S.t;
    toast('Çok geç: o an geçti', 'bad');
    btn.disabled = true;
  }
  meters();
}

function endVideo() {
  G.frozen = true;
  G.S.glitch = 0; G.S.flash = 0; G.S.shake = 0;
  $('#btnDanger').disabled = true;
  const sc = G.scene;
  setTimeout(() => AU.stopAll(), 900);
  $('#stampBox').className = 'stamp-box' + (sc.outcome === 'ÖLÜM' ? '' : ' injury');
  $('#stampWord').textContent = sc.outcome;
  $('#stampWho').textContent = sc.victim;
  $('#stamp').hidden = false;
  placeWindow();
  if (G.replay) { setTimeout(() => { G.state = 'report'; show('#pReport'); }, 1200); return; }
  setTimeout(showReport, 1500);
}

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function showReport() {
  G.state = 'report';
  const sc = G.scene, r = G.cur;
  $('#rNo').textContent = 'No. ' + sc.stamp.slice(0, 4) + '/' + sc.stamp.slice(5, 7) + sc.stamp.slice(8, 10) + '-' + fmt2(G.idx + 1);
  const chip = $('#rChip');
  chip.className = 'chip ' + (sc.outcome === 'ÖLÜM' ? 'death' : 'injury');
  chip.textContent = sc.outcome === 'ÖLÜM' ? 'Ölüm' : 'Ağır yaralı';
  $('#rWho').textContent = sc.victim;
  const react = $('#rReact');
  let line;
  if (r.spotted && !r.late) line = '<b class="ok">' + r.spotT.toFixed(1).replace('.', ',') + ' sn: zamanında yakaladın.</b> ';
  else if (r.late) line = '<b class="bad">Geç kaldın.</b> ';
  else line = '<b class="bad">Tehlikeyi işaretlemedin.</b> ';
  if (r.early) line += '<span class="warn">Erken alarm ×' + r.early + '.</span> ';
  react.innerHTML = line + '<br>Tehlike anı: ';
  react.appendChild(document.createTextNode(sc.cue + '.'));
  $('#rQ').textContent = sc.q.text;
  const box = $('#rOpts'); box.innerHTML = '';
  const order = shuffle(sc.q.opts.map((t, i) => ({ t, i })));
  order.forEach((o, n) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt'; b.dataset.i = o.i;
    b.innerHTML = '<span class="k">' + 'ABCD'[n] + '</span><span></span>';
    b.lastChild.textContent = o.t;
    b.addEventListener('click', () => answer(o.i));
    box.appendChild(b);
  });
  $('#rAfter').hidden = true;
  $('#btnNext').textContent = G.idx === SCENES.length - 1 ? 'Vardiyayı bitir' : 'Sonraki kayıt';
  show('#pReport');
}

function answer(i) {
  const r = G.cur, sc = G.scene;
  if (r.answer != null) return;
  r.answer = i;
  const ok = i === 0;
  if (ok) { r.pts += 100; G.score += 100; }
  for (const b of document.querySelectorAll('#rOpts .opt')) {
    b.disabled = true;
    if (+b.dataset.i === 0) b.classList.add('correct');
    else if (+b.dataset.i === i) b.classList.add('wrong');
  }
  $('#rWhy').textContent = (ok ? 'Doğru. ' : 'Yanlış. ') + sc.q.why;
  $('#rRule').textContent = sc.rule;
  $('#rFact').textContent = sc.fact;
  $('#rAfter').hidden = false;
  G.results[G.idx] = Object.assign({}, r);
  try { localStorage.setItem('rss-progress', JSON.stringify({ idx: G.idx })); } catch (e) { /* depolama yok */ }
  meters();
  $('#btnNext').focus({ preventScroll: true });
}

function next() {
  if (G.cur.answer == null) return;
  if (G.idx < SCENES.length - 1) loadScene(G.idx + 1);
  else summary();
}

function summary() {
  G.state = 'summary';
  AU.stopAll();
  $('#stamp').hidden = true;
  const max = SCENES.length * 250;
  $('#sScore').textContent = G.score;
  const pct = G.score / max;
  $('#sRank').textContent = pct >= 0.8 ? 'Hat güvenlik şefi' : pct >= 0.58 ? 'Dikkatli gözcü' : pct >= 0.35 ? 'Acemi gözcü' : 'Tehlikeye kör';
  const ul = $('#sList'); ul.innerHTML = '';
  SCENES.forEach((sc, i) => {
    const r = G.results[i] || { pts: 0 };
    const li = document.createElement('li');
    li.innerHTML = '<span class="n">K-' + fmt2(i + 1) + '</span><span></span><span class="chip ' + (sc.outcome === 'ÖLÜM' ? 'death">Ölüm' : 'injury">Yaralı') + '</span><span class="p">' + r.pts + '</span>';
    li.children[1].textContent = sc.title;
    ul.appendChild(li);
  });
  const rules = $('#sRules'); rules.innerHTML = '';
  SCENES.forEach(sc => { const li = document.createElement('li'); li.textContent = sc.rule; rules.appendChild(li); });
  try {
    const best = +(localStorage.getItem('rss-best') || 0);
    if (G.score > best) localStorage.setItem('rss-best', String(G.score));
  } catch (e) { /* depolama yok */ }
  show('#pSummary');
  meters();
}

function restart() {
  G.idx = 0; G.score = 0; G.results = [];
  loadScene(0);
}

/* ---------- olaylar ---------- */
$('#btnStart').addEventListener('click', () => { AU.init(); AU.setMuted(G.muted); loadScene(G.idx); });
$('#btnDanger').addEventListener('click', pressDanger);
$('#btnNext').addEventListener('click', next);
$('#btnReplay').addEventListener('click', () => loadScene(G.idx, true));
$('#btnRestart').addEventListener('click', restart);
$('#btnMute').addEventListener('click', (e) => {
  G.muted = !G.muted; AU.setMuted(G.muted);
  e.currentTarget.textContent = 'Ses: ' + (G.muted ? 'kapalı' : 'açık');
  e.currentTarget.setAttribute('aria-pressed', String(G.muted));
});
window.addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input,textarea')) return;
  if (e.code === 'Space') {
    if (G.state === 'play') { e.preventDefault(); pressDanger(); }
  } else if (G.state === 'report' && G.cur && G.cur.answer == null && /^[1-4a-dA-D]$/.test(e.key)) {
    const n = /[1-4]/.test(e.key) ? +e.key - 1 : 'abcd'.indexOf(e.key.toLowerCase());
    const b = document.querySelectorAll('#rOpts .opt')[n];
    if (b) b.click();
  }
});

/* açılış: ilk kaydın sessiz bir karesi */
(function boot() {
  try { const best = +(localStorage.getItem('rss-best') || 0); if (best) $('#bestScore').textContent = 'En iyi puan: ' + best; } catch (e) { /* depolama yok */ }
  G.scene = SCENES[0];
  G.S = newState(G.scene);
  const S = G.S;
  const step = 1 / 30;
  while (S.t < G.scene.preview) { S.t += step; G.scene.update(S, step); S.parts.update(step); }
  S.shake = 0; S.glitch = 0; S.flash = 0;
  render();
  G.state = 'intro';
  buildIndex();
  meters();
  $('#tlTime').textContent = '00:00 / 00:' + fmt2(G.scene.dur);
  requestAnimationFrame(frame);
})();

// dizin her panel değişiminde güncel kalsın
const _show = show;
show = function (panel) { _show(panel); if (panel === '#pIndex') buildIndex(); };
