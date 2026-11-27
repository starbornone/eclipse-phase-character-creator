import type { EgoTraitChoice } from '../../types/character.ts';
import { findEgoTrait } from '../datasets/ego-traits.ts';
import { reputationNetworks } from '../datasets/reputation.ts';

export function normalizeTraitDetail(detail: string) {
  return detail.normalize('NFC').trim().replace(/\s+/g, ' ');
}

export function egoTraitChoiceKey(choice: EgoTraitChoice) {
  return findEgoTrait(choice.id)?.selection
    ? JSON.stringify([choice.id, normalizeTraitDetail(choice.detail ?? '').toLowerCase(), choice.network ?? ''])
    : choice.id;
}

export function scopedEgoTraitIssue(choice: EgoTraitChoice, existing: readonly EgoTraitChoice[] = []) {
  const selection = findEgoTrait(choice.id)?.selection;
  if (!selection) return 'Choose Contact or Morph Familiarity.';
  const detail = normalizeTraitDetail(choice.detail ?? '');
  if (!detail || detail.length > 100) return selection === 'contact' ? 'Enter a contact name of 1–100 characters.' : 'Enter a morph type of 1–100 characters.';
  if (selection === 'contact' && !reputationNetworks.some(({ id }) => id === choice.network)) return 'Choose a reputation network for this contact.';
  if (selection === 'morph' && choice.network !== undefined) return 'Morph Familiarity does not use a reputation network.';
  if (existing.some((entry) => egoTraitChoiceKey(entry) === egoTraitChoiceKey(choice))) return 'That trait choice is already recorded.';
}

export function traceEgoTraits(choices: readonly EgoTraitChoice[] = []) {
  return choices.flatMap((choice) => {
    const { id, level, skillId, detail, network } = choice;
    const trait = findEgoTrait(id);
    const cp = Number.isInteger(level) ? trait?.cpByLevel[level - 1] : undefined;
    return trait && cp !== undefined ? [{ ...trait, level, cp, skillId, detail, network, key: egoTraitChoiceKey(choice) }] : [];
  });
}

export function evaluateEgoTraitBudget(choices: readonly EgoTraitChoice[] = []) {
  let cost = 0;
  let bonus = 0;
  for (const { cp } of traceEgoTraits(choices)) {
    if (cp > 0) cost += cp;
    else bonus -= cp;
  }
  return { cost, bonus };
}
