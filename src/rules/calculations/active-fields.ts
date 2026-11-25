import { aptitudes } from '../../types/character.ts';
import type { CustomActiveField } from '../../types/character.ts';
import { activeFieldCategories, activeSkillNames } from '../datasets/active-skills.ts';

const prefix = 'active-field:';

function cleanName(name: string) {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function resolveCustomActiveField(input: { category: unknown; name: unknown; aptitude: unknown }) {
  const category = activeFieldCategories.find(({ id }) => id === input.category);
  const aptitude = aptitudes.find(({ id }) => id === input.aptitude)?.id;
  const name = typeof input.name === 'string' ? cleanName(input.name) : '';
  if (!category || !aptitude || !name || (category.aptitude && category.aptitude !== aptitude)) return undefined;
  const skillName = `${category.name}: ${name}`;
  if (activeSkillNames.some((sample) => sample.toLowerCase() === skillName.toLowerCase())) return undefined;
  const field: CustomActiveField = { category: category.id, name, aptitude };
  return { field, skillName, id: `${prefix}${category.id}:${name.toLowerCase()}` };
}

export function customActiveFieldDisplayName(id: string) {
  if (!id.startsWith(prefix)) return undefined;
  const [, categoryId, ...fieldParts] = id.split(':');
  const field = fieldParts.join(':');
  const category = activeFieldCategories.find((option) => option.id === categoryId);
  if (!category || !field || field !== cleanName(field).toLowerCase()) return undefined;
  const name = `${category.name}: ${field}`;
  return activeSkillNames.some((sample) => sample.toLowerCase() === name.toLowerCase()) ? undefined : name;
}
