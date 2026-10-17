'use strict';
/* The target dummy: a small combat simulation that plays by the game's rules (global cooldown, cooldowns,
   cast times, channels, the spell queue window, rage/energy/mana, combo points, procs, stances and forms).
   Pure: no DOM. Time is in seconds and comes from the caller (performance.now() / 1000 in the page),
   so a test can drive it exactly. Class-specific rules live in classes.js (CLASS_RULES).
   Numbers: client spell data (SPELLS) and RULES. Damage only needs to be believable (see the design doc). */

// Small seeded random generator, so a test (or a replay) gets the same rolls.
function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Highest rank learned by this level, or null.
function rankAt(ability, level) {
  let r = null;
  for (const x of ability.ranks) if (x.level <= level) r = x;
  return r;
}

const rageConversion = (R, L) => R.rageConversion.a * L * L + R.rageConversion.b * L + R.rageConversion.c;
const NO_RULES = {};

/* opts: { cls, spec, level, spells: SPELLS[cls], rules: RULES, seed, duration (s) | dummyHp, hitBack, healer,
           distance: 'melee' | 'ranged', stealth (start in stealth), onBar: Set of ability keys (for missed procs) } */
function createSim(opts) {
  const R = opts.rules, L = opts.level, cls = opts.cls;
  const rng = seededRng(opts.seed == null ? 1 : opts.seed);
  const hooks = (typeof CLASS_RULES !== 'undefined' && CLASS_RULES[cls]) || NO_RULES;
  const abilities = {};
  opts.spells.abilities.forEach(a => { abilities[a.key] = a; });
  const formInfo = {};
  opts.spells.forms.forEach(f => { formInfo[f.id] = f; });

  const hpMax = Math.round(R.healthPool.value(L));
  const manaMax = Math.round(R.manaPool.value(L));
  const s = {
    t: 0, start: 0, level: L, cls, spec: opts.spec, inCombat: false, over: false,
    form: null, hp: hpMax, hpMax, mana: manaMax, manaMax, rage: 0, rageMax: R.rageMax.value,
    energy: R.energyMax.value, energyMax: R.energyMax.value, combo: 0,
    gcdEnd: 0, casting: null, queue: null, swingQueued: null,
    autoMelee: false, nextSwing: 0, nextOffSwing: 0, autoRanged: null, nextShot: 0,
    cds: {}, catCds: {}, buffs: {}, debuffs: {}, procs: {}, pet: false,
    lastManaSpend: -99, nextManaTick: R.manaTick.value, nextDummySwing: 0, nextPetSwing: 0,
    target: { hp: 1, hpMax: 1 }, party: null, focus: 0, hint: null, front: !!opts.hitBack,  // tanks face the dummy: it can parry and block
    distance: opts.distance || (cls === 'hunter' ? 'ranged' : 'melee'),
    stats: { damage: 0, healing: 0, overheal: 0, casts: 0, wrongKeys: 0, clicks: 0, failed: 0, idle: 0,
      procsUsed: 0, procsMissed: 0, hintPresses: 0, hintFollowed: 0, deaths: 0, byAbility: {} },
    events: [],
  };
  const duration = opts.duration || 0;
  const dummyHp = opts.dummyHp || 0;
  s.target.hpMax = dummyHp || 1;
  s.target.hp = s.target.hpMax;

  const sim = { state: s, abilities, rules: R, rng, opts };
  const ev = (type, extra) => { s.events.push(Object.assign({ t: s.t, type }, extra)); };
  sim.ev = ev;

  /* ---------- power ---------- */
  // which bar the player sees: rage for warriors and bears, energy for rogues and cats, mana for the rest
  sim.powerType = () => {
    if (hooks.powerType) { const p = hooks.powerType(sim); if (p) return p; }
    return cls === 'warrior' ? 'rage' : cls === 'rogue' ? 'energy' : 'mana';
  };
  const getPower = p => (p === 'rage' ? s.rage : p === 'energy' ? s.energy : p === 'mana' ? s.mana : Infinity);
  sim.gain = (p, n) => {
    if (p === 'rage') s.rage = Math.min(s.rageMax, Math.max(0, s.rage + n));
    else if (p === 'energy') s.energy = Math.min(s.energyMax, Math.max(0, s.energy + n));
    else if (p === 'mana') s.mana = Math.min(s.manaMax, Math.max(0, s.mana + n));
  };
  sim.costOf = rank => {
    if (!rank.power) return 0;
    if (s.buffs.Clearcasting && (rank.power === 'mana' || hooks.clearcastAny)) return 0;  // the next spell is free
    if (rank.costPct) return Math.round(R.baseMana.value(L) * rank.costPct / 100);
    return rank.cost || 0;
  };

  /* ---------- forms ---------- */
  // The game's shapeshift check (stance-type forms let normal spells through; cat/bear don't).
  sim.formBlock = rank => {
    if (rank.eff && rank.eff.some(e => e.t === 'form')) return null;  // shifting straight from one form to another is allowed
    const f = s.form, need = rank.forms || null;
    if (f == null) return need && !rank.allowNoForm ? 'needForm' : null;
    if (rank.notForms && rank.notForms.includes(f)) return 'wrongForm';
    if (need && need.includes(f)) return null;
    const stance = formInfo[f] ? formInfo[f].stance : true;
    if (!stance) return rank.noShift || need ? 'shifted' : null;
    return need && !rank.allowNoForm ? 'needForm' : null;
  };
  sim.setForm = form => {
    const old = s.form;
    s.form = form;
    if (hooks.onForm) hooks.onForm(sim, old, form);
    ev('form', { form });
  };

  /* ---------- weapon and stats ---------- */
  sim.weapon = () => (hooks.weapon ? hooks.weapon(sim) : { speed: R.weapon.speed.oneHand, dps: R.weapon.dps1H(L), kind: '1H', dw: false });
  const ap = () => (hooks.attackPower ? hooks.attackPower(sim) : R.attackPower.melee(L));
  const sp = () => R.spellPower.value(L);
  const weaponRoll = (w, hand) => {
    const avg = w.dps * w.speed + ap() / R.attackPower.apPerDps * w.speed;
    const dmg = avg * (0.8 + rng() * 0.4);
    return hand === 'off' ? dmg * R.offhandDmg.value : dmg;
  };
  sim.weaponRoll = weaponRoll;
  const critMelee = () => R.critMelee.perLevel(L), critSpell = () => R.critSpell.perLevel(L);

  /* ---------- the dummy's health ---------- */
  // Timed runs: health follows the clock so the last 20% (Execute range) always comes. "Until it dies" runs: real damage.
  sim.targetPct = () => (dummyHp ? Math.max(0, s.target.hp / s.target.hpMax) : duration ? Math.max(0, 1 - (s.t - s.start) / duration) : 1);
  function damageTarget(amount, key, kind) {
    amount = Math.max(0, Math.round(amount));
    s.stats.damage += amount;
    const b = s.stats.byAbility[key] || (s.stats.byAbility[key] = { damage: 0, hits: 0, crits: 0 });
    b.damage += amount; b.hits++; if (kind === 'crit') b.crits++;
    if (dummyHp) s.target.hp = Math.max(0, s.target.hp - amount);
    ev(kind, { key, amount });
    if (dummyHp && s.target.hp <= 0 && !s.over) { s.over = true; ev('dead'); }
  }
  sim.damageTarget = damageTarget;

  /* ---------- hit tables ---------- */
  const T = R.meleeVsLevelMatched;
  // melee/ranged special attacks (yellow): no glancing
  function rollYellow(ranged) {
    const r = rng();
    let c = T.miss;
    if (r < c) return 'miss';
    if (!ranged) { c += T.dodge; if (r < c) return 'dodge'; }
    if (!ranged && s.front) { c += T.parry; if (r < c) return 'parry'; }
    c += critMelee();
    return r < c ? 'crit' : 'hit';
  }
  function rollWhite(dw) {
    const r = rng();
    let c = T.miss + (dw ? R.dualWieldMissPenalty.value : 0);
    if (r < c) return 'miss';
    c += T.dodge; if (r < c) return 'dodge';
    if (s.front) { c += T.parry; if (r < c) return 'parry'; }
    c += T.glancing; if (r < c) return 'glance';
    c += critMelee();
    return r < c ? 'crit' : 'hit';
  }
  function rollSpell() {
    const r = rng();
    if (r < R.spellMissVsLevelMatched.value) return 'miss';
    return r < R.spellMissVsLevelMatched.value + critSpell() ? 'crit' : 'hit';
  }
  sim.rollWhite = rollWhite;

  /* ---------- usability ---------- */
  const REASONS = {
    notLearned: 'Not learned yet', needForm: 'Wrong stance or form', wrongForm: 'Can\'t do that in this form',
    shifted: 'Can\'t do that while shapeshifted', cooldown: 'Not ready yet', gcd: 'Not ready yet', casting: 'Already casting',
    power: 'Not enough ', combo: 'That ability requires combo points', range: 'Out of range', tooClose: 'Target too close',
  };
  sim.reasonText = (reason, rank) => reason === 'power' ? REASONS.power + (rank && rank.power || '') : REASONS[reason] || reason;

  // { ok: true } or { ok: false, reason, until? }
  sim.usable = (key, t) => {
    t = t == null ? s.t : t;
    const a = abilities[key];
    if (!a) return { ok: false, reason: 'unknown' };
    const rank = rankAt(a, L);
    if (!rank) return { ok: false, reason: 'notLearned' };
    if (a.general) return { ok: true, rank };
    const fb = sim.formBlock(rank);
    if (fb) return { ok: false, reason: fb, rank };
    if (rank.range && rank.range <= 5 && s.distance === 'ranged') return { ok: false, reason: 'range', rank };
    if (rank.minRange && s.distance === 'melee') return { ok: false, reason: 'tooClose', rank };
    if ((s.cds[key] || 0) > t) return { ok: false, reason: 'cooldown', until: s.cds[key], rank };
    if (rank.cat && (s.catCds[rank.cat] || 0) > t) return { ok: false, reason: 'cooldown', until: s.catCds[rank.cat], rank };
    if (hooks.usable) { const why = hooks.usable(sim, a, rank); if (why) return { ok: false, reason: why, rank }; }
    if (rank.finisher && hooks.comboPoints !== false && s.combo < 1) return { ok: false, reason: 'combo', rank };
    if (getPower(rank.power) < sim.costOf(rank)) return { ok: false, reason: 'power', rank };
    if (rank.swing) return { ok: true, rank };
    if (s.casting && (rank.gcd > 0 || rank.cast > 0)) return { ok: false, reason: 'casting', until: s.casting.end, rank };
    if (rank.gcd > 0 && s.gcdEnd > t) return { ok: false, reason: 'gcd', until: s.gcdEnd, rank };
    return { ok: true, rank };
  };

  /* ---------- pressing a button ---------- */
  // via: 'key' (a bind), 'repeat' (a held key: never counted as a mistake) or 'click' (counted, since breaking that habit is the point)
  sim.press = (key, t, via) => {
    sim.advance(t);
    if (s.over) return { ok: false, reason: 'over' };
    if (via === 'click') s.stats.clicks++;
    if (s.hint && via !== 'repeat') { s.stats.hintPresses++; if (s.hint === key) s.stats.hintFollowed++; }
    const a = abilities[key];
    if (!a) { s.stats.wrongKeys++; ev('fail', { reason: 'unbound' }); return { ok: false, reason: 'unbound' }; }
    const u = sim.usable(key);
    if (u.ok) {
      if (a.general) { startAuto(); return { ok: true }; }
      if (u.rank.autoRepeat) { startRanged(key, u.rank); return { ok: true }; }
      execute(a, u.rank);
      return { ok: true };
    }
    // The game queues a press made shortly before the global cooldown or a cast ends.
    if ((u.reason === 'gcd' || u.reason === 'casting') && (u.until - s.t) * 1000 <= queueWindow()) {
      s.queue = { key, at: s.t };
      ev('queue', { key });
      return { ok: true, queued: true };
    }
    if (via !== 'repeat') s.stats.failed++;
    ev('fail', { key, reason: u.reason, text: sim.reasonText(u.reason, u.rank) });
    return { ok: false, reason: u.reason };
  };
  const queueWindow = () => R.spellQueueMs.value;

  function startAuto() {
    if (!s.autoMelee) { s.autoMelee = true; s.nextSwing = Math.max(s.nextSwing, s.t); s.nextOffSwing = Math.max(s.nextOffSwing, s.t + 0.2); }
    enterCombat();
  }
  function startRanged(key, rank) {
    s.autoRanged = key;
    s.nextShot = Math.max(s.nextShot, s.t + R.autoShot.standStill);
    enterCombat();
    ev('cast', { key });
  }
  function enterCombat() {
    if (s.inCombat) return;
    s.inCombat = true;
    s.nextDummySwing = s.t + 1;
    s.nextPetSwing = s.t + 0.5;
    if (hooks.onCombat) hooks.onCombat(sim);
  }
  sim.enterCombat = enterCombat;

  function execute(a, rank) {
    const key = a.key;
    s.stats.casts++;
    if (rank.tgt === 'enemy' || rank.tgt === 'area') {
      enterCombat();
      if (s.distance === 'melee' && rank.school === 1 && !rank.cast && (rank.range || 0) <= 5 && cls !== 'hunter') startAuto();
    }
    if (hooks.beforeCast) hooks.beforeCast(sim, a, rank);
    if (rank.swing) { s.swingQueued = key; startAuto(); ev('cast', { key, swing: true }); return; }
    if (rank.gcd > 0) s.gcdEnd = s.t + rank.gcd;
    if (rank.channel) {
      pay(rank);
      setCooldowns(a, rank);
      const ch = rank.eff.find(e => e.t === 'channel' || e.t === 'dot' || e.t === 'hot');
      const period = ch ? ch.period : rank.channel;
      s.casting = { key, rank, start: s.t, end: s.t + rank.channel, channel: true, period, nextTick: s.t + period, roll: rank.school === 1 ? 'hit' : rollSpell() };
      if (s.casting.roll === 'miss') { ev('miss', { key }); s.casting.missed = true; }
      if (s.autoRanged && cls !== 'hunter') s.autoRanged = null;  // casting stops a wand
      ev('cast', { key, channel: rank.channel });
      return;
    }
    if (rank.cast > 0) {
      s.casting = { key, rank, start: s.t, end: s.t + rank.cast };
      if (s.autoRanged && cls !== 'hunter') s.autoRanged = null;
      ev('cast', { key, cast: rank.cast });
      return;
    }
    ev('cast', { key });
    resolve(a, rank);
  }

  function pay(rank) {
    const cost = sim.costOf(rank);
    if (s.buffs.Clearcasting && rank.power && (rank.cost || rank.costPct)) { delete s.buffs.Clearcasting; ev('fade', { name: 'Clearcasting' }); }
    if (cost) {
      sim.gain(rank.power, -cost);
      if (rank.power === 'mana') s.lastManaSpend = s.t;
    }
    if (rank.healthPct) s.hp = Math.max(1, s.hp - Math.round(s.hpMax * rank.healthPct / 100));
  }
  function setCooldowns(a, rank) {
    if (rank.cd) s.cds[a.key] = s.t + rank.cd;
    if (rank.cat && rank.catCd) s.catCds[rank.cat] = s.t + rank.catCd;
  }

  // Land an ability: pay, cooldowns, hit roll, effects.
  function resolve(a, rank) {
    if (!rank.channel) { pay(rank); setCooldowns(a, rank); }
    const key = a.key;
    const eff = rank.eff || [];
    const hostile = rank.tgt === 'enemy' || rank.tgt === 'area';
    const physical = rank.school === 1;
    const weaponHit = eff.some(e => e.t === 'wpn' || e.t === 'wpnpct');
    const hasDamage = eff.some(e => e.t === 'dmg' || e.t === 'dot');
    const ranged = !!rank.minRange;
    let result = 'hit';
    // physical attacks use the melee table (Sunder and Rend can be dodged too); spells the spell table
    if (hostile && (hasDamage || weaponHit || physical && (rank.range || 0) <= 5)) result = physical ? rollYellow(ranged) : rollSpell();
    if (hooks.onResolve) { const r2 = hooks.onResolve(sim, a, rank, result); if (r2) result = r2; }
    if (result === 'miss' || result === 'dodge' || result === 'parry') {
      ev(result, { key });
      if (result === 'dodge' && hooks.onTargetDodge) hooks.onTargetDodge(sim, key);
      if (hooks.afterCast) hooks.afterCast(sim, a, rank, result);
      return result;
    }
    applyEffects(a, rank, eff, result);
    if (rank.finisher) s.combo = 0;
    if (hooks.afterCast) hooks.afterCast(sim, a, rank, result);
    return result;
  }
  sim.resolve = resolve;

  function applyEffects(a, rank, eff, result) {
    const key = a.key;
    const crit = result === 'crit';
    const combo = rank.finisher ? s.combo : 0;
    let wpn = 0, wpnMult = 1, direct = 0, healed = 0;
    for (const e of eff) {
      if (e.t === 'wpn') wpn += weaponRoll(sim.weapon(), 'main') + (e.bonus || 0);
      else if (e.t === 'wpnpct') wpnMult *= e.pct / 100;
      else if (e.t === 'dmg') {
        direct += e.min + rng() * (e.max - e.min) + (e.perCombo || 0) * combo + (e.spc || 0) * (rank.school === 1 ? 0 : sp()) + (e.apc || 0) * ap();
      } else if (e.t === 'dot') addDot(a, rank, e, combo);
      else if (e.t === 'heal') healed += e.min + rng() * (e.max - e.min) + (e.spc || 0) * sp();
      else if (e.t === 'hot') addHot(a, rank, e);
      else if (e.t === 'absorb') shield(a, rank, e.amount + (e.spc || 0) * sp());
      else if (e.t === 'energize') energize(e);
      else if (e.t === 'form') sim.setForm(s.form === e.form && !(formInfo[e.form] || {}).stance ? null : e.form);
      else if (e.t === 'trigger' && e.eff && e.eff.length) applyEffects(a, rank, e.eff.filter(x => x.t !== 'trigger'), result);
    }
    if (hooks.damageBonus) direct += hooks.damageBonus(sim, a, rank, combo) || 0;
    if (wpnMult !== 1 && !wpn) wpn = weaponRoll(sim.weapon(), 'main');  // percent-of-weapon only (no flat bonus)
    let total = wpn * wpnMult + direct;
    if (total > 0) {
      if (crit) total *= rank.school === 1 ? R.critMult.melee : R.critMult.spell;
      damageTarget(total, key, crit ? 'crit' : 'hit');
    }
    if (healed > 0) healTarget(a, healed * (crit ? R.critMult.spell : 1));
    // buffs and debuffs that aren't damage/heal: one per ability name
    const auraOnly = !eff.some(e => ['dmg', 'wpn', 'wpnpct', 'heal', 'dot', 'hot', 'absorb', 'form'].includes(e.t));
    // an aura with no duration lasts until replaced (Aspects, paladin Auras, Trueshot Aura)
    if (auraOnly && (rank.dur || rank.auraTgt === 'self')) {
      let dur = rank.dur || Infinity;
      if (rank.finisher) dur += R.finisherDuration.perCombo * Math.max(0, combo - 1);
      if ((rank.auraTgt || rank.tgt) === 'enemy') addDebuff(key, dur, rank.stacks);
      else addBuff(key, dur, rank.stacks);
    }
  }

  function energize(e) {
    if (e.power === 4) s.combo = Math.min(R.comboMax.value, s.combo + e.amount);
    else if (e.power === 1) sim.gain('rage', e.amount / 10);
    else if (e.power === 3) sim.gain('energy', e.amount);
    else if (e.power === 0) sim.gain('mana', e.amount);
  }

  /* ---------- auras ---------- */
  function addBuff(name, dur, maxStacks) {
    const b = s.buffs[name];
    if (hooks.onBuff) hooks.onBuff(sim, name);
    s.buffs[name] = { end: s.t + dur, stacks: Math.min((b ? b.stacks : 0) + 1, maxStacks || 1) };
    ev('buff', { name });
  }
  function addDebuff(name, dur, maxStacks, extra) {
    const d = s.debuffs[name];
    if (hooks.onDebuff) hooks.onDebuff(sim, name);
    s.debuffs[name] = Object.assign({ end: s.t + dur, stacks: Math.min((d ? d.stacks : 0) + 1, maxStacks || 1) }, extra || {});
    ev('debuff', { name });
  }
  sim.addBuff = addBuff;
  sim.addDebuff = addDebuff;
  function addDot(a, rank, e, combo) {
    const dur = rank.dur || e.period;
    const ticks = Math.max(1, Math.round(dur / e.period));
    const bonus = ((e.spc || 0) * (rank.school === 1 ? 0 : sp()) + (e.apc || 0) * ap()) / ticks;
    addDebuff(a.key, dur, rank.stacks, { tick: e.tick + (e.perCombo || 0) * combo + bonus, period: e.period, nextTick: s.t + e.period, dot: true });
  }

  /* ---------- healing (healer practice) ---------- */
  if (opts.healer) {
    const roles = ['Tank', 'Healer', 'Damage', 'Damage', 'Damage'];
    s.party = roles.slice(0, R.healerParty.size).map((role, i) => ({ role, hp: hpMax, hpMax, shield: 0, hots: {}, self: i === 1 }));
    s.nextTankHit = 1; s.nextPulse = R.healerParty.pulse.every; s.nextSpike = R.healerParty.spike.every / 2;
  }
  const healTargetUnit = () => (s.party ? s.party[s.focus] || s.party[1] : null);
  function healTarget(a, amount) {
    amount = Math.round(amount);
    const u = healTargetUnit();
    if (!u) { const before = s.hp; s.hp = Math.min(s.hpMax, s.hp + amount); s.stats.healing += s.hp - before; s.stats.overheal += amount - (s.hp - before); ev('heal', { key: a.key, amount }); return; }
    const before = u.hp;
    u.hp = Math.min(u.hpMax, u.hp + amount);
    s.stats.healing += u.hp - before;
    s.stats.overheal += amount - (u.hp - before);
    ev('heal', { key: a.key, amount, unit: s.party.indexOf(u) });
  }
  function addHot(a, rank, e) {
    const u = healTargetUnit();
    const dur = rank.dur || e.period;
    const ticks = Math.max(1, Math.round(dur / e.period));
    const h = { end: s.t + dur, tick: e.tick + (e.spc || 0) * sp() / ticks, period: e.period, nextTick: s.t + e.period, key: a.key };
    if (u) u.hots[a.key] = h; else s.buffs[a.key] = Object.assign({ stacks: 1, hot: true }, h);
    ev('buff', { name: a.key });
  }
  function shield(a, rank, amount) {
    const u = healTargetUnit();
    if (u) u.shield = Math.round(amount); else s.shieldAmount = Math.round(amount);
    if (hooks.onShield) hooks.onShield(sim, a, rank, u);
    ev('buff', { name: a.key });
  }
  sim.healTargetUnit = healTargetUnit;

  /* ---------- white hits ---------- */
  function swing(hand) {
    const w = sim.weapon();
    if (hand === 'main' && s.swingQueued) {
      const a = abilities[s.swingQueued];
      s.swingQueued = null;
      const rank = a && rankAt(a, L);
      if (rank && !sim.formBlock(rank) && getPower(rank.power) >= sim.costOf(rank)) {
        ev('cast', { key: a.key });
        resolve(a, rank);  // no rage from this swing (RULES.onNextSwing)
        return;
      }
    }
    const res = rollWhite(w.dw);
    if (res === 'miss' || res === 'dodge' || res === 'parry') {
      ev(res, { key: 'Attack' });
      if (res === 'dodge' && hooks.onTargetDodge) hooks.onTargetDodge(sim, 'Attack');
    } else {
      let dmg = weaponRoll(w, hand);
      if (res === 'glance') dmg *= T.glancingDmg;
      if (res === 'crit') dmg *= R.critMult.melee;
      damageTarget(dmg, 'Attack', res === 'crit' ? 'crit' : 'hit');
      // Forever rage: a set amount per landed white hit, by weapon speed (RULES.rageNormalized)
      if (sim.powerType() === 'rage') {
        const rn = R.rageNormalized;
        let rage = w.speed * (w.kind === '2H' ? rn.perSpeed2H : rn.perSpeed1H);
        if (res === 'crit') rage *= rn.critMult;
        sim.gain('rage', rage);
      }
    }
    if (hooks.onWhite) hooks.onWhite(sim, res, hand);
  }
  function shoot() {
    const key = s.autoRanged;
    const a = abilities[key];
    const rank = a && rankAt(a, L);
    if (!rank || (rank.minRange && s.distance === 'melee')) { s.autoRanged = null; return; }
    const res = cls === 'hunter' ? rollYellow(true) : rollSpell();
    if (res === 'miss') { ev('miss', { key }); return; }
    const w = cls === 'hunter' ? { speed: R.weapon.speed.ranged, dps: R.weapon.dpsRanged(L) } : { speed: R.weapon.speed.wand, dps: R.weapon.dpsWand(L) };
    let dmg = w.dps * w.speed * (0.85 + rng() * 0.3);
    if (cls === 'hunter') dmg += R.attackPower.ranged(L) / R.attackPower.apPerDps * w.speed;
    if (res === 'crit') dmg *= cls === 'hunter' ? R.critMult.melee : R.critMult.spell;
    damageTarget(dmg, key, res === 'crit' ? 'crit' : 'hit');
  }
  const rangedSpeed = () => (cls === 'hunter' ? R.weapon.speed.ranged / (s.buffs['Rapid Fire'] ? 1.4 : 1) : R.weapon.speed.wand);

  /* ---------- the dummy hitting back ---------- */
  function dummySwing() {
    const av = R.playerAvoidance;
    const canParry = ['warrior', 'rogue', 'paladin', 'hunter', 'shaman'].includes(cls) && !(hooks.noParry && hooks.noParry(sim));
    const canBlock = hooks.hasShield ? hooks.hasShield(sim) : false;
    const r = rng();
    let c = av.dodge, res = 'hit';
    if (r < c) res = 'dodge';
    else if (canParry && r < (c += av.parry)) res = 'parry';
    else if (canBlock && r < (c += av.block)) res = 'block';
    if (res !== 'hit') {
      ev('avoid', { kind: res });
      if (hooks.onPlayerAvoid) hooks.onPlayerAvoid(sim, res);
      return;
    }
    let dmg = Math.round(s.hpMax * R.dummyHitBack.dmgPct * (0.9 + rng() * 0.2));
    if (s.shieldAmount) { const absorbed = Math.min(s.shieldAmount, dmg); s.shieldAmount -= absorbed; dmg -= absorbed; }
    s.hp = Math.max(1, s.hp - dmg);
    ev('hurt', { amount: dmg });
    if (sim.powerType() === 'rage') sim.gain('rage', R.rageTakenMult.value * dmg / rageConversion(R, L));
  }

  /* ---------- healer party damage ---------- */
  function partyHit(u, pct) {
    let dmg = Math.round(u.hpMax * pct * (0.85 + rng() * 0.3));
    const absorbed = Math.min(u.shield, dmg);
    u.shield -= absorbed; dmg -= absorbed;
    u.hp -= dmg;
    if (u.hp <= 0) { s.stats.deaths++; ev('death', { unit: s.party.indexOf(u) }); u.hp = Math.round(u.hpMax * 0.5); }
  }

  /* ---------- time ---------- */
  // Run the clock to t, handling every timed thing in order.
  sim.advance = t => {
    if (t == null || t <= s.t) return;
    let guard = 0;
    while (s.t < t && guard++ < 100000) {
      const next = Math.min(t, nextEventTime());
      const dt = next - s.t;
      // continuous energy (Forever) and idle time between events
      if (sim.powerType() === 'energy' || (hooks.energyRegen && hooks.energyRegen(sim))) {
        if (!(hooks.blockEnergy && hooks.blockEnergy(sim))) sim.gain('energy', R.energyTick.perSecond * dt);
      }
      if (s.inCombat && !s.over && !s.casting && s.gcdEnd <= s.t && !s.queue && couldAct()) s.stats.idle += dt;
      s.t = next;
      tick();
      if (s.over) break;
    }
    if (s.t < t) s.t = t;
  };

  // Idle time only counts while something on the bars could have been pressed (waiting on rage isn't idle).
  function couldAct() {
    const keys = opts.onBar ? [...opts.onBar] : Object.keys(abilities);
    return keys.some(k => { const u = sim.usable(k); return u.ok && u.rank && u.rank.gcd > 0 && !u.rank.autoRepeat && !abilities[k].general; });
  }

  function nextEventTime() {
    let n = Infinity;
    const take = x => { if (x > s.t && x < n) n = x; };
    if (s.casting) { take(s.casting.end); if (s.casting.channel) take(s.casting.nextTick); }
    if (s.queue) take(Math.max(s.gcdEnd, s.casting ? s.casting.end : 0));
    if (s.autoMelee) { take(s.nextSwing); if (sim.weapon().dw) take(s.nextOffSwing); }
    if (s.autoRanged) take(s.nextShot);
    take(s.nextManaTick);
    for (const d of Object.values(s.debuffs)) { take(d.end); if (d.dot) take(d.nextTick); }
    for (const b of Object.values(s.buffs)) { if (b.end !== Infinity) take(b.end); if (b.hot) take(b.nextTick); }
    for (const e of Object.values(s.procs)) take(e);
    if (s.inCombat && opts.hitBack) take(s.nextDummySwing);
    if (s.inCombat && s.pet) take(s.nextPetSwing);
    if (s.party) {
      take(s.nextTankHit); take(s.nextPulse); take(s.nextSpike);
      for (const u of s.party) for (const h of Object.values(u.hots)) { take(h.end); take(h.nextTick); }
    }
    if (duration && !dummyHp) take(s.start + duration);
    if (hooks.nextEvent) take(hooks.nextEvent(sim));
    return n;
  }

  const due = x => x <= s.t + 1e-9;
  function tick() {
    // casts and channels
    if (s.casting && s.casting.channel && due(s.casting.nextTick) && s.casting.nextTick <= s.casting.end + 1e-9) {
      const c = s.casting, a = abilities[c.key];
      c.nextTick += c.period;
      const ch = c.rank.eff.find(e => e.t === 'channel'), dot = c.rank.eff.find(e => e.t === 'dot'), hot = c.rank.eff.find(e => e.t === 'hot');
      const ticks = Math.max(1, Math.round(c.rank.channel / c.period));
      if (c.missed) { /* the whole channel missed */ }
      else if (ch && ch.eff.length) {
        const res = rollSpell();
        if (res === 'miss') ev('miss', { key: c.key }); else applyEffects(a, Object.assign({}, c.rank, { eff: ch.eff, dur: 0, finisher: false }), ch.eff, res);
      } else if (dot) {
        const crit = rng() < critSpell();
        damageTarget((dot.tick + (dot.spc || 0) * sp() / ticks) * (crit ? R.critMult.spell : 1), c.key, crit ? 'crit' : 'tick');
      } else if (hot) healTarget(a, hot.tick + (hot.spc || 0) * sp() / ticks);
      if (hooks.onChannelTick) hooks.onChannelTick(sim, c);
    }
    if (s.casting && due(s.casting.end)) {
      const c = s.casting;
      s.casting = null;
      if (!c.channel) {
        const a = abilities[c.key];
        if (getPower(c.rank.power) >= sim.costOf(c.rank)) resolve(a, c.rank);
        else ev('fail', { key: c.key, reason: 'power', text: sim.reasonText('power', c.rank) });
        if (hooks.afterCastEnd) hooks.afterCastEnd(sim, a, c.rank);
      }
    }
    // a queued press fires the moment the global cooldown and any cast are done
    if (s.queue && !s.casting && due(s.gcdEnd)) {
      const q = s.queue;
      s.queue = null;
      const u = sim.usable(q.key);
      if (u.ok) execute(abilities[q.key], u.rank);
      else { s.stats.failed++; ev('fail', { key: q.key, reason: u.reason, text: sim.reasonText(u.reason, u.rank) }); }
    }
    // white swings
    if (s.autoMelee && s.distance === 'melee' && due(s.nextSwing)) { s.nextSwing += sim.weapon().speed; swing('main'); }
    if (s.autoMelee && s.distance === 'melee' && sim.weapon().dw && due(s.nextOffSwing)) { s.nextOffSwing += sim.weapon().speed; swing('off'); }
    if (s.autoMelee && s.distance !== 'melee') { if (due(s.nextSwing)) s.nextSwing = s.t + sim.weapon().speed; }
    if (s.autoRanged && due(s.nextShot)) {
      s.nextShot = s.t + rangedSpeed();
      if (!(s.casting && cls !== 'hunter')) shoot();
    }
    // mana regen: the five-second rule
    if (due(s.nextManaTick)) {
      s.nextManaTick += R.manaTick.value;
      const pr = R.manaRegen.perTick[cls];
      if (pr && s.t - s.lastManaSpend >= R.fiveSecondRule.value) sim.gain('mana', pr.base + R.spirit.value(L) / pr.div);
    }
    // damage over time, heal over time, expiry
    for (const [name, d] of Object.entries(s.debuffs)) {
      if (d.dot && due(d.nextTick) && d.nextTick <= d.end + 1e-9) {
        d.nextTick += d.period;
        const crit = rng() < critSpell();  // Forever: DoTs can crit
        damageTarget(d.tick * (crit ? R.critMult.spell : 1), name, crit ? 'crit' : 'tick');
      }
      if (due(d.end)) { delete s.debuffs[name]; ev('fade', { name, debuff: true }); }
    }
    for (const [name, b] of Object.entries(s.buffs)) {
      if (b.hot && due(b.nextTick) && b.nextTick <= b.end + 1e-9) {
        b.nextTick += b.period;
        const before = s.hp; s.hp = Math.min(s.hpMax, s.hp + Math.round(b.tick)); s.stats.healing += s.hp - before;
      }
      if (due(b.end)) { delete s.buffs[name]; ev('fade', { name }); }
    }
    for (const [name, end] of Object.entries(s.procs)) {
      if (due(end)) {
        delete s.procs[name];
        if (!opts.onBar || opts.onBar.has(name)) { s.stats.procsMissed++; ev('procMissed', { name }); }
      }
    }
    if (s.inCombat && opts.hitBack && due(s.nextDummySwing)) { s.nextDummySwing += R.dummyHitBack.swing; dummySwing(); }
    if (s.inCombat && s.pet && due(s.nextPetSwing)) {
      s.nextPetSwing += R.pets.swing;
      damageTarget(R.petDps.value(L) * R.pets.swing * (0.8 + rng() * 0.4), 'Pet', 'hit');
    }
    if (s.party) {
      const P = R.healerParty;
      if (due(s.nextTankHit)) { s.nextTankHit += P.tankHit.every; partyHit(s.party[0], P.tankHit.pct); }
      if (due(s.nextPulse)) { s.nextPulse += P.pulse.every; s.party.forEach(u => partyHit(u, P.pulse.pct)); ev('pulse'); }
      if (due(s.nextSpike)) { s.nextSpike += P.spike.every; partyHit(s.party[Math.floor(rng() * s.party.length)], P.spike.pct); }
      for (const u of s.party) for (const [k, h] of Object.entries(u.hots)) {
        if (due(h.nextTick) && h.nextTick <= h.end + 1e-9) {
          h.nextTick += h.period;
          const before = u.hp; u.hp = Math.min(u.hpMax, u.hp + Math.round(h.tick));
          s.stats.healing += u.hp - before; s.stats.overheal += Math.round(h.tick) - (u.hp - before);
        }
        if (due(h.end)) delete u.hots[k];
      }
    }
    if (hooks.tick) hooks.tick(sim);
    if (duration && !dummyHp && due(s.start + duration) && !s.over) { s.over = true; ev('end'); }
  }

  /* ---------- procs (reactive abilities) ---------- */
  sim.proc = (name, seconds) => {
    if (!abilities[name] || !rankAt(abilities[name], L)) return;
    s.procs[name] = s.t + seconds;
    ev('proc', { name });
  };
  sim.useProc = name => {
    if (s.procs[name] == null) return false;
    delete s.procs[name];
    s.stats.procsUsed++;
    return true;
  };

  // A key that isn't bound to anything.
  sim.wrongKey = () => { s.stats.wrongKeys++; ev('fail', { reason: 'unbound', text: 'Nothing is bound to that key' }); };

  // Start the run clock (the page calls this on the first key press or on Start).
  sim.begin = t => { s.t = t; s.start = t; s.nextManaTick = t + R.manaTick.value; ev('begin'); };
  // Events since the last call, for the page to animate.
  sim.drain = () => { const e = s.events; s.events = []; return e; };
  sim.summary = () => {
    const secs = Math.max(1, s.t - s.start);
    return { seconds: secs, dps: s.stats.damage / secs, hps: s.stats.healing / secs, ...s.stats };
  };
  sim.rankOf = key => abilities[key] ? rankAt(abilities[key], L) : null;

  if (hooks.setup) hooks.setup(sim, opts);
  return sim;
}

if (typeof module !== 'undefined') module.exports = { createSim, seededRng, rankAt };
