/* Asíntota · Modo práctica: ejercicios generados al azar, con corrección y resolución */
(() => {
const { $, $$, fmt } = A;
const f2 = x => fmt(x, 2), f4 = x => fmt(x, 4);
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const parse = s => { s = String(s).trim().replace(/\s/g, '').replace('%', '').replace('−', '-'); if (!s) return NaN; if (/^-?[\d.,]+\/-?[\d.,]+$/.test(s)) { const [p, q] = s.split('/').map(A.num); return p / q; } return A.num(s); };
const D = A.drills = {};
const cf = (k, v) => k === 1 ? v : k + v;
const ok = (x, a, tol) => Math.abs(x - a) <= (tol ?? Math.max(.011, Math.abs(a) * .005));

/* ---------------- Microeconomía ---------------- */
D.mercado = () => {
  const P = ri(5, 30), b = ri(1, 5), d = ri(1, 4), c = ri(-10, 15), a = c + (b + d) * P, Q = a - b * P;
  return { q: `La demanda de un bien es <b>Qd = ${a} − ${cf(b, 'P')}</b> y la oferta es <b>Qs = ${c < 0 ? '−' + -c : c} + ${cf(d, 'P')}</b>. Calculá el precio y la cantidad de equilibrio.`,
    f: [['Precio de equilibrio P*', P], ['Cantidad de equilibrio Q*', Q]],
    s: [`En equilibrio Qd = Qs: ${a} − ${b}P = ${c} + ${d}P.`, `Paso los P a un lado: ${a} − ${c} = ${d}P + ${b}P → ${a - c} = ${b + d}P.`, `P* = ${a - c}/${b + d} = <b>${P}</b>.`, `Reemplazo en la demanda: Q* = ${a} − ${b}×${P} = <b>${Q}</b>. (Con la oferta da lo mismo: ${c} + ${d}×${P} = ${Q}.)`] };
};
D.elasticidad = () => {
  const b = ri(1, 6), P = ri(2, 20), a = b * P + ri(5, 60), Q = a - b * P, E = -b * P / Q;
  return { q: `La demanda es <b>Q = ${a} − ${cf(b, 'P')}</b>. Calculá la elasticidad precio de la demanda (con signo) cuando P = ${P}, y el precio que maximiza el gasto total de los consumidores.`,
    f: [['Elasticidad precio', E, .011], ['Precio que maximiza el gasto', a / (2 * b)]],
    s: [`Con P = ${P}: Q = ${a} − ${b}×${P} = ${Q}.`, `Elasticidad: E = (dQ/dP)·(P/Q) = −${b} × ${P}/${Q} = <b>${f2(E)}</b>. ${Math.abs(E) > 1 ? 'Es elástica: |E| > 1.' : Math.abs(E) < 1 ? 'Es inelástica: |E| < 1.' : 'Es unitaria.'}`, `El gasto P·Q = ${a}P − ${b}P² es máximo donde su derivada se anula: ${a} − ${2 * b}P = 0 → P = <b>${f2(a / (2 * b))}</b>. Ahí la elasticidad es exactamente −1.`] };
};
D.monopolio = () => {
  const b = ri(1, 4), c = ri(2, 20), Q = ri(4, 25), a = c + 2 * b * Q, P = a - b * Q, B = (P - c) * Q;
  return { q: `Un monopolista enfrenta la demanda <b>P = ${a} − ${cf(b, 'Q')}</b> y tiene un costo marginal constante de <b>${c}</b> (sin costos fijos). Calculá la cantidad, el precio y el beneficio que maximizan su ganancia.`,
    f: [['Cantidad Q', Q], ['Precio P', P], ['Beneficio', B]],
    s: [`Ingreso total: IT = P·Q = ${a}Q − ${b}Q². Ingreso marginal: IMg = ${a} − ${2 * b}Q (misma ordenada, el doble de pendiente).`, `Óptimo: IMg = CMg → ${a} − ${2 * b}Q = ${c} → Q = ${a - c}/${2 * b} = <b>${Q}</b>.`, `El precio sale de la demanda: P = ${a} − ${b}×${Q} = <b>${P}</b>.`, `Beneficio = (P − CMg)·Q = (${P} − ${c}) × ${Q} = <b>${B}</b>.`] };
};

/* ---------------- Macroeconomía ---------------- */
D.keynes = () => {
  const c = pick([.5, .6, .75, .8]), C0 = ri(5, 20) * 10, I = ri(5, 30) * 10, G = ri(10, 40) * 10, T = ri(5, 30) * 10, Y = (C0 + I + G - c * T) / (1 - c), k = 1 / (1 - c);
  return { q: `En una economía cerrada: C = ${C0} + ${fmt(c, 2)}·(Y − T), I = ${I}, G = ${G} y T = ${T}. Calculá el ingreso de equilibrio y el multiplicador del gasto.`,
    f: [['Ingreso de equilibrio Y*', Y], ['Multiplicador', k]],
    s: [`Equilibrio: Y = C + I + G = ${C0} + ${fmt(c, 2)}(Y − ${T}) + ${I} + ${G}.`, `Junto las Y: Y − ${fmt(c, 2)}Y = ${C0} − ${fmt(c * T, 2)} + ${I} + ${G} → ${fmt(1 - c, 2)}·Y = ${fmt(C0 - c * T + I + G, 2)}.`, `Y* = ${fmt(C0 - c * T + I + G, 2)}/${fmt(1 - c, 2)} = <b>${f2(Y)}</b>.`, `Multiplicador = 1/(1 − c) = 1/${fmt(1 - c, 2)} = <b>${f2(k)}</b>: cada peso más de gasto autónomo sube el ingreso en ${f2(k)}.`] };
};

/* ---------------- Finanzas ---------------- */
D.tasas = () => {
  const K = ri(2, 20) * 50000, i = pick([4, 5, 6, 8, 10, 12, 15]), n = ri(2, 8), M = K * Math.pow(1 + i / 100, n);
  return { q: `Invertís $${fmt(K, 0)} a una tasa anual de <b>${i}%</b> con capitalización anual durante <b>${n} años</b>. ¿Cuánto tenés al final y cuánto ganaste de intereses?`,
    f: [['Monto final ($)', M, Math.max(1, M * .0005)], ['Intereses ganados ($)', M - K, Math.max(1, M * .0005)]],
    s: [`Interés compuesto: M = C·(1 + i)ⁿ = ${fmt(K, 0)} × (1 + ${fmt(i / 100, 2)})^${n}.`, `(1,${String(i).padStart(2, '0')})^${n} = ${f4(Math.pow(1 + i / 100, n))}.`, `M = ${fmt(K, 0)} × ${f4(Math.pow(1 + i / 100, n))} = <b>$${f2(M)}</b>.`, `Intereses = M − C = <b>$${f2(M - K)}</b>.`] };
};
D.van = () => {
  const I0 = ri(5, 20) * 1000, F = ri(2, 9) * 1000, n = 3, r = pick([8, 10, 12, 15]), fl = [F, F + ri(0, 3) * 500, F + ri(0, 4) * 500], v = fl.reduce((s, x, t) => s + x / Math.pow(1 + r / 100, t + 1), -I0);
  return { q: `Un proyecto requiere una inversión inicial de $${fmt(I0, 0)} y genera flujos de $${fl.map(x => fmt(x, 0)).join(', $')} en los años 1, 2 y 3. Con una tasa de descuento del <b>${r}%</b>, ¿cuál es el VAN? ¿Conviene hacerlo?`,
    f: [['VAN ($)', v, 1]],
    s: [`VAN = −I₀ + Σ Fₜ/(1 + r)ᵗ.`, ...fl.map((x, t) => `Año ${t + 1}: ${fmt(x, 0)}/(1,${r < 10 ? '0' + r : r})^${t + 1} = ${f2(x / Math.pow(1 + r / 100, t + 1))}.`), `VAN = −${fmt(I0, 0)} + ${fl.map((x, t) => f2(x / Math.pow(1 + r / 100, t + 1))).join(' + ')} = <b>$${f2(v)}</b>.`, v > 0 ? 'Como el VAN es positivo, el proyecto conviene: rinde más que la tasa exigida.' : 'Como el VAN es negativo, no conviene: no alcanza a cubrir la tasa exigida.'] };
};
D.bonos = () => {
  const c = pick([4, 5, 6, 8, 10]), y = pick([3, 5, 6, 7, 9, 12]), n = ri(2, 5), cp = c, flows = Array.from({ length: n }, (_, t) => cp + (t === n - 1 ? 100 : 0)), P = flows.reduce((s, x, t) => s + x / Math.pow(1 + y / 100, t + 1), 0);
  return { q: `Un bono de valor nominal 100 paga un cupón anual del <b>${c}%</b> y vence en <b>${n} años</b>. Si la tasa de mercado (TIR exigida) es <b>${y}%</b>, ¿cuánto vale hoy? ¿Cotiza bajo o sobre la par?`,
    f: [['Precio del bono', P, .02]],
    s: [`Flujos: ${flows.map((x, t) => `año ${t + 1}: ${x}`).join(', ')} (el último incluye la devolución del 100).`, `Precio = Σ flujo/(1 + ${fmt(y / 100, 2)})ᵗ = ${flows.map((x, t) => f2(x / Math.pow(1 + y / 100, t + 1))).join(' + ')} = <b>${f2(P)}</b>.`, c > y ? 'El cupón supera a la tasa de mercado, así que cotiza <b>sobre la par</b> (más de 100).' : c < y ? 'El cupón es menor que la tasa de mercado, así que cotiza <b>bajo la par</b> (menos de 100).' : 'Cupón igual a la tasa: cotiza a la par.'] };
};

/* ---------------- Estadística ---------------- */
D['normal-z'] = () => {
  const mu = ri(5, 20) * 10, sd = ri(2, 6) * 5, z = pick([-2, -1.5, -1.2, -1, -.8, -.5, .5, .8, 1, 1.2, 1.5, 1.8, 2]), x = mu + z * sd, p = A.S.normCdf(z);
  return { q: `El tiempo de entrega de una empresa sigue una normal con media <b>${mu}</b> minutos y desvío <b>${sd}</b>. ¿Cuál es el valor z de ${fmt(x, 1)} minutos y qué probabilidad hay de que una entrega tarde <b>como mucho</b> eso?`,
    f: [['Valor z', z, .011], ['P(X ≤ x)', p, .002]],
    s: [`Estandarizo: z = (x − μ)/σ = (${fmt(x, 1)} − ${mu})/${sd} = <b>${f2(z)}</b>.`, `Busco en la tabla Z: Φ(${f2(z)}) = <b>${f4(p)}</b>.${z < 0 ? ` Si tu tabla solo tiene positivos: Φ(${f2(z)}) = 1 − Φ(${f2(-z)}) = 1 − ${f4(1 - p)}.` : ''}`, `O sea, ${fmt(p * 100, 2)}% de las entregas tarda ${fmt(x, 1)} minutos o menos.`] };
};
D.intervalos = () => {
  const n = pick([25, 36, 49, 64, 100]), sd = ri(2, 8) * 5, m = ri(30, 90) * 10, conf = pick([[.90, 1.645], [.95, 1.96], [.99, 2.576]]), e = conf[1] * sd / Math.sqrt(n);
  return { q: `En una muestra de <b>${n}</b> clientes, el gasto promedio fue $${m}. Se sabe que el desvío poblacional es $${sd}. Construí un intervalo de confianza del <b>${conf[0] * 100}%</b> para el gasto medio.`,
    f: [['Límite inferior', m - e, .02], ['Límite superior', m + e, .02]],
    s: [`Con σ conocido se usa z. Para ${conf[0] * 100}% de confianza, z = ${conf[1]}.`, `Error estándar: σ/√n = ${sd}/√${n} = ${sd}/${Math.sqrt(n)} = ${f4(sd / Math.sqrt(n))}.`, `Margen de error: ${conf[1]} × ${f4(sd / Math.sqrt(n))} = ${f2(e)}.`, `Intervalo: ${m} ± ${f2(e)} = <b>[${f2(m - e)}; ${f2(m + e)}]</b>.`] };
};
D.bayes = () => {
  const p = pick([1, 2, 5, 10, 20]) / 100, se = pick([90, 95, 98, 99]) / 100, sp = pick([85, 90, 95, 98]) / 100, pp = se * p + (1 - sp) * (1 - p), post = se * p / pp;
  return { q: `Una enfermedad afecta al <b>${fmt(p * 100, 0)}%</b> de la población. Un test tiene sensibilidad <b>${fmt(se * 100, 0)}%</b> y especificidad <b>${fmt(sp * 100, 0)}%</b>. Si una persona da positivo, ¿qué probabilidad hay de que esté enferma? Respondé en %.`,
    f: [['P(positivo) en %', pp * 100, .05], ['P(enfermo | positivo) en %', post * 100, .1]],
    s: [`P(+) = P(+|E)·P(E) + P(+|sano)·P(sano) = ${fmt(se, 2)}×${fmt(p, 2)} + ${fmt(1 - sp, 2)}×${fmt(1 - p, 2)} = ${f4(pp)} = <b>${fmt(pp * 100, 2)}%</b>.`, `Bayes: P(E|+) = P(+|E)·P(E)/P(+) = ${f4(se * p)}/${f4(pp)} = ${f4(post)} = <b>${fmt(post * 100, 2)}%</b>.`, post < .5 ? 'Aunque el test es bueno, al ser una enfermedad poco común, la mayoría de los positivos son falsos positivos.' : 'Con esta prevalencia, un positivo es bastante confiable.'] };
};
D['va-discreta'] = () => {
  const xs = [0, 1, 2, 3], w = xs.map(() => ri(1, 6)), S = w.reduce((a, b) => a + b, 0), ps = w.map(v => v / S), pr = ps.map(v => Math.round(v * 20) / 20), fix = 1 - pr.slice(0, 3).reduce((a, b) => a + b, 0); pr[3] = Math.round(fix * 100) / 100;
  if (pr[3] < 0) return D['va-discreta']();
  const E = xs.reduce((s, x, i) => s + x * pr[i], 0), E2 = xs.reduce((s, x, i) => s + x * x * pr[i], 0), V = E2 - E * E;
  return { q: `Una variable X (reclamos diarios) toma los valores 0, 1, 2 y 3 con probabilidades <b>${pr.map(v => fmt(v, 2)).join(', ')}</b>. Calculá su esperanza y su varianza.`,
    f: [['E[X]', E], ['Var(X)', V]],
    s: [`E[X] = Σ x·p = ${xs.map((x, i) => `${x}×${fmt(pr[i], 2)}`).join(' + ')} = <b>${f2(E)}</b>.`, `E[X²] = Σ x²·p = ${xs.map((x, i) => `${x * x}×${fmt(pr[i], 2)}`).join(' + ')} = ${f4(E2)}.`, `Var(X) = E[X²] − E[X]² = ${f4(E2)} − ${f2(E)}² = <b>${f4(V)}</b>.`] };
};

/* ---------------- Matemática ---------------- */
D.derivadas = () => {
  const a = ri(-3, 3) || 1, b = ri(-5, 5), c = ri(-8, 8), d = ri(-10, 10), x = ri(-3, 3), d1 = 3 * a * x * x + 2 * b * x + c, d2 = 6 * a * x + 2 * b, s = (k, t) => k === 0 ? '' : `${k < 0 ? ' − ' : ' + '}${Math.abs(k) === 1 && t ? '' : Math.abs(k)}${t}`;
  const fx = `${a === 1 ? '' : a === -1 ? '−' : a}x³${s(b, 'x²')}${s(c, 'x')}${s(d, '')}`;
  return { q: `Dada <b>f(x) = ${fx}</b>, calculá f′(${x}) y f″(${x}). ¿Qué te dice el signo de f″ sobre la curvatura en ese punto?`,
    f: [[`f′(${x})`, d1], [`f″(${x})`, d2]],
    s: [`Derivo término a término (regla de la potencia: xⁿ → n·xⁿ⁻¹): f′(x) = ${3 * a}x² ${2 * b < 0 ? '−' : '+'} ${Math.abs(2 * b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}.`, `f′(${x}) = ${3 * a}×${x * x} ${2 * b < 0 ? '−' : '+'} ${Math.abs(2 * b)}×${x} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = <b>${d1}</b>.`, `f″(x) = ${6 * a}x ${2 * b < 0 ? '−' : '+'} ${Math.abs(2 * b)} → f″(${x}) = <b>${d2}</b>.`, d2 > 0 ? 'Como f″ > 0, la función es convexa (∪) en ese punto.' : d2 < 0 ? 'Como f″ < 0, la función es cóncava (∩) en ese punto.' : 'f″ = 0: puede ser un punto de inflexión.'] };
};
D.lagrange = () => {
  const al = pick([.25, .4, .5, .6, .75]), px = pick([2, 4, 5, 8, 10]), py = pick([1, 2, 4, 5]), M = pick([100, 200, 400, 500, 1000]), x = al * M / px, y = (1 - al) * M / py;
  return { q: `Un consumidor tiene utilidad <b>U = x^${fmt(al, 2)}·y^${fmt(1 - al, 2)}</b>, ingreso $${M}, y los precios son px = ${px} y py = ${py}. ¿Cuánto consume de cada bien?`,
    f: [['x*', x], ['y*', y]],
    s: [`Lagrangiano: L = x^${fmt(al, 2)}y^${fmt(1 - al, 2)} + λ(${M} − ${px}x − ${py}y).`, `Condición de tangencia: TMS = UMgx/UMgy = (${fmt(al, 2)}/${fmt(1 - al, 2)})·(y/x) = px/py = ${px}/${py} → y = ${f2((1 - al) / al * px / py)}·x.`, `Reemplazo en la restricción: ${px}x + ${py}×${f2((1 - al) / al * px / py)}x = ${M} → x* = <b>${f2(x)}</b>.`, `y* = <b>${f2(y)}</b>. Atajo Cobb-Douglas: se gasta en cada bien la fracción del ingreso igual a su exponente: x = α·M/px = ${fmt(al, 2)}×${M}/${px}, y = (1 − α)·M/py.`] };
};
D.sistemas = () => {
  const x = ri(-5, 6), y = ri(-5, 6); let a, b, c, d; do { a = ri(-5, 6); b = ri(-5, 6); c = ri(-5, 6); d = ri(-5, 6); } while (a * d - b * c === 0 || !a || !b || !c || !d);
  const e = a * x + b * y, f = c * x + d * y, det = a * d - b * c, sg = v => v < 0 ? `− ${-v}` : `+ ${v}`;
  return { q: `Resolvé el sistema: <b>${a}x ${sg(b)}y = ${e}</b> y <b>${c}x ${sg(d)}y = ${f}</b>.`,
    f: [['x', x], ['y', y]],
    s: [`Determinante: ${a}×${d} − ${b}×${c} = ${det} ≠ 0, así que hay solución única.`, `Cramer: x = (${e}×${d} − ${b}×${f})/${det} = ${e * d - b * f}/${det} = <b>${x}</b>.`, `y = (${a}×${f} − ${e}×${c})/${det} = ${a * f - e * c}/${det} = <b>${y}</b>.`, `Verificación: ${a}×${x} ${sg(b)}×${y} = ${e} ✓.`] };
};
D.inversa = () => {
  let a, b, c, d, det; do { a = ri(-4, 6); b = ri(-4, 6); c = ri(-4, 6); d = ri(-4, 6); det = a * d - b * c; } while (![1, -1, 2, -2, 4].includes(det));
  const fr = v => Number.isInteger(v) ? String(v) : (v < 0 ? '−' : '') + `${Math.abs(v * det)}/${Math.abs(det)}`;
  return { q: `Sea A = [[${a}, ${b}], [${c}, ${d}]]. Calculá el determinante y la inversa (podés escribir fracciones como 3/2).`,
    f: [['det A', det], ['A⁻¹ fila 1, col 1', d / det], ['A⁻¹ fila 1, col 2', -b / det], ['A⁻¹ fila 2, col 1', -c / det], ['A⁻¹ fila 2, col 2', a / det]],
    s: [`det A = ${a}×${d} − ${b}×${c} = <b>${det}</b>.`, `Para 2×2: A⁻¹ = (1/det)·[[d, −b], [−c, a]] = (1/${det})·[[${d}, ${-b}], [${-c}, ${a}]].`, `A⁻¹ = <b>[[${fr(d / det)}, ${fr(-b / det)}], [${fr(-c / det)}, ${fr(a / det)}]]</b>.`] };
};
D.eoq = () => {
  const Dm = pick([4800, 6000, 9600, 12000, 18000]), S = pick([50, 75, 100, 150, 200]), H = pick([2, 3, 4, 5, 6]), Q = Math.sqrt(2 * Dm * S / H);
  return { q: `Una empresa vende <b>${fmt(Dm, 0)}</b> unidades por año. Cada pedido cuesta <b>$${S}</b> y mantener una unidad en stock un año cuesta <b>$${H}</b>. ¿Cuál es el lote económico y cuántos pedidos hace por año?`,
    f: [['Lote económico Q*', Q, .6], ['Pedidos por año', Dm / Q, .02]],
    s: [`Q* = √(2·D·S/H) = √(2 × ${fmt(Dm, 0)} × ${S}/${H}) = √${fmt(2 * Dm * S / H, 0)} = <b>${f2(Q)}</b>.`, `Pedidos por año = D/Q* = ${fmt(Dm, 0)}/${f2(Q)} = <b>${f2(Dm / Q)}</b>.`, `Costo anual total en el óptimo: (D/Q)·S + (Q/2)·H = ${f2(Dm / Q * S)} + ${f2(Q / 2 * H)} = ${f2(Dm / Q * S + Q / 2 * H)} (los dos términos son iguales).`] };
};

/* ---------------- Interfaz ---------------- */
const SCORE = {}; let total = 0, hits = 0;
try { const s = JSON.parse(localStorage.getItem('asintota-practica') || '{}'); total = s.t || 0; hits = s.h || 0; } catch (e) {}
const save = () => { try { localStorage.setItem('asintota-practica', JSON.stringify({ t: total, h: hits })); } catch (e) {} };
Object.keys(D).forEach(id => {
  const sec = $('#v-' + id); if (!sec) return; const pager = sec.querySelector('.pager');
  const box = document.createElement('div'); box.className = 'drill'; box.id = 'pr-' + id;
  box.innerHTML = `<div class="drill-h"><div><span class="eyebrow">Modo práctica</span><h3>Resolvelo vos</h3></div><span class="mono muted drill-sc"></span></div><p class="drill-q"></p><div class="drill-f"></div><div class="row"><button class="btn primary sm drill-ok">Corregir</button><button class="btn sm drill-sol">Ver resolución</button><button class="btn sm drill-new">Otro ejercicio</button></div><div class="drill-msg"></div><div class="steplist drill-steps" hidden></div>`;
  pager ? pager.before(box) : sec.appendChild(box);
  let cur = null; const q = s => box.querySelector(s);
  const sc = () => { q('.drill-sc').textContent = SCORE[id] ? `${SCORE[id].h}/${SCORE[id].t} en este tema` : ''; };
  const fresh = () => {
    cur = D[id](); q('.drill-q').innerHTML = cur.q;
    q('.drill-f').innerHTML = cur.f.map(([l], i) => `<label class="drill-in"><span>${l}</span><input class="field" inputmode="decimal" autocomplete="off" data-i="${i}"><i></i></label>`).join('');
    q('.drill-steps').hidden = true; q('.drill-sol').textContent = 'Ver resolución'; q('.drill-steps').innerHTML = A.steps(cur.s); q('.drill-msg').innerHTML = ''; A.greek && A.greek();
    box.querySelectorAll('.drill-in input').forEach(e => e.onkeydown = ev => { if (ev.key === 'Enter') check(); });
  };
  const check = () => {
    let good = 0, any = false;
    box.querySelectorAll('.drill-in').forEach((lab, i) => { const v = parse(lab.querySelector('input').value), [, a, tol] = cur.f[i], m = lab.querySelector('i'); if (!Number.isFinite(v)) { m.textContent = ''; lab.className = 'drill-in'; return; } any = true; const g = ok(v, a, tol); good += g; lab.className = 'drill-in ' + (g ? 'good' : 'bad'); m.textContent = g ? '✓' : '✗'; });
    if (!any) { q('.drill-msg').innerHTML = '<p class="note">Escribí al menos una respuesta.</p>'; return; }
    const all = good === cur.f.length; SCORE[id] = SCORE[id] || { t: 0, h: 0 }; SCORE[id].t++; SCORE[id].h += all; total++; hits += all; save(); sc();
    q('.drill-msg').innerHTML = all ? '<p class="drill-good">¡Perfecto! Todo bien. Probá con otro.</p>' : `<p class="drill-bad">${good ? `Tenés ${good} de ${cur.f.length} bien.` : 'Todavía no.'} Revisá las marcadas con ✗ o mirá la resolución.</p>`;
  };
  q('.drill-ok').onclick = check; q('.drill-new').onclick = fresh;
  q('.drill-sol').onclick = () => { const s = q('.drill-steps'); s.hidden = !s.hidden; q('.drill-sol').textContent = s.hidden ? 'Ver resolución' : 'Ocultar resolución'; };
  fresh(); sc();
});
/* Marca de "con práctica" en las tarjetas de temas */
$$('.topic[data-go]').forEach(b => { if (D[b.dataset.go]) b.insertAdjacentHTML('beforeend', '<span class="drill-tag">Con práctica</span>'); });
})();
