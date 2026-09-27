import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { CLASSES, VIDEO, TAGS } = require('../data.js');
const { QUESTIONS, scoreQuiz, encodeAnswers, parseAnswers, findSpec } = require('../quiz.js');

// Build an answers array from { questionId: optionValue }. Missing questions are "no preference".
function answers(picks) {
  return QUESTIONS.map(q => {
    if (!(q.id in picks)) return 0;
    const i = q.options.findIndex(o => o.value === picks[q.id]);
    assert.notEqual(i, -1, `no option ${picks[q.id]} on question ${q.id}`);
    return i + 1;
  });
}
const names = results => results.map(r => `${r.specName} ${r.className}`);

/* ---------------- data integrity ---------------- */

test('nine classes, three specs each', () => {
  assert.equal(CLASSES.length, 9);
  for (const c of CLASSES) assert.equal(c.specs.length, 3, c.name);
});

test('class ids are unique and spec ids are unique within a class', () => {
  assert.equal(new Set(CLASSES.map(c => c.id)).size, 9);
  for (const c of CLASSES) assert.equal(new Set(c.specs.map(s => s.id)).size, 3, c.name);
});

test('spec ids never collide with section ids', () => {
  const sections = ['overview', 'who', 'strengths', 'changes'];
  for (const c of CLASSES) for (const s of c.specs) assert.ok(!sections.includes(s.id), `${c.name} ${s.id}`);
});

test('no empty required fields', () => {
  const text = v => typeof v === 'string' && v.trim().length > 0;
  const list = v => Array.isArray(v) && v.length > 0;
  for (const c of CLASSES) {
    for (const k of ['id', 'name', 'color', 'text', 'pitch', 'summary']) assert.ok(text(c[k]), `${c.name}.${k}`);
    for (const k of ['idealPlayer', 'strengths', 'weaknesses', 'changes', 'outro']) assert.ok(list(c[k]), `${c.name}.${k}`);
    for (const row of [...c.strengths, ...c.weaknesses]) assert.ok(text(row.lead) && text(row.text), `${c.name} ledger row`);
    for (const row of c.changes) assert.ok(text(row.term) && text(row.text), `${c.name} change`);
    for (const s of c.specs) {
      const where = `${c.name} ${s.name}`;
      for (const k of ['id', 'name', 'role', 'range']) assert.ok(text(s[k]), `${where}.${k}`);
      for (const k of ['roles', 'themes', 'intro', 'changes']) assert.ok(list(s[k]), `${where}.${k}`);
      for (const row of s.changes) assert.ok(text(row.term) && text(row.text), `${where} change`);
      assert.ok([0, 1, 2].includes(s.pet), `${where}.pet`);
      for (const k of ['complexity', 'support', 'solo']) assert.ok([1, 2, 3].includes(s[k]), `${where}.${k}`);
    }
  }
});

test('every tag value is one a quiz question can ask for', () => {
  const themes = QUESTIONS.find(q => q.id === 'theme').options.map(o => o.value);
  for (const c of CLASSES) for (const s of c.specs) {
    for (const t of s.themes) assert.ok(themes.includes(t), `${c.name} ${s.name} theme ${t}`);
    for (const r of s.roles) assert.ok(['tank', 'healer', 'melee', 'ranged'].includes(r), `${c.name} ${s.name} role ${r}`);
    assert.ok(['melee', 'ranged'].includes(s.range), `${c.name} ${s.name} range`);
  }
});

test('copy is clean', () => {
  const raw = readFileSync(new URL('../data.js', import.meta.url), 'utf8')
    + readFileSync(new URL('../quiz.js', import.meta.url), 'utf8')
    + readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(!raw.includes('—'), 'em dash found');
  assert.ok(!/strengths of the paladin/i.test(raw), 'copy-paste slip found');
  for (const typo of ['Afflciiton', 'Subtley', 'Warrio ', 'Enhance me']) assert.ok(!raw.includes(typo), typo);
  assert.ok(!/comments? section|like and subscribe/i.test(raw), 'video-only line found');
});

test('every change tag is a known tag', () => {
  let tagged = 0;
  for (const c of CLASSES) {
    for (const row of [...c.changes, ...c.specs.flatMap(s => s.changes)]) {
      if (row.tag === undefined) continue;
      tagged++;
      assert.ok(row.tag in TAGS, `${c.name}: ${row.term} has tag ${row.tag}`);
    }
  }
  assert.ok(tagged > 100);
});

