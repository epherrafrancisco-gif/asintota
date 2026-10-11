/* Asíntota · Álgebra lineal (ampliación) */
(() => {
const { $, $$, K, fmt, pct } = A;
const f2 = x => fmt(x, 2), f3 = x => fmt(x, 3);
const fr = f => f.toFraction().replace('-', '−');
const F = v => math.fraction(v);
const mtxHTML = (M, o = {}) => `<span class="mtx" style="grid-template-columns:repeat(${M[0].length},auto);vertical-align:middle;margin:4px 0">${M.map((r, i) => r.map((v, j) => `<span class="${o.bar === j ? 'bar' : ''} ${o.piv && o.piv[0] === i && o.piv[1] === j ? 'piv' : ''}">${typeof v === 'string' ? v : fr(v)}</span>`).join('')).join('')}</span>`;
const mtxIn = (id, M, labels) => `<div class="mtx-in" id="${id}" style="grid-template-columns:${labels ? '60px ' : ''}repeat(${M[0].length},minmax(0,1fr))">${M.map((r, i) => (labels ? `<span class="sep">${labels[i]}</span>` : '') + r.map((v, j) => `<input class="field" data-i="${i}" data-j="${j}" value="${String(v).replace('.', ',')}" aria-label="Fila ${i + 1}, columna ${j + 1}">`).join('')).join('')}</div>`;
const bindMtx = (id, M, cb) => $$(`#${id} input`).forEach(e => e.oninput = () => { const v = A.num(e.value); M[+e.dataset.i][+e.dataset.j] = Number.isFinite(v) ? v : NaN; cb(); });
const inv = M => { const n = M.length, a = M.map((r, i) => [...r, ...M.map((_, j) => +(i === j))]); for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r; if (Math.abs(a[p][c]) < 1e-12) return null; [a[c], a[p]] = [a[p], a[c]]; const d = a[c][c]; a[c] = a[c].map(v => v / d); for (let r = 0; r < n; r++) if (r !== c) { const k = a[r][c]; a[r] = a[r].map((v, j) => v - k * a[c][j]); } } return a.map(r => r.slice(n)); };
const mul = (A1, B) => A1.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));

