'use strict';
/* Keybinds practice page: /keybinds/<class>/<spec>/practice. The planned bars in front of a training dummy,
   run by sim.js. Setup -> run -> score. Keys go to whatever button holds that bind, like in game. */

const RUN_LENGTHS = [{ s: 60, label: '1 min' }, { s: 120, label: '2 min' }, { s: 300, label: '5 min' }, { s: 0, label: 'Until it dies' }];
let prac = null;  // { cls, spec, layout, id, shared, opts, sim, offset, raf, paused, ... }

function practicePage(cls, spec, query) {
  const got = kbLoadLayout(cls, spec, query);
  if (got.error) { brokenLink(cls, spec, got.error); return; }
  stopPractice();
  const key = `${cls}/${spec}`;
  const saved = kbStore.get('kb:pracOpts', {});
  prac = { cls, spec, layout: got.layout, id: got.id, shared: !!got.shared, query: query.toString(),
    opts: Object.assign({ level: 60, length: 120, hint: true, hitBack: TANK_SPECS.has(key) || cls === 'warrior' && spec === 'protection',
      healer: HEALER_SPECS.has(key), distance: cls === 'hunter' ? 'ranged' : 'melee', stealth: true }, saved[key] || {}) };
  tipCtx = kbTipCtx(cls);
  setupScreen();
  // items on the bars need the item list for their icons
  if (layoutHasItems(prac.layout)) kbLoadItems().then(() => { kbTipItems(tipCtx.abilities); if (document.getElementById('kb-livebars')) drawBars(); }).catch(() => {});
}

function stopPractice() {
  if (prac && prac.raf) cancelAnimationFrame(prac.raf);
  if (prac) prac.raf = 0;
  document.removeEventListener('keydown', pracKey, true);
  document.removeEventListener('mousedown', pracMouse, true);
  document.removeEventListener('wheel', pracWheel, true);
  document.removeEventListener('visibilitychange', pracVisibility);
}

const placedCount = l => [...Object.values(l.pages), ...Object.values(l.bars)].flat().filter(x => x && x.a).length;

function pracTop(sub) {
  const { cls, spec } = prac;
  return `<div class="bar kb-top">
    ${kbClassStrip(cls, sub)}
    <h1>${esc(kbClass(cls).name)}</h1>
    ${kbSpecSeg(cls, spec, sub)}
    <span class="gap"></span>
    <a class="kb-link" href="${KB_ROOT}/${cls}/${spec}${prac.shared ? '?' + prac.query : ''}">Back to the plan</a>
  </div>`;
}

