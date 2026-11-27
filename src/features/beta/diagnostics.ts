export const betaDiagnosticEvents = {
  draftCreated: 'New draft saved',
  draftEdited: 'Draft edit saved',
  resleeveSaved: 'Resleeve saved',
  backupExportRequested: 'Backup export requested',
  backupRestored: 'Backup restored',
  printRequested: 'Print requested',
  workspaceLoadFailed: 'Workspace load failed',
  draftSaveFailed: 'Draft save failed',
  resleeveSaveFailed: 'Resleeve save failed',
  revisionConflict: 'Draft revision conflict',
  backupReadFailed: 'Backup file read failed',
  backupRejected: 'Backup validation failed',
  backupRestoreFailed: 'Backup restore failed',
  unexpectedError: 'Unexpected page error',
} as const;

export type BetaDiagnosticEvent = keyof typeof betaDiagnosticEvents;
type BetaDiagnosticCounts = Partial<Record<BetaDiagnosticEvent, number>>;
type DiagnosticStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const key = 'eclipse-phase-beta-diagnostics-v1';
const events = Object.keys(betaDiagnosticEvents) as BetaDiagnosticEvent[];
const maxCount = 9999;
const changes = new EventTarget();

export function subscribeToBetaDiagnostics(notify: () => void) {
  changes.addEventListener('change', notify);
  return () => changes.removeEventListener('change', notify);
}

function currentTabStorage(): DiagnosticStorage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

function diagnosticCount(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? Math.min(value, maxCount) : 0;
}

function readCounts(raw: string): BetaDiagnosticCounts | undefined {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined;
  const values = parsed as Record<string, unknown>;
  const counts: BetaDiagnosticCounts = {};
  for (const event of events) {
    const count = diagnosticCount(values[event]);
    if (count > 0) counts[event] = count;
  }
  return counts;
}

export function readBetaDiagnostics(storage = currentTabStorage()) {
  try {
    const raw = storage?.getItem(key);
    return raw ? readCounts(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function setBetaDiagnostics(enabled: boolean, storage = currentTabStorage()) {
  if (!storage) return false;
  try {
    if (enabled) storage.setItem(key, JSON.stringify(readBetaDiagnostics(storage) ?? {}));
    else storage.removeItem(key);
    changes.dispatchEvent(new Event('change'));
    return true;
  } catch {
    return false;
  }
}

export function recordBetaEvent(event: BetaDiagnosticEvent, storage = currentTabStorage()) {
  try {
    if (!storage || !Object.hasOwn(betaDiagnosticEvents, event)) return;
    const counts = readBetaDiagnostics(storage);
    if (!counts) return;
    counts[event] = Math.min(maxCount, (counts[event] ?? 0) + 1);
    storage.setItem(key, JSON.stringify(counts));
    changes.dispatchEvent(new Event('change'));
  } catch {
    // Diagnostics must leave character operations usable when browser storage is unavailable.
  }
}

export function formatBetaDiagnostics(version: string, counts: BetaDiagnosticCounts) {
  return [
    `Eclipse Phase Character Creator ${version}`,
    'Optional counts from this tab (up to 9,999 per event)',
    ...events.map((event) => `${betaDiagnosticEvents[event]} ${diagnosticCount(counts[event])}`),
  ].join('\n');
}
