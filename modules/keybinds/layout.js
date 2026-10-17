'use strict';
/* A player's layout: what sits in each action button and which bind fires it. Pure data and rules,
   plus the share-link codec. Bar 1 changes page with stance/form like in game; bars 2-6 never change.
   Binds belong to button positions ("b1:0" is bar 1's first button whatever page it shows).  */

const SLOTS = 12;
const EXTRA_BARS = ['b2', 'b3', 'b4', 'b5', 'b6'];
const DEFAULT_BAR1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];
// bar 1 pages per class: shapeshift form ids from the client (SpellShapeshiftForm). Warriors are always in a stance.
const FORM_PAGES = {
  warrior: ['f17', 'f18', 'f19'],   // Battle, Defensive, Berserker Stance
  druid: ['main', 'f1', 'f5'],      // caster, Cat Form, Bear Form (Dire Bear Form uses the bear page)
  rogue: ['main', 'f30'],           // normal, Stealth
};
const FORM_ALIAS = { 8: 5 };        // Dire Bear Form -> Bear Form page

const pagesFor = cls => FORM_PAGES[cls] || ['main'];
// The bar 1 page shown in a form (null/undefined = no form).
function pageForForm(cls, form) {
  const pages = pagesFor(cls);
  const p = form == null ? null : 'f' + (FORM_ALIAS[form] || form);
  return pages.includes(p) ? p : pages[0];
}

function newLayout(cls, spec) {
  const pages = {};
  pagesFor(cls).forEach(p => { pages[p] = Array(SLOTS).fill(null); });
  const bars = {};
  EXTRA_BARS.forEach(b => { bars[b] = Array(SLOTS).fill(null); });
  const binds = {};
  DEFAULT_BAR1.forEach((k, i) => { binds['b1:' + i] = k; });
  return { v: 1, cls, spec, name: '', mouse: 'keyboard', shown: 2, pages, bars, binds, mouseKeys: {} };
}

const parseSlot = id => { const [bar, i] = id.split(':'); return { bar, i: +i }; };
const slotList = layout => ['b1', ...EXTRA_BARS.slice(0, layout.shown)]
  .flatMap(bar => Array.from({ length: SLOTS }, (_, i) => `${bar}:${i}`));

// item: null | { a: abilityKey } | { label: 'Potion' }
function itemAt(layout, slot, page) {
  const { bar, i } = parseSlot(slot);
  return (bar === 'b1' ? layout.pages[page || pagesFor(layout.cls)[0]] : layout.bars[bar])[i] || null;
}
function place(layout, slot, page, item) {
  const { bar, i } = parseSlot(slot);
  (bar === 'b1' ? layout.pages[page || pagesFor(layout.cls)[0]] : layout.bars[bar])[i] = item || null;
}
// Every slot (with page) holding an ability.
function slotsOf(layout, key) {
  const out = [];
  for (const [page, arr] of Object.entries(layout.pages))
    arr.forEach((it, i) => { if (it && it.a === key) out.push({ slot: 'b1:' + i, page }); });
  for (const [bar, arr] of Object.entries(layout.bars))
    arr.forEach((it, i) => { if (it && it.a === key) out.push({ slot: `${bar}:${i}`, page: null }); });
  return out;
}

// Give a slot a bind. Like in game, a bind used elsewhere is taken from that slot.
// Returns { cleared: slotId | null }.
function setBind(layout, slot, bind) {
  let cleared = null;
  for (const [s, b] of Object.entries(layout.binds)) if (b === bind && s !== slot) { delete layout.binds[s]; cleared = s; }
  if (bind) layout.binds[slot] = bind; else delete layout.binds[slot];
  return { cleared };
}
const slotForBind = (layout, bind) => Object.keys(layout.binds).find(s => layout.binds[s] === bind) || null;

/* ---------- share codec ----------
   JSON with abilities stored as their rank-1 spell id (stable across data rebuilds), then base64url.
   Version 1. A link that doesn't decode gives { error } instead of a half-built layout. */
const CODEC_VERSION = 1;
const b64url = s => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64url = s => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};
function packItems(arr, idOf) {
  const out = arr.map(it => (!it ? 0 : it.a ? idOf(it.a) || 0 : String(it.label).slice(0, 24)));
  while (out.length && out[out.length - 1] === 0) out.pop();
  return out;
}
function unpackItems(arr, keyOf) {
  const out = Array(SLOTS).fill(null);
  (arr || []).slice(0, SLOTS).forEach((x, i) => {
    if (typeof x === 'number' && x) { const k = keyOf(x); out[i] = k ? { a: k } : null; }
    else if (typeof x === 'string' && x) out[i] = { label: x.slice(0, 24) };
  });
  return out;
}
// spells = SPELLS[cls]
function encode(layout, spells) {
  const idOf = key => { const a = spells.abilities.find(x => x.key === key); return a && a.ranks[0].spell; };
  const o = { v: CODEC_VERSION, c: layout.cls, s: layout.spec, n: layout.name || '', m: layout.mouse, x: layout.shown,
    p: {}, b: {}, k: layout.binds, mk: layout.mouseKeys };
  for (const [page, arr] of Object.entries(layout.pages)) o.p[page] = packItems(arr, idOf);
  for (const [bar, arr] of Object.entries(layout.bars)) { const p = packItems(arr, idOf); if (p.length) o.b[bar] = p; }
  return b64url(JSON.stringify(o));
}
// spellsByClass = SPELLS
function decode(str, spellsByClass) {
  let o;
  try { o = JSON.parse(unb64url(String(str || ''))); } catch { return { error: 'broken' }; }
  if (!o || typeof o !== 'object') return { error: 'broken' };
  if (o.v !== CODEC_VERSION) return { error: 'version' };
  const spells = spellsByClass[o.c];
  if (!spells) return { error: 'class' };
  const byId = {};
  spells.abilities.forEach(a => a.ranks.forEach(r => { byId[r.spell] = a.key; }));
  const keyOf = id => byId[id] || null;
  const layout = newLayout(o.c, String(o.s || ''));
  layout.name = String(o.n || '').slice(0, 40);
  layout.mouse = typeof o.m === 'string' ? o.m : 'keyboard';
  layout.shown = Math.max(0, Math.min(EXTRA_BARS.length, +o.x || 0));
  for (const page of Object.keys(layout.pages)) layout.pages[page] = unpackItems(o.p && o.p[page], keyOf);
  for (const bar of EXTRA_BARS) layout.bars[bar] = unpackItems(o.b && o.b[bar], keyOf);
  layout.binds = {};
  for (const [s, b] of Object.entries(o.k || {}))
    if (/^b[1-6]:(\d|1[01])$/.test(s) && typeof b === 'string' && b.length < 32) layout.binds[s] = b;
  layout.mouseKeys = {};
  for (const [s, b] of Object.entries(o.mk || {})) if (typeof b === 'string' && b.length < 32) layout.mouseKeys[String(s).slice(0, 8)] = b;
  return layout;
}

if (typeof module !== 'undefined') module.exports = { SLOTS, EXTRA_BARS, FORM_PAGES, pagesFor, pageForForm, newLayout,
  slotList, itemAt, place, slotsOf, setBind, slotForBind, encode, decode, CODEC_VERSION };
