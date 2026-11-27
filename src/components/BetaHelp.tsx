import { useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import { version } from '../../package.json';
import { formatBetaDiagnostics, readBetaDiagnostics, setBetaDiagnostics, subscribeToBetaDiagnostics } from '../features/beta/diagnostics.ts';
import { Card } from './ui/card.tsx';

const repositoryUrl = 'https://github.com/starbornone/eclipse-phase-character-creator';
const walkthroughUrl = `${repositoryUrl}/blob/main/docs/getting-started.md#create-a-complete-first-character`;

function getDiagnosticReport() {
  const counts = readBetaDiagnostics();
  return counts ? formatBetaDiagnostics(version, counts) : '';
}

export function BetaHelp() {
  const [notice, setNotice] = useState('');
  const reportField = useRef<HTMLTextAreaElement>(null);
  const report = useSyncExternalStore(subscribeToBetaDiagnostics, getDiagnosticReport);
  const enabled = Boolean(report);

  function updateDiagnostics(checked: boolean) {
    if (!setBetaDiagnostics(checked)) {
      setNotice('Diagnostics settings could not be saved in this tab.');
      return;
    }
    setNotice(checked ? 'Diagnostics enabled for this tab.' : 'Diagnostics disabled and counts cleared.');
  }

  async function copyDiagnostics() {
    try {
      await navigator.clipboard.writeText(report);
      setNotice('Diagnostics copied. Paste them into an issue if you want to share them.');
    } catch {
      reportField.current?.focus();
      reportField.current?.select();
      setNotice('The report is selected. Use your device’s copy command.');
    }
  }

  return (
    <>
      <header className="page-heading">
        <h1 tabIndex={-1}>Beta help</h1>
        <p>Get started, recover a draft, or report a problem. App version {version}.</p>
      </header>
      <div className="beta-help-grid">
        <Card className="editor-panel beta-help-panel">
          <h2>Start your first character</h2>
          <ol>
            <li>Choose a background, career, interest, and faction. Apply an aptitude template.</li>
            <li>Choose a first morph and follow Creation review to finish the starting skills and budgets.</li>
            <li>Save your draft. Open the dossier to print it, resleeve, or export a backup.</li>
          </ol>
          <a href={walkthroughUrl} rel="noreferrer">Follow the worked character on GitHub</a>
          <div className="actions">
            <Link className="button primary" to="/egos/new">Create ego</Link>
            <Link className="button secondary" to="/backups/import">Import JSON</Link>
          </div>
        </Card>
        <Card className="editor-panel beta-help-panel">
          <h2>Known limitations</h2>
          <ul>
            <li>Drafts belong to this browser profile and site address. Export JSON before switching devices or clearing site data.</li>
            <li>Creation review covers core package-buy with one starting sleeve and 16 supported morph profiles.</li>
            <li>Use the rulebook and your GM for reserve morphs, installed gear effects, and situational bonuses.</li>
            <li>JSON backups include private sleeve notes. Use the print layout and its visibility controls for sharing a dossier.</li>
          </ul>
        </Card>
        <Card className="editor-panel beta-help-panel">
          <h2>Report a problem or give feedback</h2>
          <p>GitHub issues are public. Use a fictional example and describe the action, expected result, and actual result. Keep names, backups, and private notes out of the report.</p>
          <div className="actions">
            <a className="button secondary" href={`${repositoryUrl}/issues`} rel="noreferrer">View GitHub issues</a>
            <a className="button primary" href={`${repositoryUrl}/issues/new/choose`} rel="noreferrer">Open the GitHub issue form</a>
          </div>
        </Card>
        <Card className="editor-panel beta-help-panel">
          <h2>Optional diagnostics</h2>
          <label className="compare-toggle">
            <input type="checkbox" checked={enabled} aria-describedby="beta-diagnostics-note" onChange={(event) => updateDiagnostics(event.currentTarget.checked)} />
            <span>Count workflow events in this tab</span>
          </label>
          <p className="rules-note" id="beta-diagnostics-note">The report contains the app version and fixed counts from the time you enable it. Counts stay in this tab and survive reloads. Turn diagnostics off to clear them.</p>
          {enabled && (
            <>
              <div className="identity-fields">
                <label className="concept">
                  Diagnostics report
                  <textarea ref={reportField} readOnly rows={6} value={report} spellCheck={false} />
                </label>
              </div>
              <div className="actions">
                <button type="button" className="button secondary" onClick={() => void copyDiagnostics()}>Copy diagnostics</button>
              </div>
            </>
          )}
          <p className="rules-note" role="status">{notice}</p>
        </Card>
      </div>
    </>
  );
}
