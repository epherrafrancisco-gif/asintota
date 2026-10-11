/* Asíntota · Finanzas */
(() => {
const { $, $$, K, fmt, pct, S } = A;
const f2 = x => fmt(x, 2), money = x => (x < 0 ? '−$' : '$') + fmt(Math.abs(x), 2);

/* ================= Tasas de interés ================= */
{
  const st = {};
  const D = [['C', 'Capital ($)', 10000, 5000000, 10000, 1000000, 0], ['tna', 'TNA (%)', 1, 150, .5, 30, 1], ['d', 'Plazo de cada colocación (días)', 7, 365, 1, 30, 0], ['inf', 'Inflación mensual esperada (%)', 0, 15, .1, 2.5, 1], ['m', 'Meses de inversión', 1, 36, 1, 12, 0]];
  A.tool({
    id: 'tasas', mat: 'finanzas', unit: 1, name: 'Tasas: TNA, TEM, TEA y tasa real', short: 'Tasas', tag: 'Interés simple y compuesto', f: 'TEA = (1 + TNA·d/365)^(365/d) − 1',
    desc: 'Convertí tasas como lo hacen los bancos argentinos, simulá un plazo fijo renovado y medí si le ganás a la inflación.',
    lead: 'En Argentina los bancos informan la TNA (tasa nominal anual), pero lo que importa es la efectiva: cuánto rinde de verdad si reinvertís. Y lo que importa todavía más es la real: cuánto rinde por encima de la inflación.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('tz', D)}</div>
      <div class="stage"><dl class="stats" id="tz-st" style="margin:0"></dl><canvas id="tz-cv" style="height:300px"></canvas>${A.legend([['amber', 'Renovando con intereses (compuesto)'], ['teal', 'Retirando los intereses (simple)'], ['rose', 'Capital ajustado por inflación']])}<div class="steplist" id="tz-steps"></div></div></div>`,
    init() { A.bindSliders('tz', D, st, upd); upd(); },
    draw
  });
  const calc = () => {
    const i = st.tna / 100 * st.d / 365, tea = Math.pow(1 + i, 365 / st.d) - 1, tem = Math.pow(1 + tea, 30 / 365) - 1, infA = Math.pow(1 + st.inf / 100, 12) - 1;
    const real = (1 + tem) / (1 + st.inf / 100) - 1, realA = (1 + tea) / (1 + infA) - 1, days = st.m * 30.4167;
    const comp = st.C * Math.pow(1 + tea, days / 365), simp = st.C * (1 + st.tna / 100 * days / 365), need = st.C * Math.pow(1 + st.inf / 100, st.m);
    return { i, tea, tem, infA, real, realA, comp, simp, need };
  };
  function upd() {
    const r = calc();
    $('#tz-st').innerHTML = A.stats([['Interés por colocación', money(st.C * r.i)], ['TEM', pct(r.tem, 2)], ['TEA', pct(r.tea, 2)], ['Tasa real mensual', pct(r.real, 2)], ['Tasa real anual', pct(r.realA, 2)], [`Capital a ${st.m} meses`, money(r.comp)]]);
    $('#tz-steps').innerHTML = A.steps([
      `Tasa del período: TNA × días/365 = ${f2(st.tna)}% × ${st.d}/365 = <b>${pct(r.i, 3)}</b>. Por $${fmt(st.C, 0)} cobrás <b>${money(st.C * r.i)}</b> en ${st.d} días.`,
      `Si renovás capital + intereses todo el año: TEA = (1 + ${fmt(r.i, 5)})^(365/${st.d}) − 1 = <b>${pct(r.tea, 2)}</b>. Es más que la TNA porque cobrás interés sobre el interés.`,
      `Tasa efectiva mensual equivalente: TEM = (1 + TEA)^(30/365) − 1 = <b>${pct(r.tem, 2)}</b>.`,
      `Tasa real (ecuación de Fisher): (1 + TEM)/(1 + π) − 1 = (1 + ${pct(r.tem, 2)})/(1 + ${f2(st.inf)}%) − 1 = <b>${pct(r.real, 2)}</b> por mes. ${r.real >= 0 ? 'Le ganás a la inflación.' : '<b>Perdés contra la inflación:</b> tu plata compra menos al final.'} Ojo: la aproximación "tasa menos inflación" (${pct(r.tem - st.inf / 100, 2)}) falla cuando las tasas son altas.`,
      `Para no perder poder de compra en ${st.m} meses necesitás llegar a ${money(r.need)}; con la colocación llegás a ${money(r.comp)}.`]);
    draw();
  }
  function draw() {
    const r = calc(), N = st.m, pts = Array.from({ length: N + 1 }, (_, t) => t), d = t => t * 30.4167;
    const comp = pts.map(t => [t, st.C * Math.pow(1 + r.tea, d(t) / 365)]), simp = pts.map(t => [t, st.C * (1 + st.tna / 100 * d(t) / 365)]), need = pts.map(t => [t, st.C * Math.pow(1 + st.inf / 100, t)]);
    const vals = [...comp, ...simp, ...need].map(p => p[1]);
    const g = A.ax($('#tz-cv'), [0, N], [Math.min(...vals) * .97, Math.max(...vals) * 1.03], { l: 80, yf: v => '$' + fmt(v, 0), xf: v => fmt(v, 0) + 'm' }); if (!g) return;
    g.path(need, K.rose, 2, [6, 4]); g.path(simp, K.teal, 2); g.path(comp, K.amber, 2.4); g.labels('Meses', '');
  }
}

/* ================= VAN y TIR ================= */
{
  const st = { r: 10, flows: [-1000, 300, 400, 400, 300] };
  const npv = (r, fl = st.flows) => fl.reduce((s, f, t) => s + f / Math.pow(1 + r, t), 0);
  const irrs = () => { const out = []; let prev = npv(-.95), pr = -.95; for (let r = -.94; r <= 3; r += .002) { const v = npv(r); if (Math.sign(v) !== Math.sign(prev)) { let lo = pr, hi = r; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; Math.sign(npv(m)) === Math.sign(npv(lo)) ? lo = m : hi = m; } out.push((lo + hi) / 2); } prev = v; pr = r; } return out; };
  const payback = disc => { let acc = 0; for (let t = 0; t < st.flows.length; t++) { const f = disc ? st.flows[t] / Math.pow(1 + st.r / 100, t) : st.flows[t]; const prev = acc; acc += f; if (t > 0 && prev < 0 && acc >= 0) return t - 1 + (-prev / f); } return NaN; };
  A.tool({
    id: 'van', mat: 'finanzas', unit: 2, name: 'VAN, TIR y período de recupero', short: 'VAN y TIR', tag: 'Evaluación de proyectos', f: 'VAN = Σ Fₜ/(1 + r)ᵗ',
    desc: 'Cargá los flujos de un proyecto y calculá VAN, TIR, recupero simple y descontado, con el perfil del VAN.',
    lead: 'Un peso hoy vale más que un peso mañana. El VAN trae todos los flujos al presente con la tasa que te exigís (el costo de oportunidad): si da positivo, el proyecto crea valor. La TIR es la tasa que hace el VAN igual a cero.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Flujos de fondos por año</label><div id="vn-fl" style="display:flex;flex-direction:column;gap:6px"></div></div>
      <div class="row"><button class="btn sm" id="vn-add">Agregar año</button><button class="btn sm" id="vn-del">Quitar año</button></div>
      <div><label class="l" for="vn-r">Tasa de descuento = <span id="vn-rv" style="color:var(--fg)">10</span>%</label><input type="range" id="vn-r" min="0" max="60" step=".5" value="10"></div>
      <div class="chips"><button class="chip" data-vn="0">Proyecto típico</button><button class="chip" data-vn="1">Dos TIR (flujos no convencionales)</button><button class="chip" data-vn="2">Mina con cierre costoso</button></div></div>
      <div class="stage"><dl class="stats" id="vn-st" style="margin:0"></dl><h3>Perfil del VAN</h3><canvas id="vn-cv" style="height:300px"></canvas><div class="steplist" id="vn-steps"></div></div></div>`,
    init() {
      const PRE = [[-1000, 300, 400, 400, 300], [-100, 230, -132], [-500, 300, 300, 300, -450]];
      $$('[data-vn]').forEach(b => b.onclick = () => { st.flows = [...PRE[+b.dataset.vn]]; rows(); });
      $('#vn-add').onclick = () => { if (st.flows.length < 16) { st.flows.push(st.flows[st.flows.length - 1] || 100); rows(); } };
      $('#vn-del').onclick = () => { if (st.flows.length > 2) { st.flows.pop(); rows(); } };
      $('#vn-r').oninput = e => { st.r = +e.target.value; $('#vn-rv').textContent = fmt(st.r, 1); upd(); };
      rows();
    },
    draw
  });
  function rows() { $('#vn-fl').innerHTML = st.flows.map((f, t) => `<div class="row" style="flex-wrap:nowrap"><span class="mono muted" style="width:56px">año ${t}</span><input class="field" data-t="${t}" value="${String(f).replace('.', ',')}"></div>`).join(''); $$('#vn-fl input').forEach(i => i.oninput = () => { const v = A.num(i.value); if (Number.isFinite(v)) { st.flows[+i.dataset.t] = v; upd(); } }); upd(); }
  function upd() {
    const r = st.r / 100, v = npv(r), ir = irrs(), pv = st.flows.slice(1).reduce((s, f, t) => s + f / Math.pow(1 + r, t + 1), 0), pb = payback(false), pbd = payback(true);
    $('#vn-st').innerHTML = A.stats([['VAN', money(v)], ['TIR', ir.length ? ir.map(x => pct(x, 2)).join(' y ') : 'No existe'], ['Recupero simple', Number.isFinite(pb) ? f2(pb) + ' años' : '—'], ['Recupero descontado', Number.isFinite(pbd) ? f2(pbd) + ' años' : '—'], ['Índice de rentabilidad', st.flows[0] < 0 ? f2(pv / -st.flows[0]) : '—']]);
    $('#vn-steps').innerHTML = A.steps([
      `Descuento cada flujo: ${st.flows.slice(0, 5).map((f, t) => `${f2(f)}/(1 + ${fmt(r, 3)})^${t}`).join(' + ')}${st.flows.length > 5 ? ' + …' : ''}.`,
      `Sumando: VAN = <b>${money(v)}</b>. ${v > 0 ? 'Positivo: el proyecto rinde más que la tasa exigida, <b>conviene</b>.' : v < 0 ? 'Negativo: rinde menos que la alternativa, <b>no conviene</b>.' : 'Cero: rinde exactamente la tasa exigida.'}`,
      ir.length === 1 ? `La TIR es <b>${pct(ir[0], 2)}</b>: la tasa a la que el VAN da cero (donde la curva corta el eje). Regla: si la TIR supera la tasa exigida, conviene.` : ir.length > 1 ? `Hay <b>${ir.length} TIR</b> (${ir.map(x => pct(x, 2)).join(' y ')}) porque los flujos cambian de signo más de una vez. En estos casos la TIR no sirve para decidir: usá el VAN.` : 'No hay ninguna tasa que haga cero el VAN, así que la TIR no existe.',
      `El recupero simple ignora el valor del dinero en el tiempo y los flujos posteriores; el descontado corrige lo primero. Los dos son indicadores de riesgo, no de rentabilidad.`]);
    draw();
  }
  function draw() {
    const ir = irrs(), rm = Math.max(.6, ...ir.map(x => x * 1.3)), vs = Array.from({ length: 200 }, (_, i) => npv(i / 199 * rm));
    const g = A.ax($('#vn-cv'), [0, rm], [Math.min(0, ...vs) * 1.1 - 1, Math.max(0, ...vs) * 1.1 + 1], { l: 62, xf: v => pct(v, 0), yf: v => '$' + fmt(v, 0) }); if (!g) return;
    g.hline(0, K.faint, 1); g.fn(r => npv(r), K.amber); ir.forEach(x => { g.dot(x, 0, K.teal, 5.5); g.text('TIR', x, 0, K.teal); });
    g.dot(st.r / 100, npv(st.r / 100), K.fg, 6); g.guide(st.r / 100, npv(st.r / 100)); g.labels('Tasa de descuento', 'VAN');
  }
}

/* ================= Sistemas de amortización ================= */
{
  const st = { sys: 'fr' };
  const D = [['P', 'Monto del préstamo ($)', 100000, 50000000, 100000, 5000000, 0], ['tna', 'TNA (%)', 1, 120, .5, 40, 1], ['n', 'Cantidad de cuotas mensuales', 3, 120, 1, 24, 0]];
  const table = sys => {
    const i = st.tna / 100 / 12, n = st.n; let s = st.P; const rows = [];
    const c = i ? st.P * i / (1 - Math.pow(1 + i, -n)) : st.P / n;
    for (let k = 1; k <= n; k++) { const int = s * i; let am; if (sys === 'fr') am = c - int; else if (sys === 'al') am = st.P / n; else am = k === n ? st.P : 0; rows.push({ k, cuota: am + int, int, am, saldo: s - am }); s -= am; }
    return rows;
  };
  const NAMES = { fr: 'Francés', al: 'Alemán', am: 'Americano' };
  A.tool({
    id: 'amortizacion', mat: 'finanzas', unit: 3, name: 'Sistemas de amortización', short: 'Amortización', tag: 'Préstamos', f: 'cuota = P·i / (1 − (1+i)⁻ⁿ)',
    desc: 'Francés, alemán y americano: cuadro de marcha completo, composición de cada cuota y cuánto interés pagás en total.',
    lead: 'Cada cuota tiene dos partes: interés (sobre lo que todavía debés) y amortización (lo que devolvés del capital). Los sistemas cambian cómo se reparten. El francés es el de los créditos personales e hipotecarios en Argentina.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Sistema</label>${A.seg('am-s', [['fr', 'Francés'], ['al', 'Alemán'], ['am', 'Americano']], 'fr')}</div>${A.sliders('am', D)}<div class="tbl-wrap"><table class="tbl" id="am-cmp"></table></div></div>
      <div class="stage"><dl class="stats" id="am-st" style="margin:0"></dl><h3>Composición de cada cuota</h3><canvas id="am-cv" style="height:260px"></canvas>${A.legend([['amber', 'Interés'], ['teal', 'Amortización de capital']])}
      <div class="explain" id="am-exp"></div><div class="tbl-wrap" style="max-height:340px;overflow-y:auto"><table class="tbl" id="am-tbl"></table></div></div></div>`,
    init() { A.bindSliders('am', D, st, upd); A.segBind('am-s', v => { st.sys = v; upd(); }); upd(); },
    draw
  });
  function upd() {
    const rows = table(st.sys), tot = rows.reduce((s, r) => s + r.int, 0), i = st.tna / 100 / 12;
    $('#am-st').innerHTML = A.stats([['Primera cuota', money(rows[0].cuota)], ['Última cuota', money(rows[rows.length - 1].cuota)], ['Interés total', money(tot)], ['Total pagado', money(st.P + tot)]]);
    $('#am-cmp').innerHTML = `<tr><th>Sistema</th><th>1.ª cuota</th><th>Interés total</th></tr>` + Object.keys(NAMES).map(k => { const r = table(k); return `<tr class="${k === st.sys ? 'best' : ''}"><td>${NAMES[k]}</td><td>${money(r[0].cuota)}</td><td>${money(r.reduce((s, x) => s + x.int, 0))}</td></tr>`; }).join('');
    $('#am-exp').innerHTML = st.sys === 'fr' ? `<p><b>Francés:</b> cuota fija. Tasa mensual i = ${f2(st.tna)}%/12 = ${pct(i, 3)}. Cuota = ${money(st.P)} × ${fmt(i, 5)} / (1 − (1 + ${fmt(i, 5)})^−${st.n}) = <b>${money(rows[0].cuota)}</b>. Al principio casi todo es interés y al final casi todo es capital.</p>`
      : st.sys === 'al' ? `<p><b>Alemán:</b> amortización fija de ${money(st.P / st.n)} por mes. Como el saldo baja, el interés baja y la cuota es decreciente. Se paga menos interés total que en el francés, pero las primeras cuotas son más altas.</p>`
      : `<p><b>Americano:</b> durante todo el plazo pagás solo intereses (${money(st.P * i)} por mes) y devolvés el capital entero en la última cuota. Es como funcionan muchos bonos. Es el que más interés total paga.</p>`;
    $('#am-tbl').innerHTML = `<tr><th>Cuota</th><th>Valor</th><th>Interés</th><th>Amortización</th><th>Saldo</th></tr>` + rows.map(r => `<tr><td>${r.k}</td><td>${money(r.cuota)}</td><td>${money(r.int)}</td><td>${money(r.am)}</td><td>${money(Math.max(0, r.saldo))}</td></tr>`).join('');
    draw();
  }
  function draw() {
    const rows = table(st.sys), mx = Math.max(...rows.map(r => r.cuota)) * 1.08;
    const g = A.ax($('#am-cv'), [.5, rows.length + .5], [0, mx], { l: 80, yf: v => '$' + fmt(v, 0), xt: 6, xf: v => fmt(v, 0) }); if (!g) return;
    const bw = Math.max(1, (g.X(2) - g.X(1)) * .75);
    rows.forEach(r => { g.c.fillStyle = K.teal; g.c.fillRect(g.X(r.k) - bw / 2, g.Y(r.am), bw, g.Y(0) - g.Y(r.am)); g.c.fillStyle = K.amber; g.c.fillRect(g.X(r.k) - bw / 2, g.Y(r.am + r.int), bw, g.Y(r.am) - g.Y(r.am + r.int)); });
  }
}

/* ================= Bonos ================= */
{
  const st = {};
  const D = [['cup', 'Cupón anual (%)', 0, 20, .25, 8, 2], ['T', 'Años al vencimiento', 1, 30, 1, 10, 0], ['k', 'Pagos por año', 1, 4, 1, 2, 0], ['y', 'TIR del mercado (%)', .5, 30, .05, 10, 2]];
  const price = (y, c = st.cup, T = st.T, k = st.k) => { const n = T * k, C = c / k, j = y / 100 / k; let p = 0; for (let t = 1; t <= n; t++) p += C / Math.pow(1 + j, t); return p + 100 / Math.pow(1 + j, n); };
  const risk = y => { const n = st.T * st.k, C = st.cup / st.k, j = y / 100 / st.k, P = price(y); let d = 0, cx = 0; for (let t = 1; t <= n; t++) { const cf = C + (t === n ? 100 : 0), pv = cf / Math.pow(1 + j, t); d += t / st.k * pv; cx += cf * t * (t + 1) / Math.pow(1 + j, t + 2); } const mac = d / P; return { P, mac, mod: mac / (1 + j), conv: cx / (P * st.k * st.k) }; };
  A.tool({
    id: 'bonos', mat: 'finanzas', unit: 4, name: 'Bonos: precio, TIR, duration y convexidad', short: 'Bonos', tag: 'Renta fija', f: 'ΔP/P ≈ −Dmod·Δy + ½·C·Δy²',
    desc: 'Valuá un bono con cupones, mirá la relación inversa entre precio y tasa, y medí su sensibilidad con duration y convexidad.',
    lead: 'El precio de un bono es el valor presente de sus cupones y de la devolución del capital, descontados a la TIR que exige el mercado. Cuando las tasas suben, los bonos caen, y más cuanto más largos son.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('bn', D)}<div><label class="l" for="bn-p">¿Y si te dan el precio? Precio de mercado</label><div class="row"><input class="field" id="bn-p" value="95" style="width:110px"><span class="out" id="bn-pt"></span></div></div></div>
      <div class="stage"><dl class="stats" id="bn-st" style="margin:0"></dl><canvas id="bn-cv" style="height:340px"></canvas>${A.legend([['amber', 'Precio según la TIR'], ['rose', 'Aproximación por duration (recta)'], ['violet', 'Duration + convexidad']])}<div class="steplist" id="bn-steps"></div></div></div>`,
    init() { A.bindSliders('bn', D, st, upd); $('#bn-p').oninput = upd; upd(); },
    draw
  });
  function upd() {
    const r = risk(st.y), dP = -r.mod * 1 / 100 + .5 * r.conv * (1 / 100) ** 2, mp = A.num($('#bn-p').value);
    let ytm = NaN; if (mp > 0) { let lo = -.99 * 100 * st.k + .01, hi = 500; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; price(m) > mp ? lo = m : hi = m; } ytm = (lo + hi) / 2; }
    $('#bn-pt').innerHTML = Number.isFinite(ytm) ? `→ TIR = <b>${f2(ytm)}%</b>` : '';
    $('#bn-st').innerHTML = A.stats([['Precio (cada 100 VN)', f2(r.P)], ['Duration de Macaulay', f2(r.mac) + ' años'], ['Duration modificada', f2(r.mod)], ['Convexidad', f2(r.conv)], ['Si la TIR sube 1 pp', pct(dP, 2)]]);
    $('#bn-steps').innerHTML = A.steps([
      `Paga ${f2(st.cup / st.k)} cada período (${st.k} por año) durante ${st.T * st.k} períodos y devuelve 100 al final. Tasa por período: ${f2(st.y)}%/${st.k} = ${pct(st.y / 100 / st.k, 3)}.`,
      `Precio = Σ cupón/(1 + j)ᵗ + 100/(1 + j)ⁿ = <b>${f2(r.P)}</b>. ${r.P > 100.005 ? 'Cotiza <b>sobre la par</b> porque el cupón paga más que lo que exige el mercado.' : r.P < 99.995 ? 'Cotiza <b>bajo la par</b> porque el cupón paga menos que lo que exige el mercado.' : 'Cotiza a la par: cupón igual a TIR.'}`,
      `Duration de Macaulay = ${f2(r.mac)} años: el plazo promedio en que cobrás, ponderado por valor presente. Es menor al vencimiento porque los cupones llegan antes.`,
      `Duration modificada = ${f2(r.mod)}: si la TIR sube 1 punto, el precio cae aproximadamente ${f2(r.mod)}%. Con la convexidad (${f2(r.conv)}) la cuenta afinada da <b>${pct(dP, 2)}</b>.`,
      `La curva es convexa: el precio sube más cuando la tasa baja de lo que cae cuando la tasa sube. Eso le juega a favor al tenedor.`]);
    draw();
  }
  function draw() {
    const r = risk(st.y), ym = 30, ps = Array.from({ length: 100 }, (_, i) => price(.5 + i * ym / 100));
    const g = A.ax($('#bn-cv'), [0, ym], [0, Math.max(...ps) * 1.08], { xf: v => fmt(v, 0) + '%', l: 46 }); if (!g) return;
    g.hline(100, K.faint, 1, [3, 4]);
    g.fn(y => r.P * (1 - r.mod * (y - st.y) / 100), K.rose, 1.4, [6, 4]);
    g.fn(y => r.P * (1 - r.mod * (y - st.y) / 100 + .5 * r.conv * ((y - st.y) / 100) ** 2), K.violet, 1.4, [3, 3]);
    g.fn(y => price(y), K.amber, 2.4, null, [.05, ym]); g.guide(st.y, r.P); g.dot(st.y, r.P, K.fg, 6); g.labels('TIR', 'Precio');
  }
}

/* ================= Markowitz ================= */
{
  const st = {};
  const D = [['e1', 'Activo 1: retorno esperado (%)', 0, 30, .5, 8, 1], ['s1', 'Activo 1: volatilidad (%)', 1, 60, .5, 12, 1], ['e2', 'Activo 2: retorno esperado (%)', 0, 30, .5, 14, 1], ['s2', 'Activo 2: volatilidad (%)', 1, 60, .5, 25, 1], ['rho', 'Correlación ρ', -1, 1, .05, .2, 2], ['rf', 'Tasa libre de riesgo (%)', 0, 15, .25, 3, 2], ['w', 'Peso en el activo 1 (tu cartera)', -.5, 1.5, .01, .6, 2]];
  const port = w => { const e = w * st.e1 + (1 - w) * st.e2, v = w * w * st.s1 ** 2 + (1 - w) ** 2 * st.s2 ** 2 + 2 * w * (1 - w) * st.rho * st.s1 * st.s2; return { e, s: Math.sqrt(Math.max(0, v)) }; };
  const keyW = () => {
    const { s1, s2, rho } = st, cov = rho * s1 * s2, den = s1 * s1 + s2 * s2 - 2 * cov, wmin = den > 1e-12 ? (s2 * s2 - cov) / den : .5;
    const x1 = st.e1 - st.rf, x2 = st.e2 - st.rf, dt = x1 * s2 * s2 + x2 * s1 * s1 - (x1 + x2) * cov, wt = Math.abs(dt) > 1e-12 ? (x1 * s2 * s2 - x2 * cov) / dt : NaN;
    return { wmin, wt };
  };
  A.tool({
    id: 'markowitz', mat: 'finanzas', unit: 5, name: 'Frontera eficiente de Markowitz', short: 'Markowitz', tag: 'Diversificación', f: 'σ²ₚ = w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂',
    desc: 'Combiná dos activos y mirá cómo la diversificación baja el riesgo. Cartera de mínima varianza, cartera tangente y línea del mercado de capitales.',
    lead: 'El riesgo de una cartera no es el promedio de los riesgos: depende de cuánto se mueven juntos los activos. Con correlación menor a 1, combinar reduce la volatilidad sin resignar tanto retorno. Es la única comida gratis de las finanzas.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('mz', D)}<dl class="stats" id="mz-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="mz-cv" style="height:420px"></canvas>${A.legend([['amber', 'Combinaciones posibles'], ['violet', 'Línea del mercado de capitales'], ['teal', 'Mínima varianza'], ['rose', 'Cartera tangente (máximo Sharpe)']])}<div class="steplist" id="mz-steps"></div></div></div>`,
    init() { A.bindSliders('mz', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { wmin, wt } = keyW(), m = port(wmin), t = port(wt), p = port(st.w), sh = (t.e - st.rf) / t.s;
    $('#mz-st').innerHTML = A.stats([['Tu cartera: retorno', f2(p.e) + '%'], ['Tu cartera: volatilidad', f2(p.s) + '%'], ['Sharpe de tu cartera', f2((p.e - st.rf) / p.s)], ['Mínima varianza: w₁', pct(wmin, 1)], ['Tangente: w₁', Number.isFinite(wt) ? pct(wt, 1) : '—'], ['Sharpe máximo', Number.isFinite(sh) ? f2(sh) : '—']]);
    $('#mz-steps').innerHTML = A.steps([
      `Retorno de la cartera: promedio ponderado = ${f2(st.w)}×${f2(st.e1)} + ${f2(1 - st.w)}×${f2(st.e2)} = <b>${f2(p.e)}%</b>.`,
      `Varianza: w₁²σ₁² + w₂²σ₂² + 2w₁w₂ρσ₁σ₂ → volatilidad <b>${f2(p.s)}%</b>. El promedio simple de volatilidades daría ${f2(st.w * st.s1 + (1 - st.w) * st.s2)}%: la diferencia es el beneficio de diversificar.`,
      `Cartera de mínima varianza: w₁ = (σ₂² − ρσ₁σ₂)/(σ₁² + σ₂² − 2ρσ₁σ₂) = <b>${pct(wmin, 1)}</b>. Ninguna combinación tiene menos riesgo. Lo que está debajo de ella en la curva es ineficiente.`,
      `Si existe un activo libre de riesgo, lo óptimo es combinarlo con la <b>cartera tangente</b> (la de mayor Sharpe): eso forma la línea del mercado de capitales, que domina a toda la curva.`,
      `Probá ρ = −1: se puede armar una cartera con riesgo cero. Con ρ = 1 no hay ningún beneficio de diversificar.`]);
    draw();
  }
  function draw() {
    const pts = Array.from({ length: 201 }, (_, i) => { const w = -.5 + i * 2 / 200, p = port(w); return [p.s, p.e]; }), { wmin, wt } = keyW();
    const xm = Math.max(...pts.map(p => p[0])) * 1.05, ys = pts.map(p => p[1]);
    const g = A.ax($('#mz-cv'), [0, xm], [Math.min(0, ...ys, st.rf) - 1, Math.max(...ys) * 1.1], { xf: v => fmt(v, 0) + '%', yf: v => fmt(v, 0) + '%', l: 46 }); if (!g) return;
    const t = port(wt); if (Number.isFinite(wt) && t.e > st.rf) g.fn(s => st.rf + (t.e - st.rf) / t.s * s, K.violet, 1.6, [6, 4]);
    g.path(pts.filter((_, i) => { const w = -.5 + i * 2 / 200; return w >= 0 && w <= 1; }), K.amber, 2.6); g.path(pts, 'rgba(242,169,59,.35)', 1.4);
    g.dot(st.s1, st.e1, K.fg, 4.5); g.text('activo 1', st.s1, st.e1, K.fg); g.dot(st.s2, st.e2, K.fg, 4.5); g.text('activo 2', st.s2, st.e2, K.fg);
    const m = port(wmin); g.dot(m.s, m.e, K.teal, 6); if (Number.isFinite(wt)) g.dot(t.s, t.e, K.rose, 6); g.dot(0, st.rf, K.violet, 5);
    const p = port(st.w); g.dot(p.s, p.e, K.amber, 7); g.text('tu cartera', p.s, p.e, K.amber, 'left', 'top', 8, 6); g.labels('Volatilidad σ', 'Retorno esperado');
  }
}

/* ================= CAPM ================= */
{
  const st = {};
  const D = [['rf', 'Tasa libre de riesgo (%)', 0, 10, .25, 4, 2], ['rm', 'Retorno esperado del mercado (%)', 2, 20, .25, 10, 2], ['beta', 'Beta real de la acción', -.5, 2.5, .05, 1.3, 2], ['sid', 'Riesgo propio de la acción (%)', 0, 15, .5, 5, 1]];
  let sim = null;
  A.tool({
    id: 'capm', mat: 'finanzas', unit: 5, name: 'CAPM y estimación de beta', short: 'CAPM', tag: 'Riesgo sistemático', f: 'E(Rᵢ) = r_f + β(E(Rₘ) − r_f)',
    desc: 'La línea del mercado de valores y cómo se estima la beta de una acción con una regresión sobre el mercado.',
    lead: 'Según el CAPM, el mercado solo te paga por el riesgo que no se puede diversificar: cuánto se mueve la acción con el mercado (beta). El riesgo propio de la empresa se elimina diversificando, así que no tiene premio.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('cap', D)}<button class="btn sm" id="cap-go" style="align-self:flex-start">Simular 60 meses nuevos</button><dl class="stats" id="cap-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Línea del mercado de valores</h3><canvas id="cap-sml" style="height:300px"></canvas></div><div><h3>Estimar beta: acción vs. mercado</h3><canvas id="cap-reg" style="height:300px"></canvas></div></div><div class="steplist" id="cap-steps"></div></div></div>`,
    init() { A.bindSliders('cap', D, st, k => { if (k === 'beta' || k === 'sid') simulate(); else upd(); }); $('#cap-go').onclick = simulate; simulate(); },
    draw
  });
  function simulate() {
    const rm = [], ri = []; for (let t = 0; t < 60; t++) { const m = .7 + 4.5 * S.rnorm(); rm.push(m); ri.push(.2 + st.beta * m + st.sid * S.rnorm()); }
    const mx = rm.reduce((s, v) => s + v, 0) / 60, my = ri.reduce((s, v) => s + v, 0) / 60; let sxy = 0, sxx = 0, syy = 0;
    rm.forEach((x, i) => { sxx += (x - mx) ** 2; sxy += (x - mx) * (ri[i] - my); syy += (ri[i] - my) ** 2; });
    const b = sxy / sxx, a = my - b * mx, r2 = sxy * sxy / (sxx * syy), se = Math.sqrt((syy - b * sxy) / 58 / sxx);
    sim = { rm, ri, b, a, r2, se }; upd();
  }
  function upd() {
    const er = st.rf + st.beta * (st.rm - st.rf);
    $('#cap-st').innerHTML = A.stats([['Retorno exigido (CAPM)', f2(er) + '%'], ['Prima de mercado', f2(st.rm - st.rf) + '%'], ['Beta estimada', sim ? `${f2(sim.b)} ± ${f2(1.96 * sim.se)}` : '—'], ['R² (riesgo sistemático)', sim ? pct(sim.r2, 0) : '—']]);
    $('#cap-steps').innerHTML = A.steps([
      `Retorno exigido = r_f + β × (E(Rₘ) − r_f) = ${f2(st.rf)} + ${f2(st.beta)} × (${f2(st.rm)} − ${f2(st.rf)}) = <b>${f2(er)}%</b>.`,
      `Beta ${st.beta > 1 ? `mayor a 1: la acción amplifica los movimientos del mercado (si el mercado sube 1%, ella sube ${f2(st.beta)}% en promedio). Es agresiva y por eso se le exige más.` : st.beta < 0 ? 'negativa: se mueve en contra del mercado. Funciona como un seguro, por eso se le exige menos que a la tasa libre de riesgo.' : st.beta < 1 ? 'menor a 1: la acción es defensiva, se mueve menos que el mercado.' : 'igual a 1: se mueve como el mercado.'}`,
      `Para estimarla en la práctica: regresión de los retornos de la acción sobre los del mercado (60 meses). La pendiente es la beta: <b>${sim ? f2(sim.b) : '—'}</b> (la real es ${f2(st.beta)}). El R² de ${sim ? pct(sim.r2, 0) : '—'} es la parte del riesgo que es sistemática; el resto es riesgo propio, diversificable.`,
      `Una acción que rinde más de lo que dice la línea tiene <b>alfa positivo</b> (está barata); una que rinde menos, alfa negativo.`]);
    draw();
  }
  function draw() {
    const g = A.ax($('#cap-sml'), [-.5, 2.5], [Math.min(0, st.rf - .5 * (st.rm - st.rf)) - 1, st.rf + 2.5 * (st.rm - st.rf) + 2], { xf: v => fmt(v, 1), yf: v => fmt(v, 0) + '%', l: 40 });
    if (g) { g.fn(b => st.rf + b * (st.rm - st.rf), K.violet); g.dot(0, st.rf, K.fg, 4.5); g.text('r_f', 0, st.rf, K.fg); g.dot(1, st.rm, K.fg, 4.5); g.text('mercado', 1, st.rm, K.fg); const er = st.rf + st.beta * (st.rm - st.rf); g.guide(st.beta, er); g.dot(st.beta, er, K.amber, 6); g.labels('Beta', 'Retorno esperado'); }
    if (!sim) return; const all = [...sim.rm, ...sim.ri], lo = Math.min(...all) - 1, hi = Math.max(...all) + 1;
    const r = A.ax($('#cap-reg'), [Math.min(...sim.rm) - 1, Math.max(...sim.rm) + 1], [lo, hi], { xf: v => fmt(v, 0) + '%', yf: v => fmt(v, 0) + '%', l: 40 });
    if (r) { r.hline(0, K.faint, 1); r.vline(0, K.faint, 1); sim.rm.forEach((x, i) => r.dot(x, sim.ri[i], K.teal, 3)); r.fn(x => sim.a + sim.b * x, K.amber); r.labels('Retorno del mercado', 'Retorno de la acción'); }
  }
}

/* ================= Opciones y Black-Scholes ================= */
{
  const st = { strat: 'call' };
  const D = [['S', 'Precio actual de la acción', 10, 200, 1, 100, 0], ['K', 'Precio de ejercicio K', 10, 200, 1, 100, 0], ['T', 'Tiempo al vencimiento (años)', .02, 2, .01, .5, 2], ['r', 'Tasa libre de riesgo (%)', 0, 20, .25, 5, 2], ['v', 'Volatilidad σ (%)', 5, 120, 1, 30, 0], ['w', 'Ancho de los spreads', 2, 40, 1, 15, 0]];
  const N = x => S.normCdf(x), n = x => S.normPdf(x);
  const bs = (Sx, Kx, T = st.T, r = st.r / 100, v = st.v / 100) => {
    if (T <= 1e-9) return { c: Math.max(0, Sx - Kx), p: Math.max(0, Kx - Sx) };
    const d1 = (Math.log(Sx / Kx) + (r + v * v / 2) * T) / (v * Math.sqrt(T)), d2 = d1 - v * Math.sqrt(T);
    return { d1, d2, c: Sx * N(d1) - Kx * Math.exp(-r * T) * N(d2), p: Kx * Math.exp(-r * T) * N(-d2) - Sx * N(-d1) };
  };
  const STR = {
    call: { lab: 'Call comprado', legs: () => [['c', st.K, 1]], d: 'Ganás si la acción sube por encima de K + prima. Pérdida máxima: la prima.' },
    put: { lab: 'Put comprado', legs: () => [['p', st.K, 1]], d: 'Ganás si la acción baja. Sirve como seguro contra caídas.' },
    scall: { lab: 'Call vendido', legs: () => [['c', st.K, -1]], d: 'Cobrás la prima y apostás a que no suba. Pérdida potencial ilimitada.' },
    straddle: { lab: 'Straddle', legs: () => [['c', st.K, 1], ['p', st.K, 1]], d: 'Call + put al mismo K: ganás si se mueve mucho para cualquier lado. Es una apuesta a la volatilidad.' },
    bull: { lab: 'Bull spread', legs: () => [['c', st.K, 1], ['c', st.K + st.w, -1]], d: 'Comprás un call y vendés otro más caro: ganancia y pérdida limitadas, más barato que el call solo.' },
    cov: { lab: 'Lanzamiento cubierto', legs: () => [['s', 0, 1], ['c', st.K, -1]], d: 'Tenés la acción y vendés un call: cobrás prima a cambio de resignar la suba por encima de K. Muy usado en el mercado argentino.' },
    prot: { lab: 'Put protectivo', legs: () => [['s', 0, 1], ['p', st.K, 1]], d: 'Acción + put: si cae, el put te cubre. Es asegurar la cartera.' }
  };
  const legVal = ([t, Kx, q], Sx, T) => q * (t === 's' ? Sx : t === 'c' ? bs(Sx, Kx, T).c : bs(Sx, Kx, T).p);
  const cost = () => STR[st.strat].legs().reduce((s, l) => s + legVal(l, st.S, st.T), 0);
  A.tool({
    id: 'opciones', mat: 'finanzas', unit: 6, name: 'Opciones: estrategias y Black-Scholes', short: 'Opciones', tag: 'Derivados', f: 'C = S·N(d₁) − K·e^(−rT)·N(d₂)',
    desc: 'Diagramas de ganancia de las estrategias clásicas, precio teórico con Black-Scholes y las griegas.',
    lead: 'Un call da el derecho (no la obligación) de comprar a un precio K; un put, de vender. Combinándolos armás apuestas a la suba, a la baja o a la volatilidad. Black-Scholes calcula cuánto vale ese derecho hoy.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Estrategia</label><div class="chips">${Object.entries(STR).map(([k, v]) => `<button class="chip" data-op="${k}">${v.lab}</button>`).join('')}</div></div>${A.sliders('op', D)}</div>
      <div class="stage"><dl class="stats" id="op-st" style="margin:0"></dl><canvas id="op-cv" style="height:360px"></canvas>${A.legend([['amber', 'Resultado al vencimiento'], ['teal', 'Valor hoy (antes de vencer)']])}<div class="steplist" id="op-steps"></div></div></div>`,
    init() { A.bindSliders('op', D, st, upd); $$('[data-op]').forEach(b => b.onclick = () => { st.strat = b.dataset.op; upd(); }); upd(); },
    draw
  });
  function upd() {
    const b = bs(st.S, st.K), r = st.r / 100, v = st.v / 100, sq = Math.sqrt(st.T), c0 = cost();
    $$('[data-op]').forEach(x => x.style.borderColor = x.dataset.op === st.strat ? 'var(--amber)' : '');
    const g = { dc: N(b.d1), dp: N(b.d1) - 1, gm: n(b.d1) / (st.S * v * sq), vg: st.S * n(b.d1) * sq / 100, th: (-st.S * n(b.d1) * v / (2 * sq) - r * st.K * Math.exp(-r * st.T) * N(b.d2)) / 365 };
    $('#op-st').innerHTML = A.stats([['Call (Black-Scholes)', money(b.c)], ['Put (Black-Scholes)', money(b.p)], ['Costo de la estrategia', money(c0)], ['Delta del call', f2(g.dc)], ['Gamma', fmt(g.gm, 4)], ['Vega (por 1 pp de σ)', money(g.vg)], ['Theta del call (por día)', money(g.th)]]);
    $('#op-steps').innerHTML = A.steps([
      `d₁ = [ln(S/K) + (r + σ²/2)·T] / (σ√T) = [ln(${st.S}/${st.K}) + (${fmt(r, 3)} + ${fmt(v * v / 2, 4)})×${f2(st.T)}] / (${fmt(v, 2)}×${fmt(sq, 3)}) = <b>${fmt(b.d1, 4)}</b>; d₂ = d₁ − σ√T = <b>${fmt(b.d2, 4)}</b>.`,
      `Call = S·N(d₁) − K·e^(−rT)·N(d₂) = ${st.S}×${fmt(N(b.d1), 4)} − ${fmt(st.K * Math.exp(-r * st.T), 2)}×${fmt(N(b.d2), 4)} = <b>${money(b.c)}</b>.`,
      `Paridad put-call: C − P = S − K·e^(−rT) → ${money(b.c - b.p)} = ${money(st.S - st.K * Math.exp(-r * st.T))}. Si no se cumpliera, habría arbitraje.`,
      `<b>${STR[st.strat].lab}:</b> ${STR[st.strat].d}`]);
    draw();
  }
  function draw() {
    const legs = STR[st.strat].legs(), c0 = cost(), lo = Math.max(1, st.K * .3), hi = st.K * 1.7 + st.w;
    const pay = Sx => legs.reduce((s, l) => s + legVal(l, Sx, 0), 0) - c0, now = Sx => legs.reduce((s, l) => s + legVal(l, Sx, st.T), 0) - c0;
    const vals = Array.from({ length: 80 }, (_, i) => { const x = lo + (hi - lo) * i / 79; return [pay(x), now(x)]; }).flat(), m = Math.max(5, ...vals.map(Math.abs));
    const g = A.ax($('#op-cv'), [lo, hi], [Math.max(-m, Math.min(...vals)) * 1.1 - 1, Math.min(m, Math.max(...vals)) * 1.1 + 1], { l: 50, yf: v => '$' + fmt(v, 0) }); if (!g) return;
    g.hline(0, K.faint, 1); g.vline(st.K, K.faint, 1, [3, 4]);
    g.fn(now, K.teal, 1.8, [6, 4]); g.fn(pay, K.amber, 2.4); g.dot(st.S, now(st.S), K.fg, 5.5); g.text('hoy', st.S, now(st.S), K.fg); g.labels('Precio de la acción al vencer', 'Ganancia');
  }
}
})();
