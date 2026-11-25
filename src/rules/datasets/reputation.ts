// Eclipse Phase Second Edition, Character Stats and Step 9, Posthuman Studios, LLC. CC BY-NC-SA 4.0.
export const reputationNetworks = [
  { id: '@-rep', name: 'The Circle-A List' },
  { id: 'c-rep', name: 'CivicNet' },
  { id: 'f-rep', name: 'Fame' },
  { id: 'g-rep', name: 'Guanxi' },
  { id: 'i-rep', name: 'The Eye' },
  { id: 'r-rep', name: 'Research Network Affiliates' },
  { id: 'x-rep', name: 'ExploreNet' },
] as const;

export type ReputationNetwork = (typeof reputationNetworks)[number]['id'];

export const startingReputationRules = {
  freePoints: 100,
  networkCap: 80,
  pointsPerCp: 5,
  sourceUrl: 'https://eclipsephase.github.io/en/04/12-step-9-reputation.html',
} as const;
