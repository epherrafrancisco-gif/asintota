/* Asíntota · Econometría */
(() => {
const { $, $$, K, fmt, pct, S } = A;
const f3 = x => fmt(x, 3), f2 = x => fmt(x, 2);

/* ---------- Álgebra de matrices para MCO ---------- */
const T = M => M[0].map((_, j) => M.map(r => r[j]));
const mul = (X, Y) => X.map(r => Y[0].map((_, j) => r.reduce((s, v, k) => s + v * Y[k][j], 0)));
const inv = M => {
  const n = M.length, a = M.map((r, i) => [...r, ...r.map((_, j) => +(i === j))]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let i = c + 1; i < n; i++) if (Math.abs(a[i][c]) > Math.abs(a[p][c])) p = i;
    if (Math.abs(a[p][c]) < 1e-12) return null; [a[c], a[p]] = [a[p], a[c]];
    const d = a[c][c]; a[c] = a[c].map(v => v / d);
    for (let i = 0; i < n; i++) if (i !== c) { const f = a[i][c]; a[i] = a[i].map((v, j) => v - f * a[c][j]); }
  }
  return a.map(r => r.slice(n));
};
// MCO: X incluye la columna de unos. Devuelve coeficientes, errores estándar clásicos y robustos (HC1).
const ols = (X, y) => {
  const n = X.length, k = X[0].length, Xt = T(X), XtXi = inv(mul(Xt, X)); if (!XtXi) return null;
  const b = mul(XtXi, mul(Xt, y.map(v => [v]))).map(r => r[0]);
  const yh = X.map(r => r.reduce((s, v, j) => s + v * b[j], 0)), e = y.map((v, i) => v - yh[i]);
  const sse = e.reduce((s, v) => s + v * v, 0), ym = y.reduce((s, v) => s + v, 0) / n, sst = y.reduce((s, v) => s + (v - ym) ** 2, 0);
  const s2 = sse / (n - k), se = XtXi.map((r, i) => Math.sqrt(s2 * r[i]));
  const meat = Xt.map((_, i) => Xt.map((_, j) => X.reduce((s, r, t) => s + r[i] * r[j] * e[t] * e[t], 0)));
  const V = mul(mul(XtXi, meat), XtXi), rse = V.map((r, i) => Math.sqrt(r[i] * n / (n - k)));
  return { b, se, rse, e, yh, r2: 1 - sse / sst, r2a: 1 - (sse / (n - k)) / (sst / (n - 1)), n, k, sse, sst };
};
const pT = (t, df) => 2 * (1 - S.tCdf(Math.abs(t), df));
const pF = (f, d1, d2) => 1 - A.betaI(d1 / 2, d2 / 2, d1 * f / (d1 * f + d2));
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const nrm = r => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
A.E = { ols, inv, mul, T, rng, nrm: r => nrm(r), pT, pF };
const hist = (c, F, data, lo, hi, bins, col, alpha = .75) => { const bw = (hi - lo) / bins, cnt = new Array(bins).fill(0); data.forEach(x => { const i = Math.floor((x - lo) / bw); if (i >= 0 && i < bins) cnt[i]++; }); return cnt; };

/* ================= MCO multivariado ================= */
{
  const sample = (() => {
    const r = rng(42), rows = ['salario,educacion,experiencia,mujer'];
    for (let i = 0; i < 80; i++) { const ed = 8 + Math.floor(r() * 11), ex = Math.floor(r() * 30), m = r() < .5 ? 1 : 0; const w = 180 + 42 * ed + 9 * ex - .12 * ex * ex * 0 - 95 * m + 110 * nrm(r); rows.push(`${Math.round(w)},${ed},${ex},${m}`); }
    return rows.join('\n');
  })();
  let data = null, yv = 'salario', xs = new Set(['educacion', 'experiencia', 'mujer']), R = null;
  A.tool({
    id: 'mco', mat: 'econometria', unit: 1, name: 'Regresión lineal múltiple (MCO)', short: 'MCO múltiple', tag: 'Mínimos cuadrados ordinarios', f: 'β̂ = (X′X)⁻¹X′y',
    desc: 'Pegá tus datos (de Excel o CSV), elegí la variable dependiente y las explicativas y obtené la tabla de regresión completa.',
    lead: 'Pegá una tabla con encabezados (copiada de Excel, separada por comas, punto y coma o tabulaciones). Elegí qué querés explicar y con qué variables. Viene cargado un ejemplo simulado de salarios.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l" for="mc-data">Datos</label><textarea class="field" id="mc-data" spellcheck="false" style="min-height:200px"></textarea><p class="err" id="mc-err"></p></div>
      <div><label class="l" for="mc-y">Variable dependiente (y)</label><select class="field" id="mc-y"></select></div><div><label class="l">Variables explicativas</label><div id="mc-x" style="display:flex;flex-direction:column;gap:6px"></div></div>
      <button class="btn sm" id="mc-ex" style="align-self:flex-start">Volver al ejemplo</button></div>
      <div class="stage"><dl class="stats" id="mc-st" style="margin:0"></dl><div class="tbl-wrap"><table class="tbl" id="mc-tbl"></table></div>
      <label class="check"><input type="checkbox" id="mc-rob"> Usar errores estándar robustos (White, HC1)</label>
      <h3>Residuos vs. valores ajustados</h3><canvas id="mco-cv" style="height:260px"></canvas><div class="steplist" id="mc-int"></div></div></div>`,
    init() {
      $('#mc-data').value = sample; parse();
      $('#mc-data').addEventListener('input', parse);
      $('#mc-y').onchange = e => { yv = e.target.value; xs.delete(yv); boxes(); run(); };
      $('#mc-ex').onclick = () => { $('#mc-data').value = sample; yv = 'salario'; xs = new Set(['educacion', 'experiencia', 'mujer']); parse(); };
      $('#mc-rob').onchange = run;
    },
    draw
  });
  function parse() {
    const txt = $('#mc-data').value.trim(), lines = txt.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 3) { $('#mc-err').textContent = 'Necesito un encabezado y al menos dos filas.'; data = null; run(); return; }
    const del = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',', commaDec = del !== ',';
    const head = lines[0].split(del).map(h => h.trim()), rows = [];
    let bad = 0;
    lines.slice(1).forEach(l => { const v = l.split(del).map(x => Number(commaDec ? x.trim().replace(/\./g, '').replace(',', '.') : x.trim())); if (v.length === head.length && v.every(Number.isFinite)) rows.push(v); else bad++; });
    $('#mc-err').textContent = bad ? `Ignoré ${bad} fila${bad > 1 ? 's' : ''} con datos faltantes o no numéricos.` : '';
    data = { head, rows };
    if (!head.includes(yv)) yv = head[0];
    xs = new Set([...xs].filter(x => head.includes(x) && x !== yv)); if (!xs.size) head.filter(h => h !== yv).slice(0, 3).forEach(h => xs.add(h));
    $('#mc-y').innerHTML = head.map(h => `<option ${h === yv ? 'selected' : ''}>${h}</option>`).join('');
    boxes(); run();
  }
  function boxes() { $('#mc-x').innerHTML = data.head.filter(h => h !== yv).map(h => `<label class="check"><input type="checkbox" data-x="${h}" ${xs.has(h) ? 'checked' : ''}> <span class="mono">${h}</span></label>`).join(''); $$('[data-x]').forEach(c => c.onchange = () => { c.checked ? xs.add(c.dataset.x) : xs.delete(c.dataset.x); run(); }); }
  function run() {
    if (!data) { R = null; $('#mc-tbl').innerHTML = ''; $('#mc-st').innerHTML = ''; $('#mc-int').innerHTML = ''; draw(); return; }
    const xn = data.head.filter(h => xs.has(h)), yi = data.head.indexOf(yv), xi = xn.map(h => data.head.indexOf(h));
    const X = data.rows.map(r => [1, ...xi.map(i => r[i])]), y = data.rows.map(r => r[yi]);
    if (X.length <= xn.length + 1) { $('#mc-err').textContent = 'Hay más variables que observaciones.'; return; }
    R = ols(X, y);
    if (!R) { $('#mc-err').textContent = 'Las variables explicativas son perfectamente colineales: sacá alguna.'; $('#mc-tbl').innerHTML = ''; return; }
    const rob = $('#mc-rob').checked, se = rob ? R.rse : R.se, df = R.n - R.k, tc = S.tInv(.975, df), names = ['constante', ...xn];
    const Fst = ((R.sst - R.sse) / (R.k - 1)) / (R.sse / df), pf = pF(Fst, R.k - 1, df);
    $('#mc-st').innerHTML = A.stats([['Observaciones', R.n], ['R²', f3(R.r2)], ['R² ajustado', f3(R.r2a)], ['Estadístico F', f2(Fst)], ['p-valor de F', pf < 1e-4 ? '< 0,0001' : fmt(pf, 4)]]);
    $('#mc-tbl').innerHTML = `<tr><th>Variable</th><th>Coef.</th><th>EE${rob ? ' robusto' : ''}</th><th>t</th><th>p-valor</th><th>IC 95%</th></tr>` + R.b.map((b, i) => { const t = b / se[i], p = pT(t, df); return `<tr><td>${names[i]}</td><td>${f3(b)}</td><td>${f3(se[i])}</td><td>${f2(t)}</td><td style="color:${p < .05 ? 'var(--amber)' : 'inherit'}">${p < 1e-4 ? '< 0,0001' : fmt(p, 4)}</td><td>[${f2(b - tc * se[i])}; ${f2(b + tc * se[i])}]</td></tr>`; }).join('');
    $('#mc-int').innerHTML = `<div class="explain"><p><b>Cómo leerla:</b> cada coeficiente es el efecto de subir esa variable en una unidad <b>manteniendo constantes las demás</b> (ceteris paribus). ${R.b.slice(1).map((b, i) => { const p = pT(b / se[i + 1], df); return `<br>· ${xn[i]}: ${f3(b)} → ${p < .05 ? 'significativo al 5%' : 'no significativo al 5%'}.`; }).join('')}</p>
      <p style="margin-top:6px">El modelo explica el ${pct(R.r2, 1)} de la variación de ${yv}. Si en el gráfico los residuos forman un abanico, hay heterocedasticidad: tildá los errores robustos.</p></div>`;
    draw();
  }
  function draw() {
    if (!R) return; const lo = Math.min(...R.yh), hi = Math.max(...R.yh), em = Math.max(...R.e.map(Math.abs)) * 1.15;
    const g = A.ax($('#mco-cv'), [lo - (hi - lo) * .05, hi + (hi - lo) * .05], [-em, em], { l: 56 }); if (!g) return;
    g.hline(0, K.faint, 1); R.yh.forEach((v, i) => g.dot(v, R.e[i], K.teal, 3)); g.labels('ŷ (ajustado)', 'residuo');
  }
}

/* ================= Sesgo por variable omitida ================= */
{
  const st = {};
  const D = [['b2', 'Efecto real de la variable omitida β₂', -3, 3, .1, 1.5, 1], ['rho', 'Correlación entre x₁ y x₂ (ρ)', -.9, .9, .05, .5, 2], ['n', 'Tamaño de muestra', 20, 400, 10, 100, 0]];
  let sims = null;
  A.tool({
    id: 'omitida', mat: 'econometria', unit: 2, name: 'Sesgo por variable omitida', short: 'Variable omitida', tag: 'Endogeneidad', f: 'sesgo = β₂ · Cov(x₁,x₂)/Var(x₁)',
    desc: 'Simulá 500 muestras y comparé la regresión correcta con la que deja afuera una variable relevante.',
    lead: 'Modelo real: y = 1 + 2·x₁ + β₂·x₂ + u. Ejemplo típico: salario (y), educación (x₁) y habilidad (x₂, que no se observa). Si x₂ afecta a y y está correlacionada con x₁, omitirla sesga el coeficiente de x₁.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('om', D)}<button class="btn primary sm" id="om-go" style="align-self:flex-start">Simular 500 muestras</button><dl class="stats" id="om-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Distribución de β̂₁ en 500 muestras</h3><canvas id="om-cv" style="height:320px"></canvas>${A.legend([['teal', 'Regresión completa (y sobre x₁ y x₂)'], ['rose', 'Omitiendo x₂'], ['fg', 'Valor real β₁ = 2']])}<div class="steplist" id="om-steps"></div></div></div>`,
    init() { A.bindSliders('om', D, st, run); $('#om-go').onclick = run; run(); },
    draw
  });
  function run() {
    const r = rng(Math.floor(Math.random() * 1e9)), longB = [], shortB = [];
    for (let s = 0; s < 500; s++) {
      const X = [], Xs = [], y = [];
      for (let i = 0; i < st.n; i++) { const z1 = nrm(r), z2 = nrm(r), x1 = z1, x2 = st.rho * z1 + Math.sqrt(1 - st.rho ** 2) * z2; y.push(1 + 2 * x1 + st.b2 * x2 + nrm(r)); X.push([1, x1, x2]); Xs.push([1, x1]); }
      const L = ols(X, y), Sh = ols(Xs, y); if (L && Sh) { longB.push(L.b[1]); shortB.push(Sh.b[1]); }
    }
    sims = { longB, shortB };
    const m = a => a.reduce((s, v) => s + v, 0) / a.length, bias = st.b2 * st.rho;
    $('#om-st').innerHTML = A.stats([['Promedio con x₂', f3(m(longB))], ['Promedio sin x₂', f3(m(shortB))], ['Sesgo teórico', f3(bias)], ['Sesgo observado', f3(m(shortB) - 2)]]);
    $('#om-steps').innerHTML = A.steps([
      `Si estimás y sobre x₁ sola, β̂₁ captura su efecto <b>más</b> el de x₂ que "viaja" con x₁: E[β̂₁] = β₁ + β₂ · Cov(x₁, x₂)/Var(x₁).`,
      `Acá x₁ y x₂ tienen varianza 1, así que el sesgo es β₂ · ρ = ${f2(st.b2)} × ${f2(st.rho)} = <b>${f3(bias)}</b>.`,
      `${Math.abs(bias) < .01 ? 'No hay sesgo: o x₂ no afecta a y, o no está correlacionada con x₁.' : `El signo te dice para dónde se equivoca: ${bias > 0 ? 'se <b>sobreestima</b> el efecto' : 'se <b>subestima</b> el efecto'}. En el ejemplo, parte de lo que parece "retorno a la educación" es en realidad habilidad.`}`,
      `Más datos no lo arreglan: subí n y mirá que la campana rosa se angosta pero sigue corrida. El sesgo no es un problema de muestra chica, es de especificación.`]);
    draw();
  }
  function draw() {
    if (!sims) return; const all = [...sims.longB, ...sims.shortB], lo = Math.min(...all, 1.5), hi = Math.max(...all, 2.5), bins = 50, bw = (hi - lo) / bins;
    const a = hist(null, null, sims.longB, lo, hi, bins), b = hist(null, null, sims.shortB, lo, hi, bins), ym = Math.max(...a, ...b) * 1.1;
    const g = A.ax($('#om-cv'), [lo, hi], [0, ym], { yf: v => fmt(v, 0) }); if (!g) return;
    [[a, 'rgba(67,200,184,.6)'], [b, 'rgba(239,115,145,.55)']].forEach(([cnt, col]) => cnt.forEach((k, i) => { if (!k) return; g.c.fillStyle = col; g.c.fillRect(g.X(lo + i * bw) + .5, g.Y(k), g.X(lo + (i + 1) * bw) - g.X(lo + i * bw) - 1, g.Y(0) - g.Y(k)); }));
    g.vline(2, K.fg, 2);
  }
}

/* ================= Heterocedasticidad ================= */
{
  const st = {};
  const D = [['gm', 'Intensidad del abanico γ', 0, 1.5, .05, .8, 2], ['n', 'Tamaño de muestra', 30, 400, 10, 120, 0]];
  let one = null, mc = null;
  const gen = (r, n) => { const X = [], y = [], xs = []; for (let i = 0; i < n; i++) { const x = r() * 10; xs.push(x); X.push([1, x]); y.push(1 + 2 * x + nrm(r) * (1 + st.gm * x)); } return { X, y, xs }; };
  A.tool({
    id: 'hetero', mat: 'econometria', unit: 2, name: 'Heterocedasticidad', short: 'Heterocedasticidad', tag: 'Errores estándar robustos', f: 'Var(u|x) = σ²(1 + γx)²',
    desc: 'Cuando el error varía con x, los errores estándar comunes mienten. Comparalos con los robustos y con la variación real.',
    lead: 'Modelo y = 1 + 2·x + u, pero el desvío del error crece con x (piensen en el gasto según el ingreso: los ricos varían mucho más). MCO sigue siendo insesgado, pero los errores estándar de siempre están mal y los tests dejan de valer.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('hc', D)}<button class="btn primary sm" id="hc-go" style="align-self:flex-start">Nueva simulación</button><dl class="stats" id="ht2-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ht2-cv" style="height:320px"></canvas><div class="steplist" id="ht2-steps"></div></div></div>`,
    init() { A.bindSliders('hc', D, st, run); $('#hc-go').onclick = run; run(); },
    draw
  });
  function run() {
    const r = rng(Math.floor(Math.random() * 1e9)); one = gen(r, st.n); one.fit = ols(one.X, one.y);
    const bs = [], se = [], rse = []; for (let s = 0; s < 400; s++) { const d = gen(r, st.n), f = ols(d.X, d.y); bs.push(f.b[1]); se.push(f.se[1]); rse.push(f.rse[1]); }
    const m = a => a.reduce((s, v) => s + v, 0) / a.length, sd = Math.sqrt(bs.reduce((s, v) => s + (v - m(bs)) ** 2, 0) / (bs.length - 1));
    const e2 = one.fit.e.map(v => v * v), bp = ols(one.X, e2), LM = st.n * bp.r2, pbp = 1 - S.chiCdf(LM, 1);
    mc = { sd, se: m(se), rse: m(rse) };
    $('#ht2-st').innerHTML = A.stats([['Variación real de β̂ (desvío)', f3(sd)], ['EE común (promedio)', f3(mc.se)], ['EE robusto (promedio)', f3(mc.rse)], ['Breusch-Pagan (p-valor)', pbp < 1e-4 ? '< 0,0001' : fmt(pbp, 4)]]);
    $('#ht2-steps').innerHTML = A.steps([
      `En 400 muestras, β̂ varió de verdad con un desvío de <b>${f3(sd)}</b>. Esa es la incertidumbre real.`,
      `El error estándar común promedió ${f3(mc.se)}: ${mc.se < sd * .9 ? `<b>subestima</b> la incertidumbre en ${pct(1 - mc.se / sd, 0)}. Los intervalos quedan muy angostos y rechazás hipótesis de más.` : 'está cerca del valor real (con poco abanico no hay problema).'}`,
      `El robusto de White promedió ${f3(mc.rse)}: se acerca mucho más al valor real, sin necesidad de saber la forma de la heterocedasticidad.`,
      `Test de Breusch-Pagan sobre esta muestra: regresando û² sobre x, LM = n·R² = ${f2(LM)} con p = ${pbp < 1e-4 ? '< 0,0001' : fmt(pbp, 4)}. ${pbp < .05 ? 'Se rechaza homocedasticidad.' : 'No se rechaza homocedasticidad.'}`]);
    draw();
  }
  function draw() {
    if (!one) return; const ym = Math.max(...one.y.map(Math.abs)) * 1.05;
    const g = A.ax($('#ht2-cv'), [0, 10], [Math.min(...one.y) - 2, Math.max(...one.y) + 2], { l: 46 }); if (!g) return;
    g.fn(x => 1 + 2 * x + 1.96 * (1 + st.gm * x), 'rgba(239,115,145,.5)', 1.2, [4, 4]); g.fn(x => 1 + 2 * x - 1.96 * (1 + st.gm * x), 'rgba(239,115,145,.5)', 1.2, [4, 4]);
    one.xs.forEach((x, i) => g.dot(x, one.y[i], K.teal, 2.8)); g.fn(x => one.fit.b[0] + one.fit.b[1] * x, K.amber); g.labels('x', 'y');
  }
}

/* ================= Multicolinealidad ================= */
{
  const st = {};
  const D = [['rho', 'Correlación entre x₁ y x₂', 0, .99, .01, .9, 2], ['n', 'Tamaño de muestra', 20, 400, 10, 60, 0]];
  let pts = null;
  A.tool({
    id: 'multicol', mat: 'econometria', unit: 2, name: 'Multicolinealidad', short: 'Multicolinealidad', tag: 'Varianza de los estimadores', f: 'VIF = 1/(1 − R²ⱼ)',
    desc: 'Cuando dos explicativas se mueven juntas, cuesta separar sus efectos. Mirá cómo se disparan las varianzas.',
    lead: 'Modelo y = 1 + x₁ + x₂ + u. Si x₁ y x₂ están muy correlacionadas, los datos casi no muestran casos donde una cambie sin la otra, y MCO no puede distinguir cuál hace qué. Los estimadores siguen insesgados, pero muy imprecisos.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mt', D)}<button class="btn primary sm" id="mt-go" style="align-self:flex-start">Nueva simulación</button><dl class="stats" id="mt-st" style="margin:0"></dl></div>
      <div class="stage"><h3>500 estimaciones de (β̂₁, β̂₂)</h3><canvas id="mt-cv" style="width:min(100%,460px);aspect-ratio:1;align-self:center"></canvas><div class="steplist" id="mt-steps"></div></div></div>`,
    init() { A.bindSliders('mt', D, st, run); $('#mt-go').onclick = run; run(); },
    draw
  });
  function run() {
    const r = rng(Math.floor(Math.random() * 1e9)); pts = [];
    for (let s = 0; s < 500; s++) { const X = [], y = []; for (let i = 0; i < st.n; i++) { const z1 = nrm(r), x2 = st.rho * z1 + Math.sqrt(1 - st.rho ** 2) * nrm(r); X.push([1, z1, x2]); y.push(1 + z1 + x2 + nrm(r)); } const f = ols(X, y); if (f) pts.push([f.b[1], f.b[2]]); }
    const vif = 1 / (1 - st.rho ** 2), sd = Math.sqrt(pts.reduce((s, p) => s + (p[0] - 1) ** 2, 0) / pts.length);
    $('#mt-st').innerHTML = A.stats([['VIF', f2(vif)], ['Desvío de β̂₁', f3(sd)], ['Desvío sin correlación', f3(1 / Math.sqrt(st.n))]]);
    $('#mt-steps').innerHTML = A.steps([
      `Factor de inflación de la varianza: VIF = 1/(1 − ρ²) = 1/(1 − ${f2(st.rho)}²) = <b>${f2(vif)}</b>. La varianza de β̂₁ es ${f2(vif)} veces la que tendría si x₁ y x₂ no estuvieran correlacionadas.`,
      `Fijate en la forma de la nube: es una elipse inclinada hacia abajo. Cuando MCO sobreestima β₁, subestima β₂: la <b>suma</b> β₁ + β₂ se estima bien, lo que no se puede es repartirla.`,
      `Regla práctica: un VIF arriba de 10 es señal de alarma. Soluciones: más datos, combinar las variables o aceptar que solo se puede estimar su efecto conjunto.`]);
    draw();
  }
  function draw() {
    if (!pts) return; const m = Math.max(1.2, ...pts.map(p => Math.max(Math.abs(p[0] - 1), Math.abs(p[1] - 1)))) * 1.05;
    const g = A.ax($('#mt-cv'), [1 - m, 1 + m], [1 - m, 1 + m], { l: 40 }); if (!g) return;
    g.c.globalAlpha = .5; pts.forEach(p => g.dot(p[0], p[1], K.teal, 2.6)); g.c.globalAlpha = 1; g.dot(1, 1, K.amber, 6); g.text('valor real (1, 1)', 1, 1, K.amber); g.labels('β̂₁', 'β̂₂');
  }
}

/* ================= Logit vs modelo lineal de probabilidad ================= */
{
  const st = {};
  const D = [['b0', 'Constante real β₀', -8, 2, .1, -4, 1], ['b1', 'Efecto real por hora β₁', .1, 2, .05, .8, 2], ['n', 'Estudiantes', 30, 500, 10, 150, 0]];
  let d = null;
  const L = z => 1 / (1 + Math.exp(-z));
  const logit = (X, y) => { let b = [0, 0]; for (let it = 0; it < 50; it++) { let g0 = 0, g1 = 0, h00 = 0, h01 = 0, h11 = 0; X.forEach((x, i) => { const p = L(b[0] + b[1] * x), w = p * (1 - p); g0 += y[i] - p; g1 += (y[i] - p) * x; h00 += w; h01 += w * x; h11 += w * x * x; }); const det = h00 * h11 - h01 * h01; if (Math.abs(det) < 1e-12) break; const d0 = (h11 * g0 - h01 * g1) / det, d1 = (-h01 * g0 + h00 * g1) / det; b = [b[0] + d0, b[1] + d1]; if (Math.abs(d0) + Math.abs(d1) < 1e-10) break; } return b; };
  A.tool({
    id: 'logit', mat: 'econometria', unit: 3, name: 'Logit vs. modelo lineal de probabilidad', short: 'Logit', tag: 'Variable dependiente binaria', f: 'P(y=1) = 1/(1 + e^(−xβ))',
    desc: '¿Aprueba o no aprueba según las horas de estudio? Compará la recta de MCO con la curva logit estimada por máxima verosimilitud.',
    lead: 'Cuando y solo vale 0 o 1, una recta puede predecir probabilidades negativas o mayores a 100%. El logit usa una curva en forma de S que siempre queda entre 0 y 1. Datos simulados: horas de estudio y si el estudiante aprobó.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('lg2', D)}<button class="btn primary sm" id="lg2-go" style="align-self:flex-start">Nuevos datos</button><dl class="stats" id="lg2-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="lg2-cv" style="height:360px"></canvas>${A.legend([['teal', 'Datos (0 = desaprobó, 1 = aprobó)'], ['amber', 'Logit estimado'], ['rose', 'Modelo lineal de probabilidad'], ['faint', 'Probabilidad real']])}<div class="steplist" id="lg2-steps"></div></div></div>`,
    init() { A.bindSliders('lg2', D, st, run); $('#lg2-go').onclick = run; run(); },
    draw
  });
  function run() {
    const r = rng(Math.floor(Math.random() * 1e9)), x = [], y = [];
    for (let i = 0; i < st.n; i++) { const h = r() * 12; x.push(h); y.push(r() < L(st.b0 + st.b1 * h) ? 1 : 0); }
    const lpm = ols(x.map(v => [1, v]), y), bl = logit(x, y), xm = x.reduce((s, v) => s + v, 0) / x.length;
    const me = L(bl[0] + bl[1] * xm) * (1 - L(bl[0] + bl[1] * xm)) * bl[1];
    const ok = x.filter((v, i) => (L(bl[0] + bl[1] * v) > .5 ? 1 : 0) === y[i]).length / x.length, out = x.filter(v => { const p = lpm.b[0] + lpm.b[1] * v; return p < 0 || p > 1; }).length;
    d = { x, y, lpm, bl };
    $('#lg2-st').innerHTML = A.stats([['Logit β₀, β₁', `${f2(bl[0])}; ${f2(bl[1])}`], ['Efecto marginal en la media', pct(me, 1) + ' por hora'], ['MLP: pendiente', pct(lpm.b[1], 1) + ' por hora'], ['Bien clasificados (logit)', pct(ok, 0)], ['Predicciones del MLP fuera de [0,1]', out]]);
    $('#lg2-steps').innerHTML = A.steps([
      `El logit se estima por <b>máxima verosimilitud</b>: busca los β que hacen más probable haber observado estos aprobados y desaprobados. Acá: β₀ = ${f2(bl[0])}, β₁ = ${f2(bl[1])} (los reales son ${f2(st.b0)} y ${f2(st.b1)}).`,
      `Los coeficientes del logit no son efectos directos sobre la probabilidad. El efecto de una hora más depende de dónde estés: es máximo en el medio de la S y casi nulo en las puntas. En la media (${f2(xm)} horas) es <b>${pct(me, 1)}</b>.`,
      `El modelo lineal dice que cada hora suma siempre ${pct(lpm.b[1], 1)}, y para ${out} estudiantes predice probabilidades imposibles. Es fácil de interpretar pero tiene ese límite.`,
      `Odds ratio: e^β₁ = ${f2(Math.exp(bl[1]))}. Cada hora de estudio multiplica las chances (probabilidad de aprobar sobre probabilidad de desaprobar) por ese número.`]);
    draw();
  }
  function draw() {
    if (!d) return; const g = A.ax($('#lg2-cv'), [0, 12], [-.25, 1.25], { ystep: .25, yf: v => v >= 0 && v <= 1 ? pct(v, 0) : '' }); if (!g) return;
    g.hline(0, K.faint, 1); g.hline(1, K.faint, 1);
    d.x.forEach((x, i) => g.dot(x, d.y[i] + (Math.sin(i * 12.9898) * .5) * .06, K.teal, 2.6));
    g.fn(x => L(st.b0 + st.b1 * x), K.faint, 1.4, [4, 4]); g.fn(x => d.lpm.b[0] + d.lpm.b[1] * x, K.rose, 2); g.fn(x => L(d.bl[0] + d.bl[1] * x), K.amber, 2.4); g.labels('Horas de estudio', 'P(aprobar)');
  }
}

