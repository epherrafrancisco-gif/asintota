/* Asíntota · Cálculo I, II y III (ampliación) */
(() => {
const { $, $$, K, fmt, pct, mkFn } = A;
const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3), f4 = x => fmt(x, 4);
const safe = f => x => { try { const v = f(x); return Number.isFinite(v) ? v : NaN; } catch (e) { return NaN; } };
const chips = (id, list) => `<div class="chips" id="${id}">${list.map(s => `<button class="chip" data-fx="${s}">${s}</button>`).join('')}</div>`;
const fnRow = (id, pre, val) => `<div><label class="l" for="${id}">${pre}</label><div class="fn-in"><input class="field" id="${id}" value="${val}" spellcheck="false" autocomplete="off"></div><p class="err" id="${id}-e"></p></div>`;
const d1 = (f, x) => { const h = 1e-5 * Math.max(1, Math.abs(x)); return (f(x + h) - f(x - h)) / (2 * h); };
const nice = s => s.replace(/\bsin\b/g, 'sen').replace(/\bsqrt\b/g, 'raiz').replace(/\blog\b/g, 'ln').replace(/\s*\*\s*/g, '·');
const deriv = s => { try { const n = math.simplify(math.derivative(A.prep(s), 'x')); return n.toString(); } catch (e) { return null; } };
const rk4 = (F, y, t, h) => { const k1 = F(t, y), k2 = F(t + h / 2, y.map((v, i) => v + h / 2 * k1[i])), k3 = F(t + h / 2, y.map((v, i) => v + h / 2 * k2[i])), k4 = F(t + h, y.map((v, i) => v + h * k3[i])); return y.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); };

/* ===================================== CÁLCULO I ===================================== */

/* ================= Transformaciones de funciones ================= */
{
  let P, f = null; const st = {};
  const D = [['a', 'a: estiramiento vertical', -3, 3, .1, 1, 1], ['b', 'b: compresión horizontal', -3, 3, .1, 1, 1], ['h', 'h: corrimiento horizontal', -5, 5, .1, 0, 1], ['k', 'k: corrimiento vertical', -5, 5, .1, 0, 1]];
  A.tool({
    id: 'transformaciones-fn', mat: 'calc1', unit: 1, ord: 1, name: 'Transformaciones de funciones', short: 'Transformaciones', tag: 'Desplazar, estirar, reflejar', f: 'g(x) = a·f(b·(x − h)) + k',
    desc: 'Corré, estirá y reflejá cualquier función con cuatro parámetros y entendé qué hace cada uno.',
    lead: 'Conociendo unas pocas funciones básicas (x², |x|, √x, eˣ, sen x) se pueden graficar muchísimas otras: casi todas son la misma forma, corrida o estirada. Cambiá los parámetros y mirá la función original (gris) y la transformada (naranja).',
    body: `<div class="bench"><div class="ctrl">${fnRow('trf-f', 'Función base f(x)', 'x^2')}${chips('trf-ex', ['x^2', 'abs(x)', 'raiz(x)', 'x^3', 'exp(x)', 'ln(x)', '1/x', 'sen(x)'])}${A.sliders('trf', D)}<button class="btn sm" id="trf-r" style="align-self:flex-start">Volver a la original</button></div>
      <div class="stage"><div class="big sm mono" id="trf-g" style="font-size:20px"></div><canvas id="trf-cv" style="height:380px;background:var(--bg)"></canvas>${A.legend([['faint', 'f(x) original'], ['amber', 'g(x) transformada']])}<div class="steplist" id="trf-steps"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#trf-f').value); f = r.f ? safe(r.f) : null; $('#trf-f-e').textContent = r.err; };
      comp(); $('#trf-f').oninput = () => { comp(); upd(); };
      $$('#trf-ex [data-fx]').forEach(b => b.onclick = () => { $('#trf-f').value = b.dataset.fx; comp(); upd(); });
      A.bindSliders('trf', D, st, upd); $('#trf-r').onclick = () => { [['a', 1], ['b', 1], ['h', 0], ['k', 0]].forEach(([k, v]) => A.setSlider('trf', k, v, st, 1)); upd(); };
      P = A.plane($('#trf-cv'), { span: 16, layers }); upd();
    },
    draw: () => P.draw()
  });
  const g = x => st.a * f(st.b * (x - st.h)) + st.k;
  function upd() {
    const s = $('#trf-f').value.trim(), inner = st.b === 1 ? (st.h ? `x ${st.h > 0 ? '−' : '+'} ${f2(Math.abs(st.h))}` : 'x') : `${f2(st.b)}·(x ${st.h >= 0 ? '−' : '+'} ${f2(Math.abs(st.h))})`;
    $('#trf-g').textContent = `g(x) = ${st.a === 1 ? '' : f2(st.a) + '·'}f(${inner})${st.k ? (st.k > 0 ? ' + ' : ' − ') + f2(Math.abs(st.k)) : ''}`;
    const L = [];
    L.push(st.h ? `<b>h = ${f2(st.h)}</b>: la curva se corre ${f2(Math.abs(st.h))} unidades hacia la ${st.h > 0 ? 'derecha' : 'izquierda'}. Ojo con el signo: f(x − 2) va a la <b>derecha</b>, porque para obtener el mismo valor que antes, x tiene que ser 2 más grande.` : `<b>h = 0</b>: sin corrimiento horizontal.`);
    L.push(st.k ? `<b>k = ${f2(st.k)}</b>: toda la curva sube o baja ${f2(Math.abs(st.k))} (${st.k > 0 ? 'sube' : 'baja'}). Es lo más intuitivo: se suma afuera.` : `<b>k = 0</b>: sin corrimiento vertical.`);
    L.push(st.a === 0 ? 'Con a = 0 la función se aplasta a una recta horizontal.' : `<b>a = ${f2(st.a)}</b>: ${Math.abs(st.a) > 1 ? 'estira verticalmente' : Math.abs(st.a) < 1 ? 'achata verticalmente' : 'mantiene la altura'}${st.a < 0 ? ', y como es negativo, <b>refleja</b> la curva respecto del eje x' : ''}.`);
    L.push(st.b === 0 ? 'Con b = 0 la función queda constante: f(0).' : `<b>b = ${f2(st.b)}</b>: ${Math.abs(st.b) > 1 ? 'comprime horizontalmente (todo pasa más rápido)' : Math.abs(st.b) < 1 ? 'estira horizontalmente (todo pasa más lento)' : 'mantiene el ancho'}${st.b < 0 ? ', y como es negativo, <b>refleja</b> respecto del eje y' : ''}.`);
    $('#trf-steps').innerHTML = A.steps(L); P.draw();
  }
  function layers(a) { if (!f) return; a.plot(f, K.faint, 1.8); a.plot(safe(g), K.amber, 2.6); }
}

/* ================= L'Hôpital ================= */
{
  let P = null, R = null;
  const PRE = [['sen(x)', 'x', '0'], ['exp(x) - 1', 'x', '0'], ['1 - cos(x)', 'x^2', '0'], ['ln(x)', 'x - 1', '1'], ['x^3 - 8', 'x - 2', '2'], ['x - sen(x)', 'x^3', '0']];
  A.tool({
    id: 'lhopital', mat: 'calc1', unit: 2, ord: 1, name: 'Indeterminaciones y regla de L\'Hôpital', short: 'L\'Hôpital', tag: 'Límites con 0/0', f: 'lím f/g = lím f′/g′',
    desc: 'Cuando un límite da 0/0, derivá numerador y denominador. La herramienta deriva simbólicamente y repite hasta salir de la indeterminación.',
    lead: 'Si al reemplazar te queda 0/0, el límite puede ser cualquier cosa: depende de qué tan rápido va cada parte a cero. L\'Hôpital compara esas velocidades usando las derivadas. Se puede aplicar varias veces seguidas.',
    body: `<div class="bench"><div class="ctrl">${fnRow('lh-f', 'Numerador f(x)', 'sen(x)')}${fnRow('lh-g', 'Denominador g(x)', 'x')}<div><label class="l" for="lh-a">x tiende a</label><input class="field" id="lh-a" value="0"></div>
      <div><label class="l">Ejemplos</label><div class="chips">${PRE.map((p, i) => `<button class="chip" data-lh="${i}">(${p[0]})/(${p[1]})</button>`).join('')}</div></div></div>
      <div class="stage"><div class="row" style="justify-content:space-between;align-items:baseline"><div class="big sm" id="lh-res"></div><span class="mono muted" id="lh-lab"></span></div><canvas id="lh-cv" style="height:320px;background:var(--bg)"></canvas>${A.legend([['amber', 'f(x)/g(x)'], ['teal', 'f′(x)/g′(x)']])}<div class="steplist" id="lh-steps"></div></div></div>`,
    init() {
      $$('[data-lh]').forEach(b => b.onclick = () => { const p = PRE[+b.dataset.lh]; $('#lh-f').value = p[0]; $('#lh-g').value = p[1]; $('#lh-a').value = p[2]; upd(); });
      ['lh-f', 'lh-g', 'lh-a'].forEach(id => $('#' + id).oninput = upd);
      P = A.plane($('#lh-cv'), { span: 8, layers }); upd();
    },
    draw: () => P && P.draw()
  });
  function upd() {
    const a = A.num($('#lh-a').value), fs = [$('#lh-f').value.trim()], gs = [$('#lh-g').value.trim()], ff = mkFn(fs[0]), gg = mkFn(gs[0]);
    $('#lh-f-e').textContent = ff.err; $('#lh-g-e').textContent = gg.err; R = null;
    if (!ff.f || !gg.f || !Number.isFinite(a)) { $('#lh-steps').innerHTML = ''; P.draw(); return; }
    const L = []; let res = null, k = 0;
    while (k < 5) {
      const F = mkFn(fs[k]).f, G = mkFn(gs[k]).f, fa = F ? F(a) : NaN, ga = G ? G(a) : NaN, z = v => Math.abs(v) < 1e-10;
      const tag = k ? `Derivada ${k === 1 ? '' : k + '.ª '}` : 'Reemplazo directo';
      if (z(fa) && z(ga)) { L.push(`${tag}: f${"′".repeat(k)}(${f2(a)}) = 0 y g${"′".repeat(k)}(${f2(a)}) = 0 → <b>indeterminación 0/0</b>. Aplico L'Hôpital: derivo arriba y abajo <b>por separado</b> (no es la regla del cociente).`); const df = deriv(fs[k]), dg = deriv(gs[k]); if (!df || !dg) { L.push('No pude derivar la expresión.'); break; } fs.push(df); gs.push(dg); L.push(`Nuevo cociente: <span class="mono">(${nice(df)}) / (${nice(dg)})</span>`); k++; continue; }
      if (z(ga)) { res = fa > 0 === true ? '±∞' : '±∞'; L.push(`${tag}: el numerador vale ${f4(fa)} y el denominador 0 → el límite es <b>infinito</b> (no es indeterminación: hay una asíntota vertical).`); break; }
      res = fa / ga; L.push(`${tag}: ${f4(fa)} / ${f4(ga)} = <b>${f4(res)}</b>. Ya no hay indeterminación.`); break;
    }
    if (k === 5) L.push('Después de cinco derivadas sigue la indeterminación; conviene otra estrategia (factorizar, sustituir).');
    if (typeof res === 'number' && k > 0) L.push(`Conclusión: lím<sub>x→${f2(a)}</sub> f(x)/g(x) = <b>${f4(res)}</b>. ${k > 1 ? `Hizo falta aplicar la regla ${k} veces.` : ''} En el gráfico se ve que f/g y f′/g′ no son la misma función, pero se acercan al mismo valor en x = ${f2(a)}.`);
    if (typeof res === 'number' && k === 0) L.push('No hacía falta L\'Hôpital: reemplazar directamente ya da un número. Aplicarlo cuando no hay 0/0 (o ∞/∞) da resultados <b>incorrectos</b>.');
    $('#lh-res').textContent = res === null ? '—' : typeof res === 'number' ? f4(res) : res; $('#lh-lab').textContent = `lím x→${f2(a)}`;
    R = { a, q: safe(x => mkFn(fs[0]).f(x) / mkFn(gs[0]).f(x)), q1: fs.length > 1 ? safe(x => mkFn(fs[1]).f(x) / mkFn(gs[1]).f(x)) : null, res };
    $('#lh-steps').innerHTML = A.steps(L); P.v.cx = a; P.v.cy = typeof res === 'number' ? res : 0; P.draw();
  }
  function layers(p) { if (!R) return; if (R.q1) p.plot(R.q1, K.teal, 1.8, [6, 4]); p.plot(R.q, K.amber, 2.4); p.line(R.a, p.y0, R.a, p.y1, K.faint, 1, [3, 4]); if (typeof R.res === 'number') { p.c.strokeStyle = K.amber; p.c.lineWidth = 2; p.c.fillStyle = K.bg; p.c.beginPath(); p.c.arc(p.PX(R.a), p.PY(R.res), 6, 0, 7); p.c.fill(); p.c.stroke(); } }
}

