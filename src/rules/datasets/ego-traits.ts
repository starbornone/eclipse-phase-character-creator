// Eclipse Phase Second Edition, Traits, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
export const egoTraitsSource = 'https://eclipsephase.github.io/en/04/28-traits.html';

type EgoTrait = {
  id: string;
  name: string;
  cpByLevel: readonly number[];
  effect: string;
};

export const egoTraits: readonly EgoTrait[] = [
  { id: 'adaptability', name: 'Adaptability', cpByLevel: [2, 4], effect: '+10 per level on Integration and Resleeving Stress Tests.' },
  { id: 'common-sense', name: 'Common Sense', cpByLevel: [2], effect: 'Ask the GM for advice once per session.' },
  { id: 'direction-sense', name: 'Direction Sense', cpByLevel: [1], effect: 'Know your orientation and gain +10 on navigation tests.' },
  { id: 'bad-luck', name: 'Bad Luck', cpByLevel: [-6], effect: 'You cannot spend pool points to reverse the digits of a roll.' },
  { id: 'enemy', name: 'Enemy', cpByLevel: [-2], effect: 'Work with the GM to define a recurring adversary.' },
  { id: 'identity-crisis', name: 'Identity Crisis', cpByLevel: [-1], effect: 'Unfamiliar morph physiology can impose a −10 penalty.' },
];

export function findEgoTrait(id: string) {
  return egoTraits.find((trait) => trait.id === id);
}
