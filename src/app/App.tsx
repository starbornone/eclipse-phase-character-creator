import { Boxes, CircleDot, HardDrive, LayoutGrid } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useBlocker, useLocation, useNavigate } from 'react-router';
import { QuickStartCredit } from '../components/MorphCatalog.tsx';
import { loadDrafts } from '../lib/storage/drafts.ts';
import type { CharacterDraft } from '../types/character.ts';
import { egoPath } from './paths.ts';

export interface Workspace {
  drafts: CharacterDraft[];
  loadState: 'loading' | 'ready' | 'error';
  retry: () => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  handleSaved: (draft: CharacterDraft) => void;
  handleRestored: (drafts: CharacterDraft[]) => void;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [drafts, setDrafts] = useState<CharacterDraft[]>([]);
  const [loadState, setLoadState] = useState<Workspace['loadState']>('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [dirty, setDirtyState] = useState(false);
  const [saving, setSavingState] = useState(false);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const main = useRef<HTMLElement>(null);
  const focusedPath = useRef<string | undefined>(undefined);
  const notice = typeof location.state?.notice === 'string' ? location.state.notice : '';

  const setDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
    setDirtyState(value);
  }, []);
  const setSaving = useCallback((value: boolean) => {
    savingRef.current = value;
    setSavingState(value);
  }, []);
  const blocker = useBlocker(useCallback(({ currentLocation, nextLocation }) => (
    currentLocation.pathname !== nextLocation.pathname && (dirtyRef.current || savingRef.current)
  ), []));

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (savingRef.current || (dirtyRef.current && !window.confirm('Discard unsaved changes?'))) {
      blocker.reset();
      return;
    }
    setDirty(false);
    blocker.proceed();
  }, [blocker, setDirty]);

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
    if (focusedPath.current === location.pathname && document.activeElement !== document.body) return;
    focusedPath.current = location.pathname;
    main.current?.querySelector('h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [location.pathname, loadState]);

  useEffect(() => {
    if (!dirty && !saving) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = true;
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty, saving]);

  function retry() {
    setLoadState('loading');
    setLoadAttempt((attempt) => attempt + 1);
  }

  function handleSaved(draft: CharacterDraft) {
    setDrafts((records) => [draft, ...records.filter((record) => record.ego.id !== draft.ego.id)]);
    setDirty(false);
    setSaving(false);
    void navigate(egoPath(draft.ego.id), { replace: true, state: { notice: 'Draft saved in this browser.' } });
  }

  function handleRestored(restored: CharacterDraft[]) {
    setDrafts((records) => [...restored, ...records].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt)));
    setSaving(false);
    const message = `Restored ${restored.length} ${restored.length === 1 ? 'draft' : 'drafts'}.`;
    void navigate('/', { replace: true, state: { notice: message } });
  }

  const workspace: Workspace = { drafts, loadState, retry, setDirty, setSaving, handleSaved, handleRestored };

  return (
    <div className="app">
      <a className="skip-link" href="#main" onClick={(event) => {
        event.preventDefault();
        main.current?.focus();
      }}>Skip to content</a>
      <aside className="sidebar screen-only">
        <Link className="brand" to="/" aria-disabled={saving || undefined}>
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.png`} width={40} height={40} alt="" />
          <span><strong>Eclipse Phase</strong><span>Character creator</span></span>
        </Link>
        <nav aria-label="Workspace">
          <NavLink to="/" end aria-disabled={saving || undefined}><LayoutGrid size={18} aria-hidden="true" /> My egos</NavLink>
          <NavLink to="/morphs" aria-disabled={saving || undefined}><Boxes size={18} aria-hidden="true" /> Morph library</NavLink>
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
          <Outlet context={workspace} />
        </main>
        <footer className="screen-only">
          <p>Unofficial Eclipse Phase Second Edition character tool</p>
          <p className="rules-note"><QuickStartCredit /></p>
        </footer>
      </div>
    </div>
  );
}
