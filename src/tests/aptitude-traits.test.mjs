import assert from 'node:assert/strict';
import { test } from 'node:test';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';

const entries = [
  ['acumen', 'Acumen', 'cog'], ['empathy', 'Empathy', 'sav'], ['fitness', 'Fitness', 'som'],
  ['good-instincts', 'Good Instincts', 'int'], ['quickness', 'Quickness', 'ref'], ['resolve', 'Resolve', 'wil'],
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
