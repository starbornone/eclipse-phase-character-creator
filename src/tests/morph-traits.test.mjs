import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { availableMorphTraits, deriveMorphProfile, evaluateMorphTraits, morphProfileForSleeve, traceIncludedMorphTraits } from '../rules/calculations/morph-traits.ts';
import { evaluateStartingMorphBudget } from '../rules/calculations/starting-morph-budget.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';

const toughness = (level) => ({ id: 'toughness', level });
const frailty = (level) => ({ id: 'frailty', level });
const strikingLooks = (level) => ({ id: 'striking-looks', level });
const unattractiveness = (level) => ({ id: 'unattractiveness', level });
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

test('Frailty grants MP and applies a traced durability reduction with the sleeve category formulas', () => {
  for (const [id, level, expected] of [
    ['bouncer', 1, [30, 6, 45]], ['bouncer', 2, [25, 5, 38]],
    ['case', 2, [15, 3, 30]], ['synth', 1, [35, 7, 70]],
  ]) {
    const base = findSampleMorph(id);
    const { morph, entries } = deriveMorphProfile(base, [frailty(level)]);
    assert.deepEqual([morph.durability, morph.woundThreshold, morph.deathRating], expected);
    assert.deepEqual([entries[0].mp, entries[0].durabilityChange], [-2 * level, -5 * level]);
    assert.equal(base.durability, expected[0] + 5 * level);
  }
  const base = findSampleMorph('bouncer');
  assert.equal(deriveMorphProfile(base, [toughness(1), frailty(1)]).morph, base);
  const budget = evaluateStartingMorphBudget({}, base, false, [frailty(2), unattractiveness(2)]);
  assert.deepEqual([budget.morphTraitBonus, budget.remaining, budget.temporaryFlex], [6, 8, 3]);
});

test('appearance traits preserve their published level numbers for each eligible profile', () => {
  const levels = (morph, id) => availableMorphTraits(morph).find((trait) => trait.id === id)?.eligibleLevels;
  const bouncer = findSampleMorph('bouncer');
  const synth = findSampleMorph('synth');
  assert.deepEqual(levels(bouncer, 'striking-looks'), [{ level: 1, mp: 1 }, { level: 2, mp: 2 }]);
  assert.deepEqual(levels(synth, 'striking-looks'), [{ level: 1, mp: 1 }]);
  assert.deepEqual(levels(bouncer, 'unattractiveness'), [{ level: 2, mp: -2 }]);
  assert.deepEqual(levels(synth, 'unattractiveness'), [{ level: 1, mp: -1 }]);
  assert.equal(levels({ ...bouncer, id: 'unsourced-body-type' }, 'unattractiveness'), undefined);
  assert.deepEqual(evaluateMorphTraits(synth, [strikingLooks(2), unattractiveness(2)]).entries, []);
});

