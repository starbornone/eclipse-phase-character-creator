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

test('combat careers combine Fray grants with its doubled base and reallocate excess points', () => {
  const inputs = {
    aptitudes: { ref: 15, som: 15, cog: 15, int: 15, sav: 15 },
    packages: { career: { id: 'soldier', fields: { 'know-1': 'Military Ops' } }, interest: { id: 'paramedic' } },
  };
  const initial = calculateStartingSkills(inputs);
  const fray = initial.skills.find(({ name }) => name === 'Fray');
  assert.deepEqual([fray.packagePoints, fray.base, fray.total, fray.excess], [60, 30, 90, 10]);
  assert.equal(initial.skills.find(({ name }) => name === 'Know: Military Ops').total, 75);
  assert.equal(initial.unassignedKnowPoints, 30);
  const adjusted = calculateStartingSkills({ ...inputs, skillTransfers: [
    { from: 'active:Fray', to: 'active:Guns', points: 5 },
    { from: 'active:Fray', to: 'active:Melee', points: 5 },
  ] });
  assert.ok(adjusted.transferResults.every(({ issue }) => !issue));
  assert.deepEqual(adjusted.skills.filter(({ name }) => ['Fray', 'Guns', 'Melee'].includes(name)).map(({ name, total }) => [name, total]), [
    ['Fray', 80], ['Guns', 80], ['Melee', 50],
  ]);
  const enforcer = calculateStartingSkills({ ...inputs, packages: { ...inputs.packages, career: { id: 'enforcer' } } });
  assert.equal(enforcer.skills.find(({ name }) => name === 'Fray').total, 80);
  assert.equal(enforcer.skills.find(({ name }) => name === 'Provoke').total, 45);
});

test('Scavenger fields remain pending and merge with fixed grants when the same field is chosen', () => {
  const aptitudes = { cog: 20, ref: 15, int: 15 };
  const pending = calculateStartingSkills({ aptitudes, packages: { career: { id: 'scavenger' } } });
  assert.equal(pending.unassignedActivePoints, 90);
  assert.equal(pending.unassignedKnowPoints, 90);
  assert.equal(pending.skills.find(({ name }) => name === 'Hardware: Demolitions').total, 60);
  const named = calculateStartingSkills({ aptitudes, packages: { career: { id: 'scavenger', fields: {
    'hardware-1': 'Demolitions', 'pilot-1': 'Space', 'know-1': 'Scavenging',
  } } } });
  const demolition = named.skills.find(({ name }) => name === 'Hardware: Demolitions');
  assert.deepEqual([demolition.packagePoints, demolition.base, demolition.total, demolition.excess], [100, 20, 120, 40]);
  assert.equal(named.skills.filter(({ name }) => name === 'Hardware: Demolitions').length, 1);
  assert.equal(named.skills.find(({ name }) => name === 'Pilot: Space').total, 45);
  assert.equal(named.skills.find(({ name }) => name === 'Know: Scavenging').total, 80);
  assert.equal(named.unassignedActivePoints, 0);
  assert.equal(named.unassignedKnowPoints, 30);
});

test('technical careers use linked aptitudes and custom Hardware fields in their ledgers', () => {
  for (const [id, expected] of [
    ['hacker', [['Infosec', 80], ['Interface', 60], ['Program', 50]]],
    ['scientist', [['Hardware: Drone Maintenance', 60], ['Program', 50], ['Research', 75]]],
    ['techie', [['Hardware: Drone Maintenance', 80], ['Infosec', 60], ['Program', 50]]],
  ]) {
    const { skills } = calculateStartingSkills({ aptitudes: { cog: 20, int: 15 }, packages: {
      career: { id, fields: id === 'hacker' ? undefined : { 'hardware-1': 'Drone Maintenance' } },
    } });
    for (const [name, total] of expected) assert.equal(skills.find((row) => row.name === name)?.total, total, `${id}: ${name}`);
  }
});

test('Investigator adds its Perceive grant to twice Intuition and flags excess totals', () => {
  const input = { aptitudes: { int: 20, sav: 15 }, packages: { career: { id: 'investigator' } } };
  const row = calculateStartingSkills(input).skills.find(({ name }) => name === 'Perceive');
  assert.deepEqual([row.packagePoints, row.base, row.total, row.excess], [40, 40, 80, 0]);
  const raised = calculateStartingSkills({ ...input, aptitudes: { int: 25 } }).skills.find(({ name }) => name === 'Perceive');
  assert.deepEqual([raised.total, raised.excess], [90, 10]);
});

