import type { ReputationNetwork } from '../rules/datasets/reputation.ts';
import type { ActiveFieldCategory } from '../rules/datasets/active-skills.ts';
import type { GearCampaign } from '../rules/datasets/starting-gear.ts';

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
export type ReputationScores = Partial<Record<ReputationNetwork, number>>;

export const creationPackageKinds = ['background', 'career', 'interest', 'faction'] as const;
export type CreationPackageKind = (typeof creationPackageKinds)[number];

export interface CreationPackageSelection {
  id: string;
  fields?: Record<string, string>;
  motivation?: string;
  motivationGoal?: string;
}

export type CreationPackages = Partial<Record<CreationPackageKind, CreationPackageSelection>>;

export interface PersonalMotivation {
  stance: 'support' | 'oppose';
  text: string;
  goal?: string;
}

export type PersonalMotivations = Partial<Record<'first' | 'second' | 'third', PersonalMotivation>>;

export interface CustomActiveField {
  category: ActiveFieldCategory;
  name: string;
  aptitude: Aptitude;
}

interface SkillPointAllocation {
  to: string;
  points: number;
  newKnowField?: string;
  customActiveField?: CustomActiveField;
}

export type SkillPointPurchase = SkillPointAllocation;

export interface SkillPointTransfer extends SkillPointAllocation {
  from: string;
}

export interface SkillSpecialization {
  skillId: string;
  name: string;
}

export interface EgoTraitChoice {
  id: string;
  level: number;
  skillId?: string;
  detail?: string;
  network?: ReputationNetwork;
}

export interface PsiConfiguration {
  subStrain: string;
  drawback?: string;
  freeSleight?: string;
}

export interface StartingGearSwap {
  packId: string;
  item: string;
  replacement: string;
}

export interface Ego {
  id: string;
  name: string;
  pronouns: string;
  concept: string;
  aptitudes: AptitudeScores;
  egoFlex?: number;
  languages?: string[];
  reputation?: ReputationScores;
  packages?: CreationPackages;
  personalMotivations?: PersonalMotivations;
  startingMorphPoints?: number;
  startingCampaign?: GearCampaign;
  startingInfomorphPack?: true;
  startingGearSwaps?: StartingGearSwap[];
  startingEquipment?: string[];
  artisticKnowFields?: string[];
  skillTransfers?: SkillPointTransfer[];
  skillPurchases?: SkillPointPurchase[];
  specializations?: SkillSpecialization[];
  traits?: EgoTraitChoice[];
  psi?: PsiConfiguration;
  psiSleightPurchases?: string[];
}

export interface MorphDefinition {
  id: string;
  name: string;
  category: 'Biomorph' | 'Synthmorph' | 'Infomorph';
  description: string;
  durability: number;
  woundThreshold?: number;
  deathRating?: number;
  morphPoints?: number;
  morphPointsSource?: { label: string; url: string };
  includedTraits?: readonly MorphTraitChoice[];
  includedWare?: readonly string[];
  movement?: string;
  armor?: string;
  pools?: { insight: number; moxie: number; vigor: number; flex: number };
  source?: { label: string; url: string };
}

export interface MorphTraitChoice {
  id: string;
  level: number;
}

export interface Sleeve {
  id: string;
  egoId: string;
  morphDefinitionId: string;
  assignedAt: string;
  morphTraits?: MorphTraitChoice[];
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
