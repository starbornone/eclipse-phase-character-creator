import { creationPackageKinds } from '../../types/character.ts';
import type { CreationPackageKind, CreationPackages } from '../../types/character.ts';

interface SkillGrant {
  skill: string;
  points: number;
  slot?: string;
  activeField?: 'hardware' | 'pilot';
  suggestedFields?: readonly string[];
  skillOptions?: readonly string[];
}

interface CreationPackage {
  id: string;
  name: string;
  page: number;
  grants: readonly SkillGrant[];
}

export const packageLabels: Record<CreationPackageKind, string> = {
  background: 'Background', career: 'Career', interest: 'Interest', faction: 'Faction',
};

const grant = (skill: string, points: number): SkillGrant => ({ skill, points });
const know = (slot: string, points: number): SkillGrant => ({ skill: 'Know', points, slot });
const hardware = (points: number, suggestedFields: readonly string[]): SkillGrant =>
  ({ skill: 'Hardware', activeField: 'hardware', slot: 'hardware-1', points, suggestedFields });
const pilot = (points: number): SkillGrant =>
  ({ skill: 'Pilot', activeField: 'pilot', slot: 'pilot-1', points, suggestedFields: ['Air', 'Ground', 'Nautical', 'Space'] });
const combatChoice = (points: number, skillOptions: readonly string[]): SkillGrant =>
  ({ skill: 'Combat skill', slot: 'combat-1', points, skillOptions });

