import type { Aptitude } from '../../types/character.ts';
import { psiSkill } from './psi.ts';

// Eclipse Phase Second Edition, Active Skill List. Psi requires the Psi trait.
const skillsByAptitude: Record<Aptitude, string[]> = {
  cog: [
    'Hardware: Aerospace', 'Hardware: Armorer', 'Hardware: Demolitions', 'Hardware: Electronics',
    'Hardware: Groundcraft', 'Hardware: Industrial', 'Hardware: Nautical', 'Hardware: Robotics',
    'Infosec', 'Interface', 'Medicine: Biotech', 'Medicine: Forensics', 'Medicine: Paramedic',
    'Medicine: Pharmacology', 'Medicine: Psychosurgery', 'Medicine: Veterinary', 'Program',
  ],
  int: ['Exotic Skill: Disguise', 'Perceive', 'Research', 'Survival'],
  ref: [
    'Exotic Skill: Bow', 'Exotic Skill: Escape Artist', 'Exotic Skill: Plasma Cutter',
    'Exotic Skill: Sleight of Hand', 'Exotic Skill: Throwing Knives', 'Exotic Skill: Whips',
    'Fray', 'Guns', 'Infiltrate', 'Pilot: Air', 'Pilot: Ground', 'Pilot: Nautical', 'Pilot: Space',
  ],
  sav: ['Deceive', 'Exotic Skill: Animal Handling', 'Kinesics', 'Persuade', 'Provoke'],
  som: ['Athletics', 'Free Fall', 'Melee'],
  wil: [psiSkill],
};

const activeSkills = new Map<string, Aptitude>();
for (const [aptitude, skills] of Object.entries(skillsByAptitude)) {
  for (const skill of skills) activeSkills.set(skill, aptitude as Aptitude);
}

export const activeSkillNames = [...activeSkills.keys()].sort((first, second) => first.localeCompare(second));

export function activeSkillAptitude(skill: string) {
  return activeSkills.get(skill);
}

export const activeFieldCategories = [
  { id: 'hardware', name: 'Hardware', aptitude: 'cog' },
  { id: 'medicine', name: 'Medicine', aptitude: 'cog' },
  { id: 'pilot', name: 'Pilot', aptitude: 'ref' },
  { id: 'exotic', name: 'Exotic Skill', aptitude: undefined },
] as const;

export type ActiveFieldCategory = (typeof activeFieldCategories)[number]['id'];
