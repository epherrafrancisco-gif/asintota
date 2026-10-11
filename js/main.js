/* Asíntota · arranque: pestañas de materias y temas, páginas de materia y de herramienta, buscador y portada */
(() => {
const { $, $$, MATS, GROUPS } = A;
const tools = A.ordered();
const byMat = id => tools.filter(t => t.mat === id);
const mat = id => MATS.find(m => m.id === id);
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const unitOf = t => mat(t.mat).units[t.unit - 1];
const mats = MATS.filter(m => byMat(m.id).length);
const TAB = { micro: 'Micro', macro: 'Macro', juegos: 'Juegos', algebra: 'Álgebra', io: 'Inv. Operativa' };

/* ---------- Pestañas de materias ---------- */
$('#mats-nav').innerHTML = `<button data-go="inicio" data-mat="">Inicio</button>` + GROUPS.map(g => '<span class="sep" aria-hidden="true"></span>' + mats.filter(m => m.group === g.id).map(m => `<button data-go="mat-${m.id}" data-mat="${m.id}" title="${m.name}">${TAB[m.id] || m.name}</button>`).join('')).join('');

/* ---------- Páginas de materia ---------- */
$('#matviews').innerHTML = mats.map(m => {
  const ts = byMat(m.id);
  const units = m.units.map((u, i) => {
    const us = ts.filter(t => t.unit === i + 1); if (!us.length) return '';
    return `<div class="punit"><h3>Unidad ${i + 1} · <b>${u}</b></h3><div class="topics">${us.map(t => `<button class="topic" data-go="${t.id}"><h4>${t.name}</h4><p>${t.desc}</p><span class="f">${t.f}</span></button>`).join('')}</div></div>`;
  }).join('');
  return `<section id="v-mat-${m.id}" data-view hidden>
    <div class="crumb"><button data-go="inicio">Inicio</button><span>›</span><span style="color:var(--fg)">${m.name}</span></div>
    <h1 style="font-size:clamp(30px,4.4vw,46px)">${m.name}</h1>
    <p class="lead">${m.blurb} ${ts.length} temas en ${new Set(ts.map(t => t.unit)).size} unidades: elegí uno para empezar.</p>
    <div class="prog">${units}</div>
  </section>`;
}).join('');

/* ---------- Páginas de herramientas ---------- */
const holder = $('#tools');
tools.forEach(t => {
  const m = mat(t.mat), sib = byMat(t.mat), i = sib.indexOf(t), prev = sib[i - 1], next = sib[i + 1];
  const el = document.createElement('section');
  el.id = 'v-' + t.id; el.dataset.view = ''; el.hidden = true;
  el.innerHTML = `<div class="tool-head">
      <div class="crumb"><button data-go="inicio">Inicio</button><span>›</span><button data-go="mat-${m.id}">${m.name}</button><span>›</span><span>Unidad ${t.unit}: ${unitOf(t)}</span></div>
      <h2>${t.name}</h2><p class="lead">${t.lead}</p>
    </div>${t.body}
    <nav class="pager">${prev ? `<button data-go="${prev.id}">← Tema anterior<b>${prev.short || prev.name}</b></button>` : `<button data-go="mat-${m.id}">← Volver a<b>${m.name}</b></button>`}${next ? `<button class="nx" data-go="${next.id}">Tema siguiente →<b>${next.short || next.name}</b></button>` : ''}</nav>`;
  holder.appendChild(el);
});
tools.forEach(t => {
  try { t.init && t.init(); } catch (e) { console.error('Error al iniciar', t.id, e); }
  if (t.draw) A.redraw[t.id] = t.draw;
});
A.greek();

/* ---------- Portada ---------- */
$('#areas').innerHTML = GROUPS.map(g => {
  const ms = mats.filter(m => m.group === g.id);
  return `<div class="area"><div class="area-h"><h2>${g.name}</h2><small>${ms.length} materias</small></div><div class="mats">${ms.map(m => { const ts = byMat(m.id); return `<button class="mat" data-go="mat-${m.id}"><h3>${m.name}</h3><p>${m.blurb}</p><ul>${ts.slice(0, 4).map(t => `<li>${t.short || t.name}</li>`).join('')}${ts.length > 4 ? `<li>y ${ts.length - 4} temas más</li>` : ''}</ul><span class="go">Entrar (${ts.length} temas) →</span></button>`; }).join('')}</div></div>`;
}).join('');
$('#h-stats').innerHTML = `<div><b>${mats.length}</b><span>materias</span></div><div><b>${tools.length}</b><span>herramientas</span></div><div><b>100%</b><span>gratis, sin registrarse</span></div>`;

/* ---------- Navegación ---------- */
A.onRoute = (id, t, m) => {
  $$('#mats-nav button').forEach(b => b.setAttribute('aria-current', String((b.dataset.mat || '') === (m || '') && Boolean(m || id === 'inicio'))));
  const wrap = $('#topics-wrap');
  if (m) {
    wrap.hidden = false;
    $('#topics-nav').innerHTML = `<button data-go="mat-${m}" aria-current="${!t}">Todos los temas</button>` + byMat(m).map(x => `<button data-go="${x.id}" aria-current="${t === x}">${x.short || x.name}</button>`).join('');
    const cur = $('#topics-nav [aria-current="true"]'); if (cur) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  } else wrap.hidden = true;
  const tab = $(`#mats-nav [data-mat="${m || ''}"]`); if (tab) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  document.title = t ? `${t.short || t.name} · Asíntota` : m ? `${mat(m).name} · Asíntota` : 'Asíntota';
};
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); closePal(); A.go(g.dataset.go); }
});
let rz; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => A.redraw[A.current] && A.redraw[A.current]()); });

