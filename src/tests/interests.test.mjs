import assert from 'node:assert/strict';
import { test } from 'node:test';
import { coreCreationPackages } from '../rules/datasets/creation-packages.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { encodeBackup, previewBackup } from '../features/backup/backup.ts';
import { buildPrintableDossier } from '../features/dossier/print.ts';

const interests = coreCreationPackages.interest;
const aptitudes = { cog: 15, int: 20, ref: 25, sav: 10, som: 15, wil: 20 };
const pilotFields = { 'hardware-1': 'Aerospace', 'pilot-1': 'Air', 'pilot-2': 'Space' };
const calculate = (id, fields, extra = {}) => calculateStartingSkills({ aptitudes, packages: { interest: { id, fields } }, ...extra });
const draft = (ego) => ({
  schemaVersion: 2, revision: 1, rulesVersion: 'ep2-quick-start-2.4', updatedAt: '2026-11-27T08:00:00.000Z',
  ego: { id: 'interest-test', name: 'Interest test', pronouns: '', concept: '', aptitudes, ...ego }, sleeves: [],
});
const row = (ledger, name) => ledger.skills.find((skill) => skill.name === name);

test('fifteen non-Psi interests each account for 100 Active and 40 Know points, including incomplete drafts', () => {
  assert.equal(interests.length, 15);
  assert.ok(!interests.some(({ id }) => id === 'async'));
  for (const { id, name } of interests) {
    for (const scores of [aptitudes, {}]) {
      const ledger = calculate(id, undefined, { aptitudes: scores });
      const active = ledger.skills.filter(({ fieldKey }) => !fieldKey);
      const know = ledger.skills.filter(({ fieldKey }) => fieldKey);
      assert.equal(active.reduce((sum, { packagePoints }) => sum + packagePoints, ledger.unassignedActivePoints), 100, name);
      assert.equal(know.reduce((sum, { packagePoints }) => sum + packagePoints, ledger.unassignedKnowPoints), 40, name);
      for (const skill of ledger.skills) {
        if (!Object.keys(scores).length) assert.equal(skill.total, undefined);
        for (const grant of skill.grants) assert.equal(grant.source, name);
      }
    }
  }
});

test('Animal Handler and Forensics Specialist use their published fields and linked aptitudes', () => {
  const handler = calculate('animal-handler');
  assert.deepEqual(['Exotic Skill: Animal Handling', 'Medicine: Veterinary', 'Provoke', 'Know: Smart Animals'].map((name) => row(handler, name).total), [50, 55, 30, 55]);
  assert.equal(row(handler, 'Exotic Skill: Animal Handling').aptitude, 'sav');
  const forensics = calculate('forensics-specialist');
  assert.deepEqual(['Medicine: Forensics', 'Perceive', 'Research', 'Know: Physiology'].map((name) => row(forensics, name).total), [55, 80, 40, 55]);
  assert.equal(row(forensics, 'Perceive').multiplier, 2);
});

test('Jack-of-All-Trades keeps four separate 25-point grants and Artist/Icon can use an Art field', () => {
  const generalist = calculate('jack-of-all-trades', { 'know-1': 'Habitat Life' });
  assert.deepEqual(['Guns', 'Infosec', 'Persuade', 'Research'].map((name) => row(generalist, name).packagePoints), [25, 25, 25, 25]);
  const artist = calculate('artist-icon', { 'know-1': 'Music' }, { artisticKnowFields: ['music'] });
  assert.deepEqual([row(artist, 'Know: Music').aptitude, row(artist, 'Know: Music').total], ['int', 60]);
});

test('Pilot assigns its two grants independently and leaves cleared fields pending', () => {
  const selected = calculate('pilot', pilotFields);
  assert.deepEqual(['Hardware: Aerospace', 'Pilot: Air', 'Pilot: Space', 'Know: Flight Crew Ops'].map((name) => row(selected, name).total), [45, 55, 65, 55]);
  assert.equal(selected.unassignedActivePoints, 0);
  const partial = calculate('pilot', { ...pilotFields, 'pilot-2': '   ' });
  assert.equal(partial.unassignedActivePoints, 40);
  assert.equal(row(partial, 'Pilot: Space'), undefined);
  assert.equal(row(partial, 'Pilot: Air').packagePoints, 30);
});

