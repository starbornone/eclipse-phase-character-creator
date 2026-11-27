import { useState } from 'react';
import { evaluateEgoTraitBudget, traceEgoTraits } from '../rules/calculations/ego-traits.ts';
import { skillNameFromId } from '../rules/calculations/starting-skills.ts';
import { coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';
import { egoTraits, egoTraitsSource, expertTraining } from '../rules/datasets/ego-traits.ts';
import type { EgoTraitChoice } from '../types/character.ts';
import { Card } from './ui/card.tsx';
import { RepeatableEgoTraits } from './RepeatableEgoTraits.tsx';

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
      <p className="rules-note">The dossier traces any bonuses and penalties that apply to aptitude checks.</p>
      <p className="rules-note">Composure and Instability change Lucidity, Trauma Threshold, and Insanity Rating.</p>
      <div className="identity-fields">
        {egoTraits.filter(({ id, selection }) => id !== expertTraining.id && !selection).map(({ id, name, cpByLevel, effect }) => (
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
      <RepeatableEgoTraits choices={choices} onChange={onChange} />
      <p className="rules-note"><a href={egoTraitsSource}>Core ego trait rules</a></p>
    </Card>
  );
}

export function EgoTraitSummary({ choices }: { choices?: EgoTraitChoice[] }) {
  const traits = traceEgoTraits(choices);
  if (!traits.length) return null;

  return (
    <section className="ego-trait-summary">
      <h3>Ego traits</h3>
      <ul>
        {traits.map(({ key, name, level, cpByLevel, effect, skillId, detail, network }) => (
          <li key={key}>
            <strong>{name}{cpByLevel.length > 1 && ` · Level ${level}`}</strong>
            {detail && <p>{detail}{network && ` · ${network}`}</p>}
            {skillId && <p>Skill <strong>{skillNameFromId(skillId)}</strong></p>}
            <p>{effect}</p>
          </li>
        ))}
      </ul>
      <p className="rules-note"><a href={egoTraitsSource}>Core ego trait rules</a></p>
    </section>
  );
}
