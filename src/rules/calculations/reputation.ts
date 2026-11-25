import { reputationNetworks, startingReputationRules } from '../datasets/reputation.ts';
import type { ReputationScores } from '../../types/character.ts';
import type { ReputationNetwork } from '../datasets/reputation.ts';

export type ReputationInputs = Partial<Record<ReputationNetwork, string>>;

export function isStartingReputationScore(score: unknown): score is number {
  return typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= startingReputationRules.networkCap;
}

export function parseReputation(inputs: ReputationInputs) {
  const scores: ReputationScores = {};
  for (const { id, name } of reputationNetworks) {
    const input = inputs[id]?.trim();
    if (!input) continue;
    const score = Number(input);
    if (!/^\d+$/.test(input) || !isStartingReputationScore(score)) {
      return { issue: { id, message: `${name} must be a whole number from 0 to ${startingReputationRules.networkCap}.` } } as const;
    }
    scores[id] = score;
  }
  return { scores } as const;
}

export function traceReputation(scores: ReputationScores = {}) {
  return reputationNetworks.flatMap(({ id, name }) => {
    const score = scores[id];
    return score === undefined ? [] : [{ id, name, score }];
  });
}

export function evaluateReputation(scores: ReputationScores = {}) {
  const { freePoints, pointsPerCp } = startingReputationRules;
  const total = traceReputation(scores).reduce((sum, { score }) => sum + score, 0);
  const purchased = Math.max(0, total - freePoints);
  const cp = Math.ceil(purchased / pointsPerCp);
  return { total, cp, freeRemaining: Math.max(0, freePoints - total), purchasedRemaining: cp * pointsPerCp - purchased };
}
