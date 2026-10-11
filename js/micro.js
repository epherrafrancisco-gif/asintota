/* Asíntota · Microeconomía */
(() => {
const { $, $$, K, fmt, pct } = A;
const f2 = x => fmt(x, 2);

/* ================= Oferta y demanda ================= */
{
  const st = {};
  const D = [['a', 'Demanda: ordenada a', 40, 200, 1, 120, 0], ['b', 'Demanda: pendiente b', .5, 5, .1, 2, 1], ['c', 'Oferta: ordenada c', -80, 60, 1, -20, 0], ['d', 'Oferta: pendiente d', .5, 5, .1, 2, 1]];
  const SH = [['da', 'Desplazamiento de la demanda', -60, 60, 1, 0, 0], ['dc', 'Desplazamiento de la oferta', -60, 60, 1, 0, 0]];
  const eq = (a, b, c, d) => { const P = (a - c) / (b + d); return { P, Q: a - b * P }; };
  const PRE = [['Sube el ingreso (bien normal)', 25, 0], ['Baja el precio de un sustituto', -20, 0], ['Mejora tecnológica', 0, 25], ['Sube el costo de un insumo', 0, -25], ['Sube el ingreso y mejora la tecnología', 25, 25], ['Sin cambios', 0, 0]];
  A.tool({
    id: 'mercado', mat: 'micro', unit: 1, name: 'Oferta, demanda y equilibrio', short: 'Oferta y demanda', tag: 'Equilibrio de mercado', f: 'Qd = Qs  →  P* = (a − c)/(b + d)',
    desc: 'Armá un mercado con oferta y demanda lineales, aplicá shocks y mirá cómo se mueven el precio y la cantidad.',
    lead: 'La demanda es Qd = a − b·P y la oferta Qs = c + d·P. El equilibrio está donde se cruzan. Aplicá un shock y compará el equilibrio nuevo con el original.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mk', D)}
      <div><label class="l">Shocks</label><div class="chips">${PRE.map((p, i) => `<button class="chip" data-mk="${i}">${p[0]}</button>`).join('')}</div></div>
      ${A.sliders('mk', SH)}</div>
      <div class="stage"><canvas id="mk-cv" style="height:400px"></canvas>${A.legend([['teal', 'Demanda'], ['amber', 'Oferta'], ['faint', 'Curvas originales']])}
      <dl class="stats" id="mk-st" style="margin:0"></dl><div class="steplist" id="mk-steps"></div></div></div>`,
    init() { A.bindSliders('mk', [...D, ...SH], st, upd); $$('[data-mk]').forEach(b => b.onclick = () => { const p = PRE[+b.dataset.mk]; A.setSlider('mk', 'da', p[1], st, 0); A.setSlider('mk', 'dc', p[2], st, 0); upd(); }); upd(); },
    draw
  });
  function upd() {
    const o = eq(st.a, st.b, st.c, st.d), n = eq(st.a + st.da, st.b, st.c + st.dc, st.d), sh = st.da || st.dc;
    $('#mk-st').innerHTML = A.stats([['Precio de equilibrio', '$' + f2(n.P)], ['Cantidad', f2(n.Q)], ...(sh ? [['Cambio en P', (n.P >= o.P ? '+' : '') + f2(n.P - o.P)], ['Cambio en Q', (n.Q >= o.Q ? '+' : '') + f2(n.Q - o.Q)]] : [])]);
    const a = st.a + st.da, c = st.c + st.dc;
    $('#mk-steps').innerHTML = A.steps([
      `Igualo demanda y oferta: ${f2(a)} − ${f2(st.b)}·P = ${f2(c)} + ${f2(st.d)}·P.`,
      `Paso los P a un lado: ${f2(a)} − (${f2(c)}) = (${f2(st.b)} + ${f2(st.d)})·P → ${f2(a - c)} = ${f2(st.b + st.d)}·P.`,
      `Despejo: <b>P* = ${f2(a - c)} / ${f2(st.b + st.d)} = ${f2(n.P)}</b>.`,
      `Reemplazo en la demanda: Q* = ${f2(a)} − ${f2(st.b)} × ${f2(n.P)} = <b>${f2(n.Q)}</b>.`
    ]) + (sh ? `<div class="explain"><p>${st.da > 0 ? 'La demanda se corrió a la derecha' : st.da < 0 ? 'La demanda se corrió a la izquierda' : 'La demanda no cambió'}${st.dc > 0 ? ' y la oferta se corrió a la derecha' : st.dc < 0 ? ' y la oferta se corrió a la izquierda' : ''}. Resultado: el precio ${n.P > o.P + 1e-9 ? 'sube' : n.P < o.P - 1e-9 ? 'baja' : 'no cambia'} y la cantidad ${n.Q > o.Q + 1e-9 ? 'sube' : n.Q < o.Q - 1e-9 ? 'baja' : 'no cambia'}. ${st.da && st.dc && Math.sign(st.da) === Math.sign(st.dc) ? 'Cuando las dos curvas se mueven para el mismo lado, lo que pasa con el precio depende de cuál se movió más.' : ''}</p></div>` : '') +
      (n.Q <= 0 ? '<p class="err">Con estos parámetros la cantidad de equilibrio no es positiva: no hay mercado.</p>' : '');
    draw();
  }
  function draw() {
    const qmax = Math.max(st.a + Math.max(0, st.da), 40) * 1.05, pmax = (st.a + Math.max(0, st.da)) / st.b * 1.05;
    const g = A.ax($('#mk-cv'), [0, qmax], [0, pmax]); if (!g) return;
    const inv = (a, b) => q => (a - q) / b, sup = (c, d) => q => (q - c) / d;
    if (st.da || st.dc) { g.fn(inv(st.a, st.b), K.faint, 1.5, [5, 5]); g.fn(sup(st.c, st.d), K.faint, 1.5, [5, 5]); const o = eq(st.a, st.b, st.c, st.d); g.dot(o.Q, o.P, K.faint, 4); }
    g.fn(inv(st.a + st.da, st.b), K.teal); g.fn(sup(st.c + st.dc, st.d), K.amber);
    const n = eq(st.a + st.da, st.b, st.c + st.dc, st.d);
    if (n.Q > 0) { g.guide(n.Q, n.P); g.dot(n.Q, n.P, K.fg, 6); g.text(`E (${f2(n.Q)}; $${f2(n.P)})`, n.Q, n.P, K.fg); }
    g.labels('Cantidad Q', 'Precio P');
  }
}

/* ================= Elasticidad ================= */
{
  const st = {};
  const D = [['a', 'Demanda: ordenada a', 20, 200, 1, 100, 0], ['b', 'Demanda: pendiente b', .2, 5, .1, 2, 1], ['p', 'Precio', 0, 100, .5, 15, 1]];
  A.tool({
    id: 'elasticidad', mat: 'micro', unit: 1, name: 'Elasticidad precio de la demanda', short: 'Elasticidad', tag: 'Sensibilidad al precio', f: 'ε = (ΔQ/Q) / (ΔP/P)',
    desc: 'Movete por la curva de demanda y mirá cómo cambia la elasticidad y qué pasa con el ingreso total.',
    lead: 'La elasticidad mide cuánto reacciona la cantidad demandada cuando cambia el precio. En una demanda lineal va cambiando a lo largo de la curva: arriba es elástica y abajo, inelástica.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('el', D)}<dl class="stats" id="el-st" style="margin:0"></dl><div id="el-pill"></div></div>
      <div class="stage"><canvas id="el-cv" style="height:300px"></canvas><canvas id="el-it" style="height:200px"></canvas>${A.legend([['teal', 'Demanda'], ['amber', 'Ingreso total P·Q']])}<div class="steplist" id="el-steps"></div></div></div>
    <div class="grp-h" style="margin-top:30px"><h2>Calculadora de elasticidad arco</h2></div>
    <div class="bench"><div class="ctrl"><p class="note">Cargá dos puntos observados (precio y cantidad antes y después). Se usa el método del punto medio, así da lo mismo si subís o bajás el precio.</p>
      <div class="grid2"><div><label class="l" for="ea-p1">Precio 1</label><input class="field" id="ea-p1" value="100"></div><div><label class="l" for="ea-q1">Cantidad 1</label><input class="field" id="ea-q1" value="500"></div><div><label class="l" for="ea-p2">Precio 2</label><input class="field" id="ea-p2" value="120"></div><div><label class="l" for="ea-q2">Cantidad 2</label><input class="field" id="ea-q2" value="420"></div></div></div>
      <div class="stage"><div class="steplist" id="ea-out"></div></div></div>`,
    init() {
      A.bindSliders('el', D, st, k => { if (k !== 'p') clampP(); upd(); }); clampP(); upd();
      ['p1', 'q1', 'p2', 'q2'].forEach(k => $('#ea-' + k).oninput = arc); arc();
    },
    draw
  });
  function clampP() { const mx = st.a / st.b; const el = $('#el-p'); el.max = mx.toFixed(1); if (st.p > mx) A.setSlider('el', 'p', +(mx / 2).toFixed(1), st, 1); }
  const cls = e => { const a = Math.abs(e); return a > 1.0001 ? ['Elástica', 'warn', 'la cantidad reacciona más que proporcionalmente: si subís el precio, el ingreso total <b>baja</b>'] : a < .9999 ? ['Inelástica', 'ok', 'la cantidad reacciona menos que proporcionalmente: si subís el precio, el ingreso total <b>sube</b>'] : ['Unitaria', 'bad', 'el ingreso total está en su máximo']; };
  function upd() {
    const Q = st.a - st.b * st.p, e = Q > 0 ? -st.b * st.p / Q : -Infinity, [n, k, t] = cls(e);
    $('#el-st').innerHTML = A.stats([['Cantidad', f2(Q)], ['Elasticidad', Number.isFinite(e) ? f2(e) : '−∞'], ['Ingreso total', '$' + f2(st.p * Q)]]);
    $('#el-pill').innerHTML = `<span class="pill ${k}">Demanda ${n.toLowerCase()} en este punto</span>`;
    $('#el-steps').innerHTML = A.steps([
      `En una demanda lineal Q = a − b·P, la derivada dQ/dP = −b = −${f2(st.b)}.`,
      `Elasticidad puntual: ε = (dQ/dP)·(P/Q) = −${f2(st.b)} × ${f2(st.p)} / ${f2(Q)} = <b>${Number.isFinite(e) ? f2(e) : '−∞'}</b>.`,
      `Si el precio sube 1%, la cantidad cambia ${Number.isFinite(e) ? f2(e) : '−∞'}%. Como |ε| ${Math.abs(e) > 1 ? '> 1' : Math.abs(e) < 1 ? '< 1' : '= 1'}, ${t}.`,
      `El ingreso total es máximo donde |ε| = 1, que en una lineal es la mitad de la curva: P = a/(2b) = <b>$${f2(st.a / (2 * st.b))}</b>.`]);
    draw();
  }
  function draw() {
    const pm = st.a / st.b, Q = st.a - st.b * st.p;
    const g = A.ax($('#el-cv'), [0, st.a * 1.05], [0, pm * 1.05]); if (!g) return;
    g.clip(() => { g.c.fillStyle = 'rgba(242,169,59,.06)'; g.c.fillRect(g.F.L, g.F.Y(pm), g.F.pw, g.F.Y(pm / 2) - g.F.Y(pm)); });
    g.fn(q => (st.a - q) / st.b, K.teal);
    g.text('elástica |ε| > 1', st.a * .05, pm * .78, K.faint, 'left', 'middle', 0, 0); g.text('inelástica |ε| < 1', st.a * .6, pm * .2, K.faint, 'left', 'middle', 0, 0);
    g.dot(st.a / 2, pm / 2, K.faint, 3.5); g.text('|ε| = 1', st.a / 2, pm / 2, K.faint);
    g.poly([[0, 0], [Q, 0], [Q, st.p], [0, st.p]], 'rgba(242,169,59,.16)');
    g.guide(Q, st.p); g.dot(Q, st.p, K.amber, 6); g.labels('Cantidad Q', 'Precio P');
    const it = A.ax($('#el-it'), [0, pm], [0, st.a * st.a / (4 * st.b) * 1.15], { yf: v => '$' + fmt(v, 0) }); if (!it) return;
    it.fn(p => p * (st.a - st.b * p), K.amber); it.dot(st.p, st.p * Q, K.amber, 6); it.vline(pm / 2, K.faint, 1, [3, 4]); it.labels('Precio P', 'Ingreso total');
  }
  function arc() {
    const [p1, q1, p2, q2] = ['p1', 'q1', 'p2', 'q2'].map(k => A.num($('#ea-' + k).value));
    if (![p1, q1, p2, q2].every(Number.isFinite) || p1 === p2) { $('#ea-out').innerHTML = '<p class="err">Cargá dos precios distintos y sus cantidades.</p>'; return; }
    const dq = (q2 - q1) / ((q1 + q2) / 2), dp = (p2 - p1) / ((p1 + p2) / 2), e = dq / dp, [n] = cls(e);
    $('#ea-out').innerHTML = A.steps([
      `Variación porcentual de la cantidad (punto medio): (${f2(q2)} − ${f2(q1)}) / ${f2((q1 + q2) / 2)} = <b>${pct(dq, 2)}</b>.`,
      `Variación porcentual del precio: (${f2(p2)} − ${f2(p1)}) / ${f2((p1 + p2) / 2)} = <b>${pct(dp, 2)}</b>.`,
      `Elasticidad arco: ${pct(dq, 2)} / ${pct(dp, 2)} = <b>${f2(e)}</b> → demanda <b>${n.toLowerCase()}</b>.`,
      `Ingreso total: $${f2(p1 * q1)} → $${f2(p2 * q2)} (${p2 * q2 > p1 * q1 ? 'sube' : p2 * q2 < p1 * q1 ? 'baja' : 'igual'}).`]);
  }
}

