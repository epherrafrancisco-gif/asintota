/* Asíntota · Macroeconomía (ampliación) */
(() => {
const { $, $$, K, fmt, pct } = A;
const f2 = x => fmt(x, 2), f0 = x => fmt(x, 0), money = x => '$' + fmt(x, 0);

/* ================= PBI nominal, real, deflactor e IPC ================= */
{
  const st = { g: [['Pan (kg)', 1000, 500, 1600, 520], ['Remeras', 8000, 120, 11000, 130], ['Celulares', 300000, 20, 520000, 26]] };
  A.tool({
    id: 'pbi', mat: 'macro', unit: 1, name: 'PBI nominal, PBI real, deflactor e IPC', short: 'PBI e IPC', tag: 'Cuentas nacionales', f: 'Deflactor = PBI nominal / PBI real × 100',
    desc: 'Cargá precios y cantidades de dos años y separá cuánto creció la economía de verdad y cuánto fue inflación.',
    lead: 'Si el PBI medido en pesos sube, puede ser porque se produjo más o porque todo está más caro. El PBI real valúa la producción de cada año a los precios de un año base, así se aíslan las cantidades. Economía de ejemplo con tres bienes.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Precios y cantidades</label><div class="tbl-wrap"><table class="tbl" id="pb-in"></table></div></div><p class="note">Año 1 es el año base. Editá cualquier número.</p></div>
      <div class="stage"><dl class="stats" id="pb-st" style="margin:0"></dl><canvas id="pb-cv" style="height:240px"></canvas>${A.legend([['amber', 'PBI nominal'], ['teal', 'PBI real (precios del año 1)']])}<div class="steplist" id="pb-steps"></div></div></div>`,
    init() {
      $('#pb-in').innerHTML = `<tr><th>Bien</th><th>P año 1</th><th>Q año 1</th><th>P año 2</th><th>Q año 2</th></tr>` + st.g.map((r, i) => `<tr><td>${r[0]}</td>${r.slice(1).map((v, j) => `<td><input class="field" data-pb="${i},${j + 1}" value="${v}" style="width:96px;padding:5px 7px"></td>`).join('')}</tr>`).join('');
      $$('[data-pb]').forEach(el => el.oninput = () => { const [i, j] = el.dataset.pb.split(',').map(Number), v = A.num(el.value); if (v >= 0) { st.g[i][j] = v; upd(); } });
      upd();
    },
    draw
  });
  const calc = () => { const s = f => st.g.reduce((a, r) => a + f(r), 0); const N1 = s(r => r[1] * r[2]), N2 = s(r => r[3] * r[4]), R2 = s(r => r[1] * r[4]), cpi = s(r => r[3] * r[2]) / N1; return { N1, N2, R1: N1, R2, def: N2 / R2 * 100, cpi: cpi * 100, gr: R2 / N1 - 1, gn: N2 / N1 - 1 }; };
  function upd() {
    const r = calc();
    $('#pb-st').innerHTML = A.stats([['PBI nominal año 2', money(r.N2)], ['PBI real año 2', money(r.R2)], ['Crecimiento real', pct(r.gr, 2)], ['Inflación (deflactor)', pct(r.def / 100 - 1, 2)], ['Inflación (IPC)', pct(r.cpi / 100 - 1, 2)]]);
    $('#pb-steps').innerHTML = A.steps([
      `PBI nominal = Σ precio × cantidad de cada año: año 1 = ${money(r.N1)}, año 2 = ${money(r.N2)}. Subió ${pct(r.gn, 2)}, pero eso mezcla cantidades y precios.`,
      `PBI real del año 2: cantidades del año 2 a precios del año 1 = ${st.g.map(x => `${fmt(x[1], 0)}×${fmt(x[4], 0)}`).join(' + ')} = <b>${money(r.R2)}</b>. Crecimiento real: <b>${pct(r.gr, 2)}</b>.`,
      `Deflactor = nominal/real × 100 = <b>${f2(r.def)}</b>: los precios de <b>todo lo producido</b> subieron ${pct(r.def / 100 - 1, 2)}.`,
      `IPC: cuánto cuesta en el año 2 la canasta del año 1 (índice de Laspeyres) = <b>${f2(r.cpi)}</b> → inflación de ${pct(r.cpi / 100 - 1, 2)}. ${Math.abs(r.cpi - r.def) > .05 ? `Difiere del deflactor porque el IPC mantiene fija la canasta y no capta que la gente sustituye hacia lo que se abarató (sesgo de sustitución); el deflactor usa las cantidades actuales.` : ''}`]);
    draw();
  }
  function draw() {
    const r = calc(), g = A.ax($('#pb-cv'), [.4, 2.6], [0, Math.max(r.N2, r.R2, r.N1) * 1.15], { xticks: [1, 2], xf: v => 'Año ' + v, yf: v => '$' + fmt(v / 1e6, 1) + 'M', l: 60 }); if (!g) return;
    const bw = (g.X(2) - g.X(1)) * .25;
    [[1, r.N1, r.R1], [2, r.N2, r.R2]].forEach(([x, n, rr]) => { g.c.fillStyle = K.amber; g.c.fillRect(g.X(x) - bw - 2, g.Y(n), bw, g.Y(0) - g.Y(n)); g.c.fillStyle = K.teal; g.c.fillRect(g.X(x) + 2, g.Y(rr), bw, g.Y(0) - g.Y(rr)); });
  }
}

/* ================= Consumo intertemporal ================= */
{
  const st = {};
  const D = [['y1', 'Ingreso hoy (y₁)', 0, 200, 1, 100, 0], ['y2', 'Ingreso mañana (y₂)', 0, 200, 1, 60, 0], ['r', 'Tasa de interés real (%)', -10, 50, .5, 5, 1], ['b', 'Paciencia β', .3, 1.2, .01, .9, 2]];
  const calc = () => { const R = 1 + st.r / 100, W = st.y1 + st.y2 / R, c1 = W / (1 + st.b), c2 = st.b * R * c1; return { R, W, c1, c2, s: st.y1 - c1 }; };
  A.tool({
    id: 'intertemporal', mat: 'macro', unit: 3, name: 'Consumo intertemporal (modelo de Fisher)', short: 'Consumo intertemporal', tag: 'Ahorro y tasa de interés', f: 'c₁ + c₂/(1+r) = y₁ + y₂/(1+r)',
    desc: 'Cuánto consumir hoy y cuánto ahorrar para mañana. La restricción presupuestaria intertemporal y el efecto de la tasa de interés.',
    lead: 'Una persona vive dos períodos. Puede ahorrar o pedir prestado a la tasa r, así que lo que importa no es el ingreso de cada período sino el valor presente de todos sus ingresos. Con utilidad ln(c₁) + β·ln(c₂) elige suavizar el consumo.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('it', D)}<dl class="stats" id="it-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="it-cv" style="height:400px"></canvas>${A.legend([['amber', 'Restricción intertemporal'], ['teal', 'Curva de indiferencia'], ['fg', 'Ingresos (y₁, y₂)']])}<div class="steplist" id="it-steps"></div></div></div>`,
    init() { A.bindSliders('it', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const r = calc();
    $('#it-st').innerHTML = A.stats([['Consumo hoy', f2(r.c1)], ['Consumo mañana', f2(r.c2)], ['Ahorro hoy', f2(r.s)], ['Riqueza (valor presente)', f2(r.W)]]);
    $('#it-steps').innerHTML = A.steps([
      `Valor presente de los ingresos: y₁ + y₂/(1 + r) = ${f0(st.y1)} + ${f0(st.y2)}/${f2(r.R)} = <b>${f2(r.W)}</b>. Es todo lo que puede gastar, en valor de hoy.`,
      `Con utilidad logarítmica, gasta hoy la fracción 1/(1 + β) de su riqueza: c₁ = ${f2(r.W)}/${f2(1 + st.b)} = <b>${f2(r.c1)}</b>. Mañana: c₂ = β(1 + r)·c₁ = <b>${f2(r.c2)}</b>.`,
      `${r.s > .01 ? `Ahorra ${f2(r.s)} hoy.` : r.s < -.01 ? `Pide prestado ${f2(-r.s)} hoy contra su ingreso futuro.` : 'No ahorra ni se endeuda.'} El consumo depende de la riqueza total, no del ingreso de cada período: esa es la idea del <b>ingreso permanente</b>.`,
      `Si sube r, el futuro se abarata y conviene ahorrar más (efecto sustitución), pero para un ahorrista también es más rico (efecto ingreso). Con utilidad logarítmica, c₁ depende de r solo a través del valor presente de y₂.`]);
    draw();
  }
  function draw() {
    const r = calc(), xm = r.W * 1.15, ym = r.W * r.R * 1.15, g = A.ax($('#it-cv'), [0, xm], [0, ym], { l: 40 }); if (!g) return;
    g.fn(c1 => (r.W - c1) * r.R, K.amber, 2.2); const U = Math.log(r.c1) + st.b * Math.log(r.c2);
    g.fn(c1 => Math.exp((U - Math.log(c1)) / st.b), K.teal, 2, null, [xm * .02, xm]);
    g.dot(st.y1, st.y2, K.fg, 5); g.text('ingresos', st.y1, st.y2, K.fg, 'left', 'top', 6, 6); g.guide(r.c1, r.c2); g.dot(r.c1, r.c2, K.amber, 6); g.labels('Consumo hoy c₁', 'Consumo mañana c₂');
  }
}

/* ================= Multiplicador bancario ================= */
{
  const st = {};
  const D = [['B', 'Base monetaria (miles de millones)', 100, 5000, 50, 1000, 0], ['r', 'Encaje de los bancos (%)', 1, 100, 1, 20, 0], ['c', 'Efectivo que retiene el público por cada $1 depositado', 0, 2, .05, .3, 2]];
  A.tool({
    id: 'bancario', mat: 'macro', unit: 5, ord: 0, name: 'Creación de dinero y multiplicador bancario', short: 'Multiplicador bancario', tag: 'Dinero', f: 'M = B·(1 + c)/(c + r)',
    desc: 'Cómo los bancos multiplican la base monetaria prestando los depósitos, ronda por ronda.',
    lead: 'El Banco Central emite la base monetaria. Cuando ese dinero se deposita, el banco guarda una parte (encaje) y presta el resto; quien recibe el préstamo lo gasta, el que cobra lo vuelve a depositar, y así. Cada vuelta crea dinero nuevo en forma de depósitos.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('bk', D)}<dl class="stats" id="bk-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Depósitos nuevos en cada ronda</h3><canvas id="bk-cv" style="height:260px"></canvas><div class="steplist" id="bk-steps"></div></div></div>`,
    init() { A.bindSliders('bk', D, st, upd); upd(); },
    draw
  });
  const calc = () => { const r = st.r / 100, m = (1 + st.c) / (st.c + r), Dd = st.B / (st.c + r); return { r, m, M: m * st.B, D: Dd, C: st.c * Dd, R: r * Dd }; };
  function upd() {
    const k = calc();
    $('#bk-st').innerHTML = A.stats([['Multiplicador', f2(k.m)], ['Cantidad de dinero M', f0(k.M)], ['Depósitos', f0(k.D)], ['Efectivo en manos del público', f0(k.C)], ['Reservas de los bancos', f0(k.R)]]);
    $('#bk-steps').innerHTML = A.steps([
      `Toda la base termina como efectivo del público o como reservas de los bancos: B = C + R = c·D + r·D → D = B/(c + r) = ${f0(st.B)}/${f2(st.c + k.r)} = <b>${f0(k.D)}</b>.`,
      `La cantidad de dinero es efectivo más depósitos: M = (1 + c)·D = <b>${f0(k.M)}</b>. Multiplicador: (1 + c)/(c + r) = <b>${f2(k.m)}</b>.`,
      `Cada ronda el depósito nuevo es (1 − r)/(1 + c) = ${f2((1 - k.r) / (1 + st.c))} veces el anterior: los bancos prestan lo que no encajan y el público vuelve a depositar parte de eso.`,
      `Si los bancos guardan todo (encaje 100%) o la gente no usa los bancos, el multiplicador cae. En crisis de confianza (como el corralito) la gente retira efectivo, c sube y la cantidad de dinero se contrae aunque el Central no haga nada.`]);
    draw();
  }
  function draw() {
    const k = calc(), q = (1 - k.r) / (1 + st.c), d0 = st.B / (1 + st.c), N = 15, ds = Array.from({ length: N }, (_, i) => d0 * q ** i);
    const g = A.ax($('#bk-cv'), [-.5, N - .5], [0, d0 * 1.12], { xticks: [0, 4, 9, 14], xf: v => 'ronda ' + (v + 1), l: 52 }); if (!g) return;
    const bw = (g.X(1) - g.X(0)) * .7; ds.forEach((v, i) => { g.c.fillStyle = K.teal; g.c.globalAlpha = .85; g.c.fillRect(g.X(i) - bw / 2, g.Y(v), bw, g.Y(0) - g.Y(v)); }); g.c.globalAlpha = 1;
  }
}

/* ================= Teoría cuantitativa, inflación y señoreaje ================= */
{
  const st = {};
  const D = [['mu', 'Crecimiento de la cantidad de dinero (% anual)', 0, 300, 1, 40, 0], ['g', 'Crecimiento real de la economía (% anual)', -5, 10, .5, 2, 1], ['dv', 'Cambio en la velocidad del dinero (% anual)', -10, 30, .5, 0, 1], ['al', 'Sensibilidad de la demanda de dinero a la inflación', .5, 6, .1, 2, 1]];
  const calc = () => { const pi = (1 + st.mu / 100) * (1 + st.dv / 100) / (1 + st.g / 100) - 1, m = Math.exp(-st.al * pi), tax = pi * m, pk = 1 / st.al; return { pi, m, tax, pk, max: pk * Math.exp(-1) }; };
  A.tool({
    id: 'cuantitativa', mat: 'macro', unit: 5, ord: 1, name: 'Teoría cuantitativa, inflación y señoreaje', short: 'Inflación y señoreaje', tag: 'Dinero e inflación', f: 'M·V = P·Y',
    desc: 'De dónde sale la inflación según la teoría cuantitativa, cuánto recauda el Estado emitiendo y por qué emitir demasiado termina recaudando menos.',
    lead: 'La ecuación cuantitativa dice que el dinero por la cantidad de veces que circula iguala al valor de lo que se produce. Si el dinero crece más rápido que la economía, la diferencia se va a precios. El Estado que emite cobra un impuesto inflacionario sobre quienes tienen pesos.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('qt', D)}<dl class="stats" id="qt-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Curva de Laffer del impuesto inflacionario</h3><canvas id="qt-cv" style="height:320px"></canvas>${A.legend([['amber', 'Recaudación por inflación (π × saldos reales)'], ['teal', 'Saldos reales que la gente mantiene']])}<div class="steplist" id="qt-steps"></div></div></div>`,
    init() { A.bindSliders('qt', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const k = calc();
    $('#qt-st').innerHTML = A.stats([['Inflación', pct(k.pi, 1)], ['Saldos reales (índice)', f2(k.m)], ['Recaudación inflacionaria', f2(k.tax)], ['Inflación que maximiza la recaudación', pct(k.pk, 0)]]);
    $('#qt-steps').innerHTML = A.steps([
      `En tasas de variación, MV = PY queda: inflación ≈ crecimiento del dinero + cambio en la velocidad − crecimiento real. Con los números: (1 + ${f0(st.mu)}%)(1 + ${f2(st.dv)}%)/(1 + ${f2(st.g)}%) − 1 = <b>${pct(k.pi, 1)}</b>.`,
      `Con más inflación la gente se saca los pesos de encima: los saldos reales caen a m = e^(−${f2(st.al)}·π) = ${f2(k.m)}. Eso además acelera la velocidad del dinero.`,
      `El impuesto inflacionario es la inflación por la base sobre la que se cobra: π × m = <b>${f2(k.tax)}</b>.`,
      `La recaudación es máxima con π = 1/${f2(st.al)} = <b>${pct(k.pk, 0)}</b>. ${k.pi > k.pk ? '<b>Estás del lado malo de la curva:</b> emitir más recauda menos, porque la base imponible se achica más rápido de lo que sube la tasa. Es la dinámica que lleva a las hiperinflaciones.' : 'Todavía estás del lado donde más emisión recauda más.'}`]);
    draw();
  }
  function draw() {
    const k = calc(), xm = Math.max(3, k.pi * 1.2), g = A.ax($('#qt-cv'), [0, xm], [0, 1.05], { xf: v => pct(v, 0), l: 40 }); if (!g) return;
    g.fn(p => Math.exp(-st.al * p), K.teal, 1.6, [5, 4]); g.fn(p => p * Math.exp(-st.al * p) / k.max * .9, K.amber, 2.4);
    g.vline(k.pk, K.faint, 1, [3, 4]); g.dot(k.pi, k.tax / k.max * .9, K.fg, 6); g.labels('Inflación π', 'Índice');
  }
}

/* ================= Dinámica de la deuda pública ================= */
{
  const st = {};
  const D = [['b0', 'Deuda inicial (% del PBI)', 0, 200, 1, 80, 0], ['r', 'Tasa de interés real (%)', -5, 15, .25, 6, 2], ['g', 'Crecimiento real del PBI (%)', -5, 10, .25, 2, 2], ['s', 'Superávit primario (% del PBI)', -8, 8, .1, 1, 1]];
  const path = s => { const out = [st.b0]; let b = st.b0; for (let t = 0; t < 30; t++) { b = b * (1 + st.r / 100) / (1 + st.g / 100) - s; out.push(b); } return out; };
  A.tool({
    id: 'deuda', mat: 'macro', unit: 6, name: 'Dinámica de la deuda pública', short: 'Deuda pública', tag: 'Sostenibilidad fiscal', f: 'Δb = b·(r − g)/(1 + g) − s',
    desc: 'Cuándo la deuda en relación al PBI crece sola, y qué superávit primario hace falta para estabilizarla.',
    lead: 'Lo que importa no es la deuda en pesos sino en relación al PBI. Los intereses la hacen crecer; el crecimiento de la economía la diluye; el superávit primario (ingresos menos gastos sin contar intereses) la reduce. Si la tasa supera al crecimiento, la deuda tiene efecto bola de nieve.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('dp', D)}<button class="btn sm" id="dp-st-btn" style="align-self:flex-start">Usar el superávit que la estabiliza</button><dl class="stats" id="dp-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="dp-cv" style="height:340px"></canvas>${A.legend([['amber', 'Deuda/PBI con tu superávit'], ['teal', 'Con el superávit estabilizador'], ['rose', 'Sin superávit']])}<div class="steplist" id="dp-steps"></div></div></div>`,
    init() { A.bindSliders('dp', D, st, upd); $('#dp-st-btn').onclick = () => { A.setSlider('dp', 's', +(st.b0 * (st.r - st.g) / (100 + st.g)).toFixed(1), st, 1); upd(); }; upd(); },
    draw
  });
  function upd() {
    const ss = st.b0 * (st.r - st.g) / (100 + st.g), p = path(st.s);
    $('#dp-st').innerHTML = A.stats([['Superávit que la estabiliza', f2(ss) + '% del PBI'], ['Deuda en 10 años', f2(p[10]) + '%'], ['Deuda en 30 años', f2(p[30]) + '%']]);
    $('#dp-steps').innerHTML = A.steps([
      `Cada año: b<sub>t+1</sub> = b<sub>t</sub>·(1 + r)/(1 + g) − s = ${f2(st.b0)} × ${fmt((1 + st.r / 100) / (1 + st.g / 100), 4)} − ${f2(st.s)} = ${f2(p[1])}% el primer año.`,
      `Para que no cambie: s* = b·(r − g)/(1 + g) = ${f2(st.b0)} × (${f2(st.r)} − ${f2(st.g)})/(100 + ${f2(st.g)}) = <b>${f2(ss)}% del PBI</b>.`,
      `${st.r > st.g ? `Como r > g, sin superávit la deuda crece sola (rosa). Cuanto más alta la deuda, más superávit hace falta: por eso los países muy endeudados pueden entrar en espirales.` : `Como g ≥ r, el crecimiento diluye la deuda: se puede tener un déficit primario moderado y que igual la deuda/PBI no explote.`}`,
      `Con tu superávit de ${f2(st.s)}%, la deuda ${p[30] > st.b0 + .5 ? 'sube' : p[30] < st.b0 - .5 ? 'baja' : 'se mantiene'}: llega a ${f2(p[30])}% del PBI en 30 años.`]);
    draw();
  }
  function draw() {
    const ss = st.b0 * (st.r - st.g) / (100 + st.g), a = path(st.s), b = path(ss), c = path(0), all = [...a, ...b, ...c].filter(Number.isFinite);
    const g = A.ax($('#dp-cv'), [0, 30], [Math.min(0, ...all), Math.min(400, Math.max(...all)) * 1.08 + 1], { yf: v => fmt(v, 0) + '%', xf: v => 'año ' + fmt(v, 0), l: 46 }); if (!g) return;
    g.hline(0, K.faint, 1); g.path(c.map((v, t) => [t, v]), K.rose, 1.6, [5, 4]); g.path(b.map((v, t) => [t, v]), K.teal, 1.8, [3, 3]); g.path(a.map((v, t) => [t, v]), K.amber, 2.4);
  }
}

/* ================= Tipo de cambio real y PPA ================= */
{
  const st = {};
  const D = [['e0', 'Tipo de cambio nominal inicial ($/US$)', 100, 2000, 10, 1000, 0], ['d', 'Devaluación mensual del peso (%)', 0, 15, .1, 1, 1], ['pi', 'Inflación mensual argentina (%)', 0, 15, .1, 3, 1], ['pis', 'Inflación anual de EE.UU. (%)', 0, 10, .25, 3, 2], ['m', 'Meses', 6, 60, 1, 24, 0]];
  const sim = () => { const out = []; let e = st.e0, P = 1, Ps = 1; for (let t = 0; t <= st.m; t++) { out.push({ t, e, tcr: e * Ps / P / st.e0 * 100 }); e *= 1 + st.d / 100; P *= 1 + st.pi / 100; Ps *= Math.pow(1 + st.pis / 100, 1 / 12); } return out; };
  A.tool({
    id: 'tcr', mat: 'macro', unit: 7, ord: 0, name: 'Tipo de cambio real y paridad del poder adquisitivo', short: 'Tipo de cambio real', tag: 'Economía abierta', f: 'TCR = e·P*/P',
    desc: 'Por qué un dólar que sube menos que la inflación encarece al país en dólares. Atraso cambiario, competitividad y PPA.',
    lead: 'El tipo de cambio nominal dice cuántos pesos vale un dólar. El real dice cuántas canastas argentinas cuesta una canasta estadounidense: mide la competitividad. Si los precios locales suben más rápido que el dólar, el país se encarece aunque el dólar suba. Eso es apreciación real (lo que en Argentina se llama atraso cambiario).',
    body: `<div class="bench"><div class="ctrl">${A.sliders('tc', D)}<dl class="stats" id="tc-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="tc-cv" style="height:320px"></canvas>${A.legend([['amber', 'Tipo de cambio real (índice, inicio = 100)'], ['faint', 'Sin cambios']])}<div class="steplist" id="tc-steps"></div></div></div>`,
    init() { A.bindSliders('tc', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const s = sim(), L = s[s.length - 1], pism = Math.pow(1 + st.pis / 100, 1 / 12) - 1, need = (1 + st.pi / 100) / (1 + pism) - 1;
    $('#tc-st').innerHTML = A.stats([['Dólar al final', '$' + fmt(L.e, 0)], ['TCR al final', f2(L.tcr)], ['Variación real', pct(L.tcr / 100 - 1, 1)], ['Devaluación que mantiene el TCR', pct(need, 2) + ' mensual']]);
    $('#tc-steps').innerHTML = A.steps([
      `TCR = e × P*/P. En tasas: variación del TCR ≈ devaluación + inflación externa − inflación local = ${f2(st.d)}% + ${f2(pism * 100)}% − ${f2(st.pi)}% ≈ <b>${f2(st.d + pism * 100 - st.pi)}% por mes</b>.`,
      `${L.tcr < 99 ? `El TCR cae a ${f2(L.tcr)}: <b>apreciación real</b>. Las cosas en Argentina se encarecen en dólares, se abaratan las importaciones y los viajes, y les cuesta más competir a los exportadores.` : L.tcr > 101 ? `El TCR sube a ${f2(L.tcr)}: <b>depreciación real</b>. El país se abarata en dólares: mejora la competitividad, pero se encarecen los bienes importados.` : 'El TCR se mantiene: la devaluación compensa justo la diferencia de inflaciones.'}`,
      `Para mantener el TCR constante el dólar tendría que subir <b>${pct(need, 2)}</b> por mes (la diferencia de inflaciones).`,
      `<b>Paridad del poder adquisitivo:</b> la versión relativa dice que, a largo plazo, el tipo de cambio nominal sigue a la diferencia de inflaciones y el TCR vuelve a su nivel de equilibrio. En el corto plazo puede desviarse mucho, como muestran los ciclos de atraso y salto cambiario.`]);
    draw();
  }
  function draw() { const s = sim(), v = s.map(x => x.tcr), g = A.ax($('#tc-cv'), [0, st.m], [Math.min(80, ...v) * .95, Math.max(120, ...v) * 1.05], { xf: v => 'mes ' + fmt(v, 0), l: 40 }); if (!g) return; g.hline(100, K.faint, 1.2, [4, 4]); g.path(s.map(x => [x.t, x.tcr]), K.amber, 2.4); }
}

/* ================= Contabilidad del crecimiento ================= */
{
  const st = {};
  const D = [['gy', 'Crecimiento del PBI (%)', -5, 12, .1, 3.5, 1], ['gk', 'Crecimiento del capital (%)', -5, 15, .1, 4, 1], ['gl', 'Crecimiento del empleo (%)', -5, 8, .1, 1.2, 1], ['al', 'Participación del capital α', .2, .6, .01, .35, 2]];
  A.tool({
    id: 'contabilidad', mat: 'macro', unit: 9, ord: 1, name: 'Contabilidad del crecimiento', short: 'Contabilidad del crecimiento', tag: 'Productividad total de los factores', f: 'gA = gY − α·gK − (1−α)·gL',
    desc: 'Descomponé el crecimiento de un país en lo que aportó el capital, el trabajo y la productividad (el residuo de Solow).',
    lead: 'Con una función de producción Y = A·K^α·L^(1−α), el crecimiento del producto se reparte en tres fuentes: más máquinas, más trabajadores y mejor tecnología. La última no se mide directamente: es lo que sobra, el famoso residuo de Solow.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('cg', D)}<dl class="stats" id="cg-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="cg-cv" style="height:300px"></canvas>${A.legend([['amber', 'Aporte del capital'], ['teal', 'Aporte del trabajo'], ['violet', 'Productividad (residuo de Solow)']])}<div class="steplist" id="cg-steps"></div></div></div>`,
    init() { A.bindSliders('cg', D, st, upd); upd(); },
    draw
  });
  const calc = () => { const k = st.al * st.gk, l = (1 - st.al) * st.gl; return { k, l, a: st.gy - k - l }; };
  function upd() {
    const r = calc();
    $('#cg-st').innerHTML = A.stats([['Aporte del capital', f2(r.k) + ' pp'], ['Aporte del trabajo', f2(r.l) + ' pp'], ['Productividad (PTF)', f2(r.a) + ' pp'], ['Crecimiento por trabajador', f2(st.gy - st.gl) + '%']]);
    $('#cg-steps').innerHTML = A.steps([
      `Aporte del capital: α × gK = ${f2(st.al)} × ${f2(st.gk)} = <b>${f2(r.k)}</b> puntos.`,
      `Aporte del trabajo: (1 − α) × gL = ${f2(1 - st.al)} × ${f2(st.gl)} = <b>${f2(r.l)}</b> puntos.`,
      `Residuo de Solow (productividad total de los factores): ${f2(st.gy)} − ${f2(r.k)} − ${f2(r.l)} = <b>${f2(r.a)}</b> puntos, el ${st.gy ? pct(r.a / st.gy, 0) : '—'} del crecimiento.`,
      `${r.a < 0 ? 'Productividad negativa: se acumularon factores pero se usaron peor. Suele pasar en crisis o con mala asignación de recursos.' : 'En los países desarrollados la productividad explica gran parte del crecimiento por trabajador. Acumular capital sin mejorar la productividad tiene rendimientos decrecientes (como muestra Solow).'}`]);
    draw();
  }
  function draw() {
    const r = calc(), parts = [['amber', r.k], ['teal', r.l], ['violet', r.a]], pos = parts.reduce((s, p) => s + Math.max(0, p[1]), 0), neg = parts.reduce((s, p) => s + Math.min(0, p[1]), 0);
    const g = A.ax($('#cg-cv'), [0, 2], [Math.min(0, neg) - .5, Math.max(pos, st.gy) + .8], { xticks: [.6, 1.4], xf: v => v < 1 ? 'Fuentes' : 'PBI', yf: v => fmt(v, 1) + '%', l: 46 }); if (!g) return;
    let up = 0, dn = 0; const bw = (g.X(1) - g.X(0)) * .5;
    parts.forEach(([col, v]) => { const y0 = v >= 0 ? up : dn, y1 = y0 + v; g.c.fillStyle = K[col]; g.c.fillRect(g.X(.6) - bw / 2, g.Y(Math.max(y0, y1)), bw, Math.abs(g.Y(y0) - g.Y(y1))); if (v >= 0) up = y1; else dn = y1; });
    g.c.fillStyle = K.fg; g.c.fillRect(g.X(1.4) - bw / 2, g.Y(Math.max(0, st.gy)), bw, Math.abs(g.Y(0) - g.Y(st.gy))); g.hline(0, K.faint, 1);
  }
}
})();
