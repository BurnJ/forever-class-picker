# Forever Class Guide

A companion site for Skyy's WoW Forever class picking guide (The Comeback Kids). All nine classes and 27 specs, plus a seven-question quiz that ranks the specs for you.

Fan-made. Not affiliated with Blizzard Entertainment.

## Files

| File | What it holds |
|---|---|
| `index.html` | Layout, styles, views, router |
| `data.js` | All guide text and the quiz tags for each spec |
| `quiz.js` | The quiz questions and scoring |
| `tests/quiz.test.mjs` | Checks on the content and the scoring |

No build step and no dependencies. No images: the crests are inline SVG drawn for this site.

## Routes

| Route | View |
|---|---|
| `#/` | Home: quiz entry and the class list |
| `#/<class>` | Class page, for example `#/paladin` |
| `#/<class>/<section>` | A section or spec, for example `#/paladin/holy` or `#/warlock/changes` |
| `#/quiz` | Quiz |
| `#/results?a=<answers>` | Results. The link can be shared |

## Editing the guide

All text lives in `data.js`. Each class has a summary, who it's for, strengths, weaknesses, class-wide changes, three specs and a closing. Change the text there and nothing else needs to move.

Then run the tests:

```
node --test
```

## Quiz tags

Every spec carries tags the quiz scores against. Role, range and pet come straight from the script. **Complexity, support and solo are a reading of the script, not something Skyy wrote.** Correct any of them in `data.js`.

- Complexity: 1 simple, 2 a few things to track, 3 a lot to juggle
- Support: 1 own performance, 2 some of both, 3 brings a lot to a party
- Solo: 1 best in a group, 2 either, 3 strong alone
- Pet: 0 none, 1 optional, 2 central

| Class | Spec | Complexity | Support | Solo | Pet |
|---|---|---|---|---|---|
| Paladin | Protection | 2 | 3 | 2 | 0 |
| Paladin | Holy | 1 | 3 | 1 | 0 |
| Paladin | Retribution | 2 | 3 | 2 | 0 |
| Druid | Feral | 3 | 2 | 3 | 0 |
| Druid | Restoration | 2 | 3 | 1 | 0 |
| Druid | Balance | 2 | 2 | 2 | 0 |
| Priest | Shadow | 2 | 2 | 2 | 0 |
| Priest | Discipline | 2 | 3 | 1 | 0 |
| Priest | Holy | 2 | 3 | 1 | 0 |
| Hunter | Beast Mastery | 1 | 1 | 3 | 2 |
| Hunter | Marksmanship | 2 | 1 | 3 | 1 |
| Hunter | Survival | 2 | 1 | 3 | 1 |
| Rogue | Assassination | 3 | 1 | 2 | 0 |
| Rogue | Combat | 1 | 1 | 2 | 0 |
| Rogue | Subtlety | 3 | 1 | 2 | 0 |
| Mage | Arcane | 2 | 2 | 2 | 0 |
| Mage | Fire | 2 | 2 | 2 | 0 |
| Mage | Frost | 1 | 2 | 3 | 0 |
| Warlock | Affliction | 2 | 2 | 3 | 1 |
| Warlock | Demonology | 2 | 2 | 3 | 2 |
| Warlock | Destruction | 1 | 2 | 2 | 1 |
| Warrior | Arms | 2 | 1 | 2 | 0 |
| Warrior | Fury | 1 | 1 | 2 | 0 |
| Warrior | Protection | 2 | 2 | 1 | 0 |
| Shaman | Elemental | 2 | 3 | 2 | 0 |
| Shaman | Enhancement | 2 | 3 | 2 | 0 |
| Shaman | Restoration | 2 | 3 | 1 | 0 |

Question weights: role 3, range 2, pet 2, fantasy 2, complexity 1.5, support 1, solo 1. "No preference" leaves a question out of the score.

## Open questions for Skyy

- **Druid weaknesses.** The script's Druid weaknesses were the same lines as Paladin's, so the four on the site were written for the site, not by Skyy. Two lean on the script (mana, and bear versus cat tradeoffs). The other two assume Classic rules still hold in Forever: that you cannot cast while in Bear or Cat Form, and that shapeshifting costs mana. Correct them in `data.js` if Forever changes either.
- **Traps in combat** (Survival) and **an Enhancement taunt** are shown on the site as not confirmed.

## Deploy

```
git push
vercel --prod --yes
```

Web Analytics has to be switched on for the project in the Vercel dashboard for the analytics tag to record anything.
