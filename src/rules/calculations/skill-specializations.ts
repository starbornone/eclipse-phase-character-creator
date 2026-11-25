import type { SkillSpecialization } from '../../types/character.ts';
import { activeSkillAptitude } from '../datasets/active-skills.ts';
import { coreCustomizationRules } from '../datasets/customization.ts';
import { knowFieldKey } from './starting-skills.ts';

export function normalizeSpecializationName(name: string) {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function specializationKey({ skillId, name }: SkillSpecialization) {
  return JSON.stringify([skillId, normalizeSpecializationName(name).toLowerCase()]);
}

export function isSpecializationSkillId(id: string) {
  if (id.startsWith('active:')) return activeSkillAptitude(id.slice(7)) !== undefined;
  if (!id.startsWith('know:')) return false;
  const field = id.slice(5);
  return Boolean(field) && field === knowFieldKey(field);
}

export function traceSkillSpecializations(
  skills: readonly { id: string; name: string; total?: number }[],
  specializations: readonly SkillSpecialization[] = [],
) {
  const ledger = new Map(skills.map((skill) => [skill.id, skill]));
  return specializations.map((specialization) => {
    const { skillId } = specialization;
    const skill = ledger.get(skillId);
    const skillName = skill?.name ?? (skillId.startsWith('know:') ? `Know: ${skillId.slice(5)}` : skillId.slice(7));
    const target = skill?.total === undefined ? undefined : skill.total + coreCustomizationRules.specializationBonus;
    return { ...specialization, skillName, target, missingSkill: !skill };
  });
}
