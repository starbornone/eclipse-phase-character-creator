import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { copyBackupDrafts, previewBackup } from '../features/backup/backup.ts';
import type { BackupPreview } from '../features/backup/backup.ts';
import { addDraftCopies } from '../lib/storage/drafts.ts';
import type { CharacterDraft } from '../types/character.ts';
import { Card } from './ui/card.tsx';

interface BackupRestoreProps {
  onCancel: () => void;
  onRestored: (drafts: CharacterDraft[]) => void;
  onSaving: (saving: boolean) => void;
}

export function BackupRestore({ onCancel, onRestored, onSaving }: BackupRestoreProps) {
  const [preview, setPreview] = useState<BackupPreview>();
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || reading || saving) return;
    setReading(true);
    setError('');
    setPreview(undefined);
    try {
      setPreview(previewBackup(await file.text()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The file could not be read.');
    } finally {
      setReading(false);
    }
  }

  async function restore() {
    if (!preview || saving || reading) return;
    setSaving(true);
    onSaving(true);
    setError('');
    try {
      const drafts = copyBackupDrafts(preview.drafts);
      await addDraftCopies(drafts);
      onRestored(drafts);
    } catch {
      setError('The backup could not be restored. Check browser storage, then try again.');
      setSaving(false);
      onSaving(false);
    }
  }

  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Restore JSON backup</h1>
        <p>Review the file before adding its characters as new drafts.</p>
      </header>
      <Card className="editor-panel backup-panel">
        <h2>Backup file</h2>
        <label className="backup-file">
          Choose a JSON backup
          <input type="file" accept=".json,application/json" disabled={reading || saving} onChange={readFile} />
        </label>
        {reading && <p role="status">Reading backup…</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {preview && (
          <section className="backup-preview" aria-labelledby="backup-preview-title">
            <h2 id="backup-preview-title">Restore preview</h2>
            <p role="status">
              {preview.drafts.length} {preview.drafts.length === 1 ? 'draft' : 'drafts'} ready to restore.
              {preview.migratedCount > 0 && ` Converted ${preview.migratedCount} from single-sleeve storage to sleeve history.`}
            </p>
            <ul>
              {preview.drafts.map(({ ego, sleeves }) => (
                <li key={ego.id}>
                  <strong>{ego.name || 'Untitled ego'}</strong>
                  <span className="muted">{sleeves.length} {sleeves.length === 1 ? 'sleeve' : 'sleeves'}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Card>
      <div className="actions">
        <button type="button" className="button primary" disabled={!preview || reading || saving} onClick={restore}>
          {saving ? 'Restoring…' : 'Restore as copies'}
        </button>
        <button type="button" className="button secondary" disabled={saving} onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}
