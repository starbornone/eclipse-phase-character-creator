import type { MorphDefinition, MorphTraitChoice, Sleeve } from '../../types/character.ts';
import { morphHealthRules, morphTraits } from '../datasets/morph-traits.ts';
import { findSampleMorph } from '../datasets/sample-morphs.ts';

export function availableMorphTraits(morph?: MorphDefinition) {
  if (!morph || morph.morphPoints === undefined) return [];
  return morphTraits.flatMap((trait) => {
    const eligibleLevels = trait.levels.flatMap(({ mp, categories, morphIds }, index) => (
      categories.includes(morph.category) && (!morphIds || morphIds.includes(morph.id)) ? [{ level: index + 1, mp }] : []
    ));
    return eligibleLevels.length ? [{ ...trait, eligibleLevels }] : [];
  });
}

export function evaluateMorphTraits(morph?: MorphDefinition, choices: readonly MorphTraitChoice[] = []) {
  const entries = availableMorphTraits(morph).flatMap(({ eligibleLevels, durabilityPerLevel, ...trait }) => {
    const choice = choices.find(({ id }) => id === trait.id);
    const applied = eligibleLevels.find(({ level }) => level === choice?.level);
    return applied ? [{ ...trait, ...applied, durabilityChange: applied.level * (durabilityPerLevel ?? 0) }] : [];
  });
  const bonus = entries.reduce((sum, { mp }) => sum + Math.max(0, -mp), 0);
  const cost = entries.reduce((sum, { mp }) => sum + Math.max(0, mp), 0);
  const durabilityChange = entries.reduce((sum, entry) => sum + entry.durabilityChange, 0);
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
