/* Asíntota · Finanzas (ampliación) */
(() => {
const { $, $$, K, fmt, pct, S } = A;
const f2 = x => fmt(x, 2), money = x => (x < 0 ? '−$' : '$') + fmt(Math.abs(x), 2);

/* ================= Curva de rendimientos ================= */
{
  const MAT = [1, 2, 3, 5, 7, 10, 20, 30];
  const PRE = { normal: ['Normal (con pendiente positiva)', [3, 3.3, 3.6, 4, 4.3, 4.6, 5, 5.1]], inv: ['Invertida', [5.5, 5.2, 4.9, 4.5, 4.3, 4.1, 4, 3.9]], plana: ['Plana', [4, 4, 4, 4, 4, 4, 4, 4]], joroba: ['Con joroba', [3.5, 4.2, 4.6, 4.8, 4.6, 4.3, 4.1, 4]] };
  const st = { y: [...PRE.normal[1]], cup: 5, T: 10 };
  const spot = t => { if (t <= MAT[0]) return st.y[0]; for (let i = 1; i < MAT.length; i++) if (t <= MAT[i]) return st.y[i - 1] + (st.y[i] - st.y[i - 1]) * (t - MAT[i - 1]) / (MAT[i] - MAT[i - 1]); return st.y[st.y.length - 1]; };
  const fwd = (t1, t2) => Math.pow(Math.pow(1 + spot(t2) / 100, t2) / Math.pow(1 + spot(t1) / 100, t1), 1 / (t2 - t1)) - 1;
  A.tool({
    id: 'curva-rendimientos', mat: 'finanzas', unit: 4, ord: 1, name: 'Curva de rendimientos y tasas forward', short: 'Curva de rendimientos', tag: 'Estructura temporal de tasas', f: '(1+s₂)² = (1+s₁)(1+f₁,₂)',
    desc: 'Cargá las tasas por plazo, obtené las tasas futuras implícitas y valuá un bono descontando cada flujo a su propia tasa.',
    lead: 'La tasa no es la misma para 1 año que para 10. La curva de rendimientos junta las tasas de cada plazo. De ella se deducen las tasas forward: la tasa que el mercado implícitamente "espera" para un período futuro. Una curva invertida suele anticipar recesiones.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Formas típicas</label><div class="chips">${Object.entries(PRE).map(([k, v]) => `<button class="chip" data-yc="${k}">${v[0]}</button>`).join('')}</div></div>
      <div><label class="l">Tasa por plazo (% anual)</label><div class="grid3" id="yc-in"></div></div>
      <div class="grid2"><div><label class="l" for="yc-c">Cupón del bono (%)</label><input class="field" id="yc-c" value="5"></div><div><label class="l" for="yc-T">Años</label><input class="field" id="yc-T" value="10"></div></div><dl class="stats" id="yc-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="yc-cv" style="height:320px"></canvas>${A.legend([['amber', 'Tasas spot (curva)'], ['teal', 'Tasas forward a 1 año']])}<div class="steplist" id="yc-steps"></div></div></div>`,
    init() {
      const build = () => { $('#yc-in').innerHTML = MAT.map((t, i) => `<div><label class="l" for="yc-${i}">${t} año${t > 1 ? 's' : ''}</label><input class="field" id="yc-${i}" value="${String(st.y[i]).replace('.', ',')}"></div>`).join(''); MAT.forEach((_, i) => $('#yc-' + i).oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.y[i] = v; upd(); } }); upd(); };
      $$('[data-yc]').forEach(b => b.onclick = () => { st.y = [...PRE[b.dataset.yc][1]]; build(); });
      $('#yc-c').oninput = e => { const v = A.num(e.target.value); if (v >= 0) { st.cup = v; upd(); } };
      $('#yc-T').oninput = e => { const v = Math.round(A.num(e.target.value)); if (v >= 1 && v <= 30) { st.T = v; upd(); } };
      build();
    },
    draw
  });
  function upd() {
    let P = 0; const rows = []; for (let t = 1; t <= st.T; t++) { const cf = st.cup + (t === st.T ? 100 : 0), df = Math.pow(1 + spot(t) / 100, -t); P += cf * df; rows.push([t, cf, spot(t), cf * df]); }
    let lo = -50, hi = 100; for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; let p = 0; for (let t = 1; t <= st.T; t++) p += (st.cup + (t === st.T ? 100 : 0)) / Math.pow(1 + m / 100, t); p > P ? lo = m : hi = m; }
    const slope = st.y[5] - st.y[0];
    $('#yc-st').innerHTML = A.stats([['Precio del bono', f2(P)], ['TIR equivalente', f2((lo + hi) / 2) + '%'], ['Forward entre año 1 y 2', pct(fwd(1, 2), 2)], ['Pendiente 10a − 1a', f2(slope) + ' pp']]);
    $('#yc-steps').innerHTML = A.steps([
      `Tasa forward entre el año 1 y el 2: (1 + s₂)²/(1 + s₁) − 1 = (1 + ${f2(spot(2))}%)²/(1 + ${f2(spot(1))}%) − 1 = <b>${pct(fwd(1, 2), 2)}</b>. Invertir 2 años a la tasa de 2 años tiene que rendir lo mismo que invertir 1 año y renovar a la forward (si no, habría arbitraje).`,
      `Precio del bono descontando cada flujo con su propia tasa spot: ${rows.slice(0, 3).map(r => `${f2(r[1])}/(1 + ${f2(r[2])}%)^${r[0]}`).join(' + ')} + … = <b>${f2(P)}</b>. La TIR es un promedio de esas tasas.`,
      `${slope > .3 ? 'Curva <b>positiva</b>: lo normal. Prestar a más plazo tiene más riesgo, y el mercado espera tasas futuras iguales o mayores.' : slope < -.3 ? 'Curva <b>invertida</b>: el mercado espera que las tasas bajen, por lo general porque anticipa que el banco central va a tener que estimular una economía que se enfría. Históricamente precedió a muchas recesiones en EE.UU.' : 'Curva <b>plana</b>: el mercado no espera grandes cambios en las tasas.'}`,
      `<b>Hipótesis de expectativas:</b> las forwards son la mejor predicción de las tasas futuras. En la práctica incluyen además una prima por plazo.`]);
    draw();
  }
  function draw() { const all = [...st.y, ...MAT.slice(0, -1).map((t, i) => fwd(t, t + 1) * 100)], g = A.ax($('#yc-cv'), [0, 30], [Math.min(0, ...all) - .3, Math.max(...all) + .6], { xf: v => fmt(v, 0) + 'a', yf: v => fmt(v, 1) + '%', l: 46 }); if (!g) return; g.path(Array.from({ length: 30 }, (_, i) => [i + 1, fwd(i, i + 1) * 100 || spot(1)]).slice(1), K.teal, 1.6, [5, 4]); g.fn(spot, K.amber, 2.4, null, [1, 30]); MAT.forEach((t, i) => g.dot(t, st.y[i], K.amber, 4.5)); g.labels('Plazo', 'Tasa'); }
}

