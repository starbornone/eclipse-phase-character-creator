import { Fingerprint, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { parseLanguages } from '../rules/calculations/aptitude-budget.ts';
import { activeSleeve } from '../features/sleeve/history.ts';
import { DraftConflictError, saveDraft } from '../lib/storage/drafts.ts';
import { parseAptitudes } from '../rules/calculations/draft.ts';
import { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { cleanFactionMotivation, cleanPersonalMotivations, personalMotivationChoices } from '../rules/calculations/motivations.ts';
import { parseReputation, traceReputation } from '../rules/calculations/reputation.ts';
import type { ReputationInputs } from '../rules/calculations/reputation.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { reputationNetworks } from '../rules/datasets/reputation.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import { aptitudes } from '../types/character.ts';
import type { Aptitude, AptitudeInputs, AptitudeScores, CharacterDraft, CreationPackages as PackageSelections } from '../types/character.ts';
import { AptitudeBudget, AptitudeTemplatePicker } from './AptitudeBudget.tsx';
import { CreationPackages } from './CreationPackages.tsx';
import { EgoTraitEditor } from './EgoTraits.tsx';
import { EgoDerivedStats } from './EgoDerivedStats.tsx';
import { MorphIcon, MorphSource, MorphStats } from './MorphCatalog.tsx';
import { MotivationEditor } from './Motivations.tsx';
import { ReputationEditor } from './Reputation.tsx';
import { StartingSkills } from './StartingSkills.tsx';
import { StartingGearEditor } from './StartingGear.tsx';
import { Card } from './ui/card.tsx';

function aptitudeInputs(scores?: AptitudeScores) {
  return Object.fromEntries(aptitudes.map(({ id }) => [id, scores?.[id]?.toString() ?? ''])) as AptitudeInputs;
}

const { startingEgoFlex, maximumEgoFlex, cpPerExtraFlex } = coreCustomizationRules;
const flexOptions = Array.from({ length: maximumEgoFlex - startingEgoFlex + 1 }, (_, index) => startingEgoFlex + index);

interface DraftEditorProps {
  draft?: CharacterDraft;
  onCancel: () => void;
  onSaved: (draft: CharacterDraft) => void;
  onDirty: (dirty: boolean) => void;
  onSaving: (saving: boolean) => void;
}

export function DraftEditor({ draft, onCancel, onSaved, onDirty, onSaving }: DraftEditorProps) {
  const currentSleeve = activeSleeve(draft);
  const [name, setName] = useState(draft?.ego.name ?? '');
  const [pronouns, setPronouns] = useState(draft?.ego.pronouns ?? '');
  const [concept, setConcept] = useState(draft?.ego.concept ?? '');
  const [packages, setPackages] = useState<PackageSelections>(draft?.ego.packages ?? {});
  const [startingCampaign, setStartingCampaign] = useState(draft?.ego.startingCampaign);
  const [motivations, setMotivations] = useState(() => personalMotivationChoices(draft?.ego));
  const [artisticKnowFields, setArtisticKnowFields] = useState(draft?.ego.artisticKnowFields ?? []);
  const [skillTransfers, setSkillTransfers] = useState(draft?.ego.skillTransfers ?? []);
  const [skillPurchases, setSkillPurchases] = useState(draft?.ego.skillPurchases ?? []);
  const [specializations, setSpecializations] = useState(draft?.ego.specializations ?? []);
  const [traits, setTraits] = useState(draft?.ego.traits ?? []);
  const [inputs, setInputs] = useState(() => aptitudeInputs(draft?.ego.aptitudes));
  const [egoFlex, setEgoFlex] = useState<number>(draft?.ego.egoFlex ?? startingEgoFlex);
  const [languageText, setLanguageText] = useState(draft?.ego.languages?.join('\n') ?? '');
  const [repInputs, setRepInputs] = useState<ReputationInputs>(() =>
    Object.fromEntries(traceReputation(draft?.ego.reputation).map(({ id, score }) => [id, String(score)])));
  const [morphId, setMorphId] = useState(currentSleeve?.morphDefinitionId ?? '');
  const [issue, setIssue] = useState<{ id: Aptitude; message: string }>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const assignedMorph = findSampleMorph(currentSleeve?.morphDefinitionId);
  const startingMorph = findSampleMorph(draft?.sleeves[0]?.morphDefinitionId ?? morphId);
  const parsed = parseAptitudes(inputs);
  const parsedRep = parseReputation(repInputs);
  const personalMotivations = cleanPersonalMotivations(motivations);
  const { languages, hasDuplicates } = parseLanguages(languageText.split('\n'));
  const dirty = name !== (draft?.ego.name ?? '') || pronouns !== (draft?.ego.pronouns ?? '')
    || concept !== (draft?.ego.concept ?? '') || morphId !== (currentSleeve?.morphDefinitionId ?? '')
    || JSON.stringify(packages) !== JSON.stringify(draft?.ego.packages ?? {})
    || startingCampaign !== draft?.ego.startingCampaign
    || JSON.stringify(personalMotivations) !== JSON.stringify(cleanPersonalMotivations(personalMotivationChoices(draft?.ego)))
    || JSON.stringify(artisticKnowFields) !== JSON.stringify(draft?.ego.artisticKnowFields ?? [])
    || JSON.stringify(skillTransfers) !== JSON.stringify(draft?.ego.skillTransfers ?? [])
    || JSON.stringify(skillPurchases) !== JSON.stringify(draft?.ego.skillPurchases ?? [])
    || JSON.stringify(specializations) !== JSON.stringify(draft?.ego.specializations ?? [])
    || JSON.stringify(traits) !== JSON.stringify(draft?.ego.traits ?? [])
    || egoFlex !== (draft?.ego.egoFlex ?? startingEgoFlex)
    || JSON.stringify(languages) !== JSON.stringify(draft?.ego.languages ?? [])
    || reputationNetworks.some(({ id }) => (repInputs[id] ?? '') !== (draft?.ego.reputation?.[id]?.toString() ?? ''))
    || aptitudes.some(({ id }) => inputs[id] !== (draft?.ego.aptitudes[id]?.toString() ?? ''));

  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || conflict) return;
    const form = event.currentTarget;
    setIssue(parsed.issue);
    if (parsed.issue) {
      form.querySelector<HTMLInputElement>(`#aptitude-${parsed.issue.id}`)?.focus();
      return;
    }
    if (parsedRep.issue) {
      form.querySelector<HTMLInputElement>(`[name="reputation-${parsedRep.issue.id}"]`)?.focus();
      return;
    }

    setSaving(true);
    onSaving(true);
    setError('');
    try {
      const egoId = draft?.ego.id ?? crypto.randomUUID();
      const updatedAt = new Date().toISOString();
      const sleeves = draft?.sleeves ?? [];
      const savedPackages = cleanFactionMotivation(packages);
      const firstSleeve = !currentSleeve && morphId ? {
        id: crypto.randomUUID(),
        egoId,
        morphDefinitionId: morphId,
        assignedAt: updatedAt,
      } : undefined;
      const next: CharacterDraft = {
        schemaVersion: 2,
        rulesVersion: 'ep2-quick-start-2.4',
        revision: (draft?.revision ?? 0) + 1,
        updatedAt,
        ego: {
          id: egoId,
          name: name.trim(),
          pronouns: pronouns.trim(),
          concept: concept.trim(),
          aptitudes: parsed.scores,
          ...(egoFlex === startingEgoFlex ? {} : { egoFlex }),
          ...(languages.length ? { languages } : {}),
          ...(Object.keys(parsedRep.scores).length ? { reputation: parsedRep.scores } : {}),
          ...(Object.keys(savedPackages).length ? { packages: savedPackages } : {}),
          ...(startingCampaign ? { startingCampaign } : {}),
          ...(Object.keys(personalMotivations).length ? { personalMotivations } : {}),
          ...(artisticKnowFields.length ? { artisticKnowFields } : {}),
          ...(skillTransfers.length ? { skillTransfers } : {}),
          ...(skillPurchases.length ? { skillPurchases } : {}),
          ...(specializations.length ? { specializations } : {}),
          ...(traits.length ? { traits } : {}),
        },
        sleeves: firstSleeve ? [firstSleeve] : sleeves,
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
        <p>Start with identity, core packages, and aptitudes. You can save a draft before assigning a morph.</p>
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
            <CreationPackages packages={packages} onChange={setPackages} />
            <MotivationEditor packages={packages} choices={motivations} onChange={setMotivations} onFactionChange={(update) => {
              if (packages.faction) setPackages({ ...packages, faction: { ...packages.faction, ...update } });
            }} />
            <Card className="editor-panel">
              <h2>Aptitudes</h2>
              <p className="muted">You can save a partial draft. The budget below reports how your entries fit core character creation.</p>
              <AptitudeTemplatePicker onApply={(scores) => {
                setInputs(aptitudeInputs(scores));
                setIssue(undefined);
              }} />
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
            <ReputationEditor inputs={repInputs} issue={parsedRep.issue} onChange={setRepInputs} />
            <EgoTraitEditor choices={traits} onChange={setTraits} />
            <Card className="editor-panel">
              <h2>Customization</h2>
              <div className="identity-fields">
                <label>
                  Ego Flex
                  <select value={egoFlex} onChange={(event) => setEgoFlex(Number(event.target.value))}>
                    {flexOptions.map((flex) => <option key={flex} value={flex}>{flex} ({(flex - startingEgoFlex) * cpPerExtraFlex} CP)</option>)}
                  </select>
                </label>
                <label>
                  Languages
                  <textarea rows={3} value={languageText} onChange={(event) => setLanguageText(event.target.value)} aria-describedby="language-note" />
                </label>
                <p id="language-note" className="concept rules-note">
                  Enter one language per line. Each language above the free allowance costs {coreCustomizationRules.cpPerExtraLanguage} CP.
                  {hasDuplicates && ' Duplicate names count once and are saved as one entry.'}
                </p>
              </div>
              <AptitudeBudget
                scores={parsed.scores}
                skillPurchases={skillPurchases}
                egoFlex={egoFlex}
                languages={languages}
                reputation={parsedRep.scores}
                specializations={specializations}
                traits={traits}
                invalidReputation={Boolean(parsedRep.issue)}
              />
            </Card>
            <EgoDerivedStats stats={traceDerivedEgoStats({ aptitudes: parsed.scores ?? {}, traits })} styled />
            <StartingSkills
              ego={{ aptitudes: parsed.scores ?? {}, packages, artisticKnowFields, skillTransfers, skillPurchases, specializations, traits }}
              onTransfersChange={setSkillTransfers}
              onPurchasesChange={setSkillPurchases}
              onSpecializationsChange={setSpecializations}
              onTraitsChange={setTraits}
              onToggleArt={(field) => setArtisticKnowFields((fields) => (
                fields.includes(field) ? fields.filter((item) => item !== field) : [...fields, field]
              ))}
            />
            <StartingGearEditor campaign={startingCampaign} career={packages.career?.id}
              morphCategory={startingMorph?.category} onChange={setStartingCampaign} />
          </div>
          <Card className="editor-panel morph-picker">
            <h2>First morph</h2>
            {currentSleeve ? (
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
