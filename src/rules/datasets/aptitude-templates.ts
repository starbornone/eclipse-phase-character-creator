import type { Aptitude } from '../../types/character.ts';

// Adapted from Eclipse Phase Second Edition, pp. 44 and 46, Posthuman Studios, LLC.
// CC BY-NC-SA 4.0. Cross-checked against the April 2025 errata.
export const coreAptitudeRules = {
  basePoints: 90,
  minimum: 5,
  maximum: 30,
  startingCp: 20,
  maximumTraitBonus: 6,
  coreBookUrl: 'https://posthuman.shop/products/eclipse-phase-second-edition-pdf',
} as const;

type Template = { name: string; scores: Record<Aptitude, number> };

export const aptitudeTemplates: readonly Template[] = [
  { name: 'Actioneer', scores: { cog: 10, int: 15, ref: 20, sav: 10, som: 20, wil: 15 } },
  { name: 'Extrovert', scores: { cog: 10, int: 20, ref: 15, sav: 20, som: 15, wil: 10 } },
  { name: 'Facilitator', scores: { cog: 15, int: 15, ref: 10, sav: 20, som: 10, wil: 20 } },
  { name: 'Factotum', scores: { cog: 15, int: 15, ref: 15, sav: 15, som: 15, wil: 15 } },
  { name: 'Inquirer', scores: { cog: 20, int: 20, ref: 10, sav: 15, som: 10, wil: 15 } },
  { name: 'Survivor', scores: { cog: 15, int: 10, ref: 15, sav: 10, som: 20, wil: 20 } },
  { name: 'Thrill Seeker', scores: { cog: 20, int: 10, ref: 20, sav: 15, som: 15, wil: 10 } },
];
