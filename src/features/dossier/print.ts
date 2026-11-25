import { activeSleeve } from '../sleeve/history.ts';
import { traceAptitudeChecks } from '../../rules/calculations/draft.ts';
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
  return {
    name: draft.ego.name || 'Untitled ego',
    pronouns: draft.ego.pronouns,
    concept: audience === 'player' ? draft.ego.concept : '',
    packages: audience === 'player' ? draft.ego.packages : undefined,
    hasSleeve: Boolean(sleeve),
    morph: findSampleMorph(sleeve?.morphDefinitionId),
    checks: traceAptitudeChecks(draft.ego.aptitudes),
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
