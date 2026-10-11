/* Asíntota · Teoría de juegos: torneo del dilema del prisionero y equilibrios de Nash */
(() => {
const { $, $$, K, fmt, pct } = A;

/* ================= Torneo del dilema del prisionero ================= */
{
  const PAY = { CC: [3, 3], CD: [0, 5], DC: [5, 0], DD: [1, 1] };
  const STRATS = [
    { id: 'tft', name: 'Ojo por ojo', d: 'Coopera primero, después copia lo último que hizo el otro.', f: (m, o) => o.length ? o[o.length - 1] : 'C' },
    { id: 'gtft', name: 'Ojo por ojo generoso', d: 'Como ojo por ojo, pero perdona una traición 1 de cada 10 veces.', f: (m, o) => !o.length || o[o.length - 1] === 'C' || Math.random() < .1 ? 'C' : 'D' },
    { id: 'tf2t', name: 'Ojo por dos ojos', d: 'Solo traiciona si el otro lo traicionó dos veces seguidas.', f: (m, o) => o.length > 1 && o[o.length - 1] === 'D' && o[o.length - 2] === 'D' ? 'D' : 'C' },
    { id: 'grim', name: 'Rencoroso', d: 'Coopera hasta la primera traición. Después no perdona nunca.', f: (m, o) => o.includes('D') ? 'D' : 'C' },
    { id: 'pav', name: 'Pavlov', d: 'Si le fue bien, repite. Si le fue mal, cambia.', f: (m, o) => !m.length ? 'C' : o[o.length - 1] === 'C' ? m[m.length - 1] : (m[m.length - 1] === 'C' ? 'D' : 'C') },
    { id: 'stft', name: 'Desconfiado', d: 'Ojo por ojo, pero arranca traicionando.', f: (m, o) => o.length ? o[o.length - 1] : 'D' },
    { id: 'allc', name: 'Siempre coopera', d: 'Coopera pase lo que pase.', f: () => 'C' },
    { id: 'alld', name: 'Siempre traiciona', d: 'Traiciona pase lo que pase.', f: () => 'D' },
    { id: 'rnd', name: 'Aleatorio', d: 'Tira una moneda en cada ronda.', f: () => Math.random() < .5 ? 'C' : 'D' }
  ];
  const st = { on: new Set(STRATS.map(s => s.id)), rounds: 100, noise: 0 };
  let res = null;
  const match = (A1, B1) => {
    const ma = [], mb = []; let sa = 0, sb = 0;
    for (let r = 0; r < st.rounds; r++) {
      let a = A1.f(ma, mb), b = B1.f(mb, ma);
      if (Math.random() < st.noise) a = a === 'C' ? 'D' : 'C'; if (Math.random() < st.noise) b = b === 'C' ? 'D' : 'C';
      ma.push(a); mb.push(b); const p = PAY[a + b]; sa += p[0]; sb += p[1];
    }
    return [sa / st.rounds, sb / st.rounds];
  };
  A.tool({
    id: 'dilema', sec: 'juegos', name: 'Torneo del dilema del prisionero', short: 'Dilema del prisionero', tag: 'Cooperación', f: 'T > R > P > S',
    desc: 'Nueve estrategias se enfrentan todas contra todas. ¿Gana el que traiciona o el que coopera?',
    lead: 'Dos jugadores eligen cooperar o traicionar. Si los dos cooperan ganan 3 cada uno; si uno traiciona y el otro no, el traidor gana 5 y el otro 0; si los dos traicionan, 1 cada uno. Jugado una vez, conviene traicionar. ¿Y si se repite muchas veces?',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Estrategias en el torneo</label><div id="pd-list" style="display:flex;flex-direction:column;gap:8px"></div></div>
        <div><label class="l" for="pd-r">Rondas por partido: <span id="pd-rv" style="color:var(--fg)">100</span></label><input type="range" id="pd-r" min="5" max="300" step="5" value="100"></div>
        <div><label class="l" for="pd-n">Ruido (errores al jugar): <span id="pd-nv" style="color:var(--fg)">0%</span></label><input type="range" id="pd-n" min="0" max="0.15" step="0.01" value="0"></div>
        <button class="btn primary" id="pd-go">Correr el torneo</button>
      </div>
      <div class="stage">
        <h3>Ranking (puntos promedio por ronda)</h3>
        <div class="bars" id="pd-bars"></div>
        <h3 style="margin-top:8px">Cada partido</h3>
        <p class="note">Fila = jugador, columna = rival. El número es lo que ganó la fila por ronda.</p>
        <div class="tbl-wrap"><table class="tbl" id="pd-tbl"></table></div>
        <div class="explain" id="pd-exp"></div>
      </div>
    </div>`,
    init() {
      $('#pd-list').innerHTML = STRATS.map(s => `<label class="check" title="${s.d}"><input type="checkbox" data-pd="${s.id}" checked> <span><b style="color:var(--fg);font-weight:500">${s.name}</b> <span class="muted" style="font-size:12px">· ${s.d}</span></span></label>`).join('');
      $$('[data-pd]').forEach(c => c.onchange = () => { c.checked ? st.on.add(c.dataset.pd) : st.on.delete(c.dataset.pd); run(); });
      $('#pd-r').oninput = e => { st.rounds = +e.target.value; $('#pd-rv').textContent = st.rounds; };
      $('#pd-r').onchange = run;
      $('#pd-n').oninput = e => { st.noise = +e.target.value; $('#pd-nv').textContent = pct(st.noise, 0); };
      $('#pd-n').onchange = run;
      $('#pd-go').onclick = run;
      run();
    }
  });
  function run() {
    const S = STRATS.filter(s => st.on.has(s.id));
    if (S.length < 2) { $('#pd-bars').innerHTML = '<p class="note">Elegí al menos dos estrategias.</p>'; $('#pd-tbl').innerHTML = ''; $('#pd-exp').innerHTML = ''; return; }
    const M = S.map(() => S.map(() => 0));
    for (let i = 0; i < S.length; i++) for (let j = i; j < S.length; j++) { const [a, b] = match(S[i], S[j]); M[i][j] = a; M[j][i] = i === j ? a : b; }
    const tot = S.map((s, i) => ({ s, v: M[i].reduce((x, y) => x + y, 0) / S.length, i })).sort((a, b) => b.v - a.v);
    res = { S, M, tot };
    $('#pd-bars').innerHTML = tot.map((t, k) => `<div class="barrow"><span>${k + 1}. ${t.s.name}</span><div class="track"><div class="fillb" style="width:${t.v / 5 * 100}%;background:${k === 0 ? 'var(--amber)' : 'var(--teal)'}"></div></div><span class="v">${fmt(t.v, 2)}</span></div>`).join('');
    $('#pd-tbl').innerHTML = `<tr><th></th>${S.map(s => `<th title="${s.name}">${s.name.split(' ').map(w => w[0]).join('').toUpperCase()}</th>`).join('')}</tr>` +
      S.map((s, i) => `<tr><td>${s.name}</td>${M[i].map(v => `<td style="background:rgba(242,169,59,${(v / 5 * .45).toFixed(2)})">${fmt(v, 1)}</td>`).join('')}</tr>`).join('');
    const win = tot[0].s, beatsAll = S.findIndex(s => s === win);
    const neverMore = S.every((s, j) => M[beatsAll][j] <= M[j][beatsAll] + 1e-9);
    $('#pd-exp').innerHTML = `<p>Ganó <b>${win.name}</b>. ${neverMore && win.id !== 'alld' ? 'Fijate lo curioso: en ningún partido le sacó más puntos a su rival que el rival a ella. Gana el torneo sin ganarle a nadie, porque logra cooperar con los que cooperan.' : ''} Las estrategias que mejor funcionan en los torneos clásicos de Robert Axelrod comparten cuatro rasgos: son <b>amables</b> (no traicionan primero), <b>se defienden</b> (responden a una traición), <b>perdonan</b> y son <b>claras</b>. Probá subir el ruido: los errores castigan a las rencorosas y premian a las que perdonan.</p>`;
  }
}

/* ================= Equilibrio de Nash ================= */
{
  const PRE = {
    dilema: { lab: 'Dilema del prisionero', r: ['Callar', 'Delatar'], c: ['Callar', 'Delatar'], m: [[-1, -1], [-10, 0], [0, -10], [-5, -5]], txt: 'Delatar es la mejor respuesta hagas lo que hagas, así que los dos delatan y terminan peor que si callaban. Lo racional individual choca con lo mejor para el grupo.' },
    coord: { lab: 'Cine o fútbol', r: ['Cine', 'Fútbol'], c: ['Cine', 'Fútbol'], m: [[2, 1], [0, 0], [0, 0], [1, 2]], txt: 'Los dos quieren estar juntos pero prefieren planes distintos. Hay dos equilibrios puros (ir juntos a cualquiera de los dos) y uno mixto donde a veces no coinciden.' },
    gallina: { lab: 'Gallina', r: ['Desviar', 'Seguir'], c: ['Desviar', 'Seguir'], m: [[0, 0], [-1, 1], [1, -1], [-10, -10]], txt: 'Dos autos de frente: el que se desvía es "gallina", pero si nadie se desvía chocan. Los equilibrios puros son que uno solo ceda.' },
    pares: { lab: 'Pares o nones', r: ['Pares', 'Nones'], c: ['Pares', 'Nones'], m: [[1, -1], [-1, 1], [-1, 1], [1, -1]], txt: 'Lo que gana uno lo pierde el otro. No hay equilibrio puro: cualquier patrón se puede explotar. Lo único estable es jugar 50 y 50 al azar.' },
    ciervo: { lab: 'Caza del ciervo', r: ['Ciervo', 'Liebre'], c: ['Ciervo', 'Liebre'], m: [[4, 4], [0, 3], [3, 0], [3, 3]], txt: 'Cazar juntos el ciervo es lo mejor, pero requiere confiar en el otro. Cazar una liebre solo es seguro. Dos equilibrios: el ambicioso y el prudente.' }
  };
  const st = { key: 'dilema', m: PRE.dilema.m.map(x => [...x]) };
  let EQ = null;
  A.tool({
    id: 'nash', sec: 'juegos', name: 'Equilibrio de Nash', short: 'Nash', tag: 'Juegos de 2 × 2', f: 'p* = (b₂₂ − b₂₁) / (…)',
    desc: 'Cargá cualquier juego de 2 × 2 y encontrá sus equilibrios, puros y mixtos, con las curvas de mejor respuesta.',
    lead: 'Un equilibrio de Nash es una situación donde nadie gana nada cambiando solo su jugada. Cargá los pagos de cada jugador y lo encontramos, incluidos los equilibrios con probabilidades.',
    body: `<div class="bench">
      <div class="ctrl">
        <div><label class="l">Juegos clásicos</label><div class="chips">${Object.entries(PRE).map(([k, v]) => `<button class="chip" data-ne="${k}">${v.lab}</button>`).join('')}</div></div>
        <div><label class="l">Pagos (<span style="color:var(--amber)">fila</span>, <span style="color:var(--teal)">columna</span>)</label><div class="payoff" id="ne-grid"></div>
        <p class="note" style="margin-top:8px">Los números subrayados son la mejor respuesta de cada jugador a lo que hace el otro. Donde coinciden los dos, hay equilibrio.</p></div>
      </div>
      <div class="stage">
        <div id="ne-res"></div>
        <canvas id="ne-cv" style="width:min(100%,420px);aspect-ratio:1;align-self:center"></canvas>
        <div class="legend"><span><i style="background:var(--amber)"></i>Mejor respuesta del jugador fila</span><span><i style="background:var(--teal)"></i>Mejor respuesta del jugador columna</span></div>
        <div class="explain" id="ne-exp"></div>
      </div>
    </div>`,
    init() {
      $$('[data-ne]').forEach(b => b.onclick = () => { st.key = b.dataset.ne; st.m = PRE[st.key].m.map(x => [...x]); grid(); });
      grid();
    },
    draw
  });
  function grid() {
    const P = PRE[st.key];
    $('#ne-grid').innerHTML = `<span></span><span class="h">${P.c[0]}</span><span class="h">${P.c[1]}</span>` +
      [0, 1].map(i => `<span class="h" style="text-align:right">${P.r[i]}</span>` + [0, 1].map(j => { const k = i * 2 + j; return `<div class="cell" id="ne-c${k}"><input class="a" data-k="${k}" data-p="0" value="${st.m[k][0]}" aria-label="Pago fila"><i>,</i><input class="b" data-k="${k}" data-p="1" value="${st.m[k][1]}" aria-label="Pago columna"></div>`; }).join('')).join('');
    $$('#ne-grid input').forEach(inp => inp.oninput = () => { st.m[+inp.dataset.k][+inp.dataset.p] = A.num(inp.value); solve(); });
    solve();
  }
  function solve() {
    if (st.m.some(c => !c.every(Number.isFinite))) { $('#ne-res').innerHTML = '<p class="err">Hay algún pago vacío.</p>'; return; }
    const a = (i, j) => st.m[i * 2 + j][0], b = (i, j) => st.m[i * 2 + j][1], P = PRE[st.key];
    const brA = [[0, 0], [0, 0]], brB = [[0, 0], [0, 0]];
    for (let j = 0; j < 2; j++) { const mx = Math.max(a(0, j), a(1, j)); for (let i = 0; i < 2; i++) brA[i][j] = a(i, j) === mx; }
    for (let i = 0; i < 2; i++) { const mx = Math.max(b(i, 0), b(i, 1)); for (let j = 0; j < 2; j++) brB[i][j] = b(i, j) === mx; }
    const pure = [];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const k = i * 2 + j, cell = $('#ne-c' + k), eq = brA[i][j] && brB[i][j];
      cell.classList.toggle('eq', eq); cell.querySelector('.a').classList.toggle('br', brA[i][j]); cell.querySelector('.b').classList.toggle('br', brB[i][j]);
      if (eq) pure.push([i, j]);
    }
    const dq = a(0, 0) - a(0, 1) - a(1, 0) + a(1, 1), dp = b(0, 0) - b(1, 0) - b(0, 1) + b(1, 1);
    const q = dq ? (a(1, 1) - a(0, 1)) / dq : NaN, p = dp ? (b(1, 1) - b(1, 0)) / dp : NaN;
    const mixed = q > 1e-9 && q < 1 - 1e-9 && p > 1e-9 && p < 1 - 1e-9 ? { p, q } : null;
    EQ = { pure, mixed, a, b };
    const items = pure.map(([i, j]) => `<li><b>Puro:</b> fila juega <b style="color:var(--amber)">${P.r[i]}</b> y columna juega <b style="color:var(--teal)">${P.c[j]}</b>. Pagos: (${fmt(a(i, j), 2)}, ${fmt(b(i, j), 2)}).</li>`);
    if (mixed) items.push(`<li><b>Mixto:</b> fila juega ${P.r[0]} con probabilidad <b style="color:var(--amber)">${pct(p, 1)}</b> y columna juega ${P.c[0]} con probabilidad <b style="color:var(--teal)">${pct(q, 1)}</b>.</li>`);
    $('#ne-res').innerHTML = `<span class="pill ${items.length ? 'ok' : 'bad'}">${items.length} equilibrio${items.length === 1 ? '' : 's'}</span><ol class="steps" style="margin-top:10px;list-style:none;padding:0">${items.join('') || '<li>No hay equilibrios con estos pagos (o hay infinitos por empates).</li>'}</ol>`;
    $('#ne-exp').innerHTML = `<p>${P.txt}</p>${mixed ? `<p style="margin-top:6px"><b>Cómo sale el mixto:</b> cada jugador mezcla justo para que al otro le dé lo mismo cualquiera de sus opciones. Por ejemplo, la fila elige p para que la columna gane igual con ${P.c[0]} que con ${P.c[1]}: p = (${fmt(b(1, 1), 2)} − ${fmt(b(1, 0), 2)}) / (${fmt(b(0, 0), 2)} − ${fmt(b(1, 0), 2)} − ${fmt(b(0, 1), 2)} + ${fmt(b(1, 1), 2)}) = ${fmt(p, 3)}.</p>` : ''}`;
    draw();
  }
  function draw() {
    const { c, w, h } = A.canv($('#ne-cv')); if (!EQ || w < 2) return;
    const P = PRE[st.key], { a, b } = EQ, L = 56, T = 14, S = Math.min(w, h) - L - 40;
    const X = q => L + q * S, Y = p => T + (1 - p) * S;
    c.strokeStyle = K.line; c.lineWidth = 1; c.strokeRect(L + .5, T + .5, S, S);
    c.font = '11px ' + A.MONO; c.fillStyle = K.muted; c.textAlign = 'center'; c.textBaseline = 'top';
    ['0%', '50%', '100%'].forEach((t, i) => c.fillText(t, X(i / 2), T + S + 6));
    c.fillText(`prob. columna juega ${P.c[0]}`, L + S / 2, T + S + 22);
    c.textAlign = 'right'; c.textBaseline = 'middle'; ['0%', '50%', '100%'].forEach((t, i) => c.fillText(t, L - 6, Y(i / 2)));
    c.save(); c.translate(12, T + S / 2); c.rotate(-Math.PI / 2); c.textAlign = 'center'; c.fillText(`prob. fila juega ${P.r[0]}`, 0, 0); c.restore();
    // mejor respuesta de la fila: p en función de q
    const dA = q => (a(0, 0) - a(1, 0)) * q + (a(0, 1) - a(1, 1)) * (1 - q), dB = p => (b(0, 0) - b(0, 1)) * p + (b(1, 0) - b(1, 1)) * (1 - p);
    const N = 400;
    c.strokeStyle = K.amber; c.lineWidth = 3; c.beginPath();
    for (let i = 0; i <= N; i++) { const q = i / N, d = dA(q), p = d > 1e-12 ? 1 : d < -1e-12 ? 0 : .5; i ? c.lineTo(X(q), Y(p)) : c.moveTo(X(q), Y(p)); }
    c.stroke();
    c.strokeStyle = K.teal; c.lineWidth = 3; c.setLineDash([8, 5]); c.beginPath();
    for (let i = 0; i <= N; i++) { const p = i / N, d = dB(p), q = d > 1e-12 ? 1 : d < -1e-12 ? 0 : .5; i ? c.lineTo(X(q), Y(p)) : c.moveTo(X(q), Y(p)); }
    c.stroke(); c.setLineDash([]);
    const dot = (q, p) => { c.fillStyle = K.fg; c.beginPath(); c.arc(X(q), Y(p), 7, 0, 7); c.fill(); c.strokeStyle = K.bg; c.lineWidth = 2; c.stroke(); };
    EQ.pure.forEach(([i, j]) => dot(j === 0 ? 1 : 0, i === 0 ? 1 : 0));
    if (EQ.mixed) dot(EQ.mixed.q, EQ.mixed.p);
  }
}
})();
