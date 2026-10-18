'use strict';
/* Keybinds plan page: /keybinds/<class>/<spec>. The game's spellbook on the left (one page, or both pages when
   expanded; an Items tab for potions, food, trinkets...), the game screen with the bars on the right, the mouse and
   the bind list under it. Drag (or click, then click a slot) to place; Keybind mode: hover a button and press a key
   or mouse button. Edit Mode: the screen fills the page, bars move and change shape as in the game's Edit Mode. */

const BOOK_COLS = 3;  // abilities per row on a page, as in game (more when the page is wide, fewer when it's narrow)
// both pages open only where they fit beside the bars
const bookOpen = () => plan.expanded && innerWidth >= 1600;
let plan = null;  // { cls, spec, layout, id, shared, tab, pageNo, perPage, search, expanded, level, page (bar 1 page), picked, bindMode, mouseCapture,
                  //   editMode, selBar (Edit Mode's selected bar or frame), itemCat, screen (a SCREENS key) }
const ITEM_TAB_ICON = 134834;  // Major Healing Potion
const CLASS_BIT = { warrior: 1, paladin: 2, hunter: 3, rogue: 4, priest: 5, shaman: 7, mage: 8, warlock: 9, druid: 11 };  // ChrClasses ids

function planPage(cls, spec, query) {
  const got = kbLoadLayout(cls, spec, query);
  if (got.error) { brokenLink(cls, spec, got.error); return; }
  const prevTab = plan && plan.cls === cls ? plan.tab : null;
  plan = { cls, spec, layout: got.layout, id: got.id || null, shared: !!got.shared, tab: prevTab || spec,
    pageNo: 0, perPage: BOOK_COLS * 6, search: '', expanded: kbStore.get('kb:bookExpanded', false),
    level: kbStore.get('kb:planLevel', 60), page: pagesFor(cls)[0], picked: null, bindMode: false, mouseCapture: null, msg: '',
    editMode: false, selBar: null, itemCat: 'Potions', screen: SCREENS[kbStore.get('kb:screen', '')] ? kbStore.get('kb:screen', '') : '1920x1080' };
  if (plan.tab !== 'general' && plan.tab !== 'items' && !SPELLS[cls].lines[plan.tab]) plan.tab = spec in SPELLS[cls].lines ? spec : Object.keys(SPELLS[cls].lines)[0];
  tipCtx = kbTipCtx(cls);
  renderPlan();
  // items on the bars need the item list for their icons
  if (layoutHasItems(plan.layout) || plan.tab === 'items') itemsArrived();
}
function itemsArrived() {
  kbLoadItems().then(() => { if (!plan || !document.querySelector('.kb-plan')) return; kbTipItems(tipCtx.abilities); rerenderParts(); })
    .catch(() => setMsg('The item list didn\'t load. Check your connection and reload.'));
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
  app.innerHTML = `<main class="kb kb-plan${plan.editMode ? ' editing' : ''}" ${kbAccent(cls)}>
    <div class="bar kb-top">
      ${kbClassStrip(cls)}
      <h1>${esc(c.name)}</h1>
      ${kbSpecSeg(cls, spec)}
      <span class="gap"></span>
      <a class="btn" href="${KB_ROOT}/${cls}/${spec}/practice${plan.shared ? location.search : ''}">Practice on the dummy</a>
    </div>
    <div class="kb-cols">
      <section class="kb-book${bookOpen() ? ' expanded' : ''}" aria-label="Spellbook">${bookHtml()}</section>
      <div class="kb-right">
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
          <button type="button" class="kb-toggle" data-act="editmode" aria-pressed="${plan.editMode}">Edit Mode</button>
          <span class="kb-hint">${hintText()}</span>
          ${plan.editMode ? `<label class="kb-field kb-aspect">Screen <select id="kb-screen">${Object.keys(SCREENS).map(k => `<option value="${k}"${k === plan.screen ? ' selected' : ''}>${k.replace('x', ' × ')}</option>`).join('')}</select></label>` : ''}
        </div>
        <div class="kb-screenwrap" id="kb-bars">${barsHtml()}</div>
        <div class="kb-actions">
          <button type="button" class="btn" data-act="share">Copy share link</button>
          <button type="button" class="btn" data-act="export">Put it in the game</button>
          <a class="kb-link" href="${KB_ROOT}/${cls}/${spec}/drill${plan.shared ? location.search : ''}">Drill my binds</a>
          <button type="button" class="kb-link" data-act="reset">Clear all</button>
          <span class="kb-msg" id="kb-msg" role="status">${esc(plan.msg)}</span>
        </div>
      </section>
      <section class="kb-mouse" aria-label="Your mouse">${mouseHtml()}</section>
      </div>
    </div>${plan.exportOpen ? exportHtml() : ''}</main>`;
  plan.msg = '';
  wirePlan();
  fitBook();
  fitPlanScreen();
}
function hintText() {
  if (plan.editMode) return 'Drag a bar to move it. Click a bar to change its shape and when it shows.';
  if (plan.bindMode) return 'Hover a button and press a key or mouse button. Right-click clears it.';
  const p = plan.picked;
  if (p) return `Click a button to place <b>${esc(p.a || (p.i ? kbItem(p.i).name : p.label))}</b>. Esc cancels.`;
  return 'Drag abilities onto the bars, or click one and then click a button. Right-click a button to empty it.';
}
addEventListener('resize', () => {
  if (!plan || !document.querySelector('.kb-plan')) return;
  fitPlanScreen();
  const book = document.querySelector('.kb-book');
  if (book.classList.contains('expanded') !== bookOpen()) { book.classList.toggle('expanded', bookOpen()); book.innerHTML = bookHtml(); wireBook(); }
  fitBook();
});

