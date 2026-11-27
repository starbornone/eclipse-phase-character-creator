import { useEffect, useRef } from 'react';
import { Link, useRouteError } from 'react-router';
import { recordBetaEvent } from '../features/beta/diagnostics.ts';

export function WorkspaceRecovery() {
  const error = useRouteError();
  const observed = useRef<{ error: unknown } | undefined>(undefined);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (observed.current && observed.current.error === error) return;
    observed.current = { error };
    heading.current?.focus();
    recordBetaEvent('unexpectedError');
  }, [error]);

  return (
    <main className="workspace">
      <header className="page-heading">
        <h1 ref={heading} tabIndex={-1}>Something went wrong</h1>
        <p>Reload to try again. Open My egos to return to saved drafts, or visit Beta help to report the problem.</p>
      </header>
      <div className="actions">
        <button type="button" className="button primary" onClick={() => window.location.reload()}>Reload workspace</button>
        <Link className="button secondary" to="/">My egos</Link>
        <Link className="button secondary" to="/help">Beta help</Link>
      </div>
    </main>
  );
}
