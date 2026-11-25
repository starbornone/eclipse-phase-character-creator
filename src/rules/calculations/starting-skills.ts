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

export type SkillInputs = Pick<Ego, 'aptitudes' | 'packages' | 'artisticKnowFields' | 'skillTransfers'>;

export function calculateStartingSkills({ aptitudes, packages, artisticKnowFields, skillTransfers = [] }: SkillInputs) {
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
    return {
      ...row, id, adjustableKnow, isArt, aptitude, aptitudeScore, multiplier, base, packagePoints,
      allocatedPoints: packagePoints,
    };
  });
  const balances = new Map(skills.map((skill) => [skill.id, skill]));
  const transferResults = skillTransfers.map((transfer) => {
    const source = balances.get(transfer.from);
    const target = balances.get(transfer.to);
    const fromName = source?.name ?? transfer.from;
    const toName = target?.name ?? transfer.to;
    let issue: string | undefined;

    if (!source || !target) issue = 'Choose skills that still appear in the ledger.';
    else if (source === target) issue = 'Choose two different skills.';
    else if (!Number.isSafeInteger(transfer.points) || transfer.points < 1) issue = 'Enter a positive whole number of points.';
    else if (source.fieldKey && !target.fieldKey) issue = 'Know points can only move to another Know skill.';
    else if (transfer.points > source.allocatedPoints) issue = `${source.name} has only ${source.allocatedPoints} package points available.`;
    else if (target.base === undefined) issue = `Enter the linked aptitude for ${target.name} first.`;
    else if (target.base + target.allocatedPoints + transfer.points > startingSkillCap) {
      issue = `That would raise ${target.name} above the starting cap of ${startingSkillCap}.`;
    } else {
      source.allocatedPoints -= transfer.points;
      target.allocatedPoints += transfer.points;
    }
    return { transfer, fromName, toName, issue };
  });

  const totals = skills.map((skill) => {
    const total = skill.base === undefined ? undefined : skill.allocatedPoints + skill.base;
    return { ...skill, total, excess: total === undefined ? 0 : Math.max(0, total - startingSkillCap) };
  }).sort((first, second) => first.name.localeCompare(second.name));
  return { skills: totals, transferResults, unassignedKnowPoints, cap: startingSkillCap };
}
