import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activeSleeve, normalizeDraft, recordResleeving } from '../features/sleeve/history.ts';

const firstSleeve = {
  id: 'original-sleeve',
  egoId: 'test-ego',
  morphDefinitionId: 'survey-sleeve',
  assignedAt: '2026-11-25T00:00:00Z',
};
const legacy = {
  schemaVersion: 1,
  rulesVersion: 'prototype-1',
  revision: 4,
  updatedAt: firstSleeve.assignedAt,
  ego: { id: firstSleeve.egoId, name: 'Test ego', pronouns: '', concept: '', aptitudes: { int: 15 } },
};
const event = { date: '2026-11-20', location: ' Test habitat ', cause: 'Transfer', notes: ' Follow-up ' };
const savedAt = '2026-11-25T01:00:00Z';

test('normalize an older draft with or without its first sleeve', () => {
  const withSleeve = normalizeDraft({ ...legacy, sleeve: firstSleeve });
  assert.deepEqual(withSleeve, { ...legacy, schemaVersion: 2, sleeves: [firstSleeve] });
  assert.equal(activeSleeve(withSleeve), firstSleeve);
  assert.equal(activeSleeve(normalizeDraft(legacy)), undefined);
  assert.equal(normalizeDraft(withSleeve), withSleeve);
});

test('append a sleeve without modifying earlier records or ego data', () => {
  const draft = normalizeDraft({ ...legacy, sleeve: firstSleeve });
  const resleeved = recordResleeving(draft, 'next-sleeve', 'case', event, savedAt);
  const active = activeSleeve(resleeved);
  assert.equal(resleeved.ego, draft.ego);
  assert.equal(draft.sleeves.length, 1);
  assert.equal(resleeved.sleeves[0], firstSleeve);
  assert.equal(resleeved.revision, 5);
  assert.equal(resleeved.updatedAt, savedAt);
  assert.deepEqual(active, {
    id: 'next-sleeve',
    egoId: firstSleeve.egoId,
    morphDefinitionId: 'case',
    assignedAt: savedAt,
    event: { ...event, location: 'Test habitat', notes: 'Follow-up' },
  });
  const anotherCase = recordResleeving(resleeved, 'another-sleeve', 'case', event, savedAt);
  assert.equal(anotherCase.sleeves[1], active);
  assert.equal(activeSleeve(anotherCase).id, 'another-sleeve');
});

test('reject a resleeving without a prior sleeve or with an existing sleeve identifier', () => {
  assert.throws(() => recordResleeving(normalizeDraft(legacy), 'new', 'case', event, savedAt));
  const draft = normalizeDraft({ ...legacy, sleeve: firstSleeve });
  assert.throws(() => recordResleeving(draft, firstSleeve.id, 'case', event, savedAt));
});
