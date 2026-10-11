/* Asíntota · núcleo: utilidades, gráficos, navegación y funciones estadísticas */
window.A = (() => {
const A = {};
const $ = A.$ = s => document.querySelector(s);
A.$$ = s => [...document.querySelectorAll(s)];
const cs = getComputedStyle(document.documentElement);
const K = A.K = {};
['bg', 'panel', 'panel-2', 'line', 'fg', 'muted', 'faint', 'amber', 'teal', 'rose', 'violet'].forEach(k => K[k] = cs.getPropertyValue('--' + k).trim());
const MONO = A.MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
A.SERIF = '"Instrument Serif", Georgia, serif';
A.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Formato ---------- */
const fmt = A.fmt = (x, d = 2) => Number.isFinite(x) ? (Math.abs(x) < 1e-12 ? 0 : x).toLocaleString('es-AR', { maximumFractionDigits: d }) : '—';
const fmtF = A.fmtF = (x, d) => Number.isFinite(x) ? x.toLocaleString('es-AR', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
A.pct = (p, d = 1) => fmtF(p * 100, d) + '%';
const niceStep = A.niceStep = (range, target) => {
  const raw = range / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
};
const decs = A.decs = step => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
A.num = s => { const n = Number(String(s).trim().replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
A.clamp = (x, a, b) => Math.min(b, Math.max(a, x));
A.greek = root => (root || document).querySelectorAll('label.l').forEach(l => { if (!l.dataset.gk) { l.dataset.gk = 1; l.innerHTML = l.innerHTML.replace(/([α-ω])(?![^<]*>)/g, '<span class="gk">$1</span>'); } });
A.stats = items => items.map(([k, v]) => `<div class="st"><dt>${k}</dt><dd>${v}</dd></div>`).join('');

/* ---------- Lienzos ---------- */
const canv = A.canv = cv => {
  const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  const W = Math.round(w * d), H = Math.round(h * d);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
  return { c, w, h, d };
};

// Marco cartesiano con grilla horizontal y marcas en x.
A.frame = (c, w, h, xr, yr, o = {}) => {
  const L = o.l ?? 46, R = o.r ?? 12, T = o.t ?? 12, B = o.b ?? 26;
  const pw = w - L - R, ph = h - T - B;
  const X = o.logx
    ? v => L + (Math.log10(v) - Math.log10(xr[0])) / (Math.log10(xr[1]) - Math.log10(xr[0])) * pw
    : v => L + (v - xr[0]) / (xr[1] - xr[0]) * pw;
  const Y = v => T + ph - (v - yr[0]) / (yr[1] - yr[0]) * ph;
  c.font = '11px ' + MONO; c.lineWidth = 1;
  const ys = o.ystep || niceStep(yr[1] - yr[0], o.yt || 4);
  for (let v = Math.ceil(yr[0] / ys - 1e-9) * ys; v <= yr[1] + 1e-9; v += ys) {
    const y = Math.round(Y(v)) + .5;
    c.strokeStyle = K.line; c.beginPath(); c.moveTo(L, y); c.lineTo(L + pw, y); c.stroke();
    c.fillStyle = K.muted; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText(o.yf ? o.yf(v) : fmt(v, decs(ys)), L - 7, y);
  }
  let xt = o.xticks, xd = 2;
  if (!xt) { const xs = niceStep(xr[1] - xr[0], o.xt || 6); xt = []; xd = decs(xs); for (let v = Math.ceil(xr[0] / xs - 1e-9) * xs; v <= xr[1] + 1e-9; v += xs) xt.push(+v.toFixed(10)); }
  c.fillStyle = K.muted; c.textAlign = 'center'; c.textBaseline = 'top';
  xt.forEach(v => c.fillText(o.xf ? o.xf(v) : fmt(v, xd), X(v), T + ph + 8));
  c.strokeStyle = K.faint; c.beginPath(); c.moveTo(L, Math.round(T + ph) + .5); c.lineTo(L + pw, Math.round(T + ph) + .5); c.stroke();
  return { X, Y, L, T, pw, ph, R, B };
};

// Plano cartesiano con zoom, arrastre, lectura y capas propias.
A.plane = (cv, o = {}) => {
  const v = { cx: o.cx ?? 0, cy: o.cy ?? 0, span: null };
  let hover = null, drag = null, api = null;
  const P = { v };
  P.draw = () => {
    const { c, w, h } = canv(cv);
    if (w < 2 || h < 2) return;
    if (!v.span) v.span = typeof o.span === 'function' ? o.span(w) : (o.span || 20);
    const s = v.span / w, x0 = v.cx - w / 2 * s, x1 = v.cx + w / 2 * s, y1 = v.cy + h / 2 * s, y0 = v.cy - h / 2 * s;
    const PX = x => (x - x0) / s, PY = y => (y1 - y) / s, WX = px => x0 + px * s, WY = py => y1 - py * s;
    const step = niceStep(w * s, w < 600 ? 6 : 10), d = decs(step);
    c.lineWidth = 1;
    for (const [st, col] of [[step / 5, 'rgba(42,42,55,.45)'], [step, K.line]]) {
      c.strokeStyle = col; c.beginPath();
      for (let x = Math.ceil(x0 / st) * st; x <= x1; x += st) { const p = Math.round(PX(x)) + .5; c.moveTo(p, 0); c.lineTo(p, h); }
      for (let y = Math.floor(y1 / st) * st; y >= y0; y -= st) { const p = Math.round(PY(y)) + .5; c.moveTo(0, p); c.lineTo(w, p); }
      c.stroke();
    }
    const ax = Math.round(PY(0)) + .5, ay = Math.round(PX(0)) + .5;
    c.strokeStyle = K.faint; c.lineWidth = 1.4; c.beginPath();
    if (ax > 0 && ax < h) { c.moveTo(0, ax); c.lineTo(w, ax); }
    if (ay > 0 && ay < w) { c.moveTo(ay, 0); c.lineTo(ay, h); }
    c.stroke();
    c.font = '11px ' + MONO; c.fillStyle = K.muted;
    const ly = Math.min(Math.max(ax + 6, 4), h - 16);
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) { if (Math.abs(x) < step / 2) continue; c.fillText(fmt(x, d), PX(x), ly); }
    const lx = Math.min(Math.max(ay - 6, 34), w - 4);
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let y = Math.floor(y1 / step) * step; y >= y0; y -= step) { if (Math.abs(y) < step / 2) continue; c.fillText(fmt(y, d), lx, PY(y)); }
    api = {
      c, w, h, s, x0, x1, y0, y1, PX, PY, WX, WY, d,
      plot(f, col, lw = 2.2, dash) {
        c.save(); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; if (dash) c.setLineDash(dash);
        c.beginPath(); let pen = false, prev = 0;
        for (let px = 0; px <= w; px += .5) {
          let y; try { y = f(x0 + px * s); } catch (e) { y = NaN; }
          if (!Number.isFinite(y)) { pen = false; continue; }
          const py = Math.max(-1e5, Math.min(1e5, PY(y)));
          if (pen && Math.abs(py - prev) > h * 1.2) pen = false;
          pen ? c.lineTo(px, py) : c.moveTo(px, py); pen = true; prev = py;
        }
        c.stroke(); c.restore();
      },
      dot(x, y, col, r = 5) { c.fillStyle = col; c.beginPath(); c.arc(PX(x), PY(y), r, 0, 7); c.fill(); },
      line(xa, ya, xb, yb, col, lw = 1.5, dash) { c.save(); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); c.beginPath(); c.moveTo(PX(xa), PY(ya)); c.lineTo(PX(xb), PY(yb)); c.stroke(); c.restore(); },
      arrow(xa, ya, xb, yb, col, lw = 2.4) {
        const a = [PX(xa), PY(ya)], b = [PX(xb), PY(yb)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0] - 7 * Math.cos(ang), b[1] - 7 * Math.sin(ang)); c.stroke();
        c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] - 11 * Math.cos(ang - .4), b[1] - 11 * Math.sin(ang - .4)); c.lineTo(b[0] - 11 * Math.cos(ang + .4), b[1] - 11 * Math.sin(ang + .4)); c.closePath(); c.fill(); c.restore();
      }
    };
    o.layers && o.layers(api);
    if (hover !== null && o.hover) o.hover(api, hover);
  };
  P.api = () => api;
  P.zoom = (f, mx, my) => {
    const r = cv.getBoundingClientRect(), w = r.width, h = r.height;
    if (mx === undefined) { mx = w / 2; my = h / 2; }
    const s = v.span / w, wx = v.cx + (mx - w / 2) * s, wy = v.cy - (my - h / 2) * s;
    v.span = Math.min(1e5, Math.max(1e-4, v.span * f));
    const s2 = v.span / w; v.cx = wx - (mx - w / 2) * s2; v.cy = wy + (my - h / 2) * s2; P.draw();
  };
  P.reset = () => { v.cx = o.cx ?? 0; v.cy = o.cy ?? 0; v.span = null; P.draw(); };
  cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    const g = o.grab && api ? o.grab(api, px, py) : null;
    drag = g ? { g } : (o.pan === false ? null : { x: e.clientX, y: e.clientY, cx: v.cx, cy: v.cy });
    if (drag) cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (drag && drag.g) drag.g.move(px, py, api);
    else if (drag) { const s = v.span / r.width; v.cx = drag.cx - (e.clientX - drag.x) * s; v.cy = drag.cy + (e.clientY - drag.y) * s; }
    hover = px; P.draw();
  });
  cv.addEventListener('pointerup', () => { if (drag && drag.g && drag.g.up) drag.g.up(); drag = null; });
  cv.addEventListener('pointerleave', () => { if (!drag) { hover = null; P.draw(); o.leave && o.leave(); } });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); P.zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
  return P;
};

