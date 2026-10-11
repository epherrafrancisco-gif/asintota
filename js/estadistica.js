/* Asíntota · Estadística: calculadora de datos, distribuciones, intervalos de confianza, tests de hipótesis, regresión */
(() => {
const { $, $$, K, fmt, fmtF, pct, S } = A;
const segHTML = (id, opts, cur) => `<div class="seg" id="${id}">${opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join('')}</div>`;
const segBind = (id, cb) => $$(`#${id} button`).forEach(b => b.onclick = () => { $$(`#${id} button`).forEach(x => x.setAttribute('aria-pressed', x === b)); cb(b.dataset.v); });

/* ================= Calculadora de datos ================= */
{
  const SAMPLES = {
    notas: '7 8,5 6 9 4,5 7,5 8 5 6,5 10 7 3 8 6 7,5 9,5 5,5 6 8 7 4 6,5 8,5 7 9 2 7,5 6 8 5',
    viaje: '22 35 28 41 19 30 26 33 95 24 38 29 31 27 45 23 36 32 25 40 34 28 52 30 21',
    dado: () => Array.from({ length: 60 }, () => 1 + Math.floor(Math.random() * 6)).join(' ')
  };
  let dec = 'coma', last = null;
  const q = (a, p) => { const i = (a.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
  A.tool({
    id: 'estadistica', sec: 'estadistica', name: 'Calculadora de datos', short: 'Datos', tag: 'Estadística descriptiva', f: 's = √(Σ(xᵢ − x̄)² / (n − 1))',
    desc: 'Pegá tus números y obtenés media, mediana, desvío, cuartiles, histograma y boxplot.',
    lead: 'Pegá una lista de números (de un Excel, de un parcial, de donde sea) y te devuelve el resumen completo, con gráficos y una lectura en criollo.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="s-data">Tus datos</label><textarea id="s-data" class="field" spellcheck="false"></textarea><p class="err" id="s-err"></p></div>
        <div><label class="l">Separador decimal</label>${segHTML('s-dec', [['coma', 'Coma (7,5)'], ['punto', 'Punto (7.5)']], 'coma')}<p class="note" style="margin-top:8px">Separá los valores con espacios, saltos de línea o punto y coma.</p></div>
        <div><label class="l">Cargar ejemplo</label><div class="chips"><button class="chip" data-s="notas">Notas de un parcial</button><button class="chip" data-s="viaje">Minutos de viaje</button><button class="chip" data-s="dado">60 tiradas de dado</button></div></div>
      </div>
      <div class="stage">
        <dl class="stats" id="s-stats" style="margin:0"></dl>
        <canvas id="s-cv" style="height:330px"></canvas>
        <div class="summary" id="s-sum"></div>
      </div>
    </div>`,
    init() {
      const ta = $('#s-data'); ta.value = SAMPLES.notas;
      segBind('s-dec', v => { dec = v; run(); });
      $$('[data-s]').forEach(b => b.onclick = () => {
        const s = SAMPLES[b.dataset.s]; ta.value = typeof s === 'function' ? s() : s; dec = 'coma';
        $$('#s-dec button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === 'coma')); run();
      });
      ta.addEventListener('input', run);
      run();
    },
    draw
  });
  function parse(s) {
    const toks = s.trim().split(dec === 'coma' ? /[\s;]+/ : /[\s;,]+/).filter(Boolean), out = [], bad = [];
    toks.forEach(t => { const n = Number(dec === 'coma' ? t.replace(/\./g, '').replace(',', '.') : t); Number.isFinite(n) ? out.push(n) : bad.push(t); });
    return { out, bad };
  }
  function run() {
    const { out, bad } = parse($('#s-data').value);
    $('#s-err').textContent = bad.length ? `Ignoré ${bad.length} valor${bad.length > 1 ? 'es' : ''} que no son números: ${bad.slice(0, 4).join(', ')}${bad.length > 4 ? '…' : ''}` : '';
    if (out.length < 2) { $('#s-stats').innerHTML = ''; $('#s-sum').innerHTML = '<p>Necesito al menos 2 números para calcular algo.</p>'; last = null; draw(); return; }
    const a = [...out].sort((x, y) => x - y), n = a.length;
    const mean = a.reduce((s, x) => s + x, 0) / n, m2 = a.reduce((s, x) => s + (x - mean) ** 2, 0);
    const vs = m2 / (n - 1), sd = Math.sqrt(vs), m3 = a.reduce((s, x) => s + (x - mean) ** 3, 0) / n;
    const skew = m2 ? m3 / Math.pow(m2 / n, 1.5) : 0;
    const med = q(a, .5), q1 = q(a, .25), q3 = q(a, .75), iqr = q3 - q1;
    const cnt = new Map(); a.forEach(x => cnt.set(x, (cnt.get(x) || 0) + 1));
    const maxc = Math.max(...cnt.values()), modes = maxc > 1 ? [...cnt].filter(([, c]) => c === maxc).map(([x]) => x) : [];
    const lo = q1 - 1.5 * iqr, hi = q3 + 1.5 * iqr, outl = a.filter(x => x < lo || x > hi);
    const cv = mean !== 0 ? sd / Math.abs(mean) : NaN;
    last = { a, n, mean, sd, med, q1, q3, lo, hi, outl, min: a[0], max: a[n - 1] };
    $('#s-stats').innerHTML = A.stats([
      ['Cantidad', fmt(n, 0)], ['Media', fmt(mean, 3)], ['Mediana', fmt(med, 3)],
      ['Moda', modes.length ? (modes.length > 3 ? modes.length + ' valores' : modes.map(x => fmt(x, 3)).join(' · ')) : 'No hay'],
      ['Desvío estándar', fmt(sd, 3)], ['Varianza', fmt(vs, 3)], ['Mínimo', fmt(a[0], 3)], ['Máximo', fmt(a[n - 1], 3)],
      ['Rango', fmt(a[n - 1] - a[0], 3)], ['Q1 (25%)', fmt(q1, 3)], ['Q3 (75%)', fmt(q3, 3)], ['Rango intercuartil', fmt(iqr, 3)],
      ['Coef. de variación', Number.isFinite(cv) ? pct(cv) : '—'], ['Asimetría', fmt(skew, 2)]
    ]);
    const skewTxt = Math.abs(skew) < .3 ? 'Los datos están bastante <b>simétricos</b>: la media y la mediana quedan cerca.'
      : skew > 0 ? 'Hay una <b>cola hacia la derecha</b> (asimetría positiva): unos pocos valores altos tiran la media para arriba de la mediana.'
      : 'Hay una <b>cola hacia la izquierda</b> (asimetría negativa): unos pocos valores bajos tiran la media para abajo de la mediana.';
    $('#s-sum').innerHTML = `<p>El valor típico es <b>${fmt(mean, 2)}</b> (media). La mitad de los datos está por debajo de <b>${fmt(med, 2)}</b> y la otra mitad por encima.</p>
      <p>En promedio, cada dato se aleja unos <b>${fmt(sd, 2)}</b> de la media (desvío estándar). El 50% del medio está entre <b>${fmt(q1, 2)}</b> y <b>${fmt(q3, 2)}</b>.</p>
      <p>${skewTxt}</p>
      <p>${outl.length ? `Valores atípicos (fuera de ${fmt(lo, 2)} a ${fmt(hi, 2)}): <b>${outl.map(x => fmt(x, 3)).join(', ')}</b>. Conviene revisar si son errores de carga o casos reales.` : 'No hay valores atípicos según la regla de 1,5 veces el rango intercuartil.'}</p>`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#s-cv'));
    if (!last) return;
    const { a, n, min, max, q1, q3, med, mean, lo, hi } = last;
    const k = Math.max(4, Math.ceil(Math.log2(n) + 1));
    let x0 = min, x1 = max; if (x0 === x1) { x0 -= 1; x1 += 1; }
    const bw = (x1 - x0) / k, bins = new Array(k).fill(0);
    a.forEach(x => bins[Math.min(k - 1, Math.floor((x - x0) / bw))]++);
    const ymax = Math.max(...bins), pad = (x1 - x0) * .04, boxH = 54;
    const F = A.frame(c, w, h - boxH, [x0 - pad, x1 + pad], [0, ymax * 1.12], { ystep: Math.max(1, A.niceStep(ymax * 1.12, 4)), yf: v => fmt(v, 0) });
    bins.forEach((b, i) => { if (!b) return; const xa = F.X(x0 + i * bw) + 1, xb = F.X(x0 + (i + 1) * bw) - 1; c.fillStyle = K.amber; c.globalAlpha = .85; c.fillRect(xa, F.Y(b), xb - xa, F.Y(0) - F.Y(b)); c.globalAlpha = 1; });
    c.strokeStyle = K.teal; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(F.X(mean), F.T); c.lineTo(F.X(mean), F.T + F.ph); c.stroke(); c.setLineDash([]);
    c.font = '11px ' + A.MONO; c.fillStyle = K.teal; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('media', F.X(mean) + 5, F.T + 2);
    const yb = h - boxH + 24, bh = 20, inl = a.filter(x => x >= lo && x <= hi), wlo = inl[0], whi = inl[inl.length - 1];
    c.strokeStyle = K.fg; c.lineWidth = 1.4; c.beginPath();
    c.moveTo(F.X(wlo), yb); c.lineTo(F.X(q1), yb); c.moveTo(F.X(q3), yb); c.lineTo(F.X(whi), yb);
    c.moveTo(F.X(wlo), yb - 6); c.lineTo(F.X(wlo), yb + 6); c.moveTo(F.X(whi), yb - 6); c.lineTo(F.X(whi), yb + 6); c.stroke();
    c.fillStyle = K['panel-2']; c.fillRect(F.X(q1), yb - bh / 2, F.X(q3) - F.X(q1), bh); c.strokeRect(F.X(q1), yb - bh / 2, F.X(q3) - F.X(q1), bh);
    c.strokeStyle = K.amber; c.lineWidth = 2.4; c.beginPath(); c.moveTo(F.X(med), yb - bh / 2); c.lineTo(F.X(med), yb + bh / 2); c.stroke();
    c.fillStyle = K.rose; last.outl.forEach(x => { c.beginPath(); c.arc(F.X(x), yb, 3.5, 0, 7); c.fill(); });
    c.fillStyle = K.muted; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('caja', 4, yb);
  }
}

/* ================= Distribuciones ================= */
{
  const DIST = {
    normal: { lab: 'Normal', ps: [['mu', 'Media μ', -10, 10, .1, 0], ['sd', 'Desvío σ', .1, 5, .1, 1]], pdf: (x, p) => S.normPdf(x, p.mu, p.sd), cdf: (x, p) => S.normCdf(x, p.mu, p.sd), mean: p => p.mu, vr: p => p.sd ** 2, range: p => [p.mu - 4 * p.sd, p.mu + 4 * p.sd], use: 'Alturas, errores de medición, puntajes de exámenes masivos. Es la distribución que aparece cuando sumás muchos efectos chicos.' },
    t: { lab: 't de Student', ps: [['v', 'Grados de libertad', 1, 60, 1, 5]], pdf: (x, p) => S.tPdf(x, p.v), cdf: (x, p) => S.tCdf(x, p.v), mean: p => p.v > 1 ? 0 : NaN, vr: p => p.v > 2 ? p.v / (p.v - 2) : NaN, range: () => [-5, 5], use: 'Se usa para inferir con muestras chicas cuando no conocés el desvío de la población. Con muchos grados de libertad se vuelve una normal.' },
    chi: { lab: 'Chi cuadrado', ps: [['k', 'Grados de libertad', 1, 40, 1, 4]], pdf: (x, p) => S.chiPdf(x, p.k), cdf: (x, p) => S.chiCdf(x, p.k), mean: p => p.k, vr: p => 2 * p.k, range: p => [0, p.k + 5 * Math.sqrt(2 * p.k) + 2], use: 'Aparece en tests de independencia (¿dos variables están relacionadas?) y de bondad de ajuste.' },
    expo: { lab: 'Exponencial', ps: [['l', 'Tasa λ', .1, 5, .1, 1]], pdf: (x, p) => x < 0 ? 0 : p.l * Math.exp(-p.l * x), cdf: (x, p) => x < 0 ? 0 : 1 - Math.exp(-p.l * x), mean: p => 1 / p.l, vr: p => 1 / p.l ** 2, range: p => [0, 6 / p.l], use: 'Tiempo de espera hasta el próximo evento: el próximo cliente, la próxima llamada, la próxima falla.' },
    unif: { lab: 'Uniforme', ps: [['a', 'Mínimo a', -10, 10, .5, 0], ['b', 'Máximo b', -10, 10, .5, 1]], pdf: (x, p) => x >= p.a && x <= p.b ? 1 / (p.b - p.a) : 0, cdf: (x, p) => A.clamp((x - p.a) / (p.b - p.a), 0, 1), mean: p => (p.a + p.b) / 2, vr: p => (p.b - p.a) ** 2 / 12, range: p => [p.a - (p.b - p.a) * .3, p.b + (p.b - p.a) * .3], use: 'Cuando cualquier valor dentro de un rango es igual de probable, como un número al azar entre 0 y 1.' },
    bin: { lab: 'Binomial', disc: true, ps: [['n', 'Intentos n', 1, 100, 1, 20], ['p', 'Probabilidad de éxito p', 0, 1, .01, .3]], pmf: (k, p) => S.binPmf(k, p.n, p.p), mean: p => p.n * p.p, vr: p => p.n * p.p * (1 - p.p), kmax: p => p.n, use: 'Cantidad de éxitos en n intentos independientes: penales convertidos, piezas falladas, respuestas correctas adivinando.' },
    poi: { lab: 'Poisson', disc: true, ps: [['l', 'Promedio λ', .1, 30, .1, 4]], pmf: (k, p) => S.poiPmf(k, p.l), mean: p => p.l, vr: p => p.l, kmax: p => Math.ceil(p.l + 5 * Math.sqrt(p.l) + 4), use: 'Cantidad de eventos en un intervalo: mails por hora, goles por partido, clientes por minuto.' }
  };
  const st = { d: 'normal', p: {}, mode: 'le', a: 1, b: 2, q: .95 };
  const D = () => DIST[st.d];
  const params = () => { const p = { ...st.p }; if (st.d === 'unif' && p.b <= p.a) p.b = p.a + .5; return p; };
  const cdfD = (x, p) => { const d = D(); if (!d.disc) return d.cdf(x, p); let s = 0; for (let k = 0; k <= Math.floor(x); k++) s += d.pmf(k, p); return Math.min(1, s); };
  const prob = p => {
    const d = D(), { a, b } = st;
    if (st.mode === 'le') return cdfD(a, p);
    if (st.mode === 'ge') return d.disc ? 1 - cdfD(Math.ceil(a) - 1, p) : 1 - d.cdf(a, p);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return d.disc ? cdfD(hi, p) - cdfD(Math.ceil(lo) - 1, p) : d.cdf(hi, p) - d.cdf(lo, p);
  };
  const inRegion = x => { const { a, b } = st; if (st.mode === 'le') return x <= a + 1e-9; if (st.mode === 'ge') return x >= a - 1e-9; return x >= Math.min(a, b) - 1e-9 && x <= Math.max(a, b) + 1e-9; };
  A.tool({
    id: 'distribuciones', sec: 'estadistica', name: 'Distribuciones', tag: 'Probabilidad continua y discreta', f: 'P(X ≤ 1,96) = 0,975',
    desc: 'Normal, t, chi cuadrado, binomial, Poisson y más. Movés los parámetros y calculás cualquier probabilidad.',
    lead: 'Elegí una distribución, ajustá sus parámetros y calculá probabilidades sin tablas. El área pintada es la probabilidad que buscás.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="ds-d">Distribución</label><select class="field" id="ds-d">${Object.entries(DIST).map(([k, v]) => `<option value="${k}">${v.lab}</option>`).join('')}</select></div>
        <div id="ds-ps" style="display:flex;flex-direction:column;gap:12px"></div>
        <div><label class="l">Probabilidad a calcular</label>${segHTML('ds-mode', [['le', 'P(X ≤ a)'], ['ge', 'P(X ≥ a)'], ['btw', 'P(a ≤ X ≤ b)']], 'le')}</div>
        <div class="grid2"><div><label class="l" for="ds-a">a</label><input class="field" id="ds-a" type="number" step="0.1" value="1"></div><div id="ds-bw" hidden><label class="l" for="ds-b">b</label><input class="field" id="ds-b" type="number" step="0.1" value="2"></div></div>
        <div><label class="l" for="ds-q">Valor que deja una probabilidad acumulada de</label><div class="row"><input class="field" id="ds-q" value="0,95" style="width:110px"><span class="out" id="ds-qx"></span></div></div>
      </div>
      <div class="stage">
        <div class="row" style="justify-content:space-between;align-items:baseline"><div class="big sm" id="ds-res"></div><span class="mono muted" id="ds-rl"></span></div>
        <canvas id="ds-cv" style="height:340px"></canvas>
        <dl class="stats" id="ds-stats" style="margin:0"></dl>
        <div class="explain" id="ds-use"></div>
      </div>
    </div>`,
    init() {
      const build = () => {
        const d = D(); st.p = {};
        $('#ds-ps').innerHTML = d.ps.map(([k, l, mn, mx, stp, v]) => { st.p[k] = v; return `<div><label class="l" for="ds-p-${k}">${l}: <span id="ds-pv-${k}" style="color:var(--fg)">${fmt(v, 2)}</span></label><input type="range" id="ds-p-${k}" min="${mn}" max="${mx}" step="${stp}" value="${v}"></div>`; }).join('');
        A.greek($('#ds-ps'));
        d.ps.forEach(([k]) => $('#ds-p-' + k).oninput = e => { st.p[k] = +e.target.value; $('#ds-pv-' + k).textContent = fmt(st.p[k], 2); upd(); });
        const p = params(), m = d.mean(p) || 0, sd = Math.sqrt(d.vr(p)) || 1;
        st.a = d.disc ? Math.round(m) : +(m + (st.d === 'normal' ? 1.96 * sd : sd)).toFixed(2); st.b = d.disc ? Math.round(m + sd) : +(m + 2 * sd).toFixed(2);
        if (st.d === 'normal') st.a = 1.96;
        $('#ds-a').value = st.a; $('#ds-b').value = st.b; upd();
      };
      $('#ds-d').onchange = e => { st.d = e.target.value; build(); };
      segBind('ds-mode', v => { st.mode = v; $('#ds-bw').hidden = v !== 'btw'; upd(); });
      $('#ds-a').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.a = v; upd(); } };
      $('#ds-b').oninput = e => { const v = A.num(e.target.value); if (Number.isFinite(v)) { st.b = v; upd(); } };
      $('#ds-q').oninput = () => upd();
      build();
    },
    draw
  });
  function upd() {
    const d = D(), p = params(), pr = prob(p);
    const lab = st.mode === 'le' ? `P(X ≤ ${fmt(st.a, 3)})` : st.mode === 'ge' ? `P(X ≥ ${fmt(st.a, 3)})` : `P(${fmt(Math.min(st.a, st.b), 3)} ≤ X ≤ ${fmt(Math.max(st.a, st.b), 3)})`;
    $('#ds-res').textContent = fmtF(pr, 4); $('#ds-rl').textContent = `${lab} · ${pct(pr, 2)}`;
    const m = d.mean(p), v = d.vr(p);
    $('#ds-stats').innerHTML = A.stats([['Media', fmt(m, 4)], ['Varianza', fmt(v, 4)], ['Desvío', fmt(Math.sqrt(v), 4)]]);
    const qv = A.num($('#ds-q').value);
    if (qv > 0 && qv < 1) {
      let x;
      if (d.disc) { x = 0; while (cdfD(x, p) < qv && x < 1e4) x++; }
      else { const r = d.range(p); x = S.inv(t => d.cdf(t, p), qv, r[0] - 100 * (r[1] - r[0]), r[1] + 100 * (r[1] - r[0])); }
      $('#ds-qx').innerHTML = `→ x = <b>${fmt(x, 4)}</b>`;
    } else $('#ds-qx').textContent = 'Escribí un número entre 0 y 1';
    $('#ds-use').innerHTML = `<p><b>¿Dónde aparece?</b> ${d.use}</p>`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#ds-cv')), d = D(), p = params();
    if (d.disc) {
      const km = d.kmax(p), ks = []; let ymax = 0;
      for (let k = 0; k <= km; k++) { const v = d.pmf(k, p); ks.push(v); ymax = Math.max(ymax, v); }
      const F = A.frame(c, w, h, [-.6, km + .6], [0, ymax * 1.15], { yt: 4 });
      const bw = Math.max(1, (F.X(1) - F.X(0)) * .72);
      ks.forEach((v, k) => { c.fillStyle = inRegion(k) ? K.amber : K.faint; c.fillRect(F.X(k) - bw / 2, F.Y(v), bw, F.Y(0) - F.Y(v)); });
      return;
    }
    const r = d.range(p), N = 400; let ymax = 0;
    for (let i = 1; i < N; i++) { const v = d.pdf(r[0] + (r[1] - r[0]) * i / N, p); if (Number.isFinite(v)) ymax = Math.max(ymax, v); }
    if (st.d === 'chi' && p.k <= 2) ymax = Math.min(ymax, .6);
    const F = A.frame(c, w, h, r, [0, ymax * 1.15], { yt: 4 });
    const cap = v => Math.min(v, ymax * 1.15);
    c.fillStyle = 'rgba(242,169,59,.35)';
    for (let px = 0; px <= F.pw; px++) {
      const x = r[0] + px / F.pw * (r[1] - r[0]); if (!inRegion(x)) continue;
      const v = d.pdf(x, p); if (!Number.isFinite(v)) continue;
      c.fillRect(F.L + px, F.Y(cap(v)), 1, F.Y(0) - F.Y(cap(v)));
    }
    c.strokeStyle = K.fg; c.lineWidth = 2.2; c.beginPath(); let pen = false;
    for (let px = 0; px <= F.pw; px++) { const x = r[0] + px / F.pw * (r[1] - r[0]), v = d.pdf(x, p); if (!Number.isFinite(v)) { pen = false; continue; } const y = F.Y(cap(v)); pen ? c.lineTo(F.L + px, y) : c.moveTo(F.L + px, y); pen = true; }
    c.stroke();
    const marks = st.mode === 'btw' ? [st.a, st.b] : [st.a];
    marks.forEach(x => { if (x < r[0] || x > r[1]) return; c.strokeStyle = K.amber; c.lineWidth = 1.5; c.beginPath(); c.moveTo(F.X(x), F.T); c.lineTo(F.X(x), F.T + F.ph); c.stroke(); });
  }
}

/* ================= Intervalos de confianza ================= */
{
  const st = { t: 'media', c: .95, m: 50, s: 8, n: 25, x: 120, np: 300, sn: 20, hit: 0, tot: 0, last: [] };
  const compute = () => {
    const a = 1 - st.c;
    if (st.t === 'media') {
      const gl = st.n - 1, tc = S.tInv(1 - a / 2, gl), se = st.s / Math.sqrt(st.n), me = tc * se;
      return { lo: st.m - me, hi: st.m + me, c: st.m, me, steps: [
        `Grados de libertad: n − 1 = ${st.n} − 1 = <b>${gl}</b>.`,
        `Valor crítico t para ${pct(st.c, 0)} de confianza: <b>${fmt(tc, 4)}</b> (deja ${pct(a / 2, 1)} en cada cola).`,
        `Error estándar: s / √n = ${fmt(st.s, 3)} / √${st.n} = <b>${fmt(se, 4)}</b>.`,
        `Margen de error: t × EE = ${fmt(tc, 4)} × ${fmt(se, 4)} = <b>${fmt(me, 4)}</b>.`,
        `Intervalo: ${fmt(st.m, 3)} ± ${fmt(me, 4)} = <b>[${fmt(st.m - me, 3)} ; ${fmt(st.m + me, 3)}]</b>.`] };
    }
    const ph = st.x / st.np, zc = S.zInv(1 - a / 2), se = Math.sqrt(ph * (1 - ph) / st.np), me = zc * se;
    return { lo: ph - me, hi: ph + me, c: ph, me, prop: true, steps: [
      `Proporción muestral: p̂ = ${st.x} / ${st.np} = <b>${fmt(ph, 4)}</b>.`,
      `Valor crítico z para ${pct(st.c, 0)} de confianza: <b>${fmt(zc, 4)}</b>.`,
      `Error estándar: √(p̂(1 − p̂)/n) = √(${fmt(ph, 4)} × ${fmt(1 - ph, 4)} / ${st.np}) = <b>${fmt(se, 4)}</b>.`,
      `Margen de error: z × EE = <b>${fmt(me, 4)}</b> (${pct(me, 1)}).`,
      `Intervalo: <b>[${pct(ph - me, 1)} ; ${pct(ph + me, 1)}]</b>.`] };
  };
  A.tool({
    id: 'intervalos', sec: 'estadistica', name: 'Intervalos de confianza', short: 'Intervalos', tag: 'Inferencia', f: 'x̄ ± t · s/√n',
    desc: 'Calculá intervalos para una media o una proporción, paso a paso, y entendé qué significa el 95%.',
    lead: 'Con una muestra no sabés el valor real, pero podés dar un rango donde probablemente esté. Acá lo calculás paso a paso y ves qué significa realmente "95% de confianza".',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">¿Qué querés estimar?</label>${segHTML('ic-t', [['media', 'Una media'], ['prop', 'Una proporción']], 'media')}</div>
        <div id="ic-media" class="grid3"><div><label class="l" for="ic-m">Media x̄</label><input class="field" id="ic-m" value="50"></div><div><label class="l" for="ic-s">Desvío s</label><input class="field" id="ic-s" value="8"></div><div><label class="l" for="ic-n">n</label><input class="field" id="ic-n" value="25"></div></div>
        <div id="ic-prop" class="grid2" hidden><div><label class="l" for="ic-x">Éxitos</label><input class="field" id="ic-x" value="120"></div><div><label class="l" for="ic-np">Total n</label><input class="field" id="ic-np" value="300"></div></div>
        <div><label class="l">Nivel de confianza</label>${segHTML('ic-c', [['0.9', '90%'], ['0.95', '95%'], ['0.99', '99%']], '0.95')}</div>
        <p class="err" id="ic-err"></p>
      </div>
      <div class="stage">
        <div class="big sm" id="ic-res"></div>
        <canvas id="ic-line" style="height:90px"></canvas>
        <div class="steplist" id="ic-steps"></div>
      </div>
    </div>
    <div class="grp-h" style="margin-top:34px"><h2>¿Qué significa el 95%?</h2></div>
    <div class="bench">
      <div class="ctrl">
        <p class="note">Simulamos una población donde la media real es <b style="color:var(--fg)">μ = 50</b> (con desvío 10). Sacamos 100 muestras, armamos un intervalo con cada una y contamos cuántos atrapan al 50.</p>
        <div><label class="l" for="ic-sn">Tamaño de cada muestra: <span id="ic-snv" style="color:var(--fg)">20</span></label><input type="range" id="ic-sn" min="5" max="100" value="20"></div>
        <button class="btn primary" id="ic-go">Generar 100 intervalos</button>
        <dl class="stats" id="ic-sst" style="margin:0"></dl>
      </div>
      <div class="stage">
        <canvas id="ic-sim" style="height:380px"></canvas>
        <div class="legend"><span><i style="background:var(--teal)"></i>Atrapa a μ</span><span><i style="background:var(--rose)"></i>No lo atrapa</span></div>
        <div class="explain"><p>El 95% no es la probabilidad de que <b>este</b> intervalo contenga la media. Es la tasa de acierto <b>del método</b>: si repetís el procedimiento muchas veces, 95 de cada 100 intervalos atrapan el valor real.</p></div>
      </div>
    </div>`,
    init() {
      segBind('ic-t', v => { st.t = v; $('#ic-media').hidden = v !== 'media'; $('#ic-prop').hidden = v !== 'prop'; upd(); });
      segBind('ic-c', v => { st.c = +v; st.hit = 0; st.tot = 0; upd(); gen(); });
      [['ic-m', 'm'], ['ic-s', 's'], ['ic-n', 'n'], ['ic-x', 'x'], ['ic-np', 'np']].forEach(([id, k]) => $('#' + id).oninput = e => { st[k] = A.num(e.target.value); upd(); });
      $('#ic-sn').oninput = e => { st.sn = +e.target.value; $('#ic-snv').textContent = st.sn; st.hit = 0; st.tot = 0; gen(); };
      $('#ic-go').onclick = gen;
      upd(); gen();
    },
    draw: () => { drawLine(); drawSim(); }
  });
  let cur = null;
  function upd() {
    const bad = st.t === 'media' ? !(st.s > 0 && st.n >= 2 && Number.isFinite(st.m)) : !(st.np >= 1 && st.x >= 0 && st.x <= st.np);
    $('#ic-err').textContent = bad ? (st.t === 'media' ? 'Revisá los datos: el desvío tiene que ser positivo y n al menos 2.' : 'Los éxitos tienen que estar entre 0 y el total.') : '';
    if (bad) { cur = null; $('#ic-res').textContent = '—'; $('#ic-steps').innerHTML = ''; drawLine(); return; }
    st.n = Math.round(st.n); cur = compute();
    $('#ic-res').textContent = cur.prop ? `[${pct(cur.lo, 1)} ; ${pct(cur.hi, 1)}]` : `[${fmt(cur.lo, 2)} ; ${fmt(cur.hi, 2)}]`;
    $('#ic-steps').innerHTML = cur.steps.map((s, i) => `<div class="step"><p><b>Paso ${i + 1}.</b> ${s}</p></div>`).join('') +
      `<p class="note">En criollo: con ${pct(st.c, 0)} de confianza, el valor real ${cur.prop ? 'de la proporción' : 'de la media'} está entre ${cur.prop ? pct(cur.lo, 1) : fmt(cur.lo, 2)} y ${cur.prop ? pct(cur.hi, 1) : fmt(cur.hi, 2)}. Para achicar el intervalo necesitás una muestra más grande.</p>`;
    drawLine();
  }
  function drawLine() {
    const { c, w, h } = A.canv($('#ic-line')); if (!cur) return;
    const span = cur.me * 3 || 1, xr = [cur.c - span, cur.c + span];
    const F = A.frame(c, w, h, xr, [0, 1], { t: 4, b: 24, l: 12, r: 12, ystep: 2, yf: () => '', xf: v => cur.prop ? pct(v, 0) : fmt(v, 2), xt: w < 500 ? 4 : 6 });
    const y = F.T + F.ph / 2;
    c.fillStyle = 'rgba(242,169,59,.18)'; c.fillRect(F.X(cur.lo), y - 14, F.X(cur.hi) - F.X(cur.lo), 28);
    c.strokeStyle = K.amber; c.lineWidth = 3; c.beginPath(); c.moveTo(F.X(cur.lo), y); c.lineTo(F.X(cur.hi), y);
    c.moveTo(F.X(cur.lo), y - 12); c.lineTo(F.X(cur.lo), y + 12); c.moveTo(F.X(cur.hi), y - 12); c.lineTo(F.X(cur.hi), y + 12); c.stroke();
    c.fillStyle = K.fg; c.beginPath(); c.arc(F.X(cur.c), y, 5, 0, 7); c.fill();
  }
  function gen() {
    const a = 1 - st.c, n = st.sn, tc = S.tInv(1 - a / 2, n - 1); st.last = [];
    for (let r = 0; r < 100; r++) {
      let s1 = 0, s2 = 0; for (let i = 0; i < n; i++) { const x = 50 + 10 * S.rnorm(); s1 += x; s2 += x * x; }
      const m = s1 / n, sd = Math.sqrt((s2 - n * m * m) / (n - 1)), me = tc * sd / Math.sqrt(n);
      const ok = m - me <= 50 && 50 <= m + me; st.last.push([m - me, m + me, m, ok]); if (ok) st.hit++; st.tot++;
    }
    const now = st.last.filter(x => x[3]).length;
    $('#ic-sst').innerHTML = A.stats([['Esta tanda', `${now} de 100`], ['Acumulado', `${fmt(st.hit, 0)} de ${fmt(st.tot, 0)}`], ['Tasa de acierto', pct(st.hit / st.tot, 1)], ['Esperado', pct(st.c, 0)]]);
    drawSim();
  }
  function drawSim() {
    const { c, w, h } = A.canv($('#ic-sim')); if (!st.last.length) return;
    const F = A.frame(c, w, h, [30, 70], [0, 101], { ystep: 200, yf: () => '', l: 14 });
    c.strokeStyle = K.amber; c.lineWidth = 1.5; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(F.X(50), F.T); c.lineTo(F.X(50), F.T + F.ph); c.stroke(); c.setLineDash([]);
    st.last.forEach(([lo, hi, m, ok], i) => {
      const y = F.Y(i + 1); c.strokeStyle = ok ? K.teal : K.rose; c.lineWidth = ok ? 1.4 : 2.2;
      c.beginPath(); c.moveTo(F.X(Math.max(30, lo)), y); c.lineTo(F.X(Math.min(70, hi)), y); c.stroke();
    });
    c.fillStyle = K.amber; c.font = '11px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('μ = 50', F.X(50) + 6, F.T);
  }
}

/* ================= Tests de hipótesis ================= */
{
  const st = { t: 'media', alt: 'lt', a: .05, mu0: 500, m: 496.8, s: 6.2, n: 25, p0: .5, x: 62, np: 100 };
  let R = null;
  const SYM = { ne: '≠', lt: '<', gt: '>' };
  A.tool({
    id: 'tests', sec: 'estadistica', name: 'Tests de hipótesis', short: 'Tests', tag: 'Inferencia', f: 't = (x̄ − μ₀) / (s/√n)',
    desc: '¿La diferencia es real o es azar? Plantea las hipótesis, calcula el p-valor y te explica la decisión.',
    lead: 'Un test responde una pregunta concreta: ¿lo que veo en la muestra es suficiente para descartar una afirmación, o puede ser casualidad? Te lo resuelve paso a paso.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Tipo de test</label>${segHTML('ht-t', [['media', 'Media (t)'], ['prop', 'Proporción (z)']], 'media')}</div>
        <div id="ht-media" style="display:flex;flex-direction:column;gap:12px">
          <p class="note">Ejemplo: una marca dice que sus paquetes pesan 500 g. Pesás 25 y te da media 496,8 g con desvío 6,2 g. ¿Te están cobrando de más?</p>
          <div class="grid2"><div><label class="l" for="ht-mu0">Valor de H₀ (μ₀)</label><input class="field" id="ht-mu0" value="500"></div><div><label class="l" for="ht-m">Media muestral</label><input class="field" id="ht-m" value="496,8"></div><div><label class="l" for="ht-s">Desvío s</label><input class="field" id="ht-s" value="6,2"></div><div><label class="l" for="ht-n">n</label><input class="field" id="ht-n" value="25"></div></div>
        </div>
        <div id="ht-prop" style="display:flex;flex-direction:column;gap:12px" hidden>
          <p class="note">Ejemplo: tirás una moneda 100 veces y salen 62 caras. ¿Está cargada?</p>
          <div class="grid3"><div><label class="l" for="ht-p0">p₀</label><input class="field" id="ht-p0" value="0,5"></div><div><label class="l" for="ht-x">Éxitos</label><input class="field" id="ht-x" value="62"></div><div><label class="l" for="ht-np">n</label><input class="field" id="ht-np" value="100"></div></div>
        </div>
        <div><label class="l" for="ht-alt">Hipótesis alternativa</label><select class="field" id="ht-alt"><option value="ne">Distinto (≠), dos colas</option><option value="lt" selected>Menor (&lt;)</option><option value="gt">Mayor (&gt;)</option></select></div>
        <div><label class="l">Nivel de significación α</label>${segHTML('ht-a', [['0.1', '10%'], ['0.05', '5%'], ['0.01', '1%']], '0.05')}</div>
        <p class="err" id="ht-err"></p>
      </div>
      <div class="stage">
        <div class="row" style="justify-content:space-between"><span id="ht-pill"></span><span class="mono muted" id="ht-pv"></span></div>
        <canvas id="ht-cv" style="height:300px"></canvas>
        <div class="legend"><span><i style="background:var(--rose)"></i>Zona de rechazo</span><span><i style="background:var(--amber)"></i>Tu estadístico</span></div>
        <div class="steplist" id="ht-steps"></div>
      </div>
    </div>`,
    init() {
      segBind('ht-t', v => { st.t = v; $('#ht-media').hidden = v !== 'media'; $('#ht-prop').hidden = v !== 'prop'; if (v === 'prop' && st.alt === 'lt') { st.alt = 'ne'; $('#ht-alt').value = 'ne'; } upd(); });
      segBind('ht-a', v => { st.a = +v; upd(); });
      $('#ht-alt').onchange = e => { st.alt = e.target.value; upd(); };
      [['ht-mu0', 'mu0'], ['ht-m', 'm'], ['ht-s', 's'], ['ht-n', 'n'], ['ht-p0', 'p0'], ['ht-x', 'x'], ['ht-np', 'np']].forEach(([id, k]) => $('#' + id).oninput = e => { st[k] = A.num(e.target.value); upd(); });
      upd();
    },
    draw
  });
  function upd() {
    const med = st.t === 'media';
    const bad = med ? !(st.s > 0 && st.n >= 2 && Number.isFinite(st.m) && Number.isFinite(st.mu0)) : !(st.p0 > 0 && st.p0 < 1 && st.np >= 1 && st.x >= 0 && st.x <= st.np);
    $('#ht-err').textContent = bad ? 'Revisá los datos: hay algún valor fuera de rango.' : '';
    if (bad) { R = null; $('#ht-steps').innerHTML = ''; $('#ht-pill').innerHTML = ''; $('#ht-pv').textContent = ''; draw(); return; }
    const gl = Math.round(st.n) - 1;
    const cdf = med ? t => S.tCdf(t, gl) : t => S.normCdf(t), inv = med ? p => S.tInv(p, gl) : p => S.zInv(p);
    let se, stat, est, h0, par;
    if (med) { se = st.s / Math.sqrt(st.n); stat = (st.m - st.mu0) / se; est = st.m; h0 = st.mu0; par = 'μ'; }
    else { const ph = st.x / st.np; se = Math.sqrt(st.p0 * (1 - st.p0) / st.np); stat = (ph - st.p0) / se; est = ph; h0 = st.p0; par = 'p'; }
    const p = st.alt === 'ne' ? 2 * (1 - cdf(Math.abs(stat))) : st.alt === 'lt' ? cdf(stat) : 1 - cdf(stat);
    const crit = st.alt === 'ne' ? [inv(1 - st.a / 2)] : st.alt === 'lt' ? [inv(st.a)] : [inv(1 - st.a)];
    const rej = p < st.a, L = med ? 't' : 'z';
    R = { stat, crit, med, gl, rej, p };
    $('#ht-pill').innerHTML = `<span class="pill ${rej ? 'warn' : 'ok'}">${rej ? 'Se rechaza H₀' : 'No se rechaza H₀'}</span>`;
    $('#ht-pv').textContent = `p-valor = ${fmt(p, 4)} · α = ${fmt(st.a, 2)}`;
    const altTxt = { ne: 'distinta de', lt: 'menor que', gt: 'mayor que' }[st.alt];
    const pTxt = st.alt === 'ne' ? `2 × P(${L} ≥ ${fmt(Math.abs(stat), 3)})` : st.alt === 'lt' ? `P(${L} ≤ ${fmt(stat, 3)})` : `P(${L} ≥ ${fmt(stat, 3)})`;
    const steps = [
      `<b>Hipótesis.</b> H₀: ${par} = ${fmt(h0, 4)} &nbsp;·&nbsp; H₁: ${par} ${SYM[st.alt]} ${fmt(h0, 4)}. H₀ es lo que se asume hasta que los datos digan lo contrario.`,
      med ? `<b>Error estándar.</b> s / √n = ${fmt(st.s, 3)} / √${st.n} = ${fmt(se, 4)}.` : `<b>Error estándar.</b> √(p₀(1 − p₀)/n) = √(${fmt(st.p0, 3)} × ${fmt(1 - st.p0, 3)} / ${st.np}) = ${fmt(se, 4)}.`,
      `<b>Estadístico.</b> ${L} = (${fmt(est, 4)} − ${fmt(h0, 4)}) / ${fmt(se, 4)} = <b>${fmt(stat, 3)}</b>${med ? ` (con ${gl} grados de libertad)` : ''}. Mide a cuántos errores estándar está tu muestra de lo que dice H₀.`,
      `<b>p-valor.</b> ${pTxt} = <b>${fmt(p, 4)}</b>. Es la probabilidad de ver algo tan extremo como lo tuyo <b>si H₀ fuera cierta</b>.`,
      `<b>Decisión.</b> ${rej ? `Como ${fmt(p, 4)} &lt; ${fmt(st.a, 2)}, se rechaza H₀.` : `Como ${fmt(p, 4)} ≥ ${fmt(st.a, 2)}, no se rechaza H₀.`}`
    ];
    $('#ht-steps').innerHTML = steps.map(s => `<div class="step"><p>${s}</p></div>`).join('') +
      `<div class="explain"><p>${rej ? `En criollo: hay evidencia suficiente para decir que ${med ? 'la media' : 'la proporción'} es <b>${altTxt} ${fmt(h0, 4)}</b>. Es muy poco probable que la diferencia sea pura casualidad.` : `En criollo: <b>no hay evidencia suficiente</b> para decir que ${med ? 'la media' : 'la proporción'} sea ${altTxt} ${fmt(h0, 4)}. Ojo: eso no prueba que H₀ sea cierta, solo que con estos datos no se puede descartar.`}</p></div>`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#ht-cv')); if (!R) return;
    const lim = Math.max(4.5, Math.min(9, Math.abs(R.stat) + 1)), xr = [-lim, lim];
    const pdf = R.med ? x => S.tPdf(x, R.gl) : x => S.normPdf(x);
    const ymax = pdf(0) * 1.15, F = A.frame(c, w, h, xr, [0, ymax], { yt: 3 });
    const inRej = x => st.alt === 'ne' ? Math.abs(x) >= R.crit[0] : st.alt === 'lt' ? x <= R.crit[0] : x >= R.crit[0];
    const inP = x => st.alt === 'ne' ? Math.abs(x) >= Math.abs(R.stat) : st.alt === 'lt' ? x <= R.stat : x >= R.stat;
    for (let px = 0; px <= F.pw; px++) {
      const x = xr[0] + px / F.pw * (xr[1] - xr[0]), y = pdf(x);
      if (inRej(x)) { c.fillStyle = 'rgba(239,115,145,.35)'; c.fillRect(F.L + px, F.Y(y), 1, F.Y(0) - F.Y(y)); }
      if (inP(x)) { c.fillStyle = 'rgba(242,169,59,.30)'; c.fillRect(F.L + px, F.Y(y), 1, F.Y(0) - F.Y(y)); }
    }
    c.strokeStyle = K.fg; c.lineWidth = 2; c.beginPath();
    for (let px = 0; px <= F.pw; px++) { const x = xr[0] + px / F.pw * (xr[1] - xr[0]); px ? c.lineTo(F.L + px, F.Y(pdf(x))) : c.moveTo(F.L, F.Y(pdf(x))); }
    c.stroke();
    const xs = A.clamp(R.stat, xr[0], xr[1]);
    c.strokeStyle = K.amber; c.lineWidth = 2.4; c.beginPath(); c.moveTo(F.X(xs), F.T); c.lineTo(F.X(xs), F.T + F.ph); c.stroke();
    c.fillStyle = K.amber; c.font = '12px ' + A.MONO; c.textBaseline = 'top'; c.textAlign = F.X(xs) > w - 120 ? 'right' : 'left';
    c.fillText(`${R.med ? 't' : 'z'} = ${fmt(R.stat, 2)}`, F.X(xs) + (c.textAlign === 'left' ? 6 : -6), F.T + 2);
    c.fillStyle = K.rose; c.textAlign = 'center'; c.font = '11px ' + A.MONO;
    const cs = st.alt === 'ne' ? [-R.crit[0], R.crit[0]] : R.crit;
    cs.forEach(x => c.fillText(fmt(x, 2), F.X(x), F.T + F.ph - 16));
  }
}

/* ================= Regresión lineal ================= */
{
  let pts = [], F = null, drag = null, showRes = true;
  const PRE = {
    pos: () => Array.from({ length: 14 }, (_, i) => { const x = .6 + i * .65; return [x, A.clamp(1.2 + .75 * x + S.rnorm() * .8, .2, 9.8)]; }),
    neg: () => Array.from({ length: 14 }, (_, i) => { const x = .6 + i * .65; return [x, A.clamp(8.8 - .7 * x + S.rnorm() * .8, .2, 9.8)]; }),
    nada: () => Array.from({ length: 16 }, () => [.5 + Math.random() * 9, .5 + Math.random() * 9]),
    atip: () => [...Array.from({ length: 12 }, (_, i) => { const x = .6 + i * .6; return [x, A.clamp(1.5 + .7 * x + S.rnorm() * .45, .2, 9.8)]; }), [9.3, 1.2]],
    curva: () => Array.from({ length: 15 }, (_, i) => { const x = .5 + i * .64; return [x, A.clamp((x - 5) ** 2 / 3 + 1 + S.rnorm() * .3, .2, 9.8)]; })
  };
  const fit = () => {
    const n = pts.length; if (n < 2) return null;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxx = 0, sxy = 0, syy = 0; pts.forEach(([x, y]) => { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); syy += (y - my) ** 2; });
    if (sxx < 1e-12) return null;
    const b = sxy / sxx, a = my - b * mx, r = syy > 0 ? sxy / Math.sqrt(sxx * syy) : 0;
    return { n, mx, my, a, b, r, r2: r * r };
  };
  A.tool({
    id: 'regresion', sec: 'estadistica', name: 'Regresión lineal', short: 'Regresión', tag: 'Relación entre variables', f: 'ŷ = a + b·x',
    desc: 'Agregá y arrastrá puntos y mirá cómo se ajusta la recta en vivo. Correlación, R² y residuos.',
    lead: 'La regresión busca la recta que mejor pasa entre los puntos (la que hace más chicos los errores al cuadrado). Tocá para agregar puntos y arrastralos para ver cómo responde.',
    body: `<div class="bench">
      <div class="ctrl">
        <div class="big sm" id="rg-eq" style="font-size:34px"></div>
        <dl class="stats" id="rg-stats" style="margin:0"></dl>
        <div><label class="l">Cargar ejemplo</label><div class="chips"><button class="chip" data-rg="pos">Relación positiva</button><button class="chip" data-rg="neg">Negativa</button><button class="chip" data-rg="nada">Sin relación</button><button class="chip" data-rg="atip">Con un atípico</button><button class="chip" data-rg="curva">Curva</button></div></div>
        <div class="row"><label class="check"><input type="checkbox" id="rg-res" checked> Mostrar residuos</label><button class="btn sm" id="rg-clear">Borrar todo</button></div>
        <p class="note">Tocá un lugar vacío para agregar un punto. Arrastrá un punto para moverlo. Tocá un punto sin moverlo para borrarlo.</p>
      </div>
      <div class="stage">
        <canvas id="rg-cv" style="height:min(60vh,500px);touch-action:none;cursor:crosshair"></canvas>
        <div class="explain" id="rg-exp"></div>
      </div>
    </div>`,
    init() {
      pts = PRE.pos();
      $$('[data-rg]').forEach(b => b.onclick = () => { pts = PRE[b.dataset.rg](); upd(); });
      $('#rg-clear').onclick = () => { pts = []; upd(); };
      $('#rg-res').onchange = e => { showRes = e.target.checked; draw(); };
      const cv = $('#rg-cv');
      const toData = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; return [(px - F.L) / F.pw * 10, (F.T + F.ph - py) / F.ph * 10, px, py]; };
      cv.addEventListener('pointerdown', e => {
        if (!F) return; const [x, y, px, py] = toData(e);
        const i = pts.findIndex(p => Math.hypot(F.X(p[0]) - px, F.Y(p[1]) - py) < 13);
        if (i >= 0) drag = { i, moved: false };
        else if (x >= 0 && x <= 10 && y >= 0 && y <= 10) { pts.push([x, y]); drag = { i: pts.length - 1, moved: true }; upd(); }
        if (drag) cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener('pointermove', e => { if (!drag) return; const [x, y] = toData(e); pts[drag.i] = [A.clamp(x, 0, 10), A.clamp(y, 0, 10)]; drag.moved = true; upd(); });
      cv.addEventListener('pointerup', () => { if (drag && !drag.moved) { pts.splice(drag.i, 1); upd(); } drag = null; });
      upd();
    },
    draw
  });
  function upd() {
    const r = fit();
    if (!r) { $('#rg-eq').textContent = 'ŷ = ?'; $('#rg-stats').innerHTML = A.stats([['Puntos', pts.length]]); $('#rg-exp').innerHTML = '<p>Necesito al menos 2 puntos con distinto x para ajustar una recta.</p>'; draw(); return; }
    $('#rg-eq').innerHTML = `ŷ = ${fmt(r.a, 2)} ${r.b < 0 ? '−' : '+'} ${fmt(Math.abs(r.b), 2)}·x`;
    $('#rg-stats').innerHTML = A.stats([['Puntos', r.n], ['Pendiente b', fmt(r.b, 3)], ['Ordenada a', fmt(r.a, 3)], ['Correlación r', fmt(r.r, 3)], ['R²', pct(r.r2, 1)]]);
    const ar = Math.abs(r.r), fuerza = ar > .8 ? 'fuerte' : ar > .5 ? 'moderada' : ar > .25 ? 'débil' : 'prácticamente nula';
    $('#rg-exp').innerHTML = `<p><b>Pendiente:</b> por cada unidad que sube x, y ${r.b >= 0 ? 'sube' : 'baja'} en promedio ${fmt(Math.abs(r.b), 2)}.</p>
      <p style="margin-top:6px"><b>Correlación:</b> r = ${fmt(r.r, 2)}, una relación lineal ${fuerza}${ar > .25 ? (r.r > 0 ? ' y positiva' : ' y negativa') : ''}. La recta explica el <b>${pct(r.r2, 0)}</b> de la variación de y (eso es R²).</p>
      <p style="margin-top:6px">Dos avisos: un solo punto atípico puede torcer mucho la recta (probá el ejemplo), y una relación curva puede tener r cercano a 0 aunque las variables estén muy relacionadas. Y siempre: <b>correlación no implica causalidad</b>.</p>`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#rg-cv'));
    F = A.frame(c, w, h, [0, 10], [0, 10], { ystep: 2, xt: 5 });
    c.strokeStyle = K.line; for (let x = 2; x <= 10; x += 2) { c.beginPath(); c.moveTo(Math.round(F.X(x)) + .5, F.T); c.lineTo(Math.round(F.X(x)) + .5, F.T + F.ph); c.stroke(); }
    const r = fit();
    if (r) {
      if (showRes) { c.strokeStyle = K.rose; c.lineWidth = 1.2; c.setLineDash([3, 3]); pts.forEach(([x, y]) => { c.beginPath(); c.moveTo(F.X(x), F.Y(y)); c.lineTo(F.X(x), F.Y(r.a + r.b * x)); c.stroke(); }); c.setLineDash([]); }
      c.save(); c.beginPath(); c.rect(F.L, F.T, F.pw, F.ph); c.clip();
      c.strokeStyle = K.amber; c.lineWidth = 2.4; c.beginPath(); c.moveTo(F.X(0), F.Y(r.a)); c.lineTo(F.X(10), F.Y(r.a + r.b * 10)); c.stroke(); c.restore();
      c.strokeStyle = K.fg; c.lineWidth = 1.5; const mx = F.X(r.mx), my = F.Y(r.my); c.beginPath(); c.moveTo(mx - 6, my); c.lineTo(mx + 6, my); c.moveTo(mx, my - 6); c.lineTo(mx, my + 6); c.stroke();
    }
    pts.forEach(([x, y], i) => { c.fillStyle = drag && drag.i === i ? K.amber : K.teal; c.beginPath(); c.arc(F.X(x), F.Y(y), 6, 0, 7); c.fill(); c.strokeStyle = K.bg; c.lineWidth = 1.5; c.stroke(); });
  }
}
})();
