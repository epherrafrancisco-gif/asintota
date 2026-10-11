/* Asíntota · Investigación operativa y Teoría de juegos (ampliación) */
(() => {
const { $, $$, K, fmt, pct } = A;
const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);
const cellIn = (id, v, w = '') => `<input class="field" id="${id}" value="${String(v).replace('.', ',')}" style="text-align:center;padding:6px 4px;min-width:0${w}">`;

/* ---------- Simplex genérico de dos fases (minimiza) ---------- */
function pivot(T, z, l, e) { const p = T[l][e]; T[l] = T[l].map(v => v / p); T.forEach((r, i) => { if (i !== l) { const k = r[e]; if (k) T[i] = r.map((v, j) => v - k * T[l][j]); } }); if (z) { const k = z[e]; if (k) z.forEach((v, j) => z[j] = v - k * T[l][j]); } }
function runMin(T, basis, cost, allowed) {
  const N = T[0].length - 1; let z = [...cost, 0]; basis.forEach((b, r) => { const cb = cost[b]; if (cb) z = z.map((v, j) => v - cb * T[r][j]); });
  for (let it = 0; it < 1000; it++) {
    let e = -1; for (let j = 0; j < N; j++) if (allowed(j) && z[j] < -1e-9) { e = j; break; }
    if (e < 0) return { st: 'opt', val: -z[N] };
    let l = -1, best = Infinity; T.forEach((r, i) => { if (r[e] > 1e-9) { const q = r[N] / r[e]; if (q < best - 1e-12 || (Math.abs(q - best) < 1e-12 && basis[i] < basis[l])) { best = q; l = i; } } });
    if (l < 0) return { st: 'unb' }; pivot(T, z, l, e); basis[l] = e;
  }
  return { st: 'loop' };
}
function lp(c, rows) {
  const n = c.length; rows = rows.map(r => r.b < 0 ? { a: r.a.map(v => -v), b: -r.b, t: r.t === '<=' ? '>=' : r.t === '>=' ? '<=' : '=' } : r);
  const m = rows.length, ns = rows.filter(r => r.t !== '=').length, na = rows.filter(r => r.t !== '<=').length, N = n + ns + na, art0 = n + ns;
  const T = [], basis = []; let si = n, ai = art0;
  rows.forEach(r => { const row = new Array(N + 1).fill(0); r.a.forEach((v, j) => row[j] = v); row[N] = r.b; if (r.t === '<=') { row[si] = 1; basis.push(si++); } else { if (r.t === '>=') row[si++] = -1; row[ai] = 1; basis.push(ai++); } T.push(row); });
  if (na) { const c1 = new Array(N).fill(0).map((_, j) => j >= art0 ? 1 : 0), r1 = runMin(T, basis, c1, () => true); if (r1.val > 1e-7) return { st: 'inf' };
    for (let r = T.length - 1; r >= 0; r--) if (basis[r] >= art0) { const j = T[r].findIndex((v, k) => k < art0 && Math.abs(v) > 1e-9); if (j >= 0) { pivot(T, null, r, j); basis[r] = j; } else { T.splice(r, 1); basis.splice(r, 1); } } }
  const c2 = new Array(N).fill(0); c.forEach((v, j) => c2[j] = v); const r2 = runMin(T, basis, c2, j => j < art0); if (r2.st !== 'opt') return r2;
  const x = new Array(n).fill(0); basis.forEach((b, r) => { if (b < n) x[b] = T[r][N]; }); return { st: 'opt', val: r2.val, x };
}

/* ===================================== INVESTIGACIÓN OPERATIVA ===================================== */

/* ================= Método simplex con tablas ================= */
{
  let nv = 2; const DEF = { 2: { c: [3, 5], A: [[1, 0], [0, 2], [3, 2]], b: [4, 12, 18] }, 3: { c: [5, 4, 3], A: [[2, 3, 1], [4, 1, 2], [3, 4, 2]], b: [5, 11, 8] } }; let P = JSON.parse(JSON.stringify(DEF[2]));
  A.tool({
    id: 'simplex', mat: 'io', unit: 1, ord: 1, name: 'Método simplex paso a paso', short: 'Simplex', tag: 'Tablas del simplex', f: 'entra el más negativo, sale el de menor cociente',
    desc: 'Resolvé un problema de maximización con restricciones de ≤ usando las tablas del simplex, con la variable que entra, la que sale y el pivote de cada iteración.',
    lead: 'El simplex recorre los vértices de la región factible, saltando siempre a uno mejor, hasta que ya no se puede mejorar. Cada tabla es un vértice. En cada paso entra a la base la variable que más mejora la función objetivo y sale la que primero llega a cero.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Variables</label>${A.seg('spx-n', [['2', '2 variables'], ['3', '3 variables']], '2')}</div><div id="spx-in"></div><p class="err" id="spx-err"></p></div>
      <div class="stage"><dl class="stats" id="spx-st" style="margin:0"></dl><div class="steplist" id="spx-steps"></div></div></div>`,
    init() { A.segBind('spx-n', v => { nv = +v; P = JSON.parse(JSON.stringify(DEF[nv])); build(); }); build(); }
  });
  const X = j => j < nv ? `x${'₁₂₃'[j]}` : `s${'₁₂₃'[j - nv]}`;
  function build() {
    const cols = `grid-template-columns:auto repeat(${nv},minmax(0,1fr)) auto minmax(0,1fr)`;
    $('#spx-in').innerHTML = `<label class="l">Maximizar Z =</label><div class="mtx-in" style="grid-template-columns:repeat(${nv},minmax(0,1fr))">${P.c.map((v, j) => cellIn(`spx-c${j}`, v)).join('')}</div><label class="l" style="margin-top:10px">Sujeto a (todas ≤, con x ≥ 0)</label>` + P.A.map((r, i) => `<div class="mtx-in" style="${cols};margin-bottom:6px"><span class="sep">R${i + 1}</span>${r.map((v, j) => cellIn(`spx-a${i}${j}`, v)).join('')}<span class="sep">≤</span>${cellIn(`spx-b${i}`, P.b[i])}</div>`).join('');
    P.c.forEach((_, j) => $(`#spx-c${j}`).oninput = e => { P.c[j] = A.num(e.target.value); upd(); });
    P.A.forEach((r, i) => { r.forEach((_, j) => $(`#spx-a${i}${j}`).oninput = e => { P.A[i][j] = A.num(e.target.value); upd(); }); $(`#spx-b${i}`).oninput = e => { P.b[i] = A.num(e.target.value); upd(); }; });
    upd();
  }
  function table(T, basis, piv) { const N = T[0].length - 1; return `<div class="tbl-wrap"><table class="tbl"><tr><th>Base</th>${Array.from({ length: N }, (_, j) => `<th>${X(j)}</th>`).join('')}<th>Valor</th></tr>${T.map((r, i) => `<tr><td>${i < basis.length ? X(basis[i]) : 'Z'}</td>${r.map((v, j) => `<td style="${piv && ((piv[0] === i && piv[1] === j) ? 'background:rgba(242,169,59,.35);color:var(--fg);font-weight:600' : (piv[1] === j || piv[0] === i) && i < basis.length ? 'background:rgba(242,169,59,.08)' : '')}">${fmt(v, 3)}</td>`).join('')}</tr>`).join('')}</table></div>`; }
  function upd() {
    if (![...P.c, ...P.A.flat(), ...P.b].every(Number.isFinite) || P.b.some(v => v < 0)) { $('#spx-err').textContent = 'Revisá los números (los lados derechos tienen que ser ≥ 0).'; return; } $('#spx-err').textContent = '';
    const m = P.A.length, N = nv + m, T = P.A.map((r, i) => [...r, ...Array.from({ length: m }, (_, k) => +(k === i)), P.b[i]]), basis = Array.from({ length: m }, (_, i) => nv + i);
    T.push([...P.c.map(v => -v), ...new Array(m).fill(0), 0]);
    const S = [`Agrego una variable de holgura por restricción (s₁, s₂…: lo que sobra de cada recurso) y escribo la fila Z con los coeficientes cambiados de signo. Arranco en el origen: todas las x valen 0 y las holguras son los recursos completos. ${table(T, basis)}`];
    let it = 0, status = 'opt';
    while (it < 12) {
      const z = T[m]; let e = -1, mn = -1e-9; for (let j = 0; j < N; j++) if (z[j] < mn) { mn = z[j]; e = j; }
      if (e < 0) break;
      let l = -1, best = Infinity; const ratios = []; for (let i = 0; i < m; i++) { if (T[i][e] > 1e-9) { const q = T[i][N] / T[i][e]; ratios.push(`${X(basis[i])}: ${f3(T[i][N])}/${f3(T[i][e])} = ${f3(q)}`); if (q < best - 1e-12) { best = q; l = i; } } else ratios.push(`${X(basis[i])}: no aplica`); }
      if (l < 0) { status = 'unb'; S.push(`Entra ${X(e)}, pero ninguna fila la limita: el problema es <b>no acotado</b> (Z puede crecer sin fin).`); break; }
      S.push(`Iteración ${it + 1}. <b>Entra ${X(e)}</b>: es el coeficiente más negativo de la fila Z (${f3(mn)}), el que más hace crecer Z por unidad. Cocientes (valor ÷ coeficiente positivo de la columna): ${ratios.join('; ')}. <b>Sale ${X(basis[l])}</b>, el de menor cociente: es el recurso que primero se agota. Pivote: ${f3(T[l][e])}. ${table(T, basis, [l, e])}`);
      pivot(T, null, l, e); basis[l] = e; it++;
      S.push(`Divido la fila del pivote por ${'el pivote'} y hago ceros en el resto de la columna de ${X(e)}: ${table(T, basis)}`);
    }
    const x = new Array(nv).fill(0); basis.forEach((b, i) => { if (b < nv) x[b] = T[i][N]; });
    if (status === 'opt') { S.push(`La fila Z no tiene coeficientes negativos: <b>es el óptimo</b>. ${x.map((v, j) => `${X(j)} = ${f3(v)}`).join(', ')}, con Z = <b>${f3(T[m][N])}</b>.`); S.push(`Precios sombra (en la fila Z, columnas de las holguras): ${Array.from({ length: m }, (_, i) => `R${i + 1}: ${f3(T[m][nv + i])}`).join('; ')}. Indican cuánto aumentaría Z con una unidad más de cada recurso. Si es 0, ese recurso sobra.`); }
    $('#spx-st').innerHTML = A.stats([['Iteraciones', it], ['Z óptimo', status === 'opt' ? f3(T[m][N]) : '—'], ...x.map((v, j) => [X(j), status === 'opt' ? f3(v) : '—'])]);
    $('#spx-steps').innerHTML = A.steps(S);
  }
}

/* ================= Problema de transporte ================= */
{
  let C = [[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]], sup = [35, 50, 40], dem = [45, 20, 30, 30], meth = 'vog';
  const OR = ['Planta 1', 'Planta 2', 'Planta 3'], DE = ['Ciudad A', 'Ciudad B', 'Ciudad C', 'Ciudad D'];
  A.tool({
    id: 'transporte', mat: 'io', unit: 2, ord: 0, name: 'Problema de transporte', short: 'Transporte', tag: 'Noroeste, costo mínimo, Vogel y óptimo', f: 'mín Σ cᵢⱼ·xᵢⱼ',
    desc: 'Distribuí la producción de varias plantas a varios destinos al menor costo. Compará los métodos de solución inicial con el óptimo.',
    lead: 'Tres plantas abastecen a cuatro ciudades. Cada ruta tiene un costo por unidad. Hay que decidir cuánto mandar por cada ruta para cubrir las demandas sin superar la capacidad de las plantas, gastando lo menos posible. Los métodos clásicos dan una solución inicial buena; el óptimo sale de la programación lineal.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Costos por unidad, oferta y demanda</label><div class="mtx-in" id="tr-in" style="grid-template-columns:62px repeat(5,minmax(0,1fr))"></div></div><div><label class="l">Método</label>${A.seg('tr-m', [['no', 'Esquina noroeste'], ['cm', 'Costo mínimo'], ['vog', 'Vogel'], ['opt', 'Óptimo']], 'vog')}</div><p class="note" id="tr-bal"></p></div>
      <div class="stage"><dl class="stats" id="tr-st" style="margin:0"></dl><div class="tbl-wrap"><table class="tbl" id="tr-tbl"></table></div><div class="steplist" id="tr-steps"></div></div></div>`,
    init() {
      $('#tr-in').innerHTML = `<span class="sep"></span>${DE.map(d => `<span class="sep">${d.replace('Ciudad ', '')}</span>`).join('')}<span class="sep">Oferta</span>` + OR.map((o, i) => `<span class="sep">${o.replace('Planta ', 'P')}</span>${C[i].map((v, j) => cellIn(`tr-c${i}${j}`, v)).join('')}${cellIn(`tr-s${i}`, sup[i])}`).join('') + `<span class="sep">Dem.</span>${dem.map((v, j) => cellIn(`tr-d${j}`, v)).join('')}<span></span>`;
      C.forEach((r, i) => { r.forEach((_, j) => $(`#tr-c${i}${j}`).oninput = e => { C[i][j] = A.num(e.target.value); upd(); }); $(`#tr-s${i}`).oninput = e => { sup[i] = A.num(e.target.value); upd(); }; });
      dem.forEach((_, j) => $(`#tr-d${j}`).oninput = e => { dem[j] = A.num(e.target.value); upd(); });
      A.segBind('tr-m', v => { meth = v; upd(); }); upd();
    }
  });
  function balance() { const S = sup.reduce((a, b) => a + b, 0), D = dem.reduce((a, b) => a + b, 0); let c = C.map(r => [...r]), s = [...sup], d = [...dem], ro = [...OR], de = [...DE]; if (S > D) { c.forEach(r => r.push(0)); d.push(S - D); de.push('Ficticio'); } else if (D > S) { c.push(new Array(d.length).fill(0)); s.push(D - S); ro.push('Ficticia'); } return { c, s, d, ro, de, S, D }; }
  function nw(P) { const x = P.c.map(r => r.map(() => 0)), s = [...P.s], d = [...P.d]; let i = 0, j = 0; const log = []; while (i < s.length && j < d.length) { const q = Math.min(s[i], d[j]); x[i][j] = q; log.push([i, j, q]); s[i] -= q; d[j] -= q; if (s[i] === 0 && i < s.length - 1) i++; else j++; } return { x, log }; }
  function cm(P) { const x = P.c.map(r => r.map(() => 0)), s = [...P.s], d = [...P.d], cells = []; P.c.forEach((r, i) => r.forEach((v, j) => cells.push([v, i, j]))); cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const log = []; cells.forEach(([, i, j]) => { const q = Math.min(s[i], d[j]); if (q > 0) { x[i][j] = q; s[i] -= q; d[j] -= q; log.push([i, j, q]); } }); return { x, log }; }
  function vog(P) {
    const x = P.c.map(r => r.map(() => 0)), s = [...P.s], d = [...P.d], R = new Set(s.map((_, i) => i)), Cc = new Set(d.map((_, j) => j)), log = [];
    const pen = arr => { const a = [...arr].sort((p, q) => p - q); return a.length > 1 ? a[1] - a[0] : a[0] ?? 0; };
    while (R.size && Cc.size) {
      let best = null; R.forEach(i => { const p = pen([...Cc].map(j => P.c[i][j])); if (!best || p > best.p) best = { p, row: i }; }); Cc.forEach(j => { const p = pen([...R].map(i => P.c[i][j])); if (p > best.p) best = { p, col: j }; });
      let i, j; if (best.row !== undefined) { i = best.row; j = [...Cc].reduce((a, b) => P.c[i][b] < P.c[i][a] ? b : a); } else { j = best.col; i = [...R].reduce((a, b) => P.c[b][j] < P.c[a][j] ? b : a); }
      const q = Math.min(s[i], d[j]); x[i][j] = q; s[i] -= q; d[j] -= q; log.push([i, j, q, best.p, best.row !== undefined ? 'fila' : 'columna']); if (s[i] <= 0) R.delete(i); else Cc.delete(j);
    }
    return { x, log };
  }
  function opt(P) { const m = P.s.length, n = P.d.length, c = P.c.flat(), rows = []; P.s.forEach((v, i) => rows.push({ a: c.map((_, k) => Math.floor(k / n) === i ? 1 : 0), t: '=', b: v })); P.d.forEach((v, j) => rows.push({ a: c.map((_, k) => k % n === j ? 1 : 0), t: '=', b: v })); const r = lp(c, rows); if (r.st !== 'opt') return null; return { x: Array.from({ length: m }, (_, i) => r.x.slice(i * n, i * n + n).map(v => Math.round(v * 1e6) / 1e6)), log: [] }; }
  const cost = (P, x) => x.reduce((s, r, i) => s + r.reduce((t, v, j) => t + v * P.c[i][j], 0), 0);
  function upd() {
    if (![...C.flat(), ...sup, ...dem].every(v => Number.isFinite(v) && v >= 0)) return;
    const P = balance(); $('#tr-bal').textContent = P.S === P.D ? `Oferta total = demanda total = ${f2(P.S)}: el problema está balanceado.` : P.S > P.D ? `Sobra oferta (${f2(P.S - P.D)}): agrego un destino ficticio con costo 0 que absorbe el excedente.` : `Falta oferta (${f2(P.D - P.S)}): agrego una planta ficticia; lo que "envía" es demanda insatisfecha.`;
    const res = { no: nw(P), cm: cm(P), vog: vog(P), opt: opt(P) }, costs = Object.fromEntries(Object.entries(res).map(([k, v]) => [k, v ? cost(P, v.x) : NaN])), R = res[meth];
    $('#tr-st').innerHTML = A.stats([['Esquina noroeste', f2(costs.no)], ['Costo mínimo', f2(costs.cm)], ['Vogel', f2(costs.vog)], ['Óptimo', f2(costs.opt)]]);
    if (!R) return;
    $('#tr-tbl').innerHTML = `<tr><th></th>${P.de.map(d => `<th>${d}</th>`).join('')}<th>Oferta</th></tr>` + P.ro.map((o, i) => `<tr><td>${o}</td>${P.c[i].map((cc, j) => `<td style="${R.x[i][j] > 0 ? 'background:rgba(242,169,59,.18)' : ''}"><span class="muted" style="font-size:11px">$${fmt(cc, 0)}</span><br><b>${R.x[i][j] > 0 ? fmt(R.x[i][j], 2) : '·'}</b></td>`).join('')}<td>${f2(P.s[i])}</td></tr>`).join('') + `<tr><td>Demanda</td>${P.d.map(v => `<td>${f2(v)}</td>`).join('')}<td></td></tr>`;
    const used = R.x.flat().filter(v => v > 0).length, need = P.s.length + P.d.length - 1, nm = { no: 'esquina noroeste', cm: 'costo mínimo', vog: 'Vogel' };
    const S = meth === 'opt' ? [`Planteo como programación lineal: minimizar Σ c·x sujeto a que cada planta envíe su oferta y cada ciudad reciba su demanda. Lo resuelvo con el simplex.`, `Costo mínimo posible: <b>${f2(costs.opt)}</b>. Vogel quedó a ${pct((costs.vog - costs.opt) / costs.opt, 1)} del óptimo, costo mínimo a ${pct((costs.cm - costs.opt) / costs.opt, 1)} y noroeste a ${pct((costs.no - costs.opt) / costs.opt, 1)}.`, `En los cursos el óptimo se busca partiendo de una solución inicial y mejorándola con el método de los multiplicadores (MODI) o del paso a paso (stepping stone), que calculan si conviene abrir cada ruta vacía.`]
      : [meth === 'no' ? 'Arranco en la esquina de arriba a la izquierda y asigno lo máximo posible; cuando se agota la oferta de una fila bajo, cuando se cubre una columna voy a la derecha. Ignora los costos: es rápido pero suele dar soluciones caras.' : meth === 'cm' ? 'Asigno primero a la ruta más barata de toda la tabla, lo máximo posible, y repito con la siguiente más barata entre las que siguen disponibles.' : 'Para cada fila y columna calculo la <b>penalidad</b>: la diferencia entre sus dos costos más bajos. Elijo la línea con mayor penalidad (la que más perdería si no uso su mejor ruta) y asigno en su celda más barata. Suele quedar muy cerca del óptimo.',
        `Asignaciones en orden: ${R.log.slice(0, 8).map(([i, j, q, p, t]) => `${P.ro[i].replace('Planta ', 'P')}→${P.de[j].replace('Ciudad ', '')}: ${f2(q)}${p !== undefined ? ` (penalidad ${f2(p)} en ${t})` : ''}`).join('; ')}.`,
        `Costo total con ${nm[meth]}: <b>${f2(costs[meth])}</b>. El óptimo es ${f2(costs.opt)}${costs[meth] - costs.opt < .01 ? ': ¡este método llegó al óptimo!' : `, así que sobran ${f2(costs[meth] - costs.opt)}.`}`,
        `Rutas usadas: ${used}. Una solución básica tiene m + n − 1 = ${need} rutas; ${used < need ? 'como hay menos, la solución es <b>degenerada</b>.' : 'se cumple.'}`];
    $('#tr-steps').innerHTML = A.steps(S);
  }
}

/* ================= Decisión bajo incertidumbre y riesgo ================= */
{
  const ALT = ['Planta grande', 'Planta chica', 'No invertir'], EST = ['Demanda alta', 'Demanda media', 'Demanda baja'];
  let M = [[200, 50, -120], [90, 60, -30], [0, 0, 0]], p = [.3, .5, .2]; const st = { h: .6 }; let R = null;
  A.tool({
    id: 'decision', mat: 'io', unit: 4, ord: 0, name: 'Decisión bajo incertidumbre y árboles de decisión', short: 'Teoría de la decisión', tag: 'Criterios y valor de la información', f: 'VEIP = VE con info perfecta − máx VE',
    desc: 'Maximax, maximin, Hurwicz, Laplace, Savage y valor esperado sobre una matriz de pagos, con el árbol de decisión y el valor de la información perfecta.',
    lead: 'Una empresa evalúa construir una planta sin saber cómo será la demanda. Si no conoce las probabilidades (incertidumbre) hay varios criterios según qué tan optimista sea. Si las conoce (riesgo), se usa el valor esperado y se arma un árbol de decisión.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Matriz de pagos</label><div class="mtx-in" id="dec-in" style="grid-template-columns:90px repeat(3,minmax(0,1fr))"></div></div><div><label class="l">Probabilidades de cada estado</label><div class="mtx-in" style="grid-template-columns:repeat(3,minmax(0,1fr))">${p.map((v, j) => cellIn(`dec-p${j}`, v)).join('')}</div><p class="err" id="dec-err"></p></div>${A.sliders('dec', [['h', 'Coeficiente de optimismo α (Hurwicz)', 0, 1, .05, .6, 2]])}</div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="dec-tbl"></table></div><h3>Árbol de decisión (valor esperado)</h3><canvas id="dec-cv" style="height:300px"></canvas><div class="steplist" id="dec-steps"></div></div></div>`,
    init() {
      $('#dec-in').innerHTML = `<span class="sep"></span>${EST.map(e => `<span class="sep">${e.replace('Demanda ', '')}</span>`).join('')}` + ALT.map((a, i) => `<span class="sep">${a}</span>${M[i].map((v, j) => cellIn(`dec-m${i}${j}`, v)).join('')}`).join('');
      M.forEach((r, i) => r.forEach((_, j) => $(`#dec-m${i}${j}`).oninput = e => { M[i][j] = A.num(e.target.value); upd(); }));
      p.forEach((_, j) => $(`#dec-p${j}`).oninput = e => { p[j] = A.num(e.target.value); upd(); });
      A.bindSliders('dec', [['h', '', 0, 1, .05, .6, 2]], st, upd); upd();
    },
    draw
  });
  function upd() {
    if (!M.flat().every(Number.isFinite)) return; const sp = p.reduce((a, b) => a + b, 0); if (Math.abs(sp - 1) > 1e-3 || p.some(v => v < 0)) { $('#dec-err').textContent = `Las probabilidades tienen que sumar 1 (ahora ${f3(sp)}).`; return; } $('#dec-err').textContent = '';
    const mx = M.map(r => Math.max(...r)), mn = M.map(r => Math.min(...r)), hw = M.map((_, i) => st.h * mx[i] + (1 - st.h) * mn[i]), lp2 = M.map(r => r.reduce((a, b) => a + b, 0) / r.length), colMax = EST.map((_, j) => Math.max(...M.map(r => r[j]))), reg = M.map(r => r.map((v, j) => colMax[j] - v)), mreg = reg.map(r => Math.max(...r)), ev = M.map(r => r.reduce((s, v, j) => s + v * p[j], 0));
    const arg = (a, f = Math.max) => a.indexOf(f(...a)), evpi = colMax.reduce((s, v, j) => s + v * p[j], 0) - Math.max(...ev); R = { ev };
    const crit = [['Maximax (optimista)', mx, arg(mx), 'el mejor resultado posible de cada alternativa'], ['Maximin de Wald (pesimista)', mn, arg(mn), 'el peor resultado de cada una'], [`Hurwicz (α = ${f2(st.h)})`, hw, arg(hw), 'α·mejor + (1 − α)·peor'], ['Laplace (equiprobable)', lp2, arg(lp2), 'el promedio simple'], ['Savage (mínimo arrepentimiento)', mreg, arg(mreg, Math.min), 'el máximo arrepentimiento: cuánto se pierde respecto de lo mejor que se podría haber elegido en cada estado'], ['Valor esperado (con probabilidades)', ev, arg(ev), 'Σ pago × probabilidad']];
    $('#dec-tbl').innerHTML = `<tr><th>Criterio</th>${ALT.map(a => `<th>${a}</th>`).join('')}<th>Elige</th></tr>` + crit.map(([n, v, k]) => `<tr><td>${n}</td>${v.map((x, i) => `<td style="${i === k ? 'color:var(--amber);font-weight:600' : ''}">${f2(x)}</td>`).join('')}<td>${ALT[k]}</td></tr>`).join('');
    $('#dec-steps').innerHTML = A.steps([
      `Bajo <b>incertidumbre</b> (sin probabilidades), cada criterio resume cada alternativa en un número: ${crit.slice(0, 5).map(c => `<b>${c[0]}</b> mira ${c[3]}`).join('; ')}.`,
      `Tabla de arrepentimiento (Savage): ${ALT.map((a, i) => `${a}: ${reg[i].map(f2).join(' / ')}`).join('; ')}. Se elige la alternativa cuyo peor arrepentimiento sea el menor.`,
      `Bajo <b>riesgo</b> (con probabilidades): VE = ${ev.map((v, i) => `${ALT[i]} ${f2(v)}`).join(', ')}. Conviene <b>${ALT[arg(ev)]}</b>.`,
      `<b>Valor esperado de la información perfecta</b>: si supieras de antemano qué estado ocurre, elegirías siempre lo mejor y ganarías en promedio Σ p·máx = ${f2(evpi + Math.max(...ev))}. La diferencia con ${f2(Math.max(...ev))} es <b>VEIP = ${f2(evpi)}</b>: es lo máximo que valdría la pena pagar por un estudio de mercado perfecto.`,
      `Que distintos criterios elijan distintas alternativas es lo esperable: reflejan actitudes distintas frente al riesgo. El árbol de decisión resuelve lo mismo de derecha a izquierda: en cada nodo de azar (círculo) promedia, en cada nodo de decisión (cuadrado) elige el mayor.`]);
    draw();
  }
  function draw() {
    if (!R) return; const { c, w, h } = A.canv($('#dec-cv')); if (w < 2) return; const best = R.ev.indexOf(Math.max(...R.ev)), x0 = 24, x1 = w * .38, x2 = w * .62, ys = [h * .18, h * .5, h * .82];
    c.font = '12px ' + A.MONO; c.lineWidth = 1.5;
    ALT.forEach((a, i) => {
      const on = i === best; c.strokeStyle = on ? K.amber : K.faint; c.beginPath(); c.moveTo(x0 + 14, h / 2); c.lineTo(x1, ys[i]); c.stroke();
      c.fillStyle = on ? K.amber : K.muted; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(a, (x0 + x1) / 2 + 10, (h / 2 + ys[i]) / 2 - 4);
      EST.forEach((e, j) => { const yy = ys[i] + (j - 1) * h * .1; c.strokeStyle = 'rgba(160,160,180,.45)'; c.beginPath(); c.moveTo(x1, ys[i]); c.lineTo(x2, yy); c.stroke(); c.fillStyle = K.muted; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(`${e.replace('Demanda ', '')} (${f2(p[j])})`, x2 + 6, yy); c.fillStyle = M[i][j] >= 0 ? K.teal : K.rose; c.textAlign = 'right'; c.fillText(f2(M[i][j]), w - 8, yy); });
      c.fillStyle = K.panel || '#181a22'; c.strokeStyle = on ? K.amber : K.fg; c.beginPath(); c.arc(x1, ys[i], 9, 0, 7); c.fill(); c.stroke(); c.fillStyle = on ? K.amber : K.fg; c.textAlign = 'center'; c.textBaseline = 'top'; c.fillText('VE ' + f2(R.ev[i]), x1, ys[i] + 12);
    });
    c.fillStyle = K.amber; c.fillRect(x0, h / 2 - 9, 18, 18);
  }
}

/* ================= Inventarios: lote económico ================= */
{
  const st = {}; let R = null;
  const D = [['D', 'Demanda anual (unidades)', 1000, 50000, 500, 12000, 0], ['S', 'Costo por pedido ($)', 10, 1000, 5, 150, 0], ['H', 'Costo de mantener una unidad un año ($)', .5, 50, .5, 4, 1], ['L', 'Demora de entrega (días)', 0, 30, 1, 5, 0]];
  A.tool({
    id: 'eoq', mat: 'io', unit: 5, ord: 0, name: 'Inventarios: lote económico de compra', short: 'Lote económico', tag: 'Modelo de Wilson (EOQ)', f: 'Q* = √(2·D·S / H)',
    desc: 'Cuánto pedir y cada cuánto: el equilibrio entre el costo de hacer muchos pedidos y el de tener mucho stock guardado.',
    lead: 'Si pedís poco por vez, hacés muchos pedidos (y cada uno cuesta). Si pedís mucho, tenés stock inmovilizado (depósito, seguro, plata parada). El lote económico minimiza la suma de los dos costos. Es el modelo de inventarios más usado.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('eq', D)}<dl class="stats" id="eq-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Costos anuales según el tamaño del pedido</h3><canvas id="eq-c" style="height:250px"></canvas>${A.legend([['teal', 'Costo de pedir'], ['rose', 'Costo de mantener'], ['amber', 'Costo total']])}</div><div><h3>Nivel de inventario en el tiempo</h3><canvas id="eq-i" style="height:250px"></canvas>${A.legend([['amber', 'Stock'], ['rose', 'Punto de reorden']])}</div></div><div class="steplist" id="eq-steps"></div></div></div>`,
    init() { A.bindSliders('eq', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { D, S, H, L } = st, Q = Math.sqrt(2 * D * S / H), N = D / Q, T = 360 / N, ROP = D / 360 * L, TC = D / Q * S + Q / 2 * H; R = { Q, ROP, T };
    $('#eq-st').innerHTML = A.stats([['Lote óptimo Q*', fmt(Q, 0)], ['Pedidos por año', f2(N)], ['Días entre pedidos', fmt(T, 1)], ['Punto de reorden', fmt(ROP, 0)], ['Costo anual mínimo', '$' + fmt(TC, 0)]]);
    $('#eq-steps').innerHTML = A.steps([
      `Costo de pedir: (D/Q)·S, baja cuando el lote crece. Costo de mantener: (Q/2)·H, porque el stock promedio es la mitad del lote. Costo total: CT(Q) = (D/Q)·S + (Q/2)·H.`,
      `Derivando e igualando a cero: −D·S/Q² + H/2 = 0 → <b>Q* = √(2DS/H) = √(2 × ${fmt(D, 0)} × ${fmt(S, 0)} / ${f2(H)}) = ${fmt(Q, 0)}</b> unidades.`,
      `En el óptimo los dos costos son iguales: ${fmt(D / Q * S, 0)} cada uno. Es una propiedad del modelo: el mínimo está justo donde se cruzan.`,
      `Se hacen ${f2(N)} pedidos al año, uno cada ${fmt(T, 1)} días. Como el proveedor tarda ${L} días, hay que pedir cuando queden <b>${fmt(ROP, 0)} unidades</b> (demanda diaria × demora): ese es el punto de reorden.`,
      `La curva es muy plana cerca del mínimo: pedir un 20% más o menos que Q* encarece apenas ${pct((D / (Q * 1.2) * S + Q * 1.2 / 2 * H) / TC - 1, 1)}. Por eso el modelo funciona bien aunque los datos sean aproximados. Y Q* crece con la raíz de la demanda: si la demanda se cuadruplica, el lote solo se duplica.`]);
    draw();
  }
  function draw() {
    if (!R) return; const { D, S, H } = st, X = R.Q * 3, TC = q => D / q * S + q / 2 * H, g = A.ax($('#eq-c'), [0, X], [0, TC(R.Q) * 2.2], { l: 56 }); if (g) { g.fn(q => D / q * S, K.teal, 2, null, [X * .02, X]); g.fn(q => q / 2 * H, K.rose, 2); g.fn(TC, K.amber, 2.6, null, [X * .02, X]); g.guide(R.Q, TC(R.Q)); g.dot(R.Q, TC(R.Q), K.fg, 5); g.labels('Q', '$'); }
    const days = R.T * 3.2, i = A.ax($('#eq-i'), [0, days], [0, R.Q * 1.15], { l: 48 }); if (i) { const pts = []; for (let k = 0; k * R.T < days; k++) { pts.push([k * R.T, R.Q], [Math.min((k + 1) * R.T, days), Math.max(0, R.Q - (Math.min((k + 1) * R.T, days) - k * R.T) / R.T * R.Q)]); } i.path(pts, K.amber, 2.2); i.hline(R.ROP, K.rose, 1.4, [5, 4]); i.labels('días', 'unidades'); }
  }
}

/* ================= Teoría de colas ================= */
{
  const st = {}; let R = null;
  const D = [['lam', 'Llegadas por hora λ', 1, 60, 1, 18, 0], ['mu', 'Clientes que atiende un servidor por hora μ', 1, 60, 1, 20, 0], ['c', 'Cantidad de servidores (cajas)', 1, 6, 1, 1, 0]];
  const erlang = (lam, mu, c) => { const a = lam / mu, rho = a / c; if (rho >= 1) return null; let s = 0, t = 1; for (let k = 0; k < c; k++) { if (k) t *= a / k; s += t; } const tc = t * a / c * (1 / (1 - rho)); const P0 = 1 / (s + tc), Pw = tc * P0, Lq = Pw * rho / (1 - rho), Wq = Lq / lam, W = Wq + 1 / mu; return { rho, P0, Pw, Lq, Wq, W, L: lam * W }; };
  A.tool({
    id: 'colas', mat: 'io', unit: 5, ord: 1, name: 'Teoría de colas', short: 'Colas', tag: 'Modelo M/M/c', f: 'Wq = Lq / λ,  ρ = λ/(c·μ)',
    desc: 'Cuánto se espera en una fila según la tasa de llegadas, la velocidad de atención y la cantidad de cajas. Por qué una fila al 95% de ocupación es un desastre.',
    lead: 'Clientes que llegan al azar a un banco, autos a un peaje, pedidos a un servidor web. Con llegadas y tiempos de atención aleatorios (modelo M/M/c), la espera no crece de forma lineal con la ocupación: explota cuando el sistema se acerca al 100%.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('qq', D)}<div id="qq-pill"></div><dl class="stats" id="qq-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Espera promedio en la fila según las llegadas</h3><canvas id="qq-cv" style="height:280px"></canvas><p class="note">Una curva por cantidad de servidores; el punto es la situación actual.</p><div class="steplist" id="qq-steps"></div></div></div>`,
    init() { A.bindSliders('qq', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { lam, mu, c } = st, r = erlang(lam, mu, c); R = { r };
    $('#qq-pill').innerHTML = r ? `<span class="pill ${r.rho < .8 ? 'ok' : 'warn'}">Ocupación ${pct(r.rho, 0)}</span>` : '<span class="pill bad">Inestable: llegan más clientes de los que se pueden atender</span>';
    $('#qq-st').innerHTML = r ? A.stats([['Espera en la fila Wq', fmt(r.Wq * 60, 1) + ' min'], ['Tiempo total en el sistema W', fmt(r.W * 60, 1) + ' min'], ['Personas en la fila Lq', f2(r.Lq)], ['Personas en el sistema L', f2(r.L)], ['Probabilidad de tener que esperar', pct(r.Pw, 1)]]) : '';
    $('#qq-steps').innerHTML = r ? A.steps([
      `Ocupación: ρ = λ/(c·μ) = ${lam}/(${c} × ${mu}) = <b>${pct(r.rho, 1)}</b>. Es la fracción del tiempo que cada servidor está ocupado. Tiene que ser menor a 100% o la fila crece sin fin.`,
      c === 1 ? `Con un servidor (M/M/1) las fórmulas son simples: Lq = ρ²/(1 − ρ) = ${f2(r.Lq)} personas y Wq = Lq/λ = ${fmt(r.Wq * 60, 1)} minutos.` : `Con ${c} servidores se usa la fórmula de Erlang C: la probabilidad de esperar es ${pct(r.Pw, 1)}, y Lq = ${f2(r.Lq)}.`,
      `<b>Ley de Little</b>: L = λ·W. Personas en el sistema = llegadas por hora × tiempo que pasa cada una = ${lam} × ${fmt(r.W, 3)} h = ${f2(r.L)}. Vale para cualquier sistema estable, no solo este.`,
      `Mirá la curva: pasar de 80% a 90% de ocupación duplica la espera, y de 90% a 95% la vuelve a duplicar. Por eso los sistemas que funcionan bien tienen capacidad ociosa. ${c === 1 ? 'Probá agregar un segundo servidor: la espera cae muchísimo más que a la mitad.' : ''}`]) : '<p class="err">Con estos valores la fila crece indefinidamente: hay que agregar servidores o atender más rápido.</p>';
    draw();
  }
  function draw() {
    const { mu, c } = st, X = mu * Math.max(c, 3), g = A.ax($('#qq-cv'), [0, X], [0, 30], { l: 40 }); if (!g) return; const cols = [K.rose, K.amber, K.teal, K.violet, K.fg, K.muted];
    for (let k = 1; k <= Math.max(c, 3); k++) g.fn(l => { const r = erlang(l, mu, k); return r ? r.Wq * 60 : NaN; }, cols[k - 1], k === c ? 2.6 : 1.4, k === c ? null : [5, 4], [.01, Math.min(X, k * mu * .999)]);
    if (R && R.r) g.dot(st.lam, R.r.Wq * 60, K.fg, 6); g.labels('λ (llegadas por hora)', 'minutos de espera');
  }
}

/* ================= Camino crítico (CPM) ================= */
{
  const ACT = [['A', 'Diseño y especificación', 3, []], ['B', 'Desarrollo del backend', 6, ['A']], ['C', 'Desarrollo del frontend', 5, ['A']], ['D', 'Integración', 2, ['B', 'C']], ['E', 'Pruebas', 3, ['D']], ['F', 'Campaña de marketing', 4, ['A']], ['G', 'Lanzamiento', 1, ['E', 'F']]];
  const dur = ACT.map(a => a[2]); let R = null;
  A.tool({
    id: 'cpm', mat: 'io', unit: 5, ord: 2, name: 'Planificación de proyectos: camino crítico', short: 'Camino crítico', tag: 'CPM y diagrama de Gantt', f: 'holgura = LS − ES',
    desc: 'Programá un proyecto con actividades que dependen unas de otras: duración mínima, holguras y qué tareas no pueden atrasarse.',
    lead: 'Lanzar una app: hay tareas que se pueden hacer en paralelo y otras que tienen que esperar. El camino crítico es la cadena más larga de tareas encadenadas: define cuánto dura el proyecto, y cualquier atraso en ella atrasa todo. Cambiá las duraciones (en semanas).',
    body: `<div class="bench"><div class="ctrl"><label class="l">Duración de cada actividad (semanas)</label><div class="mtx-in" style="grid-template-columns:auto minmax(0,1fr) 70px">${ACT.map((a, i) => `<span class="sep">${a[0]}</span><span style="font-size:13px">${a[1]}${a[3].length ? ` <span class="muted mono" style="font-size:11px">después de ${a[3].join(', ')}</span>` : ''}</span>${cellIn(`cpm-${i}`, a[2])}`).join('')}</div><dl class="stats" id="cpm-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Diagrama de Gantt</h3><canvas id="cpm-cv" style="height:280px"></canvas>${A.legend([['rose', 'Actividad crítica'], ['teal', 'Actividad con holgura'], ['faint', 'Holgura disponible']])}<div class="tbl-wrap"><table class="tbl" id="cpm-tbl"></table></div><div class="steplist" id="cpm-steps"></div></div></div>`,
    init() { ACT.forEach((_, i) => $(`#cpm-${i}`).oninput = e => { const v = A.num(e.target.value); if (v >= 0) { dur[i] = v; upd(); } }); upd(); },
    draw
  });
  function upd() {
    const idx = Object.fromEntries(ACT.map((a, i) => [a[0], i])), ES = [], EF = [], LS = [], LF = [];
    ACT.forEach((a, i) => { ES[i] = Math.max(0, ...a[3].map(p => EF[idx[p]])); EF[i] = ES[i] + dur[i]; });
    const T = Math.max(...EF); for (let i = ACT.length - 1; i >= 0; i--) { const succ = ACT.map((b, j) => b[3].includes(ACT[i][0]) ? j : -1).filter(j => j >= 0); LF[i] = succ.length ? Math.min(...succ.map(j => LS[j])) : T; LS[i] = LF[i] - dur[i]; }
    const sl = ES.map((v, i) => LS[i] - v), crit = ACT.filter((_, i) => Math.abs(sl[i]) < 1e-9).map(a => a[0]); R = { ES, EF, LS, LF, sl, T };
    $('#cpm-st').innerHTML = A.stats([['Duración del proyecto', f2(T) + ' semanas'], ['Camino crítico', crit.join(' → ')]]);
    $('#cpm-tbl').innerHTML = `<tr><th>Actividad</th><th>Duración</th><th>Inicio temprano</th><th>Fin temprano</th><th>Inicio tardío</th><th>Fin tardío</th><th>Holgura</th></tr>` + ACT.map((a, i) => `<tr><td>${a[0]} · ${a[1]}</td><td>${f2(dur[i])}</td><td>${f2(ES[i])}</td><td>${f2(EF[i])}</td><td>${f2(LS[i])}</td><td>${f2(LF[i])}</td><td style="${sl[i] < 1e-9 ? 'color:var(--rose);font-weight:600' : ''}">${f2(sl[i])}</td></tr>`).join('');
    const fi = ACT.findIndex((_, i) => sl[i] > 1e-9);
    $('#cpm-steps').innerHTML = A.steps([
      `<b>Pasada hacia adelante</b>: cada actividad empieza lo antes posible, cuando terminan todas sus predecesoras (inicio temprano = máximo de los fines tempranos previos). El proyecto termina en la semana <b>${f2(T)}</b>.`,
      `<b>Pasada hacia atrás</b>: desde el final, cada actividad puede terminar a más tardar cuando empieza la más temprana de sus sucesoras, sin atrasar el proyecto.`,
      `<b>Holgura</b> = inicio tardío − inicio temprano: cuánto se puede atrasar una tarea sin afectar la fecha final. ${fi >= 0 ? `Por ejemplo, ${ACT[fi][0]} (${ACT[fi][1].toLowerCase()}) tiene ${f2(sl[fi])} semanas de margen.` : ''}`,
      `Las actividades con holgura cero forman el <b>camino crítico</b>: ${crit.join(' → ')}. Para terminar antes hay que acortar esas (agregar gente, horas extra); acortar las otras no sirve. Probá alargar una actividad con holgura más allá de su margen y mirá cómo cambia el camino crítico.`]);
    draw();
  }
  function draw() {
    if (!R) return; const g = A.ax($('#cpm-cv'), [0, R.T * 1.05], [-.5, ACT.length - .5], { yt: ACT.length, ystep: 1, yf: v => { const a = ACT[ACT.length - 1 - Math.round(v)]; return a ? a[0] : ''; }, l: 30 }); if (!g) return;
    ACT.forEach((a, i) => { const y = ACT.length - 1 - i, hgt = (g.Y(0) - g.Y(1)) * .55, crit = R.sl[i] < 1e-9; if (R.sl[i] > 1e-9) { g.c.fillStyle = 'rgba(160,160,180,.18)'; g.c.fillRect(g.X(R.EF[i]), g.Y(y) - hgt / 2, g.X(R.LF[i]) - g.X(R.EF[i]), hgt); } g.c.fillStyle = crit ? K.rose : K.teal; g.c.fillRect(g.X(R.ES[i]), g.Y(y) - hgt / 2, Math.max(2, g.X(R.EF[i]) - g.X(R.ES[i])), hgt); });
    g.labels('semanas', '');
  }
}

/* ===================================== TEORÍA DE JUEGOS ===================================== */

/* ================= Dominancia iterada ================= */
{
  const RS = ['Arriba', 'Medio', 'Abajo'], CS = ['Izquierda', 'Centro', 'Derecha'];
  let G = [[[4, 3], [5, 1], [6, 2]], [[2, 1], [8, 4], [3, 6]], [[3, 0], [9, 6], [2, 8]]];
  const PRE = { ej: [[[4, 3], [5, 1], [6, 2]], [[2, 1], [8, 4], [3, 6]], [[3, 0], [9, 6], [2, 8]]], pd: [[[3, 3], [0, 5], [1, 1]], [[5, 0], [1, 1], [2, 0]], [[1, 1], [0, 2], [0, 0]]], none: [[[0, 4], [4, 0], [5, 3]], [[4, 0], [0, 4], [5, 3]], [[3, 5], [3, 5], [6, 6]]] };
  A.tool({
    id: 'dominancia', mat: 'juegos', unit: 1, ord: 1, name: 'Eliminación iterada de estrategias dominadas', short: 'Dominancia', tag: 'Juegos de 3 × 3', f: 'si uᵢ(s, ·) > uᵢ(s′, ·) siempre, s′ se descarta',
    desc: 'Un jugador racional nunca juega una estrategia que siempre le da menos que otra. Eliminándolas una y otra vez, muchos juegos se resuelven solos.',
    lead: 'Una estrategia está <b>estrictamente dominada</b> si hay otra que le da al jugador más pago, haga lo que haga el rival. Nadie racional la elige. Y si el rival también lo sabe, puede eliminarla y volver a mirar. Cada celda tiene el pago de la fila y el de la columna.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Pagos (fila, columna)</label><div class="mtx-in" id="dom-in" style="grid-template-columns:62px repeat(3,minmax(0,1fr))"></div></div><div class="chips"><button class="chip" data-dom="ej">Se resuelve por dominancia</button><button class="chip" data-dom="pd">Dilema ampliado</button><button class="chip" data-dom="none">Sin dominadas</button></div><p class="err" id="dom-err"></p></div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="dom-tbl"></table></div><div class="steplist" id="dom-steps"></div></div></div>`,
    init() { $$('[data-dom]').forEach(b => b.onclick = () => { G = JSON.parse(JSON.stringify(PRE[b.dataset.dom])); build(); }); build(); }
  });
  function build() {
    $('#dom-in').innerHTML = `<span class="sep"></span>${CS.map(c => `<span class="sep">${c.slice(0, 4)}.</span>`).join('')}` + RS.map((r, i) => `<span class="sep">${r}</span>${G[i].map((v, j) => `<input class="field" id="dom-${i}${j}" value="${v.join(', ')}" style="text-align:center;padding:6px 2px;min-width:0">`).join('')}`).join('');
    G.forEach((r, i) => r.forEach((_, j) => $(`#dom-${i}${j}`).oninput = e => { const v = e.target.value.split(/[;,]\s*|\s+/).map(Number).filter(Number.isFinite); if (v.length === 2) { G[i][j] = v; upd(); } })); upd();
  }
  function upd() {
    let rows = [0, 1, 2], cols = [0, 1, 2]; const S = [], out = {}; let ch = true, round = 0;
    while (ch && round < 10) {
      ch = false; round++;
      for (const r of rows) { const d = rows.find(o => o !== r && cols.every(c => G[o][c][0] > G[r][c][0])); if (d !== undefined) { S.push(`Para la fila, <b>${RS[r]}</b> está dominada por <b>${RS[d]}</b>: contra ${cols.map(c => CS[c]).join(', ')} da ${cols.map(c => G[r][c][0]).join(', ')} contra ${cols.map(c => G[d][c][0]).join(', ')}. La elimino.`); out['r' + r] = round; rows = rows.filter(x => x !== r); ch = true; break; } }
      for (const c of cols) { const d = cols.find(o => o !== c && rows.every(r => G[r][o][1] > G[r][c][1])); if (d !== undefined) { S.push(`Para la columna, <b>${CS[c]}</b> está dominada por <b>${CS[d]}</b>: frente a ${rows.map(r => RS[r]).join(', ')} da ${rows.map(r => G[r][c][1]).join(', ')} contra ${rows.map(r => G[r][d][1]).join(', ')}. La elimino.`); out['c' + c] = round; cols = cols.filter(x => x !== c); ch = true; break; } }
    }
    const ne = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const br1 = G.every(r => r[j][0] <= G[i][j][0]), br2 = G[i].every(v => v[1] <= G[i][j][1]); if (br1 && br2) ne.push([i, j]); }
    if (!S.length) S.push('No hay ninguna estrategia estrictamente dominada: este método no ayuda y hay que buscar los equilibrios de Nash por mejores respuestas.');
    S.push(rows.length === 1 && cols.length === 1 ? `Queda una sola celda: <b>(${RS[rows[0]]}, ${CS[cols[0]]})</b> con pagos (${G[rows[0]][cols[0]].join(', ')}). El juego se resolvió por dominancia iterada, y ese resultado es el único equilibrio de Nash.` : `Quedan ${rows.length} × ${cols.length} estrategias. Ahí se buscan los equilibrios de Nash.`);
    S.push(`Equilibrios de Nash en estrategias puras (cada uno juega la mejor respuesta al otro; marcados con borde naranja): ${ne.length ? ne.map(([i, j]) => `(${RS[i]}, ${CS[j]})`).join(', ') : 'ninguno; hay que buscar en estrategias mixtas'}. La dominancia iterada nunca elimina un equilibrio de Nash, pero necesita suponer que la racionalidad es <b>conocimiento común</b>: yo sé que vos sos racional, vos sabés que yo lo sé, y así.`);
    $('#dom-tbl').innerHTML = `<tr><th></th>${CS.map((c, j) => `<th style="${out['c' + j] ? 'opacity:.35;text-decoration:line-through' : ''}">${c}</th>`).join('')}</tr>` + RS.map((r, i) => `<tr><td style="${out['r' + i] ? 'opacity:.35;text-decoration:line-through' : ''}">${r}</td>${G[i].map((v, j) => { const gone = out['r' + i] || out['c' + j], isNe = ne.some(([a, b]) => a === i && b === j); return `<td style="text-align:center;${gone ? 'opacity:.3;' : ''}${isNe ? 'outline:2px solid var(--amber);outline-offset:-3px;' : ''}"><span style="color:var(--amber)">${v[0]}</span>, <span style="color:var(--teal)">${v[1]}</span></td>`; }).join('')}</tr>`).join('');
    $('#dom-steps').innerHTML = A.steps(S);
  }
}

/* ================= Juegos secuenciales: inducción hacia atrás ================= */
{
  const st = {}; let R = null;
  const D = [['e0', 'No entra: pago del entrante', -5, 10, .5, 0, 1], ['i0', 'No entra: pago del incumbente', -5, 15, .5, 10, 1], ['e1', 'Guerra de precios: entrante', -5, 10, .5, -2, 1], ['i1', 'Guerra de precios: incumbente', -5, 15, .5, 2, 1], ['e2', 'Acomoda: entrante', -5, 10, .5, 4, 1], ['i2', 'Acomoda: incumbente', -5, 15, .5, 5, 1]];
  A.tool({
    id: 'secuencial', mat: 'juegos', unit: 2, ord: 0, name: 'Juegos secuenciales: inducción hacia atrás', short: 'Juegos secuenciales', tag: 'Equilibrio perfecto en subjuegos', f: 'resolver desde el final hacia el principio',
    desc: 'El juego de entrada: una empresa amenaza con una guerra de precios si entra un competidor. ¿Es creíble la amenaza?',
    lead: 'Cuando los jugadores mueven por turnos, el que mueve segundo ya sabe qué hizo el primero. Se resuelve de atrás para adelante: primero se ve qué haría el último en cada situación y, sabiendo eso, qué le conviene al primero. Así se descartan las <b>amenazas no creíbles</b>.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('sq', D)}<div class="chips"><button class="chip" id="sq-a">Amenaza no creíble</button><button class="chip" id="sq-b">Amenaza creíble</button></div></div>
      <div class="stage"><canvas id="sq-cv" style="height:300px"></canvas><h3>Forma normal (estrategias completas)</h3><div class="tbl-wrap"><table class="tbl" id="sq-tbl"></table></div><div class="steplist" id="sq-steps"></div></div></div>`,
    init() { A.bindSliders('sq', D, st, upd); const set = v => { ['e0', 'i0', 'e1', 'i1', 'e2', 'i2'].forEach((k, i) => A.setSlider('sq', k, v[i], st, 1)); upd(); }; $('#sq-a').onclick = () => set([0, 10, -2, 2, 4, 5]); $('#sq-b').onclick = () => set([0, 10, -2, 6, 4, 5]); upd(); },
    draw
  });
  function upd() {
    const { e0, i0, e1, i1, e2, i2 } = st, fight = i1 > i2, eIn = fight ? e1 : e2, enter = eIn > e0; R = { fight, enter };
    const N = [[[fight ? e1 : e2, fight ? i1 : i2], [e0, i0]]]; // no usado
    const nf = [[[e1, i1], [e2, i2]], [[e0, i0], [e0, i0]]], ne = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const b1 = nf[r][c][0] >= nf[1 - r][c][0], b2 = nf[r][c][1] >= nf[r][1 - c][1]; if (b1 && b2) ne.push([r, c]); }
    const RN = ['Entrar', 'No entrar'], CN = ['Pelear si entra', 'Acomodar si entra'], spe = [enter ? 0 : 1, fight ? 0 : 1];
    $('#sq-tbl').innerHTML = `<tr><th>Entrante \\ Incumbente</th>${CN.map(c => `<th>${c}</th>`).join('')}</tr>` + RN.map((r, i) => `<tr><td>${r}</td>${nf[i].map((v, j) => { const isNe = ne.some(([a, b]) => a === i && b === j), isS = spe[0] === i && spe[1] === j; return `<td style="text-align:center;${isNe ? 'outline:2px solid var(--amber);outline-offset:-3px;' : ''}${isS ? 'background:rgba(242,169,59,.2)' : ''}">${f2(v[0])}, ${f2(v[1])}</td>`; }).join('')}</tr>`).join('');
    $('#sq-steps').innerHTML = A.steps([
      `Empiezo por el final. Si el entrante ya entró, el incumbente compara: pelear le da ${f2(i1)} y acomodarse ${f2(i2)}. Le conviene <b>${fight ? 'pelear' : 'acomodarse'}</b>.`,
      `Sabiendo eso, el entrante compara: si entra obtiene ${f2(eIn)} (porque el incumbente ${fight ? 'va a pelear' : 'se va a acomodar'}), si no entra ${f2(e0)}. Le conviene <b>${enter ? 'entrar' : 'no entrar'}</b>.`,
      `Equilibrio perfecto en subjuegos: (${enter ? 'Entrar' : 'No entrar'}, ${fight ? 'Pelear' : 'Acomodar'} si entra), con pagos (${f2(enter ? eIn : e0)}, ${f2(enter ? (fight ? i1 : i2) : i0)}). Es la celda sombreada.`,
      `En la forma normal hay ${ne.length} equilibrio${ne.length === 1 ? '' : 's'} de Nash (con borde naranja). ${ne.length > 1 && !fight ? `Uno es (No entrar, Pelear): el incumbente "amenaza" con pelear y eso disuade la entrada. Pero es una <b>amenaza no creíble</b>: si el entrante efectivamente entrara, pelear le daría ${f2(i1)} en vez de ${f2(i2)}. La inducción hacia atrás descarta ese equilibrio.` : fight ? 'Acá pelear sí le conviene al incumbente (por ejemplo, por reputación ante otros posibles entrantes), así que la amenaza es creíble y disuade.' : ''}`,
      `Por eso en estrategia empresarial importa el <b>compromiso</b>: invertir de antemano en capacidad, aunque cueste, puede volver creíble una amenaza que no lo era.`]);
    draw();
  }
  function draw() {
    if (!R) return; const { c, w, h } = A.canv($('#sq-cv')); if (w < 2) return; const { e0, i0, e1, i1, e2, i2 } = st;
    const P0 = [w * .14, h * .45], P1 = [w * .48, h * .3], L0 = [w * .48, h * .82], L1 = [w * .84, h * .12], L2 = [w * .84, h * .5];
    const edge = (a, b, on, lab) => { c.strokeStyle = on ? K.amber : 'rgba(160,160,180,.45)'; c.lineWidth = on ? 3 : 1.5; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.font = '12px ' + A.MONO; c.fillStyle = on ? K.amber : K.muted; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(lab, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 6); };
    edge(P0, P1, R.enter, 'Entrar'); edge(P0, L0, !R.enter, 'No entrar'); edge(P1, L1, R.fight, 'Pelear'); edge(P1, L2, !R.fight, 'Acomodar');
    const node = (p, lab) => { c.fillStyle = K.bg; c.strokeStyle = K.fg; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], 8, 0, 7); c.fill(); c.stroke(); c.fillStyle = K.fg; c.font = '12px ' + A.MONO; c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(lab, p[0], p[1] - 12); };
    node(P0, 'Entrante'); node(P1, 'Incumbente');
    const leaf = (p, a, b) => { c.font = '600 13px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = K.amber; c.fillText(f2(a), p[0] + 8, p[1]); c.fillStyle = K.teal; c.fillText(f2(b), p[0] + 8, p[1] + 18); };
    leaf(L0, e0, i0); leaf(L1, e1, i1); leaf(L2, e2, i2);
  }
}

/* ================= Negociación de Rubinstein ================= */
{
  const st = {}; let R = null;
  const D = [['d1', 'Paciencia del jugador 1 (δ₁)', 0, .99, .01, .9, 2], ['d2', 'Paciencia del jugador 2 (δ₂)', 0, .99, .01, .8, 2], ['T', 'Cantidad de rondas (finito)', 1, 15, 1, 4, 0]];
  A.tool({
    id: 'negociacion', mat: 'juegos', unit: 2, ord: 1, name: 'Negociación con ofertas alternadas (Rubinstein)', short: 'Negociación', tag: 'Paciencia y poder de negociación', f: 'x₁* = (1 − δ₂)/(1 − δ₁δ₂)',
    desc: 'Dos partes se reparten una torta haciendo ofertas por turnos. Esperar cuesta, y el más paciente se queda con más.',
    lead: 'El jugador 1 propone cómo repartir $1. Si el 2 rechaza, la torta "se achica" (esperar tiene un costo: δ es cuánto vale un peso mañana) y propone el 2. Así hasta que alguien acepta. Por inducción hacia atrás, el acuerdo es inmediato, y la paciencia es poder.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('rb', D)}<dl class="stats" id="rb-st" style="margin:0"></dl></div>
      <div class="stage"><div class="grid2"><div><h3>Ronda por ronda (juego finito)</h3><div class="tbl-wrap"><table class="tbl" id="rb-tbl"></table></div></div><div><h3>Parte del jugador 1 según δ₂</h3><canvas id="rb-cv" style="height:240px"></canvas></div></div><div class="steplist" id="rb-steps"></div></div></div>`,
    init() { A.bindSliders('rb', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { d1, d2, T } = st, inf = (1 - d2) / (1 - d1 * d2), rows = []; let x = 1;
    for (let t = T; t >= 1; t--) { const prop = t % 2 ? 1 : 2; if (t === T) x = 1; else x = 1 - (prop === 1 ? d2 : d1) * x; rows.unshift([t, prop, x]); }
    const p1 = rows[0][2]; R = { inf };
    $('#rb-st').innerHTML = A.stats([['Jugador 1 (juego finito)', pct(p1, 1)], ['Jugador 2 (juego finito)', pct(1 - p1, 1)], ['Jugador 1 (sin límite de rondas)', pct(inf, 1)], ['Jugador 2 (sin límite)', pct(1 - inf, 1)]]);
    $('#rb-tbl').innerHTML = `<tr><th>Ronda</th><th>Propone</th><th>Se queda el que propone</th></tr>` + rows.map(([t, p, v]) => `<tr><td>${t}</td><td>Jugador ${p}</td><td>${pct(v, 1)}</td></tr>`).join('');
    $('#rb-steps').innerHTML = A.steps([
      `En la última ronda (${T}) el que propone se queda con todo: el otro acepta cualquier cosa porque rechazar le da cero.`,
      `Una ronda antes, el que propone sabe que si el otro rechaza, el otro se quedará con eso en la ronda siguiente, pero un período más tarde. Entonces le ofrece exactamente δ veces eso (lo mínimo que acepta) y se queda con el resto.`,
      `Siguiendo hacia atrás, en la ronda 1 el jugador 1 propone quedarse con <b>${pct(p1, 1)}</b> y el jugador 2 acepta enseguida. No hay demora: los dos anticipan todo el juego.`,
      `Sin límite de rondas (Rubinstein, 1982), el reparto es x₁ = (1 − δ₂)/(1 − δ₁δ₂) = <b>${pct(inf, 1)}</b>. ${d1 > d2 ? 'El jugador 1 es más paciente y además propone primero: se lleva más.' : d1 < d2 ? 'El jugador 2 es más paciente, y eso compensa en parte que el 1 proponga primero.' : 'Con igual paciencia, el que propone primero tiene una pequeña ventaja, que desaparece si δ → 1.'}`,
      `Moraleja: en una negociación, quien puede esperar (más ahorros, mejores alternativas, menos apuro) se queda con más. Por eso huelgas, paritarias o compras de empresas se ganan muchas veces por resistencia.`]);
    draw();
  }
  function draw() { if (!R) return; const g = A.ax($('#rb-cv'), [0, .99], [0, 1], { ystep: .25, yf: v => pct(v, 0), l: 44 }); if (!g) return; g.fn(d2 => (1 - d2) / (1 - st.d1 * d2), K.amber, 2.4); g.hline(.5, K.faint, 1, [4, 4]); g.dot(st.d2, R.inf, K.fg, 5); g.labels('δ₂', 'parte del jugador 1'); }
}

/* ================= Juegos repetidos y cooperación ================= */
{
  const st = {}; let R = null;
  const D = [['T', 'T: tentación (traicionar al que coopera)', 3, 10, .5, 5, 1], ['Rr', 'R: recompensa (los dos cooperan)', 1, 9, .5, 3, 1], ['P', 'P: castigo (los dos traicionan)', 0, 5, .5, 1, 1], ['d', 'Factor de descuento δ', 0, .99, .01, .6, 2]];
  A.tool({
    id: 'repetidos', mat: 'juegos', unit: 3, ord: 1, name: 'Juegos repetidos: cuándo conviene cooperar', short: 'Cooperación repetida', tag: 'Estrategia del gatillo y teorema popular', f: 'δ ≥ (T − R)/(T − P)',
    desc: 'En un dilema del prisionero que se repite indefinidamente, la cooperación puede sostenerse si el futuro importa lo suficiente.',
    lead: 'Jugado una vez, en el dilema del prisionero conviene traicionar. Pero si la relación se repite (empresas que compiten todos los años, países que comercian), traicionar hoy tiene un costo: el castigo futuro. La pregunta es si la ganancia de hoy compensa lo que se pierde mañana.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('rp', D)}<div id="rp-pill"></div><dl class="stats" id="rp-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Pago promedio por período según δ</h3><canvas id="rp-cv" style="height:280px"></canvas>${A.legend([['teal', 'Cooperar siempre'], ['rose', 'Traicionar hoy y ser castigado para siempre']])}<div class="steplist" id="rp-steps"></div></div></div>`,
    init() { A.bindSliders('rp', D, st, upd); upd(); },
    draw
  });
  function upd() {
    const { T, Rr, P, d } = st; if (!(T > Rr && Rr > P)) { $('#rp-steps').innerHTML = '<p class="err">Para que sea un dilema del prisionero tiene que cumplirse T > R > P.</p>'; R = null; draw(); return; }
    const ds = (T - Rr) / (T - P), coop = Rr / (1 - d), dev = T + d * P / (1 - d), ok = d >= ds; R = { ds };
    $('#rp-pill').innerHTML = `<span class="pill ${ok ? 'ok' : 'bad'}">${ok ? 'La cooperación se sostiene' : 'Conviene traicionar'}</span>`;
    $('#rp-st').innerHTML = A.stats([['δ mínimo para cooperar', f3(ds)], ['Valor de cooperar', f2(coop)], ['Valor de traicionar', f2(dev)]]);
    $('#rp-steps').innerHTML = A.steps([
      `Estrategia del <b>gatillo</b>: coopero mientras el otro coopere; si me traiciona una vez, traiciono para siempre.`,
      `Si coopero siempre: R + δR + δ²R + … = R/(1 − δ) = ${f2(Rr)}/${f2(1 - d)} = <b>${f2(coop)}</b>.`,
      `Si traiciono hoy: gano T = ${f2(T)} una vez, y después el castigo P para siempre: T + δP/(1 − δ) = <b>${f2(dev)}</b>.`,
      `Cooperar conviene si R/(1 − δ) ≥ T + δP/(1 − δ), es decir, si <b>δ ≥ (T − R)/(T − P) = ${f3(ds)}</b>. Con δ = ${f2(d)}: ${ok ? 'el futuro pesa lo suficiente y nadie quiere romper el acuerdo.' : 'el futuro pesa poco; la tentación de hoy gana.'}`,
      `δ alto significa jugadores pacientes o relaciones que probablemente continúen. Por eso los carteles son más estables con pocas empresas, demanda estable y contacto frecuente. El <b>teorema popular</b> generaliza esto: con δ suficientemente alto, casi cualquier resultado razonable puede sostenerse como equilibrio.`]);
    draw();
  }
  function draw() { const g = A.ax($('#rp-cv'), [0, 1], [0, st.T * 1.1], { l: 36 }); if (!g || !R) return; g.fn(() => st.Rr, K.teal, 2.4); g.fn(d => (1 - d) * st.T + d * st.P, K.rose, 2.4); g.vline(R.ds, K.faint, 1, [4, 4]); g.vline(st.d, K.amber, 1.6); g.text('δ*', R.ds, st.T, K.muted); g.labels('δ', 'pago por período'); }
}

/* ================= Subastas ================= */
{
  const st = {}; let R = null;
  const D = [['n', 'Cantidad de oferentes', 2, 10, 1, 3, 0]];
  A.tool({
    id: 'subastas', mat: 'juegos', unit: 4, ord: 0, name: 'Subastas y equivalencia de ingresos', short: 'Subastas', tag: 'Información privada', f: 'b(v) = v·(n − 1)/n',
    desc: 'Primer precio contra segundo precio: cuánto conviene ofertar en cada una y por qué el vendedor recauda lo mismo en promedio.',
    lead: 'Cada oferente sabe cuánto vale el objeto para él, pero no cuánto vale para los demás (información privada). En la subasta de <b>primer precio</b> el ganador paga su oferta; en la de <b>segundo precio</b> (Vickrey) paga la segunda oferta más alta. Valuaciones al azar entre 0 y 100.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('sb', D)}<button class="btn primary sm" id="sb-go" style="align-self:flex-start">Simular 3.000 subastas</button><dl class="stats" id="sb-st" style="margin:0"></dl></div>
      <div class="stage"><h3>Una subasta de ejemplo</h3><div class="tbl-wrap"><table class="tbl" id="sb-tbl"></table></div><h3>Recaudación en 3.000 subastas</h3><canvas id="sb-cv" style="height:240px"></canvas>${A.legend([['amber', 'Primer precio'], ['teal', 'Segundo precio']])}<div class="steplist" id="sb-steps"></div></div></div>`,
    init() { A.bindSliders('sb', D, st, run); $('#sb-go').onclick = run; run(); },
    draw
  });
  function run() {
    const n = st.n, k = (n - 1) / n, r1 = [], r2 = []; let ex = null;
    for (let s = 0; s < 3000; s++) { const v = Array.from({ length: n }, () => Math.random() * 100), sv = [...v].sort((a, b) => b - a); r1.push(sv[0] * k); r2.push(sv[1]); if (!s) ex = v; }
    const m1 = r1.reduce((a, b) => a + b, 0) / 3000, m2 = r2.reduce((a, b) => a + b, 0) / 3000, th = 100 * (n - 1) / (n + 1), sd = a => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
    R = { r1, r2 }; const ord = ex.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    $('#sb-tbl').innerHTML = `<tr><th>Oferente</th><th>Valuación</th><th>Oferta en 1.er precio</th><th>Oferta en 2.º precio</th></tr>` + ex.map((v, i) => `<tr><td>${i + 1}${i === ord[0][1] ? ' (gana)' : ''}</td><td>${f2(v)}</td><td>${f2(v * k)}</td><td>${f2(v)}</td></tr>`).join('') + `<tr><td>Paga el ganador</td><td></td><td><b>${f2(ord[0][0] * k)}</b></td><td><b>${f2(ord[1][0])}</b></td></tr>`;
    $('#sb-st').innerHTML = A.stats([['Recaudación media, 1.er precio', f2(m1)], ['Recaudación media, 2.º precio', f2(m2)], ['Teoría: 100·(n − 1)/(n + 1)', f2(th)], ['Desvío 1.er precio', f2(sd(r1))], ['Desvío 2.º precio', f2(sd(r2))]]);
    $('#sb-steps').innerHTML = A.steps([
      `<b>Segundo precio:</b> conviene ofertar exactamente tu valuación. Si ofertás menos, podés perder un objeto que te convenía; si ofertás más, podés ganar pagando más de lo que vale. Lo que pagás no depende de tu oferta, así que decir la verdad es una estrategia dominante.`,
      `<b>Primer precio:</b> ofertar tu valuación te deja ganancia cero. Conviene "sombrear" la oferta: con n = ${n} oferentes y valuaciones uniformes, el equilibrio es ofertar (n − 1)/n = ${pct(k, 0)} de lo que vale para vos. Es un balance entre ganar más seguido y ganar más cuando ganás.`,
      `<b>Equivalencia de ingresos</b>: en promedio el vendedor recauda lo mismo en las dos (${f2(m1)} contra ${f2(m2)}; la teoría dice ${f2(th)}). En primer precio el ganador paga su oferta sombreada; en segundo precio paga la valuación del segundo, y en promedio coinciden. Lo que cambia es el riesgo: la de segundo precio es más variable.`,
      `Más oferentes → más competencia → ofertas más cerca de la valuación y más recaudación. La subasta inglesa (a viva voz, ascendente) equivale a la de segundo precio, y la holandesa (precio que baja hasta que alguien acepta) a la de primer precio. Así se licitan el espectro radioeléctrico, la deuda pública y los anuncios en internet.`]);
    draw();
  }
  function draw() { if (!R) return; const bins = 40, c1 = new Array(bins).fill(0), c2 = new Array(bins).fill(0); R.r1.forEach(v => c1[Math.min(bins - 1, Math.floor(v / 100 * bins))]++); R.r2.forEach(v => c2[Math.min(bins - 1, Math.floor(v / 100 * bins))]++); const g = A.ax($('#sb-cv'), [0, 100], [0, Math.max(...c1, ...c2) * 1.1], { yf: v => fmt(v, 0), l: 40 }); if (!g) return; const bw = 100 / bins; [[c2, 'rgba(67,200,184,.55)'], [c1, 'rgba(242,169,59,.55)']].forEach(([cn, col]) => cn.forEach((k, i) => { if (!k) return; g.c.fillStyle = col; g.c.fillRect(g.X(i * bw) + .5, g.Y(k), g.X((i + 1) * bw) - g.X(i * bw) - 1, g.Y(0) - g.Y(k)); })); }
}
})();
