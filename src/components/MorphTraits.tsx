import { useState } from 'react';
import { availableMorphTraits, deriveMorphProfile, evaluateMorphTraits } from '../rules/calculations/morph-traits.ts';
import { morphTraitSource } from '../rules/datasets/morph-traits.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import type { MorphDefinition, MorphTraitChoice } from '../types/character.ts';
import { MorphStats } from './MorphCatalog.tsx';

const { negativeMorphTraitCap } = startingMorphBudgetRules;
const describeMp = (mp: number) => mp > 0 ? `${mp} MP cost` : `${-mp} MP bonus`;

export function MorphTraitSummary({ entries }: { entries: ReturnType<typeof evaluateMorphTraits>['entries'] }) {
  if (!entries.length) return null;
  return (
    <ul className="morph-trait-summary">
      {entries.map(({ id, name, level, mp, mpByLevel, effect }) => (
        <li key={id}>
          <a href={morphTraitSource(id)}>{name}</a>{mpByLevel.length > 1 && ` · Level ${level}`} · {describeMp(mp)}
          <p className="rules-note">{effect}</p>
        </li>
      ))}
    </ul>
  );
}

export function MorphTraitEditor({ morph, choices, onChange }: {
  morph?: MorphDefinition;
  choices: MorphTraitChoice[];
  onChange: (choices: MorphTraitChoice[]) => void;
}) {
  const [issue, setIssue] = useState('');
  const options = availableMorphTraits(morph);
  const { morph: configured, entries } = deriveMorphProfile(morph, choices);

  function choose(id: string, level: number) {
    const next = choices.filter((choice) => choice.id !== id);
    if (level) next.push({ id, level });
    if (evaluateMorphTraits(morph, next).bonus > negativeMorphTraitCap) {
      setIssue(`Negative morph traits can grant up to ${negativeMorphTraitCap} MP.`);
      return;
    }
    setIssue('');
    onChange(next);
  }

  return (
    <section className="skill-transfers starting-morph-traits">
      <h3>First sleeve traits</h3>
      {!options.length && <p className="rules-note">Choose a supported biomorph or synthmorph to see trait options.</p>}
      {entries.length < choices.length && (
        <p className="rules-note" role="status">Some traits are unavailable for this first sleeve. Saving will remove those choices.</p>
      )}
      {options.length > 0 && (
        <div className="identity-fields">
          {options.map(({ id, name, mpByLevel, effect }) => (
            <div key={id}>
              <label>
                {name}
                <select value={entries.find((entry) => entry.id === id)?.level ?? 0}
                  aria-describedby={`morph-trait-${id}`} onChange={(event) => choose(id, Number(event.target.value))}>
                  <option value={0}>None</option>
                  {mpByLevel.map((mp, index) => (
                    <option key={index} value={index + 1}>
                      {mpByLevel.length > 1 ? `Level ${index + 1}` : 'Take'} · {describeMp(mp)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="rules-note" id={`morph-trait-${id}`}>{effect} <a href={morphTraitSource(id)}>Rule</a></p>
            </div>
          ))}
        </div>
      )}
      {options.length > 0 && issue && <p className="error" role="alert">{issue}</p>}
      {configured && configured !== morph && (
        <div aria-live="polite">
          <p className="rules-note">{configured.name} health with traits</p>
          <MorphStats morph={configured} />
        </div>
      )}
    </section>
  );
}
