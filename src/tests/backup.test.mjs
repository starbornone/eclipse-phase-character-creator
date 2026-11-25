import assert from 'node:assert/strict';
import { test } from 'node:test';
import { copyBackupDrafts, encodeBackup, previewBackup } from '../features/backup/backup.ts';

const updatedAt = '2026-11-25T01:00:00.000Z';
const ego = { id: 'ego-1', name: 'Test ego', pronouns: '', concept: 'Explorer', aptitudes: { int: 15, wil: 0 } };
const firstSleeve = { id: 'sleeve-1', egoId: ego.id, morphDefinitionId: 'bouncer', assignedAt: updatedAt };
const event = { date: '2024-02-29', location: 'Habitat', cause: 'Transfer', notes: 'History note' };
const nextSleeve = { ...firstSleeve, id: 'sleeve-2', morphDefinitionId: 'case', event };
const draft = { schemaVersion: 2, revision: 4, rulesVersion: 'ep2-quick-start-2.4', updatedAt, ego, sleeves: [firstSleeve, nextSleeve] };

test('round-trip partial aptitude scores, sleeve order, and event details', () => {
  assert.deepEqual(previewBackup(encodeBackup([draft])), { drafts: [draft], migratedCount: 0 });
});

test('round-trip core package choices and reject unknown packages and field slots', () => {
  const packages = {
    background: { id: 'freelancer', fields: { 'know-1': 'Habitat Ops' } },
    faction: { id: 'factionless', fields: { 'know-1': 'Local Politics' }, motivation: '+Open access' },
  };
  const skillTransfers = [{ from: 'active:Interface', to: 'know:local politics', points: 5 }];
  const withPackages = { ...draft, ego: { ...ego, packages, artisticKnowFields: ['local politics'], skillTransfers } };
  assert.deepEqual(previewBackup(encodeBackup([withPackages])).drafts[0], withPackages);
  const invalidChoice = { ...draft, ego: { ...ego, packages: { career: { id: 'freelancer' } } } };
  assert.throws(() => previewBackup(encodeBackup([invalidChoice])), /supported choice for this category/);
  const invalidSlot = { ...draft, ego: { ...ego, packages: { faction: { id: 'argonaut', fields: { 'know-1': 'Politics' } } } } };
  assert.throws(() => previewBackup(encodeBackup([invalidSlot])), /limited to slots/);
  const invalidTransfer = { ...draft, ego: { ...ego, skillTransfers: [{ ...skillTransfers[0], points: 0 }] } };
  assert.throws(() => previewBackup(encodeBackup([invalidTransfer])), /positive whole number/);
});

test('report a version 1 draft migration and retain its sleeve', () => {
  const { sleeves, ...fields } = draft;
  const oldDraft = { ...fields, schemaVersion: 1, sleeve: sleeves[0] };
  const preview = previewBackup(encodeBackup([oldDraft]));
  assert.deepEqual(preview, { drafts: [{ ...draft, sleeves: [firstSleeve] }], migratedCount: 1 });
});

test('preserve new Know destinations and reject conflicting field keys', () => {
  const transfer = { from: 'active:Athletics', to: 'know:orbital cartography', points: 10, newKnowField: 'Orbital Cartography' };
  const withTransfer = { ...draft, ego: { ...ego, skillTransfers: [transfer] } };
  assert.deepEqual(previewBackup(encodeBackup([withTransfer])).drafts[0], withTransfer);
  const conflicting = { ...withTransfer, ego: { ...ego, skillTransfers: [{ ...transfer, to: 'know:astrogation' }] } };
  assert.throws(() => previewBackup(encodeBackup([conflicting])), /key matching the new Know field/);
});

test('round-trip skill purchases and reject malformed entries', () => {
  const purchase = { to: 'know:orbital cartography', points: 4, newKnowField: 'Orbital Cartography' };
  const withPurchase = { ...draft, ego: { ...ego, skillPurchases: [purchase] } };
  assert.deepEqual(previewBackup(encodeBackup([withPurchase])).drafts[0], withPurchase);
  const invalid = { ...withPurchase, ego: { ...ego, skillPurchases: [{ ...purchase, points: 0 }] } };
  assert.throws(() => previewBackup(encodeBackup([invalid])), /skillPurchases\[0\].points must be a positive whole number/);
});

