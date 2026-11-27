import { activeSleeve } from '../sleeve/history.ts';
import { traceAptitudeChecks } from '../../rules/calculations/draft.ts';
import { listStartingMotivations } from '../../rules/calculations/motivations.ts';
import { traceSkillSpecializations } from '../../rules/calculations/skill-specializations.ts';
import { calculateStartingSkills } from '../../rules/calculations/starting-skills.ts';
import { startingGearForDraft } from '../../rules/calculations/starting-gear.ts';
import { coreCustomizationRules } from '../../rules/datasets/customization.ts';
import { findSampleMorph } from '../../rules/datasets/sample-morphs.ts';
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
    concept: audience === 'player' ? draft.ego.concept : '',
    packages: audience === 'player' ? draft.ego.packages : undefined,
    motivations: audience === 'player' ? listStartingMotivations(draft.ego) : [],
    startingGear: audience === 'player' ? startingGearForDraft(draft) : undefined,
    hasSleeve: Boolean(sleeve),
    morph: findSampleMorph(sleeve?.morphDefinitionId),
    checks: traceAptitudeChecks(draft.ego.aptitudes, draft.ego.traits),
    history: audience === 'gm'
      ? [...draft.sleeves].reverse().map(({ id, morphDefinitionId, event, assignedAt }, index) => ({
        id,
        morphName: findSampleMorph(morphDefinitionId)?.name ?? 'Unknown morph',
        active: index === 0,
        date: includedFields.includes('date') ? event?.date || assignedAt : undefined,
        location: includedFields.includes('location') ? event?.location : undefined,
        cause: includedFields.includes('cause') ? event?.cause : undefined,
        notes: includedFields.includes('notes') ? event?.notes : undefined,
      }))
      : [],
  };
}
