'use strict';
/* Forever Guide shell: site header, page addresses, tooltips. Each section of the site is a module
   (modules/<id>/<id>.js) that calls registerModule({ id, label, render(parts, query), views() }). */

const SITE = 'Forever Guide';
const app = document.getElementById('app');
const tip = document.getElementById('tip');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- modules and header ---------- */
const MODULES = [];
function registerModule(m) { MODULES.push(m); }

function renderHeader(active) {
  document.getElementById('site-header').innerHTML = `
    <a class="brand" href="/classes">${SITE}</a>
    <nav class="site-nav" aria-label="Site">
      ${MODULES.map(m => `<a href="/${m.id}"${m.id === active ? ' aria-current="page"' : ''}>${esc(m.label)}</a>`).join('')}
    </nav>`;
}

/* ---------- page addresses ---------- */
// Old share links used #/paladin/protection; they still work.
function legacyRedirect() {
  if (!location.hash.startsWith('#/')) return false;
  const rest = location.hash.slice(2);
  history.replaceState(null, '', '/classes' + (rest ? '/' + rest : ''));
  return true;
}

function go(href, replace = false) {
  if (replace) history.replaceState(null, '', href); else history.pushState(null, '', href);
  route();
}

function route() {
  tip.hidden = true;
  legacyRedirect();
  const parts = location.pathname.split('/').filter(Boolean);
  if (!parts.length) { history.replaceState(null, '', '/classes' + location.search); return route(); }
  const mod = MODULES.find(m => m.id === parts[0]) || MODULES[0];
  renderHeader(mod.id);
  document.title = `${mod.label} | ${SITE}`;
  document.body.dataset.module = mod.id;
  mod.render(mod.id === parts[0] ? parts.slice(1) : [], new URLSearchParams(location.search));
}

// same-site links move without a page load
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="/"]');
  if (!a || a.target || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  if (a.getAttribute('href') !== location.pathname + location.search) go(a.getAttribute('href'));
});
addEventListener('popstate', route);

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


/* ---------- ?fitcheck: visit every view and report what doesn't fit one screen (used by tools/check_fit.js) ---------- */
function fitcheck() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    const results = [];
    for (const v of MODULES.flatMap(m => (m.views ? m.views() : []))) {
      go(v.path);
      await wait(250);
      const problems = [];
      if (v.kind === 'class') {
        scrollTo(0, 0);  // the at-a-glance block has to be fully visible without scrolling
        const g = document.querySelector('.glance');
        if (g && g.getBoundingClientRect().bottom > innerHeight) problems.push(`glance ends at ${Math.round(g.getBoundingClientRect().bottom)}px`);
      } else {
        document.querySelectorAll('.hero, .panel').forEach(p => {
          if (p.scrollHeight > p.clientHeight + 1) problems.push(`${p.className} ${p.scrollHeight - p.clientHeight}px too tall`);
        });
        if (document.documentElement.scrollHeight > innerHeight + 1) problems.push('page scrolls');
      }
      results.push({ view: v.path, problems });
    }
    document.body.innerHTML = `<pre id="fitcheck">${JSON.stringify({ size: [innerWidth, innerHeight], results })}</pre>`;
  })();
}

function start() {
  if (new URLSearchParams(location.search).has('fitcheck')) { route(); fitcheck(); return; }
  route();
}
