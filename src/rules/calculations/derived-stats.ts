import type { Ego } from '../../types/character.ts';
import { coreDerivedStatRules } from '../datasets/derived-stats.ts';
import { traceEgoTraits } from './ego-traits.ts';

export function traceDerivedEgoStats({ aptitudes, traits }: Pick<Ego, 'aptitudes' | 'traits'>) {
  const { ref, int, wil } = aptitudes;
  const { initiativeDivisor, lucidityMultiplier, traumaDivisor, insanityMultiplier } = coreDerivedStatRules;
  const modifiers = traceEgoTraits(traits).flatMap(({ name, level, lucidityModifier }) => lucidityModifier === undefined
    ? [] : [{ source: name, points: lucidityModifier * level }]);
  const bonus = modifiers.reduce((sum, { points }) => sum + points, 0);
  const initiative = ref === undefined || int === undefined ? undefined : (ref + int) / initiativeDivisor;
  const lucidity = wil === undefined ? undefined : wil * lucidityMultiplier + bonus;
  const trauma = lucidity === undefined ? undefined : lucidity / traumaDivisor;
  const insanity = lucidity === undefined ? undefined : lucidity * insanityMultiplier;
  const roundTrace = (value: number) => `${value} → ${Math.round(value)}`;
  const noModifiers: typeof modifiers = [];
  return [
    { id: 'initiative', label: 'Initiative', formula: '(REF + INT) ÷ 5', total: initiative === undefined ? undefined : Math.round(initiative),
      inputs: [{ source: 'Reflexes', value: ref }, { source: 'Intuition', value: int }], modifiers: noModifiers,
      calculation: initiative === undefined ? undefined : `(${ref} + ${int}) ÷ ${initiativeDivisor} = ${roundTrace(initiative)}` },
    { id: 'lucidity', label: 'Lucidity', formula: 'WIL × 2', total: lucidity,
      inputs: [{ source: 'Willpower', value: wil }], modifiers,
      calculation: lucidity === undefined ? undefined : `${wil} × ${lucidityMultiplier}${bonus ? ` + ${bonus}` : ''} = ${lucidity}` },
    { id: 'trauma-threshold', label: 'Trauma Threshold', formula: 'LUC ÷ 5', total: trauma === undefined ? undefined : Math.round(trauma),
      inputs: [{ source: 'Lucidity', value: lucidity }], modifiers: noModifiers,
      calculation: trauma === undefined ? undefined : `${lucidity} ÷ ${traumaDivisor} = ${roundTrace(trauma)}` },
    { id: 'insanity-rating', label: 'Insanity Rating', formula: 'LUC × 2', total: insanity,
      inputs: [{ source: 'Lucidity', value: lucidity }], modifiers: noModifiers,
      calculation: insanity === undefined ? undefined : `${lucidity} × ${insanityMultiplier} = ${insanity}` },
  ];
}
