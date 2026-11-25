import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { traceSkillSpecializations } from '../rules/calculations/skill-specializations.ts';
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

const transferDraft = {
  aptitudes: { cog: 15, int: 20, ref: 15, sav: 15 },
  packages: {
    background: { id: 'freelancer', fields: { 'know-1': 'Digital Art' } },
    faction: { id: 'argonaut' },
  },
  artisticKnowFields: ['digital art'],
};

test('replay transfers in order, conserve points, and leave package grants intact', () => {
  const initial = calculateStartingSkills(transferDraft);
  const after = calculateStartingSkills({
    ...transferDraft,
    skillTransfers: [
      { from: 'active:Persuade', to: 'know:argonauts', points: 20 },
      { from: 'know:digital art', to: 'know:argonauts', points: 15 },
      { from: 'active:Persuade', to: 'active:Interface', points: 20 },
    ],
  });
  assert.ok(after.transferResults.every(({ issue }) => !issue));
  assert.equal(after.skills.find(({ name }) => name === 'Know: Argonauts').total, 80);
  assert.equal(after.skills.find(({ name }) => name === 'Know: Digital Art').total, 65);
  const persuade = after.skills.find(({ name }) => name === 'Persuade');
  assert.deepEqual([persuade.packagePoints, persuade.allocatedPoints, persuade.total], [40, 0, 15]);
  const sum = (ledger) => ledger.skills.reduce((total, row) => total + row.allocatedPoints, 0);
  assert.equal(sum(after), sum(initial));
});

test('reject illegal or stale transfers without changing the ledger', () => {
  const attempts = [
    { from: 'know:argonauts', to: 'active:Interface', points: 1 },
    { from: 'active:Persuade', to: 'know:digital art', points: 1 },
    { from: 'active:Persuade', to: 'active:Interface', points: 41 },
    { from: 'active:Persuade', to: 'active:Interface', points: 1.5 },
    { from: 'active:Persuade', to: 'active:Persuade', points: 1 },
    { from: 'active:Persuade', to: 'know:removed field', points: 1 },
  ];
  const ledger = calculateStartingSkills({ ...transferDraft, skillTransfers: attempts });
  assert.match(ledger.transferResults[0].issue, /only move/);
  assert.match(ledger.transferResults[1].issue, /above the starting cap/);
  assert.match(ledger.transferResults[2].issue, /only 40/);
  assert.match(ledger.transferResults[3].issue, /positive whole number/);
  assert.match(ledger.transferResults[4].issue, /different skills/);
  assert.match(ledger.transferResults[5].issue, /supported destination/);
  assert.deepEqual(ledger.skills, calculateStartingSkills(transferDraft).skills);
});

test('recheck a downstream transfer when the earlier transfer or linked aptitude changes', () => {
  const draft = {
    ...transferDraft,
    skillTransfers: [{ from: 'active:Persuade', to: 'active:Interface', points: 25 }],
  };
  assert.equal(calculateStartingSkills(draft).transferResults[0].issue, undefined);
  const raised = calculateStartingSkills({ ...draft, aptitudes: { ...draft.aptitudes, cog: 16 } });
  assert.match(raised.transferResults[0].issue, /above the starting cap/);
  const missing = calculateStartingSkills({ ...draft, aptitudes: { ...draft.aptitudes, cog: undefined } });
  assert.match(missing.transferResults[0].issue, /linked aptitude/);
  const dependent = [
    { from: 'active:Persuade', to: 'active:Fray', points: 10 },
    { from: 'active:Fray', to: 'active:Interface', points: 10 },
  ];
  assert.ok(calculateStartingSkills({ ...draft, skillTransfers: dependent }).transferResults.every(({ issue }) => !issue));
  assert.match(calculateStartingSkills({ ...draft, skillTransfers: dependent.slice(1) }).transferResults[0].issue, /only 0/);
});