/* ---------- setup ---------- */
function setupScreen() {
  stopPractice();
  const { cls, spec, layout, opts } = prac;
  const key = `${cls}/${spec}`;
  const empty = placedCount(layout) === 0;
  const best = kbStore.get(`kb:hist:${prac.id || 'shared'}`, []).filter(h => h.level === opts.level && h.healer === opts.healer);
  const rot = listFor(typeof ROTATIONS !== 'undefined' ? ROTATIONS : null, cls, spec, opts.level);
  app.innerHTML = `<main class="kb kb-prac" ${kbAccent(prac.cls)}>${pracTop('/practice')}
    <div class="kb-setup panel">
      <h2>${esc(kbSpec(cls, spec).name)} on the training dummy</h2>
      ${empty ? `<p class="kb-warn">Your bars are empty. <a href="${KB_ROOT}/${cls}/${spec}">Plan your layout first</a>, then come back to practice it.</p>` : `
      <p>Use your keybinds, not the mouse. The dummy plays by the game's rules: cooldowns, the global cooldown, cast times${cls === 'warrior' ? ', rage' : cls === 'rogue' ? ', energy and combo points' : ', mana'} and procs.</p>`}
      <div class="kb-opts">
        <label class="kb-level">Character level <input type="range" id="kb-plevel" min="1" max="60" value="${opts.level}"><b>${opts.level}</b></label>
        <div class="kb-opt"><span>Length</span><div class="seg">${RUN_LENGTHS.map(r => `<button type="button" data-len="${r.s}" aria-pressed="${opts.length === r.s}">${r.label}</button>`).join('')}</div></div>
        <div class="kb-opt"><span>Next-ability hint</span><div class="seg"><button type="button" data-hint="1" aria-pressed="${opts.hint}">On</button><button type="button" data-hint="0" aria-pressed="${!opts.hint}">Off</button></div></div>
        <div class="kb-opt"><span>Dummy hits back</span><div class="seg"><button type="button" data-hit="1" aria-pressed="${opts.hitBack}">On</button><button type="button" data-hit="0" aria-pressed="${!opts.hitBack}">Off</button></div></div>
        ${HEALER_SPECS.has(key) ? `<div class="kb-opt"><span>Practice</span><div class="seg"><button type="button" data-heal="1" aria-pressed="${opts.healer}">Healing a party</button><button type="button" data-heal="0" aria-pressed="${!opts.healer}">Damage on the dummy</button></div></div>` : ''}
        ${cls === 'hunter' ? `<div class="kb-opt"><span>Stand</span><div class="seg"><button type="button" data-dist="ranged" aria-pressed="${opts.distance === 'ranged'}">At range</button><button type="button" data-dist="melee" aria-pressed="${opts.distance === 'melee'}">In melee</button></div></div>` : ''}
        ${cls === 'rogue' ? `<div class="kb-opt"><span>Start in Stealth</span><div class="seg"><button type="button" data-stealth="1" aria-pressed="${opts.stealth}">Yes</button><button type="button" data-stealth="0" aria-pressed="${!opts.stealth}">No</button></div></div>` : ''}
      </div>
      ${opts.hint && rot ? `<p class="note">Hint order: ${rot.steps.map(s => esc(s.ability)).join(' &rsaquo; ')}.
        ${rot.src === 'ours' ? '<span class="draft">Our draft</span>' : `Source: ${rot.src.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(', ')}`}</p>` : ''}
      <div class="kb-start"><button type="button" class="btn" id="kb-go" ${empty ? 'aria-disabled="true"' : ''}>Start</button>
        <a class="kb-link" href="${KB_ROOT}/${cls}/${spec}/drill${prac.shared ? '?' + prac.query : ''}">Drill binds instead</a>
        ${best.length ? `<span class="note">Your best here: ${Math.round(Math.max(...best.map(h => opts.healer ? h.hps : h.dps)))} ${opts.healer ? 'HPS' : 'DPS'}</span>` : ''}</div>
    </div></main>`;
  const root = app.querySelector('.kb-setup');
  const save = () => { const all = kbStore.get('kb:pracOpts', {}); all[key] = prac.opts; kbStore.set('kb:pracOpts', all); };
  root.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const d = b.dataset;
    if (d.len != null) opts.length = +d.len;
    else if (d.hint != null) opts.hint = d.hint === '1';
    else if (d.hit != null) opts.hitBack = d.hit === '1';
    else if (d.heal != null) opts.healer = d.heal === '1';
    else if (d.dist) opts.distance = d.dist;
    else if (d.stealth != null) opts.stealth = d.stealth === '1';
    else if (b.id === 'kb-go') { if (!empty) startRun(); return; }
    else return;
    save(); setupScreen();
  });
  root.addEventListener('input', e => { if (e.target.id === 'kb-plevel') { opts.level = +e.target.value; e.target.nextElementSibling.textContent = opts.level; save(); } });
  root.addEventListener('change', e => { if (e.target.id === 'kb-plevel') setupScreen(); });
}

/* ---------- the run ---------- */
function onBarKeys(layout) {
  const keys = new Set();
  [...Object.values(layout.pages), ...Object.values(layout.bars)].flat().forEach(it => it && it.a && keys.add(it.a));
  return keys;
}

function startRun() {
  const { cls, spec, layout, opts } = prac;
  const healer = opts.healer && HEALER_SPECS.has(`${cls}/${spec}`);
  const dummyHp = opts.length ? 0 : Math.round(RULES.healthPool.value(opts.level) * 12);
  prac.sim = createSim({ cls, spec, level: opts.level, spells: SPELLS[cls], rules: RULES, seed: (Date.now() & 0xffff) + 1,
    duration: opts.length || 0, dummyHp, hitBack: opts.hitBack, healer, distance: opts.distance, stealth: opts.stealth, onBar: onBarKeys(layout) });
  prac.rot = opts.hint ? listFor(typeof ROTATIONS !== 'undefined' ? ROTATIONS : null, cls, spec, opts.level) : null;
  prac.started = false;
  prac.texts = [];
  renderRun();
  prac.sim.begin(0);
  prac.offset = performance.now() / 1000;
  prac.paused = false;
  document.addEventListener('keydown', pracKey, true);
  document.addEventListener('mousedown', pracMouse, true);
  document.addEventListener('mouseup', kbBlockNav, true);
  document.addEventListener('wheel', pracWheel, { capture: true, passive: false });
  document.addEventListener('visibilitychange', pracVisibility);
  prac.raf = requestAnimationFrame(frame);
}
const simNow = () => performance.now() / 1000 - prac.offset;

function renderRun() {
  const { cls, sim } = prac;
  const s = sim.state;
  app.innerHTML = `<main class="kb kb-prac kb-running" ${kbAccent(cls)}>${pracTop('/practice')}
    <div class="kb-scene" id="kb-scene"><img class="kb-still" src="${stillSrcFor(cls)}" alt="">
      <div class="kb-unit kb-player"><span class="kb-uname">You</span>
        <div class="kb-sbar hp"><i id="kb-php"></i><b id="kb-phpt"></b></div>
        <div class="kb-sbar pw" id="kb-pwbar"><i id="kb-pw"></i><b id="kb-pwt"></b></div>
        <div class="kb-combo" id="kb-combo"></div>
        <div class="kb-auras" id="kb-buffs"></div></div>
      <div class="kb-unit kb-target"><span class="kb-uname">Training Dummy <small>Level ${s.level}</small></span>
        <div class="kb-sbar hp"><i id="kb-thp"></i><b id="kb-thpt"></b></div>
        <div class="kb-auras" id="kb-debuffs"></div></div>
      ${s.party ? `<div class="kb-party" id="kb-party">${s.party.map((u, i) => `<div class="kb-pf" data-unit="${i}"><span>${u.self ? 'You' : u.role}</span><div class="kb-sbar hp"><i></i></div><em class="sh"></em><span class="hots"></span></div>`).join('')}</div>` : ''}
      <div class="kb-dummy" aria-hidden="true">${DUMMY_SVG}<div class="kb-fct" id="kb-fct"></div></div>
      <div class="kb-clock" id="kb-clock"></div>
      <div class="kb-ready" id="kb-ready">Press any of your binds to start</div>
      <div class="kb-errors" id="kb-err" aria-live="polite"></div>
    </div>
    <div class="kb-hud">
      <div class="kb-cast" id="kb-cast" hidden><i></i><b></b></div>
      <div class="kb-bars kb-live" id="kb-livebars"></div>
      <div class="kb-runstats" id="kb-runstats"></div>
      <div class="kb-runbtns"><button type="button" class="kb-link" id="kb-stop">End the run</button></div>
    </div></main>`;
  document.getElementById('kb-stop').addEventListener('click', () => finishRun());
  const bars = document.getElementById('kb-livebars');
  bars.addEventListener('mousedown', e => {
    const b = e.target.closest('.kb-btn');
    if (!b || e.button !== 0) return;
    pressSlot(b.dataset.slot, 'click');
  });
  if (s.party) {
    const party = document.getElementById('kb-party');
    party.addEventListener('mouseover', e => { const f = e.target.closest('.kb-pf'); if (f) s.focus = +f.dataset.unit; });
    party.addEventListener('mouseleave', () => { s.focus = s.target.selected != null ? s.target.selected : 1; });
    party.addEventListener('click', e => { const f = e.target.closest('.kb-pf'); if (f) { s.target.selected = +f.dataset.unit; s.focus = s.target.selected; } });
  }
  drawBars();
}
// the class picker's character still, in the model (male/female) the visitor picked there
const stillSrcFor = cls => `out/still/${cls}${typeof sexFor === 'function' && sexFor(cls) === 'female' ? '_f' : ''}.webp`;

// the live bars: bar 1 shows the page for the current form
function drawBars() {
  const { cls, layout, sim } = prac;
  const page = pageForForm(cls, sim.state.form);
  prac.page = page;
  const box = document.getElementById('kb-livebars');
  box.innerHTML = screenHtml(layout, cls, { page, crop: true, screen: kbScreen() });
  fitScreen(box.querySelector('.kb-screen'), Math.max(120, innerHeight * 0.3));
  prac.buttons = [...document.querySelectorAll('#kb-livebars .kb-btn')].map(el => {
    const it = itemAt(layout, el.dataset.slot, page);
    return { el, key: it && it.a, cd: el.querySelector('.kb-cd') };
  });
}

function pressSlot(slot, via, repeat) {
  const it = itemAt(prac.layout, slot, prac.page);
  begin();
  if (!it) { if (!repeat) prac.sim.wrongKey(); return; }
  if (!it.a) { flashError(`${it.i ? kbItem(it.i).name : it.label} isn't part of the practice`); return; }
  prac.sim.press(it.a, simNow(), repeat ? 'repeat' : via);
  const btn = prac.buttons.find(b => b.el.dataset.slot === slot);
  if (btn) { btn.el.classList.add('down'); setTimeout(() => btn.el.classList.remove('down'), 120); }
}
function begin() {
  if (prac.started) return;
  prac.started = true;
  // the clock starts on the first press
  prac.offset = performance.now() / 1000;
  prac.sim.begin(0);
  const r = document.getElementById('kb-ready');
  if (r) r.hidden = true;
}

