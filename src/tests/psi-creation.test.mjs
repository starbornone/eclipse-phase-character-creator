import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { traceStartingPsi } from '../rules/calculations/psi.ts';
import { psiSleights, psiSubStrains } from '../rules/datasets/psi.ts';
import { findCreationPackage } from '../rules/datasets/creation-packages.ts';

const psi = (level) => ({ id: 'psi', level });
const packages = { background: { id: 'lost' }, interest: { id: 'async' } };
const updatedAt = '2026-11-28T00:00:00.000Z';
const draft = (details = {}) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt,
  ego: { id: 'psi-test', name: 'Psi test', pronouns: '', concept: '', aptitudes: { wil: 15 }, ...details },
  sleeves: [{ id: 'first', egoId: 'psi-test', morphDefinitionId: 'bouncer', assignedAt: updatedAt }],
});
const psiRow = (ledger) => ledger.skills.find(({ name }) => name === 'Psi');

test('Lost and Async use their sourced grants and keep Psi points pending until the trait is selected', () => {
  const lost = findCreationPackage('background', 'lost');
  const interest = findCreationPackage('interest', 'async');
  assert.ok(lost.requiresPsi && interest.requiresPsi);
  assert.deepEqual(lost.grants.filter(({ slot }) => !slot).map(({ skill, points }) => [skill, points]), [
    ['Deceive', 40], ['Infiltrate', 20], ['Kinesics', 40], ['Perceive', 20], ['Psi', 50],
  ]);
  assert.deepEqual(interest.grants.filter(({ slot }) => !slot).map(({ skill, points }) => [skill, points]), [
    ['Deceive', 40], ['Perceive', 20], ['Psi', 40],
  ]);
  const before = calculateStartingSkills({ aptitudes: { wil: 15 }, packages });
  assert.equal(before.pendingPsiPoints, 90);
  assert.equal(psiRow(before), undefined);
  const after = calculateStartingSkills({ aptitudes: { wil: 15 }, packages, traits: [psi(1)] });
  const row = psiRow(after);
  assert.deepEqual([after.pendingPsiPoints, row.aptitude, row.base, row.total, row.excess], [0, 'wil', 15, 105, 25]);
  assert.deepEqual(row.grants, [{ source: 'Lost', points: 50 }, { source: 'Async', points: 40 }]);
  assert.equal(psiRow(calculateStartingSkills({ aptitudes: {}, packages, traits: [psi(2)] })).total, undefined);
});

test('Psi purchases and transfers replay when the prerequisite is restored', () => {
  const input = {
    aptitudes: { wil: 15, sav: 15 },
    packages: { background: { id: 'lost' } },
    skillTransfers: [{ from: 'active:Deceive', to: 'active:Psi', points: 5 }],
    skillPurchases: [{ to: 'active:Psi', points: 5 }],
  };
  const invalid = calculateStartingSkills(input);
  assert.match(invalid.transferResults[0].issue, /Psi trait/);
  assert.match(invalid.purchaseResults[0].issue, /Psi trait/);
  assert.equal(evaluateAptitudeBudget({}, input.skillPurchases).skillCp, 1);
  assert.equal(psiRow(calculateStartingSkills({ ...input, traits: [psi(2)] })).total, 75);
});

test('all five sub-strains offer a level-one sleight and their listed required drawbacks grant zero CP', () => {
  assert.equal(psiSubStrains.length, 5);
  for (const strain of psiSubStrains) {
    const basic = traceStartingPsi({ traits: [psi(1)], psi: { subStrain: strain.id } });
    assert.ok(basic.sleights.length > 0 && basic.sleights.every(({ minimumLevel }) => minimumLevel === 1));
    const config = { subStrain: strain.id, drawback: strain.drawbacks[0], freeSleight: strain.sleights.at(-1).name };
    const complete = traceStartingPsi({ traits: [psi(2)], psi: config, packages });
    assert.deepEqual(complete.selection, config);
    assert.deepEqual(complete.requiredBy, ['Lost', 'Async']);
    assert.deepEqual(evaluateAptitudeBudget({}, [], { traits: [psi(2)] }).traitBudget, { cost: 4, bonus: 0 });
  }
  const gamma = { subStrain: 'stranger', drawback: 'Paranoia', freeSleight: 'Subliminal' };
  assert.deepEqual(traceStartingPsi({ traits: [psi(1)], psi: gamma }).selection, { subStrain: 'stranger', drawback: 'Paranoia' });
  assert.equal(traceStartingPsi({ psi: gamma }).selection, undefined);
});

test('Psi levels determine Infection Rating and unlock Unknown Hardening without changing skill ratings', () => {
  const unknown = { id: 'hardening', level: 1, detail: 'Unknown' };
  for (const level of [1, 2]) {
    const traits = [unknown, psi(level)];
    const stats = traceDerivedEgoStats({ aptitudes: {}, traits });
    assert.equal(stats.find(({ id }) => id === 'infection-rating').total, 10 * level);
    assert.equal(evaluateAptitudeBudget({}, [], { traits }).traitBudget.cost, 2 * level + 1);
    assert.equal(traceAptitudeChecks({ wil: 15 }, traits).find(({ id }) => id === 'wil').target, 35);
  }
  assert.equal(traceDerivedEgoStats({ aptitudes: {}, traits: [unknown] }).length, 4);
  assert.equal(evaluateAptitudeBudget({}, [], { traits: [unknown] }).traitBudget.cost, 0);
});