/* ================= Intervención: impuestos, subsidios y controles ================= */
{
  const st = { pol: 'tax' }, M = { a: 120, b: 2, c: -20, d: 2 };
  const D = [['t', 'Impuesto por unidad', 0, 40, .5, 10, 1], ['s', 'Subsidio por unidad', 0, 40, .5, 10, 1], ['pmax', 'Precio máximo', 5, 60, .5, 25, 1], ['pmin', 'Precio mínimo', 10, 60, .5, 45, 1]];
  const Qd = p => M.a - M.b * p, Qs = p => M.c + M.d * p, Pd = q => (M.a - q) / M.b, Ps = q => (q - M.c) / M.d;
  const CSf = (Q, P) => (M.a * Q - Q * Q / 2) / M.b - P * Q, PSf = (Q, P) => P * Q - (Q * Q / 2 - M.c * Q) / M.d;
  const base = () => { const P = (M.a - M.c) / (M.b + M.d), Q = Qd(P); return { P, Q, CS: CSf(Q, P), PS: PSf(Q, P) }; };
  function solve() {
    const e = base(), TS = e.CS + e.PS;
    if (st.pol === 'tax') { const Pc = (M.a - M.c + M.d * st.t) / (M.b + M.d), Q = Qd(Pc), Pv = Pc - st.t, CS = CSf(Q, Pc), PS = PSf(Q, Pv), G = st.t * Q; return { e, Q, Pc, Pv, CS, PS, G, DWL: TS - CS - PS - G }; }
    if (st.pol === 'sub') { const Pc = (M.a - M.c - M.d * st.s) / (M.b + M.d), Q = Qd(Pc), Pv = Pc + st.s, CS = CSf(Q, Pc), PS = PSf(Q, Pv), G = -st.s * Q; return { e, Q, Pc, Pv, CS, PS, G, DWL: TS - CS - PS - G }; }
    if (st.pol === 'max') { const P = Math.min(st.pmax, e.P), Q = Math.min(Qs(P), Qd(P)), CS = (M.a * Q - Q * Q / 2) / M.b - P * Q, PS = PSf(Q, P); return { e, Q, Pc: P, Pv: P, CS, PS, G: 0, DWL: TS - CS - PS, gap: Qd(P) - Qs(P), bind: st.pmax < e.P }; }
    const P = Math.max(st.pmin, e.P), Q = Math.min(Qd(P), Qs(P)), CS = CSf(Q, P), PS = PSf(Q, P); return { e, Q, Pc: P, Pv: P, CS, PS, G: 0, DWL: TS - CS - PS, gap: Qs(P) - Qd(P), bind: st.pmin > e.P };
  }
  A.tool({
    id: 'intervencion', mat: 'micro', unit: 1, name: 'Impuestos, subsidios y controles de precios', short: 'Intervención', tag: 'Excedentes y eficiencia', f: 'PIE = ½ · t · ΔQ',
    desc: 'Aplicá un impuesto, un subsidio o un precio máximo o mínimo y medí quién gana, quién pierde y cuánto se desperdicia.',
    lead: 'Mercado de ejemplo: demanda Q = 120 − 2P y oferta Q = −20 + 2P (equilibrio en P = 35, Q = 50). Elegí una política y mirá cómo se reparten los excedentes y cuánto se pierde por ineficiencia.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Política</label>${A.seg('iv-pol', [['tax', 'Impuesto'], ['sub', 'Subsidio'], ['max', 'Precio máximo'], ['min', 'Precio mínimo']], 'tax')}</div>
      <div id="iv-sl">${A.sliders('iv', D)}</div><dl class="stats" id="iv-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="iv-cv" style="height:420px"></canvas>${A.legend([['teal', 'Excedente del consumidor'], ['violet', 'Excedente del productor'], ['amber', 'Recaudación o gasto fiscal'], ['rose', 'Pérdida irrecuperable']])}<div class="steplist" id="iv-steps"></div></div></div>`,
    init() { A.bindSliders('iv', D, st, upd); A.segBind('iv-pol', v => { st.pol = v; upd(); }); upd(); },
    draw
  });
  function upd() {
    const keys = { tax: 't', sub: 's', max: 'pmax', min: 'pmin' };
    $$('#iv-sl > div').forEach((d, i) => d.hidden = D[i][0] !== keys[st.pol]);
    const r = solve(), e = r.e;
    $('#iv-st').innerHTML = A.stats([['Cantidad', `${f2(r.Q)} (antes ${f2(e.Q)})`], ['Precio que paga el consumidor', '$' + f2(r.Pc)], ['Precio que recibe el productor', '$' + f2(r.Pv)], ['Exc. consumidor', `${f2(r.CS)} (${f2(r.CS - e.CS)})`], ['Exc. productor', `${f2(r.PS)} (${f2(r.PS - e.PS)})`], [st.pol === 'sub' ? 'Gasto fiscal' : 'Recaudación', f2(Math.abs(r.G))], ['Pérdida irrecuperable', f2(r.DWL)]]);
    let s;
    if (st.pol === 'tax') {
      const sh = (r.Pc - e.P) / st.t;
      s = [`Con un impuesto t a los vendedores, el consumidor paga Pc y el productor recibe Pv = Pc − t. Igualo: 120 − 2·Pc = −20 + 2·(Pc − ${f2(st.t)}).`,
        `Despejo: Pc = (140 + 2 × ${f2(st.t)}) / 4 = <b>$${f2(r.Pc)}</b>; Pv = <b>$${f2(r.Pv)}</b>; Q = <b>${f2(r.Q)}</b>.`,
        `Recaudación = t × Q = ${f2(st.t)} × ${f2(r.Q)} = <b>${f2(r.G)}</b>.`,
        `Incidencia: los consumidores pagan ${pct(sh, 0)} del impuesto y los productores ${pct(1 - sh, 0)}. Paga más el lado más inelástico (acá las pendientes son iguales, así que se reparte mitad y mitad).`,
        `Pérdida irrecuperable = ½ × t × ΔQ = ½ × ${f2(st.t)} × ${f2(e.Q - r.Q)} = <b>${f2(r.DWL)}</b>: transacciones que convenían a las dos partes y dejaron de hacerse.`];
    } else if (st.pol === 'sub') {
      s = [`Con un subsidio s, el productor recibe Pv = Pc + s. Igualo: 120 − 2·Pc = −20 + 2·(Pc + ${f2(st.s)}).`,
        `Pc = <b>$${f2(r.Pc)}</b>, Pv = <b>$${f2(r.Pv)}</b>, Q = <b>${f2(r.Q)}</b>.`,
        `Gasto fiscal = s × Q = <b>${f2(-r.G)}</b>. Los excedentes suben, pero menos que lo que gasta el Estado.`,
        `Pérdida irrecuperable = ½ × s × ΔQ = <b>${f2(r.DWL)}</b>: se producen unidades que valen menos de lo que cuestan.`];
    } else {
      const mx = st.pol === 'max', p = mx ? st.pmax : st.pmin;
      s = !r.bind ? [`El precio ${mx ? 'máximo' : 'mínimo'} de $${f2(p)} está ${mx ? 'por encima' : 'por debajo'} del equilibrio ($${f2(e.P)}): <b>no tiene efecto</b>. Movelo para que quede ${mx ? 'abajo' : 'arriba'} del equilibrio.`]
        : [`A $${f2(p)} se demandan ${f2(Qd(p))} y se ofrecen ${f2(Qs(p))}.`,
          `Se intercambia lo menor: <b>${f2(r.Q)}</b>. ${mx ? `Hay <b>escasez</b> de ${f2(r.gap)} unidades: aparecen colas y mercados negros.` : `Hay <b>exceso de oferta</b> de ${f2(r.gap)} unidades (por ejemplo, desempleo con un salario mínimo).`}`,
          `Pérdida irrecuperable: <b>${f2(r.DWL)}</b>. ${mx ? 'Los consumidores que consiguen el bien ganan, pero los productores pierden más.' : 'Los productores que venden ganan, pero los consumidores pierden más.'}`];
    }
    $('#iv-steps').innerHTML = A.steps(s);
    draw();
  }
  function draw() {
    const g = A.ax($('#iv-cv'), [0, 125], [0, 64]); if (!g) return;
    const r = solve(), e = r.e;
    g.area(Pd, () => r.Pc, 0, r.Q, 'rgba(67,200,184,.22)');
    g.area(() => r.Pv, q => Math.max(0, Ps(q)), 0, r.Q, 'rgba(166,156,246,.22)');
    if (st.pol === 'tax' || st.pol === 'sub') g.poly([[0, r.Pc], [r.Q, r.Pc], [r.Q, r.Pv], [0, r.Pv]], 'rgba(242,169,59,.25)');
    if (r.DWL > 1e-6) { const lo = Math.min(r.Q, e.Q), hi = Math.max(r.Q, e.Q); g.area(q => Math.max(Pd(q), Ps(q)), q => Math.min(Pd(q), Ps(q)), lo, hi, 'rgba(239,115,145,.38)'); }
    g.fn(Pd, K.teal); g.fn(Ps, K.amber);
    if (st.pol === 'tax') g.fn(q => Ps(q) + st.t, K.amber, 1.4, [6, 5]);
    if (st.pol === 'sub') g.fn(q => Ps(q) - st.s, K.amber, 1.4, [6, 5]);
    if (st.pol === 'max' || st.pol === 'min') { const p = st.pol === 'max' ? st.pmax : st.pmin; g.hline(p, K.rose, 1.6); g.text(st.pol === 'max' ? 'precio máximo' : 'precio mínimo', 120, p, K.rose, 'right'); }
    g.dot(e.Q, e.P, K.faint, 4); g.guide(r.Q, r.Pc); g.dot(r.Q, r.Pc, K.fg, 5); if (r.Pv !== r.Pc) g.dot(r.Q, r.Pv, K.fg, 5);
    g.labels('Cantidad Q', 'Precio P');
  }
}

