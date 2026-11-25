import { Boxes, CircleDot, HardDrive, LayoutGrid, Orbit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BackupRestore } from '../components/BackupRestore.tsx';
import { Dashboard } from '../components/Dashboard.tsx';
import { Dossier } from '../components/Dossier.tsx';
import { DraftEditor } from '../components/DraftEditor.tsx';
import { MorphCatalog, QuickStartCredit } from '../components/MorphCatalog.tsx';
import { ResleeveEditor } from '../components/ResleeveEditor.tsx';
import { loadDrafts } from '../lib/storage/drafts.ts';
import type { CharacterDraft } from '../types/character.ts';

type Screen =
  | { name: 'dashboard' | 'catalog' | 'restore' }
  | { name: 'editor'; draft?: CharacterDraft }
  | { name: 'resleeve'; draft: CharacterDraft }
  | { name: 'dossier'; draft: CharacterDraft };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'dashboard' });
  const [drafts, setDrafts] = useState<CharacterDraft[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const main = useRef<HTMLElement>(null);
  const focusOnNavigation = useRef(false);

  useEffect(() => {
    let active = true;
    loadDrafts().then(
      (records) => {
        if (!active) return;
        setDrafts(records);
        setLoadState('ready');
      },
      () => {
        if (active) setLoadState('error');
      },
    );
    return () => { active = false; };
  }, [loadAttempt]);

  useEffect(() => {
    if (!focusOnNavigation.current) return;
    focusOnNavigation.current = false;
    main.current?.querySelector('h1')?.focus();
    window.scrollTo(0, 0);
  }, [screen]);

  useEffect(() => {
    if (!dirty && !saving) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = true;
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty, saving]);

  function navigate(next: Screen) {
    if (saving) return;
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    focusOnNavigation.current = true;
    setDirty(false);
    setNotice('');
    setScreen(next);
  }

  function handleSaved(draft: CharacterDraft) {
    focusOnNavigation.current = true;
    setDrafts((records) => [draft, ...records.filter((record) => record.ego.id !== draft.ego.id)]);
    setDirty(false);
    setSaving(false);
    setNotice('Draft saved in this browser.');
    setScreen({ name: 'dossier', draft });
  }

  function handleRestored(restored: CharacterDraft[]) {
    setDrafts((records) => [...restored, ...records].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)));
    setSaving(false);
    setNotice(`Restored ${restored.length} ${restored.length === 1 ? 'draft' : 'drafts'}.`);
    focusOnNavigation.current = true;
    setScreen({ name: 'dashboard' });
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar screen-only">
        <button type="button" className="brand" disabled={saving} onClick={() => navigate({ name: 'dashboard' })}>
          <span className="brand-mark"><Orbit size={26} aria-hidden="true" /></span>
          <span><strong>Eclipse Phase</strong><span>Character creator</span></span>
        </button>
        <nav aria-label="Workspace">
          <button type="button" disabled={saving} aria-current={screen.name === 'dashboard' ? 'page' : undefined} onClick={() => navigate({ name: 'dashboard' })}>
            <LayoutGrid size={18} aria-hidden="true" /> My egos
          </button>
          <button type="button" disabled={saving} aria-current={screen.name === 'catalog' ? 'page' : undefined} onClick={() => navigate({ name: 'catalog' })}>
            <Boxes size={18} aria-hidden="true" /> Morph library
          </button>
        </nav>
        <span className="sidebar-status"><HardDrive size={16} aria-hidden="true" /> Local workspace</span>
      </aside>
      <div className="workspace">
        <div className="topbar screen-only">
          <span>Character workspace</span>
          <span className="prototype-label"><CircleDot size={13} aria-hidden="true" /> Prototype</span>
        </div>
        <main id="main" ref={main} tabIndex={-1}>
          <div className="screen-only" role="status">{notice && <p className="save-notice">{notice}</p>}</div>
          {screen.name === 'dashboard' && (
            <Dashboard
              drafts={drafts}
              loading={loadState === 'loading'}
              loadError={loadState === 'error'}
              onRetry={() => { setLoadState('loading'); setLoadAttempt((attempt) => attempt + 1); }}
              onCreate={() => navigate({ name: 'editor' })}
              onOpen={(draft) => navigate({ name: 'dossier', draft })}
              onCatalog={() => navigate({ name: 'catalog' })}
              onImport={() => navigate({ name: 'restore' })}
            />
          )}
          {screen.name === 'catalog' && <MorphCatalog />}
          {screen.name === 'restore' && (
            <BackupRestore onCancel={() => navigate({ name: 'dashboard' })} onRestored={handleRestored} onSaving={setSaving} />
          )}
          {screen.name === 'editor' && (
            <DraftEditor
              key={screen.draft?.ego.id ?? 'new'}
              draft={screen.draft}
              onDirty={setDirty}
              onSaving={setSaving}
              onSaved={handleSaved}
              onCancel={() => navigate(screen.draft ? { name: 'dossier', draft: screen.draft } : { name: 'dashboard' })}
            />
          )}
          {screen.name === 'resleeve' && (
            <ResleeveEditor
              draft={screen.draft}
              onDirty={setDirty}
              onSaving={setSaving}
              onSaved={handleSaved}
              onCancel={() => navigate({ name: 'dossier', draft: screen.draft })}
            />
          )}
          {screen.name === 'dossier' && (
            <Dossier
              draft={screen.draft}
              onEdit={() => navigate({ name: 'editor', draft: screen.draft })}
              onResleeve={() => navigate({ name: 'resleeve', draft: screen.draft })}
            />
          )}
        </main>
        <footer className="screen-only">
          <p>Unofficial Eclipse Phase Second Edition character tool</p>
          <p className="rules-note"><QuickStartCredit /></p>
        </footer>
      </div>
    </div>
  );
}
