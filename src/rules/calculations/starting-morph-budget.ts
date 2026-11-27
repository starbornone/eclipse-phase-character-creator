import type { CharacterDraft, Ego, MorphDefinition } from '../../types/character.ts';
import { resourcesTrait } from '../datasets/ego-traits.ts';
import { findSampleMorph } from '../datasets/sample-morphs.ts';
import { startingMorphBudgetRules } from '../datasets/starting-morph-budget.ts';
import { traceEgoTraits } from './ego-traits.ts';
import { traceStartingEquipment } from './starting-equipment.ts';

const { defaultAllowance, mpPerTemporaryFlex, temporaryFlexCap } = startingMorphBudgetRules;
// Leave room for the entire Resources bonus within safe integer arithmetic.
const maximumAllowance = Number.MAX_SAFE_INTEGER - resourcesTrait.cpByLevel.length;

export function isStartingMorphAllowance(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= maximumAllowance;
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
) {
  const allowance = ego.startingMorphPoints ?? defaultAllowance;
  const resources = traceEgoTraits(ego.traits).find(({ id }) => id === resourcesTrait.id)?.level ?? 0;
  const available = allowance + resources;
  const cost = morph?.morphPoints;
  const equipmentCost = traceStartingEquipment(ego.startingEquipment).reduce((sum, { totalMp }) => sum + totalMp, 0);
  const remaining = cost === undefined ? undefined : available - cost - equipmentCost;
  const temporaryFlex = hasResleeved ? 0 : remaining === undefined ? undefined
    : Math.min(temporaryFlexCap, Math.floor(Math.max(0, remaining) / mpPerTemporaryFlex));

  return {
    allowance, resources, available, cost, equipmentCost, remaining, temporaryFlex, hasResleeved,
    morphName: morph?.name,
    costSource: morph?.morphPointsSource ?? morph?.source,
  };
}

export function startingMorphBudgetForDraft(draft: CharacterDraft) {
  return evaluateStartingMorphBudget(draft.ego, findSampleMorph(draft.sleeves[0]?.morphDefinitionId), draft.sleeves.length > 1);
}
