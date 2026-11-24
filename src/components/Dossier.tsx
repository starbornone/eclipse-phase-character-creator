import { Fingerprint, Pencil, Printer, Repeat2 } from 'lucide-react';
import { activeSleeve } from '../features/sleeve/history.ts';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { findSampleMorph, quickStartPageUrl } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import { MorphIcon, MorphSource, MorphStats, QuickStartCredit } from './MorphCatalog.tsx';
import { Card } from './ui/card.tsx';

const dateLabel = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function SleeveHistory({ draft }: { draft: CharacterDraft }) {
  return (
    <section className="panel editor-panel sleeve-history screen-only" aria-labelledby="sleeve-history-title">
      <h2 id="sleeve-history-title">Sleeve history</h2>
      <ol>
        {[...draft.sleeves].reverse().map((sleeve, index) => {
          const profile = findSampleMorph(sleeve.morphDefinitionId);
          const { event } = sleeve;
          const date = event?.date || dateLabel.format(new Date(sleeve.assignedAt));
          return (
            <li key={sleeve.id}>
              <div className="sleeve-history-heading">
                <h3>{profile?.name ?? 'Unknown morph'}</h3>
                <span className="caption">{index === 0 ? 'Active' : 'Previous'}</span>
                <time dateTime={event?.date || sleeve.assignedAt}>{date}</time>
              </div>
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

export function Dossier({ draft, onEdit, onResleeve }: { draft: CharacterDraft; onEdit: () => void; onResleeve: () => void }) {
  const sleeve = activeSleeve(draft);
  const morph = findSampleMorph(sleeve?.morphDefinitionId);
  const values = traceAptitudeChecks(draft.ego.aptitudes);

  return (
    <article className="dossier">
      <header className="page-heading dossier-heading">
        <div>
          <p className="caption">Character dossier</p>
          <h1 tabIndex={-1}>{draft.ego.name || 'Untitled ego'}</h1>
          <p>{morph ? `Active sleeve · ${morph.name}` : sleeve ? 'Unknown morph' : 'No morph assigned'}</p>
        </div>
        <div className="actions screen-only">
          <button type="button" className="button primary" onClick={onEdit}><Pencil size={17} aria-hidden="true" /> Edit ego</button>
          {sleeve && <button type="button" className="button secondary" onClick={onResleeve}><Repeat2 size={17} aria-hidden="true" /> Resleeve</button>}
          <button type="button" className="button secondary" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Print dossier</button>
        </div>
      </header>
      <div className="dossier-grid">
        <Card className="editor-panel">
          <h2><Fingerprint size={21} aria-hidden="true" /> Ego</h2>
          <p><strong>{draft.ego.name || 'Untitled ego'}</strong>{draft.ego.pronouns && ` · ${draft.ego.pronouns}`}</p>
          <p className="concept-text muted">{draft.ego.concept || 'No concept recorded.'}</p>
        </Card>
        <Card className="editor-panel">
          <h2>Morph</h2>
          {morph ? (
            <>
              <div className="assigned-morph">
                <MorphIcon morph={morph} />
                <span><strong>{morph.name}</strong><span className="record-meta">{morph.category}</span></span>
              </div>
              <MorphStats morph={morph} />
              <MorphSource morph={morph} />
            </>
          ) : (
            <p className="muted">{sleeve ? 'This draft references a morph outside the current library.' : 'Assign a sample morph from the ego editor.'}</p>
          )}
        </Card>
      </div>
      <Card className="editor-panel dossier-stats">
        <h2>Aptitude checks</h2>
        <p className="muted">An aptitude check is the ego’s score multiplied by 3. <a href={quickStartPageUrl(6)}>Quick-Start Rules, p. 6</a></p>
        <table>
          <thead><tr><th scope="col">Aptitude</th><th scope="col">Ego score</th><th scope="col">Calculation</th><th scope="col">Check</th></tr></thead>
          <tbody>
            {values.map(({ id, label, base, multiplier, target }) => (
              <tr key={id}>
                <th scope="row">{label}</th>
                <td>{base ?? '—'}</td>
                <td>{base === undefined ? '—' : `${base} × ${multiplier}`}</td>
                <td><strong>{target ?? '—'}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {sleeve && <SleeveHistory draft={draft} />}
      <p className="print-only rules-note"><QuickStartCredit /></p>
    </article>
  );
}
