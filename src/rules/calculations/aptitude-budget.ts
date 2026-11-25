import { aptitudes } from '../../types/character.ts';
import type { AptitudeScores, SkillPointPurchase } from '../../types/character.ts';
import { coreAptitudeRules } from '../datasets/aptitude-templates.ts';

// Eclipse Phase Second Edition, p. 46.
export const skillPointsPerCp = 5;

export function evaluateAptitudeBudget(scores: AptitudeScores, skillPurchases: readonly SkillPointPurchase[] = []) {
  const entered = aptitudes.flatMap(({ id, label }) => {
    const score = scores[id];
    return score === undefined ? [] : [{ id, label, score }];
  });
  const total = entered.reduce((sum, { score }) => sum + score, 0);
  const aptitudeCp = Math.max(0, total - coreAptitudeRules.basePoints);
  const purchasedSkillPoints = skillPurchases.reduce((sum, { points }) => (
    Number.isSafeInteger(points) && points > 0 ? sum + points : sum
  ), 0);
  const skillCp = Math.ceil(purchasedSkillPoints / skillPointsPerCp);
  const totalCp = aptitudeCp + skillCp;

  return {
    entered: entered.length,
    total,
    templatePointsLeft: Math.max(0, coreAptitudeRules.basePoints - total),
    aptitudeCp,
    skillCp,
    totalCp,
    purchasedSkillPoints,
    unspentPurchasedSkillPoints: skillCp * skillPointsPerCp - purchasedSkillPoints,
    baseCpLeft: coreAptitudeRules.startingCp - totalCp,
    exceedsMaximumCp: totalCp > coreAptitudeRules.startingCp + coreAptitudeRules.maximumTraitBonus,
    outOfRange: entered.filter(({ score }) => score < coreAptitudeRules.minimum || score > coreAptitudeRules.maximum),
  };
}
