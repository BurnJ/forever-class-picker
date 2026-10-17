'use strict';
/* Keybinds plan page: /keybinds/<class>/<spec>. Spellbook on the left, action bars in the middle, the mouse on the right.
   Drag (or click, then click a slot) to place; Keybind mode: hover a button and press a key or mouse button. */

const PLAN_ROWS = 7, PLAN_COLS = 2, PLAN_PER_PAGE = PLAN_ROWS * PLAN_COLS;
let plan = null;  // { cls, spec, layout, id, shared, tab, pageNo, level, page (bar 1 page), picked, bindMode, mouseCapture }

function planPage(cls, spec, query) {
  const got = kbLoadLayout(cls, spec, query);
  if (got.error) { brokenLink(cls, spec, got.error); return; }
  const prevTab = plan && plan.cls === cls ? plan.tab : null;
  plan = { cls, spec, layout: got.layout, id: got.id || null, shared: !!got.shared, tab: prevTab || spec,
    pageNo: 0, level: kbStore.get('kb:planLevel', 60), page: pagesFor(cls)[0], picked: null, bindMode: false, mouseCapture: null, msg: '' };
  if (!SPELLS[cls].lines[plan.tab]) plan.tab = spec in SPELLS[cls].lines ? spec : Object.keys(SPELLS[cls].lines)[0];
  tipCtx = kbTipCtx(cls);
  renderPlan();
}

function brokenLink(cls, spec, error) {
  app.innerHTML = `<main class="kb kb-empty"><div class="panel"><h2>This layout link doesn't work</h2>
    <p>${error === 'version' ? 'It was made with a newer version of this page. Try reloading.' : 'It may have been cut off when it was copied. Ask for the link again.'}</p>
    <p><a class="btn" href="${KB_ROOT}/${cls || ''}${spec ? '/' + spec : ''}">Start your own layout</a></p></div></main>`;
}

const planSave = () => {
  if (plan.shared) return;
  kbSaveLayout(plan.id, plan.layout);
};

function renderPlan() {
  hideTip();
  const { cls, spec, layout } = plan;
  const c = kbClass(cls);
  const mine = kbLayouts().filter(x => x.cls === cls && x.spec === spec);
  app.innerHTML = `<main class="kb kb-plan" ${kbAccent(cls)}>
    <div class="bar kb-top">
      ${kbClassStrip(cls)}
      <h1>${esc(c.name)}</h1>
      ${kbSpecSeg(cls, spec)}
      <span class="gap"></span>
      <a class="btn" href="${KB_ROOT}/${cls}/${spec}/practice${plan.shared ? location.search : ''}">Practice on the dummy</a>
    </div>
    <div class="kb-cols">
      <section class="kb-book" aria-label="Spellbook">${bookHtml()}</section>
      <section class="kb-center" aria-label="Action bars">
        ${plan.shared ? `<div class="kb-shared">You're looking at a shared layout${layout.name ? `: <b>${esc(layout.name)}</b>` : ''}.
          <button type="button" class="btn" data-act="copy">Copy to my layouts</button></div>` : `
        <div class="kb-layoutbar">
          <label class="kb-field">Layout <input id="kb-name" maxlength="40" placeholder="Name this layout" value="${esc(layout.name)}"></label>
          ${mine.length > 1 ? `<select id="kb-pick" aria-label="Saved layouts">${mine.map(x => `<option value="${x.id}"${x.id === plan.id ? ' selected' : ''}>${esc(x.name || 'Unnamed layout')}</option>`).join('')}</select>` : ''}
          <button type="button" class="kb-link" data-act="new">New</button>
          <button type="button" class="kb-link" data-act="delete">Delete</button>
        </div>`}
        <div class="kb-tools">
          <button type="button" class="kb-toggle" data-act="bindmode" aria-pressed="${plan.bindMode}">Keybind mode</button>
          <span class="kb-hint">${plan.bindMode ? 'Hover a button and press a key or mouse button. Right-click clears it.' : plan.picked ? `Click a button to place <b>${esc(plan.picked.a || plan.picked.label)}</b>. Esc cancels.` : 'Drag abilities onto the bars, or click one and then click a button. Right-click a button to empty it.'}</span>
        </div>
        <div class="kb-bars" id="kb-bars">${barsHtml()}</div>
        <div class="kb-barcount">Bars shown
          ${[0, 1, 2, 3, 4, 5].map(n => `<button type="button" data-shown="${n}" aria-pressed="${layout.shown === n}">${n + 1}</button>`).join('')}
        </div>
        <div class="kb-actions">
          <button type="button" class="btn" data-act="share">Copy share link</button>
          <a class="kb-link" href="${KB_ROOT}/${cls}/${spec}/drill${plan.shared ? location.search : ''}">Drill my binds</a>
          <button type="button" class="kb-link" data-act="reset">Clear all</button>
          <span class="kb-msg" id="kb-msg" role="status">${esc(plan.msg)}</span>
        </div>
      </section>
      <section class="kb-mouse" aria-label="Your mouse">${mouseHtml()}</section>
    </div></main>`;
  plan.msg = '';
  wirePlan();
}

