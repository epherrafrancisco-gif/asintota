/* Asíntota · Macroeconomía */
(() => {
const { $, $$, K, fmt, pct } = A;
const f2 = x => fmt(x, 2), f0 = x => fmt(x, 0);

/* ================= Cruz keynesiana y multiplicador ================= */
{
  const st = {};
  const D = [['C0', 'Consumo autónomo C₀', 0, 300, 5, 50, 0], ['c', 'Propensión marginal a consumir c', .1, .95, .01, .8, 2], ['I', 'Inversión I', 0, 400, 5, 100, 0], ['G', 'Gasto público G', 0, 400, 5, 100, 0], ['T', 'Impuestos T', 0, 400, 5, 100, 0], ['dG', 'Aumento del gasto ΔG', -100, 100, 5, 20, 0]];
  const Y = (G) => (st.C0 - st.c * st.T + st.I + G) / (1 - st.c);
  A.tool({
    id: 'keynes', mat: 'macro', unit: 1, name: 'Cruz keynesiana y multiplicador', short: 'Multiplicador', tag: 'Demanda agregada', f: 'ΔY = ΔG / (1 − c)',
    desc: 'El equilibrio donde la producción iguala al gasto planeado, y por qué un peso de gasto público mueve más de un peso de producto.',
    lead: 'Gasto planeado: DA = C₀ + c·(Y − T) + I + G. En equilibrio la producción Y iguala a la DA (el cruce con la recta de 45°). Si el gasto sube, el producto sube más: lo que uno gasta es ingreso de otro, que a su vez gasta una parte.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ky', D)}<dl class="stats" id="ky-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ky-cv" style="height:380px"></canvas>${A.legend([['faint', 'Recta de 45° (Y = DA)'], ['teal', 'Demanda agregada inicial'], ['amber', 'Con ΔG']])}
      <h3>Las rondas del multiplicador</h3><canvas id="ky-r" style="height:170px"></canvas><div class="steplist" id="ky-steps"></div></div></div>`,
    init() { A.bindSliders('ky', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const y0 = Y(st.G), y1 = Y(st.G + st.dG), m = 1 / (1 - st.c);
    $('#ky-st').innerHTML = A.stats([['Producto de equilibrio', f2(y0)], ['Con ΔG', f2(y1)], ['Multiplicador del gasto', f2(m)], ['Multiplicador de impuestos', f2(-st.c * m)]]);
    $('#ky-steps').innerHTML = A.steps([
      `Equilibrio: Y = C₀ + c(Y − T) + I + G → Y − c·Y = C₀ − c·T + I + G → Y = (C₀ − c·T + I + G)/(1 − c).`,
      `Con los números: Y = (${f0(st.C0)} − ${f2(st.c)}×${f0(st.T)} + ${f0(st.I)} + ${f0(st.G)}) / ${f2(1 - st.c)} = <b>${f2(y0)}</b>.`,
      `Multiplicador = 1/(1 − c) = 1/${f2(1 - st.c)} = <b>${f2(m)}</b>. Un ΔG = ${f0(st.dG)} sube el producto en ${f2(m)} × ${f0(st.dG)} = <b>${f2(y1 - y0)}</b>.`,
      `Por qué: el primer ${f0(st.dG)} es ingreso de alguien, que gasta ${pct(st.c, 0)} (${f2(st.c * st.dG)}); eso es ingreso de otro, que gasta ${pct(st.c, 0)} de eso, y así. Suma: ${f0(st.dG)} × (1 + c + c² + …) = ${f0(st.dG)}/(1 − c).`,
      `Bajar impuestos mueve menos que gastar: el multiplicador de impuestos es −c/(1 − c) = ${f2(-st.c * m)}, porque la gente ahorra una parte de lo que le devuelven. Subir G y T en lo mismo sube Y en exactamente ese monto (multiplicador del presupuesto equilibrado = 1).`]);
    draw();
  }
  function draw() {
    const y1 = Y(st.G + st.dG), y0 = Y(st.G), M = Math.max(y0, y1, 100) * 1.35;
    const g = A.ax($('#ky-cv'), [0, M], [0, M]); if (g) {
      const da = G => y => st.C0 + st.c * (y - st.T) + st.I + G;
      g.fn(y => y, K.faint, 1.4); g.fn(da(st.G), K.teal); if (st.dG) g.fn(da(st.G + st.dG), K.amber);
      g.guide(y0, y0); g.dot(y0, y0, K.teal, 5.5); if (st.dG) { g.guide(y1, y1); g.dot(y1, y1, K.amber, 6); }
      g.labels('Producto Y', 'Gasto planeado DA');
    }
    const N = 15, rounds = Array.from({ length: N }, (_, i) => st.dG * st.c ** i);
    const r = A.ax($('#ky-r'), [-.5, N - .5], [Math.min(0, ...rounds) * 1.1, Math.max(0, ...rounds) * 1.15 || 1], { xticks: [0, 5, 10, 14], xf: v => 'ronda ' + (v + 1) }); if (!r) return;
    const bw = (r.F.X(1) - r.F.X(0)) * .7;
    rounds.forEach((v, i) => { r.c.fillStyle = K.amber; r.c.globalAlpha = .85; r.c.fillRect(r.F.X(i) - bw / 2, r.F.Y(Math.max(0, v)), bw, Math.abs(r.F.Y(0) - r.F.Y(v))); });
    r.c.globalAlpha = 1;
  }
}

/* ================= IS-LM ================= */
{
  const st = {};
  const B = { C0: 100, I0: 200, k: .5 };
  const D = [['c', 'Propensión a consumir c', .4, .9, .01, .75, 2], ['d', 'Sensibilidad de la inversión a r (d)', 1, 60, 1, 20, 0], ['h', 'Sensibilidad del dinero a r (h)', 2, 200, 1, 40, 0], ['G', 'Gasto público G', 0, 500, 5, 200, 0], ['T', 'Impuestos T', 0, 500, 5, 200, 0], ['M', 'Oferta monetaria real M/P', 100, 900, 5, 400, 0]];
  const solve = p => { const A0 = B.C0 - p.c * p.T + B.I0 + p.G, Y = (A0 + p.d * p.M / p.h) / ((1 - p.c) + p.d * B.k / p.h); return { Y, r: (B.k * Y - p.M) / p.h, A0 }; };
  let base = null;
  A.tool({
    id: 'islm', mat: 'macro', unit: 2, name: 'Modelo IS-LM', short: 'IS-LM', tag: 'Equilibrio de corto plazo', f: 'IS: Y = (A − d·r)/(1 − c)',
    desc: 'Mercado de bienes y mercado de dinero a la vez. Política fiscal, monetaria y el efecto desplazamiento (crowding out).',
    lead: 'La IS junta las combinaciones de producto y tasa de interés donde el mercado de bienes está en equilibrio; la LM, donde lo está el mercado de dinero. Mové la política fiscal o monetaria y compará con el punto inicial.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('il', D)}<div class="row"><button class="btn sm" id="il-base">Fijar como punto inicial</button></div><dl class="stats" id="il-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="il-cv" style="height:420px"></canvas>${A.legend([['teal', 'IS'], ['amber', 'LM'], ['faint', 'Curvas iniciales']])}<div class="steplist" id="il-steps"></div></div></div>`,
    init() { A.bindSliders('il', D, st, upd); base = { ...st }; $('#il-base').onclick = () => { base = { ...st }; upd(); }; upd(); },
    draw
  });
  function upd() {
    const r = solve(st), r0 = solve(base), dG = st.G - base.G, kz = dG / (1 - st.c);
    $('#il-st').innerHTML = A.stats([['Producto Y', f2(r.Y)], ['Tasa de interés r', f2(r.r) + '%'], ['Cambio en Y', (r.Y >= r0.Y ? '+' : '') + f2(r.Y - r0.Y)], ['Cambio en r', (r.r >= r0.r ? '+' : '') + f2(r.r - r0.r) + ' pp']]);
    const s = [
      `IS: Y = C₀ + c(Y − T) + I₀ − d·r + G → Y = (${f2(r.A0)} − ${f0(st.d)}·r)/${f2(1 - st.c)}.`,
      `LM: M/P = k·Y − h·r → r = (${B.k}·Y − ${f0(st.M)})/${f0(st.h)}.`,
      `Reemplazo la LM en la IS y despejo: Y = (A + d·M/(P·h)) / ((1 − c) + d·k/h) = <b>${f2(r.Y)}</b>, y r = <b>${f2(r.r)}%</b>.`];
    if (dG) s.push(`Con ΔG = ${f0(dG)}, el multiplicador simple diría ΔY = ${f2(kz)}, pero el producto subió solo ${f2(r.Y - r0.Y)}. La diferencia (${f2(kz - (r.Y - r0.Y))}) es el <b>efecto desplazamiento</b>: al subir Y sube la demanda de dinero, sube la tasa y cae la inversión privada.`);
    if (st.M !== base.M) s.push(`La política monetaria ${st.M > base.M ? 'expansiva baja' : 'contractiva sube'} la tasa: la LM se corre ${st.M > base.M ? 'a la derecha' : 'a la izquierda'} y la inversión ${st.M > base.M ? 'sube' : 'cae'}.`);
    s.push(`Probá los casos extremos: con h muy chico (LM casi vertical) la política fiscal casi no mueve Y; con h muy grande (trampa de liquidez) la política monetaria pierde fuerza.`);
    $('#il-steps').innerHTML = A.steps(s);
    draw();
  }
  function draw() {
    const r = solve(st), r0 = solve(base), Ym = Math.max(r.Y, r0.Y) * 1.6, rmax = Math.max(12, r.r * 2, r0.r * 2);
    const g = A.ax($('#il-cv'), [0, Ym], [Math.min(0, r.r - 3), rmax], { yf: v => fmt(v, 0) + '%' }); if (!g) return;
    const is = p => Y => (solve(p).A0 - (1 - p.c) * Y) / p.d, lm = p => Y => (B.k * Y - p.M) / p.h;
    g.fn(is(base), K.faint, 1.4, [5, 5]); g.fn(lm(base), K.faint, 1.4, [5, 5]); g.dot(r0.Y, r0.r, K.faint, 4);
    g.fn(is(st), K.teal); g.fn(lm(st), K.amber);
    g.guide(r.Y, r.r); g.dot(r.Y, r.r, K.fg, 6); g.text(`(${f0(r.Y)}; ${f2(r.r)}%)`, r.Y, r.r, K.fg);
    g.labels('Producto Y', 'Tasa r');
  }
}

