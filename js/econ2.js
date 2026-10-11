/* Asíntota · Econometría (ampliación) */
(() => {
const { $, $$, K, fmt, pct, S } = A;
const { ols, pT, pF } = A.E;
const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);
const N = () => S.rnorm();
const mean = a => a.reduce((s, v) => s + v, 0) / a.length, sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
const hbars = (g, data, lo, hi, bins, col) => { const bw = (hi - lo) / bins, cnt = new Array(bins).fill(0); data.forEach(x => { const i = Math.floor((x - lo) / bw); if (i >= 0 && i < bins) cnt[i]++; }); cnt.forEach((k, i) => { if (!k) return; g.c.fillStyle = col; g.c.fillRect(g.X(lo + i * bw) + .5, g.Y(k), g.X(lo + (i + 1) * bw) - g.X(lo + i * bw) - 1, g.Y(0) - g.Y(k)); }); return cnt; };
const binsOf = (data, lo, hi, bins) => { const bw = (hi - lo) / bins, cnt = new Array(bins).fill(0); data.forEach(x => { const i = Math.floor((x - lo) / bw); if (i >= 0 && i < bins) cnt[i]++; }); return cnt; };
const COL5 = ['amber', 'teal', 'rose', 'violet', 'fg'];

/* ================= Propiedades de MCO ================= */
{
  const st = {}; let bs = [];
  const D = [['n', 'Tamaño de muestra', 5, 500, 5, 30, 0], ['sg', 'Desvío del error σ', .2, 5, .1, 2, 1], ['sx', 'Dispersión de x', .2, 4, .1, 1, 1]];
  A.tool({
    id: 'mco-propiedades', mat: 'econometria', unit: 1, ord: 1, name: 'Propiedades de MCO: insesgadez y varianza', short: 'Propiedades de MCO', tag: 'Teorema de Gauss-Markov', f: 'Var(β̂) = σ² / Σ(xᵢ − x̄)²',
    desc: 'Simulá 1.000 muestras y mirá cómo se distribuye el estimador: dónde se centra y qué la achica.',
    lead: 'El estimador de MCO es una variable aleatoria: cambia con cada muestra. Bajo los supuestos clásicos está centrado en el valor verdadero (insesgado) y es el de menor varianza entre los estimadores lineales insesgados (teorema de Gauss-Markov). Modelo real: y = 2 + 0,5·x + u.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mp', D)}<button class="btn primary sm" id="mp-go" style="align-self:flex-start">Simular 1.000 muestras</button><dl class="stats" id="mp-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="mp-cv" style="height:320px"></canvas>${A.legend([['amber', 'Estimaciones de β̂₁'], ['teal', 'Distribución teórica'], ['fg', 'Valor real 0,5']])}<div class="steplist" id="mp-steps"></div></div></div>`,
    init() { A.bindSliders('mp', D, st, run); $('#mp-go').onclick = run; run(); },
    draw
  });
  function run() {
    bs = []; for (let s = 0; s < 1000; s++) { const X = [], y = []; for (let i = 0; i < st.n; i++) { const x = st.sx * N(); X.push([1, x]); y.push(2 + .5 * x + st.sg * N()); } const f = ols(X, y); if (f) bs.push(f.b[1]); }
    const th = st.sg / (st.sx * Math.sqrt(st.n));
    $('#mp-st').innerHTML = A.stats([['Promedio de β̂₁', f3(mean(bs))], ['Desvío observado', f3(sd(bs))], ['Desvío teórico', f3(th)]]);
    $('#mp-steps').innerHTML = A.steps([
      `<b>Insesgadez:</b> el promedio de las 1.000 estimaciones es ${f3(mean(bs))}, muy cerca del valor real 0,5. Cada muestra se equivoca un poco, pero en promedio no hay un error sistemático.`,
      `<b>Varianza:</b> Var(β̂₁) = σ²/Σ(xᵢ − x̄)² ≈ σ²/(n·σx²). Con σ = ${f2(st.sg)}, n = ${st.n} y σx = ${f2(st.sx)}, el desvío teórico es ${f3(th)} (observado: ${f3(sd(bs))}).`,
      `Tres formas de estimar con más precisión: <b>más datos</b> (n), <b>menos ruido</b> (σ) o <b>más variación en x</b>. Si x casi no varía, es imposible saber cómo responde y.`,
      `Por el teorema central del límite, con n grande la distribución de β̂ es normal aunque el error no lo sea: por eso funcionan los tests t.`]);
    draw();
  }
  function draw() { if (!bs.length) return; const th = st.sg / (st.sx * Math.sqrt(st.n)), lo = .5 - 4.5 * th, hi = .5 + 4.5 * th, bins = 50, cnt = binsOf(bs, lo, hi, bins), ym = Math.max(...cnt) * 1.15, g = A.ax($('#mp-cv'), [lo, hi], [0, ym], { yf: v => fmt(v, 0) }); if (!g) return; hbars(g, bs, lo, hi, bins, 'rgba(242,169,59,.8)'); g.fn(x => 1000 * (hi - lo) / bins * S.normPdf(x, .5, th), K.teal, 2); g.vline(.5, K.fg, 1.8); }
}