/* ---------- Buscador ---------- */
const pal = $('#pal'), q = $('#pal-q'), list = $('#pal-list');
const index = [...mats.map(m => ({ id: 'mat-' + m.id, t: m.name, s: 'Materia', k: norm(m.name + ' ' + m.units.join(' ')) })),
  ...tools.map(t => ({ id: t.id, t: t.name, s: mat(t.mat).name, k: norm(t.name + ' ' + (t.short || '') + ' ' + t.tag + ' ' + t.desc + ' ' + mat(t.mat).name + ' ' + unitOf(t)) }))];
let sel = 0, res = [];
function search() {
  const terms = norm(q.value).split(/\s+/).filter(Boolean);
  res = terms.length ? index.filter(r => terms.every(w => r.k.includes(w))).sort((a, b) => norm(b.t).includes(terms[0]) - norm(a.t).includes(terms[0])) : index.slice(0, mats.length);
  sel = 0; paint();
}
function paint() {
  list.innerHTML = res.length ? res.slice(0, 40).map((r, i) => `<button role="option" data-go="${r.id}" aria-selected="${i === sel}">${r.t}<small>${r.s}</small></button>`).join('') : '<div class="pal-empty">No encontré ese tema. Probá con otra palabra.</div>';
  const c = list.querySelector('[aria-selected="true"]'); if (c) c.scrollIntoView({ block: 'nearest' });
}
function openPal() { pal.hidden = false; q.value = ''; search(); setTimeout(() => q.focus(), 10); }
function closePal() { pal.hidden = true; }
$('#search-btn').onclick = openPal; $('#hero-search').onclick = openPal;
pal.addEventListener('click', e => { if (e.target === pal) closePal(); });
q.addEventListener('input', search);
q.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { sel = Math.min(res.length - 1, sel + 1); paint(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
  if (e.key === 'Enter' && res[sel]) { closePal(); A.go(res[sel].id); }
  if (e.key === 'Escape') closePal();
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPal() : closePal(); }
  else if (e.key === 'Escape' && !pal.hidden) closePal();
});

A.go((location.hash || '').slice(1) || 'inicio');
})();
