/* Asíntota · Cálculo I, II y III: herramientas nuevas */
(() => {
const { $, $$, K, fmt, pct, mkFn } = A;
const f3 = x => fmt(x, 3), f4 = x => fmt(x, 4);
const chips = (id, list) => `<div class="chips" id="${id}">${list.map(s => `<button class="chip" data-fx="${s}">${s}</button>`).join('')}</div>`;
const d1 = (f, x) => { const h = 1e-5 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };
const d2 = (f, x) => { const h = 1e-3 * Math.max(1, Math.abs(x)); return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h); };
const safe = f => x => { try { const v = f(x); return Number.isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
const safe2 = f => (x, y) => { try { const v = f(x, y); return Number.isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
const fnRow = (id, pre, val) => `<div><label class="l" for="${id}">Función</label><div class="fn-in"><span class="pre mono muted">${pre}</span><input class="field" id="${id}" value="${val}" spellcheck="false" autocomplete="off"></div><p class="err" id="${id}-e"></p></div>`;
const fnHelp2 = '<p class="note">Variables x e y. Podés usar <span class="mono">^ sen cos exp ln raiz abs</span>. Decimales con punto.</p>';

/* ---------- Motor 3D mínimo (proyección ortográfica con orden de pintor) ---------- */
const view3 = (w, h, az, el, sc) => {
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el), cx = w / 2, cy = h / 2 + h * .04, s = Math.min(w, h) * sc;
  return (u, v, z) => { const X1 = u * ca - v * sa, Y1 = u * sa + v * ca; return [cx + X1 * s, cy - (z * ce + Y1 * se) * s, Y1 * ce - z * se]; };
};
const hcol = t => { t = A.clamp(t, 0, 1); const S = [[20, 62, 70], [67, 200, 184], [242, 169, 59], [250, 228, 190]], u = t * (S.length - 1), i = Math.min(S.length - 2, Math.floor(u)), f = u - i; return `rgb(${S[i].map((v, k) => Math.round(v + (S[i + 1][k] - v) * f)).join(',')})`; };
const rot3 = (cv, st, draw) => {
  let d = null; cv.style.touchAction = 'none'; cv.style.cursor = 'grab';
  cv.addEventListener('pointerdown', e => { d = [e.clientX, e.clientY, st.az, st.el]; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!d) return; st.az = d[2] + (e.clientX - d[0]) * .01; st.el = A.clamp(d[3] + (e.clientY - d[1]) * .01, -.2, 1.5); draw(); });
  cv.addEventListener('pointerup', () => d = null);
};
const axes3 = (c, P, lab = ['x', 'y', 'z']) => {
  c.strokeStyle = K.faint; c.lineWidth = 1; c.font = '11px ' + A.MONO; c.fillStyle = K.muted;
  [[[-1, -1, -1], [1, -1, -1], lab[0]], [[-1, -1, -1], [-1, 1, -1], lab[1]], [[-1, -1, -1], [-1, -1, 1], lab[2]]].forEach(([a, b, l]) => { const p = P(...a), q = P(...b); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); c.fillText(l, q[0] + 4, q[1]); });
};

/* ================= Límites ================= */
{
  let P, f = null; const st = { a: 0, eps: .2 };
  const est = () => {
    if (!f) return null; const a = st.a, hs = [.1, .01, .001, 1e-4, 1e-5, 1e-6];
    const L = hs.map(h => f(a - h)), R = hs.map(h => f(a + h)), l = L[L.length - 1], r = R[R.length - 1], fa = f(a);
    const tol = 1e-3 * Math.max(1, Math.abs(l), Math.abs(r));
    const infL = Math.abs(l) > 1e5, infR = Math.abs(r) > 1e5, exists = Number.isFinite(l) && Number.isFinite(r) && !infL && !infR && Math.abs(l - r) < tol;
    return { hs, L, R, l, r, fa, exists, lim: exists ? (l + r) / 2 : NaN, infL, infR, cont: exists && Number.isFinite(fa) && Math.abs(fa - (l + r) / 2) < tol };
  };
  const delta = (lim) => { let best = 0; for (let k = 0; k <= 400; k++) { const d = Math.pow(10, 1 - k * .015); let ok = true; for (let i = 1; i <= 120 && ok; i++) { const x = d * i / 120; [st.a - x, st.a + x].forEach(z => { const v = f(z); if (!(Math.abs(v - lim) < st.eps)) ok = false; }); } if (ok) { best = d; break; } } return best; };
  A.tool({
    id: 'limites', mat: 'calc1', unit: 2, name: 'Límites y continuidad', short: 'Límites', tag: 'Límites laterales y ε-δ', f: 'lím x→a f(x) = L',
    desc: 'Acercate a un punto por izquierda y por derecha con una tabla de valores, y visualizá la definición épsilon-delta.',
    lead: 'El límite es el valor al que se acerca f(x) cuando x se acerca a a, sin importar lo que pase exactamente en a. Existe solo si por izquierda y por derecha se llega al mismo número.',
    body: `<div class="bench"><div class="ctrl">${fnRow('lm-f', 'f(x) =', 'sen(x)/x')}${chips('lm-ex', ['sen(x)/x', '(x^2-1)/(x-1)', '1/x', 'abs(x)/x', '(1+x)^(1/x)', 'x*sen(1/x)'])}
      <div class="grid2"><div><label class="l" for="lm-a">Punto a</label><input class="field" id="lm-a" value="0"></div><div><label class="l" for="lm-e">Tolerancia ε</label><input class="field" id="lm-e" value="0,2"></div></div><div id="lm-pill"></div></div>
      <div class="stage"><canvas id="lm-cv" style="height:360px;background:var(--bg)"></canvas><div class="tbl-wrap"><table class="tbl" id="lm-tbl"></table></div><div class="explain" id="lm-exp"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#lm-f').value); f = r.f ? safe(r.f) : null; $('#lm-f-e').textContent = r.err; };
      comp(); $('#lm-f').oninput = () => { comp(); upd(); };
      $$('#lm-ex [data-fx]').forEach(b => b.onclick = () => { $('#lm-f').value = b.dataset.fx; $('#lm-a').value = b.dataset.fx.includes('x-1') ? '1' : '0'; st.a = A.num($('#lm-a').value); comp(); upd(); });
      $('#lm-a').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.a = v; upd(); } };
      $('#lm-e').oninput = e => { const v = A.num(e.target.value); if (v > 0) { st.eps = v; upd(); } };
      P = A.plane($('#lm-cv'), { span: 8, layers }); upd();
    },
    draw: () => P.draw()
  });
  function upd() {
    const r = est(); if (!r) { $('#lm-tbl').innerHTML = ''; $('#lm-exp').innerHTML = ''; P.draw(); return; }
    $('#lm-tbl').innerHTML = `<tr><th>h</th><th>f(a − h)</th><th>f(a + h)</th></tr>` + r.hs.map((h, i) => `<tr><td>${h.toExponential(0).replace('e-', ' × 10⁻').replace(/⁻(\d)/, (m, d) => '⁻' + '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}</td><td>${Number.isFinite(r.L[i]) ? f4(r.L[i]) : 'no definida'}</td><td>${Number.isFinite(r.R[i]) ? f4(r.R[i]) : 'no definida'}</td></tr>`).join('');
    $('#lm-pill').innerHTML = `<span class="pill ${r.exists ? 'ok' : 'bad'}">${r.exists ? 'El límite existe' : 'El límite no existe'}</span> <span class="pill ${r.cont ? 'ok' : 'warn'}">${r.cont ? 'Continua en a' : 'No es continua en a'}</span>`;
    let t;
    if (r.exists) { const dl = delta(r.lim); t = `<p>Por izquierda y por derecha los valores se acercan a <b>L ≈ ${f4(r.lim)}</b>. ${Number.isFinite(r.fa) ? `f(a) = ${f4(r.fa)}${r.cont ? ': coincide con el límite, así que la función es continua.' : ': no coincide, hay una discontinuidad evitable.'}` : 'f(a) no está definida (por ejemplo, 0/0), pero el límite existe igual: es una <b>discontinuidad evitable</b>.'}</p><p style="margin-top:6px"><b>Definición ε-δ:</b> para que f(x) quede a menos de ε = ${fmt(st.eps, 3)} de L (banda horizontal) alcanza con que x esté a menos de <b>δ ≈ ${f4(dl)}</b> de a (banda vertical). El límite existe si para <b>cualquier</b> ε, por chico que sea, encontrás un δ.</p>`; }
    else if (r.infL || r.infR) t = `<p>Los valores crecen sin cota: hay una <b>asíntota vertical</b> en x = ${fmt(st.a, 3)}. ${Math.sign(r.l) !== Math.sign(r.r) ? 'Por un lado va a +∞ y por el otro a −∞.' : ''}</p>`;
    else if (Number.isFinite(r.l) && Number.isFinite(r.r)) t = `<p>Límite por izquierda ≈ ${f4(r.l)} y por derecha ≈ ${f4(r.r)}: son distintos, así que el límite no existe. Es una <b>discontinuidad de salto</b>.</p>`;
    else t = '<p>La función no está definida a uno de los lados del punto, o oscila sin estabilizarse.</p>';
    $('#lm-exp').innerHTML = t; P.draw();
  }
  function layers(a) {
    if (!f) return; const r = est();
    if (r && r.exists) { const dl = delta(r.lim); a.c.fillStyle = 'rgba(242,169,59,.08)'; a.c.fillRect(0, a.PY(r.lim + st.eps), a.w, a.PY(r.lim - st.eps) - a.PY(r.lim + st.eps)); a.c.fillStyle = 'rgba(67,200,184,.10)'; a.c.fillRect(a.PX(st.a - dl), 0, a.PX(st.a + dl) - a.PX(st.a - dl), a.h); }
    a.plot(f, K.fg); a.line(st.a, a.y0, st.a, a.y1, K.faint, 1, [3, 4]);
    if (r && r.exists) { a.c.strokeStyle = K.amber; a.c.lineWidth = 2; a.c.fillStyle = K.bg; a.c.beginPath(); a.c.arc(a.PX(st.a), a.PY(r.lim), 6, 0, 7); a.c.fill(); a.c.stroke(); }
    if (r && Number.isFinite(r.fa)) a.dot(st.a, r.fa, K.amber, 5);
  }
}

/* ================= Análisis completo de funciones ================= */
{
  let P, f = null; const st = { a: -4, b: 4 };
  const analyze = () => {
    if (!f) return null; const N = 4000, xs = Array.from({ length: N + 1 }, (_, i) => st.a + (st.b - st.a) * i / N);
    const find = (g, keep) => { const out = []; for (let i = 0; i < N; i++) { const p = g(xs[i]), q = g(xs[i + 1]); if (Number.isFinite(p) && Number.isFinite(q) && Math.sign(p) !== Math.sign(q) && p !== 0) { let lo = xs[i], hi = xs[i + 1]; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; Math.sign(g(m)) === Math.sign(g(lo)) ? lo = m : hi = m; } const x = (lo + hi) / 2; if (!keep || keep(x)) out.push(x); } } return out; };
    const cont = x => Number.isFinite(f(x)) && Math.abs(f(x)) < 1e6;
    const roots = find(f, cont), crit = find(x => d1(f, x), cont), infl = find(x => d2(f, x), cont);
    const cls = crit.map(x => ({ x, y: f(x), t: d2(f, x) > 1e-6 ? 'mínimo local' : d2(f, x) < -1e-6 ? 'máximo local' : 'punto silla' }));
    let mx = null, mn = null; xs.forEach(x => { const y = f(x); if (!Number.isFinite(y)) return; if (!mx || y > mx.y) mx = { x, y }; if (!mn || y < mn.y) mn = { x, y }; });
    const cuts = [st.a, ...crit, st.b], mono = []; for (let i = 0; i < cuts.length - 1; i++) { const m = (cuts[i] + cuts[i + 1]) / 2, s = d1(f, m); mono.push([cuts[i], cuts[i + 1], s > 0 ? 'crece' : s < 0 ? 'decrece' : '—']); }
    const cuts2 = [st.a, ...infl, st.b], conc = []; for (let i = 0; i < cuts2.length - 1; i++) { const m = (cuts2[i] + cuts2[i + 1]) / 2, s = d2(f, m); conc.push([cuts2[i], cuts2[i + 1], s > 0 ? 'cóncava hacia arriba (∪)' : s < 0 ? 'cóncava hacia abajo (∩)' : '—']); }
    return { roots, cls, infl, mx, mn, mono, conc };
  };
  A.tool({
    id: 'curvas', mat: 'calc1', unit: 4, name: 'Análisis completo de funciones', short: 'Análisis de funciones', tag: 'Crecimiento, extremos y concavidad', f: "f'(x) = 0 y f''(x) ≷ 0",
    desc: 'Raíces, puntos críticos, máximos y mínimos, puntos de inflexión, intervalos de crecimiento y de concavidad, todo automático.',
    lead: 'Es el clásico ejercicio de parcial: estudiar una función completa. La derivada primera dice dónde crece y dónde están los extremos; la segunda, hacia dónde se curva y dónde cambia la curvatura.',
    body: `<div class="bench"><div class="ctrl">${fnRow('cu-f', 'f(x) =', 'x^3 - 3x^2 - 9x + 5')}${chips('cu-ex', ['x^3 - 3x^2 - 9x + 5', 'x^4 - 4x^2', 'x*e^(-x)', 'sen(x) + x/2', 'x^2/(x^2+1)', 'ln(x^2+1) - x/3'])}
      <div class="grid2"><div><label class="l" for="cu-a">Desde</label><input class="field" id="cu-a" value="-4"></div><div><label class="l" for="cu-b">Hasta</label><input class="field" id="cu-b" value="6"></div></div></div>
      <div class="stage"><canvas id="cu-cv" style="height:380px;background:var(--bg)"></canvas>${A.legend([['fg', 'f(x)'], ['teal', "f'(x)"], ['violet', "f''(x)"], ['amber', 'Extremos'], ['rose', 'Inflexiones']])}<div class="steplist" id="cu-out"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#cu-f').value); f = r.f ? safe(r.f) : null; $('#cu-f-e').textContent = r.err; };
      comp(); st.b = 6; $('#cu-f').oninput = () => { comp(); upd(); };
      $$('#cu-ex [data-fx]').forEach(b => b.onclick = () => { $('#cu-f').value = b.dataset.fx; comp(); upd(); });
      ['a', 'b'].forEach(k => $('#cu-' + k).oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st[k] = v; if (st.b > st.a) upd(); } });
      P = A.plane($('#cu-cv'), { span: 12, cx: 1, cy: 0, layers }); upd();
    },
    draw: () => P.draw()
  });
  function upd() {
    const r = analyze(); if (!r) { $('#cu-out').innerHTML = ''; P.draw(); return; }
    const L = (arr, fn) => arr.length ? arr.map(fn).join(', ') : 'ninguno';
    $('#cu-out').innerHTML = A.steps([
      `<b>Raíces</b> (f(x) = 0): ${L(r.roots, x => 'x = ' + f3(x))}.`,
      `<b>Puntos críticos</b> (f'(x) = 0) y su tipo según f'': ${L(r.cls, p => `x = ${f3(p.x)} → <b>${p.t}</b> (f = ${f3(p.y)})`)}.`,
      `<b>Crecimiento:</b> ${r.mono.map(([a, b, t]) => `(${f3(a)}; ${f3(b)}) ${t}`).join(' · ')}.`,
      `<b>Puntos de inflexión</b> (f'' cambia de signo): ${L(r.infl, x => `x = ${f3(x)}`)}.`,
      `<b>Concavidad:</b> ${r.conc.map(([a, b, t]) => `(${f3(a)}; ${f3(b)}) ${t}`).join(' · ')}.`,
      `<b>Extremos absolutos en [${f3(st.a)}; ${f3(st.b)}]:</b> máximo ${r.mx ? `${f3(r.mx.y)} en x = ${f3(r.mx.x)}` : '—'}, mínimo ${r.mn ? `${f3(r.mn.y)} en x = ${f3(r.mn.x)}` : '—'}. Ojo: pueden estar en los bordes del intervalo, no solo en los puntos críticos.`]);
    P.draw();
  }
  function layers(a) {
    if (!f) return; a.c.fillStyle = 'rgba(67,200,184,.05)'; a.c.fillRect(a.PX(st.a), 0, a.PX(st.b) - a.PX(st.a), a.h);
    a.plot(x => d2(f, x), K.violet, 1.2, [3, 4]); a.plot(x => d1(f, x), K.teal, 1.4, [6, 4]); a.plot(f, K.fg, 2.4);
    const r = analyze(); if (!r) return; r.roots.forEach(x => a.dot(x, 0, K.muted, 4)); r.cls.forEach(p => a.dot(p.x, p.y, K.amber, 6)); r.infl.forEach(x => a.dot(x, f(x), K.rose, 5));
  }
}

/* ================= Métodos numéricos para raíces ================= */
{
  let P, f = null; const st = { x0: 2, x1: 1, m: 'newton', it: [] };
  A.tool({
    id: 'newton', mat: 'calc1', unit: 4, name: 'Raíces: Newton-Raphson, bisección y secante', short: 'Newton-Raphson', tag: 'Métodos numéricos', f: 'xₙ₊₁ = xₙ − f(xₙ)/f′(xₙ)',
    desc: 'Encontrá dónde una función vale cero con tres métodos y compará qué tan rápido converge cada uno.',
    lead: 'Muchas ecuaciones no se pueden despejar a mano (por ejemplo cos(x) = x). Los métodos numéricos arrancan de un valor inicial y lo mejoran paso a paso. Newton usa la recta tangente; bisección parte el intervalo a la mitad; la secante aproxima la tangente con dos puntos.',
    body: `<div class="bench"><div class="ctrl">${fnRow('nw-f', 'f(x) =', 'x^2 - 2')}${chips('nw-ex', ['x^2 - 2', 'cos(x) - x', 'x^3 - 2x - 5', 'e^x - 3x', 'x^3 - x + 1'])}
      <div><label class="l">Método</label>${A.seg('nw-m', [['newton', 'Newton'], ['bis', 'Bisección'], ['sec', 'Secante']], 'newton')}</div>
      <div class="grid2"><div><label class="l" for="nw-x0" id="nw-l0">Valor inicial x₀</label><input class="field" id="nw-x0" value="2"></div><div id="nw-w1" hidden><label class="l" for="nw-x1" id="nw-l1">Segundo punto</label><input class="field" id="nw-x1" value="1"></div></div><dl class="stats" id="nw-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="nw-cv" style="height:340px;background:var(--bg)"></canvas><div class="tbl-wrap" style="max-height:300px;overflow-y:auto"><table class="tbl" id="nw-tbl"></table></div><div class="explain" id="nw-exp"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#nw-f').value); f = r.f ? safe(r.f) : null; $('#nw-f-e').textContent = r.err; };
      comp(); $('#nw-f').oninput = () => { comp(); upd(); };
      $$('#nw-ex [data-fx]').forEach(b => b.onclick = () => { $('#nw-f').value = b.dataset.fx; comp(); upd(); });
      A.segBind('nw-m', v => { st.m = v; upd(); });
      $('#nw-x0').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.x0 = v; upd(); } };
      $('#nw-x1').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.x1 = v; upd(); } };
      P = A.plane($('#nw-cv'), { span: 8, cx: 1, layers, grab: (a, px, py) => Math.hypot(px - a.PX(st.x0), py - a.PY(0)) < 14 ? { move: (mx, my, b) => { st.x0 = +b.WX(mx).toFixed(3); $('#nw-x0').value = String(st.x0).replace('.', ','); upd(); } } : null }); upd();
    },
    draw: () => P.draw()
  });
  function run() {
    const it = []; if (!f) return it;
    if (st.m === 'newton') { let x = st.x0; for (let k = 0; k < 30; k++) { const y = f(x), d = d1(f, x); it.push({ x, y, d }); if (!Number.isFinite(y) || Math.abs(y) < 1e-12 || !d) break; const nx = x - y / d; if (Math.abs(nx - x) < 1e-14) break; x = nx; if (Math.abs(x) > 1e8) break; } }
    else if (st.m === 'bis') { let a = Math.min(st.x0, st.x1), b = Math.max(st.x0, st.x1); if (Math.sign(f(a)) === Math.sign(f(b))) return null; for (let k = 0; k < 40; k++) { const m = (a + b) / 2, y = f(m); it.push({ x: m, y, a, b }); if (Math.abs(y) < 1e-12 || b - a < 1e-12) break; Math.sign(y) === Math.sign(f(a)) ? a = m : b = m; } }
    else { let p = st.x1, x = st.x0; for (let k = 0; k < 30; k++) { const y = f(x), yp = f(p); it.push({ x, y, p }); if (Math.abs(y) < 1e-12 || y === yp) break; const nx = x - y * (x - p) / (y - yp); p = x; x = nx; if (!Number.isFinite(x)) break; } }
    return it;
  }
  function upd() {
    $('#nw-w1').hidden = st.m === 'newton'; $('#nw-l0').textContent = st.m === 'bis' ? 'Extremo a' : 'Valor inicial x₀'; $('#nw-l1').textContent = st.m === 'bis' ? 'Extremo b' : 'Valor anterior x₋₁';
    const it = run(); st.it = it || [];
    if (!it) { $('#nw-tbl').innerHTML = ''; $('#nw-st').innerHTML = ''; $('#nw-exp').innerHTML = '<p>Para bisección f(a) y f(b) tienen que tener signos opuestos (así hay seguro una raíz en el medio). Elegí otro intervalo.</p>'; P.draw(); return; }
    const last = it[it.length - 1], ok = last && Math.abs(last.y) < 1e-9;
    $('#nw-st').innerHTML = A.stats([['Raíz aproximada', last ? fmt(last.x, 10) : '—'], ['Iteraciones', it.length], ['f(raíz)', last ? last.y.toExponential(2).replace('.', ',') : '—']]);
    $('#nw-tbl').innerHTML = `<tr><th>n</th><th>xₙ</th><th>f(xₙ)</th><th>Error |xₙ − xₙ₋₁|</th></tr>` + it.map((r, i) => `<tr><td>${i}</td><td>${fmt(r.x, 10)}</td><td>${r.y.toExponential(3).replace('.', ',')}</td><td>${i ? Math.abs(r.x - it[i - 1].x).toExponential(2).replace('.', ',') : '—'}</td></tr>`).join('');
    $('#nw-exp').innerHTML = `<p>${!ok ? '<b>No convergió.</b> Probá con otro valor inicial: Newton puede diverger o quedar oscilando si arrancás lejos o cerca de donde la derivada es cero.' : st.m === 'newton' ? `Newton converge <b>cuadráticamente</b>: cerca de la raíz, la cantidad de decimales correctos más o menos se duplica en cada paso (mirá la columna de error). Llegó en ${it.length} pasos.` : st.m === 'bis' ? `Bisección es lenta pero segura: cada paso divide el error a la mitad, así que gana un decimal cada ~3,3 pasos. Necesitó ${it.length}.` : `La secante converge con orden ≈ 1,618 (el número de oro): casi tan rápido como Newton, sin necesitar la derivada. Llegó en ${it.length} pasos.`}</p>`;
    P.draw();
  }
  function layers(a) {
    if (!f) return; a.plot(f, K.fg);
    st.it.slice(0, 8).forEach((r, i) => {
      const al = Math.max(.25, 1 - i * .12);
      if (st.m === 'newton' && r.d) { a.c.globalAlpha = al; a.line(r.x, r.y, r.x - r.y / r.d, 0, K.amber, 1.4); a.line(r.x, 0, r.x, r.y, K.faint, 1, [2, 3]); a.c.globalAlpha = 1; }
      if (st.m === 'sec' && r.p !== undefined) { a.c.globalAlpha = al; a.line(r.p, f(r.p), r.x, r.y, K.amber, 1.4); a.c.globalAlpha = 1; }
      if (st.m === 'bis' && r.a !== undefined) { a.c.fillStyle = `rgba(67,200,184,${.06 + i * .02})`; a.c.fillRect(a.PX(r.a), a.PY(0) - 6 - i * 3, a.PX(r.b) - a.PX(r.a), 3); }
      a.dot(r.x, r.y, K.amber, 3.5);
    });
    a.dot(st.x0, 0, K.teal, 6); const L = st.it[st.it.length - 1]; if (L) a.dot(L.x, 0, K.rose, 5);
  }
}

/* ================= Superficies y curvas de nivel ================= */
{
  let f = null; const st = { az: -.7, el: .55, R: 3, pos: false };
  A.tool({
    id: 'superficies', mat: 'calc2', unit: 1, name: 'Superficies y curvas de nivel', short: 'Superficies', tag: 'Funciones de dos variables', f: 'z = f(x, y)',
    desc: 'Graficá funciones de dos variables en 3D (arrastrá para girarla) y mirá sus curvas de nivel en el plano.',
    lead: 'Una función de dos variables es una superficie, como un terreno. Las curvas de nivel son las líneas de igual altura, como en un mapa topográfico. En economía son las curvas de indiferencia o las isocuantas.',
    body: `<div class="bench"><div class="ctrl">${fnRow('sf-f', 'f(x, y) =', 'sen(x)*cos(y)')}${chips('sf-ex', ['sen(x)*cos(y)', 'x^2 + y^2', 'x^2 - y^2', 'e^(-(x^2+y^2))', 'x*y', 'x^0.5*y^0.5'])}${fnHelp2}
      <div><label class="l" for="sf-R">Rango ±<span id="sf-Rv" style="color:var(--fg)">3</span></label><input type="range" id="sf-R" min="1" max="8" step=".5" value="3"></div>
      <label class="check"><input type="checkbox" id="sf-pos"> Solo valores positivos (útil para Cobb-Douglas)</label></div>
      <div class="stage"><div class="grid2"><div><h3>Superficie (arrastrá para girar)</h3><canvas id="sf-3d" style="height:360px"></canvas></div><div><h3>Curvas de nivel</h3><canvas id="sf-ct" style="height:360px"></canvas></div></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#sf-f').value, ['x', 'y']); f = r.f ? safe2(r.f) : null; $('#sf-f-e').textContent = r.err; };
      comp(); $('#sf-f').oninput = () => { comp(); draw(); };
      $$('#sf-ex [data-fx]').forEach(b => b.onclick = () => { $('#sf-f').value = b.dataset.fx; st.pos = b.dataset.fx.includes('0.5'); $('#sf-pos').checked = st.pos; comp(); draw(); });
      $('#sf-R').oninput = e => { st.R = +e.target.value; $('#sf-Rv').textContent = fmt(st.R, 1); draw(); };
      $('#sf-pos').onchange = e => { st.pos = e.target.checked; draw(); };
      rot3($('#sf-3d'), st, draw);
    },
    draw
  });
  const dom = () => st.pos ? [0, st.R] : [-st.R, st.R];
  function grid(N) { const [lo, hi] = dom(), z = []; let zl = Infinity, zh = -Infinity; for (let i = 0; i <= N; i++) { z.push([]); for (let j = 0; j <= N; j++) { const v = f(lo + (hi - lo) * i / N, lo + (hi - lo) * j / N); z[i].push(v); if (Number.isFinite(v)) { zl = Math.min(zl, v); zh = Math.max(zh, v); } } } if (zh - zl < 1e-9) { zh += 1; zl -= 1; } return { z, zl, zh, lo, hi }; }
  function draw() {
    if (!f) return; const N = 34, G = grid(N);
    { const { c, w, h } = A.canv($('#sf-3d')); if (w < 2) return; const Pp = view3(w, h, st.az, st.el, .33); axes3(c, Pp);
      const nz = v => 2 * (v - G.zl) / (G.zh - G.zl) - 1, quads = [];
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const zs = [G.z[i][j], G.z[i + 1][j], G.z[i + 1][j + 1], G.z[i][j + 1]]; if (!zs.every(Number.isFinite)) continue; const uv = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b], k) => Pp(2 * a / N - 1, 2 * b / N - 1, nz(zs[k]))); quads.push({ pts: uv, d: uv.reduce((s, p) => s + p[2], 0) / 4, t: (zs.reduce((s, v) => s + v, 0) / 4 - G.zl) / (G.zh - G.zl) }); }
      quads.sort((a, b) => b.d - a.d); c.lineWidth = .5; c.strokeStyle = 'rgba(11,12,16,.45)';
      quads.forEach(q => { c.fillStyle = hcol(q.t); c.beginPath(); q.pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke(); }); }
    contour($('#sf-ct'), f, dom(), dom(), 14);
  }
  A.contour = contour;
  function contour(cv, fx, xr, yr, levels, extra) {
    const { c, w, h } = A.canv(cv); if (w < 2) return null;
    const S2 = Math.min(w, h) - 40, L = (w - S2) / 2 + 10, T = 8, X = x => L + (x - xr[0]) / (xr[1] - xr[0]) * S2, Y = y => T + S2 - (y - yr[0]) / (yr[1] - yr[0]) * S2;
    const N = 90, z = []; let zl = Infinity, zh = -Infinity;
    for (let i = 0; i <= N; i++) { z.push([]); for (let j = 0; j <= N; j++) { const v = fx(xr[0] + (xr[1] - xr[0]) * i / N, yr[0] + (yr[1] - yr[0]) * j / N); z[i].push(v); if (Number.isFinite(v)) { zl = Math.min(zl, v); zh = Math.max(zh, v); } } }
    const cw = S2 / N; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const v = z[i][j]; if (!Number.isFinite(v)) continue; c.fillStyle = hcol((v - zl) / (zh - zl || 1)); c.globalAlpha = .28; c.fillRect(L + i * cw, T + S2 - (j + 1) * cw, cw + .6, cw + .6); }
    c.globalAlpha = 1; c.lineWidth = 1.2;
    for (let k = 1; k < levels; k++) {
      const lv = zl + (zh - zl) * k / levels; c.strokeStyle = hcol(k / levels); c.beginPath();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const a = z[i][j], b = z[i + 1][j], cc = z[i + 1][j + 1], d = z[i][j + 1]; if (![a, b, cc, d].every(Number.isFinite)) continue;
        const pts = [], E = (p, q, x1, y1, x2, y2) => { if ((p - lv) * (q - lv) < 0) { const t = (lv - p) / (q - p); pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); } };
        E(a, b, i, j, i + 1, j); E(b, cc, i + 1, j, i + 1, j + 1); E(cc, d, i + 1, j + 1, i, j + 1); E(d, a, i, j + 1, i, j);
        for (let m = 0; m + 1 < pts.length; m += 2) { c.moveTo(L + pts[m][0] * cw, T + S2 - pts[m][1] * cw); c.lineTo(L + pts[m + 1][0] * cw, T + S2 - pts[m + 1][1] * cw); }
      }
      c.stroke();
    }
    c.strokeStyle = K.line; c.strokeRect(L + .5, T + .5, S2, S2);
    c.font = '11px ' + A.MONO; c.fillStyle = K.muted; c.textAlign = 'center'; c.textBaseline = 'top';
    [xr[0], (xr[0] + xr[1]) / 2, xr[1]].forEach(v => c.fillText(fmt(v, 1), X(v), T + S2 + 6));
    c.textAlign = 'right'; c.textBaseline = 'middle'; [yr[0], (yr[0] + yr[1]) / 2, yr[1]].forEach(v => c.fillText(fmt(v, 1), L - 6, Y(v)));
    const g = { c, X, Y, S2, L, T, WX: px => xr[0] + (px - L) / S2 * (xr[1] - xr[0]), WY: py => yr[0] + (T + S2 - py) / S2 * (yr[1] - yr[0]) };
    extra && extra(g); return g;
  }
}

