import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAptitudes, traceAptitudes } from '../rules/calculations/draft.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';

const blank = { cog: '', int: '', ref: '', sav: '', som: '', wil: '' };

test('omit blank aptitudes while preserving an entered zero', () => {
  assert.deepEqual(parseAptitudes({ ...blank, int: '0', ref: ' 15 ' }), {
    scores: { int: 0, ref: 15 },
  });
});

test('identify the field for an invalid prototype aptitude', () => {
  for (const invalid of ['-1', '100', '1.5', '1e1', 'abc']) {
    assert.equal(parseAptitudes({ ...blank, wil: invalid }).issue?.id, 'wil');
  }
});

test('trace the morph contribution without inventing an unentered base', () => {
  const morph = findSampleMorph('survey-sleeve');
  const intuition = traceAptitudes({ int: 12 }, morph).find((stat) => stat.id === 'int');
  assert.deepEqual(intuition, {
    id: 'int', label: 'Intuition', base: 12, adjustment: 5, total: 17,
  });
  assert.equal(traceAptitudes({}, morph).find((stat) => stat.id === 'int').total, undefined);
  assert.equal(traceAptitudes({ cog: 0 })[0].total, 0);
});
