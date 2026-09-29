'use strict';
/* Idle-loop concept: home row -> class page (Spec Preview / Leveling Preview).
   Reads Skyy's CLASSES (forever-class-picker/data.js), TALENTS (data/talents/*.js), LEVELING (data/leveling.js). */

// file = footage name in out/ (female adds _f); null = not recorded yet
const ROSTER = [
  { id: 'druid',   race: 'Night Elf', file: 'druid' },
  { id: 'hunter',  race: 'Dwarf',     file: 'hunter' },
  { id: 'mage',    race: 'Gnome',     file: 'mage' },
  { id: 'paladin', race: 'Human',     file: 'paladin' },
  { id: 'priest',  race: 'Troll',     file: 'priest' },
  { id: 'rogue',   race: 'Skyborne',  file: 'rogue' },
  { id: 'shaman',  race: 'Orc',       file: 'shaman' },
  { id: 'warlock', race: 'Undead',    file: 'warlock' },
  { id: 'warrior', race: 'Tauren',    file: 'warrior' },
];
const TALENT_POINTS_START = 10;
const app = document.getElementById('app');
const tip = document.getElementById('tip');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const cls = id => CLASSES.find(c => c.id === id);

/* ---------- male / female, remembered per class ---------- */
let sexOf = {};
try { sexOf = JSON.parse(localStorage.getItem('sexOf')) || {}; } catch {}
const sexFor = id => sexOf[id] || 'male';
function setSex(id, s) {
  sexOf[id] = s;
  try { localStorage.setItem('sexOf', JSON.stringify(sexOf)); } catch {}
  syncSex();
}
function syncSex() {
  document.querySelectorAll('[data-sex-of]').forEach(b => b.setAttribute('aria-pressed', sexFor(b.dataset.sexOf) === b.dataset.sex));
  document.querySelectorAll('.card').forEach(c => { c.dataset.sex = sexFor(c.dataset.cls); });
  const still = document.querySelector('.stage > img');
  const r = still && ROSTER.find(r => r.id === still.dataset.cls);
  if (r) still.src = stillSrc(r);
}
const MARS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="14" r="6"/><path d="M14.5 9.5 20 4m-5 0h5v5"/></svg>';
const VENUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M12 15v7m-3.5-3.5h7"/></svg>';
// small icon pair for the cards; labelled segmented toggle for the class page
const sexIcons = id => `<div class="sexpick" role="group" aria-label="${esc(cls(id).name)} model">
  <button type="button" data-sex-of="${id}" data-sex="male" aria-label="Male" title="Male">${MARS}</button>
  <button type="button" data-sex-of="${id}" data-sex="female" aria-label="Female" title="Female">${VENUS}</button></div>`;
const sexToggle = id => `<div class="seg" role="group" aria-label="Character model">
  <button type="button" data-sex-of="${id}" data-sex="male">Male</button><button type="button" data-sex-of="${id}" data-sex="female">Female</button></div>`;
const stillSrc = r => `out/still/${r.file}${sexFor(r.id) === 'female' ? '_f' : ''}.webp`;

/* ---------- home ---------- */
function home() {
  const vid = (name, s) => `<video class="${s}" poster="out/${name}.jpg" autoplay muted loop playsinline>
    <source src="out/${name}.webm" type="video/webm"><source src="out/${name}.mp4" type="video/mp4"></video>`;
  app.innerHTML = `<main class="home">
    <div class="row">${ROSTER.map(r => {
      const c = cls(r.id);
      return `<div class="card" data-cls="${r.id}"><a class="card-link" href="#/${r.id}">
        <span class="name" style="color:${c.text}">${c.name}</span>
        <div class="box">${r.file ? vid(r.file, 'm') + vid(r.file + '_f', 'f') : `<div class="todo">${r.race}</div>`}</div>
        <span class="frame"><img src="icons/${r.id}.png" alt=""></span></a>
        ${r.file ? sexIcons(r.id) : ''}</div>`;
    }).join('')}</div>
    <nav class="mini" id="mini" aria-label="Classes">
      ${ROSTER.map(r => `<a class="frame" data-cls="${r.id}" href="#/${r.id}" title="${esc(cls(r.id).name)}"><img src="icons/${r.id}.png" alt="${esc(cls(r.id).name)}"></a>`).join('')}
    </nav>
    <nav class="home-links" aria-label="Help choosing">
      <a class="btn" href="#/quiz">Not sure? Take the 7-question quiz</a>
      <a class="text-link" href="#/compare">Compare two specs</a>
    </nav>
    <section class="classinfo" id="classinfo" hidden></section></main>`;
  // show the compact bar once the card row has scrolled away
  const row = app.querySelector('.row'), mini = document.getElementById('mini');
  new IntersectionObserver(([e]) => mini.classList.toggle('shown', !e.isIntersecting && e.boundingClientRect.top < 0))
    .observe(row);
}

