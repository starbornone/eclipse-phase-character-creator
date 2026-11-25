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
  if (choices.third?.text.trim() || !legacy) return choices;
  const stance = /^[-−]/.test(legacy) ? 'oppose' : 'support';
  const text = legacy.replace(/^[+−-]\s*/, '').trim();
  return text ? { ...choices, third: { ...choices.third, stance, text } } : choices;
}

export function cleanPersonalMotivations(choices: PersonalMotivations): PersonalMotivations {
  const cleaned: PersonalMotivations = {};
  for (const slot of personalMotivationSlots) {
    const choice = choices[slot];
    if (!choice) continue;
    const { stance } = choice;
    const text = choice.text.trim();
    const goal = choice.goal?.trim();
    if (text || goal) cleaned[slot] = { stance, text, ...(goal ? { goal } : {}) };
  }
  return cleaned;
}

function personalLabel({ stance, text }: PersonalMotivation) {
  return `${stance === 'oppose' ? '−' : '+'}${text}`;
}

export type StartingMotivation = { label: string; goal?: string };

export function listStartingMotivations(ego: Pick<Ego, 'packages' | 'personalMotivations'>): StartingMotivation[] {
  const faction = defaultFactionMotivation(ego.packages);
  const choices = cleanPersonalMotivations(personalMotivationChoices(ego));
  const personal = personalMotivationSlots.flatMap((slot) => {
    const choice = choices[slot];
    return choice?.text && (slot !== 'third' || !faction) ? [{ label: personalLabel(choice), goal: choice.goal }] : [];
  });
  if (!faction) return personal;
  const selection = ego.packages?.faction;
  return [{ label: selection?.motivation?.trim() || faction, goal: selection?.motivationGoal?.trim() || undefined }, ...personal];
}

export function cleanFactionMotivation(packages: CreationPackages) {
  const faction = packages.faction;
  if (!faction) return packages;
  const { motivation, motivationGoal, ...selection } = faction;
  if (faction.id === 'factionless') return { ...packages, faction: selection };
  const goal = motivationGoal?.trim();
  return {
    ...packages,
    faction: { ...selection, ...(motivation === undefined ? {} : { motivation }), ...(goal ? { motivationGoal: goal } : {}) },
  };
}
