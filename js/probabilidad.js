/* Asíntota · Probabilidad: Monty Hall, cumpleaños, TCL, ley de grandes números, Monte Carlo, casino, combinatoria */
(() => {
const { $, $$, K, fmt, fmtF, pct, S } = A;
const rnd = n => Math.floor(Math.random() * n);

/* ================= Monty Hall ================= */
{
  const st = { phase: 'pick', car: 0, pick: -1, open: -1, final: -1, sw: [0, 0], stay: [0, 0] };
  let sim = null;
  A.tool({
    id: 'montyhall', sec: 'probabilidad', name: 'El problema de Monty Hall', short: 'Monty Hall', tag: 'Paradoja', f: 'P(ganar cambiando) = 2/3',
    desc: 'Tres puertas, un auto y dos cabras. ¿Conviene cambiar? Jugá y después simulá 10.000 partidas.',
    lead: 'Detrás de una puerta hay un auto y detrás de las otras dos, cabras. Elegís una, el presentador abre otra que tiene una cabra y te pregunta: ¿te quedás o cambiás?',
    body: `<div class="bench">
      <div class="ctrl">
        <div class="doors" id="m-doors"></div>
        <p class="msg" id="m-msg"></p>
        <div class="row" id="m-act"></div>
        <div class="score"><div><small>Cambiando</small><strong id="m-sw">0 de 0</strong></div><div><small>Quedándote</small><strong id="m-st">0 de 0</strong></div></div>
      </div>
      <div class="stage">
        <div class="row" style="justify-content:space-between"><h3>10.000 partidas en un segundo</h3><button class="btn primary sm" id="m-sim">Simular 10.000 partidas</button></div>
        <canvas id="m-cv" style="height:280px"></canvas>
        <div class="legend"><span><i style="background:var(--amber)"></i>Siempre cambiar</span><span><i style="background:var(--teal)"></i>Siempre quedarse</span><span id="m-res"></span></div>
        <div class="explain"><p style="margin-bottom:8px"><b>Por qué cambiar gana 2 de cada 3 veces</b></p>
          <ol class="steps">
            <li>Cuando elegís, tenés <b>1 en 3</b> de acertarle al auto. Las otras dos puertas juntas tienen <b>2 en 3</b>.</li>
            <li>El presentador <b>sabe</b> dónde está el auto y siempre abre una puerta con cabra. Eso no cambia tu 1 en 3.</li>
            <li>Entonces los 2 en 3 que tenían las otras dos puertas quedan concentrados en la única que sigue cerrada.</li>
            <li>Dicho de otra forma: cambiar gana justo cuando tu primera elección era una cabra, y eso pasa <b>2 de cada 3 veces</b>.</li>
          </ol></div>
      </div>
    </div>`,
    init() { $('#m-sim').onclick = simulate; newGame(); simulate(); },
    draw
  });
  function newGame() { Object.assign(st, { phase: 'pick', car: rnd(3), pick: -1, open: -1, final: -1 }); render(); }
  function render() {
    const doors = $('#m-doors'); doors.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const b = document.createElement('button'); b.className = 'door';
      const isOpen = i === st.open || st.phase === 'done';
      let what = 'Cerrada';
      if (isOpen) { if (i === st.car) { b.classList.add('car'); what = 'Auto'; } else { b.classList.add('goat'); what = 'Cabra'; } }
      const mine = st.phase === 'done' ? st.final : st.pick;
      if (i === mine) b.classList.add('picked');
      b.innerHTML = `${i === mine ? '<span class="you">tu puerta</span>' : ''}<span class="num">${i + 1}</span><span class="what">${what}</span>`;
      b.disabled = st.phase !== 'pick'; b.setAttribute('aria-label', `Puerta ${i + 1}: ${what}`);
      b.onclick = () => pick(i); doors.appendChild(b);
    }
    const msg = $('#m-msg'), act = $('#m-act'); act.innerHTML = '';
    if (st.phase === 'pick') msg.innerHTML = 'Elegí una puerta.';
    if (st.phase === 'decide') {
      const other = [0, 1, 2].find(k => k !== st.pick && k !== st.open);
      msg.innerHTML = `Elegiste la puerta <b>${st.pick + 1}</b>. El presentador abre la <b>${st.open + 1}</b> y hay una cabra. ¿Te quedás con la ${st.pick + 1} o cambiás a la ${other + 1}?`;
      const a = document.createElement('button'); a.className = 'btn'; a.textContent = `Quedarme con la ${st.pick + 1}`; a.onclick = () => decide(false);
      const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = `Cambiar a la ${other + 1}`; b.onclick = () => decide(true);
      act.append(a, b);
    }
    if (st.phase === 'done') {
      msg.innerHTML = st.final === st.car ? `<b style="color:var(--amber)">Ganaste el auto.</b> ${st.switched ? 'Cambiar funcionó.' : 'Quedarte funcionó esta vez.'}` : `<b>Te llevaste una cabra.</b> El auto estaba en la ${st.car + 1}.`;
      const b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Jugar otra vez'; b.onclick = newGame; act.append(b);
    }
    const f = ([w, p]) => p ? `${w} de ${p} · ${pct(w / p, 0)}` : '0 de 0';
    $('#m-sw').textContent = f(st.sw); $('#m-st').textContent = f(st.stay);
  }
  function pick(i) { if (st.phase !== 'pick') return; st.pick = i; const o = [0, 1, 2].filter(k => k !== i && k !== st.car); st.open = o[rnd(o.length)]; st.phase = 'decide'; render(); }
  function decide(sw) { st.switched = sw; st.final = sw ? [0, 1, 2].find(k => k !== st.pick && k !== st.open) : st.pick; const r = sw ? st.sw : st.stay; r[1]++; if (st.final === st.car) r[0]++; st.phase = 'done'; render(); }
  function simulate() {
    const N = 10000, pts = []; let ws = 0, wst = 0;
    for (let i = 1; i <= N; i++) { const car = rnd(3), p = rnd(3); if (p === car) wst++; else ws++; if (i < 50 || i % Math.max(1, Math.floor(i / 60)) === 0 || i === N) pts.push([i, ws / i, wst / i]); }
    sim = pts;
    $('#m-res').innerHTML = `Resultado: cambiar <b style="color:var(--amber)">${pct(ws / N)}</b> · quedarse <b style="color:var(--teal)">${pct(wst / N)}</b>`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#m-cv'));
    const F = A.frame(c, w, h, [1, 10000], [0, 1], { logx: true, xticks: [1, 10, 100, 1000, 10000], xf: v => fmt(v, 0), ystep: .25, yf: v => pct(v, 0) });
    [[2 / 3, K.amber], [1 / 3, K.teal]].forEach(([y, col]) => { c.strokeStyle = col; c.globalAlpha = .45; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(F.L, F.Y(y)); c.lineTo(F.L + F.pw, F.Y(y)); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; });
    c.font = '11px ' + A.MONO; c.textAlign = 'right'; c.textBaseline = 'bottom';
    c.fillStyle = K.amber; c.fillText('2/3', F.L + F.pw, F.Y(2 / 3) - 3); c.fillStyle = K.teal; c.fillText('1/3', F.L + F.pw, F.Y(1 / 3) - 3);
    if (!sim) return;
    [[1, K.amber], [2, K.teal]].forEach(([k, col]) => { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); sim.forEach((p, i) => i ? c.lineTo(F.X(p[0]), F.Y(p[k])) : c.moveTo(F.X(p[0]), F.Y(p[k]))); c.stroke(); });
    c.textAlign = 'center'; c.textBaseline = 'top'; c.fillStyle = K.faint; c.fillText('partidas jugadas (escala logarítmica)', F.L + F.pw / 2, F.T + 2);
  }
}