function handleBind(e, bind) {
  if (!bind || isReserved(bind)) return;
  const slot = slotForBind(prac.layout, bind);
  if (!slot || !itemAt(prac.layout, slot, prac.page)) {
    // an unbound key is a wrong key (that's the habit being trained); unbound mouse buttons, the wheel
    // and browser keys are left alone
    if (e.type !== 'keydown' || PASSTHROUGH.has(bind)) return;
    e.preventDefault();
    if (!e.repeat) { begin(); prac.sim.wrongKey(); }
    return;
  }
  e.preventDefault();
  pressSlot(slot, 'key', e.repeat);
}
function pracKey(e) {
  if (!document.querySelector('.kb-running')) { stopPractice(); return; }
  if (e.code === 'Escape') { e.preventDefault(); finishRun(); return; }
  handleBind(e, bindFromEvent(e));
}
function pracMouse(e) {
  if (!document.querySelector('.kb-running')) return;
  if (e.button === 0 || e.button === 2) return;
  handleBind(e, bindFromEvent(e));
}
function pracWheel(e) { if (document.querySelector('.kb-running')) handleBind(e, bindFromEvent(e)); }
function pracVisibility() {
  // a hidden tab pauses the run, so the dummy doesn't fight on alone
  if (!prac || !prac.sim) return;
  if (document.hidden) { prac.paused = performance.now() / 1000; }
  else if (prac.paused) { prac.offset += performance.now() / 1000 - prac.paused; prac.paused = false; }
}

