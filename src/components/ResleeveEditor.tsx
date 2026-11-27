import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { activeSleeve, recordResleeving } from '../features/sleeve/history.ts';
import { DraftConflictError, saveDraft } from '../lib/storage/drafts.ts';
import { startingMorphBudgetForDraft } from '../rules/calculations/starting-morph-budget.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft, ResleevingEvent } from '../types/character.ts';
import { MorphProfileTable } from './MorphCatalog.tsx';
import { Card } from './ui/card.tsx';

interface ResleeveEditorProps {
  draft: CharacterDraft;
  onCancel: () => void;
  onSaved: (draft: CharacterDraft) => void;
  onDirty: (dirty: boolean) => void;
  onSaving: (saving: boolean) => void;
}

export function ResleeveEditor({ draft, onCancel, onSaved, onDirty, onSaving }: ResleeveEditorProps) {
  const [targetId, setTargetId] = useState('');
  const [details, setDetails] = useState<ResleevingEvent>({ date: '', location: '', cause: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState('');
  const current = findSampleMorph(activeSleeve(draft)?.morphDefinitionId);
  const target = sampleMorphs.find((morph) => morph.id === targetId);
  const { temporaryFlex } = startingMorphBudgetForDraft(draft);
  const dirty = Boolean(targetId || details.date || details.location || details.cause || details.notes);

  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || saving || conflict) return;
    setSaving(true);
    onSaving(true);
    setError('');
    try {
      const next = recordResleeving(draft, crypto.randomUUID(), target.id, details, new Date().toISOString());
      await saveDraft(next, draft.revision);
      onSaved(next);
    } catch (cause) {
      const stale = cause instanceof DraftConflictError;
      setConflict(stale);
      setError(stale
        ? 'This draft changed in another tab. Reload to open the latest saved version.'
        : 'The new sleeve could not be saved. Check browser storage, then try again.');
      setSaving(false);
      onSaving(false);
    }
  }

  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Resleeve</h1>
        <p>Choose the next morph for {draft.ego.name || 'this ego'}. Your ego and prior sleeves stay in the dossier.</p>
      </header>
      <form onSubmit={submit}>
        <fieldset disabled={saving} className="resleeve-fields">
          <Card className="editor-panel">
            <h2>New sleeve</h2>
            {Boolean(temporaryFlex) && <p className="rules-note">Your starting MP granted {temporaryFlex} temporary Flex. It expires when you resleeve.</p>}
            <div className="identity-fields">
              <label>
                New morph
                <select value={targetId} onChange={(event) => setTargetId(event.target.value)} required>
                  <option value="">Choose a morph</option>
                  {sampleMorphs.map((morph) => <option key={morph.id} value={morph.id}>{morph.name}</option>)}
                </select>
              </label>
            </div>
          </Card>
          {target && (
            <section className="panel comparison" aria-labelledby="resleeve-comparison-title">
              <div className="comparison-heading"><h2 id="resleeve-comparison-title">Current and proposed sleeves</h2></div>
              <p className="muted" id="resleeve-comparison-note">Health values follow the morph. Aptitude checks stay with the ego.</p>
              <MorphProfileTable
                columns={[
                  { id: 'current', label: `Current · ${current?.name ?? 'Unknown morph'}`, morph: current },
                  { id: 'proposed', label: `Proposed · ${target.name}`, morph: target },
                ]}
                titleId="resleeve-comparison-title"
                noteId="resleeve-comparison-note"
              />
            </section>
          )}
          <Card className="editor-panel">
            <h2>Event details</h2>
            <p className="muted">Optional. The history uses the save date when the event date is blank.</p>
            <div className="identity-fields">
              <label>Event date<input type="date" value={details.date} onInput={(event) => setDetails({ ...details, date: event.currentTarget.value })} /></label>
              <label>Location<input value={details.location} maxLength={100} onChange={(event) => setDetails({ ...details, location: event.target.value })} /></label>
              <label className="concept">Cause<input value={details.cause} maxLength={200} onChange={(event) => setDetails({ ...details, cause: event.target.value })} /></label>
              <label className="concept">Notes<textarea value={details.notes} maxLength={1000} rows={3} onChange={(event) => setDetails({ ...details, notes: event.target.value })} /></label>
            </div>
          </Card>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="button primary" disabled={!target || saving || conflict}>{saving ? 'Saving…' : 'Save new sleeve'}</button>
          <button type="button" className="button secondary" disabled={saving} onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </>
  );
}
