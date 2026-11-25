import { creationPackageKinds } from '../../types/character.ts';
import type { CreationPackageKind, CreationPackages } from '../../types/character.ts';

interface SkillGrant {
  skill: string;
  points: number;
  slot?: string;
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

// Adapted from Eclipse Phase Second Edition, pp. 38–44, Posthuman Studios, LLC.
// CC BY-NC-SA 4.0. Faction Know grants follow the April 2025 errata.
export const coreCreationPackages: Record<CreationPackageKind, readonly CreationPackage[]> = {
  background: [
    { id: 'freelancer', name: 'Freelancer', page: 38, grants: [
      grant('Interface', 40), grant('Kinesics', 20), grant('Persuade', 40), grant('Program', 30),
      grant('Research', 40), know('know-1', 60), know('know-2', 30),
    ] },
    { id: 'hyperelite', name: 'Hyperelite', page: 39, grants: [
      grant('Athletics', 30), grant('Deceive', 30), grant('Kinesics', 50), grant('Persuade', 30),
      grant('Provoke', 30), know('know-1', 60), know('know-2', 30),
    ] },
  ],
  career: [
    { id: 'academic', name: 'Academic', page: 40, grants: [
      grant('Interface', 30), grant('Research', 60), know('know-1', 60), know('know-2', 40), know('know-3', 30),
    ] },
    { id: 'face', name: 'Face', page: 40, grants: [
      grant('Deceive', 40), grant('Kinesics', 30), grant('Persuade', 60), know('know-1', 60), know('know-2', 30),
    ] },
  ],
  interest: [
    { id: 'networker', name: 'Networker', page: 42, grants: [
      grant('Deceive', 30), grant('Persuade', 40), grant('Provoke', 30), grant('Know: Rep Nets', 40),
    ] },
    { id: 'paramedic', name: 'Paramedic', page: 42, grants: [
      grant('Fray', 20), grant('Kinesics', 40), grant('Medicine: Paramedic', 40), grant('Know: Emergency Services', 40),
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