/* ---------- spellbook ---------- */
function bookHtml() {
  const { cls, tab, level } = plan;
  const lines = SPELLS[cls].lines;
  const order = kbClass(cls).specs.map(s => s.id).filter(id => lines[id]);
  const list = SPELLS[cls].abilities.filter(a => (a.line || 'general') === tab || (tab === order[0] && !a.line));
  const pages = Math.max(1, Math.ceil(list.length / PLAN_PER_PAGE));
  plan.pageNo = Math.min(plan.pageNo, pages - 1);
  const shown = list.slice(plan.pageNo * PLAN_PER_PAGE, (plan.pageNo + 1) * PLAN_PER_PAGE);
  const placed = new Set();
  for (const arr of [...Object.values(plan.layout.pages), ...Object.values(plan.layout.bars)]) arr.forEach(it => it && it.a && placed.add(it.a));
  return `<label class="kb-level kb-booklevel">Planning for level <input type="range" id="kb-level" min="1" max="60" value="${level}"><b>${level}</b></label>
    <div class="kb-tabs" role="tablist">${order.map(id => `<button type="button" role="tab" data-tab="${id}" aria-selected="${id === tab}">${esc(lines[id])}</button>`).join('')}</div>
    <div class="kb-page">
      <ul class="kb-spells">${shown.map(a => {
        const r = rankAt(a, level), lv = a.ranks[0].level;
        return `<li class="kb-spell${r ? '' : ' later'}${placed.has(a.key) ? ' placed' : ''}" data-pick="${esc(a.key)}" data-ab="${esc(a.name)}" tabindex="0">
          <img src="${kbIcon(a.icon)}" alt="" draggable="false"><span><b>${esc(a.name)}</b><small>${r ? (a.talent ? 'Talent' : a.ranks.length > 1 ? `Rank ${a.ranks.indexOf(r) + 1}` : '') : `Level ${lv}${a.talent ? ' talent' : ''}`}</small></span></li>`;
      }).join('')}</ul>
      <div class="kb-pager"><button type="button" data-pg="-1" ${plan.pageNo ? '' : 'disabled'} aria-label="Previous page">&#9664;</button>
        <span>Page ${plan.pageNo + 1} of ${pages}</span>
        <button type="button" data-pg="1" ${plan.pageNo < pages - 1 ? '' : 'disabled'} aria-label="Next page">&#9654;</button></div>
      <form class="kb-labelform" id="kb-labelform"><input id="kb-labelinput" maxlength="24" placeholder="Potion, mount, macro..." aria-label="Label for a button that isn't an ability">
        <button type="submit" class="kb-link">Add label</button></form>
    </div>`;
}

/* ---------- bars ---------- */
function barsHtml() {
  const { cls, layout } = plan;
  const pages = pagesFor(cls);
  const formName = p => p === 'main' ? (cls === 'rogue' ? 'Normal' : cls === 'druid' ? 'Caster' : 'Normal')
    : (SPELLS[cls].forms.find(f => 'f' + f.id === p) || { name: p }).name;
  const bar = (id, title, items) => `<div class="kb-bar" data-bar="${id}"><span class="kb-barname">${title}</span>
    <div class="kb-row">${items.map((it, i) => kbButton(cls, `${id}:${i}`, it, layout.binds[`${id}:${i}`])).join('')}</div></div>`;
  return `${pages.length > 1 ? `<div class="kb-pages seg" role="group" aria-label="Bar 1 page">${pages.map(p =>
      `<button type="button" data-page="${p}" aria-pressed="${p === plan.page}">${esc(formName(p))}</button>`).join('')}</div>` : ''}
    ${bar('b1', pages.length > 1 ? `Bar 1 &middot; ${esc(formName(plan.page))}` : 'Bar 1', layout.pages[plan.page])}
    ${EXTRA_BARS.slice(0, layout.shown).map((b, i) => bar(b, `Bar ${i + 2}`, layout.bars[b])).join('')}`;
}