test('trait choices are scoped by profile category and use a shared negative MP cap', () => {
  const bouncer = findSampleMorph('bouncer');
  const synth = findSampleMorph('synth');
  const bioChoices = [dominantLimb, hypersensitivity, nausea];
  assert.equal(evaluateMorphTraits(bouncer, bioChoices).bonus, 6);
  assert.equal(evaluateMorphTraits(synth, [...bioChoices, proprietary]).bonus, 3);
  assert.equal(evaluateMorphTraits(bouncer, [...bioChoices, obsolescence]).bonus, 7);
  assert.equal(evaluateStartingMorphBudget({}, bouncer, false, [...bioChoices, obsolescence]).morphTraitBonus, 6);
  const operatorTraits = availableMorphTraits(findSampleMorph('operator'));
  assert.equal(operatorTraits.length, 12);
  assert.ok(operatorTraits.every(({ checkModifier }) => checkModifier));
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

test('backup and print preserve Frailty and enforce appearance level restrictions and the bonus cap', () => {
  const first = draft([frailty(2), unattractiveness(2)]);
  assert.deepEqual(previewBackup(encodeBackup([first])).drafts[0], first);
  for (const [id, choices] of [
    ['bouncer', [unattractiveness(1)]], ['synth', [unattractiveness(2)]], ['case', [strikingLooks(2)]],
    ['operator', [frailty(1)]], ['bouncer', [frailty(2), unattractiveness(2), dominantLimb]],
  ]) {
    assert.throws(() => previewBackup(encodeBackup([draft(choices, id)])), /morphTraits.*must be/);
  }
  for (const audience of ['player', 'gm']) {
    const print = buildPrintableDossier(first, audience, []);
    assert.equal(print.morph.durability, 25);
    assert.equal(print.activeMorphTraits.find(({ id }) => id === 'frailty').durabilityChange, -10);
    assert.ok(print.activeMorphTraits.some(({ id, level }) => id === 'unattractiveness' && level === 2));
  }
  const next = recordResleeving(first, 'second', 'synth', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  const print = buildPrintableDossier(next, 'gm', []);
  assert.deepEqual([print.morph.durability, print.startingMorphBudget.morphTraitBonus], [40, 6]);
  assert.equal(print.history[1].morphTraits.find(({ id }) => id === 'frailty').level, 2);
});

test('the seven supported base profiles supply their sourced traits independently of starting MP', () => {
  const infomorphTraits = [['digital-speed', undefined], ['exotic-morphology', 3]];
  const expected = {
    bouncer: [['limberness', 1]],
    case: [['exotic-morphology', 1], ['inherent-flaws', undefined]],
    synth: [['exotic-morphology', 1]],
    digimorph: infomorphTraits, ikon: infomorphTraits, agent: infomorphTraits, operator: infomorphTraits,
  };
  for (const morph of sampleMorphs) {
    const included = traceIncludedMorphTraits(morph);
    assert.deepEqual(included.map(({ id, level }) => [id, level]), expected[morph.id]);
    assert.ok(included.every(({ name, effect }) => name && effect));
    const budget = evaluateStartingMorphBudget({}, morph);
    assert.deepEqual([budget.morphTraitCost, budget.morphTraitBonus, budget.remaining], [0, 0, 6 - morph.morphPoints]);
    assert.equal(deriveMorphProfile(morph).morph, morph);
  }
  assert.deepEqual(traceIncludedMorphTraits(findSampleMorph('survey-sleeve')), []);
  assert.deepEqual(traceIncludedMorphTraits(), []);
});

test('included traits and Exotic Morphology cannot enter the elective ledger or a backup purchase', () => {
  for (const [id, trait, level] of [
    ['bouncer', 'limberness', 1], ['bouncer', 'limberness', 2], ['bouncer', 'exotic-morphology', 1],
    ['case', 'inherent-flaws', 1], ['synth', 'exotic-morphology', 2], ['operator', 'digital-speed', 1],
  ]) {
    const choices = [{ id: trait, level }];
    assert.deepEqual(evaluateMorphTraits(findSampleMorph(id), choices).entries, []);
    assert.throws(() => previewBackup(encodeBackup([draft(choices, id)])), /morphTraits.*must be/);
  }
  const choices = [{ id: 'limberness', level: 2 }, { id: 'inherent-flaws', level: 1 }];
  const synth = draft(choices, 'synth');
  assert.deepEqual(previewBackup(encodeBackup([synth])).drafts[0], synth);
  const budget = evaluateStartingMorphBudget(synth.ego, findSampleMorph('synth'), false, choices);
  assert.deepEqual([budget.morphTraitCost, budget.morphTraitBonus, budget.remaining], [2, 2, 3]);
});

test('existing backups and newly resleeved drafts source included traits from their profile IDs', () => {
  const first = draft([], 'case');
  delete first.sleeves[0].morphTraits;
  const restored = previewBackup(encodeBackup([first])).drafts[0];
  assert.deepEqual(restored, first);
  const next = recordResleeving(restored, 'second', 'operator', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  assert.equal(next.sleeves[1].morphTraits, undefined);
  for (const audience of ['player', 'gm']) {
    const output = buildPrintableDossier(next, audience, []);
    assert.deepEqual(output.includedMorphTraits.map(({ id }) => id), ['digital-speed', 'exotic-morphology']);
    assert.deepEqual(output.activeMorphTraits, []);
  }
  const gm = buildPrintableDossier(next, 'gm', []);
  assert.deepEqual(gm.history[1].includedMorphTraits.map(({ id }) => id), ['exotic-morphology', 'inherent-flaws']);
  assert.equal(gm.startingMorphBudget.morphTraitBonus, 0);
});