/* ---------- Funciones escritas por el usuario ---------- */
A.prep = s => s.replace(/\bsen\b/g, 'sin').replace(/\braiz\b/g, 'sqrt').replace(/\bln\b/g, 'log').replace(/π/g, 'pi').replace(/\btg\b/g, 'tan');
A.mkFn = (str, vars = ['x']) => {
  const s = (str || '').trim();
  if (!s) return { f: null, err: '' };
  try {
    const code = math.compile(A.prep(s));
    const f = (...args) => {
      const scope = {}; vars.forEach((k, i) => scope[k] = args[i]);
      const r = code.evaluate(scope);
      if (typeof r === 'number') return r;
      if (r && typeof r.re === 'number') return Math.abs(r.im) < 1e-12 ? r.re : NaN;
      return NaN;
    };
    f(...vars.map(() => 1.2345));
    return { f, err: '' };
  } catch (err) {
    const m = String(err.message || err);
    return { f: null, err: /Undefined symbol/.test(m) ? `No reconozco "${m.split('symbol ')[1]}". La variable es ${vars.join(' e ')}.` : 'Revisá la fórmula: hay algo que no cierra.' };
  }
};
A.fnHelp = '<p class="note">Podés usar <span class="mono">+ − * / ^</span>, <span class="mono">sen cos tan raiz ln log abs exp</span> y las constantes <span class="mono">pi</span> y <span class="mono">e</span>. Para decimales usá punto: <span class="mono">0.5</span>.</p>';

