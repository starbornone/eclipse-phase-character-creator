import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { coreCreationPackages } from '../rules/datasets/creation-packages.ts';

test('combine duplicate grants with their aptitude and report the standard starting cap', () => {
  const { skills, unassignedKnowPoints } = calculateStartingSkills({
    aptitudes: { sav: 15, cog: 20 },
    packages: { background: { id: 'freelancer' }, career: { id: 'face' }, interest: { id: 'networker' } },
  });
  const persuade = skills.find(({ name }) => name === 'Persuade');
  assert.deepEqual(persuade.grants, [
    { source: 'Freelancer', points: 40 }, { source: 'Face', points: 60 }, { source: 'Networker', points: 40 },
  ]);
  assert.deepEqual([persuade.packagePoints, persuade.base, persuade.total, persuade.excess], [140, 15, 155, 75]);
  assert.equal(unassignedKnowPoints, 180);
  assert.equal(skills.find(({ name }) => name === 'Research').total, undefined);
});

test('double the Fray and Perceive bases even without a package grant', () => {
  const { skills } = calculateStartingSkills({
    aptitudes: { ref: 15, int: 20 },
    packages: { interest: { id: 'paramedic' } },
  });
  assert.equal(skills.find(({ name }) => name === 'Fray').total, 50);
  assert.equal(skills.find(({ name }) => name === 'Perceive').total, 40);
});

test('merge matching Know fields and link player-classified Art fields to Intuition', () => {
  const { skills } = calculateStartingSkills({
    aptitudes: { cog: 20, int: 15 },
    packages: {
      career: { id: 'academic', fields: { 'know-1': 'Digital Art', 'know-2': 'Anarchists' } },
      faction: { id: 'anarchist' },
      background: { id: 'freelancer', fields: { 'know-2': ' digital  art ' } },
    },
    artisticKnowFields: ['digital art', 'anarchists'],
  });
  const art = skills.find(({ fieldKey }) => fieldKey === 'digital art');
  const faction = skills.find(({ fieldKey }) => fieldKey === 'anarchists');
  assert.deepEqual([art.packagePoints, art.aptitude, art.total], [90, 'int', 105]);
  assert.deepEqual([faction.packagePoints, faction.aptitude, faction.total], [70, 'cog', 90]);
});

test('each supported Active package grant has a verified aptitude link', () => {
  for (const [kind, options] of Object.entries(coreCreationPackages)) {
    for (const { id } of options) {
      const { skills } = calculateStartingSkills({ aptitudes: {}, packages: { [kind]: { id } } });
      assert.ok(skills.filter(({ activeSkill }) => activeSkill).every(({ aptitude }) => aptitude));
    }
  }
});
