import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coreCreationPackages, creationPackageNames, findCreationPackage } from '../rules/datasets/creation-packages.ts';

test('starter package grants match the core category totals', () => {
  for (const [kind, total] of [['background', 260], ['career', 220], ['interest', 140], ['faction', 30]]) {
    for (const option of coreCreationPackages[kind]) {
      assert.equal(option.grants.reduce((sum, { points }) => sum + points, 0), total, option.name);
      const slots = option.grants.flatMap(({ slot }) => slot ? [slot] : []);
      assert.equal(new Set(slots).size, slots.length);
    }
  }
  assert.deepEqual(findCreationPackage('faction', 'factionless').grants, [{ skill: 'Know', points: 30, slot: 'know-1' }]);
});

test('summarize partially selected packages in core creation order', () => {
  assert.deepEqual(creationPackageNames({ faction: { id: 'argonaut' }, career: { id: 'academic' }, background: { id: 'freelancer' } }), [
    { kind: 'background', label: 'Background', name: 'Freelancer' },
    { kind: 'career', label: 'Career', name: 'Academic' },
    { kind: 'faction', label: 'Faction', name: 'Argonaut' },
  ]);
});