/* ================= Teoría del consumidor ================= */
{
  const st = { u: 'cd' };
  const D = [['M', 'Ingreso M', 20, 300, 1, 120, 0], ['px', 'Precio de x', .5, 20, .5, 4, 1], ['py', 'Precio de y', .5, 20, .5, 3, 1], ['al', 'Preferencia α (peso de x)', .05, .95, .01, .5, 2], ['px2', 'Nuevo precio de x (para Slutsky)', .5, 20, .5, 6, 1]];
  const U = {
    cd: { lab: 'Cobb-Douglas', f: 'U = x^α · y^(1−α)', u: (x, y) => Math.pow(x, st.al) * Math.pow(y, 1 - st.al), opt: (M, px, py) => [st.al * M / px, (1 - st.al) * M / py], ic: (Uv, x) => Math.pow(Uv / Math.pow(x, st.al), 1 / (1 - st.al)) },
    sub: { lab: 'Sustitutos perfectos', f: 'U = α·x + (1−α)·y', u: (x, y) => st.al * x + (1 - st.al) * y, opt: (M, px, py) => st.al / px > (1 - st.al) / py ? [M / px, 0] : st.al / px < (1 - st.al) / py ? [0, M / py] : [M / px / 2, M / py / 2], ic: (Uv, x) => (Uv - st.al * x) / (1 - st.al) },
    comp: { lab: 'Complementos perfectos', f: 'U = mín(x, y)', u: (x, y) => Math.min(x, y), opt: (M, px, py) => [M / (px + py), M / (px + py)], ic: null }
  };
  A.tool({
    id: 'consumidor', mat: 'micro', unit: 2, name: 'Elección del consumidor', short: 'Consumidor', tag: 'Utilidad y restricción presupuestaria', f: 'TMS = px / py',
    desc: 'Curvas de indiferencia, recta presupuestaria y la canasta óptima. Con descomposición de Slutsky en efecto sustitución e ingreso.',
    lead: 'El consumidor elige la canasta que le da más utilidad entre las que puede pagar. En el óptimo (con preferencias "normales"), la tasa a la que está dispuesto a cambiar un bien por otro iguala a la que le cobra el mercado: TMS = px/py.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Preferencias</label>${A.seg('cs-u', [['cd', 'Cobb-Douglas'], ['sub', 'Sustitutos'], ['comp', 'Complementos']], 'cd')}<p class="note mono" id="cs-f" style="margin-top:8px"></p></div>${A.sliders('cs', D)}
      <label class="check"><input type="checkbox" id="cs-sl" checked> Mostrar el cambio de precio (Slutsky)</label><dl class="stats" id="cs-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="cs-cv" style="height:440px"></canvas>${A.legend([['amber', 'Restricción presupuestaria'], ['teal', 'Curvas de indiferencia'], ['rose', 'Después del cambio de precio'], ['violet', 'Recta compensada']])}<div class="steplist" id="cs-steps"></div></div></div>`,
    init() { A.bindSliders('cs', D, st, upd); A.segBind('cs-u', v => { st.u = v; upd(); }); st.sl = true; $('#cs-sl').onchange = e => { st.sl = e.target.checked; upd(); }; upd(); },
    draw
  });
  function calc() {
    const T = U[st.u], [x, y] = T.opt(st.M, st.px, st.py), Uv = T.u(x, y), [x2, y2] = T.opt(st.M, st.px2, st.py);
    let xh = null, yh = null;
    if (st.u === 'cd') { xh = Uv * Math.pow(st.al * st.py / ((1 - st.al) * st.px2), 1 - st.al); yh = Uv * Math.pow((1 - st.al) * st.px2 / (st.al * st.py), st.al); }
    if (st.u === 'comp') { xh = Uv; yh = Uv; }
    if (st.u === 'sub') { const M2 = Math.min(Uv / st.al * st.px2, Uv / (1 - st.al) * st.py); [xh, yh] = T.opt(M2, st.px2, st.py); }
    return { x, y, Uv, x2, y2, xh, yh };
  }
  function upd() {
    const T = U[st.u], r = calc(); $('#cs-f').textContent = T.f;
    $$('#cs-al').forEach(e => e.closest('div').hidden = st.u === 'comp');
    $('#cs-px2').closest('div').hidden = !st.sl;
    $('#cs-st').innerHTML = A.stats([['Canasta óptima', `x = ${f2(r.x)}, y = ${f2(r.y)}`], ['Utilidad', f2(r.Uv)], ...(st.sl ? [['Efecto sustitución', f2(r.xh - r.x)], ['Efecto ingreso', f2(r.x2 - r.xh)], ['Efecto total', f2(r.x2 - r.x)]] : [])]);
    const s = st.u === 'cd' ? [
      `Maximizo U = x^${f2(st.al)}·y^${f2(1 - st.al)} sujeto a ${f2(st.px)}·x + ${f2(st.py)}·y = ${f2(st.M)}.`,
      `Condición de óptimo: TMS = (α/(1−α))·(y/x) = px/py. Despejando, con Cobb-Douglas se gasta siempre la fracción α del ingreso en x.`,
      `x* = α·M/px = ${f2(st.al)} × ${f2(st.M)} / ${f2(st.px)} = <b>${f2(r.x)}</b>; y* = (1−α)·M/py = <b>${f2(r.y)}</b>.`]
      : st.u === 'sub' ? [`Con sustitutos perfectos la curva de indiferencia es una recta. Comparo utilidad por peso gastado: α/px = ${fmt(st.al / st.px, 3)} vs (1−α)/py = ${fmt((1 - st.al) / st.py, 3)}.`, `Gasta todo en el bien que rinde más por peso: <b>x = ${f2(r.x)}, y = ${f2(r.y)}</b>. Es una solución de esquina: la condición TMS = px/py no se cumple.`]
      : [`Con complementos perfectos (como zapato izquierdo y derecho) se consumen siempre juntos: x = y.`, `Uso el presupuesto: px·x + py·x = M → x = M/(px + py) = ${f2(st.M)} / ${f2(st.px + st.py)} = <b>${f2(r.x)}</b>.`, `No hay efecto sustitución: todo el cambio ante un precio nuevo es efecto ingreso.`];
    if (st.sl) s.push(`Si px pasa de ${f2(st.px)} a ${f2(st.px2)}: el <b>efecto sustitución</b> (moverse sobre la misma curva de indiferencia hasta la recta compensada) es ${f2(r.xh - r.x)} y el <b>efecto ingreso</b> (por el poder de compra perdido o ganado) es ${f2(r.x2 - r.xh)}. Total: ${f2(r.x2 - r.x)}.`);
    $('#cs-steps').innerHTML = A.steps(s);
    draw();
  }
  function draw() {
    const r = calc(), xm = Math.max(st.M / st.px, st.M / st.px2) * 1.08, ym = st.M / st.py * 1.25;
    const g = A.ax($('#cs-cv'), [0, xm], [0, ym]); if (!g) return;
    const T = U[st.u], bud = (px, M) => x => (M - px * x) / st.py;
    [.55, 1, 1.5].forEach((k, i) => {
      const Uv = r.Uv * k, col = i === 1 ? K.teal : 'rgba(67,200,184,.35)';
      if (st.u === 'comp') g.path([[Uv, ym * 2], [Uv, Uv], [xm * 2, Uv]], col, i === 1 ? 2.2 : 1.4);
      else g.fn(x => T.ic(Uv, x), col, i === 1 ? 2.2 : 1.4, null, [xm * .002, xm]);
    });
    if (st.sl) {
      const Uv = r.Uv;
      if (st.u === 'comp') g.path([[r.x2, ym * 2], [r.x2, r.x2], [xm * 2, r.x2]], 'rgba(239,115,145,.5)', 1.4);
      else g.fn(x => T.ic(T.u(r.x2, r.y2), x), 'rgba(239,115,145,.5)', 1.4, null, [xm * .002, xm]);
      if (r.xh !== null) { const Mc = st.px2 * r.xh + st.py * r.yh; g.fn(bud(st.px2, Mc), K.violet, 1.5, [6, 5]); g.dot(r.xh, r.yh, K.violet, 5); g.text('B', r.xh, r.yh, K.violet); }
      g.fn(bud(st.px2, st.M), K.rose, 2); g.dot(r.x2, r.y2, K.rose, 6); g.text('C', r.x2, r.y2, K.rose);
    }
    g.fn(bud(st.px, st.M), K.amber); g.guide(r.x, r.y); g.dot(r.x, r.y, K.fg, 6); g.text('A', r.x, r.y, K.fg);
    g.labels('Bien x', 'Bien y');
  }
}

