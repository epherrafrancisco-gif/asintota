/* Asíntota · Álgebra lineal: transformaciones del plano y sistemas de ecuaciones */
(() => {
const { $, $$, K, fmt } = A;

/* ================= Transformaciones ================= */
{
  let P, timer = null;
  const st = { m: [2, 1, 1, 2], t: 1 };
  const PRE = {
    'Identidad': [1, 0, 0, 1], 'Rotar 45°': [Math.SQRT1_2, -Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2], 'Estirar en x': [2, 0, 0, 1],
    'Cizalla': [1, 1, 0, 1], 'Espejo': [-1, 0, 0, 1], 'Aplastar (det 0)': [1, 2, .5, 1], 'Con autovectores': [2, 1, 1, 2], 'Rotar y achicar': [.6, -.6, .6, .6]
  };
  const F_SHAPE = [[0, 0], [0, 2], [1.2, 2], [1.2, 1.6], [.4, 1.6], [.4, 1.1], [1, 1.1], [1, .7], [.4, .7], [.4, 0]];
  const Mt = () => { const [a, b, c, d] = st.m, t = st.t; return [1 + (a - 1) * t, b * t, c * t, 1 + (d - 1) * t]; };
  const ap = (M, [x, y]) => [M[0] * x + M[1] * y, M[2] * x + M[3] * y];
  const eig = ([a, b, c, d]) => {
    const tr = a + d, det = a * d - b * c, disc = tr * tr - 4 * det;
    if (disc < -1e-12) return { complex: true, re: tr / 2, im: Math.sqrt(-disc) / 2 };
    const s = Math.sqrt(Math.max(0, disc)), ls = [(tr + s) / 2, (tr - s) / 2];
    const vec = l => Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : null;
    let vs = ls.map(vec);
    if (!vs[0]) vs = [[1, 0], [0, 1]];
    return { ls, vs: vs.map(v => { const n = Math.hypot(...v); return [v[0] / n, v[1] / n]; }) };
  };
  A.tool({
    id: 'transformaciones', sec: 'algebra', name: 'Matrices que transforman el plano', short: 'Transformaciones', tag: 'Transformaciones lineales', f: 'det(M) = ad − bc',
    desc: 'Una matriz 2×2 deforma todo el plano. Mirá qué pasa con la grilla, el área y los autovectores.',
    lead: 'Una matriz es una instrucción para deformar el plano: las columnas te dicen adónde van los vectores (1, 0) y (0, 1). Todo lo demás los sigue.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Matriz M</label>
          <div class="mtx-in" style="grid-template-columns:1fr 1fr;max-width:200px">
            <input class="field" id="la-a" style="color:var(--amber)"><input class="field" id="la-b" style="color:var(--teal)">
            <input class="field" id="la-c" style="color:var(--amber)"><input class="field" id="la-d" style="color:var(--teal)">
          </div>
          <p class="note" style="margin-top:8px">Columna ámbar: adónde va (1, 0). Columna verde: adónde va (0, 1).</p>
        </div>
        <div><label class="l">Ejemplos</label><div class="chips">${Object.keys(PRE).map(k => `<button class="chip" data-la="${k}">${k}</button>`).join('')}</div></div>
        <div><label class="l" for="la-t">Transformación aplicada: <span id="la-tv" style="color:var(--fg)">100%</span></label><input type="range" id="la-t" min="0" max="1" step="0.01" value="1"></div>
        <button class="btn primary sm" id="la-play" style="align-self:flex-start">Animar desde la identidad</button>
        <dl class="stats" id="la-stats" style="margin:0"></dl>
      </div>
      <div class="stage">
        <canvas id="la-cv" class="cv-tall" style="background:var(--bg)"></canvas>
        <div class="legend"><span><i style="background:var(--amber)"></i>M·(1, 0)</span><span><i style="background:var(--teal)"></i>M·(0, 1)</span><span><i style="background:var(--rose)"></i>Autovectores</span></div>
        <div class="explain" id="la-exp"></div>
      </div>
    </div>`,
    init() {
      const sync = () => ['a', 'b', 'c', 'd'].forEach((k, i) => $('#la-' + k).value = +st.m[i].toFixed(3));
      ['a', 'b', 'c', 'd'].forEach((k, i) => $('#la-' + k).oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.m[i] = v; upd(); } });
      $$('[data-la]').forEach(b => b.onclick = () => { st.m = [...PRE[b.dataset.la]]; sync(); play(); });
      $('#la-t').oninput = e => { st.t = +e.target.value; upd(); };
      $('#la-play').onclick = play;
      P = A.plane($('#la-cv'), { span: w => w < 600 ? 9 : 12, layers });
      sync(); upd();
    },
    draw: () => P.draw(),
    hide: () => cancelAnimationFrame(timer)
  });
  function play() {
    cancelAnimationFrame(timer); const t0 = performance.now(), dur = A.reduce ? 1 : 1200;
    const step = now => { st.t = Math.min(1, (now - t0) / dur); st.t = st.t < .5 ? 2 * st.t * st.t : 1 - (-2 * st.t + 2) ** 2 / 2; upd(); if (now - t0 < dur) timer = requestAnimationFrame(step); };
    timer = requestAnimationFrame(step);
  }
  function upd() {
    $('#la-t').value = st.t; $('#la-tv').textContent = Math.round(st.t * 100) + '%';
    const [a, b, c, d] = st.m, det = a * d - b * c, e = eig(st.m);
    const ev = e.complex ? `${fmt(e.re, 2)} ± ${fmt(e.im, 2)}i` : e.ls.map(l => fmt(l, 3)).join(' y ');
    const inv = Math.abs(det) > 1e-12 ? `[${fmt(d / det, 2)}, ${fmt(-b / det, 2)}; ${fmt(-c / det, 2)}, ${fmt(a / det, 2)}]` : 'No existe';
    $('#la-stats').innerHTML = A.stats([['Determinante', fmt(det, 3)], ['Autovalores', ev], ['Inversa', inv]]);
    const ad = Math.abs(det);
    $('#la-exp').innerHTML = `<p><b>Determinante ${fmt(det, 2)}:</b> ${ad < 1e-9 ? 'el plano se <b>aplasta</b> en una recta (o un punto). Se pierde información, por eso la matriz no tiene inversa.' : `todas las áreas se multiplican por ${fmt(ad, 2)}${det < 0 ? ' y el plano se <b>da vuelta</b> como en un espejo (por eso el signo negativo)' : ''}. El cuadrado pintado tenía área 1 y ahora tiene área ${fmt(ad, 2)}.`}</p>
      <p style="margin-top:6px"><b>Autovectores:</b> ${e.complex ? 'no hay direcciones que se mantengan: la matriz <b>rota</b> todo el plano.' : `son las direcciones que no giran, solo se estiran. Sobre ellas, M multiplica por ${ev}.`}</p>`;
    P.draw();
  }
  function layers(a) {
    const M = Mt(), { c } = a, R = 12;
    c.lineWidth = 1; c.strokeStyle = 'rgba(242,169,59,.22)'; c.beginPath();
    for (let i = -R; i <= R; i++) {
      let p = ap(M, [i, -R]), q = ap(M, [i, R]); c.moveTo(a.PX(p[0]), a.PY(p[1])); c.lineTo(a.PX(q[0]), a.PY(q[1]));
      p = ap(M, [-R, i]); q = ap(M, [R, i]); c.moveTo(a.PX(p[0]), a.PY(p[1])); c.lineTo(a.PX(q[0]), a.PY(q[1]));
    }
    c.stroke();
    const det = M[0] * M[3] - M[1] * M[2], sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map(p => ap(M, p));
    c.fillStyle = det >= 0 ? 'rgba(67,200,184,.20)' : 'rgba(239,115,145,.22)'; c.beginPath(); sq.forEach(([x, y], i) => i ? c.lineTo(a.PX(x), a.PY(y)) : c.moveTo(a.PX(x), a.PY(y))); c.closePath(); c.fill();
    c.strokeStyle = K.fg; c.lineWidth = 2; c.beginPath(); F_SHAPE.map(p => ap(M, p)).forEach(([x, y], i) => i ? c.lineTo(a.PX(x), a.PY(y)) : c.moveTo(a.PX(x), a.PY(y))); c.closePath(); c.stroke();
    if (st.t > .99) { const e = eig(M); if (!e.complex) e.vs.forEach(v => a.line(-50 * v[0], -50 * v[1], 50 * v[0], 50 * v[1], K.rose, 1.4, [6, 5])); }
    a.arrow(0, 0, M[0], M[2], K.amber); a.arrow(0, 0, M[1], M[3], K.teal);
  }
}

/* ================= Sistemas de ecuaciones ================= */
{
  let P = null;
  const VARS = ['x', 'y', 'z', 'w'];
  const DEF = { 2: [[2, 1, 5], [1, -1, 1]], 3: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]], 4: [[1, 1, 1, 1, 10], [2, -1, 1, 0, 3], [0, 1, -1, 2, 7], [1, 0, 2, -1, 3]] };
  const st = { n: 3, M: DEF[3].map(r => [...r]) };
  const fr = f => f.toFraction().replace('-', '−');
  A.tool({
    id: 'sistemas', sec: 'algebra', name: 'Sistemas de ecuaciones', short: 'Sistemas', tag: 'Eliminación de Gauss', f: 'Gauss–Jordan paso a paso',
    desc: 'Resolvé sistemas de 2, 3 o 4 ecuaciones con todos los pasos de Gauss–Jordan, en fracciones exactas.',
    lead: 'Cargá los coeficientes y el sistema se resuelve por eliminación de Gauss–Jordan, mostrando cada operación entre filas con fracciones exactas (nada de decimales redondeados).',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Cantidad de incógnitas</label><div class="seg" id="sy-n"><button data-v="2" aria-pressed="false">2</button><button data-v="3" aria-pressed="true">3</button><button data-v="4" aria-pressed="false">4</button></div></div>
        <div><label class="l">Coeficientes</label><div class="mtx-in" id="sy-in"></div><p class="err" id="sy-err"></p></div>
        <div class="formula" id="sy-eq"></div>
        <div class="row"><button class="btn sm" id="sy-rand">Sistema al azar</button><button class="btn sm" id="sy-def">Volver al ejemplo</button></div>
      </div>
      <div class="stage">
        <div id="sy-res"></div>
        <canvas id="sy-cv" style="height:300px;background:var(--bg)" hidden></canvas>
        <div class="steplist" id="sy-steps"></div>
      </div>
    </div>`,
    init() {
      $$('#sy-n button').forEach(b => b.onclick = () => { st.n = +b.dataset.v; st.M = DEF[st.n].map(r => [...r]); $$('#sy-n button').forEach(x => x.setAttribute('aria-pressed', x === b)); build(); });
      $('#sy-def').onclick = () => { st.M = DEF[st.n].map(r => [...r]); build(); };
      $('#sy-rand').onclick = () => {
        const sol = Array.from({ length: st.n }, () => Math.floor(Math.random() * 11) - 5);
        st.M = Array.from({ length: st.n }, () => { const r = Array.from({ length: st.n }, () => Math.floor(Math.random() * 9) - 4); return [...r, r.reduce((s, v, j) => s + v * sol[j], 0)]; });
        build();
      };
      build();
    },
    draw: () => P && !$('#sy-cv').hidden && P.draw()
  });
  function build() {
    const n = st.n, box = $('#sy-in');
    box.style.gridTemplateColumns = `repeat(${n}, 1fr) 14px 1fr`;
    box.innerHTML = st.M.map((r, i) => r.map((v, j) => (j === n ? '<span class="sep">=</span>' : '') + `<input class="field" data-i="${i}" data-j="${j}" value="${String(v).replace('.', ',')}" aria-label="Fila ${i + 1}, ${j < n ? 'coeficiente de ' + VARS[j] : 'término independiente'}">`).join('')).join('');
    $$('#sy-in input').forEach(inp => inp.oninput = () => { st.M[+inp.dataset.i][+inp.dataset.j] = A.num(inp.value); solve(); });
    $('#sy-cv').hidden = n !== 2;
    if (n === 2 && !P) P = A.plane($('#sy-cv'), { span: 12, layers: lines });
    solve();
  }
  function eqText(r) {
    const n = st.n; let s = '';
    r.slice(0, n).forEach((v, j) => {
      if (!v) return; const a = Math.abs(v), coef = a === 1 ? '' : fmt(a, 4);
      s += s ? (v < 0 ? ' − ' : ' + ') : (v < 0 ? '−' : ''); s += coef + VARS[j];
    });
    return (s || '0') + ' = ' + fmt(r[n], 4);
  }
  function mtxHTML(M, piv) {
    const n = st.n;
    return `<div class="tbl-wrap"><div class="mtx" style="grid-template-columns:repeat(${n + 1},auto)">${M.map((r, i) => r.map((v, j) => `<span class="${j === n ? 'bar' : ''} ${piv && piv[0] === i && piv[1] === j ? 'piv' : ''}">${v}</span>`).join('')).join('')}</div></div>`;
  }
  function solve() {
    const n = st.n;
    if (st.M.some(r => r.some(v => !Number.isFinite(v)))) { $('#sy-err').textContent = 'Hay un casillero vacío o que no es un número.'; return; }
    $('#sy-err').textContent = '';
    $('#sy-eq').innerHTML = st.M.map(eqText).join('<br>');
    let M = st.M.map(r => r.map(v => math.fraction(v)));
    const snap = () => M.map(r => r.map(fr));
    const steps = [{ t: 'Matriz ampliada del sistema: cada fila es una ecuación y la última columna son los resultados.', m: snap() }];
    let r = 0; const pivCols = [];
    for (let col = 0; col < n && r < n; col++) {
      let p = -1; for (let i = r; i < n; i++) if (!M[i][col].equals(0)) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) { [M[p], M[r]] = [M[r], M[p]]; steps.push({ t: `Intercambio F${r + 1} ↔ F${p + 1} para tener un número distinto de 0 en el pivote.`, m: snap(), piv: [r, col] }); }
      const pv = M[r][col];
      if (!pv.equals(1)) { M[r] = M[r].map(x => x.div(pv)); steps.push({ t: `Divido F${r + 1} por ${fr(pv)} para que el pivote sea 1: <b>F${r + 1} → F${r + 1} ÷ ${fr(pv)}</b>.`, m: snap(), piv: [r, col] }); }
      const ops = [];
      for (let i = 0; i < n; i++) {
        if (i === r) continue; const f = M[i][col]; if (f.equals(0)) continue;
        M[i] = M[i].map((x, j) => x.sub(f.mul(M[r][j])));
        const af = f.abs(), co = af.equals(1) ? '' : fr(af) + '·';
        ops.push(`F${i + 1} → F${i + 1} ${f.compare(0) < 0 ? '+' : '−'} ${co}F${r + 1}`);
      }
      if (ops.length) steps.push({ t: `Hago ceros en la columna de ${VARS[col]}: <b>${ops.join(' &nbsp;·&nbsp; ')}</b>.`, m: snap(), piv: [r, col] });
      pivCols.push(col); r++;
    }
    const incons = M.some(row => row.slice(0, n).every(x => x.equals(0)) && !row[n].equals(0));
    let res;
    if (incons) res = `<span class="pill bad">Sin solución</span><p class="note" style="margin-top:8px">Quedó una fila del tipo 0 = algo distinto de 0: las ecuaciones se contradicen. ${n === 2 ? 'En el gráfico, son dos rectas paralelas que nunca se cruzan.' : ''}</p>`;
    else if (r < n) { const free = VARS.slice(0, n).filter((_, j) => !pivCols.includes(j)); res = `<span class="pill warn">Infinitas soluciones</span><p class="note" style="margin-top:8px">Hay ${r} ecuaciones independientes para ${n} incógnitas. ${free.join(', ')} ${free.length > 1 ? 'quedan libres' : 'queda libre'}: le das cualquier valor y el resto se ajusta. ${n === 2 ? 'En el gráfico, las dos rectas son la misma.' : ''}</p>`; }
    else {
      const sol = pivCols.map((col, i) => [VARS[col], M[i][n]]);
      res = `<span class="pill ok">Solución única</span><div class="big sm" style="margin-top:10px">${sol.map(([v, x]) => `${v} = ${fr(x)}`).join(' &nbsp; ')}</div>${sol.some(([, x]) => x.d !== 1 && x.d !== 1n) ? `<p class="note mono" style="margin-top:4px">${sol.map(([v, x]) => `${v} ≈ ${fmt(x.valueOf(), 4)}`).join(' · ')}</p>` : ''}`;
    }
    $('#sy-res').innerHTML = res;
    $('#sy-steps').innerHTML = steps.map((s, i) => `<div class="step"><p><b>Paso ${i + 1}.</b> ${s.t}</p>${mtxHTML(s.m, s.piv)}</div>`).join('');
    if (n === 2 && P) P.draw();
  }
  function lines(a) {
    if (st.n !== 2) return;
    const cols = [K.amber, K.teal];
    st.M.forEach(([p, q, r], i) => {
      if (!Number.isFinite(p + q + r)) return;
      if (Math.abs(q) > 1e-12) a.plot(x => (r - p * x) / q, cols[i], 2.2);
      else if (Math.abs(p) > 1e-12) a.line(r / p, a.y0, r / p, a.y1, cols[i], 2.2);
    });
    const [[p1, q1, r1], [p2, q2, r2]] = st.M, det = p1 * q2 - p2 * q1;
    if (Math.abs(det) > 1e-12) { const x = (r1 * q2 - r2 * q1) / det, y = (p1 * r2 - p2 * r1) / det; a.dot(x, y, K.fg, 6); a.c.fillStyle = K.fg; a.c.font = '12px ' + A.MONO; a.c.textAlign = 'left'; a.c.textBaseline = 'bottom'; a.c.fillText(`(${fmt(x, 2)}; ${fmt(y, 2)})`, a.PX(x) + 9, a.PY(y) - 6); }
  }
}
})();