/* ================= Derivadas parciales y gradiente ================= */
{
  let f = null, G = null; const st = { x: 1, y: .5, ang: 45 };
  const grad = (x, y) => { const h = 1e-5; return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)]; };
  A.tool({
    id: 'parciales', mat: 'calc2', unit: 2, name: 'Derivadas parciales, gradiente y derivada direccional', short: 'Gradiente', tag: 'Derivadas parciales', f: '∇f = (∂f/∂x, ∂f/∂y)',
    desc: 'Tocá un punto del mapa y obtené las derivadas parciales, el vector gradiente, la derivada en cualquier dirección y el plano tangente.',
    lead: 'La derivada parcial respecto de x mide cómo cambia f si movés solo x. El gradiente junta las dos parciales en un vector que apunta hacia donde la función sube más rápido, y siempre es perpendicular a la curva de nivel.',
    body: `<div class="bench"><div class="ctrl">${fnRow('pd-f', 'f(x, y) =', 'x^2 + 3*y^2')}${chips('pd-ex', ['x^2 + 3*y^2', 'x*y', 'sen(x)*cos(y)', 'x^2*y - y^3/3', 'e^(-(x^2+y^2))'])}${fnHelp2}
      <div><label class="l" for="pd-a">Dirección para la derivada direccional: <span id="pd-av" style="color:var(--fg)">45</span>°</label><input type="range" id="pd-a" min="0" max="359" value="45"></div><dl class="stats" id="pd-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="pd-cv" style="height:440px;cursor:crosshair;touch-action:none"></canvas>${A.legend([['amber', 'Gradiente en el punto'], ['teal', 'Dirección elegida'], ['faint', 'Campo de gradientes']])}<div class="steplist" id="pd-steps"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#pd-f').value, ['x', 'y']); f = r.f ? safe2(r.f) : null; $('#pd-f-e').textContent = r.err; };
      comp(); $('#pd-f').oninput = () => { comp(); upd(); };
      $$('#pd-ex [data-fx]').forEach(b => b.onclick = () => { $('#pd-f').value = b.dataset.fx; comp(); upd(); });
      $('#pd-a').oninput = e => { st.ang = +e.target.value; $('#pd-av').textContent = st.ang; upd(); };
      const cv = $('#pd-cv'); let drag = false;
      const pick = e => { if (!G) return; const r = cv.getBoundingClientRect(); const x = G.WX(e.clientX - r.left), y = G.WY(e.clientY - r.top); if (Math.abs(x) <= 3 && Math.abs(y) <= 3) { st.x = x; st.y = y; upd(); } };
      cv.addEventListener('pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); pick(e); });
      cv.addEventListener('pointermove', e => drag && pick(e)); cv.addEventListener('pointerup', () => drag = false);
      upd();
    },
    draw
  });
  function upd() {
    if (!f) return; const [gx, gy] = grad(st.x, st.y), z = f(st.x, st.y), th = st.ang * Math.PI / 180, u = [Math.cos(th), Math.sin(th)], dd = gx * u[0] + gy * u[1], gn = Math.hypot(gx, gy);
    $('#pd-st').innerHTML = A.stats([['Punto', `(${f3(st.x)}; ${f3(st.y)})`], ['f', f3(z)], ['∂f/∂x', f3(gx)], ['∂f/∂y', f3(gy)], ['|∇f|', f3(gn)], ['Derivada direccional', f3(dd)]]);
    $('#pd-steps').innerHTML = A.steps([
      `∂f/∂x = ${f3(gx)}: si movés x un poquito (dejando y quieta), f cambia ${f3(gx)} veces ese movimiento. ∂f/∂y = ${f3(gy)}, igual pero moviendo y.`,
      `Gradiente ∇f = (${f3(gx)}; ${f3(gy)}). Apunta a la dirección de máximo crecimiento, y la pendiente en esa dirección es |∇f| = <b>${f3(gn)}</b>.`,
      `Derivada direccional en ${st.ang}°: D<sub>u</sub>f = ∇f · u = ${f3(gx)}×${f3(u[0])} + ${f3(gy)}×${f3(u[1])} = <b>${f3(dd)}</b>. Es máxima en la dirección del gradiente y cero en la dirección de la curva de nivel.`,
      `Plano tangente: z = ${f3(z)} + ${f3(gx)}(x − ${f3(st.x)}) + ${f3(gy)}(y − ${f3(st.y)}). Cerca del punto, la superficie se parece a ese plano (aproximación lineal).`]);
    draw();
  }
  function draw() {
    if (!f) return;
    G = A.contour($('#pd-cv'), f, [-3, 3], [-3, 3], 16, g => {
      const c = g.c; c.strokeStyle = 'rgba(141,147,167,.45)'; c.lineWidth = 1;
      for (let i = -2.75; i <= 2.75; i += .5) for (let j = -2.75; j <= 2.75; j += .5) { const [a, b] = grad(i, j), n = Math.hypot(a, b); if (!n || !Number.isFinite(n)) continue; const L = 12, x0 = g.X(i), y0 = g.Y(j), x1 = x0 + a / n * L, y1 = y0 - b / n * L; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.beginPath(); c.arc(x1, y1, 1.5, 0, 7); c.fillStyle = 'rgba(141,147,167,.6)'; c.fill(); }
      const [gx, gy] = grad(st.x, st.y), n = Math.hypot(gx, gy), px = g.X(st.x), py = g.Y(st.y), arr = (dx, dy, col) => { const ex = px + dx, ey = py - dy, an = Math.atan2(-dy, dx); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.6; c.beginPath(); c.moveTo(px, py); c.lineTo(ex, ey); c.stroke(); c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex - 10 * Math.cos(an - .4), ey - 10 * Math.sin(an - .4)); c.lineTo(ex - 10 * Math.cos(an + .4), ey - 10 * Math.sin(an + .4)); c.closePath(); c.fill(); };
      const th = st.ang * Math.PI / 180; arr(Math.cos(th) * 55, Math.sin(th) * 55, K.teal); if (n) arr(gx / n * 70, gy / n * 70, K.amber);
      c.fillStyle = K.fg; c.beginPath(); c.arc(px, py, 6, 0, 7); c.fill();
    });
  }
}

/* ================= Puntos críticos y matriz hessiana ================= */
{
  let f = null, crit = [];
  A.tool({
    id: 'hessiano', mat: 'calc2', unit: 3, name: 'Optimización libre: puntos críticos y hessiano', short: 'Hessiano', tag: 'Máximos, mínimos y sillas', f: 'det H = fxx·fyy − fxy²',
    desc: 'Encuentra todos los puntos críticos de f(x, y) y los clasifica en máximos, mínimos o puntos silla con la matriz hessiana.',
    lead: 'En dos variables, un candidato a extremo es donde las dos derivadas parciales valen cero. Para saber si es máximo, mínimo o silla se mira la matriz de segundas derivadas (hessiana): su determinante y el signo de fxx.',
    body: `<div class="bench"><div class="ctrl">${fnRow('hs-f', 'f(x, y) =', 'x^3 - 3x + y^2')}${chips('hs-ex', ['x^3 - 3x + y^2', 'x^4 + y^4 - 4*x*y', 'x^2 - y^2', 'sen(x)*sen(y)', 'x*y*e^(-(x^2+y^2)/2)'])}${fnHelp2}</div>
      <div class="stage"><canvas id="hs-cv" style="height:420px"></canvas>${A.legend([['amber', 'Mínimo'], ['rose', 'Máximo'], ['teal', 'Punto silla'], ['faint', 'No concluyente']])}<div class="tbl-wrap"><table class="tbl" id="hs-tbl"></table></div><div class="explain"><p><b>Criterio:</b> si det H &gt; 0 y fxx &gt; 0 → mínimo local. Si det H &gt; 0 y fxx &lt; 0 → máximo local. Si det H &lt; 0 → punto silla (sube en una dirección y baja en otra, como una montura de caballo). Si det H = 0, el criterio no decide.</p></div></div></div>`,
    init() { const comp = () => { const r = mkFn($('#hs-f').value, ['x', 'y']); f = r.f ? safe2(r.f) : null; $('#hs-f-e').textContent = r.err; }; comp(); $('#hs-f').oninput = () => { comp(); solve(); }; $$('#hs-ex [data-fx]').forEach(b => b.onclick = () => { $('#hs-f').value = b.dataset.fx; comp(); solve(); }); solve(); },
    draw
  });
  const H = (x, y) => { const h = 1e-3; return { fx: (f(x + h, y) - f(x - h, y)) / (2 * h), fy: (f(x, y + h) - f(x, y - h)) / (2 * h), fxx: (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h), fyy: (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h), fxy: (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h) }; };
  function solve() {
    crit = []; if (!f) { $('#hs-tbl').innerHTML = ''; draw(); return; }
    for (let i = -3; i <= 3; i += .5) for (let j = -3; j <= 3; j += .5) {
      let x = i, y = j; for (let k = 0; k < 40; k++) { const d = H(x, y), det = d.fxx * d.fyy - d.fxy * d.fxy; if (!Number.isFinite(det) || Math.abs(det) < 1e-10) break; const dx = (d.fyy * d.fx - d.fxy * d.fy) / det, dy = (-d.fxy * d.fx + d.fxx * d.fy) / det; x -= dx; y -= dy; if (Math.abs(dx) + Math.abs(dy) < 1e-10) break; }
      const d = H(x, y); if (Math.abs(x) <= 3.05 && Math.abs(y) <= 3.05 && Math.hypot(d.fx, d.fy) < 1e-5 && !crit.some(p => Math.hypot(p.x - x, p.y - y) < 1e-3)) crit.push({ x, y, ...d, det: d.fxx * d.fyy - d.fxy * d.fxy, z: f(x, y) });
    }
    crit.sort((a, b) => a.x - b.x || a.y - b.y);
    crit.forEach(p => p.t = p.det > 1e-6 ? (p.fxx > 0 ? 'Mínimo local' : 'Máximo local') : p.det < -1e-6 ? 'Punto silla' : 'No concluyente');
    $('#hs-tbl').innerHTML = crit.length ? `<tr><th>Punto (x; y)</th><th>f</th><th>fxx</th><th>fyy</th><th>fxy</th><th>det H</th><th>Tipo</th></tr>` + crit.slice(0, 20).map(p => `<tr><td>(${f3(p.x)}; ${f3(p.y)})</td><td>${f3(p.z)}</td><td>${f3(p.fxx)}</td><td>${f3(p.fyy)}</td><td>${f3(p.fxy)}</td><td>${f3(p.det)}</td><td>${p.t}</td></tr>`).join('') : '<tr><td>No hay puntos críticos en el cuadrado [−3, 3] × [−3, 3].</td></tr>';
    draw();
  }
  function draw() {
    if (!f) return; const col = { 'Mínimo local': K.amber, 'Máximo local': K.rose, 'Punto silla': K.teal, 'No concluyente': K.faint };
    A.contour($('#hs-cv'), f, [-3, 3], [-3, 3], 18, g => crit.forEach(p => { g.c.fillStyle = col[p.t]; g.c.beginPath(); g.c.arc(g.X(p.x), g.Y(p.y), 7, 0, 7); g.c.fill(); g.c.strokeStyle = K.bg; g.c.lineWidth = 2; g.c.stroke(); }));
  }
}

/* ================= Multiplicadores de Lagrange ================= */
{
  let f = null, sol = null; const st = { kind: 'lin', a: 2, b: 1, c: 12, r: 2 };
  const PRE = { cd: ['x^0.5*y^0.5', 'lin', [2, 1, 12]], cd2: ['x^0.3*y^0.7', 'lin', [1, 3, 30]], xy: ['x*y', 'circ', [2]], lin: ['3*x + 4*y', 'circ', [5]] };
  A.tool({
    id: 'lagrange', mat: 'calc2', unit: 3, name: 'Optimización con restricciones: Lagrange', short: 'Lagrange', tag: 'Multiplicadores de Lagrange', f: '∇f = λ·∇g',
    desc: 'Maximizá una función sujeta a una restricción y mirá la tangencia entre la curva de nivel y la restricción. Con interpretación económica de λ.',
    lead: 'Para maximizar f(x, y) sobre una restricción g(x, y) = c, el óptimo está donde una curva de nivel de f toca a la restricción sin cruzarla: ahí los gradientes son paralelos, ∇f = λ·∇g. Es exactamente el problema del consumidor.',
    body: `<div class="bench"><div class="ctrl">${fnRow('lag-f', 'f(x, y) =', 'x^0.5*y^0.5')}
      <div><label class="l">Ejemplos</label><div class="chips"><button class="chip" data-lag="cd">Utilidad Cobb-Douglas con presupuesto</button><button class="chip" data-lag="cd2">Cobb-Douglas asimétrica</button><button class="chip" data-lag="xy">x·y sobre un círculo</button><button class="chip" data-lag="lin">3x + 4y sobre un círculo</button></div></div>
      <div><label class="l">Restricción</label>${A.seg('lag-k', [['lin', 'a·x + b·y = c'], ['circ', 'x² + y² = r²']], 'lin')}</div>
      <div class="grid3" id="lag-lin"><div><label class="l" for="lag-a">a</label><input class="field" id="lag-a" value="2"></div><div><label class="l" for="lag-b">b</label><input class="field" id="lag-b" value="1"></div><div><label class="l" for="lag-c">c</label><input class="field" id="lag-c" value="12"></div></div>
      <div id="lag-circ" hidden><label class="l" for="lag-r">Radio r</label><input class="field" id="lag-r" value="2"></div>${fnHelp2}</div>
      <div class="stage"><canvas id="lag-cv" style="height:420px"></canvas>${A.legend([['rose', 'Restricción'], ['amber', 'Curva de nivel óptima'], ['fg', 'Óptimo']])}<dl class="stats" id="lag-st" style="margin:0"></dl><div class="steplist" id="lag-steps"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#lag-f').value, ['x', 'y']); f = r.f ? safe2(r.f) : null; $('#lag-f-e').textContent = r.err; };
      comp(); $('#lag-f').oninput = () => { comp(); solve(); };
      A.segBind('lag-k', v => { st.kind = v; solve(); });
      ['a', 'b', 'c', 'r'].forEach(k => $('#lag-' + k).oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st[k] = v; solve(); } });
      $$('[data-lag]').forEach(b => b.onclick = () => { const [fx, kd, ps] = PRE[b.dataset.lag]; $('#lag-f').value = fx; st.kind = kd; $$('#lag-k button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === kd)); if (kd === 'lin') [st.a, st.b, st.c] = ps; else st.r = ps[0]; ['a', 'b', 'c', 'r'].forEach(k => $('#lag-' + k).value = String(st[k]).replace('.', ',')); comp(); solve(); });
      solve();
    },
    draw
  });
  const curve = t => st.kind === 'lin' ? [t, (st.c - st.a * t) / st.b] : [st.r * Math.cos(t), st.r * Math.sin(t)];
  const tRange = () => { if (st.kind === 'circ') return [0, 2 * Math.PI]; const xmax = st.c / st.a; return f && $('#lag-f').value.includes('^0.') ? [1e-6, xmax - 1e-6] : [-2 * Math.abs(xmax) - 5, 2 * Math.abs(xmax) + 5]; };
  function solve() {
    $('#lag-lin').hidden = st.kind !== 'lin'; $('#lag-circ').hidden = st.kind !== 'circ'; sol = null;
    if (!f || (st.kind === 'lin' && (!st.b || !st.a)) || (st.kind === 'circ' && !(st.r > 0))) { $('#lag-st').innerHTML = ''; $('#lag-steps').innerHTML = ''; draw(); return; }
    const [t0, t1] = tRange(); let best = null;
    for (let i = 0; i <= 4000; i++) { const t = t0 + (t1 - t0) * i / 4000, [x, y] = curve(t), v = f(x, y); if (Number.isFinite(v) && (!best || v > best.v)) best = { t, v }; }
    if (!best) { $('#lag-steps').innerHTML = '<p class="err">La función no está definida sobre la restricción.</p>'; draw(); return; }
    let lo = best.t - (t1 - t0) / 4000, hi = best.t + (t1 - t0) / 4000; for (let k = 0; k < 80; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; f(...curve(m1)) < f(...curve(m2)) ? lo = m1 : hi = m2; }
    const [x, y] = curve((lo + hi) / 2), v = f(x, y), h = 1e-5, fx = (f(x + h, y) - f(x - h, y)) / (2 * h), fy = (f(x, y + h) - f(x, y - h)) / (2 * h);
    const gx = st.kind === 'lin' ? st.a : 2 * x, gy = st.kind === 'lin' ? st.b : 2 * y, lam = Math.abs(gx) > Math.abs(gy) ? fx / gx : fy / gy;
    const unb = st.kind === 'lin' && !$('#lag-f').value.includes('^0.') && (Math.abs((lo + hi) / 2 - t0) < 1e-3 || Math.abs((lo + hi) / 2 - t1) < 1e-3);
    sol = { x, y, v, fx, fy, gx, gy, lam, unb };
    $('#lag-st').innerHTML = A.stats([['x*', f3(x)], ['y*', f3(y)], ['f máxima', f3(v)], ['λ', f3(lam)]]);
    const gs = st.kind === 'lin' ? `${fmt(st.a, 3)}x + ${fmt(st.b, 3)}y = ${fmt(st.c, 3)}` : `x² + y² = ${fmt(st.r * st.r, 3)}`;
    $('#lag-steps').innerHTML = unb ? '<p class="err">Sobre esta restricción la función crece sin límite: no hay máximo.</p>' : A.steps([
      `Lagrangiano: ℒ = f(x, y) − λ·(${gs.replace(' = ', ' − ')}).`,
      `Condiciones: ∂ℒ/∂x = 0 → f<sub>x</sub> = λ·g<sub>x</sub>; ∂ℒ/∂y = 0 → f<sub>y</sub> = λ·g<sub>y</sub>; y la restricción ${gs}.`,
      `En el óptimo: f<sub>x</sub> = ${f3(fx)}, f<sub>y</sub> = ${f3(fy)}; g<sub>x</sub> = ${f3(gx)}, g<sub>y</sub> = ${f3(gy)}. Cociente: f<sub>x</sub>/f<sub>y</sub> = ${f3(fx / fy)} = g<sub>x</sub>/g<sub>y</sub> = ${f3(gx / gy)} (tangencia).`,
      `Solución: x* = <b>${f3(x)}</b>, y* = <b>${f3(y)}</b>, f = <b>${f3(v)}</b>, λ = <b>${f3(lam)}</b>.`,
      `<b>Qué significa λ:</b> si la restricción se afloja en una unidad, el máximo sube aproximadamente λ = ${f3(lam)}. ${st.kind === 'lin' ? 'En el problema del consumidor, λ es la <b>utilidad marginal del ingreso</b>: cuánto más feliz te hace un peso extra. En general se lo llama precio sombra.' : ''}`]);
    draw();
  }
  function draw() {
    if (!f) return; const pos = $('#lag-f').value.includes('^0.'), R = st.kind === 'circ' ? st.r * 1.6 : Math.max(st.c / st.a, st.c / st.b) * 1.15, xr = pos ? [0, R] : [-R, R];
    A.contour($('#lag-cv'), f, xr, xr, 14, g => {
      const c = g.c, [t0, t1] = tRange(); c.save(); c.beginPath(); c.rect(g.L, g.T, g.S2, g.S2); c.clip();
      c.strokeStyle = K.rose; c.lineWidth = 2.4; c.beginPath(); for (let i = 0; i <= 400; i++) { const [x, y] = curve(t0 + (t1 - t0) * i / 400); i ? c.lineTo(g.X(x), g.Y(y)) : c.moveTo(g.X(x), g.Y(y)); } c.stroke();
      if (sol && !sol.unb) {
        const N = 120, lv = sol.v; c.strokeStyle = K.amber; c.lineWidth = 2.2; c.beginPath();
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const x0 = xr[0] + (xr[1] - xr[0]) * i / N, y0 = xr[0] + (xr[1] - xr[0]) * j / N, dx = (xr[1] - xr[0]) / N, a = f(x0, y0) - lv, b = f(x0 + dx, y0) - lv, d = f(x0, y0 + dx) - lv; if (a * b < 0) { const t = a / (a - b); c.moveTo(g.X(x0 + t * dx), g.Y(y0)); c.lineTo(g.X(x0 + t * dx), g.Y(y0) - 1.2); } if (a * d < 0) { const t = a / (a - d); c.moveTo(g.X(x0), g.Y(y0 + t * dx)); c.lineTo(g.X(x0) + 1.2, g.Y(y0 + t * dx)); } }
        c.stroke(); c.fillStyle = K.fg; c.beginPath(); c.arc(g.X(sol.x), g.Y(sol.y), 7, 0, 7); c.fill();
      }
      c.restore();
    });
  }
}