test('round-trip Flex and languages and reject invalid values', () => {
  const withCustomization = { ...draft, ego: { ...ego, egoFlex: 3, languages: ['English', 'Skandinavíska'] } };
  assert.deepEqual(previewBackup(encodeBackup([withCustomization])).drafts[0], withCustomization);
  const invalidFlex = { ...draft, ego: { ...ego, egoFlex: 4 } };
  assert.throws(() => previewBackup(encodeBackup([invalidFlex])), /egoFlex must be a whole number from 1 to 3/);
  const duplicates = { ...draft, ego: { ...ego, languages: ['English', ' english '] } };
  assert.throws(() => previewBackup(encodeBackup([duplicates])), /languages must be unique/);
  const blank = { ...draft, ego: { ...ego, languages: ['  '] } };
  assert.throws(() => previewBackup(encodeBackup([blank])), /languages\[0\] must be a non-empty string/);
});

test('round-trip partial reputation and validate its keys and starting scores', () => {
  const withReputation = (reputation) => ({ ...draft, ego: { ...ego, reputation } });
  const valid = withReputation({ '@-rep': 80, 'i-rep': 0 });
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  assert.throws(() => previewBackup(encodeBackup([withReputation({ 'u-rep': 5 })])), /supported reputation networks/);
  for (const value of [81, -1, 0.5, '50']) {
    assert.throws(() => previewBackup(encodeBackup([withReputation({ 'r-rep': value })])), /r-rep must be a whole number from 0 to 80/);
  }
});

test('round-trip specializations and reject unsupported IDs and duplicate names within a skill', () => {
  const first = { skillId: 'active:Fray', name: 'Full Defense' };
  const second = { skillId: 'know:astronomy', name: 'Comets' };
  const withChoices = (specializations) => ({ ...draft, ego: { ...ego, specializations } });
  const valid = withChoices([first, second]);
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  assert.throws(() => previewBackup(encodeBackup([withChoices([first, { ...first, name: ' full  defense ' }])])), /specializations must be unique/);
  assert.throws(() => previewBackup(encodeBackup([withChoices([{ ...first, skillId: 'actives:Fray' }])])), /supported skill ID/);
});

test('round-trip ego traits and validate trait levels, uniqueness, and the bonus cap', () => {
  const withTraits = (traits) => ({ ...draft, ego: { ...ego, traits } });
  const adaptability = { id: 'adaptability', level: 2 };
  const badLuck = { id: 'bad-luck', level: 1 };
  const valid = withTraits([adaptability, badLuck]);
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  assert.throws(() => previewBackup(encodeBackup([withTraits([{ id: 'unknown-trait', level: 1 }])])), /supported ego trait/);
  assert.throws(() => previewBackup(encodeBackup([withTraits([{ ...adaptability, level: 3 }])])), /supported level/);
  assert.throws(() => previewBackup(encodeBackup([withTraits([adaptability, adaptability])])), /traits must be unique/);
  assert.throws(() => previewBackup(encodeBackup([withTraits([badLuck, { id: 'enemy', level: 1 }])])), /6 CP limit/);
});

test('round-trip custom Active fields and validate category, aptitude, and canonical destination', () => {
  const skillId = 'active-field:pilot:sail skiff';
  const field = { category: 'pilot', name: 'Sail Skiff', aptitude: 'ref' };
  const purchase = { to: skillId, points: 5, customActiveField: field };
  const withPurchase = (entry) => ({ ...draft, ego: {
    ...ego, skillPurchases: [entry], specializations: [{ skillId, name: 'Storm sailing' }],
  } });
  const valid = withPurchase(purchase);
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  for (const customActiveField of [{ ...field, aptitude: 'cog' }, { ...field, category: 'invented' }, { ...field, name: 'Different' }]) {
    assert.throws(() => previewBackup(encodeBackup([withPurchase({ ...purchase, customActiveField })])), /customActiveField.*matching the destination/);
  }
  const sample = { ...purchase, to: 'active-field:pilot:space', customActiveField: { ...field, name: ' space ' } };
  assert.throws(() => previewBackup(encodeBackup([withPurchase(sample)])), /customActiveField.*matching the destination/);
});

