import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { evaluateStartingMorphBudget, parseStartingMorphAllowance, startingMorphBudgetForDraft } from '../rules/calculations/starting-morph-budget.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';

const updatedAt = '2026-11-28T00:00:00.000Z';
const draft = {
  schemaVersion: 2, rulesVersion: 'ep2-quick-start-2.4', revision: 1, updatedAt,
  ego: { id: 'mp-test', name: 'MP test', pronouns: '', concept: '', aptitudes: {} },
  sleeves: [{ id: 'first', egoId: 'mp-test', morphDefinitionId: 'synth', assignedAt: updatedAt }],
};

test('starting MP applies the default, core morph prices, and the capped complete-pair Flex conversion', () => {
  for (const [id, cost, remaining, flex] of [
    ['bouncer', 4, 2, 1], ['case', 0, 6, 3], ['synth', 3, 3, 1],
    ['digimorph', 0, 6, 3], ['ikon', 1, 5, 2], ['agent', 2, 4, 2], ['operator', 2, 4, 2],
  ]) {
    const result = evaluateStartingMorphBudget({}, findSampleMorph(id));
    assert.deepEqual([result.allowance, result.cost, result.remaining, result.temporaryFlex], [6, cost, remaining, flex]);
    assert.ok(result.costSource.url.endsWith(`#${id}`));
  }
  const capped = evaluateStartingMorphBudget({ startingMorphPoints: 16 }, findSampleMorph('bouncer'));
  assert.deepEqual([capped.remaining, capped.temporaryFlex], [12, 3]);
  const deficit = evaluateStartingMorphBudget({ startingMorphPoints: 0 }, findSampleMorph('bouncer'));
  assert.deepEqual([deficit.available, deficit.remaining, deficit.temporaryFlex], [0, -4, 0]);
  const exact = evaluateStartingMorphBudget({ startingMorphPoints: 1 }, findSampleMorph('ikon'));
  assert.deepEqual([exact.remaining, exact.temporaryFlex], [0, 0]);
});

test('Resources spends shared CP and increases starting MP by the selected level', () => {
  for (const level of [1, 2, 3, 4]) {
    const traits = [{ id: 'resources', level }];
    const morph = findSampleMorph('bouncer');
    const { resources, available, remaining, temporaryFlex } = evaluateStartingMorphBudget({ traits }, morph);
    assert.deepEqual([resources, available, remaining, temporaryFlex], [level, 6 + level, 2 + level, Math.floor((2 + level) / 2)]);
    assert.equal(evaluateAptitudeBudget({}, [], { traits }).traitBudget.cost, 2 * level);
  }
  const invalid = evaluateStartingMorphBudget({ traits: [{ id: 'resources', level: 5 }] }, findSampleMorph('bouncer'));
  assert.deepEqual([invalid.available, invalid.resources], [6, 0]);
});

test('blank allowances use the default and missing or unpriced sleeves keep costs pending', () => {
  assert.deepEqual(parseStartingMorphAllowance(' '), { allowance: undefined });
  assert.deepEqual(parseStartingMorphAllowance(' 0 '), { allowance: 0 });
  assert.deepEqual(parseStartingMorphAllowance('12'), { allowance: 12 });
  for (const value of ['-1', '1.5', '1e2', 'abc', String(Number.MAX_SAFE_INTEGER)]) {
    assert.ok(parseStartingMorphAllowance(value).issue);
  }
  for (const morph of [undefined, findSampleMorph('survey-sleeve')]) {
    const budget = evaluateStartingMorphBudget({}, morph);
    assert.deepEqual([budget.available, budget.cost, budget.remaining, budget.temporaryFlex], [6, undefined, undefined, undefined]);
  }
});

test('backups preserve the allowance and Resources and reject malformed values', () => {
  const selected = { ...draft, ego: { ...draft.ego, startingMorphPoints: 0, traits: [{ id: 'resources', level: 2 }] } };
  assert.deepEqual(previewBackup(encodeBackup([selected])).drafts[0], selected);
  for (const value of ['7', -1, 1.5, Number.MAX_SAFE_INTEGER, null]) {
    const invalid = { ...draft, ego: { ...draft.ego, startingMorphPoints: value } };
    assert.throws(() => previewBackup(encodeBackup([invalid])), /startingMorphPoints must be/);
  }
  assert.deepEqual(previewBackup(encodeBackup([draft])).drafts[0], draft);
});

test('the dossier keeps the first sleeve cost and expires starting temporary Flex on resleeving', () => {
  assert.equal(startingMorphBudgetForDraft(draft).temporaryFlex, 1);
  const next = recordResleeving(draft, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const restored = previewBackup(encodeBackup([next])).drafts[0];
  for (const audience of ['player', 'gm']) {
    const { morph, startingMorphBudget: budget, egoFlex } = buildPrintableDossier(restored, audience, []);
    assert.equal(morph.id, 'case');
    assert.deepEqual([budget.morphName, budget.cost, budget.remaining, budget.temporaryFlex, budget.hasResleeved], ['Synth', 3, 3, 0, true]);
    assert.equal(egoFlex, 1);
  }
});
