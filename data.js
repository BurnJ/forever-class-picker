'use strict';

/* ================================================================
   GUIDE CONTENT
   Source: Skyy's "Forever Ultimate Class Picking Guide" script.
   Wording is Skyy's, tidied for reading. Edit text here, nothing
   else needs to change.
   ================================================================ */

// Class:  { id, name, color, text, pitch, summary, idealPlayer[], strengths[], weaknesses[],
//           changes[{ term, text }], specs[], outro[] }
//   color = class color for crest and rules, text = lighter variant that passes AA as text
// Spec:   { id, name, role, roles[], range, pet, complexity, support, solo, themes[],
//           intro[], changes[{ term, text }], take?, unconfirmed? }
//   roles:      'tank' | 'healer' | 'melee' | 'ranged'   (from the script)
//   range:      'melee' | 'ranged'                        (from the script)
//   pet:        0 none, 1 optional, 2 central             (from the script)
//   complexity: 1 simple, 2 some juggling, 3 lots         (inferred, see README)
//   support:    1 own damage, 2 some of both, 3 group     (inferred, see README)
//   solo:       1 wants a group, 2 either, 3 great alone  (inferred, see README)
//   themes:     holy | nature | shadow | arcane | steel | elements | stealth | beasts

const CLASSES = [
  {
    id: 'paladin',
    name: 'Paladin',
    color: '#F58CBA',
    text: '#F9A8CB',
    pitch: 'Plate armor and the blessing of the Light. Protect the weak, heal the wounded, bring justice to the unjust.',
    summary: 'The call of the Paladin is to protect the weak, bring justice to the unjust and vanquish evil from all corners of the world. Paladins are equipped with plate armor to confront the toughest foes, and the blessing of the Light allows them to heal wounds and even, in some cases, restore life to the dead.',
    idealPlayer: [
      'The Paladin rewards players who keep an eye on the whole battlefield. Recognizing when an ally needs help, when to spend a defensive cooldown, and when to turn from attacking to healing are central to making full use of the class.',
      'It suits those who enjoy having an answer when a fight goes wrong, and who find as much satisfaction in saving a companion as defeating an enemy.',
      'The Paladin is there to fill the role where he is needed.'
    ],
    strengths: [
      { lead: 'Exceptional group utility', text: 'Blessings, auras, and cleansing spells make you a valuable companion in almost any party.' },
      { lead: 'Powerful emergency support', text: 'Protective blessings and healing can save an ally when a battle turns against them.' },
      { lead: 'Strong survivability', text: 'Armor, self-healing, and defensive cooldowns keep you standing.' },
      { lead: 'Three playable roles', text: 'You can pursue tanking, healing, or melee damage through the same character.' }
    ],
    weaknesses: [
      { lead: 'Limited mobility', text: 'Closing the distance is difficult, particularly against enemies determined to keep you away.' },
      { lead: 'Limited interrupts', text: 'A stun can stop some dangerous casts, but enemies immune to it often require help from your party.' },
      { lead: 'Mana management', text: 'Attacking, healing, and supporting allies all draw from the same pool.' },
      { lead: 'Changing roles takes preparation', text: 'Different equipment and talent choices are needed to perform each job effectively.' }
    ],
    changes: [
      { term: 'Blessing of Kings and Consecration', text: 'Both are now baseline, so you no longer have to spend talent points just to pick those up.' },
      { term: 'Hour-long blessings', text: 'Your blessings last an entire hour. Anybody who has spent time buffing people in Classic knows how nice that is.' },
      { term: 'Holy Strike', text: 'A short-cooldown attack combining weapon damage with Holy damage, giving you another button to press between your swings and Judgements.' },
      { term: 'Seal of Fury', text: 'Gives you small absorb shields as you attack, and when you judge it, it taunts your target. Before we even get into the Protection tree, you have an actual taunt and another way to keep yourself alive.' }
    ],
    specs: [
      {
        id: 'protection', name: 'Protection', role: 'Tank',
        roles: ['tank'], range: 'melee', pet: 0, complexity: 2, support: 3, solo: 2, themes: ['holy', 'steel'],
        intro: [
          'With shield raised and the ground beneath them consecrated, the Protection Paladin stands between their companions and the enemy. This is the Paladin\'s tanking specialization, drawing foes into close combat and holding their attention through steel and Holy magic.',
          'You gather enemies within your Consecration, deal as much reflective damage as possible, and keep enough mana in reserve to answer a sudden threat. A well-timed defensive or protective blessing can give your healer the precious seconds needed to recover.'
        ],
        changes: [
          { term: 'Shield Specialization', text: 'Now gives you mana back when you block. There is additional mana recovery when your Seal of Fury shield gets fully absorbed, with increased returns against higher-level enemies. Taking hits is actually helping you sustain your mana, which addresses one of the biggest headaches with tanking on a Classic paladin.' },
          { term: 'Swift Judgement', text: 'Immediately resets your Judgement cooldown and makes the next one free. Pair that with Seal of Fury and you have potentially got back-to-back taunts when you need to get enemies under control.' },
          { term: 'Templar\'s Bulwark', text: 'An absorb shield equal to 100% of your maximum health for eight seconds. It applies Forbearance, but this is a proper “oh shit” button you can press while keeping the enemies on you.' }
        ],
        take: 'I actually played this at BlizzCon, and man, Protection felt substantially better. A taunt, more mana coming back while you are tanking, and a major defensive for when a pull gets dangerous. These are changes you notice immediately when you are playing.'
      },
      {
        id: 'holy', name: 'Holy', role: 'Healer',
        roles: ['healer'], range: 'ranged', pet: 0, complexity: 1, support: 3, solo: 1, themes: ['holy'],
        intro: [
          'Entrusted with the lives of their companions, the Holy Paladin carries the Light into the most dangerous battles. This is the Paladin\'s healing specialization, mending wounds and shielding allies from harm while the fight unfolds around them.'
        ],
        changes: [
          { term: 'Holy Shock', text: 'Moved from the 31-point capstone to a 21-point talent, so you can pick it up with less investment and have more points to play with elsewhere.' },
          { term: 'Light\'s Vigil', text: 'The new capstone, giving Holy access to AoE healing or AoE damage. That is a big addition for a spec that has traditionally been so focused on keeping individual targets alive.' },
          { term: 'Voice of Truth', text: 'Six seconds of immunity to silences and interrupts. If you need to get a heal off while somebody is trying to smash you in the face, that is an incredibly useful tool to have.' },
          { term: 'Illumination', text: 'Still there for your mana refunds from healing crits, while other talents improve the damage, hit chance, and crit chance of your Holy spells. There is support here for both your healing and the offensive side of the class.' }
        ]
      },
      {
        id: 'retribution', name: 'Retribution', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 2, support: 3, solo: 2, themes: ['holy', 'steel'],
        intro: [
          'With a two-handed weapon blessed by the Light, the Retribution Paladin meets evil at striking distance. This is the Paladin\'s melee damage specialization, combining heavy weapon swings with seals and Holy attacks to bring judgement upon their foes.',
          'With well-timed seals and strikes you can deal devastating attacks, but even with your attention on the enemy, your job is to always assist a companion who is in need of your aid. Knowing when to interrupt your assault with a blessing or heal is part of mastering Retribution.'
        ],
        changes: [
          { term: 'Twist of the Light', text: 'The new capstone. Replacing an eligible seal gives you an echo of the seal you just replaced. Your next melee attack then applies that old seal\'s effect and consumes the echo.' },
          { term: 'Seal twisting, made forgiving', text: 'Say you have Seal of Command active, then switch to Seal of Righteousness. Your next swing can carry that Command effect along with your new seal. You are carrying the effect into your next attack instead of relying on that tiny timing window.' },
          { term: 'Shockadin', text: 'With Holy Shock moving earlier in Holy and Intellect scaling available deeper in Ret, there is potential to combine the two for a build that leans more into spell damage.' }
        ]
      }
    ],
    outro: [
      'To choose the Paladin is to carry both a weapon and a responsibility. Whether holding the line as Protection, tending the wounded as Holy, or delivering judgement as Retribution, you remain a guardian to those fighting beside you.',
      'Mastery comes from knowing when to strike, when to stand firm, and when another\'s survival rests in your hands. For the adventurer who finds equal purpose in defeating an enemy and saving a companion, the path of the Paladin awaits.'
    ]
  },

  {
    id: 'druid',
    name: 'Druid',
    color: '#FF7D0A',
    text: '#FF9A40',
    pitch: 'Shapeshifters who harness nature. The most versatile class in the game, able to fill every role.',
    summary: 'Druids harness the vast power of nature to preserve balance and protect life. They can unleash nature\'s raw energy against enemies by raining celestial fury on them from a great distance, binding them with enchanted vines, or shapeshifting into powerful creatures to deal relentless attacks. Druids are the most versatile combatants in all of World of Warcraft, and they can fulfill every role.',
    idealPlayer: [
      'The Druid suits adventurers who value freedom in how they approach a challenge. Slipping past danger in Cat Form, standing against it as a bear, or calling upon nature to heal and destroy.',
      'The Druid rewards players who enjoy adapting to the battlefield, learning the strengths of each form, and recognizing when a change of tactics could save a companion or turn a fight.',
      'For those who want to explore several ways of playing through a single character, the Druid offers many paths to master.'
    ],
    strengths: [
      { lead: 'Exceptional versatility', text: 'Tanking, healing, melee damage, and ranged spellcasting are all available, giving you a broad choice of roles as your character develops.' },
      { lead: 'Valuable group support', text: 'Healing, Innervate, and the ability to resurrect a fallen companion during combat.' },
      { lead: 'Mobility and stealth', text: 'Greater freedom to explore, avoid unwanted encounters, and choose where to fight.' },
      { lead: 'Several ways to survive', text: 'Different forms let you withstand an attack, escape, or find an opening to heal.' }
    ],
    weaknesses: [
      { lead: 'Your forms lock away your spells', text: 'A bear or a cat cannot cast. Healing a companion or calling on nature\'s magic means leaving your form first, and choosing the wrong moment to shift can cost you the fight.' },
      { lead: 'Mana management', text: 'Shapeshifting, healing, and spellcasting all draw from the same pool, so changing forms freely can leave you short when you need a heal most.' },
      { lead: 'Every role asks for its own build', text: 'Each form demands its own talents and equipment. Even within Feral, getting everything you want for both bear and cat comes with tradeoffs.' },
      { lead: 'A lot to learn', text: 'Rage as a bear, energy and combo points as a cat, and mana as a caster. Versatility only pays off once you know each form well enough to pick the right one.' }
    ],
    changes: [
      { term: 'Omen of Clarity', text: 'Now baseline, so you no longer have to invest into Balance just to pick that up.' },
      { term: 'Revive', text: 'An out-of-combat resurrection, because originally Druid didn\'t have one for some reason. Rebirth is still there for resurrecting somebody during combat, with its 30-minute cooldown, so those are two separate tools now.' },
      { term: 'Smooth energy', text: 'Cat Form energy regenerates smoothly instead of coming back in large ticks, changing how your resources flow while you are fighting.' }
    ],
    specs: [
      {
        id: 'feral', name: 'Feral', role: 'Tank or melee damage',
        roles: ['tank', 'melee'], range: 'melee', pet: 0, complexity: 3, support: 2, solo: 3, themes: ['nature', 'beasts'],
        intro: [
          'The Feral Druid enters battle with tooth and claw, assuming the strength of a bear or the instincts of a stalking cat. This specialization offers both tanking and melee damage, with each form demanding its own talents, equipment, and approach to combat.',
          'As a bear, you stand at the front, holding enemies\' attention and enduring the blows meant for your companions. As a cat, you seek openings to build combo points and deliver finishing attacks, keeping your bleeds working while conserving energy for the next strike.'
        ],
        changes: [
          { term: 'Primal Bite', text: 'Bears gain another major attack to work into their tanking.' },
          { term: 'Berserk, as a bear', text: 'The new capstone removes Mangle\'s cooldown and lets it hit up to three targets. When you have several enemies in front of you, you have a window where you can repeatedly hit them with Mangle.' },
          { term: 'Berserk, as a cat', text: 'Increases the critical-strike chance of your combo-point-generating abilities by 100%, giving you a major burst window. Berserk lasts 15 seconds and also makes you immune to fear.' },
          { term: 'Bear or cat', text: 'There are enough separate damage and defensive investments that you will have to make some choices between maximizing cat and bear. You can still build around using both forms, but getting everything you want for both roles comes with tradeoffs.' }
        ]
      },
      {
        id: 'restoration', name: 'Restoration', role: 'Healer',
        roles: ['healer'], range: 'ranged', pet: 0, complexity: 2, support: 3, solo: 1, themes: ['nature'],
        intro: [
          'Where battle leaves wounds, the Restoration Druid calls upon nature to renew life. This is the Druid\'s healing specialization, surrounding companions with restorative magic that continues to mend them as the fighting carries on.',
          'Your strength lies in preparing for damage before it arrives. Keep healing effects upon those in danger, tend to several wounded allies, and reserve a swift response for anyone close to falling.'
        ],
        changes: [
          { term: 'Wild Growth', text: 'The new capstone, adding an AoE healing-over-time tool for when multiple people are taking damage.' },
          { term: 'Swiftmend', text: 'Moves up to the 16-point talent tier, so you can pick up that immediate healing option much earlier in your build.' },
          { term: 'Gift of the Earthmother', text: 'Reduces the global cooldown on Rejuvenation, Swiftmend, and Wild Growth by half a second. You can spread Rejuvenations around more quickly, respond with Swiftmend, and use Wild Growth when several people need healing together.' },
          { term: 'A regular resurrection', text: 'With Revive finally available, you are bringing a much more convenient toolkit into your dungeon groups.' }
        ]
      },
      {
        id: 'balance', name: 'Balance', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 0, complexity: 2, support: 2, solo: 2, themes: ['nature', 'arcane'],
        intro: [
          'Drawing upon the fury of the stars and the power of the natural world, the Balance Druid strikes from afar. This is the Druid\'s ranged spellcasting specialization, weaving Nature and Arcane magic together while roots hold approaching enemies at bay.',
          'In a party, you work from a distance, preparing one spell with another and keeping damage-over-time effects upon your foes.'
        ],
        changes: [
          { term: 'Eclipse', text: 'Wrath reduces the cast time of your next two Starfires by half a second, stacking up to four times. You build that effect with Wrath, then switch over and send out two substantially faster Starfires. Casting one spell helps set up the other.' },
          { term: 'Balance of Nature', text: 'Increases the damage of the opposite effect, whether solar or lunar, by 1%, stacking up to 10 times. It creates a really nice gameplay loop for Balance.' },
          { term: 'Insect Swarm', text: 'Moves from Restoration into Balance, alongside talents supporting periodic damage and healing, giving the damage-over-time side of the tree more attention.' }
        ]
      }
    ],
    outro: [
      'To choose the Druid is to walk the wilds with nature as both weapon and shelter. Whether calling down the stars, meeting an enemy with tooth and claw, or restoring life to wounded companions, your strength takes many forms.',
      'Mastery comes from knowing when to stand your ground, when to change your approach, and when to lend your strength to another. For the adventurer drawn to the freedom of shapeshifting and the patient work of learning its many possibilities, the path of the Druid awaits you.'
    ]
  },

  {
    id: 'priest',
    name: 'Priest',
    color: '#FFFFFF',
    text: '#FFFFFF',
    pitch: 'Powerful healing magic to fortify allies, and dark practices to break enemies from a distance.',
    summary: 'Priests are devoted to the spiritual realm, and express their unwavering faith by serving the people. In the midst of terrible conflict, no hero questions the value of the priestly orders. They use powerful healing magic to fortify themselves and their allies, and wield powerful offensive abilities from a distance through dark practices only they should wield.',
    idealPlayer: [
      'The Priest suits those who enjoy winning battles through careful judgement and command of magic. Choosing whom to shield, which wound demands immediate attention, and when to conserve your strength rewards a watchful player.',
      'Those drawn to healing will find several ways to safeguard their companions, while Shadow offers a darker calling through lingering afflictions and attacks upon the mind.',
      'Whether preserving life or wearing an enemy down, the Priest rewards patience, awareness, and knowing which spell the moment demands.'
    ],
    strengths: [
      { lead: 'Extensive healing toolkit', text: 'Protective shields, immediate healing, and spells that mend wounds over time give you several answers to the dangers facing your party.' },
      { lead: 'Support and dispels', text: 'Fortitude strengthens your companions, while removing harmful magic from allies or stripping an enemy\'s magical advantage can change the course of a fight.' },
      { lead: 'Two healing specs and Shadow', text: 'You can explore different approaches to supporting a group or dealing ranged damage through the same character.' }
    ],
    weaknesses: [
      { lead: 'Limited mobility', text: 'Choosing a safe position matters, since escaping an enemy who reaches you can be difficult.' },
      { lead: 'Vulnerable under pressure', text: 'Cloth armor offers little protection against physical attacks, and being forced to move or interrupted can prevent you from casting the spells you need.' },
      { lead: 'Mana demands restraint', text: 'Repeated emergency heals, shields, and dispels can drain your reserves, making the choice of when to spend heavily just as important as knowing which spell to cast.' }
    ],
    changes: [
      { term: 'Three spells go baseline', text: 'Shadow Word: Death, Devouring Plague, and Fear Ward are now baseline. Every priest gets access to them, with Devouring Plague and Fear Ward no longer locked behind your race.' },
      { term: 'Gnome priests', text: 'Gnomes can now be priests. They get Confounding Flash, an AoE disorient, and Contingency Plan, which triggers a heal when the target drops below 35% health.' },
      { term: 'Human and Undead', text: 'Humans get Divine Grace, removing Weakened Soul from a target and healing them. Undead get Dark Sacrifice, trading health for mana over 15 seconds.' },
      { term: 'Dwarf', text: 'Chastise and Desperate Prayer, for control and an instant self-heal.' },
      { term: 'Night Elf and Troll', text: 'Night Elves keep Starshards alongside an improved Elune\'s Grace. Trolls have Hex of Weakness for healing reduction and Shadowguard for damage when attacked.' }
    ],
    specs: [
      {
        id: 'shadow', name: 'Shadow', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 0, complexity: 2, support: 2, solo: 2, themes: ['shadow'],
        intro: [
          'The Shadow Priest turns their attention to the enemy\'s mind, inflicting torment that lingers long after a spell is cast. This is the Priest\'s ranged damage specialization, combining persistent afflictions with direct assaults of Shadow magic.'
        ],
        changes: [
          { term: 'Shadow Focus', text: 'Now grants spell hit directly.' },
          { term: 'Improved Mind Flay', text: 'Adds five yards of range and 20% more damage. The tradeoff is that its slow drops from 50% to 20%, so you are giving up some control for better damage and reach.' },
          { term: 'Devouring Plague', text: 'Gets talent support that reduces its mana cost and allows it to jump to nearby targets if they die with the debuff active, giving your newly baseline disease more potential against multiple enemies.' },
          { term: 'Silence and Blackout', text: 'Silence no longer requires the Psychic Scream cooldown-reduction talent, while that cooldown reduction now sits behind Blackout.' }
        ]
      },
      {
        id: 'discipline', name: 'Discipline', role: 'Healer',
        roles: ['healer'], range: 'ranged', pet: 0, complexity: 2, support: 3, solo: 1, themes: ['holy'],
        intro: [
          'Through unwavering will and sacred magic, the Discipline Priest guards companions against the trials of battle. This is a healing specialization built around absorb shields and recovery.'
        ],
        changes: [
          { term: 'Penance', text: 'The famous Penance is now available as a 21-point talent, and Power Infusion is still there, giving you another major spell alongside that familiar cooldown.' },
          { term: 'Renewed Hope', text: 'Reduces the remaining duration of Weakened Soul when you cast qualifying healing spells on that target. After you shield somebody, healing them brings forward the next time you can shield them again.' },
          { term: 'Holy damage builds', text: 'Talents increase Smite and Penance damage against targets affected by Holy Fire, provide Holy spell hit, and reduce the mana cost of Smite and Holy Fire.' },
          { term: 'Smite priest', text: 'Over in Holy, Searing Light can give you free Holy Nova casts through procs. There is potential for a Smite-focused build where Holy Fire sets up your damage and those procs give you something else to work with. We will have to see how the damage holds up.' }
        ]
      },
      {
        id: 'holy', name: 'Holy', role: 'Healer',
        roles: ['healer'], range: 'ranged', pet: 0, complexity: 2, support: 3, solo: 1, themes: ['holy'],
        intro: [
          'The Holy Priest answers suffering with the Light, tending to a single grievous wound or reaching across a party with healing prayer and mending. This is a dedicated healing specialization, offering a broad collection of spells for the many dangers an adventuring company will face.'
        ],
        changes: [
          { term: 'Prayer of Mending', text: 'The new capstone. A reactive heal that triggers when its target takes damage and then jumps to another party or raid member.' },
          { term: 'Binding Heal', text: 'Heals yourself and somebody else with the same cast. When you and your tank are both getting beat up, that gives you a way to help both of you at once.' },
          { term: 'Litany of Light', text: 'Rewards you for changing which healing spell you use. If your previous heal was a different spell, you recover mana equal to 5% of the base mana cost of the spell you just cast.' },
          { term: 'Spirit of Redemption', text: 'Now lasts 15 seconds instead of ten, giving you another five seconds to keep healing after you die. Hopefully you won\'t need it, but when a pull goes wrong, those extra seconds can matter.' }
        ]
      }
    ],
    outro: [
      'The Priest\'s place in an adventuring company is earned through judgement. A shield before a crushing blow, a prayer that keeps the wounded standing, or a Shadow spell that finally breaks an enemy can decide the fate of the group.',
      'For those drawn to the responsibility of healing or the patient assault of Shadow magic, the Priest offers a calling worth mastering. Your armor may be cloth, but your companions will come to know the strength of the one wearing it.'
    ]
  },

  {
    id: 'hunter',
    name: 'Hunter',
    color: '#ABD473',
    text: '#B9DC8A',
    pitch: 'Masters of the wild who track, trap and fight with a trusted beast beside them.',
    summary: 'From an early age, the call of the wild draws some adventurers from the comfort of their homes into the unforgiving primal world outside. Those who endure eventually become hunters. Masters of their environment, they are able to slip like ghosts through the trees and lay traps in the path of their enemies.',
    idealPlayer: [
      'The Hunter suits adventurers who prefer to choose their ground and control the encounter. Scouting ahead, preparing a trap, and directing an animal companion reward those who enjoy entering a fight with a plan.',
      'It appeals to independent players who find satisfaction in exploring dangerous territory with a trusted beast beside them. Whether firing from a distant ridge or meeting prey at close quarters, the Hunter rewards awareness of the land and everything moving across it.'
    ],
    strengths: [
      { lead: 'Independence in the wild', text: 'An animal companion can hold an enemy\'s attention while you attack, giving you a valuable partner for questing and difficult encounters away from a group.' },
      { lead: 'Control and scouting tools', text: 'Traps, tracking, and slowing effects help you locate enemies, separate threats, and keep a dangerous foe from reaching your companions.' },
      { lead: 'Several ways to manage danger', text: 'Your pet can engage first, while Feign Death gives you a way to shed unwanted attention when a fight turns against you.' }
    ],
    weaknesses: [
      { lead: 'Careful positioning', text: 'The deadzone remains, so ranged Hunters must watch their distance and respond quickly when an enemy gets too close.' },
      { lead: 'Your pet is a responsibility', text: 'Managing its health, movement, and target matters, especially in crowded dungeons where a wandering pet can draw unwanted enemies.' },
      { lead: 'Preparation and resources', text: 'Ammunition, pet care, and mana all require attention, and a long fight can leave you short of the tools that made the opening attack so effective.' }
    ],
    changes: [
      { term: 'Aimed Shot', text: 'Now baseline, so you no longer need to invest into Marksmanship to pick it up.' },
      { term: 'Pets', text: 'Massively updated and drastically improved, so choosing a proper pet for your playstyle is critical.' },
      { term: 'The deadzone', text: 'Still there, so managing your distance is still something you will have to pay attention to.' }
    ],
    specs: [
      {
        id: 'beast-mastery', name: 'Beast Mastery', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 2, complexity: 1, support: 1, solo: 3, themes: ['beasts', 'nature'],
        intro: [
          'The Beast Master enters battle as one half of a hunting pair. This is a damage specialization centered on the bond between Hunter and beast, directing a companion\'s strength while adding attacks of your own.'
        ],
        changes: [
          { term: 'Deadly Aspects', text: 'On the first row, providing attack-speed support for both ranged gameplay through Aspect of the Hawk and melee gameplay through Aspect of the Beast. Even early in this tree, there is something for both types of hunter.' },
          { term: 'Hawks', text: 'You can send hawks at your target, which appear to function as damage-over-time effects lasting 18 seconds, with up to two active at once. They share a cooldown with Arcane Shot, so you will have to decide which ability to use.' },
          { term: 'Bestial Discipline', text: 'Now allows 50% of your mana regeneration to continue during combat, giving you another way to keep your damage going.' },
          { term: 'Intimidation and Bestial Wrath', text: 'Largely familiar. How well your actual pet scales is still going to be an important part of how this spec performs.' }
        ]
      },
      {
        id: 'marksmanship', name: 'Marksmanship', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 1, complexity: 2, support: 1, solo: 3, themes: ['nature'],
        intro: [
          'From a distant vantage, the Marksmanship Hunter is a lone wolf waiting for a clear shot. This is a ranged damage specialization built around powerful shots, rewarding the patience to establish distance and the judgement to know when you can safely stand and fire.'
        ],
        changes: [
          { term: 'Hawk Eye', text: 'Available earlier in the tree, making that extra range easier to pick up.' },
          { term: 'Careful Aim', text: 'Gives you attack power equal to 20% of your Intellect, so Intellect can now contribute to your damage alongside your mana pool.' },
          { term: 'Rapid Killing and Rapid Recuperation', text: 'Support your mana recovery and help you move from one kill into the next with less downtime. Particularly useful when you are out there leveling.' },
          { term: 'Lone Wolf', text: 'At the 11-point tier, 20% increased damage while you are without a pet. That opens up a pretty different way to play, and it is early enough that Survival can potentially pick it up as well.' },
          { term: 'Sniper Shot', text: 'The big new button. A four-second cast on a 15-second cooldown. Four seconds is a commitment. If you enjoy that slower gameplay of lining up a big shot from far away, that is clearly a direction this tree is supporting.' }
        ]
      },
      {
        id: 'survival', name: 'Survival', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 1, complexity: 2, support: 1, solo: 3, themes: ['beasts', 'nature'],
        intro: [
          'The Survival Hunter follows their quarry into striking distance, armed with blades, traps, and the instincts of a seasoned tracker. In Forever, this is a melee damage specialization, fighting close enough to exploit every opening.',
          'Survival is where the class changes the most, because this tree has been reworked around melee attacks, traps, and procs.'
        ],
        changes: [
          { term: 'Strider Kick', text: 'An instant attack dealing 100% melee damage on an eight-second cooldown, giving you a regular button to press while you are up close.' },
          { term: 'Expose Prey', text: 'The new 21-point talent gives your melee hits a 10% chance to proc a free Mongoose Bite.' },
          { term: 'Lacerating Strikes', text: 'The new capstone makes Mongoose Bite apply a bleed. Your melee attacks can give you a free Mongoose Bite, and that Mongoose Bite adds damage over time.' },
          { term: 'Predator\'s Edge', text: 'Increases melee critical-strike damage and offhand weapon damage, so there is clear support for dual wielding.' },
          { term: 'Traps and roots', text: 'Entrapment now roots targets hit by any trap for five seconds. Improved Wing Clip keeps its 20% root chance but costs three talent points instead of five. Surefooted reduces the duration of movement-impairing effects by 30%.' }
        ],
        unconfirmed: 'Skyy is almost positive that traps can be used in combat now, but this was not confirmed at the time of the guide.'
      }
    ],
    outro: [
      'The Hunter\'s craft begins before the first attack. Reading the terrain, choosing your prey, and knowing when to command your companion or spring a trap all shape the battle to come.',
      'Whether you master the bond with a beast, the patience of a marksman, or the close pursuit of Survival, success rewards preparation, positioning, and a watchful eye. For the adventurer who feels most at home beyond the safety of the city gates, the wilderness offers a worthy calling.'
    ]
  },

  {
    id: 'rogue',
    name: 'Rogue',
    color: '#FFF569',
    text: '#FFF569',
    pitch: 'Lethal assassins and masters of stealth who strike from behind and vanish back into the shadows.',
    summary: 'For rogues, the only code is the contract, and their honor is purchased in gold. Free from the constraints of a conscience, these mercenaries rely on brutal and efficient tactics. They are lethal assassins and masters of stealth who approach their marks from behind, piercing a vital organ and vanishing back into the shadows before the victim even hits the ground.',
    idealPlayer: [
      'The Rogue suits adventurers who prefer to strike on their own terms. Moving unseen, selecting an opening, and denying an enemy the chance to retaliate reward patience as much as aggression.',
      'It appeals to players who enjoy fighting at close quarters while keeping several tricks in reserve. Knowing when to interrupt, when to commit, and when to disappear is part of the craft.',
      'For those who find satisfaction in overcoming danger through timing and cunning, the Rogue offers much to master.'
    ],
    strengths: [
      { lead: 'Stealth and control', text: 'You can slip past unwanted encounters, approach a chosen target unseen, and use Sap or stuns to keep dangerous enemies out of the fight.' },
      { lead: 'Valuable disruption', text: 'Interrupts, poisons, and carefully timed crowd control can prevent a threatening spell or give your companions room to recover.' },
      { lead: 'Escape and defensive tools', text: 'Evasion, Sprint, and Vanish reward the judgement to use them before an opening becomes a trap.' }
    ],
    weaknesses: [
      { lead: 'Dependence on close range', text: 'Slows, roots, and enemies that keep their distance can prevent you from applying your damage.' },
      { lead: 'Limited recovery once wounded', text: 'Defensive abilities can buy time, but without reliable self-healing, prolonged fights and repeated damage can wear you down.' },
      { lead: 'Mistakes leave you exposed', text: 'Spending your energy too freely or using your escape tools too early can leave you without an answer when the fight turns against you.' }
    ],
    changes: [
      { term: 'Smooth energy', text: 'Energy now regenerates at a consistent rate instead of coming back in big ticks, so that energy bar fills more smoothly while you wait to use your next ability.' },
      { term: 'Combo points stay put', text: 'Combo points stay on your original target when you switch targets. If you need to swap over to kick somebody, you can come back without losing your points. Once you start generating combo points on the new target, the old ones disappear.' },
      { term: 'Axes', text: 'Rogues can now wield axes. Warrior players, you have some more competition when those things drop.' }
    ],
    specs: [
      {
        id: 'assassination', name: 'Assassination', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 3, support: 1, solo: 2, themes: ['stealth'],
        intro: [
          'The Assassination Rogue prepares death upon the edge of a dagger. This is a melee damage specialization centered on poisons and precise strikes, weakening and breaking a victim\'s defense with finishers until the killing blow arrives.'
        ],
        changes: [
          { term: 'Mutilate', text: 'This tree is leaning much harder into poison damage, and you are picking up Mutilate as another major attack for your dagger gameplay.' },
          { term: 'Venom', text: 'The new capstone, a finishing move that puts a debuff on your target, increasing your poison damage by 30% on them and making your poisons more likely to apply. Spending more combo points makes that debuff last longer.' },
          { term: 'Cold Blood', text: 'Moves up to the 16-point talent tier, making it easier to pick up, including for builds going deeper into another tree.' },
          { term: 'Expose Armor', text: 'Cheaper in both energy and combo points, so bringing that armor reduction costs you less of your resources.' },
          { term: 'Seal Fate and Puncturing Wounds', text: 'Seal Fate rewards critical hits from your combo-point builders with additional points, while the early Combat talent Puncturing Wounds adds crit chance to Backstab and Mutilate.' }
        ],
        take: 'It seems like Assassination is going to be a spinning-plates style of rogue, where you are trying to micromanage things like Expose Armor, Venom, Slice and Dice, and Rupture.'
      },
      {
        id: 'combat', name: 'Combat', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 1, support: 1, solo: 2, themes: ['stealth', 'steel'],
        intro: [
          'The Combat Rogue meets an opponent with drawn steel and the confidence of a practiced duelist. This is a melee damage specialization built for sustained fighting, going toe to toe with enemies, combining repeated weapon strikes with powerful bursts of aggression.'
        ],
        changes: [
          { term: 'Restless Blades', text: 'Your damaging finishing moves reduce the remaining cooldown on abilities like Adrenaline Rush and Blade Flurry, with more cooldown reduction for each combo point spent. Building points and spending them now brings your major damage cooldowns back sooner.' },
          { term: 'Cheaper builders matter', text: 'Something like Sinister Strike could let you work toward finishers more efficiently than a more expensive Backstab, which may push Combat toward swords, axes, and other weapon setups. We will have to see where the builds land.' }
        ],
        take: 'This is the same exact design as it is in retail World of Warcraft, and I\'m not going to lie, it can make Combat Rogue an absolute powerhouse in high-end content.'
      },
      {
        id: 'subtlety', name: 'Subtlety', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 3, support: 1, solo: 2, themes: ['stealth', 'shadow'],
        intro: [
          'The Subtlety Rogue approaches unseen, studying an enemy for the moment their guard falters. This is a melee damage specialization that rewards preparation and sudden opportunity, pairing attacks from the shadows with bleeds and carefully placed strikes.'
        ],
        changes: [
          { term: 'Thousand Cuts', text: 'The new capstone. Rupture ticks reduce the energy cost of your next Hemorrhage or Backstab, stacking up to five times. Keeping your bleed going helps you afford the attacks you use to build more combo points.' },
          { term: 'Hemorrhage', text: 'Also increases Rupture damage, giving those abilities another reason to work together, even if you are building around daggers.' },
          { term: 'Cutthroat', text: 'A deep Subtlety talent giving Backstab a 15% chance to let you use Ambush without being stealthed, within the next ten seconds. Improved Ambush also moves earlier in the tree.' },
          { term: 'Premeditation', text: 'Moves to the 21-point talent tier. Combined with Cold Blood moving earlier in Assassination, you can now pick up both and still have points left to spend elsewhere.' }
        ],
        take: 'Man, Cutthroat is a pretty fun proc to look out for. You are fighting somebody, using Backstab, and suddenly you have an opportunity to throw an Ambush into the fight without having to restealth. Sub has some interesting choices here, especially for PvP.'
      }
    ],
    outro: [
      'The Rogue survives by choosing the moment. A quiet approach, an interrupted spell, or a finishing blow delivered before the enemy can recover can decide a battle that strength alone would never win.',
      'Whether you favor poisoned daggers, the relentless steel of Combat, or the calculated openings of Subtlety, mastery demands patience, precision, and the nerve to act. For the adventurer who sees opportunity where others see danger, there is always another way past the guard.'
    ]
  },

  {
    id: 'mage',
    name: 'Mage',
    color: '#69CCF0',
    text: '#7DD3F2',
    pitch: 'Arcane, Frost and Fire. Fragile in cloth, but absolutely deadly from afar.',
    summary: 'Mages are gifted with a keen intellect and unwavering discipline. The arcane magic available to the magi is both great and dangerous, and thus is revealed only to the most devoted practitioners. Magi wear only cloth armor, but arcane shields and enchantments give them additional protection. Using a wide variety of Arcane, Frost and Fire magic, they may be fragile, but they are absolutely deadly from afar.',
    idealPlayer: [
      'The Mage suits adventurers who enjoy commanding a battle from a distance. Choosing where to stand, keeping enemies at bay, and finding an opening for a powerful spell reward a quick mind and careful preparation.',
      'It appeals to players who enjoy having a spell for the problem before them, whether that means transforming a dangerous foe into a harmless sheep or freezing pursuers long enough to escape.',
      'For those drawn to destructive magic and the challenge of surviving through their own judgement, the Mage offers three distinct disciplines to master.'
    ],
    strengths: [
      { lead: 'Battlefield control', text: 'Polymorph, roots, and slowing effects let you separate enemies and give your party room to fight on favorable terms.' },
      { lead: 'Damage against groups', text: 'When enemies are gathered safely, your area spells can punish several targets at once, while your control helps keep them at a distance.' },
      { lead: 'Adventuring conveniences', text: 'Conjured food and water help companions recover, while portals spare your group long journeys between distant cities.' }
    ],
    weaknesses: [
      { lead: 'Little protection when caught', text: 'Cloth armor leaves you vulnerable to physical attacks, making distance and timely defensive spells essential.' },
      { lead: 'Dependent on mana and room to cast', text: 'Prolonged fighting can drain your reserves, while movement and interrupts can delay the spells you need most.' },
      { lead: 'Control requires care', text: 'Damage can break Polymorph, and careless area attacks can draw unwanted enemies. Your strongest tools demand awareness of what the rest of your party is doing.' }
    ],
    changes: [
      { term: 'Frostfire Bolt', text: 'Now a baseline spell, giving every mage another option to work with, which can create some crazy builds mixing Frost and Fire talents.' },
      { term: 'New races', text: 'Orcs and Alliance Skyborne can now be mages, so you have some new choices when creating your character.' },
      { term: 'A mage profession', text: 'Mages have their own specific profession that has you decipher scrolls, for a deep thematic style of gameplay.' }
    ],
    specs: [
      {
        id: 'arcane', name: 'Arcane', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 0, complexity: 2, support: 2, solo: 2, themes: ['arcane'],
        intro: [
          'The Arcane Mage draws upon raw magical power, gathering strength with each spell until it is ready to be unleashed. This is a ranged damage specialization built around escalating power and careful mana use, where pressing the attack carries an increasing cost.'
        ],
        changes: [
          { term: 'Arcane Blast', text: 'On the third row. Arcane mages rejoice, you actually have an ability to cast! Casting it builds an effect that increases the damage of your other spells, but also increases the mana cost of Arcane Blast itself. That stacks up to four times and lasts until you cast a different spell.' },
          { term: 'Missile Barrage', text: 'Gives Arcane Blast a 40% chance to make your next Arcane Missiles free and channel twice as quickly. You build up with Arcane Blast, look for that proc, then put the extra damage into a much faster, free Arcane Missiles.' },
          { term: 'The decision', text: 'If you keep casting Blast without getting the proc, that mana cost starts becoming a problem. Do you try again, or cast something else to clear those stacks before you burn through too much mana?' },
          { term: 'Range and hit', text: 'Arcane gets an additional six yards of range through talents, while Arcane Focus now grants spell hit directly. With Blast and Missile Barrage fairly early in the tree, there is room to experiment in hybrid builds too.' }
        ]
      },
      {
        id: 'fire', name: 'Fire', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 0, complexity: 2, support: 2, solo: 2, themes: ['arcane'],
        intro: [
          'The Fire Mage meets opposition with an incantation and a rising blaze. This is a ranged damage specialization that turns critical strikes into opportunities, building toward faster Pyroblasts as flames consume the enemy.'
        ],
        changes: [
          { term: 'Hot Streak', text: 'Works a little differently from the instant Pyroblasts you might be familiar with. Critical hits from Fireball, Frostfire Bolt, Fire Blast, and Scorch reduce Pyroblast\'s cast time by 25%, stacking up to three times. At full stacks, that is a 75% shorter Pyroblast cast.' },
          { term: 'Wake of Fire', text: 'Rewards you for finishing an enemy with Fire Blast by reducing its cooldown and increasing the critical-strike chance of your next Fire Blast. A reason to think about how you finish a target, especially when leveling.' },
          { term: 'Combustion', text: 'Now lasts until you land four critical strikes instead of three, giving you another crit before the effect ends.' }
        ]
      },
      {
        id: 'frost', name: 'Frost', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 0, complexity: 1, support: 2, solo: 3, themes: ['arcane'],
        intro: [
          'The Frost Mage turns the ground before them into a slow and perilous approach. This is a ranged damage specialization combining ice magic with control, hindering enemies while striking at those caught in the cold.'
        ],
        changes: [
          { term: 'Ice Lance and Fingers of Frost', text: 'Another instant damage spell, and procs that let you take advantage of frozen-target interactions. Ice Lance gives you an option to deal damage while moving as well.' },
          { term: 'Cold Snap', text: 'Moves down to the 21-point talent tier, so Fire and Arcane builds need a bigger investment if they want to pick it up.' },
          { term: 'Improved Blizzard', text: 'Its slow drops from 65% to 45%. With Permafrost included, that takes the maximum slow from 75% down to 55%. Enemies move through your Blizzard faster, so you will have less room for error when kiting a big pack.' },
          { term: 'Fire and Frost hybrids', text: 'There is potential in combining Hot Streak\'s faster Pyroblasts with Fingers of Frost and Ice Lance, especially for PvP. We will have to see how those builds come together.' }
        ]
      }
    ],
    outro: [
      'A Mage\'s strength lies in knowing what to cast before danger closes the distance. An enemy held in place, a spell interrupted, or a clear opening for a devastating attack can spare your party a costly struggle.',
      'Whether drawn to Arcane\'s measured expenditure, Fire\'s gathering fury, or Frost\'s command of the battlefield, mastery demands positioning, timing, and respect for the power at your disposal. For the adventurer willing to study its disciplines, magic offers an answer to even the most imposing foe.'
    ]
  },

  {
    id: 'warlock',
    name: 'Warlock',
    color: '#9482C9',
    text: '#B3A5DC',
    pitch: 'Where most heroes see death in demonic power, warlocks only see opportunity.',
    summary: 'In the face of demonic power, most heroes see death. Warlocks only see opportunity. Dominance is their aim, and they have found a path to it in the dark arts. These voracious spellcasters summon demonic minions to fight beside them and toss out dark magic to deal massive damage through shadow, chaos, and fire. Their demonic pets protect and enhance them, and their cunning allows their minions to take the brunt of enemy attacks in order to save their own skin.',
    idealPlayer: [
      'The Warlock suits adventurers drawn to power that demands careful management. Afflictions, summoned demons, and the exchange of health for mana give you several resources to command at once.',
      'It appeals to players who enjoy preparing an enemy\'s downfall, whether through lingering curses, a demon\'s assistance, or destructive spells cast from afar.',
      'For those willing to watch both their own reserves and the suffering of their foes, the Warlock offers a dark and resourceful path.'
    ],
    strengths: [
      { lead: 'Sustained damage and recovery', text: 'Lingering damage effects keep working between casts, while Life Tap and draining spells help you replenish the resources needed to continue fighting.' },
      { lead: 'Valuable party support', text: 'Healthstones offer emergency healing, Soulstones prepare for a fallen companion\'s return, and summoning helps bring your company together before the adventure begins.' },
      { lead: 'Demons and disruptive magic', text: 'Your chosen demon can help absorb attacks or hinder spellcasters, while Fear and curses weaken enemies and interfere with their plans.' }
    ],
    weaknesses: [
      { lead: 'Limited mobility', text: 'Finding safe ground before you begin casting matters, particularly when enemies can close the distance quickly.' },
      { lead: 'Competing demands on resources', text: 'Life Tap restores mana at the cost of health, so using it carelessly can leave you vulnerable or place another burden on your healer.' },
      { lead: 'Demons and control need attention', text: 'A poorly directed pet or fleeing enemy can draw additional foes into battle. Managing these tools is part of protecting the party as well as dealing damage.' }
    ],
    changes: [
      { term: 'Banes', text: 'Curse of Agony and Curse of Doom are now Bane of Agony and Bane of Doom. You can put Curse of the Elements on something and still use Agony for your own damage. Helping the group with your curse no longer means giving up that damage-over-time effect.' },
      { term: 'DoTs can crit', text: 'Critical-strike chance has another way to contribute to your damage.' },
      { term: 'Demonic Sacrifice', text: 'Moves up to the 11-point talent tier, making it accessible to both Affliction and Destruction while still letting you reach their capstones.' }
    ],
    specs: [
      {
        id: 'affliction', name: 'Affliction', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 1, complexity: 2, support: 2, solo: 3, themes: ['shadow'],
        intro: [
          'The Affliction Warlock condemns an enemy to a lingering decline, laying harmful magic upon them before draining what strength remains. This is a ranged damage specialization centered on damage over time and channeled spells, allowing several afflictions to work together upon a victim.',
          'You maintain your damage effects and follow them with draining magic, judging which enemies will live long enough to suffer their full duration. In a party, you must balance spreading your afflictions with finishing the target that poses the greatest threat.'
        ],
        changes: [
          { term: 'Drains', text: 'There is more talent support for your channeled spells, including Drain Life, Drain Soul, and the new capstone, Drain Hope.' },
          { term: 'Drain Hope', text: 'Increases the Shadow damage from your other DoTs on that target, so there is a direct connection between setting up your damage-over-time effects and following them with your channel.' },
          { term: 'Siphon Life with Soul Link', text: 'Soul Link moves up to the 21-point tier in Demonology, so you can now reach both in the same build. Anybody who remembers that combination knows why people are already looking at it for PvP. We will have to see how durable it actually ends up being.' }
        ]
      },
      {
        id: 'demonology', name: 'Demonology', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 2, complexity: 2, support: 2, solo: 3, themes: ['shadow'],
        intro: [
          'The Demonology Warlock studies the creatures they summon as carefully as the spells they wield. This is a damage specialization built around demonic power, combining your own magic with the strengths of a chosen servant.',
          'You choose the demon and sacrifice benefit that serve the encounter, then direct your companion while casting alongside it. Watch its health, control its target, and make use of its particular abilities. Your effectiveness depends on commanding both halves of that partnership.'
        ],
        changes: [
          { term: 'Demonic Pact', text: 'The new capstone lets you keep the passive benefit from Demonic Sacrifice while having another demon summoned. You could sacrifice a Succubus for its benefit, then bring out a Voidwalker to fight alongside you.' },
          { term: 'Demonic Brand', text: 'A 16-point talent that reduces the threat generated by Searing Pain while making your pet\'s next two hits against that target deal increased damage and threat. Casting Searing Pain helps your demon hold the enemy\'s attention.' },
          { term: 'Voidwalker tanking', text: 'There is potential to experiment with a Voidwalker taking hits in a dungeon, but we would need to see how its survivability and threat actually hold up before calling it a reliable tank.' }
        ]
      },
      {
        id: 'destruction', name: 'Destruction', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 1, complexity: 1, support: 2, solo: 2, themes: ['shadow', 'arcane'],
        intro: [
          'The Destruction Warlock calls upon fire and Shadow to bring an enemy to ruin. This is a ranged damage specialization focused on direct spellcasting, combining burning afflictions with forceful attacks that follow them.',
          'You keep Immolate burning while delivering your heavier spells, finding openings to cast without drawing the enemy away from your defender. When several foes are present, a carefully placed Bane of Havoc lets your assault upon one carry damage to another.'
        ],
        changes: [
          { term: 'Incinerate', text: 'Another Fire spell to work into your damage.' },
          { term: 'Shadow and Flame', text: 'Deeper in the tree, this changes two of your existing abilities. Conflagrate no longer consumes Immolate, and Shadowburn always refunds its Soul Shard. It still costs mana, but you are getting that shard back.' },
          { term: 'Bane of Havoc', text: 'Marks one target for up to five minutes, causing it to take 15% of the damage you deal to other targets. Imagine a dungeon pull with one big elite surrounded by smaller enemies. You put Havoc on the elite, then damage the adds, and some of that damage also goes into the enemy you marked.' }
        ]
      }
    ],
    outro: [
      'The Warlock carries dangerous knowledge into every battle. A demon must be commanded, an affliction maintained, and each measure of health or mana spent with purpose.',
      'Whether you favor Affliction\'s lingering torment, Demonology\'s summoned servants, or Destruction\'s consuming fire, mastery rests upon controlling the power you have called forth. For the adventurer willing to bear its cost, the dark arts offer a formidable answer to the dangers of Azeroth.'
    ]
  },

  {
    id: 'warrior',
    name: 'Warrior',
    color: '#C79C6E',
    text: '#D4AE85',
    pitch: 'Strength, leadership and a vast knowledge of arms and armor. Hold the front line or unleash your rage.',
    summary: 'For as long as war has raged, heroes from every race have aimed to master the art of battle. Warriors combine strength, leadership, and a vast knowledge of arms and armor to wreak havoc in glorious combat. Some protect the front lines with shields, and others forgo the shield and unleash their rage at the closest threat with a variety of deadly weapons and attacks.',
    idealPlayer: [
      'The Warrior suits adventurers who want to meet danger at the front of the battle. Choosing when to charge, how to spend your rage, and when to raise a shield rewards a decisive player.',
      'It appeals to those who enjoy mastering weapons and making each new piece of equipment count. Whether protecting companions or pressing an attack, you must stay within reach of the enemy and respond to the fight around you.',
      'For those drawn to martial skill and the responsibility of standing where the blows fall, the Warrior offers a demanding path.'
    ],
    strengths: [
      { lead: 'Command of close combat', text: 'Weapon attacks, interrupts, and the ability to switch stances give you several ways to pressure an enemy or answer a threat.' },
      { lead: 'Frontline support', text: 'Shouts strengthen your companions or weaken nearby foes, while your tanking tools let you take responsibility for holding enemies away from the party.' },
      { lead: 'Rage as your resource', text: 'Fighting helps fuel your next action. Generating and spending it well allows you to sustain your assault without relying on a mana pool.' }
    ],
    weaknesses: [
      { lead: 'Dependence on equipment', text: 'Your weapon has a major influence on your damage, while appropriate armor and defensive gear matter when you are taking the hits.' },
      { lead: 'You need access to your target', text: 'Roots, slows, and enemies that keep their distance can interrupt your pressure, even with tools to close the gap.' },
      { lead: 'Recovery between fights', text: 'Armor helps you endure punishment, but healing support, food, and bandages remain important when repeated battles wear you down.' }
    ],
    changes: [
      { term: 'Victory Rush', text: 'Now baseline, so you are getting another attack to use after a kill.' },
      { term: 'Tactical Mastery', text: 'Now baseline, so you no longer need to spend talent points just to retain some rage when switching stances. A nice starting point for a class where managing your rage and moving between stances is such a big part of what you are doing.' }
    ],
    specs: [
      {
        id: 'arms', name: 'Arms', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 2, support: 1, solo: 2, themes: ['steel'],
        intro: [
          'The Arms Warrior carries a heavy weapon with the discipline of a practiced soldier. This is a melee damage specialization built around deliberate, powerful strikes, exploiting openings with Mortal Strike, Overpower, and carefully timed Slams.',
          'You make each swing and measure of rage count. Watch for an opportunity to Overpower, fit your attacks between weapon swings, and stay close enough to keep the enemy under pressure. In a party, your weapon serves alongside your ability to interrupt and hinder a dangerous foe.'
        ],
        changes: [
          { term: 'Spearing Strike', text: 'Deals increased damage against Giants, Dragonkin, and mounted targets, while also dismounting mounted enemies. If somebody is trying to ride away from you in the open world, you have an actual button to knock them off their mount.' },
          { term: 'Weaponmaster', text: 'Your weapon-specialization talents get combined, so changing weapon types doesn\'t mean having to respec just to get the appropriate weapon bonus.' },
          { term: 'Bloodthrill', text: 'Gives your melee attacks a chance to activate Overpower for a few seconds. Improved Overpower is available on the second row, so you can invest in making those extra Overpowers more threatening.' },
          { term: 'Improved Slam', text: 'Moves into deep Arms, reducing Slam\'s cast time and global cooldown by half a second, while making it no longer interrupt your melee swing timer. You can work Slam between your attacks without pushing back your next auto attack.' }
        ]
      },
      {
        id: 'fury', name: 'Fury', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 1, support: 1, solo: 2, themes: ['steel'],
        intro: [
          'The Fury Warrior enters the fray with a weapon in each hand, turning the exchange of blows into a relentless assault. This is a melee damage specialization driven by repeated attacks and rage generation, rewarding continued contact with the enemy.',
          'You build rage through your strikes and spend it to maintain the offensive. Keep Bloodthirst and your other attacks working, watch for opportunities to strike several foes, and avoid spending so freely that your next important ability must wait.'
        ],
        changes: [
          { term: 'Dual Wield Specialization', text: 'Now doubles your offhand rage generation and adds 10% hit chance to offhand attacks, while Precision adds another 3% hit chance. More reliable offhand hits feeding you more rage could make a real difference.' },
          { term: 'Boundless Rage', text: 'Increases your maximum rage by 30, so you have more room to pool resources before spending them.' },
          { term: 'Raging Blows', text: 'Makes Whirlwind strike with your offhand weapon as well and reduces Cleave\'s rage cost, improving how those abilities work against multiple enemies.' },
          { term: 'Mobility', text: 'Bloodthirst trades its old healing effect for a 10% movement-speed increase, and Improved Berserker Rage clears movement-impairing effects. Iron Will also moves into Fury, reducing stun and fear durations by 15%.' },
          { term: 'Toned down', text: 'Flurry drops from 30% to 25% attack speed, and Bloodthirst has lower attack-power scaling. Enrage now has a 30% chance to trigger from any damaging attack you take, giving 10% increased physical damage for 12 seconds. Death Wish now increases damage taken by 5%, replacing its old armor and resistance penalty.' }
        ],
        take: 'There are changes pulling in both directions. The extra hit and rage generation are worth paying attention to, but we will need to see how everything adds up before calling Fury stronger or weaker overall.'
      },
      {
        id: 'protection', name: 'Protection', role: 'Tank',
        roles: ['tank'], range: 'melee', pet: 0, complexity: 2, support: 2, solo: 1, themes: ['steel'],
        intro: [
          'With shield braced and weapon ready, the Protection Warrior takes the ground their companions need to survive. This is the Warrior\'s tanking specialization, holding enemy attention and enduring the attacks directed at the frontline.',
          'You turn blocks and avoided blows into rage, then spend it to keep control of the fight. Position enemies away from vulnerable allies, recover those that break loose, and judge when a defensive cooldown is needed. Your healer depends on the time and stability your shield provides.'
        ],
        changes: [
          { term: 'Shield Specialization and Master of Defense', text: 'Shield Specialization now gives you five rage when you block instead of one, while Master of Defense gives you five rage when you dodge or parry with a shield equipped.' },
          { term: 'Focused Rage', text: 'Reduces the rage cost of your offensive abilities by three. You are getting more resources from defending yourself and spending less when you attack.' },
          { term: 'Vanguard', text: 'Allows you to Charge in Defensive Stance. Improved Thunder Clap also moves into the Protection tree.' },
          { term: 'Improved Revenge', text: 'Now increases its damage by 60%, although it loses the stun chance.' },
          { term: 'Cooldowns', text: 'Improved Disarm reduces Disarm\'s cooldown, while Improved Shield Wall takes ten minutes off Shield Wall\'s cooldown instead of extending its duration.' }
        ]
      }
    ],
    outro: [
      'The Warrior earns their place through steel, endurance, and decisions made within striking distance. A charge begins the engagement, a shield holds the line, and a well-timed attack can bring a hard fight to its end.',
      'Whether you favor the measured blows of Arms, the aggression of Fury, or the steadfast defense of Protection, mastery demands control of your rage and awareness of the battle around you. For the adventurer ready to stand at the front, there is a weapon to master and a company counting on you.'
    ]
  },

  {
    id: 'shaman',
    name: 'Shaman',
    color: '#0070DE',
    text: '#5AA9FF',
    pitch: 'Moderators among earth, fire, water and air, with totems that lift the whole party.',
    summary: 'Shamans are spiritual guides and practitioners, not of the divine, but of the very elements themselves. Unlike some other mystics, shamans commune with forces that are not strictly benevolent. The elements are chaotic, and left to their own devices they rage against one another in unending primal fury. It is the call of the shaman to bring balance to this chaos, acting as moderators among earth, fire, water, and air. Shamans summon totems that focus these elements to support themselves or their allies, and even punish those who threaten them.',
    idealPlayer: [
      'The Shaman suits adventurers who enjoy combining personal power with service to their companions. Choosing the right totems, interrupting a dangerous spell, and turning to healing when an ally falters reward awareness of the whole encounter.',
      'It appeals to players drawn to elemental magic, whether carried through a weapon, called down as lightning, or shaped into restorative waters.',
      'For those who enjoy having several duties within a party, the Shaman offers a calling where preparation and timely assistance matter alongside your chosen role.'
    ],
    strengths: [
      { lead: 'Group support through totems', text: 'Choosing the right set can strengthen your companions, help sustain their resources, or hinder enemies approaching your position.' },
      { lead: 'Disruption and emergency aid', text: 'Interrupts and Purge can deny an enemy its spells and magical advantages, while a timely heal can help a companion survive.' },
      { lead: 'Melee, ranged casting and healing', text: 'Each path uses the elements differently while retaining tools that benefit the party.' }
    ],
    weaknesses: [
      { lead: 'Totem placement', text: 'Your companions need to remain within reach of their benefits, and a moving battle can require you to reposition or replace them.' },
      { lead: 'Competing demands on mana', text: 'Attacking, healing, and maintaining support all draw upon your reserves, so answering every problem at once can leave you depleted.' },
      { lead: 'Changing roles takes preparation', text: 'Weapons, equipment, and talent choices that serve Enhancement will not fully support Elemental or Restoration. Performing each role well demands investment.' }
    ],
    changes: [
      { term: 'Totemic Projection and Totemic Recall', text: 'Both are added to the game and both are baseline, which helps shamans so much in Classic.' },
      { term: 'Fire Nova', text: 'No longer takes up its own totem, which is another nice update to how you use your abilities together.' },
      { term: 'Totem sets', text: 'You can drop four totems together through a three-second cast, with different totem sets for different situations. Anybody who has played Classic shaman knows how much setup goes into those things, so being able to put your set down together feels really nice.' }
    ],
    specs: [
      {
        id: 'elemental', name: 'Elemental', role: 'Ranged damage',
        roles: ['ranged'], range: 'ranged', pet: 0, complexity: 2, support: 3, solo: 2, themes: ['elements'],
        intro: [
          'The Elemental Shaman calls upon flame and thunder to strike enemies from afar, planting totems upon the ground from which they fight. This is a ranged damage specialization, bringing the force of the elements to bear while supporting nearby companions.',
          'You weave lightning and fire into your assault, finding room to cast and watching your mana as the battle continues. Between attacks, keep your totems within reach of the party and remain alert for a spell to interrupt or an enemy enchantment to purge.'
        ],
        changes: [
          { term: 'Lava Burst', text: 'Surprisingly, you are picking up Lava Burst, giving you another major damage spell to work into your rotation.' },
          { term: 'Lightning Overload', text: 'Gives your lightning spells a small chance to fire an additional cast.' },
          { term: 'Earthbind root', text: 'A talent allows Earthbind Totem to root enemies for five seconds, which is really nice crowd control for PvP or PvE.' },
          { term: 'Water Shield', text: 'Available with an 11-point investment into Restoration, so Elemental has a fairly accessible option for helping sustain its mana.' }
        ]
      },
      {
        id: 'enhancement', name: 'Enhancement', role: 'Melee damage',
        roles: ['melee'], range: 'melee', pet: 0, complexity: 2, support: 3, solo: 2, themes: ['elements', 'steel'],
        intro: [
          'With a heavy weapon imbued by the elements, the Enhancement Shaman carries the storm into close combat. This is a melee damage specialization built around two-handed strikes and Windfury, mixing physical blows with sudden bursts of elemental power.',
          'You follow your weapon strikes with Stormstrike and opportunities for instant lightning, watching for the effects your attacks build. Beside your party\'s frontline, keep your totems supporting the fight and enough awareness to interrupt an enemy or aid a wounded companion.'
        ],
        changes: [
          { term: 'Two-handers and Stormstrike', text: 'Two-handed weapons no longer require a talent investment. Stormstrike moves up to the 16-point talent tier, and it is on a short cooldown rather than 60 seconds now.' },
          { term: 'Maelstrom Weapon', text: 'Lets you build up stacks to reduce Lightning Bolt\'s cast time until it is instant.' },
          { term: 'Rage of the Farseer', text: 'The new capstone, a never-before-seen three-minute cooldown giving you 30% haste for 25 seconds. It is basically your own personal Bloodlust. As far as we have seen, there is no group-wide Bloodlust or Heroism here, so that haste is just for you.' },
          { term: 'Ghost Wolf', text: 'Works indoors, with an early Enhancement talent making it instant. A massive quality-of-life improvement for getting around and chasing people down.' },
          { term: 'Tanking tools', text: 'Spirit Weapons reduces your threat by 30% without Rockbiter and increases it by 30% with Rockbiter active. You can also talent into more dodge and stamina, while Improved Stormstrike provides mana regeneration for 15 seconds and lets dodges or parries reset Stormstrike\'s cooldown.' }
        ],
        take: 'Enhancement is one I actually played, and man, running around with a two-hander waiting for the Windfury slot machine was surprisingly fun. The two-handed Windfury gameplay is still very much there. It is not dual wield like it was in Season of Discovery.',
        unconfirmed: 'Enhancement has no taunt yet. Skyy is hoping it gets a taunt or a defensive before launch, so treat dungeon tanking as an experiment for now.'
      },
      {
        id: 'restoration', name: 'Restoration', role: 'Healer',
        roles: ['healer'], range: 'ranged', pet: 0, complexity: 2, support: 3, solo: 1, themes: ['elements'],
        intro: [
          'The Restoration Shaman calls upon restorative waters to sustain companions through the wear of battle. This is the Shaman\'s healing specialization, combining direct healing, lingering recovery, and totems that support the group.',
          'You watch how damage spreads through the party, choosing when one ally needs a focused heal and when Chain Heal can reach several wounded companions. Keep your mana tools working, place your totems where they can help, and hold a swift response for the moment steady healing is no longer enough.'
        ],
        changes: [
          { term: 'Riptide', text: 'An instant heal with healing over time attached.' },
          { term: 'Water Shield', text: 'You gain Water Shield for mana sustain.' },
          { term: 'Mana Tide Totem', text: 'Moves from the 31-point capstone to the 16-point tier. That is a substantially smaller investment to get access to an important mana tool, while Nature\'s Swiftness remains available as well.' }
        ]
      }
    ],
    outro: [
      'The Shaman brings the elements wherever their companions make a stand. A weapon carries the wind, lightning answers a distant threat, and healing waters restore those still fighting.',
      'Whether you follow Elemental, Enhancement, or Restoration, mastery lies in serving the needs of the battle while fulfilling your own role. For the adventurer who wants their presence felt in both the enemy\'s wounds and their companions\' strength, the elements await your call.'
    ]
  }
];

if (typeof module !== 'undefined') module.exports = { CLASSES };
