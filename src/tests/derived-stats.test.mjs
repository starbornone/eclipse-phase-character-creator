import assert from 'node:assert/strict';
import { test } from 'node:test';
import { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { recordResleeving } from '../features/sleeve/history.ts';

const scores = { cog: 15, int: 15, ref: 15, sav: 15, som: 15, wil: 15 };
const composure = { id: 'composure', level: 1 };
const stat = (stats, id) => stats.find((entry) => entry.id === id);
const totals = (input) => traceDerivedEgoStats(input).map(({ total }) => total);
const draft = (traits, aptitudes = scores) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt: '2026-11-27T08:00:00.000Z',
  ego: { id: 'derived-test', name: 'Derived test', pronouns: '', concept: '', aptitudes, traits },
  sleeves: [{ id: 'first', egoId: 'derived-test', morphDefinitionId: 'bouncer', assignedAt: '2026-11-27T08:00:00.000Z' }],
});

test('derive four core ego stats and retain formula inputs and calculation traces', () => {
  const stats = traceDerivedEgoStats({ aptitudes: scores });
  assert.deepEqual(stats.map(({ id }) => id), ['initiative', 'lucidity', 'trauma-threshold', 'insanity-rating']);
  assert.deepEqual(stats.map(({ total }) => total), [6, 30, 6, 60]);
  assert.deepEqual(stat(stats, 'initiative').inputs, [{ source: 'Reflexes', value: 15 }, { source: 'Intuition', value: 15 }]);
  assert.equal(stat(stats, 'initiative').calculation, '(15 + 15) ÷ 5 = 6 → 6');
  assert.deepEqual(stat(stats, 'trauma-threshold').inputs, [{ source: 'Lucidity', value: 30 }]);
  assert.equal(stat(stats, 'insanity-rating').calculation, '30 × 2 = 60');
});

test('division rounds normally on both sides of the midpoint rather than always up or down', () => {
  for (const [ref, int, expected] of [[15, 16, 6], [16, 16, 6], [16, 17, 7], [17, 17, 7], [17, 18, 7]]) {
    assert.equal(stat(traceDerivedEgoStats({ aptitudes: { ref, int } }), 'initiative').total, expected);
  }
  for (const [wil, expected] of [[11, 4], [12, 5], [13, 5], [14, 6], [16, 6], [17, 7]]) {
    assert.equal(stat(traceDerivedEgoStats({ aptitudes: { wil } }), 'trauma-threshold').total, expected);
  }
});

test('missing aptitudes keep dependent stats pending and preserve entered zeroes', () => {
  assert.deepEqual(totals({ aptitudes: {} }), [undefined, undefined, undefined, undefined]);
  assert.deepEqual(totals({ aptitudes: { ref: 15 } }), [undefined, undefined, undefined, undefined]);
  assert.deepEqual(totals({ aptitudes: { ref: 0, int: 0, wil: 0 } }), [0, 0, 0, 0]);
  assert.deepEqual(totals({ aptitudes: { wil: 15 } }), [undefined, 30, 6, 60]);
  assert.deepEqual(totals({ aptitudes: { ref: 15, int: 15 } }), [6, undefined, undefined, undefined]);
});

test('Composure adds five Lucidity and propagates into Trauma Threshold and Insanity Rating', () => {
  for (const wil of [0, 5, 11, 12, 15, 17, 30]) {
    const before = traceDerivedEgoStats({ aptitudes: { ...scores, wil } });
    const after = traceDerivedEgoStats({ aptitudes: { ...scores, wil }, traits: [composure] });
    assert.deepEqual(after.map(({ total }, index) => total - before[index].total), [0, 5, 1, 10]);
    assert.deepEqual(stat(after, 'lucidity').modifiers, [{ source: 'Composure', points: 5 }]);
    assert.equal(stat(after, 'trauma-threshold').inputs[0].value, wil * 2 + 5);
  }
  const pending = traceDerivedEgoStats({ aptitudes: {}, traits: [composure] });
  assert.ok(pending.every(({ total }) => total === undefined));
  assert.deepEqual(stat(pending, 'lucidity').modifiers, [{ source: 'Composure', points: 5 }]);
});

test('Composure uses two shared CP, removal releases its cost, and invalid levels grant no bonus', () => {
  const budget = evaluateAptitudeBudget(scores, [], { traits: [composure, { id: 'enemy', level: 1 }] });
  assert.deepEqual([budget.totalCp, budget.availableCp, budget.cpLeft], [2, 22, 20]);
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: [] }).traitBudget.cost, 0);
  for (const level of [0, 2, 1.5]) {
    assert.deepEqual(totals({ aptitudes: scores, traits: [{ id: 'composure', level }] }), [6, 30, 6, 60]);
  }
});

