'use strict';
/* The Keybinds module: /keybinds, /keybinds/<class>[/<spec>[/practice|/drill]]. Plan your action bars and binds for every
   ability (learned or not), then practise them on a training dummy. Reads SPELLS, RULES, ROTATIONS, CLASSES, TALENTS. */

function keybindsHome() {
  tipCtx = null;
  document.body.style.removeProperty('--cls');
  document.body.style.removeProperty('--cls-text');
  const mine = kbLayouts().slice().sort((a, b) => b.updated - a.updated);
  app.innerHTML = `<main class="kb kb-home">
    <div class="kb-intro">
      <h1>Keybinds</h1>
      <p class="lead">Decide where every ability lives before you learn it, so you never have to relearn your bars. Lay out your action bars and binds for any class, then build the muscle memory on a training dummy that plays by the game's rules.</p>
    </div>
    <div class="kb-pickgrid">${CLASSES.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => `
      <section class="kb-pickclass" style="--cls:${c.color};--cls-text:${c.text}">
        <a class="kb-pickhead" href="${KB_ROOT}/${c.id}/${c.specs[0].id}"><span class="frame"><img src="icons/${c.id}.png" alt=""></span><b>${esc(c.name)}</b></a>
        <ul>${c.specs.map(s => { const T = window.TALENTS && TALENTS[c.id]; const ic = T && findTree(T, s.id);
          return `<li><a href="${KB_ROOT}/${c.id}/${s.id}">${ic ? `<img src="${kbIcon(ic.icon)}" alt="">` : ''}${esc(s.name)}</a></li>`; }).join('')}</ul>
      </section>`).join('')}</div>
    ${mine.length ? `<section class="kb-mine"><h2>Your layouts</h2><ul>${mine.map(x => { const c = kbClass(x.cls), s = kbSpec(x.cls, x.spec);
      return `<li><a href="${KB_ROOT}/${x.cls}/${x.spec}" data-open="${x.id}"><img src="icons/${x.cls}.png" alt=""><b style="color:${c.text}">${esc(x.name || 'Unnamed layout')}</b>
        <span>${esc(s ? s.name : x.spec)} ${esc(c.name)}</span></a></li>`; }).join('')}</ul></section>` : ''}
    <p class="note kb-foot">Abilities, ranks, costs and cooldowns come from the WoW Forever beta client (build ${esc(SPELLS.warrior.build)}). Combat rules link to their sources in the practice notes. Layouts are saved in this browser only.</p>
  </main>`;
  app.querySelectorAll('[data-open]').forEach(a => a.addEventListener('click', () => {
    const row = kbLayouts().find(x => x.id === a.dataset.open);
    if (row) kbStore.set(`kb:cur:${row.cls}/${row.spec}`, row.id);
  }));
}

registerModule({
  id: 'keybinds',
  label: 'Keybinds',
  render(parts, query) {
    const [cls, spec, mode] = parts;
    if (typeof stopPractice === 'function') stopPractice();
    if (typeof drillStop === 'function') drillStop();
    scrollTo(0, 0);
    if (!cls || !kbClass(cls) || !SPELLS[cls]) { keybindsHome(); return; }
    if (!spec || !kbSpec(cls, spec)) { go(`${KB_ROOT}/${cls}/${kbClass(cls).specs[0].id}${location.search}`, true); return; }
    document.title = `${kbSpec(cls, spec).name} ${kbClass(cls).name} keybinds | ${SITE}`;
    if (mode === 'practice') practicePage(cls, spec, query);
    else if (mode === 'drill') drillPage(cls, spec, query);
    else planPage(cls, spec, query);
  },
  views() {
    const out = [{ path: KB_ROOT, kind: 'keybinds' }];
    for (const c of CLASSES) for (const s of c.specs) {
      out.push({ path: `${KB_ROOT}/${c.id}/${s.id}`, kind: 'keybinds' });
    }
    out.push({ path: `${KB_ROOT}/warrior/arms/practice`, kind: 'keybinds' });
    out.push({ path: `${KB_ROOT}/priest/holy/practice`, kind: 'keybinds' });
    out.push({ path: `${KB_ROOT}/warrior/arms/drill`, kind: 'keybinds' });
    return out;
  },
});
