'use strict';
/* Gold Farming: a joke. It looks like a gold-selling page, but you "grow" your gold, and the
   harvest button only reveals the punchline. No forms, no inputs, nothing that can take payment. */

const GOLD_IMG = n => `modules/gold-farming/img/${n}.png`;
const SEEDS = [
  { id: 'seedling', name: 'Gold Seedling', gold: '10', price: '$4.99', icon: 'goldcoins', note: 'A starter crop. Enough for a few stacks of Linen Cloth.' },
  { id: 'shrub', name: 'Gold Shrub', gold: '100', price: '$19.99', icon: 'goldstack', note: 'Most popular. Needs full sun and zero Blizzard GMs nearby.' },
  { id: 'orchard', name: 'Gold Orchard', gold: '1,000', price: '$49.99', icon: 'chest', note: 'Best value. Epic mount money, fresh off the branch.' },
];
const STAGES = [
  { img: 'seed', label: 'Freshly planted', line: 'You press the seed into the soil of Elwynn Forest. Somewhere, a gnoll is watching.' },
  { img: 'sprout', label: 'Sprouting', line: 'A sprout appears. A passing hunter tries to tame it.' },
  { img: 'bush', label: 'Growing', line: 'Fertilized with murloc tears. It is doing surprisingly well.' },
  { img: 'bloom', label: 'Blooming', line: 'It blooms. The petals jingle faintly.' },
  { img: 'goldstack', label: 'Ready to harvest', line: 'Your gold is fully grown and gleaming. Just one tiny step left.' },
];

let goldSeed = null, goldStage = 0, goldRevealed = false, goldDelivery = false, goldName = '', goldRealm = '';
const REALMS = ['PvE', 'PvP', 'RP', 'Hardcore'];

function goldPage() {
  const seed = SEEDS.find(s => s.id === goldSeed);
  let body;
  if (!seed) {
    body = `
      <p class="gf-kicker">Totally legitimate. Grown locally in Azeroth.</p>
      <h2 class="gf-title">Grow your own gold</h2>
      <p class="lead">Skip the grind. Pick a seed, water it, and harvest a fresh crop of gold in minutes.</p>
      <div class="gf-seeds">${SEEDS.map(s => `
        <button type="button" class="gf-seed" data-seed="${s.id}">
          <span class="frame" style="--size:56px"><img src="${GOLD_IMG(s.icon)}" alt=""></span>
          <b>${esc(s.name)}</b>
          <span class="gf-amount">${s.gold} gold</span>
          <span class="gf-price">${s.price}</span>
          <span class="gf-note">${esc(s.note)}</span>
          <span class="btn">Plant this seed</span>
        </button>`).join('')}</div>`;
  } else if (goldDelivery && !goldRevealed) {
    // "delivery details": only used on this page for the punchline. Never sent or stored.
    body = `
      <div class="gf-plot">
        <span class="frame" style="--size:96px;--cut:8px;--band:5px"><img src="${GOLD_IMG('goldstack')}" alt=""></span>
        <form class="gf-form" id="gf-deliver" autocomplete="off" novalidate>
          <p class="gf-kicker">${esc(seed.name)} &middot; ${seed.gold} gold &middot; ${seed.price}</p>
          <h2 class="gf-title">Where should we send it?</h2>
          <label for="gf-name">Character name</label>
          <input id="gf-name" maxlength="12" required spellcheck="false" placeholder="e.g. Leeroy">
          <fieldset><legend>Realm type</legend>
            ${REALMS.map((r, i) => `<label class="gf-radio"><input type="radio" name="gf-realm" value="${r}"${i === 0 ? ' checked' : ''}> ${r}</label>`).join('')}
          </fieldset>
          <button type="submit" class="btn gf-harvest">Send my gold</button>
          <button type="button" class="text-link gf-plain" data-gf="restart">Pick a different seed</button>
        </form>
      </div>`;
  } else if (!goldRevealed) {
    const st = STAGES[goldStage], ripe = goldStage === STAGES.length - 1;
    body = `
      <p class="gf-kicker">${esc(seed.name)} &middot; ${seed.gold} gold</p>
      <div class="gf-plot">
        <span class="frame gf-plant" style="--size:128px;--cut:10px;--band:6px"><img src="${GOLD_IMG(st.img)}" alt=""></span>
        <div>
          <h2 class="gf-title">${esc(st.label)}</h2>
          <p>${esc(st.line)}</p>
          <div class="progress" aria-hidden="true">${STAGES.map((x, i) => `<i class="${i < goldStage ? 'done' : i === goldStage ? 'now' : ''}"></i>`).join('')}</div>
          ${ripe
            ? `<button type="button" class="btn gf-harvest" data-gf="harvest">Harvest ${seed.gold} gold for ${seed.price}</button>`
            : `<button type="button" class="btn" data-gf="water">Water it</button>`}
          <button type="button" class="text-link gf-plain" data-gf="restart">Pick a different seed</button>
        </div>
      </div>`;
  } else {
    body = `
      <div class="gf-reveal">
        <span class="frame" style="--size:96px;--cut:8px;--band:5px"><img src="${GOLD_IMG('bag')}" alt=""></span>
        <h2 class="gf-title">Gold doesn't grow on trees${goldName ? `, ${esc(goldName)}` : ''}.</h2>
        <p class="lead">Nothing is on its way to ${goldName ? esc(goldName) : 'you'}${goldRealm ? ` on your ${esc(goldRealm)} realm` : ''}. You nearly paid ${seed.price} for pixels you watered a few times. Nobody took your money: there is no payment here, and there never was.</p>
        <p>Buying gold is against Blizzard's rules and gets accounts banned. The honest way still works: pick a class, go kill things, and loot the gold yourself.</p>
        <div class="results-actions">
          <a class="btn" href="/classes">Pick a class and farm it for real</a>
          <button type="button" class="text-link gf-plain" data-gf="restart">Plant another joke seed</button>
        </div>
      </div>`;
  }
  app.innerHTML = `<div class="page gold-farming"><main class="page-body">${body}</main></div>`;
}

app.addEventListener('click', e => {
  if (document.body.dataset.module !== 'gold-farming') return;
  const seed = e.target.closest('[data-seed]');
  const act = e.target.closest('[data-gf]');
  if (seed) { goldSeed = seed.dataset.seed; goldStage = 0; goldRevealed = false; goldDelivery = false; }
  else if (act && act.dataset.gf === 'water') goldStage = Math.min(goldStage + 1, STAGES.length - 1);
  else if (act && act.dataset.gf === 'harvest') goldDelivery = true;
  else if (act && act.dataset.gf === 'restart') { goldSeed = null; goldStage = 0; goldRevealed = false; goldDelivery = false; goldName = goldRealm = ''; }
  else return;
  goldPage();
  scrollTo(0, 0);
});

// the "delivery" form never leaves the page: no action, no request, nothing saved
app.addEventListener('submit', e => {
  if (e.target.id !== 'gf-deliver') return;
  e.preventDefault();
  goldName = (document.getElementById('gf-name').value || '').trim().slice(0, 12);
  goldRealm = (e.target.querySelector('input[name="gf-realm"]:checked') || {}).value || '';
  goldRevealed = true;
  goldPage();
  scrollTo(0, 0);
});

registerModule({
  id: 'gold-farming',
  label: 'Gold Farming',
  render() { tipCtx = null; goldPage(); },
});