// Adapted from Eclipse Phase Second Edition, pp. 38–44, Posthuman Studios, LLC.
// CC BY-NC-SA 4.0. Faction Know grants follow the April 2025 errata.
export const coreCreationPackages: Record<CreationPackageKind, readonly CreationPackage[]> = {
  background: [
    { id: 'colonist', name: 'Colonist', page: 38, grants: [
      grant('Free Fall', 40), hardware(40, ['Aerospace', 'Electronics', 'Industrial']),
      grant('Interface', 30), pilot(30), grant('Survival', 30), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'enclaver', name: 'Enclaver', page: 38, grants: [
      grant('Athletics', 40), grant('Interface', 40), grant('Kinesics', 30), grant('Persuade', 20),
      grant('Pilot: Ground', 20), grant('Program', 20), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'freelancer', name: 'Freelancer', page: 38, grants: [
      grant('Interface', 40), grant('Kinesics', 20), grant('Persuade', 40), grant('Program', 30),
      grant('Research', 40), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'hyperelite', name: 'Hyperelite', page: 39, grants: [
      grant('Athletics', 30), grant('Deceive', 30), grant('Kinesics', 50), grant('Persuade', 30),
      grant('Provoke', 30), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'indenture', name: 'Indenture', page: 39, grants: [
      combatChoice(20, ['Fray', 'Melee']), grant('Free Fall', 40), hardware(50, ['Groundcraft', 'Industrial', 'Robotics']),
      grant('Interface', 40), grant('Perceive', 20), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'infolife', name: 'Infolife', page: 39, grants: [
      grant('Infosec', 50), grant('Interface', 50), grant('Program', 50), grant('Research', 20),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'isolate', name: 'Isolate', page: 39, grants: [
      grant('Free Fall', 40), grant('Guns', 20), hardware(40, ['Aerospace', 'Electronics', 'Robotics']),
      grant('Medicine: Paramedic', 20), pilot(30), grant('Survival', 20), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'underclass', name: 'Underclass', page: 39, grants: [
      grant('Deceive', 30), grant('Fray', 20), combatChoice(40, ['Guns', 'Melee']), grant('Kinesics', 40),
      grant('Perceive', 20), grant('Persuade', 20), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'uplift', name: 'Uplift', page: 39, grants: [
      grant('Athletics', 40), grant('Fray', 20), grant('Kinesics', 30), grant('Perceive', 40),
      grant('Provoke', 20), grant('Survival', 20), know('know-1', 60), know('know-2', 30),
    ] },
  ],
  career: [
    { id: 'academic', name: 'Academic', page: 40, grants: [
      grant('Interface', 30), grant('Research', 60), know('know-1', 60), know('know-2', 40), know('know-3', 30),
    ] },
    { id: 'covert-operative', name: 'Covert Operative', page: 40, grants: [
      grant('Deceive', 40), grant('Infiltrate', 60), grant('Infosec', 30), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'enforcer', name: 'Enforcer', page: 40, grants: [
      grant('Fray', 30), grant('Guns', 20), grant('Melee', 50), grant('Provoke', 30),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'explorer', name: 'Explorer', page: 40, grants: [
      grant('Athletics', 30), grant('Medicine: Paramedic', 20), pilot(20), grant('Survival', 60),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'face', name: 'Face', page: 40, grants: [
      grant('Deceive', 40), grant('Kinesics', 30), grant('Persuade', 60), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'genehacker', name: 'Genehacker', page: 40, grants: [
      grant('Medicine: Biotech', 60), grant('Medicine: Pharmacology', 40), grant('Program', 30),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'hacker', name: 'Hacker', page: 40, grants: [
      grant('Infosec', 60), grant('Interface', 40), grant('Program', 30), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'investigator', name: 'Investigator', page: 40, grants: [
      grant('Kinesics', 30), grant('Perceive', 40), grant('Research', 60), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'medic', name: 'Medic', page: 40, grants: [
      grant('Kinesics', 30), grant('Medicine: Biotech', 40), grant('Medicine: Paramedic', 60),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'mindhacker', name: 'Mindhacker', page: 41, grants: [
      grant('Infosec', 30), grant('Medicine: Pharmacology', 40), grant('Medicine: Psychosurgery', 60),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'scavenger', name: 'Scavenger', page: 41, grants: [
      hardware(60, ['Electronics', 'Industrial', 'Robotics']), grant('Hardware: Demolitions', 40),
      pilot(30), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'scientist', name: 'Scientist', page: 41, grants: [
      hardware(40, ['Electronics', 'Robotics']), grant('Program', 30), grant('Research', 60),
      know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'soldier', name: 'Soldier', page: 41, grants: [
      grant('Fray', 40), grant('Guns', 60), grant('Melee', 30), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'techie', name: 'Techie', page: 41, grants: [
      hardware(60, ['Electronics', 'Industrial', 'Robotics']), grant('Infosec', 40), grant('Program', 30),
      know('know-1', 60), know('know-2', 30),
    ] },
  ],
  interest: [
    { id: 'networker', name: 'Networker', page: 42, grants: [
      grant('Deceive', 30), grant('Persuade', 40), grant('Provoke', 30), grant('Know: Rep Nets', 40),
    ] },
    { id: 'paramedic', name: 'Paramedic', page: 42, grants: [
      grant('Fray', 20), grant('Kinesics', 40), grant('Medicine: Paramedic', 40), grant('Know: Emergency Services', 40),
    ] },
    { id: 'spacer', name: 'Spacer', page: 43, grants: [
      grant('Free Fall', 40), hardware(40, ['Electronics', 'Industrial', 'Robotics']),
      grant('Interface', 20), know('know-1', 40),
    ] },
  ],
  faction: [
    { id: 'anarchist', name: 'Anarchist', page: 44, grants: [grant('Know: Anarchists', 30)] },
    { id: 'argonaut', name: 'Argonaut', page: 44, grants: [grant('Know: Argonauts', 30)] },
    { id: 'factionless', name: 'Factionless', page: 44, grants: [know('know-1', 30)] },
  ],
};

export function findCreationPackage(kind: CreationPackageKind, id?: string) {
  return coreCreationPackages[kind].find((option) => option.id === id);
}

export function creationPackageNames(packages?: CreationPackages) {
  return creationPackageKinds.flatMap((kind) => {
    const choice = findCreationPackage(kind, packages?.[kind]?.id);
    return choice ? [{ kind, label: packageLabels[kind], name: choice.name }] : [];
  });
}
