'use strict';

/* Leveling Preview content, one entry per spec: LEVELING[classId][specId]
   status:    'draft' until Ian or Skyy approve it
   abilities: key buttons (names as the game spells them)
   gameplay:  short "how it plays" points
   steps:     talent order for levels 10-30. points = talents added in this step
              (names must match data/talents/<class>.js). 21 points in total.   */

const LEVELING = {
  druid: {
    feral: {
      status: 'approved',
      abilities: ['Moonfire', 'Bear Form', 'Maul', 'Swipe', 'Demoralizing Roar', 'Rejuvenation'],
      gameplay: [
        'Levels 1 to 10: don\'t just spam Wrath. Open with Wrath and Moonfire, then weave auto attacks with Moonfire. Keep Mark of the Wild and Thorns up.',
        'From level 10, level in Bear Form. Pull with Moonfire, shift, and Maul whenever you have rage. Add Primal Bite once you have it.',
        'Heal between pulls. A Rejuvenation before you pull lets you chain several fights as a bear.',
        'On packs, Swipe hits 3 enemies and Demoralizing Roar weakens their attacks. Enrage gives you rage to open with.',
        'In dungeons, Growl taunts back anything that leaves you, and Faerie Fire strips a boss\'s armor for your whole group.',
        'Plenty of utility: Entangling Roots, Remove Curse, Abolish Poison, and Hibernate for beasts and dragons.'
      ],
      steps: [
        { text: '5 points in Ferocity: Maul, Swipe and Primal Bite cost 5 less rage.',
          points: { 'Ferocity': 5 } },
        { text: '2 points in Feral Swiftness for more dodge, and 3 in Feral Instinct for a harder-hitting Swipe.',
          points: { 'Feral Swiftness': 2, 'Feral Instinct': 3 } },
        { text: 'Feral Charge to close in and interrupt, then 2 points each in Savage Fury and Sharpened Claws for more damage and crit.',
          points: { 'Feral Charge': 1, 'Savage Fury': 2, 'Sharpened Claws': 2 } },
        { text: 'Primal Bite, 3 points in Predatory Strikes for more attack power, and 1 in Heart of the Wild.',
          points: { 'Primal Bite': 1, 'Predatory Strikes': 3, 'Heart of the Wild': 1 } },
        { text: 'Your level 30 point is Leader of the Pack: 3% more crit for you and your party.',
          points: { 'Leader of the Pack': 1 } }
      ]
    },
    restoration: {
      status: 'approved',
      abilities: ['Rejuvenation', 'Regrowth', 'Healing Touch', 'Swiftmend', "Nature's Swiftness", 'Abolish Poison'],
      gameplay: [
        'Most of the time, a Rejuvenation and a Regrowth on the tank keep them healthy.',
        'When someone else takes damage, give them a Regrowth or a Healing Touch.',
        'For a big heal, cast Healing Touch if you have time, or Swiftmend when you need it instantly.',
        "In an emergency, Nature's Swiftness into an instant Healing Touch, then Swiftmend, lands a huge heal in about a second.",
        'Use the cheapest heal that does the job, and carry Mana Potions for hard fights.',
        'Plenty of utility: Entangling Roots, Faerie Fire, Remove Curse, Abolish Poison, Thorns and Hibernate.'
      ],
      steps: [
        { text: "5 points in Nature's Focus so taking damage doesn't interrupt your heals.",
          points: { "Nature's Focus": 5 } },
        { text: '5 points in Naturalist for a faster Healing Touch.',
          points: { 'Naturalist': 5 } },
        { text: '5 points in Gift of Nature: all your heals are 10% stronger.',
          points: { 'Gift of Nature': 5 } },
        { text: 'Swiftmend and Gift of the Earthmother, then 3 points in Reflection to keep regenerating mana while you cast.',
          points: { 'Swiftmend': 1, 'Gift of the Earthmother': 1, 'Reflection': 3 } },
        { text: "Your level 30 point is Nature's Swiftness: an instant heal when things go wrong.",
          points: { "Nature's Swiftness": 1 } }
      ]
    },
    balance: {
      status: 'approved',
      abilities: ['Wrath', 'Moonfire', 'Insect Swarm', 'Starfire', 'Entangling Roots', 'Faerie Fire'],
      gameplay: [
        'Open with Wrath, or with Starfire for more damage at a higher mana cost.',
        'Get Moonfire and Insect Swarm ticking, then cast Wrath until the enemy drops.',
        'If something reaches you, root it with Entangling Roots and back off, or stand your ground and keep casting.',
        'Your damage over time costs a lot of mana. On weaker enemies, casting only Wrath is cheaper and fast enough.',
        'Plenty of utility: Faerie Fire on bosses, Remove Curse and Abolish Poison for the group, Thorns on your tank, and Hibernate for beasts and dragons.'
      ],
      steps: [
        { text: '5 points in Improved Wrath for a faster Wrath at half the mana cost.',
          points: { 'Improved Wrath': 5 } },
        { text: '2 points in Nature\'s Majesty for more crit, and 3 in Moonglow for cheaper damage spells.',
          points: { 'Nature\'s Majesty': 2, 'Moonglow': 3 } },
        { text: 'Nature\'s Splendor for longer Moonfire, then 2 points each in Improved Moonfire and Nature\'s Reach for more range and hit.',
          points: { 'Nature\'s Splendor': 1, 'Improved Moonfire': 2, 'Nature\'s Reach': 2 } },
        { text: 'Insect Swarm, then 4 points in Vengeance for much bigger crits.',
          points: { 'Insect Swarm': 1, 'Vengeance': 4 } },
        { text: 'Your level 30 point is Nature\'s Grace, a big power spike: spell crits speed up your casting.',
          points: { 'Nature\'s Grace': 1 } }
      ]
    }
  },
  hunter: {
    'beast-mastery': {
      status: 'approved',
      abilities: ['Auto Shot', 'Summon Hawk', 'Multi-Shot', 'Serpent Sting', 'Raptor Strike', 'Intimidation'],
      gameplay: [
        'Send your pet in first. A Boar is a great early pet: its Charge gets it into the fight fast and holds threat.',
        "Put Hunter's Mark on the target and shoot from max range with Serpent Sting and Aimed Shot, plus Multi-Shot from 18.",
        'Once you have Summon Hawk, keep 2 hawks on the target: each lasts 18 sec and you can send another every 6 sec.',
        'Summon Hawk shares a cooldown with Arcane Shot, so only fit Arcane Shot in when both hawks are already up.',
        'At 30, Intimidation stuns the target and gives your pet a burst of threat.',
        'If something reaches you, finish it in melee with Raptor Strike and Mongoose Bite.'
      ],
      steps: [
        { text: '5 points in Deadly Aspects: with Aspect of the Hawk up, Auto Shot can trigger a burst of attack speed.',
          points: { 'Deadly Aspects': 5 } },
        { text: '2 points each in Focused Fire for more damage, Pathfinding for a faster Aspect of the Cheetah, and Improved Revive Pet for quick, cheap revives.',
          points: { 'Focused Fire': 2, 'Pathfinding': 2, 'Improved Revive Pet': 2 } },
        { text: '5 points in Unleashed Fury so your pet and hawks hit harder, then 1 in Bestial Swiftness to get your pet into fights faster.',
          points: { 'Unleashed Fury': 5, 'Bestial Swiftness': 1 } },
        { text: 'Summon Hawk, then 2 points in Ferocity for more pet and hawk crit.',
          points: { 'Summon Hawk': 1, 'Ferocity': 2 } },
        { text: 'Your level 30 point is Intimidation.',
          points: { 'Intimidation': 1 } }
      ]
    },
    survival: {
      status: 'approved',
      abilities: ['Raptor Strike', 'Mongoose Bite', 'Strider Kick', 'Counterattack', 'Aimed Shot', 'Serpent Sting'],
      gameplay: [
        'Keep the right tracking on: Improved Tracking adds 5% damage against the tracked creature type. Beasts, Humanoids and Undead cover most early enemies.',
        "Send your pet in, put Hunter's Mark on the target, and open from range with Aimed Shot, Serpent Sting or Arcane Shot.",
        'Let the enemy come to you, then fight in melee with Raptor Strike and Strider Kick.',
        'Mongoose Bite opens up after you dodge and Counterattack after you parry. Deflection makes parries common, so watch for both.',
        'Deterrence adds 25% dodge and parry for 10 sec, feeding both. It has a 5 min cooldown, so save it for a bad pull.',
        "A slow two-hander usually hits hardest, but Predator's Edge makes dual wielding worth a try."
      ],
      steps: [
        { text: "5 points in Improved Tracking: 5% more damage to whatever creature type you're tracking.",
          points: { 'Improved Tracking': 5 } },
        { text: '2 points in Savage Strikes for more melee crit, and 3 in Deflection for more parries.',
          points: { 'Savage Strikes': 2, 'Deflection': 3 } },
        { text: '3 points in Surefooted, then Deterrence and one more point in Deflection.',
          points: { 'Surefooted': 3, 'Deterrence': 1, 'Deflection': 1 } },
        { text: "Counterattack, then 4 points in Predator's Edge for bigger melee crits and a stronger off-hand.",
          points: { 'Counterattack': 1, "Predator's Edge": 4 } },
        { text: 'Your level 30 point is Strider Kick: a hard-hitting kick that also speeds you up.',
          points: { 'Strider Kick': 1 } }
      ]
    },
    marksmanship: {
      status: 'approved',
      abilities: ['Auto Shot', 'Serpent Sting', 'Arcane Shot', 'Aimed Shot', 'Multi-Shot', "Hunter's Mark"],
      gameplay: [
        'Send your pet in first. A Boar is a great early pet: its Charge gets it into the fight fast and holds threat.',
        "Put Hunter's Mark on the target and start shooting from max range.",
        'Open with Serpent Sting, then weave Arcane Shot and Aimed Shot between Auto Shots. Add Multi-Shot at 18.',
        'Enemies that die with your Serpent Sting on them trigger Rapid Killing: your next shot hits 20% harder.',
        'If something reaches you, finish it in melee with Raptor Strike and Mongoose Bite.'
      ],
      steps: [
        { text: '3 points in Hawk Eye for 6 more yards of range, then 5 in Lethal Attacks for more crit.',
          points: { 'Hawk Eye': 3, 'Lethal Attacks': 5 } },
        { text: '5 points in Careful Aim: your Intellect adds to your attack power.',
          points: { 'Careful Aim': 5 } },
        { text: '2 points in Rapid Killing so kills make your next shot hit harder.',
          points: { 'Rapid Killing': 2 } },
        { text: 'Trueshot Aura for more ranged attack power across your party.',
          points: { 'Trueshot Aura': 1 } },
        { text: 'Your last 5 points, up to level 30, go into Mortal Shots for bigger ranged crits.',
          points: { 'Mortal Shots': 5 } }
      ]
    }
  },
  mage: {
    arcane: {
      status: 'approved',
      abilities: ['Arcane Blast', 'Arcane Missiles', 'Presence of Mind', 'Frostbolt', 'Blink', 'Frost Nova'],
      gameplay: [
        'Until 20, cast Frostbolt and Fireball: your early Arcane talents make you harder to interrupt and give you free casts.',
        'From 20, open with Arcane Blast and keep casting it. From 25, each Arcane Blast can proc Missile Barrage.',
        'On a proc, cast Arcane Missiles: it is free and fires twice as fast. Then back to Arcane Blast.',
        'With Improved Channeling, damage almost never interrupts you, so you can usually stand your ground instead of kiting.',
        'Worried about taking hits? Open with a rank 1 Frostbolt to slow the enemy. At 30, Presence of Mind gives you an instant Arcane Blast to finish a target.'
      ],
      steps: [
        { text: "5 points in Improved Channeling so damage can't interrupt your casts.",
          points: { 'Improved Channeling': 5 } },
        { text: '5 points in Arcane Concentration for free casts.',
          points: { 'Arcane Concentration': 5 } },
        { text: 'Arcane Blast, then 2 points each in Arcane Focus for more hit and Arcane Impact for more crit.',
          points: { 'Arcane Blast': 1, 'Arcane Focus': 2, 'Arcane Impact': 2 } },
        { text: 'Missile Barrage, then 3 points in Arcane Meditation to keep regenerating mana while you cast, and the last point of Arcane Impact.',
          points: { 'Missile Barrage': 1, 'Arcane Meditation': 3, 'Arcane Impact': 1 } },
        { text: 'Your level 30 point is Presence of Mind: your next spell is instant.',
          points: { 'Presence of Mind': 1 } }
      ]
    },
    fire: {
      status: 'approved',
      abilities: ['Fireball', 'Scorch', 'Pyroblast', 'Blast Wave', 'Frostbolt', 'Fire Blast'],
      gameplay: [
        'Early on, open with Frostbolt to slow the enemy, then finish with Fireball. With Flame Throwing, you can open with Fireball from max range and follow with a rank 1 Frostbolt.',
        'Once Ignite is up, your crits keep burning, and you can often kill enemies before they reach you.',
        'From 26, open with Fireball, then cast Scorch: it is your fastest spell, and each one stacks more fire damage onto the target.',
        'Your crits build Hot Streak. At 3 stacks, Pyroblast casts 75% faster: fire it off for your biggest hit.',
        'At 30, Blast Wave hits every enemy around you and slows them. It shines in dungeons and on packs.'
      ],
      steps: [
        { text: '5 points in Improved Fireball for a faster Fireball.',
          points: { 'Improved Fireball': 5 } },
        { text: '2 points in Flame Throwing for 6 yards more range, then 5 in Ignite: your fire crits keep burning.',
          points: { 'Flame Throwing': 2, 'Ignite': 5 } },
        { text: '2 points in Burning Soul so damage doesn\'t push back your casts, then Pyroblast and Hot Streak.',
          points: { 'Burning Soul': 2, 'Pyroblast': 1, 'Hot Streak': 1 } },
        { text: '3 points in Improved Scorch, then the last point of Burning Soul.',
          points: { 'Improved Scorch': 3, 'Burning Soul': 1 } },
        { text: 'Your level 30 point is Blast Wave.',
          points: { 'Blast Wave': 1 } }
      ]
    },
    frost: {
      status: 'approved',
      abilities: ['Frostbolt', 'Ice Lance', 'Frost Nova', 'Fire Blast', 'Blink', 'Blizzard'],
      gameplay: [
        'Cast Frostbolt: it slows the enemy, so most never reach you.',
        'When Frostbite freezes a target, hit it with Ice Lance. Frozen targets take 300% more damage from it, and Shatter makes those hits likely to crit.',
        'If something gets close, Frost Nova freezes it in place. Follow with Ice Lance, step back and keep casting.',
        'Finish low enemies with Fire Blast, or with Ice Lance on the move. Ice Block saves you when a pull goes wrong.',
        'Want to farm whole packs? Gathering enemies and killing them with Blizzard levels very fast once you have the hang of it, and it wants Improved Blizzard for the slow.'
      ],
      steps: [
        { text: '5 points in Improved Frostbolt for a faster Frostbolt.',
          points: { 'Improved Frostbolt': 5 } },
        { text: '2 points in Elemental Precision for more hit, and 3 in Frostbite so your chills can freeze enemies in place.',
          points: { 'Elemental Precision': 2, 'Frostbite': 3 } },
        { text: 'Ice Lance, then 4 points in Ice Shards for much bigger Frost crits.',
          points: { 'Ice Lance': 1, 'Ice Shards': 4 } },
        { text: '3 points in Shatter for more crits against frozen targets, then Ice Block and the last point of Ice Shards.',
          points: { 'Shatter': 3, 'Ice Block': 1, 'Ice Shards': 1 } },
        { text: 'Your level 30 point is Fingers of Frost: your chills can make your next spells act as if the target were frozen.',
          points: { 'Fingers of Frost': 1 } }
      ]
    }
  },
  priest: {
    shadow: {
      status: 'approved',
      abilities: ['Shadow Word: Pain', 'Mind Blast', 'Mind Flay', 'Devouring Plague', 'Vampiric Embrace', 'Psychic Scream'],
      gameplay: [
        'Until about 20, your wand does most of your damage: Shadow Word: Pain the target, then wand it down.',
        'Open with Mind Blast, then Shadow Word: Pain. Once you have Mind Flay, cast it until the enemy reaches you.',
        'When they start hitting you, switch to your wand: damage doesn\'t interrupt it. Fire another Mind Blast when it comes back.',
        'Devouring Plague heals you as it damages but costs a lot of mana, so save it for when you need the healing.',
        'Confident? Pull 2 or 3 enemies, put your damage over time on all of them and Vampiric Embrace on the last. Psychic Scream fears them off you if it gets risky.',
        'Power Word: Shield yourself before a pull, and Renew between fights.'
      ],
      steps: [
        { text: '2 points in Wand Specialization (Discipline): your wand is too strong early on to skip. Then 3 in Shadow Focus for more hit.',
          points: { 'Wand Specialization': 2, 'Shadow Focus': 3 } },
        { text: '5 points in Spirit Tap for mana after every kill, then 2 in Improved Shadow Word: Pain for a longer Pain.',
          points: { 'Spirit Tap': 5, 'Improved Shadow Word: Pain': 2 } },
        { text: 'Mind Flay, 2 points in Improved Mind Flay, and 2 in Shadow Reach for more range.',
          points: { 'Mind Flay': 1, 'Improved Mind Flay': 2, 'Shadow Reach': 2 } },
        { text: 'Vampiric Embrace to heal yourself as you deal damage, then 3 points in Shadow Weaving.',
          points: { 'Vampiric Embrace': 1, 'Shadow Weaving': 3 } }
      ]
    },
    holy: {
      status: 'approved',
      abilities: ['Renew', 'Power Word: Shield', 'Lesser Heal', 'Heal', 'Flash Heal', 'Prayer of Healing'],
      gameplay: [
        'Renew on the tank or anyone taking damage is your starting point. Add Power Word: Shield when the damage gets heavy.',
        'Top people off with direct heals, but leave room for your Renew to finish its work.',
        'Lesser Heal is your cheap heal: step up its rank when you need more. Heal is bigger for more mana, and Flash Heal is fast but expensive, so save it for emergencies.',
        'At 30, Prayer of Healing heals your whole party at once when everyone is taking damage.',
        'Use the cheapest heal that does the job, and carry Mana Potions for hard fights. Dispel Magic and Cure Disease clean up your group.'
      ],
      steps: [
        { text: '3 points in Improved Renew for a stronger Renew, and 2 in Holy Specialization for more crit.',
          points: { 'Improved Renew': 3, 'Holy Specialization': 2 } },
        { text: '5 points in Divine Fury for faster Heal casts.',
          points: { 'Divine Fury': 5 } },
        { text: 'Switch to the Discipline tree: 5 points in Twin Disciplines for stronger instant heals, then 3 in Improved Power Word: Shield.',
          points: { 'Twin Disciplines': 5, 'Improved Power Word: Shield': 3 } },
        { text: 'Back in Holy: finish Holy Specialization.',
          points: { 'Holy Specialization': 3 } }
      ]
    },
    discipline: {
      status: 'approved',
      abilities: ['Smite', 'Holy Fire', 'Power Word: Shield', 'Renew', 'Shadow Word: Pain', 'Lesser Heal'],
      gameplay: [
        'This build is all about mana: you almost never stop to eat or drink.',
        'Open with Holy Fire (from 20; Smite before that), then finish with Smite or your wand. When mana is low, or your wand hits harder at your level, lean on the wand.',
        'Spirit Tap floods you with mana after every kill, so you can go straight into the next fight.',
        'Taking hits? Power Word: Shield yourself, and Renew between fights. Wand shots are not slowed by damage, so switch to the wand when enemies are on you.'
      ],
      steps: [
        { text: '2 points in Wand Specialization: your wand is a big part of your damage.',
          points: { 'Wand Specialization': 2 } },
        { text: 'Switch to the Shadow tree for 5 points in Spirit Tap: kills flood you with mana.',
          points: { 'Spirit Tap': 5 } },
        { text: 'Back in Discipline: 5 points in Power in Light for a stronger Smite on targets with your Holy Fire.',
          points: { 'Power in Light': 5 } },
        { text: '3 points in Holy Precision so your Holy spells stop missing.',
          points: { 'Holy Precision': 3 } },
        { text: '3 points in Meditation to keep regenerating mana while you cast, and 3 in Mental Agility for cheaper Smite and Holy Fire.',
          points: { 'Meditation': 3, 'Mental Agility': 3 } }
      ]
    }
  },
  rogue: {
    assassination: {
      status: 'approved',
      abilities: ['Stealth', 'Cheap Shot', 'Sinister Strike', 'Slice and Dice', 'Eviscerate', 'Mutilate'],
      gameplay: [
        'The idea: stun enemies often so you take as little damage as possible and keep moving from fight to fight.',
        'Stealth before you reach the enemy and get behind it. From 26, open with Cheap Shot: it stuns and gives you 2 combo points.',
        'Build 5 combo points with Sinister Strike, or Mutilate from 30, and put up Slice and Dice. A 5-point Slice and Dice lasts a long time.',
        'Keep Slice and Dice up, and finish enemies with Eviscerate.',
        'Facing a group? Sap one before you start, and use Evasion to fight two at once. If it goes wrong, Vanish and reset.',
        'On tough enemies, stun them with Cheap Shot and a 5-point Kidney Shot, then Gouge to catch your breath.'
      ],
      steps: [
        { text: '5 points in Malice for more crit.',
          points: { 'Malice': 5 } },
        { text: '3 points in Ruthlessness so finishers can refund a combo point, and 2 in Improved Slice and Dice.',
          points: { 'Ruthlessness': 3, 'Improved Slice and Dice': 2 } },
        { text: '5 points in Lethality for bigger crits from your builders.',
          points: { 'Lethality': 5 } },
        { text: 'Relentless Strikes for energy back from finishers, Cold Blood for a guaranteed crit, 2 points in Remorseless Attacks, and the last point of Improved Slice and Dice.',
          points: { 'Relentless Strikes': 1, 'Cold Blood': 1, 'Remorseless Attacks': 2, 'Improved Slice and Dice': 1 } },
        { text: 'Your level 30 point is Mutilate: attack with both weapons at once for 2 combo points.',
          points: { 'Mutilate': 1 } }
      ]
    },
    combat: {
      status: 'approved',
      abilities: ['Stealth', 'Cheap Shot', 'Sinister Strike', 'Slice and Dice', 'Eviscerate', 'Blade Flurry'],
      gameplay: [
        'The idea: stun enemies often so you take as little damage as possible and keep moving from fight to fight.',
        'Stealth before you reach the enemy and get behind it. From 26, open with Cheap Shot: it stuns and gives you 2 combo points.',
        'Build 5 combo points with Sinister Strike and put up Slice and Dice. A 5-point Slice and Dice lasts a long time.',
        'Keep Slice and Dice up, and finish enemies with Eviscerate. Use Riposte whenever a parry lights it up.',
        'Facing a group? Sap one before you start, and use Evasion or Blade Flurry to fight two at once. If it goes wrong, Vanish and reset.',
        'On tough enemies, stun them with Cheap Shot and a 5-point Kidney Shot, then Gouge to catch your breath.'
      ],
      steps: [
        { text: '2 points in Improved Sinister Strike for a cheaper Sinister Strike, and 3 in Improved Eviscerate.',
          points: { 'Improved Sinister Strike': 2, 'Improved Eviscerate': 3 } },
        { text: '3 points each in Precision for more hit and Deflection for more parries.',
          points: { 'Precision': 3, 'Deflection': 3 } },
        { text: 'Riposte, 2 points in Endurance for faster Sprint and Evasion cooldowns, and 1 in Improved Sprint.',
          points: { 'Riposte': 1, 'Endurance': 2, 'Improved Sprint': 1 } },
        { text: '5 points in Dual Wield Specialization for a stronger off-hand.',
          points: { 'Dual Wield Specialization': 5 } },
        { text: 'Your level 30 point is Blade Flurry: faster attacks that also hit a second enemy.',
          points: { 'Blade Flurry': 1 } }
      ]
    },
    subtlety: {
      status: 'approved',
      abilities: ['Stealth', 'Ambush', 'Hemorrhage', 'Slice and Dice', 'Eviscerate', 'Rupture'],
      gameplay: [
        'Carry daggers from level 10: most of this build pays off with a dagger in your main hand.',
        'Stealth before you reach the enemy, get behind it and open with Ambush or Cheap Shot.',
        'Build 5 combo points with Sinister Strike (Backstab when you are behind the enemy), then Hemorrhage once you have it. Ghostly Strike early in a fight adds dodge.',
        'Keep Slice and Dice up. At 5 points, Rupture anything that will live a while and Eviscerate anything about to die.',
        'Facing a group? Sap one before you start, and use Evasion to fight two at once. If it goes wrong, Vanish and reset.',
        'On tough enemies, stun them with Cheap Shot and a 5-point Kidney Shot, then Gouge to catch your breath.'
      ],
      steps: [
        { text: '2 points in Opportunity for harder Ambushes and Backstabs, and 3 in Camouflage for a faster Stealth.',
          points: { 'Opportunity': 2, 'Camouflage': 3 } },
        { text: '3 points in Improved Ambush for Ambush crits, and 2 in Setup: dodging an attack gives you a combo point.',
          points: { 'Improved Ambush': 3, 'Setup': 2 } },
        { text: 'Ghostly Strike, 3 points in Initiative for an extra combo point from your openers, and the last point of Setup.',
          points: { 'Ghostly Strike': 1, 'Initiative': 3, 'Setup': 1 } },
        { text: '3 points in Serrated Blades, then Premeditation and 1 point in Dirty Tricks for a cheaper Sap.',
          points: { 'Serrated Blades': 3, 'Premeditation': 1, 'Dirty Tricks': 1 } },
        { text: 'Your level 30 point is Hemorrhage: from now on it is your main attack.',
          points: { 'Hemorrhage': 1 } }
      ]
    }
  },
  shaman: {
    restoration: {
      status: 'approved',
      abilities: ['Healing Wave', 'Lesser Healing Wave', 'Water Shield', 'Earth Shock', 'Stoneskin Totem', 'Mana Spring Totem'],
      gameplay: [
        'Healing Wave is your main heal. Keep lower ranks on your bars to save mana, and start casting a little before the damage lands.',
        'Lesser Healing Wave (from 20) is faster but heals less for more mana, so save it for when you need a heal right now.',
        'Earth Shock interrupts casters and sends them running to your tank. If something comes for you, move to your tank or drop Stoneclaw or Earthbind Totem.',
        'Keep Stoneskin, Mana Spring and Searing totems down: Totemic Projection moves them, and Call of the Elements places all four at once. Tremor and (from 30) Grounding handle fears and spells.',
        'Chain Heal is learned at 40, so for now your healing is all single-target.'
      ],
      steps: [
        { text: '5 points in Improved Healing Wave for a faster Healing Wave.',
          points: { 'Improved Healing Wave': 5 } },
        { text: '3 points in Mindfulness to keep regenerating mana while you cast, and 2 in Tidal Focus for cheaper heals.',
          points: { 'Mindfulness': 3, 'Tidal Focus': 2 } },
        { text: 'Water Shield, 2 points in Ancestral Healing, and 3 more in Tidal Focus to finish it.',
          points: { 'Water Shield': 1, 'Ancestral Healing': 2, 'Tidal Focus': 3 } },
        { text: '4 points in Tidal Mastery for more healing crits.',
          points: { 'Tidal Mastery': 4 } },
        { text: "Your level 30 point is Nature's Swiftness: an instant heal when things go wrong.",
          points: { "Nature's Swiftness": 1 } }
      ]
    },
    enhancement: {
      status: 'approved',
      abilities: ['Stormstrike', 'Lightning Bolt', 'Earth Shock', 'Flame Shock', 'Rockbiter Weapon', 'Strength of Earth Totem'],
      gameplay: [
        'Before you pull, put Rockbiter Weapon on a two-hander (Flametongue Weapon with a one-hander and shield) and drop your totems: Strength of Earth, Searing and Mana Spring.',
        'Open with a Lightning Bolt or two, then Stormstrike and the right shock for the fight.',
        'Your shocks are instant: Flame Shock for extra damage, Earth Shock to interrupt casters, and Frost Shock (from 20) to slow. They also finish off anything hitting you.',
        'Keep Lightning Shield up at all times, and drop Stoneclaw Totem to have it tank for you.',
        'Move your totems with Totemic Projection, and place all four at once with Call of the Elements. Keep Earthbind, Tremor and (from 30) Grounding ready.'
      ],
      steps: [
        { text: '5 points in Thundering Strikes for more crit.',
          points: { 'Thundering Strikes': 5 } },
        { text: '3 points in Improved Lightning Shield, and 2 in Mental Dexterity: your Intellect adds to your attack power.',
          points: { 'Improved Lightning Shield': 3, 'Mental Dexterity': 2 } },
        { text: '3 points in Elemental Weapons for stronger weapon imbues, Shamanistic Focus for cheaper shocks, and the last point of Mental Dexterity.',
          points: { 'Elemental Weapons': 3, 'Shamanistic Focus': 1, 'Mental Dexterity': 1 } },
        { text: 'Stormstrike, then 4 points in Flurry for faster swings after a crit.',
          points: { 'Stormstrike': 1, 'Flurry': 4 } },
        { text: 'Your level 30 point goes into Improved Stormstrike.',
          points: { 'Improved Stormstrike': 1 } }
      ]
    },
    elemental: {
      status: 'approved',
      abilities: ['Lightning Bolt', 'Flame Shock', 'Earth Shock', 'Frost Shock', 'Lightning Shield', 'Searing Totem'],
      gameplay: [
        'Lightning Bolt is your main damage: cast it and let the enemies come.',
        'Your shocks are instant: Flame Shock for extra damage, Earth Shock to interrupt casters, and Frost Shock (from 20) to slow an enemy so you can back off and keep casting. They also finish off anything hitting you.',
        'Keep Lightning Shield up at all times: it is cheap damage against anything that hits you. Drop Stoneclaw Totem to have it tank for you.',
        'Keep Stoneskin, Searing and Mana Spring totems down and bring them with you: Totemic Projection moves them, and Call of the Elements places all four at once.',
        'Keep utility totems ready: Earthbind to slow enemies and escape, Tremor against fear, charm and sleep, and Grounding (from 30) to soak a harmful spell.'
      ],
      steps: [
        { text: '5 points in Convection: mana is your main concern early on.',
          points: { 'Convection': 5 } },
        { text: '5 points in Concussion for more Lightning Bolt and Earth Shock damage.',
          points: { 'Concussion': 5 } },
        { text: 'Elemental Focus, 3 points in Elemental Alacrity for a faster Lightning Bolt, and 2 in Reverberation.',
          points: { 'Elemental Focus': 1, 'Elemental Alacrity': 3, 'Reverberation': 2 } },
        { text: '3 points in Eye of the Storm so hits barely push back your casts, then Call of Thunder.',
          points: { 'Eye of the Storm': 3, 'Call of Thunder': 1 } },
        { text: 'Your level 30 point is Lightning Overload: Lightning Bolt can fire a free second bolt.',
          points: { 'Lightning Overload': 1 } }
      ]
    }
  },
  warlock: {
    destruction: {
      status: 'approved',
      abilities: ['Shadow Bolt', 'Corruption', 'Bane of Agony', 'Shadowburn', 'Fear', 'Life Tap'],
      gameplay: [
        'The simple way: keep your pet attacking and cast Shadow Bolt until the enemy dies.',
        'The stronger way: Shadow Bolt, then Corruption and Bane of Agony. As it closes in, Fear it away and let the damage over time finish it while you start on the next enemy.',
        'At 30, Shadowburn is an instant finisher: if the target dies soon after, you get a Soul Shard back.',
        'Drain Soul an enemy about to die when you need a Soul Shard, and Life Tap between pulls for mana.'
      ],
      steps: [
        { text: '5 points in Improved Corruption (Affliction): Corruption becomes instant.',
          points: { 'Improved Corruption': 5 } },
        { text: '5 points in Bane for a faster Shadow Bolt.',
          points: { 'Bane': 5 } },
        { text: '3 points in Cataclysm for cheaper Destruction spells, and 2 in Destructive Reach for more range.',
          points: { 'Cataclysm': 3, 'Destructive Reach': 2 } },
        { text: '5 points in Improved Shadow Bolt: your Shadow Bolt crits make the target take more Shadow damage.',
          points: { 'Improved Shadow Bolt': 5 } },
        { text: 'Your level 30 point is Shadowburn.',
          points: { 'Shadowburn': 1 } }
      ]
    },
    demonology: {
      status: 'approved',
      abilities: ['Summon Voidwalker', 'Shadow Bolt', 'Immolate', 'Corruption', 'Searing Pain', 'Health Funnel'],
      gameplay: [
        'Your Voidwalker is your tank from level 10: send it in first and let it hold the enemy while you cast.',
        'Shadow Bolt is your main damage. Add Immolate or Corruption for extra damage over time.',
        'From 25, open with Searing Pain: Demonic Brand makes your pet\'s next attacks hit harder and pull the enemy onto it.',
        'Bane of Agony takes 24 sec to do its full damage, so save it for tough enemies.',
        'Keep your pet alive: your spells heal it through Demonic Energies, and Health Funnel tops it up. If it dies, Master Summoner brings a new one out fast and cheap.',
        'Life Tap for mana, and Fear anything that gets past your Voidwalker.'
      ],
      steps: [
        { text: '5 points in Unholy Power: all your demons hit harder.',
          points: { 'Unholy Power': 5 } },
        { text: '3 points in Improved Voidwalker, and 2 in Fel Vitality for a tougher pet and more mana.',
          points: { 'Improved Voidwalker': 3, 'Fel Vitality': 2 } },
        { text: 'Finish Fel Vitality, then 2 points each in Demonic Energies (your spells heal your pet) and Master Summoner.',
          points: { 'Fel Vitality': 1, 'Demonic Energies': 2, 'Master Summoner': 2 } },
        { text: '3 points in Demonic Brand, and 2 in Demonic Aegis for stronger Demon Skin and Demon Armor.',
          points: { 'Demonic Brand': 3, 'Demonic Aegis': 2 } },
        { text: 'Your level 30 point is Demonic Knowledge: more spell damage for you and your pet while it is out.',
          points: { 'Demonic Knowledge': 1 } }
      ]
    },
    affliction: {
      status: 'approved',
      abilities: ['Immolate', 'Corruption', 'Bane of Agony', 'Drain Life', 'Fear', 'Life Tap'],
      gameplay: [
        'The idea: put your damage over time on everything, then Fear or drain while it ticks.',
        'Send your Voidwalker in to hold the enemy, cast Immolate, then Bane of Agony and Corruption. Add Siphon Life at 30.',
        'Pulled more than one? Fear the first so it runs off, and put your damage over time on the next. You can handle 2 or 3 at once this way.',
        'Finish enemies on you or your Voidwalker with Drain Life: Fel Concentration keeps it going even while you are hit. Re-Fear the runner when it comes back.',
        'When Nightfall procs, fire an instant Shadow Bolt at the most dangerous enemy.',
        'At full health before a Drain Life? Life Tap first to turn some health into mana.'
      ],
      steps: [
        { text: '5 points in Improved Corruption: Corruption becomes instant.',
          points: { 'Improved Corruption': 5 } },
        { text: '3 points in Improved Drains for a stronger Drain Life, and 2 in Suppression for more hit.',
          points: { 'Improved Drains': 3, 'Suppression': 2 } },
        { text: '3 points in Fel Concentration so damage can\'t interrupt your drains, and 2 in Malediction.',
          points: { 'Fel Concentration': 3, 'Malediction': 2 } },
        { text: '2 points in Nightfall for free instant Shadow Bolts, then 3 more in Malediction.',
          points: { 'Nightfall': 2, 'Malediction': 3 } },
        { text: 'Your level 30 point is Siphon Life: one more damage over time that heals you.',
          points: { 'Siphon Life': 1 } }
      ]
    }
  },
  warrior: {
    fury: {
      status: 'approved',
      abilities: ['Charge', 'Rend', 'Heroic Strike', 'Overpower', 'Cleave', 'Death Wish'],
      gameplay: [
        'Charge into every fight: it closes the gap and gives you rage. Charging from pack to pack is how warriors move fast.',
        'Open with Rend, then Heroic Strike on one enemy or Cleave (from 20) on several. Use Overpower whenever the enemy dodges.',
        'Keep Battle Shout up, and use Demoralizing Shout or Thunder Clap when fighting several enemies.',
        'At 30, Death Wish is a big damage burst for tough fights.',
        'Execute finishes low enemies but spends all your rage. Sometimes it is better to save rage for the next pull.',
        'Prefer dual wielding? Put the 5 Enrage points into Dual Wield Specialization instead.'
      ],
      steps: [
        { text: '5 points in Cruelty for more crit.',
          points: { 'Cruelty': 5 } },
        { text: '5 points in Unbridled Wrath: your swings generate extra rage.',
          points: { 'Unbridled Wrath': 5 } },
        { text: '3 points in Improved Cleave for a cheaper Cleave, and 2 in Boundless Rage.',
          points: { 'Improved Cleave': 3, 'Boundless Rage': 2 } },
        { text: '5 points in Enrage for more damage with a two-handed weapon.',
          points: { 'Enrage': 5 } },
        { text: 'Your level 30 point is Death Wish.',
          points: { 'Death Wish': 1 } }
      ]
    },
    arms: {
      status: 'approved',
      abilities: ['Charge', 'Rend', 'Heroic Strike', 'Overpower', 'Cleave', 'Spearing Strike'],
      gameplay: [
        'Charge into every fight: it closes the gap and gives you rage. Charging from pack to pack is how warriors move fast.',
        'Open with Rend, then Heroic Strike on one enemy or Cleave (from 20) on several. Use Overpower whenever the enemy dodges.',
        'From 25, use Spearing Strike before Heroic Strike whenever it is ready.',
        'Keep Battle Shout up, and use Demoralizing Shout or Thunder Clap when fighting several enemies.',
        'At 30, Sweeping Strikes makes your next 5 swings hit a second enemy, so pulling two at once becomes easy.',
        'Execute finishes low enemies but spends all your rage. Sometimes it is better to save rage for the next pull.'
      ],
      steps: [
        { text: '3 points in Improved Rend for a stronger bleed, and 2 in Deflection.',
          points: { 'Improved Rend': 3, 'Deflection': 2 } },
        { text: '2 points each in Improved Charge for more rage and Improved Overpower for more crits, and 1 more in Deflection.',
          points: { 'Improved Charge': 2, 'Improved Overpower': 2, 'Deflection': 1 } },
        { text: '3 points in Deep Wounds: your crits make the target bleed. Then 2 more in Deflection.',
          points: { 'Deep Wounds': 3, 'Deflection': 2 } },
        { text: 'Spearing Strike, 2 points in Impale for bigger crits, and 2 in Two-Handed Weapon Specialization.',
          points: { 'Spearing Strike': 1, 'Impale': 2, 'Two-Handed Weapon Specialization': 2 } },
        { text: 'Your level 30 point is Sweeping Strikes, the highlight of the build.',
          points: { 'Sweeping Strikes': 1 } }
      ]
    },
    protection: {
      status: 'approved',
      abilities: ['Charge', 'Revenge', 'Shield Block', 'Thunder Clap', 'Sunder Armor', 'Victory Rush'],
      gameplay: [
        'The first levels are slow: Charge in, Rend, and spend your rage on Heroic Strike.',
        'From 14, Charge in Battle Stance, then switch to Defensive Stance and use Revenge every time it lights up. Overpower shares its cooldown, so stay defensive.',
        'From 16, Shield Block before Revenge: it guarantees blocks, and blocking feeds you rage.',
        'From 20, Victory Rush after every kill heals you, so you can chain pull without stopping to eat.',
        'On packs, Thunder Clap, then Sunder Armor on each target. Demoralizing Shout weakens them, and Taunt or Mocking Blow pulls back anything that slips away.',
        'Getting crushed? Disarm the enemy, or Last Stand for extra health. It has a 3 min cooldown, so don\'t die with it unused.'
      ],
      steps: [
        { text: '5 points in Shield Specialization: more blocks, and every block gives rage.',
          points: { 'Shield Specialization': 5 } },
        { text: '2 points in Improved Bloodrage, and 3 in Improved Thunder Clap for a cheaper Thunder Clap.',
          points: { 'Improved Bloodrage': 2, 'Improved Thunder Clap': 3 } },
        { text: '3 points in Improved Revenge, then Last Stand and a point in Master of Defense.',
          points: { 'Improved Revenge': 3, 'Last Stand': 1, 'Master of Defense': 1 } },
        { text: 'Vanguard so you can Charge in Defensive Stance, the last point of Master of Defense, then 3 in Anticipation.',
          points: { 'Vanguard': 1, 'Master of Defense': 1, 'Anticipation': 3 } },
        { text: 'Your level 30 point is Concussion Blow: a 5 sec stun.',
          points: { 'Concussion Blow': 1 } }
      ]
    }
  },
  paladin: {
    protection: {
      status: 'approved',
      abilities: ['Holy Strike', 'Consecration', 'Seal of Fury', 'Seal of Righteousness', 'Judgement', 'Righteous Fury'],
      gameplay: [
        'Keep Righteous Fury on the whole time you tank. Your threat and Improved Righteous Fury\'s damage reduction both depend on it.',
        'Put up Seal of Fury or Seal of Righteousness on the way in, then drop Consecration in the middle of the pack for AoE damage and threat.',
        'Judge the main target and follow with Holy Strike. Reapply your seal and keep swinging until your threat on it is solid.',
        'Tab to the next enemy and judge it to spread threat across the pack. Swift Judgement resets Judgement, so you can hit a second target or double up on the same one.',
        'Recast Consecration when it comes back only if the pack will live a while. Down to one or two enemies, just melee them and save your mana.',
        'Keep blessings and an aura on the group. Blessing of Protection saves a friend who pulls threat, Hammer of Justice stuns a dangerous caster, and Divine Protection buys you a few seconds when you are about to die.'
      ],
      steps: [
        { text: 'Start with 5 points in Redoubt for more blocks, then 3 in Precision so your attacks stop missing and 2 in Anticipation.',
          points: { 'Redoubt': 5, 'Precision': 3, 'Anticipation': 2 } },
        { text: 'Take all 3 points of Shield Specialization. Every block can now return mana, which is what keeps you tanking between drinks.',
          points: { 'Shield Specialization': 3 } },
        { text: '3 points in Improved Righteous Fury to cut the damage you take while Righteous Fury is on.',
          points: { 'Improved Righteous Fury': 3 } },
        { text: 'Pick up Improved Seal of Fury for mana back when its shield breaks, then add 2 more points to Anticipation.',
          points: { 'Improved Seal of Fury': 1, 'Anticipation': 2 } },
        { text: 'Take Swift Judgement: a second Judgement on demand for threat or a quick taunt.',
          points: { 'Swift Judgement': 1 } },
        { text: 'Your level 30 point finishes Anticipation at 5/5.',
          points: { 'Anticipation': 1 } }
      ]
    },
    holy: {
      status: 'approved',
      abilities: ['Flash of Light', 'Holy Light', 'Holy Shock', 'Lay on Hands', 'Purify', 'Blessing of Wisdom'],
      gameplay: [
        'Healing is simple: Flash of Light for quick, cheap heals and Holy Light for big ones.',
        'Keep a low rank of Holy Light on your bars and lean on it to save mana. Step up a rank only when it falls short, and top off a low tank with max rank Holy Light.',
        'Holy Shock is your instant heal for emergencies. Divine Favor makes your next heal a guaranteed crit.',
        'Illumination refunds mana when your heals crit. Tight on mana? Take it to 5/5 instead of Holy Shock.',
        'Lay on Hands heals for your full health but drains all your mana. Save it for emergencies, or for when you are out of mana anyway.',
        'Bless the group and keep an aura up. Blessing of Protection saves a friend who pulls threat, and Divine Protection saves you.'
      ],
      steps: [
        { text: '5 points in Divine Intellect for a bigger mana pool.',
          points: { 'Divine Intellect': 5 } },
        { text: '3 points in Healing Light for stronger heals, and 2 in Spiritual Focus so taking damage doesn\'t push back your casts.',
          points: { 'Healing Light': 3, 'Spiritual Focus': 2 } },
        { text: '3 points in Reverence to keep regenerating mana while you cast, and 2 in Purifying Power for cheaper Purify.',
          points: { 'Reverence': 3, 'Purifying Power': 2 } },
        { text: 'Divine Favor for a crit on demand, then 4 points in Illumination: crit heals give mana back.',
          points: { 'Divine Favor': 1, 'Illumination': 4 } },
        { text: 'Your level 30 point unlocks Holy Shock, an instant heal for emergencies.',
          points: { 'Holy Shock': 1 } }
      ]
    },
    retribution: {
      status: 'approved',
      abilities: ['Seal of Command', 'Judgement', 'Holy Strike', 'Consecration', 'Hammer of Justice', 'Blessing of Might'],
      gameplay: [
        'Keep Seal of Command up and swing a slow two-handed weapon: slower weapons get more out of the seal.',
        'Open on a tough target with Hammer of Justice, then Judgement: Seal of Command\'s Judgement hits twice as hard on a stunned enemy.',
        'Use Holy Strike whenever it is ready. On a pack, drop Consecration and fight inside it.',
        'Benediction and Sanctified Judgement keep your mana costs low, so you rarely stop to drink.',
        'Heal between pulls with Holy Light or Flash of Light. Lay on Hands and Divine Protection save a pull gone wrong.',
        'Keep Blessing of Might and Retribution Aura up. In a group, bless everyone with Kings, Might or Wisdom.'
      ],
      steps: [
        { text: '5 points in Benediction for cheaper instant spells, then 5 in Conviction for more melee crit.',
          points: { 'Benediction': 5, 'Conviction': 5 } },
        { text: 'Take Seal of Command, 3 points in Sanctified Judgement for mana back, and 1 in Pursuit of Justice.',
          points: { 'Seal of Command': 1, 'Sanctified Judgement': 3, 'Pursuit of Justice': 1 } },
        { text: 'Sacred Arbiter for a stronger Holy Strike, then 2 points in Vindication for more attack power.',
          points: { 'Sacred Arbiter': 1, 'Vindication': 2 } },
        { text: '2 points in Improved Judgement for faster Judgements. Your last point finishes Pursuit of Justice.',
          points: { 'Improved Judgement': 2, 'Pursuit of Justice': 1 } }
      ]
    }
  }
};

// The spec we recommend for leveling each class (shown as a "Leveling pick" tag).
const LEVELING_PICK = {
  druid: 'feral', hunter: 'beast-mastery', mage: 'frost', paladin: 'retribution', priest: 'shadow',
  rogue: 'combat', shaman: 'enhancement', warlock: 'affliction', warrior: 'protection',
};
