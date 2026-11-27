import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildPrintableDossier, privatePrintFields } from '../features/dossier/print.ts';
import { cleanFactionMotivation, cleanPersonalMotivations, personalMotivationChoices } from '../rules/calculations/motivations.ts';
import { deriveStartingGear } from '../rules/calculations/starting-gear.ts';

const assignedAt = '2026-11-25T01:00:00.000Z';
const event = { date: '2026-11-20', location: 'Private habitat', cause: 'Private cause', notes: 'Private notes' };
const draft = {
  schemaVersion: 2,
  rulesVersion: 'ep2-quick-start-2.4',
  revision: 2,
  updatedAt: assignedAt,
  ego: { id: 'ego', name: 'Explorer', pronouns: 'they/them', concept: 'A cartographer', aptitudes: { int: 15 } },
  sleeves: [
    { id: 'first', egoId: 'ego', morphDefinitionId: 'bouncer', assignedAt },
    { id: 'second', egoId: 'ego', morphDefinitionId: 'synth', assignedAt, event },
  ],
};

test('player output excludes history even when private fields are requested', () => {
  const dossier = buildPrintableDossier(draft, 'player', privatePrintFields.map(({ id }) => id));
  assert.equal(dossier.concept, 'A cartographer');
  assert.equal(dossier.morph.name, 'Synth');
  assert.equal(dossier.checks.find(({ id }) => id === 'int').target, 45);
  assert.deepEqual(dossier.history, []);
  assert.doesNotMatch(JSON.stringify(dossier), /Private|2026-11-20/);
});

test('GM output exposes only explicitly selected sleeve fields', () => {
  const summary = buildPrintableDossier(draft, 'gm', []);
  assert.deepEqual(summary.history.map(({ morphName, active }) => [morphName, active]), [
    ['Synth', true], ['Bouncer', false],
  ]);
  assert.doesNotMatch(JSON.stringify(summary), /Private|2026-11-20/);
  const filtered = buildPrintableDossier(draft, 'gm', ['date', 'notes']);
  assert.equal(filtered.history[0].date, event.date);
  assert.equal(filtered.history[0].notes, event.notes);
  assert.equal(filtered.history[0].location, undefined);
  assert.equal(filtered.history[0].cause, undefined);
  assert.equal(filtered.history[1].date, assignedAt);
});

test('an unassigned draft can be printed before choosing a morph', () => {
  const dossier = buildPrintableDossier({ ...draft, sleeves: [] }, 'gm', []);
  assert.equal(dossier.hasSleeve, false);
  assert.equal(dossier.morph, undefined);
  assert.deepEqual(dossier.history, []);
  assert.equal(dossier.egoFlex, 1);
  assert.deepEqual(dossier.languages, []);
});

test('show recorded ego Flex and languages for both audiences', () => {
  const withCustomization = { ...draft, ego: { ...draft.ego, egoFlex: 3, languages: ['English', 'Mandarin'] } };
  for (const audience of ['player', 'gm']) {
    const { egoFlex, languages } = buildPrintableDossier(withCustomization, audience, []);
    assert.equal(egoFlex, 3);
    assert.deepEqual(languages, ['English', 'Mandarin']);
  }
});

test('include recorded reputation in both print layouts', () => {
  const reputation = { '@-rep': 60, 'i-rep': 0 };
  const withReputation = { ...draft, ego: { ...draft.ego, reputation } };
  for (const audience of ['player', 'gm']) {
    assert.deepEqual(buildPrintableDossier(withReputation, audience, []).reputation, reputation);
    assert.equal(buildPrintableDossier(draft, audience, []).reputation, undefined);
  }
});

test('print applicable skill specializations and omit missing choices', () => {
  const specializations = [{ skillId: 'active:Perceive', name: 'Visual' }, { skillId: 'know:astronomy', name: 'Comets' }];
  const specialized = { ...draft, ego: { ...draft.ego, specializations } };
  for (const audience of ['player', 'gm']) {
    assert.deepEqual(buildPrintableDossier(specialized, audience, []).specializations, [
      { ...specializations[0], skillName: 'Perceive', target: 40, missingSkill: false },
    ]);
  }
});

