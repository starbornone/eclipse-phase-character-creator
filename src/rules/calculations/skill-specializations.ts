import type { SkillSpecialization } from '../../types/character.ts';
import { coreCustomizationRules } from '../datasets/customization.ts';
import { skillNameFromId } from './starting-skills.ts';

export function normalizeSpecializationName(name: string) {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function specializationKey({ skillId, name }: SkillSpecialization) {
  return JSON.stringify([skillId, normalizeSpecializationName(name).toLowerCase()]);
}

export function traceSkillSpecializations(
  skills: readonly { id: string; name: string; total?: number }[],
  specializations: readonly SkillSpecialization[] = [],
) {
  const ledger = new Map(skills.map((skill) => [skill.id, skill]));
  return specializations.map((specialization) => {
    const { skillId } = specialization;
    const skill = ledger.get(skillId);
    const skillName = skill?.name ?? skillNameFromId(skillId) ?? skillId;
    const target = skill?.total === undefined ? undefined : skill.total + coreCustomizationRules.specializationBonus;
    return { ...specialization, skillName, target, missingSkill: !skill };
  });
}
