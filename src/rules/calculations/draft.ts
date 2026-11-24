import { aptitudes } from '../../types/character.ts';
import type { AptitudeInputs, AptitudeScores, MorphDefinition } from '../../types/character.ts';

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

export function traceAptitudes(scores: AptitudeScores, morph?: MorphDefinition) {
  return aptitudes.map(({ id, label }) => {
    const base = scores[id];
    const adjustment = morph?.aptitudeModifiers[id] ?? 0;
    return {
      id,
      label,
      base,
      adjustment,
      total: base === undefined ? undefined : base + adjustment,
    };
  });
}