test('both print layouts retain skill allocations, doubled bases, and incomplete totals', () => {
  const skilled = { ...draft, ego: {
    ...draft.ego,
    packages: { background: { id: 'freelancer', fields: { 'know-1': 'Astronomy' } } },
    skillTransfers: [
      { from: 'active:Interface', to: 'active:Fray', points: 5 },
      { from: 'active:Interface', to: 'active:Perceive', points: 10 },
    ],
    skillPurchases: [{ to: 'active:Perceive', points: 5 }],
  } };
  for (const audience of ['player', 'gm']) {
    const { skillLedger } = buildPrintableDossier(skilled, audience, []);
    const perceive = skillLedger.skills.find(({ id }) => id === 'active:Perceive');
    assert.equal(perceive.base, 30);
    assert.equal(perceive.purchasedPoints, 5);
    assert.equal(perceive.allocatedPoints, 10);
    assert.equal(perceive.total, 45);
    assert.equal(skillLedger.skills.find(({ id }) => id === 'active:Interface').allocatedPoints, 30);
    const astronomy = skillLedger.skills.find(({ id }) => id === 'know:astronomy');
    assert.equal(astronomy.allocatedPoints, 60);
    assert.equal(astronomy.total, undefined);
    assert.equal(skillLedger.unassignedKnowPoints, 30);
    assert.match(skillLedger.transferResults[0].issue, /Enter the linked aptitude/);
  }
});

test('print skill totals preserve over-cap warnings and skipped purchases for review', () => {
  const overCap = { ...draft, ego: {
    ...draft.ego, aptitudes: { cog: 30, int: 30 },
    packages: { career: { id: 'academic' } },
    skillPurchases: [{ to: 'active:Research', points: 5 }],
  } };
  const { skillLedger } = buildPrintableDossier(overCap, 'player', []);
  const research = skillLedger.skills.find(({ id }) => id === 'active:Research');
  assert.equal(research.total, 90);
  assert.equal(research.excess, 10);
  assert.equal(research.purchasedPoints, 0);
  assert.match(skillLedger.purchaseResults[0].issue, /above the starting cap/);
});

test('print saved ego traits for both audiences', () => {
  const traits = [{ id: 'adaptability', level: 2 }, { id: 'identity-crisis', level: 1 }];
  const withTraits = { ...draft, ego: { ...draft.ego, traits } };
  for (const audience of ['player', 'gm']) {
    assert.deepEqual(buildPrintableDossier(withTraits, audience, []).traits, traits);
    assert.equal(buildPrintableDossier(draft, audience, []).traits, undefined);
  }
});

test('print two personal motivations with a faction or three without a faction', () => {
  const personalMotivations = {
    first: { stance: 'support', text: 'Exploration' },
    second: { stance: 'oppose', text: 'Censorship' },
    third: { stance: 'support', text: 'Open access' },
  };
  const aligned = { ...draft, ego: { ...draft.ego, packages: { faction: { id: 'argonaut' } }, personalMotivations } };
  assert.deepEqual(buildPrintableDossier(aligned, 'player', []).motivations.map(({ label }) => label), ['+Argonaut Interests', '+Exploration', '−Censorship']);
  assert.deepEqual(buildPrintableDossier(aligned, 'gm', []).motivations, []);
  const custom = { ...aligned, ego: { ...aligned.ego, packages: { faction: { id: 'argonaut', motivation: '+Open science' } } } };
  assert.equal(buildPrintableDossier(custom, 'player', []).motivations[0].label, '+Open science');
  const unaligned = { ...aligned, ego: { ...aligned.ego, packages: {} } };
  assert.deepEqual(buildPrintableDossier(unaligned, 'player', []).motivations.map(({ label }) => label), ['+Exploration', '−Censorship', '+Open access']);
});

test('preserve legacy Factionless motivations when loading and saving a draft', () => {
  const packages = { faction: { id: 'factionless', motivation: '- Gate secrecy', fields: { 'know-1': 'Habitat lore' } } };
  const legacy = { ...draft, ego: { ...draft.ego, packages } };
  assert.equal(buildPrintableDossier(legacy, 'player', []).motivations[0].label, '−Gate secrecy');
  const personalMotivations = personalMotivationChoices(legacy.ego);
  assert.deepEqual(personalMotivations, { third: { stance: 'oppose', text: 'Gate secrecy' } });
  const savedPackages = cleanFactionMotivation(packages);
  assert.deepEqual(savedPackages, { faction: { id: 'factionless', fields: { 'know-1': 'Habitat lore' } } });
  const saved = { ...legacy, ego: { ...legacy.ego, packages: savedPackages, personalMotivations } };
  assert.equal(buildPrintableDossier(saved, 'player', []).motivations[0].label, '−Gate secrecy');
});