/* ================= Series de tiempo ================= */
{
  const st = {};
  const D = [['phi', 'Persistencia φ (AR(1))', -.95, 1, .01, .8, 2], ['n', 'Períodos', 50, 500, 10, 200, 0]];
  let ser = null, sp = null;
  A.tool({
    id: 'series', mat: 'econometria', unit: 4, name: 'Series de tiempo: AR(1), raíz unitaria y regresión espuria', short: 'Series de tiempo', tag: 'Procesos estocásticos', f: 'yₜ = φ·yₜ₋₁ + εₜ',
    desc: 'Simulá procesos autorregresivos, mirá su autocorrelación y descubrí por qué regresar dos caminatas aleatorias da resultados falsos.',
    lead: 'En un AR(1), cada valor depende del anterior más un shock. Si |φ| < 1 la serie es estacionaria y vuelve a su media; si φ = 1 es una caminata aleatoria (raíz unitaria) que nunca vuelve. Esa diferencia lo cambia todo.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ts', D)}<div class="chips"><button class="chip" data-ts=".2">φ = 0,2</button><button class="chip" data-ts=".95">φ = 0,95</button><button class="chip" data-ts="1">Caminata aleatoria</button><button class="chip" data-ts="-.7">φ = −0,7</button></div><button class="btn primary sm" id="ts-go" style="align-self:flex-start">Nueva simulación</button><div id="ts-pill"></div></div>
      <div class="stage"><h3>La serie</h3><canvas id="ts-cv" style="height:220px"></canvas><h3>Autocorrelación (correlograma)</h3><canvas id="ts-acf" style="height:180px"></canvas><div class="explain" id="ts-exp"></div></div></div>
    <div class="grp-h" style="margin-top:30px"><h2>Regresión espuria</h2></div>
    <div class="bench"><div class="ctrl"><p class="note">Generamos dos caminatas aleatorias <b style="color:var(--fg)">totalmente independientes</b> y regresamos una sobre la otra. En teoría, el coeficiente debería ser "significativo" solo el 5% de las veces.</p><button class="btn primary sm" id="sp-go" style="align-self:flex-start">Simular 500 regresiones</button><dl class="stats" id="sp-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="sp-cv" style="height:240px"></canvas>${A.legend([['amber', 'Serie A'], ['teal', 'Serie B (independiente de A)']])}<div class="explain" id="sp-exp"></div></div></div>`,
    init() { A.bindSliders('ts', D, st, run); $$('[data-ts]').forEach(b => b.onclick = () => { A.setSlider('ts', 'phi', +b.dataset.ts, st); run(); }); $('#ts-go').onclick = run; $('#sp-go').onclick = spur; run(); spur(); },
    draw: () => { draw(); drawSp(); }
  });
  function run() {
    const r = rng(Math.floor(Math.random() * 1e9)), y = [0]; for (let t = 1; t < st.n; t++) y.push(st.phi * y[t - 1] + nrm(r));
    const m = y.reduce((s, v) => s + v, 0) / y.length, v0 = y.reduce((s, v) => s + (v - m) ** 2, 0);
    const acf = Array.from({ length: 20 }, (_, k) => { let s = 0; for (let t = k + 1; t < y.length; t++) s += (y[t] - m) * (y[t - k - 1] - m); return s / v0; });
    ser = { y, acf };
    const ur = st.phi >= .995, stat = Math.abs(st.phi) < 1;
    $('#ts-pill').innerHTML = `<span class="pill ${ur ? 'bad' : 'ok'}">${ur ? 'Raíz unitaria: no estacionaria' : 'Estacionaria'}</span>`;
    $('#ts-exp').innerHTML = `<p>${ur ? 'Con φ = 1 cada shock queda <b>para siempre</b>: la serie deambula sin volver a ningún lado y su varianza crece con el tiempo. La autocorrelación baja muy despacio. Muchas series económicas en niveles (PBI, precios, tipo de cambio) se comportan así; por eso se trabaja en diferencias o en tasas de variación.' : `Con φ = ${f2(st.phi)} un shock se va diluyendo: después de k períodos queda φᵏ de él. La autocorrelación teórica en el rezago k es φᵏ (la de rezago 1 da ${f2(ser.acf[0])} acá). ${st.phi < 0 ? 'Con φ negativo la serie alterna: arriba, abajo, arriba.' : ''} Vida media de un shock: ${st.phi > 0 && st.phi < 1 ? f2(Math.log(.5) / Math.log(st.phi)) + ' períodos' : '—'}.`}</p>`;
    draw();
  }
  function draw() {
    if (!ser) return; const y = ser.y, lo = Math.min(...y), hi = Math.max(...y), pd = (hi - lo) * .08 || 1;
    const g = A.ax($('#ts-cv'), [0, y.length - 1], [lo - pd, hi + pd], { l: 40, xt: 5 }); if (g) { g.hline(0, K.faint, 1); g.path(y.map((v, t) => [t, v]), K.amber, 1.5); }
    const a = A.ax($('#ts-acf'), [.5, 20.5], [-1, 1], { ystep: .5, xticks: [1, 5, 10, 15, 20], xf: v => fmt(v, 0), l: 40 }); if (!a) return;
    const band = 1.96 / Math.sqrt(y.length); a.poly([[.5, band], [20.5, band], [20.5, -band], [.5, -band]], 'rgba(67,200,184,.1)'); a.hline(0, K.faint, 1);
    const bw = (a.X(2) - a.X(1)) * .55; ser.acf.forEach((v, k) => { a.c.fillStyle = K.amber; a.c.fillRect(a.X(k + 1) - bw / 2, Math.min(a.Y(0), a.Y(v)), bw, Math.abs(a.Y(v) - a.Y(0))); });
  }
  function spur() {
    const r = rng(Math.floor(Math.random() * 1e9)), N = 150; let sig = 0, r2s = 0, ex = null;
    for (let s = 0; s < 500; s++) { const a = [0], b = [0]; for (let t = 1; t < N; t++) { a.push(a[t - 1] + nrm(r)); b.push(b[t - 1] + nrm(r)); } const f = ols(b.map(v => [1, v]), a); const t = f.b[1] / f.se[1]; if (Math.abs(t) > 1.96) sig++; r2s += f.r2; if (!ex) ex = { a, b, f, t }; }
    sp = ex;
    $('#sp-st').innerHTML = A.stats([['Regresiones "significativas"', pct(sig / 500, 0)], ['Debería ser', '5%'], ['R² promedio', f3(r2s / 500)], ['t del primer ejemplo', f2(ex.t)]]);
    $('#sp-exp').innerHTML = `<p>En el ${pct(sig / 500, 0)} de los casos MCO dice que A y B están relacionadas, aunque las generamos por separado. Con series con tendencia estocástica, los tests t y el R² dejan de valer: es la <b>regresión espuria</b> de Granger y Newbold (1974). La solución es testear raíces unitarias (Dickey-Fuller), trabajar en diferencias o buscar <b>cointegración</b>.</p>`;
    drawSp();
  }
  function drawSp() { if (!sp) return; const all = [...sp.a, ...sp.b], g = A.ax($('#sp-cv'), [0, sp.a.length - 1], [Math.min(...all) - 1, Math.max(...all) + 1], { l: 40 }); if (!g) return; g.path(sp.a.map((v, t) => [t, v]), K.amber, 1.6); g.path(sp.b.map((v, t) => [t, v]), K.teal, 1.6); }
}
})();
