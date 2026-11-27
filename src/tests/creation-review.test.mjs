import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { reviewCreation } from '../rules/calculations/creation-review.ts';
import { parseAptitudes } from '../rules/calculations/draft.ts';
import { traceStartingPsi } from '../rules/calculations/psi.ts';
import { parseReputation } from '../rules/calculations/reputation.ts';
import { deriveStartingGear } from '../rules/calculations/starting-gear.ts';
import { evaluateStartingMorphBudget, parseStartingMorphAllowance } from '../rules/calculations/starting-morph-budget.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { findSampleMorph } from '../rules/datasets/sample-morphs.ts';

const scores = { cog: '15', int: '15', ref: '15', sav: '15', som: '15', wil: '15' };
const blank = { cog: '', int: '', ref: '', sav: '', som: '', wil: '' };
const completePackages = {
  background: { id: 'colonist', fields: { 'hardware-1': 'Aerospace', 'pilot-1': 'Air', 'know-1': 'Orbital Mechanics', 'know-2': 'Space Habitats' } },
  career: { id: 'academic', fields: { 'know-1': 'History', 'know-2': 'Linguistics', 'know-3': 'Sociology' } },
  interest: { id: 'fighter' }, faction: { id: 'argonaut' },
};
const motivations = { first: { stance: 'support', text: 'Open research' }, second: { stance: 'oppose', text: 'Censorship' } };

function review({
  aptitudeFields = scores, reputationFields = { '@-rep': '60', 'c-rep': '40' }, packages = completePackages,
  morphId = 'bouncer', allowanceField = '', traits = [], skillTransfers = [], skillPurchases = [],
  startingEquipment = [], psi, psiSleightPurchases, languages = ['English', 'Spanish'], personalMotivations = motivations,
  startingCampaign = 'gatecrashing', useInfomorphPack = false, swaps = [], specializations = [],
} = {}) {
  const aptitudeInput = parseAptitudes(aptitudeFields);
  const reputationInput = parseReputation(reputationFields);
  const { allowance, issue } = parseStartingMorphAllowance(allowanceField);
  const startingMorph = findSampleMorph(morphId);
  const startingGear = deriveStartingGear(startingCampaign, packages.career?.id, startingMorph?.category, swaps, useInfomorphPack);
  return reviewCreation({
    aptitudeInput, reputationInput, morphAllowanceIssue: issue, packages, startingMorph, hasFirstSleeve: Boolean(morphId),
    ego: { languages, personalMotivations, startingCampaign, specializations, traits },
    startingGear, discardedGearSwaps: swaps.length - startingGear.appliedSwaps.length,
    customizationBudget: aptitudeInput.scores && evaluateAptitudeBudget(aptitudeInput.scores, skillPurchases,
      { reputation: reputationInput.scores, languages, traits, psi, psiSleightPurchases, specializations }),
    morphBudget: issue ? undefined : evaluateStartingMorphBudget({ traits, startingEquipment, startingMorphPoints: allowance }, startingMorph),
    startingPsi: traceStartingPsi({ packages, traits, psi, psiSleightPurchases }),
    skills: calculateStartingSkills({ aptitudes: aptitudeInput.scores ?? {}, packages, traits, skillTransfers, skillPurchases, specializations }),
  });
}

test('the creation review distinguishes a blank, saveable draft from supported choices that pass', () => {
  const pending = review({ aptitudeFields: blank, reputationFields: {}, packages: {}, morphId: '', languages: [], personalMotivations: {}, startingCampaign: '' });
  assert.deepEqual(pending.map(({ id }) => id), [
    'packages', 'motivations', 'aptitudes-missing', 'languages', 'reputation-unspent', 'campaign-gear', 'first-morph',
  ]);
  assert.ok(pending.every(({ severity }) => severity === 'review'));
  assert.deepEqual(review(), []);
  assert.deepEqual(review({ morphId: 'survey-sleeve' }).map(({ id }) => id), ['morph-price']);
});

