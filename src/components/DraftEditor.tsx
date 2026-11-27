import { Fingerprint, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { evaluateAptitudeBudget, parseLanguages } from '../rules/calculations/aptitude-budget.ts';
import { reviewCreation } from '../rules/calculations/creation-review.ts';
import { activeSleeve } from '../features/sleeve/history.ts';
import { DraftConflictError, saveDraft } from '../lib/storage/drafts.ts';
import { parseAptitudes } from '../rules/calculations/draft.ts';
import { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { cleanFactionMotivation, cleanPersonalMotivations, personalMotivationChoices } from '../rules/calculations/motivations.ts';
import { tracePools } from '../rules/calculations/pools.ts';
import { parseReputation, traceReputation } from '../rules/calculations/reputation.ts';
import { deriveStartingGear } from '../rules/calculations/starting-gear.ts';
import { calculateStartingSkills } from '../rules/calculations/starting-skills.ts';
import { evaluateStartingMorphBudget, isStartingMorphAllowance, parseStartingMorphAllowance } from '../rules/calculations/starting-morph-budget.ts';
import { evaluateMorphTraits } from '../rules/calculations/morph-traits.ts';
import { isUnknownHardening } from '../rules/calculations/ego-traits.ts';
import { traceStartingPsi } from '../rules/calculations/psi.ts';
import type { ReputationInputs } from '../rules/calculations/reputation.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { reputationNetworks } from '../rules/datasets/reputation.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import { aptitudes } from '../types/character.ts';
import type { Aptitude, AptitudeInputs, AptitudeScores, CharacterDraft, CreationPackages as PackageSelections, Sleeve } from '../types/character.ts';
import { AptitudeBudget, AptitudeTemplatePicker } from './AptitudeBudget.tsx';
import { CreationPackages } from './CreationPackages.tsx';
import { CreationReview } from './CreationReview.tsx';
import { EgoTraitEditor } from './EgoTraits.tsx';
import { EgoDerivedStats } from './EgoDerivedStats.tsx';
import { IncludedMorphWare, MorphIcon, MorphSource, MorphStats } from './MorphProfile.tsx';
import { CharacterPools } from './CharacterPools.tsx';
import { MorphTraitEditor } from './MorphTraits.tsx';
import { MotivationEditor } from './Motivations.tsx';
import { ReputationEditor } from './Reputation.tsx';
import { StartingSkills } from './StartingSkills.tsx';
import { StartingGearEditor } from './StartingGear.tsx';
import { StartingEquipmentEditor } from './StartingEquipment.tsx';
import { StartingPsiSection } from './StartingPsi.tsx';
import { StartingMorphBudgetSummary } from './StartingMorphBudget.tsx';
import { Card } from './ui/card.tsx';

function aptitudeInputs(scores?: AptitudeScores) {
  return Object.fromEntries(aptitudes.map(({ id }) => [id, scores?.[id]?.toString() ?? ''])) as AptitudeInputs;
}

const { startingEgoFlex, maximumEgoFlex, cpPerExtraFlex } = coreCustomizationRules;
const flexOptions = Array.from({ length: maximumEgoFlex - startingEgoFlex + 1 }, (_, index) => startingEgoFlex + index);

interface DraftEditorProps {
  draft?: CharacterDraft;
  initialMorphId?: string;
  onCancel: () => void;
  onSaved: (draft: CharacterDraft) => void;
  onDirty: (dirty: boolean) => void;
  onSaving: (saving: boolean) => void;
}

export function DraftEditor({ draft, initialMorphId, onCancel, onSaved, onDirty, onSaving }: DraftEditorProps) {
  const currentSleeve = activeSleeve(draft);
  const assignedFirstSleeve = draft?.sleeves[0];
  const [name, setName] = useState(draft?.ego.name ?? '');
  const [pronouns, setPronouns] = useState(draft?.ego.pronouns ?? '');
  const [concept, setConcept] = useState(draft?.ego.concept ?? '');
  const [packages, setPackages] = useState<PackageSelections>(draft?.ego.packages ?? {});
  const [startingCampaign, setStartingCampaign] = useState(draft?.ego.startingCampaign);
  const [useInfomorphPack, setUseInfomorphPack] = useState(draft?.ego.startingInfomorphPack ?? false);
  const [gearSwaps, setGearSwaps] = useState(draft?.ego.startingGearSwaps ?? []);
  const [equipment, setEquipment] = useState(draft?.ego.startingEquipment ?? []);
  const [motivations, setMotivations] = useState(() => personalMotivationChoices(draft?.ego));
  const [artisticKnowFields, setArtisticKnowFields] = useState(draft?.ego.artisticKnowFields ?? []);
  const [skillTransfers, setSkillTransfers] = useState(draft?.ego.skillTransfers ?? []);
  const [skillPurchases, setSkillPurchases] = useState(draft?.ego.skillPurchases ?? []);
  const [specializations, setSpecializations] = useState(draft?.ego.specializations ?? []);
  const [traits, setTraits] = useState(draft?.ego.traits ?? []);
  const [psi, setPsi] = useState(draft?.ego.psi);
  const [psiSleightPurchases, setPsiSleightPurchases] = useState(draft?.ego.psiSleightPurchases ?? []);
  const [inputs, setInputs] = useState(() => aptitudeInputs(draft?.ego.aptitudes));
  const [egoFlex, setEgoFlex] = useState<number>(draft?.ego.egoFlex ?? startingEgoFlex);
  const [languageText, setLanguageText] = useState(draft?.ego.languages?.join('\n') ?? '');
  const [repInputs, setRepInputs] = useState<ReputationInputs>(() =>
    Object.fromEntries(traceReputation(draft?.ego.reputation).map(({ id, score }) => [id, String(score)])));
  const [morphId, setMorphId] = useState(currentSleeve?.morphDefinitionId ?? initialMorphId ?? '');
  const [morphTraits, setMorphTraits] = useState(assignedFirstSleeve?.morphTraits ?? []);
  const [morphAllowance, setMorphAllowance] = useState(draft?.ego.startingMorphPoints?.toString() ?? '');
  const [issue, setIssue] = useState<{ id: Aptitude; message: string }>();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const startingMorph = findSampleMorph(assignedFirstSleeve?.morphDefinitionId ?? morphId);
  const { entries: appliedMorphTraits, bonus: morphTraitBonus } = evaluateMorphTraits(startingMorph, morphTraits);
  const startingPsi = traceStartingPsi({ packages, traits, psi, psiSleightPurchases });
  const parsed = parseAptitudes(inputs);
  const parsedRep = parseReputation(repInputs);
  const { allowance, issue: allowanceInputIssue } = parseStartingMorphAllowance(morphAllowance);
  const morphAllowanceIssue = allowanceInputIssue ?? (allowance !== undefined && !isStartingMorphAllowance(allowance, morphTraitBonus)
    ? 'Enter a smaller allowance to include the selected morph trait bonuses.' : undefined);
  const personalMotivations = cleanPersonalMotivations(motivations);
  const { languages, hasDuplicates } = parseLanguages(languageText.split('\n'));
  const customizationBudget = parsed.scores && evaluateAptitudeBudget(parsed.scores, skillPurchases, {
    egoFlex, languages, reputation: parsedRep.scores, specializations, traits, psi, psiSleightPurchases,
  });
  const morphBudget = morphAllowanceIssue ? undefined : evaluateStartingMorphBudget(
    { startingMorphPoints: allowance, traits, startingEquipment: equipment },
    startingMorph, (draft?.sleeves.length ?? 0) > 1, morphTraits,
  );
  const skillInputs = { aptitudes: parsed.scores ?? {}, packages, artisticKnowFields, skillTransfers, skillPurchases, specializations, traits };
  const skillLedger = calculateStartingSkills(skillInputs);
  const startingGear = deriveStartingGear(startingCampaign, packages.career?.id, startingMorph?.category, gearSwaps, useInfomorphPack);
  const reviewIssues = reviewCreation({
    aptitudeInput: parsed, reputationInput: parsedRep, morphAllowanceIssue, packages, customizationBudget,
    ego: { languages, personalMotivations, specializations, startingCampaign, traits }, startingGear,
    discardedGearSwaps: gearSwaps.length - startingGear.appliedSwaps.length,
    startingMorph, hasFirstSleeve: Boolean(assignedFirstSleeve || morphId), morphBudget, startingPsi, skills: skillLedger,
  });
  const dirty = name !== (draft?.ego.name ?? '') || pronouns !== (draft?.ego.pronouns ?? '')
    || concept !== (draft?.ego.concept ?? '') || morphId !== (currentSleeve?.morphDefinitionId ?? '')
    || morphAllowance !== (draft?.ego.startingMorphPoints?.toString() ?? '')
    || JSON.stringify(morphTraits) !== JSON.stringify(assignedFirstSleeve?.morphTraits ?? [])
    || JSON.stringify(packages) !== JSON.stringify(draft?.ego.packages ?? {})
    || startingCampaign !== draft?.ego.startingCampaign
    || useInfomorphPack !== (draft?.ego.startingInfomorphPack ?? false)
    || JSON.stringify(gearSwaps) !== JSON.stringify(draft?.ego.startingGearSwaps ?? [])
    || JSON.stringify(equipment) !== JSON.stringify(draft?.ego.startingEquipment ?? [])
    || JSON.stringify(personalMotivations) !== JSON.stringify(cleanPersonalMotivations(personalMotivationChoices(draft?.ego)))
    || JSON.stringify(artisticKnowFields) !== JSON.stringify(draft?.ego.artisticKnowFields ?? [])
    || JSON.stringify(skillTransfers) !== JSON.stringify(draft?.ego.skillTransfers ?? [])
    || JSON.stringify(skillPurchases) !== JSON.stringify(draft?.ego.skillPurchases ?? [])
    || JSON.stringify(specializations) !== JSON.stringify(draft?.ego.specializations ?? [])
    || JSON.stringify(traits) !== JSON.stringify(draft?.ego.traits ?? [])
    || JSON.stringify(psi) !== JSON.stringify(draft?.ego.psi)
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
    if (morphAllowanceIssue) {
      form.querySelector<HTMLInputElement>('#starting-morph-allowance')?.focus();
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
      const savedTraits = startingPsi.level ? traits : traits.filter((choice) => !isUnknownHardening(choice));
      const { appliedSwaps, usesInfomorphPack } = startingGear;
      const firstSleeve: Sleeve | undefined = assignedFirstSleeve ? { ...assignedFirstSleeve } : morphId ? {
        id: crypto.randomUUID(),
        egoId,
        morphDefinitionId: morphId,
        assignedAt: updatedAt,
      } : undefined;
      if (firstSleeve) {
        if (appliedMorphTraits.length) {
          firstSleeve.morphTraits = appliedMorphTraits.map(({ id, level }) => ({ id, level }));
        } else {
          delete firstSleeve.morphTraits;
        }
      }
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
          ...(allowance === undefined ? {} : { startingMorphPoints: allowance }),
          ...(startingCampaign ? { startingCampaign } : {}),
          ...(usesInfomorphPack ? { startingInfomorphPack: true } : {}),
          ...(appliedSwaps.length ? { startingGearSwaps: appliedSwaps } : {}),
          ...(equipment.length ? { startingEquipment: equipment } : {}),
          ...(Object.keys(personalMotivations).length ? { personalMotivations } : {}),
          ...(artisticKnowFields.length ? { artisticKnowFields } : {}),
          ...(skillTransfers.length ? { skillTransfers } : {}),
          ...(skillPurchases.length ? { skillPurchases } : {}),
          ...(specializations.length ? { specializations } : {}),
          ...(savedTraits.length ? { traits: savedTraits } : {}),
          ...(startingPsi.selection ? { psi: startingPsi.selection } : {}),
          ...(startingPsi.purchasedNames.length ? { psiSleightPurchases: startingPsi.purchasedNames } : {}),
        },
        sleeves: firstSleeve ? [firstSleeve, ...sleeves.slice(1)] : sleeves,
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
      <CreationReview issues={reviewIssues} />
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
              <h2 id="creation-aptitudes-title" className="creation-review-target" tabIndex={-1}>Aptitudes</h2>
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
            <StartingPsiSection psi={startingPsi} onChange={setPsi}
              onPurchaseChange={(name, selected) => setPsiSleightPurchases((current) => (
                selected ? [...current, name] : current.filter((purchase) => purchase !== name)
              ))}
              discardedSleight={Boolean(psi?.freeSleight && !startingPsi.freeSleight)} />
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
                  <textarea id="creation-languages" rows={3} value={languageText} onChange={(event) => setLanguageText(event.target.value)} aria-describedby="language-note" />
                </label>
                <p id="language-note" className="concept rules-note">
                  Enter one language per line. Each language above the free allowance costs {coreCustomizationRules.cpPerExtraLanguage} CP.
                  {hasDuplicates && ' Duplicate names count once and are saved as one entry.'}
                </p>
              </div>
              <AptitudeBudget budget={parsedRep.issue ? undefined : customizationBudget} />
            </Card>
            <EgoDerivedStats stats={traceDerivedEgoStats({ aptitudes: parsed.scores ?? {}, traits })} styled />
            <StartingSkills
              ego={skillInputs}
              ledger={skillLedger}
              onTransfersChange={setSkillTransfers}
              onPurchasesChange={setSkillPurchases}
              onSpecializationsChange={setSpecializations}
              onTraitsChange={setTraits}
              onToggleArt={(field) => setArtisticKnowFields((fields) => (
                fields.includes(field) ? fields.filter((item) => item !== field) : [...fields, field]
              ))}
            />
            <StartingGearEditor campaign={startingCampaign} gear={startingGear}
              morphCategory={startingMorph?.category} swaps={gearSwaps} useInfomorphPack={useInfomorphPack}
              onChange={setStartingCampaign} onSwapsChange={setGearSwaps} onInfomorphPackChange={setUseInfomorphPack} />
            <StartingEquipmentEditor purchases={equipment} onChange={setEquipment} />
          </div>
          <Card className="editor-panel morph-picker">
            <h2 id="creation-first-morph-title" className="creation-review-target" tabIndex={-1}>First morph</h2>
            <div className="identity-fields">
              <label className="concept">
                GM allowance (MP)
                <input id="starting-morph-allowance" inputMode="numeric" placeholder={String(startingMorphBudgetRules.defaultAllowance)}
                  value={morphAllowance} aria-invalid={Boolean(morphAllowanceIssue) || undefined}
                  aria-describedby={morphAllowanceIssue ? 'morph-allowance-issue' : 'morph-allowance-default'}
                  onChange={(event) => setMorphAllowance(event.target.value)} />
              </label>
            </div>
            <p className="rules-note" id="morph-allowance-default">Leave blank to use the default {startingMorphBudgetRules.defaultAllowance} MP.</p>
            {morphAllowanceIssue && <p className="error" role="alert" id="morph-allowance-issue">{morphAllowanceIssue}</p>}
            {assignedFirstSleeve ? (
              <>
                <p className="muted">This ego's first sleeve is assigned.</p>
                <div className="assigned-morph">
                  {startingMorph && <MorphIcon morph={startingMorph} />}
                  <strong>{startingMorph?.name ?? 'Unknown morph'}</strong>
                </div>
                {startingMorph && <MorphSource morph={startingMorph} />}
              </>
            ) : (
              <fieldset>
                <legend className="muted">Choose a starting morph. You can leave this open while drafting.</legend>
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
            {startingMorph && <IncludedMorphWare morph={startingMorph} />}
            <CharacterPools pools={tracePools(startingMorph, { egoFlex }, morphBudget?.temporaryFlex)} />
            <MorphTraitEditor key={startingMorph?.id} morph={startingMorph} choices={morphTraits}
              aptitudes={parsed.scores} egoTraits={traits} onChange={setMorphTraits} />
            {morphBudget && <StartingMorphBudgetSummary budget={morphBudget} live />}
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
