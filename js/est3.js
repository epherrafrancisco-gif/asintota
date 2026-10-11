/* Asíntota · Estadística I y II (ampliación) */
(() => {
const { $, $$, K, fmt, pct, S } = A;
const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3), f4 = x => fmt(x, 4);
const parseNums = s => s.trim().split(/[\s;]+/).map(t => Number(t.replace(/\./g, '').replace(',', '.'))).filter(Number.isFinite);
const mean = a => a.reduce((s, v) => s + v, 0) / a.length, vr = a => { const m = mean(a); return a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1); };
const median = a => { const b = [...a].sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
const pv = p => p < 1e-4 ? '< 0,0001' : fmt(p, 4);
const chiInv = (p, k) => S.inv(x => S.chiCdf(x, k), p, 0, 1e4);
const fCdf = (f, d1, d2) => A.betaI(d1 / 2, d2 / 2, d1 * f / (d1 * f + d2));
const bars = (g, cnt, lo, bw, col) => cnt.forEach((k, i) => { if (!k) return; g.c.fillStyle = col; g.c.fillRect(g.X(lo + i * bw) + .5, g.Y(k), g.X(lo + (i + 1) * bw) - g.X(lo + i * bw) - 1, g.Y(0) - g.Y(k)); });
const binsOf = (d, lo, hi, n) => { const bw = (hi - lo) / n, c = new Array(n).fill(0); d.forEach(x => { const i = Math.min(n - 1, Math.floor((x - lo) / bw)); if (i >= 0) c[i]++; }); return c; };

/* ===================================== ESTADÍSTICA I ===================================== */

/* ================= Tablas de frecuencia ================= */
{
  const SAMPLE = '23 31 27 45 38 29 33 41 26 35 52 30 28 37 44 24 39 32 36 48 27 34 29 42 31 25 40 33 47 30 22 38 35 28 43 32 26 36 50 34';
  const st = { k: 6 }; let d = [];
  A.tool({
    id: 'frecuencias', mat: 'est1', unit: 1, ord: 1, name: 'Tablas de frecuencia y datos agrupados', short: 'Tablas de frecuencia', tag: 'Distribución de frecuencias', f: 'Me = Lᵢ + ((n/2 − Fᵢ₋₁)/fᵢ)·c',
    desc: 'Agrupá datos en intervalos de clase: frecuencias absolutas, relativas y acumuladas, histograma, ojiva y medidas para datos agrupados.',
    lead: 'Con muchos datos conviene agruparlos en intervalos. La tabla de frecuencias cuenta cuántos caen en cada uno; con ella se arman el histograma y la ojiva (frecuencias acumuladas) y se calculan media, mediana y moda aproximadas, como en los ejercicios de parcial.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l" for="fq-d">Datos</label><textarea class="field" id="fq-d" spellcheck="false"></textarea></div>
      <div><label class="l" for="fq-k">Cantidad de intervalos: <span id="fq-kv" style="color:var(--fg)">6</span></label><input type="range" id="fq-k" min="3" max="15" value="6"></div><dl class="stats" id="fq-st" style="margin:0"></dl></div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="fq-tbl"></table></div><div class="grid2"><div><h3>Histograma</h3><canvas id="fq-h" style="height:220px"></canvas></div><div><h3>Ojiva</h3><canvas id="fq-o" style="height:220px"></canvas></div></div><div class="steplist" id="fq-steps"></div></div></div>`,
    init() { $('#fq-d').value = SAMPLE; $('#fq-d').oninput = upd; $('#fq-k').oninput = e => { st.k = +e.target.value; $('#fq-kv').textContent = st.k; upd(); }; upd(); },
    draw
  });
  let T = null;
  function upd() {
    d = parseNums($('#fq-d').value); if (d.length < 4) { $('#fq-tbl').innerHTML = ''; return; }
    const n = d.length, lo = Math.floor(Math.min(...d)), hi = Math.max(...d), c = Math.ceil((hi - lo + 1e-9) / st.k * 100) / 100, rows = []; let F = 0;
    for (let i = 0; i < st.k; i++) { const a = lo + i * c, b = a + c, f = d.filter(x => x >= a && (i === st.k - 1 ? x <= b : x < b)).length; F += f; rows.push({ a, b, m: (a + b) / 2, f, fr: f / n, F, Fr: F / n }); }
    const gm = rows.reduce((s, r) => s + r.f * r.m, 0) / n, mi = rows.findIndex(r => r.F >= n / 2), mr = rows[mi], Fp = mi ? rows[mi - 1].F : 0, gmed = mr.a + (n / 2 - Fp) / mr.f * c;
    const mo = rows.reduce((b, r, i) => r.f > rows[b].f ? i : b, 0), d1 = rows[mo].f - (mo ? rows[mo - 1].f : 0), d2 = rows[mo].f - (mo < rows.length - 1 ? rows[mo + 1].f : 0), gmo = rows[mo].a + (d1 + d2 ? d1 / (d1 + d2) : .5) * c;
    T = { rows, c, lo, n };
    $('#fq-tbl').innerHTML = `<tr><th>Intervalo</th><th>Marca</th><th>f</th><th>f rel.</th><th>F acum.</th><th>F rel. acum.</th></tr>` + rows.map((r, i) => `<tr><td>[${f2(r.a)}; ${f2(r.b)}${i === rows.length - 1 ? ']' : ')'}</td><td>${f2(r.m)}</td><td>${r.f}</td><td>${pct(r.fr, 1)}</td><td>${r.F}</td><td>${pct(r.Fr, 1)}</td></tr>`).join('');
    $('#fq-st').innerHTML = A.stats([['Media agrupada', f2(gm)], ['Media real', f2(mean(d))], ['Mediana agrupada', f2(gmed)], ['Mediana real', f2(median(d))], ['Moda agrupada', f2(gmo)]]);
    $('#fq-steps').innerHTML = A.steps([
      `Rango: ${f2(Math.min(...d))} a ${f2(hi)}. Con ${st.k} intervalos, el ancho es c = ${f2(c)}. (La regla de Sturges sugiere k ≈ 1 + log₂(n) = ${fmt(1 + Math.log2(n), 1)}.)`,
      `Media agrupada: Σ(f × marca)/n = <b>${f2(gm)}</b>. Es aproximada porque supone que todos los datos de un intervalo valen la marca de clase.`,
      `Mediana: el dato n/2 = ${f2(n / 2)} cae en [${f2(mr.a)}; ${f2(mr.b)}). Interpolando: ${f2(mr.a)} + ((${f2(n / 2)} − ${Fp})/${mr.f}) × ${f2(c)} = <b>${f2(gmed)}</b>.`,
      `Moda: intervalo modal [${f2(rows[mo].a)}; ${f2(rows[mo].b)}). Fórmula: L + d₁/(d₁ + d₂)·c = <b>${f2(gmo)}</b>, con d₁ y d₂ las diferencias con los intervalos vecinos.`]);
    draw();
  }
  function draw() {
    if (!T) return; const { rows, c, lo, n } = T, hi = lo + c * rows.length, fm = Math.max(...rows.map(r => r.f));
    const h = A.ax($('#fq-h'), [lo, hi], [0, fm * 1.15], { ystep: Math.max(1, A.niceStep(fm, 4)), yf: v => fmt(v, 0), l: 36 }); if (h) bars(h, rows.map(r => r.f), lo, c, 'rgba(242,169,59,.85)');
    const o = A.ax($('#fq-o'), [lo, hi], [0, 1.05], { ystep: .25, yf: v => pct(v, 0), l: 40 }); if (o) { o.path([[lo, 0], ...rows.map(r => [r.b, r.Fr])], K.teal, 2.2); rows.forEach(r => o.dot(r.b, r.Fr, K.teal, 3.5)); o.hline(.5, K.faint, 1, [3, 4]); }
  }
}

/* ================= Eventos y diagrama de Venn ================= */
{
  const st = {};
  const D = [['a', 'P(A)', 0, 1, .01, .5, 2], ['b', 'P(B)', 0, 1, .01, .4, 2], ['ab', 'P(A ∩ B)', 0, 1, .01, .2, 2]];
  A.tool({
    id: 'venn', mat: 'est1', unit: 2, ord: 0, name: 'Eventos, Venn y reglas de probabilidad', short: 'Eventos y Venn', tag: 'Axiomas y reglas', f: 'P(A ∪ B) = P(A) + P(B) − P(A ∩ B)',
    desc: 'Unión, intersección, complemento, probabilidad condicional, independencia y eventos excluyentes en un diagrama de Venn.',
    lead: 'Dos eventos, A y B. Mové sus probabilidades y la de que ocurran juntos, y mirá cómo se reparten las cuatro regiones del diagrama. Ejemplo: A = "aprobó Micro", B = "aprobó Estadística".',
    body: `<div class="bench"><div class="ctrl">${A.sliders('vn2', D)}<div id="vn2-pill"></div><dl class="stats" id="vn2-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="vn2-cv" style="height:300px"></canvas><div class="steplist" id="vn2-steps"></div></div></div>`,
    init() { A.bindSliders('vn2', D, st, k => { fix(k); upd(); }); upd(); },
    draw
  });
  function fix(k) { const lo = Math.max(0, st.a + st.b - 1), hi = Math.min(st.a, st.b); if (st.ab < lo || st.ab > hi) A.setSlider('vn2', 'ab', A.clamp(st.ab, lo, hi), st); }
  function upd() {
    const u = st.a + st.b - st.ab, ind = Math.abs(st.ab - st.a * st.b) < .005, exc = st.ab < .005;
    $('#vn2-pill').innerHTML = `<span class="pill ${ind ? 'ok' : 'warn'}">${ind ? 'Independientes' : 'Dependientes'}</span> ${exc ? '<span class="pill bad">Mutuamente excluyentes</span>' : ''}`;
    $('#vn2-st').innerHTML = A.stats([['P(A ∪ B)', f2(u)], ['P(A | B)', st.b ? f3(st.ab / st.b) : '—'], ['P(B | A)', st.a ? f3(st.ab / st.a) : '—'], ['P(ni A ni B)', f2(1 - u)], ['P(A) × P(B)', f3(st.a * st.b)]]);
    $('#vn2-steps').innerHTML = A.steps([
      `Unión: P(A ∪ B) = P(A) + P(B) − P(A ∩ B) = ${f2(st.a)} + ${f2(st.b)} − ${f2(st.ab)} = <b>${f2(u)}</b>. Se resta la intersección porque si no se cuenta dos veces.`,
      `Complemento: P(ni A ni B) = 1 − P(A ∪ B) = <b>${f2(1 - u)}</b>. Solo A: ${f2(st.a - st.ab)}; solo B: ${f2(st.b - st.ab)}.`,
      `Condicional: P(A | B) = P(A ∩ B)/P(B) = ${f2(st.ab)}/${f2(st.b)} = <b>${st.b ? f3(st.ab / st.b) : '—'}</b>. Es la probabilidad de A cuando ya sabés que pasó B: el "universo" se achica al círculo B.`,
      `Independencia: son independientes si P(A ∩ B) = P(A)·P(B) = ${f3(st.a * st.b)}. ${ind ? 'Se cumple: saber que pasó B no cambia la probabilidad de A.' : st.ab > st.a * st.b ? 'Acá la intersección es mayor: los eventos tienden a ocurrir juntos.' : 'Acá la intersección es menor: un evento hace menos probable al otro.'} Ojo: excluyentes no es lo mismo que independientes. Si son excluyentes (y tienen probabilidad positiva), son dependientes.`]);
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#vn2-cv')); if (w < 2) return; c.strokeStyle = K.line; c.strokeRect(10.5, 10.5, w - 21, h - 21);
    const R = Math.min(h * .36, w * .22), sep = R * (1.85 - 1.6 * (st.ab / Math.max(.001, Math.min(st.a, st.b)))), cx = w / 2, cy = h / 2, xa = cx - sep / 2, xb = cx + sep / 2;
    c.globalAlpha = .28; c.fillStyle = K.amber; c.beginPath(); c.arc(xa, cy, R * (.6 + st.a * .5), 0, 7); c.fill(); c.fillStyle = K.teal; c.beginPath(); c.arc(xb, cy, R * (.6 + st.b * .5), 0, 7); c.fill(); c.globalAlpha = 1;
    c.lineWidth = 2; c.strokeStyle = K.amber; c.beginPath(); c.arc(xa, cy, R * (.6 + st.a * .5), 0, 7); c.stroke(); c.strokeStyle = K.teal; c.beginPath(); c.arc(xb, cy, R * (.6 + st.b * .5), 0, 7); c.stroke();
    c.font = '600 14px ' + A.MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = K.fg;
    c.fillText(f2(st.a - st.ab), xa - R * .45, cy); c.fillText(f2(st.b - st.ab), xb + R * .45, cy); if (st.ab > 0) c.fillText(f2(st.ab), cx, cy); c.fillText(f2(1 - st.a - st.b + st.ab), 46, 32);
    c.font = '13px ' + A.MONO; c.fillStyle = K.amber; c.fillText('A', xa - R * .5, cy - R * .8); c.fillStyle = K.teal; c.fillText('B', xb + R * .5, cy - R * .8);
  }
}

/* ================= Teorema de Bayes ================= */
{
  const st = {};
  const D = [['prev', 'Prevalencia: % de la población que tiene la enfermedad', .1, 50, .1, 1, 1], ['sens', 'Sensibilidad: % de enfermos que dan positivo', 50, 100, .5, 95, 1], ['spec', 'Especificidad: % de sanos que dan negativo', 50, 100, .5, 95, 1]];
  let two = false;
  A.tool({
    id: 'bayes', mat: 'est1', unit: 3, ord: 0, name: 'Teorema de Bayes', short: 'Bayes', tag: 'Probabilidad condicional', f: 'P(A|B) = P(B|A)·P(A) / P(B)',
    desc: 'Un test da positivo: ¿qué tan probable es que estés enfermo? La respuesta casi siempre sorprende. Con frecuencias naturales y árbol.',
    lead: 'Un test que acierta el 95% de las veces da positivo. Mucha gente cree que entonces hay 95% de probabilidad de estar enfermo, pero depende muchísimo de qué tan común es la enfermedad. Bayes junta lo que ya sabías (la prevalencia) con la evidencia nueva (el test).',
    body: `<div class="bench"><div class="ctrl">${A.sliders('by', D)}<label class="check"><input type="checkbox" id="by-2"> Hacerse un segundo test, que también da positivo</label><dl class="stats" id="by-st" style="margin:0"></dl></div>
      <div class="stage"><h3>1.000 personas que se hacen el test</h3><canvas id="by-cv" style="height:300px"></canvas>${A.legend([['rose', 'Enfermos con positivo'], ['amber', 'Sanos con positivo (falsos positivos)'], ['violet', 'Enfermos con negativo'], ['faint', 'Sanos con negativo']])}<div class="steplist" id="by-steps"></div></div></div>`,
    init() { A.bindSliders('by', D, st, upd); $('#by-2').onchange = e => { two = e.target.checked; upd(); }; upd(); },
    draw
  });
  const post = (p, se, sp) => se * p / (se * p + (1 - sp) * (1 - p));
  function upd() {
    const p = st.prev / 100, se = st.sens / 100, sp = st.spec / 100, pp = se * p + (1 - sp) * (1 - p), p1 = post(p, se, sp), p2 = post(p1, se, sp), neg = (1 - se) * p / ((1 - se) * p + sp * (1 - p));
    $('#by-st').innerHTML = A.stats([['P(enfermo | positivo)', pct(p1, 1)], ...(two ? [['Después del 2.º positivo', pct(p2, 1)]] : []), ['P(positivo)', pct(pp, 2)], ['P(enfermo | negativo)', pct(neg, 3)]]);
    const tp = Math.round(1000 * p * se), fn = Math.round(1000 * p) - tp, fp = Math.round(1000 * (1 - p) * (1 - sp)), tn = 1000 - tp - fn - fp;
    $('#by-steps').innerHTML = A.steps([
      `En 1.000 personas: ${fmt(1000 * p, 0)} están enfermas. De ellas, ${tp} dan positivo (sensibilidad ${f2(st.sens)}%). De las ${fmt(1000 * (1 - p), 0)} sanas, ${fp} dan positivo por error (100% − especificidad).`,
      `Positivos totales: ${tp} + ${fp} = ${tp + fp}. De esos, solo ${tp} están enfermos: P(enfermo | +) = ${tp}/${tp + fp} ≈ <b>${pct(p1, 1)}</b>.`,
      `Con la fórmula: P(E|+) = P(+|E)·P(E)/P(+) = ${f3(se)} × ${f4(p)} / ${f4(pp)} = <b>${f4(p1)}</b>.`,
      p1 < .5 ? `Aunque el test es bueno, como la enfermedad es rara, los falsos positivos de la gran mayoría sana superan a los verdaderos positivos. Es la <b>falacia de la tasa base</b>: ignorar la prevalencia.` : `Con una prevalencia alta, un positivo sí es muy informativo.`,
      two ? `Segundo test positivo: el resultado anterior (${pct(p1, 1)}) pasa a ser la nueva probabilidad inicial. Aplicando Bayes otra vez: <b>${pct(p2, 1)}</b>. Así se actualizan las creencias a medida que llega evidencia.` : `Probá tildar el segundo test: Bayes se puede aplicar en cadena.`]);
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#by-cv')); if (w < 2) return; const p = st.prev / 100, se = st.sens / 100, sp = st.spec / 100;
    const tp = Math.round(1000 * p * se), fn = Math.round(1000 * p) - tp, fp = Math.round(1000 * (1 - p) * (1 - sp)), cols = 50, rows = 20, cw = Math.min((w - 10) / cols, (h - 10) / rows), x0 = (w - cw * cols) / 2;
    const kind = i => i < tp ? K.rose : i < tp + fp ? K.amber : i < tp + fp + fn ? K.violet : '#2a2d3a';
    for (let i = 0; i < 1000; i++) { const col = i % cols, row = Math.floor(i / cols); c.fillStyle = kind(i); c.beginPath(); c.arc(x0 + col * cw + cw / 2, 5 + row * cw + cw / 2, cw * .36, 0, 7); c.fill(); }
  }
}

/* ================= Variables aleatorias discretas ================= */
{
  const PRE = { dado: ['Dado justo', [[1, 1 / 6], [2, 1 / 6], [3, 1 / 6], [4, 1 / 6], [5, 1 / 6], [6, 1 / 6]]], caras: ['Caras en 3 tiradas', [[0, .125], [1, .375], [2, .375], [3, .125]]], apuesta: ['Ganancia de una apuesta de $100 al pleno', [[3500, 1 / 37], [-100, 36 / 37]]], seguro: ['Reclamos al seguro por año', [[0, .7], [1, .2], [2, .07], [3, .03]]] };
  let rows = PRE.dado[1].map(r => [...r]);
  A.tool({
    id: 'va-discreta', mat: 'est1', unit: 4, ord: 0, name: 'Variables aleatorias discretas: esperanza y varianza', short: 'Esperanza y varianza', tag: 'Variables aleatorias', f: 'E[X] = Σ xᵢ·pᵢ',
    desc: 'Definí una variable aleatoria con sus valores y probabilidades, y obtené su esperanza, varianza, desvío y función de distribución.',
    lead: 'Una variable aleatoria asigna un número a cada resultado posible. La esperanza es el promedio a largo plazo (no necesariamente un valor posible), y la varianza mide cuánto se dispersan los resultados alrededor de ella.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Ejemplos</label><div class="chips">${Object.entries(PRE).map(([k, v]) => `<button class="chip" data-vd="${k}">${v[0]}</button>`).join('')}</div></div>
      <div><label class="l">Valores y probabilidades</label><div id="vd-rows" style="display:flex;flex-direction:column;gap:6px"></div></div><div class="row"><button class="btn sm" id="vd-add">Agregar valor</button><button class="btn sm" id="vd-del">Quitar el último</button></div><p class="err" id="vd-err"></p></div>
      <div class="stage"><dl class="stats" id="vd-st" style="margin:0"></dl><div class="grid2"><div><h3>Función de probabilidad</h3><canvas id="vd-p" style="height:220px"></canvas></div><div><h3>Función de distribución acumulada</h3><canvas id="vd-F" style="height:220px"></canvas></div></div><div class="steplist" id="vd-steps"></div></div></div>`,
    init() {
      $$('[data-vd]').forEach(b => b.onclick = () => { rows = PRE[b.dataset.vd][1].map(r => [...r]); build(); });
      $('#vd-add').onclick = () => { if (rows.length < 12) { rows.push([(rows[rows.length - 1]?.[0] || 0) + 1, 0]); build(); } };
      $('#vd-del').onclick = () => { if (rows.length > 1) { rows.pop(); build(); } };
      build();
    },
    draw
  });
  function build() { $('#vd-rows').innerHTML = rows.map((r, i) => `<div class="grid2"><input class="field" data-vx="${i}" value="${String(+r[0].toFixed(6)).replace('.', ',')}" aria-label="Valor"><input class="field" data-vp="${i}" value="${String(+r[1].toFixed(6)).replace('.', ',')}" aria-label="Probabilidad"></div>`).join(''); $$('[data-vx]').forEach(e => e.oninput = () => { rows[+e.dataset.vx][0] = A.num(e.value); upd(); }); $$('[data-vp]').forEach(e => e.oninput = () => { rows[+e.dataset.vp][1] = A.num(e.value); upd(); }); upd(); }
  let ok = false;
  function upd() {
    const sum = rows.reduce((s, r) => s + r[1], 0); ok = rows.every(r => Number.isFinite(r[0]) && r[1] >= 0) && Math.abs(sum - 1) < 1e-3;
    $('#vd-err').textContent = ok ? '' : `Las probabilidades tienen que ser positivas y sumar 1 (ahora suman ${f4(sum)}).`;
    if (!ok) { $('#vd-st').innerHTML = ''; $('#vd-steps').innerHTML = ''; draw(); return; }
    const E = rows.reduce((s, [x, p]) => s + x * p, 0), E2 = rows.reduce((s, [x, p]) => s + x * x * p, 0), V = E2 - E * E;
    $('#vd-st').innerHTML = A.stats([['Esperanza E[X]', f4(E)], ['Varianza', f4(V)], ['Desvío estándar', f4(Math.sqrt(V))], ['E[X²]', f4(E2)]]);
    $('#vd-steps').innerHTML = A.steps([
      `E[X] = Σ x·p = ${rows.slice(0, 6).map(([x, p]) => `${fmt(x, 3)}×${fmt(p, 4)}`).join(' + ')}${rows.length > 6 ? ' + …' : ''} = <b>${f4(E)}</b>.`,
      `E[X²] = Σ x²·p = ${f4(E2)}. Varianza: Var(X) = E[X²] − E[X]² = ${f4(E2)} − ${f4(E)}² = <b>${f4(V)}</b>. Desvío: √Var = <b>${f4(Math.sqrt(V))}</b>.`,
      `Propiedades útiles: E[a + bX] = a + b·E[X] y Var(a + bX) = b²·Var(X). Sumar una constante corre la distribución pero no cambia su dispersión.`,
      `La esperanza es el promedio que obtendrías repitiendo el experimento muchas veces (ley de los grandes números). ${E < 0 ? 'Acá es negativa: a la larga se pierde.' : ''}`]);
    draw();
  }
  function draw() {
    if (!ok) return; const xs = rows.map(r => r[0]), lo = Math.min(...xs), hi = Math.max(...xs), pad = Math.max(.5, (hi - lo) * .08), pm = Math.max(...rows.map(r => r[1]));
    const g = A.ax($('#vd-p'), [lo - pad, hi + pad], [0, pm * 1.15], { l: 40 }); if (g) { const bw = Math.max(3, Math.min(30, (g.F.pw / (rows.length + 1)) * .5)); rows.forEach(([x, p]) => { g.c.fillStyle = K.amber; g.c.fillRect(g.X(x) - bw / 2, g.Y(p), bw, g.Y(0) - g.Y(p)); }); }
    const s = [...rows].sort((a, b) => a[0] - b[0]); let F = 0; const pts = [[lo - pad, 0]]; s.forEach(([x, p]) => { pts.push([x, F]); F += p; pts.push([x, F]); }); pts.push([hi + pad, F]);
    const f = A.ax($('#vd-F'), [lo - pad, hi + pad], [0, 1.05], { ystep: .25, l: 40 }); if (f) { f.path(pts, K.teal, 2.2); s.forEach(([x], i) => f.dot(x, s.slice(0, i + 1).reduce((a, r) => a + r[1], 0), K.teal, 3.5)); }
  }
}

/* ================= Normal estándar y tabla Z ================= */
{
  const st = { mode: 'le' };
  const D = [['mu', 'Media μ', 0, 100, .5, 6, 1], ['sd', 'Desvío σ', .1, 30, .1, 1.5, 1], ['a', 'Valor x (o a)', -50, 150, .1, 8, 1], ['b', 'Valor b', -50, 150, .1, 9, 1]];
  A.tool({
    id: 'normal-z', mat: 'est1', unit: 4, ord: 2, name: 'Distribución normal y estandarización', short: 'Normal y tabla Z', tag: 'Variable Z', f: 'Z = (X − μ) / σ',
    desc: 'Estandarizá cualquier normal, calculá probabilidades como con la tabla Z y mirá la regla 68-95-99,7.',
    lead: 'Toda normal se puede llevar a la normal estándar (media 0, desvío 1) restando la media y dividiendo por el desvío. Así alcanza con una sola tabla. Ejemplo: notas de un parcial con media 6 y desvío 1,5.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Probabilidad</label>${A.seg('nz-m', [['le', 'P(X ≤ x)'], ['ge', 'P(X ≥ x)'], ['btw', 'P(a ≤ X ≤ b)']], 'le')}</div>${A.sliders('nz', D)}<label class="check"><input type="checkbox" id="nz-r"> Mostrar la regla 68-95-99,7</label></div>
      <div class="stage"><div class="row" style="justify-content:space-between;align-items:baseline"><div class="big sm" id="nz-res"></div><span class="mono muted" id="nz-lab"></span></div><canvas id="nz-cv" style="height:300px"></canvas><div class="steplist" id="nz-steps"></div></div></div>`,
    init() { A.bindSliders('nz', D, st, upd); A.segBind('nz-m', v => { st.mode = v; upd(); }); st.rule = false; $('#nz-r').onchange = e => { st.rule = e.target.checked; draw(); }; upd(); },
    draw
  });
  function upd() {
    $('#nz-b').closest('div').hidden = st.mode !== 'btw';
    const za = (st.a - st.mu) / st.sd, zb = (st.b - st.mu) / st.sd, Fa = S.normCdf(za), Fb = S.normCdf(zb);
    const p = st.mode === 'le' ? Fa : st.mode === 'ge' ? 1 - Fa : Math.max(0, Fb - Fa);
    $('#nz-res').textContent = f4(p); $('#nz-lab').textContent = st.mode === 'le' ? `P(X ≤ ${f2(st.a)})` : st.mode === 'ge' ? `P(X ≥ ${f2(st.a)})` : `P(${f2(st.a)} ≤ X ≤ ${f2(st.b)})`;
    $('#nz-steps').innerHTML = A.steps([
      `Estandarizo: z = (x − μ)/σ = (${f2(st.a)} − ${f2(st.mu)})/${f2(st.sd)} = <b>${f2(za)}</b>${st.mode === 'btw' ? ` y z<sub>b</sub> = (${f2(st.b)} − ${f2(st.mu)})/${f2(st.sd)} = <b>${f2(zb)}</b>` : ''}. El valor está a ${f2(Math.abs(za))} desvíos ${za >= 0 ? 'por encima' : 'por debajo'} de la media.`,
      `En la tabla Z: Φ(${f2(za)}) = ${f4(Fa)}${st.mode === 'btw' ? ` y Φ(${f2(zb)}) = ${f4(Fb)}` : ''}.`,
      st.mode === 'le' ? `P(X ≤ x) = Φ(z) = <b>${f4(p)}</b>.` : st.mode === 'ge' ? `P(X ≥ x) = 1 − Φ(z) = 1 − ${f4(Fa)} = <b>${f4(p)}</b>.` : `P(a ≤ X ≤ b) = Φ(z_b) − Φ(z_a) = <b>${f4(p)}</b>.`,
      `Para valores negativos de z, la tabla usa la simetría: Φ(−z) = 1 − Φ(z). Regla rápida: entre μ ± 1σ cae el 68%, entre μ ± 2σ el 95% y entre μ ± 3σ el 99,7%.`]);
    draw();
  }
  function draw() {
    const lo = st.mu - 4 * st.sd, hi = st.mu + 4 * st.sd, pdf = x => S.normPdf(x, st.mu, st.sd), g = A.ax($('#nz-cv'), [lo, hi], [0, pdf(st.mu) * 1.15], { yf: () => '', xticks: [-3, -2, -1, 0, 1, 2, 3].map(k => st.mu + k * st.sd), xf: v => `${fmt(v, 1)}`, l: 14, b: 40 }); if (!g) return;
    if (st.rule) [[3, .08], [2, .12], [1, .18]].forEach(([k, a]) => g.area(pdf, () => 0, st.mu - k * st.sd, st.mu + k * st.sd, `rgba(67,200,184,${a})`));
    const [x0, x1] = st.mode === 'le' ? [lo, st.a] : st.mode === 'ge' ? [st.a, hi] : [st.a, st.b]; g.area(pdf, () => 0, Math.max(lo, x0), Math.min(hi, x1), 'rgba(242,169,59,.4)');
    g.fn(pdf, K.fg, 2.2); g.c.font = '11px ' + A.MONO; g.c.fillStyle = K.faint; g.c.textAlign = 'center'; g.c.textBaseline = 'top'; [-3, -2, -1, 0, 1, 2, 3].forEach(k => g.c.fillText('z=' + k, g.X(st.mu + k * st.sd), g.F.T + g.F.ph + 22));
    if (st.rule) { g.text('68%', st.mu, pdf(st.mu) * .5, K.teal, 'center'); g.text('95%', st.mu + 1.5 * st.sd, pdf(st.mu) * .12, K.teal, 'center'); }
  }
}

/* ================= Distribución conjunta ================= */
{
  let P = [[.10, .08, .02], [.10, .20, .10], [.02, .12, .26]]; const XS = [0, 1, 2], YS = [0, 1, 2];
  A.tool({
    id: 'conjunta', mat: 'est1', unit: 5, ord: 0, name: 'Distribución conjunta, covarianza y correlación', short: 'Distribución conjunta', tag: 'Variables aleatorias bidimensionales', f: 'Cov(X,Y) = E[XY] − E[X]E[Y]',
    desc: 'Una tabla de probabilidades conjuntas: marginales, condicionales, covarianza, correlación e independencia.',
    lead: 'Cuando miramos dos variables a la vez, la tabla conjunta dice la probabilidad de cada combinación. Sumando filas o columnas salen las marginales. Ejemplo: X = materias aprobadas en el primer cuatrimestre, Y = en el segundo.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">P(X = x, Y = y)</label><div id="cj-in" class="mtx-in" style="grid-template-columns:70px repeat(3,minmax(0,1fr))"></div><p class="err" id="cj-err"></p></div>
      <div class="chips"><button class="chip" data-cj="pos">Relación positiva</button><button class="chip" data-cj="ind">Independientes</button><button class="chip" data-cj="neg">Relación negativa</button></div></div>
      <div class="stage"><dl class="stats" id="cj-st" style="margin:0"></dl><div class="tbl-wrap"><table class="tbl" id="cj-tbl"></table></div><div class="steplist" id="cj-steps"></div></div></div>`,
    init() {
      const PRE = { pos: [[.10, .08, .02], [.10, .20, .10], [.02, .12, .26]], ind: [[.06, .12, .12], [.08, .16, .16], [.06, .12, .12]], neg: [[.02, .08, .25], [.08, .14, .08], [.25, .08, .02]] };
      $$('[data-cj]').forEach(b => b.onclick = () => { P = PRE[b.dataset.cj].map(r => [...r]); build(); }); build();
    }
  });
  function build() { $('#cj-in').innerHTML = `<span class="sep">X \\ Y</span>${YS.map(y => `<span class="sep">Y=${y}</span>`).join('')}` + XS.map((x, i) => `<span class="sep">X=${x}</span>` + YS.map((_, j) => `<input class="field" data-cj2="${i},${j}" value="${String(P[i][j]).replace('.', ',')}">`).join('')).join(''); $$('[data-cj2]').forEach(e => e.oninput = () => { const [i, j] = e.dataset.cj2.split(',').map(Number); P[i][j] = A.num(e.value); upd(); }); upd(); }
  function upd() {
    const sum = P.flat().reduce((s, v) => s + v, 0); if (!P.flat().every(v => v >= 0) || Math.abs(sum - 1) > 1e-3) { $('#cj-err').textContent = `Las probabilidades tienen que sumar 1 (ahora ${f3(sum)}).`; return; } $('#cj-err').textContent = '';
    const px = P.map(r => r.reduce((s, v) => s + v, 0)), py = YS.map((_, j) => P.reduce((s, r) => s + r[j], 0));
    const Ex = XS.reduce((s, x, i) => s + x * px[i], 0), Ey = YS.reduce((s, y, j) => s + y * py[j], 0), Vx = XS.reduce((s, x, i) => s + x * x * px[i], 0) - Ex * Ex, Vy = YS.reduce((s, y, j) => s + y * y * py[j], 0) - Ey * Ey;
    let Exy = 0; XS.forEach((x, i) => YS.forEach((y, j) => Exy += x * y * P[i][j])); const cov = Exy - Ex * Ey, rho = cov / Math.sqrt(Vx * Vy), ind = XS.every((_, i) => YS.every((_, j) => Math.abs(P[i][j] - px[i] * py[j]) < 1e-3));
    const cond = XS.map((x, i) => px[i] ? YS.reduce((s, y, j) => s + y * P[i][j] / px[i], 0) : NaN);
    $('#cj-st').innerHTML = A.stats([['E[X]', f3(Ex)], ['E[Y]', f3(Ey)], ['Cov(X, Y)', f4(cov)], ['Correlación ρ', f3(rho)], ['¿Independientes?', ind ? 'Sí' : 'No']]);
    $('#cj-tbl').innerHTML = `<tr><th>X \\ Y</th>${YS.map(y => `<th>Y = ${y}</th>`).join('')}<th>P(X)</th><th>E[Y | X]</th></tr>` + XS.map((x, i) => `<tr><td>X = ${x}</td>${P[i].map(v => `<td style="background:rgba(242,169,59,${(v * 1.6).toFixed(2)})">${f2(v)}</td>`).join('')}<td><b>${f2(px[i])}</b></td><td>${f2(cond[i])}</td></tr>`).join('') + `<tr><td>P(Y)</td>${py.map(v => `<td><b>${f2(v)}</b></td>`).join('')}<td>1</td><td></td></tr>`;
    $('#cj-steps').innerHTML = A.steps([
      `Marginales: P(X = x) es la suma de su fila; P(Y = y), la suma de su columna. E[X] = ${f3(Ex)}, E[Y] = ${f3(Ey)}.`,
      `E[XY] = Σ x·y·P(x, y) = ${f4(Exy)}. Covarianza: E[XY] − E[X]·E[Y] = ${f4(Exy)} − ${f3(Ex)}×${f3(Ey)} = <b>${f4(cov)}</b>.`,
      `Correlación: Cov/(σx·σy) = ${f4(cov)}/(${f3(Math.sqrt(Vx))}×${f3(Math.sqrt(Vy))}) = <b>${f3(rho)}</b>. Va de −1 a 1 y no depende de las unidades.`,
      `Esperanza condicional (última columna): cuántas aprueba en promedio en el 2.º cuatrimestre según cuántas aprobó en el 1.º. ${cond[2] > cond[0] ? 'Sube con X: relación positiva.' : cond[2] < cond[0] ? 'Baja con X: relación negativa.' : ''}`,
      `Independencia: P(x, y) = P(x)·P(y) en <b>todas</b> las celdas. ${ind ? 'Se cumple.' : 'No se cumple.'} Independientes implica covarianza cero, pero covarianza cero no siempre implica independencia.`]);
  }
}

/* ================= Correlación: lo que muestra y lo que esconde ================= */
{
  const st = { mode: 'norm' }; let pts = [];
  const D = [['rho', 'Correlación de la población ρ', -1, 1, .01, .7, 2], ['n', 'Puntos', 10, 400, 10, 120, 0]];
  const gen = () => {
    const n = st.n;
    if (st.mode === 'norm') pts = Array.from({ length: n }, () => { const a = S.rnorm(), b = S.rnorm(); return [a, st.rho * a + Math.sqrt(1 - st.rho ** 2) * b]; });
    if (st.mode === 'curva') pts = Array.from({ length: n }, () => { const x = Math.random() * 4 - 2; return [x, x * x + .3 * S.rnorm()]; });
    if (st.mode === 'atip') pts = [...Array.from({ length: n - 1 }, () => [S.rnorm(), S.rnorm()]), [8, 8]];
    if (st.mode === 'grupos') pts = Array.from({ length: n }, (_, i) => { const g = i % 2, x = S.rnorm() * .6 + g * 3; return [x, -x + g * 6 + .4 * S.rnorm()]; });
  };
  A.tool({
    id: 'correlacion', mat: 'est1', unit: 5, ord: 1, name: 'Correlación: lo que muestra y lo que esconde', short: 'Correlación', tag: 'Dependencia lineal', f: 'r = Σ(x − x̄)(y − ȳ) / √(ΣΣ)',
    desc: 'Mirá cómo se ve cada valor de correlación y tres trampas clásicas: relaciones curvas, un solo atípico y grupos mezclados.',
    lead: 'La correlación mide qué tan bien una recta resume la relación entre dos variables. Es útil, pero un solo número esconde mucho: siempre hay que mirar el gráfico.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Datos</label>${A.seg('cr-m', [['norm', 'Normales con ρ'], ['curva', 'Relación curva'], ['atip', 'Un atípico'], ['grupos', 'Dos grupos']], 'norm')}</div>${A.sliders('cr', D)}<button class="btn sm" id="cr-go" style="align-self:flex-start">Nuevos datos</button><div class="big sm" id="cr-r"></div></div>
      <div class="stage"><canvas id="cr-cv" style="width:min(100%,480px);aspect-ratio:1;align-self:center"></canvas><div class="explain" id="cr-exp"></div></div></div>`,
    init() { A.bindSliders('cr', D, st, () => { gen(); upd(); }); A.segBind('cr-m', v => { st.mode = v; gen(); upd(); }); $('#cr-go').onclick = () => { gen(); upd(); }; gen(); upd(); },
    draw
  });
  let r = 0, fit = null;
  function upd() {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0, syy = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
    r = sxy / Math.sqrt(sxx * syy); fit = { b: sxy / sxx, a: my - sxy / sxx * mx }; $('#cr-r').textContent = 'r = ' + f3(r);
    $('#cr-exp').innerHTML = `<p>${{ norm: `Con ρ = ${f2(st.rho)} en la población, la muestra da r = ${f3(r)}. Cerca de ±1 los puntos se pegan a una recta; cerca de 0 forman una nube sin dirección. Ojo: r = 0,5 no significa "la mitad de relacionados": r² = ${f2(r * r)} es la proporción de variación que explica la recta.`, curva: `y depende <b>totalmente</b> de x (y ≈ x²), pero r ≈ ${f2(r)}. La correlación solo mide relación <b>lineal</b>: una U perfecta puede tener correlación cero.`, atip: `Los datos no tienen ninguna relación, pero un solo punto extremo lleva r a ${f3(r)}. Un atípico puede fabricar (o esconder) una correlación.`, grupos: `Dentro de cada grupo la relación es <b>negativa</b>, pero juntando los grupos sale r = ${f3(r)}. Es la <b>paradoja de Simpson</b>: una tercera variable (el grupo) cambia todo.` }[st.mode]} Y siempre: correlación no implica causalidad.</p>`;
    draw();
  }
  function draw() { if (!pts.length) return; const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), lo = Math.min(...xs, ...ys) - .5, hi = Math.max(...xs, ...ys) + .5, g = A.ax($('#cr-cv'), [lo, hi], [lo, hi], { l: 36 }); if (!g) return; pts.forEach(([x, y], i) => g.dot(x, y, st.mode === 'grupos' ? (i % 2 ? K.rose : K.teal) : K.teal, 3)); g.fn(x => fit.a + fit.b * x, K.amber, 2.2); }
}

/* ===================================== ESTADÍSTICA II ===================================== */

/* ================= Propiedades de los estimadores ================= */
{
  const st = {}; let R = null;
  const D = [['n', 'Tamaño de cada muestra', 2, 100, 1, 8, 0]];
  A.tool({
    id: 'estimadores', mat: 'est2', unit: 1, ord: 0, name: 'Estimadores: sesgo, eficiencia y consistencia', short: 'Estimadores', tag: 'Muestreo', f: 'ECM = Var + sesgo²',
    desc: 'Por qué la varianza muestral divide por n − 1, y por qué la media es mejor estimador que la mediana en una normal.',
    lead: 'Un estimador es una receta para adivinar un parámetro de la población con una muestra. Simulamos 5.000 muestras de una población normal con media 50 y varianza 100, y comparamos recetas.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('es', D)}<button class="btn primary sm" id="es-go" style="align-self:flex-start">Simular de nuevo</button></div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="es-tbl"></table></div><h3>Estimaciones de la varianza (valor real: 100)</h3><canvas id="es-cv" style="height:260px"></canvas>${A.legend([['teal', 'Dividiendo por n − 1 (s²)'], ['rose', 'Dividiendo por n']])}<div class="steplist" id="es-steps"></div></div></div>`,
    init() { A.bindSliders('es', D, st, run); $('#es-go').onclick = run; run(); },
    draw
  });
  function run() {
    const s1 = [], s0 = [], mm = [], md = [];
    for (let k = 0; k < 5000; k++) { const x = Array.from({ length: st.n }, () => 50 + 10 * S.rnorm()), m = mean(x), ss = x.reduce((s, v) => s + (v - m) ** 2, 0); s1.push(ss / (st.n - 1)); s0.push(ss / st.n); mm.push(m); md.push(median(x)); }
    const row = (nm, a, th) => { const m = mean(a), v = a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length; return `<tr><td>${nm}</td><td>${f2(m)}</td><td>${f2(m - th)}</td><td>${f2(v)}</td><td>${f2(v + (m - th) ** 2)}</td></tr>`; };
    R = { s1, s0 };
    $('#es-tbl').innerHTML = `<tr><th>Estimador</th><th>Promedio</th><th>Sesgo</th><th>Varianza</th><th>ECM</th></tr>` + row('s² (÷ n − 1)', s1, 100) + row('σ̂² (÷ n)', s0, 100) + row('Media muestral', mm, 50) + row('Mediana muestral', md, 50);
    $('#es-steps').innerHTML = A.steps([
      `<b>Sesgo:</b> dividiendo por n el promedio de las estimaciones da ${f2(mean(s0))} y no 100: subestima sistemáticamente, en un factor (n − 1)/n = ${f3((st.n - 1) / st.n)}. Al calcular los desvíos respecto de la media de la <b>muestra</b> (y no la verdadera), salen un poco más chicos. Dividir por n − 1 lo corrige: es <b>insesgado</b>.`,
      `<b>Eficiencia:</b> la media y la mediana son insesgadas para μ en una normal, pero la media tiene menor varianza. Es más <b>eficiente</b> (con n grande, la varianza de la mediana es ≈ 57% mayor).`,
      `<b>Error cuadrático medio</b> = varianza + sesgo². Curiosamente, σ̂² (sesgado) puede tener menor ECM que s²: a veces un poco de sesgo se compensa con menos varianza.`,
      `<b>Consistencia:</b> subí n y mirá cómo las dos distribuciones se angostan y se juntan alrededor de 100. Con muestras grandes, la diferencia entre n y n − 1 desaparece.`]);
    draw();
  }
  function draw() { if (!R) return; const hi = Math.max(300, 100 * (1 + 4 * Math.sqrt(2 / (st.n - 1)))), bins = 60, a = binsOf(R.s1, 0, hi, bins), b = binsOf(R.s0, 0, hi, bins), ym = Math.max(...a, ...b) * 1.1, g = A.ax($('#es-cv'), [0, hi], [0, ym], { yf: v => fmt(v, 0) }); if (!g) return; bars(g, b, 0, hi / bins, 'rgba(239,115,145,.55)'); bars(g, a, 0, hi / bins, 'rgba(67,200,184,.55)'); g.vline(100, K.fg, 2); }
}

/* ================= Tamaño de muestra ================= */
{
  const st = { kind: 'prop' };
  const D = [['E', 'Margen de error (puntos porcentuales o unidades)', .5, 10, .1, 3, 1], ['p', 'Proporción esperada (%)', 1, 99, 1, 50, 0], ['sd', 'Desvío poblacional σ (para medias)', 1, 100, 1, 15, 0], ['N', 'Tamaño de la población (0 = muy grande)', 0, 100000, 100, 0, 0]];
  let conf = .95;
  A.tool({
    id: 'tamano-muestra', mat: 'est2', unit: 2, ord: 1, name: 'Tamaño de muestra para encuestas', short: 'Tamaño de muestra', tag: 'Diseño muestral', f: 'n = z²·p(1 − p) / E²',
    desc: '¿A cuántas personas hay que encuestar para tener un margen de error de ±3%? Para proporciones y para medias, con corrección por población finita.',
    lead: 'Antes de salir a encuestar hay que decidir cuántos casos hacen falta. Depende de la precisión que querés (margen de error), de la confianza y de cuánta variabilidad esperás. Sorprendentemente, casi no depende del tamaño de la población.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Qué estimás</label>${A.seg('tm-k', [['prop', 'Una proporción'], ['media', 'Una media']], 'prop')}</div><div><label class="l">Confianza</label>${A.seg('tm-c', [['0.9', '90%'], ['0.95', '95%'], ['0.99', '99%']], '0.95')}</div>${A.sliders('tm', D)}</div>
      <div class="stage"><div class="big" id="tm-n"></div><p class="note">casos necesarios</p><canvas id="tm-cv" style="height:260px"></canvas><div class="steplist" id="tm-steps"></div></div></div>`,
    init() { A.bindSliders('tm', D, st, upd); A.segBind('tm-k', v => { st.kind = v; upd(); }); A.segBind('tm-c', v => { conf = +v; upd(); }); upd(); },
    draw
  });
  const nOf = E => { const z = S.zInv(1 - (1 - conf) / 2), n0 = st.kind === 'prop' ? z * z * (st.p / 100) * (1 - st.p / 100) / (E / 100) ** 2 : (z * st.sd / E) ** 2; return { z, n0, n: st.N ? n0 / (1 + (n0 - 1) / st.N) : n0 }; };
  function upd() {
    $('#tm-p').closest('div').hidden = st.kind !== 'prop'; $('#tm-sd').closest('div').hidden = st.kind !== 'media';
    const r = nOf(st.E); $('#tm-n').textContent = fmt(Math.ceil(r.n), 0);
    $('#tm-steps').innerHTML = A.steps([
      st.kind === 'prop' ? `n₀ = z²·p(1 − p)/E² = ${f3(r.z)}² × ${f2(st.p / 100)} × ${f2(1 - st.p / 100)} / ${fmt(st.E / 100, 3)}² = <b>${fmt(r.n0, 1)}</b>.` : `n₀ = (z·σ/E)² = (${f3(r.z)} × ${st.sd}/${f2(st.E)})² = <b>${fmt(r.n0, 1)}</b>.`,
      st.N ? `Corrección por población finita (N = ${fmt(st.N, 0)}): n = n₀/(1 + (n₀ − 1)/N) = <b>${fmt(r.n, 1)}</b>.` : `Con una población muy grande no hace falta corrección: un país de 45 millones necesita casi la misma muestra que una ciudad de 500.000.`,
      `Redondeando hacia arriba: <b>${fmt(Math.ceil(r.n), 0)} casos</b>. ${st.kind === 'prop' && st.p === 50 ? 'Usar p = 50% es lo más conservador: es donde p(1 − p) es máximo.' : ''}`,
      `Mirá la curva: para reducir el margen de error a la mitad hace falta <b>cuatro veces</b> más muestra. Por eso las encuestas rara vez bajan de ±2%.`]);
    draw();
  }
  function draw() { const pts = Array.from({ length: 96 }, (_, i) => { const E = .5 + i * .1; return [E, nOf(E).n]; }), g = A.ax($('#tm-cv'), [.5, 10], [0, Math.min(Math.max(...pts.map(p => p[1])), nOf(1).n * 1.05)], { xf: v => '±' + fmt(v, 1), l: 56 }); if (!g) return; g.path(pts, K.amber, 2.4); g.guide(st.E, nOf(st.E).n); g.dot(st.E, nOf(st.E).n, K.fg, 6); g.labels('Margen de error', 'n'); }
}

/* ================= Intervalo para la varianza ================= */
{
  const st = {};
  const D = [['s', 'Desvío muestral s', .1, 50, .1, 4, 1], ['n', 'Tamaño de muestra n', 3, 200, 1, 20, 0]];
  let conf = .95, R = null;
  A.tool({
    id: 'ic-varianza', mat: 'est2', unit: 2, ord: 2, name: 'Intervalo de confianza para la varianza', short: 'IC para la varianza', tag: 'Distribución chi cuadrado', f: '[(n−1)s²/χ²₁₋α/₂ ; (n−1)s²/χ²α/₂]',
    desc: 'Estimá cuánto varía una población (riesgo, calidad, dispersión) con la distribución chi cuadrado.',
    lead: 'A veces no interesa el promedio sino la variabilidad: la dispersión del peso de un producto, la volatilidad de un activo. Si la población es normal, (n − 1)·s²/σ² sigue una chi cuadrado con n − 1 grados de libertad, y de ahí sale el intervalo.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('icv', D)}<div><label class="l">Confianza</label>${A.seg('icv-c', [['0.9', '90%'], ['0.95', '95%'], ['0.99', '99%']], '0.95')}</div></div>
      <div class="stage"><dl class="stats" id="icv-st" style="margin:0"></dl><canvas id="icv-cv" style="height:260px"></canvas><div class="steplist" id="icv-steps"></div></div></div>`,
    init() { A.bindSliders('icv', D, st, upd); A.segBind('icv-c', v => { conf = +v; upd(); }); upd(); },
    draw
  });
  function upd() {
    const df = st.n - 1, a = 1 - conf, lo = chiInv(a / 2, df), hi = chiInv(1 - a / 2, df), s2 = st.s ** 2, L = df * s2 / hi, U = df * s2 / lo; R = { df, lo, hi };
    $('#icv-st').innerHTML = A.stats([['IC para σ²', `[${f2(L)}; ${f2(U)}]`], ['IC para σ', `[${f3(Math.sqrt(L))}; ${f3(Math.sqrt(U))}]`], ['s²', f2(s2)]]);
    $('#icv-steps').innerHTML = A.steps([
      `Grados de libertad: n − 1 = ${df}. Valores de la chi cuadrado que dejan ${pct(a / 2, 1)} en cada cola: χ²<sub>inf</sub> = ${f3(lo)} y χ²<sub>sup</sub> = ${f3(hi)}.`,
      `Límite inferior: (n − 1)·s²/χ²<sub>sup</sub> = ${df} × ${f2(s2)}/${f3(hi)} = <b>${f2(L)}</b>. Límite superior: ${df} × ${f2(s2)}/${f3(lo)} = <b>${f2(U)}</b>.`,
      `Para el desvío, se saca raíz a los dos extremos: [${f3(Math.sqrt(L))}; ${f3(Math.sqrt(U))}].`,
      `El intervalo <b>no es simétrico</b> alrededor de s² porque la chi cuadrado no es simétrica. Y este método es sensible: si la población no es normal, puede fallar bastante.`]);
    draw();
  }
  function draw() { if (!R) return; const xm = R.hi * 1.4, pdf = x => S.chiPdf(x, R.df); let ym = 0; for (let i = 1; i < 200; i++) ym = Math.max(ym, pdf(xm * i / 200)); const g = A.ax($('#icv-cv'), [0, xm], [0, Math.min(ym, .6) * 1.15], { l: 36 }); if (!g) return; g.area(pdf, () => 0, R.lo, R.hi, 'rgba(67,200,184,.3)'); g.area(pdf, () => 0, 0, R.lo, 'rgba(239,115,145,.35)'); g.area(pdf, () => 0, R.hi, xm, 'rgba(239,115,145,.35)'); g.fn(pdf, K.fg, 2, null, [xm * .002, xm]); }
}

/* ================= Bootstrap ================= */
{
  const SAMPLE = '320 410 280 950 365 290 1200 430 310 520 275 380 2400 340 460 300 610 355 290 480 330 700 395 285 520';
  const st = { stat: 'median' }; let R = null;
  const FN = { mean: ['Media', mean], median: ['Mediana', median], sd: ['Desvío estándar', a => Math.sqrt(vr(a))] };
  A.tool({
    id: 'bootstrap', mat: 'est2', unit: 2, ord: 3, name: 'Bootstrap: intervalos remuestreando', short: 'Bootstrap', tag: 'Métodos computacionales', f: 'remuestrear con reposición B veces',
    desc: 'Construí intervalos de confianza para la mediana o cualquier estadístico sin fórmulas, remuestreando tus datos miles de veces.',
    lead: 'Para la media hay fórmulas, ¿pero para la mediana? El bootstrap usa la computadora: saca miles de muestras de tus propios datos (con reposición), calcula el estadístico en cada una y mira cuánto varía. Datos de ejemplo: ingresos mensuales (en miles), muy asimétricos.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l" for="bs-d">Datos</label><textarea class="field" id="bs-d" spellcheck="false"></textarea></div><div><label class="l">Estadístico</label>${A.seg('bs-s', [['median', 'Mediana'], ['mean', 'Media'], ['sd', 'Desvío']], 'median')}</div><button class="btn primary sm" id="bs-go" style="align-self:flex-start">Remuestrear 4.000 veces</button><dl class="stats" id="bs-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="bs-cv" style="height:300px"></canvas>${A.legend([['amber', 'Estadístico en cada remuestra'], ['teal', 'Intervalo del 95% (percentiles 2,5 y 97,5)']])}<div class="steplist" id="bs-steps"></div></div></div>`,
    init() { $('#bs-d').value = SAMPLE; $('#bs-d').oninput = run; A.segBind('bs-s', v => { st.stat = v; run(); }); $('#bs-go').onclick = run; run(); },
    draw
  });
  function run() {
    const d = parseNums($('#bs-d').value); if (d.length < 3) return; const f = FN[st.stat][1], est = f(d), B = 4000, bs = [];
    for (let b = 0; b < B; b++) bs.push(f(Array.from({ length: d.length }, () => d[Math.floor(Math.random() * d.length)])));
    bs.sort((a, b) => a - b); const lo = bs[Math.floor(.025 * B)], hi = bs[Math.floor(.975 * B)], se = Math.sqrt(vr(bs)), tc = S.tInv(.975, d.length - 1), m = mean(d), sem = Math.sqrt(vr(d) / d.length);
    R = { bs, lo, hi, est };
    $('#bs-st').innerHTML = A.stats([[FN[st.stat][0] + ' de la muestra', f2(est)], ['Error estándar bootstrap', f2(se)], ['IC 95% bootstrap', `[${f2(lo)}; ${f2(hi)}]`], ...(st.stat === 'mean' ? [['IC 95% con la fórmula t', `[${f2(m - tc * sem)}; ${f2(m + tc * sem)}]`]] : [])]);
    $('#bs-steps').innerHTML = A.steps([
      `La muestra tiene ${d.length} datos. Saco una remuestra del mismo tamaño eligiendo datos al azar <b>con reposición</b> (algunos se repiten, otros quedan afuera) y calculo la ${FN[st.stat][0].toLowerCase()}. Repito 4.000 veces.`,
      `La dispersión de esas 4.000 estimaciones aproxima cuánto variaría el estadístico entre muestras de la población: error estándar ≈ <b>${f2(se)}</b>.`,
      `Intervalo percentil: el 2,5% y el 97,5% de las estimaciones ordenadas = <b>[${f2(lo)}; ${f2(hi)}]</b>.`,
      st.stat === 'median' ? `Con datos tan asimétricos (hay ingresos muy altos), la mediana es mejor resumen que la media, y el bootstrap permite darle un intervalo sin fórmula. Fijate que la distribución es irregular: la mediana solo puede tomar ciertos valores.` : st.stat === 'mean' ? `Para la media el bootstrap da algo parecido a la fórmula t, pero respeta la asimetría de los datos.` : `El desvío es muy sensible a los valores extremos: si sale el 2.400 en la remuestra, se dispara.`]);
    draw();
  }
  function draw() { if (!R) return; const lo = R.bs[0], hi = R.bs[R.bs.length - 1], pad = (hi - lo) * .05 || 1, bins = 50, cnt = binsOf(R.bs, lo - pad, hi + pad, bins), g = A.ax($('#bs-cv'), [lo - pad, hi + pad], [0, Math.max(...cnt) * 1.12], { yf: v => fmt(v, 0) }); if (!g) return; g.poly([[R.lo, 0], [R.hi, 0], [R.hi, Math.max(...cnt) * 1.12], [R.lo, Math.max(...cnt) * 1.12]], 'rgba(67,200,184,.12)'); bars(g, cnt, lo - pad, (hi - lo + 2 * pad) / bins, 'rgba(242,169,59,.85)'); g.vline(R.lo, K.teal, 1.8); g.vline(R.hi, K.teal, 1.8); g.vline(R.est, K.fg, 1.5, [4, 3]); }
}

/* ================= Dos muestras ================= */
{
  const st = { kind: 'media' }; let R = null;
  const V = { m1: 6.8, s1: 1.5, n1: 40, m2: 6.1, s2: 1.8, n2: 35, x1: 48, nn1: 120, x2: 30, nn2: 110 };
  let conf = .95;
  A.tool({
    id: 'dos-muestras', mat: 'est2', unit: 4, ord: 0, name: 'Comparación de dos poblaciones', short: 'Dos muestras', tag: 'Diferencia de medias y de proporciones', f: 't = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂)',
    desc: 'Test e intervalo para la diferencia entre dos grupos independientes: medias (t de Welch) o proporciones (z).',
    lead: '¿Al turno mañana le va mejor que al turno tarde? ¿La campaña A convierte más que la B? Para comparar dos grupos independientes se mira si la diferencia observada es grande comparada con su error estándar.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Qué comparás</label>${A.seg('dm2-k', [['media', 'Medias'], ['prop', 'Proporciones']], 'media')}</div>
      <div id="dm2-media" class="grid3"><div><label class="l" for="dm2-m1">Media 1</label><input class="field" id="dm2-m1" value="6,8"></div><div><label class="l" for="dm2-s1">Desvío 1</label><input class="field" id="dm2-s1" value="1,5"></div><div><label class="l" for="dm2-n1">n₁</label><input class="field" id="dm2-n1" value="40"></div><div><label class="l" for="dm2-m2">Media 2</label><input class="field" id="dm2-m2" value="6,1"></div><div><label class="l" for="dm2-s2">Desvío 2</label><input class="field" id="dm2-s2" value="1,8"></div><div><label class="l" for="dm2-n2">n₂</label><input class="field" id="dm2-n2" value="35"></div></div>
      <div id="dm2-prop" class="grid2" hidden><div><label class="l" for="dm2-x1">Éxitos grupo 1</label><input class="field" id="dm2-x1" value="48"></div><div><label class="l" for="dm2-nn1">Total grupo 1</label><input class="field" id="dm2-nn1" value="120"></div><div><label class="l" for="dm2-x2">Éxitos grupo 2</label><input class="field" id="dm2-x2" value="30"></div><div><label class="l" for="dm2-nn2">Total grupo 2</label><input class="field" id="dm2-nn2" value="110"></div></div>
      <div><label class="l">Confianza</label>${A.seg('dm2-c', [['0.9', '90%'], ['0.95', '95%'], ['0.99', '99%']], '0.95')}</div></div>
      <div class="stage"><div id="dm2-pill"></div><dl class="stats" id="dm2-st" style="margin:0"></dl><canvas id="dm2-cv" style="height:220px"></canvas><div class="steplist" id="dm2-steps"></div></div></div>`,
    init() { A.segBind('dm2-k', v => { st.kind = v; $('#dm2-media').hidden = v !== 'media'; $('#dm2-prop').hidden = v !== 'prop'; upd(); }); A.segBind('dm2-c', v => { conf = +v; upd(); }); Object.keys(V).forEach(k => $('#dm2-' + k).oninput = e => { V[k] = A.num(e.target.value); upd(); }); upd(); },
    draw
  });
  function upd() {
    let d, se, stat, p, crit, steps, df;
    if (st.kind === 'media') {
      const a = V.s1 ** 2 / V.n1, b = V.s2 ** 2 / V.n2; se = Math.sqrt(a + b); d = V.m1 - V.m2; df = (a + b) ** 2 / (a * a / (V.n1 - 1) + b * b / (V.n2 - 1)); stat = d / se; p = 2 * (1 - S.tCdf(Math.abs(stat), df)); crit = S.tInv(1 - (1 - conf) / 2, df);
      steps = [`Diferencia observada: ${f2(V.m1)} − ${f2(V.m2)} = <b>${f2(d)}</b>.`, `Error estándar: √(s₁²/n₁ + s₂²/n₂) = √(${f3(a)} + ${f3(b)}) = <b>${f3(se)}</b>.`, `t = ${f2(d)}/${f3(se)} = <b>${f2(stat)}</b>, con ${f2(df)} grados de libertad (fórmula de Welch, que no supone varianzas iguales). p-valor bilateral = <b>${pv(p)}</b>.`, `Intervalo: ${f2(d)} ± ${f3(crit)} × ${f3(se)} = <b>[${f2(d - crit * se)}; ${f2(d + crit * se)}]</b>. ${d - crit * se > 0 || d + crit * se < 0 ? 'No incluye al 0: la diferencia es significativa.' : 'Incluye al 0: no se puede descartar que no haya diferencia.'}`];
    } else {
      const p1 = V.x1 / V.nn1, p2 = V.x2 / V.nn2, pp = (V.x1 + V.x2) / (V.nn1 + V.nn2), se0 = Math.sqrt(pp * (1 - pp) * (1 / V.nn1 + 1 / V.nn2)); se = Math.sqrt(p1 * (1 - p1) / V.nn1 + p2 * (1 - p2) / V.nn2); d = p1 - p2; stat = d / se0; p = 2 * (1 - S.normCdf(Math.abs(stat))); crit = S.zInv(1 - (1 - conf) / 2);
      steps = [`Proporciones: p̂₁ = ${pct(p1, 1)}, p̂₂ = ${pct(p2, 1)}. Diferencia: <b>${pct(d, 1)}</b>.`, `Para el test, bajo H₀ (sin diferencia) se usa la proporción combinada p̂ = ${pct(pp, 1)}: EE₀ = √(p̂(1 − p̂)(1/n₁ + 1/n₂)) = ${fmt(se0, 4)}.`, `z = ${fmt(d, 4)}/${fmt(se0, 4)} = <b>${f2(stat)}</b>; p-valor = <b>${pv(p)}</b>.`, `Intervalo (con el error estándar sin combinar, ${fmt(se, 4)}): <b>[${pct(d - crit * se, 1)}; ${pct(d + crit * se, 1)}]</b>.`];
    }
    R = { d, se, crit }; const sig = p < 1 - conf;
    $('#dm2-pill').innerHTML = `<span class="pill ${sig ? 'warn' : 'ok'}">${sig ? 'Diferencia significativa' : 'Diferencia no significativa'}</span>`;
    $('#dm2-st').innerHTML = A.stats([['Diferencia', st.kind === 'media' ? f2(d) : pct(d, 1)], ['Estadístico', f2(stat)], ['p-valor', pv(p)]]);
    $('#dm2-steps').innerHTML = A.steps(steps); draw();
  }
  function draw() { if (!R) return; const lo = Math.min(0, R.d) - 4 * R.se, hi = Math.max(0, R.d) + 4 * R.se, pdf = x => S.normPdf(x, R.d, R.se), g = A.ax($('#dm2-cv'), [lo, hi], [0, pdf(R.d) * 1.15], { yf: () => '', l: 14, xf: v => st.kind === 'prop' ? pct(v, 0) : fmt(v, 2) }); if (!g) return; g.area(pdf, () => 0, R.d - R.crit * R.se, R.d + R.crit * R.se, 'rgba(67,200,184,.3)'); g.fn(pdf, K.fg, 2); g.vline(0, K.rose, 2); g.text('sin diferencia', 0, pdf(R.d) * 1.05, K.rose); }
}

/* ================= Muestras pareadas ================= */
{
  const SAMPLE = '52 61\n48 55\n70 72\n65 70\n58 57\n45 54\n63 69\n55 60\n67 66\n50 58\n60 64\n57 63';
  let R = null;
  A.tool({
    id: 'pareadas', mat: 'est2', unit: 4, ord: 1, name: 'Test t para muestras pareadas', short: 'Muestras pareadas', tag: 'Antes y después', f: 't = d̄ / (s_d/√n)',
    desc: 'Cuando medís a las mismas personas dos veces (antes y después de un curso, por ejemplo), se analizan las diferencias.',
    lead: 'Si los datos vienen de a pares (la misma persona antes y después), no son muestras independientes. Lo correcto es calcular la diferencia de cada par y testear si su promedio es cero. Esto elimina la variación entre personas y gana mucha precisión. Pegá dos columnas: antes y después.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l" for="pr2-d">Antes y después (una persona por línea)</label><textarea class="field" id="pr2-d" spellcheck="false" style="min-height:220px"></textarea></div><dl class="stats" id="pr2-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="pr2-cv" style="height:320px"></canvas>${A.legend([['teal', 'Mejoró'], ['rose', 'Empeoró']])}<div class="steplist" id="pr2-steps"></div></div></div>`,
    init() { $('#pr2-d').value = SAMPLE; $('#pr2-d').oninput = upd; upd(); },
    draw
  });
  function upd() {
    const pairs = $('#pr2-d').value.trim().split(/\n/).map(l => l.trim().split(/[\s;]+/).map(t => Number(t.replace(',', '.')))).filter(p => p.length >= 2 && p.every(Number.isFinite));
    if (pairs.length < 3) { $('#pr2-steps').innerHTML = '<p class="err">Necesito al menos 3 pares.</p>'; R = null; return; }
    const d = pairs.map(([a, b]) => b - a), n = d.length, md = mean(d), sd = Math.sqrt(vr(d)), se = sd / Math.sqrt(n), t = md / se, p = 2 * (1 - S.tCdf(Math.abs(t), n - 1)), tc = S.tInv(.975, n - 1);
    const a1 = pairs.map(p => p[0]), a2 = pairs.map(p => p[1]), seInd = Math.sqrt(vr(a1) / n + vr(a2) / n), pInd = 2 * (1 - S.tCdf(Math.abs(md / seInd), 2 * n - 2));
    R = { pairs };
    $('#pr2-st').innerHTML = A.stats([['Diferencia promedio', f2(md)], ['Desvío de las diferencias', f2(sd)], ['t', f2(t)], ['p-valor', pv(p)], ['IC 95%', `[${f2(md - tc * se)}; ${f2(md + tc * se)}]`]]);
    $('#pr2-steps').innerHTML = A.steps([
      `Calculo la diferencia de cada par (después − antes): ${d.slice(0, 8).map(x => f2(x)).join(', ')}${n > 8 ? '…' : ''}. Promedio d̄ = <b>${f2(md)}</b>, desvío s<sub>d</sub> = ${f2(sd)}.`,
      `t = d̄/(s<sub>d</sub>/√n) = ${f2(md)}/(${f2(sd)}/√${n}) = <b>${f2(t)}</b>, con ${n - 1} grados de libertad. p-valor = <b>${pv(p)}</b>.`,
      `${p < .05 ? 'Hay evidencia de un cambio entre antes y después.' : 'No hay evidencia suficiente de un cambio.'}`,
      `Si lo hubieras analizado como dos muestras independientes, el p-valor sería ${pv(pInd)}: ${pInd > p ? 'mucho menos preciso, porque las diferencias entre personas (unos parten de 45 y otros de 70) quedan mezcladas con el efecto. Emparejar las saca del medio.' : 'parecido en este caso.'}`]);
    draw();
  }
  function draw() { if (!R) return; const all = R.pairs.flat(), g = A.ax($('#pr2-cv'), [-.3, 1.3], [Math.min(...all) * .95, Math.max(...all) * 1.04], { xticks: [0, 1], xf: v => v ? 'Después' : 'Antes', l: 40 }); if (!g) return; R.pairs.forEach(([a, b]) => { const c = b >= a ? K.teal : K.rose; g.path([[0, a], [1, b]], c, 1.6); g.dot(0, a, c, 4); g.dot(1, b, c, 4); }); }
}

/* ================= ANOVA de un factor ================= */
{
  const SAMPLE = 'Método A: 6 7 5 8 6 7 6 5 7\nMétodo B: 8 7 9 8 7 9 8 8\nMétodo C: 5 6 5 4 6 5 7 5 6';
  let R = null;
  A.tool({
    id: 'anova', mat: 'est2', unit: 4, ord: 2, name: 'ANOVA de un factor', short: 'ANOVA', tag: 'Comparación de varias medias', f: 'F = CM entre / CM dentro',
    desc: 'Compará tres o más grupos a la vez. Descomposición de la variabilidad, tabla ANOVA y test F.',
    lead: 'Para comparar varias medias no se hacen muchos tests t de a pares (se acumula el error). El ANOVA separa la variación total en la que hay <b>entre</b> los grupos y la que hay <b>dentro</b> de cada uno: si la primera es grande comparada con la segunda, las medias difieren. Ejemplo: notas con tres métodos de estudio.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l" for="an-d">Grupos (uno por línea: nombre y valores)</label><textarea class="field" id="an-d" spellcheck="false" style="min-height:160px"></textarea><p class="err" id="an-err"></p></div><dl class="stats" id="an-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="an-cv" style="height:300px"></canvas><div class="tbl-wrap"><table class="tbl" id="an-tbl"></table></div><div class="steplist" id="an-steps"></div></div></div>`,
    init() { $('#an-d').value = SAMPLE; $('#an-d').oninput = upd; upd(); },
    draw
  });
  function upd() {
    const G = $('#an-d').value.trim().split(/\n/).map(l => { const [nm, rest] = l.includes(':') ? l.split(':') : ['Grupo', l]; return { nm: nm.trim(), x: parseNums(rest || '') }; }).filter(g => g.x.length >= 2);
    if (G.length < 2) { $('#an-err').textContent = 'Necesito al menos 2 grupos con 2 datos cada uno.'; R = null; return; } $('#an-err').textContent = '';
    const all = G.flatMap(g => g.x), N = all.length, k = G.length, gm = mean(all);
    G.forEach(g => g.m = mean(g.x)); const SSB = G.reduce((s, g) => s + g.x.length * (g.m - gm) ** 2, 0), SSW = G.reduce((s, g) => s + g.x.reduce((t, v) => t + (v - g.m) ** 2, 0), 0), SST = SSB + SSW;
    const dfb = k - 1, dfw = N - k, MSB = SSB / dfb, MSW = SSW / dfw, F = MSB / MSW, p = 1 - fCdf(F, dfb, dfw);
    R = { G, gm };
    $('#an-st').innerHTML = A.stats([['F', f2(F)], ['p-valor', pv(p)], ['η² (variación explicada)', pct(SSB / SST, 1)]]);
    $('#an-tbl').innerHTML = `<tr><th>Fuente</th><th>Suma de cuadrados</th><th>gl</th><th>Cuadrado medio</th><th>F</th></tr><tr><td>Entre grupos</td><td>${f3(SSB)}</td><td>${dfb}</td><td>${f3(MSB)}</td><td>${f2(F)}</td></tr><tr><td>Dentro de grupos</td><td>${f3(SSW)}</td><td>${dfw}</td><td>${f3(MSW)}</td><td></td></tr><tr><td>Total</td><td>${f3(SST)}</td><td>${N - 1}</td><td></td><td></td></tr>`;
    $('#an-steps').innerHTML = A.steps([
      `Media general: ${f3(gm)}. Medias de cada grupo: ${G.map(g => `${g.nm} ${f2(g.m)}`).join(', ')}.`,
      `Variación <b>entre</b> grupos: Σ nᵢ(x̄ᵢ − x̄)² = ${f3(SSB)}. Variación <b>dentro</b>: Σ Σ(x − x̄ᵢ)² = ${f3(SSW)}. Suman la total: ${f3(SST)}.`,
      `Se dividen por sus grados de libertad: CM entre = ${f3(MSB)}, CM dentro = ${f3(MSW)}. F = ${f3(MSB)}/${f3(MSW)} = <b>${f2(F)}</b>, con (${dfb}, ${dfw}) gl. p-valor = <b>${pv(p)}</b>.`,
      `${p < .05 ? 'Se rechaza que todas las medias sean iguales. Ojo: el ANOVA no dice <b>cuál</b> es distinta; para eso se usan comparaciones posteriores (Tukey, Bonferroni).' : 'No hay evidencia de que las medias difieran.'} Supuestos: grupos independientes, normalidad y varianzas parecidas.`]);
    draw();
  }
  function draw() { if (!R) return; const all = R.G.flatMap(g => g.x), g = A.ax($('#an-cv'), [-.5, R.G.length - .5], [Math.min(...all) - 1, Math.max(...all) + 1], { xticks: R.G.map((_, i) => i), xf: v => R.G[v]?.nm || '', l: 36 }); if (!g) return; g.hline(R.gm, K.faint, 1.2, [5, 4]); const COLS = [K.amber, K.teal, K.rose, K.violet, K.fg]; R.G.forEach((G, i) => { G.x.forEach((v, j) => g.dot(i + (Math.sin(j * 9.1) * .12), v, COLS[i % 5], 4)); g.path([[i - .25, G.m], [i + .25, G.m]], COLS[i % 5], 3); }); }
}

/* ================= Bondad de ajuste ================= */
{
  const PRE = { dado: ['¿Dado cargado? (60 tiradas)', ['1', '2', '3', '4', '5', '6'], [5, 8, 9, 8, 10, 20], [1, 1, 1, 1, 1, 1].map(x => x / 6)], benford: ['Ley de Benford (primeros dígitos de 500 facturas)', ['1', '2', '3', '4', '5', '6', '7', '8', '9'], [118, 66, 62, 51, 47, 42, 39, 38, 37], [1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => Math.log10(1 + 1 / d))], mendel: ['Proporción 3:1 de Mendel (plantas)', ['Dominante', 'Recesivo'], [705, 224], [.75, .25]] };
  let cur = null, R = null;
  A.tool({
    id: 'bondad', mat: 'est2', unit: 5, ord: 0, name: 'Test chi cuadrado de bondad de ajuste', short: 'Bondad de ajuste', tag: 'Datos categóricos', f: 'χ² = Σ (O − E)² / E,  gl = k − 1',
    desc: '¿Los datos siguen la distribución que dice la teoría? ¿El dado está cargado? ¿Las facturas cumplen la ley de Benford?',
    lead: 'Se compara cuántos casos observaste en cada categoría con cuántos esperarías si una distribución teórica fuera cierta. Ejemplo curioso: en muchos datos reales el primer dígito es 1 el 30% de las veces (ley de Benford), y los auditores lo usan para detectar números inventados.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Ejemplos</label><div class="chips">${Object.entries(PRE).map(([k, v]) => `<button class="chip" data-bf="${k}">${v[0]}</button>`).join('')}</div></div><div><label class="l">Frecuencias observadas</label><div id="bf-in" class="grid3"></div></div><dl class="stats" id="bf-st" style="margin:0"></dl></div>
      <div class="stage"><div id="bf-pill"></div><canvas id="bf-cv" style="height:280px"></canvas>${A.legend([['amber', 'Observado'], ['teal', 'Esperado según la teoría']])}<div class="steplist" id="bf-steps"></div></div></div>`,
    init() { $$('[data-bf]').forEach(b => b.onclick = () => load(b.dataset.bf)); load('dado'); },
    draw
  });
  function load(k) { const p = PRE[k]; cur = { lab: [...p[1]], o: [...p[2]], p: [...p[3]] }; $('#bf-in').innerHTML = cur.lab.map((l, i) => `<div><label class="l" for="bf-${i}">${l}</label><input class="field" id="bf-${i}" value="${cur.o[i]}"></div>`).join(''); cur.lab.forEach((_, i) => $('#bf-' + i).oninput = e => { cur.o[i] = A.num(e.target.value); upd(); }); upd(); }
  function upd() {
    if (!cur.o.every(v => v >= 0)) return; const n = cur.o.reduce((s, v) => s + v, 0), E = cur.p.map(p => p * n); let chi = 0; cur.o.forEach((o, i) => chi += (o - E[i]) ** 2 / E[i]); const df = cur.o.length - 1, p = 1 - S.chiCdf(chi, df); R = { E };
    $('#bf-pill').innerHTML = `<span class="pill ${p < .05 ? 'warn' : 'ok'}">${p < .05 ? 'Los datos no siguen la distribución teórica' : 'Los datos son compatibles con la teoría'}</span>`;
    $('#bf-st').innerHTML = A.stats([['χ²', f3(chi)], ['Grados de libertad', df], ['p-valor', pv(p)]]);
    const big = cur.o.map((o, i) => [cur.lab[i], (o - E[i]) ** 2 / E[i]]).sort((a, b) => b[1] - a[1])[0];
    $('#bf-steps').innerHTML = A.steps([`Total: ${fmt(n, 0)} casos. Esperado en cada categoría = n × probabilidad teórica (por ejemplo, ${cur.lab[0]}: ${f2(E[0])}).`, `χ² = Σ(O − E)²/E = <b>${f3(chi)}</b>. La categoría que más aporta es "${big[0]}" (${f2(big[1])}).`, `Con ${df} grados de libertad, p-valor = <b>${pv(p)}</b>. ${p < .05 ? 'Es muy improbable ver una diferencia así por azar si la teoría fuera cierta.' : 'Las diferencias se pueden explicar por azar.'}`]);
    draw();
  }
  function draw() { if (!R) return; const k = cur.o.length, ym = Math.max(...cur.o, ...R.E) * 1.15, g = A.ax($('#bf-cv'), [-.5, k - .5], [0, ym], { xticks: cur.lab.map((_, i) => i), xf: v => cur.lab[v] || '', l: 40 }); if (!g) return; const bw = (g.X(1) - g.X(0)) * .35; cur.o.forEach((o, i) => { g.c.fillStyle = K.amber; g.c.fillRect(g.X(i) - bw - 1, g.Y(o), bw, g.Y(0) - g.Y(o)); g.c.fillStyle = K.teal; g.c.fillRect(g.X(i) + 1, g.Y(R.E[i]), bw, g.Y(0) - g.Y(R.E[i])); }); }
}
})();