/* ================= Test F de restricciones ================= */
{
  const st = {}; let R = null;
  const D = [['b2', 'Efecto real de x₂', -1, 1, .05, .15, 2], ['b3', 'Efecto real de x₃', -1, 1, .05, .1, 2], ['rho', 'Correlación entre x₂ y x₃', 0, .95, .05, .8, 2], ['n', 'Observaciones', 20, 500, 10, 80, 0]];
  A.tool({
    id: 'testf', mat: 'econometria', unit: 2, ord: 0, name: 'Test F de restricciones lineales', short: 'Test F', tag: 'Significatividad conjunta', f: 'F = [(SRCᵣ − SRCₙᵣ)/q] / [SRCₙᵣ/(n − k)]',
    desc: 'Testeá si varias variables juntas importan. Dos variables pueden no ser significativas por separado y sí serlo en conjunto.',
    lead: 'Modelo real: y = 1 + 2·x₁ + β₂·x₂ + β₃·x₃ + u. Queremos testear H₀: β₂ = β₃ = 0. El test F compara cuánto empeora el ajuste si sacamos esas variables (modelo restringido) contra el modelo completo.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('tf', D)}<button class="btn primary sm" id="tf-go" style="align-self:flex-start">Nueva muestra</button><dl class="stats" id="tf-st" style="margin:0"></dl></div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="tf-tbl"></table></div><canvas id="tf-cv" style="height:220px"></canvas><div class="steplist" id="tf-steps"></div></div></div>`,
    init() { A.bindSliders('tf', D, st, run); $('#tf-go').onclick = run; run(); },
    draw
  });
  function run() {
    const Xu = [], Xr = [], y = [];
    for (let i = 0; i < st.n; i++) { const x1 = N(), z = N(), x2 = z, x3 = st.rho * z + Math.sqrt(1 - st.rho ** 2) * N(); Xu.push([1, x1, x2, x3]); Xr.push([1, x1]); y.push(1 + 2 * x1 + st.b2 * x2 + st.b3 * x3 + N()); }
    const u = ols(Xu, y), r = ols(Xr, y), q = 2, df = st.n - 4, F = ((r.sse - u.sse) / q) / (u.sse / df), p = pF(F, q, df), crit = (() => { let lo = 0, hi = 100; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; pF(m, q, df) > .05 ? lo = m : hi = m; } return (lo + hi) / 2; })();
    R = { F, p, crit, q, df };
    $('#tf-tbl').innerHTML = `<tr><th>Variable</th><th>Coef.</th><th>EE</th><th>t</th><th>p-valor</th></tr>` + ['constante', 'x₁', 'x₂', 'x₃'].map((nm, i) => { const t = u.b[i] / u.se[i], pv = pT(t, df); return `<tr><td>${nm}</td><td>${f3(u.b[i])}</td><td>${f3(u.se[i])}</td><td>${f2(t)}</td><td style="color:${pv < .05 ? 'var(--amber)' : 'inherit'}">${pv < 1e-4 ? '< 0,0001' : fmt(pv, 4)}</td></tr>`; }).join('');
    $('#tf-st').innerHTML = A.stats([['SRC sin restringir', f2(u.sse)], ['SRC restringido', f2(r.sse)], ['F', f2(F)], ['p-valor', p < 1e-4 ? '< 0,0001' : fmt(p, 4)]]);
    const t2 = pT(u.b[2] / u.se[2], df), t3 = pT(u.b[3] / u.se[3], df);
    $('#tf-steps').innerHTML = A.steps([
      `Estimo el modelo completo (SRC = ${f2(u.sse)}) y el restringido sin x₂ ni x₃ (SRC = ${f2(r.sse)}). Sacar variables siempre empeora el ajuste; la pregunta es si empeora <b>mucho</b>.`,
      `F = [(${f2(r.sse)} − ${f2(u.sse)})/${q}] / [${f2(u.sse)}/${df}] = <b>${f2(F)}</b>. Valor crítico al 5% con (${q}, ${df}) grados de libertad: ${f2(crit)}.`,
      `${p < .05 ? 'Se rechaza H₀: x₂ y x₃ son <b>conjuntamente significativas</b>.' : 'No se rechaza H₀: no hay evidencia de que x₂ y x₃ importen.'} ${p < .05 && t2 > .05 && t3 > .05 ? '<b>Fijate:</b> ninguna es significativa por separado, pero juntas sí. Pasa cuando están muy correlacionadas: cuesta separar sus efectos individuales (multicolinealidad), pero en conjunto explican y.' : 'Subí la correlación entre x₂ y x₃ y probá varias muestras: vas a encontrar casos donde ninguna pasa el test t pero el F rechaza.'}`]);
    draw();
  }
  function draw() { if (!R) return; const xm = Math.max(R.crit * 2, R.F * 1.15), pdf = x => { const d1 = R.q, d2 = R.df; return Math.exp(.5 * d1 * Math.log(d1 * x) + .5 * d2 * Math.log(d2) - .5 * (d1 + d2) * Math.log(d1 * x + d2) - Math.log(x) - (A.lgamma(d1 / 2) + A.lgamma(d2 / 2) - A.lgamma((d1 + d2) / 2))); }; const g = A.ax($('#tf-cv'), [0, xm], [0, 1.05], { l: 40 }); if (!g) return; g.area(x => pdf(x), () => 0, R.crit, xm, 'rgba(239,115,145,.35)'); g.fn(pdf, K.fg, 2, null, [xm * .002, xm]); g.vline(Math.min(R.F, xm), K.amber, 2.2); g.text('F = ' + f2(R.F), Math.min(R.F, xm), .9, K.amber, R.F > xm * .7 ? 'right' : 'left', 'bottom', R.F > xm * .7 ? -6 : 6); }
}

