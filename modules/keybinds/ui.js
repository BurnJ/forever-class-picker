'use strict';
/* Keybinds: pieces the plan, practice and drill pages share: mice, saved layouts, action buttons, tooltips. */

const KB_ROOT = '/keybinds';
const kbClass = id => CLASSES.find(c => c.id === id);
const kbSpec = (cls, spec) => (kbClass(cls) || { specs: [] }).specs.find(s => s.id === spec);
const kbAbility = (cls, key) => SPELLS[cls] && SPELLS[cls].abilities.find(a => a.key === key);
const kbIcon = id => `data/icons/${id}.png`;
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
    const l = decode(code, SPELLS);
    if (l.error) return { error: l.error };
    return { layout: l, shared: true };
  }
  const all = kbLayouts().filter(x => x.cls === cls && x.spec === spec);
  const cur = kbStore.get(`kb:cur:${cls}/${spec}`, null);
  const row = all.find(x => x.id === cur) || all[all.length - 1];
  if (row) { const l = decode(row.code, SPELLS); if (!l.error) return { layout: l, id: row.id }; }
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
  return { abilities, talents: {}, pts: {} };
}

/* ---------- one action button ---------- */
// item: null | { a } | { label }; bind: WoW bind name
function kbButton(cls, slot, item, bind, extra = '') {
  const a = item && item.a ? kbAbility(cls, item.a) : null;
  const inner = a ? `<img class="kb-icon" src="${kbIcon(a.icon)}" alt="" draggable="false">`
    : item && item.label ? `<span class="kb-label">${esc(item.label)}</span>` : '';
  return `<button type="button" class="kb-btn${item ? '' : ' empty'}" data-slot="${slot}"${a ? ` data-ab="${esc(a.name)}"` : ''}
    aria-label="${esc(a ? a.name : item && item.label || 'Empty slot')}${bind ? ', ' + esc(bind) : ''}" ${extra}>${inner}
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
