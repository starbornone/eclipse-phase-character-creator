import { ChevronRight, Download, Fingerprint, Layers3 } from 'lucide-react';
import { Link } from 'react-router';
import { egoPath } from '../app/paths.ts';
import { downloadBackup } from '../features/backup/backup.ts';
import { activeSleeve } from '../features/sleeve/history.ts';
import { findSampleMorph, sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import { MorphIcon } from './MorphProfile.tsx';
import { Card } from './ui/card.tsx';

interface DashboardProps {
  drafts: CharacterDraft[];
  loading: boolean;
  loadError: boolean;
  onRetry: () => void;
}

const editedDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

export function Dashboard({ drafts, loading, loadError, onRetry }: DashboardProps) {
  return (
    <>
      <section className="hero" aria-labelledby="dashboard-title">
        <div className="hero-content">
          <p className="caption">Eclipse Phase · Second Edition</p>
          <h1 id="dashboard-title" tabIndex={-1}>Character<br />&amp; Morph Creator</h1>
          <p>Build an ego, choose a morph, and see how they come together in a sleeve.</p>
        </div>
      </section>
      <div className="dashboard-grid">
        <section aria-labelledby="my-egos">
          <div className="section-heading">
            <h2 id="my-egos">My egos</h2>
            {!loading && !loadError && <span className="caption">{drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}</span>}
          </div>
          <Card>
            {loading && <p className="panel-message" role="status">Loading your drafts…</p>}
            {loadError && (
              <div className="panel-message">
                <p role="alert">Your saved drafts could not be opened. Check that this browser allows local storage.</p>
                <button type="button" className="button secondary" onClick={onRetry}>Retry</button>
              </div>
            )}
            {!loading && !loadError && drafts.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true"><Fingerprint size={27} /></span>
                <h3>No egos yet</h3>
                <p>An ego is your character’s mind and identity. A morph is the body they inhabit.</p>
              </div>
            )}
            {drafts.length > 0 && (
              <ul className="record-list">
                {drafts.map((draft) => {
                  const sleeve = activeSleeve(draft);
                  const morph = findSampleMorph(sleeve?.morphDefinitionId);
                  return (
                    <li key={draft.ego.id}>
                      <Link className="record-row" to={egoPath(draft.ego.id)}>
                        <span className="empty-icon" aria-hidden="true"><Fingerprint size={21} /></span>
                        <span>
                          <strong>{draft.ego.name || 'Untitled ego'}</strong>
                          <span className="record-meta">{morph?.name ?? (sleeve ? 'Unknown morph' : 'No morph assigned')}</span>
                        </span>
                        <time dateTime={draft.updatedAt}>{editedDate.format(new Date(draft.updatedAt))}</time>
                        <ChevronRight size={17} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          {drafts.length > 0 && (
            <div className="actions">
              <button type="button" className="button secondary" aria-describedby="backup-content-note" onClick={() => downloadBackup(drafts, 'eclipse-phase-drafts.json')}>
                <Download size={17} aria-hidden="true" /> Export all drafts
              </button>
            </div>
          )}
          <p className="storage-note"><Layers3 size={16} aria-hidden="true" /> Drafts are saved in this browser.</p>
          {drafts.length > 0 && <p className="rules-note" id="backup-content-note">JSON backups include all saved fields, including sleeve notes.</p>}
        </section>
        <section aria-labelledby="morph-preview">
          <div className="section-heading">
            <h2 id="morph-preview">Morph library</h2>
            <Link className="text-button" to="/morphs">Browse library</Link>
          </div>
          <Card>
            <ul className="morph-list">
              {sampleMorphs.slice(0, 7).map((morph) => (
                <li key={morph.id}>
                  <MorphIcon morph={morph} />
                  <span><strong>{morph.name}</strong><span className="record-meta">{morph.category}</span></span>
                  <span className="durability" title="Durability"><span>DUR</span> {morph.durability}</span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </>
  );
}
