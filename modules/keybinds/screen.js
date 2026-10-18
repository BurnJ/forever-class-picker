'use strict';
/* The game screen with the player's bars where Edit Mode puts them: on the plan page (and in Edit Mode, where bars
   move and change shape), and cropped to just the bars on the practice and drill pages.
   Everything is drawn in UIParent units times --s (CSS pixels per unit), so a resize only changes --s (fitScreen). */

const BAR_NAMES = { b1: 'Action Bar 1', b2: 'Action Bar 2', b3: 'Action Bar 3', b4: 'Action Bar 4', b5: 'Action Bar 5',
  b6: 'Action Bar 6', b7: 'Action Bar 7', b8: 'Action Bar 8', stance: 'Stance Bar', pet: 'Pet Bar' };
const SMALL = 30;  // stance and pet buttons, in units (probe: StanceButton1 is 30 wide)
const PET_CLASSES = new Set(['hunter', 'warlock']);
// The game's other frames (geo.js FRAMES) are faded outlines, so bars can be judged against them; in Edit Mode
// they can be moved. Two more can't: the bags, which follow the micro menu (BOTTOMLEFT on its BOTTOMRIGHT, 7,-4),
// and the XP bar, which the game stacks itself. Sizes from the probe.
const BAGS = { w: 315, h: 45, dx: 7, dy: -4 };
// the game's placement of everything for this class (geo.js gameRects)
const classRects = (layout, cls, scr) => gameRects(layout, scr, { stance: stanceForms(cls).length, pet: PET_CLASSES.has(cls) });
// Every movable frame's rect on a screen, at its size in the layout's preset: [{ id, rect }] (all of them when edit,
// otherwise the ones on screen in game)
function frameRects(layout, cls, scr, edit) {
  const all = classRects(layout, cls, scr);
  return framesFor(cls, edit, layout.show).map(id => ({ id, rect: all[id] }));
}

// the screen the visitor last picked in Edit Mode
const kbScreen = () => SCREENS[kbStore.get('kb:screen', '')] || SCREENS['1920x1080'];

const u = n => `calc(var(--s) * ${Math.round(n * 100) / 100}px)`;
const box = r => `left:${u(r.l)};bottom:${u(r.b)};width:${u(r.w)};height:${u(r.h)}`;

// the stance and pet bars are a row of small buttons: their shape for fromAnchor
const smallShape = n => ({ rows: 1, icons: Math.max(1, n), size: SMALL / BUTTON * 100, pad: 2 });
function stanceForms(cls) { return (SPELLS[cls] && SPELLS[cls].forms || []).filter(f => !f.hidden); }

// Every bar's rect on a screen: [{ id, rect, g }] (bars switched off only when withOff, for Edit Mode).
function barRects(layout, cls, scr, withOff) {
  const all = classRects(layout, cls, scr), out = [];
  for (const id of ALL_BARS) {
    const g = layout.geo[id];
    if (g.on === false && !withOff) continue;
    out.push({ id, g, rect: all[id] });
  }
  const forms = stanceForms(cls);
  if (forms.length) out.push({ id: 'stance', g: { ...smallShape(forms.length), ...layout.geo.stance }, rect: all.stance });
  if (PET_CLASSES.has(cls)) out.push({ id: 'pet', g: { ...smallShape(10), ...layout.geo.pet }, rect: all.pet });
  return out;
}

