'use strict';
/* Keybinds: pieces the plan, practice and drill pages share: mice, saved layouts, action buttons, tooltips. */

const KB_ROOT = '/keybinds';
const kbClass = id => CLASSES.find(c => c.id === id);
const kbSpec = (cls, spec) => (kbClass(cls) || { specs: [] }).specs.find(s => s.id === spec);
const kbAbility = (cls, key) => SPELLS[cls] && SPELLS[cls].abilities.find(a => a.key === key);
const kbIcon = id => `data/icons/${id}.png`;
/* ---------- items (data/items.js, loaded the first time a page needs it) ---------- */
const UNKNOWN_ICON = 134400;  // the game's question mark
let kbItemsLoading = null;
function kbLoadItems() {
  if (window.ITEMS) return Promise.resolve(window.ITEMS);
  if (!kbItemsLoading) kbItemsLoading = new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'data/items.js';
    s.onload = () => { kbItemById = null; ok(window.ITEMS); };
    s.onerror = () => { kbItemsLoading = null; fail(new Error('items')); };
    document.head.appendChild(s);
  });
  return kbItemsLoading;
}
let kbItemById = null;
// an item by id; until the list has loaded (or for an id it doesn't have) a question mark with the id
function kbItem(id) {
  if (window.ITEMS && !kbItemById) kbItemById = new Map(ITEMS.items.map(i => [i.id, i]));
  return (kbItemById && kbItemById.get(id)) || { id, name: `Item ${id}`, icon: UNKNOWN_ICON, cat: '', lvl: 0, q: 1, unknown: true };
}
const layoutHasItems = l => [...Object.values(l.pages), ...Object.values(l.bars)].some(arr => arr.some(it => it && it.i));
// what a slot holds, for labels and lists: { name, icon } or null
function kbSlotThing(cls, it) {
  if (!it) return null;
  if (it.a) { const a = kbAbility(cls, it.a); return a && { name: a.name, icon: a.icon }; }
  if (it.i) { const x = kbItem(it.i); return { name: x.name, icon: x.icon, item: x }; }
  return { name: it.label, icon: null };
}
// the class colour for a page's own <main> (so it never leaks into other sections)
const kbAccent = cls => { const c = kbClass(cls); return c ? `style="--cls:${c.color};--cls-text:${c.text}"` : ''; };
const HEALER_SPECS = new Set(['paladin/holy', 'druid/restoration', 'priest/discipline', 'priest/holy', 'shaman/restoration']);
const TANK_SPECS = new Set(['warrior/protection', 'paladin/protection']);

/* ---------- mice: side buttons drawn in a grid, each sends a key the player sets ---------- */
const MICE = {
  keyboard: { name: 'Keyboard only', cols: 0, buttons: [] },
  two: { name: '2 side buttons', cols: 1, buttons: [{ id: 'm5', label: 'Forward', fixed: 'BUTTON5' }, { id: 'm4', label: 'Back', fixed: 'BUTTON4' }] },
  g600: { name: 'Logitech G600', cols: 4, buttons: Array.from({ length: 12 }, (_, i) => ({ id: 'g' + (i + 9), label: 'G' + (i + 9) })) },
  naga: { name: 'Razer Naga (12 buttons)', cols: 3, buttons: Array.from({ length: 12 }, (_, i) => ({ id: 'n' + (i + 1), label: String(i + 1) })) },
  scimitar: { name: 'Corsair Scimitar', cols: 3, buttons: Array.from({ length: 12 }, (_, i) => ({ id: 's' + (i + 1), label: String(i + 1) })) },
};
// what a mouse button sends: a fixed mouse button, or the key the player told us
const mouseSends = (layout, b) => b.fixed || layout.mouseKeys[b.id] || '';

