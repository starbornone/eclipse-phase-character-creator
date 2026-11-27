import assert from 'node:assert/strict';
import { test } from 'node:test';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { recordResleeving } from '../features/sleeve/history.ts';
import { deriveMorphProfile, evaluateMorphTraits } from '../rules/calculations/morph-traits.ts';
import { evaluateStartingMorphBudget } from '../rules/calculations/starting-morph-budget.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';

const entries = [
  ['acumen', 'Acumen', 'cog'], ['empathy', 'Empathy', 'sav'], ['fitness', 'Fitness', 'som'],
  ['good-instincts', 'Good Instincts', 'int'], ['quickness', 'Quickness', 'ref'], ['resolve', 'Resolve', 'wil'],
];
const penalties = [
  ['feebleness', 'Feebleness', 'som'], ['indifference', 'Indifference', 'sav'], ['obtuseness', 'Obtuseness', 'cog'],
  ['poor-coordination', 'Poor Coordination', 'ref'], ['poor-instincts', 'Poor Instincts', 'int'], ['timidity', 'Timidity', 'wil'],
];
const scores = { cog: 15, int: 15, ref: 15, sav: 15, som: 15, wil: 15 };
const draft = (traits, aptitudes = scores) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt: '2026-11-27T08:00:00.000Z',
  ego: { id: 'trait-test', name: 'Trait test', pronouns: '', concept: '', aptitudes, traits }, sleeves: [],
});

test('each aptitude trait adds five per level after multiplication and traces only its linked check', () => {
  for (const [id, name, aptitude] of entries) {
    for (const level of [1, 2, 3]) {
      const checks = traceAptitudeChecks(scores, [{ id, level }]);
      for (const check of checks) {
        assert.equal(check.base, 15);
        assert.equal(check.multiplier, 3);
        assert.equal(check.target, check.id === aptitude ? 45 + level * 5 : 45);
        assert.deepEqual(check.modifiers, check.id === aptitude ? [{ source: name, level, points: level * 5 }] : []);
      }
    }
  }
});

test('missing aptitudes remain pending with a known trait modifier, while entered zero is preserved', () => {
  for (const [id, , aptitude] of entries) {
    const trait = [{ id, level: 3 }];
    const pending = traceAptitudeChecks({}, trait).find(({ id }) => id === aptitude);
    assert.equal(pending.target, undefined);
    assert.equal(pending.modifier, 15);
    assert.equal(traceAptitudeChecks({ [aptitude]: 0 }, trait).find(({ id }) => id === aptitude).target, 15);
  }
});

test('invalid levels and unknown traits give no check bonus or CP cost', () => {
  const traits = entries.flatMap(([id]) => [0, -1, 1.5, 4].map((level) => ({ id, level })));
  traits.push({ id: 'missing-trait', level: 1 });
  assert.deepEqual(traceAptitudeChecks(scores, traits), traceAptitudeChecks(scores));
  assert.equal(evaluateAptitudeBudget(scores, [], { traits }).traitBudget.cost, 0);
});

test('trait levels cost their total level in the shared CP budget and removal releases the cost', () => {
  for (const [id] of entries) {
    for (const level of [1, 2, 3]) {
      const budget = evaluateAptitudeBudget(scores, [{ to: 'active:Interface', points: 5 }], { traits: [{ id, level }, { id: 'enemy', level: 1 }] });
      assert.deepEqual([budget.traitBudget.cost, budget.traitBudget.bonus, budget.totalCp, budget.cpLeft], [level, 2, level + 1, 21 - level]);
    }
  }
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: [] }).cpLeft, 20);
});

test('all six check bonuses leave skill totals, language thresholds, and aptitude spending unchanged', () => {
  const traits = entries.map(([id]) => ({ id, level: 3 }));
  const packages = { background: { id: 'freelancer', fields: { 'know-1': 'History' } }, interest: { id: 'fighter' } };
  const input = { aptitudes: scores, packages };
  assert.deepEqual(calculateStartingSkills({ ...input, traits }), calculateStartingSkills(input));
  const before = evaluateAptitudeBudget(scores);
  const after = evaluateAptitudeBudget(scores, [], { traits });
  assert.equal(after.aptitudeCp, before.aptitudeCp);
  assert.equal(after.freeLanguages, before.freeLanguages);
  assert.equal(after.total, 90);
  assert.equal(after.traitBudget.cost, 18);
});

