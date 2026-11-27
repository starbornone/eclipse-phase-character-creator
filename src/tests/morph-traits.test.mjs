import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { availableMorphTraits, deriveMorphProfile, evaluateMorphTraits, morphProfileForSleeve } from '../rules/calculations/morph-traits.ts';
import { evaluateStartingMorphBudget } from '../rules/calculations/starting-morph-budget.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';

const toughness = (level) => ({ id: 'toughness', level });
const dominantLimb = { id: 'dominant-limb', level: 1 };
const hypersensitivity = { id: 'hypersensitivity', level: 1 };
const nausea = { id: 'zero-g-nausea', level: 1 };
const obsolescence = { id: 'planned-obsolescence', level: 1 };
const proprietary = { id: 'proprietary-tech', level: 1 };
const updatedAt = '2026-11-28T00:00:00.000Z';
const draft = (morphTraits, morphDefinitionId = 'bouncer', startingMorphPoints) => ({
  schemaVersion: 2, rulesVersion: 'ep2-quick-start-2.4', revision: 1, updatedAt,
  ego: { id: 'morph-traits', name: 'Morph traits', pronouns: '', concept: '', aptitudes: {},
    ...(startingMorphPoints === undefined ? {} : { startingMorphPoints }) },
  sleeves: [{ id: 'first', egoId: 'morph-traits', morphDefinitionId, assignedAt: updatedAt, morphTraits }],
});

test('Toughness charges 2 MP per level and derives health from the selected physical profile', () => {
  for (const [id, level, expected] of [
    ['bouncer', 1, [40, 8, 60]], ['bouncer', 2, [45, 9, 68]],
    ['case', 1, [30, 6, 60]], ['synth', 2, [50, 10, 100]],
  ]) {
    const base = findSampleMorph(id);
    const { morph, entries } = deriveMorphProfile(base, [toughness(level)]);
    assert.deepEqual([morph.durability, morph.woundThreshold, morph.deathRating], expected);
    assert.equal(entries[0].mp, 2 * level);
    assert.equal(base.durability, expected[0] - 5 * level);
  }
});

test('trait choices are scoped by profile category and use a shared negative MP cap', () => {
  const bouncer = findSampleMorph('bouncer');
  const synth = findSampleMorph('synth');
  const bioChoices = [dominantLimb, hypersensitivity, nausea];
  assert.equal(evaluateMorphTraits(bouncer, bioChoices).bonus, 6);
  assert.equal(evaluateMorphTraits(synth, [...bioChoices, proprietary]).bonus, 3);
  assert.equal(evaluateMorphTraits(bouncer, [...bioChoices, obsolescence]).bonus, 7);
  assert.equal(evaluateStartingMorphBudget({}, bouncer, false, [...bioChoices, obsolescence]).morphTraitBonus, 6);
  assert.deepEqual(availableMorphTraits(findSampleMorph('operator')), []);
  assert.deepEqual(availableMorphTraits(findSampleMorph('survey-sleeve')), []);
  assert.deepEqual(availableMorphTraits(), []);
});

test('both MP trait totals are visible alongside Resources, equipment and temporary Flex', () => {
  const result = evaluateStartingMorphBudget(
    { traits: [{ id: 'resources', level: 1 }], startingEquipment: ['ecto'] },
    findSampleMorph('bouncer'), false, [toughness(2), hypersensitivity, nausea],
  );
  assert.deepEqual(
    [result.resources, result.morphTraitBonus, result.available, result.cost, result.equipmentCost, result.morphTraitCost, result.remaining, result.temporaryFlex],
    [1, 5, 12, 4, 1, 4, 3, 1],
  );
});

test('backup validation rejects incompatible, duplicate, malformed and over-cap sleeve traits', () => {
  const eligible = draft([toughness(2), dominantLimb, hypersensitivity, nausea]);
  assert.deepEqual(previewBackup(encodeBackup([eligible])).drafts[0], eligible);
  for (const bad of [
    draft([proprietary]), draft([hypersensitivity], 'synth'), draft([toughness(1)], 'operator'),
    draft([toughness(0)]), draft([toughness(1.5)]), draft([toughness(3)]),
    draft([toughness(1), toughness(2)]), draft([dominantLimb, hypersensitivity, nausea, obsolescence]),
  ]) {
    assert.throws(() => previewBackup(encodeBackup([bad])), /morphTraits.*must be/);
  }
  const largestPreviousAllowance = Number.MAX_SAFE_INTEGER - 4;
  const previous = draft([], 'bouncer', largestPreviousAllowance);
  assert.deepEqual(previewBackup(encodeBackup([previous])).drafts[0], previous);
  assert.throws(() => previewBackup(encodeBackup([draft([dominantLimb], 'bouncer', largestPreviousAllowance)])), /after applying morph trait bonuses/);
});

test('resleeving preserves traits on the previous sleeve and both print layouts use configured active health', () => {
  const first = draft([toughness(2), nausea]);
  for (const audience of ['player', 'gm']) {
    const print = buildPrintableDossier(first, audience, []);
    assert.equal(print.morph.durability, 45);
    assert.ok(print.activeMorphTraits.some(({ id }) => id === 'toughness'));
  }
  const next = recordResleeving(first, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  assert.deepEqual(next.sleeves[0], first.sleeves[0]);
  assert.equal(morphProfileForSleeve(next.sleeves[1]).morph.durability, 25);
  const print = buildPrintableDossier(next, 'gm', []);
  assert.deepEqual(print.activeMorphTraits, []);
  assert.ok(print.history[1].morphTraits.some(({ id }) => id === 'toughness'));
  assert.deepEqual([print.startingMorphBudget.morphTraitCost, print.startingMorphBudget.morphTraitBonus, print.startingMorphBudget.temporaryFlex], [4, 2, 0]);
});