/* ---------- every frame ---------- */
function frame() {
  if (!document.querySelector('.kb-running')) { stopPractice(); return; }
  prac.raf = requestAnimationFrame(frame);
  if (prac.paused) return;
  const sim = prac.sim, s = sim.state;
  if (prac.started) sim.advance(simNow());
  s.hint = prac.rot && prac.started ? nextHint(sim, prac.rot) : prac.rot ? nextHint(sim, prac.rot) : null;
  if (pageForForm(prac.cls, s.form) !== prac.page) drawBars();
  for (const ev of sim.drain()) onEvent(ev);
  const t = s.t;
  // buttons: cooldown sweep (own cooldown, else the global cooldown), usable, proc and hint glow
  for (const b of prac.buttons) {
    if (!b.key) continue;
    const a = sim.abilities[b.key], rank = sim.rankOf(b.key);
    let start = 0, end = 0;
    if (rank) {
      const own = Math.max(s.cds[b.key] || 0, rank.cat ? s.catCds[rank.cat] || 0 : 0);
      if (own > t) { end = own; start = own - Math.max(rank.cd || 0, rank.catCd || 0); }
      else if (rank.gcd > 0 && s.gcdEnd > t) { end = s.gcdEnd; start = s.gcdEnd - rank.gcd; }
    }
    const p = end > t ? Math.min(1, (end - t) / Math.max(0.01, end - start)) : 0;
    b.cd.style.setProperty('--p', p);
    const u = rank ? sim.usable(b.key) : { ok: false, reason: 'notLearned' };
    b.el.classList.toggle('nolearn', !rank);
    b.el.classList.toggle('nopower', u.reason === 'power');
    b.el.classList.toggle('norange', u.reason === 'range' || u.reason === 'tooClose');
    b.el.classList.toggle('proc', s.procs[b.key] != null);
    b.el.classList.toggle('hint', s.hint === b.key);
    b.el.classList.toggle('active', s.swingQueued === b.key || (a.general && s.autoMelee) || (rank && rank.autoRepeat && s.autoRanged === b.key)
      || !!(rank && rank.eff.some(e => e.t === 'form' && e.form === s.form)));
  }
  drawUnits();
  if (s.over) finishRun();
}