/* ================= Producción y costos ================= */
{
  const st = {};
  const D = [['cf', 'Costo fijo', 0, 300, 5, 100, 0], ['a', 'Coeficiente a', 10, 80, 1, 40, 0], ['b', 'Coeficiente b', 1, 12, .1, 6, 1], ['c', 'Coeficiente c', .1, 1.5, .05, .4, 2], ['p', 'Precio de mercado', 0, 120, .5, 40, 1]];
  const CV = q => st.a * q - st.b * q * q + st.c * q ** 3, CT = q => st.cf + CV(q), CMg = q => st.a - 2 * st.b * q + 3 * st.c * q * q, CVMe = q => st.a - st.b * q + st.c * q * q, CMe = q => CT(q) / q;
  const minOf = (f, lo, hi) => { let best = lo, bv = Infinity; for (let i = 0; i <= 4000; i++) { const q = lo + (hi - lo) * i / 4000, v = f(q); if (v < bv) { bv = v; best = q; } } return [best, bv]; };
  A.tool({
    id: 'costos', mat: 'micro', unit: 3, name: 'Curvas de costos de la empresa', short: 'Costos', tag: 'Corto plazo', f: 'CMg = dCT/dq',
    desc: 'Costo total, medio, variable medio y marginal a partir de una función cúbica. Punto de cierre, de nivelación y la oferta de la empresa.',
    lead: 'Función de costos CT(q) = CF + a·q − b·q² + c·q³, la forma clásica de los libros. A partir de ella salen todas las curvas. Mové el precio para ver cuánto produce una empresa competitiva y si gana o pierde.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('co', D)}<dl class="stats" id="co-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="co-cv" style="height:440px"></canvas>${A.legend([['rose', 'Costo marginal'], ['amber', 'Costo medio'], ['teal', 'Costo variable medio'], ['fg', 'Precio']])}<div class="steplist" id="co-steps"></div></div></div>`,
    init() { A.bindSliders('co', D, st, upd); upd(); },
    draw
  });
  function calc() {
    const [qv, cvm] = minOf(CVMe, .01, 40), [qe, cme] = minOf(CMe, .01, 40);
    let q = 0; const P = st.p, disc = 4 * st.b * st.b - 12 * st.c * (st.a - P);
    if (P >= cvm && disc >= 0) q = (2 * st.b + Math.sqrt(disc)) / (6 * st.c);
    const pi = q > 0 ? P * q - CT(q) : -st.cf;
    return { qv, cvm, qe, cme, q, pi };
  }
  function upd() {
    const r = calc();
    $('#co-st').innerHTML = A.stats([['Cantidad óptima', f2(r.q)], ['Beneficio', '$' + f2(r.pi)], ['Punto de cierre', `P = ${f2(r.cvm)}`], ['Punto de nivelación', `P = ${f2(r.cme)}`]]);
    const s = [`Costo marginal: derivo CT → CMg(q) = ${f2(st.a)} − ${f2(2 * st.b)}·q + ${f2(3 * st.c)}·q².`,
      `Costo variable medio: CV/q = ${f2(st.a)} − ${f2(st.b)}·q + ${f2(st.c)}·q². Su mínimo está en q = b/(2c) = ${f2(st.b / (2 * st.c))}, con CVMe = <b>${f2(r.cvm)}</b>: es el <b>punto de cierre</b>.`,
      `El costo medio total es mínimo en q = ${f2(r.qe)}, con CMe = <b>${f2(r.cme)}</b>: el <b>punto de nivelación</b>. El CMg corta a las dos curvas medias justo en sus mínimos.`];
    if (st.p < r.cvm) s.push(`Con P = ${f2(st.p)} menor al mínimo del CVMe, conviene <b>cerrar</b>: produciendo no cubre ni los costos variables. Pierde solo el costo fijo ($${f2(st.cf)}).`);
    else s.push(`Con P = ${f2(st.p)}, la empresa produce donde P = CMg (en el tramo creciente): ${f2(3 * st.c)}q² − ${f2(2 * st.b)}q + ${f2(st.a - st.p)} = 0 → <b>q = ${f2(r.q)}</b>. Beneficio = (P − CMe)·q = (${f2(st.p)} − ${f2(CMe(r.q))}) × ${f2(r.q)} = <b>$${f2(r.pi)}</b>. ${r.pi < 0 ? 'Pierde plata, pero menos que cerrando: sigue produciendo en el corto plazo.' : 'Tiene ganancias económicas.'}`);
    $('#co-steps').innerHTML = A.steps(s);
    draw();
  }
  function draw() {
    const r = calc(), qm = Math.max(18, r.q * 1.3), ym = Math.max(st.p, r.cme) * 1.9 + 10;
    const g = A.ax($('#co-cv'), [0, qm], [0, ym]); if (!g) return;
    if (r.q > 0) g.poly([[0, st.p], [r.q, st.p], [r.q, CMe(r.q)], [0, CMe(r.q)]], r.pi >= 0 ? 'rgba(67,200,184,.2)' : 'rgba(239,115,145,.25)');
    g.fn(CMg, K.rose, 2.2, null, [.05, qm]); g.fn(CMe, K.amber, 2.2, null, [.2, qm]); g.fn(CVMe, K.teal, 2.2, null, [.05, qm]);
    g.hline(st.p, K.fg, 1.4); g.text('P = ' + f2(st.p), qm, st.p, K.fg, 'right');
    g.dot(r.qv, r.cvm, K.teal, 4.5); g.text('cierre', r.qv, r.cvm, K.teal, 'left', 'top', 6, 6);
    g.dot(r.qe, r.cme, K.amber, 4.5); g.text('nivelación', r.qe, r.cme, K.amber, 'left', 'top', 6, 6);
    if (r.q > 0) { g.guide(r.q, st.p); g.dot(r.q, st.p, K.fg, 6); }
    g.labels('Cantidad q', '$ por unidad');
  }
}

