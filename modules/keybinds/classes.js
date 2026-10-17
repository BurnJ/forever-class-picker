'use strict';
/* Class rules for the target dummy that the spell data doesn't carry: stances and forms, reactive abilities
   (Overpower, Revenge, Riposte, Counterattack, Mongoose Bite), execute-range abilities, seals, totems, curses,
   stealth, pets. Every hook is optional; sim.js calls them. Ability names are the client's own. */

// weapon per class/spec: speeds and DPS from RULES.weapon (ours: a typical setup for the spec)
function weaponFor(sim, kind, dw) {
  const R = sim.rules, L = sim.state.level, sp = R.weapon.speed;
  if (kind === '2H') return { speed: sp.twoHand, dps: R.weapon.dps2H(L), kind, dw: false };
  if (kind === 'dagger') return { speed: sp.dagger, dps: R.weapon.dps1H(L), kind: '1H', dw: !!dw };
  return { speed: sp.oneHand, dps: R.weapon.dps1H(L), kind: '1H', dw: !!dw };
}
const has = (sim, key) => !!sim.rankOf(key);
// keep one of a family up at a time (seals, auras, aspects, curses, stings, totems of one element)
function replaceFamily(sim, map, name, family) {
  if (!family(name)) return;
  for (const k of Object.keys(map)) if (k !== name && family(k)) delete map[k];
}
const reactive = sim => sim.rules.reactiveWindows;
const belowPct = (sim, pct) => sim.targetPct() * 100 < pct;