test('round-trip the Expert Training skill and require one valid selection', () => {
  const trait = { id: 'expert-training', level: 1, skillId: 'active-field:hardware:drone maintenance' };
  const withTraits = (traits) => ({ ...draft, ego: { ...ego, traits } });
  const valid = withTraits([trait]);
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  assert.throws(() => previewBackup(encodeBackup([withTraits([{ id: trait.id, level: 1 }])])), /skillId must be a non-empty string/);
  assert.throws(() => previewBackup(encodeBackup([withTraits([{ ...trait, skillId: 'unknown' }])])), /supported skill ID/);
  assert.throws(() => previewBackup(encodeBackup([withTraits([trait, { ...trait, skillId: 'active:Fray' }])])), /traits must be unique/);
});

test('round-trip Active package slots and reject slots outside the selected package', () => {
  const fields = { 'hardware-1': 'Drone Maintenance', 'pilot-1': 'Space' };
  const withPackage = (id) => ({ ...draft, ego: { ...ego, packages: { background: { id, fields } } } });
  const colonist = withPackage('colonist');
  assert.deepEqual(previewBackup(encodeBackup([colonist])).drafts[0], colonist);
  assert.throws(() => previewBackup(encodeBackup([withPackage('enclaver')])), /limited to slots in the selected package/);
});

test('round-trip partial motivations and validate slots, stances, and text', () => {
  const motivation = { stance: 'oppose', text: 'Censorship' };
  const withChoices = (personalMotivations) => ({ ...draft, ego: { ...ego, personalMotivations } });
  const valid = withChoices({ third: motivation });
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  assert.throws(() => previewBackup(encodeBackup([withChoices({ fourth: motivation })])), /three personal motivation slots/);
  assert.throws(() => previewBackup(encodeBackup([withChoices({ first: { ...motivation, stance: 'other' } })])), /stance must be support or oppose/);
  assert.throws(() => previewBackup(encodeBackup([withChoices({ first: { ...motivation, text: ' ' } })])), /text must be a non-empty string/);
});

test('round-trip personal and faction goals and reject misplaced or non-text goals', () => {
  const packages = { faction: { id: 'argonaut', motivationGoal: 'Publish the survey' } };
  const personalMotivations = { first: { stance: 'support', text: '', goal: 'Map a route' } };
  const valid = { ...draft, ego: { ...ego, packages, personalMotivations } };
  assert.deepEqual(previewBackup(encodeBackup([valid])).drafts[0], valid);
  const misplaced = { ...valid, ego: { ...valid.ego, packages: { faction: { ...packages.faction, id: 'factionless' } } } };
  assert.throws(() => previewBackup(encodeBackup([misplaced])), /motivationGoal must be absent outside a named faction/);
  const malformed = { ...valid, ego: { ...valid.ego, personalMotivations: { first: { ...personalMotivations.first, goal: 3 } } } };
  assert.throws(() => previewBackup(encodeBackup([malformed])), /goal must be a string/);
});

test('reject malformed JSON, unsupported formats, and incomplete or conflicting records', () => {
  assert.throws(() => previewBackup('{'), /invalid JSON/);
  assert.throws(() => previewBackup('{}'), /Eclipse Phase character backup/);
  assert.throws(() => previewBackup(encodeBackup([])), /zero drafts/);
  const unsupported = { ...JSON.parse(encodeBackup([draft])), version: 2 };
  assert.throws(() => previewBackup(JSON.stringify(unsupported)), /unsupported/);
  assert.throws(() => previewBackup(encodeBackup([draft, draft])), /ego ids must be unique/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [firstSleeve, firstSleeve] }])), /sleeve ids must be unique/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [{ ...firstSleeve, egoId: 'another-ego' }] }])), /id of its draft/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, ego: { ...ego, aptitudes: { int: 100 } } }])), /whole number/);
  assert.throws(() => previewBackup(encodeBackup([{ ...draft, sleeves: [{ ...nextSleeve, event: { ...event, date: '2025-02-29' } }] }])), /calendar date/);
});

test('give restored copies new ego and sleeve ids while preserving their content', () => {
  let sequence = 0;
  const [copy] = copyBackupDrafts([draft], () => `new-${++sequence}`);
  assert.equal(copy.revision, 1);
  assert.equal(copy.ego.id, 'new-1');
  assert.equal(copy.updatedAt, draft.updatedAt);
  assert.deepEqual(copy.sleeves, [
    { ...firstSleeve, id: 'new-2', egoId: 'new-1' },
    { ...nextSleeve, id: 'new-3', egoId: 'new-1' },
  ]);
  assert.equal(draft.ego.id, 'ego-1');
});
