import { aptitudes } from '../../types/character.ts';
import type { AptitudeInputs, AptitudeScores, EgoTraitChoice } from '../../types/character.ts';
import { traceEgoTraits } from './ego-traits.ts';
import { traceIncludedMorphTraits, type deriveMorphProfile } from './morph-traits.ts';

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

export function traceAptitudeChecks(
  scores: AptitudeScores,
  choices?: readonly EgoTraitChoice[],
  profile?: ReturnType<typeof deriveMorphProfile>,
) {
  const morphTraits = [...traceIncludedMorphTraits(profile?.morph), ...(profile?.entries ?? [])];
  const traits = [
    ...traceEgoTraits(choices).map(({ name, detail, level, checkModifier }) => ({
      source: detail ? `${name} (${detail})` : name, level, checkModifier,
    })),
    ...morphTraits.flatMap(({ name, level, checkModifier }) => level !== undefined && checkModifier
      ? [{ source: `${name} (morph)`, level, checkModifier }] : []),
  ];
  return aptitudes.map(({ id, label }) => {
    const base = scores[id];
    const modifiers = traits.flatMap(({ source, level, checkModifier }) => checkModifier?.aptitude === id
      ? [{ source, level, points: checkModifier.perLevel * level }] : []);
    const modifier = modifiers.reduce((sum, { points }) => sum + points, 0);
    return {
      id,
      label,
      base,
      multiplier: aptitudeCheckMultiplier,
      modifiers,
      modifier,
      target: base === undefined ? undefined : base * aptitudeCheckMultiplier + modifier,
    };
  });
}
