'use strict';

/* ================================================================
   QUIZ
   Seven questions, scored per spec against the tags in data.js.
   An answer is the 1-based index of the chosen option.
   0 = "No preference", null = not answered yet. Both score nothing.
   ================================================================ */

// Question: { id, prompt, weight, options[{ label, value }] }
const QUESTIONS = [
  {
    id: 'role', weight: 3,
    prompt: 'What do you want to do in a group?',
    options: [
      { label: 'Take the hits so nobody else has to', value: 'tank' },
      { label: 'Keep everyone alive', value: 'healer' },
      { label: 'Deal damage', value: 'damage' }
    ]
  },
  {
    id: 'range', weight: 2,
    prompt: 'Up close or from a distance?',
    options: [
      { label: 'Up close, weapon in hand', value: 'melee' },
      { label: 'From a distance', value: 'ranged' }
    ]
  },
  {
    id: 'pet', weight: 2,
    prompt: 'Do you want a pet fighting beside you?',
    options: [
      { label: 'Yes, I want a companion', value: 'yes' },
      { label: 'No, just me', value: 'no' }
    ]
  },
  {
    id: 'complexity', weight: 1.5,
    prompt: 'How much do you want to juggle in a fight?',
    options: [
      { label: 'Keep it simple', value: 1 },
      { label: 'A few things to track', value: 2 },
      { label: 'Give me plates to spin', value: 3 }
    ]
  },
  {
    id: 'support', weight: 1,
    prompt: 'Your own damage, or helping the group?',
    options: [
      { label: 'My own performance', value: 1 },
      { label: 'A bit of both', value: 2 },
      { label: 'Buffs, saves and utility for the party', value: 3 }
    ]
  },
  {
    id: 'solo', weight: 1,
    prompt: 'Do you play alone a lot?',
    options: [
      { label: 'Mostly in groups', value: 1 },
      { label: 'A mix', value: 2 },
      { label: 'Mostly on my own', value: 3 }
    ]
  },
  {
    id: 'theme', weight: 2,
    prompt: 'Which of these sounds most like you?',
    options: [
      { label: 'The Light', value: 'holy' },
      { label: 'Nature and the wilds', value: 'nature' },
      { label: 'Shadow and the dark arts', value: 'shadow' },
      { label: 'Arcane, fire and frost', value: 'arcane' },
      { label: 'Steel and heavy armor', value: 'steel' },
      { label: 'Storm, earth and water', value: 'elements' },
      { label: 'Daggers and stealth', value: 'stealth' },
      { label: 'A beast at my side', value: 'beasts' }
    ]
  }
];

// How well a spec fits one answer, 0 to 1.
function matchOf(id, value, spec) {
  const near = (a, b) => 1 - Math.abs(a - b) / 2;
  switch (id) {
    case 'role':
      if (value === 'damage') return spec.roles.includes('melee') || spec.roles.includes('ranged') ? 1 : 0;
      return spec.roles.includes(value) ? 1 : 0;
    case 'range': return spec.range === value ? 1 : 0;
    case 'pet': return value === 'yes' ? spec.pet / 2 : 1 - spec.pet / 2;
    case 'complexity': return near(value, spec.complexity);
    case 'support': return near(value, spec.support);
    case 'solo': return near(value, spec.solo);
    case 'theme': return spec.themes.includes(value) ? 1 : 0;
    default: return 0;
  }
}

// One plain sentence for a full match. Returns '' when there is nothing worth saying.
function reasonFor(id, value, label, spec, cls) {
  switch (id) {
    case 'role':
      if (value === 'tank') return `You want to tank. ${spec.name} is how a ${cls.name} does it.`;
      if (value === 'healer') return `You want to keep people alive. ${spec.name} is a healing spec.`;
      return `You want to deal damage, and that is this spec's job.`;
    case 'range':
      return value === 'melee' ? 'It fights up close, the way you like.' : 'It fights from a distance, the way you like.';
    case 'pet':
      return value === 'yes' ? `You wanted a pet. ${spec.name} is built around one.` : 'No pet to look after.';
    case 'complexity':
      return ['', 'It is simple to pick up.', 'It gives you a few things to track without burying you.', 'It gives you plenty to juggle.'][value];
    case 'support':
      return ['', 'It lets you focus on your own performance.', '', 'It brings a lot to a party beyond its main job.'][value];
    case 'solo':
      return ['', 'It does its best work in a group.', '', 'It handles itself well when you are on your own.'][value];
    case 'theme':
      return `You picked ${label.charAt(0).toLowerCase() + label.slice(1)}.`;
    default: return '';
  }
}

// Returns every spec as { classId, className, specId, specName, role, roles, score, reasons[] },
// best match first. Ties keep the order of the guide.
function scoreQuiz(answers, classes) {
  const picked = QUESTIONS
    .map((q, i) => ({ q, option: q.options[(answers[i] || 0) - 1] }))
    .filter(p => p.option);
  const total = picked.reduce((sum, p) => sum + p.q.weight, 0);

  const rows = [];
  for (const cls of classes) {
    for (const spec of cls.specs) {
      let earned = 0;
      const reasons = [];
      for (const { q, option } of picked) {
        const m = matchOf(q.id, option.value, spec);
        earned += m * q.weight;
        if (m === 1) {
          const why = reasonFor(q.id, option.value, option.label, spec, cls);
          if (why) reasons.push(why);
        }
      }
      rows.push({
        classId: cls.id, className: cls.name,
        specId: spec.id, specName: spec.name,
        role: spec.role, roles: spec.roles,
        score: total ? Math.round(earned / total * 100) : 0,
        reasons
      });
    }
  }
  return rows
    .map((row, i) => ({ row, i }))
    .sort((a, b) => b.row.score - a.row.score || a.i - b.i)
    .map(x => x.row);
}

// Answers travel in the url as one character per question: a digit, or '-' for unanswered.
function encodeAnswers(answers) {
  return QUESTIONS.map((q, i) => (answers[i] == null ? '-' : String(answers[i]))).join('');
}

function parseAnswers(str) {
  const s = typeof str === 'string' ? str : '';
  return QUESTIONS.map((q, i) => {
    const ch = s.charAt(i);
    if (!/^\d$/.test(ch)) return null;
    const n = Number(ch);
    return n <= q.options.length ? n : null;
  });
}

// 'priest.holy' -> { cls, spec }, or null when the key does not name a real spec.
function findSpec(key, classes) {
  const parts = typeof key === 'string' ? key.split('.') : [];
  if (parts.length !== 2) return null;
  const cls = classes.find(c => c.id === parts[0]);
  const spec = cls && cls.specs.find(s => s.id === parts[1]);
  return spec ? { cls, spec } : null;
}

if (typeof module !== 'undefined') module.exports = { QUESTIONS, scoreQuiz, encodeAnswers, parseAnswers, findSpec };
