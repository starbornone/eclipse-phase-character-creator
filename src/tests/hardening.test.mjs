import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { scopedEgoTraitIssue } from '../rules/calculations/ego-traits.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { traceSkillSpecializations } from '../rules/calculations/skill-specializations.ts';
import { supportedHardeningStressTypes } from '../rules/datasets/ego-traits.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';

const scores = { cog: 15, int: 15, ref: 15, sav: 15, som: 15, wil: 15 };
const traits = supportedHardeningStressTypes.map((detail) => ({ id: 'hardening', level: 1, detail }));
const packages = { career: { id: 'face' }, interest: { id: 'networker' } };
const ledger = (choices, extra = {}) => calculateStartingSkills({ aptitudes: scores, packages, traits: choices, ...extra });
const persuade = (result) => result.skills.find(({ id }) => id === 'active:Persuade');
const draft = (choices) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt: '2026-11-27T08:00:00.000Z',
  ego: { id: 'hardening-test', name: 'Hardening test', pronouns: '', concept: '', aptitudes: scores, packages, traits: choices }, sleeves: [],
});

test('Hardening supports three non-Psi stress types and validates each distinct purchase', () => {
  assert.deepEqual(supportedHardeningStressTypes, ['Alienation', 'Helplessness', 'Violence']);
  for (const choice of traits) assert.equal(scopedEgoTraitIssue(choice), undefined);
  assert.match(scopedEgoTraitIssue({ ...traits[0], detail: ' ALIENATION ' }, traits), /already recorded/);
  for (const detail of ['', 'Unknown', 'the unknown', 'Fear']) assert.ok(scopedEgoTraitIssue({ ...traits[0], detail }));
  assert.match(scopedEgoTraitIssue({ ...traits[0], network: 'r-rep' }), /does not use/);
});

test('each Hardening purchase costs one positive CP and cumulatively reduces WIL Checks', () => {
  for (const count of [1, 2, 3]) {
    const choices = traits.slice(0, count);
    const check = traceAptitudeChecks(scores, choices).find(({ id }) => id === 'wil');
    assert.deepEqual([check.base, check.modifier, check.target], [15, -10 * count, 45 - 10 * count]);
    assert.deepEqual(check.modifiers.map(({ source, points }) => [source, points]), choices.map(({ detail }) => [`Hardening (${detail})`, -10]));
    const budget = evaluateAptitudeBudget(scores, [], { traits: choices });
    assert.deepEqual([budget.traitBudget.cost, budget.traitBudget.bonus, budget.cpLeft], [count, 0, 20 - count]);
  }
  const mixed = traceAptitudeChecks(scores, [...traits, { id: 'resolve', level: 3 }]).find(({ id }) => id === 'wil');
  assert.equal(mixed.target, 30);
});

test('missing WIL and Persuade aptitudes stay pending while keeping penalty traces', () => {
  const check = traceAptitudeChecks({}, traits).find(({ id }) => id === 'wil');
  assert.equal(check.target, undefined); assert.equal(check.modifier, -30);
  const skill = persuade(ledger(traits, { aptitudes: {} }));
  assert.equal(skill.total, undefined); assert.equal(skill.testTarget, undefined); assert.equal(skill.testModifier, -30);
});

test('unsupported or incomplete Hardening scopes cannot affect pure checks, skills or the CP budget', () => {
  const invalid = [
    { ...traits[0], detail: 'Unknown' }, { ...traits[0], detail: '' },
    { ...traits[0], network: 'r-rep' }, { ...traits[0], level: 2 },
  ];
  assert.deepEqual(traceAptitudeChecks(scores, invalid), traceAptitudeChecks(scores));
  assert.deepEqual(ledger(invalid).skills, ledger([]).skills);
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: invalid }).traitBudget.cost, 0);
});

test('Persuade Test penalties do not lower its rating or hide excess skill points', () => {
  const result = ledger(traits);
  const skill = persuade(result);
  assert.deepEqual([skill.total, skill.excess, skill.testModifier, skill.testTarget], [115, 35, -30, 85]);
  assert.equal(skill.packagePoints, 100);
  assert.equal(result.skills.find(({ name }) => name === 'Deceive').testModifier, 0);
  const capped = ledger(traits, { skillTransfers: [{ from: 'active:Persuade', to: 'active:Guns', points: 35 }] });
  assert.equal(capped.transferResults[0].issue, undefined);
  assert.deepEqual([persuade(capped).total, persuade(capped).testTarget, persuade(capped).excess], [80, 50, 0]);
});

test('test penalties cannot buy above the starting skill cap and removing Hardening restores targets', () => {
  const extra = { packages: { career: { id: 'face' } }, skillPurchases: [{ to: 'active:Persuade', points: 10 }] };
  assert.match(ledger(traits, extra).purchaseResults[0].issue, /above the starting cap/);
  assert.equal(persuade(ledger(traits.slice(0, 1))).testTarget, 105);
  assert.equal(persuade(ledger([])).testTarget, 115);
  assert.equal(persuade(ledger([])).total, persuade(ledger(traits)).total);
});

test('Persuade specializations include Hardening once after allocations, with the situational bonus', () => {
  const specialization = [{ skillId: 'active:Persuade', name: 'Negotiation' }];
  const result = ledger(traits, { skillTransfers: [{ from: 'active:Persuade', to: 'active:Guns', points: 35 }] });
  assert.equal(traceSkillSpecializations(result.skills, specialization)[0].target, 60);
  assert.equal(traceSkillSpecializations(ledger(traits, { aptitudes: {} }).skills, specialization)[0].target, undefined);
});

test('backups round-trip distinct Hardening choices and reject duplicates, Unknown and malformed scopes', () => {
  const character = draft(traits);
  assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  for (const choices of [
    [traits[0], { ...traits[0], detail: ' alienation ' }],
    [{ ...traits[0], detail: 'Unknown' }], [{ ...traits[0], detail: 'Fear' }], [{ ...traits[0], detail: undefined }],
    [{ ...traits[0], level: 2 }], [{ ...traits[0], network: 'r-rep' }], [{ ...traits[0], skillId: 'active:Persuade' }],
  ]) assert.throws(() => previewBackup(encodeBackup([draft(choices)])), /must be/);
});

test('both print models retain cumulative penalties, the raw skill rating and source-specific traits', () => {
  for (const audience of ['player', 'gm']) {
    const printed = buildPrintableDossier(draft(traits), audience, []);
    assert.equal(printed.checks.find(({ id }) => id === 'wil').target, 15);
    assert.deepEqual([persuade(printed.skillLedger).total, persuade(printed.skillLedger).testTarget], [115, 85]);
    assert.deepEqual(printed.traits, traits);
  }
});