// Selecting a card again closes its section.
function showClass(id) {
  document.querySelectorAll('.card, .mini a').forEach(el => {
    const on = el.dataset.cls === id;
    el.setAttribute('aria-current', on);
    if (el.classList.contains('card')) el.querySelector('.card-link').href = on ? '#/' : `#/${el.dataset.cls}`;
  });
  const info = document.getElementById('classinfo');
  if (!id) { info.hidden = true; info.innerHTML = ''; return; }
  if (!info.hidden && info.dataset.cls !== id) {
    // crossfade: fade out, swap, fade in. Keep the reader at the top of the section if they were inside it.
    info.classList.add('fading');
    setTimeout(() => {
      fillClass(info, id);
      const top = info.getBoundingClientRect().top;
      if (top < 0) scrollTo({ top: scrollY + top - 80 });
      info.classList.remove('fading');
    }, 160);
    return;
  }
  fillClass(info, id);
}

function fillClass(info, id) {
  const c = cls(id);
  setClassColor(c);
  const list = items => `<ul class="points">${items.map(i => `<li><b>${esc(i.lead)}.</b> ${esc(i.text)}</li>`).join('')}</ul>`;
  info.innerHTML = `
    <div class="glance">
      <div class="who">
        <h2>${esc(c.name)}</h2>
        <p class="pitch">${esc(c.pitch)}</p>
        <ul class="spec-list">${c.specs.map(sp => `<li><a href="#/${id}/${sp.id}">
          ${specIcon(id, sp.id) ? `<span class="frame">${specIcon(id, sp.id)}</span>` : '<span class="dot"></span>'}
          <b>${esc(sp.name)}</b>${isPick(id, sp.id) ? '<span class="pick">Leveling pick</span>' : ''}<span class="role">${esc(sp.role)}</span></a></li>`).join('')}</ul>
        <a class="btn" href="#/${id}/${(typeof LEVELING_PICK !== 'undefined' && LEVELING_PICK[id]) || c.specs[0].id}">Specs &amp; Leveling &rarr;</a>
        ${typeof VIDEO !== 'undefined' && VIDEO.chapters[id] ? `<a class="text-link video-link" href="${videoUrl(VIDEO.chapters[id])}" target="_blank" rel="noopener">Watch Skyy's ${esc(c.name)} chapter</a>` : ''}
      </div>
      <div><h3>Strengths</h3>${list(c.strengths)}</div>
      <div><h3>Weaknesses</h3>${list(c.weaknesses)}</div>
    </div>
    <div class="more">
      <p class="summary">${esc(c.summary)}</p>
      <h3>Who it's for</h3>${c.idealPlayer.map(p => `<p>${esc(p)}</p>`).join('')}
      <h3>What's new for ${esc(c.name)}s in Forever</h3>
      <ul class="changes">${c.changes.map(ch => `<li>${ch.tag ? `<span class="tag">${esc(TAGS[ch.tag])}</span>` : ''}<b>${esc(ch.term)}.</b> ${esc(ch.text)}</li>`).join('')}</ul>
      <div class="outro">${c.outro.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    </div>`;
  info.hidden = false;
  info.dataset.cls = id;
}

// Skyy's spec id -> the game's tree ("feral" matches "feral-combat")
const findTree = (talents, specId) => talents.specs.find(t => t.id === specId || t.id.split('-')[0] === specId);

const isPick = (cls, spec) => typeof LEVELING_PICK !== 'undefined' && LEVELING_PICK[cls] === spec;

function setClassColor(c) {
  document.documentElement.style.setProperty('--cls', c.color);
  document.documentElement.style.setProperty('--cls-text', c.text);
}
function specIcon(id, specId) {
  const t = window.TALENTS && TALENTS[id] && findTree(TALENTS[id], specId);
  return t ? `<img src="data/icons/${t.icon}.png" alt="">` : '';
}

/* ---------- class page ---------- */
function classPage(id, specId, leveling) {
  const c = cls(id), r = ROSTER.find(r => r.id === id);
  const spec = c.specs.find(s => s.id === specId) || c.specs[0];
  const talents = window.TALENTS && TALENTS[id];
  const tree = talents && findTree(talents, spec.id);
  const build = typeof LEVELING !== 'undefined' && LEVELING[id] && LEVELING[id][spec.id];
  setClassColor(c);
  tipCtx = {
    abilities: (talents && talents.abilities) || {},
    // every talent in the class, so text can mention another spec's talents
    talents: talents ? Object.fromEntries(talents.specs.flatMap(sp => sp.talents).map(t => [t.name, t])) : {},
    pts: buildPoints(build),
  };
  const specLinks = c.specs.map(s => `<a href="#/${id}/${s.id}${leveling ? '/leveling' : ''}" aria-current="${s.id === spec.id}"${isPick(id, s.id) ? ' title="Our leveling pick"' : ''}>${specIcon(id, s.id)}${esc(s.name)}${isPick(id, s.id) ? '<span class="pick-dot" aria-label="leveling pick"></span>' : ''}</a>`).join('');
  const modeBtn = leveling
    ? `<a class="btn" href="#/${id}/${spec.id}">&larr; Spec Preview</a>`
    : (tree ? `<a class="btn" href="#/${id}/${spec.id}/leveling">Leveling Preview &rarr;</a>`
            : `<span class="btn" aria-disabled="true">Leveling Preview soon</span>`);

  app.innerHTML = `
    <div class="spec-page ${leveling ? 'leveling' : ''}">
      <header class="bar">
        <a class="back" href="#/${id}">&larr; ${esc(c.name)} overview</a>
        <h1>${esc(c.name)}</h1>
        <nav class="seg" aria-label="Specialization">${specLinks}</nav>
        <span class="gap"></span>
        ${r.file ? sexToggle(id) : ''}
        ${modeBtn}
      </header>
      <div class="view">
        <div class="stage">
          ${r.file ? `<img data-cls="${id}" src="${stillSrc(r)}" alt="${esc(r.race)} ${esc(c.name)}">` : `<div class="nostill">${esc(r.race)} ${esc(c.name)}: footage not recorded yet</div>`}
        </div>
        <div class="panels">${leveling ? levelingPanels(c, spec, tree, build, talents) : specPanels(c, spec)}</div>
      </div>
    </div>`;
  if (leveling && tree) wireTree(tree, build, talents);
}

// Skyy's change headings that aren't a talent name -> the talent or ability whose icon fits.
const CHANGE_ICONS = {
  'Seal twisting, made forgiving': 'Seal of Command',
  'Shockadin': 'Holy Shock',
  'Bear or cat': 'Bear Form',
  'A regular resurrection': 'Revive',
};

// Spec Preview: text straight on the dark side of the stage, character alone on the right.
function specPanels(c, spec) {
  const [hook, ...restFirst] = spec.intro[0].split(/(?<=[.!?])\s+/);
  const rest = [restFirst.join(' ')].filter(Boolean);  // first paragraph only: what the spec is (playstyle lives in the Leveling Preview)
  // Every row gets an icon: exact name, alias, a name inside the heading, else the spec's own icon.
  const known = n => tipCtx.talents[n] ? 'tal' : tipCtx.abilities[n] ? 'ab' : null;
  const names = [...Object.keys(tipCtx.talents), ...Object.keys(tipCtx.abilities)].sort((a, b) => b.length - a.length);
  const changeIcon = heading => {
    let term = CHANGE_ICONS[heading] || heading;
    if (!known(term)) {
      const escRe = n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      term = names.find(n => new RegExp(`\\b${escRe(n)}\\b`).test(heading)) || term;
    }
    const kind = known(term);
    if (!kind) {
      const own = specIcon(c.id, spec.id);
      return own ? `<span class="frame ch-icon">${own}</span>` : `<span class="ch-mark"></span>`;
    }
    const icon = (kind === 'tal' ? tipCtx.talents[term] : tipCtx.abilities[term]).icon;
    return `<span class="frame ch-icon" data-${kind}="${esc(term)}" tabindex="0"><img src="data/icons/${icon}.png" alt=""></span>`;
  };
  const changes = (spec.changes || []).map(ch => `<li>${changeIcon(ch.term)}<div>
      <b>${esc(ch.term)}</b>${ch.tag ? `<span class="tag">${esc(TAGS[ch.tag])}</span>` : ''}
      <p>${linkify(ch.text)}</p></div></li>`).join('');
  return `<section class="hero" aria-label="${esc(spec.name)}">
    <div class="eyebrow">${esc(c.name)} &middot; ${esc(spec.role)}</div>
    <h2 class="title">${esc(spec.name)}</h2>
    <p class="hook">${esc(hook)}</p>
    ${rest.map(p => `<p class="rest">${linkify(p)}</p>`).join('')}
    ${changes ? `<h3>What's changed in Forever</h3><ul class="changes2">${changes}</ul>` : ''}
  </section>`;
}

function levelingPanels(c, spec, tree, build, talents) {
  const draft = build && build.status === 'draft' ? '<span class="draft">Draft</span>' : '';
  const play = build
    ? `<h3 class="first">Key abilities</h3>
       <ul class="abilities">${build.abilities.map(a => {
         // trained ability (gold) or a talent that grants one (class colour), like the inline names
         const kind = tipCtx.abilities[a] ? 'ab' : tipCtx.talents[a] ? 'tal' : null;
         const d = kind === 'ab' ? tipCtx.abilities[a] : tipCtx.talents[a];
         return `<li>${kind ? `<span class="ab-chip ${kind}" data-${kind}="${esc(a)}" tabindex="0"><img src="data/icons/${d.icon}.png" alt="">${esc(a)}</span>` : esc(a)}</li>`;
       }).join('')}</ul>
       <h3>How it plays</h3>
       <ul class="how">${build.gameplay.map(g => `<li>${linkify(g)}</li>`).join('')}</ul>`
    : `<p class="note">The gameplay rundown for ${esc(spec.name)} is still being written.</p>`;

  let spent = 0;
  const steps = build ? build.steps.map((s, i) => {
    const n = Object.values(s.points).reduce((a, b) => a + b, 0);
    const from = TALENT_POINTS_START + spent, to = from + n - 1;
    spent += n;
    // respec builds: everything up to the respec level is spent at once at the trainer
    const lv = build.respec && to <= build.respec.level ? `At ${build.respec.level} (respec)`
      : from === to ? `Level ${from}` : `Levels ${from}–${to}`;
    return `<li data-step="${i}" tabindex="0"><span class="lv">${lv}</span>${linkify(s.text)}</li>`;
  }).join('') : '';
  const from = build && build.respec && c.specs.find(x => x.id === build.respec.from);
  const respecNote = from ? `<p class="respec">Level as <a href="#/${c.id}/${from.id}/leveling">${esc(from.name)}</a> until ${build.respec.level}, then respec into this build.</p>` : '';

  return `
    <section class="panel left" aria-label="Gameplay">
      <h2>${esc(spec.name)} at 1–30${draft}</h2>
      <div class="role">${esc(spec.role)}</div>
      ${play}
    </section>
    <section class="panel right level" aria-label="Level 30 talents">
      <h2>Talents to level 30${draft}</h2>
      <div class="cols">
        <div class="tree-wrap" id="tree-wrap">${tree ? `${treeSummary(talents)}<div class="tree" id="tree"></div><div id="also"></div>` : ''}</div>
        <div>${build ? `${respecNote}<ol class="steps">${steps}</ol>` : `<p class="note">The leveling build for ${esc(spec.name)} is coming soon. Hover the tree to read any talent.</p>`}</div>
      </div>
      <p class="source">Talent data from the WoW Forever beta client, build ${esc(talents.build)}.</p>
    </section>`;
}

/* ---------- tooltips: abilities and talents, anywhere on the page ---------- */
let tipCtx = null;  // { abilities: {name: a}, talents: {name: t}, pts: {name: n} } for the page on screen
const buildPoints = build => {
  const pts = {};
  (build ? build.steps : []).forEach(s => Object.entries(s.points).forEach(([n, p]) => { pts[n] = (pts[n] || 0) + p; }));
  return pts;
};
function tipHtml(el) {
  if (!tipCtx) return '';
  if (el.dataset.ab) {
    const a = tipCtx.abilities[el.dataset.ab];
    if (!a) return '';
    return `<div class="n">${esc(el.dataset.ab)}</div>
      <div class="meta"><span>${esc(a.cost || '')}</span><span>${esc(a.range || '')}</span></div>
      <div class="meta"><span>${esc(a.cast)}</span><span>${esc(a.cooldown || '')}</span></div>
      <div class="d">${esc(a.desc)}</div>
      ${a.learned ? `<div class="r">Learned at level ${a.learned}${a.learned < 30 ? ' &middot; shown at its level 30 rank' : ''}</div>` : ''}`;
  }
  const t = tipCtx.talents[el.dataset.tal];
  if (!t) return '';
  const p = tipCtx.pts[t.name] || 0, r = Math.max(p, 1);
  return `<span class="cd">${t.passive ? 'Passive' : esc(t.cooldown || '')}</span><div class="n">${esc(t.name)}</div>
    <div class="r">Talent &middot; rank ${p}/${t.max}</div><div class="d">${esc(t.ranks[r - 1])}</div>
    ${p < t.max ? `<div class="next">${p ? 'Next rank:' : 'Rank 1:'}<span>${esc(t.ranks[p])}</span></div>` : ''}`;
}
function showTip(el) {
  const html = tipHtml(el);
  if (!html) return;
  tip.innerHTML = html;
  tip.hidden = false;
  const b = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = b.right + 10, y = b.top;
  if (x + tw > innerWidth - 8) x = b.left - tw - 10;
  if (x < 8) { x = Math.max(8, Math.min(innerWidth - tw - 8, b.left)); y = b.bottom + 8; }
  tip.style.left = x + 'px';
  tip.style.top = Math.max(8, Math.min(y, innerHeight - th - 8)) + 'px';
}
const hideTip = () => { tip.hidden = true; };
const tipTarget = e => e.target.closest && e.target.closest('[data-ab], [data-tal]');
document.addEventListener('mouseover', e => { const el = tipTarget(e); if (el) showTip(el); });
document.addEventListener('mouseout', e => { if (tipTarget(e)) hideTip(); });
document.addEventListener('focusin', e => { const el = tipTarget(e); if (el) showTip(el); });
document.addEventListener('focusout', hideTip);
document.addEventListener('click', e => { const el = tipTarget(e); if (el) showTip(el); });
document.addEventListener('scroll', hideTip, { passive: true, capture: true });

// Wrap ability and talent names in running text so they get tooltips. Longest names first,
// so "Improved Seal of Fury" wins over "Seal of Fury".
function linkify(text) {
  if (!tipCtx) return esc(text);
  const kind = {};
  Object.keys(tipCtx.abilities).forEach(n => { kind[n] = 'ab'; });
  Object.keys(tipCtx.talents).forEach(n => { kind[n] = 'tal'; });
  const names = Object.keys(kind).sort((a, b) => b.length - a.length);
  if (!names.length) return esc(text);
  const escRe = n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b(${names.map(escRe).join('|')})\\b`, 'g');
  const icon = n => (kind[n] === 'ab' ? tipCtx.abilities[n] : tipCtx.talents[n]).icon;
  return esc(text).replace(re, n =>
    `<span class="ref ${kind[n]}" data-${kind[n]}="${esc(n)}" tabindex="0"><img src="data/icons/${icon(n)}.png" alt="">${n}</span>`);
}