/* ---------- Estadística ---------- */
const lgamma = A.lgamma = x => {
  const g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < .5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  x -= 1; let a = g[0]; const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += g[i] / (x + i);
  return .5 * Math.log(2 * Math.PI) + (x + .5) * Math.log(t) - t + Math.log(a);
};
const gammaP = A.gammaP = (a, x) => {
  if (x <= 0) return 0;
  const lead = -x + a * Math.log(x) - lgamma(a);
  if (x < a + 1) {
    let ap = a, sum = 1 / a, del = sum;
    for (let n = 0; n < 1000; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-15) break; }
    return sum * Math.exp(lead);
  }
  const FP = 1e-300; let b = x + 1 - a, c = 1 / FP, d = 1 / b, h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < FP) d = FP; c = b + an / c; if (Math.abs(c) < FP) c = FP;
    d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
  }
  return 1 - Math.exp(lead) * h;
};
const betacf = (a, b, x) => {
  const FP = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
    const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
};
const betaI = A.betaI = (a, b, x) => {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
};
const erfc = x => {
  const z = Math.abs(x), t = 1 / (1 + .5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (.37409196 + t * (.09678418 + t * (-.18628806 + t * (.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-.82215223 + t * .17087277)))))))));
  return x >= 0 ? r : 2 - r;
};
const S = A.S = {
  normPdf: (x, m = 0, s = 1) => Math.exp(-.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI)),
  normCdf: (x, m = 0, s = 1) => .5 * erfc(-(x - m) / (s * Math.SQRT2)),
  tPdf: (t, v) => Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI) * Math.pow(1 + t * t / v, -(v + 1) / 2),
  tCdf: (t, v) => { const p = .5 * betaI(v / 2, .5, v / (v + t * t)); return t > 0 ? 1 - p : p; },
  chiPdf: (x, k) => x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.log(2) - lgamma(k / 2)),
  chiCdf: (x, k) => gammaP(k / 2, Math.max(0, x / 2)),
  binPmf: (k, n, p) => k < 0 || k > n ? 0 : p === 0 ? (k === 0 ? 1 : 0) : p === 1 ? (k === n ? 1 : 0) : Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)),
  poiPmf: (k, l) => k < 0 ? 0 : Math.exp(k * Math.log(l) - l - lgamma(k + 1)),
  inv(cdf, p, lo, hi) { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; cdf(m) < p ? lo = m : hi = m; } return (lo + hi) / 2; },
  rnorm: () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); }
};
S.tInv = (p, v) => S.inv(t => S.tCdf(t, v), p, -1e3, 1e3);
S.zInv = p => S.inv(z => S.normCdf(z), p, -40, 40);