/* ================= Formas funcionales ================= */
{
  const st = { truth: 'loglog', est: 'loglog' }; let data = null;
  const SPEC = { linlin: ['Lineal (y sobre x)', v => v, v => v], loglin: ['Log-lineal (ln y sobre x)', v => Math.log(v), v => v], linlog: ['Lineal-log (y sobre ln x)', v => v, v => Math.log(v)], loglog: ['Log-log (ln y sobre ln x)', v => Math.log(v), v => Math.log(v)] };
  const TRUTH = { linlin: x => 20 + 3 * x, loglin: x => 20 * Math.exp(.04 * x), linlog: x => 10 + 25 * Math.log(x), loglog: x => 8 * Math.pow(x, .6) };
  const gen = () => { data = Array.from({ length: 120 }, () => { const x = 1 + Math.random() * 49; return [x, TRUTH[st.truth](x) * Math.exp(.12 * N())]; }); };
  A.tool({
    id: 'formas-funcionales', mat: 'econometria', unit: 2, ord: 1, name: 'Formas funcionales: niveles y logaritmos', short: 'Logaritmos', tag: 'Interpretación de coeficientes', f: 'ln y = β₀ + β₁·ln x → β₁ es una elasticidad',
    desc: 'Lin-lin, log-lin, lin-log y log-log: qué significa el coeficiente en cada caso y cómo elegir la especificación.',
    lead: 'Poner logaritmos cambia la pregunta que responde el coeficiente: en niveles mide unidades, con logaritmos mide porcentajes. Generá datos con una forma y estimalos con otra para ver qué pasa.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l" for="ff-t">Cómo se generan los datos</label><select class="field" id="ff-t">${Object.entries(SPEC).map(([k, v]) => `<option value="${k}" ${k === 'loglog' ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
      <div><label class="l" for="ff-e">Qué modelo estimás</label><select class="field" id="ff-e">${Object.entries(SPEC).map(([k, v]) => `<option value="${k}" ${k === 'loglog' ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div><button class="btn sm" id="ff-go" style="align-self:flex-start">Nuevos datos</button><dl class="stats" id="ff-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Datos en niveles</h3><canvas id="ff-a" style="height:280px"></canvas></div><div><h3>Datos transformados</h3><canvas id="ff-b" style="height:280px"></canvas></div></div><div class="steplist" id="ff-steps"></div></div></div>`,
    init() { $('#ff-t').onchange = e => { st.truth = e.target.value; gen(); upd(); }; $('#ff-e').onchange = e => { st.est = e.target.value; upd(); }; $('#ff-go').onclick = () => { gen(); upd(); }; gen(); upd(); },
    draw
  });
  let fit = null;
  function upd() {
    const [, ty, tx] = SPEC[st.est]; fit = ols(data.map(d => [1, tx(d[0])]), data.map(d => ty(d[1]))); const b = fit.b[1];
    const txt = { linlin: `Si x sube 1 unidad, y sube <b>${f3(b)}</b> unidades.`, loglin: `Si x sube 1 unidad, y sube aproximadamente <b>${f2(100 * b)}%</b> (exacto: ${pct(Math.exp(b) - 1, 2)}). Típico de la ecuación de salarios: cada año de educación sube el salario un X%.`, linlog: `Si x sube 1%, y sube <b>${fmt(b / 100, 4)}</b> unidades (β/100).`, loglog: `Si x sube 1%, y sube <b>${f3(b)}%</b>: el coeficiente es directamente una <b>elasticidad</b>.` }[st.est];
    $('#ff-st').innerHTML = A.stats([['β₁ estimado', f3(b)], ['R² (en la escala estimada)', f3(fit.r2)]]);
    $('#ff-steps').innerHTML = A.steps([`<b>Interpretación:</b> ${txt}`, st.est === st.truth ? 'Estimaste la misma forma con la que se generaron los datos: en el gráfico transformado los puntos forman una recta.' : 'Estimaste una forma distinta a la real: mirá el gráfico transformado, los puntos no siguen una recta y los residuos van a tener un patrón. Elegir mal la forma funcional es un error de especificación.', 'Ojo: el R² de un modelo con ln y no se puede comparar con el de uno con y en niveles, porque explican variables distintas.', 'Los logaritmos además achican la influencia de los valores grandes y suelen arreglar la heterocedasticidad en variables como ingresos o precios.']);
    draw();
  }
  function draw() {
    if (!data || !fit) return; const [, ty, tx] = SPEC[st.est], ys = data.map(d => d[1]);
    const a = A.ax($('#ff-a'), [0, 51], [0, Math.max(...ys) * 1.05], { l: 44 }); if (a) { data.forEach(d => a.dot(d[0], d[1], K.teal, 2.6)); a.fn(x => { const v = fit.b[0] + fit.b[1] * tx(x); return st.est.startsWith('log') ? Math.exp(v) : v; }, K.amber, 2.2, null, [1, 50]); a.labels('x', 'y'); }
    const tX = data.map(d => tx(d[0])), tY = data.map(d => ty(d[1])), x0 = Math.min(...tX), x1 = Math.max(...tX), y0 = Math.min(...tY), y1 = Math.max(...tY);
    const b = A.ax($('#ff-b'), [x0, x1], [y0 - (y1 - y0) * .05, y1 + (y1 - y0) * .05], { l: 44 }); if (b) { tX.forEach((x, i) => b.dot(x, tY[i], K.teal, 2.6)); b.fn(x => fit.b[0] + fit.b[1] * x, K.amber, 2.2); b.labels(st.est.endsWith('log') ? 'ln x' : 'x', st.est.startsWith('log') ? 'ln y' : 'y'); }
  }
}

/* ================= Variables dummy e interacciones ================= */
{
  const st = { inter: true }; let data = null, fit = null;
  const D = [['gap', 'Brecha salarial de base (mujeres)', -150, 150, 5, -60, 0], ['sl', 'Diferencia en el retorno a la educación', -20, 20, 1, -8, 0]];
  const gen = () => { data = Array.from({ length: 160 }, () => { const m = Math.random() < .5 ? 1 : 0, e = 8 + Math.floor(Math.random() * 11); return [e, m, 200 + 45 * e + st.gap * m + st.sl * m * (e - 8) + 70 * N()]; }); };
  A.tool({
    id: 'dummies', mat: 'econometria', unit: 2, ord: 2, name: 'Variables dummy e interacciones', short: 'Dummies', tag: 'Variables binarias explicativas', f: 'y = β₀ + β₁x + β₂D + β₃(D·x)',
    desc: 'Cómo meter una variable sí/no en una regresión, qué mide su coeficiente y cuándo hace falta una interacción.',
    lead: 'Una dummy vale 1 o 0 (por ejemplo, mujer = 1). Sola, corre la recta para arriba o para abajo (cambia la ordenada). Interactuada con otra variable, cambia la pendiente: permite que el efecto de la educación sea distinto para cada grupo. Datos simulados de salario y educación.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('dm', D)}<label class="check"><input type="checkbox" id="dm-i" checked> Incluir la interacción mujer × educación</label><button class="btn sm" id="dm-go" style="align-self:flex-start">Nuevos datos</button></div>
      <div class="stage"><canvas id="dm-cv" style="height:340px"></canvas>${A.legend([['teal', 'Hombres'], ['rose', 'Mujeres']])}<div class="tbl-wrap"><table class="tbl" id="dm-tbl"></table></div><div class="steplist" id="dm-steps"></div></div></div>`,
    init() { A.bindSliders('dm', D, st, () => { gen(); upd(); }); $('#dm-i').onchange = e => { st.inter = e.target.checked; upd(); }; $('#dm-go').onclick = () => { gen(); upd(); }; gen(); upd(); },
    draw
  });
  function upd() {
    const X = data.map(([e, m]) => st.inter ? [1, e, m, m * e] : [1, e, m]), y = data.map(d => d[2]); fit = ols(X, y); const df = fit.n - fit.k;
    const nm = ['constante', 'educación', 'mujer', 'mujer × educación'];
    $('#dm-tbl').innerHTML = `<tr><th>Variable</th><th>Coef.</th><th>EE</th><th>p-valor</th></tr>` + fit.b.map((b, i) => { const p = pT(b / fit.se[i], df); return `<tr><td>${nm[i]}</td><td>${f2(b)}</td><td>${f2(fit.se[i])}</td><td style="color:${p < .05 ? 'var(--amber)' : 'inherit'}">${p < 1e-4 ? '< 0,0001' : fmt(p, 4)}</td></tr>`; }).join('');
    const b = fit.b;
    $('#dm-steps').innerHTML = A.steps(st.inter ? [
      `Hombres (mujer = 0): salario = ${f2(b[0])} + ${f2(b[1])}·educación.`,
      `Mujeres (mujer = 1): salario = (${f2(b[0])} + ${f2(b[2])}) + (${f2(b[1])} + ${f2(b[3])})·educación = ${f2(b[0] + b[2])} + ${f2(b[1] + b[3])}·educación.`,
      `β₂ = ${f2(b[2])} es la diferencia de ordenada (con educación = 0, que no es un caso real); β₃ = ${f2(b[3])} es cuánto <b>difiere el retorno</b> de cada año de estudio entre grupos. La brecha a los 12 años de estudio: ${f2(b[2] + 12 * b[3])}.`]
      : [`Sin interacción, las dos rectas son paralelas: salario = ${f2(b[0])} + ${f2(b[1])}·educación ${b[2] < 0 ? '−' : '+'} ${f2(Math.abs(b[2]))}·mujer.`, `β₂ = ${f2(b[2])}: a igual educación, las mujeres ganan en promedio ${f2(b[2])} ${b[2] < 0 ? 'menos' : 'más'}. ${st.sl ? 'Pero los datos se generaron con retornos distintos: forzar rectas paralelas es una mala especificación. Tildá la interacción.' : ''}`, `<b>Trampa de las dummies:</b> nunca pongas una dummy por cada categoría junto con la constante (mujer y hombre a la vez): son perfectamente colineales.`]);
    draw();
  }
  function draw() {
    if (!fit) return; const ys = data.map(d => d[2]), g = A.ax($('#dm-cv'), [7.5, 18.5], [Math.min(...ys) * .95, Math.max(...ys) * 1.03], { l: 46 }); if (!g) return;
    data.forEach(([e, m, w], i) => g.dot(e + (Math.sin(i * 7.3) * .18), w, m ? 'rgba(239,115,145,.75)' : 'rgba(67,200,184,.75)', 2.8));
    const b = fit.b; g.fn(e => b[0] + b[1] * e, K.teal, 2.4, null, [8, 18]); g.fn(e => b[0] + b[2] + (b[1] + (st.inter ? b[3] : 0)) * e, K.rose, 2.4, null, [8, 18]); g.labels('Años de educación', 'Salario');
  }
}

/* ================= Variables instrumentales ================= */
{
  const st = {}; let sims = null;
  const D = [['rho', 'Endogeneidad: correlación entre x y el error', 0, .9, .05, .5, 2], ['pi', 'Fuerza del instrumento (relevancia)', .02, 1.5, .02, .6, 2], ['n', 'Observaciones', 50, 1000, 50, 300, 0]];
  A.tool({
    id: 'iv', mat: 'econometria', unit: 5, ord: 1, name: 'Variables instrumentales y MC2E', short: 'Variables instrumentales', tag: 'Endogeneidad', f: 'β̂ᵢᵥ = Cov(z, y) / Cov(z, x)',
    desc: 'Cuando x está correlacionada con el error, MCO está sesgado. Un instrumento válido lo corrige. Mirá qué pasa con instrumentos débiles.',
    lead: 'Si x es endógena (por variable omitida, causalidad inversa o error de medición), MCO no estima el efecto causal. Un instrumento z mueve a x pero no afecta a y por otro camino. Usando solo la variación de x que viene de z, se recupera el efecto real. Modelo: y = 1 + 1·x + u.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('vi', D)}<button class="btn primary sm" id="vi-go" style="align-self:flex-start">Simular 500 muestras</button><dl class="stats" id="vi-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="vi-cv" style="height:320px"></canvas>${A.legend([['rose', 'MCO'], ['teal', 'Variables instrumentales'], ['fg', 'Efecto real = 1']])}<div class="steplist" id="vi-steps"></div></div></div>`,
    init() { A.bindSliders('vi', D, st, run); $('#vi-go').onclick = run; run(); },
    draw
  });
  function run() {
    const o = [], iv = [], Fs = [];
    for (let s = 0; s < 500; s++) {
      let szx = 0, szy = 0, sxx = 0, sxy = 0, sz = 0, sx = 0, sy = 0, szz = 0; const n = st.n;
      for (let i = 0; i < n; i++) { const z = N(), e1 = N(), e2 = N(), u = e1, v = st.rho * e1 + Math.sqrt(1 - st.rho ** 2) * e2, x = st.pi * z + v, y = 1 + x + u; sz += z; sx += x; sy += y; szx += z * x; szy += z * y; sxx += x * x; sxy += x * y; szz += z * z; }
      const cxz = szx / n - sz * sx / n / n, cyz = szy / n - sz * sy / n / n, vx = sxx / n - (sx / n) ** 2, cxy = sxy / n - sx * sy / n / n, vz = szz / n - (sz / n) ** 2;
      o.push(cxy / vx); iv.push(cyz / cxz); const r2 = cxz * cxz / (vz * vx); Fs.push(r2 / (1 - r2) * (n - 2));
    }
    sims = { o, iv };
    const med = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)], F = mean(Fs);
    $('#vi-st').innerHTML = A.stats([['MCO (mediana)', f3(med(o))], ['VI (mediana)', f3(med(iv))], ['F de la primera etapa', f2(F)]]);
    $('#vi-steps').innerHTML = A.steps([
      `MCO se centra en ${f3(med(o))} en vez de 1: el sesgo es ≈ Cov(x, u)/Var(x). Como x y el error se mueven juntos, MCO le atribuye a x un efecto que no es suyo.`,
      `<b>MC2E:</b> primera etapa, regresar x sobre z y quedarse con x̂ (la parte de x que explica z). Segunda etapa, regresar y sobre x̂. Equivale a β̂ = Cov(z, y)/Cov(z, x). Mediana: <b>${f3(med(iv))}</b>.`,
      `Un instrumento tiene que cumplir dos condiciones: <b>relevancia</b> (z mueve a x: se testea con el F de la primera etapa) y <b>exogeneidad</b> (z no afecta a y por otro camino: no se puede testear, se argumenta).`,
      `${F < 10 ? `<b>Instrumento débil:</b> F = ${f2(F)} < 10. Las estimaciones de VI quedan muy dispersas y sesgadas hacia MCO. Mirá la campana verde.` : `F = ${f2(F)} > 10: el instrumento es fuerte. Bajá la relevancia y mirá cómo se rompe todo.`} Ejemplo clásico: usar la distancia a la universidad como instrumento de los años de educación.`]);
    draw();
  }
  function draw() { if (!sims) return; const lo = -.5, hi = 2.5, bins = 60, a = binsOf(sims.o, lo, hi, bins), b = binsOf(sims.iv, lo, hi, bins), ym = Math.max(...a, ...b) * 1.1, g = A.ax($('#vi-cv'), [lo, hi], [0, ym], { yf: v => fmt(v, 0) }); if (!g) return; hbars(g, sims.o, lo, hi, bins, 'rgba(239,115,145,.6)'); hbars(g, sims.iv, lo, hi, bins, 'rgba(67,200,184,.6)'); g.vline(1, K.fg, 2); }
}