/* ---------- talent tree ---------- */
// "Balance 0 · Feral 19 · Restoration 2", in the game's tree order
function treeSummary(talents) {
  const per = talents.specs.map(t => [t.name, t.talents.reduce((a, x) => a + (tipCtx.pts[x.name] || 0), 0)]);
  if (!per.some(([, v]) => v)) return '';
  return `<div class="tree-sum">${per.map(([n, v]) => `<span class="${v ? 'on' : ''}">${esc(n)} <b>${v}</b></span>`).join('')}</div>`;
}

function wireTree(tree, build, talents) {
  const el = document.getElementById('tree'), wrap = document.getElementById('tree-wrap');
  const pts = {}, stepOf = {};
  (build ? build.steps : []).forEach((s, i) => Object.entries(s.points).forEach(([n, p]) => {
    pts[n] = (pts[n] || 0) + p;
    (stepOf[n] = stepOf[n] || []).push(i);
  }));
  const cs = getComputedStyle(el);
  const cell = parseFloat(cs.getPropertyValue('--cell')), gap = parseFloat(cs.getPropertyValue('--gap'));
  const center = t => [(t.col - 1) * (cell + gap) + cell / 2, (t.row - 1) * (cell + gap) + cell / 2];
  const byId = Object.fromEntries(tree.talents.map(t => [t.id, t]));
  const lines = tree.talents.flatMap(t => t.req.map(r => {
    const [x1, y1] = center(byId[r]), [x2, y2] = center(t);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${pts[t.name] ? 'on' : ''}"/>`;
  })).join('');
  const w = 4 * cell + 3 * gap, h = 7 * cell + 6 * gap;
  const slot = (t, style = '') => {
    const p = pts[t.name] || 0;
    return `<div class="slot ${p ? 'on' : ''} ${p === t.max ? 'max' : ''}" ${style}>
      <button type="button" class="talent frame ${p === t.max ? 'gold' : ''}" data-tal="${esc(t.name)}"
        data-steps="${(stepOf[t.name] || []).join(' ')}" aria-label="${esc(t.name)} ${p}/${t.max}">
        <img src="data/icons/${t.icon}.png" alt=""></button><span class="pts">${p}/${t.max}</span></div>`;
  };
  el.innerHTML = `<svg width="${w}" height="${h}" aria-hidden="true">${lines}</svg>` +
    tree.talents.map(t => slot(t, `style="grid-row:${t.row};grid-column:${t.col}"`)).join('');
  // talents the build takes from the class's other trees
  document.getElementById('also').innerHTML = talents.specs.filter(t => t !== tree)
    .map(t => [t, t.talents.filter(x => pts[x.name])]).filter(([, xs]) => xs.length)
    .map(([t, xs]) => `<div class="also"><span class="also-h">Also from ${esc(t.name)}</span><div class="also-row">${xs.map(x => slot(x)).join('')}</div></div>`).join('');

  // hovering a step lights up its talents on the tree
  const light = i => {
    wrap.classList.toggle('focus', i !== null);
    wrap.querySelectorAll('.slot').forEach(b => b.classList.toggle('lit', i !== null && b.firstElementChild.dataset.steps.split(' ').includes(String(i))));
    document.querySelectorAll('.steps li').forEach(li => li.classList.toggle('lit', li.dataset.step === String(i)));
  };
  document.querySelectorAll('.steps li').forEach(li => {
    li.addEventListener('mouseenter', () => light(+li.dataset.step));
    li.addEventListener('focus', () => light(+li.dataset.step));
    li.addEventListener('mouseleave', () => light(null));
    li.addEventListener('blur', () => light(null));
  });
}

