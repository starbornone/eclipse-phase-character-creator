import type { CharacterDraft, LegacyCharacterDraft, ResleevingEvent, Sleeve } from '../../types/character.ts';

export function normalizeDraft(draft: CharacterDraft | LegacyCharacterDraft): CharacterDraft {
  if (draft.schemaVersion === 2) return draft;
  if (draft.schemaVersion !== 1) throw new Error('Unsupported draft schema');
  const { sleeve, ...record } = draft;
  return { ...record, schemaVersion: 2, sleeves: sleeve ? [sleeve] : [] };
}

export function activeSleeve(draft?: CharacterDraft): Sleeve | undefined {
  return draft?.sleeves.at(-1);
}

export function recordResleeving(
  draft: CharacterDraft,
  sleeveId: string,
  morphDefinitionId: string,
  event: ResleevingEvent,
  savedAt: string,
): CharacterDraft {
  if (!activeSleeve(draft) || draft.sleeves.some((sleeve) => sleeve.id === sleeveId)) {
    throw new Error('Resleeving needs an existing sleeve and a new sleeve identifier');
  }

  return {
    ...draft,
    revision: draft.revision + 1,
    updatedAt: savedAt,
    sleeves: [...draft.sleeves, {
      id: sleeveId,
      egoId: draft.ego.id,
      morphDefinitionId,
      assignedAt: savedAt,
      event: { date: event.date.trim(), location: event.location.trim(), cause: event.cause.trim(), notes: event.notes.trim() },
    }],
  };
}
