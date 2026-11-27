import { Download, Fingerprint, Pencil, Printer, Repeat2 } from 'lucide-react';
import { Link } from 'react-router';
import { egoPath } from '../app/paths.ts';
import { downloadBackup } from '../features/backup/backup.ts';
import { activeSleeve } from '../features/sleeve/history.ts';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { traceDerivedEgoStats } from '../rules/calculations/derived-stats.ts';
import { listStartingMotivations } from '../rules/calculations/motivations.ts';
import { tracePools } from '../rules/calculations/pools.ts';
import { startingGearForDraft } from '../rules/calculations/starting-gear.ts';
import { traceStartingEquipment } from '../rules/calculations/starting-equipment.ts';
import { startingMorphBudgetForDraft } from '../rules/calculations/starting-morph-budget.ts';
import { morphProfileForSleeve, traceIncludedMorphTraits } from '../rules/calculations/morph-traits.ts';
import { traceStartingPsi } from '../rules/calculations/psi.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { quickStartPageUrl } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import { CorePackageCredit, PackageSummary } from './CreationPackages.tsx';
import { EgoTraitSummary } from './EgoTraits.tsx';
import { EgoDerivedStats } from './EgoDerivedStats.tsx';
import { IncludedMorphWare, MorphIcon, MorphSource, MorphStats, QuickStartCredit } from './MorphProfile.tsx';
import { CharacterPools } from './CharacterPools.tsx';
import { MorphTraitSummary } from './MorphTraits.tsx';
import { IncludedMorphTraits } from './IncludedMorphTraits.tsx';
import { MotivationSummary } from './Motivations.tsx';
import { ReputationSummary } from './Reputation.tsx';
import { StartingSkills } from './StartingSkills.tsx';
import { StartingGearSummary } from './StartingGear.tsx';
import { StartingEquipmentSummary } from './StartingEquipment.tsx';
import { StartingMorphBudgetSummary } from './StartingMorphBudget.tsx';
import { StartingPsiSection } from './StartingPsi.tsx';
import { Card } from './ui/card.tsx';
import { AptitudeCheckCalculation } from './AptitudeCheckCalculation.tsx';