function drawUnits() {
  const sim = prac.sim, s = sim.state;
  const pct = sim.targetPct();
  const set = (id, w, txt) => { const el = document.getElementById(id); if (el) el.style.width = (w * 100) + '%'; const tx = txt != null && document.getElementById(id + 't'); if (tx) tx.textContent = txt; };
  set('kb-thp', pct, Math.round(pct * 100) + '%');
  set('kb-php', s.hp / s.hpMax, `${Math.round(s.hp)} / ${s.hpMax}`);
  const pt = sim.powerType();
  const pv = pt === 'rage' ? s.rage : pt === 'energy' ? s.energy : s.mana, pm = pt === 'rage' ? s.rageMax : pt === 'energy' ? s.energyMax : s.manaMax;
  document.getElementById('kb-pwbar').dataset.power = pt;
  set('kb-pw', pv / pm, `${Math.floor(pv)} / ${pm}`);
  const combo = document.getElementById('kb-combo');
  const showCombo = prac.cls === 'rogue' || (prac.cls === 'druid' && s.form === 1);
  combo.innerHTML = showCombo ? Array.from({ length: RULES.comboMax.value }, (_, i) => `<i${i < s.combo ? ' class="on"' : ''}></i>`).join('') : '';
  const auraIcons = (map, debuff) => Object.entries(map).filter(([, v]) => v.end > s.t).slice(0, 12).map(([name, v]) => {
    const a = sim.abilities[name];
    const left = v.end === Infinity ? '' : Math.ceil(v.end - s.t);
    return a ? `<span class="kb-aura${debuff ? ' de' : ''}" data-ab="${esc(a.name)}"><img src="${kbIcon(a.icon)}" alt=""><b>${left}</b>${v.stacks > 1 ? `<em>${v.stacks}</em>` : ''}</span>`
      : `<span class="kb-aura"><b>${esc(name.slice(0, 2))}</b></span>`;
  }).join('');
  const sig = JSON.stringify([Object.keys(s.buffs), Object.keys(s.debuffs), Math.floor(s.t)]);
  if (sig !== prac.auraSig) {
    prac.auraSig = sig;
    document.getElementById('kb-buffs').innerHTML = auraIcons(s.buffs, false);
    document.getElementById('kb-debuffs').innerHTML = auraIcons(s.debuffs, true);
  }
  // cast bar
  const cb = document.getElementById('kb-cast');
  if (s.casting) {
    cb.hidden = false;
    const c = s.casting, f = (s.t - c.start) / (c.end - c.start);
    cb.querySelector('i').style.width = ((c.channel ? 1 - f : f) * 100) + '%';
    cb.querySelector('b').textContent = c.key;
  } else cb.hidden = true;
  const clock = document.getElementById('kb-clock');
  const el = s.t - s.start;
  clock.textContent = prac.started ? (prac.opts.length ? kbClock(Math.max(0, prac.opts.length - el)) : kbClock(el)) : '';
  const st = sim.summary();
  document.getElementById('kb-runstats').innerHTML = prac.started ? `<span>${prac.opts.healer && s.party ? 'HPS' : 'DPS'} <b>${Math.round(s.party ? st.hps : st.dps)}</b></span>
    <span>Wrong keys <b>${st.wrongKeys}</b></span><span>Clicks <b>${st.clicks}</b></span><span>Missed procs <b>${st.procsMissed}</b></span>` : '';
  if (s.party) {
    document.querySelectorAll('.kb-pf').forEach((f, i) => {
      const u = s.party[i];
      f.querySelector('i').style.width = (u.hp / u.hpMax * 100) + '%';
      f.classList.toggle('focus', s.focus === i);
      f.classList.toggle('low', u.hp / u.hpMax < 0.35);
      f.querySelector('.sh').style.width = Math.min(100, u.shield / u.hpMax * 100) + '%';
      const hots = Object.keys(u.hots).join('|') + (u.weakened > s.t ? '|ws' : '');
      if (f.dataset.hots !== hots) {
        f.dataset.hots = hots;
        f.querySelector('.hots').innerHTML = Object.keys(u.hots).map(k => { const a = sim.abilities[k]; return a ? `<img src="${kbIcon(a.icon)}" alt="${esc(k)}">` : ''; }).join('');
      }
    });
  }
}

