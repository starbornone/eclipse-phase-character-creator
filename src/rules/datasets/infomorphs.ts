import type { MorphDefinition, MorphTraitChoice } from '../../types/character.ts';

// Eclipse Phase Second Edition, Infomorphs, p. 67, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
const sourceUrl = 'https://eclipsephase.github.io/en/04/26-infomorphs.html';
const source = (id: string) => ({ label: 'Core rules, p. 67', url: `${sourceUrl}#${id}` });
const includedTraits: readonly MorphTraitChoice[] = [
  { id: 'digital-speed', level: 1 }, { id: 'exotic-morphology', level: 3 },
];

export const coreInfomorphs: readonly MorphDefinition[] = [
  {
    id: 'digimorph', name: 'Digimorph', category: 'Infomorph',
    description: 'A basic digital sleeve for running an ego without a physical body.',
    durability: 25, woundThreshold: 5, deathRating: 50, morphPoints: 0, availability: 100, movement: [],
    pools: { insight: 0, moxie: 0, vigor: 0, flex: 0 },
    includedWare: ['Mnemonics'],
    includedTraits,
    source: source('digimorph'),
  },
  {
    id: 'ikon', name: 'Ikon', category: 'Infomorph',
    description: 'A digital sleeve for performers and social work on the mesh.',
    durability: 30, woundThreshold: 6, deathRating: 60, morphPoints: 1, availability: 100, movement: [],
    pools: { insight: 1, moxie: 3, vigor: 0, flex: 0 },
    includedWare: ['Copylock', 'Memory Lock', 'Mnemonics'],
    includedTraits,
    source: source('ikon'),
  },
  {
    id: 'agent', name: 'Agent', category: 'Infomorph',
    description: 'A digital sleeve specialized for information security.',
    durability: 40, woundThreshold: 8, deathRating: 80, morphPoints: 2, availability: 100, movement: [],
    pools: { insight: 4, moxie: 0, vigor: 0, flex: 0 },
    includedWare: ['Enhanced Security', 'E-Veil', 'Mnemonics'],
    includedTraits,
    source: source('agent'),
  },
  {
    id: 'operator', name: 'Operator', category: 'Infomorph',
    description: 'A digital sleeve for remotely operating drones and other machines.',
    durability: 35, woundThreshold: 7, deathRating: 70, morphPoints: 2, availability: 100, movement: [],
    pools: { insight: 3, moxie: 0, vigor: 0, flex: 1 },
    includedWare: ['Drone Rig', 'Mnemonics', 'Oracles'],
    includedTraits,
    source: source('operator'),
  },
];
