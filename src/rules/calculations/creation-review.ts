import { aptitudes, creationPackageKinds } from '../../types/character.ts';
import type { CreationPackages, MorphDefinition } from '../../types/character.ts';
import { coreAptitudeRules } from '../datasets/aptitude-templates.ts';
import { findCreationPackage, packageLabels } from '../datasets/creation-packages.ts';
import type { evaluateAptitudeBudget } from './aptitude-budget.ts';
import type { parseAptitudes } from './draft.ts';
import type { traceStartingPsi } from './psi.ts';
import { evaluateReputation, type parseReputation } from './reputation.ts';
import type { evaluateStartingMorphBudget } from './starting-morph-budget.ts';
import type { calculateStartingSkills } from './starting-skills.ts';

export interface CreationReviewIssue {
  id: string;
  target: string;
  severity: 'input' | 'review';
  message: string;
}

interface CreationReviewInputs {
  aptitudeInput: ReturnType<typeof parseAptitudes>;
  reputationInput: ReturnType<typeof parseReputation>;
  morphAllowanceIssue?: string;
  packages: CreationPackages;
  customizationBudget?: ReturnType<typeof evaluateAptitudeBudget>;
  startingMorph?: MorphDefinition;
  hasFirstSleeve: boolean;
  morphBudget?: ReturnType<typeof evaluateStartingMorphBudget>;
  startingPsi: ReturnType<typeof traceStartingPsi>;
  skills: ReturnType<typeof calculateStartingSkills>;
}

export function reviewCreation({
  aptitudeInput, reputationInput, morphAllowanceIssue, packages, customizationBudget,
  startingMorph, hasFirstSleeve, morphBudget, startingPsi, skills,
}: CreationReviewInputs) {
  const issues: CreationReviewIssue[] = [];
  const add = (id: string, target: string, message: string, severity: CreationReviewIssue['severity'] = 'review') => {
    issues.push({ id, target, message, severity });
  };

  if (aptitudeInput.issue) add('aptitude-input', `aptitude-${aptitudeInput.issue.id}`, aptitudeInput.issue.message, 'input');
  if (reputationInput.issue) add('reputation-input', `reputation-${reputationInput.issue.id}`, reputationInput.issue.message, 'input');
  if (morphAllowanceIssue) add('allowance-input', 'starting-morph-allowance', morphAllowanceIssue, 'input');

  const missingPackages = creationPackageKinds.filter((kind) => !findCreationPackage(kind, packages[kind]?.id));
  if (missingPackages.length) {
    add('packages', 'creation-packages-title', `Choose core packages for ${missingPackages.map((kind) => packageLabels[kind]).join(', ')}.`);
  }

  if (aptitudeInput.scores && customizationBudget) {
    const { scores } = aptitudeInput;
    const missing = aptitudes.filter(({ id }) => scores[id] === undefined);
    if (missing.length) {
      add('aptitudes-missing', `aptitude-${missing[0].id}`, `Enter aptitude scores for ${missing.map(({ label }) => label).join(', ')}.`);
    } else if (customizationBudget.templatePointsLeft > 0) {
      add('aptitudes-unspent', 'creation-aptitudes-title', `Allocate ${customizationBudget.templatePointsLeft} remaining base aptitude points.`);
    }
    const { outOfRange } = customizationBudget;
    if (outOfRange.length) {
      add('aptitudes-range', `aptitude-${outOfRange[0].id}`, `Use ${coreAptitudeRules.minimum}–${coreAptitudeRules.maximum} for ${outOfRange.map(({ label }) => label).join(', ')}.`);
    }
  }

  if (reputationInput.scores) {
    const { freeRemaining } = customizationBudget?.reputationBudget ?? evaluateReputation(reputationInput.scores);
    if (freeRemaining > 0) add('reputation-unspent', 'creation-reputation-title', `Assign ${freeRemaining} remaining free reputation points.`);
    if (customizationBudget && customizationBudget.cpLeft < 0) {
      add('cp-over-budget', 'aptitude-budget-title', `Reduce current Customization Point spending by ${-customizationBudget.cpLeft} CP.`);
    }
  }

  if (!startingPsi.level && startingPsi.requiredBy.length) {
    add('psi-required', 'ego-trait-choice-psi', `Choose the Psi trait required by ${startingPsi.requiredBy.join(' and ')}.`);
  } else if (startingPsi.level) {
    if (!startingPsi.subStrain) add('psi-sub-strain', 'starting-psi-title', 'Choose a starting Psi sub-strain.');
    else {
      const pendingPsi = [!startingPsi.drawback && 'required drawback', !startingPsi.freeSleight && 'free sleight'].filter(Boolean);
      if (pendingPsi.length) add('psi-choices', 'starting-psi-title', `Choose the ${pendingPsi.join(' and ')} for starting Psi.`);
    }
  }

  const unassigned = [skills.unassignedActivePoints && `${skills.unassignedActivePoints} Active`,
    skills.unassignedKnowPoints && `${skills.unassignedKnowPoints} Know`].filter(Boolean);
  if (unassigned.length) add('package-points', 'creation-packages-title', `Assign ${unassigned.join(' and ')} pending package skill points.`);
  const overCap = skills.skills.filter(({ excess }) => excess > 0);
  if (overCap.length) add('skills-over-cap', 'starting-skills-title', `Review skills over their starting cap: ${overCap.map(({ name }) => name).join(', ')}.`);
  const allocationIssues = [...skills.transferResults, ...skills.purchaseResults].filter(({ issue }) => issue);
  if (allocationIssues.length) {
    add('skill-allocations', 'starting-skills-title', `Review ${allocationIssues.length} invalid skill ${allocationIssues.length === 1 ? 'allocation' : 'allocations'}.`);
  }

  if (!hasFirstSleeve) add('first-morph', 'creation-first-morph-title', 'Choose a first morph.');
  else if (startingMorph?.morphPoints === undefined) add('morph-price', 'creation-first-morph-title', 'Verify the first sleeve’s MP cost.');
  if (morphBudget?.remaining !== undefined && morphBudget.remaining < 0) {
    add('mp-over-budget', 'starting-morph-budget-title', `Reduce first-sleeve spending by ${-morphBudget.remaining} MP or review the GM allowance.`);
  }

  return issues;
}
