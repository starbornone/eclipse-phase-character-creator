import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { activeSleeve, recordResleeving } from '../features/sleeve/history.ts';
import { DraftConflictError, saveDraft } from '../lib/storage/drafts.ts';
import { traceResleevingTests } from '../rules/calculations/resleeving.ts';
import { startingMorphBudgetForDraft } from '../rules/calculations/starting-morph-budget.ts';
import { resleevingTestRules } from '../rules/datasets/resleeving.ts';
import { sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import { morphProfileForSleeve } from '../rules/calculations/morph-traits.ts';
import type { CharacterDraft, ResleevingEvent } from '../types/character.ts';
import { AptitudeCheckCalculation } from './AptitudeCheckCalculation.tsx';
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
  const [waiveExoticMorphology, setWaiveExoticMorphology] = useState(false);
  const [details, setDetails] = useState<ResleevingEvent>({ date: '', location: '', cause: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState('');
  const { morph: current } = morphProfileForSleeve(activeSleeve(draft));
  const target = sampleMorphs.find((morph) => morph.id === targetId);
  const tests = target && traceResleevingTests(draft.ego, target, waiveExoticMorphology);
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
                <select value={targetId} onChange={(event) => {
                  setTargetId(event.target.value);
                  setWaiveExoticMorphology(false);
                }} required>
                  <option value="">Choose a morph</option>
                  {sampleMorphs.map((morph) => <option key={morph.id} value={morph.id}>{morph.name}</option>)}
                </select>
              </label>
            </div>
          </Card>
          {target && (
            <section className="panel comparison" aria-labelledby="resleeve-comparison-title">
              <div className="comparison-heading"><h2 id="resleeve-comparison-title">Current and proposed sleeves</h2></div>
              <p className="muted" id="resleeve-comparison-note">Health and morph trait modifiers follow the sleeve. Aptitude scores follow the ego.</p>
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
          {tests && (
            <Card className="editor-panel resleeving-tests">
              <h2>Resleeving test targets</h2>
              <p className="rules-note">Use these targets for tabletop rolls with ego Flex. Apply the GM’s situational modifiers and Stress Value.</p>
              {tests.hasExoticMorphology && !tests.familiar && (
                <label className="compare-toggle">
                  <input type="checkbox" checked={waiveExoticMorphology} onChange={(event) => setWaiveExoticMorphology(event.target.checked)} />
                  <span>Waive Exotic Morphology for this preview</span>
                </label>
              )}
              <dl className="print-checks" aria-live="polite">
                <div>
                  <dt>Integration Test · SOM</dt>
                  <dd>{tests.integration ? (
                    <>
                      {tests.integration.target ?? 'Pending'}
                      <span className="skill-grant muted"><AptitudeCheckCalculation check={tests.integration} missingBase="" /></span>
                    </>
                  ) : 'Waived by Morph Familiarity'}</dd>
                </div>
                <div>
                  <dt>Resleeving Stress Test · WIL</dt>
                  <dd>{tests.stress.target ?? 'Pending'}
                    <span className="skill-grant muted"><AptitudeCheckCalculation check={tests.stress} missingBase="" /></span>
                  </dd>
                </div>
              </dl>
              <p className="rules-note">Typical Stress Values are {resleevingTestRules.standardStressValue} for standard resleeving and{' '}
                {resleevingTestRules.highStressValue} for remembered death or extended lack.</p>
              {tests.hasIdentityCrisis && <p className="rules-note">Identity Crisis can impose −10 on applicable actions. Check with the GM.</p>}
              <p className="rules-note"><a href={resleevingTestRules.source}>Core resleeving tests</a></p>
            </Card>
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