/* ================= Modelo de Gordon ================= */
{
  const st = {};
  const D = [['D0', 'Dividendo de este año ($)', .1, 20, .1, 2, 2], ['k', 'Rendimiento exigido k (%)', 2, 25, .25, 10, 2], ['g1', 'Crecimiento en la etapa inicial (%)', -10, 40, .5, 15, 1], ['n', 'Años de crecimiento alto', 0, 15, 1, 5, 0], ['g2', 'Crecimiento a perpetuidad (%)', -5, 9, .25, 3, 2], ['po', 'Proporción de ganancias que se reparte (%)', 5, 100, 1, 40, 0]];
  const price = (k = st.k / 100) => { const g1 = st.g1 / 100, g2 = st.g2 / 100; if (k <= g2) return NaN; let P = 0, D = st.D0; for (let t = 1; t <= st.n; t++) { D *= 1 + g1; P += D / Math.pow(1 + k, t); } const Dn1 = D * (1 + g2), TV = Dn1 / (k - g2); return { P: P + TV / Math.pow(1 + k, st.n), PVd: P, TV, PVtv: TV / Math.pow(1 + k, st.n) }; };
  A.tool({
    id: 'gordon', mat: 'finanzas', unit: 5, ord: 0, name: 'Valuación de acciones: modelo de Gordon', short: 'Gordon', tag: 'Descuento de dividendos', f: 'P₀ = D₁ / (k − g)',
    desc: 'Cuánto vale una acción según los dividendos que va a pagar. Modelo de una y de dos etapas, con relación precio/ganancia implícita.',
    lead: 'Una acción vale el valor presente de todos los dividendos futuros. Si crecen a una tasa constante g para siempre, esa suma infinita da la fórmula de Gordon. Con dos etapas, primero crecen rápido unos años y después se estabilizan.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('gor', D)}<dl class="stats" id="gor-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Precio según el rendimiento exigido</h3><canvas id="gor-cv" style="height:300px"></canvas><div class="steplist" id="gor-steps"></div></div></div>`,
    init() { A.bindSliders('gor', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const r = price();
    if (!r || !Number.isFinite(r.P)) { $('#gor-st').innerHTML = ''; $('#gor-steps').innerHTML = '<p class="err">El rendimiento exigido tiene que ser mayor que el crecimiento a perpetuidad: si no, la suma de dividendos es infinita.</p>'; draw(); return; }
    const eps = st.D0 / (st.po / 100);
    $('#gor-st').innerHTML = A.stats([['Precio de la acción', money(r.P)], ['Parte por dividendos iniciales', money(r.PVd)], ['Parte por valor terminal', money(r.PVtv) + ` (${pct(r.PVtv / r.P, 0)})`], ['P/E implícito', f2(r.P / eps)]]);
    $('#gor-steps').innerHTML = A.steps([
      st.n ? `Etapa 1: el dividendo crece ${f2(st.g1)}% por año durante ${st.n} años. Valor presente de esos dividendos: <b>${money(r.PVd)}</b>.` : `Sin etapa de crecimiento alto: es el Gordon simple.`,
      `Desde el año ${st.n + 1} crece ${f2(st.g2)}% para siempre. Valor terminal en el año ${st.n}: D<sub>${st.n + 1}</sub>/(k − g) = ${money(r.TV)}, que traído a hoy vale <b>${money(r.PVtv)}</b>.`,
      `Precio = <b>${money(r.P)}</b>. El ${pct(r.PVtv / r.P, 0)} del valor está en el valor terminal: casi todo depende de lo que pase muy en el futuro, y por eso las valuaciones son tan sensibles a k y g.`,
      `Con un payout de ${st.po}%, la ganancia por acción es ${money(eps)} y el P/E implícito es ${f2(r.P / eps)}. Despejando Gordon: <b>k = D₁/P + g</b>, el rendimiento es el dividend yield más el crecimiento.`]);
    draw();
  }
  function draw() { const g2 = st.g2 / 100, lo = Math.max(g2 * 100 + .5, 1), hi = 30, ps = []; for (let k = lo; k <= hi; k += .25) { const r = price(k / 100); if (r && Number.isFinite(r.P)) ps.push([k, r.P]); } const r = price(), ym = Math.min(Math.max(...ps.map(p => p[1])), (r && r.P || 50) * 4), g = A.ax($('#gor-cv'), [0, hi], [0, ym * 1.05], { xf: v => fmt(v, 0) + '%', yf: v => '$' + fmt(v, 0), l: 50 }); if (!g) return; g.vline(st.g2, K.rose, 1.2, [4, 4]); g.text('k = g', st.g2, ym * .95, K.rose); g.path(ps, K.amber, 2.4); if (r && Number.isFinite(r.P)) { g.guide(st.k, r.P); g.dot(st.k, r.P, K.fg, 6); } g.labels('Rendimiento exigido k', 'Precio'); }
}

/* ================= Flujo de fondos descontado ================= */
{
  const st = {};
  const D = [['f0', 'Flujo de fondos libre de este año (millones)', 1, 1000, 1, 100, 0], ['N', 'Años de proyección', 3, 10, 1, 5, 0], ['g1', 'Crecimiento en la proyección (%)', -10, 40, .5, 12, 1], ['gt', 'Crecimiento terminal (%)', 0, 6, .25, 2.5, 2], ['w', 'WACC (%)', 4, 25, .25, 11, 2], ['debt', 'Deuda neta (millones)', 0, 3000, 10, 400, 0], ['sh', 'Cantidad de acciones (millones)', 1, 500, 1, 50, 0]];
  const val = (w = st.w, gt = st.gt) => { const W = w / 100, G = gt / 100; if (W <= G) return null; let f = st.f0, pv = 0; const rows = []; for (let t = 1; t <= st.N; t++) { f *= 1 + st.g1 / 100; const p = f / Math.pow(1 + W, t); pv += p; rows.push([t, f, p]); } const TV = f * (1 + G) / (W - G), pvTV = TV / Math.pow(1 + W, st.N), EV = pv + pvTV, E = EV - st.debt; return { rows, pv, TV, pvTV, EV, E, ps: E / st.sh }; };
  A.tool({
    id: 'dcf', mat: 'finanzas', unit: 5, ord: 1, name: 'Valuación de empresas por flujos descontados', short: 'Flujos descontados (DCF)', tag: 'Valuación corporativa', f: 'EV = Σ FCFₜ/(1+WACC)ᵗ + VT',
    desc: 'Proyectá los flujos de una empresa, calculá el valor terminal y llegá al precio por acción. Con tabla de sensibilidad.',
    lead: 'Así valúan empresas los bancos de inversión: se proyectan los flujos de fondos libres unos años, se agrega un valor terminal por todo lo que viene después, se descuenta todo al costo de capital (WACC) y se resta la deuda para llegar al valor de las acciones.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('dcf', D)}<dl class="stats" id="dcf-st" style="margin:0"></dl></div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="dcf-tbl"></table></div><h3>Sensibilidad del precio por acción</h3><div class="tbl-wrap"><table class="tbl" id="dcf-sens"></table></div><div class="steplist" id="dcf-steps"></div></div></div>`,
    init() { A.bindSliders('dcf', D, st, upd); upd(); }
  });
  function upd() {
    const v = val(); if (!v) { $('#dcf-steps').innerHTML = '<p class="err">El WACC tiene que superar al crecimiento terminal.</p>'; return; }
    $('#dcf-st').innerHTML = A.stats([['Valor de la empresa (EV)', money(v.EV) + 'M'], ['Valor de las acciones', money(v.E) + 'M'], ['Precio por acción', money(v.ps)], ['Peso del valor terminal', pct(v.pvTV / v.EV, 0)]]);
    $('#dcf-tbl').innerHTML = `<tr><th>Año</th><th>Flujo libre</th><th>Factor de descuento</th><th>Valor presente</th></tr>` + v.rows.map(([t, f, p]) => `<tr><td>${t}</td><td>${f2(f)}</td><td>${fmt(1 / Math.pow(1 + st.w / 100, t), 4)}</td><td>${f2(p)}</td></tr>`).join('') + `<tr><td>Valor terminal</td><td>${f2(v.TV)}</td><td>${fmt(1 / Math.pow(1 + st.w / 100, st.N), 4)}</td><td>${f2(v.pvTV)}</td></tr><tr class="best"><td>Valor de la empresa</td><td></td><td></td><td>${f2(v.EV)}</td></tr>`;
    const ws = [-2, -1, 0, 1, 2].map(d => st.w + d), gs = [-1, -.5, 0, .5, 1].map(d => st.gt + d);
    $('#dcf-sens').innerHTML = `<tr><th>WACC \\ g</th>${gs.map(g => `<th>${f2(g)}%</th>`).join('')}</tr>` + ws.map(w => `<tr><td>${f2(w)}%</td>${gs.map(g => { const x = val(w, g); const c = x ? x.ps / v.ps : 1; return `<td style="background:${c >= 1 ? `rgba(67,200,184,${Math.min(.45, (c - 1) * .8)})` : `rgba(239,115,145,${Math.min(.45, (1 - c) * .8)})`}">${x ? money(x.ps) : '—'}</td>`; }).join('')}</tr>`).join('');
    $('#dcf-steps').innerHTML = A.steps([
      `Proyecto ${st.N} años creciendo ${f2(st.g1)}% y descuento al WACC de ${f2(st.w)}%: suman <b>${money(v.pv)}M</b> en valor presente.`,
      `Valor terminal (Gordon sobre el último flujo): FCF<sub>${st.N + 1}</sub>/(WACC − g) = <b>${money(v.TV)}M</b>, que hoy vale ${money(v.pvTV)}M.`,
      `Valor de la empresa = ${money(v.pv)} + ${money(v.pvTV)} = <b>${money(v.EV)}M</b>. Menos deuda neta (${money(st.debt)}M) = valor de las acciones ${money(v.E)}M. Dividido ${fmt(st.sh, 0)}M de acciones = <b>${money(v.ps)} por acción</b>.`,
      `Mirá la tabla de sensibilidad: un punto de WACC o de crecimiento terminal mueve muchísimo el precio. Por eso una valuación es un rango, no un número exacto.`]);
  }
}

/* ================= WACC y estructura de capital ================= */
{
  const st = {};
  const D = [['rf', 'Tasa libre de riesgo (%)', 0, 8, .1, 4.2, 1], ['bu', 'Beta sin deuda (del negocio)', .3, 2, .05, .9, 2], ['mp', 'Prima de mercado (%)', 2, 10, .25, 5.5, 2], ['cr', 'Riesgo país (pp)', 0, 20, .25, 6, 2], ['kd0', 'Costo de la deuda sin apalancamiento (%)', 2, 20, .25, 8, 2], ['t', 'Alícuota de ganancias (%)', 0, 45, 1, 35, 0], ['dv', 'Deuda sobre valor total D/V (%)', 0, 85, 1, 30, 0]];
  const calc = dv => { const w = dv / 100, DE = w / (1 - w), bl = st.bu * (1 + (1 - st.t / 100) * DE), ke = st.rf + bl * st.mp + st.cr, kd = st.kd0 + 12 * w * w * w, kdt = kd * (1 - st.t / 100); return { bl, ke, kd, kdt, wacc: (1 - w) * ke + w * kdt }; };
  A.tool({
    id: 'wacc', mat: 'finanzas', unit: 5, ord: 2, name: 'Costo de capital (WACC) y estructura de capital', short: 'WACC', tag: 'Costo de capital', f: 'WACC = E/V·kₑ + D/V·k_d·(1 − t)',
    desc: 'Calculá el costo del capital propio con CAPM más riesgo país, el costo de la deuda después de impuestos y la estructura de deuda que minimiza el WACC.',
    lead: 'Una empresa se financia con acciones y con deuda, y cada fuente tiene su costo. El WACC es el promedio ponderado: la tasa mínima que tienen que rendir sus proyectos. Para Argentina se suele sumar el riesgo país al costo del capital propio.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('wc', D)}<dl class="stats" id="wc-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="wc-cv" style="height:340px"></canvas>${A.legend([['rose', 'Costo del capital propio kₑ'], ['teal', 'Costo de la deuda después de impuestos'], ['amber', 'WACC']])}<div class="steplist" id="wc-steps"></div></div></div>`,
    init() { A.bindSliders('wc', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const r = calc(st.dv); let best = 0, bv = Infinity; for (let d = 0; d <= 85; d += .5) { const v = calc(d).wacc; if (v < bv) { bv = v; best = d; } }
    $('#wc-st').innerHTML = A.stats([['Beta apalancada', f2(r.bl)], ['Costo del capital propio', f2(r.ke) + '%'], ['Costo de la deuda (neto)', f2(r.kdt) + '%'], ['WACC', f2(r.wacc) + '%'], ['D/V que minimiza el WACC', fmt(best, 0) + '%']]);
    $('#wc-steps').innerHTML = A.steps([
      `Beta apalancada (Hamada): β<sub>L</sub> = β<sub>U</sub>·[1 + (1 − t)·D/E] = ${f2(st.bu)} × [1 + ${f2(1 - st.t / 100)} × ${f2(st.dv / (100 - st.dv))}] = <b>${f2(r.bl)}</b>. Más deuda hace más riesgosas a las acciones.`,
      `Costo del capital propio: r<sub>f</sub> + β<sub>L</sub>·prima + riesgo país = ${f2(st.rf)} + ${f2(r.bl)} × ${f2(st.mp)} + ${f2(st.cr)} = <b>${f2(r.ke)}%</b>.`,
      `Costo de la deuda después de impuestos: ${f2(r.kd)}% × (1 − ${st.t}%) = <b>${f2(r.kdt)}%</b>. Los intereses se descuentan de ganancias: ese es el <b>escudo fiscal</b>.`,
      `WACC = ${pct(1 - st.dv / 100, 0)} × ${f2(r.ke)} + ${pct(st.dv / 100, 0)} × ${f2(r.kdt)} = <b>${f2(r.wacc)}%</b>.`,
      `Teoría del trade-off: al principio la deuda baja el WACC por el escudo fiscal; con mucha deuda sube el riesgo de quiebra, se encarece la deuda y el WACC vuelve a subir. El mínimo (acá en ${fmt(best, 0)}% de deuda) es la estructura óptima. Sin impuestos ni costos de quiebra, Modigliani-Miller dice que daría lo mismo.`]);
    draw();
  }
  function draw() { const pts = Array.from({ length: 171 }, (_, i) => { const d = i * .5; return [d, calc(d)]; }), all = pts.flatMap(([, r]) => [r.ke, r.kdt, r.wacc]), g = A.ax($('#wc-cv'), [0, 85], [0, Math.min(60, Math.max(...all)) * 1.05], { xf: v => fmt(v, 0) + '%', yf: v => fmt(v, 0) + '%', l: 40 }); if (!g) return; g.path(pts.map(([d, r]) => [d, r.ke]), K.rose, 2); g.path(pts.map(([d, r]) => [d, r.kdt]), K.teal, 2); g.path(pts.map(([d, r]) => [d, r.wacc]), K.amber, 2.6); const r = calc(st.dv); g.guide(st.dv, r.wacc); g.dot(st.dv, r.wacc, K.fg, 6); g.labels('Deuda sobre valor D/V', 'Costo'); }
}

/* ================= Árbol binomial ================= */
{
  const st = { type: 'call', am: false };
  const D = [['S', 'Precio actual de la acción', 10, 200, 1, 100, 0], ['K', 'Precio de ejercicio', 10, 200, 1, 100, 0], ['T', 'Años al vencimiento', .1, 3, .05, 1, 2], ['r', 'Tasa libre de riesgo (%)', 0, 20, .25, 5, 2], ['v', 'Volatilidad (%)', 5, 100, 1, 25, 0], ['n', 'Pasos del árbol', 1, 6, 1, 3, 0]];
  const N = x => S.normCdf(x);
  const tree = n => { const dt = st.T / n, u = Math.exp(st.v / 100 * Math.sqrt(dt)), d = 1 / u, R = Math.exp(st.r / 100 * dt), p = (R - d) / (u - d), pay = s => st.type === 'call' ? Math.max(0, s - st.K) : Math.max(0, st.K - s); const Sx = [], V = []; for (let i = 0; i <= n; i++) { Sx.push([]); V.push([]); for (let j = 0; j <= i; j++) Sx[i].push(st.S * Math.pow(u, j) * Math.pow(d, i - j)); } for (let j = 0; j <= n; j++) V[n][j] = pay(Sx[n][j]); for (let i = n - 1; i >= 0; i--) for (let j = 0; j <= i; j++) { const cont = (p * V[i + 1][j + 1] + (1 - p) * V[i + 1][j]) / R; V[i][j] = st.am ? Math.max(cont, pay(Sx[i][j])) : cont; } return { u, d, p, R, Sx, V }; };
  const bs = () => { const v = st.v / 100, r = st.r / 100, d1 = (Math.log(st.S / st.K) + (r + v * v / 2) * st.T) / (v * Math.sqrt(st.T)), d2 = d1 - v * Math.sqrt(st.T); return st.type === 'call' ? st.S * N(d1) - st.K * Math.exp(-r * st.T) * N(d2) : st.K * Math.exp(-r * st.T) * N(-d2) - st.S * N(-d1); };
  A.tool({
    id: 'binomial', mat: 'finanzas', unit: 7, ord: 1, name: 'Valuación de opciones con árbol binomial', short: 'Árbol binomial', tag: 'Valuación neutral al riesgo', f: 'p = (e^(rΔt) − d)/(u − d)',
    desc: 'Armá el árbol de precios de la acción, valuá la opción hacia atrás y mirá cómo converge a Black-Scholes al agregar pasos.',
    lead: 'En cada paso la acción puede subir (×u) o bajar (×d). Al vencimiento sabemos cuánto vale la opción en cada nodo; después vamos hacia atrás promediando con probabilidades "neutrales al riesgo" y descontando. Con muchos pasos, el resultado converge a Black-Scholes.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Opción</label>${A.seg('bn2-t', [['call', 'Call'], ['put', 'Put']], 'call')}</div><label class="check"><input type="checkbox" id="bn2-am"> Americana (se puede ejercer antes)</label>${A.sliders('bn2', D)}<dl class="stats" id="bn2-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="bn2-tree" style="height:360px"></canvas><h3>Convergencia a Black-Scholes</h3><canvas id="bn2-cv" style="height:200px"></canvas>${A.legend([['amber', 'Precio binomial según la cantidad de pasos'], ['teal', 'Black-Scholes']])}<div class="steplist" id="bn2-steps"></div></div></div>`,
    init() { A.bindSliders('bn2', D, st, upd); A.segBind('bn2-t', v => { st.type = v; upd(); }); $('#bn2-am').onchange = e => { st.am = e.target.checked; upd(); }; upd(); },
    draw
  });
  function upd() {
    const t = tree(st.n), big = tree(200).V[0][0], b = bs();
    $('#bn2-st').innerHTML = A.stats([['Precio con ' + st.n + ' paso' + (st.n > 1 ? 's' : ''), money(t.V[0][0])], ['Con 200 pasos', money(big)], ['Black-Scholes (europea)', money(b)], ['u / d', `${fmt(t.u, 4)} / ${fmt(t.d, 4)}`], ['Probabilidad neutral p', fmt(t.p, 4)]]);
    $('#bn2-steps').innerHTML = A.steps([
      `Δt = ${f2(st.T)}/${st.n} = ${fmt(st.T / st.n, 4)} años. u = e^(σ√Δt) = ${fmt(t.u, 4)}, d = 1/u = ${fmt(t.d, 4)}.`,
      `Probabilidad neutral al riesgo: p = (e^(rΔt) − d)/(u − d) = (${fmt(t.R, 4)} − ${fmt(t.d, 4)})/(${fmt(t.u, 4)} − ${fmt(t.d, 4)}) = <b>${fmt(t.p, 4)}</b>. No es la probabilidad real: es la que hace que la acción rinda la tasa libre de riesgo.`,
      `Al vencimiento la opción vale max(${st.type === 'call' ? 'S − K' : 'K − S'}, 0). Hacia atrás: V = [p·V<sub>sube</sub> + (1 − p)·V<sub>baja</sub>]/e^(rΔt)${st.am ? ', y en cada nodo se compara con ejercer ya (por eso la put americana vale más)' : ''}. Resultado: <b>${money(t.V[0][0])}</b>.`,
      `Con 200 pasos da ${money(big)}; Black-Scholes da ${money(b)}. ${st.am && st.type === 'put' ? 'La diferencia es el valor del ejercicio anticipado.' : 'El árbol converge a la fórmula continua.'}`]);
    draw();
  }
  function draw() {
    const t = tree(st.n), { c, w, h } = A.canv($('#bn2-tree')); if (w < 2) return;
    const X = i => 50 + i * (w - 140) / Math.max(1, st.n), Y = (i, j) => h / 2 - (j - i / 2) * Math.min(64, (h - 40) / (st.n + 1));
    c.strokeStyle = K.line; c.lineWidth = 1.2;
    for (let i = 0; i < st.n; i++) for (let j = 0; j <= i; j++) { c.beginPath(); c.moveTo(X(i), Y(i, j)); c.lineTo(X(i + 1), Y(i + 1, j + 1)); c.moveTo(X(i), Y(i, j)); c.lineTo(X(i + 1), Y(i + 1, j)); c.stroke(); }
    c.font = '11px ' + A.MONO; c.textAlign = 'center';
    for (let i = 0; i <= st.n; i++) for (let j = 0; j <= i; j++) { const x = X(i), y = Y(i, j); c.fillStyle = K.panel; c.strokeStyle = t.V[i][j] > 0 ? K.amber : K.faint; c.beginPath(); c.roundRect ? c.roundRect(x - 34, y - 17, 68, 34, 5) : c.rect(x - 34, y - 17, 68, 34); c.fill(); c.stroke(); c.fillStyle = K.muted; c.textBaseline = 'bottom'; c.fillText('S ' + fmt(t.Sx[i][j], 1), x, y); c.fillStyle = K.amber; c.textBaseline = 'top'; c.fillText('V ' + fmt(t.V[i][j], 2), x, y + 1); }
    const pts = Array.from({ length: 60 }, (_, i) => [i + 1, tree(i + 1).V[0][0]]), b = bs(), vals = pts.map(p => p[1]), g = A.ax($('#bn2-cv'), [1, 60], [Math.min(...vals, b) * .95, Math.max(...vals, b) * 1.05], { l: 46, xf: v => fmt(v, 0) + ' pasos', xt: 5 }); if (!g) return;
    g.hline(b, K.teal, 1.8); g.path(pts, K.amber, 1.6); pts.forEach(p => g.dot(p[0], p[1], K.amber, 2));
  }
}

/* ================= Futuros de dólar y paridad de tasas ================= */
{
  const st = {};
  const D = [['S', 'Dólar oficial hoy ($)', 100, 3000, 5, 1000, 0], ['i', 'Tasa en pesos (TNA %)', 0, 150, .5, 35, 1], ['is', 'Tasa en dólares (TNA %)', 0, 10, .25, 4, 2], ['d', 'Plazo (días)', 7, 365, 1, 90, 0], ['Fm', 'Precio del futuro en el mercado ($)', 100, 4000, 1, 1080, 0]];
  const fair = (d = st.d) => st.S * (1 + st.i / 100 * d / 365) / (1 + st.is / 100 * d / 365);
  A.tool({
    id: 'futuros', mat: 'finanzas', unit: 7, ord: 2, name: 'Futuros de dólar y paridad de tasas', short: 'Dólar futuro', tag: 'Cobertura cambiaria', f: 'F = S·(1 + i·d/365)/(1 + i*·d/365)',
    desc: 'Cuánto debería valer el dólar futuro según las tasas en pesos y en dólares, qué devaluación descuenta el mercado y cómo cubrirse.',
    lead: 'Un futuro fija hoy el precio al que vas a comprar o vender dólares más adelante. Si el futuro estuviera barato, convendría pedir pesos, comprar futuro y ganar sin riesgo; por eso su precio está atado a la diferencia de tasas (paridad cubierta de tasas de interés).',
    body: `<div class="bench"><div class="ctrl">${A.sliders('fu', D)}<dl class="stats" id="fu-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Curva de futuros teórica</h3><canvas id="fu-cv" style="height:280px"></canvas>${A.legend([['amber', 'Precio teórico por plazo'], ['rose', 'Precio de mercado']])}<div class="steplist" id="fu-steps"></div></div></div>`,
    init() { A.bindSliders('fu', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const F = fair(), dev = F / st.S - 1, devm = st.Fm / st.S - 1, tna = devm * 365 / st.d;
    $('#fu-st').innerHTML = A.stats([['Futuro teórico', money(F)], ['Devaluación implícita (teórica)', pct(dev, 2)], ['Devaluación que descuenta el mercado', pct(devm, 2)], ['Tasa implícita del futuro (TNA)', pct(tna, 2)]]);
    $('#fu-steps').innerHTML = A.steps([
      `Si tenés $${fmt(st.S, 0)} y los colocás en pesos ${st.d} días, terminás con ${money(st.S * (1 + st.i / 100 * st.d / 365))}. Si comprás US$1 y lo colocás en dólares, terminás con US$${fmt(1 + st.is / 100 * st.d / 365, 4)}.`,
      `Para que las dos estrategias den lo mismo cubriéndose con un futuro: F = ${money(st.S)} × (1 + ${f2(st.i)}% × ${st.d}/365)/(1 + ${f2(st.is)}% × ${st.d}/365) = <b>${money(F)}</b>.`,
      `El mercado cotiza ${money(st.Fm)}: descuenta una devaluación de <b>${pct(devm, 2)}</b> en ${st.d} días (TNA implícita ${pct(tna, 1)}). ${Math.abs(st.Fm - F) / F < .005 ? 'Coincide con el teórico.' : st.Fm > F ? 'Está por encima del teórico: o hay un premio por riesgo de devaluación, o conviene colocar en pesos y vender futuro.' : 'Está por debajo del teórico: conviene comprar futuro antes que dólares spot financiados en pesos.'}`,
      `<b>Cobertura:</b> un importador que va a pagar en dólares compra futuro para fijar su costo; un exportador que va a cobrar en dólares vende futuro para fijar su ingreso. En Argentina se operan en el mercado A3 (ex ROFEX).`]);
    draw();
  }
  function draw() { const pts = Array.from({ length: 365 }, (_, i) => [i + 1, fair(i + 1)]), mx = Math.max(st.Fm, pts[364][1]), g = A.ax($('#fu-cv'), [0, 365], [st.S * .98, mx * 1.03], { xf: v => fmt(v, 0) + 'd', yf: v => '$' + fmt(v, 0), l: 56 }); if (!g) return; g.path(pts, K.amber, 2.4); g.dot(st.d, st.Fm, K.rose, 6); g.dot(st.d, fair(), K.fg, 5); g.labels('Plazo', 'Precio del futuro'); }
}
})();