test('all new trait levels round-trip in backups and reject duplicates or misplaced skill choices', () => {
  for (const [id] of entries) {
    for (const level of [1, 2, 3]) {
      const character = draft([{ id, level }]);
      assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
    }
    for (const level of [0, 1.5, 4]) {
      assert.throws(() => previewBackup(encodeBackup([draft([{ id, level }])])), /supported level/);
    }
    assert.throws(() => previewBackup(encodeBackup([draft([{ id, level: 1, skillId: 'active:Interface' }])])), /absent for this trait/);
    assert.throws(() => previewBackup(encodeBackup([draft([{ id, level: 1 }, { id, level: 2 }])])), /unique/);
  }
});

test('player and GM print models include check modifiers, pending bases, and the chosen trait levels', () => {
  const traits = entries.map(([id], index) => ({ id, level: index % 3 + 1 }));
  for (const audience of ['player', 'gm']) {
    const printed = buildPrintableDossier(draft(traits), audience, []);
    assert.deepEqual(printed.checks, traceAptitudeChecks(scores, traits));
    assert.deepEqual(printed.traits, traits);
    const pending = buildPrintableDossier(draft(traits, {}), audience, []);
    assert.ok(pending.checks.every(({ target, modifiers }) => target === undefined && modifiers.length === 1));
  }
});

test('each negative aptitude trait grants one CP per level and penalizes only its linked check', () => {
  for (const [id, name, aptitude] of penalties) {
    for (const level of [1, 2, 3]) {
      const traits = [{ id, level }];
      const character = draft(traits);
      assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
      assert.deepEqual(evaluateAptitudeBudget(scores, [], { traits }).traitBudget, { cost: 0, bonus: level });
      for (const check of traceAptitudeChecks(scores, traits)) {
        assert.equal(check.base, 15);
        const applies = check.id === aptitude;
        assert.equal(check.target, applies ? 45 - level * 5 : 45);
        assert.deepEqual(check.modifiers, applies ? [{ source: name, level, points: level * -5 }] : []);
      }
    }
  }
});

test('negative check traits share the CP cap with Instability and reject unsupported levels', () => {
  const timidity = { id: 'timidity', level: 2 };
  const instability = { id: 'instability', level: 2 };
  const character = draft([timidity, instability]);
  assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  assert.equal(evaluateAptitudeBudget(scores, [], { traits: character.ego.traits }).availableCp, 26);
  assert.throws(() => previewBackup(encodeBackup([draft([{ ...timidity, level: 3 }, instability])])), /6 CP limit/);
  assert.throws(() => previewBackup(encodeBackup([draft([{ ...timidity, level: 4 }])])), /supported level/);
});

test('Timidity stacks with Resolve and Hardening in both print audiences without changing skill bases or derived stats', () => {
  const existingTraits = [{ id: 'resolve', level: 3 }, { id: 'hardening', level: 1, detail: 'Violence' }];
  const traits = [...existingTraits, { id: 'timidity', level: 2 }];
  const character = draft(traits);
  const packages = { career: { id: 'investigator' } };
  assert.deepEqual(calculateStartingSkills({ ...character.ego, packages }), calculateStartingSkills({ aptitudes: scores, packages, traits: existingTraits }));
  assert.deepEqual(traceDerivedEgoStats(character.ego), traceDerivedEgoStats({ aptitudes: scores }));
  const sources = [
    { source: 'Resolve', level: 3, points: 15 },
    { source: 'Hardening (Violence)', level: 1, points: -10 },
    { source: 'Timidity', level: 2, points: -10 },
  ];
  for (const audience of ['player', 'gm']) {
    const print = buildPrintableDossier(character, audience, []);
    const willpower = print.checks.find(({ id }) => id === 'wil');
    assert.deepEqual([willpower.target, willpower.modifiers, print.traits], [40, sources, traits]);
    const pending = buildPrintableDossier(draft(traits, {}), audience, []).checks.find(({ id }) => id === 'wil');
    assert.deepEqual([pending.target, pending.modifiers], [undefined, sources]);
  }
});