test('introduce Active and named Know destinations and replay subsequent moves', () => {
  const skillTransfers = [
    { from: 'active:Persuade', to: 'active:Pilot: Space', points: 12 },
    { from: 'know:argonauts', to: 'know:orbital cartography', points: 15, newKnowField: ' Orbital  Cartography ' },
    { from: 'know:orbital cartography', to: 'know:argonauts', points: 5 },
  ];
  const input = { ...transferDraft, skillTransfers };
  const ledger = calculateStartingSkills(input);
  assert.ok(ledger.transferResults.every(({ issue }) => !issue));
  const pilot = ledger.skills.find(({ name }) => name === 'Pilot: Space');
  assert.deepEqual([pilot.packagePoints, pilot.allocatedPoints, pilot.aptitude, pilot.total], [0, 12, 'ref', 27]);
  const know = ledger.skills.find(({ name }) => name === 'Know: Orbital Cartography');
  assert.deepEqual([know.packagePoints, know.allocatedPoints, know.aptitude, know.total], [0, 10, 'cog', 25]);
  const art = calculateStartingSkills({ ...input, artisticKnowFields: ['orbital cartography'] }).skills.find(({ id }) => id === know.id);
  assert.deepEqual([art.aptitude, art.total], ['int', 30]);
  const removed = calculateStartingSkills({ ...input, skillTransfers: [skillTransfers[0], skillTransfers[2]] });
  assert.match(removed.transferResults[1].issue, /Choose a source/);
  assert.ok(!removed.skills.some(({ id }) => id === know.id));
});

test('leave new destinations out of the ledger when a move fails validation', () => {
  const skillTransfers = [
    { from: 'know:argonauts', to: 'active:Pilot: Space', points: 5 },
    { from: 'active:Persuade', to: 'active:Free Fall', points: 5 },
    { from: 'active:Persuade', to: 'active:Psi', points: 5 },
    { from: 'active:Persuade', to: 'know:orbital cartography', points: 5, newKnowField: 'Astrogation' },
    { from: 'active:Persuade', to: 'active:Pilot: Space', points: 6 },
  ];
  const input = { ...transferDraft, aptitudes: { ...transferDraft.aptitudes, ref: 75 } };
  const ledger = calculateStartingSkills({ ...input, skillTransfers });
  assert.match(ledger.transferResults[0].issue, /only move/);
  assert.match(ledger.transferResults[1].issue, /linked aptitude/);
  assert.match(ledger.transferResults[2].issue, /supported destination/);
  assert.match(ledger.transferResults[3].issue, /matches the destination/);
  assert.match(ledger.transferResults[4].issue, /above the starting cap/);
  assert.deepEqual(ledger.skills, calculateStartingSkills(input).skills);
});

test('apply skill purchases after transfers, track their source, and enforce the shared skill cap', () => {
  const skillPurchases = [
    { to: 'active:Interface', points: 20 },
    { to: 'active:Interface', points: 1 },
    { to: 'know:orbital cartography', points: 4, newKnowField: 'Orbital Cartography' },
  ];
  const skillTransfers = [
    { from: 'active:Interface', to: 'active:Survival', points: 15 },
    { from: 'know:orbital cartography', to: 'know:argonauts', points: 1 },
  ];
  const input = { ...transferDraft, skillTransfers, skillPurchases };
  const ledger = calculateStartingSkills(input);
  const skill = ledger.skills.find(({ name }) => name === 'Interface');
  assert.deepEqual([skill.packagePoints, skill.allocatedPoints, skill.purchasedPoints, skill.total], [40, 25, 21, 61]);
  assert.match(ledger.transferResults[1].issue, /source skill with package points/);
  const know = ledger.skills.find(({ name }) => name === 'Know: Orbital Cartography');
  assert.deepEqual([know.allocatedPoints, know.purchasedPoints, know.total], [0, 4, 19]);
  const raised = calculateStartingSkills({ ...input, skillTransfers: [], aptitudes: { ...transferDraft.aptitudes, cog: 20 } });
  assert.equal(raised.skills.find(({ name }) => name === 'Interface').total, 80);
  assert.match(raised.purchaseResults[1].issue, /above the starting cap/);
});

test('trace situational specialization targets without changing base totals or the cap', () => {
  const skillId = 'active:Fray';
  const choices = [{ skillId, name: 'Full Defense' }, { skillId, name: 'Ranged Attacks' }, { skillId: 'know:astronomy', name: 'Comets' }];
  const ledger = calculateStartingSkills({ aptitudes: { ref: 30 }, skillPurchases: [{ to: skillId, points: 20 }] });
  const trace = traceSkillSpecializations(ledger.skills, choices);
  assert.deepEqual(trace.map(({ target, missingSkill }) => [target, missingSkill]), [[90, false], [90, false], [undefined, true]]);
  assert.deepEqual(ledger.skills.map(({ total, excess }) => [total, excess]), [[80, 0]]);
  const partial = calculateStartingSkills({ aptitudes: {}, packages: { interest: { id: 'paramedic' } } });
  assert.deepEqual(traceSkillSpecializations(partial.skills, choices)[0], {
    ...choices[0], skillName: 'Fray', target: undefined, missingSkill: false,
  });
});