/* ================= Diferencias en diferencias ================= */
{
  const st = { c0: 50, c1: 55, t0: 40, t1: 52 };
  A.tool({
    id: 'did', mat: 'econometria', unit: 5, ord: 2, name: 'Diferencias en diferencias', short: 'Dif. en dif.', tag: 'Evaluación de impacto', f: 'DiD = (T₁ − T₀) − (C₁ − C₀)',
    desc: 'Medí el efecto de un programa comparando cómo cambió el grupo tratado contra cómo cambió un grupo de control.',
    lead: 'Un municipio lanza un programa de empleo joven y otro no. Comparar solo el "después" mezcla el programa con diferencias previas entre municipios; comparar solo "antes y después" mezcla el programa con lo que hubiera pasado igual. Restar las dos diferencias aísla el efecto. Cargá los promedios.',
    body: `<div class="bench"><div class="ctrl"><div class="grid2"><div><label class="l" for="dd-c0">Control: antes</label><input class="field" id="dd-c0" value="50"></div><div><label class="l" for="dd-c1">Control: después</label><input class="field" id="dd-c1" value="55"></div><div><label class="l" for="dd-t0">Tratado: antes</label><input class="field" id="dd-t0" value="40"></div><div><label class="l" for="dd-t1">Tratado: después</label><input class="field" id="dd-t1" value="52"></div></div>
      <p class="note">Por ejemplo: tasa de empleo de los jóvenes (%) en cada municipio.</p></div>
      <div class="stage"><div class="big sm" id="dd-res"></div><canvas id="dd-cv" style="height:320px"></canvas>${A.legend([['teal', 'Control'], ['amber', 'Tratado'], ['faint', 'Contrafactual (tendencia paralela)'], ['rose', 'Efecto estimado']])}<div class="steplist" id="dd-steps"></div></div></div>`,
    init() { ['c0', 'c1', 't0', 't1'].forEach(k => $('#dd-' + k).oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st[k] = v; upd(); } }); upd(); },
    draw
  });
  function upd() {
    const dT = st.t1 - st.t0, dC = st.c1 - st.c0, did = dT - dC;
    $('#dd-res').textContent = 'Efecto = ' + (did >= 0 ? '+' : '') + f2(did);
    $('#dd-steps').innerHTML = A.steps([
      `Cambio en el grupo tratado: ${f2(st.t1)} − ${f2(st.t0)} = ${f2(dT)}. Esto incluye el programa <b>y</b> todo lo que cambió en la economía.`,
      `Cambio en el grupo de control: ${f2(st.c1)} − ${f2(st.c0)} = ${f2(dC)}. Esto es lo que habría pasado sin programa.`,
      `Diferencia en diferencias: ${f2(dT)} − ${f2(dC)} = <b>${f2(did)}</b>. Comparando solo el después (${f2(st.t1 - st.c1)}) o solo el tratado antes y después (${f2(dT)}) te equivocarías.`,
      `En regresión: y = β₀ + β₁·Tratado + β₂·Después + β₃·(Tratado × Después) + u, y β₃ es el estimador DiD.`,
      `<b>Supuesto clave — tendencias paralelas:</b> sin el programa, los dos grupos habrían evolucionado igual (línea punteada). No se puede probar, pero se revisa mirando que antes del programa las tendencias hayan sido parecidas.`]);
    draw();
  }
  function draw() { const v = [st.c0, st.c1, st.t0, st.t1], g = A.ax($('#dd-cv'), [-.3, 1.3], [Math.min(...v) * .9, Math.max(...v) * 1.08], { xticks: [0, 1], xf: v => v ? 'Después' : 'Antes', l: 40 }); if (!g) return; g.path([[0, st.c0], [1, st.c1]], K.teal, 2.4); g.path([[0, st.t0], [1, st.t1]], K.amber, 2.4); const cf = st.t0 + st.c1 - st.c0; g.path([[0, st.t0], [1, cf]], K.faint, 1.6, [6, 4]); g.path([[1, cf], [1, st.t1]], K.rose, 3); [[0, st.c0, K.teal], [1, st.c1, K.teal], [0, st.t0, K.amber], [1, st.t1, K.amber], [1, cf, K.faint]].forEach(([x, y, c]) => g.dot(x, y, c, 5.5)); }
}