test('morph aptitude traits use their signed MP levels and modify only the linked check on each morph category', () => {
  for (const morphId of ['bouncer', 'case', 'operator']) {
    const morph = findSampleMorph(morphId);
    for (const [id, name, aptitude] of [...entries, ...penalties]) {
      const perLevel = entries.some(([traitId]) => traitId === id) ? 5 : -5;
      for (const level of [1, 2, 3]) {
        const choices = [{ id, level }];
        const profile = deriveMorphProfile(morph, choices);
        assert.equal(profile.entries[0].mp, perLevel > 0 ? level : -level);
        const checks = traceAptitudeChecks(scores, [], profile);
        for (const check of checks) {
          const linked = check.id === aptitude;
          assert.equal(check.target, linked ? 45 + perLevel * level : 45);
          assert.deepEqual(check.modifiers, linked ? [{ source: `${name} (morph)`, level, points: perLevel * level }] : []);
        }
      }
    }
  }
});

test('morph check traces handle incomplete scores and included choices without charging MP', () => {
  const morph = { ...findSampleMorph('case'), includedTraits: [{ id: 'acumen', level: 2 }] };
  const profile = deriveMorphProfile(morph, [{ id: 'acumen', level: 3 }]);
  const cognition = ({ id }) => id === 'cog';
  const pending = traceAptitudeChecks({}, [], profile).find(cognition);
  assert.equal(pending.target, undefined);
  assert.deepEqual(pending.modifiers, [{ source: 'Acumen (morph)', level: 2, points: 10 }]);
  assert.equal(traceAptitudeChecks({ cog: 0 }, [], profile).find(cognition).target, 10);
  assert.equal(evaluateMorphTraits(morph, [{ id: 'acumen', level: 3 }]).cost, 0);
});

test('morph aptitude traits use the existing MP cap and backup eligibility', () => {
  const character = draft([]);
  const choices = [{ id: 'feebleness', level: 3 }, { id: 'timidity', level: 3 }, { id: 'acumen', level: 2 }];
  const withChoices = (morphTraits) => ({
    ...character, sleeves: [{ id: 'first', egoId: character.ego.id, morphDefinitionId: 'operator', assignedAt: character.updatedAt, morphTraits }],
  });
  const valid = withChoices(choices);
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  const budget = evaluateStartingMorphBudget({}, findSampleMorph('operator'), false, choices);
  assert.deepEqual([budget.morphTraitCost, budget.morphTraitBonus, budget.remaining], [2, 6, 8]);
  for (const invalid of [
    [...choices, { id: 'obtuseness', level: 1 }], [...choices, { id: 'acumen', level: 1 }], [{ id: 'acumen', level: 4 }],
  ]) {
    assert.throws(() => previewBackup(encodeBackup([withChoices(invalid)])), /morphTraits.*must be/);
  }
});

test('ego and sleeve modifiers stack in both print layouts and only the ego contribution survives resleeving', () => {
  const character = draft([{ id: 'resolve', level: 1 }, { id: 'hardening', level: 1, detail: 'Violence' }]);
  character.ego.packages = { career: { id: 'investigator' } };
  character.sleeves = [{ id: 'first', egoId: character.ego.id, morphDefinitionId: 'bouncer', assignedAt: character.updatedAt,
    morphTraits: [{ id: 'resolve', level: 3 }, { id: 'timidity', level: 1 }] }];
  const next = recordResleeving(character, 'second', 'case', { date: '', location: '', cause: '', notes: '' }, character.updatedAt);
  for (const audience of ['player', 'gm']) {
    const first = buildPrintableDossier(character, audience, []);
    const second = buildPrintableDossier(next, audience, []);
    const willpower = ({ id }) => id === 'wil';
    const check = first.checks.find(willpower);
    assert.deepEqual([check.base, check.target], [15, 50]);
    assert.deepEqual(check.modifiers, [
      { source: 'Resolve', level: 1, points: 5 }, { source: 'Hardening (Violence)', level: 1, points: -10 },
      { source: 'Resolve (morph)', level: 3, points: 15 }, { source: 'Timidity (morph)', level: 1, points: -5 },
    ]);
    assert.deepEqual(second.checks.find(willpower).modifiers, check.modifiers.slice(0, 2));
    assert.equal(second.checks.find(willpower).target, 40);
    assert.deepEqual(second.skillLedger, first.skillLedger);
    assert.deepEqual(second.derivedStats, first.derivedStats);
  }
  assert.deepEqual(next.sleeves[0].morphTraits, character.sleeves[0].morphTraits);
});