/* ================= Oferta y demanda agregada ================= */
{
  const st = { Pe: 1, path: [] };
  const D = [['dA', 'Shock de demanda (gasto)', -150, 150, 5, 0, 0], ['dM', 'Shock monetario (ΔM)', -200, 200, 5, 0, 0], ['sup', 'Shock de oferta (costos)', -.3, .3, .01, 0, 2], ['al', 'Pendiente de la OA de corto plazo', .0002, .003, .0001, .001, 4]];
  const Yn = 1100, ad = P => 700 + st.dA * 2 + (400 + st.dM) / P;
  const eqSR = () => { let lo = .05, hi = 10; for (let i = 0; i < 100; i++) { const P = (lo + hi) / 2, Y = ad(P), Ps = st.Pe + st.sup + st.al * (Y - Yn); Ps > P ? lo = P : hi = P; } const P = (lo + hi) / 2; return { P, Y: ad(P) }; };
  const eqLR = () => { const k = 700 + st.dA * 2; return { P: (400 + st.dM) / (Yn - k), Y: Yn }; };
  let timer = null;
  A.tool({
    id: 'oada', mat: 'macro', unit: 2, name: 'Oferta y demanda agregada', short: 'OA-DA', tag: 'Corto y largo plazo', f: 'P = Pᵉ + α(Y − Yₙ)',
    desc: 'Shocks de demanda, monetarios y de oferta. Qué pasa en el corto plazo y cómo la economía vuelve al producto potencial.',
    lead: 'La demanda agregada sale del IS-LM: a mayor nivel de precios, menos dinero real y menos producto. La oferta de corto plazo sube con Y porque los precios esperados están fijos un tiempo; en el largo plazo las expectativas se ajustan y el producto vuelve a su nivel natural Yₙ = 1.100.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ad', D)}<div class="row"><button class="btn primary sm" id="ad-go">Ajuste de largo plazo</button><button class="btn sm" id="ad-reset">Volver al inicio</button></div><dl class="stats" id="ad-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ad-cv" style="height:420px"></canvas>${A.legend([['teal', 'Demanda agregada'], ['amber', 'Oferta de corto plazo'], ['violet', 'Oferta de largo plazo (Yₙ)']])}<div class="explain" id="ad-exp"></div></div></div>`,
    init() {
      A.bindSliders('ad', D, st, () => { clearInterval(timer); st.path = []; upd(); });
      $('#ad-go').onclick = () => { clearInterval(timer); st.path = [eqSR()]; timer = setInterval(() => { if (A.current !== 'oada') return clearInterval(timer); const e = eqSR(); st.Pe = e.P - st.sup; const n = eqSR(); st.path.push(n); upd(true); if (Math.abs(n.Y - Yn) < .5) clearInterval(timer); }, A.reduce ? 10 : 260); };
      $('#ad-reset').onclick = () => { clearInterval(timer); st.Pe = 1; st.path = []; D.forEach(d => A.setSlider('ad', d[0], d[5], st, d[6])); upd(); };
      upd();
    },
    draw, hide: () => clearInterval(timer)
  });
  function upd() {
    const e = eqSR(), l = eqLR(), gap = (e.Y - Yn) / Yn;
    $('#ad-st').innerHTML = A.stats([['Producto', f2(e.Y)], ['Nivel de precios', fmt(e.P, 3)], ['Brecha de producto', pct(gap, 1)], ['Precios esperados', fmt(st.Pe, 3)]]);
    $('#ad-exp').innerHTML = `<p>${Math.abs(gap) < .002 ? 'La economía está en su producto potencial.' : gap > 0 ? `<b>Boom:</b> el producto está ${pct(gap, 1)} arriba del potencial. Con desempleo bajo los salarios y los precios esperados suben, la OA de corto plazo se corre hacia arriba y el producto vuelve a Yₙ con precios más altos.` : `<b>Recesión:</b> el producto está ${pct(-gap, 1)} abajo del potencial. Con desempleo alto, los precios esperados bajan de a poco y la economía se recupera sola, pero lento. Una política expansiva acelera la vuelta.`}</p>
      <p style="margin-top:6px">${st.sup > 0 ? '<b>Shock de oferta negativo:</b> sube el costo de producir (por ejemplo, la energía). Aparece la <b>estanflación</b>: menos producto y más precios a la vez, y la política de demanda queda entre la espada y la pared.' : ''} En el largo plazo (botón "Ajuste de largo plazo") el producto vuelve a ${f0(Yn)} y el nivel de precios termina en <b>${fmt(l.P, 3)}</b>: el dinero es neutral, solo cambia los precios.</p>`;
    draw();
  }
  function draw() {
    const g = A.ax($('#ad-cv'), [600, 1600], [0, 2.4], { yf: v => fmt(v, 1) }); if (!g) return;
    g.vline(Yn, K.violet, 2); g.text('Yₙ', Yn, 2.3, K.violet);
    g.path(Array.from({ length: 200 }, (_, i) => { const P = .15 + i * .012; return [ad(P), P]; }), K.teal, 2.2);
    g.fn(Y => st.Pe + st.sup + st.al * (Y - Yn), K.amber);
    if (st.path.length > 1) g.path(st.path.map(p => [p.Y, p.P]), K.fg, 1.2, [2, 4]);
    const e = eqSR(); g.guide(e.Y, e.P); g.dot(e.Y, e.P, K.fg, 6);
    g.labels('Producto Y', 'Nivel de precios P');
  }
}

/* ================= Mundell-Fleming ================= */
{
  const st = { reg: 'flex' };
  const P0 = { c: .75, m: .2, C0: 100, I0: 200, d: 20, T: 200, X0: 50, phi: 100, k: .5, h: 40 };
  const D = [['G', 'Gasto público G', 0, 500, 5, 200, 0], ['M', 'Oferta monetaria M', 100, 900, 5, 400, 0], ['rs', 'Tasa internacional r*', 0, 15, .25, 5, 2], ['ebar', 'Tipo de cambio fijado (régimen fijo)', 1, 5, .05, 2.4, 2]];
  let base = null;
  const Ap = p => P0.C0 - P0.c * P0.T + P0.I0 - P0.d * p.rs + p.G + P0.X0;
  const solve = p => {
    const den = 1 - P0.c + P0.m;
    if (st.reg === 'flex') { const Y = (p.M + P0.h * p.rs) / P0.k; return { Y, e: (den * Y - Ap(p)) / P0.phi, M: p.M }; }
    const Y = (Ap(p) + P0.phi * p.ebar) / den; return { Y, e: p.ebar, M: P0.k * Y - P0.h * p.rs };
  };
  A.tool({
    id: 'mundell', mat: 'macro', unit: 3, name: 'Mundell-Fleming', short: 'Mundell-Fleming', tag: 'Economía abierta', f: 'r = r*',
    desc: 'Una economía chica y abierta con libre movilidad de capitales. Por qué la política fiscal y la monetaria funcionan distinto según el régimen cambiario.',
    lead: 'Con capitales que entran y salen libremente, la tasa local queda pegada a la internacional r*. El tipo de cambio e son pesos por dólar: si sube, los productos locales se abaratan y suben las exportaciones netas. Probá cada política en tipo de cambio flexible y fijo.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Régimen cambiario</label>${A.seg('mf-r', [['flex', 'Flexible'], ['fijo', 'Fijo']], 'flex')}</div>${A.sliders('mf', D)}<div class="row"><button class="btn sm" id="mf-base">Fijar como punto inicial</button></div><dl class="stats" id="mf-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="mf-cv" style="height:400px"></canvas>${A.legend([['teal', 'IS*'], ['amber', 'LM*'], ['faint', 'Iniciales']])}<div class="explain" id="mf-exp"></div></div></div>`,
    init() { A.bindSliders('mf', D, st, upd); base = { ...st }; A.segBind('mf-r', v => { st.reg = v; if (v === 'fijo') { A.setSlider('mf', 'ebar', +solve({ ...st, reg: 'flex' }).e.toFixed(2), st); } base = { ...st }; upd(); }); $('#mf-base').onclick = () => { base = { ...st }; upd(); }; upd(); },
    draw
  });
  function upd() {
    const r = solve(st), r0 = solve(base), flex = st.reg === 'flex';
    $('#mf-ebar').closest('div').hidden = flex; $('#mf-M').closest('div').hidden = !flex;
    $('#mf-st').innerHTML = A.stats([['Producto Y', f2(r.Y)], ['Tipo de cambio e', f2(r.e)], [flex ? 'Cambio en e' : 'Dinero necesario M', flex ? (r.e >= r0.e ? '+' : '') + f2(r.e - r0.e) : f2(r.M)], ['Cambio en Y', (r.Y >= r0.Y ? '+' : '') + f2(r.Y - r0.Y)]]);
    const dG = st.G - base.G;
    $('#mf-exp').innerHTML = flex
      ? `<p><b>Tipo de cambio flexible.</b> El producto lo fija el mercado de dinero: Y = (M + h·r*)/k = <b>${f2(r.Y)}</b> (la LM* es vertical). ${dG ? `Subir G ${dG > 0 ? 'presiona la tasa para arriba, entran capitales, el peso se aprecia (e baja) y caen las exportaciones netas justo lo que subió el gasto: <b>la política fiscal no mueve el producto</b>.' : 'baja la tasa, salen capitales, el peso se deprecia y las exportaciones netas compensan la caída del gasto: <b>el producto no cambia</b>.'}` : ''} ${st.M !== base.M ? `Más dinero ${st.M > base.M ? 'empuja la tasa para abajo, salen capitales, el peso se deprecia (e sube) y suben las exportaciones netas: <b>la política monetaria es muy efectiva</b>.' : 'sube la tasa, entran capitales, el peso se aprecia y caen las exportaciones netas: el producto baja.'}` : ''}</p>`
      : `<p><b>Tipo de cambio fijo.</b> El banco central compra o vende dólares para sostener e = ${f2(st.ebar)}, así que la cantidad de dinero se ajusta sola (ahora M = ${f2(r.M)}): <b>pierde la política monetaria</b>. ${dG ? `En cambio, la política fiscal es muy efectiva: como el tipo de cambio no se aprecia, no hay desplazamiento de las exportaciones netas y Y cambia ${f2(r.Y - r0.Y)}.` : ''} ${st.ebar !== base.ebar ? `Una <b>devaluación</b> (subir e) abarata los productos locales y sube el producto.` : ''}</p>`;
    draw();
  }
  function draw() {
    const r = solve(st), r0 = solve(base), g = A.ax($('#mf-cv'), [600, 1900], [0, 6], { yf: v => fmt(v, 1) }); if (!g) return;
    const den = 1 - P0.c + P0.m, isf = p => Y => (den * Y - Ap(p)) / P0.phi;
    g.fn(isf(base), K.faint, 1.4, [5, 5]); g.fn(isf(st), K.teal);
    if (st.reg === 'flex') { const y0 = (base.M + P0.h * base.rs) / P0.k; g.vline(y0, K.faint, 1.4, [5, 5]); g.vline(r.Y, K.amber, 2.2); }
    else { g.hline(st.ebar, K.amber, 2); g.text('tipo de cambio fijo', 1880, st.ebar, K.amber, 'right'); }
    g.dot(r0.Y, r0.e, K.faint, 4); g.guide(r.Y, r.e); g.dot(r.Y, r.e, K.fg, 6);
    g.labels('Producto Y', 'Tipo de cambio e ($/US$)');
  }
}