/* ---------- mouse ---------- */
function mouseHtml() {
  const { layout, cls } = plan;
  const m = Object.prototype.hasOwnProperty.call(MICE, layout.mouse) ? MICE[layout.mouse] : MICE.keyboard;
  const abilityFor = bind => { const s = bind && slotForBind(layout, bind); const it = s && itemAt(layout, s, plan.page); return it && it.a ? kbAbility(cls, it.a) : null; };
  return `<h2>Your mouse</h2>
    <select id="kb-mouse" aria-label="Mouse">${Object.entries(MICE).map(([id, x]) => `<option value="${id}"${id === layout.mouse ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
    ${m.buttons.length ? `<div class="kb-mousebody"><div class="kb-mgrid" style="--cols:${m.cols}">${m.buttons.map(b => {
      const sends = mouseSends(layout, b), a = abilityFor(sends);
      return `<button type="button" class="kb-mb${plan.mouseCapture === b.id ? ' capture' : ''}" data-mb="${b.id}" ${b.fixed ? 'data-fixed="1"' : ''}
        title="${esc(b.label)}${sends ? ' sends ' + esc(sends) : ''}">
        <span class="n">${esc(b.label)}</span>${a ? `<img src="${kbIcon(a.icon)}" alt="${esc(a.name)}">` : ''}<span class="k">${esc(bindLabel(sends)) || '?'}</span></button>`;
    }).join('')}</div></div>
    <p class="note">${m.buttons.some(b => !b.fixed) ? (plan.mouseCapture ? 'Press the key that button sends (set in your mouse software).' : 'Click a button, then press the key it sends. Most MMO mice send 1 to = out of the box.') : 'These buttons work as Mouse 4 and Mouse 5 binds.'}</p>
    ${m.buttons.some(b => !b.fixed) ? `<button type="button" class="kb-link" data-act="fill">Set to 1 through =</button>` : ''}`
    : '<p class="note">Pick your mouse to see its side buttons here. Mouse 4 and 5 can still be bound with Keybind mode.</p>'}
    <h3>Binds in this layout</h3>
    <ul class="kb-bindlist">${Object.entries(layout.binds).filter(([s]) => itemAt(layout, s, plan.page)).sort((a, b) => a[1].localeCompare(b[1]))
      .map(([s, b]) => { const it = itemAt(layout, s, plan.page); const a = it.a && kbAbility(cls, it.a);
        return `<li><span class="k">${esc(bindLabel(b))}</span>${a ? `<img src="${kbIcon(a.icon)}" alt="">${esc(a.name)}` : esc(it.label)}</li>`; }).join('') || '<li class="note">Nothing bound yet.</li>'}</ul>`;
}

/* ---------- events ---------- */
function setMsg(t) { const el = document.getElementById('kb-msg'); if (el) el.textContent = t; }
function rerenderParts() {
  hideTip();  // the hovered element is about to be replaced
  document.querySelector('.kb-book').innerHTML = bookHtml();
  document.getElementById('kb-bars').innerHTML = barsHtml();
  document.querySelector('.kb-mouse').innerHTML = mouseHtml();
  document.querySelector('.kb-tools .kb-hint').innerHTML = plan.bindMode ? 'Hover a button and press a key or mouse button. Right-click clears it.'
    : plan.picked ? `Click a button to place <b>${esc(plan.picked.a || plan.picked.label)}</b>. Esc cancels.` : 'Drag abilities onto the bars, or click one and then click a button. Right-click a button to empty it.';
  wireBook();
}
function change() { planSave(); rerenderParts(); }

let planKeyHandler = null;
function wirePlan() {
  const root = app.querySelector('.kb-plan');
  root.addEventListener('click', e => {
    if (plan.dragged) { plan.dragged = false; return; }
    const t = e.target.closest('button, [data-pick]');
    if (!t) return;
    if (t.dataset.tab) { plan.tab = t.dataset.tab; plan.pageNo = 0; rerenderParts(); return; }
    if (t.dataset.pg) { plan.pageNo += +t.dataset.pg; rerenderParts(); return; }
    if (t.dataset.page) { plan.page = t.dataset.page; rerenderParts(); return; }
    if (plan.shared && (t.dataset.shown || t.dataset.pick || t.dataset.mb || t.dataset.act === 'fill' || t.dataset.act === 'bindmode' || t.dataset.act === 'reset')) {
      setMsg('This is a shared layout. Copy it to your layouts to change it.'); return;
    }
    if (t.dataset.shown) { plan.layout.shown = +t.dataset.shown; change(); root.querySelectorAll('[data-shown]').forEach(b => b.setAttribute('aria-pressed', b === t)); return; }
    if (t.dataset.pick) { plan.picked = { a: t.dataset.pick }; rerenderParts(); return; }
    if (t.dataset.mb) {
      if (t.dataset.fixed) return;
      plan.mouseCapture = plan.mouseCapture === t.dataset.mb ? null : t.dataset.mb; rerenderParts(); return;
    }
    if (t.dataset.slot) {
      if (plan.bindMode) return;
      if (plan.picked) { place(plan.layout, t.dataset.slot, plan.page, plan.picked); plan.picked = null; change(); }
      return;
    }
    const act = t.dataset.act;
    if (act === 'bindmode') { plan.bindMode = !plan.bindMode; plan.picked = null; t.setAttribute('aria-pressed', plan.bindMode); rerenderParts(); }
    else if (act === 'share') shareLink();
    else if (act === 'reset') { if (t.dataset.sure) { const l = newLayout(plan.cls, plan.spec); l.name = plan.layout.name; l.mouse = plan.layout.mouse; l.mouseKeys = plan.layout.mouseKeys; plan.layout = l; change(); setMsg('Cleared.'); } else { t.dataset.sure = '1'; t.textContent = 'Clear everything? Click again'; } }
    else if (act === 'new') { plan.layout = newLayout(plan.cls, plan.spec); plan.id = kbNewId(); planSave(); renderPlan(); }
    else if (act === 'delete') {
      if (!t.dataset.sure) { t.dataset.sure = '1'; t.textContent = 'Delete this layout? Click again'; return; }
      kbDeleteLayout(plan.id); planPage(plan.cls, plan.spec, new URLSearchParams());
    }
    else if (act === 'copy') { plan.shared = false; plan.id = kbNewId(); planSave(); history.replaceState(null, '', location.pathname); plan.msg = 'Copied to your layouts.'; renderPlan(); }
    else if (act === 'fill') {
      const m = MICE[plan.layout.mouse];
      m.buttons.forEach((b, i) => { if (!b.fixed) plan.layout.mouseKeys[b.id] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='][i] || ''; });
      change();
    }
  });
  root.addEventListener('contextmenu', e => {
    const b = e.target.closest('.kb-btn');
    if (!b) return;
    e.preventDefault();
    if (plan.shared) return;
    if (plan.bindMode) setBind(plan.layout, b.dataset.slot, null); else place(plan.layout, b.dataset.slot, plan.page, null);
    change();
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'kb-mouse' && plan.shared) { e.target.value = plan.layout.mouse; setMsg('This is a shared layout. Copy it to your layouts to change it.'); return; }
    if (e.target.id === 'kb-mouse') { plan.layout.mouse = e.target.value; plan.mouseCapture = null; change(); }
    if (e.target.id === 'kb-pick') { kbStore.set(`kb:cur:${plan.cls}/${plan.spec}`, e.target.value); planPage(plan.cls, plan.spec, new URLSearchParams()); }
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'kb-name') { plan.layout.name = e.target.value; planSave(); }
    if (e.target.id === 'kb-level') {
      plan.level = +e.target.value; kbStore.set('kb:planLevel', plan.level); e.target.nextElementSibling.textContent = plan.level;
      // swap only the list, so the slider being dragged stays put
      const tmp = document.createElement('div');
      tmp.innerHTML = bookHtml();
      document.querySelector('.kb-spells').replaceWith(tmp.querySelector('.kb-spells'));
      wireBook();
    }
  });
  root.addEventListener('submit', e => {
    if (e.target.id !== 'kb-labelform') return;
    e.preventDefault();
    const v = document.getElementById('kb-labelinput').value.trim();
    if (v) { plan.picked = { label: v }; rerenderParts(); }
  });
  // drag: spellbook -> button, button -> button (swap), button -> anywhere else (remove). Pointer events, so touch works too.
  root.addEventListener('pointerdown', e => {
    if (e.button !== 0 || plan.shared || plan.bindMode) return;
    const src = e.target.closest('[data-pick], .kb-btn:not(.empty)');
    if (!src) return;
    const from = src.dataset.pick ? { a: src.dataset.pick } : { slot: src.dataset.slot };
    const icon = src.querySelector('img');
    const x0 = e.clientX, y0 = e.clientY;
    let ghost = null;
    const move = ev => {
      if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
      if (!ghost) {
        ghost = document.createElement('div');
        ghost.className = 'kb-ghost';
        ghost.innerHTML = icon ? `<img src="${icon.getAttribute('src')}" alt="">` : esc(src.textContent.trim().slice(0, 12));
        document.body.appendChild(ghost);
        hideTip();
      }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
    };
    const up = ev => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      if (!ghost) return;  // a plain click: handled by the click listener
      ghost.remove();
      plan.dragged = true;
      setTimeout(() => { plan.dragged = false; }, 0);  // swallow only the click this drag ends with
      const to = document.elementFromPoint(ev.clientX, ev.clientY);
      const btn = to && to.closest('.kb-btn');
      if (from.a && btn) place(plan.layout, btn.dataset.slot, plan.page, { a: from.a });
      else if (from.slot) {
        const it = itemAt(plan.layout, from.slot, plan.page);
        if (btn && btn.dataset.slot !== from.slot) { const other = itemAt(plan.layout, btn.dataset.slot, plan.page); place(plan.layout, btn.dataset.slot, plan.page, it); place(plan.layout, from.slot, plan.page, other); }
        else if (!btn) place(plan.layout, from.slot, plan.page, null);
      }
      change();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  });
  wireBook();
  // keys: Keybind mode binds the hovered button; mouse capture records what a side button sends; Esc cancels
  if (planKeyHandler) { document.removeEventListener('keydown', planKeyHandler, true); document.removeEventListener('mousedown', planKeyHandler, true); document.removeEventListener('wheel', planKeyHandler, true); }
  planKeyHandler = e => {
    if (!document.querySelector('.kb-plan')) { document.removeEventListener('keydown', planKeyHandler, true); document.removeEventListener('mousedown', planKeyHandler, true); document.removeEventListener('wheel', planKeyHandler, true); return; }
    if (e.type === 'keydown' && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.type === 'keydown' && e.code === 'Escape') { plan.picked = null; plan.mouseCapture = null; if (plan.bindMode) { plan.bindMode = false; document.querySelector('[data-act="bindmode"]').setAttribute('aria-pressed', false); } rerenderParts(); return; }
    const bind = bindFromEvent(e);
    if (!bind) return;
    if (plan.mouseCapture && e.type === 'keydown') {
      e.preventDefault();
      if (isMouse(bind)) return;
      plan.layout.mouseKeys[plan.mouseCapture] = bind; plan.mouseCapture = null; change(); return;
    }
    if (!plan.bindMode || plan.shared) return;
    const hovered = document.querySelector('.kb-btn:hover');
    if (!hovered) return;
    e.preventDefault();
    if (isReserved(bind)) { setMsg(`${bind} is kept by the browser, pick another key.`); return; }
    const { cleared } = setBind(plan.layout, hovered.dataset.slot, bind);
    change();
    setMsg(cleared ? `${bindLabel(bind)} moved here from another button.` : `Bound ${bindLabel(bind)}.`);
  };
  document.addEventListener('keydown', planKeyHandler, true);
  document.addEventListener('mousedown', planKeyHandler, true);
  document.addEventListener('wheel', planKeyHandler, { capture: true, passive: false });
  // mouse 4/5 would make the browser go back/forward
  document.addEventListener('mouseup', kbBlockNav, true);
}
function kbBlockNav(e) { if ((e.button === 3 || e.button === 4) && document.querySelector('.kb')) e.preventDefault(); }
function wireBook() {
  const p = plan.picked;
  document.querySelectorAll('.kb-spell').forEach(li => li.classList.toggle('picked', !!p && p.a === li.dataset.pick));
  document.querySelector('.kb-plan').classList.toggle('binding', plan.bindMode);
}

async function shareLink() {
  const url = `${location.origin}${KB_ROOT}/${plan.cls}/${plan.spec}?l=${encode(plan.layout, SPELLS[plan.cls])}`;
  try { await navigator.clipboard.writeText(url); setMsg('Link copied. Paste it in Discord.'); }
  catch { setMsg(url); }
}
