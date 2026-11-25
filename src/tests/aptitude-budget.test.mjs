import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
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