/* ---------- floating combat text and errors ---------- */
const FCT_KINDS = { hit: 'hit', tick: 'tick', crit: 'crit', heal: 'heal', miss: 'miss', dodge: 'miss', parry: 'miss' };
function onEvent(ev) {
  if (ev.type === 'fail') { if (ev.text && ev.reason !== 'gcd') flashError(ev.text); return; }
  if (ev.type === 'proc') { flashError(`${ev.name}!`, 'proc'); return; }
  const kind = FCT_KINDS[ev.type];
  if (!kind) return;
  const box = document.getElementById('kb-fct');
  if (!box || box.childElementCount > 24) return;
  const span = document.createElement('span');
  span.className = 'kb-ft ' + kind;
  span.textContent = ev.type === 'dodge' ? 'Dodge' : ev.type === 'parry' ? 'Parry' : ev.type === 'miss' ? 'Miss' : (kind === 'heal' ? '+' : '') + ev.amount + (kind === 'crit' ? '!' : '');
  span.style.setProperty('--x', ((Math.random() * 2 - 1) * 70).toFixed(0) + 'px');
  box.appendChild(span);
  setTimeout(() => span.remove(), 1300);
}
function flashError(text, kind) {
  const box = document.getElementById('kb-err');
  if (!box) return;
  if (box.lastChild && box.lastChild.textContent === text) return;
  const p = document.createElement('p');
  p.textContent = text;
  if (kind) p.className = kind;
  box.appendChild(p);
  while (box.childElementCount > 3) box.firstChild.remove();
  setTimeout(() => p.remove(), 1600);
}

