import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAptitudes, traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';

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

test('trace an aptitude check using the Quick-Start example and preserve missing scores', () => {
  const intuition = traceAptitudeChecks({ int: 15 }).find((stat) => stat.id === 'int');
  assert.deepEqual(intuition, {
    id: 'int', label: 'Intuition', base: 15, multiplier: 3, target: 45,
  });
  assert.equal(traceAptitudeChecks({}).find((stat) => stat.id === 'int').target, undefined);
  assert.equal(traceAptitudeChecks({ cog: 0 })[0].target, 0);
});

test('offer sourced morph health profiles and retain legacy sleeves for existing drafts', () => {
  assert.deepEqual(sampleMorphs.map(({ id, durability, woundThreshold, deathRating, sourcePage }) => (
    [id, durability, woundThreshold, deathRating, sourcePage]
  )), [
    ['bouncer', 35, 7, 53, 24],
    ['case', 25, 5, 50, 25],
    ['synth', 40, 8, 80, 25],
  ]);
  assert.equal(findSampleMorph('survey-sleeve')?.name, 'Survey Sleeve');
  assert.equal(findSampleMorph('unknown'), undefined);
});
