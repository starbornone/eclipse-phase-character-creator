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
  selection?: 'contact' | 'morph';
};

const checkTrait = (id: string, name: string, aptitude: Aptitude): EgoTrait => ({
  id, name, cpByLevel: [1, 2, 3], effect: `+5 per level to ${aptitude.toUpperCase()} Checks.`,
  checkModifier: { aptitude, perLevel: 5 },
});

export const egoTraits: readonly EgoTrait[] = [
  checkTrait('acumen', 'Acumen', 'cog'),
  { id: 'adaptability', name: 'Adaptability', cpByLevel: [2, 4], effect: '+10 per level on Integration and Resleeving Stress Tests.' },
  { id: 'common-sense', name: 'Common Sense', cpByLevel: [2], effect: 'Ask the GM for advice once per session.' },
  { id: 'contact', name: 'Contact', cpByLevel: [1], selection: 'contact', effect: '+10 on Rep Tests using this contact in the chosen network. Agree the relationship with the GM.' },
  { id: 'direction-sense', name: 'Direction Sense', cpByLevel: [1], effect: 'Know your orientation and gain +10 on navigation tests.' },
  checkTrait('empathy', 'Empathy', 'sav'),
  { id: expertTraining.id, name: 'Expert Training', cpByLevel: [expertTraining.cost], effect: `The chosen skill has a starting cap of ${expertTraining.cap}.` },
  checkTrait('fitness', 'Fitness', 'som'),
  checkTrait('good-instincts', 'Good Instincts', 'int'),
  { id: 'morph-familiarity', name: 'Morph Familiarity', cpByLevel: [1], selection: 'morph', effect: 'Skip Integration Tests when sleeving this morph type.' },
  checkTrait('quickness', 'Quickness', 'ref'),
  checkTrait('resolve', 'Resolve', 'wil'),
  { id: 'bad-luck', name: 'Bad Luck', cpByLevel: [-6], effect: 'You cannot spend pool points to reverse the digits of a roll.' },
  { id: 'enemy', name: 'Enemy', cpByLevel: [-2], effect: 'Work with the GM to define a recurring adversary.' },
  { id: 'identity-crisis', name: 'Identity Crisis', cpByLevel: [-1], effect: 'Unfamiliar morph physiology can impose a −10 penalty.' },
];

export function findEgoTrait(id: string) {
  return egoTraits.find((trait) => trait.id === id);
}
