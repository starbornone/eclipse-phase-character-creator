import { Fingerprint, Pencil, Printer } from 'lucide-react';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { findSampleMorph, quickStartPageUrl } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import { MorphIcon, MorphSource, MorphStats, QuickStartCredit } from './MorphCatalog.tsx';
import { Card } from './ui/card.tsx';

export function Dossier({ draft, onEdit }: { draft: CharacterDraft; onEdit: () => void }) {
  const morph = findSampleMorph(draft.sleeve?.morphDefinitionId);
  const values = traceAptitudeChecks(draft.ego.aptitudes);

  return (
    <article className="dossier">
      <header className="page-heading dossier-heading">
        <div>
          <p className="caption">Character dossier</p>
          <h1 tabIndex={-1}>{draft.ego.name || 'Untitled ego'}</h1>
          <p>{morph ? `Active sleeve · ${morph.name}` : draft.sleeve ? 'Unknown morph' : 'No morph assigned'}</p>
        </div>
        <div className="actions screen-only">
          <button type="button" className="button primary" onClick={onEdit}><Pencil size={17} aria-hidden="true" /> Edit ego</button>
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
            <p className="muted">{draft.sleeve ? 'This draft references a morph outside the current library.' : 'Assign a sample morph from the ego editor.'}</p>
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
      <p className="print-only rules-note"><QuickStartCredit /></p>
    </article>
  );
}
