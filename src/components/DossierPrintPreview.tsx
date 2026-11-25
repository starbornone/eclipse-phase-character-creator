import { Printer } from 'lucide-react';
import { useState } from 'react';
import { buildPrintableDossier, privatePrintFields } from '../features/dossier/print.ts';
import type { PrintAudience, PrivatePrintField } from '../features/dossier/print.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { quickStartPageUrl } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import { CorePackageCredit, PackageSummary } from './CreationPackages.tsx';
import { MorphSource, MorphStats, QuickStartCredit } from './MorphCatalog.tsx';
import { ReputationSummary } from './Reputation.tsx';

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
                {dossier.checks.map(({ id, label, base, multiplier, target }) => (
                  <tr key={id}>
                    <th scope="row">{label}</th>
                    <td>{base ?? '—'}</td>
                    <td>{base === undefined ? '—' : `${base} × ${multiplier}`}</td>
                    <td>{target ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <dl className="print-checks">
              {dossier.checks.map(({ id, label, target }) => <div key={id}><dt>{label}</dt><dd>{target ?? '—'}</dd></div>)}
            </dl>
          )}
          <p className="rules-note"><a href={quickStartPageUrl(6)}>Quick-Start Rules, p. 6</a></p>
        </section>
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
