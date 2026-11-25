import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPrintableDossier, privatePrintFields } from '../features/dossier/print.ts';

const assignedAt = '2026-11-25T01:00:00.000Z';
const event = { date: '2026-11-20', location: 'Private habitat', cause: 'Private cause', notes: 'Private notes' };
const draft = {
  schemaVersion: 2,
  rulesVersion: 'ep2-quick-start-2.4',
  revision: 2,
  updatedAt: assignedAt,
  ego: { id: 'ego', name: 'Explorer', pronouns: 'they/them', concept: 'A cartographer', aptitudes: { int: 15 } },
  sleeves: [
    { id: 'first', egoId: 'ego', morphDefinitionId: 'bouncer', assignedAt },
    { id: 'second', egoId: 'ego', morphDefinitionId: 'synth', assignedAt, event },
  ],
};

test('player output excludes history even when private fields are requested', () => {
  const dossier = buildPrintableDossier(draft, 'player', privatePrintFields.map(({ id }) => id));
  assert.equal(dossier.concept, 'A cartographer');
  assert.equal(dossier.morph.name, 'Synth');
  assert.equal(dossier.checks.find(({ id }) => id === 'int').target, 45);
  assert.deepEqual(dossier.history, []);
  assert.doesNotMatch(JSON.stringify(dossier), /Private|2026-11-20/);
});

test('GM output exposes only explicitly selected sleeve fields', () => {
  const summary = buildPrintableDossier(draft, 'gm', []);
  assert.deepEqual(summary.history.map(({ morphName, active }) => [morphName, active]), [
    ['Synth', true], ['Bouncer', false],
  ]);
  assert.doesNotMatch(JSON.stringify(summary), /Private|2026-11-20/);
  const filtered = buildPrintableDossier(draft, 'gm', ['date', 'notes']);
  assert.equal(filtered.history[0].date, event.date);
  assert.equal(filtered.history[0].notes, event.notes);
  assert.equal(filtered.history[0].location, undefined);
  assert.equal(filtered.history[0].cause, undefined);
  assert.equal(filtered.history[1].date, assignedAt);
});

test('an unassigned draft can be printed before choosing a morph', () => {
  const dossier = buildPrintableDossier({ ...draft, sleeves: [] }, 'gm', []);
  assert.equal(dossier.hasSleeve, false);
  assert.equal(dossier.morph, undefined);
  assert.deepEqual(dossier.history, []);
  assert.equal(dossier.egoFlex, 1);
  assert.deepEqual(dossier.languages, []);
});

test('show recorded ego Flex and languages for both audiences', () => {
  const withCustomization = { ...draft, ego: { ...draft.ego, egoFlex: 3, languages: ['English', 'Mandarin'] } };
  for (const audience of ['player', 'gm']) {
    const { egoFlex, languages } = buildPrintableDossier(withCustomization, audience, []);
    assert.equal(egoFlex, 3);
    assert.deepEqual(languages, ['English', 'Mandarin']);
  }
});
