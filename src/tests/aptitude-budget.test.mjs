import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateAptitudeBudget, parseLanguages } from '../rules/calculations/aptitude-budget.ts';
import { aptitudeTemplates } from '../rules/datasets/aptitude-templates.ts';

const factotum = aptitudeTemplates.find(({ name }) => name === 'Factotum').scores;

test('all seven core aptitude templates allocate 90 base points', () => {
  assert.equal(aptitudeTemplates.length, 7);
  for (const { name, scores } of aptitudeTemplates) {
    const budget = evaluateAptitudeBudget(scores);
    assert.deepEqual([budget.entered, budget.total, budget.aptitudeCp, budget.outOfRange.length], [6, 90, 0, 0], name);
  }
  assert.deepEqual(aptitudeTemplates.find(({ name }) => name === 'Inquirer').scores, {
    cog: 20, int: 20, ref: 10, sav: 15, som: 10, wil: 15,
  });
});

test('transfers between aptitudes cost zero and each additional point costs one CP', () => {
  const transferred = evaluateAptitudeBudget({ ...factotum, cog: 20, wil: 10 });
  assert.equal(transferred.aptitudeCp, 0);
  const increased = evaluateAptitudeBudget({ ...factotum, cog: 25, wil: 10 });
  assert.equal(increased.aptitudeCp, 5);
  assert.equal(increased.baseCpLeft, 15);
});

test('report missing and out-of-range scores without treating them as an assigned zero', () => {
  const budget = evaluateAptitudeBudget({ cog: 0, ref: 31, int: 10 });
  assert.equal(budget.entered, 3);
  assert.equal(budget.templatePointsLeft, 49);
  assert.deepEqual(budget.outOfRange.map(({ id }) => id), ['cog', 'ref']);
});

test('distinguish using trait bonuses from exceeding the maximum CP', () => {
  const overBase = evaluateAptitudeBudget({ ...factotum, cog: 30, int: 26 });
  assert.equal(overBase.aptitudeCp, 26);
  assert.equal(overBase.baseCpLeft, -6);
  assert.equal(overBase.exceedsMaximumCp, false);
  assert.equal(evaluateAptitudeBudget({ ...factotum, cog: 30, int: 27 }).exceedsMaximumCp, true);
});

test('split purchased skill points across skills and share the aptitude CP pool', () => {
  const purchases = [
    { to: 'active:Survival', points: 2 },
    { to: 'know:orbital cartography', points: 3 },
    { to: 'active:Fray', points: 4 },
  ];
  const budget = evaluateAptitudeBudget({ ...factotum, cog: 18 }, purchases);
  assert.deepEqual(
    [budget.aptitudeCp, budget.skillCp, budget.totalCp, budget.baseCpLeft, budget.unspentPurchasedSkillPoints],
    [3, 2, 5, 15, 1],
  );
  assert.equal(evaluateAptitudeBudget(factotum, purchases.slice(0, 2)).skillCp, 1);
  const over = evaluateAptitudeBudget({ ...factotum, cog: 30, int: 25 }, purchases);
  assert.equal(over.baseCpLeft, -7);
  assert.equal(over.exceedsMaximumCp, true);
});

test('include ego Flex and languages in the shared budget at the core thresholds', () => {
  const choices = { egoFlex: 3, languages: ['French', 'Hindi', 'Mandarin', 'Spanish', 'Skandinavíska'] };
  const purchases = [{ to: 'active:Survival', points: 5 }];
  for (const [int, freeLanguages] of [[14, 2], [15, 3], [24, 3], [25, 4], [30, 4]]) {
    const budget = evaluateAptitudeBudget({ ...factotum, cog: 20, int }, purchases, choices);
    assert.equal(budget.freeLanguages, freeLanguages);
    assert.equal(budget.flexCp, 4);
    assert.equal(budget.languageCp, 5 - freeLanguages);
    assert.equal(budget.totalCp, budget.aptitudeCp + 1 + 4 + budget.languageCp);
  }
  const partial = evaluateAptitudeBudget({ cog: 20 });
  assert.equal(partial.languageAptitudes, undefined);
  assert.deepEqual([partial.freeLanguages, partial.flexCp, partial.languageCp], [2, 0, 0]);
});

test('normalize language names, preserve order, and flag duplicates', () => {
  assert.deepEqual(parseLanguages(['  British  Sign Language ', '', 'british sign language', 'Skandinavi\u0301ska']), {
    languages: ['British Sign Language', 'Skandinavíska'], hasDuplicates: true,
  });
});
