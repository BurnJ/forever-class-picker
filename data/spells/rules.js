'use strict';
/* Combat rules the client data doesn't hold. Every value has src (a URL that states it) or ours (why we chose it).
 *
 * Conventions
 *   src    primary URL that states the value (checked 2026-10-17).
 *   also   extra URLs that back it up or add detail.
 *   ours   no source found; the reason we picked the value.
 *   forever  WoW Forever beta override. Where it exists, the top-level value is already the
 *          Forever value and the 1.12 value sits in `vanilla`. Forever is in beta (build 1.60.1.x),
 *          so treat every `forever` block as liable to change before the Nov 4 launch.
 *   Emulator links (vmangos) are community reimplementations of 1.12, not Blizzard. They are
 *   pinned to commit 53d24d5 so the line numbers stay valid.
 *
 * PROBE FIRST (most uncertain, check in game before trusting):
 *   1. rageNormalized: Forever rage per white hit = weapon speed x 3.46 (1H) / x 4.50 (2H).
 *      Community-measured only. Also check off-hand, daggers, and the crit x2.
 *   2. rageTaken: Forever rewrote rage-from-damage-taken (Oct 8 notes) with unpublished
 *      constants. The vanilla 2.5*d/c is a placeholder.
 *   3. energyTick: Forever reportedly regenerates energy continuously. Measure the per-second rate.
 *   4. reactiveWindows: vmangos uses 4 s. Guides often say 5 s. Forever's Bloodthrill
 *      Overpower lasts 6 s.
 *   5. rageDecay: vanilla 1 rage/s (vmangos). The modern wiki says 1.25/s. Forever adds a delay
 *      talent, so decay still exists, but the rate is unconfirmed.
 *   6. stanceSwap: Forever base Tactical Mastery keeps 10 rage. Confirm the cap and the 1.5 s stance lockout.
 *   7. spellQueueMs: 400 default, but Forever turns the queue off while an on-next-swing ability
 *      (Heroic Strike/Cleave/Raptor Strike) is queued. That is a known beta bug.
 */

const VM = 'https://github.com/vmangos/core/blob/53d24d5c748bef5e0cde7b1155bcb3d979af614c/src/game/Objects/';
const DEVNOTES = 'https://us.forums.blizzard.com/en/wow/t/2360696'; // Blizzard: WoW Forever Beta Development Notes (Sep 24 - Oct 16, 2026)

