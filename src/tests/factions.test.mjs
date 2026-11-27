import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coreCreationPackages } from '../rules/datasets/creation-packages.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { defaultFactionMotivation, listStartingMotivations } from '../rules/calculations/motivations.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';

const factions = coreCreationPackages.faction;
const named = factions.filter(({ id }) => id !== 'factionless');
const personalMotivations = {
  first: { stance: 'support', text: 'Exploration' },
  second: { stance: 'oppose', text: 'Censorship' },
  third: { stance: 'support', text: 'Open access', goal: 'Publish a guide' },
};
const draft = (ego) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt: '2026-11-27T07:00:00.000Z',
  ego: { id: 'faction-test', name: 'Faction test', pronouns: '', concept: '', aptitudes: { cog: 20 }, ...ego }, sleeves: [],
});

test('core factions cover fifteen broad affiliations, six regional choices, and Factionless', () => {
  assert.deepEqual(factions.map(({ id }) => id), [
    'anarchist', 'argonaut', 'barsoomian', 'brinker', 'criminal', 'extropian', 'hypercorp', 'jovian',
    'lunar-orbital', 'mercurial', 'reclaimer', 'scum', 'socialite', 'titanian', 'venusian', 'factionless',
    'solarian', 'sifter', 'belter', 'europan', 'ringer', 'skimmer',
  ]);
  assert.deepEqual(factions.filter(({ group }) => group === 'Regional').map(({ name }) => name), ['Solarian', 'Sifter', 'Belter', 'Europan', 'Ringer', 'Skimmer']);
  for (const option of factions) {
    assert.equal(option.page, 44);
    assert.equal(option.grants.length, 1);
    assert.equal(option.grants[0].points, 30);
  }
  assert.equal(factions.find(({ id }) => id === 'anarchist').grants[0].skill, 'Know: Anarchists');
  assert.equal(factions.find(({ id }) => id === 'argonaut').grants[0].skill, 'Know: Argonauts');
});

test('every named faction supplies traced Know points linked to Cognition and tolerates missing aptitudes', () => {
  for (const { id, name, grants } of named) {
    for (const aptitudes of [{ cog: 20 }, {}]) {
      const { skills, unassignedKnowPoints } = calculateStartingSkills({ aptitudes, packages: { faction: { id } } });
      assert.equal(unassignedKnowPoints, 0);
      assert.equal(skills.length, 1);
      const [row] = skills;
      assert.equal(row.name, grants[0].skill);
      assert.equal(row.aptitude, 'cog');
      assert.equal(row.total, aptitudes.cog === undefined ? undefined : 50);
      assert.deepEqual(row.grants, [{ source: name, points: 30 }]);
    }
  }
});

test('regional faction Know grants merge with matching fields and preserve their Cognition link and cap', () => {
  const { skills } = calculateStartingSkills({
    aptitudes: { cog: 20, int: 30 }, artisticKnowFields: ['belters'],
    packages: { background: { id: 'infolife', fields: { 'know-1': '  BELTERS  ' } }, faction: { id: 'belter' } },
  });
  const row = skills.find(({ id }) => id === 'know:belters');
  assert.deepEqual([row.packagePoints, row.base, row.total, row.excess, row.isArt], [90, 20, 110, 30, false]);
  assert.deepEqual(row.grants, [{ source: 'Infolife', points: 60 }, { source: 'Belter', points: 30 }]);
});

test('a defector can move faction Know points without changing allegiance or motivation', () => {
  const packages = { faction: { id: 'belter' } };
  const skillTransfers = [{ from: 'know:belters', to: 'know:jovians', newKnowField: 'Jovians', points: 30 }];
  const ledger = calculateStartingSkills({ aptitudes: { cog: 20 }, packages, skillTransfers });
  assert.equal(ledger.transferResults[0].issue, undefined);
  assert.equal(ledger.skills.find(({ id }) => id === 'know:jovians').total, 50);
  assert.equal(ledger.skills.find(({ id }) => id === 'know:belters').allocatedPoints, 0);
  assert.equal(defaultFactionMotivation(packages), '+Belter Interests');
});

test('all named factions reserve the third personal slot and support custom motivation text and goals', () => {
  for (const { id, name } of named) {
    const packages = { faction: { id } };
    assert.equal(defaultFactionMotivation(packages), `+${name} Interests`);
    assert.deepEqual(listStartingMotivations({ packages, personalMotivations }).map(({ label }) => label), [`+${name} Interests`, '+Exploration', '−Censorship']);
    const customized = { faction: { id, motivation: '−Corruption', motivationGoal: 'Publish the evidence' } };
    assert.deepEqual(listStartingMotivations({ packages: customized, personalMotivations })[0], { label: '−Corruption', goal: 'Publish the evidence' });
  }
  for (const packages of [{}, { faction: { id: 'factionless' } }]) {
    assert.equal(defaultFactionMotivation(packages), undefined);
    assert.equal(listStartingMotivations({ packages, personalMotivations }).length, 3);
    assert.equal(listStartingMotivations({ packages, personalMotivations })[2].goal, 'Publish a guide');
  }
});

test('all faction IDs round-trip with their saved motivations and reject inappropriate fields', () => {
  for (const { id } of named) {
    const character = draft({ packages: { faction: { id, motivation: '+Shared science', motivationGoal: 'Publish a guide' } }, personalMotivations });
    assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  }
  const unaligned = draft({ packages: { faction: { id: 'factionless', fields: { 'know-1': 'Belters' } } }, personalMotivations });
  assert.deepEqual(previewBackup(encodeBackup([unaligned])).drafts[0], unaligned);
  assert.throws(() => previewBackup(encodeBackup([draft({ packages: { faction: { id: 'regional' } } })])), /supported choice for this category/);
  assert.throws(() => previewBackup(encodeBackup([draft({ packages: { faction: { id: 'belter', fields: { 'know-1': 'Jovians' } } } })])), /limited to slots/);
});

test('faction motivation reaches player printing while faction Know totals reach both print layouts', () => {
  for (const { id, name, grants } of named) {
    const character = draft({ packages: { faction: { id } }, personalMotivations });
    const player = buildPrintableDossier(character, 'player', []);
    assert.equal(player.packages.faction.id, id);
    assert.equal(player.motivations[0].label, `+${name} Interests`);
    assert.ok(!player.motivations.some(({ label }) => label === '+Open access'));
    for (const audience of ['player', 'gm']) {
      const dossier = buildPrintableDossier(character, audience, []);
      assert.equal(dossier.skillLedger.skills.find(({ name }) => name === grants[0].skill).total, 50);
      if (audience === 'gm') assert.deepEqual(dossier.motivations, []);
    }
  }
});
