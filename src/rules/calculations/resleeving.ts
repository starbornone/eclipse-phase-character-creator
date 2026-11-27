import type { Ego, MorphDefinition } from '../../types/character.ts';
import { exoticMorphology } from '../datasets/morph-traits.ts';
import { traceAptitudeChecks } from './draft.ts';
import { normalizeTraitDetail, traceEgoTraits } from './ego-traits.ts';
import { deriveMorphProfile, traceIncludedMorphTraits } from './morph-traits.ts';

type Check = ReturnType<typeof traceAptitudeChecks>[number];

function addModifiers(check: Check, extra: Check['modifiers']): Check {
  const adjustment = extra.reduce((sum, { points }) => sum + points, 0);
  return {
    ...check,
    modifiers: [...check.modifiers, ...extra],
    modifier: check.modifier + adjustment,
    target: check.target === undefined ? undefined : check.target + adjustment,
  };
}

export function traceResleevingTests(ego: Pick<Ego, 'aptitudes' | 'traits'>, morph: MorphDefinition, waiveExoticMorphology = false) {
  const checks = traceAptitudeChecks(ego.aptitudes, ego.traits, deriveMorphProfile(morph));
  const somatics = checks.find(({ id }) => id === 'som')!;
  const willpower = checks.find(({ id }) => id === 'wil')!;
  const traits = traceEgoTraits(ego.traits);
  const resleevingModifiers = traits.flatMap(({ name, level, resleevingModifier }) => resleevingModifier === undefined
    ? [] : [{ source: name, level, points: resleevingModifier * level }]);
  const morphName = normalizeTraitDetail(morph.name).toLowerCase();
  const familiar = traits.some(({ id, detail }) => (
    id === 'morph-familiarity' && normalizeTraitDetail(detail ?? '').toLowerCase() === morphName
  ));
  const exotic = traceIncludedMorphTraits(morph).find(({ id }) => id === exoticMorphology.id);
  const exoticModifiers = !waiveExoticMorphology && exotic?.level !== undefined
    ? [{ source: exotic.name, level: exotic.level, points: exoticMorphology.integrationPerLevel * exotic.level }] : [];
  return {
    integration: familiar ? undefined : addModifiers(somatics, [...resleevingModifiers, ...exoticModifiers]),
    stress: addModifiers(willpower, resleevingModifiers),
    familiar,
    hasExoticMorphology: Boolean(exotic),
    hasIdentityCrisis: traits.some(({ id }) => id === 'identity-crisis'),
  };
}