/* ================= Datos de panel: efectos fijos ================= */
{
  const st = {}; let data = null, R = null;
  const D = [['k', 'Correlación entre el efecto de cada empresa y x', -2, 2, .1, 1.2, 1], ['n', 'Empresas', 2, 5, 1, 5, 0]];
  const gen = () => { data = []; for (let i = 0; i < st.n; i++) { const a = (i - (st.n - 1) / 2) * 3; for (let t = 0; t < 12; t++) { const x = st.k * a + N(); data.push([i, x, a + 1 * x + .6 * N()]); } } };
  A.tool({
    id: 'panel', mat: 'econometria', unit: 6, name: 'Datos de panel: efectos fijos', short: 'Efectos fijos', tag: 'Heterogeneidad no observada', f: 'yᵢₜ − ȳᵢ = β(xᵢₜ − x̄ᵢ) + (uᵢₜ − ūᵢ)',
    desc: 'Con datos de varias empresas en varios años podés eliminar todo lo que es fijo de cada una. MCO agrupado vs. efectos fijos.',
    lead: 'Cada empresa tiene algo propio que no observamos (gestión, ubicación, marca) y que puede estar correlacionado con x. Si se ignora, MCO mezcla las diferencias entre empresas con el efecto de x. Efectos fijos compara a cada empresa consigo misma a lo largo del tiempo. Efecto real de x: 1.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('pn', D)}<button class="btn sm" id="pn-go" style="align-self:flex-start">Nuevos datos</button><dl class="stats" id="pn-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="pn-cv" style="height:380px"></canvas><div class="legend"><span><i style="background:var(--fg)"></i>MCO agrupado (ignora las empresas)</span><span>Colores: rectas de efectos fijos de cada empresa</span></div><div class="steplist" id="pn-steps"></div></div></div>`,
    init() { A.bindSliders('pn', D, st, () => { gen(); upd(); }); $('#pn-go').onclick = () => { gen(); upd(); }; gen(); upd(); },
    draw
  });
  function upd() {
    const pool = ols(data.map(d => [1, d[1]]), data.map(d => d[2])), mx = {}, my = {};
    for (let i = 0; i < st.n; i++) { const s = data.filter(d => d[0] === i); mx[i] = mean(s.map(d => d[1])); my[i] = mean(s.map(d => d[2])); }
    let sxy = 0, sxx = 0; data.forEach(([i, x, y]) => { sxy += (x - mx[i]) * (y - my[i]); sxx += (x - mx[i]) ** 2; }); const fe = sxy / sxx;
    R = { pool, fe, mx, my };
    $('#pn-st').innerHTML = A.stats([['MCO agrupado', f3(pool.b[1])], ['Efectos fijos', f3(fe)], ['Valor real', '1']]);
    $('#pn-steps').innerHTML = A.steps([
      `MCO agrupado tira todos los puntos juntos y da β̂ = <b>${f3(pool.b[1])}</b>. ${Math.abs(st.k) > .2 ? `Está ${pool.b[1] > 1 ? 'sobre' : 'sub'}estimado porque las empresas con más x también tienen un efecto propio ${st.k > 0 ? 'más alto' : 'más bajo'}.` : 'Como el efecto de cada empresa no está correlacionado con x, acá no hay sesgo.'}`,
      `<b>Efectos fijos (estimador within):</b> a cada observación le resto el promedio de su empresa. Así desaparece todo lo que es constante en el tiempo, observado o no. β̂ = <b>${f3(fe)}</b>.`,
      `Gráficamente: una recta por empresa, todas con la misma pendiente y distinta ordenada. Es equivalente a poner una dummy por empresa.`,
      `El costo: no se puede estimar el efecto de nada que no cambie en el tiempo (como el sector de la empresa), y se usa solo la variación dentro de cada empresa, que puede ser poca.`]);
    draw();
  }
  function draw() {
    if (!R) return; const xs = data.map(d => d[1]), ys = data.map(d => d[2]), g = A.ax($('#pn-cv'), [Math.min(...xs) - .5, Math.max(...xs) + .5], [Math.min(...ys) - 1, Math.max(...ys) + 1], { l: 40 }); if (!g) return;
    data.forEach(([i, x, y]) => g.dot(x, y, K[COL5[i]], 3.2));
    for (let i = 0; i < st.n; i++) { const s = data.filter(d => d[0] === i).map(d => d[1]); g.fn(x => R.my[i] + R.fe * (x - R.mx[i]), K[COL5[i]], 1.8, null, [Math.min(...s), Math.max(...s)]); }
    g.fn(x => R.pool.b[0] + R.pool.b[1] * x, K.fg, 2.4, [7, 4]); g.labels('x', 'y');
  }
}