const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function SleeveHistory({ draft }: { draft: CharacterDraft }) {
  return (
    <section className="panel editor-panel sleeve-history screen-only" aria-labelledby="sleeve-history-title">
      <h2 id="sleeve-history-title">Sleeve history</h2>
      <ol>
        {[...draft.sleeves].reverse().map((sleeve, index) => {
          const { morph: profile, entries } = morphProfileForSleeve(sleeve);
          const { event } = sleeve;
          const date = event?.date || dateLabel.format(new Date(sleeve.assignedAt));
          return (
            <li key={sleeve.id}>
              <div className="sleeve-history-heading">
                <h3>{profile?.name ?? 'Unknown morph'}</h3>
                <span className="caption">{index === 0 ? 'Active' : 'Previous'}</span>
                <time dateTime={event?.date || sleeve.assignedAt}>{date}</time>
              </div>
              {index > 0 && (
                <>
                  <IncludedMorphTraits entries={traceIncludedMorphTraits(profile)} />
                  <MorphTraitSummary entries={entries} />
                </>
              )}
              {event && (
                <>
                  {event.location && <p className="muted">Location <strong>{event.location}</strong></p>}
                  {event.cause && <p className="muted">Cause <strong>{event.cause}</strong></p>}
                  {event.notes && <p className="concept-text">{event.notes}</p>}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Dossier({ draft }: { draft: CharacterDraft }) {
  const egoId = draft.ego.id;
  const sleeve = activeSleeve(draft);
  const profile = morphProfileForSleeve(sleeve);
  const { morph, entries: activeMorphTraits } = profile;
  const morphBudget = startingMorphBudgetForDraft(draft);
  const values = traceAptitudeChecks(draft.ego.aptitudes, draft.ego.traits, profile);

  return (
    <article className="dossier">
      <header className="page-heading dossier-heading">
        <div>
          <p className="caption">Character dossier</p>
          <h1 tabIndex={-1}>{draft.ego.name || 'Untitled ego'}</h1>
          <p>{morph ? `Active sleeve · ${morph.name}` : sleeve ? 'Unknown morph' : 'No morph assigned'}</p>
        </div>
        <div className="actions screen-only">
          <Link className="button primary" to={egoPath(egoId, 'edit')}><Pencil size={17} aria-hidden="true" /> Edit ego</Link>
          {sleeve && <Link className="button secondary" to={egoPath(egoId, 'resleeve')}><Repeat2 size={17} aria-hidden="true" /> Resleeve</Link>}
          <Link className="button secondary" to={egoPath(egoId, 'print')}><Printer size={17} aria-hidden="true" /> Print dossier</Link>
          <button type="button" className="button secondary" aria-describedby="backup-content-note" onClick={() => downloadBackup([draft], 'eclipse-phase-ego.json')}>
            <Download size={17} aria-hidden="true" /> Export JSON
          </button>
        </div>
      </header>
      <p className="rules-note screen-only dossier-backup-note" id="backup-content-note">JSON backups include all saved fields, including sleeve notes.</p>
      <div className="dossier-grid">
        <Card className="editor-panel">
          <h2><Fingerprint size={21} aria-hidden="true" /> Ego</h2>
          <p><strong>{draft.ego.name || 'Untitled ego'}</strong>{draft.ego.pronouns && ` · ${draft.ego.pronouns}`}</p>
          <p className="concept-text muted">{draft.ego.concept || 'No concept recorded.'}</p>
          <p>Ego Flex <strong>{draft.ego.egoFlex ?? coreCustomizationRules.startingEgoFlex}</strong></p>
          {Boolean(draft.ego.languages?.length) && <p className="concept-text">Languages <strong>{draft.ego.languages?.join(', ')}</strong></p>}
          <PackageSummary packages={draft.ego.packages} />
          {draft.ego.packages && <CorePackageCredit />}
          <MotivationSummary motivations={listStartingMotivations(draft.ego)} />
          <ReputationSummary scores={draft.ego.reputation} />
          <EgoTraitSummary choices={draft.ego.traits} />
          <StartingPsiSection psi={traceStartingPsi(draft.ego)} />
        </Card>
        <Card className="editor-panel">
          <h2>Morph</h2>
          {morph ? (
            <>
              <div className="assigned-morph">
                <MorphIcon morph={morph} />
                <span><strong>{morph.name}</strong><span className="record-meta">{morph.category}</span></span>
              </div>
              <MorphStats morph={morph} showPools={false} />
              <CharacterPools pools={tracePools(morph, draft.ego, morphBudget.temporaryFlex)} />
              <MorphSource morph={morph} />
              <IncludedMorphWare morph={morph} />
              <IncludedMorphTraits entries={traceIncludedMorphTraits(morph)} />
              <MorphTraitSummary entries={activeMorphTraits} />
            </>
          ) : (
            <p className="muted">{sleeve ? 'This draft references a morph outside the current library.' : 'Assign a sample morph from the ego editor.'}</p>
          )}
          <StartingMorphBudgetSummary budget={morphBudget} />
        </Card>
      </div>
      <Card className="editor-panel dossier-stats">
        <h2>Aptitude checks</h2>
        <p className="muted">Aptitude checks multiply the ego’s score by 3, then add modifiers from the ego and active sleeve. <a href={quickStartPageUrl(6)}>Quick-Start Rules, p. 6</a></p>
        <table>
          <thead><tr><th scope="col">Aptitude</th><th scope="col">Ego score</th><th scope="col">Calculation</th><th scope="col">Check</th></tr></thead>
          <tbody>
            {values.map((check) => (
              <tr key={check.id}>
                <th scope="row">{check.label}</th>
                <td>{check.base ?? '—'}</td>
                <td><AptitudeCheckCalculation check={check} /></td>
                <td><strong>{check.target ?? '—'}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <EgoDerivedStats stats={traceDerivedEgoStats(draft.ego)} styled />
      <div className="screen-only dossier-starting-skills"><StartingSkills ego={draft.ego} /></div>
      <StartingGearSummary gear={startingGearForDraft(draft)} styled />
      <StartingEquipmentSummary items={traceStartingEquipment(draft.ego.startingEquipment)} styled />
      {sleeve && <SleeveHistory draft={draft} />}
      <p className="print-only rules-note"><QuickStartCredit /></p>
    </article>
  );
}
