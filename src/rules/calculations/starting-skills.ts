import { creationPackageKinds } from '../../types/character.ts';
import type { CustomActiveField, Ego, SkillPointPurchase } from '../../types/character.ts';
import { customActiveFieldDisplayName, resolveCustomActiveField } from './active-fields.ts';
import { activeSkillAptitude } from '../datasets/active-skills.ts';
import { findCreationPackage } from '../datasets/creation-packages.ts';

// Eclipse Phase Second Edition, pp. 45 and 48–50.
const startingSkillCap = 80;
const doubledBases = new Set(['Fray', 'Perceive']);

export function knowFieldKey(field: string) {
  return field.trim().replace(/\s+/g, ' ').toLowerCase();
}

interface SkillRow {
  name: string;
  activeSkill?: string;
  customActiveField?: CustomActiveField;
  fieldKey?: string;
  fixedKnowledge?: boolean;
  grants: { source: string; points: number }[];
}

export type SkillInputs = Pick<Ego, 'aptitudes' | 'packages' | 'artisticKnowFields' | 'skillTransfers' | 'skillPurchases'>;

export function calculateStartingSkills({ aptitudes, packages, artisticKnowFields, skillTransfers = [], skillPurchases = [] }: SkillInputs) {
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
    const aptitude = activeSkillAptitude(skill);
    const id = `active:${skill}`;
    if (aptitude && aptitudes[aptitude] !== undefined && !rows.has(id)) {
      rows.set(id, { name: skill, activeSkill: skill, grants: [] });
    }
  }

  function calculateRow(id: string, row: SkillRow) {
    const adjustableKnow = Boolean(row.fieldKey && !row.fixedKnowledge);
    const isArt = Boolean(adjustableKnow && row.fieldKey && artisticFields.has(row.fieldKey));
    const aptitude = row.customActiveField?.aptitude ?? (row.activeSkill ? activeSkillAptitude(row.activeSkill) : isArt ? 'int' : 'cog');
    const aptitudeScore = aptitude === undefined ? undefined : aptitudes[aptitude];
    const multiplier = row.activeSkill && doubledBases.has(row.activeSkill) ? 2 : 1;
    const base = aptitudeScore === undefined ? undefined : aptitudeScore * multiplier;
    const packagePoints = row.grants.reduce((total, grant) => total + grant.points, 0);
    return {
      ...row, id, adjustableKnow, isArt, aptitude, aptitudeScore, multiplier, base, packagePoints,
      allocatedPoints: packagePoints,
      purchasedPoints: 0,
    };
  }

  const balances = new Map([...rows].map(([id, row]) => [id, calculateRow(id, row)]));
  function destination({ to, newKnowField, customActiveField }: SkillPointPurchase) {
    const existing = balances.get(to);
    if (customActiveField !== undefined) {
      const custom = resolveCustomActiveField(customActiveField);
      if (!custom || custom.id !== to || newKnowField !== undefined) {
        return { issue: 'Choose a valid custom Active field and linked aptitude.' };
      }
      if (existing && existing.customActiveField?.aptitude !== custom.field.aptitude) {
        return { issue: `${existing.name} already uses a different aptitude.` };
      }
      return { target: existing ?? calculateRow(to, { name: custom.skillName, activeSkill: custom.skillName, customActiveField: custom.field, grants: [] }) };
    }
    const field = newKnowField?.trim().replace(/\s+/g, ' ');
    const fieldKey = field && knowFieldKey(field);
    if (newKnowField !== undefined && (!fieldKey || to !== `know:${fieldKey}`)) {
      return { issue: 'Enter a Know field that matches the destination.' };
    }
    if (existing) return { target: existing };
    if (field && fieldKey) {
      return { target: calculateRow(to, { name: `Know: ${field}`, fieldKey, grants: [] }) };
    }
    const activeSkill = to.startsWith('active:') ? to.slice(7) : '';
    if (activeSkillAptitude(activeSkill)) {
      return { target: calculateRow(to, { name: activeSkill, activeSkill, grants: [] }) };
    }
    return { issue: 'Choose a supported destination skill.' };
  }

  function checkCap(target: ReturnType<typeof calculateRow>, points: number) {
    if (target.base === undefined) return `Enter the linked aptitude for ${target.name} first.`;
    if (target.base + target.allocatedPoints + target.purchasedPoints + points > startingSkillCap) {
      return `That would raise ${target.name} above the starting cap of ${startingSkillCap}.`;
    }
  }

  const transferResults = skillTransfers.map((transfer) => {
    const source = balances.get(transfer.from);
    const { target, issue: destinationIssue } = destination(transfer);
    const fromName = source?.name ?? customActiveFieldDisplayName(transfer.from) ?? transfer.from;
    const toName = target?.name ?? customActiveFieldDisplayName(transfer.to) ?? transfer.to;
    let issue = destinationIssue;

    if (!source) {
      issue = 'Choose a source skill with package points.';
    } else if (target) {
      if (source === target) issue = 'Choose two different skills.';
      else if (!Number.isSafeInteger(transfer.points) || transfer.points < 1) issue = 'Enter a positive whole number of points.';
      else if (source.fieldKey && !target.fieldKey) issue = 'Know points can only move to another Know skill.';
      else if (transfer.points > source.allocatedPoints) issue = `${source.name} has only ${source.allocatedPoints} package points available.`;
      else {
        issue = checkCap(target, transfer.points);
        if (!issue) {
          source.allocatedPoints -= transfer.points;
          target.allocatedPoints += transfer.points;
          balances.set(target.id, target);
        }
      }
    }
    return { transfer, fromName, toName, issue };
  });

  const transferSkillIds = new Set(balances.keys());
  const purchaseResults = skillPurchases.map((purchase) => {
    const { target, issue: destinationIssue } = destination(purchase);
    let issue = destinationIssue;
    if (target) {
      issue = Number.isSafeInteger(purchase.points) && purchase.points > 0
        ? checkCap(target, purchase.points) : 'Enter a positive whole number of points.';
      if (!issue) {
        target.purchasedPoints += purchase.points;
        balances.set(target.id, target);
      }
    }
    return { purchase, toName: target?.name ?? customActiveFieldDisplayName(purchase.to) ?? purchase.to, issue };
  });

  const totals = [...balances.values()].map((skill) => {
    const total = skill.base === undefined ? undefined : skill.allocatedPoints + skill.purchasedPoints + skill.base;
    return { ...skill, total, excess: total === undefined ? 0 : Math.max(0, total - startingSkillCap), purchasedOnly: !transferSkillIds.has(skill.id) };
  }).sort((first, second) => first.name.localeCompare(second.name));
  return { skills: totals, transferResults, purchaseResults, unassignedKnowPoints, cap: startingSkillCap };
}
