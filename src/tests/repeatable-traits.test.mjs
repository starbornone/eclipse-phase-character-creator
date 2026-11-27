import assert from 'node:assert/strict';
import { test } from 'node:test';
import { egoTraitChoiceKey, evaluateEgoTraitBudget, scopedEgoTraitIssue, traceEgoTraits } from '../rules/calculations/ego-traits.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';

const contact = { id: 'contact', level: 1, detail: 'Dr. Vega', network: 'r-rep' };
const familiarity = { id: 'morph-familiarity', level: 1, detail: 'Bouncer' };
const traits = [contact, { ...contact, detail: 'Mira', network: 'i-rep' }, familiarity, { ...familiarity, detail: 'Synth' }];
const scores = { cog: 15, int: 15, ref: 15, sav: 15, som: 15, wil: 15 };
const draft = (choices) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt: '2026-11-27T08:00:00.000Z',
  ego: { id: 'repeat-test', name: 'Repeat test', pronouns: '', concept: '', aptitudes: scores, traits: choices },
  sleeves: [{ id: 'first', egoId: 'repeat-test', morphDefinitionId: 'bouncer', assignedAt: '2026-11-27T08:00:00.000Z' }],
});

test('each contact and familiar morph is a separate one-CP purchase and removing one releases only its cost', () => {
  assert.deepEqual(evaluateEgoTraitBudget(traits), { cost: 4, bonus: 0 });
  const mixed = [...traits, { id: 'adaptability', level: 2 }, { id: 'enemy', level: 1 }];
  const budget = evaluateAptitudeBudget(scores, [], { traits: mixed });
  assert.deepEqual([budget.totalCp, budget.availableCp, budget.cpLeft], [8, 22, 14]);
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: mixed.slice(1) }).cpLeft, 15);
  assert.deepEqual(traceAptitudeChecks(scores, traits), traceAptitudeChecks(scores));
});

test('repeatable trait identities normalize spacing, case and Unicode while retaining distinct scopes', () => {
  assert.equal(egoTraitChoiceKey(contact), egoTraitChoiceKey({ ...contact, detail: '  dr.   VEGA  ' }));
  assert.equal(egoTraitChoiceKey({ ...familiarity, detail: 'Néomorph' }), egoTraitChoiceKey({ ...familiarity, detail: 'Ne\u0301omorph' }));
  assert.notEqual(egoTraitChoiceKey(contact), egoTraitChoiceKey({ ...contact, network: 'i-rep' }));
  assert.notEqual(egoTraitChoiceKey(contact), egoTraitChoiceKey({ ...contact, detail: 'Mira' }));
  assert.equal(egoTraitChoiceKey({ id: 'expert-training', level: 1, skillId: 'active:Guns' }), 'expert-training');
  assert.match(scopedEgoTraitIssue({ ...familiarity, detail: ' BOUNCER ' }, traits), /already recorded/);
  assert.equal(scopedEgoTraitIssue({ ...familiarity, detail: 'Ruster' }, traits), undefined);
});

test('scoped traits require a name or morph type and Contact requires a supported rep network', () => {
  assert.match(scopedEgoTraitIssue({ ...contact, detail: ' ' }), /contact name/);
  assert.match(scopedEgoTraitIssue({ ...familiarity, detail: ' ' }), /morph type/);
  assert.match(scopedEgoTraitIssue({ ...contact, detail: 'x'.repeat(101) }), /1–100/);
  assert.match(scopedEgoTraitIssue({ ...contact, network: undefined }), /reputation network/);
  assert.match(scopedEgoTraitIssue({ ...contact, network: 'unknown' }), /reputation network/);
  assert.match(scopedEgoTraitIssue({ ...familiarity, network: 'r-rep' }), /does not use/);
});

test('backups preserve repeated traits and normalize their details without changing legacy trait records', () => {
  const character = draft([...traits, { id: 'common-sense', level: 1 }]);
  assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  const normalized = previewBackup(encodeBackup([draft([{ ...contact, detail: '  Dr.   Vega  ' }])])).drafts[0];
  assert.deepEqual(normalized.ego.traits, [contact]);
  assert.deepEqual(previewBackup(encodeBackup([draft([{ id: 'adaptability', level: 2 }])])).drafts[0].ego.traits, [{ id: 'adaptability', level: 2 }]);
});

test('backup validation rejects duplicate scopes and malformed scoped traits before restoration', () => {
  const invalid = [
    [contact, { ...contact, detail: ' dr.  VEGA ' }],
    [familiarity, { ...familiarity, detail: ' bouncer ' }],
    [{ ...contact, network: 'invalid' }], [{ ...contact, network: undefined }],
    [{ ...contact, detail: undefined }], [{ ...contact, detail: 42 }], [{ ...contact, detail: ' ' }],
    [{ ...familiarity, network: 'r-rep' }], [{ ...familiarity, level: 2 }],
    [{ ...familiarity, detail: 'x'.repeat(101) }], [{ ...contact, skillId: 'active:Guns' }],
    [{ id: 'adaptability', level: 1, detail: 'Bouncer' }],
    [{ id: 'expert-training', level: 1, skillId: 'active:Guns', network: 'r-rep' }],
  ];
  for (const choices of invalid) assert.throws(() => previewBackup(encodeBackup([draft(choices)])), /must be/);
  assert.throws(() => previewBackup(encodeBackup([draft([{ id: 'adaptability', level: 1 }, { id: 'adaptability', level: 2 }])])), /unique/);
});

test('repeatable traits retain scope and separate summary keys in both print audiences', () => {
  const traced = traceEgoTraits(traits);
  assert.equal(new Set(traced.map(({ key }) => key)).size, 4);
  assert.deepEqual(traced.map(({ detail, network, cp }) => [detail, network, cp]), [
    ['Dr. Vega', 'r-rep', 1], ['Mira', 'i-rep', 1], ['Bouncer', undefined, 1], ['Synth', undefined, 1],
  ]);
  for (const audience of ['player', 'gm']) {
    const printed = buildPrintableDossier(draft(traits), audience, []);
    assert.deepEqual(printed.traits, traits);
    assert.deepEqual(printed.checks, traceAptitudeChecks(scores));
  }
});

test('resleeving carries Contact and Morph Familiarity with the ego without changing their scopes', () => {
  const before = draft(traits);
  const after = recordResleeving(before, 'second', 'synth', { date: '', location: '', cause: '', notes: '' }, '2026-11-27T09:00:00.000Z');
  assert.deepEqual(after.ego.traits, traits);
  assert.equal(after.sleeves.length, 2);
  assert.equal(before.sleeves.length, 1);
});