/* ================= Autocorrelación ================= */
{
  const st = {}; let one = null;
  const D = [['rho', 'Autocorrelación del error ρ', -.9, .95, .05, .7, 2], ['n', 'Períodos', 30, 300, 10, 100, 0]];
  const gen = n => { const X = [], y = [], e = []; let u = 0, x = 0; for (let t = 0; t < n; t++) { u = st.rho * u + N(); x = .8 * x + N(); X.push([1, x]); y.push(1 + 2 * x + u); } return { X, y }; };
  A.tool({
    id: 'autocorrelacion', mat: 'econometria', unit: 7, ord: 1, name: 'Autocorrelación de los errores', short: 'Autocorrelación', tag: 'Durbin-Watson', f: 'DW ≈ 2·(1 − ρ̂)',
    desc: 'En series de tiempo el error de hoy se parece al de ayer. MCO sigue insesgado pero sus errores estándar engañan.',
    lead: 'Modelo y = 1 + 2·x + u con uₜ = ρ·uₜ₋₁ + εₜ. Si los errores están correlacionados en el tiempo, cada dato aporta menos información nueva de la que MCO cree, y los tests rechazan de más.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ac', D)}<button class="btn primary sm" id="ac-go" style="align-self:flex-start">Nueva simulación</button><dl class="stats" id="ac-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Residuos en el tiempo</h3><canvas id="ac-cv" style="height:240px"></canvas><div class="steplist" id="ac-steps"></div></div></div>`,
    init() { A.bindSliders('ac', D, st, run); $('#ac-go').onclick = run; run(); },
    draw
  });
  function run() {
    const d = gen(st.n), f = ols(d.X, d.y); let num = 0, den = 0; f.e.forEach((e, t) => { den += e * e; if (t) num += (e - f.e[t - 1]) ** 2; }); const dw = num / den;
    one = f; const bs = [], ses = []; for (let s = 0; s < 400; s++) { const g = gen(st.n), h = ols(g.X, g.y); bs.push(h.b[1]); ses.push(h.se[1]); }
    const real = sd(bs), cl = mean(ses);
    $('#ac-st').innerHTML = A.stats([['Durbin-Watson', f2(dw)], ['ρ estimado (≈ 1 − DW/2)', f2(1 - dw / 2)], ['Desvío real de β̂', f3(real)], ['EE común (promedio)', f3(cl)]]);
    $('#ac-steps').innerHTML = A.steps([
      `Estadístico de Durbin-Watson: Σ(êₜ − êₜ₋₁)²/Σêₜ² = <b>${f2(dw)}</b>. Vale 2 sin autocorrelación, cerca de 0 con autocorrelación positiva fuerte y cerca de 4 con negativa.`,
      `En el gráfico, con ρ positivo los residuos forman "rachas" largas arriba y abajo de cero; con ρ negativo saltan de signo todo el tiempo.`,
      `En 400 simulaciones β̂ varió con desvío ${f3(real)}, pero MCO informa en promedio ${f3(cl)}: ${cl < real * .85 ? `<b>subestima la incertidumbre en ${pct(1 - cl / real, 0)}</b>.` : 'con poca autocorrelación la diferencia es chica.'} Solución: errores estándar de Newey-West, o modelar la dinámica (por ejemplo con Cochrane-Orcutt o agregando rezagos).`]);
    draw();
  }
  function draw() { if (!one) return; const em = Math.max(...one.e.map(Math.abs)) * 1.1, g = A.ax($('#ac-cv'), [0, one.e.length - 1], [-em, em], { l: 40 }); if (!g) return; g.hline(0, K.faint, 1); g.path(one.e.map((e, t) => [t, e]), K.amber, 1.6); one.e.forEach((e, t) => g.dot(t, e, e >= 0 ? K.teal : K.rose, 2.2)); }
}

