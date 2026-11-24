import type { MorphDefinition } from '../../types/character.ts';

// Original fixtures for the prototype. Names and values are illustrative.
export const sampleMorphs: readonly MorphDefinition[] = [
  {
    id: 'survey-sleeve',
    name: 'Survey Sleeve',
    category: 'Biomorph',
    description: 'A biological field sleeve for surveying habitats and unfamiliar terrain.',
    durability: 30,
    aptitudeModifiers: { int: 5 },
  },
  {
    id: 'vector-frame',
    name: 'Vector Frame',
    category: 'Synthmorph',
    description: 'A lightweight synthetic frame built for precise movement in microgravity.',
    durability: 35,
    aptitudeModifiers: { ref: 5 },
  },
  {
    id: 'industrial-frame',
    name: 'Industrial Frame',
    category: 'Synthmorph',
    description: 'A reinforced synthetic body designed for heavy exterior maintenance.',
    durability: 45,
    aptitudeModifiers: { som: 5 },
  },
];

export function findSampleMorph(id: string | undefined) {
  return sampleMorphs.find((morph) => morph.id === id);
}
