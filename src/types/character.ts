export const aptitudes = [
  { id: 'cog', label: 'Cognition' },
  { id: 'int', label: 'Intuition' },
  { id: 'ref', label: 'Reflexes' },
  { id: 'sav', label: 'Savvy' },
  { id: 'som', label: 'Somatics' },
  { id: 'wil', label: 'Willpower' },
] as const;

export type Aptitude = (typeof aptitudes)[number]['id'];
export type AptitudeScores = Partial<Record<Aptitude, number>>;
export type AptitudeInputs = Record<Aptitude, string>;

export interface Ego {
  id: string;
  name: string;
  pronouns: string;
  concept: string;
  aptitudes: AptitudeScores;
}

export interface MorphDefinition {
  id: string;
  name: string;
  category: 'Biomorph' | 'Synthmorph';
  description: string;
  durability: number;
  aptitudeModifiers: AptitudeScores;
}

export interface Sleeve {
  id: string;
  egoId: string;
  morphDefinitionId: string;
  assignedAt: string;
}

export interface CharacterDraft {
  schemaVersion: 1;
  rulesVersion: 'prototype-1';
  revision: number;
  updatedAt: string;
  ego: Ego;
  sleeve?: Sleeve;
}
