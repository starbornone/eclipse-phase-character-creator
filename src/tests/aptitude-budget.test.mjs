import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateAptitudeBudget, parseLanguages } from '../rules/calculations/aptitude-budget.ts';
import { aptitudeTemplates } from '../rules/datasets/aptitude-templates.ts';
import { parseReputation } from '../rules/calculations/reputation.ts';

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

test('preserve zero reputation and validate the per-network starting cap', () => {
  assert.deepEqual(parseReputation({ '@-rep': '80', 'c-rep': ' ', 'i-rep': '0' }), { scores: { '@-rep': 80, 'i-rep': 0 } });
  for (const value of ['81', '-1', '3.5', '4e1']) {
    assert.equal(parseReputation({ 'r-rep': value }).issue.id, 'r-rep');
  }
});

test('spend reputation points above 100 in five-point batches from the shared CP pool', () => {
  const partial = evaluateAptitudeBudget(factotum, [], { reputation: { '@-rep': 60 } });
  assert.deepEqual(partial.reputationBudget, { total: 60, freeRemaining: 40, cp: 0, purchasedRemaining: 0 });
  assert.equal(evaluateAptitudeBudget(factotum, [], { reputation: { '@-rep': 60, 'c-rep': 40 } }).totalCp, 0);
  const combined = evaluateAptitudeBudget({ ...factotum, cog: 18 }, [{ to: 'active:Survival', points: 5 }], {
    egoFlex: 2, languages: ['English', 'Mandarin', 'French'], reputation: { '@-rep': 60, 'c-rep': 45, 'r-rep': 1 },
  });
  assert.deepEqual(combined.reputationBudget, { total: 106, freeRemaining: 0, cp: 2, purchasedRemaining: 4 });
  assert.deepEqual([combined.totalCp, combined.baseCpLeft], [9, 11]);
});

test('reserve one CP per specialization alongside other customization', () => {
  const specializations = [{ skillId: 'active:Fray', name: 'Full Defense' }, { skillId: 'know:astronomy', name: 'Comets' }];
  const budget = evaluateAptitudeBudget({ ...factotum, cog: 18 }, [], { egoFlex: 2, specializations });
  assert.deepEqual([budget.specializationCp, budget.totalCp, budget.baseCpLeft], [2, 7, 13]);
});

test('charge positive traits by level and add negative trait bonuses to available CP', () => {
  const traits = [{ id: 'adaptability', level: 2 }, { id: 'bad-luck', level: 1 }];
  const scores = { ...factotum, cog: 30, int: 20 };
  const withTraits = evaluateAptitudeBudget(scores, [], { traits });
  assert.deepEqual(withTraits.traitBudget, { cost: 4, bonus: 6 });
  assert.deepEqual([withTraits.totalCp, withTraits.availableCp, withTraits.cpLeft], [24, 26, 2]);
  const withoutBonus = evaluateAptitudeBudget(scores, [], { traits: traits.slice(0, 1) });
  assert.deepEqual([withoutBonus.totalCp, withoutBonus.availableCp, withoutBonus.cpLeft], [24, 20, -4]);
  const overBonus = evaluateAptitudeBudget(scores, [], { traits: [...traits, { id: 'enemy', level: 1 }] });
  assert.equal(overBonus.availableCp, 26);
});
