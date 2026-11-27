import type { MorphDefinition } from '../../types/character.ts';
import { synthEnvironmentCapabilities } from '../datasets/core-physical-morphs.ts';

export const digitalMovement = 'No physical movement';

export function describeMovement(morph?: MorphDefinition) {
  const movement = morph?.movement;
  if (!movement) return undefined;
  if (!movement.length) return digitalMovement;
  return movement.map(({ mode, variant, base, full }) => (
    `${mode}${variant ? ` (${variant})` : ''} ${base}/${full}`
  )).join(', ');
}

export function morphCapabilities(morph?: MorphDefinition) {
  if (!morph?.includedWare) return [];
  const inherited = morph.category === 'Synthmorph' ? synthEnvironmentCapabilities : [];
  return [...new Set([...morph.includedWare, ...inherited])].sort();
}

function movementModes(morph: MorphDefinition) {
  const movement = morph.movement;
  if (!movement) return [];
  return movement.length ? movement.map(({ mode }) => mode) : [digitalMovement];
}

const uniqueSorted = (values: string[]) => [...new Set(values)].sort();
const numericOptions = (values: (number | undefined)[]) => (
  [...new Set(values.filter((value) => value !== undefined))].sort((a, b) => a - b)
);

export function morphFilterOptions(morphs: readonly MorphDefinition[]) {
  return {
    categories: uniqueSorted(morphs.map(({ category }) => category)),
    costs: numericOptions(morphs.map(({ morphPoints }) => morphPoints)),
    durability: numericOptions(morphs.map(({ durability }) => durability)),
    movement: uniqueSorted(morphs.flatMap(movementModes)),
    capabilities: uniqueSorted(morphs.flatMap((morph) => morphCapabilities(morph))),
  };
}

export interface MorphFilters {
  query?: string;
  category?: string;
  maximumMp?: number;
  minimumDurability?: number;
  movement?: string;
  capability?: string;
  sort?: string;
}

export function filterMorphs(morphs: readonly MorphDefinition[], filters: MorphFilters) {
  const query = filters.query?.trim().toLowerCase() ?? '';
  const terms = query ? query.split(/\s+/) : [];
  const matches = morphs.filter((morph) => {
    if (filters.category && filters.category !== morph.category) return false;
    if (filters.maximumMp !== undefined && (morph.morphPoints === undefined || morph.morphPoints > filters.maximumMp)) return false;
    if (filters.minimumDurability !== undefined && morph.durability < filters.minimumDurability) return false;
    if (filters.movement && !movementModes(morph).includes(filters.movement)) return false;
    const capabilities = morphCapabilities(morph);
    if (filters.capability && !capabilities.includes(filters.capability)) return false;
    const searchText = [morph.name, morph.category, morph.description, describeMovement(morph), ...capabilities].join(' ').toLowerCase();
    return terms.every((term) => searchText.includes(term));
  });
  return matches.sort((first, second) => {
    if (filters.sort === 'cost') {
      const firstCost = first.morphPoints ?? Number.MAX_SAFE_INTEGER;
      const secondCost = second.morphPoints ?? Number.MAX_SAFE_INTEGER;
      if (firstCost !== secondCost) return firstCost - secondCost;
    }
    if (filters.sort === 'durability' && first.durability !== second.durability) return second.durability - first.durability;
    return first.name.localeCompare(second.name);
  });
}
