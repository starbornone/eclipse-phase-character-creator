import { Fingerprint, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { DraftConflictError, saveDraft } from '../lib/storage/drafts.ts';
import { parseAptitudes } from '../rules/calculations/draft.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import { aptitudes } from '../types/character.ts';
import type { Aptitude, AptitudeInputs, CharacterDraft } from '../types/character.ts';
import { MorphIcon, MorphSource, MorphStats } from './MorphCatalog.tsx';
import { Card } from './ui/card.tsx';

function initialInputs(draft?: CharacterDraft) {
  return Object.fromEntries(aptitudes.map(({ id }) => [id, draft?.ego.aptitudes[id]?.toString() ?? ''])) as AptitudeInputs;
}

interface DraftEditorProps {
  draft?: CharacterDraft;
  onCancel: () => void;
  onSaved: (draft: CharacterDraft) => void;
  onDirty: (dirty: boolean) => void;
  onSaving: (saving: boolean) => void;
}

export function DraftEditor({ draft, onCancel, onSaved, onDirty, onSaving }: DraftEditorProps) {
  const [name, setName] = useState(draft?.ego.name ?? '');
  const [pronouns, setPronouns] = useState(draft?.ego.pronouns ?? '');
  const [concept, setConcept] = useState(draft?.ego.concept ?? '');
  const [inputs, setInputs] = useState(() => initialInputs(draft));
  const [morphId, setMorphId] = useState(draft?.sleeve?.morphDefinitionId ?? '');
  const [issue, setIssue] = useState<{ id: Aptitude; message: string }>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const assignedMorph = findSampleMorph(draft?.sleeve?.morphDefinitionId);
  const dirty = name !== (draft?.ego.name ?? '') || pronouns !== (draft?.ego.pronouns ?? '')
    || concept !== (draft?.ego.concept ?? '') || morphId !== (draft?.sleeve?.morphDefinitionId ?? '')
    || aptitudes.some(({ id }) => inputs[id] !== (draft?.ego.aptitudes[id]?.toString() ?? ''));

  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || conflict) return;
    const form = event.currentTarget;
    const parsed = parseAptitudes(inputs);
    setIssue(parsed.issue);
    if (parsed.issue) {
      form.querySelector<HTMLInputElement>(`#aptitude-${parsed.issue.id}`)?.focus();
      return;
    }

    setSaving(true);
    onSaving(true);
    setError('');
    try {
      const egoId = draft?.ego.id ?? crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const sleeve = draft?.sleeve ?? (morphId ? {
        id: crypto.randomUUID(),
        egoId,
        morphDefinitionId: morphId,
        assignedAt: updatedAt,
      } : undefined);
      const next: CharacterDraft = {
        schemaVersion: 1,
        rulesVersion: 'ep2-quick-start-2.4',
        revision: (draft?.revision ?? 0) + 1,
        updatedAt,
        ego: { id: egoId, name: name.trim(), pronouns: pronouns.trim(), concept: concept.trim(), aptitudes: parsed.scores },
        sleeve,
      };
      await saveDraft(next, draft?.revision);
      onSaved(next);
    } catch (cause) {
      const stale = cause instanceof DraftConflictError;
      setConflict(stale);
      setError(stale
        ? 'This draft changed in another tab. Reload to open the latest saved version.'
        : 'Your draft could not be saved. Check that this browser allows local storage, then try again.');
      setSaving(false);
      onSaving(false);
    }
  }

  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>{draft ? 'Edit ego' : 'Create ego'}</h1>
        <p>Start with identity and aptitudes. You can save a draft before assigning a morph.</p>
      </header>
      <form onSubmit={submit}>
        <fieldset disabled={saving} className="editor-grid">
          <div className="editor-fields">
            <Card className="editor-panel">
              <h2><Fingerprint size={21} aria-hidden="true" /> Identity</h2>
              <div className="identity-fields">
                <label>Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} /></label>
                <label>Pronouns<input value={pronouns} onChange={(event) => setPronouns(event.target.value)} maxLength={50} /></label>
                <label className="concept">Concept<textarea value={concept} onChange={(event) => setConcept(event.target.value)} maxLength={1000} rows={3} /></label>
              </div>
            </Card>
            <Card className="editor-panel">
              <h2>Aptitudes</h2>
              <p className="muted">Enter whole numbers from 0 to 99. You can leave aptitudes blank while drafting. Creation budgets will be checked in the full builder.</p>
              <div className="aptitude-fields">
                {aptitudes.map(({ id, label }) => (
                  <label key={id} htmlFor={`aptitude-${id}`}>
                    {label}
                    <input
                      id={`aptitude-${id}`}
                      inputMode="numeric"
                      value={inputs[id]}
                      aria-invalid={issue?.id === id || undefined}
                      aria-describedby={issue?.id === id ? 'aptitude-error' : undefined}
                      onChange={(event) => {
                        setInputs({ ...inputs, [id]: event.target.value });
                        if (issue?.id === id) setIssue(undefined);
                      }}
                    />
                  </label>
                ))}
              </div>
              {issue && <p className="error" id="aptitude-error" role="alert">{issue.message}</p>}
            </Card>
          </div>
          <Card className="editor-panel morph-picker">
            <h2>First morph</h2>
            {draft?.sleeve ? (
              <>
                <p className="muted">This ego already has a sleeve.</p>
                <div className="assigned-morph">
                  {assignedMorph && <MorphIcon morph={assignedMorph} />}
                  <strong>{assignedMorph?.name ?? 'Unknown morph'}</strong>
                </div>
                {assignedMorph && <MorphSource morph={assignedMorph} />}
              </>
            ) : (
              <fieldset>
                <legend className="muted">Choose an optional sample morph.</legend>
                <label className="morph-option">
                  <input type="radio" name="morph" value="" checked={!morphId} onChange={() => setMorphId('')} />
                  <span>No morph assigned</span>
                </label>
                {sampleMorphs.map((morph) => (
                  <label className="morph-option" key={morph.id}>
                    <input type="radio" name="morph" value={morph.id} checked={morphId === morph.id} onChange={() => setMorphId(morph.id)} />
                    <span><strong>{morph.name}</strong><span className="record-meta">{morph.category}</span><MorphStats morph={morph} /></span>
                  </label>
                ))}
              </fieldset>
            )}
          </Card>
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="button primary" disabled={saving || conflict}><Save size={17} aria-hidden="true" /> {saving ? 'Saving…' : 'Save draft'}</button>
          <button type="button" className="button secondary" disabled={saving} onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </>
  );
}