/* ================= Combinación lineal e independencia ================= */
{
  const st = {}; let R = null;
  const D = [['u1', 'u₁', -4, 4, .1, 2, 1], ['u2', 'u₂', -4, 4, .1, 1, 1], ['v1', 'v₁', -4, 4, .1, -1, 1], ['v2', 'v₂', -4, 4, .1, 2, 1], ['w1', 'w₁ (objetivo)', -6, 6, .1, 3, 1], ['w2', 'w₂ (objetivo)', -6, 6, .1, 4, 1]];
  A.tool({
    id: 'combinacion', mat: 'algebra', unit: 1, ord: 0, name: 'Combinación lineal, independencia y bases', short: 'Combinación lineal', tag: 'Vectores en el plano', f: 'w = α·u + β·v',
    desc: '¿Se puede llegar a cualquier punto del plano combinando dos vectores? Solo si son linealmente independientes, es decir, si forman una base.',
    lead: 'Combinar dos vectores es estirarlos (multiplicarlos por números) y sumarlos. Si u y v apuntan en direcciones distintas, combinándolos se llega a cualquier punto del plano: son una <b>base</b>. Si son paralelos, solo se recorre una recta.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('cl', D)}<div class="chips"><button class="chip" id="cl-par">Hacer v paralelo a u</button><button class="chip" id="cl-can">Base canónica</button></div><div id="cl-pill"></div><dl class="stats" id="cl-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="cl-cv" style="width:min(100%,520px);aspect-ratio:1;align-self:center"></canvas>${A.legend([['amber', 'u'], ['teal', 'v'], ['rose', 'w (objetivo)']])}<div class="steplist" id="cl-steps"></div></div></div>`,
    init() {
      A.bindSliders('cl', D, st, upd);
      $('#cl-par').onclick = () => { A.setSlider('cl', 'v1', -st.u1 * 1.5, st, 1); A.setSlider('cl', 'v2', -st.u2 * 1.5, st, 1); upd(); };
      $('#cl-can').onclick = () => { [['u1', 1], ['u2', 0], ['v1', 0], ['v2', 1]].forEach(([k, v]) => A.setSlider('cl', k, v, st, 1)); upd(); };
      upd();
    },
    draw
  });
  function upd() {
    const { u1, u2, v1, v2, w1, w2 } = st, det = u1 * v2 - u2 * v1, ind = Math.abs(det) > 1e-9, al = ind ? (w1 * v2 - w2 * v1) / det : NaN, be = ind ? (u1 * w2 - u2 * w1) / det : NaN;
    R = { al, be, ind };
    $('#cl-pill').innerHTML = `<span class="pill ${ind ? 'ok' : 'bad'}">${ind ? 'Linealmente independientes: forman una base' : 'Linealmente dependientes'}</span>`;
    $('#cl-st').innerHTML = A.stats([['det [u v]', f3(det)], ['α', ind ? f3(al) : '—'], ['β', ind ? f3(be) : '—'], ['Dimensión del espacio generado', ind ? 2 : (Math.hypot(u1, u2) + Math.hypot(v1, v2) > 1e-9 ? 1 : 0)]]);
    $('#cl-steps').innerHTML = A.steps([
      `Busco α y β tales que α·(${f2(u1)}, ${f2(u2)}) + β·(${f2(v1)}, ${f2(v2)}) = (${f2(w1)}, ${f2(w2)}). Es un sistema de dos ecuaciones: ${f2(u1)}α + ${f2(v1)}β = ${f2(w1)} y ${f2(u2)}α + ${f2(v2)}β = ${f2(w2)}.`,
      `El determinante de la matriz con u y v como columnas es ${f2(u1)}×${f2(v2)} − ${f2(u2)}×${f2(v1)} = <b>${f3(det)}</b>. ${ind ? 'Es distinto de cero: el sistema tiene solución única.' : 'Es cero: los vectores son paralelos (uno es múltiplo del otro).'}`,
      ind ? `Por Cramer: α = <b>${f3(al)}</b> y β = <b>${f3(be)}</b>. En el gráfico: se camina α veces u (naranja punteado) y después β veces v (verde punteado), y se llega exactamente a w. Esos números son las <b>coordenadas de w en la base {u, v}</b>.` : `Combinando u y v solo se recorre la recta punteada. ${Math.abs(w1 * u2 - w2 * u1) < 1e-6 ? 'w está sobre esa recta: hay infinitas formas de llegar.' : 'w no está sobre esa recta: es <b>imposible</b> llegar.'}`,
      `En general, n vectores en ℝⁿ forman una base si y solo si el determinante de la matriz que forman es distinto de cero. Es la misma condición para que un sistema tenga solución única o para que una matriz sea invertible.`]);
    draw();
  }
  function draw() {
    if (!R) return; const g = A.ax($('#cl-cv'), [-7, 7], [-7, 7], { l: 30, xt: 7, yt: 7 }); if (!g) return; const { u1, u2, v1, v2, w1, w2 } = st;
    g.hline(0, K.faint, 1); g.vline(0, K.faint, 1);
    const arrow = (x0, y0, x1, y1, col, lw = 2.6, dash) => { g.path([[x0, y0], [x1, y1]], col, lw, dash); const a = Math.atan2(g.Y(y1) - g.Y(y0), g.X(x1) - g.X(x0)), X = g.X(x1), Y = g.Y(y1); if (Math.hypot(g.X(x1) - g.X(x0), Y - g.Y(y0)) < 4 || dash) return; g.c.fillStyle = col; g.c.beginPath(); g.c.moveTo(X, Y); g.c.lineTo(X - 11 * Math.cos(a - .4), Y - 11 * Math.sin(a - .4)); g.c.lineTo(X - 11 * Math.cos(a + .4), Y - 11 * Math.sin(a + .4)); g.c.closePath(); g.c.fill(); };
    if (R.ind) { for (let k = -8; k <= 8; k++) { g.path([[k * u1 - 20 * v1, k * u2 - 20 * v2], [k * u1 + 20 * v1, k * u2 + 20 * v2]], 'rgba(67,200,184,.10)', 1); g.path([[k * v1 - 20 * u1, k * v2 - 20 * u2], [k * v1 + 20 * u1, k * v2 + 20 * u2]], 'rgba(242,169,59,.10)', 1); } arrow(0, 0, R.al * u1, R.al * u2, K.amber, 1.6, [5, 4]); arrow(R.al * u1, R.al * u2, w1, w2, K.teal, 1.6, [5, 4]); }
    else { const d = Math.hypot(u1, u2) > 1e-9 ? [u1, u2] : [v1, v2]; g.path([[-20 * d[0], -20 * d[1]], [20 * d[0], 20 * d[1]]], K.faint, 1.4, [6, 4]); }
    arrow(0, 0, u1, u2, K.amber); arrow(0, 0, v1, v2, K.teal); g.dot(w1, w2, K.rose, 6);
  }
}

