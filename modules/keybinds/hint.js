'use strict';
/* The "next ability" hint: the first step of the spec's priority list (data/rotations.js) whose ability
   the simulation says is usable now (or within the queue window) and whose conditions hold. */

const REFRESH_AT = 3;  // seconds left on a buff/debuff before it counts as "about to run out"
const FORM_IDS = { cat: [1], bear: [5, 8], caster: [null] };

function stepHolds(sim, step) {
  const s = sim.state;
  if (step.form && !(FORM_IDS[step.form] || []).includes(s.form)) return false;
  if (step.buff) {
    // a heal over time sits on the party member being healed, not on you
    const u = s.party ? sim.healTargetUnit() : null;
    const b = s.buffs[step.ability] || (u && u.hots[step.ability]) || s.debuffs[step.ability];
    if (b && b.end - s.t > REFRESH_AT) return false;
  }
  if (step.debuff) { const d = s.debuffs[step.ability] || s.buffs[step.ability]; if (d && d.end - s.t > REFRESH_AT) return false; }
  if (step.stacks) { const d = s.debuffs[step.ability]; if (d && d.stacks >= step.stacks && d.end - s.t > REFRESH_AT) return false; }
  if (step.combo && s.combo < step.combo) return false;
  if (step.power != null) {
    const p = sim.powerType();
    if ((p === 'rage' ? s.rage : p === 'energy' ? s.energy : s.mana) < step.power) return false;
  }
  return true;
}

// The ability to glow now, or null. "Soon" counts: an ability blocked only by the GCD or a cast is still the hint.
function nextHint(sim, list) {
  if (!list || !list.steps) return null;
  for (const step of list.steps) {
    const u = sim.usable(step.ability);
    if (!(u.ok || u.reason === 'gcd' || u.reason === 'casting')) continue;
    if (stepHolds(sim, step)) return step.ability;
  }
  return null;
}

// The list for a spec at a level: the 60 list from level 40 up, the 30 list below (ours: lists exist for 30 and 60).
function listFor(rotations, cls, spec, level) {
  const r = rotations && rotations[cls] && rotations[cls][spec];
  if (!r) return null;
  return level >= 40 ? r[60] || r[30] : r[30] || r[60];
}

if (typeof module !== 'undefined') module.exports = { nextHint, listFor, stepHolds };
