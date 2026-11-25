import type { CreationPackages, Ego, PersonalMotivation, PersonalMotivations } from '../../types/character.ts';
import { findCreationPackage } from '../datasets/creation-packages.ts';

export const motivationsSource = 'https://eclipsephase.github.io/en/04/16-step-13-motivations.html';
export const personalMotivationSlots = ['first', 'second', 'third'] as const;

export function defaultFactionMotivation(packages?: CreationPackages) {
  const faction = findCreationPackage('faction', packages?.faction?.id);
  return faction && faction.id !== 'factionless' ? `+${faction.name} Interests` : undefined;
}

export function personalMotivationChoices(ego?: Pick<Ego, 'packages' | 'personalMotivations'>): PersonalMotivations {
  const choices = ego?.personalMotivations ?? {};
  const faction = ego?.packages?.faction;
  const legacy = faction?.id === 'factionless' ? faction.motivation?.trim() : undefined;
  if (choices.third || !legacy) return choices;
  const stance = /^[-−]/.test(legacy) ? 'oppose' : 'support';
  const text = legacy.replace(/^[+−-]\s*/, '').trim();
  return text ? { ...choices, third: { stance, text } } : choices;
}

export function cleanPersonalMotivations(choices: PersonalMotivations): PersonalMotivations {
  const cleaned: PersonalMotivations = {};
  for (const slot of personalMotivationSlots) {
    const choice = choices[slot];
    const text = choice?.text.trim();
    if (choice && text) cleaned[slot] = { ...choice, text };
  }
  return cleaned;
}

function personalLabel({ stance, text }: PersonalMotivation) {
  return `${stance === 'oppose' ? '−' : '+'}${text}`;
}

export function listStartingMotivations(ego: Pick<Ego, 'packages' | 'personalMotivations'>) {
  const faction = defaultFactionMotivation(ego.packages);
  const choices = cleanPersonalMotivations(personalMotivationChoices(ego));
  const personal = personalMotivationSlots.flatMap((slot) => {
    const choice = choices[slot];
    return choice && (slot !== 'third' || !faction) ? [personalLabel(choice)] : [];
  });
  return faction ? [ego.packages?.faction?.motivation?.trim() || faction, ...personal] : personal;
}

export function clearLegacyFactionlessMotivation(packages: CreationPackages) {
  const faction = packages.faction;
  if (faction?.id !== 'factionless' || faction.motivation === undefined) return packages;
  const { motivation, ...selection } = faction;
  return { ...packages, faction: selection };
}
