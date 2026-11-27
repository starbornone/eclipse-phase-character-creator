import type { MorphDefinition } from '../../types/character.ts';
import { aptitudeCheckTraits } from './aptitude-check-traits.ts';
import type { AptitudeCheckModifier } from './aptitude-check-traits.ts';

// Eclipse Phase Second Edition, core Traits, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
const source = 'https://eclipsephase.github.io/en/04/28-traits.html';
type MorphCategory = MorphDefinition['category'];
const physical: readonly MorphCategory[] = ['Biomorph', 'Synthmorph'];
const biomorph: readonly MorphCategory[] = ['Biomorph'];
const synthmorph: readonly MorphCategory[] = ['Synthmorph'];
const infomorph: readonly MorphCategory[] = ['Infomorph'];
const allCategories = [...physical, ...infomorph];
export const exoticMorphology = { id: 'exotic-morphology', integrationPerLevel: -10 } as const;

interface MorphTraitLevel {
  mp: number;
  // Levels without categories can only come with a base profile.
  categories?: readonly MorphCategory[];
  morphIds?: readonly string[];
}

const traitLevel = (mp: number, categories = physical): MorphTraitLevel => ({ mp, categories });

interface MorphTrait {
  id: string;
  name: string;
  levels: readonly MorphTraitLevel[];
  effect: string;
  durabilityPerLevel?: number;
  checkModifier?: AptitudeCheckModifier;
}

export const morphTraits: readonly MorphTrait[] = [
  { id: 'toughness', name: 'Toughness', levels: [traitLevel(2), traitLevel(4)], durabilityPerLevel: 5,
    effect: 'Add 5 Durability per level and recalculate Wound Threshold and Death Rating.' },
  { id: 'striking-looks', name: 'Striking Looks', levels: [traitLevel(1), traitLevel(2, biomorph)],
    effect: 'Apply +10 to Persuade and Provoke Tests when appearance matters. Synthmorphs and uplifts are limited to Level 1.' },
  { id: 'limberness', name: 'Limberness', levels: [traitLevel(1), traitLevel(2)],
    effect: 'Gain +10 per level on tests that rely on flexibility, such as squeezing through a gap.' },
  { id: 'digital-speed', name: 'Digital Speed', levels: [traitLevel(1, infomorph)],
    effect: 'Reduce the time for mesh-based Task Actions by 25%. This stacks with time saved through superior successes.' },
  { id: 'improved-immune-system', name: 'Improved Immune System', levels: [traitLevel(1, biomorph), traitLevel(2, biomorph)],
    effect: 'Add +10 per level to tests to resist chemicals, disease, drugs, and toxins.' },
  { id: 'rapid-healing', name: 'Rapid Healing', levels: [traitLevel(1, biomorph)],
    effect: 'Halve natural healing times. Healing aids keep their usual rates.' },
  { id: 'frailty', name: 'Frailty', levels: [traitLevel(-2), traitLevel(-4)], durabilityPerLevel: -5,
    effect: 'The app applies −5 Durability per level and recalculates Wound Threshold and Death Rating.' },
  { id: 'unattractiveness', name: 'Unattractiveness', levels: [traitLevel(-1, synthmorph), { mp: -2, categories: biomorph, morphIds: ['bouncer'] }],
    effect: 'Apply −10 to Persuade and Provoke Tests when appearance matters. Level 1 is for synthmorphs and uplifts. Level 2 is for humanoid biomorphs.' },
  { id: 'dominant-limb', name: 'Dominant Limb', levels: [traitLevel(-1)],
    effect: 'Choose a dominant limb. Apply −20 to tests made with other limbs.' },
  { id: 'hypersensitivity', name: 'Hypersensitivity', levels: [traitLevel(-3, biomorph)],
    effect: 'The sleeve can use its built-in implants only.' },
  { id: 'inherent-flaws', name: 'Inherent Flaws', levels: [traitLevel(-2, synthmorph)],
    effect: 'A critical failure carries a 10% chance of also taking a wound. Synthmorphs only.' },
  { id: exoticMorphology.id, name: 'Exotic Morphology', levels: [{ mp: -2 }, { mp: -4 }, { mp: -6 }],
    effect: 'Take −10 per level on Integration Tests with this sleeve. Uplift and infolife egos ignore the penalty in their original morph.' },
  { id: 'planned-obsolescence', name: 'Planned Obsolescence', levels: [traitLevel(-1)],
    effect: 'Without monthly Moderate maintenance, lose one pool point of the GM’s choice. At zero pools, take a wound each missed month.' },
  { id: 'proprietary-tech', name: 'Proprietary Tech', levels: [traitLevel(-2, synthmorph)],
    effect: 'Fixer swarms are ineffective on this sleeve. Apply −20 to Hardware: Robotics Tests on it.' },
  { id: 'zero-g-nausea', name: 'Zero-G Nausea', levels: [traitLevel(-2, biomorph)],
    effect: 'Apply −10 in microgravity. Failing the initial Somatics Check for acclimation or excessive movement incapacitates you for one hour.' },
  ...Object.values(aptitudeCheckTraits).map(({ costByLevel, ...trait }) => ({
    ...trait, levels: costByLevel.map((mp) => traitLevel(mp, allCategories)),
  })),
];

export const morphTraitSource = (id: string) => `${source}#${id}`;

export const morphHealthRules = {
  woundDivisor: 5,
  deathMultiplier: { Biomorph: 1.5, Synthmorph: 2, Infomorph: 2 },
} as const;
