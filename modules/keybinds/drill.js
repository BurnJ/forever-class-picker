'use strict';
/* Keybinds drill: /keybinds/<class>/<spec>/drill. No combat: an ability shows up, press its bind as fast as you can.
   Binds you're slow on or get wrong come up more often. The quickest way to learn a new mouse. */

const DRILL_ROUNDS = 30;
let drill = null;

function drillPage(cls, spec, query) {
  const got = kbLoadLayout(cls, spec, query);
  if (got.error) { brokenLink(cls, spec, got.error); return; }
  stopPractice();
  drillStop();
  const l = got.layout;
  // every bound button holding an ability or an item, on any bar 1 page or extra bar (items are keyed "i:<id>")
  const items = [];
  for (const [slot, bind] of Object.entries(l.binds)) {
    const { bar } = { bar: slot.split(':')[0] };
    const pages = bar === 'b1' ? Object.keys(l.pages) : [null];
    for (const p of pages) {
      const it = itemAt(l, slot, p);
      if (!it || !(it.a || it.i)) continue;
      const key = it.a || 'i:' + it.i;
      const known = items.find(x => x.key === key);
      if (known) { if (!known.binds.includes(bind)) known.binds.push(bind); }  // any of its binds counts
      else items.push({ key, bind, binds: [bind], slot, page: pages.length > 1 && p ? p : null });
    }
  }
  drill = { cls, spec, layout: l, id: got.id, shared: !!got.shared, query: query.toString(), items, stats: {}, round: 0, current: null, shownAt: 0, results: [] };
  tipCtx = kbTipCtx(cls);
  if (layoutHasItems(l)) kbLoadItems().catch(() => {});  // their names and icons, by the time the drill starts
  app.innerHTML = `<main class="kb kb-drill" ${kbAccent(cls)}>${drillTop()}
    <div class="kb-drillbox panel" id="kb-drillbox">${items.length < 2
      ? `<p class="kb-warn">Bind at least two abilities first. <a href="${KB_ROOT}/${cls}/${spec}">Back to the plan</a></p>`
      : `<h2>Drill your binds</h2><p>An ability appears. Press its bind as fast as you can. ${DRILL_ROUNDS} in a row; the ones you miss come back more often.</p>
         <button type="button" class="btn" id="kb-dgo">Start</button>`}</div></main>`;
  const go = document.getElementById('kb-dgo');
  if (go) go.addEventListener('click', drillStart);
}
function drillTop() {
  const { cls, spec } = drill;
  return `<div class="bar kb-top">${kbClassStrip(cls, '/drill')}<h1>${esc(kbClass(cls).name)}</h1>${kbSpecSeg(cls, spec, '/drill')}
    <span class="gap"></span><a class="kb-link" href="${KB_ROOT}/${cls}/${spec}/practice${drill.shared ? '?' + drill.query : ''}">Practice on the dummy</a>
    <a class="kb-link" href="${KB_ROOT}/${cls}/${spec}${drill.shared ? '?' + drill.query : ''}">Back to the plan</a></div>`;
}
function drillStop() { document.removeEventListener('keydown', drillKey, true); document.removeEventListener('mousedown', drillKey, true); document.removeEventListener('wheel', drillKey, true); }

// "f19" -> "Berserker Stance"
const formLabel = (cls, page) => (SPELLS[cls].forms.find(f => 'f' + f.id === page) || { name: cls === 'druid' ? 'caster form' : 'normal' }).name;