/* ---------- quiz, results, compare (ported from the class picker) ---------- */
const videoUrl = start => `https://www.youtube.com/watch?v=${VIDEO.id}${start ? `&t=${start}s` : ''}`;
const tagChip = tag => (tag ? `<span class="tag">${esc(TAGS[tag])}</span>` : '');
const accent = c => `style="--cls:${c.color};--cls-text:${c.text}"`;
const classIcon = (c, size = 44) => `<span class="frame" style="--size:${size}px;--cut:4px;--band:3px"><img src="icons/${c.id}.png" alt=""></span>`;
const pageShell = (title, body) => `
  <div class="page">
    <header class="bar"><a class="back" href="#/">&larr; All classes</a><h1 class="page-h">${title}</h1></header>
    <main class="page-body">${body}</main>
  </div>`;

function quizPage(answers) {
  let at = answers.findIndex(a => a === null);
  if (at === -1) at = QUESTIONS.length - 1;
  const q = QUESTIONS[at];
  const withAnswer = value => {
    const a = answers.slice(); a[at] = value;
    return `#/${a.every(x => x !== null) ? 'results' : 'quiz'}?a=${encodeAnswers(a)}`;
  };
  const back = () => { const a = answers.slice(); a[at] = null; a[at - 1] = null; return `#/quiz?a=${encodeAnswers(a)}`; };
  app.innerHTML = pageShell('Find your class', `
    <div class="quiz">
      <p class="quiz-count">Question ${at + 1} of ${QUESTIONS.length}</p>
      <div class="progress" aria-hidden="true">${QUESTIONS.map((x, i) => `<i class="${i < at ? 'done' : i === at ? 'now' : ''}"></i>`).join('')}</div>
      <h2 tabindex="-1">${esc(q.prompt)}</h2>
      <div class="quiz-options">
        ${q.options.map((o, i) => `<a class="option" href="${withAnswer(i + 1)}">${esc(o.label)}</a>`).join('')}
        <a class="option quiet" href="${withAnswer(0)}">No preference</a>
      </div>
      <div class="quiz-foot">${at > 0 ? `<a href="${back()}">&larr; Back to question ${at}</a>` : '<span></span>'}<a href="#/">Leave the quiz</a></div>
    </div>`);
}

