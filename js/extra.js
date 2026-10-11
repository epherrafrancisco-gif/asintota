/* Asíntota · Estadística II (chi cuadrado, potencia) y Álgebra Lineal (cadenas de Markov) */
(() => {
const { $, $$, K, fmt, pct, S } = A;
const f3 = x => fmt(x, 3), f2 = x => fmt(x, 2);

/* ================= Test chi cuadrado de independencia ================= */
{
  const st = { rows: ['Economía', 'Administración', 'Contador'], cols: ['Usa IA para estudiar', 'No usa'], M: [[48, 22], [35, 30], [20, 35]] };
  let R = null;
  A.tool({
    id: 'chicuadrado', mat: 'est2', unit: 2, ord: 1, name: 'Test chi cuadrado de independencia', short: 'Chi cuadrado', tag: 'Tablas de contingencia', f: 'χ² = Σ (O − E)² / E',
    desc: 'Cargá una tabla de doble entrada y testeá si las dos variables están relacionadas o son independientes.',
    lead: '¿La carrera influye en si un estudiante usa IA para estudiar? Si fueran independientes, cada celda tendría un valor esperado; el test mide cuánto se alejan los datos observados de eso. Los números de ejemplo son inventados.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Frecuencias observadas</label><div id="cq-in" class="mtx-in"></div></div>
      <div class="row"><button class="btn sm" id="cq-ra">+ fila</button><button class="btn sm" id="cq-rd">− fila</button><button class="btn sm" id="cq-ca">+ columna</button><button class="btn sm" id="cq-cd">− columna</button></div><dl class="stats" id="cq-st" style="margin:0"></dl></div>
      <div class="stage"><div id="cq-pill"></div><canvas id="cq-cv" style="height:240px"></canvas><h3>Esperados si fueran independientes</h3><div class="tbl-wrap"><table class="tbl" id="cq-exp"></table></div><div class="steplist" id="cq-steps"></div></div></div>`,
    init() {
      $('#cq-ra').onclick = () => { if (st.rows.length < 5) { st.rows.push('Grupo ' + (st.rows.length + 1)); st.M.push(st.cols.map(() => 20)); build(); } };
      $('#cq-rd').onclick = () => { if (st.rows.length > 2) { st.rows.pop(); st.M.pop(); build(); } };
      $('#cq-ca').onclick = () => { if (st.cols.length < 5) { st.cols.push('Cat. ' + (st.cols.length + 1)); st.M.forEach(r => r.push(20)); build(); } };
      $('#cq-cd').onclick = () => { if (st.cols.length > 2) { st.cols.pop(); st.M.forEach(r => r.pop()); build(); } };
      build();
    },
    draw
  });
  function build() {
    const box = $('#cq-in'); box.style.gridTemplateColumns = `minmax(80px,1.3fr) repeat(${st.cols.length}, minmax(0,1fr))`;
    box.innerHTML = `<span></span>${st.cols.map((c, j) => `<input class="field" data-c="${j}" value="${c}" style="font-size:12px">`).join('')}` + st.rows.map((r, i) => `<input class="field" data-r="${i}" value="${r}" style="font-size:12px;text-align:left">` + st.M[i].map((v, j) => `<input class="field" data-i="${i}" data-j="${j}" value="${v}">`).join('')).join('');
    $$('#cq-in [data-i]').forEach(el => el.oninput = () => { st.M[+el.dataset.i][+el.dataset.j] = A.num(el.value); run(); });
    $$('#cq-in [data-r]').forEach(el => el.oninput = () => { st.rows[+el.dataset.r] = el.value; run(); });
    $$('#cq-in [data-c]').forEach(el => el.oninput = () => { st.cols[+el.dataset.c] = el.value; run(); });
    run();
  }
  function run() {
    if (st.M.some(r => r.some(v => !(v >= 0)))) { $('#cq-steps').innerHTML = '<p class="err">Todas las frecuencias tienen que ser números mayores o iguales a 0.</p>'; R = null; draw(); return; }
    const rs = st.M.map(r => r.reduce((s, v) => s + v, 0)), cs = st.cols.map((_, j) => st.M.reduce((s, r) => s + r[j], 0)), N = rs.reduce((s, v) => s + v, 0);
    const E = st.M.map((r, i) => r.map((_, j) => rs[i] * cs[j] / N)); let chi = 0; st.M.forEach((r, i) => r.forEach((o, j) => chi += (o - E[i][j]) ** 2 / E[i][j]));
    const df = (st.rows.length - 1) * (st.cols.length - 1), p = 1 - S.chiCdf(chi, df), V = Math.sqrt(chi / (N * Math.min(st.rows.length - 1, st.cols.length - 1))), crit = S.inv(x => S.chiCdf(x, df), .95, 0, 1e3), low = E.flat().some(e => e < 5);
    R = { chi, df, p, crit };
    $('#cq-st').innerHTML = A.stats([['χ²', f3(chi)], ['Grados de libertad', df], ['p-valor', p < 1e-4 ? '< 0,0001' : fmt(p, 4)], ['V de Cramér', f3(V)]]);
    $('#cq-pill').innerHTML = `<span class="pill ${p < .05 ? 'warn' : 'ok'}">${p < .05 ? 'Hay relación (se rechaza independencia al 5%)' : 'No hay evidencia de relación al 5%'}</span>`;
    $('#cq-exp').innerHTML = `<tr><th></th>${st.cols.map(c => `<th>${c}</th>`).join('')}<th>Total</th></tr>` + st.rows.map((r, i) => `<tr><td>${r}</td>${E[i].map((e, j) => `<td>${f2(e)} <span style="color:var(--faint)">(obs. ${fmt(st.M[i][j], 0)})</span></td>`).join('')}<td>${fmt(rs[i], 0)}</td></tr>`).join('') + `<tr><td>Total</td>${cs.map(c => `<td>${fmt(c, 0)}</td>`).join('')}<td>${fmt(N, 0)}</td></tr>`;
    $('#cq-steps').innerHTML = A.steps([
      `H₀: las dos variables son independientes. Si es cierta, cada celda debería tener esperado = (total de fila × total de columna) / total. Por ejemplo, la primera: ${fmt(rs[0], 0)} × ${fmt(cs[0], 0)} / ${fmt(N, 0)} = ${f2(E[0][0])}.`,
      `Estadístico: sumo (observado − esperado)²/esperado en todas las celdas = <b>${f3(chi)}</b>.`,
      `Grados de libertad: (filas − 1) × (columnas − 1) = ${df}. El valor crítico al 5% es ${f3(crit)}; el p-valor es <b>${p < 1e-4 ? '< 0,0001' : fmt(p, 4)}</b>.`,
      `${p < .05 ? 'Se rechaza la independencia: la distribución entre columnas cambia según la fila.' : 'No se rechaza la independencia.'} La V de Cramér (${f3(V)}) mide la fuerza de la relación entre 0 (nada) y 1 (total).${low ? ' <b>Ojo:</b> hay esperados menores a 5, así que la aproximación chi cuadrado puede fallar (conviene el test exacto de Fisher).' : ''}`]);
    draw();
  }
  function draw() {
    if (!R) return; const xm = Math.max(R.crit * 1.6, R.chi * 1.15, R.df + 4), pdf = x => S.chiPdf(x, R.df);
    let ym = 0; for (let i = 1; i <= 200; i++) ym = Math.max(ym, pdf(xm * i / 200)); ym = Math.min(ym, .6) * 1.15;
    const g = A.ax($('#cq-cv'), [0, xm], [0, ym], { l: 40 }); if (!g) return;
    g.area(x => Math.min(pdf(x), ym), () => 0, R.crit, xm, 'rgba(239,115,145,.35)'); g.fn(x => Math.min(pdf(x), ym * 1.5), K.fg, 2, null, [xm * .002, xm]);
    g.vline(Math.min(R.chi, xm), K.amber, 2.2); g.text('χ² = ' + f2(R.chi), Math.min(R.chi, xm), ym * .9, K.amber, R.chi > xm * .7 ? 'right' : 'left', 'bottom', R.chi > xm * .7 ? -6 : 6);
  }
}

/* ================= Potencia y tamaño de muestra ================= */
{
  const st = { tails: 1 };
  const D = [['mu0', 'Media bajo H₀ (μ₀)', 0, 200, 1, 100, 0], ['mu1', 'Media real (μ₁)', 0, 200, .5, 105, 1], ['sd', 'Desvío poblacional σ', 1, 50, .5, 15, 1], ['n', 'Tamaño de muestra n', 2, 500, 1, 40, 0], ['al', 'Nivel de significación α', .01, .2, .01, .05, 2]];
  let R = null;
  A.tool({
    id: 'potencia', mat: 'est2', unit: 2, ord: 2, name: 'Errores tipo I y II, potencia y tamaño de muestra', short: 'Potencia', tag: 'Diseño de pruebas', f: 'n = ((z_α + z_β)·σ / Δ)²',
    desc: 'Visualizá α, β y la potencia de un test, y calculá cuántos datos necesitás para detectar una diferencia.',
    lead: 'Un test puede equivocarse de dos maneras: rechazar H₀ siendo cierta (error tipo I, probabilidad α) o no rechazarla siendo falsa (error tipo II, probabilidad β). La potencia, 1 − β, es la chance de detectar un efecto que existe.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Hipótesis alternativa</label>${A.seg('pw-t', [['1', 'Una cola (μ > μ₀)'], ['2', 'Dos colas (μ ≠ μ₀)']], '1')}</div>${A.sliders('pw', D)}<dl class="stats" id="pw-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="pw-cv" style="height:340px"></canvas>${A.legend([['fg', 'Distribución de x̄ si H₀ es cierta'], ['teal', 'Si la media real es μ₁'], ['rose', 'α: error tipo I'], ['amber', 'β: error tipo II']])}<div class="steplist" id="pw-steps"></div></div></div>`,
    init() { A.bindSliders('pw', D, st, upd); A.segBind('pw-t', v => { st.tails = +v; upd(); }); upd(); },
    draw
  });
  function upd() {
    const se = st.sd / Math.sqrt(st.n), za = S.zInv(1 - st.al / st.tails), cu = st.mu0 + za * se, cl = st.mu0 - za * se;
    const pw = st.tails === 1 ? 1 - S.normCdf(cu, st.mu1, se) : (1 - S.normCdf(cu, st.mu1, se)) + S.normCdf(cl, st.mu1, se), d = Math.abs(st.mu1 - st.mu0);
    const nreq = d > 0 ? Math.ceil(((za + S.zInv(.8)) * st.sd / d) ** 2) : Infinity;
    R = { se, cu, cl, pw };
    $('#pw-st').innerHTML = A.stats([['Error estándar', f3(se)], ['Valor crítico de x̄', st.tails === 1 ? f2(cu) : `${f2(cl)} y ${f2(cu)}`], ['Potencia', pct(pw, 1)], ['β (error tipo II)', pct(1 - pw, 1)], ['n para 80% de potencia', Number.isFinite(nreq) ? fmt(nreq, 0) : '—']]);
    $('#pw-steps').innerHTML = A.steps([
      `Error estándar de la media: σ/√n = ${f2(st.sd)}/√${st.n} = <b>${f3(se)}</b>.`,
      `Se rechaza H₀ si x̄ supera ${f2(cu)} (= μ₀ + z<sub>${fmt(1 - st.al / st.tails, 3)}</sub> × EE = ${f2(st.mu0)} + ${f3(za)} × ${f3(se)})${st.tails === 2 ? ` o si queda abajo de ${f2(cl)}` : ''}.`,
      `Si la media real es ${f2(st.mu1)}, la probabilidad de caer en la zona de rechazo es la <b>potencia: ${pct(pw, 1)}</b>. El resto, ${pct(1 - pw, 1)}, es β.`,
      `Para tener 80% de potencia con esta diferencia (${f2(d)}) hace falta n = ((z<sub>α</sub> + z<sub>0,8</sub>) × σ / Δ)² = ((${f3(za)} + 0,842) × ${f2(st.sd)} / ${f2(d)})² ≈ <b>${Number.isFinite(nreq) ? fmt(nreq, 0) : '∞'}</b>.`,
      `El dilema: bajar α (ser más exigente) sube β. La única forma de bajar los dos a la vez es juntar más datos, que angostan las dos campanas.`]);
    draw();
  }
  function draw() {
    if (!R) return; const lo = Math.min(st.mu0, st.mu1) - 4 * R.se, hi = Math.max(st.mu0, st.mu1) + 4 * R.se, p0 = x => S.normPdf(x, st.mu0, R.se), p1 = x => S.normPdf(x, st.mu1, R.se), ym = p0(st.mu0) * 1.15;
    const g = A.ax($('#pw-cv'), [lo, hi], [0, ym], { l: 46, yf: () => '' }); if (!g) return;
    g.area(p0, () => 0, R.cu, hi, 'rgba(239,115,145,.45)'); if (st.tails === 2) g.area(p0, () => 0, lo, R.cl, 'rgba(239,115,145,.45)');
    g.area(p1, () => 0, st.tails === 2 ? R.cl : lo, R.cu, 'rgba(242,169,59,.35)');
    g.fn(p0, K.fg, 2); g.fn(p1, K.teal, 2); g.vline(R.cu, K.rose, 1.4, [4, 3]); if (st.tails === 2) g.vline(R.cl, K.rose, 1.4, [4, 3]);
    g.text('H₀', st.mu0, p0(st.mu0), K.fg, 'center'); g.text('H₁', st.mu1, p1(st.mu1), K.teal, 'center'); g.labels('x̄', '');
  }
}

/* ================= Cadenas de Markov ================= */
{
  const PRE = {
    emp: { lab: 'Empleo y desempleo', s: ['Empleado', 'Desempleado'], P: [[.98, .02], [.25, .75]], x: [.9, .1], txt: 'Cada mes, el 2% de los empleados pierde el trabajo (tasa de separación s) y el 25% de los desempleados consigue uno (tasa de búsqueda f). La tasa de desempleo de largo plazo es s/(s + f), la <b>tasa natural de desempleo</b>.' },
    mkt: { lab: 'Cuotas de mercado', s: ['Marca A', 'Marca B', 'Marca C'], P: [[.8, .15, .05], [.1, .75, .15], [.1, .1, .8]], x: [.5, .3, .2], txt: 'Cada fila dice a dónde se van los clientes de cada marca al mes siguiente. El estado estacionario es la cuota de mercado de largo plazo, sin importar cómo arranque el mercado.' },
    cli: { lab: 'Ciclo económico', s: ['Expansión', 'Estancamiento', 'Recesión'], P: [[.85, .1, .05], [.3, .5, .2], [.2, .3, .5]], x: [0, 0, 1], txt: 'Un modelo simple de ciclo: desde cada estado hay cierta probabilidad de pasar a los otros. La distribución estacionaria dice qué fracción del tiempo pasa la economía en cada fase.' }
  };
  const st = { key: 'emp' }; let cur = null;
  A.tool({
    id: 'markov', mat: 'algebra', unit: 3, name: 'Cadenas de Markov', short: 'Markov', tag: 'Matrices de transición', f: 'π = π·P',
    desc: 'Modelá cómo se mueve una población entre estados (empleo, marcas, ciclo) y encontrá su distribución de largo plazo.',
    lead: 'Una cadena de Markov describe algo que salta entre estados con probabilidades fijas. Multiplicar la distribución actual por la matriz de transición da la del período siguiente. Si se repite muchas veces, converge a un estado estacionario π que cumple π = π·P: un autovector con autovalor 1.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Ejemplos</label><div class="chips">${Object.entries(PRE).map(([k, v]) => `<button class="chip" data-mk2="${k}">${v.lab}</button>`).join('')}</div></div>
      <div><label class="l">Matriz de transición (cada fila suma 1)</label><div id="mv-P" class="mtx-in"></div><p class="err" id="mv-err"></p></div>
      <div><label class="l">Distribución inicial</label><div id="mv-x" class="mtx-in"></div></div></div>
      <div class="stage"><dl class="stats" id="mv-st" style="margin:0"></dl><canvas id="mv-cv" style="height:300px"></canvas><div id="mv-leg"></div><div class="steplist" id="mv-steps"></div></div></div>`,
    init() { $$('[data-mk2]').forEach(b => b.onclick = () => { st.key = b.dataset.mk2; load(); }); load(); },
    draw
  });
  const COLS = ['amber', 'teal', 'rose', 'violet'];
  function load() { const p = PRE[st.key]; cur = { s: [...p.s], P: p.P.map(r => [...r]), x: [...p.x] }; build(); }
  function build() {
    const n = cur.s.length, P = $('#mv-P'), X = $('#mv-x');
    P.style.gridTemplateColumns = `minmax(90px,1.4fr) repeat(${n}, minmax(0,1fr))`; X.style.gridTemplateColumns = `repeat(${n}, minmax(0,1fr))`;
    P.innerHTML = `<span class="sep">de \\ a</span>${cur.s.map(s => `<span class="sep">${s}</span>`).join('')}` + cur.P.map((r, i) => `<span class="sep" style="text-align:left">${cur.s[i]}</span>` + r.map((v, j) => `<input class="field" data-i="${i}" data-j="${j}" value="${String(v).replace('.', ',')}">`).join('')).join('');
    X.innerHTML = cur.x.map((v, i) => `<input class="field" data-x="${i}" value="${String(v).replace('.', ',')}" aria-label="${cur.s[i]}">`).join('');
    $$('#mv-P [data-i]').forEach(el => el.oninput = () => { cur.P[+el.dataset.i][+el.dataset.j] = A.num(el.value); run(); });
    $$('#mv-x [data-x]').forEach(el => el.oninput = () => { cur.x[+el.dataset.x] = A.num(el.value); run(); });
    $('#mv-leg').innerHTML = A.legend(cur.s.map((s, i) => [COLS[i], s]));
    run();
  }
  let path = null, pi = null;
  function run() {
    const n = cur.s.length, bad = cur.P.some(r => r.some(v => !(v >= 0 && v <= 1)) || Math.abs(r.reduce((s, v) => s + v, 0) - 1) > 1e-6), sx = cur.x.reduce((s, v) => s + v, 0);
    $('#mv-err').textContent = bad ? 'Cada fila tiene que tener probabilidades entre 0 y 1 que sumen 1.' : Math.abs(sx - 1) > 1e-6 ? 'La distribución inicial tiene que sumar 1.' : '';
    if (bad || Math.abs(sx - 1) > 1e-6) { path = null; draw(); return; }
    path = [cur.x]; for (let t = 0; t < 40; t++) { const p = path[t]; path.push(cur.s.map((_, j) => p.reduce((s, v, i) => s + v * cur.P[i][j], 0))); }
    pi = [...cur.x]; for (let t = 0; t < 5000; t++) pi = cur.s.map((_, j) => pi.reduce((s, v, i) => s + v * cur.P[i][j], 0));
    $('#mv-st').innerHTML = A.stats(cur.s.map((s, i) => [`${s} a largo plazo`, pct(pi[i], 1)]));
    const nx = path[1];
    $('#mv-steps').innerHTML = A.steps([
      `Un período después: x₁ = x₀·P. Por ejemplo, para "${cur.s[0]}": ${cur.x.map((v, i) => `${f2(v)}×${f2(cur.P[i][0])}`).join(' + ')} = <b>${pct(nx[0], 1)}</b>.`,
      `Repitiendo, la distribución converge (gráfico). El estado estacionario cumple π = π·P y suma 1: <b>${cur.s.map((s, i) => `${s} ${pct(pi[i], 1)}`).join(', ')}</b>.`,
      PRE[st.key].txt + (st.key === 'emp' ? ` Acá: s/(s + f) = ${f2(cur.P[0][1])}/(${f2(cur.P[0][1])} + ${f2(cur.P[1][0])}) = <b>${pct(cur.P[0][1] / (cur.P[0][1] + cur.P[1][0]), 1)}</b>.` : ''),
      `En álgebra lineal: π es el autovector izquierdo de P asociado al autovalor 1. Todas las matrices de transición tienen ese autovalor.`]);
    draw();
  }
  function draw() {
    if (!path) return; const g = A.ax($('#mv-cv'), [0, 40], [0, 1], { ystep: .25, yf: v => pct(v, 0), xf: v => 't = ' + fmt(v, 0), xt: 4 }); if (!g) return;
    cur.s.forEach((_, i) => { g.hline(pi[i], `rgba(141,147,167,.4)`, 1, [3, 4]); g.path(path.map((p, t) => [t, p[i]]), K[COLS[i]], 2.2); });
  }
}
})();