/* ================= Integrales dobles ================= */
{
  let f = null; const st = { a: 0, b: 2, c: 0, d: 2, n: 6, az: -.7, el: .6 };
  const simp2 = (N = 80) => { const hx = (st.b - st.a) / N, hy = (st.d - st.c) / N, w = i => (i === 0 || i === N) ? 1 : i % 2 ? 4 : 2; let s = 0; for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) s += w(i) * w(j) * f(st.a + i * hx, st.c + j * hy); return s * hx * hy / 9; };
  const riem = () => { const hx = (st.b - st.a) / st.n, hy = (st.d - st.c) / st.n, cells = []; let s = 0; for (let i = 0; i < st.n; i++) for (let j = 0; j < st.n; j++) { const v = f(st.a + (i + .5) * hx, st.c + (j + .5) * hy); cells.push([i, j, v]); s += v * hx * hy; } return { s, cells, hx, hy }; };
  A.tool({
    id: 'dobles', mat: 'calc2', unit: 4, name: 'Integrales dobles', short: 'Integrales dobles', tag: 'Volumen bajo una superficie', f: '∬ f dA ≈ Σ f(xᵢ, yⱼ)·ΔA',
    desc: 'Aproximá el volumen bajo una superficie con prismas y comparalo con el valor exacto. Arrastrá para girar.',
    lead: 'Igual que la integral simple suma rectángulos, la doble suma prismas: dividís la región en cuadraditos, multiplicás el área de cada uno por la altura de la función en su centro y sumás. Con prismas cada vez más finos te acercás al volumen exacto.',
    body: `<div class="bench"><div class="ctrl">${fnRow('db-f', 'f(x, y) =', '4 - x^2/2 - y^2/2')}${chips('db-ex', ['4 - x^2/2 - y^2/2', 'x*y', 'x + y', 'sen(x)*sen(y) + 1', 'e^(-(x^2+y^2))'])}
      <div class="grid2"><div><label class="l" for="db-a">x desde</label><input class="field" id="db-a" value="0"></div><div><label class="l" for="db-b">x hasta</label><input class="field" id="db-b" value="2"></div><div><label class="l" for="db-c">y desde</label><input class="field" id="db-c" value="0"></div><div><label class="l" for="db-d">y hasta</label><input class="field" id="db-d" value="2"></div></div>
      <div><label class="l" for="db-n">Divisiones por lado: <span id="db-nv" style="color:var(--fg)">6</span></label><input type="range" id="db-n" min="1" max="24" value="6"></div><dl class="stats" id="db-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="db-cv" style="height:420px"></canvas><div class="steplist" id="db-steps"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#db-f').value, ['x', 'y']); f = r.f ? safe2(r.f) : null; $('#db-f-e').textContent = r.err; };
      comp(); $('#db-f').oninput = () => { comp(); upd(); };
      $$('#db-ex [data-fx]').forEach(b => b.onclick = () => { $('#db-f').value = b.dataset.fx; comp(); upd(); });
      ['a', 'b', 'c', 'd'].forEach(k => $('#db-' + k).oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st[k] = v; if (st.b > st.a && st.d > st.c) upd(); } });
      $('#db-n').oninput = e => { st.n = +e.target.value; $('#db-nv').textContent = st.n; upd(); };
      rot3($('#db-cv'), st, draw); upd();
    },
    draw
  });
  function upd() {
    if (!f) return; const r = riem(), ex = simp2(), err = Math.abs(r.s - ex);
    $('#db-st').innerHTML = A.stats([['Suma de prismas', f3(r.s)], ['Integral (valor real)', f3(ex)], ['Error', fmt(err, 4)], ['Prismas', st.n * st.n]]);
    $('#db-steps').innerHTML = A.steps([
      `Divido [${fmt(st.a, 2)}; ${fmt(st.b, 2)}] × [${fmt(st.c, 2)}; ${fmt(st.d, 2)}] en ${st.n} × ${st.n} cuadraditos de área ΔA = ${fmt(r.hx, 3)} × ${fmt(r.hy, 3)} = ${fmt(r.hx * r.hy, 4)}.`,
      `Evalúo f en el centro de cada uno, multiplico por ΔA y sumo: <b>${f3(r.s)}</b>.`,
      `El valor exacto (Simpson con 80 × 80 subdivisiones) es <b>${f3(ex)}</b>. Por el <b>teorema de Fubini</b>, también se puede calcular como una integral dentro de otra: ∫<sub>${fmt(st.a, 2)}</sub><sup>${fmt(st.b, 2)}</sup> ( ∫<sub>${fmt(st.c, 2)}</sub><sup>${fmt(st.d, 2)}</sup> f(x, y) dy ) dx.`,
      `Si dividís el resultado por el área de la región (${fmt((st.b - st.a) * (st.d - st.c), 3)}) obtenés el <b>valor promedio</b> de f: ${f3(ex / ((st.b - st.a) * (st.d - st.c)))}.`]);
    draw();
  }
  function draw() {
    if (!f) return; const { c, w, h } = A.canv($('#db-cv')); if (w < 2) return;
    const r = riem(), vals = r.cells.map(x => x[2]).filter(Number.isFinite); let zl = Math.min(0, ...vals), zh = Math.max(0, ...vals); if (zh - zl < 1e-9) zh = zl + 1;
    const P = view3(w, h, st.az, st.el, .33), U = x => 2 * (x - st.a) / (st.b - st.a) - 1, V = y => 2 * (y - st.c) / (st.d - st.c) - 1, Z = z => 2 * (z - zl) / (zh - zl) - 1;
    axes3(c, P); const faces = [];
    r.cells.forEach(([i, j, v]) => {
      if (!Number.isFinite(v)) return; const x0 = U(st.a + i * r.hx), x1 = U(st.a + (i + 1) * r.hx), y0 = V(st.c + j * r.hy), y1 = V(st.c + (j + 1) * r.hy), z0 = Z(0), z1 = Z(v);
      const box = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [[x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1]], [[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]]];
      box.forEach((q, k) => { const pts = q.map(p => P(...p)); faces.push({ pts, d: pts.reduce((s, p) => s + p[2], 0) / 4, t: (v - zl) / (zh - zl), top: k === 0, neg: v < 0 }); });
    });
    faces.sort((a, b) => b.d - a.d);
    faces.forEach(q => { c.fillStyle = q.neg ? 'rgba(239,115,145,.7)' : hcol(q.t); c.globalAlpha = q.top ? .95 : .7; c.beginPath(); q.pts.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.globalAlpha = 1; c.strokeStyle = 'rgba(11,12,16,.55)'; c.lineWidth = .7; c.stroke(); });
  }
}

/* ================= Ecuaciones diferenciales: campo de direcciones ================= */
{
  let P, f = null; const st = { x0: -2, y0: 1, h: .5, sols: [[-2, 1]] };
  const rk4 = (x, y, h) => { const k1 = f(x, y), k2 = f(x + h / 2, y + h * k1 / 2), k3 = f(x + h / 2, y + h * k2 / 2), k4 = f(x + h, y + h * k3); return y + h * (k1 + 2 * k2 + 2 * k3 + k4) / 6; };
  const trace = (x0, y0, dir, X) => { const pts = [[x0, y0]]; let x = x0, y = y0, h = .02 * dir; for (let i = 0; i < 2000; i++) { y = rk4(x, y, h); x += h; if (!Number.isFinite(y) || Math.abs(y) > 1e3 || Math.abs(x) > X) break; pts.push([x, y]); } return pts; };
  A.tool({
    id: 'edo', mat: 'calc3', unit: 1, name: 'Ecuaciones diferenciales: campo de direcciones', short: 'Campo de direcciones', tag: 'EDO de primer orden', f: "y′ = f(x, y)",
    desc: 'Dibujá el campo de pendientes de una ecuación diferencial, tocá para trazar soluciones y comparé el método de Euler con Runge-Kutta.',
    lead: 'Una ecuación diferencial dice cuál es la pendiente de la solución en cada punto. Dibujando esas pendientes como rayitas ves todas las soluciones a la vez. Tocá el gráfico para trazar la solución que pasa por ese punto.',
    body: `<div class="bench"><div class="ctrl">${fnRow('ed-f', "y′ =", 'y*(1 - y/4)')}${chips('ed-ex', ['y*(1 - y/4)', 'y', 'x - y', 'sen(x) - y/2', 'x^2 - y^2', '-x/y'])}${fnHelp2}
      <div><label class="l" for="ed-h">Paso de Euler h = <span id="ed-hv" style="color:var(--fg)">0,5</span></label><input type="range" id="ed-h" min="0.05" max="1" step="0.05" value="0.5"></div>
      <div class="row"><button class="btn sm" id="ed-clr">Borrar soluciones</button></div><dl class="stats" id="ed-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ed-cv" style="height:440px;background:var(--bg)"></canvas>${A.legend([['teal', 'Soluciones (Runge-Kutta 4)'], ['rose', 'Euler con paso h'], ['faint', 'Campo de pendientes']])}<div class="explain" id="ed-exp"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#ed-f').value, ['x', 'y']); f = r.f ? safe2(r.f) : null; $('#ed-f-e').textContent = r.err; };
      comp(); $('#ed-f').oninput = () => { comp(); upd(); };
      $$('#ed-ex [data-fx]').forEach(b => b.onclick = () => { $('#ed-f').value = b.dataset.fx; comp(); st.sols = [[st.x0, st.y0]]; upd(); });
      $('#ed-h').oninput = e => { st.h = +e.target.value; $('#ed-hv').textContent = fmt(st.h, 2); upd(); };
      $('#ed-clr').onclick = () => { st.sols = [[st.x0, st.y0]]; upd(); };
      P = A.plane($('#ed-cv'), { span: 10, cx: 1, cy: 2, pan: false, layers, grab: (a, px, py) => { st.x0 = a.WX(px); st.y0 = a.WY(py); st.sols.push([st.x0, st.y0]); if (st.sols.length > 12) st.sols.shift(); upd(); return { move: () => {} }; } });
      upd();
    },
    draw: () => P.draw()
  });
  function upd() {
    if (!f) return P.draw(); let y = st.y0, x = st.x0; for (let i = 0; i < Math.round(4 / st.h); i++) { y += st.h * f(x, y); x += st.h; }
    let yr = st.y0, xr = st.x0; const hh = .01; for (let i = 0; i < 400; i++) { yr = rk4(xr, yr, hh); xr += hh; }
    $('#ed-st').innerHTML = A.stats([['Punto inicial', `(${f3(st.x0)}; ${f3(st.y0)})`], ['y(x₀ + 4) con Euler', f3(y)], ['y(x₀ + 4) con RK4', f3(yr)], ['Error de Euler', fmt(Math.abs(y - yr), 4)]]);
    const ex = $('#ed-f').value.replace(/\s/g, '');
    $('#ed-exp').innerHTML = `<p><b>Euler</b> avanza en línea recta con la pendiente del punto donde está: y<sub>n+1</sub> = y<sub>n</sub> + h·f(x<sub>n</sub>, y<sub>n</sub>). Es simple pero acumula error (proporcional a h). <b>Runge-Kutta 4</b> promedia cuatro pendientes por paso y es muchísimo más preciso (error proporcional a h⁴). Achicá h y mirá cómo Euler se pega a la solución.</p>${ex === 'y*(1-y/4)' ? '<p style="margin-top:6px">Esta es la <b>ecuación logística</b>: crecimiento que se frena al acercarse a la capacidad máxima (4). Las soluciones convergen a y = 4 (equilibrio estable) y se alejan de y = 0 (inestable).</p>' : ''}`;
    P.draw();
  }
  function layers(a) {
    if (!f) return; const c = a.c, step = Math.max(a.s * 28, .2); c.strokeStyle = 'rgba(141,147,167,.5)'; c.lineWidth = 1;
    for (let x = Math.ceil(a.x0 / step) * step; x <= a.x1; x += step) for (let y = Math.ceil(a.y0 / step) * step; y <= a.y1; y += step) { const m = f(x, y); if (!Number.isFinite(m)) continue; const L = 9 / Math.sqrt(1 + m * m); c.beginPath(); c.moveTo(a.PX(x) - L, a.PY(y) + m * L); c.lineTo(a.PX(x) + L, a.PY(y) - m * L); c.stroke(); }
    st.sols.forEach(([x0, y0], i) => { const pts = [...trace(x0, y0, -1, 60).reverse(), ...trace(x0, y0, 1, 60)]; c.strokeStyle = i === st.sols.length - 1 ? K.teal : 'rgba(67,200,184,.55)'; c.lineWidth = 2; c.beginPath(); pts.forEach(([x, y], k) => k ? c.lineTo(a.PX(x), a.PY(y)) : c.moveTo(a.PX(x), a.PY(y))); c.stroke(); });
    let x = st.x0, y = st.y0; const eu = [[x, y]]; for (let i = 0; i < Math.round((a.x1 - st.x0) / st.h) + 1; i++) { y += st.h * f(x, y); x += st.h; if (!Number.isFinite(y) || Math.abs(y) > 1e4) break; eu.push([x, y]); }
    c.strokeStyle = K.rose; c.lineWidth = 1.6; c.beginPath(); eu.forEach(([x, y], k) => k ? c.lineTo(a.PX(x), a.PY(y)) : c.moveTo(a.PX(x), a.PY(y))); c.stroke(); eu.forEach(([x, y]) => a.dot(x, y, K.rose, 2.6));
    a.dot(st.x0, st.y0, K.fg, 6);
  }
}

