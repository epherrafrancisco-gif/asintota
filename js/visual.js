/* Asíntota · Matemática visual: fractales, juego de la vida, caos */
(() => {
const { $, $$, K, fmt, fmtF } = A;

/* ================= Fractales ================= */
{
  const HOME = { mandel: { cx: -.6, cy: 0, span: 3.4 }, julia: { cx: 0, cy: 0, span: 3.4 } };
  const SPOTS = [
    ['Valle de los caballitos', -.7436447860, .1318252536, .0035],
    ['Espiral doble', -.7615738, -.0847596, .006],
    ['Mandelbrot en miniatura', -1.7685, .0013, .02],
    ['Antena', -1.99997, 0, .0004]
  ];
  const JC = [['Dendrita', 0, 1], ['Conejo de Douady', -.123, .745], ['Polvo de San Marcos', -.8, .156], ['Espirales', .285, .01]];
  const st = { mode: 'mandel', cx: HOME.mandel.cx, cy: HOME.mandel.cy, span: HOME.mandel.span, it: 250, jc: [-.8, .156] };
  let token = 0, img = null, W = 0, H = 0;
  const pal = (() => {
    const stops = [[13, 13, 18], [25, 70, 80], [67, 200, 184], [242, 169, 59], [250, 235, 205], [120, 60, 30], [13, 13, 18]], N = 512, out = new Uint8Array(N * 3);
    for (let i = 0; i < N; i++) { const u = i / N * (stops.length - 1), k = Math.floor(u), f = u - k; for (let ch = 0; ch < 3; ch++) out[i * 3 + ch] = stops[k][ch] + (stops[k + 1][ch] - stops[k][ch]) * f; }
    return out;
  })();
  A.tool({
    id: 'fractales', sec: 'visual', name: 'Fractales', tag: 'Mandelbrot y Julia', f: 'zₙ₊₁ = zₙ² + c',
    desc: 'Explorá el conjunto de Mandelbrot con zoom casi infinito y descubrí los conjuntos de Julia.',
    lead: 'Una regla de una línea, z → z² + c, repetida una y otra vez. Si el número se escapa al infinito, el punto se pinta según lo rápido que se fue; si no, queda negro. Tocá la imagen para hacer zoom.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Conjunto</label><div class="seg" id="fr-mode"><button data-v="mandel" aria-pressed="true">Mandelbrot</button><button data-v="julia" aria-pressed="false">Julia</button></div></div>
        <div id="fr-spots"><label class="l">Lugares para visitar</label><div class="chips">${SPOTS.map((s, i) => `<button class="chip" data-sp="${i}">${s[0]}</button>`).join('')}</div></div>
        <div id="fr-jcs" hidden><label class="l">Valores de c</label><div class="chips">${JC.map((s, i) => `<button class="chip" data-jc="${i}">${s[0]}</button>`).join('')}</div></div>
        <div><label class="l" for="fr-it">Detalle (iteraciones): <span id="fr-itv" style="color:var(--fg)">250</span></label><input type="range" id="fr-it" min="50" max="2000" step="50" value="250"></div>
        <div class="row"><button class="btn sm" id="fr-out">Alejar</button><button class="btn sm" id="fr-home">Volver al inicio</button><button class="btn sm" id="fr-tojulia">Ver Julia de este punto</button></div>
        <dl class="stats" id="fr-stats" style="margin:0"></dl>
        <p class="note">Tip: si al hacer mucho zoom los bordes se ven borrosos, subí las iteraciones.</p>
      </div>
      <div class="stage">
        <canvas id="fr-cv" class="cv-tall" style="cursor:zoom-in;background:#0d0d12"></canvas>
        <div class="explain" id="fr-exp"></div>
      </div>
    </div>`,
    init() {
      $$('#fr-mode button').forEach(b => b.onclick = () => setMode(b.dataset.v));
      $$('[data-sp]').forEach(b => b.onclick = () => { const s = SPOTS[+b.dataset.sp]; if (st.mode !== 'mandel') setMode('mandel', true); Object.assign(st, { cx: s[1], cy: s[2], span: s[3], it: Math.max(st.it, 600) }); $('#fr-it').value = st.it; $('#fr-itv').textContent = st.it; render(); });
      $$('[data-jc]').forEach(b => b.onclick = () => { const s = JC[+b.dataset.jc]; st.jc = [s[1], s[2]]; Object.assign(st, HOME.julia); render(); });
      $('#fr-it').oninput = e => { st.it = +e.target.value; $('#fr-itv').textContent = st.it; };
      $('#fr-it').onchange = render;
      $('#fr-out').onclick = () => { st.span = Math.min(8, st.span * 3); render(); };
      $('#fr-home').onclick = () => { Object.assign(st, HOME[st.mode]); render(); };
      $('#fr-tojulia').onclick = () => { st.jc = [st.cx, st.cy]; setMode('julia'); };
      const cv = $('#fr-cv'); let down = null;
      cv.addEventListener('pointerdown', e => down = [e.clientX, e.clientY]);
      cv.addEventListener('pointerup', e => {
        if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) { down = null; return; } down = null;
        const r = cv.getBoundingClientRect(), s = st.span / r.width;
        st.cx += (e.clientX - r.left - r.width / 2) * s; st.cy -= (e.clientY - r.top - r.height / 2) * s; st.span /= 3; render();
      });
    },
    draw: () => render(),
    hide: () => token++
  });
  function setMode(m, silent) {
    st.mode = m; $$('#fr-mode button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === m));
    $('#fr-spots').hidden = m !== 'mandel'; $('#fr-jcs').hidden = m !== 'julia'; $('#fr-tojulia').hidden = m !== 'mandel';
    Object.assign(st, HOME[m]); if (!silent) render();
  }
  function info() {
    const zoom = HOME[st.mode].span / st.span;
    $('#fr-stats').innerHTML = A.stats([['Zoom', '×' + (zoom < 1e4 ? fmt(zoom, 1) : zoom.toExponential(2).replace('.', ',').replace('e+', ' × 10^'))], ['Centro', `${fmtF(st.cx, 6)}${st.cy < 0 ? ' − ' : ' + '}${fmtF(Math.abs(st.cy), 6)}i`], ...(st.mode === 'julia' ? [['c', `${fmt(st.jc[0], 4)}${st.jc[1] < 0 ? ' − ' : ' + '}${fmt(Math.abs(st.jc[1]), 4)}i`]] : [])]);
    $('#fr-exp').innerHTML = st.mode === 'mandel'
      ? `<p>Cada píxel es un número complejo c. Arrancamos con z = 0 y repetimos z → z² + c. Si |z| supera 2, se va al infinito seguro. El conjunto de Mandelbrot (lo negro) son los c que <b>nunca</b> se escapan. Su borde tiene detalle infinito: por más zoom que hagas, siempre aparece estructura nueva, incluso copias en miniatura del conjunto entero.</p>`
      : `<p>Acá c queda fijo y cada píxel es el punto de partida z. Hay un conjunto de Julia distinto para cada c. Si c está dentro del Mandelbrot, el Julia es una sola pieza conectada; si está afuera, se rompe en polvo. Por eso el Mandelbrot funciona como un mapa de todos los Julia.</p>`;
  }
  function render() {
    const cv = $('#fr-cv'), r = cv.getBoundingClientRect(); if (r.width < 2) return;
    const rd = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.round(r.width * rd); H = Math.round(r.height * rd);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const c = cv.getContext('2d'); img = c.createImageData(W, H);
    const my = ++token, s = st.span / W, x0 = st.cx - W / 2 * s, y0 = st.cy + H / 2 * s, it = st.it, jul = st.mode === 'julia', [jx, jy] = st.jc, d = img.data;
    info();
    const px = (i, j) => {
      let zx, zy, cx, cy;
      if (jul) { zx = x0 + i * s; zy = y0 - j * s; cx = jx; cy = jy; } else { zx = 0; zy = 0; cx = x0 + i * s; cy = y0 - j * s; }
      if (!jul) { const q = (cx - .25) ** 2 + cy * cy; if (q * (q + (cx - .25)) <= .25 * cy * cy || (cx + 1) ** 2 + cy * cy <= .0625) return -1; }
      let n = 0, x2 = zx * zx, y2 = zy * zy;
      while (x2 + y2 <= 256 && n < it) { zy = 2 * zx * zy + cy; zx = x2 - y2 + cx; x2 = zx * zx; y2 = zy * zy; n++; }
      if (n >= it) return -1;
      return n + 1 - Math.log(Math.log(x2 + y2) / 2 / Math.LN2) / Math.LN2;
    };
    const paint = (k, v) => {
      if (v < 0) { d[k] = 13; d[k + 1] = 13; d[k + 2] = 18; d[k + 3] = 255; return; }
      const t = Math.floor((Math.sqrt(v) * 34) % 512) * 3; d[k] = pal[t]; d[k + 1] = pal[t + 1]; d[k + 2] = pal[t + 2]; d[k + 3] = 255;
    };
    // pasada rápida en bloques de 6 px, después la definitiva
    const B = 6;
    for (let j = 0; j < H; j += B) for (let i = 0; i < W; i += B) {
      const v = px(i, j);
      for (let jj = j; jj < Math.min(H, j + B); jj++) for (let ii = i; ii < Math.min(W, i + B); ii++) paint((jj * W + ii) * 4, v);
    }
    c.putImageData(img, 0, 0);
    let row = 0;
    const work = () => {
      if (my !== token) return;
      const t0 = performance.now();
      while (row < H && performance.now() - t0 < 14) { for (let i = 0; i < W; i++) paint((row * W + i) * 4, px(i, row)); row++; }
      c.putImageData(img, 0, 0);
      if (row < H) requestAnimationFrame(work);
    };
    requestAnimationFrame(work);
  }
}

/* ================= Juego de la vida ================= */
{
  const COLS = 96, ROWS = 60;
  let g = new Uint8Array(COLS * ROWS), gen = 0, playing = true, speed = 12, last = 0, raf = 0;
  const PAT = {
    'Cañón de Gosper': [[24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2], [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3], [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5], [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8]],
    'Planeador': [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
    'Nave liviana': [[1, 0], [4, 0], [0, 1], [0, 2], [4, 2], [0, 3], [1, 3], [2, 3], [3, 3]],
    'Púlsar': (() => { const o = []; [0, 5, 7, 12].forEach(r => [2, 3, 4, 8, 9, 10].forEach(c => { o.push([c, r]); o.push([r, c]); })); return o; })(),
    'R-pentominó': [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]],
    'Bellota': [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]]
  };
  const put = (name, ox, oy) => { const p = PAT[name], mx = Math.max(...p.map(q => q[0])), my = Math.max(...p.map(q => q[1])); ox = ox ?? Math.floor((COLS - mx) / 2); oy = oy ?? Math.floor((ROWS - my) / 2); p.forEach(([x, y]) => g[((oy + y + ROWS) % ROWS) * COLS + (ox + x + COLS) % COLS] = 1); };
  const step = () => {
    const n = new Uint8Array(COLS * ROWS);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) s += g[((y + dy + ROWS) % ROWS) * COLS + (x + dx + COLS) % COLS];
      const a = g[y * COLS + x]; n[y * COLS + x] = s === 3 || (a && s === 2) ? 1 : 0;
    }
    g = n; gen++;
  };
  A.tool({
    id: 'vida', sec: 'visual', name: 'El juego de la vida', short: 'Juego de la vida', tag: 'Autómatas celulares', f: '2 o 3 vecinos: sobrevive',
    desc: 'Cuatro reglas simples y aparecen naves, osciladores y hasta cañones que fabrican planeadores.',
    lead: 'Cada casillero está vivo o muerto. En cada turno: una célula viva con 2 o 3 vecinas sobrevive, con menos muere de soledad y con más, de superpoblación. Una muerta con exactamente 3 vecinas nace. Nada más. Dibujá con el dedo o el mouse.',
    body: `<div class="bench">
      <div class="ctrl">
        <div class="row"><button class="btn primary sm" id="gl-play">Pausar</button><button class="btn sm" id="gl-step">Un paso</button></div>
        <div><label class="l" for="gl-sp">Velocidad: <span id="gl-spv" style="color:var(--fg)">12</span> generaciones por segundo</label><input type="range" id="gl-sp" min="1" max="40" value="12"></div>
        <div><label class="l">Agregar un patrón</label><div class="chips">${Object.keys(PAT).map(k => `<button class="chip" data-gl="${k}">${k}</button>`).join('')}</div></div>
        <div class="row"><button class="btn sm" id="gl-rand">Llenar al azar</button><button class="btn sm" id="gl-clear">Limpiar</button></div>
        <dl class="stats" id="gl-stats" style="margin:0"></dl>
      </div>
      <div class="stage">
        <canvas id="gl-cv" style="width:100%;aspect-ratio:${COLS}/${ROWS};max-width:100%;touch-action:none;cursor:crosshair;background:var(--bg)"></canvas>
        <div class="explain"><p>El juego de la vida, inventado por John Conway en 1970, demuestra que reglas muy simples pueden producir comportamiento muy complejo. Es tan potente que se puede armar una computadora completa adentro del juego. El tablero da la vuelta: lo que sale por un borde entra por el opuesto.</p></div>
      </div>
    </div>`,
    init() {
      put('Cañón de Gosper', 4, 4);
      $('#gl-play').onclick = () => { playing = !playing; $('#gl-play').textContent = playing ? 'Pausar' : 'Reproducir'; if (playing) loop(); };
      $('#gl-step').onclick = () => { step(); draw(); };
      $('#gl-sp').oninput = e => { speed = +e.target.value; $('#gl-spv').textContent = speed; };
      $$('[data-gl]').forEach(b => b.onclick = () => { put(b.dataset.gl); draw(); });
      $('#gl-rand').onclick = () => { g = g.map(() => Math.random() < .22 ? 1 : 0); gen = 0; draw(); };
      $('#gl-clear').onclick = () => { g = new Uint8Array(COLS * ROWS); gen = 0; draw(); };
      const cv = $('#gl-cv'); let paint = null;
      const cell = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * COLS), Math.floor((e.clientY - r.top) / r.height * ROWS)]; };
      cv.addEventListener('pointerdown', e => { const [x, y] = cell(e); if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return; paint = g[y * COLS + x] ? 0 : 1; g[y * COLS + x] = paint; cv.setPointerCapture(e.pointerId); draw(); });
      cv.addEventListener('pointermove', e => { if (paint === null) return; const [x, y] = cell(e); if (x >= 0 && y >= 0 && x < COLS && y < ROWS) { g[y * COLS + x] = paint; draw(); } });
      cv.addEventListener('pointerup', () => paint = null);
    },
    draw: () => { draw(); if (playing) loop(); },
    hide: () => cancelAnimationFrame(raf)
  });
  function loop() {
    cancelAnimationFrame(raf);
    const tick = now => {
      if (A.current !== 'vida' || !playing) return;
      if (now - last > 1000 / speed) { step(); draw(); last = now; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function draw() {
    const { c, w, h } = A.canv($('#gl-cv')); if (w < 2) return;
    const cw = w / COLS, ch = h / ROWS;
    c.strokeStyle = 'rgba(42,42,55,.6)'; c.lineWidth = 1; c.beginPath();
    for (let x = 1; x < COLS; x++) { c.moveTo(Math.round(x * cw) + .5, 0); c.lineTo(Math.round(x * cw) + .5, h); }
    for (let y = 1; y < ROWS; y++) { c.moveTo(0, Math.round(y * ch) + .5); c.lineTo(w, Math.round(y * ch) + .5); }
    c.stroke();
    c.fillStyle = K.amber; let pop = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (g[y * COLS + x]) { pop++; c.fillRect(x * cw + 1, y * ch + 1, cw - 1.5, ch - 1.5); }
    $('#gl-stats').innerHTML = A.stats([['Generación', fmt(gen, 0)], ['Población', fmt(pop, 0)]]);
  }
}

/* ================= Caos: mapa logístico ================= */
{
  const st = { r: 3.7, x0: .2, cmp: true };
  let bif = null, bifKey = '', BF = null;
  const f = (x, r = st.r) => r * x * (1 - x);
  const period = () => {
    let x = st.x0; for (let i = 0; i < 3000; i++) x = f(x);
    const seq = []; for (let i = 0; i < 260; i++) { seq.push(x); x = f(x); }
    for (let p = 1; p <= 64; p++) { let ok = true; for (let i = 0; i < 128 && ok; i++) if (Math.abs(seq[i + p] - seq[i]) > 1e-6) ok = false; if (ok) return p; }
    return 0;
  };
  A.tool({
    id: 'caos', sec: 'visual', name: 'Caos y el efecto mariposa', short: 'Caos', tag: 'Sistemas dinámicos', f: 'xₙ₊₁ = r·xₙ(1 − xₙ)',
    desc: 'La ecuación más simple que produce caos. Mové r y mirá cómo el orden se rompe en mil pedazos.',
    lead: 'Un modelo de población: x es la fracción de la capacidad ocupada y r, la tasa de crecimiento. Con r bajo la población se estabiliza; si subís r, empieza a oscilar, después duplica sus oscilaciones una y otra vez, y finalmente se vuelve impredecible.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="lo-r">Tasa r = <span id="lo-rv" style="color:var(--fg)">3,7</span></label><input type="range" id="lo-r" min="2.5" max="4" step="0.001" value="3.7"></div>
        <div><label class="l" for="lo-x">Valor inicial x₀ = <span id="lo-xv" style="color:var(--fg)">0,2</span></label><input type="range" id="lo-x" min="0.01" max="0.99" step="0.01" value="0.2"></div>
        <label class="check"><input type="checkbox" id="lo-cmp" checked> Comparar con x₀ + 0,000001</label>
        <div id="lo-pill"></div>
        <div><label class="l">Telaraña: cada paso rebota entre la curva y la diagonal</label><canvas id="lo-web" style="width:100%;aspect-ratio:1;max-width:340px"></canvas></div>
      </div>
      <div class="stage">
        <h3>Evolución en el tiempo</h3>
        <canvas id="lo-ts" style="height:190px"></canvas>
        <div class="legend"><span><i style="background:var(--amber)"></i>x₀</span><span><i style="background:var(--rose)"></i>x₀ + 0,000001</span></div>
        <h3>Diagrama de bifurcación <span class="note">· tocá para elegir r</span></h3>
        <canvas id="lo-bif" style="height:300px;cursor:pointer"></canvas>
        <div class="explain" id="lo-exp"></div>
      </div>
    </div>`,
    init() {
      $('#lo-r').oninput = e => { st.r = +e.target.value; upd(); };
      $('#lo-x').oninput = e => { st.x0 = +e.target.value; upd(); };
      $('#lo-cmp').onchange = e => { st.cmp = e.target.checked; upd(); };
      $('#lo-bif').addEventListener('pointerdown', e => { if (!BF) return; const r = $('#lo-bif').getBoundingClientRect(), x = e.clientX - r.left; st.r = A.clamp(2.5 + (x - BF.L) / BF.pw * 1.5, 2.5, 4); $('#lo-r').value = st.r; upd(); });
      upd();
    },
    draw: () => { web(); ts(); drawBif(); }
  });
  function upd() {
    $('#lo-rv').textContent = fmtF(st.r, 3); $('#lo-xv').textContent = fmt(st.x0, 2);
    const p = period();
    $('#lo-pill').innerHTML = `<span class="pill ${p ? 'ok' : 'bad'}">${p === 1 ? 'Se estabiliza' : p ? `Ciclo de ${p} valores` : 'Caos'}</span>`;
    $('#lo-exp').innerHTML = p === 1 ? `<p>Con r = ${fmtF(st.r, 3)} la población se estabiliza en <b>x* = 1 − 1/r = ${fmt(1 - 1 / st.r, 4)}</b>, arranques donde arranques.</p>`
      : p ? `<p>La población no se queda quieta: repite un ciclo de <b>${p} valores</b>. Subiendo r los ciclos se duplican (2, 4, 8, 16…) cada vez más rápido, hasta que cerca de r ≈ 3,5699 empieza el caos. ${p === 3 ? 'Este ciclo de 3 es famoso: un teorema dice que si existe un ciclo de 3, existen ciclos de todos los largos.' : ''}</p>`
      : `<p><b>Caos:</b> la secuencia nunca se repite y una diferencia de una millonésima en el valor inicial termina dando resultados completamente distintos (mirá cómo se separan las dos líneas). Es el famoso <b>efecto mariposa</b>: la regla es exacta y determinista, pero predecirla a largo plazo es imposible en la práctica.</p>`;
    web(); ts(); drawBif();
  }
  function web() {
    const { c, w, h } = A.canv($('#lo-web')); if (w < 2) return;
    const P = 8, S = Math.min(w, h) - 2 * P, X = x => P + x * S, Y = y => P + (1 - y) * S;
    c.strokeStyle = K.line; c.strokeRect(P + .5, P + .5, S, S);
    c.strokeStyle = K.faint; c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(1), Y(1)); c.stroke();
    c.strokeStyle = K.fg; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 200; i++) { const x = i / 200; i ? c.lineTo(X(x), Y(f(x))) : c.moveTo(X(x), Y(f(x))); } c.stroke();
    let x = st.x0; c.lineWidth = 1.1; c.beginPath(); c.moveTo(X(x), Y(0));
    for (let i = 0; i < 80; i++) { const y = f(x); c.lineTo(X(x), Y(y)); c.lineTo(X(y), Y(y)); x = y; }
    c.strokeStyle = 'rgba(242,169,59,.7)'; c.stroke();
  }
  function ts() {
    const { c, w, h } = A.canv($('#lo-ts')); if (w < 2) return;
    const N = 80, F = A.frame(c, w, h, [0, N], [0, 1], { ystep: .5, xt: 8 });
    const series = (x0, col) => { let x = x0; c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); for (let n = 0; n <= N; n++) { n ? c.lineTo(F.X(n), F.Y(x)) : c.moveTo(F.X(n), F.Y(x)); x = f(x); } c.stroke(); };
    if (st.cmp) series(st.x0 + 1e-6, K.rose);
    series(st.x0, K.amber);
  }
  function drawBif() {
    const cv = $('#lo-bif'), { c, w, h, d } = A.canv(cv); if (w < 2) return;
    BF = A.frame(c, w, h, [2.5, 4], [0, 1], { ystep: .5, xticks: [2.5, 3, 3.5, 4] });
    const key = w + 'x' + h + 'x' + d;
    if (key !== bifKey) {
      const off = document.createElement('canvas'); off.width = Math.round(BF.pw * d); off.height = Math.round(BF.ph * d);
      const oc = off.getContext('2d'), img = oc.createImageData(off.width, off.height), D = img.data;
      for (let i = 0; i < off.width; i++) {
        const r = 2.5 + i / off.width * 1.5; let x = .5;
        for (let k = 0; k < 400; k++) x = r * x * (1 - x);
        for (let k = 0; k < 220; k++) { x = r * x * (1 - x); const j = Math.round((1 - x) * (off.height - 1)), p = (j * off.width + i) * 4; D[p] = 236; D[p + 1] = 235; D[p + 2] = 243; D[p + 3] = Math.min(255, D[p + 3] + 70); }
      }
      oc.putImageData(img, 0, 0); bif = off; bifKey = key;
    }
    c.drawImage(bif, BF.L, BF.T, BF.pw, BF.ph);
    const xr = BF.X(st.r); c.strokeStyle = K.amber; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xr, BF.T); c.lineTo(xr, BF.T + BF.ph); c.stroke();
    c.fillStyle = K.amber; c.font = '11px ' + A.MONO; c.textAlign = xr > w - 80 ? 'right' : 'left'; c.textBaseline = 'top'; c.fillText('r = ' + fmtF(st.r, 3), xr + (xr > w - 80 ? -5 : 5), BF.T + 2);
  }
}
})();
