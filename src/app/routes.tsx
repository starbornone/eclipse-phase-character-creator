import { Link, Outlet, createBrowserRouter, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router';
import { BackupRestore } from '../components/BackupRestore.tsx';
import { Dashboard } from '../components/Dashboard.tsx';
import { Dossier } from '../components/Dossier.tsx';
import { DossierPrintPreview } from '../components/DossierPrintPreview.tsx';
import { DraftEditor } from '../components/DraftEditor.tsx';
import { ResleeveEditor } from '../components/ResleeveEditor.tsx';
import { activeSleeve } from '../features/sleeve/history.ts';
import { sampleMorphs } from '../rules/datasets/sample-morphs.ts';
import type { CharacterDraft } from '../types/character.ts';
import App from './App.tsx';
import type { Workspace } from './App.tsx';
import { egoPath } from './paths.ts';

function RouteMessage({ title, message, onRetry, back }: {
  title: string;
  message: string;
  onRetry?: () => void;
  back?: string;
}) {
  return (
    <div className="page-heading">
      <h1 tabIndex={-1}>{title}</h1>
      <p>{message}</p>
      <div className="actions">
        {onRetry && <button type="button" className="button primary" onClick={onRetry}>Retry</button>}
        <Link className="button secondary" to={back ?? '/'}>{back ? 'Back to dossier' : 'Go to My egos'}</Link>
      </div>
    </div>
  );
}

function WorkspaceUnavailable({ workspace }: { workspace: Workspace }) {
  return workspace.loadState === 'error'
    ? <RouteMessage title="Drafts unavailable" message="Check that this browser allows local storage, then retry." onRetry={workspace.retry} />
    : <RouteMessage title="Loading drafts" message="Opening this browser’s drafts…" />;
}

function DashboardRoute() {
  const workspace = useOutletContext<Workspace>();
  return <Dashboard drafts={workspace.drafts} loading={workspace.loadState === 'loading'} loadError={workspace.loadState === 'error'} onRetry={workspace.retry} />;
}

function MorphCatalogFallback() {
  return <p className="panel-message" role="status">Loading morph library…</p>;
}

function useRequestedMorphId() {
  const [params] = useSearchParams();
  const requested = params.get('morph');
  return sampleMorphs.find(({ id }) => id === requested)?.id;
}

function NewEgoRoute() {
  const workspace = useOutletContext<Workspace>();
  const navigate = useNavigate();
  const initialMorphId = useRequestedMorphId();
  if (workspace.loadState !== 'ready') return <WorkspaceUnavailable workspace={workspace} />;
  return <DraftEditor initialMorphId={initialMorphId} onDirty={workspace.setDirty} onSaving={workspace.setSaving} onSaved={workspace.handleSaved} onCancel={() => void navigate('/')} />;
}

function RestoreRoute() {
  const workspace = useOutletContext<Workspace>();
  const navigate = useNavigate();
  if (workspace.loadState !== 'ready') return <WorkspaceUnavailable workspace={workspace} />;
  return <BackupRestore onCancel={() => void navigate('/')} onRestored={workspace.handleRestored} onSaving={workspace.setSaving} />;
}

interface EgoWorkspace extends Workspace {
  draft: CharacterDraft;
}

function EgoRoute() {
  const workspace = useOutletContext<Workspace>();
  const { egoId } = useParams();
  if (workspace.loadState !== 'ready') return <WorkspaceUnavailable workspace={workspace} />;
  const draft = workspace.drafts.find((record) => record.ego.id === egoId);
  if (!draft) {
    return <RouteMessage title="Ego not found" message="This ego may be saved in another browser. You can open a local draft or restore a backup from My egos." />;
  }
  return <Outlet context={{ ...workspace, draft } satisfies EgoWorkspace} />;
}

function DossierRoute() {
  const { draft } = useOutletContext<EgoWorkspace>();
  return <Dossier draft={draft} />;
}

function EditEgoRoute() {
  const workspace = useOutletContext<EgoWorkspace>();
  const navigate = useNavigate();
  const { draft } = workspace;
  const initialMorphId = useRequestedMorphId();
  return (
    <DraftEditor
      key={draft.ego.id}
      draft={draft}
      initialMorphId={initialMorphId}
      onDirty={workspace.setDirty}
      onSaving={workspace.setSaving}
      onSaved={workspace.handleSaved}
      onCancel={() => void navigate(egoPath(draft.ego.id))}
    />
  );
}

function ResleeveRoute() {
  const workspace = useOutletContext<EgoWorkspace>();
  const navigate = useNavigate();
  const { draft } = workspace;
  const initialMorphId = useRequestedMorphId();
  if (!activeSleeve(draft)) {
    return <RouteMessage title="Assign a morph first" message="Use Edit ego in the dossier to choose the first morph." back={egoPath(draft.ego.id)} />;
  }
  return (
    <ResleeveEditor
      key={draft.ego.id}
      draft={draft}
      initialMorphId={initialMorphId}
      onDirty={workspace.setDirty}
      onSaving={workspace.setSaving}
      onSaved={workspace.handleSaved}
      onCancel={() => void navigate(egoPath(draft.ego.id))}
    />
  );
}

function PrintRoute() {
  const { draft } = useOutletContext<EgoWorkspace>();
  const navigate = useNavigate();
  return <DossierPrintPreview key={draft.ego.id} draft={draft} onBack={() => void navigate(egoPath(draft.ego.id))} />;
}

function NotFoundRoute() {
  return <RouteMessage title="Page not found" message="Use My egos or Morph library to get back to the workspace." />;
}

export const router = createBrowserRouter([
  { path: '/', Component: App, children: [
    { index: true, Component: DashboardRoute },
    {
      path: 'morphs',
      HydrateFallback: MorphCatalogFallback,
      lazy: async () => ({ Component: (await import('../components/MorphCatalog.tsx')).MorphCatalog }),
    },
    { path: 'backups/import', Component: RestoreRoute },
    { path: 'egos/new', Component: NewEgoRoute },
    { path: 'egos/:egoId', Component: EgoRoute, children: [
      { index: true, Component: DossierRoute },
      { path: 'edit', Component: EditEgoRoute },
      { path: 'resleeve', Component: ResleeveRoute },
      { path: 'print', Component: PrintRoute },
    ] },
    { path: '*', Component: NotFoundRoute },
  ] },
], { basename: import.meta.env.BASE_URL });