function resultsPage(answers) {
  const ranked = scoreQuiz(answers, CLASSES);
  const answered = answers.some(a => a);
  const byId = id => CLASSES.find(c => c.id === id);
  const top = answered ? ranked.slice(0, 3) : [];
  app.innerHTML = pageShell(answered ? 'Your three best matches' : 'No preference on anything', `
    <div class="results">
      <p class="lead">${answered
        ? 'Scored against all 27 specs. Read the one that sounds right, then check the others. The quiz is a starting point, not a verdict.'
        : 'You skipped every question, so every spec ties. Retake the quiz and answer at least one, or browse all nine classes.'}</p>
      ${top.length ? `<ol class="podium">${top.map((r, i) => `
        <li class="match${i === 0 ? ' first' : ''}" ${accent(byId(r.classId))}>
          ${classIcon(byId(r.classId), i === 0 ? 64 : 48)}
          <div>
            <span class="match-rank">${['Best match', 'Second', 'Third'][i]}</span>
            <div class="match-title"><h2>${esc(r.specName)} ${esc(r.className)}</h2><span class="match-score">${r.score}% match</span></div>
            <div class="meter" aria-hidden="true"><i style="width:${r.score}%"></i></div>
            <div class="match-role">${esc(r.role)}</div>
            ${r.reasons.length ? `<ul>${r.reasons.slice(0, 3).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
            <a class="text-link" href="#/${r.classId}/${r.specId}">Read about ${esc(r.specName)} ${esc(r.className)} &rarr;</a>
          </div>
        </li>`).join('')}</ol>` : ''}
      ${answered ? `<details class="ranking"><summary>See how all 27 specs scored</summary><ol>
        ${ranked.map(r => `<li ${accent(byId(r.classId))}><a href="#/${r.classId}/${r.specId}" style="--score:${r.score}%"><span>${esc(r.specName)} ${esc(r.className)}</span><span>${r.score}%</span></a></li>`).join('')}
      </ol></details>` : ''}
      <div class="results-actions">
        ${top.length > 1 ? `<a class="btn" href="#/compare?a=${top[0].classId}.${top[0].specId}&b=${top[1].classId}.${top[1].specId}">Compare your top two</a>` : ''}
        ${answered ? '<button type="button" class="btn quiet-btn" id="copyBtn">Copy link to these results</button>' : ''}
        <a class="text-link" href="#/quiz">Retake the quiz</a>
      </div>
      <input class="share-url" id="shareUrl" readonly hidden aria-label="Link to these results">
    </div>`);
  const btn = document.getElementById('copyBtn');
  if (btn) btn.addEventListener('click', () => {
    const done = () => { btn.textContent = 'Link copied'; setTimeout(() => { btn.textContent = 'Copy link to these results'; }, 2500); };
    const fallback = () => { const i = document.getElementById('shareUrl'); i.hidden = false; i.value = location.href; i.focus(); i.select(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, fallback); else fallback();
  });
}

const RATING_WORDS = {
  pet: ['None', 'Optional', 'Central to the spec'],
  complexity: ['', 'Simple', 'A few things to track', 'A lot to juggle'],
  support: ['', 'Own performance', 'Some of both', 'Brings a lot to a party'],
  solo: ['', 'Best in a group', 'Fine either way', 'Strong alone'],
};

function comparePage(a, b) {
  const key = x => (x ? `${x.cls.id}.${x.spec.id}` : '');
  const name = x => `${x.spec.name} ${x.cls.name}`;
  const picker = (id, label, chosen) => `
    <div><label for="${id}">${label}</label>
      <select id="${id}" data-compare><option value="">Choose a spec</option>
        ${CLASSES.map(c => `<optgroup label="${esc(c.name)}">${c.specs.map(s => {
          const v = `${c.id}.${s.id}`;
          return `<option value="${v}"${v === key(chosen) ? ' selected' : ''}>${esc(s.name)} ${esc(c.name)}</option>`;
        }).join('')}</optgroup>`).join('')}
      </select></div>`;
  const rows = a && b ? [
    ['Role', x => x.spec.role],
    ['Fights', x => (x.spec.range === 'melee' ? 'Up close' : 'From a distance')],
    ['Pet', x => RATING_WORDS.pet[x.spec.pet]],
    ['To juggle', x => RATING_WORDS.complexity[x.spec.complexity], true],
    ['Group help', x => RATING_WORDS.support[x.spec.support], true],
    ['Solo play', x => RATING_WORDS.solo[x.spec.solo], true],
    ['Our leveling pick', x => (isPick(x.cls.id, x.spec.id) ? 'Yes' : 'No')],
  ] : [];
  const side = x => `
    <section class="side" ${accent(x.cls)}>
      ${classIcon(x.cls)}
      <h2>${esc(name(x))}</h2>
      <p>${esc(x.spec.intro[0])}</p>
      <h3>What's changed</h3>
      <ul>${x.spec.changes.map(r => `<li>${esc(r.term)}${tagChip(r.tag)}</li>`).join('')}</ul>
      <a class="text-link" href="#/${x.cls.id}/${x.spec.id}">Read about ${esc(name(x))} &rarr;</a>
    </section>`;
  app.innerHTML = pageShell('Compare two specs', `
    <div class="compare">
      <p class="lead">${a && b ? 'Rows where the two differ are highlighted.' : 'Pick any two of the 27 specs to see them side by side.'}</p>
      <div class="pickers">${picker('pickA', 'First spec', a)}${picker('pickB', 'Second spec', b)}</div>
      ${a && b ? `
      <table class="compare-table">
        <thead><tr><th scope="col"><span class="sr">Trait</span></th><th scope="col" ${accent(a.cls)}>${esc(name(a))}</th><th scope="col" ${accent(b.cls)}>${esc(name(b))}</th></tr></thead>
        <tbody>${rows.map(([label, get, rated]) => {
          const differs = get(a) !== get(b) ? ' class="differs"' : '';
          return `<tr><th scope="row">${label}${rated ? ' *' : ''}</th><td${differs}>${esc(get(a))}</td><td${differs}>${esc(get(b))}</td></tr>`;
        }).join('')}</tbody>
      </table>
      <p class="fine">* These three are this site's reading of the guide, not something Skyy rated.</p>
      <div class="sides">${side(a)}${side(b)}</div>` : ''}
    </div>`);
  app.querySelectorAll('[data-compare]').forEach(sel => sel.addEventListener('change', () => {
    const va = document.getElementById('pickA').value, vb = document.getElementById('pickB').value;
    location.hash = `#/compare?a=${va}&b=${vb}`;
  }));
}