/* ================= Sistemas: predador-presa ================= */
{
  const st = {};
  const D = [['al', 'Crecimiento de las presas α', .2, 2, .05, 1, 2], ['be', 'Tasa de caza β', .05, 1, .01, .3, 2], ['de', 'Eficiencia del predador δ', .05, 1, .01, .2, 2], ['ga', 'Muerte de predadores γ', .2, 2, .05, .8, 2], ['x0', 'Presas iniciales', .5, 15, .1, 6, 1], ['y0', 'Predadores iniciales', .5, 10, .1, 2, 1]];
  const sim = () => { const F = (x, y) => [st.al * x - st.be * x * y, st.de * x * y - st.ga * y]; let x = st.x0, y = st.y0; const out = [[0, x, y]], h = .02; for (let i = 1; i <= 2500; i++) { const k1 = F(x, y), k2 = F(x + h / 2 * k1[0], y + h / 2 * k1[1]), k3 = F(x + h / 2 * k2[0], y + h / 2 * k2[1]), k4 = F(x + h * k3[0], y + h * k3[1]); x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); if (i % 5 === 0) out.push([i * h, x, y]); } return out; };
  A.tool({
    id: 'lotka', mat: 'calc3', unit: 2, name: 'Sistemas dinámicos: modelo predador-presa', short: 'Predador-presa', tag: 'Sistemas de EDO', f: 'x′ = αx − βxy,  y′ = δxy − γy',
    desc: 'El modelo de Lotka-Volterra: dos poblaciones que dependen una de otra y oscilan para siempre. Plano de fases y evolución en el tiempo.',
    lead: 'Las presas (x) crecen solas y los predadores (y) se las comen. Muchas presas alimentan a más predadores, que después reducen las presas, que después hacen caer a los predadores, y vuelta a empezar. El mismo esquema aparece en economía en el modelo de ciclos de Goodwin (salarios y empleo).',
    body: `<div class="bench"><div class="ctrl">${A.sliders('lv', D)}<dl class="stats" id="lv-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Plano de fases</h3><canvas id="lv-ph" style="height:320px"></canvas></div><div><h3>Poblaciones en el tiempo</h3><canvas id="lv-ts" style="height:320px"></canvas></div></div>${A.legend([['teal', 'Presas'], ['rose', 'Predadores'], ['amber', 'Trayectoria'], ['fg', 'Equilibrio']])}<div class="steplist" id="lv-steps"></div></div></div>`,
    init() { A.bindSliders('lv', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const ex = st.ga / st.de, ey = st.al / st.be, s = sim(), xs = s.map(p => p[1]), ys = s.map(p => p[2]);
    $('#lv-st').innerHTML = A.stats([['Equilibrio presas', f3(ex)], ['Equilibrio predadores', f3(ey)], ['Máximo de presas', f3(Math.max(...xs))], ['Máximo de predadores', f3(Math.max(...ys))]]);
    $('#lv-steps').innerHTML = A.steps([
      `Equilibrio: igualo las dos derivadas a cero. x′ = 0 → y = α/β = <b>${f3(ey)}</b>; y′ = 0 → x = γ/δ = <b>${f3(ex)}</b>.`,
      `Alrededor del equilibrio, la matriz jacobiana tiene autovalores imaginarios puros (±i√(αγ)): por eso las trayectorias son <b>órbitas cerradas</b> y las poblaciones oscilan sin amortiguarse. Período aproximado para órbitas chicas: 2π/√(αγ) = ${f3(2 * Math.PI / Math.sqrt(st.al * st.ga))}.`,
      `Fijate en el desfase: el pico de predadores llega <b>después</b> del pico de presas. Y un dato contraintuitivo: subir la caza (β) baja el equilibrio de <b>predadores</b>, no el de presas.`]);
    draw();
  }
  function draw() {
    const s = sim(), xm = Math.max(...s.map(p => p[1])) * 1.15, ym = Math.max(...s.map(p => p[2])) * 1.15, ex = st.ga / st.de, ey = st.al / st.be;
    const g = A.ax($('#lv-ph'), [0, Math.max(xm, ex * 1.3)], [0, Math.max(ym, ey * 1.3)], { l: 36 });
    if (g) {
      const c = g.c; c.strokeStyle = 'rgba(141,147,167,.4)'; c.lineWidth = 1;
      for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) { const x = g.xr[1] * i / 12, y = g.yr[1] * j / 12, dx = st.al * x - st.be * x * y, dy = st.de * x * y - st.ga * y, n = Math.hypot(dx, dy) || 1; c.beginPath(); c.moveTo(g.X(x), g.Y(y)); c.lineTo(g.X(x) + dx / n * 10, g.Y(y) - dy / n * 10); c.stroke(); }
      g.path(s.map(p => [p[1], p[2]]), K.amber, 2); g.dot(ex, ey, K.fg, 5.5); g.dot(st.x0, st.y0, K.teal, 5); g.labels('Presas x', 'Predadores y');
    }
    const t = A.ax($('#lv-ts'), [0, s[s.length - 1][0]], [0, Math.max(xm, ym)], { l: 36 });
    if (t) { t.path(s.map(p => [p[0], p[1]]), K.teal, 2); t.path(s.map(p => [p[0], p[2]]), K.rose, 2); t.labels('Tiempo', ''); }
  }
}
})();
