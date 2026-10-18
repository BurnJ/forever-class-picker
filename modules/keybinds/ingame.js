'use strict';
/* The text the ForeverKeybinds addon reads (/fkb, paste, Apply): what goes in each action slot and which key fires
   which button, already in the game's numbers so the addon only has to place and bind. "FKB1:" then base64 of
   UTF-8 lines:
     FKB 1
     class <cls>
     name <layout name>
     bars <extra bars to switch on, e.g. 2,3>
     show <the game's switches to turn on: swing (Swing Timer), meter (Damage Meter); left out when none>
     s <action slot> <spell ids, rank 1 first, comma separated> <rank 1's level> <name>
     i <action slot> <item id> <name>
     k <key> <binding command>
   Slots and commands: docs/forever-actionbar-facts.md. Labels ("Potion") aren't sent; the game can't place them.
   Needs layout.js and the spell data. */

// the addon's download (tools/build_addon.py makes it from addon/ForeverKeybinds; keep the version in step with the .toc)
const ADDON_ZIP = '/downloads/ForeverKeybinds-0.2.0.zip';
// first action slot of each bar
const BAR_FIRST_SLOT = { b2: 61, b3: 49, b4: 25, b5: 37, b6: 145, b7: 157, b8: 169 };
// first action slot of each bar 1 page: the game's bonus bars (GetBonusBarOffset 1-4 -> 73, 85, 97, 109).
// main is probed; the stance and form pages are the classic numbers, to be checked in game on a warrior.
const PAGE_FIRST_SLOT = { main: 1, f30: 73, f17: 73, f18: 85, f19: 97, f1: 73, f5: 97 };
const BAR_COMMAND = { b1: 'ACTIONBUTTON', b2: 'MULTIACTIONBAR1BUTTON', b3: 'MULTIACTIONBAR2BUTTON', b4: 'MULTIACTIONBAR3BUTTON',
  b5: 'MULTIACTIONBAR4BUTTON', b6: 'MULTIACTIONBAR5BUTTON', b7: 'MULTIACTIONBAR6BUTTON', b8: 'MULTIACTIONBAR7BUTTON' };

// The lines the addon reads, before encoding (tests compare these). spells = SPELLS[cls], items = ITEMS.items or [].
function addonLines(layout, spells, items = []) {
  const clean = s => String(s).replace(/[\r\n]+/g, ' ').trim();
  const ability = key => spells.abilities.find(a => a.key === key);
  const itemName = id => (items.find(x => x.id === id) || { name: 'Item ' + id }).name;
  const lines = ['FKB 1', `class ${layout.cls}`, `name ${clean(layout.name || 'Forever Keybinds')}`];
  const extra = visibleBars(layout).filter(b => b !== 'b1');
  lines.push(`bars ${extra.map(b => b.slice(1)).join(',')}`);
  const show = Object.keys(TOGGLES).filter(k => layout.show && layout.show[k]);
  if (show.length) lines.push(`show ${show.join(',')}`);
  const put = (slot, it) => {
    if (!it) return;
    if (it.a) {
      const a = ability(it.a);
      if (a) lines.push(`s ${slot} ${a.ranks.map(r => r.spell).join(',')} ${a.ranks[0].level || 1} ${clean(a.name)}`);
    } else if (it.i) lines.push(`i ${slot} ${it.i} ${clean(itemName(it.i))}`);
  };
  for (const page of pagesFor(layout.cls)) {
    const first = PAGE_FIRST_SLOT[page];
    if (first) layout.pages[page].slice(0, layout.geo.b1.icons).forEach((it, i) => put(first + i, it));
  }
  for (const bar of extra) layout.bars[bar].slice(0, layout.geo[bar].icons).forEach((it, i) => put(BAR_FIRST_SLOT[bar] + i, it));
  for (const slot of slotList(layout)) {
    const key = layout.binds[slot];
    if (!key) continue;
    const [bar, i] = slot.split(':');
    lines.push(`k ${key} ${BAR_COMMAND[bar]}${+i + 1}`);
  }
  return lines;
}
function addonString(layout, spells, items) {
  const bytes = new TextEncoder().encode(addonLines(layout, spells, items).join('\n'));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return 'FKB1:' + btoa(bin);
}

if (typeof module !== 'undefined') module.exports = { ADDON_ZIP, BAR_FIRST_SLOT, PAGE_FIRST_SLOT, BAR_COMMAND, addonLines, addonString };