test('every class has a video chapter, in the order of the guide', () => {
  const starts = CLASSES.map(c => VIDEO.chapters[c.id]);
  for (const [i, s] of starts.entries()) assert.ok(Number.isInteger(s) && s > 0, CLASSES[i].name);
  assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  assert.ok(VIDEO.end > starts[starts.length - 1]);
});

test('findSpec reads class.spec keys and rejects anything else', () => {
  const hit = findSpec('priest.holy', CLASSES);
  assert.equal(hit.cls.name, 'Priest');
  assert.equal(hit.spec.name, 'Holy');
  assert.equal(findSpec('hunter.beast-mastery', CLASSES).spec.name, 'Beast Mastery');
  for (const bad of ['', null, undefined, 'priest', 'priest.fire', 'monk.holy', 'a.b.c']) {
    assert.equal(findSpec(bad, CLASSES), null, String(bad));
  }
});

/* ---------------- scoring ---------------- */

test('returns all 27 specs, scores between 0 and 100', () => {
  const r = scoreQuiz(answers({ role: 'healer' }), CLASSES);
  assert.equal(r.length, 27);
  for (const x of r) assert.ok(x.score >= 0 && x.score <= 100 && Number.isInteger(x.score));
});

test('tank answers put the three tanks on top', () => {
  const r = scoreQuiz(answers({ role: 'tank', range: 'melee', pet: 'no' }), CLASSES);
  assert.deepEqual(names(r.slice(0, 3)).sort(), ['Feral Druid', 'Protection Paladin', 'Protection Warrior']);
  assert.ok(r[3].score < r[2].score);
});

test('pet plus ranged damage puts Beast Mastery and Demonology in the top 3', () => {
  const top = names(scoreQuiz(answers({ role: 'damage', range: 'ranged', pet: 'yes' }), CLASSES).slice(0, 3));
  assert.ok(top.includes('Beast Mastery Hunter'), top.join(', '));
  assert.ok(top.includes('Demonology Warlock'), top.join(', '));
});

test('healer answers put only healers in the top 5', () => {
  const r = scoreQuiz(answers({ role: 'healer', support: 3 }), CLASSES).slice(0, 5);
  for (const x of r) assert.ok(x.roles.includes('healer'), `${x.specName} ${x.className}`);
});

test('stealth fantasy with damage up close finds rogues', () => {
  const r = scoreQuiz(answers({ role: 'damage', range: 'melee', theme: 'stealth', pet: 'no' }), CLASSES).slice(0, 3);
  assert.deepEqual([...new Set(r.map(x => x.className))], ['Rogue']);
});

test('all no preference is a tie and does not crash', () => {
  const r = scoreQuiz(answers({}), CLASSES);
  assert.equal(r.length, 27);
  assert.equal(new Set(r.map(x => x.score)).size, 1);
  for (const x of r) assert.deepEqual(x.reasons, []);
});

test('unanswered questions are treated as no preference', () => {
  const a = scoreQuiz([1, null, null, null, null, null, null], CLASSES);
  const b = scoreQuiz([1, 0, 0, 0, 0, 0, 0], CLASSES);
  assert.deepEqual(a, b);
});

test('a perfect match gives reasons', () => {
  const r = scoreQuiz(answers({ role: 'damage', range: 'ranged', pet: 'yes' }), CLASSES);
  const bm = r.find(x => x.specId === 'beast-mastery');
  assert.equal(bm.score, 100);
  assert.ok(bm.reasons.length >= 2);
  for (const reason of bm.reasons) assert.ok(typeof reason === 'string' && reason.length > 10);
});

/* ---------------- url encoding ---------------- */

test('answers survive a round trip through the url', () => {
  const a = [1, 0, 2, null, 3, null, 8];
  assert.deepEqual(parseAnswers(encodeAnswers(a)), a);
});

test('bad answer strings are handled', () => {
  const blank = QUESTIONS.map(() => null);
  assert.deepEqual(parseAnswers(''), blank);
  assert.deepEqual(parseAnswers(undefined), blank);
  assert.deepEqual(parseAnswers('zzzzzzzzzzzz'), blank);
  // out of range option index is dropped, not kept
  assert.equal(parseAnswers('9------')[0], null);
});
