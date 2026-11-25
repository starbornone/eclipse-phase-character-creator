import { useState } from 'react';
import type { AptitudeScores, Ego, SkillPointPurchase } from '../types/character.ts';
import { aptitudes } from '../types/character.ts';
import { evaluateAptitudeBudget } from '../rules/calculations/aptitude-budget.ts';
import { aptitudeTemplates, coreAptitudeRules } from '../rules/datasets/aptitude-templates.ts';
import { coreCustomizationRules } from '../rules/datasets/customization.ts';
import { startingReputationRules } from '../rules/datasets/reputation.ts';

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

export function AptitudeBudget({ scores, skillPurchases, egoFlex, languages, reputation, specializations, invalidReputation }:
  Pick<Ego, 'egoFlex' | 'languages' | 'reputation' | 'specializations'> & {
  scores?: AptitudeScores;
  skillPurchases: SkillPointPurchase[];
  invalidReputation: boolean;
}) {
  const budget = scores && !invalidReputation && evaluateAptitudeBudget(scores, skillPurchases, { egoFlex, languages, reputation, specializations });
  return (
    <section className="aptitude-budget" aria-labelledby="aptitude-budget-title">
      <h3 id="aptitude-budget-title">Customization Point budget</h3>
      <div role="status">
        {budget ? (
          <>
            <dl>
              <div><dt>CP for aptitudes</dt><dd>{budget.aptitudeCp}</dd></div>
              <div><dt>CP for skills</dt><dd>{budget.skillCp}</dd></div>
              <div><dt>CP for Flex</dt><dd>{budget.flexCp}</dd></div>
              <div><dt>CP for languages</dt><dd>{budget.languageCp}</dd></div>
              <div><dt>CP for reputation</dt><dd>{budget.reputationBudget.cp}</dd></div>
              <div><dt>CP for specializations</dt><dd>{budget.specializationCp}</dd></div>
              <div><dt>Total spent</dt><dd>{budget.totalCp} / {coreAptitudeRules.startingCp}</dd></div>
            </dl>
            <p className="muted">Aptitude points <strong>{budget.total} / {coreAptitudeRules.basePoints}</strong> across {budget.entered} / {aptitudes.length} scores</p>
            <p className="muted">
              Free languages <strong>{budget.freeLanguages}</strong>
              {budget.languageAptitudes === undefined ? ' · Enter Cognition and Intuition to check bonus languages.'
                : ` · Cognition + Intuition ${budget.languageAptitudes}`}
            </p>
            {budget.unspentPurchasedSkillPoints > 0 && (
              <p className="muted">Skill points available from CP already spent <strong>{budget.unspentPurchasedSkillPoints}</strong></p>
            )}
            <p className="muted">Reputation points <strong>{budget.reputationBudget.total}</strong> · {budget.reputationBudget.freeRemaining} of {startingReputationRules.freePoints} free points left</p>
            {budget.reputationBudget.purchasedRemaining > 0 && (
              <p className="muted">Reputation points available from CP already spent <strong>{budget.reputationBudget.purchasedRemaining}</strong></p>
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
        ) : <p className="muted">Enter valid aptitude and reputation scores to review the budget.</p>}
      </div>
      <p className="rules-note">
        Extra aptitude points cost 1 CP each. Each CP spent on skills buys {coreCustomizationRules.skillsPerCp} points you can split across skills.
      </p>
      <p className="rules-note">
        Adapted from <a href={coreAptitudeRules.coreBookUrl}>Eclipse Phase Second Edition, pp. 44–46</a> by{' '}
        <a href="https://eclipsephase.com/">Posthuman Studios, LLC</a> under{' '}
        <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>.
      </p>
    </section>
  );
}