test('matching Pilot fields merge, flag the cap, and support transferring the excess', () => {
  const fields = { ...pilotFields, 'pilot-2': '  AIR  ' };
  const merged = calculate('pilot', fields);
  assert.deepEqual([row(merged, 'Pilot: Air').packagePoints, row(merged, 'Pilot: Air').total, row(merged, 'Pilot: Air').excess], [70, 95, 15]);
  const fixed = calculate('pilot', fields, { skillTransfers: [{ from: 'active:Pilot: Air', to: 'active:Pilot: Space', points: 15 }] });
  assert.equal(fixed.transferResults[0].issue, undefined);
  assert.equal(row(fixed, 'Pilot: Air').total, 80);
  assert.equal(row(fixed, 'Pilot: Space').total, 40);
});

test('custom Pilot fields merge across slots and saved allocations are rechecked when fields change', () => {
  const fields = { ...pilotFields, 'pilot-1': 'Submersible Drone', 'pilot-2': ' submersible   drone ' };
  const custom = row(calculate('pilot', fields), 'Pilot: Submersible Drone');
  assert.equal(custom.id, 'active-field:pilot:submersible drone');
  assert.equal(custom.aptitude, 'ref');
  assert.equal(custom.packagePoints, 70);
  const allocation = { skillTransfers: [{ from: 'active:Pilot: Air', to: 'active:Guns', points: 20 }] };
  assert.equal(calculate('pilot', pilotFields, allocation).transferResults[0].issue, undefined);
  assert.match(calculate('pilot', { ...pilotFields, 'pilot-1': 'Ground' }, allocation).transferResults[0].issue, /source skill/);
});

test('Fighter merges with Soldier grants, retains source traces, and doubles Reflexes once', () => {
  const ledger = calculate('fighter', undefined, { packages: { career: { id: 'soldier' }, interest: { id: 'fighter' } } });
  assert.deepEqual([row(ledger, 'Fray').packagePoints, row(ledger, 'Fray').base, row(ledger, 'Fray').total], [60, 50, 110]);
  assert.deepEqual(row(ledger, 'Guns').grants, [{ source: 'Soldier', points: 60 }, { source: 'Fighter', points: 40 }]);
  assert.equal(row(ledger, 'Guns').excess, 45);
});

test('every interest round-trips its available slots while invalid slots are rejected', () => {
  for (const { id, grants } of interests) {
    const fields = Object.fromEntries(grants.filter(({ slot }) => slot).map(({ slot, activeField }) => [slot, activeField === 'pilot' ? 'Space' : activeField === 'hardware' ? 'Robotics' : 'Local History']));
    const character = draft({ packages: { interest: { id, fields } } });
    assert.deepEqual(previewBackup(encodeBackup([character])).drafts[0], character);
  }
  assert.throws(() => previewBackup(encodeBackup([draft({ packages: { interest: { id: 'jammer', fields: { 'pilot-2': 'Air' } } } })])), /limited to slots/);
  assert.throws(() => previewBackup(encodeBackup([draft({ packages: { career: { id: 'pilot' } } })])), /supported choice for this category/);
});

test('Pilot fields reach both print ledgers and the player package summary', () => {
  const character = draft({ packages: { interest: { id: 'pilot', fields: pilotFields } } });
  for (const audience of ['player', 'gm']) {
    const dossier = buildPrintableDossier(character, audience, []);
    assert.equal(row(dossier.skillLedger, 'Pilot: Air').total, 55);
    assert.equal(row(dossier.skillLedger, 'Pilot: Space').total, 65);
    if (audience === 'player') assert.deepEqual(dossier.packages.interest.fields, pilotFields);
  }
});
