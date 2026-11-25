import { useState } from 'react';
import type { AptitudeScores } from '../types/character.ts';
import { aptitudes } from '../types/character.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { aptitudeTemplates, coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';

export function AptitudeTemplatePicker({ onApply }: { onApply: (scores: AptitudeScores) => void }) {
  const [selectedName, setSelectedName] = useState('');
  const selected = aptitudeTemplates.find(({ name }) => name === selectedName);
  return (
    <div className="identity-fields aptitude-template">
      <label>
        Core aptitude template
        <select value={selectedName} onChange={(event) => setSelectedName(event.target.value)}>
          <option value="">Choose a template</option>
          {aptitudeTemplates.map(({ name }) => <option key={name}>{name}</option>)}
        </select>
      </label>
      <button type="button" className="button secondary" disabled={!selected} onClick={() => selected && onApply(selected.scores)}>
        Apply template
      </button>
      <p className="concept rules-note">Applying a template replaces the six aptitude entries.</p>
    </div>
  );
}

export function AptitudeBudget({ scores }: { scores?: AptitudeScores }) {
  const budget = scores && evaluateAptitudeBudget(scores);
  return (
    <section className="aptitude-budget" aria-labelledby="aptitude-budget-title">
      <h3 id="aptitude-budget-title">Core aptitude budget</h3>
      <div role="status">
        {budget ? (
          <>
            <dl>
              <div><dt>Entered</dt><dd>{budget.entered} / {aptitudes.length}</dd></div>
              <div><dt>Aptitude points</dt><dd>{budget.total} / {coreAptitudeRules.basePoints}</dd></div>
              <div><dt>CP for aptitudes</dt><dd>{budget.aptitudeCp}</dd></div>
            </dl>
            {budget.outOfRange.length > 0 && (
              <p className="error">Use {coreAptitudeRules.minimum}–{coreAptitudeRules.maximum} for {budget.outOfRange.map(({ label }) => label).join(', ')}.</p>
            )}
            {budget.templatePointsLeft > 0 && (
              <p className="muted">Template points left to allocate <strong>{budget.templatePointsLeft}</strong></p>
            )}
            {budget.exceedsMaximumCp ? (
              <p className="error">Aptitudes exceed the {coreAptitudeRules.startingCp + coreAptitudeRules.maximumTraitBonus} CP maximum, including possible trait bonuses.</p>
            ) : budget.baseCpLeft < 0 ? (
              <p className="error">Aptitudes use {-budget.baseCpLeft} CP above the {coreAptitudeRules.startingCp} CP base. Negative traits can add up to {coreAptitudeRules.maximumTraitBonus} CP.</p>
            ) : (
              <p className="muted">Base CP left after aptitudes <strong>{budget.baseCpLeft}</strong></p>
            )}
          </>
        ) : <p className="muted">Enter whole numbers to review the budget.</p>}
      </div>
      <p className="rules-note">
        Extra aptitude points cost 1 CP each. Other creation choices will use the same CP pool.
      </p>
      <p className="rules-note">
        Adapted from <a href={coreAptitudeRules.coreBookUrl}>Eclipse Phase Second Edition, pp. 44 and 46</a> by{' '}
        <a href="https://eclipsephase.com/">Posthuman Studios, LLC</a> under{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.
      </p>
    </section>
  );
}
