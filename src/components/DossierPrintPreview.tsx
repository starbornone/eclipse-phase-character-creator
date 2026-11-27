import { Printer } from 'lucide-react';
import { useState } from 'react';
import { buildPrintableDossier, privatePrintFields } from '../features/dossier/print.ts';
import type { PrintAudience, PrivatePrintField } from '../features/dossier/print.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';
import { quickStartPageUrl } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import { CorePackageCredit, PackageSummary } from './CreationPackages.tsx';
import { EgoTraitSummary } from './EgoTraits.tsx';
import { EgoDerivedStats } from './EgoDerivedStats.tsx';
import { MorphSource, MorphStats, QuickStartCredit } from './MorphCatalog.tsx';
import { AptitudeCheckCalculation } from './AptitudeCheckCalculation.tsx';
import { SkillTestModifiers } from './SkillTestModifiers.tsx';
import { egoTraitsSource } from '../rules/datasets/ego-traits.ts';
import { MotivationSummary } from './Motivations.tsx';
import { ReputationSummary } from './Reputation.tsx';
import { SkillSpecializations } from './SkillSpecializations.tsx';
import { StartingGearSummary } from './StartingGear.tsx';

const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function DossierPrintPreview({ draft, onBack }: { draft: CharacterDraft; onBack: () => void }) {
  const [audience, setAudience] = useState<PrintAudience>('player');
  const [includedFields, setIncludedFields] = useState<PrivatePrintField[]>([]);
  const isPlayer = audience === 'player';
  const dossier = buildPrintableDossier(draft, audience, includedFields);

  function chooseAudience(next: PrintAudience) {
    setAudience(next);
    setIncludedFields([]);
  }

  function toggleField(field: PrivatePrintField) {
    setIncludedFields((fields) => fields.includes(field) ? fields.filter((item) => item !== field) : [...fields, field]);
  }

  return (
    <>
      <header className="page-heading screen-only">
        <h1 tabIndex={-1}>Print preview</h1>
        <p>Review the dossier before printing or saving a PDF through your browser.</p>
      </header>
      <div className="panel editor-panel print-options screen-only">
        <fieldset>
          <legend>Print layout</legend>
          <label><input type="radio" name="print-layout" checked={isPlayer} onChange={() => chooseAudience('player')} /> Player dossier</label>
          <label><input type="radio" name="print-layout" checked={!isPlayer} onChange={() => chooseAudience('gm')} /> GM summary</label>
        </fieldset>
        {!isPlayer && dossier.history.length > 0 && (
          <fieldset>
            <legend>Include private sleeve details</legend>
            {privatePrintFields.map(({ id, label }) => (
              <label key={id}>
                <input type="checkbox" checked={includedFields.includes(id)} onChange={() => toggleField(id)} /> {label}
              </label>
            ))}
          </fieldset>
        )}
        <div className="actions">
          <button type="button" className="button primary" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Print / Save PDF</button>
          <button type="button" className="button secondary" onClick={onBack}>Back to dossier</button>
        </div>
      </div>
      <article className={`print-sheet ${isPlayer ? 'print-player' : 'print-gm'}`} aria-labelledby="print-sheet-title">
        <header>
          <p className="caption">{isPlayer ? 'Player dossier' : 'GM summary'}</p>
          <h2 id="print-sheet-title">{dossier.name}</h2>
          {dossier.pronouns && <p>{dossier.pronouns}</p>}
        </header>
        {isPlayer && dossier.concept && (
          <section>
            <h3>Ego concept</h3>
            <p className="concept-text">{dossier.concept}</p>
          </section>
        )}
        {dossier.packages && (
          <section>
            <h3>Creation packages</h3>
            <PackageSummary packages={dossier.packages} />
            <CorePackageCredit />
          </section>
        )}
        <MotivationSummary motivations={dossier.motivations} />
        <section>
          <h3>Active morph</h3>
          {dossier.morph ? (
            <>
              <p><strong>{dossier.morph.name}</strong> · {dossier.morph.category}</p>
              <MorphStats morph={dossier.morph} />
              <MorphSource morph={dossier.morph} />
            </>
          ) : <p>{dossier.hasSleeve ? 'Unknown morph' : 'No morph assigned'}</p>}
        </section>
        <section>
          <h3>Ego aptitude checks</h3>
          {isPlayer ? (
            <table>
              <thead><tr><th scope="col">Aptitude</th><th scope="col">Score</th><th scope="col">Calculation</th><th scope="col">Check</th></tr></thead>
              <tbody>
                {dossier.checks.map((check) => (
                  <tr key={check.id}>
                    <th scope="row">{check.label}</th>
                    <td>{check.base ?? '—'}</td>
                    <td><AptitudeCheckCalculation check={check} /></td>
                    <td>{check.target ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <dl className="print-checks">
              {dossier.checks.map((check) => (
                <div key={check.id}>
                  <dt>{check.label}</dt>
                  <dd>{check.target ?? '—'}{check.modifiers.length > 0 && <span className="skill-grant muted"><AptitudeCheckCalculation check={check} /></span>}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="rules-note"><a href={quickStartPageUrl(6)}>Quick-Start Rules, p. 6</a></p>
          {dossier.checks.some(({ modifier }) => modifier !== 0) && <p className="rules-note">Check modifiers: <a href={egoTraitsSource}>Core ego trait rules</a>.</p>}
        </section>
        <EgoDerivedStats stats={dossier.derivedStats} headingLevel={3} />
        <section>
          <h3>Ego Flex and languages</h3>
          <p>Ego Flex <strong>{dossier.egoFlex}</strong></p>
          {dossier.languages.length > 0 && <p className="concept-text">Languages <strong>{dossier.languages.join(', ')}</strong></p>}
          <p className="rules-note">
            <a href={coreCustomizationRules.flexUrl}>Core Flex rules</a>
            {dossier.languages.length > 0 && <> · <a href={coreCustomizationRules.languagesUrl}>Core language rules</a></>}
          </p>
        </section>
        <ReputationSummary scores={dossier.reputation} />
        <EgoTraitSummary choices={dossier.traits} />
        <section className="print-skills">
          <h3>Ego skills</h3>
          {dossier.skillLedger.unassignedKnowPoints > 0 && <p>{dossier.skillLedger.unassignedKnowPoints} Know points await a field choice.</p>}
          {dossier.skillLedger.unassignedActivePoints > 0 && <p>{dossier.skillLedger.unassignedActivePoints} Active points await a skill or field choice.</p>}
          {dossier.skillLedger.skills.length > 0 ? (
            <table>
              <thead><tr><th scope="col">Skill</th><th scope="col">Points</th><th scope="col">Aptitude base</th><th scope="col">Total</th></tr></thead>
              <tbody>
                {dossier.skillLedger.skills.map(({ id, name, allocatedPoints, purchasedPoints, aptitude, aptitudeScore, multiplier, base, total, excess, cap, testTarget, testModifiers }) => (
                  <tr key={id}>
                    <th scope="row">{name}</th>
                    <td>{allocatedPoints + purchasedPoints}</td>
                    <td>{aptitude?.toUpperCase() ?? '—'} {base === undefined ? 'pending' : `${aptitudeScore} × ${multiplier} = ${base}`}</td>
                    <td>
                      <strong>{total ?? 'Pending'}</strong>
                      {excess > 0 && <span className="skill-grant error">{excess} over {cap}</span>}
                      <SkillTestModifiers total={total} testTarget={testTarget} testModifiers={testModifiers} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p>No skills recorded.</p>}
          {dossier.skillLedger.transferResults.filter(({ issue }) => issue).map(({ issue }, index) => <p key={`transfer-${index}`} className="error">Transfer needs review: {issue}</p>)}
          {dossier.skillLedger.purchaseResults.filter(({ issue }) => issue).map(({ issue }, index) => <p key={`purchase-${index}`} className="error">Purchase needs review: {issue}</p>)}
          <p className="rules-note">Totals add allocated and purchased points to the linked aptitude base. Pending totals need an aptitude. Review over-cap totals before play. <a href={coreAptitudeRules.coreBookUrl}>Core rulebook, pp. 45 and 48–50</a></p>
        </section>
        <SkillSpecializations entries={dossier.specializations} />
        <StartingGearSummary gear={dossier.startingGear} />
        {dossier.history.length > 0 && (
          <section className="print-history">
            <h3>Sleeve history</h3>
            <ol>
              {dossier.history.map(({ id, morphName, active, date, location, cause, notes }) => (
                <li key={id}>
                  <h4>{morphName} <span>· {active ? 'Active' : 'Previous'}</span></h4>
                  {date && <p><time dateTime={date}>{date.includes('T') ? dateLabel.format(new Date(date)) : date}</time></p>}
                  {location && <p>Location <strong>{location}</strong></p>}
                  {cause && <p>Cause <strong>{cause}</strong></p>}
                  {notes && <p className="concept-text">{notes}</p>}
                </li>
              ))}
            </ol>
          </section>
        )}
        <p className="rules-note print-credit"><QuickStartCredit /></p>
      </article>
    </>
  );
}
