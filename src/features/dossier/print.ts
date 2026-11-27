import { activeSleeve } from '../sleeve/history.ts';
import { traceAptitudeChecks } from '../../rules/calculations/draft.ts';
import { traceDerivedEgoStats } from '../../rules/calculations/derived-stats.ts';
import { listStartingMotivations } from '../../rules/calculations/motivations.ts';
import { traceSkillSpecializations } from '../../rules/calculations/skill-specializations.ts';
import { calculateStartingSkills } from '../../rules/calculations/starting-skills.ts';
import { startingGearForDraft } from '../../rules/calculations/starting-gear.ts';
import { traceStartingEquipment } from '../../rules/calculations/starting-equipment.ts';
import { startingMorphBudgetForDraft } from '../../rules/calculations/starting-morph-budget.ts';
import { morphProfileForSleeve } from '../../rules/calculations/morph-traits.ts';
import { traceStartingPsi } from '../../rules/calculations/psi.ts';
import { coreCustomizationRules } from '../../rules/datasets/customization.ts';
import type { CharacterDraft } from '../../types/character.ts';

export type PrintAudience = 'player' | 'gm';

export const privatePrintFields = [
  { id: 'date', label: 'Sleeve dates' },
  { id: 'location', label: 'Sleeve locations' },
  { id: 'cause', label: 'Resleeving causes' },
  { id: 'notes', label: 'Sleeve notes' },
] as const;

export type PrivatePrintField = (typeof privatePrintFields)[number]['id'];

export function buildPrintableDossier(
  draft: CharacterDraft,
  audience: PrintAudience,
  includedFields: readonly PrivatePrintField[],
) {
  const sleeve = activeSleeve(draft);
  const { morph, entries: activeMorphTraits } = morphProfileForSleeve(sleeve);
  const skillLedger = calculateStartingSkills(draft.ego);
  const specializations = draft.ego.specializations?.length
    ? traceSkillSpecializations(skillLedger.skills, draft.ego.specializations).filter(({ missingSkill }) => !missingSkill)
    : [];
  return {
    name: draft.ego.name || 'Untitled ego',
    pronouns: draft.ego.pronouns,
    egoFlex: draft.ego.egoFlex ?? coreCustomizationRules.startingEgoFlex,
    languages: draft.ego.languages ?? [],
    reputation: draft.ego.reputation,
    skillLedger,
    specializations,
    traits: draft.ego.traits,
    psi: traceStartingPsi(draft.ego),
    concept: audience === 'player' ? draft.ego.concept : '',
    packages: audience === 'player' ? draft.ego.packages : undefined,
    motivations: audience === 'player' ? listStartingMotivations(draft.ego) : [],
    startingGear: audience === 'player' ? startingGearForDraft(draft) : undefined,
    startingEquipment: audience === 'player' ? traceStartingEquipment(draft.ego.startingEquipment) : [],
    startingMorphBudget: startingMorphBudgetForDraft(draft),
    hasSleeve: Boolean(sleeve),
    morph,
    activeMorphTraits,
    checks: traceAptitudeChecks(draft.ego.aptitudes, draft.ego.traits),
    derivedStats: traceDerivedEgoStats(draft.ego),
    history: audience === 'gm'
      ? [...draft.sleeves].reverse().map((entry, index) => {
        const { id, event, assignedAt } = entry;
        const { morph: historicalMorph, entries: traitEntries } = morphProfileForSleeve(entry);
        return {
          id,
          morphName: historicalMorph?.name ?? 'Unknown morph',
          morphTraits: traitEntries,
          active: index === 0,
          date: includedFields.includes('date') ? event?.date || assignedAt : undefined,
          location: includedFields.includes('location') ? event?.location : undefined,
          cause: includedFields.includes('cause') ? event?.cause : undefined,
          notes: includedFields.includes('notes') ? event?.notes : undefined,
        };
      })
      : [],
  };
}
