import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { traceResleevingTests } from '../rules/calculations/resleeving.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';

test('resleeving targets apply Adaptability to both checks and Exotic Morphology to Integration', () => {
  const ego = { aptitudes: { som: 10, wil: 20 }, traits: [{ id: 'adaptability', level: 1 }] };
  const morph = findSampleMorph('operator');
  const tests = traceResleevingTests(ego, morph);
  assert.deepEqual([tests.integration.target, tests.stress.target], [10, 70]);
  assert.deepEqual(tests.integration.modifiers, [
    { source: 'Adaptability', level: 1, points: 10 },
    { source: 'Exotic Morphology', level: 3, points: -30 },
  ]);
  const waived = traceResleevingTests(ego, morph, true);
  assert.equal(waived.integration.target, 40);
  assert.deepEqual(waived.stress, tests.stress);
  const bouncer = traceResleevingTests(ego, findSampleMorph('bouncer'));
  const synth = traceResleevingTests(ego, findSampleMorph('synth'));
  assert.deepEqual([bouncer.integration.target, synth.integration.target], [40, 30]);
});

test('targets use the prospective sleeve and keep conditional traits out of the arithmetic', () => {
  const morph = findSampleMorph('operator');
  const proposed = { ...morph, includedTraits: [...morph.includedTraits, { id: 'feebleness', level: 1 }, { id: 'resolve', level: 2 }] };
  const ego = {
    aptitudes: { som: 15, wil: 15 }, traits: [
      { id: 'fitness', level: 1 }, { id: 'resolve', level: 2 }, { id: 'hardening', level: 1, detail: 'Violence' },
      { id: 'adaptability', level: 2 }, { id: 'morphing-disorder', level: 2 }, { id: 'identity-crisis', level: 1 },
    ],
  };
  const tests = traceResleevingTests(ego, proposed);
  assert.deepEqual([tests.integration.target, tests.stress.target, tests.hasIdentityCrisis], [15, 55, true]);
  assert.deepEqual(tests.integration.modifiers.map(({ source }) => source), [
    'Fitness', 'Feebleness (morph)', 'Adaptability', 'Morphing Disorder', 'Exotic Morphology',
  ]);
  assert.deepEqual(tests.stress.modifiers.map(({ source }) => source), [
    'Resolve', 'Hardening (Violence)', 'Resolve (morph)', 'Adaptability', 'Morphing Disorder',
  ]);
});

test('Morph Familiarity waives Integration for its normalized named type only and missing scores remain pending', () => {
  const traits = [{ id: 'morphing-disorder', level: 1 }, { id: 'morph-familiarity', level: 1, detail: '  oPeRaToR  ' }];
  const traitsWithScores = { aptitudes: { som: 15, wil: 15 }, traits };
  const familiar = traceResleevingTests(traitsWithScores, findSampleMorph('operator'));
  assert.equal(familiar.familiar, true);
  assert.equal(familiar.integration, undefined);
  assert.equal(familiar.stress.target, 35);
  const pending = traceResleevingTests({ aptitudes: {}, traits }, findSampleMorph('agent'));
  assert.equal(pending.familiar, false);
  assert.equal(pending.integration.target, undefined);
  assert.equal(pending.integration.modifier, -40);
  assert.equal(pending.stress.target, undefined);
  assert.equal(pending.stress.modifier, -10);
});

test('Morphing Disorder levels use the shared CP cap and round-trip with their print summaries', () => {
  const updatedAt = '2026-11-28T00:00:00.000Z';
  const character = (traits) => ({
    schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt,
    ego: { id: 'resleeving-tests', name: 'Resleeving tests', pronouns: '', concept: '', aptitudes: {}, traits },
    sleeves: [],
  });
  for (const level of [1, 2, 3]) {
    const traits = [{ id: 'morphing-disorder', level }];
    const draft = character(traits);
    assert.equal(evaluateAptitudeBudget({}, [], { traits }).traitBudget.bonus, level * 2);
    assert.deepEqual(previewBackup(encodeBackup([draft])).drafts[0], draft);
    for (const audience of ['player', 'gm']) {
      assert.deepEqual(buildPrintableDossier(draft, audience, []).traits, traits);
    }
  }
  const overCap = character([{ id: 'morphing-disorder', level: 3 }, { id: 'identity-crisis', level: 1 }]);
  assert.throws(() => previewBackup(encodeBackup([overCap])), /6 CP limit/);
});
