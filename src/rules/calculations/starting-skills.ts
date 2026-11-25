import { creationPackageKinds } from '../../types/character.ts';
import type { Aptitude, Ego } from '../../types/character.ts';
import { findCreationPackage } from '../datasets/creation-packages.ts';

// Eclipse Phase Second Edition, pp. 45 and 48–50.
const startingSkillCap = 80;
const activeAptitudes: Readonly<Record<string, Aptitude | undefined>> = {
  Athletics: 'som',
  Deceive: 'sav',
  Fray: 'ref',
  Interface: 'cog',
  Kinesics: 'sav',
  'Medicine: Paramedic': 'cog',
  Perceive: 'int',
  Persuade: 'sav',
  Program: 'cog',
  Provoke: 'sav',
  Research: 'int',
};
const doubledBases = new Set(['Fray', 'Perceive']);

export function knowFieldKey(field: string) {
  return field.trim().replace(/\s+/g, ' ').toLowerCase();
}

interface SkillRow {
  name: string;
  activeSkill?: string;
  fieldKey?: string;
  fixedKnowledge?: boolean;
  grants: { source: string; points: number }[];
}

type SkillInputs = Pick<Ego, 'aptitudes' | 'packages' | 'artisticKnowFields'>;

export function calculateStartingSkills({ aptitudes, packages, artisticKnowFields }: SkillInputs) {
  const rows = new Map<string, SkillRow>();
  const artisticFields = new Set(artisticKnowFields);
  let unassignedKnowPoints = 0;

  for (const kind of creationPackageKinds) {
    const selection = packages?.[kind];
    const chosen = findCreationPackage(kind, selection?.id);
    if (!chosen) continue;
    for (const { skill, points, slot } of chosen.grants) {
      const field = slot ? selection?.fields?.[slot]?.trim() : skill.startsWith('Know: ') ? skill.slice(6) : undefined;
      if (slot && !field) {
        unassignedKnowPoints += points;
        continue;
      }
      const fieldKey = field ? knowFieldKey(field) : undefined;
      const id = fieldKey ? `know:${fieldKey}` : `active:${skill}`;
      const row: SkillRow = rows.get(id) ?? {
        name: field ? `Know: ${field}` : skill,
        activeSkill: field ? undefined : skill,
        fieldKey,
        grants: [],
      };
      if (field && !slot) row.fixedKnowledge = true;
      row.grants.push({ source: chosen.name, points });
      rows.set(id, row);
    }
  }

  for (const skill of doubledBases) {
    const aptitude = activeAptitudes[skill];
    const id = `active:${skill}`;
    if (aptitude && aptitudes[aptitude] !== undefined && !rows.has(id)) {
      rows.set(id, { name: skill, activeSkill: skill, grants: [] });
    }
  }

  const skills = [...rows].map(([id, row]) => {
    const adjustableKnow = Boolean(row.fieldKey && !row.fixedKnowledge);
    const isArt = Boolean(adjustableKnow && row.fieldKey && artisticFields.has(row.fieldKey));
    const aptitude = row.activeSkill ? activeAptitudes[row.activeSkill] : isArt ? 'int' : 'cog';
    const aptitudeScore = aptitude === undefined ? undefined : aptitudes[aptitude];
    const multiplier = row.activeSkill && doubledBases.has(row.activeSkill) ? 2 : 1;
    const base = aptitudeScore === undefined ? undefined : aptitudeScore * multiplier;
    const packagePoints = row.grants.reduce((total, grant) => total + grant.points, 0);
    const total = base === undefined ? undefined : packagePoints + base;
    return {
      ...row, id, adjustableKnow, isArt, aptitude, aptitudeScore, multiplier, base, packagePoints, total,
      excess: total === undefined ? 0 : Math.max(0, total - startingSkillCap),
    };
  });
  skills.sort((first, second) => first.name.localeCompare(second.name));
  return { skills, unassignedKnowPoints, cap: startingSkillCap };
}