/* ================= Determinante e inversa paso a paso ================= */
{
  let n = 3; const DEF = { 2: [[4, 7], [2, 6]], 3: [[2, 1, 1], [1, 3, 2], [1, 0, 0]] }; let M = DEF[3].map(r => [...r]);
  A.tool({
    id: 'inversa', mat: 'algebra', unit: 3, ord: 0, name: 'Determinante e inversa paso a paso', short: 'Determinante e inversa', tag: 'Gauss-Jordan sobre [A | I]', f: 'A·A⁻¹ = I',
    desc: 'Calculá el determinante por cofactores y la matriz inversa por Gauss-Jordan, con cada operación entre filas en fracciones exactas.',
    lead: 'Para invertir una matriz se le pega la identidad al costado, [A | I], y se hacen operaciones de fila hasta que la parte izquierda sea la identidad. Lo que queda a la derecha es A⁻¹. Si en el camino aparece una fila de ceros, la matriz no tiene inversa (su determinante es cero).',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Tamaño</label>${A.seg('inv-n', [['2', '2 × 2'], ['3', '3 × 3']], '3')}</div><div><label class="l">Matriz A</label><div id="inv-box"></div></div><div class="row"><button class="btn sm" id="inv-rnd">Matriz al azar</button><button class="btn sm" id="inv-sing">Una sin inversa</button></div></div>
      <div class="stage"><div id="inv-pill"></div><h3>Determinante por cofactores</h3><div class="steplist" id="inv-det"></div><h3>Inversa por Gauss-Jordan</h3><div class="steplist" id="inv-gj"></div></div></div>`,
    init() {
      A.segBind('inv-n', v => { n = +v; M = DEF[n].map(r => [...r]); build(); });
      $('#inv-rnd').onclick = () => { do { M = Array.from({ length: n }, () => Array.from({ length: n }, () => Math.floor(Math.random() * 9) - 4)); } while (Math.abs(det(M)) < .5); build(); };
      $('#inv-sing').onclick = () => { M = n === 2 ? [[2, 4], [1, 2]] : [[1, 2, 3], [2, 4, 6], [1, 0, 1]]; build(); };
      build();
    }
  });
  const det = m => m.length === 2 ? m[0][0] * m[1][1] - m[0][1] * m[1][0] : m[0].reduce((s, v, j) => s + (j % 2 ? -1 : 1) * v * det(m.slice(1).map(r => r.filter((_, k) => k !== j))), 0);
  function build() { $('#inv-box').innerHTML = mtxIn('inv-in', M); bindMtx('inv-in', M, upd); upd(); }
  function upd() {
    if (!M.flat().every(Number.isFinite)) return;
    const Fm = M.map(r => r.map(F)), d = det(M);
    const DL = [];
    if (n === 2) DL.push(`Para 2 × 2: det = a·d − b·c = ${fr(Fm[0][0])}×${fr(Fm[1][1])} − ${fr(Fm[0][1])}×${fr(Fm[1][0])} = <b>${fr(F(d))}</b>.`);
    else { const terms = M[0].map((v, j) => { const sub = M.slice(1).map(r => r.filter((_, k) => k !== j)), m = det(sub); return { v, j, m, sub }; }); DL.push(`Desarrollo por la primera fila, alternando signos (+, −, +). Cada elemento se multiplica por el determinante del menor que queda al tachar su fila y su columna.`); terms.forEach(t => DL.push(`${t.j % 2 ? '−' : '+'} ${fr(F(t.v))} × det${mtxHTML(t.sub.map(r => r.map(F)))} = ${t.j % 2 ? '−' : '+'} ${fr(F(t.v))} × (${fr(F(t.m))}) = <b>${fr(F((t.j % 2 ? -1 : 1) * t.v * t.m))}</b>`)); DL.push(`Sumando: det A = <b>${fr(F(d))}</b>.`); }
    DL.push(Math.abs(d) < 1e-12 ? 'El determinante es <b>cero</b>: las filas son linealmente dependientes y la matriz <b>no tiene inversa</b>.' : `Como det A ≠ 0, la matriz es invertible. Además det(A⁻¹) = 1/det A = ${fr(F(1).div(F(d)))}.`);
    $('#inv-det').innerHTML = A.steps(DL);
    let a = Fm.map((r, i) => [...r, ...Fm.map((_, j) => F(+(i === j)))]); const GL = [`Arranco con [A | I]: ${mtxHTML(a, { bar: n })}`]; let ok = true;
    for (let c = 0; c < n && ok; c++) {
      let p = c; while (p < n && a[p][c].equals(0)) p++;
      if (p === n) { ok = false; GL.push(`En la columna ${c + 1} no queda ningún pivote distinto de cero: la matriz es <b>singular</b>, no tiene inversa.`); break; }
      if (p !== c) { [a[c], a[p]] = [a[p], a[c]]; GL.push(`Intercambio F${c + 1} ↔ F${p + 1} para tener un pivote distinto de cero: ${mtxHTML(a, { bar: n, piv: [c, c] })}`); }
      const pv = a[c][c]; if (!pv.equals(1)) { a[c] = a[c].map(v => v.div(pv)); GL.push(`Divido F${c + 1} por ${fr(pv)} para que el pivote sea 1: ${mtxHTML(a, { bar: n, piv: [c, c] })}`); }
      const ops = []; for (let r = 0; r < n; r++) if (r !== c && !a[r][c].equals(0)) { const k = a[r][c]; a[r] = a[r].map((v, j) => v.sub(k.mul(a[c][j]))); ops.push(`F${r + 1} → F${r + 1} − (${fr(k)})·F${c + 1}`); }
      if (ops.length) GL.push(`Hago ceros en la columna ${c + 1}: ${ops.join('; ')}. ${mtxHTML(a, { bar: n, piv: [c, c] })}`);
    }
    if (ok) { GL.push(`La izquierda ya es la identidad, así que la derecha es la inversa: <b>A⁻¹ =</b> ${mtxHTML(a.map(r => r.slice(n)))}`); GL.push(`Comprobación: A·A⁻¹ = I. ${n === 2 ? `Para 2 × 2 hay atajo: A⁻¹ = (1/det)·[[d, −b], [−c, a]].` : 'También se puede calcular como la adjunta (transpuesta de cofactores) dividida por el determinante, pero para 3 × 3 o más Gauss-Jordan es más rápido.'}`); }
    $('#inv-gj').innerHTML = A.steps(GL);
    $('#inv-pill').innerHTML = `<span class="pill ${Math.abs(d) > 1e-12 ? 'ok' : 'bad'}">${Math.abs(d) > 1e-12 ? 'Invertible' : 'Singular (sin inversa)'}</span>`;
  }
}

/* ================= Autovalores y diagonalización ================= */
{
  const st = {}; let R = null;
  const D = [['a', 'a', -3, 3, .1, 2, 1], ['b', 'b', -3, 3, .1, 1, 1], ['c', 'c', -3, 3, .1, 1, 1], ['d', 'd', -3, 3, .1, 2, 1], ['k', 'Potencia n (Aⁿ)', 1, 10, 1, 1, 0]];
  A.tool({
    id: 'autovalores', mat: 'algebra', unit: 5, ord: 0, name: 'Autovalores, autovectores y diagonalización', short: 'Autovalores', tag: 'Diagonalización', f: 'A·v = λ·v,  A = P·D·P⁻¹',
    desc: 'Encontrá las direcciones que una matriz solo estira, sin girarlas. Con ellas la matriz se diagonaliza y calcular potencias se vuelve trivial.',
    lead: 'Una matriz transforma casi todos los vectores cambiándoles la dirección. Pero hay algunas direcciones especiales, los <b>autovectores</b>, que solo se estiran o se achican; el factor de estiramiento es el <b>autovalor</b>. Mirá cómo el círculo se convierte en una elipse cuyos ejes, en matrices simétricas, son los autovectores.',
    body: `<div class="bench"><div class="ctrl"><p class="mono" style="margin:0">A = [[a, b], [c, d]]</p>${A.sliders('ev', D)}<div class="chips"><button class="chip" data-ev="2,1,1,2">Simétrica</button><button class="chip" data-ev="0,-1,1,0">Rotación</button><button class="chip" data-ev="1,1,0,1">No diagonalizable</button><button class="chip" data-ev="0.9,0.2,0.1,0.8">Markov</button></div><div id="ev-pill"></div><dl class="stats" id="ev-st" style="margin:0"></dl></div>
      <div class="stage"><canvas id="ev-cv" style="width:min(100%,500px);aspect-ratio:1;align-self:center"></canvas>${A.legend([['faint', 'Círculo unitario'], ['teal', `Su imagen por Aⁿ`], ['amber', 'Autovectores']])}<div class="steplist" id="ev-steps"></div></div></div>`,
    init() { A.bindSliders('ev', D, st, upd); $$('[data-ev]').forEach(b => b.onclick = () => { b.dataset.ev.split(',').map(Number).forEach((v, i) => A.setSlider('ev', 'abcd'[i], v, st, 1)); upd(); }); upd(); },
    draw
  });
  const pw = (M, k) => { let P = [[1, 0], [0, 1]]; for (let i = 0; i < k; i++) P = mul(P, M); return P; };
  function upd() {
    const { a, b, c, d, k } = st, tr = a + d, dt = a * d - b * c, disc = tr * tr - 4 * dt, M = [[a, b], [c, d]], An = pw(M, k);
    let L = [], V = [], kind;
    if (disc < -1e-9) kind = ['Autovalores complejos: no se diagonaliza en los reales (la matriz gira)', 'warn'];
    else { const s = Math.sqrt(Math.max(0, disc)); L = [(tr + s) / 2, (tr - s) / 2]; V = L.map(l => { const v = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : (Math.abs(l - a) < 1e-9 ? [1, 0] : [0, 1]); const nn = Math.hypot(...v); return v.map(z => z / nn); }); const dep = Math.abs(V[0][0] * V[1][1] - V[0][1] * V[1][0]) < 1e-6; kind = Math.abs(disc) < 1e-9 && dep && !(Math.abs(b) < 1e-9 && Math.abs(c) < 1e-9) ? ['Autovalor repetido con un solo autovector: no diagonalizable', 'bad'] : ['Diagonalizable', 'ok']; if (kind[1] === 'bad') V = [V[0]]; }
    R = { L, V, An, disc };
    $('#ev-pill').innerHTML = `<span class="pill ${kind[1]}">${kind[0]}</span>`;
    $('#ev-st').innerHTML = A.stats([['Traza', f2(tr)], ['Determinante', f2(dt)], ['Autovalores', disc < -1e-9 ? `${f3(tr / 2)} ± ${f3(Math.sqrt(-disc) / 2)}i` : `${f3(L[0])} y ${f3(L[1])}`], [`A${k > 1 ? '^' + k : ''}`, `[[${f2(An[0][0])}, ${f2(An[0][1])}], [${f2(An[1][0])}, ${f2(An[1][1])}]]`]]);
    const S = [`Polinomio característico: det(A − λI) = (${f2(a)} − λ)(${f2(d)} − λ) − ${f2(b)}·${f2(c)} = λ² − ${f2(tr)}λ + ${f2(dt)} = 0. (Siempre: λ² − traza·λ + det.)`];
    if (disc < -1e-9) S.push(`El discriminante es negativo (${f3(disc)}): no hay direcciones reales que se conserven. La matriz combina una rotación con un estiramiento.`);
    else {
      S.push(`Autovalores: λ₁ = <b>${f3(L[0])}</b>, λ₂ = <b>${f3(L[1])}</b>. Cumplen λ₁ + λ₂ = traza y λ₁·λ₂ = det.`);
      S.push(`Autovectores: para cada λ resuelvo (A − λI)v = 0. ${R.V.map((v, i) => `v${i + 1} = (${f3(v[0])}, ${f3(v[1])})`).join(', ')}. Verificación: A·v₁ = ${f3(L[0])}·v₁.`);
      if (kind[1] === 'ok') { S.push(`Diagonalización: A = P·D·P⁻¹ con P = [v₁ v₂] (autovectores como columnas) y D = diag(${f3(L[0])}, ${f3(L[1])}).`); S.push(`Para calcular potencias: Aⁿ = P·Dⁿ·P⁻¹, y Dⁿ solo eleva cada autovalor: diag(${f3(L[0])}ⁿ, ${f3(L[1])}ⁿ). Con n = ${k}: ${f3(Math.pow(L[0], k))} y ${f3(Math.pow(L[1], k))}. ${Math.max(...L.map(Math.abs)) < 1 ? 'Como los dos son menores que 1 en valor absoluto, Aⁿ → 0.' : Math.abs(Math.max(...L.map(Math.abs)) - 1) < 1e-6 ? 'Hay un autovalor igual a 1: Aⁿ converge a una matriz fija (es lo que pasa en Markov).' : 'A largo plazo domina el autovalor más grande: todo se alinea con su autovector.'}`); }
      else S.push('Hay un solo autovector independiente, así que no alcanza para armar P: la matriz no es diagonalizable (se usa la forma de Jordan).');
    }
    $('#ev-steps').innerHTML = A.steps(S); draw();
  }
  function draw() {
    if (!R) return; const pts = Array.from({ length: 121 }, (_, i) => { const t = i / 120 * 2 * Math.PI; return [Math.cos(t), Math.sin(t)]; }), img = pts.map(([x, y]) => [R.An[0][0] * x + R.An[0][1] * y, R.An[1][0] * x + R.An[1][1] * y]);
    const m = Math.min(40, Math.max(2, ...img.flat().map(Math.abs)) * 1.15), g = A.ax($('#ev-cv'), [-m, m], [-m, m], { l: 32 }); if (!g) return;
    g.hline(0, K.faint, 1); g.vline(0, K.faint, 1); g.path(pts, K.faint, 1.4, [4, 4]); g.poly(img, 'rgba(67,200,184,.12)', K.teal);
    R.V.forEach((v, i) => { g.path([[-m * 2 * v[0], -m * 2 * v[1]], [m * 2 * v[0], m * 2 * v[1]]], 'rgba(242,169,59,.35)', 1, [6, 4]); const s = Math.pow(R.L[i], st.k); g.path([[0, 0], [v[0] * s, v[1] * s]], K.amber, 3); g.dot(v[0] * s, v[1] * s, K.amber, 5); });
  }
}

/* ================= Formas cuadráticas ================= */
{
  const st = {}; let R = null;
  const D = [['a', 'a (coeficiente de x²)', -3, 3, .1, 2, 1], ['b', 'b (mitad del coeficiente de xy)', -3, 3, .1, 1, 1], ['c', 'c (coeficiente de y²)', -3, 3, .1, 1, 1]];
  A.tool({
    id: 'formas-cuadraticas', mat: 'algebra', unit: 5, ord: 1, name: 'Formas cuadráticas y su signo', short: 'Formas cuadráticas', tag: 'Definida, semidefinida, indefinida', f: 'Q(x) = xᵀ·A·x',
    desc: 'Clasificá una forma cuadrática por menores principales y por autovalores. Es la herramienta detrás de las condiciones de segundo orden.',
    lead: 'Una forma cuadrática Q(x, y) = ax² + 2bxy + cy² se escribe como xᵀAx con A simétrica. Su signo decide todo: si Q > 0 siempre, el punto crítico es un mínimo; si Q < 0, un máximo; si cambia de signo, una silla. Por eso el hessiano se analiza así.',
    body: `<div class="bench"><div class="ctrl">${A.sliders('fq2', D)}<div class="chips"><button class="chip" data-fq="2,1,1">Definida positiva</button><button class="chip" data-fq="-2,1,-1">Definida negativa</button><button class="chip" data-fq="1,2,1">Indefinida</button><button class="chip" data-fq="1,1,1">Semidefinida</button></div><div id="fq2-pill"></div><dl class="stats" id="fq2-st" style="margin:0"></dl></div>
      <div class="stage"><div class="mono" id="fq2-eq" style="font-size:16px;color:var(--amber)"></div><canvas id="fq2-cv" style="width:min(100%,440px);aspect-ratio:1;align-self:center"></canvas><div class="steplist" id="fq2-steps"></div></div></div>`,
    init() { A.bindSliders('fq2', D, st, upd); $$('[data-fq]').forEach(b => b.onclick = () => { b.dataset.fq.split(',').map(Number).forEach((v, i) => A.setSlider('fq2', 'abc'[i], v, st, 1)); upd(); }); upd(); },
    draw
  });
  function upd() {
    const { a, b, c } = st, D2 = a * c - b * b, tr = a + c, s = Math.sqrt(Math.max(0, tr * tr - 4 * D2)), l1 = (tr + s) / 2, l2 = (tr - s) / 2, e = 1e-9;
    const kind = D2 > e ? (a > 0 ? ['Definida positiva', 'ok', 'mínimo'] : ['Definida negativa', 'ok', 'máximo']) : D2 < -e ? ['Indefinida', 'bad', 'punto silla'] : (a + c > e ? ['Semidefinida positiva', 'warn', 'caso dudoso'] : a + c < -e ? ['Semidefinida negativa', 'warn', 'caso dudoso'] : ['Nula', 'warn', 'caso dudoso']);
    R = 1; $('#fq2-eq').textContent = `Q(x, y) = ${f2(a)}x² ${2 * b >= 0 ? '+' : '−'} ${f2(Math.abs(2 * b))}xy ${c >= 0 ? '+' : '−'} ${f2(Math.abs(c))}y²`;
    $('#fq2-pill').innerHTML = `<span class="pill ${kind[1]}">${kind[0]}</span>`;
    $('#fq2-st').innerHTML = A.stats([['Menor 1: a', f2(a)], ['Menor 2: ac − b²', f3(D2)], ['Autovalores', `${f3(l1)} y ${f3(l2)}`]]);
    $('#fq2-steps').innerHTML = A.steps([
      `Matriz asociada: A = [[${f2(a)}, ${f2(b)}], [${f2(b)}, ${f2(c)}]] (el coeficiente de xy se reparte por mitades fuera de la diagonal).`,
      `Por menores principales: D₁ = ${f2(a)}, D₂ = ${f3(D2)}. Definida positiva si D₁ > 0 y D₂ > 0; definida negativa si D₁ < 0 y D₂ > 0 (los signos alternan, empezando en negativo); indefinida si D₂ < 0.`,
      `Por autovalores: ${f3(l1)} y ${f3(l2)}. Todos positivos → definida positiva; todos negativos → negativa; de distinto signo → indefinida; alguno cero → semidefinida.`,
      `En el gráfico, el color muestra el signo de Q: ${kind[0] === 'Indefinida' ? 'hay regiones positivas y negativas, separadas por dos rectas donde Q = 0.' : kind[1] === 'ok' ? 'tiene el mismo signo en todos lados salvo en el origen, y las curvas de nivel son elipses.' : 'hay una recta entera donde Q vale cero.'}`,
      `Aplicación: si este fuera el hessiano en un punto crítico, sería un <b>${kind[2]}</b>. Con restricciones se usa la misma idea, pero con el hessiano orlado.`]);
    draw();
  }
  function draw() { if (!R) return; const { a, b, c } = st; A.contour($('#fq2-cv'), (x, y) => a * x * x + 2 * b * x * y + c * y * y, [-2, 2], [-2, 2], 14); }
}

/* ================= Modelo de insumo-producto de Leontief ================= */
{
  const SEC = ['Agro', 'Industria', 'Servicios'];
  let Am = [[.15, .10, .05], [.25, .30, .15], [.10, .20, .20]], d = [100, 250, 300], R = null;
  A.tool({
    id: 'leontief', mat: 'algebra', unit: 6, ord: 1, name: 'Modelo insumo-producto de Leontief', short: 'Leontief', tag: 'Matriz insumo-producto', f: 'x = (I − A)⁻¹·d',
    desc: 'Cuánto tiene que producir cada sector para abastecer la demanda final y, a la vez, los insumos que se piden entre sí. Con multiplicadores sectoriales.',
    lead: 'Cada sector usa insumos de los demás: para producir alimentos hacen falta fertilizantes, transporte y maquinaria. La matriz técnica A dice cuánto necesita cada sector (columna) de cada otro (fila) por cada peso que produce. Leontief ganó el Nobel por este modelo.',
    body: `<div class="bench"><div class="ctrl"><div><label class="l">Coeficientes técnicos A (columna: quién compra)</label>${mtxIn('le-a', Am, SEC)}</div><div><label class="l">Demanda final d</label>${mtxIn('le-d', d.map(v => [v]), SEC)}</div><p class="err" id="le-err"></p></div>
      <div class="stage"><div class="tbl-wrap"><table class="tbl" id="le-tbl"></table></div><canvas id="le-cv" style="height:240px"></canvas>${A.legend([['faint', 'Demanda final'], ['amber', 'Producción total necesaria']])}<div class="steplist" id="le-steps"></div></div></div>`,
    init() { bindMtx('le-a', Am, upd); const dm = d.map(v => [v]); bindMtx('le-d', dm, () => { d = dm.map(r => r[0]); upd(); }); upd(); },
    draw
  });
  function upd() {
    R = null; if (!Am.flat().every(v => v >= 0) || !d.every(v => v >= 0)) { $('#le-err').textContent = 'Los coeficientes y la demanda tienen que ser no negativos.'; return; }
    const IA = Am.map((r, i) => r.map((v, j) => +(i === j) - v)), L = inv(IA), cs = Am[0].map((_, j) => Am.reduce((s, r) => s + r[j], 0));
    if (!L || L.flat().some(v => v < -1e-9)) { $('#le-err').textContent = 'Con estos coeficientes la economía no es productiva: (I − A) no tiene inversa no negativa (condición de Hawkins-Simon).'; $('#le-tbl').innerHTML = ''; draw(); return; }
    $('#le-err').textContent = ''; const x = L.map(r => r.reduce((s, v, j) => s + v * d[j], 0)), mult = L[0].map((_, j) => L.reduce((s, r) => s + r[j], 0)), inter = Am.map((r, i) => r.reduce((s, v, j) => s + v * x[j], 0));
    R = { x };
    $('#le-tbl').innerHTML = `<tr><th>Sector</th><th>Demanda final</th><th>Insumos para otros</th><th>Producción total x</th><th>Multiplicador</th></tr>` + SEC.map((s, i) => `<tr><td>${s}</td><td>${f2(d[i])}</td><td>${f2(inter[i])}</td><td><b>${f2(x[i])}</b></td><td>${f3(mult[i])}</td></tr>`).join('');
    $('#le-steps').innerHTML = A.steps([
      `Cada sector produce para dos destinos: la demanda final y los insumos de los demás. x = A·x + d, así que (I − A)·x = d.`,
      `Matriz inversa de Leontief: (I − A)⁻¹ = ${mtxHTML(L.map(r => r.map(v => f3(v))))}. Cada elemento (i, j) dice cuánto tiene que producir el sector i, directa e indirectamente, para entregar $1 de demanda final del sector j.`,
      `Producción necesaria: x = (I − A)⁻¹·d = (${x.map(f2).join('; ')}). En total se producen ${f2(x.reduce((s, v) => s + v, 0))} para entregar una demanda final de ${f2(d.reduce((s, v) => s + v, 0))}.`,
      `Multiplicadores (sumas de cada columna): un peso más de demanda de ${SEC[mult.indexOf(Math.max(...mult))]} genera ${f3(Math.max(...mult))} pesos de producción en toda la economía. Es el que más "arrastra": un candidato a promover si se busca empujar la actividad.`,
      `Condición de productividad (Hawkins-Simon): cada columna de A suma menos de 1 (${cs.map(f2).join(', ')}), así que cada sector agrega valor y el sistema tiene solución positiva.`]);
    draw();
  }
  function draw() { if (!R) return; const m = Math.max(...R.x, ...d) * 1.15, g = A.ax($('#le-cv'), [-.5, 2.5], [0, m], { xticks: [0, 1, 2], xf: v => SEC[v] || '', l: 44 }); if (!g) return; const bw = (g.X(1) - g.X(0)) * .3; SEC.forEach((_, i) => { g.c.fillStyle = 'rgba(160,160,180,.5)'; g.c.fillRect(g.X(i) - bw - 2, g.Y(d[i]), bw, g.Y(0) - g.Y(d[i])); g.c.fillStyle = K.amber; g.c.fillRect(g.X(i) + 2, g.Y(R.x[i]), bw, g.Y(0) - g.Y(R.x[i])); }); }
}
})();
