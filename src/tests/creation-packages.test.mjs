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

test('support every core background with the sourced grants and combat choices', () => {
  assert.deepEqual(coreCreationPackages.background.map(({ id }) => id), [
    'colonist', 'enclaver', 'freelancer', 'hyperelite', 'indenture', 'infolife', 'isolate', 'lost', 'underclass', 'uplift',
  ]);
  for (const [id, fixed, slots] of [
    ['indenture', [['Free Fall', 40], ['Interface', 40], ['Perceive', 20]], [['combat-1', 20], ['hardware-1', 50], ['know-1', 60], ['know-2', 30]]],
    ['infolife', [['Infosec', 50], ['Interface', 50], ['Program', 50], ['Research', 20]], [['know-1', 60], ['know-2', 30]]],
    ['isolate', [['Free Fall', 40], ['Guns', 20], ['Medicine: Paramedic', 20], ['Survival', 20]], [['hardware-1', 40], ['pilot-1', 30], ['know-1', 60], ['know-2', 30]]],
    ['underclass', [['Deceive', 30], ['Fray', 20], ['Kinesics', 40], ['Perceive', 20], ['Persuade', 20]], [['combat-1', 40], ['know-1', 60], ['know-2', 30]]],
    ['uplift', [['Athletics', 40], ['Fray', 20], ['Kinesics', 30], ['Perceive', 40], ['Provoke', 20], ['Survival', 20]], [['know-1', 60], ['know-2', 30]]],
  ]) {
    const background = findCreationPackage('background', id);
    assert.equal(background.page, 39);
    assert.deepEqual(background.grants.filter(({ slot }) => !slot).map(({ skill, points }) => [skill, points]), fixed);
    assert.deepEqual(background.grants.filter(({ slot }) => slot).map(({ slot, points }) => [slot, points]), slots);
  }
  assert.deepEqual(findCreationPackage('background', 'indenture').grants.find(({ skillOptions }) => skillOptions).skillOptions, ['Fray', 'Melee']);
  assert.deepEqual(findCreationPackage('background', 'underclass').grants.find(({ skillOptions }) => skillOptions).skillOptions, ['Guns', 'Melee']);
});

test('summarize partially selected packages in core creation order', () => {
  assert.deepEqual(creationPackageNames({ faction: { id: 'argonaut' }, career: { id: 'academic' }, background: { id: 'freelancer' } }), [
    { kind: 'background', label: 'Background', name: 'Freelancer' },
    { kind: 'career', label: 'Career', name: 'Academic' },
    { kind: 'faction', label: 'Faction', name: 'Argonaut' },
  ]);
});

test('combat careers match the core grants and keep their Know fields optional', () => {
  for (const [id, page, active] of [
    ['enforcer', 40, [['Fray', 30], ['Guns', 20], ['Melee', 50], ['Provoke', 30]]],
    ['soldier', 41, [['Fray', 40], ['Guns', 60], ['Melee', 30]]],
  ]) {
    const career = findCreationPackage('career', id);
    assert.equal(career.page, page);
    assert.deepEqual(career.grants.filter(({ slot }) => !slot).map(({ skill, points }) => [skill, points]), active);
    assert.deepEqual(career.grants.filter(({ slot }) => slot), [
      { skill: 'Know', points: 60, slot: 'know-1' },
      { skill: 'Know', points: 30, slot: 'know-2' },
    ]);
  }
});

test('technical careers retain fixed grants and optional Active and Know field slots', () => {
  for (const [id, page, fixed, fields] of [
    ['hacker', 40, [['Infosec', 60], ['Interface', 40], ['Program', 30]], []],
    ['scavenger', 41, [['Hardware: Demolitions', 40]], [['hardware-1', 60], ['pilot-1', 30]]],
    ['scientist', 41, [['Program', 30], ['Research', 60]], [['hardware-1', 40]]],
    ['techie', 41, [['Infosec', 40], ['Program', 30]], [['hardware-1', 60]]],
  ]) {
    const career = findCreationPackage('career', id);
    assert.equal(career.page, page);
    assert.deepEqual(career.grants.filter(({ slot }) => !slot).map(({ skill, points }) => [skill, points]), fixed);
    assert.deepEqual(career.grants.filter(({ activeField }) => activeField).map(({ slot, points }) => [slot, points]), fields);
    assert.deepEqual(career.grants.filter(({ skill }) => skill === 'Know').map(({ slot, points }) => [slot, points]), [['know-1', 60], ['know-2', 30]]);
  }
});

test('complete the core career catalogue with the remaining sourced grants', () => {
  assert.deepEqual(coreCreationPackages.career.map(({ id }) => id), [
    'academic', 'covert-operative', 'enforcer', 'explorer', 'face', 'genehacker', 'hacker',
    'investigator', 'medic', 'mindhacker', 'scavenger', 'scientist', 'soldier', 'techie',
  ]);
  for (const [id, page, expected] of [
    ['covert-operative', 40, [['Deceive', 40], ['Infiltrate', 60], ['Infosec', 30]]],
    ['genehacker', 40, [['Medicine: Biotech', 60], ['Medicine: Pharmacology', 40], ['Program', 30]]],
    ['investigator', 40, [['Kinesics', 30], ['Perceive', 40], ['Research', 60]]],
    ['medic', 40, [['Kinesics', 30], ['Medicine: Biotech', 40], ['Medicine: Paramedic', 60]]],
    ['mindhacker', 41, [['Infosec', 30], ['Medicine: Pharmacology', 40], ['Medicine: Psychosurgery', 60]]],
  ]) {
    const career = findCreationPackage('career', id);
    assert.equal(career.page, page);
    assert.deepEqual(career.grants.filter(({ slot }) => !slot).map(({ skill, points }) => [skill, points]), expected);
    assert.deepEqual(career.grants.filter(({ slot }) => slot).map(({ slot, points }) => [slot, points]), [['know-1', 60], ['know-2', 30]]);
  }
});
