import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseAptitudes, traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { findSampleMorph, quickStartPageUrl, sampleMorphs } from '../rules/datasets/sample-morphs.ts';

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
    id: 'int', label: 'Intuition', base: 15, multiplier: 3, modifiers: [], modifier: 0, target: 45,
  });
  assert.equal(traceAptitudeChecks({}).find((stat) => stat.id === 'int').target, undefined);
  assert.equal(traceAptitudeChecks({ cog: 0 })[0].target, 0);
});

test('offer sourced morph health profiles and retain legacy sleeves for existing drafts', () => {
  const quickStartProfiles = sampleMorphs.filter(({ category }) => category !== 'Infomorph');
  assert.deepEqual(quickStartProfiles.map(({ id, durability, woundThreshold, deathRating, source }) => (
    [id, durability, woundThreshold, deathRating, source.url]
  )), [
    ['bouncer', 35, 7, 53, quickStartPageUrl(24)],
    ['case', 25, 5, 50, quickStartPageUrl(25)],
    ['synth', 40, 8, 80, quickStartPageUrl(25)],
  ]);
  assert.equal(findSampleMorph('survey-sleeve')?.name, 'Survey Sleeve');
  assert.equal(findSampleMorph('unknown'), undefined);
});

test('all four core infomorphs retain the published health, costs, pools and individual sources', () => {
  const infomorphs = sampleMorphs.filter(({ category }) => category === 'Infomorph');
  assert.deepEqual(infomorphs.map(({ id, durability, woundThreshold, deathRating, morphPoints, pools }) => (
    [id, durability, woundThreshold, deathRating, morphPoints, pools.insight, pools.moxie, pools.vigor, pools.flex]
  )), [
    ['digimorph', 25, 5, 50, 0, 0, 0, 0, 0],
    ['ikon', 30, 6, 60, 1, 1, 3, 0, 0],
    ['agent', 40, 8, 80, 2, 4, 0, 0, 0],
    ['operator', 35, 7, 70, 2, 3, 0, 0, 1],
  ]);
  for (const morph of infomorphs) {
    assert.ok(morph.source.url.endsWith(`04/26-infomorphs.html#${morph.id}`));
    assert.equal(findSampleMorph(morph.id), morph);
  }
});