const RULES = {
  // ---------------------------------------------------------------- global cooldown / queue
  gcd:          { value: 1.5, src: 'https://warcraft.wiki.gg/wiki/Global_cooldown' },          // seconds, default global cooldown
  gcdEnergy:    { value: 1.0, src: 'https://warcraft.wiki.gg/wiki/Global_cooldown' },          // rogue / cat form abilities
  gcdMin:       { value: 1.0, src: 'https://warcraft.wiki.gg/wiki/Global_cooldown',
                  note: 'Haste reduces the GCD only from patch 2.4.0. In 1.12 it never drops below 1.5 (1.0 for energy). 1.0 is the pre-Legion floor. Forever adds GCD cuts (Nature\'s Grace, Gift of the Earthmother -0.5 s, Improved Slam -0.5 s).',
                  also: ['https://www.warcrafttavern.com/forever/news/powershifting-is-back-sort-of-hunter-druid-deep-dive-for-wow-forever/',
                         'https://kami-labs.fr/en/wow-forever/guerrier-wow-forever-sorts-et-talents-modifies/'] },
  stanceLockout:{ value: 1.5, src: 'https://warcraft.wiki.gg/wiki/Global_cooldown' },          // s; a warrior stance swap blocks another swap for this long
  spellQueueMs: { value: 400, src: 'https://maxroll.gg/wow/resources/spell-queue-window',      // modern client SpellQueueWindow default (range 0-400)
                  forever: { bug: 'Queueing an on-next-attack ability (Heroic Strike/Cleave/Raptor Strike) disables the spell queue window (beta known issue)',
                             src: 'https://us.forums.blizzard.com/en/wow/t/2355684' } },

  // ---------------------------------------------------------------- rage
  rageMax:        { value: 100, src: 'https://warcraft.wiki.gg/wiki/Rage' },
  // c(L) = a*L^2 + b*L + c  (230.6 at level 60). Forever still uses it for rage from damage TAKEN (constants may have moved, see rageTakenMult).
  rageConversion: { value: 'formula', a: 0.0091107836, b: 3.225598133, c: 4.2652911,
                    src: VM + 'Player.cpp#L2243-L2267',
                    also: ['https://bookdown.org/SamCiero/scod/abilities-and-rotation.html'] },
  // Vanilla only: rage from melee damage dealt = 7.5 * dmg / c(L). Forever replaced this with rageNormalized.
  rageDealtMult:  { value: 7.5, src: VM + 'Player.cpp#L2253', also: ['https://www.curseforge.com/wow/addons/classicragelog'],
                    forever: { superseded: 'rageNormalized' } },
  // Rage from damage taken = 2.5 * dmg / c(L). Forever (Oct 8 notes) rebuilt this around an expected creature health
  // and a 20-40% armor assumption, and ignores absorbs. No constants were published, so 2.5 is a placeholder.
  rageTakenMult:  { value: 2.5, src: VM + 'Player.cpp#L2257',
                    forever: { changed: true, constantsUnknown: true, src: DEVNOTES } },
  // FOREVER: rage per successful white hit depends on weapon speed, not damage. Misses, dodges and parries give nothing.
  rageNormalized: { perSpeed1H: 3.46, perSpeed2H: 4.50, critMult: 2.0 /* +100% on crit */, missGives: 0,
                    src: 'https://us.forums.blizzard.com/en/wow/t/2355684',            // "one-handed weapons generate 3.46 rage per second ... two-handed 4.5"
                    also: ['https://www.icy-veins.com/wow-forever/news/wow-forever-just-reworked-warrior-rage-and-players-cant-stop-talking-about-it/',
                           'https://kami-labs.fr/en/wow-forever/rage-du-guerrier-wow-forever/',
                           DEVNOTES /* crit: 75% then 100% increased rage for warriors; Bear/Dire Bear also 100% after Oct 8 */,
                           'https://eu.forums.blizzard.com/en/wow/t/633050'],
                    note: '3.46 and 4.50 are community-measured. Blizzard has not published them. The Dual Wield Spec off-hand rage bonus was removed (Oct 1). Off-hand base value not measured; we assume the same per-speed rate.' },
  rageDecay:      { value: 1, per: 1 /* rage per second, out of combat */, tick: 2,
                    src: VM + 'Player.cpp#L2311-L2315',            // "2 rage by tick (= 2 seconds => 1 rage/sec)"
                    note: 'warcraft.wiki.gg/wiki/Rage gives 1.25/s, but that is the modern value. Forever talent Lingering Rage delays decay by 2-10 s, so decay still exists there.',
                    also: [DEVNOTES] },
  stanceSwap:     { keepRage: 10, src: 'https://kami-labs.fr/en/wow-forever/rage-du-guerrier-wow-forever/',   // Forever: Tactical Mastery is baseline, keeps up to 10
                    forever: { improvedTacticalMastery: 15 /* extra, total 25 */, src: 'https://kami-labs.fr/en/wow-forever/guerrier-wow-forever-sorts-et-talents-modifies/' },
                    vanilla: { keepRage: 0, perTacticalMasteryRank: 5, src: 'https://wow.allakhazam.com/wiki/Rage_(WoW)' } },
  bloodrage:      { now: 10, overTime: 10, duration: 10, cooldown: 60, offGcd: true, healthCostPctBase: 20, stopsDecay: true,
                    src: 'https://www.wowhead.com/classic/spell=2687/bloodrage',
                    also: ['https://www.wowhead.com/classic/spell=29131/bloodrage'],
                    note: 'Wowhead lists raw power values. Rage is stored as tenths internally, so confirm 10 + 1/s x 10 in game.' },

  // ---------------------------------------------------------------- energy / combo points
  // Vanilla: 20 energy every 2 s in lumps. FOREVER: continuous regeneration for rogue and cat.
  energyTick:     { value: 20, every: 2, mode: 'continuous', perSecond: 10,
                    src: 'https://conquestcapped.com/guides/wow-forever/wow-forever-rogue-leveling/',   // "Energy now regenerates continuously instead of in 2-second ticks"
                    also: ['https://games.gg/world-of-warcraft/guides/wow-forever-every-class-new-ability-and-talent-change/'],
                    ours: 'perSecond 10 is the vanilla average (20/2 s). Forever has not published a rate. The guide\'s 45-energy-in-4.25 s example implies about 10.6/s.',
                    vanilla: { value: 20, every: 2, src: VM + 'Player.cpp#L2317-L2321', also: ['https://noobtoboss.com/wow-classic-rogue-energy-guide/'] } },
  energyMax:      { value: 100, src: 'https://warcraft.wiki.gg/wiki/Energy' },
  comboMax:       { value: 5, src: 'https://warcraft.wiki.gg/wiki/Combo_point',
                    note: 'On the target, as in vanilla. Forever: points stay on the original target when you switch.',
                    also: ['https://games.gg/world-of-warcraft/guides/wow-forever-every-class-new-ability-and-talent-change/'] },
  bearBlocksEnergyRegen: { value: true, src: DEVNOTES },          // Forever Oct 16: "Bear and Dire Bear Form still prevent Energy regeneration"

  // ---------------------------------------------------------------- mana
  fiveSecondRule: { value: 5, src: 'https://warcraft.wiki.gg/wiki/Five_second_rule',
                    note: 'Starts when a spell that spends mana finishes. Free casts (Clearcasting) do not start it. MP5 keeps ticking during it.' },
  manaTick:       { value: 2, src: VM + 'Player.cpp#L2286', also: ['https://warcrafttavern.com/wow-classic/guides/mana-management-optimization'] }, // s; REGEN_TIME_PLAYER_FULL = 2000 ms
  // Mana per 2 s tick from Spirit, outside the 5-second rule: base + spirit / div
  manaRegen: {
    perTick: {
      druid:   { base: 15,   div: 5 },
      hunter:  { base: 15,   div: 5 },
      mage:    { base: 12.5, div: 4 },
      paladin: { base: 15,   div: 5 },
      priest:  { base: 12.5, div: 4 },
      shaman:  { base: 17,   div: 5 },
      warlock: { base: 15,   div: 5 },
    },
    whileCasting: { meditation: 0.15, reflection: 0.15, arcaneMeditation: 0.15, mageArmor: 0.30 }, // share of spirit regen kept inside the 5-second rule (talents at max rank)
    src: VM + 'Unit.cpp#L6283-L6318',
    also: ['https://github.com/mangoszero/server/blob/master/src/game/Object/PlayerStats.cpp',
           'https://warcrafttavern.com/wow-classic/guides/mana-management-optimization' /* whileCasting values */],
    note: 'From the emulators. No Blizzard source states it. Forever adds spirit regen while casting for some hunter and shaman talents (no numbers yet).',
  },

  // ---------------------------------------------------------------- hit tables (player vs level-matched mob, 300 skill)
  meleeVsLevelMatched: { miss: 0.05, dodge: 0.05, parry: 0.05, glancing: 0.10, glancingDmg: 0.95, block: 0.05,
                         src: 'https://github.com/magey/classic-warrior/wiki/Attack-table',
                         also: [VM + 'Unit.cpp#L2474-L2550' /* creature dodge/parry/block = 5% */],
                         note: 'Parry and block only from the front. A dummy hit from behind: parry 0, block 0. Glancing applies only to white melee. Dual-wield white miss is 24% (5% + 19%), our assumption from the same table logic. Forever known issue: mobs can parry and block from behind at close range.',
                         forever: { glancingNote: 'Melee glancing chance and equal-level penalty are correct. Caster glancing chance is wrong (known issue).',
                                    src: 'https://rankedboost.com/world-of-warcraft/forever/stats/combat-rules/' } },
  dualWieldMissPenalty: { value: 0.19, ours: 'Standard 1.12 value, not found on a fetched page. Magey\'s page covers the single-weapon table only.' },
  spellMissVsLevelMatched: { value: 0.04, src: VM + 'SpellCaster.cpp#L795-L830',     // hit = 96 - leveldiff (diff < 3), so 4% at equal level
                             note: '+1 level 5%, +2 6%, +3 17% (vs mobs, 11%/level past 2).' },

  // ---------------------------------------------------------------- crit / gear assumptions (ours)
  critMelee:  { value: 0.15, perLevel: L => 0.05 + 0.10 * L / 60,
                ours: 'Typical questing or pre-raid crit at 60 including agility, about 15%. The ramp is linear from the 5% base. Forever basic-attack crits give +100% rage.' },
  critSpell:  { value: 0.10, perLevel: L => 0.05 + 0.05 * L / 60,
                ours: 'Typical 60 caster with intellect and some gear, about 10%. Forever: DoTs can crit.',
                also: ['https://games.gg/world-of-warcraft/guides/wow-forever-every-class-new-ability-and-talent-change/'] },
  critMult:   { melee: 2.0, spell: 1.5, ours: 'Standard 1.12 multipliers before talents (Impale, Ice Shards etc.). Not checked against a fetched page.' },
  weapon: {
    dps1H:    L => Math.max(2, 0.8 * L - 1),   // ~47 at 60
    dps2H:    L => Math.max(3, 1.1 * L - 2),   // ~64 at 60
    dpsRanged:L => Math.max(2, 0.7 * L),       // ~42 at 60
    dpsWand:  L => Math.max(3, 1.2 * L),       // ~72 at 60 (wands: Forever wands get no spell damage)
    speed: { oneHand: 2.6, dagger: 1.8, twoHand: 3.5, ranged: 2.8, wand: 1.6, catForm: 1.0, bearForm: 2.5 },
    ours: 'Rough curve through common quest and dungeon blues at 60. Players can override with their own weapon. Cat 1.0 / bear 2.5 swing comes from Forever (form swings use weapon DPS).',
    also: ['https://www.warcrafttavern.com/forever/news/powershifting-is-back-sort-of-hunter-druid-deep-dive-for-wow-forever/', DEVNOTES /* wands no spell damage, Sep 24 */],
  },
  attackPower: { melee: L => 30 + 14.5 * L, ranged: L => 20 + 14.5 * L, feral: L => 40 + 16 * L,
                 apPerDps: 14, ours: 'About 900 AP at 60 (pre-raid blues). apPerDps 14 is the standard AP to DPS ratio. Not checked against a fetched page.' },
  spellPower:  { value: L => Math.max(0, (L - 20) * 7.5), ours: 'About 300 bonus spell damage or healing at 60 pre-raid, none before 20. A rough guess.' },

  // ---------------------------------------------------------------- dummy behaviour (ours)
  dummyHitBack: { swing: 2.0, dmgPct: 0.04, ours: 'Off by default. When on (for rage from damage taken, Revenge, Riposte, Counterattack), the dummy hits for 4% of player max HP every 2 s, so a tank sees steady rage without dying. Its avoidance rolls use player defense.' },
  dummyLevel:   { value: 'player', ours: 'Level-matched to keep the meleeVsLevelMatched table valid. A +3 boss mode would need the 8% miss / 6.5% dodge / 14% parry / 40% glancing table from the Magey page.' },

  // ---------------------------------------------------------------- reactive windows
  // Overpower: after the target dodges. Revenge: after you block/dodge/parry. Riposte/Counterattack: after you parry.
  reactiveWindows: { overpower: 4, revenge: 4, riposte: 4, counterattack: 4, execute: 20 /*% hp*/,
                     src: 'https://github.com/vmangos/core/blob/53d24d5c748bef5e0cde7b1155bcb3d979af614c/src/game/Objects/UnitDefines.h#L746',  // REACTIVE_TIMER_START 4000
                     also: [VM + 'Unit.cpp#L8860-L8911', 'https://warcraft.wiki.gg/wiki/Execute' /* "less than 20% health" */],
                     note: 'vmangos uses 4 s. Many guides say 5 s. Probe this. Forever Bloodthrill: 20% chance per main-hand white hit on a Rend target to enable Overpower for 6 s.',
                     forever: { bloodthrillOverpower: 6, src: 'https://kami-labs.fr/en/wow-forever/guerrier-wow-forever-sorts-et-talents-modifies/' } },
  executeRage:   { cost: 15, dmgPerExtraRage: 3, src: 'https://warcraft.wiki.gg/wiki/Execute', note: 'Vanilla rank 1 base. Higher ranks scale per rank, see client data.' },

  // ---------------------------------------------------------------- class rules not in spell data
  autoShot:     { standStill: 0.5, offGcd: true, src: DEVNOTES,          // Oct 16: "Auto Shot now requires you to stand still for 0.5 seconds before shooting"
                  also: ['https://www.wowhead.com/classic/spell=75/auto-shot'],
                  note: 'The 0.5 s stand-still also applies to wands (same notes). Hunters keep firing Auto Shot while casting Aimed Shot or Sniper Shot in Forever. Swing = ranged weapon speed.' },
  wand:         { standStill: 0.5, spellDamage: false, src: DEVNOTES },
  judgement:    { cooldown: 10, offGcd: true, src: 'https://www.wowhead.com/classic/spell=20271/judgement',
                  note: 'Judgement consumes the active seal. This is ours, the standard 1.12 behaviour (the fetched page had no tooltip text).' },
  sealOfCommandPpm: { value: 7, ours: 'Community consensus for 1.12 (procs per minute, so chance = 7 * speed / 60). No primary source fetched.' },
  shockSharedCd:{ value: 6, src: 'https://www.wowhead.com/classic/spell=8042/earth-shock',     // Earth Shock 6 s cooldown, on the 1.5 s GCD
                  ours: 'Shared across Earth, Flame and Frost Shock: standard 1.12 category cooldown, not stated on the fetched page. Prefer the client category cooldown if it is there.' },
  clearcasting: { omenChance: 0.10, omenBaselineLevel: 20, arcaneConcPerRank: 0.02, elementalFocusOnCrit: 1.0,
                  ours: 'The Omen of Clarity proc rate in 1.12/Forever is unsourced. We use 10% per melee hit, a common player estimate. The talent ranks come from client data. Forever makes Omen of Clarity baseline at level 20, and Wrath no longer consumes Clearcasting.',
                  also: ['https://www.warcrafttavern.com/forever/news/powershifting-is-back-sort-of-hunter-druid-deep-dive-for-wow-forever/'] },
  druidForms:   { catSwing: 1.0, bearSwing: 2.5, weaponDpsCarries: true, furorKeepsCatEnergy: true,
                  src: 'https://www.warcrafttavern.com/forever/news/powershifting-is-back-sort-of-hunter-druid-deep-dive-for-wow-forever/',
                  also: [DEVNOTES /* Oct 16 Furor: keep Cat energy when going to Bear */],
                  note: 'Forever: form auto-attacks use weapon DPS at a fixed form speed. Furor (Resto 5) lets energy regen outside Cat Form as if in Cat. Bear/Dire Bear blocks energy regen. Shifting Power gives 40 energy for 55% base mana, 16 s cooldown, not usable at full energy. Shift mana costs come from client data.' },
  pets:         { swing: 2.0, ours: 'Base pet melee speed. Family modifiers come from client data if present. Forever: hunter pets scale from the hunter\'s gear and no longer take player stat buffs.',
                  also: ['https://www.warcrafttavern.com/forever/news/powershifting-is-back-sort-of-hunter-druid-deep-dive-for-wow-forever/'] },
  onNextSwing:  { rageOnHit: 0, ours: 'Forever: Heroic Strike replaces the white hit and that hit makes no rage (kami-labs measurement). Vanilla also gave no white-hit rage for a Heroic Strike swing.',
                  also: ['https://kami-labs.fr/en/wow-forever/rage-du-guerrier-wow-forever/'] },
  slamResetsSwing: { value: true, forever: { improvedSlam: 'no longer resets/delays swing; -0.5 s cast and GCD', base: { cast: 1.5 } },
                     src: 'https://kami-labs.fr/en/wow-forever/guerrier-wow-forever-sorts-et-talents-modifies/' },

  // ---------------------------------------------------------------- character assumptions for the dummy (ours)
  healthPool:  { value: L => 60 + 70 * L, ours: 'About 4,300 health at 60 with quest and dungeon gear. Only used for health costs, the dummy hitting back and the party frames.' },
  manaPool:    { value: L => 80 + 65 * L, ours: 'About 4,000 mana at 60 for a caster in pre-raid gear. Hunters and paladins use the same pool to keep things simple.' },
  baseMana:    { value: L => 20 + 20 * L, ours: 'Base mana (before Intellect) that percentage costs are taken from. About 1,200 at 60, close to the 1.12 class tables.' },
  spirit:      { value: L => 20 + 1.6 * L, ours: 'About 115 Spirit at 60 for a caster. Feeds manaRegen.perTick.' },
  offhandDmg:  { value: 0.5, ours: 'The standard off-hand damage penalty before talents.' },
  playerAvoidance: { dodge: 0.05, parry: 0.05, block: 0.05,
                     ours: 'Used only when the dummy hits back. Parry is for classes that can parry (warrior, rogue, paladin, hunter, shaman). Block needs a shield (Protection warrior and paladin). Sized so Revenge, Riposte and Counterattack come up now and then.' },
  petDps:      { value: L => 1.2 * L, ours: 'A hunter or warlock pet doing about 70 DPS at 60. Only shown in the damage total.' },
  finisherDuration: { perCombo: 3, ours: 'Slice and Dice style finishers last the client duration plus 3 seconds per combo point after the first (the 1.12 pattern 9/12/15/18/21).' },
  windfury:    { chance: 0.2, extraAttacks: 1, ours: 'The 1.12 Windfury Weapon proc: 20% per hit for one extra attack.' },
  clearcastingDruid: { chance: 0.10, minLevel: 20, src: 'https://www.warcrafttavern.com/forever/news/powershifting-is-back-sort-of-hunter-druid-deep-dive-for-wow-forever/',
                       ours: 'The chance is ours (see clearcasting.omenChance). Forever makes Omen of Clarity baseline at 20.' },
  healerParty: { size: 5, tankHit: { every: 1.5, pct: 0.05 }, pulse: { every: 8, pct: 0.12 }, spike: { every: 11, pct: 0.3 },
                 ours: 'Party damage script for healer practice: steady hits on the tank, a party-wide pulse and a big spike on one random member. Tuned so one healer at the same level can keep up with some effort.' },
};
if (typeof module !== 'undefined') module.exports = { RULES };
