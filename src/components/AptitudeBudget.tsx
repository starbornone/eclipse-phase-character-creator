import { useState } from 'react';
import type { AptitudeScores, SkillPointPurchase } from '../types/character.ts';
import { aptitudes } from '../types/character.ts';
import { evaluateAptitudeBudget, skillPointsPerCp } from '../rules/calculations/aptitude-budget.ts';
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

export function AptitudeBudget({ scores, skillPurchases }: { scores?: AptitudeScores; skillPurchases: SkillPointPurchase[] }) {
  const budget = scores && evaluateAptitudeBudget(scores, skillPurchases);
  return (
    <section className="aptitude-budget" aria-labelledby="aptitude-budget-title">
      <h3 id="aptitude-budget-title">Customization Point budget</h3>
      <div role="status">
        {budget ? (
          <>
            <dl>
              <div><dt>CP for aptitudes</dt><dd>{budget.aptitudeCp}</dd></div>
              <div><dt>CP for skills</dt><dd>{budget.skillCp}</dd></div>
              <div><dt>Total spent</dt><dd>{budget.totalCp} / {coreAptitudeRules.startingCp}</dd></div>
            </dl>
            <p className="muted">Aptitude points <strong>{budget.total} / {coreAptitudeRules.basePoints}</strong> across {budget.entered} / {aptitudes.length} scores</p>
            {budget.unspentPurchasedSkillPoints > 0 && (
              <p className="muted">Skill points available from CP already spent <strong>{budget.unspentPurchasedSkillPoints}</strong></p>
            )}
            {budget.outOfRange.length > 0 && (
              <p className="error">Use {coreAptitudeRules.minimum}–{coreAptitudeRules.maximum} for {budget.outOfRange.map(({ label }) => label).join(', ')}.</p>
            )}
            {budget.templatePointsLeft > 0 && (
              <p className="muted">Template points left to allocate <strong>{budget.templatePointsLeft}</strong></p>
            )}
            {budget.exceedsMaximumCp ? (
              <p className="error">Spending exceeds the {coreAptitudeRules.startingCp + coreAptitudeRules.maximumTraitBonus} CP maximum, including possible trait bonuses.</p>
            ) : budget.baseCpLeft < 0 ? (
              <p className="error">Spending exceeds the base budget by {-budget.baseCpLeft} CP. Negative traits can add up to {coreAptitudeRules.maximumTraitBonus} CP.</p>
            ) : (
              <p className="muted">Base CP remaining <strong>{budget.baseCpLeft}</strong></p>
            )}
          </>
        ) : <p className="muted">Enter whole numbers to review the budget.</p>}
      </div>
      <p className="rules-note">
        Extra aptitude points cost 1 CP each. Each CP spent on skills buys {skillPointsPerCp} points you can split across skills.
      </p>
      <p className="rules-note">
        Adapted from <a href={coreAptitudeRules.coreBookUrl}>Eclipse Phase Second Edition, pp. 44 and 46</a> by{' '}
        <a href="https://eclipsephase.com/">Posthuman Studios, LLC</a> under{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.
      </p>
    </section>
  );
}
