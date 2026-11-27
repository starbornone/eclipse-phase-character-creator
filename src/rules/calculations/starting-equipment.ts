import { startingEquipment } from '../datasets/starting-equipment.ts';
import { startingMorphBudgetRules } from '../datasets/starting-morph-budget.ts';

export function traceStartingEquipment(purchases: readonly string[] = []) {
  const counts = new Map<string, number>();
  for (const id of purchases) counts.set(id, (counts.get(id) ?? 0) + 1);

  return startingEquipment.flatMap((item) => {
    const quantity = counts.get(item.id);
    if (quantity === undefined) return [];
    const mpPerItem = startingMorphBudgetRules.gearMpByComplexity[item.complexity];
    return [{ ...item, quantity, mpPerItem, totalMp: mpPerItem * quantity }];
  });
}
