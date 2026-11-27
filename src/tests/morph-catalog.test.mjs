import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeMovement, digitalMovement, filterMorphs, morphCapabilities, morphFilterOptions } from '../rules/calculations/morph-catalog.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';

test('additional player profiles have verified costs, availability, health, pools and sources', () => {
  const rows = [
    ['flat', 0, 30, 6, 30, 45, [0, 0, 0, 0]], ['splicer', 1, 90, 6, 30, 45, [0, 0, 0, 1]],
    ['ruster', 3, 70, 7, 35, 53, [0, 1, 1, 1]], ['futura', 4, 25, 7, 35, 53, [2, 4, 1, 0]],
    ['hibernoid', 4, 70, 7, 35, 53, [1, 1, 0, 2]], ['spare', 0, 80, 3, 15, 30, [0, 1, 0, 0]],
    ['dragonfly', 1, 70, 5, 25, 50, [1, 0, 1, 0]], ['slitheroid', 5, 50, 9, 45, 90, [0, 1, 3, 0]],
    ['arachnoid', 6, 40, 11, 55, 110, [1, 0, 3, 0]],
  ];
  assert.equal(new Set(sampleMorphs.map(({ id }) => id)).size, 16);
  for (const [id, cost, availability, wt, dur, dr, pools] of rows) {
    const morph = findSampleMorph(id);
    assert.deepEqual([morph.morphPoints, morph.availability, morph.woundThreshold, morph.durability, morph.deathRating], [cost, availability, wt, dur, dr]);
    assert.deepEqual([morph.pools.insight, morph.pools.moxie, morph.pools.vigor, morph.pools.flex], pools);
    assert.ok(morph.source.url.endsWith(`#${id}`));
  }
  assert.match(describeMovement(findSampleMorph('arachnoid')), /Thrust Vector \(Gas Jet\) 8\/40/);
  assert.equal(describeMovement(findSampleMorph('dragonfly')), 'Walker 2/8, Winged 8/32');
  assert.equal(describeMovement(findSampleMorph('operator')), digitalMovement);
  assert.equal(describeMovement(findSampleMorph('survey-sleeve')), undefined);
});

test('price and durability bounds combine with movement, category, search and capabilities', () => {
  const ids = (filters) => filterMorphs(sampleMorphs, filters).map(({ id }) => id);
  assert.deepEqual(ids({ maximumMp: 0 }), ['case', 'digimorph', 'flat', 'spare']);
  assert.deepEqual(ids({ minimumDurability: 45, movement: 'Roller' }), ['slitheroid']);
  assert.deepEqual(ids({ maximumMp: 1, minimumDurability: 25, category: 'Synthmorph', movement: 'Winged', capability: 'Vacuum Sealing', query: '  radar wings  ' }), ['dragonfly']);
  assert.deepEqual(ids({ movement: digitalMovement, capability: 'Drone Rig' }), ['operator']);
  assert.deepEqual(ids({ category: 'Infomorph', movement: 'Walker' }), []);
  assert.deepEqual(ids({ query: 'spare', capability: 'Cortical Stack' }), []);
  assert.deepEqual(ids({ query: 'ruster', capability: 'Radiation Sense' }), ['ruster']);
  assert.deepEqual(morphCapabilities(findSampleMorph('flat')), []);
  assert.deepEqual(morphCapabilities(findSampleMorph('industrial-frame')), []);
});

test('filters expose published options and sort without mutating the catalogue', () => {
  const options = morphFilterOptions(sampleMorphs);
  assert.deepEqual(options.costs, [0, 1, 2, 3, 4, 5, 6]);
  assert.ok(options.movement.includes(digitalMovement));
  assert.ok(options.movement.includes('Thrust Vector'));
  assert.ok(options.capabilities.includes('Vacuum Sealing'));
  assert.equal(options.capabilities.filter((name) => name === 'Cold Tolerance').length, 1);
  assert.deepEqual(filterMorphs(sampleMorphs, { sort: 'cost' }).slice(0, 4).map(({ id }) => id), ['case', 'digimorph', 'flat', 'spare']);
  assert.deepEqual(filterMorphs(sampleMorphs, { sort: 'durability' }).slice(0, 3).map(({ id }) => id), ['arachnoid', 'slitheroid', 'agent']);
  assert.equal(sampleMorphs[0].id, 'bouncer');
});
