import type { MorphDefinition, MorphTraitChoice, Sleeve } from '../../types/character.ts';
import { morphHealthRules, morphTraits } from '../datasets/morph-traits.ts';
import { findSampleMorph } from '../datasets/sample-morphs.ts';

export function availableMorphTraits(morph?: MorphDefinition) {
  if (!morph || morph.morphPoints === undefined) return [];
  return morphTraits.filter(({ categories }) => categories.includes(morph.category));
}

export function evaluateMorphTraits(morph?: MorphDefinition, choices: readonly MorphTraitChoice[] = []) {
  const entries = availableMorphTraits(morph).flatMap((trait) => {
    const choice = choices.find(({ id }) => id === trait.id);
    const level = choice?.level;
    const mp = level !== undefined && Number.isInteger(level) ? trait.mpByLevel[level - 1] : undefined;
    return level === undefined || mp === undefined ? [] : [{ ...trait, level, mp }];
  });
  const bonus = entries.reduce((sum, { mp }) => sum + Math.max(0, -mp), 0);
  const cost = entries.reduce((sum, { mp }) => sum + Math.max(0, mp), 0);
  const durabilityChange = entries.reduce((sum, { level, durabilityPerLevel }) => sum + level * (durabilityPerLevel ?? 0), 0);
  return { entries, bonus, cost, durabilityChange };
}

export function deriveMorphProfile(morph?: MorphDefinition, choices?: readonly MorphTraitChoice[]) {
  const { entries, durabilityChange } = evaluateMorphTraits(morph, choices);
  if (!morph || !durabilityChange) return { morph, entries };

  const durability = morph.durability + durabilityChange;
  return {
    entries,
    morph: {
      ...morph,
      durability,
      woundThreshold: Math.round(durability / morphHealthRules.woundDivisor),
      deathRating: Math.round(durability * morphHealthRules.deathMultiplier[morph.category]),
    },
  };
}

export function morphProfileForSleeve(sleeve?: Sleeve) {
  return deriveMorphProfile(findSampleMorph(sleeve?.morphDefinitionId), sleeve?.morphTraits);
}