test('Instability grants 2 CP per level and reduces Lucidity before dependent stats', () => {
  for (const level of [1, 2]) {
    const traits = [{ id: 'instability', level }];
    const stats = traceDerivedEgoStats({ aptitudes: { ...scores, wil: 12 }, traits });
    assert.deepEqual(stats.map(({ total }) => total), [6, 24 - 5 * level, 5 - level, 48 - 10 * level]);
    assert.deepEqual(stat(stats, 'lucidity').modifiers, [{ source: 'Instability', points: -5 * level }]);
    assert.equal(stat(stats, 'lucidity').calculation, `12 × 2 − ${5 * level} = ${24 - 5 * level}`);
    assert.equal(evaluateAptitudeBudget(scores, [], { traits }).availableCp, 20 + 2 * level);
    assert.deepEqual(traceAptitudeChecks(scores, traits), traceAptitudeChecks(scores));
    assert.equal(stat(traceDerivedEgoStats({ aptitudes: {}, traits }), 'lucidity').total, undefined);
  }
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: [] }).availableCp, 20);
});

test('Instability and Composure retain both modifiers even when they cancel', () => {
  const stats = traceDerivedEgoStats({ aptitudes: scores, traits: [composure, { id: 'instability', level: 1 }] });
  assert.equal(stat(stats, 'lucidity').calculation, '15 × 2 + 5 − 5 = 30');
  assert.deepEqual(stat(stats, 'lucidity').modifiers, [
    { source: 'Composure', points: 5 },
    { source: 'Instability', points: -5 },
  ]);
});

test('backups and both print audiences support Instability within the shared trait bonus limit', () => {
  const instability = { id: 'instability', level: 2 };
  const character = draft([instability, { id: 'enemy', level: 1 }]);
  const restored = previewBackup(encodeBackup([character])).drafts[0];
  assert.deepEqual(restored, character);
  for (const audience of ['player', 'gm']) {
    assert.deepEqual(buildPrintableDossier(restored, audience, []).derivedStats.map(({ total }) => total), [6, 20, 4, 40]);
  }
  assert.throws(() => previewBackup(encodeBackup([draft([instability, { id: 'bad-luck', level: 1 }])])), /6 CP limit/);
  assert.throws(() => previewBackup(encodeBackup([draft([{ ...instability, level: 3 }])])), /must be/);
});

test('check-only trait bonuses and Hardening do not change Initiative or mental health bases', () => {
  const traits = [{ id: 'resolve', level: 3 }, { id: 'quickness', level: 3 }, { id: 'good-instincts', level: 3 }, { id: 'hardening', level: 1, detail: 'Violence' }];
  assert.deepEqual(totals({ aptitudes: scores, traits }), [6, 30, 6, 60]);
  assert.equal(traceAptitudeChecks(scores, traits).find(({ id }) => id === 'wil').target, 50);
  assert.deepEqual(totals({ aptitudes: scores, traits: [...traits, composure] }), [6, 35, 7, 70]);
});

test('Composure does not change skill ratings, aptitude checks, or free-language thresholds', () => {
  const ego = { aptitudes: scores, packages: { career: { id: 'investigator' } } };
  assert.deepEqual(calculateStartingSkills({ ...ego, traits: [composure] }), calculateStartingSkills(ego));
  assert.deepEqual(traceAptitudeChecks(scores, [composure]), traceAptitudeChecks(scores));
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: [composure] }).freeLanguages, evaluateAptitudeBudget(scores).freeLanguages);
});

test('backups round-trip Composure and recalculate derived values while rejecting duplicate or malformed traits', () => {
  const character = draft([composure]);
  const restored = previewBackup(encodeBackup([character])).drafts[0];
  assert.deepEqual(restored, character);
  assert.deepEqual(totals(restored.ego), [6, 35, 7, 70]);
  for (const traits of [[composure, composure], [{ ...composure, level: 2 }], [{ ...composure, detail: 'Willpower' }], [{ ...composure, skillId: 'active:Perceive' }]]) {
    assert.throws(() => previewBackup(encodeBackup([draft(traits)])), /must be/);
  }
});

test('both print audiences derive the same stats for partial drafts and through resleeving', () => {
  const before = draft([composure]);
  const after = recordResleeving(before, 'second', 'synth', { date: '', location: '', cause: '', notes: '' }, '2026-11-27T09:00:00.000Z');
  for (const audience of ['player', 'gm']) {
    assert.deepEqual(buildPrintableDossier(after, audience, []).derivedStats, buildPrintableDossier(before, audience, []).derivedStats);
    assert.deepEqual(buildPrintableDossier(after, audience, []).derivedStats.map(({ total }) => total), [6, 35, 7, 70]);
    assert.ok(buildPrintableDossier(draft([composure], {}), audience, []).derivedStats.every(({ total }) => total === undefined));
  }
});
