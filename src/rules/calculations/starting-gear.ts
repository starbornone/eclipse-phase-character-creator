import { careerGearPacks, findGearCampaign, gearPacksSource } from '../datasets/starting-gear.ts';
import { findSampleMorph } from '../datasets/sample-morphs.ts';
import type { CharacterDraft, MorphDefinition } from '../../types/character.ts';

export function deriveStartingGear(campaignId?: string, careerId?: string, morphCategory?: MorphDefinition['category']) {
  const campaign = findGearCampaign(campaignId);
  const career = careerId === undefined ? undefined : careerGearPacks.get(careerId);
  const packs = [campaign?.pack, career].flatMap((pack) => {
    if (!pack) return [];
    const usesSynthAlternatives = morphCategory === 'Synthmorph' && Boolean(pack.synthAlternatives);
    const items = usesSynthAlternatives
      ? [...pack.items.filter((item) => !item.replacedOnSynth), ...(pack.synthAlternatives ?? [])]
      : pack.items;
    return [{
      name: pack.name,
      source: `${gearPacksSource}#${pack.anchor}`,
      items,
      usesSynthAlternatives,
      gp: items.reduce((sum, { gp }) => sum + gp, 0),
      hasAdditionalGpCosts: items.some(({ additionalGpCost }) => Boolean(additionalGpCost)),
    }];
  });
  return { packs };
}

export function startingGearForDraft(draft: CharacterDraft) {
  const firstMorph = findSampleMorph(draft.sleeves[0]?.morphDefinitionId);
  return deriveStartingGear(draft.ego.startingCampaign, draft.ego.packages?.career?.id, firstMorph?.category);
}
