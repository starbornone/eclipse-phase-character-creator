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

export const creationPackageKinds = ['background', 'career', 'interest', 'faction'] as const;
export type CreationPackageKind = (typeof creationPackageKinds)[number];

export interface CreationPackageSelection {
  id: string;
  fields?: Record<string, string>;
  motivation?: string;
}

export type CreationPackages = Partial<Record<CreationPackageKind, CreationPackageSelection>>;

interface SkillPointAllocation {
  to: string;
  points: number;
  newKnowField?: string;
}

export type SkillPointPurchase = SkillPointAllocation;

export interface SkillPointTransfer extends SkillPointAllocation {
  from: string;
}

export interface Ego {
  id: string;
  name: string;
  pronouns: string;
  concept: string;
  aptitudes: AptitudeScores;
  packages?: CreationPackages;
  artisticKnowFields?: string[];
  skillTransfers?: SkillPointTransfer[];
  skillPurchases?: SkillPointPurchase[];
}

export interface MorphDefinition {
  id: string;
  name: string;
  category: 'Biomorph' | 'Synthmorph';
  description: string;
  durability: number;
  woundThreshold?: number;
  deathRating?: number;
  sourcePage?: number;
}

export interface Sleeve {
  id: string;
  egoId: string;
  morphDefinitionId: string;
  assignedAt: string;
  event?: ResleevingEvent;
}

export interface ResleevingEvent {
  date: string;
  location: string;
  cause: string;
  notes: string;
}

export interface CharacterDraft {
  schemaVersion: 2;
  rulesVersion: 'prototype-1' | 'ep2-quick-start-2.4';
  revision: number;
  updatedAt: string;
  ego: Ego;
  sleeves: Sleeve[];
}

export interface LegacyCharacterDraft extends Omit<CharacterDraft, 'schemaVersion' | 'sleeves'> {
  schemaVersion: 1;
  sleeve?: Sleeve;
}
