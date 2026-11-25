import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyBackupDrafts, encodeBackup, previewBackup } from '../features/backup/backup.ts';

const updatedAt = '2026-11-25T01:00:00.000Z';
const ego = { id: 'ego-1', name: 'Test ego', pronouns: '', concept: 'Explorer', aptitudes: { int: 15, wil: 0 } };
const firstSleeve = { id: 'sleeve-1', egoId: ego.id, morphDefinitionId: 'bouncer', assignedAt: updatedAt };
const event = { date: '2024-02-29', location: 'Habitat', cause: 'Transfer', notes: 'History note' };
const nextSleeve = { ...firstSleeve, id: 'sleeve-2', morphDefinitionId: 'case', event };
const draft = { schemaVersion: 2, revision: 4, rulesVersion: 'ep2-quick-start-2.4', updatedAt, ego, sleeves: [firstSleeve, nextSleeve] };

test('round-trip partial aptitude scores, sleeve order, and event details', () => {
  assert.deepEqual(previewBackup(encodeBackup([draft])), { drafts: [draft], migratedCount: 0 });
});

test('round-trip core package choices and reject unknown packages and field slots', () => {
  const packages = {
    background: { id: 'freelancer', fields: { 'know-1': 'Habitat Ops' } },
    faction: { id: 'factionless', fields: { 'know-1': 'Local Politics' }, motivation: '+Open access' },
  };
  const withPackages = { ...draft, ego: { ...ego, packages, artisticKnowFields: ['local politics'] } };
  assert.deepEqual(previewBackup(encodeBackup([withPackages])).drafts[0], withPackages);
  const invalidChoice = { ...draft, ego: { ...ego, packages: { career: { id: 'freelancer' } } } };
  assert.throws(() => previewBackup(encodeBackup([invalidChoice])), /supported choice for this category/);
  const invalidSlot = { ...draft, ego: { ...ego, packages: { faction: { id: 'argonaut', fields: { 'know-1': 'Politics' } } } } };
  assert.throws(() => previewBackup(encodeBackup([invalidSlot])), /limited to slots/);
});

test('report a version 1 draft migration and retain its sleeve', () => {
  const { sleeves, ...fields } = draft;
  const oldDraft = { ...fields, schemaVersion: 1, sleeve: sleeves[0] };
  const preview = previewBackup(encodeBackup([oldDraft]));
  assert.deepEqual(preview, { drafts: [{ ...draft, sleeves: [firstSleeve] }], migratedCount: 1 });
});

test('reject malformed JSON, unsupported formats, and incomplete or conflicting records', () => {
  assert.throws(() => previewBackup('{'), /invalid JSON/);
  assert.throws(() => previewBackup('{}'), /Eclipse Phase character backup/);
  assert.throws(() => previewBackup(encodeBackup([])), /zero drafts/);
  const unsupported = { ...JSON.parse(encodeBackup([draft])), version: 2 };
  assert.throws(() => previewBackup(JSON.stringify(unsupported)), /unsupported/);
  assert.throws(() => previewBackup(encodeBackup([draft, draft])), /ego ids must be unique/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [firstSleeve, firstSleeve] }])), /sleeve ids must be unique/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [{ ...firstSleeve, egoId: 'another-ego' }] }])), /id of its draft/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, ego: { ...ego, aptitudes: { int: 100 } } }])), /whole number/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [{ ...nextSleeve, event: { ...event, date: '2025-02-29' } }] }])), /calendar date/);
});

test('give restored copies new ego and sleeve ids while preserving their content', () => {
  let sequence = 0;
  const [copy] = copyBackupDrafts([draft], () => `new-${++sequence}`);
  assert.equal(copy.revision, 1);
  assert.equal(copy.ego.id, 'new-1');
  assert.equal(copy.updatedAt, draft.updatedAt);
  assert.deepEqual(copy.sleeves, [
    { ...firstSleeve, id: 'new-2', egoId: 'new-1' },
    { ...nextSleeve, id: 'new-3', egoId: 'new-1' },
  ]);
  assert.equal(draft.ego.id, 'ego-1');
});
