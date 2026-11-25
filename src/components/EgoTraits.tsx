import { useState } from 'react';
import { evaluateEgoTraitBudget, traceEgoTraits } from '../rules/calculations/ego-traits.ts';
import { coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';
import { egoTraits, egoTraitsSource } from '../rules/datasets/ego-traits.ts';
import type { EgoTraitChoice } from '../types/character.ts';
import { Card } from './ui/card.tsx';

function describeCp(cp: number) {
  return cp > 0 ? `${cp} CP cost` : `${-cp} CP bonus`;
}

export function EgoTraitEditor({ choices, onChange }: {
  choices: EgoTraitChoice[];
  onChange: (choices: EgoTraitChoice[]) => void;
}) {
  const [issue, setIssue] = useState('');
  const { maximumTraitBonus } = coreAptitudeRules;

  function choose(id: string, level: number) {
    const next = choices.filter((choice) => choice.id !== id);
    if (level) next.push({ id, level });
    if (evaluateEgoTraitBudget(next).bonus > maximumTraitBonus) {
      setIssue(`This choice would exceed the ${maximumTraitBonus} CP limit for negative traits.`);
      return;
    }
    setIssue('');
    onChange(next);
  }

  return (
    <Card className="editor-panel">
      <h2>Ego traits</h2>
      <p className="muted">Choose from the supported traits. Negative traits can add up to {maximumTraitBonus} CP.</p>
      <div className="identity-fields">
        {egoTraits.map(({ id, name, cpByLevel, effect }) => (
          <div key={id}>
            <label>
              {name}
              <select value={choices.find((choice) => choice.id === id)?.level ?? 0}
                aria-describedby={`ego-trait-${id}`}
                onChange={(event) => choose(id, Number(event.target.value))}>
                <option value={0}>None</option>
                {cpByLevel.map((cp, index) => (
                  <option key={index} value={index + 1}>
                    {cpByLevel.length > 1 ? `Level ${index + 1} · ` : 'Take · '}{describeCp(cp)}
                  </option>
                ))}
              </select>
            </label>
            <p className="rules-note" id={`ego-trait-${id}`}>{effect}</p>
          </div>
        ))}
      </div>
      {issue && <p className="error" role="alert">{issue}</p>}
      <p className="rules-note"><a href={egoTraitsSource}>Core ego trait rules</a></p>
    </Card>
  );
}

export function EgoTraitSummary({ choices }: { choices?: EgoTraitChoice[] }) {
  const traits = traceEgoTraits(choices);
  if (!traits.length) return null;

  return (
    <section>
      <h3>Ego traits</h3>
      <ul>
        {traits.map(({ id, name, level, cpByLevel, effect }) => (
          <li key={id}>
            <strong>{name}{cpByLevel.length > 1 && ` · Level ${level}`}</strong>
            <p>{effect}</p>
          </li>
        ))}
      </ul>
      <p className="rules-note"><a href={egoTraitsSource}>Core ego trait rules</a></p>
    </section>
  );
}
