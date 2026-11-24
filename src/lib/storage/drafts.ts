import { normalizeDraft } from '../../features/sleeve/history.ts';
import type { CharacterDraft, LegacyCharacterDraft } from '../../types/character.ts';

const storeName = 'drafts';
let connection: Promise<IDBDatabase> | undefined;

function openDatabase() {
  connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('eclipse-phase-creator', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName, { keyPath: 'ego.id' });
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        connection = undefined;
      };
      resolve(database);
    };
    request.onerror = () => reject(request.error);
  }).catch((error: unknown) => {
    connection = undefined;
    throw error;
  });
  return connection;
}

export async function loadDrafts() {
  const database = await openDatabase();
  const records = await new Promise<(CharacterDraft | LegacyCharacterDraft)[]>((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return records.map(normalizeDraft).sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export class DraftConflictError extends Error {}

export async function saveDraft(draft: CharacterDraft, previousRevision: number | undefined) {
  const database = await openDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.get(draft.ego.id);
    let conflict = false;
    request.onsuccess = () => {
      const current = request.result as CharacterDraft | LegacyCharacterDraft | undefined;
      if (current?.revision !== previousRevision) {
        conflict = true;
        transaction.abort();
        return;
      }
      store.put(draft);
    };
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(conflict ? new DraftConflictError() : transaction.error);
  });
}
