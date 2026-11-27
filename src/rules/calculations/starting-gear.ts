import { careerGearPacks, findGearCampaign, gearCampaigns, gearPacksSource } from '../datasets/starting-gear.ts';
import type { GearPack } from '../datasets/starting-gear.ts';
import { findSampleMorph } from '../datasets/sample-morphs.ts';
import type { CharacterDraft, MorphDefinition, StartingGearSwap } from '../../types/character.ts';

const availablePacks = [...new Set(gearCampaigns.map(({ pack }) => pack)), ...careerGearPacks.values()];

function gearPackContents(pack: GearPack, morphCategory?: MorphDefinition['category']) {
  const usesSynthAlternatives = morphCategory === 'Synthmorph' && Boolean(pack.synthAlternatives);
  const items = usesSynthAlternatives
    ? [...pack.items.filter((item) => !item.replacedOnSynth), ...(pack.synthAlternatives ?? [])]
    : pack.items;
  return { items, usesSynthAlternatives, source: `${gearPacksSource}#${pack.anchor}` };
}

export function startingGearReplacements(morphCategory?: MorphDefinition['category']) {
  const entries = availablePacks.flatMap((pack) => {
    const { items, source } = gearPackContents(pack, morphCategory);
    return items.filter(({ additionalGpCost }) => !additionalGpCost).map((item) => ({ ...item, source }));
  });
  const seen = new Set<string>();
  return entries.filter(({ name, gp }) => {
    const key = `${gp}:${name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((first, second) => first.name.localeCompare(second.name));
}

export function deriveStartingGear(
  campaignId?: string,
  careerId?: string,
  morphCategory?: MorphDefinition['category'],
  swaps: readonly StartingGearSwap[] = [],
) {
  const campaign = findGearCampaign(campaignId);
  const career = careerId === undefined ? undefined : careerGearPacks.get(careerId);
  const replacements = swaps.length ? startingGearReplacements(morphCategory) : [];
  const appliedSwaps: StartingGearSwap[] = [];
  const packs = [campaign?.pack, career].flatMap((pack) => {
    if (!pack) return [];
    const base = gearPackContents(pack, morphCategory);
    const items = base.items.map((original) => {
      const swap = original.additionalGpCost ? undefined : swaps.find(({ packId, item }) => (
        packId === pack.anchor && item === original.name
      ));
      const replacement = swap && replacements.find(({ name, gp }) => (
        name === swap.replacement && name !== original.name && gp === original.gp
      ));
      if (swap && replacement) appliedSwaps.push(swap);
      return { ...(replacement ?? original), originalName: original.name, replacementSource: replacement?.source };
    });
    return [{
      id: pack.anchor,
      name: pack.name,
      source: base.source,
      items,
      usesSynthAlternatives: base.usesSynthAlternatives,
      gp: items.reduce((sum, { gp }) => sum + gp, 0),
      hasAdditionalGpCosts: items.some(({ additionalGpCost }) => Boolean(additionalGpCost)),
    }];
  });
  return { packs, appliedSwaps };
}

export function startingGearForDraft(draft: CharacterDraft) {
  const firstMorph = findSampleMorph(draft.sleeves[0]?.morphDefinitionId);
  return deriveStartingGear(draft.ego.startingCampaign, draft.ego.packages?.career?.id, firstMorph?.category, draft.ego.startingGearSwaps);
}