const CLASS_RULES = {
  warrior: {
    // The client gives Overpower a combo point cost (that's how the game enables it after a dodge);
    // here the dodge proc does that job, so warriors don't track combo points.
    comboPoints: false,
    weapon: sim => weaponFor(sim, sim.state.spec === 'fury' ? '1H' : sim.state.spec === 'protection' ? 'shield' : '2H', sim.state.spec === 'fury'),
    hasShield: sim => sim.state.spec === 'protection',
    setup(sim) { if (has(sim, 'Battle Stance')) sim.state.form = 17; },
    onForm(sim, old, form) {
      // Forever: Tactical Mastery is baseline, a stance swap keeps up to RULES.stanceSwap.keepRage rage
      if (old !== form && old != null) sim.state.rage = Math.min(sim.state.rage, sim.rules.stanceSwap.keepRage);
    },
    usable(sim, a, rank) {
      const s = sim.state;
      if (a.key === 'Overpower' && s.procs.Overpower == null) return 'Only after the target dodges';
      if (a.key === 'Revenge' && s.procs.Revenge == null) return 'Only after you block, dodge or parry';
      if ((a.key === 'Execute') && !belowPct(sim, reactive(sim).execute)) return 'Only when the target is below 20% health';
      if (a.key === 'Victory Rush') return 'Only after a killing blow';
      if (a.key === 'Charge' && s.inCombat) return 'Can\'t do that while in combat';
      if (a.key === 'Shield Block' || a.key === 'Shield Bash' || a.key === 'Shield Wall' || a.key === 'Shield Slam') {
        if (s.spec !== 'protection') return 'Requires a shield';
      }
      return null;
    },
    onTargetDodge(sim) { sim.proc('Overpower', reactive(sim).overpower); },
    onPlayerAvoid(sim) { sim.proc('Revenge', reactive(sim).revenge); },
    beforeCast(sim, a) {
      if (a.key === 'Overpower') sim.useProc('Overpower');
      if (a.key === 'Revenge') sim.useProc('Revenge');
    },
    // Execute spends all remaining rage for extra damage (RULES.executeRage; ours: scales with the rank number)
    damageBonus(sim, a, rank) {
      if (a.key !== 'Execute') return 0;
      const s = sim.state, extra = s.rage;
      s.rage = 0;
      const idx = a.ranks.indexOf(rank) + 1;
      const base = (rank.eff.find(e => e.t === 'dummy') || { bp: 0 }).bp;
      return base + extra * sim.rules.executeRage.dmgPerExtraRage * idx;
    },
    afterCast(sim, a) {
      if (a.key === 'Bloodrage') {
        const b = sim.rules.bloodrage;
        sim.state.bloodrageTicks = b.overTime; sim.state.nextBloodrage = sim.state.t + 1;
      }
    },
    nextEvent: sim => (sim.state.bloodrageTicks ? sim.state.nextBloodrage : Infinity),
    tick(sim) {
      const s = sim.state;
      if (s.bloodrageTicks && s.nextBloodrage <= s.t + 1e-9) {
        s.bloodrageTicks--; s.nextBloodrage += 1; sim.gain('rage', sim.rules.bloodrage.overTime / sim.rules.bloodrage.duration);
      }
    },
  },

  rogue: {
    weapon: sim => weaponFor(sim, sim.state.spec === 'combat' ? '1H' : 'dagger', true),
    setup(sim, opts) { if (opts.stealth !== false && has(sim, 'Stealth')) sim.state.form = 30; },
    usable(sim, a) {
      const s = sim.state;
      if ((a.key === 'Stealth') && s.inCombat) return 'Can\'t do that while in combat';
      if (a.key === 'Sap' && s.inCombat) return 'Target is in combat';
      if (a.key === 'Riposte' && s.procs.Riposte == null) return 'Only after you parry';
      return null;
    },
    beforeCast(sim, a, rank) {
      if (a.key === 'Riposte') sim.useProc('Riposte');
      // any attack from stealth breaks it (Vanish and Stealth itself don't)
      if (sim.state.form === 30 && rank.tgt === 'enemy' && !['Pick Pocket', 'Sap', 'Distract'].includes(a.key)) sim.setForm(null);
    },
    afterCast(sim, a) { if (a.key === 'Vanish') sim.setForm(30); },
    onPlayerAvoid(sim, kind) { if (kind === 'parry') sim.proc('Riposte', reactive(sim).riposte); },
  },

  druid: {
    weapon(sim) {
      const R = sim.rules, L = sim.state.level, f = sim.state.form;
      if (f === 1) return { speed: R.druidForms.catSwing, dps: R.weapon.dps2H(L), kind: '1H', dw: false };
      if (f === 5 || f === 8) return { speed: R.druidForms.bearSwing, dps: R.weapon.dps2H(L), kind: '2H', dw: false };
      return weaponFor(sim, '2H');
    },
    attackPower: sim => ([1, 5, 8].includes(sim.state.form) ? sim.rules.attackPower.feral(sim.state.level) : sim.rules.attackPower.melee(sim.state.level) / 3),
    powerType: sim => (sim.state.form === 1 ? 'energy' : sim.state.form === 5 || sim.state.form === 8 ? 'rage' : 'mana'),
    blockEnergy: sim => sim.state.form === 5 || sim.state.form === 8,  // RULES.bearBlocksEnergyRegen
    clearcastAny: true,
    onForm(sim, old, form) {
      // entering Cat starts with no energy, entering Bear with no rage (1.12; Furor talents not simulated)
      if (form === 1 && old !== 1) sim.state.energy = 0;
      if ((form === 5 || form === 8) && old !== 5 && old !== 8) sim.state.rage = 0;
      delete sim.state.buffs.Prowl;
    },
    usable(sim, a) {
      const s = sim.state;
      if ((a.key === 'Ravage' || a.key === 'Pounce') && !s.buffs.Prowl) return 'Must be prowling';
      if (a.key === 'Prowl' && s.inCombat) return 'Can\'t do that while in combat';
      if ((a.key === 'Travel Form' || a.key === 'Aquatic Form') && s.inCombat) return 'Can\'t do that while in combat';
      return null;
    },
    beforeCast(sim, a, rank) { if (rank.tgt === 'enemy' && a.key !== 'Prowl') delete sim.state.buffs.Prowl; },
    afterCast(sim, a) { if (a.key === 'Prowl') sim.state.buffs.Prowl = { end: Infinity, stacks: 1 }; },
    // Forever: Omen of Clarity is baseline from level 20 (RULES.clearcastingDruid)
    onWhite(sim, res) {
      const c = sim.rules.clearcastingDruid;
      if ((res === 'hit' || res === 'crit' || res === 'glance') && sim.state.level >= c.minLevel && sim.rng() < c.chance) sim.addBuff('Clearcasting', 15);
    },
  },

  hunter: {
    weapon: sim => weaponFor(sim, '2H'),
    usable(sim, a) {
      const s = sim.state;
      if (a.key === 'Mongoose Bite' && s.procs['Mongoose Bite'] == null) return 'Only after the target dodges';
      if (a.key === 'Counterattack' && s.procs.Counterattack == null) return 'Only after you parry';
      if ((a.key === 'Call Pet' || a.key === 'Revive Pet') && s.pet) return 'You already have a pet';
      if ((a.key === 'Dismiss Pet' || a.key === 'Mend Pet' || a.key === 'Feed Pet') && !s.pet) return 'You have no pet';
      return null;
    },
    onTargetDodge(sim) { sim.proc('Mongoose Bite', reactive(sim).overpower); },
    onPlayerAvoid(sim, kind) { if (kind === 'parry') sim.proc('Counterattack', reactive(sim).counterattack); },
    beforeCast(sim, a) {
      if (a.key === 'Mongoose Bite') sim.useProc('Mongoose Bite');
      if (a.key === 'Counterattack') sim.useProc('Counterattack');
    },
    afterCast(sim, a) {
      if (a.key === 'Call Pet') sim.state.pet = true;
      if (a.key === 'Dismiss Pet') sim.state.pet = false;
    },
    onBuff: (sim, name) => replaceFamily(sim, sim.state.buffs, name, n => n.startsWith('Aspect of')),
    onDebuff: (sim, name) => replaceFamily(sim, sim.state.debuffs, name, n => / Sting$/.test(n)),
    setup(sim) { if (sim.state.level >= 10) sim.state.pet = true; },
  },

  mage: {},

  priest: {
    usable(sim, a, rank) {
      const s = sim.state;
      // Shadowform: Holy spells can't be cast (school 2 = Holy)
      if (s.form === 28 && rank.school === 2) return 'Can\'t cast Holy spells in Shadowform';
      if (a.key === 'Power Word: Shield') {
        const u = sim.healTargetUnit();
        if (u ? u.weakened > s.t : s.weakened > s.t) return 'Target has Weakened Soul';
      }
      return null;
    },
    onShield(sim, a, rank, u) {
      // Weakened Soul: no new shield on the same target for 15 sec (1.12)
      if (u) u.weakened = sim.state.t + 15; else sim.state.weakened = sim.state.t + 15;
    },
  },

  paladin: {
    weapon: sim => weaponFor(sim, sim.state.spec === 'retribution' ? '2H' : '1H'),
    hasShield: sim => sim.state.spec === 'protection',
    onBuff(sim, name) {
      replaceFamily(sim, sim.state.buffs, name, n => n.startsWith('Seal of'));
      replaceFamily(sim, sim.state.buffs, name, n => / Aura$/.test(n));
    },
    usable(sim, a) {
      const s = sim.state;
      if (a.key === 'Judgement' && !Object.keys(s.buffs).some(n => n.startsWith('Seal of'))) return 'You need an active Seal';
      if (a.key === 'Hammer of Wrath' && !belowPct(sim, reactive(sim).execute)) return 'Only when the target is below 20% health';
      return null;
    },
    // Judgement releases the active seal (RULES.judgement); ours: holy damage that grows with level
    afterCast(sim, a) {
      if (a.key !== 'Judgement') return;
      const seal = Object.keys(sim.state.buffs).find(n => n.startsWith('Seal of'));
      if (!seal) return;
      delete sim.state.buffs[seal];
      const L = sim.state.level;
      sim.damageTarget((10 + 4.5 * L) * (0.9 + sim.rng() * 0.2), 'Judgement', 'hit');
    },
    // ours: a seal adds a little holy damage to each landed swing
    onWhite(sim, res) {
      if (!(res === 'hit' || res === 'crit' || res === 'glance')) return;
      const seal = Object.keys(sim.state.buffs).find(n => n.startsWith('Seal of'));
      if (seal === 'Seal of Righteousness' || seal === 'Seal of Command' || seal === 'Seal of Fury')
        sim.damageTarget((2 + 0.6 * sim.state.level) * sim.weapon().speed / 2.6, seal, 'hit');
    },
  },

  shaman: {
    weapon: sim => weaponFor(sim, sim.state.spec === 'enhancement' ? '2H' : '1H'),
    hasShield: sim => sim.state.spec !== 'enhancement',
    onBuff(sim, name) {
      replaceFamily(sim, sim.state.buffs, name, n => / Weapon$/.test(n));
      for (const el of Object.values(TOTEM_ELEMENTS)) replaceFamily(sim, sim.state.buffs, name, n => el.includes(n));
    },
    // Windfury Weapon (RULES.windfury): a chance of one extra attack
    onWhite(sim, res, hand) {
      if (hand !== 'main' || !sim.state.buffs['Windfury Weapon'] || !(res === 'hit' || res === 'crit' || res === 'glance')) return;
      if (sim.rng() < sim.rules.windfury.chance) {
        const r = sim.rollWhite(false);
        if (r === 'hit' || r === 'crit' || r === 'glance')
          sim.damageTarget(sim.weaponRoll(sim.weapon(), 'main') * (r === 'crit' ? sim.rules.critMult.melee : 1), 'Windfury Weapon', r === 'crit' ? 'crit' : 'hit');
      }
    },
    // Searing and Magma Totem hit the dummy while they're down (ours: small damage every 2.5 sec)
    nextEvent: sim => (sim.state.totemTick || Infinity),
    tick(sim) {
      const s = sim.state;
      const fire = ['Searing Totem', 'Magma Totem'].find(n => s.buffs[n]);
      if (!fire) { s.totemTick = 0; return; }
      if (!s.totemTick) { s.totemTick = s.t + 2.5; return; }
      if (s.totemTick <= s.t + 1e-9) { s.totemTick += 2.5; sim.damageTarget(4 + 0.9 * s.level, fire, 'tick'); }
    },
  },

  warlock: {
    usable(sim, a, rank) {
      const s = sim.state;
      if (a.key === 'Life Tap' && s.hp <= s.hpMax * 0.1) return 'Not enough health';
      return null;
    },
    afterCast(sim, a, rank) {
      const s = sim.state;
      if (a.key === 'Life Tap') {
        // health into mana (client value at this rank, plus ours: a share of spell power)
        const bp = (rank.eff.find(e => e.t === 'dummy') || { bp: 0 }).bp + sim.rules.spellPower.value(s.level) * 0.8;
        s.hp = Math.max(1, s.hp - Math.round(bp)); sim.gain('mana', Math.round(bp));
      }
      if (/^Summon (Imp|Voidwalker|Succubus|Incubus|Felhunter)$/.test(a.key)) s.pet = true;
    },
    onDebuff: (sim, name) => replaceFamily(sim, sim.state.debuffs, name, n => /^(Curse|Bane) of /.test(n)),
    setup(sim) { sim.state.pet = true; },
  },
};

// Shaman totems by element: one of each element can be down at a time.
const TOTEM_ELEMENTS = {
  earth: ['Stoneskin Totem', 'Earthbind Totem', 'Stoneclaw Totem', 'Strength of Earth Totem', 'Tremor Totem'],
  fire: ['Searing Totem', 'Fire Nova', 'Magma Totem', 'Frost Resistance Totem', 'Flametongue Totem'],
  water: ['Healing Stream Totem', 'Poison Cleansing Totem', 'Mana Spring Totem', 'Fire Resistance Totem', 'Disease Cleansing Totem', 'Mana Tide Totem'],
  air: ['Grounding Totem', 'Nature Resistance Totem', 'Windfury Totem', 'Sentry Totem', 'Windwall Totem', 'Grace of Air Totem'],
};

if (typeof module !== 'undefined') module.exports = { CLASS_RULES, TOTEM_ELEMENTS };