/* ================= Cumpleaños ================= */
{
  const ML = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MN = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const pNo = n => { let p = 1; for (let k = 0; k < n; k++) p *= (365 - k) / 365; return p; };
  const P = n => 1 - pNo(n);
  const cells = [];
  const dayName = i => { let m = 0; while (i >= ML[m]) { i -= ML[m]; m++; } return `${i + 1} de ${MN[m]}`; };
  A.tool({
    id: 'cumpleanos', sec: 'probabilidad', name: 'La paradoja del cumpleaños', short: 'Cumpleaños', tag: 'Paradoja', f: 'P(23) ≈ 50,7%',
    desc: 'Con 23 personas en una sala, es más probable que dos cumplan el mismo día que lo contrario.',
    lead: '¿Cuántas personas tiene que haber en una sala para que sea probable que dos cumplan años el mismo día? Mucho menos de lo que pensás.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="b-n">Personas en la sala: <span id="b-nv" style="color:var(--fg)">23</span></label><input type="range" id="b-n" min="2" max="80" value="23"></div>
        <div><div class="big" id="b-p"></div><p class="note" style="margin-top:6px">de probabilidad de que al menos dos personas cumplan el mismo día.</p></div>
        <div class="formula" id="b-f"></div>
        <div class="explain"><p>El truco: no comparás tu cumpleaños con el resto, sino <b>todos los pares posibles</b>. Con <span id="b-nn">23</span> personas hay <b id="b-pairs">253</b> pares, y cada uno es una chance de coincidencia.</p></div>
      </div>
      <div class="stage">
        <canvas id="b-cv" style="height:260px"></canvas>
        <div class="row" style="justify-content:space-between"><h3>Probalo con una sala</h3><div class="row"><button class="btn primary sm" id="b-room">Armar una sala</button><button class="btn sm" id="b-many">Simular 10.000 salas</button></div></div>
        <div class="cal" id="b-cal"></div>
        <p class="note" id="b-res"></p>
      </div>
    </div>`,
    init() {
      const cal = $('#b-cal');
      for (let m = 0; m < 12; m++) {
        const lab = document.createElement('span'); lab.className = 'm'; lab.textContent = MN[m].slice(0, 3); cal.appendChild(lab);
        for (let d = 0; d < 31; d++) { const e = document.createElement('span'); e.className = 'd' + (d >= ML[m] ? ' x' : ''); cal.appendChild(e); if (d < ML[m]) cells.push(e); }
      }
      $('#b-n').addEventListener('input', update);
      $('#b-room').onclick = room; $('#b-many').onclick = many;
      update(); room();
    },
    draw
  });
  function update() {
    const n = +$('#b-n').value; $('#b-nv').textContent = n; $('#b-nn').textContent = n;
    $('#b-p').textContent = pct(P(n)); $('#b-pairs').textContent = fmt(n * (n - 1) / 2, 0);
    $('#b-f').innerHTML = `P(nadie coincide) = 365/365 × 364/365 × … × ${366 - n}/365<br>= <b>${fmtF(pNo(n), 4)}</b><br>P(al menos dos coinciden) = 1 − ${fmtF(pNo(n), 4)} = <b style="color:var(--amber)">${fmtF(P(n), 4)}</b>`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#b-cv')), n = +$('#b-n').value;
    const F = A.frame(c, w, h, [1, 80], [0, 1], { ystep: .25, yf: v => pct(v, 0), xticks: [1, 10, 20, 30, 40, 50, 60, 70, 80], xf: v => fmt(v, 0) });
    c.strokeStyle = K.faint; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(F.L, F.Y(.5)); c.lineTo(F.L + F.pw, F.Y(.5)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = K.fg; c.lineWidth = 2; c.beginPath(); for (let k = 1; k <= 80; k++) k === 1 ? c.moveTo(F.X(k), F.Y(P(k))) : c.lineTo(F.X(k), F.Y(P(k))); c.stroke();
    c.fillStyle = K.amber; c.globalAlpha = .12; c.beginPath(); c.moveTo(F.X(1), F.Y(0)); for (let k = 1; k <= n; k++) c.lineTo(F.X(k), F.Y(P(k))); c.lineTo(F.X(n), F.Y(0)); c.closePath(); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = K.amber; c.lineWidth = 1; c.beginPath(); c.moveTo(F.X(n), F.Y(0)); c.lineTo(F.X(n), F.Y(P(n))); c.stroke();
    c.fillStyle = K.amber; c.beginPath(); c.arc(F.X(n), F.Y(P(n)), 5, 0, 7); c.fill();
    c.font = '12px ' + A.MONO; c.textBaseline = 'bottom'; c.textAlign = F.X(n) > w - 130 ? 'right' : 'left';
    c.fillText(`${n} personas → ${pct(P(n))}`, F.X(n) + (c.textAlign === 'left' ? 9 : -9), F.Y(P(n)) - 6);
  }
  function room() {
    const n = +$('#b-n').value, cnt = new Map();
    for (let i = 0; i < n; i++) { const d = rnd(365); cnt.set(d, (cnt.get(d) || 0) + 1); }
    cells.forEach((e, i) => { const k = cnt.get(i) || 0; e.classList.toggle('one', k === 1); e.classList.toggle('dup', k > 1); e.title = k ? `${dayName(i)}: ${k} persona${k > 1 ? 's' : ''}` : ''; });
    const dups = [...cnt].filter(([, k]) => k > 1);
    $('#b-res').innerHTML = (dups.length ? `Hubo coincidencia: ${dups.map(([d, k]) => `<b style="color:var(--amber)">${dayName(d)}</b> (${k} personas)`).join(', ')}.` : `En esta sala de ${n} nadie coincidió. Probá de nuevo.`) + ' <span class="muted">Cada punto es un día; verde es un cumpleaños, ámbar un día compartido.</span>';
  }
  function many() {
    const n = +$('#b-n').value, N = 10000, seen = new Uint8Array(365); let hit = 0;
    for (let r = 0; r < N; r++) { seen.fill(0); for (let k = 0; k < n; k++) { const d = rnd(365); if (seen[d]) { hit++; break; } seen[d] = 1; } }
    $('#b-res').innerHTML = `En <b>10.000 salas</b> de ${n} personas hubo coincidencia en <b style="color:var(--amber)">${fmt(hit, 0)}</b> (${pct(hit / N)}). La fórmula dice <b>${pct(P(n))}</b>.`;
  }
}

/* ================= Teorema central del límite ================= */
{
  const D = {
    dado: { s: () => 1 + rnd(6), mu: 3.5, v: 35 / 12, r: [.5, 6.5], bb: 6 },
    expo: { s: () => -Math.log(1 - Math.random()), mu: 1, v: 1, r: [0, 4], bb: 32 },
    u: { s: () => Math.sin(Math.PI * Math.random() / 2) ** 2, mu: .5, v: 1 / 8, r: [0, 1], bb: 30 },
    uniforme: { s: () => Math.random(), mu: .5, v: 1 / 12, r: [0, 1], bb: 30 }
  };
  let dist = 'dado', n = 5, means = [], lastS = null;
  const hist = (data, r, bins) => { const bw = (r[1] - r[0]) / bins, cnt = new Array(bins).fill(0); data.forEach(x => { const i = Math.floor((x - r[0]) / bw); if (i >= 0 && i < bins) cnt[i]++; }); return cnt; };
  A.tool({
    id: 'tcl', sec: 'probabilidad', name: 'Teorema central del límite', short: 'TCL', tag: 'Teorema', f: 'x̄ ~ N(μ, σ²/n)',
    desc: 'Partí de cualquier distribución, promediá muestras y mirá cómo aparece la campana.',
    lead: 'Elegí una distribución que no se parezca en nada a una campana. Sacá muestras, calculá el promedio de cada una y mirá la forma que toman esos promedios.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="t-dist">Distribución de origen</label><select id="t-dist" class="field"><option value="dado">Dado (1 a 6)</option><option value="expo">Exponencial (muy sesgada)</option><option value="u">Forma de U</option><option value="uniforme">Uniforme entre 0 y 1</option></select></div>
        <canvas id="t-base" style="height:130px"></canvas>
        <div><label class="l" for="t-n">Tamaño de cada muestra: <span id="t-nv" style="color:var(--fg)">5</span></label><input type="range" id="t-n" min="1" max="40" value="5"></div>
        <div class="row"><button class="btn sm" data-t="1">+1 muestra</button><button class="btn sm" data-t="100">+100</button><button class="btn primary sm" data-t="1000">+1.000</button><button class="btn sm" id="t-reset">Reiniciar</button></div>
        <p class="note mono" id="t-last"></p>
      </div>
      <div class="stage">
        <canvas id="t-cv" style="height:330px"></canvas>
        <div class="legend"><span><i style="background:var(--amber)"></i>Promedios observados</span><span><i style="background:var(--teal)"></i>Normal que predice el teorema</span></div>
        <dl class="stats" id="t-stats" style="margin:0"></dl>
        <div class="explain"><p>El teorema dice que, si las muestras son grandes, <b>los promedios se distribuyen como una normal</b> centrada en la media original μ y con desvío σ/√n, sin importar la forma de la distribución de origen. Subí el tamaño de muestra y mirá cómo la campana se vuelve más angosta y más prolija.</p></div>
      </div>
    </div>`,
    init() {
      $('#t-dist').onchange = e => { dist = e.target.value; drawBase(); reset(); add(1000); };
      $('#t-n').oninput = e => { n = +e.target.value; $('#t-nv').textContent = n; reset(); add(1000); };
      $$('#v-tcl [data-t]').forEach(b => b.onclick = () => add(+b.dataset.t));
      $('#t-reset').onclick = reset;
      add(1000);
    },
    draw: () => { drawBase(); draw(); }
  });
  function reset() { means = []; lastS = null; $('#t-last').textContent = ''; draw(); }
  function add(k) {
    const d = D[dist];
    for (let i = 0; i < k; i++) { const s = Array.from({ length: n }, d.s); lastS = s; means.push(s.reduce((a, b) => a + b, 0) / n); }
    $('#t-last').textContent = `Última muestra: ${lastS.slice(0, 12).map(x => fmt(x, dist === 'dado' ? 0 : 2)).join(', ')}${n > 12 ? ', …' : ''} → promedio ${fmt(means[means.length - 1], 3)}`;
    draw();
  }
  function drawBase() {
    const { c, w, h } = A.canv($('#t-base')), d = D[dist], data = Array.from({ length: 20000 }, d.s);
    const bins = d.bb, bw = (d.r[1] - d.r[0]) / bins, cnt = hist(data, d.r, bins), ymax = Math.max(...cnt);
    const X = x => 4 + (x - d.r[0]) / (d.r[1] - d.r[0]) * (w - 8), Y = y => h - 18 - y / ymax * (h - 26), g = dist === 'dado' ? 8 : .5;
    c.fillStyle = K.teal; c.globalAlpha = .7; cnt.forEach((k, i) => { const a = X(d.r[0] + i * bw) + g, b = X(d.r[0] + (i + 1) * bw) - g; c.fillRect(a, Y(k), b - a, Y(0) - Y(k)); }); c.globalAlpha = 1;
    c.strokeStyle = K.faint; c.beginPath(); c.moveTo(0, Y(0) + .5); c.lineTo(w, Y(0) + .5); c.stroke();
    c.font = '10px ' + A.MONO; c.fillStyle = K.muted; c.textBaseline = 'top';
    c.textAlign = 'left'; c.fillText(fmt(dist === 'dado' ? 1 : d.r[0], 0), 4, h - 13);
    c.textAlign = 'right'; c.fillText(fmt(dist === 'dado' ? 6 : d.r[1], 0) + (dist === 'expo' ? '+' : ''), w - 4, h - 13);
    c.textAlign = 'center'; c.fillText(`μ = ${fmt(d.mu, 2)}`, X(d.mu), h - 13);
  }
  function draw() {
    const { c, w, h } = A.canv($('#t-cv')), d = D[dist], r = d.r, bins = 40, bw = (r[1] - r[0]) / bins, cnt = hist(means, r, bins);
    const sig = Math.sqrt(d.v / n), N = means.length, pdf = x => S.normPdf(x, d.mu, sig);
    const ymax = Math.max(5, ...cnt, N ? N * bw * pdf(d.mu) : 0) * 1.1;
    const F = A.frame(c, w, h, r, [0, ymax], { yf: v => fmt(v, 0), ystep: Math.max(1, A.niceStep(ymax, 4)) });
    c.fillStyle = K.amber; c.globalAlpha = .85; cnt.forEach((k, i) => { if (!k) return; const a = F.X(r[0] + i * bw) + .5, b = F.X(r[0] + (i + 1) * bw) - .5; c.fillRect(a, F.Y(k), b - a, F.Y(0) - F.Y(k)); }); c.globalAlpha = 1;
    if (N) { c.strokeStyle = K.teal; c.lineWidth = 2.2; c.beginPath(); for (let px = 0; px <= F.pw; px++) { const x = r[0] + px / F.pw * (r[1] - r[0]), y = Math.min(ymax * 2, N * bw * pdf(x)); px ? c.lineTo(F.X(x), F.Y(y)) : c.moveTo(F.X(x), F.Y(y)); } c.stroke(); }
    else { c.fillStyle = K.muted; c.font = '13px ' + A.MONO; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Sacá muestras para ver los promedios', F.L + F.pw / 2, F.T + F.ph / 2); }
    const mm = N ? means.reduce((a, b) => a + b, 0) / N : NaN, sd = N > 1 ? Math.sqrt(means.reduce((a, b) => a + (b - mm) ** 2, 0) / (N - 1)) : NaN;
    $('#t-stats').innerHTML = A.stats([['Muestras', fmt(N, 0)], ['Media de promedios', fmt(mm, 3)], ['μ teórica', fmt(d.mu, 3)], ['Desvío de promedios', fmt(sd, 3)], ['σ/√n teórico', fmt(sig, 3)]]);
  }
}

/* ================= Ley de los grandes números ================= */
{
  const EXP = { moneda: { p: .5, lab: 'cara', a: 'C', b: 'S' }, cargada: { p: .7, lab: 'cara', a: 'C', b: 'S' }, dado: { p: 1 / 6, lab: 'un 6', a: '6', b: '·' } };
  let ex = 'moneda', n = 0, k = 0, hist = [], strip = [], timer = null;
  A.tool({
    id: 'lgn', sec: 'probabilidad', name: 'Ley de los grandes números', short: 'Grandes números', tag: 'Teorema', f: 'éxitos / n → p',
    desc: 'Tirá una moneda miles de veces y mirá cómo la proporción se clava en la probabilidad real.',
    lead: 'Con pocas tiradas, cualquier cosa puede pasar. Con muchas, la proporción de éxitos se acerca a la probabilidad real. Es la base de los seguros, los casinos y las encuestas.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l" for="lg-e">Experimento</label><select class="field" id="lg-e"><option value="moneda">Moneda equilibrada (p = 0,5)</option><option value="cargada">Moneda cargada (p = 0,7)</option><option value="dado">Dado: sacar un 6 (p = 1/6)</option></select></div>
        <div class="row"><button class="btn sm" data-lg="1">+1</button><button class="btn sm" data-lg="10">+10</button><button class="btn sm" data-lg="100">+100</button><button class="btn sm" data-lg="1000">+1.000</button></div>
        <div class="row"><button class="btn primary sm" id="lg-auto">Tirar sin parar</button><button class="btn sm" id="lg-reset">Reiniciar</button></div>
        <dl class="stats" id="lg-stats" style="margin:0"></dl>
        <div><label class="l">Últimas tiradas</label><div class="coin-strip" id="lg-strip"></div></div>
      </div>
      <div class="stage">
        <canvas id="lg-cv" style="height:340px"></canvas>
        <div class="explain"><p>Fijate en un detalle que confunde a mucha gente: la <b>proporción</b> se acerca a p, pero la <b>diferencia absoluta</b> entre éxitos y lo esperado puede crecer. La ley no dice que la suerte "se empareja": dice que las rachas pesan cada vez menos en el promedio.</p></div>
      </div>
    </div>`,
    init() {
      $('#lg-e').onchange = e => { ex = e.target.value; reset(); add(200); };
      $$('[data-lg]').forEach(b => b.onclick = () => add(+b.dataset.lg));
      $('#lg-reset').onclick = () => { stop(); reset(); };
      $('#lg-auto').onclick = () => { if (timer) stop(); else { $('#lg-auto').textContent = 'Frenar'; timer = setInterval(() => { if (A.current !== 'lgn' || n > 2e6) return stop(); add(Math.max(1, Math.floor(n / 40))); }, 60); } };
      add(200);
    },
    draw,
    hide: () => stop()
  });
  function stop() { clearInterval(timer); timer = null; const b = $('#lg-auto'); if (b) b.textContent = 'Tirar sin parar'; }
  function reset() { n = 0; k = 0; hist = []; strip = []; info(); draw(); }
  function add(m) {
    const p = EXP[ex].p;
    for (let i = 0; i < m; i++) {
      const s = Math.random() < p; n++; if (s) k++;
      if (n <= 200 || n % Math.ceil(n / 400) === 0) hist.push([n, k / n]);
      if (m <= 1000 || i >= m - 60) { strip.push(s); if (strip.length > 60) strip.shift(); }
    }
    info(); draw();
  }
  function info() {
    const e = EXP[ex], prop = n ? k / n : NaN;
    $('#lg-stats').innerHTML = A.stats([['Tiradas', fmt(n, 0)], ['Éxitos (' + e.lab + ')', fmt(k, 0)], ['Proporción', n ? pct(prop, 2) : '—'], ['p real', pct(e.p, 2)], ['Éxitos − esperado', n ? fmt(k - n * e.p, 1) : '—']]);
    $('#lg-strip').innerHTML = strip.map(s => s ? `<b>${e.a}</b>` : e.b).join(' ');
  }
  function draw() {
    const { c, w, h } = A.canv($('#lg-cv')), p = EXP[ex].p, xm = Math.max(10, n);
    const ticks = [1, 10, 100, 1000, 1e4, 1e5, 1e6].filter(t => t <= xm);
    const F = A.frame(c, w, h, [1, xm], [0, 1], { logx: true, xticks: ticks, xf: v => fmt(v, 0), ystep: .25, yf: v => pct(v, 0) });
    c.strokeStyle = K.teal; c.setLineDash([5, 5]); c.lineWidth = 1.2; c.beginPath(); c.moveTo(F.L, F.Y(p)); c.lineTo(F.L + F.pw, F.Y(p)); c.stroke(); c.setLineDash([]);
    c.fillStyle = K.teal; c.font = '11px ' + A.MONO; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText('p = ' + pct(p, 1), F.L + F.pw, F.Y(p) - 4);
    if (!hist.length) return;
    c.strokeStyle = K.amber; c.lineWidth = 2; c.beginPath(); hist.forEach(([x, y], i) => i ? c.lineTo(F.X(x), F.Y(y)) : c.moveTo(F.X(x), F.Y(y))); c.stroke();
  }
}

/* ================= Monte Carlo: estimar π ================= */
{
  let pts = [], n = 0, inside = 0, hist = [], timer = null;
  A.tool({
    id: 'montecarlo', sec: 'probabilidad', name: 'Estimar π tirando dardos', short: 'Monte Carlo', tag: 'Simulación', f: 'π ≈ 4 · adentro / total',
    desc: 'Tirá puntos al azar sobre un cuadrado y calculá π contando cuántos caen dentro del círculo.',
    lead: 'El método Monte Carlo resuelve problemas con azar. Tiramos puntos al azar en un cuadrado: la proporción que cae dentro del cuarto de círculo es π/4.',
    body: `<div class="bench">
      <div class="ctrl">
        <div class="big" id="mc-pi">π ≈ —</div>
        <dl class="stats" id="mc-stats" style="margin:0"></dl>
        <div class="row"><button class="btn sm" data-mc="100">+100</button><button class="btn sm" data-mc="1000">+1.000</button><button class="btn sm" data-mc="10000">+10.000</button></div>
        <div class="row"><button class="btn primary sm" id="mc-auto">Tirar sin parar</button><button class="btn sm" id="mc-reset">Reiniciar</button></div>
        <div class="explain"><p><b>Por qué funciona:</b> el cuadrado mide 1 × 1 y el cuarto de círculo de radio 1 tiene área π/4. Si los puntos caen parejo, la fracción que queda adentro tiende a π/4. Multiplicás por 4 y listo.</p></div>
      </div>
      <div class="stage">
        <canvas id="mc-cv" style="width:min(100%,460px);aspect-ratio:1;align-self:center;background:var(--bg)"></canvas>
        <canvas id="mc-ch" style="height:170px"></canvas>
      </div>
    </div>`,
    init() {
      $$('[data-mc]').forEach(b => b.onclick = () => add(+b.dataset.mc));
      $('#mc-reset').onclick = () => { stop(); pts = []; n = 0; inside = 0; hist = []; info(); draw(); };
      $('#mc-auto').onclick = () => { if (timer) stop(); else { $('#mc-auto').textContent = 'Frenar'; timer = setInterval(() => { if (A.current !== 'montecarlo' || n > 5e6) return stop(); add(n < 2000 ? 40 : n < 20000 ? 400 : 5000); }, 50); } };
      add(1000);
    },
    draw,
    hide: () => stop()
  });
  function stop() { clearInterval(timer); timer = null; const b = $('#mc-auto'); if (b) b.textContent = 'Tirar sin parar'; }
  function add(m) {
    for (let i = 0; i < m; i++) { const x = Math.random(), y = Math.random(), ok = x * x + y * y <= 1; n++; if (ok) inside++; if (pts.length < 25000) pts.push([x, y, ok]); if (n <= 200 || n % Math.ceil(n / 300) === 0) hist.push([n, 4 * inside / n]); }
    info(); draw();
  }
  function info() {
    const est = n ? 4 * inside / n : NaN;
    $('#mc-pi').textContent = 'π ≈ ' + (n ? fmtF(est, 5) : '—');
    $('#mc-stats').innerHTML = A.stats([['Dardos', fmt(n, 0)], ['Adentro', fmt(inside, 0)], ['π real', '3,14159'], ['Error', n ? fmt(Math.abs(est - Math.PI), 5) : '—']]);
  }
  function draw() {
    { const { c, w, h } = A.canv($('#mc-cv')), s = Math.min(w, h), r = 1.6;
      c.fillStyle = 'rgba(67,200,184,.06)'; c.beginPath(); c.moveTo(0, s); c.arc(0, s, s, -Math.PI / 2, 0); c.closePath(); c.fill();
      pts.forEach(([x, y, ok]) => { c.fillStyle = ok ? K.teal : K.rose; c.fillRect(x * s - r / 2, s - y * s - r / 2, r, r); });
      c.strokeStyle = K.fg; c.lineWidth = 1.5; c.beginPath(); c.arc(0, s, s - 1, -Math.PI / 2, 0); c.stroke(); c.strokeRect(.5, .5, s - 1, s - 1); }
    { const { c, w, h } = A.canv($('#mc-ch')), xm = Math.max(10, n);
      const F = A.frame(c, w, h, [1, xm], [2.6, 3.7], { logx: true, xticks: [1, 10, 100, 1000, 1e4, 1e5, 1e6].filter(t => t <= xm), xf: v => fmt(v, 0), ystep: .25, yf: v => fmt(v, 2) });
      c.strokeStyle = K.teal; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(F.L, F.Y(Math.PI)); c.lineTo(F.L + F.pw, F.Y(Math.PI)); c.stroke(); c.setLineDash([]);
      c.save(); c.beginPath(); c.rect(F.L, F.T, F.pw, F.ph); c.clip();
      c.strokeStyle = K.amber; c.lineWidth = 1.8; c.beginPath(); hist.forEach(([x, y], i) => i ? c.lineTo(F.X(x), F.Y(y)) : c.moveTo(F.X(x), F.Y(y))); c.stroke(); c.restore(); }
  }
}

/* ================= Casino ================= */
{
  const BETS = { color: { lab: 'Color (rojo)', win: 18, pay: 1 }, docena: { lab: 'Docena', win: 12, pay: 2 }, pleno: { lab: 'Pleno (un número)', win: 1, pay: 35 } };
  const st = { bet: 'color', spins: 200, chip: 10, start: 1000 };
  let path = null, finals = null;
  const night = keep => { const b = BETS[st.bet]; let m = st.start; const pth = keep ? [m] : null; for (let i = 0; i < st.spins; i++) { m += rnd(37) < b.win ? st.chip * b.pay : -st.chip; if (keep) pth.push(m); } return keep ? pth : m; };
  A.tool({
    id: 'casino', sec: 'probabilidad', name: 'Casino matemático', short: 'Casino', tag: 'Esperanza matemática', f: 'E = −1/37 por ficha',
    desc: 'Jugá a la ruleta mil noches seguidas y mirá por qué la casa siempre gana a la larga.',
    lead: 'Una ruleta europea tiene 37 casillas (del 0 al 36). Ese 0 es todo el negocio del casino. Elegí cómo apostar y simulá noches enteras.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Tipo de apuesta</label><div class="seg" id="cs-bet">${Object.entries(BETS).map(([k, v]) => `<button data-v="${k}" aria-pressed="${k === 'color'}">${v.lab}</button>`).join('')}</div></div>
        <div><label class="l" for="cs-sp">Tiradas por noche: <span id="cs-spv" style="color:var(--fg)">200</span></label><input type="range" id="cs-sp" min="20" max="1000" step="10" value="200"></div>
        <p class="note">Arrancás cada noche con $1.000 y apostás $10 por tirada.</p>
        <div class="formula" id="cs-e"></div>
        <div class="row"><button class="btn sm" id="cs-one">Jugar una noche</button><button class="btn primary sm" id="cs-many">Simular 1.000 noches</button></div>
      </div>
      <div class="stage">
        <h3>Una noche, tirada por tirada</h3>
        <canvas id="cs-path" style="height:220px"></canvas>
        <h3>Resultado de 1.000 noches</h3>
        <canvas id="cs-hist" style="height:240px"></canvas>
        <dl class="stats" id="cs-stats" style="margin:0"></dl>
        <div class="explain" id="cs-exp"></div>
      </div>
    </div>`,
    init() {
      $$('#cs-bet button').forEach(b => b.onclick = () => { st.bet = b.dataset.v; $$('#cs-bet button').forEach(x => x.setAttribute('aria-pressed', x === b)); all(); });
      $('#cs-sp').oninput = e => { st.spins = +e.target.value; $('#cs-spv').textContent = st.spins; all(); };
      $('#cs-one').onclick = () => { path = night(true); drawPath(); };
      $('#cs-many').onclick = many;
      all();
    },
    draw: () => { drawPath(); drawHist(); }
  });
  function all() { formula(); path = night(true); many(); drawPath(); }
  function formula() {
    const b = BETS[st.bet], ev = (b.win * b.pay - (37 - b.win)) / 37 * st.chip;
    $('#cs-e').innerHTML = `E[por tirada] = ${b.win}/37 × (+$${st.chip * b.pay}) + ${37 - b.win}/37 × (−$${st.chip})<br>= <b style="color:var(--rose)">−$${fmtF(-ev, 2)}</b> &nbsp;(−2,7% de lo apostado)<br>E[por noche] = ${st.spins} × −$${fmtF(-ev, 2)} = <b style="color:var(--rose)">−$${fmtF(-ev * st.spins, 0)}</b>`;
  }
  function many() {
    finals = Array.from({ length: 1000 }, () => night(false) - st.start);
    const avg = finals.reduce((a, b) => a + b, 0) / 1000, wins = finals.filter(x => x > 0).length, b = BETS[st.bet];
    const ev = (b.win * b.pay - (37 - b.win)) / 37 * st.chip * st.spins;
    $('#cs-stats').innerHTML = A.stats([['Promedio por noche', '$' + fmt(avg, 0)], ['Esperado', '$' + fmt(ev, 0)], ['Noches ganadoras', pct(wins / 1000, 1)], ['Peor noche', '$' + fmt(Math.min(...finals), 0)], ['Mejor noche', '$' + fmt(Math.max(...finals), 0)]]);
    $('#cs-exp').innerHTML = `<p>Todas las apuestas pierden lo mismo en promedio (2,7%), pero cambian la <b>forma</b> de perder. ${st.bet === 'pleno' ? 'Al pleno la mayoría de las noches perdés, pero cuando ganás, ganás mucho: es una lotería.' : st.bet === 'color' ? 'Al color los resultados se amontonan cerca del promedio: perdés poco y seguido.' : 'La docena queda en el medio.'} Ganaste en ${pct(wins / 1000, 0)} de las noches; con más tiradas por noche, ese porcentaje baja, porque la ventaja de la casa tiene más tiempo para trabajar.</p>`;
    drawHist();
  }
  function drawPath() {
    const { c, w, h } = A.canv($('#cs-path')); if (!path) return;
    const lo = Math.min(...path, st.start - 100), hi = Math.max(...path, st.start + 100), pad = (hi - lo) * .08;
    const F = A.frame(c, w, h, [0, st.spins], [lo - pad, hi + pad], { yf: v => '$' + fmt(v, 0), l: 58 });
    c.strokeStyle = K.faint; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(F.L, F.Y(st.start)); c.lineTo(F.L + F.pw, F.Y(st.start)); c.stroke(); c.setLineDash([]);
    c.strokeStyle = path[path.length - 1] >= st.start ? K.teal : K.rose; c.lineWidth = 1.8; c.beginPath(); path.forEach((m, i) => i ? c.lineTo(F.X(i), F.Y(m)) : c.moveTo(F.X(i), F.Y(m))); c.stroke();
  }
  function drawHist() {
    const { c, w, h } = A.canv($('#cs-hist')); if (!finals) return;
    let lo = Math.min(...finals), hi = Math.max(...finals); if (lo === hi) { lo -= 10; hi += 10; }
    const bins = 36, bw = (hi - lo) / bins, cnt = new Array(bins).fill(0); finals.forEach(x => cnt[Math.min(bins - 1, Math.floor((x - lo) / bw))]++);
    const ym = Math.max(...cnt) * 1.12, F = A.frame(c, w, h, [lo, hi], [0, ym], { xf: v => '$' + fmt(v, 0), xt: w < 500 ? 4 : 6, yf: v => fmt(v, 0), ystep: Math.max(1, A.niceStep(ym, 4)) });
    cnt.forEach((k, i) => { if (!k) return; const x0 = lo + i * bw; c.fillStyle = x0 + bw / 2 > 0 ? K.teal : K.rose; c.globalAlpha = .85; c.fillRect(F.X(x0) + .5, F.Y(k), F.X(x0 + bw) - F.X(x0) - 1, F.Y(0) - F.Y(k)); });
    c.globalAlpha = 1;
    if (lo < 0 && hi > 0) { c.strokeStyle = K.fg; c.lineWidth = 1; c.beginPath(); c.moveTo(F.X(0), F.T); c.lineTo(F.X(0), F.T + F.ph); c.stroke(); c.fillStyle = K.fg; c.font = '11px ' + A.MONO; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('empatar', F.X(0) + 5, F.T); }
  }
}

/* ================= Combinatoria ================= */
{
  const fact = n => { let r = 1n; for (let i = 2n; i <= n; i++) r *= i; return r; };
  const fall = (n, k) => { let r = 1n; for (let i = 0n; i < k; i++) r *= n - i; return r; };
  const comb = (n, k) => k < 0n || k > n ? 0n : fall(n, k) / fact(k);
  const big = b => {
    const s = b.toString();
    if (s.length <= 15) return Number(b).toLocaleString('es-AR');
    const e = s.length - 1, m = (s[0] + ',' + s.slice(1, 3));
    return `${m} × 10${String(e).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')}`;
  };
  const EX = [['Quini 6', 46, 6, 'comb'], ['PIN de 4 dígitos', 10, 4, 'vrep'], ['Podio con 20 corredores', 20, 3, 'var'], ['Equipo de 5 de 12', 12, 5, 'comb'], ['Mezclar un mazo de 40', 40, 40, 'perm']];
  A.tool({
    id: 'combinatoria', sec: 'probabilidad', name: 'Combinatoria', tag: 'Contar sin contar', f: 'C(46, 6) = 9.366.819',
    desc: 'Permutaciones, variaciones y combinaciones, con la cuenta hecha y explicada. ¿Cuánto cuesta ganar el Quini?',
    lead: 'Contar de cuántas maneras puede pasar algo es la mitad de la probabilidad. Elegí n (cuántas cosas hay) y k (cuántas tomás), y mirá las cinco formas de contar.',
    body: `<div class="bench">
      <div class="ctrl">
        <div class="grid2"><div><label class="l" for="cb-n">n (total)</label><input class="field" id="cb-n" type="number" min="0" max="500" value="46"></div><div><label class="l" for="cb-k">k (elegidos)</label><input class="field" id="cb-k" type="number" min="0" max="500" value="6"></div></div>
        <p class="err" id="cb-err"></p>
        <div><label class="l">Ejemplos</label><div class="chips">${EX.map((e, i) => `<button class="chip" data-cb="${i}">${e[0]}</button>`).join('')}</div></div>
        <div class="explain"><p>Las dos preguntas que definen todo: <b>¿importa el orden?</b> y <b>¿se puede repetir?</b></p></div>
      </div>
      <div class="stage"><div class="steplist" id="cb-out"></div></div>
    </div>`,
    init() {
      $('#cb-n').oninput = upd; $('#cb-k').oninput = upd;
      $$('[data-cb]').forEach(b => b.onclick = () => { const e = EX[+b.dataset.cb]; $('#cb-n').value = e[1]; $('#cb-k').value = e[2]; upd(e[3]); });
      upd('comb');
    }
  });
  function upd(hl) {
    if (typeof hl !== 'string') hl = null;
    const n0 = Math.floor(A.num($('#cb-n').value)), k0 = Math.floor(A.num($('#cb-k').value));
    if (!(n0 >= 0 && n0 <= 500 && k0 >= 0 && k0 <= 500)) { $('#cb-err').textContent = 'Usá números enteros entre 0 y 500.'; return; }
    $('#cb-err').textContent = k0 > n0 ? 'Con k mayor que n solo tienen sentido las opciones con repetición.' : '';
    const n = BigInt(n0), k = BigInt(k0);
    const C = comb(n, k), prodTxt = k0 <= 8 && k0 > 0 && k0 <= n0 ? `<br>= (${Array.from({ length: k0 }, (_, i) => n0 - i).join(' × ')}) / (${Array.from({ length: k0 }, (_, i) => k0 - i).join(' × ')})` : '';
    const rows = [
      ['perm', 'Permutaciones', `${n0}! = ${n0 <= 10 ? Array.from({ length: Math.max(1, n0) }, (_, i) => n0 - i).join(' × ') + ' = ' : ''}`, fact(n), `Maneras de <b>ordenar</b> las ${n0} cosas, todas. Importa el orden, no se repite.`],
      ['var', 'Variaciones sin repetición', `${n0}! / (${n0} − ${k0})! = `, k0 <= n0 ? fall(n, k) : 0n, `Elegís ${k0} <b>en orden</b> y no se repiten. Como armar un podio.`],
      ['vrep', 'Variaciones con repetición', `${n0}${String(k0).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('')} = `, n ** k, `${k0} posiciones y cada una con ${n0} opciones. Como una contraseña o un PIN.`],
      ['comb', 'Combinaciones', `C(${n0}, ${k0}) = ${n0}! / (${k0}! · ${Math.max(0, n0 - k0)}!)${prodTxt}<br>= `, C, `Elegís ${k0} y <b>no importa el orden</b>. Como una lotería o armar un equipo.${C > 1n ? ` Si jugás una sola, tu chance es <b>1 en ${big(C)}</b>.` : ''}`],
      ['crep', 'Combinaciones con repetición', `C(${n0} + ${k0} − 1, ${k0}) = `, n0 + k0 > 0 ? comb(n + k - 1n, k) : 1n, `Tomás ${k0} cosas de ${n0} tipos y podés repetir. Como elegir ${k0} gustos de helado entre ${n0}.`]
    ];
    $('#cb-out').innerHTML = rows.map(([id, t, f, v, d]) => `<div class="step" ${id === hl ? 'style="border-left:2px solid var(--amber);padding-left:12px"' : ''}><h3>${t}</h3><div class="formula">${f}<b style="color:var(--amber)">${big(v)}</b></div><p>${d}</p></div>`).join('');
  }
}
})();
