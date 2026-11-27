import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatBetaDiagnostics, readBetaDiagnostics, recordBetaEvent, setBetaDiagnostics, subscribeToBetaDiagnostics } from '../features/beta/diagnostics.ts';

function tabStorage() {
  const entries = new Map();
  return {
    entries,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, raw) => entries.set(key, raw),
    removeItem: (key) => entries.delete(key),
  };
}

test('diagnostics start off, count only after opt-in, and clear on opt-out', () => {
  const tab = tabStorage();
  recordBetaEvent('workspaceLoadFailed', tab);
  assert.equal(tab.entries.size, 0);
  assert.equal(readBetaDiagnostics(tab), undefined);
  assert.equal(setBetaDiagnostics(true, tab), true);
  recordBetaEvent('draftCreated', tab);
  recordBetaEvent('backupRejected', tab);
  recordBetaEvent('draftCreated', tab);
  assert.deepEqual(readBetaDiagnostics(tab), { draftCreated: 2, backupRejected: 1 });
  assert.equal(readBetaDiagnostics(tabStorage()), undefined);
  assert.equal(setBetaDiagnostics(false, tab), true);
  recordBetaEvent('unexpectedError', tab);
  assert.equal(tab.entries.size, 0);
});

test('restored diagnostic data and reports contain only bounded counts and allow-listed labels', () => {
  const tab = tabStorage();
  assert.equal(setBetaDiagnostics(true, tab), true);
  const [key] = tab.entries.keys();
  tab.setItem(key, JSON.stringify({
    draftCreated: 99999, draftEdited: 1.5, backupRejected: -1, unexpectedError: 2,
    privateNote: 'PRIVATE NOTE MARKER', characterId: 'PRIVATE ID MARKER',
  }));
  recordBetaEvent('draftCreated', tab);
  recordBetaEvent('privateNote', tab);
  const counts = readBetaDiagnostics(tab);
  assert.deepEqual(counts, { draftCreated: 9999, unexpectedError: 2 });
  assert.deepEqual(JSON.parse(tab.getItem(key)), counts);
  const report = formatBetaDiagnostics('0.1.0', { ...counts, privateNote: 'PRIVATE NOTE MARKER' });
  assert.match(report, /Character Creator 0\.1\.0/);
  assert.match(report, /New draft saved 9999/);
  assert.match(report, /Unexpected page error 2/);
  assert.doesNotMatch(report, /PRIVATE|characterId|privateNote/);
});

test('invalid or unavailable storage leaves core actions usable', () => {
  const tab = tabStorage();
  setBetaDiagnostics(true, tab);
  const [key] = tab.entries.keys();
  for (const raw of ['invalid', 'null', '[]']) {
    tab.setItem(key, raw);
    assert.equal(readBetaDiagnostics(tab), undefined);
    recordBetaEvent('draftCreated', tab);
    assert.equal(tab.getItem(key), raw);
  }
  const blocked = {
    getItem() { throw Error('Storage blocked'); },
    setItem() { throw Error('Storage blocked'); },
    removeItem() { throw Error('Storage blocked'); },
  };
  assert.equal(readBetaDiagnostics(blocked), undefined);
  assert.equal(setBetaDiagnostics(true, blocked), false);
  assert.equal(setBetaDiagnostics(false, blocked), false);
  assert.doesNotThrow(() => recordBetaEvent('workspaceLoadFailed', blocked));
});

test('subscribers receive changes after successful writes', () => {
  const tab = tabStorage();
  const snapshots = [];
  const unsubscribe = subscribeToBetaDiagnostics(() => snapshots.push(readBetaDiagnostics(tab)));
  try {
    recordBetaEvent('draftCreated', tab);
    setBetaDiagnostics(true, tab);
    recordBetaEvent('backupRestored', tab);
    setBetaDiagnostics(false, tab);
  } finally {
    unsubscribe();
  }
  setBetaDiagnostics(true, tab);
  assert.deepEqual(snapshots, [{}, { backupRestored: 1 }, undefined]);
});
