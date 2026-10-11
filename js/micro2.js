/* Asíntota · Microeconomía (ampliación) */
(() => {
const { $, $$, K, fmt, pct } = A;
const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);

/* ================= Elección bajo incertidumbre ================= */
{
  const st = {};
  const D = [['W', 'Riqueza inicial (miles de $)', 20, 200, 1, 100, 0], ['L', 'Pérdida posible (miles de $)', 1, 150, 1, 60, 0], ['p', 'Probabilidad de la pérdida', .01, .9, .01, .1, 2], ['g', 'Aversión al riesgo γ', 0, 5, .1, 2, 1]];
  const u = w => st.g === 1 ? Math.log(w) : (Math.pow(w, 1 - st.g) - 1) / (1 - st.g), ui = v => st.g === 1 ? Math.exp(v) : Math.pow(v * (1 - st.g) + 1, 1 / (1 - st.g));
  const calc = () => { const w1 = st.W, w2 = Math.max(.5, st.W - st.L), EW = (1 - st.p) * w1 + st.p * w2, EU = (1 - st.p) * u(w1) + st.p * u(w2), CE = ui(EU); return { w1, w2, EW, EU, CE, rp: EW - CE, maxIns: st.W - CE, fair: st.p * st.L }; };
  A.tool({
    id: 'riesgo', mat: 'micro', unit: 2, ord: 2, name: 'Elección bajo incertidumbre y seguros', short: 'Riesgo y seguros', tag: 'Utilidad esperada', f: 'EU = p·u(w₁) + (1−p)·u(w₂)',
    desc: 'Utilidad esperada, equivalente cierto, prima de riesgo y cuánto pagarías como máximo por un seguro.',
    lead: 'Cuando el resultado es incierto, la gente no compara promedios: compara la utilidad esperada. Si la utilidad es cóncava (aversión al riesgo), una situación segura vale más que una lotería con el mismo promedio, y por eso existen los seguros.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('rk', D)}<dl class="stats" id="rk-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="rk-cv" style="height:380px"></canvas>${A.legend([['teal', 'Utilidad u(w)'], ['amber', 'Combinaciones de la lotería'], ['rose', 'Prima de riesgo']])}<div class="steplist" id="rk-steps"></div></div></div>`,
    init() { A.bindSliders('rk', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const r = calc();
    $('#rk-st').innerHTML = A.stats([['Riqueza esperada', '$' + f2(r.EW)], ['Equivalente cierto', '$' + f2(r.CE)], ['Prima de riesgo', '$' + f2(r.rp)], ['Pérdida esperada (seguro justo)', '$' + f2(r.fair)], ['Máximo que pagaría por el seguro', '$' + f2(r.maxIns)]]);
    $('#rk-steps').innerHTML = A.steps([
      `Dos escenarios: sin pérdida tenés ${f2(r.w1)} (prob. ${pct(1 - st.p, 0)}) y con pérdida ${f2(r.w2)} (prob. ${pct(st.p, 0)}). Riqueza esperada: ${pct(1 - st.p, 0)} × ${f2(r.w1)} + ${pct(st.p, 0)} × ${f2(r.w2)} = <b>${f2(r.EW)}</b>.`,
      `Utilidad esperada: promedio de las utilidades, no utilidad del promedio. El <b>equivalente cierto</b> es la riqueza segura que te deja igual de contento: <b>${f2(r.CE)}</b>.`,
      `Prima de riesgo = riqueza esperada − equivalente cierto = <b>${f2(r.rp)}</b>: lo que resignás para sacarte la incertidumbre de encima. ${st.g === 0 ? 'Con γ = 0 sos neutral al riesgo: la prima es cero.' : ''}`,
      `Un seguro que cubre la pérdida entera cuesta, si es actuarialmente justo, ${f2(r.fair)}. Vos pagarías hasta <b>${f2(r.maxIns)}</b>. La diferencia (${f2(r.maxIns - r.fair)}) es el margen que deja espacio para que la aseguradora gane plata y vos igual estés mejor.`]);
    draw();
  }
  function draw() {
    const r = calc(), lo = Math.max(.5, r.w2 * .6), hi = st.W * 1.15, g = A.ax($('#rk-cv'), [lo, hi], [u(lo), u(hi) + (u(hi) - u(lo)) * .08], { yf: v => fmt(v, 2), l: 52 }); if (!g) return;
    g.fn(u, K.teal, 2.4); g.path([[r.w2, u(r.w2)], [r.w1, u(r.w1)]], K.amber, 1.6, [5, 4]);
    g.dot(r.w2, u(r.w2), K.fg, 5); g.dot(r.w1, u(r.w1), K.fg, 5); g.dot(r.EW, r.EU, K.amber, 6); g.text('E[u]', r.EW, r.EU, K.amber, 'left', 'top', 6, 6);
    g.dot(r.CE, r.EU, K.rose, 6); g.path([[r.CE, r.EU], [r.EW, r.EU]], K.rose, 3); g.text('equivalente cierto', r.CE, r.EU, K.rose, 'right', 'bottom', -6);
    g.guide(r.EW, u(r.EW)); g.labels('Riqueza w', 'Utilidad');
  }
}

/* ================= Demanda derivada y curva de Engel ================= */
{
  const st = { mode: 'p' };
  const D = [['al', 'Preferencia α por x', .1, .9, .01, .4, 2], ['M', 'Ingreso M', 20, 300, 1, 120, 0], ['py', 'Precio de y', .5, 10, .5, 2, 1], ['px', 'Precio de x', .5, 12, .1, 3, 1]];
  const xs = (px, M) => st.al * M / px, ys = M => (1 - st.al) * M / st.py;
  A.tool({
    id: 'demanda-derivada', mat: 'micro', unit: 2, ord: 1, name: 'De las preferencias a la curva de demanda', short: 'Demanda y Engel', tag: 'Precio-consumo e ingreso-consumo', f: 'x(px) = α·M / px',
    desc: 'Variá el precio y mirá cómo la canasta óptima traza la curva de demanda. Variá el ingreso y obtené la curva de Engel.',
    lead: 'La curva de demanda no sale de la nada: es el resultado de que el consumidor optimice a cada precio. Arriba ves la canasta óptima; abajo, cómo se traslada a la curva de demanda (o a la de Engel si movés el ingreso).',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Qué variar</label>${A.seg('dd-m', [['p', 'El precio de x'], ['m', 'El ingreso']], 'p')}</div>${A.sliders('dd', D)}<dl class="stats" id="dd-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Canasta óptima</h3><canvas id="dd-top" style="height:280px"></canvas><h3 id="dd-h2">Curva de demanda de x</h3><canvas id="dd-bot" style="height:240px"></canvas><div class="explain" id="dd-exp"></div></div></div>`,
    init() { A.bindSliders('dd', D, st, upd); A.segBind('dd-m', v => { st.mode = v; upd(); }); upd(); },
    draw
  });
  function upd() {
    const x = xs(st.px, st.M), e = -1, eI = 1;
    $('#dd-h2').textContent = st.mode === 'p' ? 'Curva de demanda de x' : 'Curva de Engel de x';
    $('#dd-st').innerHTML = A.stats([['x óptima', f2(x)], ['y óptima', f2(ys(st.M))], ['Elasticidad precio', f2(e)], ['Elasticidad ingreso', f2(eI)]]);
    $('#dd-exp').innerHTML = st.mode === 'p' ? `<p>Con Cobb-Douglas se gasta siempre la fracción α del ingreso en x, así que x = α·M/px = ${f2(st.al)} × ${f0(st.M)} / ${f2(st.px)} = <b>${f2(x)}</b>. Al bajar px la recta presupuestaria gira hacia afuera y x sube: la unión de las canastas óptimas es la <b>curva precio-consumo</b>, y graficando x contra px sale la <b>demanda</b>. Su elasticidad es −1 en todos los puntos (por eso el gasto en x no cambia).</p>`
      : `<p>Al subir el ingreso la recta se corre en paralelo. La unión de las canastas óptimas es la <b>curva ingreso-consumo</b> y graficando x contra M sale la <b>curva de Engel</b>. Con Cobb-Douglas es una recta: x es un <b>bien normal</b> con elasticidad ingreso 1. Si la curva de Engel bajara, sería un <b>bien inferior</b> (como el colectivo cuando te alcanza para un auto).</p>`;
    draw();
  }
  const f0 = x => fmt(x, 0);
  function draw() {
    const xm = st.mode === 'p' ? st.al * st.M / .5 * .6 : st.al * 300 / st.px * 1.05, ym = st.mode === 'p' ? st.M / st.py * 1.1 : 300 / st.py * 1.05;
    const g = A.ax($('#dd-top'), [0, xm], [0, ym], { l: 40 });
    if (g) {
      const vals = st.mode === 'p' ? [1, 1.5, 2, 3, 5, 8] : [40, 80, 120, 180, 240];
      const path = vals.map(v => st.mode === 'p' ? [xs(v, st.M), ys(st.M)] : [xs(st.px, v), ys(v)]);
      vals.forEach(v => g.fn(x => st.mode === 'p' ? (st.M - v * x) / st.py : (v - st.px * x) / st.py, 'rgba(242,169,59,.25)', 1.2));
      g.path(path, K.violet, 1.6, [5, 4]); path.forEach(p => g.dot(p[0], p[1], K.violet, 3.5));
      g.fn(x => (st.M - st.px * x) / st.py, K.amber, 2.2); const x0 = xs(st.px, st.M), y0 = ys(st.M), U = Math.pow(x0, st.al) * Math.pow(y0, 1 - st.al);
      g.fn(x => Math.pow(U / Math.pow(x, st.al), 1 / (1 - st.al)), K.teal, 2, null, [xm * .01, xm]); g.dot(x0, y0, K.fg, 6); g.labels('x', 'y');
    }
    if (st.mode === 'p') { const b = A.ax($('#dd-bot'), [0, xm], [0, 12], { l: 40 }); if (b) { b.fn(x => st.al * st.M / x, K.teal, 2.2, null, [xm * .01, xm]); b.guide(xs(st.px, st.M), st.px); b.dot(xs(st.px, st.M), st.px, K.fg, 6); b.labels('Cantidad de x', 'px'); } }
    else { const b = A.ax($('#dd-bot'), [0, 300], [0, xs(st.px, 300) * 1.1], { l: 40 }); if (b) { b.fn(M => xs(st.px, M), K.teal, 2.2); b.guide(st.M, xs(st.px, st.M)); b.dot(st.M, xs(st.px, st.M), K.fg, 6); b.labels('Ingreso M', 'x'); } }
  }
}

/* ================= Producción de corto plazo ================= */
{
  const st = {};
  const D = [['a', 'Coeficiente a', 1, 12, .1, 6, 1], ['b', 'Coeficiente b', .05, 1, .01, .2, 2], ['L', 'Trabajadores L', 0, 30, .1, 10, 1]];
  const PT = L => st.a * L * L - st.b * L ** 3, PMg = L => 2 * st.a * L - 3 * st.b * L * L, PMe = L => st.a * L - st.b * L * L;
  A.tool({
    id: 'produccion', mat: 'micro', unit: 3, ord: 0, name: 'Producción de corto plazo', short: 'Producción', tag: 'Producto total, medio y marginal', f: 'PMg = dPT/dL',
    desc: 'Con el capital fijo, agregá trabajadores y mirá el producto total, medio y marginal. Las tres etapas de la producción y la ley de rendimientos decrecientes.',
    lead: 'En el corto plazo la fábrica (capital) está fija y solo podés sumar trabajadores. Al principio cada uno suma más que el anterior, pero llega un punto donde se estorban: es la ley de los rendimientos marginales decrecientes. Función de ejemplo: PT = a·L² − b·L³.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('pr', D)}<dl class="stats" id="pr-st" style="margin:0"></dl><div id="pr-pill"></div></div>
      <div class="stage"><h3>Producto total</h3><canvas id="pr-pt" style="height:240px"></canvas><h3>Producto medio y marginal</h3><canvas id="pr-pm" style="height:240px"></canvas>${A.legend([['amber', 'Producto marginal'], ['teal', 'Producto medio']])}<div class="steplist" id="pr-steps"></div></div></div>`,
    init() { A.bindSliders('pr', D, st, upd); upd(); },
    draw
  });
  const keys = () => ({ Lmg: st.a / (3 * st.b), Lme: st.a / (2 * st.b), Lpt: 2 * st.a / (3 * st.b) });
  function upd() {
    const k = keys(), L = st.L, stage = L <= k.Lme ? 'I' : L <= k.Lpt ? 'II' : 'III';
    $('#pr-st').innerHTML = A.stats([['Producto total', f2(PT(L))], ['Producto marginal', f2(PMg(L))], ['Producto medio', f2(PMe(L))]]);
    $('#pr-pill').innerHTML = `<span class="pill ${stage === 'II' ? 'ok' : 'warn'}">Etapa ${stage}</span>`;
    $('#pr-steps').innerHTML = A.steps([
      `PMg = dPT/dL = ${f2(2 * st.a)}·L − ${f2(3 * st.b)}·L². Es máximo en L = a/(3b) = <b>${f2(k.Lmg)}</b>: hasta ahí cada trabajador suma más que el anterior. Después empiezan los <b>rendimientos decrecientes</b>.`,
      `PMe = PT/L = ${f2(st.a)}·L − ${f2(st.b)}·L². Es máximo en L = a/(2b) = <b>${f2(k.Lme)}</b>, justo donde lo corta el PMg (cuando el marginal está arriba del promedio, lo tira para arriba; cuando está abajo, lo tira para abajo).`,
      `El PT es máximo donde el PMg vale cero: L = 2a/(3b) = <b>${f2(k.Lpt)}</b>.`,
      `<b>Etapas:</b> I (hasta L = ${f2(k.Lme)}) conviene seguir contratando; III (después de ${f2(k.Lpt)}) un trabajador más reduce la producción. Una empresa racional produce en la <b>etapa II</b>. Ahora estás en la etapa ${stage}.`]);
    draw();
  }
  function draw() {
    const k = keys(), Lm = k.Lpt * 1.2, g = A.ax($('#pr-pt'), [0, Lm], [0, PT(k.Lpt) * 1.12], { l: 46 });
    const shade = (g, y) => { g.clip(() => { g.c.fillStyle = 'rgba(67,200,184,.07)'; g.c.fillRect(g.X(k.Lme), g.F.T, g.X(k.Lpt) - g.X(k.Lme), g.F.ph); }); };
    if (g) { shade(g); g.fn(PT, K.fg, 2.4, null, [0, Lm]); g.guide(st.L, PT(st.L)); g.dot(st.L, PT(st.L), K.amber, 6); g.labels('L', 'PT'); }
    const m = A.ax($('#pr-pm'), [0, Lm], [Math.min(0, PMg(Lm)), PMg(k.Lmg) * 1.15], { l: 46 });
    if (m) { shade(m); m.hline(0, K.faint, 1); m.fn(PMg, K.amber, 2.2, null, [0, Lm]); m.fn(PMe, K.teal, 2.2, null, [0, Lm]); m.vline(st.L, K.faint, 1, [3, 4]); m.text('etapa II', (k.Lme + k.Lpt) / 2, PMg(k.Lmg) * 1.1, K.teal, 'center', 'top'); m.labels('L', 'PMg, PMe'); }
  }
}

/* ================= Isocuantas e isocostos ================= */
{
  const st = {};
  const D = [['al', 'Elasticidad del capital α', .1, .9, .01, .4, 2], ['be', 'Elasticidad del trabajo β', .1, .9, .01, .5, 2], ['Q', 'Producción buscada Q', 5, 100, 1, 30, 0], ['w', 'Salario w', 1, 20, .5, 5, 1], ['r', 'Costo del capital r', 1, 20, .5, 10, 1]];
  const opt = () => { const s = st.al + st.be, L = Math.pow(st.Q, 1 / s) * Math.pow(st.be * st.r / (st.al * st.w), st.al / s), Kk = L * st.al * st.w / (st.be * st.r); return { L, K: Kk, C: st.w * L + st.r * Kk }; };
  A.tool({
    id: 'isocuantas', mat: 'micro', unit: 3, ord: 1, name: 'Isocuantas, isocostos y minimización de costos', short: 'Isocuantas', tag: 'Largo plazo', f: 'TMST = PMgL/PMgK = w/r',
    desc: 'Producir una cantidad al menor costo posible: tangencia entre la isocuanta y el isocosto, senda de expansión y rendimientos a escala.',
    lead: 'En el largo plazo podés elegir cuánto capital y cuánto trabajo usar. La isocuanta junta las combinaciones que producen lo mismo; el isocosto, las que cuestan lo mismo. La combinación más barata es donde se tocan. Función: Q = K^α · L^β.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('iq', D)}<dl class="stats" id="iq-st" style="margin:0"></dl><div id="iq-pill"></div></div>
      <div class="stage"><canvas id="iq-cv" style="height:420px"></canvas>${A.legend([['teal', 'Isocuanta (Q fijo)'], ['amber', 'Isocosto mínimo'], ['faint', 'Otros isocostos'], ['violet', 'Senda de expansión']])}<div class="steplist" id="iq-steps"></div></div></div>`,
    init() { A.bindSliders('iq', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const o = opt(), s = st.al + st.be, rs = s > 1.005 ? ['crecientes', 'warn', 'más que se duplica'] : s < .995 ? ['decrecientes', 'bad', 'menos que se duplica'] : ['constantes', 'ok', 'se duplica exacto'];
    $('#iq-st').innerHTML = A.stats([['Trabajo L*', f2(o.L)], ['Capital K*', f2(o.K)], ['Costo mínimo', '$' + f2(o.C)], ['Costo medio', '$' + f2(o.C / st.Q)]]);
    $('#iq-pill').innerHTML = `<span class="pill ${rs[1]}">Rendimientos a escala ${rs[0]} (α + β = ${f2(s)})</span>`;
    $('#iq-steps').innerHTML = A.steps([
      `Condición de óptimo: la tasa a la que la tecnología te deja cambiar capital por trabajo (TMST = PMgL/PMgK = (β/α)·(K/L)) iguala a la que te cobra el mercado (w/r = ${f2(st.w / st.r)}).`,
      `Despejando: K/L = (α/β)·(w/r) = ${f3(st.al * st.w / (st.be * st.r))}. Reemplazo en Q = K^α·L^β = ${f0(st.Q)} → <b>L* = ${f2(o.L)}</b>, <b>K* = ${f2(o.K)}</b>.`,
      `Costo mínimo: w·L* + r·K* = ${f2(st.w)}×${f2(o.L)} + ${f2(st.r)}×${f2(o.K)} = <b>$${f2(o.C)}</b>.`,
      `Si subís el salario, la empresa sustituye trabajo por capital (probalo). La <b>senda de expansión</b> (violeta) muestra cómo crecen K y L juntos cuando aumenta Q.`,
      `Rendimientos a escala: duplicando K y L, la producción ${rs[2]} (se multiplica por 2^${f2(s)} = ${f2(Math.pow(2, s))}).`]);
    draw();
  }
  const f0 = x => fmt(x, 0);
  function draw() {
    const o = opt(), m = Math.max(o.L, o.K) * 2.4, g = A.ax($('#iq-cv'), [0, m], [0, m], { l: 40 }); if (!g) return;
    [.6, 1.5].forEach(k => g.fn(L => (o.C * k - st.w * L) / st.r, 'rgba(141,147,167,.5)', 1.2, [5, 5]));
    g.fn(L => L * st.al * st.w / (st.be * st.r), K.violet, 1.5, [6, 4]);
    [.5, 1, 2].forEach((k, i) => g.fn(L => Math.pow(st.Q * k / Math.pow(L, st.be), 1 / st.al), i === 1 ? K.teal : 'rgba(67,200,184,.35)', i === 1 ? 2.4 : 1.4, null, [m * .01, m]));
    g.fn(L => (o.C - st.w * L) / st.r, K.amber, 2.2); g.guide(o.L, o.K); g.dot(o.L, o.K, K.fg, 6); g.labels('Trabajo L', 'Capital K');
  }
}

/* ================= Discriminación de precios ================= */
{
  const st = {};
  const D = [['a1', 'Mercado 1 (turistas): ordenada', 30, 200, 1, 100, 0], ['b1', 'Mercado 1: pendiente', .2, 4, .1, 1, 1], ['a2', 'Mercado 2 (estudiantes): ordenada', 30, 200, 1, 60, 0], ['b2', 'Mercado 2: pendiente', .2, 4, .1, 1, 1], ['c', 'Costo marginal', 0, 50, 1, 20, 0]];
  const Qd = P => Math.max(0, (st.a1 - P) / st.b1) + Math.max(0, (st.a2 - P) / st.b2);
  const calc = () => {
    const q1 = Math.max(0, (st.a1 - st.c) / (2 * st.b1)), q2 = Math.max(0, (st.a2 - st.c) / (2 * st.b2)), p1 = st.a1 - st.b1 * q1, p2 = st.a2 - st.b2 * q2;
    let bp = st.c, bv = -Infinity; for (let i = 0; i <= 4000; i++) { const P = st.c + (Math.max(st.a1, st.a2) - st.c) * i / 4000, v = (P - st.c) * Qd(P); if (v > bv) { bv = v; bp = P; } }
    const cs = (a, b, P) => P < a ? .5 * (a - P) * (a - P) / b : 0;
    return { q1, q2, p1, p2, piD: (p1 - st.c) * q1 + (p2 - st.c) * q2, Pu: bp, Qu: Qd(bp), piU: bv, csD: cs(st.a1, st.b1, p1) + cs(st.a2, st.b2, p2), csU: cs(st.a1, st.b1, bp) + cs(st.a2, st.b2, bp) };
  };
  A.tool({
    id: 'discriminacion', mat: 'micro', unit: 4, ord: 2, name: 'Discriminación de precios de tercer grado', short: 'Discriminación', tag: 'Poder de mercado', f: '(P₁ − CMg)/P₁ = 1/|ε₁|',
    desc: 'Un monopolista que vende en dos mercados separados cobra más donde la demanda es menos sensible. Compará contra un precio único.',
    lead: 'Descuentos para estudiantes, tarifas para jubilados, precios distintos para turistas: si el vendedor puede separar a los clientes y evitar la reventa, le conviene cobrar más caro en el mercado menos elástico.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('dc', D)}</div>
      <div class="stage"><div class="grid2"><div><h3>Mercado 1</h3><canvas id="dc-1" style="height:260px"></canvas></div><div><h3>Mercado 2</h3><canvas id="dc-2" style="height:260px"></canvas></div></div>${A.legend([['teal', 'Demanda'], ['violet', 'Ingreso marginal'], ['rose', 'Costo marginal'], ['amber', 'Precio con discriminación'], ['faint', 'Precio único']])}
      <div class="tbl-wrap"><table class="tbl" id="dc-tbl"></table></div><div class="steplist" id="dc-steps"></div></div></div>`,
    init() { A.bindSliders('dc', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const r = calc(), e1 = -r.p1 / (st.b1 * r.q1), e2 = -r.p2 / (st.b2 * r.q2);
    $('#dc-tbl').innerHTML = `<tr><th></th><th>Precio 1</th><th>Precio 2</th><th>Cantidad total</th><th>Beneficio</th><th>Exc. consumidor</th></tr><tr class="best"><td>Discriminando</td><td>$${f2(r.p1)}</td><td>$${f2(r.p2)}</td><td>${f2(r.q1 + r.q2)}</td><td>${f2(r.piD)}</td><td>${f2(r.csD)}</td></tr><tr><td>Precio único</td><td>$${f2(r.Pu)}</td><td>$${f2(r.Pu)}</td><td>${f2(r.Qu)}</td><td>${f2(r.piU)}</td><td>${f2(r.csU)}</td></tr>`;
    $('#dc-steps').innerHTML = A.steps([
      `En cada mercado iguala su ingreso marginal al costo marginal: IMg₁ = ${f2(st.a1)} − ${f2(2 * st.b1)}·Q₁ = ${f2(st.c)} → Q₁ = ${f2(r.q1)}, P₁ = <b>$${f2(r.p1)}</b>; IMg₂ = ${f2(st.a2)} − ${f2(2 * st.b2)}·Q₂ = ${f2(st.c)} → Q₂ = ${f2(r.q2)}, P₂ = <b>$${f2(r.p2)}</b>.`,
      `Elasticidades en el óptimo: ε₁ = ${f2(e1)} y ε₂ = ${f2(e2)}. Se cobra más caro donde |ε| es menor: regla de Lerner, (P − CMg)/P = 1/|ε|.`,
      `Discriminar le da un beneficio de ${f2(r.piD)} contra ${f2(r.piU)} con precio único. ${r.q1 + r.q2 > r.Qu + .01 ? 'Además se vende más cantidad total: en este caso la discriminación también <b>amplía el mercado</b>.' : ''}`,
      `Requisitos: tener poder de mercado, poder identificar a cada grupo (pidiendo la libreta universitaria, por ejemplo) y que no se pueda revender.`]);
    draw();
  }
  function draw() {
    const r = calc();
    [[1, st.a1, st.b1, r.q1, r.p1], [2, st.a2, st.b2, r.q2, r.p2]].forEach(([i, a, b, q, p]) => {
      const pm = Math.max(st.a1, st.a2) * 1.05, g = A.ax($('#dc-' + i), [0, a / b * 1.05], [0, pm], { l: 36 }); if (!g) return;
      g.fn(Q => a - b * Q, K.teal); g.fn(Q => a - 2 * b * Q, K.violet, 1.6, null, [0, a / (2 * b)]); g.hline(st.c, K.rose, 1.6);
      g.hline(r.Pu, K.faint, 1.2, [4, 4]); if (q > 0) { g.guide(q, p); g.dot(q, p, K.amber, 6); }
    });
  }
}

/* ================= Competencia monopolística ================= */
{
  const st = { a: 100 };
  const D = [['b', 'Pendiente de la demanda de la empresa', .2, 3, .1, 1, 1], ['F', 'Costo fijo', 50, 1500, 10, 400, 0], ['c', 'Costo marginal', 0, 40, 1, 20, 0]];
  let timer = null;
  const calc = () => { const Q = Math.max(0, (st.a - st.c) / (2 * st.b)), P = st.a - st.b * Q; return { Q, P, pi: (P - st.c) * Q - st.F, aLR: st.c + 2 * Math.sqrt(st.b * st.F), QLR: Math.sqrt(st.F / st.b) }; };
  A.tool({
    id: 'monopolistica', mat: 'micro', unit: 4, ord: 3, name: 'Competencia monopolística', short: 'Competencia monopolística', tag: 'Diferenciación de productos', f: 'largo plazo: P = CMe',
    desc: 'Cada empresa tiene su propia marca y algo de poder de mercado, pero la entrada de competidores achica su demanda hasta que el beneficio es cero.',
    lead: 'Cafeterías, ropa, restaurantes: cada uno vende algo un poco distinto y puede poner su precio, pero entrar al mercado es fácil. En el corto plazo puede haber ganancias; en el largo plazo, la entrada de competidores corre la demanda de cada empresa hasta que toca su costo medio.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mc2', D)}<div><label class="l" for="mc2-a">Demanda de la empresa (se achica con más competidores): <span id="mc2-av" style="color:var(--fg)">100</span></label><input type="range" id="mc2-a" min="30" max="160" step="0.5" value="100"></div>
      <button class="btn primary sm" id="mc2-go" style="align-self:flex-start">Simular entrada de competidores</button><dl class="stats" id="mc2-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="mc2-cv" style="height:420px"></canvas>${A.legend([['teal', 'Demanda de la empresa'], ['violet', 'Ingreso marginal'], ['rose', 'Costo marginal'], ['amber', 'Costo medio']])}<div class="explain" id="mc2-exp"></div></div></div>`,
    init() {
      A.bindSliders('mc2', D, st, upd);
      $('#mc2-a').oninput = e => { clearInterval(timer); st.a = +e.target.value; upd(); };
      $('#mc2-go').onclick = () => { clearInterval(timer); timer = setInterval(() => { const r = calc(); if (A.current !== 'monopolistica' || Math.abs(st.a - r.aLR) < .3) { clearInterval(timer); st.a = r.aLR; upd(); return; } st.a += (r.aLR - st.a) * .15; upd(); }, A.reduce ? 10 : 120); };
      upd();
    },
    draw, hide: () => clearInterval(timer)
  });
  function upd() {
    $('#mc2-a').value = st.a; $('#mc2-av').textContent = fmt(st.a, 1);
    const r = calc();
    $('#mc2-st').innerHTML = A.stats([['Cantidad', f2(r.Q)], ['Precio', '$' + f2(r.P)], ['Beneficio', '$' + f2(r.pi)], ['Markup sobre el CMg', pct((r.P - st.c) / st.c || 0, 0)]]);
    $('#mc2-exp').innerHTML = `<p>La empresa elige como un monopolista: IMg = CMg → Q = ${f2(r.Q)}, P = $${f2(r.P)}. ${Math.abs(r.pi) < 5 ? '<b>Largo plazo:</b> la demanda toca justo a la curva de costo medio, el beneficio es cero y nadie más quiere entrar.' : r.pi > 0 ? `Gana $${f2(r.pi)}: eso atrae competidores con productos parecidos, que le sacan clientes y corren su demanda a la izquierda.` : `Pierde $${f2(-r.pi)}: algunas empresas salen y la demanda de las que quedan crece.`}</p>
      <p style="margin-top:6px">En el largo plazo cada empresa produce ${f2(r.QLR)} y cobra más que su costo marginal: a diferencia de la competencia perfecta, hay <b>capacidad ociosa</b> (podría bajar su costo medio produciendo más). Es el precio de tener variedad.</p>`;
    draw();
  }
  function draw() {
    const r = calc(), qm = Math.max(st.a / st.b, r.QLR * 2.2), g = A.ax($('#mc2-cv'), [0, qm * .8], [0, Math.max(st.a, 160) * 1.02]); if (!g) return;
    if (r.Q > 0) g.poly([[0, r.P], [r.Q, r.P], [r.Q, st.F / r.Q + st.c], [0, st.F / r.Q + st.c]], r.pi >= 0 ? 'rgba(67,200,184,.22)' : 'rgba(239,115,145,.25)');
    g.fn(Q => st.a - st.b * Q, K.teal); g.fn(Q => st.a - 2 * st.b * Q, K.violet, 1.6, null, [0, st.a / (2 * st.b)]); g.hline(st.c, K.rose, 1.8); g.fn(Q => st.F / Q + st.c, K.amber, 2.2, null, [st.F / 200, qm]);
    g.guide(r.Q, r.P); g.dot(r.Q, r.P, K.fg, 6); g.labels('Cantidad de la empresa', 'Precio');
  }
}

/* ================= Caja de Edgeworth ================= */
{
  const st = { xA: 8, yA: 2 }, X = 10, Y = 10;
  const D = [['aA', 'Preferencia de A por el bien x', .1, .9, .01, .5, 2], ['aB', 'Preferencia de B por el bien x', .1, .9, .01, .5, 2]];
  let G = null;
  const calc = () => {
    const xB = X - st.xA, yB = Y - st.yA, p = (st.aA * st.yA + st.aB * yB) / (X - st.aA * st.xA - st.aB * xB);
    const IA = p * st.xA + st.yA, IB = p * xB + yB, ax = st.aA * IA / p, ay = (1 - st.aA) * IA;
    return { p, ax, ay, uA0: Math.pow(st.xA, st.aA) * Math.pow(st.yA, 1 - st.aA), uB0: Math.pow(xB, st.aB) * Math.pow(yB, 1 - st.aB), uA: Math.pow(ax, st.aA) * Math.pow(ay, 1 - st.aA), uB: Math.pow(X - ax, st.aB) * Math.pow(Y - ay, 1 - st.aB) };
  };
  A.tool({
    id: 'edgeworth', mat: 'micro', unit: 5, name: 'Caja de Edgeworth y equilibrio general', short: 'Edgeworth', tag: 'Intercambio y eficiencia de Pareto', f: 'TMS_A = TMS_B = px/py',
    desc: 'Dos personas intercambian dos bienes. Dotaciones, curva de contrato, equilibrio competitivo y primer teorema del bienestar.',
    lead: 'A y B tienen en total 10 unidades de x y 10 de y. La caja muestra todos los repartos posibles: A se mide desde abajo a la izquierda y B desde arriba a la derecha. Arrastrá la dotación inicial (el punto blanco) y mirá a qué precio y a qué reparto llega el mercado.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ew', D)}<dl class="stats" id="ew-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ew-cv" style="width:min(100%,520px);aspect-ratio:1;align-self:center;touch-action:none;cursor:grab"></canvas>${A.legend([['amber', 'Indiferencia de A'], ['teal', 'Indiferencia de B'], ['violet', 'Curva de contrato (eficientes)'], ['rose', 'Recta de precios']])}<div class="steplist" id="ew-steps"></div></div></div>`,
    init() {
      A.bindSliders('ew', D, st, upd);
      const cv = $('#ew-cv'); let drag = false;
      const set = e => { if (!G) return; const r = cv.getBoundingClientRect(); st.xA = A.clamp((e.clientX - r.left - G.L) / G.S * X, .2, X - .2); st.yA = A.clamp((G.T + G.S - (e.clientY - r.top)) / G.S * Y, .2, Y - .2); upd(); };
      cv.addEventListener('pointerdown', e => { drag = true; cv.setPointerCapture(e.pointerId); set(e); }); cv.addEventListener('pointermove', e => drag && set(e)); cv.addEventListener('pointerup', () => drag = false);
      upd();
    },
    draw
  });
  function upd() {
    const r = calc();
    $('#ew-st').innerHTML = A.stats([['Precio relativo px/py', f3(r.p)], ['A termina con', `x = ${f2(r.ax)}, y = ${f2(r.ay)}`], ['B termina con', `x = ${f2(X - r.ax)}, y = ${f2(Y - r.ay)}`], ['Ganancia de utilidad A', '+' + pct(r.uA / r.uA0 - 1, 1)], ['Ganancia de utilidad B', '+' + pct(r.uB / r.uB0 - 1, 1)]]);
    $('#ew-steps').innerHTML = A.steps([
      `Dotación inicial: A tiene (${f2(st.xA)}; ${f2(st.yA)}) y B (${f2(X - st.xA)}; ${f2(Y - st.yA)}). Las curvas de indiferencia que pasan por ahí forman una "lente": todo lo que está adentro mejora a los dos.`,
      `Con py = 1, cada uno demanda x = α·ingreso/px. El precio que vacía el mercado de x: <b>px = (αA·yA + αB·yB)/(10 − αA·xA − αB·xB) = ${f3(r.p)}</b>.`,
      `En el equilibrio las dos curvas de indiferencia son tangentes entre sí y a la recta de precios: TMS de A = TMS de B = px/py. El reparto cae sobre la <b>curva de contrato</b>, donde no se puede mejorar a uno sin empeorar al otro.`,
      `<b>Primer teorema del bienestar:</b> el equilibrio competitivo es eficiente en el sentido de Pareto. <b>Segundo teorema:</b> cualquier reparto eficiente se puede alcanzar redistribuyendo las dotaciones y dejando operar al mercado. Eficiente no significa justo: mové la dotación a una esquina y mirá.`]);
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#ew-cv')); if (w < 2) return; const r = calc(), S = Math.min(w, h) - 70, L = 40, T = 26;
    G = { L, T, S }; const PX = x => L + x / X * S, PY = y => T + S - y / Y * S;
    c.strokeStyle = K.line; c.lineWidth = 1.5; c.strokeRect(L, T, S, S);
    c.font = '12px ' + A.MONO; c.fillStyle = K.amber; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('A', L - 16, T + S + 4); c.fillStyle = K.teal; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText('B', L + S + 16, T - 4);
    c.fillStyle = K.muted; c.font = '11px ' + A.MONO; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText('x de A →', L + S / 2, T + S + 6); c.textBaseline = 'bottom'; c.fillText('← x de B', L + S / 2, T - 6);
    c.save(); c.beginPath(); c.rect(L, T, S, S); c.clip();
    const curve = (fy, col, lw, dash) => { c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath(); let pen = false; for (let i = 1; i < 400; i++) { const x = X * i / 400, y = fy(x); if (!Number.isFinite(y) || y < -1 || y > Y + 1) { pen = false; continue; } pen ? c.lineTo(PX(x), PY(y)) : c.moveTo(PX(x), PY(y)); pen = true; } c.stroke(); c.setLineDash([]); };
    const kA = st.aA / (1 - st.aA), kB = st.aB / (1 - st.aB);
    curve(x => kB * Y * x / (kA * (X - x) + kB * x), K.violet, 1.8, [5, 4]);
    const icA = u => x => Math.pow(u / Math.pow(x, st.aA), 1 / (1 - st.aA)), icB = u => x => Y - Math.pow(u / Math.pow(X - x, st.aB), 1 / (1 - st.aB));
    curve(icA(r.uA0), 'rgba(242,169,59,.55)', 1.4); curve(icB(r.uB0), 'rgba(67,200,184,.55)', 1.4);
    curve(icA(r.uA), K.amber, 2.2); curve(icB(r.uB), K.teal, 2.2);
    curve(x => st.yA - r.p * (x - st.xA), K.rose, 1.8);
    c.restore();
    c.fillStyle = K.fg; c.beginPath(); c.arc(PX(st.xA), PY(st.yA), 7, 0, 7); c.fill(); c.font = '12px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillText('dotación', PX(st.xA) + 9, PY(st.yA) - 4);
    c.fillStyle = K.rose; c.beginPath(); c.arc(PX(r.ax), PY(r.ay), 7, 0, 7); c.fill(); c.fillText('equilibrio', PX(r.ax) + 9, PY(r.ay) - 4);
  }
}

/* ================= Bienes públicos ================= */
{
  const st = {};
  const D = [['n', 'Cantidad de vecinos', 1, 20, 1, 5, 0], ['a', 'Valoración de cada uno por la primera unidad', 2, 50, 1, 20, 0], ['b', 'Pendiente de la valoración', .2, 3, .1, 1, 1], ['c', 'Costo marginal de proveerlo', 5, 200, 1, 60, 0]];
  A.tool({
    id: 'bienespublicos', mat: 'micro', unit: 6, ord: 1, name: 'Bienes públicos y el problema del polizón', short: 'Bienes públicos', tag: 'Fallas de mercado', f: 'Σ BMgᵢ = CMg',
    desc: 'Plazas, alumbrado, defensa: nadie puede ser excluido. Por eso la suma de valoraciones es vertical y el mercado privado provee de menos.',
    lead: 'Un bien público lo disfrutan todos a la vez (no hay rivalidad) y no se puede excluir a quien no paga. El beneficio social de una unidad es la suma de lo que vale para cada uno. Pero como cada uno espera que paguen los demás, el mercado privado provee mucho menos de lo óptimo.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('bp', D)}<dl class="stats" id="bp-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="bp-cv" style="height:400px"></canvas>${A.legend([['teal', 'Valoración de un vecino'], ['amber', 'Valoración social (suma vertical)'], ['rose', 'Costo marginal']])}<div class="steplist" id="bp-steps"></div></div></div>`,
    init() { A.bindSliders('bp', D, st, upd); upd(); },
    draw
  });
  const calc = () => { const Qs = Math.max(0, (st.a - st.c / st.n) / st.b), Qp = Math.max(0, (st.a - st.c) / st.b); return { Qs, Qp, dwl: Qs > Qp ? .5 * (Qs - Qp) * (st.n * (st.a - st.b * Qp) - st.c) : 0 }; };
  function upd() {
    const r = calc();
    $('#bp-st').innerHTML = A.stats([['Cantidad óptima', f2(r.Qs)], ['Provisión privada', f2(r.Qp)], ['Pérdida de bienestar', f2(r.dwl)], ['Aporte por vecino si se reparte', '$' + f2(st.c * r.Qs / st.n)]]);
    $('#bp-steps').innerHTML = A.steps([
      `Para un bien privado sumamos demandas en horizontal (cantidades). Para un bien público, en <b>vertical</b>: una plaza de cierto tamaño la usan todos, así que su valor social es la suma de lo que vale para cada uno: ${st.n} × (${f2(st.a)} − ${f2(st.b)}·Q).`,
      `Óptimo (condición de Samuelson): Σ BMg = CMg → ${st.n}(${f2(st.a)} − ${f2(st.b)}Q) = ${f2(st.c)} → <b>Q* = ${f2(r.Qs)}</b>.`,
      `Provisión privada: cada vecino compara solo su propio beneficio con el costo. ${r.Qp > 0 ? `Uno solo pagaría hasta Q = ${f2(r.Qp)}` : `Nadie la financia solo (${f2(st.a)} < ${f2(st.c)})`}, y los demás se cuelgan: es el problema del <b>polizón</b> (free rider).`,
      `Cuantos más vecinos, más grande la brecha: el óptimo crece con n pero la provisión privada no. Por eso estos bienes suelen financiarse con impuestos.`]);
    draw();
  }
  function draw() {
    const r = calc(), qm = st.a / st.b * 1.05, g = A.ax($('#bp-cv'), [0, qm], [0, Math.max(st.n * st.a, st.c) * 1.08], { l: 46 }); if (!g) return;
    if (r.dwl > 0) g.area(Q => st.n * (st.a - st.b * Q), () => st.c, r.Qp, r.Qs, 'rgba(239,115,145,.3)');
    g.fn(Q => st.a - st.b * Q, K.teal, 2, null, [0, st.a / st.b]); g.fn(Q => st.n * (st.a - st.b * Q), K.amber, 2.4, null, [0, st.a / st.b]); g.hline(st.c, K.rose, 2);
    g.guide(r.Qs, st.c); g.dot(r.Qs, st.c, K.fg, 6); g.text('óptimo', r.Qs, st.c, K.fg); if (r.Qp > 0) { g.dot(r.Qp, st.c, K.teal, 5); g.text('privado', r.Qp, st.c, K.teal, 'right', 'bottom', -6); }
    g.labels('Cantidad del bien público', '$');
  }
}

/* ================= Información asimétrica: mercado de limones ================= */
{
  const st = {};
  const D = [['be', 'Cuánto más valora el comprador (β)', 1, 2.5, .05, 1.5, 2], ['qmin', 'Calidad mínima de los autos', 0, .8, .01, .1, 2]];
  const sim = () => { let P = 1; const path = [P]; for (let t = 0; t < 30; t++) { const top = Math.min(P, 1), avg = (st.qmin + Math.max(st.qmin, top)) / 2; P = st.be * avg; path.push(P); } return path; };
  A.tool({
    id: 'limones', mat: 'micro', unit: 6, ord: 2, name: 'Selección adversa: el mercado de limones', short: 'Limones', tag: 'Información asimétrica', f: 'P = β·E[q | q ≤ P]',
    desc: 'El modelo de Akerlof de autos usados: cuando el vendedor sabe más que el comprador, los buenos productos se retiran y el mercado puede desaparecer.',
    lead: 'En un mercado de autos usados el vendedor conoce la calidad y el comprador no. El comprador paga según la calidad promedio, pero a ese precio los dueños de autos buenos no quieren vender. Se van, baja el promedio, baja el precio, se van más… Así funciona la selección adversa.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('lmn', D)}<dl class="stats" id="lmn-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="lmn-cv" style="height:320px"></canvas>${A.legend([['amber', 'Precio que pagan los compradores'], ['teal', 'Fracción de autos que se venden']])}<div class="steplist" id="lmn-steps"></div></div></div>`,
    init() { A.bindSliders('lmn', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const p = sim(), Pf = p[p.length - 1], share = Math.min(1, Math.max(0, (Math.min(Pf, 1) - st.qmin) / (1 - st.qmin)));
    $('#lmn-st').innerHTML = A.stats([['Precio final', f3(Pf)], ['Autos que se venden', pct(share, 0)], ['Calidad promedio vendida', f3((st.qmin + Math.min(1, Pf)) / 2)]]);
    $('#lmn-steps').innerHTML = A.steps([
      `Calidades distribuidas entre ${f2(st.qmin)} y 1. Un auto de calidad q vale q para el vendedor y ${f2(st.be)}·q para el comprador. Con información completa, <b>todos</b> los autos se venderían.`,
      `Pero el comprador no ve la calidad: paga ${f2(st.be)} × (calidad promedio de lo que se ofrece). A precio P, solo venden los que tienen q ≤ P, cuyo promedio es (${f2(st.qmin)} + P)/2.`,
      `Iterando: arranca en P = 1 y en cada ronda se retiran los mejores autos. ${share < .02 ? '<b>El mercado colapsa</b>: solo quedan los "limones" (los peores autos).' : share > .98 ? 'El comprador valora tanto más que el vendedor que el mercado sobrevive entero.' : `El mercado se estabiliza vendiendo solo el ${pct(share, 0)} de los autos: los mejores se quedan afuera.`}`,
      `Soluciones del mundo real: garantías, revisiones técnicas, reputación de la concesionaria, reseñas. Todas son formas de <b>señalizar</b> la calidad. El mismo problema aparece en seguros de salud y en el crédito.`]);
    draw();
  }
  function draw() {
    const p = sim(), g = A.ax($('#lmn-cv'), [0, p.length - 1], [0, Math.max(1.1, st.be * .6)], { l: 40, xf: v => 'ronda ' + fmt(v, 0), xt: 5 }); if (!g) return;
    g.path(p.map((v, t) => [t, v]), K.amber, 2.2); g.path(p.map((v, t) => [t, Math.min(1, Math.max(0, (Math.min(v, 1) - st.qmin) / (1 - st.qmin)))]), K.teal, 2.2, [5, 4]);
  }
}
})();
