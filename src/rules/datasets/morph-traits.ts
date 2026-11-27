import type { MorphDefinition } from '../../types/character.ts';

// Eclipse Phase Second Edition, core Traits, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
const source = 'https://eclipsephase.github.io/en/04/28-traits.html';
type MorphCategory = MorphDefinition['category'];
const physical: readonly MorphCategory[] = ['Biomorph', 'Synthmorph'];

interface MorphTrait {
  id: string;
  name: string;
  mpByLevel: readonly number[];
  categories: readonly MorphCategory[];
  effect: string;
  durabilityPerLevel?: number;
}

export const morphTraits: readonly MorphTrait[] = [
  { id: 'toughness', name: 'Toughness', mpByLevel: [2, 4], categories: physical, durabilityPerLevel: 5,
    effect: 'Add 5 Durability per level and recalculate Wound Threshold and Death Rating.' },
  { id: 'dominant-limb', name: 'Dominant Limb', mpByLevel: [-1], categories: physical,
    effect: 'Choose a dominant limb. Apply −20 to tests made with other limbs.' },
  { id: 'hypersensitivity', name: 'Hypersensitivity', mpByLevel: [-3], categories: ['Biomorph'],
    effect: 'The sleeve can use its built-in implants only.' },
  { id: 'planned-obsolescence', name: 'Planned Obsolescence', mpByLevel: [-1], categories: physical,
    effect: 'Without monthly Moderate maintenance, lose one pool point of the GM’s choice. At zero pools, take a wound each missed month.' },
  { id: 'proprietary-tech', name: 'Proprietary Tech', mpByLevel: [-2], categories: ['Synthmorph'],
    effect: 'Fixer swarms are ineffective on this sleeve. Apply −20 to Hardware: Robotics Tests on it.' },
  { id: 'zero-g-nausea', name: 'Zero-G Nausea', mpByLevel: [-2], categories: ['Biomorph'],
    effect: 'Apply −10 in microgravity. Failing the initial Somatics Check for acclimation or excessive movement incapacitates you for one hour.' },
];

export const morphTraitSource = (id: string) => `${source}#${id}`;

export const morphHealthRules = {
  woundDivisor: 5,
  deathMultiplier: { Biomorph: 1.5, Synthmorph: 2, Infomorph: 2 },
} as const;