/* ---------- router ---------- */
function route() {
  tip.hidden = true;
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const q = new URLSearchParams(query);
  if (path === 'quiz' || path === 'results' || path === 'compare') {
    tipCtx = null;
    if (path === 'quiz') quizPage(parseAnswers(q.get('a')));
    else if (path === 'results') resultsPage(parseAnswers(q.get('a')));
    else comparePage(findSpec(q.get('a'), CLASSES), findSpec(q.get('b'), CLASSES));
    scrollTo(0, 0);
    return;
  }
  const [id, spec, mode] = path.split('/');
  const known = id && cls(id) && ROSTER.some(r => r.id === id);
  if (known && spec) {
    classPage(id, spec, mode === 'leveling');
    scrollTo(0, 0);
  } else {
    tipCtx = null;
    if (!document.querySelector('.home')) home();  // keep the videos playing between classes
    showClass(known ? id : null);
  }
  syncSex();
}
document.addEventListener('click', e => { const b = e.target.closest('[data-sex-of]'); if (b) setSex(b.dataset.sexOf, b.dataset.sex); });
addEventListener('hashchange', route);
route();

/* ---------- ?fitcheck: visit every view and report what doesn't fit one screen (used by tools/check_fit.js) ---------- */
if (new URLSearchParams(location.search).has('fitcheck')) (async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const results = [];
  const views = [];
  for (const r of ROSTER) {
    const c = cls(r.id);
    views.push({ hash: `#/${r.id}`, kind: 'class' });
    for (const sp of c.specs) {
      views.push({ hash: `#/${r.id}/${sp.id}`, kind: 'spec' });
      if (window.TALENTS && TALENTS[r.id]) views.push({ hash: `#/${r.id}/${sp.id}/leveling`, kind: 'spec' });
    }
  }
  for (const v of views) {
    location.hash = v.hash;
    await wait(250);
    const problems = [];
    if (v.kind === 'class') {
      // the at-a-glance block has to be fully visible without scrolling
      scrollTo(0, 0);
      const g = document.querySelector('.glance');
      if (g && g.getBoundingClientRect().bottom > innerHeight) problems.push(`glance ends at ${Math.round(g.getBoundingClientRect().bottom)}px`);
    } else {
      document.querySelectorAll('.hero, .panel').forEach(p => {
        if (p.scrollHeight > p.clientHeight + 1) problems.push(`${p.className} ${p.scrollHeight - p.clientHeight}px too tall`);
      });
      if (document.documentElement.scrollHeight > innerHeight + 1) problems.push('page scrolls');
    }
    results.push({ view: v.hash, problems });
  }
  document.body.innerHTML = `<pre id="fitcheck">${JSON.stringify({ size: [innerWidth, innerHeight], results })}</pre>`;
})();
