import { aptitudes } from '../../types/character.ts';
import type { AptitudeInputs, AptitudeScores } from '../../types/character.ts';

const aptitudeCheckMultiplier = 3;

export function parseAptitudes(inputs: AptitudeInputs) {
  const scores: AptitudeScores = {};

  for (const { id, label } of aptitudes) {
    const input = inputs[id].trim();
    if (!input) continue;

    const score = Number(input);
    if (!/^\d+$/.test(input) || !Number.isSafeInteger(score) || score > 99) {
      return { issue: { id, message: `${label} must be a whole number from 0 to 99.` } } as const;
    }
    scores[id] = score;
  }

  return { scores } as const;
}

export function traceAptitudeChecks(scores: AptitudeScores) {
  return aptitudes.map(({ id, label }) => {
    const base = scores[id];
    return {
      id,
      label,
      base,
      multiplier: aptitudeCheckMultiplier,
      target: base === undefined ? undefined : base * aptitudeCheckMultiplier,
    };
  });
}
