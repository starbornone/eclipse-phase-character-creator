import type { Aptitude } from '../../types/character.ts';

// Eclipse Phase Second Edition, Traits, pp. 72–75, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
export const egoTraitsSource = 'https://eclipsephase.github.io/en/04/28-traits.html';
export const expertTraining = { id: 'expert-training', cap: 90, cost: 2 } as const;

type EgoTrait = {
  id: string;
  name: string;
  cpByLevel: readonly number[];
  effect: string;
  checkModifier?: { aptitude: Aptitude; perLevel: number };
  selection?: 'contact' | 'morph' | 'stress';
  skillTestModifier?: { skill: string; perLevel: number };
  lucidityModifier?: number;
};

// Hardening's Unknown option requires Psi (errata 1.4); defer it with Psi support.
export const supportedHardeningStressTypes = ['Alienation', 'Helplessness', 'Violence'] as const;

const checkTrait = (id: string, name: string, aptitude: Aptitude): EgoTrait => ({
  id, name, cpByLevel: [1, 2, 3], effect: `+5 per level to ${aptitude.toUpperCase()} Checks.`,
  checkModifier: { aptitude, perLevel: 5 },
});

export const egoTraits: readonly EgoTrait[] = [
  checkTrait('acumen', 'Acumen', 'cog'),
  { id: 'adaptability', name: 'Adaptability', cpByLevel: [2, 4], effect: '+10 per level on Integration and Resleeving Stress Tests.' },
  { id: 'common-sense', name: 'Common Sense', cpByLevel: [2], effect: 'Ask the GM for advice once per session.' },
  { id: 'composure', name: 'Composure', cpByLevel: [2], lucidityModifier: 5, effect: '+5 Lucidity, +1 Trauma Threshold, and +10 Insanity Rating.' },
  { id: 'contact', name: 'Contact', cpByLevel: [1], selection: 'contact', effect: '+10 on Rep Tests using this contact in the chosen network. Agree the relationship with the GM.' },
  { id: 'direction-sense', name: 'Direction Sense', cpByLevel: [1], effect: 'Know your orientation and gain +10 on navigation tests.' },
  checkTrait('empathy', 'Empathy', 'sav'),
  { id: expertTraining.id, name: 'Expert Training', cpByLevel: [expertTraining.cost], effect: `The chosen skill has a starting cap of ${expertTraining.cap}.` },
  checkTrait('fitness', 'Fitness', 'som'),
  checkTrait('good-instincts', 'Good Instincts', 'int'),
  { id: 'hardening', name: 'Hardening', cpByLevel: [1], selection: 'stress',
    effect: 'Immune to stress from the chosen type. Each purchase applies −10 to WIL Checks and Persuade Tests; penalties accumulate.',
    checkModifier: { aptitude: 'wil', perLevel: -10 }, skillTestModifier: { skill: 'Persuade', perLevel: -10 } },
  { id: 'morph-familiarity', name: 'Morph Familiarity', cpByLevel: [1], selection: 'morph', effect: 'Skip Integration Tests when sleeving this morph type.' },
  checkTrait('quickness', 'Quickness', 'ref'),
  checkTrait('resolve', 'Resolve', 'wil'),
  { id: 'bad-luck', name: 'Bad Luck', cpByLevel: [-6], effect: 'You cannot spend pool points to reverse the digits of a roll.' },
  { id: 'enemy', name: 'Enemy', cpByLevel: [-2], effect: 'Work with the GM to define a recurring adversary.' },
  { id: 'identity-crisis', name: 'Identity Crisis', cpByLevel: [-1], effect: 'Unfamiliar morph physiology can impose a −10 penalty.' },
  { id: 'instability', name: 'Instability', cpByLevel: [-2, -4], lucidityModifier: -5, effect: 'Per level, lose 5 Lucidity, 1 Trauma Threshold, and 10 Insanity Rating.' },
];

export function findEgoTrait(id: string) {
  return egoTraits.find((trait) => trait.id === id);
}
