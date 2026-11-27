import { useState } from 'react';
import { availableMorphTraits, deriveMorphProfile, evaluateMorphTraits } from '../rules/calculations/morph-traits.ts';
import { morphTraitSource } from '../rules/datasets/morph-traits.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import type { MorphDefinition, MorphTraitChoice } from '../types/character.ts';
import { MorphStats } from './MorphCatalog.tsx';

const { negativeMorphTraitCap } = startingMorphBudgetRules;
const describeMp = (mp: number) => mp > 0 ? `${mp} MP cost` : `${-mp} MP bonus`;
const describeDurability = (points: number) => points > 0 ? `+${points}` : `−${-points}`;

export function MorphTraitSummary({ entries }: { entries: ReturnType<typeof evaluateMorphTraits>['entries'] }) {
  if (!entries.length) return null;
  return (
    <ul className="morph-trait-summary">
      {entries.map(({ id, name, level, mp, levels, effect, durabilityChange }) => (
        <li key={id}>
          <a href={morphTraitSource(id)}>{name}</a>{levels.length > 1 && ` · Level ${level}`} · {describeMp(mp)}
          {durabilityChange !== 0 && ` · ${describeDurability(durabilityChange)} Durability`}
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
  const healthModifiers = entries.filter(({ durabilityChange }) => durabilityChange !== 0);

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
          {options.map(({ id, name, levels, eligibleLevels, effect }) => (
            <div key={id}>
              <label>
                {name}
                <select value={entries.find((entry) => entry.id === id)?.level ?? 0}
                  aria-describedby={`morph-trait-${id}`} onChange={(event) => choose(id, Number(event.target.value))}>
                  <option value={0}>None</option>
                  {eligibleLevels.map(({ level, mp }) => (
                    <option key={level} value={level}>
                      {levels.length > 1 ? `Level ${level}` : 'Take'} · {describeMp(mp)}
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
      {configured && morph && healthModifiers.length > 0 && (
        <div aria-live="polite">
          <p className="rules-note">{configured.name} health with traits</p>
          <p className="rules-note">Durability {morph.durability} base {healthModifiers.map(({ name, durabilityChange }) => (
            `${describeDurability(durabilityChange)} ${name}`
          )).join(' ')} = {configured.durability}</p>
          <MorphStats morph={configured} />
        </div>
      )}
    </section>
  );
}