test('backups preserve valid or partial Psi choices and reject invalid drawbacks and sleight eligibility', () => {
  const config = { subStrain: 'stranger', drawback: 'Paranoia', freeSleight: 'Subliminal' };
  const character = draft({ traits: [{ id: 'hardening', level: 1, detail: 'Unknown' }, psi(2)], psi: config, packages });
  assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  const replay = recordResleeving(character, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  for (const audience of ['player', 'gm']) {
    const print = buildPrintableDossier(replay, audience, []);
    assert.deepEqual(print.psi.selection, config);
    assert.equal(print.derivedStats.find(({ id }) => id === 'infection-rating').total, 20);
  }
  const pending = draft({ packages });
  assert.deepEqual(previewBackup(encodeBackup([pending])).drafts[0], pending);
  for (const [details, error] of [
    [{ psi: config }, /present only with the Psi trait/],
    [{ traits: [psi(1)], psi: config }, /allowed for the sub-strain and Psi level/],
    [{ traits: [psi(2)], psi: { ...config, drawback: 'Insomnia' } }, /drawback for the selected sub-strain/],
    [{ traits: [psi(2)], psi: { ...config, subStrain: 'invalid' } }, /supported starting sub-strain/],
  ]) {
    assert.throws(() => previewBackup(encodeBackup([draft(details)])), error);
  }
});

test('the core catalogue gates 20 psi-chi and 37 psi-gamma sleights by Psi level', () => {
  const basic = traceStartingPsi({ traits: [psi(1)] });
  const full = traceStartingPsi({ traits: [psi(2)] });
  assert.equal(basic.purchaseOptions.length, 20);
  assert.ok(basic.purchaseOptions.every(({ minimumLevel }) => minimumLevel === 1));
  assert.equal(full.purchaseOptions.length, 57);
  assert.equal(new Set(psiSleights.map(({ name }) => name)).size, 57);
  assert.deepEqual(traceStartingPsi({}).purchaseOptions, []);
});

test('purchases share the CP budget, allow ten in addition to the free sleight, and recheck eligibility', () => {
  const config = { subStrain: 'architect', freeSleight: 'Grok' };
  const chi = psiSleights.filter(({ name, minimumLevel }) => name !== 'Grok' && minimumLevel === 1)
    .map(({ name }) => name);
  const choices = { traits: [psi(2)], psi: config, psiSleightPurchases: ['Grok', 'Grok', 'Mindlink', ...chi.slice(0, 10)] };
  const trace = traceStartingPsi(choices);
  assert.equal(trace.freeSleight.name, 'Grok');
  assert.deepEqual(trace.purchasedNames, ['Mindlink', ...chi.slice(0, 9)]);
  assert.equal(trace.discardedPurchases, 3);
  assert.ok(trace.purchaseOptions.every(({ name }) => name !== 'Grok' && !trace.purchasedNames.includes(name)));
  const budget = evaluateAptitudeBudget({}, [{ to: 'active:Psi', points: 5 }], { ...choices, egoFlex: 2 });
  assert.deepEqual([budget.sleightCp, budget.totalCp, budget.cpLeft], [10, 17, 3]);
  const downgraded = traceStartingPsi({ ...choices, traits: [psi(1)] });
  assert.deepEqual(downgraded.purchasedNames, chi.slice(0, 10));
  assert.equal(evaluateAptitudeBudget({}, [], { ...choices, traits: [] }).sleightCp, 0);
  assert.deepEqual(traceStartingPsi(choices).purchasedNames, trace.purchasedNames);
  assert.equal(traceStartingPsi({
    ...choices, psi: { ...config, freeSleight: 'Enhanced Creativity' },
  }).purchasedNames[0], 'Grok');
});

test('paid sleights survive backup, resleeving, and print, while invalid purchases are rejected', () => {
  const traits = [psi(2)];
  const psiSleightPurchases = ['Charisma', 'Mindlink'];
  const character = draft({ traits, psiSleightPurchases });
  assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  const replay = recordResleeving(character, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, updatedAt);
  for (const audience of ['player', 'gm']) {
    const { psi: printPsi } = buildPrintableDossier(replay, audience, []);
    assert.deepEqual(printPsi.purchasedNames, psiSleightPurchases);
    assert.equal(printPsi.purchaseCp, 2);
  }
  for (const details of [
    { traits: [] },
    { traits: [psi(1)] },
    { psiSleightPurchases: ['Unknown sleight'] },
    { psiSleightPurchases: ['Mindlink', 'Mindlink'] },
    { psi: { subStrain: 'architect', freeSleight: 'Grok' }, psiSleightPurchases: ['Grok'] },
    { psiSleightPurchases: psiSleights.slice(0, 11).map(({ name }) => name) },
    { psiSleightPurchases: 'Mindlink' },
  ]) {
    assert.throws(() => previewBackup(encodeBackup([draft({ traits, psiSleightPurchases, ...details })])), /psiSleightPurchases/);
  }
});
