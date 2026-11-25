import { traceReputation } from '../rules/calculations/reputation.ts';
import type { ReputationInputs } from '../rules/calculations/reputation.ts';
import { reputationNetworks, startingReputationRules } from '../rules/datasets/reputation.ts';
import type { ReputationNetwork } from '../rules/datasets/reputation.ts';
import type { ReputationScores } from '../types/character.ts';
import { Card } from './ui/card.tsx';

export function ReputationEditor({ inputs, issue, onChange }: {
  inputs: ReputationInputs;
  issue?: { id: ReputationNetwork; message: string };
  onChange: (inputs: ReputationInputs) => void;
}) {
  const { freePoints, networkCap, pointsPerCp, sourceUrl } = startingReputationRules;
  return (
    <Card className="editor-panel">
      <h2>Reputation</h2>
      <p className="muted">Assign {freePoints} free points across networks, up to {networkCap} in each. Each CP buys {pointsPerCp} more points.</p>
      <div className="aptitude-fields">
        {reputationNetworks.map(({ id, name }) => (
          <label key={id}>
            {id} · {name}
            <input
              name={`reputation-${id}`}
              inputMode="numeric"
              value={inputs[id] ?? ''}
              aria-invalid={issue?.id === id || undefined}
              aria-describedby={issue?.id === id ? 'reputation-error' : undefined}
              onChange={(event) => onChange({ ...inputs, [id]: event.target.value })}
            />
          </label>
        ))}
      </div>
      {issue && <p className="error" id="reputation-error" role="alert">{issue.message}</p>}
      <p className="rules-note"><a href={sourceUrl}>Core reputation rules</a></p>
    </Card>
  );
}

export function ReputationSummary({ scores }: { scores?: ReputationScores }) {
  const networks = traceReputation(scores);
  if (!networks.length) return null;

  return (
    <section>
      <h3>Reputation</h3>
      <dl className="print-checks">
        {networks.map(({ id, name, score }) => <div key={id}><dt title={name}>{id}</dt><dd>{score}</dd></div>)}
      </dl>
      <p className="rules-note"><a href={startingReputationRules.sourceUrl}>Core reputation rules</a></p>
    </section>
  );
}