/* ---------- spellbook (the game's: tabs, one parchment page or two, three columns, page arrows) ---------- */
function bookList() {
  const { cls, tab } = plan;
  const q = plan.search.trim().toLowerCase();
  if (tab === 'items') {
    if (!window.ITEMS) return [];
    const bit = 1 << (CLASS_BIT[cls] - 1);
    const mine = ITEMS.items.filter(x => !x.cls || (x.cls & bit));
    return q ? mine.filter(x => x.name.toLowerCase().includes(q)) : mine.filter(x => x.cat === plan.itemCat);
  }
  const all = SPELLS[cls].abilities;
  if (q) return all.filter(a => a.name.toLowerCase().includes(q));
  return all.filter(a => (a.line || 'general') === tab);
}
function itemEntry(x, placed) {
  const later = x.lvl > plan.level;
  return `<li class="kb-spell q${x.q}${later ? ' later' : ''}${placed.has('i' + x.id) ? ' placed' : ''}" data-pick="" data-item="${x.id}" data-ab="${esc(x.name)}" tabindex="0">
    <span class="kb-sframe"><img src="${kbIcon(x.icon)}" alt="" draggable="false"></span>
    <span class="kb-stext"><b>${esc(x.name)}</b>${x.lvl ? `<small>Level ${x.lvl}</small>` : ''}</span></li>`;
}
function bookEntry(a, placed) {
  const r = rankAt(a, plan.level), lv = a.ranks[0].level;
  const sub = !r ? `Level ${lv}${a.talent ? ' talent' : ''}` : a.talent ? 'Talent' : a.races ? a.races.join(', ') : a.ranks.length > 1 ? `Rank ${a.ranks.indexOf(r) + 1}` : '';
  return `<li class="kb-spell${r ? '' : ' later'}${placed.has(a.key) ? ' placed' : ''}" data-pick="${esc(a.key)}" data-ab="${esc(a.name)}" tabindex="0">
    <span class="kb-sframe"><img src="${kbIcon(a.icon)}" alt="" draggable="false"></span>
    <span class="kb-stext"><b>${esc(a.name)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></li>`;
}
function bookHtml() {
  const { cls, tab, level } = plan;
  const lines = SPELLS[cls].lines;
  const T = window.TALENTS && TALENTS[cls];
  const order = kbClass(cls).specs.map(s => s.id).filter(id => lines[id]);
  const tabs = [{ id: 'general', name: 'General', icon: 135274 },
    ...order.map(id => ({ id, name: lines[id], icon: (T && findTree(T, id) || {}).icon })),
    { id: 'items', name: 'Items', icon: ITEM_TAB_ICON }];
  const list = bookList();
  const per = plan.perPage * (bookOpen() ? 2 : 1);
  const pages = Math.max(1, Math.ceil(list.length / per));
  plan.pageNo = Math.min(plan.pageNo, pages - 1);
  const shown = list.slice(plan.pageNo * per, (plan.pageNo + 1) * per);
  const placed = new Set();
  for (const arr of [...Object.values(plan.layout.pages), ...Object.values(plan.layout.bars)])
    arr.forEach(it => { if (it && it.a) placed.add(it.a); if (it && it.i) placed.add('i' + it.i); });
  const items = tab === 'items';
  const title = plan.search.trim() ? 'Search' : (tabs.find(t => t.id === tab) || tabs[0]).name;
  const leaf = list => `<ul class="kb-spells">${list.map(a => items ? itemEntry(a, placed) : bookEntry(a, placed)).join('')}</ul>`;
  const cats = items && window.ITEMS && !plan.search.trim() ? `<select class="kb-sb-cat" id="kb-itemcat" aria-label="Item category">${ITEMS.categories.map(c =>
    `<option${c === plan.itemCat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>` : '';
  return `<div class="kb-sb-top">
      <span class="kb-sb-portrait"><img src="icons/${cls}.png" alt=""></span>
      <span class="kb-sb-title">Spellbook</span>
      <button type="button" class="kb-sb-expand" data-act="expand" aria-pressed="${plan.expanded}" title="${plan.expanded ? 'One page' : 'Both pages'}">${plan.expanded ? '&#8601;' : '&#8599;'}</button>
      <div class="kb-sb-tabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" data-tab="${t.id}" aria-selected="${!plan.search && t.id === tab}" title="${esc(t.name)}">
        ${t.icon ? `<img src="${kbIcon(t.icon)}" alt="${esc(t.name)}">` : esc(t.name.slice(0, 2))}</button>`).join('')}</div>
      <label class="kb-level kb-booklevel">Level <input type="range" id="kb-level" min="1" max="60" value="${level}"><b>${level}</b></label>
      <input class="kb-sb-search" id="kb-search" type="search" placeholder="${items ? 'Search items' : 'Search abilities'}" value="${esc(plan.search)}" aria-label="${items ? 'Search items' : 'Search abilities'}">
    </div>
    <div class="kb-sb-pages">
      <div class="kb-page"><h2 class="kb-sb-h">${esc(title)}${cats}</h2>${leaf(shown.slice(0, plan.perPage))}
        ${list.length ? '' : `<p class="kb-sb-none">${items && !window.ITEMS ? 'Loading items...' : 'Nothing matches.'}</p>`}</div>
      ${bookOpen() ? `<div class="kb-page right"><div class="kb-sb-h"></div>${leaf(shown.slice(plan.perPage))}</div>` : ''}
    </div>
    <div class="kb-sb-foot">
      <form class="kb-labelform" id="kb-labelform"><input id="kb-labelinput" maxlength="24" placeholder="Potion, mount, macro..." aria-label="Label for a button that isn't an ability">
        <button type="submit" class="kb-link">Add label</button></form>
      <div class="kb-pager"><span>Page ${plan.pageNo + 1}/${pages}</span>
        <button type="button" data-pg="-1" ${plan.pageNo ? '' : 'disabled'} aria-label="Previous page">&#9664;</button>
        <button type="button" data-pg="1" ${plan.pageNo < pages - 1 ? '' : 'disabled'} aria-label="Next page">&#9654;</button></div>
    </div>`;
}
// How many abilities fit on one page at this window size: whole rows of three.
function fitBook() {
  const ul = document.querySelector('.kb-book .kb-page .kb-spells');
  if (!ul) return;
  const li = ul.querySelector('.kb-spell');
  const gap = parseFloat(getComputedStyle(ul).rowGap) || 0;
  const rowH = li ? li.getBoundingClientRect().height + gap : 64;
  const rows = Math.max(3, Math.floor((ul.clientHeight + gap) / rowH));
  const cols = getComputedStyle(ul).gridTemplateColumns.split(' ').filter(Boolean).length || BOOK_COLS;  // as many as the page fits
  if (rows * cols !== plan.perPage) {
    plan.perPage = rows * cols;
    document.querySelector('.kb-book').innerHTML = bookHtml();
    wireBook();
  }
}

/* ---------- the screen with the bars ---------- */
function barsHtml() {
  const { cls, layout } = plan;
  const pages = pagesFor(cls);
  const formName = p => p === 'main' ? (cls === 'druid' ? 'Caster' : 'Normal')
    : (SPELLS[cls].forms.find(f => 'f' + f.id === p) || { name: p }).name;
  return `${pages.length > 1 && !plan.editMode ? `<div class="kb-pages seg" role="group" aria-label="Bar 1 page"><span>Bar 1 shows</span>${pages.map(p =>
      `<button type="button" data-page="${p}" aria-pressed="${p === plan.page}">${esc(formName(p))}</button>`).join('')}</div>` : ''}
    ${screenHtml(layout, cls, { page: plan.page, edit: plan.editMode, selected: plan.selBar, screen: SCREENS[plan.screen] })}
    ${plan.editMode && plan.selBar ? geoPanelHtml(plan.selBar) : ''}`;
}
// Edit Mode's settings window for one bar, with the game's own settings and ranges
function geoPanelHtml(id) {
  if (FRAMES[id]) return `<div class="kb-gpanel" role="dialog" aria-label="${FRAMES[id].name}">
    <div class="kb-gpanel-h"><b>${FRAMES[id].name}</b><button type="button" class="kb-gclose" data-act="unselect" aria-label="Close">&times;</button></div>
    <p class="note">Drag it to move it. ${plan.layout.frames[id] ? 'It goes in the import at this spot.' : 'It stays where the game puts it until you move it.'}</p>
    <div class="kb-gpanel-f"><button type="button" class="kb-link" data-act="resetbar">Reset to default position</button></div>
  </div>`;
  const g = plan.layout.geo[id];
  const small = id === 'stance' || id === 'pet';
  const range = (k, label, min, max, step, unit = '') => `<label class="kb-gset"><span>${label}</span>
    <input type="range" data-gset="${k}" min="${min}" max="${max}" step="${step}" value="${g[k]}"><b>${g[k]}${unit}</b></label>`;
  return `<div class="kb-gpanel" role="dialog" aria-label="${BAR_NAMES[id]} settings">
    <div class="kb-gpanel-h"><b>${BAR_NAMES[id]}</b><button type="button" class="kb-gclose" data-act="unselect" aria-label="Close">&times;</button></div>
    ${small ? '<p class="note">Drag it to move it. Its buttons come from your class.</p>' : `
    <label class="kb-gset"><span>Orientation</span><select data-gset="vertical"><option value="0"${g.vertical ? '' : ' selected'}>Horizontal</option><option value="1"${g.vertical ? ' selected' : ''}>Vertical</option></select></label>
    ${range('rows', g.vertical ? '# of Columns' : '# of Rows', 1, 4, 1)}
    ${range('icons', '# of Icons', 6, 12, 1)}
    ${range('size', 'Icon Size', 50, 200, 10, '%')}
    ${range('pad', 'Icon Padding', 2, 10, 1)}
    ${id === 'b1' ? '' : `<label class="kb-gset"><span>Bar Visible</span><select data-gset="vis">${[['always', 'Always'], ['combat', 'In Combat'], ['ooc', 'Out of Combat'], ['hidden', 'Hidden']].map(([v, t]) =>
      `<option value="${v}"${g.vis === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`}`}
    <div class="kb-gpanel-f"><button type="button" class="kb-link" data-act="resetbar">Reset to default position</button></div>
  </div>`;
}
function redrawScreen() {
  hideTip();
  const wrap = document.getElementById('kb-bars');
  wrap.innerHTML = barsHtml();
  fitPlanScreen();
}
// Edit Mode's screen fits the window's height too
function fitPlanScreen() {
  const el = document.querySelector('.kb-plan .kb-screen');
  if (!el) return;
  fitScreen(el, plan.editMode ? Math.max(300, innerHeight - 190) : Math.max(260, innerHeight - 340));
  // and smaller still if the page would scroll
  const over = document.documentElement.scrollHeight - innerHeight;
  if (over > 0) fitScreen(el, Math.max(240, el.getBoundingClientRect().height - over));
}

/* ---------- mouse ---------- */
function mouseHtml() {
  const { layout, cls } = plan;
  const m = Object.prototype.hasOwnProperty.call(MICE, layout.mouse) ? MICE[layout.mouse] : MICE.keyboard;
  const abilityFor = bind => { const s = bind && slotForBind(layout, bind); const t = s && kbSlotThing(cls, itemAt(layout, s, plan.page)); return t && t.icon ? t : null; };
  return `<div class="kb-mouse-a"><h2>Your mouse</h2>
    <select id="kb-mouse" aria-label="Mouse">${Object.entries(MICE).map(([id, x]) => `<option value="${id}"${id === layout.mouse ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
    ${m.buttons.length ? `<div class="kb-mousebody"><div class="kb-mgrid" style="--cols:${m.cols}">${m.buttons.map(b => {
      const sends = mouseSends(layout, b), a = abilityFor(sends);
      return `<button type="button" class="kb-mb${plan.mouseCapture === b.id ? ' capture' : ''}" data-mb="${b.id}" ${b.fixed ? 'data-fixed="1"' : ''}
        title="${esc(b.label)}${sends ? ' sends ' + esc(sends) : ''}">
        <span class="n">${esc(b.label)}</span>${a ? `<img src="${kbIcon(a.icon)}" alt="${esc(a.name)}">` : ''}<span class="k">${esc(bindLabel(sends)) || '?'}</span></button>`;
    }).join('')}</div></div>
    <p class="note">${m.buttons.some(b => !b.fixed) ? (plan.mouseCapture ? 'Press the key that button sends (set in your mouse software).' : 'Click a button, then press the key it sends. Most MMO mice send 1 to = out of the box.') : 'These buttons work as Mouse 4 and Mouse 5 binds.'}</p>
    ${m.buttons.some(b => !b.fixed) ? `<button type="button" class="kb-link" data-act="fill">Set to 1 through =</button>` : ''}`
    : '<p class="note">Pick your mouse to see its side buttons here. Mouse 4 and 5 can still be bound with Keybind mode.</p>'}</div>
    <div class="kb-mouse-b"><h3>Binds in this layout</h3>
    <ul class="kb-bindlist">${Object.entries(layout.binds).filter(([s]) => itemAt(layout, s, plan.page)).sort((a, b) => a[1].localeCompare(b[1]))
      .map(([s, b]) => { const t = kbSlotThing(cls, itemAt(layout, s, plan.page)) || { name: '?' };
        return `<li><span class="k">${esc(bindLabel(b))}</span>${t.icon ? `<img src="${kbIcon(t.icon)}" alt="">` : ''}${esc(t.name)}</li>`; }).join('') || '<li class="note">Nothing bound yet.</li>'}</ul></div>`;
}

/* ---------- events ---------- */
function setMsg(t) { const el = document.getElementById('kb-msg'); if (el) el.textContent = t; }
function rerenderParts() {
  hideTip();  // the hovered element is about to be replaced
  requestAnimationFrame(() => { if (document.querySelector('.kb-plan')) fitBook(); });
  document.querySelector('.kb-book').innerHTML = bookHtml();
  redrawScreen();
  document.querySelector('.kb-mouse').innerHTML = mouseHtml();
  document.querySelector('.kb-tools .kb-hint').innerHTML = hintText();
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
    if (t.dataset.tab) { plan.tab = t.dataset.tab; plan.pageNo = 0; plan.search = ''; rerenderParts(); if (plan.tab === 'items' && !window.ITEMS) itemsArrived(); return; }
    if (t.dataset.act === 'expand') {
      plan.expanded = !plan.expanded; plan.pageNo = 0; kbStore.set('kb:bookExpanded', plan.expanded);
      document.querySelector('.kb-book').classList.toggle('expanded', bookOpen()); rerenderParts(); return;
    }
    if (t.dataset.pg) { plan.pageNo += +t.dataset.pg; rerenderParts(); return; }
    if (t.dataset.page) { plan.page = t.dataset.page; rerenderParts(); return; }
    if (plan.shared && (t.dataset.pick != null || t.dataset.mb || ['fill', 'bindmode', 'editmode', 'reset'].includes(t.dataset.act))) {
      setMsg('This is a shared layout. Copy it to your layouts to change it.'); return;
    }
    if (t.dataset.item) { plan.picked = { i: +t.dataset.item }; rerenderParts(); return; }
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
    if (act === 'bindmode') { plan.bindMode = !plan.bindMode; plan.editMode = false; plan.picked = null; renderPlan(); }
    else if (act === 'editmode') { plan.editMode = !plan.editMode; plan.bindMode = false; plan.picked = null; plan.selBar = null; renderPlan(); }
    else if (act === 'unselect') { plan.selBar = null; redrawScreen(); }
    else if (act === 'resetbar' && plan.selBar) {
      if (FRAMES[plan.selBar]) delete plan.layout.frames[plan.selBar];
      else { const d = defaultGeo()[plan.selBar], g = plan.layout.geo[plan.selBar]; Object.assign(g, { point: d.point, x: d.x, y: d.y }); }
      planSave(); redrawScreen();
    }
    else if (act === 'share') shareLink();
    else if (act === 'export') { plan.exportOpen = !plan.exportOpen; renderPlan(); }
    else if (act === 'copyem') copyText('kb-emstr', 'Copied. Paste it in Edit Mode → Import.');
    else if (act === 'copyfkb') copyText('kb-fkbstr', 'Copied. In game, type /fkb and paste it.');
    else if (act === 'printsheet') { document.body.classList.add('kb-printing'); print(); document.body.classList.remove('kb-printing'); }
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
    if (plan.shared || plan.editMode) return;
    if (plan.bindMode) setBind(plan.layout, b.dataset.slot, null); else place(plan.layout, b.dataset.slot, plan.page, null);
    change();
  });
  root.addEventListener('change', e => {
    if (e.target.id === 'kb-mouse' && plan.shared) { e.target.value = plan.layout.mouse; setMsg('This is a shared layout. Copy it to your layouts to change it.'); return; }
    if (e.target.id === 'kb-mouse') { plan.layout.mouse = e.target.value; plan.mouseCapture = null; change(); }
    if (e.target.id === 'kb-pick') { kbStore.set(`kb:cur:${plan.cls}/${plan.spec}`, e.target.value); planPage(plan.cls, plan.spec, new URLSearchParams()); }
    if (e.target.id === 'kb-itemcat') { plan.itemCat = e.target.value; plan.pageNo = 0; rerenderParts(); }
    if (e.target.id === 'kb-screen') { plan.screen = e.target.value; kbStore.set('kb:screen', plan.screen); redrawScreen(); }
    if (e.target.dataset.gset === 'vertical' || e.target.dataset.gset === 'vis') setGeo(e.target);
  });
  root.addEventListener('input', e => {
    if (e.target.id === 'kb-name') { plan.layout.name = e.target.value; planSave(); }
    if (e.target.dataset.gset && e.target.type === 'range') setGeo(e.target);
    if (e.target.id === 'kb-search') {
      plan.search = e.target.value; plan.pageNo = 0;
      const pos = e.target.selectionStart;
      document.querySelector('.kb-book').innerHTML = bookHtml(); wireBook();
      const box = document.getElementById('kb-search'); box.focus(); box.setSelectionRange(pos, pos);
    }
    if (e.target.id === 'kb-level') {
      plan.level = +e.target.value; kbStore.set('kb:planLevel', plan.level); e.target.nextElementSibling.textContent = plan.level;
      // swap only the list, so the slider being dragged stays put
      const tmp = document.createElement('div');
      tmp.innerHTML = bookHtml();
      const fresh = tmp.querySelectorAll('.kb-spells');
      document.querySelectorAll('.kb-book .kb-spells').forEach((ul, i) => fresh[i] && ul.replaceWith(fresh[i]));
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
    if (plan.editMode) { const sel = e.target.closest('.kb-xsel'); if (sel) moveBar(e, sel.dataset.geo || sel.dataset.frame, sel.parentElement); return; }
    const src = e.target.closest('[data-pick], .kb-btn:not(.empty)');
    if (!src) return;
    const from = src.dataset.item ? { i: +src.dataset.item } : src.dataset.pick ? { a: src.dataset.pick } : { slot: src.dataset.slot };
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
      else if (from.i && btn) place(plan.layout, btn.dataset.slot, plan.page, { i: from.i });
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
    if (e.type === 'keydown' && e.code === 'Escape' && plan.exportOpen) { plan.exportOpen = false; renderPlan(); return; }
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
  document.querySelectorAll('.kb-spell').forEach(li => li.classList.toggle('picked', !!p && (li.dataset.item ? p.i === +li.dataset.item : p.a === li.dataset.pick)));
  document.querySelector('.kb-plan').classList.toggle('binding', plan.bindMode);
}

/* ---------- Edit Mode: move a bar, change its settings ---------- */
function setGeo(input) {
  const g = plan.layout.geo[plan.selBar];
  if (!g) return;
  const k = input.dataset.gset;
  g[k] = k === 'vertical' ? input.value === '1' : k === 'vis' ? input.value : +input.value;
  if (k === 'icons' || k === 'rows') g.rows = Math.min(g.rows, g.icons);
  planSave();
  if (input.type === 'range') {  // keep the slider being dragged: redraw the screen only
    input.nextElementSibling.textContent = g[k] + (k === 'size' ? '%' : '');
    const scr = document.querySelector('.kb-plan .kb-screen');
    const tmp = document.createElement('div');
    tmp.innerHTML = screenHtml(plan.layout, plan.cls, { page: plan.page, edit: true, selected: plan.selBar, screen: SCREENS[plan.screen] });
    scr.replaceWith(tmp.firstElementChild);
    fitPlanScreen();
  } else redrawScreen();
}
// Drag a bar or another frame (geo.js FRAMES) on the Edit Mode screen; a click without moving selects it.
function moveBar(e, id, barEl) {
  const el = document.querySelector('.kb-plan .kb-screen');
  const s = parseFloat(el.style.getPropertyValue('--s')) || 1;
  const scr = screenSize(SCREENS[plan.screen].aspect, SCREENS[plan.screen].h);
  const rects = [...barRects(plan.layout, plan.cls, scr, true), ...frameRects(plan.layout, plan.cls, scr)];
  const me = rects.find(r => r.id === id);
  const others = rects.filter(r => r.id !== id && !(r.g && r.g.vis === 'hidden')).map(r => r.rect);
  const x0 = e.clientX, y0 = e.clientY;
  let moved = false, rect = me.rect;
  const move = ev => {
    if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
    moved = true;
    rect = snap({ l: me.rect.l + (ev.clientX - x0) / s, b: me.rect.b - (ev.clientY - y0) / s, w: me.rect.w, h: me.rect.h }, others, scr);
    barEl.style.left = `calc(var(--s) * ${rect.l}px)`; barEl.style.bottom = `calc(var(--s) * ${rect.b}px)`;
  };
  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    plan.selBar = id;
    if (moved) {
      if (FRAMES[id]) plan.layout.frames[id] = toAnchor(rect, scr);
      else Object.assign(plan.layout.geo[id], toAnchor(rect, scr));
      planSave();
      plan.dragged = true; setTimeout(() => { plan.dragged = false; }, 0);
    }
    redrawScreen();
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

/* ---------- Put it in the game: Edit Mode's import string and the keys to set by hand ---------- */
// what the game's Key Bindings window calls a slot's button
const bindName = (bar, n) => bar === 'b1' ? `Action Button ${n}` : `${BAR_NAMES[bar]} Button ${n}`;
function exportHtml() {
  const { cls, layout } = plan;
  const page = pagesFor(cls)[0];
  const extra = visibleBars(layout).filter(b => b !== 'b1').map(b => BAR_NAMES[b]);
  const rows = slotList(layout).map(slot => {
    const [bar, i] = slot.split(':'), it = itemAt(layout, slot, page), key = layout.binds[slot];
    if (!it && !key) return '';
    const t = kbSlotThing(cls, it);
    return `<tr><td>${esc(bindName(bar, +i + 1))}</td><td class="k">${key ? esc(bindLabel(key)) : ''}</td>
      <td>${t ? `${t.icon ? `<img src="${kbIcon(t.icon)}" alt="">` : ''}${esc(t.name)}` : ''}</td></tr>`;
  }).join('');
  return `<div class="kb-modal" role="dialog" aria-label="Put this layout in the game"><div class="kb-modal-box">
    <div class="kb-gpanel-h"><b>Put this layout in the game</b><button type="button" class="kb-gclose" data-act="export" aria-label="Close">&times;</button></div>
    <h3 class="kb-xh">With the addon: abilities, items and keys</h3>
    <ol class="kb-steps">
      <li>Download <a href="${ADDON_ZIP}" download>Forever Keybinds</a> and unzip it into your WoW Forever folder's <b>Interface\\AddOns</b>.</li>
      <li>In game, type <b>/fkb</b>, paste the text below and click <b>Apply</b>. Out of combat, on your ${esc(cls)}.</li>
    </ol>
    <div class="kb-emstr"><textarea id="kb-fkbstr" readonly rows="2" aria-label="Forever Keybinds text">${esc(addonString(layout, SPELLS[cls], window.ITEMS ? ITEMS.items : []))}</textarea>
      <button type="button" class="btn" data-act="copyfkb">Copy</button></div>
    <p class="note">It saves your current buttons and keys first: <b>/fkb undo</b> puts them back. Spells you haven't learned show greyed and go on their button when you learn them.
      Labels like "Potion" stay on this page.</p>
    <h3 class="kb-xh">Bar positions: Edit Mode</h3>
    <ol class="kb-steps">
      <li>Press Esc and open <b>Edit Mode</b>. In the layout list choose <b>Import</b>, paste the text below, name it, then click <b>Save</b>.</li>
    </ol>
    <div class="kb-emstr"><textarea id="kb-emstr" readonly rows="2" aria-label="Edit Mode layout">${esc(editModeString(layout))}</textarea>
      <button type="button" class="btn" data-act="copyem">Copy</button></div>
    <p class="note">The bars are placed for a ${esc(plan.screen.replace('x', ' × '))} screen. If yours is different, change Screen in Edit Mode on this page first.</p>
    <h3 class="kb-xh">Without the addon</h3>
    <p class="note">${extra.length ? `In Options → Action Bars, tick <b>${esc(extra.join(', '))}</b>. ` : ''}Set your keys in Options → Keybindings → Action Bars and drag your abilities onto the buttons, using this list.</p>
    <div class="kb-sheet"><table><thead><tr><th>Button</th><th>Key</th><th>On it</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="3" class="note">Nothing placed or bound yet.</td></tr>'}</tbody></table></div>
    <div class="kb-gpanel-f"><button type="button" class="kb-link" data-act="printsheet">Print this list</button></div>
  </div></div>`;
}
async function copyText(id, done) {
  const ta = document.getElementById(id);
  try { await navigator.clipboard.writeText(ta.value); setMsg(done); }
  catch { ta.select(); setMsg('Press Ctrl+C to copy it.'); }
}

async function shareLink() {
  const url = `${location.origin}${KB_ROOT}/${plan.cls}/${plan.spec}?l=${encode(plan.layout, SPELLS[plan.cls])}`;
  try { await navigator.clipboard.writeText(url); setMsg('Link copied. Paste it in Discord.'); }
  catch { setMsg(url); }
}