/* ================= Competencia perfecta: corto y largo plazo ================= */
{
  const st = { n: 20 };
  const D = [['A', 'Demanda: ordenada', 200, 2000, 10, 1000, 0], ['B', 'Demanda: pendiente', 2, 40, 1, 10, 0], ['cf', 'Costo fijo de cada empresa', 10, 400, 5, 100, 0], ['c', 'Coeficiente c (CT = CF + c·q²)', .2, 4, .1, 1, 1]];
  let timer = null;
  const mkt = n => { const P = st.A / (st.B + n / (2 * st.c)), q = P / (2 * st.c); return { P, q, Q: n * q, pi: P * q - st.cf - st.c * q * q }; };
  A.tool({
    id: 'competencia', mat: 'micro', unit: 4, name: 'Competencia perfecta: corto y largo plazo', short: 'Competencia perfecta', tag: 'Entrada y salida', f: 'largo plazo: P = mín CMe',
    desc: 'El mercado y una empresa típica lado a lado. Si hay ganancias entran empresas, si hay pérdidas salen, hasta llegar al largo plazo.',
    lead: 'Cada empresa tiene CT = CF + c·q², toma el precio como dado y produce donde P = CMg = 2c·q. La oferta del mercado es la suma de las n empresas. Si hay ganancias, entran competidores y el precio baja hasta el mínimo del costo medio.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('cp', D)}<div><label class="l" for="cp-n">Cantidad de empresas: <span id="cp-nv" style="color:var(--fg)">20</span></label><input type="range" id="cp-n" min="1" max="150" value="20"></div>
      <button class="btn primary sm" id="cp-go" style="align-self:flex-start">Simular entrada y salida</button><dl class="stats" id="cp-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Mercado</h3><canvas id="cp-m" style="height:300px"></canvas></div><div><h3>Empresa típica</h3><canvas id="cp-f" style="height:300px"></canvas></div></div>
      ${A.legend([['teal', 'Demanda'], ['amber', 'Oferta de mercado'], ['rose', 'Costo marginal'], ['violet', 'Costo medio']])}<div class="explain" id="cp-exp"></div></div></div>`,
    init() {
      A.bindSliders('cp', D, st, upd);
      $('#cp-n').oninput = e => { clearInterval(timer); st.n = +e.target.value; upd(); };
      $('#cp-go').onclick = () => {
        clearInterval(timer);
        timer = setInterval(() => {
          const r = mkt(st.n), step = Math.max(1, Math.round(Math.abs(r.pi) / 20));
          if (A.current !== 'competencia') return clearInterval(timer);
          const n2 = r.pi > 0 ? st.n + step : st.n - step, r2 = mkt(Math.max(1, n2));
          if (r.pi > 0 && r2.pi < 0 || n2 < 1 || Math.abs(r.pi) < .5) { clearInterval(timer); return; }
          st.n = Math.max(1, Math.min(150, n2)); $('#cp-n').value = st.n; upd();
        }, A.reduce ? 10 : 180);
      };
      upd();
    },
    draw, hide: () => clearInterval(timer)
  });
  function upd() {
    $('#cp-nv').textContent = st.n; const r = mkt(st.n), qe = Math.sqrt(st.cf / st.c), pe = 2 * Math.sqrt(st.cf * st.c);
    $('#cp-st').innerHTML = A.stats([['Precio', '$' + f2(r.P)], ['Cada empresa produce', f2(r.q)], ['Beneficio por empresa', '$' + f2(r.pi)], ['Precio de largo plazo', '$' + f2(pe)]]);
    $('#cp-exp').innerHTML = `<p>Oferta de cada empresa: P = 2·${f2(st.c)}·q → q = P/${f2(2 * st.c)}. Con ${st.n} empresas, la oferta del mercado es Q = ${st.n}·P/${f2(2 * st.c)}. Igualando con la demanda: P = ${fmt(st.A, 0)} / (${fmt(st.B, 0)} + ${f2(st.n / (2 * st.c))}) = <b>$${f2(r.P)}</b>.</p>
      <p style="margin-top:6px">${Math.abs(r.pi) < 1 ? '<b>Largo plazo:</b> beneficio económico cero. Nadie quiere entrar ni salir, y cada empresa produce en el mínimo de su costo medio.' : r.pi > 0 ? `Cada empresa gana $${f2(r.pi)}: eso atrae competidores. Al entrar, la oferta se corre a la derecha y el precio baja.` : `Cada empresa pierde $${f2(-r.pi)}: algunas van a salir, la oferta se contrae y el precio sube.`} En el largo plazo el precio va a ser el mínimo del CMe: q = √(CF/c) = ${f2(qe)} y P = 2√(CF·c) = <b>$${f2(pe)}</b>.</p>`;
    draw();
  }
  function draw() {
    const r = mkt(st.n), qe = Math.sqrt(st.cf / st.c), pe = 2 * Math.sqrt(st.cf * st.c), pm = Math.max(st.A / st.B, pe * 2) * 1.05;
    const g = A.ax($('#cp-m'), [0, st.A * 1.02], [0, pm], { l: 40 });
    if (g) { g.fn(Q => (st.A - Q) / st.B, K.teal); g.fn(Q => 2 * st.c * Q / st.n, K.amber); g.hline(pe, K.faint, 1, [3, 4]); g.guide(r.Q, r.P); g.dot(r.Q, r.P, K.fg, 6); g.labels('Q mercado', 'P'); }
    const f = A.ax($('#cp-f'), [0, qe * 3], [0, pm], { l: 40 });
    if (f) {
      f.poly([[0, r.P], [r.q, r.P], [r.q, st.cf / r.q + st.c * r.q], [0, st.cf / r.q + st.c * r.q]], r.pi >= 0 ? 'rgba(67,200,184,.22)' : 'rgba(239,115,145,.25)');
      f.fn(q => 2 * st.c * q, K.rose); f.fn(q => st.cf / q + st.c * q, K.violet, 2.2, null, [qe * .08, qe * 3]);
      f.hline(r.P, K.fg, 1.3); f.dot(qe, pe, K.violet, 4); f.guide(r.q, r.P); f.dot(r.q, r.P, K.fg, 6); f.labels('q empresa', 'P');
    }
  }
}

/* ================= Monopolio ================= */
{
  const st = { disc: false };
  const D = [['a', 'Demanda: ordenada a', 40, 200, 1, 100, 0], ['b', 'Demanda: pendiente b', .2, 4, .1, 1, 1], ['c', 'CMg: ordenada', 0, 60, 1, 20, 0], ['e', 'CMg: pendiente', 0, 3, .1, 0, 1]];
  const calc = () => {
    const Qm = (st.a - st.c) / (2 * st.b + st.e), Pm = st.a - st.b * Qm, Qc = (st.a - st.c) / (st.b + st.e), Pc = st.a - st.b * Qc, mc = st.c + st.e * Qm;
    const CS = .5 * Qm * (st.a - Pm), PS = (Pm - st.c) * Qm - st.e * Qm * Qm / 2, DWL = .5 * (Qc - Qm) * (Pm - mc);
    const TSc = .5 * Qc * (st.a - Pc) + (Pc - st.c) * Qc - st.e * Qc * Qc / 2, ep = -Pm / (st.b * Qm);
    return { Qm, Pm, Qc, Pc, mc, CS, PS, DWL, TSc, ep, L: (Pm - mc) / Pm };
  };
  A.tool({
    id: 'monopolio', mat: 'micro', unit: 4, name: 'Monopolio y poder de mercado', short: 'Monopolio', tag: 'Estructuras de mercado', f: 'IMg = CMg',
    desc: 'El monopolista produce donde el ingreso marginal iguala al costo marginal. Medí la pérdida de eficiencia y el índice de Lerner.',
    lead: 'Un monopolista enfrenta toda la demanda: para vender una unidad más tiene que bajar el precio de todas. Por eso su ingreso marginal está por debajo de la demanda, produce menos y cobra más que en competencia.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mo', D)}<label class="check"><input type="checkbox" id="mo-disc"> Discriminación de precios perfecta</label><dl class="stats" id="mo-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="mo-cv" style="height:420px"></canvas>${A.legend([['teal', 'Demanda'], ['violet', 'Ingreso marginal'], ['rose', 'Costo marginal'], ['amber', 'Beneficio'], ['faint', 'Pérdida irrecuperable']])}<div class="steplist" id="mo-steps"></div></div></div>`,
    init() { A.bindSliders('mo', D, st, upd); $('#mo-disc').onchange = e => { st.disc = e.target.checked; upd(); }; upd(); },
    draw
  });
  function upd() {
    const r = calc(); if (r.Qm <= 0) { $('#mo-steps').innerHTML = '<p class="err">El costo marginal está por encima de la demanda: no conviene producir.</p>'; $('#mo-st').innerHTML = ''; draw(); return; }
    $('#mo-st').innerHTML = st.disc ? A.stats([['Cantidad', f2(r.Qc)], ['Beneficio', '$' + f2(r.TSc)], ['Exc. consumidor', '0'], ['Pérdida irrecuperable', '0']])
      : A.stats([['Cantidad monopolio', f2(r.Qm)], ['Precio', '$' + f2(r.Pm)], ['Cantidad competitiva', f2(r.Qc)], ['Exc. consumidor', f2(r.CS)], ['Beneficio (sin CF)', f2(r.PS)], ['Pérdida irrecuperable', f2(r.DWL)], ['Índice de Lerner', pct(r.L, 1)]]);
    $('#mo-steps').innerHTML = st.disc ? A.steps([`Con discriminación perfecta, el monopolista le cobra a cada cliente exactamente lo máximo que está dispuesto a pagar.`, `Le conviene vender hasta donde la demanda corta al costo marginal, como en competencia: Q = <b>${f2(r.Qc)}</b>.`, `No hay pérdida de eficiencia, pero <b>todo el excedente</b> se lo queda el monopolista: ${f2(r.TSc)}.`])
      : A.steps([`Ingreso total: IT = P·Q = (${f2(st.a)} − ${f2(st.b)}·Q)·Q. Derivo: IMg = ${f2(st.a)} − ${f2(2 * st.b)}·Q (misma ordenada, el doble de pendiente).`,
        `Igualo IMg = CMg: ${f2(st.a)} − ${f2(2 * st.b)}·Q = ${f2(st.c)}${st.e ? ' + ' + f2(st.e) + '·Q' : ''} → <b>Qm = ${f2(r.Qm)}</b>.`,
        `El precio sale de la demanda (no del IMg): Pm = ${f2(st.a)} − ${f2(st.b)} × ${f2(r.Qm)} = <b>$${f2(r.Pm)}</b>.`,
        `En competencia se produciría hasta P = CMg: Qc = ${f2(r.Qc)} a $${f2(r.Pc)}. La diferencia genera una <b>pérdida irrecuperable de ${f2(r.DWL)}</b>.`,
        `Índice de Lerner: (P − CMg)/P = (${f2(r.Pm)} − ${f2(r.mc)}) / ${f2(r.Pm)} = <b>${pct(r.L, 1)}</b>. Es igual a 1/|ε| en el óptimo: la elasticidad ahí es ${f2(r.ep)}. Un monopolista nunca produce en el tramo inelástico de la demanda.`]);
    draw();
  }
  function draw() {
    const r = calc(), g = A.ax($('#mo-cv'), [0, st.a / st.b * 1.05], [0, st.a * 1.05]); if (!g) return;
    const Dm = q => st.a - st.b * q, MC = q => st.c + st.e * q;
    if (r.Qm > 0) {
      if (st.disc) g.area(Dm, MC, 0, r.Qc, 'rgba(242,169,59,.28)');
      else {
        g.area(Dm, () => r.Pm, 0, r.Qm, 'rgba(67,200,184,.22)'); g.area(() => r.Pm, MC, 0, r.Qm, 'rgba(242,169,59,.28)'); g.area(Dm, MC, r.Qm, r.Qc, 'rgba(239,115,145,.35)');
        g.guide(r.Qm, r.Pm); g.dot(r.Qm, r.Pm, K.fg, 6); g.text('monopolio', r.Qm, r.Pm, K.fg); g.dot(r.Qm, r.mc, K.violet, 4.5); g.dot(r.Qc, r.Pc, K.faint, 4.5); g.text('competencia', r.Qc, r.Pc, K.faint);
      }
    }
    g.fn(Dm, K.teal); if (!st.disc) g.fn(q => st.a - 2 * st.b * q, K.violet, 2, null, [0, st.a / (2 * st.b)]); g.fn(MC, K.rose);
    g.labels('Cantidad Q', 'Precio P');
  }
}

