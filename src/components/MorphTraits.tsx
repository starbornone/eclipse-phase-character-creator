import { useState } from 'react';
import { traceAptitudeChecks } from '../rules/calculations/draft.ts';
import { availableMorphTraits, deriveMorphProfile, evaluateMorphTraits, traceIncludedMorphTraits } from '../rules/calculations/morph-traits.ts';
import { morphTraitSource } from '../rules/datasets/morph-traits.ts';
import { startingMorphBudgetRules } from '../rules/datasets/starting-morph-budget.ts';
import type { AptitudeScores, EgoTraitChoice, MorphDefinition, MorphTraitChoice } from '../types/character.ts';
import { AptitudeCheckCalculation } from './AptitudeCheckCalculation.tsx';
import { IncludedMorphTraits } from './IncludedMorphTraits.tsx';
import { MorphStats } from './MorphProfile.tsx';

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

function MorphTraitFields({ options, entries, onChoose }: {
  options: ReturnType<typeof availableMorphTraits>;
  entries: ReturnType<typeof evaluateMorphTraits>['entries'];
  onChoose: (id: string, level: number) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="identity-fields">
      {options.map(({ id, name, levels, eligibleLevels, effect }) => (
        <div key={id}>
          <label>
            {name}
            <select value={entries.find((entry) => entry.id === id)?.level ?? 0}
              aria-describedby={`morph-trait-${id}`} onChange={(event) => onChoose(id, Number(event.target.value))}>
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
  );
}

export function MorphTraitEditor({ morph, choices, aptitudes = {}, egoTraits, onChange }: {
  morph?: MorphDefinition;
  choices: MorphTraitChoice[];
  aptitudes?: AptitudeScores;
  egoTraits?: readonly EgoTraitChoice[];
  onChange: (choices: MorphTraitChoice[]) => void;
}) {
  const [issue, setIssue] = useState('');
  const options = availableMorphTraits(morph);
  const aptitudeOptions = options.filter(({ checkModifier }) => checkModifier);
  const included = traceIncludedMorphTraits(morph);
  const profile = deriveMorphProfile(morph, choices);
  const { morph: configured, entries } = profile;
  const healthModifiers = entries.filter(({ durabilityChange }) => durabilityChange !== 0);
  const changedAptitudes = [...included, ...entries].flatMap(({ checkModifier }) => checkModifier ? [checkModifier.aptitude] : []);
  const checks = changedAptitudes.length
    ? traceAptitudeChecks(aptitudes, egoTraits, profile).filter(({ id }) => changedAptitudes.includes(id)) : [];

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
      <IncludedMorphTraits entries={included} />
      {options.length === 0 && <p className="rules-note">{morph ? 'No additional traits are available for this sleeve.' : 'Choose a first sleeve to see its traits.'}</p>}
      {entries.length < choices.length && (
        <p className="rules-note" role="status">Some traits are unavailable for this first sleeve. Saving will remove those choices.</p>
      )}
      <MorphTraitFields options={options.filter(({ checkModifier }) => !checkModifier)} entries={entries} onChoose={choose} />
      {aptitudeOptions.length > 0 && (
        <details className="morph-aptitude-options">
          <summary>Aptitude check traits</summary>
          <MorphTraitFields options={aptitudeOptions} entries={entries} onChoose={choose} />
        </details>
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
      <div className="first-sleeve-checks" aria-live="polite">
        {checks.length > 0 && (
          <>
            <p className="rules-note">First sleeve aptitude checks</p>
            <dl className="print-checks">
              {checks.map((check) => (
                <div key={check.id}>
                  <dt>{check.label}</dt>
                  <dd>{check.target ?? 'Pending'}<span className="skill-grant muted"><AptitudeCheckCalculation check={check} missingBase="" /></span></dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </div>
    </section>
  );
}
