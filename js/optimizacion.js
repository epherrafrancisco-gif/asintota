/* Asíntota · Optimización: descenso de gradiente y programación lineal */
(() => {
const { $, $$, K, fmt, fmtF } = A;

/* ================= Descenso de gradiente ================= */
{
  const FN = {
    cuenco: { lab: 'Cuenco alargado', f: (x, y) => x * x + 4 * y * y, xr: [-4, 4], yr: [-3, 3], start: [-3.5, 2.4], lr: .05, mins: [[0, 0]] },
    rosen: { lab: 'Valle de Rosenbrock (banana)', f: (x, y) => (1 - x) ** 2 + 10 * (y - x * x) ** 2, xr: [-2, 2], yr: [-1, 3], start: [-1.6, 2.4], lr: .02, mins: [[1, 1]] },
    himmel: { lab: 'Himmelblau (4 mínimos)', f: (x, y) => (x * x + y - 11) ** 2 + (x + y * y - 7) ** 2, xr: [-5, 5], yr: [-5, 5], start: [.3, -4.6], lr: .01, mins: [[3, 2], [-2.805, 3.131], [-3.779, -3.283], [3.584, -1.848]] },
    ondas: { lab: 'Ondas con muchos pozos', f: (x, y) => Math.sin(x) * Math.cos(y) + .05 * (x * x + y * y), xr: [-7, 7], yr: [-5, 5], start: [4.2, 3.2], lr: .3, mins: [] }
  };
  const st = { fn: 'cuenco', lr: .05, mom: 0, steps: 150, start: null, path: [], shown: 0, status: '' };
  let heat = null, heatKey = '', raf = 0, view = null;
  const grad = (f, x, y) => { const e = 1e-5; return [(f(x + e, y) - f(x - e, y)) / (2 * e), (f(x, y + e) - f(x, y - e)) / (2 * e)]; };
  A.tool({
    id: 'gradiente', sec: 'optimizacion', name: 'Descenso de gradiente', short: 'Gradiente', tag: 'Optimización numérica', f: 'xₙ₊₁ = xₙ − η·∇f(xₙ)',
    desc: 'El algoritmo que entrena a las redes neuronales. Elegí un terreno, tocá un punto de partida y mirá cómo baja.',
    lead: 'Imaginá que estás en una montaña con niebla y querés llegar al punto más bajo: das pasos en la dirección donde más baja el terreno. Eso es el descenso de gradiente. Tocá el mapa para elegir dónde arrancar.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="gd-f">Terreno</label><select class="field" id="gd-f">${Object.entries(FN).map(([k, v]) => `<option value="${k}">${v.lab}</option>`).join('')}</select></div>
        <div><label class="l" for="gd-lr">Tamaño de paso η = <span id="gd-lrv" style="color:var(--fg)">0,05</span></label><input type="range" id="gd-lr" min="-3" max="0" step="0.01" value="-1.3"></div>
        <div><label class="l" for="gd-mo">Inercia (momentum) = <span id="gd-mov" style="color:var(--fg)">0</span></label><input type="range" id="gd-mo" min="0" max="0.95" step="0.05" value="0"></div>
        <div><label class="l" for="gd-st">Pasos: <span id="gd-stv" style="color:var(--fg)">150</span></label><input type="range" id="gd-st" min="10" max="600" step="10" value="150"></div>
        <button class="btn primary sm" id="gd-run" style="align-self:flex-start">Correr de nuevo</button>
        <dl class="stats" id="gd-stats" style="margin:0"></dl>
      </div>
      <div class="stage">
        <canvas id="gd-cv" class="cv-tall" style="cursor:crosshair;touch-action:none"></canvas>
        <div class="legend"><span><i style="background:var(--amber)"></i>Camino del algoritmo</span><span><i style="background:var(--teal)"></i>Mínimos</span><span>Más oscuro = más bajo</span></div>
        <div class="explain" id="gd-exp"></div>
      </div>
    </div>`,
    init() {
      $('#gd-f').onchange = e => { st.fn = e.target.value; st.start = null; setLr(FN[st.fn].lr); run(); };
      $('#gd-lr').oninput = e => { st.lr = Math.pow(10, +e.target.value); $('#gd-lrv').textContent = fmt(st.lr, 4); run(); };
      $('#gd-mo').oninput = e => { st.mom = +e.target.value; $('#gd-mov').textContent = fmt(st.mom, 2); run(); };
      $('#gd-st').oninput = e => { st.steps = +e.target.value; $('#gd-stv').textContent = st.steps; run(true); };
      $('#gd-run').onclick = () => run();
      $('#gd-cv').addEventListener('pointerdown', e => {
        if (!view) return; const r = $('#gd-cv').getBoundingClientRect();
        st.start = [view.WX(e.clientX - r.left), view.WY(e.clientY - r.top)]; run();
      });
      setLr(FN[st.fn].lr); run();
    },
    draw: () => draw(),
    hide: () => { cancelAnimationFrame(raf); if (st.path.length) { st.shown = st.path.length; info(); } }
  });
  function setLr(v) { st.lr = v; $('#gd-lr').value = Math.log10(v); $('#gd-lrv').textContent = fmt(v, 4); }
  function run(instant) {
    const F = FN[st.fn], f = F.f; let [x, y] = st.start || F.start, vx = 0, vy = 0;
    st.path = [[x, y]]; st.status = 'run';
    for (let i = 0; i < st.steps; i++) {
      const [gx, gy] = grad(f, x, y);
      vx = st.mom * vx - st.lr * gx; vy = st.mom * vy - st.lr * gy; x += vx; y += vy;
      if (!Number.isFinite(x + y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) { st.status = 'div'; break; }
      st.path.push([x, y]);
      if (Math.hypot(gx, gy) < 1e-5 && Math.hypot(vx, vy) < 1e-7) { st.status = 'ok'; break; }
    }
    if (st.status === 'run') { const [px, py] = st.path[st.path.length - 1], g = grad(f, px, py); st.status = Math.hypot(...g) < 1e-3 ? 'ok' : 'slow'; }
    cancelAnimationFrame(raf);
    if (instant || A.reduce) { st.shown = st.path.length; draw(); info(); return; }
    st.shown = 1; const t0 = performance.now(), dur = Math.min(1600, 300 + st.path.length * 8);
    const step = now => { st.shown = Math.max(1, Math.ceil(st.path.length * Math.min(1, (now - t0) / dur))); draw(); if (st.shown < st.path.length) raf = requestAnimationFrame(step); else info(); };
    raf = requestAnimationFrame(step); info();
  }
  function info() {
    const F = FN[st.fn], p = st.path[Math.min(st.shown, st.path.length) - 1], g = grad(F.f, p[0], p[1]);
    const lab = { ok: '<span class="pill ok">Llegó a un mínimo</span>', slow: '<span class="pill warn">Todavía bajando</span>', div: '<span class="pill bad">Se fue al infinito</span>', run: '' }[st.status];
    $('#gd-stats').innerHTML = A.stats([['Pasos', fmt(st.path.length - 1, 0)], ['Posición', `(${fmt(p[0], 3)}; ${fmt(p[1], 3)})`], ['Altura f', fmt(F.f(p[0], p[1]), 4)], ['Pendiente |∇f|', fmt(Math.hypot(...g), 4)]]);
    const tip = st.status === 'div' ? 'El paso es demasiado grande: el algoritmo se pasa del pozo, rebota cada vez más lejos y explota. Bajá η.'
      : st.status === 'slow' ? 'Con este tamaño de paso avanza lento. Subí η o agregá inercia para que llegue en menos pasos (pero sin pasarte).'
      : 'Convergió. Probá arrancar desde otro lugar: en terrenos con varios pozos, el punto de partida decide a qué mínimo llegás.';
    $('#gd-exp').innerHTML = `<p style="margin-bottom:8px">${lab}</p><p>En cada paso calcula hacia dónde sube más el terreno (el gradiente ∇f) y da un paso de tamaño η en la dirección contraria. La <b>inercia</b> hace que acumule velocidad, como una pelota que rueda. ${tip}</p>`;
  }
  function draw() {
    const cv = $('#gd-cv'), { c, w, h, d } = A.canv(cv), F = FN[st.fn];
    if (w < 2) return;
    // vista con la misma escala en x e y
    const sx = (F.xr[1] - F.xr[0]) / w, sy = (F.yr[1] - F.yr[0]) / h, s = Math.max(sx, sy);
    const cx = (F.xr[0] + F.xr[1]) / 2, cy = (F.yr[0] + F.yr[1]) / 2;
    view = { s, WX: px => cx + (px - w / 2) * s, WY: py => cy - (py - h / 2) * s, PX: x => w / 2 + (x - cx) / s, PY: y => h / 2 - (y - cy) / s };
    const key = st.fn + w + 'x' + h + 'x' + d;
    if (key !== heatKey) {
      const step = 2, W = Math.ceil(w / step), H = Math.ceil(h / step), vals = new Float32Array(W * H);
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const v = F.f(view.WX(i * step), view.WY(j * step)); vals[j * W + i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
      const off = document.createElement('canvas'); off.width = W; off.height = H; const oc = off.getContext('2d'), img = oc.createImageData(W, H);
      const lg = v => Math.log(1 + (v - lo)), LH = lg(hi);
      const stops = [[11, 16, 22], [20, 62, 68], [52, 118, 120], [128, 124, 150]];
      for (let k = 0; k < W * H; k++) {
        let t = lg(vals[k]) / LH; const band = Math.floor(t * 16); t = band / 16 + (band % 2 ? .015 : 0);
        const u = A.clamp(t, 0, 1) * (stops.length - 1), i0 = Math.min(stops.length - 2, Math.floor(u)), fr = u - i0;
        for (let ch = 0; ch < 3; ch++) img.data[k * 4 + ch] = stops[i0][ch] + (stops[i0 + 1][ch] - stops[i0][ch]) * fr;
        img.data[k * 4 + 3] = 255;
      }
      oc.putImageData(img, 0, 0); heat = off; heatKey = key;
    }
    c.imageSmoothingEnabled = true; c.drawImage(heat, 0, 0, w, h);
    F.mins.forEach(([x, y]) => { c.strokeStyle = K.teal; c.lineWidth = 2; c.beginPath(); c.arc(view.PX(x), view.PY(y), 7, 0, 7); c.stroke(); });
    const pts = st.path.slice(0, st.shown);
    c.strokeStyle = K.amber; c.lineWidth = 2; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(view.PX(x), view.PY(y)) : c.moveTo(view.PX(x), view.PY(y))); c.stroke();
    c.fillStyle = K.amber; if (pts.length < 200) pts.forEach(([x, y]) => { c.beginPath(); c.arc(view.PX(x), view.PY(y), 2.2, 0, 7); c.fill(); });
    const [x0, y0] = st.path[0]; c.fillStyle = K.fg; c.beginPath(); c.arc(view.PX(x0), view.PY(y0), 6, 0, 7); c.fill();
    const [xe, ye] = pts[pts.length - 1]; c.fillStyle = K.amber; c.beginPath(); c.arc(view.PX(xe), view.PY(ye), 7, 0, 7); c.fill(); c.strokeStyle = K.bg; c.lineWidth = 2; c.stroke();
    c.font = '11px ' + A.MONO; c.fillStyle = 'rgba(236,235,243,.7)'; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('Tocá para elegir el punto de partida', 10, 10);
  }
}

/* ================= Programación lineal ================= */
{
  const st = { type: 'max', c: [3, 5], cons: [[1, 0, '<=', 4], [0, 2, '<=', 12], [3, 2, '<=', 18]] };
  let sol = null;
  A.tool({
    id: 'lineal', sec: 'optimizacion', name: 'Programación lineal', short: 'Programación lineal', tag: 'Optimización con restricciones', f: 'máx 3x + 5y',
    desc: 'Maximizá o minimizá con restricciones. Mirá la región factible y por qué el óptimo siempre está en una esquina.',
    lead: 'Querés lo mejor posible (máxima ganancia, mínimo costo) pero con límites: horas, materiales, plata. Si todo es lineal, la respuesta está siempre en una esquina de la región permitida.',
    body: `<div class="bench">
      <div class="ctrl">
        <p class="note">Ejemplo: una fábrica hace puertas (x) y ventanas (y). Cada puerta deja $3 y cada ventana $5. Tres talleres limitan cuánto se puede producir.</p>
        <div><label class="l">Objetivo</label><div class="row" style="flex-wrap:nowrap"><select class="field" id="pl-t" style="width:auto"><option value="max">Maximizar</option><option value="min">Minimizar</option></select><input class="field" id="pl-c1" value="3" style="width:64px;text-align:center"><span class="mono muted" style="white-space:nowrap">x +</span><input class="field" id="pl-c2" value="5" style="width:64px;text-align:center"><span class="mono muted">y</span></div></div>
        <div><label class="l">Restricciones</label><div id="pl-cons" style="display:flex;flex-direction:column;gap:6px"></div><p class="note" style="margin-top:6px">Además, x ≥ 0 e y ≥ 0.</p></div>
        <button class="btn sm" id="pl-add" style="align-self:flex-start">Agregar restricción</button>
        <p class="err" id="pl-err"></p>
      </div>
      <div class="stage">
        <div id="pl-res"></div>
        <canvas id="pl-cv" class="cv-tall"></canvas>
        <div class="tbl-wrap"><table class="tbl" id="pl-tbl"></table></div>
        <div class="explain"><p><b>Por qué en una esquina:</b> las rectas donde el objetivo vale lo mismo (la línea punteada) son todas paralelas. Si la vas corriendo para mejorar el valor, lo último que toca de la región permitida es siempre un vértice. Por eso alcanza con probar las esquinas.</p></div>
      </div>
    </div>`,
    init() {
      $('#pl-t').onchange = e => { st.type = e.target.value; solve(); };
      $('#pl-c1').oninput = e => { st.c[0] = A.num(e.target.value); solve(); };
      $('#pl-c2').oninput = e => { st.c[1] = A.num(e.target.value); solve(); };
      $('#pl-add').onclick = () => { if (st.cons.length < 6) { st.cons.push([1, 1, '<=', 8]); rows(); } };
      rows();
    },
    draw
  });
  function rows() {
    $('#pl-cons').innerHTML = st.cons.map((r, i) => `<div class="row" style="flex-wrap:nowrap;gap:6px">
      <input class="field" data-i="${i}" data-k="0" value="${r[0]}" style="width:56px;text-align:center"><span class="mono muted" style="white-space:nowrap">x +</span>
      <input class="field" data-i="${i}" data-k="1" value="${r[1]}" style="width:56px;text-align:center"><span class="mono muted">y</span>
      <select class="field" data-i="${i}" data-k="2" style="width:58px;padding-inline:6px"><option value="<=" ${r[2] === '<=' ? 'selected' : ''}>≤</option><option value=">=" ${r[2] === '>=' ? 'selected' : ''}>≥</option></select>
      <input class="field" data-i="${i}" data-k="3" value="${r[3]}" style="width:64px;text-align:center">
      <button class="btn sm" data-del="${i}" aria-label="Borrar restricción ${i + 1}" style="padding:6px 9px">×</button></div>`).join('');
    $$('#pl-cons [data-k]').forEach(el => el.oninput = el.onchange = () => { const i = +el.dataset.i, k = +el.dataset.k; st.cons[i][k] = k === 2 ? el.value : A.num(el.value); solve(); });
    $$('#pl-cons [data-del]').forEach(b => b.onclick = () => { st.cons.splice(+b.dataset.del, 1); rows(); });
    solve();
  }
  function solve() {
    const bad = !st.c.every(Number.isFinite) || st.cons.some(r => ![r[0], r[1], r[3]].every(Number.isFinite));
    $('#pl-err').textContent = bad ? 'Hay algún casillero vacío o que no es un número.' : '';
    if (bad) { sol = null; draw(); return; }
    const BIG = 1e4;
    const L = [...st.cons.map(([a, b, , c]) => [a, b, c]), [1, 0, 0], [0, 1, 0], [1, 0, BIG], [0, 1, BIG]];
    const ok = ([x, y]) => x >= -1e-7 && y >= -1e-7 && x <= BIG + 1e-6 && y <= BIG + 1e-6 && st.cons.every(([a, b, op, c]) => op === '<=' ? a * x + b * y <= c + 1e-7 : a * x + b * y >= c - 1e-7);
    let V = [];
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const [a1, b1, c1] = L[i], [a2, b2, c2] = L[j], det = a1 * b2 - a2 * b1; if (Math.abs(det) < 1e-12) continue;
      const p = [(c1 * b2 - c2 * b1) / det, (a1 * c2 - a2 * c1) / det];
      if (ok(p) && !V.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-7)) V.push(p.map(v => Math.abs(v) < 1e-10 ? 0 : v));
    }
    if (!V.length) { sol = { empty: true }; render(); return; }
    const cx = V.reduce((s, p) => s + p[0], 0) / V.length, cy = V.reduce((s, p) => s + p[1], 0) / V.length;
    V.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
    const z = p => st.c[0] * p[0] + st.c[1] * p[1], sg = st.type === 'max' ? 1 : -1;
    let best = V[0]; V.forEach(p => { if (sg * z(p) > sg * z(best) + 1e-9) best = p; });
    const ties = V.filter(p => Math.abs(z(p) - z(best)) < 1e-9);
    const unb = best[0] > BIG - 1 || best[1] > BIG - 1;
    sol = { V, best, zb: z(best), ties, unb, z, real: V.filter(p => p[0] < BIG - 1 && p[1] < BIG - 1) };
    render();
  }
  function render() {
    if (!sol) { $('#pl-res').innerHTML = ''; $('#pl-tbl').innerHTML = ''; draw(); return; }
    if (sol.empty) { $('#pl-res').innerHTML = '<span class="pill bad">Sin solución factible</span><p class="note" style="margin-top:8px">Las restricciones se contradicen: no hay ningún punto que las cumpla a todas.</p>'; $('#pl-tbl').innerHTML = ''; draw(); return; }
    const { best, zb, ties, unb, z, real } = sol;
    $('#pl-res').innerHTML = unb ? `<span class="pill warn">Problema no acotado</span><p class="note" style="margin-top:8px">La región permitida es infinita en la dirección que mejora el objetivo: se puede ${st.type === 'max' ? 'ganar' : 'bajar'} sin límite. Falta alguna restricción.</p>`
      : `<span class="pill ok">Óptimo encontrado</span><div class="big sm" style="margin-top:10px">x = ${fmt(best[0], 3)} &nbsp; y = ${fmt(best[1], 3)}</div><p class="note">Valor ${st.type === 'max' ? 'máximo' : 'mínimo'} del objetivo: <b style="color:var(--amber)">${fmt(zb, 3)}</b>${ties.length > 1 ? '. Ojo: hay varios vértices empatados, así que todo el lado que los une es óptimo.' : '.'}</p>`;
    $('#pl-tbl').innerHTML = `<tr><th>Vértice</th><th>x</th><th>y</th><th>Objetivo</th></tr>` + real.map((p, i) => `<tr class="${!unb && Math.abs(z(p) - zb) < 1e-9 ? 'best' : ''}"><td>${String.fromCharCode(65 + i)}</td><td>${fmt(p[0], 3)}</td><td>${fmt(p[1], 3)}</td><td>${fmt(z(p), 3)}</td></tr>`).join('');
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#pl-cv'));
    if (!sol || sol.empty || w < 2) return;
    const xs = [...sol.real.map(p => p[0]), ...st.cons.map(([a, , , cc]) => a ? cc / a : 0)].filter(v => Number.isFinite(v) && v > 0);
    const ys = [...sol.real.map(p => p[1]), ...st.cons.map(([, b, , cc]) => b ? cc / b : 0)].filter(v => Number.isFinite(v) && v > 0);
    const X = Math.max(1, ...xs) * 1.2, Y = Math.max(1, ...ys) * 1.2;
    const F = A.frame(c, w, h, [0, X], [0, Y], { yt: 5 });
    c.save(); c.beginPath(); c.rect(F.L, F.T, F.pw, F.ph); c.clip();
    c.fillStyle = 'rgba(67,200,184,.18)'; c.strokeStyle = K.teal; c.lineWidth = 2;
    c.beginPath(); sol.V.forEach(([x, y], i) => { const px = F.X(Math.min(x, X * 3)), py = F.Y(Math.min(y, Y * 3)); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.closePath(); c.fill(); c.stroke();
    st.cons.forEach(([a, b, , cc], i) => {
      c.strokeStyle = K.muted; c.lineWidth = 1.2; c.setLineDash([2, 3]); c.beginPath();
      if (Math.abs(b) > 1e-12) { c.moveTo(F.X(0), F.Y(cc / b)); c.lineTo(F.X(X), F.Y((cc - a * X) / b)); } else if (Math.abs(a) > 1e-12) { c.moveTo(F.X(cc / a), F.Y(0)); c.lineTo(F.X(cc / a), F.Y(Y)); }
      c.stroke(); c.setLineDash([]);
      let lx, ly; if (Math.abs(b) > 1e-12) { lx = X * .04 + i * X * .07; ly = (cc - a * lx) / b; } else { lx = cc / a; ly = Y * .92; }
      if (ly > 0 && ly < Y) { c.fillStyle = K.muted; c.font = '11px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillText('R' + (i + 1), F.X(lx) + 4, F.Y(ly) - 3); }
    });
    if (!sol.unb && (st.c[0] || st.c[1])) {
      const [c1, c2] = st.c, zb = sol.zb; c.strokeStyle = K.amber; c.lineWidth = 1.6; c.setLineDash([7, 5]); c.beginPath();
      if (Math.abs(c2) > 1e-12) { c.moveTo(F.X(0), F.Y(zb / c2)); c.lineTo(F.X(X), F.Y((zb - c1 * X) / c2)); } else { c.moveTo(F.X(zb / c1), F.Y(0)); c.lineTo(F.X(zb / c1), F.Y(Y)); }
      c.stroke(); c.setLineDash([]);
    }
    c.restore();
    sol.real.forEach((p, i) => {
      const best = !sol.unb && Math.abs(sol.z(p) - sol.zb) < 1e-9;
      c.fillStyle = best ? K.amber : K.fg; c.beginPath(); c.arc(F.X(p[0]), F.Y(p[1]), best ? 7 : 4.5, 0, 7); c.fill();
      c.font = '12px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'bottom'; c.fillText(String.fromCharCode(65 + i), F.X(p[0]) + 8, F.Y(p[1]) - 4);
    });
  }
}
})();