/* ---------- browser storage (per viewer; the page works without it) ---------- */
const kbStore = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};
// saved layouts: [{ id, cls, spec, name, code, updated }]
const kbLayouts = () => kbStore.get('kb:layouts', []);
function kbSaveLayout(id, layout) {
  const all = kbLayouts();
  const code = encode(layout, SPELLS[layout.cls]);
  const row = { id, cls: layout.cls, spec: layout.spec, name: layout.name || '', code, updated: Date.now() };
  const i = all.findIndex(x => x.id === id);
  if (i >= 0) all[i] = row; else all.push(row);
  kbStore.set('kb:layouts', all);
  kbStore.set(`kb:cur:${layout.cls}/${layout.spec}`, id);
}
function kbDeleteLayout(id) { kbStore.set('kb:layouts', kbLayouts().filter(x => x.id !== id)); }
const kbNewId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// The layout to show for a class/spec: ?l= share code, else the one last used, else a new empty one.
function kbLoadLayout(cls, spec, query) {
  const code = query && query.get('l');
  if (code) {
    const l = decode(code, SPELLS, MICE);
    if (l.error) return { error: l.error };
    if (l.cls !== cls) return { error: 'class' };
    l.spec = spec;  // the address decides the spec
    return { layout: l, shared: true };
  }
  const all = kbLayouts().filter(x => x.cls === cls && x.spec === spec);
  const cur = kbStore.get(`kb:cur:${cls}/${spec}`, null);
  const row = all.find(x => x.id === cur) || all[all.length - 1];
  if (row) { const l = decode(row.code, SPELLS, MICE); if (!l.error && l.cls === cls) { l.spec = spec; return { layout: l, id: row.id }; } }
  return { layout: newLayout(cls, spec), id: kbNewId(), fresh: true };
}

/* ---------- tooltips (the shell shows them for any [data-ab]) ---------- */
function kbTipCtx(cls) {
  const T = window.TALENTS && TALENTS[cls];
  const abilities = {};
  for (const a of SPELLS[cls].abilities) {
    const t = T && T.abilities && T.abilities[a.name];
    if (t) { abilities[a.name] = Object.assign({}, t, { learned: a.ranks[0].level }); continue; }
    const tal = T && T.specs.flatMap(s => s.talents).find(x => x.name === a.name);
    const r = a.ranks[0];
    abilities[a.name] = { icon: a.icon, learned: r.level, desc: tal ? tal.ranks[0] : '',
      cast: r.cast ? `${r.cast} sec cast` : 'Instant', cooldown: tal && tal.cooldown || (r.cd ? `${r.cd} sec cooldown` : ''),
      cost: r.cost ? `${r.cost} ${r.power ? r.power[0].toUpperCase() + r.power.slice(1) : ''}` : '' };
  }
  kbTipItems(abilities);
  return { abilities, talents: {}, pts: {} };
}
// items share the ability tooltip (it shows by name): the category and the level it needs
function kbTipItems(abilities) {
  if (!window.ITEMS) return;
  for (const x of ITEMS.items) if (!abilities[x.name]) abilities[x.name] = { icon: x.icon, cast: x.cat, cost: x.lvl ? `Requires level ${x.lvl}` : '', desc: '' };
}

/* ---------- one action button ---------- */
// item: null | { a } | { i } | { label }; bind: WoW bind name
function kbButton(cls, slot, item, bind, extra = '') {
  const t = kbSlotThing(cls, item);
  const inner = t && t.icon ? `<img class="kb-icon" src="${kbIcon(t.icon)}" alt="" draggable="false">`
    : t ? `<span class="kb-label">${esc(t.name)}</span>` : '';
  return `<button type="button" class="kb-btn${item ? '' : ' empty'}${t && t.item ? ' item' : ''}" data-slot="${slot}"${t && t.icon ? ` data-ab="${esc(t.name)}"` : ''}
    aria-label="${esc(t ? t.name : 'Empty slot')}${bind ? ', ' + esc(bind) : ''}" ${extra}>${inner}
    <span class="kb-cd"></span><span class="kb-hk">${esc(bindLabel(bind))}</span></button>`;
}

// Class icon strip for picking a class (links keep the page: plan/practice/drill)
function kbClassStrip(active, sub) {
  return `<nav class="kb-classes" aria-label="Class">${CLASSES.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c =>
    `<a class="frame${c.id === active ? ' gold' : ''}" href="${KB_ROOT}/${c.id}${sub || ''}" title="${esc(c.name)}"${c.id === active ? ' aria-current="true"' : ''}>
      <img src="icons/${c.id}.png" alt="${esc(c.name)}"></a>`).join('')}</nav>`;
}
function kbSpecSeg(cls, spec, sub) {
  const c = kbClass(cls);
  const T = window.TALENTS && TALENTS[cls];
  return `<nav class="seg" aria-label="Spec">${c.specs.map(s => {
    const ic = T && findTree(T, s.id);
    return `<a href="${KB_ROOT}/${cls}/${s.id}${sub || ''}"${s.id === spec ? ' aria-current="true"' : ''}>${ic ? `<img src="${kbIcon(ic.icon)}" alt="">` : ''}${esc(s.name)}</a>`;
  }).join('')}</nav>`;
}

// short readable time: 75 -> "1:15"
const kbClock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

if (typeof module !== 'undefined') module.exports = { MICE, mouseSends, kbClock };