/* ================= Test de Dickey-Fuller ================= */
{
  const st = {}; let ts = null;
  const D = [['phi', 'φ real de la serie', .7, 1, .01, 1, 2], ['n', 'Períodos', 30, 500, 10, 100, 0]];
  A.tool({
    id: 'dickey-fuller', mat: 'econometria', unit: 7, ord: 2, name: 'Raíz unitaria: test de Dickey-Fuller', short: 'Dickey-Fuller', tag: 'Estacionariedad', f: 'Δyₜ = α + δ·yₜ₋₁ + εₜ',
    desc: 'Testeá si una serie es una caminata aleatoria. Por qué el estadístico no sigue una distribución t común.',
    lead: 'Para saber si una serie tiene raíz unitaria se regresa Δyₜ sobre yₜ₋₁ y se testea δ = 0 (que equivale a φ = 1). El problema: bajo esa hipótesis el estadístico t no tiene distribución t de Student, sino una propia, más corrida a la izquierda. Si usás los valores críticos de siempre, rechazás de más.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('df', D)}<button class="btn primary sm" id="df-go" style="align-self:flex-start">Simular 2.000 series</button><dl class="stats" id="df-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="df-cv" style="height:320px"></canvas>${A.legend([['amber', 'Estadístico t observado'], ['teal', 'Normal estándar (lo que uno esperaría)'], ['rose', 'Valor crítico de Dickey-Fuller (−2,86)']])}<div class="steplist" id="df-steps"></div></div></div>`,
    init() { A.bindSliders('df', D, st, run); $('#df-go').onclick = run; run(); },
    draw
  });
  function run() {
    ts = []; for (let s = 0; s < 2000; s++) { let y = 0; const X = [], d = []; for (let t = 0; t < st.n; t++) { const yn = st.phi * y + N(); X.push([1, y]); d.push(yn - y); y = yn; } const f = ols(X, d); if (f) ts.push(f.b[1] / f.se[1]); }
    const rejN = ts.filter(t => t < -1.645).length / ts.length, rejDF = ts.filter(t => t < -2.86).length / ts.length;
    $('#df-st').innerHTML = A.stats([['Rechazos con valor crítico normal (−1,645)', pct(rejN, 1)], ['Rechazos con valor crítico DF (−2,86)', pct(rejDF, 1)]]);
    $('#df-steps').innerHTML = A.steps(st.phi >= .995 ? [
      `Acá la serie <b>tiene</b> raíz unitaria (φ = 1). Un test bien calibrado al 5% debería rechazar solo el 5% de las veces.`,
      `Con el valor crítico normal rechazarías el ${pct(rejN, 1)}: muchísimas veces concluirías que la serie es estacionaria cuando no lo es.`,
      `Con el valor crítico de Dickey-Fuller (−2,86 con constante) rechazás el ${pct(rejDF, 1)}, que es lo correcto. Fijate que la distribución amarilla está corrida a la izquierda de la normal.`]
      : [`Acá la serie es estacionaria (φ = ${f2(st.phi)}). Rechazar H₀ es lo correcto.`, `El test de Dickey-Fuller rechaza en el ${pct(rejDF, 1)} de los casos: esa es su <b>potencia</b>. Con φ cerca de 1 y pocos datos es muy baja: al test le cuesta distinguir una serie muy persistente de una caminata aleatoria. Subí n y mirá cómo mejora.`]);
    draw();
  }
  function draw() { if (!ts) return; const lo = -6, hi = 4, bins = 60, cnt = binsOf(ts, lo, hi, bins), ym = Math.max(...cnt, ts.length * (hi - lo) / bins * S.normPdf(0)) * 1.1, g = A.ax($('#df-cv'), [lo, hi], [0, ym], { yf: v => fmt(v, 0) }); if (!g) return; hbars(g, ts, lo, hi, bins, 'rgba(242,169,59,.75)'); g.fn(x => ts.length * (hi - lo) / bins * S.normPdf(x), K.teal, 2); g.vline(-2.86, K.rose, 2); g.vline(-1.645, K.faint, 1.2, [4, 4]); }
}
})();