// opts: { page (bar 1 page), edit, selected (bar id), crop (just the bars, for practice and drill), screen (a SCREENS entry) }
function screenHtml(layout, cls, opts = {}) {
  const scr = opts.screen ? screenSize(opts.screen.aspect, opts.screen.h) : screenSize();
  const rects = barRects(layout, cls, scr, opts.edit);
  let view = { l: 0, b: 0, w: scr.w, h: scr.h };
  if (opts.crop && rects.length) {
    const pad = 6, l = Math.min(...rects.map(r => r.rect.l)) - pad, b = Math.min(...rects.map(r => r.rect.b)) - pad;
    view = { l, b, w: Math.max(...rects.map(r => r.rect.l + r.rect.w)) + pad - l, h: Math.max(...rects.map(r => r.rect.b + r.rect.h)) + pad - b };
  }
  const shift = r => ({ l: r.l - view.l, b: r.b - view.b, w: r.w, h: r.h });
  const bars = rects.map(({ id, g, rect }) => {
    const r = shift(rect);
    const btnSize = BUTTON * (g.size || 100) / 100;
    let buttons = '';
    if (id === 'stance' || id === 'pet') {
      const forms = id === 'stance' ? stanceForms(cls) : Array(10).fill(null);
      buttons = forms.map((f, i) => { const p = buttonPos(g, i);
        return `<span class="kb-xsmall" style="left:${u(p.x)};top:${u(p.y)};width:${u(p.size)};height:${u(p.size)}">${f ? `<img src="${kbIcon(f.icon)}" alt="${esc(f.name)}" title="${esc(f.name)}">` : ''}</span>`; }).join('');
    } else {
      const items = id === 'b1' ? layout.pages[opts.page || pagesFor(cls)[0]] : layout.bars[id];
      for (let i = 0; i < g.icons; i++) {
        const p = buttonPos(g, i, id), slot = `${id}:${i}`;
        buttons += kbButton(cls, slot, items[i], layout.binds[slot], `style="left:${u(p.x)};top:${u(p.y)};--b:${p.size}"`);
      }
    }
    const cls2 = `kb-xbar${g.on === false || g.vis === 'hidden' ? ' off' : ''}${opts.selected === id ? ' sel' : ''}`;
    const note = g.on === false ? ' (off)' : g.vis === 'hidden' ? ' (hidden)' : g.vis === 'combat' ? ' (in combat)' : g.vis === 'ooc' ? ' (out of combat)' : '';
    return `<div class="${cls2}" data-bar="${id}" style="${box(r)};--b:${btnSize}">${buttons}
      ${opts.edit ? `<div class="kb-xsel" data-geo="${id}"><span>${BAR_NAMES[id]}${note}</span></div>` : ''}</div>`;
  }).join('');
  let ghosts = '';
  if (!opts.crop) {
    const frames = frameRects(layout, cls, scr, opts.edit);
    const off = id => FRAMES[id].toggle && !(layout.show && layout.show[FRAMES[id].toggle]);
    const name = id => FRAMES[id].name + (FRAMES[id].editOnly ? ` (${FRAMES[id].editOnly})` : off(id) ? ' (off)' : '');
    const menu = frames.find(f => f.id === 'menu').rect;
    ghosts = frames.map(({ id, rect }) => `<div class="kb-xghost${off(id) ? ' off' : ''}${opts.selected === id ? ' sel' : ''}" style="${box(rect)}"><span>${name(id)}</span>
        ${opts.edit ? `<div class="kb-xsel" data-frame="${id}"><span>${name(id)}</span></div>` : ''}</div>`).join('')
      + `<div class="kb-xghost" style="${box({ l: menu.l + menu.w + BAGS.dx, b: menu.b + BAGS.dy, w: BAGS.w, h: BAGS.h })}"><span>Bags</span></div>`
      + `<div class="kb-xghost" style="${box(classRects(layout, cls, scr).xp)}"><span>XP</span></div>`;
  }
  return `<div class="kb-screen${opts.edit ? ' editing' : ''}${opts.crop ? ' crop' : ''}" data-w="${view.w}" data-h="${view.h}" data-vl="${view.l}" data-vb="${view.b}"
    style="aspect-ratio:${view.w} / ${view.h}">${ghosts}${bars}</div>`;
}

// Scale a rendered screen to its box. maxH keeps a cropped one from growing taller than that (CSS px).
function fitScreen(el, maxH) {
  if (!el) return;
  el.style.width = '';
  const w = +el.dataset.w, h = +el.dataset.h;
  let s = el.clientWidth / w;
  if (maxH && h * s > maxH) s = maxH / h;
  el.style.setProperty('--s', s);
  if (maxH) el.style.width = `${w * s}px`;
}

if (typeof module !== 'undefined') module.exports = { BAR_NAMES, barRects, frameRects, screenHtml };