/* ================= Optimización económica con derivadas ================= */
{
  const st = {}; let R = null;
  const D = [['a', 'Demanda: precio máximo a', 20, 200, 1, 100, 0], ['b', 'Demanda: pendiente b', .2, 5, .1, 1, 1], ['F', 'Costo fijo', 0, 1500, 10, 400, 0], ['c', 'Costo variable lineal c', 0, 80, 1, 10, 0], ['d', 'Costo variable cuadrático d', 0, 3, .05, .5, 2]];
  A.tool({
    id: 'marginal', mat: 'calc1', unit: 4, ord: 2, name: 'Análisis marginal: maximizar el beneficio', short: 'Análisis marginal', tag: 'Derivadas en economía', f: 'B′(Q) = IMg − CMg = 0',
    desc: 'Ingreso, costo y beneficio como funciones: el máximo está donde la derivada del beneficio se anula, es decir donde ingreso marginal iguala costo marginal.',
    lead: 'En economía "marginal" significa "derivada": cuánto cambia el total por una unidad más. Una empresa con demanda P = a − bQ y costo C = F + cQ + dQ² elige Q para maximizar B(Q) = I(Q) − C(Q).',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mg', D)}<dl class="stats" id="mg-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Totales</h3><canvas id="mg-t" style="height:260px"></canvas>${A.legend([['teal', 'Ingreso I(Q)'], ['rose', 'Costo C(Q)'], ['amber', 'Beneficio B(Q)']])}</div><div><h3>Marginales (derivadas)</h3><canvas id="mg-m" style="height:260px"></canvas>${A.legend([['teal', 'IMg = I′(Q)'], ['rose', 'CMg = C′(Q)'], ['violet', 'Costo medio C/Q']])}</div></div><div class="steplist" id="mg-steps"></div></div></div>`,
    init() { A.bindSliders('mg', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { a, b, F, c, d } = st, Q = Math.max(0, (a - c) / (2 * b + 2 * d)), P = a - b * Q, I = P * Q, C = F + c * Q + d * Q * Q, B = I - C, Qme = d > 0 ? Math.sqrt(F / d) : Infinity, Qmax = a / b;
    R = { Q, Qmax };
    $('#mg-st').innerHTML = A.stats([['Cantidad óptima Q*', f2(Q)], ['Precio', f2(P)], ['Beneficio máximo', f2(B)], ['Costo medio mínimo en Q', Number.isFinite(Qme) ? f2(Qme) : '—']]);
    $('#mg-steps').innerHTML = A.steps([
      `Ingreso: I(Q) = P·Q = (${f2(a)} − ${f2(b)}Q)·Q = ${f2(a)}Q − ${f2(b)}Q². Derivando: <b>IMg = ${f2(a)} − ${f2(2 * b)}Q</b>.`,
      `Costo: C(Q) = ${f2(F)} + ${f2(c)}Q + ${f2(d)}Q². Derivando: <b>CMg = ${f2(c)} + ${f2(2 * d)}Q</b>. El costo fijo desaparece al derivar: no afecta la decisión marginal.`,
      `Condición de primer orden: B′(Q) = IMg − CMg = 0 → ${f2(a)} − ${f2(2 * b)}Q = ${f2(c)} + ${f2(2 * d)}Q → <b>Q* = ${f2(Q)}</b>.`,
      `Condición de segundo orden: B″(Q) = −${f2(2 * b)} − ${f2(2 * d)} < 0, así que es un <b>máximo</b>. Beneficio: ${f2(I)} − ${f2(C)} = <b>${f2(B)}</b>${B < 0 ? ' (negativo: en el largo plazo convendría cerrar)' : ''}.`,
      `Dato clásico: el costo marginal corta al costo medio en su mínimo (Q = √(F/d) = ${Number.isFinite(Qme) ? f2(Qme) : '—'}). Si el marginal está debajo del promedio, lo baja; si está arriba, lo sube.`]);
    draw();
  }
  function draw() {
    if (!R) return; const { a, b, F, c, d } = st, X = R.Qmax, I = q => (a - b * q) * q, C = q => F + c * q + d * q * q, B = q => I(q) - C(q);
    let ym = 0, yl = 0; for (let i = 0; i <= 60; i++) { const q = X * i / 60; ym = Math.max(ym, I(q)); yl = Math.min(yl, B(q)); } ym = Math.max(ym, C(R.Q)) * 1.3;
    const t = A.ax($('#mg-t'), [0, X], [Math.max(yl, -ym * .6), ym * 1.1], { l: 52 }); if (t) { t.hline(0, K.faint, 1); t.fn(I, K.teal); t.fn(C, K.rose); t.fn(B, K.amber, 2.6); t.vline(R.Q, K.faint, 1, [4, 4]); t.dot(R.Q, B(R.Q), K.amber, 5); }
    const mm = Math.max(a, c + 2 * d * X) * 1.05, m = A.ax($('#mg-m'), [0, X], [0, Math.min(mm, a * 1.6)], { l: 44 }); if (m) { m.fn(q => a - 2 * b * q, K.teal); m.fn(q => c + 2 * d * q, K.rose); m.fn(q => C(q) / q, K.violet, 1.8, [5, 4], [X * .02, X]); m.guide(R.Q, a - 2 * b * R.Q); m.dot(R.Q, a - 2 * b * R.Q, K.fg, 5); }
  }
}

/* ================= Área entre curvas ================= */
{
  let P, f = null, g = null; const st = { a: -1, b: 2 }; let R = null;
  const PRE = [['x^2', 'x', '0', '1'], ['sen(x)', 'cos(x)', '0', '6.28'], ['4 - x^2', 'x + 2', '-3', '2'], ['10 - x', '4', '0', '6'], ['x^3 - x', '0', '-1', '1']];
  A.tool({
    id: 'area-curvas', mat: 'calc1', unit: 5, ord: 2, name: 'Área entre curvas', short: 'Área entre curvas', tag: 'Aplicaciones de la integral', f: 'A = ∫ₐᵇ |f(x) − g(x)| dx',
    desc: 'Encontrá dónde se cortan dos curvas y calculá el área encerrada, separando los tramos donde cambia cuál está arriba.',
    lead: 'El área entre dos curvas es la integral de "la de arriba menos la de abajo". El error típico es integrar f − g sin mirar el gráfico: si las curvas se cruzan, las áreas se restan entre sí. Hay que partir la integral en los puntos de corte.',
    body: `<div class="bench"><div class="ctrl">${fnRow('arc-f', 'f(x)', 'x^2')}${fnRow('arc-g', 'g(x)', 'x')}<div class="grid2"><div><label class="l" for="arc-a">Desde a</label><input class="field" id="arc-a" value="0"></div><div><label class="l" for="arc-b">Hasta b</label><input class="field" id="arc-b" value="1"></div></div>
      <button class="btn sm" id="arc-cut" style="align-self:flex-start">Usar los puntos de corte como límites</button><div><label class="l">Ejemplos</label><div class="chips">${PRE.map((p, i) => `<button class="chip" data-ac="${i}">${p[0]} y ${p[1]}</button>`).join('')}</div></div><dl class="stats" id="arc-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="arc-cv" style="height:360px;background:var(--bg)"></canvas>${A.legend([['amber', 'f(x)'], ['teal', 'g(x)']])}<div class="steplist" id="arc-steps"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#arc-f').value), s = mkFn($('#arc-g').value); f = r.f ? safe(r.f) : null; g = s.f ? safe(s.f) : null; $('#arc-f-e').textContent = r.err; $('#arc-g-e').textContent = s.err; };
      comp(); ['arc-f', 'arc-g'].forEach(i => $('#' + i).oninput = () => { comp(); upd(); }); ['arc-a', 'arc-b'].forEach(i => $('#' + i).oninput = upd);
      $$('[data-ac]').forEach(b => b.onclick = () => { const p = PRE[+b.dataset.ac]; $('#arc-f').value = p[0]; $('#arc-g').value = p[1]; $('#arc-a').value = p[2]; $('#arc-b').value = p[3]; comp(); upd(); });
      $('#arc-cut').onclick = () => { if (!f || !g) return; const cs = cuts(-10, 10); if (cs.length >= 2) { $('#arc-a').value = String(+cs[0].toFixed(4)).replace('.', ','); $('#arc-b').value = String(+cs[cs.length - 1].toFixed(4)).replace('.', ','); upd(); } };
      P = A.plane($('#arc-cv'), { span: 8, cx: .5, cy: .5, layers }); upd();
    },
    draw: () => P.draw()
  });
  const simp = (h, a, b, n = 2000) => { const dx = (b - a) / n; let s = h(a) + h(b); for (let i = 1; i < n; i++) s += h(a + i * dx) * (i % 2 ? 4 : 2); return s * dx / 3; };
  function cuts(a, b) { const out = [], N = 2000, h = x => f(x) - g(x); for (let i = 0; i < N; i++) { let lo = a + (b - a) * i / N, hi = a + (b - a) * (i + 1) / N; const p = h(lo), q = h(hi); if (Math.abs(p) < 1e-12) { out.push(lo); continue; } if (Number.isFinite(p) && Number.isFinite(q) && p * q < 0) { for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; h(m) * h(lo) > 0 ? lo = m : hi = m; } out.push((lo + hi) / 2); } } return out.filter((x, i, arr) => !i || x - arr[i - 1] > 1e-6); }
  function upd() {
    const a = A.num($('#arc-a').value), b = A.num($('#arc-b').value); R = null;
    if (!f || !g || !(b > a)) { $('#arc-steps').innerHTML = '<p class="err">Revisá las funciones y que b sea mayor que a.</p>'; P.draw(); return; }
    st.a = a; st.b = b; const cs = cuts(a, b).filter(x => x > a + 1e-9 && x < b - 1e-9), pts = [a, ...cs, b], parts = [];
    for (let i = 0; i < pts.length - 1; i++) { const v = simp(x => f(x) - g(x), pts[i], pts[i + 1]); parts.push([pts[i], pts[i + 1], v]); }
    const area = parts.reduce((s, p) => s + Math.abs(p[2]), 0), net = parts.reduce((s, p) => s + p[2], 0); R = { a, b };
    $('#arc-st').innerHTML = A.stats([['Área', f4(area)], ['∫(f − g) sin valor absoluto', f4(net)], ['Cortes dentro de [a, b]', cs.length]]);
    $('#arc-steps').innerHTML = A.steps([
      cs.length ? `Las curvas se cortan en x = ${cs.map(f3).join(', ')} (donde f(x) = g(x)). Ahí cambia cuál está arriba, así que parto la integral en ${parts.length} tramos.` : `En [${f2(a)}; ${f2(b)}] las curvas no se cruzan: una sola integral alcanza.`,
      ...parts.map(([p, q, v]) => `Tramo [${f3(p)}; ${f3(q)}]: arriba está <b>${v >= 0 ? 'f' : 'g'}</b>. ∫ (${v >= 0 ? 'f − g' : 'g − f'}) dx = <b>${f4(Math.abs(v))}</b>.`),
      `Área total = ${parts.map(p => f4(Math.abs(p[2]))).join(' + ')} = <b>${f4(area)}</b>. ${Math.abs(net - area) > 1e-6 ? `Si hubieras integrado f − g de corrido te daría ${f4(net)}: los tramos se compensan y el resultado está mal.` : ''}`,
      `Aplicación económica: el excedente del consumidor es el área entre la curva de demanda y la recta del precio (probá el ejemplo "10 − x y 4").`]);
    P.draw();
  }
  function layers(p) {
    if (!f || !g) return;
    if (R) { const N = 300; p.c.save(); for (let i = 0; i < N; i++) { const x = R.a + (R.b - R.a) * i / N, x2 = R.a + (R.b - R.a) * (i + 1) / N, y1 = f(x), y2 = g(x); if (!Number.isFinite(y1 + y2)) continue; p.c.fillStyle = y1 >= y2 ? 'rgba(242,169,59,.28)' : 'rgba(67,200,184,.28)'; const top = p.PY(Math.max(y1, y2)), bot = p.PY(Math.min(y1, y2)); p.c.fillRect(p.PX(x), top, p.PX(x2) - p.PX(x) + .6, bot - top); } p.c.restore(); }
    p.plot(f, K.amber, 2.4); p.plot(g, K.teal, 2.4);
    if (R) cuts(R.a - 1e-9, R.b + 1e-9).forEach(x => p.dot(x, f(x), K.fg, 4.5));
  }
}

/* ================= Integrales impropias ================= */
{
  const st = { kind: 'inf' }; let R = null;
  const D = [['p', 'Exponente p en 1/xᵖ', .2, 3, .05, 2, 2], ['B', 'Límite de integración (b o ε)', 0, 1, .01, .5, 2]];
  A.tool({
    id: 'impropias', mat: 'calc1', unit: 5, ord: 3, name: 'Integrales impropias', short: 'Impropias', tag: 'Áreas infinitas que dan un número', f: '∫₁^∞ 1/xᵖ dx converge ⇔ p > 1',
    desc: 'Áreas bajo curvas que llegan hasta el infinito o que tienen una asíntota: cuándo dan un número finito y cuándo no.',
    lead: 'Una integral impropia se calcula como un límite: se integra hasta b y se manda b al infinito (o se integra desde ε y se manda ε a 0). Con la familia 1/xᵖ se ve todo: según p, el área total es finita o infinita.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Tipo</label>${A.seg('imp-k', [['inf', '∫₁^∞ (intervalo infinito)'], ['zero', '∫₀¹ (asíntota en 0)']], 'inf')}</div>${A.sliders('imp', D)}<div id="imp-pill"></div><dl class="stats" id="imp-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="imp-cv" style="height:300px"></canvas><div class="tbl-wrap"><table class="tbl" id="imp-tbl"></table></div><div class="steplist" id="imp-steps"></div></div></div>`,
    init() { A.bindSliders('imp', D, st, upd); A.segBind('imp-k', v => { st.kind = v; upd(); }); upd(); },
    draw
  });
  const Fi = (p, b) => Math.abs(p - 1) < 1e-9 ? Math.log(b) : (Math.pow(b, 1 - p) - 1) / (1 - p);
  const Fz = (p, e) => Math.abs(p - 1) < 1e-9 ? -Math.log(e) : (1 - Math.pow(e, 1 - p)) / (1 - p);
  function upd() {
    const p = st.p, inf = st.kind === 'inf', b = inf ? Math.pow(10, st.B * 4) : Math.pow(10, -st.B * 6 - .01), conv = inf ? p > 1 : p < 1, val = inf ? 1 / (p - 1) : 1 / (1 - p);
    R = { p, inf, b };
    $('#imp-pill').innerHTML = `<span class="pill ${conv ? 'ok' : 'bad'}">${conv ? 'Converge' : 'Diverge'}</span>`;
    $('#imp-st').innerHTML = A.stats([[inf ? 'b' : 'ε', inf ? fmt(b, b < 100 ? 2 : 0) : b.toExponential(1)], [inf ? `Área hasta b` : 'Área desde ε', f4(inf ? Fi(p, b) : Fz(p, b))], ['Valor de la integral', conv ? f4(val) : '∞']]);
    const bs = inf ? [10, 100, 1e3, 1e4, 1e6, 1e9] : [.1, .01, 1e-3, 1e-4, 1e-6, 1e-9];
    $('#imp-tbl').innerHTML = `<tr><th>${inf ? 'b' : 'ε'}</th>${bs.map(v => `<th>${inf ? fmt(v, 0) : v.toExponential(0)}</th>`).join('')}</tr><tr><td>Área</td>${bs.map(v => `<td>${f3(inf ? Fi(p, v) : Fz(p, v))}</td>`).join('')}</tr>`;
    $('#imp-steps').innerHTML = A.steps([
      inf ? `Defino ∫₁^∞ x<sup>−p</sup> dx = lím<sub>b→∞</sub> ∫₁ᵇ x<sup>−p</sup> dx. ${Math.abs(p - 1) < 1e-9 ? 'Con p = 1 la primitiva es ln(b), que crece sin límite.' : `La primitiva da (b<sup>1−p</sup> − 1)/(1 − p).`}` : `Defino ∫₀¹ x<sup>−p</sup> dx = lím<sub>ε→0</sub> ∫<sub>ε</sub>¹ x<sup>−p</sup> dx. ${Math.abs(p - 1) < 1e-9 ? 'Con p = 1 la primitiva da −ln(ε), que crece sin límite.' : 'La primitiva da (1 − ε<sup>1−p</sup>)/(1 − p).'}`,
      inf ? (p > 1 ? `Como p = ${f2(p)} > 1, b<sup>1−p</sup> → 0 y la integral vale 1/(p − 1) = <b>${f4(val)}</b>. La curva baja lo bastante rápido como para que el área total sea finita.` : `Como p = ${f2(p)} ≤ 1, la expresión crece sin límite: <b>diverge</b>. Mirá la tabla: el área sigue creciendo aunque cada vez más despacio.`) : (p < 1 ? `Como p = ${f2(p)} < 1, ε<sup>1−p</sup> → 0 y la integral vale 1/(1 − p) = <b>${f4(val)}</b>. La asíntota es "angosta" y encierra un área finita.` : `Como p = ${f2(p)} ≥ 1, la curva sube demasiado rápido cerca de 0: <b>diverge</b>.`),
      `Fijate que los dos tipos se comportan al revés: en el infinito converge si p > 1, cerca de 0 converge si p < 1. Con p = 1 (la función 1/x) diverge en los dos casos.`,
      `Lo mismo pasa con las series: Σ 1/nᵖ converge exactamente cuando p > 1 (criterio de la integral). Y la normal, cuya área total es 1, es una integral impropia.`]);
    draw();
  }
  function draw() {
    if (!R) return; const { p, inf, b } = R, xr = inf ? [0, 12] : [0, 1.2], f = x => Math.pow(x, -p), g = A.ax($('#imp-cv'), xr, [0, inf ? 1.5 : 8], { l: 36 }); if (!g) return;
    if (inf) g.area(f, () => 0, 1, Math.min(b, 12), 'rgba(242,169,59,.35)'); else g.area(f, () => 0, Math.max(b, 1e-3), 1, 'rgba(242,169,59,.35)');
    g.fn(f, K.fg, 2.2, null, [inf ? .3 : .005, xr[1]]); g.vline(1, K.faint, 1, [3, 4]);
  }
}

/* ================= Series numéricas ================= */
{
  const st = { s: 'geo' }; let R = null;
  const SER = {
    geo: { n: 'Geométrica Σ rⁿ', t: (n, q) => Math.pow(q.r, n), from: 0, sum: q => Math.abs(q.r) < 1 ? 1 / (1 - q.r) : NaN, why: q => Math.abs(q.r) < 1 ? `|r| = ${f2(Math.abs(q.r))} < 1: converge a 1/(1 − r) = ${f4(1 / (1 - q.r))}. Es la base del multiplicador keynesiano y del valor presente de una perpetuidad.` : `|r| ≥ 1: los términos no van a cero, así que diverge.` },
    arm: { n: 'Armónica Σ 1/n', t: n => 1 / n, from: 1, sum: () => NaN, why: () => 'Los términos van a cero, pero la suma <b>diverge</b> (crece como ln n). Es el contraejemplo clásico: que los términos tiendan a 0 es necesario pero <b>no suficiente</b>.' },
    p: { n: 'Serie p Σ 1/nᵖ', t: (n, q) => Math.pow(n, -q.p), from: 1, sum: q => Math.abs(q.p - 2) < 1e-9 ? Math.PI ** 2 / 6 : NaN, why: q => q.p > 1 ? `p = ${f2(q.p)} > 1: converge (criterio de la integral, como en las integrales impropias).${Math.abs(q.p - 2) < 1e-9 ? ' Con p = 2 la suma es π²/6 ≈ 1,6449 (problema de Basilea, resuelto por Euler).' : ''}` : `p = ${f2(q.p)} ≤ 1: diverge.` },
    alt: { n: 'Armónica alternada Σ (−1)ⁿ⁺¹/n', t: n => (n % 2 ? 1 : -1) / n, from: 1, sum: () => Math.LN2, why: () => 'Converge a ln 2 ≈ 0,6931 por el criterio de Leibniz (términos alternados que decrecen a cero). Pero converge solo <b>condicionalmente</b>: sin los signos, es la armónica y diverge.' },
    fac: { n: 'Exponencial Σ 1/n!', t: n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return 1 / f; }, from: 0, sum: () => Math.E, why: () => 'Criterio del cociente: aₙ₊₁/aₙ = 1/(n + 1) → 0 < 1, converge, y rapidísimo. La suma es e ≈ 2,71828.' }
  };
  const D = [['r', 'Razón r', -1.2, 1.2, .01, .5, 2], ['p', 'Exponente p', .5, 3, .05, 2, 2], ['N', 'Términos sumados', 5, 200, 1, 30, 0]];
  A.tool({
    id: 'series-num', mat: 'calc1', unit: 6, ord: 0, name: 'Sucesiones y series numéricas', short: 'Series numéricas', tag: 'Convergencia', f: 'Σ aₙ = lím Sₙ',
    desc: 'Sumá infinitos términos: geométrica, armónica, serie p, alternada y exponencial, con sumas parciales y criterios de convergencia.',
    lead: 'Una serie es una suma de infinitos términos. Puede dar un número (converge) o crecer sin límite (diverge). Para saberlo se miran las sumas parciales: sumás los primeros N términos y ves si se estabilizan.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Serie</label><div class="chips">${Object.entries(SER).map(([k, v]) => `<button class="chip" data-sn="${k}">${v.n}</button>`).join('')}</div></div>${A.sliders('sn', D)}<div id="sn-pill"></div><dl class="stats" id="sn-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="sn-cv" style="height:320px"></canvas>${A.legend([['faint', 'Términos aₙ'], ['amber', 'Suma parcial Sₙ'], ['teal', 'Suma de la serie']])}<div class="explain" id="sn-exp"></div></div></div>`,
    init() { $$('[data-sn]').forEach(b => b.onclick = () => { st.s = b.dataset.sn; upd(); }); A.bindSliders('sn', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const S = SER[st.s]; $('#sn-r').closest('div').hidden = st.s !== 'geo'; $('#sn-p').closest('div').hidden = st.s !== 'p';
    $$('[data-sn]').forEach(b => b.classList.toggle('on', b.dataset.sn === st.s));
    const terms = [], sums = []; let s = 0; for (let i = 0; i < st.N; i++) { const a = S.t(S.from + i, st); s += a; terms.push(a); sums.push(s); }
    const sum = S.sum(st), conv = st.s === 'geo' ? Math.abs(st.r) < 1 : st.s === 'arm' ? false : st.s === 'p' ? st.p > 1 : true; R = { terms, sums, sum };
    $('#sn-pill').innerHTML = `<span class="pill ${conv ? 'ok' : 'bad'}">${conv ? 'Converge' : 'Diverge'}</span>`;
    $('#sn-st').innerHTML = A.stats([[`S${st.N} (suma de ${st.N} términos)`, f4(s)], ['Suma de la serie', Number.isFinite(sum) ? f4(sum) : conv ? 'finita (sin fórmula cerrada)' : '∞'], ['Último término', fmt(terms[terms.length - 1], 6)]]);
    $('#sn-exp').innerHTML = `<p>${S.why(st)}</p>`; draw();
  }
  function draw() { if (!R) return; const all = [...R.terms, ...R.sums, ...(Number.isFinite(R.sum) ? [R.sum] : [])].filter(Number.isFinite), lo = Math.min(0, ...all), hi = Math.max(...all), g = A.ax($('#sn-cv'), [0, st.N + 1], [lo - (hi - lo) * .05, hi * 1.1 || 1], { l: 48 }); if (!g) return; const bw = Math.max(1, (g.X(1) - g.X(0)) * .5); R.terms.forEach((a, i) => { g.c.fillStyle = 'rgba(160,160,180,.35)'; const y0 = g.Y(0), y1 = g.Y(a); g.c.fillRect(g.X(i + 1) - bw / 2, Math.min(y0, y1), bw, Math.abs(y1 - y0)); }); if (Number.isFinite(R.sum)) g.hline(R.sum, K.teal, 1.6, [6, 4]); g.path(R.sums.map((s, i) => [i + 1, s]), K.amber, 2.2); if (R.sums.length <= 60) R.sums.forEach((s, i) => g.dot(i + 1, s, K.amber, 2.6)); }
}

/* ===================================== CÁLCULO II ===================================== */

/* ================= Plano tangente y diferencial ================= */
{
  let f = null; const st = {}; let R = null;
  const D = [['x0', 'Punto x₀', -3, 3, .05, 1, 2], ['y0', 'Punto y₀', -3, 3, .05, 1, 2], ['dx', 'Cambio Δx', -1.5, 1.5, .01, .3, 2], ['dy', 'Cambio Δy', -1.5, 1.5, .01, -.2, 2]];
  A.tool({
    id: 'plano-tangente', mat: 'calc2', unit: 2, ord: 1, name: 'Plano tangente y diferencial total', short: 'Diferencial total', tag: 'Aproximación lineal', f: 'dz = fₓ·dx + f_y·dy',
    desc: 'Aproximá cuánto cambia una función de dos variables cuando se mueven las dos a la vez, y compará con el cambio exacto.',
    lead: 'Cerca de un punto, toda función suave se parece a un plano. El diferencial total suma lo que aporta cada variable: lo que cambia z por moverse en x (fₓ·Δx) más lo que cambia por moverse en y (f_y·Δy). Es la base de la estática comparativa.',
    body: `<div class="bench"><div class="ctrl">${fnRow('pt-f', 'f(x, y)', 'x^2*y + y^3')}${chips('pt-ex', ['x^2*y + y^3', 'x^0.5*y^0.5', 'exp(x)*sen(y)', 'ln(x^2+y^2+1)'])}${A.sliders('pt', D)}<dl class="stats" id="pt-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Corte en y = y₀ (se mueve x)</h3><canvas id="pt-x" style="height:230px"></canvas></div><div><h3>Corte en x = x₀ (se mueve y)</h3><canvas id="pt-y" style="height:230px"></canvas></div></div>${A.legend([['fg', 'Función'], ['amber', 'Recta tangente (pendiente = derivada parcial)']])}<div class="steplist" id="pt-steps"></div></div></div>`,
    init() {
      const comp = () => { const r = mkFn($('#pt-f').value, ['x', 'y']); f = r.f ? ((x, y) => { try { return r.f(x, y); } catch (e) { return NaN; } }) : null; $('#pt-f-e').textContent = r.err; };
      comp(); $('#pt-f').oninput = () => { comp(); upd(); }; $$('#pt-ex [data-fx]').forEach(b => b.onclick = () => { $('#pt-f').value = b.dataset.fx; comp(); upd(); });
      A.bindSliders('pt', D, st, upd); upd();
    },
    draw
  });
  function upd() {
    if (!f) return; const { x0, y0, dx, dy } = st, h = 1e-5, z = f(x0, y0), fx = (f(x0 + h, y0) - f(x0 - h, y0)) / (2 * h), fy = (f(x0, y0 + h) - f(x0, y0 - h)) / (2 * h);
    if (!Number.isFinite(z + fx + fy)) { $('#pt-steps').innerHTML = '<p class="err">La función no está definida en ese punto.</p>'; R = null; draw(); return; }
    const dz = fx * dx + fy * dy, ex = f(x0 + dx, y0 + dy) - z; R = { z, fx, fy };
    $('#pt-st').innerHTML = A.stats([['f(x₀, y₀)', f4(z)], ['∂f/∂x', f4(fx)], ['∂f/∂y', f4(fy)], ['Cambio aproximado dz', f4(dz)], ['Cambio exacto Δz', f4(ex)], ['Error', f4(ex - dz)]]);
    $('#pt-steps').innerHTML = A.steps([
      `En (${f2(x0)}, ${f2(y0)}) la función vale ${f4(z)}. Las derivadas parciales son las pendientes de los dos cortes: f<sub>x</sub> = ${f4(fx)} y f<sub>y</sub> = ${f4(fy)}.`,
      `Plano tangente: z ≈ ${f4(z)} + ${f4(fx)}·(x − ${f2(x0)}) + ${f4(fy)}·(y − ${f2(y0)}).`,
      `Diferencial total: dz = ${f4(fx)} × ${f2(dx)} + ${f4(fy)} × ${f2(dy)} = ${f4(fx * dx)} + ${f4(fy * dy)} = <b>${f4(dz)}</b>.`,
      `El cambio exacto es ${f4(ex)}. Error: ${f4(ex - dz)}${Math.abs(dz) > 1e-9 ? ` (${pct(Math.abs((ex - dz) / ex || 0), 1)})` : ''}. Achicá Δx y Δy: el error se achica mucho más rápido (es de segundo orden).`,
      `En economía: si f es una función de producción, dz dice cuánto cambia la producción al cambiar capital y trabajo a la vez. Con dz = 0 sale la pendiente de la isocuanta: dy/dx = −f<sub>x</sub>/f<sub>y</sub> = ${f4(-fx / fy)} (la tasa marginal de sustitución).`]);
    draw();
  }
  function draw() {
    if (!R || !f) return; const { x0, y0 } = st;
    const cut = (cv, a, fn, slope, d) => { const xs = [a - 2, a + 2]; let lo = Infinity, hi = -Infinity; for (let i = 0; i <= 60; i++) { const v = fn(xs[0] + 4 * i / 60); if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } const pad = (hi - lo) * .15 + .1, g = A.ax(cv, xs, [lo - pad, hi + pad], { l: 44 }); if (!g) return; g.fn(fn, K.fg, 2.2); g.fn(x => R.z + slope * (x - a), K.amber, 1.8); g.dot(a, R.z, K.amber, 5); g.vline(a + d, K.faint, 1, [3, 4]); g.dot(a + d, fn(a + d), K.teal, 4); g.dot(a + d, R.z + slope * d, K.amber, 3.5); };
    cut($('#pt-x'), x0, x => f(x, y0), R.fx, st.dx); cut($('#pt-y'), y0, y => f(x0, y), R.fy, st.dy);
  }
}

/* ================= Funciones homogéneas y Euler ================= */
{
  const st = {}; let R = null;
  const D = [['al', 'α (exponente del capital)', .1, 1.2, .01, .3, 2], ['be', 'β (exponente del trabajo)', .1, 1.2, .01, .7, 2], ['K', 'Capital K', 1, 100, 1, 40, 0], ['L', 'Trabajo L', 1, 100, 1, 60, 0]];
  A.tool({
    id: 'homogeneas', mat: 'calc2', unit: 2, ord: 2, name: 'Funciones homogéneas y teorema de Euler', short: 'Homogéneas y Euler', tag: 'Rendimientos a escala', f: 'f(tK, tL) = tʳ·f(K, L)',
    desc: 'Cobb-Douglas, grado de homogeneidad, rendimientos a escala y el teorema de Euler: cómo se reparte el producto entre los factores.',
    lead: 'Una función es homogénea de grado r si al multiplicar todos los insumos por t, el resultado se multiplica por tʳ. En la Cobb-Douglas Q = K^α·L^β el grado es α + β, y define los rendimientos a escala.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('hm', D)}<div id="hm-pill"></div><dl class="stats" id="hm-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Producción al escalar los insumos</h3><canvas id="hm-cv" style="height:260px"></canvas>${A.legend([['amber', 'f(tK, tL)/f(K, L)'], ['faint', 'Proporcional (t)']])}</div><div><h3>Isocuantas</h3><canvas id="hm-ct" style="height:260px"></canvas></div></div><div class="steplist" id="hm-steps"></div></div></div>`,
    init() { A.bindSliders('hm', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { al, be, K: k, L } = st, r = al + be, Q = Math.pow(k, al) * Math.pow(L, be), PK = al * Q / k, PL = be * Q / L; R = { r };
    $('#hm-pill').innerHTML = `<span class="pill ${Math.abs(r - 1) < .005 ? 'ok' : r > 1 ? 'warn' : 'bad'}">${Math.abs(r - 1) < .005 ? 'Rendimientos constantes' : r > 1 ? 'Rendimientos crecientes' : 'Rendimientos decrecientes'}</span>`;
    $('#hm-st').innerHTML = A.stats([['Grado r = α + β', f2(r)], ['Producción Q', f2(Q)], ['PMg del capital', f3(PK)], ['PMg del trabajo', f3(PL)], ['K·PMgK + L·PMgL', f2(k * PK + L * PL)]]);
    $('#hm-steps').innerHTML = A.steps([
      `Multiplico todo por t: (tK)<sup>α</sup>(tL)<sup>β</sup> = t<sup>α+β</sup>·K<sup>α</sup>L<sup>β</sup>. Es homogénea de grado <b>r = ${f2(r)}</b>. Si duplicás los insumos, la producción se multiplica por 2<sup>${f2(r)}</sup> = <b>${f3(Math.pow(2, r))}</b>.`,
      `Productos marginales: ∂Q/∂K = αQ/K = ${f3(PK)} y ∂Q/∂L = βQ/L = ${f3(PL)}. Son homogéneos de grado r − 1 = ${f2(r - 1)}: ${Math.abs(r - 1) < .005 ? 'no cambian al escalar, solo dependen de la proporción K/L.' : 'cambian al escalar.'}`,
      `<b>Teorema de Euler</b>: K·f<sub>K</sub> + L·f<sub>L</sub> = r·f. Acá: ${f2(k)} × ${f3(PK)} + ${f2(L)} × ${f3(PL)} = ${f2(k * PK + L * PL)} = ${f2(r)} × ${f2(Q)} ✓.`,
      Math.abs(r - 1) < .005 ? `Con rendimientos constantes, si cada factor cobra su producto marginal, el producto se reparte <b>exactamente</b>: el capital se lleva α = ${pct(al, 0)} y el trabajo β = ${pct(be, 0)}. No sobra ni falta nada.` : r > 1 ? `Con rendimientos crecientes, pagar a cada factor su producto marginal costaría <b>más</b> que lo producido (${pct(r - 1, 0)} de más): las empresas grandes no pueden ser competitivas, lo que lleva a monopolios naturales.` : `Con rendimientos decrecientes, pagar los productos marginales deja un <b>sobrante</b> del ${pct(1 - r, 0)}: es el beneficio que remunera a algún factor fijo (la gestión, la tierra).`,
      `Las isocuantas de una homogénea tienen la misma forma a lo largo de cualquier rayo desde el origen: la pendiente (TMST) solo depende de K/L. Por eso se llaman homotéticas.`]);
    draw();
  }
  function draw() {
    if (!R) return; const g = A.ax($('#hm-cv'), [0, 3], [0, Math.max(3, Math.pow(3, R.r)) * 1.05], { l: 36 }); if (g) { g.fn(t => t, K.faint, 1.5, [5, 4]); g.fn(t => Math.pow(t, R.r), K.amber, 2.4); g.guide(2, Math.pow(2, R.r)); g.dot(2, Math.pow(2, R.r), K.amber, 5); g.labels('t', 'veces la producción'); }
    A.contour($('#hm-ct'), (x, y) => Math.pow(x, st.al) * Math.pow(y, st.be), [.01, 100], [.01, 100], 10, c => { c.c.fillStyle = K.fg; c.c.beginPath(); c.c.arc(c.X(st.K), c.Y(st.L), 5, 0, 7); c.c.fill(); c.c.strokeStyle = K.faint; c.c.setLineDash([3, 4]); c.c.beginPath(); c.c.moveTo(c.X(0.01), c.Y(0.01)); c.c.lineTo(c.X(100), c.Y(100 * st.L / st.K)); c.c.stroke(); c.c.setLineDash([]); });
  }
}

/* ================= Concavidad y cuasiconcavidad ================= */
{
  let f = null, R = null;
  const PRE = [['x^0.3*y^0.3', 'Cobb-Douglas con rendimientos decrecientes'], ['x^0.8*y^0.8', 'Cobb-Douglas con rendimientos crecientes'], ['x*y', 'Producto x·y'], ['raiz(x) + raiz(y)', 'Suma de raíces'], ['x^2 + y^2', 'Paraboloide'], ['-(x-2)^2 - (y-2)^2', 'Paraboloide invertido']];
  A.tool({
    id: 'concavidad', mat: 'calc2', unit: 3, ord: 0, name: 'Concavidad, convexidad y cuasiconcavidad', short: 'Concavidad', tag: 'Formas de funciones', f: 'H semidefinida negativa ⇒ cóncava',
    desc: 'Clasificá funciones de dos variables según su forma, y entendé por qué a la economía le alcanza con la cuasiconcavidad.',
    lead: 'Una función cóncava tiene forma de cúpula: el segmento entre dos puntos queda debajo. La cuasiconcavidad es más débil: solo pide que los conjuntos "f ≥ c" sean convexos, es decir, que las curvas de nivel se doblen hacia el origen. Es lo que se le pide a una función de utilidad.',
    body: `<div class="bench"><div class="ctrl">${fnRow('cvx-f', 'f(x, y), con x, y > 0', 'x^0.8*y^0.8')}<div><label class="l">Ejemplos</label><div class="chips">${PRE.map(p => `<button class="chip" data-cvx="${p[0]}">${p[1]}</button>`).join('')}</div></div><div id="cvx-pill" style="display:flex;flex-direction:column;gap:6px;align-items:flex-start"></div></div>
      <div class="stage"><h3>Curvas de nivel y diagnóstico en cada punto</h3><canvas id="cvx-cv" style="width:min(100%,460px);aspect-ratio:1;align-self:center"></canvas>${A.legend([['teal', 'Cóncava localmente'], ['amber', 'Solo cuasicóncava'], ['violet', 'Convexa localmente'], ['rose', 'Ninguna']])}<div class="steplist" id="cvx-steps"></div></div></div>`,
    init() { const comp = () => { const r = mkFn($('#cvx-f').value, ['x', 'y']); f = r.f ? ((x, y) => { try { return r.f(x, y); } catch (e) { return NaN; } }) : null; $('#cvx-f-e').textContent = r.err; }; comp(); $('#cvx-f').oninput = () => { comp(); upd(); }; $$('[data-cvx]').forEach(b => b.onclick = () => { $('#cvx-f').value = b.dataset.cvx; comp(); upd(); }); upd(); },
    draw
  });
  const D = [.3, 4];
  function classify(x, y) {
    const h = 1e-3, z = f(x, y), fx = (f(x + h, y) - f(x - h, y)) / (2 * h), fy = (f(x, y + h) - f(x, y - h)) / (2 * h), fxx = (f(x + h, y) - 2 * z + f(x - h, y)) / (h * h), fyy = (f(x, y + h) - 2 * z + f(x, y - h)) / (h * h), fxy = (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
    const det = fxx * fyy - fxy * fxy, tol = 1e-6 * (1 + Math.abs(fxx) + Math.abs(fyy));
    const cav = fxx <= tol && fyy <= tol && det >= -tol, vex = fxx >= -tol && fyy >= -tol && det >= -tol, B = fy * fy * fxx - 2 * fx * fy * fxy + fx * fx * fyy, qc = B <= tol * (fx * fx + fy * fy + 1);
    return { cav, vex, qc, fxx, fyy, fxy, det, B };
  }
  function upd() {
    if (!f) return; const pts = []; let nc = 0, nq = 0, nv = 0;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { const x = D[0] + (D[1] - D[0]) * (i + .5) / 9, y = D[0] + (D[1] - D[0]) * (j + .5) / 9, c = classify(x, y); pts.push([x, y, c]); nc += c.cav; nq += c.qc; nv += c.vex; }
    const N = pts.length, cav = nc === N, qc = nq === N, vex = nv === N, s = classify(2, 2); R = { pts };
    $('#cvx-pill').innerHTML = `<span class="pill ${cav ? 'ok' : 'bad'}">${cav ? 'Cóncava' : 'No es cóncava'}</span><span class="pill ${qc ? 'ok' : 'bad'}">${qc ? 'Cuasicóncava' : 'No es cuasicóncava'}</span><span class="pill ${vex ? 'ok' : ''}">${vex ? 'Convexa' : 'No es convexa'}</span>`;
    $('#cvx-steps').innerHTML = A.steps([
      `Concavidad: el hessiano tiene que ser semidefinido negativo en todo el dominio (f<sub>xx</sub> ≤ 0, f<sub>yy</sub> ≤ 0 y det H ≥ 0). En (2, 2): f<sub>xx</sub> = ${f3(s.fxx)}, f<sub>yy</sub> = ${f3(s.fyy)}, f<sub>xy</sub> = ${f3(s.fxy)}, det H = ${f3(s.det)}. ${cav ? 'Se cumple en todos los puntos analizados.' : `Falla en ${N - nc} de ${N} puntos.`}`,
      `Cuasiconcavidad: con dos variables, alcanza con que f<sub>y</sub>²f<sub>xx</sub> − 2f<sub>x</sub>f<sub>y</sub>f<sub>xy</sub> + f<sub>x</sub>²f<sub>yy</sub> ≤ 0 (viene del hessiano orlado). En (2, 2) vale ${f3(s.B)}. ${qc ? 'Se cumple en todo el dominio: las curvas de nivel son convexas hacia el origen.' : `Falla en ${N - nq} puntos.`}`,
      cav ? 'Toda función cóncava es cuasicóncava, pero no al revés.' : qc ? `<b>Este es el caso interesante</b>: no es cóncava (la superficie se curva hacia arriba en alguna dirección), pero sí cuasicóncava. Para el consumidor alcanza: lo que importa es la forma de las curvas de indiferencia, no la "altura" de la utilidad.` : 'Sin cuasiconcavidad, las curvas de nivel se doblan para el otro lado y la tangencia puede dar un mínimo en vez de un máximo.',
      `Por qué importa: maximizando una función cuasicóncava sobre un conjunto convexo (como la recta de presupuesto), la condición de tangencia de Lagrange garantiza un <b>máximo</b>. Y una transformación creciente (como ln o elevar al cuadrado) conserva la cuasiconcavidad pero puede romper la concavidad.`]);
    draw();
  }
  function draw() { if (!f || !R) return; const col = c => c.cav ? K.teal : c.vex ? K.violet : c.qc ? K.amber : K.rose; A.contour($('#cvx-cv'), f, D, D, 12, g => R.pts.forEach(([x, y, c]) => { g.c.fillStyle = col(c); g.c.beginPath(); g.c.arc(g.X(x), g.Y(y), 4.5, 0, 7); g.c.fill(); g.c.strokeStyle = K.bg; g.c.lineWidth = 1.5; g.c.stroke(); })); }
}

/* ===================================== CÁLCULO III ===================================== */

/* ================= EDO de primer orden: modelos y Euler ================= */
{
  const st = { m: 'log' }; let R = null;
  const D = [['r', 'Tasa r (o k)', .05, 2, .01, .6, 2], ['y0', 'Valor inicial y(0)', 1, 100, 1, 5, 0], ['K', 'Capacidad K (o temperatura ambiente)', 10, 200, 1, 100, 0], ['h', 'Paso de Euler h', .05, 2, .05, .5, 2]];
  const M = {
    exp: { n: 'Crecimiento exponencial', eq: "y′ = r·y", F: (y, s) => s.r * y, sol: (t, s) => s.y0 * Math.exp(s.r * t), T: 6 },
    log: { n: 'Logístico', eq: "y′ = r·y·(1 − y/K)", F: (y, s) => s.r * y * (1 - y / s.K), sol: (t, s) => s.K / (1 + (s.K / s.y0 - 1) * Math.exp(-s.r * t)), T: 14 },
    enf: { n: 'Enfriamiento de Newton', eq: "y′ = −k·(y − Tₐ)", F: (y, s) => -s.r * (y - s.K), sol: (t, s) => s.K + (s.y0 - s.K) * Math.exp(-s.r * t), T: 10 }
  };
  A.tool({
    id: 'edo-modelos', mat: 'calc3', unit: 1, ord: 1, name: 'EDO de primer orden: modelos y método de Euler', short: 'Modelos y Euler', tag: 'Solución analítica y numérica', f: 'yₙ₊₁ = yₙ + h·f(tₙ, yₙ)',
    desc: 'Crecimiento exponencial, logístico y enfriamiento: la solución exacta comparada con la aproximación numérica de Euler.',
    lead: 'Muchas ecuaciones diferenciales tienen solución exacta (separando variables), pero la mayoría no. Entonces se aproxima con métodos numéricos: el más simple, Euler, avanza en pasitos usando la pendiente del punto actual.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Modelo</label>${A.seg('ed1-m', Object.entries(M).map(([k, v]) => [k, v.n]), 'log')}</div>${A.sliders('ed1', D)}<dl class="stats" id="ed1-st" style="margin:0"></dl></div>
      <div class="stage"><div class="mono" id="ed1-eq" style="font-size:16px;color:var(--amber)"></div><canvas id="ed1-cv" style="height:320px"></canvas>${A.legend([['teal', 'Solución exacta'], ['amber', 'Euler con paso h']])}<div class="steplist" id="ed1-steps"></div></div></div>`,
    init() { A.bindSliders('ed1', D, st, upd); A.segBind('ed1-m', v => { st.m = v; if (v === 'enf') { A.setSlider('ed1', 'y0', 90, st, 0); A.setSlider('ed1', 'K', 20, st, 0); A.setSlider('ed1', 'r', .3, st); } upd(); }); upd(); },
    draw
  });
  function upd() {
    const m = M[st.m]; $('#ed1-K').closest('div').hidden = st.m === 'exp'; $('#ed1-eq').textContent = m.eq;
    const eu = [[0, st.y0]]; let y = st.y0; for (let t = 0; t < m.T - 1e-9; t += st.h) { y = y + st.h * m.F(y, st); eu.push([t + st.h, y]); }
    const last = eu[eu.length - 1], ex = m.sol(last[0], st); R = { eu, m };
    $('#ed1-st').innerHTML = A.stats([[`Exacta en t = ${f2(last[0])}`, f3(ex)], ['Euler', f3(last[1])], ['Error relativo', pct(Math.abs(last[1] - ex) / Math.abs(ex), 2)]]);
    $('#ed1-steps').innerHTML = A.steps([
      st.m === 'exp' ? `Separando variables: dy/y = r·dt → ln y = rt + C → <b>y(t) = ${f2(st.y0)}·e<sup>${f2(st.r)}t</sup></b>. Se duplica cada ln2/r = ${f2(Math.LN2 / st.r)} unidades de tiempo.` : st.m === 'log' ? `La logística arranca casi exponencial y frena al acercarse a la capacidad K = ${f2(st.K)}. Solución: <b>y(t) = K / (1 + (K/y₀ − 1)·e<sup>−rt</sup>)</b>. El crecimiento es máximo en y = K/2 (punto de inflexión). Modela poblaciones, adopción de tecnologías y difusión de productos.` : `La temperatura se acerca exponencialmente a la del ambiente: <b>y(t) = Tₐ + (y₀ − Tₐ)·e<sup>−kt</sup></b>. La diferencia se reduce a la mitad cada ln2/k = ${f2(Math.LN2 / st.r)}.`,
      `Euler: desde (t<sub>n</sub>, y<sub>n</sub>) avanzo h = ${f2(st.h)} siguiendo la pendiente de ese punto: y<sub>n+1</sub> = y<sub>n</sub> + h·f(y<sub>n</sub>). Primer paso: ${f2(st.y0)} + ${f2(st.h)} × ${f3(m.F(st.y0, st))} = ${f3(eu[1][1])}.`,
      `El error en t = ${f2(last[0])} es ${pct(Math.abs(last[1] - ex) / Math.abs(ex), 2)}. Euler es de orden 1: si achicás h a la mitad, el error baja más o menos a la mitad. ${st.h * st.r > 1.5 && st.m !== 'exp' ? '<b>Con un paso tan grande, Euler se vuelve inestable y oscila.</b>' : 'Probá con h grande y r grande: el método se vuelve inestable.'}`,
      `En la práctica se usan métodos de orden más alto, como Runge-Kutta de orden 4, que es el que usamos en los otros simuladores de ecuaciones diferenciales del sitio.`]);
    draw();
  }
  function draw() { if (!R) return; const ys = R.eu.map(p => p[1]).filter(Number.isFinite), ex = []; for (let i = 0; i <= 200; i++) ex.push(R.m.sol(R.m.T * i / 200, st)); const hi = Math.min(Math.max(...ys, ...ex) * 1.1, Math.max(...ex) * 3), lo = Math.min(0, ...ex), g = A.ax($('#ed1-cv'), [0, R.m.T], [lo, hi], { l: 44 }); if (!g) return; if (st.m !== 'exp') g.hline(st.K, K.faint, 1, [4, 4]); g.fn(t => R.m.sol(t, st), K.teal, 2.4); g.path(R.eu, K.amber, 1.8); R.eu.forEach(([t, y]) => g.dot(t, y, K.amber, 3.2)); g.labels('t', 'y'); }
}

/* ================= EDO de segundo orden ================= */
{
  const st = {}; let R = null;
  const D = [['a', 'Amortiguamiento a', -1, 4, .05, .5, 2], ['b', 'Rigidez b', .1, 10, .05, 4, 2], ['y0', 'Posición inicial y(0)', -3, 3, .1, 2, 1], ['v0', 'Velocidad inicial y′(0)', -5, 5, .1, 0, 1]];
  A.tool({
    id: 'edo2', mat: 'calc3', unit: 2, ord: 0, name: 'Ecuaciones diferenciales lineales de segundo orden', short: 'Segundo orden', tag: 'Ecuación característica', f: "y″ + a·y′ + b·y = 0",
    desc: 'Oscilaciones amortiguadas: las raíces de la ecuación característica deciden si la solución oscila, converge o explota.',
    lead: 'La ecuación y″ + a·y′ + b·y = 0 describe un resorte con fricción, un circuito o un ciclo económico (el modelo multiplicador-acelerador de Samuelson). Se prueba y = e^(rt), y aparece la ecuación característica r² + a·r + b = 0.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ed2', D)}<div id="ed2-pill"></div><dl class="stats" id="ed2-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2" style="grid-template-columns:2fr 1fr"><div><h3>Solución y(t)</h3><canvas id="ed2-cv" style="height:280px"></canvas></div><div><h3>Raíces en el plano complejo</h3><canvas id="ed2-rt" style="height:280px"></canvas></div></div><div class="steplist" id="ed2-steps"></div></div></div>`,
    init() { A.bindSliders('ed2', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { a, b, y0, v0 } = st, disc = a * a - 4 * b, re = -a / 2, im = disc < 0 ? Math.sqrt(-disc) / 2 : 0, r1 = disc >= 0 ? (-a + Math.sqrt(disc)) / 2 : re, r2 = disc >= 0 ? (-a - Math.sqrt(disc)) / 2 : re;
    const kind = a < 0 ? ['Inestable: las oscilaciones crecen', 'bad'] : a === 0 ? ['Sin amortiguamiento: oscila para siempre', 'warn'] : Math.abs(disc) < 1e-3 ? ['Amortiguamiento crítico', 'ok'] : disc > 0 ? ['Sobreamortiguado: vuelve sin oscilar', 'ok'] : ['Subamortiguado: oscila y se apaga', 'ok'];
    const pts = []; let y = [y0, v0]; const T = 20, h = .02; for (let t = 0; t <= T + 1e-9; t += h) { pts.push([t, y[0]]); y = rk4((t, Y) => [Y[1], -a * Y[1] - b * Y[0]], y, t, h); }
    R = { pts, roots: disc >= 0 ? [[r1, 0], [r2, 0]] : [[re, im], [re, -im]] };
    $('#ed2-pill').innerHTML = `<span class="pill ${kind[1]}">${kind[0]}</span>`;
    $('#ed2-st').innerHTML = A.stats([['Discriminante a² − 4b', f3(disc)], ['Raíces', disc >= 0 ? `${f3(r1)} y ${f3(r2)}` : `${f3(re)} ± ${f3(im)}i`], ...(disc < 0 ? [['Período de oscilación', f3(2 * Math.PI / im)]] : [])]);
    $('#ed2-steps').innerHTML = A.steps([
      `Ecuación característica: r² + ${f2(a)}r + ${f2(b)} = 0 → r = (−a ± √(a² − 4b))/2, con discriminante ${f3(disc)}.`,
      disc > 1e-3 ? `Dos raíces reales distintas: r₁ = ${f3(r1)}, r₂ = ${f3(r2)}. Solución general: <b>y = C₁e<sup>${f2(r1)}t</sup> + C₂e<sup>${f2(r2)}t</sup></b>. Sin senos ni cosenos: no hay oscilación.` : disc < -1e-3 ? `Raíces complejas: ${f3(re)} ± ${f3(im)}i. Solución general: <b>y = e<sup>${f2(re)}t</sup>(C₁cos(${f2(im)}t) + C₂sen(${f2(im)}t))</b>. La parte imaginaria da la frecuencia de oscilación y la parte real, si crece o se apaga.` : `Raíz doble r = ${f3(re)}. Solución general: <b>y = (C₁ + C₂t)·e<sup>${f2(re)}t</sup></b>. Es el borde entre oscilar y no oscilar: vuelve al equilibrio lo más rápido posible sin pasarse.`,
      `Las constantes C₁ y C₂ salen de las condiciones iniciales y(0) = ${f2(y0)} e y′(0) = ${f2(v0)}.`,
      `La regla de oro: si las dos raíces tienen <b>parte real negativa</b> (están a la izquierda del eje en el gráfico de la derecha), la solución vuelve al equilibrio. ${a < 0 ? 'Acá la parte real es positiva: el sistema explota.' : a === 0 ? 'Con parte real cero, oscila sin parar.' : ''}`]);
    draw();
  }
  function draw() {
    if (!R) return; const ys = R.pts.map(p => p[1]), m = Math.min(Math.max(...ys.map(Math.abs)) * 1.1, 50) || 1, g = A.ax($('#ed2-cv'), [0, 20], [-m, m], { l: 40 }); if (g) { g.hline(0, K.faint, 1); g.path(R.pts, K.amber, 2.2); }
    const M = Math.max(2, ...R.roots.flat().map(Math.abs)) * 1.2, r = A.ax($('#ed2-rt'), [-M, M], [-M, M], { l: 32 }); if (r) { r.poly([[-M, -M], [0, -M], [0, M], [-M, M]], 'rgba(67,200,184,.08)'); r.vline(0, K.faint, 1); r.hline(0, K.faint, 1); R.roots.forEach(([x, y]) => r.dot(x, y, K.rose, 6)); r.labels('Re', 'Im'); }
  }
}

/* ================= Sistemas lineales: diagrama de fases ================= */
{
  let P = null; const st = {}; let R = null;
  const D = [['a', 'a', -3, 3, .1, -.5, 1], ['b', 'b', -3, 3, .1, 1, 1], ['c', 'c', -3, 3, .1, -1, 1], ['d', 'd', -3, 3, .1, -.5, 1]];
  const PRE = { foco: [-.5, 1, -1, -.5], nodo: [-2, 0, 0, -1], silla: [1, 0, 0, -1], centro: [0, 1, -1, 0], inest: [.3, 1, -1, .3], nodoI: [1.5, .5, .5, 1] };
  A.tool({
    id: 'fases-lineal', mat: 'calc3', unit: 3, ord: 0, name: 'Sistemas lineales y diagrama de fases', short: 'Diagrama de fases', tag: 'Autovalores y estabilidad', f: "X′ = A·X",
    desc: 'Un sistema de dos ecuaciones diferenciales lineales: los autovalores de la matriz deciden si es nodo, silla, foco o centro.',
    lead: 'Con dos variables que se afectan mutuamente (x′ = ax + by, y′ = cx + dy), el diagrama de fases muestra hacia dónde se mueve el sistema desde cada punto. Todo depende de la traza y el determinante de la matriz. Hacé clic en el gráfico para lanzar una trayectoria.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Ejemplos</label><div class="chips">${[['foco', 'Foco estable'], ['nodo', 'Nodo estable'], ['silla', 'Punto de silla'], ['centro', 'Centro'], ['inest', 'Foco inestable'], ['nodoI', 'Nodo inestable']].map(([k, l]) => `<button class="chip" data-fl="${k}">${l}</button>`).join('')}</div></div>
      <p class="mono" style="margin:0">x′ = a·x + b·y<br>y′ = c·x + d·y</p>${A.sliders('fl', D)}<button class="btn sm" id="fl-clr" style="align-self:flex-start">Borrar trayectorias</button><div id="fl-pill"></div><dl class="stats" id="fl-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="fl-cv" style="height:420px;background:var(--bg)"></canvas><div class="steplist" id="fl-steps"></div></div></div>`,
    init() {
      A.bindSliders('fl', D, st, () => { seed(); upd(); }); $$('[data-fl]').forEach(b => b.onclick = () => { PRE[b.dataset.fl].forEach((v, i) => A.setSlider('fl', 'abcd'[i], v, st, 1)); seed(); upd(); });
      $('#fl-clr').onclick = () => { R.tr = []; P.draw(); };
      P = A.plane($('#fl-cv'), { span: 8, pan: false, layers, grab: (a, px, py) => { R.tr.push(traj(a.WX(px), a.WY(py))); P.draw(); return null; } }); seed(); upd();
    },
    draw: () => P && P.draw()
  });
  const F = (t, [x, y]) => [st.a * x + st.b * y, st.c * x + st.d * y];
  function traj(x, y) { const out = [[x, y]]; let Y = [x, y]; for (let i = 0; i < 1500; i++) { Y = rk4(F, Y, 0, .01); if (!Y.every(v => Math.abs(v) < 40)) break; out.push(Y); } const back = []; Y = [x, y]; for (let i = 0; i < 600; i++) { Y = rk4((t, v) => F(t, v).map(z => -z), Y, 0, .01); if (!Y.every(v => Math.abs(v) < 40)) break; back.push(Y); } return [...back.reverse(), ...out]; }
  function seed() { R = R || {}; R.tr = []; for (let k = 0; k < 8; k++) { const t = k / 8 * 2 * Math.PI; R.tr.push(traj(3 * Math.cos(t), 3 * Math.sin(t))); } }
  function upd() {
    const { a, b, c, d } = st, tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det, l1 = disc >= 0 ? (tr + Math.sqrt(disc)) / 2 : tr / 2, l2 = disc >= 0 ? (tr - Math.sqrt(disc)) / 2 : tr / 2, im = disc < 0 ? Math.sqrt(-disc) / 2 : 0;
    let kind; if (Math.abs(det) < 1e-9) kind = ['Degenerado (det = 0): una recta de equilibrios', 'warn']; else if (det < 0) kind = ['Punto de silla (inestable)', 'bad']; else if (disc < 0) kind = Math.abs(tr) < 1e-9 ? ['Centro: órbitas cerradas', 'warn'] : tr < 0 ? ['Foco estable: espiral hacia el origen', 'ok'] : ['Foco inestable: espiral hacia afuera', 'bad']; else kind = tr < 0 ? ['Nodo estable', 'ok'] : ['Nodo inestable', 'bad'];
    R.ev = disc >= 0 && Math.abs(det) > 1e-9 ? [l1, l2].map(l => { const v = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : (Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1]); const n = Math.hypot(...v); return v.map(z => z / n); }) : null;
    $('#fl-pill').innerHTML = `<span class="pill ${kind[1]}">${kind[0]}</span>`;
    $('#fl-st').innerHTML = A.stats([['Traza', f2(tr)], ['Determinante', f2(det)], ['Autovalores', disc >= 0 ? `${f3(l1)} y ${f3(l2)}` : `${f3(tr / 2)} ± ${f3(im)}i`]]);
    $('#fl-steps').innerHTML = A.steps([
      `La matriz es A = [[${f2(a)}, ${f2(b)}], [${f2(c)}, ${f2(d)}]]. El único equilibrio (si det ≠ 0) es el origen.`,
      `Autovalores: λ² − (traza)λ + det = 0 → λ² − ${f2(tr)}λ + ${f2(det)} = 0. Discriminante: ${f3(disc)}.`,
      det < 0 ? 'Determinante negativo → autovalores reales de distinto signo: <b>silla</b>. Hay una única dirección (la recta en naranja) por la que se llega al equilibrio; desde cualquier otro punto el sistema se escapa. Es lo que pasa en muchos modelos de expectativas racionales: la economía tiene que "saltar" a esa senda.' : disc < 0 ? `Autovalores complejos → las trayectorias giran. La parte real (${f3(tr / 2)}) decide: ${tr < 0 ? 'negativa, espiral hacia adentro.' : tr > 0 ? 'positiva, espiral hacia afuera.' : 'cero, órbitas cerradas (como el predador-presa).'}` : `Autovalores reales del mismo signo → <b>nodo</b>. ${tr < 0 ? 'Ambos negativos: todo converge al origen, siguiendo al final la dirección del autovalor más chico en valor absoluto.' : 'Ambos positivos: todo se aleja.'} Las rectas naranjas son los autovectores: trayectorias que van en línea recta.`,
      `Regla rápida: estable si y solo si <b>traza < 0 y determinante > 0</b>. Así se analiza la estabilidad de cualquier sistema no lineal cerca de un equilibrio (linealizando con el jacobiano).`]);
    P.draw();
  }
  function layers(p) {
    if (!R) return; const step = p.w < 600 ? 1 : .8;
    for (let x = Math.ceil(p.x0 / step) * step; x <= p.x1; x += step) for (let y = Math.ceil(p.y0 / step) * step; y <= p.y1; y += step) { const [u, v] = F(0, [x, y]), n = Math.hypot(u, v); if (n < 1e-9) continue; const L = step * .35; p.line(x - u / n * L / 2, y - v / n * L / 2, x + u / n * L / 2, y + v / n * L / 2, 'rgba(160,160,180,.35)', 1.2); }
    if (R.ev) R.ev.forEach(([u, v]) => p.line(-20 * u, -20 * v, 20 * u, 20 * v, 'rgba(242,169,59,.6)', 1.6, [6, 4]));
    R.tr.forEach(t => { p.c.save(); p.c.strokeStyle = K.teal; p.c.lineWidth = 1.8; p.c.beginPath(); t.forEach(([x, y], i) => i ? p.c.lineTo(p.PX(x), p.PY(y)) : p.c.moveTo(p.PX(x), p.PY(y))); p.c.stroke(); p.c.restore(); });
    p.dot(0, 0, K.fg, 5);
  }
}

/* ================= Ecuaciones en diferencias ================= */
{
  const st = {}; let R = null;
  const D = [['a', 'Coeficiente a', -1.5, 1.5, .01, .6, 2], ['b', 'Constante b', -10, 10, .1, 4, 1], ['y0', 'Valor inicial y₀', -20, 30, .5, 1, 1]];
  A.tool({
    id: 'diferencias', mat: 'calc3', unit: 4, ord: 0, name: 'Ecuaciones en diferencias de primer orden', short: 'Ecuaciones en diferencias', tag: 'Tiempo discreto', f: 'yₜ₊₁ = a·yₜ + b',
    desc: 'La versión en tiempo discreto de las ecuaciones diferenciales: equilibrio, convergencia monótona u oscilante y divergencia.',
    lead: 'En economía muchas cosas se miden por período (años, trimestres): la deuda de este año depende de la del año pasado. La ecuación yₜ₊₁ = a·yₜ + b es la más simple, y su comportamiento depende solo de a.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('dif', D)}<div id="dif-pill"></div><dl class="stats" id="dif-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Trayectoria en el tiempo</h3><canvas id="dif-t" style="height:260px"></canvas></div><div><h3>Diagrama de escalera</h3><canvas id="dif-e" style="height:260px"></canvas></div></div><div class="steplist" id="dif-steps"></div></div></div>`,
    init() { A.bindSliders('dif', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { a, b, y0 } = st, eq = Math.abs(1 - a) > 1e-9 ? b / (1 - a) : NaN, ys = [y0]; for (let t = 0; t < 30; t++) ys.push(a * ys[t] + b);
    const kind = Math.abs(a - 1) < 1e-9 ? ['Sin equilibrio (a = 1): crece linealmente', 'bad'] : Math.abs(a) < 1 ? (a >= 0 ? ['Converge sin oscilar', 'ok'] : ['Converge oscilando', 'ok']) : Math.abs(a + 1) < 1e-9 ? ['Oscila entre dos valores', 'warn'] : a > 1 ? ['Diverge de forma monótona', 'bad'] : ['Diverge oscilando', 'bad'];
    R = { ys, eq };
    $('#dif-pill').innerHTML = `<span class="pill ${kind[1]}">${kind[0]}</span>`;
    $('#dif-st').innerHTML = A.stats([['Equilibrio y*', Number.isFinite(eq) ? f3(eq) : '—'], ['y₁₀', f3(ys[10])], ['y₃₀', f3(ys[30])]]);
    $('#dif-steps').innerHTML = A.steps([
      `Equilibrio: el valor que se repite, y* = a·y* + b → <b>y* = b/(1 − a) = ${Number.isFinite(eq) ? f3(eq) : 'no existe'}</b>.`,
      Number.isFinite(eq) ? `Solución: <b>y<sub>t</sub> = y* + (y₀ − y*)·a<sup>t</sup></b> = ${f3(eq)} + (${f3(y0 - eq)})·(${f2(a)})<sup>t</sup>. La distancia al equilibrio se multiplica por a en cada período.` : 'Con a = 1 cada período suma b: y<sub>t</sub> = y₀ + b·t.',
      `Comportamiento: |a| < 1 converge; |a| > 1 diverge. Si a es negativo, los valores <b>saltan</b> de un lado al otro del equilibrio. Comparado con las ecuaciones diferenciales, acá aparece algo nuevo: la oscilación con una sola ecuación.`,
      `Diagrama de escalera: se sube a la recta y<sub>t+1</sub> = a·y<sub>t</sub> + b, se va horizontal hasta la diagonal de 45° (que convierte el resultado en el nuevo y<sub>t</sub>) y se repite. El equilibrio está donde la recta corta la diagonal.`,
      `Ejemplo: deuda/PBI con a = (1 + i)/(1 + g) y b = déficit primario. Si la tasa de interés supera al crecimiento, a > 1 y la deuda es explosiva.`]);
    draw();
  }
  function draw() {
    if (!R) return; const ys = R.ys.filter(v => Math.abs(v) < 1e4), m = Math.max(5, ...ys.map(Math.abs), Number.isFinite(R.eq) ? Math.abs(R.eq) : 0) * 1.1;
    const t = A.ax($('#dif-t'), [0, 30], [Math.min(0, ...ys) * 1.1 - .5, Math.max(...ys, 0) * 1.1 + .5], { l: 44 }); if (t) { if (Number.isFinite(R.eq)) t.hline(R.eq, K.faint, 1, [4, 4]); t.path(R.ys.map((y, i) => [i, y]), K.amber, 1.4); R.ys.forEach((y, i) => t.dot(i, y, K.amber, 3)); }
    const lo = Math.min(-1, ...ys.slice(0, 15)) - 1, hi = Math.max(...ys.slice(0, 15), Number.isFinite(R.eq) ? R.eq : 0) + 2, e = A.ax($('#dif-e'), [lo, hi], [lo, hi], { l: 40 }); if (!e) return;
    e.fn(x => x, K.faint, 1.4, [5, 4]); e.fn(x => st.a * x + st.b, K.teal, 2.2);
    const path = [[R.ys[0], lo]]; for (let i = 0; i < 25; i++) { path.push([R.ys[i], R.ys[i + 1]]); path.push([R.ys[i + 1], R.ys[i + 1]]); } e.path(path, K.amber, 1.4); e.dot(R.ys[0], R.ys[0], K.amber, 4); if (Number.isFinite(R.eq)) e.dot(R.eq, R.eq, K.fg, 5); e.labels('yₜ', 'yₜ₊₁');
  }
}

/* ================= Modelo de la telaraña ================= */
{
  const st = {}; let R = null;
  const D = [['a', 'Demanda: ordenada a', 20, 100, 1, 60, 0], ['b', 'Demanda: pendiente b', .2, 3, .05, 1, 2], ['c', 'Oferta: ordenada c', -20, 20, 1, 0, 0], ['d', 'Oferta: pendiente d', .2, 3, .05, .8, 2], ['P0', 'Precio inicial P₀', 0, 60, .5, 15, 1]];
  A.tool({
    id: 'telarana', mat: 'calc3', unit: 4, ord: 1, name: 'Modelo de la telaraña', short: 'Telaraña', tag: 'Dinámica de precios', f: 'Pₜ = (a − c − d·Pₜ₋₁)/b',
    desc: 'Los productores deciden cuánto sembrar mirando el precio del año pasado. El precio puede converger al equilibrio, oscilar para siempre o volverse cada vez más inestable.',
    lead: 'Un clásico: los productores agrícolas eligen cuánto producir hoy según el precio del período anterior (Qˢₜ = c + d·Pₜ₋₁). Pero el precio de hoy lo fija la demanda (Qᵈₜ = a − b·Pₜ). Esa demora genera ciclos, y el gráfico parece una telaraña.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('tl', D)}<div id="tl-pill"></div><dl class="stats" id="tl-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Oferta, demanda y telaraña</h3><canvas id="tl-cv" style="height:300px"></canvas>${A.legend([['teal', 'Demanda'], ['rose', 'Oferta'], ['amber', 'Ajuste']])}</div><div><h3>Precio por período</h3><canvas id="tl-p" style="height:300px"></canvas></div></div><div class="steplist" id="tl-steps"></div></div></div>`,
    init() { A.bindSliders('tl', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { a, b, c, d, P0 } = st, Pe = (a - c) / (b + d), Qe = a - b * Pe, r = -d / b, Ps = [P0]; for (let t = 0; t < 25; t++) Ps.push((a - c - d * Ps[t]) / b);
    R = { Ps, Pe, Qe }; const k = d / b;
    $('#tl-pill').innerHTML = `<span class="pill ${k < .99 ? 'ok' : k > 1.01 ? 'bad' : 'warn'}">${k < .99 ? 'Converge al equilibrio' : k > 1.01 ? 'Explosivo: las oscilaciones crecen' : 'Ciclo permanente'}</span>`;
    $('#tl-st').innerHTML = A.stats([['Precio de equilibrio', f2(Pe)], ['Cantidad de equilibrio', f2(Qe)], ['d/b', f3(k)]]);
    $('#tl-steps').innerHTML = A.steps([
      `Igualando oferta y demanda en cada período: a − b·P<sub>t</sub> = c + d·P<sub>t−1</sub> → <b>P<sub>t</sub> = ${f3((a - c) / b)} − ${f3(k)}·P<sub>t−1</sub></b>. Es una ecuación en diferencias con a = −d/b = ${f3(r)}.`,
      `Equilibrio: P* = (a − c)/(b + d) = <b>${f2(Pe)}</b>, Q* = ${f2(Qe)}.`,
      `Como el coeficiente −d/b es negativo, el precio siempre <b>oscila</b>: año caro → se siembra mucho → al año siguiente sobra y el precio cae → se siembra poco → vuelve a subir.`,
      k < 1 ? `|d/b| = ${f3(k)} < 1: la oferta es menos sensible al precio que la demanda, y las oscilaciones se van achicando hasta el equilibrio.` : k > 1 ? `|d/b| = ${f3(k)} > 1: la oferta reacciona más que la demanda y cada error se agranda. En la práctica los precios no explotan porque los productores aprenden (expectativas adaptativas o racionales).` : 'd = b: el precio oscila para siempre entre dos valores.']);
    draw();
  }
  function draw() {
    if (!R) return; const { a, b, c, d } = st, Pm = Math.max(a / b, ...R.Ps.slice(0, 12)) * 1.05, Qm = Math.max(a, c + d * Pm) * 1.05;
    const g = A.ax($('#tl-cv'), [0, Qm], [0, Pm], { l: 40 }); if (g) { g.path([[a, 0], [a - b * Pm, Pm]], K.teal, 2.2); g.path([[c, 0], [c + d * Pm, Pm]].map(([q, p]) => [q, p]), K.rose, 2.2); const pts = []; for (let t = 1; t < 20; t++) { const q = c + d * R.Ps[t - 1]; pts.push([q, R.Ps[t - 1]], [q, R.Ps[t]]); } g.path(pts, K.amber, 1.5); g.dot(R.Qe, R.Pe, K.fg, 5); g.labels('Q', 'P'); }
    const t = A.ax($('#tl-p'), [0, 25], [0, Math.max(...R.Ps.filter(v => Math.abs(v) < 1e4)) * 1.1], { l: 40 }); if (t) { t.hline(R.Pe, K.faint, 1, [4, 4]); t.path(R.Ps.map((p, i) => [i, p]), K.amber, 1.4); R.Ps.forEach((p, i) => t.dot(i, p, K.amber, 3)); t.labels('período', 'P'); }
  }
}
})();