test('free languages follow the final aptitudes and an eligible Infomorph pack fills the campaign slot', () => {
  const settings = { aptitudeFields: { ...scores, cog: '20' }, startingCampaign: '', useInfomorphPack: true };
  const issues = review(settings);
  assert.deepEqual(issues.map(({ id, target }) => [id, target]), [
    ['languages', 'creation-languages'], ['campaign-gear', 'creation-campaign'],
  ]);
  assert.deepEqual(review({ ...settings, morphId: 'operator', languages: ['English', 'Spanish', 'Arabic'] }), []);
  assert.ok(review({ personalMotivations: {} }).some(({ id, target }) => id === 'motivations' && target === 'creation-motivations-title'));
});

test('review points to stale purchases and specializations after changing earlier choices', () => {
  const issues = review({
    traits: [{ id: 'expert-training', level: 1, skillId: 'know:linguistics' }, { id: 'bad-luck', level: 1 }, { id: 'enemy', level: 1 }],
    packages: { ...completePackages, career: { id: 'academic', fields: { 'know-1': 'History', 'know-2': 'Cartography', 'know-3': 'Sociology' } } },
    specializations: [{ skillId: 'know:linguistics', name: 'English' }],
    psiSleightPurchases: ['Qualia'],
    swaps: [{ packId: 'gatecrashing', item: 'Autocook', replacement: 'Pressure Tent' }],
  });
  assert.deepEqual(issues.map(({ id }) => id), ['negative-ego-traits', 'psi-purchases', 'expert-training', 'specializations', 'gear-swaps']);
  assert.ok(issues.every(({ severity }) => severity === 'review'));
});

test('malformed form values use the existing save checks and target their exact inputs', () => {
  const issues = review({ aptitudeFields: { ...scores, ref: '1.5' }, reputationFields: { '@-rep': '81' }, allowanceField: '-1' });
  assert.deepEqual(issues.map(({ severity, target }) => [severity, target]), [
    ['input', 'aptitude-ref'], ['input', 'reputation-@-rep'], ['input', 'starting-morph-allowance'],
  ]);
});

test('the review reports current CP and MP deficits and supported aptitude bounds without blocking saves', () => {
  const issues = review({ aptitudeFields: { ...scores, cog: '35', int: '27', ref: '30' }, allowanceField: '2', startingEquipment: ['ecto'] });
  for (const [id, target, message] of [
    ['aptitudes-range', 'aptitude-cog', 'Use 5–30 for Cognition.'],
    ['cp-over-budget', 'aptitude-budget-title', 'Reduce current Customization Point spending by 27 CP.'],
    ['mp-over-budget', 'starting-morph-budget-title', 'Reduce first-sleeve spending by 3 MP or review the GM allowance.'],
  ]) {
    assert.deepEqual(issues.find((issue) => issue.id === id), { id, target, message, severity: 'review' });
  }
  assert.ok(review({ aptitudeFields: { ...scores, cog: '10' } }).some(({ id }) => id === 'aptitudes-unspent'));
});

test('package grants, Psi prerequisites and skill allocation problems update from the shared traces', () => {
  const packages = { ...completePackages, background: { id: 'lost' }, interest: { id: 'async' } };
  const skillPurchases = [{ to: 'active:Psi', points: 5 }];
  const pending = review({ packages, skillPurchases });
  assert.ok(pending.some(({ id, target }) => id === 'psi-required' && target === 'ego-trait-choice-psi'));
  assert.ok(pending.some(({ id }) => id === 'package-points'));
  assert.ok(pending.some(({ id }) => id === 'skill-allocations'));
  const traits = [{ id: 'psi', level: 1 }];
  const eligible = review({ packages, traits });
  assert.ok(eligible.some(({ id }) => id === 'psi-sub-strain'));
  const incomplete = review({ packages, traits, psi: { subStrain: 'stranger', freeSleight: 'Subliminal' } });
  assert.ok(incomplete.some(({ id, message }) => id === 'psi-choices' && message.includes('required drawback and free sleight')));
  const completePsi = review({ packages, traits, psi: { subStrain: 'stranger', drawback: 'Paranoia', freeSleight: 'Superior Kinesics' } });
  assert.ok(!completePsi.some(({ id }) => id.startsWith('psi-')));
  assert.ok(completePsi.some(({ id, message }) => id === 'skills-over-cap' && message.includes('Psi')));
});
