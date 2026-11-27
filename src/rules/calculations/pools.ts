import type { Ego, MorphDefinition } from '../../types/character.ts';
import { coreCustomizationRules } from '../datasets/customization.ts';

export function tracePools(morph: MorphDefinition | undefined, ego: Pick<Ego, 'egoFlex'>, temporaryFlex: number | undefined) {
  if (!morph?.pools) return undefined;
  const { flex: morphFlex, insight, moxie, vigor } = morph.pools;
  const egoFlex = ego.egoFlex ?? coreCustomizationRules.startingEgoFlex;
  return {
    insight, moxie, vigor, morphFlex, egoFlex, temporaryFlex,
    flex: temporaryFlex === undefined ? undefined : morphFlex + egoFlex + temporaryFlex,
  };
}
