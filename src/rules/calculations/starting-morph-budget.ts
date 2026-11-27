import type { CharacterDraft, Ego, MorphDefinition, MorphTraitChoice } from '../../types/character.ts';
import { resourcesTrait } from '../datasets/ego-traits.ts';
import { findSampleMorph } from '../datasets/sample-morphs.ts';
import { startingMorphBudgetRules } from '../datasets/starting-morph-budget.ts';
import { traceEgoTraits } from './ego-traits.ts';
import { evaluateMorphTraits } from './morph-traits.ts';
import { traceStartingEquipment } from './starting-equipment.ts';

const { defaultAllowance, mpPerTemporaryFlex, temporaryFlexCap, negativeMorphTraitCap } = startingMorphBudgetRules;
// Leave room for the Resources bonus and any selected negative morph trait bonuses.
const maximumAllowance = Number.MAX_SAFE_INTEGER - resourcesTrait.cpByLevel.length;

export function isStartingMorphAllowance(value: unknown, morphTraitBonus = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximumAllowance - morphTraitBonus;
}

export function parseStartingMorphAllowance(input: string) {
  const text = input.trim();
  if (!text) return { allowance: undefined };
  const allowance = Number(text);
  if (/^\d+$/.test(text) && isStartingMorphAllowance(allowance)) return { allowance };
  return { issue: 'Enter a supported whole number of Morph Points, zero or greater.' };
}

export function evaluateStartingMorphBudget(
  ego: Pick<Ego, 'startingMorphPoints' | 'traits' | 'startingEquipment'>,
  morph?: MorphDefinition,
  hasResleeved = false,
  choices?: readonly MorphTraitChoice[],
) {
  const allowance = ego.startingMorphPoints ?? defaultAllowance;
  const resources = traceEgoTraits(ego.traits).find(({ id }) => id === resourcesTrait.id)?.level ?? 0;
  const { cost: morphTraitCost, bonus } = evaluateMorphTraits(morph, choices);
  const morphTraitBonus = Math.min(bonus, negativeMorphTraitCap);
  const available = allowance + resources + morphTraitBonus;
  const cost = morph?.morphPoints;
  const equipmentCost = traceStartingEquipment(ego.startingEquipment).reduce((sum, { totalMp }) => sum + totalMp, 0);
  const remaining = cost === undefined ? undefined : available - cost - equipmentCost - morphTraitCost;
  const temporaryFlex = hasResleeved ? 0 : remaining === undefined ? undefined
    : Math.min(temporaryFlexCap, Math.floor(Math.max(0, remaining) / mpPerTemporaryFlex));

  return {
    allowance, resources, available, cost, equipmentCost, morphTraitCost, morphTraitBonus, remaining, temporaryFlex, hasResleeved,
    morphName: morph?.name,
    costSource: morph?.morphPointsSource ?? morph?.source,
  };
}

export function startingMorphBudgetForDraft(draft: CharacterDraft) {
  const first = draft.sleeves[0];
  return evaluateStartingMorphBudget(draft.ego, findSampleMorph(first?.morphDefinitionId), draft.sleeves.length > 1, first?.morphTraits);
}
