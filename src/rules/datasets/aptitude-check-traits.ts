import type { Aptitude } from '../../types/character.ts';

// Eclipse Phase Second Edition, core Traits, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
export interface AptitudeCheckModifier {
  aptitude: Aptitude;
  perLevel: number;
}

const checkTrait = (id: string, name: string, aptitude: Aptitude, perLevel: 5 | -5 = 5) => ({
  id,
  name,
  costByLevel: perLevel > 0 ? [1, 2, 3] : [-1, -2, -3],
  effect: `${perLevel > 0 ? '+5' : '−5'} per level to ${aptitude.toUpperCase()} Checks.`,
  checkModifier: { aptitude, perLevel },
});

export type AptitudeCheckTrait = ReturnType<typeof checkTrait>;

export const aptitudeCheckTraits = {
  acumen: checkTrait('acumen', 'Acumen', 'cog'),
  empathy: checkTrait('empathy', 'Empathy', 'sav'),
  fitness: checkTrait('fitness', 'Fitness', 'som'),
  goodInstincts: checkTrait('good-instincts', 'Good Instincts', 'int'),
  quickness: checkTrait('quickness', 'Quickness', 'ref'),
  resolve: checkTrait('resolve', 'Resolve', 'wil'),
  feebleness: checkTrait('feebleness', 'Feebleness', 'som', -5),
  indifference: checkTrait('indifference', 'Indifference', 'sav', -5),
  obtuseness: checkTrait('obtuseness', 'Obtuseness', 'cog', -5),
  poorCoordination: checkTrait('poor-coordination', 'Poor Coordination', 'ref', -5),
  poorInstincts: checkTrait('poor-instincts', 'Poor Instincts', 'int', -5),
  // Errata 1.4 confirms the 1/2/3 CP bonus for ego Timidity.
  timidity: checkTrait('timidity', 'Timidity', 'wil', -5),
};