/* ================= Curva de Phillips ================= */
{
  const st = { exp: 'adapt' };
  const D = [['un', 'Desempleo natural uₙ (%)', 3, 12, .1, 7, 1], ['b', 'Pendiente β', .1, 1.5, .05, .5, 2], ['ut', 'Desempleo que busca el gobierno (%)', 2, 12, .1, 5, 1], ['pi0', 'Inflación inicial y meta (%)', 0, 10, .5, 3, 1]];
  const sim = () => { const out = []; let pe = st.pi0; for (let t = 0; t < 12; t++) { const pi = pe - st.b * (st.ut - st.un); out.push({ t, u: st.ut, pi, pe }); if (st.exp === 'adapt') pe = pi; } return out; };
  A.tool({
    id: 'phillips', mat: 'macro', unit: 4, name: 'Curva de Phillips y expectativas', short: 'Phillips', tag: 'Inflación y desempleo', f: 'π = πᵉ − β(u − uₙ)',
    desc: 'El dilema entre inflación y desempleo en el corto plazo, y por qué desaparece en el largo plazo cuando las expectativas se ajustan.',
    lead: 'En el corto plazo, bajar el desempleo por debajo de su nivel natural cuesta inflación. Pero si la gente forma sus expectativas mirando la inflación pasada, cada año la curva sube y hace falta cada vez más inflación para lo mismo.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Expectativas</label>${A.seg('ph-e', [['adapt', 'Adaptativas (miran el pasado)'], ['anch', 'Ancladas en la meta']], 'adapt')}</div>${A.sliders('ph', D)}<dl class="stats" id="ph-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Curvas de Phillips año a año</h3><canvas id="ph-cv" style="height:320px"></canvas></div><div><h3>Inflación en el tiempo</h3><canvas id="ph-ts" style="height:320px"></canvas></div></div>
      ${A.legend([['amber', 'Curva de corto plazo de cada año'], ['violet', 'Largo plazo (vertical en uₙ)']])}<div class="explain" id="ph-exp"></div></div></div>`,
    init() { A.bindSliders('ph', D, st, upd); A.segBind('ph-e', v => { st.exp = v; upd(); }); upd(); },
    draw
  });
  function upd() {
    const s = sim(), last = s[s.length - 1], adj = st.b * (st.un - st.ut);
    $('#ph-st').innerHTML = A.stats([['Inflación año 1', f2(s[0].pi) + '%'], ['Inflación año 12', f2(last.pi) + '%'], ['Suba por año', st.exp === 'adapt' ? f2(adj) + ' pp' : '0 pp']]);
    $('#ph-exp').innerHTML = st.ut < st.un ? `<p>El gobierno mantiene el desempleo en ${f2(st.ut)}%, ${f2(st.un - st.ut)} puntos debajo del natural. Cada año la inflación sale de π = πᵉ + ${f2(st.b)} × ${f2(st.un - st.ut)} = πᵉ + ${f2(adj)}. ${st.exp === 'adapt' ? `Con expectativas adaptativas, el año siguiente la gente espera esa inflación y la curva entera sube: <b>la inflación se acelera ${f2(adj)} puntos por año</b>. En el largo plazo no hay dilema: la curva es vertical en uₙ. Es la crítica de Friedman y Phelps.` : 'Si las expectativas quedan ancladas en la meta (un banco central muy creíble), la inflación sube una vez y se queda ahí. Por eso la credibilidad vale tanto.'}</p>`
      : st.ut > st.un ? `<p>Con el desempleo por encima del natural, la inflación ${st.exp === 'adapt' ? 'baja cada año: es el costo de una <b>desinflación</b>.' : 'baja un poco y se queda.'}</p>` : `<p>Con el desempleo en su nivel natural, la inflación se mantiene estable.</p>`;
    draw();
  }
  function draw() {
    const s = sim(), pis = s.map(x => x.pi), ymax = Math.max(12, ...pis) * 1.08, ymin = Math.min(0, ...pis) - 1;
    const g = A.ax($('#ph-cv'), [0, 14], [ymin, ymax], { yf: v => fmt(v, 0) + '%', xf: v => fmt(v, 0) + '%', l: 40 });
    if (g) {
      g.vline(st.un, K.violet, 2);
      s.forEach((x, i) => g.fn(u => x.pe - st.b * (u - st.un), i === 0 ? K.amber : `rgba(242,169,59,${Math.max(.15, .6 - i * .05)})`, i === 0 ? 2.2 : 1.2));
      g.path(s.map(x => [x.u, x.pi]), K.fg, 1, [2, 3]); s.forEach((x, i) => g.dot(x.u, x.pi, i === s.length - 1 ? K.rose : K.fg, i === s.length - 1 ? 6 : 3.5));
      g.labels('Desempleo u', 'Inflación π');
    }
    const t = A.ax($('#ph-ts'), [0, 11], [ymin, ymax], { yf: v => fmt(v, 0) + '%', xf: v => 'año ' + fmt(v + 1, 0), xt: 4, l: 40 });
    if (t) { t.path(s.map(x => [x.t, x.pi]), K.rose, 2.2); s.forEach(x => t.dot(x.t, x.pi, K.rose, 3.5)); t.hline(st.pi0, K.faint, 1, [3, 4]); }
  }
}

/* ================= Regla de Taylor ================= */
{
  const st = {};
  const C = [['rn', 'Tasa real neutral r* (%)', 0, 5, .25, 2, 2], ['pi', 'Inflación actual (%)', -2, 15, .25, 5, 2], ['pis', 'Meta de inflación (%)', 0, 5, .25, 2, 2], ['gap', 'Brecha de producto (%)', -6, 6, .25, 1, 2], ['phi', 'Respuesta a la inflación φπ', 0, 3, .05, 1.5, 2], ['phy', 'Respuesta a la brecha φy', 0, 1.5, .05, .5, 2]];
  const sim = () => { const k = .3, s = 1, out = []; let x = 4; for (let t = 0; t < 24; t++) { const y = -s * (st.phi - 1) * x / (1 + s * st.phy), pi = st.pis + x, i = st.rn + st.pis + st.phi * x + st.phy * y; out.push({ t, pi, i, y }); x = x + k * y; if (Math.abs(x) > 60) break; } return out; };
  A.tool({
    id: 'taylor-regla', mat: 'macro', unit: 4, name: 'Regla de Taylor', short: 'Regla de Taylor', tag: 'Política monetaria', f: 'i = r* + π* + φπ(π − π*) + φy·brecha',
    desc: 'Qué tasa debería fijar un banco central según la inflación y la brecha de producto, y por qué tiene que mover la tasa más que la inflación.',
    lead: 'John Taylor propuso una receta para la tasa de interés: subirla cuando la inflación supera la meta o la economía está recalentada, y bajarla en el caso contrario. El principio clave: ante un punto más de inflación, la tasa tiene que subir más de un punto.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('tr', C)}</div>
      <div class="stage"><div class="row" style="justify-content:space-between;align-items:baseline"><div class="big sm" id="tr-i"></div><span class="mono muted">tasa nominal recomendada</span></div><div class="formula" id="tr-f"></div>
      <h3>¿Qué pasa después de un shock de +4 puntos de inflación?</h3><canvas id="tr-cv" style="height:300px"></canvas>${A.legend([['rose', 'Inflación'], ['amber', 'Tasa de interés'], ['faint', 'Meta']])}<div class="explain" id="tr-exp"></div></div></div>`,
    init() { A.bindSliders('tr', C, st, upd); upd(); },
    draw
  });
  function upd() {
    const i = st.rn + st.pis + st.phi * (st.pi - st.pis) + st.phy * st.gap;
    $('#tr-i').textContent = f2(i) + '%';
    $('#tr-f').innerHTML = `i = ${f2(st.rn)} + ${f2(st.pis)} + ${f2(st.phi)} × (${f2(st.pi)} − ${f2(st.pis)}) + ${f2(st.phy)} × ${f2(st.gap)}<br>= <b style="color:var(--amber)">${f2(i)}%</b> &nbsp; → tasa real = ${f2(i)} − ${f2(st.pi)} = <b>${f2(i - st.pi)}%</b>`;
    $('#tr-exp').innerHTML = st.phi > 1 ? `<p>Con φπ = ${f2(st.phi)} &gt; 1 se cumple el <b>principio de Taylor</b>: cuando sube la inflación, la tasa sube más, la tasa <b>real</b> sube, se enfría la demanda y la inflación vuelve a la meta.</p>` : `<p>Con φπ = ${f2(st.phi)} ≤ 1 la tasa sube menos que la inflación: la tasa real <b>baja</b>, eso estimula la demanda y la inflación sigue subiendo. Es un espiral. Fue un diagnóstico común de la inflación de los años 70 en Estados Unidos.</p>`;
    draw();
  }
  function draw() {
    const s = sim(), vals = s.flatMap(x => [x.pi, x.i]), lo = Math.min(0, ...vals) - 1, hi = Math.min(60, Math.max(...vals)) + 2;
    const g = A.ax($('#tr-cv'), [0, 23], [lo, hi], { yf: v => fmt(v, 0) + '%', xf: v => 't' + fmt(v, 0) }); if (!g) return;
    g.hline(st.pis, K.faint, 1, [3, 4]); g.path(s.map(x => [x.t, x.pi]), K.rose, 2.2); g.path(s.map(x => [x.t, x.i]), K.amber, 2.2);
  }
}