/* ---------- Ayudas para herramientas ---------- */
A.seg = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
A.segBind = (id, cb) => A.$$(`#${id} button`).forEach(b => b.onclick = () => { A.$$(`#${id} button`).forEach(x => x.setAttribute('aria-pressed', x === b)); cb(b.dataset.v); });
// defs: [clave, etiqueta, min, max, paso, valor, decimales]
A.sliders = (pre, defs) => defs.map(([k, l, mn, mx, st, v, d = 2]) => `<div><label class="l" for="${pre}-${k}">${l} = <span id="${pre}-${k}-v" style="color:var(--fg)">${fmt(v, d)}</span></label><input type="range" id="${pre}-${k}" min="${mn}" max="${mx}" step="${st}" value="${v}"></div>`).join('');
A.bindSliders = (pre, defs, st, cb) => defs.forEach(([k, , , , , v, d = 2]) => { st[k] = v; const el = A.$(`#${pre}-${k}`); el.oninput = () => { st[k] = +el.value; A.$(`#${pre}-${k}-v`).textContent = fmt(st[k], d); cb(k); }; });
A.setSlider = (pre, k, v, st, d = 2) => { st[k] = v; const el = A.$(`#${pre}-${k}`); if (el) { el.value = v; A.$(`#${pre}-${k}-v`).textContent = fmt(v, d); } };
// Gráfico económico con ejes desde cero y utilidades de dibujo
A.ax = (cv, xr, yr, o = {}) => {
  const { c, w, h } = canv(cv); if (w < 2) return null;
  const F = A.frame(c, w, h, xr, yr, { xt: 5, yt: 5, ...o });
  const g = { c, w, h, F, X: F.X, Y: F.Y, xr, yr };
  const lim = y => Math.max(yr[0] - (yr[1] - yr[0]) * 2, Math.min(yr[1] + (yr[1] - yr[0]) * 2, y));
  g.clip = fn => { c.save(); c.beginPath(); c.rect(F.L, F.T, F.pw, F.ph); c.clip(); fn(); c.restore(); };
  g.fn = (f, col, lw = 2.2, dash, dom) => g.clip(() => {
    const [a, b] = dom || xr; c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); let pen = false;
    const N = Math.max(2, Math.round(Math.abs(F.X(b) - F.X(a)) * 1.5));
    for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N, y = f(x); if (!Number.isFinite(y)) { pen = false; continue; } pen ? c.lineTo(F.X(x), F.Y(lim(y))) : c.moveTo(F.X(x), F.Y(lim(y))); pen = true; }
    c.stroke(); c.setLineDash([]);
  });
  g.path = (pts, col, lw = 2, dash) => g.clip(() => { c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(F.X(x), F.Y(lim(y))) : c.moveTo(F.X(x), F.Y(lim(y)))); c.stroke(); c.setLineDash([]); });
  g.poly = (pts, fill, stroke) => g.clip(() => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(F.X(x), F.Y(lim(y))) : c.moveTo(F.X(x), F.Y(lim(y)))); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); } });
  g.area = (f1, f2, a, b, fill) => { if (!(b > a)) return; const N = 120, up = [], dn = []; for (let i = 0; i <= N; i++) { const x = a + (b - a) * i / N; up.push([x, f1(x)]); dn.push([x, f2(x)]); } g.poly([...up, ...dn.reverse()], fill); };
  g.dot = (x, y, col, r = 5) => { if (!Number.isFinite(x + y)) return; c.fillStyle = col; c.beginPath(); c.arc(F.X(x), F.Y(y), r, 0, 7); c.fill(); };
  g.guide = (x, y, col = K.faint) => { if (!Number.isFinite(x + y)) return; c.save(); c.strokeStyle = col; c.setLineDash([3, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(F.X(x), F.Y(y)); c.lineTo(F.X(x), F.Y(yr[0])); c.moveTo(F.X(x), F.Y(y)); c.lineTo(F.X(xr[0]), F.Y(y)); c.stroke(); c.restore(); };
  g.vline = (x, col, lw = 1.5, dash) => g.path([[x, yr[0]], [x, yr[1]]], col, lw, dash);
  g.hline = (y, col, lw = 1.5, dash) => g.path([[xr[0], y], [xr[1], y]], col, lw, dash);
  g.text = (s, x, y, col = K.muted, al = 'left', bl = 'bottom', dx = 6, dy = -4) => { if (!Number.isFinite(x + y)) return; c.font = '12px ' + MONO; c.fillStyle = col; c.textAlign = al; c.textBaseline = bl; c.fillText(s, F.X(x) + dx, F.Y(y) + dy); };
  g.labels = (xl, yl) => { c.font = '11px ' + MONO; c.fillStyle = K.faint; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(xl, F.L + F.pw, F.T + F.ph - 5); c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(yl, F.L + 5, F.T + 2); };
  return g;
};
A.legend = items => `<div class="legend">${items.map(([col, l]) => `<span><i style="background:var(--${col})"></i>${l}</span>`).join('')}</div>`;
A.steps = arr => arr.map((s, i) => `<div class="step"><p><b>Paso ${i + 1}.</b> ${s}</p></div>`).join('');

/* ---------- Plan de estudios ---------- */
A.GROUPS = [{ id: 'eco', name: 'Economía y finanzas' }, { id: 'est', name: 'Estadística' }, { id: 'mat', name: 'Matemática' }];
A.MATS = [
  { id: 'micro', group: 'eco', code: 'eco.101', name: 'Microeconomía', dir: 'microeconomia', blurb: 'Cómo deciden consumidores y empresas, y qué pasa cuando se encuentran en un mercado.', units: ['Mercados y equilibrio', 'Teoría del consumidor', 'Producción y costos', 'Estructuras de mercado', 'Equilibrio general', 'Fallas de mercado'] },
  { id: 'macro', group: 'eco', code: 'eco.102', name: 'Macroeconomía', dir: 'macroeconomia', blurb: 'Producto, desempleo, inflación, tasas y crecimiento: la economía vista desde arriba.', units: ['Cuentas nacionales', 'Demanda agregada y multiplicador', 'Consumo e inversión', 'IS-LM y el corto plazo', 'Dinero e inflación', 'Política fiscal y deuda', 'Economía abierta', 'Inflación y política monetaria', 'Crecimiento'] },
  { id: 'econometria', group: 'eco', code: 'eco.201', name: 'Econometría', dir: 'econometria', blurb: 'Medir relaciones económicas con datos reales y entender cuándo los números mienten.', units: ['Mínimos cuadrados', 'Inferencia y especificación', 'Cuando MCO falla', 'Variable dependiente binaria', 'Endogeneidad y causalidad', 'Datos de panel', 'Series de tiempo'] },
  { id: 'finanzas', group: 'eco', code: 'fin.101', name: 'Finanzas', dir: 'finanzas', blurb: 'Tasas, proyectos, préstamos, bonos, carteras y opciones, con números de verdad.', units: ['Tasas e interés', 'Evaluación de proyectos', 'Préstamos', 'Renta fija', 'Acciones y costo de capital', 'Portafolio y riesgo', 'Derivados'] },
  { id: 'juegos', group: 'eco', code: 'eco.310', name: 'Teoría de Juegos', dir: 'teoria-de-juegos', blurb: 'Decisiones estratégicas: cuando lo que te conviene depende de lo que hagan los demás.', units: ['Juegos estáticos', 'Juegos dinámicos', 'Juegos repetidos', 'Información incompleta y subastas'] },
  { id: 'est1', group: 'est', code: 'est.101', name: 'Estadística I', dir: 'estadistica-1', blurb: 'Describir datos, contar casos y entender el azar.', units: ['Estadística descriptiva', 'Probabilidad', 'Probabilidad condicional y Bayes', 'Variables aleatorias', 'Distribuciones conjuntas', 'Teoremas límite'] },
  { id: 'est2', group: 'est', code: 'est.201', name: 'Estadística II', dir: 'estadistica-2', blurb: 'Sacar conclusiones sobre una población a partir de una muestra.', units: ['Estimadores y muestreo', 'Intervalos de confianza', 'Pruebas de hipótesis', 'Comparación de poblaciones', 'Datos categóricos', 'Regresión'] },
  { id: 'calc1', group: 'mat', code: 'mat.101', name: 'Cálculo I', dir: 'calculo-1', blurb: 'Funciones de una variable: límites, derivadas, integrales y series.', units: ['Funciones', 'Límites y continuidad', 'Derivadas', 'Aplicaciones de la derivada', 'Integrales', 'Series'] },
  { id: 'calc2', group: 'mat', code: 'mat.201', name: 'Cálculo II', dir: 'calculo-2', blurb: 'Funciones de varias variables, optimización con y sin restricciones, integrales dobles.', units: ['Funciones de varias variables', 'Derivadas parciales', 'Optimización', 'Integrales múltiples'] },
  { id: 'calc3', group: 'mat', code: 'mat.301', name: 'Cálculo III', dir: 'calculo-3', blurb: 'Ecuaciones diferenciales, sistemas dinámicos y caos.', units: ['Ecuaciones diferenciales de primer orden', 'Ecuaciones de segundo orden', 'Sistemas de ecuaciones diferenciales', 'Ecuaciones en diferencias', 'Sistemas dinámicos y caos'] },
  { id: 'algebra', group: 'mat', code: 'mat.110', name: 'Álgebra Lineal', dir: 'algebra-lineal', blurb: 'Sistemas de ecuaciones, matrices y lo que las matrices le hacen al espacio.', units: ['Vectores', 'Sistemas lineales', 'Matrices y determinantes', 'Transformaciones lineales', 'Autovalores y formas cuadráticas', 'Aplicaciones'] },
  { id: 'io', group: 'mat', code: 'mat.320', name: 'Investigación Operativa', dir: 'investigacion-operativa', blurb: 'Encontrar la mejor decisión posible cuando hay restricciones.', units: ['Programación lineal', 'Transporte', 'Optimización no lineal', 'Teoría de la decisión', 'Gestión de operaciones'] }
];
// Ubicación de las herramientas de la versión anterior: [materia, unidad, orden]
const PLACE = {
  mco: ['econometria', 1, 0], hetero: ['econometria', 3, 0], multicol: ['econometria', 3, 1], logit: ['econometria', 4], omitida: ['econometria', 5, 0], series: ['econometria', 7, 0],
  tasas: ['finanzas', 1], van: ['finanzas', 2], amortizacion: ['finanzas', 3], bonos: ['finanzas', 4, 0], markowitz: ['finanzas', 6, 0], capm: ['finanzas', 6, 1], opciones: ['finanzas', 7, 0],
  consumidor: ['micro', 2, 0], costos: ['micro', 3, 2], competencia: ['micro', 4, 0], monopolio: ['micro', 4, 1], oligopolio: ['micro', 4, 4], externalidades: ['micro', 6, 0],
  keynes: ['macro', 2], islm: ['macro', 4, 0], oada: ['macro', 4, 1], mundell: ['macro', 7, 1], phillips: ['macro', 8, 0], 'taylor-regla': ['macro', 8, 1], solow: ['macro', 9, 0],
  graficador: ['calc1', 1], derivadas: ['calc1', 3], integrales: ['calc1', 5, 1], taylor: ['calc1', 6, 1], edo: ['calc3', 1, 0], lotka: ['calc3', 3, 1],
  estadistica: ['est1', 1, 0], combinatoria: ['est1', 2, 1], cumpleanos: ['est1', 2, 2], montyhall: ['est1', 3, 1],
  distribuciones: ['est1', 4, 1], casino: ['est1', 4, 3], lgn: ['est1', 6, 0], tcl: ['est1', 6, 1], montecarlo: ['est1', 6, 2],
  intervalos: ['est2', 2, 0], tests: ['est2', 3, 0], potencia: ['est2', 3, 1], chicuadrado: ['est2', 5, 1], regresion: ['est2', 6],
  sistemas: ['algebra', 2], transformaciones: ['algebra', 4], markov: ['algebra', 6, 0],
  lineal: ['io', 1, 0], gradiente: ['io', 3],
  nash: ['juegos', 1, 0], dilema: ['juegos', 3, 0],
  caos: ['calc3', 5, 0], fractales: ['calc3', 5, 1], vida: ['calc3', 5, 2]
};
A.tools = [];
A.tool = t => { const p = PLACE[t.id]; if (p) { t.mat = p[0]; t.unit = p[1]; t.ord = p[2] ?? t.ord; } t.reg = A.tools.length; A.tools.push(t); };
A.ordered = () => A.MATS.flatMap(m => A.tools.filter(t => t.mat === m.id).sort((a, b) => a.unit - b.unit || (a.ord ?? 50) - (b.ord ?? 50) || a.reg - b.reg));
A.redraw = {};
A.current = 'inicio';
A.go = id => {
  if (!document.getElementById('v-' + id)) id = 'inicio';
  A.current = id;
  const t = A.tools.find(x => x.id === id), mat = t ? t.mat : id.startsWith('mat-') ? id.slice(4) : null;
  A.$$('[data-view]').forEach(v => v.hidden = v.id !== 'v-' + id);
  A.onRoute && A.onRoute(id, t, mat);
  try { history.replaceState(null, '', '#' + id); } catch (e) {}
  window.scrollTo(0, 0);
  requestAnimationFrame(() => A.redraw[id] && A.redraw[id]());
  A.tools.forEach(x => x.id !== id && x.hide && x.hide());
};
return A;
})();