/* ---------- score ---------- */
function finishRun() {
  if (!prac || !prac.sim) return;
  const sim = prac.sim, opts = prac.opts;
  stopPractice();
  const st = sim.summary();
  const healer = !!sim.state.party;
  if (!prac.started) { setupScreen(); return; }
  const histKey = `kb:hist:${prac.id || 'shared'}`;
  const hist = kbStore.get(histKey, []);
  const row = { at: Date.now(), level: opts.level, healer, seconds: Math.round(st.seconds), dps: Math.round(st.dps), hps: Math.round(st.hps),
    wrongKeys: st.wrongKeys, clicks: st.clicks, procsMissed: st.procsMissed, idle: Math.round(st.idle),
    hint: st.hintPresses ? Math.round(st.hintFollowed / st.hintPresses * 100) : null };
  const same = hist.filter(h => h.level === opts.level && h.healer === healer);
  const best = same.length ? Math.max(...same.map(h => healer ? h.hps : h.dps)) : 0;
  hist.push(row);
  kbStore.set(histKey, hist.slice(-30));
  const top = Object.entries(st.byAbility).sort((a, b) => b[1].damage - a[1].damage).slice(0, 6);
  const score = healer ? row.hps : row.dps;
  app.innerHTML = `<main class="kb kb-prac" ${kbAccent(prac.cls)}>${pracTop('/practice')}
    <div class="kb-score panel">
      <h2>${score} ${healer ? 'healing' : 'damage'} per second</h2>
      <p class="note">${kbClock(row.seconds)} at level ${opts.level}${best ? (score > best ? ' &middot; <b class="kb-best">A new best for this layout</b>' : ` &middot; your best is ${best}`) : ''}</p>
      <ul class="kb-scorelist">
        <li><b>${row.wrongKeys}</b> wrong key${row.wrongKeys === 1 ? '' : 's'}<small>keys with nothing bound to them</small></li>
        <li><b>${row.clicks}</b> click${row.clicks === 1 ? '' : 's'}<small>buttons clicked instead of pressed</small></li>
        <li><b>${row.procsMissed}</b> missed proc${row.procsMissed === 1 ? '' : 's'}<small>Overpower, Revenge and the like that ran out</small></li>
        <li><b>${row.idle}s</b> idle<small>time you could have pressed something and didn't</small></li>
        ${row.hint != null ? `<li><b>${row.hint}%</b> on the hint<small>presses that matched the glowing button</small></li>` : ''}
        ${healer ? `<li><b>${st.deaths}</b> time${st.deaths === 1 ? '' : 's'} someone dropped<small>party members who hit zero</small></li>` : ''}
      </ul>
      ${top.length ? `<h3>Damage by ability</h3><ul class="kb-breakdown">${top.map(([k, v]) => {
        const a = sim.abilities[k];
        return `<li>${a ? `<img src="${kbIcon(a.icon)}" alt="">` : ''}<span>${esc(k === 'Pet' ? 'Your pet' : k)}</span><b>${Math.round(v.damage / st.damage * 100)}%</b></li>`;
      }).join('')}</ul>` : ''}
      ${same.length ? `<h3>Your last runs</h3><div class="kb-history">${[...same.slice(-9), row].map(h => {
        const v = healer ? h.hps : h.dps, mx = Math.max(score, best, 1);
        return `<span style="--h:${Math.max(4, v / mx * 100)}%" title="${v}"><i></i></span>`;
      }).join('')}</div>` : ''}
      <div class="kb-start"><button type="button" class="btn" id="kb-again">Go again</button>
        <a class="kb-link" href="${KB_ROOT}/${prac.cls}/${prac.spec}${prac.shared ? '?' + prac.query : ''}">Change my layout</a>
        <a class="kb-link" href="${KB_ROOT}/${prac.cls}/${prac.spec}/drill${prac.shared ? '?' + prac.query : ''}">Drill binds</a></div>
    </div></main>`;
  document.getElementById('kb-again').addEventListener('click', () => startRun());
}

// The dummy: our own drawing (the client has no flat art of it)
const DUMMY_SVG = `<svg viewBox="0 0 200 300" class="kb-dummy-svg">
  <rect x="94" y="150" width="12" height="140" fill="#5b3b1d"/><rect x="70" y="280" width="60" height="12" rx="3" fill="#4a3018"/>
  <rect x="30" y="112" width="140" height="14" rx="5" fill="#6b4520"/>
  <ellipse cx="100" cy="150" rx="44" ry="58" fill="#b58a4a"/><ellipse cx="100" cy="150" rx="44" ry="58" fill="none" stroke="#6e4f24" stroke-width="3"/>
  <path d="M62 128 Q100 120 138 128 M60 160 Q100 152 140 160 M66 190 Q100 184 134 190" stroke="#7d5a2a" stroke-width="3" fill="none"/>
  <circle cx="100" cy="70" r="30" fill="#c29a58" stroke="#6e4f24" stroke-width="3"/>
  <path d="M86 64 l8 8 m0 -8 l-8 8 M106 64 l8 8 m0 -8 l-8 8" stroke="#4a3018" stroke-width="3"/>
  <circle cx="100" cy="150" r="16" fill="none" stroke="#8c2a1c" stroke-width="5"/><circle cx="100" cy="150" r="5" fill="#8c2a1c"/>
</svg>`;