/* ================= Modelo de Solow ================= */
{
  const st = {};
  const D = [['s', 'Tasa de ahorro s', .02, .6, .01, .2, 2], ['n', 'Crecimiento de la población n', 0, .05, .001, .01, 3], ['dl', 'Depreciación δ', .01, .15, .005, .05, 3], ['al', 'Participación del capital α', .2, .6, .01, .33, 2], ['s2', 'Nueva tasa de ahorro (simulación)', .02, .6, .01, .3, 2]];
  const ss = s => { const k = Math.pow(s / (st.n + st.dl), 1 / (1 - st.al)), y = Math.pow(k, st.al); return { k, y, c: (1 - s) * y }; };
  A.tool({
    id: 'solow', mat: 'macro', unit: 5, name: 'Modelo de crecimiento de Solow', short: 'Solow', tag: 'Crecimiento de largo plazo', f: 'Δk = s·f(k) − (n + δ)·k',
    desc: 'Ahorro, inversión, depreciación y estado estacionario. Regla de oro y qué pasa cuando un país ahorra más.',
    lead: 'Con producción por trabajador y = k^α, cada año se invierte s·y y se pierde (n + δ)·k por depreciación y por los nuevos trabajadores que hay que equipar. El capital crece hasta que las dos cosas se igualan: el estado estacionario.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('so', D)}<dl class="stats" id="so-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Estado estacionario</h3><canvas id="so-cv" style="height:300px"></canvas></div><div><h3>Transición si s pasa a la nueva tasa</h3><canvas id="so-tr" style="height:300px"></canvas></div></div>
      ${A.legend([['fg', 'Producción f(k)'], ['amber', 'Inversión s·f(k)'], ['rose', 'Depreciación efectiva (n + δ)·k'], ['teal', 'Consumo por trabajador']])}<div class="steplist" id="so-steps"></div></div></div>`,
    init() { A.bindSliders('so', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const a = ss(st.s), b = ss(st.s2), g = ss(st.al);
    $('#so-st').innerHTML = A.stats([['k*', f2(a.k)], ['y*', f2(a.y)], ['c*', f2(a.c)], ['Ahorro de regla de oro', pct(st.al, 0)]]);
    $('#so-steps').innerHTML = A.steps([
      `Estado estacionario: s·k^α = (n + δ)·k → k^(1−α) = s/(n + δ) → k* = (${f2(st.s)}/${fmt(st.n + st.dl, 3)})^(1/${f2(1 - st.al)}) = <b>${f2(a.k)}</b>.`,
      `Producto y* = k*^α = <b>${f2(a.y)}</b>; consumo c* = (1 − s)·y* = <b>${f2(a.c)}</b>.`,
      `Si el ahorro pasa a ${pct(st.s2, 0)}, el nuevo estado estacionario tiene k* = ${f2(b.k)} y y* = ${f2(b.y)}. El crecimiento es <b>transitorio</b>: en el estado estacionario el producto por trabajador deja de crecer. Para crecer siempre hace falta progreso tecnológico.`,
      `La <b>regla de oro</b> (el ahorro que maximiza el consumo de largo plazo) es s = α = ${pct(st.al, 0)}, con c = ${f2(g.c)}. ${st.s < st.al ? 'Acá se ahorra menos que eso: ahorrar más subiría el consumo futuro, a costa del consumo de hoy.' : st.s > st.al ? 'Acá se ahorra de más: consumir más hoy también subiría el consumo de largo plazo.' : ''}`]);
    draw();
  }
  function draw() {
    const a = ss(st.s), b = ss(st.s2), km = Math.max(a.k, b.k) * 1.6, f = k => Math.pow(k, st.al);
    const g = A.ax($('#so-cv'), [0, km], [0, f(km) * 1.1], { l: 40 });
    if (g) { g.fn(f, K.fg, 1.8); g.fn(k => st.s * f(k), K.amber); g.fn(k => (st.n + st.dl) * k, K.rose); g.guide(a.k, st.s * f(a.k)); g.dot(a.k, st.s * f(a.k), K.amber, 5.5); g.text('k*', a.k, st.s * f(a.k), K.amber); g.labels('k', 'y'); }
    const T = 120, ys = [], cs = []; let k = a.k;
    for (let t = 0; t < T; t++) { const s = t < 10 ? st.s : st.s2, y = f(k); ys.push([t, y]); cs.push([t, (1 - s) * y]); k = k + s * y - (st.n + st.dl) * k; }
    const vals = [...ys, ...cs].map(p => p[1]), t = A.ax($('#so-tr'), [0, T - 1], [Math.min(...vals) * .9, Math.max(...vals) * 1.05], { l: 40, xf: v => 'año ' + fmt(v, 0), xt: 4 });
    if (t) { t.vline(10, K.faint, 1, [3, 4]); t.path(ys, K.fg, 2); t.path(cs, K.teal, 2); }
  }
}
})();