function drillStart() {
  drill.round = 0; drill.results = [];
  document.addEventListener('keydown', drillKey, true);
  document.addEventListener('mousedown', drillKey, true);
  document.addEventListener('mouseup', kbBlockNav, true);
  document.addEventListener('wheel', drillKey, { capture: true, passive: false });
  drillNext();
}
// weighted pick: slower and missed binds weigh more; never the same one twice in a row
function drillPick() {
  const w = drill.items.map(it => {
    const s = drill.stats[it.key];
    if (!s) return 2;
    return 1 + s.misses * 1.5 + Math.min(3, s.avg / 700);
  });
  let total = 0;
  const pool = drill.items.map((it, i) => (drill.current && it.key === drill.current.key ? 0 : w[i]));
  pool.forEach(x => { total += x; });
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) { r -= pool[i]; if (r <= 0) return drill.items[i]; }
  return drill.items[0];
}
function drillNext() {
  if (drill.round >= DRILL_ROUNDS) { drillDone(); return; }
  drill.round++;
  drill.current = drillPick();
  drill.wrong = false;
  const a = drillThing(drill.current.key);
  document.getElementById('kb-drillbox').innerHTML = `<div class="kb-prompt">
    <span class="kb-round">${drill.round} / ${DRILL_ROUNDS}</span>
    <span class="frame gold" style="--size:120px"><img src="${kbIcon(a.icon)}" alt=""></span>
    <b>${esc(a.name)}</b>${drill.current.page ? `<span class="note">in ${esc(formLabel(drill.cls, drill.current.page))}</span>` : ''}<span class="kb-dfeedback" id="kb-dfb"></span></div>`;
  drill.shownAt = performance.now();
}
function drillKey(e) {
  if (!document.querySelector('.kb-drill')) { drillStop(); return; }
  if (e.type === 'mousedown' && (e.button === 0 || e.button === 2)) return;
  if (e.type === 'keydown' && e.code === 'Escape') { drillDone(); return; }
  if (!drill.current) return;  // between prompts
  const bind = bindFromEvent(e);
  if (!bind || isReserved(bind) || e.repeat) return;
  e.preventDefault();
  const ms = performance.now() - drill.shownAt;
  const st = drill.stats[drill.current.key] || (drill.stats[drill.current.key] = { tries: 0, misses: 0, avg: 0, n: 0 });
  st.tries++;
  const fb = document.getElementById('kb-dfb');
  if (!drill.current.binds.includes(bind)) {
    st.misses++;
    drill.wrong = true;
    if (fb) { fb.textContent = `That's ${bindLabel(bind)}. It's ${bindLabel(drill.current.bind)}.`; fb.className = 'kb-dfeedback bad'; }
    return;
  }
  st.n++; st.avg += (ms - st.avg) / st.n;
  drill.results.push({ key: drill.current.key, ms, clean: !drill.wrong });
  if (fb) { fb.textContent = `${Math.round(ms)} ms`; fb.className = 'kb-dfeedback good'; }
  drill.current = null;
  setTimeout(drillNext, 350);
}
const drillThing = key => key.startsWith('i:') ? kbItem(+key.slice(2)) : kbAbility(drill.cls, key);
function drillDone() {
  drillStop();
  const r = drill.results;
  const clean = r.filter(x => x.clean).length;
  const avg = r.length ? Math.round(r.reduce((s, x) => s + x.ms, 0) / r.length) : 0;
  const rows = Object.entries(drill.stats).map(([k, s]) => ({ k, s, a: drillThing(k), it: drill.items.find(i => i.key === k) }))
    .sort((x, y) => (y.s.misses - x.s.misses) || (y.s.avg - x.s.avg));
  document.getElementById('kb-drillbox').innerHTML = `<h2>${clean} of ${r.length} first try &middot; ${avg} ms average</h2>
    <h3>Slowest and most missed</h3>
    <ul class="kb-breakdown">${rows.slice(0, 8).map(x => `<li><img src="${kbIcon(x.a.icon)}" alt=""><span>${esc(x.a.name)} <small>${esc(bindLabel(x.it.bind))}</small></span>
      <b>${Math.round(x.s.avg)} ms${x.s.misses ? ` &middot; ${x.s.misses} wrong` : ''}</b></li>`).join('')}</ul>
    <div class="kb-start"><button type="button" class="btn" id="kb-dgo">Again</button></div>`;
  document.getElementById('kb-dgo').addEventListener('click', drillStart);
}
