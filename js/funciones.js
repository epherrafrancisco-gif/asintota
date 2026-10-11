/* Asíntota · Funciones y cálculo: graficador, derivadas, integrales, series de Taylor */
(() => {
const { $, $$, K, fmt, fmtF, mkFn } = A;
const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sup = n => String(n).split('').map(d => SUP[d]).join('');
const fnChips = (id, list) => `<div class="chips" id="${id}">${list.map(s => `<button class="chip" data-fx="${s}">${s}</button>`).join('')}</div>`;

/* ================= Graficador ================= */
{
  let P; const COLORS = [K.amber, K.teal, K.rose], fns = [null, null, null];
  A.tool({
    id: 'graficador', sec: 'funciones', name: 'Graficador', tag: 'Funciones', f: 'f(x) = sen(x)/x',
    desc: 'Escribí hasta tres funciones y graficalas. Arrastrá para moverte y usá la rueda para hacer zoom.',
    lead: 'Escribí funciones de x. Arrastrá el gráfico para moverte y usá la rueda (o los botones) para acercarte.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Funciones</label><div style="display:flex;flex-direction:column;gap:10px" id="g-fns"></div></div>
        <div><label class="l">Ejemplos</label>${fnChips('g-ex', ['sen(x)/x', 'x^3 - 3x', 'e^(-x^2)', 'tan(x)', 'abs(x) - 2', 'ln(x)', 'raiz(9 - x^2)', '2^x'])}</div>
        ${A.fnHelp}
        <div class="row"><button class="btn sm" id="g-zin">Acercar</button><button class="btn sm" id="g-zout">Alejar</button><button class="btn sm" id="g-reset">Volver al centro</button></div>
      </div>
      <div class="stage"><canvas id="g-cv" class="cv-tall" style="background:var(--bg)"></canvas><div class="readout" id="g-read">Pasá el mouse por el gráfico para leer los valores.</div></div>
    </div>`,
    init() {
      ['sen(x)', '1/x', 'x^2/4 - 2'].forEach((v, i) => {
        const d = document.createElement('div'); d.className = 'fn';
        d.innerHTML = `<span class="sw" style="background:${COLORS[i]}"></span><div class="fn-in"><span class="pre">f${SUB[i + 1]}(x) =</span><input class="field" id="g-f${i}" spellcheck="false" autocomplete="off" value="${v}"></div><span></span><span class="err" id="g-e${i}"></span>`;
        $('#g-fns').appendChild(d);
      });
      const compile = i => { const r = mkFn($('#g-f' + i).value); fns[i] = r.f; $('#g-e' + i).textContent = r.err; };
      [0, 1, 2].forEach(i => { compile(i); $('#g-f' + i).addEventListener('input', () => { compile(i); P.draw(); }); });
      $$('#g-ex [data-fx]').forEach(b => b.onclick = () => {
        let i = [0, 1, 2].find(k => !$('#g-f' + k).value.trim()); if (i === undefined) i = 2;
        $('#g-f' + i).value = b.dataset.fx; compile(i); P.draw();
      });
      P = A.plane($('#g-cv'), {
        span: w => w < 600 ? 12 : 20,
        layers: a => fns.forEach((f, i) => f && a.plot(f, COLORS[i])),
        hover: (a, px) => {
          const x = a.WX(px), c = a.c;
          c.strokeStyle = K.faint; c.setLineDash([3, 4]); c.lineWidth = 1; c.beginPath(); c.moveTo(Math.round(px) + .5, 0); c.lineTo(Math.round(px) + .5, a.h); c.stroke(); c.setLineDash([]);
          let html = `<span>x = <b style="color:var(--fg)">${fmt(x, a.d + 2)}</b></span>`;
          fns.forEach((f, i) => {
            if (!f) return; let y; try { y = f(x); } catch (e) { y = NaN; }
            if (Number.isFinite(y)) a.dot(x, y, COLORS[i], 4.5);
            html += `<span>f${SUB[i + 1]} = <b style="color:${COLORS[i]}">${Number.isFinite(y) ? fmt(y, 4) : 'no definida'}</b></span>`;
          });
          $('#g-read').innerHTML = html;
        }
      });
      $('#g-zin').onclick = () => P.zoom(1 / 1.5); $('#g-zout').onclick = () => P.zoom(1.5); $('#g-reset').onclick = () => P.reset();
    },
    draw: () => P.draw()
  });
}

/* ================= Derivadas ================= */
{
  let P, f = null;
  const st = { x0: 1, h: 1, show: true };
  const der = (g, x) => { const e = 1e-5 * Math.max(1, Math.abs(x)); return (g(x + e) - g(x - e)) / (2 * e); };
  A.tool({
    id: 'derivadas', sec: 'funciones', name: 'Derivadas', tag: 'Cálculo diferencial', f: "f'(x) = lím (f(x+h) − f(x))/h",
    desc: 'Mirá cómo la recta secante se convierte en tangente cuando h tiende a cero. La derivada es esa pendiente.',
    lead: 'La derivada es la pendiente de la curva en un punto. Achicá h y mirá cómo la recta secante (rosa) se pega a la tangente (ámbar).',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="d-f">Función</label><div class="fn-in"><span class="pre mono muted">f(x) =</span><input class="field" id="d-f" value="x^3/6 - x" spellcheck="false" autocomplete="off"></div><p class="err" id="d-e"></p></div>
        ${fnChips('d-ex', ['x^3/6 - x', 'sen(x)', 'e^(x/2)', 'ln(x)', 'x^2', 'abs(x)'])}
        <div><label class="l" for="d-x0">Punto x₀ = <span id="d-x0v" style="color:var(--fg)">1</span></label><input type="range" id="d-x0" min="-6" max="6" step="0.01" value="1"></div>
        <div><label class="l" for="d-h">Distancia h = <span id="d-hv" style="color:var(--fg)">1</span></label><input type="range" id="d-h" min="-3" max="0.5" step="0.01" value="0"></div>
        <label class="check"><input type="checkbox" id="d-show" checked> Mostrar la función derivada f'(x)</label>
        <p class="note">También podés arrastrar el punto ámbar sobre la curva.</p>
      </div>
      <div class="stage">
        <canvas id="d-cv" class="cv-tall" style="background:var(--bg)"></canvas>
        <div class="legend"><span><i style="background:var(--fg)"></i>f(x)</span><span><i style="background:var(--amber)"></i>Tangente</span><span><i style="background:var(--rose)"></i>Secante</span><span><i style="background:var(--teal)"></i>f'(x)</span></div>
        <dl class="stats" id="d-stats" style="margin:0"></dl>
        <div class="explain" id="d-exp"></div>
      </div>
    </div>`,
    init() {
      const compile = () => { const r = mkFn($('#d-f').value); f = r.f; $('#d-e').textContent = r.err; };
      const upd = () => { $('#d-x0').value = st.x0; $('#d-x0v').textContent = fmt(st.x0, 2); $('#d-hv').textContent = fmt(st.h, 4); P.draw(); info(); };
      compile();
      $('#d-f').addEventListener('input', () => { compile(); upd(); });
      $$('#d-ex [data-fx]').forEach(b => b.onclick = () => { $('#d-f').value = b.dataset.fx; compile(); if (b.dataset.fx === 'ln(x)' && st.x0 <= 0) st.x0 = 1; upd(); });
      $('#d-x0').oninput = e => { st.x0 = +e.target.value; upd(); };
      $('#d-h').oninput = e => { st.h = Math.pow(10, +e.target.value); upd(); };
      $('#d-show').onchange = e => { st.show = e.target.checked; upd(); };
      P = A.plane($('#d-cv'), {
        span: w => w < 600 ? 9 : 14,
        layers: a => {
          if (!f) return;
          if (st.show) a.plot(x => der(f, x), K.teal, 1.6, [6, 5]);
          a.plot(f, K.fg);
          const y0 = f(st.x0), m = der(f, st.x0), x1 = st.x0 + st.h, y1 = f(x1), ms = (y1 - y0) / st.h;
          if (Number.isFinite(ms)) { a.plot(x => y0 + ms * (x - st.x0), K.rose, 1.5); a.dot(x1, y1, K.rose, 4.5); }
          if (Number.isFinite(m)) a.plot(x => y0 + m * (x - st.x0), K.amber, 2);
          if (Number.isFinite(y0)) { a.dot(st.x0, y0, K.amber, 6); a.c.globalAlpha = .25; a.dot(st.x0, y0, K.amber, 12); a.c.globalAlpha = 1; }
        },
        grab: (a, px, py) => {
          if (!f) return null; const y0 = f(st.x0);
          if (Math.hypot(px - a.PX(st.x0), py - a.PY(y0)) > 16) return null;
          return { move: (mx, my, b) => { st.x0 = A.clamp(+b.WX(mx).toFixed(2), -50, 50); upd(); } };
        }
      });
      upd();
      function info() {
        if (!f) { $('#d-stats').innerHTML = ''; $('#d-exp').innerHTML = ''; return; }
        const x0 = st.x0, h = st.h, y0 = f(x0), y1 = f(x0 + h), m = der(f, x0), ms = (y1 - y0) / h, b = y0 - m * x0;
        $('#d-stats').innerHTML = A.stats([['f(x₀)', fmt(y0, 4)], ["f'(x₀)", fmt(m, 4)], ['Pendiente secante', fmt(ms, 4)], ['Diferencia', fmt(Math.abs(ms - m), 5)]]);
        const sg = v => v < 0 ? '− ' + fmt(-v, 3) : '+ ' + fmt(v, 3);
        $('#d-exp').innerHTML = `<p>Secante con h = ${fmt(h, 4)}: pendiente = [f(${fmt(x0 + h, 3)}) − f(${fmt(x0, 2)})] / ${fmt(h, 4)} = (${fmt(y1, 4)} − ${fmt(y0, 4)}) / ${fmt(h, 4)} = <b>${fmt(ms, 4)}</b>.</p>
          <p style="margin-top:6px">Cuando h se acerca a 0, esa pendiente se acerca a <b>f'(${fmt(x0, 2)}) = ${fmt(m, 4)}</b>. La recta tangente es <b>y = ${fmt(m, 3)}·x ${sg(b)}</b>.</p>
          <p style="margin-top:6px">${Math.abs(m) < 1e-3 ? 'La pendiente es casi 0: la curva está "plana" en este punto, puede ser un máximo o un mínimo.' : m > 0 ? 'La derivada es positiva: en este punto la función <b>sube</b>.' : 'La derivada es negativa: en este punto la función <b>baja</b>.'}</p>`;
      }
    },
    draw: () => P.draw()
  });
}

/* ================= Integrales ================= */
{
  let P, f = null;
  const st = { a: 0, b: 6, n: 8, m: 'med' };
  const simpson = (g, a, b, N = 2000) => {
    if (a === b) return 0; const hh = (b - a) / N; let s = g(a) + g(b);
    for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * g(a + i * hh);
    return s * hh / 3;
  };
  const riemann = () => {
    const { a, b, n, m } = st, dx = (b - a) / n; let s = 0; const pts = [];
    for (let i = 0; i < n; i++) {
      const xl = a + i * dx, xr = xl + dx;
      if (m === 'trap') { const yl = f(xl), yr = f(xr); s += (yl + yr) / 2 * dx; pts.push([xl, xr, yl, yr]); }
      else { const xs = m === 'izq' ? xl : m === 'der' ? xr : (xl + xr) / 2, y = f(xs); s += y * dx; pts.push([xl, xr, y, y, xs]); }
    }
    return { s, dx, pts };
  };
  A.tool({
    id: 'integrales', sec: 'funciones', name: 'Integrales', tag: 'Cálculo integral', f: '∫ₐᵇ f(x) dx ≈ Σ f(xᵢ)·Δx',
    desc: 'Aproximá el área bajo una curva con rectángulos y mirá cómo el error se achica al agregar más.',
    lead: 'La integral es el área entre la curva y el eje x. La aproximamos sumando rectángulos: cuantos más usás, más se parece al valor real.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="i-f">Función</label><div class="fn-in"><span class="pre mono muted">f(x) =</span><input class="field" id="i-f" value="sen(x) + 1" spellcheck="false" autocomplete="off"></div><p class="err" id="i-e"></p></div>
        ${fnChips('i-ex', ['sen(x) + 1', 'x^2/4', 'e^(-x^2/4)', '3 - x', 'raiz(x)', 'cos(x)'])}
        <div class="grid2"><div><label class="l" for="i-a">Desde a</label><input class="field" id="i-a" type="number" step="0.5" value="0"></div><div><label class="l" for="i-b">Hasta b</label><input class="field" id="i-b" type="number" step="0.5" value="6"></div></div>
        <div><label class="l" for="i-n">Rectángulos: <span id="i-nv" style="color:var(--fg)">8</span></label><input type="range" id="i-n" min="1" max="120" value="8"></div>
        <div><label class="l">Método</label><div class="seg" id="i-m"><button data-v="izq" aria-pressed="false">Izquierda</button><button data-v="der" aria-pressed="false">Derecha</button><button data-v="med" aria-pressed="true">Medio</button><button data-v="trap" aria-pressed="false">Trapecios</button></div></div>
        <p class="note">Podés arrastrar las líneas de a y b directamente en el gráfico.</p>
      </div>
      <div class="stage">
        <canvas id="i-cv" class="cv-tall" style="background:var(--bg)"></canvas>
        <dl class="stats" id="i-stats" style="margin:0"></dl>
        <div class="explain" id="i-exp"></div>
      </div>
    </div>`,
    init() {
      const compile = () => { const r = mkFn($('#i-f').value); f = r.f; $('#i-e').textContent = r.err; };
      const upd = () => { $('#i-a').value = st.a; $('#i-b').value = st.b; P.draw(); info(); };
      compile();
      $('#i-f').addEventListener('input', () => { compile(); upd(); });
      $$('#i-ex [data-fx]').forEach(b => b.onclick = () => { $('#i-f').value = b.dataset.fx; compile(); if (b.dataset.fx === 'raiz(x)' && st.a < 0) st.a = 0; upd(); });
      $('#i-a').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.a = v; P.draw(); info(); } };
      $('#i-b').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.b = v; P.draw(); info(); } };
      $('#i-n').oninput = e => { st.n = +e.target.value; $('#i-nv').textContent = st.n; P.draw(); info(); };
      $$('#i-m button').forEach(b => b.onclick = () => { st.m = b.dataset.v; $$('#i-m button').forEach(x => x.setAttribute('aria-pressed', x === b)); P.draw(); info(); });
      P = A.plane($('#i-cv'), {
        span: w => w < 600 ? 10 : 14, cx: 3, cy: 1,
        layers: a => {
          if (!f) return;
          const { c } = a, lo = Math.min(st.a, st.b), hi = Math.max(st.a, st.b), zero = a.PY(0);
          // área real
          for (let px = Math.max(0, Math.floor(a.PX(lo))); px <= Math.min(a.w, a.PX(hi)); px++) {
            const y = f(a.WX(px)); if (!Number.isFinite(y)) continue;
            c.fillStyle = y >= 0 ? 'rgba(67,200,184,.16)' : 'rgba(239,115,145,.18)';
            const py = a.PY(y); c.fillRect(px, Math.min(py, zero), 1, Math.abs(py - zero));
          }
          // rectángulos
          if (st.a !== st.b) {
            const { pts } = riemann();
            c.lineWidth = 1.2; c.strokeStyle = K.amber; c.fillStyle = 'rgba(242,169,59,.10)';
            pts.forEach(([xl, xr, yl, yr, xs]) => {
              if (!Number.isFinite(yl) || !Number.isFinite(yr)) return;
              c.beginPath(); c.moveTo(a.PX(xl), zero); c.lineTo(a.PX(xl), a.PY(yl)); c.lineTo(a.PX(xr), a.PY(yr)); c.lineTo(a.PX(xr), zero); c.closePath(); c.fill(); c.stroke();
              if (xs !== undefined && st.n <= 40) a.dot(xs, yl, K.amber, 2.5);
            });
          }
          a.plot(f, K.fg);
          [[st.a, 'a'], [st.b, 'b']].forEach(([x, l]) => {
            a.line(x, a.y0, x, a.y1, K.teal, 1.2, [4, 4]);
            c.fillStyle = K.teal; c.font = '12px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(l + ' = ' + fmt(x, 2), a.PX(x) + 6, 8);
          });
        },
        grab: (a, px) => {
          const which = Math.abs(px - a.PX(st.a)) < 10 ? 'a' : Math.abs(px - a.PX(st.b)) < 10 ? 'b' : null;
          return which ? { move: (mx, my, b) => { st[which] = Math.round(b.WX(mx) * 10) / 10; upd(); } } : null;
        }
      });
      upd();
      function info() {
        if (!f) { $('#i-stats').innerHTML = ''; $('#i-exp').innerHTML = ''; return; }
        const { s, dx, pts } = riemann(), ex = simpson(f, st.a, st.b), err = Math.abs(s - ex);
        $('#i-stats').innerHTML = A.stats([['Δx', fmt(dx, 4)], ['Suma de rectángulos', fmt(s, 5)], ['Integral (valor real)', fmt(ex, 5)], ['Error', fmt(err, 5)], ['Error relativo', ex ? A.pct(err / Math.abs(ex), 2) : '—']]);
        const nm = { izq: 'el borde izquierdo', der: 'el borde derecho', med: 'el punto medio', trap: 'los dos bordes (trapecios)' }[st.m];
        const terms = st.m === 'trap' ? pts.slice(0, 2).map(p => `(${fmt(p[2], 3)} + ${fmt(p[3], 3)})/2`) : pts.slice(0, 3).map(p => fmt(p[2], 3));
        $('#i-exp').innerHTML = `<p>Paso 1: Δx = (b − a) / n = (${fmt(st.b, 2)} − ${fmt(st.a, 2)}) / ${st.n} = <b>${fmt(dx, 4)}</b>.</p>
          <p style="margin-top:6px">Paso 2: la altura de cada rectángulo sale de evaluar f en ${nm}.</p>
          <p style="margin-top:6px">Paso 3: suma = Δx · [${terms.join(' + ')}${pts.length > terms.length ? ' + …' : ''}] = <b>${fmt(s, 5)}</b>.</p>
          <p style="margin-top:6px">${err < 1e-3 ? 'Con esta cantidad de rectángulos el error ya es despreciable.' : `Probá subir n: con el doble de rectángulos el error ${st.m === 'izq' || st.m === 'der' ? 'se reduce más o menos a la mitad' : 'se reduce más o menos a la cuarta parte'}.`} Las partes bajo el eje cuentan como área negativa.</p>`;
      }
    },
    draw: () => P.draw()
  });
}

/* ================= Taylor ================= */
{
  let P, timer = null;
  const fact = k => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
  const FN = {
    sen: { lab: 'sen(x)', f: Math.sin, c: k => k % 2 ? (-1) ** ((k - 1) / 2) / fact(k) : 0, conv: 'para todo x' },
    cos: { lab: 'cos(x)', f: Math.cos, c: k => k % 2 ? 0 : (-1) ** (k / 2) / fact(k), conv: 'para todo x' },
    exp: { lab: 'eˣ', f: Math.exp, c: k => 1 / fact(k), conv: 'para todo x' },
    ln: { lab: 'ln(1 + x)', f: x => x > -1 ? Math.log(1 + x) : NaN, c: k => k ? (-1) ** (k + 1) / k : 0, conv: 'solo si −1 < x ≤ 1' },
    geo: { lab: '1/(1 − x)', f: x => 1 / (1 - x), c: () => 1, conv: 'solo si −1 < x < 1' },
    atan: { lab: 'arctan(x)', f: Math.atan, c: k => k % 2 ? (-1) ** ((k - 1) / 2) / k : 0, conv: 'solo si −1 ≤ x ≤ 1' }
  };
  const st = { fn: 'sen', n: 3, x: 1 };
  const poly = (x, n = st.n) => { const F = FN[st.fn]; let s = 0, p = 1; for (let k = 0; k <= n; k++) { s += F.c(k) * p; p *= x; } return s; };
  const polyStr = () => {
    const F = FN[st.fn], terms = [];
    for (let k = 0; k <= st.n; k++) {
      const c = F.c(k); if (!c) continue;
      const xs = k === 0 ? '' : k === 1 ? 'x' : 'x' + sup(k);
      const inv = 1 / Math.abs(c), isInt = Math.abs(inv - Math.round(inv)) < 1e-9;
      let body;
      if (k === 0) body = fmt(Math.abs(c), 4);
      else if (Math.abs(Math.abs(c) - 1) < 1e-12) body = xs;
      else if (isInt) body = `${xs}/${fmt(Math.round(inv), 0)}`;
      else body = `${fmt(Math.abs(c), 5)}${xs}`;
      terms.push([c < 0 ? '−' : '+', body]);
    }
    if (!terms.length) return '0';
    const show = terms.length > 7 ? [...terms.slice(0, 5), ['', '…'], terms[terms.length - 1]] : terms;
    return show.map(([s, b], i) => b === '…' ? ' + …' : i === 0 ? (s === '−' ? '−' : '') + b : ` ${s} ${b}`).join('');
  };
  A.tool({
    id: 'taylor', sec: 'funciones', name: 'Series de Taylor', short: 'Taylor', tag: 'Aproximación', f: 'sen(x) ≈ x − x³/6 + x⁵/120',
    desc: 'Aproximá funciones con polinomios. Subí el grado y mirá cómo el polinomio abraza a la curva.',
    lead: 'Cualquier función "suave" se puede imitar cerca de un punto con un polinomio. Cuanto más alto el grado, más lejos llega la imitación.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="tay-f">Función</label><select class="field" id="tay-f">${Object.entries(FN).map(([k, v]) => `<option value="${k}">${v.lab}</option>`).join('')}</select></div>
        <div><label class="l" for="tay-n">Grado del polinomio: <span id="tay-nv" style="color:var(--fg)">3</span></label><input type="range" id="tay-n" min="0" max="20" value="3"></div>
        <button class="btn primary sm" id="tay-play" style="align-self:flex-start">Animar del grado 0 al 20</button>
        <div><label class="l">Polinomio de Taylor en x = 0</label><div class="formula" id="tay-p"></div></div>
        <div><label class="l" for="tay-x">Evaluar en x = <span id="tay-xv" style="color:var(--fg)">1</span></label><input type="range" id="tay-x" min="-4" max="4" step="0.05" value="1"></div>
        <dl class="stats" id="tay-stats" style="margin:0"></dl>
      </div>
      <div class="stage">
        <canvas id="tay-cv" class="cv-tall" style="background:var(--bg)"></canvas>
        <div class="legend"><span><i style="background:var(--fg)"></i>Función real</span><span><i style="background:var(--amber)"></i>Polinomio de grado n</span></div>
        <div class="explain" id="tay-exp"></div>
      </div>
    </div>`,
    init() {
      const upd = () => {
        $('#tay-nv').textContent = st.n; $('#tay-n').value = st.n; $('#tay-xv').textContent = fmt(st.x, 2);
        $('#tay-p').innerHTML = `<b>P${String(st.n).split('').map(d => SUB[d]).join('')}</b>(x) = ${polyStr()}`;
        const F = FN[st.fn], fx = F.f(st.x), px = poly(st.x);
        $('#tay-stats').innerHTML = A.stats([['f(x)', fmt(fx, 6)], ['Pₙ(x)', fmt(px, 6)], ['Error', fmt(Math.abs(fx - px), 6)]]);
        $('#tay-exp').innerHTML = `<p>La idea: el polinomio copia el valor de la función en 0, después su pendiente, después su curvatura, y así con cada derivada. Para <b>${F.lab}</b> la serie converge <b>${F.conv}</b>${F.conv.startsWith('para') ? ': subiendo el grado podés aproximar tan lejos como quieras' : ': fuera de ese rango, subir el grado no ayuda, el polinomio se dispara'}.</p>`;
        P.draw();
      };
      $('#tay-f').onchange = e => { st.fn = e.target.value; upd(); };
      $('#tay-n').oninput = e => { st.n = +e.target.value; upd(); };
      $('#tay-x').oninput = e => { st.x = +e.target.value; upd(); };
      $('#tay-play').onclick = () => {
        clearInterval(timer); st.n = 0; upd();
        timer = setInterval(() => { if (st.n >= 20 || A.current !== 'taylor') { clearInterval(timer); return; } st.n++; upd(); }, A.reduce ? 60 : 380);
      };
      P = A.plane($('#tay-cv'), {
        span: w => w < 600 ? 9 : 14,
        layers: a => {
          if (FN[st.fn].conv.startsWith('solo')) { a.c.fillStyle = 'rgba(67,200,184,.06)'; a.c.fillRect(a.PX(-1), 0, a.PX(1) - a.PX(-1), a.h); }
          a.plot(FN[st.fn].f, K.fg, 2.4); a.plot(x => poly(x), K.amber, 2);
          a.line(st.x, a.y0, st.x, a.y1, K.faint, 1, [3, 4]);
          const fx = FN[st.fn].f(st.x), px = poly(st.x);
          if (Number.isFinite(fx)) a.dot(st.x, fx, K.fg, 4.5); if (Number.isFinite(px)) a.dot(st.x, px, K.amber, 4.5);
        }
      });
      upd();
    },
    draw: () => P.draw(),
    hide: () => clearInterval(timer)
  });
}
})();
