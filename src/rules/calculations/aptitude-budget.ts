import { aptitudes } from '../../types/character.ts';
import type { AptitudeScores } from '../../types/character.ts';
import { coreAptitudeRules } from '../datasets/aptitude-templates.ts';

export function evaluateAptitudeBudget(scores: AptitudeScores) {
  const entered = aptitudes.flatMap(({ id, label }) => {
    const score = scores[id];
    return score === undefined ? [] : [{ id, label, score }];
  });
  const total = entered.reduce((sum, { score }) => sum + score, 0);
  const aptitudeCp = Math.max(0, total - coreAptitudeRules.basePoints);

  return {
    entered: entered.length,
    total,
    templatePointsLeft: Math.max(0, coreAptitudeRules.basePoints - total),
    aptitudeCp,
    baseCpLeft: coreAptitudeRules.startingCp - aptitudeCp,
    exceedsMaximumCp: aptitudeCp > coreAptitudeRules.startingCp + coreAptitudeRules.maximumTraitBonus,
    outOfRange: entered.filter(({ score }) => score < coreAptitudeRules.minimum || score > coreAptitudeRules.maximum),
  };
}