test('keep goals with their motivations and omit goals for inactive or unnamed slots', () => {
  const packages = { faction: { id: 'argonaut', motivationGoal: '  Publish the survey  ' } };
  const personalMotivations = cleanPersonalMotivations({
    first: { stance: 'support', text: 'Exploration', goal: ' Map a new route ' },
    second: { stance: 'oppose', text: '  ', goal: ' Protect the archives ' },
    third: { stance: 'support', text: 'Accessibility', goal: 'Build a shared guide' },
  });
  assert.deepEqual(personalMotivations.second, { stance: 'oppose', text: '', goal: 'Protect the archives' });
  const aligned = { ...draft, ego: { ...draft.ego, packages: cleanFactionMotivation(packages), personalMotivations } };
  assert.deepEqual(buildPrintableDossier(aligned, 'player', []).motivations, [
    { label: '+Argonaut Interests', goal: 'Publish the survey' },
    { label: '+Exploration', goal: 'Map a new route' },
  ]);
  assert.deepEqual(buildPrintableDossier(aligned, 'gm', []).motivations, []);
  const unaligned = { ...aligned, ego: { ...aligned.ego, packages: {} } };
  assert.deepEqual(buildPrintableDossier(unaligned, 'player', []).motivations[1], { label: '+Accessibility', goal: 'Build a shared guide' });
});

test('derive campaign and career gear packs and use the first sleeve for alternates', () => {
  const equipped = { ...draft, ego: { ...draft.ego, startingCampaign: 'gatecrashing', packages: { career: { id: 'explorer' } } } };
  const player = buildPrintableDossier(equipped, 'player', []);
  assert.equal(player.morph.name, 'Synth');
  assert.deepEqual(player.startingGear.packs.map(({ name, gp }) => [name, gp]), [['Gatecrashing', 10], ['Explorer', 10]]);
  assert.ok(player.startingGear.packs[0].items.some(({ name }) => name === 'Standard Vacsuit'));
  assert.equal(player.startingGear.packs[0].usesSynthAlternatives, false);
  const synthFirst = { ...equipped, sleeves: [draft.sleeves[1]] };
  const [pack] = buildPrintableDossier(synthFirst, 'player', []).startingGear.packs;
  assert.equal(pack.usesSynthAlternatives, true);
  assert.equal(pack.gp, 10);
  assert.ok(pack.items.some(({ name }) => name === 'Medichines'));
  assert.ok(!pack.items.some(({ name }) => name === 'Standard Vacsuit'));
  assert.equal(buildPrintableDossier(equipped, 'gm', []).startingGear, undefined);
  assert.deepEqual(deriveStartingGear('criminal', 'face'), deriveStartingGear('firewall', 'face'));
  assert.equal(deriveStartingGear(undefined, 'academic').packs[0].gp, 10);
});

test('player dossier resolves combat careers and gear while both audiences retain their skill totals', () => {
  for (const [id, name, gunPoints, weapon] of [
    ['enforcer', 'Enforcer', 20, 'Shredder'], ['soldier', 'Soldier', 60, 'Assault Rifle Railgun'],
  ]) {
    const combat = { ...draft, ego: { ...draft.ego,
      aptitudes: { ref: 15, som: 15, cog: 15 },
      packages: { career: { id } },
    } };
    const player = buildPrintableDossier(combat, 'player', []);
    assert.equal(player.packages.career.id, id);
    assert.equal(player.startingGear.packs[0].name, name);
    assert.ok(player.startingGear.packs[0].items.some(({ name }) => name === weapon));
    for (const audience of ['player', 'gm']) {
      const row = buildPrintableDossier(combat, audience, []).skillLedger.skills.find(({ name }) => name === 'Guns');
      assert.equal(row.total, gunPoints + 15);
    }
  }
});
