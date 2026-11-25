import type { EgoTraitChoice } from '../../types/character.ts';
import { findEgoTrait } from '../datasets/ego-traits.ts';

export function traceEgoTraits(choices: readonly EgoTraitChoice[] = []) {
  return choices.flatMap(({ id, level }) => {
    const trait = findEgoTrait(id);
    const cp = Number.isInteger(level) ? trait?.cpByLevel[level - 1] : undefined;
    return trait && cp !== undefined ? [{ ...trait, level, cp }] : [];
  });
}

export function evaluateEgoTraitBudget(choices: readonly EgoTraitChoice[] = []) {
  let cost = 0;
  let bonus = 0;
  for (const { cp } of traceEgoTraits(choices)) {
    if (cp > 0) cost += cp;
    else bonus -= cp;
  }
  return { cost, bonus };
}