/* ================= Oligopolio ================= */
{
  const st = {};
  const D = [['a', 'Demanda: ordenada a', 40, 200, 1, 120, 0], ['b', 'Demanda: pendiente b', .2, 3, .1, 1, 1], ['c1', 'Costo marginal empresa 1', 0, 60, 1, 20, 0], ['c2', 'Costo marginal empresa 2', 0, 60, 1, 20, 0]];
  const models = () => {
    const { a, b, c1, c2 } = st, P = Q => Math.max(0, a - b * Q), out = {};
    let q1 = (a - 2 * c1 + c2) / (3 * b), q2 = (a - 2 * c2 + c1) / (3 * b);
    if (q2 < 0) { q2 = 0; q1 = (a - c1) / (2 * b); } if (q1 < 0) { q1 = 0; q2 = (a - c2) / (2 * b); }
    out.cournot = [q1, q2];
    let s1 = (a - 2 * c1 + c2) / (2 * b); s1 = Math.max(0, Math.min(s1, (a - c1) / b)); let s2 = Math.max(0, (a - c2 - b * s1) / (2 * b));
    out.stack = [s1, s2];
    const cm = Math.min(c1, c2), Qm = (a - cm) / (2 * b); out.cartel = c1 === c2 ? [Qm / 2, Qm / 2] : c1 < c2 ? [Qm, 0] : [0, Qm];
    let pb; if (c1 === c2) { pb = c1; out.bert = [(a - pb) / b / 2, (a - pb) / b / 2]; } else { const lo = Math.min(c1, c2), hi = Math.max(c1, c2), pmon = (a + lo) / 2; pb = Math.min(hi, pmon); const Q = (a - pb) / b; out.bert = c1 < c2 ? [Q, 0] : [0, Q]; }
    const row = ([x, y], pf) => { const Q = x + y, p = pf ?? P(Q); return { q1: x, q2: y, Q, P: p, pi1: (p - c1) * x, pi2: (p - c2) * y, CS: .5 * Q * (a - p) }; };
    return { cournot: row(out.cournot), stack: row(out.stack), cartel: row(out.cartel), bert: row(out.bert, pb), comp: row([(a - cm) / b, 0], cm) };
  };
  const NAMES = { cournot: 'Cournot', stack: 'Stackelberg (1 líder)', bert: 'Bertrand', cartel: 'Colusión (cartel)', comp: 'Competencia perfecta' };
  A.tool({
    id: 'oligopolio', mat: 'micro', unit: 4, name: 'Oligopolio: Cournot, Stackelberg y Bertrand', short: 'Oligopolio', tag: 'Competencia estratégica', f: 'q₁ = (a − 2c₁ + c₂)/(3b)',
    desc: 'Dos empresas compiten en cantidades o en precios. Funciones de reacción, equilibrio y comparación de los cuatro modelos.',
    lead: 'Duopolio con demanda P = a − b·(q₁ + q₂). En Cournot cada empresa elige su cantidad tomando la del otro como dada; en Stackelberg una mueve primero; en Bertrand compiten en precios; en un cartel se ponen de acuerdo.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('ol', D)}</div>
      <div class="stage"><canvas id="ol-cv" style="height:420px"></canvas>${A.legend([['amber', 'Reacción de la empresa 1'], ['teal', 'Reacción de la empresa 2'], ['violet', 'Combinaciones del cartel']])}
      <div class="tbl-wrap"><table class="tbl" id="ol-tbl"></table></div><div class="steplist" id="ol-steps"></div></div></div>`,
    init() { A.bindSliders('ol', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const m = models();
    $('#ol-tbl').innerHTML = `<tr><th>Modelo</th><th>q₁</th><th>q₂</th><th>Precio</th><th>Benef. 1</th><th>Benef. 2</th><th>Exc. cons.</th></tr>` + Object.keys(NAMES).map(k => `<tr><td>${NAMES[k]}</td><td>${f2(m[k].q1)}</td><td>${f2(m[k].q2)}</td><td>${f2(m[k].P)}</td><td>${f2(m[k].pi1)}</td><td>${f2(m[k].pi2)}</td><td>${f2(m[k].CS)}</td></tr>`).join('');
    const { a, b, c1, c2 } = st;
    $('#ol-steps').innerHTML = A.steps([
      `Beneficio de la empresa 1: π₁ = (a − b(q₁ + q₂) − c₁)·q₁. Derivo e igualo a cero: a − 2b·q₁ − b·q₂ − c₁ = 0.`,
      `Función de reacción: <b>q₁ = (${f2(a - c1)} − ${f2(b)}·q₂) / ${f2(2 * b)}</b>. Igual para la empresa 2: q₂ = (${f2(a - c2)} − ${f2(b)}·q₁) / ${f2(2 * b)}.`,
      `Cournot es donde se cruzan las dos reacciones: q₁ = ${f2(m.cournot.q1)}, q₂ = ${f2(m.cournot.q2)}, precio $${f2(m.cournot.P)}.`,
      `Stackelberg: la empresa 1 elige sabiendo cómo reacciona la 2, y por eso produce más (${f2(m.stack.q1)}) y gana más: la <b>ventaja del que mueve primero</b>.`,
      `Bertrand con producto idéntico: bajar un centavo el precio te da todo el mercado, así que el precio cae ${c1 === c2 ? 'hasta el costo marginal' : 'hasta el costo de la empresa menos eficiente'} con solo dos empresas. Es la <b>paradoja de Bertrand</b>.`,
      `El cartel maximiza el beneficio conjunto, pero cada empresa tiene incentivo a producir más de lo pactado: es un dilema del prisionero.`]);
    draw();
  }
  function draw() {
    const { a, b, c1, c2 } = st, M = Math.max((a - c1) / b, (a - c2) / b, 1) * 1.05, m = models();
    const g = A.ax($('#ol-cv'), [0, M], [0, M]); if (!g) return;
    g.fn(q1 => (a - c2 - b * q1) / (2 * b), K.teal);
    g.fn(q1 => a - c1 - 2 * b * q1, K.amber, 2.2, null, [0, (a - c1) / (2 * b)]);
    const Qm = (a - Math.min(c1, c2)) / (2 * b); g.fn(q1 => Qm - q1, K.violet, 1.5, [6, 5], [0, Qm]);
    [['cournot', K.fg, 'Cournot'], ['stack', K.amber, 'Stackelberg'], ['cartel', K.violet, 'Cartel'], ['bert', K.rose, 'Bertrand']].forEach(([k, col, l]) => { g.dot(m[k].q1, m[k].q2, col, 5.5); g.text(l, m[k].q1, m[k].q2, col); });
    g.labels('q₁', 'q₂');
  }
}

/* ================= Externalidades ================= */
{
  const st = { sign: 'neg' };
  const D = [['e', 'Externalidad por unidad', 0, 40, .5, 15, 1], ['t', 'Impuesto o subsidio aplicado', 0, 40, .5, 0, 1]];
  const M = { a: 100, b: 1, c: 10, d: 1 };
  A.tool({
    id: 'externalidades', mat: 'micro', unit: 5, name: 'Externalidades e impuesto pigouviano', short: 'Externalidades', tag: 'Fallas de mercado', f: 't* = costo externo marginal',
    desc: 'Cuando producir o consumir afecta a terceros, el mercado se equivoca de cantidad. Corregilo con un impuesto o subsidio.',
    lead: 'Si una fábrica contamina, su costo privado es menor al costo para la sociedad y el mercado produce de más. Si algo genera beneficios a terceros (como una vacuna), se produce de menos. Un impuesto o subsidio igual a la externalidad lo corrige.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Tipo de externalidad</label>${A.seg('ex-s', [['neg', 'Negativa (contaminación)'], ['pos', 'Positiva (vacuna)']], 'neg')}</div>${A.sliders('ex', D)}
      <button class="btn primary sm" id="ex-pig" style="align-self:flex-start">Aplicar la corrección óptima</button><dl class="stats" id="ex-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ex-cv" style="height:420px"></canvas>${A.legend([['teal', 'Beneficio marginal privado'], ['amber', 'Costo marginal privado'], ['violet', 'Curva social'], ['rose', 'Pérdida irrecuperable']])}<div class="steplist" id="ex-steps"></div></div></div>`,
    init() { A.bindSliders('ex', D, st, upd); A.segBind('ex-s', v => { st.sign = v; upd(); }); $('#ex-pig').onclick = () => { A.setSlider('ex', 't', st.e, st, 1); upd(); }; upd(); },
    draw
  });
  const calc = () => {
    const { a, b, c, d } = M, neg = st.sign === 'neg', Qm = (a - c) / (b + d);
    const Qs = neg ? (a - c - st.e) / (b + d) : (a + st.e - c) / (b + d);
    const Qt = neg ? (a - c - st.t) / (b + d) : (a + st.t - c) / (b + d);
    const gap = Q => neg ? (c + st.e + d * Q) - (a - b * Q) : (a + st.e - b * Q) - (c + d * Q);
    const dwl = Q => .5 * Math.abs(Q - Qs) * Math.abs(gap(Q));
    return { Qm, Qs, Qt, dwlM: dwl(Qm), dwlT: dwl(Qt) };
  };
  function upd() {
    const r = calc(), neg = st.sign === 'neg';
    $('#ex-pig').textContent = neg ? 'Aplicar el impuesto pigouviano' : 'Aplicar el subsidio óptimo';
    $('#ex-st').innerHTML = A.stats([['Cantidad de mercado', f2(r.Qm)], ['Cantidad socialmente óptima', f2(r.Qs)], ['Cantidad con la política', f2(r.Qt)], ['Pérdida sin política', f2(r.dwlM)], ['Pérdida con la política', f2(r.dwlT)]]);
    $('#ex-steps').innerHTML = A.steps(neg ? [
      `Mercado: demanda P = 100 − Q, costo marginal privado CMgP = 10 + Q. El mercado iguala: 100 − Q = 10 + Q → Q = <b>${f2(r.Qm)}</b>.`,
      `Cada unidad le cuesta ${f2(st.e)} a terceros: CMgSocial = CMgP + ${f2(st.e)}. Óptimo social: 100 − Q = ${f2(10 + st.e)} + Q → Q = <b>${f2(r.Qs)}</b>.`,
      `Se producen ${f2(r.Qm - r.Qs)} unidades de más: cada una cuesta a la sociedad más de lo que vale. Pérdida = ½ × ${f2(st.e)} × ${f2(r.Qm - r.Qs)} = <b>${f2(r.dwlM)}</b>.`,
      `<b>Impuesto pigouviano:</b> un impuesto t = ${f2(st.e)} por unidad hace que la empresa "sienta" el costo externo y elija sola la cantidad óptima.`]
      : [`Sin intervención: 100 − Q = 10 + Q → Q = <b>${f2(r.Qm)}</b>.`, `Cada unidad le da ${f2(st.e)} de beneficio a terceros: BMgSocial = 100 + ${f2(st.e)} − Q. Óptimo: Q = <b>${f2(r.Qs)}</b>.`, `Se produce de menos. Pérdida: <b>${f2(r.dwlM)}</b>.`, `Un subsidio de ${f2(st.e)} por unidad corrige el problema.`]);
    draw();
  }
  function draw() {
    const r = calc(), neg = st.sign === 'neg', g = A.ax($('#ex-cv'), [0, 100], [0, 120]); if (!g) return;
    const Dp = Q => 100 - Q, Sp = Q => 10 + Q, soc = neg ? Q => 10 + st.e + Q : Q => 100 + st.e - Q;
    const lo = Math.min(r.Qt, r.Qs), hi = Math.max(r.Qt, r.Qs);
    if (hi - lo > 1e-6) g.area(q => Math.max(neg ? soc(q) : Dp(q), neg ? Dp(q) : soc(q)), q => Math.min(neg ? soc(q) : Sp(q), neg ? Dp(q) : soc(q)), lo, hi, 'rgba(239,115,145,.35)');
    g.fn(Dp, K.teal); g.fn(Sp, K.amber); g.fn(soc, K.violet, 2, [6, 5]);
    if (st.t) g.fn(neg ? Q => 10 + st.t + Q : Q => 100 + st.t - Q, K.fg, 1.2, [2, 4]);
    g.dot(r.Qm, Sp(r.Qm), K.faint, 5); g.text('mercado', r.Qm, Sp(r.Qm), K.faint);
    g.guide(r.Qs, neg ? soc(r.Qs) : Sp(r.Qs)); g.dot(r.Qs, neg ? soc(r.Qs) : Sp(r.Qs), K.violet, 6); g.text('óptimo social', r.Qs, neg ? soc(r.Qs) : Sp(r.Qs), K.violet, 'right', 'bottom', -8);
    g.labels('Cantidad Q', 'Precio P');
  }
}
})();