test('medical grants stay pending without Cognition and excess Paramedic points can be transferred', () => {
  const packages = { career: { id: 'medic' }, interest: { id: 'paramedic' } };
  const pending = calculateStartingSkills({ aptitudes: {}, packages });
  assert.equal(pending.skills.find(({ name }) => name === 'Medicine: Paramedic').total, undefined);
  assert.equal(pending.unassignedKnowPoints, 90);
  const adjusted = calculateStartingSkills({ aptitudes: { cog: 20, int: 20 }, packages,
    skillTransfers: [{ from: 'active:Medicine: Paramedic', to: 'active:Research', points: 40 }],
  });
  assert.equal(adjusted.transferResults[0].issue, undefined);
  assert.equal(adjusted.skills.find(({ name }) => name === 'Medicine: Paramedic').total, 80);
  assert.equal(adjusted.skills.find(({ name }) => name === 'Research').total, 60);
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

test('keep custom Active fields distinct and apply fixed or selected aptitudes', () => {
  const hardware = { category: 'hardware', name: ' Drone  Maintenance ', aptitude: 'cog' };
  const exotic = { category: 'exotic', name: 'Tether Dance', aptitude: 'som' };
  const to = 'active-field:hardware:drone maintenance';
  const input = {
    ...transferDraft,
    aptitudes: { ...transferDraft.aptitudes, som: 12 },
    skillTransfers: [
      { from: 'active:Persuade', to, points: 10, customActiveField: hardware },
      { from: 'know:argonauts', to, points: 5, customActiveField: hardware },
    ],
    skillPurchases: [
      { to, points: 5, customActiveField: hardware },
      { to: 'active-field:exotic:tether dance', points: 5, customActiveField: exotic },
      { to: 'active-field:exotic:tether dance', points: 5, customActiveField: { ...exotic, aptitude: 'ref' } },
    ],
  };
  const ledger = calculateStartingSkills(input);
  const row = ledger.skills.find(({ id }) => id === to);
  assert.deepEqual([row.name, row.aptitude, row.total], ['Hardware: Drone Maintenance', 'cog', 30]);
  assert.match(ledger.transferResults[1].issue, /Know points can only move/);
  assert.equal(ledger.skills.find(({ name }) => name === 'Exotic Skill: Tether Dance').total, 17);
  assert.match(ledger.purchaseResults[2].issue, /already uses a different aptitude/);
  assert.equal(calculateStartingSkills({ ...input, skillTransfers: [] }).skills.find(({ id }) => id === to).total, 20);
  assert.equal(traceSkillSpecializations(ledger.skills, [{ skillId: to, name: 'Orbital docks' }])[0].target, 40);
});

test('Expert Training raises exactly one skill cap and rechecks allocations when removed', () => {
  const to = 'active:Interface';
  const input = {
    ...transferDraft,
    traits: [{ id: 'expert-training', level: 1, skillId: to }],
    skillTransfers: [{ from: 'active:Persuade', to, points: 30 }],
    skillPurchases: [{ to, points: 5 }, { to, points: 1 }, { to: 'active:Perceive', points: 41 }],
  };
  const ledger = calculateStartingSkills(input);
  const row = ledger.skills.find(({ id }) => id === to);
  assert.deepEqual([row.total, row.cap, row.excess], [90, 90, 0]);
  assert.equal(ledger.transferResults[0].issue, undefined);
  assert.match(ledger.purchaseResults[1].issue, /cap of 90/);
  assert.match(ledger.purchaseResults[2].issue, /cap of 80/);
  const removed = calculateStartingSkills({ ...input, traits: [] });
  assert.match(removed.transferResults[0].issue, /cap of 80/);
  assert.equal(removed.skills.find(({ id }) => id === to).total, 61);
  const aboveCap = calculateStartingSkills({ aptitudes: { sav: 21 }, packages: { career: { id: 'face' } },
    traits: [{ id: 'expert-training', level: 1, skillId: 'active:Persuade' }] });
  const trained = aboveCap.skills.find(({ name }) => name === 'Persuade');
  assert.deepEqual([trained.total, trained.cap, trained.excess], [81, 90, 0]);
});

test('keep blank Active slots pending and merge package grants with matching sample and custom fields', () => {
  const packages = {
    background: { id: 'colonist', fields: { 'hardware-1': 'Drone Maintenance', 'pilot-1': ' space ' } },
    career: { id: 'explorer', fields: { 'pilot-1': 'Space' } },
    interest: { id: 'spacer', fields: { 'hardware-1': 'drone   maintenance' } },
  };
  const input = { packages, aptitudes: { cog: 15, ref: 15, int: 15 } };
  const ledger = calculateStartingSkills(input);
  assert.equal(ledger.unassignedActivePoints, 0);
  assert.equal(ledger.unassignedKnowPoints, 220);
  const pilot = ledger.skills.find(({ id }) => id === 'active:Pilot: Space');
  assert.deepEqual([pilot.packagePoints, pilot.base, pilot.total], [50, 15, 65]);
  const hardware = ledger.skills.find(({ id }) => id === 'active-field:hardware:drone maintenance');
  assert.deepEqual([hardware.name, hardware.packagePoints, hardware.base, hardware.excess], ['Hardware: Drone Maintenance', 80, 15, 15]);
  assert.deepEqual(hardware.grants.map(({ source }) => source), ['Colonist', 'Spacer']);
  const blanks = calculateStartingSkills({ ...input, packages: { background: { id: 'colonist' }, career: { id: 'explorer' } } });
  assert.equal(blanks.unassignedActivePoints, 90);
  assert.equal(blanks.unassignedKnowPoints, 180);
});
